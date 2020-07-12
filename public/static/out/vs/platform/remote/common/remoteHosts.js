/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRemoteName = exports.getRemoteAuthority = exports.REMOTE_HOST_SCHEME = void 0;
    exports.REMOTE_HOST_SCHEME = network_1.Schemas.vscodeRemote;
    function getRemoteAuthority(uri) {
        return uri.scheme === exports.REMOTE_HOST_SCHEME ? uri.authority : undefined;
    }
    exports.getRemoteAuthority = getRemoteAuthority;
    function getRemoteName(authority) {
        if (!authority) {
            return undefined;
        }
        const pos = authority.indexOf('+');
        if (pos < 0) {
            // funky? bad authority?
            return authority;
        }
        return authority.substr(0, pos);
    }
    exports.getRemoteName = getRemoteName;
});
//# __sourceMappingURL=remoteHosts.js.map