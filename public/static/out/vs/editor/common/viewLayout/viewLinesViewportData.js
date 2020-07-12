/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewportData = void 0;
    /**
     * Contains all data needed to render at a specific viewport.
     */
    class ViewportData {
        constructor(selections, partialData, whitespaceViewportData, model) {
            this.selections = selections;
            this.startLineNumber = partialData.startLineNumber | 0;
            this.endLineNumber = partialData.endLineNumber | 0;
            this.relativeVerticalOffset = partialData.relativeVerticalOffset;
            this.bigNumbersDelta = partialData.bigNumbersDelta | 0;
            this.whitespaceViewportData = whitespaceViewportData;
            this._model = model;
            this.visibleRange = new range_1.Range(partialData.startLineNumber, this._model.getLineMinColumn(partialData.startLineNumber), partialData.endLineNumber, this._model.getLineMaxColumn(partialData.endLineNumber));
        }
        getViewLineRenderingData(lineNumber) {
            return this._model.getViewLineRenderingData(this.visibleRange, lineNumber);
        }
        getDecorationsInViewport() {
            return this._model.getDecorationsInViewport(this.visibleRange);
        }
    }
    exports.ViewportData = ViewportData;
});
//# __sourceMappingURL=viewLinesViewportData.js.map