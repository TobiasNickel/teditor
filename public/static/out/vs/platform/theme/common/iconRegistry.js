/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/async", "vs/base/common/codicons"], function (require, exports, platform, themeService_1, event_1, nls_1, jsonContributionRegistry_1, async_1, Codicons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.iconsSchemaId = exports.getIconRegistry = exports.registerIcon = exports.Extensions = void 0;
    //  ------ API types
    // color registry
    exports.Extensions = {
        IconContribution: 'base.contributions.icons'
    };
    class IconRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.iconSchema = {
                definitions: {
                    icons: {
                        type: 'object',
                        properties: {
                            fontId: { type: 'string', description: nls_1.localize('iconDefintion.fontId', 'The id of the font to use. If not set, the font that is defined first is used.') },
                            fontCharacter: { type: 'string', description: nls_1.localize('iconDefintion.fontCharacter', 'The font character associated with the icon definition.') }
                        },
                        additionalProperties: false,
                        defaultSnippets: [{ body: { fontCharacter: '\\\\e030' } }]
                    }
                },
                type: 'object',
                properties: {}
            };
            this.iconReferenceSchema = { type: 'string', enum: [], enumDescriptions: [] };
            this.iconsById = {};
        }
        registerIcon(id, defaults, description, deprecationMessage) {
            if (!description) {
                description = nls_1.localize('icon.defaultDescription', 'Icon with identifier \'{0}\'', id);
            }
            let iconContribution = { id, description, defaults, deprecationMessage };
            this.iconsById[id] = iconContribution;
            let propertySchema = { $ref: '#/definitions/icons' };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            propertySchema.markdownDescription = `${description}: $(${id})`;
            this.iconSchema.properties[id] = propertySchema;
            this.iconReferenceSchema.enum.push(id);
            this.iconReferenceSchema.enumDescriptions.push(description);
            this._onDidChangeSchema.fire();
            return { id };
        }
        deregisterIcon(id) {
            delete this.iconsById[id];
            delete this.iconSchema.properties[id];
            const index = this.iconReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.iconReferenceSchema.enum.splice(index, 1);
                this.iconReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChangeSchema.fire();
        }
        getIcons() {
            return Object.keys(this.iconsById).map(id => this.iconsById[id]);
        }
        getIcon(id) {
            return this.iconsById[id];
        }
        getIconSchema() {
            return this.iconSchema;
        }
        getIconReferenceSchema() {
            return this.iconReferenceSchema;
        }
        toString() {
            const sorter = (i1, i2) => {
                const isThemeIcon1 = themeService_1.ThemeIcon.isThemeIcon(i1.defaults);
                const isThemeIcon2 = themeService_1.ThemeIcon.isThemeIcon(i2.defaults);
                if (isThemeIcon1 !== isThemeIcon2) {
                    return isThemeIcon1 ? -1 : 1;
                }
                return i1.id.localeCompare(i2.id);
            };
            const classNames = (i) => {
                while (themeService_1.ThemeIcon.isThemeIcon(i.defaults)) {
                    i = this.iconsById[i.defaults.id];
                }
                return `codicon codicon-${i ? i.id : ''}`;
            };
            let reference = [];
            let docCss = [];
            const contributions = Object.keys(this.iconsById).map(key => this.iconsById[key]);
            for (const i of contributions.sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|${themeService_1.ThemeIcon.isThemeIcon(i.defaults) ? i.defaults.id : ''}|`);
                if (!themeService_1.ThemeIcon.isThemeIcon((i.defaults))) {
                    docCss.push(`.codicon-${i.id}:before { content: "${i.defaults.character}" }`);
                }
            }
            return reference.join('\n') + '\n\n' + docCss.join('\n');
        }
    }
    const iconRegistry = new IconRegistry();
    platform.Registry.add(exports.Extensions.IconContribution, iconRegistry);
    function registerIcon(id, defaults, description, deprecationMessage) {
        return iconRegistry.registerIcon(id, defaults, description, deprecationMessage);
    }
    exports.registerIcon = registerIcon;
    function getIconRegistry() {
        return iconRegistry;
    }
    exports.getIconRegistry = getIconRegistry;
    function initialize() {
        for (const icon of Codicons.iconRegistry.all) {
            registerIcon(icon.id, icon.definition);
        }
        Codicons.iconRegistry.onDidRegister(icon => registerIcon(icon.id, icon.definition));
    }
    initialize();
    exports.iconsSchemaId = 'vscode://schemas/icons';
    let schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.iconsSchemaId, iconRegistry.getIconSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.iconsSchemaId), 200);
    iconRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
//setTimeout(_ => console.log(iconRegistry.toString()), 5000);
//# __sourceMappingURL=iconRegistry.js.map