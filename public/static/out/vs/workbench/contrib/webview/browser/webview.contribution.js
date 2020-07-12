/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/actions", "vs/workbench/common/editor", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewEditorInputFactory", "../browser/webviewCommands", "./webviewEditor", "./webviewEditorInput", "./webviewWorkbenchService"], function (require, exports, nls_1, actions_1, contextkey_1, descriptors_1, extensions_1, platform_1, editor_1, actions_2, editor_2, webview_1, webviewEditorInputFactory_1, webviewCommands_1, webviewEditor_1, webviewEditorInput_1, webviewWorkbenchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (platform_1.Registry.as(editor_1.Extensions.Editors)).registerEditor(editor_1.EditorDescriptor.create(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, nls_1.localize('webview.editor.label', "webview editor")), [new descriptors_1.SyncDescriptor(webviewEditorInput_1.WebviewInput)]);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(webviewEditorInputFactory_1.WebviewEditorInputFactory.ID, webviewEditorInputFactory_1.WebviewEditorInputFactory);
    extensions_1.registerSingleton(webviewWorkbenchService_1.IWebviewWorkbenchService, webviewWorkbenchService_1.WebviewEditorService, true);
    const webviewActiveContextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', webviewEditor_1.WebviewEditor.ID), contextkey_1.ContextKeyExpr.not('editorFocus') /* https://github.com/Microsoft/vscode/issues/58668 */);
    actions_1.registerAction2(class extends webviewCommands_1.ShowWebViewEditorFindWidgetAction {
        constructor() { super(webviewActiveContextKeyExpr); }
    });
    actions_1.registerAction2(class extends webviewCommands_1.HideWebViewEditorFindCommand {
        constructor() { super(webviewActiveContextKeyExpr); }
    });
    actions_1.registerAction2(class extends webviewCommands_1.WebViewEditorFindNextCommand {
        constructor() { super(webviewActiveContextKeyExpr); }
    });
    actions_1.registerAction2(class extends webviewCommands_1.WebViewEditorFindPreviousCommand {
        constructor() { super(webviewActiveContextKeyExpr); }
    });
    actions_1.registerAction2(class extends webviewCommands_1.SelectAllWebviewEditorCommand {
        constructor() { super(webviewActiveContextKeyExpr); }
    });
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(webviewCommands_1.ReloadWebviewAction), 'Reload Webviews', webview_1.webviewDeveloperCategory);
});
//# __sourceMappingURL=webview.contribution.js.map