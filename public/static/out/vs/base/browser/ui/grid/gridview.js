/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/browser/ui/splitview/splitview", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/numbers", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/ui/sash/sash", "vs/css!./gridview"], function (require, exports, event_1, splitview_1, lifecycle_1, dom_1, arrays_1, color_1, numbers_1, splitview_2, sash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GridView = exports.MultiplexLayoutController = exports.LayoutController = exports.isGridBranchNode = exports.orthogonal = void 0;
    Object.defineProperty(exports, "Sizing", { enumerable: true, get: function () { return splitview_2.Sizing; } });
    Object.defineProperty(exports, "LayoutPriority", { enumerable: true, get: function () { return splitview_2.LayoutPriority; } });
    Object.defineProperty(exports, "Orientation", { enumerable: true, get: function () { return sash_1.Orientation; } });
    function orthogonal(orientation) {
        return orientation === 0 /* VERTICAL */ ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
    }
    exports.orthogonal = orthogonal;
    function isGridBranchNode(node) {
        return !!node.children;
    }
    exports.isGridBranchNode = isGridBranchNode;
    const defaultStyles = {
        separatorBorder: color_1.Color.transparent
    };
    class LayoutController {
        constructor(isLayoutEnabled) {
            this.isLayoutEnabled = isLayoutEnabled;
        }
    }
    exports.LayoutController = LayoutController;
    class MultiplexLayoutController {
        constructor(layoutControllers) {
            this.layoutControllers = layoutControllers;
        }
        get isLayoutEnabled() { return this.layoutControllers.every(l => l.isLayoutEnabled); }
    }
    exports.MultiplexLayoutController = MultiplexLayoutController;
    function toAbsoluteBoundarySashes(sashes, orientation) {
        if (orientation === 1 /* HORIZONTAL */) {
            return { left: sashes.start, right: sashes.end, top: sashes.orthogonalStart, bottom: sashes.orthogonalEnd };
        }
        else {
            return { top: sashes.start, bottom: sashes.end, left: sashes.orthogonalStart, right: sashes.orthogonalEnd };
        }
    }
    function fromAbsoluteBoundarySashes(sashes, orientation) {
        if (orientation === 1 /* HORIZONTAL */) {
            return { start: sashes.left, end: sashes.right, orthogonalStart: sashes.top, orthogonalEnd: sashes.bottom };
        }
        else {
            return { start: sashes.top, end: sashes.bottom, orthogonalStart: sashes.left, orthogonalEnd: sashes.right };
        }
    }
    class BranchNode {
        constructor(orientation, layoutController, styles, proportionalLayout, size = 0, orthogonalSize = 0, childDescriptors) {
            this.orientation = orientation;
            this.layoutController = layoutController;
            this.proportionalLayout = proportionalLayout;
            this.children = [];
            this.absoluteOffset = 0;
            this.absoluteOrthogonalOffset = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.childrenChangeDisposable = lifecycle_1.Disposable.None;
            this._onDidSashReset = new event_1.Emitter();
            this.onDidSashReset = this._onDidSashReset.event;
            this.splitviewSashResetDisposable = lifecycle_1.Disposable.None;
            this.childrenSashResetDisposable = lifecycle_1.Disposable.None;
            this._boundarySashes = {};
            this._styles = styles;
            this._size = size;
            this._orthogonalSize = orthogonalSize;
            this.element = dom_1.$('.monaco-grid-branch-node');
            if (!childDescriptors) {
                // Normal behavior, we have no children yet, just set up the splitview
                this.splitview = new splitview_1.SplitView(this.element, { orientation, styles, proportionalLayout });
                this.splitview.layout(size, { orthogonalSize, absoluteOffset: 0, absoluteOrthogonalOffset: 0, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
            }
            else {
                // Reconstruction behavior, we want to reconstruct a splitview
                const descriptor = {
                    views: childDescriptors.map(childDescriptor => {
                        return {
                            view: childDescriptor.node,
                            size: childDescriptor.node.size,
                            visible: childDescriptor.node instanceof LeafNode && childDescriptor.visible !== undefined ? childDescriptor.visible : true
                        };
                    }),
                    size: this.orthogonalSize
                };
                const options = { proportionalLayout, orientation, styles };
                this.children = childDescriptors.map(c => c.node);
                this.splitview = new splitview_1.SplitView(this.element, Object.assign(Object.assign({}, options), { descriptor }));
                this.children.forEach((node, index) => {
                    const first = index === 0;
                    const last = index === this.children.length;
                    node.boundarySashes = {
                        start: this.boundarySashes.orthogonalStart,
                        end: this.boundarySashes.orthogonalEnd,
                        orthogonalStart: first ? this.boundarySashes.start : this.splitview.sashes[index - 1],
                        orthogonalEnd: last ? this.boundarySashes.end : this.splitview.sashes[index],
                    };
                });
            }
            const onDidSashReset = event_1.Event.map(this.splitview.onDidSashReset, i => [i]);
            this.splitviewSashResetDisposable = onDidSashReset(this._onDidSashReset.fire, this._onDidSashReset);
            const onDidChildrenChange = event_1.Event.map(event_1.Event.any(...this.children.map(c => c.onDidChange)), () => undefined);
            this.childrenChangeDisposable = onDidChildrenChange(this._onDidChange.fire, this._onDidChange);
            const onDidChildrenSashReset = event_1.Event.any(...this.children.map((c, i) => event_1.Event.map(c.onDidSashReset, location => [i, ...location])));
            this.childrenSashResetDisposable = onDidChildrenSashReset(this._onDidSashReset.fire, this._onDidSashReset);
        }
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        get styles() { return this._styles; }
        get width() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.size : this.orthogonalSize;
        }
        get height() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.orthogonalSize : this.size;
        }
        get top() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.absoluteOffset : this.absoluteOrthogonalOffset;
        }
        get left() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.absoluteOrthogonalOffset : this.absoluteOffset;
        }
        get minimumSize() {
            return this.children.length === 0 ? 0 : Math.max(...this.children.map(c => c.minimumOrthogonalSize));
        }
        get maximumSize() {
            return Math.min(...this.children.map(c => c.maximumOrthogonalSize));
        }
        get priority() {
            if (this.children.length === 0) {
                return 0 /* Normal */;
            }
            const priorities = this.children.map(c => typeof c.priority === 'undefined' ? 0 /* Normal */ : c.priority);
            if (priorities.some(p => p === 2 /* High */)) {
                return 2 /* High */;
            }
            else if (priorities.some(p => p === 1 /* Low */)) {
                return 1 /* Low */;
            }
            return 0 /* Normal */;
        }
        get minimumOrthogonalSize() {
            return this.splitview.minimumSize;
        }
        get maximumOrthogonalSize() {
            return this.splitview.maximumSize;
        }
        get minimumWidth() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.minimumOrthogonalSize : this.minimumSize;
        }
        get minimumHeight() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.minimumSize : this.minimumOrthogonalSize;
        }
        get maximumWidth() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.maximumOrthogonalSize : this.maximumSize;
        }
        get maximumHeight() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.maximumSize : this.maximumOrthogonalSize;
        }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            this.splitview.orthogonalStartSash = boundarySashes.orthogonalStart;
            this.splitview.orthogonalEndSash = boundarySashes.orthogonalEnd;
            for (let index = 0; index < this.children.length; index++) {
                const child = this.children[index];
                const first = index === 0;
                const last = index === this.children.length - 1;
                child.boundarySashes = {
                    start: boundarySashes.orthogonalStart,
                    end: boundarySashes.orthogonalEnd,
                    orthogonalStart: first ? boundarySashes.start : child.boundarySashes.orthogonalStart,
                    orthogonalEnd: last ? boundarySashes.end : child.boundarySashes.orthogonalEnd,
                };
            }
        }
        style(styles) {
            this._styles = styles;
            this.splitview.style(styles);
            for (const child of this.children) {
                if (child instanceof BranchNode) {
                    child.style(styles);
                }
            }
        }
        layout(size, offset, ctx) {
            if (!this.layoutController.isLayoutEnabled) {
                return;
            }
            if (typeof ctx === 'undefined') {
                throw new Error('Invalid state');
            }
            // branch nodes should flip the normal/orthogonal directions
            this._size = ctx.orthogonalSize;
            this._orthogonalSize = size;
            this.absoluteOffset = ctx.absoluteOffset + offset;
            this.absoluteOrthogonalOffset = ctx.absoluteOrthogonalOffset;
            this.splitview.layout(ctx.orthogonalSize, {
                orthogonalSize: size,
                absoluteOffset: this.absoluteOrthogonalOffset,
                absoluteOrthogonalOffset: this.absoluteOffset,
                absoluteSize: ctx.absoluteOrthogonalSize,
                absoluteOrthogonalSize: ctx.absoluteSize
            });
            // Disable snapping on views which sit on the edges of the grid
            this.splitview.startSnappingEnabled = this.absoluteOrthogonalOffset > 0;
            this.splitview.endSnappingEnabled = this.absoluteOrthogonalOffset + ctx.orthogonalSize < ctx.absoluteOrthogonalSize;
        }
        setVisible(visible) {
            for (const child of this.children) {
                child.setVisible(visible);
            }
        }
        addChild(node, size, index, skipLayout) {
            if (index < 0 || index > this.children.length) {
                throw new Error('Invalid index');
            }
            this.splitview.addView(node, size, index, skipLayout);
            this._addChild(node, index);
            this.onDidChildrenChange();
        }
        _addChild(node, index) {
            const first = index === 0;
            const last = index === this.children.length;
            this.children.splice(index, 0, node);
            node.boundarySashes = {
                start: this.boundarySashes.orthogonalStart,
                end: this.boundarySashes.orthogonalEnd,
                orthogonalStart: first ? this.boundarySashes.start : this.splitview.sashes[index - 1],
                orthogonalEnd: last ? this.boundarySashes.end : this.splitview.sashes[index],
            };
            if (!first) {
                this.children[index - 1].boundarySashes = Object.assign(Object.assign({}, this.children[index - 1].boundarySashes), { orthogonalEnd: this.splitview.sashes[index - 1] });
            }
            if (!last) {
                this.children[index + 1].boundarySashes = Object.assign(Object.assign({}, this.children[index + 1].boundarySashes), { orthogonalStart: this.splitview.sashes[index] });
            }
        }
        removeChild(index, sizing) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('Invalid index');
            }
            this.splitview.removeView(index, sizing);
            this._removeChild(index);
            this.onDidChildrenChange();
        }
        _removeChild(index) {
            const first = index === 0;
            const last = index === this.children.length - 1;
            const [child] = this.children.splice(index, 1);
            if (!first) {
                this.children[index - 1].boundarySashes = Object.assign(Object.assign({}, this.children[index - 1].boundarySashes), { orthogonalEnd: this.splitview.sashes[index - 1] });
            }
            if (!last) { // [0,1,2,3] (2) => [0,1,3]
                this.children[index].boundarySashes = Object.assign(Object.assign({}, this.children[index].boundarySashes), { orthogonalStart: this.splitview.sashes[Math.max(index - 1, 0)] });
            }
            return child;
        }
        moveChild(from, to) {
            if (from === to) {
                return;
            }
            if (from < 0 || from >= this.children.length) {
                throw new Error('Invalid from index');
            }
            to = numbers_1.clamp(to, 0, this.children.length);
            if (from < to) {
                to--;
            }
            this.splitview.moveView(from, to);
            const child = this._removeChild(from);
            this._addChild(child, to);
            this.onDidChildrenChange();
        }
        swapChildren(from, to) {
            if (from === to) {
                return;
            }
            if (from < 0 || from >= this.children.length) {
                throw new Error('Invalid from index');
            }
            to = numbers_1.clamp(to, 0, this.children.length);
            this.splitview.swapViews(from, to);
            // swap boundary sashes
            [this.children[from].boundarySashes, this.children[to].boundarySashes]
                = [this.children[from].boundarySashes, this.children[to].boundarySashes];
            // swap children
            [this.children[from], this.children[to]] = [this.children[to], this.children[from]];
            this.onDidChildrenChange();
        }
        resizeChild(index, size) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('Invalid index');
            }
            this.splitview.resizeView(index, size);
        }
        distributeViewSizes(recursive = false) {
            this.splitview.distributeViewSizes();
            if (recursive) {
                for (const child of this.children) {
                    if (child instanceof BranchNode) {
                        child.distributeViewSizes(true);
                    }
                }
            }
        }
        getChildSize(index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('Invalid index');
            }
            return this.splitview.getViewSize(index);
        }
        isChildVisible(index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('Invalid index');
            }
            return this.splitview.isViewVisible(index);
        }
        setChildVisible(index, visible) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('Invalid index');
            }
            if (this.splitview.isViewVisible(index) === visible) {
                return;
            }
            this.splitview.setViewVisible(index, visible);
        }
        getChildCachedVisibleSize(index) {
            if (index < 0 || index >= this.children.length) {
                throw new Error('Invalid index');
            }
            return this.splitview.getViewCachedVisibleSize(index);
        }
        onDidChildrenChange() {
            const onDidChildrenChange = event_1.Event.map(event_1.Event.any(...this.children.map(c => c.onDidChange)), () => undefined);
            this.childrenChangeDisposable.dispose();
            this.childrenChangeDisposable = onDidChildrenChange(this._onDidChange.fire, this._onDidChange);
            const onDidChildrenSashReset = event_1.Event.any(...this.children.map((c, i) => event_1.Event.map(c.onDidSashReset, location => [i, ...location])));
            this.childrenSashResetDisposable.dispose();
            this.childrenSashResetDisposable = onDidChildrenSashReset(this._onDidSashReset.fire, this._onDidSashReset);
            this._onDidChange.fire(undefined);
        }
        trySet2x2(other) {
            if (this.children.length !== 2 || other.children.length !== 2) {
                return lifecycle_1.Disposable.None;
            }
            if (this.getChildSize(0) !== other.getChildSize(0)) {
                return lifecycle_1.Disposable.None;
            }
            const [firstChild, secondChild] = this.children;
            const [otherFirstChild, otherSecondChild] = other.children;
            if (!(firstChild instanceof LeafNode) || !(secondChild instanceof LeafNode)) {
                return lifecycle_1.Disposable.None;
            }
            if (!(otherFirstChild instanceof LeafNode) || !(otherSecondChild instanceof LeafNode)) {
                return lifecycle_1.Disposable.None;
            }
            if (this.orientation === 0 /* VERTICAL */) {
                secondChild.linkedWidthNode = otherFirstChild.linkedHeightNode = firstChild;
                firstChild.linkedWidthNode = otherSecondChild.linkedHeightNode = secondChild;
                otherSecondChild.linkedWidthNode = firstChild.linkedHeightNode = otherFirstChild;
                otherFirstChild.linkedWidthNode = secondChild.linkedHeightNode = otherSecondChild;
            }
            else {
                otherFirstChild.linkedWidthNode = secondChild.linkedHeightNode = firstChild;
                otherSecondChild.linkedWidthNode = firstChild.linkedHeightNode = secondChild;
                firstChild.linkedWidthNode = otherSecondChild.linkedHeightNode = otherFirstChild;
                secondChild.linkedWidthNode = otherFirstChild.linkedHeightNode = otherSecondChild;
            }
            const mySash = this.splitview.sashes[0];
            const otherSash = other.splitview.sashes[0];
            mySash.linkedSash = otherSash;
            otherSash.linkedSash = mySash;
            this._onDidChange.fire(undefined);
            other._onDidChange.fire(undefined);
            return lifecycle_1.toDisposable(() => {
                mySash.linkedSash = otherSash.linkedSash = undefined;
                firstChild.linkedHeightNode = firstChild.linkedWidthNode = undefined;
                secondChild.linkedHeightNode = secondChild.linkedWidthNode = undefined;
                otherFirstChild.linkedHeightNode = otherFirstChild.linkedWidthNode = undefined;
                otherSecondChild.linkedHeightNode = otherSecondChild.linkedWidthNode = undefined;
            });
        }
        dispose() {
            for (const child of this.children) {
                child.dispose();
            }
            this._onDidChange.dispose();
            this._onDidSashReset.dispose();
            this.splitviewSashResetDisposable.dispose();
            this.childrenSashResetDisposable.dispose();
            this.childrenChangeDisposable.dispose();
            this.splitview.dispose();
        }
    }
    class LeafNode {
        constructor(view, orientation, layoutController, orthogonalSize, size = 0) {
            this.view = view;
            this.orientation = orientation;
            this.layoutController = layoutController;
            this._size = 0;
            this.absoluteOffset = 0;
            this.absoluteOrthogonalOffset = 0;
            this.onDidSashReset = event_1.Event.None;
            this._onDidLinkedWidthNodeChange = new event_1.Relay();
            this._linkedWidthNode = undefined;
            this._onDidLinkedHeightNodeChange = new event_1.Relay();
            this._linkedHeightNode = undefined;
            this._onDidSetLinkedNode = new event_1.Emitter();
            this._boundarySashes = {};
            this._orthogonalSize = orthogonalSize;
            this._size = size;
            this._onDidViewChange = event_1.Event.map(this.view.onDidChange, e => e && (this.orientation === 0 /* VERTICAL */ ? e.width : e.height));
            this.onDidChange = event_1.Event.any(this._onDidViewChange, this._onDidSetLinkedNode.event, this._onDidLinkedWidthNodeChange.event, this._onDidLinkedHeightNodeChange.event);
        }
        get size() { return this._size; }
        get orthogonalSize() { return this._orthogonalSize; }
        get linkedWidthNode() { return this._linkedWidthNode; }
        set linkedWidthNode(node) {
            this._onDidLinkedWidthNodeChange.input = node ? node._onDidViewChange : event_1.Event.None;
            this._linkedWidthNode = node;
            this._onDidSetLinkedNode.fire(undefined);
        }
        get linkedHeightNode() { return this._linkedHeightNode; }
        set linkedHeightNode(node) {
            this._onDidLinkedHeightNodeChange.input = node ? node._onDidViewChange : event_1.Event.None;
            this._linkedHeightNode = node;
            this._onDidSetLinkedNode.fire(undefined);
        }
        get width() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.orthogonalSize : this.size;
        }
        get height() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.size : this.orthogonalSize;
        }
        get top() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.absoluteOffset : this.absoluteOrthogonalOffset;
        }
        get left() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.absoluteOrthogonalOffset : this.absoluteOffset;
        }
        get element() {
            return this.view.element;
        }
        get minimumWidth() {
            return this.linkedWidthNode ? Math.max(this.linkedWidthNode.view.minimumWidth, this.view.minimumWidth) : this.view.minimumWidth;
        }
        get maximumWidth() {
            return this.linkedWidthNode ? Math.min(this.linkedWidthNode.view.maximumWidth, this.view.maximumWidth) : this.view.maximumWidth;
        }
        get minimumHeight() {
            return this.linkedHeightNode ? Math.max(this.linkedHeightNode.view.minimumHeight, this.view.minimumHeight) : this.view.minimumHeight;
        }
        get maximumHeight() {
            return this.linkedHeightNode ? Math.min(this.linkedHeightNode.view.maximumHeight, this.view.maximumHeight) : this.view.maximumHeight;
        }
        get minimumSize() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.minimumHeight : this.minimumWidth;
        }
        get maximumSize() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.maximumHeight : this.maximumWidth;
        }
        get priority() {
            return this.view.priority;
        }
        get snap() {
            return this.view.snap;
        }
        get minimumOrthogonalSize() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.minimumWidth : this.minimumHeight;
        }
        get maximumOrthogonalSize() {
            return this.orientation === 1 /* HORIZONTAL */ ? this.maximumWidth : this.maximumHeight;
        }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            if (this.view.setBoundarySashes) {
                this.view.setBoundarySashes(toAbsoluteBoundarySashes(boundarySashes, this.orientation));
            }
        }
        layout(size, offset, ctx) {
            if (!this.layoutController.isLayoutEnabled) {
                return;
            }
            if (typeof ctx === 'undefined') {
                throw new Error('Invalid state');
            }
            this._size = size;
            this._orthogonalSize = ctx.orthogonalSize;
            this.absoluteOffset = ctx.absoluteOffset + offset;
            this.absoluteOrthogonalOffset = ctx.absoluteOrthogonalOffset;
            this.view.layout(this.width, this.height, this.top, this.left);
        }
        setVisible(visible) {
            if (this.view.setVisible) {
                this.view.setVisible(visible);
            }
        }
        dispose() { }
    }
    function flipNode(node, size, orthogonalSize) {
        if (node instanceof BranchNode) {
            const result = new BranchNode(orthogonal(node.orientation), node.layoutController, node.styles, node.proportionalLayout, size, orthogonalSize);
            let totalSize = 0;
            for (let i = node.children.length - 1; i >= 0; i--) {
                const child = node.children[i];
                const childSize = child instanceof BranchNode ? child.orthogonalSize : child.size;
                let newSize = node.size === 0 ? 0 : Math.round((size * childSize) / node.size);
                totalSize += newSize;
                // The last view to add should adjust to rounding errors
                if (i === 0) {
                    newSize += size - totalSize;
                }
                result.addChild(flipNode(child, orthogonalSize, newSize), newSize, 0, true);
            }
            return result;
        }
        else {
            return new LeafNode(node.view, orthogonal(node.orientation), node.layoutController, orthogonalSize);
        }
    }
    class GridView {
        constructor(options = {}) {
            this.onDidSashResetRelay = new event_1.Relay();
            this.onDidSashReset = this.onDidSashResetRelay.event;
            this.disposable2x2 = lifecycle_1.Disposable.None;
            this._onDidChange = new event_1.Relay();
            this.onDidChange = this._onDidChange.event;
            this._boundarySashes = {};
            this.element = dom_1.$('.monaco-grid-view');
            this.styles = options.styles || defaultStyles;
            this.proportionalLayout = typeof options.proportionalLayout !== 'undefined' ? !!options.proportionalLayout : true;
            this.firstLayoutController = new LayoutController(false);
            this.layoutController = new MultiplexLayoutController([
                this.firstLayoutController,
                ...(options.layoutController ? [options.layoutController] : [])
            ]);
            this.root = new BranchNode(0 /* VERTICAL */, this.layoutController, this.styles, this.proportionalLayout);
        }
        get root() {
            return this._root;
        }
        set root(root) {
            const oldRoot = this._root;
            if (oldRoot) {
                this.element.removeChild(oldRoot.element);
                oldRoot.dispose();
            }
            this._root = root;
            this.element.appendChild(root.element);
            this.onDidSashResetRelay.input = root.onDidSashReset;
            this._onDidChange.input = event_1.Event.map(root.onDidChange, () => undefined); // TODO
        }
        get orientation() {
            return this._root.orientation;
        }
        set orientation(orientation) {
            if (this._root.orientation === orientation) {
                return;
            }
            const { size, orthogonalSize } = this._root;
            this.root = flipNode(this._root, orthogonalSize, size);
            this.root.layout(size, 0, { orthogonalSize, absoluteOffset: 0, absoluteOrthogonalOffset: 0, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
            this.boundarySashes = this.boundarySashes;
        }
        get width() { return this.root.width; }
        get height() { return this.root.height; }
        get minimumWidth() { return this.root.minimumWidth; }
        get minimumHeight() { return this.root.minimumHeight; }
        get maximumWidth() { return this.root.maximumHeight; }
        get maximumHeight() { return this.root.maximumHeight; }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            this.root.boundarySashes = fromAbsoluteBoundarySashes(boundarySashes, this.orientation);
        }
        getViewMap(map, node) {
            if (!node) {
                node = this.root;
            }
            if (node instanceof BranchNode) {
                node.children.forEach(child => this.getViewMap(map, child));
            }
            else {
                map.set(node.view, node.element);
            }
        }
        style(styles) {
            this.styles = styles;
            this.root.style(styles);
        }
        layout(width, height) {
            this.firstLayoutController.isLayoutEnabled = true;
            const [size, orthogonalSize] = this.root.orientation === 1 /* HORIZONTAL */ ? [height, width] : [width, height];
            this.root.layout(size, 0, { orthogonalSize, absoluteOffset: 0, absoluteOrthogonalOffset: 0, absoluteSize: size, absoluteOrthogonalSize: orthogonalSize });
        }
        addView(view, size, location) {
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            const [rest, index] = arrays_1.tail2(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (parent instanceof BranchNode) {
                const node = new LeafNode(view, orthogonal(parent.orientation), this.layoutController, parent.orthogonalSize);
                parent.addChild(node, size, index);
            }
            else {
                const [, grandParent] = arrays_1.tail2(pathToParent);
                const [, parentIndex] = arrays_1.tail2(rest);
                let newSiblingSize = 0;
                const newSiblingCachedVisibleSize = grandParent.getChildCachedVisibleSize(parentIndex);
                if (typeof newSiblingCachedVisibleSize === 'number') {
                    newSiblingSize = splitview_1.Sizing.Invisible(newSiblingCachedVisibleSize);
                }
                grandParent.removeChild(parentIndex);
                const newParent = new BranchNode(parent.orientation, parent.layoutController, this.styles, this.proportionalLayout, parent.size, parent.orthogonalSize);
                grandParent.addChild(newParent, parent.size, parentIndex);
                const newSibling = new LeafNode(parent.view, grandParent.orientation, this.layoutController, parent.size);
                newParent.addChild(newSibling, newSiblingSize, 0);
                if (typeof size !== 'number' && size.type === 'split') {
                    size = splitview_1.Sizing.Split(0);
                }
                const node = new LeafNode(view, grandParent.orientation, this.layoutController, parent.size);
                newParent.addChild(node, size, index);
            }
        }
        removeView(location, sizing) {
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            const [rest, index] = arrays_1.tail2(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            const node = parent.children[index];
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            parent.removeChild(index, sizing);
            if (parent.children.length === 0) {
                throw new Error('Invalid grid state');
            }
            if (parent.children.length > 1) {
                return node.view;
            }
            if (pathToParent.length === 0) { // parent is root
                const sibling = parent.children[0];
                if (sibling instanceof LeafNode) {
                    return node.view;
                }
                // we must promote sibling to be the new root
                parent.removeChild(0);
                this.root = sibling;
                this.boundarySashes = this.boundarySashes;
                return node.view;
            }
            const [, grandParent] = arrays_1.tail2(pathToParent);
            const [, parentIndex] = arrays_1.tail2(rest);
            const sibling = parent.children[0];
            const isSiblingVisible = parent.isChildVisible(0);
            parent.removeChild(0);
            const sizes = grandParent.children.map((_, i) => grandParent.getChildSize(i));
            grandParent.removeChild(parentIndex, sizing);
            if (sibling instanceof BranchNode) {
                sizes.splice(parentIndex, 1, ...sibling.children.map(c => c.size));
                for (let i = 0; i < sibling.children.length; i++) {
                    const child = sibling.children[i];
                    grandParent.addChild(child, child.size, parentIndex + i);
                }
            }
            else {
                const newSibling = new LeafNode(sibling.view, orthogonal(sibling.orientation), this.layoutController, sibling.size);
                const sizing = isSiblingVisible ? sibling.orthogonalSize : splitview_1.Sizing.Invisible(sibling.orthogonalSize);
                grandParent.addChild(newSibling, sizing, parentIndex);
            }
            for (let i = 0; i < sizes.length; i++) {
                grandParent.resizeChild(i, sizes[i]);
            }
            return node.view;
        }
        moveView(parentLocation, from, to) {
            const [, parent] = this.getNode(parentLocation);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            parent.moveChild(from, to);
        }
        swapViews(from, to) {
            const [fromRest, fromIndex] = arrays_1.tail2(from);
            const [, fromParent] = this.getNode(fromRest);
            if (!(fromParent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            const fromSize = fromParent.getChildSize(fromIndex);
            const fromNode = fromParent.children[fromIndex];
            if (!(fromNode instanceof LeafNode)) {
                throw new Error('Invalid from location');
            }
            const [toRest, toIndex] = arrays_1.tail2(to);
            const [, toParent] = this.getNode(toRest);
            if (!(toParent instanceof BranchNode)) {
                throw new Error('Invalid to location');
            }
            const toSize = toParent.getChildSize(toIndex);
            const toNode = toParent.children[toIndex];
            if (!(toNode instanceof LeafNode)) {
                throw new Error('Invalid to location');
            }
            if (fromParent === toParent) {
                fromParent.swapChildren(fromIndex, toIndex);
            }
            else {
                fromParent.removeChild(fromIndex);
                toParent.removeChild(toIndex);
                fromParent.addChild(toNode, fromSize, fromIndex);
                toParent.addChild(fromNode, toSize, toIndex);
            }
        }
        resizeView(location, { width, height }) {
            const [rest, index] = arrays_1.tail2(location);
            const [pathToParent, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            if (!width && !height) {
                return;
            }
            const [parentSize, grandParentSize] = parent.orientation === 1 /* HORIZONTAL */ ? [width, height] : [height, width];
            if (typeof grandParentSize === 'number' && pathToParent.length > 0) {
                const [, grandParent] = arrays_1.tail2(pathToParent);
                const [, parentIndex] = arrays_1.tail2(rest);
                grandParent.resizeChild(parentIndex, grandParentSize);
            }
            if (typeof parentSize === 'number') {
                parent.resizeChild(index, parentSize);
            }
        }
        getViewSize(location) {
            if (!location) {
                return { width: this.root.width, height: this.root.height };
            }
            const [, node] = this.getNode(location);
            return { width: node.width, height: node.height };
        }
        getViewCachedVisibleSize(location) {
            const [rest, index] = arrays_1.tail2(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            return parent.getChildCachedVisibleSize(index);
        }
        maximizeViewSize(location) {
            const [ancestors, node] = this.getNode(location);
            if (!(node instanceof LeafNode)) {
                throw new Error('Invalid location');
            }
            for (let i = 0; i < ancestors.length; i++) {
                ancestors[i].resizeChild(location[i], Number.POSITIVE_INFINITY);
            }
        }
        distributeViewSizes(location) {
            if (!location) {
                this.root.distributeViewSizes(true);
                return;
            }
            const [, node] = this.getNode(location);
            if (!(node instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            node.distributeViewSizes();
        }
        isViewVisible(location) {
            const [rest, index] = arrays_1.tail2(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            return parent.isChildVisible(index);
        }
        setViewVisible(location, visible) {
            const [rest, index] = arrays_1.tail2(location);
            const [, parent] = this.getNode(rest);
            if (!(parent instanceof BranchNode)) {
                throw new Error('Invalid from location');
            }
            parent.setChildVisible(index, visible);
        }
        getView(location) {
            const node = location ? this.getNode(location)[1] : this._root;
            return this._getViews(node, this.orientation);
        }
        static deserialize(json, deserializer, options = {}) {
            var _a;
            if (typeof json.orientation !== 'number') {
                throw new Error('Invalid JSON: \'orientation\' property must be a number.');
            }
            else if (typeof json.width !== 'number') {
                throw new Error('Invalid JSON: \'width\' property must be a number.');
            }
            else if (typeof json.height !== 'number') {
                throw new Error('Invalid JSON: \'height\' property must be a number.');
            }
            else if (((_a = json.root) === null || _a === void 0 ? void 0 : _a.type) !== 'branch') {
                throw new Error('Invalid JSON: \'root\' property must have \'type\' value of branch.');
            }
            const orientation = json.orientation;
            const height = json.height;
            const result = new GridView(options);
            result._deserialize(json.root, orientation, deserializer, height);
            return result;
        }
        _deserialize(root, orientation, deserializer, orthogonalSize) {
            this.root = this._deserializeNode(root, orientation, deserializer, orthogonalSize);
        }
        _deserializeNode(node, orientation, deserializer, orthogonalSize) {
            let result;
            if (node.type === 'branch') {
                const serializedChildren = node.data;
                const children = serializedChildren.map(serializedChild => {
                    return {
                        node: this._deserializeNode(serializedChild, orthogonal(orientation), deserializer, node.size),
                        visible: serializedChild.visible
                    };
                });
                result = new BranchNode(orientation, this.layoutController, this.styles, this.proportionalLayout, node.size, orthogonalSize, children);
            }
            else {
                result = new LeafNode(deserializer.fromJSON(node.data), orientation, this.layoutController, orthogonalSize, node.size);
            }
            return result;
        }
        _getViews(node, orientation, cachedVisibleSize) {
            const box = { top: node.top, left: node.left, width: node.width, height: node.height };
            if (node instanceof LeafNode) {
                return { view: node.view, box, cachedVisibleSize };
            }
            const children = [];
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const cachedVisibleSize = node.getChildCachedVisibleSize(i);
                children.push(this._getViews(child, orthogonal(orientation), cachedVisibleSize));
            }
            return { children, box };
        }
        getNode(location, node = this.root, path = []) {
            if (location.length === 0) {
                return [path, node];
            }
            if (!(node instanceof BranchNode)) {
                throw new Error('Invalid location');
            }
            const [index, ...rest] = location;
            if (index < 0 || index >= node.children.length) {
                throw new Error('Invalid location');
            }
            const child = node.children[index];
            path.push(node);
            return this.getNode(rest, child, path);
        }
        trySet2x2() {
            this.disposable2x2.dispose();
            this.disposable2x2 = lifecycle_1.Disposable.None;
            if (this.root.children.length !== 2) {
                return;
            }
            const [first, second] = this.root.children;
            if (!(first instanceof BranchNode) || !(second instanceof BranchNode)) {
                return;
            }
            this.disposable2x2 = first.trySet2x2(second);
        }
        dispose() {
            this.onDidSashResetRelay.dispose();
            this.root.dispose();
            if (this.element && this.element.parentElement) {
                this.element.parentElement.removeChild(this.element);
            }
        }
    }
    exports.GridView = GridView;
});
//# __sourceMappingURL=gridview.js.map