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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditorWidget", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/contrib/fold/foldingModel", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/notebook/browser/view/renderers/sizeObserver"], function (require, exports, dom_1, async_1, cancellation_1, codicons_1, lifecycle_1, codeEditorWidget_1, instantiation_1, constants_1, notebookBrowser_1, foldingModel_1, contextkey_1, serviceCollection_1, editorContextKeys_1, sizeObserver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatefullMarkdownCell = void 0;
    let StatefullMarkdownCell = class StatefullMarkdownCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, editorOptions, renderedEditors, contextKeyService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.editorOptions = editorOptions;
            this.renderedEditors = renderedEditors;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.editor = null;
            this.localDisposables = new lifecycle_1.DisposableStore();
            this.markdownContainer = templateData.cellContainer;
            this.editorPart = templateData.editorPart;
            this._register(this.localDisposables);
            this._register(lifecycle_1.toDisposable(() => renderedEditors.delete(this.viewCell)));
            this._register(viewCell.onDidChangeState((e) => {
                if (e.editStateChanged) {
                    this.localDisposables.clear();
                    this.viewUpdate();
                }
                else if (e.contentChanged) {
                    this.viewUpdate();
                }
            }));
            this._register(sizeObserver_1.getResizesObserver(this.markdownContainer, undefined, () => {
                if (viewCell.editState === notebookBrowser_1.CellEditState.Preview) {
                    this.viewCell.totalHeight = templateData.container.clientHeight;
                }
            })).startObserving();
            const updateForFocusMode = () => {
                if (viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                    this.focusEditorIfNeeded();
                }
                dom_1.toggleClass(templateData.container, 'cell-editor-focus', viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
            };
            this._register(viewCell.onDidChangeState((e) => {
                if (!e.focusModeChanged) {
                    return;
                }
                updateForFocusMode();
            }));
            updateForFocusMode();
            this.foldingState = viewCell.foldingState;
            this.setFoldingIndicator();
            this._register(viewCell.onDidChangeState((e) => {
                if (!e.foldingStateChanged) {
                    return;
                }
                const foldingState = viewCell.foldingState;
                if (foldingState !== this.foldingState) {
                    this.foldingState = foldingState;
                    this.setFoldingIndicator();
                }
            }));
            this._register(viewCell.onDidChangeLayout((e) => {
                var _a;
                const layoutInfo = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.getLayoutInfo();
                if (e.outerWidth && layoutInfo && layoutInfo.width !== viewCell.layoutInfo.editorWidth) {
                    this.onCellWidthChange();
                }
                else if (e.totalHeight) {
                    this.relayoutCell();
                }
            }));
            this.viewUpdate();
        }
        viewUpdate() {
            if (this.viewCell.editState === notebookBrowser_1.CellEditState.Editing) {
                this.viewUpdateEditing();
            }
            else {
                this.viewUpdatePreview();
            }
        }
        viewUpdateEditing() {
            var _a;
            // switch to editing mode
            let editorHeight;
            dom_1.show(this.editorPart);
            dom_1.hide(this.markdownContainer);
            if (this.editor) {
                editorHeight = this.editor.getContentHeight();
                // not first time, we don't need to create editor or bind listeners
                this.viewCell.attachTextEditor(this.editor);
                this.focusEditorIfNeeded();
                this.bindEditorListeners();
            }
            else {
                const width = this.viewCell.layoutInfo.editorWidth;
                const lineNum = this.viewCell.lineCount;
                const lineHeight = ((_a = this.viewCell.layoutInfo.fontInfo) === null || _a === void 0 ? void 0 : _a.lineHeight) || 17;
                editorHeight = Math.max(lineNum, 1) * lineHeight + constants_1.EDITOR_TOP_PADDING + constants_1.EDITOR_BOTTOM_PADDING;
                this.templateData.editorContainer.innerHTML = '';
                // create a special context key service that set the inCompositeEditor-contextkey
                const editorContextKeyService = this.contextKeyService.createScoped();
                const editorInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorContextKeyService]));
                editorContextKeys_1.EditorContextKeys.inCompositeEditor.bindTo(editorContextKeyService).set(true);
                this.editor = editorInstaService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.templateData.editorContainer, Object.assign(Object.assign({}, this.editorOptions), { dimension: {
                        width: width,
                        height: editorHeight
                    } }), {});
                this.templateData.currentEditor = this.editor;
                const cts = new cancellation_1.CancellationTokenSource();
                this._register({ dispose() { cts.dispose(true); } });
                async_1.raceCancellation(this.viewCell.resolveTextModel(), cts.token).then(model => {
                    if (!model) {
                        return;
                    }
                    this.editor.setModel(model);
                    this.focusEditorIfNeeded();
                    const realContentHeight = this.editor.getContentHeight();
                    if (realContentHeight !== editorHeight) {
                        this.editor.layout({
                            width: width,
                            height: realContentHeight
                        });
                        editorHeight = realContentHeight;
                    }
                    this.viewCell.attachTextEditor(this.editor);
                    if (this.viewCell.editState === notebookBrowser_1.CellEditState.Editing) {
                        this.focusEditorIfNeeded();
                    }
                    this.bindEditorListeners();
                    this.viewCell.editorHeight = editorHeight;
                });
            }
            this.viewCell.editorHeight = editorHeight;
            this.focusEditorIfNeeded();
            this.renderedEditors.set(this.viewCell, this.editor);
        }
        viewUpdatePreview() {
            this.viewCell.detachTextEditor();
            dom_1.hide(this.editorPart);
            dom_1.show(this.markdownContainer);
            this.renderedEditors.delete(this.viewCell);
            this.markdownContainer.innerHTML = '';
            let markdownRenderer = this.viewCell.getMarkdownRenderer();
            let renderedHTML = this.viewCell.getHTML();
            if (renderedHTML) {
                this.markdownContainer.appendChild(renderedHTML);
            }
            if (this.editor) {
                // switch from editing mode
                const clientHeight = this.templateData.container.clientHeight;
                this.viewCell.totalHeight = clientHeight;
                this.notebookEditor.layoutNotebookCell(this.viewCell, clientHeight);
            }
            else {
                // first time, readonly mode
                this.localDisposables.add(markdownRenderer.onDidUpdateRender(() => {
                    const clientHeight = this.templateData.container.clientHeight;
                    this.viewCell.totalHeight = clientHeight;
                    this.notebookEditor.layoutNotebookCell(this.viewCell, clientHeight);
                }));
                this.localDisposables.add(this.viewCell.textBuffer.onDidChangeContent(() => {
                    this.markdownContainer.innerHTML = '';
                    this.viewCell.clearHTML();
                    let renderedHTML = this.viewCell.getHTML();
                    if (renderedHTML) {
                        this.markdownContainer.appendChild(renderedHTML);
                    }
                }));
                const clientHeight = this.templateData.container.clientHeight;
                this.viewCell.totalHeight = clientHeight;
                this.notebookEditor.layoutNotebookCell(this.viewCell, clientHeight);
            }
        }
        focusEditorIfNeeded() {
            var _a;
            if (this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                (_a = this.editor) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }
        layoutEditor(dimension) {
            var _a;
            (_a = this.editor) === null || _a === void 0 ? void 0 : _a.layout(dimension);
            this.templateData.statusBarContainer.style.width = `${dimension.width}px`;
        }
        onCellWidthChange() {
            const realContentHeight = this.editor.getContentHeight();
            this.layoutEditor({
                width: this.viewCell.layoutInfo.editorWidth,
                height: realContentHeight
            });
            this.viewCell.editorHeight = realContentHeight;
            this.relayoutCell();
        }
        relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        updateEditorOptions(newValue) {
            this.editorOptions = newValue;
            if (this.editor) {
                this.editor.updateOptions(this.editorOptions);
            }
        }
        setFoldingIndicator() {
            switch (this.foldingState) {
                case foldingModel_1.CellFoldingState.None:
                    this.templateData.foldingIndicator.innerHTML = '';
                    break;
                case foldingModel_1.CellFoldingState.Collapsed:
                    this.templateData.foldingIndicator.innerHTML = codicons_1.renderCodicons('$(chevron-right)');
                    break;
                case foldingModel_1.CellFoldingState.Expanded:
                    this.templateData.foldingIndicator.innerHTML = codicons_1.renderCodicons('$(chevron-down)');
                    break;
                default:
                    break;
            }
        }
        bindEditorListeners() {
            this.localDisposables.add(this.editor.onDidContentSizeChange(e => {
                let viewLayout = this.editor.getLayoutInfo();
                if (e.contentHeightChanged) {
                    this.editor.layout({
                        width: viewLayout.width,
                        height: e.contentHeight
                    });
                    this.viewCell.editorHeight = e.contentHeight;
                }
            }));
            this.localDisposables.add(this.editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState') {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const primarySelection = this.editor.getSelection();
                if (primarySelection) {
                    this.notebookEditor.revealLineInViewAsync(this.viewCell, primarySelection.positionLineNumber);
                }
            }));
            const updateFocusMode = () => this.viewCell.focusMode = this.editor.hasWidgetFocus() ? notebookBrowser_1.CellFocusMode.Editor : notebookBrowser_1.CellFocusMode.Container;
            this.localDisposables.add(this.editor.onDidFocusEditorWidget(() => {
                updateFocusMode();
            }));
            this.localDisposables.add(this.editor.onDidBlurEditorWidget(() => {
                updateFocusMode();
            }));
            updateFocusMode();
        }
        dispose() {
            this.viewCell.detachTextEditor();
            super.dispose();
        }
    };
    StatefullMarkdownCell = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, instantiation_1.IInstantiationService)
    ], StatefullMarkdownCell);
    exports.StatefullMarkdownCell = StatefullMarkdownCell;
});
//# __sourceMappingURL=markdownCell.js.map