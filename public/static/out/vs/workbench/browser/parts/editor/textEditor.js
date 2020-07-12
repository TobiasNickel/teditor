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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/types", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/editor/common/services/textResourceConfigurationService", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle"], function (require, exports, nls_1, objects_1, event_1, types_1, codeEditorWidget_1, editor_1, baseEditor_1, storage_1, instantiation_1, telemetry_1, themeService_1, textResourceConfigurationService_1, editorBrowser_1, editorGroupsService_1, editorService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseTextEditor = void 0;
    /**
     * The base class of editors that leverage the text editor for the editing experience. This class is only intended to
     * be subclassed and not instantiated.
     */
    let BaseTextEditor = class BaseTextEditor extends baseEditor_1.BaseEditor {
        constructor(id, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService) {
            super(id, telemetryService, themeService, storageService);
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.themeService = themeService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.groupListener = this._register(new lifecycle_1.MutableDisposable());
            this._instantiationService = instantiationService;
            this.editorMemento = this.getEditorMemento(editorGroupService, BaseTextEditor.TEXT_EDITOR_VIEW_STATE_PREFERENCE_KEY, 100);
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(e => {
                const resource = this.getActiveResource();
                const value = resource ? this.textResourceConfigurationService.getValue(resource) : undefined;
                return this.handleConfigurationChangeEvent(value);
            }));
            // ARIA: if a group is added or removed, update the editor's ARIA
            // label so that it appears in the label for when there are > 1 groups
            this._register(event_1.Event.any(this.editorGroupService.onDidAddGroup, this.editorGroupService.onDidRemoveGroup)(() => {
                var _a, _b;
                const ariaLabel = this.computeAriaLabel();
                (_a = this.editorContainer) === null || _a === void 0 ? void 0 : _a.setAttribute('aria-label', ariaLabel);
                (_b = this.editorControl) === null || _b === void 0 ? void 0 : _b.updateOptions({ ariaLabel });
            }));
            this.updateRestoreViewStateConfiguration();
        }
        get shouldRestoreViewState() { return this._shouldRestoreViewState; }
        get instantiationService() { return this._instantiationService; }
        set instantiationService(value) { this._instantiationService = value; }
        handleConfigurationChangeEvent(configuration) {
            this.updateRestoreViewStateConfiguration();
            if (this.isVisible()) {
                this.updateEditorConfiguration(configuration);
            }
            else {
                this.hasPendingConfigurationChange = true;
            }
        }
        updateRestoreViewStateConfiguration() {
            var _a;
            this._shouldRestoreViewState = (_a = this.textResourceConfigurationService.getValue(undefined, 'workbench.editor.restoreViewState')) !== null && _a !== void 0 ? _a : true /* default */;
        }
        consumePendingConfigurationChangeEvent() {
            if (this.hasPendingConfigurationChange) {
                this.updateEditorConfiguration();
                this.hasPendingConfigurationChange = false;
            }
        }
        computeConfiguration(configuration) {
            // Specific editor options always overwrite user configuration
            const editorConfiguration = types_1.isObject(configuration.editor) ? objects_1.deepClone(configuration.editor) : Object.create(null);
            Object.assign(editorConfiguration, this.getConfigurationOverrides());
            // ARIA label
            editorConfiguration.ariaLabel = this.computeAriaLabel();
            return editorConfiguration;
        }
        computeAriaLabel() {
            return this._input ? editor_1.computeEditorAriaLabel(this._input, undefined, this.group, this.editorGroupService.count) : nls_1.localize('editor', "Editor");
        }
        getConfigurationOverrides() {
            var _a;
            return {
                overviewRulerLanes: 3,
                lineNumbersMinChars: 3,
                fixedOverflowWidgets: true,
                readOnly: (_a = this.input) === null || _a === void 0 ? void 0 : _a.isReadonly(),
                // render problems even in readonly editors
                // https://github.com/microsoft/vscode/issues/89057
                renderValidationDecorations: 'on'
            };
        }
        createEditor(parent) {
            // Editor for Text
            this.editorContainer = parent;
            this.editorControl = this._register(this.createEditorControl(parent, this.computeConfiguration(this.textResourceConfigurationService.getValue(this.getActiveResource()))));
            // Model & Language changes
            const codeEditor = editorBrowser_1.getCodeEditor(this.editorControl);
            if (codeEditor) {
                this._register(codeEditor.onDidChangeModelLanguage(() => this.updateEditorConfiguration()));
                this._register(codeEditor.onDidChangeModel(() => this.updateEditorConfiguration()));
            }
        }
        /**
         * This method creates and returns the text editor control to be used. Subclasses can override to
         * provide their own editor control that should be used (e.g. a DiffEditor).
         *
         * The passed in configuration object should be passed to the editor control when creating it.
         */
        createEditorControl(parent, configuration) {
            // Use a getter for the instantiation service since some subclasses might use scoped instantiation services
            return this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, configuration, {});
        }
        async setInput(input, options, token) {
            await super.setInput(input, options, token);
            // Update editor options after having set the input. We do this because there can be
            // editor input specific options (e.g. an ARIA label depending on the input showing)
            this.updateEditorConfiguration();
            // Update aria label on editor
            const editorContainer = types_1.assertIsDefined(this.editorContainer);
            editorContainer.setAttribute('aria-label', this.computeAriaLabel());
        }
        setOptions(options) {
            const textOptions = options;
            if (textOptions && types_1.isFunction(textOptions.apply)) {
                const textEditor = types_1.assertIsDefined(this.getControl());
                textOptions.apply(textEditor, 0 /* Smooth */);
            }
        }
        setEditorVisible(visible, group) {
            // Pass on to Editor
            const editorControl = types_1.assertIsDefined(this.editorControl);
            if (visible) {
                this.consumePendingConfigurationChangeEvent();
                editorControl.onVisible();
            }
            else {
                editorControl.onHide();
            }
            // Listen to close events to trigger `onWillCloseEditorInGroup`
            this.groupListener.value = group === null || group === void 0 ? void 0 : group.onWillCloseEditor(e => this.onWillCloseEditor(e));
            super.setEditorVisible(visible, group);
        }
        onWillCloseEditor(e) {
            const editor = e.editor;
            if (editor === this.input) {
                this.onWillCloseEditorInGroup(editor);
            }
        }
        onWillCloseEditorInGroup(editor) {
            // Subclasses can override
        }
        focus() {
            // Pass on to Editor
            const editorControl = types_1.assertIsDefined(this.editorControl);
            editorControl.focus();
        }
        layout(dimension) {
            // Pass on to Editor
            const editorControl = types_1.assertIsDefined(this.editorControl);
            editorControl.layout(dimension);
        }
        getControl() {
            return this.editorControl;
        }
        saveTextEditorViewState(resource) {
            const editorViewState = this.retrieveTextEditorViewState(resource);
            if (!editorViewState || !this.group) {
                return;
            }
            this.editorMemento.saveEditorState(this.group, resource, editorViewState);
        }
        getViewState() {
            var _a;
            const resource = (_a = this.input) === null || _a === void 0 ? void 0 : _a.resource;
            if (resource) {
                return types_1.withNullAsUndefined(this.retrieveTextEditorViewState(resource));
            }
            return undefined;
        }
        retrieveTextEditorViewState(resource) {
            const control = this.getControl();
            if (!editorBrowser_1.isCodeEditor(control)) {
                return null;
            }
            const model = control.getModel();
            if (!model) {
                return null; // view state always needs a model
            }
            const modelUri = model.uri;
            if (!modelUri) {
                return null; // model URI is needed to make sure we save the view state correctly
            }
            if (modelUri.toString() !== resource.toString()) {
                return null; // prevent saving view state for a model that is not the expected one
            }
            return control.saveViewState();
        }
        loadTextEditorViewState(resource) {
            return this.group ? this.editorMemento.loadEditorState(this.group, resource) : undefined;
        }
        moveTextEditorViewState(source, target, comparer) {
            return this.editorMemento.moveEditorState(source, target, comparer);
        }
        clearTextEditorViewState(resources, group) {
            resources.forEach(resource => {
                this.editorMemento.clearEditorState(resource, group);
            });
        }
        updateEditorConfiguration(configuration) {
            if (!configuration) {
                const resource = this.getActiveResource();
                if (resource) {
                    configuration = this.textResourceConfigurationService.getValue(resource);
                }
            }
            if (!this.editorControl || !configuration) {
                return;
            }
            const editorConfiguration = this.computeConfiguration(configuration);
            // Try to figure out the actual editor options that changed from the last time we updated the editor.
            // We do this so that we are not overwriting some dynamic editor settings (e.g. word wrap) that might
            // have been applied to the editor directly.
            let editorSettingsToApply = editorConfiguration;
            if (this.lastAppliedEditorOptions) {
                editorSettingsToApply = objects_1.distinct(this.lastAppliedEditorOptions, editorSettingsToApply);
            }
            if (Object.keys(editorSettingsToApply).length > 0) {
                this.lastAppliedEditorOptions = editorConfiguration;
                this.editorControl.updateOptions(editorSettingsToApply);
            }
        }
        getActiveResource() {
            const codeEditor = editorBrowser_1.getCodeEditor(this.editorControl);
            if (codeEditor) {
                const model = codeEditor.getModel();
                if (model) {
                    return model.uri;
                }
            }
            if (this.input) {
                return this.input.resource;
            }
            return undefined;
        }
        dispose() {
            this.lastAppliedEditorOptions = undefined;
            super.dispose();
        }
    };
    BaseTextEditor.TEXT_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'textEditorViewState';
    BaseTextEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService)
    ], BaseTextEditor);
    exports.BaseTextEditor = BaseTextEditor;
});
//# __sourceMappingURL=textEditor.js.map