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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/base/browser/dom", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/theme/common/themeService", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/nls", "vs/base/common/async", "vs/platform/theme/common/colorRegistry", "vs/base/common/types", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/base/common/filters", "vs/base/browser/ui/tree/treeDefaults", "vs/base/common/strings", "vs/workbench/common/theme", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/css!./media/views"], function (require, exports, event_1, lifecycle_1, instantiation_1, actions_1, keybinding_1, contextView_1, actions_2, menuEntryActionViewItem_1, contextkey_1, views_1, configuration_1, notification_1, progress_1, extensions_1, commands_1, DOM, labels_1, actionbar_1, uri_1, resources_1, themeService_1, files_1, listService_1, viewPaneContainer_1, nls_1, async_1, colorRegistry_1, types_1, label_1, platform_1, filters_1, treeDefaults_1, strings_1, theme_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTreeView = exports.TreeView = exports.TreeViewPane = void 0;
    let TreeViewPane = class TreeViewPane extends viewPaneContainer_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(Object.assign(Object.assign({}, options), { titleMenuId: actions_2.MenuId.ViewTitle }), keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            const { treeView } = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(options.id);
            this.treeView = treeView;
            this._register(this.treeView.onDidChangeActions(() => this.updateActions(), this));
            this._register(this.treeView.onDidChangeTitle((newTitle) => this.updateTitle(newTitle)));
            this._register(lifecycle_1.toDisposable(() => this.treeView.setVisibility(false)));
            this._register(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this._register(this.treeView.onDidChangeWelcomeState(() => this._onDidChangeViewWelcomeState.fire()));
            if (options.title !== this.treeView.title) {
                this.updateTitle(this.treeView.title);
            }
            this.updateTreeVisibility();
        }
        focus() {
            super.focus();
            this.treeView.focus();
        }
        renderBody(container) {
            super.renderBody(container);
            if (this.treeView instanceof TreeView) {
                this.treeView.show(container);
            }
        }
        shouldShowWelcome() {
            return ((this.treeView.dataProvider === undefined) || !!this.treeView.dataProvider.isTreeEmpty) && (this.treeView.message === undefined);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.treeView.layout(height, width);
        }
        getOptimalWidth() {
            return this.treeView.getOptimalWidth();
        }
        updateTreeVisibility() {
            this.treeView.setVisibility(this.isBodyVisible());
        }
    };
    TreeViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService)
    ], TreeViewPane);
    exports.TreeViewPane = TreeViewPane;
    class Root {
        constructor() {
            this.label = { label: 'root' };
            this.handle = '0';
            this.parentHandle = undefined;
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.children = undefined;
        }
    }
    const noDataProviderMessage = nls_1.localize('no-dataprovider', "There is no data provider registered that can provide view data.");
    class Tree extends listService_1.WorkbenchAsyncDataTree {
    }
    let TreeView = class TreeView extends lifecycle_1.Disposable {
        constructor(id, _title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, contextKeyService) {
            super();
            this.id = id;
            this._title = _title;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.progressService = progressService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.viewDescriptorService = viewDescriptorService;
            this.isVisible = false;
            this._hasIconForParentNode = false;
            this._hasIconForLeafNode = false;
            this.focused = false;
            this._canSelectMany = false;
            this.elementsToRefresh = [];
            this._onDidExpandItem = this._register(new event_1.Emitter());
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = this._register(new event_1.Emitter());
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActions = this._register(new event_1.Emitter());
            this.onDidChangeActions = this._onDidChangeActions.event;
            this._onDidChangeWelcomeState = this._register(new event_1.Emitter());
            this.onDidChangeWelcomeState = this._onDidChangeWelcomeState.event;
            this._onDidChangeTitle = this._register(new event_1.Emitter());
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this._onDidCompleteRefresh = this._register(new event_1.Emitter());
            this._height = 0;
            this._width = 0;
            this.refreshing = false;
            this.root = new Root();
            this.collapseAllContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.enableCollapseAll`, false);
            this.collapseAllContext = this.collapseAllContextKey.bindTo(contextKeyService);
            this.refreshContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.enableRefresh`, false);
            this.refreshContext = this.refreshContextKey.bindTo(contextKeyService);
            this._register(this.themeService.onDidFileIconThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.themeService.onDidColorThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer.decorations')) {
                    this.doRefresh([this.root]); /** soft refresh **/
                }
            }));
            this._register(this.viewDescriptorService.onDidChangeLocation(({ views, from, to }) => {
                var _a;
                if (views.some(v => v.id === this.id)) {
                    (_a = this.tree) === null || _a === void 0 ? void 0 : _a.updateOptions({ overrideStyles: { listBackground: this.viewLocation === views_1.ViewContainerLocation.Sidebar ? theme_1.SIDE_BAR_BACKGROUND : theme_1.PANEL_BACKGROUND } });
                }
            }));
            this.registerActions();
            this.create();
        }
        get viewContainer() {
            return this.viewDescriptorService.getViewContainerByViewId(this.id);
        }
        get viewLocation() {
            return this.viewDescriptorService.getViewLocationById(this.id);
        }
        get dataProvider() {
            return this._dataProvider;
        }
        set dataProvider(dataProvider) {
            if (this.tree === undefined) {
                this.createTree();
            }
            if (dataProvider) {
                this._dataProvider = new class {
                    constructor() {
                        this._isEmpty = true;
                        this._onDidChangeEmpty = new event_1.Emitter();
                        this.onDidChangeEmpty = this._onDidChangeEmpty.event;
                    }
                    get isTreeEmpty() {
                        return this._isEmpty;
                    }
                    async getChildren(node) {
                        let children;
                        if (node && node.children) {
                            children = node.children;
                        }
                        else {
                            children = await (node instanceof Root ? dataProvider.getChildren() : dataProvider.getChildren(node));
                            node.children = children;
                        }
                        if (node instanceof Root) {
                            const oldEmpty = this._isEmpty;
                            this._isEmpty = children.length === 0;
                            if (oldEmpty !== this._isEmpty) {
                                this._onDidChangeEmpty.fire();
                            }
                        }
                        return children;
                    }
                };
                if (this._dataProvider.onDidChangeEmpty) {
                    this._register(this._dataProvider.onDidChangeEmpty(() => this._onDidChangeWelcomeState.fire()));
                }
                this.updateMessage();
                this.refresh();
            }
            else {
                this._dataProvider = undefined;
                this.updateMessage();
            }
            this._onDidChangeWelcomeState.fire();
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
            this._onDidChangeWelcomeState.fire();
        }
        get title() {
            return this._title;
        }
        set title(name) {
            this._title = name;
            this._onDidChangeTitle.fire(this._title);
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            this._canSelectMany = canSelectMany;
        }
        get hasIconForParentNode() {
            return this._hasIconForParentNode;
        }
        get hasIconForLeafNode() {
            return this._hasIconForLeafNode;
        }
        get visible() {
            return this.isVisible;
        }
        get showCollapseAllAction() {
            return !!this.collapseAllContext.get();
        }
        set showCollapseAllAction(showCollapseAllAction) {
            this.collapseAllContext.set(showCollapseAllAction);
        }
        get showRefreshAction() {
            return !!this.refreshContext.get();
        }
        set showRefreshAction(showRefreshAction) {
            this.refreshContext.set(showRefreshAction);
        }
        registerActions() {
            const that = this;
            this._register(actions_2.registerAction2(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.treeView.${that.id}.refresh`,
                        title: nls_1.localize('refresh', "Refresh"),
                        menu: {
                            id: actions_2.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', that.id), that.refreshContextKey),
                            group: 'navigation',
                            order: Number.MAX_SAFE_INTEGER - 1,
                        },
                        icon: { id: 'codicon/refresh' }
                    });
                }
                async run() {
                    return that.refresh();
                }
            }));
            this._register(actions_2.registerAction2(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.treeView.${that.id}.collapseAll`,
                        title: nls_1.localize('collapseAll', "Collapse All"),
                        menu: {
                            id: actions_2.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', that.id), that.collapseAllContextKey),
                            group: 'navigation',
                            order: Number.MAX_SAFE_INTEGER,
                        },
                        icon: { id: 'codicon/collapse-all' }
                    });
                }
                async run() {
                    if (that.tree) {
                        return new treeDefaults_1.CollapseAllAction(that.tree, true).run();
                    }
                }
            }));
        }
        setVisibility(isVisible) {
            isVisible = !!isVisible;
            if (this.isVisible === isVisible) {
                return;
            }
            this.isVisible = isVisible;
            if (this.tree) {
                if (this.isVisible) {
                    DOM.show(this.tree.getHTMLElement());
                }
                else {
                    DOM.hide(this.tree.getHTMLElement()); // make sure the tree goes out of the tabindex world by hiding it
                }
                if (this.isVisible && this.elementsToRefresh.length) {
                    this.doRefresh(this.elementsToRefresh);
                    this.elementsToRefresh = [];
                }
            }
            this._onDidChangeVisibility.fire(this.isVisible);
        }
        focus(reveal = true) {
            if (this.tree && this.root.children && this.root.children.length > 0) {
                // Make sure the current selected element is revealed
                const selectedElement = this.tree.getSelection()[0];
                if (selectedElement && reveal) {
                    this.tree.reveal(selectedElement, 0.5);
                }
                // Pass Focus to Viewer
                this.tree.domFocus();
            }
            else if (this.tree) {
                this.tree.domFocus();
            }
            else {
                this.domNode.focus();
            }
        }
        show(container) {
            DOM.append(container, this.domNode);
        }
        create() {
            this.domNode = DOM.$('.tree-explorer-viewlet-tree-view');
            this.messageElement = DOM.append(this.domNode, DOM.$('.message'));
            this.treeContainer = DOM.append(this.domNode, DOM.$('.customview-tree'));
            DOM.addClass(this.treeContainer, 'file-icon-themable-tree');
            DOM.addClass(this.treeContainer, 'show-file-icons');
            const focusTracker = this._register(DOM.trackFocus(this.domNode));
            this._register(focusTracker.onDidFocus(() => this.focused = true));
            this._register(focusTracker.onDidBlur(() => this.focused = false));
        }
        createTree() {
            const actionViewItemProvider = (action) => action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem, action) : undefined;
            const treeMenus = this._register(this.instantiationService.createInstance(TreeMenus, this.id));
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const dataSource = this.instantiationService.createInstance(TreeDataSource, this, (task) => this.progressService.withProgress({ location: this.id }, () => task));
            const aligner = new Aligner(this.themeService);
            const renderer = this.instantiationService.createInstance(TreeRenderer, this.id, treeMenus, this.treeLabels, actionViewItemProvider, aligner);
            const widgetAriaLabel = this._title;
            this.tree = this._register(this.instantiationService.createInstance(Tree, this.id, this.treeContainer, new TreeViewDelegate(), [renderer], dataSource, {
                identityProvider: new TreeViewIdentityProvider(),
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (element.accessibilityInformation) {
                            return element.accessibilityInformation.label;
                        }
                        return element.tooltip ? element.tooltip : element.label ? element.label.label : '';
                    },
                    getRole(element) {
                        var _a, _b;
                        return (_b = (_a = element.accessibilityInformation) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : 'treeitem';
                    },
                    getWidgetAriaLabel() {
                        return widgetAriaLabel;
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return item.label ? item.label.label : (item.resourceUri ? resources_1.basename(uri_1.URI.revive(item.resourceUri)) : undefined);
                    }
                },
                expandOnlyOnTwistieClick: (e) => !!e.command,
                collapseByDefault: (e) => {
                    return e.collapsibleState !== views_1.TreeItemCollapsibleState.Expanded;
                },
                multipleSelectionSupport: this.canSelectMany,
                overrideStyles: {
                    listBackground: this.viewLocation === views_1.ViewContainerLocation.Sidebar ? theme_1.SIDE_BAR_BACKGROUND : theme_1.PANEL_BACKGROUND
                }
            }));
            aligner.tree = this.tree;
            const actionRunner = new MultipleSelectionActionRunner(this.notificationService, () => this.tree.getSelection());
            renderer.actionRunner = actionRunner;
            this.tree.contextKeyService.createKey(this.id, true);
            this._register(this.tree.onContextMenu(e => this.onContextMenu(treeMenus, e, actionRunner)));
            this._register(this.tree.onDidChangeSelection(e => this._onDidChangeSelection.fire(e.elements)));
            this._register(this.tree.onDidChangeCollapseState(e => {
                if (!e.node.element) {
                    return;
                }
                const element = Array.isArray(e.node.element.element) ? e.node.element.element[0] : e.node.element.element;
                if (e.node.collapsed) {
                    this._onDidCollapseItem.fire(element);
                }
                else {
                    this._onDidExpandItem.fire(element);
                }
            }));
            this.tree.setInput(this.root).then(() => this.updateContentAreas());
            this._register(this.tree.onDidOpen(e => {
                if (!e.browserEvent) {
                    return;
                }
                const selection = this.tree.getSelection();
                if ((selection.length === 1) && selection[0].command) {
                    this.commandService.executeCommand(selection[0].command.id, ...(selection[0].command.arguments || []));
                }
            }));
        }
        onContextMenu(treeMenus, treeEvent, actionRunner) {
            const node = treeEvent.element;
            if (node === null) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            this.tree.setFocus([node]);
            const actions = treeMenus.getResourceContextActions(node);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionbar_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => ({ $treeViewId: this.id, $treeItemHandle: node.handle }),
                actionRunner
            });
        }
        updateMessage() {
            if (this._message) {
                this.showMessage(this._message);
            }
            else if (!this.dataProvider) {
                this.showMessage(noDataProviderMessage);
            }
            else {
                this.hideMessage();
            }
            this.updateContentAreas();
        }
        showMessage(message) {
            DOM.removeClass(this.messageElement, 'hide');
            this.resetMessageElement();
            this._messageValue = message;
            if (!strings_1.isFalsyOrWhitespace(this._message)) {
                this.messageElement.textContent = this._messageValue;
            }
            this.layout(this._height, this._width);
        }
        hideMessage() {
            this.resetMessageElement();
            DOM.addClass(this.messageElement, 'hide');
            this.layout(this._height, this._width);
        }
        resetMessageElement() {
            DOM.clearNode(this.messageElement);
        }
        layout(height, width) {
            if (height && width) {
                this._height = height;
                this._width = width;
                const treeHeight = height - DOM.getTotalHeight(this.messageElement);
                this.treeContainer.style.height = treeHeight + 'px';
                if (this.tree) {
                    this.tree.layout(treeHeight, width);
                }
            }
        }
        getOptimalWidth() {
            if (this.tree) {
                const parentNode = this.tree.getHTMLElement();
                const childNodes = [].slice.call(parentNode.querySelectorAll('.outline-item-label > a'));
                return DOM.getLargestChildWidth(parentNode, childNodes);
            }
            return 0;
        }
        async refresh(elements) {
            if (this.dataProvider && this.tree) {
                if (this.refreshing) {
                    await event_1.Event.toPromise(this._onDidCompleteRefresh.event);
                }
                if (!elements) {
                    elements = [this.root];
                    // remove all waiting elements to refresh if root is asked to refresh
                    this.elementsToRefresh = [];
                }
                for (const element of elements) {
                    element.children = undefined; // reset children
                }
                if (this.isVisible) {
                    return this.doRefresh(elements);
                }
                else {
                    if (this.elementsToRefresh.length) {
                        const seen = new Set();
                        this.elementsToRefresh.forEach(element => seen.add(element.handle));
                        for (const element of elements) {
                            if (!seen.has(element.handle)) {
                                this.elementsToRefresh.push(element);
                            }
                        }
                    }
                    else {
                        this.elementsToRefresh.push(...elements);
                    }
                }
            }
            return undefined;
        }
        async expand(itemOrItems) {
            const tree = this.tree;
            if (tree) {
                itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
                await Promise.all(itemOrItems.map(element => {
                    return tree.expand(element, false);
                }));
            }
        }
        setSelection(items) {
            if (this.tree) {
                this.tree.setSelection(items);
            }
        }
        setFocus(item) {
            if (this.tree) {
                this.focus();
                this.tree.setFocus([item]);
            }
        }
        async reveal(item) {
            if (this.tree) {
                return this.tree.reveal(item);
            }
        }
        async doRefresh(elements) {
            const tree = this.tree;
            if (tree && this.visible) {
                this.refreshing = true;
                await Promise.all(elements.map(element => tree.updateChildren(element, true, true)));
                this.refreshing = false;
                this._onDidCompleteRefresh.fire();
                this.updateContentAreas();
                if (this.focused) {
                    this.focus(false);
                }
            }
        }
        updateContentAreas() {
            const isTreeEmpty = !this.root.children || this.root.children.length === 0;
            // Hide tree container only when there is a message and tree is empty and not refreshing
            if (this._messageValue && isTreeEmpty && !this.refreshing) {
                DOM.addClass(this.treeContainer, 'hide');
                this.domNode.setAttribute('tabindex', '0');
            }
            else {
                DOM.removeClass(this.treeContainer, 'hide');
                this.domNode.removeAttribute('tabindex');
            }
        }
    };
    TreeView = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, contextkey_1.IContextKeyService)
    ], TreeView);
    exports.TreeView = TreeView;
    class TreeViewIdentityProvider {
        getId(element) {
            return element.handle;
        }
    }
    class TreeViewDelegate {
        getHeight(element) {
            return TreeRenderer.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
    }
    class TreeDataSource {
        constructor(treeView, withProgress) {
            this.treeView = treeView;
            this.withProgress = withProgress;
        }
        hasChildren(element) {
            return !!this.treeView.dataProvider && (element.collapsibleState !== views_1.TreeItemCollapsibleState.None);
        }
        async getChildren(element) {
            if (this.treeView.dataProvider) {
                return this.withProgress(this.treeView.dataProvider.getChildren(element));
            }
            return [];
        }
    }
    // todo@joh,sandy make this proper and contributable from extensions
    themeService_1.registerThemingParticipant((theme, collector) => {
        const matchBackgroundColor = theme.getColor(colorRegistry_1.listFilterMatchHighlight);
        if (matchBackgroundColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-list-row .content .monaco-highlighted-label .highlight { color: unset !important; background-color: ${matchBackgroundColor}; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; background-color: ${matchBackgroundColor}; }`);
        }
        const matchBorderColor = theme.getColor(colorRegistry_1.listFilterMatchHighlightBorder);
        if (matchBorderColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-list-row .content .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${matchBorderColor}; box-sizing: border-box; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${matchBorderColor}; box-sizing: border-box; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a { color: ${link}; }`);
        }
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a:focus { outline: 1px solid ${focusBorderColor}; outline-offset: -1px; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message code { background-color: ${codeBackground}; }`);
        }
    });
    let TreeRenderer = class TreeRenderer extends lifecycle_1.Disposable {
        constructor(treeViewId, menus, labels, actionViewItemProvider, aligner, themeService, configurationService, labelService) {
            super();
            this.treeViewId = treeViewId;
            this.menus = menus;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.aligner = aligner;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.labelService = labelService;
        }
        get templateId() {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        renderTemplate(container) {
            DOM.addClass(container, 'custom-view-tree-node-item');
            const icon = DOM.append(container, DOM.$('.custom-view-tree-node-item-icon'));
            const resourceLabel = this.labels.create(container, { supportHighlights: true });
            const actionsContainer = DOM.append(resourceLabel.element, DOM.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider
            });
            return { resourceLabel, icon, actionBar, container, elementDisposable: lifecycle_1.Disposable.None };
        }
        renderElement(element, index, templateData) {
            templateData.elementDisposable.dispose();
            const node = element.element;
            const resource = node.resourceUri ? uri_1.URI.revive(node.resourceUri) : null;
            const treeItemLabel = node.label ? node.label : resource ? { label: resources_1.basename(resource) } : undefined;
            const description = types_1.isString(node.description) ? node.description : resource && node.description === true ? this.labelService.getUriLabel(resources_1.dirname(resource), { relative: true }) : undefined;
            const label = treeItemLabel ? treeItemLabel.label : undefined;
            const matches = (treeItemLabel && treeItemLabel.highlights && label) ? treeItemLabel.highlights.map(([start, end]) => {
                if (start < 0) {
                    start = label.length + start;
                }
                if (end < 0) {
                    end = label.length + end;
                }
                if ((start >= label.length) || (end > label.length)) {
                    return ({ start: 0, end: 0 });
                }
                if (start > end) {
                    const swap = start;
                    start = end;
                    end = swap;
                }
                return ({ start, end });
            }) : undefined;
            const icon = this.themeService.getColorTheme().type === themeService_1.LIGHT ? node.icon : node.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : null;
            const title = node.tooltip ? node.tooltip : resource ? undefined : label;
            // reset
            templateData.actionBar.clear();
            if (resource || this.isFileKindThemeIcon(node.themeIcon)) {
                const fileDecorations = this.configurationService.getValue('explorer.decorations');
                templateData.resourceLabel.setResource({ name: label, description, resource: resource ? resource : uri_1.URI.parse('missing:_icon_resource') }, { fileKind: this.getFileKind(node), title, hideIcon: !!iconUrl, fileDecorations, extraClasses: ['custom-view-tree-node-item-resourceLabel'], matches: matches ? matches : filters_1.createMatches(element.filterData) });
            }
            else {
                templateData.resourceLabel.setResource({ name: label, description }, { title, hideIcon: true, extraClasses: ['custom-view-tree-node-item-resourceLabel'], matches: matches ? matches : filters_1.createMatches(element.filterData) });
            }
            templateData.icon.title = title ? title : '';
            if (iconUrl) {
                templateData.icon.className = 'custom-view-tree-node-item-icon';
                templateData.icon.style.backgroundImage = DOM.asCSSUrl(iconUrl);
            }
            else {
                let iconClass;
                if (node.themeIcon && !this.isFileKindThemeIcon(node.themeIcon)) {
                    iconClass = themeService_1.ThemeIcon.asClassName(node.themeIcon);
                }
                templateData.icon.className = iconClass ? `custom-view-tree-node-item-icon ${iconClass}` : '';
                templateData.icon.style.backgroundImage = '';
            }
            templateData.actionBar.context = { $treeViewId: this.treeViewId, $treeItemHandle: node.handle };
            templateData.actionBar.push(this.menus.getResourceActions(node), { icon: true, label: false });
            if (this._actionRunner) {
                templateData.actionBar.actionRunner = this._actionRunner;
            }
            this.setAlignment(templateData.container, node);
            templateData.elementDisposable = (this.themeService.onDidFileIconThemeChange(() => this.setAlignment(templateData.container, node)));
        }
        setAlignment(container, treeItem) {
            DOM.toggleClass(container.parentElement, 'align-icon-with-twisty', this.aligner.alignIconWithTwisty(treeItem));
        }
        isFileKindThemeIcon(icon) {
            if (icon) {
                return icon.id === themeService_1.FileThemeIcon.id || icon.id === themeService_1.FolderThemeIcon.id;
            }
            else {
                return false;
            }
        }
        getFileKind(node) {
            if (node.themeIcon) {
                switch (node.themeIcon.id) {
                    case themeService_1.FileThemeIcon.id:
                        return files_1.FileKind.FILE;
                    case themeService_1.FolderThemeIcon.id:
                        return files_1.FileKind.FOLDER;
                }
            }
            return node.collapsibleState === views_1.TreeItemCollapsibleState.Collapsed || node.collapsibleState === views_1.TreeItemCollapsibleState.Expanded ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
        }
        disposeElement(resource, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
            templateData.actionBar.dispose();
            templateData.elementDisposable.dispose();
        }
    };
    TreeRenderer.ITEM_HEIGHT = 22;
    TreeRenderer.TREE_TEMPLATE_ID = 'treeExplorer';
    TreeRenderer = __decorate([
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, label_1.ILabelService)
    ], TreeRenderer);
    class Aligner extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
        }
        set tree(tree) {
            this._tree = tree;
        }
        alignIconWithTwisty(treeItem) {
            if (treeItem.collapsibleState !== views_1.TreeItemCollapsibleState.None) {
                return false;
            }
            if (!this.hasIcon(treeItem)) {
                return false;
            }
            if (this._tree) {
                const parent = this._tree.getParentElement(treeItem) || this._tree.getInput();
                if (this.hasIcon(parent)) {
                    return false;
                }
                return !!parent.children && parent.children.every(c => c.collapsibleState === views_1.TreeItemCollapsibleState.None || !this.hasIcon(c));
            }
            else {
                return false;
            }
        }
        hasIcon(node) {
            const icon = this.themeService.getColorTheme().type === themeService_1.LIGHT ? node.icon : node.iconDark;
            if (icon) {
                return true;
            }
            if (node.resourceUri || node.themeIcon) {
                const fileIconTheme = this.themeService.getFileIconTheme();
                const isFolder = node.themeIcon ? node.themeIcon.id === themeService_1.FolderThemeIcon.id : node.collapsibleState !== views_1.TreeItemCollapsibleState.None;
                if (isFolder) {
                    return fileIconTheme.hasFileIcons && fileIconTheme.hasFolderIcons;
                }
                return fileIconTheme.hasFileIcons;
            }
            return false;
        }
    }
    class MultipleSelectionActionRunner extends actions_1.ActionRunner {
        constructor(notificationService, getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
            this._register(this.onDidRun(e => {
                if (e.error) {
                    notificationService.error(nls_1.localize('command-error', 'Error running command {1}: {0}. This is likely caused by the extension that contributes {1}.', e.error.message, e.action.id));
                }
            }));
        }
        runAction(action, context) {
            const selection = this.getSelectedResources();
            let selectionHandleArgs = undefined;
            let actionInSelected = false;
            if (selection.length > 1) {
                selectionHandleArgs = selection.map(selected => {
                    if (selected.handle === context.$treeItemHandle) {
                        actionInSelected = true;
                    }
                    return { $treeViewId: context.$treeViewId, $treeItemHandle: selected.handle };
                });
            }
            if (!actionInSelected) {
                selectionHandleArgs = undefined;
            }
            return action.run(...[context, selectionHandleArgs]);
        }
    }
    let TreeMenus = class TreeMenus extends lifecycle_1.Disposable {
        constructor(id, contextKeyService, menuService, contextMenuService) {
            super();
            this.id = id;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
        }
        getResourceActions(element) {
            return this.getActions(actions_2.MenuId.ViewItemContext, { key: 'viewItem', value: element.contextValue }).primary;
        }
        getResourceContextActions(element) {
            return this.getActions(actions_2.MenuId.ViewItemContext, { key: 'viewItem', value: element.contextValue }).secondary;
        }
        getActions(menuId, context) {
            const contextKeyService = this.contextKeyService.createScoped();
            contextKeyService.createKey('view', this.id);
            contextKeyService.createKey(context.key, context.value);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            menu.dispose();
            contextKeyService.dispose();
            return result;
        }
    };
    TreeMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService),
        __param(3, contextView_1.IContextMenuService)
    ], TreeMenus);
    let CustomTreeView = class CustomTreeView extends TreeView {
        constructor(id, title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, contextKeyService, extensionService) {
            super(id, title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, contextKeyService);
            this.extensionService = extensionService;
            this.activated = false;
        }
        setVisibility(isVisible) {
            super.setVisibility(isVisible);
            if (this.visible) {
                this.activate();
            }
        }
        activate() {
            if (!this.activated) {
                this.progressService.withProgress({ location: this.id }, () => this.extensionService.activateByEvent(`onView:${this.id}`))
                    .then(() => async_1.timeout(2000))
                    .then(() => {
                    this.updateMessage();
                });
                this.activated = true;
            }
        }
    };
    CustomTreeView = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, extensions_1.IExtensionService)
    ], CustomTreeView);
    exports.CustomTreeView = CustomTreeView;
});
//# __sourceMappingURL=treeView.js.map