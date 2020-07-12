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
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/keybindingsMerge", "vs/base/common/buffer", "vs/base/common/json", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/arrays", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/base/common/resources", "vs/platform/storage/common/storage"], function (require, exports, files_1, userDataSync_1, keybindingsMerge_1, buffer_1, json_1, nls_1, environment_1, configuration_1, cancellation_1, platform_1, types_1, arrays_1, abstractSynchronizer_1, telemetry_1, resources_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsSynchroniser = void 0;
    let KeybindingsSynchroniser = class KeybindingsSynchroniser extends abstractSynchronizer_1.AbstractJsonFileSynchroniser {
        constructor(userDataSyncStoreService, userDataSyncBackupStoreService, logService, configurationService, userDataSyncResourceEnablementService, fileService, environmentService, storageService, userDataSyncUtilService, telemetryService) {
            super(environmentService.keybindingsResource, "keybindings" /* Keybindings */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService);
            this.version = 1;
            this.localPreviewResource = resources_1.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME, 'keybindings.json');
            this.remotePreviewResource = this.localPreviewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME });
        }
        async generatePullPreview(remoteUserData, lastSyncUserData, token) {
            const fileContent = await this.getLocalFileContent();
            const content = remoteUserData.syncData !== null ? this.getKeybindingsContentFromSyncContent(remoteUserData.syncData.content) : null;
            const hasLocalChanged = content !== null;
            return {
                fileContent,
                remoteUserData,
                lastSyncUserData,
                content,
                hasConflicts: false,
                hasLocalChanged,
                hasRemoteChanged: false,
                isLastSyncFromCurrentMachine: false
            };
        }
        async generatePushPreview(remoteUserData, lastSyncUserData, token) {
            const fileContent = await this.getLocalFileContent();
            const content = fileContent ? fileContent.value.toString() : null;
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
            const content = this.getKeybindingsContentFromSyncContent(syncData.content);
            return {
                fileContent,
                remoteUserData,
                lastSyncUserData,
                content,
                hasConflicts: false,
                hasLocalChanged: content !== null,
                hasRemoteChanged: content !== null,
                isLastSyncFromCurrentMachine: false
            };
        }
        async generatePreview(remoteUserData, lastSyncUserData, token = cancellation_1.CancellationToken.None) {
            const remoteContent = remoteUserData.syncData ? this.getKeybindingsContentFromSyncContent(remoteUserData.syncData.content) : null;
            const isLastSyncFromCurrentMachine = await this.isLastSyncFromCurrentMachine(remoteUserData);
            let lastSyncContent = null;
            if (lastSyncUserData === null) {
                if (isLastSyncFromCurrentMachine) {
                    lastSyncContent = remoteUserData.syncData ? this.getKeybindingsContentFromSyncContent(remoteUserData.syncData.content) : null;
                }
            }
            else {
                lastSyncContent = lastSyncUserData.syncData ? this.getKeybindingsContentFromSyncContent(lastSyncUserData.syncData.content) : null;
            }
            // Get file content last to get the latest
            const fileContent = await this.getLocalFileContent();
            const formattingOptions = await this.getFormattingOptions();
            let content = null;
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            if (remoteContent) {
                const localContent = fileContent ? fileContent.value.toString() : '[]';
                if (!localContent.trim() || this.hasErrors(localContent)) {
                    throw new userDataSync_1.UserDataSyncError(nls_1.localize('errorInvalidSettings', "Unable to sync keybindings because the content in the file is not valid. Please open the file and correct it."), userDataSync_1.UserDataSyncErrorCode.LocalInvalidContent, this.resource);
                }
                if (!lastSyncContent // First time sync
                    || lastSyncContent !== localContent // Local has forwarded
                    || lastSyncContent !== remoteContent // Remote has forwarded
                ) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote keybindings with local keybindings...`);
                    const result = await keybindingsMerge_1.merge(localContent, remoteContent, lastSyncContent, formattingOptions, this.userDataSyncUtilService);
                    // Sync only if there are changes
                    if (result.hasChanges) {
                        content = result.mergeContent;
                        hasConflicts = result.hasConflicts;
                        hasLocalChanged = hasConflicts || result.mergeContent !== localContent;
                        hasRemoteChanged = hasConflicts || result.mergeContent !== remoteContent;
                    }
                }
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote keybindings does not exist. Synchronizing keybindings for the first time.`);
                content = fileContent.value.toString();
                hasRemoteChanged = true;
            }
            if (content && !token.isCancellationRequested) {
                await this.fileService.writeFile(this.localPreviewResource, buffer_1.VSBuffer.fromString(content));
            }
            this.setConflicts(hasConflicts && !token.isCancellationRequested ? [{ local: this.localPreviewResource, remote: this.remotePreviewResource }] : []);
            return { fileContent, remoteUserData, lastSyncUserData, content, hasLocalChanged, hasRemoteChanged, hasConflicts, isLastSyncFromCurrentMachine };
        }
        async updatePreviewWithConflict(preview, conflictResource, conflictContent, token) {
            if (resources_1.isEqual(this.localPreviewResource, conflictResource) || resources_1.isEqual(this.remotePreviewResource, conflictResource)) {
                preview = Object.assign(Object.assign({}, preview), { content: conflictContent, hasConflicts: false });
            }
            return preview;
        }
        async applyPreview(preview, forcePush) {
            let { fileContent, remoteUserData, lastSyncUserData, content, hasLocalChanged, hasRemoteChanged } = preview;
            if (content !== null) {
                if (this.hasErrors(content)) {
                    throw new userDataSync_1.UserDataSyncError(nls_1.localize('errorInvalidSettings', "Unable to sync keybindings because the content in the file is not valid. Please open the file and correct it."), userDataSync_1.UserDataSyncErrorCode.LocalInvalidContent, this.resource);
                }
                if (hasLocalChanged) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating local keybindings...`);
                    if (fileContent) {
                        await this.backupLocal(this.toSyncContent(fileContent.value.toString(), null));
                    }
                    await this.updateLocalFileContent(content, fileContent);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated local keybindings`);
                }
                if (hasRemoteChanged) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating remote keybindings...`);
                    const remoteContents = this.toSyncContent(content, remoteUserData.syncData ? remoteUserData.syncData.content : null);
                    remoteUserData = await this.updateRemoteUserData(remoteContents, forcePush ? null : remoteUserData.ref);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated remote keybindings`);
                }
                // Delete the preview
                try {
                    await this.fileService.del(this.localPreviewResource);
                }
                catch (e) { /* ignore */ }
            }
            else {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing keybindings.`);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized keybindings...`);
                const lastSyncContent = content !== null || fileContent !== null ? this.toSyncContent(content !== null ? content : fileContent.value.toString(), null) : null;
                await this.updateLastSyncUserData({ ref: remoteUserData.ref, syncData: lastSyncContent ? { version: remoteUserData.syncData.version, machineId: remoteUserData.syncData.machineId, content: lastSyncContent } : null });
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized keybindings`);
            }
        }
        async hasLocalData() {
            try {
                const localFileContent = await this.getLocalFileContent();
                if (localFileContent) {
                    const keybindings = json_1.parse(localFileContent.value.toString());
                    if (arrays_1.isNonEmptyArray(keybindings)) {
                        return true;
                    }
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
            return [{ resource: resources_1.joinPath(uri, 'keybindings.json'), comparableResource: this.file }];
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
                    switch (resources_1.basename(uri)) {
                        case 'keybindings.json':
                            return this.getKeybindingsContentFromSyncContent(syncData.content);
                    }
                }
            }
            return null;
        }
        async getConflictContent(conflictResource) {
            const content = await super.getConflictContent(conflictResource);
            return content !== null ? this.getKeybindingsContentFromSyncContent(content) : null;
        }
        getKeybindingsContentFromSyncContent(syncContent) {
            try {
                const parsed = JSON.parse(syncContent);
                if (!this.configurationService.getValue('sync.keybindingsPerPlatform')) {
                    return types_1.isUndefined(parsed.all) ? null : parsed.all;
                }
                switch (platform_1.OS) {
                    case 2 /* Macintosh */:
                        return types_1.isUndefined(parsed.mac) ? null : parsed.mac;
                    case 3 /* Linux */:
                        return types_1.isUndefined(parsed.linux) ? null : parsed.linux;
                    case 1 /* Windows */:
                        return types_1.isUndefined(parsed.windows) ? null : parsed.windows;
                }
            }
            catch (e) {
                this.logService.error(e);
                return null;
            }
        }
        toSyncContent(keybindingsContent, syncContent) {
            let parsed = {};
            try {
                parsed = JSON.parse(syncContent || '{}');
            }
            catch (e) {
                this.logService.error(e);
            }
            if (!this.configurationService.getValue('sync.keybindingsPerPlatform')) {
                parsed.all = keybindingsContent;
            }
            else {
                delete parsed.all;
            }
            switch (platform_1.OS) {
                case 2 /* Macintosh */:
                    parsed.mac = keybindingsContent;
                    break;
                case 3 /* Linux */:
                    parsed.linux = keybindingsContent;
                    break;
                case 1 /* Windows */:
                    parsed.windows = keybindingsContent;
                    break;
            }
            return JSON.stringify(parsed);
        }
    };
    KeybindingsSynchroniser = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(5, files_1.IFileService),
        __param(6, environment_1.IEnvironmentService),
        __param(7, storage_1.IStorageService),
        __param(8, userDataSync_1.IUserDataSyncUtilService),
        __param(9, telemetry_1.ITelemetryService)
    ], KeybindingsSynchroniser);
    exports.KeybindingsSynchroniser = KeybindingsSynchroniser;
});
//# __sourceMappingURL=keybindingsSync.js.map