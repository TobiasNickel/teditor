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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls", "vs/workbench/contrib/markers/browser/markersModel", "vs/workbench/contrib/markers/browser/markersView", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/common/contributions", "vs/workbench/contrib/markers/browser/markers", "vs/platform/instantiation/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/markers/common/markers", "vs/platform/commands/common/commands", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/actions/layoutActions", "vs/base/common/codicons", "vs/workbench/contrib/markers/browser/markersFileDecorations"], function (require, exports, contextkey_1, configurationRegistry_1, actions_1, keybindingsRegistry_1, nls_1, markersModel_1, markersView_1, actions_2, platform_1, markersViewActions_1, constants_1, messages_1, contributions_1, markers_1, extensions_1, clipboardService_1, lifecycle_1, statusbar_1, markers_2, commands_1, views_1, viewPaneContainer_1, layoutService_1, descriptors_1, layoutActions_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(markers_1.IMarkersWorkbenchService, markers_1.MarkersWorkbenchService, false);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: constants_1.default.MARKER_OPEN_SIDE_ACTION_ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(constants_1.default.MarkerFocusContextKey),
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        handler: (accessor, args) => {
            const markersView = accessor.get(views_1.IViewsService).getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
            markersView.openFileAtElement(markersView.getFocusElement(), false, true, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: constants_1.default.MARKER_SHOW_PANEL_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: async (accessor, args) => {
            await accessor.get(views_1.IViewsService).openView(constants_1.default.MARKERS_VIEW_ID);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: constants_1.default.MARKER_SHOW_QUICK_FIX,
        weight: 200 /* WorkbenchContrib */,
        when: constants_1.default.MarkerFocusContextKey,
        primary: 2048 /* CtrlCmd */ | 84 /* US_DOT */,
        handler: (accessor, args) => {
            const markersView = accessor.get(views_1.IViewsService).getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
            const focusedElement = markersView.getFocusElement();
            if (focusedElement instanceof markersModel_1.Marker) {
                markersView.showQuickFixes(focusedElement);
            }
        }
    });
    // configuration
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'problems',
        'order': 101,
        'title': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_TITLE,
        'type': 'object',
        'properties': {
            'problems.autoReveal': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_AUTO_REVEAL,
                'type': 'boolean',
                'default': true
            },
            'problems.showCurrentInStatus': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_SHOW_CURRENT_STATUS,
                'type': 'boolean',
                'default': false
            }
        }
    });
    let ToggleMarkersPanelAction = class ToggleMarkersPanelAction extends layoutActions_1.ToggleViewAction {
        constructor(id, label, viewsService, viewDescriptorService, contextKeyService, layoutService) {
            super(id, label, constants_1.default.MARKERS_VIEW_ID, viewsService, viewDescriptorService, contextKeyService, layoutService);
        }
    };
    ToggleMarkersPanelAction.ID = 'workbench.actions.view.problems';
    ToggleMarkersPanelAction.LABEL = messages_1.default.MARKERS_PANEL_TOGGLE_LABEL;
    ToggleMarkersPanelAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, layoutService_1.IWorkbenchLayoutService)
    ], ToggleMarkersPanelAction);
    // markers view container
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: constants_1.default.MARKERS_CONTAINER_ID,
        name: messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS,
        icon: codicons_1.Codicon.warning.classNames,
        hideIfEmpty: true,
        order: 0,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [constants_1.default.MARKERS_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        storageId: constants_1.default.MARKERS_VIEW_STORAGE_ID,
        focusCommand: {
            id: ToggleMarkersPanelAction.ID, keybindings: {
                primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 43 /* KEY_M */
            }
        }
    }, views_1.ViewContainerLocation.Panel);
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: constants_1.default.MARKERS_VIEW_ID,
            containerIcon: codicons_1.Codicon.warning.classNames,
            name: messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS,
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(markersView_1.MarkersView),
        }], VIEW_CONTAINER);
    // workbench
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(markers_1.ActivityUpdater, 3 /* Restored */);
    // actions
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleMarkersPanelAction, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 43 /* KEY_M */
    }), 'View: Toggle Problems (Errors, Warnings, Infos)', messages_1.default.MARKERS_PANEL_VIEW_CATEGORY);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(markersViewActions_1.ShowProblemsPanelAction), 'View: Focus Problems (Errors, Warnings, Infos)', messages_1.default.MARKERS_PANEL_VIEW_CATEGORY);
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.MARKER_COPY_ACTION_ID,
                title: { value: nls_1.localize('copyMarker', "Copy"), original: 'Copy' },
                menu: {
                    id: actions_2.MenuId.ProblemsPanelContext,
                    when: constants_1.default.MarkerFocusContextKey,
                    group: 'navigation'
                },
                keybinding: {
                    weight: 200 /* WorkbenchContrib */,
                    primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                    when: constants_1.default.MarkerFocusContextKey
                },
            });
        }
        async run(accessor) {
            await copyMarker(accessor.get(views_1.IViewsService), accessor.get(clipboardService_1.IClipboardService));
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.MARKER_COPY_MESSAGE_ACTION_ID,
                title: { value: nls_1.localize('copyMessage', "Copy Message"), original: 'Copy Message' },
                menu: {
                    id: actions_2.MenuId.ProblemsPanelContext,
                    when: constants_1.default.MarkerFocusContextKey,
                    group: 'navigation'
                },
            });
        }
        async run(accessor) {
            await copyMessage(accessor.get(views_1.IViewsService), accessor.get(clipboardService_1.IClipboardService));
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID,
                title: { value: nls_1.localize('copyMessage', "Copy Message"), original: 'Copy Message' },
                menu: {
                    id: actions_2.MenuId.ProblemsPanelContext,
                    when: constants_1.default.RelatedInformationFocusContextKey,
                    group: 'navigation'
                }
            });
        }
        async run(accessor) {
            await copyRelatedInformationMessage(accessor.get(views_1.IViewsService), accessor.get(clipboardService_1.IClipboardService));
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.FOCUS_PROBLEMS_FROM_FILTER,
                title: nls_1.localize('focusProblemsList', "Focus problems view"),
                keybinding: {
                    when: constants_1.default.MarkerViewFilterFocusContextKey,
                    weight: 200 /* WorkbenchContrib */,
                    primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */
                }
            });
        }
        run(accessor) {
            focusProblemsView(accessor.get(views_1.IViewsService));
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.MARKERS_VIEW_FOCUS_FILTER,
                title: nls_1.localize('focusProblemsFilter', "Focus problems filter"),
                keybinding: {
                    when: views_1.FocusedViewContext.isEqualTo(constants_1.default.MARKERS_VIEW_ID),
                    weight: 200 /* WorkbenchContrib */,
                    primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */
                }
            });
        }
        run(accessor) {
            focusProblemsFilter(accessor.get(views_1.IViewsService));
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.MARKERS_VIEW_SHOW_MULTILINE_MESSAGE,
                title: { value: nls_1.localize('show multiline', "Show message in multiple lines"), original: 'Problems: Show message in multiple lines' },
                category: nls_1.localize('problems', "Problems"),
                menu: {
                    id: actions_2.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.has(views_1.getVisbileViewContextKey(constants_1.default.MARKERS_VIEW_ID))
                }
            });
        }
        run(accessor) {
            const markersView = accessor.get(views_1.IViewsService).getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
            if (markersView) {
                markersView.markersViewModel.multiline = true;
            }
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.MARKERS_VIEW_SHOW_SINGLELINE_MESSAGE,
                title: { value: nls_1.localize('show singleline', "Show message in single line"), original: 'Problems: Show message in single line' },
                category: nls_1.localize('problems', "Problems"),
                menu: {
                    id: actions_2.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.has(views_1.getVisbileViewContextKey(constants_1.default.MARKERS_VIEW_ID))
                }
            });
        }
        run(accessor) {
            const markersView = accessor.get(views_1.IViewsService).getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
            if (markersView) {
                markersView.markersViewModel.multiline = false;
            }
        }
    });
    actions_2.registerAction2(class extends actions_2.Action2 {
        constructor() {
            super({
                id: constants_1.default.MARKERS_VIEW_CLEAR_FILTER_TEXT,
                title: nls_1.localize('clearFiltersText', "Clear filters text"),
                category: nls_1.localize('problems', "Problems"),
                keybinding: {
                    when: constants_1.default.MarkerViewFilterFocusContextKey,
                    weight: 200 /* WorkbenchContrib */,
                }
            });
        }
        run(accessor) {
            const markersView = accessor.get(views_1.IViewsService).getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
            if (markersView) {
                markersView.clearFilterText();
            }
        }
    });
    async function copyMarker(viewsService, clipboardService) {
        const markersView = viewsService.getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
        if (markersView) {
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.Marker) {
                await clipboardService.writeText(`${element}`);
            }
        }
    }
    async function copyMessage(viewsService, clipboardService) {
        const markersView = viewsService.getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
        if (markersView) {
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.Marker) {
                await clipboardService.writeText(element.marker.message);
            }
        }
    }
    async function copyRelatedInformationMessage(viewsService, clipboardService) {
        const markersView = viewsService.getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
        if (markersView) {
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.RelatedInformation) {
                await clipboardService.writeText(element.raw.message);
            }
        }
    }
    function focusProblemsView(viewsService) {
        const markersView = viewsService.getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
        if (markersView) {
            markersView.focus();
        }
    }
    function focusProblemsFilter(viewsService) {
        const markersView = viewsService.getActiveViewWithId(constants_1.default.MARKERS_VIEW_ID);
        if (markersView) {
            markersView.focusFilter();
        }
    }
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '4_panels',
        command: {
            id: ToggleMarkersPanelAction.ID,
            title: nls_1.localize({ key: 'miMarker', comment: ['&& denotes a mnemonic'] }, "&&Problems")
        },
        order: 4
    });
    commands_1.CommandsRegistry.registerCommand(constants_1.default.TOGGLE_MARKERS_VIEW_ACTION_ID, async (accessor) => {
        const viewsService = accessor.get(views_1.IViewsService);
        if (viewsService.isViewVisible(constants_1.default.MARKERS_VIEW_ID)) {
            viewsService.closeView(constants_1.default.MARKERS_VIEW_ID);
        }
        else {
            viewsService.openView(constants_1.default.MARKERS_VIEW_ID, true);
        }
    });
    let MarkersStatusBarContributions = class MarkersStatusBarContributions extends lifecycle_1.Disposable {
        constructor(markerService, statusbarService) {
            super();
            this.markerService = markerService;
            this.statusbarService = statusbarService;
            this.markersStatusItem = this._register(this.statusbarService.addEntry(this.getMarkersItem(), 'status.problems', nls_1.localize('status.problems', "Problems"), 0 /* LEFT */, 50 /* Medium Priority */));
            this.markerService.onMarkerChanged(() => this.markersStatusItem.update(this.getMarkersItem()));
        }
        getMarkersItem() {
            const markersStatistics = this.markerService.getStatistics();
            const tooltip = this.getMarkersTooltip(markersStatistics);
            return {
                text: this.getMarkersText(markersStatistics),
                ariaLabel: tooltip,
                tooltip,
                command: 'workbench.actions.view.toggleProblems'
            };
        }
        getMarkersTooltip(stats) {
            const errorTitle = (n) => nls_1.localize('totalErrors', "{0} Errors", n);
            const warningTitle = (n) => nls_1.localize('totalWarnings', "{0} Warnings", n);
            const infoTitle = (n) => nls_1.localize('totalInfos', "{0} Infos", n);
            const titles = [];
            if (stats.errors > 0) {
                titles.push(errorTitle(stats.errors));
            }
            if (stats.warnings > 0) {
                titles.push(warningTitle(stats.warnings));
            }
            if (stats.infos > 0) {
                titles.push(infoTitle(stats.infos));
            }
            if (titles.length === 0) {
                return nls_1.localize('noProblems', "No Problems");
            }
            return titles.join(', ');
        }
        getMarkersText(stats) {
            const problemsText = [];
            // Errors
            problemsText.push('$(error) ' + this.packNumber(stats.errors));
            // Warnings
            problemsText.push('$(warning) ' + this.packNumber(stats.warnings));
            // Info (only if any)
            if (stats.infos > 0) {
                problemsText.push('$(info) ' + this.packNumber(stats.infos));
            }
            return problemsText.join(' ');
        }
        packNumber(n) {
            const manyProblems = nls_1.localize('manyProblems', "10K+");
            return n > 9999 ? manyProblems : n > 999 ? n.toString().charAt(0) + 'K' : n.toString();
        }
    };
    MarkersStatusBarContributions = __decorate([
        __param(0, markers_2.IMarkerService),
        __param(1, statusbar_1.IStatusbarService)
    ], MarkersStatusBarContributions);
    workbenchRegistry.registerWorkbenchContribution(MarkersStatusBarContributions, 3 /* Restored */);
});
//# __sourceMappingURL=markers.contribution.js.map