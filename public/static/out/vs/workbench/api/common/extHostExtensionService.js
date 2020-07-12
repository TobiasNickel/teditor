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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostExtensionActivator", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/base/common/cancellation", "vs/base/common/errors", "vs/platform/extensions/common/extensions", "vs/base/common/network", "vs/base/common/buffer", "vs/workbench/api/common/extHostMemento", "vs/workbench/api/common/extHostTypes", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostRpcService", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostTerminalService", "vs/base/common/event"], function (require, exports, nls, path, resources_1, async_1, lifecycle_1, map_1, uri_1, log_1, extHost_protocol_1, extHostConfiguration_1, extHostExtensionActivator_1, extHostStorage_1, extHostWorkspace_1, extensionDescriptionRegistry_1, cancellation_1, errors, extensions_1, network_1, buffer_1, extHostMemento_1, extHostTypes_1, remoteAuthorityResolver_1, instantiation_1, extHostInitDataService_1, extHostStoragePaths_1, extHostRpcService_1, serviceCollection_1, extHostTunnelService_1, extHostTerminalService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostExtensionService = exports.AbstractExtHostExtensionService = exports.IHostUtils = void 0;
    exports.IHostUtils = instantiation_1.createDecorator('IHostUtils');
    let AbstractExtHostExtensionService = class AbstractExtHostExtensionService extends lifecycle_1.Disposable {
        constructor(instaService, hostUtils, extHostContext, extHostWorkspace, extHostConfiguration, logService, initData, storagePath, extHostTunnelService, extHostTerminalService) {
            super();
            this._onDidChangeRemoteConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeRemoteConnectionData = this._onDidChangeRemoteConnectionData.event;
            this._hostUtils = hostUtils;
            this._extHostContext = extHostContext;
            this._initData = initData;
            this._extHostWorkspace = extHostWorkspace;
            this._extHostConfiguration = extHostConfiguration;
            this._logService = logService;
            this._extHostTunnelService = extHostTunnelService;
            this._extHostTerminalService = extHostTerminalService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._mainThreadWorkspaceProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadWorkspace);
            this._mainThreadTelemetryProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            this._mainThreadExtensionsProxy = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            this._almostReadyToRunExtensions = new async_1.Barrier();
            this._readyToStartExtensionHost = new async_1.Barrier();
            this._readyToRunExtensions = new async_1.Barrier();
            this._registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(this._initData.extensions);
            this._storage = new extHostStorage_1.ExtHostStorage(this._extHostContext);
            this._storagePath = storagePath;
            this._instaService = instaService.createChild(new serviceCollection_1.ServiceCollection([extHostStorage_1.IExtHostStorage, this._storage]));
            const hostExtensions = new Set();
            this._initData.hostExtensions.forEach((extensionId) => hostExtensions.add(extensions_1.ExtensionIdentifier.toKey(extensionId)));
            this._activator = new extHostExtensionActivator_1.ExtensionsActivator(this._registry, this._initData.resolvedExtensions, this._initData.hostExtensions, {
                onExtensionActivationError: (extensionId, error) => {
                    this._mainThreadExtensionsProxy.$onExtensionActivationError(extensionId, error);
                },
                actualActivateExtension: async (extensionId, reason) => {
                    if (hostExtensions.has(extensions_1.ExtensionIdentifier.toKey(extensionId))) {
                        await this._mainThreadExtensionsProxy.$activateExtension(extensionId, reason);
                        return new extHostExtensionActivator_1.HostExtension();
                    }
                    const extensionDescription = this._registry.getExtensionDescription(extensionId);
                    return this._activateExtension(extensionDescription, reason);
                }
            }, this._logService);
            this._extensionPathIndex = null;
            this._resolvers = Object.create(null);
            this._started = false;
            this._remoteConnectionData = this._initData.remote.connectionData;
        }
        getRemoteConnectionData() {
            return this._remoteConnectionData;
        }
        async initialize() {
            try {
                await this._beforeAlmostReadyToRunExtensions();
                this._almostReadyToRunExtensions.open();
                await this._extHostWorkspace.waitForInitializeCall();
                this._readyToStartExtensionHost.open();
                if (this._initData.autoStart) {
                    this._startExtensionHost();
                }
            }
            catch (err) {
                errors.onUnexpectedError(err);
            }
        }
        async deactivateAll() {
            let allPromises = [];
            try {
                const allExtensions = this._registry.getAllExtensionDescriptions();
                const allExtensionsIds = allExtensions.map(ext => ext.identifier);
                const activatedExtensions = allExtensionsIds.filter(id => this.isActivated(id));
                allPromises = activatedExtensions.map((extensionId) => {
                    return this._deactivate(extensionId);
                });
            }
            catch (err) {
                // TODO: write to log once we have one
            }
            await Promise.all(allPromises);
        }
        isActivated(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.isActivated(extensionId);
            }
            return false;
        }
        _activateByEvent(activationEvent, startup) {
            return this._activator.activateByEvent(activationEvent, startup);
        }
        _activateById(extensionId, reason) {
            return this._activator.activateById(extensionId, reason);
        }
        activateByIdWithErrors(extensionId, reason) {
            return this._activateById(extensionId, reason).then(() => {
                const extension = this._activator.getActivatedExtension(extensionId);
                if (extension.activationFailed) {
                    // activation failed => bubble up the error as the promise result
                    return Promise.reject(extension.activationFailedError);
                }
                return undefined;
            });
        }
        getExtensionRegistry() {
            return this._readyToRunExtensions.wait().then(_ => this._registry);
        }
        getExtensionExports(extensionId) {
            if (this._readyToRunExtensions.isOpen()) {
                return this._activator.getActivatedExtension(extensionId).exports;
            }
            else {
                return null;
            }
        }
        // create trie to enable fast 'filename -> extension id' look up
        getExtensionPathIndex() {
            if (!this._extensionPathIndex) {
                const tree = map_1.TernarySearchTree.forPaths();
                const extensions = this._registry.getAllExtensionDescriptions().map(ext => {
                    if (!ext.main) {
                        return undefined;
                    }
                    return this._hostUtils.realpath(ext.extensionLocation.fsPath).then(value => tree.set(uri_1.URI.file(value).fsPath, ext));
                });
                this._extensionPathIndex = Promise.all(extensions).then(() => tree);
            }
            return this._extensionPathIndex;
        }
        _deactivate(extensionId) {
            let result = Promise.resolve(undefined);
            if (!this._readyToRunExtensions.isOpen()) {
                return result;
            }
            if (!this._activator.isActivated(extensionId)) {
                return result;
            }
            const extension = this._activator.getActivatedExtension(extensionId);
            if (!extension) {
                return result;
            }
            // call deactivate if available
            try {
                if (typeof extension.module.deactivate === 'function') {
                    result = Promise.resolve(extension.module.deactivate()).then(undefined, (err) => {
                        // TODO: Do something with err if this is not the shutdown case
                        return Promise.resolve(undefined);
                    });
                }
            }
            catch (err) {
                // TODO: Do something with err if this is not the shutdown case
            }
            // clean up subscriptions
            try {
                lifecycle_1.dispose(extension.subscriptions);
            }
            catch (err) {
                // TODO: Do something with err if this is not the shutdown case
            }
            return result;
        }
        // --- impl
        _activateExtension(extensionDescription, reason) {
            this._mainThreadExtensionsProxy.$onWillActivateExtension(extensionDescription.identifier);
            return this._doActivateExtension(extensionDescription, reason).then((activatedExtension) => {
                const activationTimes = activatedExtension.activationTimes;
                this._mainThreadExtensionsProxy.$onDidActivateExtension(extensionDescription.identifier, activationTimes.codeLoadingTime, activationTimes.activateCallTime, activationTimes.activateResolvedTime, reason);
                this._logExtensionActivationTimes(extensionDescription, reason, 'success', activationTimes);
                return activatedExtension;
            }, (err) => {
                this._logExtensionActivationTimes(extensionDescription, reason, 'failure');
                throw err;
            });
        }
        _logExtensionActivationTimes(extensionDescription, reason, outcome, activationTimes) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            this._mainThreadTelemetryProxy.$publicLog2('extensionActivationTimes', Object.assign(Object.assign(Object.assign({}, event), (activationTimes || {})), { outcome }));
        }
        _doActivateExtension(extensionDescription, reason) {
            const event = getTelemetryActivationEvent(extensionDescription, reason);
            this._mainThreadTelemetryProxy.$publicLog2('activatePlugin', event);
            if (!extensionDescription.main) {
                // Treat the extension as being empty => NOT AN ERROR CASE
                return Promise.resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
            this._logService.info(`ExtensionService#_doActivateExtension ${extensionDescription.identifier.value} ${JSON.stringify(reason)}`);
            this._logService.flush();
            const activationTimesBuilder = new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(reason.startup);
            return Promise.all([
                this._loadCommonJSModule(resources_1.joinPath(extensionDescription.extensionLocation, extensionDescription.main), activationTimesBuilder),
                this._loadExtensionContext(extensionDescription)
            ]).then(values => {
                return AbstractExtHostExtensionService._callActivate(this._logService, extensionDescription.identifier, values[0], values[1], activationTimesBuilder);
            });
        }
        _loadExtensionContext(extensionDescription) {
            const globalState = new extHostMemento_1.ExtensionMemento(extensionDescription.identifier.value, true, this._storage);
            const workspaceState = new extHostMemento_1.ExtensionMemento(extensionDescription.identifier.value, false, this._storage);
            const extensionMode = extensionDescription.isUnderDevelopment
                ? (this._initData.environment.extensionTestsLocationURI ? extHostTypes_1.ExtensionMode.Test : extHostTypes_1.ExtensionMode.Development)
                : extHostTypes_1.ExtensionMode.Production;
            this._logService.trace(`ExtensionService#loadExtensionContext ${extensionDescription.identifier.value}`);
            return Promise.all([
                globalState.whenReady,
                workspaceState.whenReady,
                this._storagePath.whenReady
            ]).then(() => {
                const that = this;
                return Object.freeze({
                    globalState,
                    workspaceState,
                    subscriptions: [],
                    get extensionUri() { return extensionDescription.extensionLocation; },
                    get extensionPath() { return extensionDescription.extensionLocation.fsPath; },
                    get storagePath() { return that._storagePath.workspaceValue(extensionDescription); },
                    get globalStoragePath() { return that._storagePath.globalValue(extensionDescription); },
                    asAbsolutePath(relativePath) { return path.join(extensionDescription.extensionLocation.fsPath, relativePath); },
                    get logPath() { return path.join(that._initData.logsLocation.fsPath, extensionDescription.identifier.value); },
                    get extensionMode() { return extensionMode; },
                    get environmentVariableCollection() { return that._extHostTerminalService.getEnvironmentVariableCollection(extensionDescription); }
                });
            });
        }
        static _callActivate(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            // Make sure the extension's surface is not undefined
            extensionModule = extensionModule || {
                activate: undefined,
                deactivate: undefined
            };
            return this._callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder).then((extensionExports) => {
                return new extHostExtensionActivator_1.ActivatedExtension(false, null, activationTimesBuilder.build(), extensionModule, extensionExports, context.subscriptions);
            });
        }
        static _callActivateOptional(logService, extensionId, extensionModule, context, activationTimesBuilder) {
            if (typeof extensionModule.activate === 'function') {
                try {
                    activationTimesBuilder.activateCallStart();
                    logService.trace(`ExtensionService#_callActivateOptional ${extensionId.value}`);
                    const scope = typeof global === 'object' ? global : self; // `global` is nodejs while `self` is for workers
                    const activateResult = extensionModule.activate.apply(scope, [context]);
                    activationTimesBuilder.activateCallStop();
                    activationTimesBuilder.activateResolveStart();
                    return Promise.resolve(activateResult).then((value) => {
                        activationTimesBuilder.activateResolveStop();
                        return value;
                    });
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            else {
                // No activate found => the module is the extension's exports
                return Promise.resolve(extensionModule);
            }
        }
        // -- eager activation
        _activateOneStartupFinished(desc, activationEvent) {
            this._activateById(desc.identifier, {
                startup: false,
                extensionId: desc.identifier,
                activationEvent: activationEvent
            }).then(undefined, (err) => {
                this._logService.error(err);
            });
        }
        _activateAllStartupFinished() {
            for (const desc of this._registry.getAllExtensionDescriptions()) {
                if (desc.activationEvents) {
                    for (const activationEvent of desc.activationEvents) {
                        if (activationEvent === 'onStartupFinished') {
                            this._activateOneStartupFinished(desc, activationEvent);
                        }
                    }
                }
            }
        }
        // Handle "eager" activation extensions
        _handleEagerExtensions() {
            const starActivation = this._activateByEvent('*', true).then(undefined, (err) => {
                this._logService.error(err);
            });
            this._disposables.add(this._extHostWorkspace.onDidChangeWorkspace((e) => this._handleWorkspaceContainsEagerExtensions(e.added)));
            const folders = this._extHostWorkspace.workspace ? this._extHostWorkspace.workspace.folders : [];
            const workspaceContainsActivation = this._handleWorkspaceContainsEagerExtensions(folders);
            const eagerExtensionsActivation = Promise.all([starActivation, workspaceContainsActivation]).then(() => { });
            Promise.race([eagerExtensionsActivation, async_1.timeout(10000)]).then(() => {
                this._activateAllStartupFinished();
            });
            return eagerExtensionsActivation;
        }
        _handleWorkspaceContainsEagerExtensions(folders) {
            if (folders.length === 0) {
                return Promise.resolve(undefined);
            }
            return Promise.all(this._registry.getAllExtensionDescriptions().map((desc) => {
                return this._handleWorkspaceContainsEagerExtension(folders, desc);
            })).then(() => { });
        }
        _handleWorkspaceContainsEagerExtension(folders, desc) {
            const activationEvents = desc.activationEvents;
            if (!activationEvents) {
                return Promise.resolve(undefined);
            }
            if (this.isActivated(desc.identifier)) {
                return Promise.resolve(undefined);
            }
            const fileNames = [];
            const globPatterns = [];
            const localWithRemote = !this._initData.remote.isRemote && !!this._initData.remote.authority;
            for (const activationEvent of activationEvents) {
                if (/^workspaceContains:/.test(activationEvent)) {
                    const fileNameOrGlob = activationEvent.substr('workspaceContains:'.length);
                    if (fileNameOrGlob.indexOf('*') >= 0 || fileNameOrGlob.indexOf('?') >= 0 || localWithRemote) {
                        globPatterns.push(fileNameOrGlob);
                    }
                    else {
                        fileNames.push(fileNameOrGlob);
                    }
                }
            }
            if (fileNames.length === 0 && globPatterns.length === 0) {
                return Promise.resolve(undefined);
            }
            const fileNamePromise = Promise.all(fileNames.map((fileName) => this._activateIfFileName(folders, desc.identifier, fileName))).then(() => { });
            const globPatternPromise = this._activateIfGlobPatterns(folders, desc.identifier, globPatterns);
            return Promise.all([fileNamePromise, globPatternPromise]).then(() => { });
        }
        async _activateIfFileName(folders, extensionId, fileName) {
            // find exact path
            for (const { uri } of folders) {
                if (await this._hostUtils.exists(path.join(uri_1.URI.revive(uri).fsPath, fileName))) {
                    // the file was found
                    return (this._activateById(extensionId, { startup: true, extensionId, activationEvent: `workspaceContains:${fileName}` })
                        .then(undefined, err => this._logService.error(err)));
                }
            }
            return undefined;
        }
        async _activateIfGlobPatterns(folders, extensionId, globPatterns) {
            this._logService.trace(`extensionHostMain#activateIfGlobPatterns: fileSearch, extension: ${extensionId.value}, entryPoint: workspaceContains`);
            if (globPatterns.length === 0) {
                return Promise.resolve(undefined);
            }
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const searchP = this._mainThreadWorkspaceProxy.$checkExists(folders.map(folder => folder.uri), globPatterns, tokenSource.token);
            const timer = setTimeout(async () => {
                tokenSource.cancel();
                this._activateById(extensionId, { startup: true, extensionId, activationEvent: `workspaceContainsTimeout:${globPatterns.join(',')}` })
                    .then(undefined, err => this._logService.error(err));
            }, AbstractExtHostExtensionService.WORKSPACE_CONTAINS_TIMEOUT);
            let exists = false;
            try {
                exists = await searchP;
            }
            catch (err) {
                if (!errors.isPromiseCanceledError(err)) {
                    this._logService.error(err);
                }
            }
            tokenSource.dispose();
            clearTimeout(timer);
            if (exists) {
                // a file was found matching one of the glob patterns
                return (this._activateById(extensionId, { startup: true, extensionId, activationEvent: `workspaceContains:${globPatterns.join(',')}` })
                    .then(undefined, err => this._logService.error(err)));
            }
            return Promise.resolve(undefined);
        }
        _handleExtensionTests() {
            return this._doHandleExtensionTests().then(undefined, error => {
                console.error(error); // ensure any error message makes it onto the console
                return Promise.reject(error);
            });
        }
        async _doHandleExtensionTests() {
            const { extensionDevelopmentLocationURI, extensionTestsLocationURI } = this._initData.environment;
            if (!(extensionDevelopmentLocationURI && extensionTestsLocationURI && extensionTestsLocationURI.scheme === network_1.Schemas.file)) {
                return Promise.resolve(undefined);
            }
            const extensionTestsPath = resources_1.originalFSPath(extensionTestsLocationURI);
            // Require the test runner via node require from the provided path
            let testRunner;
            let requireError;
            try {
                testRunner = await this._loadCommonJSModule(uri_1.URI.file(extensionTestsPath), new extHostExtensionActivator_1.ExtensionActivationTimesBuilder(false));
            }
            catch (error) {
                requireError = error;
            }
            // Execute the runner if it follows the old `run` spec
            if (testRunner && typeof testRunner.run === 'function') {
                return new Promise((c, e) => {
                    const oldTestRunnerCallback = (error, failures) => {
                        if (error) {
                            e(error.toString());
                        }
                        else {
                            c(undefined);
                        }
                        // after tests have run, we shutdown the host
                        this._gracefulExit(error || (typeof failures === 'number' && failures > 0) ? 1 /* ERROR */ : 0 /* OK */);
                    };
                    const runResult = testRunner.run(extensionTestsPath, oldTestRunnerCallback);
                    // Using the new API `run(): Promise<void>`
                    if (runResult && runResult.then) {
                        runResult
                            .then(() => {
                            c();
                            this._gracefulExit(0);
                        })
                            .catch((err) => {
                            e(err.toString());
                            this._gracefulExit(1);
                        });
                    }
                });
            }
            // Otherwise make sure to shutdown anyway even in case of an error
            else {
                this._gracefulExit(1 /* ERROR */);
            }
            return Promise.reject(new Error(requireError ? requireError.toString() : nls.localize('extensionTestError', "Path {0} does not point to a valid extension test runner.", extensionTestsPath)));
        }
        _gracefulExit(code) {
            // to give the PH process a chance to flush any outstanding console
            // messages to the main process, we delay the exit() by some time
            setTimeout(() => {
                // If extension tests are running, give the exit code to the renderer
                if (this._initData.remote.isRemote && !!this._initData.environment.extensionTestsLocationURI) {
                    this._mainThreadExtensionsProxy.$onExtensionHostExit(code);
                    return;
                }
                this._hostUtils.exit(code);
            }, 500);
        }
        _startExtensionHost() {
            if (this._started) {
                throw new Error(`Extension host is already started!`);
            }
            this._started = true;
            return this._readyToStartExtensionHost.wait()
                .then(() => this._readyToRunExtensions.open())
                .then(() => this._handleEagerExtensions())
                .then(() => this._handleExtensionTests())
                .then(() => {
                this._logService.info(`eager extensions activated`);
            });
        }
        // -- called by extensions
        registerRemoteAuthorityResolver(authorityPrefix, resolver) {
            this._resolvers[authorityPrefix] = resolver;
            return lifecycle_1.toDisposable(() => {
                delete this._resolvers[authorityPrefix];
            });
        }
        // -- called by main thread
        async $resolveAuthority(remoteAuthority, resolveAttempt) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                throw new Error(`Not an authority that can be resolved!`);
            }
            const authorityPrefix = remoteAuthority.substr(0, authorityPlusIndex);
            await this._almostReadyToRunExtensions.wait();
            await this._activateByEvent(`onResolveRemoteAuthority:${authorityPrefix}`, false);
            const resolver = this._resolvers[authorityPrefix];
            if (!resolver) {
                return {
                    type: 'error',
                    error: {
                        code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NoResolverFound,
                        message: `No remote extension installed to resolve ${authorityPrefix}.`,
                        detail: undefined
                    }
                };
            }
            try {
                const result = await resolver.resolve(remoteAuthority, { resolveAttempt });
                this._disposables.add(await this._extHostTunnelService.setTunnelExtensionFunctions(resolver));
                // Split merged API result into separate authority/options
                const authority = {
                    authority: remoteAuthority,
                    host: result.host,
                    port: result.port
                };
                const options = {
                    extensionHostEnv: result.extensionHostEnv
                };
                return {
                    type: 'ok',
                    value: {
                        authority,
                        options,
                        tunnelInformation: { environmentTunnels: result.environmentTunnels }
                    }
                };
            }
            catch (err) {
                if (err instanceof extHostTypes_1.RemoteAuthorityResolverError) {
                    return {
                        type: 'error',
                        error: {
                            code: err._code,
                            message: err._message,
                            detail: err._detail
                        }
                    };
                }
                throw err;
            }
        }
        $startExtensionHost(enabledExtensionIds) {
            this._registry.keepOnly(enabledExtensionIds);
            return this._startExtensionHost();
        }
        $activateByEvent(activationEvent) {
            return (this._readyToRunExtensions.wait()
                .then(_ => this._activateByEvent(activationEvent, false)));
        }
        async $activate(extensionId, reason) {
            await this._readyToRunExtensions.wait();
            if (!this._registry.getExtensionDescription(extensionId)) {
                // unknown extension => ignore
                return false;
            }
            await this._activateById(extensionId, reason);
            return true;
        }
        async $deltaExtensions(toAdd, toRemove) {
            toAdd.forEach((extension) => extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation));
            const trie = await this.getExtensionPathIndex();
            await Promise.all(toRemove.map(async (extensionId) => {
                const extensionDescription = this._registry.getExtensionDescription(extensionId);
                if (!extensionDescription) {
                    return;
                }
                const realpathValue = await this._hostUtils.realpath(extensionDescription.extensionLocation.fsPath);
                trie.delete(uri_1.URI.file(realpathValue).fsPath);
            }));
            await Promise.all(toAdd.map(async (extensionDescription) => {
                const realpathValue = await this._hostUtils.realpath(extensionDescription.extensionLocation.fsPath);
                trie.set(uri_1.URI.file(realpathValue).fsPath, extensionDescription);
            }));
            this._registry.deltaExtensions(toAdd, toRemove);
            return Promise.resolve(undefined);
        }
        async $test_latency(n) {
            return n;
        }
        async $test_up(b) {
            return b.byteLength;
        }
        async $test_down(size) {
            let buff = buffer_1.VSBuffer.alloc(size);
            let value = Math.random() % 256;
            for (let i = 0; i < size; i++) {
                buff.writeUInt8(value, i);
            }
            return buff;
        }
        async $updateRemoteConnectionData(connectionData) {
            this._remoteConnectionData = connectionData;
            this._onDidChangeRemoteConnectionData.fire();
        }
    };
    AbstractExtHostExtensionService.WORKSPACE_CONTAINS_TIMEOUT = 7000;
    AbstractExtHostExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, exports.IHostUtils),
        __param(2, extHostRpcService_1.IExtHostRpcService),
        __param(3, extHostWorkspace_1.IExtHostWorkspace),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, log_1.ILogService),
        __param(6, extHostInitDataService_1.IExtHostInitDataService),
        __param(7, extHostStoragePaths_1.IExtensionStoragePaths),
        __param(8, extHostTunnelService_1.IExtHostTunnelService),
        __param(9, extHostTerminalService_1.IExtHostTerminalService)
    ], AbstractExtHostExtensionService);
    exports.AbstractExtHostExtensionService = AbstractExtHostExtensionService;
    function getTelemetryActivationEvent(extensionDescription, reason) {
        const event = {
            id: extensionDescription.identifier.value,
            name: extensionDescription.name,
            extensionVersion: extensionDescription.version,
            publisherDisplayName: extensionDescription.publisher,
            activationEvents: extensionDescription.activationEvents ? extensionDescription.activationEvents.join(',') : null,
            isBuiltin: extensionDescription.isBuiltin,
            reason: reason.activationEvent,
            reasonId: reason.extensionId.value,
        };
        return event;
    }
    exports.IExtHostExtensionService = instantiation_1.createDecorator('IExtHostExtensionService');
});
//# __sourceMappingURL=extHostExtensionService.js.map