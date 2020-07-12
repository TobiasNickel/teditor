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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/extensionsUtil", "vs/platform/instantiation/common/extensions", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/extensionEnablementService"], function (require, exports, nls_1, event_1, lifecycle_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, workspace_1, storage_1, environmentService_1, configuration_1, extensionsUtil_1, extensions_1, productService_1, extensionEnablementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEnablementService = void 0;
    const SOURCE = 'IWorkbenchExtensionEnablementService';
    let ExtensionEnablementService = class ExtensionEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, globalExtensionEnablementService, contextService, environmentService, extensionManagementService, configurationService, extensionManagementServerService, productService) {
            super();
            this.globalExtensionEnablementService = globalExtensionEnablementService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.extensionManagementService = extensionManagementService;
            this.configurationService = configurationService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.productService = productService;
            this._onEnablementChanged = new event_1.Emitter();
            this.onEnablementChanged = this._onEnablementChanged.event;
            this.storageManger = this._register(new extensionEnablementService_1.StorageManager(storageService));
            this._register(this.globalExtensionEnablementService.onDidChangeEnablement(({ extensions, source }) => this.onDidChangeExtensions(extensions, source)));
            this._register(extensionManagementService.onDidUninstallExtension(this._onDidUninstallExtension, this));
        }
        get hasWorkspace() {
            return this.contextService.getWorkbenchState() !== 1 /* EMPTY */;
        }
        get allUserExtensionsDisabled() {
            return this.environmentService.disableExtensions === true;
        }
        getEnablementState(extension) {
            if (this._isDisabledInEnv(extension)) {
                return 1 /* DisabledByEnvironemt */;
            }
            if (this._isDisabledByExtensionKind(extension)) {
                return 0 /* DisabledByExtensionKind */;
            }
            return this._getEnablementState(extension.identifier);
        }
        canChangeEnablement(extension) {
            if (extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                return false;
            }
            const enablementState = this.getEnablementState(extension);
            if (enablementState === 1 /* DisabledByEnvironemt */ || enablementState === 0 /* DisabledByExtensionKind */) {
                return false;
            }
            return true;
        }
        async setEnablement(extensions, newState) {
            const workspace = newState === 3 /* DisabledWorkspace */ || newState === 5 /* EnabledWorkspace */;
            if (workspace && !this.hasWorkspace) {
                return Promise.reject(new Error(nls_1.localize('noWorkspace', "No workspace.")));
            }
            const result = await Promise.all(extensions.map(e => this._setEnablement(e, newState)));
            const changedExtensions = extensions.filter((e, index) => result[index]);
            if (changedExtensions.length) {
                this._onEnablementChanged.fire(changedExtensions);
            }
            return result;
        }
        _setEnablement(extension, newState) {
            const currentState = this._getEnablementState(extension.identifier);
            if (currentState === newState) {
                return Promise.resolve(false);
            }
            switch (newState) {
                case 4 /* EnabledGlobally */:
                    this._enableExtension(extension.identifier);
                    break;
                case 2 /* DisabledGlobally */:
                    this._disableExtension(extension.identifier);
                    break;
                case 5 /* EnabledWorkspace */:
                    this._enableExtensionInWorkspace(extension.identifier);
                    break;
                case 3 /* DisabledWorkspace */:
                    this._disableExtensionInWorkspace(extension.identifier);
                    break;
            }
            return Promise.resolve(true);
        }
        isEnabled(extension) {
            const enablementState = this.getEnablementState(extension);
            return enablementState === 5 /* EnabledWorkspace */ || enablementState === 4 /* EnabledGlobally */;
        }
        isDisabledGlobally(extension) {
            return this._isDisabledGlobally(extension.identifier);
        }
        _isDisabledInEnv(extension) {
            if (this.allUserExtensionsDisabled) {
                return extension.type === 1 /* User */;
            }
            const disabledExtensions = this.environmentService.disableExtensions;
            if (Array.isArray(disabledExtensions)) {
                return disabledExtensions.some(id => extensionManagementUtil_1.areSameExtensions({ id }, extension.identifier));
            }
            return false;
        }
        _isDisabledByExtensionKind(extension) {
            if (this.extensionManagementServerService.remoteExtensionManagementServer || this.extensionManagementServerService.webExtensionManagementServer) {
                const server = this.extensionManagementServerService.getExtensionManagementServer(extension);
                for (const extensionKind of extensionsUtil_1.getExtensionKind(extension.manifest, this.productService, this.configurationService)) {
                    if (extensionKind === 'ui') {
                        if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.localExtensionManagementServer === server) {
                            return false;
                        }
                    }
                    if (extensionKind === 'workspace') {
                        if (server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                            return false;
                        }
                    }
                    if (extensionKind === 'web') {
                        // Web extensions are not yet supported to be disabled by kind. Enable them always on web.
                        if (this.extensionManagementServerService.localExtensionManagementServer === null) {
                            return false;
                        }
                    }
                }
                return true;
            }
            return false;
        }
        _getEnablementState(identifier) {
            if (this.hasWorkspace) {
                if (this._getWorkspaceEnabledExtensions().filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                    return 5 /* EnabledWorkspace */;
                }
                if (this._getWorkspaceDisabledExtensions().filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                    return 3 /* DisabledWorkspace */;
                }
            }
            if (this._isDisabledGlobally(identifier)) {
                return 2 /* DisabledGlobally */;
            }
            return 4 /* EnabledGlobally */;
        }
        _isDisabledGlobally(identifier) {
            return this.globalExtensionEnablementService.getDisabledExtensions().some(e => extensionManagementUtil_1.areSameExtensions(e, identifier));
        }
        _enableExtension(identifier) {
            this._removeFromWorkspaceDisabledExtensions(identifier);
            this._removeFromWorkspaceEnabledExtensions(identifier);
            return this.globalExtensionEnablementService.enableExtension(identifier, SOURCE);
        }
        _disableExtension(identifier) {
            this._removeFromWorkspaceDisabledExtensions(identifier);
            this._removeFromWorkspaceEnabledExtensions(identifier);
            return this.globalExtensionEnablementService.disableExtension(identifier, SOURCE);
        }
        _enableExtensionInWorkspace(identifier) {
            this._removeFromWorkspaceDisabledExtensions(identifier);
            this._addToWorkspaceEnabledExtensions(identifier);
        }
        _disableExtensionInWorkspace(identifier) {
            this._addToWorkspaceDisabledExtensions(identifier);
            this._removeFromWorkspaceEnabledExtensions(identifier);
        }
        _addToWorkspaceDisabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return Promise.resolve(false);
            }
            let disabledExtensions = this._getWorkspaceDisabledExtensions();
            if (disabledExtensions.every(e => !extensionManagementUtil_1.areSameExtensions(e, identifier))) {
                disabledExtensions.push(identifier);
                this._setDisabledExtensions(disabledExtensions);
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }
        async _removeFromWorkspaceDisabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return false;
            }
            let disabledExtensions = this._getWorkspaceDisabledExtensions();
            for (let index = 0; index < disabledExtensions.length; index++) {
                const disabledExtension = disabledExtensions[index];
                if (extensionManagementUtil_1.areSameExtensions(disabledExtension, identifier)) {
                    disabledExtensions.splice(index, 1);
                    this._setDisabledExtensions(disabledExtensions);
                    return true;
                }
            }
            return false;
        }
        _addToWorkspaceEnabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return false;
            }
            let enabledExtensions = this._getWorkspaceEnabledExtensions();
            if (enabledExtensions.every(e => !extensionManagementUtil_1.areSameExtensions(e, identifier))) {
                enabledExtensions.push(identifier);
                this._setEnabledExtensions(enabledExtensions);
                return true;
            }
            return false;
        }
        _removeFromWorkspaceEnabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return false;
            }
            let enabledExtensions = this._getWorkspaceEnabledExtensions();
            for (let index = 0; index < enabledExtensions.length; index++) {
                const disabledExtension = enabledExtensions[index];
                if (extensionManagementUtil_1.areSameExtensions(disabledExtension, identifier)) {
                    enabledExtensions.splice(index, 1);
                    this._setEnabledExtensions(enabledExtensions);
                    return true;
                }
            }
            return false;
        }
        _getWorkspaceEnabledExtensions() {
            return this._getExtensions(extensionManagement_1.ENABLED_EXTENSIONS_STORAGE_PATH);
        }
        _setEnabledExtensions(enabledExtensions) {
            this._setExtensions(extensionManagement_1.ENABLED_EXTENSIONS_STORAGE_PATH, enabledExtensions);
        }
        _getWorkspaceDisabledExtensions() {
            return this._getExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH);
        }
        _setDisabledExtensions(disabledExtensions) {
            this._setExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH, disabledExtensions);
        }
        _getExtensions(storageId) {
            if (!this.hasWorkspace) {
                return [];
            }
            return this.storageManger.get(storageId, 1 /* WORKSPACE */);
        }
        _setExtensions(storageId, extensions) {
            this.storageManger.set(storageId, extensions, 1 /* WORKSPACE */);
        }
        async onDidChangeExtensions(extensionIdentifiers, source) {
            if (source !== SOURCE) {
                const installedExtensions = await this.extensionManagementService.getInstalled();
                const extensions = installedExtensions.filter(installedExtension => extensionIdentifiers.some(identifier => extensionManagementUtil_1.areSameExtensions(identifier, installedExtension.identifier)));
                this._onEnablementChanged.fire(extensions);
            }
        }
        _onDidUninstallExtension({ identifier, error }) {
            if (!error) {
                this._reset(identifier);
            }
        }
        _reset(extension) {
            this._removeFromWorkspaceDisabledExtensions(extension);
            this._removeFromWorkspaceEnabledExtensions(extension);
            this.globalExtensionEnablementService.enableExtension(extension);
        }
    };
    ExtensionEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, extensionManagement_2.IExtensionManagementServerService),
        __param(7, productService_1.IProductService)
    ], ExtensionEnablementService);
    exports.ExtensionEnablementService = ExtensionEnablementService;
    extensions_1.registerSingleton(extensionManagement_2.IWorkbenchExtensionEnablementService, ExtensionEnablementService, true);
});
//# __sourceMappingURL=extensionEnablementService.js.map