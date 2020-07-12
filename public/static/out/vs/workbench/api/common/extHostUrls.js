/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/platform/extensions/common/extensions"], function (require, exports, extHost_protocol_1, uri_1, lifecycle_1, errors_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostUrls = void 0;
    class ExtHostUrls {
        constructor(mainContext) {
            this.handles = new Set();
            this.handlers = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadUrls);
        }
        registerUriHandler(extensionId, handler) {
            if (this.handles.has(extensions_1.ExtensionIdentifier.toKey(extensionId))) {
                throw new Error(`Protocol handler already registered for extension ${extensionId}`);
            }
            const handle = ExtHostUrls.HandlePool++;
            this.handles.add(extensions_1.ExtensionIdentifier.toKey(extensionId));
            this.handlers.set(handle, handler);
            this._proxy.$registerUriHandler(handle, extensionId);
            return lifecycle_1.toDisposable(() => {
                this.handles.delete(extensions_1.ExtensionIdentifier.toKey(extensionId));
                this.handlers.delete(handle);
                this._proxy.$unregisterUriHandler(handle);
            });
        }
        $handleExternalUri(handle, uri) {
            const handler = this.handlers.get(handle);
            if (!handler) {
                return Promise.resolve(undefined);
            }
            try {
                handler.handleUri(uri_1.URI.revive(uri));
            }
            catch (err) {
                errors_1.onUnexpectedError(err);
            }
            return Promise.resolve(undefined);
        }
        async createAppUri(uri) {
            return uri_1.URI.revive(await this._proxy.$createAppUri(uri));
        }
    }
    exports.ExtHostUrls = ExtHostUrls;
    ExtHostUrls.HandlePool = 0;
});
//# __sourceMappingURL=extHostUrls.js.map