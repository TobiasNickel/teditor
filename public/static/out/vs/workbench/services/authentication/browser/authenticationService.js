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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/workbench/services/activity/common/activity", "vs/platform/storage/common/storage"], function (require, exports, nls, event_1, lifecycle_1, extensions_1, instantiation_1, actions_1, contextkey_1, commands_1, activity_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationService = exports.readAllowedExtensions = exports.IAuthenticationService = void 0;
    exports.IAuthenticationService = instantiation_1.createDecorator('IAuthenticationService');
    function readAllowedExtensions(storageService, providerId, accountName) {
        let trustedExtensions = [];
        try {
            const trustedExtensionSrc = storageService.get(`${providerId}-${accountName}`, 0 /* GLOBAL */);
            if (trustedExtensionSrc) {
                trustedExtensions = JSON.parse(trustedExtensionSrc);
            }
        }
        catch (err) { }
        return trustedExtensions;
    }
    exports.readAllowedExtensions = readAllowedExtensions;
    let AuthenticationService = class AuthenticationService extends lifecycle_1.Disposable {
        constructor(activityService) {
            super();
            this.activityService = activityService;
            this._signInRequestItems = new Map();
            this._authenticationProviders = new Map();
            this._onDidRegisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidRegisterAuthenticationProvider = this._onDidRegisterAuthenticationProvider.event;
            this._onDidUnregisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidUnregisterAuthenticationProvider = this._onDidUnregisterAuthenticationProvider.event;
            this._onDidChangeSessions = this._register(new event_1.Emitter());
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                command: {
                    id: 'noAuthenticationProviders',
                    title: nls.localize('loading', "Loading..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
            });
        }
        getProviderIds() {
            const providerIds = [];
            this._authenticationProviders.forEach(provider => {
                providerIds.push(provider.id);
            });
            return providerIds;
        }
        isAuthenticationProviderRegistered(id) {
            return this._authenticationProviders.has(id);
        }
        updateAccountsMenuItem() {
            let hasSession = false;
            this._authenticationProviders.forEach(async (provider) => {
                hasSession = hasSession || provider.hasSessions();
            });
            if (hasSession && this._noAccountsMenuItem) {
                this._noAccountsMenuItem.dispose();
                this._noAccountsMenuItem = undefined;
            }
            if (!hasSession && !this._noAccountsMenuItem) {
                this._noAccountsMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                    group: '0_accounts',
                    command: {
                        id: 'noAccounts',
                        title: nls.localize('noAccounts', "You are not signed in to any accounts"),
                        precondition: contextkey_1.ContextKeyExpr.false()
                    },
                });
            }
        }
        registerAuthenticationProvider(id, authenticationProvider) {
            this._authenticationProviders.set(id, authenticationProvider);
            this._onDidRegisterAuthenticationProvider.fire(id);
            if (this._placeholderMenuItem) {
                this._placeholderMenuItem.dispose();
                this._placeholderMenuItem = undefined;
            }
            this.updateAccountsMenuItem();
        }
        unregisterAuthenticationProvider(id) {
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                provider.dispose();
                this._authenticationProviders.delete(id);
                this._onDidUnregisterAuthenticationProvider.fire(id);
                this.updateAccountsMenuItem();
            }
            if (!this._authenticationProviders.size) {
                this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                    command: {
                        id: 'noAuthenticationProviders',
                        title: nls.localize('loading', "Loading..."),
                        precondition: contextkey_1.ContextKeyExpr.false()
                    },
                });
            }
        }
        async sessionsUpdate(id, event) {
            this._onDidChangeSessions.fire({ providerId: id, event: event });
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                await provider.updateSessionItems(event);
                this.updateAccountsMenuItem();
                if (event.added) {
                    await this.updateNewSessionRequests(provider);
                }
            }
        }
        async updateNewSessionRequests(provider) {
            var _a;
            const existingRequestsForProvider = this._signInRequestItems.get(provider.id);
            if (!existingRequestsForProvider) {
                return;
            }
            const sessions = await provider.getSessions();
            let changed = false;
            Object.keys(existingRequestsForProvider).forEach(requestedScopes => {
                if (sessions.some(session => session.scopes.sort().join('') === requestedScopes)) {
                    // Request has been completed
                    changed = true;
                    const sessionRequest = existingRequestsForProvider[requestedScopes];
                    sessionRequest === null || sessionRequest === void 0 ? void 0 : sessionRequest.disposables.forEach(item => item.dispose());
                    delete existingRequestsForProvider[requestedScopes];
                    if (Object.keys(existingRequestsForProvider).length === 0) {
                        this._signInRequestItems.delete(provider.id);
                    }
                    else {
                        this._signInRequestItems.set(provider.id, existingRequestsForProvider);
                    }
                }
            });
            if (changed) {
                if (this._signInRequestItems.size === 0) {
                    (_a = this._badgeDisposable) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._badgeDisposable = undefined;
                }
                else {
                    let numberOfRequests = 0;
                    this._signInRequestItems.forEach(providerRequests => {
                        Object.keys(providerRequests).forEach(request => {
                            numberOfRequests += providerRequests[request].requestingExtensionIds.length;
                        });
                    });
                    const badge = new activity_1.NumberBadge(numberOfRequests, () => nls.localize('sign in', "Sign in requested"));
                    this._badgeDisposable = this.activityService.showAccountsActivity({ badge });
                }
            }
        }
        requestNewSession(providerId, scopes, extensionId, extensionName) {
            const provider = this._authenticationProviders.get(providerId);
            if (provider) {
                const providerRequests = this._signInRequestItems.get(providerId);
                const scopesList = scopes.sort().join('');
                const extensionHasExistingRequest = providerRequests
                    && providerRequests[scopesList]
                    && providerRequests[scopesList].requestingExtensionIds.includes(extensionId);
                if (extensionHasExistingRequest) {
                    return;
                }
                const menuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                    group: '2_signInRequests',
                    command: {
                        id: `${extensionId}signIn`,
                        title: nls.localize('signInRequest', "Sign in to use {0} (1)", extensionName)
                    }
                });
                const signInCommand = commands_1.CommandsRegistry.registerCommand({
                    id: `${extensionId}signIn`,
                    handler: async (accessor) => {
                        const authenticationService = accessor.get(exports.IAuthenticationService);
                        const storageService = accessor.get(storage_1.IStorageService);
                        const session = await authenticationService.login(providerId, scopes);
                        // Add extension to allow list since user explicitly signed in on behalf of it
                        const allowList = readAllowedExtensions(storageService, providerId, session.account.displayName);
                        if (!allowList.find(allowed => allowed.id === extensionId)) {
                            allowList.push({ id: extensionId, name: extensionName });
                            storageService.store(`${providerId}-${session.account.displayName}`, JSON.stringify(allowList), 0 /* GLOBAL */);
                        }
                        // And also set it as the preferred account for the extension
                        storageService.store(`${extensionName}-${providerId}`, session.id, 0 /* GLOBAL */);
                    }
                });
                if (providerRequests) {
                    const existingRequest = providerRequests[scopesList] || { disposables: [], requestingExtensionIds: [] };
                    providerRequests[scopesList] = {
                        disposables: [...existingRequest.disposables, menuItem, signInCommand],
                        requestingExtensionIds: [...existingRequest.requestingExtensionIds, extensionId]
                    };
                    this._signInRequestItems.set(providerId, providerRequests);
                }
                else {
                    this._signInRequestItems.set(providerId, {
                        [scopesList]: {
                            disposables: [menuItem, signInCommand],
                            requestingExtensionIds: [extensionId]
                        }
                    });
                }
                let numberOfRequests = 0;
                this._signInRequestItems.forEach(providerRequests => {
                    Object.keys(providerRequests).forEach(request => {
                        numberOfRequests += providerRequests[request].requestingExtensionIds.length;
                    });
                });
                const badge = new activity_1.NumberBadge(numberOfRequests, () => nls.localize('sign in', "Sign in requested"));
                this._badgeDisposable = this.activityService.showAccountsActivity({ badge });
            }
        }
        getDisplayName(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.displayName;
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        supportsMultipleAccounts(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.supportsMultipleAccounts;
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async getSessions(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return await authProvider.getSessions();
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async login(id, scopes) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.login(scopes);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async logout(id, sessionId) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.logout(sessionId);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async manageTrustedExtensionsForAccount(id, accountName) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.manageTrustedExtensions(accountName);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async signOutOfAccount(id, accountName) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.signOut(accountName);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
    };
    AuthenticationService = __decorate([
        __param(0, activity_1.IActivityService)
    ], AuthenticationService);
    exports.AuthenticationService = AuthenticationService;
    extensions_1.registerSingleton(exports.IAuthenticationService, AuthenticationService);
});
//# __sourceMappingURL=authenticationService.js.map