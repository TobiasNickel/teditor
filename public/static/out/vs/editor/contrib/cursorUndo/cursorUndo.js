/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys"], function (require, exports, nls, lifecycle_1, editorExtensions_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorRedo = exports.CursorUndo = exports.CursorUndoRedoController = void 0;
    class CursorState {
        constructor(selections) {
            this.selections = selections;
        }
        equals(other) {
            const thisLen = this.selections.length;
            const otherLen = other.selections.length;
            if (thisLen !== otherLen) {
                return false;
            }
            for (let i = 0; i < thisLen; i++) {
                if (!this.selections[i].equalsSelection(other.selections[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class StackElement {
        constructor(cursorState, scrollTop, scrollLeft) {
            this.cursorState = cursorState;
            this.scrollTop = scrollTop;
            this.scrollLeft = scrollLeft;
        }
    }
    class CursorUndoRedoController extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._editor = editor;
            this._isCursorUndoRedo = false;
            this._undoStack = [];
            this._redoStack = [];
            this._register(editor.onDidChangeModel((e) => {
                this._undoStack = [];
                this._redoStack = [];
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                this._undoStack = [];
                this._redoStack = [];
            }));
            this._register(editor.onDidChangeCursorSelection((e) => {
                if (this._isCursorUndoRedo) {
                    return;
                }
                if (!e.oldSelections) {
                    return;
                }
                if (e.oldModelVersionId !== e.modelVersionId) {
                    return;
                }
                const prevState = new CursorState(e.oldSelections);
                const isEqualToLastUndoStack = (this._undoStack.length > 0 && this._undoStack[this._undoStack.length - 1].cursorState.equals(prevState));
                if (!isEqualToLastUndoStack) {
                    this._undoStack.push(new StackElement(prevState, editor.getScrollTop(), editor.getScrollLeft()));
                    this._redoStack = [];
                    if (this._undoStack.length > 50) {
                        // keep the cursor undo stack bounded
                        this._undoStack.shift();
                    }
                }
            }));
        }
        static get(editor) {
            return editor.getContribution(CursorUndoRedoController.ID);
        }
        cursorUndo() {
            if (!this._editor.hasModel() || this._undoStack.length === 0) {
                return;
            }
            this._redoStack.push(new StackElement(new CursorState(this._editor.getSelections()), this._editor.getScrollTop(), this._editor.getScrollLeft()));
            this._applyState(this._undoStack.pop());
        }
        cursorRedo() {
            if (!this._editor.hasModel() || this._redoStack.length === 0) {
                return;
            }
            this._undoStack.push(new StackElement(new CursorState(this._editor.getSelections()), this._editor.getScrollTop(), this._editor.getScrollLeft()));
            this._applyState(this._redoStack.pop());
        }
        _applyState(stackElement) {
            this._isCursorUndoRedo = true;
            this._editor.setSelections(stackElement.cursorState.selections);
            this._editor.setScrollPosition({
                scrollTop: stackElement.scrollTop,
                scrollLeft: stackElement.scrollLeft
            });
            this._isCursorUndoRedo = false;
        }
    }
    exports.CursorUndoRedoController = CursorUndoRedoController;
    CursorUndoRedoController.ID = 'editor.contrib.cursorUndoRedoController';
    class CursorUndo extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'cursorUndo',
                label: nls.localize('cursor.undo', "Cursor Undo"),
                alias: 'Cursor Undo',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 51 /* KEY_U */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            CursorUndoRedoController.get(editor).cursorUndo();
        }
    }
    exports.CursorUndo = CursorUndo;
    class CursorRedo extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'cursorRedo',
                label: nls.localize('cursor.redo', "Cursor Redo"),
                alias: 'Cursor Redo',
                precondition: undefined
            });
        }
        run(accessor, editor, args) {
            CursorUndoRedoController.get(editor).cursorRedo();
        }
    }
    exports.CursorRedo = CursorRedo;
    editorExtensions_1.registerEditorContribution(CursorUndoRedoController.ID, CursorUndoRedoController);
    editorExtensions_1.registerEditorAction(CursorUndo);
    editorExtensions_1.registerEditorAction(CursorRedo);
});
//# __sourceMappingURL=cursorUndo.js.map