/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/modes/languageConfiguration"], function (require, exports, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterPairSupport = void 0;
    class CharacterPairSupport {
        constructor(config) {
            if (config.autoClosingPairs) {
                this._autoClosingPairs = config.autoClosingPairs.map(el => new languageConfiguration_1.StandardAutoClosingPairConditional(el));
            }
            else if (config.brackets) {
                this._autoClosingPairs = config.brackets.map(b => new languageConfiguration_1.StandardAutoClosingPairConditional({ open: b[0], close: b[1] }));
            }
            else {
                this._autoClosingPairs = [];
            }
            if (config.__electricCharacterSupport && config.__electricCharacterSupport.docComment) {
                const docComment = config.__electricCharacterSupport.docComment;
                // IDocComment is legacy, only partially supported
                this._autoClosingPairs.push(new languageConfiguration_1.StandardAutoClosingPairConditional({ open: docComment.open, close: docComment.close || '' }));
            }
            this._autoCloseBefore = typeof config.autoCloseBefore === 'string' ? config.autoCloseBefore : CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED;
            this._surroundingPairs = config.surroundingPairs || this._autoClosingPairs;
        }
        getAutoClosingPairs() {
            return this._autoClosingPairs;
        }
        getAutoCloseBeforeSet() {
            return this._autoCloseBefore;
        }
        static shouldAutoClosePair(autoClosingPair, context, column) {
            // Always complete on empty line
            if (context.getTokenCount() === 0) {
                return true;
            }
            const tokenIndex = context.findTokenIndexAtOffset(column - 2);
            const standardTokenType = context.getStandardTokenType(tokenIndex);
            return autoClosingPair.isOK(standardTokenType);
        }
        getSurroundingPairs() {
            return this._surroundingPairs;
        }
    }
    exports.CharacterPairSupport = CharacterPairSupport;
    CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED = ';:.,=}])> \n\t';
    CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_WHITESPACE = ' \n\t';
});
//# __sourceMappingURL=characterPair.js.map