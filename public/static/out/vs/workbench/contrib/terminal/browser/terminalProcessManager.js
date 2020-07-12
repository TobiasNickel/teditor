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
define(["require", "exports", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/base/common/process", "vs/platform/log/common/log", "vs/base/common/event", "vs/workbench/services/history/common/history", "vs/workbench/contrib/terminal/browser/terminalProcessExtHostProxy", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/base/common/network", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/productService", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/configuration/common/configuration", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/lifecycle", "vs/base/common/types", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/browser/environmentVariableInfo", "vs/workbench/services/path/common/pathService"], function (require, exports, platform, terminalEnvironment, process_1, log_1, event_1, history_1, terminalProcessExtHostProxy_1, instantiation_1, workspace_1, configurationResolver_1, network_1, remoteHosts_1, environmentService_1, productService_1, terminal_1, configuration_1, remoteAgentService_1, lifecycle_1, types_1, environmentVariable_1, environmentVariableInfo_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProcessManager = void 0;
    /** The amount of time to consider terminal errors to be related to the launch */
    const LAUNCHING_DURATION = 500;
    /**
     * The minimum amount of time between latency requests.
     */
    const LATENCY_MEASURING_INTERVAL = 1000;
    var ProcessType;
    (function (ProcessType) {
        ProcessType[ProcessType["Process"] = 0] = "Process";
        ProcessType[ProcessType["ExtensionTerminal"] = 1] = "ExtensionTerminal";
    })(ProcessType || (ProcessType = {}));
    /**
     * Holds all state related to the creation and management of terminal processes.
     *
     * Internal definitions:
     * - Process: The process launched with the terminalProcess.ts file, or the pty as a whole
     * - Pty Process: The pseudoterminal parent process (or the conpty/winpty agent process)
     * - Shell Process: The pseudoterminal child process (ie. the shell)
     */
    let TerminalProcessManager = class TerminalProcessManager extends lifecycle_1.Disposable {
        constructor(_terminalId, _configHelper, _historyService, _instantiationService, _logService, _workspaceContextService, _configurationResolverService, _workspaceConfigurationService, _environmentService, _productService, _terminalInstanceService, _remoteAgentService, _pathService, _environmentVariableService) {
            super();
            this._terminalId = _terminalId;
            this._configHelper = _configHelper;
            this._historyService = _historyService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._workspaceContextService = _workspaceContextService;
            this._configurationResolverService = _configurationResolverService;
            this._workspaceConfigurationService = _workspaceConfigurationService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._terminalInstanceService = _terminalInstanceService;
            this._remoteAgentService = _remoteAgentService;
            this._pathService = _pathService;
            this._environmentVariableService = _environmentVariableService;
            this.processState = 0 /* UNINITIALIZED */;
            this._process = null;
            this._processType = ProcessType.Process;
            this._preLaunchInputQueue = [];
            this._latency = -1;
            this._latencyLastMeasured = 0;
            this._onProcessReady = this._register(new event_1.Emitter());
            this._onBeforeProcessData = this._register(new event_1.Emitter());
            this._onProcessData = this._register(new event_1.Emitter());
            this._onProcessTitle = this._register(new event_1.Emitter());
            this._onProcessExit = this._register(new event_1.Emitter());
            this._onProcessOverrideDimensions = this._register(new event_1.Emitter());
            this._onProcessOverrideShellLaunchConfig = this._register(new event_1.Emitter());
            this._onEnvironmentVariableInfoChange = this._register(new event_1.Emitter());
            this.ptyProcessReady = new Promise(c => {
                this.onProcessReady(() => {
                    this._logService.debug(`Terminal process ready (shellProcessId: ${this.shellProcessId})`);
                    c(undefined);
                });
            });
            this.ptyProcessReady.then(async () => await this.getLatency());
        }
        get onProcessReady() { return this._onProcessReady.event; }
        get onBeforeProcessData() { return this._onBeforeProcessData.event; }
        get onProcessData() { return this._onProcessData.event; }
        get onProcessTitle() { return this._onProcessTitle.event; }
        get onProcessExit() { return this._onProcessExit.event; }
        get onProcessOverrideDimensions() { return this._onProcessOverrideDimensions.event; }
        get onProcessResolvedShellLaunchConfig() { return this._onProcessOverrideShellLaunchConfig.event; }
        get onEnvironmentVariableInfoChanged() { return this._onEnvironmentVariableInfoChange.event; }
        get environmentVariableInfo() { return this._environmentVariableInfo; }
        dispose(immediate = false) {
            if (this._process) {
                // If the process was still connected this dispose came from
                // within VS Code, not the process, so mark the process as
                // killed by the user.
                this.processState = 4 /* KILLED_BY_USER */;
                this._process.shutdown(immediate);
                this._process = null;
            }
            super.dispose();
        }
        async createProcess(shellLaunchConfig, cols, rows, isScreenReaderModeEnabled) {
            var _a;
            if (shellLaunchConfig.isExtensionTerminal) {
                this._processType = ProcessType.ExtensionTerminal;
                this._process = this._instantiationService.createInstance(terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy, this._terminalId, shellLaunchConfig, undefined, cols, rows, this._configHelper);
            }
            else {
                const forceExtHostProcess = this._configHelper.config.extHostProcess;
                if (shellLaunchConfig.cwd && typeof shellLaunchConfig.cwd === 'object') {
                    this.remoteAuthority = remoteHosts_1.getRemoteAuthority(shellLaunchConfig.cwd);
                }
                else {
                    this.remoteAuthority = this._environmentService.configuration.remoteAuthority;
                }
                const hasRemoteAuthority = !!this.remoteAuthority;
                let launchRemotely = hasRemoteAuthority || forceExtHostProcess;
                // resolvedUserHome is needed here as remote resolvers can launch local terminals before
                // they're connected to the remote.
                this.userHome = (_a = this._pathService.resolvedUserHome) === null || _a === void 0 ? void 0 : _a.fsPath;
                this.os = platform.OS;
                if (launchRemotely) {
                    const userHomeUri = await this._pathService.userHome;
                    this.userHome = userHomeUri.path;
                    if (hasRemoteAuthority) {
                        const remoteEnv = await this._remoteAgentService.getEnvironment();
                        if (remoteEnv) {
                            this.userHome = remoteEnv.userHome.path;
                            this.os = remoteEnv.os;
                        }
                    }
                    const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                    this._process = this._instantiationService.createInstance(terminalProcessExtHostProxy_1.TerminalProcessExtHostProxy, this._terminalId, shellLaunchConfig, activeWorkspaceRootUri, cols, rows, this._configHelper);
                }
                else {
                    this._process = await this._launchProcess(shellLaunchConfig, cols, rows, this.userHome, isScreenReaderModeEnabled);
                }
            }
            this.processState = 1 /* LAUNCHING */;
            this._process.onProcessData(data => {
                const beforeProcessDataEvent = { data };
                this._onBeforeProcessData.fire(beforeProcessDataEvent);
                if (beforeProcessDataEvent.data && beforeProcessDataEvent.data.length > 0) {
                    this._onProcessData.fire(beforeProcessDataEvent.data);
                }
            });
            this._process.onProcessReady((e) => {
                this.shellProcessId = e.pid;
                this._initialCwd = e.cwd;
                this._onProcessReady.fire();
                // Send any queued data that's waiting
                if (this._preLaunchInputQueue.length > 0 && this._process) {
                    this._process.input(this._preLaunchInputQueue.join(''));
                    this._preLaunchInputQueue.length = 0;
                }
            });
            this._process.onProcessTitleChanged(title => this._onProcessTitle.fire(title));
            this._process.onProcessExit(exitCode => this._onExit(exitCode));
            if (this._process.onProcessOverrideDimensions) {
                this._process.onProcessOverrideDimensions(e => this._onProcessOverrideDimensions.fire(e));
            }
            if (this._process.onProcessResolvedShellLaunchConfig) {
                this._process.onProcessResolvedShellLaunchConfig(e => this._onProcessOverrideShellLaunchConfig.fire(e));
            }
            setTimeout(() => {
                if (this.processState === 1 /* LAUNCHING */) {
                    this.processState = 2 /* RUNNING */;
                }
            }, LAUNCHING_DURATION);
            const error = await this._process.start();
            if (error) {
                return error;
            }
            return undefined;
        }
        async _launchProcess(shellLaunchConfig, cols, rows, userHome, isScreenReaderModeEnabled) {
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            const platformKey = platform.isWindows ? 'windows' : (platform.isMacintosh ? 'osx' : 'linux');
            const lastActiveWorkspace = activeWorkspaceRootUri ? types_1.withNullAsUndefined(this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            if (!shellLaunchConfig.executable) {
                const defaultConfig = await this._terminalInstanceService.getDefaultShellAndArgs(false);
                shellLaunchConfig.executable = defaultConfig.shell;
                shellLaunchConfig.args = defaultConfig.args;
            }
            else {
                shellLaunchConfig.executable = this._configurationResolverService.resolve(lastActiveWorkspace, shellLaunchConfig.executable);
                if (shellLaunchConfig.args) {
                    if (Array.isArray(shellLaunchConfig.args)) {
                        const resolvedArgs = [];
                        for (const arg of shellLaunchConfig.args) {
                            resolvedArgs.push(this._configurationResolverService.resolve(lastActiveWorkspace, arg));
                        }
                        shellLaunchConfig.args = resolvedArgs;
                    }
                    else {
                        shellLaunchConfig.args = this._configurationResolverService.resolve(lastActiveWorkspace, shellLaunchConfig.args);
                    }
                }
            }
            const initialCwd = terminalEnvironment.getCwd(shellLaunchConfig, userHome, lastActiveWorkspace, this._configurationResolverService, activeWorkspaceRootUri, this._configHelper.config.cwd, this._logService);
            const envFromConfigValue = this._workspaceConfigurationService.inspect(`terminal.integrated.env.${platformKey}`);
            const isWorkspaceShellAllowed = this._configHelper.checkWorkspaceShellPermissions();
            this._configHelper.showRecommendations(shellLaunchConfig);
            const baseEnv = this._configHelper.config.inheritEnv ? process_1.env : await this._terminalInstanceService.getMainProcessParentEnv();
            const env = terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, lastActiveWorkspace, envFromConfigValue, this._configurationResolverService, isWorkspaceShellAllowed, this._productService.version, this._configHelper.config.detectLocale, baseEnv);
            // Fetch any extension environment additions and apply them
            if (!shellLaunchConfig.strictEnv) {
                this._extEnvironmentVariableCollection = this._environmentVariableService.mergedCollection;
                this._register(this._environmentVariableService.onDidChangeCollections(newCollection => this._onEnvironmentVariableCollectionChange(newCollection)));
                this._extEnvironmentVariableCollection.applyToProcessEnvironment(env);
                if (this._extEnvironmentVariableCollection.map.size > 0) {
                    this._environmentVariableInfo = new environmentVariableInfo_1.EnvironmentVariableInfoChangesActive(this._extEnvironmentVariableCollection);
                    this._onEnvironmentVariableInfoChange.fire(this._environmentVariableInfo);
                }
            }
            const useConpty = this._configHelper.config.windowsEnableConpty && !isScreenReaderModeEnabled;
            return this._terminalInstanceService.createTerminalProcess(shellLaunchConfig, initialCwd, cols, rows, env, useConpty);
        }
        setDimensions(cols, rows) {
            if (!this._process) {
                return;
            }
            // The child process could already be terminated
            try {
                this._process.resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
        }
        write(data) {
            if (this.shellProcessId || this._processType === ProcessType.ExtensionTerminal) {
                if (this._process) {
                    // Send data if the pty is ready
                    this._process.input(data);
                }
            }
            else {
                // If the pty is not ready, queue the data received to send later
                this._preLaunchInputQueue.push(data);
            }
        }
        getInitialCwd() {
            return Promise.resolve(this._initialCwd ? this._initialCwd : '');
        }
        getCwd() {
            if (!this._process) {
                return Promise.resolve('');
            }
            return this._process.getCwd();
        }
        async getLatency() {
            await this.ptyProcessReady;
            if (!this._process) {
                return Promise.resolve(0);
            }
            if (this._latencyLastMeasured === 0 || this._latencyLastMeasured + LATENCY_MEASURING_INTERVAL < Date.now()) {
                const latencyRequest = this._process.getLatency();
                this._latency = await latencyRequest;
                this._latencyLastMeasured = Date.now();
            }
            return Promise.resolve(this._latency);
        }
        _onExit(exitCode) {
            this._process = null;
            // If the process is marked as launching then mark the process as killed
            // during launch. This typically means that there is a problem with the
            // shell and args.
            if (this.processState === 1 /* LAUNCHING */) {
                this.processState = 3 /* KILLED_DURING_LAUNCH */;
            }
            // If TerminalInstance did not know about the process exit then it was
            // triggered by the process, not on VS Code's side.
            if (this.processState === 2 /* RUNNING */) {
                this.processState = 5 /* KILLED_BY_PROCESS */;
            }
            this._onProcessExit.fire(exitCode);
        }
        _onEnvironmentVariableCollectionChange(newCollection) {
            const diff = this._extEnvironmentVariableCollection.diff(newCollection);
            if (diff === undefined) {
                return;
            }
            this._environmentVariableInfo = this._instantiationService.createInstance(environmentVariableInfo_1.EnvironmentVariableInfoStale, diff, this._terminalId);
            this._onEnvironmentVariableInfoChange.fire(this._environmentVariableInfo);
        }
    };
    TerminalProcessManager = __decorate([
        __param(2, history_1.IHistoryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, configurationResolver_1.IConfigurationResolverService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, productService_1.IProductService),
        __param(10, terminal_1.ITerminalInstanceService),
        __param(11, remoteAgentService_1.IRemoteAgentService),
        __param(12, pathService_1.IPathService),
        __param(13, environmentVariable_1.IEnvironmentVariableService)
    ], TerminalProcessManager);
    exports.TerminalProcessManager = TerminalProcessManager;
});
//# __sourceMappingURL=terminalProcessManager.js.map