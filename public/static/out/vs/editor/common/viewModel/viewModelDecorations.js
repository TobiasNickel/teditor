/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/viewModel/viewModel", "vs/editor/common/config/editorOptions"], function (require, exports, position_1, range_1, viewModel_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModelDecorations = void 0;
    class ViewModelDecorations {
        constructor(editorId, model, configuration, linesCollection, coordinatesConverter) {
            this.editorId = editorId;
            this.model = model;
            this.configuration = configuration;
            this._linesCollection = linesCollection;
            this._coordinatesConverter = coordinatesConverter;
            this._decorationsCache = Object.create(null);
            this._cachedModelDecorationsResolver = null;
            this._cachedModelDecorationsResolverViewRange = null;
        }
        _clearCachedModelDecorationsResolver() {
            this._cachedModelDecorationsResolver = null;
            this._cachedModelDecorationsResolverViewRange = null;
        }
        dispose() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        reset() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        onModelDecorationsChanged() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        onLineMappingChanged() {
            this._decorationsCache = Object.create(null);
            this._clearCachedModelDecorationsResolver();
        }
        _getOrCreateViewModelDecoration(modelDecoration) {
            const id = modelDecoration.id;
            let r = this._decorationsCache[id];
            if (!r) {
                const modelRange = modelDecoration.range;
                const options = modelDecoration.options;
                let viewRange;
                if (options.isWholeLine) {
                    const start = this._coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.startLineNumber, 1));
                    const end = this._coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.endLineNumber, this.model.getLineMaxColumn(modelRange.endLineNumber)));
                    viewRange = new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
                }
                else {
                    viewRange = this._coordinatesConverter.convertModelRangeToViewRange(modelRange);
                }
                r = new viewModel_1.ViewModelDecoration(viewRange, options);
                this._decorationsCache[id] = r;
            }
            return r;
        }
        getDecorationsViewportData(viewRange) {
            let cacheIsValid = (this._cachedModelDecorationsResolver !== null);
            cacheIsValid = cacheIsValid && (viewRange.equalsRange(this._cachedModelDecorationsResolverViewRange));
            if (!cacheIsValid) {
                this._cachedModelDecorationsResolver = this._getDecorationsViewportData(viewRange);
                this._cachedModelDecorationsResolverViewRange = viewRange;
            }
            return this._cachedModelDecorationsResolver;
        }
        _getDecorationsViewportData(viewportRange) {
            const modelDecorations = this._linesCollection.getDecorationsInRange(viewportRange, this.editorId, editorOptions_1.filterValidationDecorations(this.configuration.options));
            const startLineNumber = viewportRange.startLineNumber;
            const endLineNumber = viewportRange.endLineNumber;
            let decorationsInViewport = [], decorationsInViewportLen = 0;
            let inlineDecorations = [];
            for (let j = startLineNumber; j <= endLineNumber; j++) {
                inlineDecorations[j - startLineNumber] = [];
            }
            for (let i = 0, len = modelDecorations.length; i < len; i++) {
                let modelDecoration = modelDecorations[i];
                let decorationOptions = modelDecoration.options;
                let viewModelDecoration = this._getOrCreateViewModelDecoration(modelDecoration);
                let viewRange = viewModelDecoration.range;
                decorationsInViewport[decorationsInViewportLen++] = viewModelDecoration;
                if (decorationOptions.inlineClassName) {
                    let inlineDecoration = new viewModel_1.InlineDecoration(viewRange, decorationOptions.inlineClassName, decorationOptions.inlineClassNameAffectsLetterSpacing ? 3 /* RegularAffectingLetterSpacing */ : 0 /* Regular */);
                    let intersectedStartLineNumber = Math.max(startLineNumber, viewRange.startLineNumber);
                    let intersectedEndLineNumber = Math.min(endLineNumber, viewRange.endLineNumber);
                    for (let j = intersectedStartLineNumber; j <= intersectedEndLineNumber; j++) {
                        inlineDecorations[j - startLineNumber].push(inlineDecoration);
                    }
                }
                if (decorationOptions.beforeContentClassName) {
                    if (startLineNumber <= viewRange.startLineNumber && viewRange.startLineNumber <= endLineNumber) {
                        let inlineDecoration = new viewModel_1.InlineDecoration(new range_1.Range(viewRange.startLineNumber, viewRange.startColumn, viewRange.startLineNumber, viewRange.startColumn), decorationOptions.beforeContentClassName, 1 /* Before */);
                        inlineDecorations[viewRange.startLineNumber - startLineNumber].push(inlineDecoration);
                    }
                }
                if (decorationOptions.afterContentClassName) {
                    if (startLineNumber <= viewRange.endLineNumber && viewRange.endLineNumber <= endLineNumber) {
                        let inlineDecoration = new viewModel_1.InlineDecoration(new range_1.Range(viewRange.endLineNumber, viewRange.endColumn, viewRange.endLineNumber, viewRange.endColumn), decorationOptions.afterContentClassName, 2 /* After */);
                        inlineDecorations[viewRange.endLineNumber - startLineNumber].push(inlineDecoration);
                    }
                }
            }
            return {
                decorations: decorationsInViewport,
                inlineDecorations: inlineDecorations
            };
        }
    }
    exports.ViewModelDecorations = ViewModelDecorations;
});
//# __sourceMappingURL=viewModelDecorations.js.map