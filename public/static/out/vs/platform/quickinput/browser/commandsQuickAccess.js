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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/lifecycle", "vs/base/common/filters", "vs/base/common/types", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/base/common/errors", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, nls_1, pickerQuickAccess_1, lifecycle_1, filters_1, types_1, map_1, storage_1, configuration_1, instantiation_1, keybinding_1, commands_1, telemetry_1, errors_1, notification_1, errorMessage_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandsHistory = exports.AbstractCommandsQuickAccessProvider = void 0;
    let AbstractCommandsQuickAccessProvider = class AbstractCommandsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(options, instantiationService, keybindingService, commandService, telemetryService, notificationService) {
            super(AbstractCommandsQuickAccessProvider.PREFIX, options);
            this.options = options;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.commandsHistory = this._register(this.instantiationService.createInstance(CommandsHistory));
        }
        async getPicks(filter, disposables, token) {
            // Ask subclass for all command picks
            const allCommandPicks = await this.getCommandPicks(disposables, token);
            if (token.isCancellationRequested) {
                return [];
            }
            // Filter
            const filteredCommandPicks = [];
            for (const commandPick of allCommandPicks) {
                const labelHighlights = types_1.withNullAsUndefined(AbstractCommandsQuickAccessProvider.WORD_FILTER(filter, commandPick.label));
                const aliasHighlights = commandPick.commandAlias ? types_1.withNullAsUndefined(AbstractCommandsQuickAccessProvider.WORD_FILTER(filter, commandPick.commandAlias)) : undefined;
                // Add if matching in label or alias
                if (labelHighlights || aliasHighlights) {
                    commandPick.highlights = {
                        label: labelHighlights,
                        detail: this.options.showAlias ? aliasHighlights : undefined
                    };
                    filteredCommandPicks.push(commandPick);
                }
                // Also add if we have a 100% command ID match
                else if (filter === commandPick.commandId) {
                    filteredCommandPicks.push(commandPick);
                }
            }
            // Add description to commands that have duplicate labels
            const mapLabelToCommand = new Map();
            for (const commandPick of filteredCommandPicks) {
                const existingCommandForLabel = mapLabelToCommand.get(commandPick.label);
                if (existingCommandForLabel) {
                    commandPick.description = commandPick.commandId;
                    existingCommandForLabel.description = existingCommandForLabel.commandId;
                }
                else {
                    mapLabelToCommand.set(commandPick.label, commandPick);
                }
            }
            // Sort by MRU order and fallback to name otherwise
            filteredCommandPicks.sort((commandPickA, commandPickB) => {
                const commandACounter = this.commandsHistory.peek(commandPickA.commandId);
                const commandBCounter = this.commandsHistory.peek(commandPickB.commandId);
                if (commandACounter && commandBCounter) {
                    return commandACounter > commandBCounter ? -1 : 1; // use more recently used command before older
                }
                if (commandACounter) {
                    return -1; // first command was used, so it wins over the non used one
                }
                if (commandBCounter) {
                    return 1; // other command was used so it wins over the command
                }
                // both commands were never used, so we sort by name
                return commandPickA.label.localeCompare(commandPickB.label);
            });
            const commandPicks = [];
            let addSeparator = false;
            for (let i = 0; i < filteredCommandPicks.length; i++) {
                const commandPick = filteredCommandPicks[i];
                const keybinding = this.keybindingService.lookupKeybinding(commandPick.commandId);
                const ariaLabel = keybinding ?
                    nls_1.localize('commandPickAriaLabelWithKeybinding', "{0}, {1}", commandPick.label, keybinding.getAriaLabel()) :
                    commandPick.label;
                // Separator: recently used
                if (i === 0 && this.commandsHistory.peek(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: nls_1.localize('recentlyUsed', "recently used") });
                    addSeparator = true;
                }
                // Separator: other commands
                if (i !== 0 && addSeparator && !this.commandsHistory.peek(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: nls_1.localize('morecCommands', "other commands") });
                    addSeparator = false; // only once
                }
                // Command
                commandPicks.push(Object.assign(Object.assign({}, commandPick), { ariaLabel, detail: this.options.showAlias && commandPick.commandAlias !== commandPick.label ? commandPick.commandAlias : undefined, keybinding, accept: async () => {
                        // Add to history
                        this.commandsHistory.push(commandPick.commandId);
                        // Telementry
                        this.telemetryService.publicLog2('workbenchActionExecuted', {
                            id: commandPick.commandId,
                            from: 'quick open'
                        });
                        // Run
                        try {
                            await this.commandService.executeCommand(commandPick.commandId);
                        }
                        catch (error) {
                            if (!errors_1.isPromiseCanceledError(error)) {
                                this.notificationService.error(nls_1.localize('canNotRun', "Command '{0}' resulted in an error ({1})", commandPick.label, errorMessage_1.toErrorMessage(error)));
                            }
                        }
                    } }));
            }
            return commandPicks;
        }
    };
    AbstractCommandsQuickAccessProvider.PREFIX = '>';
    AbstractCommandsQuickAccessProvider.WORD_FILTER = filters_1.or(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString);
    AbstractCommandsQuickAccessProvider = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, notification_1.INotificationService)
    ], AbstractCommandsQuickAccessProvider);
    exports.AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider;
    let CommandsHistory = class CommandsHistory extends lifecycle_1.Disposable {
        constructor(storageService, configurationService, storageKeysSyncRegistryService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.configuredCommandsHistoryLength = 0;
            // opt-in to syncing
            storageKeysSyncRegistryService.registerStorageKey({ key: CommandsHistory.PREF_KEY_CACHE, version: 1 });
            storageKeysSyncRegistryService.registerStorageKey({ key: CommandsHistory.PREF_KEY_COUNTER, version: 1 });
            this.updateConfiguration();
            this.load();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(() => this.updateConfiguration()));
        }
        updateConfiguration() {
            this.configuredCommandsHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(this.configurationService);
            if (CommandsHistory.cache && CommandsHistory.cache.limit !== this.configuredCommandsHistoryLength) {
                CommandsHistory.cache.limit = this.configuredCommandsHistoryLength;
                CommandsHistory.saveState(this.storageService);
            }
        }
        load() {
            const raw = this.storageService.get(CommandsHistory.PREF_KEY_CACHE, 0 /* GLOBAL */);
            let serializedCache;
            if (raw) {
                try {
                    serializedCache = JSON.parse(raw);
                }
                catch (error) {
                    // invalid data
                }
            }
            const cache = CommandsHistory.cache = new map_1.LRUCache(this.configuredCommandsHistoryLength, 1);
            if (serializedCache) {
                let entries;
                if (serializedCache.usesLRU) {
                    entries = serializedCache.entries;
                }
                else {
                    entries = serializedCache.entries.sort((a, b) => a.value - b.value);
                }
                entries.forEach(entry => cache.set(entry.key, entry.value));
            }
            CommandsHistory.counter = this.storageService.getNumber(CommandsHistory.PREF_KEY_COUNTER, 0 /* GLOBAL */, CommandsHistory.counter);
        }
        push(commandId) {
            if (!CommandsHistory.cache) {
                return;
            }
            CommandsHistory.cache.set(commandId, CommandsHistory.counter++); // set counter to command
            CommandsHistory.saveState(this.storageService);
        }
        peek(commandId) {
            var _a;
            return (_a = CommandsHistory.cache) === null || _a === void 0 ? void 0 : _a.peek(commandId);
        }
        static saveState(storageService) {
            if (!CommandsHistory.cache) {
                return;
            }
            const serializedCache = { usesLRU: true, entries: [] };
            CommandsHistory.cache.forEach((value, key) => serializedCache.entries.push({ key, value }));
            storageService.store(CommandsHistory.PREF_KEY_CACHE, JSON.stringify(serializedCache), 0 /* GLOBAL */);
            storageService.store(CommandsHistory.PREF_KEY_COUNTER, CommandsHistory.counter, 0 /* GLOBAL */);
        }
        static getConfiguredCommandHistoryLength(configurationService) {
            var _a, _b;
            const config = configurationService.getValue();
            const configuredCommandHistoryLength = (_b = (_a = config.workbench) === null || _a === void 0 ? void 0 : _a.commandPalette) === null || _b === void 0 ? void 0 : _b.history;
            if (typeof configuredCommandHistoryLength === 'number') {
                return configuredCommandHistoryLength;
            }
            return CommandsHistory.DEFAULT_COMMANDS_HISTORY_LENGTH;
        }
        static clearHistory(configurationService, storageService) {
            const commandHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(configurationService);
            CommandsHistory.cache = new map_1.LRUCache(commandHistoryLength);
            CommandsHistory.counter = 1;
            CommandsHistory.saveState(storageService);
        }
    };
    CommandsHistory.DEFAULT_COMMANDS_HISTORY_LENGTH = 50;
    CommandsHistory.PREF_KEY_CACHE = 'commandPalette.mru.cache';
    CommandsHistory.PREF_KEY_COUNTER = 'commandPalette.mru.counter';
    CommandsHistory.counter = 1;
    CommandsHistory = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storageKeys_1.IStorageKeysSyncRegistryService)
    ], CommandsHistory);
    exports.CommandsHistory = CommandsHistory;
});
//# __sourceMappingURL=commandsQuickAccess.js.map