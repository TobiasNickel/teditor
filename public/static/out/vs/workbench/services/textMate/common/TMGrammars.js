/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/mode/common/workbenchModeService"], function (require, exports, nls, extensionsRegistry_1, workbenchModeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.grammarsExtPoint = void 0;
    exports.grammarsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'grammars',
        deps: [workbenchModeService_1.languagesExtPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.grammars', 'Contributes textmate tokenizers.'),
            type: 'array',
            defaultSnippets: [{ body: [{ language: '${1:id}', scopeName: 'source.${2:id}', path: './syntaxes/${3:id}.tmLanguage.' }] }],
            items: {
                type: 'object',
                defaultSnippets: [{ body: { language: '${1:id}', scopeName: 'source.${2:id}', path: './syntaxes/${3:id}.tmLanguage.' } }],
                properties: {
                    language: {
                        description: nls.localize('vscode.extension.contributes.grammars.language', 'Language identifier for which this syntax is contributed to.'),
                        type: 'string'
                    },
                    scopeName: {
                        description: nls.localize('vscode.extension.contributes.grammars.scopeName', 'Textmate scope name used by the tmLanguage file.'),
                        type: 'string'
                    },
                    path: {
                        description: nls.localize('vscode.extension.contributes.grammars.path', 'Path of the tmLanguage file. The path is relative to the extension folder and typically starts with \'./syntaxes/\'.'),
                        type: 'string'
                    },
                    embeddedLanguages: {
                        description: nls.localize('vscode.extension.contributes.grammars.embeddedLanguages', 'A map of scope name to language id if this grammar contains embedded languages.'),
                        type: 'object'
                    },
                    tokenTypes: {
                        description: nls.localize('vscode.extension.contributes.grammars.tokenTypes', 'A map of scope name to token types.'),
                        type: 'object',
                        additionalProperties: {
                            enum: ['string', 'comment', 'other']
                        }
                    },
                    injectTo: {
                        description: nls.localize('vscode.extension.contributes.grammars.injectTo', 'List of language scope names to which this grammar is injected to.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    }
                },
                required: ['scopeName', 'path']
            }
        }
    });
});
//# __sourceMappingURL=TMGrammars.js.map