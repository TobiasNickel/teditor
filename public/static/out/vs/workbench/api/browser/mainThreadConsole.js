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
define(["require", "exports", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/platform/environment/common/environment", "vs/base/common/console", "vs/workbench/services/extensions/common/remoteConsoleUtil", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/platform/log/common/log", "vs/platform/debug/common/extensionHostDebug"], function (require, exports, extHostCustomers_1, extHost_protocol_1, environment_1, console_1, remoteConsoleUtil_1, extensionDevOptions_1, log_1, extensionHostDebug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadConsole = void 0;
    let MainThreadConsole = class MainThreadConsole {
        constructor(extHostContext, _environmentService, _logService, _extensionHostDebugService) {
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._extensionHostDebugService = _extensionHostDebugService;
            const devOpts = extensionDevOptions_1.parseExtensionDevOptions(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
        }
        dispose() {
            //
        }
        $logExtensionHostMessage(entry) {
            // Send to local console unless we run tests from cli
            if (!this._isExtensionDevTestFromCli) {
                console_1.log(entry, 'Extension Host');
            }
            // Log on main side if running tests from cli
            if (this._isExtensionDevTestFromCli) {
                remoteConsoleUtil_1.logRemoteEntry(this._logService, entry);
            }
            // Broadcast to other windows if we are in development mode
            else if (this._environmentService.debugExtensionHost.debugId && (!this._environmentService.isBuilt || this._isExtensionDevHost)) {
                this._extensionHostDebugService.logToSession(this._environmentService.debugExtensionHost.debugId, entry);
            }
        }
    };
    MainThreadConsole = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadConsole),
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, extensionHostDebug_1.IExtensionHostDebugService)
    ], MainThreadConsole);
    exports.MainThreadConsole = MainThreadConsole;
});
//# __sourceMappingURL=mainThreadConsole.js.map