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
define(["require", "exports", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/fuzzyScorer", "vs/workbench/contrib/search/common/queryBuilder", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/search/common/search", "vs/workbench/services/search/common/search", "vs/platform/workspace/common/workspace", "vs/base/common/labels", "vs/workbench/services/path/common/pathService", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/label/common/label", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range", "vs/base/common/async", "vs/base/common/arrays", "vs/workbench/contrib/search/common/cacheState", "vs/workbench/services/history/common/history", "vs/base/common/network", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/map", "vs/workbench/contrib/search/browser/symbolsQuickAccess", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess", "vs/editor/common/services/resolverService", "vs/base/common/functional", "vs/editor/browser/editorBrowser", "vs/base/common/types", "vs/base/common/codicons", "vs/css!./media/anythingQuickAccess"], function (require, exports, quickInput_1, pickerQuickAccess_1, fuzzyScorer_1, queryBuilder_1, instantiation_1, search_1, search_2, workspace_1, labels_1, pathService_1, uri_1, resources_1, environmentService_1, files_1, lifecycle_1, label_1, getIconClasses_1, modelService_1, modeService_1, nls_1, workingCopyService_1, configuration_1, editor_1, editorService_1, range_1, async_1, arrays_1, cacheState_1, history_1, network_1, filesConfigurationService_1, map_1, symbolsQuickAccess_1, quickAccess_1, gotoSymbolQuickAccess_1, resolverService_1, functional_1, editorBrowser_1, types_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnythingQuickAccessProvider = void 0;
    function isEditorSymbolQuickPickItem(pick) {
        const candidate = pick ? pick : undefined;
        return !!candidate && !!candidate.range && !!candidate.resource;
    }
    let AnythingQuickAccessProvider = class AnythingQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(instantiationService, searchService, contextService, pathService, environmentService, fileService, labelService, modelService, modeService, workingCopyService, configurationService, editorService, historyService, filesConfigurationService, textModelService) {
            super(AnythingQuickAccessProvider.PREFIX, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: nls_1.localize('noAnythingResults', "No matching results")
                }
            });
            this.instantiationService = instantiationService;
            this.searchService = searchService;
            this.contextService = contextService;
            this.pathService = pathService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.labelService = labelService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.workingCopyService = workingCopyService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.historyService = historyService;
            this.filesConfigurationService = filesConfigurationService;
            this.textModelService = textModelService;
            this.pickState = new class {
                constructor(provider, editorService) {
                    this.provider = provider;
                    this.editorService = editorService;
                    this.picker = undefined;
                    this.editorViewState = undefined;
                    this.scorerCache = Object.create(null);
                    this.fileQueryCache = undefined;
                    this.lastOriginalFilter = undefined;
                    this.lastFilter = undefined;
                    this.lastRange = undefined;
                    this.lastGlobalPicks = undefined;
                    this.isQuickNavigating = undefined;
                }
                set(picker) {
                    // Picker for this run
                    this.picker = picker;
                    functional_1.once(picker.onDispose)(() => {
                        if (picker === this.picker) {
                            this.picker = undefined; // clear the picker when disposed to not keep it in memory for too long
                        }
                    });
                    // Caches
                    const isQuickNavigating = !!picker.quickNavigate;
                    if (!isQuickNavigating) {
                        this.fileQueryCache = this.provider.createFileQueryCache();
                        this.scorerCache = Object.create(null);
                    }
                    // Other
                    this.isQuickNavigating = isQuickNavigating;
                    this.lastOriginalFilter = undefined;
                    this.lastFilter = undefined;
                    this.lastRange = undefined;
                    this.lastGlobalPicks = undefined;
                    this.editorViewState = undefined;
                }
                rememberEditorViewState() {
                    var _a;
                    if (this.editorViewState) {
                        return; // return early if already done
                    }
                    const activeEditorPane = this.editorService.activeEditorPane;
                    if (activeEditorPane) {
                        this.editorViewState = {
                            group: activeEditorPane.group,
                            editor: activeEditorPane.input,
                            state: types_1.withNullAsUndefined((_a = editorBrowser_1.getCodeEditor(activeEditorPane.getControl())) === null || _a === void 0 ? void 0 : _a.saveViewState())
                        };
                    }
                }
                async restoreEditorViewState() {
                    if (this.editorViewState) {
                        await this.editorService.openEditor(this.editorViewState.editor, { viewState: this.editorViewState.state, preserveFocus: true /* import to not close the picker as a result */ }, this.editorViewState.group);
                    }
                }
            }(this, this.editorService);
            //#region Editor History
            this.labelOnlyEditorHistoryPickAccessor = new quickInput_1.QuickPickItemScorerAccessor({ skipDescription: true });
            //#endregion
            //#region File Search
            this.fileQueryDelayer = this._register(new async_1.ThrottledDelayer(AnythingQuickAccessProvider.TYPING_SEARCH_DELAY));
            this.fileQueryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            //#endregion
            //#region Workspace Symbols (if enabled)
            this.workspaceSymbolsQuickAccess = this._register(this.instantiationService.createInstance(symbolsQuickAccess_1.SymbolsQuickAccessProvider));
            //#endregion
            //#region Editor Symbols (if narrowing down into a global pick via `@`)
            this.editorSymbolsQuickAccess = this.instantiationService.createInstance(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider);
        }
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench.editor;
            const searchConfig = this.configurationService.getValue().search;
            const quickAccessConfig = this.configurationService.getValue().workbench.quickOpen;
            return {
                openEditorPinned: !editorConfig.enablePreviewFromQuickOpen,
                openSideBySideDirection: editorConfig.openSideBySideDirection,
                includeSymbols: searchConfig.quickOpen.includeSymbols,
                includeHistory: searchConfig.quickOpen.includeHistory,
                historyFilterSortOrder: searchConfig.quickOpen.history.filterSortOrder,
                shortAutoSaveDelay: this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */,
                preserveInput: quickAccessConfig.preserveInput
            };
        }
        provide(picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Update the pick state for this run
            this.pickState.set(picker);
            // Add editor decorations for active editor symbol picks
            const editorDecorationsDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            disposables.add(picker.onDidChangeActive(() => {
                // Clear old decorations
                editorDecorationsDisposable.value = undefined;
                // Add new decoration if editor symbol is active
                const [item] = picker.activeItems;
                if (isEditorSymbolQuickPickItem(item)) {
                    editorDecorationsDisposable.value = this.decorateAndRevealSymbolRange(item);
                }
            }));
            // Restore view state upon cancellation if we changed it
            disposables.add(functional_1.once(token.onCancellationRequested)(() => this.pickState.restoreEditorViewState()));
            // Start picker
            disposables.add(super.provide(picker, token));
            return disposables;
        }
        decorateAndRevealSymbolRange(pick) {
            const activeEditor = this.editorService.activeEditor;
            if (!resources_1.isEqual(pick.resource, activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.resource)) {
                return lifecycle_1.Disposable.None; // active editor needs to be for resource
            }
            const activeEditorControl = this.editorService.activeTextEditorControl;
            if (!activeEditorControl) {
                return lifecycle_1.Disposable.None; // we need a text editor control to decorate and reveal
            }
            // we must remember our curret view state to be able to restore
            this.pickState.rememberEditorViewState();
            // Reveal
            activeEditorControl.revealRangeInCenter(pick.range.selection, 0 /* Smooth */);
            // Decorate
            this.addDecorations(activeEditorControl, pick.range.decoration);
            return lifecycle_1.toDisposable(() => this.clearDecorations(activeEditorControl));
        }
        getPicks(originalFilter, disposables, token) {
            var _a, _b;
            // Find a suitable range from the pattern looking for ":", "#" or ","
            // unless we have the `@` editor symbol character inside the filter
            const filterWithRange = search_1.extractRangeFromFilter(originalFilter, [gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX]);
            // Update filter with normalized values
            let filter;
            if (filterWithRange) {
                filter = filterWithRange.filter;
            }
            else {
                filter = originalFilter;
            }
            // Remember as last range
            this.pickState.lastRange = filterWithRange === null || filterWithRange === void 0 ? void 0 : filterWithRange.range;
            // If the original filter value has changed but the normalized
            // one has not, we return early with a `null` result indicating
            // that the results should preserve because the range information
            // (:<line>:<column>) does not need to trigger any re-sorting.
            if (originalFilter !== this.pickState.lastOriginalFilter && filter === this.pickState.lastFilter) {
                return null;
            }
            // Remember as last filter
            const lastWasFiltering = !!this.pickState.lastOriginalFilter;
            this.pickState.lastOriginalFilter = originalFilter;
            this.pickState.lastFilter = filter;
            // Remember our pick state before returning new picks
            // unless an editor symbol is selected. We can use this
            // state to return back to the global pick when the
            // user is narrowing back out of editor symbols.
            const picks = (_a = this.pickState.picker) === null || _a === void 0 ? void 0 : _a.items;
            const activePick = (_b = this.pickState.picker) === null || _b === void 0 ? void 0 : _b.activeItems[0];
            if (picks && activePick) {
                if (!isEditorSymbolQuickPickItem(activePick)) {
                    this.pickState.lastGlobalPicks = {
                        items: picks,
                        active: activePick
                    };
                }
            }
            // `enableEditorSymbolSearch`: this will enable local editor symbol
            // search if the filter value includes `@` character. We only want
            // to enable this support though if the user was filtering in the
            // picker because this feature depends on an active item in the result
            // list to get symbols from. If we would simply trigger editor symbol
            // search without prior filtering, you could not paste a file name
            // including the `@` character to open it (e.g. /some/file@path)
            // refs: https://github.com/microsoft/vscode/issues/93845
            return this.doGetPicks(filter, { enableEditorSymbolSearch: lastWasFiltering }, disposables, token);
        }
        doGetPicks(filter, options, disposables, token) {
            var _a;
            const query = fuzzyScorer_1.prepareQuery(filter);
            // Return early if we have editor symbol picks. We support this by:
            // - having a previously active global pick (e.g. a file)
            // - the user typing `@` to start the local symbol query
            if (options.enableEditorSymbolSearch) {
                const editorSymbolPicks = this.getEditorSymbolPicks(query, disposables, token);
                if (editorSymbolPicks) {
                    return editorSymbolPicks;
                }
            }
            // If we have a known last active editor symbol pick, we try to restore
            // the last global pick to support the case of narrowing out from a
            // editor symbol search back into the global search
            const activePick = (_a = this.pickState.picker) === null || _a === void 0 ? void 0 : _a.activeItems[0];
            if (isEditorSymbolQuickPickItem(activePick) && this.pickState.lastGlobalPicks) {
                return this.pickState.lastGlobalPicks;
            }
            // Otherwise return normally with history and file/symbol results
            const historyEditorPicks = this.getEditorHistoryPicks(query);
            return {
                // Fast picks: editor history
                picks: (this.pickState.isQuickNavigating || historyEditorPicks.length === 0) ?
                    historyEditorPicks :
                    [
                        { type: 'separator', label: nls_1.localize('recentlyOpenedSeparator', "recently opened") },
                        ...historyEditorPicks
                    ],
                // Slow picks: files and symbols
                additionalPicks: (async () => {
                    // Exclude any result that is already present in editor history
                    const additionalPicksExcludes = new map_1.ResourceMap();
                    for (const historyEditorPick of historyEditorPicks) {
                        if (historyEditorPick.resource) {
                            additionalPicksExcludes.set(historyEditorPick.resource, true);
                        }
                    }
                    const additionalPicks = await this.getAdditionalPicks(query, additionalPicksExcludes, token);
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    return additionalPicks.length > 0 ? [
                        { type: 'separator', label: this.configuration.includeSymbols ? nls_1.localize('fileAndSymbolResultsSeparator', "file and symbol results") : nls_1.localize('fileResultsSeparator', "file results") },
                        ...additionalPicks
                    ] : [];
                })()
            };
        }
        async getAdditionalPicks(query, excludes, token) {
            // Resolve file and symbol picks (if enabled)
            const [filePicks, symbolPicks] = await Promise.all([
                this.getFilePicks(query, excludes, token),
                this.getWorkspaceSymbolPicks(query, token)
            ]);
            if (token.isCancellationRequested) {
                return [];
            }
            // Perform sorting (top results by score)
            const sortedAnythingPicks = arrays_1.top([...filePicks, ...symbolPicks], (anyPickA, anyPickB) => fuzzyScorer_1.compareItemsByFuzzyScore(anyPickA, anyPickB, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache), AnythingQuickAccessProvider.MAX_RESULTS);
            // Perform filtering
            const filteredAnythingPicks = [];
            for (const anythingPick of sortedAnythingPicks) {
                // Always preserve any existing highlights (e.g. from workspace symbols)
                if (anythingPick.highlights) {
                    filteredAnythingPicks.push(anythingPick);
                }
                // Otherwise, do the scoring and matching here
                else {
                    const { score, labelMatch, descriptionMatch } = fuzzyScorer_1.scoreItemFuzzy(anythingPick, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                    if (!score) {
                        continue;
                    }
                    anythingPick.highlights = {
                        label: labelMatch,
                        description: descriptionMatch
                    };
                    filteredAnythingPicks.push(anythingPick);
                }
            }
            return filteredAnythingPicks;
        }
        getEditorHistoryPicks(query) {
            const configuration = this.configuration;
            // Just return all history entries if not searching
            if (!query.normalized) {
                return this.historyService.getHistory().map(editor => this.createAnythingPick(editor, configuration));
            }
            if (!this.configuration.includeHistory) {
                return []; // disabled when searching
            }
            // Perform filtering
            const editorHistoryScorerAccessor = query.containsPathSeparator ? quickInput_1.quickPickItemScorerAccessor : this.labelOnlyEditorHistoryPickAccessor; // Only match on label of the editor unless the search includes path separators
            const editorHistoryPicks = [];
            for (const editor of this.historyService.getHistory()) {
                const resource = editor.resource;
                if (!resource || (!this.fileService.canHandleResource(resource) && resource.scheme !== network_1.Schemas.untitled)) {
                    continue; // exclude editors without file resource if we are searching by pattern
                }
                const editorHistoryPick = this.createAnythingPick(editor, configuration);
                const { score, labelMatch, descriptionMatch } = fuzzyScorer_1.scoreItemFuzzy(editorHistoryPick, query, false, editorHistoryScorerAccessor, this.pickState.scorerCache);
                if (!score) {
                    continue; // exclude editors not matching query
                }
                editorHistoryPick.highlights = {
                    label: labelMatch,
                    description: descriptionMatch
                };
                editorHistoryPicks.push(editorHistoryPick);
            }
            // Return without sorting if settings tell to sort by recency
            if (this.configuration.historyFilterSortOrder === 'recency') {
                return editorHistoryPicks;
            }
            // Perform sorting
            return editorHistoryPicks.sort((editorA, editorB) => fuzzyScorer_1.compareItemsByFuzzyScore(editorA, editorB, query, false, editorHistoryScorerAccessor, this.pickState.scorerCache));
        }
        createFileQueryCache() {
            return new cacheState_1.FileQueryCacheState(cacheKey => this.fileQueryBuilder.file(this.contextService.getWorkspace().folders, this.getFileQueryOptions({ cacheKey })), query => this.searchService.fileSearch(query), cacheKey => this.searchService.clearCache(cacheKey), this.pickState.fileQueryCache).load();
        }
        async getFilePicks(query, excludes, token) {
            var _a;
            if (!query.normalized) {
                return [];
            }
            // Absolute path result
            const absolutePathResult = await this.getAbsolutePathFileResult(query, token);
            if (token.isCancellationRequested) {
                return [];
            }
            // Use absolute path result as only results if present
            let fileMatches;
            if (absolutePathResult) {
                if (excludes.has(absolutePathResult)) {
                    return []; // excluded
                }
                // Create a single result pick and make sure to apply full
                // highlights to ensure the pick is displayed. Since a
                // ~ might have been used for searching, our fuzzy scorer
                // may otherwise not properly respect the pick as a result
                const absolutePathPick = this.createAnythingPick(absolutePathResult, this.configuration);
                absolutePathPick.highlights = {
                    label: [{ start: 0, end: absolutePathPick.label.length }],
                    description: absolutePathPick.description ? [{ start: 0, end: absolutePathPick.description.length }] : undefined
                };
                return [absolutePathPick];
            }
            // Otherwise run the file search (with a delayer if cache is not ready yet)
            if ((_a = this.pickState.fileQueryCache) === null || _a === void 0 ? void 0 : _a.isLoaded) {
                fileMatches = await this.doFileSearch(query, token);
            }
            else {
                fileMatches = await this.fileQueryDelayer.trigger(async () => {
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    return this.doFileSearch(query, token);
                });
            }
            if (token.isCancellationRequested) {
                return [];
            }
            // Filter excludes & convert to picks
            const configuration = this.configuration;
            return fileMatches
                .filter(resource => !excludes.has(resource))
                .map(resource => this.createAnythingPick(resource, configuration));
        }
        async doFileSearch(query, token) {
            const [fileSearchResults, relativePathFileResults] = await Promise.all([
                // File search: this is a search over all files of the workspace using the provided pattern
                this.getFileSearchResults(query, token),
                // Relative path search: we also want to consider results that match files inside the workspace
                // by looking for relative paths that the user typed as query. This allows to return even excluded
                // results into the picker if found (e.g. helps for opening compilation results that are otherwise
                // excluded)
                this.getRelativePathFileResults(query, token)
            ]);
            if (token.isCancellationRequested) {
                return [];
            }
            // Return quickly if no relative results are present
            if (!relativePathFileResults) {
                return fileSearchResults;
            }
            // Otherwise, make sure to filter relative path results from
            // the search results to prevent duplicates
            const relativePathFileResultsMap = new map_1.ResourceMap();
            for (const relativePathFileResult of relativePathFileResults) {
                relativePathFileResultsMap.set(relativePathFileResult, true);
            }
            return [
                ...fileSearchResults.filter(result => !relativePathFileResultsMap.has(result)),
                ...relativePathFileResults
            ];
        }
        async getFileSearchResults(query, token) {
            // filePattern for search depends on the number of queries in input:
            // - with multiple: only take the first one and let the filter later drop non-matching results
            // - with single: just take the original in full
            //
            // This enables to e.g. search for "someFile someFolder" by only returning
            // search results for "someFile" and not both that would normally not match.
            //
            let filePattern = '';
            if (query.values && query.values.length > 1) {
                filePattern = query.values[0].original;
            }
            else {
                filePattern = query.original;
            }
            const fileSearchResults = await this.doGetFileSearchResults(filePattern, token);
            if (token.isCancellationRequested) {
                return [];
            }
            // If we detect that the search limit has been hit and we have a query
            // that was composed of multiple inputs where we only took the first part
            // we run another search with the full original query included to make
            // sure we are including all possible results that could match.
            if (fileSearchResults.limitHit && query.values && query.values.length > 1) {
                const additionalFileSearchResults = await this.doGetFileSearchResults(query.original, token);
                if (token.isCancellationRequested) {
                    return [];
                }
                // Remember which result we already covered
                const existingFileSearchResultsMap = new map_1.ResourceMap();
                for (const fileSearchResult of fileSearchResults.results) {
                    existingFileSearchResultsMap.set(fileSearchResult.resource, true);
                }
                // Add all additional results to the original set for inclusion
                for (const additionalFileSearchResult of additionalFileSearchResults.results) {
                    if (!existingFileSearchResultsMap.has(additionalFileSearchResult.resource)) {
                        fileSearchResults.results.push(additionalFileSearchResult);
                    }
                }
            }
            return fileSearchResults.results.map(result => result.resource);
        }
        doGetFileSearchResults(filePattern, token) {
            var _a;
            return this.searchService.fileSearch(this.fileQueryBuilder.file(this.contextService.getWorkspace().folders, this.getFileQueryOptions({
                filePattern,
                cacheKey: (_a = this.pickState.fileQueryCache) === null || _a === void 0 ? void 0 : _a.cacheKey,
                maxResults: AnythingQuickAccessProvider.MAX_RESULTS
            })), token);
        }
        getFileQueryOptions(input) {
            return {
                _reason: 'openFileHandler',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                filePattern: input.filePattern || '',
                cacheKey: input.cacheKey,
                maxResults: input.maxResults || 0,
                sortByScore: true
            };
        }
        async getAbsolutePathFileResult(query, token) {
            if (!query.containsPathSeparator) {
                return;
            }
            const userHome = await this.pathService.userHome;
            const detildifiedQuery = labels_1.untildify(query.original, userHome.scheme === network_1.Schemas.file ? userHome.fsPath : userHome.path);
            if (token.isCancellationRequested) {
                return;
            }
            const isAbsolutePathQuery = (await this.pathService.path).isAbsolute(detildifiedQuery);
            if (token.isCancellationRequested) {
                return;
            }
            if (isAbsolutePathQuery) {
                const resource = resources_1.toLocalResource(await this.pathService.fileURI(detildifiedQuery), this.environmentService.configuration.remoteAuthority);
                if (token.isCancellationRequested) {
                    return;
                }
                try {
                    if ((await this.fileService.resolve(resource)).isFile) {
                        return resource;
                    }
                }
                catch (error) {
                    // ignore if file does not exist
                }
            }
            return;
        }
        async getRelativePathFileResults(query, token) {
            if (!query.containsPathSeparator) {
                return;
            }
            // Convert relative paths to absolute paths over all folders of the workspace
            // and return them as results if the absolute paths exist
            const isAbsolutePathQuery = (await this.pathService.path).isAbsolute(query.original);
            if (!isAbsolutePathQuery) {
                const resources = [];
                for (const folder of this.contextService.getWorkspace().folders) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    const resource = resources_1.toLocalResource(folder.toResource(query.original), this.environmentService.configuration.remoteAuthority);
                    try {
                        if ((await this.fileService.resolve(resource)).isFile) {
                            resources.push(resource);
                        }
                    }
                    catch (error) {
                        // ignore if file does not exist
                    }
                }
                return resources;
            }
            return;
        }
        async getWorkspaceSymbolPicks(query, token) {
            const configuration = this.configuration;
            if (!query.normalized || // we need a value for search for
                !configuration.includeSymbols || // we need to enable symbols in search
                this.pickState.lastRange // a range is an indicator for just searching for files
            ) {
                return [];
            }
            // Delegate to the existing symbols quick access
            // but skip local results and also do not score
            return this.workspaceSymbolsQuickAccess.getSymbolPicks(query.original, {
                skipLocal: true,
                skipSorting: true,
                delay: AnythingQuickAccessProvider.TYPING_SEARCH_DELAY
            }, token);
        }
        getEditorSymbolPicks(query, disposables, token) {
            var _a, _b;
            const filterSegments = query.original.split(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX);
            const filter = filterSegments.length > 1 ? filterSegments[filterSegments.length - 1].trim() : undefined;
            if (typeof filter !== 'string') {
                return null; // we need to be searched for editor symbols via `@`
            }
            const activeGlobalPick = (_a = this.pickState.lastGlobalPicks) === null || _a === void 0 ? void 0 : _a.active;
            if (!activeGlobalPick) {
                return null; // we need an active global pick to find symbols for
            }
            const activeGlobalResource = activeGlobalPick.resource;
            if (!activeGlobalResource || (!this.fileService.canHandleResource(activeGlobalResource) && activeGlobalResource.scheme !== network_1.Schemas.untitled)) {
                return null; // we need a resource that we can resolve
            }
            if (activeGlobalPick.label.includes(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX) || ((_b = activeGlobalPick.description) === null || _b === void 0 ? void 0 : _b.includes(gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX))) {
                if (filterSegments.length < 3) {
                    return null; // require at least 2 `@` if our active pick contains `@` in label or description
                }
            }
            return this.doGetEditorSymbolPicks(activeGlobalPick, activeGlobalResource, filter, disposables, token);
        }
        async doGetEditorSymbolPicks(activeGlobalPick, activeGlobalResource, filter, disposables, token) {
            // Bring the editor to front to review symbols to go to
            try {
                // we must remember our curret view state to be able to restore
                this.pickState.rememberEditorViewState();
                // open it
                await this.editorService.openEditor({
                    resource: activeGlobalResource,
                    options: { preserveFocus: true, revealIfOpened: true, ignoreError: true }
                });
            }
            catch (error) {
                return []; // return if resource cannot be opened
            }
            if (token.isCancellationRequested) {
                return [];
            }
            // Obtain model from resource
            let model = this.modelService.getModel(activeGlobalResource);
            if (!model) {
                try {
                    const modelReference = disposables.add(await this.textModelService.createModelReference(activeGlobalResource));
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    model = modelReference.object.textEditorModel;
                }
                catch (error) {
                    return []; // return if model cannot be resolved
                }
            }
            // Ask provider for editor symbols
            const editorSymbolPicks = (await this.editorSymbolsQuickAccess.getSymbolPicks(model, filter, { extraContainerLabel: codicons_1.stripCodicons(activeGlobalPick.label) }, disposables, token));
            if (token.isCancellationRequested) {
                return [];
            }
            return editorSymbolPicks.map(editorSymbolPick => {
                // Preserve separators
                if (editorSymbolPick.type === 'separator') {
                    return editorSymbolPick;
                }
                // Convert editor symbols to anything pick
                return Object.assign(Object.assign({}, editorSymbolPick), { resource: activeGlobalResource, description: editorSymbolPick.description, trigger: (buttonIndex, keyMods) => {
                        var _a;
                        this.openAnything(activeGlobalResource, { keyMods, range: (_a = editorSymbolPick.range) === null || _a === void 0 ? void 0 : _a.selection, forceOpenSideBySide: true });
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    }, accept: (keyMods, event) => { var _a; return this.openAnything(activeGlobalResource, { keyMods, range: (_a = editorSymbolPick.range) === null || _a === void 0 ? void 0 : _a.selection, preserveFocus: event.inBackground, forcePinned: event.inBackground }); } });
            });
        }
        addDecorations(editor, range) {
            this.editorSymbolsQuickAccess.addDecorations(editor, range);
        }
        clearDecorations(editor) {
            this.editorSymbolsQuickAccess.clearDecorations(editor);
        }
        //#endregion
        //#region Helpers
        createAnythingPick(resourceOrEditor, configuration) {
            const isEditorHistoryEntry = !uri_1.URI.isUri(resourceOrEditor);
            let resource;
            let label;
            let description = undefined;
            let isDirty = undefined;
            if (resourceOrEditor instanceof editor_1.EditorInput) {
                resource = resourceOrEditor.resource;
                label = resourceOrEditor.getName();
                description = resourceOrEditor.getDescription();
                isDirty = resourceOrEditor.isDirty() && !resourceOrEditor.isSaving();
            }
            else {
                resource = uri_1.URI.isUri(resourceOrEditor) ? resourceOrEditor : resourceOrEditor.resource;
                label = resources_1.basenameOrAuthority(resource);
                description = this.labelService.getUriLabel(resources_1.dirname(resource), { relative: true });
                isDirty = this.workingCopyService.isDirty(resource) && !configuration.shortAutoSaveDelay;
            }
            const labelAndDescription = description ? `${label} ${description}` : label;
            return {
                resource,
                label,
                ariaLabel: isDirty ? nls_1.localize('filePickAriaLabelDirty', "{0} dirty", labelAndDescription) : labelAndDescription,
                description,
                iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource),
                buttons: (() => {
                    const openSideBySideDirection = configuration.openSideBySideDirection;
                    const buttons = [];
                    // Open to side / below
                    buttons.push({
                        iconClass: openSideBySideDirection === 'right' ? codicons_1.Codicon.splitHorizontal.classNames : codicons_1.Codicon.splitVertical.classNames,
                        tooltip: openSideBySideDirection === 'right' ?
                            nls_1.localize({ key: 'openToSide', comment: ['Open this file in a split editor on the left/right side'] }, "Open to the Side") :
                            nls_1.localize({ key: 'openToBottom', comment: ['Open this file in a split editor on the bottom'] }, "Open to the Bottom")
                    });
                    // Remove from History
                    if (isEditorHistoryEntry) {
                        buttons.push({
                            iconClass: isDirty ? ('dirty-anything ' + codicons_1.Codicon.circleFilled.classNames) : codicons_1.Codicon.close.classNames,
                            tooltip: nls_1.localize('closeEditor', "Remove from Recently Opened"),
                            alwaysVisible: isDirty
                        });
                    }
                    return buttons;
                })(),
                trigger: (buttonIndex, keyMods) => {
                    switch (buttonIndex) {
                        // Open to side / below
                        case 0:
                            this.openAnything(resourceOrEditor, { keyMods, range: this.pickState.lastRange, forceOpenSideBySide: true });
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        // Remove from History
                        case 1:
                            if (!uri_1.URI.isUri(resourceOrEditor)) {
                                this.historyService.remove(resourceOrEditor);
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                            }
                    }
                    return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                },
                accept: (keyMods, event) => this.openAnything(resourceOrEditor, { keyMods, range: this.pickState.lastRange, preserveFocus: event.inBackground, forcePinned: event.inBackground })
            };
        }
        async openAnything(resourceOrEditor, options) {
            var _a, _b;
            const editorOptions = {
                preserveFocus: options.preserveFocus,
                pinned: ((_a = options.keyMods) === null || _a === void 0 ? void 0 : _a.alt) || options.forcePinned || this.configuration.openEditorPinned,
                selection: options.range ? range_1.Range.collapseToStart(options.range) : undefined
            };
            const targetGroup = ((_b = options.keyMods) === null || _b === void 0 ? void 0 : _b.ctrlCmd) || options.forceOpenSideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP;
            // Restore any view state if the target is the side group
            if (targetGroup === editorService_1.SIDE_GROUP) {
                await this.pickState.restoreEditorViewState();
            }
            // Open editor
            if (resourceOrEditor instanceof editor_1.EditorInput) {
                await this.editorService.openEditor(resourceOrEditor, editorOptions);
            }
            else {
                await this.editorService.openEditor({
                    resource: uri_1.URI.isUri(resourceOrEditor) ? resourceOrEditor : resourceOrEditor.resource,
                    options: editorOptions
                }, targetGroup);
            }
        }
    };
    AnythingQuickAccessProvider.PREFIX = '';
    AnythingQuickAccessProvider.MAX_RESULTS = 512;
    AnythingQuickAccessProvider.TYPING_SEARCH_DELAY = 200; // this delay accommodates for the user typing a word and then stops typing to start searching
    AnythingQuickAccessProvider = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, search_2.ISearchService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, pathService_1.IPathService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, label_1.ILabelService),
        __param(7, modelService_1.IModelService),
        __param(8, modeService_1.IModeService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, editorService_1.IEditorService),
        __param(12, history_1.IHistoryService),
        __param(13, filesConfigurationService_1.IFilesConfigurationService),
        __param(14, resolverService_1.ITextModelService)
    ], AnythingQuickAccessProvider);
    exports.AnythingQuickAccessProvider = AnythingQuickAccessProvider;
});
//# __sourceMappingURL=anythingQuickAccess.js.map