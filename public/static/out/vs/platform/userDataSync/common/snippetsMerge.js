/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/objects"], function (require, exports, map_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    function merge(local, remote, base, resolvedConflicts = {}) {
        const added = {};
        const updated = {};
        const removed = new Set();
        if (!remote) {
            return {
                added,
                removed: map_1.values(removed),
                updated,
                conflicts: [],
                remote: Object.keys(local).length > 0 ? local : null
            };
        }
        const localToRemote = compare(local, remote);
        if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
            // No changes found between local and remote.
            return {
                added,
                removed: map_1.values(removed),
                updated,
                conflicts: [],
                remote: null
            };
        }
        const baseToLocal = compare(base, local);
        const baseToRemote = compare(base, remote);
        const remoteContent = objects_1.deepClone(remote);
        const conflicts = new Set();
        const handledConflicts = new Set();
        const handleConflict = (key) => {
            if (handledConflicts.has(key)) {
                return;
            }
            handledConflicts.add(key);
            const conflictContent = resolvedConflicts[key];
            // add to conflicts
            if (conflictContent === undefined) {
                conflicts.add(key);
            }
            // remove the snippet
            else if (conflictContent === null) {
                delete remote[key];
                if (local[key]) {
                    removed.add(key);
                }
            }
            // add/update the snippet
            else {
                if (local[key]) {
                    if (local[key] !== conflictContent) {
                        updated[key] = conflictContent;
                    }
                }
                else {
                    added[key] = conflictContent;
                }
                remoteContent[key] = conflictContent;
            }
        };
        // Removed snippets in Local
        for (const key of map_1.values(baseToLocal.removed)) {
            // Conflict - Got updated in remote.
            if (baseToRemote.updated.has(key)) {
                // Add to local
                added[key] = remote[key];
            }
            // Remove it in remote
            else {
                delete remoteContent[key];
            }
        }
        // Removed snippets in Remote
        for (const key of map_1.values(baseToRemote.removed)) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Conflict - Got updated in local
            if (baseToLocal.updated.has(key)) {
                handleConflict(key);
            }
            // Also remove in Local
            else {
                removed.add(key);
            }
        }
        // Updated snippets in Local
        for (const key of map_1.values(baseToLocal.updated)) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got updated in remote
            if (baseToRemote.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                remoteContent[key] = local[key];
            }
        }
        // Updated snippets in Remote
        for (const key of map_1.values(baseToRemote.updated)) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got updated in local
            if (baseToLocal.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else if (local[key] !== undefined) {
                updated[key] = remote[key];
            }
        }
        // Added snippets in Local
        for (const key of map_1.values(baseToLocal.added)) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got added in remote
            if (baseToRemote.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                remoteContent[key] = local[key];
            }
        }
        // Added snippets in remote
        for (const key of map_1.values(baseToRemote.added)) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got added in local
            if (baseToLocal.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                added[key] = remote[key];
            }
        }
        return { added, removed: map_1.values(removed), updated, conflicts: map_1.values(conflicts), remote: areSame(remote, remoteContent) ? null : remoteContent };
    }
    exports.merge = merge;
    function compare(from, to) {
        const fromKeys = from ? Object.keys(from) : [];
        const toKeys = to ? Object.keys(to) : [];
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const fromSnippet = from[key];
            const toSnippet = to[key];
            if (fromSnippet !== toSnippet) {
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
//# __sourceMappingURL=snippetsMerge.js.map