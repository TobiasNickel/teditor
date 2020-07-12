/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/platform/workspaces/common/workspaces"], function (require, exports, uri_1, resources, instantiation_1, map_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toWorkspaceFolders = exports.toWorkspaceFolder = exports.WorkspaceFolder = exports.Workspace = exports.IWorkspaceFolder = exports.IWorkspace = exports.WorkbenchState = exports.IWorkspaceContextService = void 0;
    exports.IWorkspaceContextService = instantiation_1.createDecorator('contextService');
    var WorkbenchState;
    (function (WorkbenchState) {
        WorkbenchState[WorkbenchState["EMPTY"] = 1] = "EMPTY";
        WorkbenchState[WorkbenchState["FOLDER"] = 2] = "FOLDER";
        WorkbenchState[WorkbenchState["WORKSPACE"] = 3] = "WORKSPACE";
    })(WorkbenchState = exports.WorkbenchState || (exports.WorkbenchState = {}));
    var IWorkspace;
    (function (IWorkspace) {
        function isIWorkspace(thing) {
            return thing && typeof thing === 'object'
                && typeof thing.id === 'string'
                && Array.isArray(thing.folders);
        }
        IWorkspace.isIWorkspace = isIWorkspace;
    })(IWorkspace = exports.IWorkspace || (exports.IWorkspace = {}));
    var IWorkspaceFolder;
    (function (IWorkspaceFolder) {
        function isIWorkspaceFolder(thing) {
            return thing && typeof thing === 'object'
                && uri_1.URI.isUri(thing.uri)
                && typeof thing.name === 'string'
                && typeof thing.toResource === 'function';
        }
        IWorkspaceFolder.isIWorkspaceFolder = isIWorkspaceFolder;
    })(IWorkspaceFolder = exports.IWorkspaceFolder || (exports.IWorkspaceFolder = {}));
    class Workspace {
        constructor(_id, folders = [], _configuration = null) {
            this._id = _id;
            this._configuration = _configuration;
            this._foldersMap = map_1.TernarySearchTree.forUris();
            this.folders = folders;
        }
        update(workspace) {
            this._id = workspace.id;
            this._configuration = workspace.configuration;
            this.folders = workspace.folders;
        }
        get folders() {
            return this._folders;
        }
        set folders(folders) {
            this._folders = folders;
            this.updateFoldersMap();
        }
        get id() {
            return this._id;
        }
        get configuration() {
            return this._configuration;
        }
        set configuration(configuration) {
            this._configuration = configuration;
        }
        getFolder(resource) {
            if (!resource) {
                return null;
            }
            return this._foldersMap.findSubstr(resource.with({
                scheme: resource.scheme,
                authority: resource.authority,
                path: resource.path
            })) || null;
        }
        updateFoldersMap() {
            this._foldersMap = map_1.TernarySearchTree.forUris();
            for (const folder of this.folders) {
                this._foldersMap.set(folder.uri, folder);
            }
        }
        toJSON() {
            return { id: this.id, folders: this.folders, configuration: this.configuration };
        }
    }
    exports.Workspace = Workspace;
    class WorkspaceFolder {
        constructor(data, raw) {
            this.raw = raw;
            this.uri = data.uri;
            this.index = data.index;
            this.name = data.name;
        }
        toResource(relativePath) {
            return resources.joinPath(this.uri, relativePath);
        }
        toJSON() {
            return { uri: this.uri, name: this.name, index: this.index };
        }
    }
    exports.WorkspaceFolder = WorkspaceFolder;
    function toWorkspaceFolder(resource) {
        return new WorkspaceFolder({ uri: resource, index: 0, name: resources.basenameOrAuthority(resource) }, { uri: resource.toString() });
    }
    exports.toWorkspaceFolder = toWorkspaceFolder;
    function toWorkspaceFolders(configuredFolders, workspaceConfigFile) {
        let result = [];
        let seen = new Set();
        const relativeTo = resources.dirname(workspaceConfigFile);
        for (let configuredFolder of configuredFolders) {
            let uri = null;
            if (workspaces_1.isRawFileWorkspaceFolder(configuredFolder)) {
                if (configuredFolder.path) {
                    uri = resources.resolvePath(relativeTo, configuredFolder.path);
                }
            }
            else if (workspaces_1.isRawUriWorkspaceFolder(configuredFolder)) {
                try {
                    uri = uri_1.URI.parse(configuredFolder.uri);
                    // this makes sure all workspace folder are absolute
                    if (uri.path[0] !== '/') {
                        uri = uri.with({ path: '/' + uri.path });
                    }
                }
                catch (e) {
                    console.warn(e);
                    // ignore
                }
            }
            if (uri) {
                // remove duplicates
                let comparisonKey = resources.getComparisonKey(uri);
                if (!seen.has(comparisonKey)) {
                    seen.add(comparisonKey);
                    const name = configuredFolder.name || resources.basenameOrAuthority(uri);
                    result.push(new WorkspaceFolder({ uri, name, index: result.length }, configuredFolder));
                }
            }
        }
        return result;
    }
    exports.toWorkspaceFolders = toWorkspaceFolders;
});
//# __sourceMappingURL=workspace.js.map