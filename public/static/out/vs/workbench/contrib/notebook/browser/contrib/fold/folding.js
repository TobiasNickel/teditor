/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/contrib/fold/foldingModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/nls"], function (require, exports, lifecycle_1, notebookBrowser_1, DOM, foldingModel_1, notebookCommon_1, notebookEditorExtensions_1, actions_1, contextkey_1, contextkeys_1, editorService_1, coreActions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingController = void 0;
    class FoldingController extends lifecycle_1.Disposable {
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._foldingModel = null;
            this._localStore = new lifecycle_1.DisposableStore();
            this._register(this._notebookEditor.onMouseUp(e => { this.onMouseUp(e); }));
            this._register(this._notebookEditor.onDidChangeModel(() => {
                this._localStore.clear();
                if (!this._notebookEditor.viewModel) {
                    return;
                }
                this._localStore.add(this._notebookEditor.viewModel.eventDispatcher.onDidChangeCellState(e => {
                    var _a;
                    if (e.source.editStateChanged && e.cell.cellKind === notebookCommon_1.CellKind.Markdown) {
                        (_a = this._foldingModel) === null || _a === void 0 ? void 0 : _a.recompute();
                        // this._updateEditorFoldingRanges();
                    }
                }));
                this._foldingModel = new foldingModel_1.FoldingModel();
                this._localStore.add(this._foldingModel);
                this._foldingModel.attachViewModel(this._notebookEditor.viewModel);
                this._localStore.add(this._foldingModel.onDidFoldingRegionChanged(() => {
                    this._updateEditorFoldingRanges();
                }));
            }));
        }
        saveViewState() {
            var _a;
            return ((_a = this._foldingModel) === null || _a === void 0 ? void 0 : _a.getMemento()) || [];
        }
        restoreViewState(state) {
            var _a;
            (_a = this._foldingModel) === null || _a === void 0 ? void 0 : _a.applyMemento(state || []);
            this._updateEditorFoldingRanges();
        }
        setFoldingState(index, state) {
            if (!this._foldingModel) {
                return;
            }
            const range = this._foldingModel.regions.findRange(index + 1);
            const startIndex = this._foldingModel.regions.getStartLineNumber(range) - 1;
            if (startIndex !== index) {
                return;
            }
            this._foldingModel.setCollapsed(range, state === foldingModel_1.CellFoldingState.Collapsed);
            this._updateEditorFoldingRanges();
        }
        _updateEditorFoldingRanges() {
            if (!this._foldingModel) {
                return;
            }
            this._notebookEditor.viewModel.updateFoldingRanges(this._foldingModel.regions);
            const hiddenRanges = this._notebookEditor.viewModel.getHiddenRanges();
            this._notebookEditor.setHiddenAreas(hiddenRanges);
        }
        onMouseUp(e) {
            if (!e.event.target) {
                return;
            }
            const viewModel = this._notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            const target = e.event.target;
            if (DOM.hasClass(target, 'codicon-chevron-down') || DOM.hasClass(target, 'codicon-chevron-right')) {
                const parent = target.parentElement;
                if (!DOM.hasClass(parent, 'notebook-folding-indicator')) {
                    return;
                }
                // folding icon
                const cellViewModel = e.target;
                const modelIndex = viewModel.getCellIndex(cellViewModel);
                const state = viewModel.getFoldingState(modelIndex);
                if (state === foldingModel_1.CellFoldingState.None) {
                    return;
                }
                this.setFoldingState(modelIndex, state === foldingModel_1.CellFoldingState.Collapsed ? foldingModel_1.CellFoldingState.Expanded : foldingModel_1.CellFoldingState.Collapsed);
            }
            return;
        }
    }
    exports.FoldingController = FoldingController;
    FoldingController.id = 'workbench.notebook.findController';
    notebookEditorExtensions_1.registerNotebookContribution(FoldingController.id, FoldingController);
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.fold',
                title: nls_1.localize('fold.cell', 'Fold Cell'),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 15 /* LeftArrow */,
                    weight: 200 /* WorkbenchContrib */
                },
                precondition: notebookBrowser_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                f1: true
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = coreActions_1.getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const activeCell = editor.getActiveCell();
            if (!activeCell) {
                return;
            }
            const controller = editor.getContribution(FoldingController.id);
            const index = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells.indexOf(activeCell);
            if (index !== undefined) {
                controller.setFoldingState(index, foldingModel_1.CellFoldingState.Collapsed);
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.unfold',
                title: nls_1.localize('unfold.cell', 'Unfold Cell'),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 17 /* RightArrow */,
                    weight: 200 /* WorkbenchContrib */
                },
                precondition: notebookBrowser_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                f1: true
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = coreActions_1.getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const activeCell = editor.getActiveCell();
            if (!activeCell) {
                return;
            }
            const controller = editor.getContribution(FoldingController.id);
            const index = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.viewCells.indexOf(activeCell);
            if (index !== undefined) {
                controller.setFoldingState(index, foldingModel_1.CellFoldingState.Expanded);
            }
        }
    });
});
//# __sourceMappingURL=folding.js.map