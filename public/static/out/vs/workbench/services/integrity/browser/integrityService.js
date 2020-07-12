/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/integrity/common/integrity", "vs/platform/instantiation/common/extensions"], function (require, exports, integrity_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserIntegrityServiceImpl = void 0;
    class BrowserIntegrityServiceImpl {
        async isPure() {
            return { isPure: true, proof: [] };
        }
    }
    exports.BrowserIntegrityServiceImpl = BrowserIntegrityServiceImpl;
    extensions_1.registerSingleton(integrity_1.IIntegrityService, BrowserIntegrityServiceImpl, true);
});
//# __sourceMappingURL=integrityService.js.map