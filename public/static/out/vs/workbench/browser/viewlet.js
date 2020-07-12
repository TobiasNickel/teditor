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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/browser/composite", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/actions/layoutActions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/layout/browser/layoutService", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/browser/panecomposite", "vs/base/browser/ui/actionbar/actionbar"], function (require, exports, nls, DOM, platform_1, actions_1, viewlet_1, composite_1, instantiation_1, layoutActions_1, telemetry_1, layoutService_1, themeService_1, editorGroupsService_1, storage_1, contextView_1, extensions_1, workspace_1, configuration_1, panecomposite_1, actionbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapseAction = exports.ShowViewletAction = exports.ViewletRegistry = exports.Extensions = exports.ViewletDescriptor = exports.Viewlet = void 0;
    let Viewlet = class Viewlet extends panecomposite_1.PaneComposite {
        constructor(id, viewPaneContainer, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, layoutService, configurationService) {
            super(id, viewPaneContainer, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.extensionService = extensionService;
            this.contextService = contextService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
        }
        getContextMenuActions() {
            const parentActions = [...super.getContextMenuActions()];
            if (parentActions.length) {
                parentActions.push(new actionbar_1.Separator());
            }
            const toggleSidebarPositionAction = new layoutActions_1.ToggleSidebarPositionAction(layoutActions_1.ToggleSidebarPositionAction.ID, layoutActions_1.ToggleSidebarPositionAction.getLabel(this.layoutService), this.layoutService, this.configurationService);
            return [...parentActions, toggleSidebarPositionAction, {
                    id: layoutActions_1.ToggleSidebarVisibilityAction.ID,
                    label: nls.localize('compositePart.hideSideBarLabel', "Hide Side Bar"),
                    enabled: true,
                    run: () => this.layoutService.setSideBarHidden(true)
                }];
        }
    };
    Viewlet = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, storage_1.IStorageService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, extensions_1.IExtensionService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, configuration_1.IConfigurationService)
    ], Viewlet);
    exports.Viewlet = Viewlet;
    /**
     * A viewlet descriptor is a leightweight descriptor of a viewlet in the workbench.
     */
    class ViewletDescriptor extends composite_1.CompositeDescriptor {
        constructor(ctor, id, name, cssClass, order, requestedIndex, iconUrl) {
            super(ctor, id, name, cssClass, order, requestedIndex, id);
            this.iconUrl = iconUrl;
        }
        static create(ctor, id, name, cssClass, order, requestedIndex, iconUrl) {
            return new ViewletDescriptor(ctor, id, name, cssClass, order, requestedIndex, iconUrl);
        }
    }
    exports.ViewletDescriptor = ViewletDescriptor;
    exports.Extensions = {
        Viewlets: 'workbench.contributions.viewlets'
    };
    class ViewletRegistry extends composite_1.CompositeRegistry {
        /**
         * Registers a viewlet to the platform.
         */
        registerViewlet(descriptor) {
            super.registerComposite(descriptor);
        }
        /**
         * Deregisters a viewlet to the platform.
         */
        deregisterViewlet(id) {
            super.deregisterComposite(id);
        }
        /**
         * Returns the viewlet descriptor for the given id or null if none.
         */
        getViewlet(id) {
            return this.getComposite(id);
        }
        /**
         * Returns an array of registered viewlets known to the platform.
         */
        getViewlets() {
            return this.getComposites();
        }
    }
    exports.ViewletRegistry = ViewletRegistry;
    platform_1.Registry.add(exports.Extensions.Viewlets, new ViewletRegistry());
    /**
     * A reusable action to show a viewlet with a specific id.
     */
    let ShowViewletAction = class ShowViewletAction extends actions_1.Action {
        constructor(id, name, viewletId, viewletService, editorGroupService, layoutService) {
            super(id, name);
            this.viewletId = viewletId;
            this.viewletService = viewletService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.enabled = !!this.viewletService && !!this.editorGroupService;
        }
        async run() {
            // Pass focus to viewlet if not open or focused
            if (this.otherViewletShowing() || !this.sidebarHasFocus()) {
                await this.viewletService.openViewlet(this.viewletId, true);
                return;
            }
            // Otherwise pass focus to editor group
            this.editorGroupService.activeGroup.focus();
        }
        otherViewletShowing() {
            const activeViewlet = this.viewletService.getActiveViewlet();
            return !activeViewlet || activeViewlet.getId() !== this.viewletId;
        }
        sidebarHasFocus() {
            const activeViewlet = this.viewletService.getActiveViewlet();
            const activeElement = document.activeElement;
            const sidebarPart = this.layoutService.getContainer("workbench.parts.sidebar" /* SIDEBAR_PART */);
            return !!(activeViewlet && activeElement && sidebarPart && DOM.isAncestor(activeElement, sidebarPart));
        }
    };
    ShowViewletAction = __decorate([
        __param(3, viewlet_1.IViewletService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, layoutService_1.IWorkbenchLayoutService)
    ], ShowViewletAction);
    exports.ShowViewletAction = ShowViewletAction;
    class CollapseAction extends actions_1.Action {
        // We need a tree getter because the action is sometimes instantiated too early
        constructor(treeGetter, enabled, clazz) {
            super('workbench.action.collapse', nls.localize('collapse', "Collapse All"), clazz, enabled, async () => {
                const tree = treeGetter();
                tree.collapseAll();
            });
        }
    }
    exports.CollapseAction = CollapseAction;
});
//# __sourceMappingURL=viewlet.js.map