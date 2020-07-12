/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/modelService", "vs/base/common/cancellation", "vs/editor/common/services/resolverService", "vs/editor/contrib/documentSymbols/outlineModel", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/base/common/iterator"], function (require, exports, uri_1, range_1, modelService_1, cancellation_1, resolverService_1, outlineModel_1, commands_1, types_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDocumentSymbols = void 0;
    async function getDocumentSymbols(document, flat, token) {
        const model = await outlineModel_1.OutlineModel.create(document, token);
        const roots = [];
        for (const child of model.children.values()) {
            if (child instanceof outlineModel_1.OutlineElement) {
                roots.push(child.symbol);
            }
            else {
                roots.push(...iterator_1.Iterable.map(child.children.values(), child => child.symbol));
            }
        }
        let flatEntries = [];
        if (token.isCancellationRequested) {
            return flatEntries;
        }
        if (flat) {
            flatten(flatEntries, roots, '');
        }
        else {
            flatEntries = roots;
        }
        return flatEntries.sort(compareEntriesUsingStart);
    }
    exports.getDocumentSymbols = getDocumentSymbols;
    function compareEntriesUsingStart(a, b) {
        return range_1.Range.compareRangesUsingStarts(a.range, b.range);
    }
    function flatten(bucket, entries, overrideContainerLabel) {
        for (let entry of entries) {
            bucket.push({
                kind: entry.kind,
                tags: entry.tags,
                name: entry.name,
                detail: entry.detail,
                containerName: entry.containerName || overrideContainerLabel,
                range: entry.range,
                selectionRange: entry.selectionRange,
                children: undefined,
            });
            if (entry.children) {
                flatten(bucket, entry.children, entry.name);
            }
        }
    }
    commands_1.CommandsRegistry.registerCommand('_executeDocumentSymbolProvider', async function (accessor, ...args) {
        const [resource] = args;
        types_1.assertType(uri_1.URI.isUri(resource));
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (model) {
            return getDocumentSymbols(model, false, cancellation_1.CancellationToken.None);
        }
        const reference = await accessor.get(resolverService_1.ITextModelService).createModelReference(resource);
        try {
            return await getDocumentSymbols(reference.object.textEditorModel, false, cancellation_1.CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
});
//# __sourceMappingURL=documentSymbols.js.map