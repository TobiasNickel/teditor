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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/findinput/findInput", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/browser/ui/findinput/replaceInput"], function (require, exports, contextkey_1, inputBox_1, findInput_1, keybindingsRegistry_1, replaceInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedReplaceInput = exports.ContextScopedFindInput = exports.ContextScopedHistoryInputBox = exports.createAndBindHistoryNavigationWidgetScopedContextKeyService = exports.HistoryNavigationEnablementContext = exports.HistoryNavigationWidgetContext = void 0;
    exports.HistoryNavigationWidgetContext = 'historyNavigationWidget';
    exports.HistoryNavigationEnablementContext = 'historyNavigationEnabled';
    function bindContextScopedWidget(contextKeyService, widget, contextKey) {
        new contextkey_1.RawContextKey(contextKey, widget).bindTo(contextKeyService);
    }
    function createWidgetScopedContextKeyService(contextKeyService, widget) {
        return contextKeyService.createScoped(widget.target);
    }
    function getContextScopedWidget(contextKeyService, contextKey) {
        return contextKeyService.getContext(document.activeElement).getValue(contextKey);
    }
    function createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, widget) {
        const scopedContextKeyService = createWidgetScopedContextKeyService(contextKeyService, widget);
        bindContextScopedWidget(scopedContextKeyService, widget, exports.HistoryNavigationWidgetContext);
        const historyNavigationEnablement = new contextkey_1.RawContextKey(exports.HistoryNavigationEnablementContext, true).bindTo(scopedContextKeyService);
        return { scopedContextKeyService, historyNavigationEnablement };
    }
    exports.createAndBindHistoryNavigationWidgetScopedContextKeyService = createAndBindHistoryNavigationWidgetScopedContextKeyService;
    let ContextScopedHistoryInputBox = class ContextScopedHistoryInputBox extends inputBox_1.HistoryInputBox {
        constructor(container, contextViewProvider, options, contextKeyService) {
            super(container, contextViewProvider, options);
            this._register(createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, { target: this.element, historyNavigator: this }).scopedContextKeyService);
        }
    };
    ContextScopedHistoryInputBox = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedHistoryInputBox);
    exports.ContextScopedHistoryInputBox = ContextScopedHistoryInputBox;
    let ContextScopedFindInput = class ContextScopedFindInput extends findInput_1.FindInput {
        constructor(container, contextViewProvider, options, contextKeyService, showFindOptions = false) {
            super(container, contextViewProvider, showFindOptions, options);
            this._register(createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, { target: this.inputBox.element, historyNavigator: this.inputBox }).scopedContextKeyService);
        }
    };
    ContextScopedFindInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedFindInput);
    exports.ContextScopedFindInput = ContextScopedFindInput;
    let ContextScopedReplaceInput = class ContextScopedReplaceInput extends replaceInput_1.ReplaceInput {
        constructor(container, contextViewProvider, options, contextKeyService, showReplaceOptions = false) {
            super(container, contextViewProvider, showReplaceOptions, options);
            this._register(createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, { target: this.inputBox.element, historyNavigator: this.inputBox }).scopedContextKeyService);
        }
    };
    ContextScopedReplaceInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedReplaceInput);
    exports.ContextScopedReplaceInput = ContextScopedReplaceInput;
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showPrevious',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(exports.HistoryNavigationWidgetContext), contextkey_1.ContextKeyExpr.equals(exports.HistoryNavigationEnablementContext, true)),
        primary: 16 /* UpArrow */,
        secondary: [512 /* Alt */ | 16 /* UpArrow */],
        handler: (accessor, arg2) => {
            const widget = getContextScopedWidget(accessor.get(contextkey_1.IContextKeyService), exports.HistoryNavigationWidgetContext);
            if (widget) {
                const historyInputBox = widget.historyNavigator;
                historyInputBox.showPreviousValue();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showNext',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(exports.HistoryNavigationWidgetContext), contextkey_1.ContextKeyExpr.equals(exports.HistoryNavigationEnablementContext, true)),
        primary: 18 /* DownArrow */,
        secondary: [512 /* Alt */ | 18 /* DownArrow */],
        handler: (accessor, arg2) => {
            const widget = getContextScopedWidget(accessor.get(contextkey_1.IContextKeyService), exports.HistoryNavigationWidgetContext);
            if (widget) {
                const historyInputBox = widget.historyNavigator;
                historyInputBox.showNextValue();
            }
        }
    });
});
//# __sourceMappingURL=contextScopedHistoryWidget.js.map