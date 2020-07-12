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
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/remote/common/tunnel", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/environment/common/environmentService"], function (require, exports, event_1, instantiation_1, extensions_1, storage_1, tunnel_1, lifecycle_1, configuration_1, remoteAuthorityResolver_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelModel = exports.MakeAddress = exports.TunnelType = exports.REMOTE_EXPLORER_TYPE_KEY = exports.IRemoteExplorerService = void 0;
    exports.IRemoteExplorerService = instantiation_1.createDecorator('remoteExplorerService');
    exports.REMOTE_EXPLORER_TYPE_KEY = 'remote.explorerType';
    const TUNNELS_TO_RESTORE = 'remote.tunnels.toRestore';
    var TunnelType;
    (function (TunnelType) {
        TunnelType["Candidate"] = "Candidate";
        TunnelType["Detected"] = "Detected";
        TunnelType["Forwarded"] = "Forwarded";
        TunnelType["Add"] = "Add";
    })(TunnelType = exports.TunnelType || (exports.TunnelType = {}));
    function ToLocalHost(host) {
        if (host === '127.0.0.1') {
            host = 'localhost';
        }
        return host;
    }
    function MakeAddress(host, port) {
        return ToLocalHost(host) + ':' + port;
    }
    exports.MakeAddress = MakeAddress;
    let TunnelModel = class TunnelModel extends lifecycle_1.Disposable {
        constructor(tunnelService, storageService, configurationService, environmentService, remoteAuthorityResolverService) {
            super();
            this.tunnelService = tunnelService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this._onForwardPort = new event_1.Emitter();
            this.onForwardPort = this._onForwardPort.event;
            this._onClosePort = new event_1.Emitter();
            this.onClosePort = this._onClosePort.event;
            this._onPortName = new event_1.Emitter();
            this.onPortName = this._onPortName.event;
            this._candidates = [];
            this._onCandidatesChanged = new event_1.Emitter();
            this.onCandidatesChanged = this._onCandidatesChanged.event;
            this.forwarded = new Map();
            this.tunnelService.tunnels.then(tunnels => {
                tunnels.forEach(tunnel => {
                    if (tunnel.localAddress) {
                        this.forwarded.set(MakeAddress(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort), {
                            remotePort: tunnel.tunnelRemotePort,
                            remoteHost: tunnel.tunnelRemoteHost,
                            localAddress: tunnel.localAddress,
                            localPort: tunnel.tunnelLocalPort
                        });
                    }
                });
            });
            this.detected = new Map();
            this._register(this.tunnelService.onTunnelOpened(tunnel => {
                const key = MakeAddress(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                if ((!this.forwarded.has(key)) && tunnel.localAddress) {
                    this.forwarded.set(key, {
                        remoteHost: tunnel.tunnelRemoteHost,
                        remotePort: tunnel.tunnelRemotePort,
                        localAddress: tunnel.localAddress,
                        localPort: tunnel.tunnelLocalPort,
                        closeable: true
                    });
                    this.storeForwarded();
                }
                this._onForwardPort.fire(this.forwarded.get(key));
            }));
            this._register(this.tunnelService.onTunnelClosed(address => {
                const key = MakeAddress(address.host, address.port);
                if (this.forwarded.has(key)) {
                    this.forwarded.delete(key);
                    this.storeForwarded();
                    this._onClosePort.fire(address);
                }
            }));
        }
        async restoreForwarded() {
            var _a;
            if (this.configurationService.getValue('remote.restoreForwardedPorts')) {
                const tunnelsString = this.storageService.get(TUNNELS_TO_RESTORE, 1 /* WORKSPACE */);
                if (tunnelsString) {
                    (_a = JSON.parse(tunnelsString)) === null || _a === void 0 ? void 0 : _a.forEach(tunnel => {
                        this.forward({ host: tunnel.remoteHost, port: tunnel.remotePort }, tunnel.localPort, tunnel.name);
                    });
                }
            }
        }
        storeForwarded() {
            if (this.configurationService.getValue('remote.restoreForwardedPorts')) {
                this.storageService.store(TUNNELS_TO_RESTORE, JSON.stringify(Array.from(this.forwarded.values())), 1 /* WORKSPACE */);
            }
        }
        async forward(remote, local, name) {
            const key = MakeAddress(remote.host, remote.port);
            if (!this.forwarded.has(key)) {
                const authority = this.environmentService.configuration.remoteAuthority;
                const resolvedRemote = authority ? await this.remoteAuthorityResolverService.resolveAuthority(authority) : undefined;
                if (!resolvedRemote) {
                    return;
                }
                const tunnel = await this.tunnelService.openTunnel(resolvedRemote.authority, remote.host, remote.port, local);
                if (tunnel && tunnel.localAddress) {
                    const newForward = {
                        remoteHost: tunnel.tunnelRemoteHost,
                        remotePort: tunnel.tunnelRemotePort,
                        localPort: tunnel.tunnelLocalPort,
                        name: name,
                        closeable: true,
                        localAddress: tunnel.localAddress
                    };
                    this.forwarded.set(key, newForward);
                    this._onForwardPort.fire(newForward);
                    return tunnel;
                }
            }
        }
        name(host, port, name) {
            const key = MakeAddress(host, port);
            if (this.forwarded.has(key)) {
                this.forwarded.get(key).name = name;
                this.storeForwarded();
                this._onPortName.fire({ host, port });
            }
            else if (this.detected.has(key)) {
                this.detected.get(key).name = name;
                this._onPortName.fire({ host, port });
            }
        }
        async close(host, port) {
            return this.tunnelService.closeTunnel(host, port);
        }
        address(host, port) {
            var _a;
            const key = MakeAddress(host, port);
            return (_a = (this.forwarded.get(key) || this.detected.get(key))) === null || _a === void 0 ? void 0 : _a.localAddress;
        }
        addEnvironmentTunnels(tunnels) {
            tunnels.forEach(tunnel => {
                this.detected.set(MakeAddress(tunnel.remoteAddress.host, tunnel.remoteAddress.port), {
                    remoteHost: tunnel.remoteAddress.host,
                    remotePort: tunnel.remoteAddress.port,
                    localAddress: typeof tunnel.localAddress === 'string' ? tunnel.localAddress : MakeAddress(tunnel.localAddress.host, tunnel.localAddress.port),
                    closeable: false
                });
            });
        }
        registerCandidateFinder(finder) {
            this._candidateFinder = finder;
            this._onCandidatesChanged.fire();
        }
        setCandidateFilter(filter) {
            this._candidateFilter = filter;
        }
        get candidates() {
            return this.updateCandidates().then(() => this._candidates);
        }
        async updateCandidates() {
            if (this._candidateFinder) {
                let candidates = await this._candidateFinder();
                if (this._candidateFilter && (candidates.length > 0)) {
                    candidates = await this._candidateFilter(candidates);
                }
                this._candidates = candidates.map(value => {
                    const nullIndex = value.detail.indexOf('\0');
                    const detail = value.detail.substr(0, nullIndex > 0 ? nullIndex : value.detail.length).trim();
                    return {
                        host: ToLocalHost(value.host),
                        port: value.port,
                        detail
                    };
                });
            }
        }
        async refresh() {
            await this.updateCandidates();
            this._onCandidatesChanged.fire();
        }
    };
    TunnelModel = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], TunnelModel);
    exports.TunnelModel = TunnelModel;
    let RemoteExplorerService = class RemoteExplorerService {
        constructor(storageService, tunnelService, configurationService, environmentService, remoteAuthorityResolverService) {
            this.storageService = storageService;
            this._targetType = [];
            this._onDidChangeTargetType = new event_1.Emitter();
            this.onDidChangeTargetType = this._onDidChangeTargetType.event;
            this._onDidChangeEditable = new event_1.Emitter();
            this.onDidChangeEditable = this._onDidChangeEditable.event;
            this._tunnelModel = new TunnelModel(tunnelService, storageService, configurationService, environmentService, remoteAuthorityResolverService);
        }
        set targetType(name) {
            // Can just compare the first element of the array since there are no target overlaps
            const current = this._targetType.length > 0 ? this._targetType[0] : '';
            const newName = name.length > 0 ? name[0] : '';
            if (current !== newName) {
                this._targetType = name;
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 1 /* WORKSPACE */);
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 0 /* GLOBAL */);
                this._onDidChangeTargetType.fire(this._targetType);
            }
        }
        get targetType() {
            return this._targetType;
        }
        get tunnelModel() {
            return this._tunnelModel;
        }
        forward(remote, local, name) {
            return this.tunnelModel.forward(remote, local, name);
        }
        close(remote) {
            return this.tunnelModel.close(remote.host, remote.port);
        }
        setTunnelInformation(tunnelInformation) {
            if (tunnelInformation && tunnelInformation.environmentTunnels) {
                this.tunnelModel.addEnvironmentTunnels(tunnelInformation.environmentTunnels);
            }
        }
        setEditable(tunnelItem, data) {
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { tunnelItem, data };
            }
            this._onDidChangeEditable.fire(tunnelItem);
        }
        getEditableData(tunnelItem) {
            var _a;
            return (this._editable &&
                ((!tunnelItem && (tunnelItem === this._editable.tunnelItem)) ||
                    (tunnelItem && (((_a = this._editable.tunnelItem) === null || _a === void 0 ? void 0 : _a.remotePort) === tunnelItem.remotePort) && (this._editable.tunnelItem.remoteHost === tunnelItem.remoteHost)))) ?
                this._editable.data : undefined;
        }
        registerCandidateFinder(finder) {
            this.tunnelModel.registerCandidateFinder(finder);
        }
        setCandidateFilter(filter) {
            if (!filter) {
                return {
                    dispose: () => { }
                };
            }
            this.tunnelModel.setCandidateFilter(filter);
            return {
                dispose: () => {
                    this.tunnelModel.setCandidateFilter(undefined);
                }
            };
        }
        refresh() {
            return this.tunnelModel.refresh();
        }
        restore() {
            return this.tunnelModel.restoreForwarded();
        }
    };
    RemoteExplorerService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, tunnel_1.ITunnelService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], RemoteExplorerService);
    extensions_1.registerSingleton(exports.IRemoteExplorerService, RemoteExplorerService, true);
});
//# __sourceMappingURL=remoteExplorerService.js.map