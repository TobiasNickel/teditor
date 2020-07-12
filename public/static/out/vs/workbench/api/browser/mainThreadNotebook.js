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
define(["require", "exports", "vs/nls", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility", "vs/platform/instantiation/common/instantiation", "vs/platform/undoRedo/common/undoRedo"], function (require, exports, nls, extHostCustomers_1, extHost_protocol_1, lifecycle_1, uri_1, notebookService_1, notebookCommon_1, configuration_1, notebookTextModel_1, editorService_1, accessibility_1, instantiation_1, undoRedo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookRenderer = exports.MainThreadNotebookKernel = exports.MainThreadNotebookController = exports.MainThreadNotebooks = exports.MainThreadNotebookDocument = void 0;
    let MainThreadNotebookDocument = class MainThreadNotebookDocument extends lifecycle_1.Disposable {
        constructor(_proxy, handle, viewType, supportBackup, uri, notebookService, undoRedoService) {
            super();
            this._proxy = _proxy;
            this.handle = handle;
            this.viewType = viewType;
            this.supportBackup = supportBackup;
            this.uri = uri;
            this.notebookService = notebookService;
            this.undoRedoService = undoRedoService;
            this._textModel = new notebookTextModel_1.NotebookTextModel(handle, viewType, supportBackup, uri);
            this._register(this._textModel.onDidModelChangeProxy(e => {
                this._proxy.$acceptModelChanged(this.uri, e);
                this._proxy.$acceptEditorPropertiesChanged(uri, { selections: { selections: this._textModel.selections }, metadata: null });
            }));
            this._register(this._textModel.onDidSelectionChange(e => {
                const selectionsChange = e ? { selections: e } : null;
                this._proxy.$acceptEditorPropertiesChanged(uri, { selections: selectionsChange, metadata: null });
            }));
        }
        get textModel() {
            return this._textModel;
        }
        async applyEdit(modelVersionId, edits, emitToExtHost) {
            await this.notebookService.transformEditsOutputs(this.textModel, edits);
            return this._textModel.$applyEdit(modelVersionId, edits);
        }
        async spliceNotebookCellOutputs(cellHandle, splices) {
            await this.notebookService.transformSpliceOutputs(this.textModel, splices);
            this._textModel.$spliceNotebookCellOutputs(cellHandle, splices);
        }
        handleEdit(editId, label) {
            this.undoRedoService.pushElement({
                type: 0 /* Resource */,
                resource: this._textModel.uri,
                label: label !== null && label !== void 0 ? label : nls.localize('defaultEditLabel', "Edit"),
                undo: async () => {
                    await this._proxy.$undoNotebook(this._textModel.viewType, this._textModel.uri, editId, this._textModel.isDirty);
                },
                redo: async () => {
                    await this._proxy.$redoNotebook(this._textModel.viewType, this._textModel.uri, editId, this._textModel.isDirty);
                },
            });
            this._textModel.setDirty(true);
        }
        dispose() {
            this._textModel.dispose();
            super.dispose();
        }
    };
    MainThreadNotebookDocument = __decorate([
        __param(5, notebookService_1.INotebookService),
        __param(6, undoRedo_1.IUndoRedoService)
    ], MainThreadNotebookDocument);
    exports.MainThreadNotebookDocument = MainThreadNotebookDocument;
    class DocumentAndEditorState {
        constructor(documents, textEditors, activeEditor, visibleEditors) {
            this.documents = documents;
            this.textEditors = textEditors;
            this.activeEditor = activeEditor;
            this.visibleEditors = visibleEditors;
            //
        }
        static ofSets(before, after) {
            const removed = [];
            const added = [];
            before.forEach(element => {
                if (!after.has(element)) {
                    removed.push(element);
                }
            });
            after.forEach(element => {
                if (!before.has(element)) {
                    added.push(element);
                }
            });
            return { removed, added };
        }
        static ofMaps(before, after) {
            const removed = [];
            const added = [];
            before.forEach((value, index) => {
                if (!after.has(index)) {
                    removed.push(value);
                }
            });
            after.forEach((value, index) => {
                if (!before.has(index)) {
                    added.push(value);
                }
            });
            return { removed, added };
        }
        static compute(before, after) {
            if (!before) {
                const apiEditors = [];
                for (let id in after.textEditors) {
                    const editor = after.textEditors.get(id);
                    apiEditors.push({ id, documentUri: editor.uri, selections: editor.textModel.selections });
                }
                return {
                    addedDocuments: [],
                    addedEditors: apiEditors,
                    visibleEditors: [...after.visibleEditors].map(editor => editor[0])
                };
            }
            const documentDelta = DocumentAndEditorState.ofSets(before.documents, after.documents);
            const editorDelta = DocumentAndEditorState.ofMaps(before.textEditors, after.textEditors);
            const addedAPIEditors = editorDelta.added.map(add => ({
                id: add.getId(),
                documentUri: add.uri,
                selections: add.textModel.selections || []
            }));
            const removedAPIEditors = editorDelta.removed.map(removed => removed.getId());
            // const oldActiveEditor = before.activeEditor !== after.activeEditor ? before.activeEditor : undefined;
            const newActiveEditor = before.activeEditor !== after.activeEditor ? after.activeEditor : undefined;
            const visibleEditorDelta = DocumentAndEditorState.ofMaps(before.visibleEditors, after.visibleEditors);
            return {
                addedDocuments: documentDelta.added.map(e => {
                    return {
                        viewType: e.viewType,
                        handle: e.handle,
                        uri: e.uri,
                        metadata: e.metadata,
                        versionId: e.versionId,
                        cells: e.cells.map(cell => ({
                            handle: cell.handle,
                            uri: cell.uri,
                            source: cell.textBuffer.getLinesContent(),
                            language: cell.language,
                            cellKind: cell.cellKind,
                            outputs: cell.outputs,
                            metadata: cell.metadata
                        })),
                    };
                }),
                removedDocuments: documentDelta.removed.map(e => e.uri),
                addedEditors: addedAPIEditors,
                removedEditors: removedAPIEditors,
                newActiveEditor: newActiveEditor,
                visibleEditors: visibleEditorDelta.added.length === 0 && visibleEditorDelta.removed.length === 0
                    ? undefined
                    : [...after.visibleEditors].map(editor => editor[0])
            };
        }
    }
    let MainThreadNotebooks = class MainThreadNotebooks extends lifecycle_1.Disposable {
        constructor(extHostContext, _notebookService, configurationService, editorService, accessibilityService, _instantiationService) {
            super();
            this._notebookService = _notebookService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.accessibilityService = accessibilityService;
            this._instantiationService = _instantiationService;
            this._notebookProviders = new Map();
            this._notebookKernels = new Map();
            this._notebookRenderers = new Map();
            this._toDisposeOnEditorRemove = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
            this.registerListeners();
        }
        async $tryApplyEdits(viewType, resource, modelVersionId, edits, renderers) {
            let controller = this._notebookProviders.get(viewType);
            if (controller) {
                return controller.tryApplyEdits(resource, modelVersionId, edits, renderers);
            }
            return false;
        }
        _isDeltaEmpty(delta) {
            if (delta.addedDocuments !== undefined && delta.addedDocuments.length > 0) {
                return false;
            }
            if (delta.removedDocuments !== undefined && delta.removedDocuments.length > 0) {
                return false;
            }
            if (delta.addedEditors !== undefined && delta.addedEditors.length > 0) {
                return false;
            }
            if (delta.removedEditors !== undefined && delta.removedEditors.length > 0) {
                return false;
            }
            if (delta.visibleEditors !== undefined && delta.visibleEditors.length > 0) {
                return false;
            }
            if (delta.newActiveEditor !== undefined) {
                return false;
            }
            return true;
        }
        _emitDelta(delta) {
            if (this._isDeltaEmpty(delta)) {
                return;
            }
            this._proxy.$acceptDocumentAndEditorsDelta(delta);
        }
        registerListeners() {
            this._notebookService.listNotebookEditors().forEach((e) => {
                this._addNotebookEditor(e);
            });
            this._register(this._notebookService.onDidChangeActiveEditor(e => {
                this._updateState();
            }));
            this._register(this._notebookService.onDidChangeVisibleEditors(e => {
                if (this._notebookProviders.size > 0) {
                    if (!this._currentState) {
                        // no current state means we didn't even create editors in ext host yet.
                        return;
                    }
                    // we can't simply update visibleEditors as we need to check if we should create editors first.
                    this._updateState();
                }
            }));
            this._register(this._notebookService.onNotebookEditorAdd(editor => {
                this._addNotebookEditor(editor);
            }));
            this._register(this._notebookService.onNotebookEditorsRemove(editors => {
                this._removeNotebookEditor(editors);
            }));
            this._register(this._notebookService.onNotebookDocumentAdd(() => {
                this._updateState();
            }));
            this._register(this._notebookService.onNotebookDocumentRemove(() => {
                this._updateState();
            }));
            const updateOrder = () => {
                let userOrder = this.configurationService.getValue('notebook.displayOrder');
                this._proxy.$acceptDisplayOrder({
                    defaultOrder: this.accessibilityService.isScreenReaderOptimized() ? notebookCommon_1.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER : notebookCommon_1.NOTEBOOK_DISPLAY_ORDER,
                    userOrder: userOrder
                });
            };
            updateOrder();
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectedKeys.indexOf('notebook.displayOrder') >= 0) {
                    updateOrder();
                }
            }));
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => {
                updateOrder();
            }));
            const activeEditorPane = this.editorService.activeEditorPane;
            const notebookEditor = (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) ? activeEditorPane.getControl() : undefined;
            this._updateState(notebookEditor);
        }
        async addNotebookDocument(data) {
            this._updateState();
        }
        _addNotebookEditor(e) {
            this._toDisposeOnEditorRemove.set(e.getId(), lifecycle_1.combinedDisposable(e.onDidChangeModel(() => this._updateState()), e.onDidFocusEditorWidget(() => {
                this._updateState(e);
            })));
            const activeEditorPane = this.editorService.activeEditorPane;
            const notebookEditor = (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) ? activeEditorPane.getControl() : undefined;
            this._updateState(notebookEditor);
        }
        _removeNotebookEditor(editors) {
            editors.forEach(e => {
                const sub = this._toDisposeOnEditorRemove.get(e.getId());
                if (sub) {
                    this._toDisposeOnEditorRemove.delete(e.getId());
                    sub.dispose();
                }
            });
            this._updateState();
        }
        async _updateState(focusedNotebookEditor) {
            let activeEditor = null;
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) {
                const notebookEditor = activeEditorPane.getControl();
                activeEditor = notebookEditor && notebookEditor.hasModel() ? notebookEditor.getId() : null;
            }
            const documentEditorsMap = new Map();
            const editors = new Map();
            this._notebookService.listNotebookEditors().forEach(editor => {
                if (editor.hasModel()) {
                    editors.set(editor.getId(), editor);
                    documentEditorsMap.set(editor.textModel.uri.toString(), editor);
                }
            });
            const visibleEditorsMap = new Map();
            this.editorService.visibleEditorPanes.forEach(editor => {
                if (editor.isNotebookEditor) {
                    const nbEditorWidget = editor.getControl();
                    if (nbEditorWidget && editors.has(nbEditorWidget.getId())) {
                        visibleEditorsMap.set(nbEditorWidget.getId(), nbEditorWidget);
                    }
                }
            });
            const documents = new Set();
            this._notebookService.listNotebookDocuments().forEach(document => {
                documents.add(document);
            });
            if (!activeEditor && focusedNotebookEditor && focusedNotebookEditor.hasModel()) {
                activeEditor = focusedNotebookEditor.getId();
            }
            // editors always have view model attached, which means there is already a document in exthost.
            const newState = new DocumentAndEditorState(documents, editors, activeEditor, visibleEditorsMap);
            const delta = DocumentAndEditorState.compute(this._currentState, newState);
            // const isEmptyChange = (!delta.addedDocuments || delta.addedDocuments.length === 0)
            // 	&& (!delta.removedDocuments || delta.removedDocuments.length === 0)
            // 	&& (!delta.addedEditors || delta.addedEditors.length === 0)
            // 	&& (!delta.removedEditors || delta.removedEditors.length === 0)
            // 	&& (delta.newActiveEditor === undefined)
            // if (!isEmptyChange) {
            this._currentState = newState;
            await this._emitDelta(delta);
            // }
        }
        async $registerNotebookRenderer(extension, type, selectors, preloads) {
            const renderer = new MainThreadNotebookRenderer(this._proxy, type, extension.id, uri_1.URI.revive(extension.location), selectors, preloads.map(uri => uri_1.URI.revive(uri)));
            this._notebookRenderers.set(type, renderer);
            this._notebookService.registerNotebookRenderer(type, renderer);
        }
        async $unregisterNotebookRenderer(id) {
            this._notebookService.unregisterNotebookRenderer(id);
        }
        async $registerNotebookProvider(extension, viewType, supportBackup, kernel) {
            let controller = new MainThreadNotebookController(this._proxy, this, viewType, supportBackup, kernel, this._notebookService, this._instantiationService);
            this._notebookProviders.set(viewType, controller);
            this._notebookService.registerNotebookController(viewType, extension, controller);
            return;
        }
        async $onNotebookChange(viewType, uri) {
            let controller = this._notebookProviders.get(viewType);
            if (controller) {
                controller.handleNotebookChange(uri);
            }
        }
        async $unregisterNotebookProvider(viewType) {
            this._notebookProviders.delete(viewType);
            this._notebookService.unregisterNotebookProvider(viewType);
            return;
        }
        async $registerNotebookKernel(extension, id, label, selectors, preloads) {
            const kernel = new MainThreadNotebookKernel(this._proxy, id, label, selectors, extension.id, uri_1.URI.revive(extension.location), preloads.map(preload => uri_1.URI.revive(preload)));
            this._notebookKernels.set(id, kernel);
            this._notebookService.registerNotebookKernel(kernel);
            return;
        }
        async $unregisterNotebookKernel(id) {
            this._notebookKernels.delete(id);
            this._notebookService.unregisterNotebookKernel(id);
            return;
        }
        async $updateNotebookLanguages(viewType, resource, languages) {
            let controller = this._notebookProviders.get(viewType);
            if (controller) {
                controller.updateLanguages(resource, languages);
            }
        }
        async $updateNotebookMetadata(viewType, resource, metadata) {
            let controller = this._notebookProviders.get(viewType);
            if (controller) {
                controller.updateNotebookMetadata(resource, metadata);
            }
        }
        async $updateNotebookCellMetadata(viewType, resource, handle, metadata) {
            let controller = this._notebookProviders.get(viewType);
            if (controller) {
                controller.updateNotebookCellMetadata(resource, handle, metadata);
            }
        }
        async $spliceNotebookCellOutputs(viewType, resource, cellHandle, splices, renderers) {
            let controller = this._notebookProviders.get(viewType);
            await (controller === null || controller === void 0 ? void 0 : controller.spliceNotebookCellOutputs(resource, cellHandle, splices, renderers));
        }
        async executeNotebook(viewType, uri, useAttachedKernel, token) {
            return this._proxy.$executeNotebook(viewType, uri, undefined, useAttachedKernel, token);
        }
        async $postMessage(handle, value) {
            var _a;
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) {
                const notebookEditor = activeEditorPane.getControl();
                if (((_a = notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.handle) === handle) {
                    notebookEditor.postMessage(value);
                    return true;
                }
            }
            return false;
        }
        $onDidEdit(resource, viewType, editId, label) {
            let controller = this._notebookProviders.get(viewType);
            controller === null || controller === void 0 ? void 0 : controller.handleEdit(resource, editId, label);
        }
        $onContentChange(resource, viewType) {
            let controller = this._notebookProviders.get(viewType);
            controller === null || controller === void 0 ? void 0 : controller.handleNotebookChange(resource);
        }
    };
    MainThreadNotebooks = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadNotebook),
        __param(1, notebookService_1.INotebookService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, instantiation_1.IInstantiationService)
    ], MainThreadNotebooks);
    exports.MainThreadNotebooks = MainThreadNotebooks;
    class MainThreadNotebookController {
        constructor(_proxy, _mainThreadNotebook, _viewType, _supportBackup, kernel, notebookService, _instantiationService) {
            this._proxy = _proxy;
            this._mainThreadNotebook = _mainThreadNotebook;
            this._viewType = _viewType;
            this._supportBackup = _supportBackup;
            this.kernel = kernel;
            this.notebookService = notebookService;
            this._instantiationService = _instantiationService;
            this._mapping = new Map();
        }
        async createNotebook(viewType, uri, backup, forceReload, editorId, backupId) {
            let mainthreadNotebook = this._mapping.get(uri_1.URI.from(uri).toString());
            if (mainthreadNotebook) {
                if (forceReload) {
                    const data = await this._proxy.$resolveNotebookData(viewType, uri);
                    if (!data) {
                        return;
                    }
                    mainthreadNotebook.textModel.languages = data.languages;
                    mainthreadNotebook.textModel.metadata = data.metadata;
                    await mainthreadNotebook.applyEdit(mainthreadNotebook.textModel.versionId, [
                        { editType: notebookCommon_1.CellEditType.Delete, count: mainthreadNotebook.textModel.cells.length, index: 0 },
                        { editType: notebookCommon_1.CellEditType.Insert, index: 0, cells: data.cells }
                    ], true);
                }
                return mainthreadNotebook.textModel;
            }
            let document = this._instantiationService.createInstance(MainThreadNotebookDocument, this._proxy, MainThreadNotebookController.documentHandle++, viewType, this._supportBackup, uri);
            this._mapping.set(document.uri.toString(), document);
            if (backup) {
                // trigger events
                document.textModel.metadata = backup.metadata;
                document.textModel.languages = backup.languages;
                // restored from backup, update the text model without emitting any event to exthost
                await document.applyEdit(document.textModel.versionId, [
                    {
                        editType: notebookCommon_1.CellEditType.Insert,
                        index: 0,
                        cells: backup.cells || []
                    }
                ], false);
                // create document in ext host with cells data
                await this._mainThreadNotebook.addNotebookDocument({
                    viewType: document.viewType,
                    handle: document.handle,
                    uri: document.uri,
                    metadata: document.textModel.metadata,
                    versionId: document.textModel.versionId,
                    cells: document.textModel.cells.map(cell => ({
                        handle: cell.handle,
                        uri: cell.uri,
                        source: cell.textBuffer.getLinesContent(),
                        language: cell.language,
                        cellKind: cell.cellKind,
                        outputs: cell.outputs,
                        metadata: cell.metadata
                    })),
                    attachedEditor: editorId ? {
                        id: editorId,
                        selections: document.textModel.selections
                    } : undefined
                });
                return document.textModel;
            }
            // open notebook document
            const data = await this._proxy.$resolveNotebookData(viewType, uri, backupId);
            if (!data) {
                return;
            }
            document.textModel.languages = data.languages;
            document.textModel.metadata = data.metadata;
            if (data.cells.length) {
                document.textModel.initialize(data.cells);
            }
            else {
                const mainCell = document.textModel.createCellTextModel([''], document.textModel.languages.length ? document.textModel.languages[0] : '', notebookCommon_1.CellKind.Code, [], undefined);
                document.textModel.insertTemplateCell(mainCell);
            }
            await this._mainThreadNotebook.addNotebookDocument({
                viewType: document.viewType,
                handle: document.handle,
                uri: document.uri,
                metadata: document.textModel.metadata,
                versionId: document.textModel.versionId,
                cells: document.textModel.cells.map(cell => ({
                    handle: cell.handle,
                    uri: cell.uri,
                    source: cell.textBuffer.getLinesContent(),
                    language: cell.language,
                    cellKind: cell.cellKind,
                    outputs: cell.outputs,
                    metadata: cell.metadata
                })),
                attachedEditor: editorId ? {
                    id: editorId,
                    selections: document.textModel.selections
                } : undefined
            });
            this._proxy.$acceptEditorPropertiesChanged(uri, { selections: null, metadata: document.textModel.metadata });
            return document.textModel;
        }
        async resolveNotebookEditor(viewType, uri, editorId) {
            await this._proxy.$resolveNotebookEditor(viewType, uri, editorId);
        }
        async tryApplyEdits(resource, modelVersionId, edits, renderers) {
            let mainthreadNotebook = this._mapping.get(uri_1.URI.from(resource).toString());
            if (mainthreadNotebook) {
                return await mainthreadNotebook.applyEdit(modelVersionId, edits, true);
            }
            return false;
        }
        async spliceNotebookCellOutputs(resource, cellHandle, splices, renderers) {
            let mainthreadNotebook = this._mapping.get(uri_1.URI.from(resource).toString());
            await (mainthreadNotebook === null || mainthreadNotebook === void 0 ? void 0 : mainthreadNotebook.spliceNotebookCellOutputs(cellHandle, splices));
        }
        async executeNotebook(viewType, uri, useAttachedKernel, token) {
            return this._mainThreadNotebook.executeNotebook(viewType, uri, useAttachedKernel, token);
        }
        onDidReceiveMessage(editorId, message) {
            this._proxy.$onDidReceiveMessage(editorId, message);
        }
        async removeNotebookDocument(notebook) {
            let document = this._mapping.get(uri_1.URI.from(notebook.uri).toString());
            if (!document) {
                return;
            }
            // TODO@rebornix, remove cell should use emitDelta as well to ensure document/editor events are sent together
            await this._proxy.$acceptDocumentAndEditorsDelta({ removedDocuments: [notebook.uri] });
            document.dispose();
            this._mapping.delete(uri_1.URI.from(notebook.uri).toString());
        }
        // Methods for ExtHost
        handleNotebookChange(resource) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.handleUnknownChange();
        }
        handleEdit(resource, editId, label) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.handleEdit(editId, label);
        }
        updateLanguages(resource, languages) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateLanguages(languages);
        }
        updateNotebookMetadata(resource, metadata) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateNotebookMetadata(metadata);
        }
        updateNotebookCellMetadata(resource, handle, metadata) {
            let document = this._mapping.get(uri_1.URI.from(resource).toString());
            document === null || document === void 0 ? void 0 : document.textModel.updateNotebookCellMetadata(handle, metadata);
        }
        async executeNotebookCell(uri, handle, useAttachedKernel, token) {
            return this._proxy.$executeNotebook(this._viewType, uri, handle, useAttachedKernel, token);
        }
        async save(uri, token) {
            return this._proxy.$saveNotebook(this._viewType, uri, token);
        }
        async saveAs(uri, target, token) {
            return this._proxy.$saveNotebookAs(this._viewType, uri, target, token);
        }
        async backup(uri, token) {
            const backupId = await this._proxy.$backup(this._viewType, uri, token);
            return backupId;
        }
    }
    exports.MainThreadNotebookController = MainThreadNotebookController;
    MainThreadNotebookController.documentHandle = 0;
    class MainThreadNotebookKernel {
        constructor(_proxy, id, label, selectors, extension, extensionLocation, preloads) {
            this._proxy = _proxy;
            this.id = id;
            this.label = label;
            this.selectors = selectors;
            this.extension = extension;
            this.extensionLocation = extensionLocation;
            this.preloads = preloads;
        }
        async executeNotebook(viewType, uri, handle, token) {
            return this._proxy.$executeNotebook2(this.id, viewType, uri, handle, token);
        }
    }
    exports.MainThreadNotebookKernel = MainThreadNotebookKernel;
    class MainThreadNotebookRenderer {
        constructor(_proxy, id, extensionId, extensionLocation, selectors, preloads) {
            this._proxy = _proxy;
            this.id = id;
            this.extensionId = extensionId;
            this.extensionLocation = extensionLocation;
            this.selectors = selectors;
            this.preloads = preloads;
        }
        render(uri, request) {
            return this._proxy.$renderOutputs(uri, this.id, request);
        }
        render2(uri, request) {
            return this._proxy.$renderOutputs2(uri, this.id, request);
        }
    }
    exports.MainThreadNotebookRenderer = MainThreadNotebookRenderer;
});
//# __sourceMappingURL=mainThreadNotebook.js.map