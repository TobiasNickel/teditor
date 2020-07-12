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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/platform/commands/common/commands", "vs/base/common/filters", "vs/base/common/types", "vs/workbench/contrib/debug/browser/debugCommands"], function (require, exports, pickerQuickAccess_1, nls_1, notification_1, debug_1, workspace_1, commands_1, filters_1, types_1, debugCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartDebugQuickAccessProvider = void 0;
    let StartDebugQuickAccessProvider = class StartDebugQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(debugService, contextService, commandService, notificationService) {
            super(StartDebugQuickAccessProvider.PREFIX, {
                noResultsPick: {
                    label: nls_1.localize('noDebugResults', "No matching launch configurations")
                }
            });
            this.debugService = debugService;
            this.contextService = contextService;
            this.commandService = commandService;
            this.notificationService = notificationService;
        }
        async getPicks(filter) {
            var _a, _b;
            const picks = [];
            picks.push({ type: 'separator', label: 'launch.json' });
            const configManager = this.debugService.getConfigurationManager();
            // Entries: configs
            let lastGroup;
            for (let config of configManager.getAllConfigurations()) {
                const highlights = filters_1.matchesFuzzy(filter, config.name, true);
                if (highlights) {
                    // Separator
                    if (lastGroup !== ((_a = config.presentation) === null || _a === void 0 ? void 0 : _a.group)) {
                        picks.push({ type: 'separator' });
                        lastGroup = (_b = config.presentation) === null || _b === void 0 ? void 0 : _b.group;
                    }
                    // Launch entry
                    picks.push({
                        label: config.name,
                        description: this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ? config.launch.name : '',
                        highlights: { label: highlights },
                        buttons: [{
                                iconClass: 'codicon-gear',
                                tooltip: nls_1.localize('customizeLaunchConfig', "Configure Launch Configuration")
                            }],
                        trigger: () => {
                            config.launch.openConfigFile(false);
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        accept: async () => {
                            this.debugService.getConfigurationManager().selectConfiguration(config.launch, config.name);
                            try {
                                await this.debugService.startDebugging(config.launch);
                            }
                            catch (error) {
                                this.notificationService.error(error);
                            }
                        }
                    });
                }
            }
            // Entries detected configurations
            const dynamicProviders = await configManager.getDynamicProviders();
            if (dynamicProviders.length > 0) {
                picks.push({
                    type: 'separator', label: nls_1.localize({
                        key: 'contributed',
                        comment: ['contributed is lower case because it looks better like that in UI. Nothing preceeds it. It is a name of the grouping of debug configurations.']
                    }, "contributed")
                });
            }
            dynamicProviders.forEach(provider => {
                picks.push({
                    label: `$(folder) ${provider.label}...`,
                    ariaLabel: nls_1.localize({ key: 'providerAriaLabel', comment: ['Placeholder stands for the provider label. For example "NodeJS".'] }, "{0} contributed configurations", provider.label),
                    accept: async () => {
                        const pick = await provider.pick();
                        if (pick) {
                            this.debugService.startDebugging(pick.launch, pick.config);
                        }
                    }
                });
            });
            // Entries: launches
            const visibleLaunches = configManager.getLaunches().filter(launch => !launch.hidden);
            // Separator
            if (visibleLaunches.length > 0) {
                picks.push({ type: 'separator', label: nls_1.localize('configure', "configure") });
            }
            for (const launch of visibleLaunches) {
                const label = this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ?
                    nls_1.localize("addConfigTo", "Add Config ({0})...", launch.name) :
                    nls_1.localize('addConfiguration', "Add Configuration...");
                // Add Config entry
                picks.push({
                    label,
                    description: this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ? launch.name : '',
                    highlights: { label: types_1.withNullAsUndefined(filters_1.matchesFuzzy(filter, label, true)) },
                    accept: () => this.commandService.executeCommand(debugCommands_1.ADD_CONFIGURATION_ID, launch.uri.toString())
                });
            }
            return picks;
        }
    };
    StartDebugQuickAccessProvider.PREFIX = 'debug ';
    StartDebugQuickAccessProvider = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService)
    ], StartDebugQuickAccessProvider);
    exports.StartDebugQuickAccessProvider = StartDebugQuickAccessProvider;
});
//# __sourceMappingURL=debugQuickAccess.js.map