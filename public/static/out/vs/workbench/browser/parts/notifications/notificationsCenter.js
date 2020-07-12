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
define(["require", "exports", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/workbench/browser/parts/notifications/notificationsList", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dom", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/platform/keybinding/common/keybinding", "vs/base/common/types", "vs/css!./media/notificationsCenter", "vs/css!./media/notificationsActions"], function (require, exports, theme_1, themeService_1, layoutService_1, event_1, contextkey_1, notificationsCommands_1, notificationsList_1, instantiation_1, dom_1, colorRegistry_1, editorGroupsService_1, nls_1, actionbar_1, notificationsActions_1, keybinding_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsCenter = void 0;
    let NotificationsCenter = class NotificationsCenter extends themeService_1.Themable {
        constructor(container, model, themeService, instantiationService, layoutService, contextKeyService, editorGroupService, keybindingService) {
            super(themeService);
            this.container = container;
            this.model = model;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.editorGroupService = editorGroupService;
            this.keybindingService = keybindingService;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.notificationsCenterVisibleContextKey = notificationsCommands_1.NotificationsCenterVisibleContext.bindTo(contextKeyService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
            this._register(this.layoutService.onLayout(dimension => this.layout(dimension)));
        }
        get isVisible() {
            return !!this._isVisible;
        }
        show() {
            if (this._isVisible) {
                const notificationsList = types_1.assertIsDefined(this.notificationsList);
                notificationsList.show(true /* focus */);
                return; // already visible
            }
            // Lazily create if showing for the first time
            if (!this.notificationsCenterContainer) {
                this.create();
            }
            // Title
            this.updateTitle();
            // Make visible
            const [notificationsList, notificationsCenterContainer] = types_1.assertAllDefined(this.notificationsList, this.notificationsCenterContainer);
            this._isVisible = true;
            dom_1.addClass(notificationsCenterContainer, 'visible');
            notificationsList.show();
            // Layout
            this.layout(this.workbenchDimensions);
            // Show all notifications that are present now
            notificationsList.updateNotificationsList(0, 0, this.model.notifications);
            // Focus first
            notificationsList.focusFirst();
            // Theming
            this.updateStyles();
            // Mark as visible
            this.model.notifications.forEach(notification => notification.updateVisibility(true));
            // Context Key
            this.notificationsCenterVisibleContextKey.set(true);
            // Event
            this._onDidChangeVisibility.fire();
        }
        updateTitle() {
            const [notificationsCenterTitle, clearAllAction] = types_1.assertAllDefined(this.notificationsCenterTitle, this.clearAllAction);
            if (this.model.notifications.length === 0) {
                notificationsCenterTitle.textContent = nls_1.localize('notificationsEmpty', "No new notifications");
                clearAllAction.enabled = false;
            }
            else {
                notificationsCenterTitle.textContent = nls_1.localize('notifications', "Notifications");
                clearAllAction.enabled = this.model.notifications.some(notification => !notification.hasProgress);
            }
        }
        create() {
            // Container
            this.notificationsCenterContainer = document.createElement('div');
            dom_1.addClass(this.notificationsCenterContainer, 'notifications-center');
            // Header
            this.notificationsCenterHeader = document.createElement('div');
            dom_1.addClass(this.notificationsCenterHeader, 'notifications-center-header');
            this.notificationsCenterContainer.appendChild(this.notificationsCenterHeader);
            // Header Title
            this.notificationsCenterTitle = document.createElement('span');
            dom_1.addClass(this.notificationsCenterTitle, 'notifications-center-header-title');
            this.notificationsCenterHeader.appendChild(this.notificationsCenterTitle);
            // Header Toolbar
            const toolbarContainer = document.createElement('div');
            dom_1.addClass(toolbarContainer, 'notifications-center-header-toolbar');
            this.notificationsCenterHeader.appendChild(toolbarContainer);
            const actionRunner = this._register(this.instantiationService.createInstance(notificationsActions_1.NotificationActionRunner));
            const notificationsToolBar = this._register(new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: nls_1.localize('notificationsToolbar', "Notification Center Actions"),
                actionRunner
            }));
            this.clearAllAction = this._register(this.instantiationService.createInstance(notificationsActions_1.ClearAllNotificationsAction, notificationsActions_1.ClearAllNotificationsAction.ID, notificationsActions_1.ClearAllNotificationsAction.LABEL));
            notificationsToolBar.push(this.clearAllAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(this.clearAllAction) });
            const hideAllAction = this._register(this.instantiationService.createInstance(notificationsActions_1.HideNotificationsCenterAction, notificationsActions_1.HideNotificationsCenterAction.ID, notificationsActions_1.HideNotificationsCenterAction.LABEL));
            notificationsToolBar.push(hideAllAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(hideAllAction) });
            // Notifications List
            this.notificationsList = this.instantiationService.createInstance(notificationsList_1.NotificationsList, this.notificationsCenterContainer, {});
            this.container.appendChild(this.notificationsCenterContainer);
        }
        getKeybindingLabel(action) {
            const keybinding = this.keybindingService.lookupKeybinding(action.id);
            return keybinding ? keybinding.getLabel() : null;
        }
        onDidChangeNotification(e) {
            if (!this._isVisible) {
                return; // only if visible
            }
            let focusEditor = false;
            // Update notifications list based on event kind
            const [notificationsList, notificationsCenterContainer] = types_1.assertAllDefined(this.notificationsList, this.notificationsCenterContainer);
            switch (e.kind) {
                case 0 /* ADD */:
                    notificationsList.updateNotificationsList(e.index, 0, [e.item]);
                    e.item.updateVisibility(true);
                    break;
                case 1 /* CHANGE */:
                    // Handle content changes
                    // - actions: re-draw to properly show them
                    // - message: update notification height unless collapsed
                    switch (e.detail) {
                        case 2 /* ACTIONS */:
                            notificationsList.updateNotificationsList(e.index, 1, [e.item]);
                            break;
                        case 1 /* MESSAGE */:
                            if (e.item.expanded) {
                                notificationsList.updateNotificationHeight(e.item);
                            }
                            break;
                    }
                    break;
                case 2 /* EXPAND_COLLAPSE */:
                    // Re-draw entire item when expansion changes to reveal or hide details
                    notificationsList.updateNotificationsList(e.index, 1, [e.item]);
                    break;
                case 3 /* REMOVE */:
                    focusEditor = dom_1.isAncestor(document.activeElement, notificationsCenterContainer);
                    notificationsList.updateNotificationsList(e.index, 1);
                    e.item.updateVisibility(false);
                    break;
            }
            // Update title
            this.updateTitle();
            // Hide if no more notifications to show
            if (this.model.notifications.length === 0) {
                this.hide();
                // Restore focus to editor group if we had focus
                if (focusEditor) {
                    this.editorGroupService.activeGroup.focus();
                }
            }
        }
        hide() {
            if (!this._isVisible || !this.notificationsCenterContainer || !this.notificationsList) {
                return; // already hidden
            }
            const focusEditor = dom_1.isAncestor(document.activeElement, this.notificationsCenterContainer);
            // Hide
            this._isVisible = false;
            dom_1.removeClass(this.notificationsCenterContainer, 'visible');
            this.notificationsList.hide();
            // Mark as hidden
            this.model.notifications.forEach(notification => notification.updateVisibility(false));
            // Context Key
            this.notificationsCenterVisibleContextKey.set(false);
            // Event
            this._onDidChangeVisibility.fire();
            // Restore focus to editor group if we had focus
            if (focusEditor) {
                this.editorGroupService.activeGroup.focus();
            }
        }
        updateStyles() {
            if (this.notificationsCenterContainer && this.notificationsCenterHeader) {
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                this.notificationsCenterContainer.style.boxShadow = widgetShadowColor ? `0 0px 8px ${widgetShadowColor}` : '';
                const borderColor = this.getColor(theme_1.NOTIFICATIONS_CENTER_BORDER);
                this.notificationsCenterContainer.style.border = borderColor ? `1px solid ${borderColor}` : '';
                const headerForeground = this.getColor(theme_1.NOTIFICATIONS_CENTER_HEADER_FOREGROUND);
                this.notificationsCenterHeader.style.color = headerForeground ? headerForeground.toString() : '';
                const headerBackground = this.getColor(theme_1.NOTIFICATIONS_CENTER_HEADER_BACKGROUND);
                this.notificationsCenterHeader.style.background = headerBackground ? headerBackground.toString() : '';
            }
        }
        layout(dimension) {
            this.workbenchDimensions = dimension;
            if (this._isVisible && this.notificationsCenterContainer) {
                let maxWidth = NotificationsCenter.MAX_DIMENSIONS.width;
                let maxHeight = NotificationsCenter.MAX_DIMENSIONS.height;
                let availableWidth = maxWidth;
                let availableHeight = maxHeight;
                if (this.workbenchDimensions) {
                    // Make sure notifications are not exceding available width
                    availableWidth = this.workbenchDimensions.width;
                    availableWidth -= (2 * 8); // adjust for paddings left and right
                    // Make sure notifications are not exceeding available height
                    availableHeight = this.workbenchDimensions.height - 35 /* header */;
                    if (this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */)) {
                        availableHeight -= 22; // adjust for status bar
                    }
                    if (this.layoutService.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                        availableHeight -= 22; // adjust for title bar
                    }
                    availableHeight -= (2 * 12); // adjust for paddings top and bottom
                }
                // Apply to list
                const notificationsList = types_1.assertIsDefined(this.notificationsList);
                notificationsList.layout(Math.min(maxWidth, availableWidth), Math.min(maxHeight, availableHeight));
            }
        }
        clearAll() {
            // Hide notifications center first
            this.hide();
            // Close all
            for (const notification of [...this.model.notifications] /* copy array since we modify it from closing */) {
                if (!notification.hasProgress) {
                    notification.close();
                }
            }
        }
    };
    NotificationsCenter.MAX_DIMENSIONS = new dom_1.Dimension(450, 400);
    NotificationsCenter = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, keybinding_1.IKeybindingService)
    ], NotificationsCenter);
    exports.NotificationsCenter = NotificationsCenter;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const notificationBorderColor = theme.getColor(theme_1.NOTIFICATIONS_BORDER);
        if (notificationBorderColor) {
            collector.addRule(`.monaco-workbench > .notifications-center .notifications-list-container .monaco-list-row[data-last-element="false"] > .notification-list-item { border-bottom: 1px solid ${notificationBorderColor}; }`);
        }
    });
});
//# __sourceMappingURL=notificationsCenter.js.map