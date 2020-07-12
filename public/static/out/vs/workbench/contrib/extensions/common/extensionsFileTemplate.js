/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, nls_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsConfigurationInitialContent = exports.ExtensionsConfigurationSchema = exports.ExtensionsConfigurationSchemaId = void 0;
    exports.ExtensionsConfigurationSchemaId = 'vscode://schemas/extensions';
    exports.ExtensionsConfigurationSchema = {
        id: exports.ExtensionsConfigurationSchemaId,
        allowComments: true,
        allowTrailingCommas: true,
        type: 'object',
        title: nls_1.localize('app.extensions.json.title', "Extensions"),
        additionalProperties: false,
        properties: {
            recommendations: {
                type: 'array',
                description: nls_1.localize('app.extensions.json.recommendations', "List of extensions which should be recommended for users of this workspace. The identifier of an extension is always '${publisher}.${name}'. For example: 'vscode.csharp'."),
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
                    errorMessage: nls_1.localize('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
                },
            },
            unwantedRecommendations: {
                type: 'array',
                description: nls_1.localize('app.extensions.json.unwantedRecommendations', "List of extensions recommended by VS Code that should not be recommended for users of this workspace. The identifier of an extension is always '${publisher}.${name}'. For example: 'vscode.csharp'."),
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
                    errorMessage: nls_1.localize('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
                },
            },
        }
    };
    exports.ExtensionsConfigurationInitialContent = [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=827846 to learn about workspace recommendations.',
        '\t// Extension identifier format: ${publisher}.${name}. Example: vscode.csharp',
        '',
        '\t// List of extensions which should be recommended for users of this workspace.',
        '\t"recommendations": [',
        '\t\t',
        '\t],',
        '\t// List of extensions recommended by VS Code that should not be recommended for users of this workspace.',
        '\t"unwantedRecommendations": [',
        '\t\t',
        '\t]',
        '}'
    ].join('\n');
});
//# __sourceMappingURL=extensionsFileTemplate.js.map