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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/uri", "vs/base/common/stopwatch", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/common/terminalDataBuffering", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableShared"], function (require, exports, lifecycle_1, terminal_1, extHost_protocol_1, extHostCustomers_1, uri_1, stopwatch_1, terminal_2, remoteAgentService_1, instantiation_1, terminalDataBuffering_1, environmentVariable_1, environmentVariableShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTerminalService = void 0;
    let MainThreadTerminalService = class MainThreadTerminalService {
        constructor(extHostContext, _terminalService, terminalInstanceService, _remoteAgentService, _instantiationService, _environmentVariableService) {
            this._terminalService = _terminalService;
            this.terminalInstanceService = terminalInstanceService;
            this._remoteAgentService = _remoteAgentService;
            this._instantiationService = _instantiationService;
            this._environmentVariableService = _environmentVariableService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._terminalProcessProxies = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTerminalService);
            this._remoteAuthority = extHostContext.remoteAuthority;
            // ITerminalService listeners
            this._toDispose.add(_terminalService.onInstanceCreated((instance) => {
                // Delay this message so the TerminalInstance constructor has a chance to finish and
                // return the ID normally to the extension host. The ID that is passed here will be
                // used to register non-extension API terminals in the extension host.
                setTimeout(() => {
                    this._onTerminalOpened(instance);
                    this._onInstanceDimensionsChanged(instance);
                }, terminal_1.EXT_HOST_CREATION_DELAY);
            }));
            this._toDispose.add(_terminalService.onInstanceDisposed(instance => this._onTerminalDisposed(instance)));
            this._toDispose.add(_terminalService.onInstanceProcessIdReady(instance => this._onTerminalProcessIdReady(instance)));
            this._toDispose.add(_terminalService.onInstanceDimensionsChanged(instance => this._onInstanceDimensionsChanged(instance)));
            this._toDispose.add(_terminalService.onInstanceMaximumDimensionsChanged(instance => this._onInstanceMaximumDimensionsChanged(instance)));
            this._toDispose.add(_terminalService.onInstanceRequestSpawnExtHostProcess(request => this._onRequestSpawnExtHostProcess(request)));
            this._toDispose.add(_terminalService.onInstanceRequestStartExtensionTerminal(e => this._onRequestStartExtensionTerminal(e)));
            this._toDispose.add(_terminalService.onActiveInstanceChanged(instance => this._onActiveTerminalChanged(instance ? instance.id : null)));
            this._toDispose.add(_terminalService.onInstanceTitleChanged(instance => this._onTitleChanged(instance.id, instance.title)));
            this._toDispose.add(_terminalService.configHelper.onWorkspacePermissionsChanged(isAllowed => this._onWorkspacePermissionsChanged(isAllowed)));
            this._toDispose.add(_terminalService.onRequestAvailableShells(e => this._onRequestAvailableShells(e)));
            // ITerminalInstanceService listeners
            if (terminalInstanceService.onRequestDefaultShellAndArgs) {
                this._toDispose.add(terminalInstanceService.onRequestDefaultShellAndArgs(e => this._onRequestDefaultShellAndArgs(e)));
            }
            // Set initial ext host state
            this._terminalService.terminalInstances.forEach(t => {
                this._onTerminalOpened(t);
                t.processReady.then(() => this._onTerminalProcessIdReady(t));
            });
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance) {
                this._proxy.$acceptActiveTerminalChanged(activeInstance.id);
            }
            if (this._environmentVariableService.collections.size > 0) {
                const collectionAsArray = [...this._environmentVariableService.collections.entries()];
                const serializedCollections = collectionAsArray.map(e => {
                    return [e[0], environmentVariableShared_1.serializeEnvironmentVariableCollection(e[1].map)];
                });
                this._proxy.$initEnvironmentVariableCollections(serializedCollections);
            }
            this._terminalService.extHostReady(extHostContext.remoteAuthority); // TODO@Tyriar: remove null assertion
        }
        dispose() {
            var _a, _b;
            this._toDispose.dispose();
            (_a = this._linkHandler) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._linkProvider) === null || _b === void 0 ? void 0 : _b.dispose();
            // TODO@Daniel: Should all the previously created terminals be disposed
            // when the extension host process goes down ?
        }
        $createTerminal(launchConfig) {
            const shellLaunchConfig = {
                name: launchConfig.name,
                executable: launchConfig.shellPath,
                args: launchConfig.shellArgs,
                cwd: typeof launchConfig.cwd === 'string' ? launchConfig.cwd : uri_1.URI.revive(launchConfig.cwd),
                waitOnExit: launchConfig.waitOnExit,
                ignoreConfigurationCwd: true,
                env: launchConfig.env,
                strictEnv: launchConfig.strictEnv,
                hideFromUser: launchConfig.hideFromUser,
                isExtensionTerminal: launchConfig.isExtensionTerminal
            };
            const terminal = this._terminalService.createTerminal(shellLaunchConfig);
            return Promise.resolve({
                id: terminal.id,
                name: terminal.title
            });
        }
        $show(terminalId, preserveFocus) {
            const terminalInstance = this._terminalService.getInstanceFromId(terminalId);
            if (terminalInstance) {
                this._terminalService.setActiveInstance(terminalInstance);
                this._terminalService.showPanel(!preserveFocus);
            }
        }
        $hide(terminalId) {
            const instance = this._terminalService.getActiveInstance();
            if (instance && instance.id === terminalId) {
                this._terminalService.hidePanel();
            }
        }
        $dispose(terminalId) {
            const terminalInstance = this._terminalService.getInstanceFromId(terminalId);
            if (terminalInstance) {
                terminalInstance.dispose();
            }
        }
        $sendText(terminalId, text, addNewLine) {
            const terminalInstance = this._terminalService.getInstanceFromId(terminalId);
            if (terminalInstance) {
                terminalInstance.sendText(text, addNewLine);
            }
        }
        $startSendingDataEvents() {
            if (!this._dataEventTracker) {
                this._dataEventTracker = this._instantiationService.createInstance(TerminalDataEventTracker, (id, data) => {
                    this._onTerminalData(id, data);
                });
            }
        }
        $stopSendingDataEvents() {
            if (this._dataEventTracker) {
                this._dataEventTracker.dispose();
                this._dataEventTracker = undefined;
            }
        }
        $startHandlingLinks() {
            var _a;
            (_a = this._linkHandler) === null || _a === void 0 ? void 0 : _a.dispose();
            this._linkHandler = this._terminalService.addLinkHandler(this._remoteAuthority || '', e => this._handleLink(e));
        }
        $stopHandlingLinks() {
            var _a;
            (_a = this._linkHandler) === null || _a === void 0 ? void 0 : _a.dispose();
            this._linkHandler = undefined;
        }
        $startLinkProvider() {
            var _a;
            (_a = this._linkProvider) === null || _a === void 0 ? void 0 : _a.dispose();
            this._linkProvider = this._terminalService.registerLinkProvider(new ExtensionTerminalLinkProvider(this._proxy));
        }
        $stopLinkProvider() {
            var _a;
            (_a = this._linkProvider) === null || _a === void 0 ? void 0 : _a.dispose();
            this._linkProvider = undefined;
        }
        async _handleLink(e) {
            if (!e.terminal) {
                return false;
            }
            return this._proxy.$handleLink(e.terminal.id, e.link);
        }
        _onActiveTerminalChanged(terminalId) {
            this._proxy.$acceptActiveTerminalChanged(terminalId);
        }
        _onTerminalData(terminalId, data) {
            this._proxy.$acceptTerminalProcessData(terminalId, data);
        }
        _onTitleChanged(terminalId, name) {
            this._proxy.$acceptTerminalTitleChange(terminalId, name);
        }
        _onWorkspacePermissionsChanged(isAllowed) {
            this._proxy.$acceptWorkspacePermissionsChanged(isAllowed);
        }
        _onTerminalDisposed(terminalInstance) {
            this._proxy.$acceptTerminalClosed(terminalInstance.id, terminalInstance.exitCode);
        }
        _onTerminalOpened(terminalInstance) {
            const shellLaunchConfigDto = {
                name: terminalInstance.shellLaunchConfig.name,
                executable: terminalInstance.shellLaunchConfig.executable,
                args: terminalInstance.shellLaunchConfig.args,
                cwd: terminalInstance.shellLaunchConfig.cwd,
                env: terminalInstance.shellLaunchConfig.env
            };
            if (terminalInstance.title) {
                this._proxy.$acceptTerminalOpened(terminalInstance.id, terminalInstance.title, shellLaunchConfigDto);
            }
            else {
                terminalInstance.waitForTitle().then(title => {
                    this._proxy.$acceptTerminalOpened(terminalInstance.id, title, shellLaunchConfigDto);
                });
            }
        }
        _onTerminalProcessIdReady(terminalInstance) {
            if (terminalInstance.processId === undefined) {
                return;
            }
            this._proxy.$acceptTerminalProcessId(terminalInstance.id, terminalInstance.processId);
        }
        _onInstanceDimensionsChanged(instance) {
            this._proxy.$acceptTerminalDimensions(instance.id, instance.cols, instance.rows);
        }
        _onInstanceMaximumDimensionsChanged(instance) {
            this._proxy.$acceptTerminalMaximumDimensions(instance.id, instance.maxCols, instance.maxRows);
        }
        _onRequestSpawnExtHostProcess(request) {
            // Only allow processes on remote ext hosts
            if (!this._remoteAuthority) {
                return;
            }
            const proxy = request.proxy;
            this._terminalProcessProxies.set(proxy.terminalId, proxy);
            const shellLaunchConfigDto = {
                name: request.shellLaunchConfig.name,
                executable: request.shellLaunchConfig.executable,
                args: request.shellLaunchConfig.args,
                cwd: request.shellLaunchConfig.cwd,
                env: request.shellLaunchConfig.env
            };
            this._proxy.$spawnExtHostProcess(proxy.terminalId, shellLaunchConfigDto, request.activeWorkspaceRootUri, request.cols, request.rows, request.isWorkspaceShellAllowed).then(request.callback);
            proxy.onInput(data => this._proxy.$acceptProcessInput(proxy.terminalId, data));
            proxy.onResize(dimensions => this._proxy.$acceptProcessResize(proxy.terminalId, dimensions.cols, dimensions.rows));
            proxy.onShutdown(immediate => this._proxy.$acceptProcessShutdown(proxy.terminalId, immediate));
            proxy.onRequestCwd(() => this._proxy.$acceptProcessRequestCwd(proxy.terminalId));
            proxy.onRequestInitialCwd(() => this._proxy.$acceptProcessRequestInitialCwd(proxy.terminalId));
            proxy.onRequestLatency(() => this._onRequestLatency(proxy.terminalId));
        }
        _onRequestStartExtensionTerminal(request) {
            const proxy = request.proxy;
            this._terminalProcessProxies.set(proxy.terminalId, proxy);
            // Note that onReisze is not being listened to here as it needs to fire when max dimensions
            // change, excluding the dimension override
            const initialDimensions = request.cols && request.rows ? {
                columns: request.cols,
                rows: request.rows
            } : undefined;
            this._proxy.$startExtensionTerminal(proxy.terminalId, initialDimensions).then(request.callback);
            proxy.onInput(data => this._proxy.$acceptProcessInput(proxy.terminalId, data));
            proxy.onShutdown(immediate => this._proxy.$acceptProcessShutdown(proxy.terminalId, immediate));
            proxy.onRequestCwd(() => this._proxy.$acceptProcessRequestCwd(proxy.terminalId));
            proxy.onRequestInitialCwd(() => this._proxy.$acceptProcessRequestInitialCwd(proxy.terminalId));
            proxy.onRequestLatency(() => this._onRequestLatency(proxy.terminalId));
        }
        $sendProcessTitle(terminalId, title) {
            this._getTerminalProcess(terminalId).emitTitle(title);
        }
        $sendProcessData(terminalId, data) {
            this._getTerminalProcess(terminalId).emitData(data);
        }
        $sendProcessReady(terminalId, pid, cwd) {
            this._getTerminalProcess(terminalId).emitReady(pid, cwd);
        }
        $sendProcessExit(terminalId, exitCode) {
            this._getTerminalProcess(terminalId).emitExit(exitCode);
            this._terminalProcessProxies.delete(terminalId);
        }
        $sendOverrideDimensions(terminalId, dimensions) {
            this._getTerminalProcess(terminalId).emitOverrideDimensions(dimensions);
        }
        $sendProcessInitialCwd(terminalId, initialCwd) {
            this._getTerminalProcess(terminalId).emitInitialCwd(initialCwd);
        }
        $sendProcessCwd(terminalId, cwd) {
            this._getTerminalProcess(terminalId).emitCwd(cwd);
        }
        $sendResolvedLaunchConfig(terminalId, shellLaunchConfig) {
            const instance = this._terminalService.getInstanceFromId(terminalId);
            if (instance) {
                this._getTerminalProcess(terminalId).emitResolvedShellLaunchConfig(shellLaunchConfig);
            }
        }
        async _onRequestLatency(terminalId) {
            const COUNT = 2;
            let sum = 0;
            for (let i = 0; i < COUNT; i++) {
                const sw = stopwatch_1.StopWatch.create(true);
                await this._proxy.$acceptProcessRequestLatency(terminalId);
                sw.stop();
                sum += sw.elapsed();
            }
            this._getTerminalProcess(terminalId).emitLatency(sum / COUNT);
        }
        _isPrimaryExtHost() {
            // The "primary" ext host is the remote ext host if there is one, otherwise the local
            const conn = this._remoteAgentService.getConnection();
            if (conn) {
                return this._remoteAuthority === conn.remoteAuthority;
            }
            return true;
        }
        async _onRequestAvailableShells(req) {
            if (this._isPrimaryExtHost()) {
                req.callback(await this._proxy.$getAvailableShells());
            }
        }
        async _onRequestDefaultShellAndArgs(req) {
            if (this._isPrimaryExtHost()) {
                const res = await this._proxy.$getDefaultShellAndArgs(req.useAutomationShell);
                req.callback(res.shell, res.args);
            }
        }
        _getTerminalProcess(terminalId) {
            const terminal = this._terminalProcessProxies.get(terminalId);
            if (!terminal) {
                throw new Error(`Unknown terminal: ${terminalId}`);
            }
            return terminal;
        }
        $setEnvironmentVariableCollection(extensionIdentifier, persistent, collection) {
            if (collection) {
                const translatedCollection = {
                    persistent,
                    map: environmentVariableShared_1.deserializeEnvironmentVariableCollection(collection)
                };
                this._environmentVariableService.set(extensionIdentifier, translatedCollection);
            }
            else {
                this._environmentVariableService.delete(extensionIdentifier);
            }
        }
    };
    MainThreadTerminalService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTerminalService),
        __param(1, terminal_2.ITerminalService),
        __param(2, terminal_2.ITerminalInstanceService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, environmentVariable_1.IEnvironmentVariableService)
    ], MainThreadTerminalService);
    exports.MainThreadTerminalService = MainThreadTerminalService;
    /**
     * Encapsulates temporary tracking of data events from terminal instances, once disposed all
     * listeners are removed.
     */
    let TerminalDataEventTracker = class TerminalDataEventTracker extends lifecycle_1.Disposable {
        constructor(_callback, _terminalService) {
            super();
            this._callback = _callback;
            this._terminalService = _terminalService;
            this._register(this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer(this._callback));
            this._terminalService.terminalInstances.forEach(instance => this._registerInstance(instance));
            this._register(this._terminalService.onInstanceCreated(instance => this._registerInstance(instance)));
            this._register(this._terminalService.onInstanceDisposed(instance => this._bufferer.stopBuffering(instance.id)));
        }
        _registerInstance(instance) {
            // Buffer data events to reduce the amount of messages going to the extension host
            this._register(this._bufferer.startBuffering(instance.id, instance.onData));
        }
    };
    TerminalDataEventTracker = __decorate([
        __param(1, terminal_2.ITerminalService)
    ], TerminalDataEventTracker);
    class ExtensionTerminalLinkProvider {
        constructor(_proxy) {
            this._proxy = _proxy;
        }
        async provideLinks(instance, line) {
            const proxy = this._proxy;
            const extHostLinks = await proxy.$provideLinks(instance.id, line);
            return extHostLinks.map(dto => ({
                id: dto.id,
                startIndex: dto.startIndex,
                length: dto.length,
                label: dto.label,
                activate: () => proxy.$activateLink(instance.id, dto.id)
            }));
        }
    }
});
//# __sourceMappingURL=mainThreadTerminalService.js.map