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
define(["require", "exports", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/services/modelServiceImpl"], function (require, exports, modelService_1, resolverService_1, lifecycle_1, undoRedo_1, modelServiceImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelUndoRedoParticipant = void 0;
    let ModelUndoRedoParticipant = class ModelUndoRedoParticipant extends lifecycle_1.Disposable {
        constructor(_modelService, _textModelService, _undoRedoService) {
            super();
            this._modelService = _modelService;
            this._textModelService = _textModelService;
            this._undoRedoService = _undoRedoService;
            this._register(this._modelService.onModelRemoved((model) => {
                // a model will get disposed, so let's check if the undo redo stack is maintained
                const elements = this._undoRedoService.getElements(model.uri);
                if (elements.past.length === 0 && elements.future.length === 0) {
                    return;
                }
                if (!modelServiceImpl_1.isEditStackPastFutureElements(elements)) {
                    return;
                }
                for (const element of elements.past) {
                    if (element.type === 1 /* Workspace */) {
                        element.setDelegate(this);
                    }
                }
                for (const element of elements.future) {
                    if (element.type === 1 /* Workspace */) {
                        element.setDelegate(this);
                    }
                }
            }));
        }
        prepareUndoRedo(element) {
            // Load all the needed text models
            const missingModels = element.getMissingModels();
            if (missingModels.length === 0) {
                // All models are available!
                return lifecycle_1.Disposable.None;
            }
            const disposablesPromises = missingModels.map(async (uri) => {
                try {
                    const reference = await this._textModelService.createModelReference(uri);
                    return reference;
                }
                catch (err) {
                    // This model could not be loaded, maybe it was deleted in the meantime?
                    return lifecycle_1.Disposable.None;
                }
            });
            return Promise.all(disposablesPromises).then(disposables => {
                return {
                    dispose: () => lifecycle_1.dispose(disposables)
                };
            });
        }
    };
    ModelUndoRedoParticipant = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, undoRedo_1.IUndoRedoService)
    ], ModelUndoRedoParticipant);
    exports.ModelUndoRedoParticipant = ModelUndoRedoParticipant;
});
//# __sourceMappingURL=modelUndoRedoParticipant.js.map