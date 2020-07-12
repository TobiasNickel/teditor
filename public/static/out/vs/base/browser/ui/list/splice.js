/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CombinedSpliceable = void 0;
    class CombinedSpliceable {
        constructor(spliceables) {
            this.spliceables = spliceables;
        }
        splice(start, deleteCount, elements) {
            this.spliceables.forEach(s => s.splice(start, deleteCount, elements));
        }
    }
    exports.CombinedSpliceable = CombinedSpliceable;
});
//# __sourceMappingURL=splice.js.map