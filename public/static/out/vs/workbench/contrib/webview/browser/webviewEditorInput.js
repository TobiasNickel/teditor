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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/contrib/webview/browser/webview", "vs/base/common/network"], function (require, exports, uri_1, editor_1, webview_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewInput = void 0;
    let WebviewInput = class WebviewInput extends editor_1.EditorInput {
        constructor(id, viewType, name, webview, _webviewService) {
            super();
            this.id = id;
            this.viewType = viewType;
            this._webviewService = _webviewService;
            this._hasTransfered = false;
            this._name = name;
            this._webview = webview;
        }
        get resource() {
            return uri_1.URI.from({
                scheme: network_1.Schemas.webviewPanel,
                path: `webview-panel/webview-${this.id}`
            });
        }
        dispose() {
            var _a;
            if (!this.isDisposed()) {
                if (!this._hasTransfered) {
                    (_a = this._webview.rawValue) === null || _a === void 0 ? void 0 : _a.dispose();
                }
            }
            super.dispose();
        }
        getTypeId() {
            return WebviewInput.typeId;
        }
        getName() {
            return this._name;
        }
        getTitle(_verbosity) {
            return this.getName();
        }
        getDescription() {
            return undefined;
        }
        setName(value) {
            this._name = value;
            this._onDidChangeLabel.fire();
        }
        get webview() {
            return this._webview.getValue();
        }
        get extension() {
            return this.webview.extension;
        }
        get iconPath() {
            return this._iconPath;
        }
        set iconPath(value) {
            this._iconPath = value;
            this._webviewService.setIcons(this.id, value);
        }
        matches(other) {
            return other === this;
        }
        get group() {
            return this._group;
        }
        updateGroup(group) {
            this._group = group;
        }
        supportsSplitEditor() {
            return false;
        }
        transfer(other) {
            if (this._hasTransfered) {
                return undefined;
            }
            this._hasTransfered = true;
            other._webview = this._webview;
            return other;
        }
    };
    WebviewInput.typeId = 'workbench.editors.webviewInput';
    WebviewInput = __decorate([
        __param(4, webview_1.IWebviewService)
    ], WebviewInput);
    exports.WebviewInput = WebviewInput;
});
//# __sourceMappingURL=webviewEditorInput.js.map