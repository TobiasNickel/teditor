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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/workbench/services/output/common/output", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/contrib/remote/common/tunnelFactory", "vs/workbench/contrib/remote/common/showCandidate", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, contributions_1, platform_1, label_1, platform_2, network_1, remoteAgentService_1, log_1, logIpc_1, output_1, nls_1, resources_1, lifecycle_1, tunnelFactory_1, showCandidate_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelContribution = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.remote';
    let LabelContribution = class LabelContribution {
        constructor(labelService, remoteAgentService) {
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.registerFormatters();
        }
        registerFormatters() {
            this.remoteAgentService.getEnvironment().then(remoteEnvironment => {
                if (remoteEnvironment) {
                    const formatting = {
                        label: '${path}',
                        separator: remoteEnvironment.os === 1 /* Windows */ ? '\\' : '/',
                        tildify: remoteEnvironment.os !== 1 /* Windows */,
                        normalizeDriveLetter: remoteEnvironment.os === 1 /* Windows */,
                        workspaceSuffix: platform_2.isWeb ? undefined : network_1.Schemas.vscodeRemote
                    };
                    this.labelService.registerFormatter({
                        scheme: network_1.Schemas.vscodeRemote,
                        formatting
                    });
                    this.labelService.registerFormatter({
                        scheme: network_1.Schemas.userData,
                        formatting
                    });
                }
            });
        }
    };
    LabelContribution = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], LabelContribution);
    exports.LabelContribution = LabelContribution;
    let RemoteChannelsContribution = class RemoteChannelsContribution extends lifecycle_1.Disposable {
        constructor(logService, remoteAgentService) {
            super();
            const updateRemoteLogLevel = () => {
                const connection = remoteAgentService.getConnection();
                if (!connection) {
                    return;
                }
                connection.withChannel('logger', (channel) => logIpc_1.LoggerChannelClient.setLevel(channel, logService.getLevel()));
            };
            updateRemoteLogLevel();
            this._register(logService.onDidChangeLogLevel(updateRemoteLogLevel));
        }
    };
    RemoteChannelsContribution = __decorate([
        __param(0, log_1.ILogService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], RemoteChannelsContribution);
    let RemoteLogOutputChannels = class RemoteLogOutputChannels {
        constructor(remoteAgentService) {
            remoteAgentService.getEnvironment().then(remoteEnv => {
                if (remoteEnv) {
                    const outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
                    outputChannelRegistry.registerChannel({ id: 'remoteExtensionLog', label: nls_1.localize('remoteExtensionLog', "Remote Server"), file: resources_1.joinPath(remoteEnv.logsPath, `${remoteAgentService_1.RemoteExtensionLogFileName}.log`), log: true });
                }
            });
        }
    };
    RemoteLogOutputChannels = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], RemoteLogOutputChannels);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(LabelContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteChannelsContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteLogOutputChannels, 3 /* Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(tunnelFactory_1.TunnelFactoryContribution, 2 /* Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(showCandidate_1.ShowCandidateContribution, 2 /* Ready */);
    const extensionKindSchema = {
        type: 'string',
        enum: [
            'ui',
            'workspace'
        ],
        enumDescriptions: [
            nls_1.localize('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
            nls_1.localize('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote.")
        ],
    };
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: nls_1.localize('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.extensionKind': {
                type: 'object',
                markdownDescription: nls_1.localize('remote.extensionKind', "Override the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions are run on the remote. By overriding an extension's default kind using this setting, you specify if that extension should be installed and enabled locally or remotely."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9\-A-Z]*)\\.([a-z0-9A-Z][a-z0-9\-A-Z]*)$': {
                        oneOf: [{ type: 'array', items: extensionKindSchema }, extensionKindSchema],
                        default: ['ui'],
                    },
                },
                default: {
                    'pub.name': ['ui']
                }
            },
        }
    });
});
//# __sourceMappingURL=remote.contribution.js.map