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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/browser/ui/checkbox/checkbox", "vs/base/common/event", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/platform/browser/contextScopedHistoryWidget", "vs/platform/contextkey/common/contextkey", "vs/base/common/codicons"], function (require, exports, nls, dom, widget_1, checkbox_1, event_1, themeService_1, styler_1, contextScopedHistoryWidget_1, contextkey_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExcludePatternInputWidget = exports.PatternInputWidget = void 0;
    let PatternInputWidget = class PatternInputWidget extends widget_1.Widget {
        constructor(parent, contextViewProvider, options = Object.create(null), themeService, contextKeyService) {
            super();
            this.contextViewProvider = contextViewProvider;
            this.themeService = themeService;
            this.contextKeyService = contextKeyService;
            this._onSubmit = this._register(new event_1.Emitter());
            this.onSubmit = this._onSubmit.event;
            this._onCancel = this._register(new event_1.Emitter());
            this.onCancel = this._onCancel.event;
            this.width = options.width || 100;
            this.placeholder = options.placeholder || '';
            this.ariaLabel = options.ariaLabel || nls.localize('defaultLabel', "input");
            this.render(options);
            parent.appendChild(this.domNode);
        }
        dispose() {
            super.dispose();
            if (this.inputFocusTracker) {
                this.inputFocusTracker.dispose();
            }
        }
        setWidth(newWidth) {
            this.width = newWidth;
            this.domNode.style.width = this.width + 'px';
            this.contextViewProvider.layout();
            this.setInputWidth();
        }
        getValue() {
            return this.inputBox.value;
        }
        setValue(value) {
            if (this.inputBox.value !== value) {
                this.inputBox.value = value;
            }
        }
        select() {
            this.inputBox.select();
        }
        focus() {
            this.inputBox.focus();
        }
        inputHasFocus() {
            return this.inputBox.hasFocus();
        }
        setInputWidth() {
            this.inputBox.width = this.width - this.getSubcontrolsWidth() - 2; // 2 for input box border
        }
        getSubcontrolsWidth() {
            return 0;
        }
        getHistory() {
            return this.inputBox.getHistory();
        }
        clearHistory() {
            this.inputBox.clearHistory();
        }
        onSearchSubmit() {
            this.inputBox.addToHistory();
        }
        showNextTerm() {
            this.inputBox.showNextValue();
        }
        showPreviousTerm() {
            this.inputBox.showPreviousValue();
        }
        style(styles) {
            this.inputBox.style(styles);
        }
        render(options) {
            this.domNode = document.createElement('div');
            this.domNode.style.width = this.width + 'px';
            dom.addClass(this.domNode, 'monaco-findInput');
            this.inputBox = new contextScopedHistoryWidget_1.ContextScopedHistoryInputBox(this.domNode, this.contextViewProvider, {
                placeholder: this.placeholder || '',
                ariaLabel: this.ariaLabel || '',
                validationOptions: {
                    validation: undefined
                },
                history: options.history || []
            }, this.contextKeyService);
            this._register(styler_1.attachInputBoxStyler(this.inputBox, this.themeService));
            this._register(this.inputBox.onDidChange(() => this._onSubmit.fire(true)));
            this.inputFocusTracker = dom.trackFocus(this.inputBox.inputElement);
            this.onkeyup(this.inputBox.inputElement, (keyboardEvent) => this.onInputKeyUp(keyboardEvent));
            const controls = document.createElement('div');
            controls.className = 'controls';
            this.renderSubcontrols(controls);
            this.domNode.appendChild(controls);
            this.setInputWidth();
        }
        renderSubcontrols(_controlsDiv) {
        }
        onInputKeyUp(keyboardEvent) {
            switch (keyboardEvent.keyCode) {
                case 3 /* Enter */:
                    this.onSearchSubmit();
                    this._onSubmit.fire(false);
                    return;
                case 9 /* Escape */:
                    this._onCancel.fire();
                    return;
            }
        }
    };
    PatternInputWidget.OPTION_CHANGE = 'optionChange';
    PatternInputWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, contextkey_1.IContextKeyService)
    ], PatternInputWidget);
    exports.PatternInputWidget = PatternInputWidget;
    let ExcludePatternInputWidget = class ExcludePatternInputWidget extends PatternInputWidget {
        constructor(parent, contextViewProvider, options = Object.create(null), themeService, contextKeyService) {
            super(parent, contextViewProvider, options, themeService, contextKeyService);
            this._onChangeIgnoreBoxEmitter = this._register(new event_1.Emitter());
            this.onChangeIgnoreBox = this._onChangeIgnoreBoxEmitter.event;
        }
        dispose() {
            super.dispose();
            this.useExcludesAndIgnoreFilesBox.dispose();
        }
        useExcludesAndIgnoreFiles() {
            return this.useExcludesAndIgnoreFilesBox.checked;
        }
        setUseExcludesAndIgnoreFiles(value) {
            this.useExcludesAndIgnoreFilesBox.checked = value;
        }
        getSubcontrolsWidth() {
            return super.getSubcontrolsWidth() + this.useExcludesAndIgnoreFilesBox.width();
        }
        renderSubcontrols(controlsDiv) {
            this.useExcludesAndIgnoreFilesBox = this._register(new checkbox_1.Checkbox({
                icon: codicons_1.Codicon.exclude,
                actionClassName: 'useExcludesAndIgnoreFiles',
                title: nls.localize('useExcludesAndIgnoreFilesDescription', "Use Exclude Settings and Ignore Files"),
                isChecked: true,
            }));
            this._register(this.useExcludesAndIgnoreFilesBox.onChange(viaKeyboard => {
                this._onChangeIgnoreBoxEmitter.fire();
                if (!viaKeyboard) {
                    this.inputBox.focus();
                }
            }));
            this._register(styler_1.attachCheckboxStyler(this.useExcludesAndIgnoreFilesBox, this.themeService));
            controlsDiv.appendChild(this.useExcludesAndIgnoreFilesBox.domNode);
            super.renderSubcontrols(controlsDiv);
        }
    };
    ExcludePatternInputWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, contextkey_1.IContextKeyService)
    ], ExcludePatternInputWidget);
    exports.ExcludePatternInputWidget = ExcludePatternInputWidget;
});
//# __sourceMappingURL=patternInputWidget.js.map