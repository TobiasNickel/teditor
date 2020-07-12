/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/horizontalScrollbar", "vs/base/browser/ui/scrollbar/verticalScrollbar", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/scrollable", "vs/css!./media/scrollbars"], function (require, exports, dom, fastDomNode_1, mouseEvent_1, horizontalScrollbar_1, verticalScrollbar_1, widget_1, async_1, event_1, lifecycle_1, platform, scrollable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DomScrollableElement = exports.SmoothScrollableElement = exports.ScrollableElement = exports.AbstractScrollableElement = exports.MouseWheelClassifier = void 0;
    const HIDE_TIMEOUT = 500;
    const SCROLL_WHEEL_SENSITIVITY = 50;
    const SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED = true;
    class MouseWheelClassifierItem {
        constructor(timestamp, deltaX, deltaY) {
            this.timestamp = timestamp;
            this.deltaX = deltaX;
            this.deltaY = deltaY;
            this.score = 0;
        }
    }
    class MouseWheelClassifier {
        constructor() {
            this._capacity = 5;
            this._memory = [];
            this._front = -1;
            this._rear = -1;
        }
        isPhysicalMouseWheel() {
            if (this._front === -1 && this._rear === -1) {
                // no elements
                return false;
            }
            // 0.5 * last + 0.25 * 2nd last + 0.125 * 3rd last + ...
            let remainingInfluence = 1;
            let score = 0;
            let iteration = 1;
            let index = this._rear;
            do {
                const influence = (index === this._front ? remainingInfluence : Math.pow(2, -iteration));
                remainingInfluence -= influence;
                score += this._memory[index].score * influence;
                if (index === this._front) {
                    break;
                }
                index = (this._capacity + index - 1) % this._capacity;
                iteration++;
            } while (true);
            return (score <= 0.5);
        }
        accept(timestamp, deltaX, deltaY) {
            const item = new MouseWheelClassifierItem(timestamp, deltaX, deltaY);
            item.score = this._computeScore(item);
            if (this._front === -1 && this._rear === -1) {
                this._memory[0] = item;
                this._front = 0;
                this._rear = 0;
            }
            else {
                this._rear = (this._rear + 1) % this._capacity;
                if (this._rear === this._front) {
                    // Drop oldest
                    this._front = (this._front + 1) % this._capacity;
                }
                this._memory[this._rear] = item;
            }
        }
        /**
         * A score between 0 and 1 for `item`.
         *  - a score towards 0 indicates that the source appears to be a physical mouse wheel
         *  - a score towards 1 indicates that the source appears to be a touchpad or magic mouse, etc.
         */
        _computeScore(item) {
            if (Math.abs(item.deltaX) > 0 && Math.abs(item.deltaY) > 0) {
                // both axes exercised => definitely not a physical mouse wheel
                return 1;
            }
            let score = 0.5;
            const prev = (this._front === -1 && this._rear === -1 ? null : this._memory[this._rear]);
            if (prev) {
                // const deltaT = item.timestamp - prev.timestamp;
                // if (deltaT < 1000 / 30) {
                // 	// sooner than X times per second => indicator that this is not a physical mouse wheel
                // 	score += 0.25;
                // }
                // if (item.deltaX === prev.deltaX && item.deltaY === prev.deltaY) {
                // 	// equal amplitude => indicator that this is a physical mouse wheel
                // 	score -= 0.25;
                // }
            }
            if (Math.abs(item.deltaX - Math.round(item.deltaX)) > 0 || Math.abs(item.deltaY - Math.round(item.deltaY)) > 0) {
                // non-integer deltas => indicator that this is not a physical mouse wheel
                score += 0.25;
            }
            return Math.min(Math.max(score, 0), 1);
        }
    }
    exports.MouseWheelClassifier = MouseWheelClassifier;
    MouseWheelClassifier.INSTANCE = new MouseWheelClassifier();
    class AbstractScrollableElement extends widget_1.Widget {
        constructor(element, options, scrollable) {
            super();
            this._onScroll = this._register(new event_1.Emitter());
            this.onScroll = this._onScroll.event;
            this._onWillScroll = this._register(new event_1.Emitter());
            this.onWillScroll = this._onWillScroll.event;
            element.style.overflow = 'hidden';
            this._options = resolveOptions(options);
            this._scrollable = scrollable;
            this._register(this._scrollable.onScroll((e) => {
                this._onWillScroll.fire(e);
                this._onDidScroll(e);
                this._onScroll.fire(e);
            }));
            let scrollbarHost = {
                onMouseWheel: (mouseWheelEvent) => this._onMouseWheel(mouseWheelEvent),
                onDragStart: () => this._onDragStart(),
                onDragEnd: () => this._onDragEnd(),
            };
            this._verticalScrollbar = this._register(new verticalScrollbar_1.VerticalScrollbar(this._scrollable, this._options, scrollbarHost));
            this._horizontalScrollbar = this._register(new horizontalScrollbar_1.HorizontalScrollbar(this._scrollable, this._options, scrollbarHost));
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-scrollable-element ' + this._options.className;
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.style.position = 'relative';
            this._domNode.style.overflow = 'hidden';
            this._domNode.appendChild(element);
            this._domNode.appendChild(this._horizontalScrollbar.domNode.domNode);
            this._domNode.appendChild(this._verticalScrollbar.domNode.domNode);
            if (this._options.useShadows) {
                this._leftShadowDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
                this._leftShadowDomNode.setClassName('shadow');
                this._domNode.appendChild(this._leftShadowDomNode.domNode);
                this._topShadowDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
                this._topShadowDomNode.setClassName('shadow');
                this._domNode.appendChild(this._topShadowDomNode.domNode);
                this._topLeftShadowDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
                this._topLeftShadowDomNode.setClassName('shadow top-left-corner');
                this._domNode.appendChild(this._topLeftShadowDomNode.domNode);
            }
            else {
                this._leftShadowDomNode = null;
                this._topShadowDomNode = null;
                this._topLeftShadowDomNode = null;
            }
            this._listenOnDomNode = this._options.listenOnDomNode || this._domNode;
            this._mouseWheelToDispose = [];
            this._setListeningToMouseWheel(this._options.handleMouseWheel);
            this.onmouseover(this._listenOnDomNode, (e) => this._onMouseOver(e));
            this.onnonbubblingmouseout(this._listenOnDomNode, (e) => this._onMouseOut(e));
            this._hideTimeout = this._register(new async_1.TimeoutTimer());
            this._isDragging = false;
            this._mouseIsOver = false;
            this._shouldRender = true;
            this._revealOnScroll = true;
        }
        dispose() {
            this._mouseWheelToDispose = lifecycle_1.dispose(this._mouseWheelToDispose);
            super.dispose();
        }
        /**
         * Get the generated 'scrollable' dom node
         */
        getDomNode() {
            return this._domNode;
        }
        getOverviewRulerLayoutInfo() {
            return {
                parent: this._domNode,
                insertBefore: this._verticalScrollbar.domNode.domNode,
            };
        }
        /**
         * Delegate a mouse down event to the vertical scrollbar.
         * This is to help with clicking somewhere else and having the scrollbar react.
         */
        delegateVerticalScrollbarMouseDown(browserEvent) {
            this._verticalScrollbar.delegateMouseDown(browserEvent);
        }
        getScrollDimensions() {
            return this._scrollable.getScrollDimensions();
        }
        setScrollDimensions(dimensions) {
            this._scrollable.setScrollDimensions(dimensions, false);
        }
        /**
         * Update the class name of the scrollable element.
         */
        updateClassName(newClassName) {
            this._options.className = newClassName;
            // Defaults are different on Macs
            if (platform.isMacintosh) {
                this._options.className += ' mac';
            }
            this._domNode.className = 'monaco-scrollable-element ' + this._options.className;
        }
        /**
         * Update configuration options for the scrollbar.
         * Really this is Editor.IEditorScrollbarOptions, but base shouldn't
         * depend on Editor.
         */
        updateOptions(newOptions) {
            if (typeof newOptions.handleMouseWheel !== 'undefined') {
                this._options.handleMouseWheel = newOptions.handleMouseWheel;
                this._setListeningToMouseWheel(this._options.handleMouseWheel);
            }
            if (typeof newOptions.mouseWheelScrollSensitivity !== 'undefined') {
                this._options.mouseWheelScrollSensitivity = newOptions.mouseWheelScrollSensitivity;
            }
            if (typeof newOptions.fastScrollSensitivity !== 'undefined') {
                this._options.fastScrollSensitivity = newOptions.fastScrollSensitivity;
            }
            if (typeof newOptions.scrollPredominantAxis !== 'undefined') {
                this._options.scrollPredominantAxis = newOptions.scrollPredominantAxis;
            }
            if (typeof newOptions.horizontalScrollbarSize !== 'undefined') {
                this._horizontalScrollbar.updateScrollbarSize(newOptions.horizontalScrollbarSize);
            }
            if (!this._options.lazyRender) {
                this._render();
            }
        }
        setRevealOnScroll(value) {
            this._revealOnScroll = value;
        }
        triggerScrollFromMouseWheelEvent(browserEvent) {
            this._onMouseWheel(new mouseEvent_1.StandardWheelEvent(browserEvent));
        }
        // -------------------- mouse wheel scrolling --------------------
        _setListeningToMouseWheel(shouldListen) {
            let isListening = (this._mouseWheelToDispose.length > 0);
            if (isListening === shouldListen) {
                // No change
                return;
            }
            // Stop listening (if necessary)
            this._mouseWheelToDispose = lifecycle_1.dispose(this._mouseWheelToDispose);
            // Start listening (if necessary)
            if (shouldListen) {
                let onMouseWheel = (browserEvent) => {
                    this._onMouseWheel(new mouseEvent_1.StandardWheelEvent(browserEvent));
                };
                this._mouseWheelToDispose.push(dom.addDisposableListener(this._listenOnDomNode, dom.EventType.MOUSE_WHEEL, onMouseWheel, { passive: false }));
            }
        }
        _onMouseWheel(e) {
            const classifier = MouseWheelClassifier.INSTANCE;
            if (SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED) {
                if (platform.isWindows) {
                    // On Windows, the incoming delta events are multiplied with the device pixel ratio,
                    // so to get a better classification, simply undo that.
                    classifier.accept(Date.now(), e.deltaX / window.devicePixelRatio, e.deltaY / window.devicePixelRatio);
                }
                else {
                    classifier.accept(Date.now(), e.deltaX, e.deltaY);
                }
            }
            // console.log(`${Date.now()}, ${e.deltaY}, ${e.deltaX}`);
            if (e.deltaY || e.deltaX) {
                let deltaY = e.deltaY * this._options.mouseWheelScrollSensitivity;
                let deltaX = e.deltaX * this._options.mouseWheelScrollSensitivity;
                if (this._options.scrollPredominantAxis) {
                    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
                        deltaX = 0;
                    }
                    else {
                        deltaY = 0;
                    }
                }
                if (this._options.flipAxes) {
                    [deltaY, deltaX] = [deltaX, deltaY];
                }
                // Convert vertical scrolling to horizontal if shift is held, this
                // is handled at a higher level on Mac
                const shiftConvert = !platform.isMacintosh && e.browserEvent && e.browserEvent.shiftKey;
                if ((this._options.scrollYToX || shiftConvert) && !deltaX) {
                    deltaX = deltaY;
                    deltaY = 0;
                }
                if (e.browserEvent && e.browserEvent.altKey) {
                    // fastScrolling
                    deltaX = deltaX * this._options.fastScrollSensitivity;
                    deltaY = deltaY * this._options.fastScrollSensitivity;
                }
                const futureScrollPosition = this._scrollable.getFutureScrollPosition();
                let desiredScrollPosition = {};
                if (deltaY) {
                    const desiredScrollTop = futureScrollPosition.scrollTop - SCROLL_WHEEL_SENSITIVITY * deltaY;
                    this._verticalScrollbar.writeScrollPosition(desiredScrollPosition, desiredScrollTop);
                }
                if (deltaX) {
                    const desiredScrollLeft = futureScrollPosition.scrollLeft - SCROLL_WHEEL_SENSITIVITY * deltaX;
                    this._horizontalScrollbar.writeScrollPosition(desiredScrollPosition, desiredScrollLeft);
                }
                // Check that we are scrolling towards a location which is valid
                desiredScrollPosition = this._scrollable.validateScrollPosition(desiredScrollPosition);
                if (futureScrollPosition.scrollLeft !== desiredScrollPosition.scrollLeft || futureScrollPosition.scrollTop !== desiredScrollPosition.scrollTop) {
                    const canPerformSmoothScroll = (SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED
                        && this._options.mouseWheelSmoothScroll
                        && classifier.isPhysicalMouseWheel());
                    if (canPerformSmoothScroll) {
                        this._scrollable.setScrollPositionSmooth(desiredScrollPosition);
                    }
                    else {
                        this._scrollable.setScrollPositionNow(desiredScrollPosition);
                    }
                    this._shouldRender = true;
                }
            }
            if (this._options.alwaysConsumeMouseWheel || this._shouldRender) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        _onDidScroll(e) {
            this._shouldRender = this._horizontalScrollbar.onDidScroll(e) || this._shouldRender;
            this._shouldRender = this._verticalScrollbar.onDidScroll(e) || this._shouldRender;
            if (this._options.useShadows) {
                this._shouldRender = true;
            }
            if (this._revealOnScroll) {
                this._reveal();
            }
            if (!this._options.lazyRender) {
                this._render();
            }
        }
        /**
         * Render / mutate the DOM now.
         * Should be used together with the ctor option `lazyRender`.
         */
        renderNow() {
            if (!this._options.lazyRender) {
                throw new Error('Please use `lazyRender` together with `renderNow`!');
            }
            this._render();
        }
        _render() {
            if (!this._shouldRender) {
                return;
            }
            this._shouldRender = false;
            this._horizontalScrollbar.render();
            this._verticalScrollbar.render();
            if (this._options.useShadows) {
                const scrollState = this._scrollable.getCurrentScrollPosition();
                let enableTop = scrollState.scrollTop > 0;
                let enableLeft = scrollState.scrollLeft > 0;
                this._leftShadowDomNode.setClassName('shadow' + (enableLeft ? ' left' : ''));
                this._topShadowDomNode.setClassName('shadow' + (enableTop ? ' top' : ''));
                this._topLeftShadowDomNode.setClassName('shadow top-left-corner' + (enableTop ? ' top' : '') + (enableLeft ? ' left' : ''));
            }
        }
        // -------------------- fade in / fade out --------------------
        _onDragStart() {
            this._isDragging = true;
            this._reveal();
        }
        _onDragEnd() {
            this._isDragging = false;
            this._hide();
        }
        _onMouseOut(e) {
            this._mouseIsOver = false;
            this._hide();
        }
        _onMouseOver(e) {
            this._mouseIsOver = true;
            this._reveal();
        }
        _reveal() {
            this._verticalScrollbar.beginReveal();
            this._horizontalScrollbar.beginReveal();
            this._scheduleHide();
        }
        _hide() {
            if (!this._mouseIsOver && !this._isDragging) {
                this._verticalScrollbar.beginHide();
                this._horizontalScrollbar.beginHide();
            }
        }
        _scheduleHide() {
            if (!this._mouseIsOver && !this._isDragging) {
                this._hideTimeout.cancelAndSet(() => this._hide(), HIDE_TIMEOUT);
            }
        }
    }
    exports.AbstractScrollableElement = AbstractScrollableElement;
    class ScrollableElement extends AbstractScrollableElement {
        constructor(element, options) {
            options = options || {};
            options.mouseWheelSmoothScroll = false;
            const scrollable = new scrollable_1.Scrollable(0, (callback) => dom.scheduleAtNextAnimationFrame(callback));
            super(element, options, scrollable);
            this._register(scrollable);
        }
        setScrollPosition(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        getScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
    }
    exports.ScrollableElement = ScrollableElement;
    class SmoothScrollableElement extends AbstractScrollableElement {
        constructor(element, options, scrollable) {
            super(element, options, scrollable);
        }
        setScrollPosition(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        getScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
    }
    exports.SmoothScrollableElement = SmoothScrollableElement;
    class DomScrollableElement extends ScrollableElement {
        constructor(element, options) {
            super(element, options);
            this._element = element;
            this.onScroll((e) => {
                if (e.scrollTopChanged) {
                    this._element.scrollTop = e.scrollTop;
                }
                if (e.scrollLeftChanged) {
                    this._element.scrollLeft = e.scrollLeft;
                }
            });
            this.scanDomNode();
        }
        scanDomNode() {
            // width, scrollLeft, scrollWidth, height, scrollTop, scrollHeight
            this.setScrollDimensions({
                width: this._element.clientWidth,
                scrollWidth: this._element.scrollWidth,
                height: this._element.clientHeight,
                scrollHeight: this._element.scrollHeight
            });
            this.setScrollPosition({
                scrollLeft: this._element.scrollLeft,
                scrollTop: this._element.scrollTop,
            });
        }
    }
    exports.DomScrollableElement = DomScrollableElement;
    function resolveOptions(opts) {
        let result = {
            lazyRender: (typeof opts.lazyRender !== 'undefined' ? opts.lazyRender : false),
            className: (typeof opts.className !== 'undefined' ? opts.className : ''),
            useShadows: (typeof opts.useShadows !== 'undefined' ? opts.useShadows : true),
            handleMouseWheel: (typeof opts.handleMouseWheel !== 'undefined' ? opts.handleMouseWheel : true),
            flipAxes: (typeof opts.flipAxes !== 'undefined' ? opts.flipAxes : false),
            alwaysConsumeMouseWheel: (typeof opts.alwaysConsumeMouseWheel !== 'undefined' ? opts.alwaysConsumeMouseWheel : false),
            scrollYToX: (typeof opts.scrollYToX !== 'undefined' ? opts.scrollYToX : false),
            mouseWheelScrollSensitivity: (typeof opts.mouseWheelScrollSensitivity !== 'undefined' ? opts.mouseWheelScrollSensitivity : 1),
            fastScrollSensitivity: (typeof opts.fastScrollSensitivity !== 'undefined' ? opts.fastScrollSensitivity : 5),
            scrollPredominantAxis: (typeof opts.scrollPredominantAxis !== 'undefined' ? opts.scrollPredominantAxis : true),
            mouseWheelSmoothScroll: (typeof opts.mouseWheelSmoothScroll !== 'undefined' ? opts.mouseWheelSmoothScroll : true),
            arrowSize: (typeof opts.arrowSize !== 'undefined' ? opts.arrowSize : 11),
            listenOnDomNode: (typeof opts.listenOnDomNode !== 'undefined' ? opts.listenOnDomNode : null),
            horizontal: (typeof opts.horizontal !== 'undefined' ? opts.horizontal : 1 /* Auto */),
            horizontalScrollbarSize: (typeof opts.horizontalScrollbarSize !== 'undefined' ? opts.horizontalScrollbarSize : 10),
            horizontalSliderSize: (typeof opts.horizontalSliderSize !== 'undefined' ? opts.horizontalSliderSize : 0),
            horizontalHasArrows: (typeof opts.horizontalHasArrows !== 'undefined' ? opts.horizontalHasArrows : false),
            vertical: (typeof opts.vertical !== 'undefined' ? opts.vertical : 1 /* Auto */),
            verticalScrollbarSize: (typeof opts.verticalScrollbarSize !== 'undefined' ? opts.verticalScrollbarSize : 10),
            verticalHasArrows: (typeof opts.verticalHasArrows !== 'undefined' ? opts.verticalHasArrows : false),
            verticalSliderSize: (typeof opts.verticalSliderSize !== 'undefined' ? opts.verticalSliderSize : 0)
        };
        result.horizontalSliderSize = (typeof opts.horizontalSliderSize !== 'undefined' ? opts.horizontalSliderSize : result.horizontalScrollbarSize);
        result.verticalSliderSize = (typeof opts.verticalSliderSize !== 'undefined' ? opts.verticalSliderSize : result.verticalScrollbarSize);
        // Defaults are different on Macs
        if (platform.isMacintosh) {
            result.className += ' mac';
        }
        return result;
    }
});
//# __sourceMappingURL=scrollableElement.js.map