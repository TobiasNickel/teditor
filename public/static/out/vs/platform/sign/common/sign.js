/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISignService = exports.SIGN_SERVICE_ID = void 0;
    exports.SIGN_SERVICE_ID = 'signService';
    exports.ISignService = instantiation_1.createDecorator(exports.SIGN_SERVICE_ID);
});
//# __sourceMappingURL=sign.js.map