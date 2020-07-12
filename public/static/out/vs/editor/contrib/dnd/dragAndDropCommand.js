/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/selection", "vs/editor/common/core/range"], function (require, exports, selection_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragAndDropCommand = void 0;
    class DragAndDropCommand {
        constructor(selection, targetPosition, copy) {
            this.selection = selection;
            this.targetPosition = targetPosition;
            this.copy = copy;
            this.targetSelection = null;
        }
        getEditOperations(model, builder) {
            let text = model.getValueInRange(this.selection);
            if (!this.copy) {
                builder.addEditOperation(this.selection, null);
            }
            builder.addEditOperation(new range_1.Range(this.targetPosition.lineNumber, this.targetPosition.column, this.targetPosition.lineNumber, this.targetPosition.column), text);
            if (this.selection.containsPosition(this.targetPosition) && !(this.copy && (this.selection.getEndPosition().equals(this.targetPosition) || this.selection.getStartPosition().equals(this.targetPosition)) // we allow users to paste content beside the selection
            )) {
                this.targetSelection = this.selection;
                return;
            }
            if (this.copy) {
                this.targetSelection = new selection_1.Selection(this.targetPosition.lineNumber, this.targetPosition.column, this.selection.endLineNumber - this.selection.startLineNumber + this.targetPosition.lineNumber, this.selection.startLineNumber === this.selection.endLineNumber ?
                    this.targetPosition.column + this.selection.endColumn - this.selection.startColumn :
                    this.selection.endColumn);
                return;
            }
            if (this.targetPosition.lineNumber > this.selection.endLineNumber) {
                // Drag the selection downwards
                this.targetSelection = new selection_1.Selection(this.targetPosition.lineNumber - this.selection.endLineNumber + this.selection.startLineNumber, this.targetPosition.column, this.targetPosition.lineNumber, this.selection.startLineNumber === this.selection.endLineNumber ?
                    this.targetPosition.column + this.selection.endColumn - this.selection.startColumn :
                    this.selection.endColumn);
                return;
            }
            if (this.targetPosition.lineNumber < this.selection.endLineNumber) {
                // Drag the selection upwards
                this.targetSelection = new selection_1.Selection(this.targetPosition.lineNumber, this.targetPosition.column, this.targetPosition.lineNumber + this.selection.endLineNumber - this.selection.startLineNumber, this.selection.startLineNumber === this.selection.endLineNumber ?
                    this.targetPosition.column + this.selection.endColumn - this.selection.startColumn :
                    this.selection.endColumn);
                return;
            }
            // The target position is at the same line as the selection's end position.
            if (this.selection.endColumn <= this.targetPosition.column) {
                // The target position is after the selection's end position
                this.targetSelection = new selection_1.Selection(this.targetPosition.lineNumber - this.selection.endLineNumber + this.selection.startLineNumber, this.selection.startLineNumber === this.selection.endLineNumber ?
                    this.targetPosition.column - this.selection.endColumn + this.selection.startColumn :
                    this.targetPosition.column - this.selection.endColumn + this.selection.startColumn, this.targetPosition.lineNumber, this.selection.startLineNumber === this.selection.endLineNumber ?
                    this.targetPosition.column :
                    this.selection.endColumn);
            }
            else {
                // The target position is before the selection's end position. Since the selection doesn't contain the target position, the selection is one-line and target position is before this selection.
                this.targetSelection = new selection_1.Selection(this.targetPosition.lineNumber - this.selection.endLineNumber + this.selection.startLineNumber, this.targetPosition.column, this.targetPosition.lineNumber, this.targetPosition.column + this.selection.endColumn - this.selection.startColumn);
            }
        }
        computeCursorState(model, helper) {
            return this.targetSelection;
        }
    }
    exports.DragAndDropCommand = DragAndDropCommand;
});
//# __sourceMappingURL=dragAndDropCommand.js.map