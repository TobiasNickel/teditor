/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, objects_1, configuration_1, configurationModels_1, configuration_2, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Configuration = exports.StandaloneConfigurationModelParser = exports.WorkspaceConfigurationModelParser = void 0;
    class WorkspaceConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name) {
            super(name);
            this._folders = [];
            this._settingsModelParser = new configurationModels_1.ConfigurationModelParser(name, configuration_2.WORKSPACE_SCOPES);
            this._launchModel = new configurationModels_1.ConfigurationModel();
            this._tasksModel = new configurationModels_1.ConfigurationModel();
        }
        get folders() {
            return this._folders;
        }
        get settingsModel() {
            return this._settingsModelParser.configurationModel;
        }
        get launchModel() {
            return this._launchModel;
        }
        get tasksModel() {
            return this._tasksModel;
        }
        reprocessWorkspaceSettings() {
            this._settingsModelParser.parse();
        }
        doParseRaw(raw) {
            this._folders = (raw['folders'] || []);
            this._settingsModelParser.parseRaw(raw['settings']);
            this._launchModel = this.createConfigurationModelFrom(raw, 'launch');
            this._tasksModel = this.createConfigurationModelFrom(raw, 'tasks');
            return super.doParseRaw(raw);
        }
        createConfigurationModelFrom(raw, key) {
            const data = raw[key];
            if (data) {
                const contents = configuration_1.toValuesTree(data, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
                const scopedContents = Object.create(null);
                scopedContents[key] = contents;
                const keys = Object.keys(data).map(k => `${key}.${k}`);
                return new configurationModels_1.ConfigurationModel(scopedContents, keys, []);
            }
            return new configurationModels_1.ConfigurationModel();
        }
    }
    exports.WorkspaceConfigurationModelParser = WorkspaceConfigurationModelParser;
    class StandaloneConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name, scope) {
            super(name);
            this.scope = scope;
        }
        doParseRaw(raw) {
            const contents = configuration_1.toValuesTree(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const scopedContents = Object.create(null);
            scopedContents[this.scope] = contents;
            const keys = Object.keys(raw).map(key => `${this.scope}.${key}`);
            return { contents: scopedContents, keys, overrides: [] };
        }
    }
    exports.StandaloneConfigurationModelParser = StandaloneConfigurationModelParser;
    class Configuration extends configurationModels_1.Configuration {
        constructor(defaults, localUser, remoteUser, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource, _workspace) {
            super(defaults, localUser, remoteUser, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource);
            this._workspace = _workspace;
        }
        getValue(key, overrides = {}) {
            return super.getValue(key, overrides, this._workspace);
        }
        inspect(key, overrides = {}) {
            return super.inspect(key, overrides, this._workspace);
        }
        keys() {
            return super.keys(this._workspace);
        }
        compareAndDeleteFolderConfiguration(folder) {
            if (this._workspace && this._workspace.folders.length > 0 && this._workspace.folders[0].uri.toString() === folder.toString()) {
                // Do not remove workspace configuration
                return { keys: [], overrides: [] };
            }
            return super.compareAndDeleteFolderConfiguration(folder);
        }
        compare(other) {
            const compare = (fromKeys, toKeys, overrideIdentifier) => {
                const keys = [];
                keys.push(...toKeys.filter(key => fromKeys.indexOf(key) === -1));
                keys.push(...fromKeys.filter(key => toKeys.indexOf(key) === -1));
                keys.push(...fromKeys.filter(key => {
                    // Ignore if the key does not exist in both models
                    if (toKeys.indexOf(key) === -1) {
                        return false;
                    }
                    // Compare workspace value
                    if (!objects_1.equals(this.getValue(key, { overrideIdentifier }), other.getValue(key, { overrideIdentifier }))) {
                        return true;
                    }
                    // Compare workspace folder value
                    return this._workspace && this._workspace.folders.some(folder => !objects_1.equals(this.getValue(key, { resource: folder.uri, overrideIdentifier }), other.getValue(key, { resource: folder.uri, overrideIdentifier })));
                }));
                return keys;
            };
            const keys = compare(this.allKeys(), other.allKeys());
            const overrides = [];
            for (const key of keys) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key)) {
                    const overrideIdentifier = configuration_1.overrideIdentifierFromKey(key);
                    overrides.push([overrideIdentifier, compare(this.getAllKeysForOverrideIdentifier(overrideIdentifier), other.getAllKeysForOverrideIdentifier(overrideIdentifier), overrideIdentifier)]);
                }
            }
            return { keys, overrides };
        }
    }
    exports.Configuration = Configuration;
});
//# __sourceMappingURL=configurationModels.js.map