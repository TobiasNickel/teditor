/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/search"], function (require, exports, strings, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplacePattern = void 0;
    class ReplacePattern {
        constructor(replaceString, arg2, arg3) {
            this._hasParameters = false;
            this._replacePattern = replaceString;
            let searchPatternInfo;
            let parseParameters;
            if (typeof arg2 === 'boolean') {
                parseParameters = arg2;
                this._regExp = arg3;
            }
            else {
                searchPatternInfo = arg2;
                parseParameters = !!searchPatternInfo.isRegExp;
                this._regExp = strings.createRegExp(searchPatternInfo.pattern, !!searchPatternInfo.isRegExp, { matchCase: searchPatternInfo.isCaseSensitive, wholeWord: searchPatternInfo.isWordMatch, multiline: searchPatternInfo.isMultiline, global: false, unicode: true });
            }
            if (parseParameters) {
                this.parseReplaceString(replaceString);
            }
            if (this._regExp.global) {
                this._regExp = strings.createRegExp(this._regExp.source, true, { matchCase: !this._regExp.ignoreCase, wholeWord: false, multiline: this._regExp.multiline, global: false });
            }
        }
        get hasParameters() {
            return this._hasParameters;
        }
        get pattern() {
            return this._replacePattern;
        }
        get regExp() {
            return this._regExp;
        }
        /**
        * Returns the replace string for the first match in the given text.
        * If text has no matches then returns null.
        */
        getReplaceString(text, preserveCase) {
            this._regExp.lastIndex = 0;
            let match = this._regExp.exec(text);
            if (match) {
                if (this.hasParameters) {
                    if (match[0] === text) {
                        return text.replace(this._regExp, this.buildReplaceString(match, preserveCase));
                    }
                    let replaceString = text.replace(this._regExp, this.buildReplaceString(match, preserveCase));
                    return replaceString.substr(match.index, match[0].length - (text.length - replaceString.length));
                }
                return this.buildReplaceString(match, preserveCase);
            }
            return null;
        }
        buildReplaceString(matches, preserveCase) {
            if (preserveCase) {
                return search_1.buildReplaceStringWithCasePreserved(matches, this._replacePattern);
            }
            else {
                return this._replacePattern;
            }
        }
        /**
         * \n => LF
         * \t => TAB
         * \\ => \
         * $0 => $& (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter)
         * everything else stays untouched
         */
        parseReplaceString(replaceString) {
            if (!replaceString || replaceString.length === 0) {
                return;
            }
            let substrFrom = 0, result = '';
            for (let i = 0, len = replaceString.length; i < len; i++) {
                let chCode = replaceString.charCodeAt(i);
                if (chCode === 92 /* Backslash */) {
                    // move to next char
                    i++;
                    if (i >= len) {
                        // string ends with a \
                        break;
                    }
                    let nextChCode = replaceString.charCodeAt(i);
                    let replaceWithCharacter = null;
                    switch (nextChCode) {
                        case 92 /* Backslash */:
                            // \\ => \
                            replaceWithCharacter = '\\';
                            break;
                        case 110 /* n */:
                            // \n => LF
                            replaceWithCharacter = '\n';
                            break;
                        case 116 /* t */:
                            // \t => TAB
                            replaceWithCharacter = '\t';
                            break;
                    }
                    if (replaceWithCharacter) {
                        result += replaceString.substring(substrFrom, i - 1) + replaceWithCharacter;
                        substrFrom = i + 1;
                    }
                }
                if (chCode === 36 /* DollarSign */) {
                    // move to next char
                    i++;
                    if (i >= len) {
                        // string ends with a $
                        break;
                    }
                    let nextChCode = replaceString.charCodeAt(i);
                    let replaceWithCharacter = null;
                    switch (nextChCode) {
                        case 48 /* Digit0 */:
                            // $0 => $&
                            replaceWithCharacter = '$&';
                            this._hasParameters = true;
                            break;
                        case 96 /* BackTick */:
                        case 39 /* SingleQuote */:
                            this._hasParameters = true;
                            break;
                        default:
                            // check if it is a valid string parameter $n (0 <= n <= 99). $0 is already handled by now.
                            if (!this.between(nextChCode, 49 /* Digit1 */, 57 /* Digit9 */)) {
                                break;
                            }
                            if (i === replaceString.length - 1) {
                                this._hasParameters = true;
                                break;
                            }
                            let charCode = replaceString.charCodeAt(++i);
                            if (!this.between(charCode, 48 /* Digit0 */, 57 /* Digit9 */)) {
                                this._hasParameters = true;
                                --i;
                                break;
                            }
                            if (i === replaceString.length - 1) {
                                this._hasParameters = true;
                                break;
                            }
                            charCode = replaceString.charCodeAt(++i);
                            if (!this.between(charCode, 48 /* Digit0 */, 57 /* Digit9 */)) {
                                this._hasParameters = true;
                                --i;
                                break;
                            }
                            break;
                    }
                    if (replaceWithCharacter) {
                        result += replaceString.substring(substrFrom, i - 1) + replaceWithCharacter;
                        substrFrom = i + 1;
                    }
                }
            }
            if (substrFrom === 0) {
                // no replacement occurred
                return;
            }
            this._replacePattern = result + replaceString.substring(substrFrom);
        }
        between(value, from, to) {
            return from <= value && value <= to;
        }
    }
    exports.ReplacePattern = ReplacePattern;
});
//# __sourceMappingURL=replace.js.map