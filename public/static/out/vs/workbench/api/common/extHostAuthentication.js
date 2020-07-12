/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/extensions/common/extensions"], function (require, exports, event_1, extHost_protocol_1, extHostTypes_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostAuthentication = void 0;
    class ExtHostAuthentication {
        constructor(mainContext) {
            this._authenticationProviders = new Map();
            this._onDidChangeAuthenticationProviders = new event_1.Emitter();
            this.onDidChangeAuthenticationProviders = this._onDidChangeAuthenticationProviders.event;
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadAuthentication);
        }
        getProviderIds() {
            return this._proxy.$getProviderIds();
        }
        get providerIds() {
            const ids = [];
            this._authenticationProviders.forEach(provider => {
                ids.push(provider.id);
            });
            return ids;
        }
        async resolveSessions(providerId) {
            const provider = this._authenticationProviders.get(providerId);
            let sessions;
            if (!provider) {
                sessions = await this._proxy.$getSessions(providerId);
            }
            else {
                sessions = await provider.getSessions();
            }
            return sessions;
        }
        async hasSessions(providerId, scopes) {
            const orderedScopes = scopes.sort().join(' ');
            const sessions = await this.resolveSessions(providerId);
            return !!(sessions.filter(session => session.scopes.sort().join(' ') === orderedScopes).length);
        }
        async getSession(requestingExtension, providerId, scopes, options) {
            const provider = this._authenticationProviders.get(providerId);
            const extensionName = requestingExtension.displayName || requestingExtension.name;
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            if (!provider) {
                return this._proxy.$getSession(providerId, scopes, extensionId, extensionName, options);
            }
            const orderedScopes = scopes.sort().join(' ');
            const sessions = (await provider.getSessions()).filter(session => session.scopes.sort().join(' ') === orderedScopes);
            if (sessions.length) {
                if (!provider.supportsMultipleAccounts) {
                    const session = sessions[0];
                    const allowed = await this._proxy.$getSessionsPrompt(providerId, session.account.displayName, provider.displayName, extensionId, extensionName);
                    if (allowed) {
                        return session;
                    }
                    else {
                        throw new Error('User did not consent to login.');
                    }
                }
                // On renderer side, confirm consent, ask user to choose between accounts if multiple sessions are valid
                const selected = await this._proxy.$selectSession(providerId, provider.displayName, extensionId, extensionName, sessions, scopes, !!options.clearSessionPreference);
                return sessions.find(session => session.id === selected.id);
            }
            else {
                if (options.createIfNone) {
                    const isAllowed = await this._proxy.$loginPrompt(provider.displayName, extensionName);
                    if (!isAllowed) {
                        throw new Error('User did not consent to login.');
                    }
                    const session = await provider.login(scopes);
                    await this._proxy.$setTrustedExtension(providerId, session.account.displayName, extensionId, extensionName);
                    return session;
                }
                else {
                    await this._proxy.$requestNewSession(providerId, scopes, extensionId, extensionName);
                    return undefined;
                }
            }
        }
        async getSessions(requestingExtension, providerId, scopes) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const orderedScopes = scopes.sort().join(' ');
            const sessions = await this.resolveSessions(providerId);
            return sessions
                .filter(session => session.scopes.sort().join(' ') === orderedScopes)
                .map(session => {
                return {
                    id: session.id,
                    account: session.account,
                    scopes: session.scopes,
                    getAccessToken: async () => {
                        const isAllowed = await this._proxy.$getSessionsPrompt(providerId, session.account.displayName, '', // TODO
                        // provider.displayName,
                        extensionId, requestingExtension.displayName || requestingExtension.name);
                        if (!isAllowed) {
                            throw new Error('User did not consent to token access.');
                        }
                        return session.accessToken;
                    }
                };
            });
        }
        async login(requestingExtension, providerId, scopes) {
            const provider = this._authenticationProviders.get(providerId);
            if (!provider) {
                throw new Error(`No authentication provider with id '${providerId}' is currently registered.`);
            }
            const extensionName = requestingExtension.displayName || requestingExtension.name;
            const isAllowed = await this._proxy.$loginPrompt(provider.displayName, extensionName);
            if (!isAllowed) {
                throw new Error('User did not consent to login.');
            }
            const session = await provider.login(scopes);
            await this._proxy.$setTrustedExtension(provider.id, session.account.displayName, extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier), extensionName);
            return {
                id: session.id,
                account: session.account,
                scopes: session.scopes,
                getAccessToken: async () => {
                    const isAllowed = await this._proxy.$getSessionsPrompt(provider.id, session.account.displayName, provider.displayName, extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier), requestingExtension.displayName || requestingExtension.name);
                    if (!isAllowed) {
                        throw new Error('User did not consent to token access.');
                    }
                    return session.accessToken;
                }
            };
        }
        async logout(providerId, sessionId) {
            const provider = this._authenticationProviders.get(providerId);
            if (!provider) {
                return this._proxy.$logout(providerId, sessionId);
            }
            return provider.logout(sessionId);
        }
        registerAuthenticationProvider(provider) {
            if (this._authenticationProviders.get(provider.id)) {
                throw new Error(`An authentication provider with id '${provider.id}' is already registered.`);
            }
            this._authenticationProviders.set(provider.id, provider);
            const listener = provider.onDidChangeSessions(e => {
                this._proxy.$sendDidChangeSessions(provider.id, e);
            });
            this._proxy.$registerAuthenticationProvider(provider.id, provider.displayName, provider.supportsMultipleAccounts);
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._authenticationProviders.delete(provider.id);
                this._proxy.$unregisterAuthenticationProvider(provider.id);
            });
        }
        $login(providerId, scopes) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                return Promise.resolve(authProvider.login(scopes));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $logout(providerId, sessionId) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                return Promise.resolve(authProvider.logout(sessionId));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $getSessions(providerId) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                return Promise.resolve(authProvider.getSessions());
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        async $getSessionAccessToken(providerId, sessionId) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                const sessions = await authProvider.getSessions();
                const session = sessions.find(session => session.id === sessionId);
                if (session) {
                    return session.accessToken;
                }
                throw new Error(`Unable to find session with id: ${sessionId}`);
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $onDidChangeAuthenticationSessions(providerId, event) {
            this._onDidChangeSessions.fire({ [providerId]: event });
            return Promise.resolve();
        }
        $onDidChangeAuthenticationProviders(added, removed) {
            this._onDidChangeAuthenticationProviders.fire({ added, removed });
            return Promise.resolve();
        }
    }
    exports.ExtHostAuthentication = ExtHostAuthentication;
});
//# __sourceMappingURL=extHostAuthentication.js.map