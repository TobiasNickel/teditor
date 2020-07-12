/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/base/common/strings"], function (require, exports, range_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordSelectionRangeProvider = void 0;
    class WordSelectionRangeProvider {
        provideSelectionRanges(model, positions) {
            const result = [];
            for (const position of positions) {
                const bucket = [];
                result.push(bucket);
                this._addInWordRanges(bucket, model, position);
                this._addWordRanges(bucket, model, position);
                this._addWhitespaceLine(bucket, model, position);
                bucket.push({ range: model.getFullModelRange() });
            }
            return result;
        }
        _addInWordRanges(bucket, model, pos) {
            const obj = model.getWordAtPosition(pos);
            if (!obj) {
                return;
            }
            let { word, startColumn } = obj;
            let offset = pos.column - startColumn;
            let start = offset;
            let end = offset;
            let lastCh = 0;
            // LEFT anchor (start)
            for (; start >= 0; start--) {
                let ch = word.charCodeAt(start);
                if ((start !== offset) && (ch === 95 /* Underline */ || ch === 45 /* Dash */)) {
                    // foo-bar OR foo_bar
                    break;
                }
                else if (strings_1.isLowerAsciiLetter(ch) && strings_1.isUpperAsciiLetter(lastCh)) {
                    // fooBar
                    break;
                }
                lastCh = ch;
            }
            start += 1;
            // RIGHT anchor (end)
            for (; end < word.length; end++) {
                let ch = word.charCodeAt(end);
                if (strings_1.isUpperAsciiLetter(ch) && strings_1.isLowerAsciiLetter(lastCh)) {
                    // fooBar
                    break;
                }
                else if (ch === 95 /* Underline */ || ch === 45 /* Dash */) {
                    // foo-bar OR foo_bar
                    break;
                }
                lastCh = ch;
            }
            if (start < end) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, startColumn + start, pos.lineNumber, startColumn + end) });
            }
        }
        _addWordRanges(bucket, model, pos) {
            const word = model.getWordAtPosition(pos);
            if (word) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn) });
            }
        }
        _addWhitespaceLine(bucket, model, pos) {
            if (model.getLineLength(pos.lineNumber) > 0
                && model.getLineFirstNonWhitespaceColumn(pos.lineNumber) === 0
                && model.getLineLastNonWhitespaceColumn(pos.lineNumber) === 0) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, model.getLineMaxColumn(pos.lineNumber)) });
            }
        }
    }
    exports.WordSelectionRangeProvider = WordSelectionRangeProvider;
});
//# __sourceMappingURL=wordSelections.js.map