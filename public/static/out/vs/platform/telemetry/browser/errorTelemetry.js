/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/platform", "../common/errorTelemetry"], function (require, exports, lifecycle_1, platform_1, errorTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorTelemetry extends errorTelemetry_1.default {
        installErrorListeners() {
            let oldOnError;
            let that = this;
            if (typeof platform_1.globals.onerror === 'function') {
                oldOnError = platform_1.globals.onerror;
            }
            platform_1.globals.onerror = function (message, filename, line, column, e) {
                that._onUncaughtError(message, filename, line, column, e);
                if (oldOnError) {
                    oldOnError.apply(this, arguments);
                }
            };
            this._disposables.add(lifecycle_1.toDisposable(() => {
                if (oldOnError) {
                    platform_1.globals.onerror = oldOnError;
                }
            }));
        }
        _onUncaughtError(msg, file, line, column, err) {
            let data = {
                callstack: msg,
                msg,
                file,
                line,
                column
            };
            if (err) {
                let { name, message, stack } = err;
                data.uncaught_error_name = name;
                if (message) {
                    data.uncaught_error_msg = message;
                }
                if (stack) {
                    data.callstack = Array.isArray(err.stack)
                        ? err.stack = err.stack.join('\n')
                        : err.stack;
                }
            }
            this._enqueue(data);
        }
    }
    exports.default = ErrorTelemetry;
});
//# __sourceMappingURL=errorTelemetry.js.map