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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/compositeBarActions", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/widget", "vs/base/common/types", "vs/base/common/event", "vs/workbench/common/views", "vs/workbench/browser/dnd"], function (require, exports, nls, errors_1, arrays, lifecycle_1, instantiation_1, actionbar_1, compositeBarActions_1, dom_1, mouseEvent_1, contextView_1, widget_1, types_1, event_1, views_1, dnd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeBar = exports.CompositeDragAndDrop = void 0;
    class CompositeDragAndDrop {
        constructor(viewDescriptorService, targetContainerLocation, openComposite, moveComposite, getItems) {
            this.viewDescriptorService = viewDescriptorService;
            this.targetContainerLocation = targetContainerLocation;
            this.openComposite = openComposite;
            this.moveComposite = moveComposite;
            this.getItems = getItems;
        }
        drop(data, targetCompositeId, originalEvent, before) {
            const dragData = data.getData();
            if (dragData.type === 'composite') {
                const currentContainer = this.viewDescriptorService.getViewContainerById(dragData.id);
                const currentLocation = this.viewDescriptorService.getViewContainerLocation(currentContainer);
                // ... on the same composite bar
                if (currentLocation === this.targetContainerLocation) {
                    if (targetCompositeId) {
                        this.moveComposite(dragData.id, targetCompositeId, before);
                    }
                }
                // ... on a different composite bar
                else {
                    const viewsToMove = this.viewDescriptorService.getViewContainerModel(currentContainer).allViewDescriptors;
                    if (viewsToMove.some(v => !v.canMoveView)) {
                        return;
                    }
                    this.viewDescriptorService.moveViewContainerToLocation(currentContainer, this.targetContainerLocation, this.getTargetIndex(targetCompositeId, before));
                }
            }
            if (dragData.type === 'view') {
                const viewToMove = this.viewDescriptorService.getViewDescriptorById(dragData.id);
                if (viewToMove && viewToMove.canMoveView) {
                    this.viewDescriptorService.moveViewToLocation(viewToMove, this.targetContainerLocation);
                    const newContainer = this.viewDescriptorService.getViewContainerByViewId(viewToMove.id);
                    if (targetCompositeId) {
                        this.moveComposite(newContainer.id, targetCompositeId, before);
                    }
                    this.openComposite(newContainer.id, true).then(composite => {
                        if (composite) {
                            composite.openView(viewToMove.id, true);
                        }
                    });
                }
            }
        }
        onDragEnter(data, targetCompositeId, originalEvent) {
            return this.canDrop(data, targetCompositeId);
        }
        onDragOver(data, targetCompositeId, originalEvent) {
            return this.canDrop(data, targetCompositeId);
        }
        getTargetIndex(targetId, before2d) {
            if (!targetId) {
                return undefined;
            }
            const items = this.getItems();
            const before = this.targetContainerLocation === views_1.ViewContainerLocation.Panel ? before2d === null || before2d === void 0 ? void 0 : before2d.horizontallyBefore : before2d === null || before2d === void 0 ? void 0 : before2d.verticallyBefore;
            return items.filter(o => o.visible).findIndex(o => o.id === targetId) + (before ? 0 : 1);
        }
        canDrop(data, targetCompositeId) {
            const dragData = data.getData();
            if (dragData.type === 'composite') {
                // Dragging a composite
                const currentContainer = this.viewDescriptorService.getViewContainerById(dragData.id);
                const currentLocation = this.viewDescriptorService.getViewContainerLocation(currentContainer);
                // ... to the same composite location
                if (currentLocation === this.targetContainerLocation) {
                    return true;
                }
                // ... to another composite location
                const draggedViews = this.viewDescriptorService.getViewContainerModel(currentContainer).allViewDescriptors;
                // ... all views must be movable
                // Prevent moving scm explicitly TODO@joaomoreno remove when scm is moveable
                return !draggedViews.some(v => !v.canMoveView) && currentContainer.id !== 'workbench.view.scm';
            }
            else {
                // Dragging an individual view
                const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dragData.id);
                // ... that cannot move
                if (!viewDescriptor || !viewDescriptor.canMoveView) {
                    return false;
                }
                // ... to create a view container
                return true;
            }
        }
    }
    exports.CompositeDragAndDrop = CompositeDragAndDrop;
    let CompositeBar = class CompositeBar extends widget_1.Widget {
        constructor(items, options, instantiationService, contextMenuService) {
            super();
            this.options = options;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.model = new CompositeBarModel(items, options);
            this.visibleComposites = [];
            this.compositeSizeInBar = new Map();
            this.computeSizes(this.model.visibleItems);
        }
        getCompositeBarItems() {
            return [...this.model.items];
        }
        setCompositeBarItems(items) {
            if (this.model.setItems(items)) {
                this.updateCompositeSwitcher();
            }
        }
        getPinnedComposites() {
            return this.model.pinnedItems;
        }
        getVisibleComposites() {
            return this.model.visibleItems;
        }
        create(parent) {
            const actionBarDiv = parent.appendChild(dom_1.$('.composite-bar'));
            this.compositeSwitcherBar = this._register(new actionbar_1.ActionBar(actionBarDiv, {
                actionViewItemProvider: (action) => {
                    if (action instanceof compositeBarActions_1.CompositeOverflowActivityAction) {
                        return this.compositeOverflowActionViewItem;
                    }
                    const item = this.model.findItem(action.id);
                    return item && this.instantiationService.createInstance(compositeBarActions_1.CompositeActionViewItem, action, item.pinnedAction, (compositeId) => this.options.getContextMenuActionsForComposite(compositeId), () => this.getContextMenuActions(), this.options.colors, this.options.icon, this.options.dndHandler, this);
                },
                orientation: this.options.orientation,
                ariaLabel: nls.localize('activityBarAriaLabel', "Active View Switcher"),
                animated: false,
            }));
            // Contextmenu for composites
            this._register(dom_1.addDisposableListener(parent, dom_1.EventType.CONTEXT_MENU, e => this.showContextMenu(e)));
            let insertDropBefore = undefined;
            // Register a drop target on the whole bar to prevent forbidden feedback
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(parent, {
                onDragOver: (e) => {
                    // don't add feedback if this is over the composite bar actions or there are no actions
                    const visibleItems = this.getVisibleComposites();
                    if (!visibleItems.length || (e.eventData.target && dom_1.isAncestor(e.eventData.target, actionBarDiv))) {
                        insertDropBefore = this.updateFromDragging(parent, false, false);
                        return;
                    }
                    const insertAtFront = this.insertAtFront(actionBarDiv, e.eventData);
                    const target = insertAtFront ? visibleItems[0] : visibleItems[visibleItems.length - 1];
                    const validDropTarget = this.options.dndHandler.onDragOver(e.dragAndDropData, target.id, e.eventData);
                    dnd_1.toggleDropEffect(e.eventData.dataTransfer, 'move', validDropTarget);
                    insertDropBefore = this.updateFromDragging(parent, validDropTarget, insertAtFront);
                },
                onDragLeave: (e) => {
                    insertDropBefore = this.updateFromDragging(parent, false, false);
                },
                onDragEnd: (e) => {
                    insertDropBefore = this.updateFromDragging(parent, false, false);
                },
                onDrop: (e) => {
                    const visibleItems = this.getVisibleComposites();
                    if (visibleItems.length) {
                        const target = this.insertAtFront(actionBarDiv, e.eventData) ? visibleItems[0] : visibleItems[visibleItems.length - 1];
                        this.options.dndHandler.drop(e.dragAndDropData, target.id, e.eventData, insertDropBefore);
                    }
                    insertDropBefore = this.updateFromDragging(parent, false, false);
                }
            }));
            return actionBarDiv;
        }
        insertAtFront(element, event) {
            const rect = element.getBoundingClientRect();
            const posX = event.clientX;
            const posY = event.clientY;
            switch (this.options.orientation) {
                case 0 /* HORIZONTAL */:
                case 1 /* HORIZONTAL_REVERSE */:
                    return posX < rect.left;
                case 2 /* VERTICAL */:
                case 3 /* VERTICAL_REVERSE */:
                    return posY < rect.top;
            }
        }
        updateFromDragging(element, showFeedback, front) {
            dom_1.toggleClass(element, 'dragged-over-head', showFeedback && front);
            dom_1.toggleClass(element, 'dragged-over-tail', showFeedback && !front);
            if (!showFeedback) {
                return undefined;
            }
            return { verticallyBefore: front, horizontallyBefore: front };
        }
        focus() {
            if (this.compositeSwitcherBar) {
                this.compositeSwitcherBar.focus();
            }
        }
        layout(dimension) {
            this.dimension = dimension;
            if (dimension.height === 0 || dimension.width === 0) {
                // Do not layout if not visible. Otherwise the size measurment would be computed wrongly
                return;
            }
            if (this.compositeSizeInBar.size === 0) {
                // Compute size of each composite by getting the size from the css renderer
                // Size is later used for overflow computation
                this.computeSizes(this.model.visibleItems);
            }
            this.updateCompositeSwitcher();
        }
        addComposite({ id, name, order, requestedIndex }) {
            // Add to the model
            if (this.model.add(id, name, order, requestedIndex)) {
                this.computeSizes([this.model.findItem(id)]);
                this.updateCompositeSwitcher();
            }
        }
        removeComposite(id) {
            // If it pinned, unpin it first
            if (this.isPinned(id)) {
                this.unpin(id);
            }
            // Remove from the model
            if (this.model.remove(id)) {
                this.updateCompositeSwitcher();
            }
        }
        hideComposite(id) {
            if (this.model.hide(id)) {
                this.resetActiveComposite(id);
                this.updateCompositeSwitcher();
            }
        }
        activateComposite(id) {
            const previousActiveItem = this.model.activeItem;
            if (this.model.activate(id)) {
                // Update if current composite is neither visible nor pinned
                // or previous active composite is not pinned
                if (this.visibleComposites.indexOf(id) === -1 || (!!this.model.activeItem && !this.model.activeItem.pinned) || (previousActiveItem && !previousActiveItem.pinned)) {
                    this.updateCompositeSwitcher();
                }
            }
        }
        deactivateComposite(id) {
            const previousActiveItem = this.model.activeItem;
            if (this.model.deactivate()) {
                if (previousActiveItem && !previousActiveItem.pinned) {
                    this.updateCompositeSwitcher();
                }
            }
        }
        showActivity(compositeId, badge, clazz, priority) {
            if (!badge) {
                throw errors_1.illegalArgument('badge');
            }
            if (typeof priority !== 'number') {
                priority = 0;
            }
            const activity = { badge, clazz, priority };
            this.model.addActivity(compositeId, activity);
            return lifecycle_1.toDisposable(() => this.model.removeActivity(compositeId, activity));
        }
        async pin(compositeId, open) {
            if (this.model.setPinned(compositeId, true)) {
                this.updateCompositeSwitcher();
                if (open) {
                    await this.options.openComposite(compositeId);
                    this.activateComposite(compositeId); // Activate after opening
                }
            }
        }
        unpin(compositeId) {
            if (this.model.setPinned(compositeId, false)) {
                this.updateCompositeSwitcher();
                this.resetActiveComposite(compositeId);
            }
        }
        resetActiveComposite(compositeId) {
            const defaultCompositeId = this.options.getDefaultCompositeId();
            // Case: composite is not the active one or the active one is a different one
            // Solv: we do nothing
            if (!this.model.activeItem || this.model.activeItem.id !== compositeId) {
                return;
            }
            // Deactivate itself
            this.deactivateComposite(compositeId);
            // Case: composite is not the default composite and default composite is still showing
            // Solv: we open the default composite
            if (defaultCompositeId !== compositeId && this.isPinned(defaultCompositeId)) {
                this.options.openComposite(defaultCompositeId);
            }
            // Case: we closed the last visible composite
            // Solv: we hide the part
            else if (this.visibleComposites.length === 1) {
                this.options.hidePart();
            }
            // Case: we closed the default composite
            // Solv: we open the next visible composite from top
            else {
                this.options.openComposite(this.visibleComposites.filter(cid => cid !== compositeId)[0]);
            }
        }
        isPinned(compositeId) {
            const item = this.model.findItem(compositeId);
            return item === null || item === void 0 ? void 0 : item.pinned;
        }
        move(compositeId, toCompositeId, before) {
            if (before !== undefined) {
                const fromIndex = this.model.items.findIndex(c => c.id === compositeId);
                let toIndex = this.model.items.findIndex(c => c.id === toCompositeId);
                if (fromIndex >= 0 && toIndex >= 0) {
                    if (!before && fromIndex > toIndex) {
                        toIndex++;
                    }
                    if (before && fromIndex < toIndex) {
                        toIndex--;
                    }
                    if (toIndex < this.model.items.length && toIndex >= 0 && toIndex !== fromIndex) {
                        if (this.model.move(this.model.items[fromIndex].id, this.model.items[toIndex].id)) {
                            // timeout helps to prevent artifacts from showing up
                            setTimeout(() => this.updateCompositeSwitcher(), 0);
                        }
                    }
                }
            }
            else {
                if (this.model.move(compositeId, toCompositeId)) {
                    // timeout helps to prevent artifacts from showing up
                    setTimeout(() => this.updateCompositeSwitcher(), 0);
                }
            }
        }
        getAction(compositeId) {
            const item = this.model.findItem(compositeId);
            return item === null || item === void 0 ? void 0 : item.activityAction;
        }
        computeSizes(items) {
            const size = this.options.compositeSize;
            if (size) {
                items.forEach(composite => this.compositeSizeInBar.set(composite.id, size));
            }
            else {
                const compositeSwitcherBar = this.compositeSwitcherBar;
                if (compositeSwitcherBar && this.dimension && this.dimension.height !== 0 && this.dimension.width !== 0) {
                    // Compute sizes only if visible. Otherwise the size measurment would be computed wrongly.
                    const currentItemsLength = compositeSwitcherBar.viewItems.length;
                    compositeSwitcherBar.push(items.map(composite => composite.activityAction));
                    items.map((composite, index) => this.compositeSizeInBar.set(composite.id, this.options.orientation === 2 /* VERTICAL */
                        ? compositeSwitcherBar.getHeight(currentItemsLength + index)
                        : compositeSwitcherBar.getWidth(currentItemsLength + index)));
                    items.forEach(() => compositeSwitcherBar.pull(compositeSwitcherBar.viewItems.length - 1));
                }
            }
        }
        updateCompositeSwitcher() {
            const compositeSwitcherBar = this.compositeSwitcherBar;
            if (!compositeSwitcherBar || !this.dimension) {
                return; // We have not been rendered yet so there is nothing to update.
            }
            let compositesToShow = this.model.visibleItems.filter(item => item.pinned
                || (this.model.activeItem && this.model.activeItem.id === item.id) /* Show the active composite even if it is not pinned */).map(item => item.id);
            // Ensure we are not showing more composites than we have height for
            let overflows = false;
            let maxVisible = compositesToShow.length;
            let size = 0;
            const limit = this.options.orientation === 2 /* VERTICAL */ ? this.dimension.height : this.dimension.width;
            for (let i = 0; i < compositesToShow.length && size <= limit; i++) {
                size += this.compositeSizeInBar.get(compositesToShow[i]);
                if (size > limit) {
                    maxVisible = i;
                }
            }
            overflows = compositesToShow.length > maxVisible;
            if (overflows) {
                size -= this.compositeSizeInBar.get(compositesToShow[maxVisible]);
                compositesToShow = compositesToShow.slice(0, maxVisible);
                size += this.options.overflowActionSize;
            }
            // Check if we need to make extra room for the overflow action
            if (size > limit) {
                size -= this.compositeSizeInBar.get(compositesToShow.pop());
            }
            // We always try show the active composite
            if (this.model.activeItem && compositesToShow.every(compositeId => !!this.model.activeItem && compositeId !== this.model.activeItem.id)) {
                const removedComposite = compositesToShow.pop();
                size = size - this.compositeSizeInBar.get(removedComposite) + this.compositeSizeInBar.get(this.model.activeItem.id);
                compositesToShow.push(this.model.activeItem.id);
            }
            // The active composite might have bigger size than the removed composite, check for overflow again
            if (size > limit) {
                compositesToShow.length ? compositesToShow.splice(compositesToShow.length - 2, 1) : compositesToShow.pop();
            }
            const visibleCompositesChange = !arrays.equals(compositesToShow, this.visibleComposites);
            // Pull out overflow action if there is a composite change so that we can add it to the end later
            if (this.compositeOverflowAction && visibleCompositesChange) {
                compositeSwitcherBar.pull(compositeSwitcherBar.length() - 1);
                this.compositeOverflowAction.dispose();
                this.compositeOverflowAction = undefined;
                if (this.compositeOverflowActionViewItem) {
                    this.compositeOverflowActionViewItem.dispose();
                }
                this.compositeOverflowActionViewItem = undefined;
            }
            // Pull out composites that overflow or got hidden
            const compositesToRemove = [];
            this.visibleComposites.forEach((compositeId, index) => {
                if (compositesToShow.indexOf(compositeId) === -1) {
                    compositesToRemove.push(index);
                }
            });
            compositesToRemove.reverse().forEach(index => {
                const actionViewItem = compositeSwitcherBar.viewItems[index];
                compositeSwitcherBar.pull(index);
                actionViewItem.dispose();
                this.visibleComposites.splice(index, 1);
            });
            // Update the positions of the composites
            compositesToShow.forEach((compositeId, newIndex) => {
                const currentIndex = this.visibleComposites.indexOf(compositeId);
                if (newIndex !== currentIndex) {
                    if (currentIndex !== -1) {
                        const actionViewItem = compositeSwitcherBar.viewItems[currentIndex];
                        compositeSwitcherBar.pull(currentIndex);
                        actionViewItem.dispose();
                        this.visibleComposites.splice(currentIndex, 1);
                    }
                    compositeSwitcherBar.push(this.model.findItem(compositeId).activityAction, { label: true, icon: this.options.icon, index: newIndex });
                    this.visibleComposites.splice(newIndex, 0, compositeId);
                }
            });
            // Add overflow action as needed
            if ((visibleCompositesChange && overflows)) {
                this.compositeOverflowAction = this.instantiationService.createInstance(compositeBarActions_1.CompositeOverflowActivityAction, () => {
                    if (this.compositeOverflowActionViewItem) {
                        this.compositeOverflowActionViewItem.showMenu();
                    }
                });
                this.compositeOverflowActionViewItem = this.instantiationService.createInstance(compositeBarActions_1.CompositeOverflowActivityActionViewItem, this.compositeOverflowAction, () => this.getOverflowingComposites(), () => this.model.activeItem ? this.model.activeItem.id : undefined, (compositeId) => {
                    var _a;
                    const item = this.model.findItem(compositeId);
                    return (_a = item === null || item === void 0 ? void 0 : item.activity[0]) === null || _a === void 0 ? void 0 : _a.badge;
                }, this.options.getOnCompositeClickAction, this.options.colors);
                compositeSwitcherBar.push(this.compositeOverflowAction, { label: false, icon: true });
            }
            this._onDidChange.fire();
        }
        getOverflowingComposites() {
            let overflowingIds = this.model.visibleItems.filter(item => item.pinned).map(item => item.id);
            // Show the active composite even if it is not pinned
            if (this.model.activeItem && !this.model.activeItem.pinned) {
                overflowingIds.push(this.model.activeItem.id);
            }
            overflowingIds = overflowingIds.filter(compositeId => this.visibleComposites.indexOf(compositeId) === -1);
            return this.model.visibleItems.filter(c => overflowingIds.indexOf(c.id) !== -1).map(item => { var _a; return { id: item.id, name: ((_a = this.getAction(item.id)) === null || _a === void 0 ? void 0 : _a.label) || item.name }; });
        }
        showContextMenu(e) {
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent(e);
            this.contextMenuService.showContextMenu({
                getAnchor: () => { return { x: event.posx, y: event.posy }; },
                getActions: () => this.getContextMenuActions()
            });
        }
        getContextMenuActions() {
            const actions = this.model.visibleItems
                .map(({ id, name, activityAction }) => ({
                id,
                label: this.getAction(id).label || name || id,
                checked: this.isPinned(id),
                enabled: activityAction.enabled,
                run: () => {
                    if (this.isPinned(id)) {
                        this.unpin(id);
                    }
                    else {
                        this.pin(id, true);
                    }
                }
            }));
            const otherActions = this.options.getContextMenuActions();
            if (otherActions.length) {
                actions.push(new actionbar_1.Separator());
                actions.push(...otherActions);
            }
            return actions;
        }
    };
    CompositeBar = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService)
    ], CompositeBar);
    exports.CompositeBar = CompositeBar;
    class CompositeBarModel {
        constructor(items, options) {
            this._items = [];
            this.options = options;
            this.setItems(items);
        }
        get items() {
            return this._items;
        }
        setItems(items) {
            const result = [];
            let hasChanges = false;
            if (!this.items || this.items.length === 0) {
                this._items = items.map(i => this.createCompositeBarItem(i.id, i.name, i.order, i.pinned, i.visible));
                hasChanges = true;
            }
            else {
                const existingItems = this.items;
                for (let index = 0; index < items.length; index++) {
                    const newItem = items[index];
                    const existingItem = existingItems.filter(({ id }) => id === newItem.id)[0];
                    if (existingItem) {
                        if (existingItem.pinned !== newItem.pinned ||
                            index !== existingItems.indexOf(existingItem)) {
                            existingItem.pinned = newItem.pinned;
                            result.push(existingItem);
                            hasChanges = true;
                        }
                        else {
                            result.push(existingItem);
                        }
                    }
                    else {
                        result.push(this.createCompositeBarItem(newItem.id, newItem.name, newItem.order, newItem.pinned, newItem.visible));
                        hasChanges = true;
                    }
                }
                this._items = result;
            }
            return hasChanges;
        }
        get visibleItems() {
            return this.items.filter(item => item.visible);
        }
        get pinnedItems() {
            return this.items.filter(item => item.visible && item.pinned);
        }
        createCompositeBarItem(id, name, order, pinned, visible) {
            const options = this.options;
            return {
                id, name, pinned, order, visible,
                activity: [],
                get activityAction() {
                    return options.getActivityAction(id);
                },
                get pinnedAction() {
                    return options.getCompositePinnedAction(id);
                }
            };
        }
        add(id, name, order, requestedIndex) {
            const item = this.findItem(id);
            if (item) {
                let changed = false;
                item.name = name;
                if (!types_1.isUndefinedOrNull(order)) {
                    changed = item.order !== order;
                    item.order = order;
                }
                if (!item.visible) {
                    item.visible = true;
                    changed = true;
                }
                return changed;
            }
            else {
                const item = this.createCompositeBarItem(id, name, order, true, true);
                if (!types_1.isUndefinedOrNull(requestedIndex)) {
                    let index = 0;
                    let rIndex = requestedIndex;
                    while (rIndex > 0 && index < this.items.length) {
                        if (this.items[index++].visible) {
                            rIndex--;
                        }
                    }
                    this.items.splice(index, 0, item);
                }
                else if (types_1.isUndefinedOrNull(order)) {
                    this.items.push(item);
                }
                else {
                    let index = 0;
                    while (index < this.items.length && typeof this.items[index].order === 'number' && this.items[index].order < order) {
                        index++;
                    }
                    this.items.splice(index, 0, item);
                }
                return true;
            }
        }
        remove(id) {
            for (let index = 0; index < this.items.length; index++) {
                if (this.items[index].id === id) {
                    this.items.splice(index, 1);
                    return true;
                }
            }
            return false;
        }
        hide(id) {
            for (const item of this.items) {
                if (item.id === id) {
                    if (item.visible) {
                        item.visible = false;
                        return true;
                    }
                    return false;
                }
            }
            return false;
        }
        move(compositeId, toCompositeId) {
            const fromIndex = this.findIndex(compositeId);
            const toIndex = this.findIndex(toCompositeId);
            // Make sure both items are known to the model
            if (fromIndex === -1 || toIndex === -1) {
                return false;
            }
            const sourceItem = this.items.splice(fromIndex, 1)[0];
            this.items.splice(toIndex, 0, sourceItem);
            // Make sure a moved composite gets pinned
            sourceItem.pinned = true;
            return true;
        }
        setPinned(id, pinned) {
            for (const item of this.items) {
                if (item.id === id) {
                    if (item.pinned !== pinned) {
                        item.pinned = pinned;
                        return true;
                    }
                    return false;
                }
            }
            return false;
        }
        addActivity(id, activity) {
            const item = this.findItem(id);
            if (item) {
                const stack = item.activity;
                for (let i = 0; i <= stack.length; i++) {
                    if (i === stack.length) {
                        stack.push(activity);
                        break;
                    }
                    else if (stack[i].priority <= activity.priority) {
                        stack.splice(i, 0, activity);
                        break;
                    }
                }
                this.updateActivity(id);
                return true;
            }
            return false;
        }
        removeActivity(id, activity) {
            const item = this.findItem(id);
            if (item) {
                const index = item.activity.indexOf(activity);
                if (index !== -1) {
                    item.activity.splice(index, 1);
                    this.updateActivity(id);
                    return true;
                }
            }
            return false;
        }
        updateActivity(id) {
            const item = this.findItem(id);
            if (item) {
                if (item.activity.length) {
                    const [{ badge, clazz }] = item.activity;
                    item.activityAction.setBadge(badge, clazz);
                }
                else {
                    item.activityAction.setBadge(undefined);
                }
            }
        }
        activate(id) {
            if (!this.activeItem || this.activeItem.id !== id) {
                if (this.activeItem) {
                    this.deactivate();
                }
                for (const item of this.items) {
                    if (item.id === id) {
                        this.activeItem = item;
                        this.activeItem.activityAction.activate();
                        return true;
                    }
                }
            }
            return false;
        }
        deactivate() {
            if (this.activeItem) {
                this.activeItem.activityAction.deactivate();
                this.activeItem = undefined;
                return true;
            }
            return false;
        }
        findItem(id) {
            return this.items.filter(item => item.id === id)[0];
        }
        findIndex(id) {
            for (let index = 0; index < this.items.length; index++) {
                if (this.items[index].id === id) {
                    return index;
                }
            }
            return -1;
        }
    }
});
//# __sourceMappingURL=compositeBar.js.map