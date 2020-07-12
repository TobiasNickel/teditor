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
define(["require", "exports", "vs/nls", "vs/base/common/network", "vs/base/common/lifecycle", "vs/workbench/contrib/search/common/replace", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/contrib/search/common/searchModel", "vs/editor/common/services/resolverService", "vs/platform/instantiation/common/instantiation", "vs/editor/common/model/textModel", "vs/workbench/services/textfile/common/textfiles", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/base/common/arrays"], function (require, exports, nls, network, lifecycle_1, replace_1, editorService_1, modelService_1, modeService_1, searchModel_1, resolverService_1, instantiation_1, textModel_1, textfiles_1, bulkEditService_1, range_1, editOperation_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaceService = exports.ReplacePreviewContentProvider = void 0;
    const REPLACE_PREVIEW = 'replacePreview';
    const toReplaceResource = (fileResource) => {
        return fileResource.with({ scheme: network.Schemas.internal, fragment: REPLACE_PREVIEW, query: JSON.stringify({ scheme: fileResource.scheme }) });
    };
    const toFileResource = (replaceResource) => {
        return replaceResource.with({ scheme: JSON.parse(replaceResource.query)['scheme'], fragment: '', query: '' });
    };
    let ReplacePreviewContentProvider = class ReplacePreviewContentProvider {
        constructor(instantiationService, textModelResolverService) {
            this.instantiationService = instantiationService;
            this.textModelResolverService = textModelResolverService;
            this.textModelResolverService.registerTextModelContentProvider(network.Schemas.internal, this);
        }
        provideTextContent(uri) {
            if (uri.fragment === REPLACE_PREVIEW) {
                return this.instantiationService.createInstance(ReplacePreviewModel).resolve(uri);
            }
            return null;
        }
    };
    ReplacePreviewContentProvider = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], ReplacePreviewContentProvider);
    exports.ReplacePreviewContentProvider = ReplacePreviewContentProvider;
    let ReplacePreviewModel = class ReplacePreviewModel extends lifecycle_1.Disposable {
        constructor(modelService, modeService, textModelResolverService, replaceService, searchWorkbenchService) {
            super();
            this.modelService = modelService;
            this.modeService = modeService;
            this.textModelResolverService = textModelResolverService;
            this.replaceService = replaceService;
            this.searchWorkbenchService = searchWorkbenchService;
        }
        async resolve(replacePreviewUri) {
            const fileResource = toFileResource(replacePreviewUri);
            const fileMatch = this.searchWorkbenchService.searchModel.searchResult.matches().filter(match => match.resource.toString() === fileResource.toString())[0];
            const ref = this._register(await this.textModelResolverService.createModelReference(fileResource));
            const sourceModel = ref.object.textEditorModel;
            const sourceModelModeId = sourceModel.getLanguageIdentifier().language;
            const replacePreviewModel = this.modelService.createModel(textModel_1.createTextBufferFactoryFromSnapshot(sourceModel.createSnapshot()), this.modeService.create(sourceModelModeId), replacePreviewUri);
            this._register(fileMatch.onChange(({ forceUpdateModel }) => this.update(sourceModel, replacePreviewModel, fileMatch, forceUpdateModel)));
            this._register(this.searchWorkbenchService.searchModel.onReplaceTermChanged(() => this.update(sourceModel, replacePreviewModel, fileMatch)));
            this._register(fileMatch.onDispose(() => replacePreviewModel.dispose())); // TODO@Sandeep we should not dispose a model directly but rather the reference (depends on https://github.com/Microsoft/vscode/issues/17073)
            this._register(replacePreviewModel.onWillDispose(() => this.dispose()));
            this._register(sourceModel.onWillDispose(() => this.dispose()));
            return replacePreviewModel;
        }
        update(sourceModel, replacePreviewModel, fileMatch, override = false) {
            if (!sourceModel.isDisposed() && !replacePreviewModel.isDisposed()) {
                this.replaceService.updateReplacePreview(fileMatch, override);
            }
        }
    };
    ReplacePreviewModel = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, modeService_1.IModeService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, replace_1.IReplaceService),
        __param(4, searchModel_1.ISearchWorkbenchService)
    ], ReplacePreviewModel);
    let ReplaceService = class ReplaceService {
        constructor(textFileService, editorService, textModelResolverService, bulkEditorService) {
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.textModelResolverService = textModelResolverService;
            this.bulkEditorService = bulkEditorService;
        }
        async replace(arg, progress = undefined, resource = null) {
            const edits = this.createEdits(arg, resource);
            await this.bulkEditorService.apply({ edits }, { progress });
            return Promise.all(edits.map(e => { var _a; return (_a = this.textFileService.files.get(e.resource)) === null || _a === void 0 ? void 0 : _a.save(); }));
        }
        async openReplacePreview(element, preserveFocus, sideBySide, pinned) {
            const fileMatch = element instanceof searchModel_1.Match ? element.parent() : element;
            const editor = await this.editorService.openEditor({
                leftResource: fileMatch.resource,
                rightResource: toReplaceResource(fileMatch.resource),
                label: nls.localize('fileReplaceChanges', "{0} ↔ {1} (Replace Preview)", fileMatch.name(), fileMatch.name()),
                options: {
                    preserveFocus,
                    pinned,
                    revealIfVisible: true
                }
            });
            const input = editor === null || editor === void 0 ? void 0 : editor.input;
            const disposable = fileMatch.onDispose(() => {
                if (input) {
                    input.dispose();
                }
                disposable.dispose();
            });
            await this.updateReplacePreview(fileMatch);
            if (editor) {
                const editorControl = editor.getControl();
                if (element instanceof searchModel_1.Match && editorControl) {
                    editorControl.revealLineInCenter(element.range().startLineNumber, 1 /* Immediate */);
                }
            }
        }
        async updateReplacePreview(fileMatch, override = false) {
            const replacePreviewUri = toReplaceResource(fileMatch.resource);
            const [sourceModelRef, replaceModelRef] = await Promise.all([this.textModelResolverService.createModelReference(fileMatch.resource), this.textModelResolverService.createModelReference(replacePreviewUri)]);
            const sourceModel = sourceModelRef.object.textEditorModel;
            const replaceModel = replaceModelRef.object.textEditorModel;
            // If model is disposed do not update
            try {
                if (sourceModel && replaceModel) {
                    if (override) {
                        replaceModel.setValue(sourceModel.getValue());
                    }
                    else {
                        replaceModel.undo();
                    }
                    this.applyEditsToPreview(fileMatch, replaceModel);
                }
            }
            finally {
                sourceModelRef.dispose();
                replaceModelRef.dispose();
            }
        }
        applyEditsToPreview(fileMatch, replaceModel) {
            const resourceEdits = this.createEdits(fileMatch, replaceModel.uri);
            const modelEdits = [];
            for (const resourceEdit of resourceEdits) {
                modelEdits.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(resourceEdit.edit.range), resourceEdit.edit.text));
            }
            replaceModel.pushEditOperations([], arrays_1.mergeSort(modelEdits, (a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range)), () => []);
        }
        createEdits(arg, resource = null) {
            const edits = [];
            if (arg instanceof searchModel_1.Match) {
                const match = arg;
                edits.push(this.createEdit(match, match.replaceString, resource));
            }
            if (arg instanceof searchModel_1.FileMatch) {
                arg = [arg];
            }
            if (arg instanceof Array) {
                arg.forEach(element => {
                    const fileMatch = element;
                    if (fileMatch.count() > 0) {
                        edits.push(...fileMatch.matches().map(match => this.createEdit(match, match.replaceString, resource)));
                    }
                });
            }
            return edits;
        }
        createEdit(match, text, resource = null) {
            const fileMatch = match.parent();
            const resourceEdit = {
                resource: resource !== null ? resource : fileMatch.resource,
                edit: {
                    range: match.range(),
                    text: text
                }
            };
            return resourceEdit;
        }
    };
    ReplaceService = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, editorService_1.IEditorService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService)
    ], ReplaceService);
    exports.ReplaceService = ReplaceService;
});
//# __sourceMappingURL=replaceService.js.map