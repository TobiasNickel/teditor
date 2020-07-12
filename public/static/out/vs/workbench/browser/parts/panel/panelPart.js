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
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/workbench/common/panel", "vs/workbench/browser/parts/compositePart", "vs/workbench/browser/panel", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/compositeBar", "vs/workbench/browser/parts/compositeBarActions", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/workbench/common/views", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/views/viewMenuActions", "vs/platform/userDataSync/common/storageKeys", "vs/workbench/browser/dnd", "vs/css!./media/panelpart"], function (require, exports, event_1, platform_1, panel_1, compositePart_1, panel_2, panelService_1, layoutService_1, storage_1, contextView_1, telemetry_1, keybinding_1, instantiation_1, panelActions_1, themeService_1, theme_1, colorRegistry_1, compositeBar_1, compositeBarActions_1, notification_1, dom_1, nls_1, lifecycle_1, contextkey_1, types_1, extensions_1, extensions_2, views_1, actions_1, viewMenuActions_1, storageKeys_1, dnd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelPart = void 0;
    let PanelPart = class PanelPart extends compositePart_1.CompositePart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, storageKeysSyncRegistryService) {
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, platform_1.Registry.as(panel_2.Extensions.Panels), PanelPart.activePanelSettingsKey, platform_1.Registry.as(panel_2.Extensions.Panels).getDefaultPanelId(), 'panel', 'panel', undefined, "workbench.parts.panel" /* PANEL_PART */, { hasTitle: true });
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            //#region IView
            this.minimumWidth = 300;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 77;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.snap = true;
            this.onDidPanelClose = this.onDidCompositeClose.event;
            this.compositeActions = new Map();
            this.panelDisposables = new Map();
            this.blockOpeningPanel = false;
            this.extensionsRegistered = false;
            this.panelRegistry = platform_1.Registry.as(panel_2.Extensions.Panels);
            storageKeysSyncRegistryService.registerStorageKey({ key: PanelPart.PINNED_PANELS, version: 1 });
            this.dndHandler = new compositeBar_1.CompositeDragAndDrop(this.viewDescriptorService, views_1.ViewContainerLocation.Panel, (id, focus) => this.openPanel(id, focus).then(panel => panel || null), (from, to, before) => this.compositeBar.move(from, to, before === null || before === void 0 ? void 0 : before.horizontallyBefore), () => this.compositeBar.getCompositeBarItems());
            this.compositeBar = this._register(this.instantiationService.createInstance(compositeBar_1.CompositeBar, this.getCachedPanels(), {
                icon: false,
                orientation: 0 /* HORIZONTAL */,
                openComposite: (compositeId) => this.openPanel(compositeId, true).then(panel => panel || null),
                getActivityAction: (compositeId) => this.getCompositeActions(compositeId).activityAction,
                getCompositePinnedAction: (compositeId) => this.getCompositeActions(compositeId).pinnedAction,
                getOnCompositeClickAction: (compositeId) => this.instantiationService.createInstance(panelActions_1.PanelActivityAction, types_1.assertIsDefined(this.getPanel(compositeId))),
                getContextMenuActions: () => [
                    ...panelActions_1.PositionPanelActionConfigs
                        // show the contextual menu item if it is not in that position
                        .filter(({ when }) => contextKeyService.contextMatchesRules(when))
                        .map(({ id, label }) => this.instantiationService.createInstance(panelActions_1.SetPanelPositionAction, id, label)),
                    this.instantiationService.createInstance(panelActions_1.TogglePanelAction, panelActions_1.TogglePanelAction.ID, nls_1.localize('hidePanel', "Hide Panel"))
                ],
                getContextMenuActionsForComposite: (compositeId) => this.getContextMenuActionsForComposite(compositeId),
                getDefaultCompositeId: () => this.panelRegistry.getDefaultPanelId(),
                hidePart: () => this.layoutService.setPanelHidden(true),
                dndHandler: this.dndHandler,
                compositeSize: 0,
                overflowActionSize: 44,
                colors: (theme) => ({
                    activeBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND),
                    inactiveBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND),
                    activeBorderBottomColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER),
                    activeForegroundColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND),
                    badgeBackground: theme.getColor(colorRegistry_1.badgeBackground),
                    badgeForeground: theme.getColor(colorRegistry_1.badgeForeground),
                    dragAndDropBorder: theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BORDER)
                })
            }));
            this.activePanelContextKey = panel_1.ActivePanelContext.bindTo(contextKeyService);
            this.panelFocusContextKey = panel_1.PanelFocusContext.bindTo(contextKeyService);
            this.registerListeners();
            this.onDidRegisterPanels([...this.getPanels()]);
        }
        get preferredHeight() {
            // Don't worry about titlebar or statusbar visibility
            // The difference is minimal and keeps this function clean
            return this.layoutService.dimension.height * 0.4;
        }
        get preferredWidth() {
            return this.layoutService.dimension.width * 0.4;
        }
        //#endregion
        get onDidPanelOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeOpen => ({ panel: compositeOpen.composite, focus: compositeOpen.focus })); }
        getContextMenuActionsForComposite(compositeId) {
            const result = [];
            const container = this.getViewContainer(compositeId);
            if (container) {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(container);
                if (viewContainerModel.allViewDescriptors.length === 1) {
                    const viewMenuActions = this.instantiationService.createInstance(viewMenuActions_1.ViewMenuActions, viewContainerModel.allViewDescriptors[0].id, actions_1.MenuId.ViewTitle, actions_1.MenuId.ViewTitleContext);
                    result.push(...viewMenuActions.getContextMenuActions());
                    viewMenuActions.dispose();
                }
                const viewContainerMenuActions = this.instantiationService.createInstance(viewMenuActions_1.ViewContainerMenuActions, container.id, actions_1.MenuId.ViewContainerTitleContext);
                result.push(...viewContainerMenuActions.getContextMenuActions());
                viewContainerMenuActions.dispose();
            }
            return result;
        }
        onDidRegisterPanels(panels) {
            for (const panel of panels) {
                const cachedPanel = this.getCachedPanels().filter(({ id }) => id === panel.id)[0];
                const activePanel = this.getActivePanel();
                const isActive = (activePanel === null || activePanel === void 0 ? void 0 : activePanel.getId()) === panel.id ||
                    (!activePanel && this.getLastActivePanelId() === panel.id) ||
                    (this.extensionsRegistered && this.compositeBar.getVisibleComposites().length === 0);
                if (isActive || !this.shouldBeHidden(panel.id, cachedPanel)) {
                    // Override order
                    const newPanel = {
                        id: panel.id,
                        name: panel.name,
                        order: panel.order,
                        requestedIndex: panel.requestedIndex
                    };
                    this.compositeBar.addComposite(newPanel);
                    // Pin it by default if it is new
                    if (!cachedPanel) {
                        this.compositeBar.pin(panel.id);
                    }
                    if (isActive) {
                        // Only try to open the panel if it has been created and visible
                        if (!activePanel && this.element && this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                            this.doOpenPanel(panel.id);
                        }
                        this.compositeBar.activateComposite(panel.id);
                    }
                }
            }
            for (const panel of panels) {
                const viewContainer = this.getViewContainer(panel.id);
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                this.updateActivity(viewContainer, viewContainerModel);
                this.onDidChangeActiveViews(viewContainer, viewContainerModel);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(viewContainerModel.onDidChangeActiveViewDescriptors(() => this.onDidChangeActiveViews(viewContainer, viewContainerModel)));
                disposables.add(viewContainerModel.onDidChangeContainerInfo(() => this.updateActivity(viewContainer, viewContainerModel)));
                this.panelDisposables.set(panel.id, disposables);
            }
        }
        async onDidDeregisterPanel(panelId) {
            var _a;
            const disposable = this.panelDisposables.get(panelId);
            if (disposable) {
                disposable.dispose();
            }
            this.panelDisposables.delete(panelId);
            const activeContainers = this.viewDescriptorService.getViewContainersByLocation(views_1.ViewContainerLocation.Panel)
                .filter(container => this.viewDescriptorService.getViewContainerModel(container).activeViewDescriptors.length > 0);
            if (activeContainers.length) {
                if (((_a = this.getActivePanel()) === null || _a === void 0 ? void 0 : _a.getId()) === panelId) {
                    const defaultPanelId = this.panelRegistry.getDefaultPanelId();
                    const containerToOpen = activeContainers.filter(c => c.id === defaultPanelId)[0] || activeContainers[0];
                    await this.openPanel(containerToOpen.id);
                }
            }
            else {
                this.layoutService.setPanelHidden(true);
            }
            this.removeComposite(panelId);
        }
        updateActivity(viewContainer, viewContainerModel) {
            var _a, _b;
            const cachedTitle = (_a = this.getPlaceholderViewContainers().filter(panel => panel.id === viewContainer.id)[0]) === null || _a === void 0 ? void 0 : _a.name;
            const activity = {
                id: viewContainer.id,
                name: this.extensionsRegistered || cachedTitle === undefined ? viewContainerModel.title : cachedTitle,
                keybindingId: (_b = viewContainer.focusCommand) === null || _b === void 0 ? void 0 : _b.id
            };
            const { activityAction, pinnedAction } = this.getCompositeActions(viewContainer.id);
            activityAction.setActivity(activity);
            if (pinnedAction instanceof panelActions_1.PlaceHolderToggleCompositePinnedAction) {
                pinnedAction.setActivity(activity);
            }
            // only update our cached panel info after extensions are done registering
            if (this.extensionsRegistered) {
                this.saveCachedPanels();
            }
        }
        onDidChangeActiveViews(viewContainer, viewContainerModel) {
            if (viewContainerModel.activeViewDescriptors.length) {
                this.compositeBar.addComposite(viewContainer);
            }
            else if (viewContainer.hideIfEmpty) {
                this.hideComposite(viewContainer.id);
            }
        }
        shouldBeHidden(panelId, cachedPanel) {
            const viewContainer = this.getViewContainer(panelId);
            if (!viewContainer || !viewContainer.hideIfEmpty) {
                return false;
            }
            return (cachedPanel === null || cachedPanel === void 0 ? void 0 : cachedPanel.views) && cachedPanel.views.length
                ? cachedPanel.views.every(({ when }) => !!when && !this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(when)))
                : false;
        }
        registerListeners() {
            // Panel registration
            this._register(this.registry.onDidRegister(panel => this.onDidRegisterPanels([panel])));
            this._register(this.registry.onDidDeregister(panel => this.onDidDeregisterPanel(panel.id)));
            // Activate on panel open
            this._register(this.onDidPanelOpen(({ panel }) => this.onPanelOpen(panel)));
            // Deactivate on panel close
            this._register(this.onDidPanelClose(this.onPanelClose, this));
            // Extension registration
            let disposables = this._register(new lifecycle_1.DisposableStore());
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                disposables.clear();
                this.onDidRegisterExtensions();
                this.compositeBar.onDidChange(() => this.saveCachedPanels(), this, disposables);
                this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e), this, disposables);
            }));
        }
        onDidRegisterExtensions() {
            this.extensionsRegistered = true;
            this.removeNotExistingComposites();
            this.saveCachedPanels();
        }
        removeNotExistingComposites() {
            const panels = this.getPanels();
            for (const { id } of this.getCachedPanels()) { // should this value match viewlet (load on ctor)
                if (panels.every(panel => panel.id !== id)) {
                    this.hideComposite(id);
                }
            }
        }
        hideComposite(compositeId) {
            this.compositeBar.hideComposite(compositeId);
            const compositeActions = this.compositeActions.get(compositeId);
            if (compositeActions) {
                compositeActions.activityAction.dispose();
                compositeActions.pinnedAction.dispose();
                this.compositeActions.delete(compositeId);
            }
        }
        onPanelOpen(panel) {
            this.activePanelContextKey.set(panel.getId());
            const foundPanel = this.panelRegistry.getPanel(panel.getId());
            if (foundPanel) {
                this.compositeBar.addComposite(foundPanel);
            }
            // Activate composite when opened
            this.compositeBar.activateComposite(panel.getId());
            const panelDescriptor = this.panelRegistry.getPanel(panel.getId());
            if (panelDescriptor) {
                const viewContainer = this.getViewContainer(panelDescriptor.id);
                if (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.hideIfEmpty) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    if (viewContainerModel.activeViewDescriptors.length === 0 && this.compositeBar.getPinnedComposites().length > 1) {
                        this.hideComposite(panelDescriptor.id); // Update the composite bar by hiding
                    }
                }
            }
            this.layoutCompositeBar(); // Need to relayout composite bar since different panels have different action bar width
            this.layoutEmptyMessage();
        }
        onPanelClose(panel) {
            const id = panel.getId();
            if (this.activePanelContextKey.get() === id) {
                this.activePanelContextKey.reset();
            }
            this.compositeBar.deactivateComposite(panel.getId());
            this.layoutEmptyMessage();
        }
        create(parent) {
            this.element = parent;
            super.create(parent);
            this.createEmptyPanelMessage();
            const focusTracker = this._register(dom_1.trackFocus(parent));
            this._register(focusTracker.onDidFocus(() => this.panelFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.panelFocusContextKey.set(false)));
        }
        createEmptyPanelMessage() {
            const contentArea = this.getContentArea();
            this.emptyPanelMessageElement = document.createElement('div');
            dom_1.addClass(this.emptyPanelMessageElement, 'empty-panel-message-area');
            const messageElement = document.createElement('div');
            dom_1.addClass(messageElement, 'empty-panel-message');
            messageElement.innerText = nls_1.localize('panel.emptyMessage', "Drag a view into the panel to display.");
            this.emptyPanelMessageElement.appendChild(messageElement);
            contentArea.appendChild(this.emptyPanelMessageElement);
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.emptyPanelMessageElement, {
                onDragOver: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    const validDropTarget = this.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                    dnd_1.toggleDropEffect(e.eventData.dataTransfer, 'move', validDropTarget);
                },
                onDragEnter: (e) => {
                    var _a;
                    dom_1.EventHelper.stop(e.eventData, true);
                    const validDropTarget = this.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                    this.emptyPanelMessageElement.style.backgroundColor = validDropTarget ? ((_a = this.theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND)) === null || _a === void 0 ? void 0 : _a.toString()) || '' : '';
                },
                onDragLeave: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPanelMessageElement.style.backgroundColor = '';
                },
                onDragEnd: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPanelMessageElement.style.backgroundColor = '';
                },
                onDrop: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPanelMessageElement.style.backgroundColor = '';
                    this.dndHandler.drop(e.dragAndDropData, undefined, e.eventData);
                },
            }));
        }
        updateStyles() {
            super.updateStyles();
            const container = types_1.assertIsDefined(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.PANEL_BACKGROUND) || '';
            const borderColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            container.style.borderLeftColor = borderColor;
            container.style.borderRightColor = borderColor;
            const title = this.getTitleArea();
            if (title) {
                title.style.borderTopColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            }
        }
        doOpenPanel(id, focus) {
            if (this.blockOpeningPanel) {
                return undefined; // Workaround against a potential race condition
            }
            // First check if panel is hidden and show if so
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                try {
                    this.blockOpeningPanel = true;
                    this.layoutService.setPanelHidden(false);
                }
                finally {
                    this.blockOpeningPanel = false;
                }
            }
            return this.openComposite(id, focus);
        }
        async openPanel(id, focus) {
            if (typeof id === 'string' && this.getPanel(id)) {
                return this.doOpenPanel(id, focus);
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (typeof id === 'string' && this.getPanel(id)) {
                return this.doOpenPanel(id, focus);
            }
            return undefined;
        }
        showActivity(panelId, badge, clazz) {
            return this.compositeBar.showActivity(panelId, badge, clazz);
        }
        getPanel(panelId) {
            return this.panelRegistry.getPanel(panelId);
        }
        getPanels() {
            return this.panelRegistry.getPanels()
                .sort((v1, v2) => {
                if (typeof v1.order !== 'number') {
                    return 1;
                }
                if (typeof v2.order !== 'number') {
                    return -1;
                }
                return v1.order - v2.order;
            });
        }
        getPinnedPanels() {
            const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(c => c.id);
            return this.getPanels()
                .filter(p => pinnedCompositeIds.indexOf(p.id) !== -1)
                .sort((p1, p2) => pinnedCompositeIds.indexOf(p1.id) - pinnedCompositeIds.indexOf(p2.id));
        }
        getActions() {
            return [
                this.instantiationService.createInstance(panelActions_1.ToggleMaximizedPanelAction, panelActions_1.ToggleMaximizedPanelAction.ID, panelActions_1.ToggleMaximizedPanelAction.LABEL),
                this.instantiationService.createInstance(panelActions_1.ClosePanelAction, panelActions_1.ClosePanelAction.ID, panelActions_1.ClosePanelAction.LABEL)
            ];
        }
        getActivePanel() {
            return this.getActiveComposite();
        }
        getLastActivePanelId() {
            return this.getLastActiveCompositetId();
        }
        hideActivePanel() {
            // First check if panel is visible and hide if so
            if (this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                this.layoutService.setPanelHidden(true);
            }
            this.hideActiveComposite();
        }
        createTitleLabel(parent) {
            const titleArea = this.compositeBar.create(parent);
            titleArea.classList.add('panel-switcher-container');
            return {
                updateTitle: (id, title, keybinding) => {
                    const action = this.compositeBar.getAction(id);
                    if (action) {
                        action.label = title;
                    }
                },
                updateStyles: () => {
                    // Handled via theming participant
                }
            };
        }
        layout(width, height) {
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                return;
            }
            if (this.layoutService.getPanelPosition() === 1 /* RIGHT */) {
                this.contentDimension = new dom_1.Dimension(width - 1, height); // Take into account the 1px border when layouting
            }
            else {
                this.contentDimension = new dom_1.Dimension(width, height);
            }
            // Layout contents
            super.layout(this.contentDimension.width, this.contentDimension.height);
            // Layout composite bar
            this.layoutCompositeBar();
            // Add empty panel message
            this.layoutEmptyMessage();
        }
        layoutCompositeBar() {
            if (this.contentDimension && this.dimension) {
                let availableWidth = this.contentDimension.width - 40; // take padding into account
                if (this.toolBar) {
                    availableWidth = Math.max(PanelPart.MIN_COMPOSITE_BAR_WIDTH, availableWidth - this.getToolbarWidth()); // adjust height for global actions showing
                }
                this.compositeBar.layout(new dom_1.Dimension(availableWidth, this.dimension.height));
            }
        }
        layoutEmptyMessage() {
            if (this.emptyPanelMessageElement) {
                dom_1.toggleClass(this.emptyPanelMessageElement, 'visible', this.compositeBar.getVisibleComposites().length === 0);
            }
        }
        getCompositeActions(compositeId) {
            let compositeActions = this.compositeActions.get(compositeId);
            if (!compositeActions) {
                const panel = this.getPanel(compositeId);
                const cachedPanel = this.getCachedPanels().filter(p => p.id === compositeId)[0];
                if (panel && (cachedPanel === null || cachedPanel === void 0 ? void 0 : cachedPanel.name)) {
                    panel.name = cachedPanel.name;
                }
                if (panel) {
                    compositeActions = {
                        activityAction: new panelActions_1.PanelActivityAction(types_1.assertIsDefined(this.getPanel(compositeId)), this),
                        pinnedAction: new compositeBarActions_1.ToggleCompositePinnedAction(this.getPanel(compositeId), this.compositeBar)
                    };
                }
                else {
                    compositeActions = {
                        activityAction: new panelActions_1.PlaceHolderPanelActivityAction(compositeId, this),
                        pinnedAction: new panelActions_1.PlaceHolderToggleCompositePinnedAction(compositeId, this.compositeBar)
                    };
                }
                this.compositeActions.set(compositeId, compositeActions);
            }
            return compositeActions;
        }
        removeComposite(compositeId) {
            if (super.removeComposite(compositeId)) {
                this.compositeBar.removeComposite(compositeId);
                const compositeActions = this.compositeActions.get(compositeId);
                if (compositeActions) {
                    compositeActions.activityAction.dispose();
                    compositeActions.pinnedAction.dispose();
                    this.compositeActions.delete(compositeId);
                }
                return true;
            }
            return false;
        }
        getToolbarWidth() {
            const activePanel = this.getActivePanel();
            if (!activePanel || !this.toolBar) {
                return 0;
            }
            return this.toolBar.getItemsWidth();
        }
        onDidStorageChange(e) {
            if (e.key === PanelPart.PINNED_PANELS && e.scope === 0 /* GLOBAL */
                && this.cachedPanelsValue !== this.getStoredCachedPanelsValue() /* This checks if current window changed the value or not */) {
                this._cachedPanelsValue = undefined;
                const newCompositeItems = [];
                const compositeItems = this.compositeBar.getCompositeBarItems();
                const cachedPanels = this.getCachedPanels();
                for (const cachedPanel of cachedPanels) {
                    // copy behavior from activity bar
                    newCompositeItems.push({
                        id: cachedPanel.id,
                        name: cachedPanel.name,
                        order: cachedPanel.order,
                        pinned: cachedPanel.pinned,
                        visible: !!compositeItems.find(({ id }) => id === cachedPanel.id)
                    });
                }
                for (let index = 0; index < compositeItems.length; index++) {
                    // Add items currently exists but does not exist in new.
                    if (!newCompositeItems.some(({ id }) => id === compositeItems[index].id)) {
                        newCompositeItems.splice(index, 0, compositeItems[index]);
                    }
                }
                this.compositeBar.setCompositeBarItems(newCompositeItems);
            }
        }
        saveCachedPanels() {
            const state = [];
            const placeholders = [];
            const compositeItems = this.compositeBar.getCompositeBarItems();
            for (const compositeItem of compositeItems) {
                const viewContainer = this.getViewContainer(compositeItem.id);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    state.push({ id: compositeItem.id, name: viewContainerModel.title, pinned: compositeItem.pinned, order: compositeItem.order, visible: compositeItem.visible });
                    placeholders.push({ id: compositeItem.id, name: this.getCompositeActions(compositeItem.id).activityAction.label });
                }
            }
            this.cachedPanelsValue = JSON.stringify(state);
            this.setPlaceholderViewContainers(placeholders);
        }
        getCachedPanels() {
            const registeredPanels = this.getPanels();
            const storedStates = JSON.parse(this.cachedPanelsValue);
            const cachedPanels = storedStates.map(c => {
                const serialized = typeof c === 'string' /* migration from pinned states to composites states */ ? { id: c, pinned: true, order: undefined, visible: true } : c;
                const registered = registeredPanels.some(p => p.id === serialized.id);
                serialized.visible = registered ? types_1.isUndefinedOrNull(serialized.visible) ? true : serialized.visible : false;
                return serialized;
            });
            for (const placeholderViewContainer of this.getPlaceholderViewContainers()) {
                const cachedViewContainer = cachedPanels.filter(cached => cached.id === placeholderViewContainer.id)[0];
                if (cachedViewContainer) {
                    cachedViewContainer.name = placeholderViewContainer.name;
                }
            }
            return cachedPanels;
        }
        get cachedPanelsValue() {
            if (!this._cachedPanelsValue) {
                this._cachedPanelsValue = this.getStoredCachedPanelsValue();
            }
            return this._cachedPanelsValue;
        }
        set cachedPanelsValue(cachedViewletsValue) {
            if (this.cachedPanelsValue !== cachedViewletsValue) {
                this._cachedPanelsValue = cachedViewletsValue;
                this.setStoredCachedViewletsValue(cachedViewletsValue);
            }
        }
        getStoredCachedPanelsValue() {
            return this.storageService.get(PanelPart.PINNED_PANELS, 0 /* GLOBAL */, '[]');
        }
        setStoredCachedViewletsValue(value) {
            this.storageService.store(PanelPart.PINNED_PANELS, value, 0 /* GLOBAL */);
        }
        getPlaceholderViewContainers() {
            return JSON.parse(this.placeholderViewContainersValue);
        }
        setPlaceholderViewContainers(placeholderViewContainers) {
            this.placeholderViewContainersValue = JSON.stringify(placeholderViewContainers);
        }
        get placeholderViewContainersValue() {
            if (!this._placeholderViewContainersValue) {
                this._placeholderViewContainersValue = this.getStoredPlaceholderViewContainersValue();
            }
            return this._placeholderViewContainersValue;
        }
        set placeholderViewContainersValue(placeholderViewContainesValue) {
            if (this.placeholderViewContainersValue !== placeholderViewContainesValue) {
                this._placeholderViewContainersValue = placeholderViewContainesValue;
                this.setStoredPlaceholderViewContainersValue(placeholderViewContainesValue);
            }
        }
        getStoredPlaceholderViewContainersValue() {
            return this.storageService.get(PanelPart.PLACEHOLDER_VIEW_CONTAINERS, 1 /* WORKSPACE */, '[]');
        }
        setStoredPlaceholderViewContainersValue(value) {
            this.storageService.store(PanelPart.PLACEHOLDER_VIEW_CONTAINERS, value, 1 /* WORKSPACE */);
        }
        getViewContainer(panelId) {
            return this.viewDescriptorService.getViewContainerById(panelId) || undefined;
        }
        toJSON() {
            return {
                type: "workbench.parts.panel" /* PANEL_PART */
            };
        }
    };
    PanelPart.activePanelSettingsKey = 'workbench.panelpart.activepanelid';
    PanelPart.PINNED_PANELS = 'workbench.panel.pinnedPanels';
    PanelPart.PLACEHOLDER_VIEW_CONTAINERS = 'workbench.panel.placeholderPanels';
    PanelPart.MIN_COMPOSITE_BAR_WIDTH = 50;
    PanelPart = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, extensions_2.IExtensionService),
        __param(11, storageKeys_1.IStorageKeysSyncRegistryService)
    ], PanelPart);
    exports.PanelPart = PanelPart;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Panel Background: since panels can host editors, we apply a background rule if the panel background
        // color is different from the editor background color. This is a bit of a hack though. The better way
        // would be to have a way to push the background color onto each editor widget itself somehow.
        const panelBackground = theme.getColor(theme_1.PANEL_BACKGROUND);
        if (panelBackground && panelBackground !== theme.getColor(colorRegistry_1.editorBackground)) {
            collector.addRule(`
			.monaco-workbench .part.panel > .content .monaco-editor,
			.monaco-workbench .part.panel > .content .monaco-editor .margin,
			.monaco-workbench .part.panel > .content .monaco-editor .monaco-editor-background {
				background-color: ${panelBackground};
			}
		`);
        }
        // Title Active
        const titleActive = theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND);
        const titleActiveBorder = theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER);
        if (titleActive || titleActiveBorder) {
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:hover .action-label {
				color: ${titleActive} !important;
				border-bottom-color: ${titleActiveBorder} !important;
			}
		`);
        }
        // Title focus
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus .action-label {
				color: ${titleActive} !important;
				border-bottom-color: ${focusBorderColor} !important;
				border-bottom: 1px solid;
			}
			`);
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus {
				outline: none;
			}
			`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item.checked .action-label,
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item .action-label:hover {
				outline-color: ${outline};
				outline-width: 1px;
				outline-style: solid;
				border-bottom: none;
				padding-bottom: 0;
				outline-offset: 1px;
			}

			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:not(.checked) .action-label:hover {
				outline-style: dashed;
			}
		`);
        }
        const inputBorder = theme.getColor(theme_1.PANEL_INPUT_BORDER);
        if (inputBorder) {
            collector.addRule(`
			.monaco-workbench .part.panel .monaco-inputbox {
				border-color: ${inputBorder}
			}
		`);
        }
    });
    extensions_1.registerSingleton(panelService_1.IPanelService, PanelPart);
});
//# __sourceMappingURL=panelPart.js.map