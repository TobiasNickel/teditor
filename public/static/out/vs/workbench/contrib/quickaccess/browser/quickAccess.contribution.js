/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/browser/helpQuickAccess", "vs/workbench/contrib/quickaccess/browser/viewQuickAccess", "vs/workbench/contrib/quickaccess/browser/commandsQuickAccess", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/quickaccess", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/common/editorContextKeys"], function (require, exports, nls_1, quickAccess_1, platform_1, helpQuickAccess_1, viewQuickAccess_1, commandsQuickAccess_1, actions_1, actions_2, contextkey_1, quickaccess_1, keybindingsRegistry_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Quick Access Proviers
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: helpQuickAccess_1.HelpQuickAccessProvider,
        prefix: helpQuickAccess_1.HelpQuickAccessProvider.PREFIX,
        placeholder: nls_1.localize('helpQuickAccessPlaceholder', "Type '{0}' to get help on the actions you can take from here.", helpQuickAccess_1.HelpQuickAccessProvider.PREFIX),
        helpEntries: [{ description: nls_1.localize('helpQuickAccess', "Show all Quick Access Providers"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: viewQuickAccess_1.ViewQuickAccessProvider,
        prefix: viewQuickAccess_1.ViewQuickAccessProvider.PREFIX,
        contextKey: 'inViewsPicker',
        placeholder: nls_1.localize('viewQuickAccessPlaceholder', "Type the name of a view, output channel or terminal to open."),
        helpEntries: [{ description: nls_1.localize('viewQuickAccess', "Open View"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: commandsQuickAccess_1.CommandsQuickAccessProvider,
        prefix: commandsQuickAccess_1.CommandsQuickAccessProvider.PREFIX,
        contextKey: 'inCommandsPicker',
        placeholder: nls_1.localize('commandsQuickAccessPlaceholder', "Type the name of a command to run."),
        helpEntries: [{ description: nls_1.localize('commandsQuickAccess', "Show and Run Commands"), needsEditor: false }]
    });
    //#endregion
    //#region Menu contributions
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '1_open',
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: nls_1.localize({ key: 'miCommandPalette', comment: ['&& denotes a mnemonic'] }, "&&Command Palette...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '1_open',
        command: {
            id: viewQuickAccess_1.OpenViewPickerAction.ID,
            title: nls_1.localize({ key: 'miOpenView', comment: ['&& denotes a mnemonic'] }, "&&Open View...")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '4_symbol_nav',
        command: {
            id: 'workbench.action.gotoSymbol',
            title: nls_1.localize({ key: 'miGotoSymbolInEditor', comment: ['&& denotes a mnemonic'] }, "Go to &&Symbol in Editor...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '5_infile_nav',
        command: {
            id: 'workbench.action.gotoLine',
            title: nls_1.localize({ key: 'miGotoLine', comment: ['&& denotes a mnemonic'] }, "Go to &&Line/Column...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '1_command',
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: nls_1.localize('commandPalette', "Command Palette...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        group: 'z_commands',
        command: {
            id: commandsQuickAccess_1.ShowAllCommandsAction.ID,
            title: nls_1.localize('commandPalette', "Command Palette..."),
            precondition: editorContextKeys_1.EditorContextKeys.editorSimpleInput.toNegated()
        },
        order: 1
    });
    //#endregion
    //#region Workbench actions and commands
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(commandsQuickAccess_1.ClearCommandHistoryAction), 'Clear Command History');
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(commandsQuickAccess_1.ShowAllCommandsAction, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 46 /* KEY_P */,
        secondary: [59 /* F1 */]
    }), 'Show All Commands');
    const inViewsPickerContextKey = 'inViewsPicker';
    const inViewsPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(inViewsPickerContextKey));
    const viewPickerKeybinding = { primary: 2048 /* CtrlCmd */ | 47 /* KEY_Q */, mac: { primary: 256 /* WinCtrl */ | 47 /* KEY_Q */ }, linux: { primary: 0 } };
    const viewCategory = nls_1.localize('view', "View");
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(viewQuickAccess_1.OpenViewPickerAction), 'View: Open View', viewCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(viewQuickAccess_1.QuickAccessViewPickerAction, viewPickerKeybinding), 'View: Quick Open View', viewCategory);
    const quickAccessNavigateNextInViewPickerId = 'workbench.action.quickOpenNavigateNextInViewPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInViewPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigateNextInViewPickerId, true),
        when: inViewsPickerContext,
        primary: viewPickerKeybinding.primary,
        linux: viewPickerKeybinding.linux,
        mac: viewPickerKeybinding.mac
    });
    const quickAccessNavigatePreviousInViewPickerId = 'workbench.action.quickOpenNavigatePreviousInViewPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInViewPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigatePreviousInViewPickerId, false),
        when: inViewsPickerContext,
        primary: viewPickerKeybinding.primary | 1024 /* Shift */,
        linux: viewPickerKeybinding.linux,
        mac: {
            primary: viewPickerKeybinding.mac.primary | 1024 /* Shift */
        }
    });
});
//#endregion
//# __sourceMappingURL=quickAccess.contribution.js.map