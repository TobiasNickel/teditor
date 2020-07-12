/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorZoom"], function (require, exports, nls, editorExtensions_1, editorZoom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EditorFontZoomIn extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomIn',
                label: nls.localize('EditorFontZoomIn.label', "Editor Font Zoom In"),
                alias: 'Editor Font Zoom In',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(editorZoom_1.EditorZoom.getZoomLevel() + 1);
        }
    }
    class EditorFontZoomOut extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomOut',
                label: nls.localize('EditorFontZoomOut.label', "Editor Font Zoom Out"),
                alias: 'Editor Font Zoom Out',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(editorZoom_1.EditorZoom.getZoomLevel() - 1);
        }
    }
    class EditorFontZoomReset extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.fontZoomReset',
                label: nls.localize('EditorFontZoomReset.label', "Editor Font Zoom Reset"),
                alias: 'Editor Font Zoom Reset',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            editorZoom_1.EditorZoom.setZoomLevel(0);
        }
    }
    editorExtensions_1.registerEditorAction(EditorFontZoomIn);
    editorExtensions_1.registerEditorAction(EditorFontZoomOut);
    editorExtensions_1.registerEditorAction(EditorFontZoomReset);
});
//# __sourceMappingURL=fontZoom.js.map