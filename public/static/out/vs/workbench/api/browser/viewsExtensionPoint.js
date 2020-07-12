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
define(["require", "exports", "vs/nls", "vs/base/common/collections", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/common/views", "vs/workbench/browser/parts/views/treeView", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/scm/common/scm", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/remote/common/remote.contribution", "vs/platform/extensions/common/extensions", "vs/workbench/browser/viewlet", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/base/common/codicons"], function (require, exports, nls_1, collections_1, resources, extensionsRegistry_1, views_1, treeView_1, contextkey_1, arrays_1, contributions_1, platform_1, instantiation_1, files_1, scm_1, debug_1, remote_contribution_1, extensions_1, viewlet_1, layoutService_1, viewlet_2, editorGroupsService_1, actions_1, actions_2, viewPaneContainer_1, descriptors_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.viewsContainersContribution = void 0;
    const viewsContainerSchema = {
        type: 'object',
        properties: {
            id: {
                description: nls_1.localize({ key: 'vscode.extension.contributes.views.containers.id', comment: ['Contribution refers to those that an extension contributes to VS Code through an extension/contribution point. '] }, "Unique id used to identify the container in which views can be contributed using 'views' contribution point"),
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$'
            },
            title: {
                description: nls_1.localize('vscode.extension.contributes.views.containers.title', 'Human readable string used to render the container'),
                type: 'string'
            },
            icon: {
                description: nls_1.localize('vscode.extension.contributes.views.containers.icon', "Path to the container icon. Icons are 24x24 centered on a 50x40 block and have a fill color of 'rgb(215, 218, 224)' or '#d7dae0'. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            }
        },
        required: ['id', 'title', 'icon']
    };
    exports.viewsContainersContribution = {
        description: nls_1.localize('vscode.extension.contributes.viewsContainers', 'Contributes views containers to the editor'),
        type: 'object',
        properties: {
            'activitybar': {
                description: nls_1.localize('views.container.activitybar', "Contribute views containers to Activity Bar"),
                type: 'array',
                items: viewsContainerSchema
            },
            'panel': {
                description: nls_1.localize('views.container.panel', "Contribute views containers to Panel"),
                type: 'array',
                items: viewsContainerSchema
            }
        }
    };
    const viewDescriptor = {
        type: 'object',
        properties: {
            id: {
                description: nls_1.localize('vscode.extension.contributes.view.id', 'Identifier of the view. This should be unique across all views. It is recommended to include your extension id as part of the view id. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: nls_1.localize('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: nls_1.localize('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            icon: {
                description: nls_1.localize('vscode.extension.contributes.view.icon', "Path to the view icon. View icons are displayed when the name of the view cannot be shown. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            },
            contextualTitle: {
                description: nls_1.localize('vscode.extension.contributes.view.contextualTitle', "Human-readable context for when the view is moved out of its original location. By default, the view's container name will be used. Will be shown"),
                type: 'string'
            },
        }
    };
    const remoteViewDescriptor = {
        type: 'object',
        properties: {
            id: {
                description: nls_1.localize('vscode.extension.contributes.view.id', 'Identifier of the view. This should be unique across all views. It is recommended to include your extension id as part of the view id. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: nls_1.localize('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: nls_1.localize('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            group: {
                description: nls_1.localize('vscode.extension.contributes.view.group', 'Nested group in the viewlet'),
                type: 'string'
            },
            remoteName: {
                description: nls_1.localize('vscode.extension.contributes.view.remoteName', 'The name of the remote type associated with this view'),
                type: ['string', 'array'],
                items: {
                    type: 'string'
                }
            }
        }
    };
    const viewsContribution = {
        description: nls_1.localize('vscode.extension.contributes.views', "Contributes views to the editor"),
        type: 'object',
        properties: {
            'explorer': {
                description: nls_1.localize('views.explorer', "Contributes views to Explorer container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'debug': {
                description: nls_1.localize('views.debug', "Contributes views to Debug container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'scm': {
                description: nls_1.localize('views.scm', "Contributes views to SCM container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'test': {
                description: nls_1.localize('views.test', "Contributes views to Test container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'remote': {
                description: nls_1.localize('views.remote', "Contributes views to Remote container in the Activity bar. To contribute to this container, enableProposedApi needs to be turned on"),
                type: 'array',
                items: remoteViewDescriptor,
                default: []
            }
        },
        additionalProperties: {
            description: nls_1.localize('views.contributed', "Contributes views to contributed views container"),
            type: 'array',
            items: viewDescriptor,
            default: []
        }
    };
    const viewsContainersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'viewsContainers',
        jsonSchema: exports.viewsContainersContribution
    });
    const viewsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'views',
        deps: [viewsContainersExtensionPoint],
        jsonSchema: viewsContribution
    });
    const TEST_VIEW_CONTAINER_ORDER = 6;
    let ViewsExtensionHandler = class ViewsExtensionHandler {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.handleAndRegisterCustomViewContainers();
            this.handleAndRegisterCustomViews();
        }
        handleAndRegisterCustomViewContainers() {
            this.registerTestViewContainer();
            viewsContainersExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeCustomViewContainers(removed);
                }
                if (added.length) {
                    this.addCustomViewContainers(added, this.viewContainersRegistry.all);
                }
            });
        }
        addCustomViewContainers(extensionPoints, existingViewContainers) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            let activityBarOrder = TEST_VIEW_CONTAINER_ORDER + viewContainersRegistry.all.filter(v => !!v.extensionId && viewContainersRegistry.getViewContainerLocation(v) === views_1.ViewContainerLocation.Sidebar).length + 1;
            let panelOrder = 5 + viewContainersRegistry.all.filter(v => !!v.extensionId && viewContainersRegistry.getViewContainerLocation(v) === views_1.ViewContainerLocation.Panel).length + 1;
            for (let { value, collector, description } of extensionPoints) {
                collections_1.forEach(value, entry => {
                    if (!this.isValidViewsContainer(entry.value, collector)) {
                        return;
                    }
                    switch (entry.key) {
                        case 'activitybar':
                            activityBarOrder = this.registerCustomViewContainers(entry.value, description, activityBarOrder, existingViewContainers, views_1.ViewContainerLocation.Sidebar);
                            break;
                        case 'panel':
                            panelOrder = this.registerCustomViewContainers(entry.value, description, panelOrder, existingViewContainers, views_1.ViewContainerLocation.Panel);
                            break;
                    }
                });
            }
        }
        removeCustomViewContainers(extensionPoints) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            const removedExtensions = extensionPoints.reduce((result, e) => { result.add(extensions_1.ExtensionIdentifier.toKey(e.description.identifier)); return result; }, new Set());
            for (const viewContainer of viewContainersRegistry.all) {
                if (viewContainer.extensionId && removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(viewContainer.extensionId))) {
                    // move only those views that do not belong to the removed extension
                    const views = this.viewsRegistry.getViews(viewContainer).filter(view => !removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(view.extensionId)));
                    if (views.length) {
                        this.viewsRegistry.moveViews(views, this.getDefaultViewContainer());
                    }
                    this.deregisterCustomViewContainer(viewContainer);
                }
            }
        }
        registerTestViewContainer() {
            const title = nls_1.localize('test', "Test");
            const icon = codicons_1.Codicon.beaker.classNames;
            this.registerCustomViewContainer(views_1.TEST_VIEW_CONTAINER_ID, title, icon, TEST_VIEW_CONTAINER_ORDER, undefined, views_1.ViewContainerLocation.Sidebar);
        }
        isValidViewsContainer(viewsContainersDescriptors, collector) {
            if (!Array.isArray(viewsContainersDescriptors)) {
                collector.error(nls_1.localize('viewcontainer requirearray', "views containers must be an array"));
                return false;
            }
            for (let descriptor of viewsContainersDescriptors) {
                if (typeof descriptor.id !== 'string') {
                    collector.error(nls_1.localize('requireidstring', "property `{0}` is mandatory and must be of type `string`. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (!(/^[a-z0-9_-]+$/i.test(descriptor.id))) {
                    collector.error(nls_1.localize('requireidstring', "property `{0}` is mandatory and must be of type `string`. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (typeof descriptor.title !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'title'));
                    return false;
                }
                if (typeof descriptor.icon !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'icon'));
                    return false;
                }
            }
            return true;
        }
        registerCustomViewContainers(containers, extension, order, existingViewContainers, location) {
            containers.forEach(descriptor => {
                const icon = resources.joinPath(extension.extensionLocation, descriptor.icon);
                const id = `workbench.view.extension.${descriptor.id}`;
                const viewContainer = this.registerCustomViewContainer(id, descriptor.title, icon, order++, extension.identifier, location);
                // Move those views that belongs to this container
                if (existingViewContainers.length) {
                    const viewsToMove = [];
                    for (const existingViewContainer of existingViewContainers) {
                        if (viewContainer !== existingViewContainer) {
                            viewsToMove.push(...this.viewsRegistry.getViews(existingViewContainer).filter(view => view.originalContainerId === descriptor.id));
                        }
                    }
                    if (viewsToMove.length) {
                        this.viewsRegistry.moveViews(viewsToMove, viewContainer);
                    }
                }
            });
            return order;
        }
        registerCustomViewContainer(id, title, icon, order, extensionId, location) {
            let viewContainer = this.viewContainersRegistry.get(id);
            if (!viewContainer) {
                viewContainer = this.viewContainersRegistry.registerViewContainer({
                    id,
                    name: title, extensionId,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [id, { mergeViewWithContainerWhenSingleView: true }]),
                    hideIfEmpty: true,
                    order,
                    icon,
                }, location);
                // Register Action to Open Viewlet
                let OpenCustomViewletAction = class OpenCustomViewletAction extends viewlet_1.ShowViewletAction {
                    constructor(id, label, viewletService, editorGroupService, layoutService) {
                        super(id, label, id, viewletService, editorGroupService, layoutService);
                    }
                };
                OpenCustomViewletAction = __decorate([
                    __param(2, viewlet_2.IViewletService),
                    __param(3, editorGroupsService_1.IEditorGroupsService),
                    __param(4, layoutService_1.IWorkbenchLayoutService)
                ], OpenCustomViewletAction);
                const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
                registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.create(OpenCustomViewletAction, id, nls_1.localize('showViewlet', "Show {0}", title)), `View: Show ${title}`, nls_1.localize('view', "View"));
            }
            return viewContainer;
        }
        deregisterCustomViewContainer(viewContainer) {
            this.viewContainersRegistry.deregisterViewContainer(viewContainer);
            platform_1.Registry.as(viewlet_1.Extensions.Viewlets).deregisterViewlet(viewContainer.id);
        }
        handleAndRegisterCustomViews() {
            viewsExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeViews(removed);
                }
                if (added.length) {
                    this.addViews(added);
                }
            });
        }
        addViews(extensions) {
            const viewIds = new Set();
            const allViewDescriptors = [];
            for (const extension of extensions) {
                const { value, collector } = extension;
                collections_1.forEach(value, entry => {
                    if (!this.isValidViewDescriptors(entry.value, collector)) {
                        return;
                    }
                    if (entry.key === 'remote' && !extension.description.enableProposedApi) {
                        collector.warn(nls_1.localize('ViewContainerRequiresProposedAPI', "View container '{0}' requires 'enableProposedApi' turned on to be added to 'Remote'.", entry.key));
                        return;
                    }
                    const viewContainer = this.getViewContainer(entry.key);
                    if (!viewContainer) {
                        collector.warn(nls_1.localize('ViewContainerDoesnotExist', "View container '{0}' does not exist and all views registered to it will be added to 'Explorer'.", entry.key));
                    }
                    const container = viewContainer || this.getDefaultViewContainer();
                    const viewDescriptors = arrays_1.coalesce(entry.value.map((item, index) => {
                        // validate
                        if (viewIds.has(item.id)) {
                            collector.error(nls_1.localize('duplicateView1', "Cannot register multiple views with same id `{0}`", item.id));
                            return null;
                        }
                        if (this.viewsRegistry.getView(item.id) !== null) {
                            collector.error(nls_1.localize('duplicateView2', "A view with id `{0}` is already registered.", item.id));
                            return null;
                        }
                        const order = extensions_1.ExtensionIdentifier.equals(extension.description.identifier, container.extensionId)
                            ? index + 1
                            : container.viewOrderDelegate
                                ? container.viewOrderDelegate.getOrder(item.group)
                                : undefined;
                        const icon = item.icon ? resources.joinPath(extension.description.extensionLocation, item.icon) : undefined;
                        const viewDescriptor = {
                            id: item.id,
                            name: item.name,
                            ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                            when: contextkey_1.ContextKeyExpr.deserialize(item.when),
                            containerIcon: icon || (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.icon),
                            containerTitle: item.contextualTitle || (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.name),
                            canToggleVisibility: true,
                            canMoveView: true,
                            treeView: this.instantiationService.createInstance(treeView_1.CustomTreeView, item.id, item.name),
                            collapsed: this.showCollapsed(container),
                            order: order,
                            extensionId: extension.description.identifier,
                            originalContainerId: entry.key,
                            group: item.group,
                            remoteAuthority: item.remoteName || item.remoteAuthority // TODO@roblou - delete after remote extensions are updated
                        };
                        viewIds.add(viewDescriptor.id);
                        return viewDescriptor;
                    }));
                    allViewDescriptors.push({ viewContainer: container, views: viewDescriptors });
                });
            }
            this.viewsRegistry.registerViews2(allViewDescriptors);
        }
        getDefaultViewContainer() {
            return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
        }
        removeViews(extensions) {
            const removedExtensions = extensions.reduce((result, e) => { result.add(extensions_1.ExtensionIdentifier.toKey(e.description.identifier)); return result; }, new Set());
            for (const viewContainer of this.viewContainersRegistry.all) {
                const removedViews = this.viewsRegistry.getViews(viewContainer).filter(v => v.extensionId && removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(v.extensionId)));
                if (removedViews.length) {
                    this.viewsRegistry.deregisterViews(removedViews, viewContainer);
                }
            }
        }
        isValidViewDescriptors(viewDescriptors, collector) {
            if (!Array.isArray(viewDescriptors)) {
                collector.error(nls_1.localize('requirearray', "views must be an array"));
                return false;
            }
            for (let descriptor of viewDescriptors) {
                if (typeof descriptor.id !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                    return false;
                }
                if (typeof descriptor.name !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'name'));
                    return false;
                }
                if (descriptor.when && typeof descriptor.when !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                    return false;
                }
                if (descriptor.icon && typeof descriptor.icon !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'icon'));
                    return false;
                }
                if (descriptor.contextualTitle && typeof descriptor.contextualTitle !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'contextualTitle'));
                    return false;
                }
            }
            return true;
        }
        getViewContainer(value) {
            switch (value) {
                case 'explorer': return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
                case 'debug': return this.viewContainersRegistry.get(debug_1.VIEWLET_ID);
                case 'scm': return this.viewContainersRegistry.get(scm_1.VIEWLET_ID);
                case 'remote': return this.viewContainersRegistry.get(remote_contribution_1.VIEWLET_ID);
                default: return this.viewContainersRegistry.get(`workbench.view.extension.${value}`);
            }
        }
        showCollapsed(container) {
            switch (container.id) {
                case files_1.VIEWLET_ID:
                case scm_1.VIEWLET_ID:
                case debug_1.VIEWLET_ID:
                    return true;
            }
            return false;
        }
    };
    ViewsExtensionHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ViewsExtensionHandler);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ViewsExtensionHandler, 1 /* Starting */);
});
//# __sourceMappingURL=viewsExtensionPoint.js.map