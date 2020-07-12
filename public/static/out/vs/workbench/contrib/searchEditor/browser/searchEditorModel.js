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
define(["require", "exports", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/backup/common/backup", "vs/base/common/types"], function (require, exports, modelService_1, modeService_1, instantiation_1, searchEditorSerialization_1, backup_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchEditorModel = void 0;
    let SearchEditorModel = class SearchEditorModel {
        constructor(modelUri, config, existingData, instantiationService, backupService, modelService, modeService) {
            var _a;
            this.modelUri = modelUri;
            this.config = config;
            this.existingData = existingData;
            this.instantiationService = instantiationService;
            this.backupService = backupService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.cachedContentsModel = undefined;
            this.ongoingResolve = Promise.resolve(undefined);
            this.onModelResolved = new Promise(resolve => this.resolveContents = resolve);
            this.onModelResolved.then(model => this.cachedContentsModel = model);
            this.ongoingResolve = backupService.resolve((_a = existingData.backingUri) !== null && _a !== void 0 ? _a : modelUri)
                .then(backup => { var _a; return (_a = modelService.getModel(modelUri)) !== null && _a !== void 0 ? _a : (backup ? modelService.createModel(backup.value, modeService.create('search-result'), modelUri) : undefined); })
                .then(model => { if (model) {
                this.resolveContents(model);
            } });
        }
        async resolve() {
            await (this.ongoingResolve = this.ongoingResolve.then(() => this.cachedContentsModel || this.createModel()));
            return types_1.assertIsDefined(this.cachedContentsModel);
        }
        async createModel() {
            var _a;
            const getContents = async () => {
                if (this.existingData.text !== undefined) {
                    return this.existingData.text;
                }
                else if (this.existingData.backingUri !== undefined) {
                    return (await this.instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, this.existingData.backingUri)).text;
                }
                else {
                    return '';
                }
            };
            const contents = await getContents();
            const model = (_a = this.modelService.getModel(this.modelUri)) !== null && _a !== void 0 ? _a : this.modelService.createModel(contents, this.modeService.create('search-result'), this.modelUri);
            this.resolveContents(model);
            return model;
        }
    };
    SearchEditorModel = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, backup_1.IBackupFileService),
        __param(5, modelService_1.IModelService),
        __param(6, modeService_1.IModeService)
    ], SearchEditorModel);
    exports.SearchEditorModel = SearchEditorModel;
});
//# __sourceMappingURL=searchEditorModel.js.map