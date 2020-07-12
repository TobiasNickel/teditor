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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri", "vs/nls", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/shared/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/customTextEditorModel", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/contrib/webview/browser/webviewWorkbenchService", "vs/workbench/services/backup/common/backup", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "../common/extHostCustomers"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, network_1, path_1, platform_1, resources_1, strings_1, uri_1, nls_1, files_1, instantiation_1, label_1, opener_1, productService_1, telemetry_1, undoRedo_1, extHostProtocol, editor_1, diffEditorInput_1, customEditorInput_1, customEditor_1, customTextEditorModel_1, webviewEditorInput_1, webviewWorkbenchService_1, backup_1, editorGroupsService_1, editorService_1, extensions_1, workingCopyFileService_1, workingCopyService_1, extHostCustomers_1) {
    "use strict";
    var MainThreadWebviews_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviews = void 0;
    /**
     * Bi-directional map between webview handles and inputs.
     */
    class WebviewInputStore {
        constructor() {
            this._handlesToInputs = new Map();
            this._inputsToHandles = new Map();
        }
        add(handle, input) {
            this._handlesToInputs.set(handle, input);
            this._inputsToHandles.set(input, handle);
        }
        getHandleForInput(input) {
            return this._inputsToHandles.get(input);
        }
        getInputForHandle(handle) {
            return this._handlesToInputs.get(handle);
        }
        delete(handle) {
            const input = this.getInputForHandle(handle);
            this._handlesToInputs.delete(handle);
            if (input) {
                this._inputsToHandles.delete(input);
            }
        }
        get size() {
            return this._handlesToInputs.size;
        }
        [Symbol.iterator]() {
            return this._handlesToInputs.values();
        }
    }
    class WebviewViewTypeTransformer {
        constructor(prefix) {
            this.prefix = prefix;
        }
        fromExternal(viewType) {
            return this.prefix + viewType;
        }
        toExternal(viewType) {
            return viewType.startsWith(this.prefix)
                ? viewType.substr(this.prefix.length)
                : undefined;
        }
    }
    var ModelType;
    (function (ModelType) {
        ModelType[ModelType["Custom"] = 0] = "Custom";
        ModelType[ModelType["Text"] = 1] = "Text";
    })(ModelType || (ModelType = {}));
    const webviewPanelViewType = new WebviewViewTypeTransformer('mainThreadWebview-');
    let MainThreadWebviews = MainThreadWebviews_1 = class MainThreadWebviews extends lifecycle_1.Disposable {
        constructor(context, extensionService, workingCopyService, workingCopyFileService, _customEditorService, _editorGroupService, _editorService, _openerService, _productService, _telemetryService, _webviewWorkbenchService, _instantiationService, _backupService) {
            super();
            this._customEditorService = _customEditorService;
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._openerService = _openerService;
            this._productService = _productService;
            this._telemetryService = _telemetryService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._instantiationService = _instantiationService;
            this._backupService = _backupService;
            this._webviewInputs = new WebviewInputStore();
            this._revivers = new Map();
            this._editorProviders = new Map();
            this._webviewFromDiffEditorHandles = new Set();
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviews);
            this._register(_editorService.onDidActiveEditorChange(() => {
                const activeInput = this._editorService.activeEditor;
                if (activeInput instanceof diffEditorInput_1.DiffEditorInput && activeInput.primary instanceof webviewEditorInput_1.WebviewInput && activeInput.secondary instanceof webviewEditorInput_1.WebviewInput) {
                    this.registerWebviewFromDiffEditorListeners(activeInput);
                }
                this.updateWebviewViewStates(activeInput);
            }));
            this._register(_editorService.onDidVisibleEditorsChange(() => {
                this.updateWebviewViewStates(this._editorService.activeEditor);
            }));
            // This reviver's only job is to activate extensions.
            // This should trigger the real reviver to be registered from the extension host side.
            this._register(_webviewWorkbenchService.registerResolver({
                canResolve: (webview) => {
                    if (webview instanceof customEditorInput_1.CustomEditorInput) {
                        extensionService.activateByEvent(`onCustomEditor:${webview.viewType}`);
                        return false;
                    }
                    const viewType = webviewPanelViewType.toExternal(webview.viewType);
                    if (typeof viewType === 'string') {
                        extensionService.activateByEvent(`onWebviewPanel:${viewType}`);
                    }
                    return false;
                },
                resolveWebview: () => { throw new Error('not implemented'); }
            }));
            workingCopyFileService.registerWorkingCopyProvider((editorResource) => {
                const matchedWorkingCopies = [];
                for (const workingCopy of workingCopyService.workingCopies) {
                    if (workingCopy instanceof MainThreadCustomEditorModel) {
                        if (resources_1.isEqualOrParent(editorResource, workingCopy.editorResource)) {
                            matchedWorkingCopies.push(workingCopy);
                        }
                    }
                }
                return matchedWorkingCopies;
            });
        }
        $createWebviewPanel(extensionData, handle, viewType, title, showOptions, options) {
            const mainThreadShowOptions = Object.create(null);
            if (showOptions) {
                mainThreadShowOptions.preserveFocus = !!showOptions.preserveFocus;
                mainThreadShowOptions.group = editor_1.viewColumnToEditorGroup(this._editorGroupService, showOptions.viewColumn);
            }
            const extension = reviveWebviewExtension(extensionData);
            const webview = this._webviewWorkbenchService.createWebview(handle, webviewPanelViewType.fromExternal(viewType), title, mainThreadShowOptions, reviveWebviewOptions(options), extension);
            this.hookupWebviewEventDelegate(handle, webview);
            this._webviewInputs.add(handle, webview);
            /* __GDPR__
                "webviews:createWebviewPanel" : {
                    "extensionId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this._telemetryService.publicLog('webviews:createWebviewPanel', { extensionId: extension.id.value });
        }
        $disposeWebview(handle) {
            const webview = this.getWebviewInput(handle);
            webview.dispose();
        }
        $setTitle(handle, value) {
            const webview = this.getWebviewInput(handle);
            webview.setName(value);
        }
        $setIconPath(handle, value) {
            const webview = this.getWebviewInput(handle);
            webview.iconPath = reviveWebviewIcon(value);
        }
        $setHtml(handle, value) {
            const webview = this.getWebviewInput(handle);
            webview.webview.html = value;
        }
        $setOptions(handle, options) {
            const webview = this.getWebviewInput(handle);
            webview.webview.contentOptions = reviveWebviewOptions(options);
        }
        $reveal(handle, showOptions) {
            const webview = this.getWebviewInput(handle);
            if (webview.isDisposed()) {
                return;
            }
            const targetGroup = this._editorGroupService.getGroup(editor_1.viewColumnToEditorGroup(this._editorGroupService, showOptions.viewColumn)) || this._editorGroupService.getGroup(webview.group || 0);
            if (targetGroup) {
                this._webviewWorkbenchService.revealWebview(webview, targetGroup, !!showOptions.preserveFocus);
            }
        }
        async $postMessage(handle, message) {
            const webview = this.getWebviewInput(handle);
            webview.webview.postMessage(message);
            return true;
        }
        $registerSerializer(viewType) {
            if (this._revivers.has(viewType)) {
                throw new Error(`Reviver for ${viewType} already registered`);
            }
            this._revivers.set(viewType, this._webviewWorkbenchService.registerResolver({
                canResolve: (webviewInput) => {
                    return webviewInput.viewType === webviewPanelViewType.fromExternal(viewType);
                },
                resolveWebview: async (webviewInput) => {
                    const viewType = webviewPanelViewType.toExternal(webviewInput.viewType);
                    if (!viewType) {
                        webviewInput.webview.html = MainThreadWebviews_1.getWebviewResolvedFailedContent(webviewInput.viewType);
                        return;
                    }
                    const handle = webviewInput.id;
                    this._webviewInputs.add(handle, webviewInput);
                    this.hookupWebviewEventDelegate(handle, webviewInput);
                    let state = undefined;
                    if (webviewInput.webview.state) {
                        try {
                            state = JSON.parse(webviewInput.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewInput.webview.state);
                        }
                    }
                    try {
                        await this._proxy.$deserializeWebviewPanel(handle, viewType, webviewInput.getTitle(), state, editor_1.editorGroupToViewColumn(this._editorGroupService, webviewInput.group || 0), webviewInput.webview.options);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                        webviewInput.webview.html = MainThreadWebviews_1.getWebviewResolvedFailedContent(viewType);
                    }
                }
            }));
        }
        $unregisterSerializer(viewType) {
            const reviver = this._revivers.get(viewType);
            if (!reviver) {
                throw new Error(`No reviver for ${viewType} registered`);
            }
            reviver.dispose();
            this._revivers.delete(viewType);
        }
        $registerTextEditorProvider(extensionData, viewType, options, capabilities) {
            this.registerEditorProvider(1 /* Text */, extensionData, viewType, options, capabilities, true);
        }
        $registerCustomEditorProvider(extensionData, viewType, options, supportsMultipleEditorsPerDocument) {
            this.registerEditorProvider(0 /* Custom */, extensionData, viewType, options, {}, supportsMultipleEditorsPerDocument);
        }
        registerEditorProvider(modelType, extensionData, viewType, options, capabilities, supportsMultipleEditorsPerDocument) {
            if (this._editorProviders.has(viewType)) {
                throw new Error(`Provider for ${viewType} already registered`);
            }
            const extension = reviveWebviewExtension(extensionData);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(this._customEditorService.registerCustomEditorCapabilities(viewType, {
                supportsMultipleEditorsPerDocument
            }));
            disposables.add(this._webviewWorkbenchService.registerResolver({
                canResolve: (webviewInput) => {
                    return webviewInput instanceof customEditorInput_1.CustomEditorInput && webviewInput.viewType === viewType;
                },
                resolveWebview: async (webviewInput, cancellation) => {
                    const handle = webviewInput.id;
                    const resource = webviewInput.resource;
                    this._webviewInputs.add(handle, webviewInput);
                    this.hookupWebviewEventDelegate(handle, webviewInput);
                    webviewInput.webview.options = options;
                    webviewInput.webview.extension = extension;
                    let modelRef;
                    try {
                        modelRef = await this.getOrCreateCustomEditorModel(modelType, resource, viewType, { backupId: webviewInput.backupId }, cancellation);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                        webviewInput.webview.html = MainThreadWebviews_1.getWebviewResolvedFailedContent(viewType);
                        return;
                    }
                    if (cancellation.isCancellationRequested) {
                        modelRef.dispose();
                        return;
                    }
                    webviewInput.webview.onDispose(() => {
                        // If the model is still dirty, make sure we have time to save it
                        if (modelRef.object.isDirty()) {
                            const sub = modelRef.object.onDidChangeDirty(() => {
                                if (!modelRef.object.isDirty()) {
                                    sub.dispose();
                                    modelRef.dispose();
                                }
                            });
                            return;
                        }
                        modelRef.dispose();
                    });
                    if (capabilities.supportsMove) {
                        webviewInput.onMove(async (newResource) => {
                            const oldModel = modelRef;
                            modelRef = await this.getOrCreateCustomEditorModel(modelType, newResource, viewType, {}, cancellation_1.CancellationToken.None);
                            this._proxy.$onMoveCustomEditor(handle, newResource, viewType);
                            oldModel.dispose();
                        });
                    }
                    try {
                        await this._proxy.$resolveWebviewEditor(resource, handle, viewType, webviewInput.getTitle(), editor_1.editorGroupToViewColumn(this._editorGroupService, webviewInput.group || 0), webviewInput.webview.options, cancellation);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                        webviewInput.webview.html = MainThreadWebviews_1.getWebviewResolvedFailedContent(viewType);
                        modelRef.dispose();
                        return;
                    }
                }
            }));
            this._editorProviders.set(viewType, disposables);
            return disposables;
        }
        $unregisterEditorProvider(viewType) {
            const provider = this._editorProviders.get(viewType);
            if (!provider) {
                throw new Error(`No provider for ${viewType} registered`);
            }
            provider.dispose();
            this._editorProviders.delete(viewType);
            this._customEditorService.models.disposeAllModelsForView(viewType);
        }
        async getOrCreateCustomEditorModel(modelType, resource, viewType, options, cancellation) {
            const existingModel = this._customEditorService.models.tryRetain(resource, viewType);
            if (existingModel) {
                return existingModel;
            }
            switch (modelType) {
                case 1 /* Text */:
                    {
                        const model = customTextEditorModel_1.CustomTextEditorModel.create(this._instantiationService, viewType, resource);
                        return this._customEditorService.models.add(resource, viewType, model);
                    }
                case 0 /* Custom */:
                    {
                        const model = MainThreadCustomEditorModel.create(this._instantiationService, this._proxy, viewType, resource, options, () => {
                            return Array.from(this._webviewInputs)
                                .filter(editor => editor instanceof customEditorInput_1.CustomEditorInput && resources_1.isEqual(editor.resource, resource));
                        }, cancellation, this._backupService);
                        return this._customEditorService.models.add(resource, viewType, model);
                    }
            }
        }
        async $onDidEdit(resourceComponents, viewType, editId, label) {
            const model = await this.getCustomEditorModel(resourceComponents, viewType);
            model.pushEdit(editId, label);
        }
        async $onContentChange(resourceComponents, viewType) {
            const model = await this.getCustomEditorModel(resourceComponents, viewType);
            model.changeContent();
        }
        hookupWebviewEventDelegate(handle, input) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(input.webview.onDidClickLink((uri) => this.onDidClickLink(handle, uri)));
            disposables.add(input.webview.onMessage((message) => { this._proxy.$onMessage(handle, message); }));
            disposables.add(input.webview.onMissingCsp((extension) => this._proxy.$onMissingCsp(handle, extension.value)));
            disposables.add(input.webview.onDispose(() => {
                disposables.dispose();
                this._proxy.$onDidDisposeWebviewPanel(handle).finally(() => {
                    this._webviewInputs.delete(handle);
                });
            }));
        }
        registerWebviewFromDiffEditorListeners(diffEditorInput) {
            const primary = diffEditorInput.primary;
            const secondary = diffEditorInput.secondary;
            if (this._webviewFromDiffEditorHandles.has(primary.id) || this._webviewFromDiffEditorHandles.has(secondary.id)) {
                return;
            }
            this._webviewFromDiffEditorHandles.add(primary.id);
            this._webviewFromDiffEditorHandles.add(secondary.id);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(primary.webview.onDidFocus(() => this.updateWebviewViewStates(primary)));
            disposables.add(secondary.webview.onDidFocus(() => this.updateWebviewViewStates(secondary)));
            disposables.add(diffEditorInput.onDispose(() => {
                this._webviewFromDiffEditorHandles.delete(primary.id);
                this._webviewFromDiffEditorHandles.delete(secondary.id);
                lifecycle_1.dispose(disposables);
            }));
        }
        updateWebviewViewStates(activeEditorInput) {
            if (!this._webviewInputs.size) {
                return;
            }
            const viewStates = {};
            const updateViewStatesForInput = (group, topLevelInput, editorInput) => {
                if (!(editorInput instanceof webviewEditorInput_1.WebviewInput)) {
                    return;
                }
                editorInput.updateGroup(group.id);
                const handle = this._webviewInputs.getHandleForInput(editorInput);
                if (handle) {
                    viewStates[handle] = {
                        visible: topLevelInput === group.activeEditor,
                        active: editorInput === activeEditorInput,
                        position: editor_1.editorGroupToViewColumn(this._editorGroupService, group.id),
                    };
                }
            };
            for (const group of this._editorGroupService.groups) {
                for (const input of group.editors) {
                    if (input instanceof diffEditorInput_1.DiffEditorInput) {
                        updateViewStatesForInput(group, input, input.primary);
                        updateViewStatesForInput(group, input, input.secondary);
                    }
                    else {
                        updateViewStatesForInput(group, input, input);
                    }
                }
            }
            if (Object.keys(viewStates).length) {
                this._proxy.$onDidChangeWebviewPanelViewStates(viewStates);
            }
        }
        onDidClickLink(handle, link) {
            const webview = this.getWebviewInput(handle);
            if (this.isSupportedLink(webview, uri_1.URI.parse(link))) {
                this._openerService.open(link, { fromUserGesture: true });
            }
        }
        isSupportedLink(webview, link) {
            if (MainThreadWebviews_1.standardSupportedLinkSchemes.has(link.scheme)) {
                return true;
            }
            if (!platform_1.isWeb && this._productService.urlProtocol === link.scheme) {
                return true;
            }
            return !!webview.webview.contentOptions.enableCommandUris && link.scheme === network_1.Schemas.command;
        }
        getWebviewInput(handle) {
            const webview = this.tryGetWebviewInput(handle);
            if (!webview) {
                throw new Error(`Unknown webview handle:${handle}`);
            }
            return webview;
        }
        tryGetWebviewInput(handle) {
            return this._webviewInputs.getInputForHandle(handle);
        }
        async getCustomEditorModel(resourceComponents, viewType) {
            const resource = uri_1.URI.revive(resourceComponents);
            const model = await this._customEditorService.models.get(resource, viewType);
            if (!model || !(model instanceof MainThreadCustomEditorModel)) {
                throw new Error('Could not find model for webview editor');
            }
            return model;
        }
        static getWebviewResolvedFailedContent(viewType) {
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
			</head>
			<body>${nls_1.localize('errorMessage', "An error occurred while loading view: {0}", strings_1.escape(viewType))}</body>
		</html>`;
        }
    };
    MainThreadWebviews.standardSupportedLinkSchemes = new Set([
        network_1.Schemas.http,
        network_1.Schemas.https,
        network_1.Schemas.mailto,
        network_1.Schemas.vscode,
        'vscode-insider',
    ]);
    MainThreadWebviews = MainThreadWebviews_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHostProtocol.MainContext.MainThreadWebviews),
        __param(1, extensions_1.IExtensionService),
        __param(2, workingCopyService_1.IWorkingCopyService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, customEditor_1.ICustomEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, editorService_1.IEditorService),
        __param(7, opener_1.IOpenerService),
        __param(8, productService_1.IProductService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, backup_1.IBackupFileService)
    ], MainThreadWebviews);
    exports.MainThreadWebviews = MainThreadWebviews;
    function reviveWebviewExtension(extensionData) {
        return { id: extensionData.id, location: uri_1.URI.revive(extensionData.location) };
    }
    function reviveWebviewOptions(options) {
        return Object.assign(Object.assign({}, options), { allowScripts: options.enableScripts, localResourceRoots: Array.isArray(options.localResourceRoots) ? options.localResourceRoots.map(r => uri_1.URI.revive(r)) : undefined });
    }
    function reviveWebviewIcon(value) {
        return value
            ? { light: uri_1.URI.revive(value.light), dark: uri_1.URI.revive(value.dark) }
            : undefined;
    }
    var HotExitState;
    (function (HotExitState) {
        let Type;
        (function (Type) {
            Type[Type["Allowed"] = 0] = "Allowed";
            Type[Type["NotAllowed"] = 1] = "NotAllowed";
            Type[Type["Pending"] = 2] = "Pending";
        })(Type = HotExitState.Type || (HotExitState.Type = {}));
        HotExitState.Allowed = Object.freeze({ type: 0 /* Allowed */ });
        HotExitState.NotAllowed = Object.freeze({ type: 1 /* NotAllowed */ });
        class Pending {
            constructor(operation) {
                this.operation = operation;
                this.type = 2 /* Pending */;
            }
        }
        HotExitState.Pending = Pending;
    })(HotExitState || (HotExitState = {}));
    let MainThreadCustomEditorModel = class MainThreadCustomEditorModel extends lifecycle_1.Disposable {
        constructor(_proxy, _viewType, _editorResource, fromBackup, _editable, _getEditors, workingCopyService, _labelService, _fileService, _undoService) {
            super();
            this._proxy = _proxy;
            this._viewType = _viewType;
            this._editorResource = _editorResource;
            this._editable = _editable;
            this._getEditors = _getEditors;
            this._labelService = _labelService;
            this._fileService = _fileService;
            this._undoService = _undoService;
            this._fromBackup = false;
            this._hotExitState = HotExitState.Allowed;
            this._currentEditIndex = -1;
            this._savePoint = -1;
            this._edits = [];
            this._isDirtyFromContentChange = false;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._fromBackup = fromBackup;
            if (_editable) {
                this._register(workingCopyService.registerWorkingCopy(this));
            }
        }
        static async create(instantiationService, proxy, viewType, resource, options, getEditors, cancellation, _backupFileService) {
            const { editable } = await proxy.$createCustomDocument(resource, viewType, options.backupId, cancellation);
            return instantiationService.createInstance(MainThreadCustomEditorModel, proxy, viewType, resource, !!options.backupId, editable, getEditors);
        }
        get editorResource() {
            return this._editorResource;
        }
        dispose() {
            if (this._editable) {
                this._undoService.removeElements(this._editorResource);
            }
            this._proxy.$disposeCustomDocument(this._editorResource, this._viewType);
            super.dispose();
        }
        //#region IWorkingCopy
        get resource() {
            // Make sure each custom editor has a unique resource for backup and edits
            return MainThreadCustomEditorModel.toWorkingCopyResource(this._viewType, this._editorResource);
        }
        static toWorkingCopyResource(viewType, resource) {
            return uri_1.URI.from({
                scheme: network_1.Schemas.vscodeCustomEditor,
                authority: viewType,
                path: resource.path,
                query: JSON.stringify(resource.toJSON()),
            });
        }
        get name() {
            return path_1.basename(this._labelService.getUriLabel(this._editorResource));
        }
        get capabilities() {
            return 0;
        }
        isDirty() {
            if (this._isDirtyFromContentChange) {
                return true;
            }
            if (this._edits.length > 0) {
                return this._savePoint !== this._currentEditIndex;
            }
            return this._fromBackup;
        }
        //#endregion
        isReadonly() {
            return !this._editable;
        }
        get viewType() {
            return this._viewType;
        }
        get backupId() {
            return this._backupId;
        }
        pushEdit(editId, label) {
            if (!this._editable) {
                throw new Error('Document is not editable');
            }
            this.change(() => {
                this.spliceEdits(editId);
                this._currentEditIndex = this._edits.length - 1;
            });
            this._undoService.pushElement({
                type: 0 /* Resource */,
                resource: this._editorResource,
                label: label !== null && label !== void 0 ? label : nls_1.localize('defaultEditLabel', "Edit"),
                undo: () => this.undo(),
                redo: () => this.redo(),
            });
        }
        changeContent() {
            this.change(() => {
                this._isDirtyFromContentChange = true;
            });
        }
        async undo() {
            if (!this._editable) {
                return;
            }
            if (this._currentEditIndex < 0) {
                // nothing to undo
                return;
            }
            const undoneEdit = this._edits[this._currentEditIndex];
            this.change(() => {
                --this._currentEditIndex;
            });
            await this._proxy.$undo(this._editorResource, this.viewType, undoneEdit, this.isDirty());
        }
        async redo() {
            if (!this._editable) {
                return;
            }
            if (this._currentEditIndex >= this._edits.length - 1) {
                // nothing to redo
                return;
            }
            const redoneEdit = this._edits[this._currentEditIndex + 1];
            this.change(() => {
                ++this._currentEditIndex;
            });
            await this._proxy.$redo(this._editorResource, this.viewType, redoneEdit, this.isDirty());
        }
        spliceEdits(editToInsert) {
            const start = this._currentEditIndex + 1;
            const toRemove = this._edits.length - this._currentEditIndex;
            const removedEdits = typeof editToInsert === 'number'
                ? this._edits.splice(start, toRemove, editToInsert)
                : this._edits.splice(start, toRemove);
            if (removedEdits.length) {
                this._proxy.$disposeEdits(this._editorResource, this._viewType, removedEdits);
            }
        }
        change(makeEdit) {
            const wasDirty = this.isDirty();
            makeEdit();
            this._onDidChangeContent.fire();
            if (this.isDirty() !== wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        async revert(_options) {
            if (!this._editable) {
                return;
            }
            if (this._currentEditIndex === this._savePoint && !this._isDirtyFromContentChange && !this._fromBackup) {
                return;
            }
            this._proxy.$revert(this._editorResource, this.viewType, cancellation_1.CancellationToken.None);
            this.change(() => {
                this._isDirtyFromContentChange = false;
                this._fromBackup = false;
                this._currentEditIndex = this._savePoint;
                this.spliceEdits();
            });
        }
        async save(options) {
            return !!await this.saveCustomEditor(options);
        }
        async saveCustomEditor(_options) {
            var _a;
            if (!this._editable) {
                return undefined;
            }
            // TODO: handle save untitled case
            const savePromise = async_1.createCancelablePromise(token => this._proxy.$onSave(this._editorResource, this.viewType, token));
            (_a = this._ongoingSave) === null || _a === void 0 ? void 0 : _a.cancel();
            this._ongoingSave = savePromise;
            this.change(() => {
                this._isDirtyFromContentChange = false;
                this._savePoint = this._currentEditIndex;
                this._fromBackup = false;
            });
            try {
                await savePromise;
            }
            finally {
                if (this._ongoingSave === savePromise) {
                    this._ongoingSave = undefined;
                }
            }
            return this._editorResource;
        }
        async saveCustomEditorAs(resource, targetResource, _options) {
            if (this._editable) {
                // TODO: handle cancellation
                await async_1.createCancelablePromise(token => this._proxy.$onSaveAs(this._editorResource, this.viewType, targetResource, token));
                this.change(() => {
                    this._savePoint = this._currentEditIndex;
                });
                return true;
            }
            else {
                // Since the editor is readonly, just copy the file over
                await this._fileService.copy(resource, targetResource, false /* overwrite */);
                return true;
            }
        }
        async backup() {
            const editors = this._getEditors();
            if (!editors.length) {
                throw new Error('No editors found for resource, cannot back up');
            }
            const primaryEditor = editors[0];
            const backupData = {
                meta: {
                    viewType: this.viewType,
                    editorResource: this._editorResource,
                    backupId: '',
                    extension: primaryEditor.extension ? {
                        id: primaryEditor.extension.id.value,
                        location: primaryEditor.extension.location,
                    } : undefined,
                    webview: {
                        id: primaryEditor.id,
                        options: primaryEditor.webview.options,
                        state: primaryEditor.webview.state,
                    }
                }
            };
            if (!this._editable) {
                return backupData;
            }
            if (this._hotExitState.type === 2 /* Pending */) {
                this._hotExitState.operation.cancel();
            }
            const pendingState = new HotExitState.Pending(async_1.createCancelablePromise(token => this._proxy.$backup(this._editorResource.toJSON(), this.viewType, token)));
            this._hotExitState = pendingState;
            try {
                const backupId = await pendingState.operation;
                // Make sure state has not changed in the meantime
                if (this._hotExitState === pendingState) {
                    this._hotExitState = HotExitState.Allowed;
                    backupData.meta.backupId = backupId;
                    this._backupId = backupId;
                }
            }
            catch (e) {
                if (errors_1.isPromiseCanceledError(e)) {
                    // This is expected
                    throw e;
                }
                // Otherwise it could be a real error. Make sure state has not changed in the meantime.
                if (this._hotExitState === pendingState) {
                    this._hotExitState = HotExitState.NotAllowed;
                }
            }
            if (this._hotExitState === HotExitState.Allowed) {
                return backupData;
            }
            throw new Error('Cannot back up in this state');
        }
    };
    MainThreadCustomEditorModel = __decorate([
        __param(6, workingCopyService_1.IWorkingCopyService),
        __param(7, label_1.ILabelService),
        __param(8, files_1.IFileService),
        __param(9, undoRedo_1.IUndoRedoService)
    ], MainThreadCustomEditorModel);
});
//# __sourceMappingURL=mainThreadWebview.js.map