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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "../common/extHostCustomers", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/webview/browser/webview", "vs/base/common/lifecycle", "vs/base/common/resources"], function (require, exports, uri_1, extHost_protocol_1, extHostCustomers_1, codeEditorService_1, webview_1, lifecycle_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadEditorInsets = void 0;
    // todo@joh move these things back into something like contrib/insets
    class EditorWebviewZone {
        // suppressMouseDown?: boolean | undefined;
        // heightInPx?: number | undefined;
        // minWidthInPx?: number | undefined;
        // marginDomNode?: HTMLElement | null | undefined;
        // onDomNodeTop?: ((top: number) => void) | undefined;
        // onComputedHeight?: ((height: number) => void) | undefined;
        constructor(editor, line, height, webview) {
            this.editor = editor;
            this.line = line;
            this.height = height;
            this.webview = webview;
            this.domNode = document.createElement('div');
            this.domNode.style.zIndex = '10'; // without this, the webview is not interactive
            this.afterLineNumber = line;
            this.afterColumn = 1;
            this.heightInLines = height;
            editor.changeViewZones(accessor => this._id = accessor.addZone(this));
            webview.mountTo(this.domNode);
        }
        dispose() {
            this.editor.changeViewZones(accessor => this._id && accessor.removeZone(this._id));
        }
    }
    let MainThreadEditorInsets = class MainThreadEditorInsets {
        constructor(context, _editorService, _webviewService) {
            this._editorService = _editorService;
            this._webviewService = _webviewService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._insets = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostEditorInsets);
        }
        dispose() {
            this._disposables.dispose();
        }
        async $createEditorInset(handle, id, uri, line, height, options, extensionId, extensionLocation) {
            let editor;
            id = id.substr(0, id.indexOf(',')); //todo@joh HACK
            for (const candidate of this._editorService.listCodeEditors()) {
                if (candidate.getId() === id && candidate.hasModel() && resources_1.isEqual(candidate.getModel().uri, uri_1.URI.revive(uri))) {
                    editor = candidate;
                    break;
                }
            }
            if (!editor) {
                setTimeout(() => this._proxy.$onDidDispose(handle));
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const webview = this._webviewService.createWebviewElement('' + handle, {
                enableFindWidget: false,
            }, {
                allowScripts: options.enableScripts,
                localResourceRoots: options.localResourceRoots ? options.localResourceRoots.map(uri => uri_1.URI.revive(uri)) : undefined
            }, { id: extensionId, location: uri_1.URI.revive(extensionLocation) });
            const webviewZone = new EditorWebviewZone(editor, line, height, webview);
            const remove = () => {
                disposables.dispose();
                this._proxy.$onDidDispose(handle);
                this._insets.delete(handle);
            };
            disposables.add(editor.onDidChangeModel(remove));
            disposables.add(editor.onDidDispose(remove));
            disposables.add(webviewZone);
            disposables.add(webview);
            disposables.add(webview.onMessage(msg => this._proxy.$onDidReceiveMessage(handle, msg)));
            this._insets.set(handle, webviewZone);
        }
        $disposeEditorInset(handle) {
            const inset = this.getInset(handle);
            this._insets.delete(handle);
            inset.dispose();
        }
        $setHtml(handle, value) {
            const inset = this.getInset(handle);
            inset.webview.html = value;
        }
        $setOptions(handle, options) {
            var _a;
            const inset = this.getInset(handle);
            inset.webview.contentOptions = Object.assign(Object.assign({}, options), { localResourceRoots: (_a = options.localResourceRoots) === null || _a === void 0 ? void 0 : _a.map(components => uri_1.URI.from(components)) });
        }
        async $postMessage(handle, value) {
            const inset = this.getInset(handle);
            inset.webview.postMessage(value);
            return true;
        }
        getInset(handle) {
            const inset = this._insets.get(handle);
            if (!inset) {
                throw new Error('Unknown inset');
            }
            return inset;
        }
    };
    MainThreadEditorInsets = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadEditorInsets),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, webview_1.IWebviewService)
    ], MainThreadEditorInsets);
    exports.MainThreadEditorInsets = MainThreadEditorInsets;
});
//# __sourceMappingURL=mainThreadCodeInsets.js.map