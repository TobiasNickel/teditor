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
define(["require", "exports", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/userDataSync/common/storageKeys", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/map", "vs/base/common/resources"], function (require, exports, views_1, contextkey_1, storage_1, platform_1, lifecycle_1, event_1, storageKeys_1, instantiation_1, uri_1, arrays_1, types_1, map_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContainerModel = void 0;
    class CounterSet {
        constructor() {
            this.map = new Map();
        }
        add(value) {
            this.map.set(value, (this.map.get(value) || 0) + 1);
            return this;
        }
        delete(value) {
            let counter = this.map.get(value) || 0;
            if (counter === 0) {
                return false;
            }
            counter--;
            if (counter === 0) {
                this.map.delete(value);
            }
            else {
                this.map.set(value, counter);
            }
            return true;
        }
        has(value) {
            return this.map.has(value);
        }
    }
    let ViewDescriptorsState = class ViewDescriptorsState extends lifecycle_1.Disposable {
        constructor(viewContainerStorageId, storageService, storageKeysSyncRegistryService) {
            super();
            this.storageService = storageService;
            this._onDidChangeStoredState = this._register(new event_1.Emitter());
            this.onDidChangeStoredState = this._onDidChangeStoredState.event;
            this.globalViewsStateStorageId = `${viewContainerStorageId}.hidden`;
            this.workspaceViewsStateStorageId = viewContainerStorageId;
            storageKeysSyncRegistryService.registerStorageKey({ key: this.globalViewsStateStorageId, version: 1 });
            this._register(this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
            this.state = this.initialize();
        }
        set(id, state) {
            this.state.set(id, state);
        }
        get(id) {
            return this.state.get(id);
        }
        updateState(viewDescriptors) {
            this.updateWorkspaceState(viewDescriptors);
            this.updateGlobalState(viewDescriptors);
        }
        updateWorkspaceState(viewDescriptors) {
            const storedViewsStates = JSON.parse(this.storageService.get(this.workspaceViewsStateStorageId, 1 /* WORKSPACE */, '{}'));
            for (const viewDescriptor of viewDescriptors) {
                const viewState = this.state.get(viewDescriptor.id);
                if (viewState) {
                    storedViewsStates[viewDescriptor.id] = {
                        collapsed: !!viewState.collapsed,
                        isHidden: !viewState.visibleWorkspace,
                        size: viewState.size,
                        order: viewDescriptor.workspace && viewState ? viewState.order : undefined
                    };
                }
            }
            if (Object.keys(storedViewsStates).length > 0) {
                this.storageService.store(this.workspaceViewsStateStorageId, JSON.stringify(storedViewsStates), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(this.workspaceViewsStateStorageId, 1 /* WORKSPACE */);
            }
        }
        updateGlobalState(viewDescriptors) {
            const storedGlobalState = this.getStoredGlobalState();
            for (const viewDescriptor of viewDescriptors) {
                const state = this.state.get(viewDescriptor.id);
                storedGlobalState.set(viewDescriptor.id, {
                    id: viewDescriptor.id,
                    isHidden: state && viewDescriptor.canToggleVisibility ? !state.visibleGlobal : false,
                    order: !viewDescriptor.workspace && state ? state.order : undefined
                });
            }
            this.setStoredGlobalState(storedGlobalState);
        }
        onDidStorageChange(e) {
            if (e.key === this.globalViewsStateStorageId && e.scope === 0 /* GLOBAL */
                && this.globalViewsStatesValue !== this.getStoredGlobalViewsStatesValue() /* This checks if current window changed the value or not */) {
                this._globalViewsStatesValue = undefined;
                const storedViewsVisibilityStates = this.getStoredGlobalState();
                const changedStates = [];
                for (const [id, storedState] of storedViewsVisibilityStates) {
                    const state = this.state.get(id);
                    if (state) {
                        if (state.visibleGlobal !== !storedState.isHidden) {
                            changedStates.push({ id, visible: !storedState.isHidden });
                        }
                    }
                }
                if (changedStates.length) {
                    this._onDidChangeStoredState.fire(changedStates);
                }
            }
        }
        initialize() {
            const viewStates = new Map();
            const workspaceViewsStates = JSON.parse(this.storageService.get(this.workspaceViewsStateStorageId, 1 /* WORKSPACE */, '{}'));
            for (const id of Object.keys(workspaceViewsStates)) {
                const workspaceViewState = workspaceViewsStates[id];
                viewStates.set(id, {
                    active: false,
                    visibleGlobal: undefined,
                    visibleWorkspace: types_1.isUndefined(workspaceViewState.isHidden) ? undefined : !workspaceViewState.isHidden,
                    collapsed: workspaceViewState.collapsed,
                    order: workspaceViewState.order,
                    size: workspaceViewState.size,
                });
            }
            // Migrate to `viewletStateStorageId`
            const value = this.storageService.get(this.globalViewsStateStorageId, 1 /* WORKSPACE */, '[]');
            const { state: workspaceVisibilityStates } = this.parseStoredGlobalState(value);
            if (workspaceVisibilityStates.size > 0) {
                for (const { id, isHidden } of map_1.values(workspaceVisibilityStates)) {
                    let viewState = viewStates.get(id);
                    // Not migrated to `viewletStateStorageId`
                    if (viewState) {
                        if (types_1.isUndefined(viewState.visibleWorkspace)) {
                            viewState.visibleWorkspace = !isHidden;
                        }
                    }
                    else {
                        viewStates.set(id, {
                            active: false,
                            collapsed: undefined,
                            visibleGlobal: undefined,
                            visibleWorkspace: !isHidden,
                        });
                    }
                }
                this.storageService.remove(this.globalViewsStateStorageId, 1 /* WORKSPACE */);
            }
            const { state, hasDuplicates } = this.parseStoredGlobalState(this.globalViewsStatesValue);
            if (hasDuplicates) {
                this.setStoredGlobalState(state);
            }
            for (const { id, isHidden, order } of map_1.values(state)) {
                let viewState = viewStates.get(id);
                if (viewState) {
                    viewState.visibleGlobal = !isHidden;
                    if (!types_1.isUndefined(order)) {
                        viewState.order = order;
                    }
                }
                else {
                    viewStates.set(id, {
                        active: false,
                        visibleGlobal: !isHidden,
                        order,
                        collapsed: undefined,
                        visibleWorkspace: undefined,
                    });
                }
            }
            return viewStates;
        }
        getStoredGlobalState() {
            return this.parseStoredGlobalState(this.globalViewsStatesValue).state;
        }
        setStoredGlobalState(storedGlobalState) {
            this.globalViewsStatesValue = JSON.stringify(map_1.values(storedGlobalState));
        }
        parseStoredGlobalState(value) {
            const storedValue = JSON.parse(value);
            let hasDuplicates = false;
            const state = storedValue.reduce((result, storedState) => {
                if (typeof storedState === 'string' /* migration */) {
                    hasDuplicates = hasDuplicates || result.has(storedState);
                    result.set(storedState, { id: storedState, isHidden: true });
                }
                else {
                    hasDuplicates = hasDuplicates || result.has(storedState.id);
                    result.set(storedState.id, storedState);
                }
                return result;
            }, new Map());
            return { state, hasDuplicates };
        }
        get globalViewsStatesValue() {
            if (!this._globalViewsStatesValue) {
                this._globalViewsStatesValue = this.getStoredGlobalViewsStatesValue();
            }
            return this._globalViewsStatesValue;
        }
        set globalViewsStatesValue(globalViewsStatesValue) {
            if (this.globalViewsStatesValue !== globalViewsStatesValue) {
                this._globalViewsStatesValue = globalViewsStatesValue;
                this.setStoredGlobalViewsStatesValue(globalViewsStatesValue);
            }
        }
        getStoredGlobalViewsStatesValue() {
            return this.storageService.get(this.globalViewsStateStorageId, 0 /* GLOBAL */, '[]');
        }
        setStoredGlobalViewsStatesValue(value) {
            this.storageService.store(this.globalViewsStateStorageId, value, 0 /* GLOBAL */);
        }
    };
    ViewDescriptorsState = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ViewDescriptorsState);
    let ViewContainerModel = class ViewContainerModel extends lifecycle_1.Disposable {
        constructor(container, instantiationService, contextKeyService) {
            super();
            this.container = container;
            this.contextKeyService = contextKeyService;
            this.contextKeys = new CounterSet();
            this.viewDescriptorItems = [];
            this._onDidChangeContainerInfo = this._register(new event_1.Emitter());
            this.onDidChangeContainerInfo = this._onDidChangeContainerInfo.event;
            this._onDidChangeAllViewDescriptors = this._register(new event_1.Emitter());
            this.onDidChangeAllViewDescriptors = this._onDidChangeAllViewDescriptors.event;
            this._onDidChangeActiveViewDescriptors = this._register(new event_1.Emitter());
            this.onDidChangeActiveViewDescriptors = this._onDidChangeActiveViewDescriptors.event;
            this._onDidAddVisibleViewDescriptors = this._register(new event_1.Emitter());
            this.onDidAddVisibleViewDescriptors = this._onDidAddVisibleViewDescriptors.event;
            this._onDidRemoveVisibleViewDescriptors = this._register(new event_1.Emitter());
            this.onDidRemoveVisibleViewDescriptors = this._onDidRemoveVisibleViewDescriptors.event;
            this._onDidMoveVisibleViewDescriptors = this._register(new event_1.Emitter());
            this.onDidMoveVisibleViewDescriptors = this._onDidMoveVisibleViewDescriptors.event;
            this._register(event_1.Event.filter(contextKeyService.onDidChangeContext, e => e.affectsSome(this.contextKeys))(() => this.onDidChangeContext()));
            this.viewDescriptorsState = this._register(instantiationService.createInstance(ViewDescriptorsState, container.storageId || `${container.id}.state`));
            this._register(this.viewDescriptorsState.onDidChangeStoredState(items => this.updateVisibility(items)));
            this._register(event_1.Event.any(this.onDidAddVisibleViewDescriptors, this.onDidRemoveVisibleViewDescriptors, this.onDidMoveVisibleViewDescriptors)(() => {
                this.viewDescriptorsState.updateState(this.allViewDescriptors);
                this.updateContainerInfo();
            }));
            this.updateContainerInfo();
        }
        get title() { return this._title; }
        get icon() { return this._icon; }
        // All View Descriptors
        get allViewDescriptors() { return this.viewDescriptorItems.map(item => item.viewDescriptor); }
        // Active View Descriptors
        get activeViewDescriptors() { return this.viewDescriptorItems.filter(item => item.state.active).map(item => item.viewDescriptor); }
        // Visible View Descriptors
        get visibleViewDescriptors() { return this.viewDescriptorItems.filter(item => this.isViewDescriptorVisible(item)).map(item => item.viewDescriptor); }
        updateContainerInfo() {
            var _a, _b, _c;
            /* Use default container info if one of the visible view descriptors belongs to the current container by default */
            const useDefaultContainerInfo = this.container.alwaysUseContainerInfo || this.visibleViewDescriptors.length === 0 || this.visibleViewDescriptors.some(v => platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getViewContainer(v.id) === this.container);
            const title = useDefaultContainerInfo ? this.container.name : ((_a = this.visibleViewDescriptors[0]) === null || _a === void 0 ? void 0 : _a.containerTitle) || ((_b = this.visibleViewDescriptors[0]) === null || _b === void 0 ? void 0 : _b.name) || '';
            let titleChanged = false;
            if (this._title !== title) {
                this._title = title;
                titleChanged = true;
            }
            const icon = useDefaultContainerInfo ? this.container.icon : ((_c = this.visibleViewDescriptors[0]) === null || _c === void 0 ? void 0 : _c.containerIcon) || 'codicon-window';
            let iconChanged = false;
            if (uri_1.URI.isUri(icon) && uri_1.URI.isUri(this._icon) ? resources_1.isEqual(icon, this._icon) : this._icon !== icon) {
                this._icon = icon;
                iconChanged = true;
            }
            if (titleChanged || iconChanged) {
                this._onDidChangeContainerInfo.fire({ title: titleChanged, icon: iconChanged });
            }
        }
        isVisible(id) {
            const viewDescriptorItem = this.viewDescriptorItems.filter(v => v.viewDescriptor.id === id)[0];
            if (!viewDescriptorItem) {
                throw new Error(`Unknown view ${id}`);
            }
            return this.isViewDescriptorVisible(viewDescriptorItem);
        }
        setVisible(id, visible, size) {
            this.updateVisibility([{ id, visible, size }]);
        }
        updateVisibility(viewDescriptors) {
            const added = [];
            const removed = [];
            for (const { visibleIndex, viewDescriptorItem, visible, size } of viewDescriptors.map(({ id, visible, size }) => (Object.assign(Object.assign({}, this.find(id)), { visible, size })))) {
                const viewDescriptor = viewDescriptorItem.viewDescriptor;
                if (!viewDescriptor.canToggleVisibility) {
                    continue;
                }
                if (this.isViewDescriptorVisibleWhenActive(viewDescriptorItem) === visible) {
                    continue;
                }
                if (viewDescriptor.workspace) {
                    viewDescriptorItem.state.visibleWorkspace = visible;
                }
                else {
                    viewDescriptorItem.state.visibleGlobal = visible;
                }
                if (typeof viewDescriptorItem.state.size === 'number') {
                    viewDescriptorItem.state.size = size;
                }
                if (this.isViewDescriptorVisible(viewDescriptorItem) !== visible) {
                    // do not add events if visibility is not changed
                    continue;
                }
                if (visible) {
                    added.push({ index: visibleIndex, viewDescriptor, size: viewDescriptorItem.state.size, collapsed: !!viewDescriptorItem.state.collapsed });
                }
                else {
                    removed.push({ index: visibleIndex, viewDescriptor });
                }
            }
            if (added.length) {
                this._onDidAddVisibleViewDescriptors.fire(added);
            }
            if (removed.length) {
                this._onDidRemoveVisibleViewDescriptors.fire(removed);
            }
        }
        isCollapsed(id) {
            return !!this.find(id).viewDescriptorItem.state.collapsed;
        }
        setCollapsed(id, collapsed) {
            const { viewDescriptorItem } = this.find(id);
            if (viewDescriptorItem.state.collapsed !== collapsed) {
                viewDescriptorItem.state.collapsed = collapsed;
            }
            this.viewDescriptorsState.updateState(this.allViewDescriptors);
        }
        getSize(id) {
            return this.find(id).viewDescriptorItem.state.size;
        }
        setSize(id, size) {
            const { viewDescriptorItem } = this.find(id);
            if (viewDescriptorItem.state.size !== size) {
                viewDescriptorItem.state.size = size;
            }
            this.viewDescriptorsState.updateState(this.allViewDescriptors);
        }
        move(from, to) {
            const fromIndex = arrays_1.firstIndex(this.viewDescriptorItems, v => v.viewDescriptor.id === from);
            const toIndex = arrays_1.firstIndex(this.viewDescriptorItems, v => v.viewDescriptor.id === to);
            const fromViewDescriptor = this.viewDescriptorItems[fromIndex];
            const toViewDescriptor = this.viewDescriptorItems[toIndex];
            arrays_1.move(this.viewDescriptorItems, fromIndex, toIndex);
            for (let index = 0; index < this.viewDescriptorItems.length; index++) {
                this.viewDescriptorItems[index].state.order = index;
            }
            this._onDidMoveVisibleViewDescriptors.fire({
                from: { index: fromIndex, viewDescriptor: fromViewDescriptor.viewDescriptor },
                to: { index: toIndex, viewDescriptor: toViewDescriptor.viewDescriptor }
            });
        }
        add(addedViewDescriptorStates) {
            const addedItems = [];
            const addedActiveDescriptors = [];
            const addedVisibleItems = [];
            for (const addedViewDescriptorState of addedViewDescriptorStates) {
                const viewDescriptor = addedViewDescriptorState.viewDescriptor;
                if (viewDescriptor.when) {
                    for (const key of viewDescriptor.when.keys()) {
                        this.contextKeys.add(key);
                    }
                }
                let state = this.viewDescriptorsState.get(viewDescriptor.id);
                if (state) {
                    // set defaults if not set
                    if (viewDescriptor.workspace) {
                        state.visibleWorkspace = types_1.isUndefinedOrNull(state.visibleWorkspace) ? !viewDescriptor.hideByDefault : state.visibleWorkspace;
                    }
                    else {
                        state.visibleGlobal = types_1.isUndefinedOrNull(state.visibleGlobal) ? !viewDescriptor.hideByDefault : state.visibleGlobal;
                    }
                    state.collapsed = types_1.isUndefinedOrNull(addedViewDescriptorState.collapsed) ? (types_1.isUndefinedOrNull(state.collapsed) ? !!viewDescriptor.collapsed : state.collapsed) : addedViewDescriptorState.collapsed;
                }
                else {
                    state = {
                        active: false,
                        visibleGlobal: !viewDescriptor.hideByDefault,
                        visibleWorkspace: !viewDescriptor.hideByDefault,
                        collapsed: types_1.isUndefinedOrNull(addedViewDescriptorState.collapsed) ? !!viewDescriptor.collapsed : addedViewDescriptorState.collapsed,
                    };
                }
                this.viewDescriptorsState.set(viewDescriptor.id, state);
                state.active = this.contextKeyService.contextMatchesRules(viewDescriptor.when);
                addedItems.push({ viewDescriptor, state });
                if (state.active) {
                    addedActiveDescriptors.push(viewDescriptor);
                }
            }
            this.viewDescriptorItems.push(...addedItems);
            this.viewDescriptorItems.sort(this.compareViewDescriptors.bind(this));
            for (const viewDescriptorItem of addedItems) {
                if (this.isViewDescriptorVisible(viewDescriptorItem)) {
                    const { visibleIndex } = this.find(viewDescriptorItem.viewDescriptor.id);
                    addedVisibleItems.push({ index: visibleIndex, viewDescriptor: viewDescriptorItem.viewDescriptor, size: viewDescriptorItem.state.size, collapsed: !!viewDescriptorItem.state.collapsed });
                }
            }
            this._onDidChangeAllViewDescriptors.fire({ added: addedItems.map(({ viewDescriptor }) => viewDescriptor), removed: [] });
            if (addedActiveDescriptors.length) {
                this._onDidChangeActiveViewDescriptors.fire(({ added: addedActiveDescriptors, removed: [] }));
            }
            if (addedVisibleItems.length) {
                this._onDidAddVisibleViewDescriptors.fire(addedVisibleItems);
            }
        }
        remove(viewDescriptors) {
            const removed = [];
            const removedItems = [];
            const removedActiveDescriptors = [];
            const removedVisibleItems = [];
            for (const viewDescriptor of viewDescriptors) {
                if (viewDescriptor.when) {
                    for (const key of viewDescriptor.when.keys()) {
                        this.contextKeys.delete(key);
                    }
                }
                const index = arrays_1.firstIndex(this.viewDescriptorItems, i => i.viewDescriptor.id === viewDescriptor.id);
                if (index !== -1) {
                    removed.push(viewDescriptor);
                    const viewDescriptorItem = this.viewDescriptorItems[index];
                    if (viewDescriptorItem.state.active) {
                        removedActiveDescriptors.push(viewDescriptorItem.viewDescriptor);
                    }
                    if (this.isViewDescriptorVisible(viewDescriptorItem)) {
                        const { visibleIndex } = this.find(viewDescriptorItem.viewDescriptor.id);
                        removedVisibleItems.push({ index: visibleIndex, viewDescriptor: viewDescriptorItem.viewDescriptor });
                    }
                    removedItems.push(viewDescriptorItem);
                }
            }
            removedItems.forEach(item => this.viewDescriptorItems.splice(this.viewDescriptorItems.indexOf(item), 1));
            this._onDidChangeAllViewDescriptors.fire({ added: [], removed });
            if (removedActiveDescriptors.length) {
                this._onDidChangeActiveViewDescriptors.fire(({ added: [], removed: removedActiveDescriptors }));
            }
            if (removedVisibleItems.length) {
                this._onDidRemoveVisibleViewDescriptors.fire(removedVisibleItems);
            }
        }
        onDidChangeContext() {
            const addedActiveItems = [];
            const removedActiveItems = [];
            const removedVisibleItems = [];
            const addedVisibleItems = [];
            for (const item of this.viewDescriptorItems) {
                const wasActive = item.state.active;
                const wasVisible = this.isViewDescriptorVisible(item);
                const isActive = this.contextKeyService.contextMatchesRules(item.viewDescriptor.when);
                if (wasActive !== isActive) {
                    if (isActive) {
                        addedActiveItems.push({ item, wasVisible });
                    }
                    else {
                        removedActiveItems.push({ item, wasVisible });
                    }
                }
            }
            for (const { item, wasVisible } of removedActiveItems) {
                if (wasVisible) {
                    const { visibleIndex } = this.find(item.viewDescriptor.id);
                    removedVisibleItems.push({ index: visibleIndex, viewDescriptor: item.viewDescriptor });
                }
            }
            // Update the State
            removedActiveItems.forEach(({ item }) => item.state.active = false);
            addedActiveItems.forEach(({ item }) => item.state.active = true);
            for (const { item, wasVisible } of addedActiveItems) {
                if (wasVisible !== this.isViewDescriptorVisibleWhenActive(item)) {
                    const { visibleIndex } = this.find(item.viewDescriptor.id);
                    addedVisibleItems.push({ index: visibleIndex, viewDescriptor: item.viewDescriptor, size: item.state.size, collapsed: !!item.state.collapsed });
                }
            }
            if (addedActiveItems.length || removedActiveItems.length) {
                this._onDidChangeActiveViewDescriptors.fire(({ added: addedActiveItems.map(({ item }) => item.viewDescriptor), removed: removedActiveItems.map(({ item }) => item.viewDescriptor) }));
            }
            if (removedVisibleItems.length) {
                this._onDidRemoveVisibleViewDescriptors.fire(removedVisibleItems);
            }
            if (addedVisibleItems.length) {
                this._onDidAddVisibleViewDescriptors.fire(addedVisibleItems);
            }
        }
        isViewDescriptorVisible(viewDescriptorItem) {
            if (!viewDescriptorItem.state.active) {
                return false;
            }
            return this.isViewDescriptorVisibleWhenActive(viewDescriptorItem);
        }
        isViewDescriptorVisibleWhenActive(viewDescriptorItem) {
            if (viewDescriptorItem.viewDescriptor.workspace) {
                return !!viewDescriptorItem.state.visibleWorkspace;
            }
            return !!viewDescriptorItem.state.visibleGlobal;
        }
        find(id) {
            for (let i = 0, visibleIndex = 0; i < this.viewDescriptorItems.length; i++) {
                const viewDescriptorItem = this.viewDescriptorItems[i];
                if (viewDescriptorItem.viewDescriptor.id === id) {
                    return { index: i, visibleIndex, viewDescriptorItem: viewDescriptorItem };
                }
                if (this.isViewDescriptorVisible(viewDescriptorItem)) {
                    visibleIndex++;
                }
            }
            throw new Error(`view descriptor ${id} not found`);
        }
        compareViewDescriptors(a, b) {
            if (a.viewDescriptor.id === b.viewDescriptor.id) {
                return 0;
            }
            return (this.getViewOrder(a) - this.getViewOrder(b)) || this.getGroupOrderResult(a.viewDescriptor, b.viewDescriptor);
        }
        getViewOrder(viewDescriptorItem) {
            const viewOrder = typeof viewDescriptorItem.state.order === 'number' ? viewDescriptorItem.state.order : viewDescriptorItem.viewDescriptor.order;
            return typeof viewOrder === 'number' ? viewOrder : Number.MAX_VALUE;
        }
        getGroupOrderResult(a, b) {
            if (!a.group || !b.group) {
                return 0;
            }
            if (a.group === b.group) {
                return 0;
            }
            return a.group < b.group ? -1 : 1;
        }
    };
    ViewContainerModel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService)
    ], ViewContainerModel);
    exports.ViewContainerModel = ViewContainerModel;
});
//# __sourceMappingURL=viewContainerModel.js.map