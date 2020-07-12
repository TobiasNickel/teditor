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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/progress/common/progress", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/decorators", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/platform/keybinding/common/keybinding", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/notification/common/notification", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/welcomeView", "vs/workbench/browser/actions/layoutActions", "vs/css!./media/debugViewlet"], function (require, exports, nls, DOM, debug_1, debugActions_1, debugActionViewItems_1, instantiation_1, extensions_1, progress_1, workspace_1, telemetry_1, storage_1, themeService_1, contextView_1, lifecycle_1, layoutService_1, decorators_1, configuration_1, debugToolBar_1, keybinding_1, viewPaneContainer_1, actions_1, contextkey_1, menuEntryActionViewItem_1, notification_1, views_1, welcomeView_1, layoutActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenDebugConsoleAction = exports.DebugViewPaneContainer = void 0;
    let DebugViewPaneContainer = class DebugViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, progressService, debugService, instantiationService, contextService, storageService, themeService, contextMenuService, extensionService, configurationService, keybindingService, contextViewService, menuService, contextKeyService, notificationService, viewDescriptorService) {
            super(debug_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.progressService = progressService;
            this.debugService = debugService;
            this.keybindingService = keybindingService;
            this.contextViewService = contextViewService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.paneListeners = new Map();
            this._register(this.debugService.onDidChangeState(state => this.onDebugServiceStateChange(state)));
            this._register(this.debugService.onDidNewSession(() => this.updateToolBar()));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(new Set([debug_1.CONTEXT_DEBUG_UX_KEY]))) {
                    this.updateTitleArea();
                }
            }));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateTitleArea()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.toolBarLocation')) {
                    this.updateTitleArea();
                }
            }));
        }
        create(parent) {
            super.create(parent);
            DOM.addClass(parent, 'debug-viewlet');
        }
        focus() {
            super.focus();
            if (this.startDebugActionViewItem) {
                this.startDebugActionViewItem.focus();
            }
            else {
                this.focusView(welcomeView_1.WelcomeView.ID);
            }
        }
        get startAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.StartAction, debugActions_1.StartAction.ID, debugActions_1.StartAction.LABEL));
        }
        get configureAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.ConfigureAction, debugActions_1.ConfigureAction.ID, debugActions_1.ConfigureAction.LABEL));
        }
        get toggleReplAction() {
            return this._register(this.instantiationService.createInstance(OpenDebugConsoleAction, OpenDebugConsoleAction.ID, OpenDebugConsoleAction.LABEL));
        }
        get selectAndStartAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.SelectAndStartAction, debugActions_1.SelectAndStartAction.ID, nls.localize('startAdditionalSession', "Start Additional Session")));
        }
        getActions() {
            if (debug_1.CONTEXT_DEBUG_UX.getValue(this.contextKeyService) === 'simple') {
                return [];
            }
            if (!this.showInitialDebugActions) {
                if (!this.debugToolBarMenu) {
                    this.debugToolBarMenu = this.menuService.createMenu(actions_1.MenuId.DebugToolBar, this.contextKeyService);
                    this._register(this.debugToolBarMenu);
                }
                const { actions, disposable } = debugToolBar_1.DebugToolBar.getActions(this.debugToolBarMenu, this.debugService, this.instantiationService);
                if (this.disposeOnTitleUpdate) {
                    lifecycle_1.dispose(this.disposeOnTitleUpdate);
                }
                this.disposeOnTitleUpdate = disposable;
                return actions;
            }
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                return [this.toggleReplAction];
            }
            return [this.startAction, this.configureAction, this.toggleReplAction];
        }
        get showInitialDebugActions() {
            const state = this.debugService.state;
            return state === 0 /* Inactive */ || this.configurationService.getValue('debug').toolBarLocation !== 'docked';
        }
        getSecondaryActions() {
            if (this.showInitialDebugActions) {
                return [];
            }
            return [this.selectAndStartAction, this.configureAction, this.toggleReplAction];
        }
        getActionViewItem(action) {
            if (action.id === debugActions_1.StartAction.ID) {
                this.startDebugActionViewItem = this.instantiationService.createInstance(debugActionViewItems_1.StartDebugActionViewItem, null, action);
                return this.startDebugActionViewItem;
            }
            if (action.id === debugActions_1.FocusSessionAction.ID) {
                return new debugActionViewItems_1.FocusSessionActionViewItem(action, this.debugService, this.themeService, this.contextViewService, this.configurationService);
            }
            if (action instanceof actions_1.MenuItemAction) {
                return new menuEntryActionViewItem_1.MenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
            }
            return undefined;
        }
        focusView(id) {
            const view = this.getView(id);
            if (view) {
                view.focus();
            }
        }
        onDebugServiceStateChange(state) {
            if (this.progressResolve) {
                this.progressResolve();
                this.progressResolve = undefined;
            }
            if (state === 1 /* Initializing */) {
                this.progressService.withProgress({ location: debug_1.VIEWLET_ID, }, _progress => {
                    return new Promise(resolve => this.progressResolve = resolve);
                });
            }
            this.updateToolBar();
        }
        updateToolBar() {
            if (this.configurationService.getValue('debug').toolBarLocation === 'docked') {
                this.updateTitleArea();
            }
        }
        addPanes(panes) {
            super.addPanes(panes);
            for (const { pane: pane } of panes) {
                // attach event listener to
                if (pane.id === debug_1.BREAKPOINTS_VIEW_ID) {
                    this.breakpointView = pane;
                    this.updateBreakpointsMaxSize();
                }
                else {
                    this.paneListeners.set(pane.id, pane.onDidChange(() => this.updateBreakpointsMaxSize()));
                }
            }
        }
        removePanes(panes) {
            super.removePanes(panes);
            for (const pane of panes) {
                lifecycle_1.dispose(this.paneListeners.get(pane.id));
                this.paneListeners.delete(pane.id);
            }
        }
        updateBreakpointsMaxSize() {
            if (this.breakpointView) {
                // We need to update the breakpoints view since all other views are collapsed #25384
                const allOtherCollapsed = this.panes.every(view => !view.isExpanded() || view === this.breakpointView);
                this.breakpointView.maximumBodySize = allOtherCollapsed ? Number.POSITIVE_INFINITY : this.breakpointView.minimumBodySize;
            }
        }
    };
    __decorate([
        decorators_1.memoize
    ], DebugViewPaneContainer.prototype, "startAction", null);
    __decorate([
        decorators_1.memoize
    ], DebugViewPaneContainer.prototype, "configureAction", null);
    __decorate([
        decorators_1.memoize
    ], DebugViewPaneContainer.prototype, "toggleReplAction", null);
    __decorate([
        decorators_1.memoize
    ], DebugViewPaneContainer.prototype, "selectAndStartAction", null);
    DebugViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, debug_1.IDebugService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, storage_1.IStorageService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, contextView_1.IContextViewService),
        __param(13, actions_1.IMenuService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, notification_1.INotificationService),
        __param(16, views_1.IViewDescriptorService)
    ], DebugViewPaneContainer);
    exports.DebugViewPaneContainer = DebugViewPaneContainer;
    let OpenDebugConsoleAction = class OpenDebugConsoleAction extends layoutActions_1.ToggleViewAction {
        constructor(id, label, viewsService, viewDescriptorService, contextKeyService, layoutService) {
            super(id, label, debug_1.REPL_VIEW_ID, viewsService, viewDescriptorService, contextKeyService, layoutService, 'codicon-debug-console');
        }
    };
    OpenDebugConsoleAction.ID = 'workbench.debug.action.toggleRepl';
    OpenDebugConsoleAction.LABEL = nls.localize('toggleDebugPanel', "Debug Console");
    OpenDebugConsoleAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, layoutService_1.IWorkbenchLayoutService)
    ], OpenDebugConsoleAction);
    exports.OpenDebugConsoleAction = OpenDebugConsoleAction;
});
//# __sourceMappingURL=debugViewlet.js.map