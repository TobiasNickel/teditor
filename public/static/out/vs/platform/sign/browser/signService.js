/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    class SignService {
        constructor(token) {
            this._tkn = token || null;
        }
        async sign(value) {
            return Promise.resolve(this._tkn || '');
        }
    }
    exports.SignService = SignService;
});
//# __sourceMappingURL=signService.js.map