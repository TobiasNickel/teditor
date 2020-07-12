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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/event", "vs/platform/userDataSync/common/userDataAutoSyncService", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/host/browser/host", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/userDataSync/browser/userDataSyncTrigger", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, userDataSync_1, event_1, userDataAutoSyncService_1, instantiation_1, host_1, userDataSyncAccount_1, telemetry_1, userDataSyncTrigger_1, storage_1, environment_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    let UserDataAutoSyncService = class UserDataAutoSyncService extends userDataAutoSyncService_1.UserDataAutoSyncService {
        constructor(userDataSyncStoreService, userDataSyncResourceEnablementService, userDataSyncService, logService, authTokenService, instantiationService, hostService, telemetryService, userDataSyncMachinesService, storageService, environmentService) {
            super(userDataSyncStoreService, userDataSyncResourceEnablementService, userDataSyncService, logService, authTokenService, telemetryService, userDataSyncMachinesService, storageService, environmentService);
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.map(hostService.onDidChangeFocus, () => 'windowFocus'), instantiationService.createInstance(userDataSyncTrigger_1.UserDataSyncTrigger).onDidTriggerSync), (last, source) => last ? [...last, source] : [source], 1000)(sources => this.triggerSync(sources, true)));
        }
    };
    UserDataAutoSyncService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(2, userDataSync_1.IUserDataSyncService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, host_1.IHostService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(9, storage_1.IStorageService),
        __param(10, environment_1.IEnvironmentService)
    ], UserDataAutoSyncService);
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
});
//# __sourceMappingURL=userDataAutoSyncService.js.map