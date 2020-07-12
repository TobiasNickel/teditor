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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewElement", "vs/workbench/contrib/webview/browser/themeing", "./dynamicWebviewEditorOverlay", "./webviewIconManager"], function (require, exports, extensions_1, instantiation_1, webview_1, webviewElement_1, themeing_1, dynamicWebviewEditorOverlay_1, webviewIconManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewService = void 0;
    let WebviewService = class WebviewService {
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
            this._webviewThemeDataProvider = this._instantiationService.createInstance(themeing_1.WebviewThemeDataProvider);
            this._iconManager = this._instantiationService.createInstance(webviewIconManager_1.WebviewIconManager);
        }
        createWebviewElement(id, options, contentOptions, extension) {
            return this._instantiationService.createInstance(webviewElement_1.IFrameWebview, id, options, contentOptions, extension, this._webviewThemeDataProvider);
        }
        createWebviewOverlay(id, options, contentOptions, extension) {
            return this._instantiationService.createInstance(dynamicWebviewEditorOverlay_1.DynamicWebviewEditorOverlay, id, options, contentOptions, extension);
        }
        setIcons(id, iconPath) {
            this._iconManager.setIcons(id, iconPath);
        }
    };
    WebviewService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WebviewService);
    exports.WebviewService = WebviewService;
    extensions_1.registerSingleton(webview_1.IWebviewService, WebviewService, true);
});
//# __sourceMappingURL=webviewService.js.map