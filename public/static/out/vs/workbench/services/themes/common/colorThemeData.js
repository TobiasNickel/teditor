/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/json", "vs/base/common/color", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/themes/common/themeCompatibility", "vs/nls", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/arrays", "vs/base/common/resources", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/registry/common/platform", "vs/base/common/jsonErrorMessages", "vs/base/common/uri", "vs/workbench/services/themes/common/plistParser", "vs/base/common/strings", "vs/platform/theme/common/tokenClassificationRegistry", "vs/workbench/services/themes/common/textMateScopeMatcher"], function (require, exports, path_1, Json, color_1, workbenchThemeService_1, themeCompatibility_1, nls, types, objects, arrays, resources, colorRegistry_1, themeService_1, platform_1, jsonErrorMessages_1, uri_1, plistParser_1, strings_1, tokenClassificationRegistry_1, textMateScopeMatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorThemeData = void 0;
    let colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    let tokenClassificationRegistry = tokenClassificationRegistry_1.getTokenClassificationRegistry();
    const tokenGroupToScopesMap = {
        comments: ['comment', 'punctuation.definition.comment'],
        strings: ['string', 'meta.embedded.assembly'],
        keywords: ['keyword - keyword.operator', 'keyword.control', 'storage', 'storage.type'],
        numbers: ['constant.numeric'],
        types: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
        functions: ['entity.name.function', 'support.function'],
        variables: ['variable', 'entity.name.variable']
    };
    const PERSISTED_THEME_STORAGE_KEY = 'colorThemeData';
    class ColorThemeData {
        constructor(id, label, settingsId) {
            this.themeTokenColors = [];
            this.customTokenColors = [];
            this.colorMap = {};
            this.customColorMap = {};
            this.semanticTokenRules = [];
            this.customSemanticTokenRules = [];
            this.textMateThemingRules = undefined; // created on demand
            this.tokenColorIndex = undefined; // created on demand
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        get semanticHighlighting() {
            if (this.customSemanticHighlighting !== undefined) {
                return this.customSemanticHighlighting;
            }
            if (this.customSemanticHighlightingDeprecated !== undefined) {
                return this.customSemanticHighlightingDeprecated;
            }
            return !!this.themeSemanticHighlighting;
        }
        get tokenColors() {
            if (!this.textMateThemingRules) {
                const result = [];
                // the default rule (scope empty) is always the first rule. Ignore all other default rules.
                const foreground = this.getColor(colorRegistry_1.editorForeground) || this.getDefault(colorRegistry_1.editorForeground);
                const background = this.getColor(colorRegistry_1.editorBackground) || this.getDefault(colorRegistry_1.editorBackground);
                result.push({
                    settings: {
                        foreground: normalizeColor(foreground),
                        background: normalizeColor(background)
                    }
                });
                let hasDefaultTokens = false;
                function addRule(rule) {
                    if (rule.scope && rule.settings) {
                        if (rule.scope === 'token.info-token') {
                            hasDefaultTokens = true;
                        }
                        result.push({ scope: rule.scope, settings: { foreground: normalizeColor(rule.settings.foreground), background: normalizeColor(rule.settings.background), fontStyle: rule.settings.fontStyle } });
                    }
                }
                this.themeTokenColors.forEach(addRule);
                // Add the custom colors after the theme colors
                // so that they will override them
                this.customTokenColors.forEach(addRule);
                if (!hasDefaultTokens) {
                    defaultThemeColors[this.type].forEach(addRule);
                }
                this.textMateThemingRules = result;
            }
            return this.textMateThemingRules;
        }
        getColor(colorId, useDefault) {
            let color = this.customColorMap[colorId];
            if (color) {
                return color;
            }
            color = this.colorMap[colorId];
            if (useDefault !== false && types.isUndefined(color)) {
                color = this.getDefault(colorId);
            }
            return color;
        }
        getTokenStyle(type, modifiers, language, useDefault = true, definitions = {}) {
            let result = {
                foreground: undefined,
                bold: undefined,
                underline: undefined,
                italic: undefined
            };
            let score = {
                foreground: -1,
                bold: -1,
                underline: -1,
                italic: -1
            };
            function _processStyle(matchScore, style, definition) {
                if (style.foreground && score.foreground <= matchScore) {
                    score.foreground = matchScore;
                    result.foreground = style.foreground;
                    definitions.foreground = definition;
                }
                for (let p of ['bold', 'underline', 'italic']) {
                    const property = p;
                    const info = style[property];
                    if (info !== undefined) {
                        if (score[property] <= matchScore) {
                            score[property] = matchScore;
                            result[property] = info;
                            definitions[property] = definition;
                        }
                    }
                }
            }
            function _processSemanticTokenRule(rule) {
                const matchScore = rule.selector.match(type, modifiers, language);
                if (matchScore >= 0) {
                    _processStyle(matchScore, rule.style, rule);
                }
            }
            this.semanticTokenRules.forEach(_processSemanticTokenRule);
            this.customSemanticTokenRules.forEach(_processSemanticTokenRule);
            let hasUndefinedStyleProperty = false;
            for (let k in score) {
                const key = k;
                if (score[key] === -1) {
                    hasUndefinedStyleProperty = true;
                }
                else {
                    score[key] = Number.MAX_VALUE; // set it to the max, so it won't be replaced by a default
                }
            }
            if (hasUndefinedStyleProperty) {
                for (const rule of tokenClassificationRegistry.getTokenStylingDefaultRules()) {
                    const matchScore = rule.selector.match(type, modifiers, language);
                    if (matchScore >= 0) {
                        let style;
                        if (rule.defaults.scopesToProbe) {
                            style = this.resolveScopes(rule.defaults.scopesToProbe);
                            if (style) {
                                _processStyle(matchScore, style, rule.defaults.scopesToProbe);
                            }
                        }
                        if (!style && useDefault !== false) {
                            const tokenStyleValue = rule.defaults[this.type];
                            style = this.resolveTokenStyleValue(tokenStyleValue);
                            if (style) {
                                _processStyle(matchScore, style, tokenStyleValue);
                            }
                        }
                    }
                }
            }
            return tokenClassificationRegistry_1.TokenStyle.fromData(result);
        }
        /**
         * @param tokenStyleValue Resolve a tokenStyleValue in the context of a theme
         */
        resolveTokenStyleValue(tokenStyleValue) {
            if (tokenStyleValue === undefined) {
                return undefined;
            }
            else if (typeof tokenStyleValue === 'string') {
                const { type, modifiers, language } = tokenClassificationRegistry_1.parseClassifierString(tokenStyleValue, '');
                return this.getTokenStyle(type, modifiers, language);
            }
            else if (typeof tokenStyleValue === 'object') {
                return tokenStyleValue;
            }
            return undefined;
        }
        getTokenColorIndex() {
            // collect all colors that tokens can have
            if (!this.tokenColorIndex) {
                const index = new TokenColorIndex();
                this.tokenColors.forEach(rule => {
                    index.add(rule.settings.foreground);
                    index.add(rule.settings.background);
                });
                this.semanticTokenRules.forEach(r => index.add(r.style.foreground));
                tokenClassificationRegistry.getTokenStylingDefaultRules().forEach(r => {
                    const defaultColor = r.defaults[this.type];
                    if (defaultColor && typeof defaultColor === 'object') {
                        index.add(defaultColor.foreground);
                    }
                });
                this.customSemanticTokenRules.forEach(r => index.add(r.style.foreground));
                this.tokenColorIndex = index;
            }
            return this.tokenColorIndex;
        }
        get tokenColorMap() {
            return this.getTokenColorIndex().asArray();
        }
        getTokenStyleMetadata(typeWithLanguage, modifiers, defaultLanguage, useDefault = true, definitions = {}) {
            const { type, language } = tokenClassificationRegistry_1.parseClassifierString(typeWithLanguage, defaultLanguage);
            let style = this.getTokenStyle(type, modifiers, language, useDefault, definitions);
            if (!style) {
                return undefined;
            }
            return {
                foreground: this.getTokenColorIndex().get(style.foreground),
                bold: style.bold,
                underline: style.underline,
                italic: style.italic
            };
        }
        getTokenStylingRuleScope(rule) {
            if (this.customSemanticTokenRules.indexOf(rule) !== -1) {
                return 'setting';
            }
            if (this.semanticTokenRules.indexOf(rule) !== -1) {
                return 'theme';
            }
            return undefined;
        }
        getDefault(colorId) {
            return colorRegistry.resolveDefaultColor(colorId, this);
        }
        resolveScopes(scopes, definitions) {
            if (!this.themeTokenScopeMatchers) {
                this.themeTokenScopeMatchers = this.themeTokenColors.map(getScopeMatcher);
            }
            if (!this.customTokenScopeMatchers) {
                this.customTokenScopeMatchers = this.customTokenColors.map(getScopeMatcher);
            }
            for (let scope of scopes) {
                let foreground = undefined;
                let fontStyle = undefined;
                let foregroundScore = -1;
                let fontStyleScore = -1;
                let fontStyleThemingRule = undefined;
                let foregroundThemingRule = undefined;
                function findTokenStyleForScopeInScopes(scopeMatchers, themingRules) {
                    for (let i = 0; i < scopeMatchers.length; i++) {
                        const score = scopeMatchers[i](scope);
                        if (score >= 0) {
                            const themingRule = themingRules[i];
                            const settings = themingRules[i].settings;
                            if (score >= foregroundScore && settings.foreground) {
                                foreground = settings.foreground;
                                foregroundScore = score;
                                foregroundThemingRule = themingRule;
                            }
                            if (score >= fontStyleScore && types.isString(settings.fontStyle)) {
                                fontStyle = settings.fontStyle;
                                fontStyleScore = score;
                                fontStyleThemingRule = themingRule;
                            }
                        }
                    }
                }
                findTokenStyleForScopeInScopes(this.themeTokenScopeMatchers, this.themeTokenColors);
                findTokenStyleForScopeInScopes(this.customTokenScopeMatchers, this.customTokenColors);
                if (foreground !== undefined || fontStyle !== undefined) {
                    if (definitions) {
                        definitions.foreground = foregroundThemingRule;
                        definitions.bold = definitions.italic = definitions.underline = fontStyleThemingRule;
                        definitions.scope = scope;
                    }
                    return tokenClassificationRegistry_1.TokenStyle.fromSettings(foreground, fontStyle);
                }
            }
            return undefined;
        }
        defines(colorId) {
            return this.customColorMap.hasOwnProperty(colorId) || this.colorMap.hasOwnProperty(colorId);
        }
        setCustomizations(settings) {
            this.setCustomColors(settings.colorCustomizations);
            this.setCustomTokenColors(settings.tokenColorCustomizations);
            this.setCustomSemanticTokenColors(settings.semanticTokenColorCustomizations, settings.experimentalSemanticTokenColorCustomizations);
        }
        setCustomColors(colors) {
            this.customColorMap = {};
            this.overwriteCustomColors(colors);
            const themeSpecificColors = colors[`[${this.settingsId}]`];
            if (types.isObject(themeSpecificColors)) {
                this.overwriteCustomColors(themeSpecificColors);
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        overwriteCustomColors(colors) {
            for (let id in colors) {
                let colorVal = colors[id];
                if (typeof colorVal === 'string') {
                    this.customColorMap[id] = color_1.Color.fromHex(colorVal);
                }
            }
        }
        setCustomTokenColors(customTokenColors) {
            this.customTokenColors = [];
            this.customSemanticHighlightingDeprecated = undefined;
            // first add the non-theme specific settings
            this.addCustomTokenColors(customTokenColors);
            // append theme specific settings. Last rules will win.
            const themeSpecificTokenColors = customTokenColors[`[${this.settingsId}]`];
            if (types.isObject(themeSpecificTokenColors)) {
                this.addCustomTokenColors(themeSpecificTokenColors);
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        setCustomSemanticTokenColors(semanticTokenColors, experimental) {
            this.customSemanticTokenRules = [];
            this.customSemanticHighlighting = undefined;
            if (experimental) { // apply deprecated settings first
                this.readSemanticTokenRules(experimental);
                const themeSpecificColors = experimental[`[${this.settingsId}]`];
                if (types.isObject(themeSpecificColors)) {
                    this.readSemanticTokenRules(themeSpecificColors);
                }
            }
            if (semanticTokenColors) {
                this.customSemanticHighlighting = semanticTokenColors.enabled;
                if (semanticTokenColors.rules) {
                    this.readSemanticTokenRules(semanticTokenColors.rules);
                }
                const themeSpecificColors = semanticTokenColors[`[${this.settingsId}]`];
                if (types.isObject(themeSpecificColors)) {
                    if (themeSpecificColors.enabled !== undefined) {
                        this.customSemanticHighlighting = themeSpecificColors.enabled;
                    }
                    if (themeSpecificColors.rules) {
                        this.readSemanticTokenRules(themeSpecificColors.rules);
                    }
                }
            }
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
        }
        readSemanticTokenRules(tokenStylingRuleSection) {
            for (let key in tokenStylingRuleSection) {
                if (key[0] !== '[') { // still do this test until experimental settings are gone
                    try {
                        const rule = readSemanticTokenRule(key, tokenStylingRuleSection[key]);
                        if (rule) {
                            this.customSemanticTokenRules.push(rule);
                        }
                    }
                    catch (e) {
                        // invalid selector, ignore
                    }
                }
            }
        }
        addCustomTokenColors(customTokenColors) {
            // Put the general customizations such as comments, strings, etc. first so that
            // they can be overridden by specific customizations like "string.interpolated"
            for (let tokenGroup in tokenGroupToScopesMap) {
                const group = tokenGroup; // TS doesn't type 'tokenGroup' properly
                let value = customTokenColors[group];
                if (value) {
                    let settings = typeof value === 'string' ? { foreground: value } : value;
                    let scopes = tokenGroupToScopesMap[group];
                    for (let scope of scopes) {
                        this.customTokenColors.push({ scope, settings });
                    }
                }
            }
            // specific customizations
            if (Array.isArray(customTokenColors.textMateRules)) {
                for (let rule of customTokenColors.textMateRules) {
                    if (rule.scope && rule.settings) {
                        this.customTokenColors.push(rule);
                    }
                }
            }
            if (customTokenColors.semanticHighlighting !== undefined) {
                this.customSemanticHighlightingDeprecated = customTokenColors.semanticHighlighting;
            }
        }
        ensureLoaded(extensionResourceLoaderService) {
            return !this.isLoaded ? this.load(extensionResourceLoaderService) : Promise.resolve(undefined);
        }
        reload(extensionResourceLoaderService) {
            return this.load(extensionResourceLoaderService);
        }
        load(extensionResourceLoaderService) {
            if (!this.location) {
                return Promise.resolve(undefined);
            }
            this.themeTokenColors = [];
            this.clearCaches();
            const result = {
                colors: {},
                textMateRules: [],
                semanticTokenRules: [],
                semanticHighlighting: false
            };
            return _loadColorTheme(extensionResourceLoaderService, this.location, result).then(_ => {
                this.isLoaded = true;
                this.semanticTokenRules = result.semanticTokenRules;
                this.colorMap = result.colors;
                this.themeTokenColors = result.textMateRules;
                this.themeSemanticHighlighting = result.semanticHighlighting;
            });
        }
        clearCaches() {
            this.tokenColorIndex = undefined;
            this.textMateThemingRules = undefined;
            this.themeTokenScopeMatchers = undefined;
            this.customTokenScopeMatchers = undefined;
        }
        toStorage(storageService) {
            var _a;
            let colorMapData = {};
            for (let key in this.colorMap) {
                colorMapData[key] = color_1.Color.Format.CSS.formatHexA(this.colorMap[key], true);
            }
            // no need to persist custom colors, they will be taken from the settings
            const value = JSON.stringify({
                id: this.id,
                label: this.label,
                settingsId: this.settingsId,
                selector: this.id.split(' ').join('.'),
                themeTokenColors: this.themeTokenColors,
                semanticTokenRules: this.semanticTokenRules.map(tokenClassificationRegistry_1.SemanticTokenRule.toJSONObject),
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                location: (_a = this.location) === null || _a === void 0 ? void 0 : _a.toJSON(),
                themeSemanticHighlighting: this.themeSemanticHighlighting,
                colorMap: colorMapData,
                watch: this.watch
            });
            storageService.store(PERSISTED_THEME_STORAGE_KEY, value, 0 /* GLOBAL */);
        }
        hasEqualData(other) {
            return objects.equals(this.colorMap, other.colorMap)
                && objects.equals(this.themeTokenColors, other.themeTokenColors)
                && arrays.equals(this.semanticTokenRules, other.semanticTokenRules, tokenClassificationRegistry_1.SemanticTokenRule.equals)
                && this.themeSemanticHighlighting === other.themeSemanticHighlighting;
        }
        get baseTheme() {
            return this.id.split(' ')[0];
        }
        get type() {
            switch (this.baseTheme) {
                case workbenchThemeService_1.VS_LIGHT_THEME: return 'light';
                case workbenchThemeService_1.VS_HC_THEME: return 'hc';
                default: return 'dark';
            }
        }
        // constructors
        static createUnloadedThemeForThemeType(themeType) {
            return ColorThemeData.createUnloadedTheme(themeService_1.getThemeTypeSelector(themeType));
        }
        static createUnloadedTheme(id) {
            let themeData = new ColorThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            return themeData;
        }
        static createLoadedEmptyTheme(id, settingsId) {
            let themeData = new ColorThemeData(id, '', settingsId);
            themeData.isLoaded = true;
            themeData.themeTokenColors = [];
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(PERSISTED_THEME_STORAGE_KEY, 0 /* GLOBAL */);
            if (!input) {
                return undefined;
            }
            try {
                let data = JSON.parse(input);
                let theme = new ColorThemeData('', '', '');
                for (let key in data) {
                    switch (key) {
                        case 'colorMap':
                            let colorMapData = data[key];
                            for (let id in colorMapData) {
                                theme.colorMap[id] = color_1.Color.fromHex(colorMapData[id]);
                            }
                            break;
                        case 'themeTokenColors':
                        case 'id':
                        case 'label':
                        case 'settingsId':
                        case 'watch':
                        case 'themeSemanticHighlighting':
                            theme[key] = data[key];
                            break;
                        case 'semanticTokenRules':
                            const rulesData = data[key];
                            if (Array.isArray(rulesData)) {
                                for (let d of rulesData) {
                                    const rule = tokenClassificationRegistry_1.SemanticTokenRule.fromJSONObject(tokenClassificationRegistry, d);
                                    if (rule) {
                                        theme.semanticTokenRules.push(rule);
                                    }
                                }
                            }
                            break;
                        case 'location':
                            theme.location = uri_1.URI.revive(data.location);
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                if (!theme.id || !theme.settingsId) {
                    return undefined;
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        static fromExtensionTheme(theme, colorThemeLocation, extensionData) {
            const baseTheme = theme['uiTheme'] || 'vs-dark';
            const themeSelector = toCSSSelector(extensionData.extensionId, theme.path);
            const id = `${baseTheme} ${themeSelector}`;
            const label = theme.label || path_1.basename(theme.path);
            const settingsId = theme.id || label;
            const themeData = new ColorThemeData(id, label, settingsId);
            themeData.description = theme.description;
            themeData.watch = theme._watch === true;
            themeData.location = colorThemeLocation;
            themeData.extensionData = extensionData;
            themeData.isLoaded = false;
            return themeData;
        }
    }
    exports.ColorThemeData = ColorThemeData;
    function toCSSSelector(extensionId, path) {
        if (strings_1.startsWith(path, './')) {
            path = path.substr(2);
        }
        let str = `${extensionId}-${path}`;
        //remove all characters that are not allowed in css
        str = str.replace(/[^_\-a-zA-Z0-9]/g, '-');
        if (str.charAt(0).match(/[0-9\-]/)) {
            str = '_' + str;
        }
        return str;
    }
    async function _loadColorTheme(extensionResourceLoaderService, themeLocation, result) {
        if (resources.extname(themeLocation) === '.json') {
            const content = await extensionResourceLoaderService.readExtensionResource(themeLocation);
            let errors = [];
            let contentValue = Json.parse(content, errors);
            if (errors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparsejson', "Problems parsing JSON theme file: {0}", errors.map(e => jsonErrorMessages_1.getParseErrorMessage(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for JSON theme file: Object expected.")));
            }
            if (contentValue.include) {
                await _loadColorTheme(extensionResourceLoaderService, resources.joinPath(resources.dirname(themeLocation), contentValue.include), result);
            }
            if (Array.isArray(contentValue.settings)) {
                themeCompatibility_1.convertSettings(contentValue.settings, result);
                return null;
            }
            result.semanticHighlighting = result.semanticHighlighting || contentValue.semanticHighlighting;
            let colors = contentValue.colors;
            if (colors) {
                if (typeof colors !== 'object') {
                    return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.colors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'colors' is not of type 'object'.", themeLocation.toString())));
                }
                // new JSON color themes format
                for (let colorId in colors) {
                    let colorHex = colors[colorId];
                    if (typeof colorHex === 'string') { // ignore colors tht are null
                        result.colors[colorId] = color_1.Color.fromHex(colors[colorId]);
                    }
                }
            }
            let tokenColors = contentValue.tokenColors;
            if (tokenColors) {
                if (Array.isArray(tokenColors)) {
                    result.textMateRules.push(...tokenColors);
                }
                else if (typeof tokenColors === 'string') {
                    await _loadSyntaxTokens(extensionResourceLoaderService, resources.joinPath(resources.dirname(themeLocation), tokenColors), result);
                }
                else {
                    return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.tokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'tokenColors' should be either an array specifying colors or a path to a TextMate theme file", themeLocation.toString())));
                }
            }
            let semanticTokenColors = contentValue.semanticTokenColors;
            if (semanticTokenColors && typeof semanticTokenColors === 'object') {
                for (let key in semanticTokenColors) {
                    try {
                        const rule = readSemanticTokenRule(key, semanticTokenColors[key]);
                        if (rule) {
                            result.semanticTokenRules.push(rule);
                        }
                    }
                    catch (e) {
                        return Promise.reject(new Error(nls.localize({ key: 'error.invalidformat.semanticTokenColors', comment: ['{0} will be replaced by a path. Values in quotes should not be translated.'] }, "Problem parsing color theme file: {0}. Property 'semanticTokenColors' conatains a invalid selector", themeLocation.toString())));
                    }
                }
            }
        }
        else {
            return _loadSyntaxTokens(extensionResourceLoaderService, themeLocation, result);
        }
    }
    function _loadSyntaxTokens(extensionResourceLoaderService, themeLocation, result) {
        return extensionResourceLoaderService.readExtensionResource(themeLocation).then(content => {
            try {
                let contentValue = plistParser_1.parse(content);
                let settings = contentValue.settings;
                if (!Array.isArray(settings)) {
                    return Promise.reject(new Error(nls.localize('error.plist.invalidformat', "Problem parsing tmTheme file: {0}. 'settings' is not array.")));
                }
                themeCompatibility_1.convertSettings(settings, result);
                return Promise.resolve(null);
            }
            catch (e) {
                return Promise.reject(new Error(nls.localize('error.cannotparse', "Problems parsing tmTheme file: {0}", e.message)));
            }
        }, error => {
            return Promise.reject(new Error(nls.localize('error.cannotload', "Problems loading tmTheme file {0}: {1}", themeLocation.toString(), error.message)));
        });
    }
    let defaultThemeColors = {
        'light': [
            { scope: 'token.info-token', settings: { foreground: '#316bcd' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#cd3131' } },
            { scope: 'token.debug-token', settings: { foreground: '#800080' } }
        ],
        'dark': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#cd9731' } },
            { scope: 'token.error-token', settings: { foreground: '#f44747' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ],
        'hc': [
            { scope: 'token.info-token', settings: { foreground: '#6796e6' } },
            { scope: 'token.warn-token', settings: { foreground: '#008000' } },
            { scope: 'token.error-token', settings: { foreground: '#FF0000' } },
            { scope: 'token.debug-token', settings: { foreground: '#b267e6' } }
        ],
    };
    const noMatch = (_scope) => -1;
    function nameMatcher(identifers, scope) {
        function findInIdents(s, lastIndent) {
            for (let i = lastIndent - 1; i >= 0; i--) {
                if (scopesAreMatching(s, identifers[i])) {
                    return i;
                }
            }
            return -1;
        }
        if (scope.length < identifers.length) {
            return -1;
        }
        let lastScopeIndex = scope.length - 1;
        let lastIdentifierIndex = findInIdents(scope[lastScopeIndex--], identifers.length);
        if (lastIdentifierIndex >= 0) {
            const score = (lastIdentifierIndex + 1) * 0x10000 + identifers[lastIdentifierIndex].length;
            while (lastScopeIndex >= 0) {
                lastIdentifierIndex = findInIdents(scope[lastScopeIndex--], lastIdentifierIndex);
                if (lastIdentifierIndex === -1) {
                    return -1;
                }
            }
            return score;
        }
        return -1;
    }
    function scopesAreMatching(thisScopeName, scopeName) {
        if (!thisScopeName) {
            return false;
        }
        if (thisScopeName === scopeName) {
            return true;
        }
        const len = scopeName.length;
        return thisScopeName.length > len && thisScopeName.substr(0, len) === scopeName && thisScopeName[len] === '.';
    }
    function getScopeMatcher(rule) {
        const ruleScope = rule.scope;
        if (!ruleScope || !rule.settings) {
            return noMatch;
        }
        const matchers = [];
        if (Array.isArray(ruleScope)) {
            for (let rs of ruleScope) {
                textMateScopeMatcher_1.createMatchers(rs, nameMatcher, matchers);
            }
        }
        else {
            textMateScopeMatcher_1.createMatchers(ruleScope, nameMatcher, matchers);
        }
        if (matchers.length === 0) {
            return noMatch;
        }
        return (scope) => {
            let max = matchers[0].matcher(scope);
            for (let i = 1; i < matchers.length; i++) {
                max = Math.max(max, matchers[i].matcher(scope));
            }
            return max;
        };
    }
    function readSemanticTokenRule(selectorString, settings) {
        const selector = tokenClassificationRegistry.parseTokenSelector(selectorString);
        let style;
        if (typeof settings === 'string') {
            style = tokenClassificationRegistry_1.TokenStyle.fromSettings(settings, undefined);
        }
        else if (isSemanticTokenColorizationSetting(settings)) {
            style = tokenClassificationRegistry_1.TokenStyle.fromSettings(settings.foreground, settings.fontStyle, settings.bold, settings.underline, settings.italic);
        }
        if (style) {
            return { selector, style };
        }
        return undefined;
    }
    function isSemanticTokenColorizationSetting(style) {
        return style && (types.isString(style.foreground) || types.isString(style.fontStyle) || types.isBoolean(style.italic)
            || types.isBoolean(style.underline) || types.isBoolean(style.bold));
    }
    class TokenColorIndex {
        constructor() {
            this._lastColorId = 0;
            this._id2color = [];
            this._color2id = Object.create(null);
        }
        add(color) {
            color = normalizeColor(color);
            if (color === undefined) {
                return 0;
            }
            let value = this._color2id[color];
            if (value) {
                return value;
            }
            value = ++this._lastColorId;
            this._color2id[color] = value;
            this._id2color[value] = color;
            return value;
        }
        get(color) {
            color = normalizeColor(color);
            if (color === undefined) {
                return 0;
            }
            let value = this._color2id[color];
            if (value) {
                return value;
            }
            console.log(`Color ${color} not in index.`);
            return 0;
        }
        asArray() {
            return this._id2color.slice(0);
        }
    }
    function normalizeColor(color) {
        if (!color) {
            return undefined;
        }
        if (typeof color !== 'string') {
            color = color_1.Color.Format.CSS.formatHexA(color, true);
        }
        const len = color.length;
        if (color.charCodeAt(0) !== 35 /* Hash */ || (len !== 4 && len !== 5 && len !== 7 && len !== 9)) {
            return undefined;
        }
        let result = [35 /* Hash */];
        for (let i = 1; i < len; i++) {
            const upper = hexUpper(color.charCodeAt(i));
            if (!upper) {
                return undefined;
            }
            result.push(upper);
            if (len === 4 || len === 5) {
                result.push(upper);
            }
        }
        if (result.length === 9 && result[7] === 70 /* F */ && result[8] === 70 /* F */) {
            result.length = 7;
        }
        return String.fromCharCode(...result);
    }
    function hexUpper(charCode) {
        if (charCode >= 48 /* Digit0 */ && charCode <= 57 /* Digit9 */ || charCode >= 65 /* A */ && charCode <= 70 /* F */) {
            return charCode;
        }
        else if (charCode >= 97 /* a */ && charCode <= 102 /* f */) {
            return charCode - 97 /* a */ + 65 /* A */;
        }
        return 0;
    }
});
//# __sourceMappingURL=colorThemeData.js.map