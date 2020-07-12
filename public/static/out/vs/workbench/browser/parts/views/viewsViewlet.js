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
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextview/browser/contextView", "vs/workbench/common/views", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, extensions_1, contextView_1, views_1, telemetry_1, themeService_1, instantiation_1, storage_1, workspace_1, viewPaneContainer_1, configuration_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterViewPaneContainer = void 0;
    let FilterViewPaneContainer = class FilterViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(viewletId, onDidChangeFilterValue, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, viewDescriptorService) {
            super(viewletId, { mergeViewWithContainerWhenSingleView: false }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.constantViewDescriptors = new Map();
            this.allViews = new Map();
            this._register(onDidChangeFilterValue(newFilterValue => {
                this.filterValue = newFilterValue;
                this.onFilterChanged(newFilterValue);
            }));
            this._register(this.viewContainerModel.onDidChangeActiveViewDescriptors(() => {
                this.updateAllViews(this.viewContainerModel.activeViewDescriptors);
            }));
        }
        updateAllViews(viewDescriptors) {
            viewDescriptors.forEach(descriptor => {
                let filterOnValue = this.getFilterOn(descriptor);
                if (!filterOnValue) {
                    return;
                }
                if (!this.allViews.has(filterOnValue)) {
                    this.allViews.set(filterOnValue, new Map());
                }
                this.allViews.get(filterOnValue).set(descriptor.id, descriptor);
                if (this.filterValue && !this.filterValue.includes(filterOnValue)) {
                    this.viewContainerModel.setVisible(descriptor.id, false);
                }
            });
        }
        addConstantViewDescriptors(constantViewDescriptors) {
            constantViewDescriptors.forEach(viewDescriptor => this.constantViewDescriptors.set(viewDescriptor.id, viewDescriptor));
        }
        onFilterChanged(newFilterValue) {
            if (this.allViews.size === 0) {
                this.updateAllViews(this.viewContainerModel.activeViewDescriptors);
            }
            this.getViewsNotForTarget(newFilterValue).forEach(item => this.viewContainerModel.setVisible(item.id, false));
            this.getViewsForTarget(newFilterValue).forEach(item => this.viewContainerModel.setVisible(item.id, true));
        }
        getContextMenuActions() {
            const result = Array.from(this.constantViewDescriptors.values()).map(viewDescriptor => ({
                id: `${viewDescriptor.id}.toggleVisibility`,
                label: viewDescriptor.name,
                checked: this.viewContainerModel.isVisible(viewDescriptor.id),
                enabled: viewDescriptor.canToggleVisibility,
                run: () => this.toggleViewVisibility(viewDescriptor.id)
            }));
            return result;
        }
        getViewsForTarget(target) {
            const views = [];
            for (let i = 0; i < target.length; i++) {
                if (this.allViews.has(target[i])) {
                    views.push(...Array.from(this.allViews.get(target[i]).values()));
                }
            }
            return views;
        }
        getViewsNotForTarget(target) {
            const iterable = this.allViews.keys();
            let key = iterable.next();
            let views = [];
            while (!key.done) {
                let isForTarget = false;
                target.forEach(value => {
                    if (key.value === value) {
                        isForTarget = true;
                    }
                });
                if (!isForTarget) {
                    views = views.concat(this.getViewsForTarget([key.value]));
                }
                key = iterable.next();
            }
            return views;
        }
        onDidAddViewDescriptors(added) {
            const panes = super.onDidAddViewDescriptors(added);
            for (let i = 0; i < added.length; i++) {
                if (this.constantViewDescriptors.has(added[i].viewDescriptor.id)) {
                    panes[i].setExpanded(false);
                }
            }
            // Check that allViews is ready
            if (this.allViews.size === 0) {
                this.updateAllViews(this.viewContainerModel.activeViewDescriptors);
            }
            return panes;
        }
    };
    FilterViewPaneContainer = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, storage_1.IStorageService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, views_1.IViewDescriptorService)
    ], FilterViewPaneContainer);
    exports.FilterViewPaneContainer = FilterViewPaneContainer;
});
//# __sourceMappingURL=viewsViewlet.js.map