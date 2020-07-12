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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/json", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/nls", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, extensionManagement_1, workspace_1, files_1, telemetry_1, arrays_1, extensionRecommendations_1, instantiation_1, notification_1, extensionManagement_2, json_1, extensions_1, log_1, cancellation_1, nls_1, extensionManagementUtil_1, extensionsActions_1, storage_1, configuration_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceRecommendations = void 0;
    const choiceNever = nls_1.localize('neverShowAgain', "Don't Show Again");
    const ignoreWorkspaceRecommendationsStorageKey = 'extensionsAssistant/workspaceRecommendationsIgnore';
    let WorkspaceRecommendations = class WorkspaceRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(isExtensionAllowedToBeRecommended, contextService, galleryService, logService, fileService, extensionManagementService, extensionEnablementService, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService);
            this.contextService = contextService;
            this.galleryService = galleryService;
            this.logService = logService;
            this.fileService = fileService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this._recommendations = [];
            this._ignoredRecommendations = [];
        }
        get recommendations() { return this._recommendations; }
        get ignoredRecommendations() { return this._ignoredRecommendations; }
        async doActivate() {
            await this.fetch();
            this._register(this.contextService.onDidChangeWorkspaceFolders(e => this.onWorkspaceFoldersChanged(e)));
            this.promptWorkspaceRecommendations();
        }
        /**
         * Parse all extensions.json files, fetch workspace recommendations, filter out invalid and unwanted ones
         */
        async fetch() {
            const extensionsConfigBySource = await this.fetchExtensionsConfigBySource();
            const { invalidRecommendations, message } = await this.validateExtensions(extensionsConfigBySource.map(({ contents }) => contents));
            if (invalidRecommendations.length) {
                this.notificationService.warn(`The below ${invalidRecommendations.length} extension(s) in workspace recommendations have issues:\n${message}`);
            }
            this._ignoredRecommendations = [];
            for (const extensionsConfig of extensionsConfigBySource) {
                for (const unwantedRecommendation of extensionsConfig.contents.unwantedRecommendations) {
                    if (invalidRecommendations.indexOf(unwantedRecommendation) === -1) {
                        this._ignoredRecommendations.push(unwantedRecommendation);
                    }
                }
                for (const extensionId of extensionsConfig.contents.recommendations) {
                    if (invalidRecommendations.indexOf(extensionId) === -1) {
                        this._recommendations.push({
                            extensionId,
                            source: extensionsConfig.source,
                            reason: {
                                reasonId: 0 /* Workspace */,
                                reasonText: nls_1.localize('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
                            }
                        });
                    }
                }
            }
        }
        async promptWorkspaceRecommendations() {
            const allowedRecommendations = this.recommendations.filter(rec => this.isExtensionAllowedToBeRecommended(rec.extensionId));
            if (allowedRecommendations.length === 0 || this.hasToIgnoreWorkspaceRecommendationNotifications()) {
                return;
            }
            let installed = await this.extensionManagementService.getInstalled();
            installed = installed.filter(l => this.extensionEnablementService.getEnablementState(l) !== 0 /* DisabledByExtensionKind */); // Filter extensions disabled by kind
            const recommendations = allowedRecommendations.filter(({ extensionId }) => installed.every(local => !extensionManagementUtil_1.areSameExtensions({ id: extensionId }, local.identifier)));
            if (!recommendations.length) {
                return;
            }
            return new Promise(c => {
                this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('workspaceRecommended', "This workspace has extension recommendations."), [{
                        label: nls_1.localize('installAll', "Install All"),
                        run: () => {
                            this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'install' });
                            const installAllAction = this.instantiationService.createInstance(extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction, extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction.ID, nls_1.localize('installAll', "Install All"), recommendations.map(({ extensionId }) => extensionId));
                            installAllAction.run();
                            installAllAction.dispose();
                            c(undefined);
                        }
                    }, {
                        label: nls_1.localize('showRecommendations', "Show Recommendations"),
                        run: () => {
                            this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'show' });
                            const showAction = this.instantiationService.createInstance(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, nls_1.localize('showRecommendations', "Show Recommendations"));
                            showAction.run();
                            showAction.dispose();
                            c(undefined);
                        }
                    }, {
                        label: choiceNever,
                        isSecondary: true,
                        run: () => {
                            this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'neverShowAgain' });
                            this.storageService.store(ignoreWorkspaceRecommendationsStorageKey, true, 1 /* WORKSPACE */);
                            c(undefined);
                        }
                    }], {
                    sticky: true,
                    onCancel: () => {
                        this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'cancelled' });
                        c(undefined);
                    }
                });
            });
        }
        async fetchExtensionsConfigBySource() {
            const workspace = this.contextService.getWorkspace();
            const result = await Promise.all([
                this.resolveWorkspaceExtensionConfig(workspace),
                ...workspace.folders.map(workspaceFolder => this.resolveWorkspaceFolderExtensionConfig(workspaceFolder))
            ]);
            return arrays_1.coalesce(result);
        }
        async resolveWorkspaceExtensionConfig(workspace) {
            try {
                if (workspace.configuration) {
                    const content = await this.fileService.readFile(workspace.configuration);
                    const extensionsConfigContent = json_1.parse(content.value.toString())['extensions'];
                    const contents = this.parseExtensionConfig(extensionsConfigContent);
                    if (contents) {
                        return { contents, source: workspace };
                    }
                }
            }
            catch (e) { /* Ignore */ }
            return null;
        }
        async resolveWorkspaceFolderExtensionConfig(workspaceFolder) {
            try {
                const content = await this.fileService.readFile(workspaceFolder.toResource(extensions_1.EXTENSIONS_CONFIG));
                const extensionsConfigContent = json_1.parse(content.value.toString());
                const contents = this.parseExtensionConfig(extensionsConfigContent);
                if (contents) {
                    return { contents, source: workspaceFolder };
                }
            }
            catch (e) { /* ignore */ }
            return null;
        }
        async validateExtensions(contents) {
            const validExtensions = [];
            const invalidExtensions = [];
            const extensionsToQuery = [];
            let message = '';
            const allRecommendations = arrays_1.distinct(arrays_1.flatten(contents.map(({ recommendations }) => recommendations || [])));
            const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
            for (const extensionId of allRecommendations) {
                if (regEx.test(extensionId)) {
                    extensionsToQuery.push(extensionId);
                }
                else {
                    invalidExtensions.push(extensionId);
                    message += `${extensionId} (bad format) Expected: <provider>.<name>\n`;
                }
            }
            if (extensionsToQuery.length) {
                try {
                    const queryResult = await this.galleryService.query({ names: extensionsToQuery, pageSize: extensionsToQuery.length }, cancellation_1.CancellationToken.None);
                    const extensions = queryResult.firstPage.map(extension => extension.identifier.id.toLowerCase());
                    for (const extensionId of extensionsToQuery) {
                        if (extensions.indexOf(extensionId) === -1) {
                            invalidExtensions.push(extensionId);
                            message += `${extensionId} (not found in marketplace)\n`;
                        }
                        else {
                            validExtensions.push(extensionId);
                        }
                    }
                }
                catch (e) {
                    this.logService.warn('Error querying extensions gallery', e);
                }
            }
            return { validRecommendations: validExtensions, invalidRecommendations: invalidExtensions, message };
        }
        async onWorkspaceFoldersChanged(event) {
            if (event.added.length) {
                const oldWorkspaceRecommended = this._recommendations;
                await this.fetch();
                // Suggest only if at least one of the newly added recommendations was not suggested before
                if (this._recommendations.some(current => oldWorkspaceRecommended.every(old => current.extensionId !== old.extensionId))) {
                    this.promptWorkspaceRecommendations();
                }
            }
        }
        parseExtensionConfig(extensionsConfigContent) {
            if (extensionsConfigContent) {
                return {
                    recommendations: arrays_1.distinct((extensionsConfigContent.recommendations || []).map(e => e.toLowerCase())),
                    unwantedRecommendations: arrays_1.distinct((extensionsConfigContent.unwantedRecommendations || []).map(e => e.toLowerCase()))
                };
            }
            return null;
        }
        hasToIgnoreWorkspaceRecommendationNotifications() {
            return this.hasToIgnoreRecommendationNotifications() || this.storageService.getBoolean(ignoreWorkspaceRecommendationsStorageKey, 1 /* WORKSPACE */, false);
        }
    };
    WorkspaceRecommendations = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, log_1.ILogService),
        __param(4, files_1.IFileService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, notification_1.INotificationService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, storage_1.IStorageService),
        __param(12, storageKeys_1.IStorageKeysSyncRegistryService)
    ], WorkspaceRecommendations);
    exports.WorkspaceRecommendations = WorkspaceRecommendations;
});
//# __sourceMappingURL=workspaceRecommendations.js.map