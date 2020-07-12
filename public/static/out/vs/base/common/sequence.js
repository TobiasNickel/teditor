/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sequence = void 0;
    class Sequence {
        constructor() {
            this.elements = [];
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
        }
        splice(start, deleteCount, toInsert = []) {
            this.elements.splice(start, deleteCount, ...toInsert);
            this._onDidSplice.fire({ start, deleteCount, toInsert });
        }
    }
    exports.Sequence = Sequence;
});
//# __sourceMappingURL=sequence.js.map