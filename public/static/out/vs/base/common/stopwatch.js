/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StopWatch = void 0;
    const hasPerformanceNow = (platform_1.globals.performance && typeof platform_1.globals.performance.now === 'function');
    class StopWatch {
        constructor(highResolution) {
            this._highResolution = hasPerformanceNow && highResolution;
            this._startTime = this._now();
            this._stopTime = -1;
        }
        static create(highResolution = true) {
            return new StopWatch(highResolution);
        }
        stop() {
            this._stopTime = this._now();
        }
        elapsed() {
            if (this._stopTime !== -1) {
                return this._stopTime - this._startTime;
            }
            return this._now() - this._startTime;
        }
        _now() {
            return this._highResolution ? platform_1.globals.performance.now() : new Date().getTime();
        }
    }
    exports.StopWatch = StopWatch;
});
//# __sourceMappingURL=stopwatch.js.map