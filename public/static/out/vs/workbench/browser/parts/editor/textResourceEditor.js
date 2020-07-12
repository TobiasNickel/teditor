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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/common/editor/textEditorModel", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/browser/parts/editor/textEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfigurationService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/modes/modesRegistry"], function (require, exports, nls, types_1, editorBrowser_1, resourceEditorInput_1, textEditorModel_1, untitledTextEditorInput_1, textEditor_1, telemetry_1, storage_1, textResourceConfigurationService_1, instantiation_1, themeService_1, event_1, editorGroupsService_1, editorService_1, modelService_1, modeService_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceEditor = exports.AbstractTextResourceEditor = void 0;
    /**
     * An editor implementation that is capable of showing the contents of resource inputs. Uses
     * the TextEditor widget to show the contents.
     */
    let AbstractTextResourceEditor = class AbstractTextResourceEditor extends textEditor_1.BaseTextEditor {
        constructor(id, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService) {
            super(id, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return nls.localize('textEditor', "Text Editor");
        }
        async setInput(input, options, token) {
            // Remember view settings if input changes
            this.saveTextResourceEditorViewState(this.input);
            // Set input and resolve
            await super.setInput(input, options, token);
            const resolvedModel = await input.resolve();
            // Check for cancellation
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Assert Model instance
            if (!(resolvedModel instanceof textEditorModel_1.BaseTextEditorModel)) {
                throw new Error('Unable to open file as text');
            }
            // Set Editor Model
            const textEditor = types_1.assertIsDefined(this.getControl());
            const textEditorModel = resolvedModel.textEditorModel;
            textEditor.setModel(textEditorModel);
            // Apply Options from TextOptions
            let optionsGotApplied = false;
            const textOptions = options;
            if (textOptions && types_1.isFunction(textOptions.apply)) {
                optionsGotApplied = textOptions.apply(textEditor, 1 /* Immediate */);
            }
            // Otherwise restore View State
            if (!optionsGotApplied) {
                this.restoreTextResourceEditorViewState(input, textEditor);
            }
            // Since the resolved model provides information about being readonly
            // or not, we apply it here to the editor even though the editor input
            // was already asked for being readonly or not. The rationale is that
            // a resolved model might have more specific information about being
            // readonly or not that the input did not have.
            textEditor.updateOptions({ readOnly: resolvedModel.isReadonly() });
        }
        restoreTextResourceEditorViewState(editor, control) {
            if (editor instanceof untitledTextEditorInput_1.UntitledTextEditorInput || editor instanceof resourceEditorInput_1.ResourceEditorInput) {
                const viewState = this.loadTextEditorViewState(editor.resource);
                if (viewState) {
                    control.restoreViewState(viewState);
                }
            }
        }
        /**
         * Reveals the last line of this editor if it has a model set.
         */
        revealLastLine() {
            const codeEditor = this.getControl();
            const model = codeEditor.getModel();
            if (model) {
                const lastLine = model.getLineCount();
                codeEditor.revealPosition({ lineNumber: lastLine, column: model.getLineMaxColumn(lastLine) }, 0 /* Smooth */);
            }
        }
        clearInput() {
            // Keep editor view state in settings to restore when coming back
            this.saveTextResourceEditorViewState(this.input);
            // Clear Model
            const textEditor = this.getControl();
            if (textEditor) {
                textEditor.setModel(null);
            }
            super.clearInput();
        }
        saveState() {
            // Save View State (only for untitled)
            if (this.input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                this.saveTextResourceEditorViewState(this.input);
            }
            super.saveState();
        }
        saveTextResourceEditorViewState(input) {
            if (!(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) && !(input instanceof resourceEditorInput_1.ResourceEditorInput)) {
                return; // only enabled for untitled and resource inputs
            }
            const resource = input.resource;
            // Clear view state if input is disposed
            if (input.isDisposed()) {
                super.clearTextEditorViewState([resource]);
            }
            // Otherwise save it
            else {
                super.saveTextEditorViewState(resource);
                // Make sure to clean up when the input gets disposed
                event_1.Event.once(input.onDispose)(() => {
                    super.clearTextEditorViewState([resource]);
                });
            }
        }
    };
    AbstractTextResourceEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, editorService_1.IEditorService)
    ], AbstractTextResourceEditor);
    exports.AbstractTextResourceEditor = AbstractTextResourceEditor;
    let TextResourceEditor = class TextResourceEditor extends AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService, modelService, modeService) {
            super(TextResourceEditor.ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService);
            this.modelService = modelService;
            this.modeService = modeService;
        }
        createEditorControl(parent, configuration) {
            const control = super.createEditorControl(parent, configuration);
            // Install a listener for paste to update this editors
            // language mode if the paste includes a specific mode
            const codeEditor = editorBrowser_1.getCodeEditor(control);
            if (codeEditor) {
                this._register(codeEditor.onDidPaste(e => this.onDidEditorPaste(e, codeEditor)));
            }
            return control;
        }
        onDidEditorPaste(e, codeEditor) {
            if (this.input instanceof untitledTextEditorInput_1.UntitledTextEditorInput && this.input.model.hasModeSetExplicitly) {
                return; // do not override mode if it was set explicitly
            }
            if (e.range.startLineNumber !== 1 || e.range.startColumn !== 1) {
                return; // only when pasting into first line, first column (= empty document)
            }
            if (codeEditor.getOption(72 /* readOnly */)) {
                return; // not for readonly editors
            }
            const textModel = codeEditor.getModel();
            if (!textModel) {
                return; // require a live model
            }
            const currentMode = textModel.getModeId();
            if (currentMode !== modesRegistry_1.PLAINTEXT_MODE_ID) {
                return; // require current mode to be unspecific
            }
            let candidateMode = undefined;
            // A mode is provided via the paste event so text was copied using
            // VSCode. As such we trust this mode and use it if specific
            if (e.mode) {
                candidateMode = e.mode;
            }
            // A mode was not provided, so the data comes from outside VSCode
            // We can still try to guess a good mode from the first line if
            // the paste changed the first line
            else {
                candidateMode = types_1.withNullAsUndefined(this.modeService.getModeIdByFilepathOrFirstLine(textModel.uri, textModel.getLineContent(1).substr(0, 1000 /* FIRST_LINE_DETECTION_LENGTH_LIMIT */)));
            }
            // Finally apply mode to model if specified
            if (candidateMode !== modesRegistry_1.PLAINTEXT_MODE_ID) {
                this.modelService.setMode(textModel, this.modeService.create(candidateMode));
            }
        }
    };
    TextResourceEditor.ID = 'workbench.editors.textResourceEditor';
    TextResourceEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, modelService_1.IModelService),
        __param(8, modeService_1.IModeService)
    ], TextResourceEditor);
    exports.TextResourceEditor = TextResourceEditor;
});
//# __sourceMappingURL=textResourceEditor.js.map