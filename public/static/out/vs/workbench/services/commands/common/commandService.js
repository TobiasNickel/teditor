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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/base/common/async"], function (require, exports, instantiation_1, commands_1, extensions_1, event_1, lifecycle_1, log_1, extensions_2, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandService = void 0;
    let CommandService = class CommandService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _extensionService, _logService) {
            super();
            this._instantiationService = _instantiationService;
            this._extensionService = _extensionService;
            this._logService = _logService;
            this._extensionHostIsReady = false;
            this._onWillExecuteCommand = this._register(new event_1.Emitter());
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._extensionService.whenInstalledExtensionsRegistered().then(value => this._extensionHostIsReady = value);
            this._starActivation = null;
        }
        _activateStar() {
            if (!this._starActivation) {
                // wait for * activation, limited to at most 30s
                this._starActivation = Promise.race([
                    this._extensionService.activateByEvent(`*`),
                    async_1.timeout(30000)
                ]);
            }
            return this._starActivation;
        }
        executeCommand(id, ...args) {
            this._logService.trace('CommandService#executeCommand', id);
            // we always send an activation event, but
            // we don't wait for it when the extension
            // host didn't yet start and the command is already registered
            const activation = this._extensionService.activateByEvent(`onCommand:${id}`);
            const commandIsRegistered = !!commands_1.CommandsRegistry.getCommand(id);
            if (!this._extensionHostIsReady && commandIsRegistered) {
                return this._tryExecuteCommand(id, args);
            }
            else {
                let waitFor = activation;
                if (!commandIsRegistered) {
                    waitFor = Promise.all([
                        activation,
                        Promise.race([
                            // race * activation against command registration
                            this._activateStar(),
                            event_1.Event.toPromise(event_1.Event.filter(commands_1.CommandsRegistry.onDidRegisterCommand, e => e === id))
                        ]),
                    ]);
                }
                return waitFor.then(_ => this._tryExecuteCommand(id, args));
            }
        }
        _tryExecuteCommand(id, args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction(command.handler, ...args);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    };
    CommandService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_1.IExtensionService),
        __param(2, log_1.ILogService)
    ], CommandService);
    exports.CommandService = CommandService;
    extensions_2.registerSingleton(commands_1.ICommandService, CommandService, true);
});
//# __sourceMappingURL=commandService.js.map