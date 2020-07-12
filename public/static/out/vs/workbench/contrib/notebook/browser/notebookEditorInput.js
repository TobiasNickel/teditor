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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService"], function (require, exports, editor_1, notebookService_1, resources_1, instantiation_1, filesConfigurationService_1, dialogs_1, notebookEditorModelResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorInput = void 0;
    let NotebookEditorInput = class NotebookEditorInput extends editor_1.EditorInput {
        constructor(resource, name, viewType, options, _notebookService, _notebookModelResolverService, _filesConfigurationService, _fileDialogService, _instantiationService) {
            super();
            this.resource = resource;
            this.name = name;
            this.viewType = viewType;
            this.options = options;
            this._notebookService = _notebookService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._filesConfigurationService = _filesConfigurationService;
            this._fileDialogService = _fileDialogService;
            this._instantiationService = _instantiationService;
            this._textModel = null;
            this._defaultDirtyState = false;
            this._defaultDirtyState = !!options.startDirty;
        }
        static create(instantiationService, resource, name, viewType, options = {}) {
            return instantiationService.createInstance(NotebookEditorInput, resource, name, viewType, options);
        }
        getTypeId() {
            return NotebookEditorInput.ID;
        }
        getName() {
            return this.name;
        }
        isDirty() {
            if (!this._textModel) {
                return !!this._defaultDirtyState;
            }
            return this._textModel.object.isDirty();
        }
        isUntitled() {
            var _a;
            return ((_a = this._textModel) === null || _a === void 0 ? void 0 : _a.object.isUntitled()) || false;
        }
        isReadonly() {
            return false;
        }
        isSaving() {
            if (this.isUntitled()) {
                return false; // untitled is never saving automatically
            }
            if (!this.isDirty()) {
                return false; // the editor needs to be dirty for being saved
            }
            if (this._filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return true; // a short auto save is configured, treat this as being saved
            }
            return false;
        }
        async save(group, options) {
            if (this._textModel) {
                await this._textModel.object.save();
                return this;
            }
            return undefined;
        }
        async saveAs(group, options) {
            var _a;
            if (!this._textModel) {
                return undefined;
            }
            const dialogPath = this._textModel.object.resource;
            const target = await this._fileDialogService.pickFileToSave(dialogPath, options === null || options === void 0 ? void 0 : options.availableFileSystems);
            if (!target) {
                return undefined; // save cancelled
            }
            if (!await this._textModel.object.saveAs(target)) {
                return undefined;
            }
            return (_a = this._move(group, target)) === null || _a === void 0 ? void 0 : _a.editor;
        }
        // called when users rename a notebook document
        rename(group, target) {
            if (this._textModel) {
                const contributedNotebookProviders = this._notebookService.getContributedNotebookProviders(target);
                if (contributedNotebookProviders.find(provider => provider.id === this._textModel.object.viewType)) {
                    return this._move(group, target);
                }
            }
            return undefined;
        }
        _move(group, newResource) {
            const editorInput = NotebookEditorInput.create(this._instantiationService, newResource, resources_1.basename(newResource), this.viewType);
            return { editor: editorInput };
        }
        async revert(group, options) {
            if (this._textModel) {
                await this._textModel.object.revert(options);
            }
            return;
        }
        async resolve(editorId) {
            if (!await this._notebookService.canResolve(this.viewType)) {
                return null;
            }
            if (!this._textModel) {
                this._textModel = await this._notebookModelResolverService.resolve(this.resource, this.viewType, editorId);
                this._register(this._textModel.object.onDidChangeDirty(() => {
                    this._onDidChangeDirty.fire();
                }));
                if (this._textModel.object.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
            }
            return this._textModel.object;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof NotebookEditorInput) {
                return this.viewType === otherInput.viewType
                    && resources_1.isEqual(this.resource, otherInput.resource);
            }
            return false;
        }
        dispose() {
            if (this._textModel) {
                this._textModel.dispose();
                this._textModel = null;
            }
            super.dispose();
        }
    };
    NotebookEditorInput.ID = 'workbench.input.notebook';
    NotebookEditorInput = __decorate([
        __param(4, notebookService_1.INotebookService),
        __param(5, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(6, filesConfigurationService_1.IFilesConfigurationService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, instantiation_1.IInstantiationService)
    ], NotebookEditorInput);
    exports.NotebookEditorInput = NotebookEditorInput;
});
//# __sourceMappingURL=notebookEditorInput.js.map