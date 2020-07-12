/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/base/common/idGenerator", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, assert_1, errors_1, idGenerator_1, TypeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTextEditor = exports.ExtHostTextEditorOptions = exports.TextEditorEdit = exports.TextEditorDecorationType = void 0;
    class TextEditorDecorationType {
        constructor(proxy, options) {
            this.key = TextEditorDecorationType._Keys.nextId();
            this._proxy = proxy;
            this._proxy.$registerTextEditorDecorationType(this.key, TypeConverters.DecorationRenderOptions.from(options));
        }
        dispose() {
            this._proxy.$removeTextEditorDecorationType(this.key);
        }
    }
    exports.TextEditorDecorationType = TextEditorDecorationType;
    TextEditorDecorationType._Keys = new idGenerator_1.IdGenerator('TextEditorDecorationType');
    class TextEditorEdit {
        constructor(document, options) {
            this._collectedEdits = [];
            this._setEndOfLine = undefined;
            this._finalized = false;
            this._document = document;
            this._documentVersionId = document.version;
            this._undoStopBefore = options.undoStopBefore;
            this._undoStopAfter = options.undoStopAfter;
        }
        finalize() {
            this._finalized = true;
            return {
                documentVersionId: this._documentVersionId,
                edits: this._collectedEdits,
                setEndOfLine: this._setEndOfLine,
                undoStopBefore: this._undoStopBefore,
                undoStopAfter: this._undoStopAfter
            };
        }
        _throwIfFinalized() {
            if (this._finalized) {
                throw new Error('Edit is only valid while callback runs');
            }
        }
        replace(location, value) {
            this._throwIfFinalized();
            let range = null;
            if (location instanceof extHostTypes_1.Position) {
                range = new extHostTypes_1.Range(location, location);
            }
            else if (location instanceof extHostTypes_1.Range) {
                range = location;
            }
            else {
                throw new Error('Unrecognized location');
            }
            this._pushEdit(range, value, false);
        }
        insert(location, value) {
            this._throwIfFinalized();
            this._pushEdit(new extHostTypes_1.Range(location, location), value, true);
        }
        delete(location) {
            this._throwIfFinalized();
            let range = null;
            if (location instanceof extHostTypes_1.Range) {
                range = location;
            }
            else {
                throw new Error('Unrecognized location');
            }
            this._pushEdit(range, null, true);
        }
        _pushEdit(range, text, forceMoveMarkers) {
            const validRange = this._document.validateRange(range);
            this._collectedEdits.push({
                range: validRange,
                text: text,
                forceMoveMarkers: forceMoveMarkers
            });
        }
        setEndOfLine(endOfLine) {
            this._throwIfFinalized();
            if (endOfLine !== extHostTypes_1.EndOfLine.LF && endOfLine !== extHostTypes_1.EndOfLine.CRLF) {
                throw errors_1.illegalArgument('endOfLine');
            }
            this._setEndOfLine = endOfLine;
        }
    }
    exports.TextEditorEdit = TextEditorEdit;
    class ExtHostTextEditorOptions {
        constructor(proxy, id, source, logService) {
            this._proxy = proxy;
            this._id = id;
            this._accept(source);
            this._logService = logService;
        }
        _accept(source) {
            this._tabSize = source.tabSize;
            this._indentSize = source.indentSize;
            this._insertSpaces = source.insertSpaces;
            this._cursorStyle = source.cursorStyle;
            this._lineNumbers = TypeConverters.TextEditorLineNumbersStyle.to(source.lineNumbers);
        }
        get tabSize() {
            return this._tabSize;
        }
        _validateTabSize(value) {
            if (value === 'auto') {
                return 'auto';
            }
            if (typeof value === 'number') {
                const r = Math.floor(value);
                return (r > 0 ? r : null);
            }
            if (typeof value === 'string') {
                const r = parseInt(value, 10);
                if (isNaN(r)) {
                    return null;
                }
                return (r > 0 ? r : null);
            }
            return null;
        }
        set tabSize(value) {
            const tabSize = this._validateTabSize(value);
            if (tabSize === null) {
                // ignore invalid call
                return;
            }
            if (typeof tabSize === 'number') {
                if (this._tabSize === tabSize) {
                    // nothing to do
                    return;
                }
                // reflect the new tabSize value immediately
                this._tabSize = tabSize;
            }
            this._warnOnError(this._proxy.$trySetOptions(this._id, {
                tabSize: tabSize
            }));
        }
        get indentSize() {
            return this._indentSize;
        }
        _validateIndentSize(value) {
            if (value === 'tabSize') {
                return 'tabSize';
            }
            if (typeof value === 'number') {
                const r = Math.floor(value);
                return (r > 0 ? r : null);
            }
            if (typeof value === 'string') {
                const r = parseInt(value, 10);
                if (isNaN(r)) {
                    return null;
                }
                return (r > 0 ? r : null);
            }
            return null;
        }
        set indentSize(value) {
            const indentSize = this._validateIndentSize(value);
            if (indentSize === null) {
                // ignore invalid call
                return;
            }
            if (typeof indentSize === 'number') {
                if (this._indentSize === indentSize) {
                    // nothing to do
                    return;
                }
                // reflect the new indentSize value immediately
                this._indentSize = indentSize;
            }
            this._warnOnError(this._proxy.$trySetOptions(this._id, {
                indentSize: indentSize
            }));
        }
        get insertSpaces() {
            return this._insertSpaces;
        }
        _validateInsertSpaces(value) {
            if (value === 'auto') {
                return 'auto';
            }
            return (value === 'false' ? false : Boolean(value));
        }
        set insertSpaces(value) {
            const insertSpaces = this._validateInsertSpaces(value);
            if (typeof insertSpaces === 'boolean') {
                if (this._insertSpaces === insertSpaces) {
                    // nothing to do
                    return;
                }
                // reflect the new insertSpaces value immediately
                this._insertSpaces = insertSpaces;
            }
            this._warnOnError(this._proxy.$trySetOptions(this._id, {
                insertSpaces: insertSpaces
            }));
        }
        get cursorStyle() {
            return this._cursorStyle;
        }
        set cursorStyle(value) {
            if (this._cursorStyle === value) {
                // nothing to do
                return;
            }
            this._cursorStyle = value;
            this._warnOnError(this._proxy.$trySetOptions(this._id, {
                cursorStyle: value
            }));
        }
        get lineNumbers() {
            return this._lineNumbers;
        }
        set lineNumbers(value) {
            if (this._lineNumbers === value) {
                // nothing to do
                return;
            }
            this._lineNumbers = value;
            this._warnOnError(this._proxy.$trySetOptions(this._id, {
                lineNumbers: TypeConverters.TextEditorLineNumbersStyle.from(value)
            }));
        }
        assign(newOptions) {
            const bulkConfigurationUpdate = {};
            let hasUpdate = false;
            if (typeof newOptions.tabSize !== 'undefined') {
                const tabSize = this._validateTabSize(newOptions.tabSize);
                if (tabSize === 'auto') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.tabSize = tabSize;
                }
                else if (typeof tabSize === 'number' && this._tabSize !== tabSize) {
                    // reflect the new tabSize value immediately
                    this._tabSize = tabSize;
                    hasUpdate = true;
                    bulkConfigurationUpdate.tabSize = tabSize;
                }
            }
            // if (typeof newOptions.indentSize !== 'undefined') {
            // 	const indentSize = this._validateIndentSize(newOptions.indentSize);
            // 	if (indentSize === 'tabSize') {
            // 		hasUpdate = true;
            // 		bulkConfigurationUpdate.indentSize = indentSize;
            // 	} else if (typeof indentSize === 'number' && this._indentSize !== indentSize) {
            // 		// reflect the new indentSize value immediately
            // 		this._indentSize = indentSize;
            // 		hasUpdate = true;
            // 		bulkConfigurationUpdate.indentSize = indentSize;
            // 	}
            // }
            if (typeof newOptions.insertSpaces !== 'undefined') {
                const insertSpaces = this._validateInsertSpaces(newOptions.insertSpaces);
                if (insertSpaces === 'auto') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.insertSpaces = insertSpaces;
                }
                else if (this._insertSpaces !== insertSpaces) {
                    // reflect the new insertSpaces value immediately
                    this._insertSpaces = insertSpaces;
                    hasUpdate = true;
                    bulkConfigurationUpdate.insertSpaces = insertSpaces;
                }
            }
            if (typeof newOptions.cursorStyle !== 'undefined') {
                if (this._cursorStyle !== newOptions.cursorStyle) {
                    this._cursorStyle = newOptions.cursorStyle;
                    hasUpdate = true;
                    bulkConfigurationUpdate.cursorStyle = newOptions.cursorStyle;
                }
            }
            if (typeof newOptions.lineNumbers !== 'undefined') {
                if (this._lineNumbers !== newOptions.lineNumbers) {
                    this._lineNumbers = newOptions.lineNumbers;
                    hasUpdate = true;
                    bulkConfigurationUpdate.lineNumbers = TypeConverters.TextEditorLineNumbersStyle.from(newOptions.lineNumbers);
                }
            }
            if (hasUpdate) {
                this._warnOnError(this._proxy.$trySetOptions(this._id, bulkConfigurationUpdate));
            }
        }
        _warnOnError(promise) {
            promise.catch(err => this._logService.warn(err));
        }
    }
    exports.ExtHostTextEditorOptions = ExtHostTextEditorOptions;
    class ExtHostTextEditor {
        constructor(id, _proxy, _logService, document, selections, options, visibleRanges, viewColumn) {
            this.id = id;
            this._proxy = _proxy;
            this._logService = _logService;
            this._disposed = false;
            this._documentData = document;
            this._selections = selections;
            this._options = new ExtHostTextEditorOptions(this._proxy, this.id, options, _logService);
            this._visibleRanges = visibleRanges;
            this._viewColumn = viewColumn;
            this._hasDecorationsForKey = Object.create(null);
        }
        dispose() {
            assert_1.ok(!this._disposed);
            this._disposed = true;
        }
        show(column) {
            this._proxy.$tryShowEditor(this.id, TypeConverters.ViewColumn.from(column));
        }
        hide() {
            this._proxy.$tryHideEditor(this.id);
        }
        // ---- the document
        get document() {
            return this._documentData.document;
        }
        set document(value) {
            throw errors_1.readonly('document');
        }
        // ---- options
        get options() {
            return this._options;
        }
        set options(value) {
            if (!this._disposed) {
                this._options.assign(value);
            }
        }
        _acceptOptions(options) {
            assert_1.ok(!this._disposed);
            this._options._accept(options);
        }
        // ---- visible ranges
        get visibleRanges() {
            return this._visibleRanges;
        }
        set visibleRanges(value) {
            throw errors_1.readonly('visibleRanges');
        }
        _acceptVisibleRanges(value) {
            assert_1.ok(!this._disposed);
            this._visibleRanges = value;
        }
        // ---- view column
        get viewColumn() {
            return this._viewColumn;
        }
        set viewColumn(value) {
            throw errors_1.readonly('viewColumn');
        }
        _acceptViewColumn(value) {
            assert_1.ok(!this._disposed);
            this._viewColumn = value;
        }
        // ---- selections
        get selection() {
            return this._selections && this._selections[0];
        }
        set selection(value) {
            if (!(value instanceof extHostTypes_1.Selection)) {
                throw errors_1.illegalArgument('selection');
            }
            this._selections = [value];
            this._trySetSelection();
        }
        get selections() {
            return this._selections;
        }
        set selections(value) {
            if (!Array.isArray(value) || value.some(a => !(a instanceof extHostTypes_1.Selection))) {
                throw errors_1.illegalArgument('selections');
            }
            this._selections = value;
            this._trySetSelection();
        }
        setDecorations(decorationType, ranges) {
            const willBeEmpty = (ranges.length === 0);
            if (willBeEmpty && !this._hasDecorationsForKey[decorationType.key]) {
                // avoid no-op call to the renderer
                return;
            }
            if (willBeEmpty) {
                delete this._hasDecorationsForKey[decorationType.key];
            }
            else {
                this._hasDecorationsForKey[decorationType.key] = true;
            }
            this._runOnProxy(() => {
                if (TypeConverters.isDecorationOptionsArr(ranges)) {
                    return this._proxy.$trySetDecorations(this.id, decorationType.key, TypeConverters.fromRangeOrRangeWithMessage(ranges));
                }
                else {
                    const _ranges = new Array(4 * ranges.length);
                    for (let i = 0, len = ranges.length; i < len; i++) {
                        const range = ranges[i];
                        _ranges[4 * i] = range.start.line + 1;
                        _ranges[4 * i + 1] = range.start.character + 1;
                        _ranges[4 * i + 2] = range.end.line + 1;
                        _ranges[4 * i + 3] = range.end.character + 1;
                    }
                    return this._proxy.$trySetDecorationsFast(this.id, decorationType.key, _ranges);
                }
            });
        }
        revealRange(range, revealType) {
            this._runOnProxy(() => this._proxy.$tryRevealRange(this.id, TypeConverters.Range.from(range), (revealType || extHostTypes_1.TextEditorRevealType.Default)));
        }
        _trySetSelection() {
            const selection = this._selections.map(TypeConverters.Selection.from);
            return this._runOnProxy(() => this._proxy.$trySetSelections(this.id, selection));
        }
        _acceptSelections(selections) {
            assert_1.ok(!this._disposed);
            this._selections = selections;
        }
        // ---- editing
        edit(callback, options = { undoStopBefore: true, undoStopAfter: true }) {
            if (this._disposed) {
                return Promise.reject(new Error('TextEditor#edit not possible on closed editors'));
            }
            const edit = new TextEditorEdit(this._documentData.document, options);
            callback(edit);
            return this._applyEdit(edit);
        }
        _applyEdit(editBuilder) {
            const editData = editBuilder.finalize();
            // return when there is nothing to do
            if (editData.edits.length === 0 && !editData.setEndOfLine) {
                return Promise.resolve(true);
            }
            // check that the edits are not overlapping (i.e. illegal)
            const editRanges = editData.edits.map(edit => edit.range);
            // sort ascending (by end and then by start)
            editRanges.sort((a, b) => {
                if (a.end.line === b.end.line) {
                    if (a.end.character === b.end.character) {
                        if (a.start.line === b.start.line) {
                            return a.start.character - b.start.character;
                        }
                        return a.start.line - b.start.line;
                    }
                    return a.end.character - b.end.character;
                }
                return a.end.line - b.end.line;
            });
            // check that no edits are overlapping
            for (let i = 0, count = editRanges.length - 1; i < count; i++) {
                const rangeEnd = editRanges[i].end;
                const nextRangeStart = editRanges[i + 1].start;
                if (nextRangeStart.isBefore(rangeEnd)) {
                    // overlapping ranges
                    return Promise.reject(new Error('Overlapping ranges are not allowed!'));
                }
            }
            // prepare data for serialization
            const edits = editData.edits.map((edit) => {
                return {
                    range: TypeConverters.Range.from(edit.range),
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers
                };
            });
            return this._proxy.$tryApplyEdits(this.id, editData.documentVersionId, edits, {
                setEndOfLine: typeof editData.setEndOfLine === 'number' ? TypeConverters.EndOfLine.from(editData.setEndOfLine) : undefined,
                undoStopBefore: editData.undoStopBefore,
                undoStopAfter: editData.undoStopAfter
            });
        }
        insertSnippet(snippet, where, options = { undoStopBefore: true, undoStopAfter: true }) {
            if (this._disposed) {
                return Promise.reject(new Error('TextEditor#insertSnippet not possible on closed editors'));
            }
            let ranges;
            if (!where || (Array.isArray(where) && where.length === 0)) {
                ranges = this._selections.map(range => TypeConverters.Range.from(range));
            }
            else if (where instanceof extHostTypes_1.Position) {
                const { lineNumber, column } = TypeConverters.Position.from(where);
                ranges = [{ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column }];
            }
            else if (where instanceof extHostTypes_1.Range) {
                ranges = [TypeConverters.Range.from(where)];
            }
            else {
                ranges = [];
                for (const posOrRange of where) {
                    if (posOrRange instanceof extHostTypes_1.Range) {
                        ranges.push(TypeConverters.Range.from(posOrRange));
                    }
                    else {
                        const { lineNumber, column } = TypeConverters.Position.from(posOrRange);
                        ranges.push({ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column });
                    }
                }
            }
            return this._proxy.$tryInsertSnippet(this.id, snippet.value, ranges, options);
        }
        // ---- util
        _runOnProxy(callback) {
            if (this._disposed) {
                this._logService.warn('TextEditor is closed/disposed');
                return Promise.resolve(undefined);
            }
            return callback().then(() => this, err => {
                if (!(err instanceof Error && err.name === 'DISPOSED')) {
                    this._logService.warn(err);
                }
                return null;
            });
        }
    }
    exports.ExtHostTextEditor = ExtHostTextEditor;
});
//# __sourceMappingURL=extHostTextEditor.js.map