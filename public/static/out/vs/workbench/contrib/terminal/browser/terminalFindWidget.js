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
define(["require", "exports", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, simpleFindWidget_1, contextView_1, terminal_1, contextkey_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalFindWidget = void 0;
    let TerminalFindWidget = class TerminalFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        constructor(findState, _contextViewService, _contextKeyService, _terminalService) {
            super(_contextViewService, _contextKeyService, findState, true);
            this._contextKeyService = _contextKeyService;
            this._terminalService = _terminalService;
            this._register(findState.onFindReplaceStateChange(() => {
                this.show();
            }));
            this._findInputFocused = terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_INPUT_FOCUSED.bindTo(this._contextKeyService);
            this._findWidgetFocused = terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_FOCUSED.bindTo(this._contextKeyService);
        }
        find(previous) {
            const instance = this._terminalService.getActiveInstance();
            if (instance !== null) {
                if (previous) {
                    instance.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
                }
                else {
                    instance.findNext(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
                }
            }
        }
        hide() {
            super.hide();
            const instance = this._terminalService.getActiveInstance();
            if (instance) {
                instance.focus();
            }
        }
        onInputChanged() {
            // Ignore input changes for now
            const instance = this._terminalService.getActiveInstance();
            if (instance !== null) {
                return instance.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: true });
            }
            return false;
        }
        onFocusTrackerFocus() {
            const instance = this._terminalService.getActiveInstance();
            if (instance) {
                instance.notifyFindWidgetFocusChanged(true);
            }
            this._findWidgetFocused.set(true);
        }
        onFocusTrackerBlur() {
            const instance = this._terminalService.getActiveInstance();
            if (instance) {
                instance.notifyFindWidgetFocusChanged(false);
            }
            this._findWidgetFocused.reset();
        }
        onFindInputFocusTrackerFocus() {
            this._findInputFocused.set(true);
        }
        onFindInputFocusTrackerBlur() {
            this._findInputFocused.reset();
        }
        findFirst() {
            const instance = this._terminalService.getActiveInstance();
            if (instance) {
                if (instance.hasSelection()) {
                    instance.clearSelection();
                }
                instance.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
    };
    TerminalFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, terminal_2.ITerminalService)
    ], TerminalFindWidget);
    exports.TerminalFindWidget = TerminalFindWidget;
});
//# __sourceMappingURL=terminalFindWidget.js.map