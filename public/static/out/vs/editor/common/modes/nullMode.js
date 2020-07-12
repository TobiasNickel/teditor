/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/token", "vs/editor/common/modes"], function (require, exports, token_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullTokenize2 = exports.nullTokenize = exports.NULL_LANGUAGE_IDENTIFIER = exports.NULL_MODE_ID = exports.NULL_STATE = void 0;
    class NullStateImpl {
        clone() {
            return this;
        }
        equals(other) {
            return (this === other);
        }
    }
    exports.NULL_STATE = new NullStateImpl();
    exports.NULL_MODE_ID = 'vs.editor.nullMode';
    exports.NULL_LANGUAGE_IDENTIFIER = new modes_1.LanguageIdentifier(exports.NULL_MODE_ID, 0 /* Null */);
    function nullTokenize(modeId, buffer, state, deltaOffset) {
        return new token_1.TokenizationResult([new token_1.Token(deltaOffset, '', modeId)], state);
    }
    exports.nullTokenize = nullTokenize;
    function nullTokenize2(languageId, buffer, state, deltaOffset) {
        let tokens = new Uint32Array(2);
        tokens[0] = deltaOffset;
        tokens[1] = ((languageId << 0 /* LANGUAGEID_OFFSET */)
            | (0 /* Other */ << 8 /* TOKEN_TYPE_OFFSET */)
            | (0 /* None */ << 11 /* FONT_STYLE_OFFSET */)
            | (1 /* DefaultForeground */ << 14 /* FOREGROUND_OFFSET */)
            | (2 /* DefaultBackground */ << 23 /* BACKGROUND_OFFSET */)) >>> 0;
        return new token_1.TokenizationResult2(tokens, state === null ? exports.NULL_STATE : state);
    }
    exports.nullTokenize2 = nullTokenize2;
});
//# __sourceMappingURL=nullMode.js.map