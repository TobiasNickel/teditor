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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/base/common/resources", "vs/base/common/buffer", "vs/platform/userDataSync/common/snippetsMerge", "vs/base/common/cancellation", "vs/platform/storage/common/storage"], function (require, exports, userDataSync_1, environment_1, files_1, configuration_1, abstractSynchronizer_1, telemetry_1, resources_1, buffer_1, snippetsMerge_1, cancellation_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetsSynchroniser = void 0;
    let SnippetsSynchroniser = class SnippetsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(environmentService, fileService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, configurationService, userDataSyncResourceEnablementService, telemetryService) {
            super("snippets" /* Snippets */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, configurationService);
            this.version = 1;
            this.snippetsFolder = environmentService.snippetsHome;
            this.snippetsPreviewFolder = resources_1.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME);
            this._register(this.fileService.watch(environmentService.userRoamingDataHome));
            this._register(this.fileService.watch(this.snippetsFolder));
            this._register(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
        }
        onFileChanges(e) {
            if (!e.changes.some(change => resources_1.isEqualOrParent(change.resource, this.snippetsFolder))) {
                return;
            }
            this.triggerLocalChange();
        }
        async generatePullPreview(remoteUserData, lastSyncUserData, token) {
            if (remoteUserData.syncData !== null) {
                const local = await this.getSnippetsFileContents();
                const localSnippets = this.toSnippetsContents(local);
                const remoteSnippets = this.parseSnippets(remoteUserData.syncData);
                const { added, updated, remote, removed } = snippetsMerge_1.merge(localSnippets, remoteSnippets, localSnippets);
                return {
                    remoteUserData, lastSyncUserData,
                    added, removed, updated, remote, local,
                    hasLocalChanged: Object.keys(added).length > 0 || removed.length > 0 || Object.keys(updated).length > 0,
                    hasRemoteChanged: remote !== null,
                    conflicts: [], resolvedConflicts: {}, hasConflicts: false,
                    isLastSyncFromCurrentMachine: false,
                };
            }
            else {
                return {
                    remoteUserData, lastSyncUserData,
                    added: {}, removed: [], updated: {}, remote: null, local: {},
                    hasLocalChanged: false,
                    hasRemoteChanged: false,
                    conflicts: [], resolvedConflicts: {}, hasConflicts: false,
                    isLastSyncFromCurrentMachine: false,
                };
            }
        }
        async generatePushPreview(remoteUserData, lastSyncUserData, token) {
            const local = await this.getSnippetsFileContents();
            const localSnippets = this.toSnippetsContents(local);
            const { added, removed, updated, remote } = snippetsMerge_1.merge(localSnippets, null, null);
            return {
                added, removed, updated, remote, remoteUserData, local, lastSyncUserData, conflicts: [], resolvedConflicts: {},
                hasLocalChanged: Object.keys(added).length > 0 || removed.length > 0 || Object.keys(updated).length > 0,
                hasRemoteChanged: remote !== null,
                isLastSyncFromCurrentMachine: false,
                hasConflicts: false,
            };
        }
        async generateReplacePreview(syncData, remoteUserData, lastSyncUserData) {
            const local = await this.getSnippetsFileContents();
            const localSnippets = this.toSnippetsContents(local);
            const snippets = this.parseSnippets(syncData);
            const { added, updated, removed } = snippetsMerge_1.merge(localSnippets, snippets, localSnippets);
            return {
                added, removed, updated, remote: snippets, remoteUserData, local, lastSyncUserData, conflicts: [], resolvedConflicts: {}, hasConflicts: false,
                hasLocalChanged: Object.keys(added).length > 0 || removed.length > 0 || Object.keys(updated).length > 0,
                hasRemoteChanged: true,
                isLastSyncFromCurrentMachine: false,
            };
        }
        async generatePreview(remoteUserData, lastSyncUserData, token = cancellation_1.CancellationToken.None) {
            const local = await this.getSnippetsFileContents();
            return this.doGeneratePreview(local, remoteUserData, lastSyncUserData, {}, token);
        }
        async doGeneratePreview(local, remoteUserData, lastSyncUserData, resolvedConflicts = {}, token = cancellation_1.CancellationToken.None) {
            const localSnippets = this.toSnippetsContents(local);
            const remoteSnippets = remoteUserData.syncData ? this.parseSnippets(remoteUserData.syncData) : null;
            const isLastSyncFromCurrentMachine = await this.isLastSyncFromCurrentMachine(remoteUserData);
            let lastSyncSnippets = null;
            if (lastSyncUserData === null) {
                if (isLastSyncFromCurrentMachine) {
                    lastSyncSnippets = remoteUserData.syncData ? this.parseSnippets(remoteUserData.syncData) : null;
                }
            }
            else {
                lastSyncSnippets = lastSyncUserData.syncData ? this.parseSnippets(lastSyncUserData.syncData) : null;
            }
            if (remoteSnippets) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote snippets with local snippets...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote snippets does not exist. Synchronizing snippets for the first time.`);
            }
            const mergeResult = snippetsMerge_1.merge(localSnippets, remoteSnippets, lastSyncSnippets, resolvedConflicts);
            const conflicts = [];
            for (const key of mergeResult.conflicts) {
                const localPreview = resources_1.joinPath(this.snippetsPreviewFolder, key);
                conflicts.push({ local: localPreview, remote: localPreview.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME }) });
                const content = local[key];
                if (!token.isCancellationRequested) {
                    await this.fileService.writeFile(localPreview, content ? content.value : buffer_1.VSBuffer.fromString(''));
                }
            }
            for (const conflict of this.conflicts) {
                // clear obsolete conflicts
                if (!conflicts.some(({ local }) => resources_1.isEqual(local, conflict.local))) {
                    try {
                        await this.fileService.del(conflict.local);
                    }
                    catch (error) {
                        // Ignore & log
                        this.logService.error(error);
                    }
                }
            }
            this.setConflicts(conflicts);
            return {
                remoteUserData, local,
                lastSyncUserData,
                added: mergeResult.added,
                removed: mergeResult.removed,
                updated: mergeResult.updated,
                conflicts,
                hasConflicts: conflicts.length > 0,
                remote: mergeResult.remote,
                resolvedConflicts,
                hasLocalChanged: Object.keys(mergeResult.added).length > 0 || mergeResult.removed.length > 0 || Object.keys(mergeResult.updated).length > 0,
                hasRemoteChanged: mergeResult.remote !== null,
                isLastSyncFromCurrentMachine
            };
        }
        async updatePreviewWithConflict(preview, conflictResource, content, token) {
            const conflict = this.conflicts.filter(({ local, remote }) => resources_1.isEqual(local, conflictResource) || resources_1.isEqual(remote, conflictResource))[0];
            if (conflict) {
                const key = resources_1.relativePath(this.snippetsPreviewFolder, conflict.local);
                preview.resolvedConflicts[key] = content || null;
                preview = await this.doGeneratePreview(preview.local, preview.remoteUserData, preview.lastSyncUserData, preview.resolvedConflicts, token);
            }
            return preview;
        }
        async applyPreview(preview, forcePush) {
            let { added, removed, updated, local, remote, remoteUserData, lastSyncUserData, hasLocalChanged, hasRemoteChanged } = preview;
            if (!hasLocalChanged && !hasRemoteChanged) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing snippets.`);
            }
            if (hasLocalChanged) {
                // back up all snippets
                await this.backupLocal(JSON.stringify(this.toSnippetsContents(local)));
                await this.updateLocalSnippets(added, removed, updated, local);
            }
            if (remote) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote snippets...`);
                const content = JSON.stringify(remote);
                remoteUserData = await this.updateRemoteUserData(content, forcePush ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote snippets`);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized snippets...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized snippets`);
            }
        }
        async stop() {
            await this.clearConflicts();
            return super.stop();
        }
        async getAssociatedResources({ uri }) {
            let content = await super.resolveContent(uri);
            if (content) {
                const syncData = this.parseSyncData(content);
                if (syncData) {
                    const snippets = this.parseSnippets(syncData);
                    const result = [];
                    for (const snippet of Object.keys(snippets)) {
                        const resource = resources_1.joinPath(uri, snippet);
                        const comparableResource = resources_1.joinPath(this.snippetsFolder, snippet);
                        const exists = await this.fileService.exists(comparableResource);
                        result.push({ resource, comparableResource: exists ? comparableResource : undefined });
                    }
                    return result;
                }
            }
            return [];
        }
        async resolveContent(uri) {
            if (resources_1.isEqualOrParent(uri.with({ scheme: this.syncFolder.scheme }), this.snippetsPreviewFolder)) {
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
                    const snippets = this.parseSnippets(syncData);
                    return snippets[resources_1.basename(uri)] || null;
                }
            }
            return null;
        }
        async getConflictContent(conflictResource) {
            const syncPreview = await this.getSyncPreviewInProgress();
            if (syncPreview) {
                const key = resources_1.relativePath(this.snippetsPreviewFolder, conflictResource.with({ scheme: this.snippetsPreviewFolder.scheme }));
                if (conflictResource.scheme === this.snippetsPreviewFolder.scheme) {
                    return syncPreview.local[key] ? syncPreview.local[key].value.toString() : null;
                }
                else if (syncPreview.remoteUserData && syncPreview.remoteUserData.syncData) {
                    const snippets = this.parseSnippets(syncPreview.remoteUserData.syncData);
                    return snippets[key] || null;
                }
            }
            return null;
        }
        async hasLocalData() {
            try {
                const localSnippets = await this.getSnippetsFileContents();
                if (Object.keys(localSnippets).length) {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async clearConflicts() {
            if (this.conflicts.length) {
                await Promise.all(this.conflicts.map(({ local }) => this.fileService.del(local)));
                this.setConflicts([]);
            }
        }
        async updateLocalSnippets(added, removed, updated, local) {
            for (const key of removed) {
                const resource = resources_1.joinPath(this.snippetsFolder, key);
                this.logService.trace(`${this.syncResourceLogLabel}: Deleting snippet...`, resources_1.basename(resource));
                await this.fileService.del(resource);
                this.logService.info(`${this.syncResourceLogLabel}: Deleted snippet`, resources_1.basename(resource));
            }
            for (const key of Object.keys(added)) {
                const resource = resources_1.joinPath(this.snippetsFolder, key);
                this.logService.trace(`${this.syncResourceLogLabel}: Creating snippet...`, resources_1.basename(resource));
                await this.fileService.createFile(resource, buffer_1.VSBuffer.fromString(added[key]), { overwrite: false });
                this.logService.info(`${this.syncResourceLogLabel}: Created snippet`, resources_1.basename(resource));
            }
            for (const key of Object.keys(updated)) {
                const resource = resources_1.joinPath(this.snippetsFolder, key);
                this.logService.trace(`${this.syncResourceLogLabel}: Updating snippet...`, resources_1.basename(resource));
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(updated[key]), local[key]);
                this.logService.info(`${this.syncResourceLogLabel}: Updated snippet`, resources_1.basename(resource));
            }
        }
        parseSnippets(syncData) {
            return JSON.parse(syncData.content);
        }
        toSnippetsContents(snippetsFileContents) {
            const snippets = {};
            for (const key of Object.keys(snippetsFileContents)) {
                snippets[key] = snippetsFileContents[key].value.toString();
            }
            return snippets;
        }
        async getSnippetsFileContents() {
            const snippets = {};
            let stat;
            try {
                stat = await this.fileService.resolve(this.snippetsFolder);
            }
            catch (e) {
                // No snippets
                if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FILE_NOT_FOUND */) {
                    return snippets;
                }
                else {
                    throw e;
                }
            }
            for (const entry of stat.children || []) {
                const resource = entry.resource;
                const extension = resources_1.extname(resource);
                if (extension === '.json' || extension === '.code-snippets') {
                    const key = resources_1.relativePath(this.snippetsFolder, resource);
                    const content = await this.fileService.readFile(resource);
                    snippets[key] = content;
                }
            }
            return snippets;
        }
    };
    SnippetsSynchroniser = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(8, telemetry_1.ITelemetryService)
    ], SnippetsSynchroniser);
    exports.SnippetsSynchroniser = SnippetsSynchroniser;
});
//# __sourceMappingURL=snippetsSync.js.map