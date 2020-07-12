/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/glob", "vs/base/common/resources", "vs/base/common/stopwatch", "vs/workbench/services/search/common/search", "vs/base/common/process"], function (require, exports, path, cancellation_1, errorMessage_1, glob, resources, stopwatch_1, search_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSearchManager = void 0;
    class FileSearchEngine {
        constructor(config, provider, sessionToken) {
            this.config = config;
            this.provider = provider;
            this.sessionToken = sessionToken;
            this.isLimitHit = false;
            this.resultCount = 0;
            this.isCanceled = false;
            this.filePattern = config.filePattern;
            this.includePattern = config.includePattern && glob.parse(config.includePattern);
            this.maxResults = config.maxResults || undefined;
            this.exists = config.exists;
            this.activeCancellationTokens = new Set();
            this.globalExcludePattern = config.excludePattern && glob.parse(config.excludePattern);
        }
        cancel() {
            this.isCanceled = true;
            this.activeCancellationTokens.forEach(t => t.cancel());
            this.activeCancellationTokens = new Set();
        }
        search(_onResult) {
            const folderQueries = this.config.folderQueries || [];
            return new Promise((resolve, reject) => {
                const onResult = (match) => {
                    this.resultCount++;
                    _onResult(match);
                };
                // Support that the file pattern is a full path to a file that exists
                if (this.isCanceled) {
                    return resolve({ limitHit: this.isLimitHit });
                }
                // For each extra file
                if (this.config.extraFileResources) {
                    this.config.extraFileResources
                        .forEach(extraFile => {
                        const extraFileStr = extraFile.toString(); // ?
                        const basename = path.basename(extraFileStr);
                        if (this.globalExcludePattern && this.globalExcludePattern(extraFileStr, basename)) {
                            return; // excluded
                        }
                        // File: Check for match on file pattern and include pattern
                        this.matchFile(onResult, { base: extraFile, basename });
                    });
                }
                // For each root folder
                Promise.all(folderQueries.map(fq => {
                    return this.searchInFolder(fq, onResult);
                })).then(stats => {
                    resolve({
                        limitHit: this.isLimitHit,
                        stats: stats[0] || undefined // Only looking at single-folder workspace stats...
                    });
                }, (err) => {
                    reject(new Error(errorMessage_1.toErrorMessage(err)));
                });
            });
        }
        searchInFolder(fq, onResult) {
            const cancellation = new cancellation_1.CancellationTokenSource();
            return new Promise((resolve, reject) => {
                const options = this.getSearchOptionsForFolder(fq);
                const tree = this.initDirectoryTree();
                const queryTester = new search_1.QueryGlobTester(this.config, fq);
                const noSiblingsClauses = !queryTester.hasSiblingExcludeClauses();
                let providerSW;
                new Promise(_resolve => process_1.nextTick(_resolve))
                    .then(() => {
                    this.activeCancellationTokens.add(cancellation);
                    providerSW = stopwatch_1.StopWatch.create();
                    return this.provider.provideFileSearchResults({
                        pattern: this.config.filePattern || ''
                    }, options, cancellation.token);
                })
                    .then(results => {
                    const providerTime = providerSW.elapsed();
                    const postProcessSW = stopwatch_1.StopWatch.create();
                    if (this.isCanceled && !this.isLimitHit) {
                        return null;
                    }
                    if (results) {
                        results.forEach(result => {
                            const relativePath = path.posix.relative(fq.folder.path, result.path);
                            if (noSiblingsClauses) {
                                const basename = path.basename(result.path);
                                this.matchFile(onResult, { base: fq.folder, relativePath, basename });
                                return;
                            }
                            // TODO: Optimize siblings clauses with ripgrep here.
                            this.addDirectoryEntries(tree, fq.folder, relativePath, onResult);
                        });
                    }
                    this.activeCancellationTokens.delete(cancellation);
                    if (this.isCanceled && !this.isLimitHit) {
                        return null;
                    }
                    this.matchDirectoryTree(tree, queryTester, onResult);
                    return {
                        providerTime,
                        postProcessTime: postProcessSW.elapsed()
                    };
                }).then(stats => {
                    cancellation.dispose();
                    resolve(stats);
                }, err => {
                    cancellation.dispose();
                    reject(err);
                });
            });
        }
        getSearchOptionsForFolder(fq) {
            const includes = search_1.resolvePatternsForProvider(this.config.includePattern, fq.includePattern);
            const excludes = search_1.resolvePatternsForProvider(this.config.excludePattern, fq.excludePattern);
            return {
                folder: fq.folder,
                excludes,
                includes,
                useIgnoreFiles: !fq.disregardIgnoreFiles,
                useGlobalIgnoreFiles: !fq.disregardGlobalIgnoreFiles,
                followSymlinks: !fq.ignoreSymlinks,
                maxResults: this.config.maxResults,
                session: this.sessionToken
            };
        }
        initDirectoryTree() {
            const tree = {
                rootEntries: [],
                pathToEntries: Object.create(null)
            };
            tree.pathToEntries['.'] = tree.rootEntries;
            return tree;
        }
        addDirectoryEntries({ pathToEntries }, base, relativeFile, onResult) {
            // Support relative paths to files from a root resource (ignores excludes)
            if (relativeFile === this.filePattern) {
                const basename = path.basename(this.filePattern);
                this.matchFile(onResult, { base: base, relativePath: this.filePattern, basename });
            }
            function add(relativePath) {
                const basename = path.basename(relativePath);
                const dirname = path.dirname(relativePath);
                let entries = pathToEntries[dirname];
                if (!entries) {
                    entries = pathToEntries[dirname] = [];
                    add(dirname);
                }
                entries.push({
                    base,
                    relativePath,
                    basename
                });
            }
            add(relativeFile);
        }
        matchDirectoryTree({ rootEntries, pathToEntries }, queryTester, onResult) {
            const self = this;
            const filePattern = this.filePattern;
            function matchDirectory(entries) {
                const hasSibling = glob.hasSiblingFn(() => entries.map(entry => entry.basename));
                for (let i = 0, n = entries.length; i < n; i++) {
                    const entry = entries[i];
                    const { relativePath, basename } = entry;
                    // Check exclude pattern
                    // If the user searches for the exact file name, we adjust the glob matching
                    // to ignore filtering by siblings because the user seems to know what she
                    // is searching for and we want to include the result in that case anyway
                    if (!queryTester.includedInQuerySync(relativePath, basename, filePattern !== basename ? hasSibling : undefined)) {
                        continue;
                    }
                    const sub = pathToEntries[relativePath];
                    if (sub) {
                        matchDirectory(sub);
                    }
                    else {
                        if (relativePath === filePattern) {
                            continue; // ignore file if its path matches with the file pattern because that is already matched above
                        }
                        self.matchFile(onResult, entry);
                    }
                    if (self.isLimitHit) {
                        break;
                    }
                }
            }
            matchDirectory(rootEntries);
        }
        matchFile(onResult, candidate) {
            if (!this.includePattern || (candidate.relativePath && this.includePattern(candidate.relativePath, candidate.basename))) {
                if (this.exists || (this.maxResults && this.resultCount >= this.maxResults)) {
                    this.isLimitHit = true;
                    this.cancel();
                }
                if (!this.isLimitHit) {
                    onResult(candidate);
                }
            }
        }
    }
    class FileSearchManager {
        constructor() {
            this.sessions = new Map();
        }
        fileSearch(config, provider, onBatch, token) {
            const sessionTokenSource = this.getSessionTokenSource(config.cacheKey);
            const engine = new FileSearchEngine(config, provider, sessionTokenSource && sessionTokenSource.token);
            let resultCount = 0;
            const onInternalResult = (batch) => {
                resultCount += batch.length;
                onBatch(batch.map(m => this.rawMatchToSearchItem(m)));
            };
            return this.doSearch(engine, FileSearchManager.BATCH_SIZE, onInternalResult, token).then(result => {
                return {
                    limitHit: result.limitHit,
                    stats: {
                        fromCache: false,
                        type: 'fileSearchProvider',
                        resultCount,
                        detailStats: result.stats
                    }
                };
            });
        }
        clearCache(cacheKey) {
            const sessionTokenSource = this.getSessionTokenSource(cacheKey);
            if (sessionTokenSource) {
                sessionTokenSource.cancel();
            }
        }
        getSessionTokenSource(cacheKey) {
            if (!cacheKey) {
                return undefined;
            }
            if (!this.sessions.has(cacheKey)) {
                this.sessions.set(cacheKey, new cancellation_1.CancellationTokenSource());
            }
            return this.sessions.get(cacheKey);
        }
        rawMatchToSearchItem(match) {
            if (match.relativePath) {
                return {
                    resource: resources.joinPath(match.base, match.relativePath)
                };
            }
            else {
                // extraFileResources
                return {
                    resource: match.base
                };
            }
        }
        doSearch(engine, batchSize, onResultBatch, token) {
            token.onCancellationRequested(() => {
                engine.cancel();
            });
            const _onResult = (match) => {
                if (match) {
                    batch.push(match);
                    if (batchSize > 0 && batch.length >= batchSize) {
                        onResultBatch(batch);
                        batch = [];
                    }
                }
            };
            let batch = [];
            return engine.search(_onResult).then(result => {
                if (batch.length) {
                    onResultBatch(batch);
                }
                return result;
            }, error => {
                if (batch.length) {
                    onResultBatch(batch);
                }
                return Promise.reject(error);
            });
        }
    }
    exports.FileSearchManager = FileSearchManager;
    FileSearchManager.BATCH_SIZE = 512;
});
//# __sourceMappingURL=fileSearchManager.js.map