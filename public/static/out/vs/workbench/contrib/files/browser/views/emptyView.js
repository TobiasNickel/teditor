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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/browser/dnd", "vs/platform/theme/common/colorRegistry", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry"], function (require, exports, nls, instantiation_1, themeService_1, keybinding_1, contextView_1, workspace_1, configuration_1, viewPaneContainer_1, dnd_1, colorRegistry_1, label_1, contextkey_1, views_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyView = void 0;
    let EmptyView = class EmptyView extends viewPaneContainer_1.ViewPane {
        constructor(options, themeService, viewDescriptorService, instantiationService, keybindingService, contextMenuService, contextService, configurationService, labelService, contextKeyService, openerService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.contextService = contextService;
            this.labelService = labelService;
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.refreshTitle()));
            this._register(this.labelService.onDidChangeFormatters(() => this.refreshTitle()));
        }
        shouldShowWelcome() {
            return true;
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(new dnd_1.DragAndDropObserver(container, {
                onDrop: e => {
                    container.style.backgroundColor = '';
                    const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: true });
                    dropHandler.handleDrop(e, () => undefined, () => undefined);
                },
                onDragEnter: () => {
                    const color = this.themeService.getColorTheme().getColor(colorRegistry_1.listDropBackground);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragEnd: () => {
                    container.style.backgroundColor = '';
                },
                onDragLeave: () => {
                    container.style.backgroundColor = '';
                },
                onDragOver: e => {
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                }
            }));
            this.refreshTitle();
        }
        refreshTitle() {
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                this.updateTitle(EmptyView.NAME);
            }
            else {
                this.updateTitle(this.title);
            }
        }
    };
    EmptyView.ID = 'workbench.explorer.emptyView';
    EmptyView.NAME = nls.localize('noWorkspace', "No Folder Opened");
    EmptyView = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, label_1.ILabelService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, opener_1.IOpenerService),
        __param(11, telemetry_1.ITelemetryService)
    ], EmptyView);
    exports.EmptyView = EmptyView;
});
//# __sourceMappingURL=emptyView.js.map