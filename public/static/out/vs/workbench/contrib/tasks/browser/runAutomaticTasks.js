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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/contrib/tasks/common/taskService", "vs/base/common/collections", "vs/workbench/contrib/tasks/common/tasks", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls, lifecycle_1, taskService_1, collections_1, tasks_1, storage_1, notification_1, actions_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageAutomaticTaskRunning = exports.RunAutomaticTasks = void 0;
    const ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE = 'tasks.run.allowAutomatic';
    let RunAutomaticTasks = class RunAutomaticTasks extends lifecycle_1.Disposable {
        constructor(taskService, storageService) {
            super();
            this.taskService = taskService;
            const isFolderAutomaticAllowed = storageService.getBoolean(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, 1 /* WORKSPACE */, undefined);
            this.tryRunTasks(isFolderAutomaticAllowed);
        }
        tryRunTasks(isAllowed) {
            // Only run if allowed. Prompting for permission occurs when a user first tries to run a task.
            if (isAllowed === true) {
                this.taskService.getWorkspaceTasks(2 /* FolderOpen */).then(workspaceTaskResult => {
                    let { tasks } = RunAutomaticTasks.findAutoTasks(this.taskService, workspaceTaskResult);
                    if (tasks.length > 0) {
                        RunAutomaticTasks.runTasks(this.taskService, tasks);
                    }
                });
            }
        }
        static runTasks(taskService, tasks) {
            tasks.forEach(task => {
                if (task instanceof Promise) {
                    task.then(promiseResult => {
                        if (promiseResult) {
                            taskService.run(promiseResult);
                        }
                    });
                }
                else {
                    taskService.run(task);
                }
            });
        }
        static findAutoTasks(taskService, workspaceTaskResult) {
            const tasks = new Array();
            const taskNames = new Array();
            if (workspaceTaskResult) {
                workspaceTaskResult.forEach(resultElement => {
                    if (resultElement.set) {
                        resultElement.set.tasks.forEach(task => {
                            if (task.runOptions.runOn === tasks_1.RunOnOptions.folderOpen) {
                                tasks.push(task);
                                taskNames.push(task._label);
                            }
                        });
                    }
                    if (resultElement.configurations) {
                        collections_1.forEach(resultElement.configurations.byIdentifier, (configedTask) => {
                            if (configedTask.value.runOptions.runOn === tasks_1.RunOnOptions.folderOpen) {
                                tasks.push(new Promise(resolve => {
                                    taskService.getTask(resultElement.workspaceFolder, configedTask.value._id, true).then(task => resolve(task));
                                }));
                                if (configedTask.value._label) {
                                    taskNames.push(configedTask.value._label);
                                }
                                else {
                                    taskNames.push(configedTask.value.configures.task);
                                }
                            }
                        });
                    }
                });
            }
            return { tasks, taskNames };
        }
        static promptForPermission(taskService, storageService, notificationService, workspaceTaskResult) {
            const isFolderAutomaticAllowed = storageService.getBoolean(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, 1 /* WORKSPACE */, undefined);
            if (isFolderAutomaticAllowed !== undefined) {
                return;
            }
            let { tasks, taskNames } = RunAutomaticTasks.findAutoTasks(taskService, workspaceTaskResult);
            if (taskNames.length > 0) {
                // We have automatic tasks, prompt to allow.
                this.showPrompt(notificationService, storageService, taskService, taskNames).then(allow => {
                    if (allow) {
                        RunAutomaticTasks.runTasks(taskService, tasks);
                    }
                });
            }
        }
        static showPrompt(notificationService, storageService, taskService, taskNames) {
            return new Promise(resolve => {
                notificationService.prompt(notification_1.Severity.Info, nls.localize('tasks.run.allowAutomatic', "This folder has tasks ({0}) defined in \'tasks.json\' that run automatically when you open this folder. Do you allow automatic tasks to run when you open this folder?", taskNames.join(', ')), [{
                        label: nls.localize('allow', "Allow and run"),
                        run: () => {
                            resolve(true);
                            storageService.store(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, true, 1 /* WORKSPACE */);
                        }
                    },
                    {
                        label: nls.localize('disallow', "Disallow"),
                        run: () => {
                            resolve(false);
                            storageService.store(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, false, 1 /* WORKSPACE */);
                        }
                    },
                    {
                        label: nls.localize('openTasks', "Open tasks.json"),
                        run: () => {
                            taskService.openConfig(undefined);
                            resolve(false);
                        }
                    }]);
            });
        }
    };
    RunAutomaticTasks = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, storage_1.IStorageService)
    ], RunAutomaticTasks);
    exports.RunAutomaticTasks = RunAutomaticTasks;
    let ManageAutomaticTaskRunning = class ManageAutomaticTaskRunning extends actions_1.Action {
        constructor(id, label, storageService, quickInputService) {
            super(id, label);
            this.storageService = storageService;
            this.quickInputService = quickInputService;
        }
        async run() {
            const allowItem = { label: nls.localize('workbench.action.tasks.allowAutomaticTasks', "Allow Automatic Tasks in Folder") };
            const disallowItem = { label: nls.localize('workbench.action.tasks.disallowAutomaticTasks', "Disallow Automatic Tasks in Folder") };
            const value = await this.quickInputService.pick([allowItem, disallowItem], { canPickMany: false });
            if (!value) {
                return;
            }
            this.storageService.store(ARE_AUTOMATIC_TASKS_ALLOWED_IN_WORKSPACE, value === allowItem, 1 /* WORKSPACE */);
        }
    };
    ManageAutomaticTaskRunning.ID = 'workbench.action.tasks.manageAutomaticRunning';
    ManageAutomaticTaskRunning.LABEL = nls.localize('workbench.action.tasks.manageAutomaticRunning', "Manage Automatic Tasks in Folder");
    ManageAutomaticTaskRunning = __decorate([
        __param(2, storage_1.IStorageService),
        __param(3, quickInput_1.IQuickInputService)
    ], ManageAutomaticTaskRunning);
    exports.ManageAutomaticTaskRunning = ManageAutomaticTaskRunning;
});
//# __sourceMappingURL=runAutomaticTasks.js.map