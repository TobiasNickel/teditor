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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/workspace/common/workspace", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/search/common/search", "./extHost.protocol"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, map_1, network_1, numbers_1, resources_1, strings_1, types_1, uri_1, nls_1, instantiation_1, log_1, notification_1, workspace_1, extHostInitDataService_1, extHostRpcService_1, extHostTypes_1, search_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostWorkspace = exports.ExtHostWorkspace = void 0;
    function isFolderEqual(folderA, folderB) {
        return resources_1.isEqual(folderA, folderB);
    }
    function compareWorkspaceFolderByUri(a, b) {
        return isFolderEqual(a.uri, b.uri) ? 0 : strings_1.compare(a.uri.toString(), b.uri.toString());
    }
    function compareWorkspaceFolderByUriAndNameAndIndex(a, b) {
        if (a.index !== b.index) {
            return a.index < b.index ? -1 : 1;
        }
        return isFolderEqual(a.uri, b.uri) ? strings_1.compare(a.name, b.name) : strings_1.compare(a.uri.toString(), b.uri.toString());
    }
    function delta(oldFolders, newFolders, compare) {
        const oldSortedFolders = oldFolders.slice(0).sort(compare);
        const newSortedFolders = newFolders.slice(0).sort(compare);
        return arrays_1.delta(oldSortedFolders, newSortedFolders, compare);
    }
    class ExtHostWorkspaceImpl extends workspace_1.Workspace {
        constructor(id, _name, folders, configuration, _isUntitled) {
            super(id, folders.map(f => new workspace_1.WorkspaceFolder(f)), configuration);
            this._name = _name;
            this._isUntitled = _isUntitled;
            this._workspaceFolders = [];
            this._structure = map_1.TernarySearchTree.forUris();
            // setup the workspace folder data structure
            folders.forEach(folder => {
                this._workspaceFolders.push(folder);
                this._structure.set(folder.uri, folder);
            });
        }
        static toExtHostWorkspace(data, previousConfirmedWorkspace, previousUnconfirmedWorkspace) {
            if (!data) {
                return { workspace: null, added: [], removed: [] };
            }
            const { id, name, folders, configuration, isUntitled } = data;
            const newWorkspaceFolders = [];
            // If we have an existing workspace, we try to find the folders that match our
            // data and update their properties. It could be that an extension stored them
            // for later use and we want to keep them "live" if they are still present.
            const oldWorkspace = previousConfirmedWorkspace;
            if (previousConfirmedWorkspace) {
                folders.forEach((folderData, index) => {
                    const folderUri = uri_1.URI.revive(folderData.uri);
                    const existingFolder = ExtHostWorkspaceImpl._findFolder(previousUnconfirmedWorkspace || previousConfirmedWorkspace, folderUri);
                    if (existingFolder) {
                        existingFolder.name = folderData.name;
                        existingFolder.index = folderData.index;
                        newWorkspaceFolders.push(existingFolder);
                    }
                    else {
                        newWorkspaceFolders.push({ uri: folderUri, name: folderData.name, index });
                    }
                });
            }
            else {
                newWorkspaceFolders.push(...folders.map(({ uri, name, index }) => ({ uri: uri_1.URI.revive(uri), name, index })));
            }
            // make sure to restore sort order based on index
            newWorkspaceFolders.sort((f1, f2) => f1.index < f2.index ? -1 : 1);
            const workspace = new ExtHostWorkspaceImpl(id, name, newWorkspaceFolders, configuration ? uri_1.URI.revive(configuration) : null, !!isUntitled);
            const { added, removed } = delta(oldWorkspace ? oldWorkspace.workspaceFolders : [], workspace.workspaceFolders, compareWorkspaceFolderByUri);
            return { workspace, added, removed };
        }
        static _findFolder(workspace, folderUriToFind) {
            for (let i = 0; i < workspace.folders.length; i++) {
                const folder = workspace.workspaceFolders[i];
                if (isFolderEqual(folder.uri, folderUriToFind)) {
                    return folder;
                }
            }
            return undefined;
        }
        get name() {
            return this._name;
        }
        get isUntitled() {
            return this._isUntitled;
        }
        get workspaceFolders() {
            return this._workspaceFolders.slice(0);
        }
        getWorkspaceFolder(uri, resolveParent) {
            if (resolveParent && this._structure.get(uri)) {
                // `uri` is a workspace folder so we check for its parent
                uri = resources_1.dirname(uri);
            }
            return this._structure.findSubstr(uri);
        }
        resolveWorkspaceFolder(uri) {
            return this._structure.get(uri);
        }
    }
    let ExtHostWorkspace = class ExtHostWorkspace {
        constructor(extHostRpc, initData, logService) {
            this._onDidChangeWorkspace = new event_1.Emitter();
            this.onDidChangeWorkspace = this._onDidChangeWorkspace.event;
            this._activeSearchCallbacks = [];
            this._logService = logService;
            this._requestIdProvider = new numbers_1.Counter();
            this._barrier = new async_1.Barrier();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadWorkspace);
            this._messageService = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadMessageService);
            const data = initData.workspace;
            this._confirmedWorkspace = data ? new ExtHostWorkspaceImpl(data.id, data.name, [], data.configuration ? uri_1.URI.revive(data.configuration) : null, !!data.isUntitled) : undefined;
        }
        $initializeWorkspace(data) {
            this.$acceptWorkspaceData(data);
            this._barrier.open();
        }
        waitForInitializeCall() {
            return this._barrier.wait();
        }
        // --- workspace ---
        get workspace() {
            return this._actualWorkspace;
        }
        get name() {
            return this._actualWorkspace ? this._actualWorkspace.name : undefined;
        }
        get workspaceFile() {
            if (this._actualWorkspace) {
                if (this._actualWorkspace.configuration) {
                    if (this._actualWorkspace.isUntitled) {
                        return uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: resources_1.basename(resources_1.dirname(this._actualWorkspace.configuration)) }); // Untitled Worspace: return untitled URI
                    }
                    return this._actualWorkspace.configuration; // Workspace: return the configuration location
                }
            }
            return undefined;
        }
        get _actualWorkspace() {
            return this._unconfirmedWorkspace || this._confirmedWorkspace;
        }
        getWorkspaceFolders() {
            if (!this._actualWorkspace) {
                return undefined;
            }
            return this._actualWorkspace.workspaceFolders.slice(0);
        }
        async getWorkspaceFolders2() {
            await this._barrier.wait();
            if (!this._actualWorkspace) {
                return undefined;
            }
            return this._actualWorkspace.workspaceFolders.slice(0);
        }
        updateWorkspaceFolders(extension, index, deleteCount, ...workspaceFoldersToAdd) {
            const validatedDistinctWorkspaceFoldersToAdd = [];
            if (Array.isArray(workspaceFoldersToAdd)) {
                workspaceFoldersToAdd.forEach(folderToAdd => {
                    if (uri_1.URI.isUri(folderToAdd.uri) && !validatedDistinctWorkspaceFoldersToAdd.some(f => isFolderEqual(f.uri, folderToAdd.uri))) {
                        validatedDistinctWorkspaceFoldersToAdd.push({ uri: folderToAdd.uri, name: folderToAdd.name || resources_1.basenameOrAuthority(folderToAdd.uri) });
                    }
                });
            }
            if (!!this._unconfirmedWorkspace) {
                return false; // prevent accumulated calls without a confirmed workspace
            }
            if ([index, deleteCount].some(i => typeof i !== 'number' || i < 0)) {
                return false; // validate numbers
            }
            if (deleteCount === 0 && validatedDistinctWorkspaceFoldersToAdd.length === 0) {
                return false; // nothing to delete or add
            }
            const currentWorkspaceFolders = this._actualWorkspace ? this._actualWorkspace.workspaceFolders : [];
            if (index + deleteCount > currentWorkspaceFolders.length) {
                return false; // cannot delete more than we have
            }
            // Simulate the updateWorkspaceFolders method on our data to do more validation
            const newWorkspaceFolders = currentWorkspaceFolders.slice(0);
            newWorkspaceFolders.splice(index, deleteCount, ...validatedDistinctWorkspaceFoldersToAdd.map(f => ({ uri: f.uri, name: f.name || resources_1.basenameOrAuthority(f.uri), index: undefined /* fixed later */ })));
            for (let i = 0; i < newWorkspaceFolders.length; i++) {
                const folder = newWorkspaceFolders[i];
                if (newWorkspaceFolders.some((otherFolder, index) => index !== i && isFolderEqual(folder.uri, otherFolder.uri))) {
                    return false; // cannot add the same folder multiple times
                }
            }
            newWorkspaceFolders.forEach((f, index) => f.index = index); // fix index
            const { added, removed } = delta(currentWorkspaceFolders, newWorkspaceFolders, compareWorkspaceFolderByUriAndNameAndIndex);
            if (added.length === 0 && removed.length === 0) {
                return false; // nothing actually changed
            }
            // Trigger on main side
            if (this._proxy) {
                const extName = extension.displayName || extension.name;
                this._proxy.$updateWorkspaceFolders(extName, index, deleteCount, validatedDistinctWorkspaceFoldersToAdd).then(undefined, error => {
                    // in case of an error, make sure to clear out the unconfirmed workspace
                    // because we cannot expect the acknowledgement from the main side for this
                    this._unconfirmedWorkspace = undefined;
                    // show error to user
                    this._messageService.$showMessage(notification_1.Severity.Error, nls_1.localize('updateerror', "Extension '{0}' failed to update workspace folders: {1}", extName, error.toString()), { extension }, []);
                });
            }
            // Try to accept directly
            this.trySetWorkspaceFolders(newWorkspaceFolders);
            return true;
        }
        getWorkspaceFolder(uri, resolveParent) {
            if (!this._actualWorkspace) {
                return undefined;
            }
            return this._actualWorkspace.getWorkspaceFolder(uri, resolveParent);
        }
        async getWorkspaceFolder2(uri, resolveParent) {
            await this._barrier.wait();
            if (!this._actualWorkspace) {
                return undefined;
            }
            return this._actualWorkspace.getWorkspaceFolder(uri, resolveParent);
        }
        async resolveWorkspaceFolder(uri) {
            await this._barrier.wait();
            if (!this._actualWorkspace) {
                return undefined;
            }
            return this._actualWorkspace.resolveWorkspaceFolder(uri);
        }
        getPath() {
            // this is legacy from the days before having
            // multi-root and we keep it only alive if there
            // is just one workspace folder.
            if (!this._actualWorkspace) {
                return undefined;
            }
            const { folders } = this._actualWorkspace;
            if (folders.length === 0) {
                return undefined;
            }
            // #54483 @Joh Why are we still using fsPath?
            return folders[0].uri.fsPath;
        }
        getRelativePath(pathOrUri, includeWorkspace) {
            let resource;
            let path = '';
            if (typeof pathOrUri === 'string') {
                resource = uri_1.URI.file(pathOrUri);
                path = pathOrUri;
            }
            else if (typeof pathOrUri !== 'undefined') {
                resource = pathOrUri;
                path = pathOrUri.fsPath;
            }
            if (!resource) {
                return path;
            }
            const folder = this.getWorkspaceFolder(resource, true);
            if (!folder) {
                return path;
            }
            if (typeof includeWorkspace === 'undefined' && this._actualWorkspace) {
                includeWorkspace = this._actualWorkspace.folders.length > 1;
            }
            let result = resources_1.relativePath(folder.uri, resource);
            if (includeWorkspace && folder.name) {
                result = `${folder.name}/${result}`;
            }
            return result;
        }
        trySetWorkspaceFolders(folders) {
            // Update directly here. The workspace is unconfirmed as long as we did not get an
            // acknowledgement from the main side (via $acceptWorkspaceData)
            if (this._actualWorkspace) {
                this._unconfirmedWorkspace = ExtHostWorkspaceImpl.toExtHostWorkspace({
                    id: this._actualWorkspace.id,
                    name: this._actualWorkspace.name,
                    configuration: this._actualWorkspace.configuration,
                    folders,
                    isUntitled: this._actualWorkspace.isUntitled
                }, this._actualWorkspace).workspace || undefined;
            }
        }
        $acceptWorkspaceData(data) {
            const { workspace, added, removed } = ExtHostWorkspaceImpl.toExtHostWorkspace(data, this._confirmedWorkspace, this._unconfirmedWorkspace);
            // Update our workspace object. We have a confirmed workspace, so we drop our
            // unconfirmed workspace.
            this._confirmedWorkspace = workspace || undefined;
            this._unconfirmedWorkspace = undefined;
            // Events
            this._onDidChangeWorkspace.fire(Object.freeze({
                added,
                removed,
            }));
        }
        // --- search ---
        /**
         * Note, null/undefined have different and important meanings for "exclude"
         */
        findFiles(include, exclude, maxResults, extensionId, token = cancellation_1.CancellationToken.None) {
            this._logService.trace(`extHostWorkspace#findFiles: fileSearch, extension: ${extensionId.value}, entryPoint: findFiles`);
            let excludePatternOrDisregardExcludes = undefined;
            if (exclude === null) {
                excludePatternOrDisregardExcludes = false;
            }
            else if (exclude) {
                if (typeof exclude === 'string') {
                    excludePatternOrDisregardExcludes = exclude;
                }
                else {
                    excludePatternOrDisregardExcludes = exclude.pattern;
                }
            }
            if (token && token.isCancellationRequested) {
                return Promise.resolve([]);
            }
            const { includePattern, folder } = parseSearchInclude(include);
            return this._proxy.$startFileSearch(types_1.withUndefinedAsNull(includePattern), types_1.withUndefinedAsNull(folder), types_1.withUndefinedAsNull(excludePatternOrDisregardExcludes), types_1.withUndefinedAsNull(maxResults), token)
                .then(data => Array.isArray(data) ? data.map(d => uri_1.URI.revive(d)) : []);
        }
        async findTextInFiles(query, options, callback, extensionId, token = cancellation_1.CancellationToken.None) {
            this._logService.trace(`extHostWorkspace#findTextInFiles: textSearch, extension: ${extensionId.value}, entryPoint: findTextInFiles`);
            const requestId = this._requestIdProvider.getNext();
            const previewOptions = typeof options.previewOptions === 'undefined' ?
                {
                    matchLines: 100,
                    charsPerLine: 10000
                } :
                options.previewOptions;
            let includePattern;
            let folder;
            if (options.include) {
                if (typeof options.include === 'string') {
                    includePattern = options.include;
                }
                else {
                    includePattern = options.include.pattern;
                    folder = options.include.baseFolder || uri_1.URI.file(options.include.base);
                }
            }
            const excludePattern = (typeof options.exclude === 'string') ? options.exclude :
                options.exclude ? options.exclude.pattern : undefined;
            const queryOptions = {
                ignoreSymlinks: typeof options.followSymlinks === 'boolean' ? !options.followSymlinks : undefined,
                disregardIgnoreFiles: typeof options.useIgnoreFiles === 'boolean' ? !options.useIgnoreFiles : undefined,
                disregardGlobalIgnoreFiles: typeof options.useGlobalIgnoreFiles === 'boolean' ? !options.useGlobalIgnoreFiles : undefined,
                disregardExcludeSettings: typeof options.useDefaultExcludes === 'boolean' ? !options.useDefaultExcludes : true,
                fileEncoding: options.encoding,
                maxResults: options.maxResults,
                previewOptions,
                afterContext: options.afterContext,
                beforeContext: options.beforeContext,
                includePattern: includePattern,
                excludePattern: excludePattern
            };
            const isCanceled = false;
            this._activeSearchCallbacks[requestId] = p => {
                if (isCanceled) {
                    return;
                }
                const uri = uri_1.URI.revive(p.resource);
                p.results.forEach(result => {
                    if (search_1.resultIsMatch(result)) {
                        callback({
                            uri,
                            preview: {
                                text: result.preview.text,
                                matches: arrays_1.mapArrayOrNot(result.preview.matches, m => new extHostTypes_1.Range(m.startLineNumber, m.startColumn, m.endLineNumber, m.endColumn))
                            },
                            ranges: arrays_1.mapArrayOrNot(result.ranges, r => new extHostTypes_1.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn))
                        });
                    }
                    else {
                        callback({
                            uri,
                            text: result.text,
                            lineNumber: result.lineNumber
                        });
                    }
                });
            };
            if (token.isCancellationRequested) {
                return {};
            }
            try {
                const result = await this._proxy.$startTextSearch(query, types_1.withUndefinedAsNull(folder), queryOptions, requestId, token);
                delete this._activeSearchCallbacks[requestId];
                return result || {};
            }
            catch (err) {
                delete this._activeSearchCallbacks[requestId];
                throw err;
            }
        }
        $handleTextSearchResult(result, requestId) {
            if (this._activeSearchCallbacks[requestId]) {
                this._activeSearchCallbacks[requestId](result);
            }
        }
        saveAll(includeUntitled) {
            return this._proxy.$saveAll(includeUntitled);
        }
        resolveProxy(url) {
            return this._proxy.$resolveProxy(url);
        }
    };
    ExtHostWorkspace = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, log_1.ILogService)
    ], ExtHostWorkspace);
    exports.ExtHostWorkspace = ExtHostWorkspace;
    exports.IExtHostWorkspace = instantiation_1.createDecorator('IExtHostWorkspace');
    function parseSearchInclude(include) {
        let includePattern;
        let includeFolder;
        if (include) {
            if (typeof include === 'string') {
                includePattern = include;
            }
            else {
                includePattern = include.pattern;
                // include.base must be an absolute path
                includeFolder = include.baseFolder || uri_1.URI.file(include.base);
            }
        }
        return {
            includePattern: includePattern,
            folder: includeFolder
        };
    }
});
//# __sourceMappingURL=extHostWorkspace.js.map