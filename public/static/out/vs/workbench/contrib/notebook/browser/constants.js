/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EDITOR_BOTTOM_PADDING = exports.EDITOR_TOP_PADDING = exports.EDITOR_TOP_MARGIN = exports.CELL_STATUSBAR_HEIGHT = exports.BOTTOM_CELL_TOOLBAR_HEIGHT = exports.EDITOR_TOOLBAR_HEIGHT = exports.CELL_RUN_GUTTER = exports.CELL_MARGIN = exports.SCROLLABLE_ELEMENT_PADDING_TOP = void 0;
    // Scrollable Element
    exports.SCROLLABLE_ELEMENT_PADDING_TOP = 20;
    // Cell sizing related
    exports.CELL_MARGIN = 20;
    exports.CELL_RUN_GUTTER = 32;
    exports.EDITOR_TOOLBAR_HEIGHT = 0;
    exports.BOTTOM_CELL_TOOLBAR_HEIGHT = 32;
    exports.CELL_STATUSBAR_HEIGHT = 22;
    // Top margin of editor
    exports.EDITOR_TOP_MARGIN = 0;
    // Top and bottom padding inside the monaco editor in a cell, which are included in `cell.editorHeight`
    exports.EDITOR_TOP_PADDING = 12;
    exports.EDITOR_BOTTOM_PADDING = 12;
});
//# __sourceMappingURL=constants.js.map