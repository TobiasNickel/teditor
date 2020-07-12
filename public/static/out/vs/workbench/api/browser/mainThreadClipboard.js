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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/platform/clipboard/common/clipboardService"], function (require, exports, extHostCustomers_1, extHost_protocol_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadClipboard = void 0;
    let MainThreadClipboard = class MainThreadClipboard {
        constructor(_context, _clipboardService) {
            this._clipboardService = _clipboardService;
        }
        dispose() {
            // nothing
        }
        $readText() {
            return this._clipboardService.readText();
        }
        $writeText(value) {
            return this._clipboardService.writeText(value);
        }
    };
    MainThreadClipboard = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadClipboard),
        __param(1, clipboardService_1.IClipboardService)
    ], MainThreadClipboard);
    exports.MainThreadClipboard = MainThreadClipboard;
});
//# __sourceMappingURL=mainThreadClipboard.js.map