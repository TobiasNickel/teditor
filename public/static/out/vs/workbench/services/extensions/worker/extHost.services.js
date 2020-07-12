/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDecorations", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTask", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/worker/extHostExtensionService", "vs/platform/log/common/log", "vs/workbench/api/worker/extHostLogService", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/api/common/extHostWindow", "vs/base/common/types"], function (require, exports, extensions_1, extHostOutput_1, extHostWorkspace_1, extHostDecorations_1, extHostConfiguration_1, extHostCommands_1, extHostDocumentsAndEditors_1, extHostTerminalService_1, extHostTask_1, extHostDebugService_1, extHostSearch_1, extHostStoragePaths_1, extHostExtensionService_1, extHostStorage_1, extHostExtensionService_2, log_1, extHostLogService_1, extHostTunnelService_1, extHostApiDeprecationService_1, extHostWindow_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // register singleton services
    extensions_1.registerSingleton(log_1.ILogService, extHostLogService_1.ExtHostLogService);
    extensions_1.registerSingleton(extHostApiDeprecationService_1.IExtHostApiDeprecationService, extHostApiDeprecationService_1.ExtHostApiDeprecationService);
    extensions_1.registerSingleton(extHostOutput_1.IExtHostOutputService, extHostOutput_1.ExtHostOutputService);
    extensions_1.registerSingleton(extHostWorkspace_1.IExtHostWorkspace, extHostWorkspace_1.ExtHostWorkspace);
    extensions_1.registerSingleton(extHostWindow_1.IExtHostWindow, extHostWindow_1.ExtHostWindow);
    extensions_1.registerSingleton(extHostDecorations_1.IExtHostDecorations, extHostDecorations_1.ExtHostDecorations);
    extensions_1.registerSingleton(extHostConfiguration_1.IExtHostConfiguration, extHostConfiguration_1.ExtHostConfiguration);
    extensions_1.registerSingleton(extHostCommands_1.IExtHostCommands, extHostCommands_1.ExtHostCommands);
    extensions_1.registerSingleton(extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors, extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors);
    extensions_1.registerSingleton(extHostStorage_1.IExtHostStorage, extHostStorage_1.ExtHostStorage);
    extensions_1.registerSingleton(extHostExtensionService_1.IExtHostExtensionService, extHostExtensionService_2.ExtHostExtensionService);
    extensions_1.registerSingleton(extHostSearch_1.IExtHostSearch, extHostSearch_1.ExtHostSearch);
    extensions_1.registerSingleton(extHostTunnelService_1.IExtHostTunnelService, extHostTunnelService_1.ExtHostTunnelService);
    extensions_1.registerSingleton(extHostTerminalService_1.IExtHostTerminalService, extHostTerminalService_1.WorkerExtHostTerminalService);
    extensions_1.registerSingleton(extHostTask_1.IExtHostTask, extHostTask_1.WorkerExtHostTask);
    extensions_1.registerSingleton(extHostDebugService_1.IExtHostDebugService, extHostDebugService_1.WorkerExtHostDebugService);
    extensions_1.registerSingleton(extHostStoragePaths_1.IExtensionStoragePaths, class extends types_1.NotImplementedProxy(String(extHostStoragePaths_1.IExtensionStoragePaths)) {
        constructor() {
            super(...arguments);
            this.whenReady = Promise.resolve();
        }
    });
});
//# __sourceMappingURL=extHost.services.js.map