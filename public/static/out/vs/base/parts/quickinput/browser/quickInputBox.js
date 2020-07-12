/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/lifecycle", "vs/base/browser/keyboardEvent", "vs/base/common/severity", "vs/base/browser/mouseEvent", "vs/css!./media/quickInput"], function (require, exports, dom, inputBox_1, lifecycle_1, keyboardEvent_1, severity_1, mouseEvent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputBox = void 0;
    const $ = dom.$;
    class QuickInputBox extends lifecycle_1.Disposable {
        constructor(parent) {
            super();
            this.parent = parent;
            this.onKeyDown = (handler) => {
                return dom.addDisposableListener(this.inputBox.inputElement, dom.EventType.KEY_DOWN, (e) => {
                    handler(new keyboardEvent_1.StandardKeyboardEvent(e));
                });
            };
            this.onMouseDown = (handler) => {
                return dom.addDisposableListener(this.inputBox.inputElement, dom.EventType.MOUSE_DOWN, (e) => {
                    handler(new mouseEvent_1.StandardMouseEvent(e));
                });
            };
            this.onDidChange = (handler) => {
                return this.inputBox.onDidChange(handler);
            };
            this.container = dom.append(this.parent, $('.quick-input-box'));
            this.inputBox = this._register(new inputBox_1.InputBox(this.container, undefined));
        }
        get value() {
            return this.inputBox.value;
        }
        set value(value) {
            this.inputBox.value = value;
        }
        select(range = null) {
            this.inputBox.select(range);
        }
        isSelectionAtEnd() {
            return this.inputBox.isSelectionAtEnd();
        }
        setPlaceholder(placeholder) {
            this.inputBox.setPlaceHolder(placeholder);
        }
        get placeholder() {
            return this.inputBox.inputElement.getAttribute('placeholder') || '';
        }
        set placeholder(placeholder) {
            this.inputBox.setPlaceHolder(placeholder);
        }
        get ariaLabel() {
            return this.inputBox.getAriaLabel();
        }
        set ariaLabel(ariaLabel) {
            this.inputBox.setAriaLabel(ariaLabel);
        }
        get password() {
            return this.inputBox.inputElement.type === 'password';
        }
        set password(password) {
            this.inputBox.inputElement.type = password ? 'password' : 'text';
        }
        set enabled(enabled) {
            this.inputBox.setEnabled(enabled);
        }
        hasFocus() {
            return this.inputBox.hasFocus();
        }
        setAttribute(name, value) {
            this.inputBox.inputElement.setAttribute(name, value);
        }
        removeAttribute(name) {
            this.inputBox.inputElement.removeAttribute(name);
        }
        showDecoration(decoration) {
            if (decoration === severity_1.default.Ignore) {
                this.inputBox.hideMessage();
            }
            else {
                this.inputBox.showMessage({ type: decoration === severity_1.default.Info ? 1 /* INFO */ : decoration === severity_1.default.Warning ? 2 /* WARNING */ : 3 /* ERROR */, content: '' });
            }
        }
        stylesForType(decoration) {
            return this.inputBox.stylesForType(decoration === severity_1.default.Info ? 1 /* INFO */ : decoration === severity_1.default.Warning ? 2 /* WARNING */ : 3 /* ERROR */);
        }
        setFocus() {
            this.inputBox.focus();
        }
        layout() {
            this.inputBox.layout();
        }
        style(styles) {
            this.inputBox.style(styles);
        }
    }
    exports.QuickInputBox = QuickInputBox;
});
//# __sourceMappingURL=quickInputBox.js.map