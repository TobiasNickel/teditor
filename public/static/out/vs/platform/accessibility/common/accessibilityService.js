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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, accessibility_1, event_1, contextkey_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityService = void 0;
    let AccessibilityService = class AccessibilityService extends lifecycle_1.Disposable {
        constructor(_contextKeyService, _configurationService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._accessibilitySupport = 0 /* Unknown */;
            this._onDidChangeScreenReaderOptimized = new event_1.Emitter();
            this._accessibilityModeEnabledContext = accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.bindTo(this._contextKeyService);
            const updateContextKey = () => this._accessibilityModeEnabledContext.set(this.isScreenReaderOptimized());
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    updateContextKey();
                    this._onDidChangeScreenReaderOptimized.fire();
                }
            }));
            updateContextKey();
            this.onDidChangeScreenReaderOptimized(() => updateContextKey());
        }
        get onDidChangeScreenReaderOptimized() {
            return this._onDidChangeScreenReaderOptimized.event;
        }
        isScreenReaderOptimized() {
            const config = this._configurationService.getValue('editor.accessibilitySupport');
            return config === 'on' || (config === 'auto' && this._accessibilitySupport === 2 /* Enabled */);
        }
        getAccessibilitySupport() {
            return this._accessibilitySupport;
        }
        alwaysUnderlineAccessKeys() {
            return Promise.resolve(false);
        }
        setAccessibilitySupport(accessibilitySupport) {
            if (this._accessibilitySupport === accessibilitySupport) {
                return;
            }
            this._accessibilitySupport = accessibilitySupport;
            this._onDidChangeScreenReaderOptimized.fire();
        }
    };
    AccessibilityService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService)
    ], AccessibilityService);
    exports.AccessibilityService = AccessibilityService;
});
//# __sourceMappingURL=accessibilityService.js.map