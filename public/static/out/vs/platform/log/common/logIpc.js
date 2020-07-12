/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/event"], function (require, exports, log_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FollowerLogService = exports.LoggerChannelClient = exports.LoggerChannel = void 0;
    class LoggerChannel {
        constructor(service) {
            this.service = service;
            this.onDidChangeLogLevel = event_1.Event.buffer(service.onDidChangeLogLevel, true);
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeLogLevel': return this.onDidChangeLogLevel;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'setLevel':
                    this.service.setLevel(arg);
                    return Promise.resolve();
                case 'consoleLog':
                    this.consoleLog(arg[0], arg[1]);
                    return Promise.resolve();
            }
            throw new Error(`Call not found: ${command}`);
        }
        consoleLog(severity, args) {
            let consoleFn = console.log;
            switch (severity) {
                case 'error':
                    consoleFn = console.error;
                    break;
                case 'warn':
                    consoleFn = console.warn;
                    break;
                case 'info':
                    consoleFn = console.info;
                    break;
            }
            consoleFn.call(console, ...args);
        }
    }
    exports.LoggerChannel = LoggerChannel;
    class LoggerChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        get onDidChangeLogLevel() {
            return this.channel.listen('onDidChangeLogLevel');
        }
        setLevel(level) {
            LoggerChannelClient.setLevel(this.channel, level);
        }
        static setLevel(channel, level) {
            return channel.call('setLevel', level);
        }
        consoleLog(severity, args) {
            this.channel.call('consoleLog', [severity, args]);
        }
    }
    exports.LoggerChannelClient = LoggerChannelClient;
    class FollowerLogService extends log_1.DelegatedLogService {
        constructor(parent, logService) {
            super(logService);
            this.parent = parent;
            this._register(parent.onDidChangeLogLevel(level => logService.setLevel(level)));
        }
        setLevel(level) {
            super.setLevel(level);
            this.parent.setLevel(level);
        }
    }
    exports.FollowerLogService = FollowerLogService;
});
//# __sourceMappingURL=logIpc.js.map