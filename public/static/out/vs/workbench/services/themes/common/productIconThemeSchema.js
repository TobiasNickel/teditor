define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls, platform_1, jsonContributionRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerProductIconThemeSchemas = exports.fontSizeRegex = exports.fontWeightRegex = exports.fontStyleRegex = exports.fontIdRegex = void 0;
    exports.fontIdRegex = '^([\\w-_]+)$';
    exports.fontStyleRegex = '^(normal|italic|(oblique[ \\w\\s-]+))$';
    exports.fontWeightRegex = '^(normal|bold|lighter|bolder|(\\d{0-1000}))$';
    exports.fontSizeRegex = '^([\\w .%-_]+)$';
    const schemaId = 'vscode://schemas/product-icon-theme';
    const schema = {
        type: 'object',
        allowComments: true,
        allowTrailingCommas: true,
        properties: {
            fonts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: nls.localize('schema.id', 'The ID of the font.'),
                            pattern: exports.fontIdRegex,
                            patternErrorMessage: nls.localize('schema.id.formatError', 'The ID must only contain letters, numbers, underscore and minus.')
                        },
                        src: {
                            type: 'array',
                            description: nls.localize('schema.src', 'The location of the font.'),
                            items: {
                                type: 'object',
                                properties: {
                                    path: {
                                        type: 'string',
                                        description: nls.localize('schema.font-path', 'The font path, relative to the current product icon theme file.'),
                                    },
                                    format: {
                                        type: 'string',
                                        description: nls.localize('schema.font-format', 'The format of the font.'),
                                        enum: ['woff', 'woff2', 'truetype', 'opentype', 'embedded-opentype', 'svg']
                                    }
                                },
                                required: [
                                    'path',
                                    'format'
                                ]
                            }
                        },
                        weight: {
                            type: 'string',
                            description: nls.localize('schema.font-weight', 'The weight of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight for valid values.'),
                            anyOf: [
                                { enum: ['normal', 'bold', 'lighter', 'bolder'] },
                                { type: 'string', pattern: exports.fontWeightRegex }
                            ]
                        },
                        style: {
                            type: 'string',
                            description: nls.localize('schema.font-style', 'The style of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-style for valid values.'),
                            anyOf: [
                                { enum: ['normal', 'italic', 'oblique'] },
                                { type: 'string', pattern: exports.fontStyleRegex }
                            ]
                        }
                    },
                    required: [
                        'id',
                        'src'
                    ]
                }
            },
            iconDefinitions: {
                description: nls.localize('schema.iconDefinitions', 'Association of icon name to a font character.'),
                $ref: iconRegistry_1.iconsSchemaId,
                additionalProperties: false
            }
        }
    };
    function registerProductIconThemeSchemas() {
        let schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        schemaRegistry.registerSchema(schemaId, schema);
    }
    exports.registerProductIconThemeSchemas = registerProductIconThemeSchemas;
});
//# __sourceMappingURL=productIconThemeSchema.js.map