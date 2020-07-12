/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostRpcService = exports.IExtHostRpcService = void 0;
    exports.IExtHostRpcService = instantiation_1.createDecorator('IExtHostRpcService');
    class ExtHostRpcService {
        constructor(rpcProtocol) {
            this.getProxy = rpcProtocol.getProxy.bind(rpcProtocol);
            this.set = rpcProtocol.set.bind(rpcProtocol);
            this.assertRegistered = rpcProtocol.assertRegistered.bind(rpcProtocol);
        }
    }
    exports.ExtHostRpcService = ExtHostRpcService;
});
//# __sourceMappingURL=extHostRpcService.js.map