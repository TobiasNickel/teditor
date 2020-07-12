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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/workbench/common/theme", "vs/base/browser/dom", "vs/base/common/types"], function (require, exports, themeService_1, nls_1, colorRegistry_1, layoutService_1, debug_1, workspace_1, theme_1, dom_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isStatusbarInDebugMode = exports.StatusBarColorProvider = exports.STATUS_BAR_DEBUGGING_BORDER = exports.STATUS_BAR_DEBUGGING_FOREGROUND = exports.STATUS_BAR_DEBUGGING_BACKGROUND = void 0;
    // colors for theming
    exports.STATUS_BAR_DEBUGGING_BACKGROUND = colorRegistry_1.registerColor('statusBar.debuggingBackground', {
        dark: '#CC6633',
        light: '#CC6633',
        hc: '#CC6633'
    }, nls_1.localize('statusBarDebuggingBackground', "Status bar background color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_FOREGROUND = colorRegistry_1.registerColor('statusBar.debuggingForeground', {
        dark: theme_1.STATUS_BAR_FOREGROUND,
        light: theme_1.STATUS_BAR_FOREGROUND,
        hc: theme_1.STATUS_BAR_FOREGROUND
    }, nls_1.localize('statusBarDebuggingForeground', "Status bar foreground color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_BORDER = colorRegistry_1.registerColor('statusBar.debuggingBorder', {
        dark: theme_1.STATUS_BAR_BORDER,
        light: theme_1.STATUS_BAR_BORDER,
        hc: theme_1.STATUS_BAR_BORDER
    }, nls_1.localize('statusBarDebuggingBorder', "Status bar border color separating to the sidebar and editor when a program is being debugged. The status bar is shown in the bottom of the window"));
    let StatusBarColorProvider = class StatusBarColorProvider extends themeService_1.Themable {
        constructor(themeService, debugService, contextService, layoutService) {
            super(themeService);
            this.debugService = debugService;
            this.contextService = contextService;
            this.layoutService = layoutService;
            this.registerListeners();
            this.updateStyles();
        }
        registerListeners() {
            this._register(this.debugService.onDidChangeState(state => this.updateStyles()));
            this._register(this.contextService.onDidChangeWorkbenchState(state => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            const container = types_1.assertIsDefined(this.layoutService.getContainer("workbench.parts.statusbar" /* STATUSBAR_PART */));
            if (isStatusbarInDebugMode(this.debugService.state, this.debugService.getViewModel().focusedSession)) {
                dom_1.addClass(container, 'debugging');
            }
            else {
                dom_1.removeClass(container, 'debugging');
            }
            // Container Colors
            const backgroundColor = this.getColor(this.getColorKey(theme_1.STATUS_BAR_NO_FOLDER_BACKGROUND, exports.STATUS_BAR_DEBUGGING_BACKGROUND, theme_1.STATUS_BAR_BACKGROUND));
            container.style.backgroundColor = backgroundColor || '';
            container.style.color = this.getColor(this.getColorKey(theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND, exports.STATUS_BAR_DEBUGGING_FOREGROUND, theme_1.STATUS_BAR_FOREGROUND)) || '';
            // Border Color
            const borderColor = this.getColor(this.getColorKey(theme_1.STATUS_BAR_NO_FOLDER_BORDER, exports.STATUS_BAR_DEBUGGING_BORDER, theme_1.STATUS_BAR_BORDER)) || this.getColor(colorRegistry_1.contrastBorder);
            if (borderColor) {
                dom_1.addClass(container, 'status-border-top');
                container.style.setProperty('--status-border-top-color', borderColor.toString());
            }
            else {
                dom_1.removeClass(container, 'status-border-top');
                container.style.removeProperty('--status-border-top-color');
            }
            // Notification Beak
            if (!this.styleElement) {
                this.styleElement = dom_1.createStyleSheet(container);
            }
            this.styleElement.innerHTML = `.monaco-workbench .part.statusbar > .items-container > .statusbar-item.has-beak:before { border-bottom-color: ${backgroundColor} !important; }`;
        }
        getColorKey(noFolderColor, debuggingColor, normalColor) {
            // Not debugging
            if (!isStatusbarInDebugMode(this.debugService.state, this.debugService.getViewModel().focusedSession)) {
                if (this.contextService.getWorkbenchState() !== 1 /* EMPTY */) {
                    return normalColor;
                }
                return noFolderColor;
            }
            // Debugging
            return debuggingColor;
        }
    };
    StatusBarColorProvider = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, debug_1.IDebugService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], StatusBarColorProvider);
    exports.StatusBarColorProvider = StatusBarColorProvider;
    function isStatusbarInDebugMode(state, session) {
        var _a;
        if (state === 0 /* Inactive */ || state === 1 /* Initializing */) {
            return false;
        }
        const isRunningWithoutDebug = (_a = session === null || session === void 0 ? void 0 : session.configuration) === null || _a === void 0 ? void 0 : _a.noDebug;
        if (isRunningWithoutDebug) {
            return false;
        }
        return true;
    }
    exports.isStatusbarInDebugMode = isStatusbarInDebugMode;
});
//# __sourceMappingURL=statusbarColorProvider.js.map