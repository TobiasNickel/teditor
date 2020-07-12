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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/nls", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/workbench/services/search/common/search", "vs/platform/workspace/common/workspace", "vs/workbench/api/common/extHostCustomers", "vs/workbench/contrib/search/common/queryBuilder", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/workspaces/common/workspaceEditing", "../common/extHost.protocol", "vs/platform/environment/common/environment", "vs/platform/workspaces/common/workspaces", "vs/platform/notification/common/notification", "vs/base/common/types", "vs/platform/files/common/files", "vs/platform/request/common/request"], function (require, exports, errors_1, lifecycle_1, uri_1, nls_1, platform_1, instantiation_1, label_1, search_1, workspace_1, extHostCustomers_1, queryBuilder_1, editorService_1, workspaceEditing_1, extHost_protocol_1, environment_1, workspaces_1, notification_1, types_1, files_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWorkspace = void 0;
    let MainThreadWorkspace = class MainThreadWorkspace {
        constructor(extHostContext, _searchService, _contextService, _editorService, _workspaceEditingService, _notificationService, _requestService, _instantiationService, _labelService, _environmentService, fileService) {
            this._searchService = _searchService;
            this._contextService = _contextService;
            this._editorService = _editorService;
            this._workspaceEditingService = _workspaceEditingService;
            this._notificationService = _notificationService;
            this._requestService = _requestService;
            this._instantiationService = _instantiationService;
            this._labelService = _labelService;
            this._environmentService = _environmentService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._activeCancelTokens = Object.create(null);
            this._queryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWorkspace);
            const workspace = this._contextService.getWorkspace();
            // The workspace file is provided be a unknown file system provider. It might come
            // from the extension host. So initialize now knowing that `rootPath` is undefined.
            if (workspace.configuration && !platform_1.isNative && !fileService.canHandleResource(workspace.configuration)) {
                this._proxy.$initializeWorkspace(this.getWorkspaceData(workspace));
            }
            else {
                this._contextService.getCompleteWorkspace().then(workspace => this._proxy.$initializeWorkspace(this.getWorkspaceData(workspace)));
            }
            this._contextService.onDidChangeWorkspaceFolders(this._onDidChangeWorkspace, this, this._toDispose);
            this._contextService.onDidChangeWorkbenchState(this._onDidChangeWorkspace, this, this._toDispose);
        }
        dispose() {
            this._toDispose.dispose();
            for (let requestId in this._activeCancelTokens) {
                const tokenSource = this._activeCancelTokens[requestId];
                tokenSource.cancel();
            }
        }
        // --- workspace ---
        $updateWorkspaceFolders(extensionName, index, deleteCount, foldersToAdd) {
            const workspaceFoldersToAdd = foldersToAdd.map(f => ({ uri: uri_1.URI.revive(f.uri), name: f.name }));
            // Indicate in status message
            this._notificationService.status(this.getStatusMessage(extensionName, workspaceFoldersToAdd.length, deleteCount), { hideAfter: 10 * 1000 /* 10s */ });
            return this._workspaceEditingService.updateFolders(index, deleteCount, workspaceFoldersToAdd, true);
        }
        getStatusMessage(extensionName, addCount, removeCount) {
            let message;
            const wantsToAdd = addCount > 0;
            const wantsToDelete = removeCount > 0;
            // Add Folders
            if (wantsToAdd && !wantsToDelete) {
                if (addCount === 1) {
                    message = nls_1.localize('folderStatusMessageAddSingleFolder', "Extension '{0}' added 1 folder to the workspace", extensionName);
                }
                else {
                    message = nls_1.localize('folderStatusMessageAddMultipleFolders', "Extension '{0}' added {1} folders to the workspace", extensionName, addCount);
                }
            }
            // Delete Folders
            else if (wantsToDelete && !wantsToAdd) {
                if (removeCount === 1) {
                    message = nls_1.localize('folderStatusMessageRemoveSingleFolder', "Extension '{0}' removed 1 folder from the workspace", extensionName);
                }
                else {
                    message = nls_1.localize('folderStatusMessageRemoveMultipleFolders', "Extension '{0}' removed {1} folders from the workspace", extensionName, removeCount);
                }
            }
            // Change Folders
            else {
                message = nls_1.localize('folderStatusChangeFolder', "Extension '{0}' changed folders of the workspace", extensionName);
            }
            return message;
        }
        _onDidChangeWorkspace() {
            this._proxy.$acceptWorkspaceData(this.getWorkspaceData(this._contextService.getWorkspace()));
        }
        getWorkspaceData(workspace) {
            if (this._contextService.getWorkbenchState() === 1 /* EMPTY */) {
                return null;
            }
            return {
                configuration: workspace.configuration || undefined,
                isUntitled: workspace.configuration ? workspaces_1.isUntitledWorkspace(workspace.configuration, this._environmentService) : false,
                folders: workspace.folders,
                id: workspace.id,
                name: this._labelService.getWorkspaceLabel(workspace)
            };
        }
        // --- search ---
        $startFileSearch(includePattern, _includeFolder, excludePatternOrDisregardExcludes, maxResults, token) {
            const includeFolder = uri_1.URI.revive(_includeFolder);
            const workspace = this._contextService.getWorkspace();
            if (!workspace.folders.length) {
                return Promise.resolve(null);
            }
            const query = this._queryBuilder.file(includeFolder ? [workspace_1.toWorkspaceFolder(includeFolder)] : workspace.folders, {
                maxResults: types_1.withNullAsUndefined(maxResults),
                disregardExcludeSettings: (excludePatternOrDisregardExcludes === false) || undefined,
                disregardSearchExcludeSettings: true,
                disregardIgnoreFiles: true,
                includePattern: types_1.withNullAsUndefined(includePattern),
                excludePattern: typeof excludePatternOrDisregardExcludes === 'string' ? excludePatternOrDisregardExcludes : undefined,
                _reason: 'startFileSearch'
            });
            return this._searchService.fileSearch(query, token).then(result => {
                return result.results.map(m => m.resource);
            }, err => {
                if (!errors_1.isPromiseCanceledError(err)) {
                    return Promise.reject(err);
                }
                return null;
            });
        }
        $startTextSearch(pattern, _folder, options, requestId, token) {
            const folder = uri_1.URI.revive(_folder);
            const workspace = this._contextService.getWorkspace();
            const folders = folder ? [folder] : workspace.folders.map(folder => folder.uri);
            const query = this._queryBuilder.text(pattern, folders, options);
            query._reason = 'startTextSearch';
            const onProgress = (p) => {
                if (p.results) {
                    this._proxy.$handleTextSearchResult(p, requestId);
                }
            };
            const search = this._searchService.textSearch(query, token, onProgress).then(result => {
                return { limitHit: result.limitHit };
            }, err => {
                if (!errors_1.isPromiseCanceledError(err)) {
                    return Promise.reject(err);
                }
                return null;
            });
            return search;
        }
        $checkExists(folders, includes, token) {
            const queryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            const query = queryBuilder.file(folders.map(folder => workspace_1.toWorkspaceFolder(uri_1.URI.revive(folder))), {
                _reason: 'checkExists',
                includePattern: includes.join(', '),
                expandPatterns: true,
                exists: true
            });
            return this._searchService.fileSearch(query, token).then(result => {
                return !!result.limitHit;
            }, err => {
                if (!errors_1.isPromiseCanceledError(err)) {
                    return Promise.reject(err);
                }
                return false;
            });
        }
        // --- save & edit resources ---
        $saveAll(includeUntitled) {
            return this._editorService.saveAll({ includeUntitled });
        }
        $resolveProxy(url) {
            return this._requestService.resolveProxy(url);
        }
    };
    MainThreadWorkspace = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadWorkspace),
        __param(1, search_1.ISearchService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, editorService_1.IEditorService),
        __param(4, workspaceEditing_1.IWorkspaceEditingService),
        __param(5, notification_1.INotificationService),
        __param(6, request_1.IRequestService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, label_1.ILabelService),
        __param(9, environment_1.IEnvironmentService),
        __param(10, files_1.IFileService)
    ], MainThreadWorkspace);
    exports.MainThreadWorkspace = MainThreadWorkspace;
});
//# __sourceMappingURL=mainThreadWorkspace.js.map