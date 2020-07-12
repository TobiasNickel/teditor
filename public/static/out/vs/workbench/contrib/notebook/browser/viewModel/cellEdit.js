/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SplitCellEdit = exports.JoinCellEdit = exports.SpliceCellsEdit = exports.MoveCellEdit = exports.DeleteCellEdit = exports.InsertCellEdit = void 0;
    class InsertCellEdit {
        constructor(resource, insertIndex, cell, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.insertIndex = insertIndex;
            this.cell = cell;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* Resource */;
            this.label = 'Insert Cell';
        }
        undo() {
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.deleteCell(this.insertIndex);
            this.editingDelegate.setSelections(this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.insertCell) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.insertCell(this.insertIndex, this.cell);
            this.editingDelegate.setSelections(this.endSelections);
        }
    }
    exports.InsertCellEdit = InsertCellEdit;
    class DeleteCellEdit {
        constructor(resource, insertIndex, cell, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.insertIndex = insertIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* Resource */;
            this.label = 'Delete Cell';
            this._rawCell = cell.model;
            // save inmem text to `ICell`
            // no needed any more as the text buffer is transfered to `raw_cell`
            // this._rawCell.source = [cell.getText()];
        }
        undo() {
            if (!this.editingDelegate.insertCell || !this.editingDelegate.createCellViewModel) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            const cell = this.editingDelegate.createCellViewModel(this._rawCell);
            this.editingDelegate.insertCell(this.insertIndex, cell);
            this.editingDelegate.setSelections(this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.deleteCell(this.insertIndex);
            this.editingDelegate.setSelections(this.endSelections);
        }
    }
    exports.DeleteCellEdit = DeleteCellEdit;
    class MoveCellEdit {
        constructor(resource, fromIndex, toIndex, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.fromIndex = fromIndex;
            this.toIndex = toIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* Resource */;
            this.label = 'Delete Cell';
        }
        undo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.toIndex, this.fromIndex);
            this.editingDelegate.setSelections(this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.fromIndex, this.toIndex);
            this.editingDelegate.setSelections(this.endSelections);
        }
    }
    exports.MoveCellEdit = MoveCellEdit;
    class SpliceCellsEdit {
        constructor(resource, diffs, editingDelegate, beforeHandles, endHandles) {
            this.resource = resource;
            this.diffs = diffs;
            this.editingDelegate = editingDelegate;
            this.beforeHandles = beforeHandles;
            this.endHandles = endHandles;
            this.type = 0 /* Resource */;
            this.label = 'Insert Cell';
        }
        undo() {
            if (!this.editingDelegate.deleteCell || !this.editingDelegate.insertCell) {
                throw new Error('Notebook Insert/Delete Cell not implemented for Undo/Redo');
            }
            this.diffs.forEach(diff => {
                for (let i = 0; i < diff[2].length; i++) {
                    this.editingDelegate.deleteCell(diff[0]);
                }
                diff[1].reverse().forEach(cell => {
                    this.editingDelegate.insertCell(diff[0], cell);
                });
            });
            this.editingDelegate.setSelections(this.beforeHandles);
        }
        redo() {
            if (!this.editingDelegate.deleteCell || !this.editingDelegate.insertCell) {
                throw new Error('Notebook Insert/Delete Cell not implemented for Undo/Redo');
            }
            this.diffs.reverse().forEach(diff => {
                for (let i = 0; i < diff[1].length; i++) {
                    this.editingDelegate.deleteCell(diff[0]);
                }
                diff[2].reverse().forEach(cell => {
                    this.editingDelegate.insertCell(diff[0], cell);
                });
            });
            this.editingDelegate.setSelections(this.endHandles);
        }
    }
    exports.SpliceCellsEdit = SpliceCellsEdit;
    class JoinCellEdit {
        constructor(resource, index, direction, cell, selections, inverseRange, insertContent, removedCell, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.direction = direction;
            this.cell = cell;
            this.selections = selections;
            this.inverseRange = inverseRange;
            this.insertContent = insertContent;
            this.removedCell = removedCell;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* Resource */;
            this.label = 'Join Cell';
            this._deletedRawCell = this.removedCell.model;
        }
        async undo() {
            var _a;
            if (!this.editingDelegate.insertCell || !this.editingDelegate.createCellViewModel) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            (_a = this.cell.textModel) === null || _a === void 0 ? void 0 : _a.applyEdits([
                { range: this.inverseRange, text: '' }
            ]);
            this.cell.setSelections(this.selections);
            const cell = this.editingDelegate.createCellViewModel(this._deletedRawCell);
            if (this.direction === 'above') {
                this.editingDelegate.insertCell(this.index, cell);
                this.editingDelegate.setSelections([cell.handle]);
                cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
            else {
                this.editingDelegate.insertCell(this.index, cell);
                this.editingDelegate.setSelections([this.cell.handle]);
                this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
        async redo() {
            var _a;
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            (_a = this.cell.textModel) === null || _a === void 0 ? void 0 : _a.applyEdits([
                { range: this.inverseRange, text: this.insertContent }
            ]);
            this.editingDelegate.deleteCell(this.index);
            this.editingDelegate.setSelections([this.cell.handle]);
            this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
        }
    }
    exports.JoinCellEdit = JoinCellEdit;
    class SplitCellEdit {
        constructor(resource, index, cell, selections, cellContents, language, cellKind, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.cell = cell;
            this.selections = selections;
            this.cellContents = cellContents;
            this.language = language;
            this.cellKind = cellKind;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* Resource */;
            this.label = 'Join Cell';
        }
        async undo() {
            if (!this.editingDelegate.deleteCell || !this.editingDelegate.createCellViewModel) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            this.cell.textModel.applyEdits([
                {
                    range: this.cell.textModel.getFullModelRange(),
                    text: this.cellContents.join('')
                }
            ]);
            this.cell.setSelections(this.selections);
            for (let j = 1; j < this.cellContents.length; j++) {
                this.editingDelegate.deleteCell(this.index + 1);
            }
            this.editingDelegate.setSelections([this.cell.handle]);
            this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
        }
        async redo() {
            if (!this.editingDelegate.insertCell || !this.editingDelegate.createCell) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            this.cell.textModel.applyEdits([
                { range: this.cell.textModel.getFullModelRange(), text: this.cellContents[0] }
            ], false);
            let insertIndex = this.index + 1;
            let lastCell;
            for (let j = 1; j < this.cellContents.length; j++, insertIndex++) {
                lastCell = this.editingDelegate.createCell(insertIndex, this.cellContents[j], this.language, this.cellKind);
            }
            if (lastCell) {
                this.editingDelegate.setSelections([lastCell.handle]);
                lastCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
    }
    exports.SplitCellEdit = SplitCellEdit;
});
//# __sourceMappingURL=cellEdit.js.map