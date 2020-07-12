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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/platform/log/common/fileLogService", "vs/platform/instantiation/common/instantiation", "vs/base/common/path"], function (require, exports, extHostCustomers_1, log_1, extHost_protocol_1, uri_1, fileLogService_1, instantiation_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLogService = void 0;
    let MainThreadLogService = class MainThreadLogService {
        constructor(extHostContext, _logService, _instaService) {
            this._logService = _logService;
            this._instaService = _instaService;
            this._loggers = new Map();
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLogService);
            this._logListener = _logService.onDidChangeLogLevel(level => {
                proxy.$setLevel(level);
                this._loggers.forEach(value => value.setLevel(level));
            });
        }
        dispose() {
            this._logListener.dispose();
            this._loggers.forEach(value => value.dispose());
            this._loggers.clear();
        }
        $log(file, level, message) {
            const uri = uri_1.URI.revive(file);
            let logger = this._loggers.get(uri.toString());
            if (!logger) {
                logger = this._instaService.createInstance(fileLogService_1.FileLogService, path_1.basename(file.path), uri_1.URI.revive(file), this._logService.getLevel());
                this._loggers.set(uri.toString(), logger);
            }
            logger.log(level, message);
        }
    };
    MainThreadLogService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadLog),
        __param(1, log_1.ILogService),
        __param(2, instantiation_1.IInstantiationService)
    ], MainThreadLogService);
    exports.MainThreadLogService = MainThreadLogService;
});
//# __sourceMappingURL=mainThreadLogService.js.map