/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/scrollable", "vs/editor/common/viewLayout/linesLayout", "vs/editor/common/viewModel/viewModel", "vs/editor/common/viewModel/viewModelEventDispatcher"], function (require, exports, event_1, lifecycle_1, scrollable_1, linesLayout_1, viewModel_1, viewModelEventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLayout = void 0;
    const SMOOTH_SCROLLING_TIME = 125;
    class EditorScrollDimensions {
        constructor(width, contentWidth, height, contentHeight) {
            width = width | 0;
            contentWidth = contentWidth | 0;
            height = height | 0;
            contentHeight = contentHeight | 0;
            if (width < 0) {
                width = 0;
            }
            if (contentWidth < 0) {
                contentWidth = 0;
            }
            if (height < 0) {
                height = 0;
            }
            if (contentHeight < 0) {
                contentHeight = 0;
            }
            this.width = width;
            this.contentWidth = contentWidth;
            this.scrollWidth = Math.max(width, contentWidth);
            this.height = height;
            this.contentHeight = contentHeight;
            this.scrollHeight = Math.max(height, contentHeight);
        }
        equals(other) {
            return (this.width === other.width
                && this.contentWidth === other.contentWidth
                && this.height === other.height
                && this.contentHeight === other.contentHeight);
        }
    }
    class EditorScrollable extends lifecycle_1.Disposable {
        constructor(smoothScrollDuration, scheduleAtNextAnimationFrame) {
            super();
            this._onDidContentSizeChange = this._register(new event_1.Emitter());
            this.onDidContentSizeChange = this._onDidContentSizeChange.event;
            this._dimensions = new EditorScrollDimensions(0, 0, 0, 0);
            this._scrollable = this._register(new scrollable_1.Scrollable(smoothScrollDuration, scheduleAtNextAnimationFrame));
            this.onDidScroll = this._scrollable.onScroll;
        }
        getScrollable() {
            return this._scrollable;
        }
        setSmoothScrollDuration(smoothScrollDuration) {
            this._scrollable.setSmoothScrollDuration(smoothScrollDuration);
        }
        validateScrollPosition(scrollPosition) {
            return this._scrollable.validateScrollPosition(scrollPosition);
        }
        getScrollDimensions() {
            return this._dimensions;
        }
        setScrollDimensions(dimensions) {
            if (this._dimensions.equals(dimensions)) {
                return;
            }
            const oldDimensions = this._dimensions;
            this._dimensions = dimensions;
            this._scrollable.setScrollDimensions({
                width: dimensions.width,
                scrollWidth: dimensions.scrollWidth,
                height: dimensions.height,
                scrollHeight: dimensions.scrollHeight
            }, true);
            const contentWidthChanged = (oldDimensions.contentWidth !== dimensions.contentWidth);
            const contentHeightChanged = (oldDimensions.contentHeight !== dimensions.contentHeight);
            if (contentWidthChanged || contentHeightChanged) {
                this._onDidContentSizeChange.fire(new viewModelEventDispatcher_1.ContentSizeChangedEvent(oldDimensions.contentWidth, oldDimensions.contentHeight, dimensions.contentWidth, dimensions.contentHeight));
            }
        }
        getFutureScrollPosition() {
            return this._scrollable.getFutureScrollPosition();
        }
        getCurrentScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
        setScrollPositionNow(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        setScrollPositionSmooth(update) {
            this._scrollable.setScrollPositionSmooth(update);
        }
    }
    class ViewLayout extends lifecycle_1.Disposable {
        constructor(configuration, lineCount, scheduleAtNextAnimationFrame) {
            super();
            this._configuration = configuration;
            const options = this._configuration.options;
            const layoutInfo = options.get(115 /* layoutInfo */);
            const padding = options.get(66 /* padding */);
            this._linesLayout = new linesLayout_1.LinesLayout(lineCount, options.get(51 /* lineHeight */), padding.top, padding.bottom);
            this._scrollable = this._register(new EditorScrollable(0, scheduleAtNextAnimationFrame));
            this._configureSmoothScrollDuration();
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(layoutInfo.contentWidth, 0, layoutInfo.height, 0));
            this.onDidScroll = this._scrollable.onDidScroll;
            this.onDidContentSizeChange = this._scrollable.onDidContentSizeChange;
            this._updateHeight();
        }
        dispose() {
            super.dispose();
        }
        getScrollable() {
            return this._scrollable.getScrollable();
        }
        onHeightMaybeChanged() {
            this._updateHeight();
        }
        _configureSmoothScrollDuration() {
            this._scrollable.setSmoothScrollDuration(this._configuration.options.get(94 /* smoothScrolling */) ? SMOOTH_SCROLLING_TIME : 0);
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._configuration.options;
            if (e.hasChanged(51 /* lineHeight */)) {
                this._linesLayout.setLineHeight(options.get(51 /* lineHeight */));
            }
            if (e.hasChanged(66 /* padding */)) {
                const padding = options.get(66 /* padding */);
                this._linesLayout.setPadding(padding.top, padding.bottom);
            }
            if (e.hasChanged(115 /* layoutInfo */)) {
                const layoutInfo = options.get(115 /* layoutInfo */);
                const width = layoutInfo.contentWidth;
                const height = layoutInfo.height;
                const scrollDimensions = this._scrollable.getScrollDimensions();
                const scrollWidth = scrollDimensions.scrollWidth;
                this._scrollable.setScrollDimensions(new EditorScrollDimensions(width, scrollDimensions.contentWidth, height, this._getContentHeight(width, height, scrollWidth)));
            }
            else {
                this._updateHeight();
            }
            if (e.hasChanged(94 /* smoothScrolling */)) {
                this._configureSmoothScrollDuration();
            }
        }
        onFlushed(lineCount) {
            this._linesLayout.onFlushed(lineCount);
        }
        onLinesDeleted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesDeleted(fromLineNumber, toLineNumber);
        }
        onLinesInserted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesInserted(fromLineNumber, toLineNumber);
        }
        // ---- end view event handlers
        _getHorizontalScrollbarHeight(width, scrollWidth) {
            const options = this._configuration.options;
            const scrollbar = options.get(84 /* scrollbar */);
            if (scrollbar.horizontal === 2 /* Hidden */) {
                // horizontal scrollbar not visible
                return 0;
            }
            if (width >= scrollWidth) {
                // horizontal scrollbar not visible
                return 0;
            }
            return scrollbar.horizontalScrollbarSize;
        }
        _getContentHeight(width, height, scrollWidth) {
            const options = this._configuration.options;
            let result = this._linesLayout.getLinesTotalHeight();
            if (options.get(86 /* scrollBeyondLastLine */)) {
                result += height - options.get(51 /* lineHeight */);
            }
            else {
                result += this._getHorizontalScrollbarHeight(width, scrollWidth);
            }
            return result;
        }
        _updateHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const width = scrollDimensions.width;
            const height = scrollDimensions.height;
            const scrollWidth = scrollDimensions.scrollWidth;
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(width, scrollDimensions.contentWidth, height, this._getContentHeight(width, height, scrollWidth)));
        }
        // ---- Layouting logic
        getCurrentViewport() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        getFutureViewport() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const currentScrollPosition = this._scrollable.getFutureScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        _computeContentWidth(maxLineWidth) {
            const options = this._configuration.options;
            const wrappingInfo = options.get(116 /* wrappingInfo */);
            const fontInfo = options.get(36 /* fontInfo */);
            if (wrappingInfo.isViewportWrapping) {
                const layoutInfo = options.get(115 /* layoutInfo */);
                const minimap = options.get(56 /* minimap */);
                if (maxLineWidth > layoutInfo.contentWidth + fontInfo.typicalHalfwidthCharacterWidth) {
                    // This is a case where viewport wrapping is on, but the line extends above the viewport
                    if (minimap.enabled && minimap.side === 'right') {
                        // We need to accomodate the scrollbar width
                        return maxLineWidth + layoutInfo.verticalScrollbarWidth;
                    }
                }
                return maxLineWidth;
            }
            else {
                const extraHorizontalSpace = options.get(85 /* scrollBeyondLastColumn */) * fontInfo.typicalHalfwidthCharacterWidth;
                const whitespaceMinWidth = this._linesLayout.getWhitespaceMinWidth();
                return Math.max(maxLineWidth + extraHorizontalSpace, whitespaceMinWidth);
            }
        }
        setMaxLineWidth(maxLineWidth) {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            // const newScrollWidth = ;
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(scrollDimensions.width, this._computeContentWidth(maxLineWidth), scrollDimensions.height, scrollDimensions.contentHeight));
            // The height might depend on the fact that there is a horizontal scrollbar or not
            this._updateHeight();
        }
        // ---- view state
        saveState() {
            const currentScrollPosition = this._scrollable.getFutureScrollPosition();
            let scrollTop = currentScrollPosition.scrollTop;
            let firstLineNumberInViewport = this._linesLayout.getLineNumberAtOrAfterVerticalOffset(scrollTop);
            let whitespaceAboveFirstLine = this._linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(firstLineNumberInViewport);
            return {
                scrollTop: scrollTop,
                scrollTopWithoutViewZones: scrollTop - whitespaceAboveFirstLine,
                scrollLeft: currentScrollPosition.scrollLeft
            };
        }
        // ---- IVerticalLayoutProvider
        changeWhitespace(callback) {
            const hadAChange = this._linesLayout.changeWhitespace(callback);
            if (hadAChange) {
                this.onHeightMaybeChanged();
            }
            return hadAChange;
        }
        getVerticalOffsetForLineNumber(lineNumber) {
            return this._linesLayout.getVerticalOffsetForLineNumber(lineNumber);
        }
        isAfterLines(verticalOffset) {
            return this._linesLayout.isAfterLines(verticalOffset);
        }
        getLineNumberAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getLineNumberAtOrAfterVerticalOffset(verticalOffset);
        }
        getWhitespaceAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getWhitespaceAtVerticalOffset(verticalOffset);
        }
        getLinesViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getLinesViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getLinesViewportDataAtScrollTop(scrollTop) {
            // do some minimal validations on scrollTop
            const scrollDimensions = this._scrollable.getScrollDimensions();
            if (scrollTop + scrollDimensions.height > scrollDimensions.scrollHeight) {
                scrollTop = scrollDimensions.scrollHeight - scrollDimensions.height;
            }
            if (scrollTop < 0) {
                scrollTop = 0;
            }
            return this._linesLayout.getLinesViewportData(scrollTop, scrollTop + scrollDimensions.height);
        }
        getWhitespaceViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getWhitespaceViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getWhitespaces() {
            return this._linesLayout.getWhitespaces();
        }
        // ---- IScrollingProvider
        getContentWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.contentWidth;
        }
        getScrollWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.scrollWidth;
        }
        getContentHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.contentHeight;
        }
        getScrollHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.scrollHeight;
        }
        getCurrentScrollLeft() {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollLeft;
        }
        getCurrentScrollTop() {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollTop;
        }
        validateScrollPosition(scrollPosition) {
            return this._scrollable.validateScrollPosition(scrollPosition);
        }
        setScrollPosition(position, type) {
            if (type === 1 /* Immediate */) {
                this._scrollable.setScrollPositionNow(position);
            }
            else {
                this._scrollable.setScrollPositionSmooth(position);
            }
        }
        deltaScrollNow(deltaScrollLeft, deltaScrollTop) {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            this._scrollable.setScrollPositionNow({
                scrollLeft: currentScrollPosition.scrollLeft + deltaScrollLeft,
                scrollTop: currentScrollPosition.scrollTop + deltaScrollTop
            });
        }
    }
    exports.ViewLayout = ViewLayout;
});
//# __sourceMappingURL=viewLayout.js.map