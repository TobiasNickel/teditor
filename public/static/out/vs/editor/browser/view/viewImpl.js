/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/editor/common/core/selection", "vs/base/browser/fastDomNode", "vs/base/common/errors", "vs/editor/browser/controller/pointerHandler", "vs/editor/browser/controller/textAreaHandler", "vs/editor/browser/view/viewController", "vs/editor/browser/view/viewUserInputEvents", "vs/editor/browser/view/viewOverlays", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/contentWidgets/contentWidgets", "vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight", "vs/editor/browser/viewParts/decorations/decorations", "vs/editor/browser/viewParts/editorScrollbar/editorScrollbar", "vs/editor/browser/viewParts/glyphMargin/glyphMargin", "vs/editor/browser/viewParts/indentGuides/indentGuides", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/lines/viewLines", "vs/editor/browser/viewParts/linesDecorations/linesDecorations", "vs/editor/browser/viewParts/margin/margin", "vs/editor/browser/viewParts/marginDecorations/marginDecorations", "vs/editor/browser/viewParts/minimap/minimap", "vs/editor/browser/viewParts/overlayWidgets/overlayWidgets", "vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler", "vs/editor/browser/viewParts/overviewRuler/overviewRuler", "vs/editor/browser/viewParts/rulers/rulers", "vs/editor/browser/viewParts/scrollDecoration/scrollDecoration", "vs/editor/browser/viewParts/selections/selections", "vs/editor/browser/viewParts/viewCursors/viewCursors", "vs/editor/browser/viewParts/viewZones/viewZones", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/view/renderingContext", "vs/editor/common/view/viewContext", "vs/editor/common/viewLayout/viewLinesViewportData", "vs/editor/common/viewModel/viewEventHandler", "vs/platform/theme/common/themeService", "vs/editor/browser/controller/mouseTarget"], function (require, exports, dom, selection_1, fastDomNode_1, errors_1, pointerHandler_1, textAreaHandler_1, viewController_1, viewUserInputEvents_1, viewOverlays_1, viewPart_1, contentWidgets_1, currentLineHighlight_1, decorations_1, editorScrollbar_1, glyphMargin_1, indentGuides_1, lineNumbers_1, viewLines_1, linesDecorations_1, margin_1, marginDecorations_1, minimap_1, overlayWidgets_1, decorationsOverviewRuler_1, overviewRuler_1, rulers_1, scrollDecoration_1, selections_1, viewCursors_1, viewZones_1, position_1, range_1, renderingContext_1, viewContext_1, viewLinesViewportData_1, viewEventHandler_1, themeService_1, mouseTarget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    class View extends viewEventHandler_1.ViewEventHandler {
        constructor(commandDelegate, configuration, themeService, model, userInputEvents) {
            super();
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            this._renderAnimationFrame = null;
            const viewController = new viewController_1.ViewController(configuration, model, userInputEvents, commandDelegate);
            // The view context is passed on to most classes (basically to reduce param. counts in ctors)
            this._context = new viewContext_1.ViewContext(configuration, themeService.getColorTheme(), model);
            // Ensure the view is the first event handler in order to update the layout
            this._context.addEventHandler(this);
            this._register(themeService.onDidColorThemeChange(theme => {
                this._context.theme.update(theme);
                this._context.model.onDidColorThemeChange();
                this.render(true, false);
            }));
            this._viewParts = [];
            // Keyboard handler
            this._textAreaHandler = new textAreaHandler_1.TextAreaHandler(this._context, viewController, this._createTextAreaHandlerHelper());
            this._viewParts.push(this._textAreaHandler);
            // These two dom nodes must be constructed up front, since references are needed in the layout provider (scrolling & co.)
            this._linesContent = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._linesContent.setClassName('lines-content' + ' monaco-editor-background');
            this._linesContent.setPosition('absolute');
            this.domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.domNode.setClassName(this._getEditorClassName());
            // Set role 'code' for better screen reader support https://github.com/microsoft/vscode/issues/93438
            this.domNode.setAttribute('role', 'code');
            this._overflowGuardContainer = fastDomNode_1.createFastDomNode(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._overflowGuardContainer, 3 /* OverflowGuard */);
            this._overflowGuardContainer.setClassName('overflow-guard');
            this._scrollbar = new editorScrollbar_1.EditorScrollbar(this._context, this._linesContent, this.domNode, this._overflowGuardContainer);
            this._viewParts.push(this._scrollbar);
            // View Lines
            this._viewLines = new viewLines_1.ViewLines(this._context, this._linesContent);
            // View Zones
            this._viewZones = new viewZones_1.ViewZones(this._context);
            this._viewParts.push(this._viewZones);
            // Decorations overview ruler
            const decorationsOverviewRuler = new decorationsOverviewRuler_1.DecorationsOverviewRuler(this._context);
            this._viewParts.push(decorationsOverviewRuler);
            const scrollDecoration = new scrollDecoration_1.ScrollDecorationViewPart(this._context);
            this._viewParts.push(scrollDecoration);
            const contentViewOverlays = new viewOverlays_1.ContentViewOverlays(this._context);
            this._viewParts.push(contentViewOverlays);
            contentViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineHighlightOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new selections_1.SelectionsOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new indentGuides_1.IndentGuidesOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new decorations_1.DecorationsOverlay(this._context));
            const marginViewOverlays = new viewOverlays_1.MarginViewOverlays(this._context);
            this._viewParts.push(marginViewOverlays);
            marginViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineMarginHighlightOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new glyphMargin_1.GlyphMarginOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new marginDecorations_1.MarginViewLineDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new linesDecorations_1.LinesDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new lineNumbers_1.LineNumbersOverlay(this._context));
            const margin = new margin_1.Margin(this._context);
            margin.getDomNode().appendChild(this._viewZones.marginDomNode);
            margin.getDomNode().appendChild(marginViewOverlays.getDomNode());
            this._viewParts.push(margin);
            // Content widgets
            this._contentWidgets = new contentWidgets_1.ViewContentWidgets(this._context, this.domNode);
            this._viewParts.push(this._contentWidgets);
            this._viewCursors = new viewCursors_1.ViewCursors(this._context);
            this._viewParts.push(this._viewCursors);
            // Overlay widgets
            this._overlayWidgets = new overlayWidgets_1.ViewOverlayWidgets(this._context);
            this._viewParts.push(this._overlayWidgets);
            const rulers = new rulers_1.Rulers(this._context);
            this._viewParts.push(rulers);
            const minimap = new minimap_1.Minimap(this._context);
            this._viewParts.push(minimap);
            // -------------- Wire dom nodes up
            if (decorationsOverviewRuler) {
                const overviewRulerData = this._scrollbar.getOverviewRulerLayoutInfo();
                overviewRulerData.parent.insertBefore(decorationsOverviewRuler.getDomNode(), overviewRulerData.insertBefore);
            }
            this._linesContent.appendChild(contentViewOverlays.getDomNode());
            this._linesContent.appendChild(rulers.domNode);
            this._linesContent.appendChild(this._viewZones.domNode);
            this._linesContent.appendChild(this._viewLines.getDomNode());
            this._linesContent.appendChild(this._contentWidgets.domNode);
            this._linesContent.appendChild(this._viewCursors.getDomNode());
            this._overflowGuardContainer.appendChild(margin.getDomNode());
            this._overflowGuardContainer.appendChild(this._scrollbar.getDomNode());
            this._overflowGuardContainer.appendChild(scrollDecoration.getDomNode());
            this._overflowGuardContainer.appendChild(this._textAreaHandler.textArea);
            this._overflowGuardContainer.appendChild(this._textAreaHandler.textAreaCover);
            this._overflowGuardContainer.appendChild(this._overlayWidgets.getDomNode());
            this._overflowGuardContainer.appendChild(minimap.getDomNode());
            this.domNode.appendChild(this._overflowGuardContainer);
            this.domNode.appendChild(this._contentWidgets.overflowingContentWidgetsDomNode);
            this._applyLayout();
            // Pointer handler
            this._pointerHandler = this._register(new pointerHandler_1.PointerHandler(this._context, viewController, this._createPointerHandlerHelper()));
        }
        _flushAccumulatedAndRenderNow() {
            this._renderNow();
        }
        _createPointerHandlerHelper() {
            return {
                viewDomNode: this.domNode.domNode,
                linesContentDomNode: this._linesContent.domNode,
                focusTextArea: () => {
                    this.focus();
                },
                getLastRenderData: () => {
                    const lastViewCursorsRenderData = this._viewCursors.getLastRenderData() || [];
                    const lastTextareaPosition = this._textAreaHandler.getLastRenderData();
                    return new mouseTarget_1.PointerHandlerLastRenderData(lastViewCursorsRenderData, lastTextareaPosition);
                },
                shouldSuppressMouseDownOnViewZone: (viewZoneId) => {
                    return this._viewZones.shouldSuppressMouseDownOnViewZone(viewZoneId);
                },
                shouldSuppressMouseDownOnWidget: (widgetId) => {
                    return this._contentWidgets.shouldSuppressMouseDownOnWidget(widgetId);
                },
                getPositionFromDOMInfo: (spanNode, offset) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.getPositionFromDOMInfo(spanNode, offset);
                },
                visibleRangeForPosition: (lineNumber, column) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.visibleRangeForPosition(new position_1.Position(lineNumber, column));
                },
                getLineWidth: (lineNumber) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.getLineWidth(lineNumber);
                }
            };
        }
        _createTextAreaHandlerHelper() {
            return {
                visibleRangeForPositionRelativeToEditor: (lineNumber, column) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.visibleRangeForPosition(new position_1.Position(lineNumber, column));
                }
            };
        }
        _applyLayout() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(115 /* layoutInfo */);
            this.domNode.setWidth(layoutInfo.width);
            this.domNode.setHeight(layoutInfo.height);
            this._overflowGuardContainer.setWidth(layoutInfo.width);
            this._overflowGuardContainer.setHeight(layoutInfo.height);
            this._linesContent.setWidth(1000000);
            this._linesContent.setHeight(1000000);
        }
        _getEditorClassName() {
            const focused = this._textAreaHandler.isFocused() ? ' focused' : '';
            return this._context.configuration.options.get(112 /* editorClassName */) + ' ' + themeService_1.getThemeTypeSelector(this._context.theme.type) + focused;
        }
        // --- begin event handlers
        handleEvents(events) {
            super.handleEvents(events);
            this._scheduleRender();
        }
        onConfigurationChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            this._applyLayout();
            return false;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            return false;
        }
        onFocusChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            return false;
        }
        onThemeChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            return false;
        }
        // --- end event handlers
        dispose() {
            if (this._renderAnimationFrame !== null) {
                this._renderAnimationFrame.dispose();
                this._renderAnimationFrame = null;
            }
            this._context.removeEventHandler(this);
            this._viewLines.dispose();
            // Destroy view parts
            for (let i = 0, len = this._viewParts.length; i < len; i++) {
                this._viewParts[i].dispose();
            }
            super.dispose();
        }
        _scheduleRender() {
            if (this._renderAnimationFrame === null) {
                this._renderAnimationFrame = dom.runAtThisOrScheduleAtNextAnimationFrame(this._onRenderScheduled.bind(this), 100);
            }
        }
        _onRenderScheduled() {
            this._renderAnimationFrame = null;
            this._flushAccumulatedAndRenderNow();
        }
        _renderNow() {
            safeInvokeNoArg(() => this._actualRender());
        }
        _getViewPartsToRender() {
            let result = [], resultLen = 0;
            for (let i = 0, len = this._viewParts.length; i < len; i++) {
                const viewPart = this._viewParts[i];
                if (viewPart.shouldRender()) {
                    result[resultLen++] = viewPart;
                }
            }
            return result;
        }
        _actualRender() {
            if (!dom.isInDOM(this.domNode.domNode)) {
                return;
            }
            let viewPartsToRender = this._getViewPartsToRender();
            if (!this._viewLines.shouldRender() && viewPartsToRender.length === 0) {
                // Nothing to render
                return;
            }
            const partialViewportData = this._context.viewLayout.getLinesViewportData();
            this._context.model.setViewport(partialViewportData.startLineNumber, partialViewportData.endLineNumber, partialViewportData.centeredLineNumber);
            const viewportData = new viewLinesViewportData_1.ViewportData(this._selections, partialViewportData, this._context.viewLayout.getWhitespaceViewportData(), this._context.model);
            if (this._contentWidgets.shouldRender()) {
                // Give the content widgets a chance to set their max width before a possible synchronous layout
                this._contentWidgets.onBeforeRender(viewportData);
            }
            if (this._viewLines.shouldRender()) {
                this._viewLines.renderText(viewportData);
                this._viewLines.onDidRender();
                // Rendering of viewLines might cause scroll events to occur, so collect view parts to render again
                viewPartsToRender = this._getViewPartsToRender();
            }
            const renderingContext = new renderingContext_1.RenderingContext(this._context.viewLayout, viewportData, this._viewLines);
            // Render the rest of the parts
            for (let i = 0, len = viewPartsToRender.length; i < len; i++) {
                const viewPart = viewPartsToRender[i];
                viewPart.prepareRender(renderingContext);
            }
            for (let i = 0, len = viewPartsToRender.length; i < len; i++) {
                const viewPart = viewPartsToRender[i];
                viewPart.render(renderingContext);
                viewPart.onDidRender();
            }
        }
        // --- BEGIN CodeEditor helpers
        delegateVerticalScrollbarMouseDown(browserEvent) {
            this._scrollbar.delegateVerticalScrollbarMouseDown(browserEvent);
        }
        restoreState(scrollPosition) {
            this._context.model.setScrollPosition({ scrollTop: scrollPosition.scrollTop }, 1 /* Immediate */);
            this._context.model.tokenizeViewport();
            this._renderNow();
            this._viewLines.updateLineWidths();
            this._context.model.setScrollPosition({ scrollLeft: scrollPosition.scrollLeft }, 1 /* Immediate */);
        }
        getOffsetForColumn(modelLineNumber, modelColumn) {
            const modelPosition = this._context.model.validateModelPosition({
                lineNumber: modelLineNumber,
                column: modelColumn
            });
            const viewPosition = this._context.model.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            this._flushAccumulatedAndRenderNow();
            const visibleRange = this._viewLines.visibleRangeForPosition(new position_1.Position(viewPosition.lineNumber, viewPosition.column));
            if (!visibleRange) {
                return -1;
            }
            return visibleRange.left;
        }
        getTargetAtClientPoint(clientX, clientY) {
            const mouseTarget = this._pointerHandler.getTargetAtClientPoint(clientX, clientY);
            if (!mouseTarget) {
                return null;
            }
            return viewUserInputEvents_1.ViewUserInputEvents.convertViewToModelMouseTarget(mouseTarget, this._context.model.coordinatesConverter);
        }
        createOverviewRuler(cssClassName) {
            return new overviewRuler_1.OverviewRuler(this._context, cssClassName);
        }
        change(callback) {
            this._viewZones.changeViewZones(callback);
            this._scheduleRender();
        }
        render(now, everything) {
            if (everything) {
                // Force everything to render...
                this._viewLines.forceShouldRender();
                for (let i = 0, len = this._viewParts.length; i < len; i++) {
                    const viewPart = this._viewParts[i];
                    viewPart.forceShouldRender();
                }
            }
            if (now) {
                this._flushAccumulatedAndRenderNow();
            }
            else {
                this._scheduleRender();
            }
        }
        focus() {
            this._textAreaHandler.focusTextArea();
        }
        isFocused() {
            return this._textAreaHandler.isFocused();
        }
        refreshFocusState() {
            this._textAreaHandler.refreshFocusState();
        }
        setAriaOptions(options) {
            this._textAreaHandler.setAriaOptions(options);
        }
        addContentWidget(widgetData) {
            this._contentWidgets.addWidget(widgetData.widget);
            this.layoutContentWidget(widgetData);
            this._scheduleRender();
        }
        layoutContentWidget(widgetData) {
            let newRange = widgetData.position ? widgetData.position.range || null : null;
            if (newRange === null) {
                const newPosition = widgetData.position ? widgetData.position.position : null;
                if (newPosition !== null) {
                    newRange = new range_1.Range(newPosition.lineNumber, newPosition.column, newPosition.lineNumber, newPosition.column);
                }
            }
            const newPreference = widgetData.position ? widgetData.position.preference : null;
            this._contentWidgets.setWidgetPosition(widgetData.widget, newRange, newPreference);
            this._scheduleRender();
        }
        removeContentWidget(widgetData) {
            this._contentWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
        addOverlayWidget(widgetData) {
            this._overlayWidgets.addWidget(widgetData.widget);
            this.layoutOverlayWidget(widgetData);
            this._scheduleRender();
        }
        layoutOverlayWidget(widgetData) {
            const newPreference = widgetData.position ? widgetData.position.preference : null;
            const shouldRender = this._overlayWidgets.setWidgetPosition(widgetData.widget, newPreference);
            if (shouldRender) {
                this._scheduleRender();
            }
        }
        removeOverlayWidget(widgetData) {
            this._overlayWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
    }
    exports.View = View;
    function safeInvokeNoArg(func) {
        try {
            return func();
        }
        catch (e) {
            errors_1.onUnexpectedError(e);
        }
    }
});
//# __sourceMappingURL=viewImpl.js.map