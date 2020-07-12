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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, instantiation_1, event_1, lifecycle_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncAccountService = exports.IUserDataSyncAccountService = void 0;
    exports.IUserDataSyncAccountService = instantiation_1.createDecorator('IUserDataSyncAccountService');
    let UserDataSyncAccountService = class UserDataSyncAccountService extends lifecycle_1.Disposable {
        constructor(userDataSyncStoreService) {
            super();
            this.userDataSyncStoreService = userDataSyncStoreService;
            this._onDidChangeAccount = this._register(new event_1.Emitter());
            this.onDidChangeAccount = this._onDidChangeAccount.event;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
            this.wasTokenFailed = false;
            this._register(userDataSyncStoreService.onTokenFailed(() => {
                this.updateAccount(undefined);
                this._onTokenFailed.fire(this.wasTokenFailed);
                this.wasTokenFailed = true;
            }));
            this._register(userDataSyncStoreService.onTokenSucceed(() => this.wasTokenFailed = false));
        }
        get account() { return this._account; }
        async updateAccount(account) {
            if (account && this._account ? account.token !== this._account.token || account.authenticationProviderId !== this._account.authenticationProviderId : account !== this._account) {
                this._account = account;
                if (this._account) {
                    this.userDataSyncStoreService.setAuthToken(this._account.token, this._account.authenticationProviderId);
                }
                this._onDidChangeAccount.fire(account);
            }
        }
    };
    UserDataSyncAccountService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService)
    ], UserDataSyncAccountService);
    exports.UserDataSyncAccountService = UserDataSyncAccountService;
});
//# __sourceMappingURL=userDataSyncAccount.js.map