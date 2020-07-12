/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorContextKeys = void 0;
    var EditorContextKeys;
    (function (EditorContextKeys) {
        EditorContextKeys.editorSimpleInput = new contextkey_1.RawContextKey('editorSimpleInput', false);
        /**
         * A context key that is set when the editor's text has focus (cursor is blinking).
         * Is false when focus is in simple editor widgets (repl input, scm commit input).
         */
        EditorContextKeys.editorTextFocus = new contextkey_1.RawContextKey('editorTextFocus', false);
        /**
         * A context key that is set when the editor's text or an editor's widget has focus.
         */
        EditorContextKeys.focus = new contextkey_1.RawContextKey('editorFocus', false);
        /**
         * A context key that is set when any editor input has focus (regular editor, repl input...).
         */
        EditorContextKeys.textInputFocus = new contextkey_1.RawContextKey('textInputFocus', false);
        EditorContextKeys.readOnly = new contextkey_1.RawContextKey('editorReadonly', false);
        EditorContextKeys.columnSelection = new contextkey_1.RawContextKey('editorColumnSelection', false);
        EditorContextKeys.writable = EditorContextKeys.readOnly.toNegated();
        EditorContextKeys.hasNonEmptySelection = new contextkey_1.RawContextKey('editorHasSelection', false);
        EditorContextKeys.hasOnlyEmptySelection = EditorContextKeys.hasNonEmptySelection.toNegated();
        EditorContextKeys.hasMultipleSelections = new contextkey_1.RawContextKey('editorHasMultipleSelections', false);
        EditorContextKeys.hasSingleSelection = EditorContextKeys.hasMultipleSelections.toNegated();
        EditorContextKeys.tabMovesFocus = new contextkey_1.RawContextKey('editorTabMovesFocus', false);
        EditorContextKeys.tabDoesNotMoveFocus = EditorContextKeys.tabMovesFocus.toNegated();
        EditorContextKeys.isInWalkThroughSnippet = new contextkey_1.RawContextKey('isInEmbeddedEditor', false);
        EditorContextKeys.canUndo = new contextkey_1.RawContextKey('canUndo', false);
        EditorContextKeys.canRedo = new contextkey_1.RawContextKey('canRedo', false);
        EditorContextKeys.hoverVisible = new contextkey_1.RawContextKey('editorHoverVisible', false);
        /**
         * A context key that is set when an editor is part of a larger editor, like notebooks or
         * (future) a diff editor
         */
        EditorContextKeys.inCompositeEditor = new contextkey_1.RawContextKey('inCompositeEditor', undefined);
        EditorContextKeys.notInCompositeEditor = EditorContextKeys.inCompositeEditor.toNegated();
        // -- mode context keys
        EditorContextKeys.languageId = new contextkey_1.RawContextKey('editorLangId', '');
        EditorContextKeys.hasCompletionItemProvider = new contextkey_1.RawContextKey('editorHasCompletionItemProvider', false);
        EditorContextKeys.hasCodeActionsProvider = new contextkey_1.RawContextKey('editorHasCodeActionsProvider', false);
        EditorContextKeys.hasCodeLensProvider = new contextkey_1.RawContextKey('editorHasCodeLensProvider', false);
        EditorContextKeys.hasDefinitionProvider = new contextkey_1.RawContextKey('editorHasDefinitionProvider', false);
        EditorContextKeys.hasDeclarationProvider = new contextkey_1.RawContextKey('editorHasDeclarationProvider', false);
        EditorContextKeys.hasImplementationProvider = new contextkey_1.RawContextKey('editorHasImplementationProvider', false);
        EditorContextKeys.hasTypeDefinitionProvider = new contextkey_1.RawContextKey('editorHasTypeDefinitionProvider', false);
        EditorContextKeys.hasHoverProvider = new contextkey_1.RawContextKey('editorHasHoverProvider', false);
        EditorContextKeys.hasDocumentHighlightProvider = new contextkey_1.RawContextKey('editorHasDocumentHighlightProvider', false);
        EditorContextKeys.hasDocumentSymbolProvider = new contextkey_1.RawContextKey('editorHasDocumentSymbolProvider', false);
        EditorContextKeys.hasReferenceProvider = new contextkey_1.RawContextKey('editorHasReferenceProvider', false);
        EditorContextKeys.hasRenameProvider = new contextkey_1.RawContextKey('editorHasRenameProvider', false);
        EditorContextKeys.hasSignatureHelpProvider = new contextkey_1.RawContextKey('editorHasSignatureHelpProvider', false);
        // -- mode context keys: formatting
        EditorContextKeys.hasDocumentFormattingProvider = new contextkey_1.RawContextKey('editorHasDocumentFormattingProvider', false);
        EditorContextKeys.hasDocumentSelectionFormattingProvider = new contextkey_1.RawContextKey('editorHasDocumentSelectionFormattingProvider', false);
        EditorContextKeys.hasMultipleDocumentFormattingProvider = new contextkey_1.RawContextKey('editorHasMultipleDocumentFormattingProvider', false);
        EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider = new contextkey_1.RawContextKey('editorHasMultipleDocumentSelectionFormattingProvider', false);
    })(EditorContextKeys = exports.EditorContextKeys || (exports.EditorContextKeys = {}));
});
//# __sourceMappingURL=editorContextKeys.js.map