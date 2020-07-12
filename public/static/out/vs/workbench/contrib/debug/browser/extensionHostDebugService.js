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
define(["require", "exports", "vs/platform/debug/common/extensionHostDebugIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/instantiation/common/extensions", "vs/platform/debug/common/extensionHostDebug", "vs/workbench/contrib/debug/common/debug", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspaces/common/workspaces", "vs/platform/log/common/log"], function (require, exports, extensionHostDebugIpc_1, remoteAgentService_1, extensions_1, extensionHostDebug_1, debug_1, event_1, uri_1, environmentService_1, workspaces_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserExtensionHostDebugService = class BrowserExtensionHostDebugService extends extensionHostDebugIpc_1.ExtensionHostDebugChannelClient {
        constructor(remoteAgentService, environmentService, logService) {
            const connection = remoteAgentService.getConnection();
            let channel;
            if (connection) {
                channel = connection.getChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName);
            }
            else {
                channel = { call: async () => undefined, listen: () => event_1.Event.None };
                // TODO@weinand TODO@isidorn fallback?
                logService.warn('Extension Host Debugging not available due to missing connection.');
            }
            super(channel);
            if (environmentService.options && environmentService.options.workspaceProvider) {
                this.workspaceProvider = environmentService.options.workspaceProvider;
            }
            else {
                this.workspaceProvider = { open: async () => undefined, workspace: undefined };
                logService.warn('Extension Host Debugging not available due to missing workspace provider.');
            }
            // Reload window on reload request
            this._register(this.onReload(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    window.location.reload();
                }
            }));
            // Close window on close request
            this._register(this.onClose(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    window.close();
                }
            }));
        }
        openExtensionDevelopmentHostWindow(args, env) {
            // Find out which workspace to open debug window on
            let debugWorkspace = undefined;
            const folderUriArg = this.findArgument('folder-uri', args);
            if (folderUriArg) {
                debugWorkspace = { folderUri: uri_1.URI.parse(folderUriArg) };
            }
            else {
                const fileUriArg = this.findArgument('file-uri', args);
                if (fileUriArg && workspaces_1.hasWorkspaceFileExtension(fileUriArg)) {
                    debugWorkspace = { workspaceUri: uri_1.URI.parse(fileUriArg) };
                }
            }
            // Add environment parameters required for debug to work
            const environment = new Map();
            const fileUriArg = this.findArgument('file-uri', args);
            if (fileUriArg && !workspaces_1.hasWorkspaceFileExtension(fileUriArg)) {
                environment.set('openFile', fileUriArg);
            }
            const extensionDevelopmentPath = this.findArgument('extensionDevelopmentPath', args);
            if (extensionDevelopmentPath) {
                environment.set('extensionDevelopmentPath', extensionDevelopmentPath);
            }
            const extensionTestsPath = this.findArgument('extensionTestsPath', args);
            if (extensionTestsPath) {
                environment.set('extensionTestsPath', extensionTestsPath);
            }
            const debugId = this.findArgument('debugId', args);
            if (debugId) {
                environment.set('debugId', debugId);
            }
            const inspectBrkExtensions = this.findArgument('inspect-brk-extensions', args);
            if (inspectBrkExtensions) {
                environment.set('inspect-brk-extensions', inspectBrkExtensions);
            }
            const inspectExtensions = this.findArgument('inspect-extensions', args);
            if (inspectExtensions) {
                environment.set('inspect-extensions', inspectExtensions);
            }
            // Open debug window as new window. Pass ParsedArgs over.
            return this.workspaceProvider.open(debugWorkspace, {
                reuse: false,
                payload: Array.from(environment.entries()) // mandatory properties to enable debugging
            });
        }
        findArgument(key, args) {
            for (const a of args) {
                const k = `--${key}=`;
                if (a.indexOf(k) === 0) {
                    return a.substr(k.length);
                }
            }
            return undefined;
        }
    };
    BrowserExtensionHostDebugService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, log_1.ILogService)
    ], BrowserExtensionHostDebugService);
    extensions_1.registerSingleton(extensionHostDebug_1.IExtensionHostDebugService, BrowserExtensionHostDebugService);
    class BrowserDebugHelperService {
        createTelemetryService(configurationService, args) {
            return undefined;
        }
    }
    extensions_1.registerSingleton(debug_1.IDebugHelperService, BrowserDebugHelperService);
});
//# __sourceMappingURL=extensionHostDebugService.js.map