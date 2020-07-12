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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/browser/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/label/common/label", "vs/platform/keybinding/common/keybinding", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/workspaces/common/workspaces", "vs/base/common/uri", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/base/common/labels", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/quickaccess", "vs/workbench/services/host/browser/host", "vs/base/common/map", "vs/base/common/codicons"], function (require, exports, nls, actions_1, dialogs_1, actions_2, platform_1, contextkeys_1, contextkeys_2, actions_3, keybindingsRegistry_1, quickInput_1, workspace_1, label_1, keybinding_1, modelService_1, modeService_1, workspaces_1, uri_1, getIconClasses_1, files_1, labels_1, platform_2, contextkey_1, quickaccess_1, host_1, map_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewWindowAction = exports.ReloadWindowAction = exports.OpenRecentAction = exports.inRecentFilesPickerContextKey = void 0;
    exports.inRecentFilesPickerContextKey = 'inRecentFilesPicker';
    class BaseOpenRecentAction extends actions_1.Action {
        constructor(id, label, workspacesService, quickInputService, contextService, labelService, keybindingService, modelService, modeService, hostService, dialogService) {
            super(id, label);
            this.workspacesService = workspacesService;
            this.quickInputService = quickInputService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.keybindingService = keybindingService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.hostService = hostService;
            this.dialogService = dialogService;
            this.removeFromRecentlyOpened = {
                iconClass: codicons_1.Codicon.removeClose.classNames,
                tooltip: nls.localize('remove', "Remove from Recently Opened")
            };
            this.dirtyRecentlyOpened = {
                iconClass: 'dirty-workspace ' + codicons_1.Codicon.closeDirty.classNames,
                tooltip: nls.localize('dirtyRecentlyOpened', "Workspace With Dirty Files"),
                alwaysVisible: true
            };
        }
        async run() {
            const recentlyOpened = await this.workspacesService.getRecentlyOpened();
            const dirtyWorkspacesAndFolders = await this.workspacesService.getDirtyWorkspaces();
            // Identify all folders and workspaces with dirty files
            const dirtyFolders = new map_1.ResourceMap();
            const dirtyWorkspaces = new map_1.ResourceMap();
            for (const dirtyWorkspace of dirtyWorkspacesAndFolders) {
                if (uri_1.URI.isUri(dirtyWorkspace)) {
                    dirtyFolders.set(dirtyWorkspace, true);
                }
                else {
                    dirtyWorkspaces.set(dirtyWorkspace.configPath, dirtyWorkspace);
                }
            }
            // Identify all recently opened folders and workspaces
            const recentFolders = new map_1.ResourceMap();
            const recentWorkspaces = new map_1.ResourceMap();
            for (const recent of recentlyOpened.workspaces) {
                if (workspaces_1.isRecentFolder(recent)) {
                    recentFolders.set(recent.folderUri, true);
                }
                else {
                    recentWorkspaces.set(recent.workspace.configPath, recent.workspace);
                }
            }
            // Fill in all known recently opened workspaces
            const workspacePicks = [];
            for (const recent of recentlyOpened.workspaces) {
                const isDirty = workspaces_1.isRecentFolder(recent) ? dirtyFolders.has(recent.folderUri) : dirtyWorkspaces.has(recent.workspace.configPath);
                workspacePicks.push(this.toQuickPick(recent, isDirty));
            }
            // Fill any backup workspace that is not yet shown at the end
            for (const dirtyWorkspaceOrFolder of dirtyWorkspacesAndFolders) {
                if (uri_1.URI.isUri(dirtyWorkspaceOrFolder) && !recentFolders.has(dirtyWorkspaceOrFolder)) {
                    workspacePicks.push(this.toQuickPick({ folderUri: dirtyWorkspaceOrFolder }, true));
                }
                else if (workspaces_1.isWorkspaceIdentifier(dirtyWorkspaceOrFolder) && !recentWorkspaces.has(dirtyWorkspaceOrFolder.configPath)) {
                    workspacePicks.push(this.toQuickPick({ workspace: dirtyWorkspaceOrFolder }, true));
                }
            }
            const filePicks = recentlyOpened.files.map(p => this.toQuickPick(p, false));
            // focus second entry if the first recent workspace is the current workspace
            const firstEntry = recentlyOpened.workspaces[0];
            const autoFocusSecondEntry = firstEntry && this.contextService.isCurrentWorkspace(workspaces_1.isRecentWorkspace(firstEntry) ? firstEntry.workspace : firstEntry.folderUri);
            let keyMods;
            const workspaceSeparator = { type: 'separator', label: nls.localize('workspaces', "workspaces") };
            const fileSeparator = { type: 'separator', label: nls.localize('files', "files") };
            const picks = [workspaceSeparator, ...workspacePicks, fileSeparator, ...filePicks];
            const pick = await this.quickInputService.pick(picks, {
                contextKey: exports.inRecentFilesPickerContextKey,
                activeItem: [...workspacePicks, ...filePicks][autoFocusSecondEntry ? 1 : 0],
                placeHolder: platform_2.isMacintosh ? nls.localize('openRecentPlaceholderMac', "Select to open (hold Cmd-key to force new window or Alt-key for same window)") : nls.localize('openRecentPlaceholder', "Select to open (hold Ctrl-key to force new window or Alt-key for same window)"),
                matchOnDescription: true,
                onKeyMods: mods => keyMods = mods,
                quickNavigate: this.isQuickNavigate() ? { keybindings: this.keybindingService.lookupKeybindings(this.id) } : undefined,
                onDidTriggerItemButton: async (context) => {
                    // Remove
                    if (context.button === this.removeFromRecentlyOpened) {
                        await this.workspacesService.removeRecentlyOpened([context.item.resource]);
                        context.removeItem();
                    }
                    // Dirty Workspace
                    else if (context.button === this.dirtyRecentlyOpened) {
                        const result = await this.dialogService.confirm({
                            type: 'question',
                            title: nls.localize('dirtyWorkspace', "Workspace with Dirty Files"),
                            message: nls.localize('dirtyWorkspaceConfirm', "Do you want to open the workspace to review the dirty files?"),
                            detail: nls.localize('dirtyWorkspaceConfirmDetail', "Workspaces with dirty files cannot be removed until all dirty files have been saved or reverted.")
                        });
                        if (result.confirmed) {
                            this.hostService.openWindow([context.item.openable]);
                            this.quickInputService.cancel();
                        }
                    }
                }
            });
            if (pick) {
                return this.hostService.openWindow([pick.openable], { forceNewWindow: keyMods === null || keyMods === void 0 ? void 0 : keyMods.ctrlCmd, forceReuseWindow: keyMods === null || keyMods === void 0 ? void 0 : keyMods.alt });
            }
        }
        toQuickPick(recent, isDirty) {
            let openable;
            let iconClasses;
            let fullLabel;
            let resource;
            // Folder
            if (workspaces_1.isRecentFolder(recent)) {
                resource = recent.folderUri;
                iconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, files_1.FileKind.FOLDER);
                openable = { folderUri: resource };
                fullLabel = recent.label || this.labelService.getWorkspaceLabel(resource, { verbose: true });
            }
            // Workspace
            else if (workspaces_1.isRecentWorkspace(recent)) {
                resource = recent.workspace.configPath;
                iconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, files_1.FileKind.ROOT_FOLDER);
                openable = { workspaceUri: resource };
                fullLabel = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
            }
            // File
            else {
                resource = recent.fileUri;
                iconClasses = getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, files_1.FileKind.FILE);
                openable = { fileUri: resource };
                fullLabel = recent.label || this.labelService.getUriLabel(resource);
            }
            const { name, parentPath } = labels_1.splitName(fullLabel);
            return {
                iconClasses,
                label: name,
                ariaLabel: isDirty ? nls.localize('recentDirtyAriaLabel', "{0}, dirty workspace", name) : name,
                description: parentPath,
                buttons: isDirty ? [this.dirtyRecentlyOpened] : [this.removeFromRecentlyOpened],
                openable,
                resource
            };
        }
    }
    let OpenRecentAction = class OpenRecentAction extends BaseOpenRecentAction {
        constructor(id, label, workspacesService, quickInputService, contextService, keybindingService, modelService, modeService, labelService, hostService, dialogService) {
            super(id, label, workspacesService, quickInputService, contextService, labelService, keybindingService, modelService, modeService, hostService, dialogService);
        }
        isQuickNavigate() {
            return false;
        }
    };
    OpenRecentAction.ID = 'workbench.action.openRecent';
    OpenRecentAction.LABEL = nls.localize('openRecent', "Open Recent...");
    OpenRecentAction = __decorate([
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService),
        __param(8, label_1.ILabelService),
        __param(9, host_1.IHostService),
        __param(10, dialogs_1.IDialogService)
    ], OpenRecentAction);
    exports.OpenRecentAction = OpenRecentAction;
    let QuickPickRecentAction = class QuickPickRecentAction extends BaseOpenRecentAction {
        constructor(id, label, workspacesService, quickInputService, contextService, keybindingService, modelService, modeService, labelService, hostService, dialogService) {
            super(id, label, workspacesService, quickInputService, contextService, labelService, keybindingService, modelService, modeService, hostService, dialogService);
        }
        isQuickNavigate() {
            return true;
        }
    };
    QuickPickRecentAction.ID = 'workbench.action.quickOpenRecent';
    QuickPickRecentAction.LABEL = nls.localize('quickOpenRecent', "Quick Open Recent...");
    QuickPickRecentAction = __decorate([
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, modelService_1.IModelService),
        __param(7, modeService_1.IModeService),
        __param(8, label_1.ILabelService),
        __param(9, host_1.IHostService),
        __param(10, dialogs_1.IDialogService)
    ], QuickPickRecentAction);
    let ToggleFullScreenAction = class ToggleFullScreenAction extends actions_1.Action {
        constructor(id, label, hostService) {
            super(id, label);
            this.hostService = hostService;
        }
        run() {
            return this.hostService.toggleFullScreen();
        }
    };
    ToggleFullScreenAction.ID = 'workbench.action.toggleFullScreen';
    ToggleFullScreenAction.LABEL = nls.localize('toggleFullScreen', "Toggle Full Screen");
    ToggleFullScreenAction = __decorate([
        __param(2, host_1.IHostService)
    ], ToggleFullScreenAction);
    let ReloadWindowAction = class ReloadWindowAction extends actions_1.Action {
        constructor(id, label, hostService) {
            super(id, label);
            this.hostService = hostService;
        }
        async run() {
            await this.hostService.reload();
            return true;
        }
    };
    ReloadWindowAction.ID = 'workbench.action.reloadWindow';
    ReloadWindowAction.LABEL = nls.localize('reloadWindow', "Reload Window");
    ReloadWindowAction = __decorate([
        __param(2, host_1.IHostService)
    ], ReloadWindowAction);
    exports.ReloadWindowAction = ReloadWindowAction;
    let ShowAboutDialogAction = class ShowAboutDialogAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run() {
            return this.dialogService.about();
        }
    };
    ShowAboutDialogAction.ID = 'workbench.action.showAboutDialog';
    ShowAboutDialogAction.LABEL = nls.localize('about', "About");
    ShowAboutDialogAction = __decorate([
        __param(2, dialogs_1.IDialogService)
    ], ShowAboutDialogAction);
    let NewWindowAction = class NewWindowAction extends actions_1.Action {
        constructor(id, label, hostService) {
            super(id, label);
            this.hostService = hostService;
        }
        run() {
            return this.hostService.openWindow();
        }
    };
    NewWindowAction.ID = 'workbench.action.newWindow';
    NewWindowAction.LABEL = nls.localize('newWindow', "New Window");
    NewWindowAction = __decorate([
        __param(2, host_1.IHostService)
    ], NewWindowAction);
    exports.NewWindowAction = NewWindowAction;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    // --- Actions Registration
    const fileCategory = nls.localize('file', "File");
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NewWindowAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 44 /* KEY_N */ }), 'New Window');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(QuickPickRecentAction), 'File: Quick Open Recent...', fileCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(OpenRecentAction, { primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */, mac: { primary: 256 /* WinCtrl */ | 48 /* KEY_R */ } }), 'File: Open Recent...', fileCategory);
    const viewCategory = nls.localize('view', "View");
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleFullScreenAction, { primary: 69 /* F11 */, mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 36 /* KEY_F */ } }), 'View: Toggle Full Screen', viewCategory);
    const developerCategory = nls.localize('developer', "Developer");
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ReloadWindowAction), 'Developer: Reload Window', developerCategory);
    const helpCategory = nls.localize('help', "Help");
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ShowAboutDialogAction), `Help: About`, helpCategory);
    // --- Commands/Keybindings Registration
    const recentFilesPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(exports.inRecentFilesPickerContextKey));
    const quickPickNavigateNextInRecentFilesPickerId = 'workbench.action.quickOpenNavigateNextInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickPickNavigateNextInRecentFilesPickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickPickNavigateNextInRecentFilesPickerId, true),
        when: recentFilesPickerContext,
        primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */,
        mac: { primary: 256 /* WinCtrl */ | 48 /* KEY_R */ }
    });
    const quickPickNavigatePreviousInRecentFilesPicker = 'workbench.action.quickOpenNavigatePreviousInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickPickNavigatePreviousInRecentFilesPicker,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickPickNavigatePreviousInRecentFilesPicker, false),
        when: recentFilesPickerContext,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 48 /* KEY_R */,
        mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 48 /* KEY_R */ }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: ReloadWindowAction.ID,
        weight: 200 /* WorkbenchContrib */ + 50,
        when: contextkeys_2.IsDevelopmentContext,
        primary: 2048 /* CtrlCmd */ | 48 /* KEY_R */
    });
    // --- Menu Registration
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarFileMenu, {
        group: '1_new',
        command: {
            id: NewWindowAction.ID,
            title: nls.localize({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarFileMenu, {
        title: nls.localize({ key: 'miOpenRecent', comment: ['&& denotes a mnemonic'] }, "Open &&Recent"),
        submenu: actions_2.MenuId.MenubarRecentMenu,
        group: '2_open',
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarRecentMenu, {
        group: 'y_more',
        command: {
            id: OpenRecentAction.ID,
            title: nls.localize({ key: 'miMore', comment: ['&& denotes a mnemonic'] }, "&&More...")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '1_toggle_view',
        command: {
            id: ToggleFullScreenAction.ID,
            title: nls.localize({ key: 'miToggleFullScreen', comment: ['&& denotes a mnemonic'] }, "&&Full Screen"),
            toggled: contextkeys_1.IsFullscreenContext
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarHelpMenu, {
        group: 'z_about',
        command: {
            id: ShowAboutDialogAction.ID,
            title: nls.localize({ key: 'miAbout', comment: ['&& denotes a mnemonic'] }, "&&About")
        },
        order: 1,
        when: contextkeys_2.IsMacNativeContext.toNegated()
    });
});
//# __sourceMappingURL=windowActions.js.map