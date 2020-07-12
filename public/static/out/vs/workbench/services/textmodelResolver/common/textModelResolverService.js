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
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/modelService", "vs/workbench/common/editor/resourceEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/editor/common/services/resolverService", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/services/modelUndoRedoParticipant", "vs/workbench/services/uriIdentity/common/uriIdentity"], function (require, exports, uri_1, instantiation_1, lifecycle_1, modelService_1, resourceEditorModel_1, textfiles_1, network, resolverService_1, textFileEditorModel_1, files_1, extensions_1, undoRedo_1, modelUndoRedoParticipant_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelResolverService = void 0;
    let ResourceModelCollection = class ResourceModelCollection extends lifecycle_1.ReferenceCollection {
        constructor(instantiationService, textFileService, fileService, modelService) {
            super();
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.modelService = modelService;
            this.providers = new Map();
            this.modelsToDispose = new Set();
        }
        async createReferencedObject(key, skipActivateProvider) {
            // Untrack as being disposed
            this.modelsToDispose.delete(key);
            // inMemory Schema: go through model service cache
            const resource = uri_1.URI.parse(key);
            if (resource.scheme === network.Schemas.inMemory) {
                const cachedModel = this.modelService.getModel(resource);
                if (!cachedModel) {
                    throw new Error(`Unable to resolve inMemory resource ${key}`);
                }
                return this.instantiationService.createInstance(resourceEditorModel_1.ResourceEditorModel, resource);
            }
            // Untitled Schema: go through untitled text service
            if (resource.scheme === network.Schemas.untitled) {
                return this.textFileService.untitled.resolve({ untitledResource: resource });
            }
            // File or remote file: go through text file service
            if (this.fileService.canHandleResource(resource)) {
                return this.textFileService.files.resolve(resource, { reason: 2 /* REFERENCE */ });
            }
            // Virtual documents
            if (this.providers.has(resource.scheme)) {
                await this.resolveTextModelContent(key);
                return this.instantiationService.createInstance(resourceEditorModel_1.ResourceEditorModel, resource);
            }
            // Either unknown schema, or not yet registered, try to activate
            if (!skipActivateProvider) {
                await this.fileService.activateProvider(resource.scheme);
                return this.createReferencedObject(key, true);
            }
            throw new Error(`Unable to resolve resource ${key}`);
        }
        destroyReferencedObject(key, modelPromise) {
            // untitled and inMemory are bound to a different lifecycle
            const resource = uri_1.URI.parse(key);
            if (resource.scheme === network.Schemas.untitled || resource.scheme === network.Schemas.inMemory) {
                return;
            }
            // Track as being disposed before waiting for model to load
            // to handle the case that the reference is aquired again
            this.modelsToDispose.add(key);
            (async () => {
                try {
                    const model = await modelPromise;
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been aquired again meanwhile
                        return;
                    }
                    if (model instanceof textFileEditorModel_1.TextFileEditorModel) {
                        // text file models have conditions that prevent them
                        // from dispose, so we have to wait until we can dispose
                        await this.textFileService.files.canDispose(model);
                    }
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been aquired again meanwhile
                        return;
                    }
                    // Finally we can dispose the model
                    model.dispose();
                }
                catch (error) {
                    // ignore
                }
                finally {
                    this.modelsToDispose.delete(key); // Untrack as being disposed
                }
            })();
        }
        registerTextModelContentProvider(scheme, provider) {
            let providers = this.providers.get(scheme);
            if (!providers) {
                providers = [];
                this.providers.set(scheme, providers);
            }
            providers.unshift(provider);
            return lifecycle_1.toDisposable(() => {
                const providersForScheme = this.providers.get(scheme);
                if (!providersForScheme) {
                    return;
                }
                const index = providersForScheme.indexOf(provider);
                if (index === -1) {
                    return;
                }
                providersForScheme.splice(index, 1);
                if (providersForScheme.length === 0) {
                    this.providers.delete(scheme);
                }
            });
        }
        hasTextModelContentProvider(scheme) {
            return this.providers.get(scheme) !== undefined;
        }
        async resolveTextModelContent(key) {
            const resource = uri_1.URI.parse(key);
            const providersForScheme = this.providers.get(resource.scheme) || [];
            for (const provider of providersForScheme) {
                const value = await provider.provideTextContent(resource);
                if (value) {
                    return value;
                }
            }
            throw new Error(`Unable to resolve text model content for resource ${key}`);
        }
    };
    ResourceModelCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, files_1.IFileService),
        __param(3, modelService_1.IModelService)
    ], ResourceModelCollection);
    let TextModelResolverService = class TextModelResolverService extends lifecycle_1.Disposable {
        constructor(instantiationService, fileService, undoRedoService, modelService, uriIdentityService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.undoRedoService = undoRedoService;
            this.modelService = modelService;
            this.uriIdentityService = uriIdentityService;
            this.resourceModelCollection = this.instantiationService.createInstance(ResourceModelCollection);
            this._register(new modelUndoRedoParticipant_1.ModelUndoRedoParticipant(this.modelService, this, this.undoRedoService));
        }
        async createModelReference(resource) {
            // From this moment on, only operate on the canonical resource
            // to ensure we reduce the chance of resolving the same resource
            // with different resource forms (e.g. path casing on Windows)
            resource = this.uriIdentityService.asCanonicalUri(resource);
            const ref = this.resourceModelCollection.acquire(resource.toString());
            try {
                const model = await ref.object;
                return {
                    object: model,
                    dispose: () => ref.dispose()
                };
            }
            catch (error) {
                ref.dispose();
                throw error;
            }
        }
        registerTextModelContentProvider(scheme, provider) {
            return this.resourceModelCollection.registerTextModelContentProvider(scheme, provider);
        }
        canHandleResource(resource) {
            if (this.fileService.canHandleResource(resource) || resource.scheme === network.Schemas.untitled || resource.scheme === network.Schemas.inMemory) {
                return true; // we handle file://, untitled:// and inMemory:// automatically
            }
            return this.resourceModelCollection.hasTextModelContentProvider(resource.scheme);
        }
    };
    TextModelResolverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, files_1.IFileService),
        __param(2, undoRedo_1.IUndoRedoService),
        __param(3, modelService_1.IModelService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TextModelResolverService);
    exports.TextModelResolverService = TextModelResolverService;
    extensions_1.registerSingleton(resolverService_1.ITextModelService, TextModelResolverService, true);
});
//# __sourceMappingURL=textModelResolverService.js.map