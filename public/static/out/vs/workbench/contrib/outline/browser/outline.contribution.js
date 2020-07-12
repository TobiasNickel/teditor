/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/views", "./outlinePane", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/editor/contrib/documentSymbols/outline", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/platform/instantiation/common/descriptors"], function (require, exports, nls_1, views_1, outlinePane_1, platform_1, configurationRegistry_1, outline_1, explorerViewlet_1, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PANEL_ID = void 0;
    exports.PANEL_ID = 'panel.view.outline';
    const _outlineDesc = {
        id: outline_1.OutlineViewId,
        name: nls_1.localize('name', "Outline"),
        containerIcon: 'codicon-symbol-class',
        ctorDescriptor: new descriptors_1.SyncDescriptor(outlinePane_1.OutlinePane),
        canToggleVisibility: true,
        canMoveView: true,
        hideByDefault: false,
        collapsed: true,
        order: 2,
        weight: 30,
        focusCommand: { id: 'outline.focus' }
    };
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([_outlineDesc], explorerViewlet_1.VIEW_CONTAINER);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'outline',
        'order': 117,
        'title': nls_1.localize('outlineConfigurationTitle', "Outline"),
        'type': 'object',
        'properties': {
            ["outline.icons" /* icons */]: {
                'description': nls_1.localize('outline.showIcons', "Render Outline Elements with Icons."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.enabled" /* problemsEnabled */]: {
                'description': nls_1.localize('outline.showProblem', "Show Errors & Warnings on Outline Elements."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.colors" /* problemsColors */]: {
                'description': nls_1.localize('outline.problem.colors', "Use colors for Errors & Warnings."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.badges" /* problemsBadges */]: {
                'description': nls_1.localize('outline.problems.badges', "Use badges for Errors & Warnings."),
                'type': 'boolean',
                'default': true
            },
            'outline.showFiles': {
                type: 'boolean',
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.file', "When enabled outline shows `file`-symbols.")
            },
            'outline.showModules': {
                type: 'boolean',
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.module', "When enabled outline shows `module`-symbols.")
            },
            'outline.showNamespaces': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.namespace', "When enabled outline shows `namespace`-symbols.")
            },
            'outline.showPackages': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.package', "When enabled outline shows `package`-symbols.")
            },
            'outline.showClasses': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.class', "When enabled outline shows `class`-symbols.")
            },
            'outline.showMethods': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.method', "When enabled outline shows `method`-symbols.")
            },
            'outline.showProperties': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.property', "When enabled outline shows `property`-symbols.")
            },
            'outline.showFields': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.field', "When enabled outline shows `field`-symbols.")
            },
            'outline.showConstructors': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.constructor', "When enabled outline shows `constructor`-symbols.")
            },
            'outline.showEnums': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.enum', "When enabled outline shows `enum`-symbols.")
            },
            'outline.showInterfaces': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.interface', "When enabled outline shows `interface`-symbols.")
            },
            'outline.showFunctions': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.function', "When enabled outline shows `function`-symbols.")
            },
            'outline.showVariables': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.variable', "When enabled outline shows `variable`-symbols.")
            },
            'outline.showConstants': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.constant', "When enabled outline shows `constant`-symbols.")
            },
            'outline.showStrings': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.string', "When enabled outline shows `string`-symbols.")
            },
            'outline.showNumbers': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.number', "When enabled outline shows `number`-symbols.")
            },
            'outline.showBooleans': {
                type: 'boolean',
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.boolean', "When enabled outline shows `boolean`-symbols.")
            },
            'outline.showArrays': {
                type: 'boolean',
                default: true,
                scope: 5 /* LANGUAGE_OVERRIDABLE */,
                markdownDescription: nls_1.localize('filteredTypes.array', "When enabled outline shows `array`-symbols.")
            },
            'outline.showObjects': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.object', "When enabled outline shows `object`-symbols.")
            },
            'outline.showKeys': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.key', "When enabled outline shows `key`-symbols.")
            },
            'outline.showNull': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.null', "When enabled outline shows `null`-symbols.")
            },
            'outline.showEnumMembers': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.enumMember', "When enabled outline shows `enumMember`-symbols.")
            },
            'outline.showStructs': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.struct', "When enabled outline shows `struct`-symbols.")
            },
            'outline.showEvents': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.event', "When enabled outline shows `event`-symbols.")
            },
            'outline.showOperators': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.operator', "When enabled outline shows `operator`-symbols.")
            },
            'outline.showTypeParameters': {
                type: 'boolean',
                default: true,
                markdownDescription: nls_1.localize('filteredTypes.typeParameter', "When enabled outline shows `typeParameter`-symbols.")
            }
        }
    });
});
//# __sourceMappingURL=outline.contribution.js.map