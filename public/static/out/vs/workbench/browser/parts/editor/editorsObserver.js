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
define(["require", "exports", "vs/workbench/common/editor", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/event", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/objects"], function (require, exports, editor_1, lifecycle_1, storage_1, platform_1, event_1, editorGroupsService_1, arrays_1, map_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorsObserver = void 0;
    /**
     * A observer of opened editors across all editor groups by most recently used.
     * Rules:
     * - the last editor in the list is the one most recently activated
     * - the first editor in the list is the one that was activated the longest time ago
     * - an editor that opens inactive will be placed behind the currently active editor
     *
     * The observer may start to close editors based on the workbench.editor.limit setting.
     */
    let EditorsObserver = class EditorsObserver extends lifecycle_1.Disposable {
        constructor(editorGroupsService, storageService) {
            super();
            this.editorGroupsService = editorGroupsService;
            this.storageService = storageService;
            this.keyMap = new Map();
            this.mostRecentEditorsMap = new map_1.LinkedMap();
            this.editorResourcesMap = new map_1.ResourceMap();
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            this.registerListeners();
        }
        get count() {
            return this.mostRecentEditorsMap.size;
        }
        get editors() {
            return [...this.mostRecentEditorsMap.values()];
        }
        hasEditor(resource) {
            return this.editorResourcesMap.has(resource);
        }
        registerListeners() {
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
            this._register(this.editorGroupsService.onDidAddGroup(group => this.onGroupAdded(group)));
            this._register(this.editorGroupsService.onDidEditorPartOptionsChange(e => this.onDidEditorPartOptionsChange(e)));
            this.editorGroupsService.whenRestored.then(() => this.loadState());
        }
        onGroupAdded(group) {
            // Make sure to add any already existing editor
            // of the new group into our list in LRU order
            const groupEditorsMru = group.getEditors(0 /* MOST_RECENTLY_ACTIVE */);
            for (let i = groupEditorsMru.length - 1; i >= 0; i--) {
                this.addMostRecentEditor(group, groupEditorsMru[i], false /* is not active */, true /* is new */);
            }
            // Make sure that active editor is put as first if group is active
            if (this.editorGroupsService.activeGroup === group && group.activeEditor) {
                this.addMostRecentEditor(group, group.activeEditor, true /* is active */, false /* already added before */);
            }
            // Group Listeners
            this.registerGroupListeners(group);
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidGroupChange(e => {
                switch (e.kind) {
                    // Group gets active: put active editor as most recent
                    case 0 /* GROUP_ACTIVE */: {
                        if (this.editorGroupsService.activeGroup === group && group.activeEditor) {
                            this.addMostRecentEditor(group, group.activeEditor, true /* is active */, false /* editor already opened */);
                        }
                        break;
                    }
                    // Editor gets active: put active editor as most recent
                    // if group is active, otherwise second most recent
                    case 5 /* EDITOR_ACTIVE */: {
                        if (e.editor) {
                            this.addMostRecentEditor(group, e.editor, this.editorGroupsService.activeGroup === group, false /* editor already opened */);
                        }
                        break;
                    }
                    // Editor opens: put it as second most recent
                    //
                    // Also check for maximum allowed number of editors and
                    // start to close oldest ones if needed.
                    case 2 /* EDITOR_OPEN */: {
                        if (e.editor) {
                            this.addMostRecentEditor(group, e.editor, false /* is not active */, true /* is new */);
                            this.ensureOpenedEditorsLimit({ groupId: group.id, editor: e.editor }, group.id);
                        }
                        break;
                    }
                    // Editor closes: remove from recently opened
                    case 3 /* EDITOR_CLOSE */: {
                        if (e.editor) {
                            this.removeMostRecentEditor(group, e.editor);
                        }
                        break;
                    }
                }
            }));
            // Make sure to cleanup on dispose
            event_1.Event.once(group.onWillDispose)(() => lifecycle_1.dispose(groupDisposables));
        }
        onDidEditorPartOptionsChange(event) {
            if (!objects_1.equals(event.newPartOptions.limit, event.oldPartOptions.limit)) {
                const activeGroup = this.editorGroupsService.activeGroup;
                let exclude = undefined;
                if (activeGroup.activeEditor) {
                    exclude = { editor: activeGroup.activeEditor, groupId: activeGroup.id };
                }
                this.ensureOpenedEditorsLimit(exclude);
            }
        }
        addMostRecentEditor(group, editor, isActive, isNew) {
            const key = this.ensureKey(group, editor);
            const mostRecentEditor = this.mostRecentEditorsMap.first;
            // Active or first entry: add to end of map
            if (isActive || !mostRecentEditor) {
                this.mostRecentEditorsMap.set(key, key, mostRecentEditor ? 1 /* AsOld */ : undefined);
            }
            // Otherwise: insert before most recent
            else {
                // we have most recent editors. as such we
                // put this newly opened editor right before
                // the current most recent one because it cannot
                // be the most recently active one unless
                // it becomes active. but it is still more
                // active then any other editor in the list.
                this.mostRecentEditorsMap.set(key, key, 1 /* AsOld */);
                this.mostRecentEditorsMap.set(mostRecentEditor, mostRecentEditor, 1 /* AsOld */);
            }
            // Update in resource map if this is a new editor
            if (isNew) {
                this.updateEditorResourcesMap(editor, true);
            }
            // Event
            this._onDidMostRecentlyActiveEditorsChange.fire();
        }
        updateEditorResourcesMap(editor, add) {
            var _a, _b;
            const resource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!resource) {
                return; // require a resource
            }
            if (add) {
                this.editorResourcesMap.set(resource, ((_a = this.editorResourcesMap.get(resource)) !== null && _a !== void 0 ? _a : 0) + 1);
            }
            else {
                const counter = (_b = this.editorResourcesMap.get(resource)) !== null && _b !== void 0 ? _b : 0;
                if (counter > 1) {
                    this.editorResourcesMap.set(resource, counter - 1);
                }
                else {
                    this.editorResourcesMap.delete(resource);
                }
            }
        }
        removeMostRecentEditor(group, editor) {
            // Update in resource map
            this.updateEditorResourcesMap(editor, false);
            // Update in MRU list
            const key = this.findKey(group, editor);
            if (key) {
                // Remove from most recent editors
                this.mostRecentEditorsMap.delete(key);
                // Remove from key map
                const map = this.keyMap.get(group.id);
                if (map && map.delete(key.editor) && map.size === 0) {
                    this.keyMap.delete(group.id);
                }
                // Event
                this._onDidMostRecentlyActiveEditorsChange.fire();
            }
        }
        findKey(group, editor) {
            const groupMap = this.keyMap.get(group.id);
            if (!groupMap) {
                return undefined;
            }
            return groupMap.get(editor);
        }
        ensureKey(group, editor) {
            let groupMap = this.keyMap.get(group.id);
            if (!groupMap) {
                groupMap = new Map();
                this.keyMap.set(group.id, groupMap);
            }
            let key = groupMap.get(editor);
            if (!key) {
                key = { groupId: group.id, editor };
                groupMap.set(editor, key);
            }
            return key;
        }
        async ensureOpenedEditorsLimit(exclude, groupId) {
            var _a, _b;
            if (!((_a = this.editorGroupsService.partOptions.limit) === null || _a === void 0 ? void 0 : _a.enabled) ||
                typeof this.editorGroupsService.partOptions.limit.value !== 'number' ||
                this.editorGroupsService.partOptions.limit.value <= 0) {
                return; // return early if not enabled or invalid
            }
            const limit = this.editorGroupsService.partOptions.limit.value;
            // In editor group
            if ((_b = this.editorGroupsService.partOptions.limit) === null || _b === void 0 ? void 0 : _b.perEditorGroup) {
                // For specific editor groups
                if (typeof groupId === 'number') {
                    const group = this.editorGroupsService.getGroup(groupId);
                    if (group) {
                        await this.doEnsureOpenedEditorsLimit(limit, group.getEditors(0 /* MOST_RECENTLY_ACTIVE */).map(editor => ({ editor, groupId })), exclude);
                    }
                }
                // For all editor groups
                else {
                    for (const group of this.editorGroupsService.groups) {
                        await this.ensureOpenedEditorsLimit(exclude, group.id);
                    }
                }
            }
            // Across all editor groups
            else {
                await this.doEnsureOpenedEditorsLimit(limit, [...this.mostRecentEditorsMap.values()], exclude);
            }
        }
        async doEnsureOpenedEditorsLimit(limit, mostRecentEditors, exclude) {
            if (limit >= mostRecentEditors.length) {
                return; // only if opened editors exceed setting and is valid and enabled
            }
            // Extract least recently used editors that can be closed
            const leastRecentlyClosableEditors = mostRecentEditors.reverse().filter(({ editor, groupId }) => {
                var _a;
                if (editor.isDirty() && !editor.isSaving()) {
                    return false; // not dirty editors (unless in the process of saving)
                }
                if (exclude && editor === exclude.editor && groupId === exclude.groupId) {
                    return false; // never the editor that should be excluded
                }
                if ((_a = this.editorGroupsService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.isSticky(editor)) {
                    return false; // never sticky editors
                }
                return true;
            });
            // Close editors until we reached the limit again
            let editorsToCloseCount = mostRecentEditors.length - limit;
            const mapGroupToEditorsToClose = new Map();
            for (const { groupId, editor } of leastRecentlyClosableEditors) {
                let editorsInGroupToClose = mapGroupToEditorsToClose.get(groupId);
                if (!editorsInGroupToClose) {
                    editorsInGroupToClose = [];
                    mapGroupToEditorsToClose.set(groupId, editorsInGroupToClose);
                }
                editorsInGroupToClose.push(editor);
                editorsToCloseCount--;
                if (editorsToCloseCount === 0) {
                    break; // limit reached
                }
            }
            for (const [groupId, editors] of mapGroupToEditorsToClose) {
                const group = this.editorGroupsService.getGroup(groupId);
                if (group) {
                    await group.closeEditors(editors, { preserveFocus: true });
                }
            }
        }
        saveState() {
            if (this.mostRecentEditorsMap.isEmpty()) {
                this.storageService.remove(EditorsObserver.STORAGE_KEY, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.store(EditorsObserver.STORAGE_KEY, JSON.stringify(this.serialize()), 1 /* WORKSPACE */);
            }
        }
        serialize() {
            const registry = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories);
            const entries = [...this.mostRecentEditorsMap.values()];
            const mapGroupToSerializableEditorsOfGroup = new Map();
            return {
                entries: arrays_1.coalesce(entries.map(({ editor, groupId }) => {
                    // Find group for entry
                    const group = this.editorGroupsService.getGroup(groupId);
                    if (!group) {
                        return undefined;
                    }
                    // Find serializable editors of group
                    let serializableEditorsOfGroup = mapGroupToSerializableEditorsOfGroup.get(group);
                    if (!serializableEditorsOfGroup) {
                        serializableEditorsOfGroup = group.getEditors(1 /* SEQUENTIAL */).filter(editor => {
                            const factory = registry.getEditorInputFactory(editor.getTypeId());
                            return factory === null || factory === void 0 ? void 0 : factory.canSerialize(editor);
                        });
                        mapGroupToSerializableEditorsOfGroup.set(group, serializableEditorsOfGroup);
                    }
                    // Only store the index of the editor of that group
                    // which can be undefined if the editor is not serializable
                    const index = serializableEditorsOfGroup.indexOf(editor);
                    if (index === -1) {
                        return undefined;
                    }
                    return { groupId, index };
                }))
            };
        }
        loadState() {
            const serialized = this.storageService.get(EditorsObserver.STORAGE_KEY, 1 /* WORKSPACE */);
            // Previous state:
            if (serialized) {
                // Load editors map from persisted state
                this.deserialize(JSON.parse(serialized));
            }
            // No previous state: best we can do is add each editor
            // from oldest to most recently used editor group
            else {
                const groups = this.editorGroupsService.getGroups(1 /* MOST_RECENTLY_ACTIVE */);
                for (let i = groups.length - 1; i >= 0; i--) {
                    const group = groups[i];
                    const groupEditorsMru = group.getEditors(0 /* MOST_RECENTLY_ACTIVE */);
                    for (let i = groupEditorsMru.length - 1; i >= 0; i--) {
                        this.addMostRecentEditor(group, groupEditorsMru[i], true /* enforce as active to preserve order */, true /* is new */);
                    }
                }
            }
            // Ensure we listen on group changes for those that exist on startup
            for (const group of this.editorGroupsService.groups) {
                this.registerGroupListeners(group);
            }
        }
        deserialize(serialized) {
            const mapValues = [];
            for (const { groupId, index } of serialized.entries) {
                // Find group for entry
                const group = this.editorGroupsService.getGroup(groupId);
                if (!group) {
                    continue;
                }
                // Find editor for entry
                const editor = group.getEditorByIndex(index);
                if (!editor) {
                    continue;
                }
                // Make sure key is registered as well
                const editorIdentifier = this.ensureKey(group, editor);
                mapValues.push([editorIdentifier, editorIdentifier]);
                // Update in resource map
                this.updateEditorResourcesMap(editor, true);
            }
            // Fill map with deserialized values
            this.mostRecentEditorsMap.fromJSON(mapValues);
        }
    };
    EditorsObserver.STORAGE_KEY = 'editors.mru';
    EditorsObserver = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, storage_1.IStorageService)
    ], EditorsObserver);
    exports.EditorsObserver = EditorsObserver;
});
//# __sourceMappingURL=editorsObserver.js.map