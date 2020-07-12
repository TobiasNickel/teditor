/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getVisibleCells = exports.reduceCellRanges = exports.CursorAtBoundary = exports.CellFocusMode = exports.CellEditState = exports.CellRevealPosition = exports.CellRevealType = exports.NOTEBOOK_HAS_MULTIPLE_KERNELS = exports.NOTEBOOK_CELL_HAS_OUTPUTS = exports.NOTEBOOK_CELL_RUN_STATE = exports.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE = exports.NOTEBOOK_CELL_RUNNABLE = exports.NOTEBOOK_CELL_EDITABLE = exports.NOTEBOOK_CELL_TYPE = exports.NOTEBOOK_VIEW_TYPE = exports.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK = exports.NOTEBOOK_EDITOR_RUNNABLE = exports.NOTEBOOK_EDITOR_EDITABLE = exports.NOTEBOOK_OUTPUT_FOCUSED = exports.NOTEBOOK_EDITOR_FOCUSED = exports.NOTEBOOK_IS_ACTIVE_EDITOR = exports.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED = void 0;
    exports.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('notebookFindWidgetFocused', false);
    // Is Notebook
    exports.NOTEBOOK_IS_ACTIVE_EDITOR = contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.notebook');
    // Editor keys
    exports.NOTEBOOK_EDITOR_FOCUSED = new contextkey_1.RawContextKey('notebookEditorFocused', false);
    exports.NOTEBOOK_OUTPUT_FOCUSED = new contextkey_1.RawContextKey('notebookOutputFocused', false);
    exports.NOTEBOOK_EDITOR_EDITABLE = new contextkey_1.RawContextKey('notebookEditable', true);
    exports.NOTEBOOK_EDITOR_RUNNABLE = new contextkey_1.RawContextKey('notebookRunnable', true);
    exports.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK = new contextkey_1.RawContextKey('notebookExecuting', false);
    // Cell keys
    exports.NOTEBOOK_VIEW_TYPE = new contextkey_1.RawContextKey('notebookViewType', undefined);
    exports.NOTEBOOK_CELL_TYPE = new contextkey_1.RawContextKey('notebookCellType', undefined); // code, markdown
    exports.NOTEBOOK_CELL_EDITABLE = new contextkey_1.RawContextKey('notebookCellEditable', false); // bool
    exports.NOTEBOOK_CELL_RUNNABLE = new contextkey_1.RawContextKey('notebookCellRunnable', false); // bool
    exports.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE = new contextkey_1.RawContextKey('notebookCellMarkdownEditMode', false); // bool
    exports.NOTEBOOK_CELL_RUN_STATE = new contextkey_1.RawContextKey('notebookCellRunState', undefined); // idle, running
    exports.NOTEBOOK_CELL_HAS_OUTPUTS = new contextkey_1.RawContextKey('notebookCellHasOutputs', false); // bool
    // Kernels
    exports.NOTEBOOK_HAS_MULTIPLE_KERNELS = new contextkey_1.RawContextKey('notebookHasMultipleKernels', false);
    var CellRevealType;
    (function (CellRevealType) {
        CellRevealType[CellRevealType["Line"] = 0] = "Line";
        CellRevealType[CellRevealType["Range"] = 1] = "Range";
    })(CellRevealType = exports.CellRevealType || (exports.CellRevealType = {}));
    var CellRevealPosition;
    (function (CellRevealPosition) {
        CellRevealPosition[CellRevealPosition["Top"] = 0] = "Top";
        CellRevealPosition[CellRevealPosition["Center"] = 1] = "Center";
    })(CellRevealPosition = exports.CellRevealPosition || (exports.CellRevealPosition = {}));
    var CellEditState;
    (function (CellEditState) {
        /**
         * Default state.
         * For markdown cell, it's Markdown preview.
         * For code cell, the browser focus should be on the container instead of the editor
         */
        CellEditState[CellEditState["Preview"] = 0] = "Preview";
        /**
         * Eding mode. Source for markdown or code is rendered in editors and the state will be persistent.
         */
        CellEditState[CellEditState["Editing"] = 1] = "Editing";
    })(CellEditState = exports.CellEditState || (exports.CellEditState = {}));
    var CellFocusMode;
    (function (CellFocusMode) {
        CellFocusMode[CellFocusMode["Container"] = 0] = "Container";
        CellFocusMode[CellFocusMode["Editor"] = 1] = "Editor";
    })(CellFocusMode = exports.CellFocusMode || (exports.CellFocusMode = {}));
    var CursorAtBoundary;
    (function (CursorAtBoundary) {
        CursorAtBoundary[CursorAtBoundary["None"] = 0] = "None";
        CursorAtBoundary[CursorAtBoundary["Top"] = 1] = "Top";
        CursorAtBoundary[CursorAtBoundary["Bottom"] = 2] = "Bottom";
        CursorAtBoundary[CursorAtBoundary["Both"] = 3] = "Both";
    })(CursorAtBoundary = exports.CursorAtBoundary || (exports.CursorAtBoundary = {}));
    /**
     * @param _ranges
     */
    function reduceCellRanges(_ranges) {
        if (!_ranges.length) {
            return [];
        }
        let ranges = _ranges.sort((a, b) => a.start - b.start);
        let result = [];
        let currentRangeStart = ranges[0].start;
        let currentRangeEnd = ranges[0].end + 1;
        for (let i = 0, len = ranges.length; i < len; i++) {
            let range = ranges[i];
            if (range.start > currentRangeEnd) {
                result.push({ start: currentRangeStart, end: currentRangeEnd - 1 });
                currentRangeStart = range.start;
                currentRangeEnd = range.end + 1;
            }
            else if (range.end + 1 > currentRangeEnd) {
                currentRangeEnd = range.end + 1;
            }
        }
        result.push({ start: currentRangeStart, end: currentRangeEnd - 1 });
        return result;
    }
    exports.reduceCellRanges = reduceCellRanges;
    function getVisibleCells(cells, hiddenRanges) {
        if (!hiddenRanges.length) {
            return cells;
        }
        let start = 0;
        let hiddenRangeIndex = 0;
        let result = [];
        while (start < cells.length && hiddenRangeIndex < hiddenRanges.length) {
            if (start < hiddenRanges[hiddenRangeIndex].start) {
                result.push(...cells.slice(start, hiddenRanges[hiddenRangeIndex].start));
            }
            start = hiddenRanges[hiddenRangeIndex].end + 1;
            hiddenRangeIndex++;
        }
        if (start < cells.length) {
            result.push(...cells.slice(start));
        }
        return result;
    }
    exports.getVisibleCells = getVisibleCells;
});
//# __sourceMappingURL=notebookBrowser.js.map