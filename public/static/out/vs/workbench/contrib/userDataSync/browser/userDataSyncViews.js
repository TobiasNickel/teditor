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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/base/common/date", "vs/base/common/strings", "vs/platform/dialogs/common/dialogs", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/platform/contextview/browser/contextView", "vs/base/common/codicons", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/base/common/actions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/base/common/uuid"], function (require, exports, platform_1, views_1, nls_1, descriptors_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, themeService_1, date_1, strings_1, dialogs_1, event_1, lifecycle_1, commands_1, viewPaneContainer_1, configuration_1, telemetry_1, contextView_1, codicons_1, layoutService_1, storage_1, workspace_1, extensions_1, actions_2, userDataSync_2, userDataSyncMachines_1, quickInput_1, notification_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncDataViews = exports.UserDataSyncViewPaneContainer = void 0;
    let UserDataSyncViewPaneContainer = class UserDataSyncViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(containerId, commandService, layoutService, telemetryService, instantiationService, themeService, configurationService, storageService, contextService, contextMenuService, extensionService, viewDescriptorService) {
            super(containerId, { mergeViewWithContainerWhenSingleView: false }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.commandService = commandService;
        }
        getActions() {
            return [
                new actions_2.Action(userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID, nls_1.localize('showLog', "Show Log"), codicons_1.Codicon.output.classNames, true, async () => this.commandService.executeCommand(userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID)),
                new actions_2.Action(userDataSync_2.CONFIGURE_SYNC_COMMAND_ID, nls_1.localize('configure', "Configure..."), codicons_1.Codicon.settingsGear.classNames, true, async () => this.commandService.executeCommand(userDataSync_2.CONFIGURE_SYNC_COMMAND_ID)),
            ];
        }
    };
    UserDataSyncViewPaneContainer = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, storage_1.IStorageService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, extensions_1.IExtensionService),
        __param(11, views_1.IViewDescriptorService)
    ], UserDataSyncViewPaneContainer);
    exports.UserDataSyncViewPaneContainer = UserDataSyncViewPaneContainer;
    let UserDataSyncDataViews = class UserDataSyncDataViews extends lifecycle_1.Disposable {
        constructor(container, instantiationService, userDataAutoSyncService, userDataSyncResourceEnablementService, contextKeyService) {
            super();
            this.instantiationService = instantiationService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.userDataSyncResourceEnablementService = userDataSyncResourceEnablementService;
            this.contextKeyService = contextKeyService;
            this.registerViews(container);
        }
        registerViews(container) {
            const remoteView = this.registerDataView(container, true, true);
            this.registerRemoteViewActions(remoteView);
            this.registerDataView(container, false, false);
            this.registerMachinesView(container);
        }
        registerDataView(container, remote, showByDefault) {
            const id = `workbench.views.sync.${remote ? 'remote' : 'local'}DataView`;
            const showByDefaultContext = new contextkey_1.RawContextKey(id, showByDefault);
            const viewEnablementContext = showByDefaultContext.bindTo(this.contextKeyService);
            const name = remote ? nls_1.localize('remote title', "Synced Data") : nls_1.localize('local title', "Local Backup");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            treeView.showCollapseAllAction = true;
            treeView.showRefreshAction = true;
            const disposable = treeView.onDidChangeVisibility(visible => {
                if (visible && !treeView.dataProvider) {
                    disposable.dispose();
                    treeView.dataProvider = remote ? this.instantiationService.createInstance(RemoteUserDataSyncHistoryViewDataProvider)
                        : this.instantiationService.createInstance(LocalUserDataSyncHistoryViewDataProvider);
                }
            });
            this._register(event_1.Event.any(this.userDataSyncResourceEnablementService.onDidChangeResourceEnablement, this.userDataAutoSyncService.onDidChangeEnablement)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* Available */), userDataSync_2.CONTEXT_ENABLE_VIEWS, showByDefaultContext),
                    canToggleVisibility: true,
                    canMoveView: true,
                    treeView,
                    collapsed: false,
                    order: 100,
                }], container);
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: remote ? userDataSync_2.SHOW_SYNCED_DATA_COMMAND_ID : 'workbench.userDataSync.actions.showLocalBackupData',
                        title: remote ?
                            { value: nls_1.localize('workbench.action.showSyncRemoteBackup', "Show Synced Data"), original: `Show Synced Data` }
                            : { value: nls_1.localize('workbench.action.showSyncLocalBackup', "Show Local Backup"), original: `Show Local Backup` },
                        category: { value: nls_1.localize('sync preferences', "Preferences Sync"), original: `Preferences Sync` },
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* Available */)),
                        },
                    });
                }
                async run(accessor) {
                    const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
                    const viewsService = accessor.get(views_1.IViewsService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    await commandService.executeCommand(userDataSync_2.ENABLE_SYNC_VIEWS_COMMAND_ID);
                    viewEnablementContext.set(true);
                    const viewContainer = viewDescriptorService.getViewContainerByViewId(id);
                    if (viewContainer) {
                        const model = viewDescriptorService.getViewContainerModel(viewContainer);
                        if (model.activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === id)) {
                            viewsService.openView(id, true);
                        }
                        else {
                            const disposable = model.onDidChangeActiveViewDescriptors(e => {
                                if (e.added.some(viewDescriptor => viewDescriptor.id === id)) {
                                    disposable.dispose();
                                    viewsService.openView(id, true);
                                }
                            });
                        }
                    }
                }
            });
            this.registerDataViewActions(id);
            return treeView;
        }
        registerMachinesView(container) {
            const id = `workbench.views.sync.machines`;
            const name = nls_1.localize('synced machines', "Synced Machines");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncMachinesViewDataProvider, treeView);
            treeView.showRefreshAction = true;
            const disposable = treeView.onDidChangeVisibility(visible => {
                if (visible && !treeView.dataProvider) {
                    disposable.dispose();
                    treeView.dataProvider = dataProvider;
                }
            });
            this._register(event_1.Event.any(this.userDataSyncResourceEnablementService.onDidChangeResourceEnablement, this.userDataAutoSyncService.onDidChangeEnablement)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* Available */), userDataSync_2.CONTEXT_ENABLE_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: true,
                    treeView,
                    collapsed: false,
                    order: 200,
                }], container);
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.editMachineName`,
                        title: nls_1.localize('workbench.actions.sync.editMachineName', "Edit Name"),
                        icon: codicons_1.Codicon.edit,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', id)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const changed = await dataProvider.rename(handle.$treeItemHandle);
                    if (changed) {
                        await treeView.refresh();
                    }
                }
            });
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.turnOffSyncOnMachine`,
                        title: nls_1.localize('workbench.actions.sync.turnOffSyncOnMachine', "Turn off Preferences Sync"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', id), contextkey_1.ContextKeyEqualsExpr.create('viewItem', 'sync-machine')),
                        },
                    });
                }
                async run(accessor, handle) {
                    if (await dataProvider.disable(handle.$treeItemHandle)) {
                        await treeView.refresh();
                    }
                }
            });
        }
        registerDataViewActions(viewId) {
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.resolveResource`,
                        title: nls_1.localize('workbench.actions.sync.resolveResourceRef', "Show raw JSON sync data"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const { resource } = JSON.parse(handle.$treeItemHandle);
                    const editorService = accessor.get(editorService_1.IEditorService);
                    await editorService.openEditor({ resource: uri_1.URI.parse(resource) });
                }
            });
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.replaceCurrent`,
                        title: nls_1.localize('workbench.actions.sync.replaceCurrent', "Restore"),
                        icon: { id: 'codicon/cloud-download' },
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                    const { resource, syncResource } = JSON.parse(handle.$treeItemHandle);
                    const result = await dialogService.confirm({
                        message: nls_1.localize('confirm replace', "Would you like to replace your current {0} with selected?", userDataSync_2.getSyncAreaLabel(syncResource)),
                        type: 'info',
                        title: nls_1.localize('preferences sync', "Preferences Sync")
                    });
                    if (result.confirmed) {
                        return userDataSyncService.replace(uri_1.URI.parse(resource));
                    }
                }
            });
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.commpareWithLocal`,
                        title: nls_1.localize('workbench.actions.sync.commpareWithLocal', "Open Changes"),
                    });
                }
                async run(accessor, handle) {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    const { resource, comparableResource } = JSON.parse(handle.$treeItemHandle);
                    if (comparableResource) {
                        await editorService.openEditor({
                            leftResource: uri_1.URI.parse(resource),
                            rightResource: uri_1.URI.parse(comparableResource),
                            options: {
                                preserveFocus: true,
                                revealIfVisible: true,
                            },
                        });
                    }
                    else {
                        await editorService.openEditor({ resource: uri_1.URI.parse(resource) });
                    }
                }
            });
        }
        registerRemoteViewActions(view) {
            this.registerResetAction(view);
        }
        registerResetAction(view) {
            actions_1.registerAction2(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.syncData.reset`,
                        title: nls_1.localize('workbench.actions.syncData.reset', "Reset Synced Data"),
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', view.id)),
                        },
                    });
                }
                async run(accessor) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
                    const result = await dialogService.confirm({
                        message: nls_1.localize('reset', "This will clear your synced data from the cloud and stop sync on all your devices."),
                        title: nls_1.localize('reset title', "Reset Synced Data"),
                        type: 'info',
                        primaryButton: nls_1.localize('reset button', "Reset"),
                    });
                    if (result.confirmed) {
                        await userDataSyncWorkbenchService.turnoff(true);
                        await view.refresh();
                    }
                }
            });
        }
    };
    UserDataSyncDataViews = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataAutoSyncService),
        __param(3, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(4, contextkey_1.IContextKeyService)
    ], UserDataSyncDataViews);
    exports.UserDataSyncDataViews = UserDataSyncDataViews;
    let UserDataSyncHistoryViewDataProvider = class UserDataSyncHistoryViewDataProvider {
        constructor(userDataSyncService, userDataAutoSyncService, userDataSyncResourceEnablementService, notificationService) {
            this.userDataSyncService = userDataSyncService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.userDataSyncResourceEnablementService = userDataSyncResourceEnablementService;
            this.notificationService = notificationService;
        }
        async getChildren(element) {
            try {
                if (!element) {
                    return await this.getRoots();
                }
                const syncResource = userDataSync_1.ALL_SYNC_RESOURCES.filter(key => key === element.handle)[0];
                if (syncResource) {
                    return await this.getChildrenForSyncResource(syncResource);
                }
                if (element.resourceHandle) {
                    return await this.getChildrenForSyncResourceTreeItem(element);
                }
                return [];
            }
            catch (error) {
                this.notificationService.error(error);
                throw error;
            }
        }
        async getRoots() {
            return userDataSync_1.ALL_SYNC_RESOURCES.map(resourceKey => ({
                handle: resourceKey,
                collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                label: { label: userDataSync_2.getSyncAreaLabel(resourceKey) },
                description: !this.userDataAutoSyncService.isEnabled() || this.userDataSyncResourceEnablementService.isResourceEnabled(resourceKey) ? undefined : nls_1.localize('not syncing', "Not syncing"),
                themeIcon: themeService_1.FolderThemeIcon,
                contextValue: resourceKey
            }));
        }
        async getChildrenForSyncResource(syncResource) {
            const refHandles = await this.getSyncResourceHandles(syncResource);
            if (refHandles.length) {
                return refHandles.map(({ uri, created }) => {
                    const handle = JSON.stringify({ resource: uri.toString(), syncResource });
                    return {
                        handle,
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: label(new Date(created)) },
                        description: date_1.fromNow(created, true),
                        resourceUri: uri,
                        resource: syncResource,
                        resourceHandle: { uri, created },
                        contextValue: `sync-resource-${syncResource}`
                    };
                });
            }
            else {
                return [{
                        handle: uuid_1.generateUuid(),
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        label: { label: nls_1.localize('no data', "No Data") },
                    }];
            }
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const associatedResources = await this.userDataSyncService.getAssociatedResources(element.resource, element.resourceHandle);
            return associatedResources.map(({ resource, comparableResource }) => {
                const handle = JSON.stringify({ resource: resource.toString(), comparableResource: comparableResource === null || comparableResource === void 0 ? void 0 : comparableResource.toString() });
                return {
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    resourceUri: resource,
                    command: { id: `workbench.actions.sync.commpareWithLocal`, title: '', arguments: [{ $treeViewId: '', $treeItemHandle: handle }] },
                    contextValue: `sync-associatedResource-${element.resource}`
                };
            });
        }
    };
    UserDataSyncHistoryViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataAutoSyncService),
        __param(2, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(3, notification_1.INotificationService)
    ], UserDataSyncHistoryViewDataProvider);
    class LocalUserDataSyncHistoryViewDataProvider extends UserDataSyncHistoryViewDataProvider {
        getSyncResourceHandles(syncResource) {
            return this.userDataSyncService.getLocalSyncResourceHandles(syncResource);
        }
    }
    let RemoteUserDataSyncHistoryViewDataProvider = class RemoteUserDataSyncHistoryViewDataProvider extends UserDataSyncHistoryViewDataProvider {
        constructor(userDataSyncService, userDataAutoSyncService, userDataSyncResourceEnablementService, userDataSyncMachinesService, notificationService) {
            super(userDataSyncService, userDataAutoSyncService, userDataSyncResourceEnablementService, notificationService);
            this.userDataSyncMachinesService = userDataSyncMachinesService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            return super.getChildren(element);
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        getSyncResourceHandles(syncResource) {
            return this.userDataSyncService.getRemoteSyncResourceHandles(syncResource);
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const children = await super.getChildrenForSyncResourceTreeItem(element);
            const machineId = await this.userDataSyncService.getMachineId(element.resource, element.resourceHandle);
            if (machineId) {
                const machines = await this.getMachines();
                const machine = machines.find(({ id }) => id === machineId);
                children.push({
                    handle: machineId,
                    label: { label: (machine === null || machine === void 0 ? void 0 : machine.name) || machineId },
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    themeIcon: codicons_1.Codicon.vm,
                });
            }
            return children;
        }
    };
    RemoteUserDataSyncHistoryViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataAutoSyncService),
        __param(2, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(3, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(4, notification_1.INotificationService)
    ], RemoteUserDataSyncHistoryViewDataProvider);
    let UserDataSyncMachinesViewDataProvider = class UserDataSyncMachinesViewDataProvider {
        constructor(treeView, userDataSyncMachinesService, quickInputService, notificationService, dialogService, userDataSyncWorkbenchService) {
            this.treeView = treeView;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            try {
                let machines = await this.getMachines();
                machines = machines.filter(m => !m.disabled).sort((m1, m2) => m1.isCurrent ? -1 : 1);
                this.treeView.message = machines.length ? undefined : nls_1.localize('no machines', "No Machines");
                return machines.map(({ id, name, isCurrent }) => ({
                    handle: id,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    label: { label: name },
                    description: isCurrent ? nls_1.localize({ key: 'current', comment: ['Current machine'] }, "Current") : undefined,
                    themeIcon: codicons_1.Codicon.vm,
                    contextValue: 'sync-machine'
                }));
            }
            catch (error) {
                this.notificationService.error(error);
                return [];
            }
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        async disable(machineId) {
            const machines = await this.getMachines();
            const machine = machines.find(({ id }) => id === machineId);
            if (!machine) {
                throw new Error(nls_1.localize('not found', "machine not found with id: {0}", machineId));
            }
            const result = await this.dialogService.confirm({
                type: 'info',
                message: nls_1.localize('turn off sync on machine', "Are you sure you want to turn off sync on {0}?", machine.name),
                primaryButton: nls_1.localize('turn off', "Turn off"),
            });
            if (!result.confirmed) {
                return false;
            }
            if (machine.isCurrent) {
                await this.userDataSyncWorkbenchService.turnoff(false);
            }
            else {
                await this.userDataSyncMachinesService.setEnablement(machineId, false);
            }
            return true;
        }
        async rename(machineId) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const inputBox = disposableStore.add(this.quickInputService.createInputBox());
            inputBox.placeholder = nls_1.localize('placeholder', "Enter the name of the machine");
            inputBox.busy = true;
            inputBox.show();
            const machines = await this.getMachines();
            const machine = machines.find(({ id }) => id === machineId);
            if (!machine) {
                inputBox.hide();
                disposableStore.dispose();
                throw new Error(nls_1.localize('not found', "machine not found with id: {0}", machineId));
            }
            inputBox.busy = false;
            inputBox.value = machine.name;
            const validateMachineName = (machineName) => {
                machineName = machineName.trim();
                return machineName && !machines.some(m => m.id !== machineId && m.name === machineName) ? machineName : null;
            };
            disposableStore.add(inputBox.onDidChangeValue(() => inputBox.validationMessage = validateMachineName(inputBox.value) ? '' : nls_1.localize('valid message', "Machine name should be unique and not empty")));
            return new Promise((c, e) => {
                disposableStore.add(inputBox.onDidAccept(async () => {
                    const machineName = validateMachineName(inputBox.value);
                    disposableStore.dispose();
                    if (machineName && machineName !== machine.name) {
                        try {
                            await this.userDataSyncMachinesService.renameMachine(machineId, machineName);
                            c(true);
                        }
                        catch (error) {
                            e(error);
                        }
                    }
                    else {
                        c(false);
                    }
                }));
            });
        }
    };
    UserDataSyncMachinesViewDataProvider = __decorate([
        __param(1, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, userDataSync_2.IUserDataSyncWorkbenchService)
    ], UserDataSyncMachinesViewDataProvider);
    function label(date) {
        return date.toLocaleDateString() +
            ' ' + strings_1.pad(date.getHours(), 2) +
            ':' + strings_1.pad(date.getMinutes(), 2) +
            ':' + strings_1.pad(date.getSeconds(), 2);
    }
});
//# __sourceMappingURL=userDataSyncViews.js.map