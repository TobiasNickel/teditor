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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/contrib/notebook/browser/extensionPoint", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/notebook/common/notebookOutputRenderer", "vs/base/common/iterator", "vs/workbench/services/editor/common/editorService", "vs/base/common/glob", "vs/base/common/path", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/common/accessibility", "vs/workbench/common/memento", "vs/platform/storage/common/storage", "vs/base/common/uuid"], function (require, exports, nls, lifecycle_1, uri_1, extensionPoint_1, notebookProvider_1, event_1, notebookCommon_1, extensions_1, notebookOutputRenderer_1, iterator_1, editorService_1, glob, path_1, configuration_1, accessibility_1, memento_1, storage_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookService = exports.NotebookOutputRendererInfoStore = exports.NotebookProviderInfoStore = void 0;
    function MODEL_ID(resource) {
        return resource.toString();
    }
    class NotebookProviderInfoStore {
        constructor(storageService) {
            this._contributedEditors = new Map();
            this._memento = new memento_1.Memento(NotebookProviderInfoStore.CUSTOM_EDITORS_STORAGE_ID, storageService);
            const mementoObject = this._memento.getMemento(0 /* GLOBAL */);
            for (const info of (mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] || [])) {
                this.add(new notebookProvider_1.NotebookProviderInfo(info));
            }
        }
        update(extensions) {
            this.clear();
            for (const extension of extensions) {
                for (const notebookContribution of extension.value) {
                    this.add(new notebookProvider_1.NotebookProviderInfo({
                        id: notebookContribution.viewType,
                        displayName: notebookContribution.displayName,
                        selector: notebookContribution.selector || [],
                        priority: this._convertPriority(notebookContribution.priority),
                        providerDisplayName: extension.description.isBuiltin ? nls.localize('builtinProviderDisplayName', "Built-in") : extension.description.displayName || extension.description.identifier.value,
                        providerExtensionLocation: extension.description.extensionLocation
                    }));
                }
            }
            const mementoObject = this._memento.getMemento(0 /* GLOBAL */);
            mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
        }
        _convertPriority(priority) {
            if (!priority) {
                return notebookCommon_1.NotebookEditorPriority.default;
            }
            if (priority === notebookCommon_1.NotebookEditorPriority.default) {
                return notebookCommon_1.NotebookEditorPriority.default;
            }
            return notebookCommon_1.NotebookEditorPriority.option;
        }
        dispose() {
        }
        clear() {
            this._contributedEditors.clear();
        }
        get(viewType) {
            return this._contributedEditors.get(viewType);
        }
        add(info) {
            if (this._contributedEditors.has(info.id)) {
                return;
            }
            this._contributedEditors.set(info.id, info);
        }
        getContributedNotebook(resource) {
            return [...iterator_1.Iterable.filter(this._contributedEditors.values(), customEditor => resource.scheme === 'untitled' || customEditor.matches(resource))];
        }
        [Symbol.iterator]() {
            return this._contributedEditors.values();
        }
    }
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore;
    NotebookProviderInfoStore.CUSTOM_EDITORS_STORAGE_ID = 'notebookEditors';
    NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID = 'editors';
    class NotebookOutputRendererInfoStore {
        constructor() {
            this.contributedRenderers = new Map();
        }
        clear() {
            this.contributedRenderers.clear();
        }
        get(viewType) {
            return this.contributedRenderers.get(viewType);
        }
        add(info) {
            if (this.contributedRenderers.has(info.id)) {
                return;
            }
            this.contributedRenderers.set(info.id, info);
        }
        getContributedRenderer(mimeType) {
            return Array.from(this.contributedRenderers.values()).filter(customEditor => customEditor.matches(mimeType));
        }
    }
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore;
    class ModelData {
        constructor(model, onWillDispose) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    let NotebookService = class NotebookService extends lifecycle_1.Disposable {
        constructor(_extensionService, _editorService, _configurationService, _accessibilityService, _storageService) {
            super();
            this._extensionService = _extensionService;
            this._editorService = _editorService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._storageService = _storageService;
            this._notebookProviders = new Map();
            this._notebookRenderers = new Map();
            this._notebookKernels = new Map();
            this.notebookRenderersInfoStore = new NotebookOutputRendererInfoStore();
            this._models = new Map();
            this._onDidChangeActiveEditor = new event_1.Emitter();
            this.onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;
            this._onDidChangeVisibleEditors = new event_1.Emitter();
            this.onDidChangeVisibleEditors = this._onDidChangeVisibleEditors.event;
            this._onNotebookEditorAdd = this._register(new event_1.Emitter());
            this.onNotebookEditorAdd = this._onNotebookEditorAdd.event;
            this._onNotebookEditorsRemove = this._register(new event_1.Emitter());
            this.onNotebookEditorsRemove = this._onNotebookEditorsRemove.event;
            this._onNotebookDocumentAdd = this._register(new event_1.Emitter());
            this.onNotebookDocumentAdd = this._onNotebookDocumentAdd.event;
            this._onNotebookDocumentRemove = this._register(new event_1.Emitter());
            this.onNotebookDocumentRemove = this._onNotebookDocumentRemove.event;
            this._notebookEditors = new Map();
            this._onDidChangeViewTypes = new event_1.Emitter();
            this.onDidChangeViewTypes = this._onDidChangeViewTypes.event;
            this._onDidChangeKernels = new event_1.Emitter();
            this.onDidChangeKernels = this._onDidChangeKernels.event;
            this._displayOrder = Object.create(null);
            this.notebookProviderInfoStore = new NotebookProviderInfoStore(this._storageService);
            this._register(this.notebookProviderInfoStore);
            extensionPoint_1.notebookProviderExtensionPoint.setHandler((extensions) => {
                this.notebookProviderInfoStore.update(extensions);
                // console.log(this._notebookProviderInfoStore);
            });
            extensionPoint_1.notebookRendererExtensionPoint.setHandler((renderers) => {
                this.notebookRenderersInfoStore.clear();
                for (const extension of renderers) {
                    for (const notebookContribution of extension.value) {
                        this.notebookRenderersInfoStore.add(new notebookOutputRenderer_1.NotebookOutputRendererInfo({
                            id: notebookContribution.viewType,
                            displayName: notebookContribution.displayName,
                            mimeTypes: notebookContribution.mimeTypes || []
                        }));
                    }
                }
                // console.log(this.notebookRenderersInfoStore);
            });
            this._editorService.registerCustomEditorViewTypesHandler('Notebook', this);
            const updateOrder = () => {
                let userOrder = this._configurationService.getValue('notebook.displayOrder');
                this._displayOrder = {
                    defaultOrder: this._accessibilityService.isScreenReaderOptimized() ? notebookCommon_1.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER : notebookCommon_1.NOTEBOOK_DISPLAY_ORDER,
                    userOrder: userOrder
                };
            };
            updateOrder();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectedKeys.indexOf('notebook.displayOrder') >= 0) {
                    updateOrder();
                }
            }));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                updateOrder();
            }));
        }
        getViewTypes() {
            return [...this.notebookProviderInfoStore].map(info => ({
                id: info.id,
                displayName: info.displayName,
                providerDisplayName: info.providerDisplayName
            }));
        }
        async canResolve(viewType) {
            if (!this._notebookProviders.has(viewType)) {
                await this._extensionService.whenInstalledExtensionsRegistered();
                // notebook providers/kernels/renderers might use `*` as activation event.
                await this._extensionService.activateByEvent(`*`);
                // this awaits full activation of all matching extensions
                await this._extensionService.activateByEvent(`onNotebookEditor:${viewType}`);
            }
            return this._notebookProviders.has(viewType);
        }
        registerNotebookController(viewType, extensionData, controller) {
            this._notebookProviders.set(viewType, { extensionData, controller });
            this.notebookProviderInfoStore.get(viewType).kernel = controller.kernel;
            this._onDidChangeViewTypes.fire();
        }
        unregisterNotebookProvider(viewType) {
            this._notebookProviders.delete(viewType);
            this._onDidChangeViewTypes.fire();
        }
        registerNotebookRenderer(id, renderer) {
            this._notebookRenderers.set(id, renderer);
        }
        unregisterNotebookRenderer(id) {
            this._notebookRenderers.delete(id);
        }
        registerNotebookKernel(notebook) {
            this._notebookKernels.set(notebook.id, notebook);
            this._onDidChangeKernels.fire();
        }
        unregisterNotebookKernel(id) {
            this._notebookKernels.delete(id);
            this._onDidChangeKernels.fire();
        }
        getContributedNotebookKernels(viewType, resource) {
            let kernelInfos = [];
            this._notebookKernels.forEach(kernel => {
                if (this._notebookKernelMatch(resource, kernel.selectors)) {
                    kernelInfos.push(kernel);
                }
            });
            // sort by extensions
            const notebookContentProvider = this._notebookProviders.get(viewType);
            if (!notebookContentProvider) {
                return kernelInfos;
            }
            kernelInfos = kernelInfos.sort((a, b) => {
                if (a.extension.value === notebookContentProvider.extensionData.id.value) {
                    return -1;
                }
                else if (b.extension.value === notebookContentProvider.extensionData.id.value) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            return kernelInfos;
        }
        _notebookKernelMatch(resource, selectors) {
            for (let i = 0; i < selectors.length; i++) {
                const pattern = typeof selectors[i] !== 'string' ? selectors[i] : selectors[i].toString();
                if (glob.match(pattern, path_1.basename(resource.fsPath).toLowerCase())) {
                    return true;
                }
            }
            return false;
        }
        getRendererInfo(id) {
            const renderer = this._notebookRenderers.get(id);
            return renderer;
        }
        async createNotebookFromBackup(viewType, uri, metadata, languages, cells, editorId) {
            const provider = this._notebookProviders.get(viewType);
            if (!provider) {
                return undefined;
            }
            const notebookModel = await provider.controller.createNotebook(viewType, uri, { metadata, languages, cells }, false, editorId);
            if (!notebookModel) {
                return undefined;
            }
            // new notebook model created
            const modelId = MODEL_ID(uri);
            const modelData = new ModelData(notebookModel, (model) => this._onWillDisposeDocument(model));
            this._models.set(modelId, modelData);
            this._onNotebookDocumentAdd.fire([notebookModel.uri]);
            // after the document is added to the store and sent to ext host, we transform the ouputs
            await this.transformTextModelOutputs(notebookModel);
            return modelData.model;
        }
        async resolveNotebook(viewType, uri, forceReload, editorId, backupId) {
            const provider = this._notebookProviders.get(viewType);
            if (!provider) {
                return undefined;
            }
            const notebookModel = await provider.controller.createNotebook(viewType, uri, undefined, forceReload, editorId, backupId);
            if (!notebookModel) {
                return undefined;
            }
            // new notebook model created
            const modelId = MODEL_ID(uri);
            const modelData = new ModelData(notebookModel, (model) => this._onWillDisposeDocument(model));
            this._models.set(modelId, modelData);
            this._onNotebookDocumentAdd.fire([notebookModel.uri]);
            // after the document is added to the store and sent to ext host, we transform the ouputs
            await this.transformTextModelOutputs(notebookModel);
            if (editorId) {
                await provider.controller.resolveNotebookEditor(viewType, uri, editorId);
            }
            return modelData.model;
        }
        async _fillInTransformedOutputs(renderers, requestItems, renderFunc, lookUp) {
            for (let id of renderers) {
                const requestsPerRenderer = requestItems.map(req => {
                    return {
                        key: req.key,
                        outputs: req.outputs.filter(output => output.handlerId === id)
                    };
                });
                const response = await renderFunc(id, requestsPerRenderer);
                // mix the response with existing outputs, which will replace the picked transformed mimetype with resolved result
                if (response) {
                    response.items.forEach(cellInfo => {
                        const cell = lookUp(cellInfo.key);
                        cellInfo.outputs.forEach(outputInfo => {
                            const output = cell.outputs[outputInfo.index];
                            if (output.outputKind === notebookCommon_1.CellOutputKind.Rich && output.orderedMimeTypes && output.orderedMimeTypes.length) {
                                output.orderedMimeTypes[0] = {
                                    mimeType: outputInfo.mimeType,
                                    isResolved: true,
                                    rendererId: outputInfo.handlerId,
                                    output: outputInfo.transformedOutput
                                };
                            }
                        });
                    });
                }
            }
        }
        async transformTextModelOutputs(textModel) {
            const renderers = new Set();
            const cellMapping = new Map();
            const requestItems = [];
            for (let i = 0; i < textModel.cells.length; i++) {
                const cell = textModel.cells[i];
                cellMapping.set(cell.uri.fragment, cell);
                const outputs = cell.outputs;
                const outputRequest = [];
                outputs.forEach((output, index) => {
                    if (output.outputKind === notebookCommon_1.CellOutputKind.Rich) {
                        // TODO no string[] casting
                        const ret = this._transformMimeTypes(output, output.outputId, textModel.metadata.displayOrder || []);
                        const orderedMimeTypes = ret.orderedMimeTypes;
                        const pickedMimeTypeIndex = ret.pickedMimeTypeIndex;
                        output.pickedMimeTypeIndex = pickedMimeTypeIndex;
                        output.orderedMimeTypes = orderedMimeTypes;
                        if (orderedMimeTypes[pickedMimeTypeIndex].rendererId && orderedMimeTypes[pickedMimeTypeIndex].rendererId !== notebookCommon_1.BUILTIN_RENDERER_ID) {
                            outputRequest.push({ index, handlerId: orderedMimeTypes[pickedMimeTypeIndex].rendererId, mimeType: orderedMimeTypes[pickedMimeTypeIndex].mimeType, outputId: output.outputId });
                            renderers.add(orderedMimeTypes[pickedMimeTypeIndex].rendererId);
                        }
                    }
                });
                requestItems.push({ key: cell.uri, outputs: outputRequest });
            }
            await this._fillInTransformedOutputs(renderers, requestItems, async (rendererId, items) => {
                var _a;
                return await ((_a = this._notebookRenderers.get(rendererId)) === null || _a === void 0 ? void 0 : _a.render(textModel.uri, { items: items }));
            }, (key) => { return cellMapping.get(uri_1.URI.revive(key).fragment); });
            textModel.updateRenderers([...renderers]);
        }
        async transformEditsOutputs(textModel, edits) {
            const renderers = new Set();
            const requestItems = [];
            edits.forEach((edit, editIndex) => {
                if (edit.editType === notebookCommon_1.CellEditType.Insert) {
                    edit.cells.forEach((cell, cellIndex) => {
                        const outputs = cell.outputs;
                        const outputRequest = [];
                        outputs.map((output, index) => {
                            if (output.outputKind === notebookCommon_1.CellOutputKind.Rich) {
                                const ret = this._transformMimeTypes(output, output.outputId, textModel.metadata.displayOrder || []);
                                const orderedMimeTypes = ret.orderedMimeTypes;
                                const pickedMimeTypeIndex = ret.pickedMimeTypeIndex;
                                output.pickedMimeTypeIndex = pickedMimeTypeIndex;
                                output.orderedMimeTypes = orderedMimeTypes;
                                if (orderedMimeTypes[pickedMimeTypeIndex].rendererId && orderedMimeTypes[pickedMimeTypeIndex].rendererId !== notebookCommon_1.BUILTIN_RENDERER_ID) {
                                    outputRequest.push({ index, handlerId: orderedMimeTypes[pickedMimeTypeIndex].rendererId, mimeType: orderedMimeTypes[pickedMimeTypeIndex].mimeType, output: output, outputId: output.outputId });
                                    renderers.add(orderedMimeTypes[pickedMimeTypeIndex].rendererId);
                                }
                            }
                        });
                        requestItems.push({ key: [editIndex, cellIndex], outputs: outputRequest });
                    });
                }
            });
            await this._fillInTransformedOutputs(renderers, requestItems, async (rendererId, items) => {
                var _a;
                return await ((_a = this._notebookRenderers.get(rendererId)) === null || _a === void 0 ? void 0 : _a.render2(textModel.uri, { items: items }));
            }, (key) => {
                return edits[key[0]].cells[key[1]];
            });
            textModel.updateRenderers([...renderers]);
        }
        async transformSpliceOutputs(textModel, splices) {
            const renderers = new Set();
            const requestItems = [];
            splices.forEach((splice, spliceIndex) => {
                const outputs = splice[2];
                const outputRequest = [];
                outputs.map((output, index) => {
                    if (output.outputKind === notebookCommon_1.CellOutputKind.Rich) {
                        const ret = this._transformMimeTypes(output, output.outputId, textModel.metadata.displayOrder || []);
                        const orderedMimeTypes = ret.orderedMimeTypes;
                        const pickedMimeTypeIndex = ret.pickedMimeTypeIndex;
                        output.pickedMimeTypeIndex = pickedMimeTypeIndex;
                        output.orderedMimeTypes = orderedMimeTypes;
                        if (orderedMimeTypes[pickedMimeTypeIndex].rendererId && orderedMimeTypes[pickedMimeTypeIndex].rendererId !== notebookCommon_1.BUILTIN_RENDERER_ID) {
                            outputRequest.push({ index, handlerId: orderedMimeTypes[pickedMimeTypeIndex].rendererId, mimeType: orderedMimeTypes[pickedMimeTypeIndex].mimeType, output: output, outputId: output.outputId });
                            renderers.add(orderedMimeTypes[pickedMimeTypeIndex].rendererId);
                        }
                    }
                });
                requestItems.push({ key: spliceIndex, outputs: outputRequest });
            });
            await this._fillInTransformedOutputs(renderers, requestItems, async (rendererId, items) => {
                var _a;
                return await ((_a = this._notebookRenderers.get(rendererId)) === null || _a === void 0 ? void 0 : _a.render2(textModel.uri, { items: items }));
            }, (key) => {
                return { outputs: splices[key][2] };
            });
            textModel.updateRenderers([...renderers]);
        }
        async transformSingleOutput(textModel, output, rendererId, mimeType) {
            var _a;
            const items = [
                {
                    key: 0,
                    outputs: [
                        {
                            index: 0,
                            outputId: uuid_1.generateUuid(),
                            handlerId: rendererId,
                            mimeType: mimeType,
                            output: output
                        }
                    ]
                }
            ];
            const response = await ((_a = this._notebookRenderers.get(rendererId)) === null || _a === void 0 ? void 0 : _a.render2(textModel.uri, { items: items }));
            if (response) {
                textModel.updateRenderers([rendererId]);
                const outputInfo = response.items[0].outputs[0];
                return {
                    mimeType: outputInfo.mimeType,
                    isResolved: true,
                    rendererId: outputInfo.handlerId,
                    output: outputInfo.transformedOutput
                };
            }
            return;
        }
        _transformMimeTypes(output, outputId, documentDisplayOrder) {
            let mimeTypes = Object.keys(output.data);
            let coreDisplayOrder = this._displayOrder;
            const sorted = notebookCommon_1.sortMimeTypes(mimeTypes, (coreDisplayOrder === null || coreDisplayOrder === void 0 ? void 0 : coreDisplayOrder.userOrder) || [], documentDisplayOrder, (coreDisplayOrder === null || coreDisplayOrder === void 0 ? void 0 : coreDisplayOrder.defaultOrder) || []);
            let orderMimeTypes = [];
            sorted.forEach(mimeType => {
                let handlers = this.findBestMatchedRenderer(mimeType);
                if (handlers.length) {
                    const handler = handlers[0];
                    orderMimeTypes.push({
                        mimeType: mimeType,
                        isResolved: false,
                        rendererId: handler.id,
                    });
                    for (let i = 1; i < handlers.length; i++) {
                        orderMimeTypes.push({
                            mimeType: mimeType,
                            isResolved: false,
                            rendererId: handlers[i].id
                        });
                    }
                    if (notebookCommon_1.mimeTypeSupportedByCore(mimeType)) {
                        orderMimeTypes.push({
                            mimeType: mimeType,
                            isResolved: false,
                            rendererId: notebookCommon_1.BUILTIN_RENDERER_ID
                        });
                    }
                }
                else {
                    orderMimeTypes.push({
                        mimeType: mimeType,
                        isResolved: false,
                        rendererId: notebookCommon_1.BUILTIN_RENDERER_ID
                    });
                }
            });
            return {
                outputKind: output.outputKind,
                outputId,
                data: output.data,
                orderedMimeTypes: orderMimeTypes,
                pickedMimeTypeIndex: 0
            };
        }
        findBestMatchedRenderer(mimeType) {
            return this.notebookRenderersInfoStore.getContributedRenderer(mimeType);
        }
        async executeNotebook(viewType, uri, useAttachedKernel, token) {
            let provider = this._notebookProviders.get(viewType);
            if (provider) {
                return provider.controller.executeNotebook(viewType, uri, useAttachedKernel, token);
            }
            return;
        }
        async executeNotebookCell(viewType, uri, handle, useAttachedKernel, token) {
            const provider = this._notebookProviders.get(viewType);
            if (provider) {
                await provider.controller.executeNotebookCell(uri, handle, useAttachedKernel, token);
            }
        }
        async executeNotebook2(viewType, uri, kernelId, token) {
            const kernel = this._notebookKernels.get(kernelId);
            if (kernel) {
                await kernel.executeNotebook(viewType, uri, undefined, token);
            }
        }
        async executeNotebookCell2(viewType, uri, handle, kernelId, token) {
            const kernel = this._notebookKernels.get(kernelId);
            if (kernel) {
                await kernel.executeNotebook(viewType, uri, handle, token);
            }
        }
        getContributedNotebookProviders(resource) {
            return this.notebookProviderInfoStore.getContributedNotebook(resource);
        }
        getContributedNotebookProvider(viewType) {
            return this.notebookProviderInfoStore.get(viewType);
        }
        getContributedNotebookOutputRenderers(mimeType) {
            return this.notebookRenderersInfoStore.getContributedRenderer(mimeType);
        }
        getNotebookProviderResourceRoots() {
            let ret = [];
            this._notebookProviders.forEach(val => {
                ret.push(uri_1.URI.revive(val.extensionData.location));
            });
            return ret;
        }
        removeNotebookEditor(editor) {
            let editorCache = this._notebookEditors.get(editor.getId());
            if (editorCache) {
                this._notebookEditors.delete(editor.getId());
                this._onNotebookEditorsRemove.fire([editor]);
            }
        }
        addNotebookEditor(editor) {
            this._notebookEditors.set(editor.getId(), editor);
            this._onNotebookEditorAdd.fire(editor);
        }
        listNotebookEditors() {
            return [...this._notebookEditors].map(e => e[1]);
        }
        listVisibleNotebookEditors() {
            return this._editorService.visibleEditorPanes
                .filter(pane => pane.isNotebookEditor)
                .map(pane => pane.getControl())
                .filter(editor => !!editor)
                .filter(editor => this._notebookEditors.has(editor.getId()));
        }
        listNotebookDocuments() {
            return [...this._models].map(e => e[1].model);
        }
        destoryNotebookDocument(viewType, notebook) {
            this._onWillDisposeDocument(notebook);
        }
        updateActiveNotebookEditor(editor) {
            this._onDidChangeActiveEditor.fire(editor ? editor.getId() : null);
        }
        updateVisibleNotebookEditor(editors) {
            const alreadyCreated = editors.filter(editorId => this._notebookEditors.has(editorId));
            this._onDidChangeVisibleEditors.fire(alreadyCreated);
        }
        setToCopy(items) {
            this.cutItems = items;
        }
        getToCopy() {
            return this.cutItems;
        }
        async save(viewType, resource, token) {
            let provider = this._notebookProviders.get(viewType);
            if (provider) {
                return provider.controller.save(resource, token);
            }
            return false;
        }
        async saveAs(viewType, resource, target, token) {
            let provider = this._notebookProviders.get(viewType);
            if (provider) {
                return provider.controller.saveAs(resource, target, token);
            }
            return false;
        }
        async backup(viewType, uri, token) {
            let provider = this._notebookProviders.get(viewType);
            if (provider) {
                return provider.controller.backup(uri, token);
            }
            return;
        }
        onDidReceiveMessage(viewType, editorId, message) {
            let provider = this._notebookProviders.get(viewType);
            if (provider) {
                return provider.controller.onDidReceiveMessage(editorId, message);
            }
        }
        _onWillDisposeDocument(model) {
            let modelId = MODEL_ID(model.uri);
            let modelData = this._models.get(modelId);
            this._models.delete(modelId);
            if (modelData) {
                // delete editors and documents
                const willRemovedEditors = [];
                this._notebookEditors.forEach(editor => {
                    if (editor.textModel === modelData.model) {
                        willRemovedEditors.push(editor);
                    }
                });
                willRemovedEditors.forEach(e => this._notebookEditors.delete(e.getId()));
                let provider = this._notebookProviders.get(modelData.model.viewType);
                if (provider) {
                    provider.controller.removeNotebookDocument(modelData.model);
                }
                this._onNotebookEditorsRemove.fire(willRemovedEditors.map(e => e));
                this._onNotebookDocumentRemove.fire([modelData.model.uri]);
                modelData === null || modelData === void 0 ? void 0 : modelData.dispose();
            }
        }
    };
    NotebookService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, editorService_1.IEditorService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, accessibility_1.IAccessibilityService),
        __param(4, storage_1.IStorageService)
    ], NotebookService);
    exports.NotebookService = NotebookService;
});
//# __sourceMappingURL=notebookServiceImpl.js.map