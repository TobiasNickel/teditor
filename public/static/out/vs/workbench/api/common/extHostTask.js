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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/async", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostConfiguration", "vs/base/common/cancellation", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/base/common/platform", "vs/platform/log/common/log", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/contrib/tasks/common/taskService"], function (require, exports, uri_1, Objects, async_1, event_1, extHost_protocol_1, types, extHostWorkspace_1, extHostDocumentsAndEditors_1, extHostConfiguration_1, cancellation_1, extHostTerminalService_1, extHostRpcService_1, extHostInitDataService_1, instantiation_1, network_1, Platform, log_1, extHostApiDeprecationService_1, taskService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostTask = exports.WorkerExtHostTask = exports.ExtHostTaskBase = exports.TaskExecutionDTO = exports.TaskFilterDTO = exports.TaskDTO = exports.TaskHandleDTO = exports.CustomExecutionDTO = exports.ShellExecutionDTO = exports.ShellExecutionOptionsDTO = exports.ProcessExecutionDTO = exports.ProcessExecutionOptionsDTO = exports.TaskPresentationOptionsDTO = exports.TaskDefinitionDTO = void 0;
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO = exports.TaskDefinitionDTO || (exports.TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO = exports.TaskPresentationOptionsDTO || (exports.TaskPresentationOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO = exports.ProcessExecutionOptionsDTO || (exports.ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && !!candidate.process;
            }
            else {
                return false;
            }
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                process: value.process,
                args: value.args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return new types.ProcessExecution(value.process, value.args, value.options);
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO = exports.ProcessExecutionDTO || (exports.ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO = exports.ShellExecutionOptionsDTO || (exports.ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && (!!candidate.commandLine || !!candidate.command);
            }
            else {
                return false;
            }
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {};
            if (value.commandLine !== undefined) {
                result.commandLine = value.commandLine;
            }
            else {
                result.command = value.command;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null || (value.command === undefined && value.commandLine === undefined)) {
                return undefined;
            }
            if (value.commandLine) {
                return new types.ShellExecution(value.commandLine, value.options);
            }
            else {
                return new types.ShellExecution(value.command, value.args ? value.args : [], value.options);
            }
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO = exports.ShellExecutionDTO || (exports.ShellExecutionDTO = {}));
    var CustomExecutionDTO;
    (function (CustomExecutionDTO) {
        function is(value) {
            if (value) {
                let candidate = value;
                return candidate && candidate.customExecution === 'customExecution';
            }
            else {
                return false;
            }
        }
        CustomExecutionDTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution'
            };
        }
        CustomExecutionDTO.from = from;
    })(CustomExecutionDTO = exports.CustomExecutionDTO || (exports.CustomExecutionDTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function from(value) {
            let folder;
            if (value.scope !== undefined && typeof value.scope !== 'number') {
                folder = value.scope.uri;
            }
            else if (value.scope !== undefined && typeof value.scope === 'number') {
                folder = taskService_1.USER_TASKS_GROUP_KEY;
            }
            return {
                id: value._id,
                workspaceFolder: folder
            };
        }
        TaskHandleDTO.from = from;
    })(TaskHandleDTO = exports.TaskHandleDTO || (exports.TaskHandleDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function fromMany(tasks, extension) {
            if (tasks === undefined || tasks === null) {
                return [];
            }
            const result = [];
            for (let task of tasks) {
                const converted = from(task, extension);
                if (converted) {
                    result.push(converted);
                }
            }
            return result;
        }
        TaskDTO.fromMany = fromMany;
        function from(value, extension) {
            if (value === undefined || value === null) {
                return undefined;
            }
            let execution;
            if (value.execution instanceof types.ProcessExecution) {
                execution = ProcessExecutionDTO.from(value.execution);
            }
            else if (value.execution instanceof types.ShellExecution) {
                execution = ShellExecutionDTO.from(value.execution);
            }
            else if (value.execution && value.execution instanceof types.CustomExecution) {
                execution = CustomExecutionDTO.from(value.execution);
            }
            const definition = TaskDefinitionDTO.from(value.definition);
            let scope;
            if (value.scope) {
                if (typeof value.scope === 'number') {
                    scope = value.scope;
                }
                else {
                    scope = value.scope.uri;
                }
            }
            else {
                // To continue to support the deprecated task constructor that doesn't take a scope, we must add a scope here:
                scope = types.TaskScope.Workspace;
            }
            if (!definition || !scope) {
                return undefined;
            }
            const group = value.group ? value.group.id : undefined;
            const result = {
                _id: value._id,
                definition,
                name: value.name,
                source: {
                    extensionId: extension.identifier.value,
                    label: value.source,
                    scope: scope
                },
                execution: execution,
                isBackground: value.isBackground,
                group: group,
                presentationOptions: TaskPresentationOptionsDTO.from(value.presentationOptions),
                problemMatchers: value.problemMatchers,
                hasDefinedMatchers: value.hasDefinedMatchers,
                runOptions: value.runOptions ? value.runOptions : { reevaluateOnRerun: true },
                detail: value.detail
            };
            return result;
        }
        TaskDTO.from = from;
        async function to(value, workspace) {
            if (value === undefined || value === null) {
                return undefined;
            }
            let execution;
            if (ProcessExecutionDTO.is(value.execution)) {
                execution = ProcessExecutionDTO.to(value.execution);
            }
            else if (ShellExecutionDTO.is(value.execution)) {
                execution = ShellExecutionDTO.to(value.execution);
            }
            const definition = TaskDefinitionDTO.to(value.definition);
            let scope;
            if (value.source) {
                if (value.source.scope !== undefined) {
                    if (typeof value.source.scope === 'number') {
                        scope = value.source.scope;
                    }
                    else {
                        scope = await workspace.resolveWorkspaceFolder(uri_1.URI.revive(value.source.scope));
                    }
                }
                else {
                    scope = types.TaskScope.Workspace;
                }
            }
            if (!definition || !scope) {
                return undefined;
            }
            const result = new types.Task(definition, scope, value.name, value.source.label, execution, value.problemMatchers);
            if (value.isBackground !== undefined) {
                result.isBackground = value.isBackground;
            }
            if (value.group !== undefined) {
                result.group = types.TaskGroup.from(value.group);
            }
            if (value.presentationOptions) {
                result.presentationOptions = TaskPresentationOptionsDTO.to(value.presentationOptions);
            }
            if (value._id) {
                result._id = value._id;
            }
            if (value.detail) {
                result.detail = value.detail;
            }
            return result;
        }
        TaskDTO.to = to;
    })(TaskDTO = exports.TaskDTO || (exports.TaskDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            if (!value) {
                return undefined;
            }
            return Objects.assign(Object.create(null), value);
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO = exports.TaskFilterDTO || (exports.TaskFilterDTO = {}));
    class TaskExecutionImpl {
        constructor(_tasks, _id, _task) {
            this._tasks = _tasks;
            this._id = _id;
            this._task = _task;
        }
        get task() {
            return this._task;
        }
        terminate() {
            this._tasks.terminateTask(this);
        }
        fireDidStartProcess(value) {
        }
        fireDidEndProcess(value) {
        }
    }
    var TaskExecutionDTO;
    (function (TaskExecutionDTO) {
        async function to(value, tasks, workspaceProvider) {
            const task = await TaskDTO.to(value.task, workspaceProvider);
            if (!task) {
                throw new Error('Unexpected: Task cannot be created.');
            }
            return new TaskExecutionImpl(tasks, value.id, task);
        }
        TaskExecutionDTO.to = to;
        function from(value) {
            return {
                id: value._id,
                task: undefined
            };
        }
        TaskExecutionDTO.from = from;
    })(TaskExecutionDTO = exports.TaskExecutionDTO || (exports.TaskExecutionDTO = {}));
    let ExtHostTaskBase = class ExtHostTaskBase {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService) {
            this._onDidExecuteTask = new event_1.Emitter();
            this._onDidTerminateTask = new event_1.Emitter();
            this._onDidTaskProcessStarted = new event_1.Emitter();
            this._onDidTaskProcessEnded = new event_1.Emitter();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTask);
            this._workspaceProvider = workspaceService;
            this._editorService = editorService;
            this._configurationService = configurationService;
            this._terminalService = extHostTerminalService;
            this._handleCounter = 0;
            this._handlers = new Map();
            this._taskExecutions = new Map();
            this._taskExecutionPromises = new Map();
            this._providedCustomExecutions2 = new Map();
            this._notProvidedCustomExecutions = new Set();
            this._activeCustomExecutions2 = new Map();
            this._logService = logService;
            this._deprecationService = deprecationService;
        }
        registerTaskProvider(extension, type, provider) {
            if (!provider) {
                return new types.Disposable(() => { });
            }
            const handle = this.nextHandle();
            this._handlers.set(handle, { type, provider, extension });
            this._proxy.$registerTaskProvider(handle, type);
            return new types.Disposable(() => {
                this._handlers.delete(handle);
                this._proxy.$unregisterTaskProvider(handle);
            });
        }
        registerTaskSystem(scheme, info) {
            this._proxy.$registerTaskSystem(scheme, info);
        }
        fetchTasks(filter) {
            return this._proxy.$fetchTasks(TaskFilterDTO.from(filter)).then(async (values) => {
                const result = [];
                for (let value of values) {
                    const task = await TaskDTO.to(value, this._workspaceProvider);
                    if (task) {
                        result.push(task);
                    }
                }
                return result;
            });
        }
        get taskExecutions() {
            const result = [];
            this._taskExecutions.forEach(value => result.push(value));
            return result;
        }
        terminateTask(execution) {
            if (!(execution instanceof TaskExecutionImpl)) {
                throw new Error('No valid task execution provided');
            }
            return this._proxy.$terminateTask(execution._id);
        }
        get onDidStartTask() {
            return this._onDidExecuteTask.event;
        }
        async resolveDefinition(uri, definition) {
            return definition;
        }
        async $onDidStartTask(execution, terminalId) {
            var _a, _b;
            const customExecution = this._providedCustomExecutions2.get(execution.id);
            if (customExecution) {
                if (this._activeCustomExecutions2.get(execution.id) !== undefined) {
                    throw new Error('We should not be trying to start the same custom task executions twice.');
                }
                // Clone the custom execution to keep the original untouched. This is important for multiple runs of the same task.
                this._activeCustomExecutions2.set(execution.id, customExecution);
                this._terminalService.attachPtyToTerminal(terminalId, await customExecution.callback(await this.resolveDefinition((_a = execution.task) === null || _a === void 0 ? void 0 : _a.source.scope, (_b = execution.task) === null || _b === void 0 ? void 0 : _b.definition)));
            }
            this._lastStartedTask = execution.id;
            this._onDidExecuteTask.fire({
                execution: await this.getTaskExecution(execution)
            });
        }
        get onDidEndTask() {
            return this._onDidTerminateTask.event;
        }
        async $OnDidEndTask(execution) {
            const _execution = await this.getTaskExecution(execution);
            this._taskExecutionPromises.delete(execution.id);
            this._taskExecutions.delete(execution.id);
            this.customExecutionComplete(execution);
            this._onDidTerminateTask.fire({
                execution: _execution
            });
        }
        get onDidStartTaskProcess() {
            return this._onDidTaskProcessStarted.event;
        }
        async $onDidStartTaskProcess(value) {
            const execution = await this.getTaskExecution(value.id);
            this._onDidTaskProcessStarted.fire({
                execution: execution,
                processId: value.processId
            });
        }
        get onDidEndTaskProcess() {
            return this._onDidTaskProcessEnded.event;
        }
        async $onDidEndTaskProcess(value) {
            const execution = await this.getTaskExecution(value.id);
            this._onDidTaskProcessEnded.fire({
                execution: execution,
                exitCode: value.exitCode
            });
        }
        $provideTasks(handle, validTypes) {
            const handler = this._handlers.get(handle);
            if (!handler) {
                return Promise.reject(new Error('no handler found'));
            }
            // Set up a list of task ID promises that we can wait on
            // before returning the provided tasks. The ensures that
            // our task IDs are calculated for any custom execution tasks.
            // Knowing this ID ahead of time is needed because when a task
            // start event is fired this is when the custom execution is called.
            // The task start event is also the first time we see the ID from the main
            // thread, which is too late for us because we need to save an map
            // from an ID to the custom execution function. (Kind of a cart before the horse problem).
            const taskIdPromises = [];
            const fetchPromise = async_1.asPromise(() => handler.provider.provideTasks(cancellation_1.CancellationToken.None)).then(value => {
                return this.provideTasksInternal(validTypes, taskIdPromises, handler, value);
            });
            return new Promise((resolve) => {
                fetchPromise.then((result) => {
                    Promise.all(taskIdPromises).then(() => {
                        resolve(result);
                    });
                });
            });
        }
        async $resolveTask(handle, taskDTO) {
            const handler = this._handlers.get(handle);
            if (!handler) {
                return Promise.reject(new Error('no handler found'));
            }
            if (taskDTO.definition.type !== handler.type) {
                throw new Error(`Unexpected: Task of type [${taskDTO.definition.type}] cannot be resolved by provider of type [${handler.type}].`);
            }
            const task = await TaskDTO.to(taskDTO, this._workspaceProvider);
            if (!task) {
                throw new Error('Unexpected: Task cannot be resolved.');
            }
            const resolvedTask = await handler.provider.resolveTask(task, cancellation_1.CancellationToken.None);
            if (!resolvedTask) {
                return;
            }
            this.checkDeprecation(resolvedTask, handler);
            const resolvedTaskDTO = TaskDTO.from(resolvedTask, handler.extension);
            if (!resolvedTaskDTO) {
                throw new Error('Unexpected: Task cannot be resolved.');
            }
            if (resolvedTask.definition !== task.definition) {
                throw new Error('Unexpected: The resolved task definition must be the same object as the original task definition. The task definition cannot be changed.');
            }
            if (CustomExecutionDTO.is(resolvedTaskDTO.execution)) {
                await this.addCustomExecution(resolvedTaskDTO, resolvedTask, true);
            }
            return await this.resolveTaskInternal(resolvedTaskDTO);
        }
        nextHandle() {
            return this._handleCounter++;
        }
        async addCustomExecution(taskDTO, task, isProvided) {
            const taskId = await this._proxy.$createTaskId(taskDTO);
            if (!isProvided && !this._providedCustomExecutions2.has(taskId)) {
                this._notProvidedCustomExecutions.add(taskId);
            }
            this._providedCustomExecutions2.set(taskId, task.execution);
        }
        async getTaskExecution(execution, task) {
            if (typeof execution === 'string') {
                const taskExecution = this._taskExecutionPromises.get(execution);
                if (!taskExecution) {
                    throw new Error('Unexpected: The specified task is missing an execution');
                }
                return taskExecution;
            }
            let result = this._taskExecutionPromises.get(execution.id);
            if (result) {
                return result;
            }
            const createdResult = new Promise(async (resolve, reject) => {
                const taskToCreate = task ? task : await TaskDTO.to(execution.task, this._workspaceProvider);
                if (!taskToCreate) {
                    reject('Unexpected: Task does not exist.');
                }
                else {
                    resolve(new TaskExecutionImpl(this, execution.id, taskToCreate));
                }
            });
            this._taskExecutionPromises.set(execution.id, createdResult);
            return createdResult.then(executionCreatedResult => {
                this._taskExecutions.set(execution.id, executionCreatedResult);
                return executionCreatedResult;
            }, rejected => {
                return Promise.reject(rejected);
            });
        }
        checkDeprecation(task, handler) {
            const tTask = task;
            if (tTask._deprecated) {
                this._deprecationService.report('Task.constructor', handler.extension, 'Use the Task constructor that takes a `scope` instead.');
            }
        }
        customExecutionComplete(execution) {
            const extensionCallback2 = this._activeCustomExecutions2.get(execution.id);
            if (extensionCallback2) {
                this._activeCustomExecutions2.delete(execution.id);
            }
            // Technically we don't really need to do this, however, if an extension
            // is executing a task through "executeTask" over and over again
            // with different properties in the task definition, then the map of executions
            // could grow indefinitely, something we don't want.
            if (this._notProvidedCustomExecutions.has(execution.id) && (this._lastStartedTask !== execution.id)) {
                this._providedCustomExecutions2.delete(execution.id);
                this._notProvidedCustomExecutions.delete(execution.id);
            }
            let iterator = this._notProvidedCustomExecutions.values();
            let iteratorResult = iterator.next();
            while (!iteratorResult.done) {
                if (!this._activeCustomExecutions2.has(iteratorResult.value) && (this._lastStartedTask !== iteratorResult.value)) {
                    this._providedCustomExecutions2.delete(iteratorResult.value);
                    this._notProvidedCustomExecutions.delete(iteratorResult.value);
                }
                iteratorResult = iterator.next();
            }
        }
    };
    ExtHostTaskBase = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService),
        __param(6, log_1.ILogService),
        __param(7, extHostApiDeprecationService_1.IExtHostApiDeprecationService)
    ], ExtHostTaskBase);
    exports.ExtHostTaskBase = ExtHostTaskBase;
    let WorkerExtHostTask = class WorkerExtHostTask extends ExtHostTaskBase {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService) {
            super(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService);
            if (initData.remote.isRemote && initData.remote.authority) {
                this.registerTaskSystem(network_1.Schemas.vscodeRemote, {
                    scheme: network_1.Schemas.vscodeRemote,
                    authority: initData.remote.authority,
                    platform: Platform.PlatformToString(0 /* Web */)
                });
            }
        }
        async executeTask(extension, task) {
            const dto = TaskDTO.from(task, extension);
            if (dto === undefined) {
                throw new Error('Task is not valid');
            }
            // If this task is a custom execution, then we need to save it away
            // in the provided custom execution map that is cleaned up after the
            // task is executed.
            if (CustomExecutionDTO.is(dto.execution)) {
                await this.addCustomExecution(dto, task, false);
            }
            else {
                throw new Error('Not implemented');
            }
            // Always get the task execution first to prevent timing issues when retrieving it later
            const execution = await this.getTaskExecution(await this._proxy.$getTaskExecution(dto), task);
            this._proxy.$executeTask(dto).catch(error => { throw new Error(error); });
            return execution;
        }
        provideTasksInternal(validTypes, taskIdPromises, handler, value) {
            const taskDTOs = [];
            if (value) {
                for (let task of value) {
                    this.checkDeprecation(task, handler);
                    if (!task.definition || !validTypes[task.definition.type]) {
                        this._logService.warn(`The task [${task.source}, ${task.name}] uses an undefined task type. The task will be ignored in the future.`);
                    }
                    const taskDTO = TaskDTO.from(task, handler.extension);
                    if (taskDTO && CustomExecutionDTO.is(taskDTO.execution)) {
                        taskDTOs.push(taskDTO);
                        // The ID is calculated on the main thread task side, so, let's call into it here.
                        // We need the task id's pre-computed for custom task executions because when OnDidStartTask
                        // is invoked, we have to be able to map it back to our data.
                        taskIdPromises.push(this.addCustomExecution(taskDTO, task, true));
                    }
                    else {
                        this._logService.warn('Only custom execution tasks supported.');
                    }
                }
            }
            return {
                tasks: taskDTOs,
                extension: handler.extension
            };
        }
        async resolveTaskInternal(resolvedTaskDTO) {
            if (CustomExecutionDTO.is(resolvedTaskDTO.execution)) {
                return resolvedTaskDTO;
            }
            else {
                this._logService.warn('Only custom execution tasks supported.');
            }
            return undefined;
        }
        async $resolveVariables(uriComponents, toResolve) {
            const result = {
                process: undefined,
                variables: Object.create(null)
            };
            return result;
        }
        $getDefaultShellAndArgs() {
            throw new Error('Not implemented');
        }
        async $jsonTasksSupported() {
            return false;
        }
    };
    WorkerExtHostTask = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService),
        __param(6, log_1.ILogService),
        __param(7, extHostApiDeprecationService_1.IExtHostApiDeprecationService)
    ], WorkerExtHostTask);
    exports.WorkerExtHostTask = WorkerExtHostTask;
    exports.IExtHostTask = instantiation_1.createDecorator('IExtHostTask');
});
//# __sourceMappingURL=extHostTask.js.map