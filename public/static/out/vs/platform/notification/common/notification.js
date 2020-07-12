/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/platform/instantiation/common/instantiation", "vs/base/common/event"], function (require, exports, severity_1, instantiation_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoOpProgress = exports.NoOpNotification = exports.NotificationsFilter = exports.NeverShowAgainScope = exports.INotificationService = exports.Severity = void 0;
    exports.Severity = severity_1.default;
    exports.INotificationService = instantiation_1.createDecorator('notificationService');
    var NeverShowAgainScope;
    (function (NeverShowAgainScope) {
        /**
         * Will never show this notification on the current workspace again.
         */
        NeverShowAgainScope[NeverShowAgainScope["WORKSPACE"] = 0] = "WORKSPACE";
        /**
         * Will never show this notification on any workspace again.
         */
        NeverShowAgainScope[NeverShowAgainScope["GLOBAL"] = 1] = "GLOBAL";
    })(NeverShowAgainScope = exports.NeverShowAgainScope || (exports.NeverShowAgainScope = {}));
    var NotificationsFilter;
    (function (NotificationsFilter) {
        /**
         * No filter is enabled.
         */
        NotificationsFilter[NotificationsFilter["OFF"] = 0] = "OFF";
        /**
         * All notifications are configured as silent. See
         * `INotificationProperties.silent` for more info.
         */
        NotificationsFilter[NotificationsFilter["SILENT"] = 1] = "SILENT";
        /**
         * All notifications are silent except error notifications.
        */
        NotificationsFilter[NotificationsFilter["ERROR"] = 2] = "ERROR";
    })(NotificationsFilter = exports.NotificationsFilter || (exports.NotificationsFilter = {}));
    class NoOpNotification {
        constructor() {
            this.progress = new NoOpProgress();
            this.onDidClose = event_1.Event.None;
            this.onDidChangeVisibility = event_1.Event.None;
        }
        updateSeverity(severity) { }
        updateMessage(message) { }
        updateActions(actions) { }
        close() { }
    }
    exports.NoOpNotification = NoOpNotification;
    class NoOpProgress {
        infinite() { }
        done() { }
        total(value) { }
        worked(value) { }
    }
    exports.NoOpProgress = NoOpProgress;
});
//# __sourceMappingURL=notification.js.map