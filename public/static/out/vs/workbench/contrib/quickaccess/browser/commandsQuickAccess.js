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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/commandsQuickAccess", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/workbench/services/extensions/common/extensions", "vs/base/common/async", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/contrib/quickAccess/commandsQuickAccess", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickAccess", "vs/platform/configuration/common/configuration", "vs/base/common/codicons", "vs/base/common/actions", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage"], function (require, exports, nls_1, commandsQuickAccess_1, editorService_1, actions_1, extensions_1, async_1, contextkey_1, lifecycle_1, commandsQuickAccess_2, platform_1, instantiation_1, keybinding_1, commands_1, telemetry_1, notification_1, quickAccess_1, configuration_1, codicons_1, actions_2, quickInput_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearCommandHistoryAction = exports.ShowAllCommandsAction = exports.CommandsQuickAccessProvider = void 0;
    let CommandsQuickAccessProvider = class CommandsQuickAccessProvider extends commandsQuickAccess_2.AbstractEditorCommandsQuickAccessProvider {
        constructor(editorService, menuService, extensionService, instantiationService, keybindingService, commandService, telemetryService, notificationService, configurationService) {
            super({
                showAlias: !platform_1.Language.isDefaultVariant(),
                noResultsPick: {
                    label: nls_1.localize('noCommandResults', "No matching commands"),
                    commandId: ''
                }
            }, instantiationService, keybindingService, commandService, telemetryService, notificationService);
            this.editorService = editorService;
            this.menuService = menuService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            // If extensions are not yet registered, we wait for a little moment to give them
            // a chance to register so that the complete set of commands shows up as result
            // We do not want to delay functionality beyond that time though to keep the commands
            // functional.
            this.extensionRegistrationRace = Promise.race([
                async_1.timeout(800),
                this.extensionService.whenInstalledExtensionsRegistered()
            ]);
        }
        get activeTextEditorControl() { return this.editorService.activeTextEditorControl; }
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        get configuration() {
            const commandPaletteConfig = this.configurationService.getValue().workbench.commandPalette;
            return {
                preserveInput: commandPaletteConfig.preserveInput
            };
        }
        async getCommandPicks(disposables, token) {
            // wait for extensions registration or 800ms once
            await this.extensionRegistrationRace;
            if (token.isCancellationRequested) {
                return [];
            }
            return [
                ...this.getCodeEditorCommandPicks(),
                ...this.getGlobalCommandPicks(disposables)
            ];
        }
        getGlobalCommandPicks(disposables) {
            var _a;
            const globalCommandPicks = [];
            const globalCommandsMenu = this.editorService.invokeWithinEditorContext(accessor => this.menuService.createMenu(actions_1.MenuId.CommandPalette, accessor.get(contextkey_1.IContextKeyService)));
            const globalCommandsMenuActions = globalCommandsMenu.getActions()
                .reduce((r, [, actions]) => [...r, ...actions], [])
                .filter(action => action instanceof actions_1.MenuItemAction);
            for (const action of globalCommandsMenuActions) {
                // Label
                let label = (typeof action.item.title === 'string' ? action.item.title : action.item.title.value) || action.item.id;
                // Category
                const category = typeof action.item.category === 'string' ? action.item.category : (_a = action.item.category) === null || _a === void 0 ? void 0 : _a.value;
                if (category) {
                    label = nls_1.localize('commandWithCategory', "{0}: {1}", category, label);
                }
                // Alias
                const aliasLabel = typeof action.item.title !== 'string' ? action.item.title.original : undefined;
                const aliasCategory = (category && action.item.category && typeof action.item.category !== 'string') ? action.item.category.original : undefined;
                const commandAlias = (aliasLabel && category) ?
                    aliasCategory ? `${aliasCategory}: ${aliasLabel}` : `${category}: ${aliasLabel}` :
                    aliasLabel;
                globalCommandPicks.push({
                    commandId: action.item.id,
                    commandAlias,
                    label: codicons_1.stripCodicons(label)
                });
            }
            // Cleanup
            globalCommandsMenu.dispose();
            disposables.add(lifecycle_1.toDisposable(() => lifecycle_1.dispose(globalCommandsMenuActions)));
            return globalCommandPicks;
        }
    };
    CommandsQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, actions_1.IMenuService),
        __param(2, extensions_1.IExtensionService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, commands_1.ICommandService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, notification_1.INotificationService),
        __param(8, configuration_1.IConfigurationService)
    ], CommandsQuickAccessProvider);
    exports.CommandsQuickAccessProvider = CommandsQuickAccessProvider;
    //#region Actions
    let ShowAllCommandsAction = class ShowAllCommandsAction extends actions_2.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(CommandsQuickAccessProvider.PREFIX);
        }
    };
    ShowAllCommandsAction.ID = 'workbench.action.showCommands';
    ShowAllCommandsAction.LABEL = nls_1.localize('showTriggerActions', "Show All Commands");
    ShowAllCommandsAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], ShowAllCommandsAction);
    exports.ShowAllCommandsAction = ShowAllCommandsAction;
    let ClearCommandHistoryAction = class ClearCommandHistoryAction extends actions_2.Action {
        constructor(id, label, configurationService, storageService) {
            super(id, label);
            this.configurationService = configurationService;
            this.storageService = storageService;
        }
        async run() {
            const commandHistoryLength = commandsQuickAccess_1.CommandsHistory.getConfiguredCommandHistoryLength(this.configurationService);
            if (commandHistoryLength > 0) {
                commandsQuickAccess_1.CommandsHistory.clearHistory(this.configurationService, this.storageService);
            }
        }
    };
    ClearCommandHistoryAction.ID = 'workbench.action.clearCommandHistory';
    ClearCommandHistoryAction.LABEL = nls_1.localize('clearCommandHistory', "Clear Command History");
    ClearCommandHistoryAction = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService)
    ], ClearCommandHistoryAction);
    exports.ClearCommandHistoryAction = ClearCommandHistoryAction;
});
//#endregion
//# __sourceMappingURL=commandsQuickAccess.js.map