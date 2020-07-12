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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/environment/common/environment"], function (require, exports, log_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncLogService = void 0;
    let UserDataSyncLogService = class UserDataSyncLogService extends log_1.AbstractLogService {
        constructor(loggerService, environmentService) {
            super();
            this.logger = this._register(loggerService.getLogger(environmentService.userDataSyncLogResource));
        }
        trace(message, ...args) {
            this.logger.trace(message, ...args);
        }
        debug(message, ...args) {
            this.logger.debug(message, ...args);
        }
        info(message, ...args) {
            this.logger.info(message, ...args);
        }
        warn(message, ...args) {
            this.logger.warn(message, ...args);
        }
        error(message, ...args) {
            this.logger.error(message, ...args);
        }
        critical(message, ...args) {
            this.logger.critical(message, ...args);
        }
        flush() {
            this.logger.flush();
        }
    };
    UserDataSyncLogService = __decorate([
        __param(0, log_1.ILoggerService),
        __param(1, environment_1.IEnvironmentService)
    ], UserDataSyncLogService);
    exports.UserDataSyncLogService = UserDataSyncLogService;
});
//# __sourceMappingURL=userDataSyncLog.js.map