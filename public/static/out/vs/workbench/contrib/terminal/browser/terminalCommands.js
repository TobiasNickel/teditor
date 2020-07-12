/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, keybindingsRegistry_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setupTerminalCommands = void 0;
    function setupTerminalCommands() {
        registerOpenTerminalAtIndexCommands();
    }
    exports.setupTerminalCommands = setupTerminalCommands;
    function registerOpenTerminalAtIndexCommands() {
        for (let i = 0; i < 9; i++) {
            const terminalIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: `workbench.action.terminal.focusAtIndex${visibleIndex}`,
                weight: 200 /* WorkbenchContrib */,
                when: undefined,
                primary: 0,
                handler: accessor => {
                    const terminalService = accessor.get(terminal_1.ITerminalService);
                    terminalService.setActiveInstanceByIndex(terminalIndex);
                    return terminalService.showPanel(true);
                }
            });
        }
    }
});
//# __sourceMappingURL=terminalCommands.js.map