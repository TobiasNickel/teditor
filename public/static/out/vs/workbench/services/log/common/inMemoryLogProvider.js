/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/log/common/keyValueLogProvider", "vs/base/common/map"], function (require, exports, keyValueLogProvider_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryLogProvider = void 0;
    class InMemoryLogProvider extends keyValueLogProvider_1.KeyValueLogProvider {
        constructor() {
            super(...arguments);
            this.logs = new Map();
        }
        async getAllKeys() {
            return map_1.keys(this.logs);
        }
        async hasKey(key) {
            return this.logs.has(key);
        }
        async getValue(key) {
            return this.logs.get(key) || '';
        }
        async setValue(key, value) {
            this.logs.set(key, value);
        }
        async deleteKey(key) {
            this.logs.delete(key);
        }
    }
    exports.InMemoryLogProvider = InMemoryLogProvider;
});
//# __sourceMappingURL=inMemoryLogProvider.js.map