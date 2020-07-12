/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/browser/ui/checkbox/checkbox", "vs/base/common/codicons", "vs/css!./findInput"], function (require, exports, nls, dom, inputBox_1, widget_1, event_1, checkbox_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaceInput = exports.PreserveCaseCheckbox = void 0;
    const NLS_DEFAULT_LABEL = nls.localize('defaultLabel', "input");
    const NLS_PRESERVE_CASE_LABEL = nls.localize('label.preserveCaseCheckbox', "Preserve Case");
    class PreserveCaseCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                // TODO: does this need its own icon?
                icon: codicons_1.Codicon.preserveCase,
                title: NLS_PRESERVE_CASE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.PreserveCaseCheckbox = PreserveCaseCheckbox;
    class ReplaceInput extends widget_1.Widget {
        constructor(parent, contextViewProvider, _showOptionButtons, options) {
            super();
            this._showOptionButtons = _showOptionButtons;
            this.fixFocusOnOptionClickEnabled = true;
            this.cachedOptionsWidth = 0;
            this._onDidOptionChange = this._register(new event_1.Emitter());
            this.onDidOptionChange = this._onDidOptionChange.event;
            this._onKeyDown = this._register(new event_1.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._onMouseDown = this._register(new event_1.Emitter());
            this.onMouseDown = this._onMouseDown.event;
            this._onInput = this._register(new event_1.Emitter());
            this.onInput = this._onInput.event;
            this._onKeyUp = this._register(new event_1.Emitter());
            this.onKeyUp = this._onKeyUp.event;
            this._onPreserveCaseKeyDown = this._register(new event_1.Emitter());
            this.onPreserveCaseKeyDown = this._onPreserveCaseKeyDown.event;
            this._lastHighlightFindOptions = 0;
            this.contextViewProvider = contextViewProvider;
            this.placeholder = options.placeholder || '';
            this.validation = options.validation;
            this.label = options.label || NLS_DEFAULT_LABEL;
            this.inputActiveOptionBorder = options.inputActiveOptionBorder;
            this.inputActiveOptionForeground = options.inputActiveOptionForeground;
            this.inputActiveOptionBackground = options.inputActiveOptionBackground;
            this.inputBackground = options.inputBackground;
            this.inputForeground = options.inputForeground;
            this.inputBorder = options.inputBorder;
            this.inputValidationInfoBorder = options.inputValidationInfoBorder;
            this.inputValidationInfoBackground = options.inputValidationInfoBackground;
            this.inputValidationInfoForeground = options.inputValidationInfoForeground;
            this.inputValidationWarningBorder = options.inputValidationWarningBorder;
            this.inputValidationWarningBackground = options.inputValidationWarningBackground;
            this.inputValidationWarningForeground = options.inputValidationWarningForeground;
            this.inputValidationErrorBorder = options.inputValidationErrorBorder;
            this.inputValidationErrorBackground = options.inputValidationErrorBackground;
            this.inputValidationErrorForeground = options.inputValidationErrorForeground;
            const history = options.history || [];
            const flexibleHeight = !!options.flexibleHeight;
            const flexibleWidth = !!options.flexibleWidth;
            const flexibleMaxHeight = options.flexibleMaxHeight;
            this.domNode = document.createElement('div');
            dom.addClass(this.domNode, 'monaco-findInput');
            this.inputBox = this._register(new inputBox_1.HistoryInputBox(this.domNode, this.contextViewProvider, {
                ariaLabel: this.label || '',
                placeholder: this.placeholder || '',
                validationOptions: {
                    validation: this.validation
                },
                inputBackground: this.inputBackground,
                inputForeground: this.inputForeground,
                inputBorder: this.inputBorder,
                inputValidationInfoBackground: this.inputValidationInfoBackground,
                inputValidationInfoForeground: this.inputValidationInfoForeground,
                inputValidationInfoBorder: this.inputValidationInfoBorder,
                inputValidationWarningBackground: this.inputValidationWarningBackground,
                inputValidationWarningForeground: this.inputValidationWarningForeground,
                inputValidationWarningBorder: this.inputValidationWarningBorder,
                inputValidationErrorBackground: this.inputValidationErrorBackground,
                inputValidationErrorForeground: this.inputValidationErrorForeground,
                inputValidationErrorBorder: this.inputValidationErrorBorder,
                history,
                flexibleHeight,
                flexibleWidth,
                flexibleMaxHeight
            }));
            this.preserveCase = this._register(new PreserveCaseCheckbox({
                appendTitle: '',
                isChecked: false,
                inputActiveOptionBorder: this.inputActiveOptionBorder,
                inputActiveOptionForeground: this.inputActiveOptionForeground,
                inputActiveOptionBackground: this.inputActiveOptionBackground,
            }));
            this._register(this.preserveCase.onChange(viaKeyboard => {
                this._onDidOptionChange.fire(viaKeyboard);
                if (!viaKeyboard && this.fixFocusOnOptionClickEnabled) {
                    this.inputBox.focus();
                }
                this.validate();
            }));
            this._register(this.preserveCase.onKeyDown(e => {
                this._onPreserveCaseKeyDown.fire(e);
            }));
            if (this._showOptionButtons) {
                this.cachedOptionsWidth = this.preserveCase.width();
            }
            else {
                this.cachedOptionsWidth = 0;
            }
            // Arrow-Key support to navigate between options
            let indexes = [this.preserveCase.domNode];
            this.onkeydown(this.domNode, (event) => {
                if (event.equals(15 /* LeftArrow */) || event.equals(17 /* RightArrow */) || event.equals(9 /* Escape */)) {
                    let index = indexes.indexOf(document.activeElement);
                    if (index >= 0) {
                        let newIndex = -1;
                        if (event.equals(17 /* RightArrow */)) {
                            newIndex = (index + 1) % indexes.length;
                        }
                        else if (event.equals(15 /* LeftArrow */)) {
                            if (index === 0) {
                                newIndex = indexes.length - 1;
                            }
                            else {
                                newIndex = index - 1;
                            }
                        }
                        if (event.equals(9 /* Escape */)) {
                            indexes[index].blur();
                        }
                        else if (newIndex >= 0) {
                            indexes[newIndex].focus();
                        }
                        dom.EventHelper.stop(event, true);
                    }
                }
            });
            let controls = document.createElement('div');
            controls.className = 'controls';
            controls.style.display = this._showOptionButtons ? 'block' : 'none';
            controls.appendChild(this.preserveCase.domNode);
            this.domNode.appendChild(controls);
            if (parent) {
                parent.appendChild(this.domNode);
            }
            this.onkeydown(this.inputBox.inputElement, (e) => this._onKeyDown.fire(e));
            this.onkeyup(this.inputBox.inputElement, (e) => this._onKeyUp.fire(e));
            this.oninput(this.inputBox.inputElement, (e) => this._onInput.fire());
            this.onmousedown(this.inputBox.inputElement, (e) => this._onMouseDown.fire(e));
        }
        enable() {
            dom.removeClass(this.domNode, 'disabled');
            this.inputBox.enable();
            this.preserveCase.enable();
        }
        disable() {
            dom.addClass(this.domNode, 'disabled');
            this.inputBox.disable();
            this.preserveCase.disable();
        }
        setFocusInputOnOptionClick(value) {
            this.fixFocusOnOptionClickEnabled = value;
        }
        setEnabled(enabled) {
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        }
        clear() {
            this.clearValidation();
            this.setValue('');
            this.focus();
        }
        getValue() {
            return this.inputBox.value;
        }
        setValue(value) {
            if (this.inputBox.value !== value) {
                this.inputBox.value = value;
            }
        }
        onSearchSubmit() {
            this.inputBox.addToHistory();
        }
        style(styles) {
            this.inputActiveOptionBorder = styles.inputActiveOptionBorder;
            this.inputActiveOptionForeground = styles.inputActiveOptionForeground;
            this.inputActiveOptionBackground = styles.inputActiveOptionBackground;
            this.inputBackground = styles.inputBackground;
            this.inputForeground = styles.inputForeground;
            this.inputBorder = styles.inputBorder;
            this.inputValidationInfoBackground = styles.inputValidationInfoBackground;
            this.inputValidationInfoForeground = styles.inputValidationInfoForeground;
            this.inputValidationInfoBorder = styles.inputValidationInfoBorder;
            this.inputValidationWarningBackground = styles.inputValidationWarningBackground;
            this.inputValidationWarningForeground = styles.inputValidationWarningForeground;
            this.inputValidationWarningBorder = styles.inputValidationWarningBorder;
            this.inputValidationErrorBackground = styles.inputValidationErrorBackground;
            this.inputValidationErrorForeground = styles.inputValidationErrorForeground;
            this.inputValidationErrorBorder = styles.inputValidationErrorBorder;
            this.applyStyles();
        }
        applyStyles() {
            if (this.domNode) {
                const checkBoxStyles = {
                    inputActiveOptionBorder: this.inputActiveOptionBorder,
                    inputActiveOptionForeground: this.inputActiveOptionForeground,
                    inputActiveOptionBackground: this.inputActiveOptionBackground,
                };
                this.preserveCase.style(checkBoxStyles);
                const inputBoxStyles = {
                    inputBackground: this.inputBackground,
                    inputForeground: this.inputForeground,
                    inputBorder: this.inputBorder,
                    inputValidationInfoBackground: this.inputValidationInfoBackground,
                    inputValidationInfoForeground: this.inputValidationInfoForeground,
                    inputValidationInfoBorder: this.inputValidationInfoBorder,
                    inputValidationWarningBackground: this.inputValidationWarningBackground,
                    inputValidationWarningForeground: this.inputValidationWarningForeground,
                    inputValidationWarningBorder: this.inputValidationWarningBorder,
                    inputValidationErrorBackground: this.inputValidationErrorBackground,
                    inputValidationErrorForeground: this.inputValidationErrorForeground,
                    inputValidationErrorBorder: this.inputValidationErrorBorder
                };
                this.inputBox.style(inputBoxStyles);
            }
        }
        select() {
            this.inputBox.select();
        }
        focus() {
            this.inputBox.focus();
        }
        getPreserveCase() {
            return this.preserveCase.checked;
        }
        setPreserveCase(value) {
            this.preserveCase.checked = value;
        }
        focusOnPreserve() {
            this.preserveCase.focus();
        }
        highlightFindOptions() {
            dom.removeClass(this.domNode, 'highlight-' + (this._lastHighlightFindOptions));
            this._lastHighlightFindOptions = 1 - this._lastHighlightFindOptions;
            dom.addClass(this.domNode, 'highlight-' + (this._lastHighlightFindOptions));
        }
        validate() {
            if (this.inputBox) {
                this.inputBox.validate();
            }
        }
        showMessage(message) {
            if (this.inputBox) {
                this.inputBox.showMessage(message);
            }
        }
        clearMessage() {
            if (this.inputBox) {
                this.inputBox.hideMessage();
            }
        }
        clearValidation() {
            if (this.inputBox) {
                this.inputBox.hideMessage();
            }
        }
        set width(newWidth) {
            this.inputBox.paddingRight = this.cachedOptionsWidth;
            this.inputBox.width = newWidth;
            this.domNode.style.width = newWidth + 'px';
        }
        dispose() {
            super.dispose();
        }
    }
    exports.ReplaceInput = ReplaceInput;
    ReplaceInput.OPTION_CHANGE = 'optionChange';
});
//# __sourceMappingURL=replaceInput.js.map