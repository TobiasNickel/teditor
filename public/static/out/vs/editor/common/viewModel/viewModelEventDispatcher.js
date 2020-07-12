/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReadOnlyEditAttemptEvent = exports.CursorStateChangedEvent = exports.ViewZonesChangedEvent = exports.ScrollChangedEvent = exports.FocusChangedEvent = exports.ContentSizeChangedEvent = exports.OutgoingViewModelEventKind = exports.ViewModelEventsCollector = exports.ViewModelEventDispatcher = void 0;
    class ViewModelEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onEvent = this._register(new event_1.Emitter());
            this.onEvent = this._onEvent.event;
            this._eventHandlers = [];
            this._viewEventQueue = null;
            this._isConsumingViewEventQueue = false;
            this._collector = null;
            this._collectorCnt = 0;
            this._outgoingEvents = [];
        }
        emitOutgoingEvent(e) {
            this._addOutgoingEvent(e);
            this._emitOugoingEvents();
        }
        _addOutgoingEvent(e) {
            for (let i = 0, len = this._outgoingEvents.length; i < len; i++) {
                if (this._outgoingEvents[i].kind === e.kind) {
                    this._outgoingEvents[i] = this._outgoingEvents[i].merge(e);
                    return;
                }
            }
            // not merged
            this._outgoingEvents.push(e);
        }
        _emitOugoingEvents() {
            while (this._outgoingEvents.length > 0) {
                if (this._collector || this._isConsumingViewEventQueue) {
                    // right now collecting or emitting view events, so let's postpone emitting
                    return;
                }
                const event = this._outgoingEvents.shift();
                if (event.isNoOp()) {
                    continue;
                }
                this._onEvent.fire(event);
            }
        }
        addViewEventHandler(eventHandler) {
            for (let i = 0, len = this._eventHandlers.length; i < len; i++) {
                if (this._eventHandlers[i] === eventHandler) {
                    console.warn('Detected duplicate listener in ViewEventDispatcher', eventHandler);
                }
            }
            this._eventHandlers.push(eventHandler);
        }
        removeViewEventHandler(eventHandler) {
            for (let i = 0; i < this._eventHandlers.length; i++) {
                if (this._eventHandlers[i] === eventHandler) {
                    this._eventHandlers.splice(i, 1);
                    break;
                }
            }
        }
        beginEmitViewEvents() {
            this._collectorCnt++;
            if (this._collectorCnt === 1) {
                this._collector = new ViewModelEventsCollector();
            }
            return this._collector;
        }
        endEmitViewEvents() {
            this._collectorCnt--;
            if (this._collectorCnt === 0) {
                const outgoingEvents = this._collector.outgoingEvents;
                const viewEvents = this._collector.viewEvents;
                this._collector = null;
                for (const outgoingEvent of outgoingEvents) {
                    this._addOutgoingEvent(outgoingEvent);
                }
                if (viewEvents.length > 0) {
                    this._emitMany(viewEvents);
                }
            }
            this._emitOugoingEvents();
        }
        emitSingleViewEvent(event) {
            try {
                const eventsCollector = this.beginEmitViewEvents();
                eventsCollector.emitViewEvent(event);
            }
            finally {
                this.endEmitViewEvents();
            }
        }
        _emitMany(events) {
            if (this._viewEventQueue) {
                this._viewEventQueue = this._viewEventQueue.concat(events);
            }
            else {
                this._viewEventQueue = events;
            }
            if (!this._isConsumingViewEventQueue) {
                this._consumeViewEventQueue();
            }
        }
        _consumeViewEventQueue() {
            try {
                this._isConsumingViewEventQueue = true;
                this._doConsumeQueue();
            }
            finally {
                this._isConsumingViewEventQueue = false;
            }
        }
        _doConsumeQueue() {
            while (this._viewEventQueue) {
                // Empty event queue, as events might come in while sending these off
                const events = this._viewEventQueue;
                this._viewEventQueue = null;
                // Use a clone of the event handlers list, as they might remove themselves
                const eventHandlers = this._eventHandlers.slice(0);
                for (const eventHandler of eventHandlers) {
                    eventHandler.handleEvents(events);
                }
            }
        }
    }
    exports.ViewModelEventDispatcher = ViewModelEventDispatcher;
    class ViewModelEventsCollector {
        constructor() {
            this.viewEvents = [];
            this.outgoingEvents = [];
        }
        emitViewEvent(event) {
            this.viewEvents.push(event);
        }
        emitOutgoingEvent(e) {
            this.outgoingEvents.push(e);
        }
    }
    exports.ViewModelEventsCollector = ViewModelEventsCollector;
    var OutgoingViewModelEventKind;
    (function (OutgoingViewModelEventKind) {
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ContentSizeChanged"] = 0] = "ContentSizeChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["FocusChanged"] = 1] = "FocusChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ScrollChanged"] = 2] = "ScrollChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ViewZonesChanged"] = 3] = "ViewZonesChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ReadOnlyEditAttempt"] = 4] = "ReadOnlyEditAttempt";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["CursorStateChanged"] = 5] = "CursorStateChanged";
    })(OutgoingViewModelEventKind = exports.OutgoingViewModelEventKind || (exports.OutgoingViewModelEventKind = {}));
    class ContentSizeChangedEvent {
        constructor(oldContentWidth, oldContentHeight, contentWidth, contentHeight) {
            this.kind = 0 /* ContentSizeChanged */;
            this._oldContentWidth = oldContentWidth;
            this._oldContentHeight = oldContentHeight;
            this.contentWidth = contentWidth;
            this.contentHeight = contentHeight;
            this.contentWidthChanged = (this._oldContentWidth !== this.contentWidth);
            this.contentHeightChanged = (this._oldContentHeight !== this.contentHeight);
        }
        isNoOp() {
            return (!this.contentWidthChanged && !this.contentHeightChanged);
        }
        merge(other) {
            if (other.kind !== 0 /* ContentSizeChanged */) {
                return this;
            }
            return new ContentSizeChangedEvent(this._oldContentWidth, this._oldContentHeight, other.contentWidth, other.contentHeight);
        }
    }
    exports.ContentSizeChangedEvent = ContentSizeChangedEvent;
    class FocusChangedEvent {
        constructor(oldHasFocus, hasFocus) {
            this.kind = 1 /* FocusChanged */;
            this.oldHasFocus = oldHasFocus;
            this.hasFocus = hasFocus;
        }
        isNoOp() {
            return (this.oldHasFocus === this.hasFocus);
        }
        merge(other) {
            if (other.kind !== 1 /* FocusChanged */) {
                return this;
            }
            return new FocusChangedEvent(this.oldHasFocus, other.hasFocus);
        }
    }
    exports.FocusChangedEvent = FocusChangedEvent;
    class ScrollChangedEvent {
        constructor(oldScrollWidth, oldScrollLeft, oldScrollHeight, oldScrollTop, scrollWidth, scrollLeft, scrollHeight, scrollTop) {
            this.kind = 2 /* ScrollChanged */;
            this._oldScrollWidth = oldScrollWidth;
            this._oldScrollLeft = oldScrollLeft;
            this._oldScrollHeight = oldScrollHeight;
            this._oldScrollTop = oldScrollTop;
            this.scrollWidth = scrollWidth;
            this.scrollLeft = scrollLeft;
            this.scrollHeight = scrollHeight;
            this.scrollTop = scrollTop;
            this.scrollWidthChanged = (this._oldScrollWidth !== this.scrollWidth);
            this.scrollLeftChanged = (this._oldScrollLeft !== this.scrollLeft);
            this.scrollHeightChanged = (this._oldScrollHeight !== this.scrollHeight);
            this.scrollTopChanged = (this._oldScrollTop !== this.scrollTop);
        }
        isNoOp() {
            return (!this.scrollWidthChanged && !this.scrollLeftChanged && !this.scrollHeightChanged && !this.scrollTopChanged);
        }
        merge(other) {
            if (other.kind !== 2 /* ScrollChanged */) {
                return this;
            }
            return new ScrollChangedEvent(this._oldScrollWidth, this._oldScrollLeft, this._oldScrollHeight, this._oldScrollTop, other.scrollWidth, other.scrollLeft, other.scrollHeight, other.scrollTop);
        }
    }
    exports.ScrollChangedEvent = ScrollChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.kind = 3 /* ViewZonesChanged */;
        }
        isNoOp() {
            return false;
        }
        merge(other) {
            return this;
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
    class CursorStateChangedEvent {
        constructor(oldSelections, selections, oldModelVersionId, modelVersionId, source, reason, reachedMaxCursorCount) {
            this.kind = 5 /* CursorStateChanged */;
            this.oldSelections = oldSelections;
            this.selections = selections;
            this.oldModelVersionId = oldModelVersionId;
            this.modelVersionId = modelVersionId;
            this.source = source;
            this.reason = reason;
            this.reachedMaxCursorCount = reachedMaxCursorCount;
        }
        static _selectionsAreEqual(a, b) {
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!a[i].equalsSelection(b[i])) {
                    return false;
                }
            }
            return true;
        }
        isNoOp() {
            return (CursorStateChangedEvent._selectionsAreEqual(this.oldSelections, this.selections)
                && this.oldModelVersionId === this.modelVersionId);
        }
        merge(other) {
            if (other.kind !== 5 /* CursorStateChanged */) {
                return this;
            }
            return new CursorStateChangedEvent(this.oldSelections, other.selections, this.oldModelVersionId, other.modelVersionId, other.source, other.reason, this.reachedMaxCursorCount || other.reachedMaxCursorCount);
        }
    }
    exports.CursorStateChangedEvent = CursorStateChangedEvent;
    class ReadOnlyEditAttemptEvent {
        constructor() {
            this.kind = 4 /* ReadOnlyEditAttempt */;
        }
        isNoOp() {
            return false;
        }
        merge(other) {
            return this;
        }
    }
    exports.ReadOnlyEditAttemptEvent = ReadOnlyEditAttemptEvent;
});
//# __sourceMappingURL=viewModelEventDispatcher.js.map