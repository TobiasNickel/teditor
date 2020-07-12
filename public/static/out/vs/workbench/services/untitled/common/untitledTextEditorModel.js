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
define(["require", "exports", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/base/common/event", "vs/workbench/services/backup/common/backup", "vs/editor/common/services/textResourceConfigurationService", "vs/editor/common/model/textModel", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/platform/label/common/label", "vs/editor/common/model/wordHelper", "vs/workbench/services/editor/common/editorService"], function (require, exports, textEditorModel_1, modeService_1, modelService_1, event_1, backup_1, textResourceConfigurationService_1, textModel_1, workingCopyService_1, textfiles_1, types_1, label_1, wordHelper_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledTextEditorModel = void 0;
    let UntitledTextEditorModel = class UntitledTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
        constructor(resource, hasAssociatedFilePath, initialValue, preferredMode, preferredEncoding, modeService, modelService, backupFileService, textResourceConfigurationService, workingCopyService, textFileService, labelService, editorService) {
            super(modelService, modeService);
            this.resource = resource;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.initialValue = initialValue;
            this.preferredMode = preferredMode;
            this.preferredEncoding = preferredEncoding;
            this.backupFileService = backupFileService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.workingCopyService = workingCopyService;
            this.textFileService = textFileService;
            this.labelService = labelService;
            this.editorService = editorService;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeName = this._register(new event_1.Emitter());
            this.onDidChangeName = this._onDidChangeName.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this.capabilities = 2 /* Untitled */;
            this.cachedModelFirstLineWords = undefined;
            this.dirty = this.hasAssociatedFilePath || !!this.initialValue;
            this.ignoreDirtyOnModelContentChange = false;
            this.versionId = 0;
            this.configuredLabelFormat = 'content';
            this._hasModeSetExplicitly = false;
            // Make known to working copy service
            this._register(this.workingCopyService.registerWorkingCopy(this));
            if (preferredMode) {
                this.setMode(preferredMode);
            }
            // Fetch config
            this.onConfigurationChange(false);
            this.registerListeners();
        }
        get name() {
            // Take name from first line if present and only if
            // we have no associated file path. In that case we
            // prefer the file name as title.
            if (this.configuredLabelFormat === 'content' && !this.hasAssociatedFilePath && this.cachedModelFirstLineWords) {
                return this.cachedModelFirstLineWords;
            }
            // Otherwise fallback to resource
            return this.labelService.getUriBasenameLabel(this.resource);
        }
        registerListeners() {
            // Config Changes
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(e => this.onConfigurationChange(true)));
        }
        onConfigurationChange(fromEvent) {
            // Encoding
            const configuredEncoding = this.textResourceConfigurationService.getValue(this.resource, 'files.encoding');
            if (this.configuredEncoding !== configuredEncoding) {
                this.configuredEncoding = configuredEncoding;
                if (fromEvent && !this.preferredEncoding) {
                    this._onDidChangeEncoding.fire(); // do not fire event if we have a preferred encoding set
                }
            }
            // Label Format
            const configuredLabelFormat = this.textResourceConfigurationService.getValue(this.resource, 'workbench.editor.untitled.labelFormat');
            if (this.configuredLabelFormat !== configuredLabelFormat && (configuredLabelFormat === 'content' || configuredLabelFormat === 'name')) {
                this.configuredLabelFormat = configuredLabelFormat;
                if (fromEvent) {
                    this._onDidChangeName.fire();
                }
            }
        }
        getVersionId() {
            return this.versionId;
        }
        get hasModeSetExplicitly() { return this._hasModeSetExplicitly; }
        setMode(mode) {
            // Remember that an explicit mode was set
            this._hasModeSetExplicitly = true;
            let actualMode = undefined;
            if (mode === '${activeEditorLanguage}') {
                // support the special '${activeEditorLanguage}' mode by
                // looking up the language mode from the currently
                // active text editor if any
                actualMode = this.editorService.activeTextEditorMode;
            }
            else {
                actualMode = mode;
            }
            this.preferredMode = actualMode;
            if (actualMode) {
                super.setMode(actualMode);
            }
        }
        getMode() {
            if (this.textEditorModel) {
                return this.textEditorModel.getModeId();
            }
            return this.preferredMode;
        }
        getEncoding() {
            return this.preferredEncoding || this.configuredEncoding;
        }
        setEncoding(encoding) {
            const oldEncoding = this.getEncoding();
            this.preferredEncoding = encoding;
            // Emit if it changed
            if (oldEncoding !== this.preferredEncoding) {
                this._onDidChangeEncoding.fire();
            }
        }
        setValue(value, ignoreDirty) {
            if (ignoreDirty) {
                this.ignoreDirtyOnModelContentChange = true;
            }
            try {
                this.updateTextEditorModel(textModel_1.createTextBufferFactory(value));
            }
            finally {
                this.ignoreDirtyOnModelContentChange = false;
            }
        }
        isReadonly() {
            return false;
        }
        isDirty() {
            return this.dirty;
        }
        setDirty(dirty) {
            if (this.dirty === dirty) {
                return;
            }
            this.dirty = dirty;
            this._onDidChangeDirty.fire();
        }
        async save(options) {
            const target = await this.textFileService.save(this.resource, options);
            return !!target;
        }
        async revert() {
            this.setDirty(false);
            // Emit as event
            this._onDidRevert.fire();
            // A reverted untitled model is invalid because it has
            // no actual source on disk to revert to. As such we
            // dispose the model.
            this.dispose();
        }
        async backup() {
            return { content: types_1.withNullAsUndefined(this.createSnapshot()) };
        }
        async load() {
            // Check for backups
            const backup = await this.backupFileService.resolve(this.resource);
            let untitledContents;
            if (backup) {
                untitledContents = backup.value;
            }
            else {
                untitledContents = textModel_1.createTextBufferFactory(this.initialValue || '');
            }
            // Create text editor model if not yet done
            let createdUntitledModel = false;
            if (!this.textEditorModel) {
                this.createTextEditorModel(untitledContents, this.resource, this.preferredMode);
                createdUntitledModel = true;
            }
            // Otherwise: the untitled model already exists and we must assume
            // that the value of the model was changed by the user. As such we
            // do not update the contents, only the mode if configured.
            else {
                this.updateTextEditorModel(undefined, this.preferredMode);
            }
            // Listen to text model events
            const textEditorModel = types_1.assertIsDefined(this.textEditorModel);
            this._register(textEditorModel.onDidChangeContent(e => this.onModelContentChanged(textEditorModel, e)));
            this._register(textEditorModel.onDidChangeLanguage(() => this.onConfigurationChange(true))); // mode change can have impact on config
            // Only adjust name and dirty state etc. if we
            // actually created the untitled model
            if (createdUntitledModel) {
                // Name
                if (backup || this.initialValue) {
                    this.updateNameFromFirstLine();
                }
                // Untitled associated to file path are dirty right away as well as untitled with content
                this.setDirty(this.hasAssociatedFilePath || !!backup || !!this.initialValue);
                // If we have initial contents, make sure to emit this
                // as the appropiate events to the outside.
                if (backup || this.initialValue) {
                    this._onDidChangeContent.fire();
                }
            }
            return this;
        }
        onModelContentChanged(model, e) {
            this.versionId++;
            if (!this.ignoreDirtyOnModelContentChange) {
                // mark the untitled text editor as non-dirty once its content becomes empty and we do
                // not have an associated path set. we never want dirty indicator in that case.
                if (!this.hasAssociatedFilePath && model.getLineCount() === 1 && model.getLineContent(1) === '') {
                    this.setDirty(false);
                }
                // turn dirty otherwise
                else {
                    this.setDirty(true);
                }
            }
            // Check for name change if first line changed in the range of 0-FIRST_LINE_NAME_MAX_LENGTH columns
            if (e.changes.some(change => (change.range.startLineNumber === 1 || change.range.endLineNumber === 1) && change.range.startColumn <= UntitledTextEditorModel.FIRST_LINE_NAME_MAX_LENGTH)) {
                this.updateNameFromFirstLine();
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
        }
        updateNameFromFirstLine() {
            var _a;
            if (this.hasAssociatedFilePath) {
                return; // not in case of an associated file path
            }
            // Determine the first words of the model following these rules:
            // - cannot be only whitespace (so we trim())
            // - cannot be only non-alphanumeric characters (so we run word definition regex over it)
            // - cannot be longer than FIRST_LINE_MAX_TITLE_LENGTH
            let modelFirstWordsCandidate = undefined;
            const firstLineText = (_a = this.textEditorModel) === null || _a === void 0 ? void 0 : _a.getValueInRange({ startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: UntitledTextEditorModel.FIRST_LINE_NAME_MAX_LENGTH + 1 }).trim();
            if (firstLineText && wordHelper_1.ensureValidWordDefinition().exec(firstLineText)) {
                modelFirstWordsCandidate = firstLineText;
            }
            if (modelFirstWordsCandidate !== this.cachedModelFirstLineWords) {
                this.cachedModelFirstLineWords = modelFirstWordsCandidate;
                this._onDidChangeName.fire();
            }
        }
    };
    UntitledTextEditorModel.FIRST_LINE_NAME_MAX_LENGTH = 40;
    UntitledTextEditorModel = __decorate([
        __param(5, modeService_1.IModeService),
        __param(6, modelService_1.IModelService),
        __param(7, backup_1.IBackupFileService),
        __param(8, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, label_1.ILabelService),
        __param(12, editorService_1.IEditorService)
    ], UntitledTextEditorModel);
    exports.UntitledTextEditorModel = UntitledTextEditorModel;
});
//# __sourceMappingURL=untitledTextEditorModel.js.map