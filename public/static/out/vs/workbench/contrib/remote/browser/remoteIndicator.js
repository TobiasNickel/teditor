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
define(["require", "exports", "vs/nls", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/environment/common/environmentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/host/browser/host", "vs/workbench/browser/contextkeys", "vs/base/common/platform", "vs/base/common/functional"], function (require, exports, nls, theme_1, themeService_1, remoteAgentService_1, lifecycle_1, actions_1, statusbar_1, label_1, contextkey_1, commands_1, remoteHosts_1, extensions_1, quickInput_1, environmentService_1, remoteAuthorityResolver_1, host_1, contextkeys_1, platform_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteWindowActiveIndicator = void 0;
    const WINDOW_ACTIONS_COMMAND_ID = 'workbench.action.remote.showMenu';
    const CLOSE_REMOTE_COMMAND_ID = 'workbench.action.remote.close';
    const SHOW_CLOSE_REMOTE_COMMAND_ID = !platform_1.isWeb; // web does not have a "Close Remote" command
    let RemoteWindowActiveIndicator = class RemoteWindowActiveIndicator extends lifecycle_1.Disposable {
        constructor(statusbarService, environmentService, labelService, contextKeyService, menuService, quickInputService, commandService, extensionService, remoteAgentService, remoteAuthorityResolverService, hostService) {
            super();
            this.statusbarService = statusbarService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.hasWindowActions = false;
            this.connectionState = undefined;
            this.windowCommandMenu = this.menuService.createMenu(actions_1.MenuId.StatusBarWindowIndicatorMenu, this.contextKeyService);
            this._register(this.windowCommandMenu);
            const category = nls.localize('remote.category', "Remote");
            const that = this;
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: WINDOW_ACTIONS_COMMAND_ID,
                        category,
                        title: { value: nls.localize('remote.showMenu', "Show Remote Menu"), original: 'Show Remote Menu' },
                        f1: true,
                    });
                    this.run = () => that.showIndicatorActions(that.windowCommandMenu);
                }
            });
            this.remoteAuthority = environmentService.configuration.remoteAuthority;
            contextkeys_1.Deprecated_RemoteAuthorityContext.bindTo(this.contextKeyService).set(this.remoteAuthority || '');
            if (this.remoteAuthority) {
                if (SHOW_CLOSE_REMOTE_COMMAND_ID) {
                    actions_1.registerAction2(class extends actions_1.Action2 {
                        constructor() {
                            super({
                                id: CLOSE_REMOTE_COMMAND_ID,
                                category,
                                title: { value: nls.localize('remote.close', "Close Remote Connection"), original: 'Close Remote Connection' },
                                f1: true
                            });
                            this.run = () => that.remoteAuthority && hostService.openWindow({ forceReuseWindow: true });
                        }
                    });
                    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
                        group: '6_close',
                        command: {
                            id: CLOSE_REMOTE_COMMAND_ID,
                            title: nls.localize({ key: 'miCloseRemote', comment: ['&& denotes a mnemonic'] }, "Close Re&&mote Connection")
                        },
                        order: 3.5
                    });
                }
                // Pending entry until extensions are ready
                this.renderWindowIndicator('$(sync~spin) ' + nls.localize('host.open', "Opening Remote..."), undefined, WINDOW_ACTIONS_COMMAND_ID);
                this.connectionState = 'initializing';
                contextkeys_1.RemoteConnectionState.bindTo(this.contextKeyService).set(this.connectionState);
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    this._register(connection.onDidStateChange((e) => {
                        switch (e.type) {
                            case 0 /* ConnectionLost */:
                            case 3 /* ReconnectionPermanentFailure */:
                            case 2 /* ReconnectionRunning */:
                            case 1 /* ReconnectionWait */:
                                this.setDisconnected(true);
                                break;
                            case 4 /* ConnectionGain */:
                                this.setDisconnected(false);
                                break;
                        }
                    }));
                }
            }
            extensionService.whenInstalledExtensionsRegistered().then(_ => {
                if (this.remoteAuthority) {
                    this._register(this.labelService.onDidChangeFormatters(e => this.updateWindowIndicator()));
                    remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority).then(() => this.setDisconnected(false), () => this.setDisconnected(true));
                }
                this._register(this.windowCommandMenu.onDidChange(e => this.updateWindowActions()));
                this.updateWindowIndicator();
            });
        }
        setDisconnected(isDisconnected) {
            const newState = isDisconnected ? 'disconnected' : 'connected';
            if (this.connectionState !== newState) {
                this.connectionState = newState;
                contextkeys_1.RemoteConnectionState.bindTo(this.contextKeyService).set(this.connectionState);
                contextkeys_1.Deprecated_RemoteAuthorityContext.bindTo(this.contextKeyService).set(isDisconnected ? `disconnected/${this.remoteAuthority}` : this.remoteAuthority);
                this.updateWindowIndicator();
            }
        }
        updateWindowIndicator() {
            const windowActionCommand = (this.remoteAuthority || this.windowCommandMenu.getActions().length) ? WINDOW_ACTIONS_COMMAND_ID : undefined;
            if (this.remoteAuthority) {
                const hostLabel = this.labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, this.remoteAuthority) || this.remoteAuthority;
                if (this.connectionState !== 'disconnected') {
                    this.renderWindowIndicator(`$(remote) ${hostLabel}`, nls.localize('host.tooltip', "Editing on {0}", hostLabel), windowActionCommand);
                }
                else {
                    this.renderWindowIndicator(`$(alert) ${nls.localize('disconnectedFrom', "Disconnected from")} ${hostLabel}`, nls.localize('host.tooltipDisconnected', "Disconnected from {0}", hostLabel), windowActionCommand);
                }
            }
            else {
                if (windowActionCommand) {
                    this.renderWindowIndicator(`$(remote)`, nls.localize('noHost.tooltip', "Open a remote window"), windowActionCommand);
                }
                else if (this.windowIndicatorEntry) {
                    this.windowIndicatorEntry.dispose();
                    this.windowIndicatorEntry = undefined;
                }
            }
        }
        updateWindowActions() {
            const newHasWindowActions = this.windowCommandMenu.getActions().length > 0;
            if (newHasWindowActions !== this.hasWindowActions) {
                this.hasWindowActions = newHasWindowActions;
                this.updateWindowIndicator();
            }
        }
        renderWindowIndicator(text, tooltip, command) {
            const properties = {
                backgroundColor: themeService_1.themeColorFromId(theme_1.STATUS_BAR_HOST_NAME_BACKGROUND),
                color: themeService_1.themeColorFromId(theme_1.STATUS_BAR_HOST_NAME_FOREGROUND),
                ariaLabel: nls.localize('remote', "Remote"),
                text,
                tooltip,
                command
            };
            if (this.windowIndicatorEntry) {
                this.windowIndicatorEntry.update(properties);
            }
            else {
                this.windowIndicatorEntry = this.statusbarService.addEntry(properties, 'status.host', nls.localize('status.host', "Remote Host"), 0 /* LEFT */, Number.MAX_VALUE /* first entry */);
            }
        }
        showIndicatorActions(menu) {
            const actions = menu.getActions();
            const items = [];
            for (let actionGroup of actions) {
                if (items.length) {
                    items.push({ type: 'separator' });
                }
                for (let action of actionGroup[1]) {
                    if (action instanceof actions_1.MenuItemAction) {
                        let label = typeof action.item.title === 'string' ? action.item.title : action.item.title.value;
                        if (action.item.category) {
                            const category = typeof action.item.category === 'string' ? action.item.category : action.item.category.value;
                            label = nls.localize('cat.title', "{0}: {1}", category, label);
                        }
                        items.push({
                            type: 'item',
                            id: action.item.id,
                            label
                        });
                    }
                }
            }
            if (SHOW_CLOSE_REMOTE_COMMAND_ID && this.remoteAuthority) {
                if (items.length) {
                    items.push({ type: 'separator' });
                }
                items.push({
                    type: 'item',
                    id: CLOSE_REMOTE_COMMAND_ID,
                    label: nls.localize('closeRemote.title', 'Close Remote Connection')
                });
            }
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.items = items;
            quickPick.canSelectMany = false;
            functional_1.once(quickPick.onDidAccept)((_ => {
                const selectedItems = quickPick.selectedItems;
                if (selectedItems.length === 1) {
                    this.commandService.executeCommand(selectedItems[0].id);
                }
                quickPick.hide();
            }));
            quickPick.show();
        }
    };
    RemoteWindowActiveIndicator = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, label_1.ILabelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, commands_1.ICommandService),
        __param(7, extensions_1.IExtensionService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, host_1.IHostService)
    ], RemoteWindowActiveIndicator);
    exports.RemoteWindowActiveIndicator = RemoteWindowActiveIndicator;
});
//# __sourceMappingURL=remoteIndicator.js.map