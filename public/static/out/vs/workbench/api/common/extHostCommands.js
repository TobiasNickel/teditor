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
define(["require", "exports", "vs/base/common/types", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/objects", "./extHost.protocol", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/marshalling", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService"], function (require, exports, types_1, extHostTypes, extHostTypeConverter, objects_1, extHost_protocol_1, arrays_1, log_1, marshalling_1, range_1, position_1, uri_1, lifecycle_1, instantiation_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostCommands = exports.CommandsConverter = exports.ExtHostCommands = void 0;
    let ExtHostCommands = class ExtHostCommands {
        constructor(extHostRpc, logService) {
            this._commands = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadCommands);
            this._logService = logService;
            this._converter = new CommandsConverter(this, logService);
            this._argumentProcessors = [
                {
                    processArgument(a) {
                        // URI, Regex
                        return marshalling_1.revive(a);
                    }
                },
                {
                    processArgument(arg) {
                        return objects_1.cloneAndChange(arg, function (obj) {
                            // Reverse of https://github.com/Microsoft/vscode/blob/1f28c5fc681f4c01226460b6d1c7e91b8acb4a5b/src/vs/workbench/api/node/extHostCommands.ts#L112-L127
                            if (range_1.Range.isIRange(obj)) {
                                return extHostTypeConverter.Range.to(obj);
                            }
                            if (position_1.Position.isIPosition(obj)) {
                                return extHostTypeConverter.Position.to(obj);
                            }
                            if (range_1.Range.isIRange(obj.range) && uri_1.URI.isUri(obj.uri)) {
                                return extHostTypeConverter.location.to(obj);
                            }
                            if (!Array.isArray(obj)) {
                                return obj;
                            }
                        });
                    }
                }
            ];
        }
        get converter() {
            return this._converter;
        }
        registerArgumentProcessor(processor) {
            this._argumentProcessors.push(processor);
        }
        registerCommand(global, id, callback, thisArg, description) {
            this._logService.trace('ExtHostCommands#registerCommand', id);
            if (!id.trim().length) {
                throw new Error('invalid id');
            }
            if (this._commands.has(id)) {
                throw new Error(`command '${id}' already exists`);
            }
            this._commands.set(id, { callback, thisArg, description });
            if (global) {
                this._proxy.$registerCommand(id);
            }
            return new extHostTypes.Disposable(() => {
                if (this._commands.delete(id)) {
                    if (global) {
                        this._proxy.$unregisterCommand(id);
                    }
                }
            });
        }
        executeCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#executeCommand', id);
            return this._doExecuteCommand(id, args, true);
        }
        async _doExecuteCommand(id, args, retry) {
            if (this._commands.has(id)) {
                // we stay inside the extension host and support
                // to pass any kind of parameters around
                return this._executeContributedCommand(id, args);
            }
            else {
                // automagically convert some argument types
                const toArgs = objects_1.cloneAndChange(args, function (value) {
                    if (value instanceof extHostTypes.Position) {
                        return extHostTypeConverter.Position.from(value);
                    }
                    if (value instanceof extHostTypes.Range) {
                        return extHostTypeConverter.Range.from(value);
                    }
                    if (value instanceof extHostTypes.Location) {
                        return extHostTypeConverter.location.from(value);
                    }
                    if (!Array.isArray(value)) {
                        return value;
                    }
                });
                try {
                    const result = await this._proxy.$executeCommand(id, toArgs, retry);
                    return marshalling_1.revive(result);
                }
                catch (e) {
                    // Rerun the command when it wasn't known, had arguments, and when retry
                    // is enabled. We do this because the command might be registered inside
                    // the extension host now and can therfore accept the arguments as-is.
                    if (e instanceof Error && e.message === '$executeCommand:retry') {
                        return this._doExecuteCommand(id, args, false);
                    }
                    else {
                        throw e;
                    }
                }
            }
        }
        _executeContributedCommand(id, args) {
            const command = this._commands.get(id);
            if (!command) {
                throw new Error('Unknown command');
            }
            let { callback, thisArg, description } = command;
            if (description) {
                for (let i = 0; i < description.args.length; i++) {
                    try {
                        types_1.validateConstraint(args[i], description.args[i].constraint);
                    }
                    catch (err) {
                        return Promise.reject(new Error(`Running the contributed command: '${id}' failed. Illegal argument '${description.args[i].name}' - ${description.args[i].description}`));
                    }
                }
            }
            try {
                const result = callback.apply(thisArg, args);
                return Promise.resolve(result);
            }
            catch (err) {
                this._logService.error(err, id);
                return Promise.reject(new Error(`Running the contributed command: '${id}' failed.`));
            }
        }
        $executeContributedCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#$executeContributedCommand', id);
            if (!this._commands.has(id)) {
                return Promise.reject(new Error(`Contributed command '${id}' does not exist.`));
            }
            else {
                args = args.map(arg => this._argumentProcessors.reduce((r, p) => p.processArgument(r), arg));
                return this._executeContributedCommand(id, args);
            }
        }
        getCommands(filterUnderscoreCommands = false) {
            this._logService.trace('ExtHostCommands#getCommands', filterUnderscoreCommands);
            return this._proxy.$getCommands().then(result => {
                if (filterUnderscoreCommands) {
                    result = result.filter(command => command[0] !== '_');
                }
                return result;
            });
        }
        $getContributedCommandHandlerDescriptions() {
            const result = Object.create(null);
            for (let [id, command] of this._commands) {
                let { description } = command;
                if (description) {
                    result[id] = description;
                }
            }
            return Promise.resolve(result);
        }
    };
    ExtHostCommands = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostCommands);
    exports.ExtHostCommands = ExtHostCommands;
    class CommandsConverter {
        // --- conversion between internal and api commands
        constructor(_commands, _logService) {
            this._commands = _commands;
            this._logService = _logService;
            this._cache = new Map();
            this._cachIdPool = 0;
            this._delegatingCommandId = `_vscode_delegate_cmd_${Date.now().toString(36)}`;
            this._commands.registerCommand(true, this._delegatingCommandId, this._executeConvertedCommand, this);
        }
        toInternal(command, disposables) {
            if (!command) {
                return undefined;
            }
            const result = {
                $ident: undefined,
                id: command.command,
                title: command.title,
                tooltip: command.tooltip
            };
            if (command.command && arrays_1.isNonEmptyArray(command.arguments)) {
                // we have a contributed command with arguments. that
                // means we don't want to send the arguments around
                const id = ++this._cachIdPool;
                this._cache.set(id, command);
                disposables.add(lifecycle_1.toDisposable(() => {
                    this._cache.delete(id);
                    this._logService.trace('CommandsConverter#DISPOSE', id);
                }));
                result.$ident = id;
                result.id = this._delegatingCommandId;
                result.arguments = [id];
                this._logService.trace('CommandsConverter#CREATE', command.command, id);
            }
            return result;
        }
        fromInternal(command) {
            const id = extHost_protocol_1.ObjectIdentifier.of(command);
            if (typeof id === 'number') {
                return this._cache.get(id);
            }
            else {
                return {
                    command: command.id,
                    title: command.title,
                    arguments: command.arguments
                };
            }
        }
        _executeConvertedCommand(...args) {
            const actualCmd = this._cache.get(args[0]);
            this._logService.trace('CommandsConverter#EXECUTE', args[0], actualCmd ? actualCmd.command : 'MISSING');
            if (!actualCmd) {
                return Promise.reject('actual command NOT FOUND');
            }
            return this._commands.executeCommand(actualCmd.command, ...(actualCmd.arguments || []));
        }
    }
    exports.CommandsConverter = CommandsConverter;
    exports.IExtHostCommands = instantiation_1.createDecorator('IExtHostCommands');
});
//# __sourceMappingURL=extHostCommands.js.map