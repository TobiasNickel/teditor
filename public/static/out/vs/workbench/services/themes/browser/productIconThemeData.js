/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/json", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/jsonErrorMessages", "vs/base/browser/dom", "vs/workbench/services/themes/common/themeConfiguration", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/base/common/types", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService"], function (require, exports, uri_1, nls, Paths, resources, Json, workbenchThemeService_1, jsonErrorMessages_1, dom_1, themeConfiguration_1, productIconThemeSchema_1, types_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProductIconThemeData = exports.DEFAULT_PRODUCT_ICON_THEME_ID = void 0;
    const PERSISTED_PRODUCT_ICON_THEME_STORAGE_KEY = 'productIconThemeData';
    exports.DEFAULT_PRODUCT_ICON_THEME_ID = ''; // TODO
    class ProductIconThemeData {
        constructor(id, label, settingsId) {
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        ensureLoaded(fileService, logService) {
            return !this.isLoaded ? this.load(fileService, logService) : Promise.resolve(this.styleSheetContent);
        }
        reload(fileService, logService) {
            return this.load(fileService, logService);
        }
        load(fileService, logService) {
            const location = this.location;
            if (!location) {
                return Promise.resolve(this.styleSheetContent);
            }
            return _loadProductIconThemeDocument(fileService, location).then(iconThemeDocument => {
                const result = _processIconThemeDocument(this.id, location, iconThemeDocument);
                this.styleSheetContent = result.content;
                this.isLoaded = true;
                if (result.warnings.length) {
                    logService.error(nls.localize('error.parseicondefs', "Problems processing product icons definitions in {0}:\n{1}", location.toString(), result.warnings.join('\n')));
                }
                return this.styleSheetContent;
            });
        }
        static fromExtensionTheme(iconTheme, iconThemeLocation, extensionData) {
            const id = extensionData.extensionId + '-' + iconTheme.id;
            const label = iconTheme.label || Paths.basename(iconTheme.path);
            const settingsId = iconTheme.id;
            const themeData = new ProductIconThemeData(id, label, settingsId);
            themeData.description = iconTheme.description;
            themeData.location = iconThemeLocation;
            themeData.extensionData = extensionData;
            themeData.watch = iconTheme._watch;
            themeData.isLoaded = false;
            return themeData;
        }
        static createUnloadedTheme(id) {
            const themeData = new ProductIconThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.extensionData = undefined;
            themeData.watch = false;
            return themeData;
        }
        static get defaultTheme() {
            let themeData = ProductIconThemeData._defaultProductIconTheme;
            if (!themeData) {
                themeData = ProductIconThemeData._defaultProductIconTheme = new ProductIconThemeData(exports.DEFAULT_PRODUCT_ICON_THEME_ID, nls.localize('defaultTheme', 'Default'), themeConfiguration_1.DEFAULT_PRODUCT_ICON_THEME_SETTING_VALUE);
                themeData.isLoaded = true;
                themeData.extensionData = undefined;
                themeData.watch = false;
            }
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(PERSISTED_PRODUCT_ICON_THEME_STORAGE_KEY, 0 /* GLOBAL */);
            if (!input) {
                return undefined;
            }
            try {
                let data = JSON.parse(input);
                const theme = new ProductIconThemeData('', '', '');
                for (let key in data) {
                    switch (key) {
                        case 'id':
                        case 'label':
                        case 'description':
                        case 'settingsId':
                        case 'styleSheetContent':
                        case 'watch':
                            theme[key] = data[key];
                            break;
                        case 'location':
                            theme.location = uri_1.URI.revive(data.location);
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        toStorage(storageService) {
            var _a;
            const data = JSON.stringify({
                id: this.id,
                label: this.label,
                description: this.description,
                settingsId: this.settingsId,
                location: (_a = this.location) === null || _a === void 0 ? void 0 : _a.toJSON(),
                styleSheetContent: this.styleSheetContent,
                watch: this.watch,
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
            });
            storageService.store(PERSISTED_PRODUCT_ICON_THEME_STORAGE_KEY, data, 0 /* GLOBAL */);
        }
    }
    exports.ProductIconThemeData = ProductIconThemeData;
    ProductIconThemeData._defaultProductIconTheme = null;
    function _loadProductIconThemeDocument(fileService, location) {
        return fileService.readFile(location).then((content) => {
            let errors = [];
            let contentValue = Json.parse(content.value.toString(), errors);
            if (errors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparseicontheme', "Problems parsing product icons file: {0}", errors.map(e => jsonErrorMessages_1.getParseErrorMessage(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for product icons theme file: Object expected.")));
            }
            else if (!contentValue.iconDefinitions || !Array.isArray(contentValue.fonts) || !contentValue.fonts.length) {
                return Promise.reject(new Error(nls.localize('error.missingProperties', "Invalid format for product icons theme file: Must contain iconDefinitions and fonts.")));
            }
            return Promise.resolve(contentValue);
        });
    }
    function _processIconThemeDocument(id, iconThemeDocumentLocation, iconThemeDocument) {
        const warnings = [];
        const result = { content: '', warnings };
        if (!iconThemeDocument.iconDefinitions || !Array.isArray(iconThemeDocument.fonts) || !iconThemeDocument.fonts.length) {
            return result;
        }
        const iconThemeDocumentLocationDirname = resources.dirname(iconThemeDocumentLocation);
        function resolvePath(path) {
            return resources.joinPath(iconThemeDocumentLocationDirname, path);
        }
        const cssRules = [];
        const fonts = iconThemeDocument.fonts;
        const fontIdMapping = {};
        for (const font of fonts) {
            const src = font.src.map(l => `${dom_1.asCSSUrl(resolvePath(l.path))} format('${l.format}')`).join(', ');
            if (types_1.isString(font.id) && font.id.match(productIconThemeSchema_1.fontIdRegex)) {
                const fontId = `pi-` + font.id;
                fontIdMapping[font.id] = fontId;
                let fontWeight = '';
                if (types_1.isString(font.weight) && font.weight.match(productIconThemeSchema_1.fontWeightRegex)) {
                    fontWeight = `font-weight: ${font.weight};`;
                }
                else {
                    warnings.push(nls.localize('error.fontWeight', 'Invalid font weight in font \'{0}\'. Ignoring setting.', font.id));
                }
                let fontStyle = '';
                if (types_1.isString(font.style) && font.style.match(productIconThemeSchema_1.fontStyleRegex)) {
                    fontStyle = `font-style: ${font.style};`;
                }
                else {
                    warnings.push(nls.localize('error.fontStyle', 'Invalid font style in font \'{0}\'. Ignoring setting.', font.id));
                }
                cssRules.push(`@font-face { src: ${src}; font-family: '${fontId}';${fontWeight}${fontStyle} }`);
            }
            else {
                warnings.push(nls.localize('error.fontId', 'Missing or invalid font id \'{0}\'. Skipping font definition.', font.id));
            }
        }
        const primaryFontId = fonts.length > 0 ? fontIdMapping[fonts[0].id] : '';
        const iconDefinitions = iconThemeDocument.iconDefinitions;
        const iconRegistry = iconRegistry_1.getIconRegistry();
        for (let iconContribution of iconRegistry.getIcons()) {
            const iconId = iconContribution.id;
            let definition = iconDefinitions[iconId];
            // look if an inherited icon has a definition
            while (!definition && themeService_1.ThemeIcon.isThemeIcon(iconContribution.defaults)) {
                const ic = iconRegistry.getIcon(iconContribution.defaults.id);
                if (ic) {
                    definition = iconDefinitions[ic.id];
                    iconContribution = ic;
                }
                else {
                    break;
                }
            }
            if (definition) {
                if (types_1.isString(definition.fontCharacter)) {
                    const fontId = definition.fontId !== undefined ? fontIdMapping[definition.fontId] : primaryFontId;
                    if (fontId) {
                        cssRules.push(`.codicon-${iconId}:before { content: '${definition.fontCharacter}' !important; font-family: ${fontId} !important; }`);
                    }
                    else {
                        warnings.push(nls.localize('error.icon.fontId', 'Skipping icon definition \'{0}\'. Unknown font.', iconId));
                    }
                }
                else {
                    warnings.push(nls.localize('error.icon.fontCharacter', 'Skipping icon definition \'{0}\'. Unknown fontCharacter.', iconId));
                }
            }
        }
        result.content = cssRules.join('\n');
        return result;
    }
});
//# __sourceMappingURL=productIconThemeData.js.map