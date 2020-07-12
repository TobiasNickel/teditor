/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor"], function (require, exports, nls_1, instantiation_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USE_SPLIT_JSON_SETTING = exports.DEFAULT_SETTINGS_EDITOR_SETTING = exports.FOLDER_SETTINGS_PATH = exports.getSettingsTargetName = exports.IPreferencesService = exports.SettingsEditorOptions = exports.SettingValueType = void 0;
    var SettingValueType;
    (function (SettingValueType) {
        SettingValueType["Null"] = "null";
        SettingValueType["Enum"] = "enum";
        SettingValueType["String"] = "string";
        SettingValueType["Integer"] = "integer";
        SettingValueType["Number"] = "number";
        SettingValueType["Boolean"] = "boolean";
        SettingValueType["ArrayOfString"] = "array-of-string";
        SettingValueType["Exclude"] = "exclude";
        SettingValueType["Complex"] = "complex";
        SettingValueType["NullableInteger"] = "nullable-integer";
        SettingValueType["NullableNumber"] = "nullable-number";
        SettingValueType["Object"] = "object";
    })(SettingValueType = exports.SettingValueType || (exports.SettingValueType = {}));
    /**
     * TODO Why do we need this class?
     */
    class SettingsEditorOptions extends editor_1.EditorOptions {
        static create(settings) {
            const options = new SettingsEditorOptions();
            options.overwrite(settings);
            options.target = settings.target;
            options.folderUri = settings.folderUri;
            options.query = settings.query;
            options.editSetting = settings.editSetting;
            return options;
        }
    }
    exports.SettingsEditorOptions = SettingsEditorOptions;
    exports.IPreferencesService = instantiation_1.createDecorator('preferencesService');
    function getSettingsTargetName(target, resource, workspaceContextService) {
        switch (target) {
            case 1 /* USER */:
            case 2 /* USER_LOCAL */:
                return nls_1.localize('userSettingsTarget', "User Settings");
            case 4 /* WORKSPACE */:
                return nls_1.localize('workspaceSettingsTarget', "Workspace Settings");
            case 5 /* WORKSPACE_FOLDER */:
                const folder = workspaceContextService.getWorkspaceFolder(resource);
                return folder ? folder.name : '';
        }
        return '';
    }
    exports.getSettingsTargetName = getSettingsTargetName;
    exports.FOLDER_SETTINGS_PATH = '.vscode/settings.json';
    exports.DEFAULT_SETTINGS_EDITOR_SETTING = 'workbench.settings.openDefaultSettings';
    exports.USE_SPLIT_JSON_SETTING = 'workbench.settings.useSplitJSON';
});
//# __sourceMappingURL=preferences.js.map