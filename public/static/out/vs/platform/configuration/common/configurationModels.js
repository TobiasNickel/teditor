/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/base/common/map", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/resources"], function (require, exports, json, map_1, arrays, types, objects, uri_1, configurationRegistry_1, configuration_1, platform_1, lifecycle_1, event_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AllKeysConfigurationChangeEvent = exports.ConfigurationChangeEvent = exports.mergeChanges = exports.Configuration = exports.UserSettings = exports.ConfigurationModelParser = exports.DefaultConfigurationModel = exports.ConfigurationModel = void 0;
    class ConfigurationModel {
        constructor(_contents = {}, _keys = [], _overrides = []) {
            this._contents = _contents;
            this._keys = _keys;
            this._overrides = _overrides;
            this.isFrozen = false;
        }
        get contents() {
            return this.checkAndFreeze(this._contents);
        }
        get overrides() {
            return this.checkAndFreeze(this._overrides);
        }
        get keys() {
            return this.checkAndFreeze(this._keys);
        }
        isEmpty() {
            return this._keys.length === 0 && Object.keys(this._contents).length === 0 && this._overrides.length === 0;
        }
        getValue(section) {
            return section ? configuration_1.getConfigurationValue(this.contents, section) : this.contents;
        }
        getOverrideValue(section, overrideIdentifier) {
            const overrideContents = this.getContentsForOverrideIdentifer(overrideIdentifier);
            return overrideContents
                ? section ? configuration_1.getConfigurationValue(overrideContents, section) : overrideContents
                : undefined;
        }
        getKeysForOverrideIdentifier(identifier) {
            for (const override of this.overrides) {
                if (override.identifiers.indexOf(identifier) !== -1) {
                    return override.keys;
                }
            }
            return [];
        }
        override(identifier) {
            const overrideContents = this.getContentsForOverrideIdentifer(identifier);
            if (!overrideContents || typeof overrideContents !== 'object' || !Object.keys(overrideContents).length) {
                // If there are no valid overrides, return self
                return this;
            }
            let contents = {};
            for (const key of arrays.distinct([...Object.keys(this.contents), ...Object.keys(overrideContents)])) {
                let contentsForKey = this.contents[key];
                let overrideContentsForKey = overrideContents[key];
                // If there are override contents for the key, clone and merge otherwise use base contents
                if (overrideContentsForKey) {
                    // Clone and merge only if base contents and override contents are of type object otherwise just override
                    if (typeof contentsForKey === 'object' && typeof overrideContentsForKey === 'object') {
                        contentsForKey = objects.deepClone(contentsForKey);
                        this.mergeContents(contentsForKey, overrideContentsForKey);
                    }
                    else {
                        contentsForKey = overrideContentsForKey;
                    }
                }
                contents[key] = contentsForKey;
            }
            return new ConfigurationModel(contents, this.keys, this.overrides);
        }
        merge(...others) {
            const contents = objects.deepClone(this.contents);
            const overrides = objects.deepClone(this.overrides);
            const keys = [...this.keys];
            for (const other of others) {
                this.mergeContents(contents, other.contents);
                for (const otherOverride of other.overrides) {
                    const [override] = overrides.filter(o => arrays.equals(o.identifiers, otherOverride.identifiers));
                    if (override) {
                        this.mergeContents(override.contents, otherOverride.contents);
                    }
                    else {
                        overrides.push(objects.deepClone(otherOverride));
                    }
                }
                for (const key of other.keys) {
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                    }
                }
            }
            return new ConfigurationModel(contents, keys, overrides);
        }
        freeze() {
            this.isFrozen = true;
            return this;
        }
        mergeContents(source, target) {
            for (const key of Object.keys(target)) {
                if (key in source) {
                    if (types.isObject(source[key]) && types.isObject(target[key])) {
                        this.mergeContents(source[key], target[key]);
                        continue;
                    }
                }
                source[key] = objects.deepClone(target[key]);
            }
        }
        checkAndFreeze(data) {
            if (this.isFrozen && !Object.isFrozen(data)) {
                return objects.deepFreeze(data);
            }
            return data;
        }
        getContentsForOverrideIdentifer(identifier) {
            for (const override of this.overrides) {
                if (override.identifiers.indexOf(identifier) !== -1) {
                    return override.contents;
                }
            }
            return null;
        }
        toJSON() {
            return {
                contents: this.contents,
                overrides: this.overrides,
                keys: this.keys
            };
        }
        // Update methods
        setValue(key, value) {
            this.addKey(key);
            configuration_1.addToValueTree(this.contents, key, value, e => { throw new Error(e); });
        }
        removeValue(key) {
            if (this.removeKey(key)) {
                configuration_1.removeFromValueTree(this.contents, key);
            }
        }
        addKey(key) {
            let index = this.keys.length;
            for (let i = 0; i < index; i++) {
                if (key.indexOf(this.keys[i]) === 0) {
                    index = i;
                }
            }
            this.keys.splice(index, 1, key);
        }
        removeKey(key) {
            let index = this.keys.indexOf(key);
            if (index !== -1) {
                this.keys.splice(index, 1);
                return true;
            }
            return false;
        }
    }
    exports.ConfigurationModel = ConfigurationModel;
    class DefaultConfigurationModel extends ConfigurationModel {
        constructor() {
            const contents = configuration_1.getDefaultValues();
            const keys = configuration_1.getConfigurationKeys();
            const overrides = [];
            for (const key of Object.keys(contents)) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key)) {
                    overrides.push({
                        identifiers: [configuration_1.overrideIdentifierFromKey(key).trim()],
                        keys: Object.keys(contents[key]),
                        contents: configuration_1.toValuesTree(contents[key], message => console.error(`Conflict in default settings file: ${message}`)),
                    });
                }
            }
            super(contents, keys, overrides);
        }
    }
    exports.DefaultConfigurationModel = DefaultConfigurationModel;
    class ConfigurationModelParser {
        constructor(_name, _scopes) {
            this._name = _name;
            this._scopes = _scopes;
            this._raw = null;
            this._configurationModel = null;
            this._parseErrors = [];
        }
        get configurationModel() {
            return this._configurationModel || new ConfigurationModel();
        }
        get errors() {
            return this._parseErrors;
        }
        parseContent(content) {
            if (!types.isUndefinedOrNull(content)) {
                const raw = this.doParseContent(content);
                this.parseRaw(raw);
            }
        }
        parseRaw(raw) {
            this._raw = raw;
            const configurationModel = this.doParseRaw(raw);
            this._configurationModel = new ConfigurationModel(configurationModel.contents, configurationModel.keys, configurationModel.overrides);
        }
        parse() {
            if (this._raw) {
                this.parseRaw(this._raw);
            }
        }
        doParseContent(content) {
            let raw = {};
            let currentProperty = null;
            let currentParent = [];
            let previousParents = [];
            let parseErrors = [];
            function onValue(value) {
                if (Array.isArray(currentParent)) {
                    currentParent.push(value);
                }
                else if (currentProperty) {
                    currentParent[currentProperty] = value;
                }
            }
            let visitor = {
                onObjectBegin: () => {
                    let object = {};
                    onValue(object);
                    previousParents.push(currentParent);
                    currentParent = object;
                    currentProperty = null;
                },
                onObjectProperty: (name) => {
                    currentProperty = name;
                },
                onObjectEnd: () => {
                    currentParent = previousParents.pop();
                },
                onArrayBegin: () => {
                    let array = [];
                    onValue(array);
                    previousParents.push(currentParent);
                    currentParent = array;
                    currentProperty = null;
                },
                onArrayEnd: () => {
                    currentParent = previousParents.pop();
                },
                onLiteralValue: onValue,
                onError: (error, offset, length) => {
                    parseErrors.push({ error, offset, length });
                }
            };
            if (content) {
                try {
                    json.visit(content, visitor);
                    raw = currentParent[0] || {};
                }
                catch (e) {
                    console.error(`Error while parsing settings file ${this._name}: ${e}`);
                    this._parseErrors = [e];
                }
            }
            return raw;
        }
        doParseRaw(raw) {
            if (this._scopes) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                raw = this.filterByScope(raw, configurationProperties, true, this._scopes);
            }
            const contents = configuration_1.toValuesTree(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const keys = Object.keys(raw);
            const overrides = configuration_1.toOverrides(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            return { contents, keys, overrides };
        }
        filterByScope(properties, configurationProperties, filterOverriddenProperties, scopes) {
            const result = {};
            for (let key in properties) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key) && filterOverriddenProperties) {
                    result[key] = this.filterByScope(properties[key], configurationProperties, false, scopes);
                }
                else {
                    const scope = this.getScope(key, configurationProperties);
                    // Load unregistered configurations always.
                    if (scope === undefined || scopes.indexOf(scope) !== -1) {
                        result[key] = properties[key];
                    }
                }
            }
            return result;
        }
        getScope(key, configurationProperties) {
            const propertySchema = configurationProperties[key];
            return propertySchema ? typeof propertySchema.scope !== 'undefined' ? propertySchema.scope : 3 /* WINDOW */ : undefined;
        }
    }
    exports.ConfigurationModelParser = ConfigurationModelParser;
    class UserSettings extends lifecycle_1.Disposable {
        constructor(userSettingsResource, scopes, fileService) {
            super();
            this.userSettingsResource = userSettingsResource;
            this.scopes = scopes;
            this.fileService = fileService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.parser = new ConfigurationModelParser(this.userSettingsResource.toString(), this.scopes);
            this._register(this.fileService.watch(resources_1.dirname(this.userSettingsResource)));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.userSettingsResource))(() => this._onDidChange.fire()));
        }
        async loadConfiguration() {
            try {
                const content = await this.fileService.readFile(this.userSettingsResource);
                this.parser.parseContent(content.value.toString() || '{}');
                return this.parser.configurationModel;
            }
            catch (e) {
                return new ConfigurationModel();
            }
        }
        reprocess() {
            this.parser.parse();
            return this.parser.configurationModel;
        }
    }
    exports.UserSettings = UserSettings;
    class Configuration {
        constructor(_defaultConfiguration, _localUserConfiguration, _remoteUserConfiguration = new ConfigurationModel(), _workspaceConfiguration = new ConfigurationModel(), _folderConfigurations = new map_1.ResourceMap(), _memoryConfiguration = new ConfigurationModel(), _memoryConfigurationByResource = new map_1.ResourceMap(), _freeze = true) {
            this._defaultConfiguration = _defaultConfiguration;
            this._localUserConfiguration = _localUserConfiguration;
            this._remoteUserConfiguration = _remoteUserConfiguration;
            this._workspaceConfiguration = _workspaceConfiguration;
            this._folderConfigurations = _folderConfigurations;
            this._memoryConfiguration = _memoryConfiguration;
            this._memoryConfigurationByResource = _memoryConfigurationByResource;
            this._freeze = _freeze;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations = new map_1.ResourceMap();
            this._userConfiguration = null;
        }
        getValue(section, overrides, workspace) {
            const consolidateConfigurationModel = this.getConsolidateConfigurationModel(overrides, workspace);
            return consolidateConfigurationModel.getValue(section);
        }
        updateValue(key, value, overrides = {}) {
            let memoryConfiguration;
            if (overrides.resource) {
                memoryConfiguration = this._memoryConfigurationByResource.get(overrides.resource);
                if (!memoryConfiguration) {
                    memoryConfiguration = new ConfigurationModel();
                    this._memoryConfigurationByResource.set(overrides.resource, memoryConfiguration);
                }
            }
            else {
                memoryConfiguration = this._memoryConfiguration;
            }
            if (value === undefined) {
                memoryConfiguration.removeValue(key);
            }
            else {
                memoryConfiguration.setValue(key, value);
            }
            if (!overrides.resource) {
                this._workspaceConsolidatedConfiguration = null;
            }
        }
        inspect(key, overrides, workspace) {
            const consolidateConfigurationModel = this.getConsolidateConfigurationModel(overrides, workspace);
            const folderConfigurationModel = this.getFolderConfigurationModelForResource(overrides.resource, workspace);
            const memoryConfigurationModel = overrides.resource ? this._memoryConfigurationByResource.get(overrides.resource) || this._memoryConfiguration : this._memoryConfiguration;
            const defaultValue = overrides.overrideIdentifier ? this._defaultConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this._defaultConfiguration.freeze().getValue(key);
            const userValue = overrides.overrideIdentifier ? this.userConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this.userConfiguration.freeze().getValue(key);
            const userLocalValue = overrides.overrideIdentifier ? this.localUserConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this.localUserConfiguration.freeze().getValue(key);
            const userRemoteValue = overrides.overrideIdentifier ? this.remoteUserConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this.remoteUserConfiguration.freeze().getValue(key);
            const workspaceValue = workspace ? overrides.overrideIdentifier ? this._workspaceConfiguration.freeze().override(overrides.overrideIdentifier).getValue(key) : this._workspaceConfiguration.freeze().getValue(key) : undefined; //Check on workspace exists or not because _workspaceConfiguration is never null
            const workspaceFolderValue = folderConfigurationModel ? overrides.overrideIdentifier ? folderConfigurationModel.freeze().override(overrides.overrideIdentifier).getValue(key) : folderConfigurationModel.freeze().getValue(key) : undefined;
            const memoryValue = overrides.overrideIdentifier ? memoryConfigurationModel.override(overrides.overrideIdentifier).getValue(key) : memoryConfigurationModel.getValue(key);
            const value = consolidateConfigurationModel.getValue(key);
            const overrideIdentifiers = arrays.distinct(arrays.flatten(consolidateConfigurationModel.overrides.map(override => override.identifiers))).filter(overrideIdentifier => consolidateConfigurationModel.getOverrideValue(key, overrideIdentifier) !== undefined);
            return {
                defaultValue: defaultValue,
                userValue: userValue,
                userLocalValue: userLocalValue,
                userRemoteValue: userRemoteValue,
                workspaceValue: workspaceValue,
                workspaceFolderValue: workspaceFolderValue,
                memoryValue: memoryValue,
                value,
                default: defaultValue !== undefined ? { value: this._defaultConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this._defaultConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                user: userValue !== undefined ? { value: this.userConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this.userConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                userLocal: userLocalValue !== undefined ? { value: this.localUserConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this.localUserConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                userRemote: userRemoteValue !== undefined ? { value: this.remoteUserConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this.remoteUserConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                workspace: workspaceValue !== undefined ? { value: this._workspaceConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this._workspaceConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                workspaceFolder: workspaceFolderValue !== undefined ? { value: folderConfigurationModel === null || folderConfigurationModel === void 0 ? void 0 : folderConfigurationModel.freeze().getValue(key), override: overrides.overrideIdentifier ? folderConfigurationModel === null || folderConfigurationModel === void 0 ? void 0 : folderConfigurationModel.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                memory: memoryValue !== undefined ? { value: memoryConfigurationModel.getValue(key), override: overrides.overrideIdentifier ? memoryConfigurationModel.getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
                overrideIdentifiers: overrideIdentifiers.length ? overrideIdentifiers : undefined
            };
        }
        keys(workspace) {
            const folderConfigurationModel = this.getFolderConfigurationModelForResource(undefined, workspace);
            return {
                default: this._defaultConfiguration.freeze().keys,
                user: this.userConfiguration.freeze().keys,
                workspace: this._workspaceConfiguration.freeze().keys,
                workspaceFolder: folderConfigurationModel ? folderConfigurationModel.freeze().keys : []
            };
        }
        updateDefaultConfiguration(defaultConfiguration) {
            this._defaultConfiguration = defaultConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateLocalUserConfiguration(localUserConfiguration) {
            this._localUserConfiguration = localUserConfiguration;
            this._userConfiguration = null;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateRemoteUserConfiguration(remoteUserConfiguration) {
            this._remoteUserConfiguration = remoteUserConfiguration;
            this._userConfiguration = null;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateWorkspaceConfiguration(workspaceConfiguration) {
            this._workspaceConfiguration = workspaceConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateFolderConfiguration(resource, configuration) {
            this._folderConfigurations.set(resource, configuration);
            this._foldersConsolidatedConfigurations.delete(resource);
        }
        deleteFolderConfiguration(resource) {
            this.folderConfigurations.delete(resource);
            this._foldersConsolidatedConfigurations.delete(resource);
        }
        compareAndUpdateDefaultConfiguration(defaults, keys) {
            const overrides = keys
                .filter(key => configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key))
                .map(key => {
                const overrideIdentifier = configuration_1.overrideIdentifierFromKey(key);
                const fromKeys = this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier);
                const toKeys = defaults.getKeysForOverrideIdentifier(overrideIdentifier);
                const keys = [
                    ...toKeys.filter(key => fromKeys.indexOf(key) === -1),
                    ...fromKeys.filter(key => toKeys.indexOf(key) === -1),
                    ...fromKeys.filter(key => !objects.equals(this._defaultConfiguration.override(overrideIdentifier).getValue(key), defaults.override(overrideIdentifier).getValue(key)))
                ];
                return [overrideIdentifier, keys];
            });
            this.updateDefaultConfiguration(defaults);
            return { keys, overrides };
        }
        compareAndUpdateLocalUserConfiguration(user) {
            const { added, updated, removed, overrides } = configuration_1.compare(this.localUserConfiguration, user);
            const keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateLocalUserConfiguration(user);
            }
            return { keys, overrides };
        }
        compareAndUpdateRemoteUserConfiguration(user) {
            const { added, updated, removed, overrides } = configuration_1.compare(this.remoteUserConfiguration, user);
            let keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateRemoteUserConfiguration(user);
            }
            return { keys, overrides };
        }
        compareAndUpdateWorkspaceConfiguration(workspaceConfiguration) {
            const { added, updated, removed, overrides } = configuration_1.compare(this.workspaceConfiguration, workspaceConfiguration);
            let keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateWorkspaceConfiguration(workspaceConfiguration);
            }
            return { keys, overrides };
        }
        compareAndUpdateFolderConfiguration(resource, folderConfiguration) {
            const currentFolderConfiguration = this.folderConfigurations.get(resource);
            const { added, updated, removed, overrides } = configuration_1.compare(currentFolderConfiguration, folderConfiguration);
            let keys = [...added, ...updated, ...removed];
            if (keys.length || !currentFolderConfiguration) {
                this.updateFolderConfiguration(resource, folderConfiguration);
            }
            return { keys, overrides };
        }
        compareAndDeleteFolderConfiguration(folder) {
            const folderConfig = this.folderConfigurations.get(folder);
            if (!folderConfig) {
                throw new Error('Unknown folder');
            }
            this.deleteFolderConfiguration(folder);
            const { added, updated, removed, overrides } = configuration_1.compare(folderConfig, undefined);
            return { keys: [...added, ...updated, ...removed], overrides };
        }
        get defaults() {
            return this._defaultConfiguration;
        }
        get userConfiguration() {
            if (!this._userConfiguration) {
                this._userConfiguration = this._remoteUserConfiguration.isEmpty() ? this._localUserConfiguration : this._localUserConfiguration.merge(this._remoteUserConfiguration);
                if (this._freeze) {
                    this._userConfiguration.freeze();
                }
            }
            return this._userConfiguration;
        }
        get localUserConfiguration() {
            return this._localUserConfiguration;
        }
        get remoteUserConfiguration() {
            return this._remoteUserConfiguration;
        }
        get workspaceConfiguration() {
            return this._workspaceConfiguration;
        }
        get folderConfigurations() {
            return this._folderConfigurations;
        }
        getConsolidateConfigurationModel(overrides, workspace) {
            let configurationModel = this.getConsolidatedConfigurationModelForResource(overrides, workspace);
            return overrides.overrideIdentifier ? configurationModel.override(overrides.overrideIdentifier) : configurationModel;
        }
        getConsolidatedConfigurationModelForResource({ resource }, workspace) {
            let consolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();
            if (workspace && resource) {
                const root = workspace.getFolder(resource);
                if (root) {
                    consolidateConfiguration = this.getFolderConsolidatedConfiguration(root.uri) || consolidateConfiguration;
                }
                const memoryConfigurationForResource = this._memoryConfigurationByResource.get(resource);
                if (memoryConfigurationForResource) {
                    consolidateConfiguration = consolidateConfiguration.merge(memoryConfigurationForResource);
                }
            }
            return consolidateConfiguration;
        }
        getWorkspaceConsolidatedConfiguration() {
            if (!this._workspaceConsolidatedConfiguration) {
                this._workspaceConsolidatedConfiguration = this._defaultConfiguration.merge(this.userConfiguration, this._workspaceConfiguration, this._memoryConfiguration);
                if (this._freeze) {
                    this._workspaceConfiguration = this._workspaceConfiguration.freeze();
                }
            }
            return this._workspaceConsolidatedConfiguration;
        }
        getFolderConsolidatedConfiguration(folder) {
            let folderConsolidatedConfiguration = this._foldersConsolidatedConfigurations.get(folder);
            if (!folderConsolidatedConfiguration) {
                const workspaceConsolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();
                const folderConfiguration = this._folderConfigurations.get(folder);
                if (folderConfiguration) {
                    folderConsolidatedConfiguration = workspaceConsolidateConfiguration.merge(folderConfiguration);
                    if (this._freeze) {
                        folderConsolidatedConfiguration = folderConsolidatedConfiguration.freeze();
                    }
                    this._foldersConsolidatedConfigurations.set(folder, folderConsolidatedConfiguration);
                }
                else {
                    folderConsolidatedConfiguration = workspaceConsolidateConfiguration;
                }
            }
            return folderConsolidatedConfiguration;
        }
        getFolderConfigurationModelForResource(resource, workspace) {
            if (workspace && resource) {
                const root = workspace.getFolder(resource);
                if (root) {
                    return this._folderConfigurations.get(root.uri);
                }
            }
            return undefined;
        }
        toData() {
            return {
                defaults: {
                    contents: this._defaultConfiguration.contents,
                    overrides: this._defaultConfiguration.overrides,
                    keys: this._defaultConfiguration.keys
                },
                user: {
                    contents: this.userConfiguration.contents,
                    overrides: this.userConfiguration.overrides,
                    keys: this.userConfiguration.keys
                },
                workspace: {
                    contents: this._workspaceConfiguration.contents,
                    overrides: this._workspaceConfiguration.overrides,
                    keys: this._workspaceConfiguration.keys
                },
                folders: [...this._folderConfigurations.keys()].reduce((result, folder) => {
                    const { contents, overrides, keys } = this._folderConfigurations.get(folder);
                    result.push([folder, { contents, overrides, keys }]);
                    return result;
                }, [])
            };
        }
        allKeys() {
            const keys = new Set();
            this._defaultConfiguration.freeze().keys.forEach(key => keys.add(key));
            this.userConfiguration.freeze().keys.forEach(key => keys.add(key));
            this._workspaceConfiguration.freeze().keys.forEach(key => keys.add(key));
            this._folderConfigurations.forEach(folderConfiguraiton => folderConfiguraiton.freeze().keys.forEach(key => keys.add(key)));
            return map_1.values(keys);
        }
        getAllKeysForOverrideIdentifier(overrideIdentifier) {
            const keys = new Set();
            this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
            this.userConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
            this._workspaceConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
            this._folderConfigurations.forEach(folderConfiguraiton => folderConfiguraiton.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key)));
            return map_1.values(keys);
        }
        static parse(data) {
            const defaultConfiguration = this.parseConfigurationModel(data.defaults);
            const userConfiguration = this.parseConfigurationModel(data.user);
            const workspaceConfiguration = this.parseConfigurationModel(data.workspace);
            const folders = data.folders.reduce((result, value) => {
                result.set(uri_1.URI.revive(value[0]), this.parseConfigurationModel(value[1]));
                return result;
            }, new map_1.ResourceMap());
            return new Configuration(defaultConfiguration, userConfiguration, new ConfigurationModel(), workspaceConfiguration, folders, new ConfigurationModel(), new map_1.ResourceMap(), false);
        }
        static parseConfigurationModel(model) {
            return new ConfigurationModel(model.contents, model.keys, model.overrides).freeze();
        }
    }
    exports.Configuration = Configuration;
    function mergeChanges(...changes) {
        if (changes.length === 0) {
            return { keys: [], overrides: [] };
        }
        if (changes.length === 1) {
            return changes[0];
        }
        const keysSet = new Set();
        const overridesMap = new Map();
        for (const change of changes) {
            change.keys.forEach(key => keysSet.add(key));
            change.overrides.forEach(([identifier, keys]) => {
                const result = map_1.getOrSet(overridesMap, identifier, new Set());
                keys.forEach(key => result.add(key));
            });
        }
        const overrides = [];
        overridesMap.forEach((keys, identifier) => overrides.push([identifier, map_1.values(keys)]));
        return { keys: map_1.values(keysSet), overrides };
    }
    exports.mergeChanges = mergeChanges;
    class ConfigurationChangeEvent {
        constructor(change, previous, currentConfiguraiton, currentWorkspace) {
            this.change = change;
            this.previous = previous;
            this.currentConfiguraiton = currentConfiguraiton;
            this.currentWorkspace = currentWorkspace;
            this._previousConfiguration = undefined;
            const keysSet = new Set();
            change.keys.forEach(key => keysSet.add(key));
            change.overrides.forEach(([, keys]) => keys.forEach(key => keysSet.add(key)));
            this.affectedKeys = map_1.values(keysSet);
            const configurationModel = new ConfigurationModel();
            this.affectedKeys.forEach(key => configurationModel.setValue(key, {}));
            this.affectedKeysTree = configurationModel.contents;
        }
        get previousConfiguration() {
            if (!this._previousConfiguration && this.previous) {
                this._previousConfiguration = Configuration.parse(this.previous.data);
            }
            return this._previousConfiguration;
        }
        affectsConfiguration(section, overrides) {
            var _a;
            if (this.doesAffectedKeysTreeContains(this.affectedKeysTree, section)) {
                if (overrides) {
                    const value1 = this.previousConfiguration ? this.previousConfiguration.getValue(section, overrides, (_a = this.previous) === null || _a === void 0 ? void 0 : _a.workspace) : undefined;
                    const value2 = this.currentConfiguraiton.getValue(section, overrides, this.currentWorkspace);
                    return !objects.equals(value1, value2);
                }
                return true;
            }
            return false;
        }
        doesAffectedKeysTreeContains(affectedKeysTree, section) {
            let requestedTree = configuration_1.toValuesTree({ [section]: true }, () => { });
            let key;
            while (typeof requestedTree === 'object' && (key = Object.keys(requestedTree)[0])) { // Only one key should present, since we added only one property
                affectedKeysTree = affectedKeysTree[key];
                if (!affectedKeysTree) {
                    return false; // Requested tree is not found
                }
                requestedTree = requestedTree[key];
            }
            return true;
        }
    }
    exports.ConfigurationChangeEvent = ConfigurationChangeEvent;
    class AllKeysConfigurationChangeEvent extends ConfigurationChangeEvent {
        constructor(configuration, workspace, source, sourceConfig) {
            super({ keys: configuration.allKeys(), overrides: [] }, undefined, configuration, workspace);
            this.source = source;
            this.sourceConfig = sourceConfig;
        }
    }
    exports.AllKeysConfigurationChangeEvent = AllKeysConfigurationChangeEvent;
});
//# __sourceMappingURL=configurationModels.js.map