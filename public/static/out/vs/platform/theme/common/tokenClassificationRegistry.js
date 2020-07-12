/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/base/common/color", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/async", "vs/base/common/event"], function (require, exports, platform, color_1, nls, jsonContributionRegistry_1, async_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenStylingSchemaId = exports.getTokenClassificationRegistry = exports.parseClassifierString = exports.Extensions = exports.SemanticTokenRule = exports.TokenStyle = exports.fontStylePattern = exports.selectorPattern = exports.typeAndModifierIdPattern = exports.idPattern = exports.CLASSIFIER_MODIFIER_SEPARATOR = exports.TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR = exports.TOKEN_TYPE_WILDCARD = void 0;
    exports.TOKEN_TYPE_WILDCARD = '*';
    exports.TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR = ':';
    exports.CLASSIFIER_MODIFIER_SEPARATOR = '.';
    exports.idPattern = '\\w+[-_\\w+]*';
    exports.typeAndModifierIdPattern = `^${exports.idPattern}$`;
    exports.selectorPattern = `^(${exports.idPattern}|\\*)(\\${exports.CLASSIFIER_MODIFIER_SEPARATOR}${exports.idPattern})*(\\${exports.TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR}${exports.idPattern})?$`;
    exports.fontStylePattern = '^(\\s*(italic|bold|underline))*\\s*$';
    class TokenStyle {
        constructor(foreground, bold, underline, italic) {
            this.foreground = foreground;
            this.bold = bold;
            this.underline = underline;
            this.italic = italic;
        }
    }
    exports.TokenStyle = TokenStyle;
    (function (TokenStyle) {
        function toJSONObject(style) {
            return {
                _foreground: style.foreground === undefined ? null : color_1.Color.Format.CSS.formatHexA(style.foreground, true),
                _bold: style.bold === undefined ? null : style.bold,
                _underline: style.underline === undefined ? null : style.underline,
                _italic: style.italic === undefined ? null : style.italic,
            };
        }
        TokenStyle.toJSONObject = toJSONObject;
        function fromJSONObject(obj) {
            if (obj) {
                const boolOrUndef = (b) => (typeof b === 'boolean') ? b : undefined;
                const colorOrUndef = (s) => (typeof s === 'string') ? color_1.Color.fromHex(s) : undefined;
                return new TokenStyle(colorOrUndef(obj._foreground), boolOrUndef(obj._bold), boolOrUndef(obj._underline), boolOrUndef(obj._italic));
            }
            return undefined;
        }
        TokenStyle.fromJSONObject = fromJSONObject;
        function equals(s1, s2) {
            if (s1 === s2) {
                return true;
            }
            return s1 !== undefined && s2 !== undefined
                && (s1.foreground instanceof color_1.Color ? s1.foreground.equals(s2.foreground) : s2.foreground === undefined)
                && s1.bold === s2.bold
                && s1.underline === s2.underline
                && s1.italic === s2.italic;
        }
        TokenStyle.equals = equals;
        function is(s) {
            return s instanceof TokenStyle;
        }
        TokenStyle.is = is;
        function fromData(data) {
            return new TokenStyle(data.foreground, data.bold, data.underline, data.italic);
        }
        TokenStyle.fromData = fromData;
        function fromSettings(foreground, fontStyle, bold, underline, italic) {
            let foregroundColor = undefined;
            if (foreground !== undefined) {
                foregroundColor = color_1.Color.fromHex(foreground);
            }
            if (fontStyle !== undefined) {
                bold = italic = underline = false;
                const expression = /italic|bold|underline/g;
                let match;
                while ((match = expression.exec(fontStyle))) {
                    switch (match[0]) {
                        case 'bold':
                            bold = true;
                            break;
                        case 'italic':
                            italic = true;
                            break;
                        case 'underline':
                            underline = true;
                            break;
                    }
                }
            }
            return new TokenStyle(foregroundColor, bold, underline, italic);
        }
        TokenStyle.fromSettings = fromSettings;
    })(TokenStyle = exports.TokenStyle || (exports.TokenStyle = {}));
    var SemanticTokenRule;
    (function (SemanticTokenRule) {
        function fromJSONObject(registry, o) {
            if (o && typeof o._selector === 'string' && o._style) {
                const style = TokenStyle.fromJSONObject(o._style);
                if (style) {
                    try {
                        return { selector: registry.parseTokenSelector(o._selector), style };
                    }
                    catch (_ignore) {
                    }
                }
            }
            return undefined;
        }
        SemanticTokenRule.fromJSONObject = fromJSONObject;
        function toJSONObject(rule) {
            return {
                _selector: rule.selector.id,
                _style: TokenStyle.toJSONObject(rule.style)
            };
        }
        SemanticTokenRule.toJSONObject = toJSONObject;
        function equals(r1, r2) {
            if (r1 === r2) {
                return true;
            }
            return r1 !== undefined && r2 !== undefined
                && r1.selector && r2.selector && r1.selector.id === r2.selector.id
                && TokenStyle.equals(r1.style, r2.style);
        }
        SemanticTokenRule.equals = equals;
        function is(r) {
            return r && r.selector && typeof r.selector.selectorString === 'string' && TokenStyle.is(r.style);
        }
        SemanticTokenRule.is = is;
    })(SemanticTokenRule = exports.SemanticTokenRule || (exports.SemanticTokenRule = {}));
    // TokenStyle registry
    exports.Extensions = {
        TokenClassificationContribution: 'base.contributions.tokenClassification'
    };
    class TokenClassificationRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.currentTypeNumber = 0;
            this.currentModifierBit = 1;
            this.tokenStylingDefaultRules = [];
            this.tokenStylingSchema = {
                type: 'object',
                properties: {},
                patternProperties: {
                    [exports.selectorPattern]: getStylingSchemeEntry()
                },
                //errorMessage: nls.localize('schema.token.errors', 'Valid token selectors have the form (*|tokenType)(.tokenModifier)*(:tokenLanguage)?.'),
                additionalProperties: false,
                definitions: {
                    style: {
                        type: 'object',
                        description: nls.localize('schema.token.settings', 'Colors and styles for the token.'),
                        properties: {
                            foreground: {
                                type: 'string',
                                description: nls.localize('schema.token.foreground', 'Foreground color for the token.'),
                                format: 'color-hex',
                                default: '#ff0000'
                            },
                            background: {
                                type: 'string',
                                deprecationMessage: nls.localize('schema.token.background.warning', 'Token background colors are currently not supported.')
                            },
                            fontStyle: {
                                type: 'string',
                                description: nls.localize('schema.token.fontStyle', 'Sets the all font styles of the rule: \'italic\', \'bold\' or \'underline\' or a combination. All styles that are not listed are unset. The empty string unsets all styles.'),
                                pattern: exports.fontStylePattern,
                                patternErrorMessage: nls.localize('schema.fontStyle.error', 'Font style must be \'italic\', \'bold\' or \'underline\' or a combination. The empty string unsets all styles.'),
                                defaultSnippets: [{ label: nls.localize('schema.token.fontStyle.none', 'None (clear inherited style)'), bodyText: '""' }, { body: 'italic' }, { body: 'bold' }, { body: 'underline' }, { body: 'italic underline' }, { body: 'bold underline' }, { body: 'italic bold underline' }]
                            },
                            bold: {
                                type: 'boolean',
                                description: nls.localize('schema.token.bold', 'Sets or unsets the font style to bold. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            italic: {
                                type: 'boolean',
                                description: nls.localize('schema.token.italic', 'Sets or unsets the font style to italic. Note, the presence of \'fontStyle\' overrides this setting.'),
                            },
                            underline: {
                                type: 'boolean',
                                description: nls.localize('schema.token.underline', 'Sets or unsets the font style to underline. Note, the presence of \'fontStyle\' overrides this setting.'),
                            }
                        },
                        defaultSnippets: [{ body: { foreground: '${1:#FF0000}', fontStyle: '${2:bold}' } }]
                    }
                }
            };
            this.tokenTypeById = {};
            this.tokenModifierById = {};
            this.typeHierarchy = {};
        }
        registerTokenType(id, description, superType, deprecationMessage) {
            if (!id.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token type id.');
            }
            if (superType && !superType.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token super type id.');
            }
            const num = this.currentTypeNumber++;
            let tokenStyleContribution = { num, id, superType, description, deprecationMessage };
            this.tokenTypeById[id] = tokenStyleContribution;
            const stylingSchemeEntry = getStylingSchemeEntry(description, deprecationMessage);
            this.tokenStylingSchema.properties[id] = stylingSchemeEntry;
            this.typeHierarchy = {};
        }
        registerTokenModifier(id, description, deprecationMessage) {
            if (!id.match(exports.typeAndModifierIdPattern)) {
                throw new Error('Invalid token modifier id.');
            }
            const num = this.currentModifierBit;
            this.currentModifierBit = this.currentModifierBit * 2;
            let tokenStyleContribution = { num, id, description, deprecationMessage };
            this.tokenModifierById[id] = tokenStyleContribution;
            this.tokenStylingSchema.properties[`*.${id}`] = getStylingSchemeEntry(description, deprecationMessage);
        }
        parseTokenSelector(selectorString, language) {
            const selector = parseClassifierString(selectorString, language);
            if (!selector.type) {
                return {
                    match: () => -1,
                    id: '$invalid'
                };
            }
            return {
                match: (type, modifiers, language) => {
                    let score = 0;
                    if (selector.language !== undefined) {
                        if (selector.language !== language) {
                            return -1;
                        }
                        score += 10;
                    }
                    if (selector.type !== exports.TOKEN_TYPE_WILDCARD) {
                        const hierarchy = this.getTypeHierarchy(type);
                        const level = hierarchy.indexOf(selector.type);
                        if (level === -1) {
                            return -1;
                        }
                        score += (100 - level);
                    }
                    // all selector modifiers must be present
                    for (const selectorModifier of selector.modifiers) {
                        if (modifiers.indexOf(selectorModifier) === -1) {
                            return -1;
                        }
                    }
                    return score + selector.modifiers.length * 100;
                },
                id: `${[selector.type, ...selector.modifiers.sort()].join('.')}${selector.language !== undefined ? ':' + selector.language : ''}`
            };
        }
        registerTokenStyleDefault(selector, defaults) {
            this.tokenStylingDefaultRules.push({ selector, defaults });
        }
        deregisterTokenStyleDefault(selector) {
            const selectorString = selector.id;
            this.tokenStylingDefaultRules = this.tokenStylingDefaultRules.filter(r => r.selector.id !== selectorString);
        }
        deregisterTokenType(id) {
            delete this.tokenTypeById[id];
            delete this.tokenStylingSchema.properties[id];
            this.typeHierarchy = {};
        }
        deregisterTokenModifier(id) {
            delete this.tokenModifierById[id];
            delete this.tokenStylingSchema.properties[`*.${id}`];
        }
        getTokenTypes() {
            return Object.keys(this.tokenTypeById).map(id => this.tokenTypeById[id]);
        }
        getTokenModifiers() {
            return Object.keys(this.tokenModifierById).map(id => this.tokenModifierById[id]);
        }
        getTokenStylingSchema() {
            return this.tokenStylingSchema;
        }
        getTokenStylingDefaultRules() {
            return this.tokenStylingDefaultRules;
        }
        getTypeHierarchy(typeId) {
            let hierarchy = this.typeHierarchy[typeId];
            if (!hierarchy) {
                this.typeHierarchy[typeId] = hierarchy = [typeId];
                let type = this.tokenTypeById[typeId];
                while (type && type.superType) {
                    hierarchy.push(type.superType);
                    type = this.tokenTypeById[type.superType];
                }
            }
            return hierarchy;
        }
        toString() {
            let sorter = (a, b) => {
                let cat1 = a.indexOf('.') === -1 ? 0 : 1;
                let cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.tokenTypeById).sort(sorter).map(k => `- \`${k}\`: ${this.tokenTypeById[k].description}`).join('\n');
        }
    }
    const CHAR_LANGUAGE = exports.TOKEN_CLASSIFIER_LANGUAGE_SEPARATOR.charCodeAt(0);
    const CHAR_MODIFIER = exports.CLASSIFIER_MODIFIER_SEPARATOR.charCodeAt(0);
    function parseClassifierString(s, defaultLanguage) {
        let k = s.length;
        let language = defaultLanguage;
        const modifiers = [];
        for (let i = k - 1; i >= 0; i--) {
            const ch = s.charCodeAt(i);
            if (ch === CHAR_LANGUAGE || ch === CHAR_MODIFIER) {
                const segment = s.substring(i + 1, k);
                k = i;
                if (ch === CHAR_LANGUAGE) {
                    language = segment;
                }
                else {
                    modifiers.push(segment);
                }
            }
        }
        const type = s.substring(0, k);
        return { type, modifiers, language };
    }
    exports.parseClassifierString = parseClassifierString;
    let tokenClassificationRegistry = createDefaultTokenClassificationRegistry();
    platform.Registry.add(exports.Extensions.TokenClassificationContribution, tokenClassificationRegistry);
    function createDefaultTokenClassificationRegistry() {
        const registry = new TokenClassificationRegistry();
        function registerTokenType(id, description, scopesToProbe = [], superType, deprecationMessage) {
            registry.registerTokenType(id, description, superType, deprecationMessage);
            if (scopesToProbe) {
                registerTokenStyleDefault(id, scopesToProbe);
            }
            return id;
        }
        function registerTokenStyleDefault(selectorString, scopesToProbe) {
            try {
                const selector = registry.parseTokenSelector(selectorString);
                registry.registerTokenStyleDefault(selector, { scopesToProbe });
            }
            catch (e) {
                console.log(e);
            }
        }
        // default token types
        registerTokenType('comment', nls.localize('comment', "Style for comments."), [['comment']]);
        registerTokenType('string', nls.localize('string', "Style for strings."), [['string']]);
        registerTokenType('keyword', nls.localize('keyword', "Style for keywords."), [['keyword.control']]);
        registerTokenType('number', nls.localize('number', "Style for numbers."), [['constant.numeric']]);
        registerTokenType('regexp', nls.localize('regexp', "Style for expressions."), [['constant.regexp']]);
        registerTokenType('operator', nls.localize('operator', "Style for operators."), [['keyword.operator']]);
        registerTokenType('namespace', nls.localize('namespace', "Style for namespaces."), [['entity.name.namespace']]);
        registerTokenType('type', nls.localize('type', "Style for types."), [['entity.name.type'], ['support.type']]);
        registerTokenType('struct', nls.localize('struct', "Style for structs."), [['entity.name.type.struct']]);
        registerTokenType('class', nls.localize('class', "Style for classes."), [['entity.name.type.class'], ['support.class']]);
        registerTokenType('interface', nls.localize('interface', "Style for interfaces."), [['entity.name.type.interface']]);
        registerTokenType('enum', nls.localize('enum', "Style for enums."), [['entity.name.type.enum']]);
        registerTokenType('typeParameter', nls.localize('typeParameter', "Style for type parameters."), [['entity.name.type.parameter']]);
        registerTokenType('function', nls.localize('function', "Style for functions"), [['entity.name.function'], ['support.function']]);
        registerTokenType('member', nls.localize('member', "Style for member"), [['entity.name.function.member'], ['support.function']]);
        registerTokenType('macro', nls.localize('macro', "Style for macros."), [['entity.name.other.preprocessor.macro']]);
        registerTokenType('variable', nls.localize('variable', "Style for variables."), [['variable.other.readwrite'], ['entity.name.variable']]);
        registerTokenType('parameter', nls.localize('parameter', "Style for parameters."), [['variable.parameter']]);
        registerTokenType('property', nls.localize('property', "Style for properties."), [['variable.other.property']]);
        registerTokenType('enumMember', nls.localize('enumMember', "Style for enum members."), [['variable.other.enummember']]);
        registerTokenType('event', nls.localize('event', "Style for events."), [['variable.other.event']]);
        registerTokenType('label', nls.localize('labels', "Style for labels. "), undefined);
        // default token modifiers
        registry.registerTokenModifier('declaration', nls.localize('declaration', "Style for all symbol declarations."), undefined);
        registry.registerTokenModifier('documentation', nls.localize('documentation', "Style to use for references in documentation."), undefined);
        registry.registerTokenModifier('static', nls.localize('static', "Style to use for symbols that are static."), undefined);
        registry.registerTokenModifier('abstract', nls.localize('abstract', "Style to use for symbols that are abstract."), undefined);
        registry.registerTokenModifier('deprecated', nls.localize('deprecated', "Style to use for symbols that are deprecated."), undefined);
        registry.registerTokenModifier('modification', nls.localize('modification', "Style to use for write accesses."), undefined);
        registry.registerTokenModifier('async', nls.localize('async', "Style to use for symbols that are async."), undefined);
        registry.registerTokenModifier('readonly', nls.localize('readonly', "Style to use for symbols that are readonly."), undefined);
        registerTokenStyleDefault('variable.readonly', [['variable.other.constant']]);
        registerTokenStyleDefault('property.readonly', [['variable.other.constant.property']]);
        registerTokenStyleDefault('type.defaultLibrary', [['support.type']]);
        registerTokenStyleDefault('class.defaultLibrary', [['support.class']]);
        registerTokenStyleDefault('interface.defaultLibrary', [['support.class']]);
        registerTokenStyleDefault('variable.defaultLibrary', [['support.variable'], ['support.other.variable']]);
        registerTokenStyleDefault('variable.defaultLibrary.readonly', [['support.constant']]);
        registerTokenStyleDefault('property.defaultLibrary', [['support.variable.property']]);
        registerTokenStyleDefault('property.defaultLibrary.readonly', [['support.constant.property']]);
        registerTokenStyleDefault('function.defaultLibrary', [['support.function']]);
        registerTokenStyleDefault('member.defaultLibrary', [['support.function']]);
        return registry;
    }
    function getTokenClassificationRegistry() {
        return tokenClassificationRegistry;
    }
    exports.getTokenClassificationRegistry = getTokenClassificationRegistry;
    function getStylingSchemeEntry(description, deprecationMessage) {
        return {
            description,
            deprecationMessage,
            defaultSnippets: [{ body: '${1:#ff0000}' }],
            anyOf: [
                {
                    type: 'string',
                    format: 'color-hex'
                },
                {
                    $ref: '#definitions/style'
                }
            ]
        };
    }
    exports.tokenStylingSchemaId = 'vscode://schemas/token-styling';
    let schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.tokenStylingSchemaId, tokenClassificationRegistry.getTokenStylingSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.tokenStylingSchemaId), 200);
    tokenClassificationRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
//# __sourceMappingURL=tokenClassificationRegistry.js.map