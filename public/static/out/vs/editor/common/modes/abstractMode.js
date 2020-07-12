/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FrankensteinMode = void 0;
    class FrankensteinMode {
        constructor(languageIdentifier) {
            this._languageIdentifier = languageIdentifier;
        }
        getId() {
            return this._languageIdentifier.language;
        }
        getLanguageIdentifier() {
            return this._languageIdentifier;
        }
    }
    exports.FrankensteinMode = FrankensteinMode;
});
//# __sourceMappingURL=abstractMode.js.map