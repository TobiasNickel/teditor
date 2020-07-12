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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, event_1, lifecycle_1, resources_1, resolverService_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTextEditorModel = void 0;
    let CustomTextEditorModel = class CustomTextEditorModel extends lifecycle_1.Disposable {
        constructor(viewType, _resource, _model, textFileService) {
            super();
            this.viewType = viewType;
            this._resource = _resource;
            this._model = _model;
            this.textFileService = textFileService;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._register(_model);
            this._register(this.textFileService.files.onDidChangeDirty(e => {
                if (resources_1.isEqual(this.resource, e.resource)) {
                    this._onDidChangeDirty.fire();
                    this._onDidChangeContent.fire();
                }
            }));
        }
        static async create(instantiationService, viewType, resource) {
            return instantiationService.invokeFunction(async (accessor) => {
                const textModelResolverService = accessor.get(resolverService_1.ITextModelService);
                const textFileService = accessor.get(textfiles_1.ITextFileService);
                const model = await textModelResolverService.createModelReference(resource);
                return new CustomTextEditorModel(viewType, resource, model, textFileService);
            });
        }
        get resource() {
            return this._resource;
        }
        isReadonly() {
            return this._model.object.isReadonly();
        }
        get backupId() {
            return undefined;
        }
        isDirty() {
            return this.textFileService.isDirty(this.resource);
        }
        async revert(options) {
            return this.textFileService.revert(this.resource, options);
        }
        saveCustomEditor(options) {
            return this.textFileService.save(this.resource, options);
        }
        async saveCustomEditorAs(resource, targetResource, options) {
            return !!await this.textFileService.saveAs(resource, targetResource, options);
        }
    };
    CustomTextEditorModel = __decorate([
        __param(3, textfiles_1.ITextFileService)
    ], CustomTextEditorModel);
    exports.CustomTextEditorModel = CustomTextEditorModel;
});
//# __sourceMappingURL=customTextEditorModel.js.map