/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SetMap = exports.fromMap = exports.groupBy = exports.forEach = exports.values = void 0;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    /**
     * Returns an array which contains all values that reside
     * in the given dictionary.
     */
    function values(from) {
        const result = [];
        for (let key in from) {
            if (hasOwnProperty.call(from, key)) {
                result.push(from[key]);
            }
        }
        return result;
    }
    exports.values = values;
    /**
     * Iterates over each entry in the provided dictionary. The iterator allows
     * to remove elements and will stop when the callback returns {{false}}.
     */
    function forEach(from, callback) {
        for (let key in from) {
            if (hasOwnProperty.call(from, key)) {
                const result = callback({ key: key, value: from[key] }, function () {
                    delete from[key];
                });
                if (result === false) {
                    return;
                }
            }
        }
    }
    exports.forEach = forEach;
    /**
     * Groups the collection into a dictionary based on the provided
     * group function.
     */
    function groupBy(data, groupFn) {
        const result = Object.create(null);
        for (const element of data) {
            const key = groupFn(element);
            let target = result[key];
            if (!target) {
                target = result[key] = [];
            }
            target.push(element);
        }
        return result;
    }
    exports.groupBy = groupBy;
    function fromMap(original) {
        const result = Object.create(null);
        if (original) {
            original.forEach((value, key) => {
                result[key] = value;
            });
        }
        return result;
    }
    exports.fromMap = fromMap;
    class SetMap {
        constructor() {
            this.map = new Map();
        }
        add(key, value) {
            let values = this.map.get(key);
            if (!values) {
                values = new Set();
                this.map.set(key, values);
            }
            values.add(value);
        }
        delete(key, value) {
            const values = this.map.get(key);
            if (!values) {
                return;
            }
            values.delete(value);
            if (values.size === 0) {
                this.map.delete(key);
            }
        }
        forEach(key, fn) {
            const values = this.map.get(key);
            if (!values) {
                return;
            }
            values.forEach(fn);
        }
    }
    exports.SetMap = SetMap;
});
//# __sourceMappingURL=collections.js.map