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
define(["require", "exports", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/common/notifications", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/base/common/actions", "vs/platform/storage/common/storage"], function (require, exports, nls, notification_1, notifications_1, lifecycle_1, event_1, extensions_1, actions_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationService = void 0;
    let NotificationService = class NotificationService extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this._model = this._register(new notifications_1.NotificationsModel());
        }
        get model() { return this._model; }
        setFilter(filter) {
            this._model.setFilter(filter);
        }
        info(message) {
            if (Array.isArray(message)) {
                message.forEach(m => this.info(m));
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            if (Array.isArray(message)) {
                message.forEach(m => this.warn(m));
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Warning, message });
        }
        error(message) {
            if (Array.isArray(message)) {
                message.forEach(m => this.error(m));
                return;
            }
            this.model.addNotification({ severity: notification_1.Severity.Error, message });
        }
        notify(notification) {
            var _a, _b;
            const toDispose = new lifecycle_1.DisposableStore();
            // Handle neverShowAgain option accordingly
            let handle;
            if (notification.neverShowAgain) {
                const scope = notification.neverShowAgain.scope === notification_1.NeverShowAgainScope.WORKSPACE ? 1 /* WORKSPACE */ : 0 /* GLOBAL */;
                const id = notification.neverShowAgain.id;
                // If the user already picked to not show the notification
                // again, we return with a no-op notification here
                if (this.storageService.getBoolean(id, scope)) {
                    return new notification_1.NoOpNotification();
                }
                const neverShowAgainAction = toDispose.add(new actions_1.Action('workbench.notification.neverShowAgain', nls.localize('neverShowAgain', "Don't Show Again"), undefined, true, () => {
                    // Close notification
                    handle.close();
                    // Remember choice
                    this.storageService.store(id, true, scope);
                    return Promise.resolve();
                }));
                // Insert as primary or secondary action
                const actions = {
                    primary: ((_a = notification.actions) === null || _a === void 0 ? void 0 : _a.primary) || [],
                    secondary: ((_b = notification.actions) === null || _b === void 0 ? void 0 : _b.secondary) || []
                };
                if (!notification.neverShowAgain.isSecondary) {
                    actions.primary = [neverShowAgainAction, ...actions.primary]; // action comes first
                }
                else {
                    actions.secondary = [...actions.secondary, neverShowAgainAction]; // actions comes last
                }
                notification.actions = actions;
            }
            // Show notification
            handle = this.model.addNotification(notification);
            // Cleanup when notification gets disposed
            event_1.Event.once(handle.onDidClose)(() => toDispose.dispose());
            return handle;
        }
        prompt(severity, message, choices, options) {
            const toDispose = new lifecycle_1.DisposableStore();
            // Handle neverShowAgain option accordingly
            if (options === null || options === void 0 ? void 0 : options.neverShowAgain) {
                const scope = options.neverShowAgain.scope === notification_1.NeverShowAgainScope.WORKSPACE ? 1 /* WORKSPACE */ : 0 /* GLOBAL */;
                const id = options.neverShowAgain.id;
                // If the user already picked to not show the notification
                // again, we return with a no-op notification here
                if (this.storageService.getBoolean(id, scope)) {
                    return new notification_1.NoOpNotification();
                }
                const neverShowAgainChoice = {
                    label: nls.localize('neverShowAgain', "Don't Show Again"),
                    run: () => this.storageService.store(id, true, scope),
                    isSecondary: options.neverShowAgain.isSecondary
                };
                // Insert as primary or secondary action
                if (!options.neverShowAgain.isSecondary) {
                    choices = [neverShowAgainChoice, ...choices]; // action comes first
                }
                else {
                    choices = [...choices, neverShowAgainChoice]; // actions comes last
                }
            }
            let choiceClicked = false;
            let handle;
            // Convert choices into primary/secondary actions
            const primaryActions = [];
            const secondaryActions = [];
            choices.forEach((choice, index) => {
                const action = new notifications_1.ChoiceAction(`workbench.dialog.choice.${index}`, choice);
                if (!choice.isSecondary) {
                    primaryActions.push(action);
                }
                else {
                    secondaryActions.push(action);
                }
                // React to action being clicked
                toDispose.add(action.onDidRun(() => {
                    choiceClicked = true;
                    // Close notification unless we are told to keep open
                    if (!choice.keepOpen) {
                        handle.close();
                    }
                }));
                toDispose.add(action);
            });
            // Show notification with actions
            const actions = { primary: primaryActions, secondary: secondaryActions };
            handle = this.notify({ severity, message, actions, sticky: options === null || options === void 0 ? void 0 : options.sticky, silent: options === null || options === void 0 ? void 0 : options.silent });
            event_1.Event.once(handle.onDidClose)(() => {
                // Cleanup when notification gets disposed
                toDispose.dispose();
                // Indicate cancellation to the outside if no action was executed
                if (options && typeof options.onCancel === 'function' && !choiceClicked) {
                    options.onCancel();
                }
            });
            return handle;
        }
        status(message, options) {
            return this.model.showStatusMessage(message, options);
        }
    };
    NotificationService = __decorate([
        __param(0, storage_1.IStorageService)
    ], NotificationService);
    exports.NotificationService = NotificationService;
    extensions_1.registerSingleton(notification_1.INotificationService, NotificationService, true);
});
//# __sourceMappingURL=notificationService.js.map