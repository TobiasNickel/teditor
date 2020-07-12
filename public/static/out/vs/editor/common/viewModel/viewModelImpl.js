/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/view/viewEvents", "vs/editor/common/viewLayout/viewLayout", "vs/editor/common/viewModel/splitLinesCollection", "vs/editor/common/viewModel/viewModel", "vs/editor/common/viewModel/viewModelDecorations", "vs/base/common/async", "vs/base/common/platform", "vs/editor/common/controller/cursor", "vs/editor/common/controller/cursorCommon", "vs/editor/common/viewModel/viewModelEventDispatcher"], function (require, exports, color_1, lifecycle_1, strings, editorOptions_1, position_1, range_1, modes_1, textToHtmlTokenizer_1, minimapTokensColorTracker_1, viewEvents, viewLayout_1, splitLinesCollection_1, viewModel_1, viewModelDecorations_1, async_1, platform, cursor_1, cursorCommon_1, viewModelEventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModel = void 0;
    const USE_IDENTITY_LINES_COLLECTION = true;
    class ViewModel extends lifecycle_1.Disposable {
        constructor(editorId, configuration, model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, scheduleAtNextAnimationFrame) {
            super();
            this._editorId = editorId;
            this._configuration = configuration;
            this.model = model;
            this._eventDispatcher = new viewModelEventDispatcher_1.ViewModelEventDispatcher();
            this.onEvent = this._eventDispatcher.onEvent;
            this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageIdentifier(), this.model.getOptions(), this._configuration);
            this._tokenizeViewportSoon = this._register(new async_1.RunOnceScheduler(() => this.tokenizeViewport(), 50));
            this._updateConfigurationViewLineCount = this._register(new async_1.RunOnceScheduler(() => this._updateConfigurationViewLineCountNow(), 0));
            this._hasFocus = false;
            this._viewportStartLine = -1;
            this._viewportStartLineTrackedRange = null;
            this._viewportStartLineDelta = 0;
            if (USE_IDENTITY_LINES_COLLECTION && this.model.isTooLargeForTokenization()) {
                this._lines = new splitLinesCollection_1.IdentityLinesCollection(this.model);
            }
            else {
                const options = this._configuration.options;
                const fontInfo = options.get(36 /* fontInfo */);
                const wrappingStrategy = options.get(111 /* wrappingStrategy */);
                const wrappingInfo = options.get(116 /* wrappingInfo */);
                const wrappingIndent = options.get(110 /* wrappingIndent */);
                this._lines = new splitLinesCollection_1.SplitLinesCollection(this.model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, fontInfo, this.model.getOptions().tabSize, wrappingStrategy, wrappingInfo.wrappingColumn, wrappingIndent);
            }
            this.coordinatesConverter = this._lines.createCoordinatesConverter();
            this._cursor = this._register(new cursor_1.Cursor(model, this, this.coordinatesConverter, this.cursorConfig));
            this.viewLayout = this._register(new viewLayout_1.ViewLayout(this._configuration, this.getLineCount(), scheduleAtNextAnimationFrame));
            this._register(this.viewLayout.onDidScroll((e) => {
                if (e.scrollTopChanged) {
                    this._tokenizeViewportSoon.schedule();
                }
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewScrollChangedEvent(e));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ScrollChangedEvent(e.oldScrollWidth, e.oldScrollLeft, e.oldScrollHeight, e.oldScrollTop, e.scrollWidth, e.scrollLeft, e.scrollHeight, e.scrollTop));
            }));
            this._register(this.viewLayout.onDidContentSizeChange((e) => {
                this._eventDispatcher.emitOutgoingEvent(e);
            }));
            this._decorations = new viewModelDecorations_1.ViewModelDecorations(this._editorId, this.model, this._configuration, this._lines, this.coordinatesConverter);
            this._registerModelEvents();
            this._register(this._configuration.onDidChangeFast((e) => {
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    this._onConfigurationChanged(eventsCollector, e);
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
            }));
            this._register(minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance().onDidChange(() => {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewTokensColorsChangedEvent());
            }));
            this._updateConfigurationViewLineCountNow();
        }
        dispose() {
            // First remove listeners, as disposing the lines might end up sending
            // model decoration changed events ... and we no longer care about them ...
            super.dispose();
            this._decorations.dispose();
            this._lines.dispose();
            this.invalidateMinimapColorCache();
            this._viewportStartLineTrackedRange = this.model._setTrackedRange(this._viewportStartLineTrackedRange, null, 1 /* NeverGrowsWhenTypingAtEdges */);
            this._eventDispatcher.dispose();
        }
        addViewEventHandler(eventHandler) {
            this._eventDispatcher.addViewEventHandler(eventHandler);
        }
        removeViewEventHandler(eventHandler) {
            this._eventDispatcher.removeViewEventHandler(eventHandler);
        }
        _updateConfigurationViewLineCountNow() {
            this._configuration.setViewLineCount(this._lines.getViewLineCount());
        }
        tokenizeViewport() {
            const linesViewportData = this.viewLayout.getLinesViewportData();
            const startPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(linesViewportData.startLineNumber, 1));
            const endPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(linesViewportData.endLineNumber, 1));
            this.model.tokenizeViewport(startPosition.lineNumber, endPosition.lineNumber);
        }
        setHasFocus(hasFocus) {
            this._hasFocus = hasFocus;
            this._cursor.setHasFocus(hasFocus);
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewFocusChangedEvent(hasFocus));
            this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.FocusChangedEvent(!hasFocus, hasFocus));
        }
        onDidColorThemeChange() {
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewThemeChangedEvent());
        }
        _onConfigurationChanged(eventsCollector, e) {
            // We might need to restore the current centered view range, so save it (if available)
            let previousViewportStartModelPosition = null;
            if (this._viewportStartLine !== -1) {
                let previousViewportStartViewPosition = new position_1.Position(this._viewportStartLine, this.getLineMinColumn(this._viewportStartLine));
                previousViewportStartModelPosition = this.coordinatesConverter.convertViewPositionToModelPosition(previousViewportStartViewPosition);
            }
            let restorePreviousViewportStart = false;
            const options = this._configuration.options;
            const fontInfo = options.get(36 /* fontInfo */);
            const wrappingStrategy = options.get(111 /* wrappingStrategy */);
            const wrappingInfo = options.get(116 /* wrappingInfo */);
            const wrappingIndent = options.get(110 /* wrappingIndent */);
            if (this._lines.setWrappingSettings(fontInfo, wrappingStrategy, wrappingInfo.wrappingColumn, wrappingIndent)) {
                eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                this._cursor.onLineMappingChanged(eventsCollector);
                this._decorations.onLineMappingChanged();
                this.viewLayout.onFlushed(this.getLineCount());
                if (this.viewLayout.getCurrentScrollTop() !== 0) {
                    // Never change the scroll position from 0 to something else...
                    restorePreviousViewportStart = true;
                }
                this._updateConfigurationViewLineCount.schedule();
            }
            if (e.hasChanged(72 /* readOnly */)) {
                // Must read again all decorations due to readOnly filtering
                this._decorations.reset();
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
            }
            eventsCollector.emitViewEvent(new viewEvents.ViewConfigurationChangedEvent(e));
            this.viewLayout.onConfigurationChanged(e);
            if (restorePreviousViewportStart && previousViewportStartModelPosition) {
                const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(previousViewportStartModelPosition);
                const viewPositionTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                this.viewLayout.setScrollPosition({ scrollTop: viewPositionTop + this._viewportStartLineDelta }, 1 /* Immediate */);
            }
            if (cursorCommon_1.CursorConfiguration.shouldRecreate(e)) {
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageIdentifier(), this.model.getOptions(), this._configuration);
                this._cursor.updateConfiguration(this.cursorConfig);
            }
        }
        _registerModelEvents() {
            this._register(this.model.onDidChangeRawContentFast((e) => {
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    let hadOtherModelChange = false;
                    let hadModelLineChangeThatChangedLineMapping = false;
                    const changes = e.changes;
                    const versionId = e.versionId;
                    // Do a first pass to compute line mappings, and a second pass to actually interpret them
                    const lineBreaksComputer = this._lines.createLineBreaksComputer();
                    for (const change of changes) {
                        switch (change.changeType) {
                            case 4 /* LinesInserted */: {
                                for (const line of change.detail) {
                                    lineBreaksComputer.addRequest(line, null);
                                }
                                break;
                            }
                            case 2 /* LineChanged */: {
                                lineBreaksComputer.addRequest(change.detail, null);
                                break;
                            }
                        }
                    }
                    const lineBreaks = lineBreaksComputer.finalize();
                    let lineBreaksOffset = 0;
                    for (const change of changes) {
                        switch (change.changeType) {
                            case 1 /* Flush */: {
                                this._lines.onModelFlushed();
                                eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                                this._decorations.reset();
                                this.viewLayout.onFlushed(this.getLineCount());
                                hadOtherModelChange = true;
                                break;
                            }
                            case 3 /* LinesDeleted */: {
                                const linesDeletedEvent = this._lines.onModelLinesDeleted(versionId, change.fromLineNumber, change.toLineNumber);
                                if (linesDeletedEvent !== null) {
                                    eventsCollector.emitViewEvent(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 4 /* LinesInserted */: {
                                const insertedLineBreaks = lineBreaks.slice(lineBreaksOffset, lineBreaksOffset + change.detail.length);
                                lineBreaksOffset += change.detail.length;
                                const linesInsertedEvent = this._lines.onModelLinesInserted(versionId, change.fromLineNumber, change.toLineNumber, insertedLineBreaks);
                                if (linesInsertedEvent !== null) {
                                    eventsCollector.emitViewEvent(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 2 /* LineChanged */: {
                                const changedLineBreakData = lineBreaks[lineBreaksOffset];
                                lineBreaksOffset++;
                                const [lineMappingChanged, linesChangedEvent, linesInsertedEvent, linesDeletedEvent] = this._lines.onModelLineChanged(versionId, change.lineNumber, changedLineBreakData);
                                hadModelLineChangeThatChangedLineMapping = lineMappingChanged;
                                if (linesChangedEvent) {
                                    eventsCollector.emitViewEvent(linesChangedEvent);
                                }
                                if (linesInsertedEvent) {
                                    eventsCollector.emitViewEvent(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                if (linesDeletedEvent) {
                                    eventsCollector.emitViewEvent(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                break;
                            }
                            case 5 /* EOLChanged */: {
                                // Nothing to do. The new version will be accepted below
                                break;
                            }
                        }
                    }
                    this._lines.acceptVersionId(versionId);
                    this.viewLayout.onHeightMaybeChanged();
                    if (!hadOtherModelChange && hadModelLineChangeThatChangedLineMapping) {
                        eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                        this._cursor.onLineMappingChanged(eventsCollector);
                        this._decorations.onLineMappingChanged();
                    }
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
                // Update the configuration and reset the centered view line
                this._viewportStartLine = -1;
                this._configuration.setMaxLineNumber(this.model.getLineCount());
                this._updateConfigurationViewLineCountNow();
                // Recover viewport
                if (!this._hasFocus && this.model.getAttachedEditorCount() >= 2 && this._viewportStartLineTrackedRange) {
                    const modelRange = this.model._getTrackedRange(this._viewportStartLineTrackedRange);
                    if (modelRange) {
                        const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelRange.getStartPosition());
                        const viewPositionTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                        this.viewLayout.setScrollPosition({ scrollTop: viewPositionTop + this._viewportStartLineDelta }, 1 /* Immediate */);
                    }
                }
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    this._cursor.onModelContentChanged(eventsCollector, e);
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
            }));
            this._register(this.model.onDidChangeTokens((e) => {
                let viewRanges = [];
                for (let j = 0, lenJ = e.ranges.length; j < lenJ; j++) {
                    const modelRange = e.ranges[j];
                    const viewStartLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.fromLineNumber, 1)).lineNumber;
                    const viewEndLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.toLineNumber, this.model.getLineMaxColumn(modelRange.toLineNumber))).lineNumber;
                    viewRanges[j] = {
                        fromLineNumber: viewStartLineNumber,
                        toLineNumber: viewEndLineNumber
                    };
                }
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewTokensChangedEvent(viewRanges));
                if (e.tokenizationSupportChanged) {
                    this._tokenizeViewportSoon.schedule();
                }
            }));
            this._register(this.model.onDidChangeLanguageConfiguration((e) => {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewLanguageConfigurationEvent());
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageIdentifier(), this.model.getOptions(), this._configuration);
                this._cursor.updateConfiguration(this.cursorConfig);
            }));
            this._register(this.model.onDidChangeLanguage((e) => {
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageIdentifier(), this.model.getOptions(), this._configuration);
                this._cursor.updateConfiguration(this.cursorConfig);
            }));
            this._register(this.model.onDidChangeOptions((e) => {
                // A tab size change causes a line mapping changed event => all view parts will repaint OK, no further event needed here
                if (this._lines.setTabSize(this.model.getOptions().tabSize)) {
                    try {
                        const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                        eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                        this._cursor.onLineMappingChanged(eventsCollector);
                        this._decorations.onLineMappingChanged();
                        this.viewLayout.onFlushed(this.getLineCount());
                    }
                    finally {
                        this._eventDispatcher.endEmitViewEvents();
                    }
                    this._updateConfigurationViewLineCount.schedule();
                }
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageIdentifier(), this.model.getOptions(), this._configuration);
                this._cursor.updateConfiguration(this.cursorConfig);
            }));
            this._register(this.model.onDidChangeDecorations((e) => {
                this._decorations.onModelDecorationsChanged();
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewDecorationsChangedEvent(e));
            }));
        }
        setHiddenAreas(ranges) {
            try {
                const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                let lineMappingChanged = this._lines.setHiddenAreas(ranges);
                if (lineMappingChanged) {
                    eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                    eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                    eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                    this._cursor.onLineMappingChanged(eventsCollector);
                    this._decorations.onLineMappingChanged();
                    this.viewLayout.onFlushed(this.getLineCount());
                    this.viewLayout.onHeightMaybeChanged();
                }
            }
            finally {
                this._eventDispatcher.endEmitViewEvents();
            }
            this._updateConfigurationViewLineCount.schedule();
        }
        getVisibleRangesPlusViewportAboveBelow() {
            const layoutInfo = this._configuration.options.get(115 /* layoutInfo */);
            const lineHeight = this._configuration.options.get(51 /* lineHeight */);
            const linesAround = Math.max(20, Math.round(layoutInfo.height / lineHeight));
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = Math.max(1, partialData.completelyVisibleStartLineNumber - linesAround);
            const endViewLineNumber = Math.min(this.getLineCount(), partialData.completelyVisibleEndLineNumber + linesAround);
            return this._toModelVisibleRanges(new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber)));
        }
        getVisibleRanges() {
            const visibleViewRange = this.getCompletelyVisibleViewRange();
            return this._toModelVisibleRanges(visibleViewRange);
        }
        _toModelVisibleRanges(visibleViewRange) {
            const visibleRange = this.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
            const hiddenAreas = this._lines.getHiddenAreas();
            if (hiddenAreas.length === 0) {
                return [visibleRange];
            }
            let result = [], resultLen = 0;
            let startLineNumber = visibleRange.startLineNumber;
            let startColumn = visibleRange.startColumn;
            let endLineNumber = visibleRange.endLineNumber;
            let endColumn = visibleRange.endColumn;
            for (let i = 0, len = hiddenAreas.length; i < len; i++) {
                const hiddenStartLineNumber = hiddenAreas[i].startLineNumber;
                const hiddenEndLineNumber = hiddenAreas[i].endLineNumber;
                if (hiddenEndLineNumber < startLineNumber) {
                    continue;
                }
                if (hiddenStartLineNumber > endLineNumber) {
                    continue;
                }
                if (startLineNumber < hiddenStartLineNumber) {
                    result[resultLen++] = new range_1.Range(startLineNumber, startColumn, hiddenStartLineNumber - 1, this.model.getLineMaxColumn(hiddenStartLineNumber - 1));
                }
                startLineNumber = hiddenEndLineNumber + 1;
                startColumn = 1;
            }
            if (startLineNumber < endLineNumber || (startLineNumber === endLineNumber && startColumn < endColumn)) {
                result[resultLen++] = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
            }
            return result;
        }
        getCompletelyVisibleViewRange() {
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        getCompletelyVisibleViewRangeAtScrollTop(scrollTop) {
            const partialData = this.viewLayout.getLinesViewportDataAtScrollTop(scrollTop);
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        saveState() {
            const compatViewState = this.viewLayout.saveState();
            const scrollTop = compatViewState.scrollTop;
            const firstViewLineNumber = this.viewLayout.getLineNumberAtVerticalOffset(scrollTop);
            const firstPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(firstViewLineNumber, this.getLineMinColumn(firstViewLineNumber)));
            const firstPositionDeltaTop = this.viewLayout.getVerticalOffsetForLineNumber(firstViewLineNumber) - scrollTop;
            return {
                scrollLeft: compatViewState.scrollLeft,
                firstPosition: firstPosition,
                firstPositionDeltaTop: firstPositionDeltaTop
            };
        }
        reduceRestoreState(state) {
            if (typeof state.firstPosition === 'undefined') {
                // This is a view state serialized by an older version
                return this._reduceRestoreStateCompatibility(state);
            }
            const modelPosition = this.model.validatePosition(state.firstPosition);
            const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            const scrollTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber) - state.firstPositionDeltaTop;
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: scrollTop
            };
        }
        _reduceRestoreStateCompatibility(state) {
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: state.scrollTopWithoutViewZones
            };
        }
        getTabSize() {
            return this.model.getOptions().tabSize;
        }
        getTextModelOptions() {
            return this.model.getOptions();
        }
        getLineCount() {
            return this._lines.getViewLineCount();
        }
        /**
         * Gives a hint that a lot of requests are about to come in for these line numbers.
         */
        setViewport(startLineNumber, endLineNumber, centeredLineNumber) {
            this._viewportStartLine = startLineNumber;
            let position = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(startLineNumber, this.getLineMinColumn(startLineNumber)));
            this._viewportStartLineTrackedRange = this.model._setTrackedRange(this._viewportStartLineTrackedRange, new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column), 1 /* NeverGrowsWhenTypingAtEdges */);
            const viewportStartLineTop = this.viewLayout.getVerticalOffsetForLineNumber(startLineNumber);
            const scrollTop = this.viewLayout.getCurrentScrollTop();
            this._viewportStartLineDelta = scrollTop - viewportStartLineTop;
        }
        getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber) {
            return this._lines.getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber);
        }
        getLinesIndentGuides(startLineNumber, endLineNumber) {
            return this._lines.getViewLinesIndentGuides(startLineNumber, endLineNumber);
        }
        getLineContent(lineNumber) {
            return this._lines.getViewLineContent(lineNumber);
        }
        getLineLength(lineNumber) {
            return this._lines.getViewLineLength(lineNumber);
        }
        getLineMinColumn(lineNumber) {
            return this._lines.getViewLineMinColumn(lineNumber);
        }
        getLineMaxColumn(lineNumber) {
            return this._lines.getViewLineMaxColumn(lineNumber);
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            const result = strings.firstNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 1;
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            const result = strings.lastNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 2;
        }
        getDecorationsInViewport(visibleRange) {
            return this._decorations.getDecorationsViewportData(visibleRange).decorations;
        }
        getViewLineRenderingData(visibleRange, lineNumber) {
            let mightContainRTL = this.model.mightContainRTL();
            let mightContainNonBasicASCII = this.model.mightContainNonBasicASCII();
            let tabSize = this.getTabSize();
            let lineData = this._lines.getViewLineData(lineNumber);
            let allInlineDecorations = this._decorations.getDecorationsViewportData(visibleRange).inlineDecorations;
            let inlineDecorations = allInlineDecorations[lineNumber - visibleRange.startLineNumber];
            return new viewModel_1.ViewLineRenderingData(lineData.minColumn, lineData.maxColumn, lineData.content, lineData.continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, lineData.tokens, inlineDecorations, tabSize, lineData.startVisibleColumn);
        }
        getViewLineData(lineNumber) {
            return this._lines.getViewLineData(lineNumber);
        }
        getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed) {
            let result = this._lines.getViewLinesData(startLineNumber, endLineNumber, needed);
            return new viewModel_1.MinimapLinesRenderingData(this.getTabSize(), result);
        }
        getAllOverviewRulerDecorations(theme) {
            return this._lines.getAllOverviewRulerDecorations(this._editorId, editorOptions_1.filterValidationDecorations(this._configuration.options), theme);
        }
        invalidateOverviewRulerColorCache() {
            const decorations = this.model.getOverviewRulerDecorations();
            for (const decoration of decorations) {
                const opts = decoration.options.overviewRuler;
                if (opts) {
                    opts.invalidateCachedColor();
                }
            }
        }
        invalidateMinimapColorCache() {
            const decorations = this.model.getAllDecorations();
            for (const decoration of decorations) {
                const opts = decoration.options.minimap;
                if (opts) {
                    opts.invalidateCachedColor();
                }
            }
        }
        getValueInRange(range, eol) {
            const modelRange = this.coordinatesConverter.convertViewRangeToModelRange(range);
            return this.model.getValueInRange(modelRange, eol);
        }
        getModelLineMaxColumn(modelLineNumber) {
            return this.model.getLineMaxColumn(modelLineNumber);
        }
        validateModelPosition(position) {
            return this.model.validatePosition(position);
        }
        validateModelRange(range) {
            return this.model.validateRange(range);
        }
        deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt) {
            const modelAnchor = this.coordinatesConverter.convertViewPositionToModelPosition(viewAnchorPosition);
            if (this.model.getEOL().length === 2) {
                // This model uses CRLF, so the delta must take that into account
                if (deltaOffset < 0) {
                    deltaOffset -= lineFeedCnt;
                }
                else {
                    deltaOffset += lineFeedCnt;
                }
            }
            const modelAnchorOffset = this.model.getOffsetAt(modelAnchor);
            const resultOffset = modelAnchorOffset + deltaOffset;
            return this.model.getPositionAt(resultOffset);
        }
        getEOL() {
            return this.model.getEOL();
        }
        getPlainTextToCopy(modelRanges, emptySelectionClipboard, forceCRLF) {
            const newLineCharacter = forceCRLF ? '\r\n' : this.model.getEOL();
            modelRanges = modelRanges.slice(0);
            modelRanges.sort(range_1.Range.compareRangesUsingStarts);
            let hasEmptyRange = false;
            let hasNonEmptyRange = false;
            for (const range of modelRanges) {
                if (range.isEmpty()) {
                    hasEmptyRange = true;
                }
                else {
                    hasNonEmptyRange = true;
                }
            }
            if (!hasNonEmptyRange) {
                // all ranges are empty
                if (!emptySelectionClipboard) {
                    return '';
                }
                const modelLineNumbers = modelRanges.map((r) => r.startLineNumber);
                let result = '';
                for (let i = 0; i < modelLineNumbers.length; i++) {
                    if (i > 0 && modelLineNumbers[i - 1] === modelLineNumbers[i]) {
                        continue;
                    }
                    result += this.model.getLineContent(modelLineNumbers[i]) + newLineCharacter;
                }
                return result;
            }
            if (hasEmptyRange && emptySelectionClipboard) {
                // mixed empty selections and non-empty selections
                let result = [];
                let prevModelLineNumber = 0;
                for (const modelRange of modelRanges) {
                    const modelLineNumber = modelRange.startLineNumber;
                    if (modelRange.isEmpty()) {
                        if (modelLineNumber !== prevModelLineNumber) {
                            result.push(this.model.getLineContent(modelLineNumber));
                        }
                    }
                    else {
                        result.push(this.model.getValueInRange(modelRange, forceCRLF ? 2 /* CRLF */ : 0 /* TextDefined */));
                    }
                    prevModelLineNumber = modelLineNumber;
                }
                return result.length === 1 ? result[0] : result;
            }
            let result = [];
            for (const modelRange of modelRanges) {
                if (!modelRange.isEmpty()) {
                    result.push(this.model.getValueInRange(modelRange, forceCRLF ? 2 /* CRLF */ : 0 /* TextDefined */));
                }
            }
            return result.length === 1 ? result[0] : result;
        }
        getRichTextToCopy(modelRanges, emptySelectionClipboard) {
            const languageId = this.model.getLanguageIdentifier();
            if (languageId.id === 1 /* PlainText */) {
                return null;
            }
            if (modelRanges.length !== 1) {
                // no multiple selection support at this time
                return null;
            }
            let range = modelRanges[0];
            if (range.isEmpty()) {
                if (!emptySelectionClipboard) {
                    // nothing to copy
                    return null;
                }
                const lineNumber = range.startLineNumber;
                range = new range_1.Range(lineNumber, this.model.getLineMinColumn(lineNumber), lineNumber, this.model.getLineMaxColumn(lineNumber));
            }
            const fontInfo = this._configuration.options.get(36 /* fontInfo */);
            const colorMap = this._getColorMap();
            const fontFamily = fontInfo.fontFamily === editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily ? fontInfo.fontFamily : `'${fontInfo.fontFamily}', ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`;
            return {
                mode: languageId.language,
                html: (`<div style="`
                    + `color: ${colorMap[1 /* DefaultForeground */]};`
                    + `background-color: ${colorMap[2 /* DefaultBackground */]};`
                    + `font-family: ${fontFamily};`
                    + `font-weight: ${fontInfo.fontWeight};`
                    + `font-size: ${fontInfo.fontSize}px;`
                    + `line-height: ${fontInfo.lineHeight}px;`
                    + `white-space: pre;`
                    + `">`
                    + this._getHTMLToCopy(range, colorMap)
                    + '</div>')
            };
        }
        _getHTMLToCopy(modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = this.getTabSize();
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = this.model.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += textToHtmlTokenizer_1.tokenizeLineToHTML(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return result;
        }
        _getColorMap() {
            let colorMap = modes_1.TokenizationRegistry.getColorMap();
            let result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
        //#region model
        pushStackElement() {
            this.model.pushStackElement();
        }
        //#endregion
        //#region cursor operations
        getPrimaryCursorState() {
            return this._cursor.getPrimaryCursorState();
        }
        getLastAddedCursorIndex() {
            return this._cursor.getLastAddedCursorIndex();
        }
        getCursorStates() {
            return this._cursor.getCursorStates();
        }
        setCursorStates(source, reason, states) {
            this._withViewEventsCollector(eventsCollector => this._cursor.setStates(eventsCollector, source, reason, states));
        }
        getCursorColumnSelectData() {
            return this._cursor.getCursorColumnSelectData();
        }
        setCursorColumnSelectData(columnSelectData) {
            this._cursor.setCursorColumnSelectData(columnSelectData);
        }
        getPrevEditOperationType() {
            return this._cursor.getPrevEditOperationType();
        }
        setPrevEditOperationType(type) {
            this._cursor.setPrevEditOperationType(type);
        }
        getSelection() {
            return this._cursor.getSelection();
        }
        getSelections() {
            return this._cursor.getSelections();
        }
        getPosition() {
            return this._cursor.getPrimaryCursorState().modelState.position;
        }
        setSelections(source, selections) {
            this._withViewEventsCollector(eventsCollector => this._cursor.setSelections(eventsCollector, source, selections));
        }
        saveCursorState() {
            return this._cursor.saveState();
        }
        restoreCursorState(states) {
            this._withViewEventsCollector(eventsCollector => this._cursor.restoreState(eventsCollector, states));
        }
        _executeCursorEdit(callback) {
            if (this._cursor.context.cursorConfig.readOnly) {
                // we cannot edit when read only...
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ReadOnlyEditAttemptEvent());
                return;
            }
            this._withViewEventsCollector(callback);
        }
        executeEdits(source, edits, cursorStateComputer) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeEdits(eventsCollector, source, edits, cursorStateComputer));
        }
        startComposition() {
            this._cursor.setIsDoingComposition(true);
            this._executeCursorEdit(eventsCollector => this._cursor.startComposition(eventsCollector));
        }
        endComposition(source) {
            this._cursor.setIsDoingComposition(false);
            this._executeCursorEdit(eventsCollector => this._cursor.endComposition(eventsCollector, source));
        }
        type(text, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.type(eventsCollector, text, source));
        }
        replacePreviousChar(text, replaceCharCnt, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.replacePreviousChar(eventsCollector, text, replaceCharCnt, source));
        }
        paste(text, pasteOnNewLine, multicursorText, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.paste(eventsCollector, text, pasteOnNewLine, multicursorText, source));
        }
        cut(source) {
            this._executeCursorEdit(eventsCollector => this._cursor.cut(eventsCollector, source));
        }
        executeCommand(command, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeCommand(eventsCollector, command, source));
        }
        executeCommands(commands, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeCommands(eventsCollector, commands, source));
        }
        revealPrimaryCursor(source, revealHorizontal) {
            this._withViewEventsCollector(eventsCollector => this._cursor.revealPrimary(eventsCollector, source, revealHorizontal, 0 /* Smooth */));
        }
        revealTopMostCursor(source) {
            const viewPosition = this._cursor.getTopMostViewPosition();
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, viewRange, null, 0 /* Simple */, true, 0 /* Smooth */)));
        }
        revealBottomMostCursor(source) {
            const viewPosition = this._cursor.getBottomMostViewPosition();
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, viewRange, null, 0 /* Simple */, true, 0 /* Smooth */)));
        }
        revealRange(source, revealHorizontal, viewRange, verticalType, scrollType) {
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, viewRange, null, verticalType, revealHorizontal, scrollType)));
        }
        //#endregion
        //#region viewLayout
        getVerticalOffsetForLineNumber(viewLineNumber) {
            return this.viewLayout.getVerticalOffsetForLineNumber(viewLineNumber);
        }
        getScrollTop() {
            return this.viewLayout.getCurrentScrollTop();
        }
        setScrollTop(newScrollTop, scrollType) {
            this.viewLayout.setScrollPosition({ scrollTop: newScrollTop }, scrollType);
        }
        setScrollPosition(position, type) {
            this.viewLayout.setScrollPosition(position, type);
        }
        deltaScrollNow(deltaScrollLeft, deltaScrollTop) {
            this.viewLayout.deltaScrollNow(deltaScrollLeft, deltaScrollTop);
        }
        changeWhitespace(callback) {
            const hadAChange = this.viewLayout.changeWhitespace(callback);
            if (hadAChange) {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewZonesChangedEvent());
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ViewZonesChangedEvent());
            }
        }
        setMaxLineWidth(maxLineWidth) {
            this.viewLayout.setMaxLineWidth(maxLineWidth);
        }
        //#endregion
        _withViewEventsCollector(callback) {
            try {
                const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                callback(eventsCollector);
            }
            finally {
                this._eventDispatcher.endEmitViewEvents();
            }
        }
    }
    exports.ViewModel = ViewModel;
});
//# __sourceMappingURL=viewModelImpl.js.map