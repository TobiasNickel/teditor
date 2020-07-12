/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/errorMessage"], function (require, exports, instantiation_1, lifecycle_1, platform_1, event_1, errorMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLogLevel = exports.NullLogService = exports.DelegatedLogService = exports.MultiplexLogService = exports.ConsoleLogInMainService = exports.LogServiceAdapter = exports.ConsoleLogService = exports.ConsoleLogMainService = exports.AbstractLogService = exports.DEFAULT_LOG_LEVEL = exports.LogLevel = exports.ILoggerService = exports.ILogService = void 0;
    exports.ILogService = instantiation_1.createDecorator('logService');
    exports.ILoggerService = instantiation_1.createDecorator('loggerService');
    function now() {
        return new Date().toISOString();
    }
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["Trace"] = 0] = "Trace";
        LogLevel[LogLevel["Debug"] = 1] = "Debug";
        LogLevel[LogLevel["Info"] = 2] = "Info";
        LogLevel[LogLevel["Warning"] = 3] = "Warning";
        LogLevel[LogLevel["Error"] = 4] = "Error";
        LogLevel[LogLevel["Critical"] = 5] = "Critical";
        LogLevel[LogLevel["Off"] = 6] = "Off";
    })(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
    exports.DEFAULT_LOG_LEVEL = LogLevel.Info;
    class AbstractLogService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.level = exports.DEFAULT_LOG_LEVEL;
            this._onDidChangeLogLevel = this._register(new event_1.Emitter());
            this.onDidChangeLogLevel = this._onDidChangeLogLevel.event;
        }
        setLevel(level) {
            if (this.level !== level) {
                this.level = level;
                this._onDidChangeLogLevel.fire(this.level);
            }
        }
        getLevel() {
            return this.level;
        }
    }
    exports.AbstractLogService = AbstractLogService;
    class ConsoleLogMainService extends AbstractLogService {
        constructor(logLevel = exports.DEFAULT_LOG_LEVEL) {
            super();
            this.setLevel(logLevel);
            this.useColors = !platform_1.isWindows;
        }
        trace(message, ...args) {
            if (this.getLevel() <= LogLevel.Trace) {
                if (this.useColors) {
                    console.log(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[main ${now()}]`, message, ...args);
                }
            }
        }
        debug(message, ...args) {
            if (this.getLevel() <= LogLevel.Debug) {
                if (this.useColors) {
                    console.log(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[main ${now()}]`, message, ...args);
                }
            }
        }
        info(message, ...args) {
            if (this.getLevel() <= LogLevel.Info) {
                if (this.useColors) {
                    console.log(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.log(`[main ${now()}]`, message, ...args);
                }
            }
        }
        warn(message, ...args) {
            if (this.getLevel() <= LogLevel.Warning) {
                if (this.useColors) {
                    console.warn(`\x1b[93m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.warn(`[main ${now()}]`, message, ...args);
                }
            }
        }
        error(message, ...args) {
            if (this.getLevel() <= LogLevel.Error) {
                if (this.useColors) {
                    console.error(`\x1b[91m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[main ${now()}]`, message, ...args);
                }
            }
        }
        critical(message, ...args) {
            if (this.getLevel() <= LogLevel.Critical) {
                if (this.useColors) {
                    console.error(`\x1b[90m[main ${now()}]\x1b[0m`, message, ...args);
                }
                else {
                    console.error(`[main ${now()}]`, message, ...args);
                }
            }
        }
        dispose() {
            // noop
        }
        flush() {
            // noop
        }
    }
    exports.ConsoleLogMainService = ConsoleLogMainService;
    class ConsoleLogService extends AbstractLogService {
        constructor(logLevel = exports.DEFAULT_LOG_LEVEL) {
            super();
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.getLevel() <= LogLevel.Trace) {
                console.log('%cTRACE', 'color: #888', message, ...args);
            }
        }
        debug(message, ...args) {
            if (this.getLevel() <= LogLevel.Debug) {
                console.log('%cDEBUG', 'background: #eee; color: #888', message, ...args);
            }
        }
        info(message, ...args) {
            if (this.getLevel() <= LogLevel.Info) {
                console.log('%c INFO', 'color: #33f', message, ...args);
            }
        }
        warn(message, ...args) {
            if (this.getLevel() <= LogLevel.Warning) {
                console.log('%c WARN', 'color: #993', message, ...args);
            }
        }
        error(message, ...args) {
            if (this.getLevel() <= LogLevel.Error) {
                console.log('%c  ERR', 'color: #f33', message, ...args);
            }
        }
        critical(message, ...args) {
            if (this.getLevel() <= LogLevel.Critical) {
                console.log('%cCRITI', 'background: #f33; color: white', message, ...args);
            }
        }
        dispose() {
            // noop
        }
        flush() {
            // noop
        }
    }
    exports.ConsoleLogService = ConsoleLogService;
    class LogServiceAdapter extends AbstractLogService {
        constructor(adapter, logLevel = exports.DEFAULT_LOG_LEVEL) {
            super();
            this.adapter = adapter;
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.getLevel() <= LogLevel.Trace) {
                this.adapter.consoleLog('trace', [this.extractMessage(message), ...args]);
            }
        }
        debug(message, ...args) {
            if (this.getLevel() <= LogLevel.Debug) {
                this.adapter.consoleLog('debug', [this.extractMessage(message), ...args]);
            }
        }
        info(message, ...args) {
            if (this.getLevel() <= LogLevel.Info) {
                this.adapter.consoleLog('info', [this.extractMessage(message), ...args]);
            }
        }
        warn(message, ...args) {
            if (this.getLevel() <= LogLevel.Warning) {
                this.adapter.consoleLog('warn', [this.extractMessage(message), ...args]);
            }
        }
        error(message, ...args) {
            if (this.getLevel() <= LogLevel.Error) {
                this.adapter.consoleLog('error', [this.extractMessage(message), ...args]);
            }
        }
        critical(message, ...args) {
            if (this.getLevel() <= LogLevel.Critical) {
                this.adapter.consoleLog('critical', [this.extractMessage(message), ...args]);
            }
        }
        extractMessage(msg) {
            if (typeof msg === 'string') {
                return msg;
            }
            return errorMessage_1.toErrorMessage(msg, this.getLevel() <= LogLevel.Trace);
        }
        dispose() {
            // noop
        }
        flush() {
            // noop
        }
    }
    exports.LogServiceAdapter = LogServiceAdapter;
    class ConsoleLogInMainService extends LogServiceAdapter {
        constructor(client, logLevel = exports.DEFAULT_LOG_LEVEL) {
            super({ consoleLog: (type, args) => client.consoleLog(type, args) }, logLevel);
        }
    }
    exports.ConsoleLogInMainService = ConsoleLogInMainService;
    class MultiplexLogService extends AbstractLogService {
        constructor(logServices) {
            super();
            this.logServices = logServices;
            if (logServices.length) {
                this.setLevel(logServices[0].getLevel());
            }
        }
        setLevel(level) {
            for (const logService of this.logServices) {
                logService.setLevel(level);
            }
            super.setLevel(level);
        }
        trace(message, ...args) {
            for (const logService of this.logServices) {
                logService.trace(message, ...args);
            }
        }
        debug(message, ...args) {
            for (const logService of this.logServices) {
                logService.debug(message, ...args);
            }
        }
        info(message, ...args) {
            for (const logService of this.logServices) {
                logService.info(message, ...args);
            }
        }
        warn(message, ...args) {
            for (const logService of this.logServices) {
                logService.warn(message, ...args);
            }
        }
        error(message, ...args) {
            for (const logService of this.logServices) {
                logService.error(message, ...args);
            }
        }
        critical(message, ...args) {
            for (const logService of this.logServices) {
                logService.critical(message, ...args);
            }
        }
        flush() {
            for (const logService of this.logServices) {
                logService.flush();
            }
        }
        dispose() {
            for (const logService of this.logServices) {
                logService.dispose();
            }
        }
    }
    exports.MultiplexLogService = MultiplexLogService;
    class DelegatedLogService extends lifecycle_1.Disposable {
        constructor(logService) {
            super();
            this.logService = logService;
            this._register(logService);
        }
        get onDidChangeLogLevel() {
            return this.logService.onDidChangeLogLevel;
        }
        setLevel(level) {
            this.logService.setLevel(level);
        }
        getLevel() {
            return this.logService.getLevel();
        }
        trace(message, ...args) {
            this.logService.trace(message, ...args);
        }
        debug(message, ...args) {
            this.logService.debug(message, ...args);
        }
        info(message, ...args) {
            this.logService.info(message, ...args);
        }
        warn(message, ...args) {
            this.logService.warn(message, ...args);
        }
        error(message, ...args) {
            this.logService.error(message, ...args);
        }
        critical(message, ...args) {
            this.logService.critical(message, ...args);
        }
        flush() {
            this.logService.flush();
        }
    }
    exports.DelegatedLogService = DelegatedLogService;
    class NullLogService {
        constructor() {
            this.onDidChangeLogLevel = new event_1.Emitter().event;
        }
        setLevel(level) { }
        getLevel() { return LogLevel.Info; }
        trace(message, ...args) { }
        debug(message, ...args) { }
        info(message, ...args) { }
        warn(message, ...args) { }
        error(message, ...args) { }
        critical(message, ...args) { }
        dispose() { }
        flush() { }
    }
    exports.NullLogService = NullLogService;
    function getLogLevel(environmentService) {
        if (environmentService.verbose) {
            return LogLevel.Trace;
        }
        if (typeof environmentService.logLevel === 'string') {
            const logLevel = environmentService.logLevel.toLowerCase();
            switch (logLevel) {
                case 'trace':
                    return LogLevel.Trace;
                case 'debug':
                    return LogLevel.Debug;
                case 'info':
                    return LogLevel.Info;
                case 'warn':
                    return LogLevel.Warning;
                case 'error':
                    return LogLevel.Error;
                case 'critical':
                    return LogLevel.Critical;
                case 'off':
                    return LogLevel.Off;
            }
        }
        return exports.DEFAULT_LOG_LEVEL;
    }
    exports.getLogLevel = getLogLevel;
});
//# __sourceMappingURL=log.js.map