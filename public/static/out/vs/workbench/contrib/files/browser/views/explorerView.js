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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/decorators", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/base/browser/dom", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/files/browser/views/explorerDecorationsProvider", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/resources", "vs/workbench/services/decorations/browser/decorations", "vs/platform/list/browser/listService", "vs/base/browser/dnd", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/label/common/label", "vs/workbench/contrib/files/browser/views/explorerViewer", "vs/platform/theme/common/themeService", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/files/common/explorerModel", "vs/workbench/browser/labels", "vs/platform/storage/common/storage", "vs/platform/clipboard/common/clipboardService", "vs/base/common/types", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/workbench/services/uriIdentity/common/uriIdentity"], function (require, exports, nls, perf, decorators_1, files_1, fileActions_1, editor_1, diffEditorInput_1, DOM, layoutService_1, explorerDecorationsProvider_1, workspace_1, configuration_1, keybinding_1, instantiation_1, progress_1, contextView_1, contextkey_1, resources_1, decorations_1, listService_1, dnd_1, editorService_1, viewPaneContainer_1, label_1, explorerViewer_1, themeService_1, actions_1, menuEntryActionViewItem_1, telemetry_1, explorerModel_1, labels_1, storage_1, clipboardService_1, types_1, files_2, lifecycle_1, event_1, styler_1, colorRegistry_1, theme_1, views_1, opener_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerView = exports.getContext = void 0;
    function hasExpandedRootChild(tree, treeInput) {
        for (const folder of treeInput) {
            if (tree.hasNode(folder) && !tree.isCollapsed(folder)) {
                for (const [, child] of folder.children.entries()) {
                    if (tree.hasNode(child) && !tree.isCollapsed(child)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    function getContext(focus, selection, respectMultiSelection, compressedNavigationControllerProvider) {
        let focusedStat;
        focusedStat = focus.length ? focus[0] : undefined;
        const compressedNavigationController = focusedStat && compressedNavigationControllerProvider.getCompressedNavigationController(focusedStat);
        focusedStat = compressedNavigationController ? compressedNavigationController.current : focusedStat;
        const selectedStats = [];
        for (const stat of selection) {
            const controller = compressedNavigationControllerProvider.getCompressedNavigationController(stat);
            if (controller && focusedStat && controller === compressedNavigationController) {
                if (stat === focusedStat) {
                    selectedStats.push(stat);
                }
                // Ignore stats which are selected but are part of the same compact node as the focused stat
                continue;
            }
            if (controller) {
                selectedStats.push(...controller.items);
            }
            else {
                selectedStats.push(stat);
            }
        }
        if (!focusedStat) {
            if (respectMultiSelection) {
                return selectedStats;
            }
            else {
                return [];
            }
        }
        if (respectMultiSelection && selectedStats.indexOf(focusedStat) >= 0) {
            return selectedStats;
        }
        return [focusedStat];
    }
    exports.getContext = getContext;
    let ExplorerView = class ExplorerView extends viewPaneContainer_1.ViewPane {
        constructor(options, contextMenuService, viewDescriptorService, instantiationService, contextService, progressService, editorService, layoutService, keybindingService, contextKeyService, configurationService, decorationService, labelService, themeService, menuService, telemetryService, explorerService, storageService, clipboardService, fileService, uriIdentityService, openerService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.contextService = contextService;
            this.progressService = progressService;
            this.editorService = editorService;
            this.layoutService = layoutService;
            this.decorationService = decorationService;
            this.labelService = labelService;
            this.themeService = themeService;
            this.menuService = menuService;
            this.explorerService = explorerService;
            this.storageService = storageService;
            this.clipboardService = clipboardService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            // Refresh is needed on the initial explorer open
            this.shouldRefresh = true;
            this.autoReveal = false;
            this.resourceContext = instantiationService.createInstance(resources_1.ResourceContextKey);
            this._register(this.resourceContext);
            this.folderContext = files_1.ExplorerFolderContext.bindTo(contextKeyService);
            this.readonlyContext = files_1.ExplorerResourceReadonlyContext.bindTo(contextKeyService);
            this.availableEditorIdsContext = files_1.ExplorerResourceAvailableEditorIdsContext.bindTo(contextKeyService);
            this.rootContext = files_1.ExplorerRootContext.bindTo(contextKeyService);
            this.resourceMoveableToTrash = files_1.ExplorerResourceMoveableToTrash.bindTo(contextKeyService);
            this.compressedFocusContext = files_1.ExplorerCompressedFocusContext.bindTo(contextKeyService);
            this.compressedFocusFirstContext = files_1.ExplorerCompressedFirstFocusContext.bindTo(contextKeyService);
            this.compressedFocusLastContext = files_1.ExplorerCompressedLastFocusContext.bindTo(contextKeyService);
            this.explorerService.registerView(this);
        }
        get name() {
            return this.labelService.getWorkspaceLabel(this.contextService.getWorkspace());
        }
        get title() {
            return this.name;
        }
        set title(_) {
            // noop
        }
        // Memoized locals
        get contributedContextMenu() {
            const contributedContextMenu = this.menuService.createMenu(actions_1.MenuId.ExplorerContext, this.tree.contextKeyService);
            this._register(contributedContextMenu);
            return contributedContextMenu;
        }
        get fileCopiedContextKey() {
            return fileActions_1.FileCopiedContext.bindTo(this.contextKeyService);
        }
        get resourceCutContextKey() {
            return files_1.ExplorerResourceCut.bindTo(this.contextKeyService);
        }
        // Split view methods
        renderHeader(container) {
            super.renderHeader(container);
            // Expand on drag over
            this.dragHandler = new dnd_1.DelayedDragHandler(container, () => this.setExpanded(true));
            const titleElement = container.querySelector('.title');
            const setHeader = () => {
                const workspace = this.contextService.getWorkspace();
                const title = workspace.folders.map(folder => folder.name).join();
                titleElement.textContent = this.name;
                titleElement.title = title;
                titleElement.setAttribute('aria-label', nls.localize('explorerSection', "Explorer Section: {0}", this.name));
            };
            this._register(this.contextService.onDidChangeWorkspaceName(setHeader));
            this._register(this.labelService.onDidChangeFormatters(setHeader));
            setHeader();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        renderBody(container) {
            super.renderBody(container);
            this.treeContainer = DOM.append(container, DOM.$('.explorer-folders-view'));
            this.styleElement = DOM.createStyleSheet(this.treeContainer);
            styler_1.attachStyler(this.themeService, { listDropBackground: colorRegistry_1.listDropBackground }, this.styleListDropBackground.bind(this));
            this.createTree(this.treeContainer);
            this._register(this.labelService.onDidChangeFormatters(() => {
                this._onDidChangeTitleArea.fire();
            }));
            // Update configuration
            const configuration = this.configurationService.getValue();
            this.onConfigurationUpdated(configuration);
            // When the explorer viewer is loaded, listen to changes to the editor input
            this._register(this.editorService.onDidActiveEditorChange(() => {
                this.selectActiveFile(true);
            }));
            // Also handle configuration updates
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue(), e)));
            this._register(this.onDidChangeBodyVisibility(async (visible) => {
                if (visible) {
                    // If a refresh was requested and we are now visible, run it
                    if (this.shouldRefresh) {
                        this.shouldRefresh = false;
                        await this.setTreeInput();
                    }
                    // Find resource to focus from active editor input if set
                    this.selectActiveFile(false, true);
                }
            }));
        }
        getActions() {
            if (!this.actions) {
                this.actions = [
                    this.instantiationService.createInstance(fileActions_1.NewFileAction),
                    this.instantiationService.createInstance(fileActions_1.NewFolderAction),
                    this.instantiationService.createInstance(fileActions_1.RefreshExplorerView, fileActions_1.RefreshExplorerView.ID, fileActions_1.RefreshExplorerView.LABEL),
                    this.instantiationService.createInstance(fileActions_1.CollapseExplorerView, fileActions_1.CollapseExplorerView.ID, fileActions_1.CollapseExplorerView.LABEL)
                ];
                this.actions.forEach(a => this._register(a));
            }
            return this.actions;
        }
        focus() {
            this.tree.domFocus();
            const focused = this.tree.getFocus();
            if (focused.length === 1 && this.autoReveal) {
                this.tree.reveal(focused[0], 0.5);
            }
        }
        getContext(respectMultiSelection) {
            return getContext(this.tree.getFocus(), this.tree.getSelection(), respectMultiSelection, this.renderer);
        }
        async setEditable(stat, isEditing) {
            if (isEditing) {
                this.horizontalScrolling = this.tree.options.horizontalScrolling;
                if (this.horizontalScrolling) {
                    this.tree.updateOptions({ horizontalScrolling: false });
                }
                await this.tree.expand(stat.parent);
            }
            else {
                if (this.horizontalScrolling !== undefined) {
                    this.tree.updateOptions({ horizontalScrolling: this.horizontalScrolling });
                }
                this.horizontalScrolling = undefined;
                DOM.removeClass(this.treeContainer, 'highlight');
            }
            await this.refresh(false, stat.parent, false);
            if (isEditing) {
                DOM.addClass(this.treeContainer, 'highlight');
                this.tree.reveal(stat);
            }
            else {
                this.tree.domFocus();
            }
        }
        selectActiveFile(deselect, reveal = this.autoReveal) {
            if (this.autoReveal) {
                const activeFile = this.getActiveFile();
                if (activeFile) {
                    const focus = this.tree.getFocus();
                    if (focus.length === 1 && focus[0].resource.toString() === activeFile.toString()) {
                        // No action needed, active file is already focused
                        return;
                    }
                    this.explorerService.select(activeFile, reveal);
                }
                else if (deselect) {
                    this.tree.setSelection([]);
                    this.tree.setFocus([]);
                }
            }
        }
        createTree(container) {
            this.filter = this.instantiationService.createInstance(explorerViewer_1.FilesFilter);
            this._register(this.filter);
            this._register(this.filter.onDidChange(() => this.refresh(true)));
            const explorerLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(explorerLabels);
            const updateWidth = (stat) => this.tree.updateWidth(stat);
            this.renderer = this.instantiationService.createInstance(explorerViewer_1.FilesRenderer, explorerLabels, updateWidth);
            this._register(this.renderer);
            this._register(createFileIconThemableTreeContainerScope(container, this.themeService));
            const isCompressionEnabled = () => this.configurationService.getValue('explorer.compactFolders');
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'FileExplorer', container, new explorerViewer_1.ExplorerDelegate(), new explorerViewer_1.ExplorerCompressionDelegate(), [this.renderer], this.instantiationService.createInstance(explorerViewer_1.ExplorerDataSource), {
                compressionEnabled: isCompressionEnabled(),
                accessibilityProvider: this.renderer,
                identityProvider: {
                    getId: (stat) => {
                        if (stat instanceof explorerModel_1.NewExplorerItem) {
                            return `new:${stat.resource}`;
                        }
                        return stat.resource;
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (stat) => {
                        if (this.explorerService.isEditable(stat)) {
                            return undefined;
                        }
                        return stat.name;
                    },
                    getCompressedNodeKeyboardNavigationLabel: (stats) => {
                        if (stats.some(stat => this.explorerService.isEditable(stat))) {
                            return undefined;
                        }
                        return stats.map(stat => stat.name).join('/');
                    }
                },
                multipleSelectionSupport: true,
                filter: this.filter,
                sorter: this.instantiationService.createInstance(explorerViewer_1.FileSorter),
                dnd: this.instantiationService.createInstance(explorerViewer_1.FileDragAndDrop),
                autoExpandSingleChildren: true,
                additionalScrollHeight: explorerViewer_1.ExplorerDelegate.ITEM_HEIGHT,
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                }
            });
            this._register(this.tree);
            // Bind configuration
            const onDidChangeCompressionConfiguration = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('explorer.compactFolders'));
            this._register(onDidChangeCompressionConfiguration(_ => this.tree.updateOptions({ compressionEnabled: isCompressionEnabled() })));
            // Bind context keys
            files_1.FilesExplorerFocusedContext.bindTo(this.tree.contextKeyService);
            files_1.ExplorerFocusedContext.bindTo(this.tree.contextKeyService);
            // Update resource context based on focused element
            this._register(this.tree.onDidChangeFocus(e => this.onFocusChanged(e.elements)));
            this.onFocusChanged([]);
            // Open when selecting via keyboard
            this._register(this.tree.onDidOpen(async (e) => {
                const element = e.element;
                if (!element) {
                    return;
                }
                // Do not react if the user is expanding selection via keyboard.
                // Check if the item was previously also selected, if yes the user is simply expanding / collapsing current selection #66589.
                const shiftDown = e.browserEvent instanceof KeyboardEvent && e.browserEvent.shiftKey;
                if (!shiftDown) {
                    if (element.isDirectory || this.explorerService.isEditable(undefined)) {
                        // Do not react if user is clicking on explorer items while some are being edited #70276
                        // Do not react if clicking on directories
                        return;
                    }
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'workbench.files.openFile', from: 'explorer' });
                    await this.editorService.openEditor({ resource: element.resource, options: { preserveFocus: e.editorOptions.preserveFocus, pinned: e.editorOptions.pinned } }, e.sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onDidScroll(async (e) => {
                let editable = this.explorerService.getEditable();
                if (e.scrollTopChanged && editable && this.tree.getRelativeTop(editable.stat) === null) {
                    await editable.data.onFinish('', false);
                }
            }));
            this._register(this.tree.onDidChangeCollapseState(e => {
                var _a;
                const element = (_a = e.node.element) === null || _a === void 0 ? void 0 : _a.element;
                if (element) {
                    const navigationController = this.renderer.getCompressedNavigationController(element instanceof Array ? element[0] : element);
                    if (navigationController) {
                        navigationController.updateCollapsed(e.node.collapsed);
                    }
                }
            }));
            // save view state
            this._register(this.storageService.onWillSaveState(() => {
                this.storageService.store(ExplorerView.TREE_VIEW_STATE_STORAGE_KEY, JSON.stringify(this.tree.getViewState()), 1 /* WORKSPACE */);
            }));
        }
        // React on events
        onConfigurationUpdated(configuration, event) {
            var _a;
            this.autoReveal = (_a = configuration === null || configuration === void 0 ? void 0 : configuration.explorer) === null || _a === void 0 ? void 0 : _a.autoReveal;
            // Push down config updates to components of viewer
            if (event && (event.affectsConfiguration('explorer.decorations.colors') || event.affectsConfiguration('explorer.decorations.badges'))) {
                this.refresh(true);
            }
        }
        setContextKeys(stat) {
            const isSingleFolder = this.contextService.getWorkbenchState() === 2 /* FOLDER */;
            const resource = stat ? stat.resource : isSingleFolder ? this.contextService.getWorkspace().folders[0].uri : null;
            this.resourceContext.set(resource);
            this.folderContext.set((isSingleFolder && !stat) || !!stat && stat.isDirectory);
            this.readonlyContext.set(!!stat && stat.isReadonly);
            this.rootContext.set(!stat || (stat && stat.isRoot));
            if (resource) {
                const overrides = resource ? this.editorService.getEditorOverrides(resource, undefined, undefined) : [];
                this.availableEditorIdsContext.set(overrides.map(([, entry]) => entry.id).join(','));
            }
            else {
                this.availableEditorIdsContext.reset();
            }
        }
        async onContextMenu(e) {
            const disposables = new lifecycle_1.DisposableStore();
            let stat = e.element;
            let anchor = e.anchor;
            // Compressed folders
            if (stat) {
                const controller = this.renderer.getCompressedNavigationController(stat);
                if (controller) {
                    if (e.browserEvent instanceof KeyboardEvent || explorerViewer_1.isCompressedFolderName(e.browserEvent.target)) {
                        anchor = controller.labels[controller.index];
                    }
                    else {
                        controller.last();
                    }
                }
            }
            // update dynamic contexts
            this.fileCopiedContextKey.set(await this.clipboardService.hasResources());
            this.setContextKeys(stat);
            const selection = this.tree.getSelection();
            const actions = [];
            const roots = this.explorerService.roots; // If the click is outside of the elements pass the root resource if there is only one root. If there are multiple roots pass empty object.
            let arg;
            if (stat instanceof explorerModel_1.ExplorerItem) {
                const compressedController = this.renderer.getCompressedNavigationController(stat);
                arg = compressedController ? compressedController.current.resource : stat.resource;
            }
            else {
                arg = roots.length === 1 ? roots[0].resource : {};
            }
            disposables.add(menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contributedContextMenu, { arg, shouldForwardArgs: true }, actions, this.contextMenuService));
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                    disposables.dispose();
                },
                getActionsContext: () => stat && selection && selection.indexOf(stat) >= 0
                    ? selection.map((fs) => fs.resource)
                    : stat instanceof explorerModel_1.ExplorerItem ? [stat.resource] : []
            });
        }
        onFocusChanged(elements) {
            const stat = elements && elements.length ? elements[0] : undefined;
            this.setContextKeys(stat);
            if (stat) {
                const enableTrash = this.configurationService.getValue().files.enableTrash;
                const hasCapability = this.fileService.hasCapability(stat.resource, 4096 /* Trash */);
                this.resourceMoveableToTrash.set(enableTrash && hasCapability);
            }
            else {
                this.resourceMoveableToTrash.reset();
            }
            const compressedNavigationController = stat && this.renderer.getCompressedNavigationController(stat);
            if (!compressedNavigationController) {
                this.compressedFocusContext.set(false);
                return;
            }
            this.compressedFocusContext.set(true);
            this.updateCompressedNavigationContextKeys(compressedNavigationController);
        }
        // General methods
        /**
         * Refresh the contents of the explorer to get up to date data from the disk about the file structure.
         * If the item is passed we refresh only that level of the tree, otherwise we do a full refresh.
         */
        refresh(recursive, item, cancelEditing = true) {
            if (!this.tree || !this.isBodyVisible() || (item && !this.tree.hasNode(item))) {
                // Tree node doesn't exist yet
                this.shouldRefresh = true;
                return Promise.resolve(undefined);
            }
            if (cancelEditing && this.explorerService.isEditable(undefined)) {
                this.tree.domFocus();
            }
            const toRefresh = item || this.tree.getInput();
            return this.tree.updateChildren(toRefresh, recursive);
        }
        getOptimalWidth() {
            const parentNode = this.tree.getHTMLElement();
            const childNodes = [].slice.call(parentNode.querySelectorAll('.explorer-item .label-name')); // select all file labels
            return DOM.getLargestChildWidth(parentNode, childNodes);
        }
        async setTreeInput() {
            if (!this.isBodyVisible()) {
                this.shouldRefresh = true;
                return Promise.resolve(undefined);
            }
            const initialInputSetup = !this.tree.getInput();
            if (initialInputSetup) {
                perf.mark('willResolveExplorer');
            }
            const roots = this.explorerService.roots;
            let input = roots[0];
            if (this.contextService.getWorkbenchState() !== 2 /* FOLDER */ || roots[0].isError) {
                // Display roots only when multi folder workspace
                input = roots;
            }
            let viewState;
            if (this.tree && this.tree.getInput()) {
                viewState = this.tree.getViewState();
            }
            else {
                const rawViewState = this.storageService.get(ExplorerView.TREE_VIEW_STATE_STORAGE_KEY, 1 /* WORKSPACE */);
                if (rawViewState) {
                    viewState = JSON.parse(rawViewState);
                }
            }
            const previousInput = this.tree.getInput();
            const promise = this.tree.setInput(input, viewState).then(() => {
                if (Array.isArray(input)) {
                    if (!viewState || previousInput instanceof explorerModel_1.ExplorerItem) {
                        // There is no view state for this workspace, expand all roots. Or we transitioned from a folder workspace.
                        input.forEach(async (item) => {
                            try {
                                await this.tree.expand(item);
                            }
                            catch (e) { }
                        });
                    }
                    if (Array.isArray(previousInput) && previousInput.length < input.length) {
                        // Roots added to the explorer -> expand them.
                        input.slice(previousInput.length).forEach(async (item) => {
                            try {
                                await this.tree.expand(item);
                            }
                            catch (e) { }
                        });
                    }
                }
                if (initialInputSetup) {
                    perf.mark('didResolveExplorer');
                }
            });
            this.progressService.withProgress({
                location: 1 /* Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1200 // less ugly initial startup
            }, _progress => promise);
            await promise;
            if (!this.decorationsProvider) {
                this.decorationsProvider = new explorerDecorationsProvider_1.ExplorerDecorationsProvider(this.explorerService, this.contextService);
                this._register(this.decorationService.registerDecorationsProvider(this.decorationsProvider));
            }
        }
        getActiveFile() {
            const input = this.editorService.activeEditor;
            // ignore diff editor inputs (helps to get out of diffing when returning to explorer)
            if (input instanceof diffEditorInput_1.DiffEditorInput) {
                return undefined;
            }
            // check for files
            return types_1.withNullAsUndefined(editor_1.toResource(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }));
        }
        async selectResource(resource, reveal = this.autoReveal, retry = 0) {
            // do no retry more than once to prevent inifinite loops in cases of inconsistent model
            if (retry === 2) {
                return;
            }
            if (!resource || !this.isBodyVisible()) {
                return;
            }
            // Expand all stats in the parent chain.
            let item = this.explorerService.roots.filter(i => this.uriIdentityService.extUri.isEqualOrParent(resource, i.resource))
                // Take the root that is the closest to the stat #72299
                .sort((first, second) => second.resource.path.length - first.resource.path.length)[0];
            while (item && item.resource.toString() !== resource.toString()) {
                try {
                    await this.tree.expand(item);
                }
                catch (e) {
                    return this.selectResource(resource, reveal, retry + 1);
                }
                for (let child of item.children.values()) {
                    if (this.uriIdentityService.extUri.isEqualOrParent(resource, child.resource)) {
                        item = child;
                        break;
                    }
                    item = undefined;
                }
            }
            if (item) {
                if (item === this.tree.getInput()) {
                    this.tree.setFocus([]);
                    this.tree.setSelection([]);
                    return;
                }
                try {
                    if (reveal === true && this.tree.getRelativeTop(item) === null) {
                        // Don't scroll to the item if it's already visible, or if set not to.
                        this.tree.reveal(item, 0.5);
                    }
                    this.tree.setFocus([item]);
                    this.tree.setSelection([item]);
                }
                catch (e) {
                    // Element might not be in the tree, try again and silently fail
                    return this.selectResource(resource, reveal, retry + 1);
                }
            }
        }
        itemsCopied(stats, cut, previousCut) {
            this.fileCopiedContextKey.set(stats.length > 0);
            this.resourceCutContextKey.set(cut && stats.length > 0);
            if (previousCut) {
                previousCut.forEach(item => this.tree.rerender(item));
            }
            if (cut) {
                stats.forEach(s => this.tree.rerender(s));
            }
        }
        collapseAll() {
            if (this.explorerService.isEditable(undefined)) {
                this.tree.domFocus();
            }
            const treeInput = this.tree.getInput();
            if (Array.isArray(treeInput)) {
                if (hasExpandedRootChild(this.tree, treeInput)) {
                    treeInput.forEach(folder => {
                        folder.children.forEach(child => this.tree.hasNode(child) && this.tree.collapse(child, true));
                    });
                    return;
                }
            }
            this.tree.collapseAll();
        }
        previousCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationController = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationController.previous();
            this.updateCompressedNavigationContextKeys(compressedNavigationController);
        }
        nextCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationController = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationController.next();
            this.updateCompressedNavigationContextKeys(compressedNavigationController);
        }
        firstCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationController = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationController.first();
            this.updateCompressedNavigationContextKeys(compressedNavigationController);
        }
        lastCompressedStat() {
            const focused = this.tree.getFocus();
            if (!focused.length) {
                return;
            }
            const compressedNavigationController = this.renderer.getCompressedNavigationController(focused[0]);
            compressedNavigationController.last();
            this.updateCompressedNavigationContextKeys(compressedNavigationController);
        }
        updateCompressedNavigationContextKeys(controller) {
            this.compressedFocusFirstContext.set(controller.index === 0);
            this.compressedFocusLastContext.set(controller.index === controller.count - 1);
        }
        styleListDropBackground(styles) {
            const content = [];
            if (styles.listDropBackground) {
                content.push(`.explorer-viewlet .explorer-item .monaco-icon-name-container.multiple > .label-name.drop-target > .monaco-highlighted-label { background-color: ${styles.listDropBackground}; }`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.innerHTML) {
                this.styleElement.innerHTML = newStyles;
            }
        }
        dispose() {
            if (this.dragHandler) {
                this.dragHandler.dispose();
            }
            super.dispose();
        }
    };
    ExplorerView.TREE_VIEW_STATE_STORAGE_KEY = 'workbench.explorer.treeViewState';
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "contributedContextMenu", null);
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "fileCopiedContextKey", null);
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "resourceCutContextKey", null);
    ExplorerView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, progress_1.IProgressService),
        __param(6, editorService_1.IEditorService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, decorations_1.IDecorationsService),
        __param(12, label_1.ILabelService),
        __param(13, themeService_1.IThemeService),
        __param(14, actions_1.IMenuService),
        __param(15, telemetry_1.ITelemetryService),
        __param(16, files_1.IExplorerService),
        __param(17, storage_1.IStorageService),
        __param(18, clipboardService_1.IClipboardService),
        __param(19, files_2.IFileService),
        __param(20, uriIdentity_1.IUriIdentityService),
        __param(21, opener_1.IOpenerService)
    ], ExplorerView);
    exports.ExplorerView = ExplorerView;
    function createFileIconThemableTreeContainerScope(container, themeService) {
        DOM.addClass(container, 'file-icon-themable-tree');
        DOM.addClass(container, 'show-file-icons');
        const onDidChangeFileIconTheme = (theme) => {
            DOM.toggleClass(container, 'align-icons-and-twisties', theme.hasFileIcons && !theme.hasFolderIcons);
            DOM.toggleClass(container, 'hide-arrows', theme.hidesExplorerArrows === true);
        };
        onDidChangeFileIconTheme(themeService.getFileIconTheme());
        return themeService.onDidFileIconThemeChange(onDidChangeFileIconTheme);
    }
});
//# __sourceMappingURL=explorerView.js.map