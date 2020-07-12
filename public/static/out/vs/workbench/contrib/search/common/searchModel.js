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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/modelService", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/search/common/replace", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/search/common/replace", "vs/workbench/services/search/common/searchHelpers", "vs/base/common/types", "vs/base/common/decorators", "vs/platform/configuration/common/configuration", "vs/base/common/comparers"], function (require, exports, async_1, cancellation_1, errors, event_1, labels_1, lifecycle_1, map_1, objects, strings_1, uri_1, range_1, model_1, textModel_1, modelService_1, instantiation_1, replace_1, search_1, telemetry_1, colorRegistry_1, themeService_1, replace_2, searchHelpers_1, types_1, decorators_1, configuration_1, comparers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeHighlightDecorations = exports.ISearchWorkbenchService = exports.SearchWorkbenchService = exports.SearchModel = exports.SearchResult = exports.searchMatchComparer = exports.FolderMatchWithResource = exports.FolderMatch = exports.FileMatch = exports.Match = void 0;
    class Match {
        constructor(_parent, _fullPreviewLines, _fullPreviewRange, _documentRange) {
            this._parent = _parent;
            this._fullPreviewLines = _fullPreviewLines;
            this._oneLinePreviewText = _fullPreviewLines[_fullPreviewRange.startLineNumber];
            const adjustedEndCol = _fullPreviewRange.startLineNumber === _fullPreviewRange.endLineNumber ?
                _fullPreviewRange.endColumn :
                this._oneLinePreviewText.length;
            this._rangeInPreviewText = new search_1.OneLineRange(1, _fullPreviewRange.startColumn + 1, adjustedEndCol + 1);
            this._range = new range_1.Range(_documentRange.startLineNumber + 1, _documentRange.startColumn + 1, _documentRange.endLineNumber + 1, _documentRange.endColumn + 1);
            this._fullPreviewRange = _fullPreviewRange;
            this._id = this._parent.id() + '>' + this._range + this.getMatchString();
        }
        id() {
            return this._id;
        }
        parent() {
            return this._parent;
        }
        text() {
            return this._oneLinePreviewText;
        }
        range() {
            return this._range;
        }
        preview() {
            let before = this._oneLinePreviewText.substring(0, this._rangeInPreviewText.startColumn - 1), inside = this.getMatchString(), after = this._oneLinePreviewText.substring(this._rangeInPreviewText.endColumn - 1);
            before = strings_1.lcut(before, 26);
            before = before.trimLeft();
            let charsRemaining = Match.MAX_PREVIEW_CHARS - before.length;
            inside = inside.substr(0, charsRemaining);
            charsRemaining -= inside.length;
            after = after.substr(0, charsRemaining);
            return {
                before,
                inside,
                after,
            };
        }
        get replaceString() {
            const searchModel = this.parent().parent().searchModel;
            if (!searchModel.replacePattern) {
                throw new Error('searchModel.replacePattern must be set before accessing replaceString');
            }
            const fullMatchText = this.fullMatchText();
            let replaceString = searchModel.replacePattern.getReplaceString(fullMatchText, searchModel.preserveCase);
            // If match string is not matching then regex pattern has a lookahead expression
            if (replaceString === null) {
                const fullMatchTextWithSurroundingContent = this.fullMatchText(true);
                replaceString = searchModel.replacePattern.getReplaceString(fullMatchTextWithSurroundingContent, searchModel.preserveCase);
                // Search/find normalize line endings - check whether \r prevents regex from matching
                if (replaceString === null) {
                    const fullMatchTextWithoutCR = fullMatchTextWithSurroundingContent.replace(/\r\n/g, '\n');
                    replaceString = searchModel.replacePattern.getReplaceString(fullMatchTextWithoutCR, searchModel.preserveCase);
                }
            }
            // Match string is still not matching. Could be unsupported matches (multi-line).
            if (replaceString === null) {
                replaceString = searchModel.replacePattern.pattern;
            }
            return replaceString;
        }
        fullMatchText(includeSurrounding = false) {
            let thisMatchPreviewLines;
            if (includeSurrounding) {
                thisMatchPreviewLines = this._fullPreviewLines;
            }
            else {
                thisMatchPreviewLines = this._fullPreviewLines.slice(this._fullPreviewRange.startLineNumber, this._fullPreviewRange.endLineNumber + 1);
                thisMatchPreviewLines[thisMatchPreviewLines.length - 1] = thisMatchPreviewLines[thisMatchPreviewLines.length - 1].slice(0, this._fullPreviewRange.endColumn);
                thisMatchPreviewLines[0] = thisMatchPreviewLines[0].slice(this._fullPreviewRange.startColumn);
            }
            return thisMatchPreviewLines.join('\n');
        }
        rangeInPreview() {
            // convert to editor's base 1 positions.
            return Object.assign(Object.assign({}, this._fullPreviewRange), { startColumn: this._fullPreviewRange.startColumn + 1, endColumn: this._fullPreviewRange.endColumn + 1 });
        }
        fullPreviewLines() {
            return this._fullPreviewLines.slice(this._fullPreviewRange.startLineNumber, this._fullPreviewRange.endLineNumber + 1);
        }
        getMatchString() {
            return this._oneLinePreviewText.substring(this._rangeInPreviewText.startColumn - 1, this._rangeInPreviewText.endColumn - 1);
        }
    }
    Match.MAX_PREVIEW_CHARS = 250;
    __decorate([
        decorators_1.memoize
    ], Match.prototype, "preview", null);
    exports.Match = Match;
    let FileMatch = class FileMatch extends lifecycle_1.Disposable {
        constructor(_query, _previewOptions, _maxResults, _parent, rawMatch, modelService, replaceService) {
            super();
            this._query = _query;
            this._previewOptions = _previewOptions;
            this._maxResults = _maxResults;
            this._parent = _parent;
            this.rawMatch = rawMatch;
            this.modelService = modelService;
            this.replaceService = replaceService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._model = null;
            this._modelListener = null;
            this._selectedMatch = null;
            this._modelDecorations = [];
            this._context = new Map();
            this._resource = this.rawMatch.resource;
            this._matches = new Map();
            this._removedMatches = new Set();
            this._updateScheduler = new async_1.RunOnceScheduler(this.updateMatchesForModel.bind(this), 250);
            this.createMatches();
        }
        static getDecorationOption(selected) {
            return (selected ? FileMatch._CURRENT_FIND_MATCH : FileMatch._FIND_MATCH);
        }
        get context() {
            return new Map(this._context);
        }
        createMatches() {
            const model = this.modelService.getModel(this._resource);
            if (model) {
                this.bindModel(model);
                this.updateMatchesForModel();
            }
            else {
                this.rawMatch.results
                    .filter(search_1.resultIsMatch)
                    .forEach(rawMatch => {
                    textSearchResultToMatches(rawMatch, this)
                        .forEach(m => this.add(m));
                });
                this.addContext(this.rawMatch.results);
            }
        }
        bindModel(model) {
            this._model = model;
            this._modelListener = this._model.onDidChangeContent(() => {
                this._updateScheduler.schedule();
            });
            this._model.onWillDispose(() => this.onModelWillDispose());
            this.updateHighlights();
        }
        onModelWillDispose() {
            // Update matches because model might have some dirty changes
            this.updateMatchesForModel();
            this.unbindModel();
        }
        unbindModel() {
            if (this._model) {
                this._updateScheduler.cancel();
                this._model.deltaDecorations(this._modelDecorations, []);
                this._model = null;
                this._modelListener.dispose();
            }
        }
        updateMatchesForModel() {
            // this is called from a timeout and might fire
            // after the model has been disposed
            if (!this._model) {
                return;
            }
            this._matches = new Map();
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const matches = this._model
                .findMatches(this._query.pattern, this._model.getFullModelRange(), !!this._query.isRegExp, !!this._query.isCaseSensitive, wordSeparators, false, this._maxResults);
            this.updateMatches(matches, true);
        }
        updatesMatchesForLineAfterReplace(lineNumber, modelChange) {
            if (!this._model) {
                return;
            }
            const range = {
                startLineNumber: lineNumber,
                startColumn: this._model.getLineMinColumn(lineNumber),
                endLineNumber: lineNumber,
                endColumn: this._model.getLineMaxColumn(lineNumber)
            };
            const oldMatches = Array.from(this._matches.values()).filter(match => match.range().startLineNumber === lineNumber);
            oldMatches.forEach(match => this._matches.delete(match.id()));
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const matches = this._model.findMatches(this._query.pattern, range, !!this._query.isRegExp, !!this._query.isCaseSensitive, wordSeparators, false, this._maxResults);
            this.updateMatches(matches, modelChange);
        }
        updateMatches(matches, modelChange) {
            if (!this._model) {
                return;
            }
            const textSearchResults = searchHelpers_1.editorMatchesToTextSearchResults(matches, this._model, this._previewOptions);
            textSearchResults.forEach(textSearchResult => {
                textSearchResultToMatches(textSearchResult, this).forEach(match => {
                    if (!this._removedMatches.has(match.id())) {
                        this.add(match);
                        if (this.isMatchSelected(match)) {
                            this._selectedMatch = match;
                        }
                    }
                });
            });
            this.addContext(searchHelpers_1.addContextToEditorMatches(textSearchResults, this._model, this.parent().parent().query)
                .filter((result => !search_1.resultIsMatch(result)))
                .map(context => (Object.assign(Object.assign({}, context), { lineNumber: context.lineNumber + 1 }))));
            this._onChange.fire({ forceUpdateModel: modelChange });
            this.updateHighlights();
        }
        updateHighlights() {
            if (!this._model) {
                return;
            }
            if (this.parent().showHighlights) {
                this._modelDecorations = this._model.deltaDecorations(this._modelDecorations, this.matches().map(match => ({
                    range: match.range(),
                    options: FileMatch.getDecorationOption(this.isMatchSelected(match))
                })));
            }
            else {
                this._modelDecorations = this._model.deltaDecorations(this._modelDecorations, []);
            }
        }
        id() {
            return this.resource.toString();
        }
        parent() {
            return this._parent;
        }
        matches() {
            return Array.from(this._matches.values());
        }
        remove(match) {
            this.removeMatch(match);
            this._removedMatches.add(match.id());
            this._onChange.fire({ didRemove: true });
        }
        replace(toReplace) {
            return this.replaceService.replace(toReplace)
                .then(() => this.updatesMatchesForLineAfterReplace(toReplace.range().startLineNumber, false));
        }
        setSelectedMatch(match) {
            if (match) {
                if (!this._matches.has(match.id())) {
                    return;
                }
                if (this.isMatchSelected(match)) {
                    return;
                }
            }
            this._selectedMatch = match;
            this.updateHighlights();
        }
        getSelectedMatch() {
            return this._selectedMatch;
        }
        isMatchSelected(match) {
            return !!this._selectedMatch && this._selectedMatch.id() === match.id();
        }
        count() {
            return this.matches().length;
        }
        get resource() {
            return this._resource;
        }
        name() {
            return labels_1.getBaseLabel(this.resource);
        }
        addContext(results) {
            if (!results) {
                return;
            }
            results
                .filter((result => !search_1.resultIsMatch(result)))
                .forEach(context => this._context.set(context.lineNumber, context.text));
        }
        add(match, trigger) {
            this._matches.set(match.id(), match);
            if (trigger) {
                this._onChange.fire({ forceUpdateModel: true });
            }
        }
        removeMatch(match) {
            this._matches.delete(match.id());
            if (this.isMatchSelected(match)) {
                this.setSelectedMatch(null);
            }
            else {
                this.updateHighlights();
            }
        }
        async resolveFileStat(fileService) {
            this._fileStat = await fileService.resolve(this.resource, { resolveMetadata: true });
        }
        get fileStat() {
            return this._fileStat;
        }
        set fileStat(stat) {
            this._fileStat = stat;
        }
        dispose() {
            this.setSelectedMatch(null);
            this.unbindModel();
            this._onDispose.fire();
            super.dispose();
        }
    };
    FileMatch._CURRENT_FIND_MATCH = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        zIndex: 13,
        className: 'currentFindMatch',
        overviewRuler: {
            color: themeService_1.themeColorFromId(colorRegistry_1.overviewRulerFindMatchForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: themeService_1.themeColorFromId(colorRegistry_1.minimapFindMatch),
            position: model_1.MinimapPosition.Inline
        }
    });
    FileMatch._FIND_MATCH = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'findMatch',
        overviewRuler: {
            color: themeService_1.themeColorFromId(colorRegistry_1.overviewRulerFindMatchForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: themeService_1.themeColorFromId(colorRegistry_1.minimapFindMatch),
            position: model_1.MinimapPosition.Inline
        }
    });
    FileMatch = __decorate([
        __param(5, modelService_1.IModelService), __param(6, replace_2.IReplaceService)
    ], FileMatch);
    exports.FileMatch = FileMatch;
    let FolderMatch = class FolderMatch extends lifecycle_1.Disposable {
        constructor(_resource, _id, _index, _query, _parent, _searchModel, replaceService, instantiationService) {
            super();
            this._resource = _resource;
            this._id = _id;
            this._index = _index;
            this._query = _query;
            this._parent = _parent;
            this._searchModel = _searchModel;
            this.replaceService = replaceService;
            this.instantiationService = instantiationService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._replacingAll = false;
            this._fileMatches = new map_1.ResourceMap();
            this._unDisposedFileMatches = new map_1.ResourceMap();
        }
        get searchModel() {
            return this._searchModel;
        }
        get showHighlights() {
            return this._parent.showHighlights;
        }
        set replacingAll(b) {
            this._replacingAll = b;
        }
        id() {
            return this._id;
        }
        get resource() {
            return this._resource;
        }
        index() {
            return this._index;
        }
        name() {
            return labels_1.getBaseLabel(types_1.withNullAsUndefined(this.resource)) || '';
        }
        parent() {
            return this._parent;
        }
        bindModel(model) {
            const fileMatch = this._fileMatches.get(model.uri);
            if (fileMatch) {
                fileMatch.bindModel(model);
            }
        }
        add(raw, silent) {
            const added = [];
            const updated = [];
            raw.forEach(rawFileMatch => {
                const existingFileMatch = this._fileMatches.get(rawFileMatch.resource);
                if (existingFileMatch) {
                    rawFileMatch
                        .results
                        .filter(search_1.resultIsMatch)
                        .forEach(m => {
                        textSearchResultToMatches(m, existingFileMatch)
                            .forEach(m => existingFileMatch.add(m));
                    });
                    updated.push(existingFileMatch);
                    existingFileMatch.addContext(rawFileMatch.results);
                }
                else {
                    const fileMatch = this.instantiationService.createInstance(FileMatch, this._query.contentPattern, this._query.previewOptions, this._query.maxResults, this, rawFileMatch);
                    this.doAdd(fileMatch);
                    added.push(fileMatch);
                    const disposable = fileMatch.onChange(({ didRemove }) => this.onFileChange(fileMatch, didRemove));
                    fileMatch.onDispose(() => disposable.dispose());
                }
            });
            const elements = [...added, ...updated];
            if (!silent && elements.length) {
                this._onChange.fire({ elements, added: !!added.length });
            }
        }
        clear() {
            const changed = this.matches();
            this.disposeMatches();
            this._onChange.fire({ elements: changed, removed: true });
        }
        remove(matches) {
            this.doRemove(matches);
        }
        replace(match) {
            return this.replaceService.replace([match]).then(() => {
                this.doRemove(match);
            });
        }
        replaceAll() {
            const matches = this.matches();
            return this.replaceService.replace(matches).then(() => this.doRemove(matches));
        }
        matches() {
            return [...this._fileMatches.values()];
        }
        isEmpty() {
            return this.fileCount() === 0;
        }
        fileCount() {
            return this._fileMatches.size;
        }
        count() {
            return this.matches().reduce((prev, match) => prev + match.count(), 0);
        }
        onFileChange(fileMatch, removed = false) {
            let added = false;
            if (!this._fileMatches.has(fileMatch.resource)) {
                this.doAdd(fileMatch);
                added = true;
            }
            if (fileMatch.count() === 0) {
                this.doRemove(fileMatch, false, false);
                added = false;
                removed = true;
            }
            if (!this._replacingAll) {
                this._onChange.fire({ elements: [fileMatch], added: added, removed: removed });
            }
        }
        doAdd(fileMatch) {
            this._fileMatches.set(fileMatch.resource, fileMatch);
            if (this._unDisposedFileMatches.has(fileMatch.resource)) {
                this._unDisposedFileMatches.delete(fileMatch.resource);
            }
        }
        doRemove(fileMatches, dispose = true, trigger = true) {
            if (!Array.isArray(fileMatches)) {
                fileMatches = [fileMatches];
            }
            for (let match of fileMatches) {
                this._fileMatches.delete(match.resource);
                if (dispose) {
                    match.dispose();
                }
                else {
                    this._unDisposedFileMatches.set(match.resource, match);
                }
            }
            if (trigger) {
                this._onChange.fire({ elements: fileMatches, removed: true });
            }
        }
        disposeMatches() {
            [...this._fileMatches.values()].forEach((fileMatch) => fileMatch.dispose());
            [...this._unDisposedFileMatches.values()].forEach((fileMatch) => fileMatch.dispose());
            this._fileMatches.clear();
            this._unDisposedFileMatches.clear();
        }
        dispose() {
            this.disposeMatches();
            this._onDispose.fire();
            super.dispose();
        }
    };
    FolderMatch = __decorate([
        __param(6, replace_2.IReplaceService),
        __param(7, instantiation_1.IInstantiationService)
    ], FolderMatch);
    exports.FolderMatch = FolderMatch;
    /**
     * BaseFolderMatch => optional resource ("other files" node)
     * FolderMatch => required resource (normal folder node)
     */
    let FolderMatchWithResource = class FolderMatchWithResource extends FolderMatch {
        constructor(_resource, _id, _index, _query, _parent, _searchModel, replaceService, instantiationService) {
            super(_resource, _id, _index, _query, _parent, _searchModel, replaceService, instantiationService);
        }
        get resource() {
            return this._resource;
        }
    };
    FolderMatchWithResource = __decorate([
        __param(6, replace_2.IReplaceService),
        __param(7, instantiation_1.IInstantiationService)
    ], FolderMatchWithResource);
    exports.FolderMatchWithResource = FolderMatchWithResource;
    /**
     * Compares instances of the same match type. Different match types should not be siblings
     * and their sort order is undefined.
     */
    function searchMatchComparer(elementA, elementB, sortOrder = "default" /* Default */) {
        if (elementA instanceof FolderMatch && elementB instanceof FolderMatch) {
            return elementA.index() - elementB.index();
        }
        if (elementA instanceof FileMatch && elementB instanceof FileMatch) {
            switch (sortOrder) {
                case "countDescending" /* CountDescending */:
                    return elementB.count() - elementA.count();
                case "countAscending" /* CountAscending */:
                    return elementA.count() - elementB.count();
                case "type" /* Type */:
                    return comparers_1.compareFileExtensions(elementA.name(), elementB.name());
                case "fileNames" /* FileNames */:
                    return comparers_1.compareFileNames(elementA.name(), elementB.name());
                case "modified" /* Modified */:
                    const fileStatA = elementA.fileStat;
                    const fileStatB = elementB.fileStat;
                    if (fileStatA && fileStatB) {
                        return fileStatB.mtime - fileStatA.mtime;
                    }
                // Fall through otherwise
                default:
                    return comparers_1.comparePaths(elementA.resource.fsPath, elementB.resource.fsPath) || comparers_1.compareFileNames(elementA.name(), elementB.name());
            }
        }
        if (elementA instanceof Match && elementB instanceof Match) {
            return range_1.Range.compareRangesUsingStarts(elementA.range(), elementB.range());
        }
        return 0;
    }
    exports.searchMatchComparer = searchMatchComparer;
    let SearchResult = class SearchResult extends lifecycle_1.Disposable {
        constructor(_searchModel, replaceService, telemetryService, instantiationService, modelService) {
            super();
            this._searchModel = _searchModel;
            this.replaceService = replaceService;
            this.telemetryService = telemetryService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._folderMatches = [];
            this._otherFilesMatch = null;
            this._folderMatchesMap = map_1.TernarySearchTree.forUris();
            this._showHighlights = false;
            this._query = null;
            this.disposePastResults = () => { };
            this._isDirty = false;
            this._rangeHighlightDecorations = this.instantiationService.createInstance(RangeHighlightDecorations);
            this._register(this.modelService.onModelAdded(model => this.onModelAdded(model)));
            this._register(this.onChange(e => {
                if (e.removed) {
                    this._isDirty = !this.isEmpty();
                }
            }));
        }
        get isDirty() {
            return this._isDirty;
        }
        get query() {
            return this._query;
        }
        set query(query) {
            // When updating the query we could change the roots, so keep a reference to them to clean up when we trigger `disposePastResults`
            const oldFolderMatches = this.folderMatches();
            new Promise(resolve => this.disposePastResults = resolve)
                .then(() => oldFolderMatches.forEach(match => match.clear()))
                .then(() => oldFolderMatches.forEach(match => match.dispose()))
                .then(() => this._isDirty = false);
            this._rangeHighlightDecorations.removeHighlightRange();
            this._folderMatchesMap = map_1.TernarySearchTree.forUris();
            if (!query) {
                return;
            }
            this._folderMatches = (query && query.folderQueries || [])
                .map(fq => fq.folder)
                .map((resource, index) => this.createFolderMatchWithResource(resource, resource.toString(), index, query));
            this._folderMatches.forEach(fm => this._folderMatchesMap.set(fm.resource, fm));
            this._otherFilesMatch = this.createOtherFilesFolderMatch('otherFiles', this._folderMatches.length + 1, query);
            this._query = query;
        }
        onModelAdded(model) {
            const folderMatch = this._folderMatchesMap.findSubstr(model.uri);
            if (folderMatch) {
                folderMatch.bindModel(model);
            }
        }
        createFolderMatchWithResource(resource, id, index, query) {
            return this._createBaseFolderMatch(FolderMatchWithResource, resource, id, index, query);
        }
        createOtherFilesFolderMatch(id, index, query) {
            return this._createBaseFolderMatch(FolderMatch, null, id, index, query);
        }
        _createBaseFolderMatch(folderMatchClass, resource, id, index, query) {
            const folderMatch = this.instantiationService.createInstance(folderMatchClass, resource, id, index, query, this, this._searchModel);
            const disposable = folderMatch.onChange((event) => this._onChange.fire(event));
            folderMatch.onDispose(() => disposable.dispose());
            return folderMatch;
        }
        get searchModel() {
            return this._searchModel;
        }
        add(allRaw, silent = false) {
            // Split up raw into a list per folder so we can do a batch add per folder.
            var _a;
            const { byFolder, other } = this.groupFilesByFolder(allRaw);
            byFolder.forEach(raw => {
                if (!raw.length) {
                    return;
                }
                const folderMatch = this.getFolderMatch(raw[0].resource);
                if (folderMatch) {
                    folderMatch.add(raw, silent);
                }
            });
            (_a = this._otherFilesMatch) === null || _a === void 0 ? void 0 : _a.add(other, silent);
            this.disposePastResults();
        }
        clear() {
            this.folderMatches().forEach((folderMatch) => folderMatch.clear());
            this.disposeMatches();
            this._folderMatches = [];
            this._otherFilesMatch = null;
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            matches.forEach(m => {
                if (m instanceof FolderMatch) {
                    m.clear();
                }
            });
            const fileMatches = matches.filter(m => m instanceof FileMatch);
            const { byFolder, other } = this.groupFilesByFolder(fileMatches);
            byFolder.forEach(matches => {
                if (!matches.length) {
                    return;
                }
                this.getFolderMatch(matches[0].resource).remove(matches);
            });
            if (other.length) {
                this.getFolderMatch(other[0].resource).remove(other);
            }
        }
        replace(match) {
            return this.getFolderMatch(match.resource).replace(match);
        }
        replaceAll(progress) {
            this.replacingAll = true;
            const promise = this.replaceService.replace(this.matches(), progress);
            const onDone = event_1.Event.stopwatch(event_1.Event.fromPromise(promise));
            /* __GDPR__
                "replaceAll.started" : {
                    "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                }
            */
            onDone(duration => this.telemetryService.publicLog('replaceAll.started', { duration }));
            return promise.then(() => {
                this.replacingAll = false;
                this.clear();
            }, () => {
                this.replacingAll = false;
            });
        }
        folderMatches() {
            return this._otherFilesMatch ?
                [
                    ...this._folderMatches,
                    this._otherFilesMatch
                ] :
                [
                    ...this._folderMatches
                ];
        }
        matches() {
            const matches = [];
            this.folderMatches().forEach(folderMatch => {
                matches.push(folderMatch.matches());
            });
            return [].concat(...matches);
        }
        isEmpty() {
            return this.folderMatches().every((folderMatch) => folderMatch.isEmpty());
        }
        fileCount() {
            return this.folderMatches().reduce((prev, match) => prev + match.fileCount(), 0);
        }
        count() {
            return this.matches().reduce((prev, match) => prev + match.count(), 0);
        }
        get showHighlights() {
            return this._showHighlights;
        }
        toggleHighlights(value) {
            if (this._showHighlights === value) {
                return;
            }
            this._showHighlights = value;
            let selectedMatch = null;
            this.matches().forEach((fileMatch) => {
                fileMatch.updateHighlights();
                if (!selectedMatch) {
                    selectedMatch = fileMatch.getSelectedMatch();
                }
            });
            if (this._showHighlights && selectedMatch) {
                // TS?
                this._rangeHighlightDecorations.highlightRange(selectedMatch.parent().resource, selectedMatch.range());
            }
            else {
                this._rangeHighlightDecorations.removeHighlightRange();
            }
        }
        get rangeHighlightDecorations() {
            return this._rangeHighlightDecorations;
        }
        getFolderMatch(resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            return folderMatch ? folderMatch : this._otherFilesMatch;
        }
        set replacingAll(running) {
            this.folderMatches().forEach((folderMatch) => {
                folderMatch.replacingAll = running;
            });
        }
        groupFilesByFolder(fileMatches) {
            const rawPerFolder = new map_1.ResourceMap();
            const otherFileMatches = [];
            this._folderMatches.forEach(fm => rawPerFolder.set(fm.resource, []));
            fileMatches.forEach(rawFileMatch => {
                const folderMatch = this.getFolderMatch(rawFileMatch.resource);
                if (!folderMatch) {
                    // foldermatch was previously removed by user or disposed for some reason
                    return;
                }
                const resource = folderMatch.resource;
                if (resource) {
                    rawPerFolder.get(resource).push(rawFileMatch);
                }
                else {
                    otherFileMatches.push(rawFileMatch);
                }
            });
            return {
                byFolder: rawPerFolder,
                other: otherFileMatches
            };
        }
        disposeMatches() {
            this.folderMatches().forEach(folderMatch => folderMatch.dispose());
            this._folderMatches = [];
            this._folderMatchesMap = map_1.TernarySearchTree.forUris();
            this._rangeHighlightDecorations.removeHighlightRange();
        }
        dispose() {
            this.disposePastResults();
            this.disposeMatches();
            this._rangeHighlightDecorations.dispose();
            super.dispose();
        }
    };
    SearchResult = __decorate([
        __param(1, replace_2.IReplaceService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, modelService_1.IModelService)
    ], SearchResult);
    exports.SearchResult = SearchResult;
    let SearchModel = class SearchModel extends lifecycle_1.Disposable {
        constructor(searchService, telemetryService, configurationService, instantiationService) {
            super();
            this.searchService = searchService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this._searchQuery = null;
            this._replaceActive = false;
            this._replaceString = null;
            this._replacePattern = null;
            this._preserveCase = false;
            this._startStreamDelay = Promise.resolve();
            this._resultQueue = [];
            this._onReplaceTermChanged = this._register(new event_1.Emitter());
            this.onReplaceTermChanged = this._onReplaceTermChanged.event;
            this.currentCancelTokenSource = null;
            this.searchCancelledForNewSearch = false;
            this._searchResult = this.instantiationService.createInstance(SearchResult, this);
        }
        isReplaceActive() {
            return this._replaceActive;
        }
        set replaceActive(replaceActive) {
            this._replaceActive = replaceActive;
        }
        get replacePattern() {
            return this._replacePattern;
        }
        get replaceString() {
            return this._replaceString || '';
        }
        set preserveCase(value) {
            this._preserveCase = value;
        }
        get preserveCase() {
            return this._preserveCase;
        }
        set replaceString(replaceString) {
            this._replaceString = replaceString;
            if (this._searchQuery) {
                this._replacePattern = new replace_1.ReplacePattern(replaceString, this._searchQuery.contentPattern);
            }
            this._onReplaceTermChanged.fire();
        }
        get searchResult() {
            return this._searchResult;
        }
        search(query, onProgress) {
            this.cancelSearch(true);
            this._searchQuery = query;
            if (!this.searchConfig.searchOnType) {
                this.searchResult.clear();
            }
            this._searchResult.query = this._searchQuery;
            const progressEmitter = new event_1.Emitter();
            this._replacePattern = new replace_1.ReplacePattern(this.replaceString, this._searchQuery.contentPattern);
            // In search on type case, delay the streaming of results just a bit, so that we don't flash the only "local results" fast path
            this._startStreamDelay = new Promise(resolve => setTimeout(resolve, this.searchConfig.searchOnType ? 150 : 0));
            const tokenSource = this.currentCancelTokenSource = new cancellation_1.CancellationTokenSource();
            const currentRequest = this.searchService.textSearch(this._searchQuery, this.currentCancelTokenSource.token, p => {
                progressEmitter.fire();
                this.onSearchProgress(p);
                if (onProgress) {
                    onProgress(p);
                }
            });
            const dispose = () => tokenSource.dispose();
            currentRequest.then(dispose, dispose);
            const onDone = event_1.Event.fromPromise(currentRequest);
            const onFirstRender = event_1.Event.any(onDone, progressEmitter.event);
            const onFirstRenderStopwatch = event_1.Event.stopwatch(onFirstRender);
            /* __GDPR__
                "searchResultsFirstRender" : {
                    "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                }
            */
            onFirstRenderStopwatch(duration => this.telemetryService.publicLog('searchResultsFirstRender', { duration }));
            const start = Date.now();
            currentRequest.then(value => this.onSearchCompleted(value, Date.now() - start), e => this.onSearchError(e, Date.now() - start));
            return currentRequest.finally(() => {
                /* __GDPR__
                    "searchResultsFinished" : {
                        "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('searchResultsFinished', { duration: Date.now() - start });
            });
        }
        onSearchCompleted(completed, duration) {
            if (!this._searchQuery) {
                throw new Error('onSearchCompleted must be called after a search is started');
            }
            this._searchResult.add(this._resultQueue);
            this._resultQueue = [];
            const options = objects.assign({}, this._searchQuery.contentPattern);
            delete options.pattern;
            const stats = completed && completed.stats;
            const fileSchemeOnly = this._searchQuery.folderQueries.every(fq => fq.folder.scheme === 'file');
            const otherSchemeOnly = this._searchQuery.folderQueries.every(fq => fq.folder.scheme !== 'file');
            const scheme = fileSchemeOnly ? 'file' :
                otherSchemeOnly ? 'other' :
                    'mixed';
            /* __GDPR__
                "searchResultsShown" : {
                    "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "fileCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "options": { "${inline}": [ "${IPatternInfo}" ] },
                    "duration": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "type" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "scheme" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "searchOnTypeEnabled" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('searchResultsShown', {
                count: this._searchResult.count(),
                fileCount: this._searchResult.fileCount(),
                options,
                duration,
                type: stats && stats.type,
                scheme,
                searchOnTypeEnabled: this.searchConfig.searchOnType
            });
            return completed;
        }
        onSearchError(e, duration) {
            if (errors.isPromiseCanceledError(e)) {
                this.onSearchCompleted(this.searchCancelledForNewSearch
                    ? { exit: 1 /* NewSearchStarted */, results: [] }
                    : null, duration);
                this.searchCancelledForNewSearch = false;
            }
        }
        async onSearchProgress(p) {
            if (p.resource) {
                this._resultQueue.push(p);
                await this._startStreamDelay;
                if (this._resultQueue.length) {
                    this._searchResult.add(this._resultQueue, true);
                    this._resultQueue = [];
                }
            }
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        cancelSearch(cancelledForNewSearch = false) {
            if (this.currentCancelTokenSource) {
                this.searchCancelledForNewSearch = cancelledForNewSearch;
                this.currentCancelTokenSource.cancel();
                return true;
            }
            return false;
        }
        dispose() {
            this.cancelSearch();
            this.searchResult.dispose();
            super.dispose();
        }
    };
    SearchModel = __decorate([
        __param(0, search_1.ISearchService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService)
    ], SearchModel);
    exports.SearchModel = SearchModel;
    let SearchWorkbenchService = class SearchWorkbenchService {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this._searchModel = null;
        }
        get searchModel() {
            if (!this._searchModel) {
                this._searchModel = this.instantiationService.createInstance(SearchModel);
            }
            return this._searchModel;
        }
    };
    SearchWorkbenchService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], SearchWorkbenchService);
    exports.SearchWorkbenchService = SearchWorkbenchService;
    exports.ISearchWorkbenchService = instantiation_1.createDecorator('searchWorkbenchService');
    /**
     * Can add a range highlight decoration to a model.
     * It will automatically remove it when the model has its decorations changed.
     */
    let RangeHighlightDecorations = class RangeHighlightDecorations {
        constructor(_modelService) {
            this._modelService = _modelService;
            this._decorationId = null;
            this._model = null;
            this._modelDisposables = new lifecycle_1.DisposableStore();
        }
        removeHighlightRange() {
            if (this._model && this._decorationId) {
                this._model.deltaDecorations([this._decorationId], []);
            }
            this._decorationId = null;
        }
        highlightRange(resource, range, ownerId = 0) {
            let model;
            if (uri_1.URI.isUri(resource)) {
                model = this._modelService.getModel(resource);
            }
            else {
                model = resource;
            }
            if (model) {
                this.doHighlightRange(model, range);
            }
        }
        doHighlightRange(model, range) {
            this.removeHighlightRange();
            this._decorationId = model.deltaDecorations([], [{ range: range, options: RangeHighlightDecorations._RANGE_HIGHLIGHT_DECORATION }])[0];
            this.setModel(model);
        }
        setModel(model) {
            if (this._model !== model) {
                this.clearModelListeners();
                this._model = model;
                this._modelDisposables.add(this._model.onDidChangeDecorations((e) => {
                    this.clearModelListeners();
                    this.removeHighlightRange();
                    this._model = null;
                }));
                this._modelDisposables.add(this._model.onWillDispose(() => {
                    this.clearModelListeners();
                    this.removeHighlightRange();
                    this._model = null;
                }));
            }
        }
        clearModelListeners() {
            this._modelDisposables.clear();
        }
        dispose() {
            if (this._model) {
                this.removeHighlightRange();
                this._modelDisposables.dispose();
                this._model = null;
            }
        }
    };
    RangeHighlightDecorations._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'rangeHighlight',
        isWholeLine: true
    });
    RangeHighlightDecorations = __decorate([
        __param(0, modelService_1.IModelService)
    ], RangeHighlightDecorations);
    exports.RangeHighlightDecorations = RangeHighlightDecorations;
    function textSearchResultToMatches(rawMatch, fileMatch) {
        const previewLines = rawMatch.preview.text.split('\n');
        if (Array.isArray(rawMatch.ranges)) {
            return rawMatch.ranges.map((r, i) => {
                const previewRange = rawMatch.preview.matches[i];
                return new Match(fileMatch, previewLines, previewRange, r);
            });
        }
        else {
            const previewRange = rawMatch.preview.matches;
            const match = new Match(fileMatch, previewLines, previewRange, rawMatch.ranges);
            return [match];
        }
    }
});
//# __sourceMappingURL=searchModel.js.map