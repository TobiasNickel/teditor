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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/workbench/browser/part", "vs/base/browser/dom", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/grid/grid", "vs/workbench/common/theme", "vs/base/common/arrays", "vs/workbench/browser/parts/editor/editor", "vs/workbench/browser/parts/editor/editorGroupView", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/common/editor/editorGroup", "vs/workbench/browser/parts/editor/editorDropTarget", "vs/workbench/services/editor/browser/editorDropService", "vs/base/common/color", "vs/base/browser/ui/centered/centeredViewLayout", "vs/base/common/errors", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/editor.contribution"], function (require, exports, themeService_1, part_1, dom_1, event_1, colorRegistry_1, editorGroupsService_1, instantiation_1, grid_1, theme_1, arrays_1, editor_1, editorGroupView_1, configuration_1, lifecycle_1, storage_1, editorGroup_1, editorDropTarget_1, editorDropService_1, color_1, centeredViewLayout_1, errors_1, layoutService_1, extensions_1, types_1, dnd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPart = void 0;
    class GridWidgetView {
        constructor() {
            this.element = dom_1.$('.grid-view-container');
            this._onDidChange = new event_1.Relay();
            this.onDidChange = this._onDidChange.event;
        }
        get minimumWidth() { return this.gridWidget ? this.gridWidget.minimumWidth : 0; }
        get maximumWidth() { return this.gridWidget ? this.gridWidget.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumHeight() { return this.gridWidget ? this.gridWidget.minimumHeight : 0; }
        get maximumHeight() { return this.gridWidget ? this.gridWidget.maximumHeight : Number.POSITIVE_INFINITY; }
        get gridWidget() {
            return this._gridWidget;
        }
        set gridWidget(grid) {
            this.element.innerHTML = '';
            if (grid) {
                this.element.appendChild(grid.element);
                this._onDidChange.input = grid.onDidChange;
            }
            else {
                this._onDidChange.input = event_1.Event.None;
            }
            this._gridWidget = grid;
        }
        layout(width, height) {
            if (this.gridWidget) {
                this.gridWidget.layout(width, height);
            }
        }
        dispose() {
            this._onDidChange.dispose();
        }
    }
    let EditorPart = class EditorPart extends part_1.Part {
        constructor(instantiationService, themeService, configurationService, storageService, layoutService) {
            super("workbench.parts.editor" /* EDITOR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            //#region Events
            this._onDidLayout = this._register(new event_1.Emitter());
            this.onDidLayout = this._onDidLayout.event;
            this._onDidActiveGroupChange = this._register(new event_1.Emitter());
            this.onDidActiveGroupChange = this._onDidActiveGroupChange.event;
            this._onDidGroupIndexChange = this._register(new event_1.Emitter());
            this.onDidGroupIndexChange = this._onDidGroupIndexChange.event;
            this._onDidActivateGroup = this._register(new event_1.Emitter());
            this.onDidActivateGroup = this._onDidActivateGroup.event;
            this._onDidAddGroup = this._register(new event_1.Emitter());
            this.onDidAddGroup = this._onDidAddGroup.event;
            this._onDidRemoveGroup = this._register(new event_1.Emitter());
            this.onDidRemoveGroup = this._onDidRemoveGroup.event;
            this._onDidMoveGroup = this._register(new event_1.Emitter());
            this.onDidMoveGroup = this._onDidMoveGroup.event;
            this.onDidSetGridWidget = this._register(new event_1.Emitter());
            this._onDidSizeConstraintsChange = this._register(new event_1.Relay());
            this.onDidSizeConstraintsChange = event_1.Event.any(this.onDidSetGridWidget.event, this._onDidSizeConstraintsChange.event);
            this._onDidEditorPartOptionsChange = this._register(new event_1.Emitter());
            this.onDidEditorPartOptionsChange = this._onDidEditorPartOptionsChange.event;
            this.groupViews = new Map();
            this.mostRecentActiveGroups = [];
            //#region IEditorGroupsService
            this.enforcedPartOptions = [];
            this._partOptions = editor_1.getEditorPartOptions(this.configurationService, this.themeService);
            this.snap = true;
            this.priority = 2 /* High */;
            this.gridWidgetView = new GridWidgetView();
            this.workspaceMemento = this.getMemento(1 /* WORKSPACE */);
            this.globalMemento = this.getMemento(0 /* GLOBAL */);
            this._whenRestored = new Promise(resolve => (this.whenRestoredResolve = resolve));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            this._register(this.themeService.onDidFileIconThemeChange(() => this.handleChangedPartOptions()));
        }
        onConfigurationUpdated(event) {
            if (editor_1.impactsEditorPartOptions(event)) {
                this.handleChangedPartOptions();
            }
        }
        handleChangedPartOptions() {
            const oldPartOptions = this._partOptions;
            const newPartOptions = editor_1.getEditorPartOptions(this.configurationService, this.themeService);
            this.enforcedPartOptions.forEach(enforcedPartOptions => {
                Object.assign(newPartOptions, enforcedPartOptions); // check for overrides
            });
            this._partOptions = newPartOptions;
            this._onDidEditorPartOptionsChange.fire({ oldPartOptions, newPartOptions });
        }
        get partOptions() { return this._partOptions; }
        enforcePartOptions(options) {
            this.enforcedPartOptions.push(options);
            this.handleChangedPartOptions();
            return lifecycle_1.toDisposable(() => {
                this.enforcedPartOptions.splice(this.enforcedPartOptions.indexOf(options), 1);
                this.handleChangedPartOptions();
            });
        }
        get contentDimension() { return this._contentDimension; }
        get activeGroup() {
            return this._activeGroup;
        }
        get groups() {
            return Array.from(this.groupViews.values());
        }
        get count() {
            return this.groupViews.size;
        }
        get orientation() {
            return (this.gridWidget && this.gridWidget.orientation === 0 /* VERTICAL */) ? 1 /* VERTICAL */ : 0 /* HORIZONTAL */;
        }
        get whenRestored() {
            return this._whenRestored;
        }
        get willRestoreEditors() {
            return !!this.workspaceMemento[EditorPart.EDITOR_PART_UI_STATE_STORAGE_KEY];
        }
        getGroups(order = 0 /* CREATION_TIME */) {
            switch (order) {
                case 0 /* CREATION_TIME */:
                    return this.groups;
                case 1 /* MOST_RECENTLY_ACTIVE */:
                    const mostRecentActive = arrays_1.coalesce(this.mostRecentActiveGroups.map(groupId => this.getGroup(groupId)));
                    // there can be groups that got never active, even though they exist. in this case
                    // make sure to just append them at the end so that all groups are returned properly
                    return arrays_1.distinct([...mostRecentActive, ...this.groups]);
                case 2 /* GRID_APPEARANCE */:
                    const views = [];
                    if (this.gridWidget) {
                        this.fillGridNodes(views, this.gridWidget.getViews());
                    }
                    return views;
            }
        }
        fillGridNodes(target, node) {
            if (grid_1.isGridBranchNode(node)) {
                node.children.forEach(child => this.fillGridNodes(target, child));
            }
            else {
                target.push(node.view);
            }
        }
        getGroup(identifier) {
            return this.groupViews.get(identifier);
        }
        findGroup(scope, source = this.activeGroup, wrap) {
            // by direction
            if (typeof scope.direction === 'number') {
                return this.doFindGroupByDirection(scope.direction, source, wrap);
            }
            // by location
            if (typeof scope.location === 'number') {
                return this.doFindGroupByLocation(scope.location, source, wrap);
            }
            throw new Error('invalid arguments');
        }
        doFindGroupByDirection(direction, source, wrap) {
            const sourceGroupView = this.assertGroupView(source);
            // Find neighbours and sort by our MRU list
            const neighbours = this.gridWidget.getNeighborViews(sourceGroupView, this.toGridViewDirection(direction), wrap);
            neighbours.sort(((n1, n2) => this.mostRecentActiveGroups.indexOf(n1.id) - this.mostRecentActiveGroups.indexOf(n2.id)));
            return neighbours[0];
        }
        doFindGroupByLocation(location, source, wrap) {
            const sourceGroupView = this.assertGroupView(source);
            const groups = this.getGroups(2 /* GRID_APPEARANCE */);
            const index = groups.indexOf(sourceGroupView);
            switch (location) {
                case 0 /* FIRST */:
                    return groups[0];
                case 1 /* LAST */:
                    return groups[groups.length - 1];
                case 2 /* NEXT */:
                    let nextGroup = groups[index + 1];
                    if (!nextGroup && wrap) {
                        nextGroup = this.doFindGroupByLocation(0 /* FIRST */, source);
                    }
                    return nextGroup;
                case 3 /* PREVIOUS */:
                    let previousGroup = groups[index - 1];
                    if (!previousGroup && wrap) {
                        previousGroup = this.doFindGroupByLocation(1 /* LAST */, source);
                    }
                    return previousGroup;
            }
        }
        activateGroup(group) {
            const groupView = this.assertGroupView(group);
            this.doSetGroupActive(groupView);
            this._onDidActivateGroup.fire(groupView);
            return groupView;
        }
        restoreGroup(group) {
            const groupView = this.assertGroupView(group);
            this.doRestoreGroup(groupView);
            return groupView;
        }
        getSize(group) {
            const groupView = this.assertGroupView(group);
            return this.gridWidget.getViewSize(groupView);
        }
        setSize(group, size) {
            const groupView = this.assertGroupView(group);
            this.gridWidget.resizeView(groupView, size);
        }
        arrangeGroups(arrangement, target = this.activeGroup) {
            if (this.count < 2) {
                return; // require at least 2 groups to show
            }
            if (!this.gridWidget) {
                return; // we have not been created yet
            }
            switch (arrangement) {
                case 1 /* EVEN */:
                    this.gridWidget.distributeViewSizes();
                    break;
                case 0 /* MINIMIZE_OTHERS */:
                    this.gridWidget.maximizeViewSize(target);
                    break;
                case 2 /* TOGGLE */:
                    if (this.isGroupMaximized(target)) {
                        this.arrangeGroups(1 /* EVEN */);
                    }
                    else {
                        this.arrangeGroups(0 /* MINIMIZE_OTHERS */);
                    }
                    break;
            }
        }
        isGroupMaximized(targetGroup) {
            for (const group of this.groups) {
                if (group === targetGroup) {
                    continue; // ignore target group
                }
                if (!group.isMinimized) {
                    return false; // target cannot be maximized if one group is not minimized
                }
            }
            return true;
        }
        setGroupOrientation(orientation) {
            if (!this.gridWidget) {
                return; // we have not been created yet
            }
            const newOrientation = (orientation === 0 /* HORIZONTAL */) ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
            if (this.gridWidget.orientation !== newOrientation) {
                this.gridWidget.orientation = newOrientation;
            }
        }
        applyLayout(layout) {
            const restoreFocus = this.shouldRestoreFocus(this.container);
            // Determine how many groups we need overall
            let layoutGroupsCount = 0;
            function countGroups(groups) {
                groups.forEach(group => {
                    if (Array.isArray(group.groups)) {
                        countGroups(group.groups);
                    }
                    else {
                        layoutGroupsCount++;
                    }
                });
            }
            countGroups(layout.groups);
            // If we currently have too many groups, merge them into the last one
            let currentGroupViews = this.getGroups(2 /* GRID_APPEARANCE */);
            if (layoutGroupsCount < currentGroupViews.length) {
                const lastGroupInLayout = currentGroupViews[layoutGroupsCount - 1];
                currentGroupViews.forEach((group, index) => {
                    if (index >= layoutGroupsCount) {
                        this.mergeGroup(group, lastGroupInLayout);
                    }
                });
                currentGroupViews = this.getGroups(2 /* GRID_APPEARANCE */);
            }
            const activeGroup = this.activeGroup;
            // Prepare grid descriptor to create new grid from
            const gridDescriptor = grid_1.createSerializedGrid({
                orientation: this.toGridViewOrientation(layout.orientation, this.isTwoDimensionalGrid() ?
                    this.gridWidget.orientation : // preserve original orientation for 2-dimensional grids
                    grid_1.orthogonal(this.gridWidget.orientation) // otherwise flip (fix https://github.com/Microsoft/vscode/issues/52975)
                ),
                groups: layout.groups
            });
            // Recreate gridwidget with descriptor
            this.doCreateGridControlWithState(gridDescriptor, activeGroup.id, currentGroupViews);
            // Layout
            this.doLayout(this._contentDimension);
            // Update container
            this.updateContainer();
            // Events for groups that got added
            this.getGroups(2 /* GRID_APPEARANCE */).forEach(groupView => {
                if (currentGroupViews.indexOf(groupView) === -1) {
                    this._onDidAddGroup.fire(groupView);
                }
            });
            // Notify group index change given layout has changed
            this.notifyGroupIndexChange();
            // Restore focus as needed
            if (restoreFocus) {
                this._activeGroup.focus();
            }
        }
        shouldRestoreFocus(target) {
            if (!target) {
                return false;
            }
            const activeElement = document.activeElement;
            if (activeElement === document.body) {
                return true; // always restore focus if nothing is focused currently
            }
            // otherwise check for the active element being an ancestor of the target
            return dom_1.isAncestor(activeElement, target);
        }
        isTwoDimensionalGrid() {
            const views = this.gridWidget.getViews();
            if (grid_1.isGridBranchNode(views)) {
                // the grid is 2-dimensional if any children
                // of the grid is a branch node
                return views.children.some(child => grid_1.isGridBranchNode(child));
            }
            return false;
        }
        addGroup(location, direction, options) {
            const locationView = this.assertGroupView(location);
            const group = this.doAddGroup(locationView, direction);
            if (options === null || options === void 0 ? void 0 : options.activate) {
                this.doSetGroupActive(group);
            }
            return group;
        }
        doAddGroup(locationView, direction, groupToCopy) {
            const newGroupView = this.doCreateGroupView(groupToCopy);
            // Add to grid widget
            this.gridWidget.addView(newGroupView, this.getSplitSizingStyle(), locationView, this.toGridViewDirection(direction));
            // Update container
            this.updateContainer();
            // Event
            this._onDidAddGroup.fire(newGroupView);
            // Notify group index change given a new group was added
            this.notifyGroupIndexChange();
            return newGroupView;
        }
        getSplitSizingStyle() {
            return this._partOptions.splitSizing === 'split' ? grid_1.Sizing.Split : grid_1.Sizing.Distribute;
        }
        doCreateGroupView(from) {
            // Create group view
            let groupView;
            if (from instanceof editorGroupView_1.EditorGroupView) {
                groupView = editorGroupView_1.EditorGroupView.createCopy(from, this, this.count, this.instantiationService);
            }
            else if (editorGroup_1.isSerializedEditorGroup(from)) {
                groupView = editorGroupView_1.EditorGroupView.createFromSerialized(from, this, this.count, this.instantiationService);
            }
            else {
                groupView = editorGroupView_1.EditorGroupView.createNew(this, this.count, this.instantiationService);
            }
            // Keep in map
            this.groupViews.set(groupView.id, groupView);
            // Track focus
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(groupView.onDidFocus(() => {
                this.doSetGroupActive(groupView);
            }));
            // Track editor change
            groupDisposables.add(groupView.onDidGroupChange(e => {
                switch (e.kind) {
                    case 5 /* EDITOR_ACTIVE */:
                        this.updateContainer();
                        break;
                    case 1 /* GROUP_INDEX */:
                        this._onDidGroupIndexChange.fire(groupView);
                        break;
                }
            }));
            // Track dispose
            event_1.Event.once(groupView.onWillDispose)(() => {
                lifecycle_1.dispose(groupDisposables);
                this.groupViews.delete(groupView.id);
                this.doUpdateMostRecentActive(groupView);
            });
            return groupView;
        }
        doSetGroupActive(group) {
            if (this._activeGroup === group) {
                return; // return if this is already the active group
            }
            const previousActiveGroup = this._activeGroup;
            this._activeGroup = group;
            // Update list of most recently active groups
            this.doUpdateMostRecentActive(group, true);
            // Mark previous one as inactive
            if (previousActiveGroup) {
                previousActiveGroup.setActive(false);
            }
            // Mark group as new active
            group.setActive(true);
            // Maximize the group if it is currently minimized
            this.doRestoreGroup(group);
            // Event
            this._onDidActiveGroupChange.fire(group);
        }
        doRestoreGroup(group) {
            if (this.gridWidget) {
                const viewSize = this.gridWidget.getViewSize(group);
                if (viewSize.width === group.minimumWidth || viewSize.height === group.minimumHeight) {
                    this.arrangeGroups(0 /* MINIMIZE_OTHERS */, group);
                }
            }
        }
        doUpdateMostRecentActive(group, makeMostRecentlyActive) {
            const index = this.mostRecentActiveGroups.indexOf(group.id);
            // Remove from MRU list
            if (index !== -1) {
                this.mostRecentActiveGroups.splice(index, 1);
            }
            // Add to front as needed
            if (makeMostRecentlyActive) {
                this.mostRecentActiveGroups.unshift(group.id);
            }
        }
        toGridViewDirection(direction) {
            switch (direction) {
                case 0 /* UP */: return 0 /* Up */;
                case 1 /* DOWN */: return 1 /* Down */;
                case 2 /* LEFT */: return 2 /* Left */;
                case 3 /* RIGHT */: return 3 /* Right */;
            }
        }
        toGridViewOrientation(orientation, fallback) {
            if (typeof orientation === 'number') {
                return orientation === 0 /* HORIZONTAL */ ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
            }
            return fallback;
        }
        removeGroup(group) {
            const groupView = this.assertGroupView(group);
            if (this.groupViews.size === 1) {
                return; // Cannot remove the last root group
            }
            // Remove empty group
            if (groupView.isEmpty) {
                return this.doRemoveEmptyGroup(groupView);
            }
            // Remove group with editors
            this.doRemoveGroupWithEditors(groupView);
        }
        doRemoveGroupWithEditors(groupView) {
            const mostRecentlyActiveGroups = this.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
            let lastActiveGroup;
            if (this._activeGroup === groupView) {
                lastActiveGroup = mostRecentlyActiveGroups[1];
            }
            else {
                lastActiveGroup = mostRecentlyActiveGroups[0];
            }
            // Removing a group with editors should merge these editors into the
            // last active group and then remove this group.
            this.mergeGroup(groupView, lastActiveGroup);
        }
        doRemoveEmptyGroup(groupView) {
            const restoreFocus = this.shouldRestoreFocus(this.container);
            // Activate next group if the removed one was active
            if (this._activeGroup === groupView) {
                const mostRecentlyActiveGroups = this.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
                const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current group we are about to dispose
                this.activateGroup(nextActiveGroup);
            }
            // Remove from grid widget & dispose
            this.gridWidget.removeView(groupView, this.getSplitSizingStyle());
            groupView.dispose();
            // Restore focus if we had it previously (we run this after gridWidget.removeView() is called
            // because removing a view can mean to reparent it and thus focus would be removed otherwise)
            if (restoreFocus) {
                this._activeGroup.focus();
            }
            // Notify group index change given a group was removed
            this.notifyGroupIndexChange();
            // Update container
            this.updateContainer();
            // Event
            this._onDidRemoveGroup.fire(groupView);
        }
        moveGroup(group, location, direction) {
            const sourceView = this.assertGroupView(group);
            const targetView = this.assertGroupView(location);
            if (sourceView.id === targetView.id) {
                throw new Error('Cannot move group into its own');
            }
            const restoreFocus = this.shouldRestoreFocus(sourceView.element);
            // Move through grid widget API
            this.gridWidget.moveView(sourceView, this.getSplitSizingStyle(), targetView, this.toGridViewDirection(direction));
            // Restore focus if we had it previously (we run this after gridWidget.removeView() is called
            // because removing a view can mean to reparent it and thus focus would be removed otherwise)
            if (restoreFocus) {
                sourceView.focus();
            }
            // Event
            this._onDidMoveGroup.fire(sourceView);
            // Notify group index change given a group was moved
            this.notifyGroupIndexChange();
            return sourceView;
        }
        copyGroup(group, location, direction) {
            const groupView = this.assertGroupView(group);
            const locationView = this.assertGroupView(location);
            const restoreFocus = this.shouldRestoreFocus(groupView.element);
            // Copy the group view
            const copiedGroupView = this.doAddGroup(locationView, direction, groupView);
            // Restore focus if we had it
            if (restoreFocus) {
                copiedGroupView.focus();
            }
            return copiedGroupView;
        }
        mergeGroup(group, target, options) {
            const sourceView = this.assertGroupView(group);
            const targetView = this.assertGroupView(target);
            // Move/Copy editors over into target
            let index = (options && typeof options.index === 'number') ? options.index : targetView.count;
            sourceView.editors.forEach(editor => {
                const inactive = !sourceView.isActive(editor) || this._activeGroup !== sourceView;
                const sticky = sourceView.isSticky(editor);
                const editorOptions = { index: !sticky ? index : undefined /* do not set index to preserve sticky flag */, inactive, preserveFocus: inactive };
                if ((options === null || options === void 0 ? void 0 : options.mode) === 0 /* COPY_EDITORS */) {
                    sourceView.copyEditor(editor, targetView, editorOptions);
                }
                else {
                    sourceView.moveEditor(editor, targetView, editorOptions);
                }
                index++;
            });
            // Remove source if the view is now empty and not already removed
            if (sourceView.isEmpty && !sourceView.disposed /* could have been disposed already via workbench.editor.closeEmptyGroups setting */) {
                this.removeGroup(sourceView);
            }
            return targetView;
        }
        assertGroupView(group) {
            let groupView;
            if (typeof group === 'number') {
                groupView = this.getGroup(group);
            }
            else {
                groupView = group;
            }
            if (!groupView) {
                throw new Error('Invalid editor group provided!');
            }
            return groupView;
        }
        //#endregion
        //#region IEditorDropService
        createEditorDropTarget(container, delegate) {
            return this.instantiationService.createInstance(editorDropTarget_1.EditorDropTarget, this, container, delegate);
        }
        //#endregion
        //#region Part
        // TODO @sbatten @joao find something better to prevent editor taking over #79897
        get minimumWidth() { return Math.min(this.centeredLayoutWidget.minimumWidth, this.layoutService.getMaximumEditorDimensions().width); }
        get maximumWidth() { return this.centeredLayoutWidget.maximumWidth; }
        get minimumHeight() { return Math.min(this.centeredLayoutWidget.minimumHeight, this.layoutService.getMaximumEditorDimensions().height); }
        get maximumHeight() { return this.centeredLayoutWidget.maximumHeight; }
        get onDidChange() { return event_1.Event.any(this.centeredLayoutWidget.onDidChange, this.onDidSetGridWidget.event); }
        get gridSeparatorBorder() {
            return this.theme.getColor(theme_1.EDITOR_GROUP_BORDER) || this.theme.getColor(colorRegistry_1.contrastBorder) || color_1.Color.transparent;
        }
        updateStyles() {
            const container = types_1.assertIsDefined(this.container);
            container.style.backgroundColor = this.getColor(colorRegistry_1.editorBackground) || '';
            const separatorBorderStyle = { separatorBorder: this.gridSeparatorBorder, background: this.theme.getColor(theme_1.EDITOR_PANE_BACKGROUND) || color_1.Color.transparent };
            this.gridWidget.style(separatorBorderStyle);
            this.centeredLayoutWidget.styles(separatorBorderStyle);
        }
        createContentArea(parent, options) {
            // Container
            this.element = parent;
            this.container = document.createElement('div');
            dom_1.addClass(this.container, 'content');
            parent.appendChild(this.container);
            // Grid control with center layout
            this.doCreateGridControl(options);
            this.centeredLayoutWidget = this._register(new centeredViewLayout_1.CenteredViewLayout(this.container, this.gridWidgetView, this.globalMemento[EditorPart.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY]));
            // Drop support
            this._register(this.createEditorDropTarget(this.container, Object.create(null)));
            // No drop in the editor
            const overlay = document.createElement('div');
            dom_1.addClass(overlay, 'drop-block-overlay');
            parent.appendChild(overlay);
            // Hide the block if a mouse down event occurs #99065
            this._register(dom_1.addDisposableGenericMouseDownListner(overlay, e => {
                dom_1.toggleClass(overlay, 'visible', false);
            }));
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.element, {
                onDragStart: e => {
                    dom_1.toggleClass(overlay, 'visible', true);
                },
                onDragEnd: e => {
                    dom_1.toggleClass(overlay, 'visible', false);
                }
            }));
            let panelOpenerTimeout;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(overlay, {
                onDragOver: e => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (e.eventData.dataTransfer) {
                        e.eventData.dataTransfer.dropEffect = 'none';
                    }
                    if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                        const boundingRect = overlay.getBoundingClientRect();
                        let openPanel = false;
                        const proximity = 100;
                        switch (this.layoutService.getPanelPosition()) {
                            case 2 /* BOTTOM */:
                                if (e.eventData.clientY > boundingRect.bottom - proximity) {
                                    openPanel = true;
                                }
                                break;
                            case 0 /* LEFT */:
                                if (e.eventData.clientX < boundingRect.left + proximity) {
                                    openPanel = true;
                                }
                                break;
                            case 1 /* RIGHT */:
                                if (e.eventData.clientX > boundingRect.right - proximity) {
                                    openPanel = true;
                                }
                                break;
                        }
                        if (!panelOpenerTimeout && openPanel) {
                            panelOpenerTimeout = setTimeout(() => this.layoutService.setPanelHidden(false), 200);
                        }
                        else if (panelOpenerTimeout && !openPanel) {
                            clearTimeout(panelOpenerTimeout);
                            panelOpenerTimeout = undefined;
                        }
                    }
                },
                onDragLeave: () => {
                    if (panelOpenerTimeout) {
                        clearTimeout(panelOpenerTimeout);
                        panelOpenerTimeout = undefined;
                    }
                },
                onDragEnd: () => {
                    if (panelOpenerTimeout) {
                        clearTimeout(panelOpenerTimeout);
                        panelOpenerTimeout = undefined;
                    }
                },
                onDrop: () => {
                    if (panelOpenerTimeout) {
                        clearTimeout(panelOpenerTimeout);
                        panelOpenerTimeout = undefined;
                    }
                }
            }));
            return this.container;
        }
        centerLayout(active) {
            this.centeredLayoutWidget.activate(active);
            this._activeGroup.focus();
        }
        isLayoutCentered() {
            if (this.centeredLayoutWidget) {
                return this.centeredLayoutWidget.isActive();
            }
            return false;
        }
        doCreateGridControl(options) {
            // Grid Widget (with previous UI state)
            let restoreError = false;
            if (!options || options.restorePreviousState) {
                restoreError = !this.doCreateGridControlWithPreviousState();
            }
            // Grid Widget (no previous UI state or failed to restore)
            if (!this.gridWidget || restoreError) {
                const initialGroup = this.doCreateGroupView();
                this.doSetGridWidget(new grid_1.SerializableGrid(initialGroup));
                // Ensure a group is active
                this.doSetGroupActive(initialGroup);
            }
            // Signal restored
            Promise.all(this.groups.map(group => group.whenRestored)).finally(() => {
                if (this.whenRestoredResolve) {
                    this.whenRestoredResolve();
                }
            });
            // Update container
            this.updateContainer();
            // Notify group index change we created the entire grid
            this.notifyGroupIndexChange();
        }
        doCreateGridControlWithPreviousState() {
            const uiState = this.workspaceMemento[EditorPart.EDITOR_PART_UI_STATE_STORAGE_KEY];
            if (uiState === null || uiState === void 0 ? void 0 : uiState.serializedGrid) {
                try {
                    // MRU
                    this.mostRecentActiveGroups = uiState.mostRecentActiveGroups;
                    // Grid Widget
                    this.doCreateGridControlWithState(uiState.serializedGrid, uiState.activeGroup);
                    // Ensure last active group has focus
                    this._activeGroup.focus();
                }
                catch (error) {
                    // Log error
                    errors_1.onUnexpectedError(new Error(`Error restoring editor grid widget: ${error} (with state: ${JSON.stringify(uiState)})`));
                    // Clear any state we have from the failing restore
                    this.groupViews.forEach(group => group.dispose());
                    this.groupViews.clear();
                    this.mostRecentActiveGroups = [];
                    return false; // failure
                }
            }
            return true; // success
        }
        doCreateGridControlWithState(serializedGrid, activeGroupId, editorGroupViewsToReuse) {
            // Determine group views to reuse if any
            let reuseGroupViews;
            if (editorGroupViewsToReuse) {
                reuseGroupViews = editorGroupViewsToReuse.slice(0); // do not modify original array
            }
            else {
                reuseGroupViews = [];
            }
            // Create new
            const groupViews = [];
            const gridWidget = grid_1.SerializableGrid.deserialize(serializedGrid, {
                fromJSON: (serializedEditorGroup) => {
                    let groupView;
                    if (reuseGroupViews.length > 0) {
                        groupView = reuseGroupViews.shift();
                    }
                    else {
                        groupView = this.doCreateGroupView(serializedEditorGroup);
                    }
                    groupViews.push(groupView);
                    if (groupView.id === activeGroupId) {
                        this.doSetGroupActive(groupView);
                    }
                    return groupView;
                }
            }, { styles: { separatorBorder: this.gridSeparatorBorder } });
            // If the active group was not found when restoring the grid
            // make sure to make at least one group active. We always need
            // an active group.
            if (!this._activeGroup) {
                this.doSetGroupActive(groupViews[0]);
            }
            // Validate MRU group views matches grid widget state
            if (this.mostRecentActiveGroups.some(groupId => !this.getGroup(groupId))) {
                this.mostRecentActiveGroups = groupViews.map(group => group.id);
            }
            // Set it
            this.doSetGridWidget(gridWidget);
        }
        doSetGridWidget(gridWidget) {
            let boundarySashes = {};
            if (this.gridWidget) {
                boundarySashes = this.gridWidget.boundarySashes;
                this.gridWidget.dispose();
            }
            this.gridWidget = gridWidget;
            this.gridWidget.boundarySashes = boundarySashes;
            this.gridWidgetView.gridWidget = gridWidget;
            this._onDidSizeConstraintsChange.input = gridWidget.onDidChange;
            this.onDidSetGridWidget.fire(undefined);
        }
        updateContainer() {
            const container = types_1.assertIsDefined(this.container);
            dom_1.toggleClass(container, 'empty', this.isEmpty);
        }
        notifyGroupIndexChange() {
            this.getGroups(2 /* GRID_APPEARANCE */).forEach((group, index) => group.notifyIndexChanged(index));
        }
        get isEmpty() {
            return this.groupViews.size === 1 && this._activeGroup.isEmpty;
        }
        setBoundarySashes(sashes) {
            this.gridWidget.boundarySashes = sashes;
            this.centeredLayoutWidget.boundarySashes = sashes;
        }
        layout(width, height) {
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout editor container
            this.doLayout(contentAreaSize);
        }
        doLayout(dimension) {
            this._contentDimension = dimension;
            // Layout Grid
            this.centeredLayoutWidget.layout(this._contentDimension.width, this._contentDimension.height);
            // Event
            this._onDidLayout.fire(dimension);
        }
        saveState() {
            // Persist grid UI state
            if (this.gridWidget) {
                const uiState = {
                    serializedGrid: this.gridWidget.serialize(),
                    activeGroup: this._activeGroup.id,
                    mostRecentActiveGroups: this.mostRecentActiveGroups
                };
                if (this.isEmpty) {
                    delete this.workspaceMemento[EditorPart.EDITOR_PART_UI_STATE_STORAGE_KEY];
                }
                else {
                    this.workspaceMemento[EditorPart.EDITOR_PART_UI_STATE_STORAGE_KEY] = uiState;
                }
            }
            // Persist centered view state
            const centeredLayoutState = this.centeredLayoutWidget.state;
            if (this.centeredLayoutWidget.isDefault(centeredLayoutState)) {
                delete this.globalMemento[EditorPart.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY];
            }
            else {
                this.globalMemento[EditorPart.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY] = centeredLayoutState;
            }
            super.saveState();
        }
        toJSON() {
            return {
                type: "workbench.parts.editor" /* EDITOR_PART */
            };
        }
        dispose() {
            // Forward to all groups
            this.groupViews.forEach(group => group.dispose());
            this.groupViews.clear();
            // Grid widget
            if (this.gridWidget) {
                this.gridWidget.dispose();
            }
            super.dispose();
        }
    };
    EditorPart.EDITOR_PART_UI_STATE_STORAGE_KEY = 'editorpart.state';
    EditorPart.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY = 'editorpart.centeredview';
    EditorPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], EditorPart);
    exports.EditorPart = EditorPart;
    extensions_1.registerSingleton(editorGroupsService_1.IEditorGroupsService, EditorPart);
    extensions_1.registerSingleton(editorDropService_1.IEditorDropService, EditorPart);
});
//# __sourceMappingURL=editorPart.js.map