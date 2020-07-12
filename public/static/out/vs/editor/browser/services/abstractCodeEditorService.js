/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelTransientSettingWatcher = exports.AbstractCodeEditorService = void 0;
    class AbstractCodeEditorService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onCodeEditorAdd = this._register(new event_1.Emitter());
            this.onCodeEditorAdd = this._onCodeEditorAdd.event;
            this._onCodeEditorRemove = this._register(new event_1.Emitter());
            this.onCodeEditorRemove = this._onCodeEditorRemove.event;
            this._onDiffEditorAdd = this._register(new event_1.Emitter());
            this.onDiffEditorAdd = this._onDiffEditorAdd.event;
            this._onDiffEditorRemove = this._register(new event_1.Emitter());
            this.onDiffEditorRemove = this._onDiffEditorRemove.event;
            this._onDidChangeTransientModelProperty = this._register(new event_1.Emitter());
            this.onDidChangeTransientModelProperty = this._onDidChangeTransientModelProperty.event;
            this._transientWatchers = {};
            this._modelProperties = new Map();
            this._codeEditors = Object.create(null);
            this._diffEditors = Object.create(null);
        }
        addCodeEditor(editor) {
            this._codeEditors[editor.getId()] = editor;
            this._onCodeEditorAdd.fire(editor);
        }
        removeCodeEditor(editor) {
            if (delete this._codeEditors[editor.getId()]) {
                this._onCodeEditorRemove.fire(editor);
            }
        }
        listCodeEditors() {
            return Object.keys(this._codeEditors).map(id => this._codeEditors[id]);
        }
        addDiffEditor(editor) {
            this._diffEditors[editor.getId()] = editor;
            this._onDiffEditorAdd.fire(editor);
        }
        removeDiffEditor(editor) {
            if (delete this._diffEditors[editor.getId()]) {
                this._onDiffEditorRemove.fire(editor);
            }
        }
        listDiffEditors() {
            return Object.keys(this._diffEditors).map(id => this._diffEditors[id]);
        }
        getFocusedCodeEditor() {
            let editorWithWidgetFocus = null;
            const editors = this.listCodeEditors();
            for (const editor of editors) {
                if (editor.hasTextFocus()) {
                    // bingo!
                    return editor;
                }
                if (editor.hasWidgetFocus()) {
                    editorWithWidgetFocus = editor;
                }
            }
            return editorWithWidgetFocus;
        }
        setModelProperty(resource, key, value) {
            const key1 = resource.toString();
            let dest;
            if (this._modelProperties.has(key1)) {
                dest = this._modelProperties.get(key1);
            }
            else {
                dest = new Map();
                this._modelProperties.set(key1, dest);
            }
            dest.set(key, value);
        }
        getModelProperty(resource, key) {
            const key1 = resource.toString();
            if (this._modelProperties.has(key1)) {
                const innerMap = this._modelProperties.get(key1);
                return innerMap.get(key);
            }
            return undefined;
        }
        setTransientModelProperty(model, key, value) {
            const uri = model.uri.toString();
            let w;
            if (this._transientWatchers.hasOwnProperty(uri)) {
                w = this._transientWatchers[uri];
            }
            else {
                w = new ModelTransientSettingWatcher(uri, model, this);
                this._transientWatchers[uri] = w;
            }
            w.set(key, value);
            this._onDidChangeTransientModelProperty.fire(model);
        }
        getTransientModelProperty(model, key) {
            const uri = model.uri.toString();
            if (!this._transientWatchers.hasOwnProperty(uri)) {
                return undefined;
            }
            return this._transientWatchers[uri].get(key);
        }
        getTransientModelProperties(model) {
            const uri = model.uri.toString();
            if (!this._transientWatchers.hasOwnProperty(uri)) {
                return undefined;
            }
            return this._transientWatchers[uri].keys().map(key => [key, this._transientWatchers[uri].get(key)]);
        }
        _removeWatcher(w) {
            delete this._transientWatchers[w.uri];
        }
    }
    exports.AbstractCodeEditorService = AbstractCodeEditorService;
    class ModelTransientSettingWatcher {
        constructor(uri, model, owner) {
            this.uri = uri;
            this._values = {};
            model.onWillDispose(() => owner._removeWatcher(this));
        }
        set(key, value) {
            this._values[key] = value;
        }
        get(key) {
            return this._values[key];
        }
        keys() {
            return Object.keys(this._values);
        }
    }
    exports.ModelTransientSettingWatcher = ModelTransientSettingWatcher;
});
//# __sourceMappingURL=abstractCodeEditorService.js.map