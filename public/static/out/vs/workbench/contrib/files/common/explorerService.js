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
define(["require", "exports", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/explorerModel", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/decorators", "vs/workbench/common/resources", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, workspace_1, lifecycle_1, explorerModel_1, files_1, resources_1, decorators_1, resources_2, instantiation_1, configuration_1, clipboardService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerService = void 0;
    function getFileEventsExcludes(configurationService, root) {
        var _a;
        const scope = root ? { resource: root } : undefined;
        const configuration = scope ? configurationService.getValue(scope) : configurationService.getValue();
        return ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _a === void 0 ? void 0 : _a.exclude) || Object.create(null);
    }
    let ExplorerService = class ExplorerService {
        constructor(fileService, instantiationService, configurationService, contextService, clipboardService, editorService) {
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.clipboardService = clipboardService;
            this.editorService = editorService;
            this.disposables = new lifecycle_1.DisposableStore();
            this._sortOrder = this.configurationService.getValue('explorer.sortOrder');
            this.model = new explorerModel_1.ExplorerModel(this.contextService, this.fileService);
            this.disposables.add(this.model);
            this.disposables.add(this.fileService.onDidRunOperation(e => this.onDidRunOperation(e)));
            this.disposables.add(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue())));
            this.disposables.add(event_1.Event.any(this.fileService.onDidChangeFileSystemProviderRegistrations, this.fileService.onDidChangeFileSystemProviderCapabilities)(async (e) => {
                let affected = false;
                this.model.roots.forEach(r => {
                    if (r.resource.scheme === e.scheme) {
                        affected = true;
                        r.forgetChildren();
                    }
                });
                if (affected) {
                    if (this.view) {
                        await this.view.refresh(true);
                    }
                }
            }));
            this.disposables.add(this.model.onDidChangeRoots(() => {
                if (this.view) {
                    this.view.setTreeInput();
                }
            }));
        }
        get roots() {
            return this.model.roots;
        }
        get sortOrder() {
            return this._sortOrder;
        }
        registerView(contextProvider) {
            this.view = contextProvider;
        }
        getContext(respectMultiSelection) {
            if (!this.view) {
                return [];
            }
            return this.view.getContext(respectMultiSelection);
        }
        // Memoized locals
        get fileEventsFilter() {
            const fileEventsFilter = this.instantiationService.createInstance(resources_2.ResourceGlobMatcher, (root) => getFileEventsExcludes(this.configurationService, root), (event) => event.affectsConfiguration(files_1.FILES_EXCLUDE_CONFIG));
            this.disposables.add(fileEventsFilter);
            return fileEventsFilter;
        }
        // IExplorerService methods
        findClosest(resource) {
            return this.model.findClosest(resource);
        }
        async setEditable(stat, data) {
            if (!this.view) {
                return;
            }
            if (!data) {
                this.editable = undefined;
            }
            else {
                this.editable = { stat, data };
            }
            const isEditing = this.isEditable(stat);
            await this.view.setEditable(stat, isEditing);
        }
        async setToCopy(items, cut) {
            var _a;
            const previouslyCutItems = this.cutItems;
            this.cutItems = cut ? items : undefined;
            await this.clipboardService.writeResources(items.map(s => s.resource));
            (_a = this.view) === null || _a === void 0 ? void 0 : _a.itemsCopied(items, cut, previouslyCutItems);
        }
        isCut(item) {
            return !!this.cutItems && this.cutItems.indexOf(item) >= 0;
        }
        getEditable() {
            return this.editable;
        }
        getEditableData(stat) {
            return this.editable && this.editable.stat === stat ? this.editable.data : undefined;
        }
        isEditable(stat) {
            return !!this.editable && (this.editable.stat === stat || !stat);
        }
        async select(resource, reveal) {
            if (!this.view) {
                return;
            }
            const fileStat = this.findClosest(resource);
            if (fileStat) {
                await this.view.selectResource(fileStat.resource, reveal);
                return Promise.resolve(undefined);
            }
            // Stat needs to be resolved first and then revealed
            const options = { resolveTo: [resource], resolveMetadata: this.sortOrder === "modified" /* Modified */ };
            const workspaceFolder = this.contextService.getWorkspaceFolder(resource);
            if (workspaceFolder === null) {
                return Promise.resolve(undefined);
            }
            const rootUri = workspaceFolder.uri;
            const root = this.roots.find(r => r.resource.toString() === rootUri.toString());
            try {
                const stat = await this.fileService.resolve(rootUri, options);
                // Convert to model
                const modelStat = explorerModel_1.ExplorerItem.create(this.fileService, stat, undefined, options.resolveTo);
                // Update Input with disk Stat
                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, root);
                const item = root.find(resource);
                await this.view.refresh(true, root);
                // Select and Reveal
                await this.view.selectResource(item ? item.resource : undefined, reveal);
            }
            catch (error) {
                root.isError = true;
                await this.view.refresh(false, root);
            }
        }
        async refresh(reveal = true) {
            this.model.roots.forEach(r => r.forgetChildren());
            if (this.view) {
                await this.view.refresh(true);
                const resource = this.editorService.activeEditor ? this.editorService.activeEditor.resource : undefined;
                const autoReveal = this.configurationService.getValue().explorer.autoReveal;
                if (reveal && resource && autoReveal) {
                    // We did a top level refresh, reveal the active file #67118
                    this.select(resource, autoReveal);
                }
            }
        }
        // File events
        async onDidRunOperation(e) {
            // Add
            if (e.isOperation(0 /* CREATE */) || e.isOperation(3 /* COPY */)) {
                const addedElement = e.target;
                const parentResource = resources_1.dirname(addedElement.resource);
                const parents = this.model.findAll(parentResource);
                if (parents.length) {
                    // Add the new file to its parent (Model)
                    parents.forEach(async (p) => {
                        var _a;
                        // We have to check if the parent is resolved #29177
                        const resolveMetadata = this.sortOrder === `modified`;
                        if (!p.isDirectoryResolved) {
                            const stat = await this.fileService.resolve(p.resource, { resolveMetadata });
                            if (stat) {
                                const modelStat = explorerModel_1.ExplorerItem.create(this.fileService, stat, p.parent);
                                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, p);
                            }
                        }
                        const childElement = explorerModel_1.ExplorerItem.create(this.fileService, addedElement, p.parent);
                        // Make sure to remove any previous version of the file if any
                        p.removeChild(childElement);
                        p.addChild(childElement);
                        // Refresh the Parent (View)
                        await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(false, p));
                    });
                }
            }
            // Move (including Rename)
            else if (e.isOperation(2 /* MOVE */)) {
                const oldResource = e.resource;
                const newElement = e.target;
                const oldParentResource = resources_1.dirname(oldResource);
                const newParentResource = resources_1.dirname(newElement.resource);
                // Handle Rename
                if (oldParentResource.toString() === newParentResource.toString()) {
                    const modelElements = this.model.findAll(oldResource);
                    modelElements.forEach(async (modelElement) => {
                        var _a;
                        // Rename File (Model)
                        modelElement.rename(newElement);
                        await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(false, modelElement.parent));
                    });
                }
                // Handle Move
                else {
                    const newParents = this.model.findAll(newParentResource);
                    const modelElements = this.model.findAll(oldResource);
                    if (newParents.length && modelElements.length) {
                        // Move in Model
                        modelElements.forEach(async (modelElement, index) => {
                            var _a, _b;
                            const oldParent = modelElement.parent;
                            modelElement.move(newParents[index]);
                            await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(false, oldParent));
                            await ((_b = this.view) === null || _b === void 0 ? void 0 : _b.refresh(false, newParents[index]));
                        });
                    }
                }
            }
            // Delete
            else if (e.isOperation(1 /* DELETE */)) {
                const modelElements = this.model.findAll(e.resource);
                modelElements.forEach(async (element) => {
                    var _a;
                    if (element.parent) {
                        const parent = element.parent;
                        // Remove Element from Parent (Model)
                        parent.removeChild(element);
                        // Refresh Parent (View)
                        await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(false, parent));
                    }
                });
            }
        }
        onDidFilesChange(e) {
            // Check if an explorer refresh is necessary (delayed to give internal events a chance to react first)
            // Note: there is no guarantee when the internal events are fired vs real ones. Code has to deal with the fact that one might
            // be fired first over the other or not at all.
            setTimeout(async () => {
                // Filter to the ones we care
                const shouldRefresh = () => {
                    e = this.filterToViewRelevantEvents(e);
                    // Handle added files/folders
                    const added = e.getAdded();
                    if (added.length) {
                        // Check added: Refresh if added file/folder is not part of resolved root and parent is part of it
                        const ignoredPaths = new Set();
                        for (let i = 0; i < added.length; i++) {
                            const change = added[i];
                            // Find parent
                            const parent = resources_1.dirname(change.resource);
                            // Continue if parent was already determined as to be ignored
                            if (ignoredPaths.has(parent.toString())) {
                                continue;
                            }
                            // Compute if parent is visible and added file not yet part of it
                            const parentStat = this.model.findClosest(parent);
                            if (parentStat && parentStat.isDirectoryResolved && !this.model.findClosest(change.resource)) {
                                return true;
                            }
                            // Keep track of path that can be ignored for faster lookup
                            if (!parentStat || !parentStat.isDirectoryResolved) {
                                ignoredPaths.add(parent.toString());
                            }
                        }
                    }
                    // Handle deleted files/folders
                    const deleted = e.getDeleted();
                    if (deleted.length) {
                        // Check deleted: Refresh if deleted file/folder part of resolved root
                        for (let j = 0; j < deleted.length; j++) {
                            const del = deleted[j];
                            const item = this.model.findClosest(del.resource);
                            if (item && item.parent) {
                                return true;
                            }
                        }
                    }
                    // Handle updated files/folders if we sort by modified
                    if (this._sortOrder === "modified" /* Modified */) {
                        const updated = e.getUpdated();
                        // Check updated: Refresh if updated file/folder part of resolved root
                        for (let j = 0; j < updated.length; j++) {
                            const upd = updated[j];
                            const item = this.model.findClosest(upd.resource);
                            if (item && item.parent) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                if (shouldRefresh()) {
                    await this.refresh(false);
                }
            }, ExplorerService.EXPLORER_FILE_CHANGES_REACT_DELAY);
        }
        filterToViewRelevantEvents(e) {
            return e.filter(change => {
                if (change.type === 0 /* UPDATED */ && this._sortOrder !== "modified" /* Modified */) {
                    return false; // we only are about updated if we sort by modified time
                }
                if (!this.contextService.isInsideWorkspace(change.resource)) {
                    return false; // exclude changes for resources outside of workspace
                }
                if (this.fileEventsFilter.matches(change.resource)) {
                    return false; // excluded via files.exclude setting
                }
                return true;
            });
        }
        async onConfigurationUpdated(configuration, event) {
            var _a;
            const configSortOrder = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.explorer) === null || _a === void 0 ? void 0 : _a.sortOrder) || 'default';
            if (this._sortOrder !== configSortOrder) {
                const shouldRefresh = this._sortOrder !== undefined;
                this._sortOrder = configSortOrder;
                if (shouldRefresh) {
                    await this.refresh();
                }
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ExplorerService.EXPLORER_FILE_CHANGES_REACT_DELAY = 500; // delay in ms to react to file changes to give our internal events a chance to react first
    __decorate([
        decorators_1.memoize
    ], ExplorerService.prototype, "fileEventsFilter", null);
    ExplorerService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, clipboardService_1.IClipboardService),
        __param(5, editorService_1.IEditorService)
    ], ExplorerService);
    exports.ExplorerService = ExplorerService;
});
//# __sourceMappingURL=explorerService.js.map