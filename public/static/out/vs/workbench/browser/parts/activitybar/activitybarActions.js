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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/actions", "vs/workbench/common/theme", "vs/workbench/services/activityBar/browser/activityBarService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/commands/common/commands", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/platform", "vs/base/browser/contextmenu", "vs/workbench/services/authentication/browser/authenticationService", "vs/base/common/arrays", "vs/css!./media/activityaction"], function (require, exports, nls, DOM, keyboardEvent_1, touch_1, actions_1, lifecycle_1, actions_2, contextView_1, platform_1, telemetry_1, colorRegistry_1, themeService_1, compositeBarActions_1, actions_3, theme_1, activityBarService_1, layoutService_1, viewlet_1, contextkey_1, menuEntryActionViewItem_1, commands_1, actionbar_1, platform_2, contextmenu_1, authenticationService_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeprecatedHomeAction = exports.HomeActionViewItem = exports.HomeAction = exports.NextSideBarViewAction = exports.PreviousSideBarViewAction = exports.PlaceHolderToggleCompositePinnedAction = exports.PlaceHolderViewContainerActivityAction = exports.GlobalActivityActionViewItem = exports.AccountsActionViewItem = exports.ViewContainerActivityAction = void 0;
    let ViewContainerActivityAction = class ViewContainerActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity, viewletService, layoutService, telemetryService) {
            super(activity);
            this.lastRun = 0;
            this.viewletService = viewletService;
            this.layoutService = layoutService;
            this.telemetryService = telemetryService;
        }
        updateActivity(activity) {
            this.activity = activity;
        }
        async run(event) {
            if (event instanceof MouseEvent && event.button === 2) {
                return; // do not run on right click
            }
            // prevent accident trigger on a doubleclick (to help nervous people)
            const now = Date.now();
            if (now > this.lastRun /* https://github.com/Microsoft/vscode/issues/25830 */ && now - this.lastRun < ViewContainerActivityAction.preventDoubleClickDelay) {
                return;
            }
            this.lastRun = now;
            const sideBarVisible = this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const activeViewlet = this.viewletService.getActiveViewlet();
            // Hide sidebar if selected viewlet already visible
            if (sideBarVisible && (activeViewlet === null || activeViewlet === void 0 ? void 0 : activeViewlet.getId()) === this.activity.id) {
                this.logAction('hide');
                this.layoutService.setSideBarHidden(true);
                return;
            }
            this.logAction('show');
            await this.viewletService.openViewlet(this.activity.id, true);
            return this.activate();
        }
        logAction(action) {
            this.telemetryService.publicLog2('activityBarAction', { viewletId: this.activity.id, action });
        }
    };
    ViewContainerActivityAction.preventDoubleClickDelay = 300;
    ViewContainerActivityAction = __decorate([
        __param(1, viewlet_1.IViewletService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, telemetry_1.ITelemetryService)
    ], ViewContainerActivityAction);
    exports.ViewContainerActivityAction = ViewContainerActivityAction;
    let AccountsActionViewItem = class AccountsActionViewItem extends compositeBarActions_1.ActivityActionViewItem {
        constructor(action, colors, themeService, contextMenuService, menuService, contextKeyService, authenticationService) {
            super(action, { draggable: false, colors, icon: true }, themeService);
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.authenticationService = authenticationService;
        }
        render(container) {
            super.render(container);
            // Context menus are triggered on mouse down so that an item can be picked
            // and executed with releasing the mouse over it
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.MOUSE_DOWN, (e) => {
                DOM.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.KEY_UP, (e) => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* Enter */) || event.equals(10 /* Space */)) {
                    DOM.EventHelper.stop(e, true);
                    this.showContextMenu();
                }
            }));
            this._register(DOM.addDisposableListener(this.container, touch_1.EventType.Tap, (e) => {
                DOM.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
        }
        async getActions(accountsMenu) {
            const otherCommands = accountsMenu.getActions();
            const providers = this.authenticationService.getProviderIds();
            const allSessions = providers.map(async (id) => {
                const sessions = await this.authenticationService.getSessions(id);
                const uniqueSessions = arrays_1.distinct(sessions, session => session.account.displayName);
                return {
                    providerId: id,
                    sessions: uniqueSessions
                };
            });
            const result = await Promise.all(allSessions);
            let menus = [];
            result.forEach(sessionInfo => {
                const providerDisplayName = this.authenticationService.getDisplayName(sessionInfo.providerId);
                sessionInfo.sessions.forEach(session => {
                    const accountName = session.account.displayName;
                    const menu = new contextmenu_1.ContextSubMenu(`${accountName} (${providerDisplayName})`, [
                        new actions_1.Action(`configureSessions${accountName}`, nls.localize('manageTrustedExtensions', "Manage Trusted Extensions"), '', true, _ => {
                            return this.authenticationService.manageTrustedExtensionsForAccount(sessionInfo.providerId, accountName);
                        }),
                        new actions_1.Action('signOut', nls.localize('signOut', "Sign Out"), '', true, _ => {
                            return this.authenticationService.signOutOfAccount(sessionInfo.providerId, accountName);
                        })
                    ]);
                    menus.push(menu);
                });
            });
            if (menus.length) {
                menus.push(new actionbar_1.Separator());
            }
            otherCommands.forEach(group => {
                const actions = group[1];
                menus = menus.concat(actions);
                menus.push(new actionbar_1.Separator());
            });
            return menus;
        }
        async showContextMenu() {
            const accountsActions = [];
            const accountsMenu = this.menuService.createMenu(actions_2.MenuId.AccountsContext, this.contextKeyService);
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(accountsMenu, undefined, { primary: [], secondary: accountsActions });
            const containerPosition = DOM.getDomNodePagePosition(this.container);
            const location = { x: containerPosition.left + containerPosition.width / 2, y: containerPosition.top };
            const actions = await this.getActions(accountsMenu);
            this.contextMenuService.showContextMenu({
                getAnchor: () => location,
                getActions: () => actions,
                onHide: () => {
                    accountsMenu.dispose();
                    lifecycle_1.dispose(actionsDisposable);
                }
            });
        }
    };
    AccountsActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, authenticationService_1.IAuthenticationService)
    ], AccountsActionViewItem);
    exports.AccountsActionViewItem = AccountsActionViewItem;
    let GlobalActivityActionViewItem = class GlobalActivityActionViewItem extends compositeBarActions_1.ActivityActionViewItem {
        constructor(action, colors, themeService, menuService, contextMenuService, contextKeyService) {
            super(action, { draggable: false, colors, icon: true }, themeService);
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
        }
        render(container) {
            super.render(container);
            // Context menus are triggered on mouse down so that an item can be picked
            // and executed with releasing the mouse over it
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.MOUSE_DOWN, (e) => {
                DOM.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.KEY_UP, (e) => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* Enter */) || event.equals(10 /* Space */)) {
                    DOM.EventHelper.stop(e, true);
                    this.showContextMenu();
                }
            }));
            this._register(DOM.addDisposableListener(this.container, touch_1.EventType.Tap, (e) => {
                DOM.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
        }
        showContextMenu() {
            const globalActivityActions = [];
            const globalActivityMenu = this.menuService.createMenu(actions_2.MenuId.GlobalActivity, this.contextKeyService);
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(globalActivityMenu, undefined, { primary: [], secondary: globalActivityActions });
            const containerPosition = DOM.getDomNodePagePosition(this.container);
            const location = { x: containerPosition.left + containerPosition.width / 2, y: containerPosition.top };
            this.contextMenuService.showContextMenu({
                getAnchor: () => location,
                getActions: () => globalActivityActions,
                onHide: () => {
                    globalActivityMenu.dispose();
                    lifecycle_1.dispose(actionsDisposable);
                }
            });
        }
    };
    GlobalActivityActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, actions_2.IMenuService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], GlobalActivityActionViewItem);
    exports.GlobalActivityActionViewItem = GlobalActivityActionViewItem;
    class PlaceHolderViewContainerActivityAction extends ViewContainerActivityAction {
    }
    exports.PlaceHolderViewContainerActivityAction = PlaceHolderViewContainerActivityAction;
    class PlaceHolderToggleCompositePinnedAction extends compositeBarActions_1.ToggleCompositePinnedAction {
        constructor(id, compositeBar) {
            super({ id, name: id, cssClass: undefined }, compositeBar);
        }
        setActivity(activity) {
            this.label = activity.name;
        }
    }
    exports.PlaceHolderToggleCompositePinnedAction = PlaceHolderToggleCompositePinnedAction;
    let SwitchSideBarViewAction = class SwitchSideBarViewAction extends actions_1.Action {
        constructor(id, name, viewletService, activityBarService) {
            super(id, name);
            this.viewletService = viewletService;
            this.activityBarService = activityBarService;
        }
        async run(offset) {
            const visibleViewletIds = this.activityBarService.getVisibleViewContainerIds();
            const activeViewlet = this.viewletService.getActiveViewlet();
            if (!activeViewlet) {
                return;
            }
            let targetViewletId;
            for (let i = 0; i < visibleViewletIds.length; i++) {
                if (visibleViewletIds[i] === activeViewlet.getId()) {
                    targetViewletId = visibleViewletIds[(i + visibleViewletIds.length + offset) % visibleViewletIds.length];
                    break;
                }
            }
            await this.viewletService.openViewlet(targetViewletId, true);
        }
    };
    SwitchSideBarViewAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, activityBarService_1.IActivityBarService)
    ], SwitchSideBarViewAction);
    let PreviousSideBarViewAction = class PreviousSideBarViewAction extends SwitchSideBarViewAction {
        constructor(id, name, viewletService, activityBarService) {
            super(id, name, viewletService, activityBarService);
        }
        run() {
            return super.run(-1);
        }
    };
    PreviousSideBarViewAction.ID = 'workbench.action.previousSideBarView';
    PreviousSideBarViewAction.LABEL = nls.localize('previousSideBarView', 'Previous Side Bar View');
    PreviousSideBarViewAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, activityBarService_1.IActivityBarService)
    ], PreviousSideBarViewAction);
    exports.PreviousSideBarViewAction = PreviousSideBarViewAction;
    let NextSideBarViewAction = class NextSideBarViewAction extends SwitchSideBarViewAction {
        constructor(id, name, viewletService, activityBarService) {
            super(id, name, viewletService, activityBarService);
        }
        run() {
            return super.run(1);
        }
    };
    NextSideBarViewAction.ID = 'workbench.action.nextSideBarView';
    NextSideBarViewAction.LABEL = nls.localize('nextSideBarView', 'Next Side Bar View');
    NextSideBarViewAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, activityBarService_1.IActivityBarService)
    ], NextSideBarViewAction);
    exports.NextSideBarViewAction = NextSideBarViewAction;
    class HomeAction extends actions_1.Action {
        constructor(href, name, icon) {
            super('workbench.action.home', name, icon.classNames);
            this.href = href;
        }
        async run(event) {
            let openInNewWindow = false;
            if (platform_2.isMacintosh) {
                openInNewWindow = event.metaKey;
            }
            else {
                openInNewWindow = event.ctrlKey;
            }
            if (openInNewWindow) {
                DOM.windowOpenNoOpener(this.href);
            }
            else {
                window.location.href = this.href;
            }
        }
    }
    exports.HomeAction = HomeAction;
    class HomeActionViewItem extends actionbar_1.ActionViewItem {
        constructor(action) {
            super(undefined, action, { icon: true, label: false, useEventAsContext: true });
        }
    }
    exports.HomeActionViewItem = HomeActionViewItem;
    /**
     * @deprecated TODO@ben remove me eventually
     */
    let DeprecatedHomeAction = class DeprecatedHomeAction extends actions_1.Action {
        constructor(command, name, icon, commandService) {
            super('workbench.action.home', name, icon.classNames);
            this.command = command;
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(this.command);
        }
    };
    DeprecatedHomeAction = __decorate([
        __param(3, commands_1.ICommandService)
    ], DeprecatedHomeAction);
    exports.DeprecatedHomeAction = DeprecatedHomeAction;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const activityBarBackgroundColor = theme.getColor(theme_1.ACTIVITY_BAR_BACKGROUND);
        if (activityBarBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content > .home-bar > .home-bar-icon-badge {
				background-color: ${activityBarBackgroundColor};
			}
		`);
        }
        const activityBarForegroundColor = theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND);
        if (activityBarForegroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active .action-label:not(.codicon),
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .action-label:not(.codicon),
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover .action-label:not(.codicon) {
				background-color: ${activityBarForegroundColor} !important;
			}
			.monaco-workbench .activitybar > .content .home-bar > .monaco-action-bar .action-item .action-label.codicon,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active .action-label.codicon,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .action-label.codicon,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover .action-label.codicon {
				color: ${activityBarForegroundColor} !important;
			}
		`);
        }
        const activityBarActiveBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER);
        if (activityBarActiveBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator:before {
				border-left-color: ${activityBarActiveBorderColor};
			}
		`);
        }
        const activityBarActiveFocusBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER);
        if (activityBarActiveFocusBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus::before {
				visibility: hidden;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus .active-item-indicator:before {
				visibility: visible;
				border-left-color: ${activityBarActiveFocusBorderColor};
			}
		`);
        }
        const activityBarActiveBackgroundColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND);
        if (activityBarActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator {
				z-index: 0;
				background-color: ${activityBarActiveBackgroundColor};
			}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:before {
				content: "";
				position: absolute;
				top: 9px;
				left: 9px;
				height: 32px;
				width: 32px;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before {
				outline: 1px solid;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline: 1px dashed;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus:before {
				border-left-color: ${outline};
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline-color: ${outline};
			}
		`);
        }
        // Styling without outline color
        else {
            const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusBorderColor) {
                collector.addRule(`
					.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus:before {
						border-left-color: ${focusBorderColor};
					}
				`);
            }
        }
    });
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(PreviousSideBarViewAction), 'View: Previous Side Bar View', nls.localize('view', "View"));
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NextSideBarViewAction), 'View: Next Side Bar View', nls.localize('view', "View"));
});
//# __sourceMappingURL=activitybarActions.js.map