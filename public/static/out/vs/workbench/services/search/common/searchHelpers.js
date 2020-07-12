/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/services/search/common/search"], function (require, exports, range_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addContextToEditorMatches = exports.editorMatchesToTextSearchResults = void 0;
    function editorMatchToTextSearchResult(matches, model, previewOptions) {
        const firstLine = matches[0].range.startLineNumber;
        const lastLine = matches[matches.length - 1].range.endLineNumber;
        const lineTexts = [];
        for (let i = firstLine; i <= lastLine; i++) {
            lineTexts.push(model.getLineContent(i));
        }
        return new search_1.TextSearchMatch(lineTexts.join('\n') + '\n', matches.map(m => new range_1.Range(m.range.startLineNumber - 1, m.range.startColumn - 1, m.range.endLineNumber - 1, m.range.endColumn - 1)), previewOptions);
    }
    /**
     * Combine a set of FindMatches into a set of TextSearchResults. They should be grouped by matches that start on the same line that the previous match ends on.
     */
    function editorMatchesToTextSearchResults(matches, model, previewOptions) {
        let previousEndLine = -1;
        const groupedMatches = [];
        let currentMatches = [];
        matches.forEach((match) => {
            if (match.range.startLineNumber !== previousEndLine) {
                currentMatches = [];
                groupedMatches.push(currentMatches);
            }
            currentMatches.push(match);
            previousEndLine = match.range.endLineNumber;
        });
        return groupedMatches.map(sameLineMatches => {
            return editorMatchToTextSearchResult(sameLineMatches, model, previewOptions);
        });
    }
    exports.editorMatchesToTextSearchResults = editorMatchesToTextSearchResults;
    function addContextToEditorMatches(matches, model, query) {
        const results = [];
        let prevLine = -1;
        for (let i = 0; i < matches.length; i++) {
            const { start: matchStartLine, end: matchEndLine } = getMatchStartEnd(matches[i]);
            if (typeof query.beforeContext === 'number' && query.beforeContext > 0) {
                const beforeContextStartLine = Math.max(prevLine + 1, matchStartLine - query.beforeContext);
                for (let b = beforeContextStartLine; b < matchStartLine; b++) {
                    results.push({
                        text: model.getLineContent(b + 1),
                        lineNumber: b
                    });
                }
            }
            results.push(matches[i]);
            const nextMatch = matches[i + 1];
            const nextMatchStartLine = nextMatch ? getMatchStartEnd(nextMatch).start : Number.MAX_VALUE;
            if (typeof query.afterContext === 'number' && query.afterContext > 0) {
                const afterContextToLine = Math.min(nextMatchStartLine - 1, matchEndLine + query.afterContext, model.getLineCount() - 1);
                for (let a = matchEndLine + 1; a <= afterContextToLine; a++) {
                    results.push({
                        text: model.getLineContent(a + 1),
                        lineNumber: a
                    });
                }
            }
            prevLine = matchEndLine;
        }
        return results;
    }
    exports.addContextToEditorMatches = addContextToEditorMatches;
    function getMatchStartEnd(match) {
        const matchRanges = match.ranges;
        const matchStartLine = Array.isArray(matchRanges) ? matchRanges[0].startLineNumber : matchRanges.startLineNumber;
        const matchEndLine = Array.isArray(matchRanges) ? matchRanges[matchRanges.length - 1].endLineNumber : matchRanges.endLineNumber;
        return {
            start: matchStartLine,
            end: matchEndLine
        };
    }
});
//# __sourceMappingURL=searchHelpers.js.map