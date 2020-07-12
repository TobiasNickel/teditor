/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/contextmenu/contextmenu", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/suggest/suggestController", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/editor/browser/editorExtensions"], function (require, exports, contextmenu_1, snippetController2_1, suggestController_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSimpleCodeEditorWidgetOptions = exports.getSimpleEditorOptions = void 0;
    function getSimpleEditorOptions() {
        return {
            wordWrap: 'on',
            overviewRulerLanes: 0,
            glyphMargin: false,
            lineNumbers: 'off',
            folding: false,
            selectOnLineNumbers: false,
            hideCursorInOverviewRuler: true,
            selectionHighlight: false,
            scrollbar: {
                horizontal: 'hidden'
            },
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            fixedOverflowWidgets: true,
            acceptSuggestionOnEnter: 'smart',
            minimap: {
                enabled: false
            },
            renderIndentGuides: false
        };
    }
    exports.getSimpleEditorOptions = getSimpleEditorOptions;
    function getSimpleCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: true,
            contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                menuPreventer_1.MenuPreventer.ID,
                selectionClipboard_1.SelectionClipboardContributionID,
                contextmenu_1.ContextMenuController.ID,
                suggestController_1.SuggestController.ID,
                snippetController2_1.SnippetController2.ID,
                tabCompletion_1.TabCompletionController.ID,
            ])
        };
    }
    exports.getSimpleCodeEditorWidgetOptions = getSimpleCodeEditorWidgetOptions;
});
//# __sourceMappingURL=simpleEditorOptions.js.map