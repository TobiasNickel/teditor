/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/modes/languageFeatureRegistry", "vs/editor/common/modes/tokenizationRegistry", "vs/base/common/codicons"], function (require, exports, types_1, uri_1, range_1, languageFeatureRegistry_1, tokenizationRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationRegistry = exports.DocumentRangeSemanticTokensProviderRegistry = exports.DocumentSemanticTokensProviderRegistry = exports.FoldingRangeProviderRegistry = exports.SelectionRangeRegistry = exports.ColorProviderRegistry = exports.LinkProviderRegistry = exports.OnTypeFormattingEditProviderRegistry = exports.DocumentRangeFormattingEditProviderRegistry = exports.DocumentFormattingEditProviderRegistry = exports.CodeActionProviderRegistry = exports.CodeLensProviderRegistry = exports.TypeDefinitionProviderRegistry = exports.ImplementationProviderRegistry = exports.DeclarationProviderRegistry = exports.DefinitionProviderRegistry = exports.OnTypeRenameProviderRegistry = exports.DocumentHighlightProviderRegistry = exports.DocumentSymbolProviderRegistry = exports.EvaluatableExpressionProviderRegistry = exports.HoverProviderRegistry = exports.SignatureHelpProviderRegistry = exports.CompletionProviderRegistry = exports.RenameProviderRegistry = exports.ReferenceProviderRegistry = exports.CommentMode = exports.CommentThreadCollapsibleState = exports.WorkspaceTextEdit = exports.WorkspaceFileEdit = exports.FoldingRangeKind = exports.SymbolKinds = exports.SymbolTag = exports.SymbolKind = exports.isLocationLink = exports.DocumentHighlightKind = exports.SignatureHelpTriggerKind = exports.CodeActionTriggerType = exports.CompletionTriggerKind = exports.CompletionItemInsertTextRule = exports.CompletionItemTag = exports.completionKindFromString = exports.completionKindToCssClass = exports.CompletionItemKind = exports.TokenMetadata = exports.MetadataConsts = exports.StandardTokenType = exports.ColorId = exports.FontStyle = exports.LanguageIdentifier = exports.LanguageId = void 0;
    /**
     * Open ended enum at runtime
     * @internal
     */
    var LanguageId;
    (function (LanguageId) {
        LanguageId[LanguageId["Null"] = 0] = "Null";
        LanguageId[LanguageId["PlainText"] = 1] = "PlainText";
    })(LanguageId = exports.LanguageId || (exports.LanguageId = {}));
    /**
     * @internal
     */
    class LanguageIdentifier {
        constructor(language, id) {
            this.language = language;
            this.id = id;
        }
    }
    exports.LanguageIdentifier = LanguageIdentifier;
    /**
     * A font style. Values are 2^x such that a bit mask can be used.
     * @internal
     */
    var FontStyle;
    (function (FontStyle) {
        FontStyle[FontStyle["NotSet"] = -1] = "NotSet";
        FontStyle[FontStyle["None"] = 0] = "None";
        FontStyle[FontStyle["Italic"] = 1] = "Italic";
        FontStyle[FontStyle["Bold"] = 2] = "Bold";
        FontStyle[FontStyle["Underline"] = 4] = "Underline";
    })(FontStyle = exports.FontStyle || (exports.FontStyle = {}));
    /**
     * Open ended enum at runtime
     * @internal
     */
    var ColorId;
    (function (ColorId) {
        ColorId[ColorId["None"] = 0] = "None";
        ColorId[ColorId["DefaultForeground"] = 1] = "DefaultForeground";
        ColorId[ColorId["DefaultBackground"] = 2] = "DefaultBackground";
    })(ColorId = exports.ColorId || (exports.ColorId = {}));
    /**
     * A standard token type. Values are 2^x such that a bit mask can be used.
     * @internal
     */
    var StandardTokenType;
    (function (StandardTokenType) {
        StandardTokenType[StandardTokenType["Other"] = 0] = "Other";
        StandardTokenType[StandardTokenType["Comment"] = 1] = "Comment";
        StandardTokenType[StandardTokenType["String"] = 2] = "String";
        StandardTokenType[StandardTokenType["RegEx"] = 4] = "RegEx";
    })(StandardTokenType = exports.StandardTokenType || (exports.StandardTokenType = {}));
    /**
     * Helpers to manage the "collapsed" metadata of an entire StackElement stack.
     * The following assumptions have been made:
     *  - languageId < 256 => needs 8 bits
     *  - unique color count < 512 => needs 9 bits
     *
     * The binary format is:
     * - -------------------------------------------
     *     3322 2222 2222 1111 1111 1100 0000 0000
     *     1098 7654 3210 9876 5432 1098 7654 3210
     * - -------------------------------------------
     *     xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx
     *     bbbb bbbb bfff ffff ffFF FTTT LLLL LLLL
     * - -------------------------------------------
     *  - L = LanguageId (8 bits)
     *  - T = StandardTokenType (3 bits)
     *  - F = FontStyle (3 bits)
     *  - f = foreground color (9 bits)
     *  - b = background color (9 bits)
     *
     * @internal
     */
    var MetadataConsts;
    (function (MetadataConsts) {
        MetadataConsts[MetadataConsts["LANGUAGEID_MASK"] = 255] = "LANGUAGEID_MASK";
        MetadataConsts[MetadataConsts["TOKEN_TYPE_MASK"] = 1792] = "TOKEN_TYPE_MASK";
        MetadataConsts[MetadataConsts["FONT_STYLE_MASK"] = 14336] = "FONT_STYLE_MASK";
        MetadataConsts[MetadataConsts["FOREGROUND_MASK"] = 8372224] = "FOREGROUND_MASK";
        MetadataConsts[MetadataConsts["BACKGROUND_MASK"] = 4286578688] = "BACKGROUND_MASK";
        MetadataConsts[MetadataConsts["ITALIC_MASK"] = 2048] = "ITALIC_MASK";
        MetadataConsts[MetadataConsts["BOLD_MASK"] = 4096] = "BOLD_MASK";
        MetadataConsts[MetadataConsts["UNDERLINE_MASK"] = 8192] = "UNDERLINE_MASK";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_ITALIC"] = 1] = "SEMANTIC_USE_ITALIC";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_BOLD"] = 2] = "SEMANTIC_USE_BOLD";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_UNDERLINE"] = 4] = "SEMANTIC_USE_UNDERLINE";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_FOREGROUND"] = 8] = "SEMANTIC_USE_FOREGROUND";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_BACKGROUND"] = 16] = "SEMANTIC_USE_BACKGROUND";
        MetadataConsts[MetadataConsts["LANGUAGEID_OFFSET"] = 0] = "LANGUAGEID_OFFSET";
        MetadataConsts[MetadataConsts["TOKEN_TYPE_OFFSET"] = 8] = "TOKEN_TYPE_OFFSET";
        MetadataConsts[MetadataConsts["FONT_STYLE_OFFSET"] = 11] = "FONT_STYLE_OFFSET";
        MetadataConsts[MetadataConsts["FOREGROUND_OFFSET"] = 14] = "FOREGROUND_OFFSET";
        MetadataConsts[MetadataConsts["BACKGROUND_OFFSET"] = 23] = "BACKGROUND_OFFSET";
    })(MetadataConsts = exports.MetadataConsts || (exports.MetadataConsts = {}));
    /**
     * @internal
     */
    class TokenMetadata {
        static getLanguageId(metadata) {
            return (metadata & 255 /* LANGUAGEID_MASK */) >>> 0 /* LANGUAGEID_OFFSET */;
        }
        static getTokenType(metadata) {
            return (metadata & 1792 /* TOKEN_TYPE_MASK */) >>> 8 /* TOKEN_TYPE_OFFSET */;
        }
        static getFontStyle(metadata) {
            return (metadata & 14336 /* FONT_STYLE_MASK */) >>> 11 /* FONT_STYLE_OFFSET */;
        }
        static getForeground(metadata) {
            return (metadata & 8372224 /* FOREGROUND_MASK */) >>> 14 /* FOREGROUND_OFFSET */;
        }
        static getBackground(metadata) {
            return (metadata & 4286578688 /* BACKGROUND_MASK */) >>> 23 /* BACKGROUND_OFFSET */;
        }
        static getClassNameFromMetadata(metadata) {
            let foreground = this.getForeground(metadata);
            let className = 'mtk' + foreground;
            let fontStyle = this.getFontStyle(metadata);
            if (fontStyle & 1 /* Italic */) {
                className += ' mtki';
            }
            if (fontStyle & 2 /* Bold */) {
                className += ' mtkb';
            }
            if (fontStyle & 4 /* Underline */) {
                className += ' mtku';
            }
            return className;
        }
        static getInlineStyleFromMetadata(metadata, colorMap) {
            const foreground = this.getForeground(metadata);
            const fontStyle = this.getFontStyle(metadata);
            let result = `color: ${colorMap[foreground]};`;
            if (fontStyle & 1 /* Italic */) {
                result += 'font-style: italic;';
            }
            if (fontStyle & 2 /* Bold */) {
                result += 'font-weight: bold;';
            }
            if (fontStyle & 4 /* Underline */) {
                result += 'text-decoration: underline;';
            }
            return result;
        }
    }
    exports.TokenMetadata = TokenMetadata;
    var CompletionItemKind;
    (function (CompletionItemKind) {
        CompletionItemKind[CompletionItemKind["Method"] = 0] = "Method";
        CompletionItemKind[CompletionItemKind["Function"] = 1] = "Function";
        CompletionItemKind[CompletionItemKind["Constructor"] = 2] = "Constructor";
        CompletionItemKind[CompletionItemKind["Field"] = 3] = "Field";
        CompletionItemKind[CompletionItemKind["Variable"] = 4] = "Variable";
        CompletionItemKind[CompletionItemKind["Class"] = 5] = "Class";
        CompletionItemKind[CompletionItemKind["Struct"] = 6] = "Struct";
        CompletionItemKind[CompletionItemKind["Interface"] = 7] = "Interface";
        CompletionItemKind[CompletionItemKind["Module"] = 8] = "Module";
        CompletionItemKind[CompletionItemKind["Property"] = 9] = "Property";
        CompletionItemKind[CompletionItemKind["Event"] = 10] = "Event";
        CompletionItemKind[CompletionItemKind["Operator"] = 11] = "Operator";
        CompletionItemKind[CompletionItemKind["Unit"] = 12] = "Unit";
        CompletionItemKind[CompletionItemKind["Value"] = 13] = "Value";
        CompletionItemKind[CompletionItemKind["Constant"] = 14] = "Constant";
        CompletionItemKind[CompletionItemKind["Enum"] = 15] = "Enum";
        CompletionItemKind[CompletionItemKind["EnumMember"] = 16] = "EnumMember";
        CompletionItemKind[CompletionItemKind["Keyword"] = 17] = "Keyword";
        CompletionItemKind[CompletionItemKind["Text"] = 18] = "Text";
        CompletionItemKind[CompletionItemKind["Color"] = 19] = "Color";
        CompletionItemKind[CompletionItemKind["File"] = 20] = "File";
        CompletionItemKind[CompletionItemKind["Reference"] = 21] = "Reference";
        CompletionItemKind[CompletionItemKind["Customcolor"] = 22] = "Customcolor";
        CompletionItemKind[CompletionItemKind["Folder"] = 23] = "Folder";
        CompletionItemKind[CompletionItemKind["TypeParameter"] = 24] = "TypeParameter";
        CompletionItemKind[CompletionItemKind["User"] = 25] = "User";
        CompletionItemKind[CompletionItemKind["Issue"] = 26] = "Issue";
        CompletionItemKind[CompletionItemKind["Snippet"] = 27] = "Snippet";
    })(CompletionItemKind = exports.CompletionItemKind || (exports.CompletionItemKind = {}));
    /**
     * @internal
     */
    exports.completionKindToCssClass = (function () {
        let data = Object.create(null);
        data[0 /* Method */] = 'symbol-method';
        data[1 /* Function */] = 'symbol-function';
        data[2 /* Constructor */] = 'symbol-constructor';
        data[3 /* Field */] = 'symbol-field';
        data[4 /* Variable */] = 'symbol-variable';
        data[5 /* Class */] = 'symbol-class';
        data[6 /* Struct */] = 'symbol-struct';
        data[7 /* Interface */] = 'symbol-interface';
        data[8 /* Module */] = 'symbol-module';
        data[9 /* Property */] = 'symbol-property';
        data[10 /* Event */] = 'symbol-event';
        data[11 /* Operator */] = 'symbol-operator';
        data[12 /* Unit */] = 'symbol-unit';
        data[13 /* Value */] = 'symbol-value';
        data[14 /* Constant */] = 'symbol-constant';
        data[15 /* Enum */] = 'symbol-enum';
        data[16 /* EnumMember */] = 'symbol-enum-member';
        data[17 /* Keyword */] = 'symbol-keyword';
        data[27 /* Snippet */] = 'symbol-snippet';
        data[18 /* Text */] = 'symbol-text';
        data[19 /* Color */] = 'symbol-color';
        data[20 /* File */] = 'symbol-file';
        data[21 /* Reference */] = 'symbol-reference';
        data[22 /* Customcolor */] = 'symbol-customcolor';
        data[23 /* Folder */] = 'symbol-folder';
        data[24 /* TypeParameter */] = 'symbol-type-parameter';
        data[25 /* User */] = 'account';
        data[26 /* Issue */] = 'issues';
        return function (kind) {
            const name = data[kind];
            let codicon = name && codicons_1.iconRegistry.get(name);
            if (!codicon) {
                console.info('No codicon found for CompletionItemKind ' + kind);
                codicon = codicons_1.Codicon.symbolProperty;
            }
            return codicon.classNames;
        };
    })();
    /**
     * @internal
     */
    exports.completionKindFromString = (function () {
        let data = Object.create(null);
        data['method'] = 0 /* Method */;
        data['function'] = 1 /* Function */;
        data['constructor'] = 2 /* Constructor */;
        data['field'] = 3 /* Field */;
        data['variable'] = 4 /* Variable */;
        data['class'] = 5 /* Class */;
        data['struct'] = 6 /* Struct */;
        data['interface'] = 7 /* Interface */;
        data['module'] = 8 /* Module */;
        data['property'] = 9 /* Property */;
        data['event'] = 10 /* Event */;
        data['operator'] = 11 /* Operator */;
        data['unit'] = 12 /* Unit */;
        data['value'] = 13 /* Value */;
        data['constant'] = 14 /* Constant */;
        data['enum'] = 15 /* Enum */;
        data['enum-member'] = 16 /* EnumMember */;
        data['enumMember'] = 16 /* EnumMember */;
        data['keyword'] = 17 /* Keyword */;
        data['snippet'] = 27 /* Snippet */;
        data['text'] = 18 /* Text */;
        data['color'] = 19 /* Color */;
        data['file'] = 20 /* File */;
        data['reference'] = 21 /* Reference */;
        data['customcolor'] = 22 /* Customcolor */;
        data['folder'] = 23 /* Folder */;
        data['type-parameter'] = 24 /* TypeParameter */;
        data['typeParameter'] = 24 /* TypeParameter */;
        data['account'] = 25 /* User */;
        data['issue'] = 26 /* Issue */;
        return function (value, strict) {
            let res = data[value];
            if (typeof res === 'undefined' && !strict) {
                res = 9 /* Property */;
            }
            return res;
        };
    })();
    var CompletionItemTag;
    (function (CompletionItemTag) {
        CompletionItemTag[CompletionItemTag["Deprecated"] = 1] = "Deprecated";
    })(CompletionItemTag = exports.CompletionItemTag || (exports.CompletionItemTag = {}));
    var CompletionItemInsertTextRule;
    (function (CompletionItemInsertTextRule) {
        /**
         * Adjust whitespace/indentation of multiline insert texts to
         * match the current line indentation.
         */
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["KeepWhitespace"] = 1] = "KeepWhitespace";
        /**
         * `insertText` is a snippet.
         */
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["InsertAsSnippet"] = 4] = "InsertAsSnippet";
    })(CompletionItemInsertTextRule = exports.CompletionItemInsertTextRule || (exports.CompletionItemInsertTextRule = {}));
    /**
     * How a suggest provider was triggered.
     */
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        CompletionTriggerKind[CompletionTriggerKind["Invoke"] = 0] = "Invoke";
        CompletionTriggerKind[CompletionTriggerKind["TriggerCharacter"] = 1] = "TriggerCharacter";
        CompletionTriggerKind[CompletionTriggerKind["TriggerForIncompleteCompletions"] = 2] = "TriggerForIncompleteCompletions";
    })(CompletionTriggerKind = exports.CompletionTriggerKind || (exports.CompletionTriggerKind = {}));
    /**
     * @internal
     */
    var CodeActionTriggerType;
    (function (CodeActionTriggerType) {
        CodeActionTriggerType[CodeActionTriggerType["Auto"] = 1] = "Auto";
        CodeActionTriggerType[CodeActionTriggerType["Manual"] = 2] = "Manual";
    })(CodeActionTriggerType = exports.CodeActionTriggerType || (exports.CodeActionTriggerType = {}));
    var SignatureHelpTriggerKind;
    (function (SignatureHelpTriggerKind) {
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["Invoke"] = 1] = "Invoke";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["TriggerCharacter"] = 2] = "TriggerCharacter";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["ContentChange"] = 3] = "ContentChange";
    })(SignatureHelpTriggerKind = exports.SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = {}));
    /**
     * A document highlight kind.
     */
    var DocumentHighlightKind;
    (function (DocumentHighlightKind) {
        /**
         * A textual occurrence.
         */
        DocumentHighlightKind[DocumentHighlightKind["Text"] = 0] = "Text";
        /**
         * Read-access of a symbol, like reading a variable.
         */
        DocumentHighlightKind[DocumentHighlightKind["Read"] = 1] = "Read";
        /**
         * Write-access of a symbol, like writing to a variable.
         */
        DocumentHighlightKind[DocumentHighlightKind["Write"] = 2] = "Write";
    })(DocumentHighlightKind = exports.DocumentHighlightKind || (exports.DocumentHighlightKind = {}));
    /**
     * @internal
     */
    function isLocationLink(thing) {
        return thing
            && uri_1.URI.isUri(thing.uri)
            && range_1.Range.isIRange(thing.range)
            && (range_1.Range.isIRange(thing.originSelectionRange) || range_1.Range.isIRange(thing.targetSelectionRange));
    }
    exports.isLocationLink = isLocationLink;
    /**
     * A symbol kind.
     */
    var SymbolKind;
    (function (SymbolKind) {
        SymbolKind[SymbolKind["File"] = 0] = "File";
        SymbolKind[SymbolKind["Module"] = 1] = "Module";
        SymbolKind[SymbolKind["Namespace"] = 2] = "Namespace";
        SymbolKind[SymbolKind["Package"] = 3] = "Package";
        SymbolKind[SymbolKind["Class"] = 4] = "Class";
        SymbolKind[SymbolKind["Method"] = 5] = "Method";
        SymbolKind[SymbolKind["Property"] = 6] = "Property";
        SymbolKind[SymbolKind["Field"] = 7] = "Field";
        SymbolKind[SymbolKind["Constructor"] = 8] = "Constructor";
        SymbolKind[SymbolKind["Enum"] = 9] = "Enum";
        SymbolKind[SymbolKind["Interface"] = 10] = "Interface";
        SymbolKind[SymbolKind["Function"] = 11] = "Function";
        SymbolKind[SymbolKind["Variable"] = 12] = "Variable";
        SymbolKind[SymbolKind["Constant"] = 13] = "Constant";
        SymbolKind[SymbolKind["String"] = 14] = "String";
        SymbolKind[SymbolKind["Number"] = 15] = "Number";
        SymbolKind[SymbolKind["Boolean"] = 16] = "Boolean";
        SymbolKind[SymbolKind["Array"] = 17] = "Array";
        SymbolKind[SymbolKind["Object"] = 18] = "Object";
        SymbolKind[SymbolKind["Key"] = 19] = "Key";
        SymbolKind[SymbolKind["Null"] = 20] = "Null";
        SymbolKind[SymbolKind["EnumMember"] = 21] = "EnumMember";
        SymbolKind[SymbolKind["Struct"] = 22] = "Struct";
        SymbolKind[SymbolKind["Event"] = 23] = "Event";
        SymbolKind[SymbolKind["Operator"] = 24] = "Operator";
        SymbolKind[SymbolKind["TypeParameter"] = 25] = "TypeParameter";
    })(SymbolKind = exports.SymbolKind || (exports.SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        SymbolTag[SymbolTag["Deprecated"] = 1] = "Deprecated";
    })(SymbolTag = exports.SymbolTag || (exports.SymbolTag = {}));
    /**
     * @internal
     */
    var SymbolKinds;
    (function (SymbolKinds) {
        const byName = new Map();
        byName.set('file', 0 /* File */);
        byName.set('module', 1 /* Module */);
        byName.set('namespace', 2 /* Namespace */);
        byName.set('package', 3 /* Package */);
        byName.set('class', 4 /* Class */);
        byName.set('method', 5 /* Method */);
        byName.set('property', 6 /* Property */);
        byName.set('field', 7 /* Field */);
        byName.set('constructor', 8 /* Constructor */);
        byName.set('enum', 9 /* Enum */);
        byName.set('interface', 10 /* Interface */);
        byName.set('function', 11 /* Function */);
        byName.set('variable', 12 /* Variable */);
        byName.set('constant', 13 /* Constant */);
        byName.set('string', 14 /* String */);
        byName.set('number', 15 /* Number */);
        byName.set('boolean', 16 /* Boolean */);
        byName.set('array', 17 /* Array */);
        byName.set('object', 18 /* Object */);
        byName.set('key', 19 /* Key */);
        byName.set('null', 20 /* Null */);
        byName.set('enum-member', 21 /* EnumMember */);
        byName.set('struct', 22 /* Struct */);
        byName.set('event', 23 /* Event */);
        byName.set('operator', 24 /* Operator */);
        byName.set('type-parameter', 25 /* TypeParameter */);
        const byKind = new Map();
        byKind.set(0 /* File */, 'file');
        byKind.set(1 /* Module */, 'module');
        byKind.set(2 /* Namespace */, 'namespace');
        byKind.set(3 /* Package */, 'package');
        byKind.set(4 /* Class */, 'class');
        byKind.set(5 /* Method */, 'method');
        byKind.set(6 /* Property */, 'property');
        byKind.set(7 /* Field */, 'field');
        byKind.set(8 /* Constructor */, 'constructor');
        byKind.set(9 /* Enum */, 'enum');
        byKind.set(10 /* Interface */, 'interface');
        byKind.set(11 /* Function */, 'function');
        byKind.set(12 /* Variable */, 'variable');
        byKind.set(13 /* Constant */, 'constant');
        byKind.set(14 /* String */, 'string');
        byKind.set(15 /* Number */, 'number');
        byKind.set(16 /* Boolean */, 'boolean');
        byKind.set(17 /* Array */, 'array');
        byKind.set(18 /* Object */, 'object');
        byKind.set(19 /* Key */, 'key');
        byKind.set(20 /* Null */, 'null');
        byKind.set(21 /* EnumMember */, 'enum-member');
        byKind.set(22 /* Struct */, 'struct');
        byKind.set(23 /* Event */, 'event');
        byKind.set(24 /* Operator */, 'operator');
        byKind.set(25 /* TypeParameter */, 'type-parameter');
        /**
         * @internal
         */
        function fromString(value) {
            return byName.get(value);
        }
        SymbolKinds.fromString = fromString;
        /**
         * @internal
         */
        function toString(kind) {
            return byKind.get(kind);
        }
        SymbolKinds.toString = toString;
        /**
         * @internal
         */
        function toCssClassName(kind, inline) {
            const symbolName = byKind.get(kind);
            let codicon = symbolName && codicons_1.iconRegistry.get('symbol-' + symbolName);
            if (!codicon) {
                console.info('No codicon found for SymbolKind ' + kind);
                codicon = codicons_1.Codicon.symbolProperty;
            }
            return `${inline ? 'inline' : 'block'} ${codicon.classNames}`;
        }
        SymbolKinds.toCssClassName = toCssClassName;
    })(SymbolKinds = exports.SymbolKinds || (exports.SymbolKinds = {}));
    class FoldingRangeKind {
        /**
         * Creates a new [FoldingRangeKind](#FoldingRangeKind).
         *
         * @param value of the kind.
         */
        constructor(value) {
            this.value = value;
        }
    }
    exports.FoldingRangeKind = FoldingRangeKind;
    /**
     * Kind for folding range representing a comment. The value of the kind is 'comment'.
     */
    FoldingRangeKind.Comment = new FoldingRangeKind('comment');
    /**
     * Kind for folding range representing a import. The value of the kind is 'imports'.
     */
    FoldingRangeKind.Imports = new FoldingRangeKind('imports');
    /**
     * Kind for folding range representing regions (for example marked by `#region`, `#endregion`).
     * The value of the kind is 'region'.
     */
    FoldingRangeKind.Region = new FoldingRangeKind('region');
    /**
     * @internal
     */
    var WorkspaceFileEdit;
    (function (WorkspaceFileEdit) {
        /**
         * @internal
         */
        function is(thing) {
            return types_1.isObject(thing) && (Boolean(thing.newUri) || Boolean(thing.oldUri));
        }
        WorkspaceFileEdit.is = is;
    })(WorkspaceFileEdit = exports.WorkspaceFileEdit || (exports.WorkspaceFileEdit = {}));
    /**
     * @internal
     */
    var WorkspaceTextEdit;
    (function (WorkspaceTextEdit) {
        /**
         * @internal
         */
        function is(thing) {
            return types_1.isObject(thing) && uri_1.URI.isUri(thing.resource) && types_1.isObject(thing.edit);
        }
        WorkspaceTextEdit.is = is;
    })(WorkspaceTextEdit = exports.WorkspaceTextEdit || (exports.WorkspaceTextEdit = {}));
    /**
     * @internal
     */
    var CommentThreadCollapsibleState;
    (function (CommentThreadCollapsibleState) {
        /**
         * Determines an item is collapsed
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Collapsed"] = 0] = "Collapsed";
        /**
         * Determines an item is expanded
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Expanded"] = 1] = "Expanded";
    })(CommentThreadCollapsibleState = exports.CommentThreadCollapsibleState || (exports.CommentThreadCollapsibleState = {}));
    /**
     * @internal
     */
    var CommentMode;
    (function (CommentMode) {
        CommentMode[CommentMode["Editing"] = 0] = "Editing";
        CommentMode[CommentMode["Preview"] = 1] = "Preview";
    })(CommentMode = exports.CommentMode || (exports.CommentMode = {}));
    // --- feature registries ------
    /**
     * @internal
     */
    exports.ReferenceProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.RenameProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.CompletionProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.SignatureHelpProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.HoverProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.EvaluatableExpressionProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DocumentSymbolProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DocumentHighlightProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.OnTypeRenameProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DefinitionProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DeclarationProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.ImplementationProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.TypeDefinitionProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.CodeLensProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.CodeActionProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DocumentFormattingEditProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DocumentRangeFormattingEditProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.OnTypeFormattingEditProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.LinkProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.ColorProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.SelectionRangeRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.FoldingRangeProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DocumentSemanticTokensProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.DocumentRangeSemanticTokensProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    /**
     * @internal
     */
    exports.TokenizationRegistry = new tokenizationRegistry_1.TokenizationRegistryImpl();
});
//# __sourceMappingURL=modes.js.map