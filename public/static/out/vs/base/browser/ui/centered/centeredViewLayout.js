/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, splitview_1, dom_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CenteredViewLayout = void 0;
    const GOLDEN_RATIO = {
        leftMarginRatio: 0.1909,
        rightMarginRatio: 0.1909
    };
    function createEmptyView(background) {
        const element = dom_1.$('.centered-layout-margin');
        element.style.height = '100%';
        if (background) {
            element.style.backgroundColor = background.toString();
        }
        return {
            element,
            layout: () => undefined,
            minimumSize: 60,
            maximumSize: Number.POSITIVE_INFINITY,
            onDidChange: event_1.Event.None
        };
    }
    function toSplitViewView(view, getHeight) {
        return {
            element: view.element,
            get maximumSize() { return view.maximumWidth; },
            get minimumSize() { return view.minimumWidth; },
            onDidChange: event_1.Event.map(view.onDidChange, e => e && e.width),
            layout: (size, offset) => view.layout(size, getHeight(), 0, offset)
        };
    }
    class CenteredViewLayout {
        constructor(container, view, state = { leftMarginRatio: GOLDEN_RATIO.leftMarginRatio, rightMarginRatio: GOLDEN_RATIO.rightMarginRatio }) {
            this.container = container;
            this.view = view;
            this.state = state;
            this.width = 0;
            this.height = 0;
            this.didLayout = false;
            this.splitViewDisposables = new lifecycle_1.DisposableStore();
            this._boundarySashes = {};
            this.container.appendChild(this.view.element);
            // Make sure to hide the split view overflow like sashes #52892
            this.container.style.overflow = 'hidden';
        }
        get minimumWidth() { return this.splitView ? this.splitView.minimumSize : this.view.minimumWidth; }
        get maximumWidth() { return this.splitView ? this.splitView.maximumSize : this.view.maximumWidth; }
        get minimumHeight() { return this.view.minimumHeight; }
        get maximumHeight() { return this.view.maximumHeight; }
        get onDidChange() { return this.view.onDidChange; }
        get boundarySashes() { return this._boundarySashes; }
        set boundarySashes(boundarySashes) {
            this._boundarySashes = boundarySashes;
            if (!this.splitView) {
                return;
            }
            this.splitView.orthogonalStartSash = boundarySashes.top;
            this.splitView.orthogonalEndSash = boundarySashes.bottom;
        }
        layout(width, height) {
            this.width = width;
            this.height = height;
            if (this.splitView) {
                this.splitView.layout(width);
                if (!this.didLayout) {
                    this.resizeMargins();
                }
            }
            else {
                this.view.layout(width, height, 0, 0);
            }
            this.didLayout = true;
        }
        resizeMargins() {
            if (!this.splitView) {
                return;
            }
            this.splitView.resizeView(0, this.state.leftMarginRatio * this.width);
            this.splitView.resizeView(2, this.state.rightMarginRatio * this.width);
        }
        isActive() {
            return !!this.splitView;
        }
        styles(style) {
            this.style = style;
            if (this.splitView && this.emptyViews) {
                this.splitView.style(this.style);
                this.emptyViews[0].element.style.backgroundColor = this.style.background.toString();
                this.emptyViews[1].element.style.backgroundColor = this.style.background.toString();
            }
        }
        activate(active) {
            if (active === this.isActive()) {
                return;
            }
            if (active) {
                this.container.removeChild(this.view.element);
                this.splitView = new splitview_1.SplitView(this.container, {
                    inverseAltBehavior: true,
                    orientation: 1 /* HORIZONTAL */,
                    styles: this.style
                });
                this.splitView.orthogonalStartSash = this.boundarySashes.top;
                this.splitView.orthogonalEndSash = this.boundarySashes.bottom;
                this.splitViewDisposables.add(this.splitView.onDidSashChange(() => {
                    if (this.splitView) {
                        this.state.leftMarginRatio = this.splitView.getViewSize(0) / this.width;
                        this.state.rightMarginRatio = this.splitView.getViewSize(2) / this.width;
                    }
                }));
                this.splitViewDisposables.add(this.splitView.onDidSashReset(() => {
                    this.state.leftMarginRatio = GOLDEN_RATIO.leftMarginRatio;
                    this.state.rightMarginRatio = GOLDEN_RATIO.rightMarginRatio;
                    this.resizeMargins();
                }));
                this.splitView.layout(this.width);
                this.splitView.addView(toSplitViewView(this.view, () => this.height), 0);
                const backgroundColor = this.style ? this.style.background : undefined;
                this.emptyViews = [createEmptyView(backgroundColor), createEmptyView(backgroundColor)];
                this.splitView.addView(this.emptyViews[0], this.state.leftMarginRatio * this.width, 0);
                this.splitView.addView(this.emptyViews[1], this.state.rightMarginRatio * this.width, 2);
            }
            else {
                if (this.splitView) {
                    this.container.removeChild(this.splitView.el);
                }
                this.splitViewDisposables.clear();
                if (this.splitView) {
                    this.splitView.dispose();
                }
                this.splitView = undefined;
                this.emptyViews = undefined;
                this.container.appendChild(this.view.element);
            }
        }
        isDefault(state) {
            return state.leftMarginRatio === GOLDEN_RATIO.leftMarginRatio && state.rightMarginRatio === GOLDEN_RATIO.rightMarginRatio;
        }
        dispose() {
            this.splitViewDisposables.dispose();
            if (this.splitView) {
                this.splitView.dispose();
                this.splitView = undefined;
            }
        }
    }
    exports.CenteredViewLayout = CenteredViewLayout;
});
//# __sourceMappingURL=centeredViewLayout.js.map