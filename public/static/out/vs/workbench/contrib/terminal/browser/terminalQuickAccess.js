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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/filters", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/commands/common/commands"], function (require, exports, nls_1, pickerQuickAccess_1, filters_1, terminal_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickAccessProvider = void 0;
    let TerminalQuickAccessProvider = class TerminalQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(terminalService, commandService) {
            super(TerminalQuickAccessProvider.PREFIX, { canAcceptInBackground: true });
            this.terminalService = terminalService;
            this.commandService = commandService;
        }
        getPicks(filter) {
            const terminalPicks = [];
            const terminalTabs = this.terminalService.terminalTabs;
            for (let tabIndex = 0; tabIndex < terminalTabs.length; tabIndex++) {
                const terminalTab = terminalTabs[tabIndex];
                for (let terminalIndex = 0; terminalIndex < terminalTab.terminalInstances.length; terminalIndex++) {
                    const terminal = terminalTab.terminalInstances[terminalIndex];
                    const label = `${tabIndex + 1}.${terminalIndex + 1}: ${terminal.title}`;
                    const highlights = filters_1.matchesFuzzy(filter, label, true);
                    if (highlights) {
                        terminalPicks.push({
                            label,
                            highlights: { label: highlights },
                            buttons: [
                                {
                                    iconClass: 'codicon-gear',
                                    tooltip: nls_1.localize('renameTerminal', "Rename Terminal")
                                },
                                {
                                    iconClass: 'codicon-trash',
                                    tooltip: nls_1.localize('killTerminal', "Kill Terminal Instance")
                                }
                            ],
                            trigger: buttonIndex => {
                                switch (buttonIndex) {
                                    case 0:
                                        this.commandService.executeCommand("workbench.action.terminal.rename" /* RENAME */, terminal);
                                        return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                                    case 1:
                                        terminal.dispose(true);
                                        return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                                }
                                return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                            },
                            accept: (keyMod, event) => {
                                this.terminalService.setActiveInstance(terminal);
                                this.terminalService.showPanel(!event.inBackground);
                            }
                        });
                    }
                }
            }
            if (terminalPicks.length > 0) {
                terminalPicks.push({ type: 'separator' });
            }
            const createTerminalLabel = nls_1.localize("workbench.action.terminal.newplus", "Create New Integrated Terminal");
            terminalPicks.push({
                label: `$(plus) ${createTerminalLabel}`,
                ariaLabel: createTerminalLabel,
                accept: () => this.commandService.executeCommand('workbench.action.terminal.new')
            });
            return terminalPicks;
        }
    };
    TerminalQuickAccessProvider.PREFIX = 'term ';
    TerminalQuickAccessProvider = __decorate([
        __param(0, terminal_1.ITerminalService),
        __param(1, commands_1.ICommandService)
    ], TerminalQuickAccessProvider);
    exports.TerminalQuickAccessProvider = TerminalQuickAccessProvider;
});
//# __sourceMappingURL=terminalQuickAccess.js.map