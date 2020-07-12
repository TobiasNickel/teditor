/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/common/color", "vs/base/browser/ui/button/button", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/labels", "vs/base/common/platform", "vs/base/browser/ui/checkbox/checkbox", "vs/base/common/codicons", "vs/css!./dialog"], function (require, exports, nls, lifecycle_1, dom_1, event_1, keyboardEvent_1, color_1, button_1, actionbar_1, actions_1, labels_1, platform_1, checkbox_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dialog = void 0;
    const dialogErrorIcon = codicons_1.registerIcon('dialog-error', codicons_1.Codicon.error);
    const dialogWarningIcon = codicons_1.registerIcon('dialog-warning', codicons_1.Codicon.warning);
    const dialogInfoIcon = codicons_1.registerIcon('dialog-info', codicons_1.Codicon.info);
    const dialogCloseIcon = codicons_1.registerIcon('dialog-close', codicons_1.Codicon.close);
    class Dialog extends lifecycle_1.Disposable {
        constructor(container, message, buttons, options) {
            super();
            this.container = container;
            this.message = message;
            this.options = options;
            this.checkboxHasFocus = false;
            this.modal = this.container.appendChild(dom_1.$(`.monaco-dialog-modal-block${options.type === 'pending' ? '.dimmed' : ''}`));
            this.shadowElement = this.modal.appendChild(dom_1.$('.dialog-shadow'));
            this.element = this.shadowElement.appendChild(dom_1.$('.monaco-dialog-box'));
            this.element.setAttribute('role', 'dialog');
            dom_1.hide(this.element);
            // If no button is provided, default to OK
            this.buttons = buttons.length ? buttons : [nls.localize('ok', "OK")];
            const buttonsRowElement = this.element.appendChild(dom_1.$('.dialog-buttons-row'));
            this.buttonsContainer = buttonsRowElement.appendChild(dom_1.$('.dialog-buttons'));
            const messageRowElement = this.element.appendChild(dom_1.$('.dialog-message-row'));
            this.iconElement = messageRowElement.appendChild(dom_1.$('.dialog-icon'));
            const messageContainer = messageRowElement.appendChild(dom_1.$('.dialog-message-container'));
            if (this.options.detail) {
                const messageElement = messageContainer.appendChild(dom_1.$('.dialog-message'));
                const messageTextElement = messageElement.appendChild(dom_1.$('.dialog-message-text'));
                messageTextElement.innerText = this.message;
            }
            this.messageDetailElement = messageContainer.appendChild(dom_1.$('.dialog-message-detail'));
            this.messageDetailElement.innerText = this.options.detail ? this.options.detail : message;
            if (this.options.checkboxLabel) {
                const checkboxRowElement = messageContainer.appendChild(dom_1.$('.dialog-checkbox-row'));
                const checkbox = this.checkbox = this._register(new checkbox_1.SimpleCheckbox(this.options.checkboxLabel, !!this.options.checkboxChecked));
                checkboxRowElement.appendChild(checkbox.domNode);
                const checkboxMessageElement = checkboxRowElement.appendChild(dom_1.$('.dialog-checkbox-message'));
                checkboxMessageElement.innerText = this.options.checkboxLabel;
                this._register(dom_1.addDisposableListener(checkboxMessageElement, dom_1.EventType.CLICK, () => checkbox.checked = !checkbox.checked));
            }
            const toolbarRowElement = this.element.appendChild(dom_1.$('.dialog-toolbar-row'));
            this.toolbarContainer = toolbarRowElement.appendChild(dom_1.$('.dialog-toolbar'));
        }
        getAriaLabel() {
            let typeLabel = nls.localize('dialogInfoMessage', 'Info');
            switch (this.options.type) {
                case 'error':
                    nls.localize('dialogErrorMessage', 'Error');
                    break;
                case 'warning':
                    nls.localize('dialogWarningMessage', 'Warning');
                    break;
                case 'pending':
                    nls.localize('dialogPendingMessage', 'In Progress');
                    break;
                case 'none':
                case 'info':
                case 'question':
                default:
                    break;
            }
            return `${typeLabel}: ${this.message} ${this.options.detail || ''}`;
        }
        updateMessage(message) {
            if (this.messageDetailElement) {
                this.messageDetailElement.innerText = message;
            }
        }
        async show() {
            this.focusToReturn = document.activeElement;
            return new Promise((resolve) => {
                if (!this.element || !this.buttonsContainer || !this.iconElement || !this.toolbarContainer) {
                    resolve({ button: 0 });
                    return;
                }
                dom_1.clearNode(this.buttonsContainer);
                let focusedButton = 0;
                const buttonGroup = this.buttonGroup = new button_1.ButtonGroup(this.buttonsContainer, this.buttons.length, { title: true });
                const buttonMap = this.rearrangeButtons(this.buttons, this.options.cancelId);
                // Set focused button to UI index
                buttonMap.forEach((value, index) => {
                    if (value.index === 0) {
                        focusedButton = index;
                    }
                });
                buttonGroup.buttons.forEach((button, index) => {
                    button.label = labels_1.mnemonicButtonLabel(buttonMap[index].label, true);
                    this._register(button.onDidClick(e => {
                        dom_1.EventHelper.stop(e);
                        resolve({ button: buttonMap[index].index, checkboxChecked: this.checkbox ? this.checkbox.checked : undefined });
                    }));
                });
                this._register(event_1.domEvent(window, 'keydown', true)((e) => {
                    const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (evt.equals(3 /* Enter */) || evt.equals(10 /* Space */)) {
                        return;
                    }
                    let eventHandled = false;
                    if (evt.equals(1024 /* Shift */ | 2 /* Tab */) || evt.equals(15 /* LeftArrow */)) {
                        if (!this.checkboxHasFocus && focusedButton === 0) {
                            if (this.checkbox) {
                                this.checkbox.domNode.focus();
                            }
                            this.checkboxHasFocus = true;
                        }
                        else {
                            focusedButton = (this.checkboxHasFocus ? 0 : focusedButton) + buttonGroup.buttons.length - 1;
                            focusedButton = focusedButton % buttonGroup.buttons.length;
                            buttonGroup.buttons[focusedButton].focus();
                            this.checkboxHasFocus = false;
                        }
                        eventHandled = true;
                    }
                    else if (evt.equals(2 /* Tab */) || evt.equals(17 /* RightArrow */)) {
                        if (!this.checkboxHasFocus && focusedButton === buttonGroup.buttons.length - 1) {
                            if (this.checkbox) {
                                this.checkbox.domNode.focus();
                            }
                            this.checkboxHasFocus = true;
                        }
                        else {
                            focusedButton = this.checkboxHasFocus ? 0 : focusedButton + 1;
                            focusedButton = focusedButton % buttonGroup.buttons.length;
                            buttonGroup.buttons[focusedButton].focus();
                            this.checkboxHasFocus = false;
                        }
                        eventHandled = true;
                    }
                    if (eventHandled) {
                        dom_1.EventHelper.stop(e, true);
                    }
                    else if (this.options.keyEventProcessor) {
                        this.options.keyEventProcessor(evt);
                    }
                }));
                this._register(event_1.domEvent(window, 'keyup', true)((e) => {
                    dom_1.EventHelper.stop(e, true);
                    const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (evt.equals(9 /* Escape */)) {
                        resolve({ button: this.options.cancelId || 0, checkboxChecked: this.checkbox ? this.checkbox.checked : undefined });
                    }
                }));
                this._register(event_1.domEvent(this.element, 'focusout', false)((e) => {
                    if (!!e.relatedTarget && !!this.element) {
                        if (!dom_1.isAncestor(e.relatedTarget, this.element)) {
                            this.focusToReturn = e.relatedTarget;
                            if (e.target) {
                                e.target.focus();
                                dom_1.EventHelper.stop(e, true);
                            }
                        }
                    }
                }));
                dom_1.removeClasses(this.iconElement, dialogErrorIcon.classNames, dialogWarningIcon.classNames, dialogInfoIcon.classNames, codicons_1.Codicon.loading.classNames);
                switch (this.options.type) {
                    case 'error':
                        dom_1.addClasses(this.iconElement, dialogErrorIcon.classNames);
                        break;
                    case 'warning':
                        dom_1.addClasses(this.iconElement, dialogWarningIcon.classNames);
                        break;
                    case 'pending':
                        dom_1.addClasses(this.iconElement, codicons_1.Codicon.loading.classNames, 'codicon-animation-spin');
                        break;
                    case 'none':
                    case 'info':
                    case 'question':
                    default:
                        dom_1.addClasses(this.iconElement, dialogInfoIcon.classNames);
                        break;
                }
                const actionBar = new actionbar_1.ActionBar(this.toolbarContainer, {});
                const action = new actions_1.Action('dialog.close', nls.localize('dialogClose', "Close Dialog"), dialogCloseIcon.classNames, true, () => {
                    resolve({ button: this.options.cancelId || 0, checkboxChecked: this.checkbox ? this.checkbox.checked : undefined });
                    return Promise.resolve();
                });
                actionBar.push(action, { icon: true, label: false, });
                this.applyStyles();
                this.element.setAttribute('aria-label', this.getAriaLabel());
                dom_1.show(this.element);
                // Focus first element
                buttonGroup.buttons[focusedButton].focus();
            });
        }
        applyStyles() {
            if (this.styles) {
                const style = this.styles;
                const fgColor = style.dialogForeground ? `${style.dialogForeground}` : '';
                const bgColor = style.dialogBackground ? `${style.dialogBackground}` : '';
                const shadowColor = style.dialogShadow ? `0 0px 8px ${style.dialogShadow}` : '';
                const border = style.dialogBorder ? `1px solid ${style.dialogBorder}` : '';
                if (this.shadowElement) {
                    this.shadowElement.style.boxShadow = shadowColor;
                }
                if (this.element) {
                    this.element.style.color = fgColor;
                    this.element.style.backgroundColor = bgColor;
                    this.element.style.border = border;
                    if (this.buttonGroup) {
                        this.buttonGroup.buttons.forEach(button => button.style(style));
                    }
                    if (this.checkbox) {
                        this.checkbox.style(style);
                    }
                    if (this.messageDetailElement && fgColor && bgColor) {
                        const messageDetailColor = color_1.Color.fromHex(fgColor).transparent(.9);
                        this.messageDetailElement.style.color = messageDetailColor.makeOpaque(color_1.Color.fromHex(bgColor)).toString();
                    }
                    if (this.iconElement) {
                        let color;
                        switch (this.options.type) {
                            case 'error':
                                color = style.errorIconForeground;
                                break;
                            case 'warning':
                                color = style.warningIconForeground;
                                break;
                            default:
                                color = style.infoIconForeground;
                                break;
                        }
                        if (color) {
                            this.iconElement.style.color = color.toString();
                        }
                    }
                }
            }
        }
        style(style) {
            this.styles = style;
            this.applyStyles();
        }
        dispose() {
            super.dispose();
            if (this.modal) {
                dom_1.removeNode(this.modal);
                this.modal = undefined;
            }
            if (this.focusToReturn && dom_1.isAncestor(this.focusToReturn, document.body)) {
                this.focusToReturn.focus();
                this.focusToReturn = undefined;
            }
        }
        rearrangeButtons(buttons, cancelId) {
            const buttonMap = [];
            // Maps each button to its current label and old index so that when we move them around it's not a problem
            buttons.forEach((button, index) => {
                buttonMap.push({ label: button, index: index });
            });
            // macOS/linux: reverse button order
            if (platform_1.isMacintosh || platform_1.isLinux) {
                if (cancelId !== undefined) {
                    const cancelButton = buttonMap.splice(cancelId, 1)[0];
                    buttonMap.reverse();
                    buttonMap.splice(buttonMap.length - 1, 0, cancelButton);
                }
            }
            return buttonMap;
        }
    }
    exports.Dialog = Dialog;
});
//# __sourceMappingURL=dialog.js.map