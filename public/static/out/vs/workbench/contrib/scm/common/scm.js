/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputValidationType = exports.ISCMService = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.scm';
    exports.ISCMService = instantiation_1.createDecorator('scm');
    var InputValidationType;
    (function (InputValidationType) {
        InputValidationType[InputValidationType["Error"] = 0] = "Error";
        InputValidationType[InputValidationType["Warning"] = 1] = "Warning";
        InputValidationType[InputValidationType["Information"] = 2] = "Information";
    })(InputValidationType = exports.InputValidationType || (exports.InputValidationType = {}));
});
//# __sourceMappingURL=scm.js.map