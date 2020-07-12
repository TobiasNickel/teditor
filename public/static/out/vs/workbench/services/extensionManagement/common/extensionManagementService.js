/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/nls", "vs/workbench/services/extensions/common/extensionsUtil", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/download/common/download"], function (require, exports, event_1, extensionManagement_1, extensionManagement_2, extensions_1, lifecycle_1, configuration_1, cancellation_1, extensionManagementUtil_1, nls_1, extensionsUtil_1, productService_1, network_1, download_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementService = void 0;
    let ExtensionManagementService = class ExtensionManagementService extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, extensionGalleryService, configurationService, productService, downloadService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.downloadService = downloadService;
            this.servers = [];
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                this.servers.push(this.extensionManagementServerService.webExtensionManagementServer);
            }
            this.onInstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onInstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onDidInstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onDidInstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onUninstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onUninstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onDidUninstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onDidUninstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
        }
        getInstalled(type) {
            const installedExtensions = [];
            return Promise.all(this.servers.map(({ extensionManagementService }) => extensionManagementService.getInstalled(type).then(extensions => installedExtensions.push(...extensions))))
                .then(_ => installedExtensions)
                .catch(e => installedExtensions);
        }
        async uninstall(extension) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            if (this.servers.length > 1) {
                if (extensions_1.isLanguagePackExtension(extension.manifest)) {
                    return this.uninstallEverywhere(extension);
                }
                return this.uninstallInServer(extension, server);
            }
            return server.extensionManagementService.uninstall(extension);
        }
        async uninstallEverywhere(extension) {
            const server = this.getServer(extension);
            if (!server) {
                return Promise.reject(`Invalid location ${extension.location.toString()}`);
            }
            const promise = server.extensionManagementService.uninstall(extension);
            const otherServers = this.servers.filter(s => s !== server);
            if (otherServers.length) {
                for (const otherServer of otherServers) {
                    const installed = await otherServer.extensionManagementService.getInstalled(1 /* User */);
                    extension = installed.filter(i => extensionManagementUtil_1.areSameExtensions(i.identifier, extension.identifier))[0];
                    if (extension) {
                        await otherServer.extensionManagementService.uninstall(extension);
                    }
                }
            }
            return promise;
        }
        async uninstallInServer(extension, server, force) {
            if (server === this.extensionManagementServerService.localExtensionManagementServer) {
                const installedExtensions = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getInstalled(1 /* User */);
                const dependentNonUIExtensions = installedExtensions.filter(i => !extensionsUtil_1.prefersExecuteOnUI(i.manifest, this.productService, this.configurationService)
                    && i.manifest.extensionDependencies && i.manifest.extensionDependencies.some(id => extensionManagementUtil_1.areSameExtensions({ id }, extension.identifier)));
                if (dependentNonUIExtensions.length) {
                    return Promise.reject(new Error(this.getDependentsErrorMessage(extension, dependentNonUIExtensions)));
                }
            }
            return server.extensionManagementService.uninstall(extension, force);
        }
        getDependentsErrorMessage(extension, dependents) {
            if (dependents.length === 1) {
                return nls_1.localize('singleDependentError', "Cannot uninstall extension '{0}'. Extension '{1}' depends on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return nls_1.localize('twoDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return nls_1.localize('multipleDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        reinstallFromGallery(extension) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.reinstallFromGallery(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        updateMetadata(extension, metadata) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.updateMetadata(extension, metadata);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        zip(extension) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.zip(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        unzip(zipLocation) {
            return Promise.all(this.servers
                // Filter out web server
                .filter(server => server !== this.extensionManagementServerService.webExtensionManagementServer)
                .map(({ extensionManagementService }) => extensionManagementService.unzip(zipLocation))).then(([extensionIdentifier]) => extensionIdentifier);
        }
        async install(vsix) {
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const manifest = await this.getManifest(vsix);
                if (extensions_1.isLanguagePackExtension(manifest)) {
                    // Install on both servers
                    const [local] = await Promise.all([this.extensionManagementServerService.localExtensionManagementServer, this.extensionManagementServerService.remoteExtensionManagementServer].map(server => this.installVSIX(vsix, server)));
                    return local;
                }
                if (extensionsUtil_1.prefersExecuteOnUI(manifest, this.productService, this.configurationService)) {
                    // Install only on local server
                    return this.installVSIX(vsix, this.extensionManagementServerService.localExtensionManagementServer);
                }
                // Install only on remote server
                return this.installVSIX(vsix, this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.installVSIX(vsix, this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.installVSIX(vsix, this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            return Promise.reject('No Servers to Install');
        }
        installVSIX(vsix, server) {
            return server.extensionManagementService.install(vsix);
        }
        getManifest(vsix) {
            if (vsix.scheme === network_1.Schemas.file && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            if (vsix.scheme === network_1.Schemas.vscodeRemote && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getManifest(vsix);
            }
            return Promise.reject('No Servers');
        }
        async installFromGallery(gallery) {
            // Only local server, install without any checks
            if (this.servers.length === 1 && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            const manifest = await this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None);
            if (!manifest) {
                return Promise.reject(nls_1.localize('Manifest is not found', "Installing Extension {0} failed: Manifest is not found.", gallery.displayName || gallery.name));
            }
            // Install Language pack on all servers
            if (extensions_1.isLanguagePackExtension(manifest)) {
                return Promise.all(this.servers.map(server => server.extensionManagementService.installFromGallery(gallery))).then(([local]) => local);
            }
            // 1. Install on preferred location
            // Install UI preferred extension on local server
            if (extensionsUtil_1.prefersExecuteOnUI(manifest, this.productService, this.configurationService) && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            // Install Workspace preferred extension on remote server
            if (extensionsUtil_1.prefersExecuteOnWorkspace(manifest, this.productService, this.configurationService) && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            // Install Web preferred extension on web server
            if (extensionsUtil_1.prefersExecuteOnWeb(manifest, this.productService, this.configurationService) && this.extensionManagementServerService.webExtensionManagementServer) {
                return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            // 2. Install on supported location
            // Install UI supported extension on local server
            if (extensionsUtil_1.canExecuteOnUI(manifest, this.productService, this.configurationService) && this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            // Install Workspace supported extension on remote server
            if (extensionsUtil_1.canExecuteOnWorkspace(manifest, this.productService, this.configurationService) && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            // Install Web supported extension on web server
            if (extensionsUtil_1.canExecuteOnWeb(manifest, this.productService, this.configurationService) && this.extensionManagementServerService.webExtensionManagementServer) {
                return this.extensionManagementServerService.webExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                const error = new Error(nls_1.localize('cannot be installed', "Cannot install '{0}' because this extension has defined that it cannot run on the remote server.", gallery.displayName || gallery.name));
                error.name = extensionManagement_1.INSTALL_ERROR_NOT_SUPPORTED;
                return Promise.reject(error);
            }
            const error = new Error(nls_1.localize('cannot be installed on web', "Cannot install '{0}' because this extension has defined that it cannot run on the web server.", gallery.displayName || gallery.name));
            error.name = extensionManagement_1.INSTALL_ERROR_NOT_SUPPORTED;
            return Promise.reject(error);
        }
        getExtensionsReport() {
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getExtensionsReport();
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                return this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getExtensionsReport();
            }
            return Promise.resolve([]);
        }
        getServer(extension) {
            return this.extensionManagementServerService.getExtensionManagementServer(extension);
        }
    };
    ExtensionManagementService = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, productService_1.IProductService),
        __param(4, download_1.IDownloadService)
    ], ExtensionManagementService);
    exports.ExtensionManagementService = ExtensionManagementService;
});
//# __sourceMappingURL=extensionManagementService.js.map