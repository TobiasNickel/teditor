/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/checkbox/checkbox", "vs/nls", "vs/base/common/codicons"], function (require, exports, checkbox_1, nls, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RegexCheckbox = exports.WholeWordsCheckbox = exports.CaseSensitiveCheckbox = void 0;
    const NLS_CASE_SENSITIVE_CHECKBOX_LABEL = nls.localize('caseDescription', "Match Case");
    const NLS_WHOLE_WORD_CHECKBOX_LABEL = nls.localize('wordsDescription', "Match Whole Word");
    const NLS_REGEX_CHECKBOX_LABEL = nls.localize('regexDescription', "Use Regular Expression");
    class CaseSensitiveCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.caseSensitive,
                title: NLS_CASE_SENSITIVE_CHECKBOX_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.CaseSensitiveCheckbox = CaseSensitiveCheckbox;
    class WholeWordsCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.wholeWord,
                title: NLS_WHOLE_WORD_CHECKBOX_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.WholeWordsCheckbox = WholeWordsCheckbox;
    class RegexCheckbox extends checkbox_1.Checkbox {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.regex,
                title: NLS_REGEX_CHECKBOX_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.RegexCheckbox = RegexCheckbox;
});
//# __sourceMappingURL=findInputCheckboxes.js.map