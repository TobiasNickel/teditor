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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/decorations/browser/decorations", "vs/base/common/collections", "vs/base/common/cancellation"], function (require, exports, uri_1, event_1, lifecycle_1, extHost_protocol_1, extHostCustomers_1, decorations_1, collections_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDecorations = void 0;
    class DecorationRequestsQueue {
        constructor(_proxy) {
            this._proxy = _proxy;
            this._idPool = 0;
            this._requests = Object.create(null);
            this._resolver = Object.create(null);
            //
        }
        enqueue(handle, uri, token) {
            const id = ++this._idPool;
            const result = new Promise(resolve => {
                this._requests[id] = { id, handle, uri };
                this._resolver[id] = resolve;
                this._processQueue();
            });
            token.onCancellationRequested(() => {
                delete this._requests[id];
                delete this._resolver[id];
            });
            return result;
        }
        _processQueue() {
            if (typeof this._timer === 'number') {
                // already queued
                return;
            }
            this._timer = setTimeout(() => {
                // make request
                const requests = this._requests;
                const resolver = this._resolver;
                this._proxy.$provideDecorations(collections_1.values(requests), cancellation_1.CancellationToken.None).then(data => {
                    for (const id in resolver) {
                        resolver[id](data[id]);
                    }
                });
                // reset
                this._requests = [];
                this._resolver = [];
                this._timer = undefined;
            }, 0);
        }
    }
    let MainThreadDecorations = class MainThreadDecorations {
        constructor(context, _decorationsService) {
            this._decorationsService = _decorationsService;
            this._provider = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDecorations);
            this._requestQueue = new DecorationRequestsQueue(this._proxy);
        }
        dispose() {
            this._provider.forEach(value => lifecycle_1.dispose(value));
            this._provider.clear();
        }
        $registerDecorationProvider(handle, label) {
            const emitter = new event_1.Emitter();
            const registration = this._decorationsService.registerDecorationsProvider({
                label,
                onDidChange: emitter.event,
                provideDecorations: (uri, token) => {
                    return this._requestQueue.enqueue(handle, uri, token).then(data => {
                        if (!data) {
                            return undefined;
                        }
                        const [weight, bubble, tooltip, letter, themeColor] = data;
                        return {
                            weight: weight || 0,
                            bubble: bubble || false,
                            color: themeColor && themeColor.id,
                            tooltip,
                            letter
                        };
                    });
                }
            });
            this._provider.set(handle, [emitter, registration]);
        }
        $onDidChange(handle, resources) {
            const provider = this._provider.get(handle);
            if (provider) {
                const [emitter] = provider;
                emitter.fire(resources && resources.map(r => uri_1.URI.revive(r)));
            }
        }
        $unregisterDecorationProvider(handle) {
            const provider = this._provider.get(handle);
            if (provider) {
                lifecycle_1.dispose(provider);
                this._provider.delete(handle);
            }
        }
    };
    MainThreadDecorations = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadDecorations),
        __param(1, decorations_1.IDecorationsService)
    ], MainThreadDecorations);
    exports.MainThreadDecorations = MainThreadDecorations;
});
//# __sourceMappingURL=mainThreadDecorations.js.map