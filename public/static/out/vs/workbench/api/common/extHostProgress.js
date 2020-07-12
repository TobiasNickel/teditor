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
define(["require", "exports", "./extHostTypeConverters", "vs/platform/progress/common/progress", "vs/nls", "vs/base/common/cancellation", "vs/base/common/decorators"], function (require, exports, extHostTypeConverters_1, progress_1, nls_1, cancellation_1, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostProgress = void 0;
    class ExtHostProgress {
        constructor(proxy) {
            this._handles = 0;
            this._mapHandleToCancellationSource = new Map();
            this._proxy = proxy;
        }
        withProgress(extension, options, task) {
            const handle = this._handles++;
            const { title, location, cancellable } = options;
            const source = nls_1.localize('extensionSource', "{0} (Extension)", extension.displayName || extension.name);
            this._proxy.$startProgress(handle, { location: extHostTypeConverters_1.ProgressLocation.from(location), title, source, cancellable }, extension);
            return this._withProgress(handle, task, !!cancellable);
        }
        _withProgress(handle, task, cancellable) {
            let source;
            if (cancellable) {
                source = new cancellation_1.CancellationTokenSource();
                this._mapHandleToCancellationSource.set(handle, source);
            }
            const progressEnd = (handle) => {
                this._proxy.$progressEnd(handle);
                this._mapHandleToCancellationSource.delete(handle);
                if (source) {
                    source.dispose();
                }
            };
            let p;
            try {
                p = task(new ProgressCallback(this._proxy, handle), cancellable && source ? source.token : cancellation_1.CancellationToken.None);
            }
            catch (err) {
                progressEnd(handle);
                throw err;
            }
            p.then(result => progressEnd(handle), err => progressEnd(handle));
            return p;
        }
        $acceptProgressCanceled(handle) {
            const source = this._mapHandleToCancellationSource.get(handle);
            if (source) {
                source.cancel();
                this._mapHandleToCancellationSource.delete(handle);
            }
        }
    }
    exports.ExtHostProgress = ExtHostProgress;
    function mergeProgress(result, currentValue) {
        result.message = currentValue.message;
        if (typeof currentValue.increment === 'number') {
            if (typeof result.increment === 'number') {
                result.increment += currentValue.increment;
            }
            else {
                result.increment = currentValue.increment;
            }
        }
        return result;
    }
    class ProgressCallback extends progress_1.Progress {
        constructor(_proxy, _handle) {
            super(p => this.throttledReport(p));
            this._proxy = _proxy;
            this._handle = _handle;
        }
        throttledReport(p) {
            this._proxy.$progressReport(this._handle, p);
        }
    }
    __decorate([
        decorators_1.throttle(100, (result, currentValue) => mergeProgress(result, currentValue), () => Object.create(null))
    ], ProgressCallback.prototype, "throttledReport", null);
});
//# __sourceMappingURL=extHostProgress.js.map