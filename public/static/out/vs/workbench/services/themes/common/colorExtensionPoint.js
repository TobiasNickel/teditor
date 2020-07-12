/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/theme/common/colorRegistry", "vs/base/common/color", "vs/platform/registry/common/platform"], function (require, exports, nls, extensionsRegistry_1, colorRegistry_1, color_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorExtensionPoint = void 0;
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const colorReferenceSchema = colorRegistry.getColorReferenceSchema();
    const colorIdPattern = '^\\w+[.\\w+]*$';
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'colors',
        jsonSchema: {
            description: nls.localize('contributes.color', 'Contributes extension defined themable colors'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: nls.localize('contributes.color.id', 'The identifier of the themable color'),
                        pattern: colorIdPattern,
                        patternErrorMessage: nls.localize('contributes.color.id.format', 'Identifiers must only contain letters, digits and dots and can not start with a dot'),
                    },
                    description: {
                        type: 'string',
                        description: nls.localize('contributes.color.description', 'The description of the themable color'),
                    },
                    defaults: {
                        type: 'object',
                        properties: {
                            light: {
                                description: nls.localize('contributes.defaults.light', 'The default color for light themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            },
                            dark: {
                                description: nls.localize('contributes.defaults.dark', 'The default color for dark themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            },
                            highContrast: {
                                description: nls.localize('contributes.defaults.highContrast', 'The default color for high contrast themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            }
                        }
                    },
                }
            }
        }
    });
    class ColorExtensionPoint {
        constructor() {
            configurationExtPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.colorConfiguration', "'configuration.colors' must be a array"));
                        return;
                    }
                    let parseColorValue = (s, name) => {
                        if (s.length > 0) {
                            if (s[0] === '#') {
                                return color_1.Color.Format.CSS.parseHex(s);
                            }
                            else {
                                return s;
                            }
                        }
                        collector.error(nls.localize('invalid.default.colorType', "{0} must be either a color value in hex (#RRGGBB[AA] or #RGB[A]) or the identifier of a themable color which provides the default.", name));
                        return color_1.Color.red;
                    };
                    for (const colorContribution of extensionValue) {
                        if (typeof colorContribution.id !== 'string' || colorContribution.id.length === 0) {
                            collector.error(nls.localize('invalid.id', "'configuration.colors.id' must be defined and can not be empty"));
                            return;
                        }
                        if (!colorContribution.id.match(colorIdPattern)) {
                            collector.error(nls.localize('invalid.id.format', "'configuration.colors.id' must only contain letters, digits and dots and can not start with a dot"));
                            return;
                        }
                        if (typeof colorContribution.description !== 'string' || colorContribution.id.length === 0) {
                            collector.error(nls.localize('invalid.description', "'configuration.colors.description' must be defined and can not be empty"));
                            return;
                        }
                        let defaults = colorContribution.defaults;
                        if (!defaults || typeof defaults !== 'object' || typeof defaults.light !== 'string' || typeof defaults.dark !== 'string' || typeof defaults.highContrast !== 'string') {
                            collector.error(nls.localize('invalid.defaults', "'configuration.colors.defaults' must be defined and must contain 'light', 'dark' and 'highContrast'"));
                            return;
                        }
                        colorRegistry.registerColor(colorContribution.id, {
                            light: parseColorValue(defaults.light, 'configuration.colors.defaults.light'),
                            dark: parseColorValue(defaults.dark, 'configuration.colors.defaults.dark'),
                            hc: parseColorValue(defaults.highContrast, 'configuration.colors.defaults.highContrast')
                        }, colorContribution.description);
                    }
                }
                for (const extension of delta.removed) {
                    const extensionValue = extension.value;
                    for (const colorContribution of extensionValue) {
                        colorRegistry.deregisterColor(colorContribution.id);
                    }
                }
            });
        }
    }
    exports.ColorExtensionPoint = ColorExtensionPoint;
});
//# __sourceMappingURL=colorExtensionPoint.js.map