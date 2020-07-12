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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/collections", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/userDataSync/common/storageKeys", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/contrib/preferences/browser/settingsLayout", "vs/workbench/contrib/preferences/browser/settingsTree", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/workbench/contrib/preferences/browser/settingsWidgets", "vs/workbench/contrib/preferences/browser/tocTree", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/base/common/date", "vs/base/common/event", "vs/css!./media/settingsEditor2"], function (require, exports, DOM, actionbar_1, button_1, actions_1, arrays, async_1, cancellation_1, collections, errors_1, iterator_1, lifecycle_1, platform, strings, types_1, uri_1, nls_1, commands_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, log_1, notification_1, productService_1, storage_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, storageKeys_1, userDataSync_1, baseEditor_1, suggestEnabledInput_1, preferencesWidgets_1, settingsLayout_1, settingsTree_1, settingsTreeModels_1, settingsWidgets_1, tocTree_1, preferences_1, editorGroupsService_1, preferences_2, preferencesModels_1, date_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsEditor2 = void 0;
    function createGroupIterator(group) {
        return iterator_1.Iterable.map(group.children, g => {
            return {
                element: g,
                children: g instanceof settingsTreeModels_1.SettingsTreeGroupElement ?
                    createGroupIterator(g) :
                    undefined
            };
        });
    }
    const $ = DOM.$;
    const searchBoxLabel = nls_1.localize('SearchSettings.AriaLabel', "Search settings");
    const SETTINGS_AUTOSAVE_NOTIFIED_KEY = 'hasNotifiedOfSettingsAutosave';
    const SETTINGS_EDITOR_STATE_KEY = 'settingsEditorState';
    let SettingsEditor2 = class SettingsEditor2 extends baseEditor_1.BaseEditor {
        constructor(telemetryService, configurationService, themeService, preferencesService, instantiationService, preferencesSearchService, logService, contextKeyService, storageService, notificationService, editorGroupService, keybindingService, storageKeysSyncRegistryService, productService, userDataAutoSyncService) {
            super(SettingsEditor2.ID, telemetryService, themeService, storageService);
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
            this.instantiationService = instantiationService;
            this.preferencesSearchService = preferencesSearchService;
            this.logService = logService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.editorGroupService = editorGroupService;
            this.keybindingService = keybindingService;
            this.productService = productService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.searchInProgress = null;
            this.pendingSettingUpdate = null;
            this._searchResultModel = null;
            this.lastFocusedSettingElement = null;
            /** Don't spam warnings */
            this.hasWarnedMissingSettings = false;
            this.tocFocusedElement = null;
            this.settingsTreeScrollTop = 0;
            this.delayedFilterLogging = new async_1.Delayer(1000);
            this.localSearchDelayer = new async_1.Delayer(300);
            this.remoteSearchThrottle = new async_1.ThrottledDelayer(200);
            this.viewState = { settingsTarget: 2 /* USER_LOCAL */ };
            this.settingFastUpdateDelayer = new async_1.Delayer(SettingsEditor2.SETTING_UPDATE_FAST_DEBOUNCE);
            this.settingSlowUpdateDelayer = new async_1.Delayer(SettingsEditor2.SETTING_UPDATE_SLOW_DEBOUNCE);
            this.updatedConfigSchemaDelayer = new async_1.Delayer(SettingsEditor2.CONFIG_SCHEMA_UPDATE_DELAYER);
            this.inSettingsEditorContextKey = preferences_1.CONTEXT_SETTINGS_EDITOR.bindTo(contextKeyService);
            this.searchFocusContextKey = preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS.bindTo(contextKeyService);
            this.tocRowFocused = preferences_1.CONTEXT_TOC_ROW_FOCUS.bindTo(contextKeyService);
            this.scheduledRefreshes = new Map();
            this.editorMemento = this.getEditorMemento(editorGroupService, SETTINGS_EDITOR_STATE_KEY);
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.source !== 6 /* DEFAULT */) {
                    this.onConfigUpdate(e.affectedKeys);
                }
            }));
            storageKeysSyncRegistryService.registerStorageKey({ key: SETTINGS_AUTOSAVE_NOTIFIED_KEY, version: 1 });
        }
        static shouldSettingUpdateFast(type) {
            if (types_1.isArray(type)) {
                // nullable integer/number or complex
                return false;
            }
            return type === preferences_2.SettingValueType.Enum ||
                type === preferences_2.SettingValueType.ArrayOfString ||
                type === preferences_2.SettingValueType.Complex ||
                type === preferences_2.SettingValueType.Boolean ||
                type === preferences_2.SettingValueType.Exclude;
        }
        get minimumWidth() { return 375; }
        get maximumWidth() { return Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from BaseEditor
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        get currentSettingsModel() {
            return this.searchResultModel || this.settingsTreeModel;
        }
        get searchResultModel() {
            return this._searchResultModel;
        }
        set searchResultModel(value) {
            this._searchResultModel = value;
            DOM.toggleClass(this.rootElement, 'search-mode', !!this._searchResultModel);
        }
        get currentSettingsContextMenuKeyBindingLabel() {
            const keybinding = this.keybindingService.lookupKeybinding(preferences_1.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU);
            return (keybinding && keybinding.getAriaLabel()) || '';
        }
        createEditor(parent) {
            parent.setAttribute('tabindex', '-1');
            this.rootElement = DOM.append(parent, $('.settings-editor', { tabindex: '-1' }));
            this.createHeader(this.rootElement);
            this.createBody(this.rootElement);
            this.addCtrlAInterceptor(this.rootElement);
            this.updateStyles();
        }
        setInput(input, options, token) {
            this.inSettingsEditorContextKey.set(true);
            return super.setInput(input, options, token)
                .then(() => async_1.timeout(0)) // Force setInput to be async
                .then(() => {
                // Don't block setInput on render (which can trigger an async search)
                this.render(token).then(() => {
                    options = options || preferences_2.SettingsEditorOptions.create({});
                    if (!this.viewState.settingsTarget) {
                        if (!options.target) {
                            options.target = 2 /* USER_LOCAL */;
                        }
                    }
                    this._setOptions(options);
                    this._register(input.onDispose(() => {
                        this.searchWidget.setValue('');
                    }));
                    // Init TOC selection
                    this.updateTreeScrollSync();
                });
            });
        }
        restoreCachedState() {
            const cachedState = this.group && this.input && this.editorMemento.loadEditorState(this.group, this.input);
            if (cachedState && typeof cachedState.target === 'object') {
                cachedState.target = uri_1.URI.revive(cachedState.target);
            }
            if (cachedState) {
                const settingsTarget = cachedState.target;
                this.settingsTargetsWidget.settingsTarget = settingsTarget;
                this.viewState.settingsTarget = settingsTarget;
                this.searchWidget.setValue(cachedState.searchQuery);
            }
            if (this.input) {
                this.editorMemento.clearEditorState(this.input, this.group);
            }
            return types_1.withUndefinedAsNull(cachedState);
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                this._setOptions(options);
            }
        }
        _setOptions(options) {
            if (options.query) {
                this.searchWidget.setValue(options.query);
            }
            const target = options.folderUri || options.target;
            if (target) {
                this.settingsTargetsWidget.settingsTarget = target;
                this.viewState.settingsTarget = target;
            }
        }
        clearInput() {
            this.inSettingsEditorContextKey.set(false);
            super.clearInput();
        }
        layout(dimension) {
            this.dimension = dimension;
            if (!this.isVisible()) {
                return;
            }
            this.layoutTrees(dimension);
            const innerWidth = Math.min(1000, dimension.width) - 24 * 2; // 24px padding on left and right;
            // minus padding inside inputbox, countElement width, controls width, extra padding before countElement
            const monacoWidth = innerWidth - 10 - this.countElement.clientWidth - this.controlsElement.clientWidth - 12;
            this.searchWidget.layout({ height: 20, width: monacoWidth });
            DOM.toggleClass(this.rootElement, 'mid-width', dimension.width < 1000 && dimension.width >= 600);
            DOM.toggleClass(this.rootElement, 'narrow-width', dimension.width < 600);
        }
        focus() {
            if (this.lastFocusedSettingElement) {
                const elements = this.settingRenderers.getDOMElementsForSettingKey(this.settingsTree.getHTMLElement(), this.lastFocusedSettingElement);
                if (elements.length) {
                    const control = elements[0].querySelector(settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR);
                    if (control) {
                        control.focus();
                        return;
                    }
                }
            }
            this.focusSearch();
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
            if (!visible) {
                this.searchWidget.onHide();
            }
        }
        focusSettings() {
            // Update ARIA global labels
            const labelElement = this.settingsAriaExtraLabelsContainer.querySelector('#settings_aria_more_actions_shortcut_label');
            if (labelElement) {
                const settingsContextMenuShortcut = this.currentSettingsContextMenuKeyBindingLabel;
                if (settingsContextMenuShortcut) {
                    labelElement.setAttribute('aria-label', nls_1.localize('settingsContextMenuAriaShortcut', "For more actions, Press {0}.", settingsContextMenuShortcut));
                }
            }
            const firstFocusable = this.settingsTree.getHTMLElement().querySelector(settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR);
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
        focusTOC() {
            this.tocTree.domFocus();
        }
        showContextMenu() {
            const activeElement = this.getActiveElementInSettingsTree();
            if (!activeElement) {
                return;
            }
            const settingDOMElement = this.settingRenderers.getSettingDOMElementForDOMElement(activeElement);
            if (!settingDOMElement) {
                return;
            }
            const focusedKey = this.settingRenderers.getKeyForDOMElementInSetting(settingDOMElement);
            if (!focusedKey) {
                return;
            }
            const elements = this.currentSettingsModel.getElementsByName(focusedKey);
            if (elements && elements[0]) {
                this.settingRenderers.showContextMenu(elements[0], settingDOMElement);
            }
        }
        focusSearch(filter, selectAll = true) {
            if (filter && this.searchWidget) {
                this.searchWidget.setValue(filter);
            }
            this.searchWidget.focus(selectAll);
        }
        clearSearchResults() {
            this.searchWidget.setValue('');
            this.focusSearch();
        }
        clearSearchFilters() {
            let query = this.searchWidget.getValue();
            SettingsEditor2.SUGGESTIONS.forEach(suggestion => {
                query = query.replace(suggestion, '');
            });
            this.searchWidget.setValue(query.trim());
        }
        updateInputAriaLabel(lastSyncedLabel) {
            const label = lastSyncedLabel ?
                `${searchBoxLabel}. ${lastSyncedLabel}` :
                searchBoxLabel;
            this.searchWidget.updateAriaLabel(label);
        }
        createHeader(parent) {
            this.headerContainer = DOM.append(parent, $('.settings-header'));
            const searchContainer = DOM.append(this.headerContainer, $('.search-container'));
            const clearInputAction = new actions_1.Action(preferences_1.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS, nls_1.localize('clearInput', "Clear Settings Search Input"), 'codicon-clear-all', false, () => { this.clearSearchResults(); return Promise.resolve(null); });
            this.searchWidget = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, `${SettingsEditor2.ID}.searchbox`, searchContainer, {
                triggerCharacters: ['@'],
                provideResults: (query) => {
                    return SettingsEditor2.SUGGESTIONS.filter(tag => query.indexOf(tag) === -1).map(tag => strings.endsWith(tag, ':') ? tag : tag + ' ');
                }
            }, searchBoxLabel, 'settingseditor:searchinput' + SettingsEditor2.NUM_INSTANCES++, {
                placeholderText: searchBoxLabel,
                focusContextKey: this.searchFocusContextKey,
            }));
            this._register(this.searchWidget.onFocus(() => {
                this.lastFocusedSettingElement = '';
            }));
            this._register(suggestEnabledInput_1.attachSuggestEnabledInputBoxStyler(this.searchWidget, this.themeService, {
                inputBorder: settingsWidgets_1.settingsTextInputBorder
            }));
            this.countElement = DOM.append(searchContainer, DOM.$('.settings-count-widget.monaco-count-badge.long'));
            this._register(styler_1.attachStylerCallback(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, contrastBorder: colorRegistry_1.contrastBorder, badgeForeground: colorRegistry_1.badgeForeground }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                const foreground = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                this.countElement.style.backgroundColor = background;
                this.countElement.style.color = foreground;
                this.countElement.style.borderWidth = border ? '1px' : '';
                this.countElement.style.borderStyle = border ? 'solid' : '';
                this.countElement.style.borderColor = border;
            }));
            this._register(this.searchWidget.onInputDidChange(() => {
                const searchVal = this.searchWidget.getValue();
                clearInputAction.enabled = !!searchVal;
                this.onSearchInputChanged();
            }));
            const headerControlsContainer = DOM.append(this.headerContainer, $('.settings-header-controls'));
            const targetWidgetContainer = DOM.append(headerControlsContainer, $('.settings-target-container'));
            this.settingsTargetsWidget = this._register(this.instantiationService.createInstance(preferencesWidgets_1.SettingsTargetsWidget, targetWidgetContainer, { enableRemoteSettings: true }));
            this.settingsTargetsWidget.settingsTarget = 2 /* USER_LOCAL */;
            this.settingsTargetsWidget.onDidTargetChange(target => this.onDidSettingsTargetChange(target));
            if (syncAllowed(this.productService, this.configurationService) && this.userDataAutoSyncService.canToggleEnablement()) {
                const syncControls = this._register(this.instantiationService.createInstance(SyncControls, headerControlsContainer));
                this._register(syncControls.onDidChangeLastSyncedLabel(lastSyncedLabel => this.updateInputAriaLabel(lastSyncedLabel)));
            }
            this.controlsElement = DOM.append(searchContainer, DOM.$('.settings-clear-widget'));
            const actionBar = this._register(new actionbar_1.ActionBar(this.controlsElement, {
                animated: false,
                actionViewItemProvider: (_action) => { return undefined; }
            }));
            actionBar.push([clearInputAction], { label: false, icon: true });
        }
        onDidSettingsTargetChange(target) {
            this.viewState.settingsTarget = target;
            // TODO Instead of rebuilding the whole model, refresh and uncache the inspected setting value
            this.onConfigUpdate(undefined, true);
        }
        onDidClickSetting(evt, recursed) {
            const elements = this.currentSettingsModel.getElementsByName(evt.targetKey);
            if (elements && elements[0]) {
                let sourceTop = 0.5;
                try {
                    const _sourceTop = this.settingsTree.getRelativeTop(evt.source);
                    if (_sourceTop !== null) {
                        sourceTop = _sourceTop;
                    }
                }
                catch (_a) {
                    // e.g. clicked a searched element, now the search has been cleared
                }
                this.settingsTree.reveal(elements[0], sourceTop);
                const domElements = this.settingRenderers.getDOMElementsForSettingKey(this.settingsTree.getHTMLElement(), evt.targetKey);
                if (domElements && domElements[0]) {
                    const control = domElements[0].querySelector(settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR);
                    if (control) {
                        control.focus();
                    }
                }
            }
            else if (!recursed) {
                const p = this.triggerSearch('');
                p.then(() => {
                    this.searchWidget.setValue('');
                    this.onDidClickSetting(evt, true);
                });
            }
        }
        switchToSettingsFile() {
            const query = settingsTreeModels_1.parseQuery(this.searchWidget.getValue()).query;
            return this.openSettingsFile({ query });
        }
        async openSettingsFile(options) {
            const currentSettingsTarget = this.settingsTargetsWidget.settingsTarget;
            if (currentSettingsTarget === 2 /* USER_LOCAL */) {
                return this.preferencesService.openGlobalSettings(true, options);
            }
            else if (currentSettingsTarget === 3 /* USER_REMOTE */) {
                return this.preferencesService.openRemoteSettings();
            }
            else if (currentSettingsTarget === 4 /* WORKSPACE */) {
                return this.preferencesService.openWorkspaceSettings(true, options);
            }
            else if (uri_1.URI.isUri(currentSettingsTarget)) {
                return this.preferencesService.openFolderSettings(currentSettingsTarget, true, options);
            }
            return undefined;
        }
        createBody(parent) {
            const bodyContainer = DOM.append(parent, $('.settings-body'));
            this.noResultsMessage = DOM.append(bodyContainer, $('.no-results-message'));
            this.noResultsMessage.innerText = nls_1.localize('noResults', "No Settings Found");
            this.clearFilterLinkContainer = $('span.clear-search-filters');
            this.clearFilterLinkContainer.textContent = ' - ';
            const clearFilterLink = DOM.append(this.clearFilterLinkContainer, $('a.pointer.prominent', { tabindex: 0 }, nls_1.localize('clearSearchFilters', 'Clear Filters')));
            this._register(DOM.addDisposableListener(clearFilterLink, DOM.EventType.CLICK, (e) => {
                DOM.EventHelper.stop(e, false);
                this.clearSearchFilters();
            }));
            DOM.append(this.noResultsMessage, this.clearFilterLinkContainer);
            this._register(styler_1.attachStylerCallback(this.themeService, { editorForeground: colorRegistry_1.editorForeground }, colors => {
                this.noResultsMessage.style.color = colors.editorForeground ? colors.editorForeground.toString() : '';
            }));
            this.createTOC(bodyContainer);
            this.createFocusSink(bodyContainer, e => {
                if (DOM.findParentWithClass(e.relatedTarget, 'settings-editor-tree')) {
                    if (this.settingsTree.scrollTop > 0) {
                        const firstElement = this.settingsTree.firstVisibleElement;
                        if (typeof firstElement !== 'undefined') {
                            this.settingsTree.reveal(firstElement, 0.1);
                        }
                        return true;
                    }
                }
                else {
                    const firstControl = this.settingsTree.getHTMLElement().querySelector(settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR);
                    if (firstControl) {
                        firstControl.focus();
                    }
                }
                return false;
            }, 'settings list focus helper');
            this.createSettingsTree(bodyContainer);
            this.createFocusSink(bodyContainer, e => {
                if (DOM.findParentWithClass(e.relatedTarget, 'settings-editor-tree')) {
                    if (this.settingsTree.scrollTop < this.settingsTree.scrollHeight) {
                        const lastElement = this.settingsTree.lastVisibleElement;
                        this.settingsTree.reveal(lastElement, 0.9);
                        return true;
                    }
                }
                return false;
            }, 'settings list focus helper');
        }
        addCtrlAInterceptor(container) {
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_DOWN, (e) => {
                if (e.keyCode === 31 /* KEY_A */ &&
                    (platform.isMacintosh ? e.metaKey : e.ctrlKey) &&
                    e.target.tagName !== 'TEXTAREA' &&
                    e.target.tagName !== 'INPUT') {
                    // Avoid browser ctrl+a
                    e.browserEvent.stopPropagation();
                    e.browserEvent.preventDefault();
                }
            }));
        }
        createFocusSink(container, callback, label) {
            const listFocusSink = DOM.append(container, $('.settings-tree-focus-sink'));
            listFocusSink.setAttribute('aria-label', label);
            listFocusSink.tabIndex = 0;
            this._register(DOM.addDisposableListener(listFocusSink, 'focus', (e) => {
                if (e.relatedTarget && callback(e)) {
                    e.relatedTarget.focus();
                }
            }));
            return listFocusSink;
        }
        createTOC(parent) {
            this.tocTreeModel = this.instantiationService.createInstance(tocTree_1.TOCTreeModel, this.viewState);
            this.tocTreeContainer = DOM.append(parent, $('.settings-toc-container'));
            this.tocTree = this._register(this.instantiationService.createInstance(tocTree_1.TOCTree, DOM.append(this.tocTreeContainer, $('.settings-toc-wrapper')), this.viewState));
            this._register(this.tocTree.onDidChangeFocus(e => {
                const element = e.elements[0];
                if (this.tocFocusedElement === element) {
                    return;
                }
                this.tocFocusedElement = element;
                this.tocTree.setSelection(element ? [element] : []);
                if (this.searchResultModel) {
                    if (this.viewState.filterToCategory !== element) {
                        this.viewState.filterToCategory = types_1.withNullAsUndefined(element);
                        this.renderTree();
                        this.settingsTree.scrollTop = 0;
                    }
                }
                else if (element && (!e.browserEvent || !e.browserEvent.fromScroll)) {
                    this.settingsTree.reveal(element, 0);
                }
            }));
            this._register(this.tocTree.onDidFocus(() => {
                this.tocRowFocused.set(true);
            }));
            this._register(this.tocTree.onDidBlur(() => {
                this.tocRowFocused.set(false);
            }));
        }
        createSettingsTree(parent) {
            this.settingsTreeContainer = DOM.append(parent, $('.settings-tree-container'));
            // Add  ARIA extra labels div
            this.settingsAriaExtraLabelsContainer = DOM.append(this.settingsTreeContainer, $('.settings-aria-extra-labels'));
            this.settingsAriaExtraLabelsContainer.id = 'settings_aria_extra_labels';
            // Add global labels here
            const labelDiv = DOM.append(this.settingsAriaExtraLabelsContainer, $('.settings-aria-extra-label'));
            labelDiv.id = 'settings_aria_more_actions_shortcut_label';
            labelDiv.setAttribute('aria-label', '');
            this.settingRenderers = this.instantiationService.createInstance(settingsTree_1.SettingTreeRenderers);
            this._register(this.settingRenderers.onDidChangeSetting(e => this.onDidChangeSetting(e.key, e.value, e.type)));
            this._register(this.settingRenderers.onDidOpenSettings(settingKey => {
                this.openSettingsFile({ editSetting: settingKey });
            }));
            this._register(this.settingRenderers.onDidClickSettingLink(settingName => this.onDidClickSetting(settingName)));
            this._register(this.settingRenderers.onDidFocusSetting(element => {
                this.lastFocusedSettingElement = element.setting.key;
                this.settingsTree.reveal(element);
            }));
            this._register(this.settingRenderers.onDidClickOverrideElement((element) => {
                if (element.scope.toLowerCase() === 'workspace') {
                    this.settingsTargetsWidget.updateTarget(4 /* WORKSPACE */);
                }
                else if (element.scope.toLowerCase() === 'user') {
                    this.settingsTargetsWidget.updateTarget(2 /* USER_LOCAL */);
                }
                else if (element.scope.toLowerCase() === 'remote') {
                    this.settingsTargetsWidget.updateTarget(3 /* USER_REMOTE */);
                }
                this.searchWidget.setValue(element.targetKey);
            }));
            this.settingsTree = this._register(this.instantiationService.createInstance(settingsTree_1.SettingsTree, this.settingsTreeContainer, this.viewState, this.settingRenderers.allRenderers));
            this.settingsTree.getHTMLElement().attributes.removeNamedItem('tabindex');
            this._register(this.settingsTree.onDidScroll(() => {
                if (this.settingsTree.scrollTop === this.settingsTreeScrollTop) {
                    return;
                }
                this.settingsTreeScrollTop = this.settingsTree.scrollTop;
                // setTimeout because calling setChildren on the settingsTree can trigger onDidScroll, so it fires when
                // setChildren has called on the settings tree but not the toc tree yet, so their rendered elements are out of sync
                setTimeout(() => {
                    this.updateTreeScrollSync();
                }, 0);
            }));
        }
        notifyNoSaveNeeded() {
            if (!this.storageService.getBoolean(SETTINGS_AUTOSAVE_NOTIFIED_KEY, 0 /* GLOBAL */, false)) {
                this.storageService.store(SETTINGS_AUTOSAVE_NOTIFIED_KEY, true, 0 /* GLOBAL */);
                this.notificationService.info(nls_1.localize('settingsNoSaveNeeded', "Your changes are automatically saved as you edit."));
            }
        }
        onDidChangeSetting(key, value, type) {
            this.notifyNoSaveNeeded();
            if (this.pendingSettingUpdate && this.pendingSettingUpdate.key !== key) {
                this.updateChangedSetting(key, value);
            }
            this.pendingSettingUpdate = { key, value };
            if (SettingsEditor2.shouldSettingUpdateFast(type)) {
                this.settingFastUpdateDelayer.trigger(() => this.updateChangedSetting(key, value));
            }
            else {
                this.settingSlowUpdateDelayer.trigger(() => this.updateChangedSetting(key, value));
            }
        }
        updateTreeScrollSync() {
            this.settingRenderers.cancelSuggesters();
            if (this.searchResultModel) {
                return;
            }
            if (!this.tocTreeModel) {
                return;
            }
            const elementToSync = this.settingsTree.firstVisibleElement;
            const element = elementToSync instanceof settingsTreeModels_1.SettingsTreeSettingElement ? elementToSync.parent :
                elementToSync instanceof settingsTreeModels_1.SettingsTreeGroupElement ? elementToSync :
                    null;
            // It's possible for this to be called when the TOC and settings tree are out of sync - e.g. when the settings tree has deferred a refresh because
            // it is focused. So, bail if element doesn't exist in the TOC.
            let nodeExists = true;
            try {
                this.tocTree.getNode(element);
            }
            catch (e) {
                nodeExists = false;
            }
            if (!nodeExists) {
                return;
            }
            if (element && this.tocTree.getSelection()[0] !== element) {
                const ancestors = this.getAncestors(element);
                ancestors.forEach(e => this.tocTree.expand(e));
                this.tocTree.reveal(element);
                const elementTop = this.tocTree.getRelativeTop(element);
                if (typeof elementTop !== 'number') {
                    return;
                }
                this.tocTree.collapseAll();
                ancestors.forEach(e => this.tocTree.expand(e));
                if (elementTop < 0 || elementTop > 1) {
                    this.tocTree.reveal(element);
                }
                else {
                    this.tocTree.reveal(element, elementTop);
                }
                this.tocTree.expand(element);
                this.tocTree.setSelection([element]);
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                fakeKeyboardEvent.fromScroll = true;
                this.tocTree.setFocus([element], fakeKeyboardEvent);
            }
        }
        getAncestors(element) {
            const ancestors = [];
            while (element.parent) {
                if (element.parent.id !== 'root') {
                    ancestors.push(element.parent);
                }
                element = element.parent;
            }
            return ancestors.reverse();
        }
        updateChangedSetting(key, value) {
            // ConfigurationService displays the error if this fails.
            // Force a render afterwards because onDidConfigurationUpdate doesn't fire if the update doesn't result in an effective setting value change
            const settingsTarget = this.settingsTargetsWidget.settingsTarget;
            const resource = uri_1.URI.isUri(settingsTarget) ? settingsTarget : undefined;
            const configurationTarget = (resource ? 5 /* WORKSPACE_FOLDER */ : settingsTarget);
            const overrides = { resource };
            const isManualReset = value === undefined;
            // If the user is changing the value back to the default, do a 'reset' instead
            const inspected = this.configurationService.inspect(key, overrides);
            if (inspected.defaultValue === value) {
                value = undefined;
            }
            return this.configurationService.updateValue(key, value, overrides, configurationTarget)
                .then(() => {
                this.renderTree(key, isManualReset);
                const reportModifiedProps = {
                    key,
                    query: this.searchWidget.getValue(),
                    searchResults: this.searchResultModel && this.searchResultModel.getUniqueResults(),
                    rawResults: this.searchResultModel && this.searchResultModel.getRawResults(),
                    showConfiguredOnly: !!this.viewState.tagFilters && this.viewState.tagFilters.has(preferences_1.MODIFIED_SETTING_TAG),
                    isReset: typeof value === 'undefined',
                    settingsTarget: this.settingsTargetsWidget.settingsTarget
                };
                return this.reportModifiedSetting(reportModifiedProps);
            });
        }
        reportModifiedSetting(props) {
            this.pendingSettingUpdate = null;
            let groupId = undefined;
            let nlpIndex = undefined;
            let displayIndex = undefined;
            if (props.searchResults) {
                const remoteResult = props.searchResults[1 /* Remote */];
                const localResult = props.searchResults[0 /* Local */];
                const localIndex = arrays.firstIndex(localResult.filterMatches, m => m.setting.key === props.key);
                groupId = localIndex >= 0 ?
                    'local' :
                    'remote';
                displayIndex = localIndex >= 0 ?
                    localIndex :
                    remoteResult && (arrays.firstIndex(remoteResult.filterMatches, m => m.setting.key === props.key) + localResult.filterMatches.length);
                if (this.searchResultModel) {
                    const rawResults = this.searchResultModel.getRawResults();
                    if (rawResults[1 /* Remote */]) {
                        const _nlpIndex = arrays.firstIndex(rawResults[1 /* Remote */].filterMatches, m => m.setting.key === props.key);
                        nlpIndex = _nlpIndex >= 0 ? _nlpIndex : undefined;
                    }
                }
            }
            const reportedTarget = props.settingsTarget === 2 /* USER_LOCAL */ ? 'user' :
                props.settingsTarget === 3 /* USER_REMOTE */ ? 'user_remote' :
                    props.settingsTarget === 4 /* WORKSPACE */ ? 'workspace' :
                        'folder';
            const data = {
                key: props.key,
                query: props.query,
                groupId,
                nlpIndex,
                displayIndex,
                showConfiguredOnly: props.showConfiguredOnly,
                isReset: props.isReset,
                target: reportedTarget
            };
            /* __GDPR__
                "settingsEditor.settingModified" : {
                    "key" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "query" : { "classification": "CustomerContent", "purpose": "FeatureInsight" },
                    "groupId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "nlpIndex" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "displayIndex" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "showConfiguredOnly" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "isReset" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "target" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('settingsEditor.settingModified', data);
        }
        render(token) {
            if (this.input) {
                return this.input.resolve()
                    .then((model) => {
                    if (token.isCancellationRequested || !(model instanceof preferencesModels_1.Settings2EditorModel)) {
                        return undefined;
                    }
                    this._register(model.onDidChangeGroups(() => {
                        this.updatedConfigSchemaDelayer.trigger(() => {
                            this.onConfigUpdate(undefined, undefined, true);
                        });
                    }));
                    this.defaultSettingsEditorModel = model;
                    return this.onConfigUpdate(undefined, true);
                });
            }
            return Promise.resolve(null);
        }
        onSearchModeToggled() {
            DOM.removeClass(this.rootElement, 'no-toc-search');
            if (this.configurationService.getValue('workbench.settings.settingsSearchTocBehavior') === 'hide') {
                DOM.toggleClass(this.rootElement, 'no-toc-search', !!this.searchResultModel);
            }
        }
        scheduleRefresh(element, key = '') {
            if (key && this.scheduledRefreshes.has(key)) {
                return;
            }
            if (!key) {
                this.scheduledRefreshes.forEach(r => r.dispose());
                this.scheduledRefreshes.clear();
            }
            const scheduledRefreshTracker = DOM.trackFocus(element);
            this.scheduledRefreshes.set(key, scheduledRefreshTracker);
            scheduledRefreshTracker.onDidBlur(() => {
                scheduledRefreshTracker.dispose();
                this.scheduledRefreshes.delete(key);
                this.onConfigUpdate([key]);
            });
        }
        async onConfigUpdate(keys, forceRefresh = false, schemaChange = false) {
            if (keys && this.settingsTreeModel) {
                return this.updateElementsByKey(keys);
            }
            const groups = this.defaultSettingsEditorModel.settingsGroups.slice(1); // Without commonlyUsed
            const dividedGroups = collections.groupBy(groups, g => g.contributedByExtension ? 'extension' : 'core');
            const settingsResult = settingsTree_1.resolveSettingsTree(settingsLayout_1.tocData, dividedGroups.core);
            const resolvedSettingsRoot = settingsResult.tree;
            // Warn for settings not included in layout
            if (settingsResult.leftoverSettings.size && !this.hasWarnedMissingSettings) {
                const settingKeyList = [];
                settingsResult.leftoverSettings.forEach(s => {
                    settingKeyList.push(s.key);
                });
                this.logService.warn(`SettingsEditor2: Settings not included in settingsLayout.ts: ${settingKeyList.join(', ')}`);
                this.hasWarnedMissingSettings = true;
            }
            const commonlyUsed = settingsTree_1.resolveSettingsTree(settingsLayout_1.commonlyUsedData, dividedGroups.core);
            resolvedSettingsRoot.children.unshift(commonlyUsed.tree);
            resolvedSettingsRoot.children.push(settingsTree_1.resolveExtensionsSettings(dividedGroups.extension || []));
            if (this.searchResultModel) {
                this.searchResultModel.updateChildren();
            }
            if (this.settingsTreeModel) {
                this.settingsTreeModel.update(resolvedSettingsRoot);
                if (schemaChange && !!this.searchResultModel) {
                    // If an extension's settings were just loaded and a search is active, retrigger the search so it shows up
                    return await this.onSearchInputChanged();
                }
                this.refreshTOCTree();
                this.renderTree(undefined, forceRefresh);
            }
            else {
                this.settingsTreeModel = this.instantiationService.createInstance(settingsTreeModels_1.SettingsTreeModel, this.viewState);
                this.settingsTreeModel.update(resolvedSettingsRoot);
                this.tocTreeModel.settingsTreeRoot = this.settingsTreeModel.root;
                const cachedState = this.restoreCachedState();
                if (cachedState && cachedState.searchQuery) {
                    await this.onSearchInputChanged();
                }
                else {
                    this.refreshTOCTree();
                    this.refreshTree();
                    this.tocTree.collapseAll();
                }
            }
        }
        updateElementsByKey(keys) {
            if (keys.length) {
                if (this.searchResultModel) {
                    keys.forEach(key => this.searchResultModel.updateElementsByName(key));
                }
                if (this.settingsTreeModel) {
                    keys.forEach(key => this.settingsTreeModel.updateElementsByName(key));
                }
                keys.forEach(key => this.renderTree(key));
            }
            else {
                return this.renderTree();
            }
        }
        getActiveElementInSettingsTree() {
            return (document.activeElement && DOM.isAncestor(document.activeElement, this.settingsTree.getHTMLElement())) ?
                document.activeElement :
                null;
        }
        renderTree(key, force = false) {
            if (!force && key && this.scheduledRefreshes.has(key)) {
                this.updateModifiedLabelForKey(key);
                return;
            }
            // If the context view is focused, delay rendering settings
            if (this.contextViewFocused()) {
                const element = document.querySelector('.context-view');
                if (element) {
                    this.scheduleRefresh(element, key);
                }
                return;
            }
            // If a setting control is currently focused, schedule a refresh for later
            const activeElement = this.getActiveElementInSettingsTree();
            const focusedSetting = activeElement && this.settingRenderers.getSettingDOMElementForDOMElement(activeElement);
            if (focusedSetting && !force) {
                // If a single setting is being refreshed, it's ok to refresh now if that is not the focused setting
                if (key) {
                    const focusedKey = focusedSetting.getAttribute(settingsTree_1.AbstractSettingRenderer.SETTING_KEY_ATTR);
                    if (focusedKey === key &&
                        // update `list`s live, as they have a separate "submit edit" step built in before this
                        (focusedSetting.parentElement && !DOM.hasClass(focusedSetting.parentElement, 'setting-item-list'))) {
                        this.updateModifiedLabelForKey(key);
                        this.scheduleRefresh(focusedSetting, key);
                        return;
                    }
                }
                else {
                    this.scheduleRefresh(focusedSetting);
                    return;
                }
            }
            this.renderResultCountMessages();
            if (key) {
                const elements = this.currentSettingsModel.getElementsByName(key);
                if (elements && elements.length) {
                    // TODO https://github.com/Microsoft/vscode/issues/57360
                    this.refreshTree();
                }
                else {
                    // Refresh requested for a key that we don't know about
                    return;
                }
            }
            else {
                this.refreshTree();
            }
            return;
        }
        contextViewFocused() {
            return !!DOM.findParentWithClass(document.activeElement, 'context-view');
        }
        refreshTree() {
            if (this.isVisible()) {
                this.settingsTree.setChildren(null, createGroupIterator(this.currentSettingsModel.root));
            }
        }
        refreshTOCTree() {
            if (this.isVisible()) {
                this.tocTreeModel.update();
                this.tocTree.setChildren(null, tocTree_1.createTOCIterator(this.tocTreeModel, this.tocTree));
            }
        }
        updateModifiedLabelForKey(key) {
            const dataElements = this.currentSettingsModel.getElementsByName(key);
            const isModified = dataElements && dataElements[0] && dataElements[0].isConfigured; // all elements are either configured or not
            const elements = this.settingRenderers.getDOMElementsForSettingKey(this.settingsTree.getHTMLElement(), key);
            if (elements && elements[0]) {
                DOM.toggleClass(elements[0], 'is-configured', !!isModified);
            }
        }
        async onSearchInputChanged() {
            const query = this.searchWidget.getValue().trim();
            this.delayedFilterLogging.cancel();
            await this.triggerSearch(query.replace(/›/g, ' '));
            if (query && this.searchResultModel) {
                this.delayedFilterLogging.trigger(() => this.reportFilteringUsed(query, this.searchResultModel.getUniqueResults()));
            }
        }
        parseSettingFromJSON(query) {
            const match = query.match(/"([a-zA-Z.]+)": /);
            return match && match[1];
        }
        triggerSearch(query) {
            this.viewState.tagFilters = new Set();
            this.viewState.extensionFilters = new Set();
            if (query) {
                const parsedQuery = settingsTreeModels_1.parseQuery(query);
                query = parsedQuery.query;
                parsedQuery.tags.forEach(tag => this.viewState.tagFilters.add(tag));
                parsedQuery.extensionFilters.forEach(extensionId => this.viewState.extensionFilters.add(extensionId));
            }
            if (query && query !== '@') {
                query = this.parseSettingFromJSON(query) || query;
                return this.triggerFilterPreferences(query);
            }
            else {
                if ((this.viewState.tagFilters && this.viewState.tagFilters.size) || (this.viewState.extensionFilters && this.viewState.extensionFilters.size)) {
                    this.searchResultModel = this.createFilterModel();
                }
                else {
                    this.searchResultModel = null;
                }
                this.localSearchDelayer.cancel();
                this.remoteSearchThrottle.cancel();
                if (this.searchInProgress) {
                    this.searchInProgress.cancel();
                    this.searchInProgress.dispose();
                    this.searchInProgress = null;
                }
                this.tocTree.setFocus([]);
                this.viewState.filterToCategory = undefined;
                this.tocTreeModel.currentSearchModel = this.searchResultModel;
                this.onSearchModeToggled();
                if (this.searchResultModel) {
                    // Added a filter model
                    this.tocTree.setSelection([]);
                    this.tocTree.expandAll();
                    this.refreshTOCTree();
                    this.renderResultCountMessages();
                    this.refreshTree();
                }
                else {
                    // Leaving search mode
                    this.tocTree.collapseAll();
                    this.refreshTOCTree();
                    this.renderResultCountMessages();
                    this.refreshTree();
                }
            }
            return Promise.resolve();
        }
        /**
         * Return a fake SearchResultModel which can hold a flat list of all settings, to be filtered (@modified etc)
         */
        createFilterModel() {
            const filterModel = this.instantiationService.createInstance(settingsTreeModels_1.SearchResultModel, this.viewState);
            const fullResult = {
                filterMatches: []
            };
            for (const g of this.defaultSettingsEditorModel.settingsGroups.slice(1)) {
                for (const sect of g.sections) {
                    for (const setting of sect.settings) {
                        fullResult.filterMatches.push({ setting, matches: [], score: 0 });
                    }
                }
            }
            filterModel.setResult(0, fullResult);
            return filterModel;
        }
        reportFilteringUsed(query, results) {
            const nlpResult = results[1 /* Remote */];
            const nlpMetadata = nlpResult && nlpResult.metadata;
            const durations = {
                nlpResult: nlpMetadata && nlpMetadata.duration
            };
            // Count unique results
            const counts = {};
            const filterResult = results[0 /* Local */];
            if (filterResult) {
                counts['filterResult'] = filterResult.filterMatches.length;
            }
            if (nlpResult) {
                counts['nlpResult'] = nlpResult.filterMatches.length;
            }
            const requestCount = nlpMetadata && nlpMetadata.requestCount;
            const data = {
                query,
                durations,
                counts,
                requestCount
            };
            /* __GDPR__
                "settingsEditor.filter" : {
                    "query": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
                    "durations.nlpResult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "counts.nlpResult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "counts.filterResult" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "requestCount" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            this.telemetryService.publicLog('settingsEditor.filter', data);
        }
        triggerFilterPreferences(query) {
            if (this.searchInProgress) {
                this.searchInProgress.cancel();
                this.searchInProgress = null;
            }
            // Trigger the local search. If it didn't find an exact match, trigger the remote search.
            const searchInProgress = this.searchInProgress = new cancellation_1.CancellationTokenSource();
            return this.localSearchDelayer.trigger(() => {
                if (searchInProgress && !searchInProgress.token.isCancellationRequested) {
                    return this.localFilterPreferences(query).then(result => {
                        if (result && !result.exactMatch) {
                            this.remoteSearchThrottle.trigger(() => {
                                return searchInProgress && !searchInProgress.token.isCancellationRequested ?
                                    this.remoteSearchPreferences(query, this.searchInProgress.token) :
                                    Promise.resolve();
                            });
                        }
                    });
                }
                else {
                    return Promise.resolve();
                }
            });
        }
        localFilterPreferences(query, token) {
            const localSearchProvider = this.preferencesSearchService.getLocalSearchProvider(query);
            return this.filterOrSearchPreferences(query, 0 /* Local */, localSearchProvider, token);
        }
        remoteSearchPreferences(query, token) {
            const remoteSearchProvider = this.preferencesSearchService.getRemoteSearchProvider(query);
            const newExtSearchProvider = this.preferencesSearchService.getRemoteSearchProvider(query, true);
            return Promise.all([
                this.filterOrSearchPreferences(query, 1 /* Remote */, remoteSearchProvider, token),
                this.filterOrSearchPreferences(query, 2 /* NewExtensions */, newExtSearchProvider, token)
            ]).then(() => { });
        }
        filterOrSearchPreferences(query, type, searchProvider, token) {
            return this._filterOrSearchPreferencesModel(query, this.defaultSettingsEditorModel, searchProvider, token).then(result => {
                if (token && token.isCancellationRequested) {
                    // Handle cancellation like this because cancellation is lost inside the search provider due to async/await
                    return null;
                }
                if (!this.searchResultModel) {
                    this.searchResultModel = this.instantiationService.createInstance(settingsTreeModels_1.SearchResultModel, this.viewState);
                    this.searchResultModel.setResult(type, result);
                    this.tocTreeModel.currentSearchModel = this.searchResultModel;
                    this.onSearchModeToggled();
                }
                else {
                    this.searchResultModel.setResult(type, result);
                    this.tocTreeModel.update();
                }
                this.tocTree.setFocus([]);
                this.viewState.filterToCategory = undefined;
                this.tocTree.expandAll();
                this.refreshTOCTree();
                this.renderTree(undefined, true);
                return result;
            });
        }
        renderResultCountMessages() {
            if (!this.currentSettingsModel) {
                return;
            }
            this.clearFilterLinkContainer.style.display = this.viewState.tagFilters && this.viewState.tagFilters.size > 0
                ? 'initial'
                : 'none';
            if (!this.searchResultModel) {
                if (this.countElement.style.display !== 'none') {
                    this.countElement.style.display = 'none';
                    this.layout(this.dimension);
                }
                DOM.removeClass(this.rootElement, 'no-results');
                return;
            }
            if (this.tocTreeModel && this.tocTreeModel.settingsTreeRoot) {
                const count = this.tocTreeModel.settingsTreeRoot.count;
                switch (count) {
                    case 0:
                        this.countElement.innerText = nls_1.localize('noResults', "No Settings Found");
                        break;
                    case 1:
                        this.countElement.innerText = nls_1.localize('oneResult', "1 Setting Found");
                        break;
                    default: this.countElement.innerText = nls_1.localize('moreThanOneResult', "{0} Settings Found", count);
                }
                if (this.countElement.style.display !== 'block') {
                    this.countElement.style.display = 'block';
                    this.layout(this.dimension);
                }
                DOM.toggleClass(this.rootElement, 'no-results', count === 0);
            }
        }
        _filterOrSearchPreferencesModel(filter, model, provider, token) {
            const searchP = provider ? provider.searchModel(model, token) : Promise.resolve(null);
            return searchP
                .then(undefined, err => {
                if (errors_1.isPromiseCanceledError(err)) {
                    return Promise.reject(err);
                }
                else {
                    /* __GDPR__
                        "settingsEditor.searchError" : {
                            "message": { "classification": "CallstackOrException", "purpose": "FeatureInsight" }
                        }
                    */
                    const message = errors_1.getErrorMessage(err).trim();
                    if (message && message !== 'Error') {
                        // "Error" = any generic network error
                        this.telemetryService.publicLogError('settingsEditor.searchError', { message });
                        this.logService.info('Setting search error: ' + message);
                    }
                    return null;
                }
            });
        }
        layoutTrees(dimension) {
            const listHeight = dimension.height - (76 + 11 /* header height + padding*/);
            const settingsTreeHeight = listHeight - 14;
            this.settingsTreeContainer.style.height = `${settingsTreeHeight}px`;
            this.settingsTree.layout(settingsTreeHeight, dimension.width);
            const tocTreeHeight = listHeight - 16;
            this.tocTreeContainer.style.height = `${tocTreeHeight}px`;
            this.tocTree.layout(tocTreeHeight);
        }
        saveState() {
            if (this.isVisible()) {
                const searchQuery = this.searchWidget.getValue().trim();
                const target = this.settingsTargetsWidget.settingsTarget;
                if (this.group && this.input) {
                    this.editorMemento.saveEditorState(this.group, this.input, { searchQuery, target });
                }
            }
            super.saveState();
        }
    };
    SettingsEditor2.ID = 'workbench.editor.settings2';
    SettingsEditor2.NUM_INSTANCES = 0;
    SettingsEditor2.SETTING_UPDATE_FAST_DEBOUNCE = 200;
    SettingsEditor2.SETTING_UPDATE_SLOW_DEBOUNCE = 1000;
    SettingsEditor2.CONFIG_SCHEMA_UPDATE_DELAYER = 500;
    SettingsEditor2.SUGGESTIONS = [
        `@${preferences_1.MODIFIED_SETTING_TAG}`, '@tag:usesOnlineServices', '@tag:sync', `@${preferences_1.EXTENSION_SETTING_TAG}`
    ];
    SettingsEditor2 = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, themeService_1.IThemeService),
        __param(3, preferences_2.IPreferencesService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, preferences_1.IPreferencesSearchService),
        __param(6, log_1.ILogService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, storage_1.IStorageService),
        __param(9, notification_1.INotificationService),
        __param(10, editorGroupsService_1.IEditorGroupsService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, storageKeys_1.IStorageKeysSyncRegistryService),
        __param(13, productService_1.IProductService),
        __param(14, userDataSync_1.IUserDataAutoSyncService)
    ], SettingsEditor2);
    exports.SettingsEditor2 = SettingsEditor2;
    let SyncControls = class SyncControls extends lifecycle_1.Disposable {
        constructor(container, commandService, userDataSyncService, userDataAutoSyncService, themeService) {
            super();
            this.commandService = commandService;
            this.userDataSyncService = userDataSyncService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this._onDidChangeLastSyncedLabel = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncedLabel = this._onDidChangeLastSyncedLabel.event;
            const headerRightControlsContainer = DOM.append(container, $('.settings-right-controls'));
            const turnOnSyncButtonContainer = DOM.append(headerRightControlsContainer, $('.turn-on-sync'));
            this.turnOnSyncButton = this._register(new button_1.Button(turnOnSyncButtonContainer, { title: true }));
            this._register(styler_1.attachButtonStyler(this.turnOnSyncButton, themeService));
            this.lastSyncedLabel = DOM.append(headerRightControlsContainer, $('.last-synced-label'));
            DOM.hide(this.lastSyncedLabel);
            this.turnOnSyncButton.enabled = true;
            this.turnOnSyncButton.label = nls_1.localize('turnOnSyncButton', "Turn on Preferences Sync");
            DOM.hide(this.turnOnSyncButton.element);
            this._register(this.turnOnSyncButton.onDidClick(async () => {
                await this.commandService.executeCommand('workbench.userDataSync.actions.turnOn');
            }));
            this.updateLastSyncedTime();
            this._register(this.userDataSyncService.onDidChangeLastSyncTime(() => {
                this.updateLastSyncedTime();
            }));
            const updateLastSyncedTimer = this._register(new async_1.IntervalTimer());
            updateLastSyncedTimer.cancelAndSet(() => this.updateLastSyncedTime(), 60 * 1000);
            this.update();
            this._register(this.userDataSyncService.onDidChangeStatus(() => {
                this.update();
            }));
            this._register(this.userDataAutoSyncService.onDidChangeEnablement(() => {
                this.update();
            }));
        }
        updateLastSyncedTime() {
            const last = this.userDataSyncService.lastSyncTime;
            let label;
            if (typeof last === 'number') {
                const d = date_1.fromNow(last, true);
                label = nls_1.localize('lastSyncedLabel', "Last synced: {0}", d);
            }
            else {
                label = '';
            }
            this.lastSyncedLabel.textContent = label;
            this._onDidChangeLastSyncedLabel.fire(label);
        }
        update() {
            if (this.userDataSyncService.status === "uninitialized" /* Uninitialized */) {
                return;
            }
            if (this.userDataAutoSyncService.isEnabled()) {
                DOM.show(this.lastSyncedLabel);
                DOM.hide(this.turnOnSyncButton.element);
            }
            else {
                DOM.hide(this.lastSyncedLabel);
                DOM.show(this.turnOnSyncButton.element);
            }
        }
    };
    SyncControls = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, userDataSync_1.IUserDataSyncService),
        __param(3, userDataSync_1.IUserDataAutoSyncService),
        __param(4, themeService_1.IThemeService)
    ], SyncControls);
    function syncAllowed(productService, configService) {
        return !!userDataSync_1.getUserDataSyncStore(productService, configService);
    }
});
//# __sourceMappingURL=settingsEditor2.js.map