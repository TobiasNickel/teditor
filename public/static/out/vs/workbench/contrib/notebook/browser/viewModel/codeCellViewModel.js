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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uuid", "vs/editor/common/services/resolverService", "vs/editor/common/viewModel/prefixSumComputer", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "./baseCellViewModel"], function (require, exports, event_1, UUID, resolverService_1, prefixSumComputer_1, constants_1, notebookBrowser_1, notebookCommon_1, baseCellViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellViewModel = void 0;
    let CodeCellViewModel = class CodeCellViewModel extends baseCellViewModel_1.BaseCellViewModel {
        constructor(viewType, model, initialNotebookLayoutInfo, eventDispatcher, _modelService) {
            super(viewType, model, UUID.generateUuid());
            this.viewType = viewType;
            this.model = model;
            this.eventDispatcher = eventDispatcher;
            this._modelService = _modelService;
            this.cellKind = notebookCommon_1.CellKind.Code;
            this._onDidChangeOutputs = new event_1.Emitter();
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._outputCollection = [];
            this._selfSizeMonitoring = false;
            this._outputsTop = null;
            this._onDidChangeLayout = new event_1.Emitter();
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._editorHeight = 0;
            this._hoveringOutput = false;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this._register(this.model.onDidChangeOutputs((splices) => {
                this._outputCollection = new Array(this.model.outputs.length);
                this._outputsTop = null;
                this._onDidChangeOutputs.fire(splices);
            }));
            this._outputCollection = new Array(this.model.outputs.length);
            this._layoutInfo = {
                fontInfo: (initialNotebookLayoutInfo === null || initialNotebookLayoutInfo === void 0 ? void 0 : initialNotebookLayoutInfo.fontInfo) || null,
                editorHeight: 0,
                editorWidth: initialNotebookLayoutInfo ? this.computeEditorWidth(initialNotebookLayoutInfo.width) : 0,
                outputContainerOffset: 0,
                outputTotalHeight: 0,
                totalHeight: 0,
                indicatorHeight: 0,
                bottomToolbarOffset: 0
            };
        }
        set selfSizeMonitoring(newVal) {
            this._selfSizeMonitoring = newVal;
        }
        get selfSizeMonitoring() {
            return this._selfSizeMonitoring;
        }
        get outputs() {
            return this.model.outputs;
        }
        set editorHeight(height) {
            this._editorHeight = height;
            this.layoutChange({ editorHeight: true });
        }
        get editorHeight() {
            return this._editorHeight;
        }
        get outputIsHovered() {
            return this._hoveringOutput;
        }
        set outputIsHovered(v) {
            this._hoveringOutput = v;
            this._onDidChangeState.fire({ outputIsHoveredChanged: true });
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        computeEditorWidth(outerWidth) {
            return outerWidth - (constants_1.CELL_MARGIN * 2 + constants_1.CELL_RUN_GUTTER);
        }
        layoutChange(state) {
            var _a;
            // recompute
            this._ensureOutputsTop();
            const outputTotalHeight = this._outputsTop.getTotalValue();
            const totalHeight = constants_1.EDITOR_TOOLBAR_HEIGHT + this.editorHeight + constants_1.EDITOR_TOP_MARGIN + outputTotalHeight + constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT + constants_1.CELL_STATUSBAR_HEIGHT;
            const indicatorHeight = this.editorHeight + constants_1.CELL_STATUSBAR_HEIGHT + outputTotalHeight;
            const outputContainerOffset = constants_1.EDITOR_TOOLBAR_HEIGHT + constants_1.EDITOR_TOP_MARGIN + this.editorHeight + constants_1.CELL_STATUSBAR_HEIGHT;
            const bottomToolbarOffset = totalHeight - constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT;
            const editorWidth = state.outerWidth !== undefined ? this.computeEditorWidth(state.outerWidth) : (_a = this._layoutInfo) === null || _a === void 0 ? void 0 : _a.editorWidth;
            this._layoutInfo = {
                fontInfo: state.font || null,
                editorHeight: this._editorHeight,
                editorWidth,
                outputContainerOffset,
                outputTotalHeight,
                totalHeight,
                indicatorHeight,
                bottomToolbarOffset: bottomToolbarOffset
            };
            if (state.editorHeight || state.outputHeight) {
                state.totalHeight = true;
            }
            this._fireOnDidChangeLayout(state);
        }
        _fireOnDidChangeLayout(state) {
            this._onDidChangeLayout.fire(state);
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            super.restoreEditorViewState(editorViewStates);
            if (totalHeight !== undefined) {
                this._layoutInfo = {
                    fontInfo: this._layoutInfo.fontInfo,
                    editorHeight: this._layoutInfo.editorHeight,
                    editorWidth: this._layoutInfo.editorWidth,
                    outputContainerOffset: this._layoutInfo.outputContainerOffset,
                    outputTotalHeight: this._layoutInfo.outputTotalHeight,
                    totalHeight: totalHeight,
                    indicatorHeight: this._layoutInfo.indicatorHeight,
                    bottomToolbarOffset: this._layoutInfo.bottomToolbarOffset
                };
            }
        }
        hasDynamicHeight() {
            if (this.selfSizeMonitoring) {
                // if there is an output rendered in the webview, it should always be false
                return false;
            }
            if (this.outputs && this.outputs.length > 0) {
                // if it contains output, it will be marked as dynamic height
                // thus when it's being rendered, the list view will `probeHeight`
                // inside which, we will check domNode's height directly instead of doing another `renderElement` with height undefined.
                return true;
            }
            else {
                return false;
            }
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.totalHeight === 0) {
                return constants_1.EDITOR_TOOLBAR_HEIGHT + constants_1.EDITOR_TOP_MARGIN + this.lineCount * lineHeight + constants_1.EDITOR_TOP_PADDING + constants_1.EDITOR_BOTTOM_PADDING + constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT;
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        /**
         * Text model is used for editing.
         */
        async resolveTextModel() {
            if (!this._textModel) {
                const ref = await this._modelService.createModelReference(this.model.uri);
                this._textModel = ref.object.textEditorModel;
                this._register(ref);
                this._register(this._textModel.onDidChangeContent(() => {
                    this.editState = notebookBrowser_1.CellEditState.Editing;
                    this._onDidChangeState.fire({ contentChanged: true });
                }));
            }
            return this._textModel;
        }
        onDeselect() {
            this.editState = notebookBrowser_1.CellEditState.Preview;
        }
        updateOutputHeight(index, height) {
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            this._outputCollection[index] = height;
            this._ensureOutputsTop();
            this._outputsTop.changeValue(index, height);
            this.layoutChange({ outputHeight: true });
        }
        getOutputOffsetInContainer(index) {
            this._ensureOutputsTop();
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            return this._outputsTop.getAccumulatedValue(index - 1);
        }
        getOutputOffset(index) {
            return this.layoutInfo.outputContainerOffset + this.getOutputOffsetInContainer(index);
        }
        spliceOutputHeights(start, deleteCnt, heights) {
            this._ensureOutputsTop();
            this._outputsTop.removeValues(start, deleteCnt);
            if (heights.length) {
                const values = new Uint32Array(heights.length);
                for (let i = 0; i < heights.length; i++) {
                    values[i] = heights[i];
                }
                this._outputsTop.insertValues(start, values);
            }
            this.layoutChange({ outputHeight: true });
        }
        _ensureOutputsTop() {
            if (!this._outputsTop) {
                const values = new Uint32Array(this._outputCollection.length);
                for (let i = 0; i < this._outputCollection.length; i++) {
                    values[i] = this._outputCollection[i];
                }
                this._outputsTop = new prefixSumComputer_1.PrefixSumComputer(values);
            }
        }
        startFind(value) {
            const matches = super.cellStartFind(value);
            if (matches === null) {
                return null;
            }
            return {
                cell: this,
                matches
            };
        }
    };
    CodeCellViewModel = __decorate([
        __param(4, resolverService_1.ITextModelService)
    ], CodeCellViewModel);
    exports.CodeCellViewModel = CodeCellViewModel;
});
//# __sourceMappingURL=codeCellViewModel.js.map