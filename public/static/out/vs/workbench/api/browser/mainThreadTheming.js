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
define(["require", "exports", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/platform/theme/common/themeService"], function (require, exports, extHost_protocol_1, extHostCustomers_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTheming = void 0;
    let MainThreadTheming = class MainThreadTheming {
        constructor(extHostContext, themeService) {
            this._themeService = themeService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTheming);
            this._themeChangeListener = this._themeService.onDidColorThemeChange(e => {
                this._proxy.$onColorThemeChange(this._themeService.getColorTheme().type);
            });
            this._proxy.$onColorThemeChange(this._themeService.getColorTheme().type);
        }
        dispose() {
            this._themeChangeListener.dispose();
        }
    };
    MainThreadTheming = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTheming),
        __param(1, themeService_1.IThemeService)
    ], MainThreadTheming);
    exports.MainThreadTheming = MainThreadTheming;
});
//# __sourceMappingURL=mainThreadTheming.js.map