/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostDocumentData", "vs/base/common/types", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/shared/webview", "vs/base/common/resources", "vs/base/common/network", "vs/base/common/hash", "vs/base/common/uuid", "./cache"], function (require, exports, errors_1, event_1, lifecycle_1, uri_1, extHost_protocol_1, notebookCommon_1, extHostTypes, extHostDocumentData_1, types_1, typeConverters, webview_1, resources_1, network_1, hash_1, uuid_1, cache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookController = exports.ExtHostNotebookOutputRenderer = exports.ExtHostNotebookEditor = exports.NotebookEditorCellEditBuilder = exports.ExtHostNotebookDocument = exports.ExtHostCell = void 0;
    function getObservable(obj) {
        const onDidChange = new event_1.Emitter();
        const proxy = new Proxy(obj, {
            set(target, p, value, _receiver) {
                target[p] = value;
                onDidChange.fire();
                return true;
            }
        });
        return {
            proxy,
            onDidChange: onDidChange.event
        };
    }
    const addIdToOutput = (output, id = uuid_1.generateUuid()) => output.outputKind === notebookCommon_1.CellOutputKind.Rich
        ? (Object.assign(Object.assign({}, output), { outputId: id })) : output;
    class ExtHostCell extends lifecycle_1.Disposable {
        constructor(_notebook, handle, uri, content, cellKind, language, outputs, _metadata, _proxy) {
            super();
            this._notebook = _notebook;
            this.handle = handle;
            this.uri = uri;
            this.cellKind = cellKind;
            this.language = language;
            this._proxy = _proxy;
            this._onDidChangeOutputs = new event_1.Emitter();
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            // private _textDocument: vscode.TextDocument | undefined;
            // private _initalVersion: number = -1;
            this._outputMapping = new WeakMap();
            this._documentData = new extHostDocumentData_1.ExtHostDocumentData(new class extends types_1.NotImplementedProxy('document') {
            }, uri, content.split(/\r|\n|\r\n/g), '\n', language, 0, false);
            this._outputs = outputs;
            for (const output of this._outputs) {
                this._outputMapping.set(output, output.outputId);
                delete output.outputId;
            }
            const observableMetadata = getObservable(_metadata || {});
            this._metadata = observableMetadata.proxy;
            this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                this.updateMetadata();
            }));
        }
        get document() {
            return this._documentData.document;
        }
        get notebook() {
            return this._notebook;
        }
        get outputs() {
            return this._outputs;
        }
        set outputs(newOutputs) {
            let rawDiffs = notebookCommon_1.diff(this._outputs || [], newOutputs || [], (a) => {
                return this._outputMapping.has(a);
            });
            const transformedDiffs = rawDiffs.map(diff => {
                for (let i = diff.start; i < diff.start + diff.deleteCount; i++) {
                    this._outputMapping.delete(this._outputs[i]);
                }
                return {
                    deleteCount: diff.deleteCount,
                    start: diff.start,
                    toInsert: diff.toInsert.map((output) => {
                        if (output.outputKind === notebookCommon_1.CellOutputKind.Rich) {
                            const uuid = uuid_1.generateUuid();
                            this._outputMapping.set(output, uuid);
                            return Object.assign(Object.assign({}, output), { outputId: uuid });
                        }
                        this._outputMapping.set(output, undefined);
                        return output;
                    })
                };
            });
            this._outputs = newOutputs;
            this._onDidChangeOutputs.fire(transformedDiffs);
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            // Don't apply metadata defaults here, 'undefined' means 'inherit from document metadata'
            this._metadataChangeListener.dispose();
            const observableMetadata = getObservable(newMetadata);
            this._metadata = observableMetadata.proxy;
            this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                this.updateMetadata();
            }));
            this.updateMetadata();
        }
        updateMetadata() {
            return this._proxy.$updateNotebookCellMetadata(this._notebook.viewType, this._notebook.uri, this.handle, this._metadata);
        }
        attachTextDocument(document) {
            this._documentData = document;
            // this._initalVersion = this._documentData.version;
        }
        detachTextDocument() {
            // no-op? keep stale document until new comes along?
            // if (this._textDocument && this._textDocument.version !== this._initalVersion) {
            // 	this.originalSource = this._textDocument.getText().split(/\r|\n|\r\n/g);
            // }
            // this._textDocument = undefined;
            // this._initalVersion = -1;
        }
    }
    exports.ExtHostCell = ExtHostCell;
    class ExtHostNotebookDocument extends lifecycle_1.Disposable {
        constructor(_proxy, _documentsAndEditors, _emitter, viewType, uri, renderingHandler, _storagePath) {
            super();
            this._proxy = _proxy;
            this._documentsAndEditors = _documentsAndEditors;
            this._emitter = _emitter;
            this.viewType = viewType;
            this.uri = uri;
            this.renderingHandler = renderingHandler;
            this._storagePath = _storagePath;
            this.handle = ExtHostNotebookDocument._handlePool++;
            this._cells = [];
            this._cellDisposableMapping = new Map();
            this._languages = [];
            this._metadata = notebookCommon_1.notebookDocumentMetadataDefaults;
            this._displayOrder = [];
            this._versionId = 0;
            this._backupCounter = 1;
            this._edits = new cache_1.Cache('notebook documents');
            this._disposed = false;
            const observableMetadata = getObservable(notebookCommon_1.notebookDocumentMetadataDefaults);
            this._metadata = observableMetadata.proxy;
            this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                this.updateMetadata();
            }));
        }
        get cells() {
            return this._cells;
        }
        get languages() {
            return this._languages = [];
        }
        set languages(newLanguages) {
            this._languages = newLanguages;
            this._proxy.$updateNotebookLanguages(this.viewType, this.uri, this._languages);
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            this._metadataChangeListener.dispose();
            newMetadata = Object.assign(Object.assign({}, notebookCommon_1.notebookDocumentMetadataDefaults), newMetadata);
            if (this._metadataChangeListener) {
                this._metadataChangeListener.dispose();
            }
            const observableMetadata = getObservable(newMetadata);
            this._metadata = observableMetadata.proxy;
            this._metadataChangeListener = this._register(observableMetadata.onDidChange(() => {
                this.updateMetadata();
            }));
            this.updateMetadata();
        }
        get displayOrder() {
            return this._displayOrder;
        }
        set displayOrder(newOrder) {
            this._displayOrder = newOrder;
        }
        get versionId() {
            return this._versionId;
        }
        addEdit(item) {
            return this._edits.add([item]);
        }
        async undo(editId, isDirty) {
            await this.getEdit(editId).undo();
            // if (!isDirty) {
            // 	this.disposeBackup();
            // }
        }
        async redo(editId, isDirty) {
            await this.getEdit(editId).redo();
            // if (!isDirty) {
            // 	this.disposeBackup();
            // }
        }
        getEdit(editId) {
            const edit = this._edits.get(editId, 0);
            if (!edit) {
                throw new Error('No edit found');
            }
            return edit;
        }
        disposeEdits(editIds) {
            for (const id of editIds) {
                this._edits.delete(id);
            }
        }
        updateMetadata() {
            this._proxy.$updateNotebookMetadata(this.viewType, this.uri, this._metadata);
        }
        getNewBackupUri() {
            if (!this._storagePath) {
                throw new Error('Backup requires a valid storage path');
            }
            const fileName = hashPath(this.uri) + (this._backupCounter++);
            return resources_1.joinPath(this._storagePath, fileName);
        }
        updateBackup(backup) {
            var _a;
            (_a = this._backup) === null || _a === void 0 ? void 0 : _a.delete();
            this._backup = backup;
        }
        disposeBackup() {
            var _a;
            (_a = this._backup) === null || _a === void 0 ? void 0 : _a.delete();
            this._backup = undefined;
        }
        dispose() {
            this._disposed = true;
            super.dispose();
            this._cellDisposableMapping.forEach(cell => cell.dispose());
        }
        get fileName() { return this.uri.fsPath; }
        get isDirty() { return false; }
        accpetModelChanged(event) {
            this._versionId = event.versionId;
            if (event.kind === notebookCommon_1.NotebookCellsChangeType.Initialize) {
                this.$spliceNotebookCells(event.changes, true);
            }
            if (event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange) {
                this.$spliceNotebookCells(event.changes, false);
            }
            else if (event.kind === notebookCommon_1.NotebookCellsChangeType.Move) {
                this.$moveCell(event.index, event.newIdx);
            }
            else if (event.kind === notebookCommon_1.NotebookCellsChangeType.CellClearOutput) {
                this.$clearCellOutputs(event.index);
            }
            else if (event.kind === notebookCommon_1.NotebookCellsChangeType.CellsClearOutput) {
                this.$clearAllCellOutputs();
            }
            else if (event.kind === notebookCommon_1.NotebookCellsChangeType.ChangeLanguage) {
                this.$changeCellLanguage(event.index, event.language);
            }
        }
        $spliceNotebookCells(splices, initialization) {
            if (this._disposed) {
                return;
            }
            let contentChangeEvents = [];
            splices.reverse().forEach(splice => {
                var _a;
                let cellDtos = splice[2];
                let newCells = cellDtos.map(cell => {
                    const extCell = new ExtHostCell(this, cell.handle, uri_1.URI.revive(cell.uri), cell.source.join('\n'), cell.cellKind, cell.language, cell.outputs, cell.metadata, this._proxy);
                    const documentData = this._documentsAndEditors.getDocument(uri_1.URI.revive(cell.uri));
                    if (documentData) {
                        extCell.attachTextDocument(documentData);
                    }
                    if (!this._cellDisposableMapping.has(extCell.handle)) {
                        this._cellDisposableMapping.set(extCell.handle, new lifecycle_1.DisposableStore());
                    }
                    let store = this._cellDisposableMapping.get(extCell.handle);
                    store.add(extCell.onDidChangeOutputs((diffs) => {
                        this.eventuallyUpdateCellOutputs(extCell, diffs);
                    }));
                    return extCell;
                });
                for (let j = splice[0]; j < splice[0] + splice[1]; j++) {
                    (_a = this._cellDisposableMapping.get(this.cells[j].handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._cellDisposableMapping.delete(this.cells[j].handle);
                }
                const deletedItems = this.cells.splice(splice[0], splice[1], ...newCells);
                const event = {
                    start: splice[0],
                    deletedCount: splice[1],
                    deletedItems,
                    items: newCells
                };
                contentChangeEvents.push(event);
            });
            if (!initialization) {
                this._emitter.emitModelChange({
                    document: this,
                    changes: contentChangeEvents
                });
            }
        }
        $moveCell(index, newIdx) {
            const cells = this.cells.splice(index, 1);
            this.cells.splice(newIdx, 0, ...cells);
            const changes = [{
                    start: index,
                    deletedCount: 1,
                    deletedItems: cells,
                    items: []
                }, {
                    start: newIdx,
                    deletedCount: 0,
                    deletedItems: [],
                    items: cells
                }];
            this._emitter.emitModelChange({
                document: this,
                changes
            });
        }
        $clearCellOutputs(index) {
            const cell = this.cells[index];
            cell.outputs = [];
            const event = { document: this, cells: [cell] };
            this._emitter.emitCellOutputsChange(event);
        }
        $clearAllCellOutputs() {
            const modifedCells = [];
            this.cells.forEach(cell => {
                if (cell.outputs.length !== 0) {
                    cell.outputs = [];
                    modifedCells.push(cell);
                }
            });
            const event = { document: this, cells: modifedCells };
            this._emitter.emitCellOutputsChange(event);
        }
        $changeCellLanguage(index, language) {
            const cell = this.cells[index];
            cell.language = language;
            const event = { document: this, cell, language };
            this._emitter.emitCellLanguageChange(event);
        }
        async eventuallyUpdateCellOutputs(cell, diffs) {
            let renderers = new Set();
            let outputDtos = diffs.map(diff => {
                let outputs = diff.toInsert;
                return [diff.start, diff.deleteCount, outputs];
            });
            await this._proxy.$spliceNotebookCellOutputs(this.viewType, this.uri, cell.handle, outputDtos, Array.from(renderers));
            this._emitter.emitCellOutputsChange({
                document: this,
                cells: [cell]
            });
        }
        getCell(cellHandle) {
            return this.cells.find(cell => cell.handle === cellHandle);
        }
        getCell2(cellUri) {
            return this.cells.find(cell => cell.uri.fragment === cellUri.fragment);
        }
        attachCellTextDocument(textDocument) {
            let cell = this.cells.find(cell => cell.uri.toString() === textDocument.document.uri.toString());
            if (cell) {
                cell.attachTextDocument(textDocument);
            }
        }
        detachCellTextDocument(textDocument) {
            let cell = this.cells.find(cell => cell.uri.toString() === textDocument.document.uri.toString());
            if (cell) {
                cell.detachTextDocument();
            }
        }
    }
    exports.ExtHostNotebookDocument = ExtHostNotebookDocument;
    ExtHostNotebookDocument._handlePool = 0;
    class NotebookEditorCellEditBuilder {
        constructor(editor) {
            this.editor = editor;
            this._finalized = false;
            this._collectedEdits = [];
            this._renderers = new Set();
            this._documentVersionId = editor.document.versionId;
        }
        finalize() {
            this._finalized = true;
            return {
                documentVersionId: this._documentVersionId,
                edits: this._collectedEdits,
                renderers: Array.from(this._renderers)
            };
        }
        _throwIfFinalized() {
            if (this._finalized) {
                throw new Error('Edit is only valid while callback runs');
            }
        }
        insert(index, content, language, type, outputs, metadata) {
            this._throwIfFinalized();
            const sourceArr = Array.isArray(content) ? content : content.split(/\r|\n|\r\n/g);
            let cell = {
                source: sourceArr,
                language,
                cellKind: type,
                outputs: outputs.map(o => addIdToOutput(o)),
                metadata,
            };
            this._collectedEdits.push({
                editType: notebookCommon_1.CellEditType.Insert,
                index,
                cells: [cell]
            });
        }
        delete(index) {
            this._throwIfFinalized();
            this._collectedEdits.push({
                editType: notebookCommon_1.CellEditType.Delete,
                index,
                count: 1
            });
        }
    }
    exports.NotebookEditorCellEditBuilder = NotebookEditorCellEditBuilder;
    class ExtHostWebviewComm extends lifecycle_1.Disposable {
        constructor(id, uri, _proxy, _onDidReceiveMessage, _webviewInitData, document) {
            super();
            this.id = id;
            this.uri = uri;
            this._proxy = _proxy;
            this._onDidReceiveMessage = _onDidReceiveMessage;
            this._webviewInitData = _webviewInitData;
            this.document = document;
            this.onDidReceiveMessage = this._onDidReceiveMessage.event;
        }
        async postMessage(message) {
            return this._proxy.$postMessage(this.document.handle, message);
        }
        asWebviewUri(localResource) {
            return webview_1.asWebviewUri(this._webviewInitData, this.id, localResource);
        }
    }
    class ExtHostNotebookEditor extends lifecycle_1.Disposable {
        constructor(viewType, id, uri, _proxy, _webComm, document, _documentsAndEditors) {
            super();
            this.viewType = viewType;
            this.id = id;
            this.uri = uri;
            this._proxy = _proxy;
            this._webComm = _webComm;
            this.document = document;
            this._documentsAndEditors = _documentsAndEditors;
            this.selection = undefined;
            this._active = false;
            this._visible = false;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._onDidReceiveMessage = new event_1.Emitter();
            this.onDidReceiveMessage = this._onDidReceiveMessage.event;
            this._register(this._documentsAndEditors.onDidAddDocuments(documents => {
                for (const documentData of documents) {
                    let data = notebookCommon_1.CellUri.parse(documentData.document.uri);
                    if (data) {
                        if (this.document.uri.fsPath === data.notebook.fsPath) {
                            document.attachCellTextDocument(documentData);
                        }
                    }
                }
            }));
            this._register(this._documentsAndEditors.onDidRemoveDocuments(documents => {
                for (const documentData of documents) {
                    let data = notebookCommon_1.CellUri.parse(documentData.document.uri);
                    if (data) {
                        if (this.document.uri.fsPath === data.notebook.fsPath) {
                            document.detachCellTextDocument(documentData);
                        }
                    }
                }
            }));
            this._register(this._webComm.onDidReceiveMessage(e => {
                this._onDidReceiveMessage.fire(e);
            }));
        }
        get active() {
            return this._active;
        }
        set active(_state) {
            throw errors_1.readonly('active');
        }
        get visible() {
            return this._visible;
        }
        set visible(_state) {
            throw errors_1.readonly('visible');
        }
        _acceptVisibility(value) {
            this._visible = value;
        }
        _acceptActive(value) {
            this._active = value;
        }
        edit(callback) {
            const edit = new NotebookEditorCellEditBuilder(this);
            callback(edit);
            return this._applyEdit(edit);
        }
        _applyEdit(editBuilder) {
            const editData = editBuilder.finalize();
            // return when there is nothing to do
            if (editData.edits.length === 0) {
                return Promise.resolve(true);
            }
            let compressedEdits = [];
            let compressedEditsIndex = -1;
            for (let i = 0; i < editData.edits.length; i++) {
                if (compressedEditsIndex < 0) {
                    compressedEdits.push(editData.edits[i]);
                    compressedEditsIndex++;
                    continue;
                }
                let prevIndex = compressedEditsIndex;
                let prev = compressedEdits[prevIndex];
                if (prev.editType === notebookCommon_1.CellEditType.Insert && editData.edits[i].editType === notebookCommon_1.CellEditType.Insert) {
                    if (prev.index === editData.edits[i].index) {
                        prev.cells.push(...editData.edits[i].cells);
                        continue;
                    }
                }
                if (prev.editType === notebookCommon_1.CellEditType.Delete && editData.edits[i].editType === notebookCommon_1.CellEditType.Delete) {
                    if (prev.index === editData.edits[i].index) {
                        prev.count += editData.edits[i].count;
                        continue;
                    }
                }
                compressedEdits.push(editData.edits[i]);
                compressedEditsIndex++;
            }
            return this._proxy.$tryApplyEdits(this.viewType, this.uri, editData.documentVersionId, compressedEdits, editData.renderers);
        }
        get viewColumn() {
            return this._viewColumn;
        }
        set viewColumn(value) {
            throw errors_1.readonly('viewColumn');
        }
        async postMessage(message) {
            return this._webComm.postMessage(message);
        }
        asWebviewUri(localResource) {
            return this._webComm.asWebviewUri(localResource);
        }
        dispose() {
            this._onDidDispose.fire();
            super.dispose();
        }
    }
    exports.ExtHostNotebookEditor = ExtHostNotebookEditor;
    class ExtHostNotebookOutputRenderer {
        constructor(type, filter, renderer) {
            this.type = type;
            this.filter = filter;
            this.renderer = renderer;
            this.handle = ExtHostNotebookOutputRenderer._handlePool++;
        }
        matches(mimeType) {
            if (this.filter.mimeTypes) {
                if (this.filter.mimeTypes.indexOf(mimeType) >= 0) {
                    return true;
                }
            }
            return false;
        }
        render(document, output, outputId, mimeType) {
            let html = this.renderer.render(document, { output, outputId, mimeType });
            return html;
        }
    }
    exports.ExtHostNotebookOutputRenderer = ExtHostNotebookOutputRenderer;
    ExtHostNotebookOutputRenderer._handlePool = 0;
    class ExtHostNotebookController {
        constructor(mainContext, commands, _documentsAndEditors, _webviewInitData, _extensionStoragePaths) {
            this._documentsAndEditors = _documentsAndEditors;
            this._webviewInitData = _webviewInitData;
            this._extensionStoragePaths = _extensionStoragePaths;
            this._notebookContentProviders = new Map();
            this._notebookKernels = new Map();
            this._documents = new Map();
            this._unInitializedDocuments = new Map();
            this._editors = new Map();
            this._webviewComm = new Map();
            this._notebookOutputRenderers = new Map();
            this._onDidChangeNotebookCells = new event_1.Emitter();
            this.onDidChangeNotebookCells = this._onDidChangeNotebookCells.event;
            this._onDidChangeCellOutputs = new event_1.Emitter();
            this.onDidChangeCellOutputs = this._onDidChangeCellOutputs.event;
            this._onDidChangeCellLanguage = new event_1.Emitter();
            this.onDidChangeCellLanguage = this._onDidChangeCellLanguage.event;
            this._onDidChangeActiveNotebookEditor = new event_1.Emitter();
            this.onDidChangeActiveNotebookEditor = this._onDidChangeActiveNotebookEditor.event;
            this._onDidOpenNotebookDocument = new event_1.Emitter();
            this.onDidOpenNotebookDocument = this._onDidOpenNotebookDocument.event;
            this._onDidCloseNotebookDocument = new event_1.Emitter();
            this.onDidCloseNotebookDocument = this._onDidCloseNotebookDocument.event;
            this.visibleNotebookEditors = [];
            this._onDidChangeVisibleNotebookEditors = new event_1.Emitter();
            this.onDidChangeVisibleNotebookEditors = this._onDidChangeVisibleNotebookEditors.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebook);
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    var _a;
                    if (arg && arg.$mid === 12) {
                        const documentHandle = (_a = arg.notebookEditor) === null || _a === void 0 ? void 0 : _a.notebookHandle;
                        const cellHandle = arg.cell.handle;
                        for (let value of this._editors) {
                            if (value[1].editor.document.handle === documentHandle) {
                                const cell = value[1].editor.document.getCell(cellHandle);
                                if (cell) {
                                    return cell;
                                }
                            }
                        }
                    }
                    return arg;
                }
            });
        }
        get outputDisplayOrder() {
            return this._outputDisplayOrder;
        }
        get activeNotebookEditor() {
            return this._activeNotebookEditor;
        }
        get notebookDocuments() {
            return [...this._documents.values()];
        }
        registerNotebookOutputRenderer(type, extension, filter, renderer) {
            if (this._notebookKernels.has(type)) {
                throw new Error(`Notebook renderer for '${type}' already registered`);
            }
            let extHostRenderer = new ExtHostNotebookOutputRenderer(type, filter, renderer);
            this._notebookOutputRenderers.set(extHostRenderer.type, extHostRenderer);
            this._proxy.$registerNotebookRenderer({ id: extension.identifier, location: extension.extensionLocation }, type, filter, renderer.preloads || []);
            return new extHostTypes.Disposable(() => {
                this._notebookOutputRenderers.delete(extHostRenderer.type);
                this._proxy.$unregisterNotebookRenderer(extHostRenderer.type);
            });
        }
        async $renderOutputs(uriComponents, id, request) {
            if (!this._notebookOutputRenderers.has(id)) {
                throw new Error(`Notebook renderer for '${id}' is not registered`);
            }
            const document = this._documents.get(uri_1.URI.revive(uriComponents).toString());
            if (!document) {
                return;
            }
            const renderer = this._notebookOutputRenderers.get(id);
            const cellsResponse = request.items.map(cellInfo => {
                const cell = document.getCell2(cellInfo.key);
                const outputResponse = cellInfo.outputs.map(output => {
                    return {
                        index: output.index,
                        outputId: output.outputId,
                        mimeType: output.mimeType,
                        handlerId: id,
                        transformedOutput: renderer.render(document, cell.outputs[output.index], output.outputId, output.mimeType)
                    };
                });
                return {
                    key: cellInfo.key,
                    outputs: outputResponse
                };
            });
            return { items: cellsResponse };
        }
        /**
         * The request carry the raw data for outputs so we don't look up in the existing document
         */
        async $renderOutputs2(uriComponents, id, request) {
            if (!this._notebookOutputRenderers.has(id)) {
                throw new Error(`Notebook renderer for '${id}' is not registered`);
            }
            const document = this._documents.get(uri_1.URI.revive(uriComponents).toString());
            if (!document) {
                return;
            }
            const renderer = this._notebookOutputRenderers.get(id);
            const cellsResponse = request.items.map(cellInfo => {
                const outputResponse = cellInfo.outputs.map(output => {
                    return {
                        index: output.index,
                        outputId: output.outputId,
                        mimeType: output.mimeType,
                        handlerId: id,
                        transformedOutput: renderer.render(document, output.output, output.outputId, output.mimeType)
                    };
                });
                return {
                    key: cellInfo.key,
                    outputs: outputResponse
                };
            });
            return { items: cellsResponse };
        }
        findBestMatchedRenderer(mimeType) {
            let matches = [];
            for (let renderer of this._notebookOutputRenderers) {
                if (renderer[1].matches(mimeType)) {
                    matches.push(renderer[1]);
                }
            }
            return matches;
        }
        registerNotebookContentProvider(extension, viewType, provider) {
            if (this._notebookContentProviders.has(viewType)) {
                throw new Error(`Notebook provider for '${viewType}' already registered`);
            }
            // if ((<any>provider).executeCell) {
            // 	throw new Error('NotebookContentKernel.executeCell is removed, please use vscode.notebook.registerNotebookKernel instead.');
            // }
            this._notebookContentProviders.set(viewType, { extension, provider });
            const listener = provider.onDidChangeNotebook
                ? provider.onDidChangeNotebook(e => {
                    const document = this._documents.get(uri_1.URI.revive(e.document.uri).toString());
                    if (!document) {
                        throw new Error(`Notebook document ${e.document.uri.toString()} not found`);
                    }
                    if (isEditEvent(e)) {
                        const editId = document.addEdit(e);
                        this._proxy.$onDidEdit(e.document.uri, viewType, editId, e.label);
                    }
                    else {
                        this._proxy.$onContentChange(e.document.uri, viewType);
                    }
                })
                : lifecycle_1.Disposable.None;
            const supportBackup = !!provider.backupNotebook;
            this._proxy.$registerNotebookProvider({ id: extension.identifier, location: extension.extensionLocation }, viewType, supportBackup, provider.kernel ? { id: viewType, label: provider.kernel.label, extensionLocation: extension.extensionLocation, preloads: provider.kernel.preloads } : undefined);
            return new extHostTypes.Disposable(() => {
                listener.dispose();
                this._notebookContentProviders.delete(viewType);
                this._proxy.$unregisterNotebookProvider(viewType);
            });
        }
        registerNotebookKernel(extension, id, selectors, kernel) {
            if (this._notebookKernels.has(id)) {
                throw new Error(`Notebook kernel for '${id}' already registered`);
            }
            this._notebookKernels.set(id, { kernel, extension });
            const transformedSelectors = selectors.map(selector => typeConverters.GlobPattern.from(selector));
            this._proxy.$registerNotebookKernel({ id: extension.identifier, location: extension.extensionLocation }, id, kernel.label, transformedSelectors, kernel.preloads || []);
            return new extHostTypes.Disposable(() => {
                this._notebookKernels.delete(id);
                this._proxy.$unregisterNotebookKernel(id);
            });
        }
        async $resolveNotebookData(viewType, uri, backupId) {
            var _a, _b;
            const provider = this._notebookContentProviders.get(viewType);
            const revivedUri = uri_1.URI.revive(uri);
            if (provider) {
                let storageRoot;
                if (this._extensionStoragePaths) {
                    storageRoot = uri_1.URI.file((_a = this._extensionStoragePaths.workspaceValue(provider.extension)) !== null && _a !== void 0 ? _a : this._extensionStoragePaths.globalValue(provider.extension));
                }
                let document = this._documents.get(uri_1.URI.revive(uri).toString());
                if (!document) {
                    const that = this;
                    document = (_b = this._unInitializedDocuments.get(revivedUri.toString())) !== null && _b !== void 0 ? _b : new ExtHostNotebookDocument(this._proxy, this._documentsAndEditors, {
                        emitModelChange(event) {
                            that._onDidChangeNotebookCells.fire(event);
                        },
                        emitCellOutputsChange(event) {
                            that._onDidChangeCellOutputs.fire(event);
                        },
                        emitCellLanguageChange(event) {
                            that._onDidChangeCellLanguage.fire(event);
                        }
                    }, viewType, revivedUri, this, storageRoot);
                    this._unInitializedDocuments.set(revivedUri.toString(), document);
                }
                const rawCells = await provider.provider.openNotebook(uri_1.URI.revive(uri), { backupId });
                const dto = {
                    metadata: Object.assign(Object.assign({}, notebookCommon_1.notebookDocumentMetadataDefaults), rawCells.metadata),
                    languages: rawCells.languages,
                    cells: rawCells.cells.map(cell => (Object.assign(Object.assign({}, cell), { outputs: cell.outputs.map(o => addIdToOutput(o)) }))),
                };
                return dto;
            }
            return;
        }
        async $resolveNotebookEditor(viewType, uri, editorId) {
            var _a;
            const provider = this._notebookContentProviders.get(viewType);
            const revivedUri = uri_1.URI.revive(uri);
            const document = this._documents.get(revivedUri.toString());
            if (!document || !provider) {
                return;
            }
            if (!provider.provider.resolveNotebook) {
                return;
            }
            let webComm = (_a = this._webviewComm.get(editorId)) === null || _a === void 0 ? void 0 : _a.comm;
            if (webComm) {
                await provider.provider.resolveNotebook(document, webComm);
            }
            else {
                const onDidReceiveMessage = new event_1.Emitter();
                webComm = new ExtHostWebviewComm(editorId, revivedUri, this._proxy, onDidReceiveMessage, this._webviewInitData, document);
                this._webviewComm.set(editorId, { comm: webComm, onDidReceiveMessage });
                await provider.provider.resolveNotebook(document, webComm);
            }
        }
        async $executeNotebook(viewType, uri, cellHandle, useAttachedKernel, token) {
            let document = this._documents.get(uri_1.URI.revive(uri).toString());
            if (!document) {
                return;
            }
            if (this._notebookContentProviders.has(viewType)) {
                const cell = cellHandle !== undefined ? document.getCell(cellHandle) : undefined;
                const provider = this._notebookContentProviders.get(viewType).provider;
                if (provider.kernel && useAttachedKernel) {
                    if (cell) {
                        return provider.kernel.executeCell(document, cell, token);
                    }
                    else {
                        return provider.kernel.executeAllCells(document, token);
                    }
                }
            }
        }
        async $executeNotebook2(kernelId, viewType, uri, cellHandle, token) {
            let document = this._documents.get(uri_1.URI.revive(uri).toString());
            if (!document || document.viewType !== viewType) {
                return;
            }
            let kernelInfo = this._notebookKernels.get(kernelId);
            if (!kernelInfo) {
                return;
            }
            let cell = cellHandle !== undefined ? document.getCell(cellHandle) : undefined;
            if (cell) {
                return kernelInfo.kernel.executeCell(document, cell, token);
            }
            else {
                return kernelInfo.kernel.executeAllCells(document, token);
            }
        }
        async $saveNotebook(viewType, uri, token) {
            let document = this._documents.get(uri_1.URI.revive(uri).toString());
            if (!document) {
                return false;
            }
            if (this._notebookContentProviders.has(viewType)) {
                try {
                    await this._notebookContentProviders.get(viewType).provider.saveNotebook(document, token);
                }
                catch (e) {
                    return false;
                }
                return true;
            }
            return false;
        }
        async $saveNotebookAs(viewType, uri, target, token) {
            let document = this._documents.get(uri_1.URI.revive(uri).toString());
            if (!document) {
                return false;
            }
            if (this._notebookContentProviders.has(viewType)) {
                try {
                    await this._notebookContentProviders.get(viewType).provider.saveNotebookAs(uri_1.URI.revive(target), document, token);
                }
                catch (e) {
                    return false;
                }
                return true;
            }
            return false;
        }
        async $undoNotebook(viewType, uri, editId, isDirty) {
            const document = this._documents.get(uri_1.URI.revive(uri).toString());
            if (!document) {
                return;
            }
            document.undo(editId, isDirty);
        }
        async $redoNotebook(viewType, uri, editId, isDirty) {
            const document = this._documents.get(uri_1.URI.revive(uri).toString());
            if (!document) {
                return;
            }
            document.redo(editId, isDirty);
        }
        async $backup(viewType, uri, cancellation) {
            const document = this._documents.get(uri_1.URI.revive(uri).toString());
            const provider = this._notebookContentProviders.get(viewType);
            if (document && provider && provider.provider.backupNotebook) {
                const backup = await provider.provider.backupNotebook(document, { destination: document.getNewBackupUri() }, cancellation);
                document.updateBackup(backup);
                return backup.id;
            }
            return;
        }
        $acceptDisplayOrder(displayOrder) {
            this._outputDisplayOrder = displayOrder;
        }
        // TODO: remove document - editor one on one mapping
        _getEditorFromURI(uriComponents) {
            const uriStr = uri_1.URI.revive(uriComponents).toString();
            let editor;
            this._editors.forEach(e => {
                if (e.editor.uri.toString() === uriStr) {
                    editor = e;
                }
            });
            return editor;
        }
        $onDidReceiveMessage(editorId, message) {
            var _a;
            let messageEmitter = (_a = this._webviewComm.get(editorId)) === null || _a === void 0 ? void 0 : _a.onDidReceiveMessage;
            if (messageEmitter) {
                messageEmitter.fire(message);
            }
        }
        $acceptModelChanged(uriComponents, event) {
            const document = this._documents.get(uri_1.URI.revive(uriComponents).toString());
            if (document) {
                document.accpetModelChanged(event);
            }
        }
        $acceptEditorPropertiesChanged(uriComponents, data) {
            let editor = this._getEditorFromURI(uriComponents);
            if (!editor) {
                return;
            }
            if (data.selections) {
                const cells = editor.editor.document.cells;
                if (data.selections.selections.length) {
                    const firstCell = data.selections.selections[0];
                    editor.editor.selection = cells.find(cell => cell.handle === firstCell);
                }
                else {
                    editor.editor.selection = undefined;
                }
            }
            if (data.metadata) {
                editor.editor.document.metadata = Object.assign(Object.assign({}, notebookCommon_1.notebookDocumentMetadataDefaults), data.metadata);
            }
        }
        _createExtHostEditor(document, editorId, selections) {
            var _a, _b;
            const revivedUri = document.uri;
            let webComm = (_a = this._webviewComm.get(editorId)) === null || _a === void 0 ? void 0 : _a.comm;
            if (!webComm) {
                const onDidReceiveMessage = new event_1.Emitter();
                webComm = new ExtHostWebviewComm(editorId, revivedUri, this._proxy, onDidReceiveMessage, this._webviewInitData, document);
                this._webviewComm.set(editorId, { comm: webComm, onDidReceiveMessage });
            }
            let editor = new ExtHostNotebookEditor(document.viewType, editorId, revivedUri, this._proxy, webComm, document, this._documentsAndEditors);
            const cells = editor.document.cells;
            if (selections.length) {
                const firstCell = selections[0];
                editor.selection = cells.find(cell => cell.handle === firstCell);
            }
            else {
                editor.selection = undefined;
            }
            (_b = this._editors.get(editorId)) === null || _b === void 0 ? void 0 : _b.editor.dispose();
            this._editors.set(editorId, { editor });
        }
        async $acceptDocumentAndEditorsDelta(delta) {
            var _a, _b;
            let editorChanged = false;
            if (delta.removedDocuments) {
                delta.removedDocuments.forEach((uri) => {
                    const revivedUri = uri_1.URI.revive(uri);
                    const revivedUriStr = revivedUri.toString();
                    let document = this._documents.get(revivedUriStr);
                    if (document) {
                        document.dispose();
                        this._documents.delete(revivedUriStr);
                        this._onDidCloseNotebookDocument.fire(document);
                    }
                    [...this._editors.values()].forEach((e) => {
                        if (e.editor.uri.toString() === revivedUriStr) {
                            e.editor.dispose();
                            this._editors.delete(e.editor.id);
                            editorChanged = true;
                        }
                    });
                });
            }
            if (delta.addedDocuments) {
                delta.addedDocuments.forEach(modelData => {
                    var _a, _b, _c;
                    const revivedUri = uri_1.URI.revive(modelData.uri);
                    const revivedUriStr = revivedUri.toString();
                    const viewType = modelData.viewType;
                    const entry = this._notebookContentProviders.get(viewType);
                    let storageRoot;
                    if (entry && this._extensionStoragePaths) {
                        storageRoot = uri_1.URI.file((_a = this._extensionStoragePaths.workspaceValue(entry.extension)) !== null && _a !== void 0 ? _a : this._extensionStoragePaths.globalValue(entry.extension));
                    }
                    if (!this._documents.has(revivedUriStr)) {
                        const that = this;
                        let document = (_b = this._unInitializedDocuments.get(revivedUriStr)) !== null && _b !== void 0 ? _b : new ExtHostNotebookDocument(this._proxy, this._documentsAndEditors, {
                            emitModelChange(event) {
                                that._onDidChangeNotebookCells.fire(event);
                            },
                            emitCellOutputsChange(event) {
                                that._onDidChangeCellOutputs.fire(event);
                            },
                            emitCellLanguageChange(event) {
                                that._onDidChangeCellLanguage.fire(event);
                            }
                        }, viewType, revivedUri, this, storageRoot);
                        this._unInitializedDocuments.delete(revivedUriStr);
                        if (modelData.metadata) {
                            document.metadata = Object.assign(Object.assign({}, notebookCommon_1.notebookDocumentMetadataDefaults), modelData.metadata);
                        }
                        document.accpetModelChanged({
                            kind: notebookCommon_1.NotebookCellsChangeType.Initialize,
                            versionId: modelData.versionId,
                            changes: [[
                                    0,
                                    0,
                                    modelData.cells
                                ]]
                        });
                        (_c = this._documents.get(revivedUriStr)) === null || _c === void 0 ? void 0 : _c.dispose();
                        this._documents.set(revivedUriStr, document);
                        // create editor if populated
                        if (modelData.attachedEditor) {
                            this._createExtHostEditor(document, modelData.attachedEditor.id, modelData.attachedEditor.selections);
                            editorChanged = true;
                        }
                    }
                    const document = this._documents.get(revivedUriStr);
                    this._onDidOpenNotebookDocument.fire(document);
                });
            }
            if (delta.addedEditors) {
                delta.addedEditors.forEach(editorModelData => {
                    if (this._editors.has(editorModelData.id)) {
                        return;
                    }
                    const revivedUri = uri_1.URI.revive(editorModelData.documentUri);
                    const document = this._documents.get(revivedUri.toString());
                    if (document) {
                        this._createExtHostEditor(document, editorModelData.id, editorModelData.selections);
                        editorChanged = true;
                    }
                });
            }
            const removedEditors = [];
            if (delta.removedEditors) {
                delta.removedEditors.forEach(editorid => {
                    var _a;
                    const editor = this._editors.get(editorid);
                    if (editor) {
                        editorChanged = true;
                        this._editors.delete(editorid);
                        if (((_a = this.activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.id) === editor.editor.id) {
                            this._activeNotebookEditor = undefined;
                        }
                        removedEditors.push(editor);
                    }
                });
            }
            if (editorChanged) {
                removedEditors.forEach(e => {
                    e.editor.dispose();
                });
            }
            if (delta.visibleEditors) {
                this.visibleNotebookEditors = delta.visibleEditors.map(id => this._editors.get(id).editor).filter(editor => !!editor);
                const visibleEditorsSet = new Set();
                this.visibleNotebookEditors.forEach(editor => visibleEditorsSet.add(editor.id));
                [...this._editors.values()].forEach((e) => {
                    const newValue = visibleEditorsSet.has(e.editor.id);
                    e.editor._acceptVisibility(newValue);
                });
                this.visibleNotebookEditors = [...this._editors.values()].map(e => e.editor).filter(e => e.visible);
                this._onDidChangeVisibleNotebookEditors.fire(this.visibleNotebookEditors);
            }
            if (delta.newActiveEditor !== undefined) {
                if (delta.newActiveEditor) {
                    this._activeNotebookEditor = (_a = this._editors.get(delta.newActiveEditor)) === null || _a === void 0 ? void 0 : _a.editor;
                    (_b = this._activeNotebookEditor) === null || _b === void 0 ? void 0 : _b._acceptActive(true);
                    [...this._editors.values()].forEach((e) => {
                        if (e.editor !== this.activeNotebookEditor) {
                            e.editor._acceptActive(false);
                        }
                    });
                }
                else {
                    // clear active notebook as current active editor is non-notebook editor
                    this._activeNotebookEditor = undefined;
                    [...this._editors.values()].forEach((e) => {
                        e.editor._acceptActive(false);
                    });
                }
                this._onDidChangeActiveNotebookEditor.fire(this._activeNotebookEditor);
            }
        }
    }
    exports.ExtHostNotebookController = ExtHostNotebookController;
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return hash_1.hash(str) + '';
    }
    function isEditEvent(e) {
        return typeof e.undo === 'function'
            && typeof e.redo === 'function';
    }
});
//# __sourceMappingURL=extHostNotebook.js.map