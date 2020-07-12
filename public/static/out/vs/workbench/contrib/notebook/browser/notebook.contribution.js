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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/services/backup/common/backup", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/browser/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorOpenWith", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/workbench/contrib/notebook/browser/contrib/find/findController", "vs/workbench/contrib/notebook/browser/contrib/fold/folding", "vs/workbench/contrib/notebook/browser/contrib/format/formatting", "vs/workbench/contrib/notebook/browser/contrib/toc/tocProvider", "vs/workbench/contrib/notebook/browser/contrib/marker/markerProvider", "vs/workbench/contrib/notebook/browser/contrib/status/editorStatus", "vs/workbench/contrib/notebook/browser/view/output/transforms/streamTransform", "vs/workbench/contrib/notebook/browser/view/output/transforms/errorTransform", "vs/workbench/contrib/notebook/browser/view/output/transforms/richTransform"], function (require, exports, arrays_1, network_1, lifecycle_1, marshalling_1, resources_1, types_1, uri_1, modelService_1, modeService_1, resolverService_1, nls, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_1, editor_1, contributions_1, editor_2, backup_1, notebookEditor_1, notebookEditorInput_1, notebookService_1, notebookServiceImpl_1, notebookCommon_1, editorService_1, configuration_1, editorOpenWith_1, customEditor_1, notebookEditorWidget_1, undoRedo_1, notebookEditorModelResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookContribution = void 0;
    /*--------------------------------------------------------------------------------------------- */
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(notebookEditor_1.NotebookEditor, notebookEditor_1.NotebookEditor.ID, 'Notebook Editor'), [
        new descriptors_1.SyncDescriptor(notebookEditorInput_1.NotebookEditorInput)
    ]);
    class NotebookEditorFactory {
        canSerialize() {
            return true;
        }
        serialize(input) {
            types_1.assertType(input instanceof notebookEditorInput_1.NotebookEditorInput);
            return JSON.stringify({
                resource: input.resource,
                name: input.name,
                viewType: input.viewType,
            });
        }
        deserialize(instantiationService, raw) {
            const data = marshalling_1.parse(raw);
            if (!data) {
                return undefined;
            }
            const { resource, name, viewType } = data;
            if (!data || !uri_1.URI.isUri(resource) || typeof name !== 'string' || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookEditorInput_1.NotebookEditorInput.create(instantiationService, resource, name, viewType);
            return input;
        }
        static async createCustomEditorInput(resource, instantiationService) {
            return instantiationService.invokeFunction(async (accessor) => {
                const backupFileService = accessor.get(backup_1.IBackupFileService);
                const backup = await backupFileService.resolve(resource);
                if (!(backup === null || backup === void 0 ? void 0 : backup.meta)) {
                    throw new Error(`No backup found for Notebook editor: ${resource}`);
                }
                const input = notebookEditorInput_1.NotebookEditorInput.create(instantiationService, resource, backup.meta.name, backup.meta.viewType, { startDirty: true });
                return input;
            });
        }
        static canResolveBackup(editorInput, backupResource) {
            if (editorInput instanceof notebookEditorInput_1.NotebookEditorInput) {
                if (resources_1.isEqual(editorInput.resource.with({ scheme: network_1.Schemas.vscodeNotebook }), backupResource)) {
                    return true;
                }
            }
            return false;
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(notebookEditorInput_1.NotebookEditorInput.ID, NotebookEditorFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerCustomEditorInputFactory(network_1.Schemas.vscodeNotebook, NotebookEditorFactory);
    function getFirstNotebookInfo(notebookService, uri) {
        return notebookService.getContributedNotebookProviders(uri)[0];
    }
    let NotebookContribution = class NotebookContribution extends lifecycle_1.Disposable {
        constructor(editorService, notebookService, instantiationService, configurationService, undoRedoService) {
            super();
            this.editorService = editorService;
            this.notebookService = notebookService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this._register(undoRedoService.registerUriComparisonKeyComputer({
                getComparisonKey: (uri) => {
                    if (uri.scheme !== notebookCommon_1.CellUri.scheme) {
                        return null;
                    }
                    const data = notebookCommon_1.CellUri.parse(uri);
                    if (!data) {
                        return null;
                    }
                    return data.notebook.toString();
                }
            }));
            this._register(this.editorService.overrideOpenEditor({
                getEditorOverrides: (resource, options, group) => {
                    const currentEditorForResource = group === null || group === void 0 ? void 0 : group.editors.find(editor => resources_1.isEqual(editor.resource, resource));
                    const associatedEditors = arrays_1.distinct([
                        ...this.getUserAssociatedNotebookEditors(resource),
                        ...this.getContributedEditors(resource)
                    ], editor => editor.id);
                    return associatedEditors.map(info => {
                        return {
                            label: info.displayName,
                            id: info.id,
                            active: currentEditorForResource instanceof notebookEditorInput_1.NotebookEditorInput && currentEditorForResource.viewType === info.id,
                            detail: info.providerDisplayName
                        };
                    });
                },
                open: (editor, options, group) => {
                    return this.onEditorOpening2(editor, options, group);
                }
            }));
            this._register(this.editorService.onDidVisibleEditorsChange(() => {
                const visibleNotebookEditors = editorService.visibleEditorPanes
                    .filter(pane => pane.isNotebookEditor)
                    .map(pane => pane.getControl())
                    .filter(control => !!control)
                    .map(editor => editor.getId());
                this.notebookService.updateVisibleNotebookEditor(visibleNotebookEditors);
            }));
            this._register(this.editorService.onDidActiveEditorChange(() => {
                const activeEditorPane = editorService.activeEditorPane;
                const notebookEditor = (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) ? activeEditorPane.getControl() : undefined;
                if (notebookEditor) {
                    this.notebookService.updateActiveNotebookEditor(notebookEditor);
                }
                else {
                    this.notebookService.updateActiveNotebookEditor(null);
                }
            }));
        }
        getUserAssociatedEditors(resource) {
            const rawAssociations = this.configurationService.getValue(editorOpenWith_1.customEditorsAssociationsSettingId) || [];
            return arrays_1.coalesce(rawAssociations
                .filter(association => customEditor_1.CustomEditorInfo.selectorMatches(association, resource)));
        }
        getUserAssociatedNotebookEditors(resource) {
            const rawAssociations = this.configurationService.getValue(editorOpenWith_1.customEditorsAssociationsSettingId) || [];
            return arrays_1.coalesce(rawAssociations
                .filter(association => customEditor_1.CustomEditorInfo.selectorMatches(association, resource))
                .map(association => this.notebookService.getContributedNotebookProvider(association.viewType)));
        }
        getContributedEditors(resource) {
            return this.notebookService.getContributedNotebookProviders(resource);
        }
        onEditorOpening2(originalInput, options, group) {
            let id = typeof (options === null || options === void 0 ? void 0 : options.override) === 'string' ? options.override : undefined;
            if (id === undefined && originalInput.isUntitled()) {
                return undefined;
            }
            if (!originalInput.resource) {
                return undefined;
            }
            if (originalInput instanceof notebookEditorInput_1.NotebookEditorInput) {
                return undefined;
            }
            let notebookUri = originalInput.resource;
            let cellOptions;
            const data = notebookCommon_1.CellUri.parse(originalInput.resource);
            if (data) {
                notebookUri = data.notebook;
                cellOptions = { resource: originalInput.resource, options };
            }
            if (id === undefined) {
                const exitingNotebookEditor = group.editors.find(editor => editor instanceof notebookEditorInput_1.NotebookEditorInput && resources_1.isEqual(editor.resource, notebookUri));
                id = exitingNotebookEditor === null || exitingNotebookEditor === void 0 ? void 0 : exitingNotebookEditor.viewType;
            }
            if (id === undefined) {
                const existingEditors = group.editors.filter(editor => editor.resource && resources_1.isEqual(editor.resource, notebookUri) && !(editor instanceof notebookEditorInput_1.NotebookEditorInput));
                if (existingEditors.length) {
                    return undefined;
                }
                const userAssociatedEditors = this.getUserAssociatedEditors(notebookUri);
                const notebookEditor = userAssociatedEditors.filter(association => this.notebookService.getContributedNotebookProvider(association.viewType));
                if (userAssociatedEditors.length && !notebookEditor.length) {
                    // user pick a non-notebook editor for this resource
                    return undefined;
                }
                // user might pick a notebook editor
                const associatedEditors = arrays_1.distinct([
                    ...this.getUserAssociatedNotebookEditors(notebookUri),
                    ...(this.getContributedEditors(notebookUri).filter(editor => editor.priority === notebookCommon_1.NotebookEditorPriority.default))
                ], editor => editor.id);
                if (!associatedEditors.length) {
                    // there is no notebook editor contribution which is enabled by default
                    return undefined;
                }
            }
            const infos = this.notebookService.getContributedNotebookProviders(notebookUri);
            let info = infos.find(info => !id || info.id === id);
            if (!info && id !== undefined) {
                info = this.notebookService.getContributedNotebookProvider(id);
            }
            if (!info) {
                return undefined;
            }
            /**
             * Scenario: we are reopening a file editor input which is pinned, we should open in a new editor tab.
             */
            let index = undefined;
            if (group.activeEditor === originalInput && resources_1.isEqual(originalInput.resource, notebookUri)) {
                const originalEditorIndex = group.getIndexOfEditor(originalInput);
                index = group.isPinned(originalInput) ? originalEditorIndex + 1 : originalEditorIndex;
            }
            const notebookInput = notebookEditorInput_1.NotebookEditorInput.create(this.instantiationService, notebookUri, originalInput.getName(), info.id);
            const notebookOptions = new notebookEditorWidget_1.NotebookEditorOptions(Object.assign(Object.assign({}, options), { cellOptions, override: false, index }));
            return { override: this.editorService.openEditor(notebookInput, notebookOptions, group) };
        }
    };
    NotebookContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, notebookService_1.INotebookService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, undoRedo_1.IUndoRedoService)
    ], NotebookContribution);
    exports.NotebookContribution = NotebookContribution;
    let CellContentProvider = class CellContentProvider {
        constructor(textModelService, _modelService, _modeService, _notebookService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._modeService = _modeService;
            this._notebookService = _notebookService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._registration = textModelService.registerTextModelContentProvider(notebookCommon_1.CellUri.scheme, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            // const data = parseCellUri(resource);
            if (!data) {
                return null;
            }
            const info = getFirstNotebookInfo(this._notebookService, data.notebook);
            if (!info) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook, info.id);
            let result = null;
            for (let cell of ref.object.notebook.cells) {
                if (cell.uri.toString() === resource.toString()) {
                    const bufferFactory = {
                        create: (defaultEOL) => {
                            const newEOL = (defaultEOL === 2 /* CRLF */ ? '\r\n' : '\n');
                            cell.textBuffer.setEOL(newEOL);
                            return cell.textBuffer;
                        },
                        getFirstLineText: (limit) => {
                            return cell.textBuffer.getLineContent(1).substr(0, limit);
                        }
                    };
                    const language = cell.cellKind === notebookCommon_1.CellKind.Markdown ? this._modeService.create('markdown') : (cell.language ? this._modeService.create(cell.language) : this._modeService.createByFilepathOrFirstLine(resource, cell.textBuffer.getLineContent(1)));
                    result = this._modelService.createModel(bufferFactory, language, resource);
                    break;
                }
            }
            if (result) {
                const once = result.onWillDispose(() => {
                    once.dispose();
                    ref.dispose();
                });
            }
            return result;
        }
    };
    CellContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, modelService_1.IModelService),
        __param(2, modeService_1.IModeService),
        __param(3, notebookService_1.INotebookService),
        __param(4, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellContentProvider);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(CellContentProvider, 1 /* Starting */);
    extensions_1.registerSingleton(notebookService_1.INotebookService, notebookServiceImpl_1.NotebookService);
    extensions_1.registerSingleton(notebookEditorModelResolverService_1.INotebookEditorModelResolverService, notebookEditorModelResolverService_1.NotebookModelResolverService, true);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'notebook',
        order: 100,
        title: nls.localize('notebookConfigurationTitle', "Notebook"),
        type: 'object',
        properties: {
            'notebook.displayOrder': {
                markdownDescription: nls.localize('notebook.displayOrder.description', "Priority list for output mime types"),
                type: ['array'],
                items: {
                    type: 'string'
                },
                default: []
            }
        }
    });
});
//# __sourceMappingURL=notebook.contribution.js.map