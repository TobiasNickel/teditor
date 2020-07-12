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
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/buffer", "vs/nls", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/resources", "vs/platform/storage/common/storage", "vs/base/common/jsonEdit"], function (require, exports, files_1, userDataSync_1, buffer_1, nls_1, event_1, environment_1, configuration_1, cancellation_1, settingsMerge_1, content_1, abstractSynchronizer_1, telemetry_1, extensionManagement_1, resources_1, storage_1, jsonEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsSynchroniser = void 0;
    function isSettingsSyncContent(thing) {
        return thing
            && (thing.settings && typeof thing.settings === 'string')
            && Object.keys(thing).length === 1;
    }
    let SettingsSynchroniser = class SettingsSynchroniser extends abstractSynchronizer_1.AbstractJsonFileSynchroniser {
        constructor(fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, userDataSyncUtilService, configurationService, userDataSyncResourceEnablementService, telemetryService, extensionManagementService) {
            super(environmentService.settingsResource, "settings" /* Settings */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService);
            this.extensionManagementService = extensionManagementService;
            this.version = 1;
            this.localPreviewResource = resources_1.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME, 'settings.json');
            this.remotePreviewResource = this.localPreviewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME });
            this._defaultIgnoredSettings = undefined;
        }
        async generatePullPreview(remoteUserData, lastSyncUserData, token) {
            const fileContent = await this.getLocalFileContent();
            const formatUtils = await this.getFormattingOptions();
            const ignoredSettings = await this.getIgnoredSettings();
            const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
            let content = null;
            if (remoteSettingsSyncContent !== null) {
                // Update ignored settings from local file content
                content = settingsMerge_1.updateIgnoredSettings(remoteSettingsSyncContent.settings, fileContent ? fileContent.value.toString() : '{}', ignoredSettings, formatUtils);
            }
            return {
                fileContent,
                remoteUserData,
                lastSyncUserData,
                content,
                hasLocalChanged: content !== null,
                hasRemoteChanged: false,
                hasConflicts: false,
                isLastSyncFromCurrentMachine: false
            };
        }
        async generatePushPreview(remoteUserData, lastSyncUserData, token) {
            const fileContent = await this.getLocalFileContent();
            const formatUtils = await this.getFormattingOptions();
            const ignoredSettings = await this.getIgnoredSettings();
            let content = null;
            if (fileContent !== null) {
                // Remove ignored settings
                content = settingsMerge_1.updateIgnoredSettings(fileContent.value.toString(), '{}', ignoredSettings, formatUtils);
            }
            return {
                fileContent,
                remoteUserData,
                lastSyncUserData,
                content,
                hasLocalChanged: false,
                hasRemoteChanged: content !== null,
                hasConflicts: false,
                isLastSyncFromCurrentMachine: false
            };
        }
        async generateReplacePreview(syncData, remoteUserData, lastSyncUserData) {
            const fileContent = await this.getLocalFileContent();
            const formatUtils = await this.getFormattingOptions();
            const ignoredSettings = await this.getIgnoredSettings();
            let content = null;
            const settingsSyncContent = this.parseSettingsSyncContent(syncData.content);
            if (settingsSyncContent) {
                content = settingsMerge_1.updateIgnoredSettings(settingsSyncContent.settings, fileContent ? fileContent.value.toString() : '{}', ignoredSettings, formatUtils);
            }
            return {
                fileContent,
                remoteUserData,
                lastSyncUserData,
                content,
                hasLocalChanged: content !== null,
                hasRemoteChanged: content !== null,
                hasConflicts: false,
                isLastSyncFromCurrentMachine: false
            };
        }
        async generatePreview(remoteUserData, lastSyncUserData, token = cancellation_1.CancellationToken.None) {
            const fileContent = await this.getLocalFileContent();
            const formattingOptions = await this.getFormattingOptions();
            const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
            const isLastSyncFromCurrentMachine = await this.isLastSyncFromCurrentMachine(remoteUserData);
            let lastSettingsSyncContent = null;
            if (lastSyncUserData === null) {
                if (isLastSyncFromCurrentMachine) {
                    lastSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
                }
            }
            else {
                lastSettingsSyncContent = this.getSettingsSyncContent(lastSyncUserData);
            }
            let content = null;
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            if (remoteSettingsSyncContent) {
                const localContent = fileContent ? fileContent.value.toString() : '{}';
                this.validateContent(localContent);
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote settings with local settings...`);
                const ignoredSettings = await this.getIgnoredSettings();
                const result = settingsMerge_1.merge(localContent, remoteSettingsSyncContent.settings, lastSettingsSyncContent ? lastSettingsSyncContent.settings : null, ignoredSettings, [], formattingOptions);
                content = result.localContent || result.remoteContent;
                hasLocalChanged = result.localContent !== null;
                hasRemoteChanged = result.remoteContent !== null;
                hasConflicts = result.hasConflicts;
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote settings does not exist. Synchronizing settings for the first time.`);
                content = fileContent.value.toString();
                hasRemoteChanged = true;
            }
            if (content && !token.isCancellationRequested) {
                // Remove the ignored settings from the preview.
                const ignoredSettings = await this.getIgnoredSettings();
                const previewContent = settingsMerge_1.updateIgnoredSettings(content, '{}', ignoredSettings, formattingOptions);
                await this.fileService.writeFile(this.localPreviewResource, buffer_1.VSBuffer.fromString(previewContent));
            }
            this.setConflicts(hasConflicts && !token.isCancellationRequested ? [{ local: this.localPreviewResource, remote: this.remotePreviewResource }] : []);
            return { fileContent, remoteUserData, lastSyncUserData, content, hasLocalChanged, hasRemoteChanged, hasConflicts, isLastSyncFromCurrentMachine };
        }
        async updatePreviewWithConflict(preview, conflictResource, conflictContent, token) {
            if (resources_1.isEqual(this.localPreviewResource, conflictResource) || resources_1.isEqual(this.remotePreviewResource, conflictResource)) {
                const formatUtils = await this.getFormattingOptions();
                // Add ignored settings from local file content
                const ignoredSettings = await this.getIgnoredSettings();
                const content = settingsMerge_1.updateIgnoredSettings(conflictContent, preview.fileContent ? preview.fileContent.value.toString() : '{}', ignoredSettings, formatUtils);
                preview = Object.assign(Object.assign({}, preview), { content, hasConflicts: false });
            }
            return preview;
        }
        async applyPreview(preview, forcePush) {
            let { fileContent, remoteUserData, lastSyncUserData, content, hasLocalChanged, hasRemoteChanged } = preview;
            if (content !== null) {
                this.validateContent(content);
                if (hasLocalChanged) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating local settings...`);
                    if (fileContent) {
                        await this.backupLocal(JSON.stringify(this.toSettingsSyncContent(fileContent.value.toString())));
                    }
                    await this.updateLocalFileContent(content, fileContent);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated local settings`);
                }
                if (hasRemoteChanged) {
                    const formatUtils = await this.getFormattingOptions();
                    // Update ignored settings from remote
                    const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
                    const ignoredSettings = await this.getIgnoredSettings(content);
                    content = settingsMerge_1.updateIgnoredSettings(content, remoteSettingsSyncContent ? remoteSettingsSyncContent.settings : '{}', ignoredSettings, formatUtils);
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating remote settings...`);
                    remoteUserData = await this.updateRemoteUserData(JSON.stringify(this.toSettingsSyncContent(content)), forcePush ? null : remoteUserData.ref);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated remote settings`);
                }
                // Delete the preview
                try {
                    await this.fileService.del(this.localPreviewResource);
                }
                catch (e) { /* ignore */ }
            }
            else {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing settings.`);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized settings...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized settings`);
            }
        }
        async hasLocalData() {
            try {
                const localFileContent = await this.getLocalFileContent();
                if (localFileContent) {
                    const formatUtils = await this.getFormattingOptions();
                    const content = content_1.edit(localFileContent.value.toString(), [userDataSync_1.CONFIGURATION_SYNC_STORE_KEY], undefined, formatUtils);
                    return !settingsMerge_1.isEmpty(content);
                }
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FILE_NOT_FOUND */) {
                    return true;
                }
            }
            return false;
        }
        async getAssociatedResources({ uri }) {
            return [{ resource: resources_1.joinPath(uri, 'settings.json'), comparableResource: this.file }];
        }
        async resolveContent(uri) {
            if (resources_1.isEqual(this.remotePreviewResource, uri)) {
                return this.getConflictContent(uri);
            }
            let content = await super.resolveContent(uri);
            if (content) {
                return content;
            }
            content = await super.resolveContent(resources_1.dirname(uri));
            if (content) {
                const syncData = this.parseSyncData(content);
                if (syncData) {
                    const settingsSyncContent = this.parseSettingsSyncContent(syncData.content);
                    if (settingsSyncContent) {
                        switch (resources_1.basename(uri)) {
                            case 'settings.json':
                                return settingsSyncContent.settings;
                        }
                    }
                }
            }
            return null;
        }
        async getConflictContent(conflictResource) {
            let content = await super.getConflictContent(conflictResource);
            if (content !== null) {
                const settingsSyncContent = this.parseSettingsSyncContent(content);
                content = settingsSyncContent ? settingsSyncContent.settings : null;
            }
            if (content !== null) {
                const formatUtils = await this.getFormattingOptions();
                // remove ignored settings from the remote content for preview
                const ignoredSettings = await this.getIgnoredSettings();
                content = settingsMerge_1.updateIgnoredSettings(content, '{}', ignoredSettings, formatUtils);
            }
            return content;
        }
        getSettingsSyncContent(remoteUserData) {
            return remoteUserData.syncData ? this.parseSettingsSyncContent(remoteUserData.syncData.content) : null;
        }
        parseSettingsSyncContent(syncContent) {
            try {
                const parsed = JSON.parse(syncContent);
                return isSettingsSyncContent(parsed) ? parsed : /* migrate */ { settings: syncContent };
            }
            catch (e) {
                this.logService.error(e);
            }
            return null;
        }
        toSettingsSyncContent(settings) {
            return { settings };
        }
        async getIgnoredSettings(content) {
            if (!this._defaultIgnoredSettings) {
                this._defaultIgnoredSettings = this.userDataSyncUtilService.resolveDefaultIgnoredSettings();
                const disposable = event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtension, (e => !!e.gallery)), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)))(() => {
                    disposable.dispose();
                    this._defaultIgnoredSettings = undefined;
                });
            }
            const defaultIgnoredSettings = await this._defaultIgnoredSettings;
            return settingsMerge_1.getIgnoredSettings(defaultIgnoredSettings, this.configurationService, content);
        }
        validateContent(content) {
            if (this.hasErrors(content)) {
                throw new userDataSync_1.UserDataSyncError(nls_1.localize('errorInvalidSettings', "Unable to sync settings as there are errors/warning in settings file."), userDataSync_1.UserDataSyncErrorCode.LocalInvalidContent, this.resource);
            }
        }
        async recoverSettings() {
            try {
                const fileContent = await this.getLocalFileContent();
                if (!fileContent) {
                    return;
                }
                const syncData = JSON.parse(fileContent.value.toString());
                if (!isSyncData(syncData)) {
                    return;
                }
                this.telemetryService.publicLog2('sync/settingsCorrupted');
                const settingsSyncContent = this.parseSettingsSyncContent(syncData.content);
                if (!settingsSyncContent || !settingsSyncContent.settings) {
                    return;
                }
                let settings = settingsSyncContent.settings;
                const formattingOptions = await this.getFormattingOptions();
                for (const key in syncData) {
                    if (['version', 'content', 'machineId'].indexOf(key) === -1 && syncData[key] !== undefined) {
                        const edits = jsonEdit_1.setProperty(settings, [key], syncData[key], formattingOptions);
                        if (edits.length) {
                            settings = jsonEdit_1.applyEdits(settings, edits);
                        }
                    }
                }
                await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(settings));
            }
            catch (e) { /* ignore */ }
        }
    };
    SettingsSynchroniser = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, userDataSync_1.IUserDataSyncUtilService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, extensionManagement_1.IExtensionManagementService)
    ], SettingsSynchroniser);
    exports.SettingsSynchroniser = SettingsSynchroniser;
    function isSyncData(thing) {
        if (thing
            && (thing.version !== undefined && typeof thing.version === 'number')
            && (thing.content !== undefined && typeof thing.content === 'string')
            && (thing.machineId !== undefined && typeof thing.machineId === 'string')) {
            return true;
        }
        return false;
    }
});
//# __sourceMappingURL=settingsSync.js.map