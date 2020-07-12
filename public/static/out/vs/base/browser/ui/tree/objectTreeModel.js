/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/browser/ui/tree/tree", "vs/base/common/arrays"], function (require, exports, iterator_1, indexTreeModel_1, tree_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectTreeModel = void 0;
    class ObjectTreeModel {
        constructor(user, list, options = {}) {
            this.user = user;
            this.rootRef = null;
            this.nodes = new Map();
            this.nodesByIdentity = new Map();
            this.model = new indexTreeModel_1.IndexTreeModel(user, list, null, options);
            this.onDidSplice = this.model.onDidSplice;
            this.onDidChangeCollapseState = this.model.onDidChangeCollapseState;
            this.onDidChangeRenderNodeCount = this.model.onDidChangeRenderNodeCount;
            if (options.sorter) {
                this.sorter = {
                    compare(a, b) {
                        return options.sorter.compare(a.element, b.element);
                    }
                };
            }
            this.identityProvider = options.identityProvider;
        }
        get size() { return this.nodes.size; }
        setChildren(element, children = iterator_1.Iterable.empty(), onDidCreateNode, onDidDeleteNode) {
            const location = this.getElementLocation(element);
            this._setChildren(location, this.preserveCollapseState(children), onDidCreateNode, onDidDeleteNode);
        }
        _setChildren(location, children = iterator_1.Iterable.empty(), onDidCreateNode, onDidDeleteNode) {
            const insertedElements = new Set();
            const insertedElementIds = new Set();
            const _onDidCreateNode = (node) => {
                if (node.element === null) {
                    return;
                }
                const tnode = node;
                insertedElements.add(tnode.element);
                this.nodes.set(tnode.element, tnode);
                if (this.identityProvider) {
                    const id = this.identityProvider.getId(tnode.element).toString();
                    insertedElementIds.add(id);
                    this.nodesByIdentity.set(id, tnode);
                }
                if (onDidCreateNode) {
                    onDidCreateNode(tnode);
                }
            };
            const _onDidDeleteNode = (node) => {
                if (node.element === null) {
                    return;
                }
                const tnode = node;
                if (!insertedElements.has(tnode.element)) {
                    this.nodes.delete(tnode.element);
                }
                if (this.identityProvider) {
                    const id = this.identityProvider.getId(tnode.element).toString();
                    if (!insertedElementIds.has(id)) {
                        this.nodesByIdentity.delete(id);
                    }
                }
                if (onDidDeleteNode) {
                    onDidDeleteNode(tnode);
                }
            };
            this.model.splice([...location, 0], Number.MAX_VALUE, children, _onDidCreateNode, _onDidDeleteNode);
        }
        preserveCollapseState(elements = iterator_1.Iterable.empty()) {
            if (this.sorter) {
                elements = arrays_1.mergeSort([...elements], this.sorter.compare.bind(this.sorter));
            }
            return iterator_1.Iterable.map(elements, treeElement => {
                let node = this.nodes.get(treeElement.element);
                if (!node && this.identityProvider) {
                    const id = this.identityProvider.getId(treeElement.element).toString();
                    node = this.nodesByIdentity.get(id);
                }
                if (!node) {
                    return Object.assign(Object.assign({}, treeElement), { children: this.preserveCollapseState(treeElement.children) });
                }
                const collapsible = typeof treeElement.collapsible === 'boolean' ? treeElement.collapsible : node.collapsible;
                const collapsed = typeof treeElement.collapsed !== 'undefined' ? treeElement.collapsed : node.collapsed;
                return Object.assign(Object.assign({}, treeElement), { collapsible,
                    collapsed, children: this.preserveCollapseState(treeElement.children) });
            });
        }
        rerender(element) {
            const location = this.getElementLocation(element);
            this.model.rerender(location);
        }
        resort(element = null, recursive = true) {
            if (!this.sorter) {
                return;
            }
            const location = this.getElementLocation(element);
            const node = this.model.getNode(location);
            this._setChildren(location, this.resortChildren(node, recursive));
        }
        resortChildren(node, recursive, first = true) {
            let childrenNodes = [...node.children];
            if (recursive || first) {
                childrenNodes = arrays_1.mergeSort(childrenNodes, this.sorter.compare.bind(this.sorter));
            }
            return iterator_1.Iterable.map(childrenNodes, node => ({
                element: node.element,
                collapsible: node.collapsible,
                collapsed: node.collapsed,
                children: this.resortChildren(node, recursive, false)
            }));
        }
        getFirstElementChild(ref = null) {
            const location = this.getElementLocation(ref);
            return this.model.getFirstElementChild(location);
        }
        getLastElementAncestor(ref = null) {
            const location = this.getElementLocation(ref);
            return this.model.getLastElementAncestor(location);
        }
        has(element) {
            return this.nodes.has(element);
        }
        getListIndex(element) {
            const location = this.getElementLocation(element);
            return this.model.getListIndex(location);
        }
        getListRenderCount(element) {
            const location = this.getElementLocation(element);
            return this.model.getListRenderCount(location);
        }
        isCollapsible(element) {
            const location = this.getElementLocation(element);
            return this.model.isCollapsible(location);
        }
        setCollapsible(element, collapsible) {
            const location = this.getElementLocation(element);
            return this.model.setCollapsible(location, collapsible);
        }
        isCollapsed(element) {
            const location = this.getElementLocation(element);
            return this.model.isCollapsed(location);
        }
        setCollapsed(element, collapsed, recursive) {
            const location = this.getElementLocation(element);
            return this.model.setCollapsed(location, collapsed, recursive);
        }
        expandTo(element) {
            const location = this.getElementLocation(element);
            this.model.expandTo(location);
        }
        refilter() {
            this.model.refilter();
        }
        getNode(element = null) {
            if (element === null) {
                return this.model.getNode(this.model.rootRef);
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return node;
        }
        getNodeLocation(node) {
            return node.element;
        }
        getParentNodeLocation(element) {
            if (element === null) {
                throw new tree_1.TreeError(this.user, `Invalid getParentNodeLocation call`);
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            const location = this.model.getNodeLocation(node);
            const parentLocation = this.model.getParentNodeLocation(location);
            const parent = this.model.getNode(parentLocation);
            return parent.element;
        }
        getElementLocation(element) {
            if (element === null) {
                return [];
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return this.model.getNodeLocation(node);
        }
    }
    exports.ObjectTreeModel = ObjectTreeModel;
});
//# __sourceMappingURL=objectTreeModel.js.map