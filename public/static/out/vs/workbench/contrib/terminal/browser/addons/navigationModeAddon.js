/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NavigationModeAddon = void 0;
    class NavigationModeAddon {
        constructor(_navigationModeContextKey) {
            this._navigationModeContextKey = _navigationModeContextKey;
        }
        activate(terminal) {
            this._terminal = terminal;
        }
        dispose() { }
        exitNavigationMode() {
            if (!this._terminal) {
                return;
            }
            this._terminal.scrollToBottom();
            this._terminal.focus();
        }
        focusPreviousLine() {
            if (!this._terminal || !this._terminal.element) {
                return;
            }
            // Focus previous row if a row is already focused
            if (document.activeElement && document.activeElement.parentElement && document.activeElement.parentElement.classList.contains('xterm-accessibility-tree')) {
                const element = document.activeElement.previousElementSibling;
                if (element) {
                    element.focus();
                    const disposable = dom_1.addDisposableListener(element, 'blur', () => {
                        this._navigationModeContextKey.set(false);
                        disposable.dispose();
                    });
                    this._navigationModeContextKey.set(true);
                }
                return;
            }
            // Ensure a11y tree exists
            const treeContainer = this._terminal.element.querySelector('.xterm-accessibility-tree');
            if (!treeContainer) {
                return;
            }
            // Target is row before the cursor
            const targetRow = Math.max(this._terminal.buffer.active.cursorY - 1, 0);
            // Check bounds
            if (treeContainer.childElementCount < targetRow) {
                return;
            }
            // Focus
            const element = treeContainer.childNodes.item(targetRow);
            element.focus();
            const disposable = dom_1.addDisposableListener(element, 'blur', () => {
                this._navigationModeContextKey.set(false);
                disposable.dispose();
            });
            this._navigationModeContextKey.set(true);
        }
        focusNextLine() {
            if (!this._terminal || !this._terminal.element) {
                return;
            }
            // Focus previous row if a row is already focused
            if (document.activeElement && document.activeElement.parentElement && document.activeElement.parentElement.classList.contains('xterm-accessibility-tree')) {
                const element = document.activeElement.nextElementSibling;
                if (element) {
                    element.focus();
                    const disposable = dom_1.addDisposableListener(element, 'blur', () => {
                        this._navigationModeContextKey.set(false);
                        disposable.dispose();
                    });
                    this._navigationModeContextKey.set(true);
                }
                return;
            }
            // Ensure a11y tree exists
            const treeContainer = this._terminal.element.querySelector('.xterm-accessibility-tree');
            if (!treeContainer) {
                return;
            }
            // Target is cursor row
            const targetRow = this._terminal.buffer.active.cursorY;
            // Check bounds
            if (treeContainer.childElementCount < targetRow) {
                return;
            }
            // Focus row before cursor
            const element = treeContainer.childNodes.item(targetRow);
            element.focus();
            const disposable = dom_1.addDisposableListener(element, 'blur', () => {
                this._navigationModeContextKey.set(false);
                disposable.dispose();
            });
            this._navigationModeContextKey.set(true);
        }
    }
    exports.NavigationModeAddon = NavigationModeAddon;
});
//# __sourceMappingURL=navigationModeAddon.js.map