/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "./extHost.protocol", "vs/base/common/network", "vs/base/common/cancellation"], function (require, exports, errors_1, uri_1, extHostTypes_1, extHost_protocol_1, network_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentContentProvider = void 0;
    class ExtHostDocumentContentProvider {
        constructor(mainContext, _documentsAndEditors, _logService) {
            this._documentsAndEditors = _documentsAndEditors;
            this._logService = _logService;
            this._documentContentProviders = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocumentContentProviders);
        }
        registerTextDocumentContentProvider(scheme, provider) {
            // todo@remote
            // check with scheme from fs-providers!
            if (Object.keys(network_1.Schemas).indexOf(scheme) >= 0) {
                throw new Error(`scheme '${scheme}' already registered`);
            }
            const handle = ExtHostDocumentContentProvider._handlePool++;
            this._documentContentProviders.set(handle, provider);
            this._proxy.$registerTextContentProvider(handle, scheme);
            let subscription;
            if (typeof provider.onDidChange === 'function') {
                subscription = provider.onDidChange(uri => {
                    if (uri.scheme !== scheme) {
                        this._logService.warn(`Provider for scheme '${scheme}' is firing event for schema '${uri.scheme}' which will be IGNORED`);
                        return;
                    }
                    if (this._documentsAndEditors.getDocument(uri)) {
                        this.$provideTextDocumentContent(handle, uri).then(value => {
                            if (!value && typeof value !== 'string') {
                                return;
                            }
                            const document = this._documentsAndEditors.getDocument(uri);
                            if (!document) {
                                // disposed in the meantime
                                return;
                            }
                            // create lines and compare
                            const lines = value.split(/\r\n|\r|\n/);
                            // broadcast event when content changed
                            if (!document.equalLines(lines)) {
                                return this._proxy.$onVirtualDocumentChange(uri, value);
                            }
                        }, errors_1.onUnexpectedError);
                    }
                });
            }
            return new extHostTypes_1.Disposable(() => {
                if (this._documentContentProviders.delete(handle)) {
                    this._proxy.$unregisterTextContentProvider(handle);
                }
                if (subscription) {
                    subscription.dispose();
                    subscription = undefined;
                }
            });
        }
        $provideTextDocumentContent(handle, uri) {
            const provider = this._documentContentProviders.get(handle);
            if (!provider) {
                return Promise.reject(new Error(`unsupported uri-scheme: ${uri.scheme}`));
            }
            return Promise.resolve(provider.provideTextDocumentContent(uri_1.URI.revive(uri), cancellation_1.CancellationToken.None));
        }
    }
    exports.ExtHostDocumentContentProvider = ExtHostDocumentContentProvider;
    ExtHostDocumentContentProvider._handlePool = 0;
});
//# __sourceMappingURL=extHostDocumentContentProviders.js.map