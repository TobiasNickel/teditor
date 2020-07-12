/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event"], function (require, exports, nls, types, resources, extensionsRegistry_1, workbenchThemeService_1, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeRegistry = exports.registerProductIconThemeExtensionPoint = exports.registerFileIconThemeExtensionPoint = exports.registerColorThemeExtensionPoint = void 0;
    function registerColorThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'themes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.themes', 'Contributes textmate color themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { label: '${1:label}', id: '${2:id}', uiTheme: workbenchThemeService_1.VS_DARK_THEME, path: './themes/${3:id}.tmTheme.' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.themes.id', 'Id of the color theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.themes.label', 'Label of the color theme as shown in the UI.'),
                            type: 'string'
                        },
                        uiTheme: {
                            description: nls.localize('vscode.extension.contributes.themes.uiTheme', 'Base theme defining the colors around the editor: \'vs\' is the light color theme, \'vs-dark\' is the dark color theme. \'hc-black\' is the dark high contrast theme.'),
                            enum: [workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_HC_THEME]
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.themes.path', 'Path of the tmTheme file. The path is relative to the extension folder and is typically \'./colorthemes/awesome-color-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'uiTheme']
                }
            }
        });
    }
    exports.registerColorThemeExtensionPoint = registerColorThemeExtensionPoint;
    function registerFileIconThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'iconThemes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.iconThemes', 'Contributes file icon themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './fileicons/${3:id}-icon-theme.json' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.id', 'Id of the file icon theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.label', 'Label of the file icon theme as shown in the UI.'),
                            type: 'string'
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.path', 'Path of the file icon theme definition file. The path is relative to the extension folder and is typically \'./fileicons/awesome-icon-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'id']
                }
            }
        });
    }
    exports.registerFileIconThemeExtensionPoint = registerFileIconThemeExtensionPoint;
    function registerProductIconThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'productIconThemes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.productIconThemes', 'Contributes product icon themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './producticons/${3:id}-product-icon-theme.json' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.id', 'Id of the product icon theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.label', 'Label of the product icon theme as shown in the UI.'),
                            type: 'string'
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.path', 'Path of the product icon theme definition file. The path is relative to the extension folder and is typically \'./producticons/awesome-product-icon-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'id']
                }
            }
        });
    }
    exports.registerProductIconThemeExtensionPoint = registerProductIconThemeExtensionPoint;
    let ThemeRegistry = class ThemeRegistry {
        constructor(extensionService, themesExtPoint, create, idRequired = false, builtInTheme = undefined, isProposedApi = false) {
            this.extensionService = extensionService;
            this.themesExtPoint = themesExtPoint;
            this.create = create;
            this.idRequired = idRequired;
            this.builtInTheme = builtInTheme;
            this.isProposedApi = isProposedApi;
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.extensionThemes = [];
            this.initialize();
        }
        initialize() {
            this.themesExtPoint.setHandler((extensions, delta) => {
                const previousIds = {};
                const added = [];
                for (const theme of this.extensionThemes) {
                    previousIds[theme.id] = theme;
                }
                this.extensionThemes.length = 0;
                for (let ext of extensions) {
                    if (this.isProposedApi) {
                        extensions_1.checkProposedApiEnabled(ext.description);
                    }
                    let extensionData = {
                        extensionId: ext.description.identifier.value,
                        extensionPublisher: ext.description.publisher,
                        extensionName: ext.description.name,
                        extensionIsBuiltin: ext.description.isBuiltin,
                        extensionLocation: ext.description.extensionLocation
                    };
                    this.onThemes(extensionData, ext.value, ext.collector);
                }
                for (const theme of this.extensionThemes) {
                    if (!previousIds[theme.id]) {
                        added.push(theme);
                    }
                    else {
                        delete previousIds[theme.id];
                    }
                }
                const removed = Object.values(previousIds);
                this.onDidChangeEmitter.fire({ themes: this.extensionThemes, added, removed });
            });
        }
        onThemes(extensionData, themes, collector) {
            if (!Array.isArray(themes)) {
                collector.error(nls.localize('reqarray', "Extension point `{0}` must be an array.", this.themesExtPoint.name));
                return;
            }
            themes.forEach(theme => {
                if (!theme.path || !types.isString(theme.path)) {
                    collector.error(nls.localize('reqpath', "Expected string in `contributes.{0}.path`. Provided value: {1}", this.themesExtPoint.name, String(theme.path)));
                    return;
                }
                if (this.idRequired && (!theme.id || !types.isString(theme.id))) {
                    collector.error(nls.localize('reqid', "Expected string in `contributes.{0}.id`. Provided value: {1}", this.themesExtPoint.name, String(theme.id)));
                    return;
                }
                const themeLocation = resources.joinPath(extensionData.extensionLocation, theme.path);
                if (!resources.isEqualOrParent(themeLocation, extensionData.extensionLocation)) {
                    collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", this.themesExtPoint.name, themeLocation.path, extensionData.extensionLocation.path));
                }
                let themeData = this.create(theme, themeLocation, extensionData);
                this.extensionThemes.push(themeData);
            });
        }
        async findThemeById(themeId, defaultId) {
            if (this.builtInTheme && this.builtInTheme.id === themeId) {
                return this.builtInTheme;
            }
            const allThemes = await this.getThemes();
            let defaultTheme = undefined;
            for (let t of allThemes) {
                if (t.id === themeId) {
                    return t;
                }
                if (t.id === defaultId) {
                    defaultTheme = t;
                }
            }
            return defaultTheme;
        }
        async findThemeBySettingsId(settingsId, defaultId) {
            if (this.builtInTheme && this.builtInTheme.settingsId === settingsId) {
                return this.builtInTheme;
            }
            const allThemes = await this.getThemes();
            let defaultTheme = undefined;
            for (let t of allThemes) {
                if (t.settingsId === settingsId) {
                    return t;
                }
                if (t.id === defaultId) {
                    defaultTheme = t;
                }
            }
            return defaultTheme;
        }
        findThemeByExtensionLocation(extLocation) {
            if (extLocation) {
                return this.getThemes().then(allThemes => {
                    return allThemes.filter(t => t.extensionData && resources.isEqual(t.extensionData.extensionLocation, extLocation));
                });
            }
            return Promise.resolve([]);
        }
        getThemes() {
            return this.extensionService.whenInstalledExtensionsRegistered().then(_ => {
                return this.extensionThemes;
            });
        }
    };
    ThemeRegistry = __decorate([
        __param(0, extensions_1.IExtensionService)
    ], ThemeRegistry);
    exports.ThemeRegistry = ThemeRegistry;
});
//# __sourceMappingURL=themeExtensionPoints.js.map