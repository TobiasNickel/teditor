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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/base/common/errorMessage", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/settingsSync", "vs/base/common/resources", "vs/platform/userDataSync/common/snippetsSync", "vs/base/common/cancellation", "vs/base/common/uuid"], function (require, exports, userDataSync_1, lifecycle_1, instantiation_1, event_1, extensionsSync_1, keybindingsSync_1, globalStateSync_1, errorMessage_1, telemetry_1, arrays_1, storage_1, settingsSync_1, resources_1, snippetsSync_1, cancellation_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncService = void 0;
    const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';
    let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
        constructor(userDataSyncStoreService, instantiationService, logService, telemetryService, storageService) {
            super();
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this._status = "uninitialized" /* Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._onSynchronizeResource = this._register(new event_1.Emitter());
            this.onSynchronizeResource = this._onSynchronizeResource.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._syncErrors = [];
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this.recoveredSettings = false;
            this.settingsSynchroniser = this._register(this.instantiationService.createInstance(settingsSync_1.SettingsSynchroniser));
            this.keybindingsSynchroniser = this._register(this.instantiationService.createInstance(keybindingsSync_1.KeybindingsSynchroniser));
            this.snippetsSynchroniser = this._register(this.instantiationService.createInstance(snippetsSync_1.SnippetsSynchroniser));
            this.globalStateSynchroniser = this._register(this.instantiationService.createInstance(globalStateSync_1.GlobalStateSynchroniser));
            this.extensionsSynchroniser = this._register(this.instantiationService.createInstance(extensionsSync_1.ExtensionsSynchroniser));
            this.synchronisers = [this.settingsSynchroniser, this.keybindingsSynchroniser, this.snippetsSynchroniser, this.globalStateSynchroniser, this.extensionsSynchroniser];
            this.updateStatus();
            if (this.userDataSyncStoreService.userDataSyncStore) {
                this._register(event_1.Event.any(...this.synchronisers.map(s => event_1.Event.map(s.onDidChangeStatus, () => undefined)))(() => this.updateStatus()));
                this._register(event_1.Event.any(...this.synchronisers.map(s => event_1.Event.map(s.onDidChangeConflicts, () => undefined)))(() => this.updateConflicts()));
            }
            this._lastSyncTime = this.storageService.getNumber(LAST_SYNC_TIME_KEY, 0 /* GLOBAL */, undefined);
            this.onDidChangeLocal = event_1.Event.any(...this.synchronisers.map(s => event_1.Event.map(s.onDidChangeLocal, () => s.resource)));
        }
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        async pull() {
            await this.checkEnablement();
            try {
                for (const synchroniser of this.synchronisers) {
                    try {
                        this._onSynchronizeResource.fire(synchroniser.resource);
                        await synchroniser.pull();
                    }
                    catch (e) {
                        this.handleSynchronizerError(e, synchroniser.resource);
                    }
                }
                this.updateLastSyncTime();
            }
            catch (error) {
                if (error instanceof userDataSync_1.UserDataSyncError) {
                    this.telemetryService.publicLog2(`sync/error/${error.code}`, { resource: error.resource });
                }
                throw error;
            }
        }
        async push() {
            await this.checkEnablement();
            try {
                for (const synchroniser of this.synchronisers) {
                    try {
                        await synchroniser.push();
                    }
                    catch (e) {
                        this.handleSynchronizerError(e, synchroniser.resource);
                    }
                }
                this.updateLastSyncTime();
            }
            catch (error) {
                if (error instanceof userDataSync_1.UserDataSyncError) {
                    this.telemetryService.publicLog2(`sync/error/${error.code}`, { resource: error.resource });
                }
                throw error;
            }
        }
        async sync() {
            const syncTask = await this.createSyncTask();
            return syncTask.run(cancellation_1.CancellationToken.None);
        }
        async createSyncTask() {
            this.telemetryService.publicLog2('sync/getmanifest');
            const syncHeaders = { 'X-Execution-Id': uuid_1.generateUuid() };
            const manifest = await this.userDataSyncStoreService.manifest(syncHeaders);
            let executed = false;
            const that = this;
            return {
                manifest,
                run(token) {
                    if (executed) {
                        throw new Error('Can run a task only once');
                    }
                    return that.doSync(manifest, syncHeaders, token);
                }
            };
        }
        async doSync(manifest, syncHeaders, token) {
            await this.checkEnablement();
            if (!this.recoveredSettings) {
                await this.settingsSynchroniser.recoverSettings();
                this.recoveredSettings = true;
            }
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return;
            }
            const startTime = new Date().getTime();
            this._syncErrors = [];
            try {
                this.logService.trace('Sync started.');
                if (this.status !== "hasConflicts" /* HasConflicts */) {
                    this.setStatus("syncing" /* Syncing */);
                }
                for (const synchroniser of this.synchronisers) {
                    // Return if cancellation is requested
                    if (token.isCancellationRequested) {
                        return;
                    }
                    try {
                        this._onSynchronizeResource.fire(synchroniser.resource);
                        await synchroniser.sync(manifest, syncHeaders);
                    }
                    catch (e) {
                        this.handleSynchronizerError(e, synchroniser.resource);
                        this._syncErrors.push([synchroniser.resource, userDataSync_1.UserDataSyncError.toUserDataSyncError(e)]);
                    }
                }
                this.logService.info(`Sync done. Took ${new Date().getTime() - startTime}ms`);
                this.updateLastSyncTime();
            }
            catch (error) {
                if (error instanceof userDataSync_1.UserDataSyncError) {
                    this.telemetryService.publicLog2(`sync/error/${error.code}`, { resource: error.resource });
                }
                throw error;
            }
            finally {
                this.updateStatus();
                this._onSyncErrors.fire(this._syncErrors);
            }
        }
        async replace(uri) {
            await this.checkEnablement();
            for (const synchroniser of this.synchronisers) {
                if (await synchroniser.replace(uri)) {
                    return;
                }
            }
        }
        async stop() {
            await this.checkEnablement();
            if (this.status === "idle" /* Idle */) {
                return;
            }
            for (const synchroniser of this.synchronisers) {
                try {
                    if (synchroniser.status !== "idle" /* Idle */) {
                        await synchroniser.stop();
                    }
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
        }
        async acceptConflict(conflict, content) {
            await this.checkEnablement();
            const syncResourceConflict = this.conflicts.filter(({ conflicts }) => conflicts.some(({ local, remote }) => resources_1.isEqual(conflict, local) || resources_1.isEqual(conflict, remote)))[0];
            if (syncResourceConflict) {
                const synchroniser = this.getSynchroniser(syncResourceConflict.syncResource);
                await synchroniser.acceptConflict(conflict, content);
            }
        }
        async resolveContent(resource) {
            for (const synchroniser of this.synchronisers) {
                const content = await synchroniser.resolveContent(resource);
                if (content) {
                    return content;
                }
            }
            return null;
        }
        getRemoteSyncResourceHandles(resource) {
            return this.getSynchroniser(resource).getRemoteSyncResourceHandles();
        }
        getLocalSyncResourceHandles(resource) {
            return this.getSynchroniser(resource).getLocalSyncResourceHandles();
        }
        getAssociatedResources(resource, syncResourceHandle) {
            return this.getSynchroniser(resource).getAssociatedResources(syncResourceHandle);
        }
        getMachineId(resource, syncResourceHandle) {
            return this.getSynchroniser(resource).getMachineId(syncResourceHandle);
        }
        async isFirstTimeSyncingWithAnotherMachine() {
            await this.checkEnablement();
            if (!await this.userDataSyncStoreService.manifest()) {
                return false;
            }
            // skip global state synchronizer
            const synchronizers = [this.settingsSynchroniser, this.keybindingsSynchroniser, this.snippetsSynchroniser, this.extensionsSynchroniser];
            let hasLocalData = false;
            for (const synchroniser of synchronizers) {
                if (await synchroniser.hasLocalData()) {
                    hasLocalData = true;
                    break;
                }
            }
            if (!hasLocalData) {
                return false;
            }
            for (const synchroniser of synchronizers) {
                const preview = await synchroniser.generateSyncPreview();
                if (preview && !preview.isLastSyncFromCurrentMachine && (preview.hasLocalChanged || preview.hasRemoteChanged)) {
                    return true;
                }
            }
            return false;
        }
        async reset() {
            await this.checkEnablement();
            await this.resetRemote();
            await this.resetLocal();
        }
        async resetLocal() {
            await this.checkEnablement();
            this.storageService.remove(LAST_SYNC_TIME_KEY, 0 /* GLOBAL */);
            for (const synchroniser of this.synchronisers) {
                try {
                    await synchroniser.resetLocal();
                }
                catch (e) {
                    this.logService.error(`${synchroniser.resource}: ${errorMessage_1.toErrorMessage(e)}`);
                    this.logService.error(e);
                }
            }
            this.logService.info('Did reset the local sync state.');
        }
        async hasPreviouslySynced() {
            for (const synchroniser of this.synchronisers) {
                if (await synchroniser.hasPreviouslySynced()) {
                    return true;
                }
            }
            return false;
        }
        async resetRemote() {
            await this.checkEnablement();
            try {
                await this.userDataSyncStoreService.clear();
                this.logService.info('Cleared data on server');
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        setStatus(status) {
            const oldStatus = this._status;
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
                if (oldStatus === "hasConflicts" /* HasConflicts */) {
                    this.updateLastSyncTime();
                }
            }
        }
        updateStatus() {
            this.updateConflicts();
            const status = this.computeStatus();
            this.setStatus(status);
        }
        updateConflicts() {
            const conflicts = this.computeConflicts();
            if (!arrays_1.equals(this._conflicts, conflicts, (a, b) => a.syncResource === b.syncResource && arrays_1.equals(a.conflicts, b.conflicts, (a, b) => resources_1.isEqual(a.local, b.local) && resources_1.isEqual(a.remote, b.remote)))) {
                this._conflicts = this.computeConflicts();
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        computeStatus() {
            if (!this.userDataSyncStoreService.userDataSyncStore) {
                return "uninitialized" /* Uninitialized */;
            }
            if (this.synchronisers.some(s => s.status === "hasConflicts" /* HasConflicts */)) {
                return "hasConflicts" /* HasConflicts */;
            }
            if (this.synchronisers.some(s => s.status === "syncing" /* Syncing */)) {
                return "syncing" /* Syncing */;
            }
            return "idle" /* Idle */;
        }
        updateLastSyncTime() {
            if (this.status === "idle" /* Idle */) {
                this._lastSyncTime = new Date().getTime();
                this.storageService.store(LAST_SYNC_TIME_KEY, this._lastSyncTime, 0 /* GLOBAL */);
                this._onDidChangeLastSyncTime.fire(this._lastSyncTime);
            }
        }
        handleSynchronizerError(e, source) {
            if (e instanceof userDataSync_1.UserDataSyncError) {
                switch (e.code) {
                    case userDataSync_1.UserDataSyncErrorCode.TooLarge:
                        throw new userDataSync_1.UserDataSyncError(e.message, e.code, source);
                    case userDataSync_1.UserDataSyncErrorCode.TooManyRequests:
                    case userDataSync_1.UserDataSyncErrorCode.LocalTooManyRequests:
                    case userDataSync_1.UserDataSyncErrorCode.Gone:
                    case userDataSync_1.UserDataSyncErrorCode.UpgradeRequired:
                    case userDataSync_1.UserDataSyncErrorCode.Incompatible:
                        throw e;
                }
            }
            this.logService.error(e);
            this.logService.error(`${source}: ${errorMessage_1.toErrorMessage(e)}`);
        }
        computeConflicts() {
            return this.synchronisers.filter(s => s.status === "hasConflicts" /* HasConflicts */)
                .map(s => ({ syncResource: s.resource, conflicts: s.conflicts }));
        }
        getSynchroniser(source) {
            return this.synchronisers.filter(s => s.resource === source)[0];
        }
        async checkEnablement() {
            if (!this.userDataSyncStoreService.userDataSyncStore) {
                throw new Error('Not enabled');
            }
        }
    };
    UserDataSyncService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, storage_1.IStorageService)
    ], UserDataSyncService);
    exports.UserDataSyncService = UserDataSyncService;
});
//# __sourceMappingURL=userDataSyncService.js.map