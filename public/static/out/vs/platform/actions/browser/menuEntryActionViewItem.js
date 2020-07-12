/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/event", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, event_1, actionbar_1, event_2, idGenerator_1, lifecycle_1, platform_1, nls_1, actions_1, contextView_1, keybinding_1, notification_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextAwareMenuEntryActionViewItem = exports.MenuEntryActionViewItem = exports.createActionViewItem = exports.createAndFillInActionBarActions = exports.createAndFillInContextMenuActions = void 0;
    // The alternative key on all platforms is alt. On windows we also support shift as an alternative key #44136
    class AlternativeKeyEmitter extends event_2.Emitter {
        constructor(contextMenuService) {
            super();
            this._subscriptions = new lifecycle_1.DisposableStore();
            this._isPressed = false;
            this._suppressAltKeyUp = false;
            this._subscriptions.add(event_1.domEvent(document.body, 'keydown')(e => {
                this.isPressed = e.altKey || ((platform_1.isWindows || platform_1.isLinux) && e.shiftKey);
            }));
            this._subscriptions.add(event_1.domEvent(document.body, 'keyup')(e => {
                if (this.isPressed) {
                    if (this._suppressAltKeyUp) {
                        e.preventDefault();
                    }
                }
                this._suppressAltKeyUp = false;
                this.isPressed = false;
            }));
            this._subscriptions.add(event_1.domEvent(document.body, 'mouseleave')(e => this.isPressed = false));
            this._subscriptions.add(event_1.domEvent(document.body, 'blur')(e => this.isPressed = false));
            // Workaround since we do not get any events while a context menu is shown
            this._subscriptions.add(contextMenuService.onDidContextMenu(() => this.isPressed = false));
        }
        get isPressed() {
            return this._isPressed;
        }
        set isPressed(value) {
            this._isPressed = value;
            this.fire(this._isPressed);
        }
        suppressAltKeyUp() {
            // Sometimes the native alt behavior needs to be suppresed since the alt was already used as an alternative key
            // Example: windows behavior to toggle tha top level menu #44396
            this._suppressAltKeyUp = true;
        }
        static getInstance(contextMenuService) {
            if (!AlternativeKeyEmitter.instance) {
                AlternativeKeyEmitter.instance = new AlternativeKeyEmitter(contextMenuService);
            }
            return AlternativeKeyEmitter.instance;
        }
        dispose() {
            super.dispose();
            this._subscriptions.dispose();
        }
    }
    function createAndFillInContextMenuActions(menu, options, target, contextMenuService, isPrimaryGroup) {
        const groups = menu.getActions(options);
        const useAlternativeActions = AlternativeKeyEmitter.getInstance(contextMenuService).isPressed;
        fillInActions(groups, target, useAlternativeActions, isPrimaryGroup);
        return asDisposable(groups);
    }
    exports.createAndFillInContextMenuActions = createAndFillInContextMenuActions;
    function createAndFillInActionBarActions(menu, options, target, isPrimaryGroup) {
        const groups = menu.getActions(options);
        // Action bars handle alternative actions on their own so the alternative actions should be ignored
        fillInActions(groups, target, false, isPrimaryGroup);
        return asDisposable(groups);
    }
    exports.createAndFillInActionBarActions = createAndFillInActionBarActions;
    function asDisposable(groups) {
        const disposables = new lifecycle_1.DisposableStore();
        for (const [, actions] of groups) {
            for (const action of actions) {
                disposables.add(action);
            }
        }
        return disposables;
    }
    function fillInActions(groups, target, useAlternativeActions, isPrimaryGroup = group => group === 'navigation') {
        for (let tuple of groups) {
            let [group, actions] = tuple;
            if (useAlternativeActions) {
                actions = actions.map(a => (a instanceof actions_1.MenuItemAction) && !!a.alt ? a.alt : a);
            }
            if (isPrimaryGroup(group)) {
                const to = Array.isArray(target) ? target : target.primary;
                to.unshift(...actions);
            }
            else {
                const to = Array.isArray(target) ? target : target.secondary;
                if (to.length > 0) {
                    to.push(new actionbar_1.Separator());
                }
                to.push(...actions);
            }
        }
    }
    function createActionViewItem(action, keybindingService, notificationService, contextMenuService) {
        if (action instanceof actions_1.MenuItemAction) {
            return new MenuEntryActionViewItem(action, keybindingService, notificationService, contextMenuService);
        }
        return undefined;
    }
    exports.createActionViewItem = createActionViewItem;
    const ids = new idGenerator_1.IdGenerator('menu-item-action-item-icon-');
    let MenuEntryActionViewItem = class MenuEntryActionViewItem extends actionbar_1.ActionViewItem {
        constructor(_action, _keybindingService, _notificationService, _contextMenuService) {
            super(undefined, _action, { icon: !!(_action.class || _action.item.icon), label: !_action.class && !_action.item.icon });
            this._action = _action;
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._wantsAltCommand = false;
            this._itemClassDispose = this._register(new lifecycle_1.MutableDisposable());
            this._altKey = AlternativeKeyEmitter.getInstance(_contextMenuService);
        }
        get _commandAction() {
            return this._wantsAltCommand && this._action.alt || this._action;
        }
        onClick(event) {
            event.preventDefault();
            event.stopPropagation();
            if (this._altKey.isPressed) {
                this._altKey.suppressAltKeyUp();
            }
            this.actionRunner.run(this._commandAction)
                .then(undefined, err => this._notificationService.error(err));
        }
        render(container) {
            super.render(container);
            this._updateItemClass(this._action.item);
            let mouseOver = false;
            let alternativeKeyDown = this._altKey.isPressed;
            const updateAltState = () => {
                const wantsAltCommand = mouseOver && alternativeKeyDown;
                if (wantsAltCommand !== this._wantsAltCommand) {
                    this._wantsAltCommand = wantsAltCommand;
                    this.updateLabel();
                    this.updateTooltip();
                    this.updateClass();
                }
            };
            if (this._action.alt) {
                this._register(this._altKey.event(value => {
                    alternativeKeyDown = value;
                    updateAltState();
                }));
            }
            this._register(event_1.domEvent(container, 'mouseleave')(_ => {
                mouseOver = false;
                updateAltState();
            }));
            this._register(event_1.domEvent(container, 'mouseenter')(e => {
                mouseOver = true;
                updateAltState();
            }));
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.textContent = this._commandAction.label;
            }
        }
        updateTooltip() {
            if (this.label) {
                const keybinding = this._keybindingService.lookupKeybinding(this._commandAction.id);
                const keybindingLabel = keybinding && keybinding.getLabel();
                const tooltip = this._commandAction.tooltip || this._commandAction.label;
                this.label.title = keybindingLabel
                    ? nls_1.localize('titleAndKb', "{0} ({1})", tooltip, keybindingLabel)
                    : tooltip;
            }
        }
        updateClass() {
            if (this.options.icon) {
                if (this._commandAction !== this._action) {
                    if (this._action.alt) {
                        this._updateItemClass(this._action.alt.item);
                    }
                }
                else if (this._action.alt) {
                    this._updateItemClass(this._action.item);
                }
            }
        }
        _updateItemClass(item) {
            var _a, _b;
            this._itemClassDispose.value = undefined;
            const icon = this._commandAction.checked && ((_a = item.toggled) === null || _a === void 0 ? void 0 : _a.icon) ? item.toggled.icon : item.icon;
            if (themeService_1.ThemeIcon.isThemeIcon(icon)) {
                // theme icons
                const iconClass = themeService_1.ThemeIcon.asClassName(icon);
                if (this.label && iconClass) {
                    dom_1.addClasses(this.label, iconClass);
                    this._itemClassDispose.value = lifecycle_1.toDisposable(() => {
                        if (this.label) {
                            dom_1.removeClasses(this.label, iconClass);
                        }
                    });
                }
            }
            else if (icon) {
                // icon path
                let iconClass;
                if ((_b = icon === null || icon === void 0 ? void 0 : icon.dark) === null || _b === void 0 ? void 0 : _b.scheme) {
                    const iconPathMapKey = icon.dark.toString();
                    if (MenuEntryActionViewItem.ICON_PATH_TO_CSS_RULES.has(iconPathMapKey)) {
                        iconClass = MenuEntryActionViewItem.ICON_PATH_TO_CSS_RULES.get(iconPathMapKey);
                    }
                    else {
                        iconClass = ids.nextId();
                        dom_1.createCSSRule(`.icon.${iconClass}`, `background-image: ${dom_1.asCSSUrl(icon.light || icon.dark)}`);
                        dom_1.createCSSRule(`.vs-dark .icon.${iconClass}, .hc-black .icon.${iconClass}`, `background-image: ${dom_1.asCSSUrl(icon.dark)}`);
                        MenuEntryActionViewItem.ICON_PATH_TO_CSS_RULES.set(iconPathMapKey, iconClass);
                    }
                    if (this.label) {
                        dom_1.addClasses(this.label, 'icon', iconClass);
                        this._itemClassDispose.value = lifecycle_1.toDisposable(() => {
                            if (this.label) {
                                dom_1.removeClasses(this.label, 'icon', iconClass);
                            }
                        });
                    }
                }
            }
        }
    };
    MenuEntryActionViewItem.ICON_PATH_TO_CSS_RULES = new Map();
    MenuEntryActionViewItem = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, notification_1.INotificationService),
        __param(3, contextView_1.IContextMenuService)
    ], MenuEntryActionViewItem);
    exports.MenuEntryActionViewItem = MenuEntryActionViewItem;
    // Need to subclass MenuEntryActionViewItem in order to respect
    // the action context coming from any action bar, without breaking
    // existing users
    class ContextAwareMenuEntryActionViewItem extends MenuEntryActionViewItem {
        onClick(event) {
            event.preventDefault();
            event.stopPropagation();
            this.actionRunner.run(this._commandAction, this._context)
                .then(undefined, err => this._notificationService.error(err));
        }
    }
    exports.ContextAwareMenuEntryActionViewItem = ContextAwareMenuEntryActionViewItem;
});
//# __sourceMappingURL=menuEntryActionViewItem.js.map