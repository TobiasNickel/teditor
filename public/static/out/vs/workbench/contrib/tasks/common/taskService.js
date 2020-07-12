/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USER_TASKS_GROUP_KEY = exports.ITaskService = void 0;
    exports.ITaskService = instantiation_1.createDecorator('taskService');
    exports.USER_TASKS_GROUP_KEY = 'settings';
});
//# __sourceMappingURL=taskService.js.map