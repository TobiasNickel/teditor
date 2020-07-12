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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/map", "vs/workbench/services/authentication/browser/authenticationService", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/nls", "vs/base/common/errors", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/base/common/actions", "vs/platform/progress/common/progress"], function (require, exports, userDataSync_1, telemetry_1, extensions_1, userDataSync_2, lifecycle_1, event_1, arrays_1, map_1, authenticationService_1, userDataSyncAccount_1, quickInput_1, storage_1, log_1, productService_1, configuration_1, extensions_2, environmentService_1, nls_1, errors_1, notification_1, dialogs_1, contextkey_1, commands_1, actions_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchService = void 0;
    class UserDataSyncAccount {
        constructor(authenticationProviderId, session) {
            this.authenticationProviderId = authenticationProviderId;
            this.session = session;
        }
        get sessionId() { return this.session.id; }
        get accountName() { return this.session.account.displayName; }
        get accountId() { return this.session.account.id; }
        get token() { return this.session.accessToken; }
    }
    let UserDataSyncWorkbenchService = class UserDataSyncWorkbenchService extends lifecycle_1.Disposable {
        constructor(userDataSyncService, authenticationService, userDataSyncAccountService, quickInputService, storageService, userDataAutoSyncService, telemetryService, logService, productService, configurationService, extensionService, environmentService, notificationService, progressService, dialogService, commandService, contextKeyService) {
            var _a;
            super();
            this.userDataSyncService = userDataSyncService;
            this.authenticationService = authenticationService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.quickInputService = quickInputService;
            this.storageService = storageService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this._accountStatus = "uninitialized" /* Uninitialized */;
            this._onDidChangeAccountStatus = this._register(new event_1.Emitter());
            this.onDidChangeAccountStatus = this._onDidChangeAccountStatus.event;
            this._all = new Map();
            this._cachedCurrentSessionId = null;
            this.authenticationProviders = ((_a = userDataSync_1.getUserDataSyncStore(productService, configurationService)) === null || _a === void 0 ? void 0 : _a.authenticationProviders) || [];
            this.syncEnablementContext = userDataSync_2.CONTEXT_SYNC_ENABLEMENT.bindTo(contextKeyService);
            this.syncStatusContext = userDataSync_2.CONTEXT_SYNC_STATE.bindTo(contextKeyService);
            this.accountStatusContext = userDataSync_2.CONTEXT_ACCOUNT_STATE.bindTo(contextKeyService);
            if (this.authenticationProviders.length) {
                this.syncStatusContext.set(this.userDataSyncService.status);
                this._register(userDataSyncService.onDidChangeStatus(status => this.syncStatusContext.set(status)));
                this.syncEnablementContext.set(userDataAutoSyncService.isEnabled());
                this._register(userDataAutoSyncService.onDidChangeEnablement(enabled => this.syncEnablementContext.set(enabled)));
                extensionService.whenInstalledExtensionsRegistered().then(() => {
                    if (this.authenticationProviders.every(({ id }) => authenticationService.isAuthenticationProviderRegistered(id))) {
                        this.initialize();
                    }
                    else {
                        const disposable = this.authenticationService.onDidRegisterAuthenticationProvider(() => {
                            if (this.authenticationProviders.every(({ id }) => authenticationService.isAuthenticationProviderRegistered(id))) {
                                disposable.dispose();
                                this.initialize();
                            }
                        });
                    }
                });
            }
        }
        get accountStatus() { return this._accountStatus; }
        get all() { return arrays_1.flatten(map_1.values(this._all)); }
        get current() { return this.all.filter(account => this.isCurrentAccount(account))[0]; }
        async initialize() {
            var _a;
            if (this.currentSessionId === undefined && this.useWorkbenchSessionId && ((_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.authenticationSessionId)) {
                this.currentSessionId = this.environmentService.options.authenticationSessionId;
                this.useWorkbenchSessionId = false;
            }
            await this.update();
            this._register(event_1.Event.any(event_1.Event.filter(event_1.Event.any(this.authenticationService.onDidRegisterAuthenticationProvider, this.authenticationService.onDidUnregisterAuthenticationProvider), authenticationProviderId => this.isSupportedAuthenticationProviderId(authenticationProviderId)), event_1.Event.filter(this.userDataSyncAccountService.onTokenFailed, isSuccessive => !isSuccessive))(() => this.update()));
            this._register(event_1.Event.filter(this.authenticationService.onDidChangeSessions, e => this.isSupportedAuthenticationProviderId(e.providerId))(({ event }) => this.onDidChangeSessions(event)));
            this._register(this.storageService.onDidChangeStorage(e => this.onDidChangeStorage(e)));
            this._register(event_1.Event.filter(this.userDataSyncAccountService.onTokenFailed, isSuccessive => isSuccessive)(() => this.onDidSuccessiveAuthFailures()));
        }
        async update() {
            const allAccounts = new Map();
            for (const { id } of this.authenticationProviders) {
                const accounts = await this.getAccounts(id);
                allAccounts.set(id, accounts);
            }
            this._all = allAccounts;
            const current = this.current;
            await this.updateToken(current);
            this.updateAccountStatus(current);
        }
        async getAccounts(authenticationProviderId) {
            let accounts = new Map();
            let currentAccount = null;
            const sessions = await this.authenticationService.getSessions(authenticationProviderId) || [];
            for (const session of sessions) {
                const account = new UserDataSyncAccount(authenticationProviderId, session);
                accounts.set(account.accountName, account);
                if (this.isCurrentAccount(account)) {
                    currentAccount = account;
                }
            }
            if (currentAccount) {
                // Always use current account if available
                accounts.set(currentAccount.accountName, currentAccount);
            }
            return map_1.values(accounts);
        }
        async updateToken(current) {
            let value = undefined;
            if (current) {
                try {
                    this.logService.trace('Preferences Sync: Updating the token for the account', current.accountName);
                    const token = current.token;
                    this.logService.trace('Preferences Sync: Token updated for the account', current.accountName);
                    value = { token, authenticationProviderId: current.authenticationProviderId };
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            await this.userDataSyncAccountService.updateAccount(value);
        }
        updateAccountStatus(current) {
            // set status
            const accountStatus = current ? "available" /* Available */ : "unavailable" /* Unavailable */;
            if (this._accountStatus !== accountStatus) {
                const previous = this._accountStatus;
                this.logService.debug('Sync account status changed', previous, accountStatus);
                this._accountStatus = accountStatus;
                this.accountStatusContext.set(accountStatus);
                this._onDidChangeAccountStatus.fire(accountStatus);
            }
        }
        async turnOn() {
            const picked = await this.pick();
            if (!picked) {
                throw errors_1.canceled();
            }
            // User did not pick an account or login failed
            if (this.accountStatus !== "available" /* Available */) {
                throw new Error(nls_1.localize('no account', "No account available"));
            }
            const preferencesSyncTitle = nls_1.localize('preferences sync', "Preferences Sync");
            const title = `${preferencesSyncTitle} [(${nls_1.localize('details', "details")})](command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID})`;
            await this.progressService.withProgress({
                location: 15 /* Notification */,
                title,
                delay: 500,
            }, async (progress) => {
                progress.report({ message: nls_1.localize('turning on', "Turning on...") });
                const pullFirst = await this.isSyncingWithAnotherMachine();
                const disposable = this.userDataSyncService.onSynchronizeResource(resource => progress.report({ message: nls_1.localize('syncing resource', "Syncing {0}...", userDataSync_2.getSyncAreaLabel(resource)) }));
                try {
                    await this.userDataAutoSyncService.turnOn(pullFirst);
                }
                finally {
                    disposable.dispose();
                }
            });
            this.notificationService.info(nls_1.localize('sync turned on', "{0} is turned on", title));
        }
        turnoff(everywhere) {
            return this.userDataAutoSyncService.turnOff(everywhere);
        }
        async isSyncingWithAnotherMachine() {
            const isSyncingWithAnotherMachine = await this.userDataSyncService.isFirstTimeSyncingWithAnotherMachine();
            if (!isSyncingWithAnotherMachine) {
                return false;
            }
            const result = await this.dialogService.show(notification_1.Severity.Info, nls_1.localize('Replace or Merge', "Replace or Merge"), [
                nls_1.localize('show synced data', "Show Synced Data"),
                nls_1.localize('merge', "Merge"),
                nls_1.localize('replace local', "Replace Local"),
                nls_1.localize('cancel', "Cancel"),
            ], {
                cancelId: 3,
                detail: nls_1.localize('first time sync detail', "It looks like you last synced from another machine.\nWould you like to replace or merge with the synced data?"),
            });
            switch (result.choice) {
                case 0:
                    this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'showSyncedData' });
                    await this.commandService.executeCommand(userDataSync_2.SHOW_SYNCED_DATA_COMMAND_ID);
                    throw errors_1.canceled();
                case 1:
                    this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'merge' });
                    return false;
                case 2:
                    this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'replace-local' });
                    return true;
                case 3:
                    this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'cancelled' });
                    throw errors_1.canceled();
            }
            return false;
        }
        isSupportedAuthenticationProviderId(authenticationProviderId) {
            return this.authenticationProviders.some(({ id }) => id === authenticationProviderId);
        }
        isCurrentAccount(account) {
            return account.sessionId === this.currentSessionId;
        }
        async signIn() {
            await this.pick();
        }
        async pick() {
            const result = await this.doPick();
            if (!result) {
                return false;
            }
            let sessionId, accountName, accountId;
            if (userDataSync_1.isAuthenticationProvider(result)) {
                const session = await this.authenticationService.login(result.id, result.scopes);
                sessionId = session.id;
                accountName = session.account.displayName;
                accountId = session.account.id;
            }
            else {
                sessionId = result.sessionId;
                accountName = result.accountName;
                accountId = result.accountId;
            }
            await this.switch(sessionId, accountName, accountId);
            return true;
        }
        async doPick() {
            if (this.authenticationProviders.length === 0) {
                return undefined;
            }
            await this.update();
            // Single auth provider and no accounts available
            if (this.authenticationProviders.length === 1 && !this.all.length) {
                return this.authenticationProviders[0];
            }
            return new Promise(async (c, e) => {
                let result;
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = nls_1.localize('pick an account', "Preferences Sync");
                quickPick.ok = false;
                quickPick.placeholder = nls_1.localize('choose account placeholder', "Select an account");
                quickPick.ignoreFocusOut = true;
                quickPick.items = this.createQuickpickItems();
                disposables.add(quickPick.onDidAccept(() => {
                    var _a, _b, _c;
                    result = ((_a = quickPick.selectedItems[0]) === null || _a === void 0 ? void 0 : _a.account) ? (_b = quickPick.selectedItems[0]) === null || _b === void 0 ? void 0 : _b.account : (_c = quickPick.selectedItems[0]) === null || _c === void 0 ? void 0 : _c.authenticationProvider;
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c(result);
                }));
                quickPick.show();
            });
        }
        createQuickpickItems() {
            var _a;
            const quickPickItems = [];
            // Signed in Accounts
            if (this.all.length) {
                const authenticationProviders = [...this.authenticationProviders].sort(({ id }) => { var _a; return id === ((_a = this.current) === null || _a === void 0 ? void 0 : _a.authenticationProviderId) ? -1 : 1; });
                quickPickItems.push({ type: 'separator', label: nls_1.localize('signed in', "Signed in") });
                for (const authenticationProvider of authenticationProviders) {
                    const accounts = (this._all.get(authenticationProvider.id) || []).sort(({ sessionId }) => { var _a; return sessionId === ((_a = this.current) === null || _a === void 0 ? void 0 : _a.sessionId) ? -1 : 1; });
                    const providerName = this.authenticationService.getDisplayName(authenticationProvider.id);
                    for (const account of accounts) {
                        quickPickItems.push({
                            label: `${account.accountName} (${providerName})`,
                            description: account.sessionId === ((_a = this.current) === null || _a === void 0 ? void 0 : _a.sessionId) ? nls_1.localize('last used', "Last Used with Sync") : undefined,
                            account,
                            authenticationProvider,
                        });
                    }
                }
                quickPickItems.push({ type: 'separator', label: nls_1.localize('others', "Others") });
            }
            // Account proviers
            for (const authenticationProvider of this.authenticationProviders) {
                const signedInForProvider = this.all.some(account => account.authenticationProviderId === authenticationProvider.id);
                if (!signedInForProvider || this.authenticationService.supportsMultipleAccounts(authenticationProvider.id)) {
                    const providerName = this.authenticationService.getDisplayName(authenticationProvider.id);
                    quickPickItems.push({ label: nls_1.localize('sign in using account', "Sign in with {0}", providerName), authenticationProvider });
                }
            }
            return quickPickItems;
        }
        async switch(sessionId, accountName, accountId) {
            const currentAccount = this.current;
            if (this.userDataAutoSyncService.isEnabled() && (currentAccount && currentAccount.accountName !== accountName)) {
                // accounts are switched while sync is enabled.
            }
            this.currentSessionId = sessionId;
            this.telemetryService.publicLog2('sync.userAccount', { id: accountId });
            await this.update();
        }
        async onDidSuccessiveAuthFailures() {
            this.telemetryService.publicLog2('sync/successiveAuthFailures');
            this.currentSessionId = undefined;
            await this.update();
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: nls_1.localize('successive auth failures', "Preferences sync was turned off because of successive authorization failures. Please sign in again to continue synchronizing"),
                actions: {
                    primary: [new actions_1.Action('sign in', nls_1.localize('sign in', "Sign in"), undefined, true, () => this.signIn())]
                }
            });
        }
        onDidChangeSessions(e) {
            if (this.currentSessionId && e.removed.includes(this.currentSessionId)) {
                this.currentSessionId = undefined;
            }
            this.update();
        }
        onDidChangeStorage(e) {
            if (e.key === UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY && e.scope === 0 /* GLOBAL */
                && this.currentSessionId !== this.getStoredCachedSessionId() /* This checks if current window changed the value or not */) {
                this._cachedCurrentSessionId = null;
                this.update();
            }
        }
        get currentSessionId() {
            if (this._cachedCurrentSessionId === null) {
                this._cachedCurrentSessionId = this.getStoredCachedSessionId();
            }
            return this._cachedCurrentSessionId;
        }
        set currentSessionId(cachedSessionId) {
            if (this._cachedCurrentSessionId !== cachedSessionId) {
                this._cachedCurrentSessionId = cachedSessionId;
                if (cachedSessionId === undefined) {
                    this.storageService.remove(UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY, 0 /* GLOBAL */);
                }
                else {
                    this.storageService.store(UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY, cachedSessionId, 0 /* GLOBAL */);
                }
            }
        }
        getStoredCachedSessionId() {
            return this.storageService.get(UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY, 0 /* GLOBAL */);
        }
        get useWorkbenchSessionId() {
            return !this.storageService.getBoolean(UserDataSyncWorkbenchService.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, 0 /* GLOBAL */, false);
        }
        set useWorkbenchSessionId(useWorkbenchSession) {
            this.storageService.store(UserDataSyncWorkbenchService.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, !useWorkbenchSession, 0 /* GLOBAL */);
        }
    };
    UserDataSyncWorkbenchService.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY = 'userDataSyncAccount.donotUseWorkbenchSession';
    UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY = 'userDataSyncAccountPreference';
    UserDataSyncWorkbenchService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, authenticationService_1.IAuthenticationService),
        __param(2, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataAutoSyncService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, log_1.ILogService),
        __param(8, productService_1.IProductService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensions_2.IExtensionService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, notification_1.INotificationService),
        __param(13, progress_1.IProgressService),
        __param(14, dialogs_1.IDialogService),
        __param(15, commands_1.ICommandService),
        __param(16, contextkey_1.IContextKeyService)
    ], UserDataSyncWorkbenchService);
    exports.UserDataSyncWorkbenchService = UserDataSyncWorkbenchService;
    extensions_1.registerSingleton(userDataSync_2.IUserDataSyncWorkbenchService, UserDataSyncWorkbenchService);
});
//# __sourceMappingURL=userDataSyncWorkbenchService.js.map