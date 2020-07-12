/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/dnd/dragAndDropCommand", "vs/editor/common/model/textModel", "vs/css!./dnd"], function (require, exports, lifecycle_1, platform_1, editorExtensions_1, position_1, range_1, selection_1, dragAndDropCommand_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragAndDropController = void 0;
    function hasTriggerModifier(e) {
        if (platform_1.isMacintosh) {
            return e.altKey;
        }
        else {
            return e.ctrlKey;
        }
    }
    class DragAndDropController extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._editor = editor;
            this._register(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
            this._register(this._editor.onMouseUp((e) => this._onEditorMouseUp(e)));
            this._register(this._editor.onMouseDrag((e) => this._onEditorMouseDrag(e)));
            this._register(this._editor.onMouseDrop((e) => this._onEditorMouseDrop(e)));
            this._register(this._editor.onKeyDown((e) => this.onEditorKeyDown(e)));
            this._register(this._editor.onKeyUp((e) => this.onEditorKeyUp(e)));
            this._register(this._editor.onDidBlurEditorWidget(() => this.onEditorBlur()));
            this._dndDecorationIds = [];
            this._mouseDown = false;
            this._modifierPressed = false;
            this._dragSelection = null;
        }
        static get(editor) {
            return editor.getContribution(DragAndDropController.ID);
        }
        onEditorBlur() {
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
            this._modifierPressed = false;
        }
        onEditorKeyDown(e) {
            if (!this._editor.getOption(25 /* dragAndDrop */) || this._editor.getOption(13 /* columnSelection */)) {
                return;
            }
            if (hasTriggerModifier(e)) {
                this._modifierPressed = true;
            }
            if (this._mouseDown && hasTriggerModifier(e)) {
                this._editor.updateOptions({
                    mouseStyle: 'copy'
                });
            }
        }
        onEditorKeyUp(e) {
            if (!this._editor.getOption(25 /* dragAndDrop */) || this._editor.getOption(13 /* columnSelection */)) {
                return;
            }
            if (hasTriggerModifier(e)) {
                this._modifierPressed = false;
            }
            if (this._mouseDown && e.keyCode === DragAndDropController.TRIGGER_KEY_VALUE) {
                this._editor.updateOptions({
                    mouseStyle: 'default'
                });
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._mouseDown = true;
        }
        _onEditorMouseUp(mouseEvent) {
            this._mouseDown = false;
            // Whenever users release the mouse, the drag and drop operation should finish and the cursor should revert to text.
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
        }
        _onEditorMouseDrag(mouseEvent) {
            let target = mouseEvent.target;
            if (this._dragSelection === null) {
                const selections = this._editor.getSelections() || [];
                let possibleSelections = selections.filter(selection => target.position && selection.containsPosition(target.position));
                if (possibleSelections.length === 1) {
                    this._dragSelection = possibleSelections[0];
                }
                else {
                    return;
                }
            }
            if (hasTriggerModifier(mouseEvent.event)) {
                this._editor.updateOptions({
                    mouseStyle: 'copy'
                });
            }
            else {
                this._editor.updateOptions({
                    mouseStyle: 'default'
                });
            }
            if (target.position) {
                if (this._dragSelection.containsPosition(target.position)) {
                    this._removeDecoration();
                }
                else {
                    this.showAt(target.position);
                }
            }
        }
        _onEditorMouseDrop(mouseEvent) {
            if (mouseEvent.target && (this._hitContent(mouseEvent.target) || this._hitMargin(mouseEvent.target)) && mouseEvent.target.position) {
                let newCursorPosition = new position_1.Position(mouseEvent.target.position.lineNumber, mouseEvent.target.position.column);
                if (this._dragSelection === null) {
                    let newSelections = null;
                    if (mouseEvent.event.shiftKey) {
                        let primarySelection = this._editor.getSelection();
                        if (primarySelection) {
                            const { selectionStartLineNumber, selectionStartColumn } = primarySelection;
                            newSelections = [new selection_1.Selection(selectionStartLineNumber, selectionStartColumn, newCursorPosition.lineNumber, newCursorPosition.column)];
                        }
                    }
                    else {
                        newSelections = (this._editor.getSelections() || []).map(selection => {
                            if (selection.containsPosition(newCursorPosition)) {
                                return new selection_1.Selection(newCursorPosition.lineNumber, newCursorPosition.column, newCursorPosition.lineNumber, newCursorPosition.column);
                            }
                            else {
                                return selection;
                            }
                        });
                    }
                    // Use `mouse` as the source instead of `api`.
                    this._editor.setSelections(newSelections || [], 'mouse');
                }
                else if (!this._dragSelection.containsPosition(newCursorPosition) ||
                    ((hasTriggerModifier(mouseEvent.event) ||
                        this._modifierPressed) && (this._dragSelection.getEndPosition().equals(newCursorPosition) || this._dragSelection.getStartPosition().equals(newCursorPosition)) // we allow users to paste content beside the selection
                    )) {
                    this._editor.pushUndoStop();
                    this._editor.executeCommand(DragAndDropController.ID, new dragAndDropCommand_1.DragAndDropCommand(this._dragSelection, newCursorPosition, hasTriggerModifier(mouseEvent.event) || this._modifierPressed));
                    this._editor.pushUndoStop();
                }
            }
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
        }
        showAt(position) {
            let newDecorations = [{
                    range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    options: DragAndDropController._DECORATION_OPTIONS
                }];
            this._dndDecorationIds = this._editor.deltaDecorations(this._dndDecorationIds, newDecorations);
            this._editor.revealPosition(position, 1 /* Immediate */);
        }
        _removeDecoration() {
            this._dndDecorationIds = this._editor.deltaDecorations(this._dndDecorationIds, []);
        }
        _hitContent(target) {
            return target.type === 6 /* CONTENT_TEXT */ ||
                target.type === 7 /* CONTENT_EMPTY */;
        }
        _hitMargin(target) {
            return target.type === 2 /* GUTTER_GLYPH_MARGIN */ ||
                target.type === 3 /* GUTTER_LINE_NUMBERS */ ||
                target.type === 4 /* GUTTER_LINE_DECORATIONS */;
        }
        dispose() {
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
            this._modifierPressed = false;
            super.dispose();
        }
    }
    exports.DragAndDropController = DragAndDropController;
    DragAndDropController.ID = 'editor.contrib.dragAndDrop';
    DragAndDropController.TRIGGER_KEY_VALUE = platform_1.isMacintosh ? 6 /* Alt */ : 5 /* Ctrl */;
    DragAndDropController._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
        className: 'dnd-target'
    });
    editorExtensions_1.registerEditorContribution(DragAndDropController.ID, DragAndDropController);
});
//# __sourceMappingURL=dnd.js.map