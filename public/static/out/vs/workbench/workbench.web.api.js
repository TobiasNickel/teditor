/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/web.main", "vs/base/common/uri", "vs/platform/log/common/log", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/workbench/workbench.web.main"], function (require, exports, web_main_1, uri_1, log_1, event_1, lifecycle_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.commands = exports.LogLevel = exports.FileChangeType = exports.FileSystemProviderCapabilities = exports.Disposable = exports.Emitter = exports.Event = exports.URI = exports.create = void 0;
    Object.defineProperty(exports, "URI", { enumerable: true, get: function () { return uri_1.URI; } });
    Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return log_1.LogLevel; } });
    Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return event_1.Event; } });
    Object.defineProperty(exports, "Emitter", { enumerable: true, get: function () { return event_1.Emitter; } });
    Object.defineProperty(exports, "Disposable", { enumerable: true, get: function () { return lifecycle_1.Disposable; } });
    /**
     * Creates the workbench with the provided options in the provided container.
     *
     * @param domElement the container to create the workbench in
     * @param options for setting up the workbench
     */
    let created = false;
    let workbenchPromiseResolve;
    const workbenchPromise = new Promise(resolve => workbenchPromiseResolve = resolve);
    async function create(domElement, options) {
        // Assert that the workbench is not created more than once. We currently
        // do not support this and require a full context switch to clean-up.
        if (created) {
            throw new Error('Unable to create the VSCode workbench more than once.');
        }
        else {
            created = true;
        }
        // Startup workbench and resolve waiters
        const workbench = await web_main_1.main(domElement, options);
        workbenchPromiseResolve(workbench);
        // Register commands if any
        if (Array.isArray(options.commands)) {
            for (const command of options.commands) {
                commands_1.CommandsRegistry.registerCommand(command.id, (accessor, ...args) => {
                    // we currently only pass on the arguments but not the accessor
                    // to the command to reduce our exposure of internal API.
                    return command.handler(...args);
                });
            }
        }
    }
    exports.create = create;
    //#region API Facade
    var commands;
    (function (commands) {
        /**
        * Allows to execute any command if known with the provided arguments.
        *
        * @param command Identifier of the command to execute.
        * @param rest Parameters passed to the command function.
        * @return A promise that resolves to the returned value of the given command.
        */
        async function executeCommand(command, ...args) {
            const workbench = await workbenchPromise;
            return workbench.commands.executeCommand(command, ...args);
        }
        commands.executeCommand = executeCommand;
    })(commands || (commands = {}));
    exports.commands = commands;
});
//#endregion
//# __sourceMappingURL=workbench.web.api.js.map