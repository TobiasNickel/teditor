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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/authentication/browser/authenticationService", "../common/extHost.protocol", "vs/platform/dialogs/common/dialogs", "vs/platform/storage/common/storage", "vs/base/common/severity", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/platform/userDataSync/common/storageKeys", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/date"], function (require, exports, lifecycle_1, nls, extHostCustomers_1, authenticationService_1, extHost_protocol_1, dialogs_1, storage_1, severity_1, quickInput_1, notification_1, storageKeys_1, remoteAgentService_1, date_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAuthentication = exports.MainThreadAuthenticationProvider = void 0;
    const VSO_ALLOWED_EXTENSIONS = ['github.vscode-pull-request-github', 'github.vscode-pull-request-github-insiders', 'vscode.git', 'ms-vsonline.vsonline'];
    function readAccountUsages(storageService, providerId, accountName) {
        const accountKey = `${providerId}-${accountName}-usages`;
        const storedUsages = storageService.get(accountKey, 0 /* GLOBAL */);
        let usages = [];
        if (storedUsages) {
            try {
                usages = JSON.parse(storedUsages);
            }
            catch (e) {
                // ignore
            }
        }
        return usages;
    }
    function removeAccountUsage(storageService, providerId, accountName) {
        const accountKey = `${providerId}-${accountName}-usages`;
        storageService.remove(accountKey, 0 /* GLOBAL */);
    }
    function addAccountUsage(storageService, providerId, accountName, extensionId, extensionName) {
        const accountKey = `${providerId}-${accountName}-usages`;
        const usages = readAccountUsages(storageService, providerId, accountName);
        const existingUsageIndex = usages.findIndex(usage => usage.extensionId === extensionId);
        if (existingUsageIndex > -1) {
            usages.splice(existingUsageIndex, 1, {
                extensionId,
                extensionName,
                lastUsed: Date.now()
            });
        }
        else {
            usages.push({
                extensionId,
                extensionName,
                lastUsed: Date.now()
            });
        }
        storageService.store(accountKey, JSON.stringify(usages), 0 /* GLOBAL */);
    }
    class MainThreadAuthenticationProvider extends lifecycle_1.Disposable {
        constructor(_proxy, id, displayName, supportsMultipleAccounts, notificationService, storageKeysSyncRegistryService, storageService, quickInputService, dialogService) {
            super();
            this._proxy = _proxy;
            this.id = id;
            this.displayName = displayName;
            this.supportsMultipleAccounts = supportsMultipleAccounts;
            this.notificationService = notificationService;
            this.storageKeysSyncRegistryService = storageKeysSyncRegistryService;
            this.storageService = storageService;
            this.quickInputService = quickInputService;
            this.dialogService = dialogService;
            this._accounts = new Map(); // Map account name to session ids
            this._sessions = new Map(); // Map account id to name
        }
        async initialize() {
            return this.registerCommandsAndContextMenuItems();
        }
        hasSessions() {
            return !!this._sessions.size;
        }
        manageTrustedExtensions(accountName) {
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.canSelectMany = true;
            const allowedExtensions = authenticationService_1.readAllowedExtensions(this.storageService, this.id, accountName);
            const usages = readAccountUsages(this.storageService, this.id, accountName);
            const items = allowedExtensions.map(extension => {
                const usage = usages.find(usage => extension.id === usage.extensionId);
                return {
                    label: extension.name,
                    description: usage
                        ? nls.localize('accountLastUsedDate', "Last used this account {0}", date_1.fromNow(usage.lastUsed, true))
                        : nls.localize('notUsed', "Has not used this account"),
                    extension
                };
            });
            quickPick.items = items;
            quickPick.selectedItems = items;
            quickPick.title = nls.localize('manageTrustedExtensions', "Manage Trusted Extensions");
            quickPick.placeholder = nls.localize('manageExensions', "Choose which extensions can access this account");
            quickPick.onDidAccept(() => {
                const updatedAllowedList = quickPick.selectedItems.map(item => item.extension);
                this.storageService.store(`${this.id}-${accountName}`, JSON.stringify(updatedAllowedList), 0 /* GLOBAL */);
                quickPick.dispose();
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.show();
        }
        async registerCommandsAndContextMenuItems() {
            const sessions = await this._proxy.$getSessions(this.id);
            sessions.forEach(session => this.registerSession(session));
        }
        registerSession(session) {
            this._sessions.set(session.id, session.account.displayName);
            const existingSessionsForAccount = this._accounts.get(session.account.displayName);
            if (existingSessionsForAccount) {
                this._accounts.set(session.account.displayName, existingSessionsForAccount.concat(session.id));
                return;
            }
            else {
                this._accounts.set(session.account.displayName, [session.id]);
            }
            this.storageKeysSyncRegistryService.registerStorageKey({ key: `${this.id}-${session.account.displayName}`, version: 1 });
        }
        async signOut(accountName) {
            const accountUsages = readAccountUsages(this.storageService, this.id, accountName);
            const sessionsForAccount = this._accounts.get(accountName);
            const result = await this.dialogService.confirm({
                title: nls.localize('signOutConfirm', "Sign out of {0}", accountName),
                message: accountUsages.length
                    ? nls.localize('signOutMessagve', "The account {0} has been used by: \n\n{1}\n\n Sign out of these features?", accountName, accountUsages.map(usage => usage.extensionName).join('\n'))
                    : nls.localize('signOutMessageSimple', "Sign out of {0}?", accountName)
            });
            if (result.confirmed) {
                sessionsForAccount === null || sessionsForAccount === void 0 ? void 0 : sessionsForAccount.forEach(sessionId => this.logout(sessionId));
                removeAccountUsage(this.storageService, this.id, accountName);
            }
        }
        async getSessions() {
            return this._proxy.$getSessions(this.id);
        }
        async updateSessionItems(event) {
            const { added, removed } = event;
            const session = await this._proxy.$getSessions(this.id);
            const addedSessions = session.filter(session => added.some(id => id === session.id));
            removed.forEach(sessionId => {
                const accountName = this._sessions.get(sessionId);
                if (accountName) {
                    this._sessions.delete(sessionId);
                    let sessionsForAccount = this._accounts.get(accountName) || [];
                    const sessionIndex = sessionsForAccount.indexOf(sessionId);
                    sessionsForAccount.splice(sessionIndex);
                    if (!sessionsForAccount.length) {
                        this._accounts.delete(accountName);
                    }
                }
            });
            addedSessions.forEach(session => this.registerSession(session));
        }
        login(scopes) {
            return this._proxy.$login(this.id, scopes);
        }
        async logout(sessionId) {
            await this._proxy.$logout(this.id, sessionId);
            this.notificationService.info(nls.localize('signedOut', "Successfully signed out."));
        }
    }
    exports.MainThreadAuthenticationProvider = MainThreadAuthenticationProvider;
    let MainThreadAuthentication = class MainThreadAuthentication extends lifecycle_1.Disposable {
        constructor(extHostContext, authenticationService, dialogService, storageService, notificationService, storageKeysSyncRegistryService, remoteAgentService, quickInputService) {
            super();
            this.authenticationService = authenticationService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.storageKeysSyncRegistryService = storageKeysSyncRegistryService;
            this.remoteAgentService = remoteAgentService;
            this.quickInputService = quickInputService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAuthentication);
            this._register(this.authenticationService.onDidChangeSessions(e => {
                this._proxy.$onDidChangeAuthenticationSessions(e.providerId, e.event);
            }));
            this._register(this.authenticationService.onDidRegisterAuthenticationProvider(providerId => {
                this._proxy.$onDidChangeAuthenticationProviders([providerId], []);
            }));
            this._register(this.authenticationService.onDidUnregisterAuthenticationProvider(providerId => {
                this._proxy.$onDidChangeAuthenticationProviders([], [providerId]);
            }));
        }
        $getProviderIds() {
            return Promise.resolve(this.authenticationService.getProviderIds());
        }
        async $registerAuthenticationProvider(id, displayName, supportsMultipleAccounts) {
            const provider = new MainThreadAuthenticationProvider(this._proxy, id, displayName, supportsMultipleAccounts, this.notificationService, this.storageKeysSyncRegistryService, this.storageService, this.quickInputService, this.dialogService);
            await provider.initialize();
            this.authenticationService.registerAuthenticationProvider(id, provider);
        }
        $unregisterAuthenticationProvider(id) {
            this.authenticationService.unregisterAuthenticationProvider(id);
        }
        $sendDidChangeSessions(id, event) {
            this.authenticationService.sessionsUpdate(id, event);
        }
        $getSessions(id) {
            return this.authenticationService.getSessions(id);
        }
        $login(providerId, scopes) {
            return this.authenticationService.login(providerId, scopes);
        }
        $logout(providerId, sessionId) {
            return this.authenticationService.logout(providerId, sessionId);
        }
        async $requestNewSession(providerId, scopes, extensionId, extensionName) {
            return this.authenticationService.requestNewSession(providerId, scopes, extensionId, extensionName);
        }
        async $getSession(providerId, scopes, extensionId, extensionName, options) {
            const orderedScopes = scopes.sort().join(' ');
            const sessions = (await this.$getSessions(providerId)).filter(session => session.scopes.sort().join(' ') === orderedScopes);
            const displayName = this.authenticationService.getDisplayName(providerId);
            if (sessions.length) {
                if (!this.authenticationService.supportsMultipleAccounts(providerId)) {
                    const session = sessions[0];
                    const allowed = await this.$getSessionsPrompt(providerId, session.account.displayName, displayName, extensionId, extensionName);
                    if (allowed) {
                        return session;
                    }
                    else {
                        throw new Error('User did not consent to login.');
                    }
                }
                // On renderer side, confirm consent, ask user to choose between accounts if multiple sessions are valid
                const selected = await this.$selectSession(providerId, displayName, extensionId, extensionName, sessions, scopes, !!options.clearSessionPreference);
                return sessions.find(session => session.id === selected.id);
            }
            else {
                if (options.createIfNone) {
                    const isAllowed = await this.$loginPrompt(displayName, extensionName);
                    if (!isAllowed) {
                        throw new Error('User did not consent to login.');
                    }
                    const session = await this.authenticationService.login(providerId, scopes);
                    await this.$setTrustedExtension(providerId, session.account.displayName, extensionId, extensionName);
                    return session;
                }
                else {
                    await this.$requestNewSession(providerId, scopes, extensionId, extensionName);
                    return undefined;
                }
            }
        }
        async $selectSession(providerId, providerName, extensionId, extensionName, potentialSessions, scopes, clearSessionPreference) {
            if (!potentialSessions.length) {
                throw new Error('No potential sessions found');
            }
            if (clearSessionPreference) {
                this.storageService.remove(`${extensionName}-${providerId}`, 0 /* GLOBAL */);
            }
            else {
                const existingSessionPreference = this.storageService.get(`${extensionName}-${providerId}`, 0 /* GLOBAL */);
                if (existingSessionPreference) {
                    const matchingSession = potentialSessions.find(session => session.id === existingSessionPreference);
                    if (matchingSession) {
                        const allowed = await this.$getSessionsPrompt(providerId, matchingSession.account.displayName, providerName, extensionId, extensionName);
                        if (allowed) {
                            return matchingSession;
                        }
                    }
                }
            }
            return new Promise((resolve, reject) => {
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.ignoreFocusOut = true;
                const items = potentialSessions.map(session => {
                    return {
                        label: session.account.displayName,
                        session
                    };
                });
                items.push({
                    label: nls.localize('useOtherAccount', "Sign in to another account")
                });
                quickPick.items = items;
                quickPick.title = nls.localize('selectAccount', "The extension '{0}' wants to access a {1} account", extensionName, providerName);
                quickPick.placeholder = nls.localize('getSessionPlateholder', "Select an account for '{0}' to use or Esc to cancel", extensionName);
                quickPick.onDidAccept(async (_) => {
                    var _a;
                    const selected = quickPick.selectedItems[0];
                    const session = (_a = selected.session) !== null && _a !== void 0 ? _a : await this.authenticationService.login(providerId, scopes);
                    const accountName = session.account.displayName;
                    const allowList = authenticationService_1.readAllowedExtensions(this.storageService, providerId, accountName);
                    if (!allowList.find(allowed => allowed.id === extensionId)) {
                        allowList.push({ id: extensionId, name: extensionName });
                        this.storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), 0 /* GLOBAL */);
                    }
                    this.storageService.store(`${extensionName}-${providerId}`, session.id, 0 /* GLOBAL */);
                    quickPick.dispose();
                    resolve(session);
                });
                quickPick.onDidHide(_ => {
                    if (!quickPick.selectedItems[0]) {
                        reject('User did not consent to account access');
                    }
                    quickPick.dispose();
                });
                quickPick.show();
            });
        }
        async $getSessionsPrompt(providerId, accountName, providerName, extensionId, extensionName) {
            const allowList = authenticationService_1.readAllowedExtensions(this.storageService, providerId, accountName);
            const extensionData = allowList.find(extension => extension.id === extensionId);
            if (extensionData) {
                addAccountUsage(this.storageService, providerId, accountName, extensionId, extensionName);
                return true;
            }
            const remoteConnection = this.remoteAgentService.getConnection();
            if (remoteConnection && remoteConnection.remoteAuthority && remoteConnection.remoteAuthority.startsWith('vsonline') && VSO_ALLOWED_EXTENSIONS.includes(extensionId)) {
                addAccountUsage(this.storageService, providerId, accountName, extensionId, extensionName);
                return true;
            }
            const { choice } = await this.dialogService.show(severity_1.default.Info, nls.localize('confirmAuthenticationAccess', "The extension '{0}' wants to access the {1} account '{2}'.", extensionName, providerName, accountName), [nls.localize('allow', "Allow"), nls.localize('cancel', "Cancel")], {
                cancelId: 1
            });
            const allow = choice === 0;
            if (allow) {
                addAccountUsage(this.storageService, providerId, accountName, extensionId, extensionName);
                allowList.push({ id: extensionId, name: extensionName });
                this.storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), 0 /* GLOBAL */);
            }
            return allow;
        }
        async $loginPrompt(providerName, extensionName) {
            const { choice } = await this.dialogService.show(severity_1.default.Info, nls.localize('confirmLogin', "The extension '{0}' wants to sign in using {1}.", extensionName, providerName), [nls.localize('allow', "Allow"), nls.localize('cancel', "Cancel")], {
                cancelId: 1
            });
            return choice === 0;
        }
        async $setTrustedExtension(providerId, accountName, extensionId, extensionName) {
            const allowList = authenticationService_1.readAllowedExtensions(this.storageService, providerId, accountName);
            if (!allowList.find(allowed => allowed.id === extensionId)) {
                allowList.push({ id: extensionId, name: extensionName });
                this.storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), 0 /* GLOBAL */);
            }
        }
    };
    MainThreadAuthentication = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadAuthentication),
        __param(1, authenticationService_1.IAuthenticationService),
        __param(2, dialogs_1.IDialogService),
        __param(3, storage_1.IStorageService),
        __param(4, notification_1.INotificationService),
        __param(5, storageKeys_1.IStorageKeysSyncRegistryService),
        __param(6, remoteAgentService_1.IRemoteAgentService),
        __param(7, quickInput_1.IQuickInputService)
    ], MainThreadAuthentication);
    exports.MainThreadAuthentication = MainThreadAuthentication;
});
//# __sourceMappingURL=mainThreadAuthentication.js.map