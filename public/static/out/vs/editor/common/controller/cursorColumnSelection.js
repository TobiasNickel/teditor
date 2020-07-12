/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/controller/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, cursorCommon_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColumnSelection = void 0;
    class ColumnSelection {
        static columnSelect(config, model, fromLineNumber, fromVisibleColumn, toLineNumber, toVisibleColumn) {
            let lineCount = Math.abs(toLineNumber - fromLineNumber) + 1;
            let reversed = (fromLineNumber > toLineNumber);
            let isRTL = (fromVisibleColumn > toVisibleColumn);
            let isLTR = (fromVisibleColumn < toVisibleColumn);
            let result = [];
            // console.log(`fromVisibleColumn: ${fromVisibleColumn}, toVisibleColumn: ${toVisibleColumn}`);
            for (let i = 0; i < lineCount; i++) {
                let lineNumber = fromLineNumber + (reversed ? -i : i);
                let startColumn = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(config, model, lineNumber, fromVisibleColumn);
                let endColumn = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(config, model, lineNumber, toVisibleColumn);
                let visibleStartColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, new position_1.Position(lineNumber, startColumn));
                let visibleEndColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, new position_1.Position(lineNumber, endColumn));
                // console.log(`lineNumber: ${lineNumber}: visibleStartColumn: ${visibleStartColumn}, visibleEndColumn: ${visibleEndColumn}`);
                if (isLTR) {
                    if (visibleStartColumn > toVisibleColumn) {
                        continue;
                    }
                    if (visibleEndColumn < fromVisibleColumn) {
                        continue;
                    }
                }
                if (isRTL) {
                    if (visibleEndColumn > fromVisibleColumn) {
                        continue;
                    }
                    if (visibleStartColumn < toVisibleColumn) {
                        continue;
                    }
                }
                result.push(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, startColumn, lineNumber, startColumn), 0, new position_1.Position(lineNumber, endColumn), 0));
            }
            if (result.length === 0) {
                // We are after all the lines, so add cursor at the end of each line
                for (let i = 0; i < lineCount; i++) {
                    const lineNumber = fromLineNumber + (reversed ? -i : i);
                    const maxColumn = model.getLineMaxColumn(lineNumber);
                    result.push(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, maxColumn, lineNumber, maxColumn), 0, new position_1.Position(lineNumber, maxColumn), 0));
                }
            }
            return {
                viewStates: result,
                reversed: reversed,
                fromLineNumber: fromLineNumber,
                fromVisualColumn: fromVisibleColumn,
                toLineNumber: toLineNumber,
                toVisualColumn: toVisibleColumn
            };
        }
        static columnSelectLeft(config, model, prevColumnSelectData) {
            let toViewVisualColumn = prevColumnSelectData.toViewVisualColumn;
            if (toViewVisualColumn > 1) {
                toViewVisualColumn--;
            }
            return ColumnSelection.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, prevColumnSelectData.toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectRight(config, model, prevColumnSelectData) {
            let maxVisualViewColumn = 0;
            const minViewLineNumber = Math.min(prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.toViewLineNumber);
            const maxViewLineNumber = Math.max(prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.toViewLineNumber);
            for (let lineNumber = minViewLineNumber; lineNumber <= maxViewLineNumber; lineNumber++) {
                const lineMaxViewColumn = model.getLineMaxColumn(lineNumber);
                const lineMaxVisualViewColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn2(config, model, new position_1.Position(lineNumber, lineMaxViewColumn));
                maxVisualViewColumn = Math.max(maxVisualViewColumn, lineMaxVisualViewColumn);
            }
            let toViewVisualColumn = prevColumnSelectData.toViewVisualColumn;
            if (toViewVisualColumn < maxVisualViewColumn) {
                toViewVisualColumn++;
            }
            return this.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, prevColumnSelectData.toViewLineNumber, toViewVisualColumn);
        }
        static columnSelectUp(config, model, prevColumnSelectData, isPaged) {
            const linesCount = isPaged ? config.pageSize : 1;
            const toViewLineNumber = Math.max(1, prevColumnSelectData.toViewLineNumber - linesCount);
            return this.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, toViewLineNumber, prevColumnSelectData.toViewVisualColumn);
        }
        static columnSelectDown(config, model, prevColumnSelectData, isPaged) {
            const linesCount = isPaged ? config.pageSize : 1;
            const toViewLineNumber = Math.min(model.getLineCount(), prevColumnSelectData.toViewLineNumber + linesCount);
            return this.columnSelect(config, model, prevColumnSelectData.fromViewLineNumber, prevColumnSelectData.fromViewVisualColumn, toViewLineNumber, prevColumnSelectData.toViewVisualColumn);
        }
    }
    exports.ColumnSelection = ColumnSelection;
});
//# __sourceMappingURL=cursorColumnSelection.js.map