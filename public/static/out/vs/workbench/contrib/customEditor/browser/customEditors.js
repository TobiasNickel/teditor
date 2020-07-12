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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uuid", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/customEditorModelManager", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorOpenWith", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "../common/contributedCustomEditors", "./customEditorInput"], function (require, exports, platform_1, arrays_1, event_1, lazy_1, lifecycle_1, resources_1, uuid_1, nls, configuration_1, contextkey_1, editor_1, files_1, instantiation_1, quickInput_1, storage_1, colorRegistry, themeService_1, editor_2, diffEditorInput_1, customEditor_1, customEditorModelManager_1, webview_1, editorOpenWith_1, editorGroupsService_1, editorService_1, contributedCustomEditors_1, customEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorContribution = exports.CustomEditorService = void 0;
    let CustomEditorService = class CustomEditorService extends lifecycle_1.Disposable {
        constructor(contextKeyService, fileService, storageService, configurationService, editorService, editorGroupService, instantiationService, quickInputService, webviewService) {
            super();
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.quickInputService = quickInputService;
            this.webviewService = webviewService;
            this._editorCapabilities = new Map();
            this._models = new customEditorModelManager_1.CustomEditorModelManager();
            this._onDidChangeViewTypes = new event_1.Emitter();
            this.onDidChangeViewTypes = this._onDidChangeViewTypes.event;
            this._fileEditorInputFactory = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).getFileEditorInputFactory();
            this._customEditorContextKey = customEditor_1.CONTEXT_CUSTOM_EDITORS.bindTo(contextKeyService);
            this._focusedCustomEditorIsEditable = customEditor_1.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE.bindTo(contextKeyService);
            this._webviewHasOwnEditFunctions = webview_1.webviewHasOwnEditFunctionsContext.bindTo(contextKeyService);
            this._contributedEditors = this._register(new contributedCustomEditors_1.ContributedCustomEditors(storageService));
            this._register(this._contributedEditors.onChange(() => {
                this.updateContexts();
                this._onDidChangeViewTypes.fire();
            }));
            this._register(this.editorService.registerCustomEditorViewTypesHandler('Custom Editor', this));
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateContexts()));
            this._register(fileService.onDidRunOperation(e => {
                if (e.isOperation(2 /* MOVE */)) {
                    this.handleMovedFileInOpenedFileEditors(e.resource, e.target.resource);
                }
            }));
            this.updateContexts();
        }
        getViewTypes() {
            return [...this._contributedEditors];
        }
        get models() { return this._models; }
        getCustomEditor(viewType) {
            return this._contributedEditors.get(viewType);
        }
        getContributedCustomEditors(resource) {
            return new customEditor_1.CustomEditorInfoCollection(this._contributedEditors.getContributedEditors(resource));
        }
        getUserConfiguredCustomEditors(resource) {
            const rawAssociations = this.configurationService.getValue(editorOpenWith_1.customEditorsAssociationsSettingId) || [];
            return new customEditor_1.CustomEditorInfoCollection(arrays_1.coalesce(rawAssociations
                .filter(association => customEditor_1.CustomEditorInfo.selectorMatches(association, resource))
                .map(association => this._contributedEditors.get(association.viewType))));
        }
        getAllCustomEditors(resource) {
            return new customEditor_1.CustomEditorInfoCollection([
                ...this.getUserConfiguredCustomEditors(resource).allEditors,
                ...this.getContributedCustomEditors(resource).allEditors,
            ]);
        }
        async promptOpenWith(resource, options, group) {
            const pick = await this.showOpenWithPrompt(resource, group);
            if (!pick) {
                return;
            }
            return this.openWith(resource, pick, options, group);
        }
        showOpenWithPrompt(resource, group) {
            const customEditors = new customEditor_1.CustomEditorInfoCollection([
                contributedCustomEditors_1.defaultCustomEditor,
                ...this.getAllCustomEditors(resource).allEditors,
            ]);
            let currentlyOpenedEditorType;
            for (const editor of group ? group.editors : []) {
                if (editor.resource && resources_1.isEqual(editor.resource, resource)) {
                    currentlyOpenedEditorType = editor instanceof customEditorInput_1.CustomEditorInput ? editor.viewType : contributedCustomEditors_1.defaultCustomEditor.id;
                    break;
                }
            }
            const resourceExt = resources_1.extname(resource);
            const items = customEditors.allEditors.map((editorDescriptor) => ({
                label: editorDescriptor.displayName,
                id: editorDescriptor.id,
                description: editorDescriptor.id === currentlyOpenedEditorType
                    ? nls.localize('openWithCurrentlyActive', "Currently Active")
                    : undefined,
                detail: editorDescriptor.providerDisplayName,
                buttons: resourceExt ? [{
                        iconClass: 'codicon-settings-gear',
                        tooltip: nls.localize('promptOpenWith.setDefaultTooltip', "Set as default editor for '{0}' files", resourceExt)
                    }] : undefined
            }));
            const picker = this.quickInputService.createQuickPick();
            picker.items = items;
            picker.placeholder = nls.localize('promptOpenWith.placeHolder', "Select editor to use for '{0}'...", resources_1.basename(resource));
            return new Promise(resolve => {
                picker.onDidAccept(() => {
                    resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0].id : undefined);
                    picker.dispose();
                });
                picker.onDidTriggerItemButton(e => {
                    const pick = e.item.id;
                    resolve(pick); // open the view
                    picker.dispose();
                    // And persist the setting
                    if (pick) {
                        const newAssociation = { viewType: pick, filenamePattern: '*' + resourceExt };
                        const currentAssociations = [...this.configurationService.getValue(editorOpenWith_1.customEditorsAssociationsSettingId)];
                        // First try updating existing association
                        for (let i = 0; i < currentAssociations.length; ++i) {
                            const existing = currentAssociations[i];
                            if (existing.filenamePattern === newAssociation.filenamePattern) {
                                currentAssociations.splice(i, 1, newAssociation);
                                this.configurationService.updateValue(editorOpenWith_1.customEditorsAssociationsSettingId, currentAssociations);
                                return;
                            }
                        }
                        // Otherwise, create a new one
                        currentAssociations.unshift(newAssociation);
                        this.configurationService.updateValue(editorOpenWith_1.customEditorsAssociationsSettingId, currentAssociations);
                    }
                });
                picker.show();
            });
        }
        async openWith(resource, viewType, options, group) {
            if (viewType === contributedCustomEditors_1.defaultCustomEditor.id) {
                const fileEditorInput = this.editorService.createEditorInput({ resource, forceFile: true });
                return this.openEditorForResource(resource, fileEditorInput, Object.assign(Object.assign({}, options), { override: false }), group);
            }
            if (!this._contributedEditors.get(viewType)) {
                return this.promptOpenWith(resource, options, group);
            }
            const capabilities = this.getCustomEditorCapabilities(viewType) || {};
            if (!capabilities.supportsMultipleEditorsPerDocument) {
                const movedEditor = await this.tryRevealExistingEditorForResourceInGroup(resource, viewType, options, group);
                if (movedEditor) {
                    return movedEditor;
                }
            }
            const input = this.createInput(resource, viewType, group === null || group === void 0 ? void 0 : group.id);
            return this.openEditorForResource(resource, input, options, group);
        }
        createInput(resource, viewType, group, options) {
            if (viewType === contributedCustomEditors_1.defaultCustomEditor.id) {
                return this.editorService.createEditorInput({ resource, forceFile: true });
            }
            const id = uuid_1.generateUuid();
            const webview = new lazy_1.Lazy(() => {
                return this.webviewService.createWebviewOverlay(id, { customClasses: options === null || options === void 0 ? void 0 : options.customClasses }, {}, undefined);
            });
            const input = this.instantiationService.createInstance(customEditorInput_1.CustomEditorInput, resource, viewType, id, webview, {});
            if (typeof group !== 'undefined') {
                input.updateGroup(group);
            }
            return input;
        }
        async openEditorForResource(resource, input, options, group) {
            const targetGroup = group || this.editorGroupService.activeGroup;
            if (options && typeof options.activation === 'undefined') {
                options = Object.assign(Object.assign({}, options), { activation: options.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined });
            }
            // Try to replace existing editors for resource
            const existingEditors = targetGroup.editors.filter(editor => editor.resource && resources_1.isEqual(editor.resource, resource));
            if (existingEditors.length) {
                const existing = existingEditors[0];
                if (!input.matches(existing)) {
                    await this.editorService.replaceEditors([{
                            editor: existing,
                            replacement: input,
                            options: options ? editor_2.EditorOptions.create(options) : undefined,
                        }], targetGroup);
                    if (existing instanceof customEditorInput_1.CustomEditorInput) {
                        existing.dispose();
                    }
                }
            }
            return this.editorService.openEditor(input, options, group);
        }
        registerCustomEditorCapabilities(viewType, options) {
            if (this._editorCapabilities.has(viewType)) {
                throw new Error(`Capabilities for ${viewType} already set`);
            }
            this._editorCapabilities.set(viewType, options);
            return lifecycle_1.toDisposable(() => {
                this._editorCapabilities.delete(viewType);
            });
        }
        getCustomEditorCapabilities(viewType) {
            return this._editorCapabilities.get(viewType);
        }
        updateContexts() {
            var _a;
            const activeEditorPane = this.editorService.activeEditorPane;
            const resource = (_a = activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.input) === null || _a === void 0 ? void 0 : _a.resource;
            if (!resource) {
                this._customEditorContextKey.reset();
                this._focusedCustomEditorIsEditable.reset();
                this._webviewHasOwnEditFunctions.reset();
                return;
            }
            const possibleEditors = this.getAllCustomEditors(resource).allEditors;
            this._customEditorContextKey.set(possibleEditors.map(x => x.id).join(','));
            this._focusedCustomEditorIsEditable.set((activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.input) instanceof customEditorInput_1.CustomEditorInput);
            this._webviewHasOwnEditFunctions.set(possibleEditors.length > 0);
        }
        async handleMovedFileInOpenedFileEditors(oldResource, newResource) {
            if (resources_1.extname(oldResource) === resources_1.extname(newResource)) {
                return;
            }
            const possibleEditors = this.getAllCustomEditors(newResource);
            // See if we have any non-optional custom editor for this resource
            if (!possibleEditors.allEditors.some(editor => editor.priority !== "option" /* option */)) {
                return;
            }
            // If so, check all editors to see if there are any file editors open for the new resource
            const editorsToReplace = new Map();
            for (const group of this.editorGroupService.groups) {
                for (const editor of group.editors) {
                    if (this._fileEditorInputFactory.isFileEditorInput(editor)
                        && !(editor instanceof customEditorInput_1.CustomEditorInput)
                        && resources_1.isEqual(editor.resource, newResource)) {
                        let entry = editorsToReplace.get(group.id);
                        if (!entry) {
                            entry = [];
                            editorsToReplace.set(group.id, entry);
                        }
                        entry.push(editor);
                    }
                }
            }
            if (!editorsToReplace.size) {
                return;
            }
            let viewType;
            if (possibleEditors.defaultEditor) {
                viewType = possibleEditors.defaultEditor.id;
            }
            else {
                // If there is, show a single prompt for all editors to see if the user wants to re-open them
                //
                // TODO: instead of prompting eagerly, it'd likely be better to replace all the editors with
                // ones that would prompt when they first become visible
                await new Promise(resolve => setTimeout(resolve, 50));
                viewType = await this.showOpenWithPrompt(newResource);
            }
            if (!viewType) {
                return;
            }
            for (const [group, entries] of editorsToReplace) {
                this.editorService.replaceEditors(entries.map(editor => {
                    const replacement = this.createInput(newResource, viewType, group);
                    return {
                        editor,
                        replacement,
                        options: {
                            preserveFocus: true,
                        }
                    };
                }), group);
            }
        }
        async tryRevealExistingEditorForResourceInGroup(resource, viewType, options, group) {
            const editorInfoForResource = this.findExistingEditorsForResource(resource, viewType);
            if (!editorInfoForResource.length) {
                return undefined;
            }
            const editorToUse = editorInfoForResource[0];
            // Replace all other editors
            for (const { editor, group } of editorInfoForResource) {
                if (editor !== editorToUse.editor) {
                    group.closeEditor(editor);
                }
            }
            const targetGroup = group || this.editorGroupService.activeGroup;
            const newEditor = await this.openEditorForResource(resource, editorToUse.editor, Object.assign(Object.assign({}, options), { override: false }), targetGroup);
            if (targetGroup.id !== editorToUse.group.id) {
                editorToUse.group.closeEditor(editorToUse.editor);
            }
            return newEditor;
        }
        findExistingEditorsForResource(resource, viewType) {
            const out = [];
            const orderedGroups = arrays_1.distinct([
                this.editorGroupService.activeGroup,
                ...this.editorGroupService.groups,
            ]);
            for (const group of orderedGroups) {
                for (const editor of group.editors) {
                    if (isMatchingCustomEditor(editor, viewType, resource)) {
                        out.push({ editor, group });
                    }
                }
            }
            return out;
        }
    };
    CustomEditorService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, quickInput_1.IQuickInputService),
        __param(8, webview_1.IWebviewService)
    ], CustomEditorService);
    exports.CustomEditorService = CustomEditorService;
    let CustomEditorContribution = class CustomEditorContribution extends lifecycle_1.Disposable {
        constructor(editorService, customEditorService) {
            super();
            this.editorService = editorService;
            this.customEditorService = customEditorService;
            this._fileEditorInputFactory = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).getFileEditorInputFactory();
            this._register(this.editorService.overrideOpenEditor({
                open: (editor, options, group) => {
                    return this.onEditorOpening(editor, options, group);
                },
                getEditorOverrides: (resource, _options, group) => {
                    const currentEditor = group === null || group === void 0 ? void 0 : group.editors.find(editor => resources_1.isEqual(editor.resource, resource));
                    const customEditors = this.customEditorService.getAllCustomEditors(resource);
                    if (!customEditors.length) {
                        return [];
                    }
                    return [
                        Object.assign(Object.assign({}, editorOpenWith_1.defaultEditorOverrideEntry), { active: this._fileEditorInputFactory.isFileEditorInput(currentEditor) }),
                        ...customEditors.allEditors
                            .filter(entry => entry.id !== contributedCustomEditors_1.defaultCustomEditor.id)
                            .map(entry => {
                            return {
                                id: entry.id,
                                active: currentEditor instanceof customEditorInput_1.CustomEditorInput && currentEditor.viewType === entry.id,
                                label: entry.displayName,
                                detail: entry.providerDisplayName,
                            };
                        })
                    ];
                }
            }));
        }
        onEditorOpening(editor, options, group) {
            const id = typeof (options === null || options === void 0 ? void 0 : options.override) === 'string' ? options.override : undefined;
            if (editor instanceof customEditorInput_1.CustomEditorInput) {
                if (editor.group === group.id && (editor.viewType === id || typeof id !== 'string')) {
                    // No need to do anything
                    return undefined;
                }
                else {
                    // Create a copy of the input.
                    // Unlike normal editor inputs, we do not want to share custom editor inputs
                    // between multiple editors / groups.
                    return {
                        override: this.customEditorService.openWith(editor.resource, id !== null && id !== void 0 ? id : editor.viewType, options, group)
                    };
                }
            }
            if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                return this.onDiffEditorOpening(editor, options, group);
            }
            const resource = editor.resource;
            if (!resource) {
                return undefined;
            }
            if (id) {
                return {
                    override: this.customEditorService.openWith(resource, id, Object.assign(Object.assign({}, options), { override: false }), group)
                };
            }
            return this.onResourceEditorOpening(resource, editor, options, group);
        }
        onResourceEditorOpening(resource, editor, options, group) {
            const userConfiguredEditors = this.customEditorService.getUserConfiguredCustomEditors(resource);
            const contributedEditors = this.customEditorService.getContributedCustomEditors(resource);
            if (!userConfiguredEditors.length && !contributedEditors.length) {
                return;
            }
            // Check to see if there already an editor for the resource in the group.
            // If there is, we want to open that instead of creating a new editor.
            // This ensures that we preserve whatever type of editor was previously being used
            // when the user switches back to it.
            const existingEditorForResource = group.editors.find(editor => resources_1.isEqual(resource, editor.resource));
            if (existingEditorForResource) {
                if (editor === existingEditorForResource) {
                    return;
                }
                return {
                    override: this.editorService.openEditor(existingEditorForResource, Object.assign(Object.assign({}, options), { override: false, activation: (options === null || options === void 0 ? void 0 : options.preserveFocus) ? editor_1.EditorActivation.RESTORE : undefined }), group)
                };
            }
            if (userConfiguredEditors.length) {
                return {
                    override: this.customEditorService.openWith(resource, userConfiguredEditors.allEditors[0].id, options, group),
                };
            }
            if (!contributedEditors.length) {
                return;
            }
            const defaultEditor = contributedEditors.defaultEditor;
            if (defaultEditor) {
                return {
                    override: this.customEditorService.openWith(resource, defaultEditor.id, options, group),
                };
            }
            // If we have all optional editors, then open VS Code's standard editor
            if (contributedEditors.allEditors.every(editor => editor.priority === "option" /* option */)) {
                return;
            }
            // Open VS Code's standard editor but prompt user to see if they wish to use a custom one instead
            return {
                override: (async () => {
                    const standardEditor = await this.editorService.openEditor(editor, Object.assign(Object.assign({}, options), { override: false }), group);
                    // Give a moment to make sure the editor is showing.
                    // Otherwise the focus shift can cause the prompt to be dismissed right away.
                    await new Promise(resolve => setTimeout(resolve, 20));
                    const selectedEditor = await this.customEditorService.promptOpenWith(resource, options, group);
                    if (selectedEditor && selectedEditor.input) {
                        await group.replaceEditors([{
                                editor,
                                replacement: selectedEditor.input
                            }]);
                        return selectedEditor;
                    }
                    return standardEditor;
                })()
            };
        }
        onDiffEditorOpening(editor, options, group) {
            const getBestAvailableEditorForSubInput = (subInput) => {
                if (subInput instanceof customEditorInput_1.CustomEditorInput) {
                    return undefined;
                }
                const resource = subInput.resource;
                if (!resource) {
                    return undefined;
                }
                // Prefer default editors in the diff editor case but ultimately always take the first editor
                const allEditors = new customEditor_1.CustomEditorInfoCollection([
                    ...this.customEditorService.getUserConfiguredCustomEditors(resource).allEditors,
                    ...this.customEditorService.getContributedCustomEditors(resource).allEditors.filter(x => x.priority !== "option" /* option */),
                ]);
                return allEditors.bestAvailableEditor;
            };
            const createEditorForSubInput = (subInput, editor, customClasses) => {
                if (!editor) {
                    return;
                }
                if (!subInput.resource) {
                    return;
                }
                const input = this.customEditorService.createInput(subInput.resource, editor.id, group.id, { customClasses });
                return input instanceof editor_2.EditorInput ? input : undefined;
            };
            const modifiedEditorInfo = getBestAvailableEditorForSubInput(editor.modifiedInput);
            const originalEditorInfo = getBestAvailableEditorForSubInput(editor.originalInput);
            // If we are only using default editors, no need to override anything
            if ((!modifiedEditorInfo || modifiedEditorInfo.id === contributedCustomEditors_1.defaultCustomEditor.id) &&
                (!originalEditorInfo || originalEditorInfo.id === contributedCustomEditors_1.defaultCustomEditor.id)) {
                return undefined;
            }
            const modifiedOverride = createEditorForSubInput(editor.modifiedInput, modifiedEditorInfo, 'modified');
            const originalOverride = createEditorForSubInput(editor.originalInput, originalEditorInfo, 'original');
            if (modifiedOverride || originalOverride) {
                return {
                    override: (async () => {
                        const input = new diffEditorInput_1.DiffEditorInput(editor.getName(), editor.getDescription(), originalOverride || editor.originalInput, modifiedOverride || editor.modifiedInput, true);
                        return this.editorService.openEditor(input, Object.assign(Object.assign({}, options), { override: false }), group);
                    })(),
                };
            }
            return undefined;
        }
    };
    CustomEditorContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, customEditor_1.ICustomEditorService)
    ], CustomEditorContribution);
    exports.CustomEditorContribution = CustomEditorContribution;
    function isMatchingCustomEditor(editor, viewType, resource) {
        return editor instanceof customEditorInput_1.CustomEditorInput
            && editor.viewType === viewType
            && resources_1.isEqual(editor.resource, resource);
    }
    themeService_1.registerThemingParticipant((theme, collector) => {
        const shadow = theme.getColor(colorRegistry.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.webview.modified { box-shadow: -6px 0 5px -5px ${shadow}; }`);
        }
    });
});
//# __sourceMappingURL=customEditors.js.map