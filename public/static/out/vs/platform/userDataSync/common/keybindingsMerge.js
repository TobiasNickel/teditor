/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/json", "vs/base/common/map", "vs/base/common/arrays", "vs/platform/contextkey/common/contextkey", "vs/platform/userDataSync/common/content"], function (require, exports, objects, json_1, map_1, arrays_1, contextkey_1, contentUtil) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    async function merge(localContent, remoteContent, baseContent, formattingOptions, userDataSyncUtilService) {
        const local = json_1.parse(localContent);
        const remote = json_1.parse(remoteContent);
        const base = baseContent ? json_1.parse(baseContent) : null;
        const userbindings = [...local, ...remote, ...(base || [])].map(keybinding => keybinding.key);
        const normalizedKeys = await userDataSyncUtilService.resolveUserBindings(userbindings);
        let keybindingsMergeResult = computeMergeResultByKeybinding(local, remote, base, normalizedKeys);
        if (!keybindingsMergeResult.hasLocalForwarded && !keybindingsMergeResult.hasRemoteForwarded) {
            // No changes found between local and remote.
            return { mergeContent: localContent, hasChanges: false, hasConflicts: false };
        }
        if (!keybindingsMergeResult.hasLocalForwarded && keybindingsMergeResult.hasRemoteForwarded) {
            return { mergeContent: remoteContent, hasChanges: true, hasConflicts: false };
        }
        if (keybindingsMergeResult.hasLocalForwarded && !keybindingsMergeResult.hasRemoteForwarded) {
            // Local has moved forward and remote has not. Return local.
            return { mergeContent: localContent, hasChanges: true, hasConflicts: false };
        }
        // Both local and remote has moved forward.
        const localByCommand = byCommand(local);
        const remoteByCommand = byCommand(remote);
        const baseByCommand = base ? byCommand(base) : null;
        const localToRemoteByCommand = compareByCommand(localByCommand, remoteByCommand, normalizedKeys);
        const baseToLocalByCommand = baseByCommand ? compareByCommand(baseByCommand, localByCommand, normalizedKeys) : { added: map_1.keys(localByCommand).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const baseToRemoteByCommand = baseByCommand ? compareByCommand(baseByCommand, remoteByCommand, normalizedKeys) : { added: map_1.keys(remoteByCommand).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const commandsMergeResult = computeMergeResult(localToRemoteByCommand, baseToLocalByCommand, baseToRemoteByCommand);
        let mergeContent = localContent;
        // Removed commands in Remote
        for (const command of map_1.values(commandsMergeResult.removed)) {
            if (commandsMergeResult.conflicts.has(command)) {
                continue;
            }
            mergeContent = removeKeybindings(mergeContent, command, formattingOptions);
        }
        // Added commands in remote
        for (const command of map_1.values(commandsMergeResult.added)) {
            if (commandsMergeResult.conflicts.has(command)) {
                continue;
            }
            const keybindings = remoteByCommand.get(command);
            // Ignore negated commands
            if (keybindings.some(keybinding => keybinding.command !== `-${command}` && keybindingsMergeResult.conflicts.has(normalizedKeys[keybinding.key]))) {
                commandsMergeResult.conflicts.add(command);
                continue;
            }
            mergeContent = addKeybindings(mergeContent, keybindings, formattingOptions);
        }
        // Updated commands in Remote
        for (const command of map_1.values(commandsMergeResult.updated)) {
            if (commandsMergeResult.conflicts.has(command)) {
                continue;
            }
            const keybindings = remoteByCommand.get(command);
            // Ignore negated commands
            if (keybindings.some(keybinding => keybinding.command !== `-${command}` && keybindingsMergeResult.conflicts.has(normalizedKeys[keybinding.key]))) {
                commandsMergeResult.conflicts.add(command);
                continue;
            }
            mergeContent = updateKeybindings(mergeContent, command, keybindings, formattingOptions);
        }
        return { mergeContent, hasChanges: true, hasConflicts: commandsMergeResult.conflicts.size > 0 };
    }
    exports.merge = merge;
    function computeMergeResult(localToRemote, baseToLocal, baseToRemote) {
        const added = new Set();
        const removed = new Set();
        const updated = new Set();
        const conflicts = new Set();
        // Removed keys in Local
        for (const key of map_1.values(baseToLocal.removed)) {
            // Got updated in remote
            if (baseToRemote.updated.has(key)) {
                conflicts.add(key);
            }
        }
        // Removed keys in Remote
        for (const key of map_1.values(baseToRemote.removed)) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got updated in local
            if (baseToLocal.updated.has(key)) {
                conflicts.add(key);
            }
            else {
                // remove the key
                removed.add(key);
            }
        }
        // Added keys in Local
        for (const key of map_1.values(baseToLocal.added)) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got added in remote
            if (baseToRemote.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
        }
        // Added keys in remote
        for (const key of map_1.values(baseToRemote.added)) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got added in local
            if (baseToLocal.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
            else {
                added.add(key);
            }
        }
        // Updated keys in Local
        for (const key of map_1.values(baseToLocal.updated)) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got updated in remote
            if (baseToRemote.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
        }
        // Updated keys in Remote
        for (const key of map_1.values(baseToRemote.updated)) {
            if (conflicts.has(key)) {
                continue;
            }
            // Got updated in local
            if (baseToLocal.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    conflicts.add(key);
                }
            }
            else {
                // updated key
                updated.add(key);
            }
        }
        return { added, removed, updated, conflicts };
    }
    function computeMergeResultByKeybinding(local, remote, base, normalizedKeys) {
        const empty = new Set();
        const localByKeybinding = byKeybinding(local, normalizedKeys);
        const remoteByKeybinding = byKeybinding(remote, normalizedKeys);
        const baseByKeybinding = base ? byKeybinding(base, normalizedKeys) : null;
        const localToRemoteByKeybinding = compareByKeybinding(localByKeybinding, remoteByKeybinding);
        if (localToRemoteByKeybinding.added.size === 0 && localToRemoteByKeybinding.removed.size === 0 && localToRemoteByKeybinding.updated.size === 0) {
            return { hasLocalForwarded: false, hasRemoteForwarded: false, added: empty, removed: empty, updated: empty, conflicts: empty };
        }
        const baseToLocalByKeybinding = baseByKeybinding ? compareByKeybinding(baseByKeybinding, localByKeybinding) : { added: map_1.keys(localByKeybinding).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        if (baseToLocalByKeybinding.added.size === 0 && baseToLocalByKeybinding.removed.size === 0 && baseToLocalByKeybinding.updated.size === 0) {
            // Remote has moved forward and local has not.
            return { hasLocalForwarded: false, hasRemoteForwarded: true, added: empty, removed: empty, updated: empty, conflicts: empty };
        }
        const baseToRemoteByKeybinding = baseByKeybinding ? compareByKeybinding(baseByKeybinding, remoteByKeybinding) : { added: map_1.keys(remoteByKeybinding).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        if (baseToRemoteByKeybinding.added.size === 0 && baseToRemoteByKeybinding.removed.size === 0 && baseToRemoteByKeybinding.updated.size === 0) {
            return { hasLocalForwarded: true, hasRemoteForwarded: false, added: empty, removed: empty, updated: empty, conflicts: empty };
        }
        const { added, removed, updated, conflicts } = computeMergeResult(localToRemoteByKeybinding, baseToLocalByKeybinding, baseToRemoteByKeybinding);
        return { hasLocalForwarded: true, hasRemoteForwarded: true, added, removed, updated, conflicts };
    }
    function byKeybinding(keybindings, keys) {
        const map = new Map();
        for (const keybinding of keybindings) {
            const key = keys[keybinding.key];
            let value = map.get(key);
            if (!value) {
                value = [];
                map.set(key, value);
            }
            value.push(keybinding);
        }
        return map;
    }
    function byCommand(keybindings) {
        const map = new Map();
        for (const keybinding of keybindings) {
            const command = keybinding.command[0] === '-' ? keybinding.command.substring(1) : keybinding.command;
            let value = map.get(command);
            if (!value) {
                value = [];
                map.set(command, value);
            }
            value.push(keybinding);
        }
        return map;
    }
    function compareByKeybinding(from, to) {
        const fromKeys = map_1.keys(from);
        const toKeys = map_1.keys(to);
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from.get(key).map(keybinding => (Object.assign(Object.assign({}, keybinding), { key })));
            const value2 = to.get(key).map(keybinding => (Object.assign(Object.assign({}, keybinding), { key })));
            if (!arrays_1.equals(value1, value2, (a, b) => isSameKeybinding(a, b))) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function compareByCommand(from, to, normalizedKeys) {
        const fromKeys = map_1.keys(from);
        const toKeys = map_1.keys(to);
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from.get(key).map(keybinding => (Object.assign(Object.assign({}, keybinding), { key: normalizedKeys[keybinding.key] })));
            const value2 = to.get(key).map(keybinding => (Object.assign(Object.assign({}, keybinding), { key: normalizedKeys[keybinding.key] })));
            if (!areSameKeybindingsWithSameCommand(value1, value2)) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function areSameKeybindingsWithSameCommand(value1, value2) {
        // Compare entries adding keybindings
        if (!arrays_1.equals(value1.filter(({ command }) => command[0] !== '-'), value2.filter(({ command }) => command[0] !== '-'), (a, b) => isSameKeybinding(a, b))) {
            return false;
        }
        // Compare entries removing keybindings
        if (!arrays_1.equals(value1.filter(({ command }) => command[0] === '-'), value2.filter(({ command }) => command[0] === '-'), (a, b) => isSameKeybinding(a, b))) {
            return false;
        }
        return true;
    }
    function isSameKeybinding(a, b) {
        if (a.command !== b.command) {
            return false;
        }
        if (a.key !== b.key) {
            return false;
        }
        const whenA = contextkey_1.ContextKeyExpr.deserialize(a.when);
        const whenB = contextkey_1.ContextKeyExpr.deserialize(b.when);
        if ((whenA && !whenB) || (!whenA && whenB)) {
            return false;
        }
        if (whenA && whenB && !whenA.equals(whenB)) {
            return false;
        }
        if (!objects.equals(a.args, b.args)) {
            return false;
        }
        return true;
    }
    function addKeybindings(content, keybindings, formattingOptions) {
        for (const keybinding of keybindings) {
            content = contentUtil.edit(content, [-1], keybinding, formattingOptions);
        }
        return content;
    }
    function removeKeybindings(content, command, formattingOptions) {
        const keybindings = json_1.parse(content);
        for (let index = keybindings.length - 1; index >= 0; index--) {
            if (keybindings[index].command === command || keybindings[index].command === `-${command}`) {
                content = contentUtil.edit(content, [index], undefined, formattingOptions);
            }
        }
        return content;
    }
    function updateKeybindings(content, command, keybindings, formattingOptions) {
        const allKeybindings = json_1.parse(content);
        const location = arrays_1.firstIndex(allKeybindings, keybinding => keybinding.command === command || keybinding.command === `-${command}`);
        // Remove all entries with this command
        for (let index = allKeybindings.length - 1; index >= 0; index--) {
            if (allKeybindings[index].command === command || allKeybindings[index].command === `-${command}`) {
                content = contentUtil.edit(content, [index], undefined, formattingOptions);
            }
        }
        // add all entries at the same location where the entry with this command was located.
        for (let index = keybindings.length - 1; index >= 0; index--) {
            content = contentUtil.edit(content, [location], keybindings[index], formattingOptions);
        }
        return content;
    }
});
//# __sourceMappingURL=keybindingsMerge.js.map