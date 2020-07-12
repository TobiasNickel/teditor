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
define(["require", "exports", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/platform/userDataSync/common/storageKeys", "vs/platform/telemetry/common/telemetry", "vs/base/common/uuid", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/views/common/viewContainerModel", "vs/platform/actions/common/actions", "vs/nls"], function (require, exports, views_1, contextkey_1, storage_1, extensions_1, platform_1, lifecycle_1, viewPaneContainer_1, descriptors_1, extensions_2, event_1, storageKeys_1, telemetry_1, uuid_1, instantiation_1, viewContainerModel_1, actions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewDescriptorService = void 0;
    let ViewDescriptorService = class ViewDescriptorService extends lifecycle_1.Disposable {
        constructor(instantiationService, contextKeyService, storageService, extensionService, telemetryService, storageKeysSyncRegistryService) {
            super();
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._onDidChangeLocation = this._register(new event_1.Emitter());
            this.onDidChangeLocation = this._onDidChangeLocation.event;
            this._onDidChangeContainerLocation = this._register(new event_1.Emitter());
            this.onDidChangeContainerLocation = this._onDidChangeContainerLocation.event;
            this._onDidChangeViewContainers = this._register(new event_1.Emitter());
            this.onDidChangeViewContainers = this._onDidChangeViewContainers.event;
            storageKeysSyncRegistryService.registerStorageKey({ key: ViewDescriptorService.CACHED_VIEW_POSITIONS, version: 1 });
            storageKeysSyncRegistryService.registerStorageKey({ key: ViewDescriptorService.CACHED_VIEW_CONTAINER_LOCATIONS, version: 1 });
            this.viewContainerModels = new Map();
            this.activeViewContextKeys = new Map();
            this.movableViewContextKeys = new Map();
            this.defaultViewLocationContextKeys = new Map();
            this.defaultViewContainerLocationContextKeys = new Map();
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.cachedViewContainerInfo = this.getCachedViewContainerLocations();
            this.cachedViewInfo = this.getCachedViewPositions();
            // Register all containers that were registered before this ctor
            this.viewContainers.forEach(viewContainer => this.onDidRegisterViewContainer(viewContainer));
            this._register(this.viewsRegistry.onViewsRegistered(views => this.onDidRegisterViews(views)));
            this._register(this.viewsRegistry.onViewsDeregistered(({ views, viewContainer }) => this.onDidDeregisterViews(views, viewContainer)));
            this._register(this.viewsRegistry.onDidChangeContainer(({ views, from, to }) => this.moveViews(views, from, to)));
            this._register(this.viewContainersRegistry.onDidRegister(({ viewContainer }) => {
                this.onDidRegisterViewContainer(viewContainer);
                this._onDidChangeViewContainers.fire({ added: [{ container: viewContainer, location: this.getViewContainerLocation(viewContainer) }], removed: [] });
            }));
            this._register(this.viewContainersRegistry.onDidDeregister(({ viewContainer }) => {
                this.onDidDeregisterViewContainer(viewContainer);
                this._onDidChangeViewContainers.fire({ removed: [{ container: viewContainer, location: this.getViewContainerLocation(viewContainer) }], added: [] });
            }));
            this._register(lifecycle_1.toDisposable(() => {
                this.viewContainerModels.forEach(({ disposable }) => disposable.dispose());
                this.viewContainerModels.clear();
            }));
            this._register(this.storageService.onDidChangeStorage((e) => { this.onDidStorageChange(e); }));
            this._register(this.extensionService.onDidRegisterExtensions(() => this.onDidRegisterExtensions()));
        }
        get cachedViewPositionsValue() {
            if (!this._cachedViewPositionsValue) {
                this._cachedViewPositionsValue = this.getStoredCachedViewPositionsValue();
            }
            return this._cachedViewPositionsValue;
        }
        set cachedViewPositionsValue(value) {
            if (this.cachedViewPositionsValue !== value) {
                this._cachedViewPositionsValue = value;
                this.setStoredCachedViewPositionsValue(value);
            }
        }
        get cachedViewContainerLocationsValue() {
            if (!this._cachedViewContainerLocationsValue) {
                this._cachedViewContainerLocationsValue = this.getStoredCachedViewContainerLocationsValue();
            }
            return this._cachedViewContainerLocationsValue;
        }
        set cachedViewContainerLocationsValue(value) {
            if (this._cachedViewContainerLocationsValue !== value) {
                this._cachedViewContainerLocationsValue = value;
                this.setStoredCachedViewContainerLocationsValue(value);
            }
        }
        get viewContainers() { return this.viewContainersRegistry.all; }
        registerGroupedViews(groupedViews) {
            // Register views that have already been registered to their correct view containers
            for (const containerId of groupedViews.keys()) {
                const viewContainer = this.viewContainersRegistry.get(containerId);
                const containerData = groupedViews.get(containerId);
                // The container has not been registered yet
                if (!viewContainer || !this.viewContainerModels.has(viewContainer)) {
                    if (containerData.cachedContainerInfo && this.isGeneratedContainerId(containerData.cachedContainerInfo.containerId)) {
                        if (!this.viewContainersRegistry.get(containerId)) {
                            this.registerGeneratedViewContainer(this.cachedViewContainerInfo.get(containerId), containerId);
                        }
                    }
                    // Registration of a generated container handles registration of its views
                    continue;
                }
                // Filter out views that have already been added to the view container model
                // This is needed when statically-registered views are moved to
                // other statically registered containers as they will both try to add on startup
                const viewsToAdd = containerData.views.filter(view => this.getViewContainerModel(viewContainer).allViewDescriptors.filter(vd => vd.id === view.id).length === 0);
                this.addViews(viewContainer, viewsToAdd);
            }
        }
        deregisterGroupedViews(groupedViews) {
            // Register views that have already been registered to their correct view containers
            for (const viewContainerId of groupedViews.keys()) {
                const viewContainer = this.viewContainersRegistry.get(viewContainerId);
                // The container has not been registered yet
                if (!viewContainer || !this.viewContainerModels.has(viewContainer)) {
                    continue;
                }
                this.removeViews(viewContainer, groupedViews.get(viewContainerId).views);
            }
        }
        fallbackOrphanedViews() {
            for (const [viewId, containerInfo] of this.cachedViewInfo.entries()) {
                const containerId = containerInfo.containerId;
                // check if cached view container is registered
                if (this.viewContainersRegistry.get(containerId)) {
                    continue;
                }
                // check if view has been registered to default location
                const viewContainer = this.viewsRegistry.getViewContainer(viewId);
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewContainer && viewDescriptor) {
                    this.addViews(viewContainer, [viewDescriptor]);
                }
            }
        }
        onDidRegisterExtensions() {
            // If an extension is uninstalled, this method will handle resetting views to default locations
            this.fallbackOrphanedViews();
        }
        onDidRegisterViews(views) {
            views.forEach(({ views, viewContainer }) => {
                // When views are registered, we need to regroup them based on the cache
                const regroupedViews = this.regroupViews(viewContainer.id, views);
                // Once they are grouped, try registering them which occurs
                // if the container has already been registered within this service
                // or we can generate the container from the source view id
                this.registerGroupedViews(regroupedViews);
                views.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(!!viewDescriptor.canMoveView));
            });
        }
        isGeneratedContainerId(id) {
            return id.startsWith(ViewDescriptorService.COMMON_CONTAINER_ID_PREFIX);
        }
        onDidDeregisterViews(views, viewContainer) {
            // When views are registered, we need to regroup them based on the cache
            const regroupedViews = this.regroupViews(viewContainer.id, views);
            this.deregisterGroupedViews(regroupedViews);
            views.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(false));
        }
        regroupViews(containerId, views) {
            const ret = new Map();
            views.forEach(viewDescriptor => {
                const containerInfo = this.cachedViewInfo.get(viewDescriptor.id);
                const correctContainerId = (containerInfo === null || containerInfo === void 0 ? void 0 : containerInfo.containerId) || containerId;
                const containerData = ret.get(correctContainerId) || { cachedContainerInfo: containerInfo, views: [] };
                containerData.views.push(viewDescriptor);
                ret.set(correctContainerId, containerData);
            });
            return ret;
        }
        getViewDescriptorById(viewId) {
            return this.viewsRegistry.getView(viewId);
        }
        getViewLocationById(viewId) {
            const container = this.getViewContainerByViewId(viewId);
            if (container === null) {
                return null;
            }
            return this.getViewContainerLocation(container);
        }
        getViewContainerByViewId(viewId) {
            var _a, _b;
            const containerId = (_a = this.cachedViewInfo.get(viewId)) === null || _a === void 0 ? void 0 : _a.containerId;
            return containerId ? (_b = this.viewContainersRegistry.get(containerId)) !== null && _b !== void 0 ? _b : null :
                this.viewsRegistry.getViewContainer(viewId);
        }
        getViewContainerLocation(viewContainer) {
            const location = this.cachedViewContainerInfo.get(viewContainer.id);
            return location !== undefined ? location : this.getDefaultViewContainerLocation(viewContainer);
        }
        getDefaultViewContainerLocation(viewContainer) {
            return this.viewContainersRegistry.getViewContainerLocation(viewContainer);
        }
        getDefaultContainerById(viewId) {
            var _a;
            return (_a = this.viewsRegistry.getViewContainer(viewId)) !== null && _a !== void 0 ? _a : null;
        }
        getViewContainerModel(container) {
            return this.getOrRegisterViewContainerModel(container);
        }
        getViewContainerById(id) {
            return this.viewContainersRegistry.get(id) || null;
        }
        getViewContainersByLocation(location) {
            return this.viewContainers.filter(v => this.getViewContainerLocation(v) === location);
        }
        getDefaultViewContainer(location) {
            return this.viewContainersRegistry.getDefaultViewContainer(location);
        }
        moveViewContainerToLocation(viewContainer, location, requestedIndex) {
            const from = this.getViewContainerLocation(viewContainer);
            const to = location;
            if (from !== to) {
                this.cachedViewContainerInfo.set(viewContainer.id, to);
                const defaultLocation = this.isGeneratedContainerId(viewContainer.id) ? true : this.getViewContainerLocation(viewContainer) === this.getDefaultViewContainerLocation(viewContainer);
                this.getOrCreateDefaultViewContainerLocationContextKey(viewContainer).set(defaultLocation);
                viewContainer.requestedIndex = requestedIndex;
                this._onDidChangeContainerLocation.fire({ viewContainer, from, to });
                const views = this.getViewsByContainer(viewContainer);
                this._onDidChangeLocation.fire({ views, from, to });
                this.saveViewContainerLocationsToCache();
            }
        }
        moveViewToLocation(view, location) {
            let container = this.registerGeneratedViewContainer(location);
            this.moveViewsToContainer([view], container);
        }
        moveViewsToContainer(views, viewContainer) {
            if (!views.length) {
                return;
            }
            const from = this.getViewContainerByViewId(views[0].id);
            const to = viewContainer;
            if (from && to && from !== to) {
                this.moveViews(views, from, to);
            }
        }
        moveViews(views, from, to, skipCacheUpdate) {
            this.removeViews(from, views);
            this.addViews(to, views, true);
            const oldLocation = this.getViewContainerLocation(from);
            const newLocation = this.getViewContainerLocation(to);
            if (oldLocation !== newLocation) {
                this._onDidChangeLocation.fire({ views, from: oldLocation, to: newLocation });
            }
            this._onDidChangeContainer.fire({ views, from, to });
            if (!skipCacheUpdate) {
                this.saveViewPositionsToCache();
                const containerToString = (container) => {
                    if (container.id.startsWith(ViewDescriptorService.COMMON_CONTAINER_ID_PREFIX)) {
                        return 'custom';
                    }
                    if (!container.extensionId) {
                        return container.id;
                    }
                    return 'extension';
                };
                // Log on cache update to avoid duplicate events in other windows
                const viewCount = views.length;
                const fromContainer = containerToString(from);
                const toContainer = containerToString(to);
                const fromLocation = oldLocation === views_1.ViewContainerLocation.Panel ? 'panel' : 'sidebar';
                const toLocation = newLocation === views_1.ViewContainerLocation.Panel ? 'panel' : 'sidebar';
                this.telemetryService.publicLog2('viewDescriptorService.moveViews', { viewCount, fromContainer, toContainer, fromLocation, toLocation });
            }
        }
        registerGeneratedViewContainer(location, existingId) {
            const id = existingId || this.generateContainerId(location);
            const container = this.viewContainersRegistry.registerViewContainer({
                id,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [id, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
                name: 'Custom Views',
                icon: location === views_1.ViewContainerLocation.Sidebar ? 'codicon-window' : undefined,
                storageId: `${id}.state`,
                hideIfEmpty: true
            }, location);
            const cachedInfo = this.cachedViewContainerInfo.get(container.id);
            if (cachedInfo !== location) {
                this.cachedViewContainerInfo.set(container.id, location);
                this.saveViewContainerLocationsToCache();
            }
            this.getOrCreateDefaultViewContainerLocationContextKey(container).set(true);
            return container;
        }
        getCachedViewPositions() {
            const result = new Map(JSON.parse(this.cachedViewPositionsValue));
            // Sanitize cache
            for (const [viewId, containerInfo] of result.entries()) {
                if (!containerInfo) {
                    result.delete(viewId);
                    continue;
                }
                // Verify a view that is in a generated has cached container info
                const generated = this.isGeneratedContainerId(containerInfo.containerId);
                const missingCacheData = this.cachedViewContainerInfo.get(containerInfo.containerId) === undefined;
                if (generated && missingCacheData) {
                    result.delete(viewId);
                }
            }
            return result;
        }
        getCachedViewContainerLocations() {
            return new Map(JSON.parse(this.cachedViewContainerLocationsValue));
        }
        onDidStorageChange(e) {
            if (e.key === ViewDescriptorService.CACHED_VIEW_POSITIONS && e.scope === 0 /* GLOBAL */
                && this.cachedViewPositionsValue !== this.getStoredCachedViewPositionsValue() /* This checks if current window changed the value or not */) {
                this._cachedViewPositionsValue = this.getStoredCachedViewPositionsValue();
                const newCachedPositions = this.getCachedViewPositions();
                for (let viewId of newCachedPositions.keys()) {
                    const viewDescriptor = this.getViewDescriptorById(viewId);
                    if (!viewDescriptor) {
                        continue;
                    }
                    const prevViewContainer = this.getViewContainerByViewId(viewId);
                    const newViewContainerInfo = newCachedPositions.get(viewId);
                    // Verify if we need to create the destination container
                    if (!this.viewContainersRegistry.get(newViewContainerInfo.containerId)) {
                        const location = this.cachedViewContainerInfo.get(newViewContainerInfo.containerId);
                        if (location !== undefined) {
                            this.registerGeneratedViewContainer(location, newViewContainerInfo.containerId);
                        }
                    }
                    // Try moving to the new container
                    const newViewContainer = this.viewContainersRegistry.get(newViewContainerInfo.containerId);
                    if (prevViewContainer && newViewContainer && newViewContainer !== prevViewContainer) {
                        const viewDescriptor = this.getViewDescriptorById(viewId);
                        if (viewDescriptor) {
                            this.moveViews([viewDescriptor], prevViewContainer, newViewContainer);
                        }
                    }
                }
                // If a value is not present in the cache, it must be reset to default
                this.viewContainers.forEach(viewContainer => {
                    const viewContainerModel = this.getViewContainerModel(viewContainer);
                    viewContainerModel.allViewDescriptors.forEach(viewDescriptor => {
                        if (!newCachedPositions.has(viewDescriptor.id)) {
                            const currentContainer = this.getViewContainerByViewId(viewDescriptor.id);
                            const defaultContainer = this.getDefaultContainerById(viewDescriptor.id);
                            if (currentContainer && defaultContainer && currentContainer !== defaultContainer) {
                                this.moveViews([viewDescriptor], currentContainer, defaultContainer);
                            }
                            this.cachedViewInfo.delete(viewDescriptor.id);
                        }
                    });
                });
                this.cachedViewInfo = this.getCachedViewPositions();
            }
            if (e.key === ViewDescriptorService.CACHED_VIEW_CONTAINER_LOCATIONS && e.scope === 0 /* GLOBAL */
                && this.cachedViewContainerLocationsValue !== this.getStoredCachedViewContainerLocationsValue() /* This checks if current window changed the value or not */) {
                this._cachedViewContainerLocationsValue = this.getStoredCachedViewContainerLocationsValue();
                const newCachedLocations = this.getCachedViewContainerLocations();
                for (const [containerId, location] of newCachedLocations.entries()) {
                    const container = this.getViewContainerById(containerId);
                    if (container) {
                        if (location !== this.getViewContainerLocation(container)) {
                            this.moveViewContainerToLocation(container, location);
                        }
                    }
                }
                this.viewContainers.forEach(viewContainer => {
                    if (!newCachedLocations.has(viewContainer.id)) {
                        const currentLocation = this.getViewContainerLocation(viewContainer);
                        const defaultLocation = this.getDefaultViewContainerLocation(viewContainer);
                        if (currentLocation !== defaultLocation) {
                            this.moveViewContainerToLocation(viewContainer, defaultLocation);
                        }
                    }
                });
                this.cachedViewContainerInfo = this.getCachedViewContainerLocations();
            }
        }
        // Generated Container Id Format
        // {Common Prefix}.{Location}.{Uniqueness Id}
        // Old Format (deprecated)
        // {Common Prefix}.{Uniqueness Id}.{Source View Id}
        generateContainerId(location) {
            return `${ViewDescriptorService.COMMON_CONTAINER_ID_PREFIX}.${location === views_1.ViewContainerLocation.Panel ? 'panel' : 'sidebar'}.${uuid_1.generateUuid()}`;
        }
        getStoredCachedViewPositionsValue() {
            return this.storageService.get(ViewDescriptorService.CACHED_VIEW_POSITIONS, 0 /* GLOBAL */, '[]');
        }
        setStoredCachedViewPositionsValue(value) {
            this.storageService.store(ViewDescriptorService.CACHED_VIEW_POSITIONS, value, 0 /* GLOBAL */);
        }
        getStoredCachedViewContainerLocationsValue() {
            return this.storageService.get(ViewDescriptorService.CACHED_VIEW_CONTAINER_LOCATIONS, 0 /* GLOBAL */, '[]');
        }
        setStoredCachedViewContainerLocationsValue(value) {
            this.storageService.store(ViewDescriptorService.CACHED_VIEW_CONTAINER_LOCATIONS, value, 0 /* GLOBAL */);
        }
        saveViewPositionsToCache() {
            this.viewContainers.forEach(viewContainer => {
                const viewContainerModel = this.getViewContainerModel(viewContainer);
                viewContainerModel.allViewDescriptors.forEach(viewDescriptor => {
                    this.cachedViewInfo.set(viewDescriptor.id, {
                        containerId: viewContainer.id
                    });
                });
            });
            // Do no save default positions to the cache
            // so that default changes can be recognized
            // https://github.com/microsoft/vscode/issues/90414
            for (const [viewId, containerInfo] of this.cachedViewInfo) {
                const defaultContainer = this.getDefaultContainerById(viewId);
                if ((defaultContainer === null || defaultContainer === void 0 ? void 0 : defaultContainer.id) === containerInfo.containerId) {
                    this.cachedViewInfo.delete(viewId);
                }
            }
            this.cachedViewPositionsValue = JSON.stringify([...this.cachedViewInfo]);
        }
        saveViewContainerLocationsToCache() {
            for (const [containerId, location] of this.cachedViewContainerInfo) {
                const container = this.getViewContainerById(containerId);
                if (container && location === this.getDefaultViewContainerLocation(container) && !this.isGeneratedContainerId(containerId)) {
                    this.cachedViewContainerInfo.delete(containerId);
                }
            }
            this.cachedViewContainerLocationsValue = JSON.stringify([...this.cachedViewContainerInfo]);
        }
        getViewsByContainer(viewContainer) {
            const result = this.viewsRegistry.getViews(viewContainer).filter(viewDescriptor => {
                var _a;
                const cachedContainer = ((_a = this.cachedViewInfo.get(viewDescriptor.id)) === null || _a === void 0 ? void 0 : _a.containerId) || viewContainer.id;
                return cachedContainer === viewContainer.id;
            });
            for (const [viewId, containerInfo] of this.cachedViewInfo.entries()) {
                if (!containerInfo || containerInfo.containerId !== viewContainer.id) {
                    continue;
                }
                if (this.viewsRegistry.getViewContainer(viewId) === viewContainer) {
                    continue;
                }
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewDescriptor) {
                    result.push(viewDescriptor);
                }
            }
            return result;
        }
        onDidRegisterViewContainer(viewContainer) {
            const defaultLocation = this.isGeneratedContainerId(viewContainer.id) ? true : this.getViewContainerLocation(viewContainer) === this.getDefaultViewContainerLocation(viewContainer);
            this.getOrCreateDefaultViewContainerLocationContextKey(viewContainer).set(defaultLocation);
            this.getOrRegisterViewContainerModel(viewContainer);
        }
        getOrRegisterViewContainerModel(viewContainer) {
            var _a;
            let viewContainerModel = (_a = this.viewContainerModels.get(viewContainer)) === null || _a === void 0 ? void 0 : _a.viewContainerModel;
            if (!viewContainerModel) {
                const disposables = new lifecycle_1.DisposableStore();
                viewContainerModel = disposables.add(this.instantiationService.createInstance(viewContainerModel_1.ViewContainerModel, viewContainer));
                this.onDidChangeActiveViews({ added: viewContainerModel.activeViewDescriptors, removed: [] });
                viewContainerModel.onDidChangeActiveViewDescriptors(changed => this.onDidChangeActiveViews(changed), this, disposables);
                disposables.add(this.registerResetViewContainerAction(viewContainer));
                this.viewContainerModels.set(viewContainer, { viewContainerModel: viewContainerModel, disposable: disposables });
                // Register all views that were statically registered to this container
                // Potentially, this is registering something that was handled by another container
                // addViews() handles this by filtering views that are already registered
                this.onDidRegisterViews([{ views: this.viewsRegistry.getViews(viewContainer), viewContainer }]);
                // Add views that were registered prior to this view container
                const viewsToRegister = this.getViewsByContainer(viewContainer).filter(view => this.getDefaultContainerById(view.id) !== viewContainer);
                if (viewsToRegister.length) {
                    this.addViews(viewContainer, viewsToRegister);
                    viewsToRegister.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(!!viewDescriptor.canMoveView));
                }
            }
            return viewContainerModel;
        }
        onDidDeregisterViewContainer(viewContainer) {
            const viewContainerModelItem = this.viewContainerModels.get(viewContainer);
            if (viewContainerModelItem) {
                viewContainerModelItem.disposable.dispose();
                this.viewContainerModels.delete(viewContainer);
            }
        }
        onDidChangeActiveViews({ added, removed }) {
            added.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(true));
            removed.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(false));
        }
        registerResetViewContainerAction(viewContainer) {
            const that = this;
            return actions_1.registerAction2(class ResetViewLocationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `${viewContainer.id}.resetViewContainerLocation`,
                        title: {
                            original: 'Reset Location',
                            value: nls_1.localize('resetViewLocation', "Reset Location")
                        },
                        menu: [{
                                id: actions_1.MenuId.ViewContainerTitleContext,
                                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('container', viewContainer.id), contextkey_1.ContextKeyExpr.equals(`${viewContainer.id}.defaultViewContainerLocation`, false)))
                            }],
                    });
                }
                run() {
                    that.moveViewContainerToLocation(viewContainer, that.getDefaultViewContainerLocation(viewContainer));
                }
            });
        }
        addViews(container, views, expandViews) {
            // Update in memory cache
            views.forEach(view => {
                this.cachedViewInfo.set(view.id, { containerId: container.id });
                this.getOrCreateDefaultViewLocationContextKey(view).set(this.getDefaultContainerById(view.id) === container);
            });
            this.getViewContainerModel(container).add(views.map(view => { return { viewDescriptor: view, collapsed: expandViews ? false : undefined }; }));
        }
        removeViews(container, views) {
            // Set view default location keys to false
            views.forEach(view => this.getOrCreateDefaultViewLocationContextKey(view).set(false));
            // Remove the views
            this.getViewContainerModel(container).remove(views);
        }
        getOrCreateActiveViewContextKey(viewDescriptor) {
            const activeContextKeyId = `${viewDescriptor.id}.active`;
            let contextKey = this.activeViewContextKeys.get(activeContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(activeContextKeyId, false).bindTo(this.contextKeyService);
                this.activeViewContextKeys.set(activeContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateMovableViewContextKey(viewDescriptor) {
            const movableViewContextKeyId = `${viewDescriptor.id}.canMove`;
            let contextKey = this.movableViewContextKeys.get(movableViewContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(movableViewContextKeyId, false).bindTo(this.contextKeyService);
                this.movableViewContextKeys.set(movableViewContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateDefaultViewLocationContextKey(viewDescriptor) {
            const defaultViewLocationContextKeyId = `${viewDescriptor.id}.defaultViewLocation`;
            let contextKey = this.defaultViewLocationContextKeys.get(defaultViewLocationContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(defaultViewLocationContextKeyId, false).bindTo(this.contextKeyService);
                this.defaultViewLocationContextKeys.set(defaultViewLocationContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateDefaultViewContainerLocationContextKey(viewContainer) {
            const defaultViewContainerLocationContextKeyId = `${viewContainer.id}.defaultViewContainerLocation`;
            let contextKey = this.defaultViewContainerLocationContextKeys.get(defaultViewContainerLocationContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(defaultViewContainerLocationContextKeyId, false).bindTo(this.contextKeyService);
                this.defaultViewContainerLocationContextKeys.set(defaultViewContainerLocationContextKeyId, contextKey);
            }
            return contextKey;
        }
    };
    ViewDescriptorService.CACHED_VIEW_POSITIONS = 'views.cachedViewPositions';
    ViewDescriptorService.CACHED_VIEW_CONTAINER_LOCATIONS = 'views.cachedViewContainerLocations';
    ViewDescriptorService.COMMON_CONTAINER_ID_PREFIX = 'workbench.views.service';
    ViewDescriptorService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, extensions_1.IExtensionService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ViewDescriptorService);
    exports.ViewDescriptorService = ViewDescriptorService;
    extensions_2.registerSingleton(views_1.IViewDescriptorService, ViewDescriptorService);
});
//# __sourceMappingURL=viewDescriptorService.js.map