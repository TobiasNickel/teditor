/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/actions", "vs/base/browser/dom", "vs/base/common/types", "vs/base/browser/touch", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/browser/dnd", "vs/base/browser/browser", "vs/css!./actionbar"], function (require, exports, platform, nls, lifecycle_1, selectBox_1, actions_1, DOM, types, touch_1, keyboardEvent_1, event_1, dnd_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepareActions = exports.SelectActionViewItem = exports.ActionBar = exports.ActionsOrientation = exports.ActionViewItem = exports.Separator = exports.BaseActionViewItem = void 0;
    class BaseActionViewItem extends lifecycle_1.Disposable {
        constructor(context, action, options) {
            super();
            this.options = options;
            this._context = context || this;
            this._action = action;
            if (action instanceof actions_1.Action) {
                this._register(action.onDidChange(event => {
                    if (!this.element) {
                        // we have not been rendered yet, so there
                        // is no point in updating the UI
                        return;
                    }
                    this.handleActionChangeEvent(event);
                }));
            }
        }
        handleActionChangeEvent(event) {
            if (event.enabled !== undefined) {
                this.updateEnabled();
            }
            if (event.checked !== undefined) {
                this.updateChecked();
            }
            if (event.class !== undefined) {
                this.updateClass();
            }
            if (event.label !== undefined) {
                this.updateLabel();
                this.updateTooltip();
            }
            if (event.tooltip !== undefined) {
                this.updateTooltip();
            }
        }
        get actionRunner() {
            if (!this._actionRunner) {
                this._actionRunner = this._register(new actions_1.ActionRunner());
            }
            return this._actionRunner;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        getAction() {
            return this._action;
        }
        isEnabled() {
            return this._action.enabled;
        }
        setActionContext(newContext) {
            this._context = newContext;
        }
        render(container) {
            const element = this.element = container;
            this._register(touch_1.Gesture.addTarget(container));
            const enableDragging = this.options && this.options.draggable;
            if (enableDragging) {
                container.draggable = true;
                if (browser_1.isFirefox) {
                    // Firefox: requires to set a text data transfer to get going
                    this._register(DOM.addDisposableListener(container, DOM.EventType.DRAG_START, e => { var _a; return (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData(dnd_1.DataTransfers.TEXT, this._action.label); }));
                }
            }
            this._register(DOM.addDisposableListener(element, touch_1.EventType.Tap, e => this.onClick(e)));
            this._register(DOM.addDisposableListener(element, DOM.EventType.MOUSE_DOWN, e => {
                if (!enableDragging) {
                    DOM.EventHelper.stop(e, true); // do not run when dragging is on because that would disable it
                }
                if (this._action.enabled && e.button === 0) {
                    DOM.addClass(element, 'active');
                }
            }));
            if (platform.isMacintosh) {
                // macOS: allow to trigger the button when holding Ctrl+key and pressing the
                // main mouse button. This is for scenarios where e.g. some interaction forces
                // the Ctrl+key to be pressed and hold but the user still wants to interact
                // with the actions (for example quick access in quick navigation mode).
                this._register(DOM.addDisposableListener(element, DOM.EventType.CONTEXT_MENU, e => {
                    if (e.button === 0 && e.ctrlKey === true) {
                        this.onClick(e);
                    }
                }));
            }
            this._register(DOM.addDisposableListener(element, DOM.EventType.CLICK, e => {
                DOM.EventHelper.stop(e, true);
                // See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Interact_with_the_clipboard
                // > Writing to the clipboard
                // > You can use the "cut" and "copy" commands without any special
                // permission if you are using them in a short-lived event handler
                // for a user action (for example, a click handler).
                // => to get the Copy and Paste context menu actions working on Firefox,
                // there should be no timeout here
                if (this.options && this.options.isMenu) {
                    this.onClick(e);
                }
                else {
                    platform.setImmediate(() => this.onClick(e));
                }
            }));
            this._register(DOM.addDisposableListener(element, DOM.EventType.DBLCLICK, e => {
                DOM.EventHelper.stop(e, true);
            }));
            [DOM.EventType.MOUSE_UP, DOM.EventType.MOUSE_OUT].forEach(event => {
                this._register(DOM.addDisposableListener(element, event, e => {
                    DOM.EventHelper.stop(e);
                    DOM.removeClass(element, 'active');
                }));
            });
        }
        onClick(event) {
            var _a;
            DOM.EventHelper.stop(event, true);
            const context = types.isUndefinedOrNull(this._context) ? ((_a = this.options) === null || _a === void 0 ? void 0 : _a.useEventAsContext) ? event : undefined : this._context;
            this.actionRunner.run(this._action, context);
        }
        focus() {
            if (this.element) {
                this.element.focus();
                DOM.addClass(this.element, 'focused');
            }
        }
        blur() {
            if (this.element) {
                this.element.blur();
                DOM.removeClass(this.element, 'focused');
            }
        }
        updateEnabled() {
            // implement in subclass
        }
        updateLabel() {
            // implement in subclass
        }
        updateTooltip() {
            // implement in subclass
        }
        updateClass() {
            // implement in subclass
        }
        updateChecked() {
            // implement in subclass
        }
        dispose() {
            if (this.element) {
                DOM.removeNode(this.element);
                this.element = undefined;
            }
            super.dispose();
        }
    }
    exports.BaseActionViewItem = BaseActionViewItem;
    class Separator extends actions_1.Action {
        constructor(label) {
            super(Separator.ID, label, label ? 'separator text' : 'separator');
            this.checked = false;
            this.enabled = false;
        }
    }
    exports.Separator = Separator;
    Separator.ID = 'vs.actions.separator';
    class ActionViewItem extends BaseActionViewItem {
        constructor(context, action, options = {}) {
            super(context, action, options);
            this.options = options;
            this.options.icon = options.icon !== undefined ? options.icon : false;
            this.options.label = options.label !== undefined ? options.label : true;
            this.cssClass = '';
        }
        render(container) {
            super.render(container);
            if (this.element) {
                this.label = DOM.append(this.element, DOM.$('a.action-label'));
            }
            if (this.label) {
                if (this._action.id === Separator.ID) {
                    this.label.setAttribute('role', 'presentation'); // A separator is a presentation item
                }
                else {
                    if (this.options.isMenu) {
                        this.label.setAttribute('role', 'menuitem');
                    }
                    else {
                        this.label.setAttribute('role', 'button');
                    }
                }
            }
            if (this.options.label && this.options.keybinding && this.element) {
                DOM.append(this.element, DOM.$('span.keybinding')).textContent = this.options.keybinding;
            }
            this.updateClass();
            this.updateLabel();
            this.updateTooltip();
            this.updateEnabled();
            this.updateChecked();
        }
        focus() {
            super.focus();
            if (this.label) {
                this.label.focus();
            }
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.textContent = this.getAction().label;
            }
        }
        updateTooltip() {
            let title = null;
            if (this.getAction().tooltip) {
                title = this.getAction().tooltip;
            }
            else if (!this.options.label && this.getAction().label && this.options.icon) {
                title = this.getAction().label;
                if (this.options.keybinding) {
                    title = nls.localize({ key: 'titleLabel', comment: ['action title', 'action keybinding'] }, "{0} ({1})", title, this.options.keybinding);
                }
            }
            if (title && this.label) {
                this.label.title = title;
            }
        }
        updateClass() {
            if (this.cssClass && this.label) {
                DOM.removeClasses(this.label, this.cssClass);
            }
            if (this.options.icon) {
                this.cssClass = this.getAction().class;
                if (this.label) {
                    DOM.addClass(this.label, 'codicon');
                    if (this.cssClass) {
                        DOM.addClasses(this.label, this.cssClass);
                    }
                }
                this.updateEnabled();
            }
            else {
                if (this.label) {
                    DOM.removeClass(this.label, 'codicon');
                }
            }
        }
        updateEnabled() {
            if (this.getAction().enabled) {
                if (this.label) {
                    this.label.removeAttribute('aria-disabled');
                    DOM.removeClass(this.label, 'disabled');
                    this.label.tabIndex = 0;
                }
                if (this.element) {
                    DOM.removeClass(this.element, 'disabled');
                }
            }
            else {
                if (this.label) {
                    this.label.setAttribute('aria-disabled', 'true');
                    DOM.addClass(this.label, 'disabled');
                    DOM.removeTabIndexAndUpdateFocus(this.label);
                }
                if (this.element) {
                    DOM.addClass(this.element, 'disabled');
                }
            }
        }
        updateChecked() {
            if (this.label) {
                if (this.getAction().checked) {
                    DOM.addClass(this.label, 'checked');
                }
                else {
                    DOM.removeClass(this.label, 'checked');
                }
            }
        }
    }
    exports.ActionViewItem = ActionViewItem;
    var ActionsOrientation;
    (function (ActionsOrientation) {
        ActionsOrientation[ActionsOrientation["HORIZONTAL"] = 0] = "HORIZONTAL";
        ActionsOrientation[ActionsOrientation["HORIZONTAL_REVERSE"] = 1] = "HORIZONTAL_REVERSE";
        ActionsOrientation[ActionsOrientation["VERTICAL"] = 2] = "VERTICAL";
        ActionsOrientation[ActionsOrientation["VERTICAL_REVERSE"] = 3] = "VERTICAL_REVERSE";
    })(ActionsOrientation = exports.ActionsOrientation || (exports.ActionsOrientation = {}));
    const defaultOptions = {
        orientation: 0 /* HORIZONTAL */,
        context: null,
        triggerKeys: {
            keys: [3 /* Enter */, 10 /* Space */],
            keyDown: false
        }
    };
    class ActionBar extends lifecycle_1.Disposable {
        constructor(container, options = defaultOptions) {
            super();
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidCancel = this._register(new event_1.Emitter());
            this.onDidCancel = this._onDidCancel.event;
            this._onDidRun = this._register(new event_1.Emitter());
            this.onDidRun = this._onDidRun.event;
            this._onDidBeforeRun = this._register(new event_1.Emitter());
            this.onDidBeforeRun = this._onDidBeforeRun.event;
            this.options = options;
            this._context = options.context;
            if (!this.options.triggerKeys) {
                this.options.triggerKeys = defaultOptions.triggerKeys;
            }
            if (this.options.actionRunner) {
                this._actionRunner = this.options.actionRunner;
            }
            else {
                this._actionRunner = new actions_1.ActionRunner();
                this._register(this._actionRunner);
            }
            this._register(this._actionRunner.onDidRun(e => this._onDidRun.fire(e)));
            this._register(this._actionRunner.onDidBeforeRun(e => this._onDidBeforeRun.fire(e)));
            this.viewItems = [];
            this.focusedItem = undefined;
            this.domNode = document.createElement('div');
            this.domNode.className = 'monaco-action-bar';
            if (options.animated !== false) {
                DOM.addClass(this.domNode, 'animated');
            }
            let previousKey;
            let nextKey;
            switch (this.options.orientation) {
                case 0 /* HORIZONTAL */:
                    previousKey = 15 /* LeftArrow */;
                    nextKey = 17 /* RightArrow */;
                    break;
                case 1 /* HORIZONTAL_REVERSE */:
                    previousKey = 17 /* RightArrow */;
                    nextKey = 15 /* LeftArrow */;
                    this.domNode.className += ' reverse';
                    break;
                case 2 /* VERTICAL */:
                    previousKey = 16 /* UpArrow */;
                    nextKey = 18 /* DownArrow */;
                    this.domNode.className += ' vertical';
                    break;
                case 3 /* VERTICAL_REVERSE */:
                    previousKey = 18 /* DownArrow */;
                    nextKey = 16 /* UpArrow */;
                    this.domNode.className += ' vertical reverse';
                    break;
            }
            this._register(DOM.addDisposableListener(this.domNode, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let eventHandled = true;
                if (event.equals(previousKey)) {
                    this.focusPrevious();
                }
                else if (event.equals(nextKey)) {
                    this.focusNext();
                }
                else if (event.equals(9 /* Escape */)) {
                    this._onDidCancel.fire();
                }
                else if (this.isTriggerKeyEvent(event)) {
                    // Staying out of the else branch even if not triggered
                    if (this.options.triggerKeys && this.options.triggerKeys.keyDown) {
                        this.doTrigger(event);
                    }
                }
                else {
                    eventHandled = false;
                }
                if (eventHandled) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }));
            this._register(DOM.addDisposableListener(this.domNode, DOM.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                // Run action on Enter/Space
                if (this.isTriggerKeyEvent(event)) {
                    if (this.options.triggerKeys && !this.options.triggerKeys.keyDown) {
                        this.doTrigger(event);
                    }
                    event.preventDefault();
                    event.stopPropagation();
                }
                // Recompute focused item
                else if (event.equals(2 /* Tab */) || event.equals(1024 /* Shift */ | 2 /* Tab */)) {
                    this.updateFocusedItem();
                }
            }));
            this.focusTracker = this._register(DOM.trackFocus(this.domNode));
            this._register(this.focusTracker.onDidBlur(() => {
                if (document.activeElement === this.domNode || !DOM.isAncestor(document.activeElement, this.domNode)) {
                    this._onDidBlur.fire();
                    this.focusedItem = undefined;
                }
            }));
            this._register(this.focusTracker.onDidFocus(() => this.updateFocusedItem()));
            this.actionsList = document.createElement('ul');
            this.actionsList.className = 'actions-container';
            this.actionsList.setAttribute('role', 'toolbar');
            if (this.options.ariaLabel) {
                this.actionsList.setAttribute('aria-label', this.options.ariaLabel);
            }
            this.domNode.appendChild(this.actionsList);
            container.appendChild(this.domNode);
        }
        setAriaLabel(label) {
            if (label) {
                this.actionsList.setAttribute('aria-label', label);
            }
            else {
                this.actionsList.removeAttribute('aria-label');
            }
        }
        isTriggerKeyEvent(event) {
            let ret = false;
            if (this.options.triggerKeys) {
                this.options.triggerKeys.keys.forEach(keyCode => {
                    ret = ret || event.equals(keyCode);
                });
            }
            return ret;
        }
        updateFocusedItem() {
            for (let i = 0; i < this.actionsList.children.length; i++) {
                const elem = this.actionsList.children[i];
                if (DOM.isAncestor(document.activeElement, elem)) {
                    this.focusedItem = i;
                    break;
                }
            }
        }
        get context() {
            return this._context;
        }
        set context(context) {
            this._context = context;
            this.viewItems.forEach(i => i.setActionContext(context));
        }
        get actionRunner() {
            return this._actionRunner;
        }
        set actionRunner(actionRunner) {
            if (actionRunner) {
                this._actionRunner = actionRunner;
                this.viewItems.forEach(item => item.actionRunner = actionRunner);
            }
        }
        getContainer() {
            return this.domNode;
        }
        push(arg, options = {}) {
            const actions = Array.isArray(arg) ? arg : [arg];
            let index = types.isNumber(options.index) ? options.index : null;
            actions.forEach((action) => {
                const actionViewItemElement = document.createElement('li');
                actionViewItemElement.className = 'action-item';
                actionViewItemElement.setAttribute('role', 'presentation');
                // Prevent native context menu on actions
                if (!this.options.allowContextMenu) {
                    this._register(DOM.addDisposableListener(actionViewItemElement, DOM.EventType.CONTEXT_MENU, (e) => {
                        DOM.EventHelper.stop(e, true);
                    }));
                }
                let item;
                if (this.options.actionViewItemProvider) {
                    item = this.options.actionViewItemProvider(action);
                }
                if (!item) {
                    item = new ActionViewItem(this.context, action, options);
                }
                item.actionRunner = this._actionRunner;
                item.setActionContext(this.context);
                item.render(actionViewItemElement);
                if (index === null || index < 0 || index >= this.actionsList.children.length) {
                    this.actionsList.appendChild(actionViewItemElement);
                    this.viewItems.push(item);
                }
                else {
                    this.actionsList.insertBefore(actionViewItemElement, this.actionsList.children[index]);
                    this.viewItems.splice(index, 0, item);
                    index++;
                }
            });
        }
        getWidth(index) {
            if (index >= 0 && index < this.actionsList.children.length) {
                const item = this.actionsList.children.item(index);
                if (item) {
                    return item.clientWidth;
                }
            }
            return 0;
        }
        getHeight(index) {
            if (index >= 0 && index < this.actionsList.children.length) {
                const item = this.actionsList.children.item(index);
                if (item) {
                    return item.clientHeight;
                }
            }
            return 0;
        }
        pull(index) {
            if (index >= 0 && index < this.viewItems.length) {
                this.actionsList.removeChild(this.actionsList.childNodes[index]);
                lifecycle_1.dispose(this.viewItems.splice(index, 1));
            }
        }
        clear() {
            lifecycle_1.dispose(this.viewItems);
            this.viewItems = [];
            DOM.clearNode(this.actionsList);
        }
        length() {
            return this.viewItems.length;
        }
        isEmpty() {
            return this.viewItems.length === 0;
        }
        focus(arg) {
            let selectFirst = false;
            let index = undefined;
            if (arg === undefined) {
                selectFirst = true;
            }
            else if (typeof arg === 'number') {
                index = arg;
            }
            else if (typeof arg === 'boolean') {
                selectFirst = arg;
            }
            if (selectFirst && typeof this.focusedItem === 'undefined') {
                // Focus the first enabled item
                this.focusedItem = this.viewItems.length - 1;
                this.focusNext();
            }
            else {
                if (index !== undefined) {
                    this.focusedItem = index;
                }
                this.updateFocus();
            }
        }
        focusNext() {
            if (typeof this.focusedItem === 'undefined') {
                this.focusedItem = this.viewItems.length - 1;
            }
            const startIndex = this.focusedItem;
            let item;
            do {
                this.focusedItem = (this.focusedItem + 1) % this.viewItems.length;
                item = this.viewItems[this.focusedItem];
            } while (this.focusedItem !== startIndex && !item.isEnabled());
            if (this.focusedItem === startIndex && !item.isEnabled()) {
                this.focusedItem = undefined;
            }
            this.updateFocus();
        }
        focusPrevious() {
            if (typeof this.focusedItem === 'undefined') {
                this.focusedItem = 0;
            }
            const startIndex = this.focusedItem;
            let item;
            do {
                this.focusedItem = this.focusedItem - 1;
                if (this.focusedItem < 0) {
                    this.focusedItem = this.viewItems.length - 1;
                }
                item = this.viewItems[this.focusedItem];
            } while (this.focusedItem !== startIndex && !item.isEnabled());
            if (this.focusedItem === startIndex && !item.isEnabled()) {
                this.focusedItem = undefined;
            }
            this.updateFocus(true);
        }
        updateFocus(fromRight, preventScroll) {
            if (typeof this.focusedItem === 'undefined') {
                this.actionsList.focus({ preventScroll });
            }
            for (let i = 0; i < this.viewItems.length; i++) {
                const item = this.viewItems[i];
                const actionViewItem = item;
                if (i === this.focusedItem) {
                    if (types.isFunction(actionViewItem.isEnabled)) {
                        if (actionViewItem.isEnabled() && types.isFunction(actionViewItem.focus)) {
                            actionViewItem.focus(fromRight);
                        }
                        else {
                            this.actionsList.focus({ preventScroll });
                        }
                    }
                }
                else {
                    if (types.isFunction(actionViewItem.blur)) {
                        actionViewItem.blur();
                    }
                }
            }
        }
        doTrigger(event) {
            if (typeof this.focusedItem === 'undefined') {
                return; //nothing to focus
            }
            // trigger action
            const actionViewItem = this.viewItems[this.focusedItem];
            if (actionViewItem instanceof BaseActionViewItem) {
                const context = (actionViewItem._context === null || actionViewItem._context === undefined) ? event : actionViewItem._context;
                this.run(actionViewItem._action, context);
            }
        }
        run(action, context) {
            return this._actionRunner.run(action, context);
        }
        dispose() {
            lifecycle_1.dispose(this.viewItems);
            this.viewItems = [];
            DOM.removeNode(this.getContainer());
            super.dispose();
        }
    }
    exports.ActionBar = ActionBar;
    class SelectActionViewItem extends BaseActionViewItem {
        constructor(ctx, action, options, selected, contextViewProvider, selectBoxOptions) {
            super(ctx, action);
            this.selectBox = new selectBox_1.SelectBox(options, selected, contextViewProvider, undefined, selectBoxOptions);
            this._register(this.selectBox);
            this.registerListeners();
        }
        setOptions(options, selected) {
            this.selectBox.setOptions(options, selected);
        }
        select(index) {
            this.selectBox.select(index);
        }
        registerListeners() {
            this._register(this.selectBox.onDidSelect(e => {
                this.actionRunner.run(this._action, this.getActionContext(e.selected, e.index));
            }));
        }
        getActionContext(option, index) {
            return option;
        }
        focus() {
            if (this.selectBox) {
                this.selectBox.focus();
            }
        }
        blur() {
            if (this.selectBox) {
                this.selectBox.blur();
            }
        }
        render(container) {
            this.selectBox.render(container);
        }
    }
    exports.SelectActionViewItem = SelectActionViewItem;
    function prepareActions(actions) {
        if (!actions.length) {
            return actions;
        }
        // Clean up leading separators
        let firstIndexOfAction = -1;
        for (let i = 0; i < actions.length; i++) {
            if (actions[i].id === Separator.ID) {
                continue;
            }
            firstIndexOfAction = i;
            break;
        }
        if (firstIndexOfAction === -1) {
            return [];
        }
        actions = actions.slice(firstIndexOfAction);
        // Clean up trailing separators
        for (let h = actions.length - 1; h >= 0; h--) {
            const isSeparator = actions[h].id === Separator.ID;
            if (isSeparator) {
                actions.splice(h, 1);
            }
            else {
                break;
            }
        }
        // Clean up separator duplicates
        let foundAction = false;
        for (let k = actions.length - 1; k >= 0; k--) {
            const isSeparator = actions[k].id === Separator.ID;
            if (isSeparator && !foundAction) {
                actions.splice(k, 1);
            }
            else if (!isSeparator) {
                foundAction = true;
            }
            else if (isSeparator) {
                foundAction = false;
            }
        }
        return actions;
    }
    exports.prepareActions = prepareActions;
});
//# __sourceMappingURL=actionbar.js.map