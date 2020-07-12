/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.viewsWelcomeExtensionPointDescriptor = exports.ViewIdentifierMap = exports.ViewsWelcomeExtensionPointFields = void 0;
    var ViewsWelcomeExtensionPointFields;
    (function (ViewsWelcomeExtensionPointFields) {
        ViewsWelcomeExtensionPointFields["view"] = "view";
        ViewsWelcomeExtensionPointFields["contents"] = "contents";
        ViewsWelcomeExtensionPointFields["when"] = "when";
    })(ViewsWelcomeExtensionPointFields = exports.ViewsWelcomeExtensionPointFields || (exports.ViewsWelcomeExtensionPointFields = {}));
    exports.ViewIdentifierMap = {
        'explorer': 'workbench.explorer.emptyView',
        'debug': 'workbench.debug.welcome',
        'scm': 'workbench.scm',
    };
    const viewsWelcomeExtensionPointSchema = Object.freeze({
        type: 'array',
        description: nls.localize('contributes.viewsWelcome', "Contributed views welcome content. Welcome content will be rendered in views whenever they have no meaningful content to display, ie. the File Explorer when no folder is open. Such content is useful as in-product documentation to drive users to use certain features before they are available. A good example would be a `Clone Repository` button in the File Explorer welcome view."),
        items: {
            type: 'object',
            description: nls.localize('contributes.viewsWelcome.view', "Contributed welcome content for a specific view."),
            required: [
                ViewsWelcomeExtensionPointFields.view,
                ViewsWelcomeExtensionPointFields.contents
            ],
            properties: {
                [ViewsWelcomeExtensionPointFields.view]: {
                    anyOf: [
                        {
                            type: 'string',
                            description: nls.localize('contributes.viewsWelcome.view.view', "Target view identifier for this welcome content.")
                        },
                        {
                            type: 'string',
                            description: nls.localize('contributes.viewsWelcome.view.view', "Target view identifier for this welcome content."),
                            enum: Object.keys(exports.ViewIdentifierMap)
                        }
                    ]
                },
                [ViewsWelcomeExtensionPointFields.contents]: {
                    type: 'string',
                    description: nls.localize('contributes.viewsWelcome.view.contents', "Welcome content to be displayed. The format of the contents is a subset of Markdown, with support for links only."),
                },
                [ViewsWelcomeExtensionPointFields.when]: {
                    type: 'string',
                    description: nls.localize('contributes.viewsWelcome.view.when', "Condition when the welcome content should be displayed."),
                },
            }
        }
    });
    exports.viewsWelcomeExtensionPointDescriptor = {
        extensionPoint: 'viewsWelcome',
        jsonSchema: viewsWelcomeExtensionPointSchema
    };
});
//# __sourceMappingURL=viewsWelcomeExtensionPoint.js.map