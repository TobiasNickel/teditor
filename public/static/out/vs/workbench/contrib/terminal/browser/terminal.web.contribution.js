/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/contrib/terminal/common/terminalConfiguration"], function (require, exports, keybindingsRegistry_1, platform_1, configurationRegistry_1, terminalConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Desktop shell configuration are registered in electron-browser as their default values rely
    // on process.env
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(terminalConfiguration_1.getTerminalShellConfiguration());
    // Register standard external terminal keybinding as integrated terminal when in web as the
    // external terminal is not available
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: "workbench.action.terminal.new" /* NEW */,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */
    });
});
//# __sourceMappingURL=terminal.web.contribution.js.map