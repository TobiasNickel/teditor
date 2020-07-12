/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/mode/common/workbenchModeService"], function (require, exports, nls, workbenchModeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.codeActionsExtensionPointDescriptor = exports.CodeActionExtensionPointFields = void 0;
    var CodeActionExtensionPointFields;
    (function (CodeActionExtensionPointFields) {
        CodeActionExtensionPointFields["languages"] = "languages";
        CodeActionExtensionPointFields["actions"] = "actions";
        CodeActionExtensionPointFields["kind"] = "kind";
        CodeActionExtensionPointFields["title"] = "title";
        CodeActionExtensionPointFields["description"] = "description";
    })(CodeActionExtensionPointFields = exports.CodeActionExtensionPointFields || (exports.CodeActionExtensionPointFields = {}));
    const codeActionsExtensionPointSchema = Object.freeze({
        type: 'array',
        markdownDescription: nls.localize('contributes.codeActions', "Configure which editor to use for a resource."),
        items: {
            type: 'object',
            required: [CodeActionExtensionPointFields.languages, CodeActionExtensionPointFields.actions],
            properties: {
                [CodeActionExtensionPointFields.languages]: {
                    type: 'array',
                    description: nls.localize('contributes.codeActions.languages', "Language modes that the code actions are enabled for."),
                    items: { type: 'string' }
                },
                [CodeActionExtensionPointFields.actions]: {
                    type: 'object',
                    required: [CodeActionExtensionPointFields.kind, CodeActionExtensionPointFields.title],
                    properties: {
                        [CodeActionExtensionPointFields.kind]: {
                            type: 'string',
                            markdownDescription: nls.localize('contributes.codeActions.kind', "`CodeActionKind` of the contributed code action."),
                        },
                        [CodeActionExtensionPointFields.title]: {
                            type: 'string',
                            description: nls.localize('contributes.codeActions.title', "Label for the code action used in the UI."),
                        },
                        [CodeActionExtensionPointFields.description]: {
                            type: 'string',
                            description: nls.localize('contributes.codeActions.description', "Description of what the code action does."),
                        },
                    }
                }
            }
        }
    });
    exports.codeActionsExtensionPointDescriptor = {
        extensionPoint: 'codeActions',
        deps: [workbenchModeService_1.languagesExtPoint],
        jsonSchema: codeActionsExtensionPointSchema
    };
});
//# __sourceMappingURL=codeActionsExtensionPoint.js.map