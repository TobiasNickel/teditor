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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService"], function (require, exports, textEditorModel_1, modeService_1, modelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceEditorModel = void 0;
    /**
     * An editor model for in-memory, readonly content that is backed by an existing editor model.
     */
    let ResourceEditorModel = class ResourceEditorModel extends textEditorModel_1.BaseTextEditorModel {
        constructor(resource, modeService, modelService) {
            super(modelService, modeService, resource);
        }
        dispose() {
            // TODO@Joao: force this class to dispose the underlying model
            if (this.textEditorModelHandle) {
                this.modelService.destroyModel(this.textEditorModelHandle);
            }
            super.dispose();
        }
    };
    ResourceEditorModel = __decorate([
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], ResourceEditorModel);
    exports.ResourceEditorModel = ResourceEditorModel;
});
//# __sourceMappingURL=resourceEditorModel.js.map