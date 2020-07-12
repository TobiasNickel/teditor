/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/textfile/common/textfiles", "vs/css!./media/searchEditor"], function (require, exports, arrays_1, strings_1, range_1, nls_1, searchModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSavedSearchEditor = exports.serializeSearchResultForEditor = exports.extractSearchQueryFromLines = exports.defaultSearchConfig = exports.extractSearchQueryFromModel = exports.serializeSearchConfiguration = void 0;
    // Using \r\n on Windows inserts an extra newline between results.
    const lineDelimiter = '\n';
    const translateRangeLines = (n) => (range) => new range_1.Range(range.startLineNumber + n, range.startColumn, range.endLineNumber + n, range.endColumn);
    const matchToSearchResultFormat = (match, longestLineNumber) => {
        const getLinePrefix = (i) => `${match.range().startLineNumber + i}`;
        const fullMatchLines = match.fullPreviewLines();
        const results = [];
        fullMatchLines
            .forEach((sourceLine, i) => {
            const lineNumber = getLinePrefix(i);
            const paddingStr = strings_1.repeat(' ', longestLineNumber - lineNumber.length);
            const prefix = `  ${paddingStr}${lineNumber}: `;
            const prefixOffset = prefix.length;
            const line = (prefix + sourceLine).replace(/\r?\n?$/, '');
            const rangeOnThisLine = ({ start, end }) => new range_1.Range(1, (start !== null && start !== void 0 ? start : 1) + prefixOffset, 1, (end !== null && end !== void 0 ? end : sourceLine.length + 1) + prefixOffset);
            const matchRange = match.rangeInPreview();
            const matchIsSingleLine = matchRange.startLineNumber === matchRange.endLineNumber;
            let lineRange;
            if (matchIsSingleLine) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn, end: matchRange.endColumn }));
            }
            else if (i === 0) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn }));
            }
            else if (i === fullMatchLines.length - 1) {
                lineRange = (rangeOnThisLine({ end: matchRange.endColumn }));
            }
            else {
                lineRange = (rangeOnThisLine({}));
            }
            results.push({ lineNumber: lineNumber, line, ranges: [lineRange] });
        });
        return results;
    };
    function fileMatchToSearchResultFormat(fileMatch, labelFormatter) {
        const sortedMatches = fileMatch.matches().sort(searchModel_1.searchMatchComparer);
        const longestLineNumber = sortedMatches[sortedMatches.length - 1].range().endLineNumber.toString().length;
        const serializedMatches = arrays_1.flatten(sortedMatches.map(match => matchToSearchResultFormat(match, longestLineNumber)));
        const uriString = labelFormatter(fileMatch.resource);
        let text = [`${uriString}:`];
        let matchRanges = [];
        const targetLineNumberToOffset = {};
        const context = [];
        fileMatch.context.forEach((line, lineNumber) => context.push({ line, lineNumber }));
        context.sort((a, b) => a.lineNumber - b.lineNumber);
        let lastLine = undefined;
        const seenLines = new Set();
        serializedMatches.forEach(match => {
            if (!seenLines.has(match.line)) {
                while (context.length && context[0].lineNumber < +match.lineNumber) {
                    const { line, lineNumber } = context.shift();
                    if (lastLine !== undefined && lineNumber !== lastLine + 1) {
                        text.push('');
                    }
                    text.push(`  ${strings_1.repeat(' ', longestLineNumber - `${lineNumber}`.length)}${lineNumber}  ${line}`);
                    lastLine = lineNumber;
                }
                targetLineNumberToOffset[match.lineNumber] = text.length;
                seenLines.add(match.line);
                text.push(match.line);
                lastLine = +match.lineNumber;
            }
            matchRanges.push(...match.ranges.map(translateRangeLines(targetLineNumberToOffset[match.lineNumber])));
        });
        while (context.length) {
            const { line, lineNumber } = context.shift();
            text.push(`  ${lineNumber}  ${line}`);
        }
        return { text, matchRanges };
    }
    const contentPatternToSearchConfiguration = (pattern, includes, excludes, contextLines) => {
        return {
            query: pattern.contentPattern.pattern,
            regexp: !!pattern.contentPattern.isRegExp,
            caseSensitive: !!pattern.contentPattern.isCaseSensitive,
            wholeWord: !!pattern.contentPattern.isWordMatch,
            excludes, includes,
            showIncludesExcludes: !!(includes || excludes || (pattern === null || pattern === void 0 ? void 0 : pattern.userDisabledExcludesAndIgnoreFiles)),
            useIgnores: ((pattern === null || pattern === void 0 ? void 0 : pattern.userDisabledExcludesAndIgnoreFiles) === undefined ? true : !pattern.userDisabledExcludesAndIgnoreFiles),
            contextLines,
        };
    };
    exports.serializeSearchConfiguration = (config) => {
        var _a;
        const removeNullFalseAndUndefined = (a) => a.filter(a => a !== false && a !== null && a !== undefined);
        const escapeNewlines = (str) => str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
        return removeNullFalseAndUndefined([
            `# Query: ${escapeNewlines((_a = config.query) !== null && _a !== void 0 ? _a : '')}`,
            (config.caseSensitive || config.wholeWord || config.regexp || config.useIgnores === false)
                && `# Flags: ${arrays_1.coalesce([
                    config.caseSensitive && 'CaseSensitive',
                    config.wholeWord && 'WordMatch',
                    config.regexp && 'RegExp',
                    (config.useIgnores === false) && 'IgnoreExcludeSettings'
                ]).join(' ')}`,
            config.includes ? `# Including: ${config.includes}` : undefined,
            config.excludes ? `# Excluding: ${config.excludes}` : undefined,
            config.contextLines ? `# ContextLines: ${config.contextLines}` : undefined,
            ''
        ]).join(lineDelimiter);
    };
    exports.extractSearchQueryFromModel = (model) => exports.extractSearchQueryFromLines(model.getValueInRange(new range_1.Range(1, 1, 6, 1)).split(lineDelimiter));
    exports.defaultSearchConfig = () => ({
        query: '',
        includes: '',
        excludes: '',
        regexp: false,
        caseSensitive: false,
        useIgnores: true,
        wholeWord: false,
        contextLines: 0,
        showIncludesExcludes: false,
    });
    exports.extractSearchQueryFromLines = (lines) => {
        const query = exports.defaultSearchConfig();
        const unescapeNewlines = (str) => {
            let out = '';
            for (let i = 0; i < str.length; i++) {
                if (str[i] === '\\') {
                    i++;
                    const escaped = str[i];
                    if (escaped === 'n') {
                        out += '\n';
                    }
                    else if (escaped === '\\') {
                        out += '\\';
                    }
                    else {
                        throw Error(nls_1.localize('invalidQueryStringError', "All backslashes in Query string must be escaped (\\\\)"));
                    }
                }
                else {
                    out += str[i];
                }
            }
            return out;
        };
        const parseYML = /^# ([^:]*): (.*)$/;
        for (const line of lines) {
            const parsed = parseYML.exec(line);
            if (!parsed) {
                continue;
            }
            const [, key, value] = parsed;
            switch (key) {
                case 'Query':
                    query.query = unescapeNewlines(value);
                    break;
                case 'Including':
                    query.includes = value;
                    break;
                case 'Excluding':
                    query.excludes = value;
                    break;
                case 'ContextLines':
                    query.contextLines = +value;
                    break;
                case 'Flags': {
                    query.regexp = value.indexOf('RegExp') !== -1;
                    query.caseSensitive = value.indexOf('CaseSensitive') !== -1;
                    query.useIgnores = value.indexOf('IgnoreExcludeSettings') === -1;
                    query.wholeWord = value.indexOf('WordMatch') !== -1;
                }
            }
        }
        query.showIncludesExcludes = !!(query.includes || query.excludes || !query.useIgnores);
        return query;
    };
    exports.serializeSearchResultForEditor = (searchResult, rawIncludePattern, rawExcludePattern, contextLines, labelFormatter) => {
        if (!searchResult.query) {
            throw Error('Internal Error: Expected query, got null');
        }
        const config = contentPatternToSearchConfiguration(searchResult.query, rawIncludePattern, rawExcludePattern, contextLines);
        const filecount = searchResult.fileCount() > 1 ? nls_1.localize('numFiles', "{0} files", searchResult.fileCount()) : nls_1.localize('oneFile', "1 file");
        const resultcount = searchResult.count() > 1 ? nls_1.localize('numResults', "{0} results", searchResult.count()) : nls_1.localize('oneResult', "1 result");
        const info = [
            searchResult.count()
                ? `${resultcount} - ${filecount}`
                : nls_1.localize('noResults', "No Results"),
            ''
        ];
        const allResults = flattenSearchResultSerializations(arrays_1.flatten(searchResult.folderMatches().sort(searchModel_1.searchMatchComparer)
            .map(folderMatch => folderMatch.matches().sort(searchModel_1.searchMatchComparer)
            .map(fileMatch => fileMatchToSearchResultFormat(fileMatch, labelFormatter)))));
        return {
            matchRanges: allResults.matchRanges.map(translateRangeLines(info.length)),
            text: info.concat(allResults.text).join(lineDelimiter),
            config
        };
    };
    const flattenSearchResultSerializations = (serializations) => {
        let text = [];
        let matchRanges = [];
        serializations.forEach(serialized => {
            serialized.matchRanges.map(translateRangeLines(text.length)).forEach(range => matchRanges.push(range));
            serialized.text.forEach(line => text.push(line));
            text.push(''); // new line
        });
        return { text, matchRanges };
    };
    exports.parseSavedSearchEditor = async (accessor, resource) => {
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const text = (await textFileService.read(resource)).value;
        const headerlines = [];
        const bodylines = [];
        let inHeader = true;
        for (const line of text.split(/\r?\n/g)) {
            if (inHeader) {
                headerlines.push(line);
                if (line === '') {
                    inHeader = false;
                }
            }
            else {
                bodylines.push(line);
            }
        }
        return { config: exports.extractSearchQueryFromLines(headerlines), text: bodylines.join('\n') };
    };
});
//# __sourceMappingURL=searchEditorSerialization.js.map