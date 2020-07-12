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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/base/common/async", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/base/common/path", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, extensionManagement_1, telemetry_1, extensionRecommendations_1, async_1, nls_1, instantiation_1, notification_1, path_1, configuration_1, storage_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExeBasedRecommendations = void 0;
    let ExeBasedRecommendations = class ExeBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(isExtensionAllowedToBeRecommended, extensionTipsService, extensionManagementService, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService);
            this.extensionTipsService = extensionTipsService;
            this.extensionManagementService = extensionManagementService;
            this._recommendations = [];
            /*
                3s has come out to be the good number to fetch and prompt important exe based recommendations
                Also fetch important exe based recommendations for reporting telemetry
            */
            async_1.timeout(3000).then(() => this.fetchAndPromptImportantExeBasedRecommendations());
        }
        get recommendations() { return this._recommendations; }
        async doActivate() {
            const otherExectuableBasedTips = await this.extensionTipsService.getOtherExecutableBasedTips();
            otherExectuableBasedTips.forEach(tip => this._recommendations.push(this.toExtensionRecommendation(tip)));
        }
        async fetchAndPromptImportantExeBasedRecommendations() {
            const importantExeBasedRecommendations = {};
            const importantExectuableBasedTips = await this.extensionTipsService.getImportantExecutableBasedTips();
            importantExectuableBasedTips.forEach(tip => {
                this._recommendations.push(this.toExtensionRecommendation(tip));
                importantExeBasedRecommendations[tip.extensionId.toLowerCase()] = tip;
            });
            const local = await this.extensionManagementService.getInstalled();
            const { installed, uninstalled } = this.groupByInstalled(Object.keys(importantExeBasedRecommendations), local);
            /* Log installed and uninstalled exe based recommendations */
            for (const extensionId of installed) {
                const tip = importantExeBasedRecommendations[extensionId];
                this.telemetryService.publicLog2('exeExtensionRecommendations:alreadyInstalled', { extensionId, exeName: path_1.basename(tip.windowsPath) });
            }
            for (const extensionId of uninstalled) {
                const tip = importantExeBasedRecommendations[extensionId];
                this.telemetryService.publicLog2('exeExtensionRecommendations:notInstalled', { extensionId, exeName: path_1.basename(tip.windowsPath) });
            }
            this.promptImportantExeBasedRecommendations(uninstalled, importantExeBasedRecommendations);
        }
        promptImportantExeBasedRecommendations(recommendations, importantExeBasedRecommendations) {
            if (this.hasToIgnoreRecommendationNotifications()) {
                return;
            }
            recommendations = this.filterIgnoredOrNotAllowed(recommendations);
            if (recommendations.length === 0) {
                return;
            }
            const extensionId = recommendations[0];
            const tip = importantExeBasedRecommendations[extensionId];
            const message = nls_1.localize('exeRecommended', "The '{0}' extension is recommended as you have {1} installed on your system.", tip.friendlyName, tip.exeFriendlyName || path_1.basename(tip.windowsPath));
            this.promptImportantExtensionInstallNotification(extensionId, message);
        }
        groupByInstalled(recommendationsToSuggest, local) {
            const installed = [], uninstalled = [];
            const installedExtensionsIds = local.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            recommendationsToSuggest.forEach(id => {
                if (installedExtensionsIds.has(id.toLowerCase())) {
                    installed.push(id);
                }
                else {
                    uninstalled.push(id);
                }
            });
            return { installed, uninstalled };
        }
        toExtensionRecommendation(tip) {
            return {
                extensionId: tip.extensionId.toLowerCase(),
                source: 'executable',
                reason: {
                    reasonId: 2 /* Executable */,
                    reasonText: nls_1.localize('exeBasedRecommendation', "This extension is recommended because you have {0} installed.", tip.friendlyName)
                }
            };
        }
    };
    ExeBasedRecommendations = __decorate([
        __param(1, extensionManagement_1.IExtensionTipsService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, notification_1.INotificationService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, storage_1.IStorageService),
        __param(8, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ExeBasedRecommendations);
    exports.ExeBasedRecommendations = ExeBasedRecommendations;
});
//# __sourceMappingURL=exeBasedRecommendations.js.map