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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/collections", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/configurationResolver/common/configurationResolver"], function (require, exports, nls, uri_1, uuid_1, Objects, Types, Platform, collections_1, workspace_1, tasks_1, taskService_1, extHostCustomers_1, extHost_protocol_1, configurationResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTask = void 0;
    var TaskExecutionDTO;
    (function (TaskExecutionDTO) {
        function from(value) {
            return {
                id: value.id,
                task: TaskDTO.from(value.task)
            };
        }
        TaskExecutionDTO.from = from;
    })(TaskExecutionDTO || (TaskExecutionDTO = {}));
    var TaskProcessStartedDTO;
    (function (TaskProcessStartedDTO) {
        function from(value, processId) {
            return {
                id: value.id,
                processId
            };
        }
        TaskProcessStartedDTO.from = from;
    })(TaskProcessStartedDTO || (TaskProcessStartedDTO = {}));
    var TaskProcessEndedDTO;
    (function (TaskProcessEndedDTO) {
        function from(value, exitCode) {
            return {
                id: value.id,
                exitCode
            };
        }
        TaskProcessEndedDTO.from = from;
    })(TaskProcessEndedDTO || (TaskProcessEndedDTO = {}));
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            const result = Objects.assign(Object.create(null), value);
            delete result._key;
            return result;
        }
        TaskDefinitionDTO.from = from;
        function to(value, executeOnly) {
            let result = tasks_1.TaskDefinition.createTaskIdentifier(value, console);
            if (result === undefined && executeOnly) {
                result = {
                    _key: uuid_1.generateUuid(),
                    type: '$executeOnly'
                };
            }
            return result;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO || (TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return Objects.assign(Object.create(null), value);
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.PresentationOptions.defaults;
            }
            return Objects.assign(Object.create(null), tasks_1.PresentationOptions.defaults, value);
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO || (TaskPresentationOptionsDTO = {}));
    var RunOptionsDTO;
    (function (RunOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return Objects.assign(Object.create(null), value);
        }
        RunOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.RunOptions.defaults;
            }
            return Objects.assign(Object.create(null), tasks_1.RunOptions.defaults, value);
        }
        RunOptionsDTO.to = to;
    })(RunOptionsDTO || (RunOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return {
                cwd: value.cwd,
                env: value.env
            };
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.CommandOptions.defaults;
            }
            return {
                cwd: value.cwd || tasks_1.CommandOptions.defaults.cwd,
                env: value.env
            };
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO || (ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && !!candidate.process;
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            const process = Types.isString(value.name) ? value.name : value.name.value;
            const args = value.args ? value.args.map(value => Types.isString(value) ? value : value.value) : [];
            const result = {
                process: process,
                args: args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            const result = {
                runtime: tasks_1.RuntimeType.Process,
                name: value.process,
                args: value.args,
                presentation: undefined
            };
            result.options = ProcessExecutionOptionsDTO.to(value.options);
            return result;
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO || (ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                cwd: value.cwd || tasks_1.CommandOptions.defaults.cwd,
                env: value.env
            };
            if (value.shell) {
                result.executable = value.shell.executable;
                result.shellArgs = value.shell.args;
                result.shellQuoting = value.shell.quoting;
            }
            return result;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                cwd: value.cwd,
                env: value.env
            };
            if (value.executable) {
                result.shell = {
                    executable: value.executable
                };
                if (value.shellArgs) {
                    result.shell.args = value.shellArgs;
                }
                if (value.shellQuoting) {
                    result.shell.quoting = value.shellQuoting;
                }
            }
            return result;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO || (ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && (!!candidate.commandLine || !!candidate.command);
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            const result = {};
            if (value.name && Types.isString(value.name) && (value.args === undefined || value.args === null || value.args.length === 0)) {
                result.commandLine = value.name;
            }
            else {
                result.command = value.name;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            const result = {
                runtime: tasks_1.RuntimeType.Shell,
                name: value.commandLine ? value.commandLine : value.command,
                args: value.args,
                presentation: undefined
            };
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.to(value.options);
            }
            return result;
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO || (ShellExecutionDTO = {}));
    var CustomExecutionDTO;
    (function (CustomExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && candidate.customExecution === 'customExecution';
        }
        CustomExecutionDTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution'
            };
        }
        CustomExecutionDTO.from = from;
        function to(value) {
            return {
                runtime: tasks_1.RuntimeType.CustomExecution,
                presentation: undefined
            };
        }
        CustomExecutionDTO.to = to;
    })(CustomExecutionDTO || (CustomExecutionDTO = {}));
    var TaskSourceDTO;
    (function (TaskSourceDTO) {
        function from(value) {
            const result = {
                label: value.label
            };
            if (value.kind === tasks_1.TaskSourceKind.Extension) {
                result.extensionId = value.extension;
                if (value.workspaceFolder) {
                    result.scope = value.workspaceFolder.uri;
                }
                else {
                    result.scope = value.scope;
                }
            }
            else if (value.kind === tasks_1.TaskSourceKind.Workspace) {
                result.extensionId = '$core';
                result.scope = value.config.workspaceFolder ? value.config.workspaceFolder.uri : 1 /* Global */;
            }
            return result;
        }
        TaskSourceDTO.from = from;
        function to(value, workspace) {
            let scope;
            let workspaceFolder;
            if ((value.scope === undefined) || ((typeof value.scope === 'number') && (value.scope !== 1 /* Global */))) {
                if (workspace.getWorkspace().folders.length === 0) {
                    scope = 1 /* Global */;
                    workspaceFolder = undefined;
                }
                else {
                    scope = 3 /* Folder */;
                    workspaceFolder = workspace.getWorkspace().folders[0];
                }
            }
            else if (typeof value.scope === 'number') {
                scope = value.scope;
            }
            else {
                scope = 3 /* Folder */;
                workspaceFolder = Types.withNullAsUndefined(workspace.getWorkspaceFolder(uri_1.URI.revive(value.scope)));
            }
            const result = {
                kind: tasks_1.TaskSourceKind.Extension,
                label: value.label,
                extension: value.extensionId,
                scope,
                workspaceFolder
            };
            return result;
        }
        TaskSourceDTO.to = to;
    })(TaskSourceDTO || (TaskSourceDTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function is(value) {
            const candidate = value;
            return candidate && Types.isString(candidate.id) && !!candidate.workspaceFolder;
        }
        TaskHandleDTO.is = is;
    })(TaskHandleDTO || (TaskHandleDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function from(task) {
            if (task === undefined || task === null || (!tasks_1.CustomTask.is(task) && !tasks_1.ContributedTask.is(task) && !tasks_1.ConfiguringTask.is(task))) {
                return undefined;
            }
            const result = {
                _id: task._id,
                name: task.configurationProperties.name,
                definition: TaskDefinitionDTO.from(task.getDefinition(true)),
                source: TaskSourceDTO.from(task._source),
                execution: undefined,
                presentationOptions: !tasks_1.ConfiguringTask.is(task) && task.command ? TaskPresentationOptionsDTO.from(task.command.presentation) : undefined,
                isBackground: task.configurationProperties.isBackground,
                problemMatchers: [],
                hasDefinedMatchers: tasks_1.ContributedTask.is(task) ? task.hasDefinedMatchers : false,
                runOptions: RunOptionsDTO.from(task.runOptions),
            };
            if (task.configurationProperties.group) {
                result.group = task.configurationProperties.group;
            }
            if (task.configurationProperties.detail) {
                result.detail = task.configurationProperties.detail;
            }
            if (!tasks_1.ConfiguringTask.is(task) && task.command) {
                if (task.command.runtime === tasks_1.RuntimeType.Process) {
                    result.execution = ProcessExecutionDTO.from(task.command);
                }
                else if (task.command.runtime === tasks_1.RuntimeType.Shell) {
                    result.execution = ShellExecutionDTO.from(task.command);
                }
            }
            if (task.configurationProperties.problemMatchers) {
                for (let matcher of task.configurationProperties.problemMatchers) {
                    if (Types.isString(matcher)) {
                        result.problemMatchers.push(matcher);
                    }
                }
            }
            return result;
        }
        TaskDTO.from = from;
        function to(task, workspace, executeOnly) {
            if (!task || (typeof task.name !== 'string')) {
                return undefined;
            }
            let command;
            if (task.execution) {
                if (ShellExecutionDTO.is(task.execution)) {
                    command = ShellExecutionDTO.to(task.execution);
                }
                else if (ProcessExecutionDTO.is(task.execution)) {
                    command = ProcessExecutionDTO.to(task.execution);
                }
                else if (CustomExecutionDTO.is(task.execution)) {
                    command = CustomExecutionDTO.to(task.execution);
                }
            }
            if (!command) {
                return undefined;
            }
            command.presentation = TaskPresentationOptionsDTO.to(task.presentationOptions);
            const source = TaskSourceDTO.to(task.source, workspace);
            const label = nls.localize('task.label', '{0}: {1}', source.label, task.name);
            const definition = TaskDefinitionDTO.to(task.definition, executeOnly);
            const id = `${task.source.extensionId}.${definition._key}`;
            const result = new tasks_1.ContributedTask(id, // uuidMap.getUUID(identifier)
            source, label, definition.type, definition, command, task.hasDefinedMatchers, RunOptionsDTO.to(task.runOptions), {
                name: task.name,
                identifier: label,
                group: task.group,
                isBackground: !!task.isBackground,
                problemMatchers: task.problemMatchers.slice(),
                detail: task.detail
            });
            return result;
        }
        TaskDTO.to = to;
    })(TaskDTO || (TaskDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            return value;
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO || (TaskFilterDTO = {}));
    let MainThreadTask = class MainThreadTask {
        constructor(extHostContext, _taskService, _workspaceContextServer, _configurationResolverService) {
            this._taskService = _taskService;
            this._workspaceContextServer = _workspaceContextServer;
            this._configurationResolverService = _configurationResolverService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTask);
            this._providers = new Map();
            this._taskService.onDidStateChange((event) => {
                const task = event.__task;
                if (event.kind === "start" /* Start */) {
                    this._proxy.$onDidStartTask(TaskExecutionDTO.from(task.getTaskExecution()), event.terminalId);
                }
                else if (event.kind === "processStarted" /* ProcessStarted */) {
                    this._proxy.$onDidStartTaskProcess(TaskProcessStartedDTO.from(task.getTaskExecution(), event.processId));
                }
                else if (event.kind === "processEnded" /* ProcessEnded */) {
                    this._proxy.$onDidEndTaskProcess(TaskProcessEndedDTO.from(task.getTaskExecution(), event.exitCode));
                }
                else if (event.kind === "end" /* End */) {
                    this._proxy.$OnDidEndTask(TaskExecutionDTO.from(task.getTaskExecution()));
                }
            });
            this._taskService.setJsonTasksSupported(Promise.resolve(this._proxy.$jsonTasksSupported()));
        }
        dispose() {
            this._providers.forEach((value) => {
                value.disposable.dispose();
            });
            this._providers.clear();
        }
        $createTaskId(taskDTO) {
            return new Promise((resolve, reject) => {
                let task = TaskDTO.to(taskDTO, this._workspaceContextServer, true);
                if (task) {
                    resolve(task._id);
                }
                else {
                    reject(new Error('Task could not be created from DTO'));
                }
            });
        }
        $registerTaskProvider(handle, type) {
            const provider = {
                provideTasks: (validTypes) => {
                    return Promise.resolve(this._proxy.$provideTasks(handle, validTypes)).then((value) => {
                        const tasks = [];
                        for (let dto of value.tasks) {
                            const task = TaskDTO.to(dto, this._workspaceContextServer, true);
                            if (task) {
                                tasks.push(task);
                            }
                            else {
                                console.error(`Task System: can not convert task: ${JSON.stringify(dto.definition, undefined, 0)}. Task will be dropped`);
                            }
                        }
                        return {
                            tasks,
                            extension: value.extension
                        };
                    });
                },
                resolveTask: (task) => {
                    const dto = TaskDTO.from(task);
                    if (dto) {
                        dto.name = ((dto.name === undefined) ? '' : dto.name); // Using an empty name causes the name to default to the one given by the provider.
                        return Promise.resolve(this._proxy.$resolveTask(handle, dto)).then(resolvedTask => {
                            if (resolvedTask) {
                                return TaskDTO.to(resolvedTask, this._workspaceContextServer, true);
                            }
                            return undefined;
                        });
                    }
                    return Promise.resolve(undefined);
                }
            };
            const disposable = this._taskService.registerTaskProvider(provider, type);
            this._providers.set(handle, { disposable, provider });
            return Promise.resolve(undefined);
        }
        $unregisterTaskProvider(handle) {
            const provider = this._providers.get(handle);
            if (provider) {
                provider.disposable.dispose();
                this._providers.delete(handle);
            }
            return Promise.resolve(undefined);
        }
        $fetchTasks(filter) {
            return this._taskService.tasks(TaskFilterDTO.to(filter)).then((tasks) => {
                const result = [];
                for (let task of tasks) {
                    const item = TaskDTO.from(task);
                    if (item) {
                        result.push(item);
                    }
                }
                return result;
            });
        }
        async $getTaskExecution(value) {
            if (TaskHandleDTO.is(value)) {
                const workspaceFolder = typeof value.workspaceFolder === 'string' ? value.workspaceFolder : this._workspaceContextServer.getWorkspaceFolder(uri_1.URI.revive(value.workspaceFolder));
                if (workspaceFolder) {
                    const task = await this._taskService.getTask(workspaceFolder, value.id, true);
                    if (task) {
                        return {
                            id: task._id,
                            task: TaskDTO.from(task)
                        };
                    }
                    throw new Error('Task not found');
                }
                else {
                    throw new Error('No workspace folder');
                }
            }
            else {
                const task = TaskDTO.to(value, this._workspaceContextServer, true);
                return {
                    id: task._id,
                    task: TaskDTO.from(task)
                };
            }
        }
        $executeTask(value) {
            return new Promise((resolve, reject) => {
                const task = TaskDTO.to(value, this._workspaceContextServer, true);
                this._taskService.run(task).then(undefined, reason => {
                    // eat the error, it has already been surfaced to the user and we don't care about it here
                });
                const result = {
                    id: task._id,
                    task: TaskDTO.from(task)
                };
                resolve(result);
            });
        }
        $customExecutionComplete(id, result) {
            return new Promise((resolve, reject) => {
                this._taskService.getActiveTasks().then((tasks) => {
                    for (let task of tasks) {
                        if (id === task._id) {
                            this._taskService.extensionCallbackTaskComplete(task, result).then((value) => {
                                resolve(undefined);
                            }, (error) => {
                                reject(error);
                            });
                            return;
                        }
                    }
                    reject(new Error('Task to mark as complete not found'));
                });
            });
        }
        $terminateTask(id) {
            return new Promise((resolve, reject) => {
                this._taskService.getActiveTasks().then((tasks) => {
                    for (let task of tasks) {
                        if (id === task._id) {
                            this._taskService.terminate(task).then((value) => {
                                resolve(undefined);
                            }, (error) => {
                                reject(undefined);
                            });
                            return;
                        }
                    }
                    reject(new Error('Task to terminate not found'));
                });
            });
        }
        $registerTaskSystem(key, info) {
            let platform;
            switch (info.platform) {
                case 'win32':
                    platform = 3 /* Windows */;
                    break;
                case 'darwin':
                    platform = 1 /* Mac */;
                    break;
                case 'linux':
                    platform = 2 /* Linux */;
                    break;
                default:
                    platform = Platform.platform;
            }
            this._taskService.registerTaskSystem(key, {
                platform: platform,
                uriProvider: (path) => {
                    return uri_1.URI.parse(`${info.scheme}://${info.authority}${path}`);
                },
                context: this._extHostContext,
                resolveVariables: (workspaceFolder, toResolve, target) => {
                    const vars = [];
                    toResolve.variables.forEach(item => vars.push(item));
                    return Promise.resolve(this._proxy.$resolveVariables(workspaceFolder.uri, { process: toResolve.process, variables: vars })).then(values => {
                        const partiallyResolvedVars = new Array();
                        collections_1.forEach(values.variables, (entry) => {
                            partiallyResolvedVars.push(entry.value);
                        });
                        return new Promise((resolve, reject) => {
                            this._configurationResolverService.resolveWithInteraction(workspaceFolder, partiallyResolvedVars, 'tasks', undefined, target).then(resolvedVars => {
                                const result = {
                                    process: undefined,
                                    variables: new Map()
                                };
                                for (let i = 0; i < partiallyResolvedVars.length; i++) {
                                    const variableName = vars[i].substring(2, vars[i].length - 1);
                                    if (resolvedVars && values.variables[vars[i]] === vars[i]) {
                                        const resolved = resolvedVars.get(variableName);
                                        if (typeof resolved === 'string') {
                                            result.variables.set(variableName, resolved);
                                        }
                                    }
                                    else {
                                        result.variables.set(variableName, partiallyResolvedVars[i]);
                                    }
                                }
                                if (Types.isString(values.process)) {
                                    result.process = values.process;
                                }
                                resolve(result);
                            }, reason => {
                                reject(reason);
                            });
                        });
                    });
                },
                getDefaultShellAndArgs: () => {
                    return Promise.resolve(this._proxy.$getDefaultShellAndArgs());
                }
            });
        }
    };
    MainThreadTask = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTask),
        __param(1, taskService_1.ITaskService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configurationResolver_1.IConfigurationResolverService)
    ], MainThreadTask);
    exports.MainThreadTask = MainThreadTask;
});
//# __sourceMappingURL=mainThreadTask.js.map