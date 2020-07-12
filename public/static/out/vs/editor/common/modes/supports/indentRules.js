/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentRulesSupport = exports.IndentConsts = void 0;
    var IndentConsts;
    (function (IndentConsts) {
        IndentConsts[IndentConsts["INCREASE_MASK"] = 1] = "INCREASE_MASK";
        IndentConsts[IndentConsts["DECREASE_MASK"] = 2] = "DECREASE_MASK";
        IndentConsts[IndentConsts["INDENT_NEXTLINE_MASK"] = 4] = "INDENT_NEXTLINE_MASK";
        IndentConsts[IndentConsts["UNINDENT_MASK"] = 8] = "UNINDENT_MASK";
    })(IndentConsts = exports.IndentConsts || (exports.IndentConsts = {}));
    class IndentRulesSupport {
        constructor(indentationRules) {
            this._indentationRules = indentationRules;
        }
        shouldIncrease(text) {
            if (this._indentationRules) {
                if (this._indentationRules.increaseIndentPattern && this._indentationRules.increaseIndentPattern.test(text)) {
                    return true;
                }
                // if (this._indentationRules.indentNextLinePattern && this._indentationRules.indentNextLinePattern.test(text)) {
                // 	return true;
                // }
            }
            return false;
        }
        shouldDecrease(text) {
            if (this._indentationRules && this._indentationRules.decreaseIndentPattern && this._indentationRules.decreaseIndentPattern.test(text)) {
                return true;
            }
            return false;
        }
        shouldIndentNextLine(text) {
            if (this._indentationRules && this._indentationRules.indentNextLinePattern && this._indentationRules.indentNextLinePattern.test(text)) {
                return true;
            }
            return false;
        }
        shouldIgnore(text) {
            // the text matches `unIndentedLinePattern`
            if (this._indentationRules && this._indentationRules.unIndentedLinePattern && this._indentationRules.unIndentedLinePattern.test(text)) {
                return true;
            }
            return false;
        }
        getIndentMetadata(text) {
            let ret = 0;
            if (this.shouldIncrease(text)) {
                ret += 1 /* INCREASE_MASK */;
            }
            if (this.shouldDecrease(text)) {
                ret += 2 /* DECREASE_MASK */;
            }
            if (this.shouldIndentNextLine(text)) {
                ret += 4 /* INDENT_NEXTLINE_MASK */;
            }
            if (this.shouldIgnore(text)) {
                ret += 8 /* UNINDENT_MASK */;
            }
            return ret;
        }
    }
    exports.IndentRulesSupport = IndentRulesSupport;
});
//# __sourceMappingURL=indentRules.js.map