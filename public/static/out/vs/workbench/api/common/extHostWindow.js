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
define(["require", "exports", "vs/base/common/event", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService"], function (require, exports, event_1, extHost_protocol_1, uri_1, network_1, strings_1, instantiation_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostWindow = exports.ExtHostWindow = void 0;
    let ExtHostWindow = class ExtHostWindow {
        constructor(extHostRpc) {
            this._onDidChangeWindowState = new event_1.Emitter();
            this.onDidChangeWindowState = this._onDidChangeWindowState.event;
            this._state = ExtHostWindow.InitialState;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._proxy.$getWindowVisibility().then(isFocused => this.$onDidChangeWindowFocus(isFocused));
        }
        get state() { return this._state; }
        $onDidChangeWindowFocus(focused) {
            if (focused === this._state.focused) {
                return;
            }
            this._state = Object.assign(Object.assign({}, this._state), { focused });
            this._onDidChangeWindowState.fire(this._state);
        }
        openUri(stringOrUri, options) {
            let uriAsString;
            if (typeof stringOrUri === 'string') {
                uriAsString = stringOrUri;
                try {
                    stringOrUri = uri_1.URI.parse(stringOrUri);
                }
                catch (e) {
                    return Promise.reject(`Invalid uri - '${stringOrUri}'`);
                }
            }
            if (strings_1.isFalsyOrWhitespace(stringOrUri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (stringOrUri.scheme === network_1.Schemas.command) {
                return Promise.reject(`Invalid scheme '${stringOrUri.scheme}'`);
            }
            return this._proxy.$openUri(stringOrUri, uriAsString, options);
        }
        async asExternalUri(uri, options) {
            if (strings_1.isFalsyOrWhitespace(uri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (!new Set([network_1.Schemas.http, network_1.Schemas.https]).has(uri.scheme)) {
                return Promise.reject(`Invalid scheme '${uri.scheme}'`);
            }
            const result = await this._proxy.$asExternalUri(uri, options);
            return uri_1.URI.from(result);
        }
    };
    ExtHostWindow.InitialState = {
        focused: true
    };
    ExtHostWindow = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostWindow);
    exports.ExtHostWindow = ExtHostWindow;
    exports.IExtHostWindow = instantiation_1.createDecorator('IExtHostWindow');
});
//# __sourceMappingURL=extHostWindow.js.map