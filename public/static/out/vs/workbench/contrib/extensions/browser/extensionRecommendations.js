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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, lifecycle_1, notification_1, telemetry_1, instantiation_1, nls_1, extensionsActions_1, extensions_1, configuration_1, storage_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendations = void 0;
    const ignoreImportantExtensionRecommendation = 'extensionsAssistant/importantRecommendationsIgnore';
    const choiceNever = nls_1.localize('neverShowAgain', "Don't Show Again");
    let ExtensionRecommendations = class ExtensionRecommendations extends lifecycle_1.Disposable {
        constructor(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super();
            this.isExtensionAllowedToBeRecommended = isExtensionAllowedToBeRecommended;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this._activationPromise = null;
            storageKeysSyncRegistryService.registerStorageKey({ key: ignoreImportantExtensionRecommendation, version: 1 });
        }
        get activated() { return this._activationPromise !== null; }
        activate() {
            if (!this._activationPromise) {
                this._activationPromise = this.doActivate();
            }
            return this._activationPromise;
        }
        promptImportantExtensionInstallNotification(extensionId, message) {
            this.notificationService.prompt(notification_1.Severity.Info, message, [{
                    label: nls_1.localize('install', 'Install'),
                    run: () => {
                        this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'install', extensionId });
                        this.instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, extensionId).run();
                    }
                }, {
                    label: nls_1.localize('showRecommendations', "Show Recommendations"),
                    run: () => {
                        this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'show', extensionId });
                        const recommendationsAction = this.instantiationService.createInstance(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, nls_1.localize('showRecommendations', "Show Recommendations"));
                        recommendationsAction.run();
                        recommendationsAction.dispose();
                    }
                }, {
                    label: choiceNever,
                    isSecondary: true,
                    run: () => {
                        this.addToImportantRecommendationsIgnore(extensionId);
                        this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'neverShowAgain', extensionId });
                        this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('ignoreExtensionRecommendations', "Do you want to ignore all extension recommendations?"), [{
                                label: nls_1.localize('ignoreAll', "Yes, Ignore All"),
                                run: () => this.setIgnoreRecommendationsConfig(true)
                            }, {
                                label: nls_1.localize('no', "No"),
                                run: () => this.setIgnoreRecommendationsConfig(false)
                            }]);
                    }
                }], {
                sticky: true,
                onCancel: () => {
                    this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'cancelled', extensionId });
                }
            });
        }
        hasToIgnoreRecommendationNotifications() {
            const config = this.configurationService.getValue(extensions_1.ConfigurationKey);
            return config.ignoreRecommendations || config.showRecommendationsOnlyOnDemand;
        }
        filterIgnoredOrNotAllowed(recommendationsToSuggest) {
            const importantRecommendationsIgnoreList = JSON.parse(this.storageService.get(ignoreImportantExtensionRecommendation, 0 /* GLOBAL */, '[]')).map(e => e.toLowerCase());
            return recommendationsToSuggest.filter(id => {
                if (importantRecommendationsIgnoreList.indexOf(id) !== -1) {
                    return false;
                }
                if (!this.isExtensionAllowedToBeRecommended(id)) {
                    return false;
                }
                return true;
            });
        }
        addToImportantRecommendationsIgnore(id) {
            const importantRecommendationsIgnoreList = JSON.parse(this.storageService.get(ignoreImportantExtensionRecommendation, 0 /* GLOBAL */, '[]'));
            importantRecommendationsIgnoreList.push(id.toLowerCase());
            this.storageService.store(ignoreImportantExtensionRecommendation, JSON.stringify(importantRecommendationsIgnoreList), 0 /* GLOBAL */);
        }
        setIgnoreRecommendationsConfig(configVal) {
            this.configurationService.updateValue('extensions.ignoreRecommendations', configVal, 1 /* USER */);
        }
    };
    ExtensionRecommendations = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, storage_1.IStorageService),
        __param(6, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ExtensionRecommendations);
    exports.ExtensionRecommendations = ExtensionRecommendations;
});
//# __sourceMappingURL=extensionRecommendations.js.map