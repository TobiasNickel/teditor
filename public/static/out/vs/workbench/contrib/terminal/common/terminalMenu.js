/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setupTerminalMenu = void 0;
    function setupTerminalMenu() {
        // View menu
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
            group: '4_panels',
            command: {
                id: "workbench.action.terminal.toggleTerminal" /* TOGGLE */,
                title: nls.localize({ key: 'miToggleIntegratedTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal")
            },
            order: 3
        });
        // Manage
        const createGroup = '1_create';
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
            group: createGroup,
            command: {
                id: "workbench.action.terminal.new" /* NEW */,
                title: nls.localize({ key: 'miNewTerminal', comment: ['&& denotes a mnemonic'] }, "&&New Terminal")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
            group: createGroup,
            command: {
                id: "workbench.action.terminal.split" /* SPLIT */,
                title: nls.localize({ key: 'miSplitTerminal', comment: ['&& denotes a mnemonic'] }, "&&Split Terminal"),
                precondition: contextkey_1.ContextKeyExpr.has('terminalIsOpen')
            },
            order: 2
        });
        // Run
        const runGroup = '2_run';
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
            group: runGroup,
            command: {
                id: "workbench.action.terminal.runActiveFile" /* RUN_ACTIVE_FILE */,
                title: nls.localize({ key: 'miRunActiveFile', comment: ['&& denotes a mnemonic'] }, "Run &&Active File")
            },
            order: 3
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarTerminalMenu, {
            group: runGroup,
            command: {
                id: "workbench.action.terminal.runSelectedText" /* RUN_SELECTED_TEXT */,
                title: nls.localize({ key: 'miRunSelectedText', comment: ['&& denotes a mnemonic'] }, "Run &&Selected Text")
            },
            order: 4
        });
    }
    exports.setupTerminalMenu = setupTerminalMenu;
});
//# __sourceMappingURL=terminalMenu.js.map