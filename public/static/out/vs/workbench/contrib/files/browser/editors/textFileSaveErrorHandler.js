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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/resources", "vs/base/common/actions", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/resolverService", "vs/base/common/map", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/workbench/contrib/files/browser/fileCommands", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/product/common/productService", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, nls, errorMessage_1, resources_1, actions_1, uri_1, textfiles_1, instantiation_1, lifecycle_1, resolverService_1, map_1, diffEditorInput_1, resourceEditorInput_1, contextkey_1, files_1, fileEditorInput_1, fileCommands_1, notification_1, opener_1, storage_1, actions_2, productService_1, event_1, editorService_1, platform_1, network_1, preferences_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.revertLocalChangesCommand = exports.acceptLocalChangesCommand = exports.TextFileSaveErrorHandler = exports.CONFLICT_RESOLUTION_SCHEME = exports.CONFLICT_RESOLUTION_CONTEXT = void 0;
    exports.CONFLICT_RESOLUTION_CONTEXT = 'saveConflictResolutionContext';
    exports.CONFLICT_RESOLUTION_SCHEME = 'conflictResolution';
    const LEARN_MORE_DIRTY_WRITE_IGNORE_KEY = 'learnMoreDirtyWriteError';
    const conflictEditorHelp = nls.localize('userGuide', "Use the actions in the editor tool bar to either undo your changes or overwrite the content of the file with your changes.");
    // A handler for text file save error happening with conflict resolution actions
    let TextFileSaveErrorHandler = class TextFileSaveErrorHandler extends lifecycle_1.Disposable {
        constructor(notificationService, textFileService, contextKeyService, editorService, textModelService, instantiationService, storageService, storageKeysSyncRegistryService) {
            super();
            this.notificationService = notificationService;
            this.textFileService = textFileService;
            this.contextKeyService = contextKeyService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.messages = new map_1.ResourceMap();
            this.conflictResolutionContext = new contextkey_1.RawContextKey(exports.CONFLICT_RESOLUTION_CONTEXT, false).bindTo(this.contextKeyService);
            this.activeConflictResolutionResource = undefined;
            // opt-in to syncing
            storageKeysSyncRegistryService.registerStorageKey({ key: LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, version: 1 });
            const provider = this._register(instantiationService.createInstance(files_1.TextFileContentProvider));
            this._register(textModelService.registerTextModelContentProvider(exports.CONFLICT_RESOLUTION_SCHEME, provider));
            // Set as save error handler to service for text files
            this.textFileService.files.saveErrorHandler = this;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.textFileService.files.onDidSave(e => this.onFileSavedOrReverted(e.model.resource)));
            this._register(this.textFileService.files.onDidRevert(m => this.onFileSavedOrReverted(m.resource)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChanged()));
        }
        onActiveEditorChanged() {
            let isActiveEditorSaveConflictResolution = false;
            let activeConflictResolutionResource;
            const activeInput = this.editorService.activeEditor;
            if (activeInput instanceof diffEditorInput_1.DiffEditorInput && activeInput.originalInput instanceof resourceEditorInput_1.ResourceEditorInput && activeInput.modifiedInput instanceof fileEditorInput_1.FileEditorInput) {
                const resource = activeInput.originalInput.resource;
                if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === exports.CONFLICT_RESOLUTION_SCHEME) {
                    isActiveEditorSaveConflictResolution = true;
                    activeConflictResolutionResource = activeInput.modifiedInput.resource;
                }
            }
            this.conflictResolutionContext.set(isActiveEditorSaveConflictResolution);
            this.activeConflictResolutionResource = activeConflictResolutionResource;
        }
        onFileSavedOrReverted(resource) {
            const messageHandle = this.messages.get(resource);
            if (messageHandle) {
                messageHandle.close();
                this.messages.delete(resource);
            }
        }
        onSaveError(error, model) {
            const fileOperationError = error;
            const resource = model.resource;
            let message;
            const primaryActions = [];
            const secondaryActions = [];
            // Dirty write prevention
            if (fileOperationError.fileOperationResult === 3 /* FILE_MODIFIED_SINCE */) {
                // If the user tried to save from the opened conflict editor, show its message again
                if (this.activeConflictResolutionResource && resources_1.extUri.isEqual(this.activeConflictResolutionResource, model.resource)) {
                    if (this.storageService.getBoolean(LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, 0 /* GLOBAL */)) {
                        return; // return if this message is ignored
                    }
                    message = conflictEditorHelp;
                    primaryActions.push(this.instantiationService.createInstance(ResolveConflictLearnMoreAction));
                    secondaryActions.push(this.instantiationService.createInstance(DoNotShowResolveConflictLearnMoreAction));
                }
                // Otherwise show the message that will lead the user into the save conflict editor.
                else {
                    message = nls.localize('staleSaveError', "Failed to save '{0}': The content of the file is newer. Please compare your version with the file contents or overwrite the content of the file with your changes.", resources_1.basename(resource));
                    primaryActions.push(this.instantiationService.createInstance(ResolveSaveConflictAction, model));
                    primaryActions.push(this.instantiationService.createInstance(SaveIgnoreModifiedSinceAction, model));
                    secondaryActions.push(this.instantiationService.createInstance(ConfigureSaveConflictAction));
                }
            }
            // Any other save error
            else {
                const isReadonly = fileOperationError.fileOperationResult === 5 /* FILE_READ_ONLY */;
                const triedToMakeWriteable = isReadonly && fileOperationError.options && fileOperationError.options.overwriteReadonly;
                const isPermissionDenied = fileOperationError.fileOperationResult === 6 /* FILE_PERMISSION_DENIED */;
                const canHandlePermissionOrReadonlyErrors = resource.scheme === network_1.Schemas.file; // https://github.com/Microsoft/vscode/issues/48659
                // Save Elevated
                if (canHandlePermissionOrReadonlyErrors && (isPermissionDenied || triedToMakeWriteable)) {
                    primaryActions.push(this.instantiationService.createInstance(SaveElevatedAction, model, !!triedToMakeWriteable));
                }
                // Overwrite
                else if (canHandlePermissionOrReadonlyErrors && isReadonly) {
                    primaryActions.push(this.instantiationService.createInstance(OverwriteReadonlyAction, model));
                }
                // Retry
                else {
                    primaryActions.push(this.instantiationService.createInstance(actions_2.ExecuteCommandAction, fileCommands_1.SAVE_FILE_COMMAND_ID, nls.localize('retry', "Retry")));
                }
                // Save As
                primaryActions.push(this.instantiationService.createInstance(actions_2.ExecuteCommandAction, fileCommands_1.SAVE_FILE_AS_COMMAND_ID, fileCommands_1.SAVE_FILE_AS_LABEL));
                // Discard
                primaryActions.push(this.instantiationService.createInstance(actions_2.ExecuteCommandAction, fileCommands_1.REVERT_FILE_COMMAND_ID, nls.localize('discard', "Discard")));
                // Message
                if (canHandlePermissionOrReadonlyErrors && isReadonly) {
                    if (triedToMakeWriteable) {
                        message = platform_1.isWindows ? nls.localize('readonlySaveErrorAdmin', "Failed to save '{0}': File is read-only. Select 'Overwrite as Admin' to retry as administrator.", resources_1.basename(resource)) : nls.localize('readonlySaveErrorSudo', "Failed to save '{0}': File is read-only. Select 'Overwrite as Sudo' to retry as superuser.", resources_1.basename(resource));
                    }
                    else {
                        message = nls.localize('readonlySaveError', "Failed to save '{0}': File is read-only. Select 'Overwrite' to attempt to make it writeable.", resources_1.basename(resource));
                    }
                }
                else if (canHandlePermissionOrReadonlyErrors && isPermissionDenied) {
                    message = platform_1.isWindows ? nls.localize('permissionDeniedSaveError', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Admin' to retry as administrator.", resources_1.basename(resource)) : nls.localize('permissionDeniedSaveErrorSudo', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Sudo' to retry as superuser.", resources_1.basename(resource));
                }
                else {
                    message = nls.localize('genericSaveError', "Failed to save '{0}': {1}", resources_1.basename(resource), errorMessage_1.toErrorMessage(error, false));
                }
            }
            // Show message and keep function to hide in case the file gets saved/reverted
            const actions = { primary: primaryActions, secondary: secondaryActions };
            const handle = this.notificationService.notify({ severity: notification_1.Severity.Error, message, actions });
            event_1.Event.once(handle.onDidClose)(() => { lifecycle_1.dispose(primaryActions); lifecycle_1.dispose(secondaryActions); });
            this.messages.set(model.resource, handle);
        }
        dispose() {
            super.dispose();
            this.messages.clear();
        }
    };
    TextFileSaveErrorHandler = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, editorService_1.IEditorService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, storage_1.IStorageService),
        __param(7, storageKeys_1.IStorageKeysSyncRegistryService)
    ], TextFileSaveErrorHandler);
    exports.TextFileSaveErrorHandler = TextFileSaveErrorHandler;
    const pendingResolveSaveConflictMessages = [];
    function clearPendingResolveSaveConflictMessages() {
        while (pendingResolveSaveConflictMessages.length > 0) {
            const item = pendingResolveSaveConflictMessages.pop();
            if (item) {
                item.close();
            }
        }
    }
    let ResolveConflictLearnMoreAction = class ResolveConflictLearnMoreAction extends actions_1.Action {
        constructor(openerService) {
            super('workbench.files.action.resolveConflictLearnMore', nls.localize('learnMore', "Learn More"));
            this.openerService = openerService;
        }
        async run() {
            await this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=868264'));
        }
    };
    ResolveConflictLearnMoreAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], ResolveConflictLearnMoreAction);
    let DoNotShowResolveConflictLearnMoreAction = class DoNotShowResolveConflictLearnMoreAction extends actions_1.Action {
        constructor(storageService) {
            super('workbench.files.action.resolveConflictLearnMoreDoNotShowAgain', nls.localize('dontShowAgain', "Don't Show Again"));
            this.storageService = storageService;
        }
        async run(notification) {
            this.storageService.store(LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, true, 0 /* GLOBAL */);
            // Hide notification
            notification.dispose();
        }
    };
    DoNotShowResolveConflictLearnMoreAction = __decorate([
        __param(0, storage_1.IStorageService)
    ], DoNotShowResolveConflictLearnMoreAction);
    let ResolveSaveConflictAction = class ResolveSaveConflictAction extends actions_1.Action {
        constructor(model, editorService, notificationService, instantiationService, productService, storageKeysSyncRegistryService) {
            super('workbench.files.action.resolveConflict', nls.localize('compareChanges', "Compare"));
            this.model = model;
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.productService = productService;
            // opt-in to syncing
            storageKeysSyncRegistryService.registerStorageKey({ key: LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, version: 1 });
        }
        async run() {
            if (!this.model.isDisposed()) {
                const resource = this.model.resource;
                const name = resources_1.basename(resource);
                const editorLabel = nls.localize('saveConflictDiffLabel', "{0} (in file) ↔ {1} (in {2}) - Resolve save conflict", name, name, this.productService.nameLong);
                await files_1.TextFileContentProvider.open(resource, exports.CONFLICT_RESOLUTION_SCHEME, editorLabel, this.editorService, { pinned: true });
                // Show additional help how to resolve the save conflict
                const actions = { primary: [this.instantiationService.createInstance(ResolveConflictLearnMoreAction)] };
                const handle = this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: conflictEditorHelp,
                    actions,
                    neverShowAgain: { id: LEARN_MORE_DIRTY_WRITE_IGNORE_KEY, isSecondary: true }
                });
                event_1.Event.once(handle.onDidClose)(() => lifecycle_1.dispose(actions.primary));
                pendingResolveSaveConflictMessages.push(handle);
            }
        }
    };
    ResolveSaveConflictAction = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, notification_1.INotificationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, productService_1.IProductService),
        __param(5, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ResolveSaveConflictAction);
    class SaveElevatedAction extends actions_1.Action {
        constructor(model, triedToMakeWriteable) {
            super('workbench.files.action.saveElevated', triedToMakeWriteable ? platform_1.isWindows ? nls.localize('overwriteElevated', "Overwrite as Admin...") : nls.localize('overwriteElevatedSudo', "Overwrite as Sudo...") : platform_1.isWindows ? nls.localize('saveElevated', "Retry as Admin...") : nls.localize('saveElevatedSudo', "Retry as Sudo..."));
            this.model = model;
            this.triedToMakeWriteable = triedToMakeWriteable;
        }
        async run() {
            if (!this.model.isDisposed()) {
                this.model.save({
                    writeElevated: true,
                    overwriteReadonly: this.triedToMakeWriteable,
                    reason: 1 /* EXPLICIT */
                });
            }
        }
    }
    class OverwriteReadonlyAction extends actions_1.Action {
        constructor(model) {
            super('workbench.files.action.overwrite', nls.localize('overwrite', "Overwrite"));
            this.model = model;
        }
        async run() {
            if (!this.model.isDisposed()) {
                this.model.save({ overwriteReadonly: true, reason: 1 /* EXPLICIT */ });
            }
        }
    }
    class SaveIgnoreModifiedSinceAction extends actions_1.Action {
        constructor(model) {
            super('workbench.files.action.saveIgnoreModifiedSince', nls.localize('overwrite', "Overwrite"));
            this.model = model;
        }
        async run() {
            if (!this.model.isDisposed()) {
                this.model.save({ ignoreModifiedSince: true, reason: 1 /* EXPLICIT */ });
            }
        }
    }
    let ConfigureSaveConflictAction = class ConfigureSaveConflictAction extends actions_1.Action {
        constructor(preferencesService) {
            super('workbench.files.action.configureSaveConflict', nls.localize('configure', "Configure"));
            this.preferencesService = preferencesService;
        }
        async run() {
            this.preferencesService.openSettings(undefined, 'files.saveConflictResolution');
        }
    };
    ConfigureSaveConflictAction = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], ConfigureSaveConflictAction);
    exports.acceptLocalChangesCommand = async (accessor, resource) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const editorPane = editorService.activeEditorPane;
        if (!editorPane) {
            return;
        }
        const editor = editorPane.input;
        const group = editorPane.group;
        const reference = await resolverService.createModelReference(resource);
        const model = reference.object;
        try {
            // hide any previously shown message about how to use these actions
            clearPendingResolveSaveConflictMessages();
            // Trigger save
            await model.save({ ignoreModifiedSince: true, reason: 1 /* EXPLICIT */ });
            // Reopen file input
            await editorService.openEditor({ resource: model.resource }, group);
            // Clean up
            group.closeEditor(editor);
            editor.dispose();
        }
        finally {
            reference.dispose();
        }
    };
    exports.revertLocalChangesCommand = async (accessor, resource) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const editorPane = editorService.activeEditorPane;
        if (!editorPane) {
            return;
        }
        const editor = editorPane.input;
        const group = editorPane.group;
        const reference = await resolverService.createModelReference(resource);
        const model = reference.object;
        try {
            // hide any previously shown message about how to use these actions
            clearPendingResolveSaveConflictMessages();
            // Revert on model
            await model.revert();
            // Reopen file input
            await editorService.openEditor({ resource: model.resource }, group);
            // Clean up
            group.closeEditor(editor);
            editor.dispose();
        }
        finally {
            reference.dispose();
        }
    };
});
//# __sourceMappingURL=textFileSaveErrorHandler.js.map