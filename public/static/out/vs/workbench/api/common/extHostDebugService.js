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
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/async", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/debug/common/abstractDebugAdapter", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/services/configurationResolver/common/variableResolver", "../common/extHostConfiguration", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/common/cancellation", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostRpcService", "vs/platform/instantiation/common/instantiation", "vs/base/common/types"], function (require, exports, path, uri_1, event_1, async_1, extHost_protocol_1, extHostTypes_1, abstractDebugAdapter_1, extHostWorkspace_1, extHostExtensionService_1, extHostDocumentsAndEditors_1, variableResolver_1, extHostConfiguration_1, debugUtils_1, cancellation_1, extHostCommands_1, extHostRpcService_1, instantiation_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerExtHostDebugService = exports.ExtHostVariableResolverService = exports.ExtHostDebugConsole = exports.ExtHostDebugSession = exports.ExtHostDebugServiceBase = exports.IExtHostDebugService = void 0;
    exports.IExtHostDebugService = instantiation_1.createDecorator('IExtHostDebugService');
    let ExtHostDebugServiceBase = class ExtHostDebugServiceBase {
        constructor(extHostRpcService, _workspaceService, _extensionService, _editorsService, _configurationService, _commandService) {
            this._workspaceService = _workspaceService;
            this._extensionService = _extensionService;
            this._editorsService = _editorsService;
            this._configurationService = _configurationService;
            this._commandService = _commandService;
            this._debugSessions = new Map();
            this._configProviderHandleCounter = 0;
            this._configProviders = [];
            this._adapterFactoryHandleCounter = 0;
            this._adapterFactories = [];
            this._trackerFactoryHandleCounter = 0;
            this._trackerFactories = [];
            this._aexCommands = new Map();
            this._debugAdapters = new Map();
            this._debugAdaptersTrackers = new Map();
            this._onDidStartDebugSession = new event_1.Emitter();
            this._onDidTerminateDebugSession = new event_1.Emitter();
            this._onDidChangeActiveDebugSession = new event_1.Emitter();
            this._onDidReceiveDebugSessionCustomEvent = new event_1.Emitter();
            this._debugServiceProxy = extHostRpcService.getProxy(extHost_protocol_1.MainContext.MainThreadDebugService);
            this._onDidChangeBreakpoints = new event_1.Emitter({
                onFirstListenerAdd: () => {
                    this.startBreakpoints();
                }
            });
            this._activeDebugConsole = new ExtHostDebugConsole(this._debugServiceProxy);
            this._breakpoints = new Map();
            this._breakpointEventsActive = false;
            this._extensionService.getExtensionRegistry().then((extensionRegistry) => {
                extensionRegistry.onDidChange(_ => {
                    this.registerAllDebugTypes(extensionRegistry);
                });
                this.registerAllDebugTypes(extensionRegistry);
            });
        }
        get onDidStartDebugSession() { return this._onDidStartDebugSession.event; }
        get onDidTerminateDebugSession() { return this._onDidTerminateDebugSession.event; }
        get onDidChangeActiveDebugSession() { return this._onDidChangeActiveDebugSession.event; }
        get activeDebugSession() { return this._activeDebugSession; }
        get onDidReceiveDebugSessionCustomEvent() { return this._onDidReceiveDebugSessionCustomEvent.event; }
        get activeDebugConsole() { return this._activeDebugConsole; }
        asDebugSourceUri(src, session) {
            const source = src;
            if (typeof source.sourceReference === 'number') {
                // src can be retrieved via DAP's "source" request
                let debug = `debug:${encodeURIComponent(source.path || '')}`;
                let sep = '?';
                if (session) {
                    debug += `${sep}session=${encodeURIComponent(session.id)}`;
                    sep = '&';
                }
                debug += `${sep}ref=${source.sourceReference}`;
                return uri_1.URI.parse(debug);
            }
            else if (source.path) {
                // src is just a local file path
                return uri_1.URI.file(source.path);
            }
            else {
                throw new Error(`cannot create uri from DAP 'source' object; properties 'path' and 'sourceReference' are both missing.`);
            }
        }
        registerAllDebugTypes(extensionRegistry) {
            const debugTypes = [];
            this._aexCommands.clear();
            for (const ed of extensionRegistry.getAllExtensionDescriptions()) {
                if (ed.contributes) {
                    const debuggers = ed.contributes['debuggers'];
                    if (debuggers && debuggers.length > 0) {
                        for (const dbg of debuggers) {
                            if (debugUtils_1.isDebuggerMainContribution(dbg)) {
                                debugTypes.push(dbg.type);
                                if (dbg.adapterExecutableCommand) {
                                    this._aexCommands.set(dbg.type, dbg.adapterExecutableCommand);
                                }
                            }
                        }
                    }
                }
            }
            this._debugServiceProxy.$registerDebugTypes(debugTypes);
        }
        // extension debug API
        get onDidChangeBreakpoints() {
            return this._onDidChangeBreakpoints.event;
        }
        get breakpoints() {
            this.startBreakpoints();
            const result = [];
            this._breakpoints.forEach(bp => result.push(bp));
            return result;
        }
        addBreakpoints(breakpoints0) {
            this.startBreakpoints();
            // filter only new breakpoints
            const breakpoints = breakpoints0.filter(bp => {
                const id = bp.id;
                if (!this._breakpoints.has(id)) {
                    this._breakpoints.set(id, bp);
                    return true;
                }
                return false;
            });
            // send notification for added breakpoints
            this.fireBreakpointChanges(breakpoints, [], []);
            // convert added breakpoints to DTOs
            const dtos = [];
            const map = new Map();
            for (const bp of breakpoints) {
                if (bp instanceof extHostTypes_1.SourceBreakpoint) {
                    let dto = map.get(bp.location.uri.toString());
                    if (!dto) {
                        dto = {
                            type: 'sourceMulti',
                            uri: bp.location.uri,
                            lines: []
                        };
                        map.set(bp.location.uri.toString(), dto);
                        dtos.push(dto);
                    }
                    dto.lines.push({
                        id: bp.id,
                        enabled: bp.enabled,
                        condition: bp.condition,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        line: bp.location.range.start.line,
                        character: bp.location.range.start.character
                    });
                }
                else if (bp instanceof extHostTypes_1.FunctionBreakpoint) {
                    dtos.push({
                        type: 'function',
                        id: bp.id,
                        enabled: bp.enabled,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        condition: bp.condition,
                        functionName: bp.functionName
                    });
                }
            }
            // send DTOs to VS Code
            return this._debugServiceProxy.$registerBreakpoints(dtos);
        }
        removeBreakpoints(breakpoints0) {
            this.startBreakpoints();
            // remove from array
            const breakpoints = breakpoints0.filter(b => this._breakpoints.delete(b.id));
            // send notification
            this.fireBreakpointChanges([], breakpoints, []);
            // unregister with VS Code
            const ids = breakpoints.filter(bp => bp instanceof extHostTypes_1.SourceBreakpoint).map(bp => bp.id);
            const fids = breakpoints.filter(bp => bp instanceof extHostTypes_1.FunctionBreakpoint).map(bp => bp.id);
            const dids = breakpoints.filter(bp => bp instanceof extHostTypes_1.DataBreakpoint).map(bp => bp.id);
            return this._debugServiceProxy.$unregisterBreakpoints(ids, fids, dids);
        }
        startDebugging(folder, nameOrConfig, options) {
            return this._debugServiceProxy.$startDebugging(folder ? folder.uri : undefined, nameOrConfig, {
                parentSessionID: options.parentSession ? options.parentSession.id : undefined,
                repl: options.consoleMode === extHostTypes_1.DebugConsoleMode.MergeWithParent ? 'mergeWithParent' : 'separate',
                noDebug: options.noDebug
            });
        }
        registerDebugConfigurationProvider(type, provider, trigger) {
            if (!provider) {
                return new extHostTypes_1.Disposable(() => { });
            }
            if (provider.debugAdapterExecutable) {
                console.error('DebugConfigurationProvider.debugAdapterExecutable is deprecated and will be removed soon; please use DebugAdapterDescriptorFactory.createDebugAdapterDescriptor instead.');
            }
            const handle = this._configProviderHandleCounter++;
            this._configProviders.push({ type, handle, provider });
            this._debugServiceProxy.$registerDebugConfigurationProvider(type, trigger, !!provider.provideDebugConfigurations, !!provider.resolveDebugConfiguration, !!provider.resolveDebugConfigurationWithSubstitutedVariables, !!provider.debugAdapterExecutable, // TODO@AW: deprecated
            handle);
            return new extHostTypes_1.Disposable(() => {
                this._configProviders = this._configProviders.filter(p => p.provider !== provider); // remove
                this._debugServiceProxy.$unregisterDebugConfigurationProvider(handle);
            });
        }
        registerDebugAdapterDescriptorFactory(extension, type, factory) {
            if (!factory) {
                return new extHostTypes_1.Disposable(() => { });
            }
            // a DebugAdapterDescriptorFactory can only be registered in the extension that contributes the debugger
            if (!this.definesDebugType(extension, type)) {
                throw new Error(`a DebugAdapterDescriptorFactory can only be registered from the extension that defines the '${type}' debugger.`);
            }
            // make sure that only one factory for this type is registered
            if (this.getAdapterDescriptorFactoryByType(type)) {
                throw new Error(`a DebugAdapterDescriptorFactory can only be registered once per a type.`);
            }
            const handle = this._adapterFactoryHandleCounter++;
            this._adapterFactories.push({ type, handle, factory });
            this._debugServiceProxy.$registerDebugAdapterDescriptorFactory(type, handle);
            return new extHostTypes_1.Disposable(() => {
                this._adapterFactories = this._adapterFactories.filter(p => p.factory !== factory); // remove
                this._debugServiceProxy.$unregisterDebugAdapterDescriptorFactory(handle);
            });
        }
        registerDebugAdapterTrackerFactory(type, factory) {
            if (!factory) {
                return new extHostTypes_1.Disposable(() => { });
            }
            const handle = this._trackerFactoryHandleCounter++;
            this._trackerFactories.push({ type, handle, factory });
            return new extHostTypes_1.Disposable(() => {
                this._trackerFactories = this._trackerFactories.filter(p => p.factory !== factory); // remove
            });
        }
        // RPC methods (ExtHostDebugServiceShape)
        async $runInTerminal(args) {
            return Promise.resolve(undefined);
        }
        async $substituteVariables(folderUri, config) {
            if (!this._variableResolver) {
                const [workspaceFolders, configProvider] = await Promise.all([this._workspaceService.getWorkspaceFolders2(), this._configurationService.getConfigProvider()]);
                this._variableResolver = this.createVariableResolver(workspaceFolders || [], this._editorsService, configProvider);
            }
            let ws;
            const folder = await this.getFolder(folderUri);
            if (folder) {
                ws = {
                    uri: folder.uri,
                    name: folder.name,
                    index: folder.index,
                    toResource: () => {
                        throw new Error('Not implemented');
                    }
                };
            }
            return this._variableResolver.resolveAny(ws, config);
        }
        createDebugAdapter(adapter, session) {
            if (adapter.type === 'implementation') {
                return new DirectDebugAdapter(adapter.implementation);
            }
            return undefined;
        }
        createSignService() {
            return undefined;
        }
        async $startDASession(debugAdapterHandle, sessionDto) {
            const mythis = this;
            const session = await this.getSession(sessionDto);
            return this.getAdapterDescriptor(this.getAdapterDescriptorFactoryByType(session.type), session).then(daDescriptor => {
                if (!daDescriptor) {
                    throw new Error(`Couldn't find a debug adapter descriptor for debug type '${session.type}' (extension might have failed to activate)`);
                }
                const adapterDescriptor = this.convertToDto(daDescriptor);
                const da = this.createDebugAdapter(adapterDescriptor, session);
                if (!da) {
                    throw new Error(`Couldn't create a debug adapter for type '${session.type}'.`);
                }
                const debugAdapter = da;
                this._debugAdapters.set(debugAdapterHandle, debugAdapter);
                return this.getDebugAdapterTrackers(session).then(tracker => {
                    if (tracker) {
                        this._debugAdaptersTrackers.set(debugAdapterHandle, tracker);
                    }
                    debugAdapter.onMessage(async (message) => {
                        if (message.type === 'request' && message.command === 'handshake') {
                            const request = message;
                            const response = {
                                type: 'response',
                                seq: 0,
                                command: request.command,
                                request_seq: request.seq,
                                success: true
                            };
                            if (!this._signService) {
                                this._signService = this.createSignService();
                            }
                            try {
                                if (this._signService) {
                                    const signature = await this._signService.sign(request.arguments.value);
                                    response.body = {
                                        signature: signature
                                    };
                                    debugAdapter.sendResponse(response);
                                }
                                else {
                                    throw new Error('no signer');
                                }
                            }
                            catch (e) {
                                response.success = false;
                                response.message = e.message;
                                debugAdapter.sendResponse(response);
                            }
                        }
                        else {
                            if (tracker && tracker.onDidSendMessage) {
                                tracker.onDidSendMessage(message);
                            }
                            // DA -> VS Code
                            message = debugUtils_1.convertToVSCPaths(message, true);
                            mythis._debugServiceProxy.$acceptDAMessage(debugAdapterHandle, message);
                        }
                    });
                    debugAdapter.onError(err => {
                        if (tracker && tracker.onError) {
                            tracker.onError(err);
                        }
                        this._debugServiceProxy.$acceptDAError(debugAdapterHandle, err.name, err.message, err.stack);
                    });
                    debugAdapter.onExit((code) => {
                        if (tracker && tracker.onExit) {
                            tracker.onExit(types_1.withNullAsUndefined(code), undefined);
                        }
                        this._debugServiceProxy.$acceptDAExit(debugAdapterHandle, types_1.withNullAsUndefined(code), undefined);
                    });
                    if (tracker && tracker.onWillStartSession) {
                        tracker.onWillStartSession();
                    }
                    return debugAdapter.startSession();
                });
            });
        }
        $sendDAMessage(debugAdapterHandle, message) {
            // VS Code -> DA
            message = debugUtils_1.convertToDAPaths(message, false);
            const tracker = this._debugAdaptersTrackers.get(debugAdapterHandle); // TODO@AW: same handle?
            if (tracker && tracker.onWillReceiveMessage) {
                tracker.onWillReceiveMessage(message);
            }
            const da = this._debugAdapters.get(debugAdapterHandle);
            if (da) {
                da.sendMessage(message);
            }
        }
        $stopDASession(debugAdapterHandle) {
            const tracker = this._debugAdaptersTrackers.get(debugAdapterHandle);
            this._debugAdaptersTrackers.delete(debugAdapterHandle);
            if (tracker && tracker.onWillStopSession) {
                tracker.onWillStopSession();
            }
            const da = this._debugAdapters.get(debugAdapterHandle);
            this._debugAdapters.delete(debugAdapterHandle);
            if (da) {
                return da.stopSession();
            }
            else {
                return Promise.resolve(void 0);
            }
        }
        $acceptBreakpointsDelta(delta) {
            const a = [];
            const r = [];
            const c = [];
            if (delta.added) {
                for (const bpd of delta.added) {
                    const id = bpd.id;
                    if (id && !this._breakpoints.has(id)) {
                        let bp;
                        if (bpd.type === 'function') {
                            bp = new extHostTypes_1.FunctionBreakpoint(bpd.functionName, bpd.enabled, bpd.condition, bpd.hitCondition, bpd.logMessage);
                        }
                        else if (bpd.type === 'data') {
                            bp = new extHostTypes_1.DataBreakpoint(bpd.label, bpd.dataId, bpd.canPersist, bpd.enabled, bpd.hitCondition, bpd.condition, bpd.logMessage);
                        }
                        else {
                            const uri = uri_1.URI.revive(bpd.uri);
                            bp = new extHostTypes_1.SourceBreakpoint(new extHostTypes_1.Location(uri, new extHostTypes_1.Position(bpd.line, bpd.character)), bpd.enabled, bpd.condition, bpd.hitCondition, bpd.logMessage);
                        }
                        bp._id = id;
                        this._breakpoints.set(id, bp);
                        a.push(bp);
                    }
                }
            }
            if (delta.removed) {
                for (const id of delta.removed) {
                    const bp = this._breakpoints.get(id);
                    if (bp) {
                        this._breakpoints.delete(id);
                        r.push(bp);
                    }
                }
            }
            if (delta.changed) {
                for (const bpd of delta.changed) {
                    if (bpd.id) {
                        const bp = this._breakpoints.get(bpd.id);
                        if (bp) {
                            if (bp instanceof extHostTypes_1.FunctionBreakpoint && bpd.type === 'function') {
                                const fbp = bp;
                                fbp.enabled = bpd.enabled;
                                fbp.condition = bpd.condition;
                                fbp.hitCondition = bpd.hitCondition;
                                fbp.logMessage = bpd.logMessage;
                                fbp.functionName = bpd.functionName;
                            }
                            else if (bp instanceof extHostTypes_1.SourceBreakpoint && bpd.type === 'source') {
                                const sbp = bp;
                                sbp.enabled = bpd.enabled;
                                sbp.condition = bpd.condition;
                                sbp.hitCondition = bpd.hitCondition;
                                sbp.logMessage = bpd.logMessage;
                                sbp.location = new extHostTypes_1.Location(uri_1.URI.revive(bpd.uri), new extHostTypes_1.Position(bpd.line, bpd.character));
                            }
                            c.push(bp);
                        }
                    }
                }
            }
            this.fireBreakpointChanges(a, r, c);
        }
        $provideDebugConfigurations(configProviderHandle, folderUri, token) {
            return async_1.asPromise(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.provideDebugConfigurations) {
                    throw new Error('DebugConfigurationProvider has no method provideDebugConfigurations');
                }
                const folder = await this.getFolder(folderUri);
                return provider.provideDebugConfigurations(folder, token);
            }).then(debugConfigurations => {
                if (!debugConfigurations) {
                    throw new Error('nothing returned from DebugConfigurationProvider.provideDebugConfigurations');
                }
                return debugConfigurations;
            });
        }
        $resolveDebugConfiguration(configProviderHandle, folderUri, debugConfiguration, token) {
            return async_1.asPromise(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.resolveDebugConfiguration) {
                    throw new Error('DebugConfigurationProvider has no method resolveDebugConfiguration');
                }
                const folder = await this.getFolder(folderUri);
                return provider.resolveDebugConfiguration(folder, debugConfiguration, token);
            });
        }
        $resolveDebugConfigurationWithSubstitutedVariables(configProviderHandle, folderUri, debugConfiguration, token) {
            return async_1.asPromise(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.resolveDebugConfigurationWithSubstitutedVariables) {
                    throw new Error('DebugConfigurationProvider has no method resolveDebugConfigurationWithSubstitutedVariables');
                }
                const folder = await this.getFolder(folderUri);
                return provider.resolveDebugConfigurationWithSubstitutedVariables(folder, debugConfiguration, token);
            });
        }
        // TODO@AW deprecated and legacy
        $legacyDebugAdapterExecutable(configProviderHandle, folderUri) {
            return async_1.asPromise(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.debugAdapterExecutable) {
                    throw new Error('DebugConfigurationProvider has no method debugAdapterExecutable');
                }
                const folder = await this.getFolder(folderUri);
                return provider.debugAdapterExecutable(folder, cancellation_1.CancellationToken.None);
            }).then(executable => {
                if (!executable) {
                    throw new Error('nothing returned from DebugConfigurationProvider.debugAdapterExecutable');
                }
                return this.convertToDto(executable);
            });
        }
        async $provideDebugAdapter(adapterFactoryHandle, sessionDto) {
            const adapterDescriptorFactory = this.getAdapterDescriptorFactoryByHandle(adapterFactoryHandle);
            if (!adapterDescriptorFactory) {
                return Promise.reject(new Error('no adapter descriptor factory found for handle'));
            }
            const session = await this.getSession(sessionDto);
            return this.getAdapterDescriptor(adapterDescriptorFactory, session).then(adapterDescriptor => {
                if (!adapterDescriptor) {
                    throw new Error(`Couldn't find a debug adapter descriptor for debug type '${session.type}'`);
                }
                return this.convertToDto(adapterDescriptor);
            });
        }
        async $acceptDebugSessionStarted(sessionDto) {
            const session = await this.getSession(sessionDto);
            this._onDidStartDebugSession.fire(session);
        }
        async $acceptDebugSessionTerminated(sessionDto) {
            const session = await this.getSession(sessionDto);
            if (session) {
                this._onDidTerminateDebugSession.fire(session);
                this._debugSessions.delete(session.id);
            }
        }
        async $acceptDebugSessionActiveChanged(sessionDto) {
            this._activeDebugSession = sessionDto ? await this.getSession(sessionDto) : undefined;
            this._onDidChangeActiveDebugSession.fire(this._activeDebugSession);
        }
        async $acceptDebugSessionNameChanged(sessionDto, name) {
            const session = await this.getSession(sessionDto);
            if (session) {
                session._acceptNameChanged(name);
            }
        }
        async $acceptDebugSessionCustomEvent(sessionDto, event) {
            const session = await this.getSession(sessionDto);
            const ee = {
                session: session,
                event: event.event,
                body: event.body
            };
            this._onDidReceiveDebugSessionCustomEvent.fire(ee);
        }
        // private & dto helpers
        convertToDto(x) {
            if (x instanceof extHostTypes_1.DebugAdapterExecutable) {
                return {
                    type: 'executable',
                    command: x.command,
                    args: x.args,
                    options: x.options
                };
            }
            else if (x instanceof extHostTypes_1.DebugAdapterServer) {
                return {
                    type: 'server',
                    port: x.port,
                    host: x.host
                };
            }
            else if (x instanceof extHostTypes_1.DebugAdapterInlineImplementation) {
                return {
                    type: 'implementation',
                    implementation: x.implementation
                };
            }
            else {
                throw new Error('convertToDto unexpected type');
            }
        }
        getAdapterDescriptorFactoryByType(type) {
            const results = this._adapterFactories.filter(p => p.type === type);
            if (results.length > 0) {
                return results[0].factory;
            }
            return undefined;
        }
        getAdapterDescriptorFactoryByHandle(handle) {
            const results = this._adapterFactories.filter(p => p.handle === handle);
            if (results.length > 0) {
                return results[0].factory;
            }
            return undefined;
        }
        getConfigProviderByHandle(handle) {
            const results = this._configProviders.filter(p => p.handle === handle);
            if (results.length > 0) {
                return results[0].provider;
            }
            return undefined;
        }
        definesDebugType(ed, type) {
            if (ed.contributes) {
                const debuggers = ed.contributes['debuggers'];
                if (debuggers && debuggers.length > 0) {
                    for (const dbg of debuggers) {
                        // only debugger contributions with a "label" are considered a "defining" debugger contribution
                        if (dbg.label && dbg.type) {
                            if (dbg.type === type) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        getDebugAdapterTrackers(session) {
            const config = session.configuration;
            const type = config.type;
            const promises = this._trackerFactories
                .filter(tuple => tuple.type === type || tuple.type === '*')
                .map(tuple => async_1.asPromise(() => tuple.factory.createDebugAdapterTracker(session)).then(p => p, err => null));
            return Promise.race([
                Promise.all(promises).then(result => {
                    const trackers = result.filter(t => !!t); // filter null
                    if (trackers.length > 0) {
                        return new MultiTracker(trackers);
                    }
                    return undefined;
                }),
                new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        clearTimeout(timeout);
                        reject(new Error('timeout'));
                    }, 1000);
                })
            ]).catch(err => {
                // ignore errors
                return undefined;
            });
        }
        async getAdapterDescriptor(adapterDescriptorFactory, session) {
            // a "debugServer" attribute in the launch config takes precedence
            const serverPort = session.configuration.debugServer;
            if (typeof serverPort === 'number') {
                return Promise.resolve(new extHostTypes_1.DebugAdapterServer(serverPort));
            }
            // TODO@AW legacy
            const pair = this._configProviders.filter(p => p.type === session.type).pop();
            if (pair && pair.provider.debugAdapterExecutable) {
                const func = pair.provider.debugAdapterExecutable;
                return async_1.asPromise(() => func(session.workspaceFolder, cancellation_1.CancellationToken.None)).then(executable => {
                    if (executable) {
                        return executable;
                    }
                    return undefined;
                });
            }
            if (adapterDescriptorFactory) {
                const extensionRegistry = await this._extensionService.getExtensionRegistry();
                return async_1.asPromise(() => adapterDescriptorFactory.createDebugAdapterDescriptor(session, this.daExecutableFromPackage(session, extensionRegistry))).then(daDescriptor => {
                    if (daDescriptor) {
                        return daDescriptor;
                    }
                    return undefined;
                });
            }
            // try deprecated command based extension API "adapterExecutableCommand" to determine the executable
            // TODO@AW legacy
            const aex = this._aexCommands.get(session.type);
            if (aex) {
                const folder = session.workspaceFolder;
                const rootFolder = folder ? folder.uri.toString() : undefined;
                return this._commandService.executeCommand(aex, rootFolder).then((ae) => {
                    return new extHostTypes_1.DebugAdapterExecutable(ae.command, ae.args || []);
                });
            }
            // fallback: use executable information from package.json
            const extensionRegistry = await this._extensionService.getExtensionRegistry();
            return Promise.resolve(this.daExecutableFromPackage(session, extensionRegistry));
        }
        daExecutableFromPackage(session, extensionRegistry) {
            return undefined;
        }
        startBreakpoints() {
            if (!this._breakpointEventsActive) {
                this._breakpointEventsActive = true;
                this._debugServiceProxy.$startBreakpointEvents();
            }
        }
        fireBreakpointChanges(added, removed, changed) {
            if (added.length > 0 || removed.length > 0 || changed.length > 0) {
                this._onDidChangeBreakpoints.fire(Object.freeze({
                    added,
                    removed,
                    changed,
                }));
            }
        }
        async getSession(dto) {
            if (dto) {
                if (typeof dto === 'string') {
                    const ds = this._debugSessions.get(dto);
                    if (ds) {
                        return ds;
                    }
                }
                else {
                    let ds = this._debugSessions.get(dto.id);
                    if (!ds) {
                        const folder = await this.getFolder(dto.folderUri);
                        ds = new ExtHostDebugSession(this._debugServiceProxy, dto.id, dto.type, dto.name, folder, dto.configuration);
                        this._debugSessions.set(ds.id, ds);
                        this._debugServiceProxy.$sessionCached(ds.id);
                    }
                    return ds;
                }
            }
            throw new Error('cannot find session');
        }
        getFolder(_folderUri) {
            if (_folderUri) {
                const folderURI = uri_1.URI.revive(_folderUri);
                return this._workspaceService.resolveWorkspaceFolder(folderURI);
            }
            return Promise.resolve(undefined);
        }
    };
    ExtHostDebugServiceBase = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostExtensionService_1.IExtHostExtensionService),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostCommands_1.IExtHostCommands)
    ], ExtHostDebugServiceBase);
    exports.ExtHostDebugServiceBase = ExtHostDebugServiceBase;
    class ExtHostDebugSession {
        constructor(_debugServiceProxy, _id, _type, _name, _workspaceFolder, _configuration) {
            this._debugServiceProxy = _debugServiceProxy;
            this._id = _id;
            this._type = _type;
            this._name = _name;
            this._workspaceFolder = _workspaceFolder;
            this._configuration = _configuration;
        }
        get id() {
            return this._id;
        }
        get type() {
            return this._type;
        }
        get name() {
            return this._name;
        }
        set name(name) {
            this._name = name;
            this._debugServiceProxy.$setDebugSessionName(this._id, name);
        }
        _acceptNameChanged(name) {
            this._name = name;
        }
        get workspaceFolder() {
            return this._workspaceFolder;
        }
        get configuration() {
            return this._configuration;
        }
        customRequest(command, args) {
            return this._debugServiceProxy.$customDebugAdapterRequest(this._id, command, args);
        }
    }
    exports.ExtHostDebugSession = ExtHostDebugSession;
    class ExtHostDebugConsole {
        constructor(proxy) {
            this._debugServiceProxy = proxy;
        }
        append(value) {
            this._debugServiceProxy.$appendDebugConsole(value);
        }
        appendLine(value) {
            this.append(value + '\n');
        }
    }
    exports.ExtHostDebugConsole = ExtHostDebugConsole;
    class ExtHostVariableResolverService extends variableResolver_1.AbstractVariableResolverService {
        constructor(folders, editorService, configurationService, env) {
            super({
                getFolderUri: (folderName) => {
                    const found = folders.filter(f => f.name === folderName);
                    if (found && found.length > 0) {
                        return found[0].uri;
                    }
                    return undefined;
                },
                getWorkspaceFolderCount: () => {
                    return folders.length;
                },
                getConfigurationValue: (folderUri, section) => {
                    return configurationService.getConfiguration(undefined, folderUri).get(section);
                },
                getExecPath: () => {
                    return env ? env['VSCODE_EXEC_PATH'] : undefined;
                },
                getFilePath: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor) {
                            return path.normalize(activeEditor.document.uri.fsPath);
                        }
                    }
                    return undefined;
                },
                getSelectedText: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor && !activeEditor.selection.isEmpty) {
                            return activeEditor.document.getText(activeEditor.selection);
                        }
                    }
                    return undefined;
                },
                getLineNumber: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor) {
                            return String(activeEditor.selection.end.line + 1);
                        }
                    }
                    return undefined;
                }
            }, env, !editorService);
        }
    }
    exports.ExtHostVariableResolverService = ExtHostVariableResolverService;
    class MultiTracker {
        constructor(trackers) {
            this.trackers = trackers;
        }
        onWillStartSession() {
            this.trackers.forEach(t => t.onWillStartSession ? t.onWillStartSession() : undefined);
        }
        onWillReceiveMessage(message) {
            this.trackers.forEach(t => t.onWillReceiveMessage ? t.onWillReceiveMessage(message) : undefined);
        }
        onDidSendMessage(message) {
            this.trackers.forEach(t => t.onDidSendMessage ? t.onDidSendMessage(message) : undefined);
        }
        onWillStopSession() {
            this.trackers.forEach(t => t.onWillStopSession ? t.onWillStopSession() : undefined);
        }
        onError(error) {
            this.trackers.forEach(t => t.onError ? t.onError(error) : undefined);
        }
        onExit(code, signal) {
            this.trackers.forEach(t => t.onExit ? t.onExit(code, signal) : undefined);
        }
    }
    /*
     * Call directly into a debug adapter implementation
     */
    class DirectDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        constructor(implementation) {
            super();
            this.implementation = implementation;
            implementation.onDidSendMessage((message) => {
                this.acceptMessage(message);
            });
        }
        startSession() {
            return Promise.resolve(undefined);
        }
        sendMessage(message) {
            this.implementation.handleMessage(message);
        }
        stopSession() {
            this.implementation.dispose();
            return Promise.resolve(undefined);
        }
    }
    let WorkerExtHostDebugService = class WorkerExtHostDebugService extends ExtHostDebugServiceBase {
        constructor(extHostRpcService, workspaceService, extensionService, editorsService, configurationService, commandService) {
            super(extHostRpcService, workspaceService, extensionService, editorsService, configurationService, commandService);
        }
        createVariableResolver(folders, editorService, configurationService) {
            return new ExtHostVariableResolverService(folders, editorService, configurationService);
        }
    };
    WorkerExtHostDebugService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostExtensionService_1.IExtHostExtensionService),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostCommands_1.IExtHostCommands)
    ], WorkerExtHostDebugService);
    exports.WorkerExtHostDebugService = WorkerExtHostDebugService;
});
//# __sourceMappingURL=extHostDebugService.js.map