/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/contrib/folding/foldingRanges", "vs/editor/contrib/folding/syntaxRangeProvider", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, lifecycle_1, foldingRanges_1, syntaxRangeProvider_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFoldingState = exports.FoldingModel = void 0;
    class FoldingModel extends lifecycle_1.Disposable {
        constructor(
        // private readonly _notebookEditor: INotebookEditor
        ) {
            super();
            this._viewModel = null;
            this._viewModelStore = new lifecycle_1.DisposableStore();
            this._onDidFoldingRegionChanges = new event_1.Emitter();
            this.onDidFoldingRegionChanged = this._onDidFoldingRegionChanges.event;
            this._foldingRangeDecorationIds = [];
            this._regions = new foldingRanges_1.FoldingRegions(new Uint32Array(0), new Uint32Array(0));
        }
        get regions() {
            return this._regions;
        }
        detachViewModel() {
            this._viewModelStore.clear();
            this._viewModel = null;
        }
        attachViewModel(model) {
            this._viewModel = model;
            this._viewModelStore.add(this._viewModel.onDidChangeViewCells(() => {
                this.recompute();
            }));
            this._viewModelStore.add(this._viewModel.onDidChangeSelection(() => {
                const selectionHandles = this._viewModel.selectionHandles;
                const indexes = selectionHandles.map(handle => this._viewModel.getCellIndex(this._viewModel.getCellByHandle(handle)));
                let changed = false;
                indexes.forEach(index => {
                    let regionIndex = this.regions.findRange(index + 1);
                    while (regionIndex !== -1) {
                        if (this._regions.isCollapsed(regionIndex) && index > this._regions.getStartLineNumber(regionIndex) - 1) {
                            this._regions.setCollapsed(regionIndex, false);
                            changed = true;
                        }
                        regionIndex = this._regions.getParentIndex(regionIndex);
                    }
                });
                if (changed) {
                    this._onDidFoldingRegionChanges.fire();
                }
            }));
            this.recompute();
        }
        setCollapsed(index, newState) {
            this._regions.setCollapsed(index, newState);
        }
        recompute() {
            const cells = this._viewModel.viewCells;
            let stack = [];
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                    continue;
                }
                const content = cell.getText();
                const matches = content.match(/^[ \t]*(\#+)/gm);
                let min = 7;
                if (matches && matches.length) {
                    for (let j = 0; j < matches.length; j++) {
                        min = Math.min(min, matches[j].length);
                    }
                }
                if (min < 7) {
                    // header 1 to 6
                    stack.push({ index: i, level: min, endIndex: 0 });
                }
            }
            // calcualte folding ranges
            const rawFoldingRanges = stack.map((entry, startIndex) => {
                let end = undefined;
                for (let i = startIndex + 1; i < stack.length; ++i) {
                    if (stack[i].level <= entry.level) {
                        end = stack[i].index - 1;
                        break;
                    }
                }
                const endIndex = end !== undefined ? end : cells.length - 1;
                // one based
                return {
                    start: entry.index + 1,
                    end: endIndex + 1,
                    rank: 1
                };
            }).filter(range => range.start !== range.end);
            const newRegions = syntaxRangeProvider_1.sanitizeRanges(rawFoldingRanges, 5000);
            // restore collased state
            let i = 0;
            let nextCollapsed = () => {
                while (i < this._regions.length) {
                    let isCollapsed = this._regions.isCollapsed(i);
                    i++;
                    if (isCollapsed) {
                        return i - 1;
                    }
                }
                return -1;
            };
            let k = 0;
            let collapsedIndex = nextCollapsed();
            while (collapsedIndex !== -1 && k < newRegions.length) {
                // get the latest range
                let decRange = this._viewModel.getTrackedRange(this._foldingRangeDecorationIds[collapsedIndex]);
                if (decRange) {
                    let collasedStartIndex = decRange.start;
                    while (k < newRegions.length) {
                        let startIndex = newRegions.getStartLineNumber(k) - 1;
                        if (collasedStartIndex >= startIndex) {
                            newRegions.setCollapsed(k, collasedStartIndex === startIndex);
                            k++;
                        }
                        else {
                            break;
                        }
                    }
                }
                collapsedIndex = nextCollapsed();
            }
            while (k < newRegions.length) {
                newRegions.setCollapsed(k, false);
                k++;
            }
            const cellRanges = [];
            for (let i = 0; i < newRegions.length; i++) {
                const region = newRegions.toRegion(i);
                cellRanges.push({ start: region.startLineNumber - 1, end: region.endLineNumber - 1 });
            }
            // remove old tracked ranges and add new ones
            // TODO@rebornix, implement delta
            this._foldingRangeDecorationIds.forEach(id => this._viewModel.setTrackedRange(id, null, 3 /* GrowsOnlyWhenTypingAfter */));
            this._foldingRangeDecorationIds = cellRanges.map(region => this._viewModel.setTrackedRange(null, region, 3 /* GrowsOnlyWhenTypingAfter */)).filter(str => str !== null);
            this._regions = newRegions;
            this._onDidFoldingRegionChanges.fire();
        }
        getMemento() {
            const collapsedRanges = [];
            let i = 0;
            while (i < this._regions.length) {
                let isCollapsed = this._regions.isCollapsed(i);
                if (isCollapsed) {
                    const region = this._regions.toRegion(i);
                    collapsedRanges.push({ start: region.startLineNumber - 1, end: region.endLineNumber - 1 });
                }
                i++;
            }
            return collapsedRanges;
        }
        applyMemento(state) {
            let i = 0;
            let k = 0;
            while (k < state.length && i < this._regions.length) {
                // get the latest range
                let decRange = this._viewModel.getTrackedRange(this._foldingRangeDecorationIds[i]);
                if (decRange) {
                    let collasedStartIndex = state[k].start;
                    while (i < this._regions.length) {
                        let startIndex = this._regions.getStartLineNumber(i) - 1;
                        if (collasedStartIndex >= startIndex) {
                            this._regions.setCollapsed(i, collasedStartIndex === startIndex);
                            i++;
                        }
                        else {
                            break;
                        }
                    }
                }
                k++;
            }
            while (i < this._regions.length) {
                this._regions.setCollapsed(i, false);
                i++;
            }
            return true;
        }
    }
    exports.FoldingModel = FoldingModel;
    var CellFoldingState;
    (function (CellFoldingState) {
        CellFoldingState[CellFoldingState["None"] = 0] = "None";
        CellFoldingState[CellFoldingState["Expanded"] = 1] = "Expanded";
        CellFoldingState[CellFoldingState["Collapsed"] = 2] = "Collapsed";
    })(CellFoldingState = exports.CellFoldingState || (exports.CellFoldingState = {}));
});
//# __sourceMappingURL=foldingModel.js.map