/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/shared/webview", "./cache", "./extHost.protocol", "./extHostTypes"], function (require, exports, cancellation_1, event_1, hash_1, lifecycle_1, network_1, resources_1, uri_1, uuid_1, typeConverters, webview_1, cache_1, extHostProtocol, extHostTypes) {
    "use strict";
    var _handle_1, _proxy_1, _deprecationService_1, _initData, _workspace, _extension, _html, _options, _isDisposed, _hasCalledAsWebviewUri, _handle_2, _proxy_2, _viewType, _webview, _options_1, _title, _iconPath, _viewColumn, _visible, _active, _isDisposed_1, _onDidDispose, _onDidChangeViewState;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviews = exports.ExtHostWebviewEditor = exports.ExtHostWebview = void 0;
    class ExtHostWebview {
        constructor(handle, proxy, options, initData, workspace, extension, deprecationService) {
            _handle_1.set(this, void 0);
            _proxy_1.set(this, void 0);
            _deprecationService_1.set(this, void 0);
            _initData.set(this, void 0);
            _workspace.set(this, void 0);
            _extension.set(this, void 0);
            _html.set(this, '');
            _options.set(this, void 0);
            _isDisposed.set(this, false);
            _hasCalledAsWebviewUri.set(this, false);
            /* internal */ this._onMessageEmitter = new event_1.Emitter();
            this.onDidReceiveMessage = this._onMessageEmitter.event;
            __classPrivateFieldSet(this, _handle_1, handle);
            __classPrivateFieldSet(this, _proxy_1, proxy);
            __classPrivateFieldSet(this, _options, options);
            __classPrivateFieldSet(this, _initData, initData);
            __classPrivateFieldSet(this, _workspace, workspace);
            __classPrivateFieldSet(this, _extension, extension);
            __classPrivateFieldSet(this, _deprecationService_1, deprecationService);
        }
        dispose() {
            this._onMessageEmitter.dispose();
        }
        asWebviewUri(resource) {
            __classPrivateFieldSet(this, _hasCalledAsWebviewUri, true);
            return webview_1.asWebviewUri(__classPrivateFieldGet(this, _initData), __classPrivateFieldGet(this, _handle_1), resource);
        }
        get cspSource() {
            return __classPrivateFieldGet(this, _initData).webviewCspSource
                .replace('{{uuid}}', __classPrivateFieldGet(this, _handle_1));
        }
        get html() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _html);
        }
        set html(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _html) !== value) {
                __classPrivateFieldSet(this, _html, value);
                if (!__classPrivateFieldGet(this, _hasCalledAsWebviewUri) && /(["'])vscode-resource:([^\s'"]+?)(["'])/i.test(value)) {
                    __classPrivateFieldSet(this, _hasCalledAsWebviewUri, true);
                    __classPrivateFieldGet(this, _deprecationService_1).report('Webview vscode-resource: uris', __classPrivateFieldGet(this, _extension), `Please migrate to use the 'webview.asWebviewUri' api instead: https://aka.ms/vscode-webview-use-aswebviewuri`);
                }
                __classPrivateFieldGet(this, _proxy_1).$setHtml(__classPrivateFieldGet(this, _handle_1), value);
            }
        }
        get options() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _options);
        }
        set options(newOptions) {
            this.assertNotDisposed();
            __classPrivateFieldGet(this, _proxy_1).$setOptions(__classPrivateFieldGet(this, _handle_1), convertWebviewOptions(__classPrivateFieldGet(this, _extension), __classPrivateFieldGet(this, _workspace), newOptions));
            __classPrivateFieldSet(this, _options, newOptions);
        }
        postMessage(message) {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _proxy_1).$postMessage(__classPrivateFieldGet(this, _handle_1), message);
        }
        assertNotDisposed() {
            if (__classPrivateFieldGet(this, _isDisposed)) {
                throw new Error('Webview is disposed');
            }
        }
    }
    exports.ExtHostWebview = ExtHostWebview;
    _handle_1 = new WeakMap(), _proxy_1 = new WeakMap(), _deprecationService_1 = new WeakMap(), _initData = new WeakMap(), _workspace = new WeakMap(), _extension = new WeakMap(), _html = new WeakMap(), _options = new WeakMap(), _isDisposed = new WeakMap(), _hasCalledAsWebviewUri = new WeakMap();
    class ExtHostWebviewEditor extends lifecycle_1.Disposable {
        constructor(handle, proxy, viewType, title, viewColumn, editorOptions, webview) {
            super();
            _handle_2.set(this, void 0);
            _proxy_2.set(this, void 0);
            _viewType.set(this, void 0);
            _webview.set(this, void 0);
            _options_1.set(this, void 0);
            _title.set(this, void 0);
            _iconPath.set(this, void 0);
            _viewColumn.set(this, undefined);
            _visible.set(this, true);
            _active.set(this, true);
            _isDisposed_1.set(this, false);
            _onDidDispose.set(this, this._register(new event_1.Emitter()));
            this.onDidDispose = __classPrivateFieldGet(this, _onDidDispose).event;
            _onDidChangeViewState.set(this, this._register(new event_1.Emitter()));
            this.onDidChangeViewState = __classPrivateFieldGet(this, _onDidChangeViewState).event;
            __classPrivateFieldSet(this, _handle_2, handle);
            __classPrivateFieldSet(this, _proxy_2, proxy);
            __classPrivateFieldSet(this, _viewType, viewType);
            __classPrivateFieldSet(this, _options_1, editorOptions);
            __classPrivateFieldSet(this, _viewColumn, viewColumn);
            __classPrivateFieldSet(this, _title, title);
            __classPrivateFieldSet(this, _webview, webview);
        }
        dispose() {
            if (__classPrivateFieldGet(this, _isDisposed_1)) {
                return;
            }
            __classPrivateFieldSet(this, _isDisposed_1, true);
            __classPrivateFieldGet(this, _onDidDispose).fire();
            __classPrivateFieldGet(this, _proxy_2).$disposeWebview(__classPrivateFieldGet(this, _handle_2));
            __classPrivateFieldGet(this, _webview).dispose();
            super.dispose();
        }
        get webview() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _webview);
        }
        get viewType() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _viewType);
        }
        get title() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _title);
        }
        set title(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _title) !== value) {
                __classPrivateFieldSet(this, _title, value);
                __classPrivateFieldGet(this, _proxy_2).$setTitle(__classPrivateFieldGet(this, _handle_2), value);
            }
        }
        get iconPath() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _iconPath);
        }
        set iconPath(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _iconPath) !== value) {
                __classPrivateFieldSet(this, _iconPath, value);
                __classPrivateFieldGet(this, _proxy_2).$setIconPath(__classPrivateFieldGet(this, _handle_2), uri_1.URI.isUri(value) ? { light: value, dark: value } : value);
            }
        }
        get options() {
            return __classPrivateFieldGet(this, _options_1);
        }
        get viewColumn() {
            this.assertNotDisposed();
            if (typeof __classPrivateFieldGet(this, _viewColumn) === 'number' && __classPrivateFieldGet(this, _viewColumn) < 0) {
                // We are using a symbolic view column
                // Return undefined instead to indicate that the real view column is currently unknown but will be resolved.
                return undefined;
            }
            return __classPrivateFieldGet(this, _viewColumn);
        }
        get active() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _active);
        }
        get visible() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _visible);
        }
        _updateViewState(newState) {
            if (__classPrivateFieldGet(this, _isDisposed_1)) {
                return;
            }
            if (this.active !== newState.active || this.visible !== newState.visible || this.viewColumn !== newState.viewColumn) {
                __classPrivateFieldSet(this, _active, newState.active);
                __classPrivateFieldSet(this, _visible, newState.visible);
                __classPrivateFieldSet(this, _viewColumn, newState.viewColumn);
                __classPrivateFieldGet(this, _onDidChangeViewState).fire({ webviewPanel: this });
            }
        }
        postMessage(message) {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _proxy_2).$postMessage(__classPrivateFieldGet(this, _handle_2), message);
        }
        reveal(viewColumn, preserveFocus) {
            this.assertNotDisposed();
            __classPrivateFieldGet(this, _proxy_2).$reveal(__classPrivateFieldGet(this, _handle_2), {
                viewColumn: viewColumn ? typeConverters.ViewColumn.from(viewColumn) : undefined,
                preserveFocus: !!preserveFocus
            });
        }
        assertNotDisposed() {
            if (__classPrivateFieldGet(this, _isDisposed_1)) {
                throw new Error('Webview is disposed');
            }
        }
    }
    exports.ExtHostWebviewEditor = ExtHostWebviewEditor;
    _handle_2 = new WeakMap(), _proxy_2 = new WeakMap(), _viewType = new WeakMap(), _webview = new WeakMap(), _options_1 = new WeakMap(), _title = new WeakMap(), _iconPath = new WeakMap(), _viewColumn = new WeakMap(), _visible = new WeakMap(), _active = new WeakMap(), _isDisposed_1 = new WeakMap(), _onDidDispose = new WeakMap(), _onDidChangeViewState = new WeakMap();
    class CustomDocumentStoreEntry {
        constructor(document, _storagePath) {
            this.document = document;
            this._storagePath = _storagePath;
            this._backupCounter = 1;
            this._edits = new cache_1.Cache('custom documents');
        }
        addEdit(item) {
            return this._edits.add([item]);
        }
        async undo(editId, isDirty) {
            await this.getEdit(editId).undo();
            if (!isDirty) {
                this.disposeBackup();
            }
        }
        async redo(editId, isDirty) {
            await this.getEdit(editId).redo();
            if (!isDirty) {
                this.disposeBackup();
            }
        }
        disposeEdits(editIds) {
            for (const id of editIds) {
                this._edits.delete(id);
            }
        }
        getNewBackupUri() {
            if (!this._storagePath) {
                throw new Error('Backup requires a valid storage path');
            }
            const fileName = hashPath(this.document.uri) + (this._backupCounter++);
            return resources_1.joinPath(this._storagePath, fileName);
        }
        updateBackup(backup) {
            var _a;
            (_a = this._backup) === null || _a === void 0 ? void 0 : _a.delete();
            this._backup = backup;
        }
        disposeBackup() {
            var _a;
            (_a = this._backup) === null || _a === void 0 ? void 0 : _a.delete();
            this._backup = undefined;
        }
        getEdit(editId) {
            const edit = this._edits.get(editId, 0);
            if (!edit) {
                throw new Error('No edit found');
            }
            return edit;
        }
    }
    class CustomDocumentStore {
        constructor() {
            this._documents = new Map();
        }
        get(viewType, resource) {
            return this._documents.get(this.key(viewType, resource));
        }
        add(viewType, document, storagePath) {
            const key = this.key(viewType, document.uri);
            if (this._documents.has(key)) {
                throw new Error(`Document already exists for viewType:${viewType} resource:${document.uri}`);
            }
            const entry = new CustomDocumentStoreEntry(document, storagePath);
            this._documents.set(key, entry);
            return entry;
        }
        delete(viewType, document) {
            const key = this.key(viewType, document.uri);
            this._documents.delete(key);
        }
        key(viewType, resource) {
            return `${viewType}@@@${resource}`;
        }
    }
    var WebviewEditorType;
    (function (WebviewEditorType) {
        WebviewEditorType[WebviewEditorType["Text"] = 0] = "Text";
        WebviewEditorType[WebviewEditorType["Custom"] = 1] = "Custom";
    })(WebviewEditorType || (WebviewEditorType = {}));
    class EditorProviderStore {
        constructor() {
            this._providers = new Map();
        }
        addTextProvider(viewType, extension, provider) {
            return this.add(0 /* Text */, viewType, extension, provider);
        }
        addCustomProvider(viewType, extension, provider) {
            return this.add(1 /* Custom */, viewType, extension, provider);
        }
        get(viewType) {
            return this._providers.get(viewType);
        }
        add(type, viewType, extension, provider) {
            if (this._providers.has(viewType)) {
                throw new Error(`Provider for viewType:${viewType} already registered`);
            }
            this._providers.set(viewType, { type, extension, provider });
            return new extHostTypes.Disposable(() => this._providers.delete(viewType));
        }
    }
    class ExtHostWebviews {
        constructor(mainContext, initData, workspace, _logService, _deprecationService, _extHostDocuments, _extensionStoragePaths) {
            this.initData = initData;
            this.workspace = workspace;
            this._logService = _logService;
            this._deprecationService = _deprecationService;
            this._extHostDocuments = _extHostDocuments;
            this._extensionStoragePaths = _extensionStoragePaths;
            this._webviewPanels = new Map();
            this._serializers = new Map();
            this._editorProviders = new EditorProviderStore();
            this._documents = new CustomDocumentStore();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviews);
        }
        static newHandle() {
            return uuid_1.generateUuid();
        }
        createWebviewPanel(extension, viewType, title, showOptions, options = {}) {
            const viewColumn = typeof showOptions === 'object' ? showOptions.viewColumn : showOptions;
            const webviewShowOptions = {
                viewColumn: typeConverters.ViewColumn.from(viewColumn),
                preserveFocus: typeof showOptions === 'object' && !!showOptions.preserveFocus
            };
            const handle = ExtHostWebviews.newHandle();
            this._proxy.$createWebviewPanel(toExtensionData(extension), handle, viewType, title, webviewShowOptions, convertWebviewOptions(extension, this.workspace, options));
            const webview = new ExtHostWebview(handle, this._proxy, options, this.initData, this.workspace, extension, this._deprecationService);
            const panel = new ExtHostWebviewEditor(handle, this._proxy, viewType, title, viewColumn, options, webview);
            this._webviewPanels.set(handle, panel);
            return panel;
        }
        registerWebviewPanelSerializer(extension, viewType, serializer) {
            if (this._serializers.has(viewType)) {
                throw new Error(`Serializer for '${viewType}' already registered`);
            }
            this._serializers.set(viewType, { serializer, extension });
            this._proxy.$registerSerializer(viewType);
            return new extHostTypes.Disposable(() => {
                this._serializers.delete(viewType);
                this._proxy.$unregisterSerializer(viewType);
            });
        }
        registerCustomEditorProvider(extension, viewType, provider, options) {
            const disposables = new lifecycle_1.DisposableStore();
            if ('resolveCustomTextEditor' in provider) {
                disposables.add(this._editorProviders.addTextProvider(viewType, extension, provider));
                this._proxy.$registerTextEditorProvider(toExtensionData(extension), viewType, options.webviewOptions || {}, {
                    supportsMove: !!provider.moveCustomTextEditor,
                });
            }
            else {
                disposables.add(this._editorProviders.addCustomProvider(viewType, extension, provider));
                if (this.supportEditing(provider)) {
                    disposables.add(provider.onDidChangeCustomDocument(e => {
                        const entry = this.getCustomDocumentEntry(viewType, e.document.uri);
                        if (isEditEvent(e)) {
                            const editId = entry.addEdit(e);
                            this._proxy.$onDidEdit(e.document.uri, viewType, editId, e.label);
                        }
                        else {
                            this._proxy.$onContentChange(e.document.uri, viewType);
                        }
                    }));
                }
                this._proxy.$registerCustomEditorProvider(toExtensionData(extension), viewType, options.webviewOptions || {}, !!options.supportsMultipleEditorsPerDocument);
            }
            return extHostTypes.Disposable.from(disposables, new extHostTypes.Disposable(() => {
                this._proxy.$unregisterEditorProvider(viewType);
            }));
        }
        $onMessage(handle, message) {
            const panel = this.getWebviewPanel(handle);
            if (panel) {
                panel.webview._onMessageEmitter.fire(message);
            }
        }
        $onMissingCsp(_handle, extensionId) {
            this._logService.warn(`${extensionId} created a webview without a content security policy: https://aka.ms/vscode-webview-missing-csp`);
        }
        $onDidChangeWebviewPanelViewStates(newStates) {
            const handles = Object.keys(newStates);
            // Notify webviews of state changes in the following order:
            // - Non-visible
            // - Visible
            // - Active
            handles.sort((a, b) => {
                const stateA = newStates[a];
                const stateB = newStates[b];
                if (stateA.active) {
                    return 1;
                }
                if (stateB.active) {
                    return -1;
                }
                return (+stateA.visible) - (+stateB.visible);
            });
            for (const handle of handles) {
                const panel = this.getWebviewPanel(handle);
                if (!panel) {
                    continue;
                }
                const newState = newStates[handle];
                panel._updateViewState({
                    active: newState.active,
                    visible: newState.visible,
                    viewColumn: typeConverters.ViewColumn.to(newState.position),
                });
            }
        }
        async $onDidDisposeWebviewPanel(handle) {
            const panel = this.getWebviewPanel(handle);
            if (panel) {
                panel.dispose();
                this._webviewPanels.delete(handle);
            }
        }
        async $deserializeWebviewPanel(webviewHandle, viewType, title, state, position, options) {
            const entry = this._serializers.get(viewType);
            if (!entry) {
                throw new Error(`No serializer found for '${viewType}'`);
            }
            const { serializer, extension } = entry;
            const webview = new ExtHostWebview(webviewHandle, this._proxy, reviveOptions(options), this.initData, this.workspace, extension, this._deprecationService);
            const revivedPanel = new ExtHostWebviewEditor(webviewHandle, this._proxy, viewType, title, typeof position === 'number' && position >= 0 ? typeConverters.ViewColumn.to(position) : undefined, options, webview);
            this._webviewPanels.set(webviewHandle, revivedPanel);
            await serializer.deserializeWebviewPanel(revivedPanel, state);
        }
        async $createCustomDocument(resource, viewType, backupId, cancellation) {
            var _a;
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (entry.type !== 1 /* Custom */) {
                throw new Error(`Invalid provide type for '${viewType}'`);
            }
            const revivedResource = uri_1.URI.revive(resource);
            const document = await entry.provider.openCustomDocument(revivedResource, { backupId }, cancellation);
            let storageRoot;
            if (this.supportEditing(entry.provider) && this._extensionStoragePaths) {
                storageRoot = uri_1.URI.file((_a = this._extensionStoragePaths.workspaceValue(entry.extension)) !== null && _a !== void 0 ? _a : this._extensionStoragePaths.globalValue(entry.extension));
            }
            this._documents.add(viewType, document, storageRoot);
            return { editable: this.supportEditing(entry.provider) };
        }
        async $disposeCustomDocument(resource, viewType) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (entry.type !== 1 /* Custom */) {
                throw new Error(`Invalid provider type for '${viewType}'`);
            }
            const revivedResource = uri_1.URI.revive(resource);
            const { document } = this.getCustomDocumentEntry(viewType, revivedResource);
            this._documents.delete(viewType, document);
            document.dispose();
        }
        async $resolveWebviewEditor(resource, handle, viewType, title, position, options, cancellation) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            const webview = new ExtHostWebview(handle, this._proxy, reviveOptions(options), this.initData, this.workspace, entry.extension, this._deprecationService);
            const revivedPanel = new ExtHostWebviewEditor(handle, this._proxy, viewType, title, typeof position === 'number' && position >= 0 ? typeConverters.ViewColumn.to(position) : undefined, options, webview);
            this._webviewPanels.set(handle, revivedPanel);
            const revivedResource = uri_1.URI.revive(resource);
            switch (entry.type) {
                case 1 /* Custom */:
                    {
                        const { document } = this.getCustomDocumentEntry(viewType, revivedResource);
                        return entry.provider.resolveCustomEditor(document, revivedPanel, cancellation);
                    }
                case 0 /* Text */:
                    {
                        const document = this._extHostDocuments.getDocument(revivedResource);
                        return entry.provider.resolveCustomTextEditor(document, revivedPanel, cancellation);
                    }
                default:
                    {
                        throw new Error('Unknown webview provider type');
                    }
            }
        }
        $disposeEdits(resourceComponents, viewType, editIds) {
            const document = this.getCustomDocumentEntry(viewType, resourceComponents);
            document.disposeEdits(editIds);
        }
        async $onMoveCustomEditor(handle, newResourceComponents, viewType) {
            const entry = this._editorProviders.get(viewType);
            if (!entry) {
                throw new Error(`No provider found for '${viewType}'`);
            }
            if (!entry.provider.moveCustomTextEditor) {
                throw new Error(`Provider does not implement move '${viewType}'`);
            }
            const webview = this.getWebviewPanel(handle);
            if (!webview) {
                throw new Error(`No webview found`);
            }
            const resource = uri_1.URI.revive(newResourceComponents);
            const document = this._extHostDocuments.getDocument(resource);
            await entry.provider.moveCustomTextEditor(document, webview, cancellation_1.CancellationToken.None);
        }
        async $undo(resourceComponents, viewType, editId, isDirty) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            return entry.undo(editId, isDirty);
        }
        async $redo(resourceComponents, viewType, editId, isDirty) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            return entry.redo(editId, isDirty);
        }
        async $revert(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            await provider.revertCustomDocument(entry.document, cancellation);
            entry.disposeBackup();
        }
        async $onSave(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            await provider.saveCustomDocument(entry.document, cancellation);
            entry.disposeBackup();
        }
        async $onSaveAs(resourceComponents, viewType, targetResource, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            return provider.saveCustomDocumentAs(entry.document, uri_1.URI.revive(targetResource), cancellation);
        }
        async $backup(resourceComponents, viewType, cancellation) {
            const entry = this.getCustomDocumentEntry(viewType, resourceComponents);
            const provider = this.getCustomEditorProvider(viewType);
            const backup = await provider.backupCustomDocument(entry.document, {
                destination: entry.getNewBackupUri(),
            }, cancellation);
            entry.updateBackup(backup);
            return backup.id;
        }
        getWebviewPanel(handle) {
            return this._webviewPanels.get(handle);
        }
        getCustomDocumentEntry(viewType, resource) {
            const entry = this._documents.get(viewType, uri_1.URI.revive(resource));
            if (!entry) {
                throw new Error('No custom document found');
            }
            return entry;
        }
        getCustomEditorProvider(viewType) {
            const entry = this._editorProviders.get(viewType);
            const provider = entry === null || entry === void 0 ? void 0 : entry.provider;
            if (!provider || !this.supportEditing(provider)) {
                throw new Error('Custom document is not editable');
            }
            return provider;
        }
        supportEditing(provider) {
            return !!provider.onDidChangeCustomDocument;
        }
    }
    exports.ExtHostWebviews = ExtHostWebviews;
    function toExtensionData(extension) {
        return { id: extension.identifier, location: extension.extensionLocation };
    }
    function convertWebviewOptions(extension, workspace, options) {
        return Object.assign(Object.assign({}, options), { localResourceRoots: options.localResourceRoots || getDefaultLocalResourceRoots(extension, workspace) });
    }
    function reviveOptions(options) {
        var _a;
        return Object.assign(Object.assign({}, options), { localResourceRoots: (_a = options.localResourceRoots) === null || _a === void 0 ? void 0 : _a.map(components => uri_1.URI.from(components)) });
    }
    function getDefaultLocalResourceRoots(extension, workspace) {
        return [
            ...((workspace === null || workspace === void 0 ? void 0 : workspace.getWorkspaceFolders()) || []).map(x => x.uri),
            extension.extensionLocation,
        ];
    }
    function isEditEvent(e) {
        return typeof e.undo === 'function'
            && typeof e.redo === 'function';
    }
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return hash_1.hash(str) + '';
    }
});
//# __sourceMappingURL=extHostWebview.js.map