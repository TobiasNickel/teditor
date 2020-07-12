/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/browser/dom", "vs/base/common/async", "vs/base/browser/browser", "vs/base/common/performance", "vs/base/common/errors", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/notifications/notificationsCenter", "vs/workbench/browser/parts/notifications/notificationsAlerts", "vs/workbench/browser/parts/notifications/notificationsStatus", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/workbench/browser/parts/notifications/notificationsToasts", "vs/base/browser/ui/aria/aria", "vs/editor/browser/config/configuration", "vs/editor/common/config/fontInfo", "vs/platform/log/common/log", "vs/base/common/errorMessage", "vs/workbench/browser/contextkeys", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiationService", "vs/workbench/browser/layout", "vs/workbench/services/host/browser/host", "vs/workbench/browser/style"], function (require, exports, nls_1, event_1, dom_1, async_1, browser_1, performance_1, errors_1, platform_1, platform_2, contributions_1, editor_1, extensions_1, layoutService_1, storage_1, configuration_1, lifecycle_1, notification_1, notificationsCenter_1, notificationsAlerts_1, notificationsStatus_1, notificationsCommands_1, notificationsToasts_1, aria_1, configuration_2, fontInfo_1, log_1, errorMessage_1, contextkeys_1, arrays_1, instantiationService_1, layout_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Workbench = void 0;
    class Workbench extends layout_1.Layout {
        constructor(parent, serviceCollection, logService) {
            super(parent);
            this.serviceCollection = serviceCollection;
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this.onBeforeShutdown = this._onBeforeShutdown.event;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onShutdown = this._register(new event_1.Emitter());
            this.onShutdown = this._onShutdown.event;
            this.previousUnexpectedError = { message: undefined, time: 0 };
            this.registerErrorHandler(logService);
        }
        registerErrorHandler(logService) {
            // Listen on unhandled rejection events
            window.addEventListener('unhandledrejection', (event) => {
                // See https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent
                errors_1.onUnexpectedError(event.reason);
                // Prevent the printing of this event to the console
                event.preventDefault();
            });
            // Install handler for unexpected errors
            errors_1.setUnexpectedErrorHandler(error => this.handleUnexpectedError(error, logService));
            window.require.config({
                onError: (err) => {
                    if (err.phase === 'loading') {
                        errors_1.onUnexpectedError(new Error(nls_1.localize('loaderErrorNative', "Failed to load a required file. Please restart the application to try again. Details: {0}", JSON.stringify(err))));
                    }
                    console.error(err);
                }
            });
        }
        handleUnexpectedError(error, logService) {
            const message = errorMessage_1.toErrorMessage(error, true);
            if (!message) {
                return;
            }
            const now = Date.now();
            if (message === this.previousUnexpectedError.message && now - this.previousUnexpectedError.time <= 1000) {
                return; // Return if error message identical to previous and shorter than 1 second
            }
            this.previousUnexpectedError.time = now;
            this.previousUnexpectedError.message = message;
            // Log it
            logService.error(message);
        }
        startup() {
            try {
                // Configure emitter leak warning threshold
                event_1.setGlobalLeakWarningThreshold(175);
                // Services
                const instantiationService = this.initServices(this.serviceCollection);
                instantiationService.invokeFunction(async (accessor) => {
                    const lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    const hostService = accessor.get(host_1.IHostService);
                    // Layout
                    this.initLayout(accessor);
                    // Registries
                    platform_1.Registry.as(contributions_1.Extensions.Workbench).start(accessor);
                    platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).start(accessor);
                    // Context Keys
                    this._register(instantiationService.createInstance(contextkeys_1.WorkbenchContextKeysHandler));
                    // Register Listeners
                    this.registerListeners(lifecycleService, storageService, configurationService, hostService);
                    // Render Workbench
                    this.renderWorkbench(instantiationService, accessor.get(notification_1.INotificationService), storageService, configurationService);
                    // Workbench Layout
                    this.createWorkbenchLayout();
                    // Layout
                    this.layout();
                    // Restore
                    try {
                        await this.restoreWorkbench(accessor.get(log_1.ILogService), lifecycleService);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                    }
                });
                return instantiationService;
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
                throw error; // rethrow because this is a critical issue we cannot handle properly here
            }
        }
        initServices(serviceCollection) {
            // Layout Service
            serviceCollection.set(layoutService_1.IWorkbenchLayoutService, this);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // NOTE: DO NOT ADD ANY OTHER SERVICE INTO THE COLLECTION HERE.
            // CONTRIBUTE IT VIA WORKBENCH.DESKTOP.MAIN.TS AND registerSingleton().
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // All Contributed Services
            const contributedServices = extensions_1.getSingletonServiceDescriptors();
            for (let [id, descriptor] of contributedServices) {
                serviceCollection.set(id, descriptor);
            }
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            // Wrap up
            instantiationService.invokeFunction(accessor => {
                const lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
                // TODO@Sandeep debt around cyclic dependencies
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                if (typeof configurationService.acquireInstantiationService === 'function') {
                    setTimeout(() => {
                        configurationService.acquireInstantiationService(instantiationService);
                    }, 0);
                }
                // Signal to lifecycle that services are set
                lifecycleService.phase = 2 /* Ready */;
            });
            return instantiationService;
        }
        registerListeners(lifecycleService, storageService, configurationService, hostService) {
            // Configuration changes
            this._register(configurationService.onDidChangeConfiguration(() => this.setFontAliasing(configurationService)));
            // Font Info
            if (platform_2.isNative) {
                this._register(storageService.onWillSaveState(e => {
                    if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                        this.storeFontInfo(storageService);
                    }
                }));
            }
            else {
                this._register(lifecycleService.onWillShutdown(() => this.storeFontInfo(storageService)));
            }
            // Lifecycle
            this._register(lifecycleService.onBeforeShutdown(event => this._onBeforeShutdown.fire(event)));
            this._register(lifecycleService.onWillShutdown(event => this._onWillShutdown.fire(event)));
            this._register(lifecycleService.onShutdown(() => {
                this._onShutdown.fire();
                this.dispose();
            }));
            // In some environments we do not get enough time to persist state on shutdown.
            // In other cases, VSCode might crash, so we periodically save state to reduce
            // the chance of loosing any state.
            // The window loosing focus is a good indication that the user has stopped working
            // in that window so we pick that at a time to collect state.
            this._register(hostService.onDidChangeFocus(focus => { if (!focus) {
                storageService.flush();
            } }));
        }
        setFontAliasing(configurationService) {
            if (!platform_2.isMacintosh) {
                return; // macOS only
            }
            const aliasing = configurationService.getValue('workbench.fontAliasing');
            if (this.fontAliasing === aliasing) {
                return;
            }
            this.fontAliasing = aliasing;
            // Remove all
            const fontAliasingValues = ['antialiased', 'none', 'auto'];
            dom_1.removeClasses(this.container, ...fontAliasingValues.map(value => `monaco-font-aliasing-${value}`));
            // Add specific
            if (fontAliasingValues.some(option => option === aliasing)) {
                dom_1.addClass(this.container, `monaco-font-aliasing-${aliasing}`);
            }
        }
        restoreFontInfo(storageService, configurationService) {
            // Restore (native: use storage service, web: use browser specific local storage)
            const storedFontInfoRaw = platform_2.isNative ? storageService.get('editorFontInfo', 0 /* GLOBAL */) : window.localStorage.getItem('vscode.editorFontInfo');
            if (storedFontInfoRaw) {
                try {
                    const storedFontInfo = JSON.parse(storedFontInfoRaw);
                    if (Array.isArray(storedFontInfo)) {
                        configuration_2.restoreFontInfo(storedFontInfo);
                    }
                }
                catch (err) {
                    /* ignore */
                }
            }
            configuration_2.readFontInfo(fontInfo_1.BareFontInfo.createFromRawSettings(configurationService.getValue('editor'), browser_1.getZoomLevel()));
        }
        storeFontInfo(storageService) {
            const serializedFontInfo = configuration_2.serializeFontInfo();
            if (serializedFontInfo) {
                const serializedFontInfoRaw = JSON.stringify(serializedFontInfo);
                // Font info is very specific to the machine the workbench runs
                // on. As such, in the web, we prefer to store this info in
                // local storage and not global storage because it would not make
                // much sense to synchronize to other machines.
                if (platform_2.isNative) {
                    storageService.store('editorFontInfo', serializedFontInfoRaw, 0 /* GLOBAL */);
                }
                else {
                    window.localStorage.setItem('vscode.editorFontInfo', serializedFontInfoRaw);
                }
            }
        }
        renderWorkbench(instantiationService, notificationService, storageService, configurationService) {
            // ARIA
            aria_1.setARIAContainer(this.container);
            // State specific classes
            const platformClass = platform_2.isWindows ? 'windows' : platform_2.isLinux ? 'linux' : 'mac';
            const workbenchClasses = arrays_1.coalesce([
                'monaco-workbench',
                platformClass,
                platform_2.isWeb ? 'web' : undefined,
                browser_1.isChrome ? 'chromium' : browser_1.isFirefox ? 'firefox' : browser_1.isSafari ? 'safari' : undefined,
                ...this.getLayoutClasses()
            ]);
            dom_1.addClasses(this.container, ...workbenchClasses);
            dom_1.addClass(document.body, platformClass); // used by our fonts
            if (platform_2.isWeb) {
                dom_1.addClass(document.body, 'web');
            }
            // Apply font aliasing
            this.setFontAliasing(configurationService);
            // Warm up font cache information before building up too many dom elements
            this.restoreFontInfo(storageService, configurationService);
            // Create Parts
            [
                { id: "workbench.parts.titlebar" /* TITLEBAR_PART */, role: 'contentinfo', classes: ['titlebar'] },
                { id: "workbench.parts.activitybar" /* ACTIVITYBAR_PART */, role: 'navigation', classes: ['activitybar', this.state.sideBar.position === 0 /* LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.sidebar" /* SIDEBAR_PART */, role: 'complementary', classes: ['sidebar', this.state.sideBar.position === 0 /* LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.editor" /* EDITOR_PART */, role: 'main', classes: ['editor'], options: { restorePreviousState: this.state.editor.restoreEditors } },
                { id: "workbench.parts.panel" /* PANEL_PART */, role: 'complementary', classes: ['panel', layoutService_1.positionToString(this.state.panel.position)] },
                { id: "workbench.parts.statusbar" /* STATUSBAR_PART */, role: 'status', classes: ['statusbar'] }
            ].forEach(({ id, role, classes, options }) => {
                const partContainer = this.createPart(id, role, classes);
                this.getPart(id).create(partContainer, options);
            });
            // Notification Handlers
            this.createNotificationsHandlers(instantiationService, notificationService);
            // Add Workbench to DOM
            this.parent.appendChild(this.container);
        }
        createPart(id, role, classes) {
            const part = document.createElement(role === 'status' ? 'footer' : 'div'); // Use footer element for status bar #98376
            dom_1.addClasses(part, 'part', ...classes);
            part.id = id;
            part.setAttribute('role', role);
            if (role === 'status') {
                part.setAttribute('aria-live', 'off');
            }
            return part;
        }
        createNotificationsHandlers(instantiationService, notificationService) {
            // Instantiate Notification components
            const notificationsCenter = this._register(instantiationService.createInstance(notificationsCenter_1.NotificationsCenter, this.container, notificationService.model));
            const notificationsToasts = this._register(instantiationService.createInstance(notificationsToasts_1.NotificationsToasts, this.container, notificationService.model));
            this._register(instantiationService.createInstance(notificationsAlerts_1.NotificationsAlerts, notificationService.model));
            const notificationsStatus = instantiationService.createInstance(notificationsStatus_1.NotificationsStatus, notificationService.model);
            // Visibility
            this._register(notificationsCenter.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible);
                notificationsToasts.update(notificationsCenter.isVisible);
            }));
            this._register(notificationsToasts.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible);
            }));
            // Register Commands
            notificationsCommands_1.registerNotificationCommands(notificationsCenter, notificationsToasts);
        }
        async restoreWorkbench(logService, lifecycleService) {
            // Emit a warning after 10s if restore does not complete
            const restoreTimeoutHandle = setTimeout(() => logService.warn('Workbench did not finish loading in 10 seconds, that might be a problem that should be reported.'), 10000);
            try {
                await super.restoreWorkbenchLayout();
                clearTimeout(restoreTimeoutHandle);
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
            }
            finally {
                // Set lifecycle phase to `Restored`
                lifecycleService.phase = 3 /* Restored */;
                // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
                setTimeout(() => {
                    this._register(async_1.runWhenIdle(() => lifecycleService.phase = 4 /* Eventually */, 2500));
                }, 2500);
                // Telemetry: startup metrics
                performance_1.mark('didStartWorkbench');
            }
        }
    }
    exports.Workbench = Workbench;
});
//# __sourceMappingURL=workbench.js.map