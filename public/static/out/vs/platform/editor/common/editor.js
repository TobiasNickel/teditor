/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorSelectionRevealType = exports.EditorOpenContext = exports.EditorActivation = void 0;
    var EditorActivation;
    (function (EditorActivation) {
        /**
         * Activate the editor after it opened. This will automatically restore
         * the editor if it is minimized.
         */
        EditorActivation[EditorActivation["ACTIVATE"] = 0] = "ACTIVATE";
        /**
         * Only restore the editor if it is minimized but do not activate it.
         *
         * Note: will only work in combination with the `preserveFocus: true` option.
         * Otherwise, if focus moves into the editor, it will activate and restore
         * automatically.
         */
        EditorActivation[EditorActivation["RESTORE"] = 1] = "RESTORE";
        /**
         * Preserve the current active editor.
         *
         * Note: will only work in combination with the `preserveFocus: true` option.
         * Otherwise, if focus moves into the editor, it will activate and restore
         * automatically.
         */
        EditorActivation[EditorActivation["PRESERVE"] = 2] = "PRESERVE";
    })(EditorActivation = exports.EditorActivation || (exports.EditorActivation = {}));
    var EditorOpenContext;
    (function (EditorOpenContext) {
        /**
         * Default: the editor is opening via a programmatic call
         * to the editor service API.
         */
        EditorOpenContext[EditorOpenContext["API"] = 0] = "API";
        /**
         * Indicates that a user action triggered the opening, e.g.
         * via mouse or keyboard use.
         */
        EditorOpenContext[EditorOpenContext["USER"] = 1] = "USER";
    })(EditorOpenContext = exports.EditorOpenContext || (exports.EditorOpenContext = {}));
    var TextEditorSelectionRevealType;
    (function (TextEditorSelectionRevealType) {
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range centered vertically.
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["Center"] = 0] = "Center";
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range centered vertically only if it lies outside the viewport.
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["CenterIfOutsideViewport"] = 1] = "CenterIfOutsideViewport";
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range close to the top of the viewport, but not quite at the top.
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["NearTop"] = 2] = "NearTop";
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range close to the top of the viewport, but not quite at the top.
         * Only if it lies outside the viewport
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["NearTopIfOutsideViewport"] = 3] = "NearTopIfOutsideViewport";
    })(TextEditorSelectionRevealType = exports.TextEditorSelectionRevealType || (exports.TextEditorSelectionRevealType = {}));
});
//# __sourceMappingURL=editor.js.map