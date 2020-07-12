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
define(["require", "exports", "vs/base/common/errors", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/debugActions", "vs/base/common/lifecycle", "vs/css!./media/debugToolBar"], function (require, exports, errors, browser, dom, arrays, mouseEvent_1, actionbar_1, layoutService_1, debug_1, debugActionViewItems_1, configuration_1, storage_1, telemetry_1, themeService_1, colorRegistry_1, nls_1, keybinding_1, contextView_1, notification_1, async_1, instantiation_1, menuEntryActionViewItem_1, actions_1, contextkey_1, debugActions_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debugIconStepBackForeground = exports.debugIconContinueForeground = exports.debugIconStepOutForeground = exports.debugIconStepIntoForeground = exports.debugIconStepOverForeground = exports.debugIconRestartForeground = exports.debugIconDisconnectForeground = exports.debugIconStopForeground = exports.debugIconPauseForeground = exports.debugIconStartForeground = exports.debugToolBarBorder = exports.debugToolBarBackground = exports.DebugToolBar = void 0;
    const DEBUG_TOOLBAR_POSITION_KEY = 'debug.actionswidgetposition';
    const DEBUG_TOOLBAR_Y_KEY = 'debug.actionswidgety';
    let DebugToolBar = class DebugToolBar extends themeService_1.Themable {
        constructor(notificationService, telemetryService, debugService, layoutService, storageService, configurationService, themeService, keybindingService, instantiationService, menuService, contextMenuService, contextKeyService) {
            var _a, _b;
            super(themeService);
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.debugService = debugService;
            this.layoutService = layoutService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.yCoordinate = 0;
            this.isVisible = false;
            this.isBuilt = false;
            this.$el = dom.$('div.debug-toolbar');
            this.$el.style.top = `${(_b = (_a = layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0}px`;
            this.dragArea = dom.append(this.$el, dom.$('div.drag-area.codicon.codicon-gripper'));
            const actionBarContainer = dom.append(this.$el, dom.$('div.action-bar-container'));
            this.debugToolBarMenu = menuService.createMenu(actions_1.MenuId.DebugToolBar, contextKeyService);
            this._register(this.debugToolBarMenu);
            this.activeActions = [];
            this.actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer, {
                orientation: 0 /* HORIZONTAL */,
                actionViewItemProvider: (action) => {
                    if (action.id === debugActions_1.FocusSessionAction.ID) {
                        return this.instantiationService.createInstance(debugActionViewItems_1.FocusSessionActionViewItem, action);
                    }
                    if (action instanceof actions_1.MenuItemAction) {
                        return new menuEntryActionViewItem_1.MenuEntryActionViewItem(action, this.keybindingService, this.notificationService, contextMenuService);
                    }
                    return undefined;
                }
            }));
            this.updateScheduler = this._register(new async_1.RunOnceScheduler(() => {
                const state = this.debugService.state;
                const toolBarLocation = this.configurationService.getValue('debug').toolBarLocation;
                if (state === 0 /* Inactive */ || toolBarLocation === 'docked' || toolBarLocation === 'hidden') {
                    return this.hide();
                }
                const { actions, disposable } = DebugToolBar.getActions(this.debugToolBarMenu, this.debugService, this.instantiationService);
                if (!arrays.equals(actions, this.activeActions, (first, second) => first.id === second.id)) {
                    this.actionBar.clear();
                    this.actionBar.push(actions, { icon: true, label: false });
                    this.activeActions = actions;
                }
                if (this.disposeOnUpdate) {
                    lifecycle_1.dispose(this.disposeOnUpdate);
                }
                this.disposeOnUpdate = disposable;
                this.show();
            }, 20));
            this.updateStyles();
            this.registerListeners();
            this.hide();
        }
        registerListeners() {
            this._register(this.debugService.onDidChangeState(() => this.updateScheduler.schedule()));
            this._register(this.debugService.getViewModel().onDidFocusSession(() => this.updateScheduler.schedule()));
            this._register(this.debugService.onDidNewSession(() => this.updateScheduler.schedule()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onDidConfigurationChange(e)));
            this._register(this.debugToolBarMenu.onDidChange(() => this.updateScheduler.schedule()));
            this._register(this.actionBar.actionRunner.onDidRun((e) => {
                // check for error
                if (e.error && !errors.isPromiseCanceledError(e.error)) {
                    this.notificationService.error(e.error);
                }
                // log in telemetry
                if (this.telemetryService) {
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'debugActionsWidget' });
                }
            }));
            this._register(dom.addDisposableListener(window, dom.EventType.RESIZE, () => this.setCoordinates()));
            this._register(dom.addDisposableGenericMouseUpListner(this.dragArea, (event) => {
                const mouseClickEvent = new mouseEvent_1.StandardMouseEvent(event);
                if (mouseClickEvent.detail === 2) {
                    // double click on debug bar centers it again #8250
                    const widgetWidth = this.$el.clientWidth;
                    this.setCoordinates(0.5 * window.innerWidth - 0.5 * widgetWidth, 0);
                    this.storePosition();
                }
            }));
            this._register(dom.addDisposableGenericMouseDownListner(this.dragArea, (event) => {
                dom.addClass(this.dragArea, 'dragged');
                const mouseMoveListener = dom.addDisposableGenericMouseMoveListner(window, (e) => {
                    var _a, _b;
                    const mouseMoveEvent = new mouseEvent_1.StandardMouseEvent(e);
                    // Prevent default to stop editor selecting text #8524
                    mouseMoveEvent.preventDefault();
                    // Reduce x by width of drag handle to reduce jarring #16604
                    this.setCoordinates(mouseMoveEvent.posx - 14, mouseMoveEvent.posy - ((_b = (_a = this.layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0));
                });
                const mouseUpListener = dom.addDisposableGenericMouseUpListner(window, (e) => {
                    this.storePosition();
                    dom.removeClass(this.dragArea, 'dragged');
                    mouseMoveListener.dispose();
                    mouseUpListener.dispose();
                });
            }));
            this._register(this.layoutService.onPartVisibilityChange(() => this.setYCoordinate()));
            this._register(browser.onDidChangeZoomLevel(() => this.setYCoordinate()));
        }
        storePosition() {
            const left = dom.getComputedStyle(this.$el).left;
            if (left) {
                const position = parseFloat(left) / window.innerWidth;
                this.storageService.store(DEBUG_TOOLBAR_POSITION_KEY, position, 0 /* GLOBAL */);
            }
        }
        updateStyles() {
            super.updateStyles();
            if (this.$el) {
                this.$el.style.backgroundColor = this.getColor(exports.debugToolBarBackground) || '';
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                this.$el.style.boxShadow = widgetShadowColor ? `0 5px 8px ${widgetShadowColor}` : '';
                const contrastBorderColor = this.getColor(colorRegistry_1.contrastBorder);
                const borderColor = this.getColor(exports.debugToolBarBorder);
                if (contrastBorderColor) {
                    this.$el.style.border = `1px solid ${contrastBorderColor}`;
                }
                else {
                    this.$el.style.border = borderColor ? `solid ${borderColor}` : 'none';
                    this.$el.style.border = '1px 0';
                }
            }
        }
        setYCoordinate(y = this.yCoordinate) {
            var _a, _b;
            const titlebarOffset = (_b = (_a = this.layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0;
            this.$el.style.top = `${titlebarOffset + y}px`;
            this.yCoordinate = y;
        }
        setCoordinates(x, y) {
            if (!this.isVisible) {
                return;
            }
            const widgetWidth = this.$el.clientWidth;
            if (x === undefined) {
                const positionPercentage = this.storageService.get(DEBUG_TOOLBAR_POSITION_KEY, 0 /* GLOBAL */);
                x = positionPercentage !== undefined ? parseFloat(positionPercentage) * window.innerWidth : (0.5 * window.innerWidth - 0.5 * widgetWidth);
            }
            x = Math.max(0, Math.min(x, window.innerWidth - widgetWidth)); // do not allow the widget to overflow on the right
            this.$el.style.left = `${x}px`;
            if (y === undefined) {
                y = this.storageService.getNumber(DEBUG_TOOLBAR_Y_KEY, 0 /* GLOBAL */, 0);
            }
            const titleAreaHeight = 35;
            if ((y < titleAreaHeight / 2) || (y > titleAreaHeight + titleAreaHeight / 2)) {
                const moveToTop = y < titleAreaHeight;
                this.setYCoordinate(moveToTop ? 0 : titleAreaHeight);
                this.storageService.store(DEBUG_TOOLBAR_Y_KEY, moveToTop ? 0 : 2 * titleAreaHeight, 0 /* GLOBAL */);
            }
        }
        onDidConfigurationChange(event) {
            if (event.affectsConfiguration('debug.hideActionBar') || event.affectsConfiguration('debug.toolBarLocation')) {
                this.updateScheduler.schedule();
            }
        }
        show() {
            if (this.isVisible) {
                this.setCoordinates();
                return;
            }
            if (!this.isBuilt) {
                this.isBuilt = true;
                this.layoutService.container.appendChild(this.$el);
            }
            this.isVisible = true;
            dom.show(this.$el);
            this.setCoordinates();
        }
        hide() {
            this.isVisible = false;
            dom.hide(this.$el);
        }
        static getActions(menu, debugService, instantiationService) {
            const actions = [];
            const disposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(menu, undefined, actions, () => false);
            if (debugService.getViewModel().isMultiSessionView()) {
                actions.push(instantiationService.createInstance(debugActions_1.FocusSessionAction, debugActions_1.FocusSessionAction.ID, debugActions_1.FocusSessionAction.LABEL));
            }
            return {
                actions: actions.filter(a => !(a instanceof actionbar_1.Separator)),
                disposable
            };
        }
        dispose() {
            super.dispose();
            if (this.$el) {
                this.$el.remove();
            }
            if (this.disposeOnUpdate) {
                lifecycle_1.dispose(this.disposeOnUpdate);
            }
        }
    };
    DebugToolBar = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, debug_1.IDebugService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, actions_1.IMenuService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, contextkey_1.IContextKeyService)
    ], DebugToolBar);
    exports.DebugToolBar = DebugToolBar;
    exports.debugToolBarBackground = colorRegistry_1.registerColor('debugToolBar.background', {
        dark: '#333333',
        light: '#F3F3F3',
        hc: '#000000'
    }, nls_1.localize('debugToolBarBackground', "Debug toolbar background color."));
    exports.debugToolBarBorder = colorRegistry_1.registerColor('debugToolBar.border', {
        dark: null,
        light: null,
        hc: null
    }, nls_1.localize('debugToolBarBorder', "Debug toolbar border color."));
    exports.debugIconStartForeground = colorRegistry_1.registerColor('debugIcon.startForeground', {
        dark: '#89D185',
        light: '#388A34',
        hc: '#89D185'
    }, nls_1.localize('debugIcon.startForeground', "Debug toolbar icon for start debugging."));
    exports.debugIconPauseForeground = colorRegistry_1.registerColor('debugIcon.pauseForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('debugIcon.pauseForeground', "Debug toolbar icon for pause."));
    exports.debugIconStopForeground = colorRegistry_1.registerColor('debugIcon.stopForeground', {
        dark: '#F48771',
        light: '#A1260D',
        hc: '#F48771'
    }, nls_1.localize('debugIcon.stopForeground', "Debug toolbar icon for stop."));
    exports.debugIconDisconnectForeground = colorRegistry_1.registerColor('debugIcon.disconnectForeground', {
        dark: '#F48771',
        light: '#A1260D',
        hc: '#F48771'
    }, nls_1.localize('debugIcon.disconnectForeground', "Debug toolbar icon for disconnect."));
    exports.debugIconRestartForeground = colorRegistry_1.registerColor('debugIcon.restartForeground', {
        dark: '#89D185',
        light: '#388A34',
        hc: '#89D185'
    }, nls_1.localize('debugIcon.restartForeground', "Debug toolbar icon for restart."));
    exports.debugIconStepOverForeground = colorRegistry_1.registerColor('debugIcon.stepOverForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('debugIcon.stepOverForeground', "Debug toolbar icon for step over."));
    exports.debugIconStepIntoForeground = colorRegistry_1.registerColor('debugIcon.stepIntoForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('debugIcon.stepIntoForeground', "Debug toolbar icon for step into."));
    exports.debugIconStepOutForeground = colorRegistry_1.registerColor('debugIcon.stepOutForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('debugIcon.stepOutForeground', "Debug toolbar icon for step over."));
    exports.debugIconContinueForeground = colorRegistry_1.registerColor('debugIcon.continueForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('debugIcon.continueForeground', "Debug toolbar icon for continue."));
    exports.debugIconStepBackForeground = colorRegistry_1.registerColor('debugIcon.stepBackForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('debugIcon.stepBackForeground', "Debug toolbar icon for step back."));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const debugIconStartColor = theme.getColor(exports.debugIconStartForeground);
        if (debugIconStartColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-start { color: ${debugIconStartColor} !important; }`);
        }
        const debugIconPauseColor = theme.getColor(exports.debugIconPauseForeground);
        if (debugIconPauseColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-pause { color: ${debugIconPauseColor} !important; }`);
        }
        const debugIconStopColor = theme.getColor(exports.debugIconStopForeground);
        if (debugIconStopColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-stop { color: ${debugIconStopColor} !important; }`);
        }
        const debugIconDisconnectColor = theme.getColor(exports.debugIconDisconnectForeground);
        if (debugIconDisconnectColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-disconnect { color: ${debugIconDisconnectColor} !important; }`);
        }
        const debugIconRestartColor = theme.getColor(exports.debugIconRestartForeground);
        if (debugIconRestartColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-restart, .monaco-workbench .codicon-debug-restart-frame { color: ${debugIconRestartColor} !important; }`);
        }
        const debugIconStepOverColor = theme.getColor(exports.debugIconStepOverForeground);
        if (debugIconStepOverColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-step-over { color: ${debugIconStepOverColor} !important; }`);
        }
        const debugIconStepIntoColor = theme.getColor(exports.debugIconStepIntoForeground);
        if (debugIconStepIntoColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-step-into { color: ${debugIconStepIntoColor} !important; }`);
        }
        const debugIconStepOutColor = theme.getColor(exports.debugIconStepOutForeground);
        if (debugIconStepOutColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-step-out { color: ${debugIconStepOutColor} !important; }`);
        }
        const debugIconContinueColor = theme.getColor(exports.debugIconContinueForeground);
        if (debugIconContinueColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-continue,.monaco-workbench .codicon-debug-reverse-continue { color: ${debugIconContinueColor} !important; }`);
        }
        const debugIconStepBackColor = theme.getColor(exports.debugIconStepBackForeground);
        if (debugIconStepBackColor) {
            collector.addRule(`.monaco-workbench .codicon-debug-step-back { color: ${debugIconStepBackColor} !important; }`);
        }
    });
});
//# __sourceMappingURL=debugToolBar.js.map