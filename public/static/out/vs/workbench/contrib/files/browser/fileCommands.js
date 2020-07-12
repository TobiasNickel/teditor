/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/windows/common/windows", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/files/common/files", "vs/platform/clipboard/common/clipboardService", "vs/base/common/errorMessage", "vs/platform/list/browser/listService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/browser/files", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/editor/common/editorContextKeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/label/common/label", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/workspaces/common/workspaces", "vs/base/common/arrays", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/workbench/services/textfile/common/textfiles", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/uriIdentity/common/uriIdentity", "vs/workbench/services/editor/common/editorOpenWith"], function (require, exports, nls, editor_1, windows_1, host_1, instantiation_1, viewlet_1, workspace_1, files_1, clipboardService_1, errorMessage_1, listService_1, commands_1, contextkey_1, files_2, keybindingsRegistry_1, keyCodes_1, platform_1, resolverService_1, files_3, workspaceEditing_1, editorCommands_1, network_1, notification_1, editorContextKeys_1, editorService_1, editorGroupsService_1, label_1, resources_1, lifecycle_1, environment_1, workspaces_1, arrays_1, codeEditorService_1, embeddedCodeEditorWidget_1, textfiles_1, configuration_1, quickInput_1, uriIdentity_1, editorOpenWith_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.newWindowCommand = exports.openWindowCommand = exports.NEW_UNTITLED_FILE_LABEL = exports.NEW_UNTITLED_FILE_COMMAND_ID = exports.LAST_COMPRESSED_FOLDER = exports.FIRST_COMPRESSED_FOLDER = exports.NEXT_COMPRESSED_FOLDER = exports.PREVIOUS_COMPRESSED_FOLDER = exports.REMOVE_ROOT_FOLDER_LABEL = exports.REMOVE_ROOT_FOLDER_COMMAND_ID = exports.ResourceSelectedForCompareContext = exports.ReadonlyEditorContext = exports.DirtyEditorContext = exports.OpenEditorsGroupContext = exports.SAVE_FILES_COMMAND_ID = exports.SAVE_ALL_IN_GROUP_COMMAND_ID = exports.SAVE_ALL_LABEL = exports.SAVE_ALL_COMMAND_ID = exports.SAVE_FILE_WITHOUT_FORMATTING_LABEL = exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID = exports.SAVE_FILE_LABEL = exports.SAVE_FILE_COMMAND_ID = exports.SAVE_FILE_AS_LABEL = exports.SAVE_FILE_AS_COMMAND_ID = exports.COPY_RELATIVE_PATH_COMMAND_ID = exports.COPY_PATH_COMMAND_ID = exports.COMPARE_WITH_SAVED_COMMAND_ID = exports.COMPARE_RESOURCE_COMMAND_ID = exports.COMPARE_SELECTED_COMMAND_ID = exports.SELECT_FOR_COMPARE_COMMAND_ID = exports.OPEN_WITH_EXPLORER_COMMAND_ID = exports.OPEN_TO_SIDE_COMMAND_ID = exports.REVERT_FILE_COMMAND_ID = exports.REVEAL_IN_EXPLORER_COMMAND_ID = void 0;
    // Commands
    exports.REVEAL_IN_EXPLORER_COMMAND_ID = 'revealInExplorer';
    exports.REVERT_FILE_COMMAND_ID = 'workbench.action.files.revert';
    exports.OPEN_TO_SIDE_COMMAND_ID = 'explorer.openToSide';
    exports.OPEN_WITH_EXPLORER_COMMAND_ID = 'explorer.openWith';
    exports.SELECT_FOR_COMPARE_COMMAND_ID = 'selectForCompare';
    exports.COMPARE_SELECTED_COMMAND_ID = 'compareSelected';
    exports.COMPARE_RESOURCE_COMMAND_ID = 'compareFiles';
    exports.COMPARE_WITH_SAVED_COMMAND_ID = 'workbench.files.action.compareWithSaved';
    exports.COPY_PATH_COMMAND_ID = 'copyFilePath';
    exports.COPY_RELATIVE_PATH_COMMAND_ID = 'copyRelativeFilePath';
    exports.SAVE_FILE_AS_COMMAND_ID = 'workbench.action.files.saveAs';
    exports.SAVE_FILE_AS_LABEL = nls.localize('saveAs', "Save As...");
    exports.SAVE_FILE_COMMAND_ID = 'workbench.action.files.save';
    exports.SAVE_FILE_LABEL = nls.localize('save', "Save");
    exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID = 'workbench.action.files.saveWithoutFormatting';
    exports.SAVE_FILE_WITHOUT_FORMATTING_LABEL = nls.localize('saveWithoutFormatting', "Save without Formatting");
    exports.SAVE_ALL_COMMAND_ID = 'saveAll';
    exports.SAVE_ALL_LABEL = nls.localize('saveAll', "Save All");
    exports.SAVE_ALL_IN_GROUP_COMMAND_ID = 'workbench.files.action.saveAllInGroup';
    exports.SAVE_FILES_COMMAND_ID = 'workbench.action.files.saveFiles';
    exports.OpenEditorsGroupContext = new contextkey_1.RawContextKey('groupFocusedInOpenEditors', false);
    exports.DirtyEditorContext = new contextkey_1.RawContextKey('dirtyEditor', false);
    exports.ReadonlyEditorContext = new contextkey_1.RawContextKey('readonlyEditor', false);
    exports.ResourceSelectedForCompareContext = new contextkey_1.RawContextKey('resourceSelectedForCompare', false);
    exports.REMOVE_ROOT_FOLDER_COMMAND_ID = 'removeRootFolder';
    exports.REMOVE_ROOT_FOLDER_LABEL = nls.localize('removeFolderFromWorkspace', "Remove Folder from Workspace");
    exports.PREVIOUS_COMPRESSED_FOLDER = 'previousCompressedFolder';
    exports.NEXT_COMPRESSED_FOLDER = 'nextCompressedFolder';
    exports.FIRST_COMPRESSED_FOLDER = 'firstCompressedFolder';
    exports.LAST_COMPRESSED_FOLDER = 'lastCompressedFolder';
    exports.NEW_UNTITLED_FILE_COMMAND_ID = 'workbench.action.files.newUntitledFile';
    exports.NEW_UNTITLED_FILE_LABEL = nls.localize('newUntitledFile', "New Untitled File");
    exports.openWindowCommand = (accessor, toOpen, options) => {
        if (Array.isArray(toOpen)) {
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            // rewrite untitled: workspace URIs to the absolute path on disk
            toOpen = toOpen.map(openable => {
                if (windows_1.isWorkspaceToOpen(openable) && openable.workspaceUri.scheme === network_1.Schemas.untitled) {
                    return {
                        workspaceUri: resources_1.joinPath(environmentService.untitledWorkspacesHome, openable.workspaceUri.path, workspaces_1.UNTITLED_WORKSPACE_NAME)
                    };
                }
                return openable;
            });
            hostService.openWindow(toOpen, options);
        }
    };
    exports.newWindowCommand = (accessor, options) => {
        const hostService = accessor.get(host_1.IHostService);
        hostService.openWindow(options);
    };
    // Command registration
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: files_1.ExplorerFocusCondition,
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        id: exports.OPEN_TO_SIDE_COMMAND_ID,
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const listService = accessor.get(listService_1.IListService);
            const fileService = accessor.get(files_2.IFileService);
            const explorerService = accessor.get(files_1.IExplorerService);
            const resources = files_3.getMultiSelectedResources(resource, listService, editorService, explorerService);
            // Set side input
            if (resources.length) {
                const untitledResources = resources.filter(resource => resource.scheme === network_1.Schemas.untitled);
                const fileResources = resources.filter(resource => resource.scheme !== network_1.Schemas.untitled);
                const resolved = await fileService.resolveAll(fileResources.map(resource => ({ resource })));
                const editors = resolved.filter(r => r.stat && r.success && !r.stat.isDirectory).map(r => ({
                    resource: r.stat.resource
                })).concat(...untitledResources.map(untitledResource => ({ resource: untitledResource })));
                await editorService.openEditors(editors, editorService_1.SIDE_GROUP);
            }
        }
    });
    const COMPARE_WITH_SAVED_SCHEMA = 'showModifications';
    let providerDisposables = [];
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.COMPARE_WITH_SAVED_COMMAND_ID,
        when: undefined,
        weight: 200 /* WorkbenchContrib */,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 34 /* KEY_D */),
        handler: async (accessor, resource) => {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_2.IFileService);
            // Register provider at first as needed
            let registerEditorListener = false;
            if (providerDisposables.length === 0) {
                registerEditorListener = true;
                const provider = instantiationService.createInstance(files_1.TextFileContentProvider);
                providerDisposables.push(provider);
                providerDisposables.push(textModelService.registerTextModelContentProvider(COMPARE_WITH_SAVED_SCHEMA, provider));
            }
            // Open editor (only resources that can be handled by file service are supported)
            const uri = files_3.getResourceForCommand(resource, accessor.get(listService_1.IListService), editorService);
            if (uri && fileService.canHandleResource(uri)) {
                const name = resources_1.basename(uri);
                const editorLabel = nls.localize('modifiedLabel', "{0} (in file) ↔ {1}", name, name);
                try {
                    await files_1.TextFileContentProvider.open(uri, COMPARE_WITH_SAVED_SCHEMA, editorLabel, editorService);
                    // Dispose once no more diff editor is opened with the scheme
                    if (registerEditorListener) {
                        providerDisposables.push(editorService.onDidVisibleEditorsChange(() => {
                            if (!editorService.editors.some(editor => !!editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: COMPARE_WITH_SAVED_SCHEMA }))) {
                                providerDisposables = lifecycle_1.dispose(providerDisposables);
                            }
                        }));
                    }
                }
                catch (_a) {
                    providerDisposables = lifecycle_1.dispose(providerDisposables);
                }
            }
        }
    });
    let globalResourceToCompare;
    let resourceSelectedForCompareContext;
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SELECT_FOR_COMPARE_COMMAND_ID,
        handler: (accessor, resource) => {
            const listService = accessor.get(listService_1.IListService);
            globalResourceToCompare = files_3.getResourceForCommand(resource, listService, accessor.get(editorService_1.IEditorService));
            if (!resourceSelectedForCompareContext) {
                resourceSelectedForCompareContext = exports.ResourceSelectedForCompareContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            }
            resourceSelectedForCompareContext.set(true);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COMPARE_SELECTED_COMMAND_ID,
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const explorerService = accessor.get(files_1.IExplorerService);
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService, explorerService);
            if (resources.length === 2) {
                return editorService.openEditor({
                    leftResource: resources[0],
                    rightResource: resources[1]
                });
            }
            return true;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COMPARE_RESOURCE_COMMAND_ID,
        handler: (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const listService = accessor.get(listService_1.IListService);
            const rightResource = files_3.getResourceForCommand(resource, listService, editorService);
            if (globalResourceToCompare && rightResource) {
                editorService.openEditor({
                    leftResource: globalResourceToCompare,
                    rightResource
                });
            }
        }
    });
    async function resourcesToClipboard(resources, relative, clipboardService, notificationService, labelService) {
        if (resources.length) {
            const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
            const text = resources.map(resource => labelService.getUriLabel(resource, { relative, noPrefix: true }))
                .join(lineDelimiter);
            await clipboardService.writeText(text);
        }
        else {
            notificationService.info(nls.localize('openFileToCopy', "Open a file first to copy its path"));
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */,
        win: {
            primary: 1024 /* Shift */ | 512 /* Alt */ | 33 /* KEY_C */
        },
        id: exports.COPY_PATH_COMMAND_ID,
        handler: async (accessor, resource) => {
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService), accessor.get(files_1.IExplorerService));
            await resourcesToClipboard(resources, false, accessor.get(clipboardService_1.IClipboardService), accessor.get(notification_1.INotificationService), accessor.get(label_1.ILabelService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 512 /* Alt */ | 33 /* KEY_C */,
        win: {
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */)
        },
        id: exports.COPY_RELATIVE_PATH_COMMAND_ID,
        handler: async (accessor, resource) => {
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService), accessor.get(files_1.IExplorerService));
            await resourcesToClipboard(resources, true, accessor.get(clipboardService_1.IClipboardService), accessor.get(notification_1.INotificationService), accessor.get(label_1.ILabelService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 46 /* KEY_P */),
        id: 'workbench.action.files.copyPathOfActiveFile',
        handler: async (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeInput = editorService.activeEditor;
            const resource = activeInput ? activeInput.resource : null;
            const resources = resource ? [resource] : [];
            await resourcesToClipboard(resources, false, accessor.get(clipboardService_1.IClipboardService), accessor.get(notification_1.INotificationService), accessor.get(label_1.ILabelService));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REVEAL_IN_EXPLORER_COMMAND_ID,
        handler: async (accessor, resource) => {
            var _a;
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const explorerService = accessor.get(files_1.IExplorerService);
            const uri = files_3.getResourceForCommand(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            const viewlet = (_a = (await viewletService.openViewlet(files_1.VIEWLET_ID, false))) === null || _a === void 0 ? void 0 : _a.getViewPaneContainer();
            if (uri && contextService.isInsideWorkspace(uri)) {
                const explorerView = viewlet.getExplorerView();
                if (explorerView) {
                    explorerView.setExpanded(true);
                    await explorerService.select(uri, true);
                    explorerView.focus();
                }
            }
            else {
                const openEditorsView = viewlet.getOpenEditorsView();
                if (openEditorsView) {
                    openEditorsView.setExpanded(true);
                    openEditorsView.focus();
                }
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.OPEN_WITH_EXPLORER_COMMAND_ID,
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const uri = files_3.getResourceForCommand(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            if (uri) {
                const input = editorService.createEditorInput({ resource: uri });
                editorOpenWith_1.openEditorWith(input, undefined, undefined, editorGroupsService.activeGroup, editorService, configurationService, quickInputService);
            }
        }
    });
    // Save / Save As / Save All / Revert
    async function saveSelectedEditors(accessor, options) {
        var _a;
        const listService = accessor.get(listService_1.IListService);
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        // Retrieve selected or active editor
        let editors = files_3.getOpenEditorsViewMultiSelection(listService, editorGroupService);
        if (!editors) {
            const activeGroup = editorGroupService.activeGroup;
            if (activeGroup.activeEditor) {
                editors = [];
                // Special treatment for side by side editors: if the active editor
                // has 2 sides, we consider both, to support saving both sides.
                // We only allow this when saving, not for "Save As".
                // See also https://github.com/microsoft/vscode/issues/4180
                if (activeGroup.activeEditor instanceof editor_1.SideBySideEditorInput && !(options === null || options === void 0 ? void 0 : options.saveAs)) {
                    editors.push({ groupId: activeGroup.id, editor: activeGroup.activeEditor.primary });
                    editors.push({ groupId: activeGroup.id, editor: activeGroup.activeEditor.secondary });
                }
                else {
                    editors.push({ groupId: activeGroup.id, editor: activeGroup.activeEditor });
                }
            }
        }
        if (!editors || editors.length === 0) {
            return; // nothing to save
        }
        // Save editors
        await doSaveEditors(accessor, editors, options);
        // Special treatment for embedded editors: if we detect that focus is
        // inside an embedded code editor, we save that model as well if we
        // find it in our text file models. Currently, only textual editors
        // support embedded editors.
        const focusedCodeEditor = codeEditorService.getFocusedCodeEditor();
        if (focusedCodeEditor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
            const resource = (_a = focusedCodeEditor.getModel()) === null || _a === void 0 ? void 0 : _a.uri;
            // Check that the resource of the model was not saved already
            if (resource && !editors.some(({ editor }) => resources_1.isEqual(editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }), resource))) {
                const model = textFileService.files.get(resource);
                if (!(model === null || model === void 0 ? void 0 : model.isReadonly())) {
                    await textFileService.save(resource, options);
                }
            }
        }
    }
    function saveDirtyEditorsOfGroups(accessor, groups, options) {
        const dirtyEditors = [];
        for (const group of groups) {
            for (const editor of group.getEditors(0 /* MOST_RECENTLY_ACTIVE */)) {
                if (editor.isDirty()) {
                    dirtyEditors.push({ groupId: group.id, editor });
                }
            }
        }
        return doSaveEditors(accessor, dirtyEditors, options);
    }
    async function doSaveEditors(accessor, editors, options) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const notificationService = accessor.get(notification_1.INotificationService);
        try {
            await editorService.save(editors, options);
        }
        catch (error) {
            notificationService.error(nls.localize('genericSaveError', "Failed to save '{0}': {1}", editors.map(({ editor }) => editor.getName()).join(', '), errorMessage_1.toErrorMessage(error, false)));
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 49 /* KEY_S */,
        id: exports.SAVE_FILE_COMMAND_ID,
        handler: accessor => {
            return saveSelectedEditors(accessor, { reason: 1 /* EXPLICIT */, force: true /* force save even when non-dirty */ });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        when: undefined,
        weight: 200 /* WorkbenchContrib */,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 49 /* KEY_S */),
        win: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1024 /* Shift */ | 49 /* KEY_S */) },
        id: exports.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID,
        handler: accessor => {
            return saveSelectedEditors(accessor, { reason: 1 /* EXPLICIT */, force: true /* force save even when non-dirty */, skipSaveParticipants: true });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.SAVE_FILE_AS_COMMAND_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 49 /* KEY_S */,
        handler: accessor => {
            return saveSelectedEditors(accessor, { reason: 1 /* EXPLICIT */, saveAs: true });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SAVE_ALL_COMMAND_ID,
        handler: (accessor) => {
            return saveDirtyEditorsOfGroups(accessor, accessor.get(editorGroupsService_1.IEditorGroupsService).getGroups(1 /* MOST_RECENTLY_ACTIVE */), { reason: 1 /* EXPLICIT */ });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SAVE_ALL_IN_GROUP_COMMAND_ID,
        handler: (accessor, _, editorContext) => {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const contexts = editorCommands_1.getMultiSelectedEditorContexts(editorContext, accessor.get(listService_1.IListService), accessor.get(editorGroupsService_1.IEditorGroupsService));
            let groups = undefined;
            if (!contexts.length) {
                groups = editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            }
            else {
                groups = arrays_1.coalesce(contexts.map(context => editorGroupService.getGroup(context.groupId)));
            }
            return saveDirtyEditorsOfGroups(accessor, groups, { reason: 1 /* EXPLICIT */ });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SAVE_FILES_COMMAND_ID,
        handler: accessor => {
            const editorService = accessor.get(editorService_1.IEditorService);
            return editorService.saveAll({ includeUntitled: false, reason: 1 /* EXPLICIT */ });
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REVERT_FILE_COMMAND_ID,
        handler: async (accessor) => {
            const notificationService = accessor.get(notification_1.INotificationService);
            const listService = accessor.get(listService_1.IListService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            // Retrieve selected or active editor
            let editors = files_3.getOpenEditorsViewMultiSelection(listService, editorGroupService);
            if (!editors) {
                const activeGroup = editorGroupService.activeGroup;
                if (activeGroup.activeEditor) {
                    editors = [{ groupId: activeGroup.id, editor: activeGroup.activeEditor }];
                }
            }
            if (!editors || editors.length === 0) {
                return; // nothing to revert
            }
            try {
                await editorService.revert(editors.filter(({ editor }) => !editor.isUntitled() /* all except untitled */), { force: true });
            }
            catch (error) {
                notificationService.error(nls.localize('genericRevertError', "Failed to revert '{0}': {1}", editors.map(({ editor }) => editor.getName()).join(', '), errorMessage_1.toErrorMessage(error, false)));
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REMOVE_ROOT_FOLDER_COMMAND_ID,
        handler: (accessor, resource) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            const workspace = contextService.getWorkspace();
            const resources = files_3.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService), accessor.get(files_1.IExplorerService)).filter(resource => workspace.folders.some(folder => uriIdentityService.extUri.isEqual(folder.uri, resource)) // Need to verify resources are workspaces since multi selection can trigger this command on some non workspace resources
            );
            return workspaceEditingService.removeFolders(resources);
        }
    });
    // Compressed item navigation
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedFirstFocusContext.negate()),
        primary: 15 /* LeftArrow */,
        id: exports.PREVIOUS_COMPRESSED_FOLDER,
        handler: (accessor) => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const viewlet = viewletService.getActiveViewlet();
            if ((viewlet === null || viewlet === void 0 ? void 0 : viewlet.getId()) !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.previousCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedLastFocusContext.negate()),
        primary: 17 /* RightArrow */,
        id: exports.NEXT_COMPRESSED_FOLDER,
        handler: (accessor) => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const viewlet = viewletService.getActiveViewlet();
            if ((viewlet === null || viewlet === void 0 ? void 0 : viewlet.getId()) !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.nextCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedFirstFocusContext.negate()),
        primary: 14 /* Home */,
        id: exports.FIRST_COMPRESSED_FOLDER,
        handler: (accessor) => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const viewlet = viewletService.getActiveViewlet();
            if ((viewlet === null || viewlet === void 0 ? void 0 : viewlet.getId()) !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.firstCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */ + 10,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerCompressedFocusContext, files_1.ExplorerCompressedLastFocusContext.negate()),
        primary: 13 /* End */,
        id: exports.LAST_COMPRESSED_FOLDER,
        handler: (accessor) => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const viewlet = viewletService.getActiveViewlet();
            if ((viewlet === null || viewlet === void 0 ? void 0 : viewlet.getId()) !== files_1.VIEWLET_ID) {
                return;
            }
            const explorer = viewlet.getViewPaneContainer();
            const view = explorer.getExplorerView();
            view.lastCompressedStat();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: null,
        primary: 2048 /* CtrlCmd */ | 44 /* KEY_N */,
        id: exports.NEW_UNTITLED_FILE_COMMAND_ID,
        description: {
            description: exports.NEW_UNTITLED_FILE_LABEL,
            args: [
                {
                    name: 'viewType', description: 'The editor view type', schema: {
                        'type': 'object',
                        'required': ['viewType'],
                        'properties': {
                            'viewType': {
                                'type': 'string'
                            }
                        }
                    }
                }
            ]
        },
        handler: async (accessor, args) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            if (args) {
                const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const textInput = editorService.createEditorInput({ options: { pinned: true } });
                const group = editorGroupsService.activeGroup;
                await editorOpenWith_1.openEditorWith(textInput, args.viewType, { pinned: true }, group, editorService, configurationService, quickInputService);
            }
            else {
                await editorService.openEditor({ options: { pinned: true } }); // untitled are always pinned
            }
        }
    });
});
//# __sourceMappingURL=fileCommands.js.map