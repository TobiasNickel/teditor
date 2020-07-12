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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/search/common/search", "../common/extHost.protocol"], function (require, exports, cancellation_1, lifecycle_1, uri_1, telemetry_1, extHostCustomers_1, search_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSearch = void 0;
    let MainThreadSearch = class MainThreadSearch {
        constructor(extHostContext, _searchService, _telemetryService) {
            this._searchService = _searchService;
            this._telemetryService = _telemetryService;
            this._searchProvider = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSearch);
        }
        dispose() {
            this._searchProvider.forEach(value => value.dispose());
            this._searchProvider.clear();
        }
        $registerTextSearchProvider(handle, scheme) {
            this._searchProvider.set(handle, new RemoteSearchProvider(this._searchService, 1 /* text */, scheme, handle, this._proxy));
        }
        $registerFileSearchProvider(handle, scheme) {
            this._searchProvider.set(handle, new RemoteSearchProvider(this._searchService, 0 /* file */, scheme, handle, this._proxy));
        }
        $unregisterProvider(handle) {
            lifecycle_1.dispose(this._searchProvider.get(handle));
            this._searchProvider.delete(handle);
        }
        $handleFileMatch(handle, session, data) {
            const provider = this._searchProvider.get(handle);
            if (!provider) {
                throw new Error('Got result for unknown provider');
            }
            provider.handleFindMatch(session, data);
        }
        $handleTextMatch(handle, session, data) {
            const provider = this._searchProvider.get(handle);
            if (!provider) {
                throw new Error('Got result for unknown provider');
            }
            provider.handleFindMatch(session, data);
        }
        $handleTelemetry(eventName, data) {
            this._telemetryService.publicLog(eventName, data);
        }
    };
    MainThreadSearch = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadSearch),
        __param(1, search_1.ISearchService),
        __param(2, telemetry_1.ITelemetryService)
    ], MainThreadSearch);
    exports.MainThreadSearch = MainThreadSearch;
    class SearchOperation {
        constructor(progress, id = ++SearchOperation._idPool, matches = new Map()) {
            this.progress = progress;
            this.id = id;
            this.matches = matches;
            //
        }
        addMatch(match) {
            const existingMatch = this.matches.get(match.resource.toString());
            if (existingMatch) {
                // TODO@rob clean up text/file result types
                // If a file search returns the same file twice, we would enter this branch.
                // It's possible that could happen, #90813
                if (existingMatch.results && match.results) {
                    existingMatch.results.push(...match.results);
                }
            }
            else {
                this.matches.set(match.resource.toString(), match);
            }
            if (this.progress) {
                this.progress(match);
            }
        }
    }
    SearchOperation._idPool = 0;
    class RemoteSearchProvider {
        constructor(searchService, type, _scheme, _handle, _proxy) {
            this._scheme = _scheme;
            this._handle = _handle;
            this._proxy = _proxy;
            this._registrations = new lifecycle_1.DisposableStore();
            this._searches = new Map();
            this._registrations.add(searchService.registerSearchResultProvider(this._scheme, type, this));
        }
        dispose() {
            this._registrations.dispose();
        }
        fileSearch(query, token = cancellation_1.CancellationToken.None) {
            return this.doSearch(query, undefined, token);
        }
        textSearch(query, onProgress, token = cancellation_1.CancellationToken.None) {
            return this.doSearch(query, onProgress, token);
        }
        doSearch(query, onProgress, token = cancellation_1.CancellationToken.None) {
            if (!query.folderQueries.length) {
                throw new Error('Empty folderQueries');
            }
            const search = new SearchOperation(onProgress);
            this._searches.set(search.id, search);
            const searchP = query.type === 1 /* File */
                ? this._proxy.$provideFileSearchResults(this._handle, search.id, query, token)
                : this._proxy.$provideTextSearchResults(this._handle, search.id, query, token);
            return Promise.resolve(searchP).then((result) => {
                this._searches.delete(search.id);
                return { results: Array.from(search.matches.values()), stats: result.stats, limitHit: result.limitHit };
            }, err => {
                this._searches.delete(search.id);
                return Promise.reject(err);
            });
        }
        clearCache(cacheKey) {
            return Promise.resolve(this._proxy.$clearCache(cacheKey));
        }
        handleFindMatch(session, dataOrUri) {
            const searchOp = this._searches.get(session);
            if (!searchOp) {
                // ignore...
                return;
            }
            dataOrUri.forEach(result => {
                if (result.results) {
                    searchOp.addMatch({
                        resource: uri_1.URI.revive(result.resource),
                        results: result.results
                    });
                }
                else {
                    searchOp.addMatch({
                        resource: uri_1.URI.revive(result)
                    });
                }
            });
        }
    }
});
//# __sourceMappingURL=mainThreadSearch.js.map