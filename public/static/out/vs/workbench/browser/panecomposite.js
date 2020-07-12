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
define(["require", "exports", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/composite", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewMenuActions", "vs/platform/actions/common/actions", "vs/base/browser/ui/actionbar/actionbar"], function (require, exports, contextView_1, telemetry_1, themeService_1, storage_1, instantiation_1, extensions_1, composite_1, workspace_1, viewMenuActions_1, actions_1, actionbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneComposite = void 0;
    let PaneComposite = class PaneComposite extends composite_1.Composite {
        constructor(id, viewPaneContainer, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService) {
            super(id, telemetryService, themeService, storageService);
            this.viewPaneContainer = viewPaneContainer;
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.extensionService = extensionService;
            this.contextService = contextService;
            this.menuActions = this._register(this.instantiationService.createInstance(viewMenuActions_1.ViewContainerMenuActions, this.getId(), actions_1.MenuId.ViewContainerTitleContext));
            this._register(this.viewPaneContainer.onTitleAreaUpdate(() => this.updateTitleArea()));
        }
        create(parent) {
            this.viewPaneContainer.create(parent);
        }
        setVisible(visible) {
            super.setVisible(visible);
            this.viewPaneContainer.setVisible(visible);
        }
        layout(dimension) {
            this.viewPaneContainer.layout(dimension);
        }
        getOptimalWidth() {
            return this.viewPaneContainer.getOptimalWidth();
        }
        openView(id, focus) {
            return this.viewPaneContainer.openView(id, focus);
        }
        getViewPaneContainer() {
            return this.viewPaneContainer;
        }
        getContextMenuActions() {
            const result = [];
            result.push(...this.menuActions.getContextMenuActions());
            if (result.length) {
                result.push(new actionbar_1.Separator());
            }
            result.push(...this.viewPaneContainer.getContextMenuActions());
            return result;
        }
        getActions() {
            return this.viewPaneContainer.getActions();
        }
        getSecondaryActions() {
            return this.viewPaneContainer.getSecondaryActions();
        }
        getActionViewItem(action) {
            return this.viewPaneContainer.getActionViewItem(action);
        }
        getTitle() {
            return this.viewPaneContainer.getTitle();
        }
        saveState() {
            super.saveState();
        }
        focus() {
            this.viewPaneContainer.focus();
        }
    };
    PaneComposite = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, storage_1.IStorageService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, extensions_1.IExtensionService),
        __param(8, workspace_1.IWorkspaceContextService)
    ], PaneComposite);
    exports.PaneComposite = PaneComposite;
});
//# __sourceMappingURL=panecomposite.js.map