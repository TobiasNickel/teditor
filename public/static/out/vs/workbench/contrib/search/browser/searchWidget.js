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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/widget", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/editor/contrib/find/findModel", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/browser/contextScopedHistoryWidget", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/common/constants", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/base/browser/ui/checkbox/checkbox", "vs/workbench/common/views", "vs/workbench/contrib/search/browser/searchIcons"], function (require, exports, dom, actionbar_1, button_1, inputBox_1, widget_1, actions_1, async_1, event_1, findModel_1, nls, clipboardService_1, configuration_1, contextkey_1, contextView_1, keybinding_1, keybindingsRegistry_1, styler_1, themeService_1, contextScopedHistoryWidget_1, searchActions_1, Constants, accessibility_1, platform_1, checkbox_1, views_1, searchIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContributions = exports.SearchWidget = exports.SingleLineInputHeight = void 0;
    /** Specified in searchview.css */
    exports.SingleLineInputHeight = 24;
    class ReplaceAllAction extends actions_1.Action {
        constructor(_searchWidget) {
            super(ReplaceAllAction.ID, '', searchIcons_1.searchReplaceAllIcon.classNames, false);
            this._searchWidget = _searchWidget;
        }
        set searchWidget(searchWidget) {
            this._searchWidget = searchWidget;
        }
        run() {
            if (this._searchWidget) {
                return this._searchWidget.triggerReplaceAll();
            }
            return Promise.resolve(null);
        }
    }
    ReplaceAllAction.ID = 'search.action.replaceAll';
    const ctrlKeyMod = (platform_1.isMacintosh ? 256 /* WinCtrl */ : 2048 /* CtrlCmd */);
    function stopPropagationForMultiLineUpwards(event, value, textarea) {
        const isMultiline = !!value.match(/\n/);
        if (textarea && (isMultiline || textarea.clientHeight > exports.SingleLineInputHeight) && textarea.selectionStart > 0) {
            event.stopPropagation();
            return;
        }
    }
    function stopPropagationForMultiLineDownwards(event, value, textarea) {
        const isMultiline = !!value.match(/\n/);
        if (textarea && (isMultiline || textarea.clientHeight > exports.SingleLineInputHeight) && textarea.selectionEnd < textarea.value.length) {
            event.stopPropagation();
            return;
        }
    }
    let SearchWidget = class SearchWidget extends widget_1.Widget {
        constructor(container, options, contextViewService, themeService, contextKeyService, keyBindingService, clipboardServce, configurationService, accessibilityService) {
            super();
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.contextKeyService = contextKeyService;
            this.keyBindingService = keyBindingService;
            this.clipboardServce = clipboardServce;
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.ignoreGlobalFindBufferOnNextFocus = false;
            this.previousGlobalFindBufferValue = null;
            this._onSearchSubmit = this._register(new event_1.Emitter());
            this.onSearchSubmit = this._onSearchSubmit.event;
            this._onSearchCancel = this._register(new event_1.Emitter());
            this.onSearchCancel = this._onSearchCancel.event;
            this._onReplaceToggled = this._register(new event_1.Emitter());
            this.onReplaceToggled = this._onReplaceToggled.event;
            this._onReplaceStateChange = this._register(new event_1.Emitter());
            this.onReplaceStateChange = this._onReplaceStateChange.event;
            this._onPreserveCaseChange = this._register(new event_1.Emitter());
            this.onPreserveCaseChange = this._onPreserveCaseChange.event;
            this._onReplaceValueChanged = this._register(new event_1.Emitter());
            this.onReplaceValueChanged = this._onReplaceValueChanged.event;
            this._onReplaceAll = this._register(new event_1.Emitter());
            this.onReplaceAll = this._onReplaceAll.event;
            this._onBlur = this._register(new event_1.Emitter());
            this.onBlur = this._onBlur.event;
            this._onDidHeightChange = this._register(new event_1.Emitter());
            this.onDidHeightChange = this._onDidHeightChange.event;
            this._onDidToggleContext = new event_1.Emitter();
            this.onDidToggleContext = this._onDidToggleContext.event;
            this.replaceActive = Constants.ReplaceActiveKey.bindTo(this.contextKeyService);
            this.searchInputBoxFocused = Constants.SearchInputBoxFocusedKey.bindTo(this.contextKeyService);
            this.replaceInputBoxFocused = Constants.ReplaceInputBoxFocusedKey.bindTo(this.contextKeyService);
            this._replaceHistoryDelayer = new async_1.Delayer(500);
            this.render(container, options);
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    this.updateAccessibilitySupport();
                }
            });
            this.accessibilityService.onDidChangeScreenReaderOptimized(() => this.updateAccessibilitySupport());
            this.updateAccessibilitySupport();
        }
        focus(select = true, focusReplace = false, suppressGlobalSearchBuffer = false) {
            this.ignoreGlobalFindBufferOnNextFocus = suppressGlobalSearchBuffer;
            if (focusReplace && this.isReplaceShown()) {
                this.replaceInput.focus();
                if (select) {
                    this.replaceInput.select();
                }
            }
            else {
                this.searchInput.focus();
                if (select) {
                    this.searchInput.select();
                }
            }
        }
        setWidth(width) {
            this.searchInput.inputBox.layout();
            this.replaceInput.width = width - 28;
            this.replaceInput.inputBox.layout();
        }
        clear() {
            this.searchInput.clear();
            this.replaceInput.setValue('');
            this.setReplaceAllActionState(false);
        }
        isReplaceShown() {
            return !dom.hasClass(this.replaceContainer, 'disabled');
        }
        isReplaceActive() {
            return !!this.replaceActive.get();
        }
        getReplaceValue() {
            return this.replaceInput.getValue();
        }
        toggleReplace(show) {
            if (show === undefined || show !== this.isReplaceShown()) {
                this.onToggleReplaceButton();
            }
        }
        getSearchHistory() {
            return this.searchInput.inputBox.getHistory();
        }
        getReplaceHistory() {
            return this.replaceInput.inputBox.getHistory();
        }
        clearHistory() {
            this.searchInput.inputBox.clearHistory();
        }
        showNextSearchTerm() {
            this.searchInput.inputBox.showNextValue();
        }
        showPreviousSearchTerm() {
            this.searchInput.inputBox.showPreviousValue();
        }
        showNextReplaceTerm() {
            this.replaceInput.inputBox.showNextValue();
        }
        showPreviousReplaceTerm() {
            this.replaceInput.inputBox.showPreviousValue();
        }
        searchInputHasFocus() {
            return !!this.searchInputBoxFocused.get();
        }
        replaceInputHasFocus() {
            return this.replaceInput.inputBox.hasFocus();
        }
        focusReplaceAllAction() {
            this.replaceActionBar.focus(true);
        }
        focusRegexAction() {
            this.searchInput.focusOnRegex();
        }
        render(container, options) {
            this.domNode = dom.append(container, dom.$('.search-widget'));
            this.domNode.style.position = 'relative';
            if (!options._hideReplaceToggle) {
                this.renderToggleReplaceButton(this.domNode);
            }
            this.renderSearchInput(this.domNode, options);
            this.renderReplaceInput(this.domNode, options);
        }
        updateAccessibilitySupport() {
            this.searchInput.setFocusInputOnOptionClick(!this.accessibilityService.isScreenReaderOptimized());
        }
        renderToggleReplaceButton(parent) {
            const opts = {
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined
            };
            this.toggleReplaceButton = this._register(new button_1.Button(parent, opts));
            this.toggleReplaceButton.element.setAttribute('aria-expanded', 'false');
            dom.addClasses(this.toggleReplaceButton.element, searchIcons_1.searchHideReplaceIcon.classNames);
            this.toggleReplaceButton.icon = 'toggle-replace-button';
            // TODO@joh need to dispose this listener eventually
            this.toggleReplaceButton.onDidClick(() => this.onToggleReplaceButton());
            this.toggleReplaceButton.element.title = nls.localize('search.replace.toggle.button.title', "Toggle Replace");
        }
        renderSearchInput(parent, options) {
            var _a;
            const inputOptions = {
                label: nls.localize('label.Search', 'Search: Type Search Term and press Enter to search or Escape to cancel'),
                validation: (value) => this.validateSearchInput(value),
                placeholder: nls.localize('search.placeHolder', "Search"),
                appendCaseSensitiveLabel: searchActions_1.appendKeyBindingLabel('', this.keyBindingService.lookupKeybinding(Constants.ToggleCaseSensitiveCommandId), this.keyBindingService),
                appendWholeWordsLabel: searchActions_1.appendKeyBindingLabel('', this.keyBindingService.lookupKeybinding(Constants.ToggleWholeWordCommandId), this.keyBindingService),
                appendRegexLabel: searchActions_1.appendKeyBindingLabel('', this.keyBindingService.lookupKeybinding(Constants.ToggleRegexCommandId), this.keyBindingService),
                history: options.searchHistory,
                flexibleHeight: true
            };
            const searchInputContainer = dom.append(parent, dom.$('.search-container.input-box'));
            this.searchInput = this._register(new contextScopedHistoryWidget_1.ContextScopedFindInput(searchInputContainer, this.contextViewService, inputOptions, this.contextKeyService, true));
            this._register(styler_1.attachFindReplaceInputBoxStyler(this.searchInput, this.themeService));
            this.searchInput.onKeyDown((keyboardEvent) => this.onSearchInputKeyDown(keyboardEvent));
            this.searchInput.setValue(options.value || '');
            this.searchInput.setRegex(!!options.isRegex);
            this.searchInput.setCaseSensitive(!!options.isCaseSensitive);
            this.searchInput.setWholeWords(!!options.isWholeWords);
            this._register(this.searchInput.onCaseSensitiveKeyDown((keyboardEvent) => this.onCaseSensitiveKeyDown(keyboardEvent)));
            this._register(this.searchInput.onRegexKeyDown((keyboardEvent) => this.onRegexKeyDown(keyboardEvent)));
            this._register(this.searchInput.inputBox.onDidChange(() => this.onSearchInputChanged()));
            this._register(this.searchInput.inputBox.onDidHeightChange(() => this._onDidHeightChange.fire()));
            this._register(this.onReplaceValueChanged(() => {
                this._replaceHistoryDelayer.trigger(() => this.replaceInput.inputBox.addToHistory());
            }));
            this.searchInputFocusTracker = this._register(dom.trackFocus(this.searchInput.inputBox.inputElement));
            this._register(this.searchInputFocusTracker.onDidFocus(async () => {
                this.searchInputBoxFocused.set(true);
                const useGlobalFindBuffer = this.searchConfiguration.globalFindClipboard;
                if (!this.ignoreGlobalFindBufferOnNextFocus && useGlobalFindBuffer) {
                    const globalBufferText = await this.clipboardServce.readFindText();
                    if (this.previousGlobalFindBufferValue !== globalBufferText) {
                        this.searchInput.inputBox.addToHistory();
                        this.searchInput.setValue(globalBufferText);
                        this.searchInput.select();
                    }
                    this.previousGlobalFindBufferValue = globalBufferText;
                }
                this.ignoreGlobalFindBufferOnNextFocus = false;
            }));
            this._register(this.searchInputFocusTracker.onDidBlur(() => this.searchInputBoxFocused.set(false)));
            this.showContextCheckbox = new checkbox_1.Checkbox({ isChecked: false, title: nls.localize('showContext', "Show Context"), icon: searchIcons_1.searchShowContextIcon });
            this._register(this.showContextCheckbox.onChange(() => this.onContextLinesChanged()));
            if (options.showContextToggle) {
                this.contextLinesInput = new inputBox_1.InputBox(searchInputContainer, this.contextViewService, { type: 'number' });
                dom.addClass(this.contextLinesInput.element, 'context-lines-input');
                this.contextLinesInput.value = '' + ((_a = this.configurationService.getValue('search').searchEditor.defaultNumberOfContextLines) !== null && _a !== void 0 ? _a : 1);
                this._register(this.contextLinesInput.onDidChange(() => this.onContextLinesChanged()));
                this._register(styler_1.attachInputBoxStyler(this.contextLinesInput, this.themeService));
                dom.append(searchInputContainer, this.showContextCheckbox.domNode);
            }
        }
        onContextLinesChanged() {
            dom.toggleClass(this.domNode, 'show-context', this.showContextCheckbox.checked);
            this._onDidToggleContext.fire();
            if (this.contextLinesInput.value.includes('-')) {
                this.contextLinesInput.value = '0';
            }
            this._onDidToggleContext.fire();
        }
        setContextLines(lines) {
            if (!this.contextLinesInput) {
                return;
            }
            if (lines === 0) {
                this.showContextCheckbox.checked = false;
            }
            else {
                this.showContextCheckbox.checked = true;
                this.contextLinesInput.value = '' + lines;
            }
            dom.toggleClass(this.domNode, 'show-context', this.showContextCheckbox.checked);
        }
        renderReplaceInput(parent, options) {
            this.replaceContainer = dom.append(parent, dom.$('.replace-container.disabled'));
            const replaceBox = dom.append(this.replaceContainer, dom.$('.replace-input'));
            this.replaceInput = this._register(new contextScopedHistoryWidget_1.ContextScopedReplaceInput(replaceBox, this.contextViewService, {
                label: nls.localize('label.Replace', 'Replace: Type replace term and press Enter to preview or Escape to cancel'),
                placeholder: nls.localize('search.replace.placeHolder', "Replace"),
                history: options.replaceHistory,
                flexibleHeight: true
            }, this.contextKeyService, true));
            this._register(this.replaceInput.onDidOptionChange(viaKeyboard => {
                if (!viaKeyboard) {
                    this._onPreserveCaseChange.fire(this.replaceInput.getPreserveCase());
                }
            }));
            this._register(styler_1.attachFindReplaceInputBoxStyler(this.replaceInput, this.themeService));
            this.replaceInput.onKeyDown((keyboardEvent) => this.onReplaceInputKeyDown(keyboardEvent));
            this.replaceInput.setValue(options.replaceValue || '');
            this._register(this.replaceInput.inputBox.onDidChange(() => this._onReplaceValueChanged.fire()));
            this._register(this.replaceInput.inputBox.onDidHeightChange(() => this._onDidHeightChange.fire()));
            this.replaceAllAction = new ReplaceAllAction(this);
            this.replaceAllAction.label = SearchWidget.REPLACE_ALL_DISABLED_LABEL;
            this.replaceActionBar = this._register(new actionbar_1.ActionBar(this.replaceContainer));
            this.replaceActionBar.push([this.replaceAllAction], { icon: true, label: false });
            this.onkeydown(this.replaceActionBar.domNode, (keyboardEvent) => this.onReplaceActionbarKeyDown(keyboardEvent));
            this.replaceInputFocusTracker = this._register(dom.trackFocus(this.replaceInput.inputBox.inputElement));
            this._register(this.replaceInputFocusTracker.onDidFocus(() => this.replaceInputBoxFocused.set(true)));
            this._register(this.replaceInputFocusTracker.onDidBlur(() => this.replaceInputBoxFocused.set(false)));
            this._register(this.replaceInput.onPreserveCaseKeyDown((keyboardEvent) => this.onPreserveCaseKeyDown(keyboardEvent)));
        }
        triggerReplaceAll() {
            this._onReplaceAll.fire();
            return Promise.resolve(null);
        }
        onToggleReplaceButton() {
            dom.toggleClass(this.replaceContainer, 'disabled');
            if (this.isReplaceShown()) {
                dom.removeClasses(this.toggleReplaceButton.element, searchIcons_1.searchHideReplaceIcon.classNames);
                dom.addClasses(this.toggleReplaceButton.element, searchIcons_1.searchShowReplaceIcon.classNames);
            }
            else {
                dom.removeClasses(this.toggleReplaceButton.element, searchIcons_1.searchShowReplaceIcon.classNames);
                dom.addClasses(this.toggleReplaceButton.element, searchIcons_1.searchHideReplaceIcon.classNames);
            }
            this.toggleReplaceButton.element.setAttribute('aria-expanded', this.isReplaceShown() ? 'true' : 'false');
            this.updateReplaceActiveState();
            this._onReplaceToggled.fire();
        }
        setValue(value) {
            this.searchInput.setValue(value);
        }
        setReplaceAllActionState(enabled) {
            if (this.replaceAllAction.enabled !== enabled) {
                this.replaceAllAction.enabled = enabled;
                this.replaceAllAction.label = enabled ? SearchWidget.REPLACE_ALL_ENABLED_LABEL(this.keyBindingService) : SearchWidget.REPLACE_ALL_DISABLED_LABEL;
                this.updateReplaceActiveState();
            }
        }
        updateReplaceActiveState() {
            const currentState = this.isReplaceActive();
            const newState = this.isReplaceShown() && this.replaceAllAction.enabled;
            if (currentState !== newState) {
                this.replaceActive.set(newState);
                this._onReplaceStateChange.fire(newState);
                this.replaceInput.inputBox.layout();
            }
        }
        validateSearchInput(value) {
            if (value.length === 0) {
                return null;
            }
            if (!this.searchInput.getRegex()) {
                return null;
            }
            try {
                new RegExp(value, 'u');
            }
            catch (e) {
                return { content: e.message };
            }
            return null;
        }
        onSearchInputChanged() {
            var _a, _b;
            this.searchInput.clearMessage();
            this.setReplaceAllActionState(false);
            if (this.searchConfiguration.searchOnType) {
                if (this.searchInput.getRegex()) {
                    try {
                        const regex = new RegExp(this.searchInput.getValue(), 'ug');
                        const matchienessHeuristic = (_b = (_a = `
								~!@#$%^&*()_+
								\`1234567890-=
								qwertyuiop[]\\
								QWERTYUIOP{}|
								asdfghjkl;'
								ASDFGHJKL:"
								zxcvbnm,./
								ZXCVBNM<>? `.match(regex)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                        const delayMultiplier = matchienessHeuristic < 50 ? 1 :
                            matchienessHeuristic < 100 ? 5 : // expressions like `.` or `\w`
                                10; // only things matching empty string
                        this.submitSearch(true, this.searchConfiguration.searchOnTypeDebouncePeriod * delayMultiplier);
                    }
                    catch (_c) {
                        // pass
                    }
                }
                else {
                    this.submitSearch(true, this.searchConfiguration.searchOnTypeDebouncePeriod);
                }
            }
        }
        onSearchInputKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(ctrlKeyMod | 3 /* Enter */)) {
                this.searchInput.inputBox.insertAtCursor('\n');
                keyboardEvent.preventDefault();
            }
            if (keyboardEvent.equals(3 /* Enter */)) {
                this.searchInput.onSearchSubmit();
                this.submitSearch();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(9 /* Escape */)) {
                this._onSearchCancel.fire({ focus: true });
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(2 /* Tab */)) {
                if (this.isReplaceShown()) {
                    this.replaceInput.focus();
                }
                else {
                    this.searchInput.focusOnCaseSensitive();
                }
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(16 /* UpArrow */)) {
                stopPropagationForMultiLineUpwards(keyboardEvent, this.searchInput.getValue(), this.searchInput.domNode.querySelector('textarea'));
            }
            else if (keyboardEvent.equals(18 /* DownArrow */)) {
                stopPropagationForMultiLineDownwards(keyboardEvent, this.searchInput.getValue(), this.searchInput.domNode.querySelector('textarea'));
            }
        }
        onCaseSensitiveKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(1024 /* Shift */ | 2 /* Tab */)) {
                if (this.isReplaceShown()) {
                    this.replaceInput.focus();
                    keyboardEvent.preventDefault();
                }
            }
        }
        onRegexKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(2 /* Tab */)) {
                if (this.isReplaceShown()) {
                    this.replaceInput.focusOnPreserve();
                    keyboardEvent.preventDefault();
                }
            }
        }
        onPreserveCaseKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(2 /* Tab */)) {
                if (this.isReplaceActive()) {
                    this.focusReplaceAllAction();
                }
                else {
                    this._onBlur.fire();
                }
                keyboardEvent.preventDefault();
            }
            else if (1024 /* Shift */ | 2 /* Tab */) {
                this.focusRegexAction();
                keyboardEvent.preventDefault();
            }
        }
        onReplaceInputKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(ctrlKeyMod | 3 /* Enter */)) {
                this.replaceInput.inputBox.insertAtCursor('\n');
                keyboardEvent.preventDefault();
            }
            if (keyboardEvent.equals(3 /* Enter */)) {
                this.submitSearch();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(2 /* Tab */)) {
                this.searchInput.focusOnCaseSensitive();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(1024 /* Shift */ | 2 /* Tab */)) {
                this.searchInput.focus();
                keyboardEvent.preventDefault();
            }
            else if (keyboardEvent.equals(16 /* UpArrow */)) {
                stopPropagationForMultiLineUpwards(keyboardEvent, this.replaceInput.getValue(), this.replaceInput.domNode.querySelector('textarea'));
            }
            else if (keyboardEvent.equals(18 /* DownArrow */)) {
                stopPropagationForMultiLineDownwards(keyboardEvent, this.replaceInput.getValue(), this.replaceInput.domNode.querySelector('textarea'));
            }
        }
        onReplaceActionbarKeyDown(keyboardEvent) {
            if (keyboardEvent.equals(1024 /* Shift */ | 2 /* Tab */)) {
                this.focusRegexAction();
                keyboardEvent.preventDefault();
            }
        }
        async submitSearch(triggeredOnType = false, delay = 0) {
            this.searchInput.validate();
            if (!this.searchInput.inputBox.isInputValid()) {
                return;
            }
            const value = this.searchInput.getValue();
            const useGlobalFindBuffer = this.searchConfiguration.globalFindClipboard;
            if (value && useGlobalFindBuffer) {
                await this.clipboardServce.writeFindText(value);
            }
            this._onSearchSubmit.fire({ triggeredOnType, delay });
        }
        getContextLines() {
            return this.showContextCheckbox.checked ? +this.contextLinesInput.value : 0;
        }
        modifyContextLines(increase) {
            const current = +this.contextLinesInput.value;
            const modified = current + (increase ? 1 : -1);
            this.showContextCheckbox.checked = modified !== 0;
            this.contextLinesInput.value = '' + modified;
        }
        toggleContextLines() {
            this.showContextCheckbox.checked = !this.showContextCheckbox.checked;
            this.onContextLinesChanged();
        }
        dispose() {
            this.setReplaceAllActionState(false);
            super.dispose();
        }
        get searchConfiguration() {
            return this.configurationService.getValue('search');
        }
    };
    SearchWidget.REPLACE_ALL_DISABLED_LABEL = nls.localize('search.action.replaceAll.disabled.label', "Replace All (Submit Search to Enable)");
    SearchWidget.REPLACE_ALL_ENABLED_LABEL = (keyBindingService2) => {
        const kb = keyBindingService2.lookupKeybinding(ReplaceAllAction.ID);
        return searchActions_1.appendKeyBindingLabel(nls.localize('search.action.replaceAll.enabled.label', "Replace All"), kb, keyBindingService2);
    };
    SearchWidget = __decorate([
        __param(2, contextView_1.IContextViewService),
        __param(3, themeService_1.IThemeService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, clipboardService_1.IClipboardService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, accessibility_1.IAccessibilityService)
    ], SearchWidget);
    exports.SearchWidget = SearchWidget;
    function registerContributions() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: ReplaceAllAction.ID,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, findModel_1.CONTEXT_FIND_WIDGET_NOT_VISIBLE),
            primary: 512 /* Alt */ | 2048 /* CtrlCmd */ | 3 /* Enter */,
            handler: accessor => {
                const viewsService = accessor.get(views_1.IViewsService);
                if (searchActions_1.isSearchViewFocused(viewsService)) {
                    const searchView = searchActions_1.getSearchView(viewsService);
                    if (searchView) {
                        new ReplaceAllAction(searchView.searchAndReplaceWidget).run();
                    }
                }
            }
        });
    }
    exports.registerContributions = registerContributions;
});
//# __sourceMappingURL=searchWidget.js.map