/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/notifications", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/list/browser/listService"], function (require, exports, commands_1, contextkey_1, keybindingsRegistry_1, notifications_1, actions_1, nls_1, listService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerNotificationCommands = exports.NotificationsToastsVisibleContext = exports.NotificationsCenterVisibleContext = exports.NotificationFocusedContext = exports.CLEAR_ALL_NOTIFICATIONS = exports.CLEAR_NOTIFICATION = exports.TOGGLE_NOTIFICATION = exports.EXPAND_NOTIFICATION = exports.COLLAPSE_NOTIFICATION = exports.FOCUS_LAST_NOTIFICATION_TOAST = exports.FOCUS_FIRST_NOTIFICATION_TOAST = exports.FOCUS_PREVIOUS_NOTIFICATION_TOAST = exports.FOCUS_NEXT_NOTIFICATION_TOAST = exports.FOCUS_NOTIFICATION_TOAST = exports.HIDE_NOTIFICATION_TOAST = exports.TOGGLE_NOTIFICATIONS_CENTER = exports.HIDE_NOTIFICATIONS_CENTER = exports.SHOW_NOTIFICATIONS_CENTER = void 0;
    // Center
    exports.SHOW_NOTIFICATIONS_CENTER = 'notifications.showList';
    exports.HIDE_NOTIFICATIONS_CENTER = 'notifications.hideList';
    exports.TOGGLE_NOTIFICATIONS_CENTER = 'notifications.toggleList';
    // Toasts
    exports.HIDE_NOTIFICATION_TOAST = 'notifications.hideToasts';
    exports.FOCUS_NOTIFICATION_TOAST = 'notifications.focusToasts';
    exports.FOCUS_NEXT_NOTIFICATION_TOAST = 'notifications.focusNextToast';
    exports.FOCUS_PREVIOUS_NOTIFICATION_TOAST = 'notifications.focusPreviousToast';
    exports.FOCUS_FIRST_NOTIFICATION_TOAST = 'notifications.focusFirstToast';
    exports.FOCUS_LAST_NOTIFICATION_TOAST = 'notifications.focusLastToast';
    // Notification
    exports.COLLAPSE_NOTIFICATION = 'notification.collapse';
    exports.EXPAND_NOTIFICATION = 'notification.expand';
    exports.TOGGLE_NOTIFICATION = 'notification.toggle';
    exports.CLEAR_NOTIFICATION = 'notification.clear';
    exports.CLEAR_ALL_NOTIFICATIONS = 'notifications.clearAll';
    exports.NotificationFocusedContext = new contextkey_1.RawContextKey('notificationFocus', true);
    exports.NotificationsCenterVisibleContext = new contextkey_1.RawContextKey('notificationCenterVisible', false);
    exports.NotificationsToastsVisibleContext = new contextkey_1.RawContextKey('notificationToastsVisible', false);
    function registerNotificationCommands(center, toasts) {
        function getNotificationFromContext(listService, context) {
            if (notifications_1.isNotificationViewItem(context)) {
                return context;
            }
            const list = listService.lastFocusedList;
            if (list instanceof listService_1.WorkbenchList) {
                const focusedElement = list.getFocusedElements()[0];
                if (notifications_1.isNotificationViewItem(focusedElement)) {
                    return focusedElement;
                }
            }
            return undefined;
        }
        // Show Notifications Cneter
        commands_1.CommandsRegistry.registerCommand(exports.SHOW_NOTIFICATIONS_CENTER, () => {
            toasts.hide();
            center.show();
        });
        // Hide Notifications Center
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.HIDE_NOTIFICATIONS_CENTER,
            weight: 200 /* WorkbenchContrib */ + 50,
            when: exports.NotificationsCenterVisibleContext,
            primary: 9 /* Escape */,
            handler: accessor => center.hide()
        });
        // Toggle Notifications Center
        commands_1.CommandsRegistry.registerCommand(exports.TOGGLE_NOTIFICATIONS_CENTER, accessor => {
            if (center.isVisible) {
                center.hide();
            }
            else {
                toasts.hide();
                center.show();
            }
        });
        // Clear Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLEAR_NOTIFICATION,
            weight: 200 /* WorkbenchContrib */,
            when: exports.NotificationFocusedContext,
            primary: 20 /* Delete */,
            mac: {
                primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
            },
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification && !notification.hasProgress) {
                    notification.close();
                }
            }
        });
        // Expand Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.EXPAND_NOTIFICATION,
            weight: 200 /* WorkbenchContrib */,
            when: exports.NotificationFocusedContext,
            primary: 17 /* RightArrow */,
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification) {
                    notification.expand();
                }
            }
        });
        // Collapse Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.COLLAPSE_NOTIFICATION,
            weight: 200 /* WorkbenchContrib */,
            when: exports.NotificationFocusedContext,
            primary: 15 /* LeftArrow */,
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification) {
                    notification.collapse();
                }
            }
        });
        // Toggle Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_NOTIFICATION,
            weight: 200 /* WorkbenchContrib */,
            when: exports.NotificationFocusedContext,
            primary: 10 /* Space */,
            secondary: [3 /* Enter */],
            handler: accessor => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService));
                if (notification) {
                    notification.toggle();
                }
            }
        });
        // Hide Toasts
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.HIDE_NOTIFICATION_TOAST,
            weight: 200 /* WorkbenchContrib */ + 50,
            when: exports.NotificationsToastsVisibleContext,
            primary: 9 /* Escape */,
            handler: accessor => toasts.hide()
        });
        // Focus Toasts
        commands_1.CommandsRegistry.registerCommand(exports.FOCUS_NOTIFICATION_TOAST, () => toasts.focus());
        // Focus Next Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.FOCUS_NEXT_NOTIFICATION_TOAST,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(exports.NotificationFocusedContext, exports.NotificationsToastsVisibleContext),
            primary: 18 /* DownArrow */,
            handler: (accessor) => {
                toasts.focusNext();
            }
        });
        // Focus Previous Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.FOCUS_PREVIOUS_NOTIFICATION_TOAST,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(exports.NotificationFocusedContext, exports.NotificationsToastsVisibleContext),
            primary: 16 /* UpArrow */,
            handler: (accessor) => {
                toasts.focusPrevious();
            }
        });
        // Focus First Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.FOCUS_FIRST_NOTIFICATION_TOAST,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(exports.NotificationFocusedContext, exports.NotificationsToastsVisibleContext),
            primary: 11 /* PageUp */,
            secondary: [14 /* Home */],
            handler: (accessor) => {
                toasts.focusFirst();
            }
        });
        // Focus Last Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.FOCUS_LAST_NOTIFICATION_TOAST,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(exports.NotificationFocusedContext, exports.NotificationsToastsVisibleContext),
            primary: 12 /* PageDown */,
            secondary: [13 /* End */],
            handler: (accessor) => {
                toasts.focusLast();
            }
        });
        /// Clear All Notifications
        commands_1.CommandsRegistry.registerCommand(exports.CLEAR_ALL_NOTIFICATIONS, () => center.clearAll());
        // Commands for Command Palette
        const category = { value: nls_1.localize('notifications', "Notifications"), original: 'Notifications' };
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.SHOW_NOTIFICATIONS_CENTER, title: { value: nls_1.localize('showNotifications', "Show Notifications"), original: 'Show Notifications' }, category }, when: exports.NotificationsCenterVisibleContext.toNegated() });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.HIDE_NOTIFICATIONS_CENTER, title: { value: nls_1.localize('hideNotifications', "Hide Notifications"), original: 'Hide Notifications' }, category }, when: exports.NotificationsCenterVisibleContext });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.CLEAR_ALL_NOTIFICATIONS, title: { value: nls_1.localize('clearAllNotifications', "Clear All Notifications"), original: 'Clear All Notifications' }, category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.FOCUS_NOTIFICATION_TOAST, title: { value: nls_1.localize('focusNotificationToasts', "Focus Notification Toast"), original: 'Focus Notification Toast' }, category }, when: exports.NotificationsToastsVisibleContext });
    }
    exports.registerNotificationCommands = registerNotificationCommands;
});
//# __sourceMappingURL=notificationsCommands.js.map