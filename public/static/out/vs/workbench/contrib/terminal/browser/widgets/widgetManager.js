/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWidgetManager = void 0;
    class TerminalWidgetManager {
        constructor() {
            this._attached = new Map();
        }
        attachToElement(terminalWrapper) {
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.classList.add('terminal-widget-container');
                terminalWrapper.appendChild(this._container);
            }
        }
        dispose() {
            if (this._container && this._container.parentElement) {
                this._container.parentElement.removeChild(this._container);
                this._container = undefined;
            }
        }
        attachWidget(widget) {
            var _a;
            if (!this._container) {
                return;
            }
            (_a = this._attached.get(widget.id)) === null || _a === void 0 ? void 0 : _a.dispose();
            widget.attach(this._container);
            this._attached.set(widget.id, widget);
            return {
                dispose: () => {
                    const current = this._attached.get(widget.id);
                    if (current === widget) {
                        this._attached.delete(widget.id);
                        widget.dispose();
                    }
                }
            };
        }
    }
    exports.TerminalWidgetManager = TerminalWidgetManager;
});
//# __sourceMappingURL=widgetManager.js.map