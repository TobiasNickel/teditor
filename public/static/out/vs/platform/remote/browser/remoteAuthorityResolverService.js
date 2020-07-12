/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, network_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverService = void 0;
    class RemoteAuthorityResolverService extends lifecycle_1.Disposable {
        constructor(resourceUriProvider) {
            super();
            this._onDidChangeConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeConnectionData = this._onDidChangeConnectionData.event;
            this._cache = new Map();
            this._connectionTokens = new Map();
            if (resourceUriProvider) {
                network_1.RemoteAuthorities.setDelegate(resourceUriProvider);
            }
        }
        async resolveAuthority(authority) {
            if (!this._cache.has(authority)) {
                const result = this._doResolveAuthority(authority);
                network_1.RemoteAuthorities.set(authority, result.authority.host, result.authority.port);
                this._cache.set(authority, result);
                this._onDidChangeConnectionData.fire();
            }
            return this._cache.get(authority);
        }
        getConnectionData(authority) {
            if (!this._cache.has(authority)) {
                return null;
            }
            const resolverResult = this._cache.get(authority);
            const connectionToken = this._connectionTokens.get(authority);
            return {
                host: resolverResult.authority.host,
                port: resolverResult.authority.port,
                connectionToken: connectionToken
            };
        }
        _doResolveAuthority(authority) {
            if (authority.indexOf(':') >= 0) {
                const pieces = authority.split(':');
                return { authority: { authority, host: pieces[0], port: parseInt(pieces[1], 10) } };
            }
            return { authority: { authority, host: authority, port: 80 } };
        }
        _clearResolvedAuthority(authority) {
        }
        _setResolvedAuthority(resolvedAuthority) {
        }
        _setResolvedAuthorityError(authority, err) {
        }
        _setAuthorityConnectionToken(authority, connectionToken) {
            this._connectionTokens.set(authority, connectionToken);
            network_1.RemoteAuthorities.setConnectionToken(authority, connectionToken);
            this._onDidChangeConnectionData.fire();
        }
    }
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
});
//# __sourceMappingURL=remoteAuthorityResolverService.js.map