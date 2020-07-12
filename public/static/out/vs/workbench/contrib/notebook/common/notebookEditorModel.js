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
define(["require", "exports", "vs/workbench/common/editor", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/resources", "vs/base/common/cancellation", "vs/workbench/services/backup/common/backup", "vs/base/common/network"], function (require, exports, editor_1, event_1, notebookService_1, workingCopyService_1, resources_1, cancellation_1, backup_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorModel = void 0;
    let NotebookEditorModel = class NotebookEditorModel extends editor_1.EditorModel {
        constructor(resource, viewType, _notebookService, _workingCopyService, _backupFileService) {
            super();
            this.resource = resource;
            this.viewType = viewType;
            this._notebookService = _notebookService;
            this._workingCopyService = _workingCopyService;
            this._backupFileService = _backupFileService;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this.capabilities = 0;
            const input = this;
            this._workingCopyResource = resource.with({ scheme: network_1.Schemas.vscodeNotebook });
            const workingCopyAdapter = new class {
                constructor() {
                    this.resource = input._workingCopyResource;
                    this.capabilities = input.isUntitled() ? 2 /* Untitled */ : input.capabilities;
                    this.onDidChangeDirty = input.onDidChangeDirty;
                    this.onDidChangeContent = input.onDidChangeContent;
                }
                get name() { return input.name; }
                isDirty() { return input.isDirty(); }
                backup() { return input.backup(); }
                save() { return input.save(); }
                revert(options) { return input.revert(options); }
            };
            this._register(this._workingCopyService.registerWorkingCopy(workingCopyAdapter));
        }
        get notebook() {
            return this._notebook;
        }
        get name() {
            return this._name;
        }
        async backup() {
            if (this._notebook.supportBackup) {
                const tokenSource = new cancellation_1.CancellationTokenSource();
                const backupId = await this._notebookService.backup(this.viewType, this.resource, tokenSource.token);
                return {
                    meta: {
                        name: this._name,
                        viewType: this._notebook.viewType,
                        backupId: backupId
                    }
                };
            }
            else {
                return {
                    meta: {
                        name: this._name,
                        viewType: this._notebook.viewType
                    },
                    content: this._notebook.createSnapshot(true)
                };
            }
        }
        async revert(options) {
            if (options === null || options === void 0 ? void 0 : options.soft) {
                await this._backupFileService.discardBackup(this.resource);
                return;
            }
            await this.load({ forceReadFromDisk: true });
            this._notebook.setDirty(false);
            this._onDidChangeDirty.fire();
        }
        async load(options) {
            var _a, _b;
            if (options === null || options === void 0 ? void 0 : options.forceReadFromDisk) {
                return this.loadFromProvider(true, undefined, undefined);
            }
            if (this.isResolved()) {
                return this;
            }
            const backup = await this._backupFileService.resolve(this._workingCopyResource);
            if (this.isResolved()) {
                return this; // Make sure meanwhile someone else did not succeed in loading
            }
            if (backup && ((_a = backup.meta) === null || _a === void 0 ? void 0 : _a.backupId) === undefined) {
                try {
                    return await this.loadFromBackup(backup.value.create(1 /* LF */), options === null || options === void 0 ? void 0 : options.editorId);
                }
                catch (error) {
                    // this.logService.error('[text file model] load() from backup', error); // ignore error and continue to load as file below
                }
            }
            return this.loadFromProvider(false, options === null || options === void 0 ? void 0 : options.editorId, (_b = backup === null || backup === void 0 ? void 0 : backup.meta) === null || _b === void 0 ? void 0 : _b.backupId);
        }
        async loadFromBackup(content, editorId) {
            const fullRange = content.getRangeAt(0, content.getLength());
            const data = JSON.parse(content.getValueInRange(fullRange, 1 /* LF */));
            const notebook = await this._notebookService.createNotebookFromBackup(this.viewType, this.resource, data.metadata, data.languages, data.cells, editorId);
            this._notebook = notebook;
            this._name = resources_1.basename(this._notebook.uri);
            this._register(this._notebook.onDidChangeContent(() => {
                this._onDidChangeContent.fire();
            }));
            this._register(this._notebook.onDidChangeDirty(() => {
                this._onDidChangeDirty.fire();
            }));
            await this._backupFileService.discardBackup(this._workingCopyResource);
            this._notebook.setDirty(true);
            return this;
        }
        async loadFromProvider(forceReloadFromDisk, editorId, backupId) {
            const notebook = await this._notebookService.resolveNotebook(this.viewType, this.resource, forceReloadFromDisk, editorId, backupId);
            this._notebook = notebook;
            this._name = resources_1.basename(this._notebook.uri);
            this._register(this._notebook.onDidChangeContent(() => {
                this._onDidChangeContent.fire();
            }));
            this._register(this._notebook.onDidChangeDirty(() => {
                this._onDidChangeDirty.fire();
            }));
            if (backupId) {
                await this._backupFileService.discardBackup(this._workingCopyResource);
                this._notebook.setDirty(true);
            }
            return this;
        }
        isResolved() {
            return !!this._notebook;
        }
        isDirty() {
            var _a;
            return (_a = this._notebook) === null || _a === void 0 ? void 0 : _a.isDirty;
        }
        isUntitled() {
            return this.resource.scheme === network_1.Schemas.untitled;
        }
        async save() {
            const tokenSource = new cancellation_1.CancellationTokenSource();
            await this._notebookService.save(this.notebook.viewType, this.notebook.uri, tokenSource.token);
            this._notebook.setDirty(false);
            return true;
        }
        async saveAs(targetResource) {
            const tokenSource = new cancellation_1.CancellationTokenSource();
            await this._notebookService.saveAs(this.notebook.viewType, this.notebook.uri, targetResource, tokenSource.token);
            this._notebook.setDirty(false);
            return true;
        }
    };
    NotebookEditorModel = __decorate([
        __param(2, notebookService_1.INotebookService),
        __param(3, workingCopyService_1.IWorkingCopyService),
        __param(4, backup_1.IBackupFileService)
    ], NotebookEditorModel);
    exports.NotebookEditorModel = NotebookEditorModel;
});
//# __sourceMappingURL=notebookEditorModel.js.map