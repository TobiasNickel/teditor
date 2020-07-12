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
define(["require", "exports", "vs/nls", "semver-umd", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/paging", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/workbench/services/host/browser/host", "vs/base/common/uri", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/platform/url/common/url", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/platform/extensions/common/extensions", "vs/editor/common/services/modeService", "vs/platform/product/common/productService", "vs/base/browser/dom", "vs/platform/userDataSync/common/extensionsMerge", "vs/base/common/platform"], function (require, exports, nls, semver, event_1, arrays_1, async_1, errors_1, lifecycle_1, paging_1, telemetry_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, instantiation_1, configuration_1, host_1, uri_1, extensions_1, editorService_1, url_1, extensionsInput_1, log_1, progress_1, notification_1, resources, cancellation_1, storage_1, files_1, extensions_2, modeService_1, productService_1, dom_1, extensionsMerge_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsWorkbenchService = void 0;
    let Extension = class Extension {
        constructor(stateProvider, server, local, gallery, galleryService, telemetryService, logService, fileService, productService) {
            this.stateProvider = stateProvider;
            this.server = server;
            this.local = local;
            this.gallery = gallery;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.fileService = fileService;
            this.productService = productService;
            this.enablementState = 4 /* EnabledGlobally */;
            this.isMalicious = false;
        }
        get type() {
            return this.local ? this.local.type : 1 /* User */;
        }
        get name() {
            return this.gallery ? this.gallery.name : this.local.manifest.name;
        }
        get displayName() {
            if (this.gallery) {
                return this.gallery.displayName || this.gallery.name;
            }
            return this.local.manifest.displayName || this.local.manifest.name;
        }
        get identifier() {
            if (this.gallery) {
                return this.gallery.identifier;
            }
            return this.local.identifier;
        }
        get uuid() {
            return this.gallery ? this.gallery.identifier.uuid : this.local.identifier.uuid;
        }
        get publisher() {
            return this.gallery ? this.gallery.publisher : this.local.manifest.publisher;
        }
        get publisherDisplayName() {
            var _a;
            if (this.gallery) {
                return this.gallery.publisherDisplayName || this.gallery.publisher;
            }
            if ((_a = this.local) === null || _a === void 0 ? void 0 : _a.publisherDisplayName) {
                return this.local.publisherDisplayName;
            }
            return this.local.manifest.publisher;
        }
        get version() {
            return this.local ? this.local.manifest.version : this.latestVersion;
        }
        get latestVersion() {
            return this.gallery ? this.gallery.version : this.local.manifest.version;
        }
        get description() {
            return this.gallery ? this.gallery.description : this.local.manifest.description || '';
        }
        get url() {
            if (!this.productService.extensionsGallery || !this.gallery) {
                return undefined;
            }
            return `${this.productService.extensionsGallery.itemUrl}?itemName=${this.publisher}.${this.name}`;
        }
        get iconUrl() {
            return this.galleryIconUrl || this.localIconUrl || this.defaultIconUrl;
        }
        get iconUrlFallback() {
            return this.galleryIconUrlFallback || this.localIconUrl || this.defaultIconUrl;
        }
        get localIconUrl() {
            if (this.local && this.local.manifest.icon) {
                return dom_1.asDomUri(resources.joinPath(this.local.location, this.local.manifest.icon)).toString(true);
            }
            return null;
        }
        get galleryIconUrl() {
            return this.gallery ? this.gallery.assets.icon.uri : null;
        }
        get galleryIconUrlFallback() {
            return this.gallery ? this.gallery.assets.icon.fallbackUri : null;
        }
        get defaultIconUrl() {
            if (this.type === 0 /* System */ && this.local) {
                if (this.local.manifest && this.local.manifest.contributes) {
                    if (Array.isArray(this.local.manifest.contributes.themes) && this.local.manifest.contributes.themes.length) {
                        return require.toUrl('./media/theme-icon.png');
                    }
                    if (Array.isArray(this.local.manifest.contributes.grammars) && this.local.manifest.contributes.grammars.length) {
                        return require.toUrl('./media/language-icon.svg');
                    }
                }
            }
            return extensionManagement_1.DefaultIconPath;
        }
        get repository() {
            return this.gallery && this.gallery.assets.repository ? this.gallery.assets.repository.uri : undefined;
        }
        get licenseUrl() {
            return this.gallery && this.gallery.assets.license ? this.gallery.assets.license.uri : undefined;
        }
        get state() {
            return this.stateProvider(this);
        }
        get installCount() {
            return this.gallery ? this.gallery.installCount : undefined;
        }
        get rating() {
            return this.gallery ? this.gallery.rating : undefined;
        }
        get ratingCount() {
            return this.gallery ? this.gallery.ratingCount : undefined;
        }
        get outdated() {
            return !!this.gallery && this.type === 1 /* User */ && semver.gt(this.latestVersion, this.version);
        }
        get telemetryData() {
            const { local, gallery } = this;
            if (gallery) {
                return extensionManagementUtil_1.getGalleryExtensionTelemetryData(gallery);
            }
            else {
                return extensionManagementUtil_1.getLocalExtensionTelemetryData(local);
            }
        }
        get preview() {
            return this.gallery ? this.gallery.preview : false;
        }
        isGalleryOutdated() {
            return this.local && this.gallery ? semver.gt(this.local.manifest.version, this.gallery.version) : false;
        }
        getManifest(token) {
            if (this.gallery && !this.isGalleryOutdated()) {
                if (this.gallery.assets.manifest) {
                    return this.galleryService.getManifest(this.gallery, token);
                }
                this.logService.error(nls.localize('Manifest is not found', "Manifest is not found"), this.identifier.id);
                return Promise.resolve(null);
            }
            return Promise.resolve(this.local.manifest);
        }
        hasReadme() {
            if (this.gallery && !this.isGalleryOutdated() && this.gallery.assets.readme) {
                return true;
            }
            if (this.local && this.local.readmeUrl) {
                return true;
            }
            return this.type === 0 /* System */;
        }
        getReadme(token) {
            if (this.gallery && !this.isGalleryOutdated()) {
                if (this.gallery.assets.readme) {
                    return this.galleryService.getReadme(this.gallery, token);
                }
                this.telemetryService.publicLog('extensions:NotFoundReadMe', this.telemetryData);
            }
            if (this.local && this.local.readmeUrl) {
                return this.fileService.readFile(this.local.readmeUrl).then(content => content.value.toString());
            }
            if (this.type === 0 /* System */) {
                return Promise.resolve(`# ${this.displayName || this.name}
**Notice:** This extension is bundled with Visual Studio Code. It can be disabled but not uninstalled.
## Features
${this.description}
`);
            }
            return Promise.reject(new Error('not available'));
        }
        hasChangelog() {
            if (this.gallery && this.gallery.assets.changelog && !this.isGalleryOutdated()) {
                return true;
            }
            if (this.local && this.local.changelogUrl) {
                return true;
            }
            return this.type === 0 /* System */;
        }
        getChangelog(token) {
            if (this.gallery && this.gallery.assets.changelog && !this.isGalleryOutdated()) {
                return this.galleryService.getChangelog(this.gallery, token);
            }
            const changelogUrl = this.local && this.local.changelogUrl;
            if (!changelogUrl) {
                if (this.type === 0 /* System */) {
                    return Promise.resolve('Please check the [VS Code Release Notes](command:update.showCurrentReleaseNotes) for changes to the built-in extensions.');
                }
                return Promise.reject(new Error('not available'));
            }
            return this.fileService.readFile(changelogUrl).then(content => content.value.toString());
        }
        get dependencies() {
            const { local, gallery } = this;
            if (gallery && !this.isGalleryOutdated()) {
                return gallery.properties.dependencies || [];
            }
            if (local && local.manifest.extensionDependencies) {
                return local.manifest.extensionDependencies;
            }
            return [];
        }
        get extensionPack() {
            const { local, gallery } = this;
            if (gallery && !this.isGalleryOutdated()) {
                return gallery.properties.extensionPack || [];
            }
            if (local && local.manifest.extensionPack) {
                return local.manifest.extensionPack;
            }
            return [];
        }
    };
    Extension = __decorate([
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, log_1.ILogService),
        __param(7, files_1.IFileService),
        __param(8, productService_1.IProductService)
    ], Extension);
    let Extensions = class Extensions extends lifecycle_1.Disposable {
        constructor(server, stateProvider, galleryService, extensionEnablementService, instantiationService) {
            super();
            this.server = server;
            this.stateProvider = stateProvider;
            this.galleryService = galleryService;
            this.extensionEnablementService = extensionEnablementService;
            this.instantiationService = instantiationService;
            this._onChange = this._register(new event_1.Emitter());
            this.installing = [];
            this.uninstalling = [];
            this.installed = [];
            this._register(server.extensionManagementService.onInstallExtension(e => this.onInstallExtension(e)));
            this._register(server.extensionManagementService.onDidInstallExtension(e => this.onDidInstallExtension(e)));
            this._register(server.extensionManagementService.onUninstallExtension(e => this.onUninstallExtension(e)));
            this._register(server.extensionManagementService.onDidUninstallExtension(e => this.onDidUninstallExtension(e)));
            this._register(extensionEnablementService.onEnablementChanged(e => this.onEnablementChanged(e)));
        }
        get onChange() { return this._onChange.event; }
        get local() {
            const installing = this.installing
                .filter(e => !this.installed.some(installed => extensionManagementUtil_1.areSameExtensions(installed.identifier, e.identifier)))
                .map(e => e);
            return [...this.installed, ...installing];
        }
        async queryInstalled() {
            const all = await this.server.extensionManagementService.getInstalled();
            // dedup user and system extensions by giving priority to user extensions.
            const installed = extensionManagementUtil_1.groupByExtension(all, r => r.identifier).reduce((result, extensions) => {
                const extension = extensions.length === 1 ? extensions[0]
                    : extensions.find(e => e.type === 1 /* User */) || extensions.find(e => e.type === 0 /* System */);
                result.push(extension);
                return result;
            }, []);
            const byId = arrays_1.index(this.installed, e => e.local ? e.local.identifier.id : e.identifier.id);
            this.installed = installed.map(local => {
                const extension = byId[local.identifier.id] || this.instantiationService.createInstance(Extension, this.stateProvider, this.server, local, undefined);
                extension.local = local;
                extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                return extension;
            });
            this._onChange.fire(undefined);
            return this.local;
        }
        async syncLocalWithGalleryExtension(gallery, maliciousExtensionSet) {
            const extension = this.getInstalledExtensionMatchingGallery(gallery);
            if (!extension) {
                return false;
            }
            if (maliciousExtensionSet.has(extension.identifier.id)) {
                extension.isMalicious = true;
            }
            // Loading the compatible version only there is an engine property
            // Otherwise falling back to old way so that we will not make many roundtrips
            const compatible = gallery.properties.engine ? await this.galleryService.getCompatibleExtension(gallery) : gallery;
            if (!compatible) {
                return false;
            }
            // Sync the local extension with gallery extension if local extension doesnot has metadata
            if (extension.local) {
                const local = extension.local.identifier.uuid ? extension.local : await this.server.extensionManagementService.updateMetadata(extension.local, { id: compatible.identifier.uuid, publisherDisplayName: compatible.publisherDisplayName, publisherId: compatible.publisherId });
                extension.local = local;
                extension.gallery = compatible;
                this._onChange.fire({ extension });
                return true;
            }
            return false;
        }
        getInstalledExtensionMatchingGallery(gallery) {
            for (const installed of this.installed) {
                if (installed.uuid) { // Installed from Gallery
                    if (installed.uuid === gallery.identifier.uuid) {
                        return installed;
                    }
                }
                else {
                    if (extensionManagementUtil_1.areSameExtensions(installed.identifier, gallery.identifier)) { // Installed from other sources
                        return installed;
                    }
                }
            }
            return null;
        }
        onInstallExtension(event) {
            const { gallery } = event;
            if (gallery) {
                const extension = this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, gallery.identifier))[0]
                    || this.instantiationService.createInstance(Extension, this.stateProvider, this.server, undefined, gallery);
                this.installing.push(extension);
                this._onChange.fire({ extension });
            }
        }
        onDidInstallExtension(event) {
            const { local, zipPath, error, gallery } = event;
            const installingExtension = gallery ? this.installing.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, gallery.identifier))[0] : null;
            this.installing = installingExtension ? this.installing.filter(e => e !== installingExtension) : this.installing;
            let extension = installingExtension ? installingExtension
                : (zipPath || local) ? this.instantiationService.createInstance(Extension, this.stateProvider, this.server, local, undefined)
                    : undefined;
            if (extension) {
                if (local) {
                    const installed = this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
                    if (installed) {
                        extension = installed;
                    }
                    else {
                        this.installed.push(extension);
                    }
                    extension.local = local;
                    if (!extension.gallery) {
                        extension.gallery = gallery;
                    }
                    extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                }
            }
            this._onChange.fire(error || !extension ? undefined : { extension, operation: event.operation });
        }
        onUninstallExtension(identifier) {
            const extension = this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))[0];
            if (extension) {
                const uninstalling = this.uninstalling.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))[0] || extension;
                this.uninstalling = [uninstalling, ...this.uninstalling.filter(e => !extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))];
                this._onChange.fire(uninstalling ? { extension: uninstalling } : undefined);
            }
        }
        onDidUninstallExtension({ identifier, error }) {
            if (!error) {
                this.installed = this.installed.filter(e => !extensionManagementUtil_1.areSameExtensions(e.identifier, identifier));
            }
            const uninstalling = this.uninstalling.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))[0];
            this.uninstalling = this.uninstalling.filter(e => !extensionManagementUtil_1.areSameExtensions(e.identifier, identifier));
            if (uninstalling) {
                this._onChange.fire({ extension: uninstalling });
            }
        }
        onEnablementChanged(platformExtensions) {
            const extensions = this.local.filter(e => platformExtensions.some(p => extensionManagementUtil_1.areSameExtensions(e.identifier, p.identifier)));
            for (const extension of extensions) {
                if (extension.local) {
                    const enablementState = this.extensionEnablementService.getEnablementState(extension.local);
                    if (enablementState !== extension.enablementState) {
                        extension.enablementState = enablementState;
                        this._onChange.fire({ extension: extension });
                    }
                }
            }
        }
        getExtensionState(extension) {
            if (extension.gallery && this.installing.some(e => !!e.gallery && extensionManagementUtil_1.areSameExtensions(e.gallery.identifier, extension.gallery.identifier))) {
                return 0 /* Installing */;
            }
            if (this.uninstalling.some(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))) {
                return 2 /* Uninstalling */;
            }
            const local = this.installed.filter(e => e === extension || (e.gallery && extension.gallery && extensionManagementUtil_1.areSameExtensions(e.gallery.identifier, extension.gallery.identifier)))[0];
            return local ? 1 /* Installed */ : 3 /* Uninstalled */;
        }
    };
    Extensions = __decorate([
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, instantiation_1.IInstantiationService)
    ], Extensions);
    let ExtensionsWorkbenchService = class ExtensionsWorkbenchService extends lifecycle_1.Disposable {
        constructor(instantiationService, editorService, extensionService, galleryService, configurationService, telemetryService, notificationService, urlService, extensionEnablementService, hostService, progressService, extensionManagementServerService, storageService, modeService, productService) {
            super();
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.extensionService = extensionService;
            this.galleryService = galleryService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.extensionEnablementService = extensionEnablementService;
            this.hostService = hostService;
            this.progressService = progressService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.storageService = storageService;
            this.modeService = modeService;
            this.productService = productService;
            this.localExtensions = null;
            this.remoteExtensions = null;
            this.webExtensions = null;
            this._onChange = new event_1.Emitter();
            this.installing = [];
            this._activityCallBack = null;
            if (extensionManagementServerService.localExtensionManagementServer) {
                this.localExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.localExtensionManagementServer, ext => this.getExtensionState(ext)));
                this._register(this.localExtensions.onChange(e => this._onChange.fire(e ? e.extension : undefined)));
            }
            if (extensionManagementServerService.remoteExtensionManagementServer) {
                this.remoteExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.remoteExtensionManagementServer, ext => this.getExtensionState(ext)));
                this._register(this.remoteExtensions.onChange(e => this._onChange.fire(e ? e.extension : undefined)));
            }
            if (extensionManagementServerService.webExtensionManagementServer) {
                this.webExtensions = this._register(instantiationService.createInstance(Extensions, extensionManagementServerService.webExtensionManagementServer, ext => this.getExtensionState(ext)));
                this._register(this.webExtensions.onChange(e => this._onChange.fire(e ? e.extension : undefined)));
            }
            this.syncDelayer = new async_1.ThrottledDelayer(ExtensionsWorkbenchService.SyncPeriod);
            this.autoUpdateDelayer = new async_1.ThrottledDelayer(1000);
            urlService.registerHandler(this);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_1.AutoUpdateConfigurationKey)) {
                    if (this.isAutoUpdateEnabled()) {
                        this.checkForUpdates();
                    }
                }
                if (e.affectsConfiguration(extensions_1.AutoCheckUpdatesConfigurationKey)) {
                    if (this.isAutoCheckUpdatesEnabled()) {
                        this.checkForUpdates();
                    }
                }
            }, this));
            this.queryLocal().then(() => {
                this.resetIgnoreAutoUpdateExtensions();
                this.eventuallySyncWithGallery(true);
            });
            this._register(this.onChange(() => this.updateActivity()));
        }
        get onChange() { return this._onChange.event; }
        get local() {
            const byId = extensionManagementUtil_1.groupByExtension(this.installed, r => r.identifier);
            return byId.reduce((result, extensions) => { result.push(this.getPrimaryExtension(extensions)); return result; }, []);
        }
        get installed() {
            const result = [];
            if (this.localExtensions) {
                result.push(...this.localExtensions.local);
            }
            if (this.remoteExtensions) {
                result.push(...this.remoteExtensions.local);
            }
            if (this.webExtensions) {
                result.push(...this.webExtensions.local);
            }
            return result;
        }
        get outdated() {
            const allLocal = [];
            if (this.localExtensions) {
                allLocal.push(...this.localExtensions.local);
            }
            if (this.remoteExtensions) {
                allLocal.push(...this.remoteExtensions.local);
            }
            if (this.webExtensions) {
                allLocal.push(...this.webExtensions.local);
            }
            return allLocal.filter(e => e.outdated && e.local && e.state === 1 /* Installed */);
        }
        async queryLocal(server) {
            if (server) {
                if (this.localExtensions && this.extensionManagementServerService.localExtensionManagementServer === server) {
                    return this.localExtensions.queryInstalled();
                }
                if (this.remoteExtensions && this.extensionManagementServerService.remoteExtensionManagementServer === server) {
                    return this.remoteExtensions.queryInstalled();
                }
                if (this.webExtensions && this.extensionManagementServerService.webExtensionManagementServer === server) {
                    return this.webExtensions.queryInstalled();
                }
            }
            if (this.localExtensions) {
                await this.localExtensions.queryInstalled();
            }
            if (this.remoteExtensions) {
                await this.remoteExtensions.queryInstalled();
            }
            if (this.webExtensions) {
                await this.webExtensions.queryInstalled();
            }
            return this.local;
        }
        queryGallery(arg1, arg2) {
            const options = cancellation_1.CancellationToken.isCancellationToken(arg1) ? {} : arg1;
            const token = cancellation_1.CancellationToken.isCancellationToken(arg1) ? arg1 : arg2;
            options.text = options.text ? this.resolveQueryText(options.text) : options.text;
            return this.extensionService.getExtensionsReport()
                .then(report => {
                const maliciousSet = extensionManagementUtil_1.getMaliciousExtensionsSet(report);
                return this.galleryService.query(options, token)
                    .then(result => paging_1.mapPager(result, gallery => this.fromGallery(gallery, maliciousSet)))
                    .then(undefined, err => {
                    if (/No extension gallery service configured/.test(err.message)) {
                        return Promise.resolve(paging_1.singlePagePager([]));
                    }
                    return Promise.reject(err);
                });
            });
        }
        resolveQueryText(text) {
            const extensionRegex = /\bext:([^\s]+)\b/g;
            if (extensionRegex.test(text)) {
                text = text.replace(extensionRegex, (m, ext) => {
                    // Get curated keywords
                    const lookup = this.productService.extensionKeywords || {};
                    const keywords = lookup[ext] || [];
                    // Get mode name
                    const modeId = this.modeService.getModeIdByFilepathOrFirstLine(uri_1.URI.file(`.${ext}`));
                    const languageName = modeId && this.modeService.getLanguageName(modeId);
                    const languageTag = languageName ? ` tag:"${languageName}"` : '';
                    // Construct a rich query
                    return `tag:"__ext_${ext}" tag:"__ext_.${ext}" ${keywords.map(tag => `tag:"${tag}"`).join(' ')}${languageTag} tag:"${ext}"`;
                });
            }
            return text.substr(0, 350);
        }
        open(extension, { sideByside, preserveFocus, pinned } = { sideByside: false, preserveFocus: false, pinned: false }) {
            return Promise.resolve(this.editorService.openEditor(this.instantiationService.createInstance(extensionsInput_1.ExtensionsInput, extension), { preserveFocus, pinned }, sideByside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP));
        }
        getPrimaryExtension(extensions) {
            if (extensions.length === 1) {
                return extensions[0];
            }
            const enabledExtensions = extensions.filter(e => e.local && this.extensionEnablementService.isEnabled(e.local));
            if (enabledExtensions.length === 1) {
                return enabledExtensions[0];
            }
            return enabledExtensions.find(e => e.server === this.extensionManagementServerService.remoteExtensionManagementServer) || enabledExtensions[0];
        }
        fromGallery(gallery, maliciousExtensionSet) {
            Promise.all([
                this.localExtensions ? this.localExtensions.syncLocalWithGalleryExtension(gallery, maliciousExtensionSet) : Promise.resolve(false),
                this.remoteExtensions ? this.remoteExtensions.syncLocalWithGalleryExtension(gallery, maliciousExtensionSet) : Promise.resolve(false),
                this.webExtensions ? this.webExtensions.syncLocalWithGalleryExtension(gallery, maliciousExtensionSet) : Promise.resolve(false)
            ])
                .then(result => {
                if (result[0] || result[1]) {
                    this.eventuallyAutoUpdateExtensions();
                }
            });
            const installed = this.getInstalledExtensionMatchingGallery(gallery);
            if (installed) {
                return installed;
            }
            const extension = this.instantiationService.createInstance(Extension, ext => this.getExtensionState(ext), undefined, undefined, gallery);
            if (maliciousExtensionSet.has(extension.identifier.id)) {
                extension.isMalicious = true;
            }
            return extension;
        }
        getInstalledExtensionMatchingGallery(gallery) {
            for (const installed of this.local) {
                if (installed.identifier.uuid) { // Installed from Gallery
                    if (installed.identifier.uuid === gallery.identifier.uuid) {
                        return installed;
                    }
                }
                else {
                    if (extensionManagementUtil_1.areSameExtensions(installed.identifier, gallery.identifier)) { // Installed from other sources
                        return installed;
                    }
                }
            }
            return null;
        }
        getExtensionState(extension) {
            const isInstalling = this.installing.some(i => extensionManagementUtil_1.areSameExtensions(i.identifier, extension.identifier));
            if (extension.server) {
                const state = (extension.server === this.extensionManagementServerService.localExtensionManagementServer
                    ? this.localExtensions : extension.server === this.extensionManagementServerService.remoteExtensionManagementServer ? this.remoteExtensions : this.webExtensions).getExtensionState(extension);
                return state === 3 /* Uninstalled */ && isInstalling ? 0 /* Installing */ : state;
            }
            else if (isInstalling) {
                return 0 /* Installing */;
            }
            if (this.remoteExtensions) {
                const state = this.remoteExtensions.getExtensionState(extension);
                if (state !== 3 /* Uninstalled */) {
                    return state;
                }
            }
            if (this.webExtensions) {
                const state = this.webExtensions.getExtensionState(extension);
                if (state !== 3 /* Uninstalled */) {
                    return state;
                }
            }
            if (this.localExtensions) {
                return this.localExtensions.getExtensionState(extension);
            }
            return 3 /* Uninstalled */;
        }
        checkForUpdates() {
            return Promise.resolve(this.syncDelayer.trigger(() => this.syncWithGallery(), 0));
        }
        isAutoUpdateEnabled() {
            return this.configurationService.getValue(extensions_1.AutoUpdateConfigurationKey);
        }
        isAutoCheckUpdatesEnabled() {
            return this.configurationService.getValue(extensions_1.AutoCheckUpdatesConfigurationKey);
        }
        eventuallySyncWithGallery(immediate = false) {
            const shouldSync = this.isAutoUpdateEnabled() || this.isAutoCheckUpdatesEnabled();
            const loop = () => (shouldSync ? this.syncWithGallery() : Promise.resolve(undefined)).then(() => this.eventuallySyncWithGallery());
            const delay = immediate ? 0 : ExtensionsWorkbenchService.SyncPeriod;
            this.syncDelayer.trigger(loop, delay)
                .then(undefined, err => null);
        }
        syncWithGallery() {
            const ids = [], names = [];
            for (const installed of this.local) {
                if (installed.type === 1 /* User */) {
                    if (installed.identifier.uuid) {
                        ids.push(installed.identifier.uuid);
                    }
                    else {
                        names.push(installed.identifier.id);
                    }
                }
            }
            const promises = [];
            if (ids.length) {
                promises.push(this.queryGallery({ ids, pageSize: ids.length }, cancellation_1.CancellationToken.None));
            }
            if (names.length) {
                promises.push(this.queryGallery({ names, pageSize: names.length }, cancellation_1.CancellationToken.None));
            }
            return Promise.all(promises).then(() => undefined);
        }
        eventuallyAutoUpdateExtensions() {
            this.autoUpdateDelayer.trigger(() => this.autoUpdateExtensions())
                .then(undefined, err => null);
        }
        autoUpdateExtensions() {
            if (!this.isAutoUpdateEnabled()) {
                return Promise.resolve();
            }
            const toUpdate = this.outdated.filter(e => !this.isAutoUpdateIgnored(new extensionManagementUtil_1.ExtensionIdentifierWithVersion(e.identifier, e.version)));
            return Promise.all(toUpdate.map(e => this.install(e)));
        }
        canInstall(extension) {
            if (!(extension instanceof Extension)) {
                return false;
            }
            if (extension.isMalicious) {
                return false;
            }
            if (!extension.gallery) {
                return false;
            }
            if (this.extensionManagementServerService.localExtensionManagementServer
                || this.extensionManagementServerService.remoteExtensionManagementServer
                || this.extensionManagementServerService.webExtensionManagementServer) {
                return true;
            }
            return false;
        }
        install(extension) {
            if (extension instanceof uri_1.URI) {
                return this.installWithProgress(() => this.installFromVSIX(extension));
            }
            if (extension.isMalicious) {
                return Promise.reject(new Error(nls.localize('malicious', "This extension is reported to be problematic.")));
            }
            const gallery = extension.gallery;
            if (!gallery) {
                return Promise.reject(new Error('Missing gallery'));
            }
            return this.installWithProgress(() => this.installFromGallery(extension, gallery), gallery.displayName);
        }
        setEnablement(extensions, enablementState) {
            extensions = Array.isArray(extensions) ? extensions : [extensions];
            return this.promptAndSetEnablement(extensions, enablementState);
        }
        uninstall(extension) {
            const ext = extension.local ? extension : this.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
            const toUninstall = ext && ext.local ? ext.local : null;
            if (!toUninstall) {
                return Promise.reject(new Error('Missing local'));
            }
            return this.progressService.withProgress({
                location: 5 /* Extensions */,
                title: nls.localize('uninstallingExtension', 'Uninstalling extension....'),
                source: `${toUninstall.identifier.id}`
            }, () => this.extensionService.uninstall(toUninstall).then(() => undefined));
        }
        installVersion(extension, version) {
            if (!(extension instanceof Extension)) {
                return Promise.resolve(extension);
            }
            if (!extension.gallery) {
                return Promise.reject(new Error('Missing gallery'));
            }
            return this.galleryService.getCompatibleExtension(extension.gallery.identifier, version)
                .then(gallery => {
                if (!gallery) {
                    return Promise.reject(new Error(nls.localize('incompatible', "Unable to install extension '{0}' as it is not compatible with VS Code '{1}'.", extension.gallery.identifier.id, version)));
                }
                return this.installWithProgress(async () => {
                    const installed = await this.installFromGallery(extension, gallery);
                    if (extension.latestVersion !== version) {
                        this.ignoreAutoUpdate(new extensionManagementUtil_1.ExtensionIdentifierWithVersion(gallery.identifier, version));
                    }
                    return installed;
                }, gallery.displayName);
            });
        }
        reinstall(extension) {
            const ext = extension.local ? extension : this.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
            const toReinstall = ext && ext.local ? ext.local : null;
            if (!toReinstall) {
                return Promise.reject(new Error('Missing local'));
            }
            return this.progressService.withProgress({
                location: 5 /* Extensions */,
                source: `${toReinstall.identifier.id}`
            }, () => this.extensionService.reinstallFromGallery(toReinstall).then(() => this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, extension.identifier))[0]));
        }
        isExtensionIgnoredToSync(extension) {
            const localExtensions = (!platform_1.isWeb && this.localExtensions ? this.localExtensions.local : this.local)
                .filter(l => !!l.local)
                .map(l => l.local);
            const ignoredExtensions = extensionsMerge_1.getIgnoredExtensions(localExtensions, this.configurationService);
            return ignoredExtensions.includes(extension.identifier.id.toLowerCase());
        }
        toggleExtensionIgnoredToSync(extension) {
            var _a;
            const isIgnored = this.isExtensionIgnoredToSync(extension);
            const isDefaultIgnored = (_a = extension.local) === null || _a === void 0 ? void 0 : _a.isMachineScoped;
            const id = extension.identifier.id.toLowerCase();
            // first remove the extension completely from ignored extensions
            let currentValue = [...this.configurationService.getValue('sync.ignoredExtensions')].map(id => id.toLowerCase());
            currentValue = currentValue.filter(v => v !== id && v !== `-${id}`);
            // If ignored, then add only if it is ignored by default
            if (isIgnored && isDefaultIgnored) {
                currentValue.push(`-${id}`);
            }
            // If asked not to sync, then add only if it is not ignored by default
            if (!isIgnored && !isDefaultIgnored) {
                currentValue.push(id);
            }
            return this.configurationService.updateValue('sync.ignoredExtensions', currentValue.length ? currentValue : undefined, 1 /* USER */);
        }
        installWithProgress(installTask, extensionName) {
            const title = extensionName ? nls.localize('installing named extension', "Installing '{0}' extension....", extensionName) : nls.localize('installing extension', 'Installing extension....');
            return this.progressService.withProgress({
                location: 5 /* Extensions */,
                title
            }, () => installTask());
        }
        async installFromVSIX(vsix) {
            const manifest = await this.extensionService.getManifest(vsix);
            const existingExtension = this.local.find(local => extensionManagementUtil_1.areSameExtensions(local.identifier, { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name) }));
            const { identifier } = await this.extensionService.install(vsix);
            if (existingExtension && existingExtension.latestVersion !== manifest.version) {
                this.ignoreAutoUpdate(new extensionManagementUtil_1.ExtensionIdentifierWithVersion(identifier, manifest.version));
            }
            return this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, identifier))[0];
        }
        async installFromGallery(extension, gallery) {
            this.installing.push(extension);
            this._onChange.fire(extension);
            try {
                const extensionService = extension.server && extension.local && !extensions_2.isLanguagePackExtension(extension.local.manifest) ? extension.server.extensionManagementService : this.extensionService;
                await extensionService.installFromGallery(gallery);
                const ids = extension.identifier.uuid ? [extension.identifier.uuid] : undefined;
                const names = extension.identifier.uuid ? undefined : [extension.identifier.id];
                this.queryGallery({ names, ids, pageSize: 1 }, cancellation_1.CancellationToken.None);
                return this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, gallery.identifier))[0];
            }
            finally {
                this.installing = this.installing.filter(e => e !== extension);
                this._onChange.fire(this.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0]);
            }
        }
        promptAndSetEnablement(extensions, enablementState) {
            const enable = enablementState === 4 /* EnabledGlobally */ || enablementState === 5 /* EnabledWorkspace */;
            if (enable) {
                const allDependenciesAndPackedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: true, pack: true });
                return this.checkAndSetEnablement(extensions, allDependenciesAndPackedExtensions, enablementState);
            }
            else {
                const packedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: false, pack: true });
                if (packedExtensions.length) {
                    return this.checkAndSetEnablement(extensions, packedExtensions, enablementState);
                }
                return this.checkAndSetEnablement(extensions, [], enablementState);
            }
        }
        checkAndSetEnablement(extensions, otherExtensions, enablementState) {
            const allExtensions = [...extensions, ...otherExtensions];
            const enable = enablementState === 4 /* EnabledGlobally */ || enablementState === 5 /* EnabledWorkspace */;
            if (!enable) {
                for (const extension of extensions) {
                    let dependents = this.getDependentsAfterDisablement(extension, allExtensions, this.local);
                    if (dependents.length) {
                        return Promise.reject(new Error(this.getDependentsErrorMessage(extension, allExtensions, dependents)));
                    }
                }
            }
            return this.doSetEnablement(allExtensions, enablementState);
        }
        getExtensionsRecursively(extensions, installed, enablementState, options, checked = []) {
            const toCheck = extensions.filter(e => checked.indexOf(e) === -1);
            if (toCheck.length) {
                for (const extension of toCheck) {
                    checked.push(extension);
                }
                const extensionsToDisable = installed.filter(i => {
                    if (checked.indexOf(i) !== -1) {
                        return false;
                    }
                    if (i.enablementState === enablementState) {
                        return false;
                    }
                    const enable = enablementState === 4 /* EnabledGlobally */ || enablementState === 5 /* EnabledWorkspace */;
                    return (enable || i.type === 1 /* User */) // Include all Extensions for enablement and only user extensions for disablement
                        && (options.dependencies || options.pack)
                        && extensions.some(extension => (options.dependencies && extension.dependencies.some(id => extensionManagementUtil_1.areSameExtensions({ id }, i.identifier)))
                            || (options.pack && extension.extensionPack.some(id => extensionManagementUtil_1.areSameExtensions({ id }, i.identifier))));
                });
                if (extensionsToDisable.length) {
                    extensionsToDisable.push(...this.getExtensionsRecursively(extensionsToDisable, installed, enablementState, options, checked));
                }
                return extensionsToDisable;
            }
            return [];
        }
        getDependentsAfterDisablement(extension, extensionsToDisable, installed) {
            return installed.filter(i => {
                if (i.dependencies.length === 0) {
                    return false;
                }
                if (i === extension) {
                    return false;
                }
                if (!(i.enablementState === 5 /* EnabledWorkspace */ || i.enablementState === 4 /* EnabledGlobally */)) {
                    return false;
                }
                if (extensionsToDisable.indexOf(i) !== -1) {
                    return false;
                }
                return i.dependencies.some(dep => [extension, ...extensionsToDisable].some(d => extensionManagementUtil_1.areSameExtensions(d.identifier, { id: dep })));
            });
        }
        getDependentsErrorMessage(extension, allDisabledExtensions, dependents) {
            for (const e of [extension, ...allDisabledExtensions]) {
                let dependentsOfTheExtension = dependents.filter(d => d.dependencies.some(id => extensionManagementUtil_1.areSameExtensions({ id }, e.identifier)));
                if (dependentsOfTheExtension.length) {
                    return this.getErrorMessageForDisablingAnExtensionWithDependents(e, dependentsOfTheExtension);
                }
            }
            return '';
        }
        getErrorMessageForDisablingAnExtensionWithDependents(extension, dependents) {
            if (dependents.length === 1) {
                return nls.localize('singleDependentError', "Cannot disable extension '{0}'. Extension '{1}' depends on this.", extension.displayName, dependents[0].displayName);
            }
            if (dependents.length === 2) {
                return nls.localize('twoDependentsError', "Cannot disable extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.displayName, dependents[0].displayName, dependents[1].displayName);
            }
            return nls.localize('multipleDependentsError', "Cannot disable extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.displayName, dependents[0].displayName, dependents[1].displayName);
        }
        async doSetEnablement(extensions, enablementState) {
            const changed = await this.extensionEnablementService.setEnablement(extensions.map(e => e.local), enablementState);
            for (let i = 0; i < changed.length; i++) {
                if (changed[i]) {
                    /* __GDPR__
                    "extension:enable" : {
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                    */
                    /* __GDPR__
                    "extension:disable" : {
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                    */
                    this.telemetryService.publicLog(enablementState === 4 /* EnabledGlobally */ || enablementState === 5 /* EnabledWorkspace */ ? 'extension:enable' : 'extension:disable', extensions[i].telemetryData);
                }
            }
            return changed;
        }
        updateActivity() {
            if ((this.localExtensions && this.localExtensions.local.some(e => e.state === 0 /* Installing */ || e.state === 2 /* Uninstalling */))
                || (this.remoteExtensions && this.remoteExtensions.local.some(e => e.state === 0 /* Installing */ || e.state === 2 /* Uninstalling */))
                || (this.webExtensions && this.webExtensions.local.some(e => e.state === 0 /* Installing */ || e.state === 2 /* Uninstalling */))) {
                if (!this._activityCallBack) {
                    this.progressService.withProgress({ location: 5 /* Extensions */ }, () => new Promise(c => this._activityCallBack = c));
                }
            }
            else {
                if (this._activityCallBack) {
                    this._activityCallBack();
                }
                this._activityCallBack = null;
            }
        }
        onError(err) {
            if (errors_1.isPromiseCanceledError(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/getaddrinfo ENOTFOUND|getaddrinfo ENOENT|connect EACCES|connect ECONNREFUSED/.test(message)) {
                return;
            }
            this.notificationService.error(err);
        }
        handleURL(uri, options) {
            if (!/^extension/.test(uri.path)) {
                return Promise.resolve(false);
            }
            this.onOpenExtensionUrl(uri);
            return Promise.resolve(true);
        }
        onOpenExtensionUrl(uri) {
            const match = /^extension\/([^/]+)$/.exec(uri.path);
            if (!match) {
                return;
            }
            const extensionId = match[1];
            this.queryLocal().then(local => {
                const extension = local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, { id: extensionId }))[0];
                if (extension) {
                    return this.hostService.focus()
                        .then(() => this.open(extension));
                }
                return this.queryGallery({ names: [extensionId], source: 'uri' }, cancellation_1.CancellationToken.None).then(result => {
                    if (result.total < 1) {
                        return Promise.resolve(null);
                    }
                    const extension = result.firstPage[0];
                    return this.hostService.focus().then(() => {
                        return this.open(extension);
                    });
                });
            }).then(undefined, error => this.onError(error));
        }
        get ignoredAutoUpdateExtensions() {
            if (!this._ignoredAutoUpdateExtensions) {
                this._ignoredAutoUpdateExtensions = JSON.parse(this.storageService.get('extensions.ignoredAutoUpdateExtension', 0 /* GLOBAL */, '[]') || '[]');
            }
            return this._ignoredAutoUpdateExtensions;
        }
        set ignoredAutoUpdateExtensions(extensionIds) {
            this._ignoredAutoUpdateExtensions = arrays_1.distinct(extensionIds.map(id => id.toLowerCase()));
            this.storageService.store('extensions.ignoredAutoUpdateExtension', JSON.stringify(this._ignoredAutoUpdateExtensions), 0 /* GLOBAL */);
        }
        ignoreAutoUpdate(identifierWithVersion) {
            if (!this.isAutoUpdateIgnored(identifierWithVersion)) {
                this.ignoredAutoUpdateExtensions = [...this.ignoredAutoUpdateExtensions, identifierWithVersion.key()];
            }
        }
        isAutoUpdateIgnored(identifierWithVersion) {
            return this.ignoredAutoUpdateExtensions.indexOf(identifierWithVersion.key()) !== -1;
        }
        resetIgnoreAutoUpdateExtensions() {
            this.ignoredAutoUpdateExtensions = this.ignoredAutoUpdateExtensions.filter(extensionId => this.local.some(local => !!local.local && new extensionManagementUtil_1.ExtensionIdentifierWithVersion(local.identifier, local.version).key() === extensionId));
        }
        dispose() {
            super.dispose();
            this.syncDelayer.cancel();
        }
    };
    ExtensionsWorkbenchService.SyncPeriod = 1000 * 60 * 60 * 12; // 12 hours
    ExtensionsWorkbenchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorService_1.IEditorService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, notification_1.INotificationService),
        __param(7, url_1.IURLService),
        __param(8, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(9, host_1.IHostService),
        __param(10, progress_1.IProgressService),
        __param(11, extensionManagement_2.IExtensionManagementServerService),
        __param(12, storage_1.IStorageService),
        __param(13, modeService_1.IModeService),
        __param(14, productService_1.IProductService)
    ], ExtensionsWorkbenchService);
    exports.ExtensionsWorkbenchService = ExtensionsWorkbenchService;
});
//# __sourceMappingURL=extensionsWorkbenchService.js.map