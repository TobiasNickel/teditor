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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/stopwatch", "vs/editor/common/services/modelService", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchHelpers", "vs/platform/instantiation/common/extensions", "vs/base/test/common/utils"], function (require, exports, arrays, errors_1, lifecycle_1, map_1, network_1, stopwatch_1, modelService_1, files_1, log_1, telemetry_1, editorService_1, extensions_1, search_1, searchHelpers_1, extensions_2, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteSearchService = exports.SearchService = void 0;
    class SearchService extends lifecycle_1.Disposable {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService) {
            super();
            this.modelService = modelService;
            this.editorService = editorService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.fileService = fileService;
            this.diskSearch = null;
            this.fileSearchProviders = new Map();
            this.textSearchProviders = new Map();
            this.deferredFileSearchesByScheme = new Map();
            this.deferredTextSearchesByScheme = new Map();
        }
        registerSearchResultProvider(scheme, type, provider) {
            let list;
            let deferredMap;
            if (type === 0 /* file */) {
                list = this.fileSearchProviders;
                deferredMap = this.deferredFileSearchesByScheme;
            }
            else if (type === 1 /* text */) {
                list = this.textSearchProviders;
                deferredMap = this.deferredTextSearchesByScheme;
            }
            else {
                throw new Error('Unknown SearchProviderType');
            }
            list.set(scheme, provider);
            if (deferredMap.has(scheme)) {
                deferredMap.get(scheme).complete(provider);
                deferredMap.delete(scheme);
            }
            return lifecycle_1.toDisposable(() => {
                list.delete(scheme);
            });
        }
        async textSearch(query, token, onProgress) {
            // Get local results from dirty/untitled
            const localResults = this.getLocalResults(query);
            if (onProgress) {
                arrays.coalesce([...localResults.results.values()]).forEach(onProgress);
            }
            const onProviderProgress = (progress) => {
                if (search_1.isFileMatch(progress)) {
                    // Match
                    if (!localResults.results.has(progress.resource) && onProgress) { // don't override local results
                        onProgress(progress);
                    }
                }
                else if (onProgress) {
                    // Progress
                    onProgress(progress);
                }
                if (search_1.isProgressMessage(progress)) {
                    this.logService.debug('SearchService#search', progress.message);
                }
            };
            const otherResults = await this.doSearch(query, token, onProviderProgress);
            return Object.assign(Object.assign(Object.assign({}, otherResults), {
                limitHit: otherResults.limitHit || localResults.limitHit
            }), { results: [...otherResults.results, ...arrays.coalesce([...localResults.results.values()])] });
        }
        fileSearch(query, token) {
            return this.doSearch(query, token);
        }
        doSearch(query, token, onProgress) {
            this.logService.trace('SearchService#search', JSON.stringify(query));
            const schemesInQuery = this.getSchemesInQuery(query);
            const providerActivations = [Promise.resolve(null)];
            schemesInQuery.forEach(scheme => providerActivations.push(this.extensionService.activateByEvent(`onSearch:${scheme}`)));
            providerActivations.push(this.extensionService.activateByEvent('onSearch:file'));
            const providerPromise = (async () => {
                await Promise.all(providerActivations);
                this.extensionService.whenInstalledExtensionsRegistered();
                // Cancel faster if search was canceled while waiting for extensions
                if (token && token.isCancellationRequested) {
                    return Promise.reject(errors_1.canceled());
                }
                const progressCallback = (item) => {
                    if (token && token.isCancellationRequested) {
                        return;
                    }
                    if (onProgress) {
                        onProgress(item);
                    }
                };
                const exists = await Promise.all(query.folderQueries.map(query => this.fileService.exists(query.folder)));
                query.folderQueries = query.folderQueries.filter((_, i) => exists[i]);
                let completes = await this.searchWithProviders(query, progressCallback, token);
                completes = arrays.coalesce(completes);
                if (!completes.length) {
                    return {
                        limitHit: false,
                        results: []
                    };
                }
                return {
                    limitHit: completes[0] && completes[0].limitHit,
                    stats: completes[0].stats,
                    results: arrays.flatten(completes.map((c) => c.results))
                };
            })();
            return new Promise((resolve, reject) => {
                if (token) {
                    token.onCancellationRequested(() => {
                        reject(errors_1.canceled());
                    });
                }
                providerPromise.then(resolve, reject);
            });
        }
        getSchemesInQuery(query) {
            const schemes = new Set();
            if (query.folderQueries) {
                query.folderQueries.forEach(fq => schemes.add(fq.folder.scheme));
            }
            if (query.extraFileResources) {
                query.extraFileResources.forEach(extraFile => schemes.add(extraFile.scheme));
            }
            return schemes;
        }
        async waitForProvider(queryType, scheme) {
            let deferredMap = queryType === 1 /* File */ ?
                this.deferredFileSearchesByScheme :
                this.deferredTextSearchesByScheme;
            if (deferredMap.has(scheme)) {
                return deferredMap.get(scheme).p;
            }
            else {
                const deferred = new utils_1.DeferredPromise();
                deferredMap.set(scheme, deferred);
                return deferred.p;
            }
        }
        async searchWithProviders(query, onProviderProgress, token) {
            const e2eSW = stopwatch_1.StopWatch.create(false);
            const diskSearchQueries = [];
            const searchPs = [];
            const fqs = this.groupFolderQueriesByScheme(query);
            await Promise.all(map_1.keys(fqs).map(async (scheme) => {
                const schemeFQs = fqs.get(scheme);
                let provider = query.type === 1 /* File */ ?
                    this.fileSearchProviders.get(scheme) :
                    this.textSearchProviders.get(scheme);
                if (!provider && scheme === network_1.Schemas.file) {
                    diskSearchQueries.push(...schemeFQs);
                }
                else {
                    if (!provider) {
                        if (scheme !== network_1.Schemas.vscodeRemote) {
                            console.warn(`No search provider registered for scheme: ${scheme}`);
                            return;
                        }
                        console.warn(`No search provider registered for scheme: ${scheme}, waiting`);
                        provider = await this.waitForProvider(query.type, scheme);
                    }
                    const oneSchemeQuery = Object.assign(Object.assign({}, query), {
                        folderQueries: schemeFQs
                    });
                    searchPs.push(query.type === 1 /* File */ ?
                        provider.fileSearch(oneSchemeQuery, token) :
                        provider.textSearch(oneSchemeQuery, onProviderProgress, token));
                }
            }));
            const diskSearchExtraFileResources = query.extraFileResources && query.extraFileResources.filter(res => res.scheme === network_1.Schemas.file);
            if (diskSearchQueries.length || diskSearchExtraFileResources) {
                const diskSearchQuery = Object.assign(Object.assign(Object.assign({}, query), {
                    folderQueries: diskSearchQueries
                }), { extraFileResources: diskSearchExtraFileResources });
                if (this.diskSearch) {
                    searchPs.push(diskSearchQuery.type === 1 /* File */ ?
                        this.diskSearch.fileSearch(diskSearchQuery, token) :
                        this.diskSearch.textSearch(diskSearchQuery, onProviderProgress, token));
                }
            }
            return Promise.all(searchPs).then(completes => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                completes.forEach(complete => {
                    this.sendTelemetry(query, endToEndTime, complete);
                });
                return completes;
            }, err => {
                const endToEndTime = e2eSW.elapsed();
                this.logService.trace(`SearchService#search: ${endToEndTime}ms`);
                const searchError = search_1.deserializeSearchError(err);
                this.logService.trace(`SearchService#searchError: ${searchError.message}`);
                this.sendTelemetry(query, endToEndTime, undefined, searchError);
                throw searchError;
            });
        }
        groupFolderQueriesByScheme(query) {
            const queries = new Map();
            query.folderQueries.forEach(fq => {
                const schemeFQs = queries.get(fq.folder.scheme) || [];
                schemeFQs.push(fq);
                queries.set(fq.folder.scheme, schemeFQs);
            });
            return queries;
        }
        sendTelemetry(query, endToEndTime, complete, err) {
            const fileSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme === 'file');
            const otherSchemeOnly = query.folderQueries.every(fq => fq.folder.scheme !== 'file');
            const scheme = fileSchemeOnly ? 'file' :
                otherSchemeOnly ? 'other' :
                    'mixed';
            if (query.type === 1 /* File */ && complete && complete.stats) {
                const fileSearchStats = complete.stats;
                if (fileSearchStats.fromCache) {
                    const cacheStats = fileSearchStats.detailStats;
                    this.telemetryService.publicLog2('cachedSearchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        type: fileSearchStats.type,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        cacheWasResolved: cacheStats.cacheWasResolved,
                        cacheLookupTime: cacheStats.cacheLookupTime,
                        cacheFilterTime: cacheStats.cacheFilterTime,
                        cacheEntryCount: cacheStats.cacheEntryCount,
                        scheme
                    });
                }
                else {
                    const searchEngineStats = fileSearchStats.detailStats;
                    this.telemetryService.publicLog2('searchComplete', {
                        reason: query._reason,
                        resultCount: fileSearchStats.resultCount,
                        workspaceFolderCount: query.folderQueries.length,
                        type: fileSearchStats.type,
                        endToEndTime: endToEndTime,
                        sortingTime: fileSearchStats.sortingTime,
                        fileWalkTime: searchEngineStats.fileWalkTime,
                        directoriesWalked: searchEngineStats.directoriesWalked,
                        filesWalked: searchEngineStats.filesWalked,
                        cmdTime: searchEngineStats.cmdTime,
                        cmdResultCount: searchEngineStats.cmdResultCount,
                        scheme
                    });
                }
            }
            else if (query.type === 2 /* Text */) {
                let errorType;
                if (err) {
                    errorType = err.code === search_1.SearchErrorCode.regexParseError ? 'regex' :
                        err.code === search_1.SearchErrorCode.unknownEncoding ? 'encoding' :
                            err.code === search_1.SearchErrorCode.globParseError ? 'glob' :
                                err.code === search_1.SearchErrorCode.invalidLiteral ? 'literal' :
                                    err.code === search_1.SearchErrorCode.other ? 'other' :
                                        err.code === search_1.SearchErrorCode.canceled ? 'canceled' :
                                            'unknown';
                }
                this.telemetryService.publicLog2('textSearchComplete', {
                    reason: query._reason,
                    workspaceFolderCount: query.folderQueries.length,
                    endToEndTime: endToEndTime,
                    scheme,
                    error: errorType,
                    usePCRE2: !!query.usePCRE2
                });
            }
        }
        getLocalResults(query) {
            const localResults = new map_1.ResourceMap();
            let limitHit = false;
            if (query.type === 2 /* Text */) {
                const models = this.modelService.getModels();
                models.forEach((model) => {
                    const resource = model.uri;
                    if (!resource) {
                        return;
                    }
                    if (limitHit) {
                        return;
                    }
                    // Skip files that are not opened as text file
                    if (!this.editorService.isOpen({ resource })) {
                        return;
                    }
                    // Skip search results
                    if (model.getModeId() === 'search-result' && !(query.includePattern && query.includePattern['**/*.code-search'])) {
                        // TODO: untitled search editors will be excluded from search even when include *.code-search is specified
                        return;
                    }
                    // Block walkthrough, webview, etc.
                    if (resource.scheme !== network_1.Schemas.untitled && !this.fileService.canHandleResource(resource)) {
                        return;
                    }
                    // Exclude files from the git FileSystemProvider, e.g. to prevent open staged files from showing in search results
                    if (resource.scheme === 'git') {
                        return;
                    }
                    if (!this.matches(resource, query)) {
                        return; // respect user filters
                    }
                    // Use editor API to find matches
                    const askMax = typeof query.maxResults === 'number' ? query.maxResults + 1 : undefined;
                    let matches = model.findMatches(query.contentPattern.pattern, false, !!query.contentPattern.isRegExp, !!query.contentPattern.isCaseSensitive, query.contentPattern.isWordMatch ? query.contentPattern.wordSeparators : null, false, askMax);
                    if (matches.length) {
                        if (askMax && matches.length >= askMax) {
                            limitHit = true;
                            matches = matches.slice(0, askMax - 1);
                        }
                        const fileMatch = new search_1.FileMatch(resource);
                        localResults.set(resource, fileMatch);
                        const textSearchResults = searchHelpers_1.editorMatchesToTextSearchResults(matches, model, query.previewOptions);
                        fileMatch.results = searchHelpers_1.addContextToEditorMatches(textSearchResults, model, query);
                    }
                    else {
                        localResults.set(resource, null);
                    }
                });
            }
            return {
                results: localResults,
                limitHit
            };
        }
        matches(resource, query) {
            return search_1.pathIncludedInQuery(query, resource.fsPath);
        }
        clearCache(cacheKey) {
            const clearPs = [
                this.diskSearch,
                ...Array.from(this.fileSearchProviders.values())
            ].map(provider => provider && provider.clearCache(cacheKey));
            return Promise.all(clearPs)
                .then(() => { });
        }
    }
    exports.SearchService = SearchService;
    let RemoteSearchService = class RemoteSearchService extends SearchService {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService) {
            super(modelService, editorService, telemetryService, logService, extensionService, fileService);
        }
    };
    RemoteSearchService = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, extensions_1.IExtensionService),
        __param(5, files_1.IFileService)
    ], RemoteSearchService);
    exports.RemoteSearchService = RemoteSearchService;
    extensions_2.registerSingleton(search_1.ISearchService, RemoteSearchService, true);
});
//# __sourceMappingURL=searchService.js.map