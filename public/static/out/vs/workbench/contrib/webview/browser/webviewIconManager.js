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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/decorators", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/common/lifecycle"], function (require, exports, dom, decorators_1, configuration_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewIconManager = void 0;
    let WebviewIconManager = class WebviewIconManager {
        constructor(_lifecycleService, _configService) {
            this._lifecycleService = _lifecycleService;
            this._configService = _configService;
            this._icons = new Map();
            this._configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.iconTheme')) {
                    this.updateStyleSheet();
                }
            });
        }
        get _styleElement() {
            const element = dom.createStyleSheet();
            element.className = 'webview-icons';
            return element;
        }
        setIcons(webviewId, iconPath) {
            if (iconPath) {
                this._icons.set(webviewId, iconPath);
            }
            else {
                this._icons.delete(webviewId);
            }
            this.updateStyleSheet();
        }
        async updateStyleSheet() {
            await this._lifecycleService.when(1 /* Starting */);
            const cssRules = [];
            if (this._configService.getValue('workbench.iconTheme') !== null) {
                for (const [key, value] of this._icons) {
                    const webviewSelector = `.show-file-icons .webview-${key}-name-file-icon::before`;
                    try {
                        cssRules.push(`.monaco-workbench.vs ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.light)}; }`, `.monaco-workbench.vs-dark ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.dark)}; }`);
                    }
                    catch (_a) {
                        // noop
                    }
                }
            }
            this._styleElement.innerHTML = cssRules.join('\n');
        }
    };
    __decorate([
        decorators_1.memoize
    ], WebviewIconManager.prototype, "_styleElement", null);
    WebviewIconManager = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, configuration_1.IConfigurationService)
    ], WebviewIconManager);
    exports.WebviewIconManager = WebviewIconManager;
});
//# __sourceMappingURL=webviewIconManager.js.map