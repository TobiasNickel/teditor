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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/commands/common/commands", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dnd", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/workbench/browser/dnd", "vs/base/common/codicons"], function (require, exports, nls, actions_1, dom, actionbar_1, commands_1, lifecycle_1, contextView_1, themeService_1, activity_1, instantiation_1, colorRegistry_1, dnd_1, keybinding_1, event_1, dnd_2, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleCompositePinnedAction = exports.CompositeActionViewItem = exports.CompositeOverflowActivityActionViewItem = exports.CompositeOverflowActivityAction = exports.ActivityActionViewItem = exports.ActivityAction = void 0;
    class ActivityAction extends actions_1.Action {
        constructor(_activity) {
            super(_activity.id, _activity.name, _activity.cssClass);
            this._activity = _activity;
            this._onDidChangeActivity = this._register(new event_1.Emitter());
            this.onDidChangeActivity = this._onDidChangeActivity.event;
            this._onDidChangeBadge = this._register(new event_1.Emitter());
            this.onDidChangeBadge = this._onDidChangeBadge.event;
        }
        get activity() {
            return this._activity;
        }
        set activity(activity) {
            this._label = activity.name;
            this._activity = activity;
            this._onDidChangeActivity.fire(this);
        }
        activate() {
            if (!this.checked) {
                this._setChecked(true);
            }
        }
        deactivate() {
            if (this.checked) {
                this._setChecked(false);
            }
        }
        getBadge() {
            return this.badge;
        }
        getClass() {
            return this.clazz;
        }
        setBadge(badge, clazz) {
            this.badge = badge;
            this.clazz = clazz;
            this._onDidChangeBadge.fire(this);
        }
        dispose() {
            this._onDidChangeActivity.dispose();
            this._onDidChangeBadge.dispose();
            super.dispose();
        }
    }
    exports.ActivityAction = ActivityAction;
    let ActivityActionViewItem = class ActivityActionViewItem extends actionbar_1.BaseActionViewItem {
        constructor(action, options, themeService) {
            super(null, action, options);
            this.themeService = themeService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.themeService.onDidColorThemeChange(this.onThemeChange, this));
            this._register(action.onDidChangeActivity(this.updateActivity, this));
            this._register(action.onDidChangeBadge(this.updateBadge, this));
        }
        get activity() {
            return this._action.activity;
        }
        updateStyles() {
            const theme = this.themeService.getColorTheme();
            const colors = this.options.colors(theme);
            if (this.label) {
                if (this.options.icon) {
                    const foreground = this._action.checked ? colors.activeBackgroundColor || colors.activeForegroundColor : colors.inactiveBackgroundColor || colors.inactiveForegroundColor;
                    if (this.activity.iconUrl) {
                        // Apply background color to activity bar item provided with iconUrls
                        this.label.style.backgroundColor = foreground ? foreground.toString() : '';
                        this.label.style.color = '';
                    }
                    else {
                        // Apply foreground color to activity bar items provided with codicons
                        this.label.style.color = foreground ? foreground.toString() : '';
                        this.label.style.backgroundColor = '';
                    }
                }
                else {
                    const foreground = this._action.checked ? colors.activeForegroundColor : colors.inactiveForegroundColor;
                    const borderBottomColor = this._action.checked ? colors.activeBorderBottomColor : null;
                    this.label.style.color = foreground ? foreground.toString() : '';
                    this.label.style.borderBottomColor = borderBottomColor ? borderBottomColor.toString() : '';
                }
                this.container.style.setProperty('--insert-border-color', colors.dragAndDropBorder ? colors.dragAndDropBorder.toString() : '');
            }
            // Badge
            if (this.badgeContent) {
                const badgeForeground = colors.badgeForeground;
                const badgeBackground = colors.badgeBackground;
                const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
                this.badgeContent.style.color = badgeForeground ? badgeForeground.toString() : '';
                this.badgeContent.style.backgroundColor = badgeBackground ? badgeBackground.toString() : '';
                this.badgeContent.style.borderStyle = contrastBorderColor ? 'solid' : '';
                this.badgeContent.style.borderWidth = contrastBorderColor ? '1px' : '';
                this.badgeContent.style.borderColor = contrastBorderColor ? contrastBorderColor.toString() : '';
            }
        }
        render(container) {
            super.render(container);
            this.container = container;
            // Make the container tab-able for keyboard navigation
            this.container.tabIndex = 0;
            this.container.setAttribute('role', 'tab');
            // Try hard to prevent keyboard only focus feedback when using mouse
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_DOWN, () => {
                dom.addClass(this.container, 'clicked');
            }));
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_UP, () => {
                if (this.mouseUpTimeout) {
                    clearTimeout(this.mouseUpTimeout);
                }
                this.mouseUpTimeout = setTimeout(() => {
                    dom.removeClass(this.container, 'clicked');
                }, 800); // delayed to prevent focus feedback from showing on mouse up
            }));
            // Label
            this.label = dom.append(container, dom.$('a'));
            // Badge
            this.badge = dom.append(container, dom.$('.badge'));
            this.badgeContent = dom.append(this.badge, dom.$('.badge-content'));
            // Activity bar active border + background
            const isActivityBarItem = this.options.icon;
            if (isActivityBarItem) {
                dom.append(container, dom.$('.active-item-indicator'));
            }
            dom.hide(this.badge);
            this.updateActivity();
            this.updateStyles();
        }
        onThemeChange(theme) {
            this.updateStyles();
        }
        updateActivity() {
            this.updateLabel();
            this.updateTitle(this.activity.name);
            this.updateBadge();
            this.updateStyles();
        }
        updateBadge() {
            const action = this.getAction();
            if (!this.badge || !this.badgeContent || !(action instanceof ActivityAction)) {
                return;
            }
            const badge = action.getBadge();
            const clazz = action.getClass();
            this.badgeDisposable.clear();
            dom.clearNode(this.badgeContent);
            dom.hide(this.badge);
            if (badge) {
                // Number
                if (badge instanceof activity_1.NumberBadge) {
                    if (badge.number) {
                        let number = badge.number.toString();
                        if (badge.number > 999) {
                            const noOfThousands = badge.number / 1000;
                            const floor = Math.floor(noOfThousands);
                            if (noOfThousands > floor) {
                                number = `${floor}K+`;
                            }
                            else {
                                number = `${noOfThousands}K`;
                            }
                        }
                        this.badgeContent.textContent = number;
                        dom.show(this.badge);
                    }
                }
                // Text
                else if (badge instanceof activity_1.TextBadge) {
                    this.badgeContent.textContent = badge.text;
                    dom.show(this.badge);
                }
                // Text
                else if (badge instanceof activity_1.IconBadge) {
                    dom.show(this.badge);
                }
                // Progress
                else if (badge instanceof activity_1.ProgressBadge) {
                    dom.show(this.badge);
                }
                if (clazz) {
                    dom.addClasses(this.badge, clazz);
                    this.badgeDisposable.value = lifecycle_1.toDisposable(() => dom.removeClasses(this.badge, clazz));
                }
            }
            // Title
            let title;
            if (badge === null || badge === void 0 ? void 0 : badge.getDescription()) {
                if (this.activity.name) {
                    title = nls.localize('badgeTitle', "{0} - {1}", this.activity.name, badge.getDescription());
                }
                else {
                    title = badge.getDescription();
                }
            }
            else {
                title = this.activity.name;
            }
            this.updateTitle(title);
        }
        updateLabel() {
            this.label.className = 'action-label';
            if (this.activity.cssClass) {
                dom.addClasses(this.label, this.activity.cssClass);
            }
            if (this.options.icon && !this.activity.iconUrl) {
                // Only apply codicon class to activity bar icon items without iconUrl
                dom.addClass(this.label, 'codicon');
            }
            if (!this.options.icon) {
                this.label.textContent = this.getAction().label;
            }
        }
        updateTitle(title) {
            [this.label, this.badge, this.container].forEach(element => {
                if (element) {
                    element.setAttribute('aria-label', title);
                    element.title = title;
                }
            });
        }
        dispose() {
            super.dispose();
            if (this.mouseUpTimeout) {
                clearTimeout(this.mouseUpTimeout);
            }
            this.badge.remove();
        }
    };
    ActivityActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService)
    ], ActivityActionViewItem);
    exports.ActivityActionViewItem = ActivityActionViewItem;
    class CompositeOverflowActivityAction extends ActivityAction {
        constructor(showMenu) {
            super({
                id: 'additionalComposites.action',
                name: nls.localize('additionalViews', "Additional Views"),
                cssClass: codicons_1.Codicon.more.classNames
            });
            this.showMenu = showMenu;
        }
        async run() {
            this.showMenu();
        }
    }
    exports.CompositeOverflowActivityAction = CompositeOverflowActivityAction;
    let CompositeOverflowActivityActionViewItem = class CompositeOverflowActivityActionViewItem extends ActivityActionViewItem {
        constructor(action, getOverflowingComposites, getActiveCompositeId, getBadge, getCompositeOpenAction, colors, contextMenuService, themeService) {
            super(action, { icon: true, colors }, themeService);
            this.getOverflowingComposites = getOverflowingComposites;
            this.getActiveCompositeId = getActiveCompositeId;
            this.getBadge = getBadge;
            this.getCompositeOpenAction = getCompositeOpenAction;
            this.contextMenuService = contextMenuService;
            this.actions = [];
        }
        showMenu() {
            if (this.actions) {
                lifecycle_1.dispose(this.actions);
            }
            this.actions = this.getActions();
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.container,
                getActions: () => this.actions,
                getCheckedActionsRepresentation: () => 'radio',
                onHide: () => lifecycle_1.dispose(this.actions)
            });
        }
        getActions() {
            return this.getOverflowingComposites().map(composite => {
                const action = this.getCompositeOpenAction(composite.id);
                action.checked = this.getActiveCompositeId() === action.id;
                const badge = this.getBadge(composite.id);
                let suffix;
                if (badge instanceof activity_1.NumberBadge) {
                    suffix = badge.number;
                }
                else if (badge instanceof activity_1.TextBadge) {
                    suffix = badge.text;
                }
                if (suffix) {
                    action.label = nls.localize('numberBadge', "{0} ({1})", composite.name, suffix);
                }
                else {
                    action.label = composite.name || '';
                }
                return action;
            });
        }
        dispose() {
            super.dispose();
            if (this.actions) {
                this.actions = lifecycle_1.dispose(this.actions);
            }
        }
    };
    CompositeOverflowActivityActionViewItem = __decorate([
        __param(6, contextView_1.IContextMenuService),
        __param(7, themeService_1.IThemeService)
    ], CompositeOverflowActivityActionViewItem);
    exports.CompositeOverflowActivityActionViewItem = CompositeOverflowActivityActionViewItem;
    let ManageExtensionAction = class ManageExtensionAction extends actions_1.Action {
        constructor(commandService) {
            super('activitybar.manage.extension', nls.localize('manageExtension', "Manage Extension"));
            this.commandService = commandService;
        }
        run(id) {
            return this.commandService.executeCommand('_extensions.manage', id);
        }
    };
    ManageExtensionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], ManageExtensionAction);
    let CompositeActionViewItem = class CompositeActionViewItem extends ActivityActionViewItem {
        constructor(compositeActivityAction, toggleCompositePinnedAction, compositeContextMenuActionsProvider, contextMenuActionsProvider, colors, icon, dndHandler, compositeBar, contextMenuService, keybindingService, instantiationService, themeService) {
            super(compositeActivityAction, { draggable: true, colors, icon }, themeService);
            this.compositeActivityAction = compositeActivityAction;
            this.toggleCompositePinnedAction = toggleCompositePinnedAction;
            this.compositeContextMenuActionsProvider = compositeContextMenuActionsProvider;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.dndHandler = dndHandler;
            this.compositeBar = compositeBar;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            if (!CompositeActionViewItem.manageExtensionAction) {
                CompositeActionViewItem.manageExtensionAction = instantiationService.createInstance(ManageExtensionAction);
            }
            this._register(compositeActivityAction.onDidChangeActivity(() => {
                this.compositeActivity = undefined;
                this.updateActivity();
            }, this));
            this._register(event_1.Event.any(compositeActivityAction.onDidChangeActivity, event_1.Event.filter(keybindingService.onDidUpdateKeybindings, () => this.compositeActivity.name !== this.getActivtyName()))(() => {
                if (this.compositeActivity && this.compositeActivity.name !== this.getActivtyName()) {
                    this.compositeActivity = undefined;
                    this.updateActivity();
                }
            }));
        }
        get activity() {
            if (!this.compositeActivity) {
                this.compositeActivity = Object.assign(Object.assign({}, this.compositeActivityAction.activity), { name: this.getActivtyName() });
            }
            return this.compositeActivity;
        }
        getActivtyName() {
            const keybinding = this.compositeActivityAction.activity.keybindingId ? this.keybindingService.lookupKeybinding(this.compositeActivityAction.activity.keybindingId) : null;
            return keybinding ? nls.localize('titleKeybinding', "{0} ({1})", this.compositeActivityAction.activity.name, keybinding.getLabel()) : this.compositeActivityAction.activity.name;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
            this.updateEnabled();
            this._register(dom.addDisposableListener(this.container, dom.EventType.CONTEXT_MENU, e => {
                dom.EventHelper.stop(e, true);
                this.showContextMenu(container);
            }));
            let insertDropBefore = undefined;
            // Allow to drag
            this._register(dnd_2.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.container, () => { return { type: 'composite', id: this.activity.id }; }, {
                onDragOver: e => {
                    const isValidMove = e.dragAndDropData.getData().id !== this.activity.id && this.dndHandler.onDragOver(e.dragAndDropData, this.activity.id, e.eventData);
                    dnd_2.toggleDropEffect(e.eventData.dataTransfer, 'move', isValidMove);
                    insertDropBefore = this.updateFromDragging(container, isValidMove, e.eventData);
                },
                onDragLeave: e => {
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDragEnd: e => {
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDrop: e => {
                    dom.EventHelper.stop(e.eventData, true);
                    this.dndHandler.drop(e.dragAndDropData, this.activity.id, e.eventData, insertDropBefore);
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDragStart: e => {
                    if (e.dragAndDropData.getData().id !== this.activity.id) {
                        return;
                    }
                    if (e.eventData.dataTransfer) {
                        e.eventData.dataTransfer.effectAllowed = 'move';
                    }
                    // Remove focus indicator when dragging
                    this.blur();
                }
            }));
            // Activate on drag over to reveal targets
            [this.badge, this.label].forEach(b => this._register(new dnd_1.DelayedDragHandler(b, () => {
                if (!this.getAction().checked) {
                    this.getAction().run();
                }
            })));
            this.updateStyles();
        }
        updateFromDragging(element, showFeedback, event) {
            const rect = element.getBoundingClientRect();
            const posX = event.clientX;
            const posY = event.clientY;
            const height = rect.bottom - rect.top;
            const width = rect.right - rect.left;
            const forceTop = posY <= rect.top + height * 0.4;
            const forceBottom = posY > rect.bottom - height * 0.4;
            const preferTop = posY <= rect.top + height * 0.5;
            const forceLeft = posX <= rect.left + width * 0.4;
            const forceRight = posX > rect.right - width * 0.4;
            const preferLeft = posX <= rect.left + width * 0.5;
            const classes = element.classList;
            const lastClasses = {
                vertical: classes.contains('top') ? 'top' : (classes.contains('bottom') ? 'bottom' : undefined),
                horizontal: classes.contains('left') ? 'left' : (classes.contains('right') ? 'right' : undefined)
            };
            const top = forceTop || (preferTop && !lastClasses.vertical) || (!forceBottom && lastClasses.vertical === 'top');
            const bottom = forceBottom || (!preferTop && !lastClasses.vertical) || (!forceTop && lastClasses.vertical === 'bottom');
            const left = forceLeft || (preferLeft && !lastClasses.horizontal) || (!forceRight && lastClasses.horizontal === 'left');
            const right = forceRight || (!preferLeft && !lastClasses.horizontal) || (!forceLeft && lastClasses.horizontal === 'right');
            dom.toggleClass(element, 'top', showFeedback && top);
            dom.toggleClass(element, 'bottom', showFeedback && bottom);
            dom.toggleClass(element, 'left', showFeedback && left);
            dom.toggleClass(element, 'right', showFeedback && right);
            if (!showFeedback) {
                return undefined;
            }
            return { verticallyBefore: top, horizontallyBefore: left };
        }
        showContextMenu(container) {
            const actions = [this.toggleCompositePinnedAction];
            const compositeContextMenuActions = this.compositeContextMenuActionsProvider(this.activity.id);
            if (compositeContextMenuActions.length) {
                actions.push(...compositeContextMenuActions);
            }
            if (this.compositeActivityAction.activity.extensionId) {
                actions.push(new actionbar_1.Separator());
                actions.push(CompositeActionViewItem.manageExtensionAction);
            }
            const isPinned = this.compositeBar.isPinned(this.activity.id);
            if (isPinned) {
                this.toggleCompositePinnedAction.label = nls.localize('hide', "Hide");
                this.toggleCompositePinnedAction.checked = false;
            }
            else {
                this.toggleCompositePinnedAction.label = nls.localize('keep', "Keep");
            }
            const otherActions = this.contextMenuActionsProvider();
            if (otherActions.length) {
                actions.push(new actionbar_1.Separator());
                actions.push(...otherActions);
            }
            const elementPosition = dom.getDomNodePagePosition(container);
            const anchor = {
                x: Math.floor(elementPosition.left + (elementPosition.width / 2)),
                y: elementPosition.top + elementPosition.height
            };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => this.activity.id
            });
        }
        focus() {
            this.container.focus();
        }
        updateChecked() {
            if (this.getAction().checked) {
                dom.addClass(this.container, 'checked');
                this.container.setAttribute('aria-label', nls.localize('compositeActive', "{0} active", this.container.title));
                this.container.setAttribute('aria-expanded', 'true');
            }
            else {
                dom.removeClass(this.container, 'checked');
                this.container.setAttribute('aria-label', this.container.title);
                this.container.setAttribute('aria-expanded', 'false');
            }
            this.updateStyles();
        }
        updateEnabled() {
            if (!this.element) {
                return;
            }
            if (this.getAction().enabled) {
                dom.removeClass(this.element, 'disabled');
            }
            else {
                dom.addClass(this.element, 'disabled');
            }
        }
        dispose() {
            super.dispose();
            this.label.remove();
        }
    };
    CompositeActionViewItem = __decorate([
        __param(8, contextView_1.IContextMenuService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, themeService_1.IThemeService)
    ], CompositeActionViewItem);
    exports.CompositeActionViewItem = CompositeActionViewItem;
    class ToggleCompositePinnedAction extends actions_1.Action {
        constructor(activity, compositeBar) {
            super('show.toggleCompositePinned', activity ? activity.name : nls.localize('toggle', "Toggle View Pinned"));
            this.activity = activity;
            this.compositeBar = compositeBar;
            this.checked = !!this.activity && this.compositeBar.isPinned(this.activity.id);
        }
        async run(context) {
            const id = this.activity ? this.activity.id : context;
            if (this.compositeBar.isPinned(id)) {
                this.compositeBar.unpin(id);
            }
            else {
                this.compositeBar.pin(id);
            }
        }
    }
    exports.ToggleCompositePinnedAction = ToggleCompositePinnedAction;
});
//# __sourceMappingURL=compositeBarActions.js.map