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
define(["require", "exports", "vs/base/common/strings", "vs/editor/browser/services/codeEditorService", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/codeActionCommands", "vs/editor/contrib/codeAction/types", "vs/editor/contrib/format/format", "vs/editor/contrib/snippet/snippetController2", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform"], function (require, exports, strings, codeEditorService_1, trimTrailingWhitespaceCommand_1, editOperation_1, position_1, range_1, codeAction_1, codeActionCommands_1, types_1, format_1, snippetController2_1, nls_1, configuration_1, instantiation_1, progress_1, textfiles_1, lifecycle_1, contributions_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipantsContribution = exports.TrimFinalNewLinesParticipant = exports.FinalNewLineParticipant = exports.TrimWhitespaceParticipant = void 0;
    let TrimWhitespaceParticipant = class TrimWhitespaceParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, env) {
            if (!model.textEditorModel) {
                return;
            }
            if (this.configurationService.getValue('files.trimTrailingWhitespace', { overrideIdentifier: model.textEditorModel.getLanguageIdentifier().language, resource: model.resource })) {
                this.doTrimTrailingWhitespace(model.textEditorModel, env.reason === 2 /* AUTO */);
            }
        }
        doTrimTrailingWhitespace(model, isAutoSaved) {
            let prevSelection = [];
            let cursors = [];
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                // Find `prevSelection` in any case do ensure a good undo stack when pushing the edit
                // Collect active cursors in `cursors` only if `isAutoSaved` to avoid having the cursors jump
                prevSelection = editor.getSelections();
                if (isAutoSaved) {
                    cursors = prevSelection.map(s => s.getPosition());
                    const snippetsRange = snippetController2_1.SnippetController2.get(editor).getSessionEnclosingRange();
                    if (snippetsRange) {
                        for (let lineNumber = snippetsRange.startLineNumber; lineNumber <= snippetsRange.endLineNumber; lineNumber++) {
                            cursors.push(new position_1.Position(lineNumber, model.getLineMaxColumn(lineNumber)));
                        }
                    }
                }
            }
            const ops = trimTrailingWhitespaceCommand_1.trimTrailingWhitespace(model, cursors);
            if (!ops.length) {
                return; // Nothing to do
            }
            model.pushEditOperations(prevSelection, ops, (_edits) => prevSelection);
        }
    };
    TrimWhitespaceParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], TrimWhitespaceParticipant);
    exports.TrimWhitespaceParticipant = TrimWhitespaceParticipant;
    function findEditor(model, codeEditorService) {
        let candidate = null;
        if (model.isAttachedToEditor()) {
            for (const editor of codeEditorService.listCodeEditors()) {
                if (editor.hasModel() && editor.getModel() === model) {
                    if (editor.hasTextFocus()) {
                        return editor; // favour focused editor if there are multiple
                    }
                    candidate = editor;
                }
            }
        }
        return candidate;
    }
    let FinalNewLineParticipant = class FinalNewLineParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, _env) {
            if (!model.textEditorModel) {
                return;
            }
            if (this.configurationService.getValue('files.insertFinalNewline', { overrideIdentifier: model.textEditorModel.getLanguageIdentifier().language, resource: model.resource })) {
                this.doInsertFinalNewLine(model.textEditorModel);
            }
        }
        doInsertFinalNewLine(model) {
            const lineCount = model.getLineCount();
            const lastLine = model.getLineContent(lineCount);
            const lastLineIsEmptyOrWhitespace = strings.lastNonWhitespaceIndex(lastLine) === -1;
            if (!lineCount || lastLineIsEmptyOrWhitespace) {
                return;
            }
            const edits = [editOperation_1.EditOperation.insert(new position_1.Position(lineCount, model.getLineMaxColumn(lineCount)), model.getEOL())];
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                editor.executeEdits('insertFinalNewLine', edits, editor.getSelections());
            }
            else {
                model.pushEditOperations([], edits, () => null);
            }
        }
    };
    FinalNewLineParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], FinalNewLineParticipant);
    exports.FinalNewLineParticipant = FinalNewLineParticipant;
    let TrimFinalNewLinesParticipant = class TrimFinalNewLinesParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, env) {
            if (!model.textEditorModel) {
                return;
            }
            if (this.configurationService.getValue('files.trimFinalNewlines', { overrideIdentifier: model.textEditorModel.getLanguageIdentifier().language, resource: model.resource })) {
                this.doTrimFinalNewLines(model.textEditorModel, env.reason === 2 /* AUTO */);
            }
        }
        /**
         * returns 0 if the entire file is empty or whitespace only
         */
        findLastLineWithContent(model) {
            for (let lineNumber = model.getLineCount(); lineNumber >= 1; lineNumber--) {
                const lineContent = model.getLineContent(lineNumber);
                if (strings.lastNonWhitespaceIndex(lineContent) !== -1) {
                    // this line has content
                    return lineNumber;
                }
            }
            // no line has content
            return 0;
        }
        doTrimFinalNewLines(model, isAutoSaved) {
            const lineCount = model.getLineCount();
            // Do not insert new line if file does not end with new line
            if (lineCount === 1) {
                return;
            }
            let prevSelection = [];
            let cannotTouchLineNumber = 0;
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                prevSelection = editor.getSelections();
                if (isAutoSaved) {
                    for (let i = 0, len = prevSelection.length; i < len; i++) {
                        const positionLineNumber = prevSelection[i].positionLineNumber;
                        if (positionLineNumber > cannotTouchLineNumber) {
                            cannotTouchLineNumber = positionLineNumber;
                        }
                    }
                }
            }
            const lastLineNumberWithContent = this.findLastLineWithContent(model);
            const deleteFromLineNumber = Math.max(lastLineNumberWithContent + 1, cannotTouchLineNumber + 1);
            const deletionRange = model.validateRange(new range_1.Range(deleteFromLineNumber, 1, lineCount, model.getLineMaxColumn(lineCount)));
            if (deletionRange.isEmpty()) {
                return;
            }
            model.pushEditOperations(prevSelection, [editOperation_1.EditOperation.delete(deletionRange)], _edits => prevSelection);
            if (editor) {
                editor.setSelections(prevSelection);
            }
        }
    };
    TrimFinalNewLinesParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], TrimFinalNewLinesParticipant);
    exports.TrimFinalNewLinesParticipant = TrimFinalNewLinesParticipant;
    let FormatOnSaveParticipant = class FormatOnSaveParticipant {
        constructor(configurationService, codeEditorService, instantiationService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            this.instantiationService = instantiationService;
            // Nothing
        }
        async participate(model, env, progress, token) {
            if (!model.textEditorModel) {
                return;
            }
            const textEditorModel = model.textEditorModel;
            const overrides = { overrideIdentifier: textEditorModel.getLanguageIdentifier().language, resource: textEditorModel.uri };
            if (env.reason === 2 /* AUTO */ || !this.configurationService.getValue('editor.formatOnSave', overrides)) {
                return undefined;
            }
            const nestedProgress = new progress_1.Progress(provider => {
                progress.report({
                    message: nls_1.localize('formatting', "Running '{0}' Formatter ([configure](command:workbench.action.openSettings?%5B%22editor.formatOnSave%22%5D)).", provider.displayName || provider.extensionId && provider.extensionId.value || '???')
                });
            });
            const editorOrModel = findEditor(textEditorModel, this.codeEditorService) || textEditorModel;
            await this.instantiationService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editorOrModel, 2 /* Silent */, nestedProgress, token);
        }
    };
    FormatOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, instantiation_1.IInstantiationService)
    ], FormatOnSaveParticipant);
    let CodeActionOnSaveParticipant = class CodeActionOnSaveParticipant {
        constructor(configurationService, instantiationService) {
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
        }
        async participate(model, env, progress, token) {
            if (!model.textEditorModel) {
                return;
            }
            if (env.reason === 2 /* AUTO */) {
                return undefined;
            }
            const textEditorModel = model.textEditorModel;
            const settingsOverrides = { overrideIdentifier: textEditorModel.getLanguageIdentifier().language, resource: model.resource };
            const setting = this.configurationService.getValue('editor.codeActionsOnSave', settingsOverrides);
            if (!setting) {
                return undefined;
            }
            const settingItems = Array.isArray(setting)
                ? setting
                : Object.keys(setting).filter(x => setting[x]);
            const codeActionsOnSave = settingItems
                .map(x => new types_1.CodeActionKind(x));
            if (!Array.isArray(setting)) {
                codeActionsOnSave.sort((a, b) => {
                    if (types_1.CodeActionKind.SourceFixAll.contains(a)) {
                        if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                            return 0;
                        }
                        return -1;
                    }
                    if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                        return 1;
                    }
                    return 0;
                });
            }
            if (!codeActionsOnSave.length) {
                return undefined;
            }
            const excludedActions = Array.isArray(setting)
                ? []
                : Object.keys(setting)
                    .filter(x => setting[x] === false)
                    .map(x => new types_1.CodeActionKind(x));
            progress.report({ message: nls_1.localize('codeaction', "Quick Fixes") });
            await this.applyOnSaveActions(textEditorModel, codeActionsOnSave, excludedActions, progress, token);
        }
        async applyOnSaveActions(model, codeActionsOnSave, excludes, progress, token) {
            const getActionProgress = new class {
                constructor() {
                    this._names = new Set();
                }
                _report() {
                    progress.report({
                        message: nls_1.localize('codeaction.get', "Getting code actions from '{0}' ([configure](command:workbench.action.openSettings?%5B%22editor.codeActionsOnSave%22%5D)).", [...this._names].map(name => `'${name}'`).join(', '))
                    });
                }
                report(provider) {
                    if (provider.displayName && !this._names.has(provider.displayName)) {
                        this._names.add(provider.displayName);
                        this._report();
                    }
                }
            };
            for (const codeActionKind of codeActionsOnSave) {
                const actionsToRun = await this.getActionsToRun(model, codeActionKind, excludes, getActionProgress, token);
                try {
                    for (const action of actionsToRun.validActions) {
                        progress.report({ message: nls_1.localize('codeAction.apply', "Applying code action '{0}'.", action.title) });
                        await this.instantiationService.invokeFunction(codeActionCommands_1.applyCodeAction, action);
                    }
                }
                catch (_a) {
                    // Failure to apply a code action should not block other on save actions
                }
                finally {
                    actionsToRun.dispose();
                }
            }
        }
        getActionsToRun(model, codeActionKind, excludes, progress, token) {
            return codeAction_1.getCodeActions(model, model.getFullModelRange(), {
                type: 1 /* Auto */,
                filter: { include: codeActionKind, excludes: excludes, includeSourceActions: true },
            }, progress, token);
        }
    };
    CodeActionOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, instantiation_1.IInstantiationService)
    ], CodeActionOnSaveParticipant);
    let SaveParticipantsContribution = class SaveParticipantsContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, textFileService) {
            super();
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.registerSaveParticipants();
        }
        registerSaveParticipants() {
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(TrimWhitespaceParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(CodeActionOnSaveParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(FormatOnSaveParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(FinalNewLineParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(TrimFinalNewLinesParticipant)));
        }
    };
    SaveParticipantsContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, textfiles_1.ITextFileService)
    ], SaveParticipantsContribution);
    exports.SaveParticipantsContribution = SaveParticipantsContribution;
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SaveParticipantsContribution, 3 /* Restored */);
});
//# __sourceMappingURL=saveParticipants.js.map