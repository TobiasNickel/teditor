/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/log/common/keyValueLogProvider"], function (require, exports, keyValueLogProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBLogProvider = exports.INDEXEDDB_LOGS_OBJECT_STORE = exports.INDEXEDDB_VSCODE_DB = void 0;
    exports.INDEXEDDB_VSCODE_DB = 'vscode-web-db';
    exports.INDEXEDDB_LOGS_OBJECT_STORE = 'vscode-logs-store';
    class IndexedDBLogProvider extends keyValueLogProvider_1.KeyValueLogProvider {
        constructor(scheme) {
            super(scheme);
            this.database = this.openDatabase(1);
        }
        openDatabase(version) {
            return new Promise((c, e) => {
                const request = window.indexedDB.open(exports.INDEXEDDB_VSCODE_DB, version);
                request.onerror = (err) => e(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    if (db.objectStoreNames.contains(exports.INDEXEDDB_LOGS_OBJECT_STORE)) {
                        c(db);
                    }
                };
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(exports.INDEXEDDB_LOGS_OBJECT_STORE)) {
                        db.createObjectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                    }
                    c(db);
                };
            });
        }
        async getAllKeys() {
            return new Promise(async (c, e) => {
                const db = await this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE]);
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.getAllKeys();
                request.onerror = () => e(request.error);
                request.onsuccess = () => c(request.result);
            });
        }
        hasKey(key) {
            return new Promise(async (c, e) => {
                const db = await this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE]);
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.getKey(key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => {
                    c(!!request.result);
                };
            });
        }
        getValue(key) {
            return new Promise(async (c, e) => {
                const db = await this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE]);
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.get(key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => c(request.result || '');
            });
        }
        setValue(key, value) {
            return new Promise(async (c, e) => {
                const db = await this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE], 'readwrite');
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.put(value, key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => c();
            });
        }
        deleteKey(key) {
            return new Promise(async (c, e) => {
                const db = await this.database;
                const transaction = db.transaction([exports.INDEXEDDB_LOGS_OBJECT_STORE], 'readwrite');
                const objectStore = transaction.objectStore(exports.INDEXEDDB_LOGS_OBJECT_STORE);
                const request = objectStore.delete(key);
                request.onerror = () => e(request.error);
                request.onsuccess = () => c();
            });
        }
    }
    exports.IndexedDBLogProvider = IndexedDBLogProvider;
});
//# __sourceMappingURL=indexedDBLogProvider.js.map