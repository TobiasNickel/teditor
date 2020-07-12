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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/contrib/notebook/browser/notebookEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/services/editor/browser/editorDropService", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/notebookEditorWidgetService", "vs/nls"], function (require, exports, DOM, event_1, lifecycle_1, instantiation_1, storage_1, telemetry_1, themeService_1, baseEditor_1, notebookEditorInput_1, editorGroupsService_1, notebookEditorWidget_1, editorDropService_1, notification_1, editorService_1, notebookEditorWidgetService_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditor = void 0;
    const NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'NotebookEditorViewState';
    let NotebookEditor = class NotebookEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, instantiationService, storageService, _editorService, editorGroupService, _editorDropService, _notificationService, _notebookWidgetService) {
            super(NotebookEditor.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this._editorService = _editorService;
            this._editorDropService = _editorDropService;
            this._notificationService = _notificationService;
            this._notebookWidgetService = _notebookWidgetService;
            this._groupListener = this._register(new lifecycle_1.MutableDisposable());
            this._widgetDisposableStore = new lifecycle_1.DisposableStore();
            this._widget = { value: undefined };
            // todo@rebornix is there a reason that `super.fireOnDidFocus` isn't used?
            this._onDidFocusWidget = this._register(new event_1.Emitter());
            this._onDidChangeModel = this._register(new event_1.Emitter());
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._editorMemento = this.getEditorMemento(editorGroupService, NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY);
        }
        get onDidFocus() { return this._onDidFocusWidget.event; }
        set viewModel(newModel) {
            if (this._widget.value) {
                this._widget.value.viewModel = newModel;
                this._onDidChangeModel.fire();
            }
        }
        get viewModel() {
            var _a;
            return (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.viewModel;
        }
        get minimumWidth() { return 375; }
        get maximumWidth() { return Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from BaseEditor
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        //#region Editor Core
        get isNotebookEditor() {
            return true;
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.notebook-editor'));
            // this._widget.createEditor();
            this._register(this.onDidFocus(() => { var _a; return (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.updateEditorFocus(); }));
            this._register(this.onDidBlur(() => { var _a; return (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.updateEditorFocus(); }));
        }
        getDomNode() {
            return this._rootElement;
        }
        getControl() {
            return this._widget.value;
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
            this._groupListener.value = group === null || group === void 0 ? void 0 : group.onWillCloseEditor(e => this._saveEditorViewState(e.editor));
            if (!visible) {
                this._saveEditorViewState(this.input);
                if (this.input && this._widget.value) {
                    // the widget is not transfered to other editor inputs
                    this._widget.value.onWillHide();
                }
            }
        }
        focus() {
            var _a;
            super.focus();
            (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.focus();
        }
        async setInput(input, options, token) {
            const group = this.group;
            this._saveEditorViewState(this.input);
            await super.setInput(input, options, token);
            this._widgetDisposableStore.clear();
            // there currently is a widget which we still own so
            // we need to hide it before getting a new widget
            if (this._widget.value) {
                this._widget.value.onWillHide();
            }
            this._widget = this.instantiationService.invokeFunction(this._notebookWidgetService.retrieveWidget, group, input);
            if (this._dimension) {
                this._widget.value.layout(this._dimension, this._rootElement);
            }
            const model = await input.resolve(this._widget.value.getId());
            if (model === null) {
                this._notificationService.prompt(notification_1.Severity.Error, nls_1.localize('fail.noEditor', "Cannot open resource with notebook editor type '${input.viewType}', please check if you have the right extension installed or enabled."), [{
                        label: nls_1.localize('fail.reOpen', "Reopen file with VS Code standard text editor"),
                        run: async () => {
                            const fileEditorInput = this._editorService.createEditorInput({ resource: input.resource, forceFile: true });
                            const textOptions = options ? Object.assign(Object.assign({}, options), { override: false }) : { override: false };
                            await this._editorService.openEditor(fileEditorInput, textOptions);
                        }
                    }]);
                return;
            }
            const viewState = this._loadTextEditorViewState(input);
            await this._widget.value.setModel(model.notebook, viewState);
            await this._widget.value.setOptions(options instanceof notebookEditorWidget_1.NotebookEditorOptions ? options : undefined);
            this._widgetDisposableStore.add(this._widget.value.onDidFocus(() => this._onDidFocusWidget.fire()));
            this._widgetDisposableStore.add(this._editorDropService.createEditorDropTarget(this._widget.value.getDomNode(), {
                containsGroup: (group) => { var _a; return ((_a = this.group) === null || _a === void 0 ? void 0 : _a.id) === group.group.id; }
            }));
        }
        clearInput() {
            if (this._widget.value) {
                this._widget.value.onWillHide();
            }
            super.clearInput();
        }
        setOptions(options) {
            var _a;
            if (options instanceof notebookEditorWidget_1.NotebookEditorOptions) {
                (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.setOptions(options);
            }
            super.setOptions(options);
        }
        saveState() {
            this._saveEditorViewState(this.input);
            super.saveState();
        }
        _saveEditorViewState(input) {
            if (this.group && this._widget.value && input instanceof notebookEditorInput_1.NotebookEditorInput) {
                const state = this._widget.value.getEditorViewState();
                this._editorMemento.saveEditorState(this.group, input.resource, state);
            }
        }
        _loadTextEditorViewState(input) {
            if (this.group) {
                return this._editorMemento.loadEditorState(this.group, input.resource);
            }
            return;
        }
        layout(dimension) {
            var _a, _b;
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            this._dimension = dimension;
            if (!this._widget.value || !(this._input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return;
            }
            if (this._input.resource.toString() !== ((_a = this._widget.value.viewModel) === null || _a === void 0 ? void 0 : _a.uri.toString()) && ((_b = this._widget.value) === null || _b === void 0 ? void 0 : _b.viewModel)) {
                // input and widget mismatch
                // this happens when
                // 1. open document A, pin the document
                // 2. open document B
                // 3. close document B
                // 4. a layout is triggered
                return;
            }
            this._widget.value.layout(this._dimension, this._rootElement);
        }
        //#endregion
        //#region Editor Features
        //#endregion
        dispose() {
            super.dispose();
        }
        toJSON() {
            var _a;
            return {
                notebookHandle: (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.handle
            };
        }
    };
    NotebookEditor.ID = 'workbench.editor.notebook';
    NotebookEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, editorDropService_1.IEditorDropService),
        __param(7, notification_1.INotificationService),
        __param(8, notebookEditorWidgetService_1.INotebookEditorWidgetService)
    ], NotebookEditor);
    exports.NotebookEditor = NotebookEditor;
});
//# __sourceMappingURL=notebookEditor.js.map