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
define(["require", "exports", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteHosts", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensionManagement/common/webExtensionManagementService"], function (require, exports, nls_1, extensionManagement_1, extensionManagementIpc_1, remoteAgentService_1, remoteHosts_1, extensions_1, label_1, platform_1, instantiation_1, webExtensionManagementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManagementServerService = void 0;
    let ExtensionManagementServerService = class ExtensionManagementServerService {
        constructor(remoteAgentService, labelService, instantiationService) {
            this.localExtensionManagementServer = null;
            this.remoteExtensionManagementServer = null;
            this.webExtensionManagementServer = null;
            const remoteAgentConnection = remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const extensionManagementService = new extensionManagementIpc_1.ExtensionManagementChannelClient(remoteAgentConnection.getChannel('extensions'));
                this.remoteExtensionManagementServer = {
                    id: 'remote',
                    extensionManagementService,
                    get label() { return labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, remoteAgentConnection.remoteAuthority) || nls_1.localize('remote', "Remote"); }
                };
            }
            if (platform_1.isWeb) {
                const extensionManagementService = instantiationService.createInstance(webExtensionManagementService_1.WebExtensionManagementService);
                this.webExtensionManagementServer = {
                    id: 'web',
                    extensionManagementService,
                    label: nls_1.localize('web', "Web")
                };
            }
        }
        getExtensionManagementServer(extension) {
            if (extension.location.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                return this.remoteExtensionManagementServer;
            }
            if (this.webExtensionManagementServer) {
                return this.webExtensionManagementServer;
            }
            throw new Error(`Invalid Extension ${extension.location}`);
        }
    };
    ExtensionManagementServerService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService)
    ], ExtensionManagementServerService);
    exports.ExtensionManagementServerService = ExtensionManagementServerService;
    extensions_1.registerSingleton(extensionManagement_1.IExtensionManagementServerService, ExtensionManagementServerService);
});
//# __sourceMappingURL=extensionManagementServerService.js.map