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
define(["require", "exports", "vs/workbench/services/textfile/common/textfiles", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, textfiles_1, lifecycle_1, lifecycle_2, arrays_1, host_1, editorService_1, async_1, codeEditorService_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorTracker = void 0;
    let TextFileEditorTracker = class TextFileEditorTracker extends lifecycle_2.Disposable {
        constructor(editorService, textFileService, lifecycleService, hostService, codeEditorService, filesConfigurationService) {
            super();
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.lifecycleService = lifecycleService;
            this.hostService = hostService;
            this.codeEditorService = codeEditorService;
            this.filesConfigurationService = filesConfigurationService;
            //#region Text File: Ensure every dirty text and untitled file is opened in an editor
            this.ensureDirtyFilesAreOpenedWorker = this._register(new async_1.RunOnceWorker(units => this.ensureDirtyTextFilesAreOpened(units), 50));
            this.registerListeners();
        }
        registerListeners() {
            // Ensure dirty text file and untitled models are always opened as editors
            this._register(this.textFileService.files.onDidChangeDirty(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            this._register(this.textFileService.files.onDidSaveError(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            this._register(this.textFileService.untitled.onDidChangeDirty(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            // Update visible text file editors when focus is gained
            this._register(this.hostService.onDidChangeFocus(hasFocus => hasFocus ? this.reloadVisibleTextFileEditors() : undefined));
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
        }
        ensureDirtyTextFilesAreOpened(resources) {
            this.doEnsureDirtyTextFilesAreOpened(arrays_1.distinct(resources.filter(resource => {
                if (!this.textFileService.isDirty(resource)) {
                    return false; // resource must be dirty
                }
                const model = this.textFileService.files.get(resource);
                if (model === null || model === void 0 ? void 0 : model.hasState(2 /* PENDING_SAVE */)) {
                    return false; // resource must not be pending to save
                }
                if (this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                    return false; // resource must not be pending to be auto saved
                }
                if (this.editorService.isOpen({ resource })) {
                    return false; // model must not be opened already as file
                }
                return true;
            }), resource => resource.toString()));
        }
        doEnsureDirtyTextFilesAreOpened(resources) {
            if (!resources.length) {
                return;
            }
            this.editorService.openEditors(resources.map(resource => ({
                resource,
                options: { inactive: true, pinned: true, preserveFocus: true }
            })));
        }
        //#endregion
        //#region Window Focus Change: Update visible code editors when focus is gained that have a known text file model
        reloadVisibleTextFileEditors() {
            // the window got focus and we use this as a hint that files might have been changed outside
            // of this window. since file events can be unreliable, we queue a load for models that
            // are visible in any editor. since this is a fast operation in the case nothing has changed,
            // we tolerate the additional work.
            arrays_1.distinct(arrays_1.coalesce(this.codeEditorService.listCodeEditors()
                .map(codeEditor => {
                var _a;
                const resource = (_a = codeEditor.getModel()) === null || _a === void 0 ? void 0 : _a.uri;
                if (!resource) {
                    return undefined;
                }
                const model = this.textFileService.files.get(resource);
                if (!model || model.isDirty() || !model.isResolved()) {
                    return undefined;
                }
                return model;
            })), model => model.resource.toString()).forEach(model => this.textFileService.files.resolve(model.resource, { reload: { async: true } }));
        }
    };
    TextFileEditorTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, host_1.IHostService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, filesConfigurationService_1.IFilesConfigurationService)
    ], TextFileEditorTracker);
    exports.TextFileEditorTracker = TextFileEditorTracker;
});
//# __sourceMappingURL=textFileEditorTracker.js.map