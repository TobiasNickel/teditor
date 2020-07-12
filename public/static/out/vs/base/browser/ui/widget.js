/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/common/lifecycle", "vs/base/browser/touch"], function (require, exports, dom, keyboardEvent_1, mouseEvent_1, lifecycle_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Widget = void 0;
    class Widget extends lifecycle_1.Disposable {
        onclick(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.CLICK, (e) => listener(new mouseEvent_1.StandardMouseEvent(e))));
        }
        onmousedown(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_DOWN, (e) => listener(new mouseEvent_1.StandardMouseEvent(e))));
        }
        onmouseover(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.MOUSE_OVER, (e) => listener(new mouseEvent_1.StandardMouseEvent(e))));
        }
        onnonbubblingmouseout(domNode, listener) {
            this._register(dom.addDisposableNonBubblingMouseOutListener(domNode, (e) => listener(new mouseEvent_1.StandardMouseEvent(e))));
        }
        onkeydown(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => listener(new keyboardEvent_1.StandardKeyboardEvent(e))));
        }
        onkeyup(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e) => listener(new keyboardEvent_1.StandardKeyboardEvent(e))));
        }
        oninput(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.INPUT, listener));
        }
        onblur(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.BLUR, listener));
        }
        onfocus(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.FOCUS, listener));
        }
        onchange(domNode, listener) {
            this._register(dom.addDisposableListener(domNode, dom.EventType.CHANGE, listener));
        }
        ignoreGesture(domNode) {
            touch_1.Gesture.ignoreTarget(domNode);
        }
    }
    exports.Widget = Widget;
});
//# __sourceMappingURL=widget.js.map