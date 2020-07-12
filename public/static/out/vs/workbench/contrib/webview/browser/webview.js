/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.webviewDeveloperCategory = exports.IWebviewService = exports.webviewHasOwnEditFunctionsContext = exports.webviewHasOwnEditFunctionsContextKey = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = void 0;
    /**
     * Set when the find widget in a webview is visible.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('webviewFindWidgetVisible', false);
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('webviewFindWidgetFocused', false);
    exports.webviewHasOwnEditFunctionsContextKey = 'webviewHasOwnEditFunctions';
    exports.webviewHasOwnEditFunctionsContext = new contextkey_1.RawContextKey(exports.webviewHasOwnEditFunctionsContextKey, false);
    exports.IWebviewService = instantiation_1.createDecorator('webviewService');
    exports.webviewDeveloperCategory = nls.localize('developer', "Developer");
});
//# __sourceMappingURL=webview.js.map