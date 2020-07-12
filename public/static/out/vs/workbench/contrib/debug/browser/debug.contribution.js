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
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/actions", "vs/workbench/browser/viewlet", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/contrib/debug/browser/callStackView", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/debug/browser/debugService", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/statusbarColorProvider", "vs/workbench/common/views", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/contrib/debug/browser/debugStatus", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/debug/browser/loadedScriptsView", "vs/workbench/contrib/debug/browser/debugEditorActions", "vs/workbench/contrib/debug/browser/watchExpressionsView", "vs/workbench/contrib/debug/browser/variablesView", "vs/workbench/contrib/debug/browser/repl", "vs/workbench/contrib/debug/common/debugContentProvider", "vs/workbench/contrib/debug/browser/welcomeView", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/debug/browser/debugViewlet", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/browser/breakpointEditorContribution", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/debug/browser/debugQuickAccess", "vs/workbench/contrib/debug/browser/debugProgress", "vs/workbench/contrib/debug/browser/debugTitle", "vs/base/common/codicons", "vs/css!./media/debug.contribution", "vs/css!./media/debugHover"], function (require, exports, nls, color_1, actions_1, platform_1, extensions_1, configurationRegistry_1, actions_2, viewlet_1, breakpointsView_1, callStackView_1, contributions_1, debug_1, layoutService_1, debugActions_1, debugToolBar_1, service, viewlet_2, debugCommands_1, statusbarColorProvider_1, views_1, platform_2, contextkey_1, uri_1, debugStatus_1, configuration_1, editorGroupsService_1, loadedScriptsView_1, debugEditorActions_1, watchExpressionsView_1, variablesView_1, repl_1, debugContentProvider_1, welcomeView_1, themeService_1, colorRegistry_1, debugViewlet_1, editorExtensions_1, callStackEditorContribution_1, breakpointEditorContribution_1, descriptors_1, viewPaneContainer_1, quickAccess_1, debugQuickAccess_1, debugProgress_1, debugTitle_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenDebugViewletAction = class OpenDebugViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, debug_1.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenDebugViewletAction.ID = debug_1.VIEWLET_ID;
    OpenDebugViewletAction.LABEL = nls.localize('toggleDebugViewlet', "Show Run and Debug");
    OpenDebugViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenDebugViewletAction);
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: debug_1.VIEWLET_ID,
        name: nls.localize('run', "Run"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(debugViewlet_1.DebugViewPaneContainer),
        icon: codicons_1.Codicon.debugAlt.classNames,
        alwaysUseContainerInfo: true,
        order: 2
    }, views_1.ViewContainerLocation.Sidebar);
    const openViewletKb = {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 34 /* KEY_D */
    };
    const openPanelKb = {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 55 /* KEY_Y */
    };
    // register repl panel
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: debug_1.DEBUG_PANEL_ID,
        name: nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugPanel' }, 'Debug Console'),
        icon: codicons_1.Codicon.debugConsole.classNames,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [debug_1.DEBUG_PANEL_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        storageId: debug_1.DEBUG_PANEL_ID,
        focusCommand: {
            id: debugViewlet_1.OpenDebugConsoleAction.ID,
            keybindings: openPanelKb
        },
        order: 2,
        hideIfEmpty: true
    }, views_1.ViewContainerLocation.Panel);
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: debug_1.REPL_VIEW_ID,
            name: nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugPanel' }, 'Debug Console'),
            containerIcon: codicons_1.Codicon.debugConsole.classNames,
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(repl_1.Repl),
        }], VIEW_CONTAINER);
    // Register default debug views
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViews([{ id: debug_1.VARIABLES_VIEW_ID, name: nls.localize('variables', "Variables"), containerIcon: codicons_1.Codicon.debugAlt.classNames, ctorDescriptor: new descriptors_1.SyncDescriptor(variablesView_1.VariablesView), order: 10, weight: 40, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusVariablesView' }, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('default') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.WATCH_VIEW_ID, name: nls.localize('watch', "Watch"), containerIcon: codicons_1.Codicon.debugAlt.classNames, ctorDescriptor: new descriptors_1.SyncDescriptor(watchExpressionsView_1.WatchExpressionsView), order: 20, weight: 10, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusWatchView' }, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('default') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.CALLSTACK_VIEW_ID, name: nls.localize('callStack', "Call Stack"), containerIcon: codicons_1.Codicon.debugAlt.classNames, ctorDescriptor: new descriptors_1.SyncDescriptor(callStackView_1.CallStackView), order: 30, weight: 30, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusCallStackView' }, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('default') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.BREAKPOINTS_VIEW_ID, name: nls.localize('breakpoints', "Breakpoints"), containerIcon: codicons_1.Codicon.debugAlt.classNames, ctorDescriptor: new descriptors_1.SyncDescriptor(breakpointsView_1.BreakpointsView), order: 40, weight: 20, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusBreakpointsView' }, when: contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_BREAKPOINTS_EXIST, debug_1.CONTEXT_DEBUG_UX.isEqualTo('default')) }], viewContainer);
    viewsRegistry.registerViews([{ id: welcomeView_1.WelcomeView.ID, name: welcomeView_1.WelcomeView.LABEL, containerIcon: codicons_1.Codicon.debugAlt.classNames, ctorDescriptor: new descriptors_1.SyncDescriptor(welcomeView_1.WelcomeView), order: 1, weight: 40, canToggleVisibility: true, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('simple') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.LOADED_SCRIPTS_VIEW_ID, name: nls.localize('loadedScripts', "Loaded Scripts"), containerIcon: codicons_1.Codicon.debugAlt.classNames, ctorDescriptor: new descriptors_1.SyncDescriptor(loadedScriptsView_1.LoadedScriptsView), order: 35, weight: 5, canToggleVisibility: true, canMoveView: true, collapsed: true, when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_LOADED_SCRIPTS_SUPPORTED, debug_1.CONTEXT_DEBUG_UX.isEqualTo('default')) }], viewContainer);
    debugCommands_1.registerCommands();
    // register action to open viewlet
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugViewlet_1.OpenDebugConsoleAction, openPanelKb), 'View: Debug Console', nls.localize('view', "View"));
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(OpenDebugViewletAction, openViewletKb), 'View: Show Run and Debug', nls.localize('view', "View"));
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugToolBar_1.DebugToolBar, 3 /* Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugContentProvider_1.DebugContentProvider, 4 /* Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(statusbarColorProvider_1.StatusBarColorProvider, 4 /* Eventually */);
    const debugCategory = nls.localize('debugCategory', "Debug");
    const runCategroy = nls.localize('runCategory', "Run");
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.StartAction, { primary: 63 /* F5 */ }, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated()), 'Debug: Start Debugging', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.ConfigureAction), 'Debug: Open launch.json', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.AddFunctionBreakpointAction), 'Debug: Add Function Breakpoint', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.ReapplyBreakpointsAction), 'Debug: Reapply All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.RunAction, { primary: 2048 /* CtrlCmd */ | 63 /* F5 */, mac: { primary: 256 /* WinCtrl */ | 63 /* F5 */ } }), 'Run: Start Without Debugging', runCategroy);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.RemoveAllBreakpointsAction), 'Debug: Remove All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.EnableAllBreakpointsAction), 'Debug: Enable All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.DisableAllBreakpointsAction), 'Debug: Disable All Breakpoints', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(debugActions_1.SelectAndStartAction), 'Debug: Select and Start Debugging', debugCategory);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(repl_1.ClearReplAction), 'Debug: Clear Console', debugCategory);
    const registerDebugCommandPaletteItem = (id, title, when, precondition) => {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            when,
            command: {
                id,
                title: `Debug: ${title}`,
                precondition
            }
        });
    };
    registerDebugCommandPaletteItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL);
    registerDebugCommandPaletteItem(debugCommands_1.TERMINATE_THREAD_ID, nls.localize('terminateThread', "Terminate Thread"), debug_1.CONTEXT_IN_DEBUG_MODE);
    registerDebugCommandPaletteItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'));
    registerDebugCommandPaletteItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH);
    registerDebugCommandPaletteItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated());
    registerDebugCommandPaletteItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.FOCUS_REPL_ID, nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugFocusConsole' }, 'Focus on Debug Console View'));
    registerDebugCommandPaletteItem(debugCommands_1.JUMP_TO_CURSOR_ID, nls.localize('jumpToCursor', "Jump to Cursor"), debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED);
    registerDebugCommandPaletteItem(debugCommands_1.JUMP_TO_CURSOR_ID, nls.localize('SetNextStatement', "Set Next Statement"), debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED);
    registerDebugCommandPaletteItem(debugEditorActions_1.RunToCursorAction.ID, debugEditorActions_1.RunToCursorAction.LABEL, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')));
    registerDebugCommandPaletteItem(debugCommands_1.TOGGLE_INLINE_BREAKPOINT_ID, nls.localize('inlineBreakpoint', "Inline Breakpoint"));
    // Register Quick Access
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: debugQuickAccess_1.StartDebugQuickAccessProvider,
        prefix: debugQuickAccess_1.StartDebugQuickAccessProvider.PREFIX,
        contextKey: 'inLaunchConfigurationsPicker',
        placeholder: nls.localize('startDebugPlaceholder', "Type the name of a launch configuration to run."),
        helpEntries: [{ description: nls.localize('startDebuggingHelp', "Start Debugging"), needsEditor: false }]
    });
    // register service
    extensions_1.registerSingleton(debug_1.IDebugService, service.DebugService);
    // Register configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'debug',
        order: 20,
        title: nls.localize('debugConfigurationTitle', "Debug"),
        type: 'object',
        properties: {
            'debug.allowBreakpointsEverywhere': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'allowBreakpointsEverywhere' }, "Allow setting breakpoints in any file."),
                default: false
            },
            'debug.openExplorerOnEnd': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'openExplorerOnEnd' }, "Automatically open the explorer view at the end of a debug session."),
                default: false
            },
            'debug.inlineValues': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'inlineValues' }, "Show variable values inline in editor while debugging."),
                default: false
            },
            'debug.toolBarLocation': {
                enum: ['floating', 'docked', 'hidden'],
                markdownDescription: nls.localize({ comment: ['This is the description for a setting'], key: 'toolBarLocation' }, "Controls the location of the debug toolbar. Either `floating` in all views, `docked` in the debug view, or `hidden`."),
                default: 'floating'
            },
            'debug.showInStatusBar': {
                enum: ['never', 'always', 'onFirstSessionStart'],
                enumDescriptions: [nls.localize('never', "Never show debug in status bar"), nls.localize('always', "Always show debug in status bar"), nls.localize('onFirstSessionStart', "Show debug in status bar only after debug was started for the first time")],
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showInStatusBar' }, "Controls when the debug status bar should be visible."),
                default: 'onFirstSessionStart'
            },
            'debug.internalConsoleOptions': debug_1.INTERNAL_CONSOLE_OPTIONS_SCHEMA,
            'debug.console.closeOnEnd': {
                type: 'boolean',
                description: nls.localize('debug.console.closeOnEnd', "Controls if the debug console should be automatically closed when the debug session ends."),
                default: false
            },
            'debug.openDebug': {
                enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart', 'openOnDebugBreak'],
                default: 'openOnSessionStart',
                description: nls.localize('openDebug', "Controls when the debug view should open.")
            },
            'debug.showSubSessionsInToolBar': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showSubSessionsInToolBar' }, "Controls whether the debug sub-sessions are shown in the debug tool bar. When this setting is false the stop command on a sub-session will also stop the parent session."),
                default: false
            },
            'debug.console.fontSize': {
                type: 'number',
                description: nls.localize('debug.console.fontSize', "Controls the font size in pixels in the debug console."),
                default: platform_2.isMacintosh ? 12 : 14,
            },
            'debug.console.fontFamily': {
                type: 'string',
                description: nls.localize('debug.console.fontFamily', "Controls the font family in the debug console."),
                default: 'default'
            },
            'debug.console.lineHeight': {
                type: 'number',
                description: nls.localize('debug.console.lineHeight', "Controls the line height in pixels in the debug console. Use 0 to compute the line height from the font size."),
                default: 0
            },
            'debug.console.wordWrap': {
                type: 'boolean',
                description: nls.localize('debug.console.wordWrap', "Controls if the lines should wrap in the debug console."),
                default: true
            },
            'debug.console.historySuggestions': {
                type: 'boolean',
                description: nls.localize('debug.console.historySuggestions', "Controls if the debug console should suggest previously typed input."),
                default: true
            },
            'launch': {
                type: 'object',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'launch' }, "Global debug launch configuration. Should be used as an alternative to 'launch.json' that is shared across workspaces."),
                default: { configurations: [], compounds: [] },
                $ref: configuration_1.launchSchemaId
            },
            'debug.focusWindowOnBreak': {
                type: 'boolean',
                description: nls.localize('debug.focusWindowOnBreak', "Controls whether the workbench window should be focused when the debugger breaks."),
                default: true
            },
            'debug.onTaskErrors': {
                enum: ['debugAnyway', 'showErrors', 'prompt', 'abort'],
                enumDescriptions: [nls.localize('debugAnyway', "Ignore task errors and start debugging."), nls.localize('showErrors', "Show the Problems view and do not start debugging."), nls.localize('prompt', "Prompt user."), nls.localize('cancel', "Cancel debugging.")],
                description: nls.localize('debug.onTaskErrors', "Controls what to do when errors are encountered after running a preLaunchTask."),
                default: 'prompt'
            },
            'debug.showBreakpointsInOverviewRuler': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showBreakpointsInOverviewRuler' }, "Controls whether breakpoints should be shown in the overview ruler."),
                default: false
            },
            'debug.showInlineBreakpointCandidates': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showInlineBreakpointCandidates' }, "Controls whether inline breakpoints candidate decorations should be shown in the editor while debugging."),
                default: true
            }
        }
    });
    // Register Debug Workbench Contributions
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugStatus_1.DebugStatusContribution, 4 /* Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugProgress_1.DebugProgressContribution, 4 /* Eventually */);
    if (platform_2.isWeb) {
        platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugTitle_1.DebugTitleContribution, 4 /* Eventually */);
    }
    // Debug toolbar
    const registerDebugToolBarItem = (id, title, order, icon, when, precondition) => {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.DebugToolBar, {
            group: 'navigation',
            when,
            order,
            command: {
                id,
                title,
                icon,
                precondition
            }
        });
    };
    registerDebugToolBarItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 10, { id: 'codicon/debug-continue' }, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 10, { id: 'codicon/debug-pause' }, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 70, { id: 'codicon/debug-stop' }, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated());
    registerDebugToolBarItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, 70, { id: 'codicon/debug-disconnect' }, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH);
    registerDebugToolBarItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 20, { id: 'codicon/debug-step-over' }, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 30, { id: 'codicon/debug-step-into' }, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 40, { id: 'codicon/debug-step-out' }, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 60, { id: 'codicon/debug-restart' });
    registerDebugToolBarItem(debugCommands_1.STEP_BACK_ID, nls.localize('stepBackDebug', "Step Back"), 50, { id: 'codicon/debug-step-back' }, debug_1.CONTEXT_STEP_BACK_SUPPORTED, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.REVERSE_CONTINUE_ID, nls.localize('reverseContinue', "Reverse"), 60, { id: 'codicon/debug-reverse-continue' }, debug_1.CONTEXT_STEP_BACK_SUPPORTED, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    // Debug callstack context menu
    const registerDebugCallstackItem = (id, title, order, when, precondition, group = 'navigation') => {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.DebugCallStackContext, {
            group,
            when,
            order,
            command: {
                id,
                title,
                precondition
            }
        });
    };
    registerDebugCallstackItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 10, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'));
    registerDebugCallstackItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 20, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'));
    registerDebugCallstackItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 10, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running')));
    registerDebugCallstackItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 10, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')));
    registerDebugCallstackItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 20, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCallstackItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 30, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCallstackItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 40, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCallstackItem(debugCommands_1.TERMINATE_THREAD_ID, nls.localize('terminateThread', "Terminate Thread"), 10, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), undefined, 'termination');
    registerDebugCallstackItem(debugCommands_1.RESTART_FRAME_ID, nls.localize('restartFrame', "Restart Frame"), 10, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('stackFrame'), debug_1.CONTEXT_RESTART_FRAME_SUPPORTED));
    registerDebugCallstackItem(debugCommands_1.COPY_STACK_TRACE_ID, nls.localize('copyStackTrace', "Copy Call Stack"), 20, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('stackFrame'));
    // Editor contributions
    editorExtensions_1.registerEditorContribution('editor.contrib.callStack', callStackEditorContribution_1.CallStackEditorContribution);
    editorExtensions_1.registerEditorContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID, breakpointEditorContribution_1.BreakpointEditorContribution);
    // View menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '3_views',
        command: {
            id: debug_1.VIEWLET_ID,
            title: nls.localize({ key: 'miViewRun', comment: ['&& denotes a mnemonic'] }, "&&Run")
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '4_panels',
        command: {
            id: debugViewlet_1.OpenDebugConsoleAction.ID,
            title: nls.localize({ key: 'miToggleDebugConsole', comment: ['&& denotes a mnemonic'] }, "De&&bug Console")
        },
        order: 2
    });
    // Debug menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugActions_1.StartAction.ID,
            title: nls.localize({ key: 'miStartDebugging', comment: ['&& denotes a mnemonic'] }, "&&Start Debugging")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugActions_1.RunAction.ID,
            title: nls.localize({ key: 'miRun', comment: ['&& denotes a mnemonic'] }, "Run &&Without Debugging")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugCommands_1.STOP_ID,
            title: nls.localize({ key: 'miStopDebugging', comment: ['&& denotes a mnemonic'] }, "&&Stop Debugging"),
            precondition: debug_1.CONTEXT_IN_DEBUG_MODE
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugCommands_1.RESTART_SESSION_ID,
            title: nls.localize({ key: 'miRestart Debugging', comment: ['&& denotes a mnemonic'] }, "&&Restart Debugging"),
            precondition: debug_1.CONTEXT_IN_DEBUG_MODE
        },
        order: 4
    });
    // Configuration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '2_configuration',
        command: {
            id: debugActions_1.ConfigureAction.ID,
            title: nls.localize({ key: 'miOpenConfigurations', comment: ['&& denotes a mnemonic'] }, "Open &&Configurations")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '2_configuration',
        command: {
            id: debugCommands_1.ADD_CONFIGURATION_ID,
            title: nls.localize({ key: 'miAddConfiguration', comment: ['&& denotes a mnemonic'] }, "A&&dd Configuration...")
        },
        order: 2
    });
    // Step Commands
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.STEP_OVER_ID,
            title: nls.localize({ key: 'miStepOver', comment: ['&& denotes a mnemonic'] }, "Step &&Over"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.STEP_INTO_ID,
            title: nls.localize({ key: 'miStepInto', comment: ['&& denotes a mnemonic'] }, "Step &&Into"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.STEP_OUT_ID,
            title: nls.localize({ key: 'miStepOut', comment: ['&& denotes a mnemonic'] }, "Step O&&ut"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.CONTINUE_ID,
            title: nls.localize({ key: 'miContinue', comment: ['&& denotes a mnemonic'] }, "&&Continue"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 4
    });
    // New Breakpoints
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '4_new_breakpoint',
        command: {
            id: debugEditorActions_1.TOGGLE_BREAKPOINT_ID,
            title: nls.localize({ key: 'miToggleBreakpoint', comment: ['&& denotes a mnemonic'] }, "Toggle &&Breakpoint")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarNewBreakpointMenu, {
        group: '1_breakpoints',
        command: {
            id: debugEditorActions_1.TOGGLE_CONDITIONAL_BREAKPOINT_ID,
            title: nls.localize({ key: 'miConditionalBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Conditional Breakpoint...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarNewBreakpointMenu, {
        group: '1_breakpoints',
        command: {
            id: debugCommands_1.TOGGLE_INLINE_BREAKPOINT_ID,
            title: nls.localize({ key: 'miInlineBreakpoint', comment: ['&& denotes a mnemonic'] }, "Inline Breakp&&oint")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarNewBreakpointMenu, {
        group: '1_breakpoints',
        command: {
            id: debugActions_1.AddFunctionBreakpointAction.ID,
            title: nls.localize({ key: 'miFunctionBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Function Breakpoint...")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarNewBreakpointMenu, {
        group: '1_breakpoints',
        command: {
            id: debugEditorActions_1.ADD_LOG_POINT_ID,
            title: nls.localize({ key: 'miLogPoint', comment: ['&& denotes a mnemonic'] }, "&&Logpoint...")
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '4_new_breakpoint',
        title: nls.localize({ key: 'miNewBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&New Breakpoint"),
        submenu: actions_1.MenuId.MenubarNewBreakpointMenu,
        order: 2
    });
    // Modify Breakpoints
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '5_breakpoints',
        command: {
            id: debugActions_1.EnableAllBreakpointsAction.ID,
            title: nls.localize({ key: 'miEnableAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "&&Enable All Breakpoints")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '5_breakpoints',
        command: {
            id: debugActions_1.DisableAllBreakpointsAction.ID,
            title: nls.localize({ key: 'miDisableAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "Disable A&&ll Breakpoints")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '5_breakpoints',
        command: {
            id: debugActions_1.RemoveAllBreakpointsAction.ID,
            title: nls.localize({ key: 'miRemoveAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "Remove &&All Breakpoints")
        },
        order: 3
    });
    // Install Debuggers
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: 'z_install',
        command: {
            id: 'debug.installAdditionalDebuggers',
            title: nls.localize({ key: 'miInstallAdditionalDebuggers', comment: ['&& denotes a mnemonic'] }, "&&Install Additional Debuggers...")
        },
        order: 1
    });
    // Touch Bar
    if (platform_2.isMacintosh) {
        const registerTouchBarEntry = (id, title, order, when, iconUri) => {
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TouchBarContext, {
                command: {
                    id,
                    title,
                    icon: { dark: iconUri }
                },
                when,
                group: '9_debug',
                order
            });
        };
        registerTouchBarEntry(debugActions_1.StartAction.ID, debugActions_1.StartAction.LABEL, 0, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated(), uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/continue-tb.png')));
        registerTouchBarEntry(debugActions_1.RunAction.ID, debugActions_1.RunAction.LABEL, 1, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated(), uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/continue-without-debugging-tb.png')));
        registerTouchBarEntry(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 0, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/continue-tb.png')));
        registerTouchBarEntry(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 1, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkey_1.ContextKeyExpr.notEquals('debugState', 'stopped')), uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/pause-tb.png')));
        registerTouchBarEntry(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 2, debug_1.CONTEXT_IN_DEBUG_MODE, uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/stepover-tb.png')));
        registerTouchBarEntry(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 3, debug_1.CONTEXT_IN_DEBUG_MODE, uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/stepinto-tb.png')));
        registerTouchBarEntry(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 4, debug_1.CONTEXT_IN_DEBUG_MODE, uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/stepout-tb.png')));
        registerTouchBarEntry(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 5, debug_1.CONTEXT_IN_DEBUG_MODE, uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/restart-tb.png')));
        registerTouchBarEntry(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 6, debug_1.CONTEXT_IN_DEBUG_MODE, uri_1.URI.parse(require.toUrl('vs/workbench/contrib/debug/browser/media/stop-tb.png')));
    }
    // Color contributions
    const debugTokenExpressionName = colorRegistry_1.registerColor('debugTokenExpression.name', { dark: '#c586c0', light: '#9b46b0', hc: colorRegistry_1.foreground }, 'Foreground color for the token names shown in the debug views (ie. the Variables or Watch view).');
    const debugTokenExpressionValue = colorRegistry_1.registerColor('debugTokenExpression.value', { dark: '#cccccc99', light: '#6c6c6ccc', hc: colorRegistry_1.foreground }, 'Foreground color for the token values shown in the debug views (ie. the Variables or Watch view).');
    const debugTokenExpressionString = colorRegistry_1.registerColor('debugTokenExpression.string', { dark: '#ce9178', light: '#a31515', hc: '#f48771' }, 'Foreground color for strings in the debug views (ie. the Variables or Watch view).');
    const debugTokenExpressionBoolean = colorRegistry_1.registerColor('debugTokenExpression.boolean', { dark: '#4e94ce', light: '#0000ff', hc: '#75bdfe' }, 'Foreground color for booleans in the debug views (ie. the Variables or Watch view).');
    const debugTokenExpressionNumber = colorRegistry_1.registerColor('debugTokenExpression.number', { dark: '#b5cea8', light: '#098658', hc: '#89d185' }, 'Foreground color for numbers in the debug views (ie. the Variables or Watch view).');
    const debugTokenExpressionError = colorRegistry_1.registerColor('debugTokenExpression.error', { dark: '#f48771', light: '#e51400', hc: '#f48771' }, 'Foreground color for expression errors in the debug views (ie. the Variables or Watch view) and for error logs shown in the debug console.');
    const debugViewExceptionLabelForeground = colorRegistry_1.registerColor('debugView.exceptionLabelForeground', { dark: colorRegistry_1.foreground, light: '#FFF', hc: colorRegistry_1.foreground }, 'Foreground color for a label shown in the CALL STACK view when the debugger breaks on an exception.');
    const debugViewExceptionLabelBackground = colorRegistry_1.registerColor('debugView.exceptionLabelBackground', { dark: '#6C2022', light: '#A31515', hc: '#6C2022' }, 'Background color for a label shown in the CALL STACK view when the debugger breaks on an exception.');
    const debugViewStateLabelForeground = colorRegistry_1.registerColor('debugView.stateLabelForeground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hc: colorRegistry_1.foreground }, 'Foreground color for a label in the CALL STACK view showing the current session\'s or thread\'s state.');
    const debugViewStateLabelBackground = colorRegistry_1.registerColor('debugView.stateLabelBackground', { dark: '#88888844', light: '#88888844', hc: '#88888844' }, 'Background color for a label in the CALL STACK view showing the current session\'s or thread\'s state.');
    const debugViewValueChangedHighlight = colorRegistry_1.registerColor('debugView.valueChangedHighlight', { dark: '#569CD6', light: '#569CD6', hc: '#569CD6' }, 'Color used to highlight value changes in the debug views (ie. in the Variables view).');
    const debugConsoleInfoForeground = colorRegistry_1.registerColor('debugConsole.infoForeground', { dark: colorRegistry_1.editorInfoForeground, light: colorRegistry_1.editorInfoForeground, hc: colorRegistry_1.foreground }, 'Foreground color for info messages in debug REPL console.');
    const debugConsoleWarningForeground = colorRegistry_1.registerColor('debugConsole.warningForeground', { dark: colorRegistry_1.editorWarningForeground, light: colorRegistry_1.editorWarningForeground, hc: '#008000' }, 'Foreground color for warning messages in debug REPL console.');
    const debugConsoleErrorForeground = colorRegistry_1.registerColor('debugConsole.errorForeground', { dark: colorRegistry_1.errorForeground, light: colorRegistry_1.errorForeground, hc: colorRegistry_1.errorForeground }, 'Foreground color for error messages in debug REPL console.');
    const debugConsoleSourceForeground = colorRegistry_1.registerColor('debugConsole.sourceForeground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hc: colorRegistry_1.foreground }, 'Foreground color for source filenames in debug REPL console.');
    const debugConsoleInputIconForeground = colorRegistry_1.registerColor('debugConsoleInputIcon.foreground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hc: colorRegistry_1.foreground }, 'Foreground color for debug console input marker icon.');
    themeService_1.registerThemingParticipant((theme, collector) => {
        // All these colours provide a default value so they will never be undefined, hence the `!`
        const badgeBackgroundColor = theme.getColor(colorRegistry_1.badgeBackground);
        const badgeForegroundColor = theme.getColor(colorRegistry_1.badgeForeground);
        const listDeemphasizedForegroundColor = theme.getColor(colorRegistry_1.listDeemphasizedForeground);
        const debugViewExceptionLabelForegroundColor = theme.getColor(debugViewExceptionLabelForeground);
        const debugViewExceptionLabelBackgroundColor = theme.getColor(debugViewExceptionLabelBackground);
        const debugViewStateLabelForegroundColor = theme.getColor(debugViewStateLabelForeground);
        const debugViewStateLabelBackgroundColor = theme.getColor(debugViewStateLabelBackground);
        const debugViewValueChangedHighlightColor = theme.getColor(debugViewValueChangedHighlight);
        collector.addRule(`
		/* Text colour of the call stack row's filename */
		.debug-pane .debug-call-stack .monaco-list-row:not(.selected) .stack-frame > .file .file-name {
			color: ${listDeemphasizedForegroundColor}
		}

		/* Line & column number "badge" for selected call stack row */
		.debug-pane .monaco-list-row.selected .line-number {
			background-color: ${badgeBackgroundColor};
			color: ${badgeForegroundColor};
		}

		/* Line & column number "badge" for unselected call stack row (basically all other rows) */
		.debug-pane .line-number {
			background-color: ${badgeBackgroundColor.transparent(0.6)};
			color: ${badgeForegroundColor.transparent(0.6)};
		}

		/* State "badge" displaying the active session's current state.
		 * Only visible when there are more active debug sessions/threads running.
		 */
		.debug-pane .debug-call-stack .thread > .state > .label,
		.debug-pane .debug-call-stack .session > .state > .label,
		.debug-pane .monaco-list-row.selected .thread > .state > .label,
		.debug-pane .monaco-list-row.selected .session > .state > .label {
			background-color: ${debugViewStateLabelBackgroundColor};
			color: ${debugViewStateLabelForegroundColor};
		}

		/* Info "badge" shown when the debugger pauses due to a thrown exception. */
		.debug-pane .debug-call-stack-title > .pause-message > .label.exception {
			background-color: ${debugViewExceptionLabelBackgroundColor};
			color: ${debugViewExceptionLabelForegroundColor};
		}

		/* Animation of changed values in Debug viewlet */
		@keyframes debugViewletValueChanged {
			0%   { background-color: ${debugViewValueChangedHighlightColor.transparent(0)} }
			5%   { background-color: ${debugViewValueChangedHighlightColor.transparent(0.9)} }
			100% { background-color: ${debugViewValueChangedHighlightColor.transparent(0.3)} }
		}

		.debug-pane .monaco-list-row .expression .value.changed {
			background-color: ${debugViewValueChangedHighlightColor.transparent(0.3)};
			animation-name: debugViewletValueChanged;
			animation-duration: 1s;
			animation-fill-mode: forwards;
		}
	`);
        const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
        if (contrastBorderColor) {
            collector.addRule(`
		.debug-pane .line-number {
			border: 1px solid ${contrastBorderColor};
		}
		`);
        }
        const tokenNameColor = theme.getColor(debugTokenExpressionName);
        const tokenValueColor = theme.getColor(debugTokenExpressionValue);
        const tokenStringColor = theme.getColor(debugTokenExpressionString);
        const tokenBooleanColor = theme.getColor(debugTokenExpressionBoolean);
        const tokenErrorColor = theme.getColor(debugTokenExpressionError);
        const tokenNumberColor = theme.getColor(debugTokenExpressionNumber);
        collector.addRule(`
		.monaco-workbench .monaco-list-row .expression .name {
			color: ${tokenNameColor};
		}

		.monaco-workbench .monaco-list-row .expression .value,
		.monaco-workbench .debug-hover-widget .value {
			color: ${tokenValueColor};
		}

		.monaco-workbench .monaco-list-row .expression .value.string,
		.monaco-workbench .debug-hover-widget .value.string {
			color: ${tokenStringColor};
		}

		.monaco-workbench .monaco-list-row .expression .value.boolean,
		.monaco-workbench .debug-hover-widget .value.boolean {
			color: ${tokenBooleanColor};
		}

		.monaco-workbench .monaco-list-row .expression .error,
		.monaco-workbench .debug-hover-widget .error,
		.monaco-workbench .debug-pane .debug-variables .scope .error {
			color: ${tokenErrorColor};
		}

		.monaco-workbench .monaco-list-row .expression .value.number,
		.monaco-workbench .debug-hover-widget .value.number {
			color: ${tokenNumberColor};
		}
	`);
        const debugConsoleInputBorderColor = theme.getColor(colorRegistry_1.inputBorder) || color_1.Color.fromHex('#80808060');
        const debugConsoleInfoForegroundColor = theme.getColor(debugConsoleInfoForeground);
        const debugConsoleWarningForegroundColor = theme.getColor(debugConsoleWarningForeground);
        const debugConsoleErrorForegroundColor = theme.getColor(debugConsoleErrorForeground);
        const debugConsoleSourceForegroundColor = theme.getColor(debugConsoleSourceForeground);
        const debugConsoleInputIconForegroundColor = theme.getColor(debugConsoleInputIconForeground);
        collector.addRule(`
		.repl .repl-input-wrapper {
			border-top: 1px solid ${debugConsoleInputBorderColor};
		}

		.monaco-workbench .repl .repl-tree .output .expression .value.info {
			color: ${debugConsoleInfoForegroundColor};
		}

		.monaco-workbench .repl .repl-tree .output .expression .value.warn {
			color: ${debugConsoleWarningForegroundColor};
		}

		.monaco-workbench .repl .repl-tree .output .expression .value.error {
			color: ${debugConsoleErrorForegroundColor};
		}

		.monaco-workbench .repl .repl-tree .output .expression .source {
			color: ${debugConsoleSourceForegroundColor};
		}

		.monaco-workbench .repl .repl-tree .monaco-tl-contents .arrow {
			color: ${debugConsoleInputIconForegroundColor};
		}
	`);
        if (!theme.defines(debugConsoleInputIconForeground)) {
            collector.addRule(`
			.monaco-workbench.vs .repl .repl-tree .monaco-tl-contents .arrow {
				opacity: 0.25;
			}

			.monaco-workbench.vs-dark .repl .repl-tree .monaco-tl-contents .arrow {
				opacity: 0.4;
			}

			.monaco-workbench.hc-black .repl .repl-tree .monaco-tl-contents .arrow {
				opacity: 1;
			}
		`);
        }
    });
});
//# __sourceMappingURL=debug.contribution.js.map