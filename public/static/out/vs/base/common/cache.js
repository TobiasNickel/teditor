/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation"], function (require, exports, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cache = void 0;
    class Cache {
        constructor(task) {
            this.task = task;
            this.result = null;
        }
        get() {
            if (this.result) {
                return this.result;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const promise = this.task(cts.token);
            this.result = {
                promise,
                dispose: () => {
                    this.result = null;
                    cts.cancel();
                    cts.dispose();
                }
            };
            return this.result;
        }
    }
    exports.Cache = Cache;
});
//# __sourceMappingURL=cache.js.map