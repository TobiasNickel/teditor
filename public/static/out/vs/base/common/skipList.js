/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SkipList = void 0;
    class Node {
        constructor(level, key, value) {
            this.level = level;
            this.key = key;
            this.value = value;
            this.forward = [];
        }
    }
    const NIL = undefined;
    class SkipList {
        /**
         *
         * @param capacity Capacity at which the list performs best
         */
        constructor(comparator, capacity = 2 ** 16) {
            this.comparator = comparator;
            this[Symbol.toStringTag] = 'SkipList';
            this._level = 1;
            this._size = 0;
            this._maxLevel = Math.max(1, Math.log2(capacity) | 0);
            this._header = new Node(this._maxLevel, NIL, NIL);
        }
        get size() {
            return this._size;
        }
        clear() {
            this._header = new Node(this._maxLevel, NIL, NIL);
        }
        has(key) {
            return Boolean(SkipList._search(this, key, this.comparator));
        }
        get(key) {
            var _a;
            return (_a = SkipList._search(this, key, this.comparator)) === null || _a === void 0 ? void 0 : _a.value;
        }
        set(key, value) {
            if (SkipList._insert(this, key, value, this.comparator)) {
                this._size += 1;
            }
            return this;
        }
        delete(key) {
            const didDelete = SkipList._delete(this, key, this.comparator);
            if (didDelete) {
                this._size -= 1;
            }
            return didDelete;
        }
        // --- iteration
        forEach(callbackfn, thisArg) {
            let node = this._header.forward[0];
            while (node) {
                callbackfn.call(thisArg, node.value, node.key, this);
                node = node.forward[0];
            }
        }
        [Symbol.iterator]() {
            return this.entries();
        }
        *entries() {
            let node = this._header.forward[0];
            while (node) {
                yield [node.key, node.value];
                node = node.forward[0];
            }
        }
        *keys() {
            let node = this._header.forward[0];
            while (node) {
                yield node.key;
                node = node.forward[0];
            }
        }
        *values() {
            let node = this._header.forward[0];
            while (node) {
                yield node.value;
                node = node.forward[0];
            }
        }
        toString() {
            // debug string...
            let result = '[SkipList]:';
            let node = this._header.forward[0];
            while (node) {
                result += `node(${node.key}, ${node.value}, lvl:${node.level})`;
                node = node.forward[0];
            }
            return result;
        }
        // from https://www.epaperpress.com/sortsearch/download/skiplist.pdf
        static _search(list, searchKey, comparator) {
            let x = list._header;
            for (let i = list._level; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
            }
            x = x.forward[0];
            if (x && comparator(x.key, searchKey) === 0) {
                return x;
            }
            return undefined;
        }
        static _insert(list, searchKey, value, comparator) {
            let update = [];
            let x = list._header;
            for (let i = list._level; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
                update[i] = x;
            }
            x = x.forward[0];
            if (x && comparator(x.key, searchKey) === 0) {
                // update
                x.value = value;
                return false;
            }
            else {
                // insert
                let lvl = SkipList._randomLevel(list);
                if (lvl > list._level) {
                    for (let i = list._level + 1; i <= lvl; i++) {
                        update[i] = list._header;
                    }
                    list._level = lvl;
                }
                x = new Node(lvl, searchKey, value);
                for (let i = 0; i <= lvl; i++) {
                    x.forward[i] = update[i].forward[i];
                    update[i].forward[i] = x;
                }
                return true;
            }
        }
        static _randomLevel(list, p = 0.5) {
            let lvl = 1;
            while (Math.random() < p && lvl < list._maxLevel) {
                lvl += 1;
            }
            return lvl;
        }
        static _delete(list, searchKey, comparator) {
            let update = [];
            let x = list._header;
            for (let i = list._level; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
                update[i] = x;
            }
            x = x.forward[0];
            if (!x || comparator(x.key, searchKey) !== 0) {
                // not found
                return false;
            }
            for (let i = 0; i < list._level; i++) {
                if (update[i].forward[i] !== x) {
                    break;
                }
                update[i].forward[i] = x.forward[i];
            }
            while (list._level >= 1 && list._header.forward[list._level] === NIL) {
                list._level -= 1;
            }
            return true;
        }
    }
    exports.SkipList = SkipList;
});
//# __sourceMappingURL=skipList.js.map