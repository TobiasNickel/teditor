/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/remote/common/remoteHosts", "vs/platform/remote/common/tunnel"], function (require, exports, uri_1, remoteHosts_1, tunnel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewPortMappingManager = void 0;
    /**
     * Manages port mappings for a single webview.
     */
    class WebviewPortMappingManager {
        constructor(_getExtensionLocation, _getMappings, tunnelService) {
            this._getExtensionLocation = _getExtensionLocation;
            this._getMappings = _getMappings;
            this.tunnelService = tunnelService;
            this._tunnels = new Map();
        }
        async getRedirect(resolveAuthority, url) {
            const uri = uri_1.URI.parse(url);
            const requestLocalHostInfo = tunnel_1.extractLocalHostUriMetaDataForPortMapping(uri);
            if (!requestLocalHostInfo) {
                return undefined;
            }
            for (const mapping of this._getMappings()) {
                if (mapping.webviewPort === requestLocalHostInfo.port) {
                    const extensionLocation = this._getExtensionLocation();
                    if (extensionLocation && extensionLocation.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                        const tunnel = await this.getOrCreateTunnel(resolveAuthority, mapping.extensionHostPort);
                        if (tunnel) {
                            if (tunnel.tunnelLocalPort === mapping.webviewPort) {
                                return undefined;
                            }
                            return encodeURI(uri.with({
                                authority: `127.0.0.1:${tunnel.tunnelLocalPort}`,
                            }).toString(true));
                        }
                    }
                    if (mapping.webviewPort !== mapping.extensionHostPort) {
                        return encodeURI(uri.with({
                            authority: `${requestLocalHostInfo.address}:${mapping.extensionHostPort}`
                        }).toString(true));
                    }
                }
            }
            return undefined;
        }
        dispose() {
            for (const tunnel of this._tunnels.values()) {
                tunnel.then(tunnel => tunnel.dispose());
            }
            this._tunnels.clear();
        }
        getOrCreateTunnel(remoteAuthority, remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                return existing;
            }
            const tunnel = this.tunnelService.openTunnel(remoteAuthority, undefined, remotePort);
            if (tunnel) {
                this._tunnels.set(remotePort, tunnel);
            }
            return tunnel;
        }
    }
    exports.WebviewPortMappingManager = WebviewPortMappingManager;
});
//# __sourceMappingURL=webviewPortMapping.js.map