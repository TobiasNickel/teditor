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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/ui/widget", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/navigator", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/services/textResourceConfigurationService", "vs/editor/contrib/find/findController", "vs/editor/contrib/folding/folding", "vs/editor/contrib/message/messageController", "vs/editor/contrib/multicursor/multicursor", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/editor", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/contrib/preferences/browser/preferencesRenderers", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/base/common/types"], function (require, exports, DOM, splitview_1, widget_1, arrays, async_1, cancellation_1, errors_1, event_1, navigator_1, lifecycle_1, strings, uri_1, editorExtensions_1, codeEditorWidget_1, textResourceConfigurationService_1, findController_1, folding_1, messageController_1, multicursor_1, nls, contextkey_1, instantiation_1, log_1, progress_1, platform_1, storage_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, workspace_1, editor_1, baseEditor_1, textEditor_1, preferencesRenderers_1, preferencesWidgets_1, preferences_1, editorService_1, editorGroupsService_1, preferences_2, preferencesModels_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultSettingsEditorContribution = exports.DefaultPreferencesEditor = exports.PreferencesEditor = void 0;
    let PreferencesEditor = class PreferencesEditor extends baseEditor_1.BaseEditor {
        constructor(preferencesService, telemetryService, editorService, contextKeyService, instantiationService, themeService, editorProgressService, storageService) {
            super(PreferencesEditor.ID, telemetryService, themeService, storageService);
            this.preferencesService = preferencesService;
            this.editorService = editorService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.editorProgressService = editorProgressService;
            this._lastReportedFilter = null;
            this.lastFocusedWidget = undefined;
            this._onDidCreateWidget = this._register(new event_1.Emitter());
            this.onDidSizeConstraintsChange = this._onDidCreateWidget.event;
            this.defaultSettingsEditorContextKey = preferences_1.CONTEXT_SETTINGS_EDITOR.bindTo(this.contextKeyService);
            this.defaultSettingsJSONEditorContextKey = preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.bindTo(this.contextKeyService);
            this.searchFocusContextKey = preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS.bindTo(this.contextKeyService);
            this.delayedFilterLogging = new async_1.Delayer(1000);
            this.localSearchDelayer = new async_1.Delayer(100);
            this.remoteSearchThrottle = new async_1.ThrottledDelayer(200);
        }
        get minimumWidth() { return this.sideBySidePreferencesWidget ? this.sideBySidePreferencesWidget.minimumWidth : 0; }
        get maximumWidth() { return this.sideBySidePreferencesWidget ? this.sideBySidePreferencesWidget.maximumWidth : Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from BaseEditor
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        get minimumHeight() { return 260; }
        createEditor(parent) {
            DOM.addClass(parent, 'preferences-editor');
            this.headerContainer = DOM.append(parent, DOM.$('.preferences-header'));
            this.searchWidget = this._register(this.instantiationService.createInstance(preferencesWidgets_1.SearchWidget, this.headerContainer, {
                ariaLabel: nls.localize('SearchSettingsWidget.AriaLabel', "Search settings"),
                placeholder: nls.localize('SearchSettingsWidget.Placeholder', "Search Settings"),
                focusKey: this.searchFocusContextKey,
                showResultCount: true,
                ariaLive: 'assertive'
            }));
            this._register(this.searchWidget.onDidChange(value => this.onInputChanged()));
            this._register(this.searchWidget.onFocus(() => this.lastFocusedWidget = this.searchWidget));
            this.lastFocusedWidget = this.searchWidget;
            const editorsContainer = DOM.append(parent, DOM.$('.preferences-editors-container'));
            this.sideBySidePreferencesWidget = this._register(this.instantiationService.createInstance(SideBySidePreferencesWidget, editorsContainer));
            this._onDidCreateWidget.fire(undefined);
            this._register(this.sideBySidePreferencesWidget.onFocus(() => this.lastFocusedWidget = this.sideBySidePreferencesWidget));
            this._register(this.sideBySidePreferencesWidget.onDidSettingsTargetChange(target => this.switchSettings(target)));
            this.preferencesRenderers = this._register(this.instantiationService.createInstance(PreferencesRenderersController));
            this._register(this.preferencesRenderers.onDidFilterResultsCountChange(count => this.showSearchResultsMessage(count)));
        }
        clearSearchResults() {
            if (this.searchWidget) {
                this.searchWidget.clear();
            }
        }
        focusNextResult() {
            if (this.preferencesRenderers) {
                this.preferencesRenderers.focusNextPreference(true);
            }
        }
        focusPreviousResult() {
            if (this.preferencesRenderers) {
                this.preferencesRenderers.focusNextPreference(false);
            }
        }
        editFocusedPreference() {
            this.preferencesRenderers.editFocusedPreference();
        }
        setInput(newInput, options, token) {
            this.defaultSettingsEditorContextKey.set(true);
            this.defaultSettingsJSONEditorContextKey.set(true);
            if (options && options.query) {
                this.focusSearch(options.query);
            }
            return super.setInput(newInput, options, token).then(() => this.updateInput(newInput, options, token));
        }
        layout(dimension) {
            this.searchWidget.layout(dimension);
            const headerHeight = DOM.getTotalHeight(this.headerContainer);
            this.sideBySidePreferencesWidget.layout(new DOM.Dimension(dimension.width, dimension.height - headerHeight));
        }
        getControl() {
            return this.sideBySidePreferencesWidget.getControl();
        }
        focus() {
            if (this.lastFocusedWidget) {
                this.lastFocusedWidget.focus();
            }
        }
        focusSearch(filter) {
            if (filter) {
                this.searchWidget.setValue(filter);
            }
            this.searchWidget.focus();
        }
        focusSettingsFileEditor() {
            if (this.sideBySidePreferencesWidget) {
                this.sideBySidePreferencesWidget.focus();
            }
        }
        clearInput() {
            this.defaultSettingsEditorContextKey.set(false);
            this.defaultSettingsJSONEditorContextKey.set(false);
            this.sideBySidePreferencesWidget.clearInput();
            this.preferencesRenderers.onHidden();
            super.clearInput();
        }
        setEditorVisible(visible, group) {
            this.sideBySidePreferencesWidget.setEditorVisible(visible, group);
            super.setEditorVisible(visible, group);
        }
        updateInput(newInput, options, token) {
            return this.sideBySidePreferencesWidget.setInput(newInput.secondary, newInput.primary, options, token).then(({ defaultPreferencesRenderer, editablePreferencesRenderer }) => {
                if (token.isCancellationRequested) {
                    return;
                }
                this.preferencesRenderers.defaultPreferencesRenderer = defaultPreferencesRenderer;
                this.preferencesRenderers.editablePreferencesRenderer = editablePreferencesRenderer;
                this.onInputChanged();
            });
        }
        onInputChanged() {
            const query = this.searchWidget.getValue().trim();
            this.delayedFilterLogging.cancel();
            this.triggerSearch(query)
                .then(() => {
                const result = this.preferencesRenderers.lastFilterResult;
                if (result) {
                    this.delayedFilterLogging.trigger(() => this.reportFilteringUsed(query, this.preferencesRenderers.lastFilterResult));
                }
            });
        }
        triggerSearch(query) {
            if (query) {
                return Promise.all([
                    this.localSearchDelayer.trigger(() => this.preferencesRenderers.localFilterPreferences(query).then(() => { })),
                    this.remoteSearchThrottle.trigger(() => Promise.resolve(this.editorProgressService.showWhile(this.preferencesRenderers.remoteSearchPreferences(query), 500)))
                ]).then(() => { });
            }
            else {
                // When clearing the input, update immediately to clear it
                this.localSearchDelayer.cancel();
                this.preferencesRenderers.localFilterPreferences(query);
                this.remoteSearchThrottle.cancel();
                return this.preferencesRenderers.remoteSearchPreferences(query);
            }
        }
        switchSettings(target) {
            // Focus the editor if this editor is not active editor
            if (this.editorService.activeEditorPane !== this) {
                this.focus();
            }
            const promise = this.input && this.input.isDirty() ? this.editorService.save({ editor: this.input, groupId: this.group.id }) : Promise.resolve(true);
            promise.then(() => {
                if (target === 2 /* USER_LOCAL */) {
                    this.preferencesService.switchSettings(2 /* USER_LOCAL */, this.preferencesService.userSettingsResource, true);
                }
                else if (target === 4 /* WORKSPACE */) {
                    this.preferencesService.switchSettings(4 /* WORKSPACE */, this.preferencesService.workspaceSettingsResource, true);
                }
                else if (target instanceof uri_1.URI) {
                    this.preferencesService.switchSettings(5 /* WORKSPACE_FOLDER */, target, true);
                }
            });
        }
        showSearchResultsMessage(count) {
            const countValue = count.count;
            if (count.target) {
                this.sideBySidePreferencesWidget.setResultCount(count.target, count.count);
            }
            else if (this.searchWidget.getValue()) {
                if (countValue === 0) {
                    this.searchWidget.showMessage(nls.localize('noSettingsFound', "No Settings Found"));
                }
                else if (countValue === 1) {
                    this.searchWidget.showMessage(nls.localize('oneSettingFound', "1 Setting Found"));
                }
                else {
                    this.searchWidget.showMessage(nls.localize('settingsFound', "{0} Settings Found", countValue));
                }
            }
            else {
                this.searchWidget.showMessage(nls.localize('totalSettingsMessage', "Total {0} Settings", countValue));
            }
        }
        _countById(settingsGroups) {
            const result = {};
            for (const group of settingsGroups) {
                let i = 0;
                for (const section of group.sections) {
                    i += section.settings.length;
                }
                result[group.id] = i;
            }
            return result;
        }
        reportFilteringUsed(filter, filterResult) {
            if (filter && filter !== this._lastReportedFilter) {
                const metadata = filterResult && filterResult.metadata;
                const counts = filterResult && this._countById(filterResult.filteredGroups);
                let durations;
                if (metadata) {
                    durations = Object.create(null);
                    Object.keys(metadata).forEach(key => durations[key] = metadata[key].duration);
                }
                const data = {
                    filter,
                    durations,
                    counts,
                    requestCount: metadata && metadata['nlpResult'] && metadata['nlpResult'].requestCount
                };
                /* __GDPR__
                    "defaultSettings.filter" : {
                        "filter": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
                        "durations.nlpresult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                        "counts.nlpresult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                        "durations.filterresult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                        "counts.filterresult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                        "requestCount" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('defaultSettings.filter', data);
                this._lastReportedFilter = filter;
            }
        }
    };
    PreferencesEditor.ID = 'workbench.editor.preferencesEditor';
    PreferencesEditor = __decorate([
        __param(0, preferences_2.IPreferencesService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, editorService_1.IEditorService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, progress_1.IEditorProgressService),
        __param(7, storage_1.IStorageService)
    ], PreferencesEditor);
    exports.PreferencesEditor = PreferencesEditor;
    class SettingsNavigator extends navigator_1.ArrayNavigator {
        next() {
            return super.next() || super.first();
        }
        previous() {
            return super.previous() || super.last();
        }
        reset() {
            this.index = this.start - 1;
        }
    }
    let PreferencesRenderersController = class PreferencesRenderersController extends lifecycle_1.Disposable {
        constructor(preferencesSearchService, telemetryService, preferencesService, workspaceContextService, logService) {
            super();
            this.preferencesSearchService = preferencesSearchService;
            this.telemetryService = telemetryService;
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.logService = logService;
            this._defaultPreferencesRendererDisposables = [];
            this._editablePreferencesRendererDisposables = [];
            this._settingsNavigator = null;
            this._remoteFilterCancelToken = null;
            this._prefsModelsForSearch = new Map();
            this._currentLocalSearchProvider = null;
            this._currentRemoteSearchProvider = null;
            this._lastQuery = '';
            this._lastFilterResult = null;
            this._onDidFilterResultsCountChange = this._register(new event_1.Emitter());
            this.onDidFilterResultsCountChange = this._onDidFilterResultsCountChange.event;
        }
        get lastFilterResult() {
            return this._lastFilterResult;
        }
        get defaultPreferencesRenderer() {
            return this._defaultPreferencesRenderer;
        }
        get editablePreferencesRenderer() {
            return this._editablePreferencesRenderer;
        }
        set defaultPreferencesRenderer(defaultPreferencesRenderer) {
            if (this._defaultPreferencesRenderer !== defaultPreferencesRenderer) {
                this._defaultPreferencesRenderer = defaultPreferencesRenderer;
                this._defaultPreferencesRendererDisposables = lifecycle_1.dispose(this._defaultPreferencesRendererDisposables);
                if (this._defaultPreferencesRenderer) {
                    this._defaultPreferencesRenderer.onUpdatePreference(({ key, value, source }) => {
                        this._editablePreferencesRenderer.updatePreference(key, value, source);
                        this._updatePreference(key, value, source);
                    }, this, this._defaultPreferencesRendererDisposables);
                    this._defaultPreferencesRenderer.onFocusPreference(preference => this._focusPreference(preference, this._editablePreferencesRenderer), this, this._defaultPreferencesRendererDisposables);
                    this._defaultPreferencesRenderer.onClearFocusPreference(preference => this._clearFocus(preference, this._editablePreferencesRenderer), this, this._defaultPreferencesRendererDisposables);
                }
            }
        }
        set editablePreferencesRenderer(editableSettingsRenderer) {
            if (this._editablePreferencesRenderer !== editableSettingsRenderer) {
                this._editablePreferencesRenderer = editableSettingsRenderer;
                this._editablePreferencesRendererDisposables = lifecycle_1.dispose(this._editablePreferencesRendererDisposables);
                if (this._editablePreferencesRenderer) {
                    this._editablePreferencesRenderer.preferencesModel
                        .onDidChangeGroups(this._onEditableContentDidChange, this, this._editablePreferencesRendererDisposables);
                    this._editablePreferencesRenderer.onUpdatePreference(({ key, value, source }) => this._updatePreference(key, value, source, true), this, this._defaultPreferencesRendererDisposables);
                }
            }
        }
        async _onEditableContentDidChange() {
            const foundExactMatch = await this.localFilterPreferences(this._lastQuery, true);
            if (!foundExactMatch) {
                await this.remoteSearchPreferences(this._lastQuery, true);
            }
        }
        onHidden() {
            this._prefsModelsForSearch.forEach(model => model.dispose());
            this._prefsModelsForSearch = new Map();
        }
        remoteSearchPreferences(query, updateCurrentResults) {
            if (this.lastFilterResult && this.lastFilterResult.exactMatch) {
                // Skip and clear remote search
                query = '';
            }
            if (this._remoteFilterCancelToken) {
                this._remoteFilterCancelToken.cancel();
                this._remoteFilterCancelToken.dispose();
                this._remoteFilterCancelToken = null;
            }
            this._currentRemoteSearchProvider = (updateCurrentResults && this._currentRemoteSearchProvider) || this.preferencesSearchService.getRemoteSearchProvider(query) || null;
            this._remoteFilterCancelToken = new cancellation_1.CancellationTokenSource();
            return this.filterOrSearchPreferences(query, this._currentRemoteSearchProvider, 'nlpResult', nls.localize('nlpResult', "Natural Language Results"), 1, this._remoteFilterCancelToken.token, updateCurrentResults).then(() => {
                if (this._remoteFilterCancelToken) {
                    this._remoteFilterCancelToken.dispose();
                    this._remoteFilterCancelToken = null;
                }
            }, err => {
                if (errors_1.isPromiseCanceledError(err)) {
                    return;
                }
                else {
                    errors_1.onUnexpectedError(err);
                }
            });
        }
        localFilterPreferences(query, updateCurrentResults) {
            if (this._settingsNavigator) {
                this._settingsNavigator.reset();
            }
            this._currentLocalSearchProvider = (updateCurrentResults && this._currentLocalSearchProvider) || this.preferencesSearchService.getLocalSearchProvider(query);
            return this.filterOrSearchPreferences(query, this._currentLocalSearchProvider, 'filterResult', nls.localize('filterResult', "Filtered Results"), 0, undefined, updateCurrentResults);
        }
        filterOrSearchPreferences(query, searchProvider, groupId, groupLabel, groupOrder, token, editableContentOnly) {
            this._lastQuery = query;
            const filterPs = [this._filterOrSearchPreferences(query, this.editablePreferencesRenderer, searchProvider, groupId, groupLabel, groupOrder, token)];
            if (!editableContentOnly) {
                filterPs.push(this._filterOrSearchPreferences(query, this.defaultPreferencesRenderer, searchProvider, groupId, groupLabel, groupOrder, token));
                filterPs.push(this.searchAllSettingsTargets(query, searchProvider, groupId, groupLabel, groupOrder, token).then(() => undefined));
            }
            return Promise.all(filterPs).then(results => {
                let [editableFilterResult, defaultFilterResult] = results;
                if (!defaultFilterResult && editableContentOnly) {
                    defaultFilterResult = this.lastFilterResult;
                }
                this.consolidateAndUpdate(defaultFilterResult, editableFilterResult);
                this._lastFilterResult = types_1.withUndefinedAsNull(defaultFilterResult);
                return !!(defaultFilterResult && defaultFilterResult.exactMatch);
            });
        }
        searchAllSettingsTargets(query, searchProvider, groupId, groupLabel, groupOrder, token) {
            const searchPs = [
                this.searchSettingsTarget(query, searchProvider, 4 /* WORKSPACE */, groupId, groupLabel, groupOrder, token),
                this.searchSettingsTarget(query, searchProvider, 2 /* USER_LOCAL */, groupId, groupLabel, groupOrder, token)
            ];
            for (const folder of this.workspaceContextService.getWorkspace().folders) {
                const folderSettingsResource = this.preferencesService.getFolderSettingsResource(folder.uri);
                searchPs.push(this.searchSettingsTarget(query, searchProvider, types_1.withNullAsUndefined(folderSettingsResource), groupId, groupLabel, groupOrder, token));
            }
            return Promise.all(searchPs).then(() => { });
        }
        searchSettingsTarget(query, provider, target, groupId, groupLabel, groupOrder, token) {
            if (!query) {
                // Don't open the other settings targets when query is empty
                this._onDidFilterResultsCountChange.fire({ target, count: 0 });
                return Promise.resolve();
            }
            return this.getPreferencesEditorModel(target).then(model => {
                return model && this._filterOrSearchPreferencesModel('', model, provider, groupId, groupLabel, groupOrder, token);
            }).then(result => {
                const count = result ? this._flatten(result.filteredGroups).length : 0;
                this._onDidFilterResultsCountChange.fire({ target, count });
            }, err => {
                if (!errors_1.isPromiseCanceledError(err)) {
                    return Promise.reject(err);
                }
                return undefined;
            });
        }
        async getPreferencesEditorModel(target) {
            const resource = target === 2 /* USER_LOCAL */ ? this.preferencesService.userSettingsResource :
                target === 3 /* USER_REMOTE */ ? this.preferencesService.userSettingsResource :
                    target === 4 /* WORKSPACE */ ? this.preferencesService.workspaceSettingsResource :
                        target;
            if (!resource) {
                return undefined;
            }
            const targetKey = resource.toString();
            if (!this._prefsModelsForSearch.has(targetKey)) {
                try {
                    const model = await this.preferencesService.createPreferencesEditorModel(resource);
                    if (model) {
                        this._register(model);
                        this._prefsModelsForSearch.set(targetKey, model);
                    }
                }
                catch (e) {
                    // Will throw when the settings file doesn't exist.
                    return undefined;
                }
            }
            return this._prefsModelsForSearch.get(targetKey);
        }
        focusNextPreference(forward = true) {
            if (!this._settingsNavigator) {
                return;
            }
            const setting = forward ? this._settingsNavigator.next() : this._settingsNavigator.previous();
            this._focusPreference(setting, this._defaultPreferencesRenderer);
            this._focusPreference(setting, this._editablePreferencesRenderer);
        }
        editFocusedPreference() {
            if (!this._settingsNavigator || !this._settingsNavigator.current()) {
                return;
            }
            const setting = this._settingsNavigator.current();
            const shownInEditableRenderer = this._editablePreferencesRenderer.editPreference(setting);
            if (!shownInEditableRenderer) {
                this.defaultPreferencesRenderer.editPreference(setting);
            }
        }
        _filterOrSearchPreferences(filter, preferencesRenderer, provider, groupId, groupLabel, groupOrder, token) {
            if (!preferencesRenderer) {
                return Promise.resolve(undefined);
            }
            const model = preferencesRenderer.preferencesModel;
            return this._filterOrSearchPreferencesModel(filter, model, provider, groupId, groupLabel, groupOrder, token).then(filterResult => {
                preferencesRenderer.filterPreferences(filterResult);
                return filterResult;
            });
        }
        _filterOrSearchPreferencesModel(filter, model, provider, groupId, groupLabel, groupOrder, token) {
            const searchP = provider ? provider.searchModel(model, token) : Promise.resolve(null);
            return searchP
                .then(null, err => {
                if (errors_1.isPromiseCanceledError(err)) {
                    return Promise.reject(err);
                }
                else {
                    /* __GDPR__
                        "defaultSettings.searchError" : {
                            "message": { "classification": "CallstackOrException", "purpose": "FeatureInsight" }
                        }
                    */
                    const message = errors_1.getErrorMessage(err).trim();
                    if (message && message !== 'Error') {
                        // "Error" = any generic network error
                        this.telemetryService.publicLogError('defaultSettings.searchError', { message });
                        this.logService.info('Setting search error: ' + message);
                    }
                    return undefined;
                }
            })
                .then(searchResult => {
                if (token && token.isCancellationRequested) {
                    searchResult = null;
                }
                const filterResult = searchResult ?
                    model.updateResultGroup(groupId, {
                        id: groupId,
                        label: groupLabel,
                        result: searchResult,
                        order: groupOrder
                    }) :
                    model.updateResultGroup(groupId, undefined);
                if (filterResult) {
                    filterResult.query = filter;
                    filterResult.exactMatch = !!searchResult && searchResult.exactMatch;
                }
                return filterResult;
            });
        }
        consolidateAndUpdate(defaultFilterResult, editableFilterResult) {
            const defaultPreferencesFilteredGroups = defaultFilterResult ? defaultFilterResult.filteredGroups : this._getAllPreferences(this._defaultPreferencesRenderer);
            const editablePreferencesFilteredGroups = editableFilterResult ? editableFilterResult.filteredGroups : this._getAllPreferences(this._editablePreferencesRenderer);
            const consolidatedSettings = this._consolidateSettings(editablePreferencesFilteredGroups, defaultPreferencesFilteredGroups);
            // Maintain the current navigation position when updating SettingsNavigator
            const current = this._settingsNavigator && this._settingsNavigator.current();
            const navigatorSettings = this._lastQuery ? consolidatedSettings : [];
            const currentIndex = current ?
                arrays.firstIndex(navigatorSettings, s => s.key === current.key) :
                -1;
            this._settingsNavigator = new SettingsNavigator(navigatorSettings, Math.max(currentIndex, 0));
            if (currentIndex >= 0) {
                this._settingsNavigator.next();
                const newCurrent = this._settingsNavigator.current();
                this._focusPreference(newCurrent, this._defaultPreferencesRenderer);
                this._focusPreference(newCurrent, this._editablePreferencesRenderer);
            }
            const totalCount = consolidatedSettings.length;
            this._onDidFilterResultsCountChange.fire({ count: totalCount });
        }
        _getAllPreferences(preferencesRenderer) {
            return preferencesRenderer ? preferencesRenderer.preferencesModel.settingsGroups : [];
        }
        _focusPreference(preference, preferencesRenderer) {
            if (preference && preferencesRenderer) {
                preferencesRenderer.focusPreference(preference);
            }
        }
        _clearFocus(preference, preferencesRenderer) {
            if (preference && preferencesRenderer) {
                preferencesRenderer.clearFocus(preference);
            }
        }
        _updatePreference(key, value, source, fromEditableSettings) {
            const data = {
                userConfigurationKeys: [key]
            };
            if (this.lastFilterResult) {
                data['query'] = this.lastFilterResult.query;
                data['editableSide'] = !!fromEditableSettings;
                const nlpMetadata = this.lastFilterResult.metadata && this.lastFilterResult.metadata['nlpResult'];
                if (nlpMetadata) {
                    const sortedKeys = Object.keys(nlpMetadata.scoredResults).sort((a, b) => nlpMetadata.scoredResults[b].score - nlpMetadata.scoredResults[a].score);
                    const suffix = '##' + key;
                    data['nlpIndex'] = arrays.firstIndex(sortedKeys, key => strings.endsWith(key, suffix));
                }
                const settingLocation = this._findSetting(this.lastFilterResult, key);
                if (settingLocation) {
                    data['groupId'] = this.lastFilterResult.filteredGroups[settingLocation.groupIdx].id;
                    data['displayIdx'] = settingLocation.overallSettingIdx;
                }
            }
            /* __GDPR__
                "defaultSettingsActions.copySetting" : {
                    "userConfigurationKeys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "query" : { "classification": "CustomerContent", "purpose": "FeatureInsight" },
                    "nlpIndex" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "groupId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "displayIdx" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "editableSide" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            this.telemetryService.publicLog('defaultSettingsActions.copySetting', data);
        }
        _findSetting(filterResult, key) {
            let overallSettingIdx = 0;
            for (let groupIdx = 0; groupIdx < filterResult.filteredGroups.length; groupIdx++) {
                const group = filterResult.filteredGroups[groupIdx];
                for (let settingIdx = 0; settingIdx < group.sections[0].settings.length; settingIdx++) {
                    const setting = group.sections[0].settings[settingIdx];
                    if (key === setting.key) {
                        return { groupIdx, settingIdx, overallSettingIdx };
                    }
                    overallSettingIdx++;
                }
            }
            return undefined;
        }
        _consolidateSettings(editableSettingsGroups, defaultSettingsGroups) {
            const defaultSettings = this._flatten(defaultSettingsGroups);
            const editableSettings = this._flatten(editableSettingsGroups).filter(secondarySetting => defaultSettings.every(primarySetting => primarySetting.key !== secondarySetting.key));
            return [...defaultSettings, ...editableSettings];
        }
        _flatten(settingsGroups) {
            const settings = [];
            for (const group of settingsGroups) {
                for (const section of group.sections) {
                    settings.push(...section.settings);
                }
            }
            return settings;
        }
        dispose() {
            lifecycle_1.dispose(this._defaultPreferencesRendererDisposables);
            lifecycle_1.dispose(this._editablePreferencesRendererDisposables);
            super.dispose();
        }
    };
    PreferencesRenderersController = __decorate([
        __param(0, preferences_1.IPreferencesSearchService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, preferences_2.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, log_1.ILogService)
    ], PreferencesRenderersController);
    let SideBySidePreferencesWidget = class SideBySidePreferencesWidget extends widget_1.Widget {
        constructor(parentElement, instantiationService, themeService, workspaceContextService, preferencesService) {
            super();
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.workspaceContextService = workspaceContextService;
            this.preferencesService = preferencesService;
            this.dimension = new DOM.Dimension(0, 0);
            this.editablePreferencesEditor = null;
            this._onFocus = this._register(new event_1.Emitter());
            this.onFocus = this._onFocus.event;
            this._onDidSettingsTargetChange = this._register(new event_1.Emitter());
            this.onDidSettingsTargetChange = this._onDidSettingsTargetChange.event;
            this.isVisible = false;
            DOM.addClass(parentElement, 'side-by-side-preferences-editor');
            this.splitview = new splitview_1.SplitView(parentElement, { orientation: 1 /* HORIZONTAL */ });
            this._register(this.splitview);
            this._register(this.splitview.onDidSashReset(() => this.splitview.distributeViewSizes()));
            this.defaultPreferencesEditorContainer = DOM.$('.default-preferences-editor-container');
            const defaultPreferencesHeaderContainer = DOM.append(this.defaultPreferencesEditorContainer, DOM.$('.preferences-header-container'));
            this.defaultPreferencesHeader = DOM.append(defaultPreferencesHeaderContainer, DOM.$('div.default-preferences-header'));
            this.defaultPreferencesHeader.textContent = nls.localize('defaultSettings', "Default Settings");
            this.defaultPreferencesEditor = this._register(this.instantiationService.createInstance(DefaultPreferencesEditor));
            this.defaultPreferencesEditor.create(this.defaultPreferencesEditorContainer);
            this.splitview.addView({
                element: this.defaultPreferencesEditorContainer,
                layout: size => this.defaultPreferencesEditor.layout(new DOM.Dimension(size, this.dimension.height - 34 /* height of header container */)),
                minimumSize: 220,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, splitview_1.Sizing.Distribute);
            this.editablePreferencesEditorContainer = DOM.$('.editable-preferences-editor-container');
            const editablePreferencesHeaderContainer = DOM.append(this.editablePreferencesEditorContainer, DOM.$('.preferences-header-container'));
            this.settingsTargetsWidget = this._register(this.instantiationService.createInstance(preferencesWidgets_1.SettingsTargetsWidget, editablePreferencesHeaderContainer, undefined));
            this._register(this.settingsTargetsWidget.onDidTargetChange(target => this._onDidSettingsTargetChange.fire(target)));
            this._register(styler_1.attachStylerCallback(this.themeService, { scrollbarShadow: colorRegistry_1.scrollbarShadow }, colors => {
                const shadow = colors.scrollbarShadow ? colors.scrollbarShadow.toString() : null;
                this.editablePreferencesEditorContainer.style.boxShadow = shadow ? `-6px 0 5px -5px ${shadow}` : '';
            }));
            this.splitview.addView({
                element: this.editablePreferencesEditorContainer,
                layout: size => this.editablePreferencesEditor && this.editablePreferencesEditor.layout(new DOM.Dimension(size, this.dimension.height - 34 /* height of header container */)),
                minimumSize: 220,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, splitview_1.Sizing.Distribute);
            const focusTracker = this._register(DOM.trackFocus(parentElement));
            this._register(focusTracker.onDidFocus(() => this._onFocus.fire()));
        }
        get minimumWidth() { return this.splitview.minimumSize; }
        get maximumWidth() { return this.splitview.maximumSize; }
        setInput(defaultPreferencesEditorInput, editablePreferencesEditorInput, options, token) {
            this.getOrCreateEditablePreferencesEditor(editablePreferencesEditorInput);
            this.settingsTargetsWidget.settingsTarget = this.getSettingsTarget(editablePreferencesEditorInput.resource);
            return Promise.all([
                this.updateInput(this.defaultPreferencesEditor, defaultPreferencesEditorInput, DefaultSettingsEditorContribution.ID, editablePreferencesEditorInput.resource, options, token),
                this.updateInput(this.editablePreferencesEditor, editablePreferencesEditorInput, SettingsEditorContribution.ID, defaultPreferencesEditorInput.resource, options, token)
            ])
                .then(([defaultPreferencesRenderer, editablePreferencesRenderer]) => {
                if (token.isCancellationRequested) {
                    return {};
                }
                this.defaultPreferencesHeader.textContent = types_1.withUndefinedAsNull(defaultPreferencesRenderer && this.getDefaultPreferencesHeaderText(defaultPreferencesRenderer.preferencesModel.target));
                return { defaultPreferencesRenderer, editablePreferencesRenderer };
            });
        }
        getDefaultPreferencesHeaderText(target) {
            switch (target) {
                case 2 /* USER_LOCAL */:
                    return nls.localize('defaultUserSettings', "Default User Settings");
                case 4 /* WORKSPACE */:
                    return nls.localize('defaultWorkspaceSettings', "Default Workspace Settings");
                case 5 /* WORKSPACE_FOLDER */:
                    return nls.localize('defaultFolderSettings', "Default Folder Settings");
            }
            return '';
        }
        setResultCount(settingsTarget, count) {
            this.settingsTargetsWidget.setResultCount(settingsTarget, count);
        }
        layout(dimension = this.dimension) {
            this.dimension = dimension;
            this.splitview.layout(dimension.width);
        }
        focus() {
            if (this.editablePreferencesEditor) {
                this.editablePreferencesEditor.focus();
            }
        }
        getControl() {
            return this.editablePreferencesEditor ? this.editablePreferencesEditor.getControl() : undefined;
        }
        clearInput() {
            if (this.defaultPreferencesEditor) {
                this.defaultPreferencesEditor.clearInput();
            }
            if (this.editablePreferencesEditor) {
                this.editablePreferencesEditor.clearInput();
            }
        }
        setEditorVisible(visible, group) {
            this.isVisible = visible;
            this.group = group;
            if (this.defaultPreferencesEditor) {
                this.defaultPreferencesEditor.setVisible(this.isVisible, this.group);
            }
            if (this.editablePreferencesEditor) {
                this.editablePreferencesEditor.setVisible(this.isVisible, this.group);
            }
        }
        getOrCreateEditablePreferencesEditor(editorInput) {
            if (this.editablePreferencesEditor) {
                return this.editablePreferencesEditor;
            }
            const descriptor = platform_1.Registry.as(editor_1.Extensions.Editors).getEditor(editorInput);
            const editor = descriptor.instantiate(this.instantiationService);
            this.editablePreferencesEditor = editor;
            this.editablePreferencesEditor.create(this.editablePreferencesEditorContainer);
            this.editablePreferencesEditor.setVisible(this.isVisible, this.group);
            this.layout();
            return editor;
        }
        updateInput(editor, input, editorContributionId, associatedPreferencesModelUri, options, token) {
            return editor.setInput(input, options, token)
                .then(() => {
                if (token.isCancellationRequested) {
                    return undefined;
                }
                return types_1.withNullAsUndefined(editor.getControl().getContribution(editorContributionId).updatePreferencesRenderer(associatedPreferencesModelUri));
            });
        }
        getSettingsTarget(resource) {
            if (this.preferencesService.userSettingsResource.toString() === resource.toString()) {
                return 2 /* USER_LOCAL */;
            }
            const workspaceSettingsResource = this.preferencesService.workspaceSettingsResource;
            if (workspaceSettingsResource && workspaceSettingsResource.toString() === resource.toString()) {
                return 4 /* WORKSPACE */;
            }
            const folder = this.workspaceContextService.getWorkspaceFolder(resource);
            if (folder) {
                return folder.uri;
            }
            return 2 /* USER_LOCAL */;
        }
        disposeEditors() {
            if (this.defaultPreferencesEditor) {
                this.defaultPreferencesEditor.dispose();
            }
            if (this.editablePreferencesEditor) {
                this.editablePreferencesEditor.dispose();
            }
        }
        dispose() {
            this.disposeEditors();
            super.dispose();
        }
    };
    SideBySidePreferencesWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, preferences_2.IPreferencesService)
    ], SideBySidePreferencesWidget);
    let DefaultPreferencesEditor = class DefaultPreferencesEditor extends textEditor_1.BaseTextEditor {
        constructor(telemetryService, instantiationService, storageService, configurationService, themeService, editorGroupService, editorService) {
            super(DefaultPreferencesEditor.ID, telemetryService, instantiationService, storageService, configurationService, themeService, editorService, editorGroupService);
        }
        static _getContributions() {
            const skipContributions = [folding_1.FoldingController.ID, multicursor_1.SelectionHighlighter.ID, findController_1.FindController.ID];
            const contributions = editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => skipContributions.indexOf(c.id) === -1);
            contributions.push({ id: DefaultSettingsEditorContribution.ID, ctor: DefaultSettingsEditorContribution });
            return contributions;
        }
        createEditorControl(parent, configuration) {
            const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, configuration, { contributions: DefaultPreferencesEditor._getContributions() });
            // Inform user about editor being readonly if user starts type
            this._register(editor.onDidType(() => this.showReadonlyHint(editor)));
            this._register(editor.onDidPaste(() => this.showReadonlyHint(editor)));
            return editor;
        }
        showReadonlyHint(editor) {
            const messageController = messageController_1.MessageController.get(editor);
            if (!messageController.isVisible()) {
                messageController.showMessage(nls.localize('defaultEditorReadonly', "Edit in the right hand side editor to override defaults."), editor.getSelection().getPosition());
            }
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.readOnly = true;
            if (this.input) {
                options.lineNumbers = 'off';
                options.renderLineHighlight = 'none';
                options.scrollBeyondLastLine = false;
                options.folding = false;
                options.renderWhitespace = 'none';
                options.wordWrap = 'on';
                options.renderIndentGuides = false;
                options.rulers = [];
                options.glyphMargin = true;
                options.minimap = {
                    enabled: false
                };
                options.renderValidationDecorations = 'editable';
            }
            return options;
        }
        setInput(input, options, token) {
            return super.setInput(input, options, token)
                .then(() => this.input.resolve()
                .then(editorModel => {
                if (token.isCancellationRequested) {
                    return undefined;
                }
                return editorModel.load();
            })
                .then(editorModel => {
                if (token.isCancellationRequested) {
                    return;
                }
                const editor = types_1.assertIsDefined(this.getControl());
                editor.setModel(editorModel.textEditorModel);
            }));
        }
        clearInput() {
            // Clear Model
            const editor = this.getControl();
            if (editor) {
                editor.setModel(null);
            }
            // Pass to super
            super.clearInput();
        }
        layout(dimension) {
            const editor = types_1.assertIsDefined(this.getControl());
            editor.layout(dimension);
        }
        getAriaLabel() {
            return nls.localize('preferencesAriaLabel', "Default preferences. Readonly.");
        }
    };
    DefaultPreferencesEditor.ID = 'workbench.editor.defaultPreferences';
    DefaultPreferencesEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, editorService_1.IEditorService)
    ], DefaultPreferencesEditor);
    exports.DefaultPreferencesEditor = DefaultPreferencesEditor;
    let AbstractSettingsEditorContribution = class AbstractSettingsEditorContribution extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, preferencesService, workspaceContextService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.preferencesRendererCreationPromise = null;
            this._register(this.editor.onDidChangeModel(() => this._onModelChanged()));
        }
        updatePreferencesRenderer(associatedPreferencesModelUri) {
            if (!this.preferencesRendererCreationPromise) {
                this.preferencesRendererCreationPromise = this._createPreferencesRenderer();
            }
            if (this.preferencesRendererCreationPromise) {
                return this._hasAssociatedPreferencesModelChanged(associatedPreferencesModelUri)
                    .then(changed => changed ? this._updatePreferencesRenderer(associatedPreferencesModelUri) : this.preferencesRendererCreationPromise);
            }
            return Promise.resolve(null);
        }
        _onModelChanged() {
            const model = this.editor.getModel();
            this.disposePreferencesRenderer();
            if (model) {
                this.preferencesRendererCreationPromise = this._createPreferencesRenderer();
            }
        }
        _hasAssociatedPreferencesModelChanged(associatedPreferencesModelUri) {
            return this.preferencesRendererCreationPromise.then(preferencesRenderer => {
                return !(preferencesRenderer && preferencesRenderer.getAssociatedPreferencesModel() && preferencesRenderer.getAssociatedPreferencesModel().uri.toString() === associatedPreferencesModelUri.toString());
            });
        }
        _updatePreferencesRenderer(associatedPreferencesModelUri) {
            return this.preferencesService.createPreferencesEditorModel(associatedPreferencesModelUri)
                .then(associatedPreferencesEditorModel => {
                if (associatedPreferencesEditorModel) {
                    return this.preferencesRendererCreationPromise.then(preferencesRenderer => {
                        if (preferencesRenderer) {
                            const associatedPreferencesModel = preferencesRenderer.getAssociatedPreferencesModel();
                            if (associatedPreferencesModel) {
                                associatedPreferencesModel.dispose();
                            }
                            preferencesRenderer.setAssociatedPreferencesModel(associatedPreferencesEditorModel);
                        }
                        return preferencesRenderer;
                    });
                }
                return null;
            });
        }
        disposePreferencesRenderer() {
            if (this.preferencesRendererCreationPromise) {
                this.preferencesRendererCreationPromise.then(preferencesRenderer => {
                    if (preferencesRenderer) {
                        const associatedPreferencesModel = preferencesRenderer.getAssociatedPreferencesModel();
                        if (associatedPreferencesModel) {
                            associatedPreferencesModel.dispose();
                        }
                        preferencesRenderer.preferencesModel.dispose();
                        preferencesRenderer.dispose();
                    }
                });
                this.preferencesRendererCreationPromise = Promise.resolve(null);
            }
        }
        dispose() {
            this.disposePreferencesRenderer();
            super.dispose();
        }
    };
    AbstractSettingsEditorContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, preferences_2.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], AbstractSettingsEditorContribution);
    class DefaultSettingsEditorContribution extends AbstractSettingsEditorContribution {
        _createPreferencesRenderer() {
            return this.preferencesService.createPreferencesEditorModel(this.editor.getModel().uri)
                .then(editorModel => {
                if (editorModel instanceof preferencesModels_1.DefaultSettingsEditorModel && this.editor.getModel()) {
                    const preferencesRenderer = this.instantiationService.createInstance(preferencesRenderers_1.DefaultSettingsRenderer, this.editor, editorModel);
                    preferencesRenderer.render();
                    return preferencesRenderer;
                }
                return null;
            });
        }
    }
    exports.DefaultSettingsEditorContribution = DefaultSettingsEditorContribution;
    DefaultSettingsEditorContribution.ID = 'editor.contrib.defaultsettings';
    let SettingsEditorContribution = class SettingsEditorContribution extends AbstractSettingsEditorContribution {
        constructor(editor, instantiationService, preferencesService, workspaceContextService) {
            super(editor, instantiationService, preferencesService, workspaceContextService);
            this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => this._onModelChanged()));
        }
        _createPreferencesRenderer() {
            const model = this.editor.getModel();
            if (model) {
                return this.preferencesService.createPreferencesEditorModel(model.uri)
                    .then(settingsModel => {
                    if (settingsModel instanceof preferencesModels_1.SettingsEditorModel && this.editor.getModel()) {
                        switch (settingsModel.configurationTarget) {
                            case 2 /* USER_LOCAL */:
                            case 3 /* USER_REMOTE */:
                                return this.instantiationService.createInstance(preferencesRenderers_1.UserSettingsRenderer, this.editor, settingsModel);
                            case 4 /* WORKSPACE */:
                                return this.instantiationService.createInstance(preferencesRenderers_1.WorkspaceSettingsRenderer, this.editor, settingsModel);
                            case 5 /* WORKSPACE_FOLDER */:
                                return this.instantiationService.createInstance(preferencesRenderers_1.FolderSettingsRenderer, this.editor, settingsModel);
                        }
                    }
                    return null;
                })
                    .then(preferencesRenderer => {
                    if (preferencesRenderer) {
                        preferencesRenderer.render();
                    }
                    return preferencesRenderer;
                });
            }
            return null;
        }
    };
    SettingsEditorContribution.ID = 'editor.contrib.settings';
    SettingsEditorContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, preferences_2.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], SettingsEditorContribution);
    editorExtensions_1.registerEditorContribution(SettingsEditorContribution.ID, SettingsEditorContribution);
});
//# __sourceMappingURL=preferencesEditor.js.map