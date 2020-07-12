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
define(["require", "exports", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/browser/dom", "vs/workbench/browser/labels", "vs/base/browser/ui/countBadge/countBadge", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "./menus", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "./util", "vs/platform/theme/common/styler", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/platform/notification/common/notification", "vs/base/common/resourceTree", "vs/base/common/iterator", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/comparers", "vs/base/common/filters", "vs/workbench/common/views", "vs/nls", "vs/base/common/arrays", "vs/base/common/decorators", "vs/platform/storage/common/storage", "vs/workbench/common/editor", "vs/workbench/common/theme", "vs/base/common/hash", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/editor/common/services/modelService", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/contrib/contextmenu/contextmenu", "vs/platform/instantiation/common/descriptors", "vs/base/common/platform", "vs/base/common/strings", "vs/platform/theme/common/colorRegistry", "vs/editor/contrib/suggest/suggestController", "vs/editor/contrib/snippet/snippetController2", "vs/base/common/network", "vs/platform/instantiation/common/serviceCollection", "vs/editor/contrib/hover/hover", "vs/editor/contrib/colorPicker/colorDetector", "vs/editor/contrib/links/links", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/editor/common/services/modeService", "vs/platform/label/common/label", "vs/base/browser/contextmenu", "vs/workbench/browser/style", "vs/css!./media/scmViewlet"], function (require, exports, event_1, resources_1, lifecycle_1, viewPaneContainer_1, dom_1, labels_1, countBadge_1, editorService_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, actions_2, menuEntryActionViewItem_1, menus_1, actionbar_1, themeService_1, util_1, styler_1, listService_1, configuration_1, async_1, notification_1, resourceTree_1, iterator_1, uri_1, files_1, comparers_1, filters_1, views_1, nls_1, arrays_1, decorators_1, storage_1, editor_1, theme_1, hash_1, codeEditorWidget_1, simpleEditorOptions_1, modelService_1, editorExtensions_1, menuPreventer_1, selectionClipboard_1, contextmenu_1, descriptors_1, platform, strings_1, colorRegistry_1, suggestController_1, snippetController2_1, network_1, serviceCollection_1, hover_1, colorDetector_1, links_1, opener_1, telemetry_1, modeService_1, label_1, contextmenu_2, style_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RepositoryViewDescriptor = exports.RepositoryPane = exports.SCMAccessibilityProvider = exports.SCMTreeKeyboardNavigationLabelProvider = exports.SCMTreeSorter = void 0;
    function splitMatches(uri, filterData) {
        let matches;
        let descriptionMatches;
        if (filterData) {
            matches = [];
            descriptionMatches = [];
            const fileName = resources_1.basename(uri);
            const allMatches = filters_1.createMatches(filterData);
            for (const match of allMatches) {
                if (match.start < fileName.length) {
                    matches.push({
                        start: match.start,
                        end: Math.min(match.end, fileName.length)
                    });
                }
                else {
                    descriptionMatches.push({
                        start: match.start - (fileName.length + 1),
                        end: match.end - (fileName.length + 1)
                    });
                }
            }
        }
        return [matches, descriptionMatches];
    }
    class ResourceGroupRenderer {
        constructor(actionViewItemProvider, themeService, menus) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.themeService = themeService;
            this.menus = menus;
        }
        get templateId() { return ResourceGroupRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            // hack
            dom_1.addClass(container.parentElement.parentElement.querySelector('.monaco-tl-twistie'), 'force-twistie');
            const element = dom_1.append(container, dom_1.$('.resource-group'));
            const name = dom_1.append(element, dom_1.$('.name'));
            const actionsContainer = dom_1.append(element, dom_1.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider: this.actionViewItemProvider });
            const countContainer = dom_1.append(element, dom_1.$('.count'));
            const count = new countBadge_1.CountBadge(countContainer);
            const styler = styler_1.attachBadgeStyler(count, this.themeService);
            const elementDisposables = lifecycle_1.Disposable.None;
            const disposables = lifecycle_1.combinedDisposable(actionBar, styler);
            return { name, count, actionBar, elementDisposables, disposables };
        }
        renderElement(node, index, template) {
            template.elementDisposables.dispose();
            const group = node.element;
            template.name.textContent = group.label;
            template.actionBar.clear();
            template.actionBar.context = group;
            template.count.setCount(group.elements.length);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceGroupMenu(group), template.actionBar));
            template.elementDisposables = disposables;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.dispose();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
    }
    ResourceGroupRenderer.TEMPLATE_ID = 'resource group';
    class RepositoryPaneActionRunner extends actions_2.ActionRunner {
        constructor(getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedResources();
            const contextIsSelected = selection.some(s => s === context);
            const actualContext = contextIsSelected ? selection : [context];
            const args = arrays_1.flatten(actualContext.map(e => resourceTree_1.ResourceTree.isResourceNode(e) ? resourceTree_1.ResourceTree.collect(e) : [e]));
            await action.run(...args);
        }
    }
    class ResourceRenderer {
        constructor(viewModelProvider, labels, actionViewItemProvider, actionRunner, themeService, menus) {
            this.viewModelProvider = viewModelProvider;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.actionRunner = actionRunner;
            this.themeService = themeService;
            this.menus = menus;
        }
        get templateId() { return ResourceRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            const element = dom_1.append(container, dom_1.$('.resource'));
            const name = dom_1.append(element, dom_1.$('.name'));
            const fileLabel = this.labels.create(name, { supportDescriptionHighlights: true, supportHighlights: true });
            const actionsContainer = dom_1.append(fileLabel.element, dom_1.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider,
                actionRunner: this.actionRunner
            });
            const decorationIcon = dom_1.append(element, dom_1.$('.decoration-icon'));
            const disposables = lifecycle_1.combinedDisposable(actionBar, fileLabel);
            return { element, name, fileLabel, decorationIcon, actionBar, elementDisposables: lifecycle_1.Disposable.None, disposables };
        }
        renderElement(node, index, template) {
            template.elementDisposables.dispose();
            const elementDisposables = new lifecycle_1.DisposableStore();
            const resourceOrFolder = node.element;
            const theme = this.themeService.getColorTheme();
            const iconResource = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.element : resourceOrFolder;
            const icon = iconResource && (theme.type === themeService_1.LIGHT ? iconResource.decorations.icon : iconResource.decorations.iconDark);
            const uri = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.uri : resourceOrFolder.sourceUri;
            const fileKind = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const viewModel = this.viewModelProvider();
            const [matches, descriptionMatches] = splitMatches(uri, node.filterData);
            template.fileLabel.setFile(uri, {
                fileDecorations: { colors: false, badges: !icon },
                hidePath: viewModel.mode === "tree" /* Tree */,
                fileKind,
                matches,
                descriptionMatches
            });
            template.actionBar.clear();
            template.actionBar.context = resourceOrFolder;
            if (resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder)) {
                if (resourceOrFolder.element) {
                    elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceMenu(resourceOrFolder.element.resourceGroup), template.actionBar));
                    dom_1.toggleClass(template.name, 'strike-through', resourceOrFolder.element.decorations.strikeThrough);
                    dom_1.toggleClass(template.element, 'faded', resourceOrFolder.element.decorations.faded);
                }
                else {
                    elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceFolderMenu(resourceOrFolder.context), template.actionBar));
                    dom_1.removeClass(template.name, 'strike-through');
                    dom_1.removeClass(template.element, 'faded');
                }
            }
            else {
                elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceMenu(resourceOrFolder.resourceGroup), template.actionBar));
                dom_1.toggleClass(template.name, 'strike-through', resourceOrFolder.decorations.strikeThrough);
                dom_1.toggleClass(template.element, 'faded', resourceOrFolder.decorations.faded);
            }
            const tooltip = !resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) && resourceOrFolder.decorations.tooltip || '';
            if (icon) {
                template.decorationIcon.style.display = '';
                template.decorationIcon.style.backgroundImage = `url('${icon}')`;
                template.decorationIcon.title = tooltip;
            }
            else {
                template.decorationIcon.style.display = 'none';
                template.decorationIcon.style.backgroundImage = '';
                template.decorationIcon.title = '';
            }
            template.element.setAttribute('data-tooltip', tooltip);
            template.elementDisposables = elementDisposables;
        }
        disposeElement(resource, index, template) {
            template.elementDisposables.dispose();
        }
        renderCompressedElements(node, index, template, height) {
            template.elementDisposables.dispose();
            const elementDisposables = new lifecycle_1.DisposableStore();
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name).join('/');
            const fileKind = files_1.FileKind.FOLDER;
            const [matches, descriptionMatches] = splitMatches(folder.uri, node.filterData);
            template.fileLabel.setResource({ resource: folder.uri, name: label }, {
                fileDecorations: { colors: false, badges: true },
                fileKind,
                matches,
                descriptionMatches
            });
            template.actionBar.clear();
            template.actionBar.context = folder;
            elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceFolderMenu(folder.context), template.actionBar));
            dom_1.removeClass(template.name, 'strike-through');
            dom_1.removeClass(template.element, 'faded');
            template.decorationIcon.style.display = 'none';
            template.decorationIcon.style.backgroundImage = '';
            template.element.setAttribute('data-tooltip', '');
            template.elementDisposables = elementDisposables;
        }
        disposeCompressedElements(node, index, template, height) {
            template.elementDisposables.dispose();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
    }
    ResourceRenderer.TEMPLATE_ID = 'resource';
    class ProviderListDelegate {
        getHeight() { return 22; }
        getTemplateId(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element) || util_1.isSCMResource(element)) {
                return ResourceRenderer.TEMPLATE_ID;
            }
            else {
                return ResourceGroupRenderer.TEMPLATE_ID;
            }
        }
    }
    class SCMTreeFilter {
        filter(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return true;
            }
            else if (util_1.isSCMResourceGroup(element)) {
                return element.elements.length > 0 || !element.hideWhenEmpty;
            }
            else {
                return true;
            }
        }
    }
    class SCMTreeSorter {
        constructor(viewModelProvider) {
            this.viewModelProvider = viewModelProvider;
        }
        get viewModel() { return this.viewModelProvider(); }
        compare(one, other) {
            var _a, _b;
            if (util_1.isSCMResourceGroup(one) && util_1.isSCMResourceGroup(other)) {
                return 0;
            }
            // List
            if (this.viewModel.mode === "list" /* List */) {
                // FileName
                if (this.viewModel.sortKey === 1 /* Name */) {
                    const oneName = resources_1.basename(one.sourceUri);
                    const otherName = resources_1.basename(other.sourceUri);
                    return comparers_1.compareFileNames(oneName, otherName);
                }
                // Status
                if (this.viewModel.sortKey === 2 /* Status */) {
                    const oneTooltip = (_a = one.decorations.tooltip) !== null && _a !== void 0 ? _a : '';
                    const otherTooltip = (_b = other.decorations.tooltip) !== null && _b !== void 0 ? _b : '';
                    if (oneTooltip !== otherTooltip) {
                        return strings_1.compare(oneTooltip, otherTooltip);
                    }
                }
                // Path (default)
                const onePath = one.sourceUri.fsPath;
                const otherPath = other.sourceUri.fsPath;
                return comparers_1.comparePaths(onePath, otherPath);
            }
            // Tree
            const oneIsDirectory = resourceTree_1.ResourceTree.isResourceNode(one);
            const otherIsDirectory = resourceTree_1.ResourceTree.isResourceNode(other);
            if (oneIsDirectory !== otherIsDirectory) {
                return oneIsDirectory ? -1 : 1;
            }
            const oneName = resourceTree_1.ResourceTree.isResourceNode(one) ? one.name : resources_1.basename(one.sourceUri);
            const otherName = resourceTree_1.ResourceTree.isResourceNode(other) ? other.name : resources_1.basename(other.sourceUri);
            return comparers_1.compareFileNames(oneName, otherName);
        }
    }
    __decorate([
        decorators_1.memoize
    ], SCMTreeSorter.prototype, "viewModel", null);
    exports.SCMTreeSorter = SCMTreeSorter;
    let SCMTreeKeyboardNavigationLabelProvider = class SCMTreeKeyboardNavigationLabelProvider {
        constructor(labelService) {
            this.labelService = labelService;
        }
        getKeyboardNavigationLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return element.name;
            }
            else if (util_1.isSCMResourceGroup(element)) {
                return element.label;
            }
            else {
                // Since a match in the file name takes precedence over a match
                // in the folder name we are returning the label as file/folder.
                const fileName = resources_1.basename(element.sourceUri);
                const filePath = this.labelService.getUriLabel(resources_1.dirname(element.sourceUri), { relative: true });
                return filePath.length !== 0 ? `${fileName} ${filePath}` : fileName;
            }
        }
        getCompressedNodeKeyboardNavigationLabel(elements) {
            const folders = elements;
            return folders.map(e => e.name).join('/');
        }
    };
    SCMTreeKeyboardNavigationLabelProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], SCMTreeKeyboardNavigationLabelProvider);
    exports.SCMTreeKeyboardNavigationLabelProvider = SCMTreeKeyboardNavigationLabelProvider;
    class SCMResourceIdentityProvider {
        getId(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                const group = element.context;
                return `${group.provider.contextValue}/${group.id}/$FOLDER/${element.uri.toString()}`;
            }
            else if (util_1.isSCMResource(element)) {
                const group = element.resourceGroup;
                const provider = group.provider;
                return `${provider.contextValue}/${group.id}/${element.sourceUri.toString()}`;
            }
            else {
                const provider = element.provider;
                return `${provider.contextValue}/${element.id}`;
            }
        }
    }
    let SCMAccessibilityProvider = class SCMAccessibilityProvider {
        constructor(labelService) {
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return nls_1.localize('scm', "Source Control Management");
        }
        getAriaLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return this.labelService.getUriLabel(element.uri, { relative: true, noPrefix: true }) || element.name;
            }
            else if (util_1.isSCMResourceGroup(element)) {
                return element.label;
            }
            else {
                const result = [];
                result.push(resources_1.basename(element.sourceUri));
                if (element.decorations.tooltip) {
                    result.push(element.decorations.tooltip);
                }
                const path = this.labelService.getUriLabel(resources_1.dirname(element.sourceUri), { relative: true, noPrefix: true });
                if (path) {
                    result.push(path);
                }
                return result.join(', ');
            }
        }
    };
    SCMAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], SCMAccessibilityProvider);
    exports.SCMAccessibilityProvider = SCMAccessibilityProvider;
    function groupItemAsTreeElement(item, mode) {
        const children = mode === "list" /* List */
            ? iterator_1.Iterable.map(item.resources, element => ({ element, incompressible: true }))
            : iterator_1.Iterable.map(item.tree.root.children, node => asTreeElement(node, true));
        return { element: item.group, children, incompressible: true, collapsible: true };
    }
    function asTreeElement(node, forceIncompressible) {
        return {
            element: (node.childrenCount === 0 && node.element) ? node.element : node,
            children: iterator_1.Iterable.map(node.children, node => asTreeElement(node, false)),
            incompressible: !!node.element || forceIncompressible
        };
    }
    var ViewModelMode;
    (function (ViewModelMode) {
        ViewModelMode["List"] = "list";
        ViewModelMode["Tree"] = "tree";
    })(ViewModelMode || (ViewModelMode = {}));
    var ViewModelSortKey;
    (function (ViewModelSortKey) {
        ViewModelSortKey[ViewModelSortKey["Path"] = 0] = "Path";
        ViewModelSortKey[ViewModelSortKey["Name"] = 1] = "Name";
        ViewModelSortKey[ViewModelSortKey["Status"] = 2] = "Status";
    })(ViewModelSortKey || (ViewModelSortKey = {}));
    let ViewModel = class ViewModel {
        constructor(groups, tree, _mode, _sortKey, editorService, configurationService) {
            this.groups = groups;
            this.tree = tree;
            this._mode = _mode;
            this._sortKey = _sortKey;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this._onDidChangeMode = new event_1.Emitter();
            this.onDidChangeMode = this._onDidChangeMode.event;
            this.items = [];
            this.visibilityDisposables = new lifecycle_1.DisposableStore();
            this.firstVisible = true;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        get mode() { return this._mode; }
        set mode(mode) {
            this._mode = mode;
            for (const item of this.items) {
                item.tree.clear();
                if (mode === "tree" /* Tree */) {
                    for (const resource of item.resources) {
                        item.tree.add(resource.sourceUri, resource);
                    }
                }
            }
            this.refresh();
            this._onDidChangeMode.fire(mode);
        }
        get sortKey() { return this._sortKey; }
        set sortKey(sortKey) {
            if (sortKey !== this._sortKey) {
                this._sortKey = sortKey;
                this.refresh();
            }
        }
        onDidSpliceGroups({ start, deleteCount, toInsert }) {
            const itemsToInsert = [];
            for (const group of toInsert) {
                const tree = new resourceTree_1.ResourceTree(group, group.provider.rootUri || uri_1.URI.file('/'));
                const resources = [...group.elements];
                const disposable = lifecycle_1.combinedDisposable(group.onDidChange(() => this.tree.refilter()), group.onDidSplice(splice => this.onDidSpliceGroup(item, splice)));
                const item = { group, resources, tree, disposable };
                if (this._mode === "tree" /* Tree */) {
                    for (const resource of resources) {
                        item.tree.add(resource.sourceUri, resource);
                    }
                }
                itemsToInsert.push(item);
            }
            const itemsToDispose = this.items.splice(start, deleteCount, ...itemsToInsert);
            for (const item of itemsToDispose) {
                item.disposable.dispose();
            }
            this.refresh();
        }
        onDidSpliceGroup(item, { start, deleteCount, toInsert }) {
            const deleted = item.resources.splice(start, deleteCount, ...toInsert);
            if (this._mode === "tree" /* Tree */) {
                for (const resource of deleted) {
                    item.tree.delete(resource.sourceUri);
                }
                for (const resource of toInsert) {
                    item.tree.add(resource.sourceUri, resource);
                }
            }
            this.refresh(item);
        }
        setVisible(visible) {
            if (visible) {
                this.visibilityDisposables = new lifecycle_1.DisposableStore();
                this.groups.onDidSplice(this.onDidSpliceGroups, this, this.visibilityDisposables);
                this.onDidSpliceGroups({ start: 0, deleteCount: this.items.length, toInsert: this.groups.elements });
                if (typeof this.scrollTop === 'number') {
                    this.tree.scrollTop = this.scrollTop;
                    this.scrollTop = undefined;
                }
                this.editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.visibilityDisposables);
                this.onDidActiveEditorChange();
            }
            else {
                this.visibilityDisposables.dispose();
                this.onDidSpliceGroups({ start: 0, deleteCount: this.items.length, toInsert: [] });
                this.scrollTop = this.tree.scrollTop;
            }
        }
        refresh(item) {
            if (item) {
                this.tree.setChildren(item.group, groupItemAsTreeElement(item, this.mode).children);
            }
            else {
                this.tree.setChildren(null, this.items.map(item => groupItemAsTreeElement(item, this.mode)));
            }
        }
        onDidActiveEditorChange() {
            var _a;
            if (!this.configurationService.getValue('scm.autoReveal')) {
                return;
            }
            if (this.firstVisible) {
                this.firstVisible = false;
                this.visibilityDisposables.add(async_1.disposableTimeout(() => this.onDidActiveEditorChange(), 250));
                return;
            }
            const editor = this.editorService.activeEditor;
            if (!editor) {
                return;
            }
            const uri = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!uri) {
                return;
            }
            // go backwards from last group
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                const resource = this.mode === "tree" /* Tree */
                    ? (_a = item.tree.getNode(uri)) === null || _a === void 0 ? void 0 : _a.element : arrays_1.find(item.resources, r => resources_1.isEqual(r.sourceUri, uri));
                if (resource) {
                    this.tree.reveal(resource);
                    this.tree.setSelection([resource]);
                    this.tree.setFocus([resource]);
                    return;
                }
            }
        }
        dispose() {
            this.visibilityDisposables.dispose();
            this.disposables.dispose();
            for (const item of this.items) {
                item.disposable.dispose();
            }
            this.items = [];
        }
    };
    ViewModel = __decorate([
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService)
    ], ViewModel);
    class SCMViewSubMenuAction extends contextmenu_2.ContextSubMenu {
        constructor(viewModel) {
            super(nls_1.localize('sortAction', "View & Sort"), [
                ...new actions_2.RadioGroup([
                    new SCMViewModeListAction(viewModel),
                    new SCMViewModeTreeAction(viewModel)
                ]).actions,
                new actionbar_1.Separator(),
                ...new actions_2.RadioGroup([
                    new SCMSortByNameAction(viewModel),
                    new SCMSortByPathAction(viewModel),
                    new SCMSortByStatusAction(viewModel)
                ]).actions
            ]);
        }
    }
    class SCMViewModeAction extends actions_2.Action {
        constructor(id, label, viewModel, viewMode) {
            super(id, label);
            this.viewModel = viewModel;
            this.viewMode = viewMode;
            this.checked = this.viewModel.mode === this.viewMode;
        }
        async run() {
            if (this.viewMode !== this.viewModel.mode) {
                this.checked = !this.checked;
                this.viewModel.mode = this.viewMode;
            }
        }
    }
    class SCMViewModeListAction extends SCMViewModeAction {
        constructor(viewModel) {
            super(SCMViewModeListAction.ID, SCMViewModeListAction.LABEL, viewModel, "list" /* List */);
        }
    }
    SCMViewModeListAction.ID = 'workbench.scm.action.viewModeList';
    SCMViewModeListAction.LABEL = nls_1.localize('viewModeList', "View as List");
    class SCMViewModeTreeAction extends SCMViewModeAction {
        constructor(viewModel) {
            super(SCMViewModeTreeAction.ID, SCMViewModeTreeAction.LABEL, viewModel, "tree" /* Tree */);
        }
    }
    SCMViewModeTreeAction.ID = 'workbench.scm.action.viewModeTree';
    SCMViewModeTreeAction.LABEL = nls_1.localize('viewModeTree', "View as Tree");
    class SCMSortAction extends actions_2.Action {
        constructor(id, label, viewModel, sortKey) {
            var _a, _b;
            super(id, label);
            this.viewModel = viewModel;
            this.sortKey = sortKey;
            this.checked = this.sortKey === 0 /* Path */;
            this.enabled = (_b = ((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.mode) === "list" /* List */) !== null && _b !== void 0 ? _b : false;
            this._listener = viewModel === null || viewModel === void 0 ? void 0 : viewModel.onDidChangeMode(e => this.enabled = e === "list" /* List */);
        }
        async run() {
            if (this.sortKey !== this.viewModel.sortKey) {
                this.checked = !this.checked;
                this.viewModel.sortKey = this.sortKey;
            }
        }
        dispose() {
            this._listener.dispose();
            super.dispose();
        }
    }
    class SCMSortByNameAction extends SCMSortAction {
        constructor(viewModel) {
            super(SCMSortByNameAction.ID, SCMSortByNameAction.LABEL, viewModel, 1 /* Name */);
        }
    }
    SCMSortByNameAction.ID = 'workbench.scm.action.sortByName';
    SCMSortByNameAction.LABEL = nls_1.localize('sortByName', "Sort by Name");
    class SCMSortByPathAction extends SCMSortAction {
        constructor(viewModel) {
            super(SCMSortByPathAction.ID, SCMSortByPathAction.LABEL, viewModel, 0 /* Path */);
        }
    }
    SCMSortByPathAction.ID = 'workbench.scm.action.sortByPath';
    SCMSortByPathAction.LABEL = nls_1.localize('sortByPath', "Sort by Path");
    class SCMSortByStatusAction extends SCMSortAction {
        constructor(viewModel) {
            super(SCMSortByStatusAction.ID, SCMSortByStatusAction.LABEL, viewModel, 2 /* Status */);
        }
    }
    SCMSortByStatusAction.ID = 'workbench.scm.action.sortByStatus';
    SCMSortByStatusAction.LABEL = nls_1.localize('sortByStatus', "Sort by Status");
    let RepositoryPane = class RepositoryPane extends viewPaneContainer_1.ViewPane {
        constructor(repository, options, keybindingService, themeService, contextMenuService, contextViewService, commandService, notificationService, editorService, instantiationService, viewDescriptorService, configurationService, contextKeyService, menuService, storageService, modelService, modeService, openerService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.repository = repository;
            this.keybindingService = keybindingService;
            this.themeService = themeService;
            this.contextMenuService = contextMenuService;
            this.contextViewService = contextViewService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.menuService = menuService;
            this.storageService = storageService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.defaultInputFontFamily = style_1.DEFAULT_FONT_FAMILY;
            this.cachedHeight = undefined;
            this.cachedWidth = undefined;
            this.commitTemplate = '';
            this.menus = instantiationService.createInstance(menus_1.SCMMenus, this.repository.provider);
            this._register(this.menus);
            this._register(this.menus.onDidChangeTitle(this._onDidChangeTitleArea.fire, this._onDidChangeTitleArea));
            this.contextKeyService = contextKeyService.createScoped(this.element);
            this.contextKeyService.createKey('scmRepository', this.repository);
        }
        render() {
            super.render();
            this._register(this.menus.onDidChangeTitle(this.updateActions, this));
        }
        renderHeaderTitle(container) {
            let title;
            let type;
            if (this.repository.provider.rootUri) {
                title = resources_1.basename(this.repository.provider.rootUri);
                type = this.repository.provider.label;
            }
            else {
                title = this.repository.provider.label;
                type = '';
            }
            super.renderHeaderTitle(container, title);
            dom_1.addClass(container, 'scm-provider');
            dom_1.append(container, dom_1.$('span.type', undefined, type));
        }
        renderBody(container) {
            super.renderBody(container);
            const focusTracker = dom_1.trackFocus(container);
            this._register(focusTracker.onDidFocus(() => this.repository.focus()));
            this._register(focusTracker);
            // Input
            this.inputContainer = dom_1.append(container, dom_1.$('.scm-editor'));
            const editorContainer = dom_1.append(this.inputContainer, dom_1.$('.scm-editor-container'));
            const placeholderTextContainer = dom_1.append(editorContainer, dom_1.$('.scm-editor-placeholder'));
            const updatePlaceholder = () => {
                const binding = this.keybindingService.lookupKeybinding('scm.acceptInput');
                const label = binding ? binding.getLabel() : (platform.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter');
                const placeholderText = strings_1.format(this.repository.input.placeholder, label);
                this.inputEditor.updateOptions({ ariaLabel: placeholderText });
                placeholderTextContainer.textContent = placeholderText;
            };
            this.validationContainer = dom_1.append(editorContainer, dom_1.$('.scm-editor-validation'));
            const validationDelayer = new async_1.ThrottledDelayer(200);
            const validate = () => {
                var _a;
                const position = (_a = this.inputEditor.getSelection()) === null || _a === void 0 ? void 0 : _a.getStartPosition();
                const offset = position && this.inputModel.getOffsetAt(position);
                const value = this.inputModel.getValue();
                return this.repository.input.validateInput(value, offset || 0).then(result => {
                    if (!result) {
                        dom_1.removeClass(editorContainer, 'validation-info');
                        dom_1.removeClass(editorContainer, 'validation-warning');
                        dom_1.removeClass(editorContainer, 'validation-error');
                        dom_1.removeClass(this.validationContainer, 'validation-info');
                        dom_1.removeClass(this.validationContainer, 'validation-warning');
                        dom_1.removeClass(this.validationContainer, 'validation-error');
                        this.validationContainer.textContent = null;
                    }
                    else {
                        dom_1.toggleClass(editorContainer, 'validation-info', result.type === 2 /* Information */);
                        dom_1.toggleClass(editorContainer, 'validation-warning', result.type === 1 /* Warning */);
                        dom_1.toggleClass(editorContainer, 'validation-error', result.type === 0 /* Error */);
                        dom_1.toggleClass(this.validationContainer, 'validation-info', result.type === 2 /* Information */);
                        dom_1.toggleClass(this.validationContainer, 'validation-warning', result.type === 1 /* Warning */);
                        dom_1.toggleClass(this.validationContainer, 'validation-error', result.type === 0 /* Error */);
                        this.validationContainer.textContent = result.message;
                    }
                });
            };
            const triggerValidation = () => validationDelayer.trigger(validate);
            const editorOptions = Object.assign(Object.assign({}, simpleEditorOptions_1.getSimpleEditorOptions()), { lineDecorationsWidth: 4, dragAndDrop: false, cursorWidth: 1, fontSize: 13, lineHeight: 20, fontFamily: this.getInputEditorFontFamily(), wrappingStrategy: 'advanced', wrappingIndent: 'none', padding: { top: 3, bottom: 3 }, quickSuggestions: false });
            const codeEditorWidgetOptions = {
                isSimpleWidget: true,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    suggestController_1.SuggestController.ID,
                    snippetController2_1.SnippetController2.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    colorDetector_1.ColorDetector.ID,
                    hover_1.ModesHoverController.ID,
                    links_1.LinkDetector.ID
                ])
            };
            const services = new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]);
            const instantiationService = this.instantiationService.createChild(services);
            this.inputEditor = instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, editorOptions, codeEditorWidgetOptions);
            this._register(this.inputEditor);
            this._register(this.inputEditor.onDidFocusEditorText(() => dom_1.addClass(editorContainer, 'synthetic-focus')));
            this._register(this.inputEditor.onDidBlurEditorText(() => dom_1.removeClass(editorContainer, 'synthetic-focus')));
            const onInputFontFamilyChanged = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.inputFontFamily'));
            this._register(onInputFontFamilyChanged(() => this.inputEditor.updateOptions({ fontFamily: this.getInputEditorFontFamily() })));
            let query;
            if (this.repository.provider.rootUri) {
                query = `rootUri=${encodeURIComponent(this.repository.provider.rootUri.toString())}`;
            }
            const uri = uri_1.URI.from({
                scheme: network_1.Schemas.vscode,
                path: `scm/${this.repository.provider.contextValue}/${this.repository.provider.id}/input`,
                query
            });
            this.configurationService.updateValue('editor.wordBasedSuggestions', false, { resource: uri }, 7 /* MEMORY */);
            const mode = this.modeService.create('scminput');
            this.inputModel = this.modelService.getModel(uri) || this.modelService.createModel('', mode, uri);
            this.inputEditor.setModel(this.inputModel);
            this._register(this.inputEditor.onDidChangeCursorPosition(triggerValidation));
            const opts = this.modelService.getCreationOptions(this.inputModel.getLanguageIdentifier().language, this.inputModel.uri, this.inputModel.isForSimpleWidget);
            const onEnter = event_1.Event.filter(this.inputEditor.onKeyDown, e => e.keyCode === 3 /* Enter */);
            this._register(onEnter(() => this.inputModel.detectIndentation(opts.insertSpaces, opts.tabSize)));
            // Keep model in sync with API
            this.inputModel.setValue(this.repository.input.value);
            this._register(this.repository.input.onDidChange(value => {
                if (value === this.inputModel.getValue()) {
                    return;
                }
                this.inputModel.setValue(value);
                this.inputEditor.setPosition(this.inputModel.getFullModelRange().getEndPosition());
            }));
            // Keep API in sync with model and update placeholder and validation
            dom_1.toggleClass(placeholderTextContainer, 'hidden', this.inputModel.getValueLength() > 0);
            this.inputModel.onDidChangeContent(() => {
                this.repository.input.value = this.inputModel.getValue();
                dom_1.toggleClass(placeholderTextContainer, 'hidden', this.inputModel.getValueLength() > 0);
                triggerValidation();
            });
            updatePlaceholder();
            this._register(this.repository.input.onDidChangePlaceholder(updatePlaceholder, null));
            this._register(this.keybindingService.onDidUpdateKeybindings(updatePlaceholder, null));
            const onDidChangeContentHeight = event_1.Event.filter(this.inputEditor.onDidContentSizeChange, e => e.contentHeightChanged);
            this._register(onDidChangeContentHeight(() => this.layoutBody()));
            this._register(this.repository.provider.onDidChangeCommitTemplate(this.onDidChangeCommitTemplate, this));
            this.onDidChangeCommitTemplate();
            // Input box visibility
            this._register(this.repository.input.onDidChangeVisibility(this.updateInputBoxVisibility, this));
            this.updateInputBoxVisibility();
            // List
            this.listContainer = dom_1.append(container, dom_1.$('.scm-status.show-file-icons'));
            const updateActionsVisibility = () => dom_1.toggleClass(this.listContainer, 'show-actions', this.configurationService.getValue('scm.alwaysShowActions'));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowActions'))(updateActionsVisibility);
            updateActionsVisibility();
            const delegate = new ProviderListDelegate();
            const actionViewItemProvider = (action) => this.getActionViewItem(action);
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(this.listLabels);
            const actionRunner = new RepositoryPaneActionRunner(() => this.getSelectedResources());
            this._register(actionRunner);
            this._register(actionRunner.onDidBeforeRun(() => this.tree.domFocus()));
            const renderers = [
                new ResourceGroupRenderer(actionViewItemProvider, this.themeService, this.menus),
                new ResourceRenderer(() => this.viewModel, this.listLabels, actionViewItemProvider, actionRunner, this.themeService, this.menus)
            ];
            const filter = new SCMTreeFilter();
            const sorter = new SCMTreeSorter(() => this.viewModel);
            const keyboardNavigationLabelProvider = this.instantiationService.createInstance(SCMTreeKeyboardNavigationLabelProvider);
            const identityProvider = new SCMResourceIdentityProvider();
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'SCM Tree Repo', this.listContainer, delegate, renderers, {
                identityProvider,
                horizontalScrolling: false,
                filter,
                sorter,
                keyboardNavigationLabelProvider,
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                },
                accessibilityProvider: this.instantiationService.createInstance(SCMAccessibilityProvider)
            });
            this._register(this.tree.onDidOpen(this.open, this));
            this._register(this.tree.onContextMenu(this.onListContextMenu, this));
            this._register(this.tree);
            let viewMode = this.configurationService.getValue('scm.defaultViewMode') === 'list' ? "list" /* List */ : "tree" /* Tree */;
            const rootUri = this.repository.provider.rootUri;
            if (typeof rootUri !== 'undefined') {
                const storageMode = this.storageService.get(`scm.repository.viewMode:${rootUri.toString()}`, 1 /* WORKSPACE */);
                if (typeof storageMode === 'string') {
                    viewMode = storageMode;
                }
            }
            this.viewModel = this.instantiationService.createInstance(ViewModel, this.repository.provider.groups, this.tree, viewMode, 0 /* Path */);
            this._register(this.viewModel);
            dom_1.addClass(this.listContainer, 'file-icon-themable-tree');
            dom_1.addClass(this.listContainer, 'show-file-icons');
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            this._register(this.themeService.onDidFileIconThemeChange(this.updateIndentStyles, this));
            this._register(this.viewModel.onDidChangeMode(this.onDidChangeMode, this));
            this._register(this.onDidChangeBodyVisibility(this._onDidChangeVisibility, this));
            this.updateActions();
        }
        updateIndentStyles(theme) {
            dom_1.toggleClass(this.listContainer, 'list-view-mode', this.viewModel.mode === "list" /* List */);
            dom_1.toggleClass(this.listContainer, 'tree-view-mode', this.viewModel.mode === "tree" /* Tree */);
            dom_1.toggleClass(this.listContainer, 'align-icons-and-twisties', (this.viewModel.mode === "list" /* List */ && theme.hasFileIcons) || (theme.hasFileIcons && !theme.hasFolderIcons));
            dom_1.toggleClass(this.listContainer, 'hide-arrows', this.viewModel.mode === "tree" /* Tree */ && theme.hidesExplorerArrows === true);
        }
        onDidChangeMode() {
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            const rootUri = this.repository.provider.rootUri;
            if (typeof rootUri === 'undefined') {
                return;
            }
            this.storageService.store(`scm.repository.viewMode:${rootUri.toString()}`, this.viewModel.mode, 1 /* WORKSPACE */);
        }
        layoutBody(height = this.cachedHeight, width = this.cachedWidth) {
            if (height === undefined) {
                return;
            }
            if (width !== undefined) {
                super.layoutBody(height, width);
            }
            this.cachedHeight = height;
            this.cachedWidth = width;
            if (this.repository.input.visible) {
                dom_1.removeClass(this.inputContainer, 'hidden');
                const editorContentHeight = this.inputEditor.getContentHeight();
                const editorHeight = Math.min(editorContentHeight, 134);
                this.inputEditor.layout({ height: editorHeight, width: width - 12 - 16 - 2 });
                this.validationContainer.style.top = `${editorHeight + 1}px`;
                const listHeight = height - (editorHeight + 5 + 2 + 5);
                this.listContainer.style.height = `${listHeight}px`;
                this.tree.layout(listHeight, width);
            }
            else {
                dom_1.addClass(this.inputContainer, 'hidden');
                this.inputEditor.onHide();
                this.listContainer.style.height = `${height}px`;
                this.tree.layout(height, width);
            }
        }
        focus() {
            super.focus();
            if (this.isExpanded()) {
                if (this.repository.input.visible) {
                    this.inputEditor.focus();
                }
                else {
                    this.tree.domFocus();
                }
                this.repository.focus();
            }
        }
        _onDidChangeVisibility(visible) {
            this.viewModel.setVisible(visible);
            if (this.repository.input.visible && visible) {
                this.inputEditor.onVisible();
            }
            else {
                this.inputEditor.onHide();
            }
        }
        getActions() {
            return this.menus.getTitleActions();
        }
        getSecondaryActions() {
            if (!this.viewModel) {
                return [];
            }
            const result = [new SCMViewSubMenuAction(this.viewModel)];
            const secondaryActions = this.menus.getTitleSecondaryActions();
            if (secondaryActions.length > 0) {
                result.push(new actionbar_1.Separator(), ...secondaryActions);
            }
            return result;
        }
        getActionViewItem(action) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return undefined;
            }
            return new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
        }
        getActionsContext() {
            return this.repository.provider;
        }
        async open(e) {
            if (!e.element || util_1.isSCMResourceGroup(e.element) || resourceTree_1.ResourceTree.isResourceNode(e.element)) {
                return;
            }
            await e.element.open(!!e.editorOptions.preserveFocus);
            if (e.editorOptions.pinned) {
                const activeEditorPane = this.editorService.activeEditorPane;
                if (activeEditorPane) {
                    activeEditorPane.group.pinEditor(activeEditorPane.input);
                }
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            let actions = [];
            if (util_1.isSCMResourceGroup(element)) {
                actions = this.menus.getResourceGroupContextActions(element);
            }
            else if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                if (element.element) {
                    actions = this.menus.getResourceContextActions(element.element);
                }
                else {
                    actions = this.menus.getResourceFolderContextActions(element.context);
                }
            }
            else {
                actions = this.menus.getResourceContextActions(element);
            }
            const actionRunner = new RepositoryPaneActionRunner(() => this.getSelectedResources());
            actionRunner.onDidBeforeRun(() => this.tree.domFocus());
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element,
                actionRunner
            });
        }
        getSelectedResources() {
            return this.tree.getSelection()
                .filter(r => !!r && !util_1.isSCMResourceGroup(r));
        }
        onDidChangeCommitTemplate() {
            if (typeof this.repository.provider.commitTemplate === 'undefined' || !this.repository.input.visible) {
                return;
            }
            const oldCommitTemplate = this.commitTemplate;
            this.commitTemplate = this.repository.provider.commitTemplate;
            const value = this.inputModel.getValue();
            if (value && value !== oldCommitTemplate) {
                return;
            }
            this.inputModel.setValue(this.commitTemplate);
        }
        updateInputBoxVisibility() {
            if (this.cachedHeight) {
                this.layoutBody(this.cachedHeight);
            }
        }
        getInputEditorFontFamily() {
            const inputFontFamily = this.configurationService.getValue('scm.inputFontFamily').trim();
            if (inputFontFamily.toLowerCase() === 'editor') {
                return this.configurationService.getValue('editor.fontFamily').trim();
            }
            if (inputFontFamily.length !== 0 && inputFontFamily.toLowerCase() !== 'default') {
                return inputFontFamily;
            }
            return this.defaultInputFontFamily;
        }
    };
    RepositoryPane = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, themeService_1.IThemeService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextView_1.IContextViewService),
        __param(6, commands_1.ICommandService),
        __param(7, notification_1.INotificationService),
        __param(8, editorService_1.IEditorService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, actions_1.IMenuService),
        __param(14, storage_1.IStorageService),
        __param(15, modelService_1.IModelService),
        __param(16, modeService_1.IModeService),
        __param(17, opener_1.IOpenerService),
        __param(18, telemetry_1.ITelemetryService)
    ], RepositoryPane);
    exports.RepositoryPane = RepositoryPane;
    class RepositoryViewDescriptor {
        constructor(repository, hideByDefault) {
            this.repository = repository;
            this.hideByDefault = hideByDefault;
            this.canToggleVisibility = true;
            this.order = -500;
            this.workspace = true;
            const repoId = repository.provider.rootUri ? repository.provider.rootUri.toString() : `#${RepositoryViewDescriptor.counter++}`;
            const hasher = new hash_1.Hasher();
            hasher.hash(repository.provider.label);
            hasher.hash(repoId);
            this.id = `scm:repository:${hasher.value}`;
            this.name = repository.provider.rootUri ? resources_1.basename(repository.provider.rootUri) : repository.provider.label;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(RepositoryPane, [repository]);
        }
    }
    exports.RepositoryViewDescriptor = RepositoryViewDescriptor;
    RepositoryViewDescriptor.counter = 0;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const inputBackgroundColor = theme.getColor(colorRegistry_1.inputBackground);
        if (inputBackgroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container .monaco-editor-background,
		.scm-viewlet .scm-editor-container .monaco-editor,
		.scm-viewlet .scm-editor-container .monaco-editor .margin
		{ background-color: ${inputBackgroundColor}; }`);
        }
        const inputForegroundColor = theme.getColor(colorRegistry_1.inputForeground);
        if (inputForegroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container .mtk1 { color: ${inputForegroundColor}; }`);
        }
        const inputBorderColor = theme.getColor(colorRegistry_1.inputBorder);
        if (inputBorderColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container { outline: 1px solid ${inputBorderColor}; }`);
        }
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container.synthetic-focus { outline: 1px solid ${focusBorderColor}; }`);
        }
        const inputPlaceholderForegroundColor = theme.getColor(colorRegistry_1.inputPlaceholderForeground);
        if (inputPlaceholderForegroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-placeholder { color: ${inputPlaceholderForegroundColor}; }`);
        }
        const inputValidationInfoBorderColor = theme.getColor(colorRegistry_1.inputValidationInfoBorder);
        if (inputValidationInfoBorderColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container.validation-info { outline: 1px solid ${inputValidationInfoBorderColor}; }`);
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-info { border: 1px solid ${inputValidationInfoBorderColor}; }`);
        }
        const inputValidationInfoBackgroundColor = theme.getColor(colorRegistry_1.inputValidationInfoBackground);
        if (inputValidationInfoBackgroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-info { background-color: ${inputValidationInfoBackgroundColor}; }`);
        }
        const inputValidationInfoForegroundColor = theme.getColor(colorRegistry_1.inputValidationInfoForeground);
        if (inputValidationInfoForegroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-info { color: ${inputValidationInfoForegroundColor}; }`);
        }
        const inputValidationWarningBorderColor = theme.getColor(colorRegistry_1.inputValidationWarningBorder);
        if (inputValidationWarningBorderColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container.validation-warning { outline: 1px solid ${inputValidationWarningBorderColor}; }`);
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-warning { border: 1px solid ${inputValidationWarningBorderColor}; }`);
        }
        const inputValidationWarningBackgroundColor = theme.getColor(colorRegistry_1.inputValidationWarningBackground);
        if (inputValidationWarningBackgroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-warning { background-color: ${inputValidationWarningBackgroundColor}; }`);
        }
        const inputValidationWarningForegroundColor = theme.getColor(colorRegistry_1.inputValidationWarningForeground);
        if (inputValidationWarningForegroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-warning { color: ${inputValidationWarningForegroundColor}; }`);
        }
        const inputValidationErrorBorderColor = theme.getColor(colorRegistry_1.inputValidationErrorBorder);
        if (inputValidationErrorBorderColor) {
            collector.addRule(`.scm-viewlet .scm-editor-container.validation-error { outline: 1px solid ${inputValidationErrorBorderColor}; }`);
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-error { border: 1px solid ${inputValidationErrorBorderColor}; }`);
        }
        const inputValidationErrorBackgroundColor = theme.getColor(colorRegistry_1.inputValidationErrorBackground);
        if (inputValidationErrorBackgroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-error { background-color: ${inputValidationErrorBackgroundColor}; }`);
        }
        const inputValidationErrorForegroundColor = theme.getColor(colorRegistry_1.inputValidationErrorForeground);
        if (inputValidationErrorForegroundColor) {
            collector.addRule(`.scm-viewlet .scm-editor-validation.validation-error { color: ${inputValidationErrorForegroundColor}; }`);
        }
    });
});
//# __sourceMappingURL=repositoryPane.js.map