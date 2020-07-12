/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/core/editorState", "vs/editor/browser/editorBrowser", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/modes", "vs/editor/common/services/editorWorkerService", "vs/editor/common/services/modelService", "vs/editor/contrib/format/formattingEdit", "vs/nls", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/linkedList", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/base/common/iterator"], function (require, exports, aria_1, arrays_1, cancellation_1, errors_1, uri_1, editorState_1, editorBrowser_1, position_1, range_1, selection_1, modes_1, editorWorkerService_1, modelService_1, formattingEdit_1, nls, extensions_1, instantiation_1, linkedList_1, commands_1, types_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOnTypeFormattingEdits = exports.getDocumentFormattingEditsUntilResult = exports.getDocumentRangeFormattingEditsUntilResult = exports.formatDocumentWithProvider = exports.formatDocumentWithSelectedProvider = exports.formatDocumentRangeWithProvider = exports.formatDocumentRangeWithSelectedProvider = exports.FormattingConflicts = exports.FormattingMode = exports.getRealAndSyntheticDocumentFormattersOrdered = exports.alertFormattingEdits = void 0;
    function alertFormattingEdits(edits) {
        edits = edits.filter(edit => edit.range);
        if (!edits.length) {
            return;
        }
        let { range } = edits[0];
        for (let i = 1; i < edits.length; i++) {
            range = range_1.Range.plusRange(range, edits[i].range);
        }
        const { startLineNumber, endLineNumber } = range;
        if (startLineNumber === endLineNumber) {
            if (edits.length === 1) {
                aria_1.alert(nls.localize('hint11', "Made 1 formatting edit on line {0}", startLineNumber));
            }
            else {
                aria_1.alert(nls.localize('hintn1', "Made {0} formatting edits on line {1}", edits.length, startLineNumber));
            }
        }
        else {
            if (edits.length === 1) {
                aria_1.alert(nls.localize('hint1n', "Made 1 formatting edit between lines {0} and {1}", startLineNumber, endLineNumber));
            }
            else {
                aria_1.alert(nls.localize('hintnn', "Made {0} formatting edits between lines {1} and {2}", edits.length, startLineNumber, endLineNumber));
            }
        }
    }
    exports.alertFormattingEdits = alertFormattingEdits;
    function getRealAndSyntheticDocumentFormattersOrdered(model) {
        const result = [];
        const seen = new Set();
        // (1) add all document formatter
        const docFormatter = modes_1.DocumentFormattingEditProviderRegistry.ordered(model);
        for (const formatter of docFormatter) {
            result.push(formatter);
            if (formatter.extensionId) {
                seen.add(extensions_1.ExtensionIdentifier.toKey(formatter.extensionId));
            }
        }
        // (2) add all range formatter as document formatter (unless the same extension already did that)
        const rangeFormatter = modes_1.DocumentRangeFormattingEditProviderRegistry.ordered(model);
        for (const formatter of rangeFormatter) {
            if (formatter.extensionId) {
                if (seen.has(extensions_1.ExtensionIdentifier.toKey(formatter.extensionId))) {
                    continue;
                }
                seen.add(extensions_1.ExtensionIdentifier.toKey(formatter.extensionId));
            }
            result.push({
                displayName: formatter.displayName,
                extensionId: formatter.extensionId,
                provideDocumentFormattingEdits(model, options, token) {
                    return formatter.provideDocumentRangeFormattingEdits(model, model.getFullModelRange(), options, token);
                }
            });
        }
        return result;
    }
    exports.getRealAndSyntheticDocumentFormattersOrdered = getRealAndSyntheticDocumentFormattersOrdered;
    var FormattingMode;
    (function (FormattingMode) {
        FormattingMode[FormattingMode["Explicit"] = 1] = "Explicit";
        FormattingMode[FormattingMode["Silent"] = 2] = "Silent";
    })(FormattingMode = exports.FormattingMode || (exports.FormattingMode = {}));
    class FormattingConflicts {
        static setFormatterSelector(selector) {
            const remove = FormattingConflicts._selectors.unshift(selector);
            return { dispose: remove };
        }
        static async select(formatter, document, mode) {
            if (formatter.length === 0) {
                return undefined;
            }
            const selector = iterator_1.Iterable.first(FormattingConflicts._selectors);
            if (selector) {
                return await selector(formatter, document, mode);
            }
            return formatter[0];
        }
    }
    exports.FormattingConflicts = FormattingConflicts;
    FormattingConflicts._selectors = new linkedList_1.LinkedList();
    async function formatDocumentRangeWithSelectedProvider(accessor, editorOrModel, range, mode, token) {
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const model = editorBrowser_1.isCodeEditor(editorOrModel) ? editorOrModel.getModel() : editorOrModel;
        const provider = modes_1.DocumentRangeFormattingEditProviderRegistry.ordered(model);
        const selected = await FormattingConflicts.select(provider, model, mode);
        if (selected) {
            await instaService.invokeFunction(formatDocumentRangeWithProvider, selected, editorOrModel, range, token);
        }
    }
    exports.formatDocumentRangeWithSelectedProvider = formatDocumentRangeWithSelectedProvider;
    async function formatDocumentRangeWithProvider(accessor, provider, editorOrModel, range, token) {
        const workerService = accessor.get(editorWorkerService_1.IEditorWorkerService);
        let model;
        let cts;
        if (editorBrowser_1.isCodeEditor(editorOrModel)) {
            model = editorOrModel.getModel();
            cts = new editorState_1.EditorStateCancellationTokenSource(editorOrModel, 1 /* Value */ | 4 /* Position */, undefined, token);
        }
        else {
            model = editorOrModel;
            cts = new editorState_1.TextModelCancellationTokenSource(editorOrModel, token);
        }
        let edits;
        try {
            const rawEdits = await provider.provideDocumentRangeFormattingEdits(model, range, model.getFormattingOptions(), cts.token);
            edits = await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            if (cts.token.isCancellationRequested) {
                return true;
            }
        }
        finally {
            cts.dispose();
        }
        if (!edits || edits.length === 0) {
            return false;
        }
        if (editorBrowser_1.isCodeEditor(editorOrModel)) {
            // use editor to apply edits
            formattingEdit_1.FormattingEdit.execute(editorOrModel, edits, true);
            alertFormattingEdits(edits);
            editorOrModel.revealPositionInCenterIfOutsideViewport(editorOrModel.getPosition(), 1 /* Immediate */);
        }
        else {
            // use model to apply edits
            const [{ range }] = edits;
            const initialSelection = new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
            model.pushEditOperations([initialSelection], edits.map(edit => {
                return {
                    text: edit.text,
                    range: range_1.Range.lift(edit.range),
                    forceMoveMarkers: true
                };
            }), undoEdits => {
                for (const { range } of undoEdits) {
                    if (range_1.Range.areIntersectingOrTouching(range, initialSelection)) {
                        return [new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)];
                    }
                }
                return null;
            });
        }
        return true;
    }
    exports.formatDocumentRangeWithProvider = formatDocumentRangeWithProvider;
    async function formatDocumentWithSelectedProvider(accessor, editorOrModel, mode, progress, token) {
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const model = editorBrowser_1.isCodeEditor(editorOrModel) ? editorOrModel.getModel() : editorOrModel;
        const provider = getRealAndSyntheticDocumentFormattersOrdered(model);
        const selected = await FormattingConflicts.select(provider, model, mode);
        if (selected) {
            progress.report(selected);
            await instaService.invokeFunction(formatDocumentWithProvider, selected, editorOrModel, mode, token);
        }
    }
    exports.formatDocumentWithSelectedProvider = formatDocumentWithSelectedProvider;
    async function formatDocumentWithProvider(accessor, provider, editorOrModel, mode, token) {
        const workerService = accessor.get(editorWorkerService_1.IEditorWorkerService);
        let model;
        let cts;
        if (editorBrowser_1.isCodeEditor(editorOrModel)) {
            model = editorOrModel.getModel();
            cts = new editorState_1.EditorStateCancellationTokenSource(editorOrModel, 1 /* Value */ | 4 /* Position */, undefined, token);
        }
        else {
            model = editorOrModel;
            cts = new editorState_1.TextModelCancellationTokenSource(editorOrModel, token);
        }
        let edits;
        try {
            const rawEdits = await provider.provideDocumentFormattingEdits(model, model.getFormattingOptions(), cts.token);
            edits = await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            if (cts.token.isCancellationRequested) {
                return true;
            }
        }
        finally {
            cts.dispose();
        }
        if (!edits || edits.length === 0) {
            return false;
        }
        if (editorBrowser_1.isCodeEditor(editorOrModel)) {
            // use editor to apply edits
            formattingEdit_1.FormattingEdit.execute(editorOrModel, edits, mode !== 2 /* Silent */);
            if (mode !== 2 /* Silent */) {
                alertFormattingEdits(edits);
                editorOrModel.revealPositionInCenterIfOutsideViewport(editorOrModel.getPosition(), 1 /* Immediate */);
            }
        }
        else {
            // use model to apply edits
            const [{ range }] = edits;
            const initialSelection = new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
            model.pushEditOperations([initialSelection], edits.map(edit => {
                return {
                    text: edit.text,
                    range: range_1.Range.lift(edit.range),
                    forceMoveMarkers: true
                };
            }), undoEdits => {
                for (const { range } of undoEdits) {
                    if (range_1.Range.areIntersectingOrTouching(range, initialSelection)) {
                        return [new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)];
                    }
                }
                return null;
            });
        }
        return true;
    }
    exports.formatDocumentWithProvider = formatDocumentWithProvider;
    async function getDocumentRangeFormattingEditsUntilResult(workerService, model, range, options, token) {
        const providers = modes_1.DocumentRangeFormattingEditProviderRegistry.ordered(model);
        for (const provider of providers) {
            let rawEdits = await Promise.resolve(provider.provideDocumentRangeFormattingEdits(model, range, options, token)).catch(errors_1.onUnexpectedExternalError);
            if (arrays_1.isNonEmptyArray(rawEdits)) {
                return await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            }
        }
        return undefined;
    }
    exports.getDocumentRangeFormattingEditsUntilResult = getDocumentRangeFormattingEditsUntilResult;
    async function getDocumentFormattingEditsUntilResult(workerService, model, options, token) {
        const providers = getRealAndSyntheticDocumentFormattersOrdered(model);
        for (const provider of providers) {
            let rawEdits = await Promise.resolve(provider.provideDocumentFormattingEdits(model, options, token)).catch(errors_1.onUnexpectedExternalError);
            if (arrays_1.isNonEmptyArray(rawEdits)) {
                return await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            }
        }
        return undefined;
    }
    exports.getDocumentFormattingEditsUntilResult = getDocumentFormattingEditsUntilResult;
    function getOnTypeFormattingEdits(workerService, model, position, ch, options) {
        const providers = modes_1.OnTypeFormattingEditProviderRegistry.ordered(model);
        if (providers.length === 0) {
            return Promise.resolve(undefined);
        }
        if (providers[0].autoFormatTriggerCharacters.indexOf(ch) < 0) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(providers[0].provideOnTypeFormattingEdits(model, position, ch, options, cancellation_1.CancellationToken.None)).catch(errors_1.onUnexpectedExternalError).then(edits => {
            return workerService.computeMoreMinimalEdits(model.uri, edits);
        });
    }
    exports.getOnTypeFormattingEdits = getOnTypeFormattingEdits;
    commands_1.CommandsRegistry.registerCommand('_executeFormatRangeProvider', function (accessor, ...args) {
        const [resource, range, options] = args;
        types_1.assertType(uri_1.URI.isUri(resource));
        types_1.assertType(range_1.Range.isIRange(range));
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument('resource');
        }
        return getDocumentRangeFormattingEditsUntilResult(accessor.get(editorWorkerService_1.IEditorWorkerService), model, range_1.Range.lift(range), options, cancellation_1.CancellationToken.None);
    });
    commands_1.CommandsRegistry.registerCommand('_executeFormatDocumentProvider', function (accessor, ...args) {
        const [resource, options] = args;
        types_1.assertType(uri_1.URI.isUri(resource));
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument('resource');
        }
        return getDocumentFormattingEditsUntilResult(accessor.get(editorWorkerService_1.IEditorWorkerService), model, options, cancellation_1.CancellationToken.None);
    });
    commands_1.CommandsRegistry.registerCommand('_executeFormatOnTypeProvider', function (accessor, ...args) {
        const [resource, position, ch, options] = args;
        types_1.assertType(uri_1.URI.isUri(resource));
        types_1.assertType(position_1.Position.isIPosition(position));
        types_1.assertType(typeof ch === 'string');
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument('resource');
        }
        return getOnTypeFormattingEdits(accessor.get(editorWorkerService_1.IEditorWorkerService), model, position_1.Position.lift(position), ch, options);
    });
});
//# __sourceMappingURL=format.js.map