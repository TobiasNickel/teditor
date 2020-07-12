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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/resourceEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/editor/textResourceEditorInput", "vs/base/common/resources"], function (require, exports, resolverService_1, resourceEditorModel_1, textfiles_1, editorService_1, editorGroupsService_1, files_1, label_1, filesConfigurationService_1, textResourceEditorInput_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceEditorInput = void 0;
    /**
     * A read-only text editor input whos contents are made of the provided resource that points to an existing
     * code editor model.
     */
    let ResourceEditorInput = class ResourceEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        constructor(resource, name, description, preferredMode, textModelResolverService, textFileService, editorService, editorGroupService, fileService, labelService, filesConfigurationService) {
            super(resource, undefined, editorService, editorGroupService, textFileService, labelService, fileService, filesConfigurationService);
            this.name = name;
            this.description = description;
            this.preferredMode = preferredMode;
            this.textModelResolverService = textModelResolverService;
            this.cachedModel = undefined;
            this.modelReference = undefined;
        }
        getTypeId() {
            return ResourceEditorInput.ID;
        }
        getName() {
            return this.name || super.getName();
        }
        setName(name) {
            if (this.name !== name) {
                this.name = name;
                this._onDidChangeLabel.fire();
            }
        }
        getDescription() {
            return this.description;
        }
        setDescription(description) {
            if (this.description !== description) {
                this.description = description;
                this._onDidChangeLabel.fire();
            }
        }
        setMode(mode) {
            this.setPreferredMode(mode);
            if (this.cachedModel) {
                this.cachedModel.setMode(mode);
            }
        }
        setPreferredMode(mode) {
            this.preferredMode = mode;
        }
        async resolve() {
            if (!this.modelReference) {
                this.modelReference = this.textModelResolverService.createModelReference(this.resource);
            }
            const ref = await this.modelReference;
            // Ensure the resolved model is of expected type
            const model = ref.object;
            if (!(model instanceof resourceEditorModel_1.ResourceEditorModel)) {
                ref.dispose();
                this.modelReference = undefined;
                throw new Error(`Unexpected model for ResourcEditorInput: ${this.resource}`);
            }
            this.cachedModel = model;
            // Set mode if we have a preferred mode configured
            if (this.preferredMode) {
                model.setMode(this.preferredMode);
            }
            return model;
        }
        matches(otherInput) {
            if (otherInput === this) {
                return true;
            }
            if (otherInput instanceof ResourceEditorInput) {
                return resources_1.extUri.isEqual(otherInput.resource, this.resource);
            }
            return false;
        }
        dispose() {
            if (this.modelReference) {
                this.modelReference.then(ref => ref.dispose());
                this.modelReference = undefined;
            }
            this.cachedModel = undefined;
            super.dispose();
        }
    };
    ResourceEditorInput.ID = 'workbench.editors.resourceEditorInput';
    ResourceEditorInput = __decorate([
        __param(4, resolverService_1.ITextModelService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, files_1.IFileService),
        __param(9, label_1.ILabelService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService)
    ], ResourceEditorInput);
    exports.ResourceEditorInput = ResourceEditorInput;
});
//# __sourceMappingURL=resourceEditorInput.js.map