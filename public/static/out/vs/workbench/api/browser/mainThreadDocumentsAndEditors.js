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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/modelService", "vs/editor/common/services/resolverService", "vs/platform/files/common/files", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/browser/mainThreadDocuments", "vs/workbench/api/browser/mainThreadEditor", "vs/workbench/api/browser/mainThreadEditors", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/shared/editor", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/uriIdentity/common/uriIdentity", "vs/platform/clipboard/common/clipboardService"], function (require, exports, event_1, lifecycle_1, editorBrowser_1, bulkEditService_1, codeEditorService_1, modelService_1, resolverService_1, files_1, extHostCustomers_1, mainThreadDocuments_1, mainThreadEditor_1, mainThreadEditors_1, extHost_protocol_1, editor_1, textEditor_1, editorService_1, editorGroupsService_1, panelService_1, textfiles_1, environmentService_1, workingCopyFileService_1, uriIdentity_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDocumentsAndEditors = void 0;
    var delta;
    (function (delta) {
        function ofSets(before, after) {
            const removed = [];
            const added = [];
            for (let element of before) {
                if (!after.has(element)) {
                    removed.push(element);
                }
            }
            for (let element of after) {
                if (!before.has(element)) {
                    added.push(element);
                }
            }
            return { removed, added };
        }
        delta.ofSets = ofSets;
        function ofMaps(before, after) {
            const removed = [];
            const added = [];
            for (let [index, value] of before) {
                if (!after.has(index)) {
                    removed.push(value);
                }
            }
            for (let [index, value] of after) {
                if (!before.has(index)) {
                    added.push(value);
                }
            }
            return { removed, added };
        }
        delta.ofMaps = ofMaps;
    })(delta || (delta = {}));
    class TextEditorSnapshot {
        constructor(editor) {
            this.editor = editor;
            this.id = `${editor.getId()},${editor.getModel().id}`;
        }
    }
    class DocumentAndEditorStateDelta {
        constructor(removedDocuments, addedDocuments, removedEditors, addedEditors, oldActiveEditor, newActiveEditor) {
            this.removedDocuments = removedDocuments;
            this.addedDocuments = addedDocuments;
            this.removedEditors = removedEditors;
            this.addedEditors = addedEditors;
            this.oldActiveEditor = oldActiveEditor;
            this.newActiveEditor = newActiveEditor;
            this.isEmpty = this.removedDocuments.length === 0
                && this.addedDocuments.length === 0
                && this.removedEditors.length === 0
                && this.addedEditors.length === 0
                && oldActiveEditor === newActiveEditor;
        }
        toString() {
            let ret = 'DocumentAndEditorStateDelta\n';
            ret += `\tRemoved Documents: [${this.removedDocuments.map(d => d.uri.toString(true)).join(', ')}]\n`;
            ret += `\tAdded Documents: [${this.addedDocuments.map(d => d.uri.toString(true)).join(', ')}]\n`;
            ret += `\tRemoved Editors: [${this.removedEditors.map(e => e.id).join(', ')}]\n`;
            ret += `\tAdded Editors: [${this.addedEditors.map(e => e.id).join(', ')}]\n`;
            ret += `\tNew Active Editor: ${this.newActiveEditor}\n`;
            return ret;
        }
    }
    class DocumentAndEditorState {
        constructor(documents, textEditors, activeEditor) {
            this.documents = documents;
            this.textEditors = textEditors;
            this.activeEditor = activeEditor;
            //
        }
        static compute(before, after) {
            if (!before) {
                return new DocumentAndEditorStateDelta([], [...after.documents.values()], [], [...after.textEditors.values()], undefined, after.activeEditor);
            }
            const documentDelta = delta.ofSets(before.documents, after.documents);
            const editorDelta = delta.ofMaps(before.textEditors, after.textEditors);
            const oldActiveEditor = before.activeEditor !== after.activeEditor ? before.activeEditor : undefined;
            const newActiveEditor = before.activeEditor !== after.activeEditor ? after.activeEditor : undefined;
            return new DocumentAndEditorStateDelta(documentDelta.removed, documentDelta.added, editorDelta.removed, editorDelta.added, oldActiveEditor, newActiveEditor);
        }
    }
    var ActiveEditorOrder;
    (function (ActiveEditorOrder) {
        ActiveEditorOrder[ActiveEditorOrder["Editor"] = 0] = "Editor";
        ActiveEditorOrder[ActiveEditorOrder["Panel"] = 1] = "Panel";
    })(ActiveEditorOrder || (ActiveEditorOrder = {}));
    let MainThreadDocumentAndEditorStateComputer = class MainThreadDocumentAndEditorStateComputer {
        constructor(_onDidChangeState, _modelService, _codeEditorService, _editorService, _panelService) {
            this._onDidChangeState = _onDidChangeState;
            this._modelService = _modelService;
            this._codeEditorService = _codeEditorService;
            this._editorService = _editorService;
            this._panelService = _panelService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._toDisposeOnEditorRemove = new Map();
            this._activeEditorOrder = 0 /* Editor */;
            this._modelService.onModelAdded(this._updateStateOnModelAdd, this, this._toDispose);
            this._modelService.onModelRemoved(_ => this._updateState(), this, this._toDispose);
            this._editorService.onDidActiveEditorChange(_ => this._updateState(), this, this._toDispose);
            this._codeEditorService.onCodeEditorAdd(this._onDidAddEditor, this, this._toDispose);
            this._codeEditorService.onCodeEditorRemove(this._onDidRemoveEditor, this, this._toDispose);
            this._codeEditorService.listCodeEditors().forEach(this._onDidAddEditor, this);
            this._panelService.onDidPanelOpen(_ => this._activeEditorOrder = 1 /* Panel */, undefined, this._toDispose);
            this._panelService.onDidPanelClose(_ => this._activeEditorOrder = 0 /* Editor */, undefined, this._toDispose);
            this._editorService.onDidVisibleEditorsChange(_ => this._activeEditorOrder = 0 /* Editor */, undefined, this._toDispose);
            this._updateState();
        }
        dispose() {
            this._toDispose.dispose();
        }
        _onDidAddEditor(e) {
            this._toDisposeOnEditorRemove.set(e.getId(), lifecycle_1.combinedDisposable(e.onDidChangeModel(() => this._updateState()), e.onDidFocusEditorText(() => this._updateState()), e.onDidFocusEditorWidget(() => this._updateState(e))));
            this._updateState();
        }
        _onDidRemoveEditor(e) {
            const sub = this._toDisposeOnEditorRemove.get(e.getId());
            if (sub) {
                this._toDisposeOnEditorRemove.delete(e.getId());
                sub.dispose();
                this._updateState();
            }
        }
        _updateStateOnModelAdd(model) {
            if (!modelService_1.shouldSynchronizeModel(model)) {
                // ignore
                return;
            }
            if (!this._currentState) {
                // too early
                this._updateState();
                return;
            }
            // small (fast) delta
            this._currentState = new DocumentAndEditorState(this._currentState.documents.add(model), this._currentState.textEditors, this._currentState.activeEditor);
            this._onDidChangeState(new DocumentAndEditorStateDelta([], [model], [], [], undefined, undefined));
        }
        _updateState(widgetFocusCandidate) {
            // models: ignore too large models
            const models = new Set();
            for (const model of this._modelService.getModels()) {
                if (modelService_1.shouldSynchronizeModel(model)) {
                    models.add(model);
                }
            }
            // editor: only take those that have a not too large model
            const editors = new Map();
            let activeEditor = null; // Strict null work. This doesn't like being undefined!
            for (const editor of this._codeEditorService.listCodeEditors()) {
                if (editor.isSimpleWidget) {
                    continue;
                }
                const model = editor.getModel();
                if (editor.hasModel() && model && modelService_1.shouldSynchronizeModel(model)
                    && !model.isDisposed() // model disposed
                    && Boolean(this._modelService.getModel(model.uri)) // model disposing, the flag didn't flip yet but the model service already removed it
                ) {
                    const apiEditor = new TextEditorSnapshot(editor);
                    editors.set(apiEditor.id, apiEditor);
                    if (editor.hasTextFocus() || (widgetFocusCandidate === editor && editor.hasWidgetFocus())) {
                        // text focus has priority, widget focus is tricky because multiple
                        // editors might claim widget focus at the same time. therefore we use a
                        // candidate (which is the editor that has raised an widget focus event)
                        // in addition to the widget focus check
                        activeEditor = apiEditor.id;
                    }
                }
            }
            // active editor: if none of the previous editors had focus we try
            // to match output panels or the active workbench editor with
            // one of editor we have just computed
            if (!activeEditor) {
                let candidate;
                if (this._activeEditorOrder === 0 /* Editor */) {
                    candidate = this._getActiveEditorFromEditorPart() || this._getActiveEditorFromPanel();
                }
                else {
                    candidate = this._getActiveEditorFromPanel() || this._getActiveEditorFromEditorPart();
                }
                if (candidate) {
                    for (const snapshot of editors.values()) {
                        if (candidate === snapshot.editor) {
                            activeEditor = snapshot.id;
                        }
                    }
                }
            }
            // compute new state and compare against old
            const newState = new DocumentAndEditorState(models, editors, activeEditor);
            const delta = DocumentAndEditorState.compute(this._currentState, newState);
            if (!delta.isEmpty) {
                this._currentState = newState;
                this._onDidChangeState(delta);
            }
        }
        _getActiveEditorFromPanel() {
            const panel = this._panelService.getActivePanel();
            if (panel instanceof textEditor_1.BaseTextEditor && editorBrowser_1.isCodeEditor(panel.getControl())) {
                return panel.getControl();
            }
            else {
                return undefined;
            }
        }
        _getActiveEditorFromEditorPart() {
            let activeTextEditorControl = this._editorService.activeTextEditorControl;
            if (editorBrowser_1.isDiffEditor(activeTextEditorControl)) {
                activeTextEditorControl = activeTextEditorControl.getModifiedEditor();
            }
            return activeTextEditorControl;
        }
    };
    MainThreadDocumentAndEditorStateComputer = __decorate([
        __param(1, modelService_1.IModelService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, editorService_1.IEditorService),
        __param(4, panelService_1.IPanelService)
    ], MainThreadDocumentAndEditorStateComputer);
    let MainThreadDocumentsAndEditors = class MainThreadDocumentsAndEditors {
        constructor(extHostContext, _modelService, _textFileService, _editorService, codeEditorService, fileService, textModelResolverService, _editorGroupService, bulkEditService, panelService, environmentService, workingCopyFileService, uriIdentityService, _clipboardService) {
            this._modelService = _modelService;
            this._textFileService = _textFileService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._clipboardService = _clipboardService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._textEditors = new Map();
            this._onTextEditorAdd = new event_1.Emitter();
            this._onTextEditorRemove = new event_1.Emitter();
            this._onDocumentAdd = new event_1.Emitter();
            this._onDocumentRemove = new event_1.Emitter();
            this.onTextEditorAdd = this._onTextEditorAdd.event;
            this.onTextEditorRemove = this._onTextEditorRemove.event;
            this.onDocumentAdd = this._onDocumentAdd.event;
            this.onDocumentRemove = this._onDocumentRemove.event;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentsAndEditors);
            const mainThreadDocuments = this._toDispose.add(new mainThreadDocuments_1.MainThreadDocuments(this, extHostContext, this._modelService, this._textFileService, fileService, textModelResolverService, environmentService, uriIdentityService, workingCopyFileService));
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadDocuments, mainThreadDocuments);
            const mainThreadTextEditors = this._toDispose.add(new mainThreadEditors_1.MainThreadTextEditors(this, extHostContext, codeEditorService, bulkEditService, this._editorService, this._editorGroupService));
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadTextEditors, mainThreadTextEditors);
            // It is expected that the ctor of the state computer calls our `_onDelta`.
            this._toDispose.add(new MainThreadDocumentAndEditorStateComputer(delta => this._onDelta(delta), _modelService, codeEditorService, this._editorService, panelService));
            this._toDispose.add(this._onTextEditorAdd);
            this._toDispose.add(this._onTextEditorRemove);
            this._toDispose.add(this._onDocumentAdd);
            this._toDispose.add(this._onDocumentRemove);
        }
        dispose() {
            this._toDispose.dispose();
        }
        _onDelta(delta) {
            let removedDocuments;
            const removedEditors = [];
            const addedEditors = [];
            // removed models
            removedDocuments = delta.removedDocuments.map(m => m.uri);
            // added editors
            for (const apiEditor of delta.addedEditors) {
                const mainThreadEditor = new mainThreadEditor_1.MainThreadTextEditor(apiEditor.id, apiEditor.editor.getModel(), apiEditor.editor, { onGainedFocus() { }, onLostFocus() { } }, this._modelService, this._clipboardService);
                this._textEditors.set(apiEditor.id, mainThreadEditor);
                addedEditors.push(mainThreadEditor);
            }
            // removed editors
            for (const { id } of delta.removedEditors) {
                const mainThreadEditor = this._textEditors.get(id);
                if (mainThreadEditor) {
                    mainThreadEditor.dispose();
                    this._textEditors.delete(id);
                    removedEditors.push(id);
                }
            }
            const extHostDelta = Object.create(null);
            let empty = true;
            if (delta.newActiveEditor !== undefined) {
                empty = false;
                extHostDelta.newActiveEditor = delta.newActiveEditor;
            }
            if (removedDocuments.length > 0) {
                empty = false;
                extHostDelta.removedDocuments = removedDocuments;
            }
            if (removedEditors.length > 0) {
                empty = false;
                extHostDelta.removedEditors = removedEditors;
            }
            if (delta.addedDocuments.length > 0) {
                empty = false;
                extHostDelta.addedDocuments = delta.addedDocuments.map(m => this._toModelAddData(m));
            }
            if (delta.addedEditors.length > 0) {
                empty = false;
                extHostDelta.addedEditors = addedEditors.map(e => this._toTextEditorAddData(e));
            }
            if (!empty) {
                // first update ext host
                this._proxy.$acceptDocumentsAndEditorsDelta(extHostDelta);
                // second update dependent state listener
                this._onDocumentRemove.fire(removedDocuments);
                this._onDocumentAdd.fire(delta.addedDocuments);
                this._onTextEditorRemove.fire(removedEditors);
                this._onTextEditorAdd.fire(addedEditors);
            }
        }
        _toModelAddData(model) {
            return {
                uri: model.uri,
                versionId: model.getVersionId(),
                lines: model.getLinesContent(),
                EOL: model.getEOL(),
                modeId: model.getLanguageIdentifier().language,
                isDirty: this._textFileService.isDirty(model.uri)
            };
        }
        _toTextEditorAddData(textEditor) {
            const props = textEditor.getProperties();
            return {
                id: textEditor.getId(),
                documentUri: textEditor.getModel().uri,
                options: props.options,
                selections: props.selections,
                visibleRanges: props.visibleRanges,
                editorPosition: this._findEditorPosition(textEditor)
            };
        }
        _findEditorPosition(editor) {
            for (const editorPane of this._editorService.visibleEditorPanes) {
                if (editor.matches(editorPane)) {
                    return editor_1.editorGroupToViewColumn(this._editorGroupService, editorPane.group);
                }
            }
            return undefined;
        }
        findTextEditorIdFor(editorPane) {
            for (const [id, editor] of this._textEditors) {
                if (editor.matches(editorPane)) {
                    return id;
                }
            }
            return undefined;
        }
        getEditor(id) {
            return this._textEditors.get(id);
        }
    };
    MainThreadDocumentsAndEditors = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, modelService_1.IModelService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorService_1.IEditorService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, files_1.IFileService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, bulkEditService_1.IBulkEditService),
        __param(9, panelService_1.IPanelService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, workingCopyFileService_1.IWorkingCopyFileService),
        __param(12, uriIdentity_1.IUriIdentityService),
        __param(13, clipboardService_1.IClipboardService)
    ], MainThreadDocumentsAndEditors);
    exports.MainThreadDocumentsAndEditors = MainThreadDocumentsAndEditors;
});
//# __sourceMappingURL=mainThreadDocumentsAndEditors.js.map