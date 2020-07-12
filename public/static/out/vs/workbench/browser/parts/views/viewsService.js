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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/base/common/types", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/workbench/services/panel/common/panelService", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/panel", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/browser/viewlet", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/uri", "vs/css!./media/views"], function (require, exports, lifecycle_1, views_1, platform_1, storage_1, viewlet_1, contextkey_1, event_1, types_1, actions_1, nls_1, extensions_1, panelService_1, instantiation_1, panel_1, telemetry_1, themeService_1, contextView_1, extensions_2, workspace_1, viewlet_2, configuration_1, layoutService_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewsService = void 0;
    let ViewsService = class ViewsService extends lifecycle_1.Disposable {
        constructor(viewDescriptorService, panelService, viewletService, contextKeyService, layoutService) {
            super();
            this.viewDescriptorService = viewDescriptorService;
            this.panelService = panelService;
            this.viewletService = viewletService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
            this._onDidChangeViewVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewVisibility = this._onDidChangeViewVisibility.event;
            this._onDidChangeViewContainerVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewContainerVisibility = this._onDidChangeViewContainerVisibility.event;
            this.viewDisposable = new Map();
            this.visibleViewContextKeys = new Map();
            this.viewPaneContainers = new Map();
            this._register(lifecycle_1.toDisposable(() => {
                this.viewDisposable.forEach(disposable => disposable.dispose());
                this.viewDisposable.clear();
            }));
            this.viewDescriptorService.viewContainers.forEach(viewContainer => this.onDidRegisterViewContainer(viewContainer, this.viewDescriptorService.getViewContainerLocation(viewContainer)));
            this._register(this.viewDescriptorService.onDidChangeViewContainers(({ added, removed }) => this.onDidChangeContainers(added, removed)));
            this._register(this.viewDescriptorService.onDidChangeContainerLocation(({ viewContainer, from, to }) => this.onDidChangeContainerLocation(viewContainer, from, to)));
            // View Container Visibility
            this._register(this.viewletService.onDidViewletOpen(viewlet => this._onDidChangeViewContainerVisibility.fire({ id: viewlet.getId(), visible: true, location: views_1.ViewContainerLocation.Sidebar })));
            this._register(this.panelService.onDidPanelOpen(e => this._onDidChangeViewContainerVisibility.fire({ id: e.panel.getId(), visible: true, location: views_1.ViewContainerLocation.Panel })));
            this._register(this.viewletService.onDidViewletClose(viewlet => this._onDidChangeViewContainerVisibility.fire({ id: viewlet.getId(), visible: false, location: views_1.ViewContainerLocation.Sidebar })));
            this._register(this.panelService.onDidPanelClose(panel => this._onDidChangeViewContainerVisibility.fire({ id: panel.getId(), visible: false, location: views_1.ViewContainerLocation.Panel })));
        }
        registerViewPaneContainer(viewPaneContainer) {
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(viewPaneContainer);
            disposable.add(viewPaneContainer.onDidAddViews(views => this.onViewsAdded(views)));
            disposable.add(viewPaneContainer.onDidChangeViewVisibility(view => this.onViewsVisibilityChanged(view, view.isBodyVisible())));
            disposable.add(viewPaneContainer.onDidRemoveViews(views => this.onViewsRemoved(views)));
            this.viewPaneContainers.set(viewPaneContainer.getId(), { viewPaneContainer, disposable });
        }
        deregisterViewPaneContainer(id) {
            const viewPaneContainerItem = this.viewPaneContainers.get(id);
            if (viewPaneContainerItem) {
                viewPaneContainerItem.disposable.dispose();
                this.viewPaneContainers.delete(id);
            }
        }
        onViewsAdded(added) {
            for (const view of added) {
                this.onViewsVisibilityChanged(view, view.isBodyVisible());
            }
        }
        onViewsVisibilityChanged(view, visible) {
            this.getOrCreateActiveViewContextKey(view).set(visible);
            this._onDidChangeViewVisibility.fire({ id: view.id, visible: visible });
        }
        onViewsRemoved(removed) {
            for (const view of removed) {
                this.onViewsVisibilityChanged(view, false);
            }
        }
        getOrCreateActiveViewContextKey(view) {
            const visibleContextKeyId = views_1.getVisbileViewContextKey(view.id);
            let contextKey = this.visibleViewContextKeys.get(visibleContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(visibleContextKeyId, false).bindTo(this.contextKeyService);
                this.visibleViewContextKeys.set(visibleContextKeyId, contextKey);
            }
            return contextKey;
        }
        onDidChangeContainers(added, removed) {
            for (const { container, location } of removed) {
                this.deregisterViewletOrPanel(container, location);
            }
            for (const { container, location } of added) {
                this.onDidRegisterViewContainer(container, location);
            }
        }
        onDidRegisterViewContainer(viewContainer, viewContainerLocation) {
            this.registerViewletOrPanel(viewContainer, viewContainerLocation);
            const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
            this.onViewDescriptorsAdded(viewContainerModel.allViewDescriptors, viewContainer);
            this._register(viewContainerModel.onDidChangeAllViewDescriptors(({ added, removed }) => {
                this.onViewDescriptorsAdded(added, viewContainer);
                this.onViewDescriptorsRemoved(removed);
            }));
        }
        onDidChangeContainerLocation(viewContainer, from, to) {
            this.deregisterViewletOrPanel(viewContainer, from);
            this.registerViewletOrPanel(viewContainer, to);
        }
        onViewDescriptorsAdded(views, container) {
            const location = this.viewDescriptorService.getViewContainerLocation(container);
            if (location === null) {
                return;
            }
            const composite = this.getComposite(container.id, location);
            for (const viewDescriptor of views) {
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(actions_1.registerAction2(class FocusViewAction extends actions_1.Action2 {
                    constructor() {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                        super({
                            id: viewDescriptor.focusCommand ? viewDescriptor.focusCommand.id : `${viewDescriptor.id}.focus`,
                            title: { original: `Focus on ${viewDescriptor.name} View`, value: nls_1.localize('focus view', "Focus on {0} View", viewDescriptor.name) },
                            category: composite ? composite.name : nls_1.localize('view category', "View"),
                            menu: [{
                                    id: actions_1.MenuId.CommandPalette,
                                    when: viewDescriptor.when,
                                }],
                            keybinding: {
                                when: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                                weight: 200 /* WorkbenchContrib */,
                                primary: (_b = (_a = viewDescriptor.focusCommand) === null || _a === void 0 ? void 0 : _a.keybindings) === null || _b === void 0 ? void 0 : _b.primary,
                                secondary: (_d = (_c = viewDescriptor.focusCommand) === null || _c === void 0 ? void 0 : _c.keybindings) === null || _d === void 0 ? void 0 : _d.secondary,
                                linux: (_f = (_e = viewDescriptor.focusCommand) === null || _e === void 0 ? void 0 : _e.keybindings) === null || _f === void 0 ? void 0 : _f.linux,
                                mac: (_h = (_g = viewDescriptor.focusCommand) === null || _g === void 0 ? void 0 : _g.keybindings) === null || _h === void 0 ? void 0 : _h.mac,
                                win: (_k = (_j = viewDescriptor.focusCommand) === null || _j === void 0 ? void 0 : _j.keybindings) === null || _k === void 0 ? void 0 : _k.win
                            }
                        });
                    }
                    run(accessor) {
                        accessor.get(views_1.IViewsService).openView(viewDescriptor.id, true);
                    }
                }));
                disposables.add(actions_1.registerAction2(class ResetViewLocationAction extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `${viewDescriptor.id}.resetViewLocation`,
                            title: {
                                original: 'Reset Location',
                                value: nls_1.localize('resetViewLocation', "Reset Location")
                            },
                            menu: [{
                                    id: actions_1.MenuId.ViewTitleContext,
                                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewDescriptor.id), contextkey_1.ContextKeyExpr.equals(`${viewDescriptor.id}.defaultViewLocation`, false)))
                                }],
                        });
                    }
                    run(accessor) {
                        const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
                        const defaultContainer = viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
                        const containerModel = viewDescriptorService.getViewContainerModel(defaultContainer);
                        // The default container is hidden so we should try to reset its location first
                        if (defaultContainer.hideIfEmpty && containerModel.visibleViewDescriptors.length === 0) {
                            const defaultLocation = viewDescriptorService.getDefaultViewContainerLocation(defaultContainer);
                            viewDescriptorService.moveViewContainerToLocation(defaultContainer, defaultLocation);
                        }
                        viewDescriptorService.moveViewsToContainer([viewDescriptor], viewDescriptorService.getDefaultContainerById(viewDescriptor.id));
                        accessor.get(views_1.IViewsService).openView(viewDescriptor.id, true);
                    }
                }));
                this.viewDisposable.set(viewDescriptor, disposables);
            }
        }
        onViewDescriptorsRemoved(views) {
            for (const view of views) {
                const disposable = this.viewDisposable.get(view);
                if (disposable) {
                    disposable.dispose();
                    this.viewDisposable.delete(view);
                }
            }
        }
        async openComposite(compositeId, location, focus) {
            if (location === views_1.ViewContainerLocation.Sidebar) {
                return this.viewletService.openViewlet(compositeId, focus);
            }
            else if (location === views_1.ViewContainerLocation.Panel) {
                return this.panelService.openPanel(compositeId, focus);
            }
            return undefined;
        }
        getComposite(compositeId, location) {
            if (location === views_1.ViewContainerLocation.Sidebar) {
                return this.viewletService.getViewlet(compositeId);
            }
            else if (location === views_1.ViewContainerLocation.Panel) {
                return this.panelService.getPanel(compositeId);
            }
            return undefined;
        }
        isViewContainerVisible(id) {
            var _a, _b;
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                switch (viewContainerLocation) {
                    case views_1.ViewContainerLocation.Panel:
                        return ((_a = this.panelService.getActivePanel()) === null || _a === void 0 ? void 0 : _a.getId()) === id;
                    case views_1.ViewContainerLocation.Sidebar:
                        return ((_b = this.viewletService.getActiveViewlet()) === null || _b === void 0 ? void 0 : _b.getId()) === id;
                }
            }
            return false;
        }
        getVisibleViewContainer(location) {
            var _a, _b;
            let viewContainerId = undefined;
            switch (location) {
                case views_1.ViewContainerLocation.Panel:
                    viewContainerId = (_a = this.panelService.getActivePanel()) === null || _a === void 0 ? void 0 : _a.getId();
                    break;
                case views_1.ViewContainerLocation.Sidebar:
                    viewContainerId = (_b = this.viewletService.getActiveViewlet()) === null || _b === void 0 ? void 0 : _b.getId();
                    break;
            }
            return viewContainerId ? this.viewDescriptorService.getViewContainerById(viewContainerId) : null;
        }
        async openViewContainer(id, focus) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                switch (viewContainerLocation) {
                    case views_1.ViewContainerLocation.Panel:
                        const panel = await this.panelService.openPanel(id, focus);
                        return panel;
                    case views_1.ViewContainerLocation.Sidebar:
                        const viewlet = await this.viewletService.openViewlet(id, focus);
                        return viewlet || null;
                }
            }
            return null;
        }
        async closeViewContainer(id) {
            var _a, _b;
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                switch (viewContainerLocation) {
                    case views_1.ViewContainerLocation.Panel:
                        return ((_a = this.panelService.getActivePanel()) === null || _a === void 0 ? void 0 : _a.getId()) === id ? this.panelService.hideActivePanel() : undefined;
                    case views_1.ViewContainerLocation.Sidebar:
                        return ((_b = this.viewletService.getActiveViewlet()) === null || _b === void 0 ? void 0 : _b.getId()) === id ? this.viewletService.hideActiveViewlet() : undefined;
                }
            }
        }
        isViewVisible(id) {
            const activeView = this.getActiveViewWithId(id);
            return (activeView === null || activeView === void 0 ? void 0 : activeView.isBodyVisible()) || false;
        }
        getActiveViewWithId(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const activeViewPaneContainer = this.getActiveViewPaneContainer(viewContainer);
                if (activeViewPaneContainer) {
                    return activeViewPaneContainer.getView(id);
                }
            }
            return null;
        }
        async openView(id, focus) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (!viewContainer) {
                return null;
            }
            if (!this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === id)) {
                return null;
            }
            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            const compositeDescriptor = this.getComposite(viewContainer.id, location);
            if (compositeDescriptor) {
                const paneComposite = await this.openComposite(compositeDescriptor.id, location);
                if (paneComposite && paneComposite.openView) {
                    return paneComposite.openView(id, focus) || null;
                }
                else if (focus) {
                    paneComposite === null || paneComposite === void 0 ? void 0 : paneComposite.focus();
                }
            }
            return null;
        }
        closeView(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const activeViewPaneContainer = this.getActiveViewPaneContainer(viewContainer);
                if (activeViewPaneContainer) {
                    const view = activeViewPaneContainer.getView(id);
                    if (view) {
                        if (activeViewPaneContainer.views.length === 1) {
                            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                            if (location === views_1.ViewContainerLocation.Sidebar) {
                                this.layoutService.setSideBarHidden(true);
                            }
                            else if (location === views_1.ViewContainerLocation.Panel) {
                                this.panelService.hideActivePanel();
                            }
                        }
                        else {
                            view.setExpanded(false);
                        }
                    }
                }
            }
        }
        getActiveViewPaneContainer(viewContainer) {
            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            if (location === views_1.ViewContainerLocation.Sidebar) {
                const activeViewlet = this.viewletService.getActiveViewlet();
                if ((activeViewlet === null || activeViewlet === void 0 ? void 0 : activeViewlet.getId()) === viewContainer.id) {
                    return activeViewlet.getViewPaneContainer() || null;
                }
            }
            else if (location === views_1.ViewContainerLocation.Panel) {
                const activePanel = this.panelService.getActivePanel();
                if ((activePanel === null || activePanel === void 0 ? void 0 : activePanel.getId()) === viewContainer.id) {
                    return activePanel.getViewPaneContainer() || null;
                }
            }
            return null;
        }
        getViewProgressIndicator(viewId) {
            var _a, _b;
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(viewId);
            if (viewContainer === null) {
                return undefined;
            }
            const view = (_b = (_a = this.viewPaneContainers.get(viewContainer.id)) === null || _a === void 0 ? void 0 : _a.viewPaneContainer) === null || _b === void 0 ? void 0 : _b.getView(viewId);
            return view === null || view === void 0 ? void 0 : view.getProgressIndicator();
        }
        registerViewletOrPanel(viewContainer, viewContainerLocation) {
            switch (viewContainerLocation) {
                case views_1.ViewContainerLocation.Panel:
                    this.registerPanel(viewContainer);
                    break;
                case views_1.ViewContainerLocation.Sidebar:
                    if (viewContainer.ctorDescriptor) {
                        this.registerViewlet(viewContainer);
                    }
                    break;
            }
        }
        deregisterViewletOrPanel(viewContainer, viewContainerLocation) {
            switch (viewContainerLocation) {
                case views_1.ViewContainerLocation.Panel:
                    this.deregisterPanel(viewContainer);
                    break;
                case views_1.ViewContainerLocation.Sidebar:
                    if (viewContainer.ctorDescriptor) {
                        this.deregisterViewlet(viewContainer);
                    }
                    break;
            }
        }
        registerPanel(viewContainer) {
            var _a;
            const that = this;
            let PaneContainerPanel = class PaneContainerPanel extends panel_1.Panel {
                constructor(telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService) {
                    // Use composite's instantiation service to get the editor progress service for any editors instantiated within the composite
                    const viewPaneContainer = instantiationService.createInstance(viewContainer.ctorDescriptor.ctor, ...(viewContainer.ctorDescriptor.staticArguments || []));
                    super(viewContainer.id, viewPaneContainer, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
                    that.registerViewPaneContainer(this.viewPaneContainer);
                }
            };
            PaneContainerPanel = __decorate([
                __param(0, telemetry_1.ITelemetryService),
                __param(1, storage_1.IStorageService),
                __param(2, instantiation_1.IInstantiationService),
                __param(3, themeService_1.IThemeService),
                __param(4, contextView_1.IContextMenuService),
                __param(5, extensions_2.IExtensionService),
                __param(6, workspace_1.IWorkspaceContextService)
            ], PaneContainerPanel);
            platform_1.Registry.as(panel_1.Extensions.Panels).registerPanel(panel_1.PanelDescriptor.create(PaneContainerPanel, viewContainer.id, viewContainer.name, undefined, viewContainer.order, viewContainer.requestedIndex, (_a = viewContainer.focusCommand) === null || _a === void 0 ? void 0 : _a.id));
        }
        deregisterPanel(viewContainer) {
            this.deregisterViewPaneContainer(viewContainer.id);
            platform_1.Registry.as(panel_1.Extensions.Panels).deregisterPanel(viewContainer.id);
        }
        registerViewlet(viewContainer) {
            const that = this;
            let PaneContainerViewlet = class PaneContainerViewlet extends viewlet_2.Viewlet {
                constructor(configurationService, layoutService, telemetryService, contextService, storageService, instantiationService, themeService, contextMenuService, extensionService) {
                    // Use composite's instantiation service to get the editor progress service for any editors instantiated within the composite
                    const viewPaneContainer = instantiationService.createInstance(viewContainer.ctorDescriptor.ctor, ...(viewContainer.ctorDescriptor.staticArguments || []));
                    super(viewContainer.id, viewPaneContainer, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, layoutService, configurationService);
                    that.registerViewPaneContainer(this.viewPaneContainer);
                }
            };
            PaneContainerViewlet = __decorate([
                __param(0, configuration_1.IConfigurationService),
                __param(1, layoutService_1.IWorkbenchLayoutService),
                __param(2, telemetry_1.ITelemetryService),
                __param(3, workspace_1.IWorkspaceContextService),
                __param(4, storage_1.IStorageService),
                __param(5, instantiation_1.IInstantiationService),
                __param(6, themeService_1.IThemeService),
                __param(7, contextView_1.IContextMenuService),
                __param(8, extensions_2.IExtensionService)
            ], PaneContainerViewlet);
            platform_1.Registry.as(viewlet_2.Extensions.Viewlets).registerViewlet(viewlet_2.ViewletDescriptor.create(PaneContainerViewlet, viewContainer.id, viewContainer.name, types_1.isString(viewContainer.icon) ? viewContainer.icon : undefined, viewContainer.order, viewContainer.requestedIndex, viewContainer.icon instanceof uri_1.URI ? viewContainer.icon : undefined));
        }
        deregisterViewlet(viewContainer) {
            this.deregisterViewPaneContainer(viewContainer.id);
            platform_1.Registry.as(viewlet_2.Extensions.Viewlets).deregisterViewlet(viewContainer.id);
        }
    };
    ViewsService = __decorate([
        __param(0, views_1.IViewDescriptorService),
        __param(1, panelService_1.IPanelService),
        __param(2, viewlet_1.IViewletService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], ViewsService);
    exports.ViewsService = ViewsService;
    extensions_1.registerSingleton(views_1.IViewsService, ViewsService);
});
//# __sourceMappingURL=viewsService.js.map