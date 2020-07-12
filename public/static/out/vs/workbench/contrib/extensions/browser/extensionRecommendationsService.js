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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/objects", "vs/platform/environment/common/environment", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/contrib/extensions/browser/dynamicWorkspaceRecommendations", "vs/workbench/contrib/extensions/browser/exeBasedRecommendations", "vs/workbench/contrib/extensions/browser/experimentalRecommendations", "vs/workbench/contrib/extensions/browser/workspaceRecommendations", "vs/workbench/contrib/extensions/browser/fileBasedRecommendations", "vs/workbench/contrib/extensions/browser/keymapRecommendations", "vs/platform/userDataSync/common/storageKeys", "vs/workbench/contrib/extensions/browser/configBasedRecommendations"], function (require, exports, lifecycle_1, extensionManagement_1, storage_1, instantiation_1, extensions_1, configuration_1, telemetry_1, arrays_1, event_1, objects_1, environment_1, lifecycle_2, dynamicWorkspaceRecommendations_1, exeBasedRecommendations_1, experimentalRecommendations_1, workspaceRecommendations_1, fileBasedRecommendations_1, keymapRecommendations_1, storageKeys_1, configBasedRecommendations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationsService = void 0;
    const ignoredRecommendationsStorageKey = 'extensionsAssistant/ignored_recommendations';
    let ExtensionRecommendationsService = class ExtensionRecommendationsService extends lifecycle_1.Disposable {
        constructor(instantiationService, lifecycleService, storageKeysSyncRegistryService, galleryService, storageService, configurationService, telemetryService, environmentService, extensionManagementService) {
            super();
            this.galleryService = galleryService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionManagementService = extensionManagementService;
            // Ignored Recommendations
            this.globallyIgnoredRecommendations = [];
            this._onRecommendationChange = this._register(new event_1.Emitter());
            this.onRecommendationChange = this._onRecommendationChange.event;
            storageKeysSyncRegistryService.registerStorageKey({ key: ignoredRecommendationsStorageKey, version: 1 });
            const isExtensionAllowedToBeRecommended = (extensionId) => this.isExtensionAllowedToBeRecommended(extensionId);
            this.workspaceRecommendations = instantiationService.createInstance(workspaceRecommendations_1.WorkspaceRecommendations, isExtensionAllowedToBeRecommended);
            this.fileBasedRecommendations = instantiationService.createInstance(fileBasedRecommendations_1.FileBasedRecommendations, isExtensionAllowedToBeRecommended);
            this.experimentalRecommendations = instantiationService.createInstance(experimentalRecommendations_1.ExperimentalRecommendations, isExtensionAllowedToBeRecommended);
            this.configBasedRecommendations = instantiationService.createInstance(configBasedRecommendations_1.ConfigBasedRecommendations, isExtensionAllowedToBeRecommended);
            this.exeBasedRecommendations = instantiationService.createInstance(exeBasedRecommendations_1.ExeBasedRecommendations, isExtensionAllowedToBeRecommended);
            this.dynamicWorkspaceRecommendations = instantiationService.createInstance(dynamicWorkspaceRecommendations_1.DynamicWorkspaceRecommendations, isExtensionAllowedToBeRecommended);
            this.keymapRecommendations = instantiationService.createInstance(keymapRecommendations_1.KeymapRecommendations, isExtensionAllowedToBeRecommended);
            if (!this.isEnabled()) {
                this.sessionSeed = 0;
                this.loadWorkspaceConfigPromise = Promise.resolve();
                return;
            }
            this.sessionSeed = +new Date();
            this.globallyIgnoredRecommendations = this.getCachedIgnoredRecommendations();
            // Activation
            this.loadWorkspaceConfigPromise = this.workspaceRecommendations.activate().then(() => this.fileBasedRecommendations.activate());
            this.experimentalRecommendations.activate();
            this.keymapRecommendations.activate();
            if (!this.configurationService.getValue(extensions_1.ShowRecommendationsOnlyOnDemandKey)) {
                lifecycleService.when(4 /* Eventually */).then(() => this.activateProactiveRecommendations());
            }
            this._register(this.extensionManagementService.onDidInstallExtension(e => this.onDidInstallExtension(e)));
            this._register(this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
        }
        isEnabled() {
            return this.galleryService.isEnabled() && !this.environmentService.extensionDevelopmentLocationURI;
        }
        async activateProactiveRecommendations() {
            await Promise.all([this.dynamicWorkspaceRecommendations.activate(), this.exeBasedRecommendations.activate(), this.configBasedRecommendations.activate()]);
        }
        getAllRecommendationsWithReason() {
            /* Activate proactive recommendations */
            this.activateProactiveRecommendations();
            const output = Object.create(null);
            const allRecommendations = [
                ...this.dynamicWorkspaceRecommendations.recommendations,
                ...this.configBasedRecommendations.recommendations,
                ...this.exeBasedRecommendations.recommendations,
                ...this.experimentalRecommendations.recommendations,
                ...this.fileBasedRecommendations.recommendations,
                ...this.workspaceRecommendations.recommendations,
                ...this.keymapRecommendations.recommendations,
            ];
            for (const { extensionId, reason } of allRecommendations) {
                if (this.isExtensionAllowedToBeRecommended(extensionId)) {
                    output[extensionId.toLowerCase()] = reason;
                }
            }
            return output;
        }
        async getConfigBasedRecommendations() {
            await this.configBasedRecommendations.activate();
            return this.toExtensionRecommendations(this.configBasedRecommendations.recommendations);
        }
        async getOtherRecommendations() {
            await this.activateProactiveRecommendations();
            const recommendations = [
                ...this.configBasedRecommendations.recommendations,
                ...this.exeBasedRecommendations.recommendations,
                ...this.dynamicWorkspaceRecommendations.recommendations,
                ...this.experimentalRecommendations.recommendations
            ];
            const extensionIds = arrays_1.distinct(recommendations.map(e => e.extensionId))
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
            arrays_1.shuffle(extensionIds, this.sessionSeed);
            return extensionIds.map(extensionId => {
                const sources = arrays_1.distinct(recommendations.filter(r => r.extensionId === extensionId).map(r => r.source));
                return { extensionId, sources };
            });
        }
        getKeymapRecommendations() {
            return this.toExtensionRecommendations(this.keymapRecommendations.recommendations);
        }
        async getWorkspaceRecommendations() {
            if (!this.isEnabled()) {
                return [];
            }
            await this.workspaceRecommendations.activate();
            return this.toExtensionRecommendations(this.workspaceRecommendations.recommendations);
        }
        getFileBasedRecommendations() {
            return this.toExtensionRecommendations(this.fileBasedRecommendations.recommendations);
        }
        getIgnoredRecommendations() {
            return this.globallyIgnoredRecommendations;
        }
        toggleIgnoredRecommendation(extensionId, shouldIgnore) {
            extensionId = extensionId.toLowerCase();
            const ignored = this.globallyIgnoredRecommendations.indexOf(extensionId) !== -1;
            if (ignored === shouldIgnore) {
                return;
            }
            if (shouldIgnore) {
                const reason = this.getAllRecommendationsWithReason()[extensionId];
                if (reason && reason.reasonId) {
                    this.telemetryService.publicLog2('extensionsRecommendations:ignoreRecommendation', { extensionId, recommendationReason: reason.reasonId });
                }
            }
            this.globallyIgnoredRecommendations = shouldIgnore ? [...this.globallyIgnoredRecommendations, extensionId] : this.globallyIgnoredRecommendations.filter(id => id !== extensionId);
            this.storeCachedIgnoredRecommendations(this.globallyIgnoredRecommendations);
            this._onRecommendationChange.fire({ extensionId, isRecommended: !shouldIgnore });
        }
        onDidInstallExtension(e) {
            if (e.gallery && e.operation === 1 /* Install */) {
                const extRecommendations = this.getAllRecommendationsWithReason() || {};
                const recommendationReason = extRecommendations[e.gallery.identifier.id.toLowerCase()];
                if (recommendationReason) {
                    /* __GDPR__
                        "extensionGallery:install:recommendations" : {
                            "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "${include}": [
                                "${GalleryExtensionTelemetryData}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog('extensionGallery:install:recommendations', objects_1.assign(e.gallery.telemetryData, { recommendationReason: recommendationReason.reasonId }));
                }
            }
        }
        toExtensionRecommendations(recommendations) {
            const extensionIds = arrays_1.distinct(recommendations.map(e => e.extensionId))
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
            return extensionIds.map(extensionId => {
                const sources = arrays_1.distinct(recommendations.filter(r => r.extensionId === extensionId).map(r => r.source));
                return { extensionId, sources };
            });
        }
        isExtensionAllowedToBeRecommended(id) {
            const allIgnoredRecommendations = [
                ...this.globallyIgnoredRecommendations,
                ...this.workspaceRecommendations.ignoredRecommendations
            ];
            return allIgnoredRecommendations.indexOf(id.toLowerCase()) === -1;
        }
        onDidStorageChange(e) {
            if (e.key === ignoredRecommendationsStorageKey && e.scope === 0 /* GLOBAL */
                && this.ignoredRecommendationsValue !== this.getStoredIgnoredRecommendationsValue() /* This checks if current window changed the value or not */) {
                this._ignoredRecommendationsValue = undefined;
                this.globallyIgnoredRecommendations = this.getCachedIgnoredRecommendations();
            }
        }
        getCachedIgnoredRecommendations() {
            const ignoredRecommendations = JSON.parse(this.ignoredRecommendationsValue);
            return ignoredRecommendations.map(e => e.toLowerCase());
        }
        storeCachedIgnoredRecommendations(ignoredRecommendations) {
            this.ignoredRecommendationsValue = JSON.stringify(ignoredRecommendations);
        }
        get ignoredRecommendationsValue() {
            if (!this._ignoredRecommendationsValue) {
                this._ignoredRecommendationsValue = this.getStoredIgnoredRecommendationsValue();
            }
            return this._ignoredRecommendationsValue;
        }
        set ignoredRecommendationsValue(ignoredRecommendationsValue) {
            if (this.ignoredRecommendationsValue !== ignoredRecommendationsValue) {
                this._ignoredRecommendationsValue = ignoredRecommendationsValue;
                this.setStoredIgnoredRecommendationsValue(ignoredRecommendationsValue);
            }
        }
        getStoredIgnoredRecommendationsValue() {
            return this.storageService.get(ignoredRecommendationsStorageKey, 0 /* GLOBAL */, '[]');
        }
        setStoredIgnoredRecommendationsValue(value) {
            this.storageService.store(ignoredRecommendationsStorageKey, value, 0 /* GLOBAL */);
        }
    };
    ExtensionRecommendationsService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, storageKeys_1.IStorageKeysSyncRegistryService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, environment_1.IEnvironmentService),
        __param(8, extensionManagement_1.IExtensionManagementService)
    ], ExtensionRecommendationsService);
    exports.ExtensionRecommendationsService = ExtensionRecommendationsService;
});
//# __sourceMappingURL=extensionRecommendationsService.js.map