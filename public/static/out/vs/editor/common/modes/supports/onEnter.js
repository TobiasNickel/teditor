/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/modes/languageConfiguration"], function (require, exports, errors_1, strings, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OnEnterSupport = void 0;
    class OnEnterSupport {
        constructor(opts) {
            opts = opts || {};
            opts.brackets = opts.brackets || [
                ['(', ')'],
                ['{', '}'],
                ['[', ']']
            ];
            this._brackets = [];
            opts.brackets.forEach((bracket) => {
                const openRegExp = OnEnterSupport._createOpenBracketRegExp(bracket[0]);
                const closeRegExp = OnEnterSupport._createCloseBracketRegExp(bracket[1]);
                if (openRegExp && closeRegExp) {
                    this._brackets.push({
                        open: bracket[0],
                        openRegExp: openRegExp,
                        close: bracket[1],
                        closeRegExp: closeRegExp,
                    });
                }
            });
            this._regExpRules = opts.onEnterRules || [];
        }
        onEnter(autoIndent, oneLineAboveText, beforeEnterText, afterEnterText) {
            // (1): `regExpRules`
            if (autoIndent >= 3 /* Advanced */) {
                for (let i = 0, len = this._regExpRules.length; i < len; i++) {
                    let rule = this._regExpRules[i];
                    const regResult = [{
                            reg: rule.beforeText,
                            text: beforeEnterText
                        }, {
                            reg: rule.afterText,
                            text: afterEnterText
                        }, {
                            reg: rule.oneLineAboveText,
                            text: oneLineAboveText
                        }].every((obj) => {
                        return obj.reg ? obj.reg.test(obj.text) : true;
                    });
                    if (regResult) {
                        return rule.action;
                    }
                }
            }
            // (2): Special indent-outdent
            if (autoIndent >= 2 /* Brackets */) {
                if (beforeEnterText.length > 0 && afterEnterText.length > 0) {
                    for (let i = 0, len = this._brackets.length; i < len; i++) {
                        let bracket = this._brackets[i];
                        if (bracket.openRegExp.test(beforeEnterText) && bracket.closeRegExp.test(afterEnterText)) {
                            return { indentAction: languageConfiguration_1.IndentAction.IndentOutdent };
                        }
                    }
                }
            }
            // (4): Open bracket based logic
            if (autoIndent >= 2 /* Brackets */) {
                if (beforeEnterText.length > 0) {
                    for (let i = 0, len = this._brackets.length; i < len; i++) {
                        let bracket = this._brackets[i];
                        if (bracket.openRegExp.test(beforeEnterText)) {
                            return { indentAction: languageConfiguration_1.IndentAction.Indent };
                        }
                    }
                }
            }
            return null;
        }
        static _createOpenBracketRegExp(bracket) {
            let str = strings.escapeRegExpCharacters(bracket);
            if (!/\B/.test(str.charAt(0))) {
                str = '\\b' + str;
            }
            str += '\\s*$';
            return OnEnterSupport._safeRegExp(str);
        }
        static _createCloseBracketRegExp(bracket) {
            let str = strings.escapeRegExpCharacters(bracket);
            if (!/\B/.test(str.charAt(str.length - 1))) {
                str = str + '\\b';
            }
            str = '^\\s*' + str;
            return OnEnterSupport._safeRegExp(str);
        }
        static _safeRegExp(def) {
            try {
                return new RegExp(def);
            }
            catch (err) {
                errors_1.onUnexpectedError(err);
                return null;
            }
        }
    }
    exports.OnEnterSupport = OnEnterSupport;
});
//# __sourceMappingURL=onEnter.js.map