/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/workbench/browser/panel", "vs/workbench/browser/quickaccess", "vs/workbench/common/actions", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalView", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/browser/terminalCommands", "vs/workbench/contrib/terminal/common/terminalMenu", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/contrib/terminal/browser/terminalService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/browser/canIUse", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/contrib/terminal/common/terminalConfiguration", "vs/platform/accessibility/common/accessibility", "vs/css!./media/scrollbar", "vs/css!./media/terminal", "vs/css!./media/widgets", "vs/css!./media/xterm"], function (require, exports, platform, nls, actions_1, commands_1, contextkey_1, keybindingsRegistry_1, platform_1, panel, quickaccess_1, actions_2, views_1, terminalActions_1, terminalView_1, terminal_1, terminalColorRegistry_1, terminalCommands_1, terminalMenu_1, configurationRegistry_1, terminalService_1, extensions_1, terminal_2, canIUse_1, descriptors_1, viewPaneContainer_1, quickAccess_1, terminalQuickAccess_1, terminalConfiguration_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register services
    extensions_1.registerSingleton(terminal_2.ITerminalService, terminalService_1.TerminalService, true);
    // Register quick accesses
    const quickAccessRegistry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
    const inTerminalsPicker = 'inTerminalPicker';
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: terminalQuickAccess_1.TerminalQuickAccessProvider,
        prefix: terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX,
        contextKey: inTerminalsPicker,
        placeholder: nls.localize('tasksQuickAccessPlaceholder', "Type the name of a terminal to open."),
        helpEntries: [{ description: nls.localize('tasksQuickAccessHelp', "Show All Opened Terminals"), needsEditor: false }]
    });
    const quickAccessNavigateNextInTerminalPickerId = 'workbench.action.quickOpenNavigateNextInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickAccessNavigateNextInTerminalPickerId, handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigateNextInTerminalPickerId, true) });
    const quickAccessNavigatePreviousInTerminalPickerId = 'workbench.action.quickOpenNavigatePreviousInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickAccessNavigatePreviousInTerminalPickerId, handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigatePreviousInTerminalPickerId, false) });
    // Register configurations
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(terminalConfiguration_1.terminalConfiguration);
    // Register views
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: terminal_1.TERMINAL_VIEW_ID,
        name: nls.localize('terminal', "Terminal"),
        icon: 'codicon-terminal',
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [terminal_1.TERMINAL_VIEW_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        storageId: terminal_1.TERMINAL_VIEW_ID,
        focusCommand: { id: "workbench.action.terminal.focus" /* FOCUS */ },
        hideIfEmpty: true,
        order: 3
    }, views_1.ViewContainerLocation.Panel);
    platform_1.Registry.as(panel.Extensions.Panels).setDefaultPanelId(terminal_1.TERMINAL_VIEW_ID);
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: terminal_1.TERMINAL_VIEW_ID,
            name: nls.localize('terminal', "Terminal"),
            containerIcon: 'codicon-terminal',
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(terminalView_1.TerminalViewPane)
        }], VIEW_CONTAINER);
    // Register actions
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    terminalActions_1.registerTerminalActions();
    const category = terminal_1.TERMINAL_ACTION_CATEGORY;
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.KillTerminalAction), 'Terminal: Kill the Active Terminal Instance', category);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.CreateNewTerminalAction, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 86 /* US_BACKTICK */,
        mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 86 /* US_BACKTICK */ }
    }), 'Terminal: Create New Integrated Terminal', category);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.SelectAllTerminalAction, {
        // Don't use ctrl+a by default as that would override the common go to start
        // of prompt shell binding
        primary: 0,
        // Technically this doesn't need to be here as it will fall back to this
        // behavior anyway when handed to xterm.js, having this handled by VS Code
        // makes it easier for users to see how it works though.
        mac: { primary: 2048 /* CtrlCmd */ | 31 /* KEY_A */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Select All', category);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.ToggleTerminalAction, {
        primary: 2048 /* CtrlCmd */ | 86 /* US_BACKTICK */,
        mac: { primary: 256 /* WinCtrl */ | 86 /* US_BACKTICK */ }
    }), 'View: Toggle Integrated Terminal', nls.localize('viewCategory', "View"));
    // Weight is higher than work workbench contributions so the keybinding remains
    // highest priority when chords are registered afterwards
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.ClearTerminalAction, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 41 /* KEY_K */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, 200 /* WorkbenchContrib */ + 1), 'Terminal: Clear', category);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.SelectDefaultShellWindowsTerminalAction), 'Terminal: Select Default Shell', category);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.SplitTerminalAction, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 26 /* KEY_5 */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 88 /* US_BACKSLASH */,
            secondary: [256 /* WinCtrl */ | 1024 /* Shift */ | 26 /* KEY_5 */]
        }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Split Terminal', category);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.SplitInActiveWorkspaceTerminalAction), 'Terminal: Split Terminal (In Active Workspace)', category);
    // Commands might be affected by Web restrictons
    if (canIUse_1.BrowserFeatures.clipboard.writeText) {
        actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.CopyTerminalSelectionAction, {
            primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
            win: { primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */] },
            linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */ }
        }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS)), 'Terminal: Copy Selection', category);
    }
    function registerSendSequenceKeybinding(text, rule) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: "workbench.action.terminal.sendSequence" /* SEND_SEQUENCE */,
            weight: 200 /* WorkbenchContrib */,
            when: rule.when || terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
            primary: rule.primary,
            mac: rule.mac,
            linux: rule.linux,
            win: rule.win,
            handler: terminalActions_1.terminalSendSequenceCommand,
            args: { text }
        });
    }
    if (canIUse_1.BrowserFeatures.clipboard.readText) {
        actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(terminalActions_1.TerminalPasteAction, {
            primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
            win: { primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */, secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 52 /* KEY_V */] },
            linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 52 /* KEY_V */ }
        }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Paste into Active Terminal', category);
        // An extra Windows-only ctrl+v keybinding is used for pwsh that sends ctrl+v directly to the
        // shell, this gets handled by PSReadLine which properly handles multi-line pastes. This is
        // disabled in accessibility mode as PowerShell does not run PSReadLine when it detects a screen
        // reader.
        if (platform.isWindows) {
            registerSendSequenceKeybinding(String.fromCharCode('V'.charCodeAt(0) - 64), {
                when: contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, contextkey_1.ContextKeyExpr.equals(terminal_1.KEYBINDING_CONTEXT_TERMINAL_SHELL_TYPE_KEY, terminal_2.WindowsShellType.PowerShell), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */
            });
        }
    }
    // Delete word left: ctrl+w
    registerSendSequenceKeybinding(String.fromCharCode('W'.charCodeAt(0) - 64), {
        primary: 2048 /* CtrlCmd */ | 1 /* Backspace */,
        mac: { primary: 512 /* Alt */ | 1 /* Backspace */ }
    });
    // Delete word right: alt+d
    registerSendSequenceKeybinding('\x1bd', {
        primary: 2048 /* CtrlCmd */ | 20 /* Delete */,
        mac: { primary: 512 /* Alt */ | 20 /* Delete */ }
    });
    // Delete to line start: ctrl+u
    registerSendSequenceKeybinding('\u0015', {
        mac: { primary: 2048 /* CtrlCmd */ | 1 /* Backspace */ }
    });
    // Move to line start: ctrl+A
    registerSendSequenceKeybinding(String.fromCharCode('A'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */ }
    });
    // Move to line end: ctrl+E
    registerSendSequenceKeybinding(String.fromCharCode('E'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* CtrlCmd */ | 17 /* RightArrow */ }
    });
    terminalCommands_1.setupTerminalCommands();
    terminalMenu_1.setupTerminalMenu();
    terminalColorRegistry_1.registerColors();
});
//# __sourceMappingURL=terminal.contribution.js.map