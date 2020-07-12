/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/core/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/modes", "vs/editor/common/services/modelService", "./types", "vs/platform/progress/common/progress"], function (require, exports, arrays_1, cancellation_1, errors_1, lifecycle_1, uri_1, editorState_1, editorExtensions_1, range_1, selection_1, modes, modelService_1, types_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCodeActions = exports.fixAllCommandId = exports.organizeImportsCommandId = exports.sourceActionCommandId = exports.refactorCommandId = exports.codeActionCommandId = void 0;
    exports.codeActionCommandId = 'editor.action.codeAction';
    exports.refactorCommandId = 'editor.action.refactor';
    exports.sourceActionCommandId = 'editor.action.sourceAction';
    exports.organizeImportsCommandId = 'editor.action.organizeImports';
    exports.fixAllCommandId = 'editor.action.fixAll';
    class ManagedCodeActionSet extends lifecycle_1.Disposable {
        constructor(actions, documentation, disposables) {
            super();
            this.documentation = documentation;
            this._register(disposables);
            this.allActions = arrays_1.mergeSort([...actions], ManagedCodeActionSet.codeActionsComparator);
            this.validActions = this.allActions.filter(action => !action.disabled);
        }
        static codeActionsComparator(a, b) {
            if (a.isPreferred && !b.isPreferred) {
                return -1;
            }
            else if (!a.isPreferred && b.isPreferred) {
                return 1;
            }
            if (arrays_1.isNonEmptyArray(a.diagnostics)) {
                if (arrays_1.isNonEmptyArray(b.diagnostics)) {
                    return a.diagnostics[0].message.localeCompare(b.diagnostics[0].message);
                }
                else {
                    return -1;
                }
            }
            else if (arrays_1.isNonEmptyArray(b.diagnostics)) {
                return 1;
            }
            else {
                return 0; // both have no diagnostics
            }
        }
        get hasAutoFix() {
            return this.validActions.some(fix => !!fix.kind && types_1.CodeActionKind.QuickFix.contains(new types_1.CodeActionKind(fix.kind)) && !!fix.isPreferred);
        }
    }
    function getCodeActions(model, rangeOrSelection, trigger, progress, token) {
        var _a;
        const filter = trigger.filter || {};
        const codeActionContext = {
            only: (_a = filter.include) === null || _a === void 0 ? void 0 : _a.value,
            trigger: trigger.type,
        };
        const cts = new editorState_1.TextModelCancellationTokenSource(model, token);
        const providers = getCodeActionProviders(model, filter);
        const disposables = new lifecycle_1.DisposableStore();
        const promises = providers.map(async (provider) => {
            try {
                progress.report(provider);
                const providedCodeActions = await provider.provideCodeActions(model, rangeOrSelection, codeActionContext, cts.token);
                if (providedCodeActions) {
                    disposables.add(providedCodeActions);
                }
                if (cts.token.isCancellationRequested) {
                    return { actions: [], documentation: undefined };
                }
                const filteredActions = ((providedCodeActions === null || providedCodeActions === void 0 ? void 0 : providedCodeActions.actions) || []).filter(action => action && types_1.filtersAction(filter, action));
                const documentation = getDocumentation(provider, filteredActions, filter.include);
                return { actions: filteredActions, documentation };
            }
            catch (err) {
                if (errors_1.isPromiseCanceledError(err)) {
                    throw err;
                }
                errors_1.onUnexpectedExternalError(err);
                return { actions: [], documentation: undefined };
            }
        });
        const listener = modes.CodeActionProviderRegistry.onDidChange(() => {
            const newProviders = modes.CodeActionProviderRegistry.all(model);
            if (!arrays_1.equals(newProviders, providers)) {
                cts.cancel();
            }
        });
        return Promise.all(promises).then(actions => {
            const allActions = arrays_1.flatten(actions.map(x => x.actions));
            const allDocumentation = arrays_1.coalesce(actions.map(x => x.documentation));
            return new ManagedCodeActionSet(allActions, allDocumentation, disposables);
        })
            .finally(() => {
            listener.dispose();
            cts.dispose();
        });
    }
    exports.getCodeActions = getCodeActions;
    function getCodeActionProviders(model, filter) {
        return modes.CodeActionProviderRegistry.all(model)
            // Don't include providers that we know will not return code actions of interest
            .filter(provider => {
            if (!provider.providedCodeActionKinds) {
                // We don't know what type of actions this provider will return.
                return true;
            }
            return provider.providedCodeActionKinds.some(kind => types_1.mayIncludeActionsOfKind(filter, new types_1.CodeActionKind(kind)));
        });
    }
    function getDocumentation(provider, providedCodeActions, only) {
        if (!provider.documentation) {
            return undefined;
        }
        const documentation = provider.documentation.map(entry => ({ kind: new types_1.CodeActionKind(entry.kind), command: entry.command }));
        if (only) {
            let currentBest;
            for (const entry of documentation) {
                if (entry.kind.contains(only)) {
                    if (!currentBest) {
                        currentBest = entry;
                    }
                    else {
                        // Take best match
                        if (currentBest.kind.contains(entry.kind)) {
                            currentBest = entry;
                        }
                    }
                }
            }
            if (currentBest) {
                return currentBest === null || currentBest === void 0 ? void 0 : currentBest.command;
            }
        }
        // Otherwise, check to see if any of the provided actions match.
        for (const action of providedCodeActions) {
            if (!action.kind) {
                continue;
            }
            for (const entry of documentation) {
                if (entry.kind.contains(new types_1.CodeActionKind(action.kind))) {
                    return entry.command;
                }
            }
        }
        return undefined;
    }
    editorExtensions_1.registerLanguageCommand('_executeCodeActionProvider', async function (accessor, args) {
        const { resource, rangeOrSelection, kind } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        const validatedRangeOrSelection = selection_1.Selection.isISelection(rangeOrSelection)
            ? selection_1.Selection.liftSelection(rangeOrSelection)
            : range_1.Range.isIRange(rangeOrSelection)
                ? model.validateRange(rangeOrSelection)
                : undefined;
        if (!validatedRangeOrSelection) {
            throw errors_1.illegalArgument();
        }
        const codeActionSet = await getCodeActions(model, validatedRangeOrSelection, { type: 2 /* Manual */, filter: { includeSourceActions: true, include: kind && kind.value ? new types_1.CodeActionKind(kind.value) : undefined } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
        setTimeout(() => codeActionSet.dispose(), 100);
        return codeActionSet.validActions;
    });
});
//# __sourceMappingURL=codeAction.js.map