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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/remote/common/tunnel", "vs/base/common/lifecycle"], function (require, exports, extHost_protocol_1, extHostTunnelService_1, extHostCustomers_1, remoteExplorerService_1, tunnel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTunnelService = void 0;
    let MainThreadTunnelService = class MainThreadTunnelService extends lifecycle_1.Disposable {
        constructor(extHostContext, remoteExplorerService, tunnelService) {
            super();
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTunnelService);
            this._register(tunnelService.onTunnelOpened(() => this._proxy.$onDidTunnelsChange()));
            this._register(tunnelService.onTunnelClosed(() => this._proxy.$onDidTunnelsChange()));
        }
        async $openTunnel(tunnelOptions) {
            const tunnel = await this.remoteExplorerService.forward(tunnelOptions.remoteAddress, tunnelOptions.localAddressPort, tunnelOptions.label);
            if (tunnel) {
                return extHostTunnelService_1.TunnelDto.fromServiceTunnel(tunnel);
            }
            return undefined;
        }
        async $closeTunnel(remote) {
            return this.remoteExplorerService.close(remote);
        }
        async $getTunnels() {
            return (await this.tunnelService.tunnels).map(tunnel => {
                return {
                    remoteAddress: { port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost },
                    localAddress: tunnel.localAddress
                };
            });
        }
        async $registerCandidateFinder() {
            this.remoteExplorerService.registerCandidateFinder(() => this._proxy.$findCandidatePorts());
        }
        async $tunnelServiceReady() {
            return this.remoteExplorerService.restore();
        }
        async $setTunnelProvider() {
            const tunnelProvider = {
                forwardPort: (tunnelOptions) => {
                    const forward = this._proxy.$forwardPort(tunnelOptions);
                    if (forward) {
                        return forward.then(tunnel => {
                            return {
                                tunnelRemotePort: tunnel.remoteAddress.port,
                                tunnelRemoteHost: tunnel.remoteAddress.host,
                                localAddress: typeof tunnel.localAddress === 'string' ? tunnel.localAddress : remoteExplorerService_1.MakeAddress(tunnel.localAddress.host, tunnel.localAddress.port),
                                tunnelLocalPort: typeof tunnel.localAddress !== 'string' ? tunnel.localAddress.port : undefined,
                                dispose: (silent) => {
                                    if (!silent) {
                                        this._proxy.$closeTunnel({ host: tunnel.remoteAddress.host, port: tunnel.remoteAddress.port });
                                    }
                                }
                            };
                        });
                    }
                    return undefined;
                }
            };
            this.tunnelService.setTunnelProvider(tunnelProvider);
        }
        async $setCandidateFilter() {
            this._register(this.remoteExplorerService.setCandidateFilter(async (candidates) => {
                const filters = await this._proxy.$filterCandidates(candidates);
                const filteredCandidates = [];
                if (filters.length !== candidates.length) {
                    return candidates;
                }
                for (let i = 0; i < candidates.length; i++) {
                    if (filters[i]) {
                        filteredCandidates.push(candidates[i]);
                    }
                }
                return filteredCandidates;
            }));
        }
        dispose() {
        }
    };
    MainThreadTunnelService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTunnelService),
        __param(1, remoteExplorerService_1.IRemoteExplorerService),
        __param(2, tunnel_1.ITunnelService)
    ], MainThreadTunnelService);
    exports.MainThreadTunnelService = MainThreadTunnelService;
});
//# __sourceMappingURL=mainThreadTunnelService.js.map