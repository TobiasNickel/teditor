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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryService", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/telemetry/browser/workbenchCommonProperties", "vs/platform/product/common/productService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, telemetry_1, telemetryUtils_1, configuration_1, lifecycle_1, environmentService_1, log_1, telemetryService_1, extensions_1, storage_1, workbenchCommonProperties_1, productService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = exports.WebTelemetryAppender = void 0;
    class WebTelemetryAppender {
        constructor(_logService, _appender) {
            this._logService = _logService;
            this._appender = _appender;
        }
        log(eventName, data) {
            this._logService.trace(`telemetry/${eventName}`, data);
            this._appender.logTelemetry(eventName, data);
        }
        flush() {
            return this._appender.flushTelemetry();
        }
    }
    exports.WebTelemetryAppender = WebTelemetryAppender;
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        constructor(environmentService, logService, configurationService, storageService, productService, remoteAgentService) {
            super();
            this.sendErrorTelemetry = false;
            if (!!productService.enableTelemetry) {
                const config = {
                    appender: telemetryUtils_1.combinedAppender(new WebTelemetryAppender(logService, remoteAgentService), new telemetryUtils_1.LogAppender(logService)),
                    commonProperties: workbenchCommonProperties_1.resolveWorkbenchCommonProperties(storageService, productService.commit, productService.version, environmentService.configuration.remoteAuthority, environmentService.options && environmentService.options.resolveCommonTelemetryProperties),
                    sendErrorTelemetry: false,
                };
                this.impl = this._register(new telemetryService_1.TelemetryService(config, configurationService));
            }
            else {
                this.impl = telemetryUtils_1.NullTelemetryService;
            }
        }
        setEnabled(value) {
            return this.impl.setEnabled(value);
        }
        get isOptedIn() {
            return this.impl.isOptedIn;
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            return this.impl.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLog2(eventName, data, anonymizeFilePaths) {
            return this.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLogError(errorEventName, data) {
            return this.impl.publicLog(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        getTelemetryInfo() {
            return this.impl.getTelemetryInfo();
        }
    };
    TelemetryService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, productService_1.IProductService),
        __param(5, remoteAgentService_1.IRemoteAgentService)
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
    extensions_1.registerSingleton(telemetry_1.ITelemetryService, TelemetryService);
});
//# __sourceMappingURL=telemetryService.js.map