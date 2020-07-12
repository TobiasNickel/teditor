/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorCommon"], function (require, exports, editorCommon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCodeEditor = exports.isCompositeEditor = exports.isDiffEditor = exports.isCodeEditor = exports.DiffEditorState = exports.MouseTargetType = exports.OverlayWidgetPositionPreference = exports.ContentWidgetPositionPreference = void 0;
    /**
     * A positioning preference for rendering content widgets.
     */
    var ContentWidgetPositionPreference;
    (function (ContentWidgetPositionPreference) {
        /**
         * Place the content widget exactly at a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["EXACT"] = 0] = "EXACT";
        /**
         * Place the content widget above a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["ABOVE"] = 1] = "ABOVE";
        /**
         * Place the content widget below a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["BELOW"] = 2] = "BELOW";
    })(ContentWidgetPositionPreference = exports.ContentWidgetPositionPreference || (exports.ContentWidgetPositionPreference = {}));
    /**
     * A positioning preference for rendering overlay widgets.
     */
    var OverlayWidgetPositionPreference;
    (function (OverlayWidgetPositionPreference) {
        /**
         * Position the overlay widget in the top right corner
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["TOP_RIGHT_CORNER"] = 0] = "TOP_RIGHT_CORNER";
        /**
         * Position the overlay widget in the bottom right corner
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["BOTTOM_RIGHT_CORNER"] = 1] = "BOTTOM_RIGHT_CORNER";
        /**
         * Position the overlay widget in the top center
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["TOP_CENTER"] = 2] = "TOP_CENTER";
    })(OverlayWidgetPositionPreference = exports.OverlayWidgetPositionPreference || (exports.OverlayWidgetPositionPreference = {}));
    /**
     * Type of hit element with the mouse in the editor.
     */
    var MouseTargetType;
    (function (MouseTargetType) {
        /**
         * Mouse is on top of an unknown element.
         */
        MouseTargetType[MouseTargetType["UNKNOWN"] = 0] = "UNKNOWN";
        /**
         * Mouse is on top of the textarea used for input.
         */
        MouseTargetType[MouseTargetType["TEXTAREA"] = 1] = "TEXTAREA";
        /**
         * Mouse is on top of the glyph margin
         */
        MouseTargetType[MouseTargetType["GUTTER_GLYPH_MARGIN"] = 2] = "GUTTER_GLYPH_MARGIN";
        /**
         * Mouse is on top of the line numbers
         */
        MouseTargetType[MouseTargetType["GUTTER_LINE_NUMBERS"] = 3] = "GUTTER_LINE_NUMBERS";
        /**
         * Mouse is on top of the line decorations
         */
        MouseTargetType[MouseTargetType["GUTTER_LINE_DECORATIONS"] = 4] = "GUTTER_LINE_DECORATIONS";
        /**
         * Mouse is on top of the whitespace left in the gutter by a view zone.
         */
        MouseTargetType[MouseTargetType["GUTTER_VIEW_ZONE"] = 5] = "GUTTER_VIEW_ZONE";
        /**
         * Mouse is on top of text in the content.
         */
        MouseTargetType[MouseTargetType["CONTENT_TEXT"] = 6] = "CONTENT_TEXT";
        /**
         * Mouse is on top of empty space in the content (e.g. after line text or below last line)
         */
        MouseTargetType[MouseTargetType["CONTENT_EMPTY"] = 7] = "CONTENT_EMPTY";
        /**
         * Mouse is on top of a view zone in the content.
         */
        MouseTargetType[MouseTargetType["CONTENT_VIEW_ZONE"] = 8] = "CONTENT_VIEW_ZONE";
        /**
         * Mouse is on top of a content widget.
         */
        MouseTargetType[MouseTargetType["CONTENT_WIDGET"] = 9] = "CONTENT_WIDGET";
        /**
         * Mouse is on top of the decorations overview ruler.
         */
        MouseTargetType[MouseTargetType["OVERVIEW_RULER"] = 10] = "OVERVIEW_RULER";
        /**
         * Mouse is on top of a scrollbar.
         */
        MouseTargetType[MouseTargetType["SCROLLBAR"] = 11] = "SCROLLBAR";
        /**
         * Mouse is on top of an overlay widget.
         */
        MouseTargetType[MouseTargetType["OVERLAY_WIDGET"] = 12] = "OVERLAY_WIDGET";
        /**
         * Mouse is outside of the editor.
         */
        MouseTargetType[MouseTargetType["OUTSIDE_EDITOR"] = 13] = "OUTSIDE_EDITOR";
    })(MouseTargetType = exports.MouseTargetType || (exports.MouseTargetType = {}));
    /**
     * @internal
     */
    var DiffEditorState;
    (function (DiffEditorState) {
        DiffEditorState[DiffEditorState["Idle"] = 0] = "Idle";
        DiffEditorState[DiffEditorState["ComputingDiff"] = 1] = "ComputingDiff";
        DiffEditorState[DiffEditorState["DiffComputed"] = 2] = "DiffComputed";
    })(DiffEditorState = exports.DiffEditorState || (exports.DiffEditorState = {}));
    /**
     *@internal
     */
    function isCodeEditor(thing) {
        if (thing && typeof thing.getEditorType === 'function') {
            return thing.getEditorType() === editorCommon.EditorType.ICodeEditor;
        }
        else {
            return false;
        }
    }
    exports.isCodeEditor = isCodeEditor;
    /**
     *@internal
     */
    function isDiffEditor(thing) {
        if (thing && typeof thing.getEditorType === 'function') {
            return thing.getEditorType() === editorCommon.EditorType.IDiffEditor;
        }
        else {
            return false;
        }
    }
    exports.isDiffEditor = isDiffEditor;
    /**
     *@internal
     */
    function isCompositeEditor(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.onDidChangeActiveEditor === 'function';
    }
    exports.isCompositeEditor = isCompositeEditor;
    /**
     *@internal
     */
    function getCodeEditor(thing) {
        if (isCodeEditor(thing)) {
            return thing;
        }
        if (isDiffEditor(thing)) {
            return thing.getModifiedEditor();
        }
        return null;
    }
    exports.getCodeEditor = getCodeEditor;
});
//# __sourceMappingURL=editorBrowser.js.map