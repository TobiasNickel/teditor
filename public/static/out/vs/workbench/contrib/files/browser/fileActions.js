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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/errorMessage", "vs/base/common/strings", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/files/browser/fileCommands", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/arrays", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/errors", "vs/base/browser/dom", "vs/base/common/labels", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/async", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/base/common/functional", "vs/base/common/codicons", "vs/workbench/common/views"], function (require, exports, nls, platform_1, extpath, path_1, resources, errorMessage_1, strings, actions_1, lifecycle_1, files_1, textfiles_1, files_2, editor_1, quickInput_1, viewlet_1, instantiation_1, host_1, fileCommands_1, resolverService_1, configuration_1, clipboardService_1, modeService_1, modelService_1, commands_1, contextkey_1, network_1, dialogs_1, notification_1, editorService_1, editorCommands_1, arrays_1, explorerModel_1, errors_1, dom_1, labels_1, filesConfigurationService_1, workingCopyService_1, async_1, workingCopyFileService_1, functional_1, codicons_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openFilePreserveFocusHandler = exports.pasteFileHandler = exports.DOWNLOAD_COMMAND_ID = exports.cutFileHandler = exports.copyFileHandler = exports.deleteFileHandler = exports.moveFileToTrashHandler = exports.renameHandler = exports.CompareWithClipboardAction = exports.getWellFormedFileName = exports.validateFileName = exports.ShowOpenedFileInNewWindow = exports.RefreshExplorerView = exports.CollapseExplorerView = exports.ShowActiveFileInExplorer = exports.FocusFilesExplorer = exports.CloseGroupAction = exports.SaveAllInGroupAction = exports.SaveAllAction = exports.BaseSaveAllAction = exports.ToggleAutoSaveAction = exports.GlobalCompareResourcesAction = exports.incrementFileName = exports.findValidPasteFileTarget = exports.NewFolderAction = exports.NewFileAction = exports.DOWNLOAD_LABEL = exports.FileCopiedContext = exports.PASTE_FILE_LABEL = exports.COPY_FILE_LABEL = exports.MOVE_FILE_TO_TRASH_LABEL = exports.TRIGGER_RENAME_LABEL = exports.NEW_FOLDER_LABEL = exports.NEW_FOLDER_COMMAND_ID = exports.NEW_FILE_LABEL = exports.NEW_FILE_COMMAND_ID = void 0;
    exports.NEW_FILE_COMMAND_ID = 'explorer.newFile';
    exports.NEW_FILE_LABEL = nls.localize('newFile', "New File");
    exports.NEW_FOLDER_COMMAND_ID = 'explorer.newFolder';
    exports.NEW_FOLDER_LABEL = nls.localize('newFolder', "New Folder");
    exports.TRIGGER_RENAME_LABEL = nls.localize('rename', "Rename");
    exports.MOVE_FILE_TO_TRASH_LABEL = nls.localize('delete', "Delete");
    exports.COPY_FILE_LABEL = nls.localize('copyFile', "Copy");
    exports.PASTE_FILE_LABEL = nls.localize('pasteFile', "Paste");
    exports.FileCopiedContext = new contextkey_1.RawContextKey('fileCopied', false);
    exports.DOWNLOAD_LABEL = nls.localize('download', "Download");
    const CONFIRM_DELETE_SETTING_KEY = 'explorer.confirmDelete';
    function onError(notificationService, error) {
        if (error.message === 'string') {
            error = error.message;
        }
        notificationService.error(errorMessage_1.toErrorMessage(error, false));
    }
    async function refreshIfSeparator(value, explorerService) {
        if (value && ((value.indexOf('/') >= 0) || (value.indexOf('\\') >= 0))) {
            // New input contains separator, multiple resources will get created workaround for #68204
            await explorerService.refresh();
        }
    }
    /* New File */
    let NewFileAction = class NewFileAction extends actions_1.Action {
        constructor(commandService) {
            super('explorer.newFile', exports.NEW_FILE_LABEL);
            this.commandService = commandService;
            this.class = 'explorer-action ' + codicons_1.Codicon.newFile.classNames;
        }
        run() {
            return this.commandService.executeCommand(exports.NEW_FILE_COMMAND_ID);
        }
    };
    NewFileAction.ID = 'workbench.files.action.createFileFromExplorer';
    NewFileAction.LABEL = nls.localize('createNewFile', "New File");
    NewFileAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], NewFileAction);
    exports.NewFileAction = NewFileAction;
    /* New Folder */
    let NewFolderAction = class NewFolderAction extends actions_1.Action {
        constructor(commandService) {
            super('explorer.newFolder', exports.NEW_FOLDER_LABEL);
            this.commandService = commandService;
            this.class = 'explorer-action ' + codicons_1.Codicon.newFolder.classNames;
        }
        run() {
            return this.commandService.executeCommand(exports.NEW_FOLDER_COMMAND_ID);
        }
    };
    NewFolderAction.ID = 'workbench.files.action.createFolderFromExplorer';
    NewFolderAction.LABEL = nls.localize('createNewFolder', "New Folder");
    NewFolderAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], NewFolderAction);
    exports.NewFolderAction = NewFolderAction;
    async function deleteFiles(workingCopyFileService, dialogService, configurationService, elements, useTrash, skipConfirm = false) {
        let primaryButton;
        if (useTrash) {
            primaryButton = platform_1.isWindows ? nls.localize('deleteButtonLabelRecycleBin', "&&Move to Recycle Bin") : nls.localize({ key: 'deleteButtonLabelTrash', comment: ['&& denotes a mnemonic'] }, "&&Move to Trash");
        }
        else {
            primaryButton = nls.localize({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete");
        }
        // Handle dirty
        const distinctElements = resources.distinctParents(elements, e => e.resource);
        const dirtyWorkingCopies = new Set();
        for (const distinctElement of distinctElements) {
            for (const dirtyWorkingCopy of workingCopyFileService.getDirty(distinctElement.resource)) {
                dirtyWorkingCopies.add(dirtyWorkingCopy);
            }
        }
        let confirmed = true;
        if (dirtyWorkingCopies.size) {
            let message;
            if (distinctElements.length > 1) {
                message = nls.localize('dirtyMessageFilesDelete', "You are deleting files with unsaved changes. Do you want to continue?");
            }
            else if (distinctElements[0].isDirectory) {
                if (dirtyWorkingCopies.size === 1) {
                    message = nls.localize('dirtyMessageFolderOneDelete', "You are deleting a folder {0} with unsaved changes in 1 file. Do you want to continue?", distinctElements[0].name);
                }
                else {
                    message = nls.localize('dirtyMessageFolderDelete', "You are deleting a folder {0} with unsaved changes in {1} files. Do you want to continue?", distinctElements[0].name, dirtyWorkingCopies.size);
                }
            }
            else {
                message = nls.localize('dirtyMessageFileDelete', "You are deleting {0} with unsaved changes. Do you want to continue?", distinctElements[0].name);
            }
            const response = await dialogService.confirm({
                message,
                type: 'warning',
                detail: nls.localize('dirtyWarning', "Your changes will be lost if you don't save them."),
                primaryButton
            });
            if (!response.confirmed) {
                confirmed = false;
            }
            else {
                skipConfirm = true;
            }
        }
        // Check if file is dirty in editor and save it to avoid data loss
        if (!confirmed) {
            return;
        }
        let confirmation;
        // Check if we need to ask for confirmation at all
        if (skipConfirm || (useTrash && configurationService.getValue(CONFIRM_DELETE_SETTING_KEY) === false)) {
            confirmation = { confirmed: true };
        }
        // Confirm for moving to trash
        else if (useTrash) {
            let { message, detail } = getMoveToTrashMessage(distinctElements);
            detail += detail ? '\n' : '';
            if (platform_1.isWindows) {
                detail += distinctElements.length > 1 ? nls.localize('undoBinFiles', "You can restore these files from the Recycle Bin.") : nls.localize('undoBin', "You can restore this file from the Recycle Bin.");
            }
            else {
                detail += distinctElements.length > 1 ? nls.localize('undoTrashFiles', "You can restore these files from the Trash.") : nls.localize('undoTrash', "You can restore this file from the Trash.");
            }
            confirmation = await dialogService.confirm({
                message,
                detail,
                primaryButton,
                checkbox: {
                    label: nls.localize('doNotAskAgain', "Do not ask me again")
                },
                type: 'question'
            });
        }
        // Confirm for deleting permanently
        else {
            let { message, detail } = getDeleteMessage(distinctElements);
            detail += detail ? '\n' : '';
            detail += nls.localize('irreversible', "This action is irreversible!");
            confirmation = await dialogService.confirm({
                message,
                detail,
                primaryButton,
                type: 'warning'
            });
        }
        // Check for confirmation checkbox
        if (confirmation.confirmed && confirmation.checkboxChecked === true) {
            await configurationService.updateValue(CONFIRM_DELETE_SETTING_KEY, false, 1 /* USER */);
        }
        // Check for confirmation
        if (!confirmation.confirmed) {
            return;
        }
        // Call function
        try {
            await Promise.all(distinctElements.map(e => workingCopyFileService.delete(e.resource, { useTrash: useTrash, recursive: true })));
        }
        catch (error) {
            // Handle error to delete file(s) from a modal confirmation dialog
            let errorMessage;
            let detailMessage;
            let primaryButton;
            if (useTrash) {
                errorMessage = platform_1.isWindows ? nls.localize('binFailed', "Failed to delete using the Recycle Bin. Do you want to permanently delete instead?") : nls.localize('trashFailed', "Failed to delete using the Trash. Do you want to permanently delete instead?");
                detailMessage = nls.localize('irreversible', "This action is irreversible!");
                primaryButton = nls.localize({ key: 'deletePermanentlyButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete Permanently");
            }
            else {
                errorMessage = errorMessage_1.toErrorMessage(error, false);
                primaryButton = nls.localize({ key: 'retryButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Retry");
            }
            const res = await dialogService.confirm({
                message: errorMessage,
                detail: detailMessage,
                type: 'warning',
                primaryButton
            });
            if (res.confirmed) {
                if (useTrash) {
                    useTrash = false; // Delete Permanently
                }
                skipConfirm = true;
                return deleteFiles(workingCopyFileService, dialogService, configurationService, elements, useTrash, skipConfirm);
            }
        }
    }
    function getMoveToTrashMessage(distinctElements) {
        if (containsBothDirectoryAndFile(distinctElements)) {
            return {
                message: nls.localize('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to delete the following {0} files/directories and their contents?", distinctElements.length),
                detail: dialogs_1.getFileNamesMessage(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements.length > 1) {
            if (distinctElements[0].isDirectory) {
                return {
                    message: nls.localize('confirmMoveTrashMessageMultipleDirectories', "Are you sure you want to delete the following {0} directories and their contents?", distinctElements.length),
                    detail: dialogs_1.getFileNamesMessage(distinctElements.map(e => e.resource))
                };
            }
            return {
                message: nls.localize('confirmMoveTrashMessageMultiple', "Are you sure you want to delete the following {0} files?", distinctElements.length),
                detail: dialogs_1.getFileNamesMessage(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements[0].isDirectory) {
            return { message: nls.localize('confirmMoveTrashMessageFolder', "Are you sure you want to delete '{0}' and its contents?", distinctElements[0].name), detail: '' };
        }
        return { message: nls.localize('confirmMoveTrashMessageFile', "Are you sure you want to delete '{0}'?", distinctElements[0].name), detail: '' };
    }
    function getDeleteMessage(distinctElements) {
        if (containsBothDirectoryAndFile(distinctElements)) {
            return {
                message: nls.localize('confirmDeleteMessageFilesAndDirectories', "Are you sure you want to permanently delete the following {0} files/directories and their contents?", distinctElements.length),
                detail: dialogs_1.getFileNamesMessage(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements.length > 1) {
            if (distinctElements[0].isDirectory) {
                return {
                    message: nls.localize('confirmDeleteMessageMultipleDirectories', "Are you sure you want to permanently delete the following {0} directories and their contents?", distinctElements.length),
                    detail: dialogs_1.getFileNamesMessage(distinctElements.map(e => e.resource))
                };
            }
            return {
                message: nls.localize('confirmDeleteMessageMultiple', "Are you sure you want to permanently delete the following {0} files?", distinctElements.length),
                detail: dialogs_1.getFileNamesMessage(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements[0].isDirectory) {
            return { message: nls.localize('confirmDeleteMessageFolder', "Are you sure you want to permanently delete '{0}' and its contents?", distinctElements[0].name), detail: '' };
        }
        return { message: nls.localize('confirmDeleteMessageFile', "Are you sure you want to permanently delete '{0}'?", distinctElements[0].name), detail: '' };
    }
    function containsBothDirectoryAndFile(distinctElements) {
        const directory = distinctElements.find(element => element.isDirectory);
        const file = distinctElements.find(element => !element.isDirectory);
        return !!directory && !!file;
    }
    function findValidPasteFileTarget(explorerService, targetFolder, fileToPaste, incrementalNaming) {
        let name = resources.basenameOrAuthority(fileToPaste.resource);
        let candidate = resources.joinPath(targetFolder.resource, name);
        while (true && !fileToPaste.allowOverwrite) {
            if (!explorerService.findClosest(candidate)) {
                break;
            }
            name = incrementFileName(name, !!fileToPaste.isDirectory, incrementalNaming);
            candidate = resources.joinPath(targetFolder.resource, name);
        }
        return candidate;
    }
    exports.findValidPasteFileTarget = findValidPasteFileTarget;
    function incrementFileName(name, isFolder, incrementalNaming) {
        if (incrementalNaming === 'simple') {
            let namePrefix = name;
            let extSuffix = '';
            if (!isFolder) {
                extSuffix = path_1.extname(name);
                namePrefix = path_1.basename(name, extSuffix);
            }
            // name copy 5(.txt) => name copy 6(.txt)
            // name copy(.txt) => name copy 2(.txt)
            const suffixRegex = /^(.+ copy)( \d+)?$/;
            if (suffixRegex.test(namePrefix)) {
                return namePrefix.replace(suffixRegex, (match, g1, g2) => {
                    let number = (g2 ? parseInt(g2) : 1);
                    return number === 0
                        ? `${g1}`
                        : (number < 1073741824 /* MAX_SAFE_SMALL_INTEGER */
                            ? `${g1} ${number + 1}`
                            : `${g1}${g2} copy`);
                }) + extSuffix;
            }
            // name(.txt) => name copy(.txt)
            return `${namePrefix} copy${extSuffix}`;
        }
        const separators = '[\\.\\-_]';
        const maxNumber = 1073741824 /* MAX_SAFE_SMALL_INTEGER */;
        // file.1.txt=>file.2.txt
        let suffixFileRegex = RegExp('(.*' + separators + ')(\\d+)(\\..*)$');
        if (!isFolder && name.match(suffixFileRegex)) {
            return name.replace(suffixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g2);
                return number < maxNumber
                    ? g1 + strings.pad(number + 1, g2.length) + g3
                    : strings.format('{0}{1}.1{2}', g1, g2, g3);
            });
        }
        // 1.file.txt=>2.file.txt
        let prefixFileRegex = RegExp('(\\d+)(' + separators + '.*)(\\..*)$');
        if (!isFolder && name.match(prefixFileRegex)) {
            return name.replace(prefixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? strings.pad(number + 1, g1.length) + g2 + g3
                    : strings.format('{0}{1}.1{2}', g1, g2, g3);
            });
        }
        // 1.txt=>2.txt
        let prefixFileNoNameRegex = RegExp('(\\d+)(\\..*)$');
        if (!isFolder && name.match(prefixFileNoNameRegex)) {
            return name.replace(prefixFileNoNameRegex, (match, g1, g2) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? strings.pad(number + 1, g1.length) + g2
                    : strings.format('{0}.1{1}', g1, g2);
            });
        }
        // file.txt=>file.1.txt
        const lastIndexOfDot = name.lastIndexOf('.');
        if (!isFolder && lastIndexOfDot >= 0) {
            return strings.format('{0}.1{1}', name.substr(0, lastIndexOfDot), name.substr(lastIndexOfDot));
        }
        // folder.1=>folder.2
        if (isFolder && name.match(/(\d+)$/)) {
            return name.replace(/(\d+)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? strings.pad(number + 1, groups[0].length)
                    : strings.format('{0}.1', groups[0]);
            });
        }
        // 1.folder=>2.folder
        if (isFolder && name.match(/^(\d+)/)) {
            return name.replace(/^(\d+)(.*)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? strings.pad(number + 1, groups[0].length) + groups[1]
                    : strings.format('{0}{1}.1', groups[0], groups[1]);
            });
        }
        // file/folder=>file.1/folder.1
        return strings.format('{0}.1', name);
    }
    exports.incrementFileName = incrementFileName;
    // Global Compare with
    let GlobalCompareResourcesAction = class GlobalCompareResourcesAction extends actions_1.Action {
        constructor(id, label, quickInputService, editorService, notificationService, textModelService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.textModelService = textModelService;
        }
        async run() {
            const activeInput = this.editorService.activeEditor;
            const activeResource = activeInput ? activeInput.resource : undefined;
            if (activeResource && this.textModelService.canHandleResource(activeResource)) {
                // Compare with next editor that opens
                const toDispose = this.editorService.overrideOpenEditor({
                    open: editor => {
                        // Only once!
                        toDispose.dispose();
                        // Open editor as diff
                        const resource = editor.resource;
                        if (resource && this.textModelService.canHandleResource(resource)) {
                            return {
                                override: this.editorService.openEditor({
                                    leftResource: activeResource,
                                    rightResource: resource,
                                    options: { override: false }
                                })
                            };
                        }
                        // Otherwise stay on current resource
                        this.notificationService.info(nls.localize('fileToCompareNoFile', "Please select a file to compare with."));
                        return {
                            override: this.editorService.openEditor({
                                resource: activeResource,
                                options: { override: false }
                            })
                        };
                    }
                });
                functional_1.once(this.quickInputService.onHide)((async () => {
                    await async_1.timeout(0); // prevent race condition with editor
                    toDispose.dispose();
                }));
                // Bring up quick access
                this.quickInputService.quickAccess.show('', { itemActivation: quickInput_1.ItemActivation.SECOND });
            }
            else {
                this.notificationService.info(nls.localize('openFileToCompare', "Open a file first to compare it with another file."));
            }
        }
    };
    GlobalCompareResourcesAction.ID = 'workbench.files.action.compareFileWith';
    GlobalCompareResourcesAction.LABEL = nls.localize('globalCompareFile', "Compare Active File With...");
    GlobalCompareResourcesAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, editorService_1.IEditorService),
        __param(4, notification_1.INotificationService),
        __param(5, resolverService_1.ITextModelService)
    ], GlobalCompareResourcesAction);
    exports.GlobalCompareResourcesAction = GlobalCompareResourcesAction;
    let ToggleAutoSaveAction = class ToggleAutoSaveAction extends actions_1.Action {
        constructor(id, label, filesConfigurationService) {
            super(id, label);
            this.filesConfigurationService = filesConfigurationService;
        }
        run() {
            return this.filesConfigurationService.toggleAutoSave();
        }
    };
    ToggleAutoSaveAction.ID = 'workbench.action.toggleAutoSave';
    ToggleAutoSaveAction.LABEL = nls.localize('toggleAutoSave', "Toggle Auto Save");
    ToggleAutoSaveAction = __decorate([
        __param(2, filesConfigurationService_1.IFilesConfigurationService)
    ], ToggleAutoSaveAction);
    exports.ToggleAutoSaveAction = ToggleAutoSaveAction;
    let BaseSaveAllAction = class BaseSaveAllAction extends actions_1.Action {
        constructor(id, label, commandService, notificationService, workingCopyService) {
            super(id, label);
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.workingCopyService = workingCopyService;
            this.lastDirtyState = this.workingCopyService.hasDirty;
            this.enabled = this.lastDirtyState;
            this.registerListeners();
        }
        registerListeners() {
            // update enablement based on working copy changes
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.updateEnablement(workingCopy)));
        }
        updateEnablement(workingCopy) {
            const hasDirty = workingCopy.isDirty() || this.workingCopyService.hasDirty;
            if (this.lastDirtyState !== hasDirty) {
                this.enabled = hasDirty;
                this.lastDirtyState = this.enabled;
            }
        }
        async run(context) {
            try {
                await this.doRun(context);
            }
            catch (error) {
                onError(this.notificationService, error);
            }
        }
    };
    BaseSaveAllAction = __decorate([
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService),
        __param(4, workingCopyService_1.IWorkingCopyService)
    ], BaseSaveAllAction);
    exports.BaseSaveAllAction = BaseSaveAllAction;
    class SaveAllAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action ' + codicons_1.Codicon.saveAll.classNames;
        }
        doRun() {
            return this.commandService.executeCommand(fileCommands_1.SAVE_ALL_COMMAND_ID);
        }
    }
    exports.SaveAllAction = SaveAllAction;
    SaveAllAction.ID = 'workbench.action.files.saveAll';
    SaveAllAction.LABEL = fileCommands_1.SAVE_ALL_LABEL;
    class SaveAllInGroupAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action ' + codicons_1.Codicon.saveAll.classNames;
        }
        doRun(context) {
            return this.commandService.executeCommand(fileCommands_1.SAVE_ALL_IN_GROUP_COMMAND_ID, {}, context);
        }
    }
    exports.SaveAllInGroupAction = SaveAllInGroupAction;
    SaveAllInGroupAction.ID = 'workbench.files.action.saveAllInGroup';
    SaveAllInGroupAction.LABEL = nls.localize('saveAllInGroup', "Save All in Group");
    let CloseGroupAction = class CloseGroupAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, codicons_1.Codicon.closeAll.classNames);
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, {}, context);
        }
    };
    CloseGroupAction.ID = 'workbench.files.action.closeGroup';
    CloseGroupAction.LABEL = nls.localize('closeGroup', "Close Group");
    CloseGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseGroupAction);
    exports.CloseGroupAction = CloseGroupAction;
    let FocusFilesExplorer = class FocusFilesExplorer extends actions_1.Action {
        constructor(id, label, viewletService) {
            super(id, label);
            this.viewletService = viewletService;
        }
        async run() {
            await this.viewletService.openViewlet(files_1.VIEWLET_ID, true);
        }
    };
    FocusFilesExplorer.ID = 'workbench.files.action.focusFilesExplorer';
    FocusFilesExplorer.LABEL = nls.localize('focusFilesExplorer', "Focus on Files Explorer");
    FocusFilesExplorer = __decorate([
        __param(2, viewlet_1.IViewletService)
    ], FocusFilesExplorer);
    exports.FocusFilesExplorer = FocusFilesExplorer;
    let ShowActiveFileInExplorer = class ShowActiveFileInExplorer extends actions_1.Action {
        constructor(id, label, editorService, notificationService, commandService) {
            super(id, label);
            this.editorService = editorService;
            this.notificationService = notificationService;
            this.commandService = commandService;
        }
        async run() {
            const resource = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (resource) {
                this.commandService.executeCommand(fileCommands_1.REVEAL_IN_EXPLORER_COMMAND_ID, resource);
            }
            else {
                this.notificationService.info(nls.localize('openFileToShow', "Open a file first to show it in the explorer"));
            }
        }
    };
    ShowActiveFileInExplorer.ID = 'workbench.files.action.showActiveFileInExplorer';
    ShowActiveFileInExplorer.LABEL = nls.localize('showInExplorer', "Reveal Active File in Side Bar");
    ShowActiveFileInExplorer = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, notification_1.INotificationService),
        __param(4, commands_1.ICommandService)
    ], ShowActiveFileInExplorer);
    exports.ShowActiveFileInExplorer = ShowActiveFileInExplorer;
    let CollapseExplorerView = class CollapseExplorerView extends actions_1.Action {
        constructor(id, label, viewletService, explorerService) {
            super(id, label, 'explorer-action ' + codicons_1.Codicon.collapseAll.classNames);
            this.viewletService = viewletService;
            this.explorerService = explorerService;
        }
        async run() {
            var _a;
            const explorerViewlet = (_a = (await this.viewletService.openViewlet(files_1.VIEWLET_ID))) === null || _a === void 0 ? void 0 : _a.getViewPaneContainer();
            const explorerView = explorerViewlet.getExplorerView();
            if (explorerView) {
                explorerView.collapseAll();
            }
        }
    };
    CollapseExplorerView.ID = 'workbench.files.action.collapseExplorerFolders';
    CollapseExplorerView.LABEL = nls.localize('collapseExplorerFolders', "Collapse Folders in Explorer");
    CollapseExplorerView = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, files_1.IExplorerService)
    ], CollapseExplorerView);
    exports.CollapseExplorerView = CollapseExplorerView;
    let RefreshExplorerView = class RefreshExplorerView extends actions_1.Action {
        constructor(id, label, viewletService, explorerService) {
            super(id, label, 'explorer-action ' + codicons_1.Codicon.refresh.classNames);
            this.viewletService = viewletService;
            this.explorerService = explorerService;
        }
        async run() {
            await this.viewletService.openViewlet(files_1.VIEWLET_ID);
            await this.explorerService.refresh();
        }
    };
    RefreshExplorerView.ID = 'workbench.files.action.refreshFilesExplorer';
    RefreshExplorerView.LABEL = nls.localize('refreshExplorer', "Refresh Explorer");
    RefreshExplorerView = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, files_1.IExplorerService)
    ], RefreshExplorerView);
    exports.RefreshExplorerView = RefreshExplorerView;
    let ShowOpenedFileInNewWindow = class ShowOpenedFileInNewWindow extends actions_1.Action {
        constructor(id, label, editorService, hostService, notificationService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.hostService = hostService;
            this.notificationService = notificationService;
            this.fileService = fileService;
        }
        async run() {
            const fileResource = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (fileResource) {
                if (this.fileService.canHandleResource(fileResource)) {
                    this.hostService.openWindow([{ fileUri: fileResource }], { forceNewWindow: true });
                }
                else {
                    this.notificationService.info(nls.localize('openFileToShowInNewWindow.unsupportedschema', "The active editor must contain an openable resource."));
                }
            }
            else {
                this.notificationService.info(nls.localize('openFileToShowInNewWindow.nofile', "Open a file first to open in new window"));
            }
        }
    };
    ShowOpenedFileInNewWindow.ID = 'workbench.action.files.showOpenedFileInNewWindow';
    ShowOpenedFileInNewWindow.LABEL = nls.localize('openFileInNewWindow', "Open Active File in New Window");
    ShowOpenedFileInNewWindow = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, host_1.IHostService),
        __param(4, notification_1.INotificationService),
        __param(5, files_2.IFileService)
    ], ShowOpenedFileInNewWindow);
    exports.ShowOpenedFileInNewWindow = ShowOpenedFileInNewWindow;
    function validateFileName(item, name) {
        // Produce a well formed file name
        name = getWellFormedFileName(name);
        // Name not provided
        if (!name || name.length === 0 || /^\s+$/.test(name)) {
            return {
                content: nls.localize('emptyFileNameError', "A file or folder name must be provided."),
                severity: notification_1.Severity.Error
            };
        }
        // Relative paths only
        if (name[0] === '/' || name[0] === '\\') {
            return {
                content: nls.localize('fileNameStartsWithSlashError', "A file or folder name cannot start with a slash."),
                severity: notification_1.Severity.Error
            };
        }
        const names = arrays_1.coalesce(name.split(/[\\/]/));
        const parent = item.parent;
        if (name !== item.name) {
            // Do not allow to overwrite existing file
            const child = parent === null || parent === void 0 ? void 0 : parent.getChild(name);
            if (child && child !== item) {
                return {
                    content: nls.localize('fileNameExistsError', "A file or folder **{0}** already exists at this location. Please choose a different name.", name),
                    severity: notification_1.Severity.Error
                };
            }
        }
        // Invalid File name
        const windowsBasenameValidity = item.resource.scheme === network_1.Schemas.file && platform_1.isWindows;
        if (names.some((folderName) => !extpath.isValidBasename(folderName, windowsBasenameValidity))) {
            return {
                content: nls.localize('invalidFileNameError', "The name **{0}** is not valid as a file or folder name. Please choose a different name.", trimLongName(name)),
                severity: notification_1.Severity.Error
            };
        }
        if (names.some(name => /^\s|\s$/.test(name))) {
            return {
                content: nls.localize('fileNameWhitespaceWarning', "Leading or trailing whitespace detected in file or folder name."),
                severity: notification_1.Severity.Warning
            };
        }
        return null;
    }
    exports.validateFileName = validateFileName;
    function trimLongName(name) {
        if ((name === null || name === void 0 ? void 0 : name.length) > 255) {
            return `${name.substr(0, 255)}...`;
        }
        return name;
    }
    function getWellFormedFileName(filename) {
        if (!filename) {
            return filename;
        }
        // Trim tabs
        filename = strings.trim(filename, '\t');
        // Remove trailing dots and slashes
        filename = strings.rtrim(filename, '.');
        filename = strings.rtrim(filename, '/');
        filename = strings.rtrim(filename, '\\');
        return filename;
    }
    exports.getWellFormedFileName = getWellFormedFileName;
    let CompareWithClipboardAction = class CompareWithClipboardAction extends actions_1.Action {
        constructor(id, label, editorService, instantiationService, textModelService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.textModelService = textModelService;
            this.fileService = fileService;
            this.enabled = true;
        }
        async run() {
            const resource = editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            const scheme = `clipboardCompare${CompareWithClipboardAction.SCHEME_COUNTER++}`;
            if (resource && (this.fileService.canHandleResource(resource) || resource.scheme === network_1.Schemas.untitled)) {
                if (!this.registrationDisposal) {
                    const provider = this.instantiationService.createInstance(ClipboardContentProvider);
                    this.registrationDisposal = this.textModelService.registerTextModelContentProvider(scheme, provider);
                }
                const name = resources.basename(resource);
                const editorLabel = nls.localize('clipboardComparisonLabel', "Clipboard ↔ {0}", name);
                await this.editorService.openEditor({ leftResource: resource.with({ scheme }), rightResource: resource, label: editorLabel }).finally(() => {
                    lifecycle_1.dispose(this.registrationDisposal);
                    this.registrationDisposal = undefined;
                });
            }
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.registrationDisposal);
            this.registrationDisposal = undefined;
        }
    };
    CompareWithClipboardAction.ID = 'workbench.files.action.compareWithClipboard';
    CompareWithClipboardAction.LABEL = nls.localize('compareWithClipboard', "Compare Active File with Clipboard");
    CompareWithClipboardAction.SCHEME_COUNTER = 0;
    CompareWithClipboardAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, files_2.IFileService)
    ], CompareWithClipboardAction);
    exports.CompareWithClipboardAction = CompareWithClipboardAction;
    let ClipboardContentProvider = class ClipboardContentProvider {
        constructor(clipboardService, modeService, modelService) {
            this.clipboardService = clipboardService;
            this.modeService = modeService;
            this.modelService = modelService;
        }
        async provideTextContent(resource) {
            const text = await this.clipboardService.readText();
            const model = this.modelService.createModel(text, this.modeService.createByFilepathOrFirstLine(resource), resource);
            return model;
        }
    };
    ClipboardContentProvider = __decorate([
        __param(0, clipboardService_1.IClipboardService),
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], ClipboardContentProvider);
    function onErrorWithRetry(notificationService, error, retry) {
        notificationService.prompt(notification_1.Severity.Error, errorMessage_1.toErrorMessage(error, false), [{
                label: nls.localize('retry', "Retry"),
                run: () => retry()
            }]);
    }
    async function openExplorerAndCreate(accessor, isFolder) {
        const explorerService = accessor.get(files_1.IExplorerService);
        const fileService = accessor.get(files_2.IFileService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const viewsService = accessor.get(views_1.IViewsService);
        const notificationService = accessor.get(notification_1.INotificationService);
        await viewsService.openView(files_1.VIEW_ID, true);
        const stats = explorerService.getContext(false);
        const stat = stats.length > 0 ? stats[0] : undefined;
        let folder;
        if (stat) {
            folder = stat.isDirectory ? stat : (stat.parent || explorerService.roots[0]);
        }
        else {
            folder = explorerService.roots[0];
        }
        if (folder.isReadonly) {
            throw new Error('Parent folder is readonly.');
        }
        const newStat = new explorerModel_1.NewExplorerItem(fileService, folder, isFolder);
        folder.addChild(newStat);
        const onSuccess = async (value) => {
            try {
                const created = isFolder ? await fileService.createFolder(resources.joinPath(folder.resource, value)) : await textFileService.create(resources.joinPath(folder.resource, value));
                await refreshIfSeparator(value, explorerService);
                isFolder ?
                    await explorerService.select(created.resource, true) :
                    await editorService.openEditor({ resource: created.resource, options: { pinned: true } });
            }
            catch (error) {
                onErrorWithRetry(notificationService, error, () => onSuccess(value));
            }
        };
        await explorerService.setEditable(newStat, {
            validationMessage: value => validateFileName(newStat, value),
            onFinish: async (value, success) => {
                folder.removeChild(newStat);
                await explorerService.setEditable(newStat, null);
                if (success) {
                    onSuccess(value);
                }
            }
        });
    }
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FILE_COMMAND_ID,
        handler: async (accessor) => {
            await openExplorerAndCreate(accessor, false);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            await openExplorerAndCreate(accessor, true);
        }
    });
    exports.renameHandler = async (accessor) => {
        const explorerService = accessor.get(files_1.IExplorerService);
        const workingCopyFileService = accessor.get(workingCopyFileService_1.IWorkingCopyFileService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const stats = explorerService.getContext(false);
        const stat = stats.length > 0 ? stats[0] : undefined;
        if (!stat) {
            return;
        }
        await explorerService.setEditable(stat, {
            validationMessage: value => validateFileName(stat, value),
            onFinish: async (value, success) => {
                if (success) {
                    const parentResource = stat.parent.resource;
                    const targetResource = resources.joinPath(parentResource, value);
                    if (stat.resource.toString() !== targetResource.toString()) {
                        try {
                            await workingCopyFileService.move(stat.resource, targetResource);
                            await refreshIfSeparator(value, explorerService);
                        }
                        catch (e) {
                            notificationService.error(e);
                        }
                    }
                }
                await explorerService.setEditable(stat, null);
            }
        });
    };
    exports.moveFileToTrashHandler = async (accessor) => {
        const explorerService = accessor.get(files_1.IExplorerService);
        const stats = explorerService.getContext(true).filter(s => !s.isRoot);
        if (stats.length) {
            await deleteFiles(accessor.get(workingCopyFileService_1.IWorkingCopyFileService), accessor.get(dialogs_1.IDialogService), accessor.get(configuration_1.IConfigurationService), stats, true);
        }
    };
    exports.deleteFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_1.IExplorerService);
        const stats = explorerService.getContext(true).filter(s => !s.isRoot);
        if (stats.length) {
            await deleteFiles(accessor.get(workingCopyFileService_1.IWorkingCopyFileService), accessor.get(dialogs_1.IDialogService), accessor.get(configuration_1.IConfigurationService), stats, false);
        }
    };
    let pasteShouldMove = false;
    exports.copyFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_1.IExplorerService);
        const stats = explorerService.getContext(true);
        if (stats.length > 0) {
            await explorerService.setToCopy(stats, false);
            pasteShouldMove = false;
        }
    };
    exports.cutFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_1.IExplorerService);
        const stats = explorerService.getContext(true);
        if (stats.length > 0) {
            await explorerService.setToCopy(stats, true);
            pasteShouldMove = true;
        }
    };
    exports.DOWNLOAD_COMMAND_ID = 'explorer.download';
    const downloadFileHandler = (accessor) => {
        const fileService = accessor.get(files_2.IFileService);
        const workingCopyFileService = accessor.get(workingCopyFileService_1.IWorkingCopyFileService);
        const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const stats = explorerService.getContext(true);
        let canceled = false;
        async_1.sequence(stats.map(s => async () => {
            if (canceled) {
                return;
            }
            if (platform_1.isWeb) {
                if (!s.isDirectory) {
                    let bufferOrUri;
                    try {
                        bufferOrUri = (await fileService.readFile(s.resource, { limits: { size: 1024 * 1024 /* set a limit to reduce memory pressure */ } })).value.buffer;
                    }
                    catch (error) {
                        bufferOrUri = dom_1.asDomUri(s.resource);
                    }
                    dom_1.triggerDownload(bufferOrUri, s.name);
                }
            }
            else {
                let defaultUri = s.isDirectory ? fileDialogService.defaultFolderPath(network_1.Schemas.file) : fileDialogService.defaultFilePath(network_1.Schemas.file);
                if (defaultUri) {
                    defaultUri = resources.joinPath(defaultUri, s.name);
                }
                const destination = await fileDialogService.showSaveDialog({
                    availableFileSystems: [network_1.Schemas.file],
                    saveLabel: labels_1.mnemonicButtonLabel(nls.localize('download', "Download")),
                    title: s.isDirectory ? nls.localize('downloadFolder', "Download Folder") : nls.localize('downloadFile', "Download File"),
                    defaultUri
                });
                if (destination) {
                    await workingCopyFileService.copy(s.resource, destination, true);
                }
                else {
                    // User canceled a download. In case there were multiple files selected we should cancel the remainder of the prompts #86100
                    canceled = true;
                }
            }
        }));
    };
    commands_1.CommandsRegistry.registerCommand({
        id: exports.DOWNLOAD_COMMAND_ID,
        handler: downloadFileHandler
    });
    exports.pasteFileHandler = async (accessor) => {
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const fileService = accessor.get(files_2.IFileService);
        const workingCopyFileService = accessor.get(workingCopyFileService_1.IWorkingCopyFileService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const context = explorerService.getContext(true);
        const toPaste = resources.distinctParents(await clipboardService.readResources(), r => r);
        const element = context.length ? context[0] : explorerService.roots[0];
        // Check if target is ancestor of pasted folder
        const stats = await Promise.all(toPaste.map(async (fileToPaste) => {
            if (element.resource.toString() !== fileToPaste.toString() && resources.isEqualOrParent(element.resource, fileToPaste)) {
                throw new Error(nls.localize('fileIsAncestor', "File to paste is an ancestor of the destination folder"));
            }
            try {
                const fileToPasteStat = await fileService.resolve(fileToPaste);
                // Find target
                let target;
                if (element.resource.toString() === fileToPaste.toString()) {
                    target = element.parent;
                }
                else {
                    target = element.isDirectory ? element : element.parent;
                }
                const incrementalNaming = configurationService.getValue().explorer.incrementalNaming;
                const targetFile = findValidPasteFileTarget(explorerService, target, { resource: fileToPaste, isDirectory: fileToPasteStat.isDirectory, allowOverwrite: pasteShouldMove }, incrementalNaming);
                // Move/Copy File
                if (pasteShouldMove) {
                    return await workingCopyFileService.move(fileToPaste, targetFile);
                }
                else {
                    return await workingCopyFileService.copy(fileToPaste, targetFile);
                }
            }
            catch (e) {
                onError(notificationService, new Error(nls.localize('fileDeleted', "The file to paste has been deleted or moved since you copied it. {0}", errors_1.getErrorMessage(e))));
                return undefined;
            }
        }));
        if (pasteShouldMove) {
            // Cut is done. Make sure to clear cut state.
            await explorerService.setToCopy([], false);
            pasteShouldMove = false;
        }
        if (stats.length >= 1) {
            const stat = stats[0];
            if (stat && !stat.isDirectory && stats.length === 1) {
                await editorService.openEditor({ resource: stat.resource, options: { pinned: true, preserveFocus: true } });
            }
            if (stat) {
                await explorerService.select(stat.resource);
            }
        }
    };
    exports.openFilePreserveFocusHandler = async (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const explorerService = accessor.get(files_1.IExplorerService);
        const stats = explorerService.getContext(true);
        await editorService.openEditors(stats.filter(s => !s.isDirectory).map(s => ({
            resource: s.resource,
            options: { preserveFocus: true }
        })));
    };
});
//# __sourceMappingURL=fileActions.js.map