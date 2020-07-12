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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/types", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, filesConfigurationService_1, host_1, editorService_1, editorGroupsService_1, types_1, workingCopyService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorAutoSave = void 0;
    let EditorAutoSave = class EditorAutoSave extends lifecycle_1.Disposable {
        constructor(filesConfigurationService, hostService, editorService, editorGroupService, workingCopyService, logService) {
            super();
            this.filesConfigurationService = filesConfigurationService;
            this.hostService = hostService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.workingCopyService = workingCopyService;
            this.logService = logService;
            this.pendingAutoSavesAfterDelay = new Map();
            // Auto save: focus change & window change
            this.lastActiveEditor = undefined;
            this.lastActiveGroupId = undefined;
            this.lastActiveEditorControlDisposable = this._register(new lifecycle_1.DisposableStore());
            // Figure out initial auto save config
            this.onAutoSaveConfigurationChange(filesConfigurationService.getAutoSaveConfiguration(), false);
            // Fill in initial dirty working copies
            this.workingCopyService.dirtyWorkingCopies.forEach(workingCopy => this.onDidRegister(workingCopy));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.hostService.onDidChangeFocus(focused => this.onWindowFocusChange(focused)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onDidActiveEditorChange()));
            this._register(this.filesConfigurationService.onAutoSaveConfigurationChange(config => this.onAutoSaveConfigurationChange(config, true)));
            // Working Copy events
            this._register(this.workingCopyService.onDidRegister(workingCopy => this.onDidRegister(workingCopy)));
            this._register(this.workingCopyService.onDidUnregister(workingCopy => this.onDidUnregister(workingCopy)));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.onDidChangeDirty(workingCopy)));
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
        }
        onWindowFocusChange(focused) {
            if (!focused) {
                this.maybeTriggerAutoSave(4 /* WINDOW_CHANGE */);
            }
        }
        onDidActiveEditorChange() {
            // Treat editor change like a focus change for our last active editor if any
            if (this.lastActiveEditor && typeof this.lastActiveGroupId === 'number') {
                this.maybeTriggerAutoSave(3 /* FOCUS_CHANGE */, { groupId: this.lastActiveGroupId, editor: this.lastActiveEditor });
            }
            // Remember as last active
            const activeGroup = this.editorGroupService.activeGroup;
            const activeEditor = this.lastActiveEditor = types_1.withNullAsUndefined(activeGroup.activeEditor);
            this.lastActiveGroupId = activeGroup.id;
            // Dispose previous active control listeners
            this.lastActiveEditorControlDisposable.clear();
            // Listen to focus changes on control for auto save
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditor && activeEditorPane) {
                this.lastActiveEditorControlDisposable.add(activeEditorPane.onDidBlur(() => {
                    this.maybeTriggerAutoSave(3 /* FOCUS_CHANGE */, { groupId: activeGroup.id, editor: activeEditor });
                }));
            }
        }
        maybeTriggerAutoSave(reason, editorIdentifier) {
            if (editorIdentifier && (editorIdentifier.editor.isReadonly() || editorIdentifier.editor.isUntitled())) {
                return; // no auto save for readonly or untitled editors
            }
            // Determine if we need to save all. In case of a window focus change we also save if 
            // auto save mode is configured to be ON_FOCUS_CHANGE (editor focus change)
            const mode = this.filesConfigurationService.getAutoSaveMode();
            if ((reason === 4 /* WINDOW_CHANGE */ && (mode === 3 /* ON_FOCUS_CHANGE */ || mode === 4 /* ON_WINDOW_CHANGE */)) ||
                (reason === 3 /* FOCUS_CHANGE */ && mode === 3 /* ON_FOCUS_CHANGE */)) {
                this.logService.trace(`[editor auto save] triggering auto save with reason ${reason}`);
                if (editorIdentifier) {
                    this.editorService.save(editorIdentifier, { reason });
                }
                else {
                    this.saveAllDirty({ reason });
                }
            }
        }
        onAutoSaveConfigurationChange(config, fromEvent) {
            // Update auto save after delay config
            this.autoSaveAfterDelay = (typeof config.autoSaveDelay === 'number') && config.autoSaveDelay > 0 ? config.autoSaveDelay : undefined;
            // Trigger a save-all when auto save is enabled
            if (fromEvent) {
                let reason = undefined;
                switch (this.filesConfigurationService.getAutoSaveMode()) {
                    case 3 /* ON_FOCUS_CHANGE */:
                        reason = 3 /* FOCUS_CHANGE */;
                        break;
                    case 4 /* ON_WINDOW_CHANGE */:
                        reason = 4 /* WINDOW_CHANGE */;
                        break;
                    case 1 /* AFTER_SHORT_DELAY */:
                    case 2 /* AFTER_LONG_DELAY */:
                        reason = 2 /* AUTO */;
                        break;
                }
                if (reason) {
                    this.saveAllDirty({ reason });
                }
            }
        }
        saveAllDirty(options) {
            for (const workingCopy of this.workingCopyService.dirtyWorkingCopies) {
                if (!(workingCopy.capabilities & 2 /* Untitled */)) {
                    workingCopy.save(options);
                }
            }
        }
        onDidRegister(workingCopy) {
            if (workingCopy.isDirty()) {
                this.scheduleAutoSave(workingCopy);
            }
        }
        onDidUnregister(workingCopy) {
            this.discardAutoSave(workingCopy);
        }
        onDidChangeDirty(workingCopy) {
            if (workingCopy.isDirty()) {
                this.scheduleAutoSave(workingCopy);
            }
            else {
                this.discardAutoSave(workingCopy);
            }
        }
        onDidChangeContent(workingCopy) {
            if (workingCopy.isDirty()) {
                // this listener will make sure that the auto save is
                // pushed out for as long as the user is still changing
                // the content of the working copy.
                this.scheduleAutoSave(workingCopy);
            }
        }
        scheduleAutoSave(workingCopy) {
            if (typeof this.autoSaveAfterDelay !== 'number') {
                return; // auto save after delay must be enabled
            }
            if (workingCopy.capabilities & 2 /* Untitled */) {
                return; // we never auto save untitled working copies
            }
            // Clear any running auto save operation
            this.discardAutoSave(workingCopy);
            this.logService.trace(`[editor auto save] scheduling auto save after ${this.autoSaveAfterDelay}ms`, workingCopy.resource.toString());
            // Schedule new auto save
            const handle = setTimeout(() => {
                // Clear disposable
                this.pendingAutoSavesAfterDelay.delete(workingCopy);
                // Save if dirty
                if (workingCopy.isDirty()) {
                    this.logService.trace(`[editor auto save] running auto save`, workingCopy.resource.toString());
                    workingCopy.save({ reason: 2 /* AUTO */ });
                }
            }, this.autoSaveAfterDelay);
            // Keep in map for disposal as needed
            this.pendingAutoSavesAfterDelay.set(workingCopy, lifecycle_1.toDisposable(() => {
                this.logService.trace(`[editor auto save] clearing pending auto save`, workingCopy.resource.toString());
                clearTimeout(handle);
            }));
        }
        discardAutoSave(workingCopy) {
            lifecycle_1.dispose(this.pendingAutoSavesAfterDelay.get(workingCopy));
            this.pendingAutoSavesAfterDelay.delete(workingCopy);
        }
    };
    EditorAutoSave = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, host_1.IHostService),
        __param(2, editorService_1.IEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, workingCopyService_1.IWorkingCopyService),
        __param(5, log_1.ILogService)
    ], EditorAutoSave);
    exports.EditorAutoSave = EditorAutoSave;
});
//# __sourceMappingURL=editorAutoSave.js.map