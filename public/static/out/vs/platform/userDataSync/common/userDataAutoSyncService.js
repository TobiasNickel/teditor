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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/telemetry/common/telemetry", "vs/base/common/errors", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/nls"], function (require, exports, async_1, event_1, lifecycle_1, userDataSync_1, userDataSyncAccount_1, telemetry_1, errors_1, storage_1, environment_1, userDataSyncMachines_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = exports.UserDataAutoSyncEnablementService = void 0;
    const enablementKey = 'sync.enable';
    const disableMachineEventuallyKey = 'sync.disableMachineEventually';
    const sessionIdKey = 'sync.sessionId';
    let UserDataAutoSyncEnablementService = class UserDataAutoSyncEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, environmentService) {
            super();
            this.storageService = storageService;
            this.environmentService = environmentService;
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._register(storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
        }
        isEnabled() {
            switch (this.environmentService.sync) {
                case 'on':
                    return true;
                case 'off':
                    return false;
            }
            return this.storageService.getBoolean(enablementKey, 0 /* GLOBAL */, this.environmentService.enableSyncByDefault);
        }
        canToggleEnablement() {
            return this.environmentService.sync === undefined;
        }
        onDidStorageChange(workspaceStorageChangeEvent) {
            if (workspaceStorageChangeEvent.scope === 0 /* GLOBAL */) {
                if (enablementKey === workspaceStorageChangeEvent.key) {
                    this._onDidChangeEnablement.fire(this.isEnabled());
                }
            }
        }
    };
    UserDataAutoSyncEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, environment_1.IEnvironmentService)
    ], UserDataAutoSyncEnablementService);
    exports.UserDataAutoSyncEnablementService = UserDataAutoSyncEnablementService;
    let UserDataAutoSyncService = class UserDataAutoSyncService extends UserDataAutoSyncEnablementService {
        constructor(userDataSyncStoreService, userDataSyncResourceEnablementService, userDataSyncService, logService, userDataSyncAccountService, telemetryService, userDataSyncMachinesService, storageService, environmentService) {
            super(storageService, environmentService);
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncResourceEnablementService = userDataSyncResourceEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.logService = logService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.telemetryService = telemetryService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.autoSync = this._register(new lifecycle_1.MutableDisposable());
            this.successiveFailures = 0;
            this.lastSyncTriggerTime = undefined;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._onTurnOnSync = this._register(new event_1.Emitter());
            this.onTurnOnSync = this._onTurnOnSync.event;
            this._onDidTurnOnSync = this._register(new event_1.Emitter());
            this.onDidTurnOnSync = this._onDidTurnOnSync.event;
            this.sources = [];
            this.syncTriggerDelayer = this._register(new async_1.Delayer(0));
            if (userDataSyncStoreService.userDataSyncStore) {
                this.updateAutoSync();
                if (this.hasToDisableMachineEventually()) {
                    this.disableMachineEventually();
                }
                this._register(userDataSyncAccountService.onDidChangeAccount(() => this.updateAutoSync()));
                this._register(event_1.Event.debounce(userDataSyncService.onDidChangeLocal, (last, source) => last ? [...last, source] : [source], 1000)(sources => this.triggerSync(sources, false)));
                this._register(event_1.Event.filter(this.userDataSyncResourceEnablementService.onDidChangeResourceEnablement, ([, enabled]) => enabled)(() => this.triggerSync(['resourceEnablement'], false)));
            }
        }
        updateAutoSync() {
            const { enabled, reason } = this.isAutoSyncEnabled();
            if (enabled) {
                if (this.autoSync.value === undefined) {
                    this.autoSync.value = new AutoSync(1000 * 60 * 5 /* 5 miutes */, this.userDataSyncStoreService, this.userDataSyncService, this.userDataSyncMachinesService, this.logService, this.storageService);
                    this.autoSync.value.register(this.autoSync.value.onDidStartSync(() => this.lastSyncTriggerTime = new Date().getTime()));
                    this.autoSync.value.register(this.autoSync.value.onDidFinishSync(e => this.onDidFinishSync(e)));
                    if (this.startAutoSync()) {
                        this.autoSync.value.start();
                    }
                }
            }
            else {
                this.syncTriggerDelayer.cancel();
                if (this.autoSync.value !== undefined) {
                    this.logService.info('Auto Sync: Disabled because', reason);
                    this.autoSync.clear();
                }
            }
        }
        // For tests purpose only
        startAutoSync() { return true; }
        isAutoSyncEnabled() {
            if (!this.isEnabled()) {
                return { enabled: false, reason: 'sync is disabled' };
            }
            if (!this.userDataSyncAccountService.account) {
                return { enabled: false, reason: 'token is not avaialable' };
            }
            return { enabled: true };
        }
        async turnOn(pullFirst) {
            this._onTurnOnSync.fire();
            try {
                this.stopDisableMachineEventually();
                if (pullFirst) {
                    await this.userDataSyncService.pull();
                }
                else {
                    await this.userDataSyncService.sync();
                }
                this.setEnablement(true);
                this._onDidTurnOnSync.fire(undefined);
            }
            catch (error) {
                this._onDidTurnOnSync.fire(error);
                throw error;
            }
        }
        async turnOff(everywhere, softTurnOffOnError, donotRemoveMachine) {
            try {
                // Remove machine
                if (!donotRemoveMachine) {
                    await this.userDataSyncMachinesService.removeCurrentMachine();
                }
                // Disable Auto Sync
                this.setEnablement(false);
                // Reset Session
                this.storageService.remove(sessionIdKey, 0 /* GLOBAL */);
                // Reset
                if (everywhere) {
                    this.telemetryService.publicLog2('sync/turnOffEveryWhere');
                    await this.userDataSyncService.reset();
                }
                else {
                    await this.userDataSyncService.resetLocal();
                }
            }
            catch (error) {
                if (softTurnOffOnError) {
                    this.logService.error(error);
                    this.setEnablement(false);
                }
                else {
                    throw error;
                }
            }
        }
        setEnablement(enabled) {
            if (this.isEnabled() !== enabled) {
                this.telemetryService.publicLog2(enablementKey, { enabled });
                this.storageService.store(enablementKey, enabled, 0 /* GLOBAL */);
                this.updateAutoSync();
            }
        }
        async onDidFinishSync(error) {
            if (!error) {
                // Sync finished without errors
                this.successiveFailures = 0;
                return;
            }
            // Error while syncing
            const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
            // Log to telemetry
            if (userDataSyncError instanceof userDataSync_1.UserDataAutoSyncError) {
                this.telemetryService.publicLog2(`autosync/error`, { code: userDataSyncError.code });
            }
            // Turned off from another device or session got expired
            if (userDataSyncError.code === userDataSync_1.UserDataSyncErrorCode.TurnedOff || userDataSyncError.code === userDataSync_1.UserDataSyncErrorCode.SessionExpired) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because sync is turned off in the cloud');
            }
            // Exceeded Rate Limit
            else if (userDataSyncError.code === userDataSync_1.UserDataSyncErrorCode.LocalTooManyRequests || userDataSyncError.code === userDataSync_1.UserDataSyncErrorCode.TooManyRequests) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with TooManyRequests */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because of making too many requests to server');
            }
            else {
                this.logService.error(userDataSyncError);
                this.successiveFailures++;
            }
            this._onError.fire(userDataSyncError);
        }
        async disableMachineEventually() {
            this.storageService.store(disableMachineEventuallyKey, true, 0 /* GLOBAL */);
            await async_1.timeout(1000 * 60 * 10);
            // Return if got stopped meanwhile.
            if (!this.hasToDisableMachineEventually()) {
                return;
            }
            this.stopDisableMachineEventually();
            // disable only if sync is disabled
            if (!this.isEnabled() && this.userDataSyncAccountService.account) {
                await this.userDataSyncMachinesService.removeCurrentMachine();
            }
        }
        hasToDisableMachineEventually() {
            return this.storageService.getBoolean(disableMachineEventuallyKey, 0 /* GLOBAL */, false);
        }
        stopDisableMachineEventually() {
            this.storageService.remove(disableMachineEventuallyKey, 0 /* GLOBAL */);
        }
        async triggerSync(sources, skipIfSyncedRecently) {
            if (this.autoSync.value === undefined) {
                return this.syncTriggerDelayer.cancel();
            }
            if (skipIfSyncedRecently && this.lastSyncTriggerTime
                && Math.round((new Date().getTime() - this.lastSyncTriggerTime) / 1000) < 10) {
                this.logService.debug('Auto Sync: Skipped. Limited to once per 10 seconds.');
                return;
            }
            this.sources.push(...sources);
            return this.syncTriggerDelayer.trigger(async () => {
                this.logService.trace('activity sources', ...this.sources);
                this.telemetryService.publicLog2('sync/triggered', { sources: this.sources });
                this.sources = [];
                if (this.autoSync.value) {
                    await this.autoSync.value.sync('Activity');
                }
            }, this.successiveFailures
                ? this.getSyncTriggerDelayTime() * 1 * Math.min(Math.pow(2, this.successiveFailures), 60) /* Delay exponentially until max 1 minute */
                : this.getSyncTriggerDelayTime());
        }
        getSyncTriggerDelayTime() {
            return 1000; /* Debounce for a second if there are no failures */
        }
    };
    UserDataAutoSyncService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(2, userDataSync_1.IUserDataSyncService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(7, storage_1.IStorageService),
        __param(8, environment_1.IEnvironmentService)
    ], UserDataAutoSyncService);
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    class AutoSync extends lifecycle_1.Disposable {
        constructor(interval /* in milliseconds */, userDataSyncStoreService, userDataSyncService, userDataSyncMachinesService, logService, storageService) {
            super();
            this.interval = interval;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.logService = logService;
            this.storageService = storageService;
            this.intervalHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidStartSync = this._register(new event_1.Emitter());
            this.onDidStartSync = this._onDidStartSync.event;
            this._onDidFinishSync = this._register(new event_1.Emitter());
            this.onDidFinishSync = this._onDidFinishSync.event;
        }
        start() {
            this._register(this.onDidFinishSync(() => this.waitUntilNextIntervalAndSync()));
            this._register(lifecycle_1.toDisposable(() => {
                if (this.syncPromise) {
                    this.syncPromise.cancel();
                    this.logService.info('Auto sync: Canelled sync that is in progress');
                    this.syncPromise = undefined;
                }
                this.userDataSyncService.stop();
                this.logService.info('Auto Sync: Stopped');
            }));
            this.logService.info('Auto Sync: Started');
            this.sync(AutoSync.INTERVAL_SYNCING);
        }
        waitUntilNextIntervalAndSync() {
            this.intervalHandler.value = async_1.disposableTimeout(() => this.sync(AutoSync.INTERVAL_SYNCING), this.interval);
        }
        sync(reason) {
            const syncPromise = async_1.createCancelablePromise(async (token) => {
                if (this.syncPromise) {
                    try {
                        // Wait until existing sync is finished
                        this.logService.debug('Auto Sync: Waiting until sync is finished.');
                        await this.syncPromise;
                    }
                    catch (error) {
                        if (errors_1.isPromiseCanceledError(error)) {
                            // Cancelled => Disposed. Donot continue sync.
                            return;
                        }
                    }
                }
                return this.doSync(reason, token);
            });
            this.syncPromise = syncPromise;
            this.syncPromise.finally(() => this.syncPromise = undefined);
            return this.syncPromise;
        }
        async doSync(reason, token) {
            this.logService.info(`Auto Sync: Triggered by ${reason}`);
            this._onDidStartSync.fire();
            let error;
            try {
                const syncTask = await this.userDataSyncService.createSyncTask();
                let manifest = syncTask.manifest;
                // Server has no data but this machine was synced before
                if (manifest === null && await this.userDataSyncService.hasPreviouslySynced()) {
                    // Sync was turned off in the cloud
                    throw new userDataSync_1.UserDataAutoSyncError(nls_1.localize('turned off', "Cannot sync because syncing is turned off in the cloud"), userDataSync_1.UserDataSyncErrorCode.TurnedOff);
                }
                const sessionId = this.storageService.get(sessionIdKey, 0 /* GLOBAL */);
                // Server session is different from client session
                if (sessionId && manifest && sessionId !== manifest.session) {
                    throw new userDataSync_1.UserDataAutoSyncError(nls_1.localize('session expired', "Cannot sync because current session is expired"), userDataSync_1.UserDataSyncErrorCode.SessionExpired);
                }
                const machines = await this.userDataSyncMachinesService.getMachines(manifest || undefined);
                // Return if cancellation is requested
                if (token.isCancellationRequested) {
                    return;
                }
                const currentMachine = machines.find(machine => machine.isCurrent);
                // Check if sync was turned off from other machine
                if (currentMachine === null || currentMachine === void 0 ? void 0 : currentMachine.disabled) {
                    // Throw TurnedOff error
                    throw new userDataSync_1.UserDataAutoSyncError(nls_1.localize('turned off machine', "Cannot sync because syncing is turned off on this machine from another machine."), userDataSync_1.UserDataSyncErrorCode.TurnedOff);
                }
                await syncTask.run(token);
                // After syncing, get the manifest if it was not available before
                if (manifest === null) {
                    manifest = await this.userDataSyncStoreService.manifest();
                }
                // Update local session id
                if (manifest && manifest.session !== sessionId) {
                    this.storageService.store(sessionIdKey, manifest.session, 0 /* GLOBAL */);
                }
                // Return if cancellation is requested
                if (token.isCancellationRequested) {
                    return;
                }
                // Add current machine
                if (!currentMachine) {
                    await this.userDataSyncMachinesService.addCurrentMachine(manifest || undefined);
                }
            }
            catch (e) {
                this.logService.error(e);
                error = e;
            }
            this._onDidFinishSync.fire(error);
        }
        register(t) {
            return super._register(t);
        }
    }
    AutoSync.INTERVAL_SYNCING = 'Interval';
});
//# __sourceMappingURL=userDataAutoSyncService.js.map