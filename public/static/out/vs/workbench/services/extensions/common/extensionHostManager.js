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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/rpcProtocol", "vs/platform/remote/common/remoteAuthorityResolver", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorService", "vs/base/common/stopwatch", "vs/base/common/buffer"], function (require, exports, errors, event_1, lifecycle_1, strings, environmentService_1, instantiation_1, extHostCustomers_1, extHost_protocol_1, rpcProtocol_1, remoteAuthorityResolver_1, nls, actions_1, editorService_1, stopwatch_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostManager = void 0;
    // Enable to see detailed message communication between window and extension host
    const LOG_EXTENSION_HOST_COMMUNICATION = false;
    const LOG_USE_COLORS = true;
    const NO_OP_VOID_PROMISE = Promise.resolve(undefined);
    let ExtensionHostManager = class ExtensionHostManager extends lifecycle_1.Disposable {
        constructor(extensionHost, initialActivationEvents, _instantiationService, _environmentService) {
            super();
            this._instantiationService = _instantiationService;
            this._environmentService = _environmentService;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._finishedActivateEvents = Object.create(null);
            this._rpcProtocol = null;
            this._customers = [];
            this._extensionHost = extensionHost;
            this.kind = this._extensionHost.kind;
            this.onDidExit = this._extensionHost.onExit;
            this._proxy = this._extensionHost.start().then((protocol) => {
                return { value: this._createExtensionHostCustomers(protocol) };
            }, (err) => {
                console.error('Error received from starting extension host');
                console.error(err);
                return null;
            });
            this._proxy.then(() => {
                initialActivationEvents.forEach((activationEvent) => this.activateByEvent(activationEvent));
                this._register(registerLatencyTestProvider({
                    measure: () => this.measure()
                }));
            });
            this._resolveAuthorityAttempt = 0;
        }
        dispose() {
            if (this._extensionHost) {
                this._extensionHost.dispose();
            }
            if (this._rpcProtocol) {
                this._rpcProtocol.dispose();
            }
            for (let i = 0, len = this._customers.length; i < len; i++) {
                const customer = this._customers[i];
                try {
                    customer.dispose();
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                }
            }
            this._proxy = null;
            super.dispose();
        }
        async measure() {
            const proxy = await this._getProxy();
            if (!proxy) {
                return null;
            }
            const latency = await this._measureLatency(proxy);
            const down = await this._measureDown(proxy);
            const up = await this._measureUp(proxy);
            return {
                remoteAuthority: this._extensionHost.remoteAuthority,
                latency,
                down,
                up
            };
        }
        async _getProxy() {
            if (!this._proxy) {
                return null;
            }
            const p = await this._proxy;
            if (!p) {
                return null;
            }
            return p.value;
        }
        async _measureLatency(proxy) {
            const COUNT = 10;
            let sum = 0;
            for (let i = 0; i < COUNT; i++) {
                const sw = stopwatch_1.StopWatch.create(true);
                await proxy.$test_latency(i);
                sw.stop();
                sum += sw.elapsed();
            }
            return (sum / COUNT);
        }
        static _convert(byteCount, elapsedMillis) {
            return (byteCount * 1000 * 8) / elapsedMillis;
        }
        async _measureUp(proxy) {
            const SIZE = 10 * 1024 * 1024; // 10MB
            let buff = buffer_1.VSBuffer.alloc(SIZE);
            let value = Math.ceil(Math.random() * 256);
            for (let i = 0; i < buff.byteLength; i++) {
                buff.writeUInt8(i, value);
            }
            const sw = stopwatch_1.StopWatch.create(true);
            await proxy.$test_up(buff);
            sw.stop();
            return ExtensionHostManager._convert(SIZE, sw.elapsed());
        }
        async _measureDown(proxy) {
            const SIZE = 10 * 1024 * 1024; // 10MB
            const sw = stopwatch_1.StopWatch.create(true);
            await proxy.$test_down(SIZE);
            sw.stop();
            return ExtensionHostManager._convert(SIZE, sw.elapsed());
        }
        _createExtensionHostCustomers(protocol) {
            let logger = null;
            if (LOG_EXTENSION_HOST_COMMUNICATION || this._environmentService.logExtensionHostCommunication) {
                logger = new RPCLogger();
            }
            this._rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, logger);
            this._register(this._rpcProtocol.onDidChangeResponsiveState((responsiveState) => this._onDidChangeResponsiveState.fire(responsiveState)));
            const extHostContext = {
                remoteAuthority: this._extensionHost.remoteAuthority,
                getProxy: (identifier) => this._rpcProtocol.getProxy(identifier),
                set: (identifier, instance) => this._rpcProtocol.set(identifier, instance),
                assertRegistered: (identifiers) => this._rpcProtocol.assertRegistered(identifiers),
            };
            // Named customers
            const namedCustomers = extHostCustomers_1.ExtHostCustomersRegistry.getNamedCustomers();
            for (let i = 0, len = namedCustomers.length; i < len; i++) {
                const [id, ctor] = namedCustomers[i];
                const instance = this._instantiationService.createInstance(ctor, extHostContext);
                this._customers.push(instance);
                this._rpcProtocol.set(id, instance);
            }
            // Customers
            const customers = extHostCustomers_1.ExtHostCustomersRegistry.getCustomers();
            for (const ctor of customers) {
                const instance = this._instantiationService.createInstance(ctor, extHostContext);
                this._customers.push(instance);
            }
            // Check that no named customers are missing
            const expected = Object.keys(extHost_protocol_1.MainContext).map((key) => extHost_protocol_1.MainContext[key]);
            this._rpcProtocol.assertRegistered(expected);
            return this._rpcProtocol.getProxy(extHost_protocol_1.ExtHostContext.ExtHostExtensionService);
        }
        async activate(extension, reason) {
            const proxy = await this._getProxy();
            if (!proxy) {
                return false;
            }
            return proxy.$activate(extension, reason);
        }
        activateByEvent(activationEvent) {
            if (this._finishedActivateEvents[activationEvent] || !this._proxy) {
                return NO_OP_VOID_PROMISE;
            }
            return this._proxy.then((proxy) => {
                if (!proxy) {
                    // this case is already covered above and logged.
                    // i.e. the extension host could not be started
                    return NO_OP_VOID_PROMISE;
                }
                return proxy.value.$activateByEvent(activationEvent);
            }).then(() => {
                this._finishedActivateEvents[activationEvent] = true;
            });
        }
        async getInspectPort(tryEnableInspector) {
            if (this._extensionHost) {
                if (tryEnableInspector) {
                    await this._extensionHost.enableInspectPort();
                }
                let port = this._extensionHost.getInspectPort();
                if (port) {
                    return port;
                }
            }
            return 0;
        }
        async resolveAuthority(remoteAuthority) {
            const authorityPlusIndex = remoteAuthority.indexOf('+');
            if (authorityPlusIndex === -1) {
                // This authority does not need to be resolved, simply parse the port number
                const pieces = remoteAuthority.split(':');
                return Promise.resolve({
                    authority: {
                        authority: remoteAuthority,
                        host: pieces[0],
                        port: parseInt(pieces[1], 10)
                    }
                });
            }
            const proxy = await this._getProxy();
            if (!proxy) {
                throw new Error(`Cannot resolve authority`);
            }
            this._resolveAuthorityAttempt++;
            const result = await proxy.$resolveAuthority(remoteAuthority, this._resolveAuthorityAttempt);
            if (result.type === 'ok') {
                return result.value;
            }
            else {
                throw new remoteAuthorityResolver_1.RemoteAuthorityResolverError(result.error.message, result.error.code, result.error.detail);
            }
        }
        async start(enabledExtensionIds) {
            const proxy = await this._getProxy();
            if (!proxy) {
                return;
            }
            return proxy.$startExtensionHost(enabledExtensionIds);
        }
        async deltaExtensions(toAdd, toRemove) {
            const proxy = await this._getProxy();
            if (!proxy) {
                return;
            }
            return proxy.$deltaExtensions(toAdd, toRemove);
        }
        async setRemoteEnvironment(env) {
            const proxy = await this._getProxy();
            if (!proxy) {
                return;
            }
            return proxy.$setRemoteEnvironment(env);
        }
    };
    ExtensionHostManager = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService)
    ], ExtensionHostManager);
    exports.ExtensionHostManager = ExtensionHostManager;
    const colorTables = [
        ['#2977B1', '#FC802D', '#34A13A', '#D3282F', '#9366BA'],
        ['#8B564C', '#E177C0', '#7F7F7F', '#BBBE3D', '#2EBECD']
    ];
    function prettyWithoutArrays(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && typeof data === 'object' && typeof data.toString === 'function') {
            let result = data.toString();
            if (result !== '[object Object]') {
                return result;
            }
        }
        return data;
    }
    function pretty(data) {
        if (Array.isArray(data)) {
            return data.map(prettyWithoutArrays);
        }
        return prettyWithoutArrays(data);
    }
    class RPCLogger {
        constructor() {
            this._totalIncoming = 0;
            this._totalOutgoing = 0;
        }
        _log(direction, totalLength, msgLength, req, initiator, str, data) {
            data = pretty(data);
            const colorTable = colorTables[initiator];
            const color = LOG_USE_COLORS ? colorTable[req % colorTable.length] : '#000000';
            let args = [`%c[${direction}]%c[${strings.pad(totalLength, 7, ' ')}]%c[len: ${strings.pad(msgLength, 5, ' ')}]%c${strings.pad(req, 5, ' ')} - ${str}`, 'color: darkgreen', 'color: grey', 'color: grey', `color: ${color}`];
            if (/\($/.test(str)) {
                args = args.concat(data);
                args.push(')');
            }
            else {
                args.push(data);
            }
            console.log.apply(console, args);
        }
        logIncoming(msgLength, req, initiator, str, data) {
            this._totalIncoming += msgLength;
            this._log('Ext \u2192 Win', this._totalIncoming, msgLength, req, initiator, str, data);
        }
        logOutgoing(msgLength, req, initiator, str, data) {
            this._totalOutgoing += msgLength;
            this._log('Win \u2192 Ext', this._totalOutgoing, msgLength, req, initiator, str, data);
        }
    }
    let providers = [];
    function registerLatencyTestProvider(provider) {
        providers.push(provider);
        return {
            dispose: () => {
                for (let i = 0; i < providers.length; i++) {
                    if (providers[i] === provider) {
                        providers.splice(i, 1);
                        return;
                    }
                }
            }
        };
    }
    function getLatencyTestProviders() {
        return providers.slice(0);
    }
    actions_1.registerAction2(class MeasureExtHostLatencyAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.measureExtHostLatency',
                title: {
                    value: nls.localize('measureExtHostLatency', "Measure Extension Host Latency"),
                    original: 'Measure Extension Host Latency'
                },
                category: nls.localize('developer', "Developer"),
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const measurements = await Promise.all(getLatencyTestProviders().map(provider => provider.measure()));
            editorService.openEditor({ contents: measurements.map(MeasureExtHostLatencyAction._print).join('\n\n'), options: { pinned: true } });
        }
        static _print(m) {
            if (!m) {
                return '';
            }
            return `${m.remoteAuthority ? `Authority: ${m.remoteAuthority}\n` : ``}Roundtrip latency: ${m.latency.toFixed(3)}ms\nUp: ${MeasureExtHostLatencyAction._printSpeed(m.up)}\nDown: ${MeasureExtHostLatencyAction._printSpeed(m.down)}\n`;
        }
        static _printSpeed(n) {
            if (n <= 1024) {
                return `${n} bps`;
            }
            if (n < 1024 * 1024) {
                return `${(n / 1024).toFixed(1)} kbps`;
            }
            return `${(n / 1024 / 1024).toFixed(1)} Mbps`;
        }
    });
});
//# __sourceMappingURL=extensionHostManager.js.map