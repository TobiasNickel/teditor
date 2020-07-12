/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/lineTokens", "vs/editor/common/modes/nullMode"], function (require, exports, strings, lineTokens_1, nullMode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenizeLineToHTML = exports.tokenizeToString = void 0;
    const fallback = {
        getInitialState: () => nullMode_1.NULL_STATE,
        tokenize2: (buffer, state, deltaOffset) => nullMode_1.nullTokenize2(0 /* Null */, buffer, state, deltaOffset)
    };
    function tokenizeToString(text, tokenizationSupport = fallback) {
        return _tokenizeToString(text, tokenizationSupport || fallback);
    }
    exports.tokenizeToString = tokenizeToString;
    function tokenizeLineToHTML(text, viewLineTokens, colorMap, startOffset, endOffset, tabSize, useNbsp) {
        let result = `<div>`;
        let charIndex = startOffset;
        let tabsCharDelta = 0;
        for (let tokenIndex = 0, tokenCount = viewLineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
            const tokenEndIndex = viewLineTokens.getEndOffset(tokenIndex);
            if (tokenEndIndex <= startOffset) {
                continue;
            }
            let partContent = '';
            for (; charIndex < tokenEndIndex && charIndex < endOffset; charIndex++) {
                const charCode = text.charCodeAt(charIndex);
                switch (charCode) {
                    case 9 /* Tab */:
                        let insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        while (insertSpacesCount > 0) {
                            partContent += useNbsp ? '&#160;' : ' ';
                            insertSpacesCount--;
                        }
                        break;
                    case 60 /* LessThan */:
                        partContent += '&lt;';
                        break;
                    case 62 /* GreaterThan */:
                        partContent += '&gt;';
                        break;
                    case 38 /* Ampersand */:
                        partContent += '&amp;';
                        break;
                    case 0 /* Null */:
                        partContent += '&#00;';
                        break;
                    case 65279 /* UTF8_BOM */:
                    case 8232 /* LINE_SEPARATOR */:
                    case 8233 /* PARAGRAPH_SEPARATOR */:
                    case 133 /* NEXT_LINE */:
                        partContent += '\ufffd';
                        break;
                    case 13 /* CarriageReturn */:
                        // zero width space, because carriage return would introduce a line break
                        partContent += '&#8203';
                        break;
                    case 32 /* Space */:
                        partContent += useNbsp ? '&#160;' : ' ';
                        break;
                    default:
                        partContent += String.fromCharCode(charCode);
                }
            }
            result += `<span style="${viewLineTokens.getInlineStyle(tokenIndex, colorMap)}">${partContent}</span>`;
            if (tokenEndIndex > endOffset || charIndex >= endOffset) {
                break;
            }
        }
        result += `</div>`;
        return result;
    }
    exports.tokenizeLineToHTML = tokenizeLineToHTML;
    function _tokenizeToString(text, tokenizationSupport) {
        let result = `<div class="monaco-tokenized-source">`;
        let lines = text.split(/\r\n|\r|\n/);
        let currentState = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            let line = lines[i];
            if (i > 0) {
                result += `<br/>`;
            }
            let tokenizationResult = tokenizationSupport.tokenize2(line, currentState, 0);
            lineTokens_1.LineTokens.convertToEndOffset(tokenizationResult.tokens, line.length);
            let lineTokens = new lineTokens_1.LineTokens(tokenizationResult.tokens, line);
            let viewLineTokens = lineTokens.inflate();
            let startOffset = 0;
            for (let j = 0, lenJ = viewLineTokens.getCount(); j < lenJ; j++) {
                const type = viewLineTokens.getClassName(j);
                const endIndex = viewLineTokens.getEndOffset(j);
                result += `<span class="${type}">${strings.escape(line.substring(startOffset, endIndex))}</span>`;
                startOffset = endIndex;
            }
            currentState = tokenizationResult.endState;
        }
        result += `</div>`;
        return result;
    }
});
//# __sourceMappingURL=textToHtmlTokenizer.js.map