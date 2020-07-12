/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/common/core/position", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/css!./lineNumbers"], function (require, exports, platform, dynamicViewOverlay_1, position_1, editorColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineNumbersOverlay = void 0;
    class LineNumbersOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            this._readConfig();
            this._lastCursorModelPosition = new position_1.Position(1, 1);
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        _readConfig() {
            const options = this._context.configuration.options;
            this._lineHeight = options.get(51 /* lineHeight */);
            const lineNumbers = options.get(52 /* lineNumbers */);
            this._renderLineNumbers = lineNumbers.renderType;
            this._renderCustomLineNumbers = lineNumbers.renderFn;
            this._renderFinalNewline = options.get(76 /* renderFinalNewline */);
            const layoutInfo = options.get(115 /* layoutInfo */);
            this._lineNumbersLeft = layoutInfo.lineNumbersLeft;
            this._lineNumbersWidth = layoutInfo.lineNumbersWidth;
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            this._readConfig();
            return true;
        }
        onCursorStateChanged(e) {
            const primaryViewPosition = e.selections[0].getPosition();
            this._lastCursorModelPosition = this._context.model.coordinatesConverter.convertViewPositionToModelPosition(primaryViewPosition);
            if (this._renderLineNumbers === 2 /* Relative */ || this._renderLineNumbers === 3 /* Interval */) {
                return true;
            }
            return false;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        _getLineRenderLineNumber(viewLineNumber) {
            const modelPosition = this._context.model.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(viewLineNumber, 1));
            if (modelPosition.column !== 1) {
                return '';
            }
            const modelLineNumber = modelPosition.lineNumber;
            if (this._renderCustomLineNumbers) {
                return this._renderCustomLineNumbers(modelLineNumber);
            }
            if (this._renderLineNumbers === 2 /* Relative */) {
                const diff = Math.abs(this._lastCursorModelPosition.lineNumber - modelLineNumber);
                if (diff === 0) {
                    return '<span class="relative-current-line-number">' + modelLineNumber + '</span>';
                }
                return String(diff);
            }
            if (this._renderLineNumbers === 3 /* Interval */) {
                if (this._lastCursorModelPosition.lineNumber === modelLineNumber) {
                    return String(modelLineNumber);
                }
                if (modelLineNumber % 10 === 0) {
                    return String(modelLineNumber);
                }
                return '';
            }
            return String(modelLineNumber);
        }
        prepareRender(ctx) {
            if (this._renderLineNumbers === 0 /* Off */) {
                this._renderResult = null;
                return;
            }
            const lineHeightClassName = (platform.isLinux ? (this._lineHeight % 2 === 0 ? ' lh-even' : ' lh-odd') : '');
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const common = '<div class="' + LineNumbersOverlay.CLASS_NAME + lineHeightClassName + '" style="left:' + this._lineNumbersLeft.toString() + 'px;width:' + this._lineNumbersWidth.toString() + 'px;">';
            const lineCount = this._context.model.getLineCount();
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                if (!this._renderFinalNewline) {
                    if (lineNumber === lineCount && this._context.model.getLineLength(lineNumber) === 0) {
                        // Do not render last (empty) line
                        output[lineIndex] = '';
                        continue;
                    }
                }
                const renderLineNumber = this._getLineRenderLineNumber(lineNumber);
                if (renderLineNumber) {
                    output[lineIndex] = (common
                        + renderLineNumber
                        + '</div>');
                }
                else {
                    output[lineIndex] = '';
                }
            }
            this._renderResult = output;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.LineNumbersOverlay = LineNumbersOverlay;
    LineNumbersOverlay.CLASS_NAME = 'line-numbers';
    // theming
    themeService_1.registerThemingParticipant((theme, collector) => {
        const lineNumbers = theme.getColor(editorColorRegistry_1.editorLineNumbers);
        if (lineNumbers) {
            collector.addRule(`.monaco-editor .line-numbers { color: ${lineNumbers}; }`);
        }
        const activeLineNumber = theme.getColor(editorColorRegistry_1.editorActiveLineNumber);
        if (activeLineNumber) {
            collector.addRule(`.monaco-editor .current-line ~ .line-numbers { color: ${activeLineNumber}; }`);
        }
    });
});
//# __sourceMappingURL=lineNumbers.js.map