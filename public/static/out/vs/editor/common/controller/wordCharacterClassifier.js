/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/characterClassifier"], function (require, exports, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMapForWordSeparators = exports.WordCharacterClassifier = exports.WordCharacterClass = void 0;
    var WordCharacterClass;
    (function (WordCharacterClass) {
        WordCharacterClass[WordCharacterClass["Regular"] = 0] = "Regular";
        WordCharacterClass[WordCharacterClass["Whitespace"] = 1] = "Whitespace";
        WordCharacterClass[WordCharacterClass["WordSeparator"] = 2] = "WordSeparator";
    })(WordCharacterClass = exports.WordCharacterClass || (exports.WordCharacterClass = {}));
    class WordCharacterClassifier extends characterClassifier_1.CharacterClassifier {
        constructor(wordSeparators) {
            super(0 /* Regular */);
            for (let i = 0, len = wordSeparators.length; i < len; i++) {
                this.set(wordSeparators.charCodeAt(i), 2 /* WordSeparator */);
            }
            this.set(32 /* Space */, 1 /* Whitespace */);
            this.set(9 /* Tab */, 1 /* Whitespace */);
        }
    }
    exports.WordCharacterClassifier = WordCharacterClassifier;
    function once(computeFn) {
        let cache = {}; // TODO@Alex unbounded cache
        return (input) => {
            if (!cache.hasOwnProperty(input)) {
                cache[input] = computeFn(input);
            }
            return cache[input];
        };
    }
    exports.getMapForWordSeparators = once((input) => new WordCharacterClassifier(input));
});
//# __sourceMappingURL=wordCharacterClassifier.js.map