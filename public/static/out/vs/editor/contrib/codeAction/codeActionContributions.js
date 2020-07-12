/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/codeAction/codeActionCommands"], function (require, exports, editorExtensions_1, codeActionCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    editorExtensions_1.registerEditorContribution(codeActionCommands_1.QuickFixController.ID, codeActionCommands_1.QuickFixController);
    editorExtensions_1.registerEditorAction(codeActionCommands_1.QuickFixAction);
    editorExtensions_1.registerEditorAction(codeActionCommands_1.RefactorAction);
    editorExtensions_1.registerEditorAction(codeActionCommands_1.SourceAction);
    editorExtensions_1.registerEditorAction(codeActionCommands_1.OrganizeImportsAction);
    editorExtensions_1.registerEditorAction(codeActionCommands_1.AutoFixAction);
    editorExtensions_1.registerEditorAction(codeActionCommands_1.FixAllAction);
    editorExtensions_1.registerEditorCommand(new codeActionCommands_1.CodeActionCommand());
});
//# __sourceMappingURL=codeActionContributions.js.map