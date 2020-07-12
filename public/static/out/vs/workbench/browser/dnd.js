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
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/base/common/path", "vs/base/common/resources", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/base/browser/dnd", "vs/base/common/labels", "vs/base/common/mime", "vs/base/common/platform", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/types", "vs/workbench/services/host/browser/host", "vs/base/browser/browser", "vs/workbench/services/backup/common/backup", "vs/base/common/event"], function (require, exports, workspaces_1, path_1, resources_1, files_1, uri_1, textfiles_1, network_1, dnd_1, labels_1, mime_1, platform_1, editorBrowser_1, editorService_1, lifecycle_1, dom_1, workspaceEditing_1, types_1, host_1, browser_1, backup_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toggleDropEffect = exports.CompositeDragAndDropObserver = exports.DraggedViewIdentifier = exports.DraggedCompositeIdentifier = exports.CompositeDragAndDropData = exports.containsDragType = exports.DragAndDropObserver = exports.LocalSelectionTransfer = exports.fillResourceDataTransfers = exports.ResourcesDropHandler = exports.extractResources = exports.CodeDataTransfers = exports.DraggedEditorGroupIdentifier = exports.DraggedEditorIdentifier = void 0;
    class DraggedEditorIdentifier {
        constructor(_identifier) {
            this._identifier = _identifier;
        }
        get identifier() {
            return this._identifier;
        }
    }
    exports.DraggedEditorIdentifier = DraggedEditorIdentifier;
    class DraggedEditorGroupIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedEditorGroupIdentifier = DraggedEditorGroupIdentifier;
    exports.CodeDataTransfers = {
        EDITORS: 'CodeEditors',
        FILES: 'CodeFiles'
    };
    function extractResources(e, externalOnly) {
        const resources = [];
        if (e.dataTransfer && e.dataTransfer.types.length > 0) {
            // Check for window-to-window DND
            if (!externalOnly) {
                // Data Transfer: Code Editors
                const rawEditorsData = e.dataTransfer.getData(exports.CodeDataTransfers.EDITORS);
                if (rawEditorsData) {
                    try {
                        const draggedEditors = JSON.parse(rawEditorsData);
                        draggedEditors.forEach(draggedEditor => {
                            resources.push({
                                resource: uri_1.URI.parse(draggedEditor.resource),
                                content: draggedEditor.content,
                                options: draggedEditor.options,
                                encoding: draggedEditor.encoding,
                                mode: draggedEditor.mode,
                                isExternal: false
                            });
                        });
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
                // Data Transfer: Resources
                else {
                    try {
                        const rawResourcesData = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                        if (rawResourcesData) {
                            const uriStrArray = JSON.parse(rawResourcesData);
                            resources.push(...uriStrArray.map(uriStr => ({ resource: uri_1.URI.parse(uriStr), isExternal: false })));
                        }
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
            }
            // Check for native file transfer
            if (e.dataTransfer && e.dataTransfer.files) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const file = e.dataTransfer.files[i];
                    if ((file === null || file === void 0 ? void 0 : file.path /* Electron only */) && !resources.some(r => r.resource.fsPath === file.path) /* prevent duplicates */) {
                        try {
                            resources.push({ resource: uri_1.URI.file(file.path), isExternal: true });
                        }
                        catch (error) {
                            // Invalid URI
                        }
                    }
                }
            }
            // Check for CodeFiles transfer
            const rawCodeFiles = e.dataTransfer.getData(exports.CodeDataTransfers.FILES);
            if (rawCodeFiles) {
                try {
                    const codeFiles = JSON.parse(rawCodeFiles);
                    codeFiles.forEach(codeFile => {
                        if (!resources.some(r => r.resource.fsPath === codeFile) /* prevent duplicates */) {
                            resources.push({ resource: uri_1.URI.file(codeFile), isExternal: true });
                        }
                    });
                }
                catch (error) {
                    // Invalid transfer
                }
            }
        }
        return resources;
    }
    exports.extractResources = extractResources;
    /**
     * Shared function across some components to handle drag & drop of resources. E.g. of folders and workspace files
     * to open them in the window instead of the editor or to handle dirty editors being dropped between instances of Code.
     */
    let ResourcesDropHandler = class ResourcesDropHandler {
        constructor(options, fileService, workspacesService, textFileService, backupFileService, editorService, workspaceEditingService, hostService) {
            this.options = options;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.textFileService = textFileService;
            this.backupFileService = backupFileService;
            this.editorService = editorService;
            this.workspaceEditingService = workspaceEditingService;
            this.hostService = hostService;
        }
        async handleDrop(event, resolveTargetGroup, afterDrop, targetIndex) {
            const untitledOrFileResources = extractResources(event).filter(r => this.fileService.canHandleResource(r.resource) || r.resource.scheme === network_1.Schemas.untitled);
            if (!untitledOrFileResources.length) {
                return;
            }
            // Make the window active to handle the drop properly within
            await this.hostService.focus();
            // Check for special things being dropped
            const isWorkspaceOpening = await this.doHandleDrop(untitledOrFileResources);
            if (isWorkspaceOpening) {
                return; // return early if the drop operation resulted in this window changing to a workspace
            }
            // Add external ones to recently open list unless dropped resource is a workspace
            const recentFiles = untitledOrFileResources.filter(d => d.isExternal && d.resource.scheme === network_1.Schemas.file).map(d => ({ fileUri: d.resource }));
            if (recentFiles.length) {
                this.workspacesService.addRecentlyOpened(recentFiles);
            }
            const editors = untitledOrFileResources.map(untitledOrFileResource => ({
                resource: untitledOrFileResource.resource,
                encoding: untitledOrFileResource.encoding,
                mode: untitledOrFileResource.mode,
                options: Object.assign(Object.assign({}, untitledOrFileResource.options), { pinned: true, index: targetIndex })
            }));
            // Open in Editor
            const targetGroup = resolveTargetGroup();
            await this.editorService.openEditors(editors, targetGroup);
            // Finish with provided function
            afterDrop(targetGroup);
        }
        async doHandleDrop(untitledOrFileResources) {
            // Check for dirty editors being dropped
            const resourcesWithContent = untitledOrFileResources.filter(resource => !resource.isExternal && !!resource.content);
            if (resourcesWithContent.length > 0) {
                await Promise.all(resourcesWithContent.map(resourceWithContent => this.handleDirtyEditorDrop(resourceWithContent)));
                return false;
            }
            // Check for workspace file being dropped if we are allowed to do so
            if (this.options.allowWorkspaceOpen) {
                const externalFileOnDiskResources = untitledOrFileResources.filter(d => d.isExternal && d.resource.scheme === network_1.Schemas.file).map(d => d.resource);
                if (externalFileOnDiskResources.length > 0) {
                    return this.handleWorkspaceFileDrop(externalFileOnDiskResources);
                }
            }
            return false;
        }
        async handleDirtyEditorDrop(droppedDirtyEditor) {
            // Untitled: always ensure that we open a new untitled editor for each file we drop
            if (droppedDirtyEditor.resource.scheme === network_1.Schemas.untitled) {
                const untitledEditorResource = this.editorService.createEditorInput({ mode: droppedDirtyEditor.mode, encoding: droppedDirtyEditor.encoding, forceUntitled: true }).resource;
                if (untitledEditorResource) {
                    droppedDirtyEditor.resource = untitledEditorResource;
                }
            }
            // File: ensure the file is not dirty or opened already
            else if (this.textFileService.isDirty(droppedDirtyEditor.resource) || this.editorService.isOpen({ resource: droppedDirtyEditor.resource })) {
                return false;
            }
            // If the dropped editor is dirty with content we simply take that
            // content and turn it into a backup so that it loads the contents
            if (droppedDirtyEditor.content) {
                try {
                    await this.backupFileService.backup(droppedDirtyEditor.resource, textfiles_1.stringToSnapshot(droppedDirtyEditor.content));
                }
                catch (e) {
                    // Ignore error
                }
            }
            return false;
        }
        async handleWorkspaceFileDrop(fileOnDiskResources) {
            const toOpen = [];
            const folderURIs = [];
            await Promise.all(fileOnDiskResources.map(async (fileOnDiskResource) => {
                // Check for Workspace
                if (workspaces_1.hasWorkspaceFileExtension(fileOnDiskResource)) {
                    toOpen.push({ workspaceUri: fileOnDiskResource });
                    return;
                }
                // Check for Folder
                try {
                    const stat = await this.fileService.resolve(fileOnDiskResource);
                    if (stat.isDirectory) {
                        toOpen.push({ folderUri: stat.resource });
                        folderURIs.push({ uri: stat.resource });
                    }
                }
                catch (error) {
                    // Ignore error
                }
            }));
            // Return early if no external resource is a folder or workspace
            if (toOpen.length === 0) {
                return false;
            }
            // Pass focus to window
            this.hostService.focus();
            // Open in separate windows if we drop workspaces or just one folder
            if (toOpen.length > folderURIs.length || folderURIs.length === 1) {
                await this.hostService.openWindow(toOpen);
            }
            // folders.length > 1: Multiple folders: Create new workspace with folders and open
            else {
                await this.workspaceEditingService.createAndEnterWorkspace(folderURIs);
            }
            return true;
        }
    };
    ResourcesDropHandler = __decorate([
        __param(1, files_1.IFileService),
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, backup_1.IBackupFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, workspaceEditing_1.IWorkspaceEditingService),
        __param(7, host_1.IHostService)
    ], ResourcesDropHandler);
    exports.ResourcesDropHandler = ResourcesDropHandler;
    function fillResourceDataTransfers(accessor, resources, optionsCallback, event) {
        if (resources.length === 0 || !event.dataTransfer) {
            return;
        }
        const sources = resources.map(obj => {
            if (uri_1.URI.isUri(obj)) {
                return { resource: obj, isDirectory: false /* assume resource is not a directory */ };
            }
            return obj;
        });
        // Text: allows to paste into text-capable areas
        const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
        event.dataTransfer.setData(dnd_1.DataTransfers.TEXT, sources.map(source => source.resource.scheme === network_1.Schemas.file ? path_1.normalize(labels_1.normalizeDriveLetter(source.resource.fsPath)) : source.resource.toString()).join(lineDelimiter));
        // Download URL: enables support to drag a tab as file to desktop (only single file supported)
        // Disabled for PWA web due to: https://github.com/microsoft/vscode/issues/83441
        if (!sources[0].isDirectory && (!platform_1.isWeb || !browser_1.isStandalone)) {
            event.dataTransfer.setData(dnd_1.DataTransfers.DOWNLOAD_URL, [mime_1.MIME_BINARY, resources_1.basename(sources[0].resource), dom_1.asDomUri(sources[0].resource).toString()].join(':'));
        }
        // Resource URLs: allows to drop multiple resources to a target in VS Code (not directories)
        const files = sources.filter(s => !s.isDirectory);
        if (files.length) {
            event.dataTransfer.setData(dnd_1.DataTransfers.RESOURCES, JSON.stringify(files.map(f => f.resource.toString())));
        }
        // Editors: enables cross window DND of tabs into the editor area
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const draggedEditors = [];
        files.forEach(file => {
            let options = undefined;
            // Use provided callback for editor options
            if (typeof optionsCallback === 'function') {
                options = optionsCallback(file.resource);
            }
            // Otherwise try to figure out the view state from opened editors that match
            else {
                options = {
                    viewState: (() => {
                        const textEditorControls = editorService.visibleTextEditorControls;
                        for (const textEditorControl of textEditorControls) {
                            if (editorBrowser_1.isCodeEditor(textEditorControl)) {
                                const model = textEditorControl.getModel();
                                if (resources_1.extUri.isEqual(model === null || model === void 0 ? void 0 : model.uri, file.resource)) {
                                    return types_1.withNullAsUndefined(textEditorControl.saveViewState());
                                }
                            }
                        }
                        return undefined;
                    })()
                };
            }
            // Try to find encoding and mode from text model
            let encoding = undefined;
            let mode = undefined;
            const model = file.resource.scheme === network_1.Schemas.untitled ? textFileService.untitled.get(file.resource) : textFileService.files.get(file.resource);
            if (model) {
                encoding = model.getEncoding();
                mode = model.getMode();
            }
            // If the resource is dirty or untitled, send over its content
            // to restore dirty state. Get that from the text model directly
            let content = undefined;
            if (model === null || model === void 0 ? void 0 : model.isDirty()) {
                content = model.textEditorModel.getValue();
            }
            // Add as dragged editor
            draggedEditors.push({ resource: file.resource.toString(), content, options, encoding, mode });
        });
        if (draggedEditors.length) {
            event.dataTransfer.setData(exports.CodeDataTransfers.EDITORS, JSON.stringify(draggedEditors));
        }
    }
    exports.fillResourceDataTransfers = fillResourceDataTransfers;
    /**
     * A singleton to store transfer data during drag & drop operations that are only valid within the application.
     */
    class LocalSelectionTransfer {
        constructor() {
            // protect against external instantiation
        }
        static getInstance() {
            return LocalSelectionTransfer.INSTANCE;
        }
        hasData(proto) {
            return proto && proto === this.proto;
        }
        clearData(proto) {
            if (this.hasData(proto)) {
                this.proto = undefined;
                this.data = undefined;
            }
        }
        getData(proto) {
            if (this.hasData(proto)) {
                return this.data;
            }
            return undefined;
        }
        setData(data, proto) {
            if (proto) {
                this.data = data;
                this.proto = proto;
            }
        }
    }
    exports.LocalSelectionTransfer = LocalSelectionTransfer;
    LocalSelectionTransfer.INSTANCE = new LocalSelectionTransfer();
    class DragAndDropObserver extends lifecycle_1.Disposable {
        constructor(element, callbacks) {
            super();
            this.element = element;
            this.callbacks = callbacks;
            // A helper to fix issues with repeated DRAG_ENTER / DRAG_LEAVE
            // calls see https://github.com/Microsoft/vscode/issues/14470
            // when the element has child elements where the events are fired
            // repeadedly.
            this.counter = 0;
            this.registerListeners();
        }
        registerListeners() {
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_ENTER, (e) => {
                this.counter++;
                this.callbacks.onDragEnter(e);
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_OVER, (e) => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                if (this.callbacks.onDragOver) {
                    this.callbacks.onDragOver(e);
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_LEAVE, (e) => {
                this.counter--;
                if (this.counter === 0) {
                    this.callbacks.onDragLeave(e);
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_END, (e) => {
                this.counter = 0;
                this.callbacks.onDragEnd(e);
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DROP, (e) => {
                this.counter = 0;
                this.callbacks.onDrop(e);
            }));
        }
    }
    exports.DragAndDropObserver = DragAndDropObserver;
    function containsDragType(event, ...dragTypesToFind) {
        if (!event.dataTransfer) {
            return false;
        }
        const dragTypes = event.dataTransfer.types;
        const lowercaseDragTypes = [];
        for (let i = 0; i < dragTypes.length; i++) {
            lowercaseDragTypes.push(dragTypes[i].toLowerCase()); // somehow the types are lowercase
        }
        for (const dragType of dragTypesToFind) {
            if (lowercaseDragTypes.indexOf(dragType.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }
    exports.containsDragType = containsDragType;
    class CompositeDragAndDropData {
        constructor(type, id) {
            this.type = type;
            this.id = id;
        }
        update(dataTransfer) {
            // no-op
        }
        getData() {
            return { type: this.type, id: this.id };
        }
    }
    exports.CompositeDragAndDropData = CompositeDragAndDropData;
    class DraggedCompositeIdentifier {
        constructor(_compositeId) {
            this._compositeId = _compositeId;
        }
        get id() {
            return this._compositeId;
        }
    }
    exports.DraggedCompositeIdentifier = DraggedCompositeIdentifier;
    class DraggedViewIdentifier {
        constructor(_viewId) {
            this._viewId = _viewId;
        }
        get id() {
            return this._viewId;
        }
    }
    exports.DraggedViewIdentifier = DraggedViewIdentifier;
    class CompositeDragAndDropObserver extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDragStart = this._register(new event_1.Emitter());
            this._onDragEnd = this._register(new event_1.Emitter());
            this.transferData = LocalSelectionTransfer.getInstance();
            this._register(this._onDragEnd.event(e => {
                const id = e.dragAndDropData.getData().id;
                const type = e.dragAndDropData.getData().type;
                const data = this.readDragData(type);
                if (data && data.getData().id === id) {
                    this.transferData.clearData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
                }
            }));
        }
        static get INSTANCE() {
            if (!CompositeDragAndDropObserver._instance) {
                CompositeDragAndDropObserver._instance = new CompositeDragAndDropObserver();
            }
            return CompositeDragAndDropObserver._instance;
        }
        readDragData(type) {
            if (this.transferData.hasData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype)) {
                const data = this.transferData.getData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
                if (data && data[0]) {
                    return new CompositeDragAndDropData(type, data[0].id);
                }
            }
            return undefined;
        }
        writeDragData(id, type) {
            this.transferData.setData([type === 'view' ? new DraggedViewIdentifier(id) : new DraggedCompositeIdentifier(id)], type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
        }
        registerTarget(element, callbacks) {
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(new DragAndDropObserver(element, {
                onDragEnd: e => {
                    // no-op
                },
                onDragEnter: e => {
                    e.preventDefault();
                    if (callbacks.onDragEnter) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (data) {
                            callbacks.onDragEnter({ eventData: e, dragAndDropData: data });
                        }
                    }
                },
                onDragLeave: e => {
                    const data = this.readDragData('composite') || this.readDragData('view');
                    if (callbacks.onDragLeave && data) {
                        callbacks.onDragLeave({ eventData: e, dragAndDropData: data });
                    }
                },
                onDrop: e => {
                    if (callbacks.onDrop) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDrop({ eventData: e, dragAndDropData: data });
                        // Fire drag event in case drop handler destroys the dragged element
                        this._onDragEnd.fire({ eventData: e, dragAndDropData: data });
                    }
                },
                onDragOver: e => {
                    e.preventDefault();
                    if (callbacks.onDragOver) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDragOver({ eventData: e, dragAndDropData: data });
                    }
                }
            }));
            if (callbacks.onDragStart) {
                this._onDragStart.event(e => {
                    callbacks.onDragStart(e);
                }, this, disposableStore);
            }
            if (callbacks.onDragEnd) {
                this._onDragEnd.event(e => {
                    callbacks.onDragEnd(e);
                });
            }
            return this._register(disposableStore);
        }
        registerDraggable(element, draggedItemProvider, callbacks) {
            element.draggable = true;
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(dom_1.addDisposableListener(element, dom_1.EventType.DRAG_START, e => {
                const { id, type } = draggedItemProvider();
                this.writeDragData(id, type);
                if (e.dataTransfer) {
                    e.dataTransfer.setDragImage(element, 0, 0);
                }
                this._onDragStart.fire({ eventData: e, dragAndDropData: this.readDragData(type) });
            }));
            disposableStore.add(new DragAndDropObserver(element, {
                onDragEnd: e => {
                    const { type } = draggedItemProvider();
                    const data = this.readDragData(type);
                    if (!data) {
                        return;
                    }
                    this._onDragEnd.fire({ eventData: e, dragAndDropData: data });
                },
                onDragEnter: e => {
                    if (callbacks.onDragEnter) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        if (data) {
                            callbacks.onDragEnter({ eventData: e, dragAndDropData: data });
                        }
                    }
                },
                onDragLeave: e => {
                    const data = this.readDragData('composite') || this.readDragData('view');
                    if (!data) {
                        return;
                    }
                    if (callbacks.onDragLeave) {
                        callbacks.onDragLeave({ eventData: e, dragAndDropData: data });
                    }
                },
                onDrop: e => {
                    if (callbacks.onDrop) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDrop({ eventData: e, dragAndDropData: data });
                        // Fire drag event in case drop handler destroys the dragged element
                        this._onDragEnd.fire({ eventData: e, dragAndDropData: data });
                    }
                },
                onDragOver: e => {
                    if (callbacks.onDragOver) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDragOver({ eventData: e, dragAndDropData: data });
                    }
                }
            }));
            if (callbacks.onDragStart) {
                this._onDragStart.event(e => {
                    callbacks.onDragStart(e);
                }, this, disposableStore);
            }
            if (callbacks.onDragEnd) {
                this._onDragEnd.event(e => {
                    callbacks.onDragEnd(e);
                });
            }
            return this._register(disposableStore);
        }
    }
    exports.CompositeDragAndDropObserver = CompositeDragAndDropObserver;
    function toggleDropEffect(dataTransfer, dropEffect, shouldHaveIt) {
        if (!dataTransfer) {
            return;
        }
        dataTransfer.dropEffect = shouldHaveIt ? dropEffect : 'none';
    }
    exports.toggleDropEffect = toggleDropEffect;
});
//# __sourceMappingURL=dnd.js.map