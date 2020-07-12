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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/actions/common/actions", "vs/workbench/common/actions"], function (require, exports, nls, platform_1, actions_1, editorGroupsService_1, panelService_1, layoutService_1, viewlet_1, actions_2, actions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FocusPreviousPart = exports.FocusNextPart = void 0;
    let BaseNavigationAction = class BaseNavigationAction extends actions_1.Action {
        constructor(id, label, direction, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label);
            this.direction = direction;
            this.editorGroupService = editorGroupService;
            this.panelService = panelService;
            this.layoutService = layoutService;
            this.viewletService = viewletService;
        }
        async run() {
            const isEditorFocus = this.layoutService.hasFocus("workbench.parts.editor" /* EDITOR_PART */);
            const isPanelFocus = this.layoutService.hasFocus("workbench.parts.panel" /* PANEL_PART */);
            const isSidebarFocus = this.layoutService.hasFocus("workbench.parts.sidebar" /* SIDEBAR_PART */);
            let neighborPart;
            if (isEditorFocus) {
                const didNavigate = this.navigateAcrossEditorGroup(this.toGroupDirection(this.direction));
                if (didNavigate) {
                    return true;
                }
                neighborPart = this.layoutService.getVisibleNeighborPart("workbench.parts.editor" /* EDITOR_PART */, this.direction);
            }
            if (isPanelFocus) {
                neighborPart = this.layoutService.getVisibleNeighborPart("workbench.parts.panel" /* PANEL_PART */, this.direction);
            }
            if (isSidebarFocus) {
                neighborPart = this.layoutService.getVisibleNeighborPart("workbench.parts.sidebar" /* SIDEBAR_PART */, this.direction);
            }
            if (neighborPart === "workbench.parts.editor" /* EDITOR_PART */) {
                return this.navigateToEditorGroup(this.direction === 3 /* Right */ ? 0 /* FIRST */ : 1 /* LAST */);
            }
            if (neighborPart === "workbench.parts.sidebar" /* SIDEBAR_PART */) {
                return this.navigateToSidebar();
            }
            if (neighborPart === "workbench.parts.panel" /* PANEL_PART */) {
                return this.navigateToPanel();
            }
            return false;
        }
        async navigateToPanel() {
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                return false;
            }
            const activePanel = this.panelService.getActivePanel();
            if (!activePanel) {
                return false;
            }
            const activePanelId = activePanel.getId();
            const res = await this.panelService.openPanel(activePanelId, true);
            if (!res) {
                return false;
            }
            return res;
        }
        async navigateToSidebar() {
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                return false;
            }
            const activeViewlet = this.viewletService.getActiveViewlet();
            if (!activeViewlet) {
                return false;
            }
            const activeViewletId = activeViewlet.getId();
            const viewlet = await this.viewletService.openViewlet(activeViewletId, true);
            return !!viewlet;
        }
        navigateAcrossEditorGroup(direction) {
            return this.doNavigateToEditorGroup({ direction });
        }
        navigateToEditorGroup(location) {
            return this.doNavigateToEditorGroup({ location });
        }
        toGroupDirection(direction) {
            switch (direction) {
                case 1 /* Down */: return 1 /* DOWN */;
                case 2 /* Left */: return 2 /* LEFT */;
                case 3 /* Right */: return 3 /* RIGHT */;
                case 0 /* Up */: return 0 /* UP */;
            }
        }
        doNavigateToEditorGroup(scope) {
            const targetGroup = this.editorGroupService.findGroup(scope, this.editorGroupService.activeGroup);
            if (targetGroup) {
                targetGroup.focus();
                return true;
            }
            return false;
        }
    };
    BaseNavigationAction = __decorate([
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, panelService_1.IPanelService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, viewlet_1.IViewletService)
    ], BaseNavigationAction);
    let NavigateLeftAction = class NavigateLeftAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, 2 /* Left */, editorGroupService, panelService, layoutService, viewletService);
        }
    };
    NavigateLeftAction.ID = 'workbench.action.navigateLeft';
    NavigateLeftAction.LABEL = nls.localize('navigateLeft', "Navigate to the View on the Left");
    NavigateLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateLeftAction);
    let NavigateRightAction = class NavigateRightAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, 3 /* Right */, editorGroupService, panelService, layoutService, viewletService);
        }
    };
    NavigateRightAction.ID = 'workbench.action.navigateRight';
    NavigateRightAction.LABEL = nls.localize('navigateRight', "Navigate to the View on the Right");
    NavigateRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateRightAction);
    let NavigateUpAction = class NavigateUpAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, 0 /* Up */, editorGroupService, panelService, layoutService, viewletService);
        }
    };
    NavigateUpAction.ID = 'workbench.action.navigateUp';
    NavigateUpAction.LABEL = nls.localize('navigateUp', "Navigate to the View Above");
    NavigateUpAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateUpAction);
    let NavigateDownAction = class NavigateDownAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, 1 /* Down */, editorGroupService, panelService, layoutService, viewletService);
        }
    };
    NavigateDownAction.ID = 'workbench.action.navigateDown';
    NavigateDownAction.LABEL = nls.localize('navigateDown', "Navigate to the View Below");
    NavigateDownAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateDownAction);
    function findVisibleNeighbour(layoutService, part, next) {
        const neighbour = part === "workbench.parts.editor" /* EDITOR_PART */ ? (next ? "workbench.parts.panel" /* PANEL_PART */ : "workbench.parts.sidebar" /* SIDEBAR_PART */) : part === "workbench.parts.panel" /* PANEL_PART */ ? (next ? "workbench.parts.statusbar" /* STATUSBAR_PART */ : "workbench.parts.editor" /* EDITOR_PART */) :
            part === "workbench.parts.statusbar" /* STATUSBAR_PART */ ? (next ? "workbench.parts.activitybar" /* ACTIVITYBAR_PART */ : "workbench.parts.panel" /* PANEL_PART */) : part === "workbench.parts.activitybar" /* ACTIVITYBAR_PART */ ? (next ? "workbench.parts.sidebar" /* SIDEBAR_PART */ : "workbench.parts.statusbar" /* STATUSBAR_PART */) :
                part === "workbench.parts.sidebar" /* SIDEBAR_PART */ ? (next ? "workbench.parts.editor" /* EDITOR_PART */ : "workbench.parts.activitybar" /* ACTIVITYBAR_PART */) : "workbench.parts.editor" /* EDITOR_PART */;
        if (layoutService.isVisible(neighbour) || neighbour === "workbench.parts.editor" /* EDITOR_PART */) {
            return neighbour;
        }
        return findVisibleNeighbour(layoutService, neighbour, next);
    }
    function focusNextOrPreviousPart(layoutService, next) {
        const currentlyFocusedPart = layoutService.hasFocus("workbench.parts.editor" /* EDITOR_PART */) ? "workbench.parts.editor" /* EDITOR_PART */ : layoutService.hasFocus("workbench.parts.activitybar" /* ACTIVITYBAR_PART */) ? "workbench.parts.activitybar" /* ACTIVITYBAR_PART */ :
            layoutService.hasFocus("workbench.parts.statusbar" /* STATUSBAR_PART */) ? "workbench.parts.statusbar" /* STATUSBAR_PART */ : layoutService.hasFocus("workbench.parts.sidebar" /* SIDEBAR_PART */) ? "workbench.parts.sidebar" /* SIDEBAR_PART */ : layoutService.hasFocus("workbench.parts.panel" /* PANEL_PART */) ? "workbench.parts.panel" /* PANEL_PART */ : undefined;
        let partToFocus = "workbench.parts.editor" /* EDITOR_PART */;
        if (currentlyFocusedPart) {
            partToFocus = findVisibleNeighbour(layoutService, currentlyFocusedPart, next);
        }
        layoutService.focusPart(partToFocus);
    }
    let FocusNextPart = class FocusNextPart extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
        }
        async run() {
            focusNextOrPreviousPart(this.layoutService, true);
        }
    };
    FocusNextPart.ID = 'workbench.action.focusNextPart';
    FocusNextPart.LABEL = nls.localize('focusNextPart', "Focus Next Part");
    FocusNextPart = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], FocusNextPart);
    exports.FocusNextPart = FocusNextPart;
    let FocusPreviousPart = class FocusPreviousPart extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
        }
        async run() {
            focusNextOrPreviousPart(this.layoutService, false);
        }
    };
    FocusPreviousPart.ID = 'workbench.action.focusPreviousPart';
    FocusPreviousPart.LABEL = nls.localize('focusPreviousPart', "Focus Previous Part");
    FocusPreviousPart = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], FocusPreviousPart);
    exports.FocusPreviousPart = FocusPreviousPart;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    const viewCategory = nls.localize('view', "View");
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NavigateUpAction, undefined), 'View: Navigate to the View Above', viewCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NavigateDownAction, undefined), 'View: Navigate to the View Below', viewCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NavigateLeftAction, undefined), 'View: Navigate to the View on the Left', viewCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NavigateRightAction, undefined), 'View: Navigate to the View on the Right', viewCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(FocusNextPart, { primary: 64 /* F6 */ }), 'View: Focus Next Part', viewCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(FocusPreviousPart, { primary: 1024 /* Shift */ | 64 /* F6 */ }), 'View: Focus Previous Part', viewCategory);
});
//# __sourceMappingURL=navigationActions.js.map