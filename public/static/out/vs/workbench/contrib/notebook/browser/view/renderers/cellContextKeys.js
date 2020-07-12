/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/markdownCellViewModel", "vs/base/common/lifecycle"], function (require, exports, notebookCommon_1, notebookBrowser_1, codeCellViewModel_1, markdownCellViewModel_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellContextKeyManager = void 0;
    class CellContextKeyManager extends lifecycle_1.Disposable {
        constructor(contextKeyService, notebookTextModel, element) {
            super();
            this.contextKeyService = contextKeyService;
            this.notebookTextModel = notebookTextModel;
            this.element = element;
            this.elementDisposables = new lifecycle_1.DisposableStore();
            this.cellType = notebookBrowser_1.NOTEBOOK_CELL_TYPE.bindTo(this.contextKeyService);
            this.viewType = notebookBrowser_1.NOTEBOOK_VIEW_TYPE.bindTo(this.contextKeyService);
            this.cellEditable = notebookBrowser_1.NOTEBOOK_CELL_EDITABLE.bindTo(this.contextKeyService);
            this.cellRunnable = notebookBrowser_1.NOTEBOOK_CELL_RUNNABLE.bindTo(this.contextKeyService);
            this.markdownEditMode = notebookBrowser_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.bindTo(this.contextKeyService);
            this.cellRunState = notebookBrowser_1.NOTEBOOK_CELL_RUN_STATE.bindTo(this.contextKeyService);
            this.cellHasOutputs = notebookBrowser_1.NOTEBOOK_CELL_HAS_OUTPUTS.bindTo(this.contextKeyService);
            this.updateForElement(element);
        }
        updateForElement(element) {
            this.elementDisposables.clear();
            this.elementDisposables.add(element.onDidChangeState(e => this.onDidChangeState(e)));
            if (element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.elementDisposables.add(element.onDidChangeOutputs(() => this.updateForOutputs()));
            }
            this.element = element;
            if (this.element instanceof markdownCellViewModel_1.MarkdownCellViewModel) {
                this.cellType.set('markdown');
            }
            else if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellType.set('code');
            }
            this.updateForMetadata();
            this.updateForEditState();
            this.updateForOutputs();
            this.viewType.set(this.element.viewType);
        }
        onDidChangeState(e) {
            if (e.metadataChanged) {
                this.updateForMetadata();
            }
            if (e.editStateChanged) {
                this.updateForEditState();
            }
        }
        updateForMetadata() {
            var _a;
            const metadata = this.element.getEvaluatedMetadata(this.notebookTextModel.metadata);
            this.cellEditable.set(!!metadata.editable);
            this.cellRunnable.set(!!metadata.runnable);
            const runState = (_a = metadata.runState) !== null && _a !== void 0 ? _a : notebookCommon_1.NotebookCellRunState.Idle;
            this.cellRunState.set(notebookCommon_1.NotebookCellRunState[runState]);
        }
        updateForEditState() {
            if (this.element instanceof markdownCellViewModel_1.MarkdownCellViewModel) {
                this.markdownEditMode.set(this.element.editState === notebookBrowser_1.CellEditState.Editing);
            }
            else {
                this.markdownEditMode.set(false);
            }
        }
        updateForOutputs() {
            if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellHasOutputs.set(this.element.outputs.length > 0);
            }
            else {
                this.cellHasOutputs.set(false);
            }
        }
    }
    exports.CellContextKeyManager = CellContextKeyManager;
});
//# __sourceMappingURL=cellContextKeys.js.map