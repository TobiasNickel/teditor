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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/severity", "vs/base/browser/ui/aria/aria", "vs/platform/contextkey/common/contextkey", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugViewModel", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/browser/debugConfigurationManager", "vs/workbench/contrib/files/common/files", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/layout/browser/layoutService", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/base/common/console", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/base/common/objects", "vs/workbench/contrib/debug/browser/debugSession", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/common/errorsWithActions", "vs/base/common/async", "vs/platform/debug/common/extensionHostDebug", "vs/editor/browser/editorBrowser", "vs/base/common/cancellation", "vs/workbench/contrib/debug/browser/debugTaskRunner", "vs/workbench/services/activity/common/activity", "vs/workbench/common/views", "vs/base/common/uuid", "vs/workbench/contrib/debug/common/debugStorage", "vs/workbench/contrib/debug/common/debugTelemetry", "vs/workbench/contrib/debug/common/debugCompoundRoot"], function (require, exports, nls, event_1, arrays_1, errors, severity_1, aria, contextkey_1, lifecycle_1, extensions_1, instantiation_1, files_1, debugModel_1, debugViewModel_1, debugactions, debugConfigurationManager_1, files_2, viewlet_1, layoutService_1, configuration_1, workspace_1, editorService_1, console_1, dialogs_1, notification_1, objects_1, debugSession_1, lifecycle_2, debug_1, debugUtils_1, errorsWithActions_1, async_1, extensionHostDebug_1, editorBrowser_1, cancellation_1, debugTaskRunner_1, activity_1, views_1, uuid_1, debugStorage_1, debugTelemetry_1, debugCompoundRoot_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getStackFrameThreadAndSessionToFocus = exports.DebugService = void 0;
    let DebugService = class DebugService {
        constructor(editorService, viewletService, viewsService, notificationService, dialogService, layoutService, contextService, contextKeyService, lifecycleService, instantiationService, extensionService, fileService, configurationService, extensionHostDebugService, activityService) {
            this.editorService = editorService;
            this.viewletService = viewletService;
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.layoutService = layoutService;
            this.contextService = contextService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.extensionHostDebugService = extensionHostDebugService;
            this.activityService = activityService;
            this.initializing = false;
            this.sessionCancellationTokens = new Map();
            this.toDispose = [];
            this.breakpointsToSendOnResourceSaved = new Set();
            this._onDidChangeState = new event_1.Emitter();
            this._onDidNewSession = new event_1.Emitter();
            this._onWillNewSession = new event_1.Emitter();
            this._onDidEndSession = new event_1.Emitter();
            this.configurationManager = this.instantiationService.createInstance(debugConfigurationManager_1.ConfigurationManager);
            this.toDispose.push(this.configurationManager);
            this.debugType = debug_1.CONTEXT_DEBUG_TYPE.bindTo(contextKeyService);
            this.debugState = debug_1.CONTEXT_DEBUG_STATE.bindTo(contextKeyService);
            this.inDebugMode = debug_1.CONTEXT_IN_DEBUG_MODE.bindTo(contextKeyService);
            this.debugUx = debug_1.CONTEXT_DEBUG_UX.bindTo(contextKeyService);
            this.debugUx.set(!!this.configurationManager.selectedConfiguration.name ? 'default' : 'simple');
            this.debugStorage = this.instantiationService.createInstance(debugStorage_1.DebugStorage);
            this.model = this.instantiationService.createInstance(debugModel_1.DebugModel, this.debugStorage);
            this.telemetry = this.instantiationService.createInstance(debugTelemetry_1.DebugTelemetry, this.model);
            const setBreakpointsExistContext = () => this.breakpointsExist.set(!!(this.model.getBreakpoints().length || this.model.getDataBreakpoints().length || this.model.getFunctionBreakpoints().length));
            this.breakpointsExist = debug_1.CONTEXT_BREAKPOINTS_EXIST.bindTo(contextKeyService);
            setBreakpointsExistContext();
            this.viewModel = new debugViewModel_1.ViewModel(contextKeyService);
            this.taskRunner = this.instantiationService.createInstance(debugTaskRunner_1.DebugTaskRunner);
            this.toDispose.push(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
            this.toDispose.push(this.lifecycleService.onShutdown(this.dispose, this));
            this.toDispose.push(this.extensionHostDebugService.onAttachSession(event => {
                const session = this.model.getSession(event.sessionId, true);
                if (session) {
                    // EH was started in debug mode -> attach to it
                    session.configuration.request = 'attach';
                    session.configuration.port = event.port;
                    session.setSubId(event.subId);
                    this.launchOrAttachToSession(session);
                }
            }));
            this.toDispose.push(this.extensionHostDebugService.onTerminateSession(event => {
                const session = this.model.getSession(event.sessionId);
                if (session && session.subId === event.subId) {
                    session.disconnect();
                }
            }));
            this.toDispose.push(this.extensionHostDebugService.onLogToSession(event => {
                const session = this.model.getSession(event.sessionId, true);
                if (session) {
                    // extension logged output -> show it in REPL
                    const sev = event.log.severity === 'warn' ? severity_1.default.Warning : event.log.severity === 'error' ? severity_1.default.Error : severity_1.default.Info;
                    const { args, stack } = console_1.parse(event.log);
                    const frame = !!stack ? console_1.getFirstFrame(stack) : undefined;
                    session.logToRepl(sev, args, frame);
                }
            }));
            this.toDispose.push(this.viewModel.onDidFocusStackFrame(() => {
                this.onStateChange();
            }));
            this.toDispose.push(this.viewModel.onDidFocusSession(() => {
                this.onStateChange();
            }));
            this.toDispose.push(this.configurationManager.onDidSelectConfiguration(() => {
                this.debugUx.set(!!(this.state !== 0 /* Inactive */ || this.configurationManager.selectedConfiguration.name) ? 'default' : 'simple');
            }));
            this.toDispose.push(this.model.onDidChangeCallStack(() => {
                const numberOfSessions = this.model.getSessions().filter(s => !s.parentSession).length;
                if (this.activity) {
                    this.activity.dispose();
                }
                if (numberOfSessions > 0) {
                    this.activity = this.activityService.showViewContainerActivity(debug_1.VIEWLET_ID, { badge: new activity_1.NumberBadge(numberOfSessions, n => n === 1 ? nls.localize('1activeSession', "1 active session") : nls.localize('nActiveSessions', "{0} active sessions", n)) });
                }
            }));
            this.toDispose.push(this.model.onDidChangeBreakpoints(() => setBreakpointsExistContext()));
        }
        getModel() {
            return this.model;
        }
        getViewModel() {
            return this.viewModel;
        }
        getConfigurationManager() {
            return this.configurationManager;
        }
        sourceIsNotAvailable(uri) {
            this.model.sourceIsNotAvailable(uri);
        }
        dispose() {
            this.toDispose = lifecycle_2.dispose(this.toDispose);
        }
        //---- state management
        get state() {
            const focusedSession = this.viewModel.focusedSession;
            if (focusedSession) {
                return focusedSession.state;
            }
            return this.initializing ? 1 /* Initializing */ : 0 /* Inactive */;
        }
        startInitializingState() {
            if (!this.initializing) {
                this.initializing = true;
                this.onStateChange();
            }
        }
        endInitializingState() {
            if (this.initializing) {
                this.initializing = false;
                this.onStateChange();
            }
        }
        cancelTokens(id) {
            if (id) {
                const token = this.sessionCancellationTokens.get(id);
                if (token) {
                    token.cancel();
                    this.sessionCancellationTokens.delete(id);
                }
            }
            else {
                this.sessionCancellationTokens.forEach(t => t.cancel());
                this.sessionCancellationTokens.clear();
            }
        }
        onStateChange() {
            const state = this.state;
            if (this.previousState !== state) {
                this.debugState.set(debug_1.getStateLabel(state));
                this.inDebugMode.set(state !== 0 /* Inactive */);
                // Only show the simple ux if debug is not yet started and if no launch.json exists
                this.debugUx.set(((state !== 0 /* Inactive */ && state !== 1 /* Initializing */) || this.configurationManager.selectedConfiguration.name) ? 'default' : 'simple');
                this.previousState = state;
                this._onDidChangeState.fire(state);
            }
        }
        get onDidChangeState() {
            return this._onDidChangeState.event;
        }
        get onDidNewSession() {
            return this._onDidNewSession.event;
        }
        get onWillNewSession() {
            return this._onWillNewSession.event;
        }
        get onDidEndSession() {
            return this._onDidEndSession.event;
        }
        //---- life cycle management
        /**
         * main entry point
         * properly manages compounds, checks for errors and handles the initializing state.
         */
        async startDebugging(launch, configOrName, options) {
            this.startInitializingState();
            try {
                // make sure to save all files and that the configuration is up to date
                await this.extensionService.activateByEvent('onDebug');
                await this.editorService.saveAll();
                await this.configurationService.reloadConfiguration(launch ? launch.workspace : undefined);
                await this.extensionService.whenInstalledExtensionsRegistered();
                let config;
                let compound;
                if (!configOrName) {
                    configOrName = this.configurationManager.selectedConfiguration.name;
                }
                if (typeof configOrName === 'string' && launch) {
                    config = launch.getConfiguration(configOrName);
                    compound = launch.getCompound(configOrName);
                    const sessions = this.model.getSessions();
                    const alreadyRunningMessage = nls.localize('configurationAlreadyRunning', "There is already a debug configuration \"{0}\" running.", configOrName);
                    if (sessions.some(s => s.configuration.name === configOrName && (!launch || !launch.workspace || !s.root || s.root.uri.toString() === launch.workspace.uri.toString()))) {
                        throw new Error(alreadyRunningMessage);
                    }
                    if (compound && compound.configurations && sessions.some(p => compound.configurations.indexOf(p.configuration.name) !== -1)) {
                        throw new Error(alreadyRunningMessage);
                    }
                }
                else if (typeof configOrName !== 'string') {
                    config = configOrName;
                }
                if (compound) {
                    // we are starting a compound debug, first do some error checking and than start each configuration in the compound
                    if (!compound.configurations) {
                        throw new Error(nls.localize({ key: 'compoundMustHaveConfigurations', comment: ['compound indicates a "compounds" configuration item', '"configurations" is an attribute and should not be localized'] }, "Compound must have \"configurations\" attribute set in order to start multiple configurations."));
                    }
                    if (compound.preLaunchTask) {
                        const taskResult = await this.taskRunner.runTaskAndCheckErrors((launch === null || launch === void 0 ? void 0 : launch.workspace) || this.contextService.getWorkspace(), compound.preLaunchTask, (msg, actions) => this.showError(msg, actions));
                        if (taskResult === 0 /* Failure */) {
                            this.endInitializingState();
                            return false;
                        }
                    }
                    if (compound.stopAll) {
                        options = Object.assign(Object.assign({}, options), { compoundRoot: new debugCompoundRoot_1.DebugCompoundRoot() });
                    }
                    const values = await Promise.all(compound.configurations.map(configData => {
                        const name = typeof configData === 'string' ? configData : configData.name;
                        if (name === compound.name) {
                            return Promise.resolve(false);
                        }
                        let launchForName;
                        if (typeof configData === 'string') {
                            const launchesContainingName = this.configurationManager.getLaunches().filter(l => !!l.getConfiguration(name));
                            if (launchesContainingName.length === 1) {
                                launchForName = launchesContainingName[0];
                            }
                            else if (launch && launchesContainingName.length > 1 && launchesContainingName.indexOf(launch) >= 0) {
                                // If there are multiple launches containing the configuration give priority to the configuration in the current launch
                                launchForName = launch;
                            }
                            else {
                                throw new Error(launchesContainingName.length === 0 ? nls.localize('noConfigurationNameInWorkspace', "Could not find launch configuration '{0}' in the workspace.", name)
                                    : nls.localize('multipleConfigurationNamesInWorkspace', "There are multiple launch configurations '{0}' in the workspace. Use folder name to qualify the configuration.", name));
                            }
                        }
                        else if (configData.folder) {
                            const launchesMatchingConfigData = this.configurationManager.getLaunches().filter(l => l.workspace && l.workspace.name === configData.folder && !!l.getConfiguration(configData.name));
                            if (launchesMatchingConfigData.length === 1) {
                                launchForName = launchesMatchingConfigData[0];
                            }
                            else {
                                throw new Error(nls.localize('noFolderWithName', "Can not find folder with name '{0}' for configuration '{1}' in compound '{2}'.", configData.folder, configData.name, compound.name));
                            }
                        }
                        return this.createSession(launchForName, launchForName.getConfiguration(name), options);
                    }));
                    const result = values.every(success => !!success); // Compound launch is a success only if each configuration launched successfully
                    this.endInitializingState();
                    return result;
                }
                if (configOrName && !config) {
                    const message = !!launch ? nls.localize('configMissing', "Configuration '{0}' is missing in 'launch.json'.", typeof configOrName === 'string' ? configOrName : JSON.stringify(configOrName)) :
                        nls.localize('launchJsonDoesNotExist', "'launch.json' does not exist.");
                    throw new Error(message);
                }
                const result = await this.createSession(launch, config, options);
                this.endInitializingState();
                return result;
            }
            catch (err) {
                // make sure to get out of initializing state, and propagate the result
                this.endInitializingState();
                return Promise.reject(err);
            }
        }
        /**
         * gets the debugger for the type, resolves configurations by providers, substitutes variables and runs prelaunch tasks
         */
        async createSession(launch, config, options) {
            // We keep the debug type in a separate variable 'type' so that a no-folder config has no attributes.
            // Storing the type in the config would break extensions that assume that the no-folder case is indicated by an empty config.
            let type;
            if (config) {
                type = config.type;
            }
            else {
                // a no-folder workspace has no launch.config
                config = Object.create(null);
            }
            if (options && options.noDebug) {
                config.noDebug = true;
            }
            else if (options && typeof options.noDebug === 'undefined' && options.parentSession && options.parentSession.configuration.noDebug) {
                config.noDebug = true;
            }
            const unresolvedConfig = objects_1.deepClone(config);
            if (!type) {
                const guess = await this.configurationManager.guessDebugger();
                if (guess) {
                    type = guess.type;
                }
            }
            const initCancellationToken = new cancellation_1.CancellationTokenSource();
            const sessionId = uuid_1.generateUuid();
            this.sessionCancellationTokens.set(sessionId, initCancellationToken);
            const configByProviders = await this.configurationManager.resolveConfigurationByProviders(launch && launch.workspace ? launch.workspace.uri : undefined, type, config, initCancellationToken.token);
            // a falsy config indicates an aborted launch
            if (configByProviders && configByProviders.type) {
                try {
                    let resolvedConfig = await this.substituteVariables(launch, configByProviders);
                    if (!resolvedConfig) {
                        // User cancelled resolving of interactive variables, silently return
                        return false;
                    }
                    if (initCancellationToken.token.isCancellationRequested) {
                        // User cancelled, silently return
                        return false;
                    }
                    const cfg = await this.configurationManager.resolveDebugConfigurationWithSubstitutedVariables(launch && launch.workspace ? launch.workspace.uri : undefined, type, resolvedConfig, initCancellationToken.token);
                    if (!cfg) {
                        if (launch && type && cfg === null && !initCancellationToken.token.isCancellationRequested) { // show launch.json only for "config" being "null".
                            await launch.openConfigFile(true, type, initCancellationToken.token);
                        }
                        return false;
                    }
                    resolvedConfig = cfg;
                    if (!this.configurationManager.getDebugger(resolvedConfig.type) || (configByProviders.request !== 'attach' && configByProviders.request !== 'launch')) {
                        let message;
                        if (configByProviders.request !== 'attach' && configByProviders.request !== 'launch') {
                            message = configByProviders.request ? nls.localize('debugRequestNotSupported', "Attribute '{0}' has an unsupported value '{1}' in the chosen debug configuration.", 'request', configByProviders.request)
                                : nls.localize('debugRequesMissing', "Attribute '{0}' is missing from the chosen debug configuration.", 'request');
                        }
                        else {
                            message = resolvedConfig.type ? nls.localize('debugTypeNotSupported', "Configured debug type '{0}' is not supported.", resolvedConfig.type) :
                                nls.localize('debugTypeMissing', "Missing property 'type' for the chosen launch configuration.");
                        }
                        await this.showError(message);
                        return false;
                    }
                    const workspace = (launch === null || launch === void 0 ? void 0 : launch.workspace) || this.contextService.getWorkspace();
                    const taskResult = await this.taskRunner.runTaskAndCheckErrors(workspace, resolvedConfig.preLaunchTask, (msg, actions) => this.showError(msg, actions));
                    if (taskResult === 1 /* Success */) {
                        return this.doCreateSession(sessionId, launch === null || launch === void 0 ? void 0 : launch.workspace, { resolved: resolvedConfig, unresolved: unresolvedConfig }, options);
                    }
                    return false;
                }
                catch (err) {
                    if (err && err.message) {
                        await this.showError(err.message);
                    }
                    else if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                        await this.showError(nls.localize('noFolderWorkspaceDebugError', "The active file can not be debugged. Make sure it is saved and that you have a debug extension installed for that file type."));
                    }
                    if (launch && !initCancellationToken.token.isCancellationRequested) {
                        await launch.openConfigFile(true, undefined, initCancellationToken.token);
                    }
                    return false;
                }
            }
            if (launch && type && configByProviders === null && !initCancellationToken.token.isCancellationRequested) { // show launch.json only for "config" being "null".
                await launch.openConfigFile(true, type, initCancellationToken.token);
            }
            return false;
        }
        /**
         * instantiates the new session, initializes the session, registers session listeners and reports telemetry
         */
        async doCreateSession(sessionId, root, configuration, options) {
            const session = this.instantiationService.createInstance(debugSession_1.DebugSession, sessionId, configuration, root, this.model, options);
            this.model.addSession(session);
            // register listeners as the very first thing!
            this.registerSessionListeners(session);
            // since the Session is now properly registered under its ID and hooked, we can announce it
            // this event doesn't go to extensions
            this._onWillNewSession.fire(session);
            const openDebug = this.configurationService.getValue('debug').openDebug;
            // Open debug viewlet based on the visibility of the side bar and openDebug setting. Do not open for 'run without debug'
            if (!configuration.resolved.noDebug && (openDebug === 'openOnSessionStart' || (openDebug === 'openOnFirstSessionStart' && this.viewModel.firstSessionStart))) {
                await this.viewletService.openViewlet(debug_1.VIEWLET_ID);
            }
            try {
                await this.launchOrAttachToSession(session);
                const internalConsoleOptions = session.configuration.internalConsoleOptions || this.configurationService.getValue('debug').internalConsoleOptions;
                if (internalConsoleOptions === 'openOnSessionStart' || (this.viewModel.firstSessionStart && internalConsoleOptions === 'openOnFirstSessionStart')) {
                    this.viewsService.openView(debug_1.REPL_VIEW_ID, false);
                }
                this.viewModel.firstSessionStart = false;
                const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
                const sessions = this.model.getSessions();
                const shownSessions = showSubSessions ? sessions : sessions.filter(s => !s.parentSession);
                if (shownSessions.length > 1) {
                    this.viewModel.setMultiSessionView(true);
                }
                // since the initialized response has arrived announce the new Session (including extensions)
                this._onDidNewSession.fire(session);
                return true;
            }
            catch (error) {
                if (errors.isPromiseCanceledError(error)) {
                    // don't show 'canceled' error messages to the user #7906
                    return false;
                }
                // Show the repl if some error got logged there #5870
                if (session && session.getReplElements().length > 0) {
                    this.viewsService.openView(debug_1.REPL_VIEW_ID, false);
                }
                if (session.configuration && session.configuration.request === 'attach' && session.configuration.__autoAttach) {
                    // ignore attach timeouts in auto attach mode
                    return false;
                }
                const errorMessage = error instanceof Error ? error.message : error;
                await this.showError(errorMessage, errorsWithActions_1.isErrorWithActions(error) ? error.actions : []);
                return false;
            }
        }
        async launchOrAttachToSession(session, forceFocus = false) {
            const dbgr = this.configurationManager.getDebugger(session.configuration.type);
            try {
                await session.initialize(dbgr);
                await session.launchOrAttach(session.configuration);
                const launchJsonExists = !!session.root && !!this.configurationService.getValue('launch', { resource: session.root.uri });
                await this.telemetry.logDebugSessionStart(dbgr, launchJsonExists);
                if (forceFocus || !this.viewModel.focusedSession || session.parentSession === this.viewModel.focusedSession) {
                    await this.focusStackFrame(undefined, undefined, session);
                }
            }
            catch (err) {
                if (this.viewModel.focusedSession === session) {
                    await this.focusStackFrame(undefined);
                }
                return Promise.reject(err);
            }
        }
        registerSessionListeners(session) {
            const sessionRunningScheduler = new async_1.RunOnceScheduler(() => {
                // Do not immediatly defocus the stack frame if the session is running
                if (session.state === 3 /* Running */ && this.viewModel.focusedSession === session) {
                    this.viewModel.setFocus(undefined, this.viewModel.focusedThread, session, false);
                }
            }, 200);
            this.toDispose.push(session.onDidChangeState(() => {
                if (session.state === 3 /* Running */ && this.viewModel.focusedSession === session) {
                    sessionRunningScheduler.schedule();
                }
                if (session === this.viewModel.focusedSession) {
                    this.onStateChange();
                }
            }));
            this.toDispose.push(session.onDidEndAdapter(async (adapterExitEvent) => {
                if (adapterExitEvent.error) {
                    this.notificationService.error(nls.localize('debugAdapterCrash', "Debug adapter process has terminated unexpectedly ({0})", adapterExitEvent.error.message || adapterExitEvent.error.toString()));
                }
                // 'Run without debugging' mode VSCode must terminate the extension host. More details: #3905
                const extensionDebugSession = debugUtils_1.getExtensionHostDebugSession(session);
                if (extensionDebugSession && extensionDebugSession.state === 3 /* Running */ && extensionDebugSession.configuration.noDebug) {
                    this.extensionHostDebugService.close(extensionDebugSession.getId());
                }
                this.telemetry.logDebugSessionStop(session, adapterExitEvent);
                if (session.configuration.postDebugTask) {
                    try {
                        await this.taskRunner.runTask(session.root, session.configuration.postDebugTask);
                    }
                    catch (err) {
                        this.notificationService.error(err);
                    }
                }
                this.endInitializingState();
                this.cancelTokens(session.getId());
                this._onDidEndSession.fire(session);
                const focusedSession = this.viewModel.focusedSession;
                if (focusedSession && focusedSession.getId() === session.getId()) {
                    const { session } = getStackFrameThreadAndSessionToFocus(this.model, undefined);
                    this.viewModel.setFocus(undefined, undefined, session, false);
                }
                if (this.model.getSessions().length === 0) {
                    this.viewModel.setMultiSessionView(false);
                    if (this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */) && this.configurationService.getValue('debug').openExplorerOnEnd) {
                        this.viewletService.openViewlet(files_2.VIEWLET_ID);
                    }
                    // Data breakpoints that can not be persisted should be cleared when a session ends
                    const dataBreakpoints = this.model.getDataBreakpoints().filter(dbp => !dbp.canPersist);
                    dataBreakpoints.forEach(dbp => this.model.removeDataBreakpoints(dbp.getId()));
                    if (this.viewsService.isViewVisible(debug_1.REPL_VIEW_ID) && this.configurationService.getValue('debug').console.closeOnEnd) {
                        this.viewsService.closeView(debug_1.REPL_VIEW_ID);
                    }
                }
            }));
        }
        async restartSession(session, restartData) {
            await this.editorService.saveAll();
            const isAutoRestart = !!restartData;
            const runTasks = async () => {
                if (isAutoRestart) {
                    // Do not run preLaunch and postDebug tasks for automatic restarts
                    return Promise.resolve(1 /* Success */);
                }
                const root = session.root || this.contextService.getWorkspace();
                await this.taskRunner.runTask(root, session.configuration.postDebugTask);
                return this.taskRunner.runTaskAndCheckErrors(root, session.configuration.preLaunchTask, (msg, actions) => this.showError(msg, actions));
            };
            const extensionDebugSession = debugUtils_1.getExtensionHostDebugSession(session);
            if (extensionDebugSession) {
                const taskResult = await runTasks();
                if (taskResult === 1 /* Success */) {
                    this.extensionHostDebugService.reload(extensionDebugSession.getId());
                }
                return;
            }
            if (session.capabilities.supportsRestartRequest) {
                const taskResult = await runTasks();
                if (taskResult === 1 /* Success */) {
                    await session.restart();
                }
                return;
            }
            const shouldFocus = !!this.viewModel.focusedSession && session.getId() === this.viewModel.focusedSession.getId();
            // If the restart is automatic  -> disconnect, otherwise -> terminate #55064
            if (isAutoRestart) {
                await session.disconnect(true);
            }
            else {
                await session.terminate(true);
            }
            return new Promise((c, e) => {
                setTimeout(async () => {
                    const taskResult = await runTasks();
                    if (taskResult !== 1 /* Success */) {
                        return;
                    }
                    // Read the configuration again if a launch.json has been changed, if not just use the inmemory configuration
                    let needsToSubstitute = false;
                    let unresolved;
                    const launch = session.root ? this.configurationManager.getLaunch(session.root.uri) : undefined;
                    if (launch) {
                        unresolved = launch.getConfiguration(session.configuration.name);
                        if (unresolved && !objects_1.equals(unresolved, session.unresolvedConfiguration)) {
                            // Take the type from the session since the debug extension might overwrite it #21316
                            unresolved.type = session.configuration.type;
                            unresolved.noDebug = session.configuration.noDebug;
                            needsToSubstitute = true;
                        }
                    }
                    let resolved = session.configuration;
                    if (launch && needsToSubstitute && unresolved) {
                        const initCancellationToken = new cancellation_1.CancellationTokenSource();
                        this.sessionCancellationTokens.set(session.getId(), initCancellationToken);
                        const resolvedByProviders = await this.configurationManager.resolveConfigurationByProviders(launch.workspace ? launch.workspace.uri : undefined, unresolved.type, unresolved, initCancellationToken.token);
                        if (resolvedByProviders) {
                            resolved = await this.substituteVariables(launch, resolvedByProviders);
                            if (resolved && !initCancellationToken.token.isCancellationRequested) {
                                resolved = await this.configurationManager.resolveDebugConfigurationWithSubstitutedVariables(launch && launch.workspace ? launch.workspace.uri : undefined, unresolved.type, resolved, initCancellationToken.token);
                            }
                        }
                        else {
                            resolved = resolvedByProviders;
                        }
                    }
                    if (!resolved) {
                        return c(undefined);
                    }
                    session.setConfiguration({ resolved, unresolved });
                    session.configuration.__restart = restartData;
                    try {
                        await this.launchOrAttachToSession(session, shouldFocus);
                        this._onDidNewSession.fire(session);
                        c(undefined);
                    }
                    catch (error) {
                        e(error);
                    }
                }, 300);
            });
        }
        stopSession(session) {
            if (session) {
                return session.terminate();
            }
            const sessions = this.model.getSessions();
            if (sessions.length === 0) {
                this.taskRunner.cancel();
                this.endInitializingState();
                this.cancelTokens(undefined);
            }
            return Promise.all(sessions.map(s => s.terminate()));
        }
        async substituteVariables(launch, config) {
            const dbg = this.configurationManager.getDebugger(config.type);
            if (dbg) {
                let folder = undefined;
                if (launch && launch.workspace) {
                    folder = launch.workspace;
                }
                else {
                    const folders = this.contextService.getWorkspace().folders;
                    if (folders.length === 1) {
                        folder = folders[0];
                    }
                }
                try {
                    return await dbg.substituteVariables(folder, config);
                }
                catch (err) {
                    this.showError(err.message);
                    return undefined; // bail out
                }
            }
            return Promise.resolve(config);
        }
        async showError(message, errorActions = []) {
            const configureAction = this.instantiationService.createInstance(debugactions.ConfigureAction, debugactions.ConfigureAction.ID, debugactions.ConfigureAction.LABEL);
            const actions = [...errorActions, configureAction];
            const { choice } = await this.dialogService.show(severity_1.default.Error, message, actions.map(a => a.label).concat(nls.localize('cancel', "Cancel")), { cancelId: actions.length });
            if (choice < actions.length) {
                return actions[choice].run();
            }
            return undefined;
        }
        //---- focus management
        async focusStackFrame(_stackFrame, _thread, _session, explicit) {
            const { stackFrame, thread, session } = getStackFrameThreadAndSessionToFocus(this.model, _stackFrame, _thread, _session);
            if (stackFrame) {
                const editor = await stackFrame.openInEditor(this.editorService, true);
                if (editor) {
                    const control = editor.getControl();
                    if (stackFrame && editorBrowser_1.isCodeEditor(control) && control.hasModel()) {
                        const model = control.getModel();
                        const lineNumber = stackFrame.range.startLineNumber;
                        if (lineNumber >= 1 && lineNumber <= model.getLineCount()) {
                            const lineContent = control.getModel().getLineContent(lineNumber);
                            aria.alert(nls.localize('debuggingPaused', "Debugging paused {0}, {1} {2} {3}", thread && thread.stoppedDetails ? `, reason ${thread.stoppedDetails.reason}` : '', stackFrame.source ? stackFrame.source.name : '', stackFrame.range.startLineNumber, lineContent));
                        }
                    }
                }
            }
            if (session) {
                this.debugType.set(session.configuration.type);
            }
            else {
                this.debugType.reset();
            }
            this.viewModel.setFocus(stackFrame, thread, session, !!explicit);
        }
        //---- watches
        addWatchExpression(name) {
            const we = this.model.addWatchExpression(name);
            if (!name) {
                this.viewModel.setSelectedExpression(we);
            }
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        renameWatchExpression(id, newName) {
            this.model.renameWatchExpression(id, newName);
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        moveWatchExpression(id, position) {
            this.model.moveWatchExpression(id, position);
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        removeWatchExpressions(id) {
            this.model.removeWatchExpressions(id);
            this.debugStorage.storeWatchExpressions(this.model.getWatchExpressions());
        }
        //---- breakpoints
        async enableOrDisableBreakpoints(enable, breakpoint) {
            if (breakpoint) {
                this.model.setEnablement(breakpoint, enable);
                if (breakpoint instanceof debugModel_1.Breakpoint) {
                    await this.sendBreakpoints(breakpoint.uri);
                }
                else if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
                    await this.sendFunctionBreakpoints();
                }
                else if (breakpoint instanceof debugModel_1.DataBreakpoint) {
                    await this.sendDataBreakpoints();
                }
                else {
                    await this.sendExceptionBreakpoints();
                }
            }
            else {
                this.model.enableOrDisableAllBreakpoints(enable);
                await this.sendAllBreakpoints();
            }
            this.debugStorage.storeBreakpoints(this.model);
        }
        async addBreakpoints(uri, rawBreakpoints, context) {
            const breakpoints = this.model.addBreakpoints(uri, rawBreakpoints);
            breakpoints.forEach(bp => aria.status(nls.localize('breakpointAdded', "Added breakpoint, line {0}, file {1}", bp.lineNumber, uri.fsPath)));
            breakpoints.forEach(bp => this.telemetry.logDebugAddBreakpoint(bp, context));
            await this.sendBreakpoints(uri);
            this.debugStorage.storeBreakpoints(this.model);
            return breakpoints;
        }
        async updateBreakpoints(uri, data, sendOnResourceSaved) {
            this.model.updateBreakpoints(data);
            if (sendOnResourceSaved) {
                this.breakpointsToSendOnResourceSaved.add(uri.toString());
            }
            else {
                await this.sendBreakpoints(uri);
            }
            this.debugStorage.storeBreakpoints(this.model);
        }
        async removeBreakpoints(id) {
            const toRemove = this.model.getBreakpoints().filter(bp => !id || bp.getId() === id);
            toRemove.forEach(bp => aria.status(nls.localize('breakpointRemoved', "Removed breakpoint, line {0}, file {1}", bp.lineNumber, bp.uri.fsPath)));
            const urisToClear = arrays_1.distinct(toRemove, bp => bp.uri.toString()).map(bp => bp.uri);
            this.model.removeBreakpoints(toRemove);
            await Promise.all(urisToClear.map(uri => this.sendBreakpoints(uri)));
            this.debugStorage.storeBreakpoints(this.model);
        }
        setBreakpointsActivated(activated) {
            this.model.setBreakpointsActivated(activated);
            return this.sendAllBreakpoints();
        }
        addFunctionBreakpoint(name, id) {
            const newFunctionBreakpoint = this.model.addFunctionBreakpoint(name || '', id);
            this.viewModel.setSelectedFunctionBreakpoint(newFunctionBreakpoint);
        }
        async renameFunctionBreakpoint(id, newFunctionName) {
            this.model.renameFunctionBreakpoint(id, newFunctionName);
            await this.sendFunctionBreakpoints();
            this.debugStorage.storeBreakpoints(this.model);
        }
        async removeFunctionBreakpoints(id) {
            this.model.removeFunctionBreakpoints(id);
            await this.sendFunctionBreakpoints();
            this.debugStorage.storeBreakpoints(this.model);
        }
        async addDataBreakpoint(label, dataId, canPersist, accessTypes) {
            this.model.addDataBreakpoint(label, dataId, canPersist, accessTypes);
            await this.sendDataBreakpoints();
            this.debugStorage.storeBreakpoints(this.model);
        }
        async removeDataBreakpoints(id) {
            this.model.removeDataBreakpoints(id);
            await this.sendDataBreakpoints();
            this.debugStorage.storeBreakpoints(this.model);
        }
        async sendAllBreakpoints(session) {
            await Promise.all(arrays_1.distinct(this.model.getBreakpoints(), bp => bp.uri.toString()).map(bp => this.sendBreakpoints(bp.uri, false, session)));
            await this.sendFunctionBreakpoints(session);
            await this.sendDataBreakpoints(session);
            // send exception breakpoints at the end since some debug adapters rely on the order
            await this.sendExceptionBreakpoints(session);
        }
        async sendBreakpoints(modelUri, sourceModified = false, session) {
            const breakpointsToSend = this.model.getBreakpoints({ uri: modelUri, enabledOnly: true });
            await sendToOneOrAllSessions(this.model, session, s => s.sendBreakpoints(modelUri, breakpointsToSend, sourceModified));
        }
        async sendFunctionBreakpoints(session) {
            const breakpointsToSend = this.model.getFunctionBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            await sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsFunctionBreakpoints) {
                    await s.sendFunctionBreakpoints(breakpointsToSend);
                }
            });
        }
        sendDataBreakpoints(session) {
            const breakpointsToSend = this.model.getDataBreakpoints().filter(fbp => fbp.enabled && this.model.areBreakpointsActivated());
            return sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsDataBreakpoints) {
                    await s.sendDataBreakpoints(breakpointsToSend);
                }
            });
        }
        sendExceptionBreakpoints(session) {
            const enabledExceptionBps = this.model.getExceptionBreakpoints().filter(exb => exb.enabled);
            return sendToOneOrAllSessions(this.model, session, async (s) => {
                if (s.capabilities.supportsConfigurationDoneRequest && (!s.capabilities.exceptionBreakpointFilters || s.capabilities.exceptionBreakpointFilters.length === 0)) {
                    // Only call `setExceptionBreakpoints` as specified in dap protocol #90001
                    return;
                }
                await s.sendExceptionBreakpoints(enabledExceptionBps);
            });
        }
        onFileChanges(fileChangesEvent) {
            const toRemove = this.model.getBreakpoints().filter(bp => fileChangesEvent.contains(bp.uri, 2 /* DELETED */));
            if (toRemove.length) {
                this.model.removeBreakpoints(toRemove);
            }
            fileChangesEvent.getUpdated().forEach(event => {
                if (this.breakpointsToSendOnResourceSaved.delete(event.resource.toString())) {
                    this.sendBreakpoints(event.resource, true);
                }
            });
        }
    };
    DebugService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, viewlet_1.IViewletService),
        __param(2, views_1.IViewsService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, lifecycle_1.ILifecycleService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, extensions_1.IExtensionService),
        __param(11, files_1.IFileService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, extensionHostDebug_1.IExtensionHostDebugService),
        __param(14, activity_1.IActivityService)
    ], DebugService);
    exports.DebugService = DebugService;
    function getStackFrameThreadAndSessionToFocus(model, stackFrame, thread, session) {
        if (!session) {
            if (stackFrame || thread) {
                session = stackFrame ? stackFrame.thread.session : thread.session;
            }
            else {
                const sessions = model.getSessions();
                const stoppedSession = sessions.find(s => s.state === 2 /* Stopped */);
                session = stoppedSession || (sessions.length ? sessions[0] : undefined);
            }
        }
        if (!thread) {
            if (stackFrame) {
                thread = stackFrame.thread;
            }
            else {
                const threads = session ? session.getAllThreads() : undefined;
                const stoppedThread = threads && threads.find(t => t.stopped);
                thread = stoppedThread || (threads && threads.length ? threads[0] : undefined);
            }
        }
        if (!stackFrame) {
            if (thread) {
                const callStack = thread.getCallStack();
                stackFrame = arrays_1.first(callStack, sf => !!(sf && sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize'), undefined);
            }
        }
        return { session, thread, stackFrame };
    }
    exports.getStackFrameThreadAndSessionToFocus = getStackFrameThreadAndSessionToFocus;
    async function sendToOneOrAllSessions(model, session, send) {
        if (session) {
            await send(session);
        }
        else {
            await Promise.all(model.getSessions().map(s => send(s)));
        }
    }
});
//# __sourceMappingURL=debugService.js.map