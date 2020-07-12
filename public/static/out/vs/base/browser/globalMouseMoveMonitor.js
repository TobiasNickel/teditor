/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/platform", "vs/base/browser/iframe", "vs/base/browser/mouseEvent", "vs/base/common/lifecycle", "vs/base/browser/canIUse"], function (require, exports, dom, platform, iframe_1, mouseEvent_1, lifecycle_1, canIUse_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalMouseMoveMonitor = exports.standardMouseMoveMerger = void 0;
    function standardMouseMoveMerger(lastEvent, currentEvent) {
        let ev = new mouseEvent_1.StandardMouseEvent(currentEvent);
        ev.preventDefault();
        return {
            leftButton: ev.leftButton,
            buttons: ev.buttons,
            posx: ev.posx,
            posy: ev.posy
        };
    }
    exports.standardMouseMoveMerger = standardMouseMoveMerger;
    class GlobalMouseMoveMonitor {
        constructor() {
            this._hooks = new lifecycle_1.DisposableStore();
            this._mouseMoveEventMerger = null;
            this._mouseMoveCallback = null;
            this._onStopCallback = null;
        }
        dispose() {
            this.stopMonitoring(false);
            this._hooks.dispose();
        }
        stopMonitoring(invokeStopCallback) {
            if (!this.isMonitoring()) {
                // Not monitoring
                return;
            }
            // Unhook
            this._hooks.clear();
            this._mouseMoveEventMerger = null;
            this._mouseMoveCallback = null;
            const onStopCallback = this._onStopCallback;
            this._onStopCallback = null;
            if (invokeStopCallback && onStopCallback) {
                onStopCallback();
            }
        }
        isMonitoring() {
            return !!this._mouseMoveEventMerger;
        }
        startMonitoring(initialElement, initialButtons, mouseMoveEventMerger, mouseMoveCallback, onStopCallback) {
            if (this.isMonitoring()) {
                // I am already hooked
                return;
            }
            this._mouseMoveEventMerger = mouseMoveEventMerger;
            this._mouseMoveCallback = mouseMoveCallback;
            this._onStopCallback = onStopCallback;
            const windowChain = iframe_1.IframeUtils.getSameOriginWindowChain();
            const mouseMove = platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? 'pointermove' : 'mousemove';
            const mouseUp = platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? 'pointerup' : 'mouseup';
            const listenTo = windowChain.map(element => element.window.document);
            const shadowRoot = dom.getShadowRoot(initialElement);
            if (shadowRoot) {
                listenTo.unshift(shadowRoot);
            }
            for (const element of listenTo) {
                this._hooks.add(dom.addDisposableThrottledListener(element, mouseMove, (data) => {
                    if (data.buttons !== initialButtons) {
                        // Buttons state has changed in the meantime
                        this.stopMonitoring(true);
                        return;
                    }
                    this._mouseMoveCallback(data);
                }, (lastEvent, currentEvent) => this._mouseMoveEventMerger(lastEvent, currentEvent)));
                this._hooks.add(dom.addDisposableListener(element, mouseUp, (e) => this.stopMonitoring(true)));
            }
            if (iframe_1.IframeUtils.hasDifferentOriginAncestor()) {
                let lastSameOriginAncestor = windowChain[windowChain.length - 1];
                // We might miss a mouse up if it happens outside the iframe
                // This one is for Chrome
                this._hooks.add(dom.addDisposableListener(lastSameOriginAncestor.window.document, 'mouseout', (browserEvent) => {
                    let e = new mouseEvent_1.StandardMouseEvent(browserEvent);
                    if (e.target.tagName.toLowerCase() === 'html') {
                        this.stopMonitoring(true);
                    }
                }));
                // This one is for FF
                this._hooks.add(dom.addDisposableListener(lastSameOriginAncestor.window.document, 'mouseover', (browserEvent) => {
                    let e = new mouseEvent_1.StandardMouseEvent(browserEvent);
                    if (e.target.tagName.toLowerCase() === 'html') {
                        this.stopMonitoring(true);
                    }
                }));
                // This one is for IE
                this._hooks.add(dom.addDisposableListener(lastSameOriginAncestor.window.document.body, 'mouseleave', (browserEvent) => {
                    this.stopMonitoring(true);
                }));
            }
        }
    }
    exports.GlobalMouseMoveMonitor = GlobalMouseMoveMonitor;
});
//# __sourceMappingURL=globalMouseMoveMonitor.js.map