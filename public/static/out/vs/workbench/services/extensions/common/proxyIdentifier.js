/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getStringIdentifierForProxy = exports.createExtHostContextProxyIdentifier = exports.createMainContextProxyIdentifier = exports.ProxyIdentifier = void 0;
    class ProxyIdentifier {
        constructor(isMain, sid) {
            this.isMain = isMain;
            this.sid = sid;
            this.nid = (++ProxyIdentifier.count);
        }
    }
    exports.ProxyIdentifier = ProxyIdentifier;
    ProxyIdentifier.count = 0;
    const identifiers = [];
    function createMainContextProxyIdentifier(identifier) {
        const result = new ProxyIdentifier(true, identifier);
        identifiers[result.nid] = result;
        return result;
    }
    exports.createMainContextProxyIdentifier = createMainContextProxyIdentifier;
    function createExtHostContextProxyIdentifier(identifier) {
        const result = new ProxyIdentifier(false, identifier);
        identifiers[result.nid] = result;
        return result;
    }
    exports.createExtHostContextProxyIdentifier = createExtHostContextProxyIdentifier;
    function getStringIdentifierForProxy(nid) {
        return identifiers[nid].sid;
    }
    exports.getStringIdentifierForProxy = getStringIdentifierForProxy;
});
//# __sourceMappingURL=proxyIdentifier.js.map