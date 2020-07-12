/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/diff/diff", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/diff/diffComputer", "vs/editor/common/model/mirrorTextModel", "vs/editor/common/model/wordHelper", "vs/editor/common/modes/linkComputer", "vs/editor/common/modes/supports/inplaceReplaceSupport", "vs/editor/common/standalone/standaloneBase", "vs/base/common/types"], function (require, exports, arrays_1, diff_1, platform_1, uri_1, position_1, range_1, diffComputer_1, mirrorTextModel_1, wordHelper_1, linkComputer_1, inplaceReplaceSupport_1, standaloneBase_1, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = exports.EditorSimpleWorker = void 0;
    /**
     * @internal
     */
    class MirrorModel extends mirrorTextModel_1.MirrorTextModel {
        get uri() {
            return this._uri;
        }
        get version() {
            return this._versionId;
        }
        get eol() {
            return this._eol;
        }
        getValue() {
            return this.getText();
        }
        getLinesContent() {
            return this._lines.slice(0);
        }
        getLineCount() {
            return this._lines.length;
        }
        getLineContent(lineNumber) {
            return this._lines[lineNumber - 1];
        }
        getWordAtPosition(position, wordDefinition) {
            let wordAtText = wordHelper_1.getWordAtText(position.column, wordHelper_1.ensureValidWordDefinition(wordDefinition), this._lines[position.lineNumber - 1], 0);
            if (wordAtText) {
                return new range_1.Range(position.lineNumber, wordAtText.startColumn, position.lineNumber, wordAtText.endColumn);
            }
            return null;
        }
        getWordUntilPosition(position, wordDefinition) {
            const wordAtPosition = this.getWordAtPosition(position, wordDefinition);
            if (!wordAtPosition) {
                return {
                    word: '',
                    startColumn: position.column,
                    endColumn: position.column
                };
            }
            return {
                word: this._lines[position.lineNumber - 1].substring(wordAtPosition.startColumn - 1, position.column - 1),
                startColumn: wordAtPosition.startColumn,
                endColumn: position.column
            };
        }
        words(wordDefinition) {
            const lines = this._lines;
            const wordenize = this._wordenize.bind(this);
            let lineNumber = 0;
            let lineText = '';
            let wordRangesIdx = 0;
            let wordRanges = [];
            return {
                *[Symbol.iterator]() {
                    while (true) {
                        if (wordRangesIdx < wordRanges.length) {
                            const value = lineText.substring(wordRanges[wordRangesIdx].start, wordRanges[wordRangesIdx].end);
                            wordRangesIdx += 1;
                            yield value;
                        }
                        else {
                            if (lineNumber < lines.length) {
                                lineText = lines[lineNumber];
                                wordRanges = wordenize(lineText, wordDefinition);
                                wordRangesIdx = 0;
                                lineNumber += 1;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            };
        }
        getLineWords(lineNumber, wordDefinition) {
            let content = this._lines[lineNumber - 1];
            let ranges = this._wordenize(content, wordDefinition);
            let words = [];
            for (const range of ranges) {
                words.push({
                    word: content.substring(range.start, range.end),
                    startColumn: range.start + 1,
                    endColumn: range.end + 1
                });
            }
            return words;
        }
        _wordenize(content, wordDefinition) {
            const result = [];
            let match;
            wordDefinition.lastIndex = 0; // reset lastIndex just to be sure
            while (match = wordDefinition.exec(content)) {
                if (match[0].length === 0) {
                    // it did match the empty string
                    break;
                }
                result.push({ start: match.index, end: match.index + match[0].length });
            }
            return result;
        }
        getValueInRange(range) {
            range = this._validateRange(range);
            if (range.startLineNumber === range.endLineNumber) {
                return this._lines[range.startLineNumber - 1].substring(range.startColumn - 1, range.endColumn - 1);
            }
            let lineEnding = this._eol;
            let startLineIndex = range.startLineNumber - 1;
            let endLineIndex = range.endLineNumber - 1;
            let resultLines = [];
            resultLines.push(this._lines[startLineIndex].substring(range.startColumn - 1));
            for (let i = startLineIndex + 1; i < endLineIndex; i++) {
                resultLines.push(this._lines[i]);
            }
            resultLines.push(this._lines[endLineIndex].substring(0, range.endColumn - 1));
            return resultLines.join(lineEnding);
        }
        offsetAt(position) {
            position = this._validatePosition(position);
            this._ensureLineStarts();
            return this._lineStarts.getAccumulatedValue(position.lineNumber - 2) + (position.column - 1);
        }
        positionAt(offset) {
            offset = Math.floor(offset);
            offset = Math.max(0, offset);
            this._ensureLineStarts();
            let out = this._lineStarts.getIndexOf(offset);
            let lineLength = this._lines[out.index].length;
            // Ensure we return a valid position
            return {
                lineNumber: 1 + out.index,
                column: 1 + Math.min(out.remainder, lineLength)
            };
        }
        _validateRange(range) {
            const start = this._validatePosition({ lineNumber: range.startLineNumber, column: range.startColumn });
            const end = this._validatePosition({ lineNumber: range.endLineNumber, column: range.endColumn });
            if (start.lineNumber !== range.startLineNumber
                || start.column !== range.startColumn
                || end.lineNumber !== range.endLineNumber
                || end.column !== range.endColumn) {
                return {
                    startLineNumber: start.lineNumber,
                    startColumn: start.column,
                    endLineNumber: end.lineNumber,
                    endColumn: end.column
                };
            }
            return range;
        }
        _validatePosition(position) {
            if (!position_1.Position.isIPosition(position)) {
                throw new Error('bad position');
            }
            let { lineNumber, column } = position;
            let hasChanged = false;
            if (lineNumber < 1) {
                lineNumber = 1;
                column = 1;
                hasChanged = true;
            }
            else if (lineNumber > this._lines.length) {
                lineNumber = this._lines.length;
                column = this._lines[lineNumber - 1].length + 1;
                hasChanged = true;
            }
            else {
                let maxCharacter = this._lines[lineNumber - 1].length + 1;
                if (column < 1) {
                    column = 1;
                    hasChanged = true;
                }
                else if (column > maxCharacter) {
                    column = maxCharacter;
                    hasChanged = true;
                }
            }
            if (!hasChanged) {
                return position;
            }
            else {
                return { lineNumber, column };
            }
        }
    }
    /**
     * @internal
     */
    class EditorSimpleWorker {
        constructor(host, foreignModuleFactory) {
            this._host = host;
            this._models = Object.create(null);
            this._foreignModuleFactory = foreignModuleFactory;
            this._foreignModule = null;
        }
        dispose() {
            this._models = Object.create(null);
        }
        _getModel(uri) {
            return this._models[uri];
        }
        _getModels() {
            let all = [];
            Object.keys(this._models).forEach((key) => all.push(this._models[key]));
            return all;
        }
        acceptNewModel(data) {
            this._models[data.url] = new MirrorModel(uri_1.URI.parse(data.url), data.lines, data.EOL, data.versionId);
        }
        acceptModelChanged(strURL, e) {
            if (!this._models[strURL]) {
                return;
            }
            let model = this._models[strURL];
            model.onEvents(e);
        }
        acceptRemovedModel(strURL) {
            if (!this._models[strURL]) {
                return;
            }
            delete this._models[strURL];
        }
        // ---- BEGIN diff --------------------------------------------------------------------------
        async computeDiff(originalUrl, modifiedUrl, ignoreTrimWhitespace, maxComputationTime) {
            const original = this._getModel(originalUrl);
            const modified = this._getModel(modifiedUrl);
            if (!original || !modified) {
                return null;
            }
            const originalLines = original.getLinesContent();
            const modifiedLines = modified.getLinesContent();
            const diffComputer = new diffComputer_1.DiffComputer(originalLines, modifiedLines, {
                shouldComputeCharChanges: true,
                shouldPostProcessCharChanges: true,
                shouldIgnoreTrimWhitespace: ignoreTrimWhitespace,
                shouldMakePrettyDiff: true,
                maxComputationTime: maxComputationTime
            });
            const diffResult = diffComputer.computeDiff();
            const identical = (diffResult.changes.length > 0 ? false : this._modelsAreIdentical(original, modified));
            return {
                quitEarly: diffResult.quitEarly,
                identical: identical,
                changes: diffResult.changes
            };
        }
        _modelsAreIdentical(original, modified) {
            const originalLineCount = original.getLineCount();
            const modifiedLineCount = modified.getLineCount();
            if (originalLineCount !== modifiedLineCount) {
                return false;
            }
            for (let line = 1; line <= originalLineCount; line++) {
                const originalLine = original.getLineContent(line);
                const modifiedLine = modified.getLineContent(line);
                if (originalLine !== modifiedLine) {
                    return false;
                }
            }
            return true;
        }
        async computeDirtyDiff(originalUrl, modifiedUrl, ignoreTrimWhitespace) {
            let original = this._getModel(originalUrl);
            let modified = this._getModel(modifiedUrl);
            if (!original || !modified) {
                return null;
            }
            let originalLines = original.getLinesContent();
            let modifiedLines = modified.getLinesContent();
            let diffComputer = new diffComputer_1.DiffComputer(originalLines, modifiedLines, {
                shouldComputeCharChanges: false,
                shouldPostProcessCharChanges: false,
                shouldIgnoreTrimWhitespace: ignoreTrimWhitespace,
                shouldMakePrettyDiff: true,
                maxComputationTime: 1000
            });
            return diffComputer.computeDiff().changes;
        }
        async computeMoreMinimalEdits(modelUrl, edits) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return edits;
            }
            const result = [];
            let lastEol = undefined;
            edits = arrays_1.mergeSort(edits, (a, b) => {
                if (a.range && b.range) {
                    return range_1.Range.compareRangesUsingStarts(a.range, b.range);
                }
                // eol only changes should go to the end
                let aRng = a.range ? 0 : 1;
                let bRng = b.range ? 0 : 1;
                return aRng - bRng;
            });
            for (let { range, text, eol } of edits) {
                if (typeof eol === 'number') {
                    lastEol = eol;
                }
                if (range_1.Range.isEmpty(range) && !text) {
                    // empty change
                    continue;
                }
                const original = model.getValueInRange(range);
                text = text.replace(/\r\n|\n|\r/g, model.eol);
                if (original === text) {
                    // noop
                    continue;
                }
                // make sure diff won't take too long
                if (Math.max(text.length, original.length) > EditorSimpleWorker._diffLimit) {
                    result.push({ range, text });
                    continue;
                }
                // compute diff between original and edit.text
                const changes = diff_1.stringDiff(original, text, false);
                const editOffset = model.offsetAt(range_1.Range.lift(range).getStartPosition());
                for (const change of changes) {
                    const start = model.positionAt(editOffset + change.originalStart);
                    const end = model.positionAt(editOffset + change.originalStart + change.originalLength);
                    const newEdit = {
                        text: text.substr(change.modifiedStart, change.modifiedLength),
                        range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column }
                    };
                    if (model.getValueInRange(newEdit.range) !== newEdit.text) {
                        result.push(newEdit);
                    }
                }
            }
            if (typeof lastEol === 'number') {
                result.push({ eol: lastEol, text: '', range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 } });
            }
            return result;
        }
        // ---- END minimal edits ---------------------------------------------------------------
        async computeLinks(modelUrl) {
            let model = this._getModel(modelUrl);
            if (!model) {
                return null;
            }
            return linkComputer_1.computeLinks(model);
        }
        async textualSuggest(modelUrl, position, wordDef, wordDefFlags) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return null;
            }
            const words = [];
            const seen = new Set();
            const wordDefRegExp = new RegExp(wordDef, wordDefFlags);
            const wordAt = model.getWordAtPosition(position, wordDefRegExp);
            if (wordAt) {
                seen.add(model.getValueInRange(wordAt));
            }
            for (let word of model.words(wordDefRegExp)) {
                if (seen.has(word)) {
                    continue;
                }
                seen.add(word);
                if (!isNaN(Number(word))) {
                    continue;
                }
                words.push(word);
                if (seen.size > EditorSimpleWorker._suggestionsLimit) {
                    break;
                }
            }
            return words;
        }
        // ---- END suggest --------------------------------------------------------------------------
        //#region -- word ranges --
        async computeWordRanges(modelUrl, range, wordDef, wordDefFlags) {
            let model = this._getModel(modelUrl);
            if (!model) {
                return Object.create(null);
            }
            const wordDefRegExp = new RegExp(wordDef, wordDefFlags);
            const result = Object.create(null);
            for (let line = range.startLineNumber; line < range.endLineNumber; line++) {
                let words = model.getLineWords(line, wordDefRegExp);
                for (const word of words) {
                    if (!isNaN(Number(word.word))) {
                        continue;
                    }
                    let array = result[word.word];
                    if (!array) {
                        array = [];
                        result[word.word] = array;
                    }
                    array.push({
                        startLineNumber: line,
                        startColumn: word.startColumn,
                        endLineNumber: line,
                        endColumn: word.endColumn
                    });
                }
            }
            return result;
        }
        //#endregion
        async navigateValueSet(modelUrl, range, up, wordDef, wordDefFlags) {
            let model = this._getModel(modelUrl);
            if (!model) {
                return null;
            }
            let wordDefRegExp = new RegExp(wordDef, wordDefFlags);
            if (range.startColumn === range.endColumn) {
                range = {
                    startLineNumber: range.startLineNumber,
                    startColumn: range.startColumn,
                    endLineNumber: range.endLineNumber,
                    endColumn: range.endColumn + 1
                };
            }
            let selectionText = model.getValueInRange(range);
            let wordRange = model.getWordAtPosition({ lineNumber: range.startLineNumber, column: range.startColumn }, wordDefRegExp);
            if (!wordRange) {
                return null;
            }
            let word = model.getValueInRange(wordRange);
            let result = inplaceReplaceSupport_1.BasicInplaceReplace.INSTANCE.navigateValueSet(range, selectionText, wordRange, word, up);
            return result;
        }
        // ---- BEGIN foreign module support --------------------------------------------------------------------------
        loadForeignModule(moduleId, createData, foreignHostMethods) {
            const proxyMethodRequest = (method, args) => {
                return this._host.fhr(method, args);
            };
            const foreignHost = types.createProxyObject(foreignHostMethods, proxyMethodRequest);
            let ctx = {
                host: foreignHost,
                getMirrorModels: () => {
                    return this._getModels();
                }
            };
            if (this._foreignModuleFactory) {
                this._foreignModule = this._foreignModuleFactory(ctx, createData);
                // static foreing module
                return Promise.resolve(types.getAllMethodNames(this._foreignModule));
            }
            // ESM-comment-begin
            return new Promise((resolve, reject) => {
                require([moduleId], (foreignModule) => {
                    this._foreignModule = foreignModule.create(ctx, createData);
                    resolve(types.getAllMethodNames(this._foreignModule));
                }, reject);
            });
            // ESM-comment-end
            // ESM-uncomment-begin
            // return Promise.reject(new Error(`Unexpected usage`));
            // ESM-uncomment-end
        }
        // foreign method request
        fmr(method, args) {
            if (!this._foreignModule || typeof this._foreignModule[method] !== 'function') {
                return Promise.reject(new Error('Missing requestHandler or method: ' + method));
            }
            try {
                return Promise.resolve(this._foreignModule[method].apply(this._foreignModule, args));
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
    }
    exports.EditorSimpleWorker = EditorSimpleWorker;
    // ---- END diff --------------------------------------------------------------------------
    // ---- BEGIN minimal edits ---------------------------------------------------------------
    EditorSimpleWorker._diffLimit = 100000;
    // ---- BEGIN suggest --------------------------------------------------------------------------
    EditorSimpleWorker._suggestionsLimit = 10000;
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new EditorSimpleWorker(host, null);
    }
    exports.create = create;
    if (typeof importScripts === 'function') {
        // Running in a web worker
        platform_1.globals.monaco = standaloneBase_1.createMonacoBaseAPI();
    }
});
//# __sourceMappingURL=editorSimpleWorker.js.map