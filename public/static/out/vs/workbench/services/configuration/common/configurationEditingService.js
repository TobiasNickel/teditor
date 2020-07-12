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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/json", "vs/base/common/strings", "vs/base/common/jsonEdit", "vs/base/common/async", "vs/editor/common/core/editOperation", "vs/platform/registry/common/platform", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/platform/workspace/common/workspace", "vs/platform/environment/common/environment", "vs/workbench/services/textfile/common/textfiles", "vs/platform/configuration/common/configuration", "vs/workbench/services/configuration/common/configuration", "vs/platform/files/common/files", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/editor/common/editorService", "vs/platform/notification/common/notification", "vs/workbench/services/preferences/common/preferences", "vs/base/common/types", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, nls, resources, json, strings, jsonEdit_1, async_1, editOperation_1, platform_1, range_1, selection_1, workspace_1, environment_1, textfiles_1, configuration_1, configuration_2, files_1, resolverService_1, configurationRegistry_1, editorService_1, notification_1, preferences_1, types_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationEditingService = exports.EditableConfigurationTarget = exports.ConfigurationEditingError = exports.ConfigurationEditingErrorCode = void 0;
    var ConfigurationEditingErrorCode;
    (function (ConfigurationEditingErrorCode) {
        /**
         * Error when trying to write a configuration key that is not registered.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_UNKNOWN_KEY"] = 0] = "ERROR_UNKNOWN_KEY";
        /**
         * Error when trying to write an application setting into workspace settings.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION"] = 1] = "ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION";
        /**
         * Error when trying to write a machne setting into workspace settings.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE"] = 2] = "ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE";
        /**
         * Error when trying to write an invalid folder configuration key to folder settings.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_FOLDER_CONFIGURATION"] = 3] = "ERROR_INVALID_FOLDER_CONFIGURATION";
        /**
         * Error when trying to write to user target but not supported for provided key.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_USER_TARGET"] = 4] = "ERROR_INVALID_USER_TARGET";
        /**
         * Error when trying to write to user target but not supported for provided key.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_WORKSPACE_TARGET"] = 5] = "ERROR_INVALID_WORKSPACE_TARGET";
        /**
         * Error when trying to write a configuration key to folder target
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_FOLDER_TARGET"] = 6] = "ERROR_INVALID_FOLDER_TARGET";
        /**
         * Error when trying to write to language specific setting but not supported for preovided key
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION"] = 7] = "ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION";
        /**
         * Error when trying to write to the workspace configuration without having a workspace opened.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_NO_WORKSPACE_OPENED"] = 8] = "ERROR_NO_WORKSPACE_OPENED";
        /**
         * Error when trying to write and save to the configuration file while it is dirty in the editor.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_CONFIGURATION_FILE_DIRTY"] = 9] = "ERROR_CONFIGURATION_FILE_DIRTY";
        /**
         * Error when trying to write and save to the configuration file while it is not the latest in the disk.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_CONFIGURATION_FILE_MODIFIED_SINCE"] = 10] = "ERROR_CONFIGURATION_FILE_MODIFIED_SINCE";
        /**
         * Error when trying to write to a configuration file that contains JSON errors.
         */
        ConfigurationEditingErrorCode[ConfigurationEditingErrorCode["ERROR_INVALID_CONFIGURATION"] = 11] = "ERROR_INVALID_CONFIGURATION";
    })(ConfigurationEditingErrorCode = exports.ConfigurationEditingErrorCode || (exports.ConfigurationEditingErrorCode = {}));
    class ConfigurationEditingError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.ConfigurationEditingError = ConfigurationEditingError;
    var EditableConfigurationTarget;
    (function (EditableConfigurationTarget) {
        EditableConfigurationTarget[EditableConfigurationTarget["USER_LOCAL"] = 1] = "USER_LOCAL";
        EditableConfigurationTarget[EditableConfigurationTarget["USER_REMOTE"] = 2] = "USER_REMOTE";
        EditableConfigurationTarget[EditableConfigurationTarget["WORKSPACE"] = 3] = "WORKSPACE";
        EditableConfigurationTarget[EditableConfigurationTarget["WORKSPACE_FOLDER"] = 4] = "WORKSPACE_FOLDER";
    })(EditableConfigurationTarget = exports.EditableConfigurationTarget || (exports.EditableConfigurationTarget = {}));
    let ConfigurationEditingService = class ConfigurationEditingService {
        constructor(configurationService, contextService, environmentService, fileService, textModelResolverService, textFileService, notificationService, preferencesService, editorService, remoteAgentService) {
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.textModelResolverService = textModelResolverService;
            this.textFileService = textFileService;
            this.notificationService = notificationService;
            this.preferencesService = preferencesService;
            this.editorService = editorService;
            this.remoteSettingsResource = null;
            this.queue = new async_1.Queue();
            remoteAgentService.getEnvironment().then(environment => {
                if (environment) {
                    this.remoteSettingsResource = environment.settingsPath;
                }
            });
        }
        writeConfiguration(target, value, options = {}) {
            const operation = this.getConfigurationEditOperation(target, value, options.scopes || {});
            return Promise.resolve(this.queue.queue(() => this.doWriteConfiguration(operation, options) // queue up writes to prevent race conditions
                .then(() => { }, async (error) => {
                if (!options.donotNotifyError) {
                    await this.onError(error, operation, options.scopes);
                }
                return Promise.reject(error);
            })));
        }
        async doWriteConfiguration(operation, options) {
            const checkDirtyConfiguration = !(options.force || options.donotSave);
            const saveConfiguration = options.force || !options.donotSave;
            const reference = await this.resolveAndValidate(operation.target, operation, checkDirtyConfiguration, options.scopes || {});
            try {
                await this.writeToBuffer(reference.object.textEditorModel, operation, saveConfiguration);
            }
            catch (error) {
                if (error.fileOperationResult === 3 /* FILE_MODIFIED_SINCE */) {
                    await this.textFileService.revert(operation.resource);
                    return this.reject(10 /* ERROR_CONFIGURATION_FILE_MODIFIED_SINCE */, operation.target, operation);
                }
                throw error;
            }
            finally {
                reference.dispose();
            }
        }
        async writeToBuffer(model, operation, save) {
            const edit = this.getEdits(model, operation)[0];
            if (edit && this.applyEditsToBuffer(edit, model) && save) {
                await this.textFileService.save(operation.resource, { skipSaveParticipants: true /* programmatic change */, ignoreErrorHandler: true /* handle error self */ });
            }
        }
        applyEditsToBuffer(edit, model) {
            const startPosition = model.getPositionAt(edit.offset);
            const endPosition = model.getPositionAt(edit.offset + edit.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            let currentText = model.getValueInRange(range);
            if (edit.content !== currentText) {
                const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
                model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
                return true;
            }
            return false;
        }
        async onError(error, operation, scopes) {
            switch (error.code) {
                case 11 /* ERROR_INVALID_CONFIGURATION */:
                    this.onInvalidConfigurationError(error, operation);
                    break;
                case 9 /* ERROR_CONFIGURATION_FILE_DIRTY */:
                    this.onConfigurationFileDirtyError(error, operation, scopes);
                    break;
                case 10 /* ERROR_CONFIGURATION_FILE_MODIFIED_SINCE */:
                    return this.doWriteConfiguration(operation, { scopes });
                default:
                    this.notificationService.error(error.message);
            }
        }
        onInvalidConfigurationError(error, operation) {
            const openStandAloneConfigurationActionLabel = operation.workspaceStandAloneConfigurationKey === configuration_2.TASKS_CONFIGURATION_KEY ? nls.localize('openTasksConfiguration', "Open Tasks Configuration")
                : operation.workspaceStandAloneConfigurationKey === configuration_2.LAUNCH_CONFIGURATION_KEY ? nls.localize('openLaunchConfiguration', "Open Launch Configuration")
                    : null;
            if (openStandAloneConfigurationActionLabel) {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: openStandAloneConfigurationActionLabel,
                        run: () => this.openFile(operation.resource)
                    }]);
            }
            else {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: nls.localize('open', "Open Settings"),
                        run: () => this.openSettings(operation)
                    }]);
            }
        }
        onConfigurationFileDirtyError(error, operation, scopes) {
            const openStandAloneConfigurationActionLabel = operation.workspaceStandAloneConfigurationKey === configuration_2.TASKS_CONFIGURATION_KEY ? nls.localize('openTasksConfiguration', "Open Tasks Configuration")
                : operation.workspaceStandAloneConfigurationKey === configuration_2.LAUNCH_CONFIGURATION_KEY ? nls.localize('openLaunchConfiguration', "Open Launch Configuration")
                    : null;
            if (openStandAloneConfigurationActionLabel) {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: nls.localize('saveAndRetry', "Save and Retry"),
                        run: () => {
                            const key = operation.key ? `${operation.workspaceStandAloneConfigurationKey}.${operation.key}` : operation.workspaceStandAloneConfigurationKey;
                            this.writeConfiguration(operation.target, { key, value: operation.value }, { force: true, scopes });
                        }
                    },
                    {
                        label: openStandAloneConfigurationActionLabel,
                        run: () => this.openFile(operation.resource)
                    }]);
            }
            else {
                this.notificationService.prompt(notification_1.Severity.Error, error.message, [{
                        label: nls.localize('saveAndRetry', "Save and Retry"),
                        run: () => this.writeConfiguration(operation.target, { key: operation.key, value: operation.value }, { force: true, scopes })
                    }, {
                        label: nls.localize('open', "Open Settings"),
                        run: () => this.openSettings(operation)
                    }]);
            }
        }
        openSettings(operation) {
            switch (operation.target) {
                case 1 /* USER_LOCAL */:
                    this.preferencesService.openGlobalSettings(true);
                    break;
                case 2 /* USER_REMOTE */:
                    this.preferencesService.openRemoteSettings();
                    break;
                case 3 /* WORKSPACE */:
                    this.preferencesService.openWorkspaceSettings(true);
                    break;
                case 4 /* WORKSPACE_FOLDER */:
                    if (operation.resource) {
                        const workspaceFolder = this.contextService.getWorkspaceFolder(operation.resource);
                        if (workspaceFolder) {
                            this.preferencesService.openFolderSettings(workspaceFolder.uri, true);
                        }
                    }
                    break;
            }
        }
        openFile(resource) {
            this.editorService.openEditor({ resource });
        }
        reject(code, target, operation) {
            const message = this.toErrorMessage(code, target, operation);
            return Promise.reject(new ConfigurationEditingError(message, code));
        }
        toErrorMessage(error, target, operation) {
            switch (error) {
                // API constraints
                case 0 /* ERROR_UNKNOWN_KEY */: return nls.localize('errorUnknownKey', "Unable to write to {0} because {1} is not a registered configuration.", this.stringifyTarget(target), operation.key);
                case 1 /* ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */: return nls.localize('errorInvalidWorkspaceConfigurationApplication', "Unable to write {0} to Workspace Settings. This setting can be written only into User settings.", operation.key);
                case 2 /* ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */: return nls.localize('errorInvalidWorkspaceConfigurationMachine', "Unable to write {0} to Workspace Settings. This setting can be written only into User settings.", operation.key);
                case 3 /* ERROR_INVALID_FOLDER_CONFIGURATION */: return nls.localize('errorInvalidFolderConfiguration', "Unable to write to Folder Settings because {0} does not support the folder resource scope.", operation.key);
                case 4 /* ERROR_INVALID_USER_TARGET */: return nls.localize('errorInvalidUserTarget', "Unable to write to User Settings because {0} does not support for global scope.", operation.key);
                case 5 /* ERROR_INVALID_WORKSPACE_TARGET */: return nls.localize('errorInvalidWorkspaceTarget', "Unable to write to Workspace Settings because {0} does not support for workspace scope in a multi folder workspace.", operation.key);
                case 6 /* ERROR_INVALID_FOLDER_TARGET */: return nls.localize('errorInvalidFolderTarget', "Unable to write to Folder Settings because no resource is provided.");
                case 7 /* ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION */: return nls.localize('errorInvalidResourceLanguageConfiguraiton', "Unable to write to Language Settings because {0} is not a resource language setting.", operation.key);
                case 8 /* ERROR_NO_WORKSPACE_OPENED */: return nls.localize('errorNoWorkspaceOpened', "Unable to write to {0} because no workspace is opened. Please open a workspace first and try again.", this.stringifyTarget(target));
                // User issues
                case 11 /* ERROR_INVALID_CONFIGURATION */: {
                    if (operation.workspaceStandAloneConfigurationKey === configuration_2.TASKS_CONFIGURATION_KEY) {
                        return nls.localize('errorInvalidTaskConfiguration', "Unable to write into the tasks configuration file. Please open it to correct errors/warnings in it and try again.");
                    }
                    if (operation.workspaceStandAloneConfigurationKey === configuration_2.LAUNCH_CONFIGURATION_KEY) {
                        return nls.localize('errorInvalidLaunchConfiguration', "Unable to write into the launch configuration file. Please open it to correct errors/warnings in it and try again.");
                    }
                    switch (target) {
                        case 1 /* USER_LOCAL */:
                            return nls.localize('errorInvalidConfiguration', "Unable to write into user settings. Please open the user settings to correct errors/warnings in it and try again.");
                        case 2 /* USER_REMOTE */:
                            return nls.localize('errorInvalidRemoteConfiguration', "Unable to write into remote user settings. Please open the remote user settings to correct errors/warnings in it and try again.");
                        case 3 /* WORKSPACE */:
                            return nls.localize('errorInvalidConfigurationWorkspace', "Unable to write into workspace settings. Please open the workspace settings to correct errors/warnings in the file and try again.");
                        case 4 /* WORKSPACE_FOLDER */:
                            let workspaceFolderName = '<<unknown>>';
                            if (operation.resource) {
                                const folder = this.contextService.getWorkspaceFolder(operation.resource);
                                if (folder) {
                                    workspaceFolderName = folder.name;
                                }
                            }
                            return nls.localize('errorInvalidConfigurationFolder', "Unable to write into folder settings. Please open the '{0}' folder settings to correct errors/warnings in it and try again.", workspaceFolderName);
                    }
                    return '';
                }
                case 9 /* ERROR_CONFIGURATION_FILE_DIRTY */: {
                    if (operation.workspaceStandAloneConfigurationKey === configuration_2.TASKS_CONFIGURATION_KEY) {
                        return nls.localize('errorTasksConfigurationFileDirty', "Unable to write into tasks configuration file because the file is dirty. Please save it first and then try again.");
                    }
                    if (operation.workspaceStandAloneConfigurationKey === configuration_2.LAUNCH_CONFIGURATION_KEY) {
                        return nls.localize('errorLaunchConfigurationFileDirty', "Unable to write into launch configuration file because the file is dirty. Please save it first and then try again.");
                    }
                    switch (target) {
                        case 1 /* USER_LOCAL */:
                            return nls.localize('errorConfigurationFileDirty', "Unable to write into user settings because the file is dirty. Please save the user settings file first and then try again.");
                        case 2 /* USER_REMOTE */:
                            return nls.localize('errorRemoteConfigurationFileDirty', "Unable to write into remote user settings because the file is dirty. Please save the remote user settings file first and then try again.");
                        case 3 /* WORKSPACE */:
                            return nls.localize('errorConfigurationFileDirtyWorkspace', "Unable to write into workspace settings because the file is dirty. Please save the workspace settings file first and then try again.");
                        case 4 /* WORKSPACE_FOLDER */:
                            let workspaceFolderName = '<<unknown>>';
                            if (operation.resource) {
                                const folder = this.contextService.getWorkspaceFolder(operation.resource);
                                if (folder) {
                                    workspaceFolderName = folder.name;
                                }
                            }
                            return nls.localize('errorConfigurationFileDirtyFolder', "Unable to write into folder settings because the file is dirty. Please save the '{0}' folder settings file first and then try again.", workspaceFolderName);
                    }
                    return '';
                }
                case 10 /* ERROR_CONFIGURATION_FILE_MODIFIED_SINCE */:
                    if (operation.workspaceStandAloneConfigurationKey === configuration_2.TASKS_CONFIGURATION_KEY) {
                        return nls.localize('errorTasksConfigurationFileModifiedSince', "Unable to write into tasks configuration file because the content of the file is newer.");
                    }
                    if (operation.workspaceStandAloneConfigurationKey === configuration_2.LAUNCH_CONFIGURATION_KEY) {
                        return nls.localize('errorLaunchConfigurationFileModifiedSince', "Unable to write into launch configuration file because the content of the file is newer.");
                    }
                    switch (target) {
                        case 1 /* USER_LOCAL */:
                            return nls.localize('errorConfigurationFileModifiedSince', "Unable to write into user settings because the content of the file is newer.");
                        case 2 /* USER_REMOTE */:
                            return nls.localize('errorRemoteConfigurationFileModifiedSince', "Unable to write into remote user settings because the content of the file is newer.");
                        case 3 /* WORKSPACE */:
                            return nls.localize('errorConfigurationFileModifiedSinceWorkspace', "Unable to write into workspace settings because the content of the file is newer.");
                        case 4 /* WORKSPACE_FOLDER */:
                            return nls.localize('errorConfigurationFileModifiedSinceFolder', "Unable to write into folder settings because the content of the file is newer.");
                    }
            }
        }
        stringifyTarget(target) {
            switch (target) {
                case 1 /* USER_LOCAL */:
                    return nls.localize('userTarget', "User Settings");
                case 2 /* USER_REMOTE */:
                    return nls.localize('remoteUserTarget', "Remote User Settings");
                case 3 /* WORKSPACE */:
                    return nls.localize('workspaceTarget', "Workspace Settings");
                case 4 /* WORKSPACE_FOLDER */:
                    return nls.localize('folderTarget', "Folder Settings");
            }
            return '';
        }
        getEdits(model, edit) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const { value, jsonPath } = edit;
            // Without jsonPath, the entire configuration file is being replaced, so we just use JSON.stringify
            if (!jsonPath.length) {
                const content = JSON.stringify(value, null, insertSpaces ? strings.repeat(' ', tabSize) : '\t');
                return [{
                        content,
                        length: model.getValue().length,
                        offset: 0
                    }];
            }
            return jsonEdit_1.setProperty(model.getValue(), jsonPath, value, { tabSize, insertSpaces, eol });
        }
        defaultResourceValue(resource) {
            const basename = resources.basename(resource);
            const configurationValue = basename.substr(0, basename.length - resources.extname(resource).length);
            switch (configurationValue) {
                case configuration_2.TASKS_CONFIGURATION_KEY: return configuration_2.TASKS_DEFAULT;
                default: return '{}';
            }
        }
        async resolveModelReference(resource) {
            const exists = await this.fileService.exists(resource);
            if (!exists) {
                await this.textFileService.write(resource, this.defaultResourceValue(resource), { encoding: 'utf8' });
            }
            return this.textModelResolverService.createModelReference(resource);
        }
        hasParseErrors(model, operation) {
            // If we write to a workspace standalone file and replace the entire contents (no key provided)
            // we can return here because any parse errors can safely be ignored since all contents are replaced
            if (operation.workspaceStandAloneConfigurationKey && !operation.key) {
                return false;
            }
            const parseErrors = [];
            json.parse(model.getValue(), parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
            return parseErrors.length > 0;
        }
        resolveAndValidate(target, operation, checkDirty, overrides) {
            // Any key must be a known setting from the registry (unless this is a standalone config)
            if (!operation.workspaceStandAloneConfigurationKey) {
                const validKeys = this.configurationService.keys().default;
                if (validKeys.indexOf(operation.key) < 0 && !configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(operation.key)) {
                    return this.reject(0 /* ERROR_UNKNOWN_KEY */, target, operation);
                }
            }
            if (operation.workspaceStandAloneConfigurationKey) {
                // Global launches are not supported
                if ((operation.workspaceStandAloneConfigurationKey !== configuration_2.TASKS_CONFIGURATION_KEY) && (target === 1 /* USER_LOCAL */ || target === 2 /* USER_REMOTE */)) {
                    return this.reject(4 /* ERROR_INVALID_USER_TARGET */, target, operation);
                }
            }
            // Target cannot be workspace or folder if no workspace opened
            if ((target === 3 /* WORKSPACE */ || target === 4 /* WORKSPACE_FOLDER */) && this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                return this.reject(8 /* ERROR_NO_WORKSPACE_OPENED */, target, operation);
            }
            if (target === 3 /* WORKSPACE */) {
                if (!operation.workspaceStandAloneConfigurationKey && !configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(operation.key)) {
                    const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                    if (configurationProperties[operation.key].scope === 1 /* APPLICATION */) {
                        return this.reject(1 /* ERROR_INVALID_WORKSPACE_CONFIGURATION_APPLICATION */, target, operation);
                    }
                    if (configurationProperties[operation.key].scope === 2 /* MACHINE */) {
                        return this.reject(2 /* ERROR_INVALID_WORKSPACE_CONFIGURATION_MACHINE */, target, operation);
                    }
                }
            }
            if (target === 4 /* WORKSPACE_FOLDER */) {
                if (!operation.resource) {
                    return this.reject(6 /* ERROR_INVALID_FOLDER_TARGET */, target, operation);
                }
                if (!operation.workspaceStandAloneConfigurationKey && !configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(operation.key)) {
                    const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                    if (!(configurationProperties[operation.key].scope === 4 /* RESOURCE */ || configurationProperties[operation.key].scope === 5 /* LANGUAGE_OVERRIDABLE */)) {
                        return this.reject(3 /* ERROR_INVALID_FOLDER_CONFIGURATION */, target, operation);
                    }
                }
            }
            if (overrides.overrideIdentifier) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                if (configurationProperties[operation.key].scope !== 5 /* LANGUAGE_OVERRIDABLE */) {
                    return this.reject(7 /* ERROR_INVALID_RESOURCE_LANGUAGE_CONFIGURATION */, target, operation);
                }
            }
            if (!operation.resource) {
                return this.reject(6 /* ERROR_INVALID_FOLDER_TARGET */, target, operation);
            }
            return this.resolveModelReference(operation.resource)
                .then(reference => {
                const model = reference.object.textEditorModel;
                if (this.hasParseErrors(model, operation)) {
                    reference.dispose();
                    return this.reject(11 /* ERROR_INVALID_CONFIGURATION */, target, operation);
                }
                // Target cannot be dirty if not writing into buffer
                if (checkDirty && operation.resource && this.textFileService.isDirty(operation.resource)) {
                    reference.dispose();
                    return this.reject(9 /* ERROR_CONFIGURATION_FILE_DIRTY */, target, operation);
                }
                return reference;
            });
        }
        getConfigurationEditOperation(target, config, overrides) {
            // Check for standalone workspace configurations
            if (config.key) {
                const standaloneConfigurationMap = target === 1 /* USER_LOCAL */ ? configuration_2.USER_STANDALONE_CONFIGURATIONS : configuration_2.WORKSPACE_STANDALONE_CONFIGURATIONS;
                const standaloneConfigurationKeys = Object.keys(standaloneConfigurationMap);
                for (const key of standaloneConfigurationKeys) {
                    const resource = this.getConfigurationFileResource(target, standaloneConfigurationMap[key], overrides.resource);
                    // Check for prefix
                    if (config.key === key) {
                        const jsonPath = this.isWorkspaceConfigurationResource(resource) ? [key] : [];
                        return { key: jsonPath[jsonPath.length - 1], jsonPath, value: config.value, resource: types_1.withNullAsUndefined(resource), workspaceStandAloneConfigurationKey: key, target };
                    }
                    // Check for prefix.<setting>
                    const keyPrefix = `${key}.`;
                    if (config.key.indexOf(keyPrefix) === 0) {
                        const jsonPath = this.isWorkspaceConfigurationResource(resource) ? [key, config.key.substr(keyPrefix.length)] : [config.key.substr(keyPrefix.length)];
                        return { key: jsonPath[jsonPath.length - 1], jsonPath, value: config.value, resource: types_1.withNullAsUndefined(resource), workspaceStandAloneConfigurationKey: key, target };
                    }
                }
            }
            let key = config.key;
            let jsonPath = overrides.overrideIdentifier ? [configuration_1.keyFromOverrideIdentifier(overrides.overrideIdentifier), key] : [key];
            if (target === 1 /* USER_LOCAL */ || target === 2 /* USER_REMOTE */) {
                return { key, jsonPath, value: config.value, resource: types_1.withNullAsUndefined(this.getConfigurationFileResource(target, '', null)), target };
            }
            const resource = this.getConfigurationFileResource(target, configuration_2.FOLDER_SETTINGS_PATH, overrides.resource);
            if (this.isWorkspaceConfigurationResource(resource)) {
                jsonPath = ['settings', ...jsonPath];
            }
            return { key, jsonPath, value: config.value, resource: types_1.withNullAsUndefined(resource), target };
        }
        isWorkspaceConfigurationResource(resource) {
            const workspace = this.contextService.getWorkspace();
            return !!(workspace.configuration && resource && workspace.configuration.fsPath === resource.fsPath);
        }
        getConfigurationFileResource(target, relativePath, resource) {
            if (target === 1 /* USER_LOCAL */) {
                if (relativePath) {
                    return resources.joinPath(resources.dirname(this.environmentService.settingsResource), relativePath);
                }
                else {
                    return this.environmentService.settingsResource;
                }
            }
            if (target === 2 /* USER_REMOTE */) {
                return this.remoteSettingsResource;
            }
            const workbenchState = this.contextService.getWorkbenchState();
            if (workbenchState !== 1 /* EMPTY */) {
                const workspace = this.contextService.getWorkspace();
                if (target === 3 /* WORKSPACE */) {
                    if (workbenchState === 3 /* WORKSPACE */) {
                        return types_1.withUndefinedAsNull(workspace.configuration);
                    }
                    if (workbenchState === 2 /* FOLDER */) {
                        return workspace.folders[0].toResource(relativePath);
                    }
                }
                if (target === 4 /* WORKSPACE_FOLDER */) {
                    if (resource) {
                        const folder = this.contextService.getWorkspaceFolder(resource);
                        if (folder) {
                            return folder.toResource(relativePath);
                        }
                    }
                }
            }
            return null;
        }
    };
    ConfigurationEditingService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, notification_1.INotificationService),
        __param(7, preferences_1.IPreferencesService),
        __param(8, editorService_1.IEditorService),
        __param(9, remoteAgentService_1.IRemoteAgentService)
    ], ConfigurationEditingService);
    exports.ConfigurationEditingService = ConfigurationEditingService;
});
//# __sourceMappingURL=configurationEditingService.js.map