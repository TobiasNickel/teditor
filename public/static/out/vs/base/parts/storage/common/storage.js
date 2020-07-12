/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/async", "vs/base/common/types"], function (require, exports, lifecycle_1, event_1, async_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageDatabase = exports.Storage = exports.StorageHint = void 0;
    var StorageHint;
    (function (StorageHint) {
        // A hint to the storage that the storage
        // does not exist on disk yet. This allows
        // the storage library to improve startup
        // time by not checking the storage for data.
        StorageHint[StorageHint["STORAGE_DOES_NOT_EXIST"] = 0] = "STORAGE_DOES_NOT_EXIST";
    })(StorageHint = exports.StorageHint || (exports.StorageHint = {}));
    var StorageState;
    (function (StorageState) {
        StorageState[StorageState["None"] = 0] = "None";
        StorageState[StorageState["Initialized"] = 1] = "Initialized";
        StorageState[StorageState["Closed"] = 2] = "Closed";
    })(StorageState || (StorageState = {}));
    class Storage extends lifecycle_1.Disposable {
        constructor(database, options = Object.create(null)) {
            super();
            this.database = database;
            this.options = options;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this.state = StorageState.None;
            this.cache = new Map();
            this.flushDelayer = this._register(new async_1.ThrottledDelayer(Storage.DEFAULT_FLUSH_DELAY));
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.database.onDidChangeItemsExternal(e => this.onDidChangeItemsExternal(e)));
        }
        onDidChangeItemsExternal(e) {
            var _a, _b;
            // items that change external require us to update our
            // caches with the values. we just accept the value and
            // emit an event if there is a change.
            (_a = e.changed) === null || _a === void 0 ? void 0 : _a.forEach((value, key) => this.accept(key, value));
            (_b = e.deleted) === null || _b === void 0 ? void 0 : _b.forEach(key => this.accept(key, undefined));
        }
        accept(key, value) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            let changed = false;
            // Item got removed, check for deletion
            if (types_1.isUndefinedOrNull(value)) {
                changed = this.cache.delete(key);
            }
            // Item got updated, check for change
            else {
                const currentValue = this.cache.get(key);
                if (currentValue !== value) {
                    this.cache.set(key, value);
                    changed = true;
                }
            }
            // Signal to outside listeners
            if (changed) {
                this._onDidChangeStorage.fire(key);
            }
        }
        get items() {
            return this.cache;
        }
        get size() {
            return this.cache.size;
        }
        async init() {
            if (this.state !== StorageState.None) {
                return; // either closed or already initialized
            }
            this.state = StorageState.Initialized;
            if (this.options.hint === StorageHint.STORAGE_DOES_NOT_EXIST) {
                // return early if we know the storage file does not exist. this is a performance
                // optimization to not load all items of the underlying storage if we know that
                // there can be no items because the storage does not exist.
                return;
            }
            this.cache = await this.database.getItems();
        }
        get(key, fallbackValue) {
            const value = this.cache.get(key);
            if (types_1.isUndefinedOrNull(value)) {
                return fallbackValue;
            }
            return value;
        }
        getBoolean(key, fallbackValue) {
            const value = this.get(key);
            if (types_1.isUndefinedOrNull(value)) {
                return fallbackValue;
            }
            return value === 'true';
        }
        getNumber(key, fallbackValue) {
            const value = this.get(key);
            if (types_1.isUndefinedOrNull(value)) {
                return fallbackValue;
            }
            return parseInt(value, 10);
        }
        set(key, value) {
            if (this.state === StorageState.Closed) {
                return Promise.resolve(); // Return early if we are already closed
            }
            // We remove the key for undefined/null values
            if (types_1.isUndefinedOrNull(value)) {
                return this.delete(key);
            }
            // Otherwise, convert to String and store
            const valueStr = String(value);
            // Return early if value already set
            const currentValue = this.cache.get(key);
            if (currentValue === valueStr) {
                return Promise.resolve();
            }
            // Update in cache and pending
            this.cache.set(key, valueStr);
            this.pendingInserts.set(key, valueStr);
            this.pendingDeletes.delete(key);
            // Event
            this._onDidChangeStorage.fire(key);
            // Accumulate work by scheduling after timeout
            return this.flushDelayer.trigger(() => this.flushPending());
        }
        delete(key) {
            if (this.state === StorageState.Closed) {
                return Promise.resolve(); // Return early if we are already closed
            }
            // Remove from cache and add to pending
            const wasDeleted = this.cache.delete(key);
            if (!wasDeleted) {
                return Promise.resolve(); // Return early if value already deleted
            }
            if (!this.pendingDeletes.has(key)) {
                this.pendingDeletes.add(key);
            }
            this.pendingInserts.delete(key);
            // Event
            this._onDidChangeStorage.fire(key);
            // Accumulate work by scheduling after timeout
            return this.flushDelayer.trigger(() => this.flushPending());
        }
        async close() {
            if (this.state === StorageState.Closed) {
                return Promise.resolve(); // return if already closed
            }
            // Update state
            this.state = StorageState.Closed;
            // Trigger new flush to ensure data is persisted and then close
            // even if there is an error flushing. We must always ensure
            // the DB is closed to avoid corruption.
            //
            // Recovery: we pass our cache over as recovery option in case
            // the DB is not healthy.
            try {
                await this.flushDelayer.trigger(() => this.flushPending(), 0 /* as soon as possible */);
            }
            catch (error) {
                // Ignore
            }
            await this.database.close(() => this.cache);
        }
        flushPending() {
            if (this.pendingInserts.size === 0 && this.pendingDeletes.size === 0) {
                return Promise.resolve(); // return early if nothing to do
            }
            // Get pending data
            const updateRequest = { insert: this.pendingInserts, delete: this.pendingDeletes };
            // Reset pending data for next run
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            // Update in storage
            return this.database.updateItems(updateRequest);
        }
    }
    exports.Storage = Storage;
    Storage.DEFAULT_FLUSH_DELAY = 100;
    class InMemoryStorageDatabase {
        constructor() {
            this.onDidChangeItemsExternal = event_1.Event.None;
            this.items = new Map();
        }
        async getItems() {
            return this.items;
        }
        async updateItems(request) {
            if (request.insert) {
                request.insert.forEach((value, key) => this.items.set(key, value));
            }
            if (request.delete) {
                request.delete.forEach(key => this.items.delete(key));
            }
        }
        async close() { }
    }
    exports.InMemoryStorageDatabase = InMemoryStorageDatabase;
});
//# __sourceMappingURL=storage.js.map