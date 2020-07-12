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
define(["require", "exports", "vs/platform/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/accessibility/common/accessibility", "vs/platform/quickinput/browser/quickInput", "vs/platform/instantiation/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/quickaccess"], function (require, exports, layoutService_1, instantiation_1, themeService_1, configuration_1, contextkey_1, keybinding_1, accessibility_1, quickInput_1, extensions_1, quickInput_2, quickaccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputService = void 0;
    let QuickInputService = class QuickInputService extends quickInput_1.QuickInputService {
        constructor(configurationService, instantiationService, keybindingService, contextKeyService, themeService, accessibilityService, layoutService) {
            super(instantiationService, contextKeyService, themeService, accessibilityService, layoutService);
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.layoutService = layoutService;
            this.inQuickInputContext = quickaccess_1.InQuickPickContextKey.bindTo(this.contextKeyService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onShow(() => this.inQuickInputContext.set(true)));
            this._register(this.onHide(() => this.inQuickInputContext.set(false)));
        }
        createController() {
            return super.createController(this.layoutService, {
                ignoreFocusOut: () => !this.configurationService.getValue('workbench.quickOpen.closeOnFocusLost'),
                backKeybindingLabel: () => { var _a; return ((_a = this.keybindingService.lookupKeybinding('workbench.action.quickInputBack')) === null || _a === void 0 ? void 0 : _a.getLabel()) || undefined; },
            });
        }
    };
    QuickInputService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, themeService_1.IThemeService),
        __param(5, accessibility_1.IAccessibilityService),
        __param(6, layoutService_1.ILayoutService)
    ], QuickInputService);
    exports.QuickInputService = QuickInputService;
    extensions_1.registerSingleton(quickInput_2.IQuickInputService, QuickInputService, true);
});
//# __sourceMappingURL=quickInputService.js.map