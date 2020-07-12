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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/list/browser/listService", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/notifications/notificationsViewer", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/contextview/browser/contextView", "vs/base/common/types", "vs/base/common/codicons", "vs/css!./media/notificationsList"], function (require, exports, nls_1, dom_1, listService_1, instantiation_1, theme_1, themeService_1, colorRegistry_1, notificationsViewer_1, notificationsActions_1, notificationsCommands_1, contextView_1, types_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsList = void 0;
    let NotificationsList = class NotificationsList extends themeService_1.Themable {
        constructor(container, options, instantiationService, themeService, contextMenuService) {
            super(themeService);
            this.container = container;
            this.options = options;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.viewModel = [];
        }
        show(focus) {
            if (this.isVisible) {
                if (focus) {
                    const list = types_1.assertIsDefined(this.list);
                    list.domFocus();
                }
                return; // already visible
            }
            // Lazily create if showing for the first time
            if (!this.list) {
                this.createNotificationsList();
            }
            // Make visible
            this.isVisible = true;
            // Focus
            if (focus) {
                const list = types_1.assertIsDefined(this.list);
                list.domFocus();
            }
        }
        createNotificationsList() {
            // List Container
            this.listContainer = document.createElement('div');
            dom_1.addClass(this.listContainer, 'notifications-list-container');
            const actionRunner = this._register(this.instantiationService.createInstance(notificationsActions_1.NotificationActionRunner));
            // Notification Renderer
            const renderer = this.instantiationService.createInstance(notificationsViewer_1.NotificationRenderer, actionRunner);
            // List
            const listDelegate = this.listDelegate = new notificationsViewer_1.NotificationsListDelegate(this.listContainer);
            const list = this.list = this._register(this.instantiationService.createInstance(listService_1.WorkbenchList, 'NotificationsList', this.listContainer, listDelegate, [renderer], Object.assign(Object.assign({}, this.options), { setRowLineHeight: false, horizontalScrolling: false, overrideStyles: {
                    listBackground: theme_1.NOTIFICATIONS_BACKGROUND
                }, accessibilityProvider: {
                    getAriaLabel(element) {
                        if (!element.source) {
                            return nls_1.localize('notificationAriaLabel', "{0}, notification", element.message.raw);
                        }
                        return nls_1.localize('notificationWithSourceAriaLabel', "{0}, source: {1}, notification", element.message.raw, element.source);
                    },
                    getWidgetAriaLabel() {
                        return nls_1.localize('notificationsList', "Notifications List");
                    },
                    getRole() {
                        return 'dialog'; // https://github.com/microsoft/vscode/issues/82728
                    }
                } })));
            // Context menu to copy message
            const copyAction = this._register(this.instantiationService.createInstance(notificationsActions_1.CopyNotificationMessageAction, notificationsActions_1.CopyNotificationMessageAction.ID, notificationsActions_1.CopyNotificationMessageAction.LABEL));
            this._register((list.onContextMenu(e => {
                if (!e.element) {
                    return;
                }
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => [copyAction],
                    getActionsContext: () => e.element,
                    actionRunner
                });
            })));
            // Toggle on double click
            this._register((list.onMouseDblClick(event => event.element.toggle())));
            // Clear focus when DOM focus moves out
            // Use document.hasFocus() to not clear the focus when the entire window lost focus
            // This ensures that when the focus comes back, the notification is still focused
            const listFocusTracker = this._register(dom_1.trackFocus(list.getHTMLElement()));
            this._register(listFocusTracker.onDidBlur(() => {
                if (document.hasFocus()) {
                    list.setFocus([]);
                }
            }));
            // Context key
            notificationsCommands_1.NotificationFocusedContext.bindTo(list.contextKeyService);
            // Only allow for focus in notifications, as the
            // selection is too strong over the contents of
            // the notification
            this._register(list.onDidChangeSelection(e => {
                if (e.indexes.length > 0) {
                    list.setSelection([]);
                }
            }));
            this.container.appendChild(this.listContainer);
            this.updateStyles();
        }
        updateNotificationsList(start, deleteCount, items = []) {
            const [list, listContainer] = types_1.assertAllDefined(this.list, this.listContainer);
            const listHasDOMFocus = dom_1.isAncestor(document.activeElement, listContainer);
            // Remember focus and relative top of that item
            const focusedIndex = list.getFocus()[0];
            const focusedItem = this.viewModel[focusedIndex];
            let focusRelativeTop = null;
            if (typeof focusedIndex === 'number') {
                focusRelativeTop = list.getRelativeTop(focusedIndex);
            }
            // Update view model
            this.viewModel.splice(start, deleteCount, ...items);
            // Update list
            list.splice(start, deleteCount, items);
            list.layout();
            // Hide if no more notifications to show
            if (this.viewModel.length === 0) {
                this.hide();
            }
            // Otherwise restore focus if we had
            else if (typeof focusedIndex === 'number') {
                let indexToFocus = 0;
                if (focusedItem) {
                    let indexToFocusCandidate = this.viewModel.indexOf(focusedItem);
                    if (indexToFocusCandidate === -1) {
                        indexToFocusCandidate = focusedIndex - 1; // item could have been removed
                    }
                    if (indexToFocusCandidate < this.viewModel.length && indexToFocusCandidate >= 0) {
                        indexToFocus = indexToFocusCandidate;
                    }
                }
                if (typeof focusRelativeTop === 'number') {
                    list.reveal(indexToFocus, focusRelativeTop);
                }
                list.setFocus([indexToFocus]);
            }
            // Restore DOM focus if we had focus before
            if (this.isVisible && listHasDOMFocus) {
                list.domFocus();
            }
        }
        updateNotificationHeight(item) {
            const index = this.viewModel.indexOf(item);
            if (index === -1) {
                return;
            }
            const [list, listDelegate] = types_1.assertAllDefined(this.list, this.listDelegate);
            list.updateElementHeight(index, listDelegate.getHeight(item));
            list.layout();
        }
        hide() {
            if (!this.isVisible || !this.list) {
                return; // already hidden
            }
            // Hide
            this.isVisible = false;
            // Clear list
            this.list.splice(0, this.viewModel.length);
            // Clear view model
            this.viewModel = [];
        }
        focusFirst() {
            if (!this.isVisible || !this.list) {
                return; // hidden
            }
            this.list.focusFirst();
            this.list.domFocus();
        }
        hasFocus() {
            if (!this.isVisible || !this.listContainer) {
                return false; // hidden
            }
            return dom_1.isAncestor(document.activeElement, this.listContainer);
        }
        updateStyles() {
            if (this.listContainer) {
                const foreground = this.getColor(theme_1.NOTIFICATIONS_FOREGROUND);
                this.listContainer.style.color = foreground ? foreground : '';
                const background = this.getColor(theme_1.NOTIFICATIONS_BACKGROUND);
                this.listContainer.style.background = background ? background : '';
                const outlineColor = this.getColor(colorRegistry_1.contrastBorder);
                this.listContainer.style.outlineColor = outlineColor ? outlineColor : '';
            }
        }
        layout(width, maxHeight) {
            if (this.listContainer && this.list) {
                this.listContainer.style.width = `${width}px`;
                if (typeof maxHeight === 'number') {
                    this.list.getHTMLElement().style.maxHeight = `${maxHeight}px`;
                }
                this.list.layout();
            }
        }
        dispose() {
            this.hide();
            super.dispose();
        }
    };
    NotificationsList = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, contextView_1.IContextMenuService)
    ], NotificationsList);
    exports.NotificationsList = NotificationsList;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const linkColor = theme.getColor(theme_1.NOTIFICATIONS_LINKS);
        if (linkColor) {
            collector.addRule(`.monaco-workbench .notifications-list-container .notification-list-item .notification-list-item-message a { color: ${linkColor}; }`);
        }
        const focusOutline = theme.getColor(colorRegistry_1.focusBorder);
        if (focusOutline) {
            collector.addRule(`
		.monaco-workbench .notifications-list-container .notification-list-item .notification-list-item-message a:focus {
			outline-color: ${focusOutline};
		}`);
        }
        // Notification Error Icon
        const notificationErrorIconForegroundColor = theme.getColor(theme_1.NOTIFICATIONS_ERROR_ICON_FOREGROUND);
        if (notificationErrorIconForegroundColor) {
            const errorCodiconSelector = codicons_1.Codicon.error.cssSelector;
            collector.addRule(`
		.monaco-workbench .notifications-center ${errorCodiconSelector},
		.monaco-workbench .notifications-toasts ${errorCodiconSelector} {
			color: ${notificationErrorIconForegroundColor};
		}`);
        }
        // Notification Warning Icon
        const notificationWarningIconForegroundColor = theme.getColor(theme_1.NOTIFICATIONS_WARNING_ICON_FOREGROUND);
        if (notificationWarningIconForegroundColor) {
            const warningCodiconSelector = codicons_1.Codicon.warning.cssSelector;
            collector.addRule(`
		.monaco-workbench .notifications-center ${warningCodiconSelector},
		.monaco-workbench .notifications-toasts ${warningCodiconSelector} {
			color: ${notificationWarningIconForegroundColor};
		}`);
        }
        // Notification Info Icon
        const notificationInfoIconForegroundColor = theme.getColor(theme_1.NOTIFICATIONS_INFO_ICON_FOREGROUND);
        if (notificationInfoIconForegroundColor) {
            const infoCodiconSelector = codicons_1.Codicon.info.cssSelector;
            collector.addRule(`
		.monaco-workbench .notifications-center ${infoCodiconSelector},
		.monaco-workbench .notifications-toasts ${infoCodiconSelector} {
			color: ${notificationInfoIconForegroundColor};
		}`);
        }
    });
});
//# __sourceMappingURL=notificationsList.js.map