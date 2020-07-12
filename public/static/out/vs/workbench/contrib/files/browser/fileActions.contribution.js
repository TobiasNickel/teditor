/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/base/common/keyCodes", "vs/workbench/contrib/files/browser/fileCommands", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/platform", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/resources", "vs/platform/list/browser/listService", "vs/base/common/network", "vs/workbench/browser/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/common/editor", "vs/workbench/common/viewlet"], function (require, exports, nls, platform_1, fileActions_1, textFileSaveErrorHandler_1, actions_1, actions_2, keyCodes_1, fileCommands_1, commands_1, contextkey_1, keybindingsRegistry_1, platform_2, files_1, workspaceCommands_1, editorCommands_1, filesConfigurationService_1, resources_1, listService_1, network_1, contextkeys_1, contextkeys_2, workspaceActions_1, editor_1, viewlet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.appendToCommandPalette = exports.appendEditorTitleContextMenuItem = void 0;
    // Contribute Global Actions
    const category = { value: nls.localize('filesCategory', "File"), original: 'File' };
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.SaveAllAction, { primary: undefined, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 49 /* KEY_S */ }, win: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 49 /* KEY_S */) } }), 'File: Save All', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.GlobalCompareResourcesAction), 'File: Compare Active File With...', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.FocusFilesExplorer), 'File: Focus on Files Explorer', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.ShowActiveFileInExplorer), 'File: Reveal Active File in Side Bar', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.CollapseExplorerView), 'File: Collapse Folders in Explorer', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.RefreshExplorerView), 'File: Refresh Explorer', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.CompareWithClipboardAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 33 /* KEY_C */) }), 'File: Compare Active File with Clipboard', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.ToggleAutoSaveAction), 'File: Toggle Auto Save', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.ShowOpenedFileInNewWindow, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 45 /* KEY_O */) }), 'File: Open Active File in New Window', category.value);
    const workspacesCategory = nls.localize('workspaces', "Workspaces");
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(workspaceActions_1.OpenWorkspaceAction), 'Workspaces: Open Workspace...', workspacesCategory);
    const fileCategory = nls.localize('file', "File");
    if (platform_2.isMacintosh) {
        registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(workspaceActions_1.OpenFileFolderAction, { primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */ }), 'File: Open...', fileCategory);
    }
    else {
        registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(workspaceActions_1.OpenFileAction, { primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */ }), 'File: Open File...', fileCategory);
        registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(workspaceActions_1.OpenFolderAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 45 /* KEY_O */) }), 'File: Open Folder...', fileCategory);
    }
    // Commands
    commands_1.CommandsRegistry.registerCommand('_files.windowOpen', fileCommands_1.openWindowCommand);
    commands_1.CommandsRegistry.registerCommand('_files.newWindow', fileCommands_1.newWindowCommand);
    const explorerCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    const RENAME_ID = 'renameFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: RENAME_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 60 /* F2 */,
        mac: {
            primary: 3 /* Enter */
        },
        handler: fileActions_1.renameHandler
    });
    const MOVE_FILE_TO_TRASH_ID = 'moveFileToTrash';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: MOVE_FILE_TO_TRASH_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
        },
        handler: fileActions_1.moveFileToTrashHandler
    });
    const DELETE_FILE_ID = 'deleteFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 1024 /* Shift */ | 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 1 /* Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash.toNegated()),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    const CUT_FILE_ID = 'filesExplorer.cut';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CUT_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
        handler: fileActions_1.cutFileHandler,
    });
    const COPY_FILE_ID = 'filesExplorer.copy';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: COPY_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        handler: fileActions_1.copyFileHandler,
    });
    const PASTE_FILE_ID = 'filesExplorer.paste';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: PASTE_FILE_ID,
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
        handler: fileActions_1.pasteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.cancelCut',
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceCut),
        primary: 9 /* Escape */,
        handler: async (accessor) => {
            const explorerService = accessor.get(files_1.IExplorerService);
            await explorerService.setToCopy([], true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.openFilePreserveFocus',
        weight: 200 /* WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerFolderContext.toNegated()),
        primary: 10 /* Space */,
        handler: fileActions_1.openFilePreserveFocusHandler
    });
    const copyPathCommand = {
        id: fileCommands_1.COPY_PATH_COMMAND_ID,
        title: nls.localize('copyPath', "Copy Path")
    };
    const copyRelativePathCommand = {
        id: fileCommands_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize('copyRelativePath', "Copy Relative Path")
    };
    // Editor Title Context Menu
    appendEditorTitleContextMenuItem(fileCommands_1.COPY_PATH_COMMAND_ID, copyPathCommand.title, resources_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileCommands_1.COPY_RELATIVE_PATH_COMMAND_ID, copyRelativePathCommand.title, resources_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileCommands_1.REVEAL_IN_EXPLORER_COMMAND_ID, nls.localize('revealInSideBar', "Reveal in Side Bar"), resources_1.ResourceContextKey.IsFileSystemResource);
    function appendEditorTitleContextMenuItem(id, title, when, group) {
        // Menu
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, {
            command: { id, title },
            when,
            group: group || '2_files'
        });
    }
    exports.appendEditorTitleContextMenuItem = appendEditorTitleContextMenuItem;
    // Editor Title Menu for Conflict Resolution
    appendSaveConflictEditorTitleAction('workbench.files.action.acceptLocalChanges', nls.localize('acceptLocalChanges', "Use your changes and overwrite file contents"), { id: 'codicon/check' }, -10, textFileSaveErrorHandler_1.acceptLocalChangesCommand);
    appendSaveConflictEditorTitleAction('workbench.files.action.revertLocalChanges', nls.localize('revertLocalChanges', "Discard your changes and revert to file contents"), { id: 'codicon/discard' }, -9, textFileSaveErrorHandler_1.revertLocalChangesCommand);
    function appendSaveConflictEditorTitleAction(id, title, icon, order, command) {
        // Command
        commands_1.CommandsRegistry.registerCommand(id, command);
        // Action
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
            command: { id, title, icon },
            when: contextkey_1.ContextKeyExpr.equals(textFileSaveErrorHandler_1.CONFLICT_RESOLUTION_CONTEXT, true),
            group: 'navigation',
            order
        });
    }
    // Menu registration - command palette
    function appendToCommandPalette(id, title, category, when) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id,
                title,
                category
            },
            when
        });
    }
    exports.appendToCommandPalette = appendToCommandPalette;
    appendToCommandPalette(fileCommands_1.COPY_PATH_COMMAND_ID, { value: nls.localize('copyPathOfActive', "Copy Path of Active File"), original: 'Copy Path of Active File' }, category);
    appendToCommandPalette(fileCommands_1.COPY_RELATIVE_PATH_COMMAND_ID, { value: nls.localize('copyRelativePathOfActive', "Copy Relative Path of Active File"), original: 'Copy Relative Path of Active File' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILE_COMMAND_ID, { value: fileCommands_1.SAVE_FILE_LABEL, original: 'Save' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID, { value: fileCommands_1.SAVE_FILE_WITHOUT_FORMATTING_LABEL, original: 'Save without Formatting' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID, { value: nls.localize('saveAllInGroup', "Save All in Group"), original: 'Save All in Group' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILES_COMMAND_ID, { value: nls.localize('saveFiles', "Save All Files"), original: 'Save All Files' }, category);
    appendToCommandPalette(fileCommands_1.REVERT_FILE_COMMAND_ID, { value: nls.localize('revert', "Revert File"), original: 'Revert File' }, category);
    appendToCommandPalette(fileCommands_1.COMPARE_WITH_SAVED_COMMAND_ID, { value: nls.localize('compareActiveWithSaved', "Compare Active File with Saved"), original: 'Compare Active File with Saved' }, category);
    appendToCommandPalette(fileCommands_1.SAVE_FILE_AS_COMMAND_ID, { value: fileCommands_1.SAVE_FILE_AS_LABEL, original: 'Save As...' }, category);
    appendToCommandPalette(editorCommands_1.CLOSE_EDITOR_COMMAND_ID, { value: nls.localize('closeEditor', "Close Editor"), original: 'Close Editor' }, { value: nls.localize('view', "View"), original: 'View' });
    appendToCommandPalette(fileActions_1.NEW_FILE_COMMAND_ID, { value: fileActions_1.NEW_FILE_LABEL, original: 'New File' }, category, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette(fileActions_1.NEW_FOLDER_COMMAND_ID, { value: fileActions_1.NEW_FOLDER_LABEL, original: 'New Folder' }, category, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette(fileActions_1.DOWNLOAD_COMMAND_ID, { value: fileActions_1.DOWNLOAD_LABEL, original: 'Download' }, category, contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file)));
    appendToCommandPalette(fileCommands_1.NEW_UNTITLED_FILE_COMMAND_ID, { value: fileCommands_1.NEW_UNTITLED_FILE_LABEL, original: 'New Untitled File' }, category);
    // Menu registration - open editors
    const openToSideCommand = {
        id: fileCommands_1.OPEN_TO_SIDE_COMMAND_ID,
        title: nls.localize('openToSide', "Open to the Side")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: contextkey_1.ContextKeyExpr.or(resources_1.ResourceContextKey.IsFileSystemResource, resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 10,
        command: copyPathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 20,
        command: copyRelativePathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 10,
        command: {
            id: fileCommands_1.SAVE_FILE_COMMAND_ID,
            title: fileCommands_1.SAVE_FILE_LABEL,
            precondition: fileCommands_1.DirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.or(
        // Untitled Editors
        resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled), 
        // Or:
        contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileCommands_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileCommands_1.ReadonlyEditorContext.toNegated(), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated()))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 20,
        command: {
            id: fileCommands_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize('revert', "Revert File"),
            precondition: fileCommands_1.DirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileCommands_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileCommands_1.ReadonlyEditorContext.toNegated(), 
        // Not: untitled editors (revert closes them)
        resources_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 30,
        command: {
            id: fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
            title: nls.localize('saveAll', "Save All"),
            precondition: editor_1.DirtyWorkingCopiesContext
        },
        // Editor Group
        when: fileCommands_1.OpenEditorsGroupContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 10,
        command: {
            id: fileCommands_1.COMPARE_WITH_SAVED_COMMAND_ID,
            title: nls.localize('compareWithSaved', "Compare with Saved"),
            precondition: fileCommands_1.DirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.IsFileSystemResource, filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated(), listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareResourceCommand = {
        id: fileCommands_1.COMPARE_RESOURCE_COMMAND_ID,
        title: nls.localize('compareWithSelected', "Compare with Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.HasResource, fileCommands_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const selectForCompareCommand = {
        id: fileCommands_1.SELECT_FOR_COMPARE_COMMAND_ID,
        title: nls.localize('compareSource', "Select for Compare")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareSelectedCommand = {
        id: fileCommands_1.COMPARE_SELECTED_COMMAND_ID,
        title: nls.localize('compareSelected', "Compare Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 10,
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize('close', "Close")
        },
        when: fileCommands_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 20,
        command: {
            id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeOthers', "Close Others")
        },
        when: fileCommands_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 30,
        command: {
            id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID,
            title: nls.localize('closeSaved', "Close Saved")
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 40,
        command: {
            id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeAll', "Close All")
        }
    });
    // Menu registration - explorer
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 4,
        command: {
            id: fileActions_1.NEW_FILE_COMMAND_ID,
            title: fileActions_1.NEW_FILE_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 6,
        command: {
            id: fileActions_1.NEW_FOLDER_COMMAND_ID,
            title: fileActions_1.NEW_FOLDER_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 20,
        command: {
            id: fileCommands_1.OPEN_WITH_EXPLORER_COMMAND_ID,
            title: nls.localize('explorerOpenWith', "Open With..."),
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceAvailableEditorIdsContext),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource, fileCommands_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 8,
        command: {
            id: CUT_FILE_ID,
            title: nls.localize('cut', "Cut")
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 10,
        command: {
            id: COPY_FILE_ID,
            title: fileActions_1.COPY_FILE_LABEL
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 20,
        command: {
            id: PASTE_FILE_ID,
            title: fileActions_1.PASTE_FILE_LABEL,
            precondition: contextkey_1.ContextKeyExpr.and(files_1.ExplorerResourceNotReadonlyContext, fileActions_1.FileCopiedContext)
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5_cutcopypaste',
        order: 30,
        command: {
            id: fileActions_1.DOWNLOAD_COMMAND_ID,
            title: fileActions_1.DOWNLOAD_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file), contextkeys_2.IsWebContext.toNegated()), contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file), files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerRootContext.toNegated()))
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 30,
        command: copyPathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 30,
        command: copyRelativePathCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 10,
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL
        },
        when: files_1.ExplorerRootContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 30,
        command: {
            id: fileCommands_1.REMOVE_ROOT_FOLDER_COMMAND_ID,
            title: fileCommands_1.REMOVE_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 10,
        command: {
            id: RENAME_ID,
            title: fileActions_1.TRIGGER_RENAME_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: MOVE_FILE_TO_TRASH_ID,
            title: fileActions_1.MOVE_FILE_TO_TRASH_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        alt: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash.toNegated())
    });
    // Empty Editor Group Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: fileCommands_1.NEW_UNTITLED_FILE_COMMAND_ID, title: nls.localize('newFile', "New File") }, group: '1_file', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: 'workbench.action.quickOpen', title: nls.localize('openFile', "Open File...") }, group: '1_file', order: 20 });
    // File menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '1_new',
        command: {
            id: fileCommands_1.NEW_UNTITLED_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miNewFile', comment: ['&& denotes a mnemonic'] }, "&&New File")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileCommands_1.SAVE_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miSave', comment: ['&& denotes a mnemonic'] }, "&&Save"),
            precondition: contextkey_1.ContextKeyExpr.or(editor_1.ActiveEditorIsReadonlyContext.toNegated(), contextkey_1.ContextKeyExpr.and(files_1.ExplorerViewletVisibleContext, viewlet_1.SidebarFocusContext))
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileCommands_1.SAVE_FILE_AS_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAs', comment: ['&& denotes a mnemonic'] }, "Save &&As..."),
            // ActiveEditorContext is not 100% correct, but we lack a context for indicating "Save As..." support
            precondition: contextkey_1.ContextKeyExpr.or(editor_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.ExplorerViewletVisibleContext, viewlet_1.SidebarFocusContext))
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileActions_1.SaveAllAction.ID,
            title: nls.localize({ key: 'miSaveAll', comment: ['&& denotes a mnemonic'] }, "Save A&&ll"),
            precondition: editor_1.DirtyWorkingCopiesContext
        },
        order: 3
    });
    if (platform_2.isMacintosh) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenFileFolderAction.ID,
                title: nls.localize({ key: 'miOpen', comment: ['&& denotes a mnemonic'] }, "&&Open...")
            },
            order: 1
        });
    }
    else {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenFileAction.ID,
                title: nls.localize({ key: 'miOpenFile', comment: ['&& denotes a mnemonic'] }, "&&Open File...")
            },
            order: 1
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
            group: '2_open',
            command: {
                id: workspaceActions_1.OpenFolderAction.ID,
                title: nls.localize({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
            },
            order: 2
        });
    }
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: workspaceActions_1.OpenWorkspaceAction.ID,
            title: nls.localize({ key: 'miOpenWorkspace', comment: ['&& denotes a mnemonic'] }, "Open Wor&&kspace...")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '5_autosave',
        command: {
            id: fileActions_1.ToggleAutoSaveAction.ID,
            title: nls.localize({ key: 'miAutoSave', comment: ['&& denotes a mnemonic'] }, "A&&uto Save"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.files.autoSave', 'off')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: fileCommands_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miRevert', comment: ['&& denotes a mnemonic'] }, "Re&&vert File"),
            precondition: contextkey_1.ContextKeyExpr.or(editor_1.ActiveEditorIsReadonlyContext.toNegated(), contextkey_1.ContextKeyExpr.and(files_1.ExplorerViewletVisibleContext, viewlet_1.SidebarFocusContext))
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize({ key: 'miCloseEditor', comment: ['&& denotes a mnemonic'] }, "&&Close Editor")
        },
        order: 2
    });
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.quickOpen',
            title: nls.localize({ key: 'miGotoFile', comment: ['&& denotes a mnemonic'] }, "Go to &&File...")
        },
        order: 1
    });
});
//# __sourceMappingURL=fileActions.contribution.js.map