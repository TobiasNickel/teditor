/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/platform", "vs/base/browser/touch", "vs/base/common/lifecycle", "vs/editor/browser/controller/mouseHandler", "vs/editor/browser/editorDom", "vs/base/browser/canIUse"], function (require, exports, dom, platform, touch_1, lifecycle_1, mouseHandler_1, editorDom_1, canIUse_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PointerHandler = exports.PointerEventHandler = void 0;
    function gestureChangeEventMerger(lastEvent, currentEvent) {
        const r = {
            translationY: currentEvent.translationY,
            translationX: currentEvent.translationX
        };
        if (lastEvent) {
            r.translationY += lastEvent.translationY;
            r.translationX += lastEvent.translationX;
        }
        return r;
    }
    /**
     * Basically Edge but should be modified to handle any pointerEnabled, even without support of MSGesture
     */
    class StandardPointerHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this.viewHelper.linesContentDomNode.style.touchAction = 'none';
            // TODO@Alex -> this expects that the view is added in 100 ms, might not be the case
            // This handler should be added when the dom node is in the dom tree
            this._installGestureHandlerTimeout = window.setTimeout(() => {
                this._installGestureHandlerTimeout = -1;
                // TODO@Alex: replace the usage of MSGesture here with something that works across all browsers
                if (window.MSGesture) {
                    const touchGesture = new MSGesture();
                    const penGesture = new MSGesture();
                    touchGesture.target = this.viewHelper.linesContentDomNode;
                    penGesture.target = this.viewHelper.linesContentDomNode;
                    this.viewHelper.linesContentDomNode.addEventListener('pointerdown', (e) => {
                        const pointerType = e.pointerType;
                        if (pointerType === 'mouse') {
                            this._lastPointerType = 'mouse';
                            return;
                        }
                        else if (pointerType === 'touch') {
                            this._lastPointerType = 'touch';
                            touchGesture.addPointer(e.pointerId);
                        }
                        else {
                            this._lastPointerType = 'pen';
                            penGesture.addPointer(e.pointerId);
                        }
                    });
                    this._register(dom.addDisposableThrottledListener(this.viewHelper.linesContentDomNode, 'MSGestureChange', (e) => this._onGestureChange(e), gestureChangeEventMerger));
                    this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, 'MSGestureTap', (e) => this._onCaptureGestureTap(e), true));
                }
            }, 100);
            this._lastPointerType = 'mouse';
        }
        _onMouseDown(e) {
            if (this._lastPointerType === 'mouse') {
                super._onMouseDown(e);
            }
        }
        _onCaptureGestureTap(rawEvent) {
            const e = new editorDom_1.EditorMouseEvent(rawEvent, this.viewHelper.viewDomNode);
            const t = this._createMouseTarget(e, false);
            if (t.position) {
                this.viewController.moveTo(t.position);
            }
            // IE does not want to focus when coming in from the browser's address bar
            if (e.browserEvent.fromElement) {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            }
            else {
                // TODO@Alex -> cancel this is focus is lost
                setTimeout(() => {
                    this.viewHelper.focusTextArea();
                });
            }
        }
        _onGestureChange(e) {
            this._context.model.deltaScrollNow(-e.translationX, -e.translationY);
        }
        dispose() {
            window.clearTimeout(this._installGestureHandlerTimeout);
            super.dispose();
        }
    }
    /**
     * Currently only tested on iOS 13/ iPadOS.
     */
    class PointerEventHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this._register(touch_1.Gesture.addTarget(this.viewHelper.linesContentDomNode));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Tap, (e) => this.onTap(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Change, (e) => this.onChange(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Contextmenu, (e) => this._onContextMenu(new editorDom_1.EditorMouseEvent(e, this.viewHelper.viewDomNode), false)));
            this._lastPointerType = 'mouse';
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, 'pointerdown', (e) => {
                const pointerType = e.pointerType;
                if (pointerType === 'mouse') {
                    this._lastPointerType = 'mouse';
                    return;
                }
                else if (pointerType === 'touch') {
                    this._lastPointerType = 'touch';
                }
                else {
                    this._lastPointerType = 'pen';
                }
            }));
            // PonterEvents
            const pointerEvents = new editorDom_1.EditorPointerEventFactory(this.viewHelper.viewDomNode);
            this._register(pointerEvents.onPointerMoveThrottled(this.viewHelper.viewDomNode, (e) => this._onMouseMove(e), mouseHandler_1.createMouseMoveEventMerger(this.mouseTargetFactory), mouseHandler_1.MouseHandler.MOUSE_MOVE_MINIMUM_TIME));
            this._register(pointerEvents.onPointerUp(this.viewHelper.viewDomNode, (e) => this._onMouseUp(e)));
            this._register(pointerEvents.onPointerLeave(this.viewHelper.viewDomNode, (e) => this._onMouseLeave(e)));
            this._register(pointerEvents.onPointerDown(this.viewHelper.viewDomNode, (e) => this._onMouseDown(e)));
        }
        onTap(event) {
            if (!event.initialTarget || !this.viewHelper.linesContentDomNode.contains(event.initialTarget)) {
                return;
            }
            event.preventDefault();
            this.viewHelper.focusTextArea();
            const target = this._createMouseTarget(new editorDom_1.EditorMouseEvent(event, this.viewHelper.viewDomNode), false);
            if (target.position) {
                // this.viewController.moveTo(target.position);
                this.viewController.dispatchMouse({
                    position: target.position,
                    mouseColumn: target.position.column,
                    startedOnLineNumbers: false,
                    mouseDownCount: event.tapCount,
                    inSelectionMode: false,
                    altKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    shiftKey: false,
                    leftButton: false,
                    middleButton: false,
                });
            }
        }
        onChange(e) {
            if (this._lastPointerType === 'touch') {
                this._context.model.deltaScrollNow(-e.translationX, -e.translationY);
            }
        }
        _onMouseDown(e) {
            if (e.target && this.viewHelper.linesContentDomNode.contains(e.target) && this._lastPointerType === 'touch') {
                return;
            }
            super._onMouseDown(e);
        }
    }
    exports.PointerEventHandler = PointerEventHandler;
    class TouchHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this._register(touch_1.Gesture.addTarget(this.viewHelper.linesContentDomNode));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Tap, (e) => this.onTap(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Change, (e) => this.onChange(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Contextmenu, (e) => this._onContextMenu(new editorDom_1.EditorMouseEvent(e, this.viewHelper.viewDomNode), false)));
        }
        onTap(event) {
            event.preventDefault();
            this.viewHelper.focusTextArea();
            const target = this._createMouseTarget(new editorDom_1.EditorMouseEvent(event, this.viewHelper.viewDomNode), false);
            if (target.position) {
                this.viewController.moveTo(target.position);
            }
        }
        onChange(e) {
            this._context.model.deltaScrollNow(-e.translationX, -e.translationY);
        }
    }
    class PointerHandler extends lifecycle_1.Disposable {
        constructor(context, viewController, viewHelper) {
            super();
            if ((platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents)) {
                this.handler = this._register(new PointerEventHandler(context, viewController, viewHelper));
            }
            else if (window.TouchEvent) {
                this.handler = this._register(new TouchHandler(context, viewController, viewHelper));
            }
            else if (window.navigator.pointerEnabled || window.PointerEvent) {
                this.handler = this._register(new StandardPointerHandler(context, viewController, viewHelper));
            }
            else {
                this.handler = this._register(new mouseHandler_1.MouseHandler(context, viewController, viewHelper));
            }
        }
        getTargetAtClientPoint(clientX, clientY) {
            return this.handler.getTargetAtClientPoint(clientX, clientY);
        }
    }
    exports.PointerHandler = PointerHandler;
});
//# __sourceMappingURL=pointerHandler.js.map