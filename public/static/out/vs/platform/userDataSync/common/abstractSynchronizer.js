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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/userDataSync/common/userDataSync", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/base/common/async", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/base/common/json", "vs/nls", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/base/common/strings", "vs/base/common/arrays", "vs/platform/serviceMachineId/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/base/common/cancellation"], function (require, exports, lifecycle_1, files_1, buffer_1, uri_1, userDataSync_1, environment_1, resources_1, async_1, event_1, telemetry_1, json_1, nls_1, configuration_1, types_1, strings_1, arrays_1, serviceMachineId_1, storage_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractJsonFileSynchroniser = exports.AbstractFileSynchroniser = exports.AbstractSynchroniser = void 0;
    function isSyncData(thing) {
        if (thing
            && (thing.version !== undefined && typeof thing.version === 'number')
            && (thing.content !== undefined && typeof thing.content === 'string')) {
            // backward compatibility
            if (Object.keys(thing).length === 2) {
                return true;
            }
            if (Object.keys(thing).length === 3
                && (thing.machineId !== undefined && typeof thing.machineId === 'string')) {
                return true;
            }
        }
        return false;
    }
    let AbstractSynchroniser = class AbstractSynchroniser extends lifecycle_1.Disposable {
        constructor(resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, configurationService) {
            super();
            this.resource = resource;
            this.fileService = fileService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncBackupStoreService = userDataSyncBackupStoreService;
            this.userDataSyncResourceEnablementService = userDataSyncResourceEnablementService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.syncPreviewPromise = null;
            this._status = "idle" /* Idle */;
            this._onDidChangStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this.localChangeTriggerScheduler = new async_1.RunOnceScheduler(() => this.doTriggerLocalChange(), 50);
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this.syncHeaders = {};
            this.syncResourceLogLabel = strings_1.uppercaseFirstLetter(this.resource);
            this.syncFolder = resources_1.joinPath(environmentService.userDataSyncHome, resource);
            this.lastSyncResource = resources_1.joinPath(this.syncFolder, `lastSync${this.resource}.json`);
            this.currentMachineIdPromise = serviceMachineId_1.getServiceMachineId(environmentService, fileService, storageService);
        }
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        isEnabled() { return this.userDataSyncResourceEnablementService.isResourceEnabled(this.resource); }
        async triggerLocalChange() {
            if (this.isEnabled()) {
                this.localChangeTriggerScheduler.schedule();
            }
        }
        async doTriggerLocalChange() {
            // Sync again if current status is in conflicts
            if (this.status === "hasConflicts" /* HasConflicts */) {
                this.logService.info(`${this.syncResourceLogLabel}: In conflicts state and local change detected. Syncing again...`);
                const preview = await this.syncPreviewPromise;
                this.syncPreviewPromise = null;
                const status = await this.performSync(preview.remoteUserData, preview.lastSyncUserData);
                this.setStatus(status);
            }
            // Check if local change causes remote change
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Checking for local changes...`);
                const lastSyncUserData = await this.getLastSyncUserData();
                const hasRemoteChanged = lastSyncUserData ? (await this.generatePreview(lastSyncUserData, lastSyncUserData, cancellation_1.CancellationToken.None)).hasRemoteChanged : true;
                if (hasRemoteChanged) {
                    this._onDidChangeLocal.fire();
                }
            }
        }
        setStatus(status) {
            if (this._status !== status) {
                const oldStatus = this._status;
                this._status = status;
                this._onDidChangStatus.fire(status);
                if (status === "hasConflicts" /* HasConflicts */) {
                    // Log to telemetry when there is a sync conflict
                    this.telemetryService.publicLog2('sync/conflictsDetected', { source: this.resource });
                }
                if (oldStatus === "hasConflicts" /* HasConflicts */ && status === "idle" /* Idle */) {
                    // Log to telemetry when conflicts are resolved
                    this.telemetryService.publicLog2('sync/conflictsResolved', { source: this.resource });
                }
                if (this.status !== "hasConflicts" /* HasConflicts */) {
                    this.setConflicts([]);
                }
            }
        }
        setConflicts(conflicts) {
            if (!arrays_1.equals(this._conflicts, conflicts, (a, b) => resources_1.isEqual(a.local, b.local) && resources_1.isEqual(a.remote, b.remote))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(this._conflicts);
            }
        }
        async pull() {
            if (!this.isEnabled()) {
                this.logService.info(`${this.syncResourceLogLabel}: Skipped pulling ${this.syncResourceLogLabel.toLowerCase()} as it is disabled.`);
                return;
            }
            await this.stop();
            try {
                this.logService.info(`${this.syncResourceLogLabel}: Started pulling ${this.syncResourceLogLabel.toLowerCase()}...`);
                this.setStatus("syncing" /* Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                const preview = await this.generatePullPreview(remoteUserData, lastSyncUserData, cancellation_1.CancellationToken.None);
                await this.applyPreview(preview, false);
                this.logService.info(`${this.syncResourceLogLabel}: Finished pulling ${this.syncResourceLogLabel.toLowerCase()}.`);
            }
            finally {
                this.setStatus("idle" /* Idle */);
            }
        }
        async push() {
            if (!this.isEnabled()) {
                this.logService.info(`${this.syncResourceLogLabel}: Skipped pushing ${this.syncResourceLogLabel.toLowerCase()} as it is disabled.`);
                return;
            }
            this.stop();
            try {
                this.logService.info(`${this.syncResourceLogLabel}: Started pushing ${this.syncResourceLogLabel.toLowerCase()}...`);
                this.setStatus("syncing" /* Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                const preview = await this.generatePushPreview(remoteUserData, lastSyncUserData, cancellation_1.CancellationToken.None);
                await this.applyPreview(preview, true);
                this.logService.info(`${this.syncResourceLogLabel}: Finished pushing ${this.syncResourceLogLabel.toLowerCase()}.`);
            }
            finally {
                this.setStatus("idle" /* Idle */);
            }
        }
        async sync(manifest, headers = {}) {
            try {
                this.syncHeaders = Object.assign({}, headers);
                if (!this.isEnabled()) {
                    if (this.status !== "idle" /* Idle */) {
                        await this.stop();
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is disabled.`);
                    return;
                }
                if (this.status === "hasConflicts" /* HasConflicts */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as there are conflicts.`);
                    return;
                }
                if (this.status === "syncing" /* Syncing */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is running already.`);
                    return;
                }
                this.logService.trace(`${this.syncResourceLogLabel}: Started synchronizing ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getLatestRemoteUserData(manifest, lastSyncUserData);
                let status = "idle" /* Idle */;
                try {
                    status = await this.performSync(remoteUserData, lastSyncUserData);
                    if (status === "hasConflicts" /* HasConflicts */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Detected conflicts while synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    else if (status === "idle" /* Idle */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Finished synchronizing ${this.resource.toLowerCase()}.`);
                    }
                }
                finally {
                    this.setStatus(status);
                }
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async replace(uri) {
            const content = await this.resolveContent(uri);
            if (!content) {
                return false;
            }
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return false;
            }
            await this.stop();
            try {
                this.logService.trace(`${this.syncResourceLogLabel}: Started resetting ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getLatestRemoteUserData(null, lastSyncUserData);
                const preview = await this.generateReplacePreview(syncData, remoteUserData, lastSyncUserData);
                await this.applyPreview(preview, false);
                this.logService.info(`${this.syncResourceLogLabel}: Finished resetting ${this.resource.toLowerCase()}.`);
            }
            finally {
                this.setStatus("idle" /* Idle */);
            }
            return true;
        }
        async getLatestRemoteUserData(manifest, lastSyncUserData) {
            if (lastSyncUserData) {
                const latestRef = manifest && manifest.latest ? manifest.latest[this.resource] : undefined;
                // Last time synced resource and latest resource on server are same
                if (lastSyncUserData.ref === latestRef) {
                    return lastSyncUserData;
                }
                // There is no resource on server and last time it was synced with no resource
                if (latestRef === undefined && lastSyncUserData.syncData === null) {
                    return lastSyncUserData;
                }
            }
            return this.getRemoteUserData(lastSyncUserData);
        }
        async generateSyncPreview() {
            if (this.isEnabled()) {
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                return this.generatePreview(remoteUserData, lastSyncUserData, cancellation_1.CancellationToken.None);
            }
            return null;
        }
        async performSync(remoteUserData, lastSyncUserData) {
            if (remoteUserData.syncData && remoteUserData.syncData.version > this.version) {
                // current version is not compatible with cloud version
                this.telemetryService.publicLog2('sync/incompatible', { source: this.resource });
                throw new userDataSync_1.UserDataSyncError(nls_1.localize({ key: 'incompatible', comment: ['This is an error while syncing a resource that its local version is not compatible with its remote version.'] }, "Cannot sync {0} as its local version {1} is not compatible with its remote version {2}", this.resource, this.version, remoteUserData.syncData.version), userDataSync_1.UserDataSyncErrorCode.Incompatible, this.resource);
            }
            try {
                return await this.doSync(remoteUserData, lastSyncUserData);
            }
            catch (e) {
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case userDataSync_1.UserDataSyncErrorCode.LocalPreconditionFailed:
                            // Rejected as there is a new local version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize ${this.syncResourceLogLabel} as there is a new local version available. Synchronizing again...`);
                            return this.performSync(remoteUserData, lastSyncUserData);
                        case userDataSync_1.UserDataSyncErrorCode.PreconditionFailed:
                            // Rejected as there is a new remote version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize as there is a new remote version available. Synchronizing again...`);
                            // Avoid cache and get latest remote user data - https://github.com/microsoft/vscode/issues/90624
                            remoteUserData = await this.getRemoteUserData(null);
                            // Get the latest last sync user data. Because multiples parallel syncs (in Web) could share same last sync data
                            // and one of them successfully updated remote and last sync state.
                            lastSyncUserData = await this.getLastSyncUserData();
                            return this.performSync(remoteUserData, lastSyncUserData);
                    }
                }
                throw e;
            }
        }
        async doSync(remoteUserData, lastSyncUserData) {
            try {
                // generate or use existing preview
                if (!this.syncPreviewPromise) {
                    this.syncPreviewPromise = async_1.createCancelablePromise(token => this.generatePreview(remoteUserData, lastSyncUserData, token));
                }
                const preview = await this.syncPreviewPromise;
                if (preview.hasConflicts) {
                    return "hasConflicts" /* HasConflicts */;
                }
                // apply preview
                await this.applyPreview(preview, false);
                // reset preview
                this.syncPreviewPromise = null;
                return "idle" /* Idle */;
            }
            catch (error) {
                // reset preview on error
                this.syncPreviewPromise = null;
                throw error;
            }
        }
        async getSyncPreviewInProgress() {
            return this.syncPreviewPromise ? this.syncPreviewPromise : null;
        }
        async acceptConflict(conflictUri, conflictContent) {
            let preview = await this.getSyncPreviewInProgress();
            if (!preview || !preview.hasConflicts) {
                return;
            }
            this.syncPreviewPromise = async_1.createCancelablePromise(token => this.updatePreviewWithConflict(preview, conflictUri, conflictContent, token));
            preview = await this.syncPreviewPromise;
            if (!preview.hasConflicts) {
                // apply preview
                await this.applyPreview(preview, false);
                // reset preview
                this.syncPreviewPromise = null;
                this.setStatus("idle" /* Idle */);
            }
        }
        async hasPreviouslySynced() {
            const lastSyncData = await this.getLastSyncUserData();
            return !!lastSyncData;
        }
        async isLastSyncFromCurrentMachine(remoteUserData) {
            var _a;
            const machineId = await this.currentMachineIdPromise;
            return !!((_a = remoteUserData.syncData) === null || _a === void 0 ? void 0 : _a.machineId) && remoteUserData.syncData.machineId === machineId;
        }
        async getRemoteSyncResourceHandles() {
            const handles = await this.userDataSyncStoreService.getAllRefs(this.resource);
            return handles.map(({ created, ref }) => ({ created, uri: this.toRemoteBackupResource(ref) }));
        }
        async getLocalSyncResourceHandles() {
            const handles = await this.userDataSyncBackupStoreService.getAllRefs(this.resource);
            return handles.map(({ created, ref }) => ({ created, uri: this.toLocalBackupResource(ref) }));
        }
        toRemoteBackupResource(ref) {
            return uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote-backup', path: `/${this.resource}/${ref}` });
        }
        toLocalBackupResource(ref) {
            return uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local-backup', path: `/${this.resource}/${ref}` });
        }
        async getMachineId({ uri }) {
            const ref = resources_1.basename(uri);
            if (resources_1.isEqual(uri, this.toRemoteBackupResource(ref))) {
                const { content } = await this.getUserData(ref);
                if (content) {
                    const syncData = this.parseSyncData(content);
                    return syncData === null || syncData === void 0 ? void 0 : syncData.machineId;
                }
            }
            return undefined;
        }
        async resolveContent(uri) {
            const ref = resources_1.basename(uri);
            if (resources_1.isEqual(uri, this.toRemoteBackupResource(ref))) {
                const { content } = await this.getUserData(ref);
                return content;
            }
            if (resources_1.isEqual(uri, this.toLocalBackupResource(ref))) {
                return this.userDataSyncBackupStoreService.resolveContent(this.resource, ref);
            }
            return null;
        }
        async resetLocal() {
            try {
                await this.fileService.del(this.lastSyncResource);
            }
            catch (e) { /* ignore */ }
        }
        async getLastSyncUserData() {
            try {
                const content = await this.fileService.readFile(this.lastSyncResource);
                const parsed = JSON.parse(content.value.toString());
                const userData = parsed;
                if (userData.content === null) {
                    return { ref: parsed.ref, syncData: null };
                }
                const syncData = JSON.parse(userData.content);
                /* Check if syncData is of expected type. Return only if matches */
                if (isSyncData(syncData)) {
                    return Object.assign(Object.assign({}, parsed), { syncData, content: undefined });
                }
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FILE_NOT_FOUND */)) {
                    // log error always except when file does not exist
                    this.logService.error(error);
                }
            }
            return null;
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            const lastSyncUserData = Object.assign({ ref: lastSyncRemoteUserData.ref, content: lastSyncRemoteUserData.syncData ? JSON.stringify(lastSyncRemoteUserData.syncData) : null }, additionalProps);
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncUserData)));
        }
        async getRemoteUserData(lastSyncData) {
            const { ref, content } = await this.getUserData(lastSyncData);
            let syncData = null;
            if (content !== null) {
                syncData = this.parseSyncData(content);
            }
            return { ref, syncData };
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            throw new userDataSync_1.UserDataSyncError(nls_1.localize('incompatible sync data', "Cannot parse sync data as it is not compatible with current version."), userDataSync_1.UserDataSyncErrorCode.Incompatible, this.resource);
        }
        async getUserData(refOrLastSyncData) {
            if (types_1.isString(refOrLastSyncData)) {
                const content = await this.userDataSyncStoreService.resolveContent(this.resource, refOrLastSyncData);
                return { ref: refOrLastSyncData, content };
            }
            else {
                const lastSyncUserData = refOrLastSyncData ? { ref: refOrLastSyncData.ref, content: refOrLastSyncData.syncData ? JSON.stringify(refOrLastSyncData.syncData) : null } : null;
                return this.userDataSyncStoreService.read(this.resource, lastSyncUserData, this.syncHeaders);
            }
        }
        async updateRemoteUserData(content, ref) {
            const machineId = await this.currentMachineIdPromise;
            const syncData = { version: this.version, machineId, content };
            ref = await this.userDataSyncStoreService.write(this.resource, JSON.stringify(syncData), ref, this.syncHeaders);
            return { ref, syncData };
        }
        async backupLocal(content) {
            const syncData = { version: this.version, content };
            return this.userDataSyncBackupStoreService.backup(this.resource, JSON.stringify(syncData));
        }
        async stop() {
            this.logService.info(`${this.syncResourceLogLabel}: Stopped synchronizing ${this.resource.toLowerCase()}.`);
            if (this.syncPreviewPromise) {
                this.syncPreviewPromise.cancel();
                this.syncPreviewPromise = null;
            }
            this.setStatus("idle" /* Idle */);
        }
    };
    AbstractSynchroniser = __decorate([
        __param(1, files_1.IFileService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, storage_1.IStorageService),
        __param(4, userDataSync_1.IUserDataSyncStoreService),
        __param(5, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(6, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, userDataSync_1.IUserDataSyncLogService),
        __param(9, configuration_1.IConfigurationService)
    ], AbstractSynchroniser);
    exports.AbstractSynchroniser = AbstractSynchroniser;
    let AbstractFileSynchroniser = class AbstractFileSynchroniser extends AbstractSynchroniser {
        constructor(file, resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, configurationService) {
            super(resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, configurationService);
            this.file = file;
            this._register(this.fileService.watch(resources_1.dirname(file)));
            this._register(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
        }
        async stop() {
            await super.stop();
            try {
                await this.fileService.del(this.localPreviewResource);
            }
            catch (e) { /* ignore */ }
        }
        async getConflictContent(conflictResource) {
            if (resources_1.isEqual(this.remotePreviewResource, conflictResource) || resources_1.isEqual(this.localPreviewResource, conflictResource)) {
                const syncPreview = await this.getSyncPreviewInProgress();
                if (syncPreview) {
                    if (resources_1.isEqual(this.remotePreviewResource, conflictResource)) {
                        return syncPreview.remoteUserData && syncPreview.remoteUserData.syncData ? syncPreview.remoteUserData.syncData.content : null;
                    }
                    if (resources_1.isEqual(this.localPreviewResource, conflictResource)) {
                        return syncPreview.fileContent ? syncPreview.fileContent.value.toString() : null;
                    }
                }
            }
            return null;
        }
        async getLocalFileContent() {
            try {
                return await this.fileService.readFile(this.file);
            }
            catch (error) {
                return null;
            }
        }
        async updateLocalFileContent(newContent, oldContent) {
            try {
                if (oldContent) {
                    // file exists already
                    await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(newContent), oldContent);
                }
                else {
                    // file does not exist
                    await this.fileService.createFile(this.file, buffer_1.VSBuffer.fromString(newContent), { overwrite: false });
                }
            }
            catch (e) {
                if ((e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FILE_NOT_FOUND */) ||
                    (e instanceof files_1.FileOperationError && e.fileOperationResult === 3 /* FILE_MODIFIED_SINCE */)) {
                    throw new userDataSync_1.UserDataSyncError(e.message, userDataSync_1.UserDataSyncErrorCode.LocalPreconditionFailed);
                }
                else {
                    throw e;
                }
            }
        }
        onFileChanges(e) {
            if (!e.contains(this.file)) {
                return;
            }
            this.triggerLocalChange();
        }
    };
    AbstractFileSynchroniser = __decorate([
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(7, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, configuration_1.IConfigurationService)
    ], AbstractFileSynchroniser);
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser;
    let AbstractJsonFileSynchroniser = class AbstractJsonFileSynchroniser extends AbstractFileSynchroniser {
        constructor(file, resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService) {
            super(file, resource, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, configurationService);
            this.userDataSyncUtilService = userDataSyncUtilService;
            this._formattingOptions = undefined;
        }
        hasErrors(content) {
            const parseErrors = [];
            json_1.parse(content, parseErrors, { allowEmptyContent: true, allowTrailingComma: true });
            return parseErrors.length > 0;
        }
        getFormattingOptions() {
            if (!this._formattingOptions) {
                this._formattingOptions = this.userDataSyncUtilService.resolveFormattingOptions(this.file);
            }
            return this._formattingOptions;
        }
    };
    AbstractJsonFileSynchroniser = __decorate([
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(7, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, userDataSync_1.IUserDataSyncUtilService),
        __param(11, configuration_1.IConfigurationService)
    ], AbstractJsonFileSynchroniser);
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser;
});
//# __sourceMappingURL=abstractSynchronizer.js.map