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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/editor/common/editorContextKeys", "vs/editor/common/core/selection", "vs/base/common/keyCodes", "vs/platform/contextkey/common/contextkey", "vs/base/common/htmlContent", "vs/base/browser/ui/aria/aria", "vs/css!./anchorSelect"], function (require, exports, editorExtensions_1, nls_1, editorContextKeys_1, selection_1, keyCodes_1, contextkey_1, htmlContent_1, aria_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionAnchorSet = void 0;
    exports.SelectionAnchorSet = new contextkey_1.RawContextKey('selectionAnchorSet', false);
    let SelectionAnchorController = class SelectionAnchorController {
        constructor(editor, contextKeyService) {
            this.editor = editor;
            this.selectionAnchorSetContextKey = exports.SelectionAnchorSet.bindTo(contextKeyService);
            this.modelChangeListener = editor.onDidChangeModel(() => this.selectionAnchorSetContextKey.reset());
        }
        static get(editor) {
            return editor.getContribution(SelectionAnchorController.ID);
        }
        setSelectionAnchor() {
            if (this.editor.hasModel()) {
                const position = this.editor.getPosition();
                const previousDecorations = this.decorationId ? [this.decorationId] : [];
                const newDecorationId = this.editor.deltaDecorations(previousDecorations, [{
                        range: selection_1.Selection.fromPositions(position, position),
                        options: {
                            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
                            hoverMessage: new htmlContent_1.MarkdownString().appendText(nls_1.localize('selectionAnchor', "Selection Anchor")),
                            className: 'selection-anchor'
                        }
                    }]);
                this.decorationId = newDecorationId[0];
                this.selectionAnchorSetContextKey.set(!!this.decorationId);
                aria_1.alert(nls_1.localize('anchorSet', "Anchor set at {0}:{1}", position.lineNumber, position.column));
            }
        }
        goToSelectionAnchor() {
            if (this.editor.hasModel() && this.decorationId) {
                const anchorPosition = this.editor.getModel().getDecorationRange(this.decorationId);
                if (anchorPosition) {
                    this.editor.setPosition(anchorPosition.getStartPosition());
                }
            }
        }
        selectFromAnchorToCursor() {
            if (this.editor.hasModel() && this.decorationId) {
                const start = this.editor.getModel().getDecorationRange(this.decorationId);
                if (start) {
                    const end = this.editor.getPosition();
                    this.editor.setSelection(selection_1.Selection.fromPositions(start.getStartPosition(), end));
                    this.cancelSelectionAnchor();
                }
            }
        }
        cancelSelectionAnchor() {
            if (this.decorationId) {
                this.editor.deltaDecorations([this.decorationId], []);
                this.decorationId = undefined;
                this.selectionAnchorSetContextKey.set(false);
            }
        }
        dispose() {
            this.cancelSelectionAnchor();
            this.modelChangeListener.dispose();
        }
    };
    SelectionAnchorController.ID = 'editor.contrib.selectionAnchorController';
    SelectionAnchorController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], SelectionAnchorController);
    class SetSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.setSelectionAnchor',
                label: nls_1.localize('setSelectionAnchor', "Set Selection Anchor"),
                alias: 'Set Selection Anchor',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 32 /* KEY_B */),
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            const controller = SelectionAnchorController.get(editor);
            controller.setSelectionAnchor();
        }
    }
    class GoToSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.goToSelectionAnchor',
                label: nls_1.localize('goToSelectionAnchor', "Go to Selection Anchor"),
                alias: 'Go to Selection Anchor',
                precondition: exports.SelectionAnchorSet,
            });
        }
        async run(_accessor, editor) {
            const controller = SelectionAnchorController.get(editor);
            controller.goToSelectionAnchor();
        }
    }
    class SelectFromAnchorToCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectFromAnchorToCursor',
                label: nls_1.localize('selectFromAnchorToCursor', "Select from Anchor to Cursor"),
                alias: 'Select from Anchor to Cursor',
                precondition: exports.SelectionAnchorSet,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 41 /* KEY_K */),
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            const controller = SelectionAnchorController.get(editor);
            controller.selectFromAnchorToCursor();
        }
    }
    class CancelSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.cancelSelectionAnchor',
                label: nls_1.localize('cancelSelectionAnchor', "Cancel Selection Anchor"),
                alias: 'Cancel Selection Anchor',
                precondition: exports.SelectionAnchorSet,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 9 /* Escape */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            const controller = SelectionAnchorController.get(editor);
            controller.cancelSelectionAnchor();
        }
    }
    editorExtensions_1.registerEditorContribution(SelectionAnchorController.ID, SelectionAnchorController);
    editorExtensions_1.registerEditorAction(SetSelectionAnchor);
    editorExtensions_1.registerEditorAction(GoToSelectionAnchor);
    editorExtensions_1.registerEditorAction(SelectFromAnchorToCursor);
    editorExtensions_1.registerEditorAction(CancelSelectionAnchor);
});
//# __sourceMappingURL=anchorSelect.js.map