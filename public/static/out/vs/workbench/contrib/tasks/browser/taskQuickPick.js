/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/workbench/contrib/tasks/common/tasks", "vs/base/common/types", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, nls, Objects, tasks_1, Types, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskQuickPick = exports.isWorkspaceFolder = exports.QUICKOPEN_SKIP_CONFIG = exports.QUICKOPEN_DETAIL_CONFIG = void 0;
    exports.QUICKOPEN_DETAIL_CONFIG = 'task.quickOpen.detail';
    exports.QUICKOPEN_SKIP_CONFIG = 'task.quickOpen.skip';
    function isWorkspaceFolder(folder) {
        return 'uri' in folder;
    }
    exports.isWorkspaceFolder = isWorkspaceFolder;
    const SHOW_ALL = nls.localize('taskQuickPick.showAll', "Show All Tasks...");
    class TaskQuickPick extends lifecycle_1.Disposable {
        constructor(taskService, configurationService, quickInputService, notificationService) {
            super();
            this.taskService = taskService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.sorter = this.taskService.createSorter();
        }
        showDetail() {
            return this.configurationService.getValue(exports.QUICKOPEN_DETAIL_CONFIG);
        }
        guessTaskLabel(task) {
            if (task._label) {
                return task._label;
            }
            if (tasks_1.ConfiguringTask.is(task)) {
                let label = task.configures.type;
                const configures = Objects.deepClone(task.configures);
                delete configures['_key'];
                delete configures['type'];
                Object.keys(configures).forEach(key => label += `: ${configures[key]}`);
                return label;
            }
            return '';
        }
        createTaskEntry(task) {
            const entry = { label: this.guessTaskLabel(task), description: this.taskService.getTaskDescription(task), task, detail: this.showDetail() ? task.configurationProperties.detail : undefined };
            entry.buttons = [{ iconClass: 'codicon-gear', tooltip: nls.localize('configureTask', "Configure Task") }];
            return entry;
        }
        createEntriesForGroup(entries, tasks, groupLabel) {
            entries.push({ type: 'separator', label: groupLabel });
            tasks.forEach(task => {
                entries.push(this.createTaskEntry(task));
            });
        }
        createTypeEntries(entries, types) {
            entries.push({ type: 'separator', label: nls.localize('contributedTasks', "contributed") });
            types.forEach(type => {
                entries.push({ label: `$(folder) ${type}`, task: type, ariaLabel: nls.localize('taskType', "All {0} tasks", type) });
            });
            entries.push({ label: SHOW_ALL, task: SHOW_ALL, alwaysShow: true });
        }
        handleFolderTaskResult(result) {
            let tasks = [];
            Array.from(result).forEach(([key, folderTasks]) => {
                if (folderTasks.set) {
                    tasks.push(...folderTasks.set.tasks);
                }
                if (folderTasks.configurations) {
                    for (const configuration in folderTasks.configurations.byIdentifier) {
                        tasks.push(folderTasks.configurations.byIdentifier[configuration]);
                    }
                }
            });
            return tasks;
        }
        dedupeConfiguredAndRecent(recentTasks, configuredTasks) {
            var _a, _b;
            let dedupedConfiguredTasks = [];
            const foundRecentTasks = Array(recentTasks.length).fill(false);
            for (let j = 0; j < configuredTasks.length; j++) {
                const workspaceFolder = (_a = configuredTasks[j].getWorkspaceFolder()) === null || _a === void 0 ? void 0 : _a.uri.toString();
                const definition = (_b = configuredTasks[j].getDefinition()) === null || _b === void 0 ? void 0 : _b._key;
                const type = configuredTasks[j].type;
                const label = configuredTasks[j]._label;
                const recentKey = configuredTasks[j].getRecentlyUsedKey();
                const findIndex = recentTasks.findIndex((value) => {
                    var _a, _b;
                    return (workspaceFolder && definition && ((_a = value.getWorkspaceFolder()) === null || _a === void 0 ? void 0 : _a.uri.toString()) === workspaceFolder
                        && ((((_b = value.getDefinition()) === null || _b === void 0 ? void 0 : _b._key) === definition) || (value.type === type && value._label === label)))
                        || (recentKey && value.getRecentlyUsedKey() === recentKey);
                });
                if (findIndex === -1) {
                    dedupedConfiguredTasks.push(configuredTasks[j]);
                }
                else {
                    recentTasks[findIndex] = configuredTasks[j];
                    foundRecentTasks[findIndex] = true;
                }
            }
            dedupedConfiguredTasks = dedupedConfiguredTasks.sort((a, b) => this.sorter.compare(a, b));
            const prunedRecentTasks = [];
            for (let i = 0; i < recentTasks.length; i++) {
                if (foundRecentTasks[i] || tasks_1.ConfiguringTask.is(recentTasks[i])) {
                    prunedRecentTasks.push(recentTasks[i]);
                }
            }
            return { configuredTasks: dedupedConfiguredTasks, recentTasks: prunedRecentTasks };
        }
        async getTopLevelEntries(defaultEntry) {
            if (this.topLevelEntries !== undefined) {
                return { entries: this.topLevelEntries };
            }
            let recentTasks = (await this.taskService.readRecentTasks()).reverse();
            const configuredTasks = this.handleFolderTaskResult(await this.taskService.getWorkspaceTasks());
            const extensionTaskTypes = this.taskService.taskTypes();
            this.topLevelEntries = [];
            // Dedupe will update recent tasks if they've changed in tasks.json.
            const dedupeAndPrune = this.dedupeConfiguredAndRecent(recentTasks, configuredTasks);
            let dedupedConfiguredTasks = dedupeAndPrune.configuredTasks;
            recentTasks = dedupeAndPrune.recentTasks;
            if (recentTasks.length > 0) {
                this.createEntriesForGroup(this.topLevelEntries, recentTasks, nls.localize('recentlyUsed', 'recently used'));
            }
            if (configuredTasks.length > 0) {
                if (dedupedConfiguredTasks.length > 0) {
                    this.createEntriesForGroup(this.topLevelEntries, dedupedConfiguredTasks, nls.localize('configured', 'configured'));
                }
            }
            if (defaultEntry && (configuredTasks.length === 0)) {
                this.topLevelEntries.push({ type: 'separator', label: nls.localize('configured', 'configured') });
                this.topLevelEntries.push(defaultEntry);
            }
            if (extensionTaskTypes.length > 0) {
                this.createTypeEntries(this.topLevelEntries, extensionTaskTypes);
            }
            return { entries: this.topLevelEntries, isSingleConfigured: configuredTasks.length === 1 ? configuredTasks[0] : undefined };
        }
        async show(placeHolder, defaultEntry, startAtType) {
            const picker = this.quickInputService.createQuickPick();
            picker.placeholder = placeHolder;
            picker.matchOnDescription = true;
            picker.ignoreFocusOut = false;
            picker.show();
            picker.onDidTriggerItemButton(async (context) => {
                let task = context.item.task;
                this.quickInputService.cancel();
                if (tasks_1.ContributedTask.is(task)) {
                    this.taskService.customize(task, undefined, true);
                }
                else if (tasks_1.CustomTask.is(task) || tasks_1.ConfiguringTask.is(task)) {
                    if (!(await this.taskService.openConfig(task))) {
                        this.taskService.customize(task, undefined, true);
                    }
                }
            });
            let firstLevelTask = startAtType;
            if (!firstLevelTask) {
                // First show recent tasks configured tasks. Other tasks will be available at a second level
                const topLevelEntriesResult = await this.getTopLevelEntries(defaultEntry);
                if (topLevelEntriesResult.isSingleConfigured && this.configurationService.getValue(exports.QUICKOPEN_SKIP_CONFIG)) {
                    picker.dispose();
                    return this.toTask(topLevelEntriesResult.isSingleConfigured);
                }
                const taskQuickPickEntries = topLevelEntriesResult.entries;
                firstLevelTask = await this.doPickerFirstLevel(picker, taskQuickPickEntries);
            }
            do {
                if (Types.isString(firstLevelTask)) {
                    // Proceed to second level of quick pick
                    const selectedEntry = await this.doPickerSecondLevel(picker, firstLevelTask);
                    if (selectedEntry && selectedEntry.task === null) {
                        // The user has chosen to go back to the first level
                        firstLevelTask = await this.doPickerFirstLevel(picker, (await this.getTopLevelEntries(defaultEntry)).entries);
                    }
                    else {
                        picker.dispose();
                        return ((selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.task) && !Types.isString(selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.task)) ? this.toTask(selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.task) : undefined;
                    }
                }
                else if (firstLevelTask) {
                    picker.dispose();
                    return this.toTask(firstLevelTask);
                }
                else {
                    picker.dispose();
                    return firstLevelTask;
                }
            } while (1);
            return;
        }
        async doPickerFirstLevel(picker, taskQuickPickEntries) {
            picker.items = taskQuickPickEntries;
            const firstLevelPickerResult = await new Promise(resolve => {
                event_1.Event.once(picker.onDidAccept)(async () => {
                    resolve(picker.selectedItems ? picker.selectedItems[0] : undefined);
                });
            });
            return firstLevelPickerResult === null || firstLevelPickerResult === void 0 ? void 0 : firstLevelPickerResult.task;
        }
        async doPickerSecondLevel(picker, type) {
            picker.busy = true;
            picker.value = '';
            if (type === SHOW_ALL) {
                picker.items = (await this.taskService.tasks()).sort((a, b) => this.sorter.compare(a, b)).map(task => this.createTaskEntry(task));
            }
            else {
                picker.items = await this.getEntriesForProvider(type);
            }
            picker.busy = false;
            const secondLevelPickerResult = await new Promise(resolve => {
                event_1.Event.once(picker.onDidAccept)(async () => {
                    resolve(picker.selectedItems ? picker.selectedItems[0] : undefined);
                });
            });
            return secondLevelPickerResult;
        }
        async getEntriesForProvider(type) {
            const tasks = (await this.taskService.tasks({ type })).sort((a, b) => this.sorter.compare(a, b));
            let taskQuickPickEntries;
            if (tasks.length > 0) {
                taskQuickPickEntries = tasks.map(task => this.createTaskEntry(task));
                taskQuickPickEntries.push({
                    type: 'separator'
                }, {
                    label: nls.localize('TaskQuickPick.goBack', 'Go back ↩'),
                    task: null,
                    alwaysShow: true
                });
            }
            else {
                taskQuickPickEntries = [{
                        label: nls.localize('TaskQuickPick.noTasksForType', 'No {0} tasks found. Go back ↩', type),
                        task: null,
                        alwaysShow: true
                    }];
            }
            return taskQuickPickEntries;
        }
        async toTask(task) {
            if (!tasks_1.ConfiguringTask.is(task)) {
                return task;
            }
            const resolvedTask = await this.taskService.tryResolveTask(task);
            if (!resolvedTask) {
                this.notificationService.error(nls.localize('noProviderForTask', "There is no task provider registered for tasks of type \"{0}\".", task.type));
            }
            return resolvedTask;
        }
        static async show(taskService, configurationService, quickInputService, notificationService, placeHolder, defaultEntry) {
            const taskQuickPick = new TaskQuickPick(taskService, configurationService, quickInputService, notificationService);
            return taskQuickPick.show(placeHolder, defaultEntry);
        }
    }
    exports.TaskQuickPick = TaskQuickPick;
});
//# __sourceMappingURL=taskQuickPick.js.map