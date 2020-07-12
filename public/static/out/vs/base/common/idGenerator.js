/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultGenerator = exports.IdGenerator = void 0;
    class IdGenerator {
        constructor(prefix) {
            this._prefix = prefix;
            this._lastId = 0;
        }
        nextId() {
            return this._prefix + (++this._lastId);
        }
    }
    exports.IdGenerator = IdGenerator;
    exports.defaultGenerator = new IdGenerator('id#');
});
//# __sourceMappingURL=idGenerator.js.map