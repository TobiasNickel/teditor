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
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, event_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelService = exports.AbstractTunnelService = exports.extractLocalHostUriMetaDataForPortMapping = exports.ITunnelService = void 0;
    exports.ITunnelService = instantiation_1.createDecorator('tunnelService');
    function extractLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https') {
            return undefined;
        }
        const localhostMatch = /^(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)$/.exec(uri.authority);
        if (!localhostMatch) {
            return undefined;
        }
        return {
            address: localhostMatch[1],
            port: +localhostMatch[2],
        };
    }
    exports.extractLocalHostUriMetaDataForPortMapping = extractLocalHostUriMetaDataForPortMapping;
    let AbstractTunnelService = class AbstractTunnelService {
        constructor(logService) {
            this.logService = logService;
            this._onTunnelOpened = new event_1.Emitter();
            this.onTunnelOpened = this._onTunnelOpened.event;
            this._onTunnelClosed = new event_1.Emitter();
            this.onTunnelClosed = this._onTunnelClosed.event;
            this._tunnels = new Map();
        }
        setTunnelProvider(provider) {
            if (!provider) {
                return {
                    dispose: () => { }
                };
            }
            this._tunnelProvider = provider;
            return {
                dispose: () => {
                    this._tunnelProvider = undefined;
                }
            };
        }
        get tunnels() {
            const promises = [];
            Array.from(this._tunnels.values()).forEach(portMap => Array.from(portMap.values()).forEach(x => promises.push(x.value)));
            return Promise.all(promises);
        }
        dispose() {
            for (const portMap of this._tunnels.values()) {
                for (const { value } of portMap.values()) {
                    value.then(tunnel => tunnel.dispose());
                }
                portMap.clear();
            }
            this._tunnels.clear();
        }
        openTunnel(resolvedAuthority, remoteHost, remotePort, localPort) {
            if (!resolvedAuthority) {
                return undefined;
            }
            if (!remoteHost || (remoteHost === '127.0.0.1')) {
                remoteHost = 'localhost';
            }
            const resolvedTunnel = this.retainOrCreateTunnel(resolvedAuthority, remoteHost, remotePort, localPort);
            if (!resolvedTunnel) {
                return resolvedTunnel;
            }
            return resolvedTunnel.then(tunnel => {
                const newTunnel = this.makeTunnel(tunnel);
                if (tunnel.tunnelRemoteHost !== remoteHost || tunnel.tunnelRemotePort !== remotePort) {
                    this.logService.warn('Created tunnel does not match requirements of requested tunnel. Host or port mismatch.');
                }
                this._onTunnelOpened.fire(newTunnel);
                return newTunnel;
            });
        }
        makeTunnel(tunnel) {
            return {
                tunnelRemotePort: tunnel.tunnelRemotePort,
                tunnelRemoteHost: tunnel.tunnelRemoteHost,
                tunnelLocalPort: tunnel.tunnelLocalPort,
                localAddress: tunnel.localAddress,
                dispose: () => {
                    const existingHost = this._tunnels.get(tunnel.tunnelRemoteHost);
                    if (existingHost) {
                        const existing = existingHost.get(tunnel.tunnelRemotePort);
                        if (existing) {
                            existing.refcount--;
                            this.tryDisposeTunnel(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort, existing);
                        }
                    }
                }
            };
        }
        async tryDisposeTunnel(remoteHost, remotePort, tunnel) {
            if (tunnel.refcount <= 0) {
                const disposePromise = tunnel.value.then(tunnel => {
                    tunnel.dispose(true);
                    this._onTunnelClosed.fire({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort });
                });
                if (this._tunnels.has(remoteHost)) {
                    this._tunnels.get(remoteHost).delete(remotePort);
                }
                return disposePromise;
            }
        }
        async closeTunnel(remoteHost, remotePort) {
            const portMap = this._tunnels.get(remoteHost);
            if (portMap && portMap.has(remotePort)) {
                const value = portMap.get(remotePort);
                value.refcount = 0;
                await this.tryDisposeTunnel(remoteHost, remotePort, value);
            }
        }
        addTunnelToMap(remoteHost, remotePort, tunnel) {
            if (!this._tunnels.has(remoteHost)) {
                this._tunnels.set(remoteHost, new Map());
            }
            this._tunnels.get(remoteHost).set(remotePort, { refcount: 1, value: tunnel });
        }
    };
    AbstractTunnelService = __decorate([
        __param(0, log_1.ILogService)
    ], AbstractTunnelService);
    exports.AbstractTunnelService = AbstractTunnelService;
    class TunnelService extends AbstractTunnelService {
        retainOrCreateTunnel(_resolveRemoteAuthority, remoteHost, remotePort, localPort) {
            const portMap = this._tunnels.get(remoteHost);
            const existing = portMap ? portMap.get(remotePort) : undefined;
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            if (this._tunnelProvider) {
                const tunnel = this._tunnelProvider.forwardPort({ remoteAddress: { host: remoteHost, port: remotePort } });
                if (tunnel) {
                    this.addTunnelToMap(remoteHost, remotePort, tunnel);
                }
                return tunnel;
            }
            return undefined;
        }
    }
    exports.TunnelService = TunnelService;
});
//# __sourceMappingURL=tunnel.js.map