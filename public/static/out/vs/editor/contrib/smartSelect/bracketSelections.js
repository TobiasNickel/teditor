/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/common/linkedList"], function (require, exports, position_1, range_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketSelectionRangeProvider = void 0;
    class BracketSelectionRangeProvider {
        async provideSelectionRanges(model, positions) {
            const result = [];
            for (const position of positions) {
                const bucket = [];
                result.push(bucket);
                const ranges = new Map();
                await new Promise(resolve => BracketSelectionRangeProvider._bracketsRightYield(resolve, 0, model, position, ranges));
                await new Promise(resolve => BracketSelectionRangeProvider._bracketsLeftYield(resolve, 0, model, position, ranges, bucket));
            }
            return result;
        }
        static _bracketsRightYield(resolve, round, model, pos, ranges) {
            const counts = new Map();
            const t1 = Date.now();
            while (true) {
                if (round >= BracketSelectionRangeProvider._maxRounds) {
                    resolve();
                    break;
                }
                if (!pos) {
                    resolve();
                    break;
                }
                let bracket = model.findNextBracket(pos);
                if (!bracket) {
                    resolve();
                    break;
                }
                let d = Date.now() - t1;
                if (d > BracketSelectionRangeProvider._maxDuration) {
                    setTimeout(() => BracketSelectionRangeProvider._bracketsRightYield(resolve, round + 1, model, pos, ranges));
                    break;
                }
                const key = bracket.close[0];
                if (bracket.isOpen) {
                    // wait for closing
                    let val = counts.has(key) ? counts.get(key) : 0;
                    counts.set(key, val + 1);
                }
                else {
                    // process closing
                    let val = counts.has(key) ? counts.get(key) : 0;
                    val -= 1;
                    counts.set(key, Math.max(0, val));
                    if (val < 0) {
                        let list = ranges.get(key);
                        if (!list) {
                            list = new linkedList_1.LinkedList();
                            ranges.set(key, list);
                        }
                        list.push(bracket.range);
                    }
                }
                pos = bracket.range.getEndPosition();
            }
        }
        static _bracketsLeftYield(resolve, round, model, pos, ranges, bucket) {
            const counts = new Map();
            const t1 = Date.now();
            while (true) {
                if (round >= BracketSelectionRangeProvider._maxRounds && ranges.size === 0) {
                    resolve();
                    break;
                }
                if (!pos) {
                    resolve();
                    break;
                }
                let bracket = model.findPrevBracket(pos);
                if (!bracket) {
                    resolve();
                    break;
                }
                let d = Date.now() - t1;
                if (d > BracketSelectionRangeProvider._maxDuration) {
                    setTimeout(() => BracketSelectionRangeProvider._bracketsLeftYield(resolve, round + 1, model, pos, ranges, bucket));
                    break;
                }
                const key = bracket.close[0];
                if (!bracket.isOpen) {
                    // wait for opening
                    let val = counts.has(key) ? counts.get(key) : 0;
                    counts.set(key, val + 1);
                }
                else {
                    // opening
                    let val = counts.has(key) ? counts.get(key) : 0;
                    val -= 1;
                    counts.set(key, Math.max(0, val));
                    if (val < 0) {
                        let list = ranges.get(key);
                        if (list) {
                            let closing = list.shift();
                            if (list.size === 0) {
                                ranges.delete(key);
                            }
                            const innerBracket = range_1.Range.fromPositions(bracket.range.getEndPosition(), closing.getStartPosition());
                            const outerBracket = range_1.Range.fromPositions(bracket.range.getStartPosition(), closing.getEndPosition());
                            bucket.push({ range: innerBracket });
                            bucket.push({ range: outerBracket });
                            BracketSelectionRangeProvider._addBracketLeading(model, outerBracket, bucket);
                        }
                    }
                }
                pos = bracket.range.getStartPosition();
            }
        }
        static _addBracketLeading(model, bracket, bucket) {
            if (bracket.startLineNumber === bracket.endLineNumber) {
                return;
            }
            // xxxxxxxx {
            //
            // }
            const startLine = bracket.startLineNumber;
            const column = model.getLineFirstNonWhitespaceColumn(startLine);
            if (column !== 0 && column !== bracket.startColumn) {
                bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(startLine, column), bracket.getEndPosition()) });
                bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(startLine, 1), bracket.getEndPosition()) });
            }
            // xxxxxxxx
            // {
            //
            // }
            const aboveLine = startLine - 1;
            if (aboveLine > 0) {
                const column = model.getLineFirstNonWhitespaceColumn(aboveLine);
                if (column === bracket.startColumn && column !== model.getLineLastNonWhitespaceColumn(aboveLine)) {
                    bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(aboveLine, column), bracket.getEndPosition()) });
                    bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(aboveLine, 1), bracket.getEndPosition()) });
                }
            }
        }
    }
    exports.BracketSelectionRangeProvider = BracketSelectionRangeProvider;
    BracketSelectionRangeProvider._maxDuration = 30;
    BracketSelectionRangeProvider._maxRounds = 2;
});
//# __sourceMappingURL=bracketSelections.js.map