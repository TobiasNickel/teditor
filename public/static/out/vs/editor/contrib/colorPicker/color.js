/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService"], function (require, exports, cancellation_1, errors_1, uri_1, editorExtensions_1, range_1, modes_1, modelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getColorPresentations = exports.getColors = void 0;
    function getColors(model, token) {
        const colors = [];
        const providers = modes_1.ColorProviderRegistry.ordered(model).reverse();
        const promises = providers.map(provider => Promise.resolve(provider.provideDocumentColors(model, token)).then(result => {
            if (Array.isArray(result)) {
                for (let colorInfo of result) {
                    colors.push({ colorInfo, provider });
                }
            }
        }));
        return Promise.all(promises).then(() => colors);
    }
    exports.getColors = getColors;
    function getColorPresentations(model, colorInfo, provider, token) {
        return Promise.resolve(provider.provideColorPresentations(model, colorInfo, token));
    }
    exports.getColorPresentations = getColorPresentations;
    editorExtensions_1.registerLanguageCommand('_executeDocumentColorProvider', function (accessor, args) {
        const { resource } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        const rawCIs = [];
        const providers = modes_1.ColorProviderRegistry.ordered(model).reverse();
        const promises = providers.map(provider => Promise.resolve(provider.provideDocumentColors(model, cancellation_1.CancellationToken.None)).then(result => {
            if (Array.isArray(result)) {
                for (let ci of result) {
                    rawCIs.push({ range: ci.range, color: [ci.color.red, ci.color.green, ci.color.blue, ci.color.alpha] });
                }
            }
        }));
        return Promise.all(promises).then(() => rawCIs);
    });
    editorExtensions_1.registerLanguageCommand('_executeColorPresentationProvider', function (accessor, args) {
        const { resource, color, range } = args;
        if (!(resource instanceof uri_1.URI) || !Array.isArray(color) || color.length !== 4 || !range_1.Range.isIRange(range)) {
            throw errors_1.illegalArgument();
        }
        const [red, green, blue, alpha] = color;
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        const colorInfo = {
            range,
            color: { red, green, blue, alpha }
        };
        const presentations = [];
        const providers = modes_1.ColorProviderRegistry.ordered(model).reverse();
        const promises = providers.map(provider => Promise.resolve(provider.provideColorPresentations(model, colorInfo, cancellation_1.CancellationToken.None)).then(result => {
            if (Array.isArray(result)) {
                presentations.push(...result);
            }
        }));
        return Promise.all(promises).then(() => presentations);
    });
});
//# __sourceMappingURL=color.js.map