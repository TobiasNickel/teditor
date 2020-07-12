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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/common/activity", "vs/workbench/browser/part", "vs/workbench/browser/parts/activitybar/activitybarActions", "vs/workbench/services/activity/common/activity", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/browser/actions/layoutActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/compositeBar", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/activityBar/browser/activityBarService", "vs/platform/instantiation/common/extensions", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/configuration/common/configuration", "vs/platform/windows/common/windows", "vs/base/common/platform", "vs/platform/userDataSync/common/storageKeys", "vs/base/common/codicons", "vs/base/common/actions", "vs/base/common/event", "vs/css!./media/activitybarpart"], function (require, exports, nls, actionbar_1, activity_1, part_1, activitybarActions_1, activity_2, layoutService_1, instantiation_1, lifecycle_1, layoutActions_1, themeService_1, theme_1, colorRegistry_1, compositeBar_1, dom_1, storage_1, extensions_1, uri_1, compositeBarActions_1, views_1, contextkey_1, types_1, activityBarService_1, extensions_2, network_1, environmentService_1, menubarControl_1, configuration_1, windows_1, platform_1, storageKeys_1, codicons_1, actions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivitybarPart = void 0;
    let ActivitybarPart = class ActivitybarPart extends part_1.Part {
        constructor(instantiationService, layoutService, themeService, storageService, extensionService, viewDescriptorService, viewsService, contextKeyService, configurationService, environmentService, storageKeysSyncRegistryService) {
            super("workbench.parts.activitybar" /* ACTIVITYBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            //#region IView
            this.minimumWidth = 48;
            this.maximumWidth = 48;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.globalActivity = [];
            this.compositeActions = new Map();
            this.viewContainerDisposables = new Map();
            this.location = views_1.ViewContainerLocation.Sidebar;
            this._cachedViewContainers = undefined;
            storageKeysSyncRegistryService.registerStorageKey({ key: ActivitybarPart.PINNED_VIEW_CONTAINERS, version: 1 });
            storageKeysSyncRegistryService.registerStorageKey({ key: ActivitybarPart.HOME_BAR_VISIBILITY_PREFERENCE, version: 1 });
            this.migrateFromOldCachedViewContainersValue();
            for (const cachedViewContainer of this.cachedViewContainers) {
                if (environmentService.configuration.remoteAuthority // In remote window, hide activity bar entries until registered.
                    || this.shouldBeHidden(cachedViewContainer.id, cachedViewContainer)) {
                    cachedViewContainer.visible = false;
                }
            }
            const cachedItems = this.cachedViewContainers
                .map(v => ({ id: v.id, name: v.name, visible: v.visible, order: v.order, pinned: v.pinned }));
            this.compositeBar = this._register(this.instantiationService.createInstance(compositeBar_1.CompositeBar, cachedItems, {
                icon: true,
                orientation: 2 /* VERTICAL */,
                openComposite: (compositeId) => this.viewsService.openViewContainer(compositeId, true),
                getActivityAction: (compositeId) => this.getCompositeActions(compositeId).activityAction,
                getCompositePinnedAction: (compositeId) => this.getCompositeActions(compositeId).pinnedAction,
                getOnCompositeClickAction: (compositeId) => new actions_1.Action(compositeId, '', '', true, () => this.viewsService.isViewContainerVisible(compositeId) ? Promise.resolve(this.viewsService.closeViewContainer(compositeId)) : this.viewsService.openViewContainer(compositeId)),
                getContextMenuActions: () => {
                    const menuBarVisibility = windows_1.getMenuBarVisibility(this.configurationService, this.environmentService);
                    const actions = [];
                    if (this.homeBarContainer) {
                        actions.push(new actions_1.Action('toggleHomeBarAction', this.homeBarVisibilityPreference ? nls.localize('hideHomeBar', "Hide Home Button") : nls.localize('showHomeBar', "Show Home Button"), undefined, true, async () => { this.homeBarVisibilityPreference = !this.homeBarVisibilityPreference; }));
                    }
                    if (menuBarVisibility === 'compact' || (menuBarVisibility === 'hidden' && platform_1.isWeb)) {
                        actions.push(this.instantiationService.createInstance(layoutActions_1.ToggleMenuBarAction, layoutActions_1.ToggleMenuBarAction.ID, menuBarVisibility === 'compact' ? nls.localize('hideMenu', "Hide Menu") : nls.localize('showMenu', "Show Menu")));
                    }
                    actions.push(this.instantiationService.createInstance(layoutActions_1.ToggleActivityBarVisibilityAction, layoutActions_1.ToggleActivityBarVisibilityAction.ID, nls.localize('hideActivitBar', "Hide Activity Bar")));
                    return actions;
                },
                getContextMenuActionsForComposite: compositeId => this.getContextMenuActionsForComposite(compositeId),
                getDefaultCompositeId: () => this.viewDescriptorService.getDefaultViewContainer(this.location).id,
                hidePart: () => this.layoutService.setSideBarHidden(true),
                dndHandler: new compositeBar_1.CompositeDragAndDrop(this.viewDescriptorService, views_1.ViewContainerLocation.Sidebar, (id, focus) => this.viewsService.openViewContainer(id, focus), (from, to, before) => this.compositeBar.move(from, to, before === null || before === void 0 ? void 0 : before.verticallyBefore), () => this.compositeBar.getCompositeBarItems()),
                compositeSize: 52,
                colors: (theme) => this.getActivitybarItemColors(theme),
                overflowActionSize: ActivitybarPart.ACTION_HEIGHT
            }));
            this.onDidRegisterViewContainers(this.getViewContainers());
            this.registerListeners();
        }
        focusActivityBar() {
            this.compositeBar.focus();
        }
        getContextMenuActionsForComposite(compositeId) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(compositeId);
            const actions = [];
            const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(viewContainer);
            if (defaultLocation !== this.viewDescriptorService.getViewContainerLocation(viewContainer)) {
                actions.push(new actions_1.Action('resetLocationAction', nls.localize('resetLocation', "Reset Location"), undefined, true, async () => {
                    this.viewDescriptorService.moveViewContainerToLocation(viewContainer, defaultLocation);
                }));
            }
            else {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                if (viewContainerModel.allViewDescriptors.length === 1) {
                    const viewToReset = viewContainerModel.allViewDescriptors[0];
                    const defaultContainer = this.viewDescriptorService.getDefaultContainerById(viewToReset.id);
                    if (defaultContainer !== viewContainer) {
                        actions.push(new actions_1.Action('resetLocationAction', nls.localize('resetLocation', "Reset Location"), undefined, true, async () => {
                            this.viewDescriptorService.moveViewsToContainer([viewToReset], defaultContainer);
                        }));
                    }
                }
            }
            return actions;
        }
        registerListeners() {
            // View Container Changes
            this._register(this.viewDescriptorService.onDidChangeViewContainers(({ added, removed }) => this.onDidChangeViewContainers(added, removed)));
            this._register(this.viewDescriptorService.onDidChangeContainerLocation(({ viewContainer, from, to }) => this.onDidChangeViewContainerLocation(viewContainer, from, to)));
            // View Container Visibility Changes
            this._register(event_1.Event.filter(this.viewsService.onDidChangeViewContainerVisibility, e => e.location === this.location)(({ id, visible }) => this.onDidChangeViewContainerVisibility(id, visible)));
            // Extension registration
            let disposables = this._register(new lifecycle_1.DisposableStore());
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                disposables.clear();
                this.onDidRegisterExtensions();
                this.compositeBar.onDidChange(() => this.saveCachedViewContainers(), this, disposables);
                this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e), this, disposables);
            }));
            // Register for configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.menuBarVisibility')) {
                    if (windows_1.getMenuBarVisibility(this.configurationService, this.environmentService) === 'compact') {
                        this.installMenubar();
                    }
                    else {
                        this.uninstallMenubar();
                    }
                }
            }));
        }
        onDidChangeViewContainers(added, removed) {
            removed.filter(({ location }) => location === views_1.ViewContainerLocation.Sidebar).forEach(({ container }) => this.onDidDeregisterViewContainer(container));
            this.onDidRegisterViewContainers(added.filter(({ location }) => location === views_1.ViewContainerLocation.Sidebar).map(({ container }) => container));
        }
        onDidChangeViewContainerLocation(container, from, to) {
            if (from === this.location) {
                this.onDidDeregisterViewContainer(container);
            }
            if (to === this.location) {
                this.onDidRegisterViewContainers([container]);
            }
        }
        onDidChangeViewContainerVisibility(id, visible) {
            if (visible) {
                // Activate view container action on opening of a view container
                this.onDidViewContainerVisible(id);
            }
            else {
                // Deactivate view container action on close
                this.compositeBar.deactivateComposite(id);
            }
        }
        onDidChangeHomeBarVisibility() {
            if (this.homeBarContainer) {
                this.homeBarContainer.style.display = this.homeBarVisibilityPreference ? '' : 'none';
            }
        }
        onDidRegisterExtensions() {
            this.removeNotExistingComposites();
            this.saveCachedViewContainers();
        }
        onDidViewContainerVisible(id) {
            const viewContainer = this.getViewContainer(id);
            if (viewContainer) {
                // Update the composite bar by adding
                this.compositeBar.addComposite(viewContainer);
                this.compositeBar.activateComposite(viewContainer.id);
                if (viewContainer.hideIfEmpty) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    if (viewContainerModel.activeViewDescriptors.length === 0) {
                        this.hideComposite(viewContainer.id); // Update the composite bar by hiding
                    }
                }
            }
        }
        showActivity(viewContainerOrActionId, badge, clazz, priority) {
            if (this.getViewContainer(viewContainerOrActionId)) {
                return this.compositeBar.showActivity(viewContainerOrActionId, badge, clazz, priority);
            }
            if (viewContainerOrActionId === activity_1.GLOBAL_ACTIVITY_ID) {
                return this.showGlobalActivity(badge, clazz, priority);
            }
            if (viewContainerOrActionId === activity_1.ACCOUNTS_ACTIIVTY_ID) {
                if (this.accountsActivityAction) {
                    this.accountsActivityAction.setBadge(badge, clazz);
                    return lifecycle_1.toDisposable(() => { var _a; return (_a = this.accountsActivityAction) === null || _a === void 0 ? void 0 : _a.setBadge(undefined); });
                }
            }
            return lifecycle_1.Disposable.None;
        }
        showGlobalActivity(badge, clazz, priority) {
            if (typeof priority !== 'number') {
                priority = 0;
            }
            const activity = { badge, clazz, priority };
            for (let i = 0; i <= this.globalActivity.length; i++) {
                if (i === this.globalActivity.length) {
                    this.globalActivity.push(activity);
                    break;
                }
                else if (this.globalActivity[i].priority <= priority) {
                    this.globalActivity.splice(i, 0, activity);
                    break;
                }
            }
            this.updateGlobalActivity();
            return lifecycle_1.toDisposable(() => this.removeGlobalActivity(activity));
        }
        removeGlobalActivity(activity) {
            const index = this.globalActivity.indexOf(activity);
            if (index !== -1) {
                this.globalActivity.splice(index, 1);
                this.updateGlobalActivity();
            }
        }
        updateGlobalActivity() {
            const globalActivityAction = types_1.assertIsDefined(this.globalActivityAction);
            if (this.globalActivity.length) {
                const [{ badge, clazz, priority }] = this.globalActivity;
                if (badge instanceof activity_2.NumberBadge && this.globalActivity.length > 1) {
                    const cumulativeNumberBadge = this.getCumulativeNumberBadge(priority);
                    globalActivityAction.setBadge(cumulativeNumberBadge);
                }
                else {
                    globalActivityAction.setBadge(badge, clazz);
                }
            }
            else {
                globalActivityAction.setBadge(undefined);
            }
        }
        getCumulativeNumberBadge(priority) {
            const numberActivities = this.globalActivity.filter(activity => activity.badge instanceof activity_2.NumberBadge && activity.priority === priority);
            let number = numberActivities.reduce((result, activity) => { return result + activity.badge.number; }, 0);
            let descriptorFn = () => {
                return numberActivities.reduce((result, activity, index) => {
                    result = result + activity.badge.getDescription();
                    if (index < numberActivities.length - 1) {
                        result = result + '\n';
                    }
                    return result;
                }, '');
            };
            return new activity_2.NumberBadge(number, descriptorFn);
        }
        uninstallMenubar() {
            if (this.menuBar) {
                this.menuBar.dispose();
            }
            if (this.menuBarContainer) {
                dom_1.removeNode(this.menuBarContainer);
            }
        }
        installMenubar() {
            this.menuBarContainer = document.createElement('div');
            dom_1.addClass(this.menuBarContainer, 'menubar');
            const content = types_1.assertIsDefined(this.content);
            content.prepend(this.menuBarContainer);
            // Menubar: install a custom menu bar depending on configuration
            this.menuBar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.menuBar.create(this.menuBarContainer);
        }
        createContentArea(parent) {
            var _a;
            this.element = parent;
            this.content = document.createElement('div');
            dom_1.addClass(this.content, 'content');
            parent.appendChild(this.content);
            // Home action bar
            const homeIndicator = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.homeIndicator;
            if (homeIndicator) {
                let codicon = codicons_1.iconRegistry.get(homeIndicator.icon);
                if (!codicon) {
                    console.warn(`Unknown home indicator icon ${homeIndicator.icon}`);
                    codicon = codicons_1.Codicon.code;
                }
                this.createHomeBar(homeIndicator.href, homeIndicator.command, homeIndicator.title, codicon);
                this.onDidChangeHomeBarVisibility();
            }
            // Install menubar if compact
            if (windows_1.getMenuBarVisibility(this.configurationService, this.environmentService) === 'compact') {
                this.installMenubar();
            }
            // View Containers action bar
            this.compositeBar.create(this.content);
            // Global action bar
            const globalActivities = document.createElement('div');
            dom_1.addClass(globalActivities, 'global-activity');
            this.content.appendChild(globalActivities);
            this.createGlobalActivityActionBar(globalActivities);
            return this.content;
        }
        createHomeBar(href, command, title, icon) {
            this.homeBarContainer = document.createElement('div');
            this.homeBarContainer.setAttribute('aria-label', nls.localize('homeIndicator', "Home"));
            this.homeBarContainer.setAttribute('role', 'toolbar');
            dom_1.addClass(this.homeBarContainer, 'home-bar');
            this.homeBar = this._register(new actionbar_1.ActionBar(this.homeBarContainer, {
                orientation: 2 /* VERTICAL */,
                animated: false,
                ariaLabel: nls.localize('home', "Home"),
                actionViewItemProvider: command ? undefined : action => new activitybarActions_1.HomeActionViewItem(action),
                allowContextMenu: true
            }));
            const homeBarIconBadge = document.createElement('div');
            dom_1.addClass(homeBarIconBadge, 'home-bar-icon-badge');
            this.homeBarContainer.appendChild(homeBarIconBadge);
            if (command) {
                this.homeBar.push(this._register(this.instantiationService.createInstance(activitybarActions_1.DeprecatedHomeAction, command, title, icon)), { icon: true, label: false });
            }
            else {
                this.homeBar.push(this._register(this.instantiationService.createInstance(activitybarActions_1.HomeAction, href, title, icon)));
            }
            const content = types_1.assertIsDefined(this.content);
            content.prepend(this.homeBarContainer);
        }
        updateStyles() {
            super.updateStyles();
            const container = types_1.assertIsDefined(this.getContainer());
            const background = this.getColor(theme_1.ACTIVITY_BAR_BACKGROUND) || '';
            container.style.backgroundColor = background;
            const borderColor = this.getColor(theme_1.ACTIVITY_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            const isPositionLeft = this.layoutService.getSideBarPosition() === 0 /* LEFT */;
            container.style.boxSizing = borderColor && isPositionLeft ? 'border-box' : '';
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : '';
            container.style.borderRightColor = isPositionLeft ? borderColor : '';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : '';
            container.style.borderLeftColor = !isPositionLeft ? borderColor : '';
        }
        getActivitybarItemColors(theme) {
            return {
                activeForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND),
                inactiveForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_INACTIVE_FOREGROUND),
                activeBorderColor: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER),
                activeBackground: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND),
                badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                dragAndDropBorder: theme.getColor(theme_1.ACTIVITY_BAR_DRAG_AND_DROP_BORDER),
                activeBackgroundColor: undefined, inactiveBackgroundColor: undefined, activeBorderBottomColor: undefined,
            };
        }
        createGlobalActivityActionBar(container) {
            this.globalActivityActionBar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: action => {
                    if (action.id === 'workbench.actions.manage') {
                        return this.instantiationService.createInstance(activitybarActions_1.GlobalActivityActionViewItem, action, (theme) => this.getActivitybarItemColors(theme));
                    }
                    if (action.id === 'workbench.actions.accounts') {
                        return this.instantiationService.createInstance(activitybarActions_1.AccountsActionViewItem, action, (theme) => this.getActivitybarItemColors(theme));
                    }
                    throw new Error(`No view item for action '${action.id}'`);
                },
                orientation: 2 /* VERTICAL */,
                ariaLabel: nls.localize('manage', "Manage"),
                animated: false
            }));
            this.globalActivityAction = new compositeBarActions_1.ActivityAction({
                id: 'workbench.actions.manage',
                name: nls.localize('manage', "Manage"),
                cssClass: codicons_1.Codicon.settingsGear.classNames
            });
            this.accountsActivityAction = new compositeBarActions_1.ActivityAction({
                id: 'workbench.actions.accounts',
                name: nls.localize('accounts', "Accounts"),
                cssClass: codicons_1.Codicon.account.classNames
            });
            this.globalActivityActionBar.push(this.accountsActivityAction);
            this.globalActivityActionBar.push(this.globalActivityAction);
        }
        getCompositeActions(compositeId) {
            let compositeActions = this.compositeActions.get(compositeId);
            if (!compositeActions) {
                const viewContainer = this.getViewContainer(compositeId);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    compositeActions = {
                        activityAction: this.instantiationService.createInstance(activitybarActions_1.ViewContainerActivityAction, this.toActivity(viewContainer, viewContainerModel)),
                        pinnedAction: new compositeBarActions_1.ToggleCompositePinnedAction(viewContainer, this.compositeBar)
                    };
                }
                else {
                    const cachedComposite = this.cachedViewContainers.filter(c => c.id === compositeId)[0];
                    compositeActions = {
                        activityAction: this.instantiationService.createInstance(activitybarActions_1.PlaceHolderViewContainerActivityAction, ActivitybarPart.toActivity(compositeId, compositeId, cachedComposite === null || cachedComposite === void 0 ? void 0 : cachedComposite.icon, undefined)),
                        pinnedAction: new activitybarActions_1.PlaceHolderToggleCompositePinnedAction(compositeId, this.compositeBar)
                    };
                }
                this.compositeActions.set(compositeId, compositeActions);
            }
            return compositeActions;
        }
        onDidRegisterViewContainers(viewContainers) {
            for (const viewContainer of viewContainers) {
                const cachedViewContainer = this.cachedViewContainers.filter(({ id }) => id === viewContainer.id)[0];
                const visibleViewContainer = this.viewsService.getVisibleViewContainer(this.location);
                const isActive = (visibleViewContainer === null || visibleViewContainer === void 0 ? void 0 : visibleViewContainer.id) === viewContainer.id;
                if (isActive || !this.shouldBeHidden(viewContainer.id, cachedViewContainer)) {
                    this.compositeBar.addComposite(viewContainer);
                    // Pin it by default if it is new
                    if (!cachedViewContainer) {
                        this.compositeBar.pin(viewContainer.id);
                    }
                    if (isActive) {
                        this.compositeBar.activateComposite(viewContainer.id);
                    }
                }
            }
            for (const viewContainer of viewContainers) {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                this.updateActivity(viewContainer, viewContainerModel);
                this.onDidChangeActiveViews(viewContainer, viewContainerModel);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(viewContainerModel.onDidChangeContainerInfo(() => this.updateActivity(viewContainer, viewContainerModel)));
                disposables.add(viewContainerModel.onDidChangeActiveViewDescriptors(() => this.onDidChangeActiveViews(viewContainer, viewContainerModel)));
                this.viewContainerDisposables.set(viewContainer.id, disposables);
            }
        }
        onDidDeregisterViewContainer(viewContainer) {
            const disposable = this.viewContainerDisposables.get(viewContainer.id);
            if (disposable) {
                disposable.dispose();
            }
            this.viewContainerDisposables.delete(viewContainer.id);
            this.removeComposite(viewContainer.id);
        }
        updateActivity(viewContainer, viewContainerModel) {
            const activity = this.toActivity(viewContainer, viewContainerModel);
            const { activityAction, pinnedAction } = this.getCompositeActions(viewContainer.id);
            activityAction.updateActivity(activity);
            if (pinnedAction instanceof activitybarActions_1.PlaceHolderToggleCompositePinnedAction) {
                pinnedAction.setActivity(activity);
            }
            this.saveCachedViewContainers();
        }
        toActivity({ id, focusCommand }, { icon, title: name }) {
            return ActivitybarPart.toActivity(id, name, icon, (focusCommand === null || focusCommand === void 0 ? void 0 : focusCommand.id) || id);
        }
        static toActivity(id, name, icon, keybindingId) {
            let cssClass = undefined;
            let iconUrl = undefined;
            if (uri_1.URI.isUri(icon)) {
                iconUrl = icon;
                cssClass = `activity-${id.replace(/\./g, '-')}`;
                const iconClass = `.monaco-workbench .activitybar .monaco-action-bar .action-label.${cssClass}`;
                dom_1.createCSSRule(iconClass, `
				mask: ${dom_1.asCSSUrl(icon)} no-repeat 50% 50%;
				mask-size: 24px;
				-webkit-mask: ${dom_1.asCSSUrl(icon)} no-repeat 50% 50%;
				-webkit-mask-size: 24px;
			`);
            }
            else if (types_1.isString(icon)) {
                cssClass = icon;
            }
            return { id, name, cssClass, iconUrl, keybindingId };
        }
        onDidChangeActiveViews(viewContainer, viewContainerModel) {
            if (viewContainerModel.activeViewDescriptors.length) {
                this.compositeBar.addComposite(viewContainer);
            }
            else if (viewContainer.hideIfEmpty) {
                this.hideComposite(viewContainer.id);
            }
        }
        shouldBeHidden(viewContainerId, cachedViewContainer) {
            const viewContainer = this.getViewContainer(viewContainerId);
            if (!viewContainer || !viewContainer.hideIfEmpty) {
                return false;
            }
            return (cachedViewContainer === null || cachedViewContainer === void 0 ? void 0 : cachedViewContainer.views) && cachedViewContainer.views.length
                ? cachedViewContainer.views.every(({ when }) => !!when && !this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(when)))
                : viewContainerId === views_1.TEST_VIEW_CONTAINER_ID /* Hide Test view container for the first time or it had no views registered before */;
        }
        removeNotExistingComposites() {
            const viewContainers = this.getViewContainers();
            for (const { id } of this.cachedViewContainers) {
                if (viewContainers.every(viewContainer => viewContainer.id !== id)) {
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
        removeComposite(compositeId) {
            this.compositeBar.removeComposite(compositeId);
            const compositeActions = this.compositeActions.get(compositeId);
            if (compositeActions) {
                compositeActions.activityAction.dispose();
                compositeActions.pinnedAction.dispose();
                this.compositeActions.delete(compositeId);
            }
        }
        getPinnedViewContainerIds() {
            const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(v => v.id);
            return this.getViewContainers()
                .filter(v => this.compositeBar.isPinned(v.id))
                .sort((v1, v2) => pinnedCompositeIds.indexOf(v1.id) - pinnedCompositeIds.indexOf(v2.id))
                .map(v => v.id);
        }
        getVisibleViewContainerIds() {
            return this.compositeBar.getVisibleComposites()
                .filter(v => { var _a; return ((_a = this.viewsService.getVisibleViewContainer(this.location)) === null || _a === void 0 ? void 0 : _a.id) === v.id || this.compositeBar.isPinned(v.id); })
                .map(v => v.id);
        }
        layout(width, height) {
            if (!this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */)) {
                return;
            }
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout composite bar
            let availableHeight = contentAreaSize.height;
            if (this.homeBarContainer) {
                availableHeight -= this.homeBarContainer.clientHeight;
            }
            if (this.menuBarContainer) {
                availableHeight -= this.menuBarContainer.clientHeight;
            }
            if (this.globalActivityActionBar) {
                availableHeight -= (this.globalActivityActionBar.viewItems.length * ActivitybarPart.ACTION_HEIGHT); // adjust height for global actions showing
            }
            this.compositeBar.layout(new dom_1.Dimension(width, availableHeight));
        }
        getViewContainer(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            return viewContainer && this.viewDescriptorService.getViewContainerLocation(viewContainer) === this.location ? viewContainer : undefined;
        }
        getViewContainers() {
            return this.viewDescriptorService.getViewContainersByLocation(this.location);
        }
        onDidStorageChange(e) {
            if (e.key === ActivitybarPart.PINNED_VIEW_CONTAINERS && e.scope === 0 /* GLOBAL */
                && this.pinnedViewContainersValue !== this.getStoredPinnedViewContainersValue() /* This checks if current window changed the value or not */) {
                this._pinnedViewContainersValue = undefined;
                this._cachedViewContainers = undefined;
                const newCompositeItems = [];
                const compositeItems = this.compositeBar.getCompositeBarItems();
                for (const cachedViewContainer of this.cachedViewContainers) {
                    newCompositeItems.push({
                        id: cachedViewContainer.id,
                        name: cachedViewContainer.name,
                        order: cachedViewContainer.order,
                        pinned: cachedViewContainer.pinned,
                        visible: !!compositeItems.find(({ id }) => id === cachedViewContainer.id)
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
            if (e.key === ActivitybarPart.HOME_BAR_VISIBILITY_PREFERENCE && e.scope === 0 /* GLOBAL */) {
                this.onDidChangeHomeBarVisibility();
            }
        }
        saveCachedViewContainers() {
            const state = [];
            const compositeItems = this.compositeBar.getCompositeBarItems();
            for (const compositeItem of compositeItems) {
                const viewContainer = this.getViewContainer(compositeItem.id);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    const views = [];
                    for (const { when } of viewContainerModel.allViewDescriptors) {
                        views.push({ when: when ? when.serialize() : undefined });
                    }
                    const cacheIcon = uri_1.URI.isUri(viewContainerModel.icon) ? viewContainerModel.icon.scheme === network_1.Schemas.file : true;
                    state.push({
                        id: compositeItem.id,
                        name: viewContainerModel.title,
                        icon: cacheIcon ? viewContainerModel.icon : undefined,
                        views,
                        pinned: compositeItem.pinned,
                        order: compositeItem.order,
                        visible: compositeItem.visible
                    });
                }
                else {
                    state.push({ id: compositeItem.id, pinned: compositeItem.pinned, order: compositeItem.order, visible: false });
                }
            }
            this.storeCachedViewContainersState(state);
        }
        get cachedViewContainers() {
            if (this._cachedViewContainers === undefined) {
                this._cachedViewContainers = this.getPinnedViewContainers();
                for (const placeholderViewContainer of this.getPlaceholderViewContainers()) {
                    const cachedViewContainer = this._cachedViewContainers.filter(cached => cached.id === placeholderViewContainer.id)[0];
                    if (cachedViewContainer) {
                        cachedViewContainer.name = placeholderViewContainer.name;
                        cachedViewContainer.icon = placeholderViewContainer.iconCSS ? placeholderViewContainer.iconCSS :
                            placeholderViewContainer.iconUrl ? uri_1.URI.revive(placeholderViewContainer.iconUrl) : undefined;
                        cachedViewContainer.views = placeholderViewContainer.views;
                    }
                }
            }
            return this._cachedViewContainers;
        }
        storeCachedViewContainersState(cachedViewContainers) {
            this.setPinnedViewContainers(cachedViewContainers.map(({ id, pinned, visible, order }) => ({
                id,
                pinned,
                visible,
                order
            })));
            this.setPlaceholderViewContainers(cachedViewContainers.map(({ id, icon, name, views }) => ({
                id,
                iconUrl: uri_1.URI.isUri(icon) ? icon : undefined,
                iconCSS: types_1.isString(icon) ? icon : undefined,
                name,
                views
            })));
        }
        getPinnedViewContainers() {
            return JSON.parse(this.pinnedViewContainersValue);
        }
        setPinnedViewContainers(pinnedViewContainers) {
            this.pinnedViewContainersValue = JSON.stringify(pinnedViewContainers);
        }
        get pinnedViewContainersValue() {
            if (!this._pinnedViewContainersValue) {
                this._pinnedViewContainersValue = this.getStoredPinnedViewContainersValue();
            }
            return this._pinnedViewContainersValue;
        }
        set pinnedViewContainersValue(pinnedViewContainersValue) {
            if (this.pinnedViewContainersValue !== pinnedViewContainersValue) {
                this._pinnedViewContainersValue = pinnedViewContainersValue;
                this.setStoredPinnedViewContainersValue(pinnedViewContainersValue);
            }
        }
        getStoredPinnedViewContainersValue() {
            return this.storageService.get(ActivitybarPart.PINNED_VIEW_CONTAINERS, 0 /* GLOBAL */, '[]');
        }
        setStoredPinnedViewContainersValue(value) {
            this.storageService.store(ActivitybarPart.PINNED_VIEW_CONTAINERS, value, 0 /* GLOBAL */);
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
            return this.storageService.get(ActivitybarPart.PLACEHOLDER_VIEW_CONTAINERS, 0 /* GLOBAL */, '[]');
        }
        setStoredPlaceholderViewContainersValue(value) {
            this.storageService.store(ActivitybarPart.PLACEHOLDER_VIEW_CONTAINERS, value, 0 /* GLOBAL */);
        }
        get homeBarVisibilityPreference() {
            return this.storageService.getBoolean(ActivitybarPart.HOME_BAR_VISIBILITY_PREFERENCE, 0 /* GLOBAL */, true);
        }
        set homeBarVisibilityPreference(value) {
            this.storageService.store(ActivitybarPart.HOME_BAR_VISIBILITY_PREFERENCE, value, 0 /* GLOBAL */);
        }
        migrateFromOldCachedViewContainersValue() {
            const value = this.storageService.get('workbench.activity.pinnedViewlets', 0 /* GLOBAL */);
            if (value !== undefined) {
                const storedStates = JSON.parse(value);
                const cachedViewContainers = storedStates.map(c => {
                    const serialized = typeof c === 'string' /* migration from pinned states to composites states */ ? { id: c, pinned: true, order: undefined, visible: true, name: undefined, icon: undefined, views: undefined } : c;
                    serialized.visible = types_1.isUndefinedOrNull(serialized.visible) ? true : serialized.visible;
                    return serialized;
                });
                this.storeCachedViewContainersState(cachedViewContainers);
                this.storageService.remove('workbench.activity.pinnedViewlets', 0 /* GLOBAL */);
            }
        }
        toJSON() {
            return {
                type: "workbench.parts.activitybar" /* ACTIVITYBAR_PART */
            };
        }
    };
    ActivitybarPart.ACTION_HEIGHT = 48;
    ActivitybarPart.PINNED_VIEW_CONTAINERS = 'workbench.activity.pinnedViewlets2';
    ActivitybarPart.PLACEHOLDER_VIEW_CONTAINERS = 'workbench.activity.placeholderViewlets';
    ActivitybarPart.HOME_BAR_VISIBILITY_PREFERENCE = 'workbench.activity.showHomeIndicator';
    ActivitybarPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, extensions_1.IExtensionService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, views_1.IViewsService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ActivitybarPart);
    exports.ActivitybarPart = ActivitybarPart;
    extensions_2.registerSingleton(activityBarService_1.IActivityBarService, ActivitybarPart);
});
//# __sourceMappingURL=activitybarPart.js.map