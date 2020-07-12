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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/nls", "vs/base/browser/ui/button/button", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/dropdown/dropdown", "vs/workbench/common/notifications", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/notification/common/notification", "vs/base/common/arrays", "vs/base/common/codicons"], function (require, exports, dom_1, opener_1, uri_1, nls_1, button_1, styler_1, themeService_1, actionbar_1, instantiation_1, lifecycle_1, contextView_1, dropdown_1, notifications_1, notificationsActions_1, keybinding_1, progressbar_1, notification_1, arrays_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationTemplateRenderer = exports.NotificationRenderer = exports.NotificationsListDelegate = void 0;
    class NotificationsListDelegate {
        constructor(container) {
            this.offsetHelper = this.createOffsetHelper(container);
        }
        createOffsetHelper(container) {
            const offsetHelper = document.createElement('div');
            dom_1.addClass(offsetHelper, 'notification-offset-helper');
            container.appendChild(offsetHelper);
            return offsetHelper;
        }
        getHeight(notification) {
            if (!notification.expanded) {
                return NotificationsListDelegate.ROW_HEIGHT; // return early if there are no more rows to show
            }
            // First row: message and actions
            let expandedHeight = NotificationsListDelegate.ROW_HEIGHT;
            // Dynamic height: if message overflows
            const preferredMessageHeight = this.computePreferredHeight(notification);
            const messageOverflows = NotificationsListDelegate.LINE_HEIGHT < preferredMessageHeight;
            if (messageOverflows) {
                const overflow = preferredMessageHeight - NotificationsListDelegate.LINE_HEIGHT;
                expandedHeight += overflow;
            }
            // Last row: source and buttons if we have any
            if (notification.source || arrays_1.isNonEmptyArray(notification.actions && notification.actions.primary)) {
                expandedHeight += NotificationsListDelegate.ROW_HEIGHT;
            }
            // If the expanded height is same as collapsed, unset the expanded state
            // but skip events because there is no change that has visual impact
            if (expandedHeight === NotificationsListDelegate.ROW_HEIGHT) {
                notification.collapse(true /* skip events, no change in height */);
            }
            return expandedHeight;
        }
        computePreferredHeight(notification) {
            // Prepare offset helper depending on toolbar actions count
            let actions = 1; // close
            if (notification.canCollapse) {
                actions++; // expand/collapse
            }
            if (arrays_1.isNonEmptyArray(notification.actions && notification.actions.secondary)) {
                actions++; // secondary actions
            }
            this.offsetHelper.style.width = `${450 /* notifications container width */ - (10 /* padding */ + 26 /* severity icon */ + (actions * 24) /* 24px per action */)}px`;
            // Render message into offset helper
            const renderedMessage = NotificationMessageRenderer.render(notification.message);
            this.offsetHelper.appendChild(renderedMessage);
            // Compute height
            const preferredHeight = Math.max(this.offsetHelper.offsetHeight, this.offsetHelper.scrollHeight);
            // Always clear offset helper after use
            dom_1.clearNode(this.offsetHelper);
            return preferredHeight;
        }
        getTemplateId(element) {
            if (element instanceof notifications_1.NotificationViewItem) {
                return NotificationRenderer.TEMPLATE_ID;
            }
            throw new Error('unknown element type: ' + element);
        }
    }
    exports.NotificationsListDelegate = NotificationsListDelegate;
    NotificationsListDelegate.ROW_HEIGHT = 42;
    NotificationsListDelegate.LINE_HEIGHT = 22;
    class NotificationMessageRenderer {
        static render(message, actionHandler) {
            const messageContainer = document.createElement('span');
            for (const node of message.linkedText.nodes) {
                if (typeof node === 'string') {
                    messageContainer.appendChild(document.createTextNode(node));
                }
                else {
                    let title = node.title;
                    if (!title && node.href.startsWith('command:')) {
                        title = nls_1.localize('executeCommand', "Click to execute command '{0}'", node.href.substr('command:'.length));
                    }
                    else if (!title) {
                        title = node.href;
                    }
                    const anchor = dom_1.$('a', { href: node.href, title: title, }, node.label);
                    if (actionHandler) {
                        actionHandler.toDispose.add(dom_1.addDisposableListener(anchor, dom_1.EventType.CLICK, e => {
                            dom_1.EventHelper.stop(e, true);
                            actionHandler.callback(node.href);
                        }));
                    }
                    messageContainer.appendChild(anchor);
                }
            }
            return messageContainer;
        }
    }
    let NotificationRenderer = class NotificationRenderer {
        constructor(actionRunner, themeService, contextMenuService, instantiationService) {
            this.actionRunner = actionRunner;
            this.themeService = themeService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return NotificationRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = new lifecycle_1.DisposableStore();
            // Container
            data.container = document.createElement('div');
            dom_1.addClass(data.container, 'notification-list-item');
            // Main Row
            data.mainRow = document.createElement('div');
            dom_1.addClass(data.mainRow, 'notification-list-item-main-row');
            // Icon
            data.icon = document.createElement('div');
            dom_1.addClass(data.icon, 'notification-list-item-icon');
            dom_1.addClass(data.icon, 'codicon');
            // Message
            data.message = document.createElement('div');
            dom_1.addClass(data.message, 'notification-list-item-message');
            // Toolbar
            const toolbarContainer = document.createElement('div');
            dom_1.addClass(toolbarContainer, 'notification-list-item-toolbar-container');
            data.toolbar = new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: nls_1.localize('notificationActions', "Notification Actions"),
                actionViewItemProvider: action => {
                    if (action && action instanceof notificationsActions_1.ConfigureNotificationAction) {
                        const item = new dropdown_1.DropdownMenuActionViewItem(action, action.configurationActions, this.contextMenuService, undefined, this.actionRunner, undefined, action.class);
                        data.toDispose.add(item);
                        return item;
                    }
                    return undefined;
                },
                actionRunner: this.actionRunner
            });
            data.toDispose.add(data.toolbar);
            // Details Row
            data.detailsRow = document.createElement('div');
            dom_1.addClass(data.detailsRow, 'notification-list-item-details-row');
            // Source
            data.source = document.createElement('div');
            dom_1.addClass(data.source, 'notification-list-item-source');
            // Buttons Container
            data.buttonsContainer = document.createElement('div');
            dom_1.addClass(data.buttonsContainer, 'notification-list-item-buttons-container');
            container.appendChild(data.container);
            // the details row appears first in order for better keyboard access to notification buttons
            data.container.appendChild(data.detailsRow);
            data.detailsRow.appendChild(data.source);
            data.detailsRow.appendChild(data.buttonsContainer);
            // main row
            data.container.appendChild(data.mainRow);
            data.mainRow.appendChild(data.icon);
            data.mainRow.appendChild(data.message);
            data.mainRow.appendChild(toolbarContainer);
            // Progress: below the rows to span the entire width of the item
            data.progress = new progressbar_1.ProgressBar(container);
            data.toDispose.add(styler_1.attachProgressBarStyler(data.progress, this.themeService));
            data.toDispose.add(data.progress);
            // Renderer
            data.renderer = this.instantiationService.createInstance(NotificationTemplateRenderer, data, this.actionRunner);
            data.toDispose.add(data.renderer);
            return data;
        }
        renderElement(notification, index, data) {
            data.renderer.setInput(notification);
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    NotificationRenderer.TEMPLATE_ID = 'notification';
    NotificationRenderer = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, instantiation_1.IInstantiationService)
    ], NotificationRenderer);
    exports.NotificationRenderer = NotificationRenderer;
    let NotificationTemplateRenderer = class NotificationTemplateRenderer extends lifecycle_1.Disposable {
        constructor(template, actionRunner, openerService, instantiationService, themeService, keybindingService) {
            super();
            this.template = template;
            this.actionRunner = actionRunner;
            this.openerService = openerService;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.inputDisposables = this._register(new lifecycle_1.DisposableStore());
            if (!NotificationTemplateRenderer.closeNotificationAction) {
                NotificationTemplateRenderer.closeNotificationAction = instantiationService.createInstance(notificationsActions_1.ClearNotificationAction, notificationsActions_1.ClearNotificationAction.ID, notificationsActions_1.ClearNotificationAction.LABEL);
                NotificationTemplateRenderer.expandNotificationAction = instantiationService.createInstance(notificationsActions_1.ExpandNotificationAction, notificationsActions_1.ExpandNotificationAction.ID, notificationsActions_1.ExpandNotificationAction.LABEL);
                NotificationTemplateRenderer.collapseNotificationAction = instantiationService.createInstance(notificationsActions_1.CollapseNotificationAction, notificationsActions_1.CollapseNotificationAction.ID, notificationsActions_1.CollapseNotificationAction.LABEL);
            }
        }
        setInput(notification) {
            this.inputDisposables.clear();
            this.render(notification);
        }
        render(notification) {
            // Container
            dom_1.toggleClass(this.template.container, 'expanded', notification.expanded);
            this.inputDisposables.add(dom_1.addDisposableListener(this.template.container, dom_1.EventType.MOUSE_UP, e => {
                if (!notification.hasProgress && e.button === 1 /* Middle Button */) {
                    dom_1.EventHelper.stop(e);
                    notification.close();
                }
            }));
            // Severity Icon
            this.renderSeverity(notification);
            // Message
            const messageOverflows = this.renderMessage(notification);
            // Secondary Actions
            this.renderSecondaryActions(notification, messageOverflows);
            // Source
            this.renderSource(notification);
            // Buttons
            this.renderButtons(notification);
            // Progress
            this.renderProgress(notification);
            // Label Change Events that we can handle directly
            // (changes to actions require an entire redraw of
            // the notification because it has an impact on
            // epxansion state)
            this.inputDisposables.add(notification.onDidChangeContent(event => {
                switch (event.kind) {
                    case 0 /* SEVERITY */:
                        this.renderSeverity(notification);
                        break;
                    case 3 /* PROGRESS */:
                        this.renderProgress(notification);
                        break;
                    case 1 /* MESSAGE */:
                        this.renderMessage(notification);
                        break;
                }
            }));
        }
        renderSeverity(notification) {
            // first remove, then set as the codicon class names overlap
            NotificationTemplateRenderer.SEVERITIES.forEach(severity => {
                if (notification.severity !== severity) {
                    dom_1.removeClasses(this.template.icon, this.toSeverityIcon(severity).classNames);
                }
            });
            dom_1.addClasses(this.template.icon, this.toSeverityIcon(notification.severity).classNames);
        }
        renderMessage(notification) {
            dom_1.clearNode(this.template.message);
            this.template.message.appendChild(NotificationMessageRenderer.render(notification.message, {
                callback: link => this.openerService.open(uri_1.URI.parse(link)),
                toDispose: this.inputDisposables
            }));
            const messageOverflows = notification.canCollapse && !notification.expanded && this.template.message.scrollWidth > this.template.message.clientWidth;
            if (messageOverflows) {
                this.template.message.title = this.template.message.textContent + '';
            }
            else {
                this.template.message.removeAttribute('title');
            }
            const links = this.template.message.querySelectorAll('a');
            for (let i = 0; i < links.length; i++) {
                links.item(i).tabIndex = -1; // prevent keyboard navigation to links to allow for better keyboard support within a message
            }
            return messageOverflows;
        }
        renderSecondaryActions(notification, messageOverflows) {
            const actions = [];
            // Secondary Actions
            const secondaryActions = notification.actions ? notification.actions.secondary : undefined;
            if (arrays_1.isNonEmptyArray(secondaryActions)) {
                const configureNotificationAction = this.instantiationService.createInstance(notificationsActions_1.ConfigureNotificationAction, notificationsActions_1.ConfigureNotificationAction.ID, notificationsActions_1.ConfigureNotificationAction.LABEL, secondaryActions);
                actions.push(configureNotificationAction);
                this.inputDisposables.add(configureNotificationAction);
            }
            // Expand / Collapse
            let showExpandCollapseAction = false;
            if (notification.canCollapse) {
                if (notification.expanded) {
                    showExpandCollapseAction = true; // allow to collapse an expanded message
                }
                else if (notification.source) {
                    showExpandCollapseAction = true; // allow to expand to details row
                }
                else if (messageOverflows) {
                    showExpandCollapseAction = true; // allow to expand if message overflows
                }
            }
            if (showExpandCollapseAction) {
                actions.push(notification.expanded ? NotificationTemplateRenderer.collapseNotificationAction : NotificationTemplateRenderer.expandNotificationAction);
            }
            // Close (unless progress is showing)
            if (!notification.hasProgress) {
                actions.push(NotificationTemplateRenderer.closeNotificationAction);
            }
            this.template.toolbar.clear();
            this.template.toolbar.context = notification;
            actions.forEach(action => this.template.toolbar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) }));
        }
        renderSource(notification) {
            if (notification.expanded && notification.source) {
                this.template.source.textContent = nls_1.localize('notificationSource', "Source: {0}", notification.source);
                this.template.source.title = notification.source;
            }
            else {
                this.template.source.textContent = '';
                this.template.source.removeAttribute('title');
            }
        }
        renderButtons(notification) {
            dom_1.clearNode(this.template.buttonsContainer);
            const primaryActions = notification.actions ? notification.actions.primary : undefined;
            if (notification.expanded && arrays_1.isNonEmptyArray(primaryActions)) {
                const buttonGroup = new button_1.ButtonGroup(this.template.buttonsContainer, primaryActions.length, { title: true /* assign titles to buttons in case they overflow */ });
                buttonGroup.buttons.forEach((button, index) => {
                    const action = primaryActions[index];
                    button.label = action.label;
                    this.inputDisposables.add(button.onDidClick(e => {
                        dom_1.EventHelper.stop(e, true);
                        // Run action
                        this.actionRunner.run(action, notification);
                        // Hide notification (unless explicitly prevented)
                        if (!(action instanceof notifications_1.ChoiceAction) || !action.keepOpen) {
                            notification.close();
                        }
                    }));
                    this.inputDisposables.add(styler_1.attachButtonStyler(button, this.themeService));
                });
                this.inputDisposables.add(buttonGroup);
            }
        }
        renderProgress(notification) {
            // Return early if the item has no progress
            if (!notification.hasProgress) {
                this.template.progress.stop().hide();
                return;
            }
            // Infinite
            const state = notification.progress.state;
            if (state.infinite) {
                this.template.progress.infinite().show();
            }
            // Total / Worked
            else if (typeof state.total === 'number' || typeof state.worked === 'number') {
                if (typeof state.total === 'number' && !this.template.progress.hasTotal()) {
                    this.template.progress.total(state.total);
                }
                if (typeof state.worked === 'number') {
                    this.template.progress.setWorked(state.worked).show();
                }
            }
            // Done
            else {
                this.template.progress.done().hide();
            }
        }
        toSeverityIcon(severity) {
            switch (severity) {
                case notification_1.Severity.Warning:
                    return codicons_1.Codicon.warning;
                case notification_1.Severity.Error:
                    return codicons_1.Codicon.error;
            }
            return codicons_1.Codicon.info;
        }
        getKeybindingLabel(action) {
            const keybinding = this.keybindingService.lookupKeybinding(action.id);
            return keybinding ? keybinding.getLabel() : null;
        }
    };
    NotificationTemplateRenderer.SEVERITIES = [notification_1.Severity.Info, notification_1.Severity.Warning, notification_1.Severity.Error];
    NotificationTemplateRenderer = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, keybinding_1.IKeybindingService)
    ], NotificationTemplateRenderer);
    exports.NotificationTemplateRenderer = NotificationTemplateRenderer;
});
//# __sourceMappingURL=notificationsViewer.js.map