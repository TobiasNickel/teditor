/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cache = void 0;
    class Cache {
        constructor(id) {
            this.id = id;
            this._data = new Map();
            this._idPool = 1;
        }
        add(item) {
            const id = this._idPool++;
            this._data.set(id, item);
            this.logDebugInfo();
            return id;
        }
        get(pid, id) {
            return this._data.has(pid) ? this._data.get(pid)[id] : undefined;
        }
        delete(id) {
            this._data.delete(id);
            this.logDebugInfo();
        }
        logDebugInfo() {
            if (!Cache.enableDebugLogging) {
                return;
            }
            console.log(`${this.id} cache size — ${this._data.size}`);
        }
    }
    exports.Cache = Cache;
    Cache.enableDebugLogging = false;
});
//# __sourceMappingURL=cache.js.map