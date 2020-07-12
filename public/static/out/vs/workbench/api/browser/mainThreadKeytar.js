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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/platform/credentials/common/credentials"], function (require, exports, extHostCustomers_1, extHost_protocol_1, credentials_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadKeytar = void 0;
    let MainThreadKeytar = class MainThreadKeytar {
        constructor(_extHostContext, _credentialsService) {
            this._credentialsService = _credentialsService;
        }
        async $getPassword(service, account) {
            return this._credentialsService.getPassword(service, account);
        }
        async $setPassword(service, account, password) {
            return this._credentialsService.setPassword(service, account, password);
        }
        async $deletePassword(service, account) {
            return this._credentialsService.deletePassword(service, account);
        }
        async $findPassword(service) {
            return this._credentialsService.findPassword(service);
        }
        async $findCredentials(service) {
            return this._credentialsService.findCredentials(service);
        }
        dispose() {
            //
        }
    };
    MainThreadKeytar = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadKeytar),
        __param(1, credentials_1.ICredentialsService)
    ], MainThreadKeytar);
    exports.MainThreadKeytar = MainThreadKeytar;
});
//# __sourceMappingURL=mainThreadKeytar.js.map