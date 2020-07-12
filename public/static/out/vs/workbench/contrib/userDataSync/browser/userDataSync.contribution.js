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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/userDataSync/browser/userDataSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/notification/common/notification", "vs/base/common/lifecycle", "vs/nls", "vs/base/common/platform"], function (require, exports, contributions_1, platform_1, userDataSync_1, userDataSync_2, notification_1, lifecycle_1, nls_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncReportIssueContribution = class UserDataSyncReportIssueContribution extends lifecycle_1.Disposable {
        constructor(userDataAutoSyncService, notificationService) {
            super();
            this.notificationService = notificationService;
            this._register(userDataAutoSyncService.onError(error => this.onAutoSyncError(error)));
        }
        onAutoSyncError(error) {
            switch (error.code) {
                case userDataSync_2.UserDataSyncErrorCode.LocalTooManyRequests:
                case userDataSync_2.UserDataSyncErrorCode.TooManyRequests:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: nls_1.localize('too many requests', "Turned off syncing preferences on this device because it is making too many requests."),
                    });
                    return;
            }
        }
    };
    UserDataSyncReportIssueContribution = __decorate([
        __param(0, userDataSync_2.IUserDataAutoSyncService),
        __param(1, notification_1.INotificationService)
    ], UserDataSyncReportIssueContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(userDataSync_1.UserDataSyncWorkbenchContribution, 2 /* Ready */);
    if (platform_2.isWeb) {
        workbenchRegistry.registerWorkbenchContribution(UserDataSyncReportIssueContribution, 2 /* Ready */);
    }
});
//# __sourceMappingURL=userDataSync.contribution.js.map