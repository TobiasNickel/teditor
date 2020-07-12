/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/base/browser/touch", "vs/base/browser/mouseEvent", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/event", "vs/css!./sash"], function (require, exports, lifecycle_1, platform_1, types, touch_1, mouseEvent_1, event_1, dom_1, event_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sash = exports.setGlobalSashSize = exports.SashState = exports.Orientation = void 0;
    const DEBUG = false;
    var Orientation;
    (function (Orientation) {
        Orientation[Orientation["VERTICAL"] = 0] = "VERTICAL";
        Orientation[Orientation["HORIZONTAL"] = 1] = "HORIZONTAL";
    })(Orientation = exports.Orientation || (exports.Orientation = {}));
    var SashState;
    (function (SashState) {
        SashState[SashState["Disabled"] = 0] = "Disabled";
        SashState[SashState["Minimum"] = 1] = "Minimum";
        SashState[SashState["Maximum"] = 2] = "Maximum";
        SashState[SashState["Enabled"] = 3] = "Enabled";
    })(SashState = exports.SashState || (exports.SashState = {}));
    let globalSize = 4;
    const onDidChangeGlobalSize = new event_1.Emitter();
    function setGlobalSashSize(size) {
        globalSize = size;
        onDidChangeGlobalSize.fire(size);
    }
    exports.setGlobalSashSize = setGlobalSashSize;
    class Sash extends lifecycle_1.Disposable {
        constructor(container, layoutProvider, options) {
            super();
            this._state = 3 /* Enabled */;
            this._onDidEnablementChange = this._register(new event_1.Emitter());
            this.onDidEnablementChange = this._onDidEnablementChange.event;
            this._onDidStart = this._register(new event_1.Emitter());
            this.onDidStart = this._onDidStart.event;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidReset = this._register(new event_1.Emitter());
            this.onDidReset = this._onDidReset.event;
            this._onDidEnd = this._register(new event_1.Emitter());
            this.onDidEnd = this._onDidEnd.event;
            this.linkedSash = undefined;
            this.orthogonalStartSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.el = dom_1.append(container, dom_1.$('.monaco-sash'));
            if (platform_1.isMacintosh) {
                dom_1.addClass(this.el, 'mac');
            }
            this._register(event_2.domEvent(this.el, 'mousedown')(this.onMouseDown, this));
            this._register(event_2.domEvent(this.el, 'dblclick')(this.onMouseDoubleClick, this));
            this._register(touch_1.Gesture.addTarget(this.el));
            this._register(event_2.domEvent(this.el, touch_1.EventType.Start)(this.onTouchStart, this));
            if (typeof options.size === 'number') {
                this.size = options.size;
                if (options.orientation === 0 /* VERTICAL */) {
                    this.el.style.width = `${this.size}px`;
                }
                else {
                    this.el.style.height = `${this.size}px`;
                }
            }
            else {
                this.size = globalSize;
                this._register(onDidChangeGlobalSize.event(size => {
                    this.size = size;
                    this.layout();
                }));
            }
            this.hidden = false;
            this.layoutProvider = layoutProvider;
            this.orthogonalStartSash = options.orthogonalStartSash;
            this.orthogonalEndSash = options.orthogonalEndSash;
            this.orientation = options.orientation || 0 /* VERTICAL */;
            if (this.orientation === 1 /* HORIZONTAL */) {
                dom_1.addClass(this.el, 'horizontal');
                dom_1.removeClass(this.el, 'vertical');
            }
            else {
                dom_1.removeClass(this.el, 'horizontal');
                dom_1.addClass(this.el, 'vertical');
            }
            dom_1.toggleClass(this.el, 'debug', DEBUG);
            this.layout();
        }
        get state() { return this._state; }
        set state(state) {
            if (this._state === state) {
                return;
            }
            dom_1.toggleClass(this.el, 'disabled', state === 0 /* Disabled */);
            dom_1.toggleClass(this.el, 'minimum', state === 1 /* Minimum */);
            dom_1.toggleClass(this.el, 'maximum', state === 2 /* Maximum */);
            this._state = state;
            this._onDidEnablementChange.fire(state);
        }
        get orthogonalStartSash() { return this._orthogonalStartSash; }
        set orthogonalStartSash(sash) {
            this.orthogonalStartSashDisposables.clear();
            if (sash) {
                this.orthogonalStartSashDisposables.add(sash.onDidEnablementChange(this.onOrthogonalStartSashEnablementChange, this));
                this.onOrthogonalStartSashEnablementChange(sash.state);
            }
            else {
                this.onOrthogonalStartSashEnablementChange(0 /* Disabled */);
            }
            this._orthogonalStartSash = sash;
        }
        get orthogonalEndSash() { return this._orthogonalEndSash; }
        set orthogonalEndSash(sash) {
            this.orthogonalEndSashDisposables.clear();
            if (sash) {
                this.orthogonalEndSashDisposables.add(sash.onDidEnablementChange(this.onOrthogonalEndSashEnablementChange, this));
                this.onOrthogonalEndSashEnablementChange(sash.state);
            }
            else {
                this.onOrthogonalEndSashEnablementChange(0 /* Disabled */);
            }
            this._orthogonalEndSash = sash;
        }
        onMouseDown(e) {
            dom_1.EventHelper.stop(e, false);
            let isMultisashResize = false;
            if (!e.__orthogonalSashEvent) {
                const orthogonalSash = this.getOrthogonalSash(e);
                if (orthogonalSash) {
                    isMultisashResize = true;
                    e.__orthogonalSashEvent = true;
                    orthogonalSash.onMouseDown(e);
                }
            }
            if (this.linkedSash && !e.__linkedSashEvent) {
                e.__linkedSashEvent = true;
                this.linkedSash.onMouseDown(e);
            }
            if (!this.state) {
                return;
            }
            // Select both iframes and webviews; internally Electron nests an iframe
            // in its <webview> component, but this isn't queryable.
            const iframes = [
                ...dom_1.getElementsByTagName('iframe'),
                ...dom_1.getElementsByTagName('webview'),
            ];
            for (const iframe of iframes) {
                iframe.style.pointerEvents = 'none'; // disable mouse events on iframes as long as we drag the sash
            }
            const mouseDownEvent = new mouseEvent_1.StandardMouseEvent(e);
            const startX = mouseDownEvent.posx;
            const startY = mouseDownEvent.posy;
            const altKey = mouseDownEvent.altKey;
            const startEvent = { startX, currentX: startX, startY, currentY: startY, altKey };
            dom_1.addClass(this.el, 'active');
            this._onDidStart.fire(startEvent);
            // fix https://github.com/Microsoft/vscode/issues/21675
            const style = dom_1.createStyleSheet(this.el);
            const updateStyle = () => {
                let cursor = '';
                if (isMultisashResize) {
                    cursor = 'all-scroll';
                }
                else if (this.orientation === 1 /* HORIZONTAL */) {
                    if (this.state === 1 /* Minimum */) {
                        cursor = 's-resize';
                    }
                    else if (this.state === 2 /* Maximum */) {
                        cursor = 'n-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'row-resize' : 'ns-resize';
                    }
                }
                else {
                    if (this.state === 1 /* Minimum */) {
                        cursor = 'e-resize';
                    }
                    else if (this.state === 2 /* Maximum */) {
                        cursor = 'w-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'col-resize' : 'ew-resize';
                    }
                }
                style.innerHTML = `* { cursor: ${cursor} !important; }`;
            };
            const disposables = new lifecycle_1.DisposableStore();
            updateStyle();
            if (!isMultisashResize) {
                this.onDidEnablementChange(updateStyle, null, disposables);
            }
            const onMouseMove = (e) => {
                dom_1.EventHelper.stop(e, false);
                const mouseMoveEvent = new mouseEvent_1.StandardMouseEvent(e);
                const event = { startX, currentX: mouseMoveEvent.posx, startY, currentY: mouseMoveEvent.posy, altKey };
                this._onDidChange.fire(event);
            };
            const onMouseUp = (e) => {
                dom_1.EventHelper.stop(e, false);
                this.el.removeChild(style);
                dom_1.removeClass(this.el, 'active');
                this._onDidEnd.fire();
                disposables.dispose();
                for (const iframe of iframes) {
                    iframe.style.pointerEvents = 'auto';
                }
            };
            event_2.domEvent(window, 'mousemove')(onMouseMove, null, disposables);
            event_2.domEvent(window, 'mouseup')(onMouseUp, null, disposables);
        }
        onMouseDoubleClick(e) {
            const orthogonalSash = this.getOrthogonalSash(e);
            if (orthogonalSash) {
                orthogonalSash._onDidReset.fire();
            }
            if (this.linkedSash) {
                this.linkedSash._onDidReset.fire();
            }
            this._onDidReset.fire();
        }
        onTouchStart(event) {
            dom_1.EventHelper.stop(event);
            const listeners = [];
            const startX = event.pageX;
            const startY = event.pageY;
            const altKey = event.altKey;
            this._onDidStart.fire({
                startX: startX,
                currentX: startX,
                startY: startY,
                currentY: startY,
                altKey
            });
            listeners.push(dom_1.addDisposableListener(this.el, touch_1.EventType.Change, (event) => {
                if (types.isNumber(event.pageX) && types.isNumber(event.pageY)) {
                    this._onDidChange.fire({
                        startX: startX,
                        currentX: event.pageX,
                        startY: startY,
                        currentY: event.pageY,
                        altKey
                    });
                }
            }));
            listeners.push(dom_1.addDisposableListener(this.el, touch_1.EventType.End, (event) => {
                this._onDidEnd.fire();
                lifecycle_1.dispose(listeners);
            }));
        }
        layout() {
            if (this.orientation === 0 /* VERTICAL */) {
                const verticalProvider = this.layoutProvider;
                this.el.style.left = verticalProvider.getVerticalSashLeft(this) - (this.size / 2) + 'px';
                if (verticalProvider.getVerticalSashTop) {
                    this.el.style.top = verticalProvider.getVerticalSashTop(this) + 'px';
                }
                if (verticalProvider.getVerticalSashHeight) {
                    this.el.style.height = verticalProvider.getVerticalSashHeight(this) + 'px';
                }
            }
            else {
                const horizontalProvider = this.layoutProvider;
                this.el.style.top = horizontalProvider.getHorizontalSashTop(this) - (this.size / 2) + 'px';
                if (horizontalProvider.getHorizontalSashLeft) {
                    this.el.style.left = horizontalProvider.getHorizontalSashLeft(this) + 'px';
                }
                if (horizontalProvider.getHorizontalSashWidth) {
                    this.el.style.width = horizontalProvider.getHorizontalSashWidth(this) + 'px';
                }
            }
        }
        show() {
            this.hidden = false;
            this.el.style.removeProperty('display');
            this.el.setAttribute('aria-hidden', 'false');
        }
        hide() {
            this.hidden = true;
            this.el.style.display = 'none';
            this.el.setAttribute('aria-hidden', 'true');
        }
        isHidden() {
            return this.hidden;
        }
        onOrthogonalStartSashEnablementChange(state) {
            dom_1.toggleClass(this.el, 'orthogonal-start', state !== 0 /* Disabled */);
        }
        onOrthogonalEndSashEnablementChange(state) {
            dom_1.toggleClass(this.el, 'orthogonal-end', state !== 0 /* Disabled */);
        }
        getOrthogonalSash(e) {
            if (this.orientation === 0 /* VERTICAL */) {
                if (e.offsetY <= this.size) {
                    return this.orthogonalStartSash;
                }
                else if (e.offsetY >= this.el.clientHeight - this.size) {
                    return this.orthogonalEndSash;
                }
            }
            else {
                if (e.offsetX <= this.size) {
                    return this.orthogonalStartSash;
                }
                else if (e.offsetX >= this.el.clientWidth - this.size) {
                    return this.orthogonalEndSash;
                }
            }
            return undefined;
        }
        dispose() {
            super.dispose();
            this.el.remove();
        }
    }
    exports.Sash = Sash;
});
//# __sourceMappingURL=sash.js.map