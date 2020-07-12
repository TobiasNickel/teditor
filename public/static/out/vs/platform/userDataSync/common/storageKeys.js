/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/map", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, map_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageKeysSyncRegistryService = exports.IStorageKeysSyncRegistryService = void 0;
    exports.IStorageKeysSyncRegistryService = instantiation_1.createDecorator('IStorageKeysSyncRegistryService');
    class StorageKeysSyncRegistryService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._storageKeys = new Map();
            this._onDidChangeStorageKeys = this._register(new event_1.Emitter());
            this.onDidChangeStorageKeys = this._onDidChangeStorageKeys.event;
            this._register(lifecycle_1.toDisposable(() => this._storageKeys.clear()));
        }
        get storageKeys() { return map_1.values(this._storageKeys); }
        registerStorageKey(storageKey) {
            if (!this._storageKeys.has(storageKey.key)) {
                this._storageKeys.set(storageKey.key, storageKey);
                this._onDidChangeStorageKeys.fire(this.storageKeys);
            }
        }
    }
    exports.StorageKeysSyncRegistryService = StorageKeysSyncRegistryService;
});
//# __sourceMappingURL=storageKeys.js.map