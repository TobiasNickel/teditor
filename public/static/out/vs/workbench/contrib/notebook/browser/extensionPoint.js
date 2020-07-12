/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls, extensionsRegistry_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.notebookRendererExtensionPoint = exports.notebookProviderExtensionPoint = void 0;
    var NotebookEditorContribution;
    (function (NotebookEditorContribution) {
        NotebookEditorContribution.viewType = 'viewType';
        NotebookEditorContribution.displayName = 'displayName';
        NotebookEditorContribution.selector = 'selector';
        NotebookEditorContribution.priority = 'priority';
    })(NotebookEditorContribution || (NotebookEditorContribution = {}));
    var NotebookRendererContribution;
    (function (NotebookRendererContribution) {
        NotebookRendererContribution.viewType = 'viewType';
        NotebookRendererContribution.displayName = 'displayName';
        NotebookRendererContribution.mimeTypes = 'mimeTypes';
    })(NotebookRendererContribution || (NotebookRendererContribution = {}));
    const notebookProviderContribution = {
        description: nls.localize('contributes.notebook.provider', 'Contributes notebook document provider.'),
        type: 'array',
        defaultSnippets: [{ body: [{ viewType: '', displayName: '' }] }],
        items: {
            type: 'object',
            required: [
                NotebookEditorContribution.viewType,
                NotebookEditorContribution.displayName,
                NotebookEditorContribution.selector,
            ],
            properties: {
                [NotebookEditorContribution.viewType]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.provider.viewType', 'Unique identifier of the notebook.'),
                },
                [NotebookEditorContribution.displayName]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.provider.displayName', 'Human readable name of the notebook.'),
                },
                [NotebookEditorContribution.selector]: {
                    type: 'array',
                    description: nls.localize('contributes.notebook.provider.selector', 'Set of globs that the notebook is for.'),
                    items: {
                        type: 'object',
                        properties: {
                            filenamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.notebook.provider.selector.filenamePattern', 'Glob that the notebook is enabled for.'),
                            },
                            excludeFileNamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.notebook.selector.provider.excludeFileNamePattern', 'Glob that the notebook is disabled for.')
                            }
                        }
                    }
                },
                [NotebookEditorContribution.priority]: {
                    type: 'string',
                    markdownDeprecationMessage: nls.localize('contributes.priority', 'Controls if the custom editor is enabled automatically when the user opens a file. This may be overridden by users using the `workbench.editorAssociations` setting.'),
                    enum: [
                        notebookCommon_1.NotebookEditorPriority.default,
                        notebookCommon_1.NotebookEditorPriority.option,
                    ],
                    markdownEnumDescriptions: [
                        nls.localize('contributes.priority.default', 'The editor is automatically used when the user opens a resource, provided that no other default custom editors are registered for that resource.'),
                        nls.localize('contributes.priority.option', 'The editor is not automatically used when the user opens a resource, but a user can switch to the editor using the `Reopen With` command.'),
                    ],
                    default: 'default'
                }
            }
        }
    };
    const notebookRendererContribution = {
        description: nls.localize('contributes.notebook.renderer', 'Contributes notebook output renderer provider.'),
        type: 'array',
        defaultSnippets: [{ body: [{ viewType: '', displayName: '', mimeTypes: [''] }] }],
        items: {
            type: 'object',
            required: [
                NotebookRendererContribution.viewType,
                NotebookRendererContribution.displayName,
                NotebookRendererContribution.mimeTypes,
            ],
            properties: {
                [NotebookRendererContribution.viewType]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.renderer.viewType', 'Unique identifier of the notebook output renderer.'),
                },
                [NotebookRendererContribution.displayName]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.renderer.displayName', 'Human readable name of the notebook output renderer.'),
                },
                [NotebookRendererContribution.mimeTypes]: {
                    type: 'array',
                    description: nls.localize('contributes.notebook.selector', 'Set of globs that the notebook is for.'),
                    items: {
                        type: 'string'
                    }
                }
            }
        }
    };
    exports.notebookProviderExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebookProvider',
        jsonSchema: notebookProviderContribution
    });
    exports.notebookRendererExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebookOutputRenderer',
        jsonSchema: notebookRendererContribution
    });
});
//# __sourceMappingURL=extensionPoint.js.map