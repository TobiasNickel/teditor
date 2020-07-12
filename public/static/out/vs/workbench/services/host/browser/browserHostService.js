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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/windows/common/windows", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/base/browser/event", "vs/base/common/decorators", "vs/base/common/extpath", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, host_1, extensions_1, layoutService_1, editorService_1, configuration_1, windows_1, editor_1, files_1, label_1, dom_1, lifecycle_1, environmentService_1, event_2, decorators_1, extpath_1, workspaceEditing_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostService = void 0;
    let BrowserHostService = class BrowserHostService extends lifecycle_1.Disposable {
        constructor(layoutService, editorService, configurationService, fileService, labelService, environmentService, instantiationService) {
            super();
            this.layoutService = layoutService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            if (environmentService.options && environmentService.options.workspaceProvider) {
                this.workspaceProvider = environmentService.options.workspaceProvider;
            }
            else {
                this.workspaceProvider = new class {
                    constructor() {
                        this.workspace = undefined;
                    }
                    async open() { }
                };
            }
        }
        get onDidChangeFocus() {
            const focusTracker = this._register(dom_1.trackFocus(window));
            return event_1.Event.latch(event_1.Event.any(event_1.Event.map(focusTracker.onDidFocus, () => this.hasFocus), event_1.Event.map(focusTracker.onDidBlur, () => this.hasFocus), event_1.Event.map(event_2.domEvent(window.document, 'visibilitychange'), () => this.hasFocus)));
        }
        get hasFocus() {
            return document.hasFocus();
        }
        async hadLastFocus() {
            return true;
        }
        async focus() {
            window.focus();
        }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        async doOpenWindow(toOpen, options) {
            const payload = this.preservePayload();
            const fileOpenables = [];
            const foldersToAdd = [];
            for (const openable of toOpen) {
                openable.label = openable.label || this.getRecentLabel(openable);
                // Folder
                if (windows_1.isFolderToOpen(openable)) {
                    if (options === null || options === void 0 ? void 0 : options.addMode) {
                        foldersToAdd.push(({ uri: openable.folderUri }));
                    }
                    else {
                        this.workspaceProvider.open({ folderUri: openable.folderUri }, { reuse: this.shouldReuse(options, false /* no file */), payload });
                    }
                }
                // Workspace
                else if (windows_1.isWorkspaceToOpen(openable)) {
                    this.workspaceProvider.open({ workspaceUri: openable.workspaceUri }, { reuse: this.shouldReuse(options, false /* no file */), payload });
                }
                // File (handled later in bulk)
                else if (windows_1.isFileToOpen(openable)) {
                    fileOpenables.push(openable);
                }
            }
            // Handle Folders to Add
            if (foldersToAdd.length > 0) {
                this.instantiationService.invokeFunction(accessor => {
                    const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
                    workspaceEditingService.addFolders(foldersToAdd);
                });
            }
            // Handle Files
            if (fileOpenables.length > 0) {
                // Support diffMode
                if ((options === null || options === void 0 ? void 0 : options.diffMode) && fileOpenables.length === 2) {
                    const editors = await editor_1.pathsToEditors(fileOpenables, this.fileService);
                    if (editors.length !== 2 || !editors[0].resource || !editors[1].resource) {
                        return; // invalid resources
                    }
                    // Same Window: open via editor service in current window
                    if (this.shouldReuse(options, true /* file */)) {
                        this.editorService.openEditor({
                            leftResource: editors[0].resource,
                            rightResource: editors[1].resource
                        });
                    }
                    // New Window: open into empty window
                    else {
                        const environment = new Map();
                        environment.set('diffFileSecondary', editors[0].resource.toString());
                        environment.set('diffFilePrimary', editors[1].resource.toString());
                        this.workspaceProvider.open(undefined, { payload: Array.from(environment.entries()) });
                    }
                }
                // Just open normally
                else {
                    for (const openable of fileOpenables) {
                        // Same Window: open via editor service in current window
                        if (this.shouldReuse(options, true /* file */)) {
                            let openables = [];
                            // Support: --goto parameter to open on line/col
                            if (options === null || options === void 0 ? void 0 : options.gotoLineMode) {
                                const pathColumnAware = extpath_1.parseLineAndColumnAware(openable.fileUri.path);
                                openables = [{
                                        fileUri: openable.fileUri.with({ path: pathColumnAware.path }),
                                        lineNumber: pathColumnAware.line,
                                        columnNumber: pathColumnAware.column
                                    }];
                            }
                            else {
                                openables = [openable];
                            }
                            this.editorService.openEditors(await editor_1.pathsToEditors(openables, this.fileService));
                        }
                        // New Window: open into empty window
                        else {
                            const environment = new Map();
                            environment.set('openFile', openable.fileUri.toString());
                            if (options === null || options === void 0 ? void 0 : options.gotoLineMode) {
                                environment.set('gotoLineMode', 'true');
                            }
                            this.workspaceProvider.open(undefined, { payload: Array.from(environment.entries()) });
                        }
                    }
                }
                // Support wait mode
                const waitMarkerFileURI = options === null || options === void 0 ? void 0 : options.waitMarkerFileURI;
                if (waitMarkerFileURI) {
                    (async () => {
                        // Wait for the resources to be closed in the editor...
                        await this.editorService.whenClosed(fileOpenables.map(openable => ({ resource: openable.fileUri })), { waitForSaved: true });
                        // ...before deleting the wait marker file
                        await this.fileService.del(waitMarkerFileURI);
                    })();
                }
            }
        }
        preservePayload() {
            // Selectively copy payload: for now only extension debugging properties are considered
            let newPayload = undefined;
            if (this.environmentService.extensionDevelopmentLocationURI) {
                newPayload = new Array();
                newPayload.push(['extensionDevelopmentPath', this.environmentService.extensionDevelopmentLocationURI.toString()]);
                if (this.environmentService.debugExtensionHost.debugId) {
                    newPayload.push(['debugId', this.environmentService.debugExtensionHost.debugId]);
                }
                if (this.environmentService.debugExtensionHost.port) {
                    newPayload.push(['inspect-brk-extensions', String(this.environmentService.debugExtensionHost.port)]);
                }
            }
            return newPayload;
        }
        getRecentLabel(openable) {
            if (windows_1.isFolderToOpen(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: true });
            }
            if (windows_1.isWorkspaceToOpen(openable)) {
                return this.labelService.getWorkspaceLabel({ id: '', configPath: openable.workspaceUri }, { verbose: true });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        shouldReuse(options = Object.create(null), isFile) {
            if (options.waitMarkerFileURI) {
                return true; // always handle --wait in same window
            }
            const windowConfig = this.configurationService.getValue('window');
            const openInNewWindowConfig = isFile ? ((windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFilesInNewWindow) || 'off' /* default */) : ((windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFoldersInNewWindow) || 'default' /* default */);
            let openInNewWindow = (options.preferNewWindow || !!options.forceNewWindow) && !options.forceReuseWindow;
            if (!options.forceNewWindow && !options.forceReuseWindow && (openInNewWindowConfig === 'on' || openInNewWindowConfig === 'off')) {
                openInNewWindow = (openInNewWindowConfig === 'on');
            }
            return !openInNewWindow;
        }
        async doOpenEmptyWindow(options) {
            this.workspaceProvider.open(undefined, { reuse: options === null || options === void 0 ? void 0 : options.forceReuseWindow });
        }
        async toggleFullScreen() {
            const target = this.layoutService.container;
            // Chromium
            if (document.fullscreen !== undefined) {
                if (!document.fullscreen) {
                    try {
                        return await target.requestFullscreen();
                    }
                    catch (error) {
                        console.warn('Toggle Full Screen failed'); // https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
                    }
                }
                else {
                    try {
                        return await document.exitFullscreen();
                    }
                    catch (error) {
                        console.warn('Exit Full Screen failed');
                    }
                }
            }
            // Safari and Edge 14 are all using webkit prefix
            if (document.webkitIsFullScreen !== undefined) {
                try {
                    if (!document.webkitIsFullScreen) {
                        target.webkitRequestFullscreen(); // it's async, but doesn't return a real promise.
                    }
                    else {
                        document.webkitExitFullscreen(); // it's async, but doesn't return a real promise.
                    }
                }
                catch (_a) {
                    console.warn('Enter/Exit Full Screen failed');
                }
            }
        }
        async restart() {
            this.reload();
        }
        async reload() {
            window.location.reload();
        }
    };
    __decorate([
        decorators_1.memoize
    ], BrowserHostService.prototype, "onDidChangeFocus", null);
    BrowserHostService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, editorService_1.IEditorService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, files_1.IFileService),
        __param(4, label_1.ILabelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService)
    ], BrowserHostService);
    exports.BrowserHostService = BrowserHostService;
    extensions_1.registerSingleton(host_1.IHostService, BrowserHostService, true);
});
//# __sourceMappingURL=browserHostService.js.map