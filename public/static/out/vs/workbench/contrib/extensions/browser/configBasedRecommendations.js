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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/base/common/map"], function (require, exports, extensionManagement_1, telemetry_1, extensionRecommendations_1, nls_1, instantiation_1, notification_1, configuration_1, storage_1, storageKeys_1, workspace_1, arrays_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigBasedRecommendations = void 0;
    let ConfigBasedRecommendations = class ConfigBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(isExtensionAllowedToBeRecommended, extensionTipsService, extensionManagementService, workspaceContextService, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService);
            this.extensionTipsService = extensionTipsService;
            this.extensionManagementService = extensionManagementService;
            this.workspaceContextService = workspaceContextService;
            this.importantTips = [];
            this.otherTips = [];
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        async doActivate() {
            await this.fetch();
            this._register(this.workspaceContextService.onDidChangeWorkspaceFolders(e => this.onWorkspaceFoldersChanged(e)));
            this.promptWorkspaceRecommendations();
        }
        async fetch() {
            const workspace = this.workspaceContextService.getWorkspace();
            const importantTips = new Map();
            const otherTips = new Map();
            for (const folder of workspace.folders) {
                const configBasedTips = await this.extensionTipsService.getConfigBasedTips(folder.uri);
                for (const tip of configBasedTips) {
                    if (tip.important) {
                        importantTips.set(tip.extensionId, tip);
                    }
                    else {
                        otherTips.set(tip.extensionId, tip);
                    }
                }
            }
            this.importantTips = map_1.values(importantTips);
            this.otherTips = map_1.values(otherTips).filter(tip => !importantTips.has(tip.extensionId));
            this._recommendations = [...this.importantTips, ...this.otherTips].map(tip => this.toExtensionRecommendation(tip));
        }
        async promptWorkspaceRecommendations() {
            if (this.hasToIgnoreRecommendationNotifications()) {
                return;
            }
            if (this.importantTips.length === 0) {
                return;
            }
            const local = await this.extensionManagementService.getInstalled();
            const { uninstalled } = this.groupByInstalled(arrays_1.distinct(this.importantTips.map(({ extensionId }) => extensionId)), local);
            if (uninstalled.length === 0) {
                return;
            }
            const importantExtensions = this.filterIgnoredOrNotAllowed(uninstalled);
            if (importantExtensions.length === 0) {
                return;
            }
            for (const extension of importantExtensions) {
                const tip = this.importantTips.filter(tip => tip.extensionId === extension)[0];
                const message = tip.isExtensionPack ? nls_1.localize('extensionPackRecommended', "The '{0}' extension pack is recommended for this workspace.", tip.extensionName)
                    : nls_1.localize('extensionRecommended', "The '{0}' extension is recommended for this workspace.", tip.extensionName);
                this.promptImportantExtensionInstallNotification(extension, message);
            }
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
        async onWorkspaceFoldersChanged(event) {
            if (event.added.length) {
                const oldImportantRecommended = this.importantTips;
                await this.fetch();
                // Suggest only if at least one of the newly added recommendations was not suggested before
                if (this.importantTips.some(current => oldImportantRecommended.every(old => current.extensionId !== old.extensionId))) {
                    return this.promptWorkspaceRecommendations();
                }
            }
        }
        toExtensionRecommendation(tip) {
            return {
                extensionId: tip.extensionId,
                source: 'config',
                reason: {
                    reasonId: 3 /* WorkspaceConfig */,
                    reasonText: nls_1.localize('exeBasedRecommendation', "This extension is recommended because of the current workspace configuration")
                }
            };
        }
    };
    ConfigBasedRecommendations = __decorate([
        __param(1, extensionManagement_1.IExtensionTipsService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, notification_1.INotificationService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, storage_1.IStorageService),
        __param(9, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ConfigBasedRecommendations);
    exports.ConfigBasedRecommendations = ConfigBasedRecommendations;
});
//# __sourceMappingURL=configBasedRecommendations.js.map