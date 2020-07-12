/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/tree", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/common/iterator"], function (require, exports, abstractTree_1, tree_1, objectTreeModel_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTree = void 0;
    class DataTree extends abstractTree_1.AbstractTree {
        constructor(user, container, delegate, renderers, dataSource, options = {}) {
            super(user, container, delegate, renderers, options);
            this.user = user;
            this.dataSource = dataSource;
            this.nodesByIdentity = new Map();
            this.identityProvider = options.identityProvider;
        }
        // Model
        getInput() {
            return this.input;
        }
        setInput(input, viewState) {
            if (viewState && !this.identityProvider) {
                throw new tree_1.TreeError(this.user, 'Can\'t restore tree view state without an identity provider');
            }
            this.input = input;
            if (!viewState) {
                this._refresh(input);
                return;
            }
            const focus = [];
            const selection = [];
            const isCollapsed = (element) => {
                const id = this.identityProvider.getId(element).toString();
                return viewState.expanded.indexOf(id) === -1;
            };
            const onDidCreateNode = (node) => {
                const id = this.identityProvider.getId(node.element).toString();
                if (viewState.focus.indexOf(id) > -1) {
                    focus.push(node.element);
                }
                if (viewState.selection.indexOf(id) > -1) {
                    selection.push(node.element);
                }
            };
            this._refresh(input, isCollapsed, onDidCreateNode);
            this.setFocus(focus);
            this.setSelection(selection);
            if (viewState && typeof viewState.scrollTop === 'number') {
                this.scrollTop = viewState.scrollTop;
            }
        }
        updateChildren(element = this.input) {
            if (typeof this.input === 'undefined') {
                throw new tree_1.TreeError(this.user, 'Tree input not set');
            }
            let isCollapsed;
            if (this.identityProvider) {
                isCollapsed = element => {
                    const id = this.identityProvider.getId(element).toString();
                    const node = this.nodesByIdentity.get(id);
                    if (!node) {
                        return undefined;
                    }
                    return node.collapsed;
                };
            }
            this._refresh(element, isCollapsed);
        }
        resort(element = this.input, recursive = true) {
            this.model.resort((element === this.input ? null : element), recursive);
        }
        // View
        refresh(element) {
            if (element === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(element);
        }
        // Implementation
        _refresh(element, isCollapsed, onDidCreateNode) {
            let onDidDeleteNode;
            if (this.identityProvider) {
                const insertedElements = new Set();
                const outerOnDidCreateNode = onDidCreateNode;
                onDidCreateNode = (node) => {
                    const id = this.identityProvider.getId(node.element).toString();
                    insertedElements.add(id);
                    this.nodesByIdentity.set(id, node);
                    if (outerOnDidCreateNode) {
                        outerOnDidCreateNode(node);
                    }
                };
                onDidDeleteNode = (node) => {
                    const id = this.identityProvider.getId(node.element).toString();
                    if (!insertedElements.has(id)) {
                        this.nodesByIdentity.delete(id);
                    }
                };
            }
            this.model.setChildren((element === this.input ? null : element), this.iterate(element, isCollapsed).elements, onDidCreateNode, onDidDeleteNode);
        }
        iterate(element, isCollapsed) {
            const children = [...this.dataSource.getChildren(element)];
            const elements = iterator_1.Iterable.map(children, element => {
                const { elements: children, size } = this.iterate(element, isCollapsed);
                const collapsible = this.dataSource.hasChildren ? this.dataSource.hasChildren(element) : undefined;
                const collapsed = size === 0 ? undefined : (isCollapsed && isCollapsed(element));
                return { element, children, collapsible, collapsed };
            });
            return { elements, size: children.length };
        }
        createModel(user, view, options) {
            return new objectTreeModel_1.ObjectTreeModel(user, view, options);
        }
        // view state
        getViewState() {
            if (!this.identityProvider) {
                throw new tree_1.TreeError(this.user, 'Can\'t get tree view state without an identity provider');
            }
            const getId = (element) => this.identityProvider.getId(element).toString();
            const focus = this.getFocus().map(getId);
            const selection = this.getSelection().map(getId);
            const expanded = [];
            const root = this.model.getNode();
            const queue = [root];
            while (queue.length > 0) {
                const node = queue.shift();
                if (node !== root && node.collapsible && !node.collapsed) {
                    expanded.push(getId(node.element));
                }
                queue.push(...node.children);
            }
            return { focus, selection, expanded, scrollTop: this.scrollTop };
        }
    }
    exports.DataTree = DataTree;
});
//# __sourceMappingURL=dataTree.js.map