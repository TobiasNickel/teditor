/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, lifecycle_1, notebookCellTextModel_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextModel = exports.NotebookTextModelSnapshot = void 0;
    function compareRangesUsingEnds(a, b) {
        if (a[1] === b[1]) {
            return a[1] - b[1];
        }
        return a[1] - b[1];
    }
    class NotebookTextModelSnapshot {
        constructor(_model) {
            this._model = _model;
            // private readonly _pieces: Ce[] = [];
            this._index = -1;
            // for (let i = 0; i < this._model.cells.length; i++) {
            // 	const cell = this._model.cells[i];
            // 	this._pieces.push(this._model.cells[i].textBuffer.createSnapshot(true));
            // }
        }
        read() {
            if (this._index === -1) {
                this._index++;
                return `{ "metadata": ${JSON.stringify(this._model.metadata)}, "languages": ${JSON.stringify(this._model.languages)}, "cells": [`;
            }
            if (this._index < this._model.cells.length) {
                const cell = this._model.cells[this._index];
                const data = {
                    source: cell.getValue(),
                    metadata: cell.metadata,
                    cellKind: cell.cellKind,
                    language: cell.language,
                    outputs: cell.outputs
                };
                const rawStr = JSON.stringify(data);
                const isLastCell = this._index === this._model.cells.length - 1;
                this._index++;
                return isLastCell ? rawStr : (rawStr + ',');
            }
            else if (this._index === this._model.cells.length) {
                this._index++;
                return `]}`;
            }
            else {
                return null;
            }
        }
    }
    exports.NotebookTextModelSnapshot = NotebookTextModelSnapshot;
    class NotebookTextModel extends lifecycle_1.Disposable {
        constructor(handle, viewType, supportBackup, uri) {
            super();
            this.handle = handle;
            this.viewType = viewType;
            this.supportBackup = supportBackup;
            this.uri = uri;
            this._cellhandlePool = 0;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._onDidChangeCells = new event_1.Emitter();
            this._onDidModelChangeProxy = new event_1.Emitter();
            this._onDidSelectionChangeProxy = new event_1.Emitter();
            this._onDidChangeContent = new event_1.Emitter();
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeMetadata = new event_1.Emitter();
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._mapping = new Map();
            this._cellListeners = new Map();
            this.languages = [];
            this.metadata = notebookCommon_1.notebookDocumentMetadataDefaults;
            this.renderers = new Set();
            this._isUntitled = undefined;
            this._versionId = 0;
            this._selections = [];
            this._dirty = false;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this.cells = [];
        }
        get onDidChangeCells() { return this._onDidChangeCells.event; }
        get onDidModelChangeProxy() { return this._onDidModelChangeProxy.event; }
        get onDidSelectionChange() { return this._onDidSelectionChangeProxy.event; }
        get versionId() {
            return this._versionId;
        }
        get selections() {
            return this._selections;
        }
        set selections(selections) {
            this._selections = selections;
            this._onDidSelectionChangeProxy.fire(this._selections);
        }
        get isDirty() {
            return this._dirty;
        }
        setDirty(newState) {
            if (this._dirty !== newState) {
                this._dirty = newState;
                this._onDidChangeDirty.fire();
            }
        }
        createCellTextModel(source, language, cellKind, outputs, metadata) {
            const cellHandle = this._cellhandlePool++;
            const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
            return new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, source, language, cellKind, outputs || [], metadata);
        }
        initialize(cells) {
            this.cells = [];
            this._versionId = 0;
            const mainCells = cells.map(cell => {
                const cellHandle = this._cellhandlePool++;
                const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
                return new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, cell.source, cell.language, cell.cellKind, cell.outputs || [], cell.metadata);
            });
            this._isUntitled = false;
            for (let i = 0; i < mainCells.length; i++) {
                this._mapping.set(mainCells[i].handle, mainCells[i]);
                let dirtyStateListener = mainCells[i].onDidChangeContent(() => {
                    this.setDirty(true);
                    this._onDidChangeContent.fire();
                });
                this._cellListeners.set(mainCells[i].handle, dirtyStateListener);
            }
            this.cells.splice(0, 0, ...mainCells);
            this._increaseVersionId();
        }
        $applyEdit(modelVersionId, rawEdits, emitToExtHost = true) {
            if (modelVersionId !== this._versionId) {
                return false;
            }
            const oldViewCells = this.cells.slice(0);
            const oldMap = new Map(this._mapping);
            let operations = [];
            for (let i = 0; i < rawEdits.length; i++) {
                if (rawEdits[i].editType === notebookCommon_1.CellEditType.Insert) {
                    const edit = rawEdits[i];
                    operations.push(Object.assign({ sortIndex: i, start: edit.index, end: edit.index }, edit));
                }
                else {
                    const edit = rawEdits[i];
                    operations.push(Object.assign({ sortIndex: i, start: edit.index, end: edit.index + edit.count }, edit));
                }
            }
            // const edits
            operations = operations.sort((a, b) => {
                let r = compareRangesUsingEnds([a.start, a.end], [b.start, b.end]);
                if (r === 0) {
                    return b.sortIndex - a.sortIndex;
                }
                return -r;
            });
            for (let i = 0; i < operations.length; i++) {
                switch (operations[i].editType) {
                    case notebookCommon_1.CellEditType.Insert:
                        const insertEdit = operations[i];
                        const mainCells = insertEdit.cells.map(cell => {
                            const cellHandle = this._cellhandlePool++;
                            const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
                            return new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, cell.source, cell.language, cell.cellKind, cell.outputs || [], cell.metadata);
                        });
                        this.insertNewCell(insertEdit.index, mainCells, false);
                        break;
                    case notebookCommon_1.CellEditType.Delete:
                        this.removeCell(operations[i].index, operations[i].end - operations[i].start, false);
                        break;
                }
            }
            const diffs = notebookCommon_1.diff(oldViewCells, this.cells, cell => {
                return oldMap.has(cell.handle);
            }).map(diff => {
                return [diff.start, diff.deleteCount, diff.toInsert];
            });
            if (emitToExtHost) {
                this._onDidModelChangeProxy.fire({
                    kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                    versionId: this._versionId,
                    changes: diffs.map(diff => [diff[0], diff[1], diff[2].map(cell => ({
                            handle: cell.handle,
                            uri: cell.uri,
                            source: cell.textBuffer.getLinesContent(),
                            language: cell.language,
                            cellKind: cell.cellKind,
                            outputs: cell.outputs,
                            metadata: cell.metadata
                        }))])
                });
            }
            this._onDidChangeCells.fire(diffs);
            return true;
        }
        createSnapshot(preserveBOM) {
            return new NotebookTextModelSnapshot(this);
        }
        _increaseVersionId() {
            this._versionId = this._versionId + 1;
        }
        handleUnknownChange() {
            this.setDirty(true);
        }
        updateLanguages(languages) {
            this.languages = languages;
            // TODO@rebornix metadata: default language for cell
            if (this._isUntitled && languages.length && this.cells.length) {
                this.cells[0].language = languages[0];
            }
        }
        updateNotebookMetadata(metadata) {
            this.metadata = metadata;
            this._onDidChangeMetadata.fire(this.metadata);
        }
        updateNotebookCellMetadata(handle, metadata) {
            const cell = this.cells.find(cell => cell.handle === handle);
            if (cell) {
                cell.metadata = metadata;
            }
        }
        updateRenderers(renderers) {
            renderers.forEach(render => {
                this.renderers.add(render);
            });
        }
        insertTemplateCell(cell) {
            if (this.cells.length > 0 || this._isUntitled !== undefined) {
                return;
            }
            this._isUntitled = true;
            this.cells = [cell];
            this._mapping.set(cell.handle, cell);
            let dirtyStateListener = cell.onDidChangeContent(() => {
                this._isUntitled = false;
                this.setDirty(true);
                this._onDidChangeContent.fire();
            });
            this._cellListeners.set(cell.handle, dirtyStateListener);
            this.setDirty(true);
            this._onDidChangeContent.fire();
            this._onDidModelChangeProxy.fire({
                kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                versionId: this._versionId, changes: [[
                        0,
                        0,
                        [{
                                handle: cell.handle,
                                uri: cell.uri,
                                source: cell.textBuffer.getLinesContent(),
                                language: cell.language,
                                cellKind: cell.cellKind,
                                outputs: cell.outputs,
                                metadata: cell.metadata
                            }]
                    ]]
            });
            return;
        }
        insertNewCell(index, cells, emitToExtHost = true) {
            this._isUntitled = false;
            for (let i = 0; i < cells.length; i++) {
                this._mapping.set(cells[i].handle, cells[i]);
                let dirtyStateListener = cells[i].onDidChangeContent(() => {
                    this.setDirty(true);
                    this._onDidChangeContent.fire();
                });
                this._cellListeners.set(cells[i].handle, dirtyStateListener);
            }
            this.cells.splice(index, 0, ...cells);
            this.setDirty(true);
            this._onDidChangeContent.fire();
            this._increaseVersionId();
            if (emitToExtHost) {
                this._onDidModelChangeProxy.fire({
                    kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                    versionId: this._versionId, changes: [[
                            index,
                            0,
                            cells.map(cell => ({
                                handle: cell.handle,
                                uri: cell.uri,
                                source: cell.textBuffer.getLinesContent(),
                                language: cell.language,
                                cellKind: cell.cellKind,
                                outputs: cell.outputs,
                                metadata: cell.metadata
                            }))
                        ]]
                });
            }
            return;
        }
        removeCell(index, count, emitToExtHost = true) {
            var _a;
            this._isUntitled = false;
            for (let i = index; i < index + count; i++) {
                let cell = this.cells[i];
                (_a = this._cellListeners.get(cell.handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._cellListeners.delete(cell.handle);
            }
            this.cells.splice(index, count);
            this.setDirty(true);
            this._onDidChangeContent.fire();
            this._increaseVersionId();
            if (emitToExtHost) {
                this._onDidModelChangeProxy.fire({ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, versionId: this._versionId, changes: [[index, count, []]] });
            }
        }
        moveCellToIdx(index, newIdx, emitToExtHost = true) {
            this.assertIndex(index);
            this.assertIndex(newIdx);
            const cells = this.cells.splice(index, 1);
            this.cells.splice(newIdx, 0, ...cells);
            this.setDirty(true);
            this._onDidChangeContent.fire();
            this._increaseVersionId();
            if (emitToExtHost) {
                this._onDidModelChangeProxy.fire({ kind: notebookCommon_1.NotebookCellsChangeType.Move, versionId: this._versionId, index, newIdx });
            }
        }
        assertIndex(index) {
            if (index < 0 || index >= this.cells.length) {
                throw new Error(`model index out of range ${index}`);
            }
        }
        // TODO@rebornix should this trigger content change event?
        $spliceNotebookCellOutputs(cellHandle, splices) {
            let cell = this._mapping.get(cellHandle);
            cell === null || cell === void 0 ? void 0 : cell.spliceNotebookCellOutputs(splices);
        }
        clearCellOutput(handle) {
            let cell = this._mapping.get(handle);
            if (cell) {
                cell.spliceNotebookCellOutputs([
                    [0, cell.outputs.length, []]
                ]);
                this._increaseVersionId();
                this._onDidModelChangeProxy.fire({ kind: notebookCommon_1.NotebookCellsChangeType.CellClearOutput, versionId: this._versionId, index: this.cells.indexOf(cell) });
            }
        }
        changeCellLanguage(handle, languageId) {
            let cell = this._mapping.get(handle);
            if (cell && cell.language !== languageId) {
                cell.language = languageId;
                this._increaseVersionId();
                this._onDidModelChangeProxy.fire({ kind: notebookCommon_1.NotebookCellsChangeType.ChangeLanguage, versionId: this._versionId, index: this.cells.indexOf(cell), language: languageId });
            }
        }
        clearAllCellOutputs() {
            this.cells.forEach(cell => {
                cell.spliceNotebookCellOutputs([
                    [0, cell.outputs.length, []]
                ]);
            });
            this._increaseVersionId();
            this._onDidModelChangeProxy.fire({ kind: notebookCommon_1.NotebookCellsChangeType.CellsClearOutput, versionId: this._versionId });
        }
        dispose() {
            this._onWillDispose.fire();
            this._cellListeners.forEach(val => val.dispose());
            super.dispose();
        }
    }
    exports.NotebookTextModel = NotebookTextModel;
});
//# __sourceMappingURL=notebookTextModel.js.map