/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TASKS_DEFAULT = exports.USER_STANDALONE_CONFIGURATIONS = exports.WORKSPACE_STANDALONE_CONFIGURATIONS = exports.LAUNCH_CONFIGURATION_KEY = exports.TASKS_CONFIGURATION_KEY = exports.FOLDER_SCOPES = exports.WORKSPACE_SCOPES = exports.REMOTE_MACHINE_SCOPES = exports.LOCAL_MACHINE_SCOPES = exports.tasksSchemaId = exports.launchSchemaId = exports.folderSettingsSchemaId = exports.workspaceSettingsSchemaId = exports.machineSettingsSchemaId = exports.userSettingsSchemaId = exports.defaultSettingsSchemaId = exports.FOLDER_SETTINGS_PATH = exports.FOLDER_SETTINGS_NAME = exports.FOLDER_CONFIG_FOLDER_NAME = void 0;
    exports.FOLDER_CONFIG_FOLDER_NAME = '.vscode';
    exports.FOLDER_SETTINGS_NAME = 'settings';
    exports.FOLDER_SETTINGS_PATH = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.FOLDER_SETTINGS_NAME}.json`;
    exports.defaultSettingsSchemaId = 'vscode://schemas/settings/default';
    exports.userSettingsSchemaId = 'vscode://schemas/settings/user';
    exports.machineSettingsSchemaId = 'vscode://schemas/settings/machine';
    exports.workspaceSettingsSchemaId = 'vscode://schemas/settings/workspace';
    exports.folderSettingsSchemaId = 'vscode://schemas/settings/folder';
    exports.launchSchemaId = 'vscode://schemas/launch';
    exports.tasksSchemaId = 'vscode://schemas/tasks';
    exports.LOCAL_MACHINE_SCOPES = [1 /* APPLICATION */, 3 /* WINDOW */, 4 /* RESOURCE */, 5 /* LANGUAGE_OVERRIDABLE */];
    exports.REMOTE_MACHINE_SCOPES = [2 /* MACHINE */, 3 /* WINDOW */, 4 /* RESOURCE */, 5 /* LANGUAGE_OVERRIDABLE */, 6 /* MACHINE_OVERRIDABLE */];
    exports.WORKSPACE_SCOPES = [3 /* WINDOW */, 4 /* RESOURCE */, 5 /* LANGUAGE_OVERRIDABLE */, 6 /* MACHINE_OVERRIDABLE */];
    exports.FOLDER_SCOPES = [4 /* RESOURCE */, 5 /* LANGUAGE_OVERRIDABLE */, 6 /* MACHINE_OVERRIDABLE */];
    exports.TASKS_CONFIGURATION_KEY = 'tasks';
    exports.LAUNCH_CONFIGURATION_KEY = 'launch';
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS = Object.create(null);
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS[exports.TASKS_CONFIGURATION_KEY] = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.TASKS_CONFIGURATION_KEY}.json`;
    exports.WORKSPACE_STANDALONE_CONFIGURATIONS[exports.LAUNCH_CONFIGURATION_KEY] = `${exports.FOLDER_CONFIG_FOLDER_NAME}/${exports.LAUNCH_CONFIGURATION_KEY}.json`;
    exports.USER_STANDALONE_CONFIGURATIONS = Object.create(null);
    exports.USER_STANDALONE_CONFIGURATIONS[exports.TASKS_CONFIGURATION_KEY] = `${exports.TASKS_CONFIGURATION_KEY}.json`;
    exports.TASKS_DEFAULT = '{\n\t\"version\": \"2.0.0\",\n\t\"tasks\": []\n}';
});
//# __sourceMappingURL=configuration.js.map