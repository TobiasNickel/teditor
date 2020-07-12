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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/editor/contrib/find/findState", "vs/editor/contrib/find/findWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/browser/contextScopedHistoryWidget", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/theme/common/styler", "vs/css!./simpleFindReplaceWidget"], function (require, exports, nls, dom, widget_1, async_1, findState_1, findWidget_1, contextkey_1, contextView_1, colorRegistry_1, themeService_1, contextScopedHistoryWidget_1, progressbar_1, styler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleFindReplaceWidget = void 0;
    const NLS_FIND_INPUT_LABEL = nls.localize('label.find', "Find");
    const NLS_FIND_INPUT_PLACEHOLDER = nls.localize('placeholder.find', "Find");
    const NLS_PREVIOUS_MATCH_BTN_LABEL = nls.localize('label.previousMatchButton', "Previous match");
    const NLS_NEXT_MATCH_BTN_LABEL = nls.localize('label.nextMatchButton', "Next match");
    const NLS_CLOSE_BTN_LABEL = nls.localize('label.closeButton', "Close");
    const NLS_TOGGLE_REPLACE_MODE_BTN_LABEL = nls.localize('label.toggleReplaceButton', "Toggle Replace mode");
    const NLS_REPLACE_INPUT_LABEL = nls.localize('label.replace', "Replace");
    const NLS_REPLACE_INPUT_PLACEHOLDER = nls.localize('placeholder.replace', "Replace");
    const NLS_REPLACE_BTN_LABEL = nls.localize('label.replaceButton', "Replace");
    const NLS_REPLACE_ALL_BTN_LABEL = nls.localize('label.replaceAllButton', "Replace All");
    let SimpleFindReplaceWidget = class SimpleFindReplaceWidget extends widget_1.Widget {
        constructor(_contextViewService, contextKeyService, _themeService, _state = new findState_1.FindReplaceState(), showOptionButtons) {
            super();
            this._contextViewService = _contextViewService;
            this._themeService = _themeService;
            this._state = _state;
            this._isVisible = false;
            this._isReplaceVisible = false;
            this.foundMatch = false;
            this._domNode = document.createElement('div');
            this._domNode.classList.add('simple-fr-find-part-wrapper');
            this._register(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            let progressContainer = dom.$('.find-replace-progress');
            this._progressBar = new progressbar_1.ProgressBar(progressContainer);
            this._register(styler_1.attachProgressBarStyler(this._progressBar, this._themeService));
            this._domNode.appendChild(progressContainer);
            // Toggle replace button
            this._toggleReplaceBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_TOGGLE_REPLACE_MODE_BTN_LABEL,
                className: 'codicon toggle left',
                onTrigger: () => {
                    this._isReplaceVisible = !this._isReplaceVisible;
                    this._state.change({ isReplaceRevealed: this._isReplaceVisible }, false);
                    if (this._isReplaceVisible) {
                        this._innerReplaceDomNode.style.display = 'flex';
                    }
                    else {
                        this._innerReplaceDomNode.style.display = 'none';
                    }
                }
            }));
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            this._domNode.appendChild(this._toggleReplaceBtn.domNode);
            this._innerFindDomNode = document.createElement('div');
            this._innerFindDomNode.classList.add('simple-fr-find-part');
            this._findInput = this._register(new contextScopedHistoryWidget_1.ContextScopedFindInput(null, this._contextViewService, {
                label: NLS_FIND_INPUT_LABEL,
                placeholder: NLS_FIND_INPUT_PLACEHOLDER,
                validation: (value) => {
                    if (value.length === 0 || !this._findInput.getRegex()) {
                        return null;
                    }
                    try {
                        new RegExp(value);
                        return null;
                    }
                    catch (e) {
                        this.foundMatch = false;
                        this.updateButtons(this.foundMatch);
                        return { content: e.message };
                    }
                }
            }, contextKeyService, showOptionButtons));
            // Find History with update delayer
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this.oninput(this._findInput.domNode, (e) => {
                this.foundMatch = this.onInputChanged();
                this.updateButtons(this.foundMatch);
                this._delayedUpdateHistory();
            });
            this._findInput.setRegex(!!this._state.isRegex);
            this._findInput.setCaseSensitive(!!this._state.matchCase);
            this._findInput.setWholeWords(!!this._state.wholeWord);
            this._register(this._findInput.onDidOptionChange(() => {
                this._state.change({
                    isRegex: this._findInput.getRegex(),
                    wholeWord: this._findInput.getWholeWords(),
                    matchCase: this._findInput.getCaseSensitive()
                }, true);
            }));
            this._register(this._state.onFindReplaceStateChange(() => {
                this._findInput.setRegex(this._state.isRegex);
                this._findInput.setWholeWords(this._state.wholeWord);
                this._findInput.setCaseSensitive(this._state.matchCase);
                this.findFirst();
            }));
            this.prevBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_PREVIOUS_MATCH_BTN_LABEL,
                className: findWidget_1.findPreviousMatchIcon.classNames,
                onTrigger: () => {
                    this.find(true);
                }
            }));
            this.nextBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_NEXT_MATCH_BTN_LABEL,
                className: findWidget_1.findNextMatchIcon.classNames,
                onTrigger: () => {
                    this.find(false);
                }
            }));
            const closeBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_CLOSE_BTN_LABEL,
                className: findWidget_1.findCloseIcon.classNames,
                onTrigger: () => {
                    this.hide();
                }
            }));
            this._innerFindDomNode.appendChild(this._findInput.domNode);
            this._innerFindDomNode.appendChild(this.prevBtn.domNode);
            this._innerFindDomNode.appendChild(this.nextBtn.domNode);
            this._innerFindDomNode.appendChild(closeBtn.domNode);
            // _domNode wraps _innerDomNode, ensuring that
            this._domNode.appendChild(this._innerFindDomNode);
            this.onkeyup(this._innerFindDomNode, e => {
                if (e.equals(9 /* Escape */)) {
                    this.hide();
                    e.preventDefault();
                    return;
                }
            });
            this._focusTracker = this._register(dom.trackFocus(this._innerFindDomNode));
            this._register(this._focusTracker.onDidFocus(this.onFocusTrackerFocus.bind(this)));
            this._register(this._focusTracker.onDidBlur(this.onFocusTrackerBlur.bind(this)));
            this._findInputFocusTracker = this._register(dom.trackFocus(this._findInput.domNode));
            this._register(this._findInputFocusTracker.onDidFocus(this.onFindInputFocusTrackerFocus.bind(this)));
            this._register(this._findInputFocusTracker.onDidBlur(this.onFindInputFocusTrackerBlur.bind(this)));
            this._register(dom.addDisposableListener(this._innerFindDomNode, 'click', (event) => {
                event.stopPropagation();
            }));
            // Replace
            this._innerReplaceDomNode = document.createElement('div');
            this._innerReplaceDomNode.classList.add('simple-fr-replace-part');
            this._replaceInput = this._register(new contextScopedHistoryWidget_1.ContextScopedReplaceInput(null, undefined, {
                label: NLS_REPLACE_INPUT_LABEL,
                placeholder: NLS_REPLACE_INPUT_PLACEHOLDER,
                history: []
            }, contextKeyService, false));
            this._innerReplaceDomNode.appendChild(this._replaceInput.domNode);
            this._replaceInputFocusTracker = this._register(dom.trackFocus(this._replaceInput.domNode));
            this._register(this._replaceInputFocusTracker.onDidFocus(this.onReplaceInputFocusTrackerFocus.bind(this)));
            this._register(this._replaceInputFocusTracker.onDidBlur(this.onReplaceInputFocusTrackerBlur.bind(this)));
            this._domNode.appendChild(this._innerReplaceDomNode);
            if (this._isReplaceVisible) {
                this._innerReplaceDomNode.style.display = 'flex';
            }
            else {
                this._innerReplaceDomNode.style.display = 'none';
            }
            this._replaceBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_REPLACE_BTN_LABEL,
                className: findWidget_1.findReplaceIcon.classNames,
                onTrigger: () => {
                    this.replaceOne();
                }
            }));
            // Replace all button
            this._replaceAllBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_REPLACE_ALL_BTN_LABEL,
                className: findWidget_1.findReplaceAllIcon.classNames,
                onTrigger: () => {
                    this.replaceAll();
                }
            }));
            this._innerReplaceDomNode.appendChild(this._replaceBtn.domNode);
            this._innerReplaceDomNode.appendChild(this._replaceAllBtn.domNode);
        }
        get inputValue() {
            return this._findInput.getValue();
        }
        get replaceValue() {
            return this._replaceInput.getValue();
        }
        get focusTracker() {
            return this._focusTracker;
        }
        updateTheme(theme) {
            const inputStyles = {
                inputActiveOptionBorder: theme.getColor(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: theme.getColor(colorRegistry_1.inputActiveOptionBackground),
                inputActiveOptionBackground: theme.getColor(colorRegistry_1.inputActiveOptionBackground),
                inputBackground: theme.getColor(colorRegistry_1.inputBackground),
                inputForeground: theme.getColor(colorRegistry_1.inputForeground),
                inputBorder: theme.getColor(colorRegistry_1.inputBorder),
                inputValidationInfoBackground: theme.getColor(colorRegistry_1.inputValidationInfoBackground),
                inputValidationInfoForeground: theme.getColor(colorRegistry_1.inputValidationInfoForeground),
                inputValidationInfoBorder: theme.getColor(colorRegistry_1.inputValidationInfoBorder),
                inputValidationWarningBackground: theme.getColor(colorRegistry_1.inputValidationWarningBackground),
                inputValidationWarningForeground: theme.getColor(colorRegistry_1.inputValidationWarningForeground),
                inputValidationWarningBorder: theme.getColor(colorRegistry_1.inputValidationWarningBorder),
                inputValidationErrorBackground: theme.getColor(colorRegistry_1.inputValidationErrorBackground),
                inputValidationErrorForeground: theme.getColor(colorRegistry_1.inputValidationErrorForeground),
                inputValidationErrorBorder: theme.getColor(colorRegistry_1.inputValidationErrorBorder)
            };
            this._findInput.style(inputStyles);
            const replaceStyles = {
                inputActiveOptionBorder: theme.getColor(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: theme.getColor(colorRegistry_1.inputActiveOptionForeground),
                inputActiveOptionBackground: theme.getColor(colorRegistry_1.inputActiveOptionBackground),
                inputBackground: theme.getColor(colorRegistry_1.inputBackground),
                inputForeground: theme.getColor(colorRegistry_1.inputForeground),
                inputBorder: theme.getColor(colorRegistry_1.inputBorder),
                inputValidationInfoBackground: theme.getColor(colorRegistry_1.inputValidationInfoBackground),
                inputValidationInfoForeground: theme.getColor(colorRegistry_1.inputValidationInfoForeground),
                inputValidationInfoBorder: theme.getColor(colorRegistry_1.inputValidationInfoBorder),
                inputValidationWarningBackground: theme.getColor(colorRegistry_1.inputValidationWarningBackground),
                inputValidationWarningForeground: theme.getColor(colorRegistry_1.inputValidationWarningForeground),
                inputValidationWarningBorder: theme.getColor(colorRegistry_1.inputValidationWarningBorder),
                inputValidationErrorBackground: theme.getColor(colorRegistry_1.inputValidationErrorBackground),
                inputValidationErrorForeground: theme.getColor(colorRegistry_1.inputValidationErrorForeground),
                inputValidationErrorBorder: theme.getColor(colorRegistry_1.inputValidationErrorBorder)
            };
            this._replaceInput.style(replaceStyles);
        }
        _onStateChanged(e) {
            this._updateButtons();
        }
        _updateButtons() {
            this._findInput.setEnabled(this._isVisible);
            this._replaceInput.setEnabled(this._isVisible && this._isReplaceVisible);
            let findInputIsNonEmpty = (this._state.searchString.length > 0);
            this._replaceBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._replaceAllBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            dom.toggleClass(this._domNode, 'replaceToggled', this._isReplaceVisible);
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
        }
        dispose() {
            super.dispose();
            if (this._domNode && this._domNode.parentElement) {
                this._domNode.parentElement.removeChild(this._domNode);
            }
        }
        getDomNode() {
            return this._domNode;
        }
        reveal(initialInput) {
            if (initialInput) {
                this._findInput.setValue(initialInput);
            }
            if (this._isVisible) {
                this._findInput.select();
                return;
            }
            this._isVisible = true;
            this.updateButtons(this.foundMatch);
            setTimeout(() => {
                dom.addClass(this._domNode, 'visible');
                dom.addClass(this._domNode, 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                this._findInput.select();
            }, 0);
        }
        focus() {
            this._findInput.focus();
        }
        show(initialInput) {
            if (initialInput && !this._isVisible) {
                this._findInput.setValue(initialInput);
            }
            this._isVisible = true;
            setTimeout(() => {
                dom.addClass(this._domNode, 'visible');
                dom.addClass(this._domNode, 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                this.focus();
            }, 0);
        }
        hide() {
            if (this._isVisible) {
                dom.removeClass(this._domNode, 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'true');
                // Need to delay toggling visibility until after Transition, then visibility hidden - removes from tabIndex list
                setTimeout(() => {
                    this._isVisible = false;
                    this.updateButtons(this.foundMatch);
                    dom.removeClass(this._domNode, 'visible');
                }, 200);
            }
        }
        _delayedUpdateHistory() {
            this._updateHistoryDelayer.trigger(this._updateHistory.bind(this));
        }
        _updateHistory() {
            this._findInput.inputBox.addToHistory();
        }
        _getRegexValue() {
            return this._findInput.getRegex();
        }
        _getWholeWordValue() {
            return this._findInput.getWholeWords();
        }
        _getCaseSensitiveValue() {
            return this._findInput.getCaseSensitive();
        }
        updateButtons(foundMatch) {
            const hasInput = this.inputValue.length > 0;
            this.prevBtn.setEnabled(this._isVisible && hasInput && foundMatch);
            this.nextBtn.setEnabled(this._isVisible && hasInput && foundMatch);
        }
    };
    SimpleFindReplaceWidget = __decorate([
        __param(0, contextView_1.IContextViewService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, themeService_1.IThemeService)
    ], SimpleFindReplaceWidget);
    exports.SimpleFindReplaceWidget = SimpleFindReplaceWidget;
    // theming
    themeService_1.registerThemingParticipant((theme, collector) => {
        const findWidgetBGColor = theme.getColor(colorRegistry_1.editorWidgetBackground);
        if (findWidgetBGColor) {
            collector.addRule(`.monaco-workbench .simple-fr-find-part-wrapper { background-color: ${findWidgetBGColor} !important; }`);
        }
        const widgetForeground = theme.getColor(colorRegistry_1.editorWidgetForeground);
        if (widgetForeground) {
            collector.addRule(`.monaco-workbench .simple-fr-find-part-wrapper { color: ${widgetForeground}; }`);
        }
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-workbench .simple-fr-find-part-wrapper { box-shadow: 0 2px 8px ${widgetShadowColor}; }`);
        }
    });
});
//# __sourceMappingURL=simpleFindReplaceWidget.js.map