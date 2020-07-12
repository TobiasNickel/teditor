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
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/untitled/common/untitledTextEditorModel", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/map", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions"], function (require, exports, uri_1, instantiation_1, untitledTextEditorModel_1, configuration_1, event_1, map_1, network_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorService = exports.IUntitledTextEditorService = void 0;
    exports.IUntitledTextEditorService = instantiation_1.createDecorator('untitledTextEditorService');
    let UntitledTextEditorService = class UntitledTextEditorService extends lifecycle_1.Disposable {
        constructor(instantiationService, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this.mapResourceToModel = new map_1.ResourceMap();
        }
        get(resource) {
            return this.mapResourceToModel.get(resource);
        }
        resolve(options) {
            return this.doCreateOrGet(options).load();
        }
        create(options) {
            return this.doCreateOrGet(options);
        }
        doCreateOrGet(options = Object.create(null)) {
            const massagedOptions = this.massageOptions(options);
            // Return existing instance if asked for it
            if (massagedOptions.untitledResource && this.mapResourceToModel.has(massagedOptions.untitledResource)) {
                return this.mapResourceToModel.get(massagedOptions.untitledResource);
            }
            // Create new instance otherwise
            return this.doCreate(massagedOptions);
        }
        massageOptions(options) {
            var _a, _b;
            const massagedOptions = Object.create(null);
            // Figure out associated and untitled resource
            if (options.associatedResource) {
                massagedOptions.untitledResource = uri_1.URI.from({
                    scheme: network_1.Schemas.untitled,
                    authority: options.associatedResource.authority,
                    fragment: options.associatedResource.fragment,
                    path: options.associatedResource.path,
                    query: options.associatedResource.query
                });
                massagedOptions.associatedResource = options.associatedResource;
            }
            else {
                if (((_a = options.untitledResource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.untitled) {
                    massagedOptions.untitledResource = options.untitledResource;
                }
            }
            // Language mode
            if (options.mode) {
                massagedOptions.mode = options.mode;
            }
            else if (!massagedOptions.associatedResource) {
                const configuration = this.configurationService.getValue();
                if ((_b = configuration.files) === null || _b === void 0 ? void 0 : _b.defaultLanguage) {
                    massagedOptions.mode = configuration.files.defaultLanguage;
                }
            }
            // Take over encoding and initial value
            massagedOptions.encoding = options.encoding;
            massagedOptions.initialValue = options.initialValue;
            return massagedOptions;
        }
        doCreate(options) {
            // Create a new untitled resource if none is provided
            let untitledResource = options.untitledResource;
            if (!untitledResource) {
                let counter = 1;
                do {
                    untitledResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `Untitled-${counter}` });
                    counter++;
                } while (this.mapResourceToModel.has(untitledResource));
            }
            // Create new model with provided options
            const model = this._register(this.instantiationService.createInstance(untitledTextEditorModel_1.UntitledTextEditorModel, untitledResource, !!options.associatedResource, options.initialValue, options.mode, options.encoding));
            this.registerModel(model);
            return model;
        }
        registerModel(model) {
            // Install model listeners
            const modelListeners = new lifecycle_1.DisposableStore();
            modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire(model)));
            modelListeners.add(model.onDidChangeName(() => this._onDidChangeLabel.fire(model)));
            modelListeners.add(model.onDidChangeEncoding(() => this._onDidChangeEncoding.fire(model)));
            modelListeners.add(model.onDispose(() => this._onDidDispose.fire(model)));
            // Remove from cache on dispose
            event_1.Event.once(model.onDispose)(() => {
                // Registry
                this.mapResourceToModel.delete(model.resource);
                // Listeners
                modelListeners.dispose();
            });
            // Add to cache
            this.mapResourceToModel.set(model.resource, model);
            // If the model is dirty right from the beginning,
            // make sure to emit this as an event
            if (model.isDirty()) {
                this._onDidChangeDirty.fire(model);
            }
        }
    };
    UntitledTextEditorService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService)
    ], UntitledTextEditorService);
    exports.UntitledTextEditorService = UntitledTextEditorService;
    extensions_1.registerSingleton(exports.IUntitledTextEditorService, UntitledTextEditorService, true);
});
//# __sourceMappingURL=untitledTextEditorService.js.map