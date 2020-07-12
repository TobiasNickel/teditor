/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/files/common/files", "vs/platform/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/base/common/path", "vs/base/common/objects", "vs/base/common/network", "vs/base/common/hash"], function (require, exports, resources, event_1, errors, lifecycle_1, async_1, files_1, configurationModels_1, configurationModels_2, configuration_1, path_1, objects_1, network_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FolderConfiguration = exports.WorkspaceConfiguration = exports.RemoteUserConfiguration = exports.UserConfiguration = void 0;
    class UserConfiguration extends lifecycle_1.Disposable {
        constructor(userSettingsResource, scopes, fileService) {
            super();
            this.userSettingsResource = userSettingsResource;
            this.scopes = scopes;
            this.fileService = fileService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.userConfiguration = this._register(new lifecycle_1.MutableDisposable());
            this.userConfiguration.value = new configurationModels_1.UserSettings(this.userSettingsResource, this.scopes, this.fileService);
            this._register(this.userConfiguration.value.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
        }
        get hasTasksLoaded() { return this.userConfiguration.value instanceof FileServiceBasedConfiguration; }
        async initialize() {
            return this.userConfiguration.value.loadConfiguration();
        }
        async reload() {
            if (this.hasTasksLoaded) {
                return this.userConfiguration.value.loadConfiguration();
            }
            const folder = resources.dirname(this.userSettingsResource);
            const standAloneConfigurationResources = [configuration_1.TASKS_CONFIGURATION_KEY].map(name => ([name, resources.joinPath(folder, `${name}.json`)]));
            const fileServiceBasedConfiguration = new FileServiceBasedConfiguration(folder.toString(), [this.userSettingsResource], standAloneConfigurationResources, this.scopes, this.fileService);
            const configurationModel = await fileServiceBasedConfiguration.loadConfiguration();
            this.userConfiguration.value = fileServiceBasedConfiguration;
            // Check for value because userConfiguration might have been disposed.
            if (this.userConfiguration.value) {
                this._register(this.userConfiguration.value.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
            }
            return configurationModel;
        }
        reprocess() {
            return this.userConfiguration.value.reprocess();
        }
    }
    exports.UserConfiguration = UserConfiguration;
    class FileServiceBasedConfiguration extends lifecycle_1.Disposable {
        constructor(name, settingsResources, standAloneConfigurationResources, scopes, fileService) {
            super();
            this.settingsResources = settingsResources;
            this.standAloneConfigurationResources = standAloneConfigurationResources;
            this.scopes = scopes;
            this.fileService = fileService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.allResources = [...this.settingsResources, ...this.standAloneConfigurationResources.map(([, resource]) => resource)];
            this._folderSettingsModelParser = new configurationModels_1.ConfigurationModelParser(name, this.scopes);
            this._standAloneConfigurations = [];
            this._cache = new configurationModels_1.ConfigurationModel();
            this.changeEventTriggerScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChange.fire(), 50));
            this._register(this.fileService.onDidFilesChange((e) => this.handleFileEvents(e)));
        }
        async loadConfiguration() {
            const resolveContents = async (resources) => {
                return Promise.all(resources.map(async (resource) => {
                    try {
                        const content = await this.fileService.readFile(resource);
                        return content.value.toString();
                    }
                    catch (error) {
                        if (error.fileOperationResult !== 1 /* FILE_NOT_FOUND */
                            && error.fileOperationResult !== 10 /* FILE_NOT_DIRECTORY */) {
                            errors.onUnexpectedError(error);
                        }
                    }
                    return '{}';
                }));
            };
            const [settingsContents, standAloneConfigurationContents] = await Promise.all([
                resolveContents(this.settingsResources),
                resolveContents(this.standAloneConfigurationResources.map(([, resource]) => resource)),
            ]);
            // reset
            this._standAloneConfigurations = [];
            this._folderSettingsModelParser.parseContent('');
            // parse
            if (settingsContents[0] !== undefined) {
                this._folderSettingsModelParser.parseContent(settingsContents[0]);
            }
            for (let index = 0; index < standAloneConfigurationContents.length; index++) {
                const contents = standAloneConfigurationContents[index];
                if (contents !== undefined) {
                    const standAloneConfigurationModelParser = new configurationModels_2.StandaloneConfigurationModelParser(this.standAloneConfigurationResources[index][1].toString(), this.standAloneConfigurationResources[index][0]);
                    standAloneConfigurationModelParser.parseContent(contents);
                    this._standAloneConfigurations.push(standAloneConfigurationModelParser.configurationModel);
                }
            }
            // Consolidate (support *.json files in the workspace settings folder)
            this.consolidate();
            return this._cache;
        }
        reprocess() {
            const oldContents = this._folderSettingsModelParser.configurationModel.contents;
            this._folderSettingsModelParser.parse();
            if (!objects_1.equals(oldContents, this._folderSettingsModelParser.configurationModel.contents)) {
                this.consolidate();
            }
            return this._cache;
        }
        consolidate() {
            this._cache = this._folderSettingsModelParser.configurationModel.merge(...this._standAloneConfigurations);
        }
        async handleFileEvents(event) {
            const isAffectedByChanges = () => {
                // One of the resources has changed
                if (this.allResources.some(resource => event.contains(resource))) {
                    return true;
                }
                // One of the resource's parent got deleted
                if (this.allResources.some(resource => event.contains(resources.dirname(resource), 2 /* DELETED */))) {
                    return true;
                }
                return false;
            };
            if (isAffectedByChanges()) {
                this.changeEventTriggerScheduler.schedule();
            }
        }
    }
    class RemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(remoteAuthority, configurationCache, fileService, remoteAgentService) {
            super();
            this._userConfigurationInitializationPromise = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._fileService = fileService;
            this._userConfiguration = this._cachedConfiguration = new CachedRemoteUserConfiguration(remoteAuthority, configurationCache);
            remoteAgentService.getEnvironment().then(async (environment) => {
                if (environment) {
                    const userConfiguration = this._register(new FileServiceBasedRemoteUserConfiguration(environment.settingsPath, configuration_1.REMOTE_MACHINE_SCOPES, this._fileService));
                    this._register(userConfiguration.onDidChangeConfiguration(configurationModel => this.onDidUserConfigurationChange(configurationModel)));
                    this._userConfigurationInitializationPromise = userConfiguration.initialize();
                    const configurationModel = await this._userConfigurationInitializationPromise;
                    this._userConfiguration.dispose();
                    this._userConfiguration = userConfiguration;
                    this.onDidUserConfigurationChange(configurationModel);
                }
            });
        }
        async initialize() {
            if (this._userConfiguration instanceof FileServiceBasedRemoteUserConfiguration) {
                return this._userConfiguration.initialize();
            }
            // Initialize cached configuration
            let configurationModel = await this._userConfiguration.initialize();
            if (this._userConfigurationInitializationPromise) {
                // Use user configuration
                configurationModel = await this._userConfigurationInitializationPromise;
                this._userConfigurationInitializationPromise = null;
            }
            return configurationModel;
        }
        reload() {
            return this._userConfiguration.reload();
        }
        reprocess() {
            return this._userConfiguration.reprocess();
        }
        onDidUserConfigurationChange(configurationModel) {
            this.updateCache(configurationModel);
            this._onDidChangeConfiguration.fire(configurationModel);
        }
        updateCache(configurationModel) {
            return this._cachedConfiguration.updateConfiguration(configurationModel);
        }
    }
    exports.RemoteUserConfiguration = RemoteUserConfiguration;
    class FileServiceBasedRemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(configurationResource, scopes, fileService) {
            super();
            this.configurationResource = configurationResource;
            this.scopes = scopes;
            this.fileService = fileService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.fileWatcherDisposable = lifecycle_1.Disposable.None;
            this.directoryWatcherDisposable = lifecycle_1.Disposable.None;
            this.parser = new configurationModels_1.ConfigurationModelParser(this.configurationResource.toString(), this.scopes);
            this._register(fileService.onDidFilesChange(e => this.handleFileEvents(e)));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
            this._register(lifecycle_1.toDisposable(() => {
                this.stopWatchingResource();
                this.stopWatchingDirectory();
            }));
        }
        watchResource() {
            this.fileWatcherDisposable = this.fileService.watch(this.configurationResource);
        }
        stopWatchingResource() {
            this.fileWatcherDisposable.dispose();
            this.fileWatcherDisposable = lifecycle_1.Disposable.None;
        }
        watchDirectory() {
            const directory = resources.dirname(this.configurationResource);
            this.directoryWatcherDisposable = this.fileService.watch(directory);
        }
        stopWatchingDirectory() {
            this.directoryWatcherDisposable.dispose();
            this.directoryWatcherDisposable = lifecycle_1.Disposable.None;
        }
        async initialize() {
            const exists = await this.fileService.exists(this.configurationResource);
            this.onResourceExists(exists);
            return this.reload();
        }
        async reload() {
            try {
                const content = await this.fileService.readFile(this.configurationResource);
                this.parser.parseContent(content.value.toString());
                return this.parser.configurationModel;
            }
            catch (e) {
                return new configurationModels_1.ConfigurationModel();
            }
        }
        reprocess() {
            this.parser.parse();
            return this.parser.configurationModel;
        }
        async handleFileEvents(event) {
            const events = event.changes;
            let affectedByChanges = false;
            // Find changes that affect the resource
            for (const event of events) {
                affectedByChanges = resources.isEqual(this.configurationResource, event.resource);
                if (affectedByChanges) {
                    if (event.type === 1 /* ADDED */) {
                        this.onResourceExists(true);
                    }
                    else if (event.type === 2 /* DELETED */) {
                        this.onResourceExists(false);
                    }
                    break;
                }
            }
            if (affectedByChanges) {
                this.reloadConfigurationScheduler.schedule();
            }
        }
        onResourceExists(exists) {
            if (exists) {
                this.stopWatchingDirectory();
                this.watchResource();
            }
            else {
                this.stopWatchingResource();
                this.watchDirectory();
            }
        }
    }
    class CachedRemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(remoteAuthority, configurationCache) {
            super();
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.key = { type: 'user', key: remoteAuthority };
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        getConfigurationModel() {
            return this.configurationModel;
        }
        initialize() {
            return this.reload();
        }
        reprocess() {
            return this.configurationModel;
        }
        async reload() {
            const content = await this.configurationCache.read(this.key);
            try {
                const parsed = JSON.parse(content);
                this.configurationModel = new configurationModels_1.ConfigurationModel(parsed.contents, parsed.keys, parsed.overrides);
            }
            catch (e) {
            }
            return this.configurationModel;
        }
        updateConfiguration(configurationModel) {
            if (configurationModel.keys.length) {
                return this.configurationCache.write(this.key, JSON.stringify(configurationModel.toJSON()));
            }
            else {
                return this.configurationCache.remove(this.key);
            }
        }
    }
    class WorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(configurationCache, fileService) {
            super();
            this._workspaceConfigurationChangeDisposable = lifecycle_1.Disposable.None;
            this._workspaceIdentifier = null;
            this._onDidUpdateConfiguration = this._register(new event_1.Emitter());
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this._loaded = false;
            this._fileService = fileService;
            this._workspaceConfiguration = this._cachedConfiguration = new CachedWorkspaceConfiguration(configurationCache);
        }
        get loaded() { return this._loaded; }
        async load(workspaceIdentifier) {
            this._workspaceIdentifier = workspaceIdentifier;
            if (!(this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration)) {
                if (this._workspaceIdentifier.configPath.scheme === network_1.Schemas.file) {
                    this.switch(new FileServiceBasedWorkspaceConfiguration(this._fileService));
                }
                else {
                    this.waitAndSwitch(this._workspaceIdentifier);
                }
            }
            this._loaded = this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration;
            await this._workspaceConfiguration.load(this._workspaceIdentifier);
        }
        reload() {
            return this._workspaceIdentifier ? this.load(this._workspaceIdentifier) : Promise.resolve();
        }
        getFolders() {
            return this._workspaceConfiguration.getFolders();
        }
        setFolders(folders, jsonEditingService) {
            if (this._workspaceIdentifier) {
                return jsonEditingService.write(this._workspaceIdentifier.configPath, [{ path: ['folders'], value: folders }], true)
                    .then(() => this.reload());
            }
            return Promise.resolve();
        }
        getConfiguration() {
            return this._workspaceConfiguration.getWorkspaceSettings();
        }
        reprocessWorkspaceSettings() {
            this._workspaceConfiguration.reprocessWorkspaceSettings();
            return this.getConfiguration();
        }
        async waitAndSwitch(workspaceIdentifier) {
            await files_1.whenProviderRegistered(workspaceIdentifier.configPath, this._fileService);
            if (!(this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration)) {
                const fileServiceBasedWorkspaceConfiguration = this._register(new FileServiceBasedWorkspaceConfiguration(this._fileService));
                await fileServiceBasedWorkspaceConfiguration.load(workspaceIdentifier);
                this.switch(fileServiceBasedWorkspaceConfiguration);
                this._loaded = true;
                this.onDidWorkspaceConfigurationChange(false);
            }
        }
        switch(fileServiceBasedWorkspaceConfiguration) {
            this._workspaceConfiguration.dispose();
            this._workspaceConfigurationChangeDisposable.dispose();
            this._workspaceConfiguration = this._register(fileServiceBasedWorkspaceConfiguration);
            this._workspaceConfigurationChangeDisposable = this._register(this._workspaceConfiguration.onDidChange(e => this.onDidWorkspaceConfigurationChange(true)));
        }
        async onDidWorkspaceConfigurationChange(reload) {
            if (reload) {
                await this.reload();
            }
            this.updateCache();
            this._onDidUpdateConfiguration.fire();
        }
        updateCache() {
            if (this._workspaceIdentifier && this._workspaceIdentifier.configPath.scheme !== network_1.Schemas.file && this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration) {
                return this._workspaceConfiguration.load(this._workspaceIdentifier)
                    .then(() => this._cachedConfiguration.updateWorkspace(this._workspaceIdentifier, this._workspaceConfiguration.getConfigurationModel()));
            }
            return Promise.resolve(undefined);
        }
    }
    exports.WorkspaceConfiguration = WorkspaceConfiguration;
    class FileServiceBasedWorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(fileService) {
            super();
            this.fileService = fileService;
            this._workspaceIdentifier = null;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('');
            this.workspaceSettings = new configurationModels_1.ConfigurationModel();
            this._register(fileService.onDidFilesChange(e => this.handleWorkspaceFileEvents(e)));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChange.fire(), 50));
            this.workspaceConfigWatcher = this._register(this.watchWorkspaceConfigurationFile());
        }
        get workspaceIdentifier() {
            return this._workspaceIdentifier;
        }
        async load(workspaceIdentifier) {
            if (!this._workspaceIdentifier || this._workspaceIdentifier.id !== workspaceIdentifier.id) {
                this._workspaceIdentifier = workspaceIdentifier;
                this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(this._workspaceIdentifier.id);
                lifecycle_1.dispose(this.workspaceConfigWatcher);
                this.workspaceConfigWatcher = this._register(this.watchWorkspaceConfigurationFile());
            }
            let contents = '';
            try {
                const content = await this.fileService.readFile(this._workspaceIdentifier.configPath);
                contents = content.value.toString();
            }
            catch (error) {
                const exists = await this.fileService.exists(this._workspaceIdentifier.configPath);
                if (exists) {
                    errors.onUnexpectedError(error);
                }
            }
            this.workspaceConfigurationModelParser.parseContent(contents);
            this.consolidate();
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reprocessWorkspaceSettings() {
            this.workspaceConfigurationModelParser.reprocessWorkspaceSettings();
            this.consolidate();
            return this.getWorkspaceSettings();
        }
        consolidate() {
            this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel, this.workspaceConfigurationModelParser.tasksModel);
        }
        watchWorkspaceConfigurationFile() {
            return this._workspaceIdentifier ? this.fileService.watch(this._workspaceIdentifier.configPath) : lifecycle_1.Disposable.None;
        }
        handleWorkspaceFileEvents(event) {
            if (this._workspaceIdentifier) {
                const events = event.changes;
                let affectedByChanges = false;
                // Find changes that affect workspace file
                for (let i = 0, len = events.length; i < len && !affectedByChanges; i++) {
                    affectedByChanges = resources.isEqual(this._workspaceIdentifier.configPath, events[i].resource);
                }
                if (affectedByChanges) {
                    this.reloadConfigurationScheduler.schedule();
                }
            }
        }
    }
    class CachedWorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(configurationCache) {
            super();
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('');
            this.workspaceSettings = new configurationModels_1.ConfigurationModel();
        }
        async load(workspaceIdentifier) {
            try {
                const key = this.getKey(workspaceIdentifier);
                const contents = await this.configurationCache.read(key);
                this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(key.key);
                this.workspaceConfigurationModelParser.parseContent(contents);
                this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel, this.workspaceConfigurationModelParser.tasksModel);
            }
            catch (e) {
            }
        }
        get workspaceIdentifier() {
            return null;
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reprocessWorkspaceSettings() {
            return this.workspaceSettings;
        }
        async updateWorkspace(workspaceIdentifier, configurationModel) {
            try {
                const key = this.getKey(workspaceIdentifier);
                if (configurationModel.keys.length) {
                    await this.configurationCache.write(key, JSON.stringify(configurationModel.toJSON().contents));
                }
                else {
                    await this.configurationCache.remove(key);
                }
            }
            catch (error) {
            }
        }
        getKey(workspaceIdentifier) {
            return {
                type: 'workspaces',
                key: workspaceIdentifier.id
            };
        }
    }
    class CachedFolderConfiguration extends lifecycle_1.Disposable {
        constructor(folder, configFolderRelativePath, configurationCache) {
            super();
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.key = { type: 'folder', key: hash_1.hash(path_1.join(folder.path, configFolderRelativePath)).toString(16) };
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        async loadConfiguration() {
            try {
                const contents = await this.configurationCache.read(this.key);
                const parsed = JSON.parse(contents.toString());
                this.configurationModel = new configurationModels_1.ConfigurationModel(parsed.contents, parsed.keys, parsed.overrides);
            }
            catch (e) {
            }
            return this.configurationModel;
        }
        async updateConfiguration(configurationModel) {
            if (configurationModel.keys.length) {
                await this.configurationCache.write(this.key, JSON.stringify(configurationModel.toJSON()));
            }
            else {
                await this.configurationCache.remove(this.key);
            }
        }
        reprocess() {
            return this.configurationModel;
        }
        getUnsupportedKeys() {
            return [];
        }
    }
    class FolderConfiguration extends lifecycle_1.Disposable {
        constructor(workspaceFolder, configFolderRelativePath, workbenchState, fileService, configurationCache) {
            super();
            this.workspaceFolder = workspaceFolder;
            this.workbenchState = workbenchState;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.folderConfigurationDisposable = lifecycle_1.Disposable.None;
            this.configurationFolder = resources.joinPath(workspaceFolder.uri, configFolderRelativePath);
            this.folderConfiguration = this.cachedFolderConfiguration = new CachedFolderConfiguration(workspaceFolder.uri, configFolderRelativePath, configurationCache);
            if (workspaceFolder.uri.scheme === network_1.Schemas.file) {
                this.folderConfiguration = this.createFileServiceBasedConfiguration(fileService);
                this.folderConfigurationDisposable = this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
            }
            else {
                files_1.whenProviderRegistered(workspaceFolder.uri, fileService)
                    .then(() => {
                    this.folderConfiguration.dispose();
                    this.folderConfigurationDisposable.dispose();
                    this.folderConfiguration = this.createFileServiceBasedConfiguration(fileService);
                    this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
                    this.onDidFolderConfigurationChange();
                });
            }
        }
        loadConfiguration() {
            return this.folderConfiguration.loadConfiguration();
        }
        reprocess() {
            return this.folderConfiguration.reprocess();
        }
        onDidFolderConfigurationChange() {
            this.updateCache();
            this._onDidChange.fire();
        }
        createFileServiceBasedConfiguration(fileService) {
            const settingsResources = [resources.joinPath(this.configurationFolder, `${configuration_1.FOLDER_SETTINGS_NAME}.json`)];
            const standAloneConfigurationResources = [configuration_1.TASKS_CONFIGURATION_KEY, configuration_1.LAUNCH_CONFIGURATION_KEY].map(name => ([name, resources.joinPath(this.configurationFolder, `${name}.json`)]));
            return new FileServiceBasedConfiguration(this.configurationFolder.toString(), settingsResources, standAloneConfigurationResources, 3 /* WORKSPACE */ === this.workbenchState ? configuration_1.FOLDER_SCOPES : configuration_1.WORKSPACE_SCOPES, fileService);
        }
        updateCache() {
            if (this.configurationFolder.scheme !== network_1.Schemas.file && this.folderConfiguration instanceof FileServiceBasedConfiguration) {
                return this.folderConfiguration.loadConfiguration()
                    .then(configurationModel => this.cachedFolderConfiguration.updateConfiguration(configurationModel));
            }
            return Promise.resolve(undefined);
        }
    }
    exports.FolderConfiguration = FolderConfiguration;
});
//# __sourceMappingURL=configuration.js.map