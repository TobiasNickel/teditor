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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/characterClassifier", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/editor/common/services/editorWorkerService", "vs/editor/contrib/format/format", "vs/editor/contrib/format/formattingEdit", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/base/common/errors", "vs/platform/progress/common/progress"], function (require, exports, arrays_1, cancellation_1, keyCodes_1, lifecycle_1, editorExtensions_1, codeEditorService_1, characterClassifier_1, range_1, editorContextKeys_1, modes_1, editorWorkerService_1, format_1, formattingEdit_1, nls, commands_1, contextkey_1, instantiation_1, errors_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FormatOnType = class FormatOnType {
        constructor(editor, _workerService) {
            this._workerService = _workerService;
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._callOnModel = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._callOnDispose.add(editor.onDidChangeConfiguration(() => this._update()));
            this._callOnDispose.add(editor.onDidChangeModel(() => this._update()));
            this._callOnDispose.add(editor.onDidChangeModelLanguage(() => this._update()));
            this._callOnDispose.add(modes_1.OnTypeFormattingEditProviderRegistry.onDidChange(this._update, this));
        }
        dispose() {
            this._callOnDispose.dispose();
            this._callOnModel.dispose();
        }
        _update() {
            // clean up
            this._callOnModel.clear();
            // we are disabled
            if (!this._editor.getOption(41 /* formatOnType */)) {
                return;
            }
            // no model
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            // no support
            const [support] = modes_1.OnTypeFormattingEditProviderRegistry.ordered(model);
            if (!support || !support.autoFormatTriggerCharacters) {
                return;
            }
            // register typing listeners that will trigger the format
            let triggerChars = new characterClassifier_1.CharacterSet();
            for (let ch of support.autoFormatTriggerCharacters) {
                triggerChars.add(ch.charCodeAt(0));
            }
            this._callOnModel.add(this._editor.onDidType((text) => {
                let lastCharCode = text.charCodeAt(text.length - 1);
                if (triggerChars.has(lastCharCode)) {
                    this._trigger(String.fromCharCode(lastCharCode));
                }
            }));
        }
        _trigger(ch) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._editor.getSelections().length > 1) {
                return;
            }
            const model = this._editor.getModel();
            const position = this._editor.getPosition();
            let canceled = false;
            // install a listener that checks if edits happens before the
            // position on which we format right now. If so, we won't
            // apply the format edits
            const unbind = this._editor.onDidChangeModelContent((e) => {
                if (e.isFlush) {
                    // a model.setValue() was called
                    // cancel only once
                    canceled = true;
                    unbind.dispose();
                    return;
                }
                for (let i = 0, len = e.changes.length; i < len; i++) {
                    const change = e.changes[i];
                    if (change.range.endLineNumber <= position.lineNumber) {
                        // cancel only once
                        canceled = true;
                        unbind.dispose();
                        return;
                    }
                }
            });
            format_1.getOnTypeFormattingEdits(this._workerService, model, position, ch, model.getFormattingOptions()).then(edits => {
                unbind.dispose();
                if (canceled) {
                    return;
                }
                if (arrays_1.isNonEmptyArray(edits)) {
                    formattingEdit_1.FormattingEdit.execute(this._editor, edits, true);
                    format_1.alertFormattingEdits(edits);
                }
            }, (err) => {
                unbind.dispose();
                throw err;
            });
        }
    };
    FormatOnType.ID = 'editor.contrib.autoFormat';
    FormatOnType = __decorate([
        __param(1, editorWorkerService_1.IEditorWorkerService)
    ], FormatOnType);
    let FormatOnPaste = class FormatOnPaste {
        constructor(editor, _instantiationService) {
            this.editor = editor;
            this._instantiationService = _instantiationService;
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._callOnModel = new lifecycle_1.DisposableStore();
            this._callOnDispose.add(editor.onDidChangeConfiguration(() => this._update()));
            this._callOnDispose.add(editor.onDidChangeModel(() => this._update()));
            this._callOnDispose.add(editor.onDidChangeModelLanguage(() => this._update()));
            this._callOnDispose.add(modes_1.DocumentRangeFormattingEditProviderRegistry.onDidChange(this._update, this));
        }
        dispose() {
            this._callOnDispose.dispose();
            this._callOnModel.dispose();
        }
        _update() {
            // clean up
            this._callOnModel.clear();
            // we are disabled
            if (!this.editor.getOption(40 /* formatOnPaste */)) {
                return;
            }
            // no model
            if (!this.editor.hasModel()) {
                return;
            }
            // no formatter
            if (!modes_1.DocumentRangeFormattingEditProviderRegistry.has(this.editor.getModel())) {
                return;
            }
            this._callOnModel.add(this.editor.onDidPaste(({ range }) => this._trigger(range)));
        }
        _trigger(range) {
            if (!this.editor.hasModel()) {
                return;
            }
            if (this.editor.getSelections().length > 1) {
                return;
            }
            this._instantiationService.invokeFunction(format_1.formatDocumentRangeWithSelectedProvider, this.editor, range, 2 /* Silent */, cancellation_1.CancellationToken.None).catch(errors_1.onUnexpectedError);
        }
    };
    FormatOnPaste.ID = 'editor.contrib.formatOnPaste';
    FormatOnPaste = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], FormatOnPaste);
    class FormatDocumentAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument',
                label: nls.localize('formatDocument.label', "Format Document"),
                alias: 'Format Document',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.notInCompositeEditor, editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 36 /* KEY_F */,
                    linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 39 /* KEY_I */ },
                    weight: 100 /* EditorContrib */
                },
                contextMenuOpts: {
                    when: editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider,
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor, editor) {
            if (editor.hasModel()) {
                const instaService = accessor.get(instantiation_1.IInstantiationService);
                await instaService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editor, 1 /* Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            }
        }
    }
    class FormatSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatSelection',
                label: nls.localize('formatSelection.label', "Format Selection"),
                alias: 'Format Selection',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider),
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider),
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 36 /* KEY_F */),
                    weight: 100 /* EditorContrib */
                },
                contextMenuOpts: {
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider, editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                    group: '1_modification',
                    order: 1.31
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const model = editor.getModel();
            let range = editor.getSelection();
            if (range.isEmpty()) {
                range = new range_1.Range(range.startLineNumber, 1, range.startLineNumber, model.getLineMaxColumn(range.startLineNumber));
            }
            await instaService.invokeFunction(format_1.formatDocumentRangeWithSelectedProvider, editor, range, 1 /* Explicit */, cancellation_1.CancellationToken.None);
        }
    }
    editorExtensions_1.registerEditorContribution(FormatOnType.ID, FormatOnType);
    editorExtensions_1.registerEditorContribution(FormatOnPaste.ID, FormatOnPaste);
    editorExtensions_1.registerEditorAction(FormatDocumentAction);
    editorExtensions_1.registerEditorAction(FormatSelectionAction);
    // this is the old format action that does both (format document OR format selection)
    // and we keep it here such that existing keybinding configurations etc will still work
    commands_1.CommandsRegistry.registerCommand('editor.action.format', async (accessor) => {
        const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
        if (!editor || !editor.hasModel()) {
            return;
        }
        const commandService = accessor.get(commands_1.ICommandService);
        if (editor.getSelection().isEmpty()) {
            await commandService.executeCommand('editor.action.formatDocument');
        }
        else {
            await commandService.executeCommand('editor.action.formatSelection');
        }
    });
});
//# __sourceMappingURL=formatActions.js.map