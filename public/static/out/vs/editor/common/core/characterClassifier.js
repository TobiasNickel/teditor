/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uint"], function (require, exports, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterSet = exports.CharacterClassifier = void 0;
    /**
     * A fast character classifier that uses a compact array for ASCII values.
     */
    class CharacterClassifier {
        constructor(_defaultValue) {
            let defaultValue = uint_1.toUint8(_defaultValue);
            this._defaultValue = defaultValue;
            this._asciiMap = CharacterClassifier._createAsciiMap(defaultValue);
            this._map = new Map();
        }
        static _createAsciiMap(defaultValue) {
            let asciiMap = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                asciiMap[i] = defaultValue;
            }
            return asciiMap;
        }
        set(charCode, _value) {
            let value = uint_1.toUint8(_value);
            if (charCode >= 0 && charCode < 256) {
                this._asciiMap[charCode] = value;
            }
            else {
                this._map.set(charCode, value);
            }
        }
        get(charCode) {
            if (charCode >= 0 && charCode < 256) {
                return this._asciiMap[charCode];
            }
            else {
                return (this._map.get(charCode) || this._defaultValue);
            }
        }
    }
    exports.CharacterClassifier = CharacterClassifier;
    var Boolean;
    (function (Boolean) {
        Boolean[Boolean["False"] = 0] = "False";
        Boolean[Boolean["True"] = 1] = "True";
    })(Boolean || (Boolean = {}));
    class CharacterSet {
        constructor() {
            this._actual = new CharacterClassifier(0 /* False */);
        }
        add(charCode) {
            this._actual.set(charCode, 1 /* True */);
        }
        has(charCode) {
            return (this._actual.get(charCode) === 1 /* True */);
        }
    }
    exports.CharacterSet = CharacterSet;
});
//# __sourceMappingURL=characterClassifier.js.map