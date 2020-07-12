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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, actions_1, nls, actions_2, contextkey_1, contextkeys_1, webview_1, webviewEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFocusedWebviewEditor = exports.ReloadWebviewAction = exports.SelectAllWebviewEditorCommand = exports.WebViewEditorFindPreviousCommand = exports.WebViewEditorFindNextCommand = exports.HideWebViewEditorFindCommand = exports.ShowWebViewEditorFindWidgetAction = void 0;
    class ShowWebViewEditorFindWidgetAction extends actions_2.Action2 {
        constructor(contextKeyExpr) {
            super({
                id: ShowWebViewEditorFindWidgetAction.ID,
                title: ShowWebViewEditorFindWidgetAction.LABEL,
                keybinding: {
                    when: contextKeyExpr,
                    primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getFocusedWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.showFind();
        }
    }
    exports.ShowWebViewEditorFindWidgetAction = ShowWebViewEditorFindWidgetAction;
    ShowWebViewEditorFindWidgetAction.ID = 'editor.action.webvieweditor.showFind';
    ShowWebViewEditorFindWidgetAction.LABEL = nls.localize('editor.action.webvieweditor.showFind', "Show find");
    class HideWebViewEditorFindCommand extends actions_2.Action2 {
        constructor(contextKeyExpr) {
            super({
                id: HideWebViewEditorFindCommand.ID,
                title: HideWebViewEditorFindCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE),
                    primary: 9 /* Escape */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getFocusedWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.hideFind();
        }
    }
    exports.HideWebViewEditorFindCommand = HideWebViewEditorFindCommand;
    HideWebViewEditorFindCommand.ID = 'editor.action.webvieweditor.hideFind';
    HideWebViewEditorFindCommand.LABEL = nls.localize('editor.action.webvieweditor.hideFind', "Stop find");
    class WebViewEditorFindNextCommand extends actions_2.Action2 {
        constructor(contextKeyExpr) {
            super({
                id: WebViewEditorFindNextCommand.ID,
                title: WebViewEditorFindNextCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getFocusedWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.runFindAction(false);
        }
    }
    exports.WebViewEditorFindNextCommand = WebViewEditorFindNextCommand;
    WebViewEditorFindNextCommand.ID = 'editor.action.webvieweditor.findNext';
    WebViewEditorFindNextCommand.LABEL = nls.localize('editor.action.webvieweditor.findNext', 'Find next');
    class WebViewEditorFindPreviousCommand extends actions_2.Action2 {
        constructor(contextKeyExpr) {
            super({
                id: WebViewEditorFindPreviousCommand.ID,
                title: WebViewEditorFindPreviousCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 1024 /* Shift */ | 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getFocusedWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.runFindAction(true);
        }
    }
    exports.WebViewEditorFindPreviousCommand = WebViewEditorFindPreviousCommand;
    WebViewEditorFindPreviousCommand.ID = 'editor.action.webvieweditor.findPrevious';
    WebViewEditorFindPreviousCommand.LABEL = nls.localize('editor.action.webvieweditor.findPrevious', 'Find previous');
    class SelectAllWebviewEditorCommand extends actions_2.Action2 {
        constructor(contextKeyExpr) {
            const precondition = contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
            super({
                id: SelectAllWebviewEditorCommand.ID,
                title: SelectAllWebviewEditorCommand.LABEL,
                keybinding: {
                    when: precondition,
                    primary: 2048 /* CtrlCmd */ | 31 /* KEY_A */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getFocusedWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.selectAll();
        }
    }
    exports.SelectAllWebviewEditorCommand = SelectAllWebviewEditorCommand;
    SelectAllWebviewEditorCommand.ID = 'editor.action.webvieweditor.selectAll';
    SelectAllWebviewEditorCommand.LABEL = nls.localize('editor.action.webvieweditor.selectAll', 'Select all');
    let ReloadWebviewAction = class ReloadWebviewAction extends actions_1.Action {
        constructor(id, label, _editorService) {
            super(id, label);
            this._editorService = _editorService;
        }
        async run() {
            for (const editor of this._editorService.visibleEditors) {
                if (editor instanceof webviewEditorInput_1.WebviewInput) {
                    editor.webview.reload();
                }
            }
        }
    };
    ReloadWebviewAction.ID = 'workbench.action.webview.reloadWebviewAction';
    ReloadWebviewAction.LABEL = nls.localize('refreshWebviewLabel', "Reload Webviews");
    ReloadWebviewAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], ReloadWebviewAction);
    exports.ReloadWebviewAction = ReloadWebviewAction;
    function getFocusedWebviewEditor(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const activeEditor = editorService.activeEditorPane;
        return activeEditor instanceof webviewEditorInput_1.WebviewInput ? activeEditor.webview : undefined;
    }
    exports.getFocusedWebviewEditor = getFocusedWebviewEditor;
});
//# __sourceMappingURL=webviewCommands.js.map