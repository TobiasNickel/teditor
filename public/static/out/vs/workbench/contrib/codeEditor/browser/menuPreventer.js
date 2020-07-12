/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions"], function (require, exports, lifecycle_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuPreventer = void 0;
    /**
     * Prevents the top-level menu from showing up when doing Alt + Click in the editor
     */
    class MenuPreventer extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._editor = editor;
            this._altListeningMouse = false;
            this._altMouseTriggered = false;
            // A global crossover handler to prevent menu bar from showing up
            // When <alt> is hold, we will listen to mouse events and prevent
            // the release event up <alt> if the mouse is triggered.
            this._register(this._editor.onMouseDown((e) => {
                if (this._altListeningMouse) {
                    this._altMouseTriggered = true;
                }
            }));
            this._register(this._editor.onKeyDown((e) => {
                if (e.equals(512 /* Alt */)) {
                    if (!this._altListeningMouse) {
                        this._altMouseTriggered = false;
                    }
                    this._altListeningMouse = true;
                }
            }));
            this._register(this._editor.onKeyUp((e) => {
                if (e.equals(512 /* Alt */)) {
                    if (this._altMouseTriggered) {
                        e.preventDefault();
                    }
                    this._altListeningMouse = false;
                    this._altMouseTriggered = false;
                }
            }));
        }
    }
    exports.MenuPreventer = MenuPreventer;
    MenuPreventer.ID = 'editor.contrib.menuPreventer';
    editorExtensions_1.registerEditorContribution(MenuPreventer.ID, MenuPreventer);
});
//# __sourceMappingURL=menuPreventer.js.map