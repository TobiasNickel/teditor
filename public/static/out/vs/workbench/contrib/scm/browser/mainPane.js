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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/browser/dom", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/base/common/codicons", "vs/base/common/strings", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/workbench/common/theme", "vs/platform/instantiation/common/descriptors", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/css!./media/scmViewlet"], function (require, exports, nls_1, event_1, resources_1, lifecycle_1, viewPaneContainer_1, dom_1, countBadge_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, actions_2, menuEntryActionViewItem_1, actionbar_1, themeService_1, styler_1, codicons_1, strings_1, listService_1, configuration_1, views_1, theme_1, descriptors_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainPaneDescriptor = exports.MainPane = void 0;
    class ProvidersListDelegate {
        getHeight() {
            return 22;
        }
        getTemplateId() {
            return 'provider';
        }
    }
    class StatusBarAction extends actions_2.Action {
        constructor(command, commandService) {
            super(`statusbaraction{${command.id}}`, command.title, '', true);
            this.command = command;
            this.commandService = commandService;
            this.tooltip = command.tooltip || '';
        }
        run() {
            return this.commandService.executeCommand(this.command.id, ...(this.command.arguments || []));
        }
    }
    class StatusBarActionViewItem extends actionbar_1.ActionViewItem {
        constructor(action) {
            super(null, action, {});
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.innerHTML = codicons_1.renderCodicons(strings_1.escape(this.getAction().label));
            }
        }
    }
    let ProviderRenderer = class ProviderRenderer {
        constructor(commandService, themeService) {
            this.commandService = commandService;
            this.themeService = themeService;
            this.templateId = 'provider';
            this._onDidRenderElement = new event_1.Emitter();
            this.onDidRenderElement = this._onDidRenderElement.event;
        }
        renderTemplate(container) {
            const provider = dom_1.append(container, dom_1.$('.scm-provider'));
            const name = dom_1.append(provider, dom_1.$('.name'));
            const title = dom_1.append(name, dom_1.$('span.title'));
            const type = dom_1.append(name, dom_1.$('span.type'));
            const countContainer = dom_1.append(provider, dom_1.$('.count'));
            const count = new countBadge_1.CountBadge(countContainer);
            const badgeStyler = styler_1.attachBadgeStyler(count, this.themeService);
            const actionBar = new actionbar_1.ActionBar(provider, { actionViewItemProvider: a => new StatusBarActionViewItem(a) });
            const disposable = lifecycle_1.Disposable.None;
            const templateDisposable = lifecycle_1.combinedDisposable(actionBar, badgeStyler);
            return { title, type, countContainer, count, actionBar, disposable, templateDisposable };
        }
        renderElement(repository, index, templateData) {
            templateData.disposable.dispose();
            const disposables = new lifecycle_1.DisposableStore();
            if (repository.provider.rootUri) {
                templateData.title.textContent = resources_1.basename(repository.provider.rootUri);
                templateData.type.textContent = repository.provider.label;
            }
            else {
                templateData.title.textContent = repository.provider.label;
                templateData.type.textContent = '';
            }
            const actions = [];
            const disposeActions = () => lifecycle_1.dispose(actions);
            disposables.add({ dispose: disposeActions });
            const update = () => {
                disposeActions();
                const commands = repository.provider.statusBarCommands || [];
                actions.splice(0, actions.length, ...commands.map(c => new StatusBarAction(c, this.commandService)));
                templateData.actionBar.clear();
                templateData.actionBar.push(actions);
                const count = repository.provider.count || 0;
                dom_1.toggleClass(templateData.countContainer, 'hidden', count === 0);
                templateData.count.setCount(count);
                this._onDidRenderElement.fire(repository);
            };
            disposables.add(repository.provider.onDidChange(update, null));
            update();
            templateData.disposable = disposables;
        }
        disposeTemplate(templateData) {
            templateData.disposable.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    ProviderRenderer = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, themeService_1.IThemeService)
    ], ProviderRenderer);
    let MainPane = class MainPane extends viewPaneContainer_1.ViewPane {
        constructor(viewModel, options, keybindingService, contextMenuService, instantiationService, viewDescriptorService, contextKeyService, menuService, configurationService, openerService, themeService, telemetryService, commandService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.commandService = commandService;
        }
        renderBody(container) {
            super.renderBody(container);
            const delegate = new ProvidersListDelegate();
            const renderer = this.instantiationService.createInstance(ProviderRenderer);
            const identityProvider = { getId: (r) => r.provider.id };
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, `SCM Main`, container, delegate, [renderer], {
                identityProvider,
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                },
                accessibilityProvider: {
                    getAriaLabel(r) {
                        return r.provider.label;
                    },
                    getWidgetAriaLabel() {
                        return MainPane.TITLE;
                    }
                }
            });
            this._register(renderer.onDidRenderElement(e => this.list.updateWidth(this.viewModel.repositories.indexOf(e)), null));
            this._register(this.list.onDidChangeSelection(this.onListSelectionChange, this));
            this._register(this.list.onDidChangeFocus(this.onListFocusChange, this));
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this._register(this.viewModel.onDidChangeVisibleRepositories(this.updateListSelection, this));
            this._register(this.viewModel.onDidSplice(({ index, deleteCount, elements }) => this.splice(index, deleteCount, elements), null));
            this.splice(0, 0, this.viewModel.repositories);
            this._register(this.list);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.providers.visible')) {
                    this.updateBodySize();
                }
            }));
            this.updateListSelection();
        }
        splice(index, deleteCount, repositories = []) {
            this.list.splice(index, deleteCount, repositories);
            const empty = this.list.length === 0;
            dom_1.toggleClass(this.element, 'empty', empty);
            this.updateBodySize();
        }
        focus() {
            this.list.domFocus();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.list.layout(height, width);
        }
        updateBodySize() {
            const visibleCount = this.configurationService.getValue('scm.providers.visible');
            const empty = this.list.length === 0;
            const size = Math.min(this.viewModel.repositories.length, visibleCount) * 22;
            this.minimumBodySize = visibleCount === 0 ? 22 : size;
            this.maximumBodySize = visibleCount === 0 ? Number.POSITIVE_INFINITY : empty ? Number.POSITIVE_INFINITY : size;
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const repository = e.element;
            const contextKeyService = this.contextKeyService.createScoped();
            const scmProviderKey = contextKeyService.createKey('scmProvider', undefined);
            scmProviderKey.set(repository.provider.contextValue);
            const menu = this.menuService.createMenu(actions_1.MenuId.SCMSourceControl, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            const disposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => g === 'inline');
            menu.dispose();
            contextKeyService.dispose();
            if (repository.provider.rootUri) {
                secondary.push(new actions_2.Action('_openInTerminal', nls_1.localize('open in terminal', "Open In Terminal"), undefined, true, async () => {
                    await this.commandService.executeCommand('openInTerminal', repository.provider.rootUri);
                }));
            }
            if (secondary.length === 0) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => secondary,
                getActionsContext: () => repository.provider
            });
            disposable.dispose();
        }
        onListSelectionChange(e) {
            if (e.browserEvent && e.elements.length > 0) {
                const scrollTop = this.list.scrollTop;
                this.viewModel.setVisibleRepositories(e.elements);
                this.list.scrollTop = scrollTop;
            }
        }
        onListFocusChange(e) {
            if (e.browserEvent && e.elements.length > 0) {
                e.elements[0].focus();
            }
        }
        updateListSelection() {
            const set = new Set();
            for (const repository of this.viewModel.visibleRepositories) {
                set.add(repository);
            }
            const selection = [];
            for (let i = 0; i < this.list.length; i++) {
                if (set.has(this.list.element(i))) {
                    selection.push(i);
                }
            }
            this.list.setSelection(selection);
            if (selection.length > 0) {
                this.list.setFocus([selection[0]]);
            }
        }
    };
    MainPane.ID = 'scm.mainPane';
    MainPane.TITLE = nls_1.localize('scm providers', "Source Control Providers");
    MainPane = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, actions_1.IMenuService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, opener_1.IOpenerService),
        __param(10, themeService_1.IThemeService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, commands_1.ICommandService)
    ], MainPane);
    exports.MainPane = MainPane;
    class MainPaneDescriptor {
        constructor(viewModel) {
            this.id = MainPane.ID;
            this.name = MainPane.TITLE;
            this.containerIcon = codicons_1.Codicon.sourceControl.classNames;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.order = -1000;
            this.workspace = true;
            this.when = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.scm.alwaysShowProviders', true), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('scm.providerCount', 0), contextkey_1.ContextKeyExpr.notEquals('scm.providerCount', 1)));
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(MainPane, [viewModel]);
        }
    }
    exports.MainPaneDescriptor = MainPaneDescriptor;
});
//# __sourceMappingURL=mainPane.js.map