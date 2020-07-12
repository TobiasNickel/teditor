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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/filters", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/browser/taskQuickPick", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/platform/notification/common/notification"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, filters_1, extensions_1, taskService_1, tasks_1, taskQuickPick_1, configuration_1, types_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TasksQuickAccessProvider = void 0;
    let TasksQuickAccessProvider = class TasksQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(extensionService, taskService, configurationService, quickInputService, notificationService) {
            super(TasksQuickAccessProvider.PREFIX, {
                noResultsPick: {
                    label: nls_1.localize('noTaskResults', "No matching tasks")
                }
            });
            this.taskService = taskService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.activationPromise = extensionService.activateByEvent('onCommand:workbench.action.tasks.runTask');
        }
        async getPicks(filter, disposables, token) {
            // always await extensions
            await this.activationPromise;
            if (token.isCancellationRequested) {
                return [];
            }
            const taskQuickPick = new taskQuickPick_1.TaskQuickPick(this.taskService, this.configurationService, this.quickInputService, this.notificationService);
            const topLevelPicks = await taskQuickPick.getTopLevelEntries();
            const taskPicks = [];
            for (const entry of topLevelPicks.entries) {
                const highlights = filters_1.matchesFuzzy(filter, entry.label);
                if (!highlights) {
                    continue;
                }
                if (entry.type === 'separator') {
                    taskPicks.push(entry);
                }
                const task = entry.task;
                const quickAccessEntry = entry;
                quickAccessEntry.highlights = { label: highlights };
                quickAccessEntry.trigger = () => {
                    if (tasks_1.ContributedTask.is(task)) {
                        this.taskService.customize(task, undefined, true);
                    }
                    else if (tasks_1.CustomTask.is(task)) {
                        this.taskService.openConfig(task);
                    }
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                };
                quickAccessEntry.accept = async () => {
                    if (types_1.isString(task)) {
                        // switch to quick pick and show second level
                        const showResult = await taskQuickPick.show(nls_1.localize('TaskService.pickRunTask', 'Select the task to run'), undefined, task);
                        if (showResult) {
                            this.taskService.run(showResult, { attachProblemMatcher: true });
                        }
                    }
                    else {
                        this.taskService.run(await this.toTask(task), { attachProblemMatcher: true });
                    }
                };
                taskPicks.push(quickAccessEntry);
            }
            return taskPicks;
        }
        async toTask(task) {
            if (!tasks_1.ConfiguringTask.is(task)) {
                return task;
            }
            return this.taskService.tryResolveTask(task);
        }
    };
    TasksQuickAccessProvider.PREFIX = 'task ';
    TasksQuickAccessProvider = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, taskService_1.ITaskService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService)
    ], TasksQuickAccessProvider);
    exports.TasksQuickAccessProvider = TasksQuickAccessProvider;
});
//# __sourceMappingURL=tasksQuickAccess.js.map