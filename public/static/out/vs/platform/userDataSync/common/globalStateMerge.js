/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/map"], function (require, exports, objects, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    function merge(localStorage, remoteStorage, baseStorage, storageKeys, previouslySkipped, logService) {
        if (!remoteStorage) {
            return { remote: Object.keys(localStorage).length > 0 ? localStorage : null, local: { added: {}, removed: [], updated: {} }, skipped: [] };
        }
        const localToRemote = compare(localStorage, remoteStorage);
        if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
            // No changes found between local and remote.
            return { remote: null, local: { added: {}, removed: [], updated: {} }, skipped: [] };
        }
        const baseToRemote = baseStorage ? compare(baseStorage, remoteStorage) : { added: Object.keys(remoteStorage).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const baseToLocal = baseStorage ? compare(baseStorage, localStorage) : { added: Object.keys(localStorage).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const local = { added: {}, removed: [], updated: {} };
        const remote = objects.deepClone(remoteStorage);
        const skipped = [];
        // Added in remote
        for (const key of map_1.values(baseToRemote.added)) {
            const remoteValue = remoteStorage[key];
            const storageKey = storageKeys.filter(storageKey => storageKey.key === key)[0];
            if (!storageKey) {
                skipped.push(key);
                logService.trace(`GlobalState: Skipped adding ${key} in local storage as it is not registered.`);
                continue;
            }
            if (storageKey.version !== remoteValue.version) {
                logService.info(`GlobalState: Skipped adding ${key} in local storage. Local version '${storageKey.version}' and remote version '${remoteValue.version} are not same.`);
                continue;
            }
            const localValue = localStorage[key];
            if (localValue && localValue.value === remoteValue.value) {
                continue;
            }
            if (baseToLocal.added.has(key)) {
                local.updated[key] = remoteValue;
            }
            else {
                local.added[key] = remoteValue;
            }
        }
        // Updated in Remote
        for (const key of map_1.values(baseToRemote.updated)) {
            const remoteValue = remoteStorage[key];
            const storageKey = storageKeys.filter(storageKey => storageKey.key === key)[0];
            if (!storageKey) {
                skipped.push(key);
                logService.trace(`GlobalState: Skipped updating ${key} in local storage as is not registered.`);
                continue;
            }
            if (storageKey.version !== remoteValue.version) {
                logService.info(`GlobalState: Skipped updating ${key} in local storage. Local version '${storageKey.version}' and remote version '${remoteValue.version} are not same.`);
                continue;
            }
            const localValue = localStorage[key];
            if (localValue && localValue.value === remoteValue.value) {
                continue;
            }
            local.updated[key] = remoteValue;
        }
        // Removed in remote
        for (const key of map_1.values(baseToRemote.removed)) {
            const storageKey = storageKeys.filter(storageKey => storageKey.key === key)[0];
            if (!storageKey) {
                logService.trace(`GlobalState: Skipped removing ${key} in local storage. It is not registered to sync.`);
                continue;
            }
            local.removed.push(key);
        }
        // Added in local
        for (const key of map_1.values(baseToLocal.added)) {
            if (!baseToRemote.added.has(key)) {
                remote[key] = localStorage[key];
            }
        }
        // Updated in local
        for (const key of map_1.values(baseToLocal.updated)) {
            if (baseToRemote.updated.has(key) || baseToRemote.removed.has(key)) {
                continue;
            }
            const remoteValue = remote[key];
            const localValue = localStorage[key];
            if (localValue.version < remoteValue.version) {
                logService.info(`GlobalState: Skipped updating ${key} in remote storage. Local version '${localValue.version}' and remote version '${remoteValue.version} are not same.`);
                continue;
            }
            remote[key] = localValue;
        }
        // Removed in local
        for (const key of map_1.values(baseToLocal.removed)) {
            // do not remove from remote if it is updated in remote
            if (baseToRemote.updated.has(key)) {
                continue;
            }
            const storageKey = storageKeys.filter(storageKey => storageKey.key === key)[0];
            // do not remove from remote if storage key is not found
            if (!storageKey) {
                skipped.push(key);
                logService.trace(`GlobalState: Skipped removing ${key} in remote storage. It is not registered to sync.`);
                continue;
            }
            const remoteValue = remote[key];
            // do not remove from remote if local data version is old
            if (storageKey.version < remoteValue.version) {
                logService.info(`GlobalState: Skipped updating ${key} in remote storage. Local version '${storageKey.version}' and remote version '${remoteValue.version} are not same.`);
                continue;
            }
            // add to local if it was skipped before
            if (previouslySkipped.indexOf(key) !== -1) {
                local.added[key] = remote[key];
                continue;
            }
            delete remote[key];
        }
        return { local, remote: areSame(remote, remoteStorage) ? null : remote, skipped };
    }
    exports.merge = merge;
    function compare(from, to) {
        const fromKeys = Object.keys(from);
        const toKeys = Object.keys(to);
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from[key];
            const value2 = to[key];
            if (!objects.equals(value1, value2)) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function areSame(a, b) {
        const { added, removed, updated } = compare(a, b);
        return added.size === 0 && removed.size === 0 && updated.size === 0;
    }
});
//# __sourceMappingURL=globalStateMerge.js.map