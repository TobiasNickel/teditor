/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/nls"], function (require, exports, instantiation_1, contextkey_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SHOW_SYNCED_DATA_COMMAND_ID = exports.SHOW_SYNC_LOG_COMMAND_ID = exports.CONFIGURE_SYNC_COMMAND_ID = exports.ENABLE_SYNC_VIEWS_COMMAND_ID = exports.CONTEXT_ENABLE_VIEWS = exports.CONTEXT_ACCOUNT_STATE = exports.CONTEXT_SYNC_ENABLEMENT = exports.CONTEXT_SYNC_STATE = exports.AccountStatus = exports.getSyncAreaLabel = exports.IUserDataSyncWorkbenchService = void 0;
    exports.IUserDataSyncWorkbenchService = instantiation_1.createDecorator('IUserDataSyncWorkbenchService');
    function getSyncAreaLabel(source) {
        switch (source) {
            case "settings" /* Settings */: return nls_1.localize('settings', "Settings");
            case "keybindings" /* Keybindings */: return nls_1.localize('keybindings', "Keyboard Shortcuts");
            case "snippets" /* Snippets */: return nls_1.localize('snippets', "User Snippets");
            case "extensions" /* Extensions */: return nls_1.localize('extensions', "Extensions");
            case "globalState" /* GlobalState */: return nls_1.localize('ui state label', "UI State");
        }
    }
    exports.getSyncAreaLabel = getSyncAreaLabel;
    var AccountStatus;
    (function (AccountStatus) {
        AccountStatus["Uninitialized"] = "uninitialized";
        AccountStatus["Unavailable"] = "unavailable";
        AccountStatus["Available"] = "available";
    })(AccountStatus = exports.AccountStatus || (exports.AccountStatus = {}));
    // Contexts
    exports.CONTEXT_SYNC_STATE = new contextkey_1.RawContextKey('syncStatus', "uninitialized" /* Uninitialized */);
    exports.CONTEXT_SYNC_ENABLEMENT = new contextkey_1.RawContextKey('syncEnabled', false);
    exports.CONTEXT_ACCOUNT_STATE = new contextkey_1.RawContextKey('userDataSyncAccountStatus', "uninitialized" /* Uninitialized */);
    exports.CONTEXT_ENABLE_VIEWS = new contextkey_1.RawContextKey(`showUserDataSyncViews`, false);
    // Commands
    exports.ENABLE_SYNC_VIEWS_COMMAND_ID = 'workbench.userDataSync.actions.enableViews';
    exports.CONFIGURE_SYNC_COMMAND_ID = 'workbench.userDataSync.actions.configure';
    exports.SHOW_SYNC_LOG_COMMAND_ID = 'workbench.userDataSync.actions.showLog';
    exports.SHOW_SYNCED_DATA_COMMAND_ID = 'workbench.userDataSync.actions.showSyncedData';
});
//# __sourceMappingURL=userDataSync.js.map