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
define(["require", "exports", "./extHostTypes", "vs/workbench/api/common/extHostRpcService", "vs/base/common/event"], function (require, exports, extHostTypes_1, extHostRpcService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTheming = void 0;
    let ExtHostTheming = class ExtHostTheming {
        constructor(_extHostRpc) {
            this._actual = new extHostTypes_1.ColorTheme(extHostTypes_1.ColorThemeKind.Dark);
            this._onDidChangeActiveColorTheme = new event_1.Emitter();
        }
        get activeColorTheme() {
            return this._actual;
        }
        $onColorThemeChange(type) {
            let kind = type === 'light' ? extHostTypes_1.ColorThemeKind.Light : type === 'dark' ? extHostTypes_1.ColorThemeKind.Dark : extHostTypes_1.ColorThemeKind.HighContrast;
            this._actual = new extHostTypes_1.ColorTheme(kind);
            this._onDidChangeActiveColorTheme.fire(this._actual);
        }
        get onDidChangeActiveColorTheme() {
            return this._onDidChangeActiveColorTheme.event;
        }
    };
    ExtHostTheming = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostTheming);
    exports.ExtHostTheming = ExtHostTheming;
});
//# __sourceMappingURL=extHostTheming.js.map