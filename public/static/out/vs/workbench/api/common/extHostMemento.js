/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionMemento = void 0;
    class ExtensionMemento {
        constructor(id, global, storage) {
            this._id = id;
            this._shared = global;
            this._storage = storage;
            this._init = this._storage.getValue(this._shared, this._id, Object.create(null)).then(value => {
                this._value = value;
                return this;
            });
            this._storageListener = this._storage.onDidChangeStorage(e => {
                if (e.shared === this._shared && e.key === this._id) {
                    this._value = e.value;
                }
            });
        }
        get whenReady() {
            return this._init;
        }
        get(key, defaultValue) {
            let value = this._value[key];
            if (typeof value === 'undefined') {
                value = defaultValue;
            }
            return value;
        }
        update(key, value) {
            this._value[key] = value;
            return this._storage.setValue(this._shared, this._id, this._value);
        }
        dispose() {
            this._storageListener.dispose();
        }
    }
    exports.ExtensionMemento = ExtensionMemento;
});
//# __sourceMappingURL=extHostMemento.js.map