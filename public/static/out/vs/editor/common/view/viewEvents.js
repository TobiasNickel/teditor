/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewZonesChangedEvent = exports.ViewTokensColorsChangedEvent = exports.ViewTokensChangedEvent = exports.ViewThemeChangedEvent = exports.ViewScrollChangedEvent = exports.ViewRevealRangeRequestEvent = exports.VerticalRevealType = exports.ViewLinesInsertedEvent = exports.ViewLinesDeletedEvent = exports.ViewLinesChangedEvent = exports.ViewLineMappingChangedEvent = exports.ViewLanguageConfigurationEvent = exports.ViewFocusChangedEvent = exports.ViewFlushedEvent = exports.ViewDecorationsChangedEvent = exports.ViewCursorStateChangedEvent = exports.ViewConfigurationChangedEvent = exports.ViewEventType = void 0;
    var ViewEventType;
    (function (ViewEventType) {
        ViewEventType[ViewEventType["ViewConfigurationChanged"] = 0] = "ViewConfigurationChanged";
        ViewEventType[ViewEventType["ViewCursorStateChanged"] = 1] = "ViewCursorStateChanged";
        ViewEventType[ViewEventType["ViewDecorationsChanged"] = 2] = "ViewDecorationsChanged";
        ViewEventType[ViewEventType["ViewFlushed"] = 3] = "ViewFlushed";
        ViewEventType[ViewEventType["ViewFocusChanged"] = 4] = "ViewFocusChanged";
        ViewEventType[ViewEventType["ViewLanguageConfigurationChanged"] = 5] = "ViewLanguageConfigurationChanged";
        ViewEventType[ViewEventType["ViewLineMappingChanged"] = 6] = "ViewLineMappingChanged";
        ViewEventType[ViewEventType["ViewLinesChanged"] = 7] = "ViewLinesChanged";
        ViewEventType[ViewEventType["ViewLinesDeleted"] = 8] = "ViewLinesDeleted";
        ViewEventType[ViewEventType["ViewLinesInserted"] = 9] = "ViewLinesInserted";
        ViewEventType[ViewEventType["ViewRevealRangeRequest"] = 10] = "ViewRevealRangeRequest";
        ViewEventType[ViewEventType["ViewScrollChanged"] = 11] = "ViewScrollChanged";
        ViewEventType[ViewEventType["ViewThemeChanged"] = 12] = "ViewThemeChanged";
        ViewEventType[ViewEventType["ViewTokensChanged"] = 13] = "ViewTokensChanged";
        ViewEventType[ViewEventType["ViewTokensColorsChanged"] = 14] = "ViewTokensColorsChanged";
        ViewEventType[ViewEventType["ViewZonesChanged"] = 15] = "ViewZonesChanged";
    })(ViewEventType = exports.ViewEventType || (exports.ViewEventType = {}));
    class ViewConfigurationChangedEvent {
        constructor(source) {
            this.type = 0 /* ViewConfigurationChanged */;
            this._source = source;
        }
        hasChanged(id) {
            return this._source.hasChanged(id);
        }
    }
    exports.ViewConfigurationChangedEvent = ViewConfigurationChangedEvent;
    class ViewCursorStateChangedEvent {
        constructor(selections, modelSelections) {
            this.type = 1 /* ViewCursorStateChanged */;
            this.selections = selections;
            this.modelSelections = modelSelections;
        }
    }
    exports.ViewCursorStateChangedEvent = ViewCursorStateChangedEvent;
    class ViewDecorationsChangedEvent {
        constructor(source) {
            this.type = 2 /* ViewDecorationsChanged */;
            if (source) {
                this.affectsMinimap = source.affectsMinimap;
                this.affectsOverviewRuler = source.affectsOverviewRuler;
            }
            else {
                this.affectsMinimap = true;
                this.affectsOverviewRuler = true;
            }
        }
    }
    exports.ViewDecorationsChangedEvent = ViewDecorationsChangedEvent;
    class ViewFlushedEvent {
        constructor() {
            this.type = 3 /* ViewFlushed */;
            // Nothing to do
        }
    }
    exports.ViewFlushedEvent = ViewFlushedEvent;
    class ViewFocusChangedEvent {
        constructor(isFocused) {
            this.type = 4 /* ViewFocusChanged */;
            this.isFocused = isFocused;
        }
    }
    exports.ViewFocusChangedEvent = ViewFocusChangedEvent;
    class ViewLanguageConfigurationEvent {
        constructor() {
            this.type = 5 /* ViewLanguageConfigurationChanged */;
        }
    }
    exports.ViewLanguageConfigurationEvent = ViewLanguageConfigurationEvent;
    class ViewLineMappingChangedEvent {
        constructor() {
            this.type = 6 /* ViewLineMappingChanged */;
            // Nothing to do
        }
    }
    exports.ViewLineMappingChangedEvent = ViewLineMappingChangedEvent;
    class ViewLinesChangedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 7 /* ViewLinesChanged */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesChangedEvent = ViewLinesChangedEvent;
    class ViewLinesDeletedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 8 /* ViewLinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesDeletedEvent = ViewLinesDeletedEvent;
    class ViewLinesInsertedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 9 /* ViewLinesInserted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesInsertedEvent = ViewLinesInsertedEvent;
    var VerticalRevealType;
    (function (VerticalRevealType) {
        VerticalRevealType[VerticalRevealType["Simple"] = 0] = "Simple";
        VerticalRevealType[VerticalRevealType["Center"] = 1] = "Center";
        VerticalRevealType[VerticalRevealType["CenterIfOutsideViewport"] = 2] = "CenterIfOutsideViewport";
        VerticalRevealType[VerticalRevealType["Top"] = 3] = "Top";
        VerticalRevealType[VerticalRevealType["Bottom"] = 4] = "Bottom";
        VerticalRevealType[VerticalRevealType["NearTop"] = 5] = "NearTop";
        VerticalRevealType[VerticalRevealType["NearTopIfOutsideViewport"] = 6] = "NearTopIfOutsideViewport";
    })(VerticalRevealType = exports.VerticalRevealType || (exports.VerticalRevealType = {}));
    class ViewRevealRangeRequestEvent {
        constructor(source, range, selections, verticalType, revealHorizontal, scrollType) {
            this.type = 10 /* ViewRevealRangeRequest */;
            this.source = source;
            this.range = range;
            this.selections = selections;
            this.verticalType = verticalType;
            this.revealHorizontal = revealHorizontal;
            this.scrollType = scrollType;
        }
    }
    exports.ViewRevealRangeRequestEvent = ViewRevealRangeRequestEvent;
    class ViewScrollChangedEvent {
        constructor(source) {
            this.type = 11 /* ViewScrollChanged */;
            this.scrollWidth = source.scrollWidth;
            this.scrollLeft = source.scrollLeft;
            this.scrollHeight = source.scrollHeight;
            this.scrollTop = source.scrollTop;
            this.scrollWidthChanged = source.scrollWidthChanged;
            this.scrollLeftChanged = source.scrollLeftChanged;
            this.scrollHeightChanged = source.scrollHeightChanged;
            this.scrollTopChanged = source.scrollTopChanged;
        }
    }
    exports.ViewScrollChangedEvent = ViewScrollChangedEvent;
    class ViewThemeChangedEvent {
        constructor() {
            this.type = 12 /* ViewThemeChanged */;
        }
    }
    exports.ViewThemeChangedEvent = ViewThemeChangedEvent;
    class ViewTokensChangedEvent {
        constructor(ranges) {
            this.type = 13 /* ViewTokensChanged */;
            this.ranges = ranges;
        }
    }
    exports.ViewTokensChangedEvent = ViewTokensChangedEvent;
    class ViewTokensColorsChangedEvent {
        constructor() {
            this.type = 14 /* ViewTokensColorsChanged */;
            // Nothing to do
        }
    }
    exports.ViewTokensColorsChangedEvent = ViewTokensColorsChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.type = 15 /* ViewZonesChanged */;
            // Nothing to do
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
});
//# __sourceMappingURL=viewEvents.js.map