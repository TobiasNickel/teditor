/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/async", "vs/workbench/api/common/extHostTypes", "vs/base/common/types", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, resources_1, uri_1, event_1, lifecycle_1, async_1, extHostTypes_1, types_1, arrays_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTreeViews = void 0;
    function toTreeItemLabel(label, extension) {
        if (types_1.isString(label)) {
            return { label };
        }
        if (label
            && typeof label === 'object'
            && typeof label.label === 'string') {
            extensions_1.checkProposedApiEnabled(extension);
            let highlights = undefined;
            if (Array.isArray(label.highlights)) {
                highlights = label.highlights.filter((highlight => highlight.length === 2 && typeof highlight[0] === 'number' && typeof highlight[1] === 'number'));
                highlights = highlights.length ? highlights : undefined;
            }
            return { label: label.label, highlights };
        }
        return undefined;
    }
    class ExtHostTreeViews {
        constructor(_proxy, commands, logService) {
            this._proxy = _proxy;
            this.commands = commands;
            this.logService = logService;
            this.treeViews = new Map();
            function isTreeViewItemHandleArg(arg) {
                return arg && arg.$treeViewId && arg.$treeItemHandle;
            }
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (isTreeViewItemHandleArg(arg)) {
                        return this.convertArgument(arg);
                    }
                    else if (Array.isArray(arg) && (arg.length > 0)) {
                        return arg.map(item => {
                            if (isTreeViewItemHandleArg(item)) {
                                return this.convertArgument(item);
                            }
                            return item;
                        });
                    }
                    return arg;
                }
            });
        }
        registerTreeDataProvider(id, treeDataProvider, extension) {
            const treeView = this.createTreeView(id, { treeDataProvider }, extension);
            return { dispose: () => treeView.dispose() };
        }
        createTreeView(viewId, options, extension) {
            if (!options || !options.treeDataProvider) {
                throw new Error('Options with treeDataProvider is mandatory');
            }
            const treeView = this.createExtHostTreeView(viewId, options, extension);
            return {
                get onDidCollapseElement() { return treeView.onDidCollapseElement; },
                get onDidExpandElement() { return treeView.onDidExpandElement; },
                get selection() { return treeView.selectedElements; },
                get onDidChangeSelection() { return treeView.onDidChangeSelection; },
                get visible() { return treeView.visible; },
                get onDidChangeVisibility() { return treeView.onDidChangeVisibility; },
                get message() { return treeView.message; },
                set message(message) {
                    treeView.message = message;
                },
                get title() { return treeView.title; },
                set title(title) {
                    treeView.title = title;
                },
                reveal: (element, options) => {
                    return treeView.reveal(element, options);
                },
                dispose: () => {
                    this.treeViews.delete(viewId);
                    treeView.dispose();
                }
            };
        }
        $getChildren(treeViewId, treeItemHandle) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                return Promise.reject(new Error(nls_1.localize('treeView.notRegistered', 'No tree view with id \'{0}\' registered.', treeViewId)));
            }
            return treeView.getChildren(treeItemHandle);
        }
        $setExpanded(treeViewId, treeItemHandle, expanded) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new Error(nls_1.localize('treeView.notRegistered', 'No tree view with id \'{0}\' registered.', treeViewId));
            }
            treeView.setExpanded(treeItemHandle, expanded);
        }
        $setSelection(treeViewId, treeItemHandles) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new Error(nls_1.localize('treeView.notRegistered', 'No tree view with id \'{0}\' registered.', treeViewId));
            }
            treeView.setSelection(treeItemHandles);
        }
        $setVisible(treeViewId, isVisible) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new Error(nls_1.localize('treeView.notRegistered', 'No tree view with id \'{0}\' registered.', treeViewId));
            }
            treeView.setVisible(isVisible);
        }
        createExtHostTreeView(id, options, extension) {
            const treeView = new ExtHostTreeView(id, options, this._proxy, this.commands.converter, this.logService, extension);
            this.treeViews.set(id, treeView);
            return treeView;
        }
        convertArgument(arg) {
            const treeView = this.treeViews.get(arg.$treeViewId);
            return treeView ? treeView.getExtensionElement(arg.$treeItemHandle) : null;
        }
    }
    exports.ExtHostTreeViews = ExtHostTreeViews;
    class ExtHostTreeView extends lifecycle_1.Disposable {
        constructor(viewId, options, proxy, commands, logService, extension) {
            super();
            this.viewId = viewId;
            this.proxy = proxy;
            this.commands = commands;
            this.logService = logService;
            this.extension = extension;
            this.roots = null;
            this.elements = new Map();
            this.nodes = new Map();
            this._visible = false;
            this._selectedHandles = [];
            this._onDidExpandElement = this._register(new event_1.Emitter());
            this.onDidExpandElement = this._onDidExpandElement.event;
            this._onDidCollapseElement = this._register(new event_1.Emitter());
            this.onDidCollapseElement = this._onDidCollapseElement.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeData = this._register(new event_1.Emitter());
            this.refreshPromise = Promise.resolve();
            this.refreshQueue = Promise.resolve();
            this._message = '';
            this._title = '';
            if (extension.contributes && extension.contributes.views) {
                for (const location in extension.contributes.views) {
                    for (const view of extension.contributes.views[location]) {
                        if (view.id === viewId) {
                            this._title = view.name;
                        }
                    }
                }
            }
            this.dataProvider = options.treeDataProvider;
            this.proxy.$registerTreeViewDataProvider(viewId, { showCollapseAll: !!options.showCollapseAll, canSelectMany: !!options.canSelectMany });
            if (this.dataProvider.onDidChangeTreeData) {
                this._register(this.dataProvider.onDidChangeTreeData(element => this._onDidChangeData.fire({ message: false, element })));
            }
            let refreshingPromise;
            let promiseCallback;
            this._register(event_1.Event.debounce(this._onDidChangeData.event, (result, current) => {
                if (!result) {
                    result = { message: false, elements: [] };
                }
                if (current.element !== false) {
                    if (!refreshingPromise) {
                        // New refresh has started
                        refreshingPromise = new Promise(c => promiseCallback = c);
                        this.refreshPromise = this.refreshPromise.then(() => refreshingPromise);
                    }
                    result.elements.push(current.element);
                }
                if (current.message) {
                    result.message = true;
                }
                return result;
            }, 200, true)(({ message, elements }) => {
                if (elements.length) {
                    this.refreshQueue = this.refreshQueue.then(() => {
                        const _promiseCallback = promiseCallback;
                        refreshingPromise = null;
                        return this.refresh(elements).then(() => _promiseCallback());
                    });
                }
                if (message) {
                    this.proxy.$setMessage(this.viewId, this._message);
                }
            }));
        }
        get visible() { return this._visible; }
        get selectedElements() { return this._selectedHandles.map(handle => this.getExtensionElement(handle)).filter(element => !types_1.isUndefinedOrNull(element)); }
        getChildren(parentHandle) {
            const parentElement = parentHandle ? this.getExtensionElement(parentHandle) : undefined;
            if (parentHandle && !parentElement) {
                this.logService.error(`No tree item with id \'${parentHandle}\' found.`);
                return Promise.resolve([]);
            }
            const childrenNodes = this.getChildrenNodes(parentHandle); // Get it from cache
            return (childrenNodes ? Promise.resolve(childrenNodes) : this.fetchChildrenNodes(parentElement))
                .then(nodes => nodes.map(n => n.item));
        }
        getExtensionElement(treeItemHandle) {
            return this.elements.get(treeItemHandle);
        }
        reveal(element, options) {
            options = options ? options : { select: true, focus: false };
            const select = types_1.isUndefinedOrNull(options.select) ? true : options.select;
            const focus = types_1.isUndefinedOrNull(options.focus) ? false : options.focus;
            const expand = types_1.isUndefinedOrNull(options.expand) ? false : options.expand;
            if (typeof this.dataProvider.getParent !== 'function') {
                return Promise.reject(new Error(`Required registered TreeDataProvider to implement 'getParent' method to access 'reveal' method`));
            }
            return this.refreshPromise
                .then(() => this.resolveUnknownParentChain(element))
                .then(parentChain => this.resolveTreeNode(element, parentChain[parentChain.length - 1])
                .then(treeNode => this.proxy.$reveal(this.viewId, treeNode.item, parentChain.map(p => p.item), { select, focus, expand })), error => this.logService.error(error));
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this._onDidChangeData.fire({ message: true, element: false });
        }
        get title() {
            return this._title;
        }
        set title(title) {
            this._title = title;
            this.proxy.$setTitle(this.viewId, title);
        }
        setExpanded(treeItemHandle, expanded) {
            const element = this.getExtensionElement(treeItemHandle);
            if (element) {
                if (expanded) {
                    this._onDidExpandElement.fire(Object.freeze({ element }));
                }
                else {
                    this._onDidCollapseElement.fire(Object.freeze({ element }));
                }
            }
        }
        setSelection(treeItemHandles) {
            if (!arrays_1.equals(this._selectedHandles, treeItemHandles)) {
                this._selectedHandles = treeItemHandles;
                this._onDidChangeSelection.fire(Object.freeze({ selection: this.selectedElements }));
            }
        }
        setVisible(visible) {
            if (visible !== this._visible) {
                this._visible = visible;
                this._onDidChangeVisibility.fire(Object.freeze({ visible: this._visible }));
            }
        }
        resolveUnknownParentChain(element) {
            return this.resolveParent(element)
                .then((parent) => {
                if (!parent) {
                    return Promise.resolve([]);
                }
                return this.resolveUnknownParentChain(parent)
                    .then(result => this.resolveTreeNode(parent, result[result.length - 1])
                    .then(parentNode => {
                    result.push(parentNode);
                    return result;
                }));
            });
        }
        resolveParent(element) {
            const node = this.nodes.get(element);
            if (node) {
                return Promise.resolve(node.parent ? this.elements.get(node.parent.item.handle) : undefined);
            }
            return async_1.asPromise(() => this.dataProvider.getParent(element));
        }
        resolveTreeNode(element, parent) {
            const node = this.nodes.get(element);
            if (node) {
                return Promise.resolve(node);
            }
            return async_1.asPromise(() => this.dataProvider.getTreeItem(element))
                .then(extTreeItem => this.createHandle(element, extTreeItem, parent, true))
                .then(handle => this.getChildren(parent ? parent.item.handle : undefined)
                .then(() => {
                const cachedElement = this.getExtensionElement(handle);
                if (cachedElement) {
                    const node = this.nodes.get(cachedElement);
                    if (node) {
                        return Promise.resolve(node);
                    }
                }
                throw new Error(`Cannot resolve tree item for element ${handle}`);
            }));
        }
        getChildrenNodes(parentNodeOrHandle) {
            if (parentNodeOrHandle) {
                let parentNode;
                if (typeof parentNodeOrHandle === 'string') {
                    const parentElement = this.getExtensionElement(parentNodeOrHandle);
                    parentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                }
                else {
                    parentNode = parentNodeOrHandle;
                }
                return parentNode ? parentNode.children || null : null;
            }
            return this.roots;
        }
        fetchChildrenNodes(parentElement) {
            // clear children cache
            this.clearChildren(parentElement);
            const parentNode = parentElement ? this.nodes.get(parentElement) : undefined;
            return async_1.asPromise(() => this.dataProvider.getChildren(parentElement))
                .then(elements => Promise.all(arrays_1.coalesce(elements || [])
                .map(element => async_1.asPromise(() => this.dataProvider.getTreeItem(element))
                .then(extTreeItem => extTreeItem ? this.createAndRegisterTreeNode(element, extTreeItem, parentNode) : null))))
                .then(arrays_1.coalesce);
        }
        refresh(elements) {
            const hasRoot = elements.some(element => !element);
            if (hasRoot) {
                this.clearAll(); // clear cache
                return this.proxy.$refresh(this.viewId);
            }
            else {
                const handlesToRefresh = this.getHandlesToRefresh(elements);
                if (handlesToRefresh.length) {
                    return this.refreshHandles(handlesToRefresh);
                }
            }
            return Promise.resolve(undefined);
        }
        getHandlesToRefresh(elements) {
            const elementsToUpdate = new Set();
            for (const element of elements) {
                const elementNode = this.nodes.get(element);
                if (elementNode && !elementsToUpdate.has(elementNode.item.handle)) {
                    // check if an ancestor of extElement is already in the elements to update list
                    let currentNode = elementNode;
                    while (currentNode && currentNode.parent && !elementsToUpdate.has(currentNode.parent.item.handle)) {
                        const parentElement = this.elements.get(currentNode.parent.item.handle);
                        currentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                    }
                    if (currentNode && !currentNode.parent) {
                        elementsToUpdate.add(elementNode.item.handle);
                    }
                }
            }
            const handlesToUpdate = [];
            // Take only top level elements
            elementsToUpdate.forEach((handle) => {
                const element = this.elements.get(handle);
                if (element) {
                    const node = this.nodes.get(element);
                    if (node && (!node.parent || !elementsToUpdate.has(node.parent.item.handle))) {
                        handlesToUpdate.push(handle);
                    }
                }
            });
            return handlesToUpdate;
        }
        refreshHandles(itemHandles) {
            const itemsToRefresh = {};
            return Promise.all(itemHandles.map(treeItemHandle => this.refreshNode(treeItemHandle)
                .then(node => {
                if (node) {
                    itemsToRefresh[treeItemHandle] = node.item;
                }
            })))
                .then(() => Object.keys(itemsToRefresh).length ? this.proxy.$refresh(this.viewId, itemsToRefresh) : undefined);
        }
        refreshNode(treeItemHandle) {
            const extElement = this.getExtensionElement(treeItemHandle);
            if (extElement) {
                const existing = this.nodes.get(extElement);
                if (existing) {
                    this.clearChildren(extElement); // clear children cache
                    return async_1.asPromise(() => this.dataProvider.getTreeItem(extElement))
                        .then(extTreeItem => {
                        if (extTreeItem) {
                            const newNode = this.createTreeNode(extElement, extTreeItem, existing.parent);
                            this.updateNodeCache(extElement, newNode, existing, existing.parent);
                            existing.dispose();
                            return newNode;
                        }
                        return null;
                    });
                }
            }
            return Promise.resolve(null);
        }
        createAndRegisterTreeNode(element, extTreeItem, parentNode) {
            const node = this.createTreeNode(element, extTreeItem, parentNode);
            if (extTreeItem.id && this.elements.has(node.item.handle)) {
                throw new Error(nls_1.localize('treeView.duplicateElement', 'Element with id {0} is already registered', extTreeItem.id));
            }
            this.addNodeToCache(element, node);
            this.addNodeToParentCache(node, parentNode);
            return node;
        }
        createTreeNode(element, extensionTreeItem, parent) {
            const disposable = new lifecycle_1.DisposableStore();
            const handle = this.createHandle(element, extensionTreeItem, parent);
            const icon = this.getLightIconPath(extensionTreeItem);
            const item = {
                handle,
                parentHandle: parent ? parent.item.handle : undefined,
                label: toTreeItemLabel(extensionTreeItem.label, this.extension),
                description: extensionTreeItem.description,
                resourceUri: extensionTreeItem.resourceUri,
                tooltip: typeof extensionTreeItem.tooltip === 'string' ? extensionTreeItem.tooltip : undefined,
                command: extensionTreeItem.command ? this.commands.toInternal(extensionTreeItem.command, disposable) : undefined,
                contextValue: extensionTreeItem.contextValue,
                icon,
                iconDark: this.getDarkIconPath(extensionTreeItem) || icon,
                themeIcon: extensionTreeItem.iconPath instanceof extHostTypes_1.ThemeIcon ? { id: extensionTreeItem.iconPath.id } : undefined,
                collapsibleState: types_1.isUndefinedOrNull(extensionTreeItem.collapsibleState) ? extHostTypes_1.TreeItemCollapsibleState.None : extensionTreeItem.collapsibleState,
                accessibilityInformation: extensionTreeItem.accessibilityInformation
            };
            return {
                item,
                parent,
                children: undefined,
                dispose() { disposable.dispose(); }
            };
        }
        createHandle(element, { id, label, resourceUri }, parent, returnFirst) {
            if (id) {
                return `${ExtHostTreeView.ID_HANDLE_PREFIX}/${id}`;
            }
            const treeItemLabel = toTreeItemLabel(label, this.extension);
            const prefix = parent ? parent.item.handle : ExtHostTreeView.LABEL_HANDLE_PREFIX;
            let elementId = treeItemLabel ? treeItemLabel.label : resourceUri ? resources_1.basename(resourceUri) : '';
            elementId = elementId.indexOf('/') !== -1 ? elementId.replace('/', '//') : elementId;
            const existingHandle = this.nodes.has(element) ? this.nodes.get(element).item.handle : undefined;
            const childrenNodes = (this.getChildrenNodes(parent) || []);
            let handle;
            let counter = 0;
            do {
                handle = `${prefix}/${counter}:${elementId}`;
                if (returnFirst || !this.elements.has(handle) || existingHandle === handle) {
                    // Return first if asked for or
                    // Return if handle does not exist or
                    // Return if handle is being reused
                    break;
                }
                counter++;
            } while (counter <= childrenNodes.length);
            return handle;
        }
        getLightIconPath(extensionTreeItem) {
            if (extensionTreeItem.iconPath && !(extensionTreeItem.iconPath instanceof extHostTypes_1.ThemeIcon)) {
                if (typeof extensionTreeItem.iconPath === 'string'
                    || uri_1.URI.isUri(extensionTreeItem.iconPath)) {
                    return this.getIconPath(extensionTreeItem.iconPath);
                }
                return this.getIconPath(extensionTreeItem.iconPath.light);
            }
            return undefined;
        }
        getDarkIconPath(extensionTreeItem) {
            if (extensionTreeItem.iconPath && !(extensionTreeItem.iconPath instanceof extHostTypes_1.ThemeIcon) && extensionTreeItem.iconPath.dark) {
                return this.getIconPath(extensionTreeItem.iconPath.dark);
            }
            return undefined;
        }
        getIconPath(iconPath) {
            if (uri_1.URI.isUri(iconPath)) {
                return iconPath;
            }
            return uri_1.URI.file(iconPath);
        }
        addNodeToCache(element, node) {
            this.elements.set(node.item.handle, element);
            this.nodes.set(element, node);
        }
        updateNodeCache(element, newNode, existing, parentNode) {
            // Remove from the cache
            this.elements.delete(newNode.item.handle);
            this.nodes.delete(element);
            if (newNode.item.handle !== existing.item.handle) {
                this.elements.delete(existing.item.handle);
            }
            // Add the new node to the cache
            this.addNodeToCache(element, newNode);
            // Replace the node in parent's children nodes
            const childrenNodes = (this.getChildrenNodes(parentNode) || []);
            const childNode = childrenNodes.filter(c => c.item.handle === existing.item.handle)[0];
            if (childNode) {
                childrenNodes.splice(childrenNodes.indexOf(childNode), 1, newNode);
            }
        }
        addNodeToParentCache(node, parentNode) {
            if (parentNode) {
                if (!parentNode.children) {
                    parentNode.children = [];
                }
                parentNode.children.push(node);
            }
            else {
                if (!this.roots) {
                    this.roots = [];
                }
                this.roots.push(node);
            }
        }
        clearChildren(parentElement) {
            if (parentElement) {
                const node = this.nodes.get(parentElement);
                if (node) {
                    if (node.children) {
                        for (const child of node.children) {
                            const childElement = this.elements.get(child.item.handle);
                            if (childElement) {
                                this.clear(childElement);
                            }
                        }
                    }
                    node.children = undefined;
                }
            }
            else {
                this.clearAll();
            }
        }
        clear(element) {
            const node = this.nodes.get(element);
            if (node) {
                if (node.children) {
                    for (const child of node.children) {
                        const childElement = this.elements.get(child.item.handle);
                        if (childElement) {
                            this.clear(childElement);
                        }
                    }
                }
                this.nodes.delete(element);
                this.elements.delete(node.item.handle);
                node.dispose();
            }
        }
        clearAll() {
            this.roots = null;
            this.elements.clear();
            this.nodes.forEach(node => node.dispose());
            this.nodes.clear();
        }
        dispose() {
            this.clearAll();
        }
    }
    ExtHostTreeView.LABEL_HANDLE_PREFIX = '0';
    ExtHostTreeView.ID_HANDLE_PREFIX = '1';
});
//# __sourceMappingURL=extHostTreeViews.js.map