/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskExecuteKind = exports.Triggers = exports.TaskError = exports.TaskErrors = void 0;
    var TaskErrors;
    (function (TaskErrors) {
        TaskErrors[TaskErrors["NotConfigured"] = 0] = "NotConfigured";
        TaskErrors[TaskErrors["RunningTask"] = 1] = "RunningTask";
        TaskErrors[TaskErrors["NoBuildTask"] = 2] = "NoBuildTask";
        TaskErrors[TaskErrors["NoTestTask"] = 3] = "NoTestTask";
        TaskErrors[TaskErrors["ConfigValidationError"] = 4] = "ConfigValidationError";
        TaskErrors[TaskErrors["TaskNotFound"] = 5] = "TaskNotFound";
        TaskErrors[TaskErrors["NoValidTaskRunner"] = 6] = "NoValidTaskRunner";
        TaskErrors[TaskErrors["UnknownError"] = 7] = "UnknownError";
    })(TaskErrors = exports.TaskErrors || (exports.TaskErrors = {}));
    class TaskError {
        constructor(severity, message, code) {
            this.severity = severity;
            this.message = message;
            this.code = code;
        }
    }
    exports.TaskError = TaskError;
    var Triggers;
    (function (Triggers) {
        Triggers.shortcut = 'shortcut';
        Triggers.command = 'command';
    })(Triggers = exports.Triggers || (exports.Triggers = {}));
    var TaskExecuteKind;
    (function (TaskExecuteKind) {
        TaskExecuteKind[TaskExecuteKind["Started"] = 1] = "Started";
        TaskExecuteKind[TaskExecuteKind["Active"] = 2] = "Active";
    })(TaskExecuteKind = exports.TaskExecuteKind || (exports.TaskExecuteKind = {}));
});
//# __sourceMappingURL=taskSystem.js.map