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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/workbench/common/editor", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/parts/editor/editorActions", "vs/workbench/browser/actions/layoutActions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/list/browser/listService", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/workbench/contrib/files/browser/fileCommands", "vs/workbench/common/resources", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/browser/dnd", "vs/base/common/decorators", "vs/base/browser/ui/list/listView", "vs/base/common/types", "vs/base/common/platform", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/css!./media/openeditors"], function (require, exports, nls, async_1, actions_1, dom, contextView_1, instantiation_1, editorGroupsService_1, configuration_1, keybinding_1, editor_1, fileActions_1, files_1, editorActions_1, layoutActions_1, contextkey_1, styler_1, themeService_1, colorRegistry_1, listService_1, labels_1, actionbar_1, telemetry_1, editorService_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, fileCommands_1, resources_1, dnd_1, viewPaneContainer_1, dnd_2, decorators_1, listView_1, types_1, platform_1, workingCopyService_1, filesConfigurationService_1, views_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditorsView = void 0;
    const $ = dom.$;
    let OpenEditorsView = class OpenEditorsView extends viewPaneContainer_1.ViewPane {
        constructor(options, instantiationService, viewDescriptorService, contextMenuService, editorService, editorGroupService, configurationService, keybindingService, contextKeyService, themeService, telemetryService, menuService, workingCopyService, filesConfigurationService, openerService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.menuService = menuService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.needsRefresh = false;
            this.structuralRefreshDelay = 0;
            this.listRefreshScheduler = new async_1.RunOnceScheduler(() => {
                const previousLength = this.list.length;
                this.list.splice(0, this.list.length, this.elements);
                this.focusActiveEditor();
                if (previousLength !== this.list.length) {
                    this.updateSize();
                }
                this.needsRefresh = false;
            }, this.structuralRefreshDelay);
            this.registerUpdateEvents();
            // Also handle configuration updates
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e)));
            // Handle dirty counter
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.updateDirtyIndicator(workingCopy)));
        }
        registerUpdateEvents() {
            const updateWholeList = () => {
                if (!this.isBodyVisible() || !this.list) {
                    this.needsRefresh = true;
                    return;
                }
                this.listRefreshScheduler.schedule(this.structuralRefreshDelay);
            };
            const groupDisposables = new Map();
            const addGroupListener = (group) => {
                groupDisposables.set(group.id, group.onDidGroupChange(e => {
                    if (this.listRefreshScheduler.isScheduled()) {
                        return;
                    }
                    if (!this.isBodyVisible() || !this.list) {
                        this.needsRefresh = true;
                        return;
                    }
                    const index = this.getIndex(group, e.editor);
                    switch (e.kind) {
                        case 1 /* GROUP_INDEX */: {
                            if (this.showGroups) {
                                this.list.splice(index, 1, [group]);
                            }
                            break;
                        }
                        case 0 /* GROUP_ACTIVE */:
                        case 5 /* EDITOR_ACTIVE */: {
                            this.focusActiveEditor();
                            break;
                        }
                        case 9 /* EDITOR_DIRTY */:
                        case 6 /* EDITOR_LABEL */:
                        case 7 /* EDITOR_PIN */: {
                            this.list.splice(index, 1, [new files_1.OpenEditor(e.editor, group)]);
                            break;
                        }
                        case 2 /* EDITOR_OPEN */: {
                            this.list.splice(index, 0, [new files_1.OpenEditor(e.editor, group)]);
                            setTimeout(() => this.updateSize(), this.structuralRefreshDelay);
                            break;
                        }
                        case 3 /* EDITOR_CLOSE */: {
                            const previousIndex = this.getIndex(group, undefined) + (e.editorIndex || 0) + (this.showGroups ? 1 : 0);
                            this.list.splice(previousIndex, 1);
                            this.updateSize();
                            break;
                        }
                        case 4 /* EDITOR_MOVE */: {
                            this.listRefreshScheduler.schedule();
                            break;
                        }
                    }
                }));
                this._register(groupDisposables.get(group.id));
            };
            this.editorGroupService.groups.forEach(g => addGroupListener(g));
            this._register(this.editorGroupService.onDidAddGroup(group => {
                addGroupListener(group);
                updateWholeList();
            }));
            this._register(this.editorGroupService.onDidMoveGroup(() => updateWholeList()));
            this._register(this.editorGroupService.onDidRemoveGroup(group => {
                lifecycle_1.dispose(groupDisposables.get(group.id));
                updateWholeList();
            }));
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.title);
            const count = dom.append(container, $('.count'));
            this.dirtyCountElement = dom.append(count, $('.dirty-count.monaco-count-badge.long'));
            this._register((styler_1.attachStylerCallback(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, badgeForeground: colorRegistry_1.badgeForeground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const foreground = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                this.dirtyCountElement.style.backgroundColor = background;
                this.dirtyCountElement.style.color = foreground;
                this.dirtyCountElement.style.borderWidth = border ? '1px' : '';
                this.dirtyCountElement.style.borderStyle = border ? 'solid' : '';
                this.dirtyCountElement.style.borderColor = border;
            })));
            this.updateDirtyIndicator();
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(container, 'open-editors');
            dom.addClass(container, 'show-file-icons');
            const delegate = new OpenEditorsDelegate();
            if (this.list) {
                this.list.dispose();
            }
            if (this.listLabels) {
                this.listLabels.clear();
            }
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'OpenEditors', container, delegate, [
                new EditorGroupRenderer(this.keybindingService, this.instantiationService),
                new OpenEditorRenderer(this.listLabels, this.instantiationService, this.keybindingService, this.configurationService)
            ], {
                identityProvider: { getId: (element) => element instanceof files_1.OpenEditor ? element.getId() : element.id.toString() },
                dnd: new OpenEditorsDragAndDrop(this.instantiationService, this.editorGroupService),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                accessibilityProvider: new OpenEditorsAccessibilityProvider()
            });
            this._register(this.list);
            this._register(this.listLabels);
            this.contributedContextMenu = this.menuService.createMenu(actions_2.MenuId.OpenEditorsContext, this.list.contextKeyService);
            this._register(this.contributedContextMenu);
            this.updateSize();
            // Bind context keys
            files_1.OpenEditorsFocusedContext.bindTo(this.list.contextKeyService);
            files_1.ExplorerFocusedContext.bindTo(this.list.contextKeyService);
            this.resourceContext = this.instantiationService.createInstance(resources_1.ResourceContextKey);
            this._register(this.resourceContext);
            this.groupFocusedContext = fileCommands_1.OpenEditorsGroupContext.bindTo(this.contextKeyService);
            this.dirtyEditorFocusedContext = fileCommands_1.DirtyEditorContext.bindTo(this.contextKeyService);
            this.readonlyEditorFocusedContext = fileCommands_1.ReadonlyEditorContext.bindTo(this.contextKeyService);
            this._register(this.list.onContextMenu(e => this.onListContextMenu(e)));
            this.list.onDidChangeFocus(e => {
                this.resourceContext.reset();
                this.groupFocusedContext.reset();
                this.dirtyEditorFocusedContext.reset();
                this.readonlyEditorFocusedContext.reset();
                const element = e.elements.length ? e.elements[0] : undefined;
                if (element instanceof files_1.OpenEditor) {
                    const resource = element.getResource();
                    this.dirtyEditorFocusedContext.set(element.editor.isDirty() && !element.editor.isSaving());
                    this.readonlyEditorFocusedContext.set(element.editor.isReadonly());
                    this.resourceContext.set(types_1.withUndefinedAsNull(resource));
                }
                else if (!!element) {
                    this.groupFocusedContext.set(true);
                }
            });
            // Open when selecting via keyboard
            this._register(this.list.onMouseMiddleClick(e => {
                if (e && e.element instanceof files_1.OpenEditor) {
                    e.element.group.closeEditor(e.element.editor, { preserveFocus: true });
                }
            }));
            const resourceNavigator = this._register(new listService_1.ListResourceNavigator(this.list, { configurationService: this.configurationService }));
            this._register(resourceNavigator.onDidOpen(e => {
                if (!e.element) {
                    return;
                }
                const element = this.list.element(e.element);
                if (element instanceof files_1.OpenEditor) {
                    if (e.browserEvent instanceof MouseEvent && e.browserEvent.button === 1) {
                        return; // middle click already handled above: closes the editor
                    }
                    this.openEditor(element, { preserveFocus: e.editorOptions.preserveFocus, pinned: e.editorOptions.pinned, sideBySide: e.sideBySide });
                }
                else {
                    this.editorGroupService.activateGroup(element);
                }
            }));
            this.listRefreshScheduler.schedule(0);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.listRefreshScheduler.schedule(0);
                }
            }));
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            this._register(containerModel.onDidChangeAllViewDescriptors(() => {
                this.updateSize();
            }));
        }
        getActions() {
            return [
                this.instantiationService.createInstance(layoutActions_1.ToggleEditorLayoutAction, layoutActions_1.ToggleEditorLayoutAction.ID, layoutActions_1.ToggleEditorLayoutAction.LABEL),
                this.instantiationService.createInstance(fileActions_1.SaveAllAction, fileActions_1.SaveAllAction.ID, fileActions_1.SaveAllAction.LABEL),
                this.instantiationService.createInstance(editorActions_1.CloseAllEditorsAction, editorActions_1.CloseAllEditorsAction.ID, editorActions_1.CloseAllEditorsAction.LABEL)
            ];
        }
        focus() {
            super.focus();
            this.list.domFocus();
        }
        getList() {
            return this.list;
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            if (this.list) {
                this.list.layout(height, width);
            }
        }
        get showGroups() {
            return this.editorGroupService.groups.length > 1;
        }
        get elements() {
            const result = [];
            this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */).forEach(g => {
                if (this.showGroups) {
                    result.push(g);
                }
                result.push(...g.editors.map(ei => new files_1.OpenEditor(ei, g)));
            });
            return result;
        }
        getIndex(group, editor) {
            let index = editor ? group.getIndexOfEditor(editor) : 0;
            if (!this.showGroups) {
                return index;
            }
            for (let g of this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */)) {
                if (g.id === group.id) {
                    return index + (!!editor ? 1 : 0);
                }
                else {
                    index += g.count + 1;
                }
            }
            return -1;
        }
        openEditor(element, options) {
            if (element) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'workbench.files.openFile', from: 'openEditors' });
                const preserveActivateGroup = options.sideBySide && options.preserveFocus; // needed for https://github.com/Microsoft/vscode/issues/42399
                if (!preserveActivateGroup) {
                    this.editorGroupService.activateGroup(element.group); // needed for https://github.com/Microsoft/vscode/issues/6672
                }
                this.editorService.openEditor(element.editor, options, options.sideBySide ? editorService_1.SIDE_GROUP : element.group);
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            const actions = [];
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contributedContextMenu, { shouldForwardArgs: true, arg: element instanceof files_1.OpenEditor ? element.editor.resource : {} }, actions, this.contextMenuService);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element instanceof files_1.OpenEditor ? { groupId: element.groupId, editorIndex: element.editorIndex } : { groupId: element.id },
                onHide: () => lifecycle_1.dispose(actionsDisposable)
            });
        }
        focusActiveEditor() {
            if (this.list.length && this.editorGroupService.activeGroup) {
                const index = this.getIndex(this.editorGroupService.activeGroup, this.editorGroupService.activeGroup.activeEditor);
                if (index >= 0) {
                    this.list.setFocus([index]);
                    this.list.setSelection([index]);
                    this.list.reveal(index);
                    return;
                }
            }
            this.list.setFocus([]);
            this.list.setSelection([]);
        }
        onConfigurationChange(event) {
            if (event.affectsConfiguration('explorer.openEditors')) {
                this.updateSize();
            }
            // Trigger a 'repaint' when decoration settings change
            if (event.affectsConfiguration('explorer.decorations')) {
                this.listRefreshScheduler.schedule();
            }
        }
        updateSize() {
            // Adjust expanded body size
            this.minimumBodySize = this.orientation === 0 /* VERTICAL */ ? this.getMinExpandedBodySize() : 170;
            this.maximumBodySize = this.orientation === 0 /* VERTICAL */ ? this.getMaxExpandedBodySize() : Number.POSITIVE_INFINITY;
        }
        updateDirtyIndicator(workingCopy) {
            if (workingCopy) {
                const gotDirty = workingCopy.isDirty();
                if (gotDirty && !(workingCopy.capabilities & 2 /* Untitled */) && this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                    return; // do not indicate dirty of working copies that are auto saved after short delay
                }
            }
            let dirty = this.workingCopyService.dirtyCount;
            if (dirty === 0) {
                dom.addClass(this.dirtyCountElement, 'hidden');
            }
            else {
                this.dirtyCountElement.textContent = nls.localize('dirtyCounter', "{0} unsaved", dirty);
                dom.removeClass(this.dirtyCountElement, 'hidden');
            }
        }
        get elementCount() {
            return this.editorGroupService.groups.map(g => g.count)
                .reduce((first, second) => first + second, this.showGroups ? this.editorGroupService.groups.length : 0);
        }
        getMaxExpandedBodySize() {
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            if (containerModel.visibleViewDescriptors.length <= 1) {
                return Number.POSITIVE_INFINITY;
            }
            return this.elementCount * OpenEditorsDelegate.ITEM_HEIGHT;
        }
        getMinExpandedBodySize() {
            let visibleOpenEditors = this.configurationService.getValue('explorer.openEditors.visible');
            if (typeof visibleOpenEditors !== 'number') {
                visibleOpenEditors = OpenEditorsView.DEFAULT_VISIBLE_OPEN_EDITORS;
            }
            return this.computeMinExpandedBodySize(visibleOpenEditors);
        }
        computeMinExpandedBodySize(visibleOpenEditors = OpenEditorsView.DEFAULT_VISIBLE_OPEN_EDITORS) {
            const itemsToShow = Math.min(Math.max(visibleOpenEditors, 1), this.elementCount);
            return itemsToShow * OpenEditorsDelegate.ITEM_HEIGHT;
        }
        setStructuralRefreshDelay(delay) {
            this.structuralRefreshDelay = delay;
        }
        getOptimalWidth() {
            let parentNode = this.list.getHTMLElement();
            let childNodes = [].slice.call(parentNode.querySelectorAll('.open-editor > a'));
            return dom.getLargestChildWidth(parentNode, childNodes);
        }
    };
    OpenEditorsView.DEFAULT_VISIBLE_OPEN_EDITORS = 9;
    OpenEditorsView.ID = 'workbench.explorer.openEditorsView';
    OpenEditorsView.NAME = nls.localize({ key: 'openEditors', comment: ['Open is an adjective'] }, "Open Editors");
    OpenEditorsView = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, actions_2.IMenuService),
        __param(12, workingCopyService_1.IWorkingCopyService),
        __param(13, filesConfigurationService_1.IFilesConfigurationService),
        __param(14, opener_1.IOpenerService)
    ], OpenEditorsView);
    exports.OpenEditorsView = OpenEditorsView;
    class OpenEditorActionRunner extends actions_1.ActionRunner {
        async run(action) {
            if (!this.editor) {
                return;
            }
            return super.run(action, { groupId: this.editor.groupId, editorIndex: this.editor.editorIndex });
        }
    }
    class OpenEditorsDelegate {
        getHeight(_element) {
            return OpenEditorsDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            if (element instanceof files_1.OpenEditor) {
                return OpenEditorRenderer.ID;
            }
            return EditorGroupRenderer.ID;
        }
    }
    OpenEditorsDelegate.ITEM_HEIGHT = 22;
    class EditorGroupRenderer {
        constructor(keybindingService, instantiationService) {
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            // noop
        }
        get templateId() {
            return EditorGroupRenderer.ID;
        }
        renderTemplate(container) {
            const editorGroupTemplate = Object.create(null);
            editorGroupTemplate.root = dom.append(container, $('.editor-group'));
            editorGroupTemplate.name = dom.append(editorGroupTemplate.root, $('span.name'));
            editorGroupTemplate.actionBar = new actionbar_1.ActionBar(container);
            const saveAllInGroupAction = this.instantiationService.createInstance(fileActions_1.SaveAllInGroupAction, fileActions_1.SaveAllInGroupAction.ID, fileActions_1.SaveAllInGroupAction.LABEL);
            const saveAllInGroupKey = this.keybindingService.lookupKeybinding(saveAllInGroupAction.id);
            editorGroupTemplate.actionBar.push(saveAllInGroupAction, { icon: true, label: false, keybinding: saveAllInGroupKey ? saveAllInGroupKey.getLabel() : undefined });
            const closeGroupAction = this.instantiationService.createInstance(fileActions_1.CloseGroupAction, fileActions_1.CloseGroupAction.ID, fileActions_1.CloseGroupAction.LABEL);
            const closeGroupActionKey = this.keybindingService.lookupKeybinding(closeGroupAction.id);
            editorGroupTemplate.actionBar.push(closeGroupAction, { icon: true, label: false, keybinding: closeGroupActionKey ? closeGroupActionKey.getLabel() : undefined });
            return editorGroupTemplate;
        }
        renderElement(editorGroup, _index, templateData) {
            templateData.editorGroup = editorGroup;
            templateData.name.textContent = editorGroup.label;
            templateData.actionBar.context = { groupId: editorGroup.id };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    }
    EditorGroupRenderer.ID = 'editorgroup';
    class OpenEditorRenderer {
        constructor(labels, instantiationService, keybindingService, configurationService) {
            this.labels = labels;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            // noop
        }
        get templateId() {
            return OpenEditorRenderer.ID;
        }
        renderTemplate(container) {
            const editorTemplate = Object.create(null);
            editorTemplate.container = container;
            editorTemplate.actionRunner = new OpenEditorActionRunner();
            editorTemplate.actionBar = new actionbar_1.ActionBar(container, { actionRunner: editorTemplate.actionRunner });
            const closeEditorAction = this.instantiationService.createInstance(editorActions_1.CloseEditorAction, editorActions_1.CloseEditorAction.ID, editorActions_1.CloseEditorAction.LABEL);
            const key = this.keybindingService.lookupKeybinding(closeEditorAction.id);
            editorTemplate.actionBar.push(closeEditorAction, { icon: true, label: false, keybinding: key ? key.getLabel() : undefined });
            editorTemplate.root = this.labels.create(container);
            return editorTemplate;
        }
        renderElement(openedEditor, _index, templateData) {
            const editor = openedEditor.editor;
            templateData.actionRunner.editor = openedEditor;
            editor.isDirty() && !editor.isSaving() ? dom.addClass(templateData.container, 'dirty') : dom.removeClass(templateData.container, 'dirty');
            templateData.root.setResource({
                resource: editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                name: editor.getName(),
                description: editor.getDescription(1 /* MEDIUM */)
            }, {
                italic: openedEditor.isPreview(),
                extraClasses: ['open-editor'],
                fileDecorations: this.configurationService.getValue().explorer.decorations,
                title: editor.getTitle(2 /* LONG */)
            });
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
            templateData.root.dispose();
            templateData.actionRunner.dispose();
        }
    }
    OpenEditorRenderer.ID = 'openeditor';
    class OpenEditorsDragAndDrop {
        constructor(instantiationService, editorGroupService) {
            this.instantiationService = instantiationService;
            this.editorGroupService = editorGroupService;
        }
        get dropHandler() {
            return this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: false });
        }
        getDragURI(element) {
            if (element instanceof files_1.OpenEditor) {
                const resource = element.getResource();
                if (resource) {
                    return resource.toString();
                }
            }
            return null;
        }
        getDragLabel(elements) {
            if (elements.length > 1) {
                return String(elements.length);
            }
            const element = elements[0];
            return element instanceof files_1.OpenEditor ? element.editor.getName() : element.label;
        }
        onDragStart(data, originalEvent) {
            const items = data.elements;
            const resources = [];
            if (items) {
                items.forEach(i => {
                    if (i instanceof files_1.OpenEditor) {
                        const resource = i.getResource();
                        if (resource) {
                            resources.push(resource);
                        }
                    }
                });
            }
            if (resources.length) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(dnd_1.fillResourceDataTransfers, resources, undefined, originalEvent);
            }
        }
        onDragOver(data, _targetElement, _targetIndex, originalEvent) {
            if (data instanceof listView_1.DesktopDragAndDropData) {
                if (platform_1.isWeb) {
                    return false; // dropping files into editor is unsupported on web
                }
                return dnd_1.containsDragType(originalEvent, dnd_2.DataTransfers.FILES, dnd_1.CodeDataTransfers.FILES);
            }
            return true;
        }
        drop(data, targetElement, _targetIndex, originalEvent) {
            const group = targetElement instanceof files_1.OpenEditor ? targetElement.group : targetElement;
            const index = targetElement instanceof files_1.OpenEditor ? targetElement.editorIndex : 0;
            if (data instanceof listView_1.ElementsDragAndDropData) {
                const elementsData = data.elements;
                elementsData.forEach((oe, offset) => {
                    oe.group.moveEditor(oe.editor, group, { index: index + offset, preserveFocus: true });
                });
                this.editorGroupService.activateGroup(group);
            }
            else {
                this.dropHandler.handleDrop(originalEvent, () => group, () => group.focus(), index);
            }
        }
    }
    __decorate([
        decorators_1.memoize
    ], OpenEditorsDragAndDrop.prototype, "dropHandler", null);
    class OpenEditorsAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('openEditors', "Open Editors");
        }
        getAriaLabel(element) {
            if (element instanceof files_1.OpenEditor) {
                return `${element.editor.getName()}, ${element.editor.getDescription()}`;
            }
            return element.ariaLabel;
        }
    }
});
//# __sourceMappingURL=openEditorsView.js.map