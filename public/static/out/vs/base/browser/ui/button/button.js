/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/color", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/touch", "vs/base/common/codicons", "vs/base/common/strings", "vs/css!./button"], function (require, exports, DOM, keyboardEvent_1, color_1, objects_1, event_1, lifecycle_1, touch_1, codicons_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ButtonGroup = exports.Button = void 0;
    const defaultOptions = {
        buttonBackground: color_1.Color.fromHex('#0E639C'),
        buttonHoverBackground: color_1.Color.fromHex('#006BB3'),
        buttonForeground: color_1.Color.white
    };
    class Button extends lifecycle_1.Disposable {
        constructor(container, options) {
            super();
            this._onDidClick = this._register(new event_1.Emitter());
            this.options = options || Object.create(null);
            objects_1.mixin(this.options, defaultOptions, false);
            this.buttonForeground = this.options.buttonForeground;
            this.buttonBackground = this.options.buttonBackground;
            this.buttonHoverBackground = this.options.buttonHoverBackground;
            this.buttonSecondaryForeground = this.options.buttonSecondaryForeground;
            this.buttonSecondaryBackground = this.options.buttonSecondaryBackground;
            this.buttonSecondaryHoverBackground = this.options.buttonSecondaryHoverBackground;
            this.buttonBorder = this.options.buttonBorder;
            this._element = document.createElement('a');
            DOM.addClass(this._element, 'monaco-button');
            this._element.tabIndex = 0;
            this._element.setAttribute('role', 'button');
            container.appendChild(this._element);
            this._register(touch_1.Gesture.addTarget(this._element));
            [DOM.EventType.CLICK, touch_1.EventType.Tap].forEach(eventType => {
                this._register(DOM.addDisposableListener(this._element, eventType, e => {
                    if (!this.enabled) {
                        DOM.EventHelper.stop(e);
                        return;
                    }
                    this._onDidClick.fire(e);
                }));
            });
            this._register(DOM.addDisposableListener(this._element, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let eventHandled = false;
                if (this.enabled && (event.equals(3 /* Enter */) || event.equals(10 /* Space */))) {
                    this._onDidClick.fire(e);
                    eventHandled = true;
                }
                else if (event.equals(9 /* Escape */)) {
                    this._element.blur();
                    eventHandled = true;
                }
                if (eventHandled) {
                    DOM.EventHelper.stop(event, true);
                }
            }));
            this._register(DOM.addDisposableListener(this._element, DOM.EventType.MOUSE_OVER, e => {
                if (!DOM.hasClass(this._element, 'disabled')) {
                    this.setHoverBackground();
                }
            }));
            this._register(DOM.addDisposableListener(this._element, DOM.EventType.MOUSE_OUT, e => {
                this.applyStyles(); // restore standard styles
            }));
            // Also set hover background when button is focused for feedback
            this.focusTracker = this._register(DOM.trackFocus(this._element));
            this._register(this.focusTracker.onDidFocus(() => this.setHoverBackground()));
            this._register(this.focusTracker.onDidBlur(() => this.applyStyles())); // restore standard styles
            this.applyStyles();
        }
        get onDidClick() { return this._onDidClick.event; }
        setHoverBackground() {
            let hoverBackground;
            if (this.options.secondary) {
                hoverBackground = this.buttonSecondaryHoverBackground ? this.buttonSecondaryHoverBackground.toString() : null;
            }
            else {
                hoverBackground = this.buttonHoverBackground ? this.buttonHoverBackground.toString() : null;
            }
            if (hoverBackground) {
                this._element.style.backgroundColor = hoverBackground;
            }
        }
        style(styles) {
            this.buttonForeground = styles.buttonForeground;
            this.buttonBackground = styles.buttonBackground;
            this.buttonHoverBackground = styles.buttonHoverBackground;
            this.buttonSecondaryForeground = styles.buttonSecondaryForeground;
            this.buttonSecondaryBackground = styles.buttonSecondaryBackground;
            this.buttonSecondaryHoverBackground = styles.buttonSecondaryHoverBackground;
            this.buttonBorder = styles.buttonBorder;
            this.applyStyles();
        }
        applyStyles() {
            if (this._element) {
                let background, foreground;
                if (this.options.secondary) {
                    foreground = this.buttonSecondaryForeground ? this.buttonSecondaryForeground.toString() : '';
                    background = this.buttonSecondaryBackground ? this.buttonSecondaryBackground.toString() : '';
                }
                else {
                    foreground = this.buttonForeground ? this.buttonForeground.toString() : '';
                    background = this.buttonBackground ? this.buttonBackground.toString() : '';
                }
                const border = this.buttonBorder ? this.buttonBorder.toString() : '';
                this._element.style.color = foreground;
                this._element.style.backgroundColor = background;
                this._element.style.borderWidth = border ? '1px' : '';
                this._element.style.borderStyle = border ? 'solid' : '';
                this._element.style.borderColor = border;
            }
        }
        get element() {
            return this._element;
        }
        set label(value) {
            if (!DOM.hasClass(this._element, 'monaco-text-button')) {
                DOM.addClass(this._element, 'monaco-text-button');
            }
            if (this.options.supportCodicons) {
                this._element.innerHTML = codicons_1.renderCodicons(strings_1.escape(value));
            }
            else {
                this._element.textContent = value;
            }
            if (typeof this.options.title === 'string') {
                this._element.title = this.options.title;
            }
            else if (this.options.title) {
                this._element.title = value;
            }
        }
        set icon(iconClassName) {
            DOM.addClass(this._element, iconClassName);
        }
        set enabled(value) {
            if (value) {
                DOM.removeClass(this._element, 'disabled');
                this._element.setAttribute('aria-disabled', String(false));
                this._element.tabIndex = 0;
            }
            else {
                DOM.addClass(this._element, 'disabled');
                this._element.setAttribute('aria-disabled', String(true));
                DOM.removeTabIndexAndUpdateFocus(this._element);
            }
        }
        get enabled() {
            return !DOM.hasClass(this._element, 'disabled');
        }
        focus() {
            this._element.focus();
        }
    }
    exports.Button = Button;
    class ButtonGroup extends lifecycle_1.Disposable {
        constructor(container, count, options) {
            super();
            this._buttons = [];
            this.create(container, count, options);
        }
        get buttons() {
            return this._buttons;
        }
        create(container, count, options) {
            for (let index = 0; index < count; index++) {
                const button = this._register(new Button(container, options));
                this._buttons.push(button);
                // Implement keyboard access in buttons if there are multiple
                if (count > 1) {
                    this._register(DOM.addDisposableListener(button.element, DOM.EventType.KEY_DOWN, e => {
                        const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                        let eventHandled = true;
                        // Next / Previous Button
                        let buttonIndexToFocus;
                        if (event.equals(15 /* LeftArrow */)) {
                            buttonIndexToFocus = index > 0 ? index - 1 : this._buttons.length - 1;
                        }
                        else if (event.equals(17 /* RightArrow */)) {
                            buttonIndexToFocus = index === this._buttons.length - 1 ? 0 : index + 1;
                        }
                        else {
                            eventHandled = false;
                        }
                        if (eventHandled && typeof buttonIndexToFocus === 'number') {
                            this._buttons[buttonIndexToFocus].focus();
                            DOM.EventHelper.stop(e, true);
                        }
                    }));
                }
            }
        }
    }
    exports.ButtonGroup = ButtonGroup;
});
//# __sourceMappingURL=button.js.map