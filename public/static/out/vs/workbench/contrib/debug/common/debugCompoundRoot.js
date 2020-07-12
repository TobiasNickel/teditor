/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugCompoundRoot = void 0;
    class DebugCompoundRoot {
        constructor() {
            this.stopped = false;
            this.stopEmitter = new event_1.Emitter();
            this.onDidSessionStop = this.stopEmitter.event;
        }
        sessionStopped() {
            if (!this.stopped) { // avoid sending extranous terminate events
                this.stopped = true;
                this.stopEmitter.fire();
            }
        }
    }
    exports.DebugCompoundRoot = DebugCompoundRoot;
});
//# __sourceMappingURL=debugCompoundRoot.js.map