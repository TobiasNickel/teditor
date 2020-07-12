/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCharIndex = exports.allCharCodes = exports.Constants = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["START_CH_CODE"] = 32] = "START_CH_CODE";
        Constants[Constants["END_CH_CODE"] = 126] = "END_CH_CODE";
        Constants[Constants["UNKNOWN_CODE"] = 65533] = "UNKNOWN_CODE";
        Constants[Constants["CHAR_COUNT"] = 96] = "CHAR_COUNT";
        Constants[Constants["SAMPLED_CHAR_HEIGHT"] = 16] = "SAMPLED_CHAR_HEIGHT";
        Constants[Constants["SAMPLED_CHAR_WIDTH"] = 10] = "SAMPLED_CHAR_WIDTH";
        Constants[Constants["BASE_CHAR_HEIGHT"] = 2] = "BASE_CHAR_HEIGHT";
        Constants[Constants["BASE_CHAR_WIDTH"] = 1] = "BASE_CHAR_WIDTH";
        Constants[Constants["RGBA_CHANNELS_CNT"] = 4] = "RGBA_CHANNELS_CNT";
        Constants[Constants["RGBA_SAMPLED_ROW_WIDTH"] = 3840] = "RGBA_SAMPLED_ROW_WIDTH";
    })(Constants = exports.Constants || (exports.Constants = {}));
    exports.allCharCodes = (() => {
        const v = [];
        for (let i = 32 /* START_CH_CODE */; i <= 126 /* END_CH_CODE */; i++) {
            v.push(i);
        }
        v.push(65533 /* UNKNOWN_CODE */);
        return v;
    })();
    exports.getCharIndex = (chCode, fontScale) => {
        chCode -= 32 /* START_CH_CODE */;
        if (chCode < 0 || chCode > 96 /* CHAR_COUNT */) {
            if (fontScale <= 2) {
                // for smaller scales, we can get away with using any ASCII character...
                return (chCode + 96 /* CHAR_COUNT */) % 96 /* CHAR_COUNT */;
            }
            return 96 /* CHAR_COUNT */ - 1; // unknown symbol
        }
        return chCode;
    };
});
//# __sourceMappingURL=minimapCharSheet.js.map