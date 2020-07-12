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
define(["require", "exports", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/textfile/common/textfiles", "vs/platform/label/common/label", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/files/common/files", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/resources"], function (require, exports, textResourceEditorInput_1, textfiles_1, label_1, editorService_1, editorGroupsService_1, files_1, filesConfigurationService_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorInput = void 0;
    /**
     * An editor input to be used for untitled text buffers.
     */
    let UntitledTextEditorInput = class UntitledTextEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        constructor(model, textFileService, labelService, editorService, editorGroupService, fileService, filesConfigurationService) {
            super(model.resource, undefined, editorService, editorGroupService, textFileService, labelService, fileService, filesConfigurationService);
            this.model = model;
            this.modelResolve = undefined;
            this.registerModelListeners(model);
        }
        registerModelListeners(model) {
            // re-emit some events from the model
            this._register(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(model.onDidChangeName(() => this._onDidChangeLabel.fire()));
            // a reverted untitled text editor model renders this input disposed
            this._register(model.onDidRevert(() => this.dispose()));
        }
        getTypeId() {
            return UntitledTextEditorInput.ID;
        }
        getName() {
            return this.model.name;
        }
        getDescription(verbosity = 1 /* MEDIUM */) {
            // Without associated path: only use if name and description differ
            if (!this.model.hasAssociatedFilePath) {
                const descriptionCandidate = this.resource.path;
                if (descriptionCandidate !== this.getName()) {
                    return descriptionCandidate;
                }
                return undefined;
            }
            // With associated path: delegate to parent
            return super.getDescription(verbosity);
        }
        getTitle(verbosity) {
            // Without associated path: check if name and description differ to decide
            // if description should appear besides the name to distinguish better
            if (!this.model.hasAssociatedFilePath) {
                const name = this.getName();
                const description = this.getDescription();
                if (description && description !== name) {
                    return `${name} • ${description}`;
                }
                return name;
            }
            // With associated path: delegate to parent
            return super.getTitle(verbosity);
        }
        isDirty() {
            return this.model.isDirty();
        }
        getEncoding() {
            return this.model.getEncoding();
        }
        setEncoding(encoding, mode /* ignored, we only have Encode */) {
            this.model.setEncoding(encoding);
        }
        setMode(mode) {
            this.model.setMode(mode);
        }
        getMode() {
            return this.model.getMode();
        }
        resolve() {
            // Join a model resolve if we have had one before
            if (this.modelResolve) {
                return this.modelResolve;
            }
            this.modelResolve = this.model.load();
            return this.modelResolve;
        }
        matches(otherInput) {
            if (otherInput === this) {
                return true;
            }
            if (otherInput instanceof UntitledTextEditorInput) {
                return resources_1.extUri.isEqual(otherInput.resource, this.resource);
            }
            return false;
        }
        dispose() {
            this.modelResolve = undefined;
            super.dispose();
        }
    };
    UntitledTextEditorInput.ID = 'workbench.editors.untitledEditorInput';
    UntitledTextEditorInput = __decorate([
        __param(1, textfiles_1.ITextFileService),
        __param(2, label_1.ILabelService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, files_1.IFileService),
        __param(6, filesConfigurationService_1.IFilesConfigurationService)
    ], UntitledTextEditorInput);
    exports.UntitledTextEditorInput = UntitledTextEditorInput;
});
//# __sourceMappingURL=untitledTextEditorInput.js.map