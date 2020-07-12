/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHostTypes", "vs/base/common/event", "vs/editor/common/viewModel/prefixSumComputer", "vs/base/common/lifecycle", "vs/editor/common/modes/languageSelector", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/resources", "vs/base/common/map", "vs/workbench/api/common/extHostDocumentData"], function (require, exports, types, event_1, prefixSumComputer_1, lifecycle_1, languageSelector_1, notebookCommon_1, resources_1, map_1, extHostDocumentData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookConcatDocument = void 0;
    class ExtHostNotebookConcatDocument {
        constructor(extHostNotebooks, extHostDocuments, _notebook, _selector) {
            this._notebook = _notebook;
            this._selector = _selector;
            this._disposables = new lifecycle_1.DisposableStore();
            this._isClosed = false;
            this._versionId = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.isUntitled = false;
            this.isDirty = false;
            this.uri = _notebook.uri.with({ scheme: 'vscode-notebook-concat-doc' });
            this.fileName = resources_1.basename(this.uri);
            this.languageId = this._createLanguageId();
            this._init();
            this._disposables.add(extHostDocuments.onDidChangeDocument(e => {
                const cellIdx = this._cellByUri.get(e.document.uri);
                if (typeof cellIdx === 'number') {
                    this._cellLengths.changeValue(cellIdx, this._cells[cellIdx].document.getText().length + 1);
                    this._cellLines.changeValue(cellIdx, this._cells[cellIdx].document.lineCount);
                    this._versionId += 1;
                    this._onDidChange.fire(undefined);
                }
            }));
            const documentChange = (document) => {
                if (document === this._notebook) {
                    this._init();
                    this._versionId += 1;
                    this._onDidChange.fire(undefined);
                }
            };
            this._disposables.add(extHostNotebooks.onDidChangeCellLanguage(e => documentChange(e.document)));
            this._disposables.add(extHostNotebooks.onDidChangeCellOutputs(e => documentChange(e.document)));
            this._disposables.add(extHostNotebooks.onDidChangeNotebookCells(e => documentChange(e.document)));
        }
        dispose() {
            this._disposables.dispose();
            this._isClosed = true;
        }
        get isClosed() {
            return this._isClosed;
        }
        _init() {
            this._cells = [];
            this._cellByUri = new map_1.ResourceMap();
            const cellLengths = [];
            const cellLineCounts = [];
            for (let cell of this._notebook.cells) {
                if (cell.cellKind === notebookCommon_1.CellKind.Code && (!this._selector || languageSelector_1.score(this._selector, cell.uri, cell.language, true))) {
                    this._cellByUri.set(cell.uri, this._cells.length);
                    this._cells.push(cell);
                    cellLengths.push(cell.document.getText().length + 1);
                    cellLineCounts.push(cell.document.lineCount);
                }
            }
            this._cellLengths = new prefixSumComputer_1.PrefixSumComputer(new Uint32Array(cellLengths));
            this._cellLines = new prefixSumComputer_1.PrefixSumComputer(new Uint32Array(cellLineCounts));
        }
        _createLanguageId() {
            const languageIds = new Set();
            (function fillInLanguageIds(selector) {
                if (Array.isArray(selector)) {
                    selector.forEach(fillInLanguageIds);
                }
                else if (typeof selector === 'string') {
                    languageIds.add(selector);
                }
                else if (selector === null || selector === void 0 ? void 0 : selector.language) {
                    languageIds.add(selector.language);
                }
            })(this._selector);
            if (languageIds.size === 0) {
                return 'unknown';
            }
            return [...languageIds.values()].sort().join(';');
        }
        save() {
            // todo@jrieken throw error instead?
            return Promise.resolve(false);
        }
        get eol() {
            return types.EndOfLine.LF;
        }
        get lineCount() {
            let total = 0;
            for (let cell of this._cells) {
                total += cell.document.lineCount;
            }
            return total;
        }
        lineAt(lineOrPosition) {
            const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
            const cellIdx = this._cellLines.getIndexOf(line);
            return new extHostDocumentData_1.ExtHostDocumentLine(line, this._cells[cellIdx.index].document.lineAt(cellIdx.remainder).text, line >= this.lineCount);
        }
        getWordRangeAtPosition(position, regex) {
            const cellIdx = this._cellLines.getIndexOf(position.line);
            return this._cells[cellIdx.index].document.getWordRangeAtPosition(position.with({ line: cellIdx.remainder }), regex);
        }
        validateRange(range) {
            const start = this.validatePosition(range.start);
            const end = this.validatePosition(range.end);
            return range.with({ start, end });
        }
        validatePosition(position) {
            const cellIdx = this._cellLines.getIndexOf(position.line);
            return this._cells[cellIdx.index].document.validatePosition(position.with({ line: cellIdx.remainder }));
        }
        get version() {
            return this._versionId;
        }
        getText(range) {
            var _a, _b;
            if (!range) {
                let result = '';
                for (let cell of this._cells) {
                    result += cell.document.getText() + '\n';
                }
                // remove last newline again
                result = result.slice(0, -1);
                return result;
            }
            if (range.isEmpty) {
                return '';
            }
            // get start and end locations and create substrings
            const start = this.locationAt(range.start);
            const end = this.locationAt(range.end);
            const startCell = this._cells[(_a = this._cellByUri.get(start.uri)) !== null && _a !== void 0 ? _a : -1];
            const endCell = this._cells[(_b = this._cellByUri.get(end.uri)) !== null && _b !== void 0 ? _b : -1];
            if (!startCell || !endCell) {
                return '';
            }
            else if (startCell === endCell) {
                return startCell.document.getText(new types.Range(start.range.start, end.range.end));
            }
            else {
                let a = startCell.document.getText(new types.Range(start.range.start, new types.Position(startCell.document.lineCount, 0)));
                let b = endCell.document.getText(new types.Range(new types.Position(0, 0), end.range.end));
                return a + '\n' + b;
            }
        }
        offsetAt(position) {
            const idx = this._cellLines.getIndexOf(position.line);
            const offset1 = this._cellLengths.getAccumulatedValue(idx.index - 1);
            const offset2 = this._cells[idx.index].document.offsetAt(position.with(idx.remainder));
            return offset1 + offset2;
        }
        positionAt(locationOrOffset) {
            if (typeof locationOrOffset === 'number') {
                const idx = this._cellLengths.getIndexOf(locationOrOffset);
                const lineCount = this._cellLines.getAccumulatedValue(idx.index - 1);
                return this._cells[idx.index].document.positionAt(idx.remainder).translate(lineCount);
            }
            const idx = this._cellByUri.get(locationOrOffset.uri);
            if (typeof idx === 'number') {
                let line = this._cellLines.getAccumulatedValue(idx - 1);
                return new types.Position(line + locationOrOffset.range.start.line, locationOrOffset.range.start.character);
            }
            // do better?
            // return undefined;
            return new types.Position(0, 0);
        }
        locationAt(positionOrRange) {
            if (!types.Range.isRange(positionOrRange)) {
                positionOrRange = new types.Range(positionOrRange, positionOrRange);
            }
            const startIdx = this._cellLines.getIndexOf(positionOrRange.start.line);
            let endIdx = startIdx;
            if (!positionOrRange.isEmpty) {
                endIdx = this._cellLines.getIndexOf(positionOrRange.end.line);
            }
            let startPos = new types.Position(startIdx.remainder, positionOrRange.start.character);
            let endPos = new types.Position(endIdx.remainder, positionOrRange.end.character);
            let range = new types.Range(startPos, endPos);
            const startCell = this._cells[startIdx.index];
            return new types.Location(startCell.uri, startCell.document.validateRange(range));
        }
    }
    exports.ExtHostNotebookConcatDocument = ExtHostNotebookConcatDocument;
});
//# __sourceMappingURL=extHostNotebookConcatDocument.js.map