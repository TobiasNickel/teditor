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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/registry/common/platform", "vs/base/common/map", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/platform/files/common/files", "vs/base/common/network", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/browser/editorBrowser", "vs/platform/label/common/label", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/workbench/browser/parts/editor/editorsObserver", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/async", "vs/platform/workspace/common/workspace", "vs/base/common/extpath", "vs/workbench/services/editor/common/editorOpenWith", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/uriIdentity/common/uriIdentity", "vs/editor/common/services/modelService"], function (require, exports, nls, instantiation_1, editor_1, editor_2, resourceEditorInput_1, platform_1, map_1, untitledTextEditorService_1, files_1, network_1, event_1, uri_1, resources_1, diffEditorInput_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, arrays_1, editorBrowser_1, label_1, extensions_1, types_1, editorsObserver_1, untitledTextEditorInput_1, async_1, workspace_1, extpath_1, editorOpenWith_1, configurationRegistry_1, workingCopyService_1, uriIdentity_1, modelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelegatingEditorService = exports.EditorService = void 0;
    let EditorService = class EditorService extends lifecycle_1.Disposable {
        constructor(editorGroupService, untitledTextEditorService, instantiationService, labelService, fileService, configurationService, contextService, workingCopyService, uriIdentityService) {
            super();
            this.editorGroupService = editorGroupService;
            this.untitledTextEditorService = untitledTextEditorService;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.workingCopyService = workingCopyService;
            this.uriIdentityService = uriIdentityService;
            //#region events
            this._onDidActiveEditorChange = this._register(new event_1.Emitter());
            this.onDidActiveEditorChange = this._onDidActiveEditorChange.event;
            this._onDidVisibleEditorsChange = this._register(new event_1.Emitter());
            this.onDidVisibleEditorsChange = this._onDidVisibleEditorsChange.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            //#endregion
            this.fileEditorInputFactory = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).getFileEditorInputFactory();
            //#region Editor & group event handlers
            this.lastActiveEditor = undefined;
            //#endregion
            //#region Visible Editors Change: Install file watchers for out of workspace resources that became visible
            this.activeOutOfWorkspaceWatchers = new map_1.ResourceMap();
            this.closeOnFileDelete = false;
            //#endregion
            //#region Editor accessors
            this.editorsObserver = this._register(this.instantiationService.createInstance(editorsObserver_1.EditorsObserver));
            //#endregion
            //#region preventOpenEditor()
            this.openEditorHandlers = [];
            //#endregion
            //#region createEditorInput()
            this.editorInputCache = new map_1.ResourceMap();
            this._modelService = undefined;
            //#endregion
            //#region Custom View Type
            this.customEditorViewTypesHandlers = new Map();
            this.onConfigurationUpdated(configurationService.getValue());
            this.registerListeners();
        }
        registerListeners() {
            // Editor & group changes
            this.editorGroupService.whenRestored.then(() => this.onEditorsRestored());
            this.editorGroupService.onDidActiveGroupChange(group => this.handleActiveEditorChange(group));
            this.editorGroupService.onDidAddGroup(group => this.registerGroupListeners(group));
            this.editorsObserver.onDidMostRecentlyActiveEditorsChange(() => this._onDidMostRecentlyActiveEditorsChange.fire());
            // Out of workspace file watchers
            this._register(this.onDidVisibleEditorsChange(() => this.handleVisibleEditorsChange()));
            // File changes & operations
            // Note: there is some duplication with the two file event handlers- Since we cannot always rely on the disk events
            // carrying all necessary data in all environments, we also use the file operation events to make sure operations are handled.
            // In any case there is no guarantee if the local event is fired first or the disk one. Thus, code must handle the case
            // that the event ordering is random as well as might not carry all information needed.
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunFileOperation(e)));
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Configuration
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue())));
        }
        onEditorsRestored() {
            // Register listeners to each opened group
            this.editorGroupService.groups.forEach(group => this.registerGroupListeners(group));
            // Fire initial set of editor events if there is an active editor
            if (this.activeEditor) {
                this.doHandleActiveEditorChangeEvent();
                this._onDidVisibleEditorsChange.fire();
            }
        }
        handleActiveEditorChange(group) {
            if (group !== this.editorGroupService.activeGroup) {
                return; // ignore if not the active group
            }
            if (!this.lastActiveEditor && !group.activeEditor) {
                return; // ignore if we still have no active editor
            }
            this.doHandleActiveEditorChangeEvent();
        }
        doHandleActiveEditorChangeEvent() {
            // Remember as last active
            const activeGroup = this.editorGroupService.activeGroup;
            this.lastActiveEditor = types_1.withNullAsUndefined(activeGroup.activeEditor);
            // Fire event to outside parties
            this._onDidActiveEditorChange.fire();
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidGroupChange(e => {
                if (e.kind === 5 /* EDITOR_ACTIVE */) {
                    this.handleActiveEditorChange(group);
                    this._onDidVisibleEditorsChange.fire();
                }
            }));
            groupDisposables.add(group.onDidCloseEditor(event => {
                this._onDidCloseEditor.fire(event);
            }));
            groupDisposables.add(group.onWillOpenEditor(event => {
                this.onGroupWillOpenEditor(group, event);
            }));
            groupDisposables.add(group.onDidOpenEditorFail(editor => {
                this._onDidOpenEditorFail.fire({ editor, groupId: group.id });
            }));
            event_1.Event.once(group.onWillDispose)(() => {
                lifecycle_1.dispose(groupDisposables);
            });
        }
        handleVisibleEditorsChange() {
            const visibleOutOfWorkspaceResources = new map_1.ResourceMap();
            for (const editor of this.visibleEditors) {
                const resources = arrays_1.distinct(arrays_1.coalesce([
                    editor_2.toResource(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY }),
                    editor_2.toResource(editor, { supportSideBySide: editor_2.SideBySideEditor.SECONDARY })
                ]), resource => resource.toString());
                for (const resource of resources) {
                    if (this.fileService.canHandleResource(resource) && !this.contextService.isInsideWorkspace(resource)) {
                        visibleOutOfWorkspaceResources.set(resource, resource);
                    }
                }
            }
            // Handle no longer visible out of workspace resources
            [...this.activeOutOfWorkspaceWatchers.keys()].forEach(resource => {
                if (!visibleOutOfWorkspaceResources.get(resource)) {
                    lifecycle_1.dispose(this.activeOutOfWorkspaceWatchers.get(resource));
                    this.activeOutOfWorkspaceWatchers.delete(resource);
                }
            });
            // Handle newly visible out of workspace resources
            visibleOutOfWorkspaceResources.forEach(resource => {
                if (!this.activeOutOfWorkspaceWatchers.get(resource)) {
                    const disposable = this.fileService.watch(resource);
                    this.activeOutOfWorkspaceWatchers.set(resource, disposable);
                }
            });
        }
        //#endregion
        //#region File Changes: Move & Deletes to move or close opend editors
        onDidRunFileOperation(e) {
            // Handle moves specially when file is opened
            if (e.isOperation(2 /* MOVE */)) {
                this.handleMovedFile(e.resource, e.target.resource);
            }
            // Handle deletes
            if (e.isOperation(1 /* DELETE */) || e.isOperation(2 /* MOVE */)) {
                this.handleDeletedFile(e.resource, false, e.target ? e.target.resource : undefined);
            }
        }
        onDidFilesChange(e) {
            if (e.gotDeleted()) {
                this.handleDeletedFile(e, true);
            }
        }
        handleMovedFile(source, target) {
            for (const group of this.editorGroupService.groups) {
                let replacements = [];
                for (const editor of group.editors) {
                    const resource = editor.resource;
                    if (!resource || !this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                        continue; // not matching our resource
                    }
                    // Determine new resulting target resource
                    let targetResource;
                    if (resources_1.extUri.isEqual(source, resource)) {
                        targetResource = target; // file got moved
                    }
                    else {
                        const ignoreCase = !this.fileService.hasCapability(resource, 1024 /* PathCaseSensitive */);
                        const index = extpath_1.indexOfPath(resource.path, source.path, ignoreCase);
                        targetResource = resources_1.joinPath(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                    }
                    // Delegate rename() to editor instance
                    const moveResult = editor.rename(group.id, targetResource);
                    if (!moveResult) {
                        return; // not target - ignore
                    }
                    const optionOverrides = {
                        preserveFocus: true,
                        pinned: group.isPinned(editor),
                        sticky: group.isSticky(editor),
                        index: group.getIndexOfEditor(editor),
                        inactive: !group.isActive(editor)
                    };
                    // Construct a replacement with our extra options mixed in
                    if (moveResult.editor instanceof editor_2.EditorInput) {
                        replacements.push({
                            editor,
                            replacement: moveResult.editor,
                            options: Object.assign(Object.assign({}, moveResult.options), optionOverrides)
                        });
                    }
                    else {
                        replacements.push({
                            editor: { resource: editor.resource },
                            replacement: Object.assign(Object.assign({}, moveResult.editor), { options: Object.assign(Object.assign({}, moveResult.editor.options), optionOverrides) })
                        });
                    }
                }
                // Apply replacements
                if (replacements.length) {
                    this.replaceEditors(replacements, group);
                }
            }
        }
        onConfigurationUpdated(configuration) {
            var _a, _b;
            if (typeof ((_b = (_a = configuration.workbench) === null || _a === void 0 ? void 0 : _a.editor) === null || _b === void 0 ? void 0 : _b.closeOnFileDelete) === 'boolean') {
                this.closeOnFileDelete = configuration.workbench.editor.closeOnFileDelete;
            }
            else {
                this.closeOnFileDelete = false; // default
            }
        }
        handleDeletedFile(arg1, isExternal, movedTo) {
            for (const editor of this.getAllNonDirtyEditors({ includeUntitled: false, supportSideBySide: true })) {
                (async () => {
                    const resource = editor.resource;
                    if (!resource) {
                        return;
                    }
                    // Handle deletes in opened editors depending on:
                    // - the user has not disabled the setting closeOnFileDelete
                    // - the file change is local
                    // - the input is  a file that is not resolved (we need to dispose because we cannot restore otherwise since we do not have the contents)
                    if (this.closeOnFileDelete || !isExternal || (this.fileEditorInputFactory.isFileEditorInput(editor) && !editor.isResolved())) {
                        // Do NOT close any opened editor that matches the resource path (either equal or being parent) of the
                        // resource we move to (movedTo). Otherwise we would close a resource that has been renamed to the same
                        // path but different casing.
                        if (movedTo && this.uriIdentityService.extUri.isEqualOrParent(resource, movedTo)) {
                            return;
                        }
                        let matches = false;
                        if (arg1 instanceof files_1.FileChangesEvent) {
                            matches = arg1.contains(resource, 2 /* DELETED */);
                        }
                        else {
                            matches = this.uriIdentityService.extUri.isEqualOrParent(resource, arg1);
                        }
                        if (!matches) {
                            return;
                        }
                        // We have received reports of users seeing delete events even though the file still
                        // exists (network shares issue: https://github.com/Microsoft/vscode/issues/13665).
                        // Since we do not want to close an editor without reason, we have to check if the
                        // file is really gone and not just a faulty file event.
                        // This only applies to external file events, so we need to check for the isExternal
                        // flag.
                        let exists = false;
                        if (isExternal && this.fileService.canHandleResource(resource)) {
                            await async_1.timeout(100);
                            exists = await this.fileService.exists(resource);
                        }
                        if (!exists && !editor.isDisposed()) {
                            editor.dispose();
                        }
                    }
                })();
            }
        }
        getAllNonDirtyEditors(options) {
            const editors = [];
            function conditionallyAddEditor(editor) {
                if (editor.isUntitled() && !options.includeUntitled) {
                    return;
                }
                if (editor.isDirty()) {
                    return;
                }
                editors.push(editor);
            }
            for (const editor of this.editors) {
                if (options.supportSideBySide && editor instanceof editor_2.SideBySideEditorInput) {
                    conditionallyAddEditor(editor.primary);
                    conditionallyAddEditor(editor.secondary);
                }
                else {
                    conditionallyAddEditor(editor);
                }
            }
            return editors;
        }
        get activeEditorPane() {
            var _a;
            return (_a = this.editorGroupService.activeGroup) === null || _a === void 0 ? void 0 : _a.activeEditorPane;
        }
        get activeTextEditorControl() {
            const activeEditorPane = this.activeEditorPane;
            if (activeEditorPane) {
                const activeControl = activeEditorPane.getControl();
                if (editorBrowser_1.isCodeEditor(activeControl) || editorBrowser_1.isDiffEditor(activeControl)) {
                    return activeControl;
                }
                if (editorBrowser_1.isCompositeEditor(activeControl) && editorBrowser_1.isCodeEditor(activeControl.activeCodeEditor)) {
                    return activeControl.activeCodeEditor;
                }
            }
            return undefined;
        }
        get activeTextEditorMode() {
            var _a;
            let activeCodeEditor = undefined;
            const activeTextEditorControl = this.activeTextEditorControl;
            if (editorBrowser_1.isDiffEditor(activeTextEditorControl)) {
                activeCodeEditor = activeTextEditorControl.getModifiedEditor();
            }
            else {
                activeCodeEditor = activeTextEditorControl;
            }
            return (_a = activeCodeEditor === null || activeCodeEditor === void 0 ? void 0 : activeCodeEditor.getModel()) === null || _a === void 0 ? void 0 : _a.getLanguageIdentifier().language;
        }
        get count() {
            return this.editorsObserver.count;
        }
        get editors() {
            return this.getEditors(1 /* SEQUENTIAL */).map(({ editor }) => editor);
        }
        getEditors(order, options) {
            if (order === 0 /* MOST_RECENTLY_ACTIVE */) {
                return this.editorsObserver.editors;
            }
            const editors = [];
            this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */).forEach(group => {
                editors.push(...group.getEditors(1 /* SEQUENTIAL */, options).map(editor => ({ editor, groupId: group.id })));
            });
            return editors;
        }
        get activeEditor() {
            const activeGroup = this.editorGroupService.activeGroup;
            return activeGroup ? types_1.withNullAsUndefined(activeGroup.activeEditor) : undefined;
        }
        get visibleEditorPanes() {
            return arrays_1.coalesce(this.editorGroupService.groups.map(group => group.activeEditorPane));
        }
        get visibleTextEditorControls() {
            const visibleTextEditorControls = [];
            for (const visibleEditorPane of this.visibleEditorPanes) {
                const control = visibleEditorPane.getControl();
                if (editorBrowser_1.isCodeEditor(control) || editorBrowser_1.isDiffEditor(control)) {
                    visibleTextEditorControls.push(control);
                }
            }
            return visibleTextEditorControls;
        }
        get visibleEditors() {
            return arrays_1.coalesce(this.editorGroupService.groups.map(group => group.activeEditor));
        }
        overrideOpenEditor(handler) {
            const remove = arrays_1.insert(this.openEditorHandlers, handler);
            return lifecycle_1.toDisposable(() => remove());
        }
        getEditorOverrides(resource, options, group) {
            const overrides = [];
            for (const handler of this.openEditorHandlers) {
                const handlers = handler.getEditorOverrides ? handler.getEditorOverrides(resource, options, group).map(val => [handler, val]) : [];
                overrides.push(...handlers);
            }
            return overrides;
        }
        onGroupWillOpenEditor(group, event) {
            var _a, _b;
            if (((_a = event.options) === null || _a === void 0 ? void 0 : _a.override) === false) {
                return; // return early when overrides are explicitly disabled
            }
            for (const handler of this.openEditorHandlers) {
                const result = handler.open(event.editor, event.options, group, (_b = event.context) !== null && _b !== void 0 ? _b : 1 /* NEW_EDITOR */);
                const override = result === null || result === void 0 ? void 0 : result.override;
                if (override) {
                    event.prevent((() => override.then(editor => types_1.withNullAsUndefined(editor))));
                    break;
                }
            }
        }
        async openEditor(editor, optionsOrGroup, group) {
            const result = this.doResolveEditorOpenRequest(editor, optionsOrGroup, group);
            if (result) {
                const [resolvedGroup, resolvedEditor, resolvedOptions] = result;
                return types_1.withNullAsUndefined(await resolvedGroup.openEditor(resolvedEditor, resolvedOptions));
            }
            return undefined;
        }
        doResolveEditorOpenRequest(editor, optionsOrGroup, group) {
            let resolvedGroup;
            let candidateGroup;
            let typedEditor;
            let typedOptions;
            // Typed Editor Support
            if (editor instanceof editor_2.EditorInput) {
                typedEditor = editor;
                typedOptions = this.toOptions(optionsOrGroup);
                candidateGroup = group;
                resolvedGroup = this.findTargetGroup(typedEditor, typedOptions, candidateGroup);
            }
            // Untyped Text Editor Support
            else {
                const textInput = editor;
                typedEditor = this.createEditorInput(textInput);
                if (typedEditor) {
                    typedOptions = editor_2.TextEditorOptions.from(textInput);
                    candidateGroup = optionsOrGroup;
                    resolvedGroup = this.findTargetGroup(typedEditor, typedOptions, candidateGroup);
                }
            }
            if (typedEditor && resolvedGroup) {
                if (this.editorGroupService.activeGroup !== resolvedGroup && // only if target group is not already active
                    typedOptions && !typedOptions.inactive && // never for inactive editors
                    typedOptions.preserveFocus && // only if preserveFocus
                    typeof typedOptions.activation !== 'number' && // only if activation is not already defined (either true or false)
                    candidateGroup !== editorService_1.SIDE_GROUP // never for the SIDE_GROUP
                ) {
                    // If the resolved group is not the active one, we typically
                    // want the group to become active. There are a few cases
                    // where we stay away from encorcing this, e.g. if the caller
                    // is already providing `activation`.
                    //
                    // Specifically for historic reasons we do not activate a
                    // group is it is opened as `SIDE_GROUP` with `preserveFocus:true`.
                    // repeated Alt-clicking of files in the explorer always open
                    // into the same side group and not cause a group to be created each time.
                    typedOptions.overwrite({ activation: editor_1.EditorActivation.ACTIVATE });
                }
                return [resolvedGroup, typedEditor, typedOptions];
            }
            return undefined;
        }
        findTargetGroup(input, options, group) {
            let targetGroup;
            // Group: Instance of Group
            if (group && typeof group !== 'number') {
                targetGroup = group;
            }
            // Group: Side by Side
            else if (group === editorService_1.SIDE_GROUP) {
                targetGroup = this.findSideBySideGroup();
            }
            // Group: Specific Group
            else if (typeof group === 'number' && group >= 0) {
                targetGroup = this.editorGroupService.getGroup(group);
            }
            // Group: Unspecified without a specific index to open
            else if (!options || typeof options.index !== 'number') {
                const groupsByLastActive = this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
                // Respect option to reveal an editor if it is already visible in any group
                if (options === null || options === void 0 ? void 0 : options.revealIfVisible) {
                    for (const group of groupsByLastActive) {
                        if (group.isActive(input)) {
                            targetGroup = group;
                            break;
                        }
                    }
                }
                // Respect option to reveal an editor if it is open (not necessarily visible)
                // Still prefer to reveal an editor in a group where the editor is active though.
                if (!targetGroup) {
                    if ((options === null || options === void 0 ? void 0 : options.revealIfOpened) || this.configurationService.getValue('workbench.editor.revealIfOpen')) {
                        let groupWithInputActive = undefined;
                        let groupWithInputOpened = undefined;
                        for (const group of groupsByLastActive) {
                            if (group.isOpened(input)) {
                                if (!groupWithInputOpened) {
                                    groupWithInputOpened = group;
                                }
                                if (!groupWithInputActive && group.isActive(input)) {
                                    groupWithInputActive = group;
                                }
                            }
                            if (groupWithInputOpened && groupWithInputActive) {
                                break; // we found all groups we wanted
                            }
                        }
                        // Prefer a target group where the input is visible
                        targetGroup = groupWithInputActive || groupWithInputOpened;
                    }
                }
            }
            // Fallback to active group if target not valid
            if (!targetGroup) {
                targetGroup = this.editorGroupService.activeGroup;
            }
            return targetGroup;
        }
        findSideBySideGroup() {
            const direction = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
            let neighbourGroup = this.editorGroupService.findGroup({ direction });
            if (!neighbourGroup) {
                neighbourGroup = this.editorGroupService.addGroup(this.editorGroupService.activeGroup, direction);
            }
            return neighbourGroup;
        }
        toOptions(options) {
            if (!options || options instanceof editor_2.EditorOptions) {
                return options;
            }
            const textOptions = options;
            if (textOptions.selection || textOptions.viewState) {
                return editor_2.TextEditorOptions.create(options);
            }
            return editor_2.EditorOptions.create(options);
        }
        async openEditors(editors, group) {
            // Convert to typed editors and options
            const typedEditors = editors.map(editor => {
                if (editor_2.isEditorInputWithOptions(editor)) {
                    return editor;
                }
                const editorInput = { editor: this.createEditorInput(editor), options: editor_2.TextEditorOptions.from(editor) };
                return editorInput;
            });
            // Find target groups to open
            const mapGroupToEditors = new Map();
            if (group === editorService_1.SIDE_GROUP) {
                mapGroupToEditors.set(this.findSideBySideGroup(), typedEditors);
            }
            else {
                typedEditors.forEach(typedEditor => {
                    const targetGroup = this.findTargetGroup(typedEditor.editor, typedEditor.options, group);
                    let targetGroupEditors = mapGroupToEditors.get(targetGroup);
                    if (!targetGroupEditors) {
                        targetGroupEditors = [];
                        mapGroupToEditors.set(targetGroup, targetGroupEditors);
                    }
                    targetGroupEditors.push(typedEditor);
                });
            }
            // Open in target groups
            const result = [];
            mapGroupToEditors.forEach((editorsWithOptions, group) => {
                result.push(group.openEditors(editorsWithOptions));
            });
            return arrays_1.coalesce(await Promise.all(result));
        }
        isOpen(editor) {
            if (editor instanceof editor_2.EditorInput) {
                return this.editorGroupService.groups.some(group => group.isOpened(editor));
            }
            if (editor.resource) {
                return this.editorsObserver.hasEditor(this.asCanonicalEditorResource(editor.resource));
            }
            return false;
        }
        replaceEditors(editors, group) {
            const typedEditors = [];
            editors.forEach(replaceEditorArg => {
                if (replaceEditorArg.editor instanceof editor_2.EditorInput) {
                    const replacementArg = replaceEditorArg;
                    typedEditors.push({
                        editor: replacementArg.editor,
                        replacement: replacementArg.replacement,
                        options: this.toOptions(replacementArg.options)
                    });
                }
                else {
                    const replacementArg = replaceEditorArg;
                    typedEditors.push({
                        editor: this.createEditorInput(replacementArg.editor),
                        replacement: this.createEditorInput(replacementArg.replacement),
                        options: this.toOptions(replacementArg.replacement.options)
                    });
                }
            });
            const targetGroup = typeof group === 'number' ? this.editorGroupService.getGroup(group) : group;
            if (targetGroup) {
                return targetGroup.replaceEditors(typedEditors);
            }
            return Promise.resolve();
        }
        //#endregion
        //#region invokeWithinEditorContext()
        invokeWithinEditorContext(fn) {
            const activeTextEditorControl = this.activeTextEditorControl;
            if (editorBrowser_1.isCodeEditor(activeTextEditorControl)) {
                return activeTextEditorControl.invokeWithinContext(fn);
            }
            const activeGroup = this.editorGroupService.activeGroup;
            if (activeGroup) {
                return activeGroup.invokeWithinContext(fn);
            }
            return this.instantiationService.invokeFunction(fn);
        }
        createEditorInput(input) {
            var _a;
            // Typed Editor Input Support (EditorInput)
            if (input instanceof editor_2.EditorInput) {
                return input;
            }
            // Typed Editor Input Support (IEditorInputWithOptions)
            const editorInputWithOptions = input;
            if (editorInputWithOptions.editor instanceof editor_2.EditorInput) {
                return editorInputWithOptions.editor;
            }
            // Diff Editor Support
            const resourceDiffInput = input;
            if (resourceDiffInput.leftResource && resourceDiffInput.rightResource) {
                const leftInput = this.createEditorInput({ resource: resourceDiffInput.leftResource, forceFile: resourceDiffInput.forceFile });
                const rightInput = this.createEditorInput({ resource: resourceDiffInput.rightResource, forceFile: resourceDiffInput.forceFile });
                return new diffEditorInput_1.DiffEditorInput(resourceDiffInput.label || this.toSideBySideLabel(leftInput, rightInput, '↔'), resourceDiffInput.description, leftInput, rightInput);
            }
            // Untitled file support
            const untitledInput = input;
            if (untitledInput.forceUntitled || !untitledInput.resource || (untitledInput.resource && untitledInput.resource.scheme === network_1.Schemas.untitled)) {
                const untitledOptions = {
                    mode: untitledInput.mode,
                    initialValue: untitledInput.contents,
                    encoding: untitledInput.encoding
                };
                // Untitled resource: use as hint for an existing untitled editor
                let untitledModel;
                if (((_a = untitledInput.resource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.untitled) {
                    untitledModel = this.untitledTextEditorService.create(Object.assign({ untitledResource: untitledInput.resource }, untitledOptions));
                }
                // Other resource: use as hint for associated filepath
                else {
                    untitledModel = this.untitledTextEditorService.create(Object.assign({ associatedResource: untitledInput.resource }, untitledOptions));
                }
                return this.createOrGetCached(untitledModel.resource, () => {
                    // Factory function for new untitled editor
                    const input = this.instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, untitledModel);
                    // We dispose the untitled model once the editor
                    // is being disposed. Even though we may have not
                    // created the model initially, the lifecycle for
                    // untitled is tightly coupled with the editor
                    // lifecycle for now.
                    event_1.Event.once(input.onDispose)(() => untitledModel.dispose());
                    return input;
                });
            }
            // Resource Editor Support
            const resourceEditorInput = input;
            if (resourceEditorInput.resource instanceof uri_1.URI) {
                // Derive the label from the path if not provided explicitly
                const label = resourceEditorInput.label || resources_1.basename(resourceEditorInput.resource);
                // From this moment on, only operate on the canonical resource
                // to ensure we reduce the chance of opening the same resource
                // with different resource forms (e.g. path casing on Windows)
                const canonicalResource = this.asCanonicalEditorResource(resourceEditorInput.resource);
                return this.createOrGetCached(canonicalResource, () => {
                    // File
                    if (resourceEditorInput.forceFile /* fix for https://github.com/Microsoft/vscode/issues/48275 */ || this.fileService.canHandleResource(canonicalResource)) {
                        return this.fileEditorInputFactory.createFileEditorInput(canonicalResource, resourceEditorInput.resource, resourceEditorInput.encoding, resourceEditorInput.mode, this.instantiationService);
                    }
                    // Resource
                    return this.instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, canonicalResource, resourceEditorInput.label, resourceEditorInput.description, resourceEditorInput.mode);
                }, cachedInput => {
                    // Untitled
                    if (cachedInput instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                        return;
                    }
                    // Files
                    else if (!(cachedInput instanceof resourceEditorInput_1.ResourceEditorInput)) {
                        cachedInput.setLabel(resourceEditorInput.resource);
                        if (resourceEditorInput.encoding) {
                            cachedInput.setPreferredEncoding(resourceEditorInput.encoding);
                        }
                        if (resourceEditorInput.mode) {
                            cachedInput.setPreferredMode(resourceEditorInput.mode);
                        }
                    }
                    // Resources
                    else {
                        if (label) {
                            cachedInput.setName(label);
                        }
                        if (resourceEditorInput.description) {
                            cachedInput.setDescription(resourceEditorInput.description);
                        }
                        if (resourceEditorInput.mode) {
                            cachedInput.setPreferredMode(resourceEditorInput.mode);
                        }
                    }
                });
            }
            throw new Error('Unknown input type');
        }
        get modelService() {
            if (!this._modelService) {
                this._modelService = this.instantiationService.invokeFunction(accessor => accessor.get(modelService_1.IModelService));
            }
            return this._modelService;
        }
        asCanonicalEditorResource(resource) {
            var _a;
            const canonicalResource = this.uriIdentityService.asCanonicalUri(resource);
            // In the unlikely case that a model exists for the original resource but
            // differs from the canonical resource, we print a warning as this means
            // the model will not be able to be opened as editor.
            if (!resources_1.extUri.isEqual(resource, canonicalResource) && ((_a = this.modelService) === null || _a === void 0 ? void 0 : _a.getModel(resource))) {
                console.warn(`EditorService: a model exists for a resource that is not canonical: ${resource.toString(true)}`);
            }
            return canonicalResource;
        }
        createOrGetCached(resource, factoryFn, cachedFn) {
            // Return early if already cached
            let input = this.editorInputCache.get(resource);
            if (input) {
                if (cachedFn) {
                    cachedFn(input);
                }
                return input;
            }
            // Otherwise create and add to cache
            input = factoryFn();
            this.editorInputCache.set(resource, input);
            event_1.Event.once(input.onDispose)(() => this.editorInputCache.delete(resource));
            return input;
        }
        toSideBySideLabel(leftInput, rightInput, divider) {
            const leftResource = leftInput.resource;
            const rightResource = rightInput.resource;
            // Without any resource, do not try to compute a label
            if (!leftResource || !rightResource) {
                return undefined;
            }
            // If both editors are file inputs, we produce an optimized label
            // by adding the relative path of both inputs to the label. This
            // makes it easier to understand a file-based comparison.
            if (this.fileEditorInputFactory.isFileEditorInput(leftInput) && this.fileEditorInputFactory.isFileEditorInput(rightInput)) {
                return `${this.labelService.getUriLabel(leftResource, { relative: true })} ${divider} ${this.labelService.getUriLabel(rightResource, { relative: true })}`;
            }
            // Signal back that the label should be computed from within the editor
            return undefined;
        }
        //#endregion
        //#region save/revert
        async save(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not save the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            // Split editors up into a bucket that is saved in parallel
            // and sequentially. Unless "Save As", all non-untitled editors
            // can be saved in parallel to speed up the operation. Remaining
            // editors are potentially bringing up some UI and thus run
            // sequentially.
            const editorsToSaveParallel = [];
            const editorsToSaveSequentially = [];
            if (options === null || options === void 0 ? void 0 : options.saveAs) {
                editorsToSaveSequentially.push(...uniqueEditors);
            }
            else {
                for (const { groupId, editor } of uniqueEditors) {
                    if (editor.isUntitled()) {
                        editorsToSaveSequentially.push({ groupId, editor });
                    }
                    else {
                        editorsToSaveParallel.push({ groupId, editor });
                    }
                }
            }
            // Editors to save in parallel
            const saveResults = await Promise.all(editorsToSaveParallel.map(({ groupId, editor }) => {
                var _a;
                // Use save as a hint to pin the editor if used explicitly
                if ((options === null || options === void 0 ? void 0 : options.reason) === 1 /* EXPLICIT */) {
                    (_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.pinEditor(editor);
                }
                // Save
                return editor.save(groupId, options);
            }));
            // Editors to save sequentially
            for (const { groupId, editor } of editorsToSaveSequentially) {
                if (editor.isDisposed()) {
                    continue; // might have been disposed from the save already
                }
                // Preserve view state by opening the editor first if the editor
                // is untitled or we "Save As". This also allows the user to review
                // the contents of the editor before making a decision.
                let viewState = undefined;
                const editorPane = await this.openEditor(editor, undefined, groupId);
                if (editor_2.isTextEditorPane(editorPane)) {
                    viewState = editorPane.getViewState();
                }
                const result = (options === null || options === void 0 ? void 0 : options.saveAs) ? await editor.saveAs(groupId, options) : await editor.save(groupId, options);
                saveResults.push(result);
                if (!result) {
                    break; // failed or cancelled, abort
                }
                // Replace editor preserving viewstate (either across all groups or
                // only selected group) if the resulting editor is different from the
                // current one.
                if (!result.matches(editor)) {
                    const targetGroups = editor.isUntitled() ? this.editorGroupService.groups.map(group => group.id) /* untitled replaces across all groups */ : [groupId];
                    for (const group of targetGroups) {
                        await this.replaceEditors([{ editor, replacement: result, options: { pinned: true, viewState } }], group);
                    }
                }
            }
            return saveResults.every(result => !!result);
        }
        saveAll(options) {
            return this.save(this.getAllDirtyEditors(options), options);
        }
        async revert(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not revert the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            await Promise.all(uniqueEditors.map(async ({ groupId, editor }) => {
                var _a;
                // Use revert as a hint to pin the editor
                (_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.pinEditor(editor);
                return editor.revert(groupId, options);
            }));
            return !uniqueEditors.some(({ editor }) => editor.isDirty());
        }
        async revertAll(options) {
            return this.revert(this.getAllDirtyEditors(options), options);
        }
        getAllDirtyEditors(options) {
            const editors = [];
            for (const group of this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */)) {
                for (const editor of group.getEditors(0 /* MOST_RECENTLY_ACTIVE */)) {
                    if (!editor.isDirty()) {
                        continue;
                    }
                    if (!(options === null || options === void 0 ? void 0 : options.includeUntitled) && editor.isUntitled()) {
                        continue;
                    }
                    if ((options === null || options === void 0 ? void 0 : options.excludeSticky) && group.isSticky(editor)) {
                        continue;
                    }
                    editors.push({ groupId: group.id, editor });
                }
            }
            return editors;
        }
        getUniqueEditors(editors) {
            const uniqueEditors = [];
            for (const { editor, groupId } of editors) {
                if (uniqueEditors.some(uniqueEditor => uniqueEditor.editor.matches(editor))) {
                    continue;
                }
                uniqueEditors.push({ editor, groupId });
            }
            return uniqueEditors;
        }
        registerCustomEditorViewTypesHandler(source, handler) {
            if (this.customEditorViewTypesHandlers.has(source)) {
                throw new Error(`Use a different name for the custom editor component, ${source} is already occupied.`);
            }
            this.customEditorViewTypesHandlers.set(source, handler);
            this.updateSchema();
            const viewTypeChangeEvent = handler.onDidChangeViewTypes(() => {
                this.updateSchema();
            });
            return {
                dispose: () => {
                    viewTypeChangeEvent.dispose();
                    this.customEditorViewTypesHandlers.delete(source);
                    this.updateSchema();
                }
            };
        }
        updateSchema() {
            const enumValues = [];
            const enumDescriptions = [];
            const infos = [editorOpenWith_1.DEFAULT_CUSTOM_EDITOR];
            for (const [, handler] of this.customEditorViewTypesHandlers) {
                infos.push(...handler.getViewTypes());
            }
            infos.forEach(info => {
                enumValues.push(info.id);
                enumDescriptions.push(nls.localize('editorAssociations.viewType.sourceDescription', "Source: {0}", info.providerDisplayName));
            });
            editorOpenWith_1.updateViewTypeSchema(enumValues, enumDescriptions);
        }
        //#endregion
        //#region Editor Tracking
        whenClosed(editors, options) {
            let remainingEditors = [...editors];
            return new Promise(resolve => {
                const listener = this.onDidCloseEditor(async (event) => {
                    const primaryResource = editor_2.toResource(event.editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
                    const secondaryResource = editor_2.toResource(event.editor, { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
                    // Remove from resources to wait for being closed based on the
                    // resources from editors that got closed
                    remainingEditors = remainingEditors.filter(({ resource }) => {
                        if (this.uriIdentityService.extUri.isEqual(resource, primaryResource) || this.uriIdentityService.extUri.isEqual(resource, secondaryResource)) {
                            return false; // remove - the closing editor matches this resource
                        }
                        return true; // keep - not yet closed
                    });
                    // All resources to wait for being closed are closed
                    if (remainingEditors.length === 0) {
                        if (options === null || options === void 0 ? void 0 : options.waitForSaved) {
                            // If auto save is configured with the default delay (1s) it is possible
                            // to close the editor while the save still continues in the background. As such
                            // we have to also check if the editors to track for are dirty and if so wait
                            // for them to get saved.
                            const dirtyResources = editors.filter(({ resource }) => this.workingCopyService.isDirty(resource)).map(({ resource }) => resource);
                            if (dirtyResources.length > 0) {
                                await Promise.all(dirtyResources.map(async (resource) => await this.whenSaved(resource)));
                            }
                        }
                        listener.dispose();
                        resolve();
                    }
                });
            });
        }
        whenSaved(resource) {
            return new Promise(resolve => {
                if (!this.workingCopyService.isDirty(resource)) {
                    return resolve(); // return early if resource is not dirty
                }
                // Otherwise resolve promise when resource is saved
                const listener = this.workingCopyService.onDidChangeDirty(workingCopy => {
                    if (!workingCopy.isDirty() && this.uriIdentityService.extUri.isEqual(resource, workingCopy.resource)) {
                        listener.dispose();
                        resolve();
                    }
                });
            });
        }
        //#endregion
        dispose() {
            super.dispose();
            // Dispose remaining watchers if any
            this.activeOutOfWorkspaceWatchers.forEach(disposable => lifecycle_1.dispose(disposable));
            this.activeOutOfWorkspaceWatchers.clear();
        }
    };
    EditorService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, label_1.ILabelService),
        __param(4, files_1.IFileService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, workingCopyService_1.IWorkingCopyService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], EditorService);
    exports.EditorService = EditorService;
    /**
     * The delegating workbench editor service can be used to override the behaviour of the openEditor()
     * method by providing a IEditorOpenHandler. All calls are being delegated to the existing editor
     * service otherwise.
     */
    let DelegatingEditorService = class DelegatingEditorService {
        constructor(editorOpenHandler, editorService) {
            this.editorOpenHandler = editorOpenHandler;
            this.editorService = editorService;
        }
        async openEditor(editor, optionsOrGroup, group) {
            const result = this.editorService.doResolveEditorOpenRequest(editor, optionsOrGroup, group);
            if (result) {
                const [resolvedGroup, resolvedEditor, resolvedOptions] = result;
                // Pass on to editor open handler
                const editorPane = await this.editorOpenHandler((group, editor, options) => group.openEditor(editor, options), resolvedGroup, resolvedEditor, resolvedOptions);
                if (editorPane) {
                    return editorPane; // the opening was handled, so return early
                }
                return types_1.withNullAsUndefined(await resolvedGroup.openEditor(resolvedEditor, resolvedOptions));
            }
            return undefined;
        }
        //#region Delegate to IEditorService
        get onDidActiveEditorChange() { return this.editorService.onDidActiveEditorChange; }
        get onDidVisibleEditorsChange() { return this.editorService.onDidVisibleEditorsChange; }
        get onDidCloseEditor() { return this.editorService.onDidCloseEditor; }
        get activeEditor() { return this.editorService.activeEditor; }
        get activeEditorPane() { return this.editorService.activeEditorPane; }
        get activeTextEditorControl() { return this.editorService.activeTextEditorControl; }
        get activeTextEditorMode() { return this.editorService.activeTextEditorMode; }
        get visibleEditors() { return this.editorService.visibleEditors; }
        get visibleEditorPanes() { return this.editorService.visibleEditorPanes; }
        get visibleTextEditorControls() { return this.editorService.visibleTextEditorControls; }
        get editors() { return this.editorService.editors; }
        get count() { return this.editorService.count; }
        getEditors(order, options) {
            if (order === 0 /* MOST_RECENTLY_ACTIVE */) {
                return this.editorService.getEditors(order);
            }
            return this.editorService.getEditors(order, options);
        }
        openEditors(editors, group) {
            return this.editorService.openEditors(editors, group);
        }
        replaceEditors(editors, group) {
            return this.editorService.replaceEditors(editors /* TS fail */, group);
        }
        isOpen(editor) { return this.editorService.isOpen(editor /* TS fail */); }
        overrideOpenEditor(handler) { return this.editorService.overrideOpenEditor(handler); }
        getEditorOverrides(resource, options, group) { return this.editorService.getEditorOverrides(resource, options, group); }
        invokeWithinEditorContext(fn) { return this.editorService.invokeWithinEditorContext(fn); }
        createEditorInput(input) { return this.editorService.createEditorInput(input); }
        save(editors, options) { return this.editorService.save(editors, options); }
        saveAll(options) { return this.editorService.saveAll(options); }
        revert(editors, options) { return this.editorService.revert(editors, options); }
        revertAll(options) { return this.editorService.revertAll(options); }
        registerCustomEditorViewTypesHandler(source, handler) { return this.editorService.registerCustomEditorViewTypesHandler(source, handler); }
        whenClosed(editors) { return this.editorService.whenClosed(editors); }
    };
    DelegatingEditorService = __decorate([
        __param(1, editorService_1.IEditorService)
    ], DelegatingEditorService);
    exports.DelegatingEditorService = DelegatingEditorService;
    extensions_1.registerSingleton(editorService_1.IEditorService, EditorService);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration(editorOpenWith_1.editorAssociationsConfigurationNode);
});
//# __sourceMappingURL=editorService.js.map