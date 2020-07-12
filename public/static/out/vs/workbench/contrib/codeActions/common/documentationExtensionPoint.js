/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/mode/common/workbenchModeService"], function (require, exports, nls, workbenchModeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.documentationExtensionPointDescriptor = exports.DocumentationExtensionPointFields = void 0;
    var DocumentationExtensionPointFields;
    (function (DocumentationExtensionPointFields) {
        DocumentationExtensionPointFields["when"] = "when";
        DocumentationExtensionPointFields["title"] = "title";
        DocumentationExtensionPointFields["command"] = "command";
    })(DocumentationExtensionPointFields = exports.DocumentationExtensionPointFields || (exports.DocumentationExtensionPointFields = {}));
    const documentationExtensionPointSchema = Object.freeze({
        type: 'object',
        description: nls.localize('contributes.documentation', "Contributed documentation."),
        properties: {
            'refactoring': {
                type: 'array',
                description: nls.localize('contributes.documentation.refactorings', "Contributed documentation for refactorings."),
                items: {
                    type: 'object',
                    description: nls.localize('contributes.documentation.refactoring', "Contributed documentation for refactoring."),
                    required: [
                        DocumentationExtensionPointFields.title,
                        DocumentationExtensionPointFields.when,
                        DocumentationExtensionPointFields.command
                    ],
                    properties: {
                        [DocumentationExtensionPointFields.title]: {
                            type: 'string',
                            description: nls.localize('contributes.documentation.refactoring.title', "Label for the documentation used in the UI."),
                        },
                        [DocumentationExtensionPointFields.when]: {
                            type: 'string',
                            description: nls.localize('contributes.documentation.refactoring.when', "When clause."),
                        },
                        [DocumentationExtensionPointFields.command]: {
                            type: 'string',
                            description: nls.localize('contributes.documentation.refactoring.command', "Command executed."),
                        },
                    },
                }
            }
        }
    });
    exports.documentationExtensionPointDescriptor = {
        extensionPoint: 'documentation',
        deps: [workbenchModeService_1.languagesExtPoint],
        jsonSchema: documentationExtensionPointSchema
    };
});
//# __sourceMappingURL=documentationExtensionPoint.js.map