/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/linkedList", "vs/base/common/iterator"], function (require, exports, lifecycle_1, types_1, instantiation_1, event_1, linkedList_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullCommandService = exports.CommandsRegistry = exports.ICommandService = void 0;
    exports.ICommandService = instantiation_1.createDecorator('commandService');
    exports.CommandsRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._onDidRegisterCommand = new event_1.Emitter();
            this.onDidRegisterCommand = this._onDidRegisterCommand.event;
        }
        registerCommand(idOrCommand, handler) {
            if (!idOrCommand) {
                throw new Error(`invalid command`);
            }
            if (typeof idOrCommand === 'string') {
                if (!handler) {
                    throw new Error(`invalid command`);
                }
                return this.registerCommand({ id: idOrCommand, handler });
            }
            // add argument validation if rich command metadata is provided
            if (idOrCommand.description) {
                const constraints = [];
                for (let arg of idOrCommand.description.args) {
                    constraints.push(arg.constraint);
                }
                const actualHandler = idOrCommand.handler;
                idOrCommand.handler = function (accessor, ...args) {
                    types_1.validateConstraints(args, constraints);
                    return actualHandler(accessor, ...args);
                };
            }
            // find a place to store the command
            const { id } = idOrCommand;
            let commands = this._commands.get(id);
            if (!commands) {
                commands = new linkedList_1.LinkedList();
                this._commands.set(id, commands);
            }
            let removeFn = commands.unshift(idOrCommand);
            let ret = lifecycle_1.toDisposable(() => {
                removeFn();
                const command = this._commands.get(id);
                if (command === null || command === void 0 ? void 0 : command.isEmpty()) {
                    this._commands.delete(id);
                }
            });
            // tell the world about this command
            this._onDidRegisterCommand.fire(id);
            return ret;
        }
        registerCommandAlias(oldId, newId) {
            return exports.CommandsRegistry.registerCommand(oldId, (accessor, ...args) => accessor.get(exports.ICommandService).executeCommand(newId, ...args));
        }
        getCommand(id) {
            const list = this._commands.get(id);
            if (!list || list.isEmpty()) {
                return undefined;
            }
            return iterator_1.Iterable.first(list);
        }
        getCommands() {
            const result = new Map();
            for (const key of this._commands.keys()) {
                const command = this.getCommand(key);
                if (command) {
                    result.set(key, command);
                }
            }
            return result;
        }
    };
    exports.NullCommandService = {
        _serviceBrand: undefined,
        onWillExecuteCommand: () => lifecycle_1.Disposable.None,
        onDidExecuteCommand: () => lifecycle_1.Disposable.None,
        executeCommand() {
            return Promise.resolve(undefined);
        }
    };
});
//# __sourceMappingURL=commands.js.map