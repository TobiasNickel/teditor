/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/workbench/contrib/tasks/common/taskService"], function (require, exports, nls, Types, resources, Objects, contextkey_1, taskDefinitionRegistry_1, taskService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskDefinition = exports.KeyedTaskIdentifier = exports.TaskEvent = exports.TaskRunSource = exports.TaskRunType = exports.TaskEventKind = exports.TaskSorter = exports.JsonSchemaVersion = exports.ExecutionEngine = exports.InMemoryTask = exports.ContributedTask = exports.ConfiguringTask = exports.CustomTask = exports.CommonTask = exports.RunOptions = exports.RunOnOptions = exports.DependsOrder = exports.GroupType = exports.TaskSourceKind = exports.TaskScope = exports.TaskGroup = exports.CommandString = exports.RuntimeType = exports.PresentationOptions = exports.PanelKind = exports.RevealProblemKind = exports.RevealKind = exports.CommandOptions = exports.CUSTOMIZED_TASK_TYPE = exports.ShellQuoting = exports.TASK_RUNNING_STATE = void 0;
    exports.TASK_RUNNING_STATE = new contextkey_1.RawContextKey('taskRunning', false);
    var ShellQuoting;
    (function (ShellQuoting) {
        /**
         * Use character escaping.
         */
        ShellQuoting[ShellQuoting["Escape"] = 1] = "Escape";
        /**
         * Use strong quoting
         */
        ShellQuoting[ShellQuoting["Strong"] = 2] = "Strong";
        /**
         * Use weak quoting.
         */
        ShellQuoting[ShellQuoting["Weak"] = 3] = "Weak";
    })(ShellQuoting = exports.ShellQuoting || (exports.ShellQuoting = {}));
    exports.CUSTOMIZED_TASK_TYPE = '$customized';
    (function (ShellQuoting) {
        function from(value) {
            if (!value) {
                return ShellQuoting.Strong;
            }
            switch (value.toLowerCase()) {
                case 'escape':
                    return ShellQuoting.Escape;
                case 'strong':
                    return ShellQuoting.Strong;
                case 'weak':
                    return ShellQuoting.Weak;
                default:
                    return ShellQuoting.Strong;
            }
        }
        ShellQuoting.from = from;
    })(ShellQuoting = exports.ShellQuoting || (exports.ShellQuoting = {}));
    var CommandOptions;
    (function (CommandOptions) {
        CommandOptions.defaults = { cwd: '${workspaceFolder}' };
    })(CommandOptions = exports.CommandOptions || (exports.CommandOptions = {}));
    var RevealKind;
    (function (RevealKind) {
        /**
         * Always brings the terminal to front if the task is executed.
         */
        RevealKind[RevealKind["Always"] = 1] = "Always";
        /**
         * Only brings the terminal to front if a problem is detected executing the task
         * e.g. the task couldn't be started,
         * the task ended with an exit code other than zero,
         * or the problem matcher found an error.
         */
        RevealKind[RevealKind["Silent"] = 2] = "Silent";
        /**
         * The terminal never comes to front when the task is executed.
         */
        RevealKind[RevealKind["Never"] = 3] = "Never";
    })(RevealKind = exports.RevealKind || (exports.RevealKind = {}));
    (function (RevealKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'always':
                    return RevealKind.Always;
                case 'silent':
                    return RevealKind.Silent;
                case 'never':
                    return RevealKind.Never;
                default:
                    return RevealKind.Always;
            }
        }
        RevealKind.fromString = fromString;
    })(RevealKind = exports.RevealKind || (exports.RevealKind = {}));
    var RevealProblemKind;
    (function (RevealProblemKind) {
        /**
         * Never reveals the problems panel when this task is executed.
         */
        RevealProblemKind[RevealProblemKind["Never"] = 1] = "Never";
        /**
         * Only reveals the problems panel if a problem is found.
         */
        RevealProblemKind[RevealProblemKind["OnProblem"] = 2] = "OnProblem";
        /**
         * Never reveals the problems panel when this task is executed.
         */
        RevealProblemKind[RevealProblemKind["Always"] = 3] = "Always";
    })(RevealProblemKind = exports.RevealProblemKind || (exports.RevealProblemKind = {}));
    (function (RevealProblemKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'always':
                    return RevealProblemKind.Always;
                case 'never':
                    return RevealProblemKind.Never;
                case 'onproblem':
                    return RevealProblemKind.OnProblem;
                default:
                    return RevealProblemKind.OnProblem;
            }
        }
        RevealProblemKind.fromString = fromString;
    })(RevealProblemKind = exports.RevealProblemKind || (exports.RevealProblemKind = {}));
    var PanelKind;
    (function (PanelKind) {
        /**
         * Shares a panel with other tasks. This is the default.
         */
        PanelKind[PanelKind["Shared"] = 1] = "Shared";
        /**
         * Uses a dedicated panel for this tasks. The panel is not
         * shared with other tasks.
         */
        PanelKind[PanelKind["Dedicated"] = 2] = "Dedicated";
        /**
         * Creates a new panel whenever this task is executed.
         */
        PanelKind[PanelKind["New"] = 3] = "New";
    })(PanelKind = exports.PanelKind || (exports.PanelKind = {}));
    (function (PanelKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'shared':
                    return PanelKind.Shared;
                case 'dedicated':
                    return PanelKind.Dedicated;
                case 'new':
                    return PanelKind.New;
                default:
                    return PanelKind.Shared;
            }
        }
        PanelKind.fromString = fromString;
    })(PanelKind = exports.PanelKind || (exports.PanelKind = {}));
    var PresentationOptions;
    (function (PresentationOptions) {
        PresentationOptions.defaults = {
            echo: true, reveal: RevealKind.Always, revealProblems: RevealProblemKind.Never, focus: false, panel: PanelKind.Shared, showReuseMessage: true, clear: false
        };
    })(PresentationOptions = exports.PresentationOptions || (exports.PresentationOptions = {}));
    var RuntimeType;
    (function (RuntimeType) {
        RuntimeType[RuntimeType["Shell"] = 1] = "Shell";
        RuntimeType[RuntimeType["Process"] = 2] = "Process";
        RuntimeType[RuntimeType["CustomExecution"] = 3] = "CustomExecution";
    })(RuntimeType = exports.RuntimeType || (exports.RuntimeType = {}));
    (function (RuntimeType) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'shell':
                    return RuntimeType.Shell;
                case 'process':
                    return RuntimeType.Process;
                case 'customExecution':
                    return RuntimeType.CustomExecution;
                default:
                    return RuntimeType.Process;
            }
        }
        RuntimeType.fromString = fromString;
    })(RuntimeType = exports.RuntimeType || (exports.RuntimeType = {}));
    var CommandString;
    (function (CommandString) {
        function value(value) {
            if (Types.isString(value)) {
                return value;
            }
            else {
                return value.value;
            }
        }
        CommandString.value = value;
    })(CommandString = exports.CommandString || (exports.CommandString = {}));
    var TaskGroup;
    (function (TaskGroup) {
        TaskGroup.Clean = 'clean';
        TaskGroup.Build = 'build';
        TaskGroup.Rebuild = 'rebuild';
        TaskGroup.Test = 'test';
        function is(value) {
            return value === TaskGroup.Clean || value === TaskGroup.Build || value === TaskGroup.Rebuild || value === TaskGroup.Test;
        }
        TaskGroup.is = is;
    })(TaskGroup = exports.TaskGroup || (exports.TaskGroup = {}));
    var TaskScope;
    (function (TaskScope) {
        TaskScope[TaskScope["Global"] = 1] = "Global";
        TaskScope[TaskScope["Workspace"] = 2] = "Workspace";
        TaskScope[TaskScope["Folder"] = 3] = "Folder";
    })(TaskScope = exports.TaskScope || (exports.TaskScope = {}));
    var TaskSourceKind;
    (function (TaskSourceKind) {
        TaskSourceKind.Workspace = 'workspace';
        TaskSourceKind.Extension = 'extension';
        TaskSourceKind.InMemory = 'inMemory';
        TaskSourceKind.WorkspaceFile = 'workspaceFile';
        TaskSourceKind.User = 'user';
        function toConfigurationTarget(kind) {
            switch (kind) {
                case TaskSourceKind.User: return 1 /* USER */;
                case TaskSourceKind.WorkspaceFile: return 4 /* WORKSPACE */;
                default: return 5 /* WORKSPACE_FOLDER */;
            }
        }
        TaskSourceKind.toConfigurationTarget = toConfigurationTarget;
    })(TaskSourceKind = exports.TaskSourceKind || (exports.TaskSourceKind = {}));
    var GroupType;
    (function (GroupType) {
        GroupType["default"] = "default";
        GroupType["user"] = "user";
    })(GroupType = exports.GroupType || (exports.GroupType = {}));
    var DependsOrder;
    (function (DependsOrder) {
        DependsOrder["parallel"] = "parallel";
        DependsOrder["sequence"] = "sequence";
    })(DependsOrder = exports.DependsOrder || (exports.DependsOrder = {}));
    var RunOnOptions;
    (function (RunOnOptions) {
        RunOnOptions[RunOnOptions["default"] = 1] = "default";
        RunOnOptions[RunOnOptions["folderOpen"] = 2] = "folderOpen";
    })(RunOnOptions = exports.RunOnOptions || (exports.RunOnOptions = {}));
    var RunOptions;
    (function (RunOptions) {
        RunOptions.defaults = { reevaluateOnRerun: true, runOn: RunOnOptions.default, instanceLimit: 1 };
    })(RunOptions = exports.RunOptions || (exports.RunOptions = {}));
    class CommonTask {
        constructor(id, label, type, runOptions, configurationProperties, source) {
            /**
             * The cached label.
             */
            this._label = '';
            this._id = id;
            if (label) {
                this._label = label;
            }
            if (type) {
                this.type = type;
            }
            this.runOptions = runOptions;
            this.configurationProperties = configurationProperties;
            this._source = source;
        }
        getDefinition(useSource) {
            return undefined;
        }
        getMapKey() {
            return this._id;
        }
        getRecentlyUsedKey() {
            return undefined;
        }
        getCommonTaskId() {
            const key = { folder: this.getFolderId(), id: this._id };
            return JSON.stringify(key);
        }
        clone() {
            return this.fromObject(Objects.assign({}, this));
        }
        getWorkspaceFolder() {
            return undefined;
        }
        getWorkspaceFileName() {
            return undefined;
        }
        getTelemetryKind() {
            return 'unknown';
        }
        matches(key, compareId = false) {
            if (key === undefined) {
                return false;
            }
            if (Types.isString(key)) {
                return key === this._label || key === this.configurationProperties.identifier || (compareId && key === this._id);
            }
            let identifier = this.getDefinition(true);
            return identifier !== undefined && identifier._key === key._key;
        }
        getQualifiedLabel() {
            let workspaceFolder = this.getWorkspaceFolder();
            if (workspaceFolder) {
                return `${this._label} (${workspaceFolder.name})`;
            }
            else {
                return this._label;
            }
        }
        getTaskExecution() {
            let result = {
                id: this._id,
                task: this
            };
            return result;
        }
        addTaskLoadMessages(messages) {
            if (this._taskLoadMessages === undefined) {
                this._taskLoadMessages = [];
            }
            if (messages) {
                this._taskLoadMessages = this._taskLoadMessages.concat(messages);
            }
        }
        get taskLoadMessages() {
            return this._taskLoadMessages;
        }
    }
    exports.CommonTask = CommonTask;
    class CustomTask extends CommonTask {
        constructor(id, source, label, type, command, hasDefinedMatchers, runOptions, configurationProperties) {
            super(id, label, undefined, runOptions, configurationProperties, source);
            /**
             * The command configuration
             */
            this.command = {};
            this._source = source;
            this.hasDefinedMatchers = hasDefinedMatchers;
            if (command) {
                this.command = command;
            }
        }
        clone() {
            return new CustomTask(this._id, this._source, this._label, this.type, this.command, this.hasDefinedMatchers, this.runOptions, this.configurationProperties);
        }
        customizes() {
            if (this._source && this._source.customizes) {
                return this._source.customizes;
            }
            return undefined;
        }
        getDefinition(useSource = false) {
            if (useSource && this._source.customizes !== undefined) {
                return this._source.customizes;
            }
            else {
                let type;
                const commandRuntime = this.command ? this.command.runtime : undefined;
                switch (commandRuntime) {
                    case RuntimeType.Shell:
                        type = 'shell';
                        break;
                    case RuntimeType.Process:
                        type = 'process';
                        break;
                    case RuntimeType.CustomExecution:
                        type = 'customExecution';
                        break;
                    case undefined:
                        type = '$composite';
                        break;
                    default:
                        throw new Error('Unexpected task runtime');
                }
                let result = {
                    type,
                    _key: this._id,
                    id: this._id
                };
                return result;
            }
        }
        static is(value) {
            return value instanceof CustomTask;
        }
        getMapKey() {
            let workspaceFolder = this._source.config.workspaceFolder;
            return workspaceFolder ? `${workspaceFolder.uri.toString()}|${this._id}|${this.instance}` : `${this._id}|${this.instance}`;
        }
        getFolderId() {
            var _a;
            return this._source.kind === TaskSourceKind.User ? taskService_1.USER_TASKS_GROUP_KEY : (_a = this._source.config.workspaceFolder) === null || _a === void 0 ? void 0 : _a.uri.toString();
        }
        getCommonTaskId() {
            var _a;
            return this._source.customizes ? super.getCommonTaskId() : ((_a = this.getRecentlyUsedKey()) !== null && _a !== void 0 ? _a : super.getCommonTaskId());
        }
        getRecentlyUsedKey() {
            let workspaceFolder = this.getFolderId();
            if (!workspaceFolder) {
                return undefined;
            }
            let id = this.configurationProperties.identifier;
            if (this._source.kind !== TaskSourceKind.Workspace) {
                id += this._source.kind;
            }
            let key = { type: exports.CUSTOMIZED_TASK_TYPE, folder: workspaceFolder, id };
            return JSON.stringify(key);
        }
        getWorkspaceFolder() {
            return this._source.config.workspaceFolder;
        }
        getWorkspaceFileName() {
            return (this._source.config.workspace && this._source.config.workspace.configuration) ? resources.basename(this._source.config.workspace.configuration) : undefined;
        }
        getTelemetryKind() {
            if (this._source.customizes) {
                return 'workspace>extension';
            }
            else {
                return 'workspace';
            }
        }
        fromObject(object) {
            return new CustomTask(object._id, object._source, object._label, object.type, object.command, object.hasDefinedMatchers, object.runOptions, object.configurationProperties);
        }
    }
    exports.CustomTask = CustomTask;
    class ConfiguringTask extends CommonTask {
        constructor(id, source, label, type, configures, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this._source = source;
            this.configures = configures;
        }
        static is(value) {
            return value instanceof ConfiguringTask;
        }
        fromObject(object) {
            return object;
        }
        getDefinition() {
            return this.configures;
        }
        getWorkspaceFileName() {
            return (this._source.config.workspace && this._source.config.workspace.configuration) ? resources.basename(this._source.config.workspace.configuration) : undefined;
        }
        getWorkspaceFolder() {
            return this._source.config.workspaceFolder;
        }
        getFolderId() {
            var _a;
            return this._source.kind === TaskSourceKind.User ? taskService_1.USER_TASKS_GROUP_KEY : (_a = this._source.config.workspaceFolder) === null || _a === void 0 ? void 0 : _a.uri.toString();
        }
        getRecentlyUsedKey() {
            let workspaceFolder = this.getFolderId();
            if (!workspaceFolder) {
                return undefined;
            }
            let id = this.configurationProperties.identifier;
            if (this._source.kind !== TaskSourceKind.Workspace) {
                id += this._source.kind;
            }
            let key = { type: exports.CUSTOMIZED_TASK_TYPE, folder: workspaceFolder, id };
            return JSON.stringify(key);
        }
    }
    exports.ConfiguringTask = ConfiguringTask;
    class ContributedTask extends CommonTask {
        constructor(id, source, label, type, defines, command, hasDefinedMatchers, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this.defines = defines;
            this.hasDefinedMatchers = hasDefinedMatchers;
            this.command = command;
        }
        clone() {
            return new ContributedTask(this._id, this._source, this._label, this.type, this.defines, this.command, this.hasDefinedMatchers, this.runOptions, this.configurationProperties);
        }
        getDefinition() {
            return this.defines;
        }
        static is(value) {
            return value instanceof ContributedTask;
        }
        getMapKey() {
            let workspaceFolder = this._source.workspaceFolder;
            return workspaceFolder
                ? `${this._source.scope.toString()}|${workspaceFolder.uri.toString()}|${this._id}|${this.instance}`
                : `${this._source.scope.toString()}|${this._id}|${this.instance}`;
        }
        getFolderId() {
            if (this._source.scope === 3 /* Folder */ && this._source.workspaceFolder) {
                return this._source.workspaceFolder.uri.toString();
            }
            return undefined;
        }
        getRecentlyUsedKey() {
            let key = { type: 'contributed', scope: this._source.scope, id: this._id };
            key.folder = this.getFolderId();
            return JSON.stringify(key);
        }
        getWorkspaceFolder() {
            return this._source.workspaceFolder;
        }
        getTelemetryKind() {
            return 'extension';
        }
        fromObject(object) {
            return new ContributedTask(object._id, object._source, object._label, object.type, object.defines, object.command, object.hasDefinedMatchers, object.runOptions, object.configurationProperties);
        }
    }
    exports.ContributedTask = ContributedTask;
    class InMemoryTask extends CommonTask {
        constructor(id, source, label, type, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this._source = source;
        }
        clone() {
            return new InMemoryTask(this._id, this._source, this._label, this.type, this.runOptions, this.configurationProperties);
        }
        static is(value) {
            return value instanceof InMemoryTask;
        }
        getTelemetryKind() {
            return 'composite';
        }
        getMapKey() {
            return `${this._id}|${this.instance}`;
        }
        getFolderId() {
            return undefined;
        }
        fromObject(object) {
            return new InMemoryTask(object._id, object._source, object._label, object.type, object.runOptions, object.configurationProperties);
        }
    }
    exports.InMemoryTask = InMemoryTask;
    var ExecutionEngine;
    (function (ExecutionEngine) {
        ExecutionEngine[ExecutionEngine["Process"] = 1] = "Process";
        ExecutionEngine[ExecutionEngine["Terminal"] = 2] = "Terminal";
    })(ExecutionEngine = exports.ExecutionEngine || (exports.ExecutionEngine = {}));
    (function (ExecutionEngine) {
        ExecutionEngine._default = ExecutionEngine.Terminal;
    })(ExecutionEngine = exports.ExecutionEngine || (exports.ExecutionEngine = {}));
    var JsonSchemaVersion;
    (function (JsonSchemaVersion) {
        JsonSchemaVersion[JsonSchemaVersion["V0_1_0"] = 1] = "V0_1_0";
        JsonSchemaVersion[JsonSchemaVersion["V2_0_0"] = 2] = "V2_0_0";
    })(JsonSchemaVersion = exports.JsonSchemaVersion || (exports.JsonSchemaVersion = {}));
    class TaskSorter {
        constructor(workspaceFolders) {
            this._order = new Map();
            for (let i = 0; i < workspaceFolders.length; i++) {
                this._order.set(workspaceFolders[i].uri.toString(), i);
            }
        }
        compare(a, b) {
            let aw = a.getWorkspaceFolder();
            let bw = b.getWorkspaceFolder();
            if (aw && bw) {
                let ai = this._order.get(aw.uri.toString());
                ai = ai === undefined ? 0 : ai + 1;
                let bi = this._order.get(bw.uri.toString());
                bi = bi === undefined ? 0 : bi + 1;
                if (ai === bi) {
                    return a._label.localeCompare(b._label);
                }
                else {
                    return ai - bi;
                }
            }
            else if (!aw && bw) {
                return -1;
            }
            else if (aw && !bw) {
                return +1;
            }
            else {
                return 0;
            }
        }
    }
    exports.TaskSorter = TaskSorter;
    var TaskEventKind;
    (function (TaskEventKind) {
        TaskEventKind["DependsOnStarted"] = "dependsOnStarted";
        TaskEventKind["Start"] = "start";
        TaskEventKind["ProcessStarted"] = "processStarted";
        TaskEventKind["Active"] = "active";
        TaskEventKind["Inactive"] = "inactive";
        TaskEventKind["Changed"] = "changed";
        TaskEventKind["Terminated"] = "terminated";
        TaskEventKind["ProcessEnded"] = "processEnded";
        TaskEventKind["End"] = "end";
    })(TaskEventKind = exports.TaskEventKind || (exports.TaskEventKind = {}));
    var TaskRunType;
    (function (TaskRunType) {
        TaskRunType["SingleRun"] = "singleRun";
        TaskRunType["Background"] = "background";
    })(TaskRunType = exports.TaskRunType || (exports.TaskRunType = {}));
    var TaskRunSource;
    (function (TaskRunSource) {
        TaskRunSource[TaskRunSource["System"] = 0] = "System";
        TaskRunSource[TaskRunSource["User"] = 1] = "User";
        TaskRunSource[TaskRunSource["FolderOpen"] = 2] = "FolderOpen";
        TaskRunSource[TaskRunSource["ConfigurationChange"] = 3] = "ConfigurationChange";
    })(TaskRunSource = exports.TaskRunSource || (exports.TaskRunSource = {}));
    var TaskEvent;
    (function (TaskEvent) {
        function create(kind, task, processIdOrExitCodeOrTerminalId) {
            if (task) {
                let result = {
                    kind: kind,
                    taskId: task._id,
                    taskName: task.configurationProperties.name,
                    runType: task.configurationProperties.isBackground ? "background" /* Background */ : "singleRun" /* SingleRun */,
                    group: task.configurationProperties.group,
                    processId: undefined,
                    exitCode: undefined,
                    terminalId: undefined,
                    __task: task,
                };
                if (kind === "start" /* Start */) {
                    result.terminalId = processIdOrExitCodeOrTerminalId;
                }
                else if (kind === "processStarted" /* ProcessStarted */) {
                    result.processId = processIdOrExitCodeOrTerminalId;
                }
                else if (kind === "processEnded" /* ProcessEnded */) {
                    result.exitCode = processIdOrExitCodeOrTerminalId;
                }
                return Object.freeze(result);
            }
            else {
                return Object.freeze({ kind: "changed" /* Changed */ });
            }
        }
        TaskEvent.create = create;
    })(TaskEvent = exports.TaskEvent || (exports.TaskEvent = {}));
    var KeyedTaskIdentifier;
    (function (KeyedTaskIdentifier) {
        function sortedStringify(literal) {
            const keys = Object.keys(literal).sort();
            let result = '';
            for (const key of keys) {
                let stringified = literal[key];
                if (stringified instanceof Object) {
                    stringified = sortedStringify(stringified);
                }
                else if (typeof stringified === 'string') {
                    stringified = stringified.replace(/,/g, ',,');
                }
                result += key + ',' + stringified + ',';
            }
            return result;
        }
        function create(value) {
            const resultKey = sortedStringify(value);
            let result = { _key: resultKey, type: value.taskType };
            Objects.assign(result, value);
            return result;
        }
        KeyedTaskIdentifier.create = create;
    })(KeyedTaskIdentifier = exports.KeyedTaskIdentifier || (exports.KeyedTaskIdentifier = {}));
    var TaskDefinition;
    (function (TaskDefinition) {
        function createTaskIdentifier(external, reporter) {
            let definition = taskDefinitionRegistry_1.TaskDefinitionRegistry.get(external.type);
            if (definition === undefined) {
                // We have no task definition so we can't sanitize the literal. Take it as is
                let copy = Objects.deepClone(external);
                delete copy._key;
                return KeyedTaskIdentifier.create(copy);
            }
            let literal = Object.create(null);
            literal.type = definition.taskType;
            let required = new Set();
            definition.required.forEach(element => required.add(element));
            let properties = definition.properties;
            for (let property of Object.keys(properties)) {
                let value = external[property];
                if (value !== undefined && value !== null) {
                    literal[property] = value;
                }
                else if (required.has(property)) {
                    let schema = properties[property];
                    if (schema.default !== undefined) {
                        literal[property] = Objects.deepClone(schema.default);
                    }
                    else {
                        switch (schema.type) {
                            case 'boolean':
                                literal[property] = false;
                                break;
                            case 'number':
                            case 'integer':
                                literal[property] = 0;
                                break;
                            case 'string':
                                literal[property] = '';
                                break;
                            default:
                                reporter.error(nls.localize('TaskDefinition.missingRequiredProperty', 'Error: the task identifier \'{0}\' is missing the required property \'{1}\'. The task identifier will be ignored.', JSON.stringify(external, undefined, 0), property));
                                return undefined;
                        }
                    }
                }
            }
            return KeyedTaskIdentifier.create(literal);
        }
        TaskDefinition.createTaskIdentifier = createTaskIdentifier;
    })(TaskDefinition = exports.TaskDefinition || (exports.TaskDefinition = {}));
});
//# __sourceMappingURL=tasks.js.map