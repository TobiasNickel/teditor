/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/findinput/findInputCheckboxes", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/editor/contrib/find/findModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom, findInputCheckboxes_1, widget_1, async_1, findModel_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindOptionsWidget = void 0;
    class FindOptionsWidget extends widget_1.Widget {
        constructor(editor, state, keybindingService, themeService) {
            super();
            this._hideSoon = this._register(new async_1.RunOnceScheduler(() => this._hide(), 2000));
            this._isVisible = false;
            this._editor = editor;
            this._state = state;
            this._keybindingService = keybindingService;
            this._domNode = document.createElement('div');
            this._domNode.className = 'findOptionsWidget';
            this._domNode.style.display = 'none';
            this._domNode.style.top = '10px';
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            const inputActiveOptionBorderColor = themeService.getColorTheme().getColor(colorRegistry_1.inputActiveOptionBorder);
            const inputActiveOptionForegroundColor = themeService.getColorTheme().getColor(colorRegistry_1.inputActiveOptionForeground);
            const inputActiveOptionBackgroundColor = themeService.getColorTheme().getColor(colorRegistry_1.inputActiveOptionBackground);
            this.caseSensitive = this._register(new findInputCheckboxes_1.CaseSensitiveCheckbox({
                appendTitle: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleCaseSensitiveCommand),
                isChecked: this._state.matchCase,
                inputActiveOptionBorder: inputActiveOptionBorderColor,
                inputActiveOptionForeground: inputActiveOptionForegroundColor,
                inputActiveOptionBackground: inputActiveOptionBackgroundColor
            }));
            this._domNode.appendChild(this.caseSensitive.domNode);
            this._register(this.caseSensitive.onChange(() => {
                this._state.change({
                    matchCase: this.caseSensitive.checked
                }, false);
            }));
            this.wholeWords = this._register(new findInputCheckboxes_1.WholeWordsCheckbox({
                appendTitle: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleWholeWordCommand),
                isChecked: this._state.wholeWord,
                inputActiveOptionBorder: inputActiveOptionBorderColor,
                inputActiveOptionForeground: inputActiveOptionForegroundColor,
                inputActiveOptionBackground: inputActiveOptionBackgroundColor
            }));
            this._domNode.appendChild(this.wholeWords.domNode);
            this._register(this.wholeWords.onChange(() => {
                this._state.change({
                    wholeWord: this.wholeWords.checked
                }, false);
            }));
            this.regex = this._register(new findInputCheckboxes_1.RegexCheckbox({
                appendTitle: this._keybindingLabelFor(findModel_1.FIND_IDS.ToggleRegexCommand),
                isChecked: this._state.isRegex,
                inputActiveOptionBorder: inputActiveOptionBorderColor,
                inputActiveOptionForeground: inputActiveOptionForegroundColor,
                inputActiveOptionBackground: inputActiveOptionBackgroundColor
            }));
            this._domNode.appendChild(this.regex.domNode);
            this._register(this.regex.onChange(() => {
                this._state.change({
                    isRegex: this.regex.checked
                }, false);
            }));
            this._editor.addOverlayWidget(this);
            this._register(this._state.onFindReplaceStateChange((e) => {
                let somethingChanged = false;
                if (e.isRegex) {
                    this.regex.checked = this._state.isRegex;
                    somethingChanged = true;
                }
                if (e.wholeWord) {
                    this.wholeWords.checked = this._state.wholeWord;
                    somethingChanged = true;
                }
                if (e.matchCase) {
                    this.caseSensitive.checked = this._state.matchCase;
                    somethingChanged = true;
                }
                if (!this._state.isRevealed && somethingChanged) {
                    this._revealTemporarily();
                }
            }));
            this._register(dom.addDisposableNonBubblingMouseOutListener(this._domNode, (e) => this._onMouseOut()));
            this._register(dom.addDisposableListener(this._domNode, 'mouseover', (e) => this._onMouseOver()));
            this._applyTheme(themeService.getColorTheme());
            this._register(themeService.onDidColorThemeChange(this._applyTheme.bind(this)));
        }
        _keybindingLabelFor(actionId) {
            let kb = this._keybindingService.lookupKeybinding(actionId);
            if (!kb) {
                return '';
            }
            return ` (${kb.getLabel()})`;
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        // ----- IOverlayWidget API
        getId() {
            return FindOptionsWidget.ID;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 0 /* TOP_RIGHT_CORNER */
            };
        }
        highlightFindOptions() {
            this._revealTemporarily();
        }
        _revealTemporarily() {
            this._show();
            this._hideSoon.schedule();
        }
        _onMouseOut() {
            this._hideSoon.schedule();
        }
        _onMouseOver() {
            this._hideSoon.cancel();
        }
        _show() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            this._domNode.style.display = 'block';
        }
        _hide() {
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            this._domNode.style.display = 'none';
        }
        _applyTheme(theme) {
            let inputStyles = {
                inputActiveOptionBorder: theme.getColor(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: theme.getColor(colorRegistry_1.inputActiveOptionForeground),
                inputActiveOptionBackground: theme.getColor(colorRegistry_1.inputActiveOptionBackground)
            };
            this.caseSensitive.style(inputStyles);
            this.wholeWords.style(inputStyles);
            this.regex.style(inputStyles);
        }
    }
    exports.FindOptionsWidget = FindOptionsWidget;
    FindOptionsWidget.ID = 'editor.contrib.findOptionsWidget';
    themeService_1.registerThemingParticipant((theme, collector) => {
        const widgetBackground = theme.getColor(colorRegistry_1.editorWidgetBackground);
        if (widgetBackground) {
            collector.addRule(`.monaco-editor .findOptionsWidget { background-color: ${widgetBackground}; }`);
        }
        const widgetForeground = theme.getColor(colorRegistry_1.editorWidgetForeground);
        if (widgetForeground) {
            collector.addRule(`.monaco-editor .findOptionsWidget { color: ${widgetForeground}; }`);
        }
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-editor .findOptionsWidget { box-shadow: 0 2px 8px ${widgetShadowColor}; }`);
        }
        const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
        if (hcBorder) {
            collector.addRule(`.monaco-editor .findOptionsWidget { border: 2px solid ${hcBorder}; }`);
        }
    });
});
//# __sourceMappingURL=findOptionsWidget.js.map