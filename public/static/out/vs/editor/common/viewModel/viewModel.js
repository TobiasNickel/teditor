/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModelDecoration = exports.InlineDecoration = exports.InlineDecorationType = exports.ViewLineRenderingData = exports.ViewLineData = exports.MinimapLinesRenderingData = exports.Viewport = void 0;
    class Viewport {
        constructor(top, left, width, height) {
            this.top = top | 0;
            this.left = left | 0;
            this.width = width | 0;
            this.height = height | 0;
        }
    }
    exports.Viewport = Viewport;
    class MinimapLinesRenderingData {
        constructor(tabSize, data) {
            this.tabSize = tabSize;
            this.data = data;
        }
    }
    exports.MinimapLinesRenderingData = MinimapLinesRenderingData;
    class ViewLineData {
        constructor(content, continuesWithWrappedLine, minColumn, maxColumn, startVisibleColumn, tokens) {
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.startVisibleColumn = startVisibleColumn;
            this.tokens = tokens;
        }
    }
    exports.ViewLineData = ViewLineData;
    class ViewLineRenderingData {
        constructor(minColumn, maxColumn, content, continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, tokens, inlineDecorations, tabSize, startVisibleColumn) {
            this.minColumn = minColumn;
            this.maxColumn = maxColumn;
            this.content = content;
            this.continuesWithWrappedLine = continuesWithWrappedLine;
            this.isBasicASCII = ViewLineRenderingData.isBasicASCII(content, mightContainNonBasicASCII);
            this.containsRTL = ViewLineRenderingData.containsRTL(content, this.isBasicASCII, mightContainRTL);
            this.tokens = tokens;
            this.inlineDecorations = inlineDecorations;
            this.tabSize = tabSize;
            this.startVisibleColumn = startVisibleColumn;
        }
        static isBasicASCII(lineContent, mightContainNonBasicASCII) {
            if (mightContainNonBasicASCII) {
                return strings.isBasicASCII(lineContent);
            }
            return true;
        }
        static containsRTL(lineContent, isBasicASCII, mightContainRTL) {
            if (!isBasicASCII && mightContainRTL) {
                return strings.containsRTL(lineContent);
            }
            return false;
        }
    }
    exports.ViewLineRenderingData = ViewLineRenderingData;
    var InlineDecorationType;
    (function (InlineDecorationType) {
        InlineDecorationType[InlineDecorationType["Regular"] = 0] = "Regular";
        InlineDecorationType[InlineDecorationType["Before"] = 1] = "Before";
        InlineDecorationType[InlineDecorationType["After"] = 2] = "After";
        InlineDecorationType[InlineDecorationType["RegularAffectingLetterSpacing"] = 3] = "RegularAffectingLetterSpacing";
    })(InlineDecorationType = exports.InlineDecorationType || (exports.InlineDecorationType = {}));
    class InlineDecoration {
        constructor(range, inlineClassName, type) {
            this.range = range;
            this.inlineClassName = inlineClassName;
            this.type = type;
        }
    }
    exports.InlineDecoration = InlineDecoration;
    class ViewModelDecoration {
        constructor(range, options) {
            this.range = range;
            this.options = options;
        }
    }
    exports.ViewModelDecoration = ViewModelDecoration;
});
//# __sourceMappingURL=viewModel.js.map