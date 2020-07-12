/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/platform", "vs/base/common/codicons", "vs/css!./menu"], function (require, exports, nls, strings, actions_1, actionbar_1, dom_1, keyboardEvent_1, async_1, lifecycle_1, scrollableElement_1, platform_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cleanMnemonic = exports.Menu = exports.SubmenuAction = exports.Direction = exports.MENU_ESCAPED_MNEMONIC_REGEX = exports.MENU_MNEMONIC_REGEX = void 0;
    exports.MENU_MNEMONIC_REGEX = /\(&([^\s&])\)|(^|[^&])&([^\s&])/;
    exports.MENU_ESCAPED_MNEMONIC_REGEX = /(&amp;)?(&amp;)([^\s&])/g;
    const menuSelectionIcon = codicons_1.registerIcon('menu-selection', codicons_1.Codicon.check);
    const menuSubmenuIcon = codicons_1.registerIcon('menu-submenu', codicons_1.Codicon.chevronRight);
    var Direction;
    (function (Direction) {
        Direction[Direction["Right"] = 0] = "Right";
        Direction[Direction["Left"] = 1] = "Left";
    })(Direction = exports.Direction || (exports.Direction = {}));
    class SubmenuAction extends actions_1.Action {
        constructor(label, entries, cssClass) {
            super(!!cssClass ? cssClass : 'submenu', label, '', true);
            this.entries = entries;
        }
    }
    exports.SubmenuAction = SubmenuAction;
    class Menu extends actionbar_1.ActionBar {
        constructor(container, actions, options = {}) {
            dom_1.addClass(container, 'monaco-menu-container');
            container.setAttribute('role', 'presentation');
            const menuElement = document.createElement('div');
            dom_1.addClass(menuElement, 'monaco-menu');
            menuElement.setAttribute('role', 'presentation');
            super(menuElement, {
                orientation: 2 /* VERTICAL */,
                actionViewItemProvider: action => this.doGetActionViewItem(action, options, parentData),
                context: options.context,
                actionRunner: options.actionRunner,
                ariaLabel: options.ariaLabel,
                triggerKeys: { keys: [3 /* Enter */, ...(platform_1.isMacintosh || platform_1.isLinux ? [10 /* Space */] : [])], keyDown: true }
            });
            this.menuElement = menuElement;
            this.actionsList.setAttribute('role', 'menu');
            this.actionsList.tabIndex = 0;
            this.menuDisposables = this._register(new lifecycle_1.DisposableStore());
            dom_1.addDisposableListener(menuElement, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                // Stop tab navigation of menus
                if (event.equals(2 /* Tab */)) {
                    e.preventDefault();
                }
            });
            if (options.enableMnemonics) {
                this.menuDisposables.add(dom_1.addDisposableListener(menuElement, dom_1.EventType.KEY_DOWN, (e) => {
                    const key = e.key.toLocaleLowerCase();
                    if (this.mnemonics.has(key)) {
                        dom_1.EventHelper.stop(e, true);
                        const actions = this.mnemonics.get(key);
                        if (actions.length === 1) {
                            if (actions[0] instanceof SubmenuMenuActionViewItem && actions[0].container) {
                                this.focusItemByElement(actions[0].container);
                            }
                            actions[0].onClick(e);
                        }
                        if (actions.length > 1) {
                            const action = actions.shift();
                            if (action && action.container) {
                                this.focusItemByElement(action.container);
                                actions.push(action);
                            }
                            this.mnemonics.set(key, actions);
                        }
                    }
                }));
            }
            if (platform_1.isLinux) {
                this._register(dom_1.addDisposableListener(menuElement, dom_1.EventType.KEY_DOWN, e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(14 /* Home */) || event.equals(11 /* PageUp */)) {
                        this.focusedItem = this.viewItems.length - 1;
                        this.focusNext();
                        dom_1.EventHelper.stop(e, true);
                    }
                    else if (event.equals(13 /* End */) || event.equals(12 /* PageDown */)) {
                        this.focusedItem = 0;
                        this.focusPrevious();
                        dom_1.EventHelper.stop(e, true);
                    }
                }));
            }
            this._register(dom_1.addDisposableListener(this.domNode, dom_1.EventType.MOUSE_OUT, e => {
                let relatedTarget = e.relatedTarget;
                if (!dom_1.isAncestor(relatedTarget, this.domNode)) {
                    this.focusedItem = undefined;
                    this.updateFocus();
                    e.stopPropagation();
                }
            }));
            this._register(dom_1.addDisposableListener(this.actionsList, dom_1.EventType.MOUSE_OVER, e => {
                let target = e.target;
                if (!target || !dom_1.isAncestor(target, this.actionsList) || target === this.actionsList) {
                    return;
                }
                while (target.parentElement !== this.actionsList && target.parentElement !== null) {
                    target = target.parentElement;
                }
                if (dom_1.hasClass(target, 'action-item')) {
                    const lastFocusedItem = this.focusedItem;
                    this.setFocusedItem(target);
                    if (lastFocusedItem !== this.focusedItem) {
                        this.updateFocus();
                    }
                }
            }));
            let parentData = {
                parent: this
            };
            this.mnemonics = new Map();
            // Scroll Logic
            this.scrollableElement = this._register(new scrollableElement_1.DomScrollableElement(menuElement, {
                alwaysConsumeMouseWheel: true,
                horizontal: 2 /* Hidden */,
                vertical: 3 /* Visible */,
                verticalScrollbarSize: 7,
                handleMouseWheel: true,
                useShadows: true
            }));
            const scrollElement = this.scrollableElement.getDomNode();
            scrollElement.style.position = '';
            this._register(dom_1.addDisposableListener(scrollElement, dom_1.EventType.MOUSE_UP, e => {
                // Absorb clicks in menu dead space https://github.com/Microsoft/vscode/issues/63575
                // We do this on the scroll element so the scroll bar doesn't dismiss the menu either
                e.preventDefault();
            }));
            menuElement.style.maxHeight = `${Math.max(10, window.innerHeight - container.getBoundingClientRect().top - 30)}px`;
            this.push(actions, { icon: true, label: true, isMenu: true });
            container.appendChild(this.scrollableElement.getDomNode());
            this.scrollableElement.scanDomNode();
            this.viewItems.filter(item => !(item instanceof MenuSeparatorActionViewItem)).forEach((item, index, array) => {
                item.updatePositionInSet(index + 1, array.length);
            });
        }
        style(style) {
            const container = this.getContainer();
            const fgColor = style.foregroundColor ? `${style.foregroundColor}` : '';
            const bgColor = style.backgroundColor ? `${style.backgroundColor}` : '';
            const border = style.borderColor ? `1px solid ${style.borderColor}` : '';
            const shadow = style.shadowColor ? `0 2px 4px ${style.shadowColor}` : '';
            container.style.border = border;
            this.domNode.style.color = fgColor;
            this.domNode.style.backgroundColor = bgColor;
            container.style.boxShadow = shadow;
            if (this.viewItems) {
                this.viewItems.forEach(item => {
                    if (item instanceof BaseMenuActionViewItem || item instanceof MenuSeparatorActionViewItem) {
                        item.style(style);
                    }
                });
            }
        }
        getContainer() {
            return this.scrollableElement.getDomNode();
        }
        get onScroll() {
            return this.scrollableElement.onScroll;
        }
        get scrollOffset() {
            return this.menuElement.scrollTop;
        }
        trigger(index) {
            if (index <= this.viewItems.length && index >= 0) {
                const item = this.viewItems[index];
                if (item instanceof SubmenuMenuActionViewItem) {
                    super.focus(index);
                    item.open(true);
                }
                else if (item instanceof BaseMenuActionViewItem) {
                    super.run(item._action, item._context);
                }
                else {
                    return;
                }
            }
        }
        focusItemByElement(element) {
            const lastFocusedItem = this.focusedItem;
            this.setFocusedItem(element);
            if (lastFocusedItem !== this.focusedItem) {
                this.updateFocus();
            }
        }
        setFocusedItem(element) {
            for (let i = 0; i < this.actionsList.children.length; i++) {
                let elem = this.actionsList.children[i];
                if (element === elem) {
                    this.focusedItem = i;
                    break;
                }
            }
        }
        updateFocus(fromRight) {
            super.updateFocus(fromRight, true);
            if (typeof this.focusedItem !== 'undefined') {
                // Workaround for #80047 caused by an issue in chromium
                // https://bugs.chromium.org/p/chromium/issues/detail?id=414283
                // When that's fixed, just call this.scrollableElement.scanDomNode()
                this.scrollableElement.setScrollPosition({
                    scrollTop: Math.round(this.menuElement.scrollTop)
                });
            }
        }
        doGetActionViewItem(action, options, parentData) {
            if (action instanceof actionbar_1.Separator) {
                return new MenuSeparatorActionViewItem(options.context, action, { icon: true });
            }
            else if (action instanceof SubmenuAction) {
                const menuActionViewItem = new SubmenuMenuActionViewItem(action, action.entries, parentData, options);
                if (options.enableMnemonics) {
                    const mnemonic = menuActionViewItem.getMnemonic();
                    if (mnemonic && menuActionViewItem.isEnabled()) {
                        let actionViewItems = [];
                        if (this.mnemonics.has(mnemonic)) {
                            actionViewItems = this.mnemonics.get(mnemonic);
                        }
                        actionViewItems.push(menuActionViewItem);
                        this.mnemonics.set(mnemonic, actionViewItems);
                    }
                }
                return menuActionViewItem;
            }
            else {
                const menuItemOptions = { enableMnemonics: options.enableMnemonics, useEventAsContext: options.useEventAsContext };
                if (options.getKeyBinding) {
                    const keybinding = options.getKeyBinding(action);
                    if (keybinding) {
                        const keybindingLabel = keybinding.getLabel();
                        if (keybindingLabel) {
                            menuItemOptions.keybinding = keybindingLabel;
                        }
                    }
                }
                const menuActionViewItem = new BaseMenuActionViewItem(options.context, action, menuItemOptions);
                if (options.enableMnemonics) {
                    const mnemonic = menuActionViewItem.getMnemonic();
                    if (mnemonic && menuActionViewItem.isEnabled()) {
                        let actionViewItems = [];
                        if (this.mnemonics.has(mnemonic)) {
                            actionViewItems = this.mnemonics.get(mnemonic);
                        }
                        actionViewItems.push(menuActionViewItem);
                        this.mnemonics.set(mnemonic, actionViewItems);
                    }
                }
                return menuActionViewItem;
            }
        }
    }
    exports.Menu = Menu;
    class BaseMenuActionViewItem extends actionbar_1.BaseActionViewItem {
        constructor(ctx, action, options = {}) {
            options.isMenu = true;
            super(action, action, options);
            this.options = options;
            this.options.icon = options.icon !== undefined ? options.icon : false;
            this.options.label = options.label !== undefined ? options.label : true;
            this.cssClass = '';
            // Set mnemonic
            if (this.options.label && options.enableMnemonics) {
                let label = this.getAction().label;
                if (label) {
                    let matches = exports.MENU_MNEMONIC_REGEX.exec(label);
                    if (matches) {
                        this.mnemonic = (!!matches[1] ? matches[1] : matches[3]).toLocaleLowerCase();
                    }
                }
            }
            // Add mouse up listener later to avoid accidental clicks
            this.runOnceToEnableMouseUp = new async_1.RunOnceScheduler(() => {
                if (!this.element) {
                    return;
                }
                this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.MOUSE_UP, e => {
                    if (e.defaultPrevented) {
                        return;
                    }
                    dom_1.EventHelper.stop(e, true);
                    this.onClick(e);
                }));
            }, 100);
            this._register(this.runOnceToEnableMouseUp);
        }
        render(container) {
            super.render(container);
            if (!this.element) {
                return;
            }
            this.container = container;
            this.item = dom_1.append(this.element, dom_1.$('a.action-menu-item'));
            if (this._action.id === actionbar_1.Separator.ID) {
                // A separator is a presentation item
                this.item.setAttribute('role', 'presentation');
            }
            else {
                this.item.setAttribute('role', 'menuitem');
                if (this.mnemonic) {
                    this.item.setAttribute('aria-keyshortcuts', `${this.mnemonic}`);
                }
            }
            this.check = dom_1.append(this.item, dom_1.$('span.menu-item-check' + menuSelectionIcon.cssSelector));
            this.check.setAttribute('role', 'none');
            this.label = dom_1.append(this.item, dom_1.$('span.action-label'));
            if (this.options.label && this.options.keybinding) {
                dom_1.append(this.item, dom_1.$('span.keybinding')).textContent = this.options.keybinding;
            }
            // Adds mouse up listener to actually run the action
            this.runOnceToEnableMouseUp.schedule();
            this.updateClass();
            this.updateLabel();
            this.updateTooltip();
            this.updateEnabled();
            this.updateChecked();
        }
        blur() {
            super.blur();
            this.applyStyle();
        }
        focus() {
            super.focus();
            if (this.item) {
                this.item.focus();
            }
            this.applyStyle();
        }
        updatePositionInSet(pos, setSize) {
            if (this.item) {
                this.item.setAttribute('aria-posinset', `${pos}`);
                this.item.setAttribute('aria-setsize', `${setSize}`);
            }
        }
        updateLabel() {
            if (!this.label) {
                return;
            }
            if (this.options.label) {
                dom_1.clearNode(this.label);
                let label = codicons_1.stripCodicons(this.getAction().label);
                if (label) {
                    const cleanLabel = cleanMnemonic(label);
                    if (!this.options.enableMnemonics) {
                        label = cleanLabel;
                    }
                    this.label.setAttribute('aria-label', cleanLabel.replace(/&&/g, '&'));
                    const matches = exports.MENU_MNEMONIC_REGEX.exec(label);
                    if (matches) {
                        label = strings.escape(label);
                        // This is global, reset it
                        exports.MENU_ESCAPED_MNEMONIC_REGEX.lastIndex = 0;
                        let escMatch = exports.MENU_ESCAPED_MNEMONIC_REGEX.exec(label);
                        // We can't use negative lookbehind so if we match our negative and skip
                        while (escMatch && escMatch[1]) {
                            escMatch = exports.MENU_ESCAPED_MNEMONIC_REGEX.exec(label);
                        }
                        const replaceDoubleEscapes = (str) => str.replace(/&amp;&amp;/g, '&amp;');
                        if (escMatch) {
                            this.label.append(strings.ltrim(replaceDoubleEscapes(label.substr(0, escMatch.index)), ' '), dom_1.$('u', { 'aria-hidden': 'true' }, escMatch[3]), strings.rtrim(replaceDoubleEscapes(label.substr(escMatch.index + escMatch[0].length)), ' '));
                        }
                        else {
                            this.label.innerText = replaceDoubleEscapes(label).trim();
                        }
                        if (this.item) {
                            this.item.setAttribute('aria-keyshortcuts', (!!matches[1] ? matches[1] : matches[3]).toLocaleLowerCase());
                        }
                    }
                    else {
                        this.label.innerText = label.replace(/&&/g, '&').trim();
                    }
                }
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
            if (title && this.item) {
                this.item.title = title;
            }
        }
        updateClass() {
            if (this.cssClass && this.item) {
                dom_1.removeClasses(this.item, this.cssClass);
            }
            if (this.options.icon && this.label) {
                this.cssClass = this.getAction().class || '';
                dom_1.addClass(this.label, 'icon');
                if (this.cssClass) {
                    dom_1.addClasses(this.label, this.cssClass);
                }
                this.updateEnabled();
            }
            else if (this.label) {
                dom_1.removeClass(this.label, 'icon');
            }
        }
        updateEnabled() {
            if (this.getAction().enabled) {
                if (this.element) {
                    dom_1.removeClass(this.element, 'disabled');
                }
                if (this.item) {
                    dom_1.removeClass(this.item, 'disabled');
                    this.item.tabIndex = 0;
                }
            }
            else {
                if (this.element) {
                    dom_1.addClass(this.element, 'disabled');
                }
                if (this.item) {
                    dom_1.addClass(this.item, 'disabled');
                    dom_1.removeTabIndexAndUpdateFocus(this.item);
                }
            }
        }
        updateChecked() {
            if (!this.item) {
                return;
            }
            if (this.getAction().checked) {
                dom_1.addClass(this.item, 'checked');
                this.item.setAttribute('role', 'menuitemcheckbox');
                this.item.setAttribute('aria-checked', 'true');
            }
            else {
                dom_1.removeClass(this.item, 'checked');
                this.item.setAttribute('role', 'menuitem');
                this.item.setAttribute('aria-checked', 'false');
            }
        }
        getMnemonic() {
            return this.mnemonic;
        }
        applyStyle() {
            if (!this.menuStyle) {
                return;
            }
            const isSelected = this.element && dom_1.hasClass(this.element, 'focused');
            const fgColor = isSelected && this.menuStyle.selectionForegroundColor ? this.menuStyle.selectionForegroundColor : this.menuStyle.foregroundColor;
            const bgColor = isSelected && this.menuStyle.selectionBackgroundColor ? this.menuStyle.selectionBackgroundColor : undefined;
            const border = isSelected && this.menuStyle.selectionBorderColor ? `thin solid ${this.menuStyle.selectionBorderColor}` : '';
            if (this.item) {
                this.item.style.color = fgColor ? fgColor.toString() : '';
                this.item.style.backgroundColor = bgColor ? bgColor.toString() : '';
            }
            if (this.check) {
                this.check.style.color = fgColor ? fgColor.toString() : '';
            }
            if (this.container) {
                this.container.style.border = border;
            }
        }
        style(style) {
            this.menuStyle = style;
            this.applyStyle();
        }
    }
    class SubmenuMenuActionViewItem extends BaseMenuActionViewItem {
        constructor(action, submenuActions, parentData, submenuOptions) {
            super(action, action, submenuOptions);
            this.submenuActions = submenuActions;
            this.parentData = parentData;
            this.submenuOptions = submenuOptions;
            this.mysubmenu = null;
            this.submenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.mouseOver = false;
            this.expandDirection = submenuOptions && submenuOptions.expandDirection !== undefined ? submenuOptions.expandDirection : Direction.Right;
            this.showScheduler = new async_1.RunOnceScheduler(() => {
                if (this.mouseOver) {
                    this.cleanupExistingSubmenu(false);
                    this.createSubmenu(false);
                }
            }, 250);
            this.hideScheduler = new async_1.RunOnceScheduler(() => {
                if (this.element && (!dom_1.isAncestor(document.activeElement, this.element) && this.parentData.submenu === this.mysubmenu)) {
                    this.parentData.parent.focus(false);
                    this.cleanupExistingSubmenu(true);
                }
            }, 750);
        }
        render(container) {
            super.render(container);
            if (!this.element) {
                return;
            }
            if (this.item) {
                dom_1.addClass(this.item, 'monaco-submenu-item');
                this.item.setAttribute('aria-haspopup', 'true');
                this.updateAriaExpanded('false');
                this.submenuIndicator = dom_1.append(this.item, dom_1.$('span.submenu-indicator' + menuSubmenuIcon.cssSelector));
                this.submenuIndicator.setAttribute('aria-hidden', 'true');
            }
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.KEY_UP, e => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(17 /* RightArrow */) || event.equals(3 /* Enter */)) {
                    dom_1.EventHelper.stop(e, true);
                    this.createSubmenu(true);
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.KEY_DOWN, e => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (document.activeElement === this.item) {
                    if (event.equals(17 /* RightArrow */) || event.equals(3 /* Enter */)) {
                        dom_1.EventHelper.stop(e, true);
                    }
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.MOUSE_OVER, e => {
                if (!this.mouseOver) {
                    this.mouseOver = true;
                    this.showScheduler.schedule();
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.MOUSE_LEAVE, e => {
                this.mouseOver = false;
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.FOCUS_OUT, e => {
                if (this.element && !dom_1.isAncestor(document.activeElement, this.element)) {
                    this.hideScheduler.schedule();
                }
            }));
            this._register(this.parentData.parent.onScroll(() => {
                this.parentData.parent.focus(false);
                this.cleanupExistingSubmenu(false);
            }));
        }
        open(selectFirst) {
            this.cleanupExistingSubmenu(false);
            this.createSubmenu(selectFirst);
        }
        onClick(e) {
            // stop clicking from trying to run an action
            dom_1.EventHelper.stop(e, true);
            this.cleanupExistingSubmenu(false);
            this.createSubmenu(true);
        }
        cleanupExistingSubmenu(force) {
            if (this.parentData.submenu && (force || (this.parentData.submenu !== this.mysubmenu))) {
                this.parentData.submenu.dispose();
                this.parentData.submenu = undefined;
                this.updateAriaExpanded('false');
                if (this.submenuContainer) {
                    this.submenuDisposables.clear();
                    this.submenuContainer = undefined;
                }
            }
        }
        createSubmenu(selectFirstItem = true) {
            if (!this.element) {
                return;
            }
            if (!this.parentData.submenu) {
                this.updateAriaExpanded('true');
                this.submenuContainer = dom_1.append(this.element, dom_1.$('div.monaco-submenu'));
                dom_1.addClasses(this.submenuContainer, 'menubar-menu-items-holder', 'context-view');
                // Set the top value of the menu container before construction
                // This allows the menu constructor to calculate the proper max height
                const computedStyles = getComputedStyle(this.parentData.parent.domNode);
                const paddingTop = parseFloat(computedStyles.paddingTop || '0') || 0;
                this.submenuContainer.style.top = `${this.element.offsetTop - this.parentData.parent.scrollOffset - paddingTop}px`;
                this.parentData.submenu = new Menu(this.submenuContainer, this.submenuActions, this.submenuOptions);
                if (this.menuStyle) {
                    this.parentData.submenu.style(this.menuStyle);
                }
                const boundingRect = this.element.getBoundingClientRect();
                const childBoundingRect = this.submenuContainer.getBoundingClientRect();
                if (this.expandDirection === Direction.Right) {
                    if (window.innerWidth <= boundingRect.right + childBoundingRect.width) {
                        this.submenuContainer.style.left = '10px';
                        this.submenuContainer.style.top = `${this.element.offsetTop - this.parentData.parent.scrollOffset + boundingRect.height}px`;
                    }
                    else {
                        this.submenuContainer.style.left = `${this.element.offsetWidth}px`;
                        this.submenuContainer.style.top = `${this.element.offsetTop - this.parentData.parent.scrollOffset - paddingTop}px`;
                    }
                }
                else if (this.expandDirection === Direction.Left) {
                    this.submenuContainer.style.right = `${this.element.offsetWidth}px`;
                    this.submenuContainer.style.left = 'auto';
                    this.submenuContainer.style.top = `${this.element.offsetTop - this.parentData.parent.scrollOffset - paddingTop}px`;
                }
                this.submenuDisposables.add(dom_1.addDisposableListener(this.submenuContainer, dom_1.EventType.KEY_UP, e => {
                    let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(15 /* LeftArrow */)) {
                        dom_1.EventHelper.stop(e, true);
                        this.parentData.parent.focus();
                        this.cleanupExistingSubmenu(true);
                    }
                }));
                this.submenuDisposables.add(dom_1.addDisposableListener(this.submenuContainer, dom_1.EventType.KEY_DOWN, e => {
                    let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(15 /* LeftArrow */)) {
                        dom_1.EventHelper.stop(e, true);
                    }
                }));
                this.submenuDisposables.add(this.parentData.submenu.onDidCancel(() => {
                    this.parentData.parent.focus();
                    this.cleanupExistingSubmenu(true);
                }));
                this.parentData.submenu.focus(selectFirstItem);
                this.mysubmenu = this.parentData.submenu;
            }
            else {
                this.parentData.submenu.focus(false);
            }
        }
        updateAriaExpanded(value) {
            var _a;
            if (this.item) {
                (_a = this.item) === null || _a === void 0 ? void 0 : _a.setAttribute('aria-expanded', value);
            }
        }
        applyStyle() {
            super.applyStyle();
            if (!this.menuStyle) {
                return;
            }
            const isSelected = this.element && dom_1.hasClass(this.element, 'focused');
            const fgColor = isSelected && this.menuStyle.selectionForegroundColor ? this.menuStyle.selectionForegroundColor : this.menuStyle.foregroundColor;
            if (this.submenuIndicator) {
                this.submenuIndicator.style.color = fgColor ? `${fgColor}` : '';
            }
            if (this.parentData.submenu) {
                this.parentData.submenu.style(this.menuStyle);
            }
        }
        dispose() {
            super.dispose();
            this.hideScheduler.dispose();
            if (this.mysubmenu) {
                this.mysubmenu.dispose();
                this.mysubmenu = null;
            }
            if (this.submenuContainer) {
                this.submenuContainer = undefined;
            }
        }
    }
    class MenuSeparatorActionViewItem extends actionbar_1.ActionViewItem {
        style(style) {
            if (this.label) {
                this.label.style.borderBottomColor = style.separatorColor ? `${style.separatorColor}` : '';
            }
        }
    }
    function cleanMnemonic(label) {
        const regex = exports.MENU_MNEMONIC_REGEX;
        const matches = regex.exec(label);
        if (!matches) {
            return label;
        }
        const mnemonicInText = !matches[1];
        return label.replace(regex, mnemonicInText ? '$2$3' : '').trim();
    }
    exports.cleanMnemonic = cleanMnemonic;
});
//# __sourceMappingURL=menu.js.map