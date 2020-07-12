/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/api/common/shared/webview", "vs/base/common/uuid"], function (require, exports, event_1, lifecycle_1, webview_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditorInsets = void 0;
    class ExtHostEditorInsets {
        constructor(_proxy, _editors, _initData) {
            this._proxy = _proxy;
            this._editors = _editors;
            this._initData = _initData;
            this._handlePool = 0;
            this._disposables = new lifecycle_1.DisposableStore();
            this._insets = new Map();
            // dispose editor inset whenever the hosting editor goes away
            this._disposables.add(_editors.onDidChangeVisibleTextEditors(() => {
                const visibleEditor = _editors.getVisibleTextEditors();
                for (const value of this._insets.values()) {
                    if (visibleEditor.indexOf(value.editor) < 0) {
                        value.inset.dispose(); // will remove from `this._insets`
                    }
                }
            }));
        }
        dispose() {
            this._insets.forEach(value => value.inset.dispose());
            this._disposables.dispose();
        }
        createWebviewEditorInset(editor, line, height, options, extension) {
            let apiEditor;
            for (const candidate of this._editors.getVisibleTextEditors()) {
                if (candidate === editor) {
                    apiEditor = candidate;
                    break;
                }
            }
            if (!apiEditor) {
                throw new Error('not a visible editor');
            }
            const that = this;
            const handle = this._handlePool++;
            const onDidReceiveMessage = new event_1.Emitter();
            const onDidDispose = new event_1.Emitter();
            const webview = new class {
                constructor() {
                    this._uuid = uuid_1.generateUuid();
                    this._html = '';
                    this._options = Object.create(null);
                }
                asWebviewUri(resource) {
                    return webview_1.asWebviewUri(that._initData, this._uuid, resource);
                }
                get cspSource() {
                    return that._initData.webviewCspSource;
                }
                set options(value) {
                    this._options = value;
                    that._proxy.$setOptions(handle, value);
                }
                get options() {
                    return this._options;
                }
                set html(value) {
                    this._html = value;
                    that._proxy.$setHtml(handle, value);
                }
                get html() {
                    return this._html;
                }
                get onDidReceiveMessage() {
                    return onDidReceiveMessage.event;
                }
                postMessage(message) {
                    return that._proxy.$postMessage(handle, message);
                }
            };
            const inset = new class {
                constructor() {
                    this.editor = editor;
                    this.line = line;
                    this.height = height;
                    this.webview = webview;
                    this.onDidDispose = onDidDispose.event;
                }
                dispose() {
                    if (that._insets.has(handle)) {
                        that._insets.delete(handle);
                        that._proxy.$disposeEditorInset(handle);
                        onDidDispose.fire();
                        // final cleanup
                        onDidDispose.dispose();
                        onDidReceiveMessage.dispose();
                    }
                }
            };
            this._proxy.$createEditorInset(handle, apiEditor.id, apiEditor.document.uri, line + 1, height, options || {}, extension.identifier, extension.extensionLocation);
            this._insets.set(handle, { editor, inset, onDidReceiveMessage });
            return inset;
        }
        $onDidDispose(handle) {
            const value = this._insets.get(handle);
            if (value) {
                value.inset.dispose();
            }
        }
        $onDidReceiveMessage(handle, message) {
            const value = this._insets.get(handle);
            if (value) {
                value.onDidReceiveMessage.fire(message);
            }
        }
    }
    exports.ExtHostEditorInsets = ExtHostEditorInsets;
});
//# __sourceMappingURL=extHostCodeInsets.js.map