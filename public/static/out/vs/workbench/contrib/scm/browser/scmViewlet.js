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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/scm/common/scm", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "./menus", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/workbench/contrib/scm/browser/repositoryPane", "vs/workbench/contrib/scm/browser/mainPane", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/decorators", "vs/platform/instantiation/common/descriptors", "vs/platform/opener/common/opener", "vs/base/browser/dom", "vs/base/common/codicons", "vs/css!./media/scmViewlet"], function (require, exports, nls_1, event_1, telemetry_1, scm_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, menuEntryActionViewItem_1, menus_1, themeService_1, storage_1, configuration_1, notification_1, layoutService_1, extensions_1, workspace_1, views_1, platform_1, repositoryPane_1, mainPane_1, viewPaneContainer_1, decorators_1, descriptors_1, opener_1, dom_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMViewPaneContainer = exports.EmptyPaneDescriptor = exports.EmptyPane = void 0;
    let EmptyPane = class EmptyPane extends viewPaneContainer_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
        }
        shouldShowWelcome() {
            return true;
        }
    };
    EmptyPane.ID = 'workbench.scm';
    EmptyPane.TITLE = nls_1.localize('scm', "Source Control");
    EmptyPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService)
    ], EmptyPane);
    exports.EmptyPane = EmptyPane;
    class EmptyPaneDescriptor {
        constructor() {
            this.id = EmptyPane.ID;
            this.name = EmptyPane.TITLE;
            this.containerIcon = codicons_1.Codicon.sourceControl.classNames;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(EmptyPane);
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.order = -1000;
            this.workspace = true;
            this.when = contextkey_1.ContextKeyExpr.equals('scm.providerCount', 0);
        }
    }
    exports.EmptyPaneDescriptor = EmptyPaneDescriptor;
    let SCMViewPaneContainer = class SCMViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, scmService, instantiationService, contextViewService, keybindingService, notificationService, contextMenuService, themeService, commandService, storageService, configurationService, extensionService, contextService, contextKeyService, viewDescriptorService) {
            super(scm_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.scmService = scmService;
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this.themeService = themeService;
            this.commandService = commandService;
            this.contextService = contextService;
            this._repositories = [];
            this.viewDescriptors = [];
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
            this._height = undefined;
            this.menus = instantiationService.createInstance(menus_1.SCMMenus, undefined);
            this._register(this.menus.onDidChangeTitle(this.updateTitleArea, this));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViewWelcomeContent(EmptyPane.ID, {
                content: nls_1.localize('no open repo', "No source control providers registered."),
                when: 'default'
            });
            viewsRegistry.registerViews([new EmptyPaneDescriptor()], this.viewContainer);
            viewsRegistry.registerViews([new mainPane_1.MainPaneDescriptor(this)], this.viewContainer);
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.alwaysShowProviders') && configurationService.getValue('scm.alwaysShowProviders')) {
                    this.viewContainerModel.setVisible(mainPane_1.MainPane.ID, true);
                }
            }));
            this.repositoryCountKey = contextKeyService.createKey('scm.providerCount', 0);
            this._register(this.viewContainerModel.onDidAddVisibleViewDescriptors(this.onDidShowView, this));
            this._register(this.viewContainerModel.onDidRemoveVisibleViewDescriptors(this.onDidHideView, this));
        }
        get height() { return this._height; }
        get repositories() {
            return this._repositories;
        }
        get visibleRepositories() {
            return this.panes.filter(pane => pane instanceof repositoryPane_1.RepositoryPane)
                .map(pane => pane.repository);
        }
        get onDidChangeVisibleRepositories() {
            const modificationEvent = event_1.Event.debounce(event_1.Event.any(this.viewContainerModel.onDidAddVisibleViewDescriptors, this.viewContainerModel.onDidRemoveVisibleViewDescriptors), () => null, 0);
            return event_1.Event.map(modificationEvent, () => this.visibleRepositories);
        }
        create(parent) {
            super.create(parent);
            dom_1.addClass(parent, 'scm-viewlet');
            this._register(this.scmService.onDidAddRepository(this.onDidAddRepository, this));
            this._register(this.scmService.onDidRemoveRepository(this.onDidRemoveRepository, this));
            this.scmService.repositories.forEach(r => this.onDidAddRepository(r));
        }
        onDidAddRepository(repository) {
            const index = this._repositories.length;
            this._repositories.push(repository);
            const viewDescriptor = new repositoryPane_1.RepositoryViewDescriptor(repository, false);
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([viewDescriptor], this.viewContainer);
            this.viewDescriptors.push(viewDescriptor);
            this._onDidSplice.fire({ index, deleteCount: 0, elements: [repository] });
            this.updateTitleArea();
            this.onDidChangeRepositories();
        }
        onDidRemoveRepository(repository) {
            const index = this._repositories.indexOf(repository);
            if (index === -1) {
                return;
            }
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).deregisterViews([this.viewDescriptors[index]], this.viewContainer);
            this._repositories.splice(index, 1);
            this.viewDescriptors.splice(index, 1);
            this._onDidSplice.fire({ index, deleteCount: 1, elements: [] });
            this.updateTitleArea();
            this.onDidChangeRepositories();
        }
        onDidChangeRepositories() {
            this.repositoryCountKey.set(this.repositories.length);
        }
        onDidShowView(e) {
            for (const ref of e) {
                if (ref.viewDescriptor instanceof repositoryPane_1.RepositoryViewDescriptor) {
                    ref.viewDescriptor.repository.setSelected(true);
                }
            }
        }
        onDidHideView(e) {
            for (const ref of e) {
                if (ref.viewDescriptor instanceof repositoryPane_1.RepositoryViewDescriptor) {
                    ref.viewDescriptor.repository.setSelected(false);
                }
            }
            this.afterOnDidHideView();
        }
        afterOnDidHideView() {
            if (this.repositoryCountKey.get() > 0 && this.viewDescriptors.every(d => !this.viewContainerModel.isVisible(d.id))) {
                this.viewContainerModel.setVisible(this.viewDescriptors[0].id, true);
            }
        }
        focus() {
            const repository = this.visibleRepositories[0];
            if (repository) {
                const pane = this.panes
                    .filter(pane => pane instanceof repositoryPane_1.RepositoryPane && pane.repository === repository)[0];
                if (pane) {
                    pane.focus();
                }
                else {
                    super.focus();
                }
            }
            else {
                super.focus();
            }
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            const title = nls_1.localize('source control', "Source Control");
            if (this.visibleRepositories.length === 1) {
                const [repository] = this.repositories;
                return nls_1.localize('viewletTitle', "{0}: {1}", title, repository.provider.label);
            }
            else {
                return title;
            }
        }
        getActionViewItem(action) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return undefined;
            }
            return new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
        }
        getActions() {
            if (this.repositories.length > 0) {
                return super.getActions();
            }
            return this.menus.getTitleActions();
        }
        getSecondaryActions() {
            if (this.repositories.length > 0) {
                return super.getSecondaryActions();
            }
            return this.menus.getTitleSecondaryActions();
        }
        getActionsContext() {
            if (this.visibleRepositories.length === 1) {
                return this.repositories[0].provider;
            }
        }
        setVisibleRepositories(repositories) {
            const visibleViewDescriptors = this.viewContainerModel.visibleViewDescriptors;
            const toSetVisible = this.viewContainerModel.activeViewDescriptors
                .filter((d) => d instanceof repositoryPane_1.RepositoryViewDescriptor && repositories.indexOf(d.repository) > -1 && visibleViewDescriptors.indexOf(d) === -1);
            const toSetInvisible = visibleViewDescriptors
                .filter((d) => d instanceof repositoryPane_1.RepositoryViewDescriptor && repositories.indexOf(d.repository) === -1);
            let size;
            const oneToOne = toSetVisible.length === 1 && toSetInvisible.length === 1;
            for (const viewDescriptor of toSetInvisible) {
                if (oneToOne) {
                    const pane = this.panes.filter(pane => pane.id === viewDescriptor.id)[0];
                    if (pane) {
                        size = this.getPaneSize(pane);
                    }
                }
                this.viewContainerModel.setVisible(viewDescriptor.id, false);
            }
            for (const viewDescriptor of toSetVisible) {
                this.viewContainerModel.setVisible(viewDescriptor.id, true, size);
            }
        }
    };
    __decorate([
        decorators_1.debounce(0)
    ], SCMViewPaneContainer.prototype, "afterOnDidHideView", null);
    SCMViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, scm_1.ISCMService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, themeService_1.IThemeService),
        __param(9, commands_1.ICommandService),
        __param(10, storage_1.IStorageService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, extensions_1.IExtensionService),
        __param(13, workspace_1.IWorkspaceContextService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, views_1.IViewDescriptorService)
    ], SCMViewPaneContainer);
    exports.SCMViewPaneContainer = SCMViewPaneContainer;
});
//# __sourceMappingURL=scmViewlet.js.map