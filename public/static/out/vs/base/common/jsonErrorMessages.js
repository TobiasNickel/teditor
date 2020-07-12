/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParseErrorMessage = void 0;
    function getParseErrorMessage(errorCode) {
        switch (errorCode) {
            case 1 /* InvalidSymbol */: return nls_1.localize('error.invalidSymbol', 'Invalid symbol');
            case 2 /* InvalidNumberFormat */: return nls_1.localize('error.invalidNumberFormat', 'Invalid number format');
            case 3 /* PropertyNameExpected */: return nls_1.localize('error.propertyNameExpected', 'Property name expected');
            case 4 /* ValueExpected */: return nls_1.localize('error.valueExpected', 'Value expected');
            case 5 /* ColonExpected */: return nls_1.localize('error.colonExpected', 'Colon expected');
            case 6 /* CommaExpected */: return nls_1.localize('error.commaExpected', 'Comma expected');
            case 7 /* CloseBraceExpected */: return nls_1.localize('error.closeBraceExpected', 'Closing brace expected');
            case 8 /* CloseBracketExpected */: return nls_1.localize('error.closeBracketExpected', 'Closing bracket expected');
            case 9 /* EndOfFileExpected */: return nls_1.localize('error.endOfFileExpected', 'End of file expected');
            default:
                return '';
        }
    }
    exports.getParseErrorMessage = getParseErrorMessage;
});
//# __sourceMappingURL=jsonErrorMessages.js.map