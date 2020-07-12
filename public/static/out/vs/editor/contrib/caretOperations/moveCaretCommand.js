/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveCaretCommand = void 0;
    class MoveCaretCommand {
        constructor(selection, isMovingLeft) {
            this._selection = selection;
            this._isMovingLeft = isMovingLeft;
        }
        getEditOperations(model, builder) {
            if (this._selection.startLineNumber !== this._selection.endLineNumber || this._selection.isEmpty()) {
                return;
            }
            const lineNumber = this._selection.startLineNumber;
            const startColumn = this._selection.startColumn;
            const endColumn = this._selection.endColumn;
            if (this._isMovingLeft && startColumn === 1) {
                return;
            }
            if (!this._isMovingLeft && endColumn === model.getLineMaxColumn(lineNumber)) {
                return;
            }
            if (this._isMovingLeft) {
                const rangeBefore = new range_1.Range(lineNumber, startColumn - 1, lineNumber, startColumn);
                const charBefore = model.getValueInRange(rangeBefore);
                builder.addEditOperation(rangeBefore, null);
                builder.addEditOperation(new range_1.Range(lineNumber, endColumn, lineNumber, endColumn), charBefore);
            }
            else {
                const rangeAfter = new range_1.Range(lineNumber, endColumn, lineNumber, endColumn + 1);
                const charAfter = model.getValueInRange(rangeAfter);
                builder.addEditOperation(rangeAfter, null);
                builder.addEditOperation(new range_1.Range(lineNumber, startColumn, lineNumber, startColumn), charAfter);
            }
        }
        computeCursorState(model, helper) {
            if (this._isMovingLeft) {
                return new selection_1.Selection(this._selection.startLineNumber, this._selection.startColumn - 1, this._selection.endLineNumber, this._selection.endColumn - 1);
            }
            else {
                return new selection_1.Selection(this._selection.startLineNumber, this._selection.startColumn + 1, this._selection.endLineNumber, this._selection.endColumn + 1);
            }
        }
    }
    exports.MoveCaretCommand = MoveCaretCommand;
});
//# __sourceMappingURL=moveCaretCommand.js.map