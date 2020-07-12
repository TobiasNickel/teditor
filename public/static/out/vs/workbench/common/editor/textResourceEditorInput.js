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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/resources"], function (require, exports, editor_1, textfiles_1, editorService_1, editorGroupsService_1, files_1, label_1, filesConfigurationService_1, decorators_1, network_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTextResourceEditorInput = void 0;
    /**
     * The base class for all editor inputs that open in text editors.
     */
    let AbstractTextResourceEditorInput = class AbstractTextResourceEditorInput extends editor_1.EditorInput {
        constructor(resource, preferredLabel, editorService, editorGroupService, textFileService, labelService, fileService, filesConfigurationService) {
            super();
            this.resource = resource;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.textFileService = textFileService;
            this.labelService = labelService;
            this.fileService = fileService;
            this.filesConfigurationService = filesConfigurationService;
            this._label = preferredLabel || resource;
            this.registerListeners();
        }
        get label() { return this._label; }
        registerListeners() {
            // Clear label memoizer on certain events that have impact
            this._register(this.labelService.onDidChangeFormatters(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onLabelEvent(e.scheme)));
        }
        onLabelEvent(scheme) {
            if (scheme === this._label.scheme) {
                this.updateLabel();
            }
        }
        updateLabel() {
            // Clear any cached labels from before
            AbstractTextResourceEditorInput.MEMOIZER.clear();
            // Trigger recompute of label
            this._onDidChangeLabel.fire();
        }
        setLabel(label) {
            if (!resources_1.extUri.isEqual(label, this._label)) {
                this._label = label;
                this.updateLabel();
            }
        }
        getLabel() {
            return this._label;
        }
        getName() {
            return this.basename;
        }
        get basename() {
            return this.labelService.getUriBasenameLabel(this._label);
        }
        getDescription(verbosity = 1 /* MEDIUM */) {
            switch (verbosity) {
                case 0 /* SHORT */:
                    return this.shortDescription;
                case 2 /* LONG */:
                    return this.longDescription;
                case 1 /* MEDIUM */:
                default:
                    return this.mediumDescription;
            }
        }
        get shortDescription() {
            return this.labelService.getUriBasenameLabel(resources_1.dirname(this._label));
        }
        get mediumDescription() {
            return this.labelService.getUriLabel(resources_1.dirname(this._label), { relative: true });
        }
        get longDescription() {
            return this.labelService.getUriLabel(resources_1.dirname(this._label));
        }
        get shortTitle() {
            return this.getName();
        }
        get mediumTitle() {
            return this.labelService.getUriLabel(this._label, { relative: true });
        }
        get longTitle() {
            return this.labelService.getUriLabel(this._label);
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* SHORT */:
                    return this.shortTitle;
                case 2 /* LONG */:
                    return this.longTitle;
                default:
                case 1 /* MEDIUM */:
                    return this.mediumTitle;
            }
        }
        isUntitled() {
            return this.resource.scheme === network_1.Schemas.untitled;
        }
        isReadonly() {
            if (this.isUntitled()) {
                return false; // untitled is never readonly
            }
            return this.fileService.hasCapability(this.resource, 2048 /* Readonly */);
        }
        isSaving() {
            if (this.isUntitled()) {
                return false; // untitled is never saving automatically
            }
            if (this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return true; // a short auto save is configured, treat this as being saved
            }
            return false;
        }
        save(group, options) {
            return this.doSave(group, options, false);
        }
        saveAs(group, options) {
            return this.doSave(group, options, true);
        }
        async doSave(group, options, saveAs) {
            // Save / Save As
            let target;
            if (saveAs) {
                target = await this.textFileService.saveAs(this.resource, undefined, options);
            }
            else {
                target = await this.textFileService.save(this.resource, options);
            }
            if (!target) {
                return undefined; // save cancelled
            }
            // If the target is a different resource, return with a new editor input
            if (!resources_1.extUri.isEqual(target, this.resource)) {
                return this.editorService.createEditorInput({ resource: target });
            }
            return this;
        }
        async revert(group, options) {
            await this.textFileService.revert(this.resource, options);
        }
    };
    AbstractTextResourceEditorInput.MEMOIZER = decorators_1.createMemoizer();
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "basename", null);
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "shortDescription", null);
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "mediumDescription", null);
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "longDescription", null);
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "shortTitle", null);
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "mediumTitle", null);
    __decorate([
        AbstractTextResourceEditorInput.MEMOIZER
    ], AbstractTextResourceEditorInput.prototype, "longTitle", null);
    AbstractTextResourceEditorInput = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, label_1.ILabelService),
        __param(6, files_1.IFileService),
        __param(7, filesConfigurationService_1.IFilesConfigurationService)
    ], AbstractTextResourceEditorInput);
    exports.AbstractTextResourceEditorInput = AbstractTextResourceEditorInput;
});
//# __sourceMappingURL=textResourceEditorInput.js.map