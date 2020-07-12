/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferLogService = void 0;
    function getLogFunction(logger, level) {
        switch (level) {
            case log_1.LogLevel.Trace: return logger.trace;
            case log_1.LogLevel.Debug: return logger.debug;
            case log_1.LogLevel.Info: return logger.info;
            case log_1.LogLevel.Warning: return logger.warn;
            case log_1.LogLevel.Error: return logger.error;
            case log_1.LogLevel.Critical: return logger.critical;
            default: throw new Error('Invalid log level');
        }
    }
    class BufferLogService extends log_1.AbstractLogService {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.buffer = [];
            this._logger = undefined;
            this.setLevel(logLevel);
            this._register(this.onDidChangeLogLevel(level => {
                if (this._logger) {
                    this._logger.setLevel(level);
                }
            }));
        }
        set logger(logger) {
            this._logger = logger;
            for (const { level, args } of this.buffer) {
                const fn = getLogFunction(logger, level);
                fn.apply(logger, args);
            }
            this.buffer = [];
        }
        _log(level, ...args) {
            if (this._logger) {
                const fn = getLogFunction(this._logger, level);
                fn.apply(this._logger, args);
            }
            else if (this.getLevel() <= level) {
                this.buffer.push({ level, args });
            }
        }
        trace(message, ...args) {
            this._log(log_1.LogLevel.Trace, message, ...args);
        }
        debug(message, ...args) {
            this._log(log_1.LogLevel.Debug, message, ...args);
        }
        info(message, ...args) {
            this._log(log_1.LogLevel.Info, message, ...args);
        }
        warn(message, ...args) {
            this._log(log_1.LogLevel.Warning, message, ...args);
        }
        error(message, ...args) {
            this._log(log_1.LogLevel.Error, message, ...args);
        }
        critical(message, ...args) {
            this._log(log_1.LogLevel.Critical, message, ...args);
        }
        dispose() {
            if (this._logger) {
                this._logger.dispose();
            }
        }
        flush() {
            if (this._logger) {
                this._logger.flush();
            }
        }
    }
    exports.BufferLogService = BufferLogService;
});
//# __sourceMappingURL=bufferLog.js.map