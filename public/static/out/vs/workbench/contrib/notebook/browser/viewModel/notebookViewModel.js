/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/model/intervalTree", "vs/editor/common/model/textModel", "vs/platform/instantiation/common/instantiation", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/cellEdit", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/contrib/fold/foldingModel", "vs/workbench/contrib/notebook/browser/viewModel/markdownCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/view/renderers/mdRenderer", "vs/base/common/resources", "vs/editor/common/core/position", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer"], function (require, exports, errors_1, event_1, lifecycle_1, strings, bulkEditService_1, range_1, intervalTree_1, textModel_1, instantiation_1, undoRedo_1, notebookBrowser_1, cellEdit_1, codeCellViewModel_1, eventDispatcher_1, foldingModel_1, markdownCellViewModel_1, notebookCommon_1, mdRenderer_1, resources_1, position_1, pieceTreeTextBuffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createCellViewModel = exports.NotebookViewModel = void 0;
    const invalidFunc = () => { throw new Error(`Invalid change accessor`); };
    class DecorationsTree {
        constructor() {
            this._decorationsTree = new intervalTree_1.IntervalTree();
        }
        intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId) {
            const r1 = this._decorationsTree.intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId);
            return r1;
        }
        search(filterOwnerId, filterOutValidation, overviewRulerOnly, cachedVersionId) {
            return this._decorationsTree.search(filterOwnerId, filterOutValidation, cachedVersionId);
        }
        collectNodesFromOwner(ownerId) {
            const r1 = this._decorationsTree.collectNodesFromOwner(ownerId);
            return r1;
        }
        collectNodesPostOrder() {
            const r1 = this._decorationsTree.collectNodesPostOrder();
            return r1;
        }
        insert(node) {
            this._decorationsTree.insert(node);
        }
        delete(node) {
            this._decorationsTree.delete(node);
        }
        resolveNode(node, cachedVersionId) {
            this._decorationsTree.resolveNode(node, cachedVersionId);
        }
        acceptReplace(offset, length, textLength, forceMoveMarkers) {
            this._decorationsTree.acceptReplace(offset, length, textLength, forceMoveMarkers);
        }
    }
    const TRACKED_RANGE_OPTIONS = [
        textModel_1.ModelDecorationOptions.register({ stickiness: 0 /* AlwaysGrowsWhenTypingAtEdges */ }),
        textModel_1.ModelDecorationOptions.register({ stickiness: 1 /* NeverGrowsWhenTypingAtEdges */ }),
        textModel_1.ModelDecorationOptions.register({ stickiness: 2 /* GrowsOnlyWhenTypingBefore */ }),
        textModel_1.ModelDecorationOptions.register({ stickiness: 3 /* GrowsOnlyWhenTypingAfter */ }),
    ];
    function _normalizeOptions(options) {
        if (options instanceof textModel_1.ModelDecorationOptions) {
            return options;
        }
        return textModel_1.ModelDecorationOptions.createDynamic(options);
    }
    function selectionsEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    let MODEL_ID = 0;
    let NotebookViewModel = class NotebookViewModel extends lifecycle_1.Disposable {
        constructor(viewType, _notebook, eventDispatcher, _layoutInfo, _instantiationService, _bulkEditService, _undoService) {
            super();
            this.viewType = viewType;
            this._notebook = _notebook;
            this.eventDispatcher = eventDispatcher;
            this._layoutInfo = _layoutInfo;
            this._instantiationService = _instantiationService;
            this._bulkEditService = _bulkEditService;
            this._undoService = _undoService;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._viewCells = [];
            this._handleToViewCellMapping = new Map();
            this._onDidChangeViewCells = new event_1.Emitter();
            this._lastNotebookEditResource = [];
            this._onDidChangeSelection = new event_1.Emitter();
            this._selections = [];
            this._decorationsTree = new DecorationsTree();
            this._decorations = Object.create(null);
            this._lastDecorationId = 0;
            this._foldingRanges = null;
            this._hiddenRanges = [];
            MODEL_ID++;
            this.id = '$notebookViewModel' + MODEL_ID;
            this._instanceId = strings.singleLetterHash(MODEL_ID);
            this._register(this._notebook.onDidChangeCells(e => {
                const diffs = e.map(splice => {
                    return [splice[0], splice[1], splice[2].map(cell => {
                            return createCellViewModel(this._instantiationService, this, cell);
                        })];
                });
                const undoDiff = diffs.map(diff => {
                    const deletedCells = this.viewCells.slice(diff[0], diff[0] + diff[1]);
                    return [diff[0], deletedCells, diff[2]];
                });
                diffs.reverse().forEach(diff => {
                    const deletedCells = this._viewCells.splice(diff[0], diff[1], ...diff[2]);
                    deletedCells.forEach(cell => {
                        this._handleToViewCellMapping.delete(cell.handle);
                    });
                    diff[2].forEach(cell => {
                        this._handleToViewCellMapping.set(cell.handle, cell);
                        this._localStore.add(cell);
                    });
                });
                this._onDidChangeViewCells.fire({
                    synchronous: true,
                    splices: diffs
                });
                let endSelectionHandles = [];
                if (this.selectionHandles.length) {
                    const primaryHandle = this.selectionHandles[0];
                    const primarySelectionIndex = this._viewCells.indexOf(this.getCellByHandle(primaryHandle));
                    endSelectionHandles = [primaryHandle];
                    let delta = 0;
                    for (let i = 0; i < diffs.length; i++) {
                        const diff = diffs[0];
                        if (diff[0] + diff[1] <= primarySelectionIndex) {
                            delta += diff[2].length - diff[1];
                            continue;
                        }
                        if (diff[0] > primarySelectionIndex) {
                            endSelectionHandles = [primaryHandle];
                            break;
                        }
                        if (diff[0] + diff[1] > primaryHandle) {
                            endSelectionHandles = [this._viewCells[diff[0] + delta].handle];
                            break;
                        }
                    }
                }
                this._undoService.pushElement(new cellEdit_1.SpliceCellsEdit(this.uri, undoDiff, {
                    insertCell: this._insertCellDelegate.bind(this),
                    deleteCell: this._deleteCellDelegate.bind(this),
                    setSelections: this._setSelectionsDelegate.bind(this)
                }, this.selectionHandles, endSelectionHandles));
                this.selectionHandles = endSelectionHandles;
            }));
            this._register(this._notebook.onDidChangeMetadata(e => {
                this.eventDispatcher.emit([new eventDispatcher_1.NotebookMetadataChangedEvent(e)]);
            }));
            this._register(this.eventDispatcher.onDidChangeLayout((e) => {
                this._layoutInfo = e.value;
                this._viewCells.forEach(cell => {
                    if (cell.cellKind === notebookCommon_1.CellKind.Markdown) {
                        if (e.source.width || e.source.fontInfo) {
                            cell.layoutChange({ outerWidth: e.value.width, font: e.value.fontInfo });
                        }
                    }
                    else {
                        if (e.source.width !== undefined) {
                            cell.layoutChange({ outerWidth: e.value.width, font: e.value.fontInfo });
                        }
                    }
                });
            }));
            this._viewCells = this._notebook.cells.map(cell => {
                return createCellViewModel(this._instantiationService, this, cell);
            });
            this._viewCells.forEach(cell => {
                this._handleToViewCellMapping.set(cell.handle, cell);
            });
        }
        get currentTokenSource() {
            return this._currentTokenSource;
        }
        set currentTokenSource(v) {
            this._currentTokenSource = v;
        }
        get viewCells() {
            return this._viewCells;
        }
        set viewCells(_) {
            throw new Error('NotebookViewModel.viewCells is readonly');
        }
        get length() {
            return this._viewCells.length;
        }
        get notebookDocument() {
            return this._notebook;
        }
        get renderers() {
            return this._notebook.renderers;
        }
        get handle() {
            return this._notebook.handle;
        }
        get languages() {
            return this._notebook.languages;
        }
        get uri() {
            return this._notebook.uri;
        }
        get metadata() {
            return this._notebook.metadata;
        }
        get onDidChangeViewCells() { return this._onDidChangeViewCells.event; }
        get lastNotebookEditResource() {
            if (this._lastNotebookEditResource.length) {
                return this._lastNotebookEditResource[this._lastNotebookEditResource.length - 1];
            }
            return null;
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        get onDidChangeSelection() { return this._onDidChangeSelection.event; }
        get selectionHandles() {
            return this._selections;
        }
        set selectionHandles(selections) {
            selections = selections.sort();
            if (selectionsEqual(selections, this.selectionHandles)) {
                return;
            }
            this._selections = selections;
            this._notebook.selections = selections;
            this._onDidChangeSelection.fire();
        }
        getFoldingStartIndex(index) {
            if (!this._foldingRanges) {
                return -1;
            }
            const range = this._foldingRanges.findRange(index + 1);
            const startIndex = this._foldingRanges.getStartLineNumber(range) - 1;
            return startIndex;
        }
        getFoldingState(index) {
            if (!this._foldingRanges) {
                return foldingModel_1.CellFoldingState.None;
            }
            const range = this._foldingRanges.findRange(index + 1);
            const startIndex = this._foldingRanges.getStartLineNumber(range) - 1;
            if (startIndex !== index) {
                return foldingModel_1.CellFoldingState.None;
            }
            return this._foldingRanges.isCollapsed(range) ? foldingModel_1.CellFoldingState.Collapsed : foldingModel_1.CellFoldingState.Expanded;
        }
        updateFoldingRanges(ranges) {
            this._foldingRanges = ranges;
            let updateHiddenAreas = false;
            let newHiddenAreas = [];
            let i = 0; // index into hidden
            let k = 0;
            let lastCollapsedStart = Number.MAX_VALUE;
            let lastCollapsedEnd = -1;
            for (; i < ranges.length; i++) {
                if (!ranges.isCollapsed(i)) {
                    continue;
                }
                let startLineNumber = ranges.getStartLineNumber(i) + 1; // the first line is not hidden
                let endLineNumber = ranges.getEndLineNumber(i);
                if (lastCollapsedStart <= startLineNumber && endLineNumber <= lastCollapsedEnd) {
                    // ignore ranges contained in collapsed regions
                    continue;
                }
                if (!updateHiddenAreas && k < this._hiddenRanges.length && this._hiddenRanges[k].start + 1 === startLineNumber && (this._hiddenRanges[k].end + 1) === endLineNumber) {
                    // reuse the old ranges
                    newHiddenAreas.push(this._hiddenRanges[k]);
                    k++;
                }
                else {
                    updateHiddenAreas = true;
                    newHiddenAreas.push({ start: startLineNumber - 1, end: endLineNumber - 1 });
                }
                lastCollapsedStart = startLineNumber;
                lastCollapsedEnd = endLineNumber;
            }
            if (updateHiddenAreas || k < this._hiddenRanges.length) {
                this._hiddenRanges = newHiddenAreas;
            }
            this._viewCells.forEach(cell => {
                if (cell.cellKind === notebookCommon_1.CellKind.Markdown) {
                    cell.triggerfoldingStateChange();
                }
            });
        }
        getHiddenRanges() {
            return this._hiddenRanges;
        }
        hide() {
            this._viewCells.forEach(cell => {
                if (cell.getText() !== '') {
                    cell.editState = notebookBrowser_1.CellEditState.Preview;
                }
            });
        }
        getCellByHandle(handle) {
            return this._handleToViewCellMapping.get(handle);
        }
        getCellIndex(cell) {
            return this._viewCells.indexOf(cell);
        }
        getNextVisibleCellIndex(index) {
            for (let i = 0; i < this._hiddenRanges.length; i++) {
                const cellRange = this._hiddenRanges[i];
                const foldStart = cellRange.start - 1;
                const foldEnd = cellRange.end;
                if (foldEnd < index) {
                    continue;
                }
                // foldEnd >= index
                if (foldStart <= index) {
                    return foldEnd + 1;
                }
                break;
            }
            return index + 1;
        }
        hasCell(handle) {
            return this._handleToViewCellMapping.has(handle);
        }
        getVersionId() {
            return this._notebook.versionId;
        }
        getTrackedRange(id) {
            return this._getDecorationRange(id);
        }
        _getDecorationRange(decorationId) {
            const node = this._decorations[decorationId];
            if (!node) {
                return null;
            }
            const versionId = this.getVersionId();
            if (node.cachedVersionId !== versionId) {
                this._decorationsTree.resolveNode(node, versionId);
            }
            if (node.range === null) {
                return { start: node.cachedAbsoluteStart - 1, end: node.cachedAbsoluteEnd - 1 };
            }
            return { start: node.range.startLineNumber - 1, end: node.range.endLineNumber - 1 };
        }
        setTrackedRange(id, newRange, newStickiness) {
            const node = (id ? this._decorations[id] : null);
            if (!node) {
                if (!newRange) {
                    return null;
                }
                return this._deltaCellDecorationsImpl(0, [], [{ range: new range_1.Range(newRange.start + 1, 1, newRange.end + 1, 1), options: TRACKED_RANGE_OPTIONS[newStickiness] }])[0];
            }
            if (!newRange) {
                // node exists, the request is to delete => delete node
                this._decorationsTree.delete(node);
                delete this._decorations[node.id];
                return null;
            }
            this._decorationsTree.delete(node);
            node.reset(this.getVersionId(), newRange.start, newRange.end + 1, new range_1.Range(newRange.start + 1, 1, newRange.end + 1, 1));
            node.setOptions(TRACKED_RANGE_OPTIONS[newStickiness]);
            this._decorationsTree.insert(node);
            return node.id;
        }
        _deltaCellDecorationsImpl(ownerId, oldDecorationsIds, newDecorations) {
            const versionId = this.getVersionId();
            const oldDecorationsLen = oldDecorationsIds.length;
            let oldDecorationIndex = 0;
            const newDecorationsLen = newDecorations.length;
            let newDecorationIndex = 0;
            let result = new Array(newDecorationsLen);
            while (oldDecorationIndex < oldDecorationsLen || newDecorationIndex < newDecorationsLen) {
                let node = null;
                if (oldDecorationIndex < oldDecorationsLen) {
                    // (1) get ourselves an old node
                    do {
                        node = this._decorations[oldDecorationsIds[oldDecorationIndex++]];
                    } while (!node && oldDecorationIndex < oldDecorationsLen);
                    // (2) remove the node from the tree (if it exists)
                    if (node) {
                        this._decorationsTree.delete(node);
                        // this._onDidChangeDecorations.checkAffectedAndFire(node.options);
                    }
                }
                if (newDecorationIndex < newDecorationsLen) {
                    // (3) create a new node if necessary
                    if (!node) {
                        const internalDecorationId = (++this._lastDecorationId);
                        const decorationId = `${this._instanceId};${internalDecorationId}`;
                        node = new intervalTree_1.IntervalNode(decorationId, 0, 0);
                        this._decorations[decorationId] = node;
                    }
                    // (4) initialize node
                    const newDecoration = newDecorations[newDecorationIndex];
                    // const range = this._validateRangeRelaxedNoAllocations(newDecoration.range);
                    const range = newDecoration.range;
                    const options = _normalizeOptions(newDecoration.options);
                    // const startOffset = this._buffer.getOffsetAt(range.startLineNumber, range.startColumn);
                    // const endOffset = this._buffer.getOffsetAt(range.endLineNumber, range.endColumn);
                    node.ownerId = ownerId;
                    node.reset(versionId, range.startLineNumber, range.endLineNumber, range_1.Range.lift(range));
                    node.setOptions(options);
                    // this._onDidChangeDecorations.checkAffectedAndFire(options);
                    this._decorationsTree.insert(node);
                    result[newDecorationIndex] = node.id;
                    newDecorationIndex++;
                }
                else {
                    if (node) {
                        delete this._decorations[node.id];
                    }
                }
            }
            return result;
        }
        _createCellDelegate(index, source, language, type) {
            const cell = this._notebook.createCellTextModel(source, language, type, [], undefined);
            let newCell = createCellViewModel(this._instantiationService, this, cell);
            this._viewCells.splice(index, 0, newCell);
            this._handleToViewCellMapping.set(newCell.handle, newCell);
            this._notebook.insertNewCell(index, [cell]);
            this._localStore.add(newCell);
            this._decorationsTree.acceptReplace(index, 0, 1, true);
            this._onDidChangeViewCells.fire({ synchronous: true, splices: [[index, 0, [newCell]]] });
            return newCell;
        }
        _insertCellDelegate(insertIndex, insertCell) {
            this._viewCells.splice(insertIndex, 0, insertCell);
            this._handleToViewCellMapping.set(insertCell.handle, insertCell);
            this._notebook.insertNewCell(insertIndex, [insertCell.model]);
            this._localStore.add(insertCell);
            this._onDidChangeViewCells.fire({ synchronous: true, splices: [[insertIndex, 0, [insertCell]]] });
        }
        _deleteCellDelegate(deleteIndex) {
            const deleteCell = this._viewCells[deleteIndex];
            this._viewCells.splice(deleteIndex, 1);
            this._handleToViewCellMapping.delete(deleteCell.handle);
            this._notebook.removeCell(deleteIndex, 1);
            this._decorationsTree.acceptReplace(deleteIndex, 1, 0, true);
            this._onDidChangeViewCells.fire({ synchronous: true, splices: [[deleteIndex, 1, []]] });
        }
        _setSelectionsDelegate(selections) {
            this.selectionHandles = selections;
        }
        createCell(index, source, language, type, metadata, synchronous, pushUndoStop = true) {
            const cell = this._notebook.createCellTextModel(source, language, type, [], metadata);
            let newCell = createCellViewModel(this._instantiationService, this, cell);
            this._viewCells.splice(index, 0, newCell);
            this._handleToViewCellMapping.set(newCell.handle, newCell);
            this._notebook.insertNewCell(index, [cell]);
            this._localStore.add(newCell);
            if (pushUndoStop) {
                this._undoService.pushElement(new cellEdit_1.InsertCellEdit(this.uri, index, newCell, {
                    insertCell: this._insertCellDelegate.bind(this),
                    deleteCell: this._deleteCellDelegate.bind(this),
                    setSelections: this._setSelectionsDelegate.bind(this)
                }, this.selectionHandles, this.selectionHandles));
            }
            this._decorationsTree.acceptReplace(index, 0, 1, true);
            this._onDidChangeViewCells.fire({ synchronous: synchronous, splices: [[index, 0, [newCell]]] });
            return newCell;
        }
        insertCell(index, cell, synchronous) {
            let newCell = createCellViewModel(this._instantiationService, this, cell);
            this._viewCells.splice(index, 0, newCell);
            this._handleToViewCellMapping.set(newCell.handle, newCell);
            this._notebook.insertNewCell(index, [newCell.model]);
            this._localStore.add(newCell);
            this._undoService.pushElement(new cellEdit_1.InsertCellEdit(this.uri, index, newCell, {
                insertCell: this._insertCellDelegate.bind(this),
                deleteCell: this._deleteCellDelegate.bind(this),
                setSelections: this._setSelectionsDelegate.bind(this)
            }, this.selectionHandles, this.selectionHandles));
            this._decorationsTree.acceptReplace(index, 0, 1, true);
            this._onDidChangeViewCells.fire({ synchronous: synchronous, splices: [[index, 0, [newCell]]] });
            return newCell;
        }
        deleteCell(index, synchronous, pushUndoStop = true) {
            const primarySelectionIndex = this.selectionHandles.length ? this._viewCells.indexOf(this.getCellByHandle(this.selectionHandles[0])) : null;
            let viewCell = this._viewCells[index];
            this._viewCells.splice(index, 1);
            this._handleToViewCellMapping.delete(viewCell.handle);
            this._notebook.removeCell(index, 1);
            let endSelections = [];
            if (this.selectionHandles.length) {
                const primarySelectionHandle = this.selectionHandles[0];
                if (index === primarySelectionIndex) {
                    if (primarySelectionIndex < this.length - 1) {
                        endSelections = [this._viewCells[primarySelectionIndex + 1].handle];
                    }
                    else if (primarySelectionIndex === this.length - 1 && this.length > 1) {
                        endSelections = [this._viewCells[primarySelectionIndex - 1].handle];
                    }
                    else {
                        endSelections = [];
                    }
                }
                else {
                    endSelections = [primarySelectionHandle];
                }
            }
            if (pushUndoStop) {
                this._undoService.pushElement(new cellEdit_1.DeleteCellEdit(this.uri, index, viewCell, {
                    insertCell: this._insertCellDelegate.bind(this),
                    deleteCell: this._deleteCellDelegate.bind(this),
                    createCellViewModel: (cell) => {
                        return createCellViewModel(this._instantiationService, this, cell);
                    },
                    setSelections: this._setSelectionsDelegate.bind(this)
                }, this.selectionHandles, endSelections));
            }
            this.selectionHandles = endSelections;
            this._decorationsTree.acceptReplace(index, 1, 0, true);
            this._onDidChangeViewCells.fire({ synchronous: synchronous, splices: [[index, 1, []]] });
            viewCell.dispose();
        }
        moveCellToIdx(index, newIdx, synchronous, pushedToUndoStack = true) {
            const viewCell = this.viewCells[index];
            if (!viewCell) {
                return false;
            }
            this.viewCells.splice(index, 1);
            this.viewCells.splice(newIdx, 0, viewCell);
            this._notebook.moveCellToIdx(index, newIdx);
            if (pushedToUndoStack) {
                this._undoService.pushElement(new cellEdit_1.MoveCellEdit(this.uri, index, newIdx, {
                    moveCell: (fromIndex, toIndex) => {
                        this.moveCellToIdx(fromIndex, toIndex, true, false);
                    },
                    setSelections: this._setSelectionsDelegate.bind(this)
                }, this.selectionHandles, this.selectionHandles));
            }
            this.selectionHandles = this.selectionHandles;
            this._onDidChangeViewCells.fire({ synchronous: synchronous, splices: [[index, 1, []]] });
            this._onDidChangeViewCells.fire({ synchronous: synchronous, splices: [[newIdx, 0, [viewCell]]] });
            return true;
        }
        _pushIfAbsent(positions, p) {
            const last = positions.length > 0 ? positions[positions.length - 1] : undefined;
            if (!last || last.lineNumber !== p.lineNumber || last.column !== p.column) {
                positions.push(p);
            }
        }
        /**
         * Add split point at the beginning and the end;
         * Move end of line split points to the beginning of the next line;
         * Avoid duplicate split points
         */
        _splitPointsToBoundaries(splitPoints, textBuffer) {
            const boundaries = [];
            const lineCnt = textBuffer.getLineCount();
            const getLineLen = (lineNumber) => {
                return textBuffer.getLineLength(lineNumber);
            };
            // split points need to be sorted
            splitPoints = splitPoints.sort((l, r) => {
                const lineDiff = l.lineNumber - r.lineNumber;
                const columnDiff = l.column - r.column;
                return lineDiff !== 0 ? lineDiff : columnDiff;
            });
            // eat-up any split point at the beginning, i.e. we ignore the split point at the very beginning
            this._pushIfAbsent(boundaries, new position_1.Position(1, 1));
            for (let sp of splitPoints) {
                if (getLineLen(sp.lineNumber) + 1 === sp.column && sp.lineNumber < lineCnt) {
                    sp = new position_1.Position(sp.lineNumber + 1, 1);
                }
                this._pushIfAbsent(boundaries, sp);
            }
            // eat-up any split point at the beginning, i.e. we ignore the split point at the very end
            this._pushIfAbsent(boundaries, new position_1.Position(lineCnt, getLineLen(lineCnt) + 1));
            // if we only have two then they describe the whole range and nothing needs to be split
            return boundaries.length > 2 ? boundaries : null;
        }
        _computeCellLinesContents(cell, splitPoints) {
            const rangeBoundaries = this._splitPointsToBoundaries(splitPoints, cell.textBuffer);
            if (!rangeBoundaries) {
                return null;
            }
            const newLineModels = [];
            for (let i = 1; i < rangeBoundaries.length; i++) {
                const start = rangeBoundaries[i - 1];
                const end = rangeBoundaries[i];
                newLineModels.push(cell.textModel.getValueInRange(new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column)));
            }
            return newLineModels;
        }
        async splitNotebookCell(index) {
            const cell = this.viewCells[index];
            if (!this.metadata.editable) {
                return null;
            }
            if (!cell.getEvaluatedMetadata(this.notebookDocument.metadata).editable) {
                return null;
            }
            let splitPoints = cell.getSelectionsStartPosition();
            if (splitPoints && splitPoints.length > 0) {
                await cell.resolveTextModel();
                if (!cell.hasModel()) {
                    return null;
                }
                let newLinesContents = this._computeCellLinesContents(cell, splitPoints);
                if (newLinesContents) {
                    const editorSelections = cell.getSelections();
                    // update the contents of the first cell
                    cell.textModel.applyEdits([
                        { range: cell.textModel.getFullModelRange(), text: newLinesContents[0] }
                    ], false);
                    // create new cells based on the new text models
                    const language = cell.model.language;
                    const kind = cell.cellKind;
                    let insertIndex = this.getCellIndex(cell) + 1;
                    const newCells = [];
                    for (let j = 1; j < newLinesContents.length; j++, insertIndex++) {
                        newCells.push(this.createCell(insertIndex, newLinesContents[j], language, kind, undefined, true, false));
                    }
                    this.selectionHandles = [cell.handle];
                    this._undoService.pushElement(new cellEdit_1.SplitCellEdit(this.uri, index, cell, editorSelections, newLinesContents, language, kind, {
                        insertCell: this._insertCellDelegate.bind(this),
                        deleteCell: this._deleteCellDelegate.bind(this),
                        createCellViewModel: (cell) => {
                            return createCellViewModel(this._instantiationService, this, cell);
                        },
                        createCell: this._createCellDelegate.bind(this),
                        setSelections: this._setSelectionsDelegate.bind(this)
                    }));
                    return newCells;
                }
            }
            return null;
        }
        async joinNotebookCells(index, direction, constraint) {
            var _a, _b, _c, _d;
            const cell = this.viewCells[index];
            if (!this.metadata.editable) {
                return null;
            }
            if (!cell.getEvaluatedMetadata(this.notebookDocument.metadata).editable) {
                return null;
            }
            if (constraint && cell.cellKind !== constraint) {
                return null;
            }
            if (index === 0 && direction === 'above') {
                return null;
            }
            if (index === this.length - 1 && direction === 'below') {
                return null;
            }
            if (direction === 'above') {
                const above = this.viewCells[index - 1];
                if (constraint && above.cellKind !== constraint) {
                    return null;
                }
                if (!above.getEvaluatedMetadata(this.notebookDocument.metadata).editable) {
                    return null;
                }
                await above.resolveTextModel();
                if (!above.hasModel()) {
                    return null;
                }
                const endSelections = [cell.handle];
                const insertContent = ((_b = (_a = cell.textModel) === null || _a === void 0 ? void 0 : _a.getEOL()) !== null && _b !== void 0 ? _b : '') + cell.getText();
                const aboveCellLineCount = above.textModel.getLineCount();
                const aboveCellLastLineEndColumn = above.textModel.getLineLength(aboveCellLineCount);
                const editOperation = { range: new range_1.Range(aboveCellLineCount, aboveCellLastLineEndColumn + 1, aboveCellLineCount, aboveCellLastLineEndColumn + 1), text: insertContent };
                const editorSelections = above.getSelections();
                above.textModel.applyEdits([editOperation]);
                const inverseRange = pieceTreeTextBuffer_1.PieceTreeTextBuffer._getInverseEditRange(editOperation.range, editOperation.text);
                await this.deleteCell(index, true, false);
                this._undoService.pushElement(new cellEdit_1.JoinCellEdit(this.uri, index, direction, above, editorSelections, inverseRange, insertContent, cell, {
                    insertCell: this._insertCellDelegate.bind(this),
                    deleteCell: this._deleteCellDelegate.bind(this),
                    createCellViewModel: (cell) => {
                        return createCellViewModel(this._instantiationService, this, cell);
                    },
                    setSelections: this._setSelectionsDelegate.bind(this)
                }));
                this.selectionHandles = endSelections;
                return { cell: above, deletedCells: [above] };
            }
            else {
                const below = this.viewCells[index + 1];
                if (constraint && below.cellKind !== constraint) {
                    return null;
                }
                if (!below.getEvaluatedMetadata(this.notebookDocument.metadata).editable) {
                    return null;
                }
                await cell.resolveTextModel();
                if (!cell.hasModel()) {
                    return null;
                }
                const insertContent = ((_d = (_c = cell.textModel) === null || _c === void 0 ? void 0 : _c.getEOL()) !== null && _d !== void 0 ? _d : '') + below.getText();
                const cellLineCount = cell.textModel.getLineCount();
                const cellLastLineEndColumn = cell.textModel.getLineLength(cellLineCount);
                const editOperation = { range: new range_1.Range(cellLineCount, cellLastLineEndColumn + 1, cellLineCount, cellLastLineEndColumn + 1), text: insertContent };
                const editorSelections = cell.getSelections();
                cell.textModel.applyEdits([editOperation]);
                const inverseRange = pieceTreeTextBuffer_1.PieceTreeTextBuffer._getInverseEditRange(editOperation.range, editOperation.text);
                await this.deleteCell(index + 1, true, false);
                this._undoService.pushElement(new cellEdit_1.JoinCellEdit(this.uri, index + 1, direction, cell, editorSelections, inverseRange, insertContent, below, {
                    insertCell: this._insertCellDelegate.bind(this),
                    deleteCell: this._deleteCellDelegate.bind(this),
                    createCellViewModel: (cell) => {
                        return createCellViewModel(this._instantiationService, this, cell);
                    },
                    setSelections: this._setSelectionsDelegate.bind(this)
                }));
                return { cell, deletedCells: [below] };
            }
        }
        getEditorViewState() {
            const editingCells = {};
            this._viewCells.filter(cell => cell.editState === notebookBrowser_1.CellEditState.Editing).forEach(cell => editingCells[cell.model.handle] = true);
            const editorViewStates = {};
            this._viewCells.map(cell => ({ handle: cell.model.handle, state: cell.saveEditorViewState() })).forEach(viewState => {
                if (viewState.state) {
                    editorViewStates[viewState.handle] = viewState.state;
                }
            });
            return {
                editingCells,
                editorViewStates,
            };
        }
        restoreEditorViewState(viewState) {
            if (!viewState) {
                return;
            }
            this._viewCells.forEach((cell, index) => {
                const isEditing = viewState.editingCells && viewState.editingCells[cell.handle];
                const editorViewState = viewState.editorViewStates && viewState.editorViewStates[cell.handle];
                cell.editState = isEditing ? notebookBrowser_1.CellEditState.Editing : notebookBrowser_1.CellEditState.Preview;
                const cellHeight = viewState.cellTotalHeights ? viewState.cellTotalHeights[index] : undefined;
                cell.restoreEditorViewState(editorViewState, cellHeight);
            });
        }
        /**
         * Editor decorations across cells. For example, find decorations for multiple code cells
         * The reason that we can't completely delegate this to CodeEditorWidget is most of the time, the editors for cells are not created yet but we already have decorations for them.
         */
        changeDecorations(callback) {
            const changeAccessor = {
                deltaDecorations: (oldDecorations, newDecorations) => {
                    return this.deltaDecorationsImpl(oldDecorations, newDecorations);
                }
            };
            let result = null;
            try {
                result = callback(changeAccessor);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
            }
            changeAccessor.deltaDecorations = invalidFunc;
            return result;
        }
        deltaDecorationsImpl(oldDecorations, newDecorations) {
            const mapping = new Map();
            oldDecorations.forEach(oldDecoration => {
                const ownerId = oldDecoration.ownerId;
                if (!mapping.has(ownerId)) {
                    const cell = this._viewCells.find(cell => cell.handle === ownerId);
                    if (cell) {
                        mapping.set(ownerId, { cell: cell, oldDecorations: [], newDecorations: [] });
                    }
                }
                const data = mapping.get(ownerId);
                if (data) {
                    data.oldDecorations = oldDecoration.decorations;
                }
            });
            newDecorations.forEach(newDecoration => {
                const ownerId = newDecoration.ownerId;
                if (!mapping.has(ownerId)) {
                    const cell = this._viewCells.find(cell => cell.handle === ownerId);
                    if (cell) {
                        mapping.set(ownerId, { cell: cell, oldDecorations: [], newDecorations: [] });
                    }
                }
                const data = mapping.get(ownerId);
                if (data) {
                    data.newDecorations = newDecoration.decorations;
                }
            });
            const ret = [];
            mapping.forEach((value, ownerId) => {
                const cellRet = value.cell.deltaDecorations(value.oldDecorations, value.newDecorations);
                ret.push({
                    ownerId: ownerId,
                    decorations: cellRet
                });
            });
            return ret;
        }
        /**
         * Search in notebook text model
         * @param value
         */
        find(value) {
            const matches = [];
            this._viewCells.forEach(cell => {
                const cellMatches = cell.startFind(value);
                if (cellMatches) {
                    matches.push(cellMatches);
                }
            });
            return matches;
        }
        replaceOne(cell, range, text) {
            const viewCell = cell;
            this._lastNotebookEditResource.push(viewCell.uri);
            return viewCell.resolveTextModel().then(() => {
                this._bulkEditService.apply({ edits: [{ edit: { range: range, text: text }, resource: cell.uri }] }, { quotableLabel: 'Notebook Replace' });
            });
        }
        async replaceAll(matches, text) {
            if (!matches.length) {
                return;
            }
            let textEdits = [];
            this._lastNotebookEditResource.push(matches[0].cell.uri);
            matches.forEach(match => {
                match.matches.forEach(singleMatch => {
                    textEdits.push({
                        edit: { range: singleMatch.range, text: text },
                        resource: match.cell.uri
                    });
                });
            });
            return Promise.all(matches.map(match => {
                return match.cell.resolveTextModel();
            })).then(async () => {
                this._bulkEditService.apply({ edits: textEdits }, { quotableLabel: 'Notebook Replace All' });
                return;
            });
        }
        async undo() {
            await this._undoService.undo(this.uri);
        }
        async redo() {
            await this._undoService.redo(this.uri);
        }
        equal(notebook) {
            return this._notebook === notebook;
        }
        dispose() {
            this._localStore.clear();
            this._viewCells.forEach(cell => {
                cell.dispose();
            });
            super.dispose();
        }
    };
    NotebookViewModel = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, bulkEditService_1.IBulkEditService),
        __param(6, undoRedo_1.IUndoRedoService)
    ], NotebookViewModel);
    exports.NotebookViewModel = NotebookViewModel;
    function createCellViewModel(instantiationService, notebookViewModel, cell) {
        if (cell.cellKind === notebookCommon_1.CellKind.Code) {
            return instantiationService.createInstance(codeCellViewModel_1.CodeCellViewModel, notebookViewModel.viewType, cell, notebookViewModel.layoutInfo, notebookViewModel.eventDispatcher);
        }
        else {
            const mdRenderer = instantiationService.createInstance(mdRenderer_1.MarkdownRenderer, resources_1.dirname(notebookViewModel.uri));
            return instantiationService.createInstance(markdownCellViewModel_1.MarkdownCellViewModel, notebookViewModel.viewType, cell, notebookViewModel.layoutInfo, notebookViewModel, notebookViewModel.eventDispatcher, mdRenderer);
        }
    }
    exports.createCellViewModel = createCellViewModel;
});
//# __sourceMappingURL=notebookViewModel.js.map