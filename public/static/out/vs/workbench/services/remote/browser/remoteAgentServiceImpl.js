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
define(["require", "exports", "vs/workbench/services/environment/common/environmentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/abstractRemoteAgentService", "vs/platform/product/common/productService", "vs/platform/remote/browser/browserSocketFactory", "vs/platform/sign/common/sign", "vs/platform/log/common/log"], function (require, exports, environmentService_1, remoteAuthorityResolver_1, abstractRemoteAgentService_1, productService_1, browserSocketFactory_1, sign_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentService = void 0;
    let RemoteAgentService = class RemoteAgentService extends abstractRemoteAgentService_1.AbstractRemoteAgentService {
        constructor(webSocketFactory, environmentService, productService, remoteAuthorityResolverService, signService, logService) {
            super(environmentService, remoteAuthorityResolverService);
            this._connection = null;
            this.socketFactory = new browserSocketFactory_1.BrowserSocketFactory(webSocketFactory);
            const remoteAuthority = environmentService.configuration.remoteAuthority;
            if (remoteAuthority) {
                this._connection = this._register(new abstractRemoteAgentService_1.RemoteAgentConnection(remoteAuthority, productService.commit, this.socketFactory, remoteAuthorityResolverService, signService, logService));
            }
        }
        getConnection() {
            return this._connection;
        }
    };
    RemoteAgentService = __decorate([
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, productService_1.IProductService),
        __param(3, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(4, sign_1.ISignService),
        __param(5, log_1.ILogService)
    ], RemoteAgentService);
    exports.RemoteAgentService = RemoteAgentService;
});
//# __sourceMappingURL=remoteAgentServiceImpl.js.map