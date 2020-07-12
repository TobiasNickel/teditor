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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/quickaccess/browser/commandsQuickAccess", "vs/workbench/services/editor/common/editorService", "vs/platform/layout/browser/layoutService", "vs/nls", "vs/base/common/actions", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/common/color", "vs/base/common/codicons", "vs/css!./welcomeOverlay"], function (require, exports, dom, platform_1, keybinding_1, commandsQuickAccess_1, editorService_1, layoutService_1, nls_1, actions_1, actions_2, actions_3, commands_1, lifecycle_1, contextkey_1, instantiation_1, themeService_1, colorRegistry_1, color_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HideWelcomeOverlayAction = exports.WelcomeOverlayAction = void 0;
    const $ = dom.$;
    const keys = [
        {
            id: 'explorer',
            arrow: '&larr;',
            label: nls_1.localize('welcomeOverlay.explorer', "File explorer"),
            command: 'workbench.view.explorer'
        },
        {
            id: 'search',
            arrow: '&larr;',
            label: nls_1.localize('welcomeOverlay.search', "Search across files"),
            command: 'workbench.view.search'
        },
        {
            id: 'git',
            arrow: '&larr;',
            label: nls_1.localize('welcomeOverlay.git', "Source code management"),
            command: 'workbench.view.scm'
        },
        {
            id: 'debug',
            arrow: '&larr;',
            label: nls_1.localize('welcomeOverlay.debug', "Launch and debug"),
            command: 'workbench.view.debug'
        },
        {
            id: 'extensions',
            arrow: '&larr;',
            label: nls_1.localize('welcomeOverlay.extensions', "Manage extensions"),
            command: 'workbench.view.extensions'
        },
        // {
        // 	id: 'watermark',
        // 	arrow: '&larrpl;',
        // 	label: localize('welcomeOverlay.watermark', "Command Hints"),
        // 	withEditor: false
        // },
        {
            id: 'problems',
            arrow: '&larrpl;',
            label: nls_1.localize('welcomeOverlay.problems', "View errors and warnings"),
            command: 'workbench.actions.view.problems'
        },
        {
            id: 'terminal',
            label: nls_1.localize('welcomeOverlay.terminal', "Toggle integrated terminal"),
            command: 'workbench.action.terminal.toggleTerminal'
        },
        // {
        // 	id: 'openfile',
        // 	arrow: '&cudarrl;',
        // 	label: localize('welcomeOverlay.openfile', "File Properties"),
        // 	arrowLast: true,
        // 	withEditor: true
        // },
        {
            id: 'commandPalette',
            arrow: '&nwarr;',
            label: nls_1.localize('welcomeOverlay.commandPalette', "Find and run all commands"),
            command: commandsQuickAccess_1.ShowAllCommandsAction.ID
        },
        {
            id: 'notifications',
            arrow: '&cudarrr;',
            arrowLast: true,
            label: nls_1.localize('welcomeOverlay.notifications', "Show notifications"),
            command: 'notifications.showList'
        }
    ];
    const OVERLAY_VISIBLE = new contextkey_1.RawContextKey('interfaceOverviewVisible', false);
    let welcomeOverlay;
    let WelcomeOverlayAction = class WelcomeOverlayAction extends actions_1.Action {
        constructor(id, label, instantiationService) {
            super(id, label);
            this.instantiationService = instantiationService;
        }
        run() {
            if (!welcomeOverlay) {
                welcomeOverlay = this.instantiationService.createInstance(WelcomeOverlay);
            }
            welcomeOverlay.show();
            return Promise.resolve();
        }
    };
    WelcomeOverlayAction.ID = 'workbench.action.showInterfaceOverview';
    WelcomeOverlayAction.LABEL = nls_1.localize('welcomeOverlay', "User Interface Overview");
    WelcomeOverlayAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], WelcomeOverlayAction);
    exports.WelcomeOverlayAction = WelcomeOverlayAction;
    class HideWelcomeOverlayAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            if (welcomeOverlay) {
                welcomeOverlay.hide();
            }
            return Promise.resolve();
        }
    }
    exports.HideWelcomeOverlayAction = HideWelcomeOverlayAction;
    HideWelcomeOverlayAction.ID = 'workbench.action.hideInterfaceOverview';
    HideWelcomeOverlayAction.LABEL = nls_1.localize('hideWelcomeOverlay', "Hide Interface Overview");
    let WelcomeOverlay = class WelcomeOverlay extends lifecycle_1.Disposable {
        constructor(layoutService, editorService, commandService, _contextKeyService, keybindingService) {
            super();
            this.layoutService = layoutService;
            this.editorService = editorService;
            this.commandService = commandService;
            this._contextKeyService = _contextKeyService;
            this.keybindingService = keybindingService;
            this._overlayVisible = OVERLAY_VISIBLE.bindTo(this._contextKeyService);
            this.create();
        }
        create() {
            var _a, _b;
            const offset = (_b = (_a = this.layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0;
            this._overlay = dom.append(this.layoutService.container, $('.welcomeOverlay'));
            this._overlay.style.top = `${offset}px`;
            this._overlay.style.height = `calc(100% - ${offset}px)`;
            this._overlay.style.display = 'none';
            this._overlay.tabIndex = -1;
            this._register(dom.addStandardDisposableListener(this._overlay, 'click', () => this.hide()));
            this.commandService.onWillExecuteCommand(() => this.hide());
            dom.append(this._overlay, $('.commandPalettePlaceholder'));
            const editorOpen = !!this.editorService.visibleEditors.length;
            keys.filter(key => !('withEditor' in key) || key.withEditor === editorOpen)
                .forEach(({ id, arrow, label, command, arrowLast }) => {
                const div = dom.append(this._overlay, $(`.key.${id}`));
                if (arrow && !arrowLast) {
                    dom.append(div, $('span.arrow')).innerHTML = arrow;
                }
                dom.append(div, $('span.label')).textContent = label;
                if (command) {
                    const shortcut = this.keybindingService.lookupKeybinding(command);
                    if (shortcut) {
                        dom.append(div, $('span.shortcut')).textContent = shortcut.getLabel();
                    }
                }
                if (arrow && arrowLast) {
                    dom.append(div, $('span.arrow')).innerHTML = arrow;
                }
            });
        }
        show() {
            if (this._overlay.style.display !== 'block') {
                this._overlay.style.display = 'block';
                const workbench = document.querySelector('.monaco-workbench');
                dom.addClass(workbench, 'blur-background');
                this._overlayVisible.set(true);
                this.updateProblemsKey();
                this.updateActivityBarKeys();
                this._overlay.focus();
            }
        }
        updateProblemsKey() {
            const problems = document.querySelector(`footer[id="workbench.parts.statusbar"] .statusbar-item.left ${codicons_1.Codicon.warning.cssSelector}`);
            const key = this._overlay.querySelector('.key.problems');
            if (problems instanceof HTMLElement) {
                const target = problems.getBoundingClientRect();
                const bounds = this._overlay.getBoundingClientRect();
                const bottom = bounds.bottom - target.top + 3;
                const left = (target.left + target.right) / 2 - bounds.left;
                key.style.bottom = bottom + 'px';
                key.style.left = left + 'px';
            }
            else {
                key.style.bottom = '';
                key.style.left = '';
            }
        }
        updateActivityBarKeys() {
            const ids = ['explorer', 'search', 'git', 'debug', 'extensions'];
            const activityBar = document.querySelector('.activitybar .composite-bar');
            if (activityBar instanceof HTMLElement) {
                const target = activityBar.getBoundingClientRect();
                const bounds = this._overlay.getBoundingClientRect();
                for (let i = 0; i < ids.length; i++) {
                    const key = this._overlay.querySelector(`.key.${ids[i]}`);
                    const top = target.top - bounds.top + 50 * i + 13;
                    key.style.top = top + 'px';
                }
            }
            else {
                for (let i = 0; i < ids.length; i++) {
                    const key = this._overlay.querySelector(`.key.${ids[i]}`);
                    key.style.top = '';
                }
            }
        }
        hide() {
            if (this._overlay.style.display !== 'none') {
                this._overlay.style.display = 'none';
                const workbench = document.querySelector('.monaco-workbench');
                dom.removeClass(workbench, 'blur-background');
                this._overlayVisible.reset();
            }
        }
    };
    WelcomeOverlay = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, editorService_1.IEditorService),
        __param(2, commands_1.ICommandService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService)
    ], WelcomeOverlay);
    platform_1.Registry.as(actions_2.Extensions.WorkbenchActions)
        .registerWorkbenchAction(actions_3.SyncActionDescriptor.from(WelcomeOverlayAction), 'Help: User Interface Overview', nls_1.localize('help', "Help"));
    platform_1.Registry.as(actions_2.Extensions.WorkbenchActions)
        .registerWorkbenchAction(actions_3.SyncActionDescriptor.from(HideWelcomeOverlayAction, { primary: 9 /* Escape */ }, OVERLAY_VISIBLE), 'Help: Hide Interface Overview', nls_1.localize('help', "Help"));
    // theming
    themeService_1.registerThemingParticipant((theme, collector) => {
        const key = theme.getColor(colorRegistry_1.foreground);
        if (key) {
            collector.addRule(`.monaco-workbench > .welcomeOverlay > .key { color: ${key}; }`);
        }
        const backgroundColor = color_1.Color.fromHex(theme.type === 'light' ? '#FFFFFF85' : '#00000085');
        if (backgroundColor) {
            collector.addRule(`.monaco-workbench > .welcomeOverlay { background: ${backgroundColor}; }`);
        }
        const shortcut = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (shortcut) {
            collector.addRule(`.monaco-workbench > .welcomeOverlay > .key > .shortcut { color: ${shortcut}; }`);
        }
    });
});
//# __sourceMappingURL=welcomeOverlay.js.map