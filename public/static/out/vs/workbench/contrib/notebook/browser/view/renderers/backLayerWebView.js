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
define(["require", "exports", "vs/base/common/amd", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/common/environment", "vs/platform/opener/common/opener", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/common/webviewUri", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/notebook/browser/view/renderers/webviewPreloads", "vs/base/common/network", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/base/common/buffer", "vs/base/common/mime"], function (require, exports, amd_1, event_1, lifecycle_1, path, platform_1, uri_1, UUID, environment_1, opener_1, constants_1, notebookCommon_1, notebookService_1, webview_1, webviewUri_1, environmentService_1, resources_1, workspace_1, webviewPreloads_1, network_1, dialogs_1, files_1, buffer_1, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackLayerWebView = void 0;
    function html(strings, ...values) {
        let str = '';
        strings.forEach((string, i) => {
            str += string + (values[i] || '');
        });
        return str;
    }
    let version = 0;
    let BackLayerWebView = class BackLayerWebView extends lifecycle_1.Disposable {
        constructor(notebookEditor, id, documentUri, webviewService, openerService, notebookService, environmentService, contextService, workbenchEnvironmentService, fileDialogService, fileService) {
            super();
            this.notebookEditor = notebookEditor;
            this.id = id;
            this.documentUri = documentUri;
            this.webviewService = webviewService;
            this.openerService = openerService;
            this.notebookService = notebookService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.fileDialogService = fileDialogService;
            this.fileService = fileService;
            this.insetMapping = new Map();
            this.hiddenInsetMapping = new Set();
            this.reversedInsetMapping = new Map();
            this.preloadsCache = new Map();
            this.localResourceRootsCache = undefined;
            this.rendererRootsCache = [];
            this.kernelRootsCache = [];
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._disposed = false;
            this.element = document.createElement('div');
            this.element.style.width = `calc(100% - ${constants_1.CELL_MARGIN * 2 + constants_1.CELL_RUN_GUTTER}px)`;
            this.element.style.height = '1400px';
            this.element.style.position = 'absolute';
            this.element.style.margin = `0px 0 0px ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px`;
        }
        generateContent(outputNodePadding, coreDependencies, baseUrl) {
            return html `
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<base href="${baseUrl}/"/>
				<style>
					#container > div > div {
						width: 100%;
						padding: ${outputNodePadding}px;
						box-sizing: border-box;
						background-color: var(--vscode-notebook-outputContainerBackgroundColor);
					}
					body {
						padding: 0px;
						height: 100%;
						width: 100%;
					}
				</style>
			</head>
			<body style="overflow: hidden;">
				<script>
					self.require = {};
				</script>
				${coreDependencies}
				<div id="__vscode_preloads"></div>
				<div id='container' class="widgetarea" style="position: absolute;width:100%;top: 0px"></div>
				<script>${webviewPreloads_1.preloadsScriptStr(outputNodePadding)}</script>
			</body>
		</html>`;
        }
        resolveOutputId(id) {
            const output = this.reversedInsetMapping.get(id);
            if (!output) {
                return;
            }
            return { cell: this.insetMapping.get(output).cell, output };
        }
        async createWebview() {
            const pathsPath = amd_1.getPathFromAmdModule(require, 'vs/loader.js');
            const loader = webviewUri_1.asWebviewUri(this.workbenchEnvironmentService, this.id, uri_1.URI.file(pathsPath));
            let coreDependencies = '';
            let resolveFunc;
            this._initalized = new Promise((resolve, reject) => {
                resolveFunc = resolve;
            });
            const baseUrl = webviewUri_1.asWebviewUri(this.workbenchEnvironmentService, this.id, resources_1.dirname(this.documentUri));
            if (!platform_1.isWeb) {
                coreDependencies = `<script src="${loader}"></script>`;
                const htmlContent = this.generateContent(8, coreDependencies, baseUrl.toString());
                this.initialize(htmlContent);
                resolveFunc();
            }
            else {
                fetch(pathsPath).then(async (response) => {
                    if (response.status !== 200) {
                        throw new Error(response.statusText);
                    }
                    const loaderJs = await response.text();
                    coreDependencies = `
<script>
${loaderJs}
</script>
`;
                    const htmlContent = this.generateContent(8, coreDependencies, baseUrl.toString());
                    this.initialize(htmlContent);
                    resolveFunc();
                });
            }
            await this._initalized;
        }
        async initialize(content) {
            this.webview = this._createInset(this.webviewService, content);
            this.webview.mountTo(this.element);
            this._register(this.webview);
            this._register(this.webview.onDidClickLink(link => {
                if (!link) {
                    return;
                }
                if (opener_1.matchesScheme(link, network_1.Schemas.http) || opener_1.matchesScheme(link, network_1.Schemas.https) || opener_1.matchesScheme(link, network_1.Schemas.mailto)
                    || opener_1.matchesScheme(link, network_1.Schemas.command)) {
                    this.openerService.open(link, { fromUserGesture: true });
                }
            }));
            this._register(this.webview.onDidReload(() => {
                this.preloadsCache.clear();
                for (const [output, inset] of this.insetMapping.entries()) {
                    this.updateRendererPreloads(inset.preloads);
                    this._sendMessageToWebview(Object.assign(Object.assign({}, inset.cachedCreation), { initiallyHidden: this.hiddenInsetMapping.has(output) }));
                }
            }));
            this._register(this.webview.onMessage((data) => {
                var _a, _b;
                if (data.__vscode_notebook_message) {
                    if (data.type === 'dimension') {
                        let height = data.data.height;
                        let outputHeight = height;
                        const info = this.resolveOutputId(data.id);
                        if (info) {
                            const { cell, output } = info;
                            let outputIndex = cell.outputs.indexOf(output);
                            cell.updateOutputHeight(outputIndex, outputHeight);
                            this.notebookEditor.layoutNotebookCell(cell, cell.layoutInfo.totalHeight);
                        }
                    }
                    else if (data.type === 'mouseenter') {
                        const info = this.resolveOutputId(data.id);
                        if (info) {
                            const { cell } = info;
                            cell.outputIsHovered = true;
                        }
                    }
                    else if (data.type === 'mouseleave') {
                        const info = this.resolveOutputId(data.id);
                        if (info) {
                            const { cell } = info;
                            cell.outputIsHovered = false;
                        }
                    }
                    else if (data.type === 'scroll-ack') {
                        // const date = new Date();
                        // const top = data.data.top;
                        // console.log('ack top ', top, ' version: ', data.version, ' - ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                    }
                    else if (data.type === 'did-scroll-wheel') {
                        this.notebookEditor.triggerScroll(Object.assign(Object.assign({}, data.payload), { preventDefault: () => { }, stopPropagation: () => { } }));
                    }
                    else if (data.type === 'focus-editor') {
                        const info = this.resolveOutputId(data.id);
                        if (info) {
                            if (data.focusNext) {
                                const idx = (_a = this.notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(info.cell);
                                if (typeof idx !== 'number') {
                                    return;
                                }
                                const newCell = (_b = this.notebookEditor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
                                if (!newCell) {
                                    return;
                                }
                                this.notebookEditor.focusNotebookCell(newCell, 'editor');
                            }
                            else {
                                this.notebookEditor.focusNotebookCell(info.cell, 'editor');
                            }
                        }
                    }
                    else if (data.type === 'clicked-data-url') {
                        this._onDidClickDataLink(data);
                    }
                    return;
                }
                this._onMessage.fire(data);
            }));
        }
        async _onDidClickDataLink(event) {
            const [splitStart, splitData] = event.data.split(';base64,');
            if (!splitData || !splitStart) {
                return;
            }
            const defaultDir = resources_1.dirname(this.documentUri);
            let defaultName;
            if (event.downloadName) {
                defaultName = event.downloadName;
            }
            else {
                const mimeType = splitStart.replace(/^data:/, '');
                const candidateExtension = mimeType && mime_1.getExtensionForMimeType(mimeType);
                defaultName = candidateExtension ? `download${candidateExtension}` : 'download';
            }
            const defaultUri = resources_1.joinPath(defaultDir, defaultName);
            const newFileUri = await this.fileDialogService.showSaveDialog({
                defaultUri
            });
            if (!newFileUri) {
                return;
            }
            const decoded = atob(splitData);
            const typedArray = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) {
                typedArray[i] = decoded.charCodeAt(i);
            }
            const buff = buffer_1.VSBuffer.wrap(typedArray);
            await this.fileService.writeFile(newFileUri, buff);
            await this.openerService.open(newFileUri);
        }
        _createInset(webviewService, content) {
            const rootPath = uri_1.URI.file(path.dirname(amd_1.getPathFromAmdModule(require, '')));
            const workspaceFolders = this.contextService.getWorkspace().folders.map(x => x.uri);
            this.localResourceRootsCache = [...this.notebookService.getNotebookProviderResourceRoots(), ...workspaceFolders, rootPath];
            const webview = webviewService.createWebviewElement(this.id, {
                enableFindWidget: false,
            }, {
                allowMultipleAPIAcquire: true,
                allowScripts: true,
                localResourceRoots: this.localResourceRootsCache
            }, undefined);
            let resolveFunc;
            this._loaded = new Promise((resolve, reject) => {
                resolveFunc = resolve;
            });
            let dispose = webview.onMessage((data) => {
                if (data.__vscode_notebook_message && data.type === 'initialized') {
                    resolveFunc();
                    dispose.dispose();
                }
            });
            webview.html = content;
            return webview;
        }
        shouldUpdateInset(cell, output, cellTop) {
            if (this._disposed) {
                return;
            }
            let outputCache = this.insetMapping.get(output);
            let outputIndex = cell.outputs.indexOf(output);
            let outputOffset = cellTop + cell.getOutputOffset(outputIndex);
            if (this.hiddenInsetMapping.has(output)) {
                return true;
            }
            if (outputOffset === outputCache.cachedCreation.top) {
                return false;
            }
            return true;
        }
        updateViewScrollTop(top, items) {
            if (this._disposed) {
                return;
            }
            let widgets = items.map(item => {
                let outputCache = this.insetMapping.get(item.output);
                let id = outputCache.outputId;
                let outputIndex = item.cell.outputs.indexOf(item.output);
                let outputOffset = item.cellTop + item.cell.getOutputOffset(outputIndex);
                outputCache.cachedCreation.top = outputOffset;
                this.hiddenInsetMapping.delete(item.output);
                return {
                    id: id,
                    top: outputOffset,
                    left: 0
                };
            });
            this._sendMessageToWebview({
                top,
                type: 'view-scroll',
                version: version++,
                widgets: widgets
            });
        }
        createInset(cell, output, cellTop, offset, shadowContent, preloads) {
            var _a, _b;
            if (this._disposed) {
                return;
            }
            this.updateRendererPreloads(preloads);
            let initialTop = cellTop + offset;
            if (this.insetMapping.has(output)) {
                let outputCache = this.insetMapping.get(output);
                if (outputCache) {
                    this.hiddenInsetMapping.delete(output);
                    this._sendMessageToWebview({
                        type: 'showOutput',
                        id: outputCache.outputId,
                        top: initialTop
                    });
                    return;
                }
            }
            let outputId = output.outputKind === notebookCommon_1.CellOutputKind.Rich ? output.outputId : UUID.generateUuid();
            let apiNamespace;
            if (output.outputKind === notebookCommon_1.CellOutputKind.Rich && output.pickedMimeTypeIndex !== undefined) {
                const pickedMimeTypeRenderer = (_a = output.orderedMimeTypes) === null || _a === void 0 ? void 0 : _a[output.pickedMimeTypeIndex];
                if (pickedMimeTypeRenderer === null || pickedMimeTypeRenderer === void 0 ? void 0 : pickedMimeTypeRenderer.rendererId) {
                    apiNamespace = (_b = this.notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId)) === null || _b === void 0 ? void 0 : _b.id;
                }
            }
            let message = {
                type: 'html',
                content: shadowContent,
                id: cell.id,
                apiNamespace,
                outputId: outputId,
                top: initialTop,
                left: 0
            };
            this._sendMessageToWebview(message);
            this.insetMapping.set(output, { outputId: outputId, cell: cell, preloads, cachedCreation: message });
            this.hiddenInsetMapping.delete(output);
            this.reversedInsetMapping.set(outputId, output);
        }
        removeInset(output) {
            if (this._disposed) {
                return;
            }
            let outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return;
            }
            let id = outputCache.outputId;
            this._sendMessageToWebview({
                type: 'clearOutput',
                apiNamespace: outputCache.cachedCreation.apiNamespace,
                cellUri: outputCache.cell.uri.toString(),
                id: id
            });
            this.insetMapping.delete(output);
            this.reversedInsetMapping.delete(id);
        }
        hideInset(output) {
            if (this._disposed) {
                return;
            }
            let outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return;
            }
            let id = outputCache.outputId;
            this.hiddenInsetMapping.add(output);
            this._sendMessageToWebview({
                type: 'hideOutput',
                id: id
            });
        }
        clearInsets() {
            if (this._disposed) {
                return;
            }
            this._sendMessageToWebview({
                type: 'clear'
            });
            this.insetMapping = new Map();
            this.reversedInsetMapping = new Map();
        }
        focusOutput(cellId) {
            if (this._disposed) {
                return;
            }
            this.webview.focus();
            setTimeout(() => {
                this._sendMessageToWebview({
                    type: 'focus-output',
                    id: cellId
                });
            }, 50);
        }
        async updateKernelPreloads(extensionLocations, preloads) {
            if (this._disposed) {
                return;
            }
            await this._loaded;
            let resources = [];
            preloads = preloads.map(preload => {
                if (this.environmentService.isExtensionDevelopment && (preload.scheme === 'http' || preload.scheme === 'https')) {
                    return preload;
                }
                return webviewUri_1.asWebviewUri(this.workbenchEnvironmentService, this.id, preload);
            });
            preloads.forEach(e => {
                if (!this.preloadsCache.has(e.toString())) {
                    resources.push({ uri: e.toString() });
                    this.preloadsCache.set(e.toString(), true);
                }
            });
            if (!resources.length) {
                return;
            }
            this.kernelRootsCache = [...extensionLocations, ...this.kernelRootsCache];
            this._updatePreloads(resources, 'kernel');
        }
        async updateRendererPreloads(preloads) {
            if (this._disposed) {
                return;
            }
            await this._loaded;
            let resources = [];
            let extensionLocations = [];
            preloads.forEach(preload => {
                let rendererInfo = this.notebookService.getRendererInfo(preload);
                if (rendererInfo) {
                    let preloadResources = rendererInfo.preloads.map(preloadResource => {
                        if (this.environmentService.isExtensionDevelopment && (preloadResource.scheme === 'http' || preloadResource.scheme === 'https')) {
                            return preloadResource;
                        }
                        return webviewUri_1.asWebviewUri(this.workbenchEnvironmentService, this.id, preloadResource);
                    });
                    extensionLocations.push(rendererInfo.extensionLocation);
                    preloadResources.forEach(e => {
                        if (!this.preloadsCache.has(e.toString())) {
                            resources.push({ uri: e.toString() });
                            this.preloadsCache.set(e.toString(), true);
                        }
                    });
                }
            });
            if (!resources.length) {
                return;
            }
            this.rendererRootsCache = extensionLocations;
            this._updatePreloads(resources, 'renderer');
        }
        _updatePreloads(resources, source) {
            const mixedResourceRoots = [...(this.localResourceRootsCache || []), ...this.rendererRootsCache, ...this.kernelRootsCache];
            this.webview.localResourcesRoot = mixedResourceRoots;
            this._sendMessageToWebview({
                type: 'preload',
                resources: resources,
                source: source
            });
        }
        _sendMessageToWebview(message) {
            this.webview.postMessage(message);
        }
        clearPreloadsCache() {
            this.preloadsCache.clear();
        }
        dispose() {
            this._disposed = true;
            super.dispose();
        }
    };
    BackLayerWebView = __decorate([
        __param(3, webview_1.IWebviewService),
        __param(4, opener_1.IOpenerService),
        __param(5, notebookService_1.INotebookService),
        __param(6, environment_1.IEnvironmentService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, dialogs_1.IFileDialogService),
        __param(10, files_1.IFileService)
    ], BackLayerWebView);
    exports.BackLayerWebView = BackLayerWebView;
});
//# __sourceMappingURL=backLayerWebView.js.map