/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toUint32 = exports.toUint8 = exports.Constants = void 0;
    var Constants;
    (function (Constants) {
        /**
         * MAX SMI (SMall Integer) as defined in v8.
         * one bit is lost for boxing/unboxing flag.
         * one bit is lost for sign flag.
         * See https://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/#tagged-values
         */
        Constants[Constants["MAX_SAFE_SMALL_INTEGER"] = 1073741824] = "MAX_SAFE_SMALL_INTEGER";
        /**
         * MIN SMI (SMall Integer) as defined in v8.
         * one bit is lost for boxing/unboxing flag.
         * one bit is lost for sign flag.
         * See https://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/#tagged-values
         */
        Constants[Constants["MIN_SAFE_SMALL_INTEGER"] = -1073741824] = "MIN_SAFE_SMALL_INTEGER";
        /**
         * Max unsigned integer that fits on 8 bits.
         */
        Constants[Constants["MAX_UINT_8"] = 255] = "MAX_UINT_8";
        /**
         * Max unsigned integer that fits on 16 bits.
         */
        Constants[Constants["MAX_UINT_16"] = 65535] = "MAX_UINT_16";
        /**
         * Max unsigned integer that fits on 32 bits.
         */
        Constants[Constants["MAX_UINT_32"] = 4294967295] = "MAX_UINT_32";
        Constants[Constants["UNICODE_SUPPLEMENTARY_PLANE_BEGIN"] = 65536] = "UNICODE_SUPPLEMENTARY_PLANE_BEGIN";
    })(Constants = exports.Constants || (exports.Constants = {}));
    function toUint8(v) {
        if (v < 0) {
            return 0;
        }
        if (v > 255 /* MAX_UINT_8 */) {
            return 255 /* MAX_UINT_8 */;
        }
        return v | 0;
    }
    exports.toUint8 = toUint8;
    function toUint32(v) {
        if (v < 0) {
            return 0;
        }
        if (v > 4294967295 /* MAX_UINT_32 */) {
            return 4294967295 /* MAX_UINT_32 */;
        }
        return v | 0;
    }
    exports.toUint32 = toUint32;
});
//# __sourceMappingURL=uint.js.map