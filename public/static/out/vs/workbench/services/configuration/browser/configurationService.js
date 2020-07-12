/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configuration", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/configuration/common/configurationEditingService", "vs/workbench/services/configuration/browser/configuration", "vs/workbench/services/configuration/common/jsonEditingService", "vs/base/common/resources", "vs/base/common/performance"], function (require, exports, event_1, map_1, objects_1, lifecycle_1, async_1, jsonContributionRegistry_1, workspace_1, configurationModels_1, configuration_1, configurationModels_2, configuration_2, platform_1, configurationRegistry_1, workspaces_1, configurationEditingService_1, configuration_3, jsonEditingService_1, resources_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceService = void 0;
    class WorkspaceService extends lifecycle_1.Disposable {
        constructor({ remoteAuthority, configurationCache }, environmentService, fileService, remoteAgentService) {
            super();
            this.initialized = false;
            this.remoteUserConfiguration = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onDidChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceName = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onDidChangeWorkbenchState = this._register(new event_1.Emitter());
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            this.cyclicDependency = new Promise(resolve => this.cyclicDependencyReady = resolve);
            this.completeWorkspaceBarrier = new async_1.Barrier();
            this.defaultConfiguration = new configurationModels_1.DefaultConfigurationModel();
            this.configurationCache = configurationCache;
            this.fileService = fileService;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration, new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
            this.cachedFolderConfigs = new map_1.ResourceMap();
            this.localUserConfiguration = this._register(new configuration_3.UserConfiguration(environmentService.settingsResource, remoteAuthority ? configuration_2.LOCAL_MACHINE_SCOPES : undefined, fileService));
            this._register(this.localUserConfiguration.onDidChangeConfiguration(userConfiguration => this.onLocalUserConfigurationChanged(userConfiguration)));
            if (remoteAuthority) {
                this.remoteUserConfiguration = this._register(new configuration_3.RemoteUserConfiguration(remoteAuthority, configurationCache, fileService, remoteAgentService));
                this._register(this.remoteUserConfiguration.onDidChangeConfiguration(userConfiguration => this.onRemoteUserConfigurationChanged(userConfiguration)));
            }
            this.workspaceConfiguration = this._register(new configuration_3.WorkspaceConfiguration(configurationCache, fileService));
            this._register(this.workspaceConfiguration.onDidUpdateConfiguration(() => {
                this.onWorkspaceConfigurationChanged().then(() => {
                    if (this.workspaceConfiguration.loaded) {
                        this.releaseWorkspaceBarrier();
                    }
                });
            }));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidSchemaChange(e => this.registerConfigurationSchemas()));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(configurationProperties => this.onDefaultConfigurationChanged(configurationProperties)));
            this.workspaceEditingQueue = new async_1.Queue();
        }
        // Workspace Context Service Impl
        getCompleteWorkspace() {
            return this.completeWorkspaceBarrier.wait().then(() => this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            // Workspace has configuration file
            if (this.workspace.configuration) {
                return 3 /* WORKSPACE */;
            }
            // Folder has single root
            if (this.workspace.folders.length === 1) {
                return 2 /* FOLDER */;
            }
            // Empty
            return 1 /* EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        addFolders(foldersToAdd, index) {
            return this.updateFolders(foldersToAdd, [], index);
        }
        removeFolders(foldersToRemove) {
            return this.updateFolders([], foldersToRemove);
        }
        updateFolders(foldersToAdd, foldersToRemove, index) {
            return this.cyclicDependency.then(() => {
                return this.workspaceEditingQueue.queue(() => this.doUpdateFolders(foldersToAdd, foldersToRemove, index));
            });
        }
        isInsideWorkspace(resource) {
            return !!this.getWorkspaceFolder(resource);
        }
        isCurrentWorkspace(workspaceIdentifier) {
            switch (this.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    return workspaces_1.isSingleFolderWorkspaceIdentifier(workspaceIdentifier) && resources_1.isEqual(workspaceIdentifier, this.workspace.folders[0].uri);
                case 3 /* WORKSPACE */:
                    return workspaces_1.isWorkspaceIdentifier(workspaceIdentifier) && this.workspace.id === workspaceIdentifier.id;
            }
            return false;
        }
        async doUpdateFolders(foldersToAdd, foldersToRemove, index) {
            if (this.getWorkbenchState() !== 3 /* WORKSPACE */) {
                return Promise.resolve(undefined); // we need a workspace to begin with
            }
            if (foldersToAdd.length + foldersToRemove.length === 0) {
                return Promise.resolve(undefined); // nothing to do
            }
            let foldersHaveChanged = false;
            // Remove first (if any)
            let currentWorkspaceFolders = this.getWorkspace().folders;
            let newStoredFolders = currentWorkspaceFolders.map(f => f.raw).filter((folder, index) => {
                if (!workspaces_1.isStoredWorkspaceFolder(folder)) {
                    return true; // keep entries which are unrelated
                }
                return !this.contains(foldersToRemove, currentWorkspaceFolders[index].uri); // keep entries which are unrelated
            });
            const slashForPath = workspaces_1.useSlashForPath(newStoredFolders);
            foldersHaveChanged = currentWorkspaceFolders.length !== newStoredFolders.length;
            // Add afterwards (if any)
            if (foldersToAdd.length) {
                // Recompute current workspace folders if we have folders to add
                const workspaceConfigPath = this.getWorkspace().configuration;
                const workspaceConfigFolder = resources_1.dirname(workspaceConfigPath);
                currentWorkspaceFolders = workspace_1.toWorkspaceFolders(newStoredFolders, workspaceConfigPath);
                const currentWorkspaceFolderUris = currentWorkspaceFolders.map(folder => folder.uri);
                const storedFoldersToAdd = [];
                for (const folderToAdd of foldersToAdd) {
                    const folderURI = folderToAdd.uri;
                    if (this.contains(currentWorkspaceFolderUris, folderURI)) {
                        continue; // already existing
                    }
                    try {
                        const result = await this.fileService.resolve(folderURI);
                        if (!result.isDirectory) {
                            continue;
                        }
                    }
                    catch (e) { /* Ignore */ }
                    storedFoldersToAdd.push(workspaces_1.getStoredWorkspaceFolder(folderURI, false, folderToAdd.name, workspaceConfigFolder, slashForPath));
                }
                // Apply to array of newStoredFolders
                if (storedFoldersToAdd.length > 0) {
                    foldersHaveChanged = true;
                    if (typeof index === 'number' && index >= 0 && index < newStoredFolders.length) {
                        newStoredFolders = newStoredFolders.slice(0);
                        newStoredFolders.splice(index, 0, ...storedFoldersToAdd);
                    }
                    else {
                        newStoredFolders = [...newStoredFolders, ...storedFoldersToAdd];
                    }
                }
            }
            // Set folders if we recorded a change
            if (foldersHaveChanged) {
                return this.setFolders(newStoredFolders);
            }
            return Promise.resolve(undefined);
        }
        setFolders(folders) {
            return this.cyclicDependency.then(() => {
                return this.workspaceConfiguration.setFolders(folders, this.jsonEditingService)
                    .then(() => this.onWorkspaceConfigurationChanged());
            });
        }
        contains(resources, toCheck) {
            return resources.some(resource => resources_1.isEqual(resource, toCheck));
        }
        // Workspace Configuration Service Impl
        getConfigurationData() {
            return this._configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = configuration_1.isConfigurationOverrides(arg1) ? arg1 : configuration_1.isConfigurationOverrides(arg2) ? arg2 : undefined;
            return this._configuration.getValue(section, overrides);
        }
        updateValue(key, value, arg3, arg4, donotNotifyError) {
            return this.cyclicDependency.then(() => {
                const overrides = configuration_1.isConfigurationOverrides(arg3) ? arg3 : undefined;
                const target = this.deriveConfigurationTarget(key, value, overrides, overrides ? arg4 : arg3);
                return target ? this.writeConfigurationValue(key, value, target, overrides, donotNotifyError)
                    : Promise.resolve();
            });
        }
        reloadConfiguration(folder, key) {
            if (folder) {
                return this.reloadWorkspaceFolderConfiguration(folder, key);
            }
            return this.reloadUserConfiguration()
                .then(({ local, remote }) => this.reloadWorkspaceConfiguration()
                .then(() => this.loadConfiguration(local, remote)));
        }
        inspect(key, overrides) {
            return this._configuration.inspect(key, overrides);
        }
        keys() {
            return this._configuration.keys();
        }
        initialize(arg) {
            performance_1.mark('willInitWorkspaceService');
            return this.createWorkspace(arg)
                .then(workspace => this.updateWorkspaceAndInitializeConfiguration(workspace)).then(() => {
                performance_1.mark('didInitWorkspaceService');
            });
        }
        acquireInstantiationService(instantiationService) {
            this.configurationEditingService = instantiationService.createInstance(configurationEditingService_1.ConfigurationEditingService);
            this.jsonEditingService = instantiationService.createInstance(jsonEditingService_1.JSONEditingService);
            if (this.cyclicDependencyReady) {
                this.cyclicDependencyReady();
            }
            else {
                this.cyclicDependency = Promise.resolve(undefined);
            }
        }
        createWorkspace(arg) {
            if (workspaces_1.isWorkspaceIdentifier(arg)) {
                return this.createMultiFolderWorkspace(arg);
            }
            if (workspaces_1.isSingleFolderWorkspaceInitializationPayload(arg)) {
                return this.createSingleFolderWorkspace(arg);
            }
            return this.createEmptyWorkspace(arg);
        }
        createMultiFolderWorkspace(workspaceIdentifier) {
            return this.workspaceConfiguration.load({ id: workspaceIdentifier.id, configPath: workspaceIdentifier.configPath })
                .then(() => {
                const workspaceConfigPath = workspaceIdentifier.configPath;
                const workspaceFolders = workspace_1.toWorkspaceFolders(this.workspaceConfiguration.getFolders(), workspaceConfigPath);
                const workspaceId = workspaceIdentifier.id;
                const workspace = new workspace_1.Workspace(workspaceId, workspaceFolders, workspaceConfigPath);
                if (this.workspaceConfiguration.loaded) {
                    this.releaseWorkspaceBarrier();
                }
                return workspace;
            });
        }
        createSingleFolderWorkspace(singleFolder) {
            const workspace = new workspace_1.Workspace(singleFolder.id, [workspace_1.toWorkspaceFolder(singleFolder.folder)]);
            this.releaseWorkspaceBarrier(); // Release barrier as workspace is complete because it is single folder.
            return Promise.resolve(workspace);
        }
        createEmptyWorkspace(emptyWorkspace) {
            const workspace = new workspace_1.Workspace(emptyWorkspace.id);
            this.releaseWorkspaceBarrier(); // Release barrier as workspace is complete because it is an empty workspace.
            return Promise.resolve(workspace);
        }
        releaseWorkspaceBarrier() {
            if (!this.completeWorkspaceBarrier.isOpen()) {
                this.completeWorkspaceBarrier.open();
            }
        }
        updateWorkspaceAndInitializeConfiguration(workspace) {
            const hasWorkspaceBefore = !!this.workspace;
            let previousState;
            let previousWorkspacePath;
            let previousFolders;
            if (hasWorkspaceBefore) {
                previousState = this.getWorkbenchState();
                previousWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                previousFolders = this.workspace.folders;
                this.workspace.update(workspace);
            }
            else {
                this.workspace = workspace;
            }
            return this.initializeConfiguration().then(() => {
                // Trigger changes after configuration initialization so that configuration is up to date.
                if (hasWorkspaceBefore) {
                    const newState = this.getWorkbenchState();
                    if (previousState && newState !== previousState) {
                        this._onDidChangeWorkbenchState.fire(newState);
                    }
                    const newWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                    if (previousWorkspacePath && newWorkspacePath !== previousWorkspacePath || newState !== previousState) {
                        this._onDidChangeWorkspaceName.fire();
                    }
                    const folderChanges = this.compareFolders(previousFolders, this.workspace.folders);
                    if (folderChanges && (folderChanges.added.length || folderChanges.removed.length || folderChanges.changed.length)) {
                        this._onDidChangeWorkspaceFolders.fire(folderChanges);
                    }
                }
                else {
                    // Not waiting on this validation to unblock start up
                    this.validateWorkspaceFoldersAndReload();
                }
                if (!this.localUserConfiguration.hasTasksLoaded) {
                    // Reload local user configuration again to load user tasks
                    async_1.runWhenIdle(() => this.reloadLocalUserConfiguration().then(configurationModel => this.onLocalUserConfigurationChanged(configurationModel)), 5000);
                }
            });
        }
        compareFolders(currentFolders, newFolders) {
            const result = { added: [], removed: [], changed: [] };
            result.added = newFolders.filter(newFolder => !currentFolders.some(currentFolder => newFolder.uri.toString() === currentFolder.uri.toString()));
            for (let currentIndex = 0; currentIndex < currentFolders.length; currentIndex++) {
                let currentFolder = currentFolders[currentIndex];
                let newIndex = 0;
                for (newIndex = 0; newIndex < newFolders.length && currentFolder.uri.toString() !== newFolders[newIndex].uri.toString(); newIndex++) { }
                if (newIndex < newFolders.length) {
                    if (currentIndex !== newIndex || currentFolder.name !== newFolders[newIndex].name) {
                        result.changed.push(currentFolder);
                    }
                }
                else {
                    result.removed.push(currentFolder);
                }
            }
            return result;
        }
        initializeConfiguration() {
            this.registerConfigurationSchemas();
            return this.initializeUserConfiguration()
                .then(({ local, remote }) => this.loadConfiguration(local, remote));
        }
        initializeUserConfiguration() {
            return Promise.all([this.localUserConfiguration.initialize(), this.remoteUserConfiguration ? this.remoteUserConfiguration.initialize() : Promise.resolve(new configurationModels_1.ConfigurationModel())])
                .then(([local, remote]) => ({ local, remote }));
        }
        reloadUserConfiguration(key) {
            return Promise.all([this.reloadLocalUserConfiguration(), this.reloadRemoeUserConfiguration()]).then(([local, remote]) => ({ local, remote }));
        }
        reloadLocalUserConfiguration(key) {
            return this.localUserConfiguration.reload();
        }
        reloadRemoeUserConfiguration(key) {
            return this.remoteUserConfiguration ? this.remoteUserConfiguration.reload() : Promise.resolve(new configurationModels_1.ConfigurationModel());
        }
        reloadWorkspaceConfiguration(key) {
            const workbenchState = this.getWorkbenchState();
            if (workbenchState === 2 /* FOLDER */) {
                return this.onWorkspaceFolderConfigurationChanged(this.workspace.folders[0], key);
            }
            if (workbenchState === 3 /* WORKSPACE */) {
                return this.workspaceConfiguration.reload().then(() => this.onWorkspaceConfigurationChanged());
            }
            return Promise.resolve(undefined);
        }
        reloadWorkspaceFolderConfiguration(folder, key) {
            return this.onWorkspaceFolderConfigurationChanged(folder, key);
        }
        loadConfiguration(userConfigurationModel, remoteUserConfigurationModel) {
            // reset caches
            this.cachedFolderConfigs = new map_1.ResourceMap();
            const folders = this.workspace.folders;
            return this.loadFolderConfigurations(folders)
                .then((folderConfigurations) => {
                let workspaceConfiguration = this.getWorkspaceConfigurationModel(folderConfigurations);
                const folderConfigurationModels = new map_1.ResourceMap();
                folderConfigurations.forEach((folderConfiguration, index) => folderConfigurationModels.set(folders[index].uri, folderConfiguration));
                const currentConfiguration = this._configuration;
                this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration, userConfigurationModel, remoteUserConfigurationModel, workspaceConfiguration, folderConfigurationModels, new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
                if (this.initialized) {
                    const change = this._configuration.compare(currentConfiguration);
                    this.triggerConfigurationChange(change, { data: currentConfiguration.toData(), workspace: this.workspace }, 4 /* WORKSPACE */);
                }
                else {
                    this._onDidChangeConfiguration.fire(new configurationModels_1.AllKeysConfigurationChangeEvent(this._configuration, this.workspace, 4 /* WORKSPACE */, this.getTargetConfiguration(4 /* WORKSPACE */)));
                    this.initialized = true;
                }
            });
        }
        getWorkspaceConfigurationModel(folderConfigurations) {
            switch (this.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    return folderConfigurations[0];
                case 3 /* WORKSPACE */:
                    return this.workspaceConfiguration.getConfiguration();
                default:
                    return new configurationModels_1.ConfigurationModel();
            }
        }
        onDefaultConfigurationChanged(keys) {
            this.defaultConfiguration = new configurationModels_1.DefaultConfigurationModel();
            this.registerConfigurationSchemas();
            if (this.workspace) {
                const previousData = this._configuration.toData();
                const change = this._configuration.compareAndUpdateDefaultConfiguration(this.defaultConfiguration, keys);
                if (this.remoteUserConfiguration) {
                    this._configuration.updateLocalUserConfiguration(this.localUserConfiguration.reprocess());
                    this._configuration.updateRemoteUserConfiguration(this.remoteUserConfiguration.reprocess());
                }
                if (this.getWorkbenchState() === 2 /* FOLDER */) {
                    const folderConfiguration = this.cachedFolderConfigs.get(this.workspace.folders[0].uri);
                    if (folderConfiguration) {
                        this._configuration.updateWorkspaceConfiguration(folderConfiguration.reprocess());
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.reprocessWorkspaceSettings());
                    for (const folder of this.workspace.folders) {
                        const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                        if (folderConfiguration) {
                            this._configuration.updateFolderConfiguration(folder.uri, folderConfiguration.reprocess());
                        }
                    }
                }
                this.triggerConfigurationChange(change, { data: previousData, workspace: this.workspace }, 6 /* DEFAULT */);
            }
        }
        registerConfigurationSchemas() {
            if (this.workspace) {
                const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
                const allSettingsSchema = { properties: configurationRegistry_1.allSettings.properties, patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: true, allowTrailingCommas: true, allowComments: true };
                const userSettingsSchema = this.remoteUserConfiguration ? { properties: Object.assign(Object.assign(Object.assign({}, configurationRegistry_1.applicationSettings.properties), configurationRegistry_1.windowSettings.properties), configurationRegistry_1.resourceSettings.properties), patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: true, allowTrailingCommas: true, allowComments: true } : allSettingsSchema;
                const machineSettingsSchema = { properties: Object.assign(Object.assign(Object.assign(Object.assign({}, configurationRegistry_1.machineSettings.properties), configurationRegistry_1.machineOverridableSettings.properties), configurationRegistry_1.windowSettings.properties), configurationRegistry_1.resourceSettings.properties), patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: true, allowTrailingCommas: true, allowComments: true };
                const workspaceSettingsSchema = { properties: Object.assign(Object.assign(Object.assign({}, configurationRegistry_1.machineOverridableSettings.properties), configurationRegistry_1.windowSettings.properties), configurationRegistry_1.resourceSettings.properties), patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: true, allowTrailingCommas: true, allowComments: true };
                jsonRegistry.registerSchema(configuration_2.defaultSettingsSchemaId, allSettingsSchema);
                jsonRegistry.registerSchema(configuration_2.userSettingsSchemaId, userSettingsSchema);
                jsonRegistry.registerSchema(configuration_2.machineSettingsSchemaId, machineSettingsSchema);
                if (3 /* WORKSPACE */ === this.getWorkbenchState()) {
                    const folderSettingsSchema = { properties: Object.assign(Object.assign({}, configurationRegistry_1.machineOverridableSettings.properties), configurationRegistry_1.resourceSettings.properties), patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: true, allowTrailingCommas: true, allowComments: true };
                    jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, workspaceSettingsSchema);
                    jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, folderSettingsSchema);
                }
                else {
                    jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, workspaceSettingsSchema);
                    jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, workspaceSettingsSchema);
                }
            }
        }
        onLocalUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateLocalUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 1 /* USER */);
        }
        onRemoteUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateRemoteUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 1 /* USER */);
        }
        async onWorkspaceConfigurationChanged() {
            if (this.workspace && this.workspace.configuration) {
                let newFolders = workspace_1.toWorkspaceFolders(this.workspaceConfiguration.getFolders(), this.workspace.configuration);
                const { added, removed, changed } = this.compareFolders(this.workspace.folders, newFolders);
                /* If changed validate new folders */
                if (added.length || removed.length || changed.length) {
                    newFolders = await this.toValidWorkspaceFolders(newFolders);
                }
                /* Otherwise use existing */
                else {
                    newFolders = this.workspace.folders;
                }
                await this.updateWorkspaceConfiguration(newFolders, this.workspaceConfiguration.getConfiguration());
            }
        }
        async updateWorkspaceConfiguration(workspaceFolders, configuration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateWorkspaceConfiguration(configuration);
            const changes = this.compareFolders(this.workspace.folders, workspaceFolders);
            if (changes.added.length || changes.removed.length || changes.changed.length) {
                this.workspace.folders = workspaceFolders;
                const change = await this.onFoldersChanged();
                this.triggerConfigurationChange(change, previous, 5 /* WORKSPACE_FOLDER */);
                this._onDidChangeWorkspaceFolders.fire(changes);
            }
            else {
                this.triggerConfigurationChange(change, previous, 4 /* WORKSPACE */);
            }
        }
        onWorkspaceFolderConfigurationChanged(folder, key) {
            return this.loadFolderConfigurations([folder])
                .then(([folderConfiguration]) => {
                const previous = { data: this._configuration.toData(), workspace: this.workspace };
                const folderConfiguraitonChange = this._configuration.compareAndUpdateFolderConfiguration(folder.uri, folderConfiguration);
                if (this.getWorkbenchState() === 2 /* FOLDER */) {
                    const workspaceConfigurationChange = this._configuration.compareAndUpdateWorkspaceConfiguration(folderConfiguration);
                    this.triggerConfigurationChange(configurationModels_1.mergeChanges(folderConfiguraitonChange, workspaceConfigurationChange), previous, 4 /* WORKSPACE */);
                }
                else {
                    this.triggerConfigurationChange(folderConfiguraitonChange, previous, 5 /* WORKSPACE_FOLDER */);
                }
            });
        }
        async onFoldersChanged() {
            const changes = [];
            // Remove the configurations of deleted folders
            for (const key of this.cachedFolderConfigs.keys()) {
                if (!this.workspace.folders.filter(folder => folder.uri.toString() === key.toString())[0]) {
                    const folderConfiguration = this.cachedFolderConfigs.get(key);
                    folderConfiguration.dispose();
                    this.cachedFolderConfigs.delete(key);
                    changes.push(this._configuration.compareAndDeleteFolderConfiguration(key));
                }
            }
            const toInitialize = this.workspace.folders.filter(folder => !this.cachedFolderConfigs.has(folder.uri));
            if (toInitialize.length) {
                const folderConfigurations = await this.loadFolderConfigurations(toInitialize);
                folderConfigurations.forEach((folderConfiguration, index) => {
                    changes.push(this._configuration.compareAndUpdateFolderConfiguration(toInitialize[index].uri, folderConfiguration));
                });
            }
            return configurationModels_1.mergeChanges(...changes);
        }
        loadFolderConfigurations(folders) {
            return Promise.all([...folders.map(folder => {
                    let folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    if (!folderConfiguration) {
                        folderConfiguration = new configuration_3.FolderConfiguration(folder, configuration_2.FOLDER_CONFIG_FOLDER_NAME, this.getWorkbenchState(), this.fileService, this.configurationCache);
                        this._register(folderConfiguration.onDidChange(() => this.onWorkspaceFolderConfigurationChanged(folder)));
                        this.cachedFolderConfigs.set(folder.uri, this._register(folderConfiguration));
                    }
                    return folderConfiguration.loadConfiguration();
                })]);
        }
        async validateWorkspaceFoldersAndReload() {
            const validWorkspaceFolders = await this.toValidWorkspaceFolders(this.workspace.folders);
            const { removed } = this.compareFolders(this.workspace.folders, validWorkspaceFolders);
            if (removed.length) {
                await this.updateWorkspaceConfiguration(validWorkspaceFolders, this.workspaceConfiguration.getConfiguration());
            }
        }
        async toValidWorkspaceFolders(workspaceFolders) {
            const validWorkspaceFolders = [];
            for (const workspaceFolder of workspaceFolders) {
                try {
                    const result = await this.fileService.resolve(workspaceFolder.uri);
                    if (!result.isDirectory) {
                        continue;
                    }
                }
                catch (e) { /* Ignore */ }
                validWorkspaceFolders.push(workspaceFolder);
            }
            return validWorkspaceFolders;
        }
        writeConfigurationValue(key, value, target, overrides, donotNotifyError) {
            if (target === 6 /* DEFAULT */) {
                return Promise.reject(new Error('Invalid configuration target'));
            }
            if (target === 7 /* MEMORY */) {
                const previous = { data: this._configuration.toData(), workspace: this.workspace };
                this._configuration.updateValue(key, value, overrides);
                this.triggerConfigurationChange({ keys: (overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifier) ? [configuration_1.keyFromOverrideIdentifier(overrides.overrideIdentifier), key] : [key], overrides: (overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifier) ? [[overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifier, [key]]] : [] }, previous, target);
                return Promise.resolve(undefined);
            }
            const editableConfigurationTarget = this.toEditableConfigurationTarget(target, key);
            if (!editableConfigurationTarget) {
                return Promise.reject(new Error('Invalid configuration target'));
            }
            if (editableConfigurationTarget === 2 /* USER_REMOTE */ && !this.remoteUserConfiguration) {
                return Promise.reject(new Error('Invalid configuration target'));
            }
            return this.configurationEditingService.writeConfiguration(editableConfigurationTarget, { key, value }, { scopes: overrides, donotNotifyError })
                .then(() => {
                switch (editableConfigurationTarget) {
                    case 1 /* USER_LOCAL */:
                        return this.reloadLocalUserConfiguration().then(local => this.onLocalUserConfigurationChanged(local));
                    case 2 /* USER_REMOTE */:
                        return this.reloadRemoeUserConfiguration().then(remote => this.onRemoteUserConfigurationChanged(remote));
                    case 3 /* WORKSPACE */:
                        return this.reloadWorkspaceConfiguration();
                    case 4 /* WORKSPACE_FOLDER */:
                        const workspaceFolder = overrides && overrides.resource ? this.workspace.getFolder(overrides.resource) : null;
                        if (workspaceFolder) {
                            return this.reloadWorkspaceFolderConfiguration(workspaceFolder, key);
                        }
                }
                return Promise.resolve();
            });
        }
        deriveConfigurationTarget(key, value, overrides, target) {
            if (target) {
                return target;
            }
            if (value === undefined) {
                // Ignore. But expected is to remove the value from all targets
                return undefined;
            }
            const inspect = this.inspect(key, overrides);
            if (objects_1.equals(value, inspect.value)) {
                // No change. So ignore.
                return undefined;
            }
            if (inspect.workspaceFolderValue !== undefined) {
                return 5 /* WORKSPACE_FOLDER */;
            }
            if (inspect.workspaceValue !== undefined) {
                return 4 /* WORKSPACE */;
            }
            return 1 /* USER */;
        }
        triggerConfigurationChange(change, previous, target) {
            if (change.keys.length) {
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this.workspace);
                configurationChangeEvent.source = target;
                configurationChangeEvent.sourceConfig = this.getTargetConfiguration(target);
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
        }
        getTargetConfiguration(target) {
            switch (target) {
                case 6 /* DEFAULT */:
                    return this._configuration.defaults.contents;
                case 1 /* USER */:
                    return this._configuration.userConfiguration.contents;
                case 4 /* WORKSPACE */:
                    return this._configuration.workspaceConfiguration.contents;
            }
            return {};
        }
        toEditableConfigurationTarget(target, key) {
            if (target === 1 /* USER */) {
                if (this.inspect(key).userRemoteValue !== undefined) {
                    return 2 /* USER_REMOTE */;
                }
                return 1 /* USER_LOCAL */;
            }
            if (target === 2 /* USER_LOCAL */) {
                return 1 /* USER_LOCAL */;
            }
            if (target === 3 /* USER_REMOTE */) {
                return 2 /* USER_REMOTE */;
            }
            if (target === 4 /* WORKSPACE */) {
                return 3 /* WORKSPACE */;
            }
            if (target === 5 /* WORKSPACE_FOLDER */) {
                return 4 /* WORKSPACE_FOLDER */;
            }
            return null;
        }
    }
    exports.WorkspaceService = WorkspaceService;
});
//# __sourceMappingURL=configurationService.js.map