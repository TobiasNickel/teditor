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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService"], function (require, exports, instantiation_1, log_1, extHostProtocol, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullApiDeprecationService = exports.ExtHostApiDeprecationService = exports.IExtHostApiDeprecationService = void 0;
    exports.IExtHostApiDeprecationService = instantiation_1.createDecorator('IExtHostApiDeprecationService');
    let ExtHostApiDeprecationService = class ExtHostApiDeprecationService {
        constructor(rpc, _extHostLogService) {
            this._extHostLogService = _extHostLogService;
            this._reportedUsages = new Set();
            this._telemetryShape = rpc.getProxy(extHostProtocol.MainContext.MainThreadTelemetry);
        }
        report(apiId, extension, migrationSuggestion) {
            const key = this.getUsageKey(apiId, extension);
            if (this._reportedUsages.has(key)) {
                return;
            }
            this._reportedUsages.add(key);
            if (extension.isUnderDevelopment) {
                this._extHostLogService.warn(`[Deprecation Warning] '${apiId}' is deprecated. ${migrationSuggestion}`);
            }
            this._telemetryShape.$publicLog2('extHostDeprecatedApiUsage', {
                extensionId: extension.identifier.value,
                apiId: apiId,
            });
        }
        getUsageKey(apiId, extension) {
            return `${apiId}-${extension.identifier.value}`;
        }
    };
    ExtHostApiDeprecationService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostApiDeprecationService);
    exports.ExtHostApiDeprecationService = ExtHostApiDeprecationService;
    exports.NullApiDeprecationService = Object.freeze(new class {
        report(_apiId, _extension, _warningMessage) {
            // noop
        }
    }());
});
//# __sourceMappingURL=extHostApiDeprecationService.js.map