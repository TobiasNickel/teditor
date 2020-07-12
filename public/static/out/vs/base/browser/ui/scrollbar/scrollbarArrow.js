/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/globalMouseMoveMonitor", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/base/browser/dom"], function (require, exports, globalMouseMoveMonitor_1, widget_1, async_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollbarArrow = exports.ARROW_IMG_SIZE = void 0;
    /**
     * The arrow image size.
     */
    exports.ARROW_IMG_SIZE = 11;
    class ScrollbarArrow extends widget_1.Widget {
        constructor(opts) {
            super();
            this._onActivate = opts.onActivate;
            this.bgDomNode = document.createElement('div');
            this.bgDomNode.className = 'arrow-background';
            this.bgDomNode.style.position = 'absolute';
            this.bgDomNode.style.width = opts.bgWidth + 'px';
            this.bgDomNode.style.height = opts.bgHeight + 'px';
            if (typeof opts.top !== 'undefined') {
                this.bgDomNode.style.top = '0px';
            }
            if (typeof opts.left !== 'undefined') {
                this.bgDomNode.style.left = '0px';
            }
            if (typeof opts.bottom !== 'undefined') {
                this.bgDomNode.style.bottom = '0px';
            }
            if (typeof opts.right !== 'undefined') {
                this.bgDomNode.style.right = '0px';
            }
            this.domNode = document.createElement('div');
            this.domNode.className = opts.className;
            dom_1.addClasses(this.domNode, opts.icon.classNames);
            this.domNode.style.position = 'absolute';
            this.domNode.style.width = exports.ARROW_IMG_SIZE + 'px';
            this.domNode.style.height = exports.ARROW_IMG_SIZE + 'px';
            if (typeof opts.top !== 'undefined') {
                this.domNode.style.top = opts.top + 'px';
            }
            if (typeof opts.left !== 'undefined') {
                this.domNode.style.left = opts.left + 'px';
            }
            if (typeof opts.bottom !== 'undefined') {
                this.domNode.style.bottom = opts.bottom + 'px';
            }
            if (typeof opts.right !== 'undefined') {
                this.domNode.style.right = opts.right + 'px';
            }
            this._mouseMoveMonitor = this._register(new globalMouseMoveMonitor_1.GlobalMouseMoveMonitor());
            this.onmousedown(this.bgDomNode, (e) => this._arrowMouseDown(e));
            this.onmousedown(this.domNode, (e) => this._arrowMouseDown(e));
            this._mousedownRepeatTimer = this._register(new async_1.IntervalTimer());
            this._mousedownScheduleRepeatTimer = this._register(new async_1.TimeoutTimer());
        }
        _arrowMouseDown(e) {
            let scheduleRepeater = () => {
                this._mousedownRepeatTimer.cancelAndSet(() => this._onActivate(), 1000 / 24);
            };
            this._onActivate();
            this._mousedownRepeatTimer.cancel();
            this._mousedownScheduleRepeatTimer.cancelAndSet(scheduleRepeater, 200);
            this._mouseMoveMonitor.startMonitoring(e.target, e.buttons, globalMouseMoveMonitor_1.standardMouseMoveMerger, (mouseMoveData) => {
                /* Intentional empty */
            }, () => {
                this._mousedownRepeatTimer.cancel();
                this._mousedownScheduleRepeatTimer.cancel();
            });
            e.preventDefault();
        }
    }
    exports.ScrollbarArrow = ScrollbarArrow;
});
//# __sourceMappingURL=scrollbarArrow.js.map