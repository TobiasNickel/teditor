/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/editOperation", "vs/editor/common/core/range"], function (require, exports, strings, editOperation_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.trimTrailingWhitespace = exports.TrimTrailingWhitespaceCommand = void 0;
    class TrimTrailingWhitespaceCommand {
        constructor(selection, cursors) {
            this._selection = selection;
            this._cursors = cursors;
            this._selectionId = null;
        }
        getEditOperations(model, builder) {
            let ops = trimTrailingWhitespace(model, this._cursors);
            for (let i = 0, len = ops.length; i < len; i++) {
                let op = ops[i];
                builder.addEditOperation(op.range, op.text);
            }
            this._selectionId = builder.trackSelection(this._selection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        }
    }
    exports.TrimTrailingWhitespaceCommand = TrimTrailingWhitespaceCommand;
    /**
     * Generate commands for trimming trailing whitespace on a model and ignore lines on which cursors are sitting.
     */
    function trimTrailingWhitespace(model, cursors) {
        // Sort cursors ascending
        cursors.sort((a, b) => {
            if (a.lineNumber === b.lineNumber) {
                return a.column - b.column;
            }
            return a.lineNumber - b.lineNumber;
        });
        // Reduce multiple cursors on the same line and only keep the last one on the line
        for (let i = cursors.length - 2; i >= 0; i--) {
            if (cursors[i].lineNumber === cursors[i + 1].lineNumber) {
                // Remove cursor at `i`
                cursors.splice(i, 1);
            }
        }
        let r = [];
        let rLen = 0;
        let cursorIndex = 0;
        let cursorLen = cursors.length;
        for (let lineNumber = 1, lineCount = model.getLineCount(); lineNumber <= lineCount; lineNumber++) {
            let lineContent = model.getLineContent(lineNumber);
            let maxLineColumn = lineContent.length + 1;
            let minEditColumn = 0;
            if (cursorIndex < cursorLen && cursors[cursorIndex].lineNumber === lineNumber) {
                minEditColumn = cursors[cursorIndex].column;
                cursorIndex++;
                if (minEditColumn === maxLineColumn) {
                    // The cursor is at the end of the line => no edits for sure on this line
                    continue;
                }
            }
            if (lineContent.length === 0) {
                continue;
            }
            let lastNonWhitespaceIndex = strings.lastNonWhitespaceIndex(lineContent);
            let fromColumn = 0;
            if (lastNonWhitespaceIndex === -1) {
                // Entire line is whitespace
                fromColumn = 1;
            }
            else if (lastNonWhitespaceIndex !== lineContent.length - 1) {
                // There is trailing whitespace
                fromColumn = lastNonWhitespaceIndex + 2;
            }
            else {
                // There is no trailing whitespace
                continue;
            }
            fromColumn = Math.max(minEditColumn, fromColumn);
            r[rLen++] = editOperation_1.EditOperation.delete(new range_1.Range(lineNumber, fromColumn, lineNumber, maxLineColumn));
        }
        return r;
    }
    exports.trimTrailingWhitespace = trimTrailingWhitespace;
});
//# __sourceMappingURL=trimTrailingWhitespaceCommand.js.map