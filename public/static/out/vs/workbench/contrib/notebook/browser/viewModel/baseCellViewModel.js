/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/model/textModelSearch", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, event_1, lifecycle_1, range_1, textModelSearch_1, constants_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseCellViewModel = void 0;
    class BaseCellViewModel extends lifecycle_1.Disposable {
        constructor(viewType, model, id) {
            super();
            this.viewType = viewType;
            this.model = model;
            this.id = id;
            this._onDidChangeEditorAttachState = new event_1.Emitter();
            // Do not merge this event with `onDidChangeState` as we are using `Event.once(onDidChangeEditorAttachState)` elsewhere.
            this.onDidChangeEditorAttachState = this._onDidChangeEditorAttachState.event;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._editState = notebookBrowser_1.CellEditState.Preview;
            this._focusMode = notebookBrowser_1.CellFocusMode.Container;
            this._cursorChangeListener = null;
            this._editorViewStates = null;
            this._resolvedDecorations = new Map();
            this._lastDecorationId = 0;
            this._dragging = false;
            this._register(model.onDidChangeLanguage(() => {
                this._onDidChangeState.fire({ languageChanged: true });
            }));
            this._register(model.onDidChangeMetadata(() => {
                this._onDidChangeState.fire({ metadataChanged: true });
            }));
        }
        get handle() {
            return this.model.handle;
        }
        get uri() {
            return this.model.uri;
        }
        get lineCount() {
            return this.model.textBuffer.getLineCount();
        }
        get metadata() {
            return this.model.metadata;
        }
        get language() {
            return this.model.language;
        }
        get editState() {
            return this._editState;
        }
        set editState(newState) {
            if (newState === this._editState) {
                return;
            }
            this._editState = newState;
            this._onDidChangeState.fire({ editStateChanged: true });
            if (this._editState === notebookBrowser_1.CellEditState.Preview) {
                this.focusMode = notebookBrowser_1.CellFocusMode.Container;
            }
        }
        set currentTokenSource(v) {
            this._currentTokenSource = v;
        }
        get currentTokenSource() {
            return this._currentTokenSource;
        }
        get focusMode() {
            return this._focusMode;
        }
        set focusMode(newMode) {
            const changed = this._focusMode !== newMode;
            this._focusMode = newMode;
            if (changed) {
                this._onDidChangeState.fire({ focusModeChanged: true });
            }
        }
        get editorAttached() {
            return !!this._textEditor;
        }
        get textModel() {
            return this._textModel;
        }
        hasModel() {
            return !!this._textModel;
        }
        get dragging() {
            return this._dragging;
        }
        set dragging(v) {
            this._dragging = v;
        }
        assertTextModelAttached() {
            if (this._textModel && this._textEditor && this._textEditor.getModel() === this._textModel) {
                return true;
            }
            return false;
        }
        attachTextEditor(editor) {
            if (!editor.hasModel()) {
                throw new Error('Invalid editor: model is missing');
            }
            if (this._textEditor === editor) {
                if (this._cursorChangeListener === null) {
                    this._cursorChangeListener = this._textEditor.onDidChangeCursorSelection(() => { this._onDidChangeState.fire({ selectionChanged: true }); });
                    this._onDidChangeState.fire({ selectionChanged: true });
                }
                return;
            }
            this._textEditor = editor;
            this._textModel = this._textEditor.getModel() || undefined;
            if (this._editorViewStates) {
                this._restoreViewState(this._editorViewStates);
            }
            this._resolvedDecorations.forEach((value, key) => {
                if (key.startsWith('_lazy_')) {
                    // lazy ones
                    const ret = this._textEditor.deltaDecorations([], [value.options]);
                    this._resolvedDecorations.get(key).id = ret[0];
                }
                else {
                    const ret = this._textEditor.deltaDecorations([], [value.options]);
                    this._resolvedDecorations.get(key).id = ret[0];
                }
            });
            this._cursorChangeListener = this._textEditor.onDidChangeCursorSelection(() => { this._onDidChangeState.fire({ selectionChanged: true }); });
            this._onDidChangeState.fire({ selectionChanged: true });
            this._onDidChangeEditorAttachState.fire();
        }
        detachTextEditor() {
            var _a;
            this.saveViewState();
            // decorations need to be cleared first as editors can be resued.
            this._resolvedDecorations.forEach(value => {
                var _a;
                let resolvedid = value.id;
                if (resolvedid) {
                    (_a = this._textEditor) === null || _a === void 0 ? void 0 : _a.deltaDecorations([resolvedid], []);
                }
            });
            this._textEditor = undefined;
            this._textModel = undefined;
            (_a = this._cursorChangeListener) === null || _a === void 0 ? void 0 : _a.dispose();
            this._cursorChangeListener = null;
            this._onDidChangeEditorAttachState.fire();
        }
        getText() {
            return this.model.getValue();
        }
        getTextLength() {
            return this.model.getTextLength();
        }
        saveViewState() {
            if (!this._textEditor) {
                return;
            }
            this._editorViewStates = this._textEditor.saveViewState();
        }
        saveEditorViewState() {
            if (this._textEditor) {
                this._editorViewStates = this._textEditor.saveViewState();
            }
            return this._editorViewStates;
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            this._editorViewStates = editorViewStates;
        }
        _restoreViewState(state) {
            var _a;
            if (state) {
                (_a = this._textEditor) === null || _a === void 0 ? void 0 : _a.restoreViewState(state);
            }
        }
        addDecoration(decoration) {
            if (!this._textEditor) {
                const id = ++this._lastDecorationId;
                const decorationId = `_lazy_${this.id};${id}`;
                this._resolvedDecorations.set(decorationId, { options: decoration });
                return decorationId;
            }
            const result = this._textEditor.deltaDecorations([], [decoration]);
            this._resolvedDecorations.set(result[0], { id: result[0], options: decoration });
            return result[0];
        }
        removeDecoration(decorationId) {
            const realDecorationId = this._resolvedDecorations.get(decorationId);
            if (this._textEditor && realDecorationId && realDecorationId.id !== undefined) {
                this._textEditor.deltaDecorations([realDecorationId.id], []);
            }
            // lastly, remove all the cache
            this._resolvedDecorations.delete(decorationId);
        }
        deltaDecorations(oldDecorations, newDecorations) {
            oldDecorations.forEach(id => {
                this.removeDecoration(id);
            });
            const ret = newDecorations.map(option => {
                return this.addDecoration(option);
            });
            return ret;
        }
        revealRangeInCenter(range) {
            var _a;
            (_a = this._textEditor) === null || _a === void 0 ? void 0 : _a.revealRangeInCenter(range, 1 /* Immediate */);
        }
        setSelection(range) {
            var _a;
            (_a = this._textEditor) === null || _a === void 0 ? void 0 : _a.setSelection(range);
        }
        setSelections(selections) {
            var _a;
            (_a = this._textEditor) === null || _a === void 0 ? void 0 : _a.setSelections(selections);
        }
        getSelections() {
            var _a;
            return ((_a = this._textEditor) === null || _a === void 0 ? void 0 : _a.getSelections()) || [];
        }
        getSelectionsStartPosition() {
            var _a;
            if (this._textEditor) {
                const selections = this._textEditor.getSelections();
                return selections === null || selections === void 0 ? void 0 : selections.map(s => s.getStartPosition());
            }
            else {
                const selections = (_a = this._editorViewStates) === null || _a === void 0 ? void 0 : _a.cursorState;
                return selections === null || selections === void 0 ? void 0 : selections.map(s => s.selectionStart);
            }
        }
        getLineScrollTopOffset(line) {
            if (!this._textEditor) {
                return 0;
            }
            return this._textEditor.getTopForLineNumber(line) + constants_1.EDITOR_TOP_PADDING;
        }
        getPositionScrollTopOffset(line, column) {
            if (!this._textEditor) {
                return 0;
            }
            return this._textEditor.getTopForPosition(line, column) + constants_1.EDITOR_TOP_PADDING;
        }
        cursorAtBoundary() {
            if (!this._textEditor) {
                return notebookBrowser_1.CursorAtBoundary.None;
            }
            // only validate primary cursor
            const selection = this._textEditor.getSelection();
            // only validate empty cursor
            if (!selection || !selection.isEmpty()) {
                return notebookBrowser_1.CursorAtBoundary.None;
            }
            const firstViewLineTop = this._textEditor.getTopForPosition(1, 1);
            const lastViewLineTop = this._textEditor.getTopForPosition(this._textModel.getLineCount(), this._textModel.getLineLength(this._textModel.getLineCount()));
            const selectionTop = this._textEditor.getTopForPosition(selection.startLineNumber, selection.startColumn);
            if (selectionTop === lastViewLineTop) {
                if (selectionTop === firstViewLineTop) {
                    return notebookBrowser_1.CursorAtBoundary.Both;
                }
                else {
                    return notebookBrowser_1.CursorAtBoundary.Bottom;
                }
            }
            else {
                if (selectionTop === firstViewLineTop) {
                    return notebookBrowser_1.CursorAtBoundary.Top;
                }
                else {
                    return notebookBrowser_1.CursorAtBoundary.None;
                }
            }
        }
        get textBuffer() {
            return this.model.textBuffer;
        }
        cellStartFind(value) {
            let cellMatches = [];
            if (this.assertTextModelAttached()) {
                cellMatches = this._textModel.findMatches(value, false, false, false, null, false);
            }
            else {
                const lineCount = this.textBuffer.getLineCount();
                const fullRange = new range_1.Range(1, 1, lineCount, this.textBuffer.getLineLength(lineCount) + 1);
                const searchParams = new textModelSearch_1.SearchParams(value, false, false, null);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    return null;
                }
                cellMatches = this.textBuffer.findMatchesLineByLine(fullRange, searchData, false, 1000);
            }
            return cellMatches;
        }
        getEvaluatedMetadata(documentMetadata) {
            var _a, _b, _c, _d, _e, _f;
            const editable = (_b = (_a = this.metadata) === null || _a === void 0 ? void 0 : _a.editable) !== null && _b !== void 0 ? _b : documentMetadata.cellEditable;
            const runnable = (_d = (_c = this.metadata) === null || _c === void 0 ? void 0 : _c.runnable) !== null && _d !== void 0 ? _d : documentMetadata.cellRunnable;
            const hasExecutionOrder = (_f = (_e = this.metadata) === null || _e === void 0 ? void 0 : _e.hasExecutionOrder) !== null && _f !== void 0 ? _f : documentMetadata.cellHasExecutionOrder;
            return Object.assign(Object.assign({}, (this.metadata || {})), {
                editable,
                runnable,
                hasExecutionOrder
            });
        }
        dispose() {
            super.dispose();
        }
        toJSON() {
            return {
                handle: this.handle
            };
        }
    }
    exports.BaseCellViewModel = BaseCellViewModel;
});
//# __sourceMappingURL=baseCellViewModel.js.map