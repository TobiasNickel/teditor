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
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/types", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/services/modeService", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/textMate/common/textMateService", "vs/base/common/jsonErrorMessages", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader"], function (require, exports, nls, json_1, types, languageConfigurationRegistry_1, modeService_1, jsonContributionRegistry_1, platform_1, extensions_1, textMateService_1, jsonErrorMessages_1, extensionResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageConfigurationFileHandler = void 0;
    function isStringArr(something) {
        if (!Array.isArray(something)) {
            return false;
        }
        for (let i = 0, len = something.length; i < len; i++) {
            if (typeof something[i] !== 'string') {
                return false;
            }
        }
        return true;
    }
    function isCharacterPair(something) {
        return (isStringArr(something)
            && something.length === 2);
    }
    let LanguageConfigurationFileHandler = class LanguageConfigurationFileHandler {
        constructor(textMateService, _modeService, _extensionResourceLoaderService, _extensionService) {
            this._modeService = _modeService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._extensionService = _extensionService;
            this._done = [];
            // Listen for hints that a language configuration is needed/usefull and then load it once
            this._modeService.onDidCreateMode((mode) => {
                const languageIdentifier = mode.getLanguageIdentifier();
                // Modes can be instantiated before the extension points have finished registering
                this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                    this._loadConfigurationsForMode(languageIdentifier);
                });
            });
            textMateService.onDidEncounterLanguage((languageId) => {
                this._loadConfigurationsForMode(this._modeService.getLanguageIdentifier(languageId));
            });
        }
        _loadConfigurationsForMode(languageIdentifier) {
            if (this._done[languageIdentifier.id]) {
                return;
            }
            this._done[languageIdentifier.id] = true;
            let configurationFiles = this._modeService.getConfigurationFiles(languageIdentifier.language);
            configurationFiles.forEach((configFileLocation) => this._handleConfigFile(languageIdentifier, configFileLocation));
        }
        _handleConfigFile(languageIdentifier, configFileLocation) {
            this._extensionResourceLoaderService.readExtensionResource(configFileLocation).then((contents) => {
                const errors = [];
                let configuration = json_1.parse(contents, errors);
                if (errors.length) {
                    console.error(nls.localize('parseErrors', "Errors parsing {0}: {1}", configFileLocation.toString(), errors.map(e => (`[${e.offset}, ${e.length}] ${jsonErrorMessages_1.getParseErrorMessage(e.error)}`)).join('\n')));
                }
                if (json_1.getNodeType(configuration) !== 'object') {
                    console.error(nls.localize('formatError', "{0}: Invalid format, JSON object expected.", configFileLocation.toString()));
                    configuration = {};
                }
                this._handleConfig(languageIdentifier, configuration);
            }, (err) => {
                console.error(err);
            });
        }
        _extractValidCommentRule(languageIdentifier, configuration) {
            const source = configuration.comments;
            if (typeof source === 'undefined') {
                return null;
            }
            if (!types.isObject(source)) {
                console.warn(`[${languageIdentifier.language}]: language configuration: expected \`comments\` to be an object.`);
                return null;
            }
            let result = null;
            if (typeof source.lineComment !== 'undefined') {
                if (typeof source.lineComment !== 'string') {
                    console.warn(`[${languageIdentifier.language}]: language configuration: expected \`comments.lineComment\` to be a string.`);
                }
                else {
                    result = result || {};
                    result.lineComment = source.lineComment;
                }
            }
            if (typeof source.blockComment !== 'undefined') {
                if (!isCharacterPair(source.blockComment)) {
                    console.warn(`[${languageIdentifier.language}]: language configuration: expected \`comments.blockComment\` to be an array of two strings.`);
                }
                else {
                    result = result || {};
                    result.blockComment = source.blockComment;
                }
            }
            return result;
        }
        _extractValidBrackets(languageIdentifier, configuration) {
            const source = configuration.brackets;
            if (typeof source === 'undefined') {
                return null;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageIdentifier.language}]: language configuration: expected \`brackets\` to be an array.`);
                return null;
            }
            let result = null;
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (!isCharacterPair(pair)) {
                    console.warn(`[${languageIdentifier.language}]: language configuration: expected \`brackets[${i}]\` to be an array of two strings.`);
                    continue;
                }
                result = result || [];
                result.push(pair);
            }
            return result;
        }
        _extractValidAutoClosingPairs(languageIdentifier, configuration) {
            const source = configuration.autoClosingPairs;
            if (typeof source === 'undefined') {
                return null;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageIdentifier.language}]: language configuration: expected \`autoClosingPairs\` to be an array.`);
                return null;
            }
            let result = null;
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (Array.isArray(pair)) {
                    if (!isCharacterPair(pair)) {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`autoClosingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    result = result || [];
                    result.push({ open: pair[0], close: pair[1] });
                }
                else {
                    if (!types.isObject(pair)) {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`autoClosingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    if (typeof pair.open !== 'string') {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`autoClosingPairs[${i}].open\` to be a string.`);
                        continue;
                    }
                    if (typeof pair.close !== 'string') {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`autoClosingPairs[${i}].close\` to be a string.`);
                        continue;
                    }
                    if (typeof pair.notIn !== 'undefined') {
                        if (!isStringArr(pair.notIn)) {
                            console.warn(`[${languageIdentifier.language}]: language configuration: expected \`autoClosingPairs[${i}].notIn\` to be a string array.`);
                            continue;
                        }
                    }
                    result = result || [];
                    result.push({ open: pair.open, close: pair.close, notIn: pair.notIn });
                }
            }
            return result;
        }
        _extractValidSurroundingPairs(languageIdentifier, configuration) {
            const source = configuration.surroundingPairs;
            if (typeof source === 'undefined') {
                return null;
            }
            if (!Array.isArray(source)) {
                console.warn(`[${languageIdentifier.language}]: language configuration: expected \`surroundingPairs\` to be an array.`);
                return null;
            }
            let result = null;
            for (let i = 0, len = source.length; i < len; i++) {
                const pair = source[i];
                if (Array.isArray(pair)) {
                    if (!isCharacterPair(pair)) {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`surroundingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    result = result || [];
                    result.push({ open: pair[0], close: pair[1] });
                }
                else {
                    if (!types.isObject(pair)) {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`surroundingPairs[${i}]\` to be an array of two strings or an object.`);
                        continue;
                    }
                    if (typeof pair.open !== 'string') {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`surroundingPairs[${i}].open\` to be a string.`);
                        continue;
                    }
                    if (typeof pair.close !== 'string') {
                        console.warn(`[${languageIdentifier.language}]: language configuration: expected \`surroundingPairs[${i}].close\` to be a string.`);
                        continue;
                    }
                    result = result || [];
                    result.push({ open: pair.open, close: pair.close });
                }
            }
            return result;
        }
        // private _mapCharacterPairs(pairs: Array<CharacterPair | IAutoClosingPairConditional>): IAutoClosingPairConditional[] {
        // 	return pairs.map(pair => {
        // 		if (Array.isArray(pair)) {
        // 			return { open: pair[0], close: pair[1] };
        // 		}
        // 		return <IAutoClosingPairConditional>pair;
        // 	});
        // }
        _handleConfig(languageIdentifier, configuration) {
            let richEditConfig = {};
            const comments = this._extractValidCommentRule(languageIdentifier, configuration);
            if (comments) {
                richEditConfig.comments = comments;
            }
            const brackets = this._extractValidBrackets(languageIdentifier, configuration);
            if (brackets) {
                richEditConfig.brackets = brackets;
            }
            const autoClosingPairs = this._extractValidAutoClosingPairs(languageIdentifier, configuration);
            if (autoClosingPairs) {
                richEditConfig.autoClosingPairs = autoClosingPairs;
            }
            const surroundingPairs = this._extractValidSurroundingPairs(languageIdentifier, configuration);
            if (surroundingPairs) {
                richEditConfig.surroundingPairs = surroundingPairs;
            }
            const autoCloseBefore = configuration.autoCloseBefore;
            if (typeof autoCloseBefore === 'string') {
                richEditConfig.autoCloseBefore = autoCloseBefore;
            }
            if (configuration.wordPattern) {
                try {
                    let wordPattern = this._parseRegex(configuration.wordPattern);
                    if (wordPattern) {
                        richEditConfig.wordPattern = wordPattern;
                    }
                }
                catch (error) {
                    // Malformed regexes are ignored
                }
            }
            if (configuration.indentationRules) {
                let indentationRules = this._mapIndentationRules(configuration.indentationRules);
                if (indentationRules) {
                    richEditConfig.indentationRules = indentationRules;
                }
            }
            if (configuration.folding) {
                let markers = configuration.folding.markers;
                richEditConfig.folding = {
                    offSide: configuration.folding.offSide,
                    markers: markers ? { start: new RegExp(markers.start), end: new RegExp(markers.end) } : undefined
                };
            }
            languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, richEditConfig);
        }
        _parseRegex(value) {
            if (typeof value === 'string') {
                return new RegExp(value, '');
            }
            else if (typeof value === 'object') {
                return new RegExp(value.pattern, value.flags);
            }
            return null;
        }
        _mapIndentationRules(indentationRules) {
            try {
                let increaseIndentPattern = this._parseRegex(indentationRules.increaseIndentPattern);
                let decreaseIndentPattern = this._parseRegex(indentationRules.decreaseIndentPattern);
                if (increaseIndentPattern && decreaseIndentPattern) {
                    let result = {
                        increaseIndentPattern: increaseIndentPattern,
                        decreaseIndentPattern: decreaseIndentPattern
                    };
                    if (indentationRules.indentNextLinePattern) {
                        result.indentNextLinePattern = this._parseRegex(indentationRules.indentNextLinePattern);
                    }
                    if (indentationRules.unIndentedLinePattern) {
                        result.unIndentedLinePattern = this._parseRegex(indentationRules.unIndentedLinePattern);
                    }
                    return result;
                }
            }
            catch (error) {
                // Malformed regexes are ignored
            }
            return null;
        }
    };
    LanguageConfigurationFileHandler = __decorate([
        __param(0, textMateService_1.ITextMateService),
        __param(1, modeService_1.IModeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, extensions_1.IExtensionService)
    ], LanguageConfigurationFileHandler);
    exports.LanguageConfigurationFileHandler = LanguageConfigurationFileHandler;
    const schemaId = 'vscode://schemas/language-configuration';
    const schema = {
        allowComments: true,
        allowTrailingCommas: true,
        default: {
            comments: {
                blockComment: ['/*', '*/'],
                lineComment: '//'
            },
            brackets: [['(', ')'], ['[', ']'], ['{', '}']],
            autoClosingPairs: [['(', ')'], ['[', ']'], ['{', '}']],
            surroundingPairs: [['(', ')'], ['[', ']'], ['{', '}']]
        },
        definitions: {
            openBracket: {
                type: 'string',
                description: nls.localize('schema.openBracket', 'The opening bracket character or string sequence.')
            },
            closeBracket: {
                type: 'string',
                description: nls.localize('schema.closeBracket', 'The closing bracket character or string sequence.')
            },
            bracketPair: {
                type: 'array',
                items: [{
                        $ref: '#definitions/openBracket'
                    }, {
                        $ref: '#definitions/closeBracket'
                    }]
            }
        },
        properties: {
            comments: {
                default: {
                    blockComment: ['/*', '*/'],
                    lineComment: '//'
                },
                description: nls.localize('schema.comments', 'Defines the comment symbols'),
                type: 'object',
                properties: {
                    blockComment: {
                        type: 'array',
                        description: nls.localize('schema.blockComments', 'Defines how block comments are marked.'),
                        items: [{
                                type: 'string',
                                description: nls.localize('schema.blockComment.begin', 'The character sequence that starts a block comment.')
                            }, {
                                type: 'string',
                                description: nls.localize('schema.blockComment.end', 'The character sequence that ends a block comment.')
                            }]
                    },
                    lineComment: {
                        type: 'string',
                        description: nls.localize('schema.lineComment', 'The character sequence that starts a line comment.')
                    }
                }
            },
            brackets: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                description: nls.localize('schema.brackets', 'Defines the bracket symbols that increase or decrease the indentation.'),
                type: 'array',
                items: {
                    $ref: '#definitions/bracketPair'
                }
            },
            autoClosingPairs: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                description: nls.localize('schema.autoClosingPairs', 'Defines the bracket pairs. When a opening bracket is entered, the closing bracket is inserted automatically.'),
                type: 'array',
                items: {
                    oneOf: [{
                            $ref: '#definitions/bracketPair'
                        }, {
                            type: 'object',
                            properties: {
                                open: {
                                    $ref: '#definitions/openBracket'
                                },
                                close: {
                                    $ref: '#definitions/closeBracket'
                                },
                                notIn: {
                                    type: 'array',
                                    description: nls.localize('schema.autoClosingPairs.notIn', 'Defines a list of scopes where the auto pairs are disabled.'),
                                    items: {
                                        enum: ['string', 'comment']
                                    }
                                }
                            }
                        }]
                }
            },
            autoCloseBefore: {
                default: ';:.,=}])> \n\t',
                description: nls.localize('schema.autoCloseBefore', 'Defines what characters must be after the cursor in order for bracket or quote autoclosing to occur when using the \'languageDefined\' autoclosing setting. This is typically the set of characters which can not start an expression.'),
                type: 'string',
            },
            surroundingPairs: {
                default: [['(', ')'], ['[', ']'], ['{', '}']],
                description: nls.localize('schema.surroundingPairs', 'Defines the bracket pairs that can be used to surround a selected string.'),
                type: 'array',
                items: {
                    oneOf: [{
                            $ref: '#definitions/bracketPair'
                        }, {
                            type: 'object',
                            properties: {
                                open: {
                                    $ref: '#definitions/openBracket'
                                },
                                close: {
                                    $ref: '#definitions/closeBracket'
                                }
                            }
                        }]
                }
            },
            wordPattern: {
                default: '',
                description: nls.localize('schema.wordPattern', 'Defines what is considered to be a word in the programming language.'),
                type: ['string', 'object'],
                properties: {
                    pattern: {
                        type: 'string',
                        description: nls.localize('schema.wordPattern.pattern', 'The RegExp pattern used to match words.'),
                        default: '',
                    },
                    flags: {
                        type: 'string',
                        description: nls.localize('schema.wordPattern.flags', 'The RegExp flags used to match words.'),
                        default: 'g',
                        pattern: '^([gimuy]+)$',
                        patternErrorMessage: nls.localize('schema.wordPattern.flags.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                    }
                }
            },
            indentationRules: {
                default: {
                    increaseIndentPattern: '',
                    decreaseIndentPattern: ''
                },
                description: nls.localize('schema.indentationRules', 'The language\'s indentation settings.'),
                type: 'object',
                properties: {
                    increaseIndentPattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.increaseIndentPattern', 'If a line matches this pattern, then all the lines after it should be indented once (until another rule matches).'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.increaseIndentPattern.pattern', 'The RegExp pattern for increaseIndentPattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.increaseIndentPattern.flags', 'The RegExp flags for increaseIndentPattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.increaseIndentPattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    },
                    decreaseIndentPattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.decreaseIndentPattern', 'If a line matches this pattern, then all the lines after it should be unindented once (until another rule matches).'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.decreaseIndentPattern.pattern', 'The RegExp pattern for decreaseIndentPattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.decreaseIndentPattern.flags', 'The RegExp flags for decreaseIndentPattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.decreaseIndentPattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    },
                    indentNextLinePattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.indentNextLinePattern', 'If a line matches this pattern, then **only the next line** after it should be indented once.'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.indentNextLinePattern.pattern', 'The RegExp pattern for indentNextLinePattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.indentNextLinePattern.flags', 'The RegExp flags for indentNextLinePattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.indentNextLinePattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    },
                    unIndentedLinePattern: {
                        type: ['string', 'object'],
                        description: nls.localize('schema.indentationRules.unIndentedLinePattern', 'If a line matches this pattern, then its indentation should not be changed and it should not be evaluated against the other rules.'),
                        properties: {
                            pattern: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.unIndentedLinePattern.pattern', 'The RegExp pattern for unIndentedLinePattern.'),
                                default: '',
                            },
                            flags: {
                                type: 'string',
                                description: nls.localize('schema.indentationRules.unIndentedLinePattern.flags', 'The RegExp flags for unIndentedLinePattern.'),
                                default: '',
                                pattern: '^([gimuy]+)$',
                                patternErrorMessage: nls.localize('schema.indentationRules.unIndentedLinePattern.errorMessage', 'Must match the pattern `/^([gimuy]+)$/`.')
                            }
                        }
                    }
                }
            },
            folding: {
                type: 'object',
                description: nls.localize('schema.folding', 'The language\'s folding settings.'),
                properties: {
                    offSide: {
                        type: 'boolean',
                        description: nls.localize('schema.folding.offSide', 'A language adheres to the off-side rule if blocks in that language are expressed by their indentation. If set, empty lines belong to the subsequent block.'),
                    },
                    markers: {
                        type: 'object',
                        description: nls.localize('schema.folding.markers', 'Language specific folding markers such as \'#region\' and \'#endregion\'. The start and end regexes will be tested against the contents of all lines and must be designed efficiently'),
                        properties: {
                            start: {
                                type: 'string',
                                description: nls.localize('schema.folding.markers.start', 'The RegExp pattern for the start marker. The regexp must start with \'^\'.')
                            },
                            end: {
                                type: 'string',
                                description: nls.localize('schema.folding.markers.end', 'The RegExp pattern for the end marker. The regexp must start with \'^\'.')
                            },
                        }
                    }
                }
            }
        }
    };
    let schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(schemaId, schema);
});
//# __sourceMappingURL=languageConfigurationExtensionPoint.js.map