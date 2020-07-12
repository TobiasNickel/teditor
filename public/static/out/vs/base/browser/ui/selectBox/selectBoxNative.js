/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/browser/touch"], function (require, exports, lifecycle_1, event_1, dom, arrays, platform_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBoxNative = void 0;
    class SelectBoxNative extends lifecycle_1.Disposable {
        constructor(options, selected, styles, selectBoxOptions) {
            super();
            this.selected = 0;
            this.selectBoxOptions = selectBoxOptions || Object.create(null);
            this.options = [];
            this.selectElement = document.createElement('select');
            this.selectElement.className = 'monaco-select-box';
            if (typeof this.selectBoxOptions.ariaLabel === 'string') {
                this.selectElement.setAttribute('aria-label', this.selectBoxOptions.ariaLabel);
            }
            this._onDidSelect = this._register(new event_1.Emitter());
            this.styles = styles;
            this.registerListeners();
            this.setOptions(options, selected);
        }
        registerListeners() {
            this._register(touch_1.Gesture.addTarget(this.selectElement));
            [touch_1.EventType.Tap].forEach(eventType => {
                this._register(dom.addDisposableListener(this.selectElement, eventType, (e) => {
                    this.selectElement.focus();
                }));
            });
            this._register(dom.addStandardDisposableListener(this.selectElement, 'click', (e) => {
                dom.EventHelper.stop(e, true);
            }));
            this._register(dom.addStandardDisposableListener(this.selectElement, 'change', (e) => {
                this.selectElement.title = e.target.value;
                this._onDidSelect.fire({
                    index: e.target.selectedIndex,
                    selected: e.target.value
                });
            }));
            this._register(dom.addStandardDisposableListener(this.selectElement, 'keydown', (e) => {
                let showSelect = false;
                if (platform_1.isMacintosh) {
                    if (e.keyCode === 18 /* DownArrow */ || e.keyCode === 16 /* UpArrow */ || e.keyCode === 10 /* Space */) {
                        showSelect = true;
                    }
                }
                else {
                    if (e.keyCode === 18 /* DownArrow */ && e.altKey || e.keyCode === 10 /* Space */ || e.keyCode === 3 /* Enter */) {
                        showSelect = true;
                    }
                }
                if (showSelect) {
                    // Space, Enter, is used to expand select box, do not propagate it (prevent action bar action run)
                    e.stopPropagation();
                }
            }));
        }
        get onDidSelect() {
            return this._onDidSelect.event;
        }
        setOptions(options, selected) {
            if (!this.options || !arrays.equals(this.options, options)) {
                this.options = options;
                this.selectElement.options.length = 0;
                this.options.forEach((option, index) => {
                    this.selectElement.add(this.createOption(option.text, index, option.isDisabled));
                });
            }
            if (selected !== undefined) {
                this.select(selected);
            }
        }
        select(index) {
            if (this.options.length === 0) {
                this.selected = 0;
            }
            else if (index >= 0 && index < this.options.length) {
                this.selected = index;
            }
            else if (index > this.options.length - 1) {
                // Adjust index to end of list
                // This could make client out of sync with the select
                this.select(this.options.length - 1);
            }
            else if (this.selected < 0) {
                this.selected = 0;
            }
            this.selectElement.selectedIndex = this.selected;
            if ((this.selected < this.options.length) && typeof this.options[this.selected].text === 'string') {
                this.selectElement.title = this.options[this.selected].text;
            }
            else {
                this.selectElement.title = '';
            }
        }
        setAriaLabel(label) {
            this.selectBoxOptions.ariaLabel = label;
            this.selectElement.setAttribute('aria-label', label);
        }
        focus() {
            if (this.selectElement) {
                this.selectElement.focus();
            }
        }
        blur() {
            if (this.selectElement) {
                this.selectElement.blur();
            }
        }
        render(container) {
            dom.addClass(container, 'select-container');
            container.appendChild(this.selectElement);
            this.setOptions(this.options, this.selected);
            this.applyStyles();
        }
        style(styles) {
            this.styles = styles;
            this.applyStyles();
        }
        applyStyles() {
            // Style native select
            if (this.selectElement) {
                const background = this.styles.selectBackground ? this.styles.selectBackground.toString() : '';
                const foreground = this.styles.selectForeground ? this.styles.selectForeground.toString() : '';
                const border = this.styles.selectBorder ? this.styles.selectBorder.toString() : '';
                this.selectElement.style.backgroundColor = background;
                this.selectElement.style.color = foreground;
                this.selectElement.style.borderColor = border;
            }
        }
        createOption(value, index, disabled) {
            const option = document.createElement('option');
            option.value = value;
            option.text = value;
            option.disabled = !!disabled;
            return option;
        }
    }
    exports.SelectBoxNative = SelectBoxNative;
});
//# __sourceMappingURL=selectBoxNative.js.map