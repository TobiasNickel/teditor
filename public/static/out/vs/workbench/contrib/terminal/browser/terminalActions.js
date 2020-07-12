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
define(["require", "exports", "vs/base/common/actions", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/terminal/common/terminal", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/services/layout/browser/layoutService", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/quickinput/common/quickInput", "vs/platform/contextview/browser/contextView", "vs/platform/commands/common/commands", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/notification/common/notification", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/browser/actions/layoutActions", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/base/browser/dom", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/opener/common/opener"], function (require, exports, actions_1, codeEditorService_1, terminal_1, actionbar_1, layoutService_1, styler_1, themeService_1, quickInput_1, contextView_1, commands_1, workspace_1, workspaceCommands_1, notification_1, configurationResolver_1, history_1, network_1, platform_1, types_1, terminal_2, actions_2, terminalQuickAccess_1, layoutActions_1, views_1, contextkey_1, dom_1, colorRegistry_1, nls_1, accessibility_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerTerminalActions = exports.TerminalLaunchTroubleshootAction = exports.ClearTerminalAction = exports.SwitchTerminalActionViewItem = exports.SwitchTerminalAction = exports.SelectDefaultShellWindowsTerminalAction = exports.TerminalPasteAction = exports.SplitInActiveWorkspaceTerminalAction = exports.SplitTerminalAction = exports.CreateNewTerminalAction = exports.terminalSendSequenceCommand = exports.SelectAllTerminalAction = exports.CopyTerminalSelectionAction = exports.KillTerminalAction = exports.ToggleTerminalAction = void 0;
    async function getCwdForSplit(configHelper, instance, folders, commandService) {
        switch (configHelper.config.splitCwd) {
            case 'workspaceRoot':
                if (folders !== undefined && commandService !== undefined) {
                    if (folders.length === 1) {
                        return folders[0].uri;
                    }
                    else if (folders.length > 1) {
                        // Only choose a path when there's more than 1 folder
                        const options = {
                            placeHolder: nls_1.localize('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                        };
                        const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                        if (!workspace) {
                            // Don't split the instance if the workspace picker was canceled
                            return undefined;
                        }
                        return Promise.resolve(workspace.uri);
                    }
                }
                return '';
            case 'initial':
                return instance.getInitialCwd();
            case 'inherited':
                return instance.getCwd();
        }
    }
    let ToggleTerminalAction = class ToggleTerminalAction extends layoutActions_1.ToggleViewAction {
        constructor(id, label, viewsService, viewDescriptorService, contextKeyService, layoutService, terminalService) {
            super(id, label, terminal_1.TERMINAL_VIEW_ID, viewsService, viewDescriptorService, contextKeyService, layoutService);
            this.terminalService = terminalService;
        }
        async run() {
            if (this.terminalService.terminalInstances.length === 0) {
                // If there is not yet an instance attempt to create it here so that we can suggest a
                // new shell on Windows (and not do so when the panel is restored on reload).
                const newTerminalInstance = this.terminalService.createTerminal(undefined);
                const toDispose = newTerminalInstance.onProcessIdReady(() => {
                    newTerminalInstance.focus();
                    toDispose.dispose();
                });
            }
            return super.run();
        }
    };
    ToggleTerminalAction.ID = "workbench.action.terminal.toggleTerminal" /* TOGGLE */;
    ToggleTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.toggleTerminal', "Toggle Integrated Terminal");
    ToggleTerminalAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, terminal_2.ITerminalService)
    ], ToggleTerminalAction);
    exports.ToggleTerminalAction = ToggleTerminalAction;
    let KillTerminalAction = class KillTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label, 'terminal-action codicon-trash');
            this._terminalService = _terminalService;
        }
        async run() {
            await this._terminalService.doWithActiveInstance(async (t) => {
                t.dispose(true);
                if (this._terminalService.terminalInstances.length > 0) {
                    await this._terminalService.showPanel(true);
                }
            });
        }
    };
    KillTerminalAction.ID = "workbench.action.terminal.kill" /* KILL */;
    KillTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.kill', "Kill the Active Terminal Instance");
    KillTerminalAction.PANEL_LABEL = nls_1.localize('workbench.action.terminal.kill.short', "Kill Terminal");
    KillTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], KillTerminalAction);
    exports.KillTerminalAction = KillTerminalAction;
    /**
     * Copies the terminal selection. Note that since the command palette takes focus from the terminal,
     * this cannot be triggered through the command palette.
     */
    let CopyTerminalSelectionAction = class CopyTerminalSelectionAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        async run() {
            var _a;
            await ((_a = this._terminalService.getActiveInstance()) === null || _a === void 0 ? void 0 : _a.copySelection());
        }
    };
    CopyTerminalSelectionAction.ID = "workbench.action.terminal.copySelection" /* COPY_SELECTION */;
    CopyTerminalSelectionAction.LABEL = nls_1.localize('workbench.action.terminal.copySelection', "Copy Selection");
    CopyTerminalSelectionAction.SHORT_LABEL = nls_1.localize('workbench.action.terminal.copySelection.short', "Copy");
    CopyTerminalSelectionAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], CopyTerminalSelectionAction);
    exports.CopyTerminalSelectionAction = CopyTerminalSelectionAction;
    let SelectAllTerminalAction = class SelectAllTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        async run() {
            var _a;
            (_a = this._terminalService.getActiveInstance()) === null || _a === void 0 ? void 0 : _a.selectAll();
        }
    };
    SelectAllTerminalAction.ID = "workbench.action.terminal.selectAll" /* SELECT_ALL */;
    SelectAllTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.selectAll', "Select All");
    SelectAllTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectAllTerminalAction);
    exports.SelectAllTerminalAction = SelectAllTerminalAction;
    exports.terminalSendSequenceCommand = (accessor, args) => {
        accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
            if (!(args === null || args === void 0 ? void 0 : args.text)) {
                return;
            }
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const historyService = accessor.get(history_1.IHistoryService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? types_1.withNullAsUndefined(workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            const resolvedText = configurationResolverService.resolve(lastActiveWorkspaceRoot, args.text);
            t.sendText(resolvedText, false);
        });
    };
    let CreateNewTerminalAction = class CreateNewTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService, _commandService, _workspaceContextService) {
            super(id, label, 'terminal-action codicon-add');
            this._terminalService = _terminalService;
            this._commandService = _commandService;
            this._workspaceContextService = _workspaceContextService;
        }
        async run(event) {
            const folders = this._workspaceContextService.getWorkspace().folders;
            if (event instanceof MouseEvent && (event.altKey || event.ctrlKey)) {
                const activeInstance = this._terminalService.getActiveInstance();
                if (activeInstance) {
                    const cwd = await getCwdForSplit(this._terminalService.configHelper, activeInstance);
                    this._terminalService.splitInstance(activeInstance, { cwd });
                    return;
                }
            }
            let instance;
            if (folders.length <= 1) {
                // Allow terminal service to handle the path when there is only a
                // single root
                instance = this._terminalService.createTerminal(undefined);
            }
            else {
                const options = {
                    placeHolder: nls_1.localize('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                };
                const workspace = await this._commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                if (!workspace) {
                    // Don't create the instance if the workspace picker was canceled
                    return;
                }
                instance = this._terminalService.createTerminal({ cwd: workspace.uri });
            }
            this._terminalService.setActiveInstance(instance);
            await this._terminalService.showPanel(true);
        }
    };
    CreateNewTerminalAction.ID = "workbench.action.terminal.new" /* NEW */;
    CreateNewTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.new', "Create New Integrated Terminal");
    CreateNewTerminalAction.SHORT_LABEL = nls_1.localize('workbench.action.terminal.new.short', "New Terminal");
    CreateNewTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], CreateNewTerminalAction);
    exports.CreateNewTerminalAction = CreateNewTerminalAction;
    let SplitTerminalAction = class SplitTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService, _commandService, _workspaceContextService) {
            super(id, label, SplitTerminalAction.HORIZONTAL_CLASS);
            this._terminalService = _terminalService;
            this._commandService = _commandService;
            this._workspaceContextService = _workspaceContextService;
        }
        async run() {
            await this._terminalService.doWithActiveInstance(async (t) => {
                const cwd = await getCwdForSplit(this._terminalService.configHelper, t, this._workspaceContextService.getWorkspace().folders, this._commandService);
                if (cwd === undefined) {
                    return undefined;
                }
                this._terminalService.splitInstance(t, { cwd });
                return this._terminalService.showPanel(true);
            });
        }
    };
    SplitTerminalAction.ID = "workbench.action.terminal.split" /* SPLIT */;
    SplitTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.split', "Split Terminal");
    SplitTerminalAction.SHORT_LABEL = nls_1.localize('workbench.action.terminal.split.short', "Split");
    SplitTerminalAction.HORIZONTAL_CLASS = 'terminal-action codicon-split-horizontal';
    SplitTerminalAction.VERTICAL_CLASS = 'terminal-action codicon-split-vertical';
    SplitTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], SplitTerminalAction);
    exports.SplitTerminalAction = SplitTerminalAction;
    let SplitInActiveWorkspaceTerminalAction = class SplitInActiveWorkspaceTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        async run() {
            await this._terminalService.doWithActiveInstance(async (t) => {
                const cwd = await getCwdForSplit(this._terminalService.configHelper, t);
                this._terminalService.splitInstance(t, { cwd });
                await this._terminalService.showPanel(true);
            });
        }
    };
    SplitInActiveWorkspaceTerminalAction.ID = "workbench.action.terminal.splitInActiveWorkspace" /* SPLIT_IN_ACTIVE_WORKSPACE */;
    SplitInActiveWorkspaceTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.splitInActiveWorkspace', "Split Terminal (In Active Workspace)");
    SplitInActiveWorkspaceTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SplitInActiveWorkspaceTerminalAction);
    exports.SplitInActiveWorkspaceTerminalAction = SplitInActiveWorkspaceTerminalAction;
    let TerminalPasteAction = class TerminalPasteAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        async run() {
            var _a;
            (_a = this._terminalService.getActiveOrCreateInstance()) === null || _a === void 0 ? void 0 : _a.paste();
        }
    };
    TerminalPasteAction.ID = "workbench.action.terminal.paste" /* PASTE */;
    TerminalPasteAction.LABEL = nls_1.localize('workbench.action.terminal.paste', "Paste into Active Terminal");
    TerminalPasteAction.SHORT_LABEL = nls_1.localize('workbench.action.terminal.paste.short', "Paste");
    TerminalPasteAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], TerminalPasteAction);
    exports.TerminalPasteAction = TerminalPasteAction;
    let SelectDefaultShellWindowsTerminalAction = class SelectDefaultShellWindowsTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        async run() {
            this._terminalService.selectDefaultShell();
        }
    };
    SelectDefaultShellWindowsTerminalAction.ID = "workbench.action.terminal.selectDefaultShell" /* SELECT_DEFAULT_SHELL */;
    SelectDefaultShellWindowsTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.selectDefaultShell', "Select Default Shell");
    SelectDefaultShellWindowsTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectDefaultShellWindowsTerminalAction);
    exports.SelectDefaultShellWindowsTerminalAction = SelectDefaultShellWindowsTerminalAction;
    let SwitchTerminalAction = class SwitchTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label, 'terminal-action switch-terminal');
            this._terminalService = _terminalService;
        }
        run(item) {
            if (!item || !item.split) {
                return Promise.resolve(null);
            }
            if (item === SwitchTerminalActionViewItem.SEPARATOR) {
                this._terminalService.refreshActiveTab();
                return Promise.resolve(null);
            }
            if (item === SelectDefaultShellWindowsTerminalAction.LABEL) {
                this._terminalService.refreshActiveTab();
                return this._terminalService.selectDefaultShell();
            }
            const selectedTabIndex = parseInt(item.split(':')[0], 10) - 1;
            this._terminalService.setActiveTabByIndex(selectedTabIndex);
            return this._terminalService.showPanel(true);
        }
    };
    SwitchTerminalAction.ID = "workbench.action.terminal.switchTerminal" /* SWITCH_TERMINAL */;
    SwitchTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.switchTerminal', "Switch Terminal");
    SwitchTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SwitchTerminalAction);
    exports.SwitchTerminalAction = SwitchTerminalAction;
    let SwitchTerminalActionViewItem = class SwitchTerminalActionViewItem extends actionbar_1.SelectActionViewItem {
        constructor(action, _terminalService, _themeService, contextViewService) {
            super(null, action, getTerminalSelectOpenItems(_terminalService), _terminalService.activeTabIndex, contextViewService, { ariaLabel: nls_1.localize('terminals', 'Open Terminals.'), optionsAsChildren: true });
            this._terminalService = _terminalService;
            this._themeService = _themeService;
            this._register(_terminalService.onInstancesChanged(this._updateItems, this));
            this._register(_terminalService.onActiveTabChanged(this._updateItems, this));
            this._register(_terminalService.onInstanceTitleChanged(this._updateItems, this));
            this._register(_terminalService.onTabDisposed(this._updateItems, this));
            this._register(styler_1.attachSelectBoxStyler(this.selectBox, _themeService));
        }
        render(container) {
            super.render(container);
            dom_1.addClass(container, 'switch-terminal');
            this._register(styler_1.attachStylerCallback(this._themeService, { selectBorder: colorRegistry_1.selectBorder }, colors => {
                container.style.borderColor = colors.selectBorder ? `${colors.selectBorder}` : '';
            }));
        }
        _updateItems() {
            this.setOptions(getTerminalSelectOpenItems(this._terminalService), this._terminalService.activeTabIndex);
        }
    };
    SwitchTerminalActionViewItem.SEPARATOR = '─────────';
    SwitchTerminalActionViewItem = __decorate([
        __param(1, terminal_2.ITerminalService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService)
    ], SwitchTerminalActionViewItem);
    exports.SwitchTerminalActionViewItem = SwitchTerminalActionViewItem;
    function getTerminalSelectOpenItems(terminalService) {
        const items = terminalService.getTabLabels().map(label => ({ text: label }));
        items.push({ text: SwitchTerminalActionViewItem.SEPARATOR, isDisabled: true });
        items.push({ text: SelectDefaultShellWindowsTerminalAction.LABEL });
        return items;
    }
    let ClearTerminalAction = class ClearTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        async run() {
            this._terminalService.doWithActiveInstance(t => {
                t.clear();
                t.focus();
            });
        }
    };
    ClearTerminalAction.ID = "workbench.action.terminal.clear" /* CLEAR */;
    ClearTerminalAction.LABEL = nls_1.localize('workbench.action.terminal.clear', "Clear");
    ClearTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ClearTerminalAction);
    exports.ClearTerminalAction = ClearTerminalAction;
    let TerminalLaunchTroubleshootAction = class TerminalLaunchTroubleshootAction extends actions_1.Action {
        constructor(_openerService) {
            super('workbench.action.terminal.launchHelp', nls_1.localize('terminalLaunchTroubleshoot', "Troubleshoot"));
            this._openerService = _openerService;
        }
        async run() {
            this._openerService.open('https://aka.ms/vscode-troubleshoot-terminal-launch');
        }
    };
    TerminalLaunchTroubleshootAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], TerminalLaunchTroubleshootAction);
    exports.TerminalLaunchTroubleshootAction = TerminalLaunchTroubleshootAction;
    function registerTerminalActions() {
        const category = { value: terminal_1.TERMINAL_ACTION_CATEGORY, original: 'Terminal' };
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.newInActiveWorkspace" /* NEW_IN_ACTIVE_WORKSPACE */,
                    title: { value: nls_1.localize('workbench.action.terminal.newInActiveWorkspace', "Create New Integrated Terminal (In Active Workspace)"), original: 'Create New Integrated Terminal (In Active Workspace)' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instance = terminalService.createTerminal(undefined);
                if (!instance) {
                    return;
                }
                terminalService.setActiveInstance(instance);
                await terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusPreviousPane" /* FOCUS_PREVIOUS_PANE */,
                    title: { value: nls_1.localize('workbench.action.terminal.focusPreviousPane', "Focus Previous Pane"), original: 'Focus Previous Pane' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* Alt */ | 15 /* LeftArrow */,
                        secondary: [512 /* Alt */ | 16 /* UpArrow */],
                        mac: {
                            primary: 512 /* Alt */ | 2048 /* CtrlCmd */ | 15 /* LeftArrow */,
                            secondary: [512 /* Alt */ | 2048 /* CtrlCmd */ | 16 /* UpArrow */]
                        },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                var _a;
                const terminalService = accessor.get(terminal_2.ITerminalService);
                (_a = terminalService.getActiveTab()) === null || _a === void 0 ? void 0 : _a.focusPreviousPane();
                await terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusNextPane" /* FOCUS_NEXT_PANE */,
                    title: { value: nls_1.localize('workbench.action.terminal.focusNextPane', "Focus Next Pane"), original: 'Focus Next Pane' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* Alt */ | 17 /* RightArrow */,
                        secondary: [512 /* Alt */ | 18 /* DownArrow */],
                        mac: {
                            primary: 512 /* Alt */ | 2048 /* CtrlCmd */ | 17 /* RightArrow */,
                            secondary: [512 /* Alt */ | 2048 /* CtrlCmd */ | 18 /* DownArrow */]
                        },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                var _a;
                const terminalService = accessor.get(terminal_2.ITerminalService);
                (_a = terminalService.getActiveTab()) === null || _a === void 0 ? void 0 : _a.focusNextPane();
                await terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneLeft" /* RESIZE_PANE_LEFT */,
                    title: { value: nls_1.localize('workbench.action.terminal.resizePaneLeft', "Resize Pane Left"), original: 'Resize Pane Left' },
                    f1: true,
                    category,
                    keybinding: {
                        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 15 /* LeftArrow */ },
                        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 15 /* LeftArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveTab()) === null || _a === void 0 ? void 0 : _a.resizePane(0 /* Left */);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneRight" /* RESIZE_PANE_RIGHT */,
                    title: { value: nls_1.localize('workbench.action.terminal.resizePaneRight', "Resize Pane Right"), original: 'Resize Pane Right' },
                    f1: true,
                    category,
                    keybinding: {
                        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 17 /* RightArrow */ },
                        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 17 /* RightArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveTab()) === null || _a === void 0 ? void 0 : _a.resizePane(1 /* Right */);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneUp" /* RESIZE_PANE_UP */,
                    title: { value: nls_1.localize('workbench.action.terminal.resizePaneUp', "Resize Pane Up"), original: 'Resize Pane Up' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 16 /* UpArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveTab()) === null || _a === void 0 ? void 0 : _a.resizePane(2 /* Up */);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneDown" /* RESIZE_PANE_DOWN */,
                    title: { value: nls_1.localize('workbench.action.terminal.resizePaneDown', "Resize Pane Down"), original: 'Resize Pane Down' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 18 /* DownArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveTab()) === null || _a === void 0 ? void 0 : _a.resizePane(3 /* Down */);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focus" /* FOCUS */,
                    title: { value: nls_1.localize('workbench.action.terminal.focus', "Focus Terminal"), original: 'Focus Terminal' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instance = terminalService.getActiveOrCreateInstance();
                if (!instance) {
                    return;
                }
                terminalService.setActiveInstance(instance);
                return terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusNext" /* FOCUS_NEXT */,
                    title: { value: nls_1.localize('workbench.action.terminal.focusNext', "Focus Next Terminal"), original: 'Focus Next Terminal' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                terminalService.setActiveTabToNext();
                await terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusPrevious" /* FOCUS_PREVIOUS */,
                    title: { value: nls_1.localize('workbench.action.terminal.focusPrevious', "Focus Previous Terminal"), original: 'Focus Previous Terminal' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                terminalService.setActiveTabToPrevious();
                await terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.runSelectedText" /* RUN_SELECTED_TEXT */,
                    title: { value: nls_1.localize('workbench.action.terminal.runSelectedText', "Run Selected Text In Active Terminal"), original: 'Run Selected Text In Active Terminal' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const instance = terminalService.getActiveOrCreateInstance();
                let editor = codeEditorService.getFocusedCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                let selection = editor.getSelection();
                let text;
                if (selection.isEmpty()) {
                    text = editor.getModel().getLineContent(selection.selectionStartLineNumber).trim();
                }
                else {
                    const endOfLinePreference = platform_1.isWindows ? 1 /* LF */ : 2 /* CRLF */;
                    text = editor.getModel().getValueInRange(selection, endOfLinePreference);
                }
                instance.sendText(text, true);
                return terminalService.showPanel();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.runActiveFile" /* RUN_ACTIVE_FILE */,
                    title: { value: nls_1.localize('workbench.action.terminal.runActiveFile', "Run Active File In Active Terminal"), original: 'Run Active File In Active Terminal' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const instance = terminalService.getActiveOrCreateInstance();
                await instance.processReady;
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                const uri = editor.getModel().uri;
                if (uri.scheme !== 'file') {
                    notificationService.warn(nls_1.localize('workbench.action.terminal.runActiveFile.noFile', 'Only files on disk can be run in the terminal'));
                    return;
                }
                // TODO: Convert this to ctrl+c, ctrl+v for pwsh?
                const path = await terminalService.preparePathForTerminalAsync(uri.fsPath, instance.shellLaunchConfig.executable, instance.title, instance.shellType);
                instance.sendText(path, true);
                return terminalService.showPanel();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollDown" /* SCROLL_DOWN_LINE */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollDown', "Scroll Down (Line)"), original: 'Scroll Down (Line)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 12 /* PageDown */,
                        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 18 /* DownArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.scrollDownLine();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollDownPage" /* SCROLL_DOWN_PAGE */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollDownPage', "Scroll Down (Page)"), original: 'Scroll Down (Page)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 1024 /* Shift */ | 12 /* PageDown */,
                        mac: { primary: 12 /* PageDown */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.scrollDownPage();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToBottom" /* SCROLL_TO_BOTTOM */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollToBottom', "Scroll to Bottom"), original: 'Scroll to Bottom' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 13 /* End */,
                        linux: { primary: 1024 /* Shift */ | 13 /* End */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.scrollToBottom();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollUp" /* SCROLL_UP_LINE */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollUp', "Scroll Up (Line)"), original: 'Scroll Up (Line)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 11 /* PageUp */,
                        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 16 /* UpArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.scrollUpLine();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollUpPage" /* SCROLL_UP_PAGE */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollUpPage', "Scroll Up (Page)"), original: 'Scroll Up (Page)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 1024 /* Shift */ | 11 /* PageUp */,
                        mac: { primary: 11 /* PageUp */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.scrollUpPage();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToTop" /* SCROLL_TO_TOP */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollToTop', "Scroll to Top"), original: 'Scroll to Top' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 14 /* Home */,
                        linux: { primary: 1024 /* Shift */ | 14 /* Home */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.scrollToTop();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.navigationModeExit" /* NAVIGATION_MODE_EXIT */,
                    title: { value: nls_1.localize('workbench.action.terminal.navigationModeExit', "Exit Navigation Mode"), original: 'Exit Navigation Mode' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 9 /* Escape */,
                        when: contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a, _b;
                (_b = (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.navigationMode) === null || _b === void 0 ? void 0 : _b.exitNavigationMode();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.navigationModeFocusPrevious" /* NAVIGATION_MODE_FOCUS_PREVIOUS */,
                    title: { value: nls_1.localize('workbench.action.terminal.navigationModeFocusPrevious', "Focus Previous Line (Navigation Mode)"), original: 'Focus Previous Line (Navigation Mode)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED), contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a, _b;
                (_b = (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.navigationMode) === null || _b === void 0 ? void 0 : _b.focusPreviousLine();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.navigationModeFocusNext" /* NAVIGATION_MODE_FOCUS_NEXT */,
                    title: { value: nls_1.localize('workbench.action.terminal.navigationModeFocusNext', "Focus Next Line (Navigation Mode)"), original: 'Focus Next Line (Navigation Mode)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED), contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                var _a, _b;
                (_b = (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.navigationMode) === null || _b === void 0 ? void 0 : _b.focusNextLine();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.clearSelection" /* CLEAR_SELECTION */,
                    title: { value: nls_1.localize('workbench.action.terminal.clearSelection', "Clear Selection"), original: 'Clear Selection' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 9 /* Escape */,
                        when: contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_NOT_VISIBLE),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                const terminalInstance = accessor.get(terminal_2.ITerminalService).getActiveInstance();
                if (terminalInstance && terminalInstance.hasSelection()) {
                    terminalInstance.clearSelection();
                }
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.manageWorkspaceShellPermissions" /* MANAGE_WORKSPACE_SHELL_PERMISSIONS */,
                    title: { value: nls_1.localize('workbench.action.terminal.manageWorkspaceShellPermissions', "Manage Workspace Shell Permissions"), original: 'Manage Workspace Shell Permissions' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).manageWorkspaceShellPermissions();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.rename" /* RENAME */,
                    title: { value: nls_1.localize('workbench.action.terminal.rename', "Rename"), original: 'Rename' },
                    f1: true,
                    category
                });
            }
            async run(accessor) {
                await accessor.get(terminal_2.ITerminalService).doWithActiveInstance(async (t) => {
                    const name = await accessor.get(quickInput_1.IQuickInputService).input({
                        value: t.title,
                        prompt: nls_1.localize('workbench.action.terminal.rename.prompt', "Enter terminal name"),
                    });
                    if (name) {
                        t.setTitle(name, terminal_1.TitleEventSource.Api);
                    }
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusFind" /* FIND_FOCUS */,
                    title: { value: nls_1.localize('workbench.action.terminal.focusFind', "Focus Find"), original: 'Focus Find' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                        when: contextkey_1.ContextKeyExpr.or(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).focusFindWidget();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.hideFind" /* FIND_HIDE */,
                    title: { value: nls_1.localize('workbench.action.terminal.hideFind', "Hide Find"), original: 'Hide Find' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 9 /* Escape */,
                        secondary: [1024 /* Shift */ | 9 /* Escape */],
                        when: contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_VISIBLE),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).hideFindWidget();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.quickOpenTerm" /* QUICK_OPEN_TERM */,
                    title: { value: nls_1.localize('quickAccessTerminal', "Switch Active Terminal"), original: 'Switch Active Terminal' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                accessor.get(quickInput_1.IQuickInputService).quickAccess.show(terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToPreviousCommand" /* SCROLL_TO_PREVIOUS_COMMAND */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollToPreviousCommand', "Scroll To Previous Command"), original: 'Scroll To Previous Command' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */ },
                        when: contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.commandTracker) === null || _a === void 0 ? void 0 : _a.scrollToPreviousCommand();
                    t.focus();
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToNextCommand" /* SCROLL_TO_NEXT_COMMAND */,
                    title: { value: nls_1.localize('workbench.action.terminal.scrollToNextCommand', "Scroll To Next Command"), original: 'Scroll To Next Command' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */ },
                        when: contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.commandTracker) === null || _a === void 0 ? void 0 : _a.scrollToNextCommand();
                    t.focus();
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToPreviousCommand" /* SELECT_TO_PREVIOUS_COMMAND */,
                    title: { value: nls_1.localize('workbench.action.terminal.selectToPreviousCommand', "Select To Previous Command"), original: 'Select To Previous Command' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 16 /* UpArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.commandTracker) === null || _a === void 0 ? void 0 : _a.selectToPreviousCommand();
                    t.focus();
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToNextCommand" /* SELECT_TO_NEXT_COMMAND */,
                    title: { value: nls_1.localize('workbench.action.terminal.selectToNextCommand', "Select To Next Command"), original: 'Select To Next Command' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 18 /* DownArrow */ },
                        when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS,
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.commandTracker) === null || _a === void 0 ? void 0 : _a.selectToNextCommand();
                    t.focus();
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToPreviousLine" /* SELECT_TO_PREVIOUS_LINE */,
                    title: { value: nls_1.localize('workbench.action.terminal.selectToPreviousLine', "Select To Previous Line"), original: 'Select To Previous Line' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.commandTracker) === null || _a === void 0 ? void 0 : _a.selectToPreviousLine();
                    t.focus();
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToNextLine" /* SELECT_TO_NEXT_LINE */,
                    title: { value: nls_1.localize('workbench.action.terminal.selectToNextLine', "Select To Next Line"), original: 'Select To Next Line' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.commandTracker) === null || _a === void 0 ? void 0 : _a.selectToNextLine();
                    t.focus();
                });
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "toggleEscapeSequenceLogging" /* TOGGLE_ESCAPE_SEQUENCE_LOGGING */,
                    title: { value: nls_1.localize('workbench.action.terminal.toggleEscapeSequenceLogging', "Toggle Escape Sequence Logging"), original: 'Toggle Escape Sequence Logging' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.toggleEscapeSequenceLogging();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                const title = nls_1.localize('workbench.action.terminal.sendSequence', "Send Custom Sequence To Terminal");
                super({
                    id: "workbench.action.terminal.sendSequence" /* SEND_SEQUENCE */,
                    title: { value: title, original: 'Send Custom Sequence To Terminal' },
                    category,
                    description: {
                        description: title,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['text'],
                                    properties: {
                                        text: { type: 'string' }
                                    },
                                }
                            }]
                    }
                });
            }
            run(accessor, args) {
                exports.terminalSendSequenceCommand(accessor, args);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                const title = nls_1.localize('workbench.action.terminal.newWithCwd', "Create New Integrated Terminal Starting in a Custom Working Directory");
                super({
                    id: "workbench.action.terminal.newWithCwd" /* NEW_WITH_CWD */,
                    title: { value: title, original: 'Create New Integrated Terminal Starting in a Custom Working Directory' },
                    category,
                    description: {
                        description: title,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['cwd'],
                                    properties: {
                                        cwd: {
                                            description: nls_1.localize('workbench.action.terminal.newWithCwd.cwd', "The directory to start the terminal at"),
                                            type: 'string'
                                        }
                                    },
                                }
                            }]
                    }
                });
            }
            async run(accessor, args) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instance = terminalService.createTerminal({ cwd: args === null || args === void 0 ? void 0 : args.cwd });
                if (!instance) {
                    return;
                }
                terminalService.setActiveInstance(instance);
                return terminalService.showPanel(true);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                const title = nls_1.localize('workbench.action.terminal.renameWithArg', "Rename the Currently Active Terminal");
                super({
                    id: "workbench.action.terminal.renameWithArg" /* RENAME_WITH_ARG */,
                    title: { value: title, original: 'Rename the Currently Active Terminal' },
                    category,
                    description: {
                        description: title,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['name'],
                                    properties: {
                                        name: {
                                            description: nls_1.localize('workbench.action.terminal.renameWithArg.name', "The new name for the terminal"),
                                            type: 'string',
                                            minLength: 1
                                        }
                                    }
                                }
                            }]
                    }
                });
            }
            run(accessor, args) {
                var _a;
                const notificationService = accessor.get(notification_1.INotificationService);
                if (!(args === null || args === void 0 ? void 0 : args.name)) {
                    notificationService.warn(nls_1.localize('workbench.action.terminal.renameWithArg.noName', "No name argument provided"));
                    return;
                }
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.setTitle(args.name, terminal_1.TitleEventSource.Api);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.toggleFindRegex" /* TOGGLE_FIND_REGEX */,
                    title: { value: nls_1.localize('workbench.action.terminal.toggleFindRegex', "Toggle Find Using Regex"), original: 'Toggle Find Using Regex' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* Alt */ | 48 /* KEY_R */,
                        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 48 /* KEY_R */ },
                        when: contextkey_1.ContextKeyExpr.or(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                const state = accessor.get(terminal_2.ITerminalService).getFindState();
                state.change({ isRegex: !state.isRegex }, false);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.toggleFindWholeWord" /* TOGGLE_FIND_WHOLE_WORD */,
                    title: { value: nls_1.localize('workbench.action.terminal.toggleFindWholeWord', "Toggle Find Using Whole Word"), original: 'Toggle Find Using Whole Word' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* Alt */ | 53 /* KEY_W */,
                        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 53 /* KEY_W */ },
                        when: contextkey_1.ContextKeyExpr.or(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED),
                        weight: 200 /* WorkbenchContrib */
                    },
                });
            }
            run(accessor) {
                const state = accessor.get(terminal_2.ITerminalService).getFindState();
                state.change({ wholeWord: !state.wholeWord }, false);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.toggleFindCaseSensitive" /* TOGGLE_FIND_CASE_SENSITIVE */,
                    title: { value: nls_1.localize('workbench.action.terminal.toggleFindCaseSensitive', "Toggle Find Using Case Sensitive"), original: 'Toggle Find Using Case Sensitive' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* Alt */ | 33 /* KEY_C */,
                        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */ },
                        when: contextkey_1.ContextKeyExpr.or(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED),
                        weight: 200 /* WorkbenchContrib */
                    }
                });
            }
            run(accessor) {
                const state = accessor.get(terminal_2.ITerminalService).getFindState();
                state.change({ matchCase: !state.matchCase }, false);
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.findNext" /* FIND_NEXT */,
                    title: { value: nls_1.localize('workbench.action.terminal.findNext', "Find Next"), original: 'Find Next' },
                    f1: true,
                    category,
                    keybinding: [
                        {
                            primary: 61 /* F3 */,
                            mac: { primary: 2048 /* CtrlCmd */ | 37 /* KEY_G */, secondary: [61 /* F3 */] },
                            when: contextkey_1.ContextKeyExpr.or(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED),
                            weight: 200 /* WorkbenchContrib */
                        },
                        {
                            primary: 1024 /* Shift */ | 3 /* Enter */,
                            when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED,
                            weight: 200 /* WorkbenchContrib */
                        }
                    ]
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).findNext();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.findPrevious" /* FIND_PREVIOUS */,
                    title: { value: nls_1.localize('workbench.action.terminal.findPrevious', "Find Previous"), original: 'Find Previous' },
                    f1: true,
                    category,
                    keybinding: [
                        {
                            primary: 1024 /* Shift */ | 61 /* F3 */,
                            mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 37 /* KEY_G */, secondary: [1024 /* Shift */ | 61 /* F3 */] },
                            when: contextkey_1.ContextKeyExpr.or(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED),
                            weight: 200 /* WorkbenchContrib */
                        },
                        {
                            primary: 3 /* Enter */,
                            when: terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED,
                            weight: 200 /* WorkbenchContrib */
                        }
                    ]
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).findPrevious();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.relaunch" /* RELAUNCH */,
                    title: { value: nls_1.localize('workbench.action.terminal.relaunch', "Relaunch Active Terminal"), original: 'Relaunch Active Terminal' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.relaunch();
            }
        });
        actions_2.registerAction2(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.showEnvironmentInformation" /* SHOW_ENVIRONMENT_INFORMATION */,
                    title: { value: nls_1.localize('workbench.action.terminal.showEnvironmentInformation', "Show Environment Information"), original: 'Show Environment Information' },
                    f1: true,
                    category
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).getActiveInstance()) === null || _a === void 0 ? void 0 : _a.showEnvironmentInfoHover();
            }
        });
    }
    exports.registerTerminalActions = registerTerminalActions;
});
//# __sourceMappingURL=terminalActions.js.map