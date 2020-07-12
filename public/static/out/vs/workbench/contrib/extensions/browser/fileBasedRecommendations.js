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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/cancellation", "vs/nls", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/base/common/collections", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/glob", "vs/base/common/uri", "vs/base/common/mime", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/viewlet/browser/viewlet", "vs/editor/common/services/modelService", "vs/platform/userDataSync/common/storageKeys", "vs/base/common/platform"], function (require, exports, extensionManagement_1, telemetry_1, extensionRecommendations_1, instantiation_1, notification_1, extensions_1, cancellation_1, nls_1, storage_1, configuration_1, productService_1, collections_1, network_1, resources_1, glob_1, uri_1, mime_1, extensions_2, viewlet_1, modelService_1, storageKeys_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileBasedRecommendations = void 0;
    const recommendationsStorageKey = 'extensionsAssistant/recommendations';
    const searchMarketplace = nls_1.localize('searchMarketplace', "Search Marketplace");
    const milliSecondsInADay = 1000 * 60 * 60 * 24;
    const processedFileExtensions = [];
    let FileBasedRecommendations = class FileBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(isExtensionAllowedToBeRecommended, extensionManagementService, extensionsWorkbenchService, extensionService, viewletService, modelService, productService, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService);
            this.extensionManagementService = extensionManagementService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.viewletService = viewletService;
            this.modelService = modelService;
            this.extensionTips = Object.create(null);
            this.importantExtensionTips = Object.create(null);
            this.fileBasedRecommendationsByPattern = Object.create(null);
            this.fileBasedRecommendations = Object.create(null);
            if (productService.extensionTips) {
                collections_1.forEach(productService.extensionTips, ({ key, value }) => this.extensionTips[key.toLowerCase()] = value);
            }
            if (productService.extensionImportantTips) {
                collections_1.forEach(productService.extensionImportantTips, ({ key, value }) => this.importantExtensionTips[key.toLowerCase()] = value);
            }
        }
        get recommendations() {
            const recommendations = [];
            Object.keys(this.fileBasedRecommendations)
                .sort((a, b) => {
                if (this.fileBasedRecommendations[a].recommendedTime === this.fileBasedRecommendations[b].recommendedTime) {
                    if (this.importantExtensionTips[a]) {
                        return -1;
                    }
                    if (this.importantExtensionTips[b]) {
                        return 1;
                    }
                }
                return this.fileBasedRecommendations[a].recommendedTime > this.fileBasedRecommendations[b].recommendedTime ? -1 : 1;
            })
                .forEach(extensionId => {
                for (const source of this.fileBasedRecommendations[extensionId].sources) {
                    recommendations.push({
                        extensionId,
                        source,
                        reason: {
                            reasonId: 1 /* File */,
                            reasonText: nls_1.localize('fileBasedRecommendation', "This extension is recommended based on the files you recently opened.")
                        }
                    });
                }
            });
            return recommendations;
        }
        async doActivate() {
            const allRecommendations = [];
            // group extension recommendations by pattern, like {**/*.md} -> [ext.foo1, ext.bar2]
            collections_1.forEach(this.extensionTips, ({ key: extensionId, value: pattern }) => {
                const ids = this.fileBasedRecommendationsByPattern[pattern] || [];
                ids.push(extensionId);
                this.fileBasedRecommendationsByPattern[pattern] = ids;
                allRecommendations.push(extensionId);
            });
            collections_1.forEach(this.importantExtensionTips, ({ key: extensionId, value }) => {
                const ids = this.fileBasedRecommendationsByPattern[value.pattern] || [];
                ids.push(extensionId);
                this.fileBasedRecommendationsByPattern[value.pattern] = ids;
                allRecommendations.push(extensionId);
            });
            const cachedRecommendations = this.getCachedRecommendations();
            const now = Date.now();
            // Retire existing recommendations if they are older than a week or are not part of this.productService.extensionTips anymore
            collections_1.forEach(cachedRecommendations, ({ key, value }) => {
                const diff = (now - value) / milliSecondsInADay;
                if (diff <= 7 && allRecommendations.indexOf(key) > -1) {
                    this.fileBasedRecommendations[key] = { recommendedTime: value, sources: ['cached'] };
                }
            });
            this._register(this.modelService.onModelAdded(this.promptRecommendationsForModel, this));
            this.modelService.getModels().forEach(model => this.promptRecommendationsForModel(model));
        }
        /**
         * Prompt the user to either install the recommended extension for the file type in the current editor model
         * or prompt to search the marketplace if it has extensions that can support the file type
         */
        promptRecommendationsForModel(model) {
            const uri = model.uri;
            const supportedSchemes = [network_1.Schemas.untitled, network_1.Schemas.file, network_1.Schemas.vscodeRemote];
            if (!uri || supportedSchemes.indexOf(uri.scheme) === -1) {
                return;
            }
            let fileExtension = resources_1.extname(uri);
            if (fileExtension) {
                if (processedFileExtensions.indexOf(fileExtension) > -1) {
                    return;
                }
                processedFileExtensions.push(fileExtension);
            }
            // re-schedule this bit of the operation to be off the critical path - in case glob-match is slow
            platform_1.setImmediate(() => this.promptRecommendations(uri, fileExtension));
        }
        async promptRecommendations(uri, fileExtension) {
            const recommendationsToPrompt = [];
            collections_1.forEach(this.fileBasedRecommendationsByPattern, ({ key: pattern, value: extensionIds }) => {
                if (glob_1.match(pattern, uri.toString())) {
                    for (const extensionId of extensionIds) {
                        // Add to recommendation to prompt if it is an important tip
                        if (this.importantExtensionTips[extensionId]) {
                            recommendationsToPrompt.push(extensionId);
                        }
                        // Update file based recommendations
                        const filedBasedRecommendation = this.fileBasedRecommendations[extensionId] || { recommendedTime: Date.now(), sources: [] };
                        filedBasedRecommendation.recommendedTime = Date.now();
                        if (!filedBasedRecommendation.sources.some(s => s instanceof uri_1.URI && s.toString() === uri.toString())) {
                            filedBasedRecommendation.sources.push(uri);
                        }
                        this.fileBasedRecommendations[extensionId.toLowerCase()] = filedBasedRecommendation;
                    }
                }
            });
            this.storeCachedRecommendations();
            if (this.hasToIgnoreRecommendationNotifications()) {
                return;
            }
            const installed = await this.extensionManagementService.getInstalled();
            if (await this.promptRecommendedExtensionForFileType(recommendationsToPrompt, installed)) {
                return;
            }
            if (fileExtension) {
                fileExtension = fileExtension.substr(1); // Strip the dot
            }
            if (!fileExtension) {
                return;
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            const mimeTypes = mime_1.guessMimeTypes(uri);
            if (mimeTypes.length !== 1 || mimeTypes[0] !== mime_1.MIME_UNKNOWN) {
                return;
            }
            this.promptRecommendedExtensionForFileExtension(fileExtension, installed);
        }
        async promptRecommendedExtensionForFileType(recommendations, installed) {
            recommendations = this.filterIgnoredOrNotAllowed(recommendations);
            if (recommendations.length === 0) {
                return false;
            }
            recommendations = this.filterInstalled(recommendations, installed);
            if (recommendations.length === 0) {
                return false;
            }
            const extensionId = recommendations[0];
            const entry = this.importantExtensionTips[extensionId];
            if (!entry) {
                return false;
            }
            const extensionName = entry.name;
            let message = nls_1.localize('reallyRecommended2', "The '{0}' extension is recommended for this file type.", extensionName);
            if (entry.isExtensionPack) {
                message = nls_1.localize('reallyRecommendedExtensionPack', "The '{0}' extension pack is recommended for this file type.", extensionName);
            }
            this.promptImportantExtensionInstallNotification(extensionId, message);
            return true;
        }
        async promptRecommendedExtensionForFileExtension(fileExtension, installed) {
            const fileExtensionSuggestionIgnoreList = JSON.parse(this.storageService.get('extensionsAssistant/fileExtensionsSuggestionIgnore', 0 /* GLOBAL */, '[]'));
            if (fileExtensionSuggestionIgnoreList.indexOf(fileExtension) > -1) {
                return;
            }
            const text = `ext:${fileExtension}`;
            const pager = await this.extensionsWorkbenchService.queryGallery({ text, pageSize: 100 }, cancellation_1.CancellationToken.None);
            if (pager.firstPage.length === 0) {
                return;
            }
            const installedExtensionsIds = installed.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            if (pager.firstPage.some(e => installedExtensionsIds.has(e.identifier.id.toLowerCase()))) {
                return;
            }
            this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('showLanguageExtensions', "The Marketplace has extensions that can help with '.{0}' files", fileExtension), [{
                    label: searchMarketplace,
                    run: () => {
                        this.telemetryService.publicLog2('fileExtensionSuggestion:popup', { userReaction: 'ok', fileExtension });
                        this.viewletService.openViewlet('workbench.view.extensions', true)
                            .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                            .then(viewlet => {
                            viewlet.search(`ext:${fileExtension}`);
                            viewlet.focus();
                        });
                    }
                }, {
                    label: nls_1.localize('dontShowAgainExtension', "Don't Show Again for '.{0}' files", fileExtension),
                    run: () => {
                        fileExtensionSuggestionIgnoreList.push(fileExtension);
                        this.storageService.store('extensionsAssistant/fileExtensionsSuggestionIgnore', JSON.stringify(fileExtensionSuggestionIgnoreList), 0 /* GLOBAL */);
                        this.telemetryService.publicLog2('fileExtensionSuggestion:popup', { userReaction: 'neverShowAgain', fileExtension });
                    }
                }], {
                sticky: true,
                onCancel: () => {
                    this.telemetryService.publicLog2('fileExtensionSuggestion:popup', { userReaction: 'cancelled', fileExtension });
                }
            });
        }
        filterInstalled(recommendationsToSuggest, installed) {
            const installedExtensionsIds = installed.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            return recommendationsToSuggest.filter(id => !installedExtensionsIds.has(id.toLowerCase()));
        }
        getCachedRecommendations() {
            let storedRecommendations = JSON.parse(this.storageService.get(recommendationsStorageKey, 0 /* GLOBAL */, '[]'));
            if (Array.isArray(storedRecommendations)) {
                storedRecommendations = storedRecommendations.reduce((result, id) => { result[id] = Date.now(); return result; }, {});
            }
            const result = {};
            collections_1.forEach(storedRecommendations, ({ key, value }) => {
                if (typeof value === 'number') {
                    result[key.toLowerCase()] = value;
                }
            });
            return result;
        }
        storeCachedRecommendations() {
            const storedRecommendations = {};
            collections_1.forEach(this.fileBasedRecommendations, ({ key, value }) => storedRecommendations[key] = value.recommendedTime);
            this.storageService.store(recommendationsStorageKey, JSON.stringify(storedRecommendations), 0 /* GLOBAL */);
        }
    };
    FileBasedRecommendations = __decorate([
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensions_2.IExtensionService),
        __param(4, viewlet_1.IViewletService),
        __param(5, modelService_1.IModelService),
        __param(6, productService_1.IProductService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, notification_1.INotificationService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, storage_1.IStorageService),
        __param(12, storageKeys_1.IStorageKeysSyncRegistryService)
    ], FileBasedRecommendations);
    exports.FileBasedRecommendations = FileBasedRecommendations;
});
//# __sourceMappingURL=fileBasedRecommendations.js.map