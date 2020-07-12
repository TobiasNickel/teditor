/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/storage/common/storage", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers"], function (require, exports, storage_1, extHost_protocol_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadStorage = void 0;
    let MainThreadStorage = class MainThreadStorage {
        constructor(extHostContext, storageService) {
            this._sharedStorageKeysToWatch = new Map();
            this._storageService = storageService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostStorage);
            this._storageListener = this._storageService.onDidChangeStorage(e => {
                const shared = e.scope === 0 /* GLOBAL */;
                if (shared && this._sharedStorageKeysToWatch.has(e.key)) {
                    try {
                        this._proxy.$acceptValue(shared, e.key, this._getValue(shared, e.key));
                    }
                    catch (error) {
                        // ignore parsing errors that can happen
                    }
                }
            });
        }
        dispose() {
            this._storageListener.dispose();
        }
        $getValue(shared, key) {
            if (shared) {
                this._sharedStorageKeysToWatch.set(key, true);
            }
            try {
                return Promise.resolve(this._getValue(shared, key));
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
        _getValue(shared, key) {
            const jsonValue = this._storageService.get(key, shared ? 0 /* GLOBAL */ : 1 /* WORKSPACE */);
            if (!jsonValue) {
                return undefined;
            }
            return JSON.parse(jsonValue);
        }
        $setValue(shared, key, value) {
            let jsonValue;
            try {
                jsonValue = JSON.stringify(value);
                this._storageService.store(key, jsonValue, shared ? 0 /* GLOBAL */ : 1 /* WORKSPACE */);
            }
            catch (err) {
                return Promise.reject(err);
            }
            return Promise.resolve(undefined);
        }
    };
    MainThreadStorage = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadStorage),
        __param(1, storage_1.IStorageService)
    ], MainThreadStorage);
    exports.MainThreadStorage = MainThreadStorage;
});
//# __sourceMappingURL=mainThreadStorage.js.map