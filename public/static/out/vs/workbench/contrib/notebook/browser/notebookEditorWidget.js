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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/fontInfo", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/output/outputRenderer", "vs/workbench/contrib/notebook/browser/view/renderers/backLayerWebView", "vs/workbench/contrib/notebook/browser/view/renderers/cellRenderer", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/layout/browser/layoutService", "vs/base/common/uuid", "vs/workbench/common/memento", "vs/base/common/uri", "vs/workbench/common/theme", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/notebook/browser/view/renderers/cellContextKeys", "vs/css!./media/notebook"], function (require, exports, browser_1, DOM, cancellation_1, color_1, errors_1, event_1, lifecycle_1, fontInfo_1, nls, configuration_1, contextkey_1, instantiation_1, storage_1, colorRegistry_1, themeService_1, baseEditor_1, editor_1, constants_1, notebookBrowser_1, notebookEditorExtensions_1, notebookCellList_1, outputRenderer_1, backLayerWebView_1, cellRenderer_1, eventDispatcher_1, notebookViewModel_1, notebookCommon_1, notebookService_1, layoutService_1, uuid_1, memento_1, uri_1, theme_1, debugToolBar_1, cellContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cellStatusBarItemHover = exports.CELL_TOOLBAR_SEPERATOR = exports.notebookOutputContainerColor = exports.cellStatusIconRunning = exports.cellStatusIconError = exports.cellStatusIconSuccess = exports.focusedEditorIndicator = exports.focusedCellIndicator = exports.notebookCellBorder = exports.NotebookEditorWidget = exports.NotebookEditorOptions = void 0;
    const $ = DOM.$;
    class NotebookEditorOptions extends editor_1.EditorOptions {
        constructor(options) {
            super();
            this.overwrite(options);
            this.cellOptions = options.cellOptions;
        }
        with(options) {
            return new NotebookEditorOptions(Object.assign(Object.assign({}, this), options));
        }
    }
    exports.NotebookEditorOptions = NotebookEditorOptions;
    let NotebookEditorWidget = class NotebookEditorWidget extends lifecycle_1.Disposable {
        constructor(instantiationService, storageService, notebookService, configurationService, contextKeyService, layoutService) {
            super();
            this.instantiationService = instantiationService;
            this.notebookService = notebookService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
            this._webview = null;
            this._webviewTransparentCover = null;
            this._dndController = null;
            this._renderedEditors = new Map();
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._dimension = null;
            this._shadowElementViewInfo = null;
            this._editorFocus = null;
            this._outputFocus = null;
            this._editorEditable = null;
            this._editorRunnable = null;
            this._editorExecutingNotebook = null;
            this._notebookHasMultipleKernels = null;
            this._onDidFocusEmitter = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocusEmitter.event;
            this._cellContextKeyManager = null;
            this._isVisible = false;
            this._uuid = uuid_1.generateUuid();
            this._isDisposed = false;
            this._onDidChangeModel = new event_1.Emitter();
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidFocusEditorWidget = new event_1.Emitter();
            this.onDidFocusEditorWidget = this._onDidFocusEditorWidget.event;
            this._activeKernel = undefined;
            this._onDidChangeKernel = new event_1.Emitter();
            this.onDidChangeKernel = this._onDidChangeKernel.event;
            this._onDidChangeActiveEditor = this._register(new event_1.Emitter());
            this.onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;
            //#endregion
            //#region Mouse Events
            this._onMouseUp = this._register(new event_1.Emitter());
            this.onMouseUp = this._onMouseUp.event;
            this._onMouseDown = this._register(new event_1.Emitter());
            this.onMouseDown = this._onMouseDown.event;
            this.pendingLayouts = new WeakMap();
            this._memento = new memento_1.Memento(NotebookEditorWidget.ID, storageService);
            this._outputRenderer = new outputRenderer_1.OutputRenderer(this, this.instantiationService);
            this._contributions = {};
            this._scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.scrollBeyondLastLine')) {
                    this._scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
                    if (this._dimension && this._isVisible) {
                        this.layout(this._dimension);
                    }
                }
            });
            this.notebookService.addNotebookEditor(this);
        }
        get isDisposed() {
            return this._isDisposed;
        }
        set viewModel(newModel) {
            this._notebookViewModel = newModel;
            this._onDidChangeModel.fire(newModel === null || newModel === void 0 ? void 0 : newModel.notebookDocument);
        }
        get viewModel() {
            return this._notebookViewModel;
        }
        get uri() {
            var _a;
            return (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.uri;
        }
        get textModel() {
            var _a;
            return (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.notebookDocument;
        }
        get activeKernel() {
            return this._activeKernel;
        }
        set activeKernel(kernel) {
            if (this._isDisposed) {
                return;
            }
            this._activeKernel = kernel;
            this._onDidChangeKernel.fire();
        }
        get activeCodeEditor() {
            if (this._isDisposed) {
                return;
            }
            const [focused] = this._list.getFocusedElements();
            return this._renderedEditors.get(focused);
        }
        getId() {
            return this._uuid;
        }
        hasModel() {
            return !!this._notebookViewModel;
        }
        //#region Editor Core
        getEditorMemento(editorGroupService, key, limit = 10) {
            const mementoKey = `${NotebookEditorWidget.ID}${key}`;
            let editorMemento = NotebookEditorWidget.EDITOR_MEMENTOS.get(mementoKey);
            if (!editorMemento) {
                editorMemento = new baseEditor_1.EditorMemento(NotebookEditorWidget.ID, key, this.getMemento(1 /* WORKSPACE */), limit, editorGroupService);
                NotebookEditorWidget.EDITOR_MEMENTOS.set(mementoKey, editorMemento);
            }
            return editorMemento;
        }
        getMemento(scope) {
            return this._memento.getMemento(scope);
        }
        get isNotebookEditor() {
            return true;
        }
        updateEditorFocus() {
            var _a;
            // Note - focus going to the webview will fire 'blur', but the webview element will be
            // a descendent of the notebook editor root.
            (_a = this._editorFocus) === null || _a === void 0 ? void 0 : _a.set(DOM.isAncestor(document.activeElement, this._overlayContainer));
        }
        hasFocus() {
            var _a;
            return ((_a = this._editorFocus) === null || _a === void 0 ? void 0 : _a.get()) || false;
        }
        createEditor() {
            this._overlayContainer = document.createElement('div');
            const id = uuid_1.generateUuid();
            this._overlayContainer.id = `notebook-${id}`;
            this._overlayContainer.className = 'notebookOverlay';
            DOM.addClass(this._overlayContainer, 'notebook-editor');
            this._overlayContainer.style.visibility = 'hidden';
            this.layoutService.container.appendChild(this._overlayContainer);
            this._createBody(this._overlayContainer);
            this._generateFontInfo();
            this._editorFocus = notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED.bindTo(this.contextKeyService);
            this._editorFocus.set(true);
            this._isVisible = true;
            this._outputFocus = notebookBrowser_1.NOTEBOOK_OUTPUT_FOCUSED.bindTo(this.contextKeyService);
            this._editorEditable = notebookBrowser_1.NOTEBOOK_EDITOR_EDITABLE.bindTo(this.contextKeyService);
            this._editorEditable.set(true);
            this._editorRunnable = notebookBrowser_1.NOTEBOOK_EDITOR_RUNNABLE.bindTo(this.contextKeyService);
            this._editorRunnable.set(true);
            this._editorExecutingNotebook = notebookBrowser_1.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK.bindTo(this.contextKeyService);
            this._notebookHasMultipleKernels = notebookBrowser_1.NOTEBOOK_HAS_MULTIPLE_KERNELS.bindTo(this.contextKeyService);
            this._notebookHasMultipleKernels.set(false);
            const contributions = notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getEditorContributions();
            for (const desc of contributions) {
                try {
                    const contribution = this.instantiationService.createInstance(desc.ctor, this);
                    this._contributions[desc.id] = contribution;
                }
                catch (err) {
                    errors_1.onUnexpectedError(err);
                }
            }
        }
        _generateFontInfo() {
            const editorOptions = this.configurationService.getValue('editor');
            this._fontInfo = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.getZoomLevel());
        }
        _createBody(parent) {
            this._body = document.createElement('div');
            DOM.addClass(this._body, 'cell-list-container');
            this._createCellList();
            DOM.append(parent, this._body);
        }
        _createCellList() {
            DOM.addClass(this._body, 'cell-list-container');
            this._dndController = this._register(new cellRenderer_1.CellDragAndDropController(this, this._body));
            const getScopedContextKeyService = (container) => this._list.contextKeyService.createScoped(container);
            const renderers = [
                this.instantiationService.createInstance(cellRenderer_1.CodeCellRenderer, this, this._renderedEditors, this._dndController, getScopedContextKeyService),
                this.instantiationService.createInstance(cellRenderer_1.MarkdownCellRenderer, this, this._dndController, this._renderedEditors, getScopedContextKeyService),
            ];
            this._list = this.instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', this._body, this.instantiationService.createInstance(cellRenderer_1.NotebookCellListDelegate), renderers, this.contextKeyService, {
                setRowLineHeight: false,
                setRowHeight: false,
                supportDynamicHeights: true,
                horizontalScrolling: false,
                keyboardSupport: false,
                mouseSupport: true,
                multipleSelectionSupport: false,
                enableKeyboardNavigation: true,
                additionalScrollHeight: 0,
                transformOptimization: false,
                styleController: (_suffix) => { return this._list; },
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground,
                    listActiveSelectionBackground: colorRegistry_1.editorBackground,
                    listActiveSelectionForeground: colorRegistry_1.foreground,
                    listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                    listFocusAndSelectionForeground: colorRegistry_1.foreground,
                    listFocusBackground: colorRegistry_1.editorBackground,
                    listFocusForeground: colorRegistry_1.foreground,
                    listHoverForeground: colorRegistry_1.foreground,
                    listHoverBackground: colorRegistry_1.editorBackground,
                    listHoverOutline: colorRegistry_1.focusBorder,
                    listFocusOutline: colorRegistry_1.focusBorder,
                    listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                    listInactiveSelectionForeground: colorRegistry_1.foreground,
                    listInactiveFocusBackground: colorRegistry_1.editorBackground,
                    listInactiveFocusOutline: colorRegistry_1.editorBackground,
                },
                accessibilityProvider: {
                    getAriaLabel() { return null; },
                    getWidgetAriaLabel() {
                        return nls.localize('notebookTreeAriaLabel', "Notebook");
                    }
                }
            });
            this._dndController.setList(this._list);
            // create Webview
            this._register(this._list);
            this._register(lifecycle_1.combinedDisposable(...renderers));
            // transparent cover
            this._webviewTransparentCover = DOM.append(this._list.rowsContainer, $('.webview-cover'));
            this._webviewTransparentCover.style.display = 'none';
            this._register(DOM.addStandardDisposableGenericMouseDownListner(this._overlayContainer, (e) => {
                if (DOM.hasClass(e.target, 'slider') && this._webviewTransparentCover) {
                    this._webviewTransparentCover.style.display = 'block';
                }
            }));
            this._register(DOM.addStandardDisposableGenericMouseUpListner(this._overlayContainer, () => {
                if (this._webviewTransparentCover) {
                    // no matter when
                    this._webviewTransparentCover.style.display = 'none';
                }
            }));
            this._register(this._list.onMouseDown(e => {
                if (e.element) {
                    this._onMouseDown.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onMouseUp(e => {
                if (e.element) {
                    this._onMouseUp.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onDidChangeFocus(_e => this._onDidChangeActiveEditor.fire(this)));
            const widgetFocusTracker = DOM.trackFocus(this.getDomNode());
            this._register(widgetFocusTracker);
            this._register(widgetFocusTracker.onDidFocus(() => this._onDidFocusEmitter.fire()));
        }
        getDomNode() {
            return this._overlayContainer;
        }
        onWillHide() {
            var _a;
            this._isVisible = false;
            (_a = this._editorFocus) === null || _a === void 0 ? void 0 : _a.set(false);
            this._overlayContainer.style.visibility = 'hidden';
            this._overlayContainer.style.left = '-50000px';
        }
        getInnerWebview() {
            var _a;
            return (_a = this._webview) === null || _a === void 0 ? void 0 : _a.webview;
        }
        focus() {
            var _a, _b;
            this._isVisible = true;
            (_a = this._editorFocus) === null || _a === void 0 ? void 0 : _a.set(true);
            (_b = this._list) === null || _b === void 0 ? void 0 : _b.domFocus();
            this._onDidFocusEditorWidget.fire();
        }
        async setModel(textModel, viewState) {
            var _a;
            if (this._notebookViewModel === undefined || !this._notebookViewModel.equal(textModel)) {
                this._detachModel();
                await this._attachModel(textModel, viewState);
            }
            // clear state
            (_a = this._dndController) === null || _a === void 0 ? void 0 : _a.clearGlobalDragState();
            this._setKernels(textModel);
            this._localStore.add(this.notebookService.onDidChangeKernels(() => {
                if (this.activeKernel === undefined) {
                    this._setKernels(textModel);
                }
            }));
            this._localStore.add(this._list.onDidChangeFocus(() => {
                const focused = this._list.getFocusedElements()[0];
                if (focused) {
                    if (!this._cellContextKeyManager) {
                        this._cellContextKeyManager = this._localStore.add(new cellContextKeys_1.CellContextKeyManager(this.contextKeyService, textModel, focused));
                    }
                    this._cellContextKeyManager.updateForElement(focused);
                }
            }));
        }
        async setOptions(options) {
            var _a, _b;
            // reveal cell if editor options tell to do so
            if (options === null || options === void 0 ? void 0 : options.cellOptions) {
                const cellOptions = options.cellOptions;
                const cell = this._notebookViewModel.viewCells.find(cell => cell.uri.toString() === cellOptions.resource.toString());
                if (cell) {
                    this.selectElement(cell);
                    this.revealInCenterIfOutsideViewport(cell);
                    const editor = this._renderedEditors.get(cell);
                    if (editor) {
                        if ((_a = cellOptions.options) === null || _a === void 0 ? void 0 : _a.selection) {
                            const { selection } = cellOptions.options;
                            editor.setSelection(Object.assign(Object.assign({}, selection), { endLineNumber: selection.endLineNumber || selection.startLineNumber, endColumn: selection.endColumn || selection.startColumn }));
                            editor.revealPositionInCenterIfOutsideViewport({
                                lineNumber: selection.startLineNumber,
                                column: selection.startColumn
                            });
                        }
                        if (!((_b = cellOptions.options) === null || _b === void 0 ? void 0 : _b.preserveFocus)) {
                            editor.focus();
                        }
                    }
                }
            }
            else if (this._notebookViewModel.viewCells.length === 1 && this._notebookViewModel.viewCells[0].cellKind === notebookCommon_1.CellKind.Code) {
                // there is only one code cell in the document
                const cell = this._notebookViewModel.viewCells[0];
                if (cell.getTextLength() === 0) {
                    // the cell is empty, very likely a template cell, focus it
                    this.selectElement(cell);
                    await this.revealLineInCenterAsync(cell, 1);
                    const editor = this._renderedEditors.get(cell);
                    if (editor) {
                        editor.focus();
                    }
                }
            }
        }
        _detachModel() {
            var _a, _b, _c, _d, _f;
            this._localStore.clear();
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.detachViewModel();
            (_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.dispose();
            // avoid event
            this._notebookViewModel = undefined;
            // this.webview?.clearInsets();
            // this.webview?.clearPreloadsCache();
            (_c = this._webview) === null || _c === void 0 ? void 0 : _c.dispose();
            (_d = this._webview) === null || _d === void 0 ? void 0 : _d.element.remove();
            this._webview = null;
            (_f = this._list) === null || _f === void 0 ? void 0 : _f.clear();
        }
        _setKernels(textModel) {
            const provider = this.notebookService.getContributedNotebookProviders(this.viewModel.uri)[0];
            const availableKernels = this.notebookService.getContributedNotebookKernels(textModel.viewType, textModel.uri);
            if (provider.kernel && availableKernels.length > 0) {
                this._notebookHasMultipleKernels.set(true);
            }
            else if (availableKernels.length > 1) {
                this._notebookHasMultipleKernels.set(true);
            }
            else {
                this._notebookHasMultipleKernels.set(false);
            }
            if (provider && provider.kernel) {
                // it has a builtin kernel, don't automatically choose a kernel
                this._loadKernelPreloads(provider.providerExtensionLocation, provider.kernel);
                return;
            }
            // the provider doesn't have a builtin kernel, choose a kernel
            this.activeKernel = availableKernels[0];
            if (this.activeKernel) {
                this._loadKernelPreloads(this.activeKernel.extensionLocation, this.activeKernel);
            }
        }
        _loadKernelPreloads(extensionLocation, kernel) {
            var _a;
            if (kernel.preloads) {
                (_a = this._webview) === null || _a === void 0 ? void 0 : _a.updateKernelPreloads([extensionLocation], kernel.preloads.map(preload => uri_1.URI.revive(preload)));
            }
        }
        _updateForMetadata() {
            var _a, _b, _c, _d, _f, _g;
            (_a = this._editorEditable) === null || _a === void 0 ? void 0 : _a.set(!!((_b = this.viewModel.metadata) === null || _b === void 0 ? void 0 : _b.editable));
            (_c = this._editorRunnable) === null || _c === void 0 ? void 0 : _c.set(!!((_d = this.viewModel.metadata) === null || _d === void 0 ? void 0 : _d.runnable));
            DOM.toggleClass(this._overlayContainer, 'notebook-editor-editable', !!((_f = this.viewModel.metadata) === null || _f === void 0 ? void 0 : _f.editable));
            DOM.toggleClass(this.getDomNode(), 'notebook-editor-editable', !!((_g = this.viewModel.metadata) === null || _g === void 0 ? void 0 : _g.editable));
        }
        async _createWebview(id, document) {
            var _a;
            this._webview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this, id, document);
            // attach the webview container to the DOM tree first
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.rowsContainer.insertAdjacentElement('afterbegin', this._webview.element);
            await this._webview.createWebview();
            this._webview.webview.onDidBlur(() => {
                var _a;
                (_a = this._outputFocus) === null || _a === void 0 ? void 0 : _a.set(false);
                this.updateEditorFocus();
            });
            this._webview.webview.onDidFocus(() => {
                var _a;
                (_a = this._outputFocus) === null || _a === void 0 ? void 0 : _a.set(true);
                this.updateEditorFocus();
                this._onDidFocusEmitter.fire();
            });
            this._localStore.add(this._webview.onMessage(message => {
                if (this.viewModel) {
                    this.notebookService.onDidReceiveMessage(this.viewModel.viewType, this.getId(), message);
                }
            }));
        }
        async _attachModel(textModel, viewState) {
            var _a, _b;
            await this._createWebview(this.getId(), textModel.uri);
            this._eventDispatcher = new eventDispatcher_1.NotebookEventDispatcher();
            this.viewModel = this.instantiationService.createInstance(notebookViewModel_1.NotebookViewModel, textModel.viewType, textModel, this._eventDispatcher, this.getLayoutInfo());
            this._eventDispatcher.emit([new eventDispatcher_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
            this._updateForMetadata();
            this._localStore.add(this._eventDispatcher.onDidChangeMetadata(() => {
                this._updateForMetadata();
            }));
            // restore view states, including contributions
            {
                // restore view state
                this.viewModel.restoreEditorViewState(viewState);
                // contribution state restore
                const contributionsState = (viewState === null || viewState === void 0 ? void 0 : viewState.contributionsState) || {};
                const keys = Object.keys(this._contributions);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const id = keys[i];
                    const contribution = this._contributions[id];
                    if (typeof contribution.restoreViewState === 'function') {
                        contribution.restoreViewState(contributionsState[id]);
                    }
                }
            }
            (_a = this._webview) === null || _a === void 0 ? void 0 : _a.updateRendererPreloads(this.viewModel.renderers);
            this._localStore.add(this._list.onWillScroll(e => {
                this._webview.updateViewScrollTop(-e.scrollTop, []);
                this._webviewTransparentCover.style.top = `${e.scrollTop}px`;
            }));
            this._localStore.add(this._list.onDidChangeContentHeight(() => {
                DOM.scheduleAtNextAnimationFrame(() => {
                    var _a, _b, _c, _d, _f;
                    if (this._isDisposed) {
                        return;
                    }
                    const scrollTop = ((_a = this._list) === null || _a === void 0 ? void 0 : _a.scrollTop) || 0;
                    const scrollHeight = ((_b = this._list) === null || _b === void 0 ? void 0 : _b.scrollHeight) || 0;
                    this._webview.element.style.height = `${scrollHeight}px`;
                    if ((_c = this._webview) === null || _c === void 0 ? void 0 : _c.insetMapping) {
                        let updateItems = [];
                        let removedItems = [];
                        (_d = this._webview) === null || _d === void 0 ? void 0 : _d.insetMapping.forEach((value, key) => {
                            var _a, _b;
                            const cell = value.cell;
                            const viewIndex = (_a = this._list) === null || _a === void 0 ? void 0 : _a.getViewIndex(cell);
                            if (viewIndex === undefined) {
                                return;
                            }
                            if (cell.outputs.indexOf(key) < 0) {
                                // output is already gone
                                removedItems.push(key);
                            }
                            const cellTop = ((_b = this._list) === null || _b === void 0 ? void 0 : _b.getAbsoluteTopOfElement(cell)) || 0;
                            if (this._webview.shouldUpdateInset(cell, key, cellTop)) {
                                updateItems.push({
                                    cell: cell,
                                    output: key,
                                    cellTop: cellTop
                                });
                            }
                        });
                        removedItems.forEach(output => { var _a; return (_a = this._webview) === null || _a === void 0 ? void 0 : _a.removeInset(output); });
                        if (updateItems.length) {
                            (_f = this._webview) === null || _f === void 0 ? void 0 : _f.updateViewScrollTop(-scrollTop, updateItems);
                        }
                    }
                });
            }));
            this._list.attachViewModel(this.viewModel);
            this._localStore.add(this._list.onDidRemoveOutput(output => {
                this.removeInset(output);
            }));
            this._localStore.add(this._list.onDidHideOutput(output => {
                this.hideInset(output);
            }));
            this._list.layout();
            (_b = this._dndController) === null || _b === void 0 ? void 0 : _b.clearGlobalDragState();
            // restore list state at last, it must be after list layout
            this._restoreListViewState(viewState);
        }
        _restoreListViewState(viewState) {
            var _a, _b;
            if ((viewState === null || viewState === void 0 ? void 0 : viewState.scrollPosition) !== undefined) {
                this._list.scrollTop = viewState.scrollPosition.top;
                this._list.scrollLeft = viewState.scrollPosition.left;
            }
            else {
                this._list.scrollTop = 0;
                this._list.scrollLeft = 0;
            }
            const focusIdx = typeof (viewState === null || viewState === void 0 ? void 0 : viewState.focus) === 'number' ? viewState.focus : 0;
            if (focusIdx < this._list.length) {
                this._list.setFocus([focusIdx]);
                this._list.setSelection([focusIdx]);
            }
            else if (this._list.length > 0) {
                this._list.setFocus([0]);
            }
            if (viewState === null || viewState === void 0 ? void 0 : viewState.editorFocused) {
                (_a = this._list) === null || _a === void 0 ? void 0 : _a.focusView();
                const cell = (_b = this._notebookViewModel) === null || _b === void 0 ? void 0 : _b.viewCells[focusIdx];
                if (cell) {
                    cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                }
            }
        }
        getEditorViewState() {
            var _a, _b;
            const state = (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.getEditorViewState();
            if (!state) {
                return {
                    editingCells: {},
                    editorViewStates: {}
                };
            }
            if (this._list) {
                state.scrollPosition = { left: this._list.scrollLeft, top: this._list.scrollTop };
                let cellHeights = {};
                for (let i = 0; i < this.viewModel.length; i++) {
                    const elm = this.viewModel.viewCells[i];
                    if (elm.cellKind === notebookCommon_1.CellKind.Code) {
                        cellHeights[i] = elm.layoutInfo.totalHeight;
                    }
                    else {
                        cellHeights[i] = 0;
                    }
                }
                state.cellTotalHeights = cellHeights;
                const focus = this._list.getFocus()[0];
                if (typeof focus === 'number') {
                    const element = this._notebookViewModel.viewCells[focus];
                    const itemDOM = (_b = this._list) === null || _b === void 0 ? void 0 : _b.domElementOfElement(element);
                    let editorFocused = false;
                    if (document.activeElement && itemDOM && itemDOM.contains(document.activeElement)) {
                        editorFocused = true;
                    }
                    state.editorFocused = editorFocused;
                    state.focus = focus;
                }
            }
            // Save contribution view states
            const contributionsState = {};
            const keys = Object.keys(this._contributions);
            for (const id of keys) {
                const contribution = this._contributions[id];
                if (typeof contribution.saveViewState === 'function') {
                    contributionsState[id] = contribution.saveViewState();
                }
            }
            state.contributionsState = contributionsState;
            return state;
        }
        // private saveEditorViewState(input: NotebookEditorInput): void {
        // 	if (this.group && this.notebookViewModel) {
        // 	}
        // }
        // private loadTextEditorViewState(): INotebookEditorViewState | undefined {
        // 	return this.editorMemento.loadEditorState(this.group, input.resource);
        // }
        layout(dimension, shadowElement) {
            var _a, _b, _c;
            if (!shadowElement && this._shadowElementViewInfo === null) {
                this._dimension = dimension;
                return;
            }
            if (shadowElement) {
                const containerRect = shadowElement.getBoundingClientRect();
                this._shadowElementViewInfo = {
                    height: containerRect.height,
                    width: containerRect.width,
                    top: containerRect.top,
                    left: containerRect.left
                };
            }
            this._dimension = new DOM.Dimension(dimension.width, dimension.height);
            DOM.size(this._body, dimension.width, dimension.height);
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.updateOptions({ additionalScrollHeight: this._scrollBeyondLastLine ? dimension.height - constants_1.SCROLLABLE_ELEMENT_PADDING_TOP : 0 });
            (_b = this._list) === null || _b === void 0 ? void 0 : _b.layout(dimension.height - constants_1.SCROLLABLE_ELEMENT_PADDING_TOP, dimension.width);
            this._overlayContainer.style.visibility = 'visible';
            this._overlayContainer.style.display = 'block';
            this._overlayContainer.style.position = 'absolute';
            this._overlayContainer.style.top = `${this._shadowElementViewInfo.top}px`;
            this._overlayContainer.style.left = `${this._shadowElementViewInfo.left}px`;
            this._overlayContainer.style.width = `${dimension ? dimension.width : this._shadowElementViewInfo.width}px`;
            this._overlayContainer.style.height = `${dimension ? dimension.height : this._shadowElementViewInfo.height}px`;
            if (this._webviewTransparentCover) {
                this._webviewTransparentCover.style.height = `${dimension.height}px`;
                this._webviewTransparentCover.style.width = `${dimension.width}px`;
            }
            (_c = this._eventDispatcher) === null || _c === void 0 ? void 0 : _c.emit([new eventDispatcher_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
        }
        // protected saveState(): void {
        // 	if (this.input instanceof NotebookEditorInput) {
        // 		this.saveEditorViewState(this.input);
        // 	}
        // 	super.saveState();
        // }
        //#endregion
        //#region Editor Features
        selectElement(cell) {
            var _a;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.selectElement(cell);
            // this.viewModel!.selectionHandles = [cell.handle];
        }
        revealInView(cell) {
            var _a;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementInView(cell);
        }
        revealInCenterIfOutsideViewport(cell) {
            var _a;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementInCenterIfOutsideViewport(cell);
        }
        revealInCenter(cell) {
            var _a;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementInCenter(cell);
        }
        async revealLineInViewAsync(cell, line) {
            var _a;
            return (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementLineInViewAsync(cell, line);
        }
        async revealLineInCenterAsync(cell, line) {
            var _a;
            return (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementLineInCenterAsync(cell, line);
        }
        async revealLineInCenterIfOutsideViewportAsync(cell, line) {
            var _a;
            return (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementLineInCenterIfOutsideViewportAsync(cell, line);
        }
        async revealRangeInViewAsync(cell, range) {
            var _a;
            return (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementRangeInViewAsync(cell, range);
        }
        async revealRangeInCenterAsync(cell, range) {
            var _a;
            return (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementRangeInCenterAsync(cell, range);
        }
        async revealRangeInCenterIfOutsideViewportAsync(cell, range) {
            var _a;
            return (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementRangeInCenterIfOutsideViewportAsync(cell, range);
        }
        setCellSelection(cell, range) {
            var _a;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.setCellSelection(cell, range);
        }
        changeDecorations(callback) {
            var _a;
            return (_a = this._notebookViewModel) === null || _a === void 0 ? void 0 : _a.changeDecorations(callback);
        }
        setHiddenAreas(_ranges) {
            return this._list.setHiddenAreas(_ranges, true);
        }
        //#endregion
        //#region Cell operations
        async layoutNotebookCell(cell, height) {
            const viewIndex = this._list.getViewIndex(cell);
            if (viewIndex === undefined) {
                // the cell is hidden
                return;
            }
            let relayout = (cell, height) => {
                var _a;
                if (this._isDisposed) {
                    return;
                }
                (_a = this._list) === null || _a === void 0 ? void 0 : _a.updateElementHeight2(cell, height);
            };
            if (this.pendingLayouts.has(cell)) {
                this.pendingLayouts.get(cell).dispose();
            }
            let r;
            const layoutDisposable = DOM.scheduleAtNextAnimationFrame(() => {
                if (this._isDisposed) {
                    return;
                }
                this.pendingLayouts.delete(cell);
                relayout(cell, height);
                r();
            });
            this.pendingLayouts.set(cell, lifecycle_1.toDisposable(() => {
                layoutDisposable.dispose();
                r();
            }));
            return new Promise(resolve => { r = resolve; });
        }
        insertNotebookCell(cell, type, direction = 'above', initialText = '', ui = false) {
            if (!this._notebookViewModel.metadata.editable) {
                return null;
            }
            const newLanguages = this._notebookViewModel.languages;
            const language = (type === notebookCommon_1.CellKind.Code && newLanguages && newLanguages.length) ? newLanguages[0] : 'markdown';
            const index = cell ? this._notebookViewModel.getCellIndex(cell) : 0;
            const nextIndex = ui ? this._notebookViewModel.getNextVisibleCellIndex(index) : index + 1;
            const insertIndex = cell ?
                (direction === 'above' ? index : nextIndex) :
                index;
            const newCell = this._notebookViewModel.createCell(insertIndex, initialText.split(/\r?\n/g), language, type, cell === null || cell === void 0 ? void 0 : cell.metadata, true);
            return newCell;
        }
        async splitNotebookCell(cell) {
            const index = this._notebookViewModel.getCellIndex(cell);
            return this._notebookViewModel.splitNotebookCell(index);
        }
        async joinNotebookCells(cell, direction, constraint) {
            const index = this._notebookViewModel.getCellIndex(cell);
            const ret = await this._notebookViewModel.joinNotebookCells(index, direction, constraint);
            if (ret) {
                ret.deletedCells.forEach(cell => {
                    if (this.pendingLayouts.has(cell)) {
                        this.pendingLayouts.get(cell).dispose();
                    }
                });
                return ret.cell;
            }
            else {
                return null;
            }
        }
        async deleteNotebookCell(cell) {
            if (!this._notebookViewModel.metadata.editable) {
                return false;
            }
            if (this.pendingLayouts.has(cell)) {
                this.pendingLayouts.get(cell).dispose();
            }
            const index = this._notebookViewModel.getCellIndex(cell);
            this._notebookViewModel.deleteCell(index, true);
            return true;
        }
        async moveCellDown(cell) {
            if (!this._notebookViewModel.metadata.editable) {
                return false;
            }
            const index = this._notebookViewModel.getCellIndex(cell);
            if (index === this._notebookViewModel.length - 1) {
                return false;
            }
            const newIdx = index + 1;
            return this._moveCellToIndex(index, newIdx);
        }
        async moveCellUp(cell) {
            if (!this._notebookViewModel.metadata.editable) {
                return false;
            }
            const index = this._notebookViewModel.getCellIndex(cell);
            if (index === 0) {
                return false;
            }
            const newIdx = index - 1;
            return this._moveCellToIndex(index, newIdx);
        }
        async moveCell(cell, relativeToCell, direction) {
            if (!this._notebookViewModel.metadata.editable) {
                return false;
            }
            if (cell === relativeToCell) {
                return false;
            }
            const originalIdx = this._notebookViewModel.getCellIndex(cell);
            const relativeToIndex = this._notebookViewModel.getCellIndex(relativeToCell);
            let newIdx = direction === 'above' ? relativeToIndex : relativeToIndex + 1;
            if (originalIdx < newIdx) {
                newIdx--;
            }
            return this._moveCellToIndex(originalIdx, newIdx);
        }
        async _moveCellToIndex(index, newIdx) {
            if (index === newIdx) {
                return false;
            }
            if (!this._notebookViewModel.moveCellToIdx(index, newIdx, true)) {
                throw new Error('Notebook Editor move cell, index out of range');
            }
            let r;
            DOM.scheduleAtNextAnimationFrame(() => {
                var _a;
                if (this._isDisposed) {
                    r(false);
                }
                (_a = this._list) === null || _a === void 0 ? void 0 : _a.revealElementInView(this._notebookViewModel.viewCells[newIdx]);
                r(true);
            });
            return new Promise(resolve => { r = resolve; });
        }
        editNotebookCell(cell) {
            var _a;
            if (!cell.getEvaluatedMetadata(this._notebookViewModel.metadata).editable) {
                return;
            }
            cell.editState = notebookBrowser_1.CellEditState.Editing;
            (_a = this._renderedEditors.get(cell)) === null || _a === void 0 ? void 0 : _a.focus();
        }
        getActiveCell() {
            var _a;
            let elements = (_a = this._list) === null || _a === void 0 ? void 0 : _a.getFocusedElements();
            if (elements && elements.length) {
                return elements[0];
            }
            return undefined;
        }
        cancelNotebookExecution() {
            if (!this._notebookViewModel.currentTokenSource) {
                throw new Error('Notebook is not executing');
            }
            this._notebookViewModel.currentTokenSource.cancel();
            this._notebookViewModel.currentTokenSource = undefined;
        }
        async executeNotebook() {
            if (!this._notebookViewModel.metadata.runnable) {
                return;
            }
            return this._executeNotebook();
        }
        async _executeNotebook() {
            if (this._notebookViewModel.currentTokenSource) {
                return;
            }
            const tokenSource = new cancellation_1.CancellationTokenSource();
            try {
                this._editorExecutingNotebook.set(true);
                this._notebookViewModel.currentTokenSource = tokenSource;
                const provider = this.notebookService.getContributedNotebookProviders(this.viewModel.uri)[0];
                if (provider) {
                    const viewType = provider.id;
                    const notebookUri = this._notebookViewModel.uri;
                    if (this._activeKernel) {
                        await this.notebookService.executeNotebook2(this._notebookViewModel.viewType, this._notebookViewModel.uri, this._activeKernel.id, tokenSource.token);
                    }
                    else if (provider.kernel) {
                        return await this.notebookService.executeNotebook(viewType, notebookUri, true, tokenSource.token);
                    }
                    else {
                        return await this.notebookService.executeNotebook(viewType, notebookUri, false, tokenSource.token);
                    }
                }
            }
            finally {
                this._editorExecutingNotebook.set(false);
                this._notebookViewModel.currentTokenSource = undefined;
                tokenSource.dispose();
            }
        }
        cancelNotebookCellExecution(cell) {
            if (!cell.currentTokenSource) {
                throw new Error('Cell is not executing');
            }
            cell.currentTokenSource.cancel();
            cell.currentTokenSource = undefined;
        }
        async executeNotebookCell(cell) {
            if (cell.cellKind === notebookCommon_1.CellKind.Markdown) {
                this.focusNotebookCell(cell, 'container');
                return;
            }
            if (!cell.getEvaluatedMetadata(this._notebookViewModel.metadata).runnable) {
                return;
            }
            const tokenSource = new cancellation_1.CancellationTokenSource();
            try {
                await this._executeNotebookCell(cell, tokenSource);
            }
            finally {
                tokenSource.dispose();
            }
        }
        async _executeNotebookCell(cell, tokenSource) {
            try {
                cell.currentTokenSource = tokenSource;
                const provider = this.notebookService.getContributedNotebookProviders(this.viewModel.uri)[0];
                if (provider) {
                    const viewType = provider.id;
                    const notebookUri = this._notebookViewModel.uri;
                    if (this._activeKernel) {
                        return await this.notebookService.executeNotebookCell2(viewType, notebookUri, cell.handle, this._activeKernel.id, tokenSource.token);
                    }
                    else if (provider.kernel) {
                        return await this.notebookService.executeNotebookCell(viewType, notebookUri, cell.handle, true, tokenSource.token);
                    }
                    else {
                        return await this.notebookService.executeNotebookCell(viewType, notebookUri, cell.handle, false, tokenSource.token);
                    }
                }
            }
            finally {
                cell.currentTokenSource = undefined;
            }
        }
        focusNotebookCell(cell, focusItem) {
            var _a, _b, _c, _d;
            if (this._isDisposed) {
                return;
            }
            if (focusItem === 'editor') {
                this.selectElement(cell);
                (_a = this._list) === null || _a === void 0 ? void 0 : _a.focusView();
                cell.editState = notebookBrowser_1.CellEditState.Editing;
                cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                this.revealInCenterIfOutsideViewport(cell);
            }
            else if (focusItem === 'output') {
                this.selectElement(cell);
                (_b = this._list) === null || _b === void 0 ? void 0 : _b.focusView();
                if (!this._webview) {
                    return;
                }
                this._webview.focusOutput(cell.id);
                cell.editState = notebookBrowser_1.CellEditState.Preview;
                cell.focusMode = notebookBrowser_1.CellFocusMode.Container;
                this.revealInCenterIfOutsideViewport(cell);
            }
            else {
                let itemDOM = (_c = this._list) === null || _c === void 0 ? void 0 : _c.domElementOfElement(cell);
                if (document.activeElement && itemDOM && itemDOM.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
                cell.editState = notebookBrowser_1.CellEditState.Preview;
                cell.focusMode = notebookBrowser_1.CellFocusMode.Container;
                this.selectElement(cell);
                this.revealInCenterIfOutsideViewport(cell);
                (_d = this._list) === null || _d === void 0 ? void 0 : _d.focusView();
            }
        }
        //#endregion
        //#region MISC
        getLayoutInfo() {
            if (!this._list) {
                throw new Error('Editor is not initalized successfully');
            }
            return {
                width: this._dimension.width,
                height: this._dimension.height,
                fontInfo: this._fontInfo
            };
        }
        triggerScroll(event) {
            var _a;
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.triggerScrollFromMouseWheelEvent(event);
        }
        createInset(cell, output, shadowContent, offset) {
            var _a, _b, _c;
            if (!this._webview) {
                return;
            }
            let preloads = this._notebookViewModel.renderers;
            if (!this._webview.insetMapping.has(output)) {
                let cellTop = ((_a = this._list) === null || _a === void 0 ? void 0 : _a.getAbsoluteTopOfElement(cell)) || 0;
                this._webview.createInset(cell, output, cellTop, offset, shadowContent, preloads);
            }
            else {
                let cellTop = ((_b = this._list) === null || _b === void 0 ? void 0 : _b.getAbsoluteTopOfElement(cell)) || 0;
                let scrollTop = ((_c = this._list) === null || _c === void 0 ? void 0 : _c.scrollTop) || 0;
                this._webview.updateViewScrollTop(-scrollTop, [{ cell: cell, output: output, cellTop: cellTop }]);
            }
        }
        removeInset(output) {
            if (!this._webview) {
                return;
            }
            this._webview.removeInset(output);
        }
        hideInset(output) {
            if (!this._webview) {
                return;
            }
            this._webview.hideInset(output);
        }
        getOutputRenderer() {
            return this._outputRenderer;
        }
        postMessage(message) {
            var _a;
            (_a = this._webview) === null || _a === void 0 ? void 0 : _a.webview.postMessage(message);
        }
        //#endregion
        //#region Editor Contributions
        getContribution(id) {
            return (this._contributions[id] || null);
        }
        //#endregion
        dispose() {
            var _a, _b, _c;
            this._isDisposed = true;
            this.notebookService.removeNotebookEditor(this);
            const keys = Object.keys(this._contributions);
            for (let i = 0, len = keys.length; i < len; i++) {
                const contributionId = keys[i];
                this._contributions[contributionId].dispose();
            }
            this._localStore.clear();
            (_a = this._list) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._webview) === null || _b === void 0 ? void 0 : _b.dispose();
            this._overlayContainer.remove();
            (_c = this.viewModel) === null || _c === void 0 ? void 0 : _c.dispose();
            // this._layoutService.container.removeChild(this.overlayContainer);
            super.dispose();
        }
        toJSON() {
            var _a;
            return {
                notebookHandle: (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.handle
            };
        }
    };
    NotebookEditorWidget.ID = 'workbench.editor.notebook';
    NotebookEditorWidget.EDITOR_MEMENTOS = new Map();
    NotebookEditorWidget = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, storage_1.IStorageService),
        __param(2, notebookService_1.INotebookService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, layoutService_1.ILayoutService)
    ], NotebookEditorWidget);
    exports.NotebookEditorWidget = NotebookEditorWidget;
    exports.notebookCellBorder = colorRegistry_1.registerColor('notebook.cellBorderColor', {
        dark: colorRegistry_1.transparent(theme_1.PANEL_BORDER, .6),
        light: colorRegistry_1.transparent(theme_1.PANEL_BORDER, .4),
        hc: theme_1.PANEL_BORDER
    }, nls.localize('notebook.cellBorderColor', "The border color for notebook cells."));
    exports.focusedCellIndicator = colorRegistry_1.registerColor('notebook.focusedCellIndicator', {
        light: colorRegistry_1.focusBorder,
        dark: colorRegistry_1.focusBorder,
        hc: colorRegistry_1.focusBorder
    }, nls.localize('notebook.focusedCellIndicator', "The color of the notebook cell indicator."));
    exports.focusedEditorIndicator = colorRegistry_1.registerColor('notebook.focusedEditorIndicator', {
        light: colorRegistry_1.focusBorder,
        dark: colorRegistry_1.focusBorder,
        hc: colorRegistry_1.focusBorder
    }, nls.localize('notebook.focusedEditorIndicator', "The color of the notebook cell editor indicator."));
    exports.cellStatusIconSuccess = colorRegistry_1.registerColor('notebookStatusSuccessIcon.foreground', {
        light: debugToolBar_1.debugIconStartForeground,
        dark: debugToolBar_1.debugIconStartForeground,
        hc: debugToolBar_1.debugIconStartForeground
    }, nls.localize('notebookStatusSuccessIcon.foreground', "The error icon color of notebook cells in the cell status bar."));
    exports.cellStatusIconError = colorRegistry_1.registerColor('notebookStatusErrorIcon.foreground', {
        light: colorRegistry_1.errorForeground,
        dark: colorRegistry_1.errorForeground,
        hc: colorRegistry_1.errorForeground
    }, nls.localize('notebookStatusErrorIcon.foreground', "The error icon color of notebook cells in the cell status bar."));
    exports.cellStatusIconRunning = colorRegistry_1.registerColor('notebookStatusRunningIcon.foreground', {
        light: colorRegistry_1.foreground,
        dark: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls.localize('notebookStatusRunningIcon.foreground', "The running icon color of notebook cells in the cell status bar."));
    exports.notebookOutputContainerColor = colorRegistry_1.registerColor('notebook.outputContainerBackgroundColor', {
        dark: exports.notebookCellBorder,
        light: exports.notebookCellBorder,
        hc: null
    }, nls.localize('notebook.outputContainerBackgroundColor', "The Color of the notebook output container background."));
    // TODO currently also used for toolbar border, if we keep all of this, pick a generic name
    exports.CELL_TOOLBAR_SEPERATOR = colorRegistry_1.registerColor('notebook.cellToolbarSeperator', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('cellToolbarSeperator', "The color of seperator in Cell bottom toolbar"));
    exports.cellStatusBarItemHover = colorRegistry_1.registerColor('notebook.cellStatusBarItemHoverBackground', {
        light: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.08)),
        dark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.15)),
        hc: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.15)),
    }, nls.localize('notebook.cellStatusBarItemHoverBackground', "The background color of notebook cell status bar items."));
    themeService_1.registerThemingParticipant((theme, collector) => {
        collector.addRule(`.notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element {
		padding-top: ${constants_1.SCROLLABLE_ELEMENT_PADDING_TOP}px;
		box-sizing: border-box;
	}`);
        // const color = getExtraColor(theme, embeddedEditorBackground, { dark: 'rgba(0, 0, 0, .4)', extra_dark: 'rgba(200, 235, 255, .064)', light: '#f4f4f4', hc: null });
        const color = theme.getColor(colorRegistry_1.editorBackground);
        if (color) {
            collector.addRule(`.notebookOverlay .cell .monaco-editor-background,
			.notebookOverlay .cell .margin-view-overlays,
			.notebookOverlay .cell .cell-statusbar-container { background: ${color}; }`);
            collector.addRule(`.notebookOverlay .cell-drag-image .cell-editor-container > div { background: ${color} !important; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.notebookOverlay .output a,
			.notebookOverlay .cell.markdown a { color: ${link};} `);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.notebookOverlay .output a:hover,
			.notebookOverlay .cell .output a:active { color: ${activeLink}; }`);
        }
        const shortcut = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (shortcut) {
            collector.addRule(`.notebookOverlay code,
			.notebookOverlay .shortcut { color: ${shortcut}; }`);
        }
        const border = theme.getColor(colorRegistry_1.contrastBorder);
        if (border) {
            collector.addRule(`.notebookOverlay .monaco-editor { border-color: ${border}; }`);
        }
        const quoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
        if (quoteBackground) {
            collector.addRule(`.notebookOverlay blockquote { background: ${quoteBackground}; }`);
        }
        const quoteBorder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
        if (quoteBorder) {
            collector.addRule(`.notebookOverlay blockquote { border-color: ${quoteBorder}; }`);
        }
        const containerBackground = theme.getColor(exports.notebookOutputContainerColor);
        if (containerBackground) {
            collector.addRule(`.notebookOverlay .output { background-color: ${containerBackground}; }`);
            collector.addRule(`.notebookOverlay .output-element { background-color: ${containerBackground}; }`);
        }
        const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
        if (editorBackgroundColor) {
            collector.addRule(`.notebookOverlay .cell-statusbar-container { border-top: solid 1px ${editorBackgroundColor}; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row > .monaco-toolbar { background-color: ${editorBackgroundColor}; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row.cell-drag-image { background-color: ${editorBackgroundColor}; }`);
        }
        const cellToolbarSeperator = theme.getColor(exports.CELL_TOOLBAR_SEPERATOR);
        if (cellToolbarSeperator) {
            collector.addRule(`.notebookOverlay .cell-bottom-toolbar-container .separator { background-color: ${cellToolbarSeperator} }`);
            collector.addRule(`.notebookOverlay .cell-bottom-toolbar-container .action-item:first-child::after { background-color: ${cellToolbarSeperator} }`);
            collector.addRule(`.notebookOverlay .monaco-list-row > .monaco-toolbar { border: solid 1px ${cellToolbarSeperator}; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row:hover .notebook-cell-focus-indicator,
			.notebookOverlay .monaco-list-row.cell-output-hover .notebook-cell-focus-indicator { border-color: ${cellToolbarSeperator}; }`);
        }
        const focusedCellIndicatorColor = theme.getColor(exports.focusedCellIndicator);
        if (focusedCellIndicatorColor) {
            collector.addRule(`.notebookOverlay .monaco-list-row.focused .notebook-cell-focus-indicator { border-color: ${focusedCellIndicatorColor}; }`);
            collector.addRule(`.notebookOverlay .monaco-list-row .notebook-cell-focus-indicator { border-color: ${focusedCellIndicatorColor}; }`);
            collector.addRule(`.notebookOverlay > .cell-list-container > .cell-list-insertion-indicator { background-color: ${focusedCellIndicatorColor}; }`);
        }
        const focusedEditorIndicatorColor = theme.getColor(exports.focusedEditorIndicator);
        if (focusedEditorIndicatorColor) {
            collector.addRule(`.notebookOverlay .monaco-list-row.cell-editor-focus .cell-editor-part:before { outline: solid 1px ${focusedEditorIndicatorColor}; }`);
        }
        const editorBorderColor = theme.getColor(exports.notebookCellBorder);
        if (editorBorderColor) {
            collector.addRule(`.notebookOverlay .monaco-list-row .cell-editor-part:before { outline: solid 1px ${editorBorderColor}; }`);
        }
        const headingBorderColor = theme.getColor(exports.notebookCellBorder);
        if (headingBorderColor) {
            collector.addRule(`.notebookOverlay .cell.markdown h1 { border-color: ${headingBorderColor}; }`);
        }
        const cellStatusSuccessIcon = theme.getColor(exports.cellStatusIconSuccess);
        if (cellStatusSuccessIcon) {
            collector.addRule(`.monaco-workbench .notebookOverlay .cell-statusbar-container .cell-run-status .codicon-check { color: ${cellStatusSuccessIcon} }`);
        }
        const cellStatusErrorIcon = theme.getColor(exports.cellStatusIconError);
        if (cellStatusErrorIcon) {
            collector.addRule(`.monaco-workbench .notebookOverlay .cell-statusbar-container .cell-run-status .codicon-error { color: ${cellStatusErrorIcon} }`);
        }
        const cellStatusRunningIcon = theme.getColor(exports.cellStatusIconRunning);
        if (cellStatusRunningIcon) {
            collector.addRule(`.monaco-workbench .notebookOverlay .cell-statusbar-container .cell-run-status .codicon-sync { color: ${cellStatusRunningIcon} }`);
        }
        const cellStatusBarHoverBg = theme.getColor(exports.cellStatusBarItemHover);
        if (cellStatusBarHoverBg) {
            collector.addRule(`.monaco-workbench .notebookOverlay .cell-statusbar-container .cell-language-picker:hover { background-color: ${cellStatusBarHoverBg}; }`);
        }
        // const widgetShadowColor = theme.getColor(widgetShadow);
        // if (widgetShadowColor) {
        // 	collector.addRule(`.notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row > .monaco-toolbar {
        // 		box-shadow:  0 0 8px 4px ${widgetShadowColor}
        // 	}`)
        // }
        // Cell Margin
        collector.addRule(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row  > div.cell { margin: 0px ${constants_1.CELL_MARGIN}px 0px ${constants_1.CELL_MARGIN}px; }`);
        collector.addRule(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row { padding-top: ${constants_1.EDITOR_TOP_MARGIN}px; }`);
        collector.addRule(`.notebookOverlay .output { margin: 0px ${constants_1.CELL_MARGIN}px 0px ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px }`);
        collector.addRule(`.notebookOverlay .cell-bottom-toolbar-container { width: calc(100% - ${constants_1.CELL_MARGIN * 2 + constants_1.CELL_RUN_GUTTER}px); margin: 0px ${constants_1.CELL_MARGIN}px 0px ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px }`);
        collector.addRule(`.notebookOverlay .markdown-cell-row .cell .cell-editor-part { margin-left: ${constants_1.CELL_RUN_GUTTER}px; }`);
        collector.addRule(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row  > div.cell.markdown { padding-left: ${constants_1.CELL_RUN_GUTTER}px; }`);
        collector.addRule(`.notebookOverlay .cell .run-button-container { width: ${constants_1.CELL_RUN_GUTTER}px; }`);
        collector.addRule(`.notebookOverlay > .cell-list-container > .cell-list-insertion-indicator { left: ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px; right: ${constants_1.CELL_MARGIN}px; }`);
        collector.addRule(`.notebookOverlay .cell-drag-image .cell-editor-container > div { padding: ${constants_1.EDITOR_TOP_PADDING}px 16px ${constants_1.EDITOR_BOTTOM_PADDING}px 16px; }`);
        collector.addRule(`.notebookOverlay .monaco-list .monaco-list-row .notebook-cell-focus-indicator { left: ${constants_1.CELL_MARGIN}px; bottom: ${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}px; }`);
    });
});
//# __sourceMappingURL=notebookEditorWidget.js.map