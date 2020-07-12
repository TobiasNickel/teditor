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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/lazy", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/types", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, decorators_1, lazy_1, network_1, path_1, resources_1, types_1, dialogs_1, instantiation_1, label_1, undoRedo_1, customEditor_1, webview_1, webviewWorkbenchService_1, editorService_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInput = void 0;
    let CustomEditorInput = class CustomEditorInput extends webviewWorkbenchService_1.LazilyResolvedWebviewEditorInput {
        constructor(resource, viewType, id, webview, options, webviewService, webviewWorkbenchService, instantiationService, labelService, customEditorService, fileDialogService, filesConfigurationService, editorService, undoRedoService) {
            super(id, viewType, '', webview, webviewService, webviewWorkbenchService);
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.customEditorService = customEditorService;
            this.fileDialogService = fileDialogService;
            this.filesConfigurationService = filesConfigurationService;
            this.editorService = editorService;
            this.undoRedoService = undoRedoService;
            this._editorResource = resource;
            this._defaultDirtyState = options.startsDirty;
            this._backupId = options.backupId;
        }
        get resource() { return this._editorResource; }
        getTypeId() {
            return CustomEditorInput.typeId;
        }
        supportsSplitEditor() {
            return true;
        }
        getName() {
            return path_1.basename(this.labelService.getUriLabel(this.resource));
        }
        matches(other) {
            return this === other || (other instanceof CustomEditorInput
                && this.viewType === other.viewType
                && resources_1.isEqual(this.resource, other.resource));
        }
        get shortTitle() {
            return this.getName();
        }
        get mediumTitle() {
            return this.labelService.getUriLabel(this.resource, { relative: true });
        }
        get longTitle() {
            return this.labelService.getUriLabel(this.resource);
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* SHORT */:
                    return this.shortTitle;
                default:
                case 1 /* MEDIUM */:
                    return this.mediumTitle;
                case 2 /* LONG */:
                    return this.longTitle;
            }
        }
        isReadonly() {
            return this._modelRef ? this._modelRef.object.isReadonly() : false;
        }
        isUntitled() {
            return this.resource.scheme === network_1.Schemas.untitled;
        }
        isDirty() {
            if (!this._modelRef) {
                return !!this._defaultDirtyState;
            }
            return this._modelRef.object.isDirty();
        }
        isSaving() {
            if (this.isUntitled()) {
                return false; // untitled is never saving automatically
            }
            if (!this.isDirty()) {
                return false; // the editor needs to be dirty for being saved
            }
            if (this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return true; // a short auto save is configured, treat this as being saved
            }
            return false;
        }
        async save(groupId, options) {
            if (!this._modelRef) {
                return undefined;
            }
            const target = await this._modelRef.object.saveCustomEditor(options);
            if (!target) {
                return undefined; // save cancelled
            }
            if (!resources_1.isEqual(target, this.resource)) {
                return this.customEditorService.createInput(target, this.viewType, groupId);
            }
            return this;
        }
        async saveAs(groupId, options) {
            var _a;
            if (!this._modelRef) {
                return undefined;
            }
            const dialogPath = this._editorResource;
            const target = await this.fileDialogService.pickFileToSave(dialogPath, options === null || options === void 0 ? void 0 : options.availableFileSystems);
            if (!target) {
                return undefined; // save cancelled
            }
            if (!await this._modelRef.object.saveCustomEditorAs(this._editorResource, target, options)) {
                return undefined;
            }
            return (_a = this.rename(groupId, target)) === null || _a === void 0 ? void 0 : _a.editor;
        }
        async revert(group, options) {
            if (this._modelRef) {
                return this._modelRef.object.revert(options);
            }
            this._defaultDirtyState = false;
            this._onDidChangeDirty.fire();
        }
        async resolve() {
            await super.resolve();
            if (this.isDisposed()) {
                return null;
            }
            if (!this._modelRef) {
                this._modelRef = this._register(types_1.assertIsDefined(await this.customEditorService.models.tryRetain(this.resource, this.viewType)));
                this._register(this._modelRef.object.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                if (this.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
            }
            return null;
        }
        rename(group, newResource) {
            // See if we can keep using the same custom editor provider
            const editorInfo = this.customEditorService.getCustomEditor(this.viewType);
            if (editorInfo === null || editorInfo === void 0 ? void 0 : editorInfo.matches(newResource)) {
                return { editor: this.doMove(group, newResource) };
            }
            return { editor: this.editorService.createEditorInput({ resource: newResource, forceFile: true }) };
        }
        doMove(group, newResource) {
            if (!this._moveHandler) {
                return this.customEditorService.createInput(newResource, this.viewType, group);
            }
            this._moveHandler(newResource);
            const newEditor = this.instantiationService.createInstance(CustomEditorInput, newResource, this.viewType, this.id, new lazy_1.Lazy(() => undefined), { startsDirty: this._defaultDirtyState, backupId: this._backupId }); // this webview is replaced in the transfer call
            this.transfer(newEditor);
            newEditor.updateGroup(group);
            return newEditor;
        }
        undo() {
            types_1.assertIsDefined(this._modelRef);
            this.undoRedoService.undo(this.resource);
        }
        redo() {
            types_1.assertIsDefined(this._modelRef);
            this.undoRedoService.redo(this.resource);
        }
        onMove(handler) {
            // TODO: Move this to the service
            this._moveHandler = handler;
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            other._moveHandler = this._moveHandler;
            this._moveHandler = undefined;
            return other;
        }
        get backupId() {
            if (this._modelRef) {
                return this._modelRef.object.backupId;
            }
            return this._backupId;
        }
    };
    CustomEditorInput.typeId = 'workbench.editors.webviewEditor';
    __decorate([
        decorators_1.memoize
    ], CustomEditorInput.prototype, "getName", null);
    __decorate([
        decorators_1.memoize
    ], CustomEditorInput.prototype, "shortTitle", null);
    __decorate([
        decorators_1.memoize
    ], CustomEditorInput.prototype, "mediumTitle", null);
    __decorate([
        decorators_1.memoize
    ], CustomEditorInput.prototype, "longTitle", null);
    CustomEditorInput = __decorate([
        __param(5, webview_1.IWebviewService),
        __param(6, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, label_1.ILabelService),
        __param(9, customEditor_1.ICustomEditorService),
        __param(10, dialogs_1.IFileDialogService),
        __param(11, filesConfigurationService_1.IFilesConfigurationService),
        __param(12, editorService_1.IEditorService),
        __param(13, undoRedo_1.IUndoRedoService)
    ], CustomEditorInput);
    exports.CustomEditorInput = CustomEditorInput;
});
//# __sourceMappingURL=customEditorInput.js.map