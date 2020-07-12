/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/arrays", "vs/base/common/types"], function (require, exports, instantiation_1, extensionManagement_1, platform_1, configurationRegistry_1, nls_1, jsonContributionRegistry_1, uri_1, resources_1, arrays_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSyncResourceFromLocalPreview = exports.PREVIEW_DIR_NAME = exports.USER_DATA_SYNC_SCHEME = exports.IUserDataSyncLogService = exports.IUserDataSyncUtilService = exports.IUserDataAutoSyncService = exports.IUserDataSyncService = exports.IUserDataSyncResourceEnablementService = exports.SyncStatus = exports.UserDataAutoSyncError = exports.UserDataSyncStoreError = exports.UserDataSyncError = exports.UserDataSyncErrorCode = exports.IUserDataSyncBackupStoreService = exports.IUserDataSyncStoreService = exports.ALL_SYNC_RESOURCES = exports.SyncResource = exports.getUserDataSyncStore = exports.isAuthenticationProvider = exports.registerConfiguration = exports.getDefaultIgnoredSettings = exports.getDisallowedIgnoredSettings = exports.CONFIGURATION_SYNC_STORE_KEY = void 0;
    exports.CONFIGURATION_SYNC_STORE_KEY = 'configurationSync.store';
    function getDisallowedIgnoredSettings() {
        const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        return Object.keys(allSettings).filter(setting => !!allSettings[setting].disallowSyncIgnore);
    }
    exports.getDisallowedIgnoredSettings = getDisallowedIgnoredSettings;
    function getDefaultIgnoredSettings() {
        const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        const machineSettings = Object.keys(allSettings).filter(setting => allSettings[setting].scope === 2 /* MACHINE */ || allSettings[setting].scope === 6 /* MACHINE_OVERRIDABLE */);
        const disallowedSettings = getDisallowedIgnoredSettings();
        return arrays_1.distinct([exports.CONFIGURATION_SYNC_STORE_KEY, ...machineSettings, ...disallowedSettings]);
    }
    exports.getDefaultIgnoredSettings = getDefaultIgnoredSettings;
    function registerConfiguration() {
        const ignoredSettingsSchemaId = 'vscode://schemas/ignoredSettings';
        const ignoredExtensionsSchemaId = 'vscode://schemas/ignoredExtensions';
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'sync',
            order: 30,
            title: nls_1.localize('sync', "Sync"),
            type: 'object',
            properties: {
                'sync.keybindingsPerPlatform': {
                    type: 'boolean',
                    description: nls_1.localize('sync.keybindingsPerPlatform', "Synchronize keybindings per platform."),
                    default: true,
                    scope: 1 /* APPLICATION */,
                    tags: ['sync', 'usesOnlineServices']
                },
                'sync.ignoredExtensions': {
                    'type': 'array',
                    'description': nls_1.localize('sync.ignoredExtensions', "List of extensions to be ignored while synchronizing. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp."),
                    $ref: ignoredExtensionsSchemaId,
                    'default': [],
                    'scope': 1 /* APPLICATION */,
                    uniqueItems: true,
                    disallowSyncIgnore: true,
                    tags: ['sync', 'usesOnlineServices']
                },
                'sync.ignoredSettings': {
                    'type': 'array',
                    description: nls_1.localize('sync.ignoredSettings', "Configure settings to be ignored while synchronizing."),
                    'default': [],
                    'scope': 1 /* APPLICATION */,
                    $ref: ignoredSettingsSchemaId,
                    additionalProperties: true,
                    uniqueItems: true,
                    disallowSyncIgnore: true,
                    tags: ['sync', 'usesOnlineServices']
                }
            }
        });
        const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        const registerIgnoredSettingsSchema = () => {
            const disallowedIgnoredSettings = getDisallowedIgnoredSettings();
            const defaultIgnoredSettings = getDefaultIgnoredSettings().filter(s => s !== exports.CONFIGURATION_SYNC_STORE_KEY);
            const settings = Object.keys(configurationRegistry_1.allSettings.properties).filter(setting => defaultIgnoredSettings.indexOf(setting) === -1);
            const ignoredSettings = defaultIgnoredSettings.filter(setting => disallowedIgnoredSettings.indexOf(setting) === -1);
            const ignoredSettingsSchema = {
                items: {
                    type: 'string',
                    enum: [...settings, ...ignoredSettings.map(setting => `-${setting}`)]
                },
            };
            jsonRegistry.registerSchema(ignoredSettingsSchemaId, ignoredSettingsSchema);
        };
        jsonRegistry.registerSchema(ignoredExtensionsSchemaId, {
            type: 'string',
            pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
            errorMessage: nls_1.localize('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
        });
        return configurationRegistry.onDidUpdateConfiguration(() => registerIgnoredSettingsSchema());
    }
    exports.registerConfiguration = registerConfiguration;
    function isAuthenticationProvider(thing) {
        return thing
            && types_1.isObject(thing)
            && types_1.isString(thing.id)
            && types_1.isArray(thing.scopes);
    }
    exports.isAuthenticationProvider = isAuthenticationProvider;
    function getUserDataSyncStore(productService, configurationService) {
        const value = configurationService.getValue(exports.CONFIGURATION_SYNC_STORE_KEY) || productService[exports.CONFIGURATION_SYNC_STORE_KEY];
        if (value
            && types_1.isString(value.url)
            && types_1.isObject(value.authenticationProviders)
            && Object.keys(value.authenticationProviders).every(authenticationProviderId => types_1.isArray(value.authenticationProviders[authenticationProviderId].scopes))) {
            return {
                url: resources_1.joinPath(uri_1.URI.parse(value.url), 'v1'),
                authenticationProviders: Object.keys(value.authenticationProviders).reduce((result, id) => {
                    result.push({ id, scopes: value.authenticationProviders[id].scopes });
                    return result;
                }, [])
            };
        }
        return undefined;
    }
    exports.getUserDataSyncStore = getUserDataSyncStore;
    var SyncResource;
    (function (SyncResource) {
        SyncResource["Settings"] = "settings";
        SyncResource["Keybindings"] = "keybindings";
        SyncResource["Snippets"] = "snippets";
        SyncResource["Extensions"] = "extensions";
        SyncResource["GlobalState"] = "globalState";
    })(SyncResource = exports.SyncResource || (exports.SyncResource = {}));
    exports.ALL_SYNC_RESOURCES = ["settings" /* Settings */, "keybindings" /* Keybindings */, "snippets" /* Snippets */, "extensions" /* Extensions */, "globalState" /* GlobalState */];
    exports.IUserDataSyncStoreService = instantiation_1.createDecorator('IUserDataSyncStoreService');
    exports.IUserDataSyncBackupStoreService = instantiation_1.createDecorator('IUserDataSyncBackupStoreService');
    //#endregion
    // #region User Data Sync Error
    var UserDataSyncErrorCode;
    (function (UserDataSyncErrorCode) {
        // Client Errors (>= 400 )
        UserDataSyncErrorCode["Unauthorized"] = "Unauthorized";
        UserDataSyncErrorCode["Gone"] = "Gone";
        UserDataSyncErrorCode["PreconditionFailed"] = "PreconditionFailed";
        UserDataSyncErrorCode["TooLarge"] = "TooLarge";
        UserDataSyncErrorCode["UpgradeRequired"] = "UpgradeRequired";
        UserDataSyncErrorCode["PreconditionRequired"] = "PreconditionRequired";
        UserDataSyncErrorCode["TooManyRequests"] = "RemoteTooManyRequests";
        // Local Errors
        UserDataSyncErrorCode["ConnectionRefused"] = "ConnectionRefused";
        UserDataSyncErrorCode["NoRef"] = "NoRef";
        UserDataSyncErrorCode["TurnedOff"] = "TurnedOff";
        UserDataSyncErrorCode["SessionExpired"] = "SessionExpired";
        UserDataSyncErrorCode["LocalTooManyRequests"] = "LocalTooManyRequests";
        UserDataSyncErrorCode["LocalPreconditionFailed"] = "LocalPreconditionFailed";
        UserDataSyncErrorCode["LocalInvalidContent"] = "LocalInvalidContent";
        UserDataSyncErrorCode["LocalError"] = "LocalError";
        UserDataSyncErrorCode["Incompatible"] = "Incompatible";
        UserDataSyncErrorCode["Unknown"] = "Unknown";
    })(UserDataSyncErrorCode = exports.UserDataSyncErrorCode || (exports.UserDataSyncErrorCode = {}));
    class UserDataSyncError extends Error {
        constructor(message, code, resource) {
            super(message);
            this.code = code;
            this.resource = resource;
            this.name = `${this.code} (UserDataSyncError) ${this.resource || ''}`;
        }
        static toUserDataSyncError(error) {
            if (error instanceof UserDataSyncError) {
                return error;
            }
            const match = /^(.+) \(UserDataSyncError\) (.+)?$/.exec(error.name);
            if (match && match[1]) {
                return new UserDataSyncError(error.message, match[1], match[2]);
            }
            return new UserDataSyncError(error.message, UserDataSyncErrorCode.Unknown);
        }
    }
    exports.UserDataSyncError = UserDataSyncError;
    class UserDataSyncStoreError extends UserDataSyncError {
        constructor(message, code) {
            super(message, code);
        }
    }
    exports.UserDataSyncStoreError = UserDataSyncStoreError;
    class UserDataAutoSyncError extends UserDataSyncError {
        constructor(message, code) {
            super(message, code);
        }
    }
    exports.UserDataAutoSyncError = UserDataAutoSyncError;
    var SyncStatus;
    (function (SyncStatus) {
        SyncStatus["Uninitialized"] = "uninitialized";
        SyncStatus["Idle"] = "idle";
        SyncStatus["Syncing"] = "syncing";
        SyncStatus["HasConflicts"] = "hasConflicts";
    })(SyncStatus = exports.SyncStatus || (exports.SyncStatus = {}));
    //#endregion
    // #region User Data Sync Services
    exports.IUserDataSyncResourceEnablementService = instantiation_1.createDecorator('IUserDataSyncResourceEnablementService');
    exports.IUserDataSyncService = instantiation_1.createDecorator('IUserDataSyncService');
    exports.IUserDataAutoSyncService = instantiation_1.createDecorator('IUserDataAutoSyncService');
    exports.IUserDataSyncUtilService = instantiation_1.createDecorator('IUserDataSyncUtilService');
    exports.IUserDataSyncLogService = instantiation_1.createDecorator('IUserDataSyncLogService');
    //#endregion
    exports.USER_DATA_SYNC_SCHEME = 'vscode-userdata-sync';
    exports.PREVIEW_DIR_NAME = 'preview';
    function getSyncResourceFromLocalPreview(localPreview, environmentService) {
        if (localPreview.scheme === exports.USER_DATA_SYNC_SCHEME) {
            return undefined;
        }
        localPreview = localPreview.with({ scheme: environmentService.userDataSyncHome.scheme });
        return exports.ALL_SYNC_RESOURCES.filter(syncResource => resources_1.isEqualOrParent(localPreview, resources_1.joinPath(environmentService.userDataSyncHome, syncResource, exports.PREVIEW_DIR_NAME)))[0];
    }
    exports.getSyncResourceFromLocalPreview = getSyncResourceFromLocalPreview;
});
//# __sourceMappingURL=userDataSync.js.map