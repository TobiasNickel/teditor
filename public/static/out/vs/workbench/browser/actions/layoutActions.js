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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/platform/windows/common/windows", "vs/base/common/platform", "vs/platform/contextkey/common/contextkeys", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/editor", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/viewlet", "vs/platform/environment/common/environment", "vs/workbench/common/views", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/workbench/services/activityBar/browser/activityBarService", "vs/workbench/services/panel/common/panelService", "vs/base/common/codicons"], function (require, exports, nls, platform_1, actions_1, actions_2, actions_3, configuration_1, layoutService_1, editorGroupsService_1, instantiation_1, keyCodes_1, lifecycle_1, windows_1, platform_2, contextkeys_1, keybindingsRegistry_1, editor_1, contextkey_1, viewlet_1, environment_1, views_1, quickInput_1, notification_1, activityBarService_1, panelService_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecreaseViewSizeAction = exports.IncreaseViewSizeAction = exports.BaseResizeViewAction = exports.ResetFocusedViewLocationAction = exports.MoveFocusedViewAction = exports.MoveViewAction = exports.ToggleViewAction = exports.ResetViewLocationsAction = exports.ToggleMenuBarAction = exports.ToggleStatusbarVisibilityAction = exports.ToggleSidebarVisibilityAction = exports.ToggleEditorVisibilityAction = exports.ToggleSidebarPositionAction = exports.ToggleEditorLayoutAction = exports.ToggleActivityBarVisibilityAction = exports.CloseSidebarAction = void 0;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    const viewCategory = nls.localize('view', "View");
    // --- Close Side Bar
    let CloseSidebarAction = class CloseSidebarAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        async run() {
            this.layoutService.setSideBarHidden(true);
        }
    };
    CloseSidebarAction.ID = 'workbench.action.closeSidebar';
    CloseSidebarAction.LABEL = nls.localize('closeSidebar', "Close Side Bar");
    CloseSidebarAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], CloseSidebarAction);
    exports.CloseSidebarAction = CloseSidebarAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(CloseSidebarAction), 'View: Close Side Bar', viewCategory);
    // --- Toggle Activity Bar
    let ToggleActivityBarVisibilityAction = class ToggleActivityBarVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService, configurationService) {
            super(id, label);
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.enabled = !!this.layoutService;
        }
        run() {
            const visibility = this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const newVisibilityValue = !visibility;
            return this.configurationService.updateValue(ToggleActivityBarVisibilityAction.activityBarVisibleKey, newVisibilityValue, 1 /* USER */);
        }
    };
    ToggleActivityBarVisibilityAction.ID = 'workbench.action.toggleActivityBarVisibility';
    ToggleActivityBarVisibilityAction.LABEL = nls.localize('toggleActivityBar', "Toggle Activity Bar Visibility");
    ToggleActivityBarVisibilityAction.activityBarVisibleKey = 'workbench.activityBar.visible';
    ToggleActivityBarVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleActivityBarVisibilityAction);
    exports.ToggleActivityBarVisibilityAction = ToggleActivityBarVisibilityAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleActivityBarVisibilityAction), 'View: Toggle Activity Bar Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '2_workbench_layout',
        command: {
            id: ToggleActivityBarVisibilityAction.ID,
            title: nls.localize({ key: 'miShowActivityBar', comment: ['&& denotes a mnemonic'] }, "Show &&Activity Bar"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.activityBar.visible', true)
        },
        order: 4
    });
    // --- Toggle Centered Layout
    let ToggleCenteredLayout = class ToggleCenteredLayout extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        async run() {
            this.layoutService.centerEditorLayout(!this.layoutService.isEditorLayoutCentered());
        }
    };
    ToggleCenteredLayout.ID = 'workbench.action.toggleCenteredLayout';
    ToggleCenteredLayout.LABEL = nls.localize('toggleCenteredLayout', "Toggle Centered Layout");
    ToggleCenteredLayout = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleCenteredLayout);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleCenteredLayout), 'View: Toggle Centered Layout', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '1_toggle_view',
        command: {
            id: ToggleCenteredLayout.ID,
            title: nls.localize('miToggleCenteredLayout', "Centered Layout"),
            toggled: editor_1.IsCenteredLayoutContext
        },
        order: 3
    });
    // --- Toggle Editor Layout
    let ToggleEditorLayoutAction = class ToggleEditorLayoutAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            this.class = codicons_1.Codicon.editorLayout.classNames;
            this.updateEnablement();
            this.registerListeners();
        }
        registerListeners() {
            this.toDispose.add(this.editorGroupService.onDidAddGroup(() => this.updateEnablement()));
            this.toDispose.add(this.editorGroupService.onDidRemoveGroup(() => this.updateEnablement()));
        }
        updateEnablement() {
            this.enabled = this.editorGroupService.count > 1;
        }
        async run() {
            const newOrientation = (this.editorGroupService.orientation === 1 /* VERTICAL */) ? 0 /* HORIZONTAL */ : 1 /* VERTICAL */;
            this.editorGroupService.setGroupOrientation(newOrientation);
        }
    };
    ToggleEditorLayoutAction.ID = 'workbench.action.toggleEditorGroupLayout';
    ToggleEditorLayoutAction.LABEL = nls.localize('flipLayout', "Toggle Vertical/Horizontal Editor Layout");
    ToggleEditorLayoutAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], ToggleEditorLayoutAction);
    exports.ToggleEditorLayoutAction = ToggleEditorLayoutAction;
    const group = viewCategory;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleEditorLayoutAction, { primary: 1024 /* Shift */ | 512 /* Alt */ | 21 /* KEY_0 */, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 21 /* KEY_0 */ } }), 'View: Toggle Vertical/Horizontal Editor Layout', group);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: 'z_flip',
        command: {
            id: ToggleEditorLayoutAction.ID,
            title: nls.localize({ key: 'miToggleEditorLayout', comment: ['&& denotes a mnemonic'] }, "Flip &&Layout")
        },
        order: 1
    });
    // --- Toggle Sidebar Position
    let ToggleSidebarPositionAction = class ToggleSidebarPositionAction extends actions_1.Action {
        constructor(id, label, layoutService, configurationService) {
            super(id, label);
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.enabled = !!this.layoutService && !!this.configurationService;
        }
        run() {
            const position = this.layoutService.getSideBarPosition();
            const newPositionValue = (position === 0 /* LEFT */) ? 'right' : 'left';
            return this.configurationService.updateValue(ToggleSidebarPositionAction.sidebarPositionConfigurationKey, newPositionValue, 1 /* USER */);
        }
        static getLabel(layoutService) {
            return layoutService.getSideBarPosition() === 0 /* LEFT */ ? nls.localize('moveSidebarRight', "Move Side Bar Right") : nls.localize('moveSidebarLeft', "Move Side Bar Left");
        }
    };
    ToggleSidebarPositionAction.ID = 'workbench.action.toggleSidebarPosition';
    ToggleSidebarPositionAction.LABEL = nls.localize('toggleSidebarPosition', "Toggle Side Bar Position");
    ToggleSidebarPositionAction.sidebarPositionConfigurationKey = 'workbench.sideBar.location';
    ToggleSidebarPositionAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleSidebarPositionAction);
    exports.ToggleSidebarPositionAction = ToggleSidebarPositionAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleSidebarPositionAction), 'View: Toggle Side Bar Position', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: nls.localize({ key: 'miMoveSidebarRight', comment: ['&& denotes a mnemonic'] }, "&&Move Side Bar Right")
        },
        when: contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: nls.localize({ key: 'miMoveSidebarLeft', comment: ['&& denotes a mnemonic'] }, "&&Move Side Bar Left")
        },
        when: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    // --- Toggle Sidebar Visibility
    let ToggleEditorVisibilityAction = class ToggleEditorVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        async run() {
            this.layoutService.toggleMaximizedPanel();
        }
    };
    ToggleEditorVisibilityAction.ID = 'workbench.action.toggleEditorVisibility';
    ToggleEditorVisibilityAction.LABEL = nls.localize('toggleEditor', "Toggle Editor Area Visibility");
    ToggleEditorVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleEditorVisibilityAction);
    exports.ToggleEditorVisibilityAction = ToggleEditorVisibilityAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleEditorVisibilityAction), 'View: Toggle Editor Area Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '2_workbench_layout',
        command: {
            id: ToggleEditorVisibilityAction.ID,
            title: nls.localize({ key: 'miShowEditorArea', comment: ['&& denotes a mnemonic'] }, "Show &&Editor Area"),
            toggled: editor_1.EditorAreaVisibleContext
        },
        order: 5
    });
    let ToggleSidebarVisibilityAction = class ToggleSidebarVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        async run() {
            const hideSidebar = this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
            this.layoutService.setSideBarHidden(hideSidebar);
        }
    };
    ToggleSidebarVisibilityAction.ID = 'workbench.action.toggleSidebarVisibility';
    ToggleSidebarVisibilityAction.LABEL = nls.localize('toggleSidebar', "Toggle Side Bar Visibility");
    ToggleSidebarVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleSidebarVisibilityAction);
    exports.ToggleSidebarVisibilityAction = ToggleSidebarVisibilityAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleSidebarVisibilityAction, { primary: 2048 /* CtrlCmd */ | 32 /* KEY_B */ }), 'View: Toggle Side Bar Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: nls.localize({ key: 'miAppearance', comment: ['&& denotes a mnemonic'] }, "&&Appearance"),
        submenu: actions_2.MenuId.MenubarAppearanceMenu,
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '2_workbench_layout',
        command: {
            id: ToggleSidebarVisibilityAction.ID,
            title: nls.localize({ key: 'miShowSidebar', comment: ['&& denotes a mnemonic'] }, "Show &&Side Bar"),
            toggled: viewlet_1.SideBarVisibleContext
        },
        order: 1
    });
    // --- Toggle Statusbar Visibility
    let ToggleStatusbarVisibilityAction = class ToggleStatusbarVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService, configurationService) {
            super(id, label);
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.enabled = !!this.layoutService;
        }
        run() {
            const visibility = this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */);
            const newVisibilityValue = !visibility;
            return this.configurationService.updateValue(ToggleStatusbarVisibilityAction.statusbarVisibleKey, newVisibilityValue, 1 /* USER */);
        }
    };
    ToggleStatusbarVisibilityAction.ID = 'workbench.action.toggleStatusbarVisibility';
    ToggleStatusbarVisibilityAction.LABEL = nls.localize('toggleStatusbar', "Toggle Status Bar Visibility");
    ToggleStatusbarVisibilityAction.statusbarVisibleKey = 'workbench.statusBar.visible';
    ToggleStatusbarVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleStatusbarVisibilityAction);
    exports.ToggleStatusbarVisibilityAction = ToggleStatusbarVisibilityAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleStatusbarVisibilityAction), 'View: Toggle Status Bar Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '2_workbench_layout',
        command: {
            id: ToggleStatusbarVisibilityAction.ID,
            title: nls.localize({ key: 'miShowStatusbar', comment: ['&& denotes a mnemonic'] }, "Show S&&tatus Bar"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.statusBar.visible', true)
        },
        order: 3
    });
    // --- Toggle Tabs Visibility
    let ToggleTabsVisibilityAction = class ToggleTabsVisibilityAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        run() {
            const visibility = this.configurationService.getValue(ToggleTabsVisibilityAction.tabsVisibleKey);
            const newVisibilityValue = !visibility;
            return this.configurationService.updateValue(ToggleTabsVisibilityAction.tabsVisibleKey, newVisibilityValue);
        }
    };
    ToggleTabsVisibilityAction.ID = 'workbench.action.toggleTabsVisibility';
    ToggleTabsVisibilityAction.LABEL = nls.localize('toggleTabs', "Toggle Tab Visibility");
    ToggleTabsVisibilityAction.tabsVisibleKey = 'workbench.editor.showTabs';
    ToggleTabsVisibilityAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleTabsVisibilityAction);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleTabsVisibilityAction, {
        primary: undefined,
        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 53 /* KEY_W */, },
        linux: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 53 /* KEY_W */, }
    }), 'View: Toggle Tab Visibility', viewCategory);
    // --- Toggle Zen Mode
    let ToggleZenMode = class ToggleZenMode extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        async run() {
            this.layoutService.toggleZenMode();
        }
    };
    ToggleZenMode.ID = 'workbench.action.toggleZenMode';
    ToggleZenMode.LABEL = nls.localize('toggleZenMode', "Toggle Zen Mode");
    ToggleZenMode = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleZenMode);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleZenMode, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 56 /* KEY_Z */) }), 'View: Toggle Zen Mode', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '1_toggle_view',
        command: {
            id: ToggleZenMode.ID,
            title: nls.localize('miToggleZenMode', "Zen Mode"),
            toggled: editor_1.InEditorZenModeContext
        },
        order: 2
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.exitZenMode',
        weight: 100 /* EditorContrib */ - 1000,
        handler(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.toggleZenMode();
        },
        when: editor_1.InEditorZenModeContext,
        primary: keyCodes_1.KeyChord(9 /* Escape */, 9 /* Escape */)
    });
    // --- Toggle Menu Bar
    let ToggleMenuBarAction = class ToggleMenuBarAction extends actions_1.Action {
        constructor(id, label, configurationService, environmentService) {
            super(id, label);
            this.configurationService = configurationService;
            this.environmentService = environmentService;
        }
        run() {
            let currentVisibilityValue = windows_1.getMenuBarVisibility(this.configurationService, this.environmentService);
            if (typeof currentVisibilityValue !== 'string') {
                currentVisibilityValue = 'default';
            }
            let newVisibilityValue;
            if (currentVisibilityValue === 'visible' || currentVisibilityValue === 'default') {
                newVisibilityValue = 'toggle';
            }
            else if (currentVisibilityValue === 'compact') {
                newVisibilityValue = 'hidden';
            }
            else {
                newVisibilityValue = (platform_2.isWeb && currentVisibilityValue === 'hidden') ? 'compact' : 'default';
            }
            return this.configurationService.updateValue(ToggleMenuBarAction.menuBarVisibilityKey, newVisibilityValue, 1 /* USER */);
        }
    };
    ToggleMenuBarAction.ID = 'workbench.action.toggleMenuBar';
    ToggleMenuBarAction.LABEL = nls.localize('toggleMenuBar', "Toggle Menu Bar");
    ToggleMenuBarAction.menuBarVisibilityKey = 'window.menuBarVisibility';
    ToggleMenuBarAction = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService)
    ], ToggleMenuBarAction);
    exports.ToggleMenuBarAction = ToggleMenuBarAction;
    if (platform_2.isWindows || platform_2.isLinux || platform_2.isWeb) {
        registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleMenuBarAction), 'View: Toggle Menu Bar', viewCategory);
    }
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '2_workbench_layout',
        command: {
            id: ToggleMenuBarAction.ID,
            title: nls.localize({ key: 'miShowMenuBar', comment: ['&& denotes a mnemonic'] }, "Show Menu &&Bar"),
            toggled: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'))
        },
        when: contextkeys_1.IsMacNativeContext.toNegated(),
        order: 0
    });
    // --- Reset View Positions
    let ResetViewLocationsAction = class ResetViewLocationsAction extends actions_1.Action {
        constructor(id, label, viewDescriptorService) {
            super(id, label);
            this.viewDescriptorService = viewDescriptorService;
        }
        async run() {
            this.viewDescriptorService.viewContainers.forEach(viewContainer => {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                viewContainerModel.allViewDescriptors.forEach(viewDescriptor => {
                    const defaultContainer = this.viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
                    const currentContainer = this.viewDescriptorService.getViewContainerByViewId(viewDescriptor.id);
                    if (defaultContainer && currentContainer !== defaultContainer) {
                        this.viewDescriptorService.moveViewsToContainer([viewDescriptor], defaultContainer);
                    }
                });
                const defaultContainerLocation = this.viewDescriptorService.getDefaultViewContainerLocation(viewContainer);
                const currentContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                if (defaultContainerLocation !== null && currentContainerLocation !== defaultContainerLocation) {
                    this.viewDescriptorService.moveViewContainerToLocation(viewContainer, defaultContainerLocation);
                }
            });
        }
    };
    ResetViewLocationsAction.ID = 'workbench.action.resetViewLocations';
    ResetViewLocationsAction.LABEL = nls.localize('resetViewLocations', "Reset View Locations");
    ResetViewLocationsAction = __decorate([
        __param(2, views_1.IViewDescriptorService)
    ], ResetViewLocationsAction);
    exports.ResetViewLocationsAction = ResetViewLocationsAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ResetViewLocationsAction), 'View: Reset View Locations', viewCategory);
    // --- Toggle View with Command
    class ToggleViewAction extends actions_1.Action {
        constructor(id, label, viewId, viewsService, viewDescriptorService, contextKeyService, layoutService, cssClass) {
            super(id, label, cssClass);
            this.viewId = viewId;
            this.viewsService = viewsService;
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
        }
        async run() {
            const focusedViewId = views_1.FocusedViewContext.getValue(this.contextKeyService);
            if (focusedViewId === this.viewId) {
                if (this.viewDescriptorService.getViewLocationById(this.viewId) === views_1.ViewContainerLocation.Sidebar) {
                    this.layoutService.setSideBarHidden(true);
                }
                else {
                    this.layoutService.setPanelHidden(true);
                }
            }
            else {
                this.viewsService.openView(this.viewId, true);
            }
        }
    }
    exports.ToggleViewAction = ToggleViewAction;
    // --- Move View with Command
    let MoveViewAction = class MoveViewAction extends actions_1.Action {
        constructor(id, label, viewDescriptorService, instantiationService, quickInputService, contextKeyService, activityBarService, panelService) {
            super(id, label);
            this.viewDescriptorService = viewDescriptorService;
            this.instantiationService = instantiationService;
            this.quickInputService = quickInputService;
            this.contextKeyService = contextKeyService;
            this.activityBarService = activityBarService;
            this.panelService = panelService;
        }
        getViewItems() {
            const results = [];
            const viewlets = this.activityBarService.getVisibleViewContainerIds();
            viewlets.forEach(viewletId => {
                const container = this.viewDescriptorService.getViewContainerById(viewletId);
                const containerModel = this.viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: nls.localize('sidebarContainer', "Side Bar / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name
                        });
                    }
                });
            });
            const panels = this.panelService.getPinnedPanels();
            panels.forEach(panel => {
                const container = this.viewDescriptorService.getViewContainerById(panel.id);
                const containerModel = this.viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: nls.localize('panelContainer', "Panel / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name
                        });
                    }
                });
            });
            return results;
        }
        async getView(viewId) {
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.placeholder = nls.localize('moveFocusedView.selectView', "Select a View to Move");
            quickPick.items = this.getViewItems();
            quickPick.selectedItems = quickPick.items.filter(item => item.id === viewId);
            return new Promise((resolve, reject) => {
                quickPick.onDidAccept(() => {
                    const viewId = quickPick.selectedItems[0];
                    resolve(viewId.id);
                    quickPick.hide();
                });
                quickPick.onDidHide(() => reject());
                quickPick.show();
            });
        }
        async run() {
            var _a;
            const focusedViewId = views_1.FocusedViewContext.getValue(this.contextKeyService);
            let viewId;
            if (focusedViewId && ((_a = this.viewDescriptorService.getViewDescriptorById(focusedViewId)) === null || _a === void 0 ? void 0 : _a.canMoveView)) {
                viewId = focusedViewId;
            }
            viewId = await this.getView(viewId);
            if (!viewId) {
                return;
            }
            this.instantiationService.createInstance(MoveFocusedViewAction, MoveFocusedViewAction.ID, MoveFocusedViewAction.LABEL).run(viewId);
        }
    };
    MoveViewAction.ID = 'workbench.action.moveView';
    MoveViewAction.LABEL = nls.localize('moveView', "Move View");
    MoveViewAction = __decorate([
        __param(2, views_1.IViewDescriptorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, activityBarService_1.IActivityBarService),
        __param(7, panelService_1.IPanelService)
    ], MoveViewAction);
    exports.MoveViewAction = MoveViewAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(MoveViewAction), 'View: Move View', viewCategory);
    // --- Move Focused View with Command
    let MoveFocusedViewAction = class MoveFocusedViewAction extends actions_1.Action {
        constructor(id, label, viewDescriptorService, viewsService, quickInputService, contextKeyService, notificationService, activityBarService, panelService) {
            super(id, label);
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.quickInputService = quickInputService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.activityBarService = activityBarService;
            this.panelService = panelService;
        }
        async run(viewId) {
            const focusedViewId = viewId || views_1.FocusedViewContext.getValue(this.contextKeyService);
            if (focusedViewId === undefined || focusedViewId.trim() === '') {
                this.notificationService.error(nls.localize('moveFocusedView.error.noFocusedView', "There is no view currently focused."));
                return;
            }
            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(focusedViewId);
            if (!viewDescriptor || !viewDescriptor.canMoveView) {
                this.notificationService.error(nls.localize('moveFocusedView.error.nonMovableView', "The currently focused view is not movable."));
                return;
            }
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.placeholder = nls.localize('moveFocusedView.selectDestination', "Select a Destination for the View");
            quickPick.title = nls.localize({ key: 'moveFocusedView.title', comment: ['{0} indicates the title of the view the user has selected to move.'] }, "View: Move {0}", viewDescriptor.name);
            const items = [];
            const currentContainer = this.viewDescriptorService.getViewContainerByViewId(focusedViewId);
            const currentLocation = this.viewDescriptorService.getViewLocationById(focusedViewId);
            const isViewSolo = this.viewDescriptorService.getViewContainerModel(currentContainer).allViewDescriptors.length === 1;
            if (!(isViewSolo && currentLocation === views_1.ViewContainerLocation.Panel)) {
                items.push({
                    id: '_.panel.newcontainer',
                    label: nls.localize('moveFocusedView.newContainerInPanel', "New Panel Entry"),
                });
            }
            if (!(isViewSolo && currentLocation === views_1.ViewContainerLocation.Sidebar)) {
                items.push({
                    id: '_.sidebar.newcontainer',
                    label: nls.localize('moveFocusedView.newContainerInSidebar', "New Side Bar Entry")
                });
            }
            items.push({
                type: 'separator',
                label: nls.localize('sidebar', "Side Bar")
            });
            const pinnedViewlets = this.activityBarService.getVisibleViewContainerIds();
            items.push(...pinnedViewlets
                .filter(viewletId => {
                if (viewletId === this.viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !this.viewDescriptorService.getViewContainerById(viewletId).rejectAddedViews;
            })
                .map(viewletId => {
                return {
                    id: viewletId,
                    label: this.viewDescriptorService.getViewContainerById(viewletId).name
                };
            }));
            items.push({
                type: 'separator',
                label: nls.localize('panel', "Panel")
            });
            const pinnedPanels = this.panelService.getPinnedPanels();
            items.push(...pinnedPanels
                .filter(panel => {
                if (panel.id === this.viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !this.viewDescriptorService.getViewContainerById(panel.id).rejectAddedViews;
            })
                .map(panel => {
                return {
                    id: panel.id,
                    label: this.viewDescriptorService.getViewContainerById(panel.id).name
                };
            }));
            quickPick.items = items;
            quickPick.onDidAccept(() => {
                const destination = quickPick.selectedItems[0];
                if (destination.id === '_.panel.newcontainer') {
                    this.viewDescriptorService.moveViewToLocation(viewDescriptor, views_1.ViewContainerLocation.Panel);
                    this.viewsService.openView(focusedViewId, true);
                }
                else if (destination.id === '_.sidebar.newcontainer') {
                    this.viewDescriptorService.moveViewToLocation(viewDescriptor, views_1.ViewContainerLocation.Sidebar);
                    this.viewsService.openView(focusedViewId, true);
                }
                else if (destination.id) {
                    this.viewDescriptorService.moveViewsToContainer([viewDescriptor], this.viewDescriptorService.getViewContainerById(destination.id));
                    this.viewsService.openView(focusedViewId, true);
                }
                quickPick.hide();
            });
            quickPick.show();
        }
    };
    MoveFocusedViewAction.ID = 'workbench.action.moveFocusedView';
    MoveFocusedViewAction.LABEL = nls.localize('moveFocusedView', "Move Focused View");
    MoveFocusedViewAction = __decorate([
        __param(2, views_1.IViewDescriptorService),
        __param(3, views_1.IViewsService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, notification_1.INotificationService),
        __param(7, activityBarService_1.IActivityBarService),
        __param(8, panelService_1.IPanelService)
    ], MoveFocusedViewAction);
    exports.MoveFocusedViewAction = MoveFocusedViewAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(MoveFocusedViewAction), 'View: Move Focused View', viewCategory, views_1.FocusedViewContext.notEqualsTo(''));
    // --- Reset View Location with Command
    let ResetFocusedViewLocationAction = class ResetFocusedViewLocationAction extends actions_1.Action {
        constructor(id, label, viewDescriptorService, contextKeyService, notificationService, viewsService) {
            super(id, label);
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.viewsService = viewsService;
        }
        async run() {
            const focusedViewId = views_1.FocusedViewContext.getValue(this.contextKeyService);
            let viewDescriptor = null;
            if (focusedViewId !== undefined && focusedViewId.trim() !== '') {
                viewDescriptor = this.viewDescriptorService.getViewDescriptorById(focusedViewId);
            }
            if (!viewDescriptor) {
                this.notificationService.error(nls.localize('resetFocusedView.error.noFocusedView', "There is no view currently focused."));
                return;
            }
            const defaultContainer = this.viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
            if (!defaultContainer || defaultContainer === this.viewDescriptorService.getViewContainerByViewId(viewDescriptor.id)) {
                return;
            }
            this.viewDescriptorService.moveViewsToContainer([viewDescriptor], defaultContainer);
            this.viewsService.openView(viewDescriptor.id, true);
        }
    };
    ResetFocusedViewLocationAction.ID = 'workbench.action.resetFocusedViewLocation';
    ResetFocusedViewLocationAction.LABEL = nls.localize('resetFocusedViewLocation', "Reset Focused View Location");
    ResetFocusedViewLocationAction = __decorate([
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, notification_1.INotificationService),
        __param(5, views_1.IViewsService)
    ], ResetFocusedViewLocationAction);
    exports.ResetFocusedViewLocationAction = ResetFocusedViewLocationAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ResetFocusedViewLocationAction), 'View: Reset Focused View Location', viewCategory, views_1.FocusedViewContext.notEqualsTo(''));
    // --- Resize View
    let BaseResizeViewAction = class BaseResizeViewAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
        }
        resizePart(sizeChange) {
            const isEditorFocus = this.layoutService.hasFocus("workbench.parts.editor" /* EDITOR_PART */);
            const isSidebarFocus = this.layoutService.hasFocus("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const isPanelFocus = this.layoutService.hasFocus("workbench.parts.panel" /* PANEL_PART */);
            let part;
            if (isSidebarFocus) {
                part = "workbench.parts.sidebar" /* SIDEBAR_PART */;
            }
            else if (isPanelFocus) {
                part = "workbench.parts.panel" /* PANEL_PART */;
            }
            else if (isEditorFocus) {
                part = "workbench.parts.editor" /* EDITOR_PART */;
            }
            if (part) {
                this.layoutService.resizePart(part, sizeChange);
            }
        }
    };
    BaseResizeViewAction.RESIZE_INCREMENT = 6.5; // This is a media-size percentage
    BaseResizeViewAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], BaseResizeViewAction);
    exports.BaseResizeViewAction = BaseResizeViewAction;
    let IncreaseViewSizeAction = class IncreaseViewSizeAction extends BaseResizeViewAction {
        constructor(id, label, layoutService) {
            super(id, label, layoutService);
        }
        async run() {
            this.resizePart(BaseResizeViewAction.RESIZE_INCREMENT);
        }
    };
    IncreaseViewSizeAction.ID = 'workbench.action.increaseViewSize';
    IncreaseViewSizeAction.LABEL = nls.localize('increaseViewSize', "Increase Current View Size");
    IncreaseViewSizeAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], IncreaseViewSizeAction);
    exports.IncreaseViewSizeAction = IncreaseViewSizeAction;
    let DecreaseViewSizeAction = class DecreaseViewSizeAction extends BaseResizeViewAction {
        constructor(id, label, layoutService) {
            super(id, label, layoutService);
        }
        async run() {
            this.resizePart(-BaseResizeViewAction.RESIZE_INCREMENT);
        }
    };
    DecreaseViewSizeAction.ID = 'workbench.action.decreaseViewSize';
    DecreaseViewSizeAction.LABEL = nls.localize('decreaseViewSize', "Decrease Current View Size");
    DecreaseViewSizeAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], DecreaseViewSizeAction);
    exports.DecreaseViewSizeAction = DecreaseViewSizeAction;
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(IncreaseViewSizeAction, undefined), 'View: Increase Current View Size', viewCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(DecreaseViewSizeAction, undefined), 'View: Decrease Current View Size', viewCategory);
});
//# __sourceMappingURL=layoutActions.js.map