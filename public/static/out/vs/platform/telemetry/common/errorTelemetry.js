/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/objects"], function (require, exports, arrays_1, Errors, lifecycle_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorEvent = void 0;
    var ErrorEvent;
    (function (ErrorEvent) {
        function compare(a, b) {
            if (a.callstack < b.callstack) {
                return -1;
            }
            else if (a.callstack > b.callstack) {
                return 1;
            }
            return 0;
        }
        ErrorEvent.compare = compare;
    })(ErrorEvent = exports.ErrorEvent || (exports.ErrorEvent = {}));
    class BaseErrorTelemetry {
        constructor(telemetryService, flushDelay = BaseErrorTelemetry.ERROR_FLUSH_TIMEOUT) {
            this._flushHandle = -1;
            this._buffer = [];
            this._disposables = new lifecycle_1.DisposableStore();
            this._telemetryService = telemetryService;
            this._flushDelay = flushDelay;
            // (1) check for unexpected but handled errors
            const unbind = Errors.errorHandler.addListener((err) => this._onErrorEvent(err));
            this._disposables.add(lifecycle_1.toDisposable(unbind));
            // (2) install implementation-specific error listeners
            this.installErrorListeners();
        }
        dispose() {
            clearTimeout(this._flushHandle);
            this._flushBuffer();
            this._disposables.dispose();
        }
        installErrorListeners() {
            // to override
        }
        _onErrorEvent(err) {
            if (!err) {
                return;
            }
            // unwrap nested errors from loader
            if (err.detail && err.detail.stack) {
                err = err.detail;
            }
            // work around behavior in workerServer.ts that breaks up Error.stack
            let callstack = Array.isArray(err.stack) ? err.stack.join('\n') : err.stack;
            let msg = err.message ? err.message : objects_1.safeStringify(err);
            // errors without a stack are not useful telemetry
            if (!callstack) {
                return;
            }
            this._enqueue({ msg, callstack });
        }
        _enqueue(e) {
            const idx = arrays_1.binarySearch(this._buffer, e, ErrorEvent.compare);
            if (idx < 0) {
                e.count = 1;
                this._buffer.splice(~idx, 0, e);
            }
            else {
                if (!this._buffer[idx].count) {
                    this._buffer[idx].count = 0;
                }
                this._buffer[idx].count += 1;
            }
            if (this._flushHandle === -1) {
                this._flushHandle = setTimeout(() => {
                    this._flushBuffer();
                    this._flushHandle = -1;
                }, this._flushDelay);
            }
        }
        _flushBuffer() {
            for (let error of this._buffer) {
                this._telemetryService.publicLogError2('UnhandledError', error);
            }
            this._buffer.length = 0;
        }
    }
    exports.default = BaseErrorTelemetry;
    BaseErrorTelemetry.ERROR_FLUSH_TIMEOUT = 5 * 1000;
});
//# __sourceMappingURL=errorTelemetry.js.map