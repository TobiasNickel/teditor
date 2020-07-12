/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/tasks/common/tasks", "./terminalTaskSystem", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, tasks_1, terminalTaskSystem_1, abstractTaskService_1, taskService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskService = void 0;
    class TaskService extends abstractTaskService_1.AbstractTaskService {
        getTaskSystem() {
            if (this._taskSystem) {
                return this._taskSystem;
            }
            if (this.executionEngine === tasks_1.ExecutionEngine.Terminal) {
                this._taskSystem = this.createTerminalTaskSystem();
            }
            else {
                throw new Error(TaskService.ProcessTaskSystemSupportMessage);
            }
            this._taskSystemListener = this._taskSystem.onDidStateChange((event) => {
                if (this._taskSystem) {
                    this._taskRunningState.set(this._taskSystem.isActiveSync());
                }
                this._onDidStateChange.fire(event);
            });
            return this._taskSystem;
        }
        updateWorkspaceTasks(runSource = 1 /* User */) {
            this._workspaceTasksPromise = this.computeWorkspaceTasks(runSource).then(value => {
                if (this.executionEngine !== tasks_1.ExecutionEngine.Terminal || ((this._taskSystem !== undefined) && !(this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem))) {
                    throw new Error(TaskService.ProcessTaskSystemSupportMessage);
                }
                return value;
            });
        }
        computeLegacyConfiguration(workspaceFolder) {
            throw new Error(TaskService.ProcessTaskSystemSupportMessage);
        }
        versionAndEngineCompatible(filter) {
            return this.executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
    }
    exports.TaskService = TaskService;
    TaskService.ProcessTaskSystemSupportMessage = nls.localize('taskService.processTaskSystem', 'Process task system is not support in the web.');
    extensions_1.registerSingleton(taskService_1.ITaskService, TaskService, true);
});
//# __sourceMappingURL=taskService.js.map