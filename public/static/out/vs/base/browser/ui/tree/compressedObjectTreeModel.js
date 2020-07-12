/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/event", "vs/base/browser/ui/tree/tree", "vs/base/browser/ui/tree/objectTreeModel"], function (require, exports, iterator_1, event_1, tree_1, objectTreeModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompressibleObjectTreeModel = exports.DefaultElementMapper = exports.CompressedObjectTreeModel = exports.decompress = exports.compress = void 0;
    function noCompress(element) {
        const elements = [element.element];
        const incompressible = element.incompressible || false;
        return {
            element: { elements, incompressible },
            children: iterator_1.Iterable.map(iterator_1.Iterable.from(element.children), noCompress),
            collapsible: element.collapsible,
            collapsed: element.collapsed
        };
    }
    // Exported only for test reasons, do not use directly
    function compress(element) {
        const elements = [element.element];
        const incompressible = element.incompressible || false;
        let childrenIterator;
        let children;
        while (true) {
            [children, childrenIterator] = iterator_1.Iterable.consume(iterator_1.Iterable.from(element.children), 2);
            if (children.length !== 1) {
                break;
            }
            element = children[0];
            if (element.incompressible) {
                break;
            }
            elements.push(element.element);
        }
        return {
            element: { elements, incompressible },
            children: iterator_1.Iterable.map(iterator_1.Iterable.concat(children, childrenIterator), compress),
            collapsible: element.collapsible,
            collapsed: element.collapsed
        };
    }
    exports.compress = compress;
    function _decompress(element, index = 0) {
        let children;
        if (index < element.element.elements.length - 1) {
            children = [_decompress(element, index + 1)];
        }
        else {
            children = iterator_1.Iterable.map(iterator_1.Iterable.from(element.children), el => _decompress(el, 0));
        }
        if (index === 0 && element.element.incompressible) {
            return {
                element: element.element.elements[index],
                children,
                incompressible: true,
                collapsible: element.collapsible,
                collapsed: element.collapsed
            };
        }
        return {
            element: element.element.elements[index],
            children,
            collapsible: element.collapsible,
            collapsed: element.collapsed
        };
    }
    // Exported only for test reasons, do not use directly
    function decompress(element) {
        return _decompress(element, 0);
    }
    exports.decompress = decompress;
    function splice(treeElement, element, children) {
        if (treeElement.element === element) {
            return Object.assign(Object.assign({}, treeElement), { children });
        }
        return Object.assign(Object.assign({}, treeElement), { children: iterator_1.Iterable.map(iterator_1.Iterable.from(treeElement.children), e => splice(e, element, children)) });
    }
    // Exported only for test reasons, do not use directly
    class CompressedObjectTreeModel {
        constructor(user, list, options = {}) {
            this.user = user;
            this.rootRef = null;
            this.nodes = new Map();
            this.model = new objectTreeModel_1.ObjectTreeModel(user, list, options);
            this.enabled = typeof options.compressionEnabled === 'undefined' ? true : options.compressionEnabled;
        }
        get onDidSplice() { return this.model.onDidSplice; }
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        get onDidChangeRenderNodeCount() { return this.model.onDidChangeRenderNodeCount; }
        get size() { return this.nodes.size; }
        setChildren(element, children = iterator_1.Iterable.empty()) {
            if (element === null) {
                const compressedChildren = iterator_1.Iterable.map(children, this.enabled ? compress : noCompress);
                this._setChildren(null, compressedChildren);
                return;
            }
            const compressedNode = this.nodes.get(element);
            if (!compressedNode) {
                throw new Error('Unknown compressed tree node');
            }
            const node = this.model.getNode(compressedNode);
            const compressedParentNode = this.model.getParentNodeLocation(compressedNode);
            const parent = this.model.getNode(compressedParentNode);
            const decompressedElement = decompress(node);
            const splicedElement = splice(decompressedElement, element, children);
            const recompressedElement = (this.enabled ? compress : noCompress)(splicedElement);
            const parentChildren = parent.children
                .map(child => child === node ? recompressedElement : child);
            this._setChildren(parent.element, parentChildren);
        }
        isCompressionEnabled() {
            return this.enabled;
        }
        setCompressionEnabled(enabled) {
            if (enabled === this.enabled) {
                return;
            }
            this.enabled = enabled;
            const root = this.model.getNode();
            const rootChildren = root.children;
            const decompressedRootChildren = iterator_1.Iterable.map(rootChildren, decompress);
            const recompressedRootChildren = iterator_1.Iterable.map(decompressedRootChildren, enabled ? compress : noCompress);
            this._setChildren(null, recompressedRootChildren);
        }
        _setChildren(node, children) {
            const insertedElements = new Set();
            const _onDidCreateNode = (node) => {
                for (const element of node.element.elements) {
                    insertedElements.add(element);
                    this.nodes.set(element, node.element);
                }
            };
            const _onDidDeleteNode = (node) => {
                for (const element of node.element.elements) {
                    if (!insertedElements.has(element)) {
                        this.nodes.delete(element);
                    }
                }
            };
            this.model.setChildren(node, children, _onDidCreateNode, _onDidDeleteNode);
        }
        has(element) {
            return this.nodes.has(element);
        }
        getListIndex(location) {
            const node = this.getCompressedNode(location);
            return this.model.getListIndex(node);
        }
        getListRenderCount(location) {
            const node = this.getCompressedNode(location);
            return this.model.getListRenderCount(node);
        }
        getNode(location) {
            if (typeof location === 'undefined') {
                return this.model.getNode();
            }
            const node = this.getCompressedNode(location);
            return this.model.getNode(node);
        }
        // TODO: review this
        getNodeLocation(node) {
            const compressedNode = this.model.getNodeLocation(node);
            if (compressedNode === null) {
                return null;
            }
            return compressedNode.elements[compressedNode.elements.length - 1];
        }
        // TODO: review this
        getParentNodeLocation(location) {
            const compressedNode = this.getCompressedNode(location);
            const parentNode = this.model.getParentNodeLocation(compressedNode);
            if (parentNode === null) {
                return null;
            }
            return parentNode.elements[parentNode.elements.length - 1];
        }
        getFirstElementChild(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.getFirstElementChild(compressedNode);
        }
        getLastElementAncestor(location) {
            const compressedNode = typeof location === 'undefined' ? undefined : this.getCompressedNode(location);
            return this.model.getLastElementAncestor(compressedNode);
        }
        isCollapsible(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.isCollapsible(compressedNode);
        }
        setCollapsible(location, collapsible) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.setCollapsible(compressedNode, collapsible);
        }
        isCollapsed(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.isCollapsed(compressedNode);
        }
        setCollapsed(location, collapsed, recursive) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.setCollapsed(compressedNode, collapsed, recursive);
        }
        expandTo(location) {
            const compressedNode = this.getCompressedNode(location);
            this.model.expandTo(compressedNode);
        }
        rerender(location) {
            const compressedNode = this.getCompressedNode(location);
            this.model.rerender(compressedNode);
        }
        refilter() {
            this.model.refilter();
        }
        resort(location = null, recursive = true) {
            const compressedNode = this.getCompressedNode(location);
            this.model.resort(compressedNode, recursive);
        }
        getCompressedNode(element) {
            if (element === null) {
                return null;
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return node;
        }
    }
    exports.CompressedObjectTreeModel = CompressedObjectTreeModel;
    exports.DefaultElementMapper = elements => elements[elements.length - 1];
    class CompressedTreeNodeWrapper {
        constructor(unwrapper, node) {
            this.unwrapper = unwrapper;
            this.node = node;
        }
        get element() { return this.node.element === null ? null : this.unwrapper(this.node.element); }
        get children() { return this.node.children.map(node => new CompressedTreeNodeWrapper(this.unwrapper, node)); }
        get depth() { return this.node.depth; }
        get visibleChildrenCount() { return this.node.visibleChildrenCount; }
        get visibleChildIndex() { return this.node.visibleChildIndex; }
        get collapsible() { return this.node.collapsible; }
        get collapsed() { return this.node.collapsed; }
        get visible() { return this.node.visible; }
        get filterData() { return this.node.filterData; }
    }
    function mapList(nodeMapper, list) {
        return {
            splice(start, deleteCount, toInsert) {
                list.splice(start, deleteCount, toInsert.map(node => nodeMapper.map(node)));
            }
        };
    }
    function mapOptions(compressedNodeUnwrapper, options) {
        return Object.assign(Object.assign({}, options), { sorter: options.sorter && {
                compare(node, otherNode) {
                    return options.sorter.compare(node.elements[0], otherNode.elements[0]);
                }
            }, identityProvider: options.identityProvider && {
                getId(node) {
                    return options.identityProvider.getId(compressedNodeUnwrapper(node));
                }
            }, filter: options.filter && {
                filter(node, parentVisibility) {
                    return options.filter.filter(compressedNodeUnwrapper(node), parentVisibility);
                }
            } });
    }
    class CompressibleObjectTreeModel {
        constructor(user, list, options = {}) {
            this.rootRef = null;
            this.elementMapper = options.elementMapper || exports.DefaultElementMapper;
            const compressedNodeUnwrapper = node => this.elementMapper(node.elements);
            this.nodeMapper = new tree_1.WeakMapper(node => new CompressedTreeNodeWrapper(compressedNodeUnwrapper, node));
            this.model = new CompressedObjectTreeModel(user, mapList(this.nodeMapper, list), mapOptions(compressedNodeUnwrapper, options));
        }
        get onDidSplice() {
            return event_1.Event.map(this.model.onDidSplice, ({ insertedNodes, deletedNodes }) => ({
                insertedNodes: insertedNodes.map(node => this.nodeMapper.map(node)),
                deletedNodes: deletedNodes.map(node => this.nodeMapper.map(node)),
            }));
        }
        get onDidChangeCollapseState() {
            return event_1.Event.map(this.model.onDidChangeCollapseState, ({ node, deep }) => ({
                node: this.nodeMapper.map(node),
                deep
            }));
        }
        get onDidChangeRenderNodeCount() {
            return event_1.Event.map(this.model.onDidChangeRenderNodeCount, node => this.nodeMapper.map(node));
        }
        setChildren(element, children = iterator_1.Iterable.empty()) {
            this.model.setChildren(element, children);
        }
        isCompressionEnabled() {
            return this.model.isCompressionEnabled();
        }
        setCompressionEnabled(enabled) {
            this.model.setCompressionEnabled(enabled);
        }
        has(location) {
            return this.model.has(location);
        }
        getListIndex(location) {
            return this.model.getListIndex(location);
        }
        getListRenderCount(location) {
            return this.model.getListRenderCount(location);
        }
        getNode(location) {
            return this.nodeMapper.map(this.model.getNode(location));
        }
        getNodeLocation(node) {
            return node.element;
        }
        getParentNodeLocation(location) {
            return this.model.getParentNodeLocation(location);
        }
        getFirstElementChild(location) {
            const result = this.model.getFirstElementChild(location);
            if (result === null || typeof result === 'undefined') {
                return result;
            }
            return this.elementMapper(result.elements);
        }
        getLastElementAncestor(location) {
            const result = this.model.getLastElementAncestor(location);
            if (result === null || typeof result === 'undefined') {
                return result;
            }
            return this.elementMapper(result.elements);
        }
        isCollapsible(location) {
            return this.model.isCollapsible(location);
        }
        setCollapsible(location, collapsed) {
            return this.model.setCollapsible(location, collapsed);
        }
        isCollapsed(location) {
            return this.model.isCollapsed(location);
        }
        setCollapsed(location, collapsed, recursive) {
            return this.model.setCollapsed(location, collapsed, recursive);
        }
        expandTo(location) {
            return this.model.expandTo(location);
        }
        rerender(location) {
            return this.model.rerender(location);
        }
        refilter() {
            return this.model.refilter();
        }
        resort(element = null, recursive = true) {
            return this.model.resort(element, recursive);
        }
        getCompressedTreeNode(location = null) {
            return this.model.getNode(location);
        }
    }
    exports.CompressibleObjectTreeModel = CompressibleObjectTreeModel;
});
//# __sourceMappingURL=compressedObjectTreeModel.js.map