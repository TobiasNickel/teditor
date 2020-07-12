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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/workbench/browser/parts/compositePart", "vs/workbench/browser/viewlet", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/viewlet", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/workbench/browser/dnd", "vs/workbench/common/views", "vs/css!./media/sidebarpart"], function (require, exports, nls, platform_1, actions_1, compositePart_1, viewlet_1, actions_2, actions_3, viewlet_2, layoutService_1, viewlet_3, storage_1, contextView_1, telemetry_1, keybinding_1, instantiation_1, event_1, themeService_1, colorRegistry_1, theme_1, notification_1, dom_1, mouseEvent_1, contextkey_1, extensions_1, extensions_2, types_1, dnd_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarPart = void 0;
    let SidebarPart = class SidebarPart extends compositePart_1.CompositePart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService) {
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, platform_1.Registry.as(viewlet_1.Extensions.Viewlets), SidebarPart.activeViewletSettingsKey, viewDescriptorService.getDefaultViewContainer(views_1.ViewContainerLocation.Sidebar).id, 'sideBar', 'viewlet', theme_1.SIDE_BAR_TITLE_FOREGROUND, "workbench.parts.sidebar" /* SIDEBAR_PART */, { hasTitle: true, borderWidth: () => (this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder)) ? 1 : 0 });
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            //#region IView
            this.minimumWidth = 170;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.priority = 1 /* Low */;
            this.snap = true;
            this._onDidViewletDeregister = this._register(new event_1.Emitter());
            this.onDidViewletDeregister = this._onDidViewletDeregister.event;
            this.viewletRegistry = platform_1.Registry.as(viewlet_1.Extensions.Viewlets);
            this.sideBarFocusContextKey = viewlet_3.SidebarFocusContext.bindTo(this.contextKeyService);
            this.activeViewletContextKey = viewlet_3.ActiveViewletContext.bindTo(this.contextKeyService);
            this.blockOpeningViewlet = false;
            this.registerListeners();
        }
        get preferredWidth() {
            const viewlet = this.getActiveViewlet();
            if (!viewlet) {
                return;
            }
            const width = viewlet.getOptimalWidth();
            if (typeof width !== 'number') {
                return;
            }
            return Math.max(width, 300);
        }
        //#endregion
        get onDidViewletRegister() { return this.viewletRegistry.onDidRegister; }
        get onDidViewletOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeEvent => compositeEvent.composite); }
        get onDidViewletClose() { return this.onDidCompositeClose.event; }
        registerListeners() {
            // Viewlet open
            this._register(this.onDidViewletOpen(viewlet => {
                this.activeViewletContextKey.set(viewlet.getId());
            }));
            // Viewlet close
            this._register(this.onDidViewletClose(viewlet => {
                if (this.activeViewletContextKey.get() === viewlet.getId()) {
                    this.activeViewletContextKey.reset();
                }
            }));
            // Viewlet deregister
            this._register(this.registry.onDidDeregister(async (viewletDescriptor) => {
                var _a, _b;
                const activeContainers = this.viewDescriptorService.getViewContainersByLocation(views_1.ViewContainerLocation.Sidebar)
                    .filter(container => this.viewDescriptorService.getViewContainerModel(container).activeViewDescriptors.length > 0);
                if (activeContainers.length) {
                    if (((_a = this.getActiveComposite()) === null || _a === void 0 ? void 0 : _a.getId()) === viewletDescriptor.id) {
                        const defaultViewletId = (_b = this.viewDescriptorService.getDefaultViewContainer(views_1.ViewContainerLocation.Sidebar)) === null || _b === void 0 ? void 0 : _b.id;
                        const containerToOpen = activeContainers.filter(c => c.id === defaultViewletId)[0] || activeContainers[0];
                        await this.openViewlet(containerToOpen.id);
                    }
                }
                else {
                    this.layoutService.setSideBarHidden(true);
                }
                this.removeComposite(viewletDescriptor.id);
                this._onDidViewletDeregister.fire(viewletDescriptor);
            }));
        }
        create(parent) {
            this.element = parent;
            super.create(parent);
            const focusTracker = this._register(dom_1.trackFocus(parent));
            this._register(focusTracker.onDidFocus(() => this.sideBarFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.sideBarFocusContextKey.set(false)));
        }
        createTitleArea(parent) {
            const titleArea = super.createTitleArea(parent);
            this._register(dom_1.addDisposableListener(titleArea, dom_1.EventType.CONTEXT_MENU, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent(e));
            }));
            this.titleLabelElement.draggable = true;
            const draggedItemProvider = () => {
                const activeViewlet = this.getActiveViewlet();
                return { type: 'composite', id: activeViewlet.getId() };
            };
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.titleLabelElement, draggedItemProvider, {}));
            return titleArea;
        }
        updateStyles() {
            var _a;
            super.updateStyles();
            // Part container
            const container = types_1.assertIsDefined(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.SIDE_BAR_BACKGROUND) || '';
            container.style.color = this.getColor(theme_1.SIDE_BAR_FOREGROUND) || '';
            const borderColor = this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 0 /* LEFT */;
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : '';
            container.style.borderRightColor = isPositionLeft ? borderColor || '' : '';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : '';
            container.style.borderLeftColor = !isPositionLeft ? borderColor || '' : '';
            container.style.outlineColor = (_a = this.getColor(theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND)) !== null && _a !== void 0 ? _a : '';
        }
        layout(width, height) {
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                return;
            }
            super.layout(width, height);
        }
        // Viewlet service
        getActiveViewlet() {
            return this.getActiveComposite();
        }
        getLastActiveViewletId() {
            return this.getLastActiveCompositetId();
        }
        hideActiveViewlet() {
            this.hideActiveComposite();
        }
        async openViewlet(id, focus) {
            if (typeof id === 'string' && this.getViewlet(id)) {
                return this.doOpenViewlet(id, focus);
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (typeof id === 'string' && this.getViewlet(id)) {
                return this.doOpenViewlet(id, focus);
            }
            return undefined;
        }
        getViewlets() {
            return this.viewletRegistry.getViewlets().sort((v1, v2) => {
                if (typeof v1.order !== 'number') {
                    return -1;
                }
                if (typeof v2.order !== 'number') {
                    return 1;
                }
                return v1.order - v2.order;
            });
        }
        getViewlet(id) {
            return this.getViewlets().filter(viewlet => viewlet.id === id)[0];
        }
        doOpenViewlet(id, focus) {
            if (this.blockOpeningViewlet) {
                return undefined; // Workaround against a potential race condition
            }
            // First check if sidebar is hidden and show if so
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                try {
                    this.blockOpeningViewlet = true;
                    this.layoutService.setSideBarHidden(false);
                }
                finally {
                    this.blockOpeningViewlet = false;
                }
            }
            return this.openComposite(id, focus);
        }
        getTitleAreaDropDownAnchorAlignment() {
            return this.layoutService.getSideBarPosition() === 0 /* LEFT */ ? 0 /* LEFT */ : 1 /* RIGHT */;
        }
        onTitleAreaContextMenu(event) {
            const activeViewlet = this.getActiveViewlet();
            if (activeViewlet) {
                const contextMenuActions = activeViewlet ? activeViewlet.getContextMenuActions() : [];
                if (contextMenuActions.length) {
                    const anchor = { x: event.posx, y: event.posy };
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => contextMenuActions,
                        getActionViewItem: action => this.actionViewItemProvider(action),
                        actionRunner: activeViewlet.getActionRunner()
                    });
                }
            }
        }
        toJSON() {
            return {
                type: "workbench.parts.sidebar" /* SIDEBAR_PART */
            };
        }
    };
    SidebarPart.activeViewletSettingsKey = 'workbench.sidebar.activeviewletid';
    SidebarPart = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, extensions_1.IExtensionService)
    ], SidebarPart);
    exports.SidebarPart = SidebarPart;
    let FocusSideBarAction = class FocusSideBarAction extends actions_1.Action {
        constructor(id, label, viewletService, layoutService) {
            super(id, label);
            this.viewletService = viewletService;
            this.layoutService = layoutService;
        }
        async run() {
            // Show side bar
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                this.layoutService.setSideBarHidden(false);
                return;
            }
            // Focus into active viewlet
            const viewlet = this.viewletService.getActiveViewlet();
            if (viewlet) {
                viewlet.focus();
            }
        }
    };
    FocusSideBarAction.ID = 'workbench.action.focusSideBar';
    FocusSideBarAction.LABEL = nls.localize('focusSideBar', "Focus into Side Bar");
    FocusSideBarAction = __decorate([
        __param(2, viewlet_2.IViewletService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], FocusSideBarAction);
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(FocusSideBarAction, {
        primary: 2048 /* CtrlCmd */ | 21 /* KEY_0 */
    }), 'View: Focus into Side Bar', nls.localize('viewCategory', "View"));
    extensions_2.registerSingleton(viewlet_2.IViewletService, SidebarPart);
});
//# __sourceMappingURL=sidebarPart.js.map