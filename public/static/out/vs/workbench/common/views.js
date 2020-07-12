/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/base/common/collections"], function (require, exports, event_1, contextkey_1, nls_1, instantiation_1, lifecycle_1, map_1, platform_1, arrays_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeItemCollapsibleState = exports.IViewDescriptorService = exports.getVisbileViewContextKey = exports.FocusedViewContext = exports.IViewsService = exports.ViewContentPriority = exports.ViewContainerLocation = exports.Extensions = exports.TEST_VIEW_CONTAINER_ID = void 0;
    exports.TEST_VIEW_CONTAINER_ID = 'workbench.view.extension.test';
    var Extensions;
    (function (Extensions) {
        Extensions.ViewContainersRegistry = 'workbench.registry.view.containers';
        Extensions.ViewsRegistry = 'workbench.registry.view';
    })(Extensions = exports.Extensions || (exports.Extensions = {}));
    var ViewContainerLocation;
    (function (ViewContainerLocation) {
        ViewContainerLocation[ViewContainerLocation["Sidebar"] = 0] = "Sidebar";
        ViewContainerLocation[ViewContainerLocation["Panel"] = 1] = "Panel";
    })(ViewContainerLocation = exports.ViewContainerLocation || (exports.ViewContainerLocation = {}));
    class ViewContainersRegistryImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidDeregister = this._register(new event_1.Emitter());
            this.onDidDeregister = this._onDidDeregister.event;
            this.viewContainers = new Map();
            this.defaultViewContainers = [];
        }
        get all() {
            return arrays_1.flatten(map_1.values(this.viewContainers));
        }
        registerViewContainer(viewContainerDescriptor, viewContainerLocation, isDefault) {
            const existing = this.get(viewContainerDescriptor.id);
            if (existing) {
                return existing;
            }
            const viewContainer = viewContainerDescriptor;
            const viewContainers = map_1.getOrSet(this.viewContainers, viewContainerLocation, []);
            viewContainers.push(viewContainer);
            if (isDefault) {
                this.defaultViewContainers.push(viewContainer);
            }
            this._onDidRegister.fire({ viewContainer, viewContainerLocation });
            return viewContainer;
        }
        deregisterViewContainer(viewContainer) {
            for (const viewContainerLocation of map_1.keys(this.viewContainers)) {
                const viewContainers = this.viewContainers.get(viewContainerLocation);
                const index = viewContainers === null || viewContainers === void 0 ? void 0 : viewContainers.indexOf(viewContainer);
                if (index !== -1) {
                    viewContainers === null || viewContainers === void 0 ? void 0 : viewContainers.splice(index, 1);
                    if (viewContainers.length === 0) {
                        this.viewContainers.delete(viewContainerLocation);
                    }
                    this._onDidDeregister.fire({ viewContainer, viewContainerLocation });
                    return;
                }
            }
        }
        get(id) {
            return this.all.filter(viewContainer => viewContainer.id === id)[0];
        }
        getViewContainers(location) {
            return [...(this.viewContainers.get(location) || [])];
        }
        getViewContainerLocation(container) {
            return map_1.keys(this.viewContainers).filter(location => this.getViewContainers(location).filter(viewContainer => viewContainer.id === container.id).length > 0)[0];
        }
        getDefaultViewContainer(location) {
            return this.defaultViewContainers.find(viewContainer => this.getViewContainerLocation(viewContainer) === location);
        }
    }
    platform_1.Registry.add(Extensions.ViewContainersRegistry, new ViewContainersRegistryImpl());
    var ViewContentPriority;
    (function (ViewContentPriority) {
        ViewContentPriority[ViewContentPriority["Normal"] = 0] = "Normal";
        ViewContentPriority[ViewContentPriority["Low"] = 1] = "Low";
        ViewContentPriority[ViewContentPriority["Lowest"] = 2] = "Lowest";
    })(ViewContentPriority = exports.ViewContentPriority || (exports.ViewContentPriority = {}));
    function compareViewContentDescriptors(a, b) {
        var _a, _b;
        const aPriority = (_a = a.priority) !== null && _a !== void 0 ? _a : ViewContentPriority.Normal;
        const bPriority = (_b = b.priority) !== null && _b !== void 0 ? _b : ViewContentPriority.Normal;
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        // No priroity, keep views sorted in the order they got registered
        return 0;
    }
    class ViewsRegistry extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onViewsRegistered = this._register(new event_1.Emitter());
            this.onViewsRegistered = this._onViewsRegistered.event;
            this._onViewsDeregistered = this._register(new event_1.Emitter());
            this.onViewsDeregistered = this._onViewsDeregistered.event;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._onDidChangeViewWelcomeContent = this._register(new event_1.Emitter());
            this.onDidChangeViewWelcomeContent = this._onDidChangeViewWelcomeContent.event;
            this._viewContainers = [];
            this._views = new Map();
            this._viewWelcomeContents = new collections_1.SetMap();
        }
        registerViews(views, viewContainer) {
            this.registerViews2([{ views, viewContainer }]);
        }
        registerViews2(views) {
            views.forEach(({ views, viewContainer }) => this.addViews(views, viewContainer));
            this._onViewsRegistered.fire(views);
        }
        deregisterViews(viewDescriptors, viewContainer) {
            const views = this.removeViews(viewDescriptors, viewContainer);
            if (views.length) {
                this._onViewsDeregistered.fire({ views, viewContainer });
            }
        }
        moveViews(viewsToMove, viewContainer) {
            map_1.keys(this._views).forEach(container => {
                if (container !== viewContainer) {
                    const views = this.removeViews(viewsToMove, container);
                    if (views.length) {
                        this.addViews(views, viewContainer);
                        this._onDidChangeContainer.fire({ views, from: container, to: viewContainer });
                    }
                }
            });
        }
        getViews(loc) {
            return this._views.get(loc) || [];
        }
        getView(id) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === id)[0];
                if (viewDescriptor) {
                    return viewDescriptor;
                }
            }
            return null;
        }
        getViewContainer(viewId) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === viewId)[0];
                if (viewDescriptor) {
                    return viewContainer;
                }
            }
            return null;
        }
        registerViewWelcomeContent(id, viewContent) {
            this._viewWelcomeContents.add(id, viewContent);
            this._onDidChangeViewWelcomeContent.fire(id);
            return lifecycle_1.toDisposable(() => {
                this._viewWelcomeContents.delete(id, viewContent);
                this._onDidChangeViewWelcomeContent.fire(id);
            });
        }
        getViewWelcomeContent(id) {
            const result = [];
            this._viewWelcomeContents.forEach(id, descriptor => result.push(descriptor));
            arrays_1.mergeSort(result, compareViewContentDescriptors);
            return result;
        }
        addViews(viewDescriptors, viewContainer) {
            let views = this._views.get(viewContainer);
            if (!views) {
                views = [];
                this._views.set(viewContainer, views);
                this._viewContainers.push(viewContainer);
            }
            for (const viewDescriptor of viewDescriptors) {
                if (this.getView(viewDescriptor.id) !== null) {
                    throw new Error(nls_1.localize('duplicateId', "A view with id '{0}' is already registered", viewDescriptor.id));
                }
                views.push(viewDescriptor);
            }
        }
        removeViews(viewDescriptors, viewContainer) {
            const views = this._views.get(viewContainer);
            if (!views) {
                return [];
            }
            const viewsToDeregister = [];
            const remaningViews = [];
            for (const view of views) {
                if (viewDescriptors.indexOf(view) === -1) {
                    remaningViews.push(view);
                }
                else {
                    viewsToDeregister.push(view);
                }
            }
            if (viewsToDeregister.length) {
                if (remaningViews.length) {
                    this._views.set(viewContainer, remaningViews);
                }
                else {
                    this._views.delete(viewContainer);
                    this._viewContainers.splice(this._viewContainers.indexOf(viewContainer), 1);
                }
            }
            return viewsToDeregister;
        }
    }
    platform_1.Registry.add(Extensions.ViewsRegistry, new ViewsRegistry());
    exports.IViewsService = instantiation_1.createDecorator('viewsService');
    /**
     * View Contexts
     */
    exports.FocusedViewContext = new contextkey_1.RawContextKey('focusedView', '');
    function getVisbileViewContextKey(viewId) { return `${viewId}.visible`; }
    exports.getVisbileViewContextKey = getVisbileViewContextKey;
    exports.IViewDescriptorService = instantiation_1.createDecorator('viewDescriptorService');
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState = exports.TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = {}));
});
//# __sourceMappingURL=views.js.map