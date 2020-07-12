/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/base/common/lifecycle"], function (require, exports, arrays_1, cancellation_1, errors_1, uri_1, editorExtensions_1, modes_1, modelService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCodeLensData = exports.CodeLensModel = void 0;
    class CodeLensModel {
        constructor() {
            this.lenses = [];
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        add(list, provider) {
            this._disposables.add(list);
            for (const symbol of list.lenses) {
                this.lenses.push({ symbol, provider });
            }
        }
    }
    exports.CodeLensModel = CodeLensModel;
    function getCodeLensData(model, token) {
        const provider = modes_1.CodeLensProviderRegistry.ordered(model);
        const providerRanks = new Map();
        const result = new CodeLensModel();
        const promises = provider.map((provider, i) => {
            providerRanks.set(provider, i);
            return Promise.resolve(provider.provideCodeLenses(model, token))
                .then(list => list && result.add(list, provider))
                .catch(errors_1.onUnexpectedExternalError);
        });
        return Promise.all(promises).then(() => {
            result.lenses = arrays_1.mergeSort(result.lenses, (a, b) => {
                // sort by lineNumber, provider-rank, and column
                if (a.symbol.range.startLineNumber < b.symbol.range.startLineNumber) {
                    return -1;
                }
                else if (a.symbol.range.startLineNumber > b.symbol.range.startLineNumber) {
                    return 1;
                }
                else if (providerRanks.get(a.provider) < providerRanks.get(b.provider)) {
                    return -1;
                }
                else if (providerRanks.get(a.provider) > providerRanks.get(b.provider)) {
                    return 1;
                }
                else if (a.symbol.range.startColumn < b.symbol.range.startColumn) {
                    return -1;
                }
                else if (a.symbol.range.startColumn > b.symbol.range.startColumn) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            return result;
        });
    }
    exports.getCodeLensData = getCodeLensData;
    editorExtensions_1.registerLanguageCommand('_executeCodeLensProvider', function (accessor, args) {
        let { resource, itemResolveCount } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        const result = [];
        const disposables = new lifecycle_1.DisposableStore();
        return getCodeLensData(model, cancellation_1.CancellationToken.None).then(value => {
            disposables.add(value);
            let resolve = [];
            for (const item of value.lenses) {
                if (typeof itemResolveCount === 'undefined' || Boolean(item.symbol.command)) {
                    result.push(item.symbol);
                }
                else if (itemResolveCount-- > 0 && item.provider.resolveCodeLens) {
                    resolve.push(Promise.resolve(item.provider.resolveCodeLens(model, item.symbol, cancellation_1.CancellationToken.None)).then(symbol => result.push(symbol || item.symbol)));
                }
            }
            return Promise.all(resolve);
        }).then(() => {
            return result;
        }).finally(() => {
            // make sure to return results, then (on next tick)
            // dispose the results
            setTimeout(() => disposables.dispose(), 100);
        });
    });
});
//# __sourceMappingURL=codelens.js.map