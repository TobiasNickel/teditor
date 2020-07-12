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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/browser/style"], function (require, exports, decorators_1, lifecycle_1, editorOptions_1, configuration_1, colorRegistry, themeService_1, event_1, style_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewThemeDataProvider = void 0;
    let WebviewThemeDataProvider = class WebviewThemeDataProvider extends lifecycle_1.Disposable {
        constructor(_themeService, _configurationService) {
            super();
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._onThemeDataChanged = this._register(new event_1.Emitter());
            this.onThemeDataChanged = this._onThemeDataChanged.event;
            this._register(this._themeService.onDidColorThemeChange(() => {
                this.reset();
            }));
            const webviewConfigurationKeys = ['editor.fontFamily', 'editor.fontWeight', 'editor.fontSize'];
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (webviewConfigurationKeys.some(key => e.affectsConfiguration(key))) {
                    this.reset();
                }
            }));
        }
        getTheme() {
            return this._themeService.getColorTheme();
        }
        getWebviewThemeData() {
            const configuration = this._configurationService.getValue('editor');
            const editorFontFamily = configuration.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const editorFontWeight = configuration.fontWeight || editorOptions_1.EDITOR_FONT_DEFAULTS.fontWeight;
            const editorFontSize = configuration.fontSize || editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize;
            const theme = this._themeService.getColorTheme();
            const exportedColors = colorRegistry.getColorRegistry().getColors().reduce((colors, entry) => {
                const color = theme.getColor(entry.id);
                if (color) {
                    colors['vscode-' + entry.id.replace('.', '-')] = color.toString();
                }
                return colors;
            }, {});
            const styles = Object.assign({ 'vscode-font-family': style_1.DEFAULT_FONT_FAMILY, 'vscode-font-weight': 'normal', 'vscode-font-size': '13px', 'vscode-editor-font-family': editorFontFamily, 'vscode-editor-font-weight': editorFontWeight, 'vscode-editor-font-size': editorFontSize + 'px' }, exportedColors);
            const activeTheme = ApiThemeClassName.fromTheme(theme);
            return { styles, activeTheme, themeLabel: theme.label, };
        }
        reset() {
            WebviewThemeDataProvider.MEMOIZER.clear();
            this._onThemeDataChanged.fire();
        }
    };
    WebviewThemeDataProvider.MEMOIZER = decorators_1.createMemoizer();
    __decorate([
        WebviewThemeDataProvider.MEMOIZER
    ], WebviewThemeDataProvider.prototype, "getWebviewThemeData", null);
    WebviewThemeDataProvider = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, configuration_1.IConfigurationService)
    ], WebviewThemeDataProvider);
    exports.WebviewThemeDataProvider = WebviewThemeDataProvider;
    var ApiThemeClassName;
    (function (ApiThemeClassName) {
        ApiThemeClassName["light"] = "vscode-light";
        ApiThemeClassName["dark"] = "vscode-dark";
        ApiThemeClassName["highContrast"] = "vscode-high-contrast";
    })(ApiThemeClassName || (ApiThemeClassName = {}));
    (function (ApiThemeClassName) {
        function fromTheme(theme) {
            switch (theme.type) {
                case themeService_1.LIGHT: return ApiThemeClassName.light;
                case themeService_1.DARK: return ApiThemeClassName.dark;
                default: return ApiThemeClassName.highContrast;
            }
        }
        ApiThemeClassName.fromTheme = fromTheme;
    })(ApiThemeClassName || (ApiThemeClassName = {}));
});
//# __sourceMappingURL=themeing.js.map