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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/statusbar/common/statusbar", "vs/base/common/async", "vs/workbench/services/activity/common/activity", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/base/browser/ui/dialog/dialog", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/base/browser/dom", "vs/workbench/services/panel/common/panelService", "vs/base/common/linkedText", "vs/workbench/common/views", "vs/css!./media/progressService"], function (require, exports, nls_1, lifecycle_1, progress_1, viewlet_1, statusbar_1, async_1, activity_1, notification_1, actions_1, event_1, extensions_1, layoutService_1, dialog_1, styler_1, themeService_1, keybinding_1, dom_1, panelService_1, linkedText_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressService = void 0;
    let ProgressService = class ProgressService extends lifecycle_1.Disposable {
        constructor(activityService, viewletService, viewDescriptorService, viewsService, panelService, notificationService, statusbarService, layoutService, themeService, keybindingService) {
            super();
            this.activityService = activityService;
            this.viewletService = viewletService;
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.panelService = panelService;
            this.notificationService = notificationService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.windowProgressStack = [];
            this.windowProgressStatusEntry = undefined;
        }
        async withProgress(options, task, onDidCancel) {
            const { location } = options;
            if (typeof location === 'string') {
                if (this.viewletService.getProgressIndicator(location)) {
                    return this.withViewletProgress(location, task, Object.assign(Object.assign({}, options), { location }));
                }
                if (this.panelService.getProgressIndicator(location)) {
                    return this.withPanelProgress(location, task, Object.assign(Object.assign({}, options), { location }));
                }
                if (this.viewsService.getViewProgressIndicator(location)) {
                    return this.withViewProgress(location, task, Object.assign(Object.assign({}, options), { location }));
                }
                throw new Error(`Bad progress location: ${location}`);
            }
            switch (location) {
                case 15 /* Notification */:
                    return this.withNotificationProgress(Object.assign(Object.assign({}, options), { location }), task, onDidCancel);
                case 10 /* Window */:
                    if (options.command) {
                        // Window progress with command get's shown in the status bar
                        return this.withWindowProgress(Object.assign(Object.assign({}, options), { location }), task);
                    }
                    // Window progress without command can be shown as silent notification
                    // which will first appear in the status bar and can then be brought to
                    // the front when clicking.
                    return this.withNotificationProgress(Object.assign(Object.assign({ delay: 150 /* default for ProgressLocation.Window */ }, options), { silent: true, location: 15 /* Notification */ }), task, onDidCancel);
                case 1 /* Explorer */:
                    return this.withViewletProgress('workbench.view.explorer', task, Object.assign(Object.assign({}, options), { location }));
                case 3 /* Scm */:
                    return this.withViewletProgress('workbench.view.scm', task, Object.assign(Object.assign({}, options), { location }));
                case 5 /* Extensions */:
                    return this.withViewletProgress('workbench.view.extensions', task, Object.assign(Object.assign({}, options), { location }));
                case 20 /* Dialog */:
                    return this.withDialogProgress(options, task, onDidCancel);
                default:
                    throw new Error(`Bad progress location: ${location}`);
            }
        }
        withWindowProgress(options, callback) {
            const task = [options, new progress_1.Progress(() => this.updateWindowProgress())];
            const promise = callback(task[1]);
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                this.windowProgressStack.unshift(task);
                this.updateWindowProgress();
                // show progress for at least 150ms
                Promise.all([
                    async_1.timeout(150),
                    promise
                ]).finally(() => {
                    const idx = this.windowProgressStack.indexOf(task);
                    this.windowProgressStack.splice(idx, 1);
                    this.updateWindowProgress();
                });
            }, 150);
            // cancel delay if promise finishes below 150ms
            return promise.finally(() => clearTimeout(delayHandle));
        }
        updateWindowProgress(idx = 0) {
            var _a;
            // We still have progress to show
            if (idx < this.windowProgressStack.length) {
                const [options, progress] = this.windowProgressStack[idx];
                let progressTitle = options.title;
                let progressMessage = progress.value && progress.value.message;
                let progressCommand = options.command;
                let text;
                let title;
                if (progressTitle && progressMessage) {
                    // <title>: <message>
                    text = nls_1.localize('progress.text2', "{0}: {1}", progressTitle, progressMessage);
                    title = options.source ? nls_1.localize('progress.title3', "[{0}] {1}: {2}", options.source, progressTitle, progressMessage) : text;
                }
                else if (progressTitle) {
                    // <title>
                    text = progressTitle;
                    title = options.source ? nls_1.localize('progress.title2', "[{0}]: {1}", options.source, progressTitle) : text;
                }
                else if (progressMessage) {
                    // <message>
                    text = progressMessage;
                    title = options.source ? nls_1.localize('progress.title2', "[{0}]: {1}", options.source, progressMessage) : text;
                }
                else {
                    // no title, no message -> no progress. try with next on stack
                    this.updateWindowProgress(idx + 1);
                    return;
                }
                const statusEntryProperties = {
                    text: `$(sync~spin) ${text}`,
                    ariaLabel: text,
                    tooltip: title,
                    command: progressCommand
                };
                if (this.windowProgressStatusEntry) {
                    this.windowProgressStatusEntry.update(statusEntryProperties);
                }
                else {
                    this.windowProgressStatusEntry = this.statusbarService.addEntry(statusEntryProperties, 'status.progress', nls_1.localize('status.progress', "Progress Message"), 0 /* LEFT */);
                }
            }
            // Progress is done so we remove the status entry
            else {
                (_a = this.windowProgressStatusEntry) === null || _a === void 0 ? void 0 : _a.dispose();
                this.windowProgressStatusEntry = undefined;
            }
        }
        withNotificationProgress(options, callback, onDidCancel) {
            const progressStateModel = new class extends lifecycle_1.Disposable {
                constructor() {
                    super();
                    this._onDidReport = this._register(new event_1.Emitter());
                    this.onDidReport = this._onDidReport.event;
                    this._onDispose = this._register(new event_1.Emitter());
                    this.onDispose = this._onDispose.event;
                    this._step = undefined;
                    this._done = false;
                    this.promise = callback(this);
                    this.promise.finally(() => {
                        this.dispose();
                    });
                }
                get step() { return this._step; }
                get done() { return this._done; }
                report(step) {
                    this._step = step;
                    this._onDidReport.fire(step);
                }
                cancel(choice) {
                    onDidCancel === null || onDidCancel === void 0 ? void 0 : onDidCancel(choice);
                    this.dispose();
                }
                dispose() {
                    this._done = true;
                    this._onDispose.fire();
                    super.dispose();
                }
            };
            const createWindowProgress = () => {
                // Create a promise that we can resolve as needed
                // when the outside calls dispose on us
                let promiseResolve;
                const promise = new Promise(resolve => promiseResolve = resolve);
                this.withWindowProgress({
                    location: 10 /* Window */,
                    title: options.title ? linkedText_1.parseLinkedText(options.title).toString() : undefined,
                    command: 'notifications.showList'
                }, progress => {
                    function reportProgress(step) {
                        if (step.message) {
                            progress.report({
                                message: linkedText_1.parseLinkedText(step.message).toString() // convert markdown links => string
                            });
                        }
                    }
                    // Apply any progress that was made already
                    if (progressStateModel.step) {
                        reportProgress(progressStateModel.step);
                    }
                    // Continue to report progress as it happens
                    const onDidReportListener = progressStateModel.onDidReport(step => reportProgress(step));
                    promise.finally(() => onDidReportListener.dispose());
                    // When the progress model gets disposed, we are done as well
                    event_1.Event.once(progressStateModel.onDispose)(() => promiseResolve());
                    return promise;
                });
                // Dispose means completing our promise
                return lifecycle_1.toDisposable(() => promiseResolve());
            };
            const createNotification = (message, silent, increment) => {
                const notificationDisposables = new lifecycle_1.DisposableStore();
                const primaryActions = options.primaryActions ? Array.from(options.primaryActions) : [];
                const secondaryActions = options.secondaryActions ? Array.from(options.secondaryActions) : [];
                if (options.buttons) {
                    options.buttons.forEach((button, index) => {
                        const buttonAction = new class extends actions_1.Action {
                            constructor() {
                                super(`progress.button.${button}`, button, undefined, true);
                            }
                            async run() {
                                progressStateModel.cancel(index);
                            }
                        };
                        notificationDisposables.add(buttonAction);
                        primaryActions.push(buttonAction);
                    });
                }
                if (options.cancellable) {
                    const cancelAction = new class extends actions_1.Action {
                        constructor() {
                            super('progress.cancel', nls_1.localize('cancel', "Cancel"), undefined, true);
                        }
                        async run() {
                            progressStateModel.cancel();
                        }
                    };
                    notificationDisposables.add(cancelAction);
                    primaryActions.push(cancelAction);
                }
                const notification = this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message,
                    source: options.source,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    progress: typeof increment === 'number' && increment >= 0 ? { total: 100, worked: increment } : { infinite: true },
                    silent
                });
                // Switch to window based progress once the notification
                // changes visibility to hidden and is still ongoing.
                // Remove that window based progress once the notification
                // shows again.
                let windowProgressDisposable = undefined;
                const onVisibilityChange = (visible) => {
                    // Clear any previous running window progress
                    lifecycle_1.dispose(windowProgressDisposable);
                    // Create new window progress if notification got hidden
                    if (!visible && !progressStateModel.done) {
                        windowProgressDisposable = createWindowProgress();
                    }
                };
                notificationDisposables.add(notification.onDidChangeVisibility(onVisibilityChange));
                if (silent) {
                    onVisibilityChange(false);
                }
                // Clear upon dispose
                event_1.Event.once(notification.onDidClose)(() => notificationDisposables.dispose());
                return notification;
            };
            const updateProgress = (notification, increment) => {
                if (typeof increment === 'number' && increment >= 0) {
                    notification.progress.total(100); // always percentage based
                    notification.progress.worked(increment);
                }
                else {
                    notification.progress.infinite();
                }
            };
            let notificationHandle;
            let notificationTimeout;
            let titleAndMessage; // hoisted to make sure a delayed notification shows the most recent message
            const updateNotification = (step) => {
                // full message (inital or update)
                if ((step === null || step === void 0 ? void 0 : step.message) && options.title) {
                    titleAndMessage = `${options.title}: ${step.message}`; // always prefix with overall title if we have it (https://github.com/Microsoft/vscode/issues/50932)
                }
                else {
                    titleAndMessage = options.title || (step === null || step === void 0 ? void 0 : step.message);
                }
                if (!notificationHandle && titleAndMessage) {
                    // create notification now or after a delay
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        if (typeof notificationTimeout !== 'number') {
                            notificationTimeout = setTimeout(() => notificationHandle = createNotification(titleAndMessage, !!options.silent, step === null || step === void 0 ? void 0 : step.increment), options.delay);
                        }
                    }
                    else {
                        notificationHandle = createNotification(titleAndMessage, !!options.silent, step === null || step === void 0 ? void 0 : step.increment);
                    }
                }
                if (notificationHandle) {
                    if (titleAndMessage) {
                        notificationHandle.updateMessage(titleAndMessage);
                    }
                    if (typeof (step === null || step === void 0 ? void 0 : step.increment) === 'number') {
                        updateProgress(notificationHandle, step.increment);
                    }
                }
            };
            // Show initially
            updateNotification(progressStateModel.step);
            const listener = progressStateModel.onDidReport(step => updateNotification(step));
            event_1.Event.once(progressStateModel.onDispose)(() => listener.dispose());
            // Clean up eventually
            (async () => {
                try {
                    // with a delay we only wait for the finish of the promise
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        await progressStateModel.promise;
                    }
                    // without a delay we show the notification for at least 800ms
                    // to reduce the chance of the notification flashing up and hiding
                    else {
                        await Promise.all([async_1.timeout(800), progressStateModel.promise]);
                    }
                }
                finally {
                    clearTimeout(notificationTimeout);
                    notificationHandle === null || notificationHandle === void 0 ? void 0 : notificationHandle.close();
                }
            })();
            return progressStateModel.promise;
        }
        withViewletProgress(viewletId, task, options) {
            // show in viewlet
            const promise = this.withCompositeProgress(this.viewletService.getProgressIndicator(viewletId), task, options);
            // show on activity bar
            this.showOnActivityBar(viewletId, options, promise);
            return promise;
        }
        withViewProgress(viewId, task, options) {
            var _a;
            // show in viewlet
            const promise = this.withCompositeProgress(this.viewsService.getViewProgressIndicator(viewId), task, options);
            const location = this.viewDescriptorService.getViewLocationById(viewId);
            if (location !== views_1.ViewContainerLocation.Sidebar) {
                return promise;
            }
            const viewletId = (_a = this.viewDescriptorService.getViewContainerByViewId(viewId)) === null || _a === void 0 ? void 0 : _a.id;
            if (viewletId === undefined) {
                return promise;
            }
            // show on activity bar
            this.showOnActivityBar(viewletId, options, promise);
            return promise;
        }
        showOnActivityBar(viewletId, options, promise) {
            let activityProgress;
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                const handle = this.activityService.showViewContainerActivity(viewletId, { badge: new activity_1.ProgressBadge(() => ''), clazz: 'progress-badge', priority: 100 });
                const startTimeVisible = Date.now();
                const minTimeVisible = 300;
                activityProgress = {
                    dispose() {
                        const d = Date.now() - startTimeVisible;
                        if (d < minTimeVisible) {
                            // should at least show for Nms
                            setTimeout(() => handle.dispose(), minTimeVisible - d);
                        }
                        else {
                            // shown long enough
                            handle.dispose();
                        }
                    }
                };
            }, options.delay || 300);
            promise.finally(() => {
                clearTimeout(delayHandle);
                lifecycle_1.dispose(activityProgress);
            });
        }
        withPanelProgress(panelid, task, options) {
            // show in panel
            return this.withCompositeProgress(this.panelService.getProgressIndicator(panelid), task, options);
        }
        withCompositeProgress(progressIndicator, task, options) {
            let progressRunner = undefined;
            const promise = task({
                report: progress => {
                    if (!progressRunner) {
                        return;
                    }
                    if (typeof progress.increment === 'number') {
                        progressRunner.worked(progress.increment);
                    }
                    if (typeof progress.total === 'number') {
                        progressRunner.total(progress.total);
                    }
                }
            });
            if (progressIndicator) {
                if (typeof options.total === 'number') {
                    progressRunner = progressIndicator.show(options.total, options.delay);
                    promise.catch(() => undefined /* ignore */).finally(() => progressRunner ? progressRunner.done() : undefined);
                }
                else {
                    progressIndicator.showWhile(promise, options.delay);
                }
            }
            return promise;
        }
        withDialogProgress(options, task, onDidCancel) {
            const disposables = new lifecycle_1.DisposableStore();
            const allowableCommands = [
                'workbench.action.quit',
                'workbench.action.reloadWindow',
                'copy',
                'cut'
            ];
            let dialog;
            const createDialog = (message) => {
                const buttons = options.buttons || [];
                buttons.push(options.cancellable ? nls_1.localize('cancel', "Cancel") : nls_1.localize('dismiss', "Dismiss"));
                dialog = new dialog_1.Dialog(this.layoutService.container, message, buttons, {
                    type: 'pending',
                    cancelId: buttons.length - 1,
                    keyEventProcessor: (event) => {
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.container);
                        if (resolved === null || resolved === void 0 ? void 0 : resolved.commandId) {
                            if (allowableCommands.indexOf(resolved.commandId) === -1) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    }
                });
                disposables.add(dialog);
                disposables.add(styler_1.attachDialogStyler(dialog, this.themeService));
                dialog.show().then((dialogResult) => {
                    if (typeof onDidCancel === 'function') {
                        onDidCancel(dialogResult.button);
                    }
                    lifecycle_1.dispose(dialog);
                });
                return dialog;
            };
            const updateDialog = (message) => {
                if (message && !dialog) {
                    dialog = createDialog(message);
                }
                else if (message) {
                    dialog.updateMessage(message);
                }
            };
            const promise = task({
                report: progress => {
                    updateDialog(progress.message);
                }
            });
            promise.finally(() => {
                lifecycle_1.dispose(disposables);
            });
            return promise;
        }
    };
    ProgressService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, viewlet_1.IViewletService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, views_1.IViewsService),
        __param(4, panelService_1.IPanelService),
        __param(5, notification_1.INotificationService),
        __param(6, statusbar_1.IStatusbarService),
        __param(7, layoutService_1.ILayoutService),
        __param(8, themeService_1.IThemeService),
        __param(9, keybinding_1.IKeybindingService)
    ], ProgressService);
    exports.ProgressService = ProgressService;
    extensions_1.registerSingleton(progress_1.IProgressService, ProgressService, true);
});
//# __sourceMappingURL=progressService.js.map