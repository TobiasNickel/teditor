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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/notifications/notificationsList", "vs/base/common/event", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/base/common/async", "vs/base/common/types", "vs/css!./media/notificationsToasts"], function (require, exports, lifecycle_1, dom_1, instantiation_1, notificationsList_1, event_1, layoutService_1, theme_1, themeService_1, colorRegistry_1, editorGroupsService_1, notificationsCommands_1, contextkey_1, notification_1, lifecycle_2, host_1, async_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsToasts = void 0;
    var ToastVisibility;
    (function (ToastVisibility) {
        ToastVisibility[ToastVisibility["HIDDEN_OR_VISIBLE"] = 0] = "HIDDEN_OR_VISIBLE";
        ToastVisibility[ToastVisibility["HIDDEN"] = 1] = "HIDDEN";
        ToastVisibility[ToastVisibility["VISIBLE"] = 2] = "VISIBLE";
    })(ToastVisibility || (ToastVisibility = {}));
    let NotificationsToasts = class NotificationsToasts extends themeService_1.Themable {
        constructor(container, model, instantiationService, layoutService, themeService, editorGroupService, contextKeyService, lifecycleService, hostService) {
            super(themeService);
            this.container = container;
            this.model = model;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.editorGroupService = editorGroupService;
            this.lifecycleService = lifecycleService;
            this.hostService = hostService;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._isVisible = false;
            this.mapNotificationToToast = new Map();
            this.notificationsToastsVisibleContextKey = notificationsCommands_1.NotificationsToastsVisibleContext.bindTo(contextKeyService);
            this.registerListeners();
        }
        get isVisible() { return !!this._isVisible; }
        registerListeners() {
            // Layout
            this._register(this.layoutService.onLayout(dimension => this.layout(dimension)));
            // Delay some tasks until after we can show notifications
            this.onCanShowNotifications().then(() => {
                // Show toast for initial notifications if any
                this.model.notifications.forEach(notification => this.addToast(notification));
                // Update toasts on notification changes
                this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
            });
            // Filter
            this._register(this.model.onDidChangeFilter(filter => {
                if (filter === notification_1.NotificationsFilter.SILENT || filter === notification_1.NotificationsFilter.ERROR) {
                    this.hide();
                }
            }));
        }
        async onCanShowNotifications() {
            // Wait for the running phase to ensure we can draw notifications properly
            await this.lifecycleService.when(2 /* Ready */);
            // Push notificiations out until either workbench is restored
            // or some time has ellapsed to reduce pressure on the startup
            return Promise.race([
                this.lifecycleService.when(3 /* Restored */),
                async_1.timeout(2000)
            ]);
        }
        onDidChangeNotification(e) {
            switch (e.kind) {
                case 0 /* ADD */:
                    return this.addToast(e.item);
                case 3 /* REMOVE */:
                    return this.removeToast(e.item);
            }
        }
        addToast(item) {
            if (this.isNotificationsCenterVisible) {
                return; // do not show toasts while notification center is visible
            }
            if (item.silent) {
                return; // do not show toasts for silenced notifications
            }
            // Lazily create toasts containers
            let notificationsToastsContainer = this.notificationsToastsContainer;
            if (!notificationsToastsContainer) {
                notificationsToastsContainer = this.notificationsToastsContainer = document.createElement('div');
                dom_1.addClass(notificationsToastsContainer, 'notifications-toasts');
                this.container.appendChild(notificationsToastsContainer);
            }
            // Make Visible
            dom_1.addClass(notificationsToastsContainer, 'visible');
            const itemDisposables = new lifecycle_1.DisposableStore();
            // Container
            const notificationToastContainer = document.createElement('div');
            dom_1.addClass(notificationToastContainer, 'notification-toast-container');
            const firstToast = notificationsToastsContainer.firstChild;
            if (firstToast) {
                notificationsToastsContainer.insertBefore(notificationToastContainer, firstToast); // always first
            }
            else {
                notificationsToastsContainer.appendChild(notificationToastContainer);
            }
            // Toast
            const notificationToast = document.createElement('div');
            dom_1.addClass(notificationToast, 'notification-toast');
            notificationToastContainer.appendChild(notificationToast);
            // Create toast with item and show
            const notificationList = this.instantiationService.createInstance(notificationsList_1.NotificationsList, notificationToast, {
                verticalScrollMode: 2 /* Hidden */
            });
            itemDisposables.add(notificationList);
            const toast = { item, list: notificationList, container: notificationToastContainer, toast: notificationToast, toDispose: itemDisposables };
            this.mapNotificationToToast.set(item, toast);
            // When disposed, remove as visible
            itemDisposables.add(lifecycle_1.toDisposable(() => this.updateToastVisibility(toast, false)));
            // Make visible
            notificationList.show();
            // Layout lists
            const maxDimensions = this.computeMaxDimensions();
            this.layoutLists(maxDimensions.width);
            // Show notification
            notificationList.updateNotificationsList(0, 0, [item]);
            // Layout container: only after we show the notification to ensure that
            // the height computation takes the content of it into account!
            this.layoutContainer(maxDimensions.height);
            // Re-draw entire item when expansion changes to reveal or hide details
            itemDisposables.add(item.onDidChangeExpansion(() => {
                notificationList.updateNotificationsList(0, 1, [item]);
            }));
            // Handle content changes
            // - actions: re-draw to properly show them
            // - message: update notification height unless collapsed
            itemDisposables.add(item.onDidChangeContent(e => {
                switch (e.kind) {
                    case 2 /* ACTIONS */:
                        notificationList.updateNotificationsList(0, 1, [item]);
                        break;
                    case 1 /* MESSAGE */:
                        if (item.expanded) {
                            notificationList.updateNotificationHeight(item);
                        }
                        break;
                }
            }));
            // Remove when item gets closed
            event_1.Event.once(item.onDidClose)(() => {
                this.removeToast(item);
            });
            // Automatically purge non-sticky notifications
            this.purgeNotification(item, notificationToastContainer, notificationList, itemDisposables);
            // Theming
            this.updateStyles();
            // Context Key
            this.notificationsToastsVisibleContextKey.set(true);
            // Animate in
            dom_1.addClass(notificationToast, 'notification-fade-in');
            itemDisposables.add(dom_1.addDisposableListener(notificationToast, 'transitionend', () => {
                dom_1.removeClass(notificationToast, 'notification-fade-in');
                dom_1.addClass(notificationToast, 'notification-fade-in-done');
            }));
            // Mark as visible
            item.updateVisibility(true);
            // Events
            if (!this._isVisible) {
                this._isVisible = true;
                this._onDidChangeVisibility.fire();
            }
        }
        purgeNotification(item, notificationToastContainer, notificationList, disposables) {
            // Track mouse over item
            let isMouseOverToast = false;
            disposables.add(dom_1.addDisposableListener(notificationToastContainer, dom_1.EventType.MOUSE_OVER, () => isMouseOverToast = true));
            disposables.add(dom_1.addDisposableListener(notificationToastContainer, dom_1.EventType.MOUSE_OUT, () => isMouseOverToast = false));
            // Install Timers to Purge Notification
            let purgeTimeoutHandle;
            let listener;
            const hideAfterTimeout = () => {
                purgeTimeoutHandle = setTimeout(() => {
                    // If the window does not have focus, we wait for the window to gain focus
                    // again before triggering the timeout again. This prevents an issue where
                    // focussing the window could immediately hide the notification because the
                    // timeout was triggered again.
                    if (!this.hostService.hasFocus) {
                        if (!listener) {
                            listener = this.hostService.onDidChangeFocus(focus => {
                                if (focus) {
                                    hideAfterTimeout();
                                }
                            });
                            disposables.add(listener);
                        }
                    }
                    // Otherwise...
                    else if (item.sticky || // never hide sticky notifications
                        notificationList.hasFocus() || // never hide notifications with focus
                        isMouseOverToast // never hide notifications under mouse
                    ) {
                        hideAfterTimeout();
                    }
                    else {
                        this.removeToast(item);
                    }
                }, NotificationsToasts.PURGE_TIMEOUT[item.severity]);
            };
            hideAfterTimeout();
            disposables.add(lifecycle_1.toDisposable(() => clearTimeout(purgeTimeoutHandle)));
        }
        removeToast(item) {
            let focusEditor = false;
            const notificationToast = this.mapNotificationToToast.get(item);
            if (notificationToast) {
                const toastHasDOMFocus = dom_1.isAncestor(document.activeElement, notificationToast.container);
                if (toastHasDOMFocus) {
                    focusEditor = !(this.focusNext() || this.focusPrevious()); // focus next if any, otherwise focus editor
                }
                // Listeners
                lifecycle_1.dispose(notificationToast.toDispose);
                // Remove from Map
                this.mapNotificationToToast.delete(item);
            }
            // Layout if we still have toasts
            if (this.mapNotificationToToast.size > 0) {
                this.layout(this.workbenchDimensions);
            }
            // Otherwise hide if no more toasts to show
            else {
                this.doHide();
                // Move focus back to editor group as needed
                if (focusEditor) {
                    this.editorGroupService.activeGroup.focus();
                }
            }
        }
        removeToasts() {
            this.mapNotificationToToast.forEach(toast => lifecycle_1.dispose(toast.toDispose));
            this.mapNotificationToToast.clear();
            this.doHide();
        }
        doHide() {
            if (this.notificationsToastsContainer) {
                dom_1.removeClass(this.notificationsToastsContainer, 'visible');
            }
            // Context Key
            this.notificationsToastsVisibleContextKey.set(false);
            // Events
            if (this._isVisible) {
                this._isVisible = false;
                this._onDidChangeVisibility.fire();
            }
        }
        hide() {
            const focusEditor = this.notificationsToastsContainer ? dom_1.isAncestor(document.activeElement, this.notificationsToastsContainer) : false;
            this.removeToasts();
            if (focusEditor) {
                this.editorGroupService.activeGroup.focus();
            }
        }
        focus() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[0].list.focusFirst();
                return true;
            }
            return false;
        }
        focusNext() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const nextToast = toasts[i + 1];
                    if (nextToast) {
                        nextToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusPrevious() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const previousToast = toasts[i - 1];
                    if (previousToast) {
                        previousToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusFirst() {
            const toast = this.getToasts(ToastVisibility.VISIBLE)[0];
            if (toast) {
                toast.list.focusFirst();
                return true;
            }
            return false;
        }
        focusLast() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[toasts.length - 1].list.focusFirst();
                return true;
            }
            return false;
        }
        update(isCenterVisible) {
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                // Hide all toasts when the notificationcenter gets visible
                if (this.isNotificationsCenterVisible) {
                    this.removeToasts();
                }
            }
        }
        updateStyles() {
            this.mapNotificationToToast.forEach(t => {
                const backgroundColor = this.getColor(theme_1.NOTIFICATIONS_BACKGROUND);
                t.toast.style.background = backgroundColor ? backgroundColor : '';
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                t.toast.style.boxShadow = widgetShadowColor ? `0 0px 8px ${widgetShadowColor}` : '';
                const borderColor = this.getColor(theme_1.NOTIFICATIONS_TOAST_BORDER);
                t.toast.style.border = borderColor ? `1px solid ${borderColor}` : '';
            });
        }
        getToasts(state) {
            const notificationToasts = [];
            this.mapNotificationToToast.forEach(toast => {
                switch (state) {
                    case ToastVisibility.HIDDEN_OR_VISIBLE:
                        notificationToasts.push(toast);
                        break;
                    case ToastVisibility.HIDDEN:
                        if (!this.isToastInDOM(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                    case ToastVisibility.VISIBLE:
                        if (this.isToastInDOM(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                }
            });
            return notificationToasts.reverse(); // from newest to oldest
        }
        layout(dimension) {
            this.workbenchDimensions = dimension;
            const maxDimensions = this.computeMaxDimensions();
            // Hide toasts that exceed height
            if (maxDimensions.height) {
                this.layoutContainer(maxDimensions.height);
            }
            // Layout all lists of toasts
            this.layoutLists(maxDimensions.width);
        }
        computeMaxDimensions() {
            let maxWidth = NotificationsToasts.MAX_WIDTH;
            let availableWidth = maxWidth;
            let availableHeight;
            if (this.workbenchDimensions) {
                // Make sure notifications are not exceding available width
                availableWidth = this.workbenchDimensions.width;
                availableWidth -= (2 * 8); // adjust for paddings left and right
                // Make sure notifications are not exceeding available height
                availableHeight = this.workbenchDimensions.height;
                if (this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */)) {
                    availableHeight -= 22; // adjust for status bar
                }
                if (this.layoutService.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                    availableHeight -= 22; // adjust for title bar
                }
                availableHeight -= (2 * 12); // adjust for paddings top and bottom
            }
            availableHeight = typeof availableHeight === 'number'
                ? Math.round(availableHeight * 0.618) // try to not cover the full height for stacked toasts
                : 0;
            return new dom_1.Dimension(Math.min(maxWidth, availableWidth), availableHeight);
        }
        layoutLists(width) {
            this.mapNotificationToToast.forEach(toast => toast.list.layout(width));
        }
        layoutContainer(heightToGive) {
            let visibleToasts = 0;
            this.getToasts(ToastVisibility.HIDDEN_OR_VISIBLE).forEach(toast => {
                // In order to measure the client height, the element cannot have display: none
                toast.container.style.opacity = '0';
                this.updateToastVisibility(toast, true);
                heightToGive -= toast.container.offsetHeight;
                let makeVisible = false;
                if (visibleToasts === NotificationsToasts.MAX_NOTIFICATIONS) {
                    makeVisible = false; // never show more than MAX_NOTIFICATIONS
                }
                else if (heightToGive >= 0) {
                    makeVisible = true; // hide toast if available height is too little
                }
                // Hide or show toast based on context
                this.updateToastVisibility(toast, makeVisible);
                toast.container.style.opacity = '';
                if (makeVisible) {
                    visibleToasts++;
                }
            });
        }
        updateToastVisibility(toast, visible) {
            if (this.isToastInDOM(toast) === visible) {
                return;
            }
            // Update visibility in DOM
            const notificationsToastsContainer = types_1.assertIsDefined(this.notificationsToastsContainer);
            if (visible) {
                notificationsToastsContainer.appendChild(toast.container);
            }
            else {
                notificationsToastsContainer.removeChild(toast.container);
            }
            // Update visibility in model
            toast.item.updateVisibility(visible);
        }
        isToastInDOM(toast) {
            return !!toast.container.parentElement;
        }
    };
    NotificationsToasts.MAX_WIDTH = 450;
    NotificationsToasts.MAX_NOTIFICATIONS = 3;
    NotificationsToasts.PURGE_TIMEOUT = (() => {
        const intervals = Object.create(null);
        intervals[notification_1.Severity.Info] = 15000;
        intervals[notification_1.Severity.Warning] = 18000;
        intervals[notification_1.Severity.Error] = 20000;
        return intervals;
    })();
    NotificationsToasts = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, lifecycle_2.ILifecycleService),
        __param(8, host_1.IHostService)
    ], NotificationsToasts);
    exports.NotificationsToasts = NotificationsToasts;
});
//# __sourceMappingURL=notificationsToasts.js.map