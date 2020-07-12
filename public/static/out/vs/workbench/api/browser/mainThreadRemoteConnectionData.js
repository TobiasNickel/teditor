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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/platform/remote/common/remoteAuthorityResolver", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService"], function (require, exports, extHostCustomers_1, extHost_protocol_1, remoteAuthorityResolver_1, lifecycle_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadRemoteConnectionData = void 0;
    let MainThreadRemoteConnectionData = class MainThreadRemoteConnectionData extends lifecycle_1.Disposable {
        constructor(extHostContext, _environmentService, remoteAuthorityResolverService) {
            super();
            this._environmentService = _environmentService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostExtensionService);
            const remoteAuthority = this._environmentService.configuration.remoteAuthority;
            if (remoteAuthority) {
                this._register(remoteAuthorityResolverService.onDidChangeConnectionData(() => {
                    const connectionData = remoteAuthorityResolverService.getConnectionData(remoteAuthority);
                    if (connectionData) {
                        this._proxy.$updateRemoteConnectionData(connectionData);
                    }
                }));
            }
        }
    };
    MainThreadRemoteConnectionData = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], MainThreadRemoteConnectionData);
    exports.MainThreadRemoteConnectionData = MainThreadRemoteConnectionData;
});
//# __sourceMappingURL=mainThreadRemoteConnectionData.js.map