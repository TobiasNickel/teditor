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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/path", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/base/common/labels", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/strings", "vs/base/common/async", "vs/workbench/browser/labels", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/platform/list/browser/listService", "vs/base/common/lifecycle", "vs/base/common/filters", "vs/workbench/contrib/debug/common/debugContentProvider", "vs/platform/label/common/label", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/path/common/pathService"], function (require, exports, nls, dom, path_1, viewPaneContainer_1, contextView_1, keybinding_1, instantiation_1, configuration_1, baseDebugView_1, debug_1, workspace_1, contextkey_1, labels_1, platform_1, uri_1, strings_1, async_1, labels_2, files_1, editorService_1, listService_1, lifecycle_1, filters_1, debugContentProvider_1, label_1, views_1, opener_1, themeService_1, telemetry_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoadedScriptsView = void 0;
    const NEW_STYLE_COMPRESS = true;
    // RFC 2396, Appendix A: https://www.ietf.org/rfc/rfc2396.txt
    const URI_SCHEMA_PATTERN = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/;
    class BaseTreeItem {
        constructor(_parent, _label, isIncompressible = false) {
            this._parent = _parent;
            this._label = _label;
            this.isIncompressible = isIncompressible;
            this._children = new Map();
            this._showedMoreThanOne = false;
        }
        isLeaf() {
            return this._children.size === 0;
        }
        getSession() {
            if (this._parent) {
                return this._parent.getSession();
            }
            return undefined;
        }
        setSource(session, source) {
            this._source = source;
            this._children.clear();
            if (source.raw && source.raw.sources) {
                for (const src of source.raw.sources) {
                    if (src.name && src.path) {
                        const s = new BaseTreeItem(this, src.name);
                        this._children.set(src.path, s);
                        const ss = session.getSource(src);
                        s.setSource(session, ss);
                    }
                }
            }
        }
        createIfNeeded(key, factory) {
            let child = this._children.get(key);
            if (!child) {
                child = factory(this, key);
                this._children.set(key, child);
            }
            return child;
        }
        getChild(key) {
            return this._children.get(key);
        }
        remove(key) {
            this._children.delete(key);
        }
        removeFromParent() {
            if (this._parent) {
                this._parent.remove(this._label);
                if (this._parent._children.size === 0) {
                    this._parent.removeFromParent();
                }
            }
        }
        getTemplateId() {
            return 'id';
        }
        // a dynamic ID based on the parent chain; required for reparenting (see #55448)
        getId() {
            const parent = this.getParent();
            return parent ? `${parent.getId()}/${this.getInternalId()}` : this.getInternalId();
        }
        getInternalId() {
            return this._label;
        }
        // skips intermediate single-child nodes
        getParent() {
            if (this._parent) {
                if (this._parent.isSkipped()) {
                    return this._parent.getParent();
                }
                return this._parent;
            }
            return undefined;
        }
        isSkipped() {
            if (this._parent) {
                if (this._parent.oneChild()) {
                    return true; // skipped if I'm the only child of my parents
                }
                return false;
            }
            return true; // roots are never skipped
        }
        // skips intermediate single-child nodes
        hasChildren() {
            const child = this.oneChild();
            if (child) {
                return child.hasChildren();
            }
            return this._children.size > 0;
        }
        // skips intermediate single-child nodes
        getChildren() {
            const child = this.oneChild();
            if (child) {
                return child.getChildren();
            }
            const array = [];
            for (let child of this._children.values()) {
                array.push(child);
            }
            return array.sort((a, b) => this.compare(a, b));
        }
        // skips intermediate single-child nodes
        getLabel(separateRootFolder = true) {
            const child = this.oneChild();
            if (child) {
                const sep = (this instanceof RootFolderTreeItem && separateRootFolder) ? ' • ' : path_1.posix.sep;
                return `${this._label}${sep}${child.getLabel()}`;
            }
            return this._label;
        }
        // skips intermediate single-child nodes
        getHoverLabel() {
            if (this._source && this._parent && this._parent._source) {
                return this._source.raw.path || this._source.raw.name;
            }
            let label = this.getLabel(false);
            const parent = this.getParent();
            if (parent) {
                const hover = parent.getHoverLabel();
                if (hover) {
                    return `${hover}/${label}`;
                }
            }
            return label;
        }
        // skips intermediate single-child nodes
        getSource() {
            const child = this.oneChild();
            if (child) {
                return child.getSource();
            }
            return this._source;
        }
        compare(a, b) {
            if (a._label && b._label) {
                return a._label.localeCompare(b._label);
            }
            return 0;
        }
        oneChild() {
            if (!this._source && !this._showedMoreThanOne && this.skipOneChild()) {
                if (this._children.size === 1) {
                    return this._children.values().next().value;
                }
                // if a node had more than one child once, it will never be skipped again
                if (this._children.size > 1) {
                    this._showedMoreThanOne = true;
                }
            }
            return undefined;
        }
        skipOneChild() {
            if (NEW_STYLE_COMPRESS) {
                // if the root node has only one Session, don't show the session
                return this instanceof RootTreeItem;
            }
            else {
                return !(this instanceof RootFolderTreeItem) && !(this instanceof SessionTreeItem);
            }
        }
    }
    class RootFolderTreeItem extends BaseTreeItem {
        constructor(parent, folder) {
            super(parent, folder.name, true);
            this.folder = folder;
        }
    }
    class RootTreeItem extends BaseTreeItem {
        constructor(_pathService, _contextService, _labelService) {
            super(undefined, 'Root');
            this._pathService = _pathService;
            this._contextService = _contextService;
            this._labelService = _labelService;
        }
        add(session) {
            return this.createIfNeeded(session.getId(), () => new SessionTreeItem(this._labelService, this, session, this._pathService, this._contextService));
        }
        find(session) {
            return this.getChild(session.getId());
        }
    }
    class SessionTreeItem extends BaseTreeItem {
        constructor(labelService, parent, session, _pathService, rootProvider) {
            super(parent, session.getLabel(), true);
            this._pathService = _pathService;
            this.rootProvider = rootProvider;
            this._map = new Map();
            this._labelService = labelService;
            this._session = session;
        }
        getInternalId() {
            return this._session.getId();
        }
        getSession() {
            return this._session;
        }
        getHoverLabel() {
            return undefined;
        }
        hasChildren() {
            return true;
        }
        compare(a, b) {
            const acat = this.category(a);
            const bcat = this.category(b);
            if (acat !== bcat) {
                return acat - bcat;
            }
            return super.compare(a, b);
        }
        category(item) {
            // workspace scripts come at the beginning in "folder" order
            if (item instanceof RootFolderTreeItem) {
                return item.folder.index;
            }
            // <...> come at the very end
            const l = item.getLabel();
            if (l && /^<.+>$/.test(l)) {
                return 1000;
            }
            // everything else in between
            return 999;
        }
        addPath(source) {
            let folder;
            let url;
            let path = source.raw.path;
            if (!path) {
                return;
            }
            if (this._labelService && URI_SCHEMA_PATTERN.test(path)) {
                path = this._labelService.getUriLabel(uri_1.URI.parse(path));
            }
            const match = SessionTreeItem.URL_REGEXP.exec(path);
            if (match && match.length === 3) {
                url = match[1];
                path = decodeURI(match[2]);
            }
            else {
                if (path_1.isAbsolute(path)) {
                    const resource = uri_1.URI.file(path);
                    // return early if we can resolve a relative path label from the root folder
                    folder = this.rootProvider ? this.rootProvider.getWorkspaceFolder(resource) : null;
                    if (folder) {
                        // strip off the root folder path
                        path = path_1.normalize(strings_1.ltrim(resource.path.substr(folder.uri.path.length), path_1.posix.sep));
                        const hasMultipleRoots = this.rootProvider.getWorkspace().folders.length > 1;
                        if (hasMultipleRoots) {
                            path = path_1.posix.sep + path;
                        }
                        else {
                            // don't show root folder
                            folder = null;
                        }
                    }
                    else {
                        // on unix try to tildify absolute paths
                        path = path_1.normalize(path);
                        const userHome = this._pathService.resolvedUserHome;
                        if (userHome && !platform_1.isWindows) {
                            path = labels_1.tildify(path, userHome.fsPath);
                        }
                    }
                }
            }
            let leaf = this;
            path.split(/[\/\\]/).forEach((segment, i) => {
                if (i === 0 && folder) {
                    const f = folder;
                    leaf = leaf.createIfNeeded(folder.name, parent => new RootFolderTreeItem(parent, f));
                }
                else if (i === 0 && url) {
                    leaf = leaf.createIfNeeded(url, parent => new BaseTreeItem(parent, url));
                }
                else {
                    leaf = leaf.createIfNeeded(segment, parent => new BaseTreeItem(parent, segment));
                }
            });
            leaf.setSource(this._session, source);
            if (source.raw.path) {
                this._map.set(source.raw.path, leaf);
            }
        }
        removePath(source) {
            if (source.raw.path) {
                const leaf = this._map.get(source.raw.path);
                if (leaf) {
                    leaf.removeFromParent();
                    return true;
                }
            }
            return false;
        }
    }
    SessionTreeItem.URL_REGEXP = /^(https?:\/\/[^/]+)(\/.*)$/;
    /**
     * This maps a model item into a view model item.
     */
    function asTreeElement(item, viewState) {
        const children = item.getChildren();
        const collapsed = viewState ? !viewState.expanded.has(item.getId()) : !(item instanceof SessionTreeItem);
        return {
            element: item,
            collapsed,
            collapsible: item.hasChildren(),
            children: children.map(i => asTreeElement(i, viewState))
        };
    }
    let LoadedScriptsView = class LoadedScriptsView extends viewPaneContainer_1.ViewPane {
        constructor(options, contextMenuService, keybindingService, instantiationService, viewDescriptorService, configurationService, editorService, contextKeyService, contextService, debugService, labelService, pathService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.debugService = debugService;
            this.labelService = labelService;
            this.pathService = pathService;
            this.treeNeedsRefreshOnVisible = false;
            this.loadedScriptsItemType = debug_1.CONTEXT_LOADED_SCRIPTS_ITEM_TYPE.bindTo(contextKeyService);
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(this.element, 'debug-pane');
            dom.addClass(container, 'debug-loaded-scripts');
            dom.addClass(container, 'show-file-icons');
            this.treeContainer = baseDebugView_1.renderViewTree(container);
            this.filter = new LoadedScriptsFilter();
            const root = new RootTreeItem(this.pathService, this.contextService, this.labelService);
            this.treeLabels = this.instantiationService.createInstance(labels_2.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(this.treeLabels);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'LoadedScriptsView', this.treeContainer, new LoadedScriptsDelegate(), [new LoadedScriptsRenderer(this.treeLabels)], {
                compressionEnabled: NEW_STYLE_COMPRESS,
                collapseByDefault: true,
                hideTwistiesOfChildlessElements: true,
                identityProvider: {
                    getId: (element) => element.getId()
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (element) => {
                        return element.getLabel();
                    },
                    getCompressedNodeKeyboardNavigationLabel: (elements) => {
                        return elements.map(e => e.getLabel()).join('/');
                    }
                },
                filter: this.filter,
                accessibilityProvider: new LoadedSciptsAccessibilityProvider(),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            const updateView = (viewState) => this.tree.setChildren(null, asTreeElement(root, viewState).children);
            updateView();
            this.changeScheduler = new async_1.RunOnceScheduler(() => {
                this.treeNeedsRefreshOnVisible = false;
                if (this.tree) {
                    updateView();
                }
            }, 300);
            this._register(this.changeScheduler);
            this._register(this.tree.onDidOpen(e => {
                if (e.element instanceof BaseTreeItem) {
                    const source = e.element.getSource();
                    if (source && source.available) {
                        const nullRange = { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 };
                        source.openInEditor(this.editorService, nullRange, e.editorOptions.preserveFocus, e.sideBySide, e.editorOptions.pinned);
                    }
                }
            }));
            this._register(this.tree.onDidChangeFocus(() => {
                const focus = this.tree.getFocus();
                if (focus instanceof SessionTreeItem) {
                    this.loadedScriptsItemType.set('session');
                }
                else {
                    this.loadedScriptsItemType.reset();
                }
            }));
            const scheduleRefreshOnVisible = () => {
                if (this.isBodyVisible()) {
                    this.changeScheduler.schedule();
                }
                else {
                    this.treeNeedsRefreshOnVisible = true;
                }
            };
            const addSourcePathsToSession = (session) => {
                const sessionNode = root.add(session);
                return session.getLoadedSources().then(paths => {
                    paths.forEach(path => sessionNode.addPath(path));
                    scheduleRefreshOnVisible();
                });
            };
            const registerSessionListeners = (session) => {
                this._register(session.onDidChangeName(() => {
                    // Re-add session, this will trigger proper sorting and id recalculation.
                    root.remove(session.getId());
                    addSourcePathsToSession(session);
                }));
                this._register(session.onDidLoadedSource(event => {
                    let sessionRoot;
                    switch (event.reason) {
                        case 'new':
                        case 'changed':
                            sessionRoot = root.add(session);
                            sessionRoot.addPath(event.source);
                            scheduleRefreshOnVisible();
                            if (event.reason === 'changed') {
                                debugContentProvider_1.DebugContentProvider.refreshDebugContent(event.source.uri);
                            }
                            break;
                        case 'removed':
                            sessionRoot = root.find(session);
                            if (sessionRoot && sessionRoot.removePath(event.source)) {
                                scheduleRefreshOnVisible();
                            }
                            break;
                        default:
                            this.filter.setFilter(event.source.name);
                            this.tree.refilter();
                            break;
                    }
                }));
            };
            this._register(this.debugService.onDidNewSession(registerSessionListeners));
            this.debugService.getModel().getSessions().forEach(registerSessionListeners);
            this._register(this.debugService.onDidEndSession(session => {
                root.remove(session.getId());
                this.changeScheduler.schedule();
            }));
            this.changeScheduler.schedule(0);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.treeNeedsRefreshOnVisible) {
                    this.changeScheduler.schedule();
                }
            }));
            // feature: expand all nodes when filtering (not when finding)
            let viewState;
            this._register(this.tree.onDidChangeTypeFilterPattern(pattern => {
                if (!this.tree.options.filterOnType) {
                    return;
                }
                if (!viewState && pattern) {
                    const expanded = new Set();
                    const visit = (node) => {
                        if (node.element && !node.collapsed) {
                            expanded.add(node.element.getId());
                        }
                        for (const child of node.children) {
                            visit(child);
                        }
                    };
                    visit(this.tree.getNode());
                    viewState = { expanded };
                    this.tree.expandAll();
                }
                else if (!pattern && viewState) {
                    this.tree.setFocus([]);
                    updateView(viewState);
                    viewState = undefined;
                }
            }));
            // populate tree model with source paths from all debug sessions
            this.debugService.getModel().getSessions().forEach(session => addSourcePathsToSession(session));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        dispose() {
            lifecycle_1.dispose(this.tree);
            lifecycle_1.dispose(this.treeLabels);
            super.dispose();
        }
    };
    LoadedScriptsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, views_1.IViewDescriptorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, debug_1.IDebugService),
        __param(10, label_1.ILabelService),
        __param(11, pathService_1.IPathService),
        __param(12, opener_1.IOpenerService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService)
    ], LoadedScriptsView);
    exports.LoadedScriptsView = LoadedScriptsView;
    class LoadedScriptsDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return LoadedScriptsRenderer.ID;
        }
    }
    class LoadedScriptsRenderer {
        constructor(labels) {
            this.labels = labels;
        }
        get templateId() {
            return LoadedScriptsRenderer.ID;
        }
        renderTemplate(container) {
            const label = this.labels.create(container, { supportHighlights: true });
            return { label };
        }
        renderElement(node, index, data) {
            const element = node.element;
            const label = element.getLabel();
            this.render(element, label, data, node.filterData);
        }
        renderCompressedElements(node, index, data, height) {
            const element = node.element.elements[node.element.elements.length - 1];
            const labels = node.element.elements.map(e => e.getLabel());
            this.render(element, labels, data, node.filterData);
        }
        render(element, labels, data, filterData) {
            const label = {
                name: labels
            };
            const options = {
                title: element.getHoverLabel()
            };
            if (element instanceof RootFolderTreeItem) {
                options.fileKind = files_1.FileKind.ROOT_FOLDER;
            }
            else if (element instanceof SessionTreeItem) {
                options.title = nls.localize('loadedScriptsSession', "Debug Session");
                options.hideIcon = true;
            }
            else if (element instanceof BaseTreeItem) {
                const src = element.getSource();
                if (src && src.uri) {
                    label.resource = src.uri;
                    options.fileKind = files_1.FileKind.FILE;
                }
                else {
                    options.fileKind = files_1.FileKind.FOLDER;
                }
            }
            options.matches = filters_1.createMatches(filterData);
            data.label.setResource(label, options);
        }
        disposeTemplate(templateData) {
            templateData.label.dispose();
        }
    }
    LoadedScriptsRenderer.ID = 'lsrenderer';
    class LoadedSciptsAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'loadedScriptsAriaLabel' }, "Debug Loaded Scripts");
        }
        getAriaLabel(element) {
            if (element instanceof RootFolderTreeItem) {
                return nls.localize('loadedScriptsRootFolderAriaLabel', "Workspace folder {0}, loaded script, debug", element.getLabel());
            }
            if (element instanceof SessionTreeItem) {
                return nls.localize('loadedScriptsSessionAriaLabel', "Session {0}, loaded script, debug", element.getLabel());
            }
            if (element.hasChildren()) {
                return nls.localize('loadedScriptsFolderAriaLabel', "Folder {0}, loaded script, debug", element.getLabel());
            }
            else {
                return nls.localize('loadedScriptsSourceAriaLabel', "{0}, loaded script, debug", element.getLabel());
            }
        }
    }
    class LoadedScriptsFilter {
        setFilter(filterText) {
            this.filterText = filterText;
        }
        filter(element, parentVisibility) {
            if (!this.filterText) {
                return 1 /* Visible */;
            }
            if (element.isLeaf()) {
                const name = element.getLabel();
                if (name.indexOf(this.filterText) >= 0) {
                    return 1 /* Visible */;
                }
                return 0 /* Hidden */;
            }
            return 2 /* Recurse */;
        }
    }
});
//# __sourceMappingURL=loadedScriptsView.js.map