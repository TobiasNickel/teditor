/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/base/common/resources"], function (require, exports, nls, configurationRegistry_1, configuration_1, platform_1, editor_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateViewTypeSchema = exports.DEFAULT_CUSTOM_EDITOR = exports.editorAssociationsConfigurationNode = exports.viewTypeSchamaAddition = exports.customEditorsAssociationsSettingId = exports.getAllAvailableEditors = exports.defaultEditorOverrideEntry = exports.openEditorWith = exports.DEFAULT_EDITOR_ID = void 0;
    /**
     * Id of the default editor for open with.
     */
    exports.DEFAULT_EDITOR_ID = 'default';
    /**
     * Try to open an resource with a given editor.
     *
     * @param input Resource to open.
     * @param id Id of the editor to use. If not provided, the user is prompted for which editor to use.
     */
    async function openEditorWith(input, id, options, group, editorService, configurationService, quickInputService) {
        var _a, _b;
        const resource = input.resource;
        if (!resource) {
            return;
        }
        const allEditorOverrides = getAllAvailableEditors(resource, options, group, editorService);
        if (!allEditorOverrides.length) {
            return;
        }
        const overrideToUse = typeof id === 'string' && allEditorOverrides.find(([_, entry]) => entry.id === id);
        if (overrideToUse) {
            return (_a = overrideToUse[0].open(input, Object.assign(Object.assign({}, options), { override: id }), group, 1 /* NEW_EDITOR */)) === null || _a === void 0 ? void 0 : _a.override;
        }
        // Prompt
        const resourceExt = resources_1.extname(resource);
        const items = allEditorOverrides.map((override) => {
            return {
                handler: override[0],
                id: override[1].id,
                label: override[1].label,
                description: override[1].active ? nls.localize('promptOpenWith.currentlyActive', 'Currently Active') : undefined,
                detail: override[1].detail,
                buttons: resourceExt ? [{
                        iconClass: 'codicon-settings-gear',
                        tooltip: nls.localize('promptOpenWith.setDefaultTooltip', "Set as default editor for '{0}' files", resourceExt)
                    }] : undefined
            };
        });
        const picker = quickInputService.createQuickPick();
        picker.items = items;
        if (items.length) {
            picker.selectedItems = [items[0]];
        }
        picker.placeholder = nls.localize('promptOpenWith.placeHolder', "Select editor for '{0}'", resources_1.basename(resource));
        const pickedItem = await new Promise(resolve => {
            picker.onDidAccept(() => {
                resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0] : undefined);
                picker.dispose();
            });
            picker.onDidTriggerItemButton(e => {
                const pick = e.item;
                const id = pick.id;
                resolve(pick); // open the view
                picker.dispose();
                // And persist the setting
                if (pick && id) {
                    const newAssociation = { viewType: id, filenamePattern: '*' + resourceExt };
                    const currentAssociations = [...configurationService.getValue(exports.customEditorsAssociationsSettingId)];
                    // First try updating existing association
                    for (let i = 0; i < currentAssociations.length; ++i) {
                        const existing = currentAssociations[i];
                        if (existing.filenamePattern === newAssociation.filenamePattern) {
                            currentAssociations.splice(i, 1, newAssociation);
                            configurationService.updateValue(exports.customEditorsAssociationsSettingId, currentAssociations);
                            return;
                        }
                    }
                    // Otherwise, create a new one
                    currentAssociations.unshift(newAssociation);
                    configurationService.updateValue(exports.customEditorsAssociationsSettingId, currentAssociations);
                }
            });
            picker.show();
        });
        return (_b = pickedItem === null || pickedItem === void 0 ? void 0 : pickedItem.handler.open(input, Object.assign(Object.assign({}, options), { override: pickedItem.id }), group, 1 /* NEW_EDITOR */)) === null || _b === void 0 ? void 0 : _b.override;
    }
    exports.openEditorWith = openEditorWith;
    const builtinProviderDisplayName = nls.localize('builtinProviderDisplayName', "Built-in");
    exports.defaultEditorOverrideEntry = Object.freeze({
        id: exports.DEFAULT_EDITOR_ID,
        label: nls.localize('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        detail: builtinProviderDisplayName
    });
    /**
     * Get a list of all available editors, including the default text editor.
     */
    function getAllAvailableEditors(resource, options, group, editorService) {
        const fileEditorInputFactory = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories).getFileEditorInputFactory();
        const overrides = editorService.getEditorOverrides(resource, options, group);
        if (!overrides.some(([_, entry]) => entry.id === exports.DEFAULT_EDITOR_ID)) {
            overrides.unshift([
                {
                    open: (input, options, group) => {
                        if (!input.resource) {
                            return;
                        }
                        const fileEditorInput = editorService.createEditorInput({ resource: input.resource, forceFile: true });
                        const textOptions = options ? Object.assign(Object.assign({}, options), { override: false }) : { override: false };
                        return { override: editorService.openEditor(fileEditorInput, textOptions, group) };
                    }
                },
                Object.assign(Object.assign({}, exports.defaultEditorOverrideEntry), { active: fileEditorInputFactory.isFileEditorInput(editorService.activeEditor) && resources_1.isEqual(editorService.activeEditor.resource, resource) })
            ]);
        }
        return overrides;
    }
    exports.getAllAvailableEditors = getAllAvailableEditors;
    exports.customEditorsAssociationsSettingId = 'workbench.editorAssociations';
    exports.viewTypeSchamaAddition = {
        type: 'string',
        enum: []
    };
    exports.editorAssociationsConfigurationNode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
            [exports.customEditorsAssociationsSettingId]: {
                type: 'array',
                markdownDescription: nls.localize('editor.editorAssociations', "Configure which editor to use for specific file types."),
                items: {
                    type: 'object',
                    defaultSnippets: [{
                            body: {
                                'viewType': '$1',
                                'filenamePattern': '$2'
                            }
                        }],
                    properties: {
                        'viewType': {
                            anyOf: [
                                {
                                    type: 'string',
                                    description: nls.localize('editor.editorAssociations.viewType', "The unique id of the editor to use."),
                                },
                                exports.viewTypeSchamaAddition
                            ]
                        },
                        'filenamePattern': {
                            type: 'string',
                            description: nls.localize('editor.editorAssociations.filenamePattern', "Glob pattern specifying which files the editor should be used for."),
                        }
                    }
                }
            }
        } });
    exports.DEFAULT_CUSTOM_EDITOR = {
        id: 'default',
        displayName: nls.localize('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        providerDisplayName: builtinProviderDisplayName
    };
    function updateViewTypeSchema(enumValues, enumDescriptions) {
        exports.viewTypeSchamaAddition.enum = enumValues;
        exports.viewTypeSchamaAddition.enumDescriptions = enumDescriptions;
        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
            .notifyConfigurationSchemaUpdated(exports.editorAssociationsConfigurationNode);
    }
    exports.updateViewTypeSchema = updateViewTypeSchema;
});
//# __sourceMappingURL=editorOpenWith.js.map