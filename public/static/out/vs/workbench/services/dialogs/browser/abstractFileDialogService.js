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
define(["require", "exports", "vs/nls", "vs/platform/windows/common/windows", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/dialogs/browser/simpleFileDialog", "vs/platform/workspaces/common/workspaces", "vs/platform/remote/common/remoteHosts", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/workbench/services/host/browser/host", "vs/base/common/severity", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/services/modeService", "vs/platform/label/common/label", "vs/base/common/platform"], function (require, exports, nls, windows_1, dialogs_1, workspace_1, history_1, environmentService_1, network_1, resources, instantiation_1, simpleFileDialog_1, workspaces_1, remoteHosts_1, configuration_1, files_1, opener_1, host_1, severity_1, arrays_1, strings_1, modeService_1, label_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractFileDialogService = void 0;
    let AbstractFileDialogService = class AbstractFileDialogService {
        constructor(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, dialogService, modeService, workspacesService, labelService) {
            this.hostService = hostService;
            this.contextService = contextService;
            this.historyService = historyService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.openerService = openerService;
            this.dialogService = dialogService;
            this.modeService = modeService;
            this.workspacesService = workspacesService;
            this.labelService = labelService;
        }
        defaultFilePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file first...
            let candidate = this.historyService.getLastActiveFile(schemeFilter);
            // ...then for last active file root
            if (!candidate) {
                candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            }
            else {
                candidate = candidate && resources.dirname(candidate);
            }
            return candidate || undefined;
        }
        defaultFolderPath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file root first...
            let candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            // ...then for last active file
            if (!candidate) {
                candidate = this.historyService.getLastActiveFile(schemeFilter);
            }
            return candidate && resources.dirname(candidate) || undefined;
        }
        defaultWorkspacePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for current workspace config file first...
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const configuration = this.contextService.getWorkspace().configuration;
                if (configuration && !workspaces_1.isUntitledWorkspace(configuration, this.environmentService)) {
                    return resources.dirname(configuration) || undefined;
                }
            }
            // ...then fallback to default file path
            return this.defaultFilePath(schemeFilter);
        }
        async showSaveConfirm(fileNamesOrResources) {
            if (this.environmentService.isExtensionDevelopment && this.environmentService.extensionTestsLocationURI) {
                return 1 /* DONT_SAVE */; // no veto when we are in extension dev testing mode because we cannot assume we run interactive
            }
            return this.doShowSaveConfirm(fileNamesOrResources);
        }
        async doShowSaveConfirm(fileNamesOrResources) {
            if (fileNamesOrResources.length === 0) {
                return 1 /* DONT_SAVE */;
            }
            let message;
            let detail = nls.localize('saveChangesDetail', "Your changes will be lost if you don't save them.");
            if (fileNamesOrResources.length === 1) {
                message = nls.localize('saveChangesMessage', "Do you want to save the changes you made to {0}?", typeof fileNamesOrResources[0] === 'string' ? fileNamesOrResources[0] : resources.basename(fileNamesOrResources[0]));
            }
            else {
                message = nls.localize('saveChangesMessages', "Do you want to save the changes to the following {0} files?", fileNamesOrResources.length);
                detail = dialogs_1.getFileNamesMessage(fileNamesOrResources) + '\n' + detail;
            }
            const buttons = [
                fileNamesOrResources.length > 1 ? nls.localize({ key: 'saveAll', comment: ['&& denotes a mnemonic'] }, "&&Save All") : nls.localize({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
                nls.localize({ key: 'dontSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                nls.localize('cancel', "Cancel")
            ];
            const { choice } = await this.dialogService.show(severity_1.default.Warning, message, buttons, {
                cancelId: 2,
                detail
            });
            switch (choice) {
                case 0: return 0 /* SAVE */;
                case 1: return 1 /* DONT_SAVE */;
                default: return 2 /* CANCEL */;
            }
        }
        async pickFileFolderAndOpenSimplified(schema, options, preferNewWindow) {
            const title = nls.localize('openFileOrFolder.title', 'Open File Or Folder');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                const stat = await this.fileService.resolve(uri);
                const toOpen = stat.isDirectory ? { folderUri: uri } : { fileUri: uri };
                if (!windows_1.isWorkspaceToOpen(toOpen) && windows_1.isFileToOpen(toOpen)) {
                    // add the picked file into the list of recently opened
                    this.workspacesService.addRecentlyOpened([{ fileUri: toOpen.fileUri, label: this.labelService.getUriLabel(toOpen.fileUri) }]);
                }
                if (stat.isDirectory || options.forceNewWindow || preferNewWindow) {
                    return this.hostService.openWindow([toOpen], { forceNewWindow: options.forceNewWindow });
                }
                else {
                    return this.openerService.open(uri, { fromUserGesture: true });
                }
            }
        }
        async pickFileAndOpenSimplified(schema, options, preferNewWindow) {
            const title = nls.localize('openFile.title', 'Open File');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                // add the picked file into the list of recently opened
                this.workspacesService.addRecentlyOpened([{ fileUri: uri, label: this.labelService.getUriLabel(uri) }]);
                if (options.forceNewWindow || preferNewWindow) {
                    return this.hostService.openWindow([{ fileUri: uri }], { forceNewWindow: options.forceNewWindow });
                }
                else {
                    return this.openerService.open(uri, { fromUserGesture: true });
                }
            }
        }
        async pickFolderAndOpenSimplified(schema, options) {
            const title = nls.localize('openFolder.title', 'Open Folder');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                return this.hostService.openWindow([{ folderUri: uri }], { forceNewWindow: options.forceNewWindow });
            }
        }
        async pickWorkspaceAndOpenSimplified(schema, options) {
            const title = nls.localize('openWorkspace.title', 'Open Workspace');
            const filters = [{ name: nls.localize('filterName.workspace', 'Workspace'), extensions: [workspaces_1.WORKSPACE_EXTENSION] }];
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, filters, availableFileSystems });
            if (uri) {
                return this.hostService.openWindow([{ workspaceUri: uri }], { forceNewWindow: options.forceNewWindow });
            }
        }
        async pickFileToSaveSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            options.title = nls.localize('saveFileAs.title', 'Save As');
            return this.saveRemoteResource(options);
        }
        async showSaveDialogSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            return this.saveRemoteResource(options);
        }
        async showOpenDialogSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            const uri = await this.pickResource(options);
            return uri ? [uri] : undefined;
        }
        pickResource(options) {
            const simpleFileDialog = this.createSimpleFileDialog();
            return simpleFileDialog.showOpenDialog(options);
        }
        saveRemoteResource(options) {
            const remoteFileDialog = this.createSimpleFileDialog();
            return remoteFileDialog.showSaveDialog(options);
        }
        createSimpleFileDialog() {
            return this.instantiationService.createInstance(simpleFileDialog_1.SimpleFileDialog);
        }
        getSchemeFilterForWindow() {
            return !this.environmentService.configuration.remoteAuthority ? network_1.Schemas.file : remoteHosts_1.REMOTE_HOST_SCHEME;
        }
        getFileSystemSchema(options) {
            return options.availableFileSystems && options.availableFileSystems[0] || this.getSchemeFilterForWindow();
        }
        getPickFileToSaveDialogOptions(defaultUri, availableFileSystems) {
            const options = {
                defaultUri,
                title: nls.localize('saveAsTitle', "Save As"),
                availableFileSystems
            };
            // Build the file filter by using our known languages
            const ext = defaultUri ? resources.extname(defaultUri) : undefined;
            let matchingFilter;
            const filters = arrays_1.coalesce(this.modeService.getRegisteredLanguageNames().map(languageName => {
                const extensions = this.modeService.getExtensions(languageName);
                if (!extensions || !extensions.length) {
                    return null;
                }
                const filter = { name: languageName, extensions: extensions.slice(0, 10).map(e => strings_1.trim(e, '.')) };
                if (ext && extensions.indexOf(ext) >= 0) {
                    matchingFilter = filter;
                    return null; // matching filter will be added last to the top
                }
                return filter;
            }));
            // We have no matching filter, e.g. because the language
            // is unknown. We still add the extension to the list of
            // filters though so that it can be picked
            // (https://github.com/microsoft/vscode/issues/96283) but
            // only on Windows where this is an issue. Adding this to
            // macOS would result in the following bugs:
            // https://github.com/microsoft/vscode/issues/100614 and
            // https://github.com/microsoft/vscode/issues/100241
            if (platform_1.isWindows && !matchingFilter && ext) {
                matchingFilter = { name: strings_1.trim(ext, '.').toUpperCase(), extensions: [strings_1.trim(ext, '.')] };
            }
            // Order of filters is
            // - File Extension Match
            // - All Files
            // - All Languages
            // - No Extension
            options.filters = arrays_1.coalesce([
                matchingFilter,
                { name: nls.localize('allFiles', "All Files"), extensions: ['*'] },
                ...filters,
                { name: nls.localize('noExt', "No Extension"), extensions: [''] }
            ]);
            return options;
        }
    };
    AbstractFileDialogService = __decorate([
        __param(0, host_1.IHostService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_1.IFileService),
        __param(7, opener_1.IOpenerService),
        __param(8, dialogs_1.IDialogService),
        __param(9, modeService_1.IModeService),
        __param(10, workspaces_1.IWorkspacesService),
        __param(11, label_1.ILabelService)
    ], AbstractFileDialogService);
    exports.AbstractFileDialogService = AbstractFileDialogService;
});
//# __sourceMappingURL=abstractFileDialogService.js.map