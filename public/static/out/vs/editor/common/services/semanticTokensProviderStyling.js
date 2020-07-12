/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes", "vs/platform/log/common/log", "vs/editor/common/model/tokensStore"], function (require, exports, modes_1, log_1, tokensStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toMultilineTokens2 = exports.SemanticTokensProviderStyling = exports.SemanticTokensProviderStylingConstants = void 0;
    var SemanticTokensProviderStylingConstants;
    (function (SemanticTokensProviderStylingConstants) {
        SemanticTokensProviderStylingConstants[SemanticTokensProviderStylingConstants["NO_STYLING"] = 2147483647] = "NO_STYLING";
    })(SemanticTokensProviderStylingConstants = exports.SemanticTokensProviderStylingConstants || (exports.SemanticTokensProviderStylingConstants = {}));
    class SemanticTokensProviderStyling {
        constructor(_legend, _themeService, _logService) {
            this._legend = _legend;
            this._themeService = _themeService;
            this._logService = _logService;
            this._hashTable = new HashTable();
        }
        getMetadata(tokenTypeIndex, tokenModifierSet, languageId) {
            const entry = this._hashTable.get(tokenTypeIndex, tokenModifierSet, languageId.id);
            let metadata;
            if (entry) {
                metadata = entry.metadata;
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`SemanticTokensProviderStyling [CACHED] ${tokenTypeIndex} / ${tokenModifierSet}: foreground ${modes_1.TokenMetadata.getForeground(metadata)}, fontStyle ${modes_1.TokenMetadata.getFontStyle(metadata).toString(2)}`);
                }
            }
            else {
                let tokenType = this._legend.tokenTypes[tokenTypeIndex];
                const tokenModifiers = [];
                if (tokenType) {
                    let modifierSet = tokenModifierSet;
                    for (let modifierIndex = 0; modifierSet > 0 && modifierIndex < this._legend.tokenModifiers.length; modifierIndex++) {
                        if (modifierSet & 1) {
                            tokenModifiers.push(this._legend.tokenModifiers[modifierIndex]);
                        }
                        modifierSet = modifierSet >> 1;
                    }
                    if (modifierSet > 0 && this._logService.getLevel() === log_1.LogLevel.Trace) {
                        this._logService.trace(`SemanticTokensProviderStyling: unknown token modifier index: ${tokenModifierSet.toString(2)} for legend: ${JSON.stringify(this._legend.tokenModifiers)}`);
                        tokenModifiers.push('not-in-legend');
                    }
                    const tokenStyle = this._themeService.getColorTheme().getTokenStyleMetadata(tokenType, tokenModifiers, languageId.language);
                    if (typeof tokenStyle === 'undefined') {
                        metadata = 2147483647 /* NO_STYLING */;
                    }
                    else {
                        metadata = 0;
                        if (typeof tokenStyle.italic !== 'undefined') {
                            const italicBit = (tokenStyle.italic ? 1 /* Italic */ : 0) << 11 /* FONT_STYLE_OFFSET */;
                            metadata |= italicBit | 1 /* SEMANTIC_USE_ITALIC */;
                        }
                        if (typeof tokenStyle.bold !== 'undefined') {
                            const boldBit = (tokenStyle.bold ? 2 /* Bold */ : 0) << 11 /* FONT_STYLE_OFFSET */;
                            metadata |= boldBit | 2 /* SEMANTIC_USE_BOLD */;
                        }
                        if (typeof tokenStyle.underline !== 'undefined') {
                            const underlineBit = (tokenStyle.underline ? 4 /* Underline */ : 0) << 11 /* FONT_STYLE_OFFSET */;
                            metadata |= underlineBit | 4 /* SEMANTIC_USE_UNDERLINE */;
                        }
                        if (tokenStyle.foreground) {
                            const foregroundBits = (tokenStyle.foreground) << 14 /* FOREGROUND_OFFSET */;
                            metadata |= foregroundBits | 8 /* SEMANTIC_USE_FOREGROUND */;
                        }
                        if (metadata === 0) {
                            // Nothing!
                            metadata = 2147483647 /* NO_STYLING */;
                        }
                    }
                }
                else {
                    if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                        this._logService.trace(`SemanticTokensProviderStyling: unknown token type index: ${tokenTypeIndex} for legend: ${JSON.stringify(this._legend.tokenTypes)}`);
                    }
                    metadata = 2147483647 /* NO_STYLING */;
                    tokenType = 'not-in-legend';
                }
                this._hashTable.add(tokenTypeIndex, tokenModifierSet, languageId.id, metadata);
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`SemanticTokensProviderStyling ${tokenTypeIndex} (${tokenType}) / ${tokenModifierSet} (${tokenModifiers.join(' ')}): foreground ${modes_1.TokenMetadata.getForeground(metadata)}, fontStyle ${modes_1.TokenMetadata.getFontStyle(metadata).toString(2)}`);
                }
            }
            return metadata;
        }
    }
    exports.SemanticTokensProviderStyling = SemanticTokensProviderStyling;
    var SemanticColoringConstants;
    (function (SemanticColoringConstants) {
        /**
         * Let's aim at having 8KB buffers if possible...
         * So that would be 8192 / (5 * 4) = 409.6 tokens per area
         */
        SemanticColoringConstants[SemanticColoringConstants["DesiredTokensPerArea"] = 400] = "DesiredTokensPerArea";
        /**
         * Try to keep the total number of areas under 1024 if possible,
         * simply compensate by having more tokens per area...
         */
        SemanticColoringConstants[SemanticColoringConstants["DesiredMaxAreas"] = 1024] = "DesiredMaxAreas";
    })(SemanticColoringConstants || (SemanticColoringConstants = {}));
    function toMultilineTokens2(tokens, styling, languageId) {
        const srcData = tokens.data;
        const tokenCount = (tokens.data.length / 5) | 0;
        const tokensPerArea = Math.max(Math.ceil(tokenCount / 1024 /* DesiredMaxAreas */), 400 /* DesiredTokensPerArea */);
        const result = [];
        let tokenIndex = 0;
        let lastLineNumber = 1;
        let lastStartCharacter = 0;
        while (tokenIndex < tokenCount) {
            const tokenStartIndex = tokenIndex;
            let tokenEndIndex = Math.min(tokenStartIndex + tokensPerArea, tokenCount);
            // Keep tokens on the same line in the same area...
            if (tokenEndIndex < tokenCount) {
                let smallTokenEndIndex = tokenEndIndex;
                while (smallTokenEndIndex - 1 > tokenStartIndex && srcData[5 * smallTokenEndIndex] === 0) {
                    smallTokenEndIndex--;
                }
                if (smallTokenEndIndex - 1 === tokenStartIndex) {
                    // there are so many tokens on this line that our area would be empty, we must now go right
                    let bigTokenEndIndex = tokenEndIndex;
                    while (bigTokenEndIndex + 1 < tokenCount && srcData[5 * bigTokenEndIndex] === 0) {
                        bigTokenEndIndex++;
                    }
                    tokenEndIndex = bigTokenEndIndex;
                }
                else {
                    tokenEndIndex = smallTokenEndIndex;
                }
            }
            let destData = new Uint32Array((tokenEndIndex - tokenStartIndex) * 4);
            let destOffset = 0;
            let areaLine = 0;
            while (tokenIndex < tokenEndIndex) {
                const srcOffset = 5 * tokenIndex;
                const deltaLine = srcData[srcOffset];
                const deltaCharacter = srcData[srcOffset + 1];
                const lineNumber = lastLineNumber + deltaLine;
                const startCharacter = (deltaLine === 0 ? lastStartCharacter + deltaCharacter : deltaCharacter);
                const length = srcData[srcOffset + 2];
                const tokenTypeIndex = srcData[srcOffset + 3];
                const tokenModifierSet = srcData[srcOffset + 4];
                const metadata = styling.getMetadata(tokenTypeIndex, tokenModifierSet, languageId);
                if (metadata !== 2147483647 /* NO_STYLING */) {
                    if (areaLine === 0) {
                        areaLine = lineNumber;
                    }
                    destData[destOffset] = lineNumber - areaLine;
                    destData[destOffset + 1] = startCharacter;
                    destData[destOffset + 2] = startCharacter + length;
                    destData[destOffset + 3] = metadata;
                    destOffset += 4;
                }
                lastLineNumber = lineNumber;
                lastStartCharacter = startCharacter;
                tokenIndex++;
            }
            if (destOffset !== destData.length) {
                destData = destData.subarray(0, destOffset);
            }
            const tokens = new tokensStore_1.MultilineTokens2(areaLine, new tokensStore_1.SparseEncodedTokens(destData));
            result.push(tokens);
        }
        return result;
    }
    exports.toMultilineTokens2 = toMultilineTokens2;
    class HashTableEntry {
        constructor(tokenTypeIndex, tokenModifierSet, languageId, metadata) {
            this.tokenTypeIndex = tokenTypeIndex;
            this.tokenModifierSet = tokenModifierSet;
            this.languageId = languageId;
            this.metadata = metadata;
            this.next = null;
        }
    }
    class HashTable {
        constructor() {
            this._elementsCount = 0;
            this._currentLengthIndex = 0;
            this._currentLength = HashTable._SIZES[this._currentLengthIndex];
            this._growCount = Math.round(this._currentLengthIndex + 1 < HashTable._SIZES.length ? 2 / 3 * this._currentLength : 0);
            this._elements = [];
            HashTable._nullOutEntries(this._elements, this._currentLength);
        }
        static _nullOutEntries(entries, length) {
            for (let i = 0; i < length; i++) {
                entries[i] = null;
            }
        }
        _hash2(n1, n2) {
            return (((n1 << 5) - n1) + n2) | 0; // n1 * 31 + n2, keep as int32
        }
        _hashFunc(tokenTypeIndex, tokenModifierSet, languageId) {
            return this._hash2(this._hash2(tokenTypeIndex, tokenModifierSet), languageId) % this._currentLength;
        }
        get(tokenTypeIndex, tokenModifierSet, languageId) {
            const hash = this._hashFunc(tokenTypeIndex, tokenModifierSet, languageId);
            let p = this._elements[hash];
            while (p) {
                if (p.tokenTypeIndex === tokenTypeIndex && p.tokenModifierSet === tokenModifierSet && p.languageId === languageId) {
                    return p;
                }
                p = p.next;
            }
            return null;
        }
        add(tokenTypeIndex, tokenModifierSet, languageId, metadata) {
            this._elementsCount++;
            if (this._growCount !== 0 && this._elementsCount >= this._growCount) {
                // expand!
                const oldElements = this._elements;
                this._currentLengthIndex++;
                this._currentLength = HashTable._SIZES[this._currentLengthIndex];
                this._growCount = Math.round(this._currentLengthIndex + 1 < HashTable._SIZES.length ? 2 / 3 * this._currentLength : 0);
                this._elements = [];
                HashTable._nullOutEntries(this._elements, this._currentLength);
                for (const first of oldElements) {
                    let p = first;
                    while (p) {
                        const oldNext = p.next;
                        p.next = null;
                        this._add(p);
                        p = oldNext;
                    }
                }
            }
            this._add(new HashTableEntry(tokenTypeIndex, tokenModifierSet, languageId, metadata));
        }
        _add(element) {
            const hash = this._hashFunc(element.tokenTypeIndex, element.tokenModifierSet, element.languageId);
            element.next = this._elements[hash];
            this._elements[hash] = element;
        }
    }
    HashTable._SIZES = [3, 7, 13, 31, 61, 127, 251, 509, 1021, 2039, 4093, 8191, 16381, 32749, 65521, 131071, 262139, 524287, 1048573, 2097143];
});
//# __sourceMappingURL=semanticTokensProviderStyling.js.map