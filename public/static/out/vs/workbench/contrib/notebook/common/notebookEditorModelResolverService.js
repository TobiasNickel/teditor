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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/log/common/log"], function (require, exports, instantiation_1, uri_1, notebookEditorModel_1, lifecycle_1, notebookService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookModelResolverService = exports.NotebookModelReferenceCollection = exports.INotebookEditorModelResolverService = void 0;
    exports.INotebookEditorModelResolverService = instantiation_1.createDecorator('INotebookModelResolverService');
    let NotebookModelReferenceCollection = class NotebookModelReferenceCollection extends lifecycle_1.ReferenceCollection {
        constructor(_instantiationService, _notebookService, _logService) {
            super();
            this._instantiationService = _instantiationService;
            this._notebookService = _notebookService;
            this._logService = _logService;
        }
        createReferencedObject(key, ...args) {
            const [viewType, editorId] = args;
            const resource = uri_1.URI.parse(key);
            const model = this._instantiationService.createInstance(notebookEditorModel_1.NotebookEditorModel, resource, viewType);
            const promise = model.load({ editorId });
            return promise;
        }
        destroyReferencedObject(_key, object) {
            object.then(model => {
                this._notebookService.destoryNotebookDocument(model.viewType, model.notebook);
                model.dispose();
            }).catch(err => {
                this._logService.critical('FAILED to destory notebook', err);
            });
        }
    };
    NotebookModelReferenceCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookService_1.INotebookService),
        __param(2, log_1.ILogService)
    ], NotebookModelReferenceCollection);
    exports.NotebookModelReferenceCollection = NotebookModelReferenceCollection;
    let NotebookModelResolverService = class NotebookModelResolverService {
        constructor(instantiationService) {
            this._data = instantiationService.createInstance(NotebookModelReferenceCollection);
        }
        async resolve(resource, viewType, editorId) {
            const reference = this._data.acquire(resource.toString(), viewType, editorId);
            const model = await reference.object;
            return {
                object: model,
                dispose() { reference.dispose(); }
            };
        }
    };
    NotebookModelResolverService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], NotebookModelResolverService);
    exports.NotebookModelResolverService = NotebookModelResolverService;
});
//# __sourceMappingURL=notebookEditorModelResolverService.js.map