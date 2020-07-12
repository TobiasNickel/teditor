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
define(["require", "exports", "vs/platform/remote/common/tunnel", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService"], function (require, exports, tunnel_1, lifecycle_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelFactoryContribution = void 0;
    let TunnelFactoryContribution = class TunnelFactoryContribution extends lifecycle_1.Disposable {
        constructor(tunnelService, workbenchEnvironmentService) {
            var _a, _b;
            super();
            const tunnelFactory = (_b = (_a = workbenchEnvironmentService.options) === null || _a === void 0 ? void 0 : _a.tunnelProvider) === null || _b === void 0 ? void 0 : _b.tunnelFactory;
            if (tunnelFactory) {
                this._register(tunnelService.setTunnelProvider({
                    forwardPort: (tunnelOptions) => {
                        const tunnelPromise = tunnelFactory(tunnelOptions);
                        if (!tunnelPromise) {
                            return undefined;
                        }
                        return new Promise(resolve => {
                            tunnelPromise.then(tunnel => {
                                const remoteTunnel = {
                                    tunnelRemotePort: tunnel.remoteAddress.port,
                                    tunnelRemoteHost: tunnel.remoteAddress.host,
                                    localAddress: tunnel.localAddress,
                                    dispose: tunnel.dispose
                                };
                                resolve(remoteTunnel);
                            });
                        });
                    }
                }));
            }
        }
    };
    TunnelFactoryContribution = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], TunnelFactoryContribution);
    exports.TunnelFactoryContribution = TunnelFactoryContribution;
});
//# __sourceMappingURL=tunnelFactory.js.map