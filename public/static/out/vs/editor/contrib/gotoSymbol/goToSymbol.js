/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/modes"], function (require, exports, cancellation_1, errors_1, editorExtensions_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getReferencesAtPosition = exports.getTypeDefinitionsAtPosition = exports.getImplementationsAtPosition = exports.getDeclarationsAtPosition = exports.getDefinitionsAtPosition = void 0;
    function getLocationLinks(model, position, registry, provide) {
        const provider = registry.ordered(model);
        // get results
        const promises = provider.map((provider) => {
            return Promise.resolve(provide(provider, model, position)).then(undefined, err => {
                errors_1.onUnexpectedExternalError(err);
                return undefined;
            });
        });
        return Promise.all(promises).then(values => {
            const result = [];
            for (let value of values) {
                if (Array.isArray(value)) {
                    result.push(...value);
                }
                else if (value) {
                    result.push(value);
                }
            }
            return result;
        });
    }
    function getDefinitionsAtPosition(model, position, token) {
        return getLocationLinks(model, position, modes_1.DefinitionProviderRegistry, (provider, model, position) => {
            return provider.provideDefinition(model, position, token);
        });
    }
    exports.getDefinitionsAtPosition = getDefinitionsAtPosition;
    function getDeclarationsAtPosition(model, position, token) {
        return getLocationLinks(model, position, modes_1.DeclarationProviderRegistry, (provider, model, position) => {
            return provider.provideDeclaration(model, position, token);
        });
    }
    exports.getDeclarationsAtPosition = getDeclarationsAtPosition;
    function getImplementationsAtPosition(model, position, token) {
        return getLocationLinks(model, position, modes_1.ImplementationProviderRegistry, (provider, model, position) => {
            return provider.provideImplementation(model, position, token);
        });
    }
    exports.getImplementationsAtPosition = getImplementationsAtPosition;
    function getTypeDefinitionsAtPosition(model, position, token) {
        return getLocationLinks(model, position, modes_1.TypeDefinitionProviderRegistry, (provider, model, position) => {
            return provider.provideTypeDefinition(model, position, token);
        });
    }
    exports.getTypeDefinitionsAtPosition = getTypeDefinitionsAtPosition;
    function getReferencesAtPosition(model, position, compact, token) {
        return getLocationLinks(model, position, modes_1.ReferenceProviderRegistry, async (provider, model, position) => {
            const result = await provider.provideReferences(model, position, { includeDeclaration: true }, token);
            if (!compact || !result || result.length !== 2) {
                return result;
            }
            const resultWithoutDeclaration = await provider.provideReferences(model, position, { includeDeclaration: false }, token);
            if (resultWithoutDeclaration && resultWithoutDeclaration.length === 1) {
                return resultWithoutDeclaration;
            }
            return result;
        });
    }
    exports.getReferencesAtPosition = getReferencesAtPosition;
    editorExtensions_1.registerModelAndPositionCommand('_executeDefinitionProvider', (model, position) => getDefinitionsAtPosition(model, position, cancellation_1.CancellationToken.None));
    editorExtensions_1.registerModelAndPositionCommand('_executeDeclarationProvider', (model, position) => getDeclarationsAtPosition(model, position, cancellation_1.CancellationToken.None));
    editorExtensions_1.registerModelAndPositionCommand('_executeImplementationProvider', (model, position) => getImplementationsAtPosition(model, position, cancellation_1.CancellationToken.None));
    editorExtensions_1.registerModelAndPositionCommand('_executeTypeDefinitionProvider', (model, position) => getTypeDefinitionsAtPosition(model, position, cancellation_1.CancellationToken.None));
    editorExtensions_1.registerModelAndPositionCommand('_executeReferenceProvider', (model, position) => getReferencesAtPosition(model, position, false, cancellation_1.CancellationToken.None));
});
//# __sourceMappingURL=goToSymbol.js.map