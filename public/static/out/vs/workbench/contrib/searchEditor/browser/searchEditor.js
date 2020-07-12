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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/modelService", "vs/editor/common/services/textResourceConfigurationService", "vs/editor/contrib/gotoSymbol/peek/referencesController", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/contrib/search/browser/patternInputWidget", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/queryBuilder", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/search/browser/searchIcons", "vs/css!./media/searchEditor"], function (require, exports, DOM, keyboardEvent_1, aria_1, async_1, lifecycle_1, types_1, position_1, range_1, selection_1, modelService_1, textResourceConfigurationService_1, referencesController_1, nls_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, label_1, progress_1, storage_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, workspace_1, textEditor_1, patternInputWidget_1, searchWidget_1, constants_1, queryBuilder_1, search_1, searchModel_1, constants_2, searchEditorSerialization_1, editorGroupsService_1, editorService_1, searchIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.searchEditorTextInputBorder = exports.SearchEditor = void 0;
    const RESULT_LINE_REGEX = /^(\s+)(\d+)(:| )(\s+)(.*)$/;
    const FILE_LINE_REGEX = /^(\S.*):$/;
    let SearchEditor = class SearchEditor extends textEditor_1.BaseTextEditor {
        constructor(telemetryService, themeService, storageService, modelService, contextService, labelService, instantiationService, contextViewService, commandService, contextKeyService, progressService, textResourceService, editorGroupService, editorService, configurationService) {
            super(SearchEditor.ID, telemetryService, instantiationService, storageService, textResourceService, themeService, editorService, editorGroupService);
            this.modelService = modelService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.contextViewService = contextViewService;
            this.commandService = commandService;
            this.contextKeyService = contextKeyService;
            this.progressService = progressService;
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.runSearchDelayer = new async_1.Delayer(0);
            this.pauseSearching = false;
            this.showingIncludesExcludes = false;
            this.messageDisposables = [];
            this.container = DOM.$('.search-editor');
            const scopedContextKeyService = contextKeyService.createScoped(this.container);
            this.instantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            this.inSearchEditorContextKey = constants_2.InSearchEditor.bindTo(scopedContextKeyService);
            this.inSearchEditorContextKey.set(true);
            this.inputFocusContextKey = constants_1.InputBoxFocusedKey.bindTo(scopedContextKeyService);
            this.searchOperation = this._register(new progress_1.LongRunningOperation(progressService));
            this.searchHistoryDelayer = new async_1.Delayer(2000);
            this.searchModel = this._register(this.instantiationService.createInstance(searchModel_1.SearchModel));
        }
        createEditor(parent) {
            DOM.append(parent, this.container);
            this.createQueryEditor(this.container);
            this.createResultsEditor(this.container);
        }
        createQueryEditor(parent) {
            this.queryEditorContainer = DOM.append(parent, DOM.$('.query-container'));
            this.queryEditorWidget = this._register(this.instantiationService.createInstance(searchWidget_1.SearchWidget, this.queryEditorContainer, { _hideReplaceToggle: true, showContextToggle: true }));
            this._register(this.queryEditorWidget.onReplaceToggled(() => this.reLayout()));
            this._register(this.queryEditorWidget.onDidHeightChange(() => this.reLayout()));
            this.queryEditorWidget.onSearchSubmit(({ delay }) => this.triggerSearch({ delay }));
            this.queryEditorWidget.searchInput.onDidOptionChange(() => this.triggerSearch({ resetCursor: false }));
            this.queryEditorWidget.onDidToggleContext(() => this.triggerSearch({ resetCursor: false }));
            // Includes/Excludes Dropdown
            this.includesExcludesContainer = DOM.append(this.queryEditorContainer, DOM.$('.includes-excludes'));
            // // Toggle query details button
            this.toggleQueryDetailsButton = DOM.append(this.includesExcludesContainer, DOM.$('.expand' + searchIcons_1.searchDetailsIcon.cssSelector, { tabindex: 0, role: 'button', title: nls_1.localize('moreSearch', "Toggle Search Details") }));
            this._register(DOM.addDisposableListener(this.toggleQueryDetailsButton, DOM.EventType.CLICK, e => {
                DOM.EventHelper.stop(e);
                this.toggleIncludesExcludes();
            }));
            this._register(DOM.addDisposableListener(this.toggleQueryDetailsButton, DOM.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* Enter */) || event.equals(10 /* Space */)) {
                    DOM.EventHelper.stop(e);
                    this.toggleIncludesExcludes();
                }
            }));
            this._register(DOM.addDisposableListener(this.toggleQueryDetailsButton, DOM.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(1024 /* Shift */ | 2 /* Tab */)) {
                    if (this.queryEditorWidget.isReplaceActive()) {
                        this.queryEditorWidget.focusReplaceAllAction();
                    }
                    else {
                        this.queryEditorWidget.isReplaceShown() ? this.queryEditorWidget.replaceInput.focusOnPreserve() : this.queryEditorWidget.focusRegexAction();
                    }
                    DOM.EventHelper.stop(e);
                }
            }));
            // // Includes
            const folderIncludesList = DOM.append(this.includesExcludesContainer, DOM.$('.file-types.includes'));
            const filesToIncludeTitle = nls_1.localize('searchScope.includes', "files to include");
            DOM.append(folderIncludesList, DOM.$('h4', undefined, filesToIncludeTitle));
            this.inputPatternIncludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.PatternInputWidget, folderIncludesList, this.contextViewService, {
                ariaLabel: nls_1.localize('label.includes', 'Search Include Patterns'),
            }));
            this.inputPatternIncludes.onSubmit(triggeredOnType => this.triggerSearch({ resetCursor: false, delay: triggeredOnType ? this.searchConfig.searchOnTypeDebouncePeriod : 0 }));
            // // Excludes
            const excludesList = DOM.append(this.includesExcludesContainer, DOM.$('.file-types.excludes'));
            const excludesTitle = nls_1.localize('searchScope.excludes', "files to exclude");
            DOM.append(excludesList, DOM.$('h4', undefined, excludesTitle));
            this.inputPatternExcludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.ExcludePatternInputWidget, excludesList, this.contextViewService, {
                ariaLabel: nls_1.localize('label.excludes', 'Search Exclude Patterns'),
            }));
            this.inputPatternExcludes.onSubmit(triggeredOnType => this.triggerSearch({ resetCursor: false, delay: triggeredOnType ? this.searchConfig.searchOnTypeDebouncePeriod : 0 }));
            this.inputPatternExcludes.onChangeIgnoreBox(() => this.triggerSearch());
            [this.queryEditorWidget.searchInput, this.inputPatternIncludes, this.inputPatternExcludes].map(input => this._register(styler_1.attachInputBoxStyler(input, this.themeService, { inputBorder: exports.searchEditorTextInputBorder })));
            // Messages
            this.messageBox = DOM.append(this.queryEditorContainer, DOM.$('.messages'));
        }
        toggleRunAgainMessage(show) {
            DOM.clearNode(this.messageBox);
            lifecycle_1.dispose(this.messageDisposables);
            this.messageDisposables = [];
            if (show) {
                const runAgainLink = DOM.append(this.messageBox, DOM.$('a.pointer.prominent.message', {}, nls_1.localize('runSearch', "Run Search")));
                this.messageDisposables.push(DOM.addDisposableListener(runAgainLink, DOM.EventType.CLICK, async () => {
                    await this.triggerSearch();
                    this.searchResultEditor.focus();
                    this.toggleRunAgainMessage(false);
                }));
            }
        }
        createResultsEditor(parent) {
            const searchResultContainer = DOM.append(parent, DOM.$('.search-results'));
            super.createEditor(searchResultContainer);
            this.searchResultEditor = super.getControl();
            this.searchResultEditor.onMouseUp(e => {
                var _a, _b;
                if (e.event.detail === 2) {
                    const behaviour = this.configurationService.getValue('search').searchEditor.doubleClickBehaviour;
                    const position = e.target.position;
                    if (position && behaviour !== 'selectWord') {
                        const line = (_b = (_a = this.searchResultEditor.getModel()) === null || _a === void 0 ? void 0 : _a.getLineContent(position.lineNumber)) !== null && _b !== void 0 ? _b : '';
                        if (line.match(RESULT_LINE_REGEX)) {
                            this.searchResultEditor.setSelection(range_1.Range.fromPositions(position));
                            this.commandService.executeCommand(behaviour === 'goToLocation' ? 'editor.action.goToDeclaration' : 'editor.action.openDeclarationToTheSide');
                        }
                        else if (line.match(FILE_LINE_REGEX)) {
                            this.searchResultEditor.setSelection(range_1.Range.fromPositions(position));
                            this.commandService.executeCommand('editor.action.peekDefinition');
                        }
                    }
                }
            });
            this._register(this.onDidBlur(() => this.saveViewState()));
            this._register(this.searchResultEditor.onDidChangeModelContent(() => { var _a; return (_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.setDirty(true); }));
            [this.queryEditorWidget.searchInputFocusTracker, this.queryEditorWidget.replaceInputFocusTracker, this.inputPatternExcludes.inputFocusTracker, this.inputPatternIncludes.inputFocusTracker]
                .map(tracker => {
                this._register(tracker.onDidFocus(() => setTimeout(() => this.inputFocusContextKey.set(true), 0)));
                this._register(tracker.onDidBlur(() => this.inputFocusContextKey.set(false)));
            });
        }
        getControl() {
            return this.searchResultEditor;
        }
        focus() {
            const viewState = this.loadViewState();
            if (viewState && viewState.focused === 'editor') {
                this.searchResultEditor.focus();
            }
            else {
                this.queryEditorWidget.focus();
            }
        }
        focusSearchInput() {
            this.queryEditorWidget.searchInput.focus();
        }
        focusNextInput() {
            if (this.queryEditorWidget.searchInputHasFocus()) {
                if (this.showingIncludesExcludes) {
                    this.inputPatternIncludes.focus();
                }
                else {
                    this.searchResultEditor.focus();
                }
            }
            else if (this.inputPatternIncludes.inputHasFocus()) {
                this.inputPatternExcludes.focus();
            }
            else if (this.inputPatternExcludes.inputHasFocus()) {
                this.searchResultEditor.focus();
            }
            else if (this.searchResultEditor.hasWidgetFocus()) {
                // pass
            }
        }
        focusPrevInput() {
            if (this.queryEditorWidget.searchInputHasFocus()) {
                this.searchResultEditor.focus(); // wrap
            }
            else if (this.inputPatternIncludes.inputHasFocus()) {
                this.queryEditorWidget.searchInput.focus();
            }
            else if (this.inputPatternExcludes.inputHasFocus()) {
                this.inputPatternIncludes.focus();
            }
            else if (this.searchResultEditor.hasWidgetFocus()) {
                // unreachable.
            }
        }
        toggleWholeWords() {
            this.queryEditorWidget.searchInput.setWholeWords(!this.queryEditorWidget.searchInput.getWholeWords());
            this.triggerSearch({ resetCursor: false });
        }
        toggleRegex() {
            this.queryEditorWidget.searchInput.setRegex(!this.queryEditorWidget.searchInput.getRegex());
            this.triggerSearch({ resetCursor: false });
        }
        toggleCaseSensitive() {
            this.queryEditorWidget.searchInput.setCaseSensitive(!this.queryEditorWidget.searchInput.getCaseSensitive());
            this.triggerSearch({ resetCursor: false });
        }
        toggleContextLines() {
            this.queryEditorWidget.toggleContextLines();
        }
        modifyContextLines(increase) {
            this.queryEditorWidget.modifyContextLines(increase);
        }
        toggleQueryDetails() {
            this.toggleIncludesExcludes();
        }
        deleteResultBlock() {
            const linesToDelete = new Set();
            const selections = this.searchResultEditor.getSelections();
            const model = this.searchResultEditor.getModel();
            if (!(selections && model)) {
                return;
            }
            const maxLine = model.getLineCount();
            const minLine = 1;
            const deleteUp = (start) => {
                for (let cursor = start; cursor >= minLine; cursor--) {
                    const line = model.getLineContent(cursor);
                    linesToDelete.add(cursor);
                    if (line[0] !== undefined && line[0] !== ' ') {
                        break;
                    }
                }
            };
            const deleteDown = (start) => {
                linesToDelete.add(start);
                for (let cursor = start + 1; cursor <= maxLine; cursor++) {
                    const line = model.getLineContent(cursor);
                    if (line[0] !== undefined && line[0] !== ' ') {
                        return cursor;
                    }
                    linesToDelete.add(cursor);
                }
                return;
            };
            const endingCursorLines = [];
            for (const selection of selections) {
                const lineNumber = selection.startLineNumber;
                endingCursorLines.push(deleteDown(lineNumber));
                deleteUp(lineNumber);
                for (let inner = selection.startLineNumber; inner <= selection.endLineNumber; inner++) {
                    linesToDelete.add(inner);
                }
            }
            if (endingCursorLines.length === 0) {
                endingCursorLines.push(1);
            }
            const isDefined = (x) => x !== undefined;
            model.pushEditOperations(this.searchResultEditor.getSelections(), [...linesToDelete].map(line => ({ range: new range_1.Range(line, 1, line + 1, 1), text: '' })), () => endingCursorLines.filter(isDefined).map(line => new selection_1.Selection(line, 1, line, 1)));
        }
        cleanState() {
            var _a;
            (_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.setDirty(false);
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        iterateThroughMatches(reverse) {
            var _a, _b, _c, _d;
            const model = this.searchResultEditor.getModel();
            if (!model) {
                return;
            }
            const lastLine = (_a = model.getLineCount()) !== null && _a !== void 0 ? _a : 1;
            const lastColumn = model.getLineLength(lastLine);
            const fallbackStart = reverse ? new position_1.Position(lastLine, lastColumn) : new position_1.Position(1, 1);
            const currentPosition = (_c = (_b = this.searchResultEditor.getSelection()) === null || _b === void 0 ? void 0 : _b.getStartPosition()) !== null && _c !== void 0 ? _c : fallbackStart;
            const matchRanges = (_d = this.getInput()) === null || _d === void 0 ? void 0 : _d.getMatchRanges();
            if (!matchRanges) {
                return;
            }
            const matchRange = (reverse ? findPrevRange : findNextRange)(matchRanges, currentPosition);
            this.searchResultEditor.setSelection(matchRange);
            this.searchResultEditor.revealLineInCenterIfOutsideViewport(matchRange.startLineNumber);
            this.searchResultEditor.focus();
            const matchLineText = model.getLineContent(matchRange.startLineNumber);
            const matchText = model.getValueInRange(matchRange);
            let file = '';
            for (let line = matchRange.startLineNumber; line >= 1; line--) {
                let lineText = model.getValueInRange(new range_1.Range(line, 1, line, 2));
                if (lineText !== ' ') {
                    file = model.getLineContent(line);
                    break;
                }
            }
            aria_1.alert(nls_1.localize('searchResultItem', "Matched {0} at {1} in file {2}", matchText, matchLineText, file.slice(0, file.length - 1)));
        }
        focusNextResult() {
            this.iterateThroughMatches(false);
        }
        focusPreviousResult() {
            this.iterateThroughMatches(true);
        }
        focusAllResults() {
            var _a, _b;
            this.searchResultEditor
                .setSelections(((_b = (_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.getMatchRanges()) !== null && _b !== void 0 ? _b : []).map(range => new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)));
            this.searchResultEditor.focus();
        }
        async triggerSearch(_options) {
            const options = Object.assign({ resetCursor: true, delay: 0 }, _options);
            if (!this.pauseSearching) {
                await this.runSearchDelayer.trigger(async () => {
                    await this.doRunSearch();
                    this.toggleRunAgainMessage(false);
                    if (options.resetCursor) {
                        this.searchResultEditor.setPosition(new position_1.Position(1, 1));
                        this.searchResultEditor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
                    }
                    if (options.focusResults) {
                        this.searchResultEditor.focus();
                    }
                }, options.delay);
            }
        }
        readConfigFromWidget() {
            return {
                caseSensitive: this.queryEditorWidget.searchInput.getCaseSensitive(),
                contextLines: this.queryEditorWidget.getContextLines(),
                excludes: this.inputPatternExcludes.getValue(),
                includes: this.inputPatternIncludes.getValue(),
                query: this.queryEditorWidget.searchInput.getValue(),
                regexp: this.queryEditorWidget.searchInput.getRegex(),
                wholeWord: this.queryEditorWidget.searchInput.getWholeWords(),
                useIgnores: this.inputPatternExcludes.useExcludesAndIgnoreFiles(),
                showIncludesExcludes: this.showingIncludesExcludes
            };
        }
        async doRunSearch() {
            this.searchModel.cancelSearch(true);
            const startInput = this.getInput();
            this.searchHistoryDelayer.trigger(() => {
                this.queryEditorWidget.searchInput.onSearchSubmit();
                this.inputPatternExcludes.onSearchSubmit();
                this.inputPatternIncludes.onSearchSubmit();
            });
            const config = this.readConfigFromWidget();
            if (!config.query) {
                return;
            }
            const content = {
                pattern: config.query,
                isRegExp: config.regexp,
                isCaseSensitive: config.caseSensitive,
                isWordMatch: config.wholeWord,
            };
            const options = {
                _reason: 'searchEditor',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                maxResults: 10000,
                disregardIgnoreFiles: !config.useIgnores || undefined,
                disregardExcludeSettings: !config.useIgnores || undefined,
                excludePattern: config.excludes,
                includePattern: config.includes,
                previewOptions: {
                    matchLines: 1,
                    charsPerLine: 1000
                },
                afterContext: config.contextLines,
                beforeContext: config.contextLines,
                isSmartCase: this.configurationService.getValue('search').smartCase,
                expandPatterns: true
            };
            const folderResources = this.contextService.getWorkspace().folders;
            let query;
            try {
                const queryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
                query = queryBuilder.text(content, folderResources.map(folder => folder.uri), options);
            }
            catch (err) {
                return;
            }
            this.searchOperation.start(500);
            await this.searchModel.search(query).finally(() => this.searchOperation.stop());
            const input = this.getInput();
            if (!input ||
                input !== startInput ||
                JSON.stringify(config) !== JSON.stringify(this.readConfigFromWidget())) {
                return;
            }
            const controller = referencesController_1.ReferencesController.get(this.searchResultEditor);
            controller.closeWidget(false);
            const labelFormatter = (uri) => this.labelService.getUriLabel(uri, { relative: true });
            const results = searchEditorSerialization_1.serializeSearchResultForEditor(this.searchModel.searchResult, config.includes, config.excludes, config.contextLines, labelFormatter);
            const { body } = await input.getModels();
            this.modelService.updateModel(body, results.text);
            input.config = config;
            input.setDirty(!input.isUntitled());
            input.setMatchRanges(results.matchRanges);
        }
        layout(dimension) {
            this.dimension = dimension;
            this.reLayout();
        }
        getSelected() {
            var _a, _b;
            const selection = this.searchResultEditor.getSelection();
            if (selection) {
                return (_b = (_a = this.searchResultEditor.getModel()) === null || _a === void 0 ? void 0 : _a.getValueInRange(selection)) !== null && _b !== void 0 ? _b : '';
            }
            return '';
        }
        reLayout() {
            if (this.dimension) {
                this.queryEditorWidget.setWidth(this.dimension.width - 28 /* container margin */);
                this.searchResultEditor.layout({ height: this.dimension.height - DOM.getTotalHeight(this.queryEditorContainer), width: this.dimension.width });
                this.inputPatternExcludes.setWidth(this.dimension.width - 28 /* container margin */);
                this.inputPatternIncludes.setWidth(this.dimension.width - 28 /* container margin */);
            }
        }
        getInput() {
            return this._input;
        }
        async setInput(newInput, options, token) {
            this.saveViewState();
            await super.setInput(newInput, options, token);
            const { body, config } = await newInput.getModels();
            this.searchResultEditor.setModel(body);
            this.pauseSearching = true;
            this.toggleRunAgainMessage(body.getLineCount() === 1 && body.getValue() === '' && config.query !== '');
            this.queryEditorWidget.setValue(config.query);
            this.queryEditorWidget.searchInput.setCaseSensitive(config.caseSensitive);
            this.queryEditorWidget.searchInput.setRegex(config.regexp);
            this.queryEditorWidget.searchInput.setWholeWords(config.wholeWord);
            this.queryEditorWidget.setContextLines(config.contextLines);
            this.inputPatternExcludes.setValue(config.excludes);
            this.inputPatternIncludes.setValue(config.includes);
            this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(config.useIgnores);
            this.toggleIncludesExcludes(config.showIncludesExcludes);
            this.restoreViewState();
            if (!(options === null || options === void 0 ? void 0 : options.preserveFocus)) {
                this.focus();
            }
            this.pauseSearching = false;
        }
        toggleIncludesExcludes(_shouldShow) {
            const cls = 'expanded';
            const shouldShow = _shouldShow !== null && _shouldShow !== void 0 ? _shouldShow : !DOM.hasClass(this.includesExcludesContainer, cls);
            if (shouldShow) {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'true');
                DOM.addClass(this.includesExcludesContainer, cls);
            }
            else {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'false');
                DOM.removeClass(this.includesExcludesContainer, cls);
            }
            this.showingIncludesExcludes = DOM.hasClass(this.includesExcludesContainer, cls);
            this.reLayout();
        }
        saveState() {
            this.saveViewState();
            super.saveState();
        }
        saveViewState() {
            var _a;
            const resource = (_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.modelUri;
            if (resource) {
                this.saveTextEditorViewState(resource);
            }
        }
        retrieveTextEditorViewState(resource) {
            var _a;
            const control = this.getControl();
            const editorViewState = control.saveViewState();
            if (!editorViewState) {
                return null;
            }
            if (resource.toString() !== ((_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.modelUri.toString())) {
                return null;
            }
            return Object.assign(Object.assign({}, editorViewState), { focused: this.searchResultEditor.hasWidgetFocus() ? 'editor' : 'input' });
        }
        loadViewState() {
            var _a;
            const resource = types_1.assertIsDefined((_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.modelUri);
            return this.loadTextEditorViewState(resource);
        }
        restoreViewState() {
            const viewState = this.loadViewState();
            if (viewState) {
                this.searchResultEditor.restoreViewState(viewState);
            }
        }
        clearInput() {
            this.saveViewState();
            super.clearInput();
        }
        getAriaLabel() {
            var _a, _b;
            return (_b = (_a = this.getInput()) === null || _a === void 0 ? void 0 : _a.getName()) !== null && _b !== void 0 ? _b : nls_1.localize('searchEditor', "Search");
        }
    };
    SearchEditor.ID = constants_2.SearchEditorID;
    SearchEditor.SEARCH_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'searchEditorViewState';
    SearchEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, modelService_1.IModelService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, label_1.ILabelService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextView_1.IContextViewService),
        __param(8, commands_1.ICommandService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, progress_1.IEditorProgressService),
        __param(11, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(12, editorGroupsService_1.IEditorGroupsService),
        __param(13, editorService_1.IEditorService),
        __param(14, configuration_1.IConfigurationService)
    ], SearchEditor);
    exports.SearchEditor = SearchEditor;
    themeService_1.registerThemingParticipant((theme, collector) => {
        collector.addRule(`.monaco-editor .${constants_2.SearchEditorFindMatchClass} { background-color: ${theme.getColor(colorRegistry_1.searchEditorFindMatch)}; }`);
        const findMatchHighlightBorder = theme.getColor(colorRegistry_1.searchEditorFindMatchBorder);
        if (findMatchHighlightBorder) {
            collector.addRule(`.monaco-editor .${constants_2.SearchEditorFindMatchClass} { border: 1px ${theme.type === 'hc' ? 'dotted' : 'solid'} ${findMatchHighlightBorder}; box-sizing: border-box; }`);
        }
    });
    exports.searchEditorTextInputBorder = colorRegistry_1.registerColor('searchEditor.textInputBorder', { dark: colorRegistry_1.inputBorder, light: colorRegistry_1.inputBorder, hc: colorRegistry_1.inputBorder }, nls_1.localize('textInputBoxBorder', "Search editor text input box border."));
    function findNextRange(matchRanges, currentPosition) {
        for (const matchRange of matchRanges) {
            if (position_1.Position.isBefore(currentPosition, matchRange.getStartPosition())) {
                return matchRange;
            }
        }
        return matchRanges[0];
    }
    function findPrevRange(matchRanges, currentPosition) {
        for (let i = matchRanges.length - 1; i >= 0; i--) {
            const matchRange = matchRanges[i];
            if (position_1.Position.isBefore(matchRange.getStartPosition(), currentPosition)) {
                {
                    return matchRange;
                }
            }
        }
        return matchRanges[matchRanges.length - 1];
    }
});
//# __sourceMappingURL=searchEditor.js.map