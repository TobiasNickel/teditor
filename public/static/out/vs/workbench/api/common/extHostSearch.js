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
define(["require", "exports", "vs/base/common/lifecycle", "../common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/search/common/fileSearchManager", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/platform/log/common/log", "vs/base/common/uri", "vs/workbench/services/search/common/textSearchManager"], function (require, exports, lifecycle_1, extHost_protocol_1, instantiation_1, fileSearchManager_1, extHostRpcService_1, extHostUriTransformerService_1, log_1, uri_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reviveQuery = exports.ExtHostSearch = exports.IExtHostSearch = void 0;
    exports.IExtHostSearch = instantiation_1.createDecorator('IExtHostSearch');
    let ExtHostSearch = class ExtHostSearch {
        constructor(extHostRpc, _uriTransformer, _logService) {
            this.extHostRpc = extHostRpc;
            this._uriTransformer = _uriTransformer;
            this._logService = _logService;
            this._proxy = this.extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadSearch);
            this._handlePool = 0;
            this._textSearchProvider = new Map();
            this._textSearchUsedSchemes = new Set();
            this._fileSearchProvider = new Map();
            this._fileSearchUsedSchemes = new Set();
            this._fileSearchManager = new fileSearchManager_1.FileSearchManager();
        }
        _transformScheme(scheme) {
            return this._uriTransformer.transformOutgoingScheme(scheme);
        }
        registerTextSearchProvider(scheme, provider) {
            if (this._textSearchUsedSchemes.has(scheme)) {
                throw new Error(`a text search provider for the scheme '${scheme}' is already registered`);
            }
            this._textSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._textSearchProvider.set(handle, provider);
            this._proxy.$registerTextSearchProvider(handle, this._transformScheme(scheme));
            return lifecycle_1.toDisposable(() => {
                this._textSearchUsedSchemes.delete(scheme);
                this._textSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        registerFileSearchProvider(scheme, provider) {
            if (this._fileSearchUsedSchemes.has(scheme)) {
                throw new Error(`a file search provider for the scheme '${scheme}' is already registered`);
            }
            this._fileSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._fileSearchProvider.set(handle, provider);
            this._proxy.$registerFileSearchProvider(handle, this._transformScheme(scheme));
            return lifecycle_1.toDisposable(() => {
                this._fileSearchUsedSchemes.delete(scheme);
                this._fileSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        $provideFileSearchResults(handle, session, rawQuery, token) {
            const query = reviveQuery(rawQuery);
            const provider = this._fileSearchProvider.get(handle);
            if (provider) {
                return this._fileSearchManager.fileSearch(query, provider, batch => {
                    this._proxy.$handleFileMatch(handle, session, batch.map(p => p.resource));
                }, token);
            }
            else {
                throw new Error('unknown provider: ' + handle);
            }
        }
        $clearCache(cacheKey) {
            this._fileSearchManager.clearCache(cacheKey);
            return Promise.resolve(undefined);
        }
        $provideTextSearchResults(handle, session, rawQuery, token) {
            const provider = this._textSearchProvider.get(handle);
            if (!provider || !provider.provideTextSearchResults) {
                throw new Error(`Unknown provider ${handle}`);
            }
            const query = reviveQuery(rawQuery);
            const engine = this.createTextSearchManager(query, provider);
            return engine.search(progress => this._proxy.$handleTextMatch(handle, session, progress), token);
        }
        createTextSearchManager(query, provider) {
            return new textSearchManager_1.TextSearchManager(query, provider, {
                readdir: resource => Promise.resolve([]),
                toCanonicalName: encoding => encoding
            });
        }
    };
    ExtHostSearch = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostUriTransformerService_1.IURITransformerService),
        __param(2, log_1.ILogService)
    ], ExtHostSearch);
    exports.ExtHostSearch = ExtHostSearch;
    function reviveQuery(rawQuery) {
        return Object.assign(Object.assign({}, rawQuery), {
            folderQueries: rawQuery.folderQueries && rawQuery.folderQueries.map(reviveFolderQuery),
            extraFileResources: rawQuery.extraFileResources && rawQuery.extraFileResources.map(components => uri_1.URI.revive(components))
        });
    }
    exports.reviveQuery = reviveQuery;
    function reviveFolderQuery(rawFolderQuery) {
        return Object.assign(Object.assign({}, rawFolderQuery), { folder: uri_1.URI.revive(rawFolderQuery.folder) });
    }
});
//# __sourceMappingURL=extHostSearch.js.map