/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/common/uri", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/jsonEdit", "vs/base/common/json", "vs/base/common/network", "vs/base/common/labels", "vs/base/common/extpath", "vs/platform/remote/common/remoteHosts"], function (require, exports, instantiation_1, nls_1, uri_1, platform_1, path_1, resources_1, jsonEdit, json, network_1, labels_1, extpath_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toStoreData = exports.restoreRecentlyOpened = exports.useSlashForPath = exports.rewriteWorkspaceFileForNewLocation = exports.getStoredWorkspaceFolder = exports.hasWorkspaceFileExtension = exports.isSingleFolderWorkspaceInitializationPayload = exports.isUntitledWorkspace = exports.toWorkspaceIdentifier = exports.isWorkspaceIdentifier = exports.isSingleFolderWorkspaceIdentifier = exports.isRawUriWorkspaceFolder = exports.isRawFileWorkspaceFolder = exports.isStoredWorkspaceFolder = exports.reviveWorkspaceIdentifier = exports.isRecentFile = exports.isRecentFolder = exports.isRecentWorkspace = exports.IWorkspacesService = exports.UNTITLED_WORKSPACE_NAME = exports.WORKSPACE_FILTER = exports.WORKSPACE_EXTENSION = void 0;
    exports.WORKSPACE_EXTENSION = 'code-workspace';
    exports.WORKSPACE_FILTER = [{ name: nls_1.localize('codeWorkspace', "Code Workspace"), extensions: [exports.WORKSPACE_EXTENSION] }];
    exports.UNTITLED_WORKSPACE_NAME = 'workspace.json';
    exports.IWorkspacesService = instantiation_1.createDecorator('workspacesService');
    function isRecentWorkspace(curr) {
        return curr.hasOwnProperty('workspace');
    }
    exports.isRecentWorkspace = isRecentWorkspace;
    function isRecentFolder(curr) {
        return curr.hasOwnProperty('folderUri');
    }
    exports.isRecentFolder = isRecentFolder;
    function isRecentFile(curr) {
        return curr.hasOwnProperty('fileUri');
    }
    exports.isRecentFile = isRecentFile;
    function reviveWorkspaceIdentifier(workspace) {
        return { id: workspace.id, configPath: uri_1.URI.revive(workspace.configPath) };
    }
    exports.reviveWorkspaceIdentifier = reviveWorkspaceIdentifier;
    function isStoredWorkspaceFolder(thing) {
        return isRawFileWorkspaceFolder(thing) || isRawUriWorkspaceFolder(thing);
    }
    exports.isStoredWorkspaceFolder = isStoredWorkspaceFolder;
    function isRawFileWorkspaceFolder(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.path === 'string'
            && (!thing.name || typeof thing.name === 'string');
    }
    exports.isRawFileWorkspaceFolder = isRawFileWorkspaceFolder;
    function isRawUriWorkspaceFolder(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.uri === 'string'
            && (!thing.name || typeof thing.name === 'string');
    }
    exports.isRawUriWorkspaceFolder = isRawUriWorkspaceFolder;
    function isSingleFolderWorkspaceIdentifier(obj) {
        return obj instanceof uri_1.URI;
    }
    exports.isSingleFolderWorkspaceIdentifier = isSingleFolderWorkspaceIdentifier;
    function isWorkspaceIdentifier(obj) {
        const workspaceIdentifier = obj;
        return workspaceIdentifier && typeof workspaceIdentifier.id === 'string' && workspaceIdentifier.configPath instanceof uri_1.URI;
    }
    exports.isWorkspaceIdentifier = isWorkspaceIdentifier;
    function toWorkspaceIdentifier(workspace) {
        if (workspace.configuration) {
            return {
                configPath: workspace.configuration,
                id: workspace.id
            };
        }
        if (workspace.folders.length === 1) {
            return workspace.folders[0].uri;
        }
        // Empty workspace
        return undefined;
    }
    exports.toWorkspaceIdentifier = toWorkspaceIdentifier;
    function isUntitledWorkspace(path, environmentService) {
        return resources_1.isEqualOrParent(path, environmentService.untitledWorkspacesHome);
    }
    exports.isUntitledWorkspace = isUntitledWorkspace;
    function isSingleFolderWorkspaceInitializationPayload(obj) {
        return isSingleFolderWorkspaceIdentifier(obj.folder);
    }
    exports.isSingleFolderWorkspaceInitializationPayload = isSingleFolderWorkspaceInitializationPayload;
    const WORKSPACE_SUFFIX = '.' + exports.WORKSPACE_EXTENSION;
    function hasWorkspaceFileExtension(path) {
        const ext = (typeof path === 'string') ? path_1.extname(path) : resources_1.extname(path);
        return ext === WORKSPACE_SUFFIX;
    }
    exports.hasWorkspaceFileExtension = hasWorkspaceFileExtension;
    const SLASH = '/';
    /**
     * Given a folder URI and the workspace config folder, computes the IStoredWorkspaceFolder using
    * a relative or absolute path or a uri.
     * Undefined is returned if the folderURI and the targetConfigFolderURI don't have the same schema or authority
     *
     * @param folderURI a workspace folder
     * @param forceAbsolute if set, keep the path absolute
     * @param folderName a workspace name
     * @param targetConfigFolderURI the folder where the workspace is living in
     * @param useSlashForPath if set, use forward slashes for file paths on windows
     */
    function getStoredWorkspaceFolder(folderURI, forceAbsolute, folderName, targetConfigFolderURI, useSlashForPath = !platform_1.isWindows) {
        if (folderURI.scheme !== targetConfigFolderURI.scheme) {
            return { name: folderName, uri: folderURI.toString(true) };
        }
        let folderPath = !forceAbsolute ? resources_1.relativePath(targetConfigFolderURI, folderURI) : undefined;
        if (folderPath !== undefined) {
            if (folderPath.length === 0) {
                folderPath = '.';
            }
            else if (platform_1.isWindows && folderURI.scheme === network_1.Schemas.file && !useSlashForPath) {
                // Windows gets special treatment:
                // - use backslahes unless slash is used by other existing folders
                folderPath = folderPath.replace(/\//g, '\\');
            }
        }
        else {
            // use absolute path
            if (folderURI.scheme === network_1.Schemas.file) {
                folderPath = folderURI.fsPath;
                if (platform_1.isWindows) {
                    // Windows gets special treatment:
                    // - normalize all paths to get nice casing of drive letters
                    // - use backslahes unless slash is used by other existing folders
                    folderPath = labels_1.normalizeDriveLetter(folderPath);
                    if (useSlashForPath) {
                        folderPath = extpath_1.toSlashes(folderPath);
                    }
                }
            }
            else {
                if (!resources_1.isEqualAuthority(folderURI.authority, targetConfigFolderURI.authority)) {
                    return { name: folderName, uri: folderURI.toString(true) };
                }
                folderPath = folderURI.path;
            }
        }
        return { name: folderName, path: folderPath };
    }
    exports.getStoredWorkspaceFolder = getStoredWorkspaceFolder;
    /**
     * Rewrites the content of a workspace file to be saved at a new location.
     * Throws an exception if file is not a valid workspace file
     */
    function rewriteWorkspaceFileForNewLocation(rawWorkspaceContents, configPathURI, isFromUntitledWorkspace, targetConfigPathURI) {
        let storedWorkspace = doParseStoredWorkspace(configPathURI, rawWorkspaceContents);
        const sourceConfigFolder = resources_1.dirname(configPathURI);
        const targetConfigFolder = resources_1.dirname(targetConfigPathURI);
        const rewrittenFolders = [];
        const slashForPath = useSlashForPath(storedWorkspace.folders);
        for (const folder of storedWorkspace.folders) {
            const folderURI = isRawFileWorkspaceFolder(folder) ? resources_1.resolvePath(sourceConfigFolder, folder.path) : uri_1.URI.parse(folder.uri);
            let absolute;
            if (isFromUntitledWorkspace) {
                // if it was an untitled workspace, try to make paths relative
                absolute = false;
            }
            else {
                // for existing workspaces, preserve whether a path was absolute or relative
                absolute = !isRawFileWorkspaceFolder(folder) || path_1.isAbsolute(folder.path);
            }
            rewrittenFolders.push(getStoredWorkspaceFolder(folderURI, absolute, folder.name, targetConfigFolder, slashForPath));
        }
        // Preserve as much of the existing workspace as possible by using jsonEdit
        // and only changing the folders portion.
        const formattingOptions = { insertSpaces: false, tabSize: 4, eol: (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n' };
        const edits = jsonEdit.setProperty(rawWorkspaceContents, ['folders'], rewrittenFolders, formattingOptions);
        let newContent = jsonEdit.applyEdits(rawWorkspaceContents, edits);
        if (storedWorkspace.remoteAuthority === remoteHosts_1.getRemoteAuthority(targetConfigPathURI)) {
            // unsaved remote workspaces have the remoteAuthority set. Remove it when no longer nexessary.
            newContent = jsonEdit.applyEdits(newContent, jsonEdit.removeProperty(newContent, ['remoteAuthority'], formattingOptions));
        }
        return newContent;
    }
    exports.rewriteWorkspaceFileForNewLocation = rewriteWorkspaceFileForNewLocation;
    function doParseStoredWorkspace(path, contents) {
        // Parse workspace file
        let storedWorkspace = json.parse(contents); // use fault tolerant parser
        // Filter out folders which do not have a path or uri set
        if (storedWorkspace && Array.isArray(storedWorkspace.folders)) {
            storedWorkspace.folders = storedWorkspace.folders.filter(folder => isStoredWorkspaceFolder(folder));
        }
        else {
            throw new Error(`${path} looks like an invalid workspace file.`);
        }
        return storedWorkspace;
    }
    function useSlashForPath(storedFolders) {
        if (platform_1.isWindows) {
            return storedFolders.some(folder => isRawFileWorkspaceFolder(folder) && folder.path.indexOf(SLASH) >= 0);
        }
        return true;
    }
    exports.useSlashForPath = useSlashForPath;
    function isLegacySerializedWorkspace(curr) {
        return typeof curr === 'object' && typeof curr['id'] === 'string' && typeof curr['configPath'] === 'string';
    }
    function isUriComponents(curr) {
        return curr && typeof curr['path'] === 'string' && typeof curr['scheme'] === 'string';
    }
    function restoreRecentlyOpened(data, logService) {
        const result = { workspaces: [], files: [] };
        if (data) {
            const restoreGracefully = function (entries, func) {
                for (let i = 0; i < entries.length; i++) {
                    try {
                        func(entries[i], i);
                    }
                    catch (e) {
                        logService.warn(`Error restoring recent entry ${JSON.stringify(entries[i])}: ${e.toString()}. Skip entry.`);
                    }
                }
            };
            const storedRecents = data;
            if (Array.isArray(storedRecents.workspaces3)) {
                restoreGracefully(storedRecents.workspaces3, (workspace, i) => {
                    const label = (Array.isArray(storedRecents.workspaceLabels) && storedRecents.workspaceLabels[i]) || undefined;
                    if (typeof workspace === 'object' && typeof workspace.id === 'string' && typeof workspace.configURIPath === 'string') {
                        result.workspaces.push({ label, workspace: { id: workspace.id, configPath: uri_1.URI.parse(workspace.configURIPath) } });
                    }
                    else if (typeof workspace === 'string') {
                        result.workspaces.push({ label, folderUri: uri_1.URI.parse(workspace) });
                    }
                });
            }
            else if (Array.isArray(storedRecents.workspaces2)) {
                restoreGracefully(storedRecents.workspaces2, workspace => {
                    if (typeof workspace === 'object' && typeof workspace.id === 'string' && typeof workspace.configPath === 'string') {
                        result.workspaces.push({ workspace: { id: workspace.id, configPath: uri_1.URI.file(workspace.configPath) } });
                    }
                    else if (typeof workspace === 'string') {
                        result.workspaces.push({ folderUri: uri_1.URI.parse(workspace) });
                    }
                });
            }
            else if (Array.isArray(storedRecents.workspaces)) {
                // TODO@martin legacy support can be removed at some point (6 month?)
                // format of 1.25 and before
                restoreGracefully(storedRecents.workspaces, workspace => {
                    if (typeof workspace === 'string') {
                        result.workspaces.push({ folderUri: uri_1.URI.file(workspace) });
                    }
                    else if (isLegacySerializedWorkspace(workspace)) {
                        result.workspaces.push({ workspace: { id: workspace.id, configPath: uri_1.URI.file(workspace.configPath) } });
                    }
                    else if (isUriComponents(workspace)) {
                        // added by 1.26-insiders
                        result.workspaces.push({ folderUri: uri_1.URI.revive(workspace) });
                    }
                });
            }
            if (Array.isArray(storedRecents.files2)) {
                restoreGracefully(storedRecents.files2, (file, i) => {
                    const label = (Array.isArray(storedRecents.fileLabels) && storedRecents.fileLabels[i]) || undefined;
                    if (typeof file === 'string') {
                        result.files.push({ label, fileUri: uri_1.URI.parse(file) });
                    }
                });
            }
            else if (Array.isArray(storedRecents.files)) {
                restoreGracefully(storedRecents.files, file => {
                    if (typeof file === 'string') {
                        result.files.push({ fileUri: uri_1.URI.file(file) });
                    }
                });
            }
        }
        return result;
    }
    exports.restoreRecentlyOpened = restoreRecentlyOpened;
    function toStoreData(recents) {
        const serialized = { workspaces3: [], files2: [] };
        let hasLabel = false;
        const workspaceLabels = [];
        for (const recent of recents.workspaces) {
            if (isRecentFolder(recent)) {
                serialized.workspaces3.push(recent.folderUri.toString());
            }
            else {
                serialized.workspaces3.push({ id: recent.workspace.id, configURIPath: recent.workspace.configPath.toString() });
            }
            workspaceLabels.push(recent.label || null);
            hasLabel = hasLabel || !!recent.label;
        }
        if (hasLabel) {
            serialized.workspaceLabels = workspaceLabels;
        }
        hasLabel = false;
        const fileLabels = [];
        for (const recent of recents.files) {
            serialized.files2.push(recent.fileUri.toString());
            fileLabels.push(recent.label || null);
            hasLabel = hasLabel || !!recent.label;
        }
        if (hasLabel) {
            serialized.fileLabels = fileLabels;
        }
        return serialized;
    }
    exports.toStoreData = toStoreData;
});
//#endregion
//# __sourceMappingURL=workspaces.js.map