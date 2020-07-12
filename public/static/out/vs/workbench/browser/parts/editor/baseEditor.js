/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/composite", "vs/workbench/common/editor", "vs/base/common/map", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/types", "vs/workbench/browser/parts/editor/editor", "vs/base/common/resources", "vs/base/common/extpath"], function (require, exports, composite_1, editor_1, map_1, uri_1, event_1, types_1, editor_2, resources_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorMemento = exports.BaseEditor = void 0;
    /**
     * The base class of editors in the workbench. Editors register themselves for specific editor inputs.
     * Editors are layed out in the editor part of the workbench in editor groups. Multiple editors can be
     * open at the same time. Each editor has a minimized representation that is good enough to provide some
     * information about the state of the editor data.
     *
     * The workbench will keep an editor alive after it has been created and show/hide it based on
     * user interaction. The lifecycle of a editor goes in the order:
     *
     * - `createEditor()`
     * - `setEditorVisible()`
     * - `layout()`
     * - `setInput()`
     * - `focus()`
     * - `dispose()`: when the editor group the editor is in closes
     *
     * During use of the workbench, a editor will often receive a `clearInput()`, `setEditorVisible()`, `layout()` and
     * `focus()` calls, but only one `create()` and `dispose()` call.
     *
     * This class is only intended to be subclassed and not instantiated.
     */
    class BaseEditor extends composite_1.Composite {
        constructor(id, telemetryService, themeService, storageService) {
            super(id, telemetryService, themeService, storageService);
            this.onDidSizeConstraintsChange = event_1.Event.None;
        }
        get minimumWidth() { return editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get maximumWidth() { return editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get minimumHeight() { return editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumHeight() { return editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get input() { return this._input; }
        get options() { return this._options; }
        get group() { return this._group; }
        create(parent) {
            super.create(parent);
            // Create Editor
            this.createEditor(parent);
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given input with the options to the editor. The input is guaranteed
         * to be different from the previous input that was set using the `input.matches()`
         * method.
         *
         * The provided cancellation token should be used to test if the operation
         * was cancelled.
         */
        async setInput(input, options, token) {
            this._input = input;
            this._options = options;
        }
        /**
         * Called to indicate to the editor that the input should be cleared and
         * resources associated with the input should be freed.
         *
         * This method can be called based on different contexts, e.g. when opening
         * a different editor control or when closing all editors in a group.
         *
         * To monitor the lifecycle of editor inputs, you should not rely on this
         * method, rather refer to the listeners on `IEditorGroup` via `IEditorGroupService`.
         */
        clearInput() {
            this._input = undefined;
            this._options = undefined;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given options to the editor. Clients should apply the options
         * to the current input.
         */
        setOptions(options) {
            this._options = options;
        }
        setVisible(visible, group) {
            super.setVisible(visible);
            // Propagate to Editor
            this.setEditorVisible(visible, group);
        }
        /**
         * Indicates that the editor control got visible or hidden in a specific group. A
         * editor instance will only ever be visible in one editor group.
         *
         * @param visible the state of visibility of this editor
         * @param group the editor group this editor is in.
         */
        setEditorVisible(visible, group) {
            this._group = group;
        }
        getEditorMemento(editorGroupService, key, limit = 10) {
            const mementoKey = `${this.getId()}${key}`;
            let editorMemento = BaseEditor.EDITOR_MEMENTOS.get(mementoKey);
            if (!editorMemento) {
                editorMemento = new EditorMemento(this.getId(), key, this.getMemento(1 /* WORKSPACE */), limit, editorGroupService);
                BaseEditor.EDITOR_MEMENTOS.set(mementoKey, editorMemento);
            }
            return editorMemento;
        }
        saveState() {
            // Save all editor memento for this editor type
            BaseEditor.EDITOR_MEMENTOS.forEach(editorMemento => {
                if (editorMemento.id === this.getId()) {
                    editorMemento.saveState();
                }
            });
            super.saveState();
        }
        dispose() {
            this._input = undefined;
            this._options = undefined;
            super.dispose();
        }
    }
    exports.BaseEditor = BaseEditor;
    BaseEditor.EDITOR_MEMENTOS = new Map();
    class EditorMemento {
        constructor(id, key, memento, limit, editorGroupService) {
            this.id = id;
            this.key = key;
            this.memento = memento;
            this.limit = limit;
            this.editorGroupService = editorGroupService;
            this.cleanedUp = false;
        }
        saveEditorState(group, resourceOrEditor, state) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return; // we are not in a good state to save any state for a resource
            }
            const cache = this.doLoad();
            let mementoForResource = cache.get(resource.toString());
            if (!mementoForResource) {
                mementoForResource = Object.create(null);
                cache.set(resource.toString(), mementoForResource);
            }
            mementoForResource[group.id] = state;
            // Automatically clear when editor input gets disposed if any
            if (resourceOrEditor instanceof editor_1.EditorInput) {
                const editor = resourceOrEditor;
                if (!this.editorDisposables) {
                    this.editorDisposables = new Map();
                }
                if (!this.editorDisposables.has(editor)) {
                    this.editorDisposables.set(editor, event_1.Event.once(resourceOrEditor.onDispose)(() => {
                        var _a;
                        this.clearEditorState(resource);
                        (_a = this.editorDisposables) === null || _a === void 0 ? void 0 : _a.delete(editor);
                    }));
                }
            }
        }
        loadEditorState(group, resourceOrEditor) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return undefined; // we are not in a good state to load any state for a resource
            }
            const cache = this.doLoad();
            const mementoForResource = cache.get(resource.toString());
            if (mementoForResource) {
                return mementoForResource[group.id];
            }
            return undefined;
        }
        clearEditorState(resourceOrEditor, group) {
            const resource = this.doGetResource(resourceOrEditor);
            if (resource) {
                const cache = this.doLoad();
                if (group) {
                    const resourceViewState = cache.get(resource.toString());
                    if (resourceViewState) {
                        delete resourceViewState[group.id];
                        if (types_1.isEmptyObject(resourceViewState)) {
                            cache.delete(resource.toString());
                        }
                    }
                }
                else {
                    cache.delete(resource.toString());
                }
            }
        }
        moveEditorState(source, target, comparer) {
            const cache = this.doLoad();
            // We need a copy of the keys to not iterate over
            // newly inserted elements.
            const cacheKeys = [...cache.keys()];
            for (const cacheKey of cacheKeys) {
                const resource = uri_1.URI.parse(cacheKey);
                if (!comparer.isEqualOrParent(resource, source)) {
                    continue; // not matching our resource
                }
                // Determine new resulting target resource
                let targetResource;
                if (source.toString() === resource.toString()) {
                    targetResource = target; // file got moved
                }
                else {
                    const index = extpath_1.indexOfPath(resource.path, source.path);
                    targetResource = resources_1.joinPath(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                }
                // Don't modify LRU state.
                const value = cache.get(cacheKey, 0 /* None */);
                if (value) {
                    cache.delete(cacheKey);
                    cache.set(targetResource.toString(), value);
                }
            }
        }
        doGetResource(resourceOrEditor) {
            if (resourceOrEditor instanceof editor_1.EditorInput) {
                return resourceOrEditor.resource;
            }
            return resourceOrEditor;
        }
        doLoad() {
            if (!this.cache) {
                this.cache = new map_1.LRUCache(this.limit);
                // Restore from serialized map state
                const rawEditorMemento = this.memento[this.key];
                if (Array.isArray(rawEditorMemento)) {
                    this.cache.fromJSON(rawEditorMemento);
                }
            }
            return this.cache;
        }
        saveState() {
            const cache = this.doLoad();
            // Cleanup once during shutdown
            if (!this.cleanedUp) {
                this.cleanUp();
                this.cleanedUp = true;
            }
            this.memento[this.key] = cache.toJSON();
        }
        cleanUp() {
            const cache = this.doLoad();
            // Remove groups from states that no longer exist. Since we modify the
            // cache and its is a LRU cache make a copy to ensure iteration succeeds
            const entries = [...cache.entries()];
            for (const [resource, mapGroupToMemento] of entries) {
                Object.keys(mapGroupToMemento).forEach(group => {
                    const groupId = Number(group);
                    if (!this.editorGroupService.getGroup(groupId)) {
                        delete mapGroupToMemento[groupId];
                        if (types_1.isEmptyObject(mapGroupToMemento)) {
                            cache.delete(resource);
                        }
                    }
                });
            }
        }
    }
    exports.EditorMemento = EditorMemento;
});
//# __sourceMappingURL=baseEditor.js.map