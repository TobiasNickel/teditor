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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uuid", "vs/editor/common/services/resolverService", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/viewModel/baseCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher"], function (require, exports, event_1, UUID, resolverService_1, constants_1, baseCellViewModel_1, notebookCommon_1, eventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownCellViewModel = void 0;
    let MarkdownCellViewModel = class MarkdownCellViewModel extends baseCellViewModel_1.BaseCellViewModel {
        constructor(viewType, model, initialNotebookLayoutInfo, foldingDelegate, eventDispatcher, _mdRenderer, _modelService) {
            super(viewType, model, UUID.generateUuid());
            this.viewType = viewType;
            this.model = model;
            this.foldingDelegate = foldingDelegate;
            this.eventDispatcher = eventDispatcher;
            this._mdRenderer = _mdRenderer;
            this._modelService = _modelService;
            this.cellKind = notebookCommon_1.CellKind.Markdown;
            this._html = null;
            this._editorHeight = 0;
            this._onDidChangeLayout = new event_1.Emitter();
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this._layoutInfo = {
                editorHeight: 0,
                fontInfo: (initialNotebookLayoutInfo === null || initialNotebookLayoutInfo === void 0 ? void 0 : initialNotebookLayoutInfo.fontInfo) || null,
                editorWidth: (initialNotebookLayoutInfo === null || initialNotebookLayoutInfo === void 0 ? void 0 : initialNotebookLayoutInfo.width) ? this.computeEditorWidth(initialNotebookLayoutInfo.width) : 0,
                bottomToolbarOffset: constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT,
                totalHeight: 0
            };
            this._register(this.onDidChangeState(e => {
                eventDispatcher.emit([new eventDispatcher_1.NotebookCellStateChangedEvent(e, this)]);
            }));
        }
        get layoutInfo() {
            return this._layoutInfo;
        }
        set totalHeight(newHeight) {
            if (newHeight !== this.layoutInfo.totalHeight) {
                this.layoutChange({ totalHeight: newHeight });
            }
        }
        get totalHeight() {
            throw new Error('MarkdownCellViewModel.totalHeight is write only');
        }
        set editorHeight(newHeight) {
            this._editorHeight = newHeight;
            this.totalHeight = this._editorHeight + constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT + constants_1.CELL_STATUSBAR_HEIGHT;
        }
        get editorHeight() {
            throw new Error('MarkdownCellViewModel.editorHeight is write only');
        }
        get foldingState() {
            return this.foldingDelegate.getFoldingState(this.foldingDelegate.getCellIndex(this));
        }
        triggerfoldingStateChange() {
            this._onDidChangeState.fire({ foldingStateChanged: true });
        }
        computeEditorWidth(outerWidth) {
            return outerWidth - (constants_1.CELL_MARGIN * 2) - constants_1.CELL_RUN_GUTTER;
        }
        layoutChange(state) {
            // recompute
            const editorWidth = state.outerWidth !== undefined ? this.computeEditorWidth(state.outerWidth) : this._layoutInfo.editorWidth;
            this._layoutInfo = {
                fontInfo: state.font || this._layoutInfo.fontInfo,
                editorWidth,
                editorHeight: this._editorHeight,
                bottomToolbarOffset: constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT,
                totalHeight: state.totalHeight === undefined ? this._layoutInfo.totalHeight : state.totalHeight
            };
            this._onDidChangeLayout.fire(state);
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            super.restoreEditorViewState(editorViewStates);
            if (totalHeight !== undefined) {
                this._layoutInfo = {
                    fontInfo: this._layoutInfo.fontInfo,
                    editorWidth: this._layoutInfo.editorWidth,
                    bottomToolbarOffset: this._layoutInfo.bottomToolbarOffset,
                    totalHeight: totalHeight,
                    editorHeight: this._editorHeight
                };
            }
        }
        hasDynamicHeight() {
            return true;
        }
        getHeight(lineHeight) {
            if (this._layoutInfo.totalHeight === 0) {
                return 100;
            }
            else {
                return this._layoutInfo.totalHeight;
            }
        }
        clearHTML() {
            this._html = null;
        }
        getHTML() {
            if (this.cellKind === notebookCommon_1.CellKind.Markdown) {
                if (this._html) {
                    return this._html;
                }
                let renderer = this.getMarkdownRenderer();
                this._html = renderer.render({ value: this.getText(), isTrusted: true }).element;
                return this._html;
            }
            return null;
        }
        async resolveTextModel() {
            if (!this._textModel) {
                const ref = await this._modelService.createModelReference(this.model.uri);
                this._textModel = ref.object.textEditorModel;
                this._register(ref);
                this._register(this._textModel.onDidChangeContent(() => {
                    this._html = null;
                    this._onDidChangeState.fire({ contentChanged: true });
                }));
            }
            return this._textModel;
        }
        onDeselect() {
        }
        getMarkdownRenderer() {
            return this._mdRenderer;
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
    MarkdownCellViewModel = __decorate([
        __param(6, resolverService_1.ITextModelService)
    ], MarkdownCellViewModel);
    exports.MarkdownCellViewModel = MarkdownCellViewModel;
});
//# __sourceMappingURL=markdownCellViewModel.js.map