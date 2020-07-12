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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/common/views", "vs/workbench/contrib/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/panel/common/panelService", "vs/platform/contextkey/common/contextkey", "vs/base/common/filters", "vs/base/common/strings", "vs/base/common/types", "vs/platform/keybinding/common/keybinding", "vs/base/common/actions"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, viewlet_1, views_1, output_1, terminal_1, panelService_1, contextkey_1, filters_1, strings_1, types_1, keybinding_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessViewPickerAction = exports.OpenViewPickerAction = exports.ViewQuickAccessProvider = void 0;
    let ViewQuickAccessProvider = class ViewQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(viewletService, viewDescriptorService, viewsService, outputService, terminalService, panelService, contextKeyService) {
            super(ViewQuickAccessProvider.PREFIX, {
                noResultsPick: {
                    label: nls_1.localize('noViewResults', "No matching views"),
                    containerLabel: ''
                }
            });
            this.viewletService = viewletService;
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.outputService = outputService;
            this.terminalService = terminalService;
            this.panelService = panelService;
            this.contextKeyService = contextKeyService;
        }
        getPicks(filter) {
            const filteredViewEntries = this.doGetViewPickItems().filter(entry => {
                if (!filter) {
                    return true;
                }
                // Match fuzzy on label
                entry.highlights = { label: types_1.withNullAsUndefined(filters_1.matchesFuzzy(filter, entry.label, true)) };
                // Return if we have a match on label or container
                return entry.highlights.label || strings_1.fuzzyContains(entry.containerLabel, filter);
            });
            // Map entries to container labels
            const mapEntryToContainer = new Map();
            for (const entry of filteredViewEntries) {
                if (!mapEntryToContainer.has(entry.label)) {
                    mapEntryToContainer.set(entry.label, entry.containerLabel);
                }
            }
            // Add separators for containers
            const filteredViewEntriesWithSeparators = [];
            let lastContainer = undefined;
            for (const entry of filteredViewEntries) {
                if (lastContainer !== entry.containerLabel) {
                    lastContainer = entry.containerLabel;
                    // When the entry container has a parent container, set container
                    // label as Parent / Child. For example, `Views / Explorer`.
                    let separatorLabel;
                    if (mapEntryToContainer.has(lastContainer)) {
                        separatorLabel = `${mapEntryToContainer.get(lastContainer)} / ${lastContainer}`;
                    }
                    else {
                        separatorLabel = lastContainer;
                    }
                    filteredViewEntriesWithSeparators.push({ type: 'separator', label: separatorLabel });
                }
                filteredViewEntriesWithSeparators.push(entry);
            }
            return filteredViewEntriesWithSeparators;
        }
        doGetViewPickItems() {
            const viewEntries = [];
            const getViewEntriesForViewlet = (viewlet, viewContainer) => {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                const result = [];
                for (const view of viewContainerModel.allViewDescriptors) {
                    if (this.contextKeyService.contextMatchesRules(view.when)) {
                        result.push({
                            label: view.name,
                            containerLabel: viewlet.name,
                            accept: () => this.viewsService.openView(view.id, true)
                        });
                    }
                }
                return result;
            };
            // Viewlets
            const viewlets = this.viewletService.getViewlets();
            for (const viewlet of viewlets) {
                if (this.includeViewContainer(viewlet)) {
                    viewEntries.push({
                        label: viewlet.name,
                        containerLabel: nls_1.localize('views', "Side Bar"),
                        accept: () => this.viewletService.openViewlet(viewlet.id, true)
                    });
                }
            }
            // Panels
            const panels = this.panelService.getPanels();
            for (const panel of panels) {
                if (this.includeViewContainer(panel)) {
                    viewEntries.push({
                        label: panel.name,
                        containerLabel: nls_1.localize('panels', "Panel"),
                        accept: () => this.panelService.openPanel(panel.id, true)
                    });
                }
            }
            // Viewlet Views
            for (const viewlet of viewlets) {
                const viewContainer = this.viewDescriptorService.getViewContainerById(viewlet.id);
                if (viewContainer) {
                    viewEntries.push(...getViewEntriesForViewlet(viewlet, viewContainer));
                }
            }
            // Terminals
            this.terminalService.terminalTabs.forEach((tab, tabIndex) => {
                tab.terminalInstances.forEach((terminal, terminalIndex) => {
                    const label = nls_1.localize('terminalTitle', "{0}: {1}", `${tabIndex + 1}.${terminalIndex + 1}`, terminal.title);
                    viewEntries.push({
                        label,
                        containerLabel: nls_1.localize('terminals', "Terminal"),
                        accept: async () => {
                            await this.terminalService.showPanel(true);
                            this.terminalService.setActiveInstance(terminal);
                        }
                    });
                });
            });
            // Output Channels
            const channels = this.outputService.getChannelDescriptors();
            for (const channel of channels) {
                const label = channel.log ? nls_1.localize('logChannel', "Log ({0})", channel.label) : channel.label;
                viewEntries.push({
                    label,
                    containerLabel: nls_1.localize('channels', "Output"),
                    accept: () => this.outputService.showChannel(channel.id)
                });
            }
            return viewEntries;
        }
        includeViewContainer(container) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(container.id);
            if (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.hideIfEmpty) {
                return this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.length > 0;
            }
            return true;
        }
    };
    ViewQuickAccessProvider.PREFIX = 'view ';
    ViewQuickAccessProvider = __decorate([
        __param(0, viewlet_1.IViewletService),
        __param(1, views_1.IViewDescriptorService),
        __param(2, views_1.IViewsService),
        __param(3, output_1.IOutputService),
        __param(4, terminal_1.ITerminalService),
        __param(5, panelService_1.IPanelService),
        __param(6, contextkey_1.IContextKeyService)
    ], ViewQuickAccessProvider);
    exports.ViewQuickAccessProvider = ViewQuickAccessProvider;
    //#region Actions
    let OpenViewPickerAction = class OpenViewPickerAction extends actions_1.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(ViewQuickAccessProvider.PREFIX);
        }
    };
    OpenViewPickerAction.ID = 'workbench.action.openView';
    OpenViewPickerAction.LABEL = nls_1.localize('openView', "Open View");
    OpenViewPickerAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], OpenViewPickerAction);
    exports.OpenViewPickerAction = OpenViewPickerAction;
    let QuickAccessViewPickerAction = class QuickAccessViewPickerAction extends actions_1.Action {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
        }
        async run() {
            const keys = this.keybindingService.lookupKeybindings(this.id);
            this.quickInputService.quickAccess.show(ViewQuickAccessProvider.PREFIX, { quickNavigateConfiguration: { keybindings: keys }, itemActivation: quickInput_1.ItemActivation.FIRST });
        }
    };
    QuickAccessViewPickerAction.ID = 'workbench.action.quickOpenView';
    QuickAccessViewPickerAction.LABEL = nls_1.localize('quickOpenView', "Quick Open View");
    QuickAccessViewPickerAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessViewPickerAction);
    exports.QuickAccessViewPickerAction = QuickAccessViewPickerAction;
});
//#endregion
//# __sourceMappingURL=viewQuickAccess.js.map