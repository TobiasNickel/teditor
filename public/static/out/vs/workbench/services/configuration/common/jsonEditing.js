/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONEditingError = exports.JSONEditingErrorCode = exports.IJSONEditingService = void 0;
    exports.IJSONEditingService = instantiation_1.createDecorator('jsonEditingService');
    var JSONEditingErrorCode;
    (function (JSONEditingErrorCode) {
        /**
         * Error when trying to write and save to the file while it is dirty in the editor.
         */
        JSONEditingErrorCode[JSONEditingErrorCode["ERROR_FILE_DIRTY"] = 0] = "ERROR_FILE_DIRTY";
        /**
         * Error when trying to write to a file that contains JSON errors.
         */
        JSONEditingErrorCode[JSONEditingErrorCode["ERROR_INVALID_FILE"] = 1] = "ERROR_INVALID_FILE";
    })(JSONEditingErrorCode = exports.JSONEditingErrorCode || (exports.JSONEditingErrorCode = {}));
    class JSONEditingError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.JSONEditingError = JSONEditingError;
});
//# __sourceMappingURL=jsonEditing.js.map