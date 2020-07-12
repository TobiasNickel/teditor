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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/log/common/log", "vs/base/common/arrays"], function (require, exports, uri_1, extHost_protocol_1, extHostTypes_1, instantiation_1, extHostRpcService_1, log_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostDecorations = exports.ExtHostDecorations = void 0;
    let ExtHostDecorations = class ExtHostDecorations {
        constructor(extHostRpc, _logService) {
            this._logService = _logService;
            this._provider = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadDecorations);
        }
        registerDecorationProvider(provider, extensionId) {
            const handle = ExtHostDecorations._handlePool++;
            this._provider.set(handle, { provider, extensionId });
            this._proxy.$registerDecorationProvider(handle, extensionId.value);
            const listener = provider.onDidChangeDecorations(e => {
                this._proxy.$onDidChange(handle, !e || (Array.isArray(e) && e.length > 250)
                    ? null
                    : arrays_1.asArray(e));
            });
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._proxy.$unregisterDecorationProvider(handle);
                this._provider.delete(handle);
            });
        }
        $provideDecorations(requests, token) {
            const result = Object.create(null);
            return Promise.all(requests.map(request => {
                const { handle, uri, id } = request;
                const entry = this._provider.get(handle);
                if (!entry) {
                    // might have been unregistered in the meantime
                    return undefined;
                }
                const { provider, extensionId } = entry;
                return Promise.resolve(provider.provideDecoration(uri_1.URI.revive(uri), token)).then(data => {
                    if (!data) {
                        return;
                    }
                    try {
                        extHostTypes_1.Decoration.validate(data);
                        result[id] = [data.priority, data.bubble, data.title, data.letter, data.color];
                    }
                    catch (e) {
                        this._logService.warn(`INVALID decoration from extension '${extensionId.value}': ${e}`);
                    }
                }, err => {
                    this._logService.error(err);
                });
            })).then(() => {
                return result;
            });
        }
    };
    ExtHostDecorations._handlePool = 0;
    ExtHostDecorations = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostDecorations);
    exports.ExtHostDecorations = ExtHostDecorations;
    exports.IExtHostDecorations = instantiation_1.createDecorator('IExtHostDecorations');
});
//# __sourceMappingURL=extHostDecorations.js.map