/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/types", "vs/base/browser/dom", "vs/base/common/numbers", "vs/base/common/arrays", "vs/base/browser/ui/sash/sash", "vs/base/common/color", "vs/base/browser/event", "vs/base/browser/ui/sash/sash", "vs/css!./splitview"], function (require, exports, lifecycle_1, event_1, types, dom, numbers_1, arrays_1, sash_1, color_1, event_2, sash_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SplitView = exports.Sizing = exports.LayoutPriority = void 0;
    Object.defineProperty(exports, "Orientation", { enumerable: true, get: function () { return sash_2.Orientation; } });
    const defaultStyles = {
        separatorBorder: color_1.Color.transparent
    };
    /**
     * Only used when `proportionalLayout` is false.
     */
    var LayoutPriority;
    (function (LayoutPriority) {
        LayoutPriority[LayoutPriority["Normal"] = 0] = "Normal";
        LayoutPriority[LayoutPriority["Low"] = 1] = "Low";
        LayoutPriority[LayoutPriority["High"] = 2] = "High";
    })(LayoutPriority = exports.LayoutPriority || (exports.LayoutPriority = {}));
    class ViewItem {
        constructor(container, view, size, disposable) {
            this.container = container;
            this.view = view;
            this.disposable = disposable;
            this._cachedVisibleSize = undefined;
            if (typeof size === 'number') {
                this._size = size;
                this._cachedVisibleSize = undefined;
                dom.addClass(container, 'visible');
            }
            else {
                this._size = 0;
                this._cachedVisibleSize = size.cachedVisibleSize;
            }
        }
        set size(size) {
            this._size = size;
        }
        get size() {
            return this._size;
        }
        get cachedVisibleSize() { return this._cachedVisibleSize; }
        get visible() {
            return typeof this._cachedVisibleSize === 'undefined';
        }
        setVisible(visible, size) {
            if (visible === this.visible) {
                return;
            }
            if (visible) {
                this.size = numbers_1.clamp(this._cachedVisibleSize, this.viewMinimumSize, this.viewMaximumSize);
                this._cachedVisibleSize = undefined;
            }
            else {
                this._cachedVisibleSize = typeof size === 'number' ? size : this.size;
                this.size = 0;
            }
            dom.toggleClass(this.container, 'visible', visible);
            if (this.view.setVisible) {
                this.view.setVisible(visible);
            }
        }
        get minimumSize() { return this.visible ? this.view.minimumSize : 0; }
        get viewMinimumSize() { return this.view.minimumSize; }
        get maximumSize() { return this.visible ? this.view.maximumSize : 0; }
        get viewMaximumSize() { return this.view.maximumSize; }
        get priority() { return this.view.priority; }
        get snap() { return !!this.view.snap; }
        set enabled(enabled) {
            this.container.style.pointerEvents = enabled ? '' : 'none';
        }
        layout(offset, layoutContext) {
            this.layoutContainer(offset);
            this.view.layout(this.size, offset, layoutContext);
        }
        dispose() {
            this.disposable.dispose();
            return this.view;
        }
    }
    class VerticalViewItem extends ViewItem {
        layoutContainer(offset) {
            this.container.style.top = `${offset}px`;
            this.container.style.height = `${this.size}px`;
        }
    }
    class HorizontalViewItem extends ViewItem {
        layoutContainer(offset) {
            this.container.style.left = `${offset}px`;
            this.container.style.width = `${this.size}px`;
        }
    }
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Busy"] = 1] = "Busy";
    })(State || (State = {}));
    var Sizing;
    (function (Sizing) {
        Sizing.Distribute = { type: 'distribute' };
        function Split(index) { return { type: 'split', index }; }
        Sizing.Split = Split;
        function Invisible(cachedVisibleSize) { return { type: 'invisible', cachedVisibleSize }; }
        Sizing.Invisible = Invisible;
    })(Sizing = exports.Sizing || (exports.Sizing = {}));
    class SplitView extends lifecycle_1.Disposable {
        constructor(container, options = {}) {
            super();
            this.size = 0;
            this.contentSize = 0;
            this.proportions = undefined;
            this.viewItems = [];
            this.sashItems = [];
            this.state = State.Idle;
            this._onDidSashChange = this._register(new event_1.Emitter());
            this.onDidSashChange = this._onDidSashChange.event;
            this._onDidSashReset = this._register(new event_1.Emitter());
            this.onDidSashReset = this._onDidSashReset.event;
            this._startSnappingEnabled = true;
            this._endSnappingEnabled = true;
            this.orientation = types.isUndefined(options.orientation) ? 0 /* VERTICAL */ : options.orientation;
            this.inverseAltBehavior = !!options.inverseAltBehavior;
            this.proportionalLayout = types.isUndefined(options.proportionalLayout) ? true : !!options.proportionalLayout;
            this.el = document.createElement('div');
            dom.addClass(this.el, 'monaco-split-view2');
            dom.addClass(this.el, this.orientation === 0 /* VERTICAL */ ? 'vertical' : 'horizontal');
            container.appendChild(this.el);
            this.sashContainer = dom.append(this.el, dom.$('.sash-container'));
            this.viewContainer = dom.append(this.el, dom.$('.split-view-container'));
            this.style(options.styles || defaultStyles);
            // We have an existing set of view, add them now
            if (options.descriptor) {
                this.size = options.descriptor.size;
                options.descriptor.views.forEach((viewDescriptor, index) => {
                    const sizing = types.isUndefined(viewDescriptor.visible) || viewDescriptor.visible ? viewDescriptor.size : { type: 'invisible', cachedVisibleSize: viewDescriptor.size };
                    const view = viewDescriptor.view;
                    this.doAddView(view, sizing, index, true);
                });
                // Initialize content size and proportions for first layout
                this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
                this.saveProportions();
            }
        }
        get length() {
            return this.viewItems.length;
        }
        get minimumSize() {
            return this.viewItems.reduce((r, item) => r + item.minimumSize, 0);
        }
        get maximumSize() {
            return this.length === 0 ? Number.POSITIVE_INFINITY : this.viewItems.reduce((r, item) => r + item.maximumSize, 0);
        }
        get orthogonalStartSash() { return this._orthogonalStartSash; }
        set orthogonalStartSash(sash) {
            for (const sashItem of this.sashItems) {
                sashItem.sash.orthogonalStartSash = sash;
            }
            this._orthogonalStartSash = sash;
        }
        get orthogonalEndSash() { return this._orthogonalEndSash; }
        set orthogonalEndSash(sash) {
            for (const sashItem of this.sashItems) {
                sashItem.sash.orthogonalEndSash = sash;
            }
            this._orthogonalEndSash = sash;
        }
        get sashes() {
            return this.sashItems.map(s => s.sash);
        }
        get startSnappingEnabled() { return this._startSnappingEnabled; }
        set startSnappingEnabled(startSnappingEnabled) {
            if (this._startSnappingEnabled === startSnappingEnabled) {
                return;
            }
            this._startSnappingEnabled = startSnappingEnabled;
            this.updateSashEnablement();
        }
        get endSnappingEnabled() { return this._endSnappingEnabled; }
        set endSnappingEnabled(endSnappingEnabled) {
            if (this._endSnappingEnabled === endSnappingEnabled) {
                return;
            }
            this._endSnappingEnabled = endSnappingEnabled;
            this.updateSashEnablement();
        }
        style(styles) {
            if (styles.separatorBorder.isTransparent()) {
                dom.removeClass(this.el, 'separator-border');
                this.el.style.removeProperty('--separator-border');
            }
            else {
                dom.addClass(this.el, 'separator-border');
                this.el.style.setProperty('--separator-border', styles.separatorBorder.toString());
            }
        }
        addView(view, size, index = this.viewItems.length, skipLayout) {
            this.doAddView(view, size, index, skipLayout);
        }
        removeView(index, sizing) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            // Remove view
            const viewItem = this.viewItems.splice(index, 1)[0];
            const view = viewItem.dispose();
            // Remove sash
            if (this.viewItems.length >= 1) {
                const sashIndex = Math.max(index - 1, 0);
                const sashItem = this.sashItems.splice(sashIndex, 1)[0];
                sashItem.disposable.dispose();
            }
            this.relayout();
            this.state = State.Idle;
            if (sizing && sizing.type === 'distribute') {
                this.distributeViewSizes();
            }
            return view;
        }
        moveView(from, to) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            const cachedVisibleSize = this.getViewCachedVisibleSize(from);
            const sizing = typeof cachedVisibleSize === 'undefined' ? this.getViewSize(from) : Sizing.Invisible(cachedVisibleSize);
            const view = this.removeView(from);
            this.addView(view, sizing, to);
        }
        swapViews(from, to) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            if (from > to) {
                return this.swapViews(to, from);
            }
            const fromSize = this.getViewSize(from);
            const toSize = this.getViewSize(to);
            const toView = this.removeView(to);
            const fromView = this.removeView(from);
            this.addView(toView, fromSize, from);
            this.addView(fromView, toSize, to);
        }
        isViewVisible(index) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            const viewItem = this.viewItems[index];
            return viewItem.visible;
        }
        setViewVisible(index, visible) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            const viewItem = this.viewItems[index];
            viewItem.setVisible(visible);
            this.distributeEmptySpace(index);
            this.layoutViews();
            this.saveProportions();
        }
        getViewCachedVisibleSize(index) {
            if (index < 0 || index >= this.viewItems.length) {
                throw new Error('Index out of bounds');
            }
            const viewItem = this.viewItems[index];
            return viewItem.cachedVisibleSize;
        }
        layout(size, layoutContext) {
            const previousSize = Math.max(this.size, this.contentSize);
            this.size = size;
            this.layoutContext = layoutContext;
            if (!this.proportions) {
                const indexes = arrays_1.range(this.viewItems.length);
                const lowPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 1 /* Low */);
                const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* High */);
                this.resize(this.viewItems.length - 1, size - previousSize, undefined, lowPriorityIndexes, highPriorityIndexes);
            }
            else {
                for (let i = 0; i < this.viewItems.length; i++) {
                    const item = this.viewItems[i];
                    item.size = numbers_1.clamp(Math.round(this.proportions[i] * size), item.minimumSize, item.maximumSize);
                }
            }
            this.distributeEmptySpace();
            this.layoutViews();
        }
        saveProportions() {
            if (this.proportionalLayout && this.contentSize > 0) {
                this.proportions = this.viewItems.map(i => i.size / this.contentSize);
            }
        }
        onSashStart({ sash, start, alt }) {
            for (const item of this.viewItems) {
                item.enabled = false;
            }
            const index = arrays_1.firstIndex(this.sashItems, item => item.sash === sash);
            // This way, we can press Alt while we resize a sash, macOS style!
            const disposable = lifecycle_1.combinedDisposable(event_2.domEvent(document.body, 'keydown')(e => resetSashDragState(this.sashDragState.current, e.altKey)), event_2.domEvent(document.body, 'keyup')(() => resetSashDragState(this.sashDragState.current, false)));
            const resetSashDragState = (start, alt) => {
                const sizes = this.viewItems.map(i => i.size);
                let minDelta = Number.NEGATIVE_INFINITY;
                let maxDelta = Number.POSITIVE_INFINITY;
                if (this.inverseAltBehavior) {
                    alt = !alt;
                }
                if (alt) {
                    // When we're using the last sash with Alt, we're resizing
                    // the view to the left/up, instead of right/down as usual
                    // Thus, we must do the inverse of the usual
                    const isLastSash = index === this.sashItems.length - 1;
                    if (isLastSash) {
                        const viewItem = this.viewItems[index];
                        minDelta = (viewItem.minimumSize - viewItem.size) / 2;
                        maxDelta = (viewItem.maximumSize - viewItem.size) / 2;
                    }
                    else {
                        const viewItem = this.viewItems[index + 1];
                        minDelta = (viewItem.size - viewItem.maximumSize) / 2;
                        maxDelta = (viewItem.size - viewItem.minimumSize) / 2;
                    }
                }
                let snapBefore;
                let snapAfter;
                if (!alt) {
                    const upIndexes = arrays_1.range(index, -1);
                    const downIndexes = arrays_1.range(index + 1, this.viewItems.length);
                    const minDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].minimumSize - sizes[i]), 0);
                    const maxDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].viewMaximumSize - sizes[i]), 0);
                    const maxDeltaDown = downIndexes.length === 0 ? Number.POSITIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].minimumSize), 0);
                    const minDeltaDown = downIndexes.length === 0 ? Number.NEGATIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].viewMaximumSize), 0);
                    const minDelta = Math.max(minDeltaUp, minDeltaDown);
                    const maxDelta = Math.min(maxDeltaDown, maxDeltaUp);
                    const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                    const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                    if (typeof snapBeforeIndex === 'number') {
                        const viewItem = this.viewItems[snapBeforeIndex];
                        const halfSize = Math.floor(viewItem.viewMinimumSize / 2);
                        snapBefore = {
                            index: snapBeforeIndex,
                            limitDelta: viewItem.visible ? minDelta - halfSize : minDelta + halfSize,
                            size: viewItem.size
                        };
                    }
                    if (typeof snapAfterIndex === 'number') {
                        const viewItem = this.viewItems[snapAfterIndex];
                        const halfSize = Math.floor(viewItem.viewMinimumSize / 2);
                        snapAfter = {
                            index: snapAfterIndex,
                            limitDelta: viewItem.visible ? maxDelta + halfSize : maxDelta - halfSize,
                            size: viewItem.size
                        };
                    }
                }
                this.sashDragState = { start, current: start, index, sizes, minDelta, maxDelta, alt, snapBefore, snapAfter, disposable };
            };
            resetSashDragState(start, alt);
        }
        onSashChange({ current }) {
            const { index, start, sizes, alt, minDelta, maxDelta, snapBefore, snapAfter } = this.sashDragState;
            this.sashDragState.current = current;
            const delta = current - start;
            const newDelta = this.resize(index, delta, sizes, undefined, undefined, minDelta, maxDelta, snapBefore, snapAfter);
            if (alt) {
                const isLastSash = index === this.sashItems.length - 1;
                const newSizes = this.viewItems.map(i => i.size);
                const viewItemIndex = isLastSash ? index : index + 1;
                const viewItem = this.viewItems[viewItemIndex];
                const newMinDelta = viewItem.size - viewItem.maximumSize;
                const newMaxDelta = viewItem.size - viewItem.minimumSize;
                const resizeIndex = isLastSash ? index - 1 : index + 1;
                this.resize(resizeIndex, -newDelta, newSizes, undefined, undefined, newMinDelta, newMaxDelta);
            }
            this.distributeEmptySpace();
            this.layoutViews();
        }
        onSashEnd(index) {
            this._onDidSashChange.fire(index);
            this.sashDragState.disposable.dispose();
            this.saveProportions();
            for (const item of this.viewItems) {
                item.enabled = true;
            }
        }
        onViewChange(item, size) {
            const index = this.viewItems.indexOf(item);
            if (index < 0 || index >= this.viewItems.length) {
                return;
            }
            size = typeof size === 'number' ? size : item.size;
            size = numbers_1.clamp(size, item.minimumSize, item.maximumSize);
            if (this.inverseAltBehavior && index > 0) {
                // In this case, we want the view to grow or shrink both sides equally
                // so we just resize the "left" side by half and let `resize` do the clamping magic
                this.resize(index - 1, Math.floor((item.size - size) / 2));
                this.distributeEmptySpace();
                this.layoutViews();
            }
            else {
                item.size = size;
                this.relayout([index], undefined);
            }
        }
        resizeView(index, size) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            if (index < 0 || index >= this.viewItems.length) {
                return;
            }
            const indexes = arrays_1.range(this.viewItems.length).filter(i => i !== index);
            const lowPriorityIndexes = [...indexes.filter(i => this.viewItems[i].priority === 1 /* Low */), index];
            const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* High */);
            const item = this.viewItems[index];
            size = Math.round(size);
            size = numbers_1.clamp(size, item.minimumSize, Math.min(item.maximumSize, this.size));
            item.size = size;
            this.relayout(lowPriorityIndexes, highPriorityIndexes);
            this.state = State.Idle;
        }
        distributeViewSizes() {
            const flexibleViewItems = [];
            let flexibleSize = 0;
            for (const item of this.viewItems) {
                if (item.maximumSize - item.minimumSize > 0) {
                    flexibleViewItems.push(item);
                    flexibleSize += item.size;
                }
            }
            const size = Math.floor(flexibleSize / flexibleViewItems.length);
            for (const item of flexibleViewItems) {
                item.size = numbers_1.clamp(size, item.minimumSize, item.maximumSize);
            }
            const indexes = arrays_1.range(this.viewItems.length);
            const lowPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 1 /* Low */);
            const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* High */);
            this.relayout(lowPriorityIndexes, highPriorityIndexes);
        }
        getViewSize(index) {
            if (index < 0 || index >= this.viewItems.length) {
                return -1;
            }
            return this.viewItems[index].size;
        }
        doAddView(view, size, index = this.viewItems.length, skipLayout) {
            if (this.state !== State.Idle) {
                throw new Error('Cant modify splitview');
            }
            this.state = State.Busy;
            // Add view
            const container = dom.$('.split-view-view');
            if (index === this.viewItems.length) {
                this.viewContainer.appendChild(container);
            }
            else {
                this.viewContainer.insertBefore(container, this.viewContainer.children.item(index));
            }
            const onChangeDisposable = view.onDidChange(size => this.onViewChange(item, size));
            const containerDisposable = lifecycle_1.toDisposable(() => this.viewContainer.removeChild(container));
            const disposable = lifecycle_1.combinedDisposable(onChangeDisposable, containerDisposable);
            let viewSize;
            if (typeof size === 'number') {
                viewSize = size;
            }
            else if (size.type === 'split') {
                viewSize = this.getViewSize(size.index) / 2;
            }
            else if (size.type === 'invisible') {
                viewSize = { cachedVisibleSize: size.cachedVisibleSize };
            }
            else {
                viewSize = view.minimumSize;
            }
            const item = this.orientation === 0 /* VERTICAL */
                ? new VerticalViewItem(container, view, viewSize, disposable)
                : new HorizontalViewItem(container, view, viewSize, disposable);
            this.viewItems.splice(index, 0, item);
            // Add sash
            if (this.viewItems.length > 1) {
                const sash = this.orientation === 0 /* VERTICAL */
                    ? new sash_1.Sash(this.sashContainer, { getHorizontalSashTop: (sash) => this.getSashPosition(sash) }, {
                        orientation: 1 /* HORIZONTAL */,
                        orthogonalStartSash: this.orthogonalStartSash,
                        orthogonalEndSash: this.orthogonalEndSash
                    })
                    : new sash_1.Sash(this.sashContainer, { getVerticalSashLeft: (sash) => this.getSashPosition(sash) }, {
                        orientation: 0 /* VERTICAL */,
                        orthogonalStartSash: this.orthogonalStartSash,
                        orthogonalEndSash: this.orthogonalEndSash
                    });
                const sashEventMapper = this.orientation === 0 /* VERTICAL */
                    ? (e) => ({ sash, start: e.startY, current: e.currentY, alt: e.altKey })
                    : (e) => ({ sash, start: e.startX, current: e.currentX, alt: e.altKey });
                const onStart = event_1.Event.map(sash.onDidStart, sashEventMapper);
                const onStartDisposable = onStart(this.onSashStart, this);
                const onChange = event_1.Event.map(sash.onDidChange, sashEventMapper);
                const onChangeDisposable = onChange(this.onSashChange, this);
                const onEnd = event_1.Event.map(sash.onDidEnd, () => arrays_1.firstIndex(this.sashItems, item => item.sash === sash));
                const onEndDisposable = onEnd(this.onSashEnd, this);
                const onDidResetDisposable = sash.onDidReset(() => {
                    const index = arrays_1.firstIndex(this.sashItems, item => item.sash === sash);
                    const upIndexes = arrays_1.range(index, -1);
                    const downIndexes = arrays_1.range(index + 1, this.viewItems.length);
                    const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                    const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                    if (typeof snapBeforeIndex === 'number' && !this.viewItems[snapBeforeIndex].visible) {
                        return;
                    }
                    if (typeof snapAfterIndex === 'number' && !this.viewItems[snapAfterIndex].visible) {
                        return;
                    }
                    this._onDidSashReset.fire(index);
                });
                const disposable = lifecycle_1.combinedDisposable(onStartDisposable, onChangeDisposable, onEndDisposable, onDidResetDisposable, sash);
                const sashItem = { sash, disposable };
                this.sashItems.splice(index - 1, 0, sashItem);
            }
            container.appendChild(view.element);
            let highPriorityIndexes;
            if (typeof size !== 'number' && size.type === 'split') {
                highPriorityIndexes = [size.index];
            }
            if (!skipLayout) {
                this.relayout([index], highPriorityIndexes);
            }
            this.state = State.Idle;
            if (!skipLayout && typeof size !== 'number' && size.type === 'distribute') {
                this.distributeViewSizes();
            }
        }
        relayout(lowPriorityIndexes, highPriorityIndexes) {
            const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            this.resize(this.viewItems.length - 1, this.size - contentSize, undefined, lowPriorityIndexes, highPriorityIndexes);
            this.distributeEmptySpace();
            this.layoutViews();
            this.saveProportions();
        }
        resize(index, delta, sizes = this.viewItems.map(i => i.size), lowPriorityIndexes, highPriorityIndexes, overloadMinDelta = Number.NEGATIVE_INFINITY, overloadMaxDelta = Number.POSITIVE_INFINITY, snapBefore, snapAfter) {
            if (index < 0 || index >= this.viewItems.length) {
                return 0;
            }
            const upIndexes = arrays_1.range(index, -1);
            const downIndexes = arrays_1.range(index + 1, this.viewItems.length);
            if (highPriorityIndexes) {
                for (const index of highPriorityIndexes) {
                    arrays_1.pushToStart(upIndexes, index);
                    arrays_1.pushToStart(downIndexes, index);
                }
            }
            if (lowPriorityIndexes) {
                for (const index of lowPriorityIndexes) {
                    arrays_1.pushToEnd(upIndexes, index);
                    arrays_1.pushToEnd(downIndexes, index);
                }
            }
            const upItems = upIndexes.map(i => this.viewItems[i]);
            const upSizes = upIndexes.map(i => sizes[i]);
            const downItems = downIndexes.map(i => this.viewItems[i]);
            const downSizes = downIndexes.map(i => sizes[i]);
            const minDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].minimumSize - sizes[i]), 0);
            const maxDeltaUp = upIndexes.reduce((r, i) => r + (this.viewItems[i].maximumSize - sizes[i]), 0);
            const maxDeltaDown = downIndexes.length === 0 ? Number.POSITIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].minimumSize), 0);
            const minDeltaDown = downIndexes.length === 0 ? Number.NEGATIVE_INFINITY : downIndexes.reduce((r, i) => r + (sizes[i] - this.viewItems[i].maximumSize), 0);
            const minDelta = Math.max(minDeltaUp, minDeltaDown, overloadMinDelta);
            const maxDelta = Math.min(maxDeltaDown, maxDeltaUp, overloadMaxDelta);
            let snapped = false;
            if (snapBefore) {
                const snapView = this.viewItems[snapBefore.index];
                const visible = delta >= snapBefore.limitDelta;
                snapped = visible !== snapView.visible;
                snapView.setVisible(visible, snapBefore.size);
            }
            if (!snapped && snapAfter) {
                const snapView = this.viewItems[snapAfter.index];
                const visible = delta < snapAfter.limitDelta;
                snapped = visible !== snapView.visible;
                snapView.setVisible(visible, snapAfter.size);
            }
            if (snapped) {
                return this.resize(index, delta, sizes, lowPriorityIndexes, highPriorityIndexes, overloadMinDelta, overloadMaxDelta);
            }
            delta = numbers_1.clamp(delta, minDelta, maxDelta);
            for (let i = 0, deltaUp = delta; i < upItems.length; i++) {
                const item = upItems[i];
                const size = numbers_1.clamp(upSizes[i] + deltaUp, item.minimumSize, item.maximumSize);
                const viewDelta = size - upSizes[i];
                deltaUp -= viewDelta;
                item.size = size;
            }
            for (let i = 0, deltaDown = delta; i < downItems.length; i++) {
                const item = downItems[i];
                const size = numbers_1.clamp(downSizes[i] - deltaDown, item.minimumSize, item.maximumSize);
                const viewDelta = size - downSizes[i];
                deltaDown += viewDelta;
                item.size = size;
            }
            return delta;
        }
        distributeEmptySpace(lowPriorityIndex) {
            const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            let emptyDelta = this.size - contentSize;
            const indexes = arrays_1.range(this.viewItems.length - 1, -1);
            const lowPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 1 /* Low */);
            const highPriorityIndexes = indexes.filter(i => this.viewItems[i].priority === 2 /* High */);
            for (const index of highPriorityIndexes) {
                arrays_1.pushToStart(indexes, index);
            }
            for (const index of lowPriorityIndexes) {
                arrays_1.pushToEnd(indexes, index);
            }
            if (typeof lowPriorityIndex === 'number') {
                arrays_1.pushToEnd(indexes, lowPriorityIndex);
            }
            for (let i = 0; emptyDelta !== 0 && i < indexes.length; i++) {
                const item = this.viewItems[indexes[i]];
                const size = numbers_1.clamp(item.size + emptyDelta, item.minimumSize, item.maximumSize);
                const viewDelta = size - item.size;
                emptyDelta -= viewDelta;
                item.size = size;
            }
        }
        layoutViews() {
            // Save new content size
            this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
            // Layout views
            let offset = 0;
            for (const viewItem of this.viewItems) {
                viewItem.layout(offset, this.layoutContext);
                offset += viewItem.size;
            }
            // Layout sashes
            this.sashItems.forEach(item => item.sash.layout());
            this.updateSashEnablement();
        }
        updateSashEnablement() {
            let previous = false;
            const collapsesDown = this.viewItems.map(i => previous = (i.size - i.minimumSize > 0) || previous);
            previous = false;
            const expandsDown = this.viewItems.map(i => previous = (i.maximumSize - i.size > 0) || previous);
            const reverseViews = [...this.viewItems].reverse();
            previous = false;
            const collapsesUp = reverseViews.map(i => previous = (i.size - i.minimumSize > 0) || previous).reverse();
            previous = false;
            const expandsUp = reverseViews.map(i => previous = (i.maximumSize - i.size > 0) || previous).reverse();
            let position = 0;
            for (let index = 0; index < this.sashItems.length; index++) {
                const { sash } = this.sashItems[index];
                const viewItem = this.viewItems[index];
                position += viewItem.size;
                const min = !(collapsesDown[index] && expandsUp[index + 1]);
                const max = !(expandsDown[index] && collapsesUp[index + 1]);
                if (min && max) {
                    const upIndexes = arrays_1.range(index, -1);
                    const downIndexes = arrays_1.range(index + 1, this.viewItems.length);
                    const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
                    const snapAfterIndex = this.findFirstSnapIndex(downIndexes);
                    const snappedBefore = typeof snapBeforeIndex === 'number' && !this.viewItems[snapBeforeIndex].visible;
                    const snappedAfter = typeof snapAfterIndex === 'number' && !this.viewItems[snapAfterIndex].visible;
                    if (snappedBefore && collapsesUp[index] && (position > 0 || this.startSnappingEnabled)) {
                        sash.state = 1 /* Minimum */;
                    }
                    else if (snappedAfter && collapsesDown[index] && (position < this.contentSize || this.endSnappingEnabled)) {
                        sash.state = 2 /* Maximum */;
                    }
                    else {
                        sash.state = 0 /* Disabled */;
                    }
                }
                else if (min && !max) {
                    sash.state = 1 /* Minimum */;
                }
                else if (!min && max) {
                    sash.state = 2 /* Maximum */;
                }
                else {
                    sash.state = 3 /* Enabled */;
                }
            }
        }
        getSashPosition(sash) {
            let position = 0;
            for (let i = 0; i < this.sashItems.length; i++) {
                position += this.viewItems[i].size;
                if (this.sashItems[i].sash === sash) {
                    return position;
                }
            }
            return 0;
        }
        findFirstSnapIndex(indexes) {
            // visible views first
            for (const index of indexes) {
                const viewItem = this.viewItems[index];
                if (!viewItem.visible) {
                    continue;
                }
                if (viewItem.snap) {
                    return index;
                }
            }
            // then, hidden views
            for (const index of indexes) {
                const viewItem = this.viewItems[index];
                if (viewItem.visible && viewItem.maximumSize - viewItem.minimumSize > 0) {
                    return undefined;
                }
                if (!viewItem.visible && viewItem.snap) {
                    return index;
                }
            }
            return undefined;
        }
        dispose() {
            super.dispose();
            this.viewItems.forEach(i => i.dispose());
            this.viewItems = [];
            this.sashItems.forEach(i => i.disposable.dispose());
            this.sashItems = [];
        }
    }
    exports.SplitView = SplitView;
});
//# __sourceMappingURL=splitview.js.map