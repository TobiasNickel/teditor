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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/uri", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/contrib/remote/common/remote.contribution", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/workbench/browser/viewlet", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/platform/progress/common/progress", "vs/workbench/common/contributions", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/actions/windowActions", "vs/workbench/contrib/remote/browser/explorerViewItems", "vs/base/common/types", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/services/environment/common/environmentService", "vs/base/common/strings", "vs/workbench/contrib/remote/browser/tunnelView", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/remote/browser/remoteIndicator", "vs/workbench/browser/quickaccess", "vs/base/common/codicons", "vs/css!./media/remoteViewlet"], function (require, exports, nls, dom, uri_1, layoutService_1, telemetry_1, workspace_1, storage_1, configuration_1, instantiation_1, themeService_1, contextView_1, extensions_1, viewsViewlet_1, remote_contribution_1, contextkey_1, views_1, platform_1, opener_1, quickInput_1, commands_1, viewlet_1, viewlet_2, editorGroupsService_1, actions_1, actions_2, progress_1, contributions_1, remoteAgentService_1, dialogs_1, severity_1, windowActions_1, explorerViewItems_1, types_1, remoteExplorerService_1, environmentService_1, strings_1, tunnelView_1, viewPaneContainer_1, listService_1, keybinding_1, event_1, extensionsRegistry_1, descriptors_1, remoteIndicator_1, quickaccess_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteViewPaneContainer = void 0;
    const remoteHelpExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'remoteHelp',
        jsonSchema: {
            description: nls.localize('RemoteHelpInformationExtPoint', 'Contributes help information for Remote'),
            type: 'object',
            properties: {
                'getStarted': {
                    description: nls.localize('RemoteHelpInformationExtPoint.getStarted', "The url to your project's Getting Started page"),
                    type: 'string'
                },
                'documentation': {
                    description: nls.localize('RemoteHelpInformationExtPoint.documentation', "The url to your project's documentation page"),
                    type: 'string'
                },
                'feedback': {
                    description: nls.localize('RemoteHelpInformationExtPoint.feedback', "The url to your project's feedback reporter"),
                    type: 'string'
                },
                'issues': {
                    description: nls.localize('RemoteHelpInformationExtPoint.issues', "The url to your project's issues list"),
                    type: 'string'
                }
            }
        }
    });
    class HelpTreeVirtualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'HelpItemTemplate';
        }
    }
    class HelpTreeRenderer {
        constructor() {
            this.templateId = 'HelpItemTemplate';
        }
        renderTemplate(container) {
            dom.addClass(container, 'remote-help-tree-node-item');
            const icon = dom.append(container, dom.$('.remote-help-tree-node-item-icon'));
            const data = Object.create(null);
            data.parent = container;
            data.icon = icon;
            return data;
        }
        renderElement(element, index, templateData, height) {
            const container = templateData.parent;
            dom.append(container, templateData.icon);
            dom.addClasses(templateData.icon, ...element.element.iconClasses);
            const labelContainer = dom.append(container, dom.$('.help-item-label'));
            labelContainer.innerText = element.element.label;
        }
        disposeTemplate(templateData) {
        }
    }
    class HelpDataSource {
        hasChildren(element) {
            return element instanceof HelpModel;
        }
        getChildren(element) {
            if (element instanceof HelpModel && element.items) {
                return element.items;
            }
            return [];
        }
    }
    const getStartedIcon = codicons_1.registerIcon('remote-explorer-get-started', codicons_1.Codicon.star);
    const documentationIcon = codicons_1.registerIcon('remote-explorer-documentation', codicons_1.Codicon.book);
    const feedbackIcon = codicons_1.registerIcon('remote-explorer-feedback', codicons_1.Codicon.twitter);
    const reviewIssuesIcon = codicons_1.registerIcon('remote-explorer-review-issues', codicons_1.Codicon.issues);
    const reportIssuesIcon = codicons_1.registerIcon('remote-explorer-report-issues', codicons_1.Codicon.comment);
    class HelpModel {
        constructor(viewModel, openerService, quickInputService, commandService, remoteExplorerService, environmentService) {
            let helpItems = [];
            const getStarted = viewModel.helpInformation.filter(info => info.getStarted);
            if (getStarted.length) {
                helpItems.push(new HelpItem(getStartedIcon, nls.localize('remote.help.getStarted', "Get Started"), getStarted.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.getStarted,
                    remoteAuthority: (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName
                })), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            const documentation = viewModel.helpInformation.filter(info => info.documentation);
            if (documentation.length) {
                helpItems.push(new HelpItem(documentationIcon, nls.localize('remote.help.documentation', "Read Documentation"), documentation.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.documentation,
                    remoteAuthority: (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName
                })), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            const feedback = viewModel.helpInformation.filter(info => info.feedback);
            if (feedback.length) {
                helpItems.push(new HelpItem(feedbackIcon, nls.localize('remote.help.feedback', "Provide Feedback"), feedback.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.feedback,
                    remoteAuthority: (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName
                })), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            const issues = viewModel.helpInformation.filter(info => info.issues);
            if (issues.length) {
                helpItems.push(new HelpItem(reviewIssuesIcon, nls.localize('remote.help.issues', "Review Issues"), issues.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.issues,
                    remoteAuthority: (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName
                })), quickInputService, environmentService, openerService, remoteExplorerService));
            }
            if (helpItems.length) {
                helpItems.push(new IssueReporterItem(reportIssuesIcon, nls.localize('remote.help.report', "Report Issue"), viewModel.helpInformation.map(info => ({
                    extensionDescription: info.extensionDescription,
                    remoteAuthority: (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName
                })), quickInputService, environmentService, commandService, remoteExplorerService));
            }
            if (helpItems.length) {
                this.items = helpItems;
            }
        }
    }
    class HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, remoteExplorerService) {
            this.icon = icon;
            this.label = label;
            this.values = values;
            this.quickInputService = quickInputService;
            this.environmentService = environmentService;
            this.remoteExplorerService = remoteExplorerService;
            this.iconClasses = [];
            this.iconClasses.push(icon.classNames);
            this.iconClasses.push('remote-help-tree-node-item-icon');
        }
        async handleClick() {
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            for (let i = 0; i < this.remoteExplorerService.targetType.length; i++) {
                if (strings_1.startsWith(remoteAuthority, this.remoteExplorerService.targetType[i])) {
                    for (let value of this.values) {
                        if (value.remoteAuthority) {
                            for (let authority of value.remoteAuthority) {
                                if (strings_1.startsWith(remoteAuthority, authority)) {
                                    await this.takeAction(value.extensionDescription, value.url);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
            if (this.values.length > 1) {
                let actions = this.values.map(value => {
                    return {
                        label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                        description: value.url,
                        extensionDescription: value.extensionDescription
                    };
                });
                const action = await this.quickInputService.pick(actions, { placeHolder: nls.localize('pickRemoteExtension', "Select url to open") });
                if (action) {
                    await this.takeAction(action.extensionDescription, action.description);
                }
            }
            else {
                await this.takeAction(this.values[0].extensionDescription, this.values[0].url);
            }
        }
    }
    class HelpItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, openerService, remoteExplorerService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService);
            this.openerService = openerService;
        }
        async takeAction(extensionDescription, url) {
            await this.openerService.open(uri_1.URI.parse(url));
        }
    }
    class IssueReporterItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, commandService, remoteExplorerService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService);
            this.commandService = commandService;
        }
        async takeAction(extensionDescription) {
            await this.commandService.executeCommand('workbench.action.openIssueReporter', [extensionDescription.identifier.value]);
        }
    }
    let HelpPanel = class HelpPanel extends viewPaneContainer_1.ViewPane {
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, remoteExplorerService, workbenchEnvironmentService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.remoteExplorerService = remoteExplorerService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(container, 'remote-help');
            const treeContainer = document.createElement('div');
            dom.addClass(treeContainer, 'remote-help-content');
            container.appendChild(treeContainer);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'RemoteHelp', treeContainer, new HelpTreeVirtualDelegate(), [new HelpTreeRenderer()], new HelpDataSource(), {
                keyboardSupport: true,
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        return item.label;
                    },
                    getWidgetAriaLabel: () => nls.localize('remotehelp', "Remote Help")
                }
            });
            const model = new HelpModel(this.viewModel, this.openerService, this.quickInputService, this.commandService, this.remoteExplorerService, this.workbenchEnvironmentService);
            this.tree.setInput(model);
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(e => {
                e.element.handleClick();
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
    };
    HelpPanel.ID = '~remote.helpPanel';
    HelpPanel.TITLE = nls.localize('remote.help', "Help and feedback");
    HelpPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, opener_1.IOpenerService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, commands_1.ICommandService),
        __param(11, remoteExplorerService_1.IRemoteExplorerService),
        __param(12, environmentService_1.IWorkbenchEnvironmentService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService)
    ], HelpPanel);
    class HelpPanelDescriptor {
        constructor(viewModel) {
            this.id = HelpPanel.ID;
            this.name = HelpPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.workspace = true;
            this.group = 'help@50';
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(HelpPanel, [viewModel]);
        }
    }
    let RemoteViewPaneContainer = class RemoteViewPaneContainer extends viewsViewlet_1.FilterViewPaneContainer {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, themeService, contextMenuService, extensionService, remoteExplorerService, environmentService, contextKeyService, viewDescriptorService) {
            super(remote_contribution_1.VIEWLET_ID, remoteExplorerService.onDidChangeTargetType, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, viewDescriptorService);
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.contextKeyService = contextKeyService;
            this.helpPanelDescriptor = new HelpPanelDescriptor(this);
            this.helpInformation = [];
            this.addConstantViewDescriptors([this.helpPanelDescriptor]);
            remoteHelpExtPoint.setHandler((extensions) => {
                let helpInformation = [];
                for (let extension of extensions) {
                    this._handleRemoteInfoExtensionPoint(extension, helpInformation);
                }
                this.helpInformation = helpInformation;
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                if (this.helpInformation.length) {
                    viewsRegistry.registerViews([this.helpPanelDescriptor], this.viewContainer);
                }
                else {
                    viewsRegistry.deregisterViews([this.helpPanelDescriptor], this.viewContainer);
                }
            });
        }
        _handleRemoteInfoExtensionPoint(extension, helpInformation) {
            if (!extension.description.enableProposedApi) {
                return;
            }
            if (!extension.value.documentation && !extension.value.feedback && !extension.value.getStarted && !extension.value.issues) {
                return;
            }
            helpInformation.push({
                extensionDescription: extension.description,
                getStarted: extension.value.getStarted,
                documentation: extension.value.documentation,
                feedback: extension.value.feedback,
                issues: extension.value.issues,
                remoteName: extension.value.remoteName
            });
        }
        getFilterOn(viewDescriptor) {
            return types_1.isStringArray(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority[0] : viewDescriptor.remoteAuthority;
        }
        getActionViewItem(action) {
            if (action.id === explorerViewItems_1.SwitchRemoteAction.ID) {
                return this.instantiationService.createInstance(explorerViewItems_1.SwitchRemoteViewItem, action, explorerViewItems_1.SwitchRemoteViewItem.createOptionItems(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getViews(this.viewContainer), this.contextKeyService));
            }
            return super.getActionViewItem(action);
        }
        getActions() {
            if (!this.actions) {
                this.actions = [
                    this.instantiationService.createInstance(explorerViewItems_1.SwitchRemoteAction, explorerViewItems_1.SwitchRemoteAction.ID, explorerViewItems_1.SwitchRemoteAction.LABEL)
                ];
                this.actions.forEach(a => {
                    this._register(a);
                });
            }
            return this.actions;
        }
        getTitle() {
            const title = nls.localize('remote.explorer', "Remote Explorer");
            return title;
        }
        onDidAddViewDescriptors(added) {
            // Call to super MUST be first, since registering the additional view will cause this to be called again.
            const panels = super.onDidAddViewDescriptors(added);
            // This context key is set to false in the constructor, but is expected to be changed by resolver extensions to enable the forwarded ports view.
            const viewEnabled = !!tunnelView_1.forwardedPortsViewEnabled.getValue(this.contextKeyService);
            if (this.environmentService.configuration.remoteAuthority && !this.tunnelPanelDescriptor && viewEnabled) {
                this.tunnelPanelDescriptor = new tunnelView_1.TunnelPanelDescriptor(new tunnelView_1.TunnelViewModel(this.remoteExplorerService), this.environmentService);
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                viewsRegistry.registerViews([this.tunnelPanelDescriptor], this.viewContainer);
            }
            return panels;
        }
    };
    RemoteViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, extensions_1.IExtensionService),
        __param(9, remoteExplorerService_1.IRemoteExplorerService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, views_1.IViewDescriptorService)
    ], RemoteViewPaneContainer);
    exports.RemoteViewPaneContainer = RemoteViewPaneContainer;
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: remote_contribution_1.VIEWLET_ID,
        name: nls.localize('remote.explorer', "Remote Explorer"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(RemoteViewPaneContainer),
        hideIfEmpty: true,
        viewOrderDelegate: {
            getOrder: (group) => {
                if (!group) {
                    return;
                }
                let matches = /^targets@(\d+)$/.exec(group);
                if (matches) {
                    return -1000;
                }
                matches = /^details(@(\d+))?$/.exec(group);
                if (matches) {
                    return -500;
                }
                matches = /^help(@(\d+))?$/.exec(group);
                if (matches) {
                    return -10;
                }
                return;
            }
        },
        icon: 'codicon-remote-explorer',
        order: 4
    }, views_1.ViewContainerLocation.Sidebar);
    let OpenRemoteViewletAction = class OpenRemoteViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, remote_contribution_1.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenRemoteViewletAction.ID = remote_contribution_1.VIEWLET_ID;
    OpenRemoteViewletAction.LABEL = nls.localize('toggleRemoteViewlet', "Show Remote Explorer");
    OpenRemoteViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService), __param(3, editorGroupsService_1.IEditorGroupsService), __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenRemoteViewletAction);
    // Register Action to Open Viewlet
    platform_1.Registry.as(actions_1.Extensions.WorkbenchActions).registerWorkbenchAction(actions_2.SyncActionDescriptor.from(OpenRemoteViewletAction, {
        primary: 0
    }), 'View: Show Remote Explorer', nls.localize('view', "View"));
    class VisibleProgress {
        constructor(progressService, location, initialReport, buttons, onDidCancel) {
            this._isDisposed = false;
            this._lastReport = initialReport;
            this._currentProgressPromiseResolve = null;
            this._currentProgress = null;
            this._currentTimer = null;
            const promise = new Promise((resolve) => this._currentProgressPromiseResolve = resolve);
            progressService.withProgress({ location: location, buttons: buttons }, (progress) => { if (!this._isDisposed) {
                this._currentProgress = progress;
            } return promise; }, (choice) => onDidCancel(choice, this._lastReport));
            if (this._lastReport) {
                this.report();
            }
        }
        get lastReport() {
            return this._lastReport;
        }
        dispose() {
            this._isDisposed = true;
            if (this._currentProgressPromiseResolve) {
                this._currentProgressPromiseResolve();
                this._currentProgressPromiseResolve = null;
            }
            this._currentProgress = null;
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
        report(message) {
            if (message) {
                this._lastReport = message;
            }
            if (this._lastReport && this._currentProgress) {
                this._currentProgress.report({ message: this._lastReport });
            }
        }
        startTimer(completionTime) {
            this.stopTimer();
            this._currentTimer = new ReconnectionTimer2(this, completionTime);
        }
        stopTimer() {
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
    }
    class ReconnectionTimer2 {
        constructor(parent, completionTime) {
            this._parent = parent;
            this._completionTime = completionTime;
            this._token = setInterval(() => this._render(), 1000);
            this._render();
        }
        dispose() {
            clearInterval(this._token);
        }
        _render() {
            const remainingTimeMs = this._completionTime - Date.now();
            if (remainingTimeMs < 0) {
                return;
            }
            const remainingTime = Math.ceil(remainingTimeMs / 1000);
            if (remainingTime === 1) {
                this._parent.report(nls.localize('reconnectionWaitOne', "Attempting to reconnect in {0} second...", remainingTime));
            }
            else {
                this._parent.report(nls.localize('reconnectionWaitMany', "Attempting to reconnect in {0} seconds...", remainingTime));
            }
        }
    }
    let RemoteAgentConnectionStatusListener = class RemoteAgentConnectionStatusListener {
        constructor(remoteAgentService, progressService, dialogService, commandService, contextKeyService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                let visibleProgress = null;
                let lastLocation = null;
                let reconnectWaitEvent = null;
                let disposableListener = null;
                function showProgress(location, buttons, initialReport = null) {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                    lastLocation = location;
                    return new VisibleProgress(progressService, location, initialReport, buttons.map(button => button.label), (choice, lastReport) => {
                        // Handle choice from dialog
                        if (typeof choice !== 'undefined' && buttons[choice]) {
                            buttons[choice].callback();
                        }
                        else {
                            if (location === 20 /* Dialog */) {
                                visibleProgress = showProgress(15 /* Notification */, buttons, lastReport);
                            }
                            else {
                                hideProgress();
                            }
                        }
                    });
                }
                function hideProgress() {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                }
                const reconnectButton = {
                    label: nls.localize('reconnectNow', "Reconnect Now"),
                    callback: () => {
                        if (reconnectWaitEvent) {
                            reconnectWaitEvent.skipWait();
                        }
                    }
                };
                const reloadButton = {
                    label: nls.localize('reloadWindow', "Reload Window"),
                    callback: () => {
                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                    }
                };
                connection.onDidStateChange((e) => {
                    if (visibleProgress) {
                        visibleProgress.stopTimer();
                    }
                    if (disposableListener) {
                        disposableListener.dispose();
                        disposableListener = null;
                    }
                    switch (e.type) {
                        case 0 /* ConnectionLost */:
                            if (!visibleProgress) {
                                visibleProgress = showProgress(20 /* Dialog */, [reconnectButton, reloadButton]);
                            }
                            visibleProgress.report(nls.localize('connectionLost', "Connection Lost"));
                            break;
                        case 1 /* ReconnectionWait */:
                            reconnectWaitEvent = e;
                            visibleProgress = showProgress(lastLocation || 15 /* Notification */, [reconnectButton, reloadButton]);
                            visibleProgress.startTimer(Date.now() + 1000 * e.durationSeconds);
                            break;
                        case 2 /* ReconnectionRunning */:
                            visibleProgress = showProgress(lastLocation || 15 /* Notification */, [reloadButton]);
                            visibleProgress.report(nls.localize('reconnectionRunning', "Attempting to reconnect..."));
                            // Register to listen for quick input is opened
                            disposableListener = contextKeyService.onDidChangeContext((contextKeyChangeEvent) => {
                                const reconnectInteraction = new Set([quickaccess_1.inQuickPickContextKeyValue]);
                                if (contextKeyChangeEvent.affectsSome(reconnectInteraction)) {
                                    // Need to move from dialog if being shown and user needs to type in a prompt
                                    if (lastLocation === 20 /* Dialog */ && visibleProgress !== null) {
                                        visibleProgress = showProgress(15 /* Notification */, [reloadButton], visibleProgress.lastReport);
                                    }
                                }
                            });
                            break;
                        case 3 /* ReconnectionPermanentFailure */:
                            hideProgress();
                            dialogService.show(severity_1.default.Error, nls.localize('reconnectionPermanentFailure', "Cannot reconnect. Please reload the window."), [nls.localize('reloadWindow', "Reload Window"), nls.localize('cancel', "Cancel")], { cancelId: 1 }).then(result => {
                                // Reload the window
                                if (result.choice === 0) {
                                    commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                                }
                            });
                            break;
                        case 4 /* ConnectionGain */:
                            hideProgress();
                            break;
                    }
                });
            }
        }
    };
    RemoteAgentConnectionStatusListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, progress_1.IProgressService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService)
    ], RemoteAgentConnectionStatusListener);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentConnectionStatusListener, 4 /* Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remoteIndicator_1.RemoteWindowActiveIndicator, 1 /* Starting */);
});
//# __sourceMappingURL=remote.js.map