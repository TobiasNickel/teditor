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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/configuration/common/configuration", "vs/editor/common/services/editorWorkerService", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/model/editStack"], function (require, exports, arrays_1, lifecycle_1, uri_1, editorBrowser_1, bulkEditService_1, editOperation_1, range_1, modes_1, modelService_1, resolverService_1, nls_1, files_1, extensions_1, log_1, progress_1, editorService_1, textfiles_1, configuration_1, editorWorkerService_1, instantiation_1, workingCopyFileService_1, undoRedo_1, editStack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditService = void 0;
    class ModelEditTask {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
            this.model = this._modelReference.object.textEditorModel;
            this._edits = [];
        }
        dispose() {
            this._modelReference.dispose();
        }
        addEdit(resourceEdit) {
            this._expectedModelVersionId = resourceEdit.modelVersionId;
            const { edit } = resourceEdit;
            if (typeof edit.eol === 'number') {
                // honor eol-change
                this._newEol = edit.eol;
            }
            if (!edit.range && !edit.text) {
                // lacks both a range and the text
                return;
            }
            if (range_1.Range.isEmpty(edit.range) && !edit.text) {
                // no-op edit (replace empty range with empty text)
                return;
            }
            // create edit operation
            let range;
            if (!edit.range) {
                range = this.model.getFullModelRange();
            }
            else {
                range = range_1.Range.lift(edit.range);
            }
            this._edits.push(editOperation_1.EditOperation.replaceMove(range, edit.text));
        }
        validate() {
            if (typeof this._expectedModelVersionId === 'undefined' || this.model.getVersionId() === this._expectedModelVersionId) {
                return { canApply: true };
            }
            return { canApply: false, reason: this.model.uri };
        }
        getBeforeCursorState() {
            return null;
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = arrays_1.mergeSort(this._edits, (a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this.model.pushEditOperations(null, this._edits, () => null);
            }
            if (this._newEol !== undefined) {
                this.model.pushEOL(this._newEol);
            }
        }
    }
    class EditorEditTask extends ModelEditTask {
        constructor(modelReference, editor) {
            super(modelReference);
            this._editor = editor;
        }
        getBeforeCursorState() {
            return this._editor.getSelections();
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = arrays_1.mergeSort(this._edits, (a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this._editor.executeEdits('', this._edits);
            }
            if (this._newEol !== undefined) {
                if (this._editor.hasModel()) {
                    this._editor.getModel().pushEOL(this._newEol);
                }
            }
        }
    }
    let BulkEditModel = class BulkEditModel {
        constructor(_label, _editor, _progress, edits, _editorWorker, _textModelResolverService, _undoRedoService) {
            this._label = _label;
            this._editor = _editor;
            this._progress = _progress;
            this._editorWorker = _editorWorker;
            this._textModelResolverService = _textModelResolverService;
            this._undoRedoService = _undoRedoService;
            this._edits = new Map();
            edits.forEach(this._addEdit, this);
        }
        dispose() {
            if (this._tasks) {
                lifecycle_1.dispose(this._tasks);
            }
        }
        _addEdit(edit) {
            let array = this._edits.get(edit.resource.toString());
            if (!array) {
                array = [];
                this._edits.set(edit.resource.toString(), array);
            }
            array.push(edit);
        }
        async prepare() {
            if (this._tasks) {
                throw new Error('illegal state - already prepared');
            }
            this._tasks = [];
            const promises = [];
            for (let [key, value] of this._edits) {
                const promise = this._textModelResolverService.createModelReference(uri_1.URI.parse(key)).then(async (ref) => {
                    let task;
                    let makeMinimal = false;
                    if (this._editor && this._editor.hasModel() && this._editor.getModel().uri.toString() === ref.object.textEditorModel.uri.toString()) {
                        task = new EditorEditTask(ref, this._editor);
                        makeMinimal = true;
                    }
                    else {
                        task = new ModelEditTask(ref);
                    }
                    for (const edit of value) {
                        if (makeMinimal) {
                            const newEdits = await this._editorWorker.computeMoreMinimalEdits(edit.resource, [edit.edit]);
                            if (!newEdits) {
                                task.addEdit(edit);
                            }
                            else {
                                for (let moreMinialEdit of newEdits) {
                                    task.addEdit(Object.assign(Object.assign({}, edit), { edit: moreMinialEdit }));
                                }
                            }
                        }
                        else {
                            task.addEdit(edit);
                        }
                    }
                    this._tasks.push(task);
                    this._progress.report(undefined);
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            return this;
        }
        validate() {
            for (const task of this._tasks) {
                const result = task.validate();
                if (!result.canApply) {
                    return result;
                }
            }
            return { canApply: true };
        }
        apply() {
            const tasks = this._tasks;
            if (tasks.length === 1) {
                // This edit touches a single model => keep things simple
                for (const task of tasks) {
                    task.model.pushStackElement();
                    task.apply();
                    task.model.pushStackElement();
                    this._progress.report(undefined);
                }
                return;
            }
            const multiModelEditStackElement = new editStack_1.MultiModelEditStackElement(this._label || nls_1.localize('workspaceEdit', "Workspace Edit"), tasks.map(t => new editStack_1.SingleModelEditStackElement(t.model, t.getBeforeCursorState())));
            this._undoRedoService.pushElement(multiModelEditStackElement);
            for (const task of tasks) {
                task.apply();
                this._progress.report(undefined);
            }
            multiModelEditStackElement.close();
        }
    };
    BulkEditModel = __decorate([
        __param(4, editorWorkerService_1.IEditorWorkerService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, undoRedo_1.IUndoRedoService)
    ], BulkEditModel);
    let BulkEdit = class BulkEdit {
        constructor(label, editor, progress, edits, _instaService, _logService, _fileService, _textFileService, _workingCopyFileService, _configurationService) {
            this._instaService = _instaService;
            this._logService = _logService;
            this._fileService = _fileService;
            this._textFileService = _textFileService;
            this._workingCopyFileService = _workingCopyFileService;
            this._configurationService = _configurationService;
            this._edits = [];
            this._label = label;
            this._editor = editor;
            this._progress = progress || progress_1.Progress.None;
            this._edits = edits;
        }
        ariaMessage() {
            const editCount = this._edits.length;
            const resourceCount = this._edits.length;
            if (editCount === 0) {
                return nls_1.localize('summary.0', "Made no edits");
            }
            else if (editCount > 1 && resourceCount > 1) {
                return nls_1.localize('summary.nm', "Made {0} text edits in {1} files", editCount, resourceCount);
            }
            else {
                return nls_1.localize('summary.n0', "Made {0} text edits in one file", editCount, resourceCount);
            }
        }
        async perform() {
            let seen = new Set();
            let total = 0;
            const groups = [];
            let group;
            for (const edit of this._edits) {
                if (!group
                    || (modes_1.WorkspaceFileEdit.is(group[0]) && !modes_1.WorkspaceFileEdit.is(edit))
                    || (modes_1.WorkspaceTextEdit.is(group[0]) && !modes_1.WorkspaceTextEdit.is(edit))) {
                    group = [];
                    groups.push(group);
                }
                group.push(edit);
                if (modes_1.WorkspaceFileEdit.is(edit)) {
                    total += 1;
                }
                else if (!seen.has(edit.resource.toString())) {
                    seen.add(edit.resource.toString());
                    total += 2;
                }
            }
            // define total work and progress callback
            // for child operations
            this._progress.report({ total });
            const progress = { report: _ => this._progress.report({ increment: 1 }) };
            // do it.
            for (const group of groups) {
                if (modes_1.WorkspaceFileEdit.is(group[0])) {
                    await this._performFileEdits(group, progress);
                }
                else {
                    await this._performTextEdits(group, progress);
                }
            }
        }
        async _performFileEdits(edits, progress) {
            this._logService.debug('_performFileEdits', JSON.stringify(edits));
            for (const edit of edits) {
                progress.report(undefined);
                let options = edit.options || {};
                if (edit.newUri && edit.oldUri) {
                    // rename
                    if (options.overwrite === undefined && options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                        continue; // not overwriting, but ignoring, and the target file exists
                    }
                    await this._workingCopyFileService.move(edit.oldUri, edit.newUri, options.overwrite);
                }
                else if (!edit.newUri && edit.oldUri) {
                    // delete file
                    if (await this._fileService.exists(edit.oldUri)) {
                        let useTrash = this._configurationService.getValue('files.enableTrash');
                        if (useTrash && !(this._fileService.hasCapability(edit.oldUri, 4096 /* Trash */))) {
                            useTrash = false; // not supported by provider
                        }
                        await this._workingCopyFileService.delete(edit.oldUri, { useTrash, recursive: options.recursive });
                    }
                    else if (!options.ignoreIfNotExists) {
                        throw new Error(`${edit.oldUri} does not exist and can not be deleted`);
                    }
                }
                else if (edit.newUri && !edit.oldUri) {
                    // create file
                    if (options.overwrite === undefined && options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                        continue; // not overwriting, but ignoring, and the target file exists
                    }
                    await this._textFileService.create(edit.newUri, undefined, { overwrite: options.overwrite });
                }
            }
        }
        async _performTextEdits(edits, progress) {
            this._logService.debug('_performTextEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(BulkEditModel, this._label, this._editor, progress, edits);
            await model.prepare();
            // this._throwIfConflicts(conflicts);
            const validationResult = model.validate();
            if (validationResult.canApply === false) {
                model.dispose();
                throw new Error(`${validationResult.reason.toString()} has changed in the meantime`);
            }
            model.apply();
            model.dispose();
        }
    };
    BulkEdit = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, log_1.ILogService),
        __param(6, files_1.IFileService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, workingCopyFileService_1.IWorkingCopyFileService),
        __param(9, configuration_1.IConfigurationService)
    ], BulkEdit);
    let BulkEditService = class BulkEditService {
        constructor(_instaService, _logService, _modelService, _editorService) {
            this._instaService = _instaService;
            this._logService = _logService;
            this._modelService = _modelService;
            this._editorService = _editorService;
        }
        setPreviewHandler(handler) {
            this._previewHandler = handler;
            return lifecycle_1.toDisposable(() => {
                if (this._previewHandler === handler) {
                    this._previewHandler = undefined;
                }
            });
        }
        hasPreviewHandler() {
            return Boolean(this._previewHandler);
        }
        async apply(edit, options) {
            if (edit.edits.length === 0) {
                return { ariaSummary: nls_1.localize('nothing', "Made no edits") };
            }
            if (this._previewHandler && ((options === null || options === void 0 ? void 0 : options.showPreview) || edit.edits.some(value => { var _a; return (_a = value.metadata) === null || _a === void 0 ? void 0 : _a.needsConfirmation; }))) {
                edit = await this._previewHandler(edit, options);
            }
            const { edits } = edit;
            let codeEditor = options === null || options === void 0 ? void 0 : options.editor;
            // First check if loaded models were not changed in the meantime
            for (const edit of edits) {
                if (!modes_1.WorkspaceFileEdit.is(edit) && typeof edit.modelVersionId === 'number') {
                    let model = this._modelService.getModel(edit.resource);
                    if (model && model.getVersionId() !== edit.modelVersionId) {
                        // model changed in the meantime
                        return Promise.reject(new Error(`${model.uri.toString()} has changed in the meantime`));
                    }
                }
            }
            // try to find code editor
            if (!codeEditor) {
                let candidate = this._editorService.activeTextEditorControl;
                if (editorBrowser_1.isCodeEditor(candidate)) {
                    codeEditor = candidate;
                }
            }
            if (codeEditor && codeEditor.getOption(72 /* readOnly */)) {
                // If the code editor is readonly still allow bulk edits to be applied #68549
                codeEditor = undefined;
            }
            const bulkEdit = this._instaService.createInstance(BulkEdit, (options === null || options === void 0 ? void 0 : options.quotableLabel) || (options === null || options === void 0 ? void 0 : options.label), codeEditor, options === null || options === void 0 ? void 0 : options.progress, edits);
            return bulkEdit.perform().then(() => {
                return { ariaSummary: bulkEdit.ariaMessage() };
            }).catch(err => {
                // console.log('apply FAILED');
                // console.log(err);
                this._logService.error(err);
                throw err;
            });
        }
    };
    BulkEditService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, modelService_1.IModelService),
        __param(3, editorService_1.IEditorService)
    ], BulkEditService);
    exports.BulkEditService = BulkEditService;
    extensions_1.registerSingleton(bulkEditService_1.IBulkEditService, BulkEditService, true);
});
//# __sourceMappingURL=bulkEditService.js.map