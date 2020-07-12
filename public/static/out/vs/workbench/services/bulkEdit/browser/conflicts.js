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
define(["require", "exports", "vs/platform/files/common/files", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/base/common/map", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, files_1, modes_1, modelService_1, map_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConflictDetector = void 0;
    let ConflictDetector = class ConflictDetector {
        constructor(workspaceEdit, fileService, modelService) {
            this._conflicts = new map_1.ResourceMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidConflict = new event_1.Emitter();
            this.onDidConflict = this._onDidConflict.event;
            const _workspaceEditResources = new map_1.ResourceMap();
            for (let edit of workspaceEdit.edits) {
                if (modes_1.WorkspaceTextEdit.is(edit)) {
                    _workspaceEditResources.set(edit.resource, true);
                    if (typeof edit.modelVersionId === 'number') {
                        const model = modelService.getModel(edit.resource);
                        if (model && model.getVersionId() !== edit.modelVersionId) {
                            this._conflicts.set(edit.resource, true);
                            this._onDidConflict.fire(this);
                        }
                    }
                }
                else if (edit.newUri) {
                    _workspaceEditResources.set(edit.newUri, true);
                }
                else if (edit.oldUri) {
                    _workspaceEditResources.set(edit.oldUri, true);
                }
            }
            // listen to file changes
            this._disposables.add(fileService.onDidFilesChange(e => {
                for (let change of e.changes) {
                    if (modelService.getModel(change.resource)) {
                        // ignore changes for which a model exists
                        // because we have a better check for models
                        continue;
                    }
                    // conflict
                    if (_workspaceEditResources.has(change.resource)) {
                        this._conflicts.set(change.resource, true);
                        this._onDidConflict.fire(this);
                    }
                }
            }));
            // listen to model changes...?
            const onDidChangeModel = (model) => {
                // conflict
                if (_workspaceEditResources.has(model.uri)) {
                    this._conflicts.set(model.uri, true);
                    this._onDidConflict.fire(this);
                }
            };
            for (let model of modelService.getModels()) {
                this._disposables.add(model.onDidChangeContent(() => onDidChangeModel(model)));
            }
        }
        dispose() {
            this._disposables.dispose();
            this._onDidConflict.dispose();
        }
        list() {
            return [...this._conflicts.keys()];
        }
        hasConflicts() {
            return this._conflicts.size > 0;
        }
    };
    ConflictDetector = __decorate([
        __param(1, files_1.IFileService),
        __param(2, modelService_1.IModelService)
    ], ConflictDetector);
    exports.ConflictDetector = ConflictDetector;
});
//# __sourceMappingURL=conflicts.js.map