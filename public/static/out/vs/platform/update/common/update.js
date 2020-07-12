/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IUpdateService = exports.State = exports.UpdateType = exports.StateType = void 0;
    /**
     * Updates are run as a state machine:
     *
     *      Uninitialized
     *           ↓
     *          Idle
     *          ↓  ↑
     *   Checking for Updates  →  Available for Download
     *         ↓
     *     Downloading  →   Ready
     *         ↓               ↑
     *     Downloaded   →  Updating
     *
     * Available: There is an update available for download (linux).
     * Ready: Code will be updated as soon as it restarts (win32, darwin).
     * Donwloaded: There is an update ready to be installed in the background (win32).
     */
    var StateType;
    (function (StateType) {
        StateType["Uninitialized"] = "uninitialized";
        StateType["Idle"] = "idle";
        StateType["CheckingForUpdates"] = "checking for updates";
        StateType["AvailableForDownload"] = "available for download";
        StateType["Downloading"] = "downloading";
        StateType["Downloaded"] = "downloaded";
        StateType["Updating"] = "updating";
        StateType["Ready"] = "ready";
    })(StateType = exports.StateType || (exports.StateType = {}));
    var UpdateType;
    (function (UpdateType) {
        UpdateType[UpdateType["Setup"] = 0] = "Setup";
        UpdateType[UpdateType["Archive"] = 1] = "Archive";
        UpdateType[UpdateType["Snap"] = 2] = "Snap";
    })(UpdateType = exports.UpdateType || (exports.UpdateType = {}));
    exports.State = {
        Uninitialized: { type: "uninitialized" /* Uninitialized */ },
        Idle: (updateType, error) => ({ type: "idle" /* Idle */, updateType, error }),
        CheckingForUpdates: (context) => ({ type: "checking for updates" /* CheckingForUpdates */, context }),
        AvailableForDownload: (update) => ({ type: "available for download" /* AvailableForDownload */, update }),
        Downloading: (update) => ({ type: "downloading" /* Downloading */, update }),
        Downloaded: (update) => ({ type: "downloaded" /* Downloaded */, update }),
        Updating: (update) => ({ type: "updating" /* Updating */, update }),
        Ready: (update) => ({ type: "ready" /* Ready */, update }),
    };
    exports.IUpdateService = instantiation_1.createDecorator('updateService');
});
//# __sourceMappingURL=update.js.map