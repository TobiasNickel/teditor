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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/event", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/platform/files/common/files", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/services/textfile/common/textFileSaveParticipant", "vs/platform/notification/common/notification", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/base/common/resources", "vs/editor/common/model/textModel", "vs/editor/common/modes/modesRegistry", "vs/workbench/services/uriIdentity/common/uriIdentity"], function (require, exports, nls_1, errorMessage_1, event_1, textFileEditorModel_1, lifecycle_1, lifecycle_2, instantiation_1, map_1, files_1, arrays_1, async_1, errors_1, textFileSaveParticipant_1, notification_1, workingCopyFileService_1, resources_1, textModel_1, modesRegistry_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorModelManager = void 0;
    let TextFileEditorModelManager = class TextFileEditorModelManager extends lifecycle_1.Disposable {
        constructor(lifecycleService, instantiationService, fileService, notificationService, workingCopyFileService, uriIdentityService) {
            super();
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.notificationService = notificationService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidCreate = this._register(new event_1.Emitter());
            this.onDidCreate = this._onDidCreate.event;
            this._onDidLoad = this._register(new event_1.Emitter());
            this.onDidLoad = this._onDidLoad.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSaveError = this._register(new event_1.Emitter());
            this.onDidSaveError = this._onDidSaveError.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this.mapResourceToModel = new map_1.ResourceMap();
            this.mapResourceToModelListeners = new map_1.ResourceMap();
            this.mapResourceToDisposeListener = new map_1.ResourceMap();
            this.mapResourceToPendingModelLoaders = new map_1.ResourceMap();
            this.modelLoadQueue = this._register(new async_1.ResourceQueue());
            this.saveErrorHandler = (() => {
                const notificationService = this.notificationService;
                return {
                    onSaveError(error, model) {
                        notificationService.error(nls_1.localize('genericSaveError', "Failed to save '{0}': {1}", model.name, errorMessage_1.toErrorMessage(error, false)));
                    }
                };
            })();
            this.mapCorrelationIdToModelsToRestore = new Map();
            //#region Save participants
            this.saveParticipants = this._register(this.instantiationService.createInstance(textFileSaveParticipant_1.TextFileSaveParticipant));
            this.registerListeners();
        }
        get models() {
            return [...this.mapResourceToModel.values()];
        }
        registerListeners() {
            // Update models from file change events
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Working copy operations
            this._register(this.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => this.onWillRunWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidFailWorkingCopyFileOperation(e => this.onDidFailWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this.onDidRunWorkingCopyFileOperation(e)));
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
        }
        onDidFilesChange(e) {
            // Collect distinct (saved) models to update.
            //
            // Note: we also consider the added event because it could be that a file was added
            // and updated right after.
            arrays_1.distinct(arrays_1.coalesce([...e.getUpdated(), ...e.getAdded()].map(({ resource }) => this.get(resource))).filter(model => model && model.isResolved() && !model.isDirty()), model => model.resource.toString()).forEach(model => this.queueModelLoad(model));
        }
        queueModelLoad(model) {
            // Load model to update (use a queue to prevent accumulation of loads
            // when the load actually takes long. At most we only want the queue
            // to have a size of 2 (1 running load and 1 queued load).
            const queue = this.modelLoadQueue.queueFor(model.resource);
            if (queue.size <= 1) {
                queue.queue(async () => {
                    try {
                        await model.load();
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                    }
                });
            }
        }
        onWillRunWorkingCopyFileOperation(e) {
            // Move / Copy: remember models to restore after the operation
            const source = e.source;
            if (source && (e.operation === 3 /* COPY */ || e.operation === 2 /* MOVE */)) {
                // find all models that related to either source or target (can be many if resource is a folder)
                const sourceModels = [];
                const targetModels = [];
                for (const model of this.models) {
                    const resource = model.resource;
                    if (resources_1.extUri.isEqualOrParent(resource, e.target)) {
                        // EXPLICITLY do not ignorecase, see https://github.com/Microsoft/vscode/issues/56384
                        targetModels.push(model);
                    }
                    if (this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                        sourceModels.push(model);
                    }
                }
                // remember each source model to load again after move is done
                // with optional content to restore if it was dirty
                const modelsToRestore = [];
                for (const sourceModel of sourceModels) {
                    const sourceModelResource = sourceModel.resource;
                    // If the source is the actual model, just use target as new resource
                    let targetModelResource;
                    if (this.uriIdentityService.extUri.isEqual(sourceModelResource, e.source)) {
                        targetModelResource = e.target;
                    }
                    // Otherwise a parent folder of the source is being moved, so we need
                    // to compute the target resource based on that
                    else {
                        targetModelResource = resources_1.joinPath(e.target, sourceModelResource.path.substr(source.path.length + 1));
                    }
                    modelsToRestore.push({
                        source: sourceModelResource,
                        target: targetModelResource,
                        mode: sourceModel.getMode(),
                        encoding: sourceModel.getEncoding(),
                        snapshot: sourceModel.isDirty() ? sourceModel.createSnapshot() : undefined
                    });
                }
                this.mapCorrelationIdToModelsToRestore.set(e.correlationId, modelsToRestore);
            }
        }
        onDidFailWorkingCopyFileOperation(e) {
            // Move / Copy: restore dirty flag on models to restore that were dirty
            if ((e.operation === 3 /* COPY */ || e.operation === 2 /* MOVE */)) {
                const modelsToRestore = this.mapCorrelationIdToModelsToRestore.get(e.correlationId);
                if (modelsToRestore) {
                    this.mapCorrelationIdToModelsToRestore.delete(e.correlationId);
                    modelsToRestore.forEach(model => {
                        var _a;
                        // snapshot presence means this model used to be dirty and so we restore that
                        // flag. we do NOT have to restore the content because the model was only soft
                        // reverted and did not loose its original dirty contents.
                        if (model.snapshot) {
                            (_a = this.get(model.source)) === null || _a === void 0 ? void 0 : _a.setDirty(true);
                        }
                    });
                }
            }
        }
        onDidRunWorkingCopyFileOperation(e) {
            // Move / Copy: restore models that were loaded before the operation took place
            if ((e.operation === 3 /* COPY */ || e.operation === 2 /* MOVE */)) {
                e.waitUntil((async () => {
                    const modelsToRestore = this.mapCorrelationIdToModelsToRestore.get(e.correlationId);
                    if (modelsToRestore) {
                        this.mapCorrelationIdToModelsToRestore.delete(e.correlationId);
                        await Promise.all(modelsToRestore.map(async (modelToRestore) => {
                            // restore the model, forcing a reload. this is important because
                            // we know the file has changed on disk after the move and the
                            // model might have still existed with the previous state. this
                            // ensures we are not tracking a stale state.
                            const restoredModel = await this.resolve(modelToRestore.target, { reload: { async: false }, encoding: modelToRestore.encoding });
                            // restore previous dirty content if any and ensure to mark the model as dirty
                            let textBufferFactory = undefined;
                            if (modelToRestore.snapshot) {
                                textBufferFactory = textModel_1.createTextBufferFactoryFromSnapshot(modelToRestore.snapshot);
                            }
                            // restore previous mode only if the mode is now unspecified
                            let preferredMode = undefined;
                            if (restoredModel.getMode() === modesRegistry_1.PLAINTEXT_MODE_ID && modelToRestore.mode !== modesRegistry_1.PLAINTEXT_MODE_ID) {
                                preferredMode = modelToRestore.mode;
                            }
                            if (textBufferFactory || preferredMode) {
                                restoredModel.updateTextEditorModel(textBufferFactory, preferredMode);
                            }
                        }));
                    }
                })());
            }
        }
        get(resource) {
            return this.mapResourceToModel.get(resource);
        }
        async resolve(resource, options) {
            // Return early if model is currently being loaded
            const pendingLoad = this.mapResourceToPendingModelLoaders.get(resource);
            if (pendingLoad) {
                return pendingLoad;
            }
            let modelPromise;
            let model = this.get(resource);
            let didCreateModel = false;
            // Model exists
            if (model) {
                if (options === null || options === void 0 ? void 0 : options.reload) {
                    // async reload: trigger a reload but return immediately
                    if (options.reload.async) {
                        modelPromise = Promise.resolve(model);
                        model.load(options);
                    }
                    // sync reload: do not return until model reloaded
                    else {
                        modelPromise = model.load(options);
                    }
                }
                else {
                    modelPromise = Promise.resolve(model);
                }
            }
            // Model does not exist
            else {
                didCreateModel = true;
                const newModel = model = this.instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resource, options ? options.encoding : undefined, options ? options.mode : undefined);
                modelPromise = model.load(options);
                this.registerModel(newModel);
            }
            // Store pending loads to avoid race conditions
            this.mapResourceToPendingModelLoaders.set(resource, modelPromise);
            // Make known to manager (if not already known)
            this.add(resource, model);
            // Emit some events if we created the model
            if (didCreateModel) {
                this._onDidCreate.fire(model);
                // If the model is dirty right from the beginning,
                // make sure to emit this as an event
                if (model.isDirty()) {
                    this._onDidChangeDirty.fire(model);
                }
            }
            try {
                const resolvedModel = await modelPromise;
                // Remove from pending loads
                this.mapResourceToPendingModelLoaders.delete(resource);
                // Apply mode if provided
                if (options === null || options === void 0 ? void 0 : options.mode) {
                    resolvedModel.setMode(options.mode);
                }
                // Model can be dirty if a backup was restored, so we make sure to
                // have this event delivered if we created the model here
                if (didCreateModel && resolvedModel.isDirty()) {
                    this._onDidChangeDirty.fire(resolvedModel);
                }
                return resolvedModel;
            }
            catch (error) {
                // Free resources of this invalid model
                if (model) {
                    model.dispose();
                }
                // Remove from pending loads
                this.mapResourceToPendingModelLoaders.delete(resource);
                throw error;
            }
        }
        registerModel(model) {
            // Install model listeners
            const modelListeners = new lifecycle_1.DisposableStore();
            modelListeners.add(model.onDidLoad(reason => this._onDidLoad.fire({ model, reason })));
            modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire(model)));
            modelListeners.add(model.onDidSaveError(() => this._onDidSaveError.fire(model)));
            modelListeners.add(model.onDidSave(reason => this._onDidSave.fire({ model: model, reason })));
            modelListeners.add(model.onDidRevert(() => this._onDidRevert.fire(model)));
            modelListeners.add(model.onDidChangeEncoding(() => this._onDidChangeEncoding.fire(model)));
            // Keep for disposal
            this.mapResourceToModelListeners.set(model.resource, modelListeners);
        }
        add(resource, model) {
            const knownModel = this.mapResourceToModel.get(resource);
            if (knownModel === model) {
                return; // already cached
            }
            // dispose any previously stored dispose listener for this resource
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                disposeListener.dispose();
            }
            // store in cache but remove when model gets disposed
            this.mapResourceToModel.set(resource, model);
            this.mapResourceToDisposeListener.set(resource, model.onDispose(() => this.remove(resource)));
        }
        remove(resource) {
            this.mapResourceToModel.delete(resource);
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                lifecycle_1.dispose(disposeListener);
                this.mapResourceToDisposeListener.delete(resource);
            }
            const modelListener = this.mapResourceToModelListeners.get(resource);
            if (modelListener) {
                lifecycle_1.dispose(modelListener);
                this.mapResourceToModelListeners.delete(resource);
            }
        }
        addSaveParticipant(participant) {
            return this.saveParticipants.addSaveParticipant(participant);
        }
        runSaveParticipants(model, context, token) {
            return this.saveParticipants.participate(model, context, token);
        }
        //#endregion
        clear() {
            // model caches
            this.mapResourceToModel.clear();
            this.mapResourceToPendingModelLoaders.clear();
            // dispose the dispose listeners
            this.mapResourceToDisposeListener.forEach(listener => listener.dispose());
            this.mapResourceToDisposeListener.clear();
            // dispose the model change listeners
            this.mapResourceToModelListeners.forEach(listener => listener.dispose());
            this.mapResourceToModelListeners.clear();
        }
        canDispose(model) {
            // quick return if model already disposed or not dirty and not loading
            if (model.isDisposed() ||
                (!this.mapResourceToPendingModelLoaders.has(model.resource) && !model.isDirty())) {
                return true;
            }
            // promise based return in all other cases
            return this.doCanDispose(model);
        }
        async doCanDispose(model) {
            // pending model load: wait for the load to finish before trying again
            const pendingModelLoad = this.mapResourceToPendingModelLoaders.get(model.resource);
            if (pendingModelLoad) {
                try {
                    await pendingModelLoad;
                }
                catch (error) {
                    // ignore any error
                }
                return this.canDispose(model);
            }
            // dirty model: we do not allow to dispose dirty models to prevent
            // data loss cases. dirty models can only be disposed when they are
            // either saved or reverted
            if (model.isDirty()) {
                await event_1.Event.toPromise(model.onDidChangeDirty);
                return this.canDispose(model);
            }
            return true;
        }
        dispose() {
            super.dispose();
            this.clear();
        }
    };
    TextFileEditorModelManager = __decorate([
        __param(0, lifecycle_2.ILifecycleService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, files_1.IFileService),
        __param(3, notification_1.INotificationService),
        __param(4, workingCopyFileService_1.IWorkingCopyFileService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], TextFileEditorModelManager);
    exports.TextFileEditorModelManager = TextFileEditorModelManager;
});
//# __sourceMappingURL=textFileEditorModelManager.js.map