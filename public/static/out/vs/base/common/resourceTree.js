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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/map"], function (require, exports, decorators_1, paths, resources_1, uri_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceTree = void 0;
    class Node {
        constructor(uri, relativePath, context, element = undefined, parent = undefined) {
            this.uri = uri;
            this.relativePath = relativePath;
            this.context = context;
            this.element = element;
            this.parent = parent;
            this._children = new Map();
        }
        get childrenCount() {
            return this._children.size;
        }
        get children() {
            return this._children.values();
        }
        get name() {
            return paths.posix.basename(this.relativePath);
        }
        get(path) {
            return this._children.get(path);
        }
        set(path, child) {
            this._children.set(path, child);
        }
        delete(path) {
            this._children.delete(path);
        }
        clear() {
            this._children.clear();
        }
    }
    __decorate([
        decorators_1.memoize
    ], Node.prototype, "name", null);
    function collect(node, result) {
        if (typeof node.element !== 'undefined') {
            result.push(node.element);
        }
        for (const child of node.children) {
            collect(child, result);
        }
        return result;
    }
    class ResourceTree {
        constructor(context, rootURI = uri_1.URI.file('/')) {
            this.root = new Node(rootURI, '', context);
        }
        static getRoot(node) {
            while (node.parent) {
                node = node.parent;
            }
            return node;
        }
        static collect(node) {
            return collect(node, []);
        }
        static isResourceNode(obj) {
            return obj instanceof Node;
        }
        add(uri, element) {
            const key = resources_1.relativePath(this.root.uri, uri) || uri.fsPath;
            const iterator = new map_1.PathIterator(false).reset(key);
            let node = this.root;
            let path = '';
            while (true) {
                const name = iterator.value();
                path = path + '/' + name;
                let child = node.get(name);
                if (!child) {
                    child = new Node(resources_1.joinPath(this.root.uri, path), path, this.root.context, iterator.hasNext() ? undefined : element, node);
                    node.set(name, child);
                }
                else if (!iterator.hasNext()) {
                    child.element = element;
                }
                node = child;
                if (!iterator.hasNext()) {
                    return;
                }
                iterator.next();
            }
        }
        delete(uri) {
            const key = resources_1.relativePath(this.root.uri, uri) || uri.fsPath;
            const iterator = new map_1.PathIterator(false).reset(key);
            return this._delete(this.root, iterator);
        }
        _delete(node, iterator) {
            const name = iterator.value();
            const child = node.get(name);
            if (!child) {
                return undefined;
            }
            if (iterator.hasNext()) {
                const result = this._delete(child, iterator.next());
                if (typeof result !== 'undefined' && child.childrenCount === 0) {
                    node.delete(name);
                }
                return result;
            }
            node.delete(name);
            return child.element;
        }
        clear() {
            this.root.clear();
        }
        getNode(uri) {
            const key = resources_1.relativePath(this.root.uri, uri) || uri.fsPath;
            const iterator = new map_1.PathIterator(false).reset(key);
            let node = this.root;
            while (true) {
                const name = iterator.value();
                const child = node.get(name);
                if (!child || !iterator.hasNext()) {
                    return child;
                }
                node = child;
                iterator.next();
            }
        }
    }
    exports.ResourceTree = ResourceTree;
});
//# __sourceMappingURL=resourceTree.js.map