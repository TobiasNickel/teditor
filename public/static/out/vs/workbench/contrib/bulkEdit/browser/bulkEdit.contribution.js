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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/panel/common/panelService", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/bulkEdit/browser/bulkEditPane", "vs/workbench/common/views", "vs/nls", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/bulkEdit/browser/bulkEditPreview", "vs/platform/list/browser/listService", "vs/platform/instantiation/common/descriptors", "vs/platform/actions/common/actions", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/base/common/codicons"], function (require, exports, platform_1, contributions_1, panelService_1, bulkEditService_1, bulkEditPane_1, views_1, nls_1, viewPaneContainer_1, contextkey_1, editorGroupsService_1, diffEditorInput_1, bulkEditPreview_1, listService_1, descriptors_1, actions_1, cancellation_1, dialogs_1, severity_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function getBulkEditPane(viewsService) {
        const view = await viewsService.openView(bulkEditPane_1.BulkEditPane.ID, true);
        if (view instanceof bulkEditPane_1.BulkEditPane) {
            return view;
        }
        return undefined;
    }
    let UXState = class UXState {
        constructor(_panelService, _editorGroupsService) {
            var _a;
            this._panelService = _panelService;
            this._editorGroupsService = _editorGroupsService;
            this._activePanel = (_a = _panelService.getActivePanel()) === null || _a === void 0 ? void 0 : _a.getId();
        }
        async restore() {
            // (1) restore previous panel
            if (typeof this._activePanel === 'string') {
                await this._panelService.openPanel(this._activePanel);
            }
            else {
                this._panelService.hideActivePanel();
            }
            // (2) close preview editors
            for (let group of this._editorGroupsService.groups) {
                let previewEditors = [];
                for (let input of group.editors) {
                    let resource;
                    if (input instanceof diffEditorInput_1.DiffEditorInput) {
                        resource = input.modifiedInput.resource;
                    }
                    else {
                        resource = input.resource;
                    }
                    if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === bulkEditPreview_1.BulkEditPreviewProvider.Schema) {
                        previewEditors.push(input);
                    }
                }
                if (previewEditors.length) {
                    group.closeEditors(previewEditors, { preserveFocus: true });
                }
            }
        }
    };
    UXState = __decorate([
        __param(0, panelService_1.IPanelService),
        __param(1, editorGroupsService_1.IEditorGroupsService)
    ], UXState);
    class PreviewSession {
        constructor(uxState, cts = new cancellation_1.CancellationTokenSource()) {
            this.uxState = uxState;
            this.cts = cts;
        }
    }
    let BulkEditPreviewContribution = class BulkEditPreviewContribution {
        constructor(_panelService, _viewsService, _editorGroupsService, _dialogService, bulkEditService, contextKeyService) {
            this._panelService = _panelService;
            this._viewsService = _viewsService;
            this._editorGroupsService = _editorGroupsService;
            this._dialogService = _dialogService;
            bulkEditService.setPreviewHandler((edit) => this._previewEdit(edit));
            this._ctxEnabled = BulkEditPreviewContribution.ctxEnabled.bindTo(contextKeyService);
        }
        async _previewEdit(edit) {
            var _a, _b;
            this._ctxEnabled.set(true);
            const uxState = (_b = (_a = this._activeSession) === null || _a === void 0 ? void 0 : _a.uxState) !== null && _b !== void 0 ? _b : new UXState(this._panelService, this._editorGroupsService);
            const view = await getBulkEditPane(this._viewsService);
            if (!view) {
                this._ctxEnabled.set(false);
                return edit;
            }
            // check for active preview session and let the user decide
            if (view.hasInput()) {
                const choice = await this._dialogService.show(severity_1.default.Info, nls_1.localize('overlap', "Another refactoring is being previewed."), [nls_1.localize('cancel', "Cancel"), nls_1.localize('continue', "Continue")], { detail: nls_1.localize('detail', "Press 'Continue' to discard the previous refactoring and continue with the current refactoring.") });
                if (choice.choice === 0) {
                    // this refactoring is being cancelled
                    return { edits: [] };
                }
            }
            // session
            let session;
            if (this._activeSession) {
                this._activeSession.cts.dispose(true);
                session = new PreviewSession(uxState);
            }
            else {
                session = new PreviewSession(uxState);
            }
            this._activeSession = session;
            // the actual work...
            try {
                const newEditOrUndefined = await view.setInput(edit, session.cts.token);
                if (!newEditOrUndefined) {
                    return { edits: [] };
                }
                return newEditOrUndefined;
            }
            finally {
                // restore UX state
                if (this._activeSession === session) {
                    await this._activeSession.uxState.restore();
                    this._activeSession.cts.dispose();
                    this._ctxEnabled.set(false);
                    this._activeSession = undefined;
                }
            }
        }
    };
    BulkEditPreviewContribution.ctxEnabled = new contextkey_1.RawContextKey('refactorPreview.enabled', false);
    BulkEditPreviewContribution = __decorate([
        __param(0, panelService_1.IPanelService),
        __param(1, views_1.IViewsService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, dialogs_1.IDialogService),
        __param(4, bulkEditService_1.IBulkEditService),
        __param(5, contextkey_1.IContextKeyService)
    ], BulkEditPreviewContribution);
    // CMD: accept
    actions_1.registerAction2(class ApplyAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.apply',
                title: { value: nls_1.localize('apply', "Apply Refactoring"), original: 'Apply Refactoring' },
                category: nls_1.localize('cat', "Refactor Preview"),
                icon: { id: 'codicon/check' },
                precondition: contextkey_1.ContextKeyExpr.and(BulkEditPreviewContribution.ctxEnabled, bulkEditPane_1.BulkEditPane.ctxHasCheckedChanges),
                menu: [{
                        id: actions_1.MenuId.BulkEditTitle,
                        group: 'navigation'
                    }, {
                        id: actions_1.MenuId.BulkEditContext,
                        order: 1
                    }],
                keybinding: {
                    weight: 100 /* EditorContrib */ - 10,
                    when: contextkey_1.ContextKeyExpr.and(BulkEditPreviewContribution.ctxEnabled, views_1.FocusedViewContext.isEqualTo(bulkEditPane_1.BulkEditPane.ID)),
                    primary: 1024 /* Shift */ + 3 /* Enter */,
                }
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.accept();
            }
        }
    });
    // CMD: discard
    actions_1.registerAction2(class DiscardAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.discard',
                title: { value: nls_1.localize('Discard', "Discard Refactoring"), original: 'Discard Refactoring' },
                category: nls_1.localize('cat', "Refactor Preview"),
                icon: { id: 'codicon/clear-all' },
                precondition: BulkEditPreviewContribution.ctxEnabled,
                menu: [{
                        id: actions_1.MenuId.BulkEditTitle,
                        group: 'navigation'
                    }, {
                        id: actions_1.MenuId.BulkEditContext,
                        order: 2
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.discard();
            }
        }
    });
    // CMD: toggle change
    actions_1.registerAction2(class ToggleAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.toggleCheckedState',
                title: { value: nls_1.localize('toogleSelection', "Toggle Change"), original: 'Toggle Change' },
                category: nls_1.localize('cat', "Refactor Preview"),
                precondition: BulkEditPreviewContribution.ctxEnabled,
                keybinding: {
                    weight: 200 /* WorkbenchContrib */,
                    when: listService_1.WorkbenchListFocusContextKey,
                    primary: 10 /* Space */,
                },
                menu: {
                    id: actions_1.MenuId.BulkEditContext,
                    group: 'navigation'
                }
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.toggleChecked();
            }
        }
    });
    // CMD: toggle category
    actions_1.registerAction2(class GroupByFile extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.groupByFile',
                title: { value: nls_1.localize('groupByFile', "Group Changes By File"), original: 'Group Changes By File' },
                category: nls_1.localize('cat', "Refactor Preview"),
                icon: { id: 'codicon/ungroup-by-ref-type' },
                precondition: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile.negate(), BulkEditPreviewContribution.ctxEnabled),
                menu: [{
                        id: actions_1.MenuId.BulkEditTitle,
                        when: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile.negate()),
                        group: 'navigation',
                        order: 3,
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.groupByFile();
            }
        }
    });
    actions_1.registerAction2(class GroupByType extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.groupByType',
                title: { value: nls_1.localize('groupByType', "Group Changes By Type"), original: 'Group Changes By Type' },
                category: nls_1.localize('cat', "Refactor Preview"),
                icon: { id: 'codicon/group-by-ref-type' },
                precondition: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile, BulkEditPreviewContribution.ctxEnabled),
                menu: [{
                        id: actions_1.MenuId.BulkEditTitle,
                        when: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile),
                        group: 'navigation',
                        order: 3
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.groupByType();
            }
        }
    });
    actions_1.registerAction2(class ToggleGrouping extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.toggleGrouping',
                title: { value: nls_1.localize('groupByType', "Group Changes By Type"), original: 'Group Changes By Type' },
                category: nls_1.localize('cat', "Refactor Preview"),
                icon: { id: 'codicon/list-tree' },
                toggled: bulkEditPane_1.BulkEditPane.ctxGroupByFile.negate(),
                precondition: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, BulkEditPreviewContribution.ctxEnabled),
                menu: [{
                        id: actions_1.MenuId.BulkEditContext,
                        order: 3
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.toggleGrouping();
            }
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BulkEditPreviewContribution, 2 /* Ready */);
    const container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: bulkEditPane_1.BulkEditPane.ID,
        name: nls_1.localize('panel', "Refactor Preview"),
        hideIfEmpty: true,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [bulkEditPane_1.BulkEditPane.ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        icon: codicons_1.Codicon.lightbulb.classNames,
        storageId: bulkEditPane_1.BulkEditPane.ID
    }, views_1.ViewContainerLocation.Panel);
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: bulkEditPane_1.BulkEditPane.ID,
            name: nls_1.localize('panel', "Refactor Preview"),
            when: BulkEditPreviewContribution.ctxEnabled,
            ctorDescriptor: new descriptors_1.SyncDescriptor(bulkEditPane_1.BulkEditPane),
            containerIcon: codicons_1.Codicon.lightbulb.classNames,
            canMoveView: true
        }], container);
});
//# __sourceMappingURL=bulkEdit.contribution.js.map