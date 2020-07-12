/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createErrorWithActions = exports.isErrorWithActions = void 0;
    function isErrorWithActions(obj) {
        return obj instanceof Error && Array.isArray(obj.actions);
    }
    exports.isErrorWithActions = isErrorWithActions;
    function createErrorWithActions(message, options = Object.create(null)) {
        const result = new Error(message);
        if (options.actions) {
            result.actions = options.actions;
        }
        return result;
    }
    exports.createErrorWithActions = createErrorWithActions;
});
//# __sourceMappingURL=errorsWithActions.js.map