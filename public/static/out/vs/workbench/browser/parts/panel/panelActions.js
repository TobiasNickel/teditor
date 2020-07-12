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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/panel", "vs/base/common/codicons", "vs/css!./media/panelpart"], function (require, exports, nls, lifecycle_1, actions_1, platform_1, actions_2, actions_3, panelService_1, layoutService_1, compositeBarActions_1, editorGroupsService_1, panel_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NextPanelViewAction = exports.PreviousPanelViewAction = exports.SwitchPanelViewAction = exports.PlaceHolderToggleCompositePinnedAction = exports.PlaceHolderPanelActivityAction = exports.PanelActivityAction = exports.SetPanelPositionAction = exports.PositionPanelActionConfigs = exports.ToggleMaximizedPanelAction = exports.TogglePanelAction = exports.ClosePanelAction = void 0;
    const maximizeIcon = codicons_1.registerIcon('panel-maximize', codicons_1.Codicon.chevronUp);
    const restoreIcon = codicons_1.registerIcon('panel-restore', codicons_1.Codicon.chevronDown);
    const closeIcon = codicons_1.registerIcon('panel-close', codicons_1.Codicon.close);
    let ClosePanelAction = class ClosePanelAction extends actions_1.Action {
        constructor(id, name, layoutService) {
            super(id, name, closeIcon.classNames);
            this.layoutService = layoutService;
        }
        async run() {
            this.layoutService.setPanelHidden(true);
        }
    };
    ClosePanelAction.ID = 'workbench.action.closePanel';
    ClosePanelAction.LABEL = nls.localize('closePanel', "Close Panel");
    ClosePanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ClosePanelAction);
    exports.ClosePanelAction = ClosePanelAction;
    let TogglePanelAction = class TogglePanelAction extends actions_1.Action {
        constructor(id, name, layoutService) {
            super(id, name, layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */) ? 'panel expanded' : 'panel');
            this.layoutService = layoutService;
        }
        async run() {
            this.layoutService.setPanelHidden(this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */));
        }
    };
    TogglePanelAction.ID = 'workbench.action.togglePanel';
    TogglePanelAction.LABEL = nls.localize('togglePanel', "Toggle Panel");
    TogglePanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], TogglePanelAction);
    exports.TogglePanelAction = TogglePanelAction;
    let FocusPanelAction = class FocusPanelAction extends actions_1.Action {
        constructor(id, label, panelService, layoutService) {
            super(id, label);
            this.panelService = panelService;
            this.layoutService = layoutService;
        }
        async run() {
            // Show panel
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                this.layoutService.setPanelHidden(false);
            }
            // Focus into active panel
            let panel = this.panelService.getActivePanel();
            if (panel) {
                panel.focus();
            }
        }
    };
    FocusPanelAction.ID = 'workbench.action.focusPanel';
    FocusPanelAction.LABEL = nls.localize('focusPanel', "Focus into Panel");
    FocusPanelAction = __decorate([
        __param(2, panelService_1.IPanelService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], FocusPanelAction);
    let ToggleMaximizedPanelAction = class ToggleMaximizedPanelAction extends actions_1.Action {
        constructor(id, label, layoutService, editorGroupsService) {
            super(id, label, layoutService.isPanelMaximized() ? restoreIcon.classNames : maximizeIcon.classNames);
            this.layoutService = layoutService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            this.toDispose.add(editorGroupsService.onDidLayout(() => {
                const maximized = this.layoutService.isPanelMaximized();
                this.class = maximized ? restoreIcon.classNames : maximizeIcon.classNames;
                this.label = maximized ? ToggleMaximizedPanelAction.RESTORE_LABEL : ToggleMaximizedPanelAction.MAXIMIZE_LABEL;
            }));
        }
        async run() {
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                this.layoutService.setPanelHidden(false);
            }
            this.layoutService.toggleMaximizedPanel();
        }
    };
    ToggleMaximizedPanelAction.ID = 'workbench.action.toggleMaximizedPanel';
    ToggleMaximizedPanelAction.LABEL = nls.localize('toggleMaximizedPanel', "Toggle Maximized Panel");
    ToggleMaximizedPanelAction.MAXIMIZE_LABEL = nls.localize('maximizePanel', "Maximize Panel Size");
    ToggleMaximizedPanelAction.RESTORE_LABEL = nls.localize('minimizePanel', "Restore Panel Size");
    ToggleMaximizedPanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], ToggleMaximizedPanelAction);
    exports.ToggleMaximizedPanelAction = ToggleMaximizedPanelAction;
    const PositionPanelActionId = {
        LEFT: 'workbench.action.positionPanelLeft',
        RIGHT: 'workbench.action.positionPanelRight',
        BOTTOM: 'workbench.action.positionPanelBottom',
    };
    function createPositionPanelActionConfig(id, alias, label, position) {
        return {
            id,
            alias,
            label,
            value: position,
            when: panel_1.PanelPositionContext.notEqualsTo(layoutService_1.positionToString(position))
        };
    }
    exports.PositionPanelActionConfigs = [
        createPositionPanelActionConfig(PositionPanelActionId.LEFT, 'View: Move Panel Left', nls.localize('positionPanelLeft', 'Move Panel Left'), 0 /* LEFT */),
        createPositionPanelActionConfig(PositionPanelActionId.RIGHT, 'View: Move Panel Right', nls.localize('positionPanelRight', 'Move Panel Right'), 1 /* RIGHT */),
        createPositionPanelActionConfig(PositionPanelActionId.BOTTOM, 'View: Move Panel To Bottom', nls.localize('positionPanelBottom', 'Move Panel To Bottom'), 2 /* BOTTOM */),
    ];
    const positionByActionId = new Map(exports.PositionPanelActionConfigs.map(config => [config.id, config.value]));
    let SetPanelPositionAction = class SetPanelPositionAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
        }
        async run() {
            const position = positionByActionId.get(this.id);
            this.layoutService.setPanelPosition(position === undefined ? 2 /* BOTTOM */ : position);
        }
    };
    SetPanelPositionAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], SetPanelPositionAction);
    exports.SetPanelPositionAction = SetPanelPositionAction;
    let PanelActivityAction = class PanelActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity, panelService) {
            super(activity);
            this.panelService = panelService;
        }
        async run() {
            await this.panelService.openPanel(this.activity.id, true);
            this.activate();
        }
        setActivity(activity) {
            this.activity = activity;
        }
    };
    PanelActivityAction = __decorate([
        __param(1, panelService_1.IPanelService)
    ], PanelActivityAction);
    exports.PanelActivityAction = PanelActivityAction;
    let PlaceHolderPanelActivityAction = class PlaceHolderPanelActivityAction extends PanelActivityAction {
        constructor(id, panelService) {
            super({ id, name: id }, panelService);
        }
    };
    PlaceHolderPanelActivityAction = __decorate([
        __param(1, panelService_1.IPanelService)
    ], PlaceHolderPanelActivityAction);
    exports.PlaceHolderPanelActivityAction = PlaceHolderPanelActivityAction;
    class PlaceHolderToggleCompositePinnedAction extends compositeBarActions_1.ToggleCompositePinnedAction {
        constructor(id, compositeBar) {
            super({ id, name: id, cssClass: undefined }, compositeBar);
        }
        setActivity(activity) {
            this.label = activity.name;
        }
    }
    exports.PlaceHolderToggleCompositePinnedAction = PlaceHolderToggleCompositePinnedAction;
    let SwitchPanelViewAction = class SwitchPanelViewAction extends actions_1.Action {
        constructor(id, name, panelService) {
            super(id, name);
            this.panelService = panelService;
        }
        async run(offset) {
            const pinnedPanels = this.panelService.getPinnedPanels();
            const activePanel = this.panelService.getActivePanel();
            if (!activePanel) {
                return;
            }
            let targetPanelId;
            for (let i = 0; i < pinnedPanels.length; i++) {
                if (pinnedPanels[i].id === activePanel.getId()) {
                    targetPanelId = pinnedPanels[(i + pinnedPanels.length + offset) % pinnedPanels.length].id;
                    break;
                }
            }
            if (typeof targetPanelId === 'string') {
                await this.panelService.openPanel(targetPanelId, true);
            }
        }
    };
    SwitchPanelViewAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], SwitchPanelViewAction);
    exports.SwitchPanelViewAction = SwitchPanelViewAction;
    let PreviousPanelViewAction = class PreviousPanelViewAction extends SwitchPanelViewAction {
        constructor(id, name, panelService) {
            super(id, name, panelService);
        }
        run() {
            return super.run(-1);
        }
    };
    PreviousPanelViewAction.ID = 'workbench.action.previousPanelView';
    PreviousPanelViewAction.LABEL = nls.localize('previousPanelView', 'Previous Panel View');
    PreviousPanelViewAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], PreviousPanelViewAction);
    exports.PreviousPanelViewAction = PreviousPanelViewAction;
    let NextPanelViewAction = class NextPanelViewAction extends SwitchPanelViewAction {
        constructor(id, name, panelService) {
            super(id, name, panelService);
        }
        run() {
            return super.run(1);
        }
    };
    NextPanelViewAction.ID = 'workbench.action.nextPanelView';
    NextPanelViewAction.LABEL = nls.localize('nextPanelView', 'Next Panel View');
    NextPanelViewAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], NextPanelViewAction);
    exports.NextPanelViewAction = NextPanelViewAction;
    const actionRegistry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(TogglePanelAction, { primary: 2048 /* CtrlCmd */ | 40 /* KEY_J */ }), 'View: Toggle Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(FocusPanelAction), 'View: Focus into Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleMaximizedPanelAction), 'View: Toggle Maximized Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ClosePanelAction), 'View: Close Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(PreviousPanelViewAction), 'View: Previous Panel View', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NextPanelViewAction), 'View: Next Panel View', nls.localize('view', "View"));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        group: '2_workbench_layout',
        command: {
            id: TogglePanelAction.ID,
            title: nls.localize({ key: 'miShowPanel', comment: ['&& denotes a mnemonic'] }, "Show &&Panel"),
            toggled: panel_1.ActivePanelContext
        },
        order: 5
    });
    function registerPositionPanelActionById(config) {
        const { id, label, alias, when } = config;
        // register the workbench action
        actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.create(SetPanelPositionAction, id, label), alias, nls.localize('view', "View"), when);
        // register as a menu item
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
            group: '3_workbench_layout_move',
            command: {
                id,
                title: label
            },
            when,
            order: 5
        });
    }
    // register each position panel action
    exports.PositionPanelActionConfigs.forEach(registerPositionPanelActionById);
});
//# __sourceMappingURL=panelActions.js.map