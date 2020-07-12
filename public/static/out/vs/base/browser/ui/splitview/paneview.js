/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/color", "./splitview", "vs/base/browser/browser", "vs/base/browser/dnd", "vs/nls", "vs/css!./paneview"], function (require, exports, lifecycle_1, event_1, event_2, keyboardEvent_1, dom_1, arrays_1, color_1, splitview_1, browser_1, dnd_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneView = exports.DefaultPaneDndController = exports.Pane = void 0;
    /**
     * A Pane is a structured SplitView view.
     *
     * WARNING: You must call `render()` after you contruct it.
     * It can't be done automatically at the end of the ctor
     * because of the order of property initialization in TypeScript.
     * Subclasses wouldn't be able to set own properties
     * before the `render()` call, thus forbiding their use.
     */
    class Pane extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this.expandedSize = undefined;
            this._headerVisible = true;
            this.styles = {};
            this.animationTimer = undefined;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidChangeExpansionState = this._register(new event_1.Emitter());
            this.onDidChangeExpansionState = this._onDidChangeExpansionState.event;
            this.orthogonalSize = 0;
            this._expanded = typeof options.expanded === 'undefined' ? true : !!options.expanded;
            this._orientation = typeof options.orientation === 'undefined' ? 0 /* VERTICAL */ : options.orientation;
            this.ariaHeaderLabel = nls_1.localize('viewSection', "{0} Section", options.title);
            this._minimumBodySize = typeof options.minimumBodySize === 'number' ? options.minimumBodySize : this._orientation === 1 /* HORIZONTAL */ ? 200 : 120;
            this._maximumBodySize = typeof options.maximumBodySize === 'number' ? options.maximumBodySize : Number.POSITIVE_INFINITY;
            this.element = dom_1.$('.pane');
        }
        get draggableElement() {
            return this.header;
        }
        get dropTargetElement() {
            return this.element;
        }
        get dropBackground() {
            return this._dropBackground;
        }
        get minimumBodySize() {
            return this._minimumBodySize;
        }
        set minimumBodySize(size) {
            this._minimumBodySize = size;
            this._onDidChange.fire(undefined);
        }
        get maximumBodySize() {
            return this._maximumBodySize;
        }
        set maximumBodySize(size) {
            this._maximumBodySize = size;
            this._onDidChange.fire(undefined);
        }
        get headerSize() {
            return this.headerVisible ? Pane.HEADER_SIZE : 0;
        }
        get minimumSize() {
            const headerSize = this.headerSize;
            const expanded = !this.headerVisible || this.isExpanded();
            const minimumBodySize = expanded ? this.minimumBodySize : 0;
            return headerSize + minimumBodySize;
        }
        get maximumSize() {
            const headerSize = this.headerSize;
            const expanded = !this.headerVisible || this.isExpanded();
            const maximumBodySize = expanded ? this.maximumBodySize : 0;
            return headerSize + maximumBodySize;
        }
        isExpanded() {
            return this._expanded;
        }
        setExpanded(expanded) {
            if (this._expanded === !!expanded) {
                return false;
            }
            if (this.element) {
                dom_1.toggleClass(this.element, 'expanded', expanded);
            }
            this._expanded = !!expanded;
            this.updateHeader();
            if (expanded) {
                if (typeof this.animationTimer === 'number') {
                    clearTimeout(this.animationTimer);
                }
                dom_1.append(this.element, this.body);
            }
            else {
                this.animationTimer = window.setTimeout(() => {
                    this.body.remove();
                }, 200);
            }
            this._onDidChangeExpansionState.fire(expanded);
            this._onDidChange.fire(expanded ? this.expandedSize : undefined);
            return true;
        }
        get headerVisible() {
            return this._headerVisible;
        }
        set headerVisible(visible) {
            if (this._headerVisible === !!visible) {
                return;
            }
            this._headerVisible = !!visible;
            this.updateHeader();
            this._onDidChange.fire(undefined);
        }
        get orientation() {
            return this._orientation;
        }
        set orientation(orientation) {
            if (this._orientation === orientation) {
                return;
            }
            this._orientation = orientation;
            if (this.element) {
                dom_1.toggleClass(this.element, 'horizontal', this.orientation === 1 /* HORIZONTAL */);
                dom_1.toggleClass(this.element, 'vertical', this.orientation === 0 /* VERTICAL */);
            }
            if (this.header) {
                this.updateHeader();
            }
        }
        render() {
            dom_1.toggleClass(this.element, 'expanded', this.isExpanded());
            dom_1.toggleClass(this.element, 'horizontal', this.orientation === 1 /* HORIZONTAL */);
            dom_1.toggleClass(this.element, 'vertical', this.orientation === 0 /* VERTICAL */);
            this.header = dom_1.$('.pane-header');
            dom_1.append(this.element, this.header);
            this.header.setAttribute('tabindex', '0');
            // Use role button so the aria-expanded state gets read https://github.com/microsoft/vscode/issues/95996
            this.header.setAttribute('role', 'button');
            this.header.setAttribute('aria-label', this.ariaHeaderLabel);
            this.renderHeader(this.header);
            const focusTracker = dom_1.trackFocus(this.header);
            this._register(focusTracker);
            this._register(focusTracker.onDidFocus(() => dom_1.addClass(this.header, 'focused'), null));
            this._register(focusTracker.onDidBlur(() => dom_1.removeClass(this.header, 'focused'), null));
            this.updateHeader();
            const onHeaderKeyDown = event_1.Event.chain(event_2.domEvent(this.header, 'keydown'))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e));
            this._register(onHeaderKeyDown.filter(e => e.keyCode === 3 /* Enter */ || e.keyCode === 10 /* Space */)
                .event(() => this.setExpanded(!this.isExpanded()), null));
            this._register(onHeaderKeyDown.filter(e => e.keyCode === 15 /* LeftArrow */)
                .event(() => this.setExpanded(false), null));
            this._register(onHeaderKeyDown.filter(e => e.keyCode === 17 /* RightArrow */)
                .event(() => this.setExpanded(true), null));
            this._register(event_2.domEvent(this.header, 'click')(e => {
                if (!e.defaultPrevented) {
                    this.setExpanded(!this.isExpanded());
                }
            }, null));
            this.body = dom_1.append(this.element, dom_1.$('.pane-body'));
            this.renderBody(this.body);
            if (!this.isExpanded()) {
                this.body.remove();
            }
        }
        layout(size) {
            const headerSize = this.headerVisible ? Pane.HEADER_SIZE : 0;
            const width = this._orientation === 0 /* VERTICAL */ ? this.orthogonalSize : size;
            const height = this._orientation === 0 /* VERTICAL */ ? size - headerSize : this.orthogonalSize - headerSize;
            if (this.isExpanded()) {
                dom_1.toggleClass(this.body, 'wide', width >= 600);
                this.layoutBody(height, width);
                this.expandedSize = size;
            }
        }
        style(styles) {
            this.styles = styles;
            if (!this.header) {
                return;
            }
            this.updateHeader();
        }
        updateHeader() {
            const expanded = !this.headerVisible || this.isExpanded();
            this.header.style.lineHeight = `${this.headerSize}px`;
            dom_1.toggleClass(this.header, 'hidden', !this.headerVisible);
            dom_1.toggleClass(this.header, 'expanded', expanded);
            this.header.setAttribute('aria-expanded', String(expanded));
            this.header.style.color = this.styles.headerForeground ? this.styles.headerForeground.toString() : '';
            this.header.style.backgroundColor = this.styles.headerBackground ? this.styles.headerBackground.toString() : '';
            this.header.style.borderTop = this.styles.headerBorder && this.orientation === 0 /* VERTICAL */ ? `1px solid ${this.styles.headerBorder}` : '';
            this._dropBackground = this.styles.dropBackground;
            this.element.style.borderLeft = this.styles.leftBorder && this.orientation === 1 /* HORIZONTAL */ ? `1px solid ${this.styles.leftBorder}` : '';
        }
    }
    exports.Pane = Pane;
    Pane.HEADER_SIZE = 22;
    class PaneDraggable extends lifecycle_1.Disposable {
        constructor(pane, dnd, context) {
            super();
            this.pane = pane;
            this.dnd = dnd;
            this.context = context;
            this.dragOverCounter = 0; // see https://github.com/Microsoft/vscode/issues/14470
            this._onDidDrop = this._register(new event_1.Emitter());
            this.onDidDrop = this._onDidDrop.event;
            pane.draggableElement.draggable = true;
            this._register(event_2.domEvent(pane.draggableElement, 'dragstart')(this.onDragStart, this));
            this._register(event_2.domEvent(pane.dropTargetElement, 'dragenter')(this.onDragEnter, this));
            this._register(event_2.domEvent(pane.dropTargetElement, 'dragleave')(this.onDragLeave, this));
            this._register(event_2.domEvent(pane.dropTargetElement, 'dragend')(this.onDragEnd, this));
            this._register(event_2.domEvent(pane.dropTargetElement, 'drop')(this.onDrop, this));
        }
        onDragStart(e) {
            var _a;
            if (!this.dnd.canDrag(this.pane) || !e.dataTransfer) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            e.dataTransfer.effectAllowed = 'move';
            if (browser_1.isFirefox) {
                // Firefox: requires to set a text data transfer to get going
                (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData(dnd_1.DataTransfers.TEXT, this.pane.draggableElement.textContent || '');
            }
            const dragImage = dom_1.append(document.body, dom_1.$('.monaco-drag-image', {}, this.pane.draggableElement.textContent || ''));
            e.dataTransfer.setDragImage(dragImage, -10, -10);
            setTimeout(() => document.body.removeChild(dragImage), 0);
            this.context.draggable = this;
        }
        onDragEnter(e) {
            if (!this.context.draggable || this.context.draggable === this) {
                return;
            }
            if (!this.dnd.canDrop(this.context.draggable.pane, this.pane)) {
                return;
            }
            this.dragOverCounter++;
            this.render();
        }
        onDragLeave(e) {
            if (!this.context.draggable || this.context.draggable === this) {
                return;
            }
            if (!this.dnd.canDrop(this.context.draggable.pane, this.pane)) {
                return;
            }
            this.dragOverCounter--;
            if (this.dragOverCounter === 0) {
                this.render();
            }
        }
        onDragEnd(e) {
            if (!this.context.draggable) {
                return;
            }
            this.dragOverCounter = 0;
            this.render();
            this.context.draggable = null;
        }
        onDrop(e) {
            if (!this.context.draggable) {
                return;
            }
            dom_1.EventHelper.stop(e);
            this.dragOverCounter = 0;
            this.render();
            if (this.dnd.canDrop(this.context.draggable.pane, this.pane) && this.context.draggable !== this) {
                this._onDidDrop.fire({ from: this.context.draggable.pane, to: this.pane });
            }
            this.context.draggable = null;
        }
        render() {
            let backgroundColor = null;
            if (this.dragOverCounter > 0) {
                backgroundColor = (this.pane.dropBackground || PaneDraggable.DefaultDragOverBackgroundColor).toString();
            }
            this.pane.dropTargetElement.style.backgroundColor = backgroundColor || '';
        }
    }
    PaneDraggable.DefaultDragOverBackgroundColor = new color_1.Color(new color_1.RGBA(128, 128, 128, 0.5));
    class DefaultPaneDndController {
        canDrag(pane) {
            return true;
        }
        canDrop(pane, overPane) {
            return true;
        }
    }
    exports.DefaultPaneDndController = DefaultPaneDndController;
    class PaneView extends lifecycle_1.Disposable {
        constructor(container, options = {}) {
            var _a;
            super();
            this.dndContext = { draggable: null };
            this.paneItems = [];
            this.orthogonalSize = 0;
            this.size = 0;
            this.animationTimer = undefined;
            this._onDidDrop = this._register(new event_1.Emitter());
            this.onDidDrop = this._onDidDrop.event;
            this.dnd = options.dnd;
            this.orientation = (_a = options.orientation) !== null && _a !== void 0 ? _a : 0 /* VERTICAL */;
            this.el = dom_1.append(container, dom_1.$('.monaco-pane-view'));
            this.splitview = this._register(new splitview_1.SplitView(this.el, { orientation: this.orientation }));
            this.onDidSashChange = this.splitview.onDidSashChange;
        }
        addPane(pane, size, index = this.splitview.length) {
            const disposables = new lifecycle_1.DisposableStore();
            pane.onDidChangeExpansionState(this.setupAnimation, this, disposables);
            const paneItem = { pane: pane, disposable: disposables };
            this.paneItems.splice(index, 0, paneItem);
            pane.orientation = this.orientation;
            pane.orthogonalSize = this.orthogonalSize;
            this.splitview.addView(pane, size, index);
            if (this.dnd) {
                const draggable = new PaneDraggable(pane, this.dnd, this.dndContext);
                disposables.add(draggable);
                disposables.add(draggable.onDidDrop(this._onDidDrop.fire, this._onDidDrop));
            }
        }
        removePane(pane) {
            const index = arrays_1.firstIndex(this.paneItems, item => item.pane === pane);
            if (index === -1) {
                return;
            }
            this.splitview.removeView(index);
            const paneItem = this.paneItems.splice(index, 1)[0];
            paneItem.disposable.dispose();
        }
        movePane(from, to) {
            const fromIndex = arrays_1.firstIndex(this.paneItems, item => item.pane === from);
            const toIndex = arrays_1.firstIndex(this.paneItems, item => item.pane === to);
            if (fromIndex === -1 || toIndex === -1) {
                return;
            }
            const [paneItem] = this.paneItems.splice(fromIndex, 1);
            this.paneItems.splice(toIndex, 0, paneItem);
            this.splitview.moveView(fromIndex, toIndex);
        }
        resizePane(pane, size) {
            const index = arrays_1.firstIndex(this.paneItems, item => item.pane === pane);
            if (index === -1) {
                return;
            }
            this.splitview.resizeView(index, size);
        }
        getPaneSize(pane) {
            const index = arrays_1.firstIndex(this.paneItems, item => item.pane === pane);
            if (index === -1) {
                return -1;
            }
            return this.splitview.getViewSize(index);
        }
        layout(height, width) {
            this.orthogonalSize = this.orientation === 0 /* VERTICAL */ ? width : height;
            this.size = this.orientation === 1 /* HORIZONTAL */ ? width : height;
            for (const paneItem of this.paneItems) {
                paneItem.pane.orthogonalSize = this.orthogonalSize;
            }
            this.splitview.layout(this.size);
        }
        flipOrientation(height, width) {
            this.orientation = this.orientation === 0 /* VERTICAL */ ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
            const paneSizes = this.paneItems.map(pane => this.getPaneSize(pane.pane));
            this.splitview.dispose();
            dom_1.clearNode(this.el);
            this.splitview = this._register(new splitview_1.SplitView(this.el, { orientation: this.orientation }));
            const newOrthogonalSize = this.orientation === 0 /* VERTICAL */ ? width : height;
            const newSize = this.orientation === 1 /* HORIZONTAL */ ? width : height;
            this.paneItems.forEach((pane, index) => {
                pane.pane.orthogonalSize = newOrthogonalSize;
                pane.pane.orientation = this.orientation;
                const viewSize = this.size === 0 ? 0 : (newSize * paneSizes[index]) / this.size;
                this.splitview.addView(pane.pane, viewSize, index);
            });
            this.size = newSize;
            this.orthogonalSize = newOrthogonalSize;
            this.splitview.layout(this.size);
        }
        setupAnimation() {
            if (typeof this.animationTimer === 'number') {
                window.clearTimeout(this.animationTimer);
            }
            dom_1.addClass(this.el, 'animated');
            this.animationTimer = window.setTimeout(() => {
                this.animationTimer = undefined;
                dom_1.removeClass(this.el, 'animated');
            }, 200);
        }
        dispose() {
            super.dispose();
            this.paneItems.forEach(i => i.disposable.dispose());
        }
    }
    exports.PaneView = PaneView;
});
//# __sourceMappingURL=paneview.js.map