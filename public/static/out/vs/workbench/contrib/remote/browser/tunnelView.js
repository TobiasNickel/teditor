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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/workbench/common/views", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/clipboard/common/clipboardService", "vs/platform/notification/common/notification", "vs/base/browser/ui/inputbox/inputBox", "vs/platform/theme/common/styler", "vs/base/common/functional", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/uri", "vs/platform/instantiation/common/descriptors", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/telemetry/common/telemetry", "vs/css!./media/tunnelView"], function (require, exports, nls, dom, views_1, listService_1, keybinding_1, contextView_1, contextkey_1, configuration_1, instantiation_1, opener_1, quickInput_1, commands_1, event_1, lifecycle_1, actionbar_1, iconLabel_1, actions_1, actions_2, menuEntryActionViewItem_1, remoteExplorerService_1, clipboardService_1, notification_1, inputBox_1, styler_1, functional_1, themeService_1, viewPaneContainer_1, uri_1, descriptors_1, keybindingsRegistry_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelPanelDescriptor = exports.TunnelPanel = exports.TunnelCloseableContextKey = exports.TunnelTypeContextKey = exports.TunnelViewModel = exports.forwardedPortsViewEnabled = void 0;
    exports.forwardedPortsViewEnabled = new contextkey_1.RawContextKey('forwardedPortsViewEnabled', false);
    class TunnelTreeVirtualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'tunnelItemTemplate';
        }
    }
    let TunnelViewModel = class TunnelViewModel extends lifecycle_1.Disposable {
        constructor(remoteExplorerService) {
            super();
            this.remoteExplorerService = remoteExplorerService;
            this._onForwardedPortsChanged = new event_1.Emitter();
            this.onForwardedPortsChanged = this._onForwardedPortsChanged.event;
            this._candidates = new Map();
            this.model = remoteExplorerService.tunnelModel;
            this._register(this.model.onForwardPort(() => this._onForwardedPortsChanged.fire()));
            this._register(this.model.onClosePort(() => this._onForwardedPortsChanged.fire()));
            this._register(this.model.onPortName(() => this._onForwardedPortsChanged.fire()));
            this._register(this.model.onCandidatesChanged(() => this._onForwardedPortsChanged.fire()));
            this._input = {
                label: nls.localize('remote.tunnelsView.add', "Forward a Port..."),
                tunnelType: remoteExplorerService_1.TunnelType.Add,
                remoteHost: 'localhost',
                remotePort: 0,
                description: ''
            };
        }
        async groups() {
            const groups = [];
            this._candidates = new Map();
            (await this.model.candidates).forEach(candidate => {
                this._candidates.set(remoteExplorerService_1.MakeAddress(candidate.host, candidate.port), candidate);
            });
            if ((this.model.forwarded.size > 0) || this.remoteExplorerService.getEditableData(undefined)) {
                groups.push({
                    label: nls.localize('remote.tunnelsView.forwarded', "Forwarded"),
                    tunnelType: remoteExplorerService_1.TunnelType.Forwarded,
                    items: this.forwarded
                });
            }
            if (this.model.detected.size > 0) {
                groups.push({
                    label: nls.localize('remote.tunnelsView.detected', "Existing Tunnels"),
                    tunnelType: remoteExplorerService_1.TunnelType.Detected,
                    items: this.detected
                });
            }
            const candidates = await this.candidates;
            if (candidates.length > 0) {
                groups.push({
                    label: nls.localize('remote.tunnelsView.candidates', "Not Forwarded"),
                    tunnelType: remoteExplorerService_1.TunnelType.Candidate,
                    items: candidates
                });
            }
            if (groups.length === 0) {
                groups.push(this._input);
            }
            return groups;
        }
        addProcessInfoFromCandidate(tunnelItem) {
            const key = remoteExplorerService_1.MakeAddress(tunnelItem.remoteHost, tunnelItem.remotePort);
            if (this._candidates.has(key)) {
                tunnelItem.description = this._candidates.get(key).detail;
            }
        }
        get forwarded() {
            const forwarded = Array.from(this.model.forwarded.values()).map(tunnel => {
                const tunnelItem = TunnelItem.createFromTunnel(tunnel);
                this.addProcessInfoFromCandidate(tunnelItem);
                return tunnelItem;
            }).sort((a, b) => {
                if (a.remotePort === b.remotePort) {
                    return a.remoteHost < b.remoteHost ? -1 : 1;
                }
                else {
                    return a.remotePort < b.remotePort ? -1 : 1;
                }
            });
            if (this.remoteExplorerService.getEditableData(undefined)) {
                forwarded.push(this._input);
            }
            return forwarded;
        }
        get detected() {
            return Array.from(this.model.detected.values()).map(tunnel => {
                const tunnelItem = TunnelItem.createFromTunnel(tunnel, remoteExplorerService_1.TunnelType.Detected, false);
                this.addProcessInfoFromCandidate(tunnelItem);
                return tunnelItem;
            });
        }
        get candidates() {
            const candidates = [];
            this._candidates.forEach(value => {
                const key = remoteExplorerService_1.MakeAddress(value.host, value.port);
                if (!this.model.forwarded.has(key) && !this.model.detected.has(key)) {
                    candidates.push(new TunnelItem(remoteExplorerService_1.TunnelType.Candidate, value.host, value.port, undefined, undefined, false, undefined, value.detail));
                }
            });
            return candidates;
        }
        get input() {
            return this._input;
        }
        dispose() {
            super.dispose();
        }
    };
    TunnelViewModel = __decorate([
        __param(0, remoteExplorerService_1.IRemoteExplorerService)
    ], TunnelViewModel);
    exports.TunnelViewModel = TunnelViewModel;
    let TunnelTreeRenderer = class TunnelTreeRenderer extends lifecycle_1.Disposable {
        constructor(viewId, menuService, contextKeyService, instantiationService, contextViewService, themeService, remoteExplorerService) {
            super();
            this.viewId = viewId;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.remoteExplorerService = remoteExplorerService;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        get templateId() {
            return TunnelTreeRenderer.TREE_TEMPLATE_ID;
        }
        renderTemplate(container) {
            dom.addClass(container, 'custom-view-tree-node-item');
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            // dom.addClass(iconLabel.element, 'tunnel-view-label');
            const actionsContainer = dom.append(iconLabel.element, dom.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                // actionViewItemProvider: undefined // this.actionViewItemProvider
                actionViewItemProvider: (action) => {
                    if (action instanceof actions_2.MenuItemAction) {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem, action);
                    }
                    return undefined;
                }
            });
            return { iconLabel, actionBar, container, elementDisposable: lifecycle_1.Disposable.None };
        }
        isTunnelItem(item) {
            return !!(item.remotePort);
        }
        renderElement(element, index, templateData) {
            templateData.elementDisposable.dispose();
            const node = element.element;
            // reset
            templateData.actionBar.clear();
            let editableData;
            if (this.isTunnelItem(node)) {
                editableData = this.remoteExplorerService.getEditableData(node);
                if (editableData) {
                    templateData.iconLabel.element.style.display = 'none';
                    this.renderInputBox(templateData.container, editableData);
                }
                else {
                    templateData.iconLabel.element.style.display = 'flex';
                    this.renderTunnel(node, templateData);
                }
            }
            else if ((node.tunnelType === remoteExplorerService_1.TunnelType.Add) && (editableData = this.remoteExplorerService.getEditableData(undefined))) {
                templateData.iconLabel.element.style.display = 'none';
                this.renderInputBox(templateData.container, editableData);
            }
            else {
                templateData.iconLabel.element.style.display = 'flex';
                templateData.iconLabel.setLabel(node.label);
            }
        }
        renderTunnel(node, templateData) {
            const label = node.label + (node.description ? (' - ' + node.description) : '');
            templateData.iconLabel.setLabel(node.label, node.description, { title: label, extraClasses: ['tunnel-view-label'] });
            templateData.actionBar.context = node;
            const contextKeyService = this._register(this.contextKeyService.createScoped());
            contextKeyService.createKey('view', this.viewId);
            contextKeyService.createKey('tunnelType', node.tunnelType);
            contextKeyService.createKey('tunnelCloseable', node.closeable);
            const disposableStore = new lifecycle_1.DisposableStore();
            templateData.elementDisposable = disposableStore;
            const menu = disposableStore.add(this.menuService.createMenu(actions_2.MenuId.TunnelInline, contextKeyService));
            const actions = [];
            disposableStore.add(menuEntryActionViewItem_1.createAndFillInActionBarActions(menu, { shouldForwardArgs: true }, actions));
            if (actions) {
                templateData.actionBar.push(actions, { icon: true, label: false });
                if (this._actionRunner) {
                    templateData.actionBar.actionRunner = this._actionRunner;
                }
            }
        }
        renderInputBox(container, editableData) {
            const value = editableData.startingValue || '';
            const inputBox = new inputBox_1.InputBox(container, this.contextViewService, {
                ariaLabel: nls.localize('remote.tunnelsView.input', "Press Enter to confirm or Escape to cancel."),
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message || message.severity !== notification_1.Severity.Error) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: 3 /* ERROR */
                        };
                    }
                },
                placeholder: editableData.placeholder || ''
            });
            const styler = styler_1.attachInputBoxStyler(inputBox, this.themeService);
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: editableData.startingValue ? editableData.startingValue.length : 0 });
            const done = functional_1.once((success, finishEditing) => {
                inputBox.element.style.display = 'none';
                const value = inputBox.value;
                lifecycle_1.dispose(toDispose);
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const toDispose = [
                inputBox,
                dom.addStandardDisposableListener(inputBox.inputElement, dom.EventType.KEY_DOWN, (e) => {
                    if (e.equals(3 /* Enter */)) {
                        if (inputBox.validate()) {
                            done(true, true);
                        }
                    }
                    else if (e.equals(9 /* Escape */)) {
                        done(false, true);
                    }
                }),
                dom.addDisposableListener(inputBox.inputElement, dom.EventType.BLUR, () => {
                    done(inputBox.isInputValid(), true);
                }),
                styler
            ];
            return lifecycle_1.toDisposable(() => {
                done(false, false);
            });
        }
        disposeElement(resource, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
            templateData.elementDisposable.dispose();
        }
    };
    TunnelTreeRenderer.ITEM_HEIGHT = 22;
    TunnelTreeRenderer.TREE_TEMPLATE_ID = 'tunnelItemTemplate';
    TunnelTreeRenderer = __decorate([
        __param(1, actions_2.IMenuService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, themeService_1.IThemeService),
        __param(6, remoteExplorerService_1.IRemoteExplorerService)
    ], TunnelTreeRenderer);
    class TunnelDataSource {
        hasChildren(element) {
            if (element instanceof TunnelViewModel) {
                return true;
            }
            else if (element instanceof TunnelItem) {
                return false;
            }
            else if (element.items) {
                return true;
            }
            return false;
        }
        getChildren(element) {
            if (element instanceof TunnelViewModel) {
                return element.groups();
            }
            else if (element instanceof TunnelItem) {
                return [];
            }
            else if (element.items) {
                return element.items;
            }
            return [];
        }
    }
    class TunnelItem {
        constructor(tunnelType, remoteHost, remotePort, localAddress, localPort, closeable, name, _description) {
            this.tunnelType = tunnelType;
            this.remoteHost = remoteHost;
            this.remotePort = remotePort;
            this.localAddress = localAddress;
            this.localPort = localPort;
            this.closeable = closeable;
            this.name = name;
            this._description = _description;
        }
        static createFromTunnel(tunnel, type = remoteExplorerService_1.TunnelType.Forwarded, closeable) {
            return new TunnelItem(type, tunnel.remoteHost, tunnel.remotePort, tunnel.localAddress, tunnel.localPort, closeable === undefined ? tunnel.closeable : closeable, tunnel.name, tunnel.description);
        }
        get label() {
            if (this.name) {
                return nls.localize('remote.tunnelsView.forwardedPortLabel0', "{0}", this.name);
            }
            else if (this.localAddress && (this.remoteHost !== 'localhost')) {
                return nls.localize('remote.tunnelsView.forwardedPortLabel2', "{0}:{1} \u2192 {2}", this.remoteHost, this.remotePort, this.localAddress);
            }
            else if (this.localAddress) {
                return nls.localize('remote.tunnelsView.forwardedPortLabel3', "{0} \u2192 {1}", this.remotePort, this.localAddress);
            }
            else if (this.remoteHost !== 'localhost') {
                return nls.localize('remote.tunnelsView.forwardedPortLabel4', "{0}:{1}", this.remoteHost, this.remotePort);
            }
            else {
                return nls.localize('remote.tunnelsView.forwardedPortLabel5', "{0}", this.remotePort);
            }
        }
        set description(description) {
            this._description = description;
        }
        get description() {
            if (this._description) {
                return this._description;
            }
            else if (this.name) {
                return nls.localize('remote.tunnelsView.forwardedPortDescription0', "{0} to {1}", this.remotePort, this.localAddress);
            }
            return undefined;
        }
    }
    exports.TunnelTypeContextKey = new contextkey_1.RawContextKey('tunnelType', remoteExplorerService_1.TunnelType.Add);
    exports.TunnelCloseableContextKey = new contextkey_1.RawContextKey('tunnelCloseable', false);
    const TunnelViewFocusContextKey = new contextkey_1.RawContextKey('tunnelViewFocus', false);
    const TunnelViewSelectionKeyName = 'tunnelViewSelection';
    const TunnelViewSelectionContextKey = new contextkey_1.RawContextKey(TunnelViewSelectionKeyName, undefined);
    const PortChangableContextKey = new contextkey_1.RawContextKey('portChangable', false);
    class TunnelDataTree extends listService_1.WorkbenchAsyncDataTree {
    }
    let TunnelPanel = class TunnelPanel extends viewPaneContainer_1.ViewPane {
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, menuService, notificationService, contextViewService, themeService, remoteExplorerService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.menuService = menuService;
            this.notificationService = notificationService;
            this.contextViewService = contextViewService;
            this.remoteExplorerService = remoteExplorerService;
            this.titleActions = [];
            this.titleActionsDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.tunnelTypeContext = exports.TunnelTypeContextKey.bindTo(contextKeyService);
            this.tunnelCloseableContext = exports.TunnelCloseableContextKey.bindTo(contextKeyService);
            this.tunnelViewFocusContext = TunnelViewFocusContextKey.bindTo(contextKeyService);
            this.tunnelViewSelectionContext = TunnelViewSelectionContextKey.bindTo(contextKeyService);
            this.portChangableContextKey = PortChangableContextKey.bindTo(contextKeyService);
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped());
            scopedContextKeyService.createKey('view', TunnelPanel.ID);
            const titleMenu = this._register(this.menuService.createMenu(actions_2.MenuId.TunnelTitle, scopedContextKeyService));
            const updateActions = () => {
                this.titleActions = [];
                this.titleActionsDisposable.value = menuEntryActionViewItem_1.createAndFillInActionBarActions(titleMenu, undefined, this.titleActions);
                this.updateActions();
            };
            this._register(titleMenu.onDidChange(updateActions));
            updateActions();
            this._register(lifecycle_1.toDisposable(() => {
                this.titleActions = [];
            }));
        }
        renderBody(container) {
            super.renderBody(container);
            const panelContainer = dom.append(container, dom.$('.tree-explorer-viewlet-tree-view'));
            const treeContainer = dom.append(panelContainer, dom.$('.customview-tree'));
            dom.addClass(treeContainer, 'file-icon-themable-tree');
            dom.addClass(treeContainer, 'show-file-icons');
            const renderer = new TunnelTreeRenderer(TunnelPanel.ID, this.menuService, this.contextKeyService, this.instantiationService, this.contextViewService, this.themeService, this.remoteExplorerService);
            this.tree = this.instantiationService.createInstance(TunnelDataTree, 'RemoteTunnels', treeContainer, new TunnelTreeVirtualDelegate(), [renderer], new TunnelDataSource(), {
                collapseByDefault: (e) => {
                    return false;
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return item.label;
                    }
                },
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        if (item instanceof TunnelItem) {
                            if (item.localAddress) {
                                return nls.localize('remote.tunnel.ariaLabelForwarded', "Remote port {0}:{1} forwarded to local address {2}", item.remoteHost, item.remotePort, item.localAddress);
                            }
                            else {
                                return nls.localize('remote.tunnel.ariaLabelCandidate', "Remote port {0}:{1} not forwarded", item.remoteHost, item.remotePort);
                            }
                        }
                        else {
                            return item.label;
                        }
                    },
                    getWidgetAriaLabel: () => nls.localize('tunnelView', "Tunnel View")
                }
            });
            const actionRunner = new actions_1.ActionRunner();
            renderer.actionRunner = actionRunner;
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e, actionRunner)));
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.tree.onDidChangeFocus(e => this.onFocusChanged(e.elements)));
            this._register(this.tree.onDidFocus(() => this.tunnelViewFocusContext.set(true)));
            this._register(this.tree.onDidBlur(() => this.tunnelViewFocusContext.set(false)));
            this.tree.setInput(this.viewModel);
            this._register(this.viewModel.onForwardedPortsChanged(() => {
                this.tree.updateChildren(undefined, true);
            }));
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(e => {
                if (e.element && (e.element.tunnelType === remoteExplorerService_1.TunnelType.Add)) {
                    this.commandService.executeCommand(ForwardPortAction.INLINE_ID);
                }
            }));
            this._register(this.remoteExplorerService.onDidChangeEditable(async (e) => {
                const isEditing = !!this.remoteExplorerService.getEditableData(e);
                if (!isEditing) {
                    dom.removeClass(treeContainer, 'highlight');
                }
                await this.tree.updateChildren(undefined, false);
                if (isEditing) {
                    dom.addClass(treeContainer, 'highlight');
                    if (!e) {
                        // When we are in editing mode for a new forward, rather than updating an existing one we need to reveal the input box since it might be out of view.
                        this.tree.reveal(this.viewModel.input);
                    }
                }
                else {
                    this.tree.domFocus();
                }
            }));
        }
        get contributedContextMenu() {
            const contributedContextMenu = this._register(this.menuService.createMenu(actions_2.MenuId.TunnelContext, this.tree.contextKeyService));
            return contributedContextMenu;
        }
        getActions() {
            return this.titleActions;
        }
        focus() {
            super.focus();
            this.tree.domFocus();
        }
        onFocusChanged(elements) {
            const item = elements && elements.length ? elements[0] : undefined;
            if (item) {
                this.tunnelViewSelectionContext.set(item);
                this.tunnelTypeContext.set(item.tunnelType);
                this.tunnelCloseableContext.set(!!item.closeable);
                this.portChangableContextKey.set(!!item.localPort);
            }
            else {
                this.tunnelTypeContext.reset();
                this.tunnelViewSelectionContext.reset();
                this.tunnelCloseableContext.reset();
                this.portChangableContextKey.reset();
            }
        }
        onContextMenu(treeEvent, actionRunner) {
            if ((treeEvent.element !== null) && !(treeEvent.element instanceof TunnelItem)) {
                return;
            }
            const node = treeEvent.element;
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            if (node) {
                this.tree.setFocus([node]);
                this.tunnelTypeContext.set(node.tunnelType);
                this.tunnelCloseableContext.set(!!node.closeable);
                this.portChangableContextKey.set(!!node.localPort);
            }
            else {
                this.tunnelTypeContext.set(remoteExplorerService_1.TunnelType.Add);
                this.tunnelCloseableContext.set(false);
                this.portChangableContextKey.set(false);
            }
            const actions = [];
            this._register(menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contributedContextMenu, { shouldForwardArgs: true }, actions, this.contextMenuService));
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionbar_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => node,
                actionRunner
            });
        }
        onMouseDblClick(e) {
            if (!e.element) {
                this.commandService.executeCommand(ForwardPortAction.INLINE_ID);
            }
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        getActionViewItem(action) {
            return action instanceof actions_2.MenuItemAction ? new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService) : undefined;
        }
    };
    TunnelPanel.ID = '~remote.forwardedPorts';
    TunnelPanel.TITLE = nls.localize('remote.tunnel', "Forwarded Ports");
    TunnelPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, opener_1.IOpenerService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, commands_1.ICommandService),
        __param(11, actions_2.IMenuService),
        __param(12, notification_1.INotificationService),
        __param(13, contextView_1.IContextViewService),
        __param(14, themeService_1.IThemeService),
        __param(15, remoteExplorerService_1.IRemoteExplorerService),
        __param(16, telemetry_1.ITelemetryService)
    ], TunnelPanel);
    exports.TunnelPanel = TunnelPanel;
    class TunnelPanelDescriptor {
        constructor(viewModel, environmentService) {
            this.id = TunnelPanel.ID;
            this.name = TunnelPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.workspace = true;
            this.group = 'details@0';
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(TunnelPanel, [viewModel]);
            this.remoteAuthority = environmentService.configuration.remoteAuthority ? environmentService.configuration.remoteAuthority.split('+')[0] : undefined;
        }
    }
    exports.TunnelPanelDescriptor = TunnelPanelDescriptor;
    function validationMessage(validationString) {
        if (!validationString) {
            return null;
        }
        return {
            content: validationString,
            severity: notification_1.Severity.Error
        };
    }
    var LabelTunnelAction;
    (function (LabelTunnelAction) {
        LabelTunnelAction.ID = 'remote.tunnel.label';
        LabelTunnelAction.LABEL = nls.localize('remote.tunnel.label', "Set Label");
        function handler() {
            return async (accessor, arg) => {
                const context = (arg !== undefined || arg instanceof TunnelItem) ? arg : accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                if (context instanceof TunnelItem) {
                    const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                    remoteExplorerService.setEditable(context, {
                        onFinish: async (value, success) => {
                            if (success) {
                                remoteExplorerService.tunnelModel.name(context.remoteHost, context.remotePort, value);
                            }
                            remoteExplorerService.setEditable(context, null);
                        },
                        validationMessage: () => null,
                        placeholder: nls.localize('remote.tunnelsView.labelPlaceholder', "Port label"),
                        startingValue: context.name
                    });
                }
                return;
            };
        }
        LabelTunnelAction.handler = handler;
    })(LabelTunnelAction || (LabelTunnelAction = {}));
    const invalidPortString = nls.localize('remote.tunnelsView.portNumberValid', "Forwarded port is invalid.");
    const maxPortNumber = 65536;
    const invalidPortNumberString = nls.localize('remote.tunnelsView.portNumberToHigh', "Port number must be \u2265 0 and < {0}.", maxPortNumber);
    var ForwardPortAction;
    (function (ForwardPortAction) {
        ForwardPortAction.INLINE_ID = 'remote.tunnel.forwardInline';
        ForwardPortAction.COMMANDPALETTE_ID = 'remote.tunnel.forwardCommandPalette';
        ForwardPortAction.LABEL = { value: nls.localize('remote.tunnel.forward', "Forward a Port"), original: 'Forward a Port' };
        ForwardPortAction.TREEITEM_LABEL = nls.localize('remote.tunnel.forwardItem', "Forward Port");
        const forwardPrompt = nls.localize('remote.tunnel.forwardPrompt', "Port number or address (eg. 3000 or 10.10.10.10:2000).");
        function parseInput(value) {
            var _a;
            const matches = value.match(/^([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\:|localhost:)?([0-9]+)$/);
            if (!matches) {
                return undefined;
            }
            return { host: ((_a = matches[1]) === null || _a === void 0 ? void 0 : _a.substring(0, matches[1].length - 1)) || 'localhost', port: Number(matches[2]) };
        }
        function validateInput(value) {
            const parsed = parseInput(value);
            if (!parsed) {
                return invalidPortString;
            }
            else if (parsed.port >= maxPortNumber) {
                return invalidPortNumberString;
            }
            return null;
        }
        function error(notificationService, tunnel, host, port) {
            if (!tunnel) {
                notificationService.warn(nls.localize('remote.tunnel.forwardError', "Unable to forward {0}:{1}. The host may not be available or that remote port may already be forwarded", host, port));
            }
        }
        function inlineHandler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const notificationService = accessor.get(notification_1.INotificationService);
                if (arg instanceof TunnelItem) {
                    remoteExplorerService.forward({ host: arg.remoteHost, port: arg.remotePort }).then(tunnel => error(notificationService, tunnel, arg.remoteHost, arg.remotePort));
                }
                else {
                    remoteExplorerService.setEditable(undefined, {
                        onFinish: async (value, success) => {
                            let parsed;
                            if (success && (parsed = parseInput(value))) {
                                remoteExplorerService.forward({ host: parsed.host, port: parsed.port }).then(tunnel => error(notificationService, tunnel, parsed.host, parsed.port));
                            }
                            remoteExplorerService.setEditable(undefined, null);
                        },
                        validationMessage: (value) => validationMessage(validateInput(value)),
                        placeholder: forwardPrompt
                    });
                }
            };
        }
        ForwardPortAction.inlineHandler = inlineHandler;
        function commandPaletteHandler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const viewsService = accessor.get(views_1.IViewsService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                await viewsService.openView(TunnelPanel.ID, true);
                const value = await quickInputService.input({
                    prompt: forwardPrompt,
                    validateInput: (value) => Promise.resolve(validateInput(value))
                });
                let parsed;
                if (value && (parsed = parseInput(value))) {
                    remoteExplorerService.forward({ host: parsed.host, port: parsed.port }).then(tunnel => error(notificationService, tunnel, parsed.host, parsed.port));
                }
            };
        }
        ForwardPortAction.commandPaletteHandler = commandPaletteHandler;
    })(ForwardPortAction || (ForwardPortAction = {}));
    function makeTunnelPicks(tunnels) {
        const picks = tunnels.map(forwarded => {
            const item = TunnelItem.createFromTunnel(forwarded);
            return {
                label: item.label,
                description: item.description,
                tunnel: item
            };
        });
        if (picks.length === 0) {
            picks.push({
                label: nls.localize('remote.tunnel.closeNoPorts', "No ports currently forwarded. Try running the {0} command", ForwardPortAction.LABEL.value)
            });
        }
        return picks;
    }
    var ClosePortAction;
    (function (ClosePortAction) {
        ClosePortAction.INLINE_ID = 'remote.tunnel.closeInline';
        ClosePortAction.COMMANDPALETTE_ID = 'remote.tunnel.closeCommandPalette';
        ClosePortAction.LABEL = { value: nls.localize('remote.tunnel.close', "Stop Forwarding Port"), original: 'Stop Forwarding Port' };
        function inlineHandler() {
            return async (accessor, arg) => {
                const context = (arg !== undefined || arg instanceof TunnelItem) ? arg : accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                if (context instanceof TunnelItem) {
                    const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                    await remoteExplorerService.close({ host: context.remoteHost, port: context.remotePort });
                }
            };
        }
        ClosePortAction.inlineHandler = inlineHandler;
        function commandPaletteHandler() {
            return async (accessor) => {
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const commandService = accessor.get(commands_1.ICommandService);
                const picks = makeTunnelPicks(Array.from(remoteExplorerService.tunnelModel.forwarded.values()).filter(tunnel => tunnel.closeable));
                const result = await quickInputService.pick(picks, { placeHolder: nls.localize('remote.tunnel.closePlaceholder', "Choose a port to stop forwarding") });
                if (result && result.tunnel) {
                    await remoteExplorerService.close({ host: result.tunnel.remoteHost, port: result.tunnel.remotePort });
                }
                else if (result) {
                    await commandService.executeCommand(ForwardPortAction.COMMANDPALETTE_ID);
                }
            };
        }
        ClosePortAction.commandPaletteHandler = commandPaletteHandler;
    })(ClosePortAction || (ClosePortAction = {}));
    var OpenPortInBrowserAction;
    (function (OpenPortInBrowserAction) {
        OpenPortInBrowserAction.ID = 'remote.tunnel.open';
        OpenPortInBrowserAction.LABEL = nls.localize('remote.tunnel.open', "Open in Browser");
        function handler() {
            return async (accessor, arg) => {
                if (arg instanceof TunnelItem) {
                    const model = accessor.get(remoteExplorerService_1.IRemoteExplorerService).tunnelModel;
                    const openerService = accessor.get(opener_1.IOpenerService);
                    const key = remoteExplorerService_1.MakeAddress(arg.remoteHost, arg.remotePort);
                    const tunnel = model.forwarded.get(key) || model.detected.get(key);
                    let address;
                    if (tunnel && tunnel.localAddress && (address = model.address(tunnel.remoteHost, tunnel.remotePort))) {
                        return openerService.open(uri_1.URI.parse('http://' + address));
                    }
                    return Promise.resolve();
                }
            };
        }
        OpenPortInBrowserAction.handler = handler;
    })(OpenPortInBrowserAction || (OpenPortInBrowserAction = {}));
    var CopyAddressAction;
    (function (CopyAddressAction) {
        CopyAddressAction.INLINE_ID = 'remote.tunnel.copyAddressInline';
        CopyAddressAction.COMMANDPALETTE_ID = 'remote.tunnel.copyAddressCommandPalette';
        CopyAddressAction.INLINE_LABEL = nls.localize('remote.tunnel.copyAddressInline', "Copy Address");
        CopyAddressAction.COMMANDPALETTE_LABEL = nls.localize('remote.tunnel.copyAddressCommandPalette', "Copy Forwarded Port Address");
        async function copyAddress(remoteExplorerService, clipboardService, tunnelItem) {
            const address = remoteExplorerService.tunnelModel.address(tunnelItem.remoteHost, tunnelItem.remotePort);
            if (address) {
                await clipboardService.writeText(address.toString());
            }
        }
        function inlineHandler() {
            return async (accessor, arg) => {
                const context = (arg !== undefined || arg instanceof TunnelItem) ? arg : accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                if (context instanceof TunnelItem) {
                    return copyAddress(accessor.get(remoteExplorerService_1.IRemoteExplorerService), accessor.get(clipboardService_1.IClipboardService), context);
                }
            };
        }
        CopyAddressAction.inlineHandler = inlineHandler;
        function commandPaletteHandler() {
            return async (accessor, arg) => {
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const commandService = accessor.get(commands_1.ICommandService);
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const tunnels = Array.from(remoteExplorerService.tunnelModel.forwarded.values()).concat(Array.from(remoteExplorerService.tunnelModel.detected.values()));
                const result = await quickInputService.pick(makeTunnelPicks(tunnels), { placeHolder: nls.localize('remote.tunnel.copyAddressPlaceholdter', "Choose a forwarded port") });
                if (result && result.tunnel) {
                    await copyAddress(remoteExplorerService, clipboardService, result.tunnel);
                }
                else if (result) {
                    await commandService.executeCommand(ForwardPortAction.COMMANDPALETTE_ID);
                }
            };
        }
        CopyAddressAction.commandPaletteHandler = commandPaletteHandler;
    })(CopyAddressAction || (CopyAddressAction = {}));
    var RefreshTunnelViewAction;
    (function (RefreshTunnelViewAction) {
        RefreshTunnelViewAction.ID = 'remote.tunnel.refresh';
        RefreshTunnelViewAction.LABEL = nls.localize('remote.tunnel.refreshView', "Refresh");
        function handler() {
            return (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                return remoteExplorerService.refresh();
            };
        }
        RefreshTunnelViewAction.handler = handler;
    })(RefreshTunnelViewAction || (RefreshTunnelViewAction = {}));
    var ChangeLocalPortAction;
    (function (ChangeLocalPortAction) {
        ChangeLocalPortAction.ID = 'remote.tunnel.changeLocalPort';
        ChangeLocalPortAction.LABEL = nls.localize('remote.tunnel.changeLocalPort', "Change Local Port");
        function validateInput(value) {
            if (!value.match(/^[0-9]+$/)) {
                return invalidPortString;
            }
            else if (Number(value) >= maxPortNumber) {
                return invalidPortNumberString;
            }
            return null;
        }
        function handler() {
            return async (accessor, arg) => {
                const remoteExplorerService = accessor.get(remoteExplorerService_1.IRemoteExplorerService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const context = (arg !== undefined || arg instanceof TunnelItem) ? arg : accessor.get(contextkey_1.IContextKeyService).getContextKeyValue(TunnelViewSelectionKeyName);
                if (context instanceof TunnelItem) {
                    remoteExplorerService.setEditable(context, {
                        onFinish: async (value, success) => {
                            remoteExplorerService.setEditable(context, null);
                            if (success) {
                                await remoteExplorerService.close({ host: context.remoteHost, port: context.remotePort });
                                const numberValue = Number(value);
                                const newForward = await remoteExplorerService.forward({ host: context.remoteHost, port: context.remotePort }, numberValue, context.name);
                                if (newForward && newForward.tunnelLocalPort !== numberValue) {
                                    notificationService.warn(nls.localize('remote.tunnel.changeLocalPortNumber', "The local port {0} is not available. Port number {1} has been used instead", value, newForward.tunnelLocalPort));
                                }
                            }
                        },
                        validationMessage: (value) => validationMessage(validateInput(value)),
                        placeholder: nls.localize('remote.tunnelsView.changePort', "New local port")
                    });
                }
            };
        }
        ChangeLocalPortAction.handler = handler;
    })(ChangeLocalPortAction || (ChangeLocalPortAction = {}));
    const tunnelViewCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: LabelTunnelAction.ID,
        weight: 200 /* WorkbenchContrib */ + tunnelViewCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(TunnelViewFocusContextKey, exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded)),
        primary: 60 /* F2 */,
        mac: {
            primary: 3 /* Enter */
        },
        handler: LabelTunnelAction.handler()
    });
    commands_1.CommandsRegistry.registerCommand(ForwardPortAction.INLINE_ID, ForwardPortAction.inlineHandler());
    commands_1.CommandsRegistry.registerCommand(ForwardPortAction.COMMANDPALETTE_ID, ForwardPortAction.commandPaletteHandler());
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: ClosePortAction.INLINE_ID,
        weight: 200 /* WorkbenchContrib */ + tunnelViewCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(exports.TunnelCloseableContextKey, TunnelViewFocusContextKey),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
        },
        handler: ClosePortAction.inlineHandler()
    });
    commands_1.CommandsRegistry.registerCommand(ClosePortAction.COMMANDPALETTE_ID, ClosePortAction.commandPaletteHandler());
    commands_1.CommandsRegistry.registerCommand(OpenPortInBrowserAction.ID, OpenPortInBrowserAction.handler());
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CopyAddressAction.INLINE_ID,
        weight: 200 /* WorkbenchContrib */ + tunnelViewCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(TunnelViewFocusContextKey, exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded)), contextkey_1.ContextKeyExpr.and(TunnelViewFocusContextKey, exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Detected))),
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        handler: CopyAddressAction.inlineHandler()
    });
    commands_1.CommandsRegistry.registerCommand(CopyAddressAction.COMMANDPALETTE_ID, CopyAddressAction.commandPaletteHandler());
    commands_1.CommandsRegistry.registerCommand(RefreshTunnelViewAction.ID, RefreshTunnelViewAction.handler());
    commands_1.CommandsRegistry.registerCommand(ChangeLocalPortAction.ID, ChangeLocalPortAction.handler());
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: ClosePortAction.COMMANDPALETTE_ID,
            title: ClosePortAction.LABEL
        },
        when: exports.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: ForwardPortAction.COMMANDPALETTE_ID,
            title: ForwardPortAction.LABEL
        },
        when: exports.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, ({
        command: {
            id: CopyAddressAction.COMMANDPALETTE_ID,
            title: CopyAddressAction.COMMANDPALETTE_LABEL
        },
        when: exports.forwardedPortsViewEnabled
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelTitle, ({
        group: 'navigation',
        order: 0,
        command: {
            id: ForwardPortAction.INLINE_ID,
            title: ForwardPortAction.LABEL,
            icon: { id: 'codicon/plus' }
        }
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelTitle, ({
        group: 'navigation',
        order: 1,
        command: {
            id: RefreshTunnelViewAction.ID,
            title: RefreshTunnelViewAction.LABEL,
            icon: { id: 'codicon/refresh' }
        }
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '0_manage',
        order: 0,
        command: {
            id: CopyAddressAction.INLINE_ID,
            title: CopyAddressAction.INLINE_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.or(exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded), exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Detected))
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '0_manage',
        order: 1,
        command: {
            id: OpenPortInBrowserAction.ID,
            title: OpenPortInBrowserAction.LABEL,
        },
        when: contextkey_1.ContextKeyExpr.or(exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded), exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Detected))
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '0_manage',
        order: 2,
        command: {
            id: LabelTunnelAction.ID,
            title: LabelTunnelAction.LABEL,
        },
        when: exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '1_manage',
        order: 0,
        command: {
            id: ChangeLocalPortAction.ID,
            title: ChangeLocalPortAction.LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded), PortChangableContextKey)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '0_manage',
        order: 1,
        command: {
            id: ForwardPortAction.INLINE_ID,
            title: ForwardPortAction.TREEITEM_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.or(exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Candidate), exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Add))
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelContext, ({
        group: '1_manage',
        order: 1,
        command: {
            id: ClosePortAction.INLINE_ID,
            title: ClosePortAction.LABEL,
        },
        when: exports.TunnelCloseableContextKey
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelInline, ({
        order: 0,
        command: {
            id: OpenPortInBrowserAction.ID,
            title: OpenPortInBrowserAction.LABEL,
            icon: { id: 'codicon/globe' }
        },
        when: contextkey_1.ContextKeyExpr.or(exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Forwarded), exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Detected))
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelInline, ({
        order: 0,
        command: {
            id: ForwardPortAction.INLINE_ID,
            title: ForwardPortAction.TREEITEM_LABEL,
            icon: { id: 'codicon/plus' }
        },
        when: exports.TunnelTypeContextKey.isEqualTo(remoteExplorerService_1.TunnelType.Candidate)
    }));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TunnelInline, ({
        order: 2,
        command: {
            id: ClosePortAction.INLINE_ID,
            title: ClosePortAction.LABEL,
            icon: { id: 'codicon/x' }
        },
        when: exports.TunnelCloseableContextKey
    }));
});
//# __sourceMappingURL=tunnelView.js.map