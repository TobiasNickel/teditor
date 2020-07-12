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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/resources", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/modeService", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/base/common/glob", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/types"], function (require, exports, uri_1, objects, event_1, resources_1, contextkey_1, modeService_1, files_1, lifecycle_1, glob_1, workspace_1, configuration_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceGlobMatcher = exports.ResourceContextKey = void 0;
    let ResourceContextKey = class ResourceContextKey extends lifecycle_1.Disposable {
        constructor(contextKeyService, _fileService, _modeService) {
            super();
            this._fileService = _fileService;
            this._modeService = _modeService;
            this._schemeKey = ResourceContextKey.Scheme.bindTo(contextKeyService);
            this._filenameKey = ResourceContextKey.Filename.bindTo(contextKeyService);
            this._langIdKey = ResourceContextKey.LangId.bindTo(contextKeyService);
            this._resourceKey = ResourceContextKey.Resource.bindTo(contextKeyService);
            this._extensionKey = ResourceContextKey.Extension.bindTo(contextKeyService);
            this._hasResource = ResourceContextKey.HasResource.bindTo(contextKeyService);
            this._isFileSystemResource = ResourceContextKey.IsFileSystemResource.bindTo(contextKeyService);
            this._register(_fileService.onDidChangeFileSystemProviderRegistrations(() => {
                const resource = this._resourceKey.get();
                this._isFileSystemResource.set(Boolean(resource && _fileService.canHandleResource(resource)));
            }));
            this._register(_modeService.onDidCreateMode(() => {
                const value = this._resourceKey.get();
                this._langIdKey.set(value ? this._modeService.getModeIdByFilepathOrFirstLine(value) : null);
            }));
        }
        set(value) {
            if (!ResourceContextKey._uriEquals(this._resourceKey.get(), value)) {
                this._resourceKey.set(value);
                this._schemeKey.set(value ? value.scheme : null);
                this._filenameKey.set(value ? resources_1.basename(value) : null);
                this._langIdKey.set(value ? this._modeService.getModeIdByFilepathOrFirstLine(value) : null);
                this._extensionKey.set(value ? resources_1.extname(value) : null);
                this._hasResource.set(!!value);
                this._isFileSystemResource.set(value ? this._fileService.canHandleResource(value) : false);
            }
        }
        reset() {
            this._schemeKey.reset();
            this._langIdKey.reset();
            this._resourceKey.reset();
            this._langIdKey.reset();
            this._extensionKey.reset();
            this._hasResource.reset();
            this._isFileSystemResource.reset();
        }
        get() {
            return types_1.withNullAsUndefined(this._resourceKey.get());
        }
        static _uriEquals(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.scheme === b.scheme // checks for not equals (fail fast)
                && a.authority === b.authority
                && a.path === b.path
                && a.query === b.query
                && a.fragment === b.fragment
                && a.toString() === b.toString(); // for equal we use the normalized toString-form
        }
    };
    // NOTE: DO NOT CHANGE THE DEFAULT VALUE TO ANYTHING BUT
    // UNDEFINED! IT IS IMPORTANT THAT DEFAULTS ARE INHERITED
    // FROM THE PARENT CONTEXT AND ONLY UNDEFINED DOES THIS
    ResourceContextKey.Scheme = new contextkey_1.RawContextKey('resourceScheme', undefined);
    ResourceContextKey.Filename = new contextkey_1.RawContextKey('resourceFilename', undefined);
    ResourceContextKey.LangId = new contextkey_1.RawContextKey('resourceLangId', undefined);
    ResourceContextKey.Resource = new contextkey_1.RawContextKey('resource', undefined);
    ResourceContextKey.Extension = new contextkey_1.RawContextKey('resourceExtname', undefined);
    ResourceContextKey.HasResource = new contextkey_1.RawContextKey('resourceSet', undefined);
    ResourceContextKey.IsFileSystemResource = new contextkey_1.RawContextKey('isFileSystemResource', undefined);
    ResourceContextKey = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, files_1.IFileService),
        __param(2, modeService_1.IModeService)
    ], ResourceContextKey);
    exports.ResourceContextKey = ResourceContextKey;
    let ResourceGlobMatcher = class ResourceGlobMatcher extends lifecycle_1.Disposable {
        constructor(globFn, shouldUpdate, contextService, configurationService) {
            super();
            this.globFn = globFn;
            this.shouldUpdate = shouldUpdate;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this._onExpressionChange = this._register(new event_1.Emitter());
            this.onExpressionChange = this._onExpressionChange.event;
            this.mapRootToParsedExpression = new Map();
            this.mapRootToExpressionConfig = new Map();
            this.updateExcludes(false);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.shouldUpdate(e)) {
                    this.updateExcludes(true);
                }
            }));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.updateExcludes(true)));
        }
        updateExcludes(fromEvent) {
            let changed = false;
            // Add excludes per workspaces that got added
            this.contextService.getWorkspace().folders.forEach(folder => {
                const rootExcludes = this.globFn(folder.uri);
                if (!this.mapRootToExpressionConfig.has(folder.uri.toString()) || !objects.equals(this.mapRootToExpressionConfig.get(folder.uri.toString()), rootExcludes)) {
                    changed = true;
                    this.mapRootToParsedExpression.set(folder.uri.toString(), glob_1.parse(rootExcludes));
                    this.mapRootToExpressionConfig.set(folder.uri.toString(), objects.deepClone(rootExcludes));
                }
            });
            // Remove excludes per workspace no longer present
            this.mapRootToExpressionConfig.forEach((value, root) => {
                if (root === ResourceGlobMatcher.NO_ROOT) {
                    return; // always keep this one
                }
                if (root && !this.contextService.getWorkspaceFolder(uri_1.URI.parse(root))) {
                    this.mapRootToParsedExpression.delete(root);
                    this.mapRootToExpressionConfig.delete(root);
                    changed = true;
                }
            });
            // Always set for resources outside root as well
            const globalExcludes = this.globFn();
            if (!this.mapRootToExpressionConfig.has(ResourceGlobMatcher.NO_ROOT) || !objects.equals(this.mapRootToExpressionConfig.get(ResourceGlobMatcher.NO_ROOT), globalExcludes)) {
                changed = true;
                this.mapRootToParsedExpression.set(ResourceGlobMatcher.NO_ROOT, glob_1.parse(globalExcludes));
                this.mapRootToExpressionConfig.set(ResourceGlobMatcher.NO_ROOT, objects.deepClone(globalExcludes));
            }
            if (fromEvent && changed) {
                this._onExpressionChange.fire();
            }
        }
        matches(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            let expressionForRoot;
            if (folder && this.mapRootToParsedExpression.has(folder.uri.toString())) {
                expressionForRoot = this.mapRootToParsedExpression.get(folder.uri.toString());
            }
            else {
                expressionForRoot = this.mapRootToParsedExpression.get(ResourceGlobMatcher.NO_ROOT);
            }
            // If the resource if from a workspace, convert its absolute path to a relative
            // path so that glob patterns have a higher probability to match. For example
            // a glob pattern of "src/**" will not match on an absolute path "/folder/src/file.txt"
            // but can match on "src/file.txt"
            let resourcePathToMatch;
            if (folder) {
                resourcePathToMatch = resources_1.relativePath(folder.uri, resource); // always uses forward slashes
            }
            else {
                resourcePathToMatch = resource.fsPath; // TODO@isidor: support non-file URIs
            }
            return !!expressionForRoot && typeof resourcePathToMatch === 'string' && !!expressionForRoot(resourcePathToMatch);
        }
    };
    ResourceGlobMatcher.NO_ROOT = null;
    ResourceGlobMatcher = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService)
    ], ResourceGlobMatcher);
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
});
//# __sourceMappingURL=resources.js.map