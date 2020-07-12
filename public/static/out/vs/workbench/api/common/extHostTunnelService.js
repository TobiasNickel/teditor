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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/workbench/api/common/extHostRpcService"], function (require, exports, extHost_protocol_1, instantiation_1, event_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTunnelService = exports.IExtHostTunnelService = exports.TunnelDto = void 0;
    var TunnelDto;
    (function (TunnelDto) {
        function fromApiTunnel(tunnel) {
            return { remoteAddress: tunnel.remoteAddress, localAddress: tunnel.localAddress };
        }
        TunnelDto.fromApiTunnel = fromApiTunnel;
        function fromServiceTunnel(tunnel) {
            return { remoteAddress: { host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort }, localAddress: tunnel.localAddress };
        }
        TunnelDto.fromServiceTunnel = fromServiceTunnel;
    })(TunnelDto = exports.TunnelDto || (exports.TunnelDto = {}));
    exports.IExtHostTunnelService = instantiation_1.createDecorator('IExtHostTunnelService');
    let ExtHostTunnelService = class ExtHostTunnelService {
        constructor(extHostRpc) {
            this.onDidChangeTunnels = (new event_1.Emitter()).event;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTunnelService);
        }
        async openTunnel(forward) {
            return undefined;
        }
        async getTunnels() {
            return [];
        }
        async $findCandidatePorts() {
            return [];
        }
        async $filterCandidates(candidates) {
            return candidates.map(() => true);
        }
        async setTunnelExtensionFunctions(provider) {
            await this._proxy.$tunnelServiceReady();
            return { dispose: () => { } };
        }
        $forwardPort(tunnelOptions) { return undefined; }
        async $closeTunnel(remote) { }
        async $onDidTunnelsChange() { }
    };
    ExtHostTunnelService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostTunnelService);
    exports.ExtHostTunnelService = ExtHostTunnelService;
});
//# __sourceMappingURL=extHostTunnelService.js.map