/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/contrib/hover/hoverOperation", "vs/editor/contrib/hover/hoverWidgets", "vs/editor/contrib/markdown/markdownRenderer", "vs/platform/opener/common/opener", "vs/base/common/arrays"], function (require, exports, dom_1, htmlContent_1, lifecycle_1, hoverOperation_1, hoverWidgets_1, markdownRenderer_1, opener_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModesGlyphHoverWidget = void 0;
    class MarginComputer {
        constructor(editor) {
            this._editor = editor;
            this._lineNumber = -1;
            this._result = [];
        }
        setLineNumber(lineNumber) {
            this._lineNumber = lineNumber;
            this._result = [];
        }
        clearResult() {
            this._result = [];
        }
        computeSync() {
            const toHoverMessage = (contents) => {
                return {
                    value: contents
                };
            };
            const lineDecorations = this._editor.getLineDecorations(this._lineNumber);
            const result = [];
            if (!lineDecorations) {
                return result;
            }
            for (const d of lineDecorations) {
                if (!d.options.glyphMarginClassName) {
                    continue;
                }
                const hoverMessage = d.options.glyphMarginHoverMessage;
                if (!hoverMessage || htmlContent_1.isEmptyMarkdownString(hoverMessage)) {
                    continue;
                }
                result.push(...arrays_1.asArray(hoverMessage).map(toHoverMessage));
            }
            return result;
        }
        onResult(result, isFromSynchronousComputation) {
            this._result = this._result.concat(result);
        }
        getResult() {
            return this._result;
        }
        getResultWithLoadingMessage() {
            return this.getResult();
        }
    }
    class ModesGlyphHoverWidget extends hoverWidgets_1.GlyphHoverWidget {
        constructor(editor, modeService, openerService = opener_1.NullOpenerService) {
            super(ModesGlyphHoverWidget.ID, editor);
            this._renderDisposeables = this._register(new lifecycle_1.DisposableStore());
            this._messages = [];
            this._lastLineNumber = -1;
            this._markdownRenderer = this._register(new markdownRenderer_1.MarkdownRenderer(this._editor, modeService, openerService));
            this._computer = new MarginComputer(this._editor);
            this._hoverOperation = new hoverOperation_1.HoverOperation(this._computer, (result) => this._withResult(result), undefined, (result) => this._withResult(result), 300);
        }
        dispose() {
            this._hoverOperation.cancel();
            super.dispose();
        }
        onModelDecorationsChanged() {
            if (this.isVisible) {
                // The decorations have changed and the hover is visible,
                // we need to recompute the displayed text
                this._hoverOperation.cancel();
                this._computer.clearResult();
                this._hoverOperation.start(0 /* Delayed */);
            }
        }
        startShowingAt(lineNumber) {
            if (this._lastLineNumber === lineNumber) {
                // We have to show the widget at the exact same line number as before, so no work is needed
                return;
            }
            this._hoverOperation.cancel();
            this.hide();
            this._lastLineNumber = lineNumber;
            this._computer.setLineNumber(lineNumber);
            this._hoverOperation.start(0 /* Delayed */);
        }
        hide() {
            this._lastLineNumber = -1;
            this._hoverOperation.cancel();
            super.hide();
        }
        _withResult(result) {
            this._messages = result;
            if (this._messages.length > 0) {
                this._renderMessages(this._lastLineNumber, this._messages);
            }
            else {
                this.hide();
            }
        }
        _renderMessages(lineNumber, messages) {
            this._renderDisposeables.clear();
            const fragment = document.createDocumentFragment();
            for (const msg of messages) {
                const renderedContents = this._markdownRenderer.render(msg.value);
                this._renderDisposeables.add(renderedContents);
                fragment.appendChild(dom_1.$('div.hover-row', undefined, renderedContents.element));
            }
            this.updateContents(fragment);
            this.showAt(lineNumber);
        }
    }
    exports.ModesGlyphHoverWidget = ModesGlyphHoverWidget;
    ModesGlyphHoverWidget.ID = 'editor.contrib.modesGlyphHoverWidget';
});
//# __sourceMappingURL=modesGlyphHover.js.map