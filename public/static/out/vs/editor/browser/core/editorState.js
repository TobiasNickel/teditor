/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/browser/core/keybindingCancellation"], function (require, exports, strings, range_1, cancellation_1, lifecycle_1, keybindingCancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StableEditorScrollState = exports.TextModelCancellationTokenSource = exports.EditorStateCancellationTokenSource = exports.EditorState = exports.CodeEditorStateFlag = void 0;
    var CodeEditorStateFlag;
    (function (CodeEditorStateFlag) {
        CodeEditorStateFlag[CodeEditorStateFlag["Value"] = 1] = "Value";
        CodeEditorStateFlag[CodeEditorStateFlag["Selection"] = 2] = "Selection";
        CodeEditorStateFlag[CodeEditorStateFlag["Position"] = 4] = "Position";
        CodeEditorStateFlag[CodeEditorStateFlag["Scroll"] = 8] = "Scroll";
    })(CodeEditorStateFlag = exports.CodeEditorStateFlag || (exports.CodeEditorStateFlag = {}));
    class EditorState {
        constructor(editor, flags) {
            this.flags = flags;
            if ((this.flags & 1 /* Value */) !== 0) {
                const model = editor.getModel();
                this.modelVersionId = model ? strings.format('{0}#{1}', model.uri.toString(), model.getVersionId()) : null;
            }
            else {
                this.modelVersionId = null;
            }
            if ((this.flags & 4 /* Position */) !== 0) {
                this.position = editor.getPosition();
            }
            else {
                this.position = null;
            }
            if ((this.flags & 2 /* Selection */) !== 0) {
                this.selection = editor.getSelection();
            }
            else {
                this.selection = null;
            }
            if ((this.flags & 8 /* Scroll */) !== 0) {
                this.scrollLeft = editor.getScrollLeft();
                this.scrollTop = editor.getScrollTop();
            }
            else {
                this.scrollLeft = -1;
                this.scrollTop = -1;
            }
        }
        _equals(other) {
            if (!(other instanceof EditorState)) {
                return false;
            }
            const state = other;
            if (this.modelVersionId !== state.modelVersionId) {
                return false;
            }
            if (this.scrollLeft !== state.scrollLeft || this.scrollTop !== state.scrollTop) {
                return false;
            }
            if (!this.position && state.position || this.position && !state.position || this.position && state.position && !this.position.equals(state.position)) {
                return false;
            }
            if (!this.selection && state.selection || this.selection && !state.selection || this.selection && state.selection && !this.selection.equalsRange(state.selection)) {
                return false;
            }
            return true;
        }
        validate(editor) {
            return this._equals(new EditorState(editor, this.flags));
        }
    }
    exports.EditorState = EditorState;
    /**
     * A cancellation token source that cancels when the editor changes as expressed
     * by the provided flags
     * @param range If provided, changes in position and selection within this range will not trigger cancellation
     */
    class EditorStateCancellationTokenSource extends keybindingCancellation_1.EditorKeybindingCancellationTokenSource {
        constructor(editor, flags, range, parent) {
            super(editor, parent);
            this.editor = editor;
            this._listener = new lifecycle_1.DisposableStore();
            if (flags & 4 /* Position */) {
                this._listener.add(editor.onDidChangeCursorPosition(e => {
                    if (!range || !range_1.Range.containsPosition(range, e.position)) {
                        this.cancel();
                    }
                }));
            }
            if (flags & 2 /* Selection */) {
                this._listener.add(editor.onDidChangeCursorSelection(e => {
                    if (!range || !range_1.Range.containsRange(range, e.selection)) {
                        this.cancel();
                    }
                }));
            }
            if (flags & 8 /* Scroll */) {
                this._listener.add(editor.onDidScrollChange(_ => this.cancel()));
            }
            if (flags & 1 /* Value */) {
                this._listener.add(editor.onDidChangeModel(_ => this.cancel()));
                this._listener.add(editor.onDidChangeModelContent(_ => this.cancel()));
            }
        }
        dispose() {
            this._listener.dispose();
            super.dispose();
        }
    }
    exports.EditorStateCancellationTokenSource = EditorStateCancellationTokenSource;
    /**
     * A cancellation token source that cancels when the provided model changes
     */
    class TextModelCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        constructor(model, parent) {
            super(parent);
            this._listener = model.onDidChangeContent(() => this.cancel());
        }
        dispose() {
            this._listener.dispose();
            super.dispose();
        }
    }
    exports.TextModelCancellationTokenSource = TextModelCancellationTokenSource;
    class StableEditorScrollState {
        constructor(_visiblePosition, _visiblePositionScrollDelta, _cursorPosition) {
            this._visiblePosition = _visiblePosition;
            this._visiblePositionScrollDelta = _visiblePositionScrollDelta;
            this._cursorPosition = _cursorPosition;
        }
        static capture(editor) {
            let visiblePosition = null;
            let visiblePositionScrollDelta = 0;
            if (editor.getScrollTop() !== 0) {
                const visibleRanges = editor.getVisibleRanges();
                if (visibleRanges.length > 0) {
                    visiblePosition = visibleRanges[0].getStartPosition();
                    const visiblePositionScrollTop = editor.getTopForPosition(visiblePosition.lineNumber, visiblePosition.column);
                    visiblePositionScrollDelta = editor.getScrollTop() - visiblePositionScrollTop;
                }
            }
            return new StableEditorScrollState(visiblePosition, visiblePositionScrollDelta, editor.getPosition());
        }
        restore(editor) {
            if (this._visiblePosition) {
                const visiblePositionScrollTop = editor.getTopForPosition(this._visiblePosition.lineNumber, this._visiblePosition.column);
                editor.setScrollTop(visiblePositionScrollTop + this._visiblePositionScrollDelta);
            }
        }
        restoreRelativeVerticalPositionOfCursor(editor) {
            const currentCursorPosition = editor.getPosition();
            if (!this._cursorPosition || !currentCursorPosition) {
                return;
            }
            const offset = editor.getTopForLineNumber(currentCursorPosition.lineNumber) - editor.getTopForLineNumber(this._cursorPosition.lineNumber);
            editor.setScrollTop(editor.getScrollTop() + offset);
        }
    }
    exports.StableEditorScrollState = StableEditorScrollState;
});
//# __sourceMappingURL=editorState.js.map