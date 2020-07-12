/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/hash", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, hash_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebResourceIdentityService = exports.IResourceIdentityService = void 0;
    exports.IResourceIdentityService = instantiation_1.createDecorator('IResourceIdentityService');
    class WebResourceIdentityService extends lifecycle_1.Disposable {
        async resolveResourceIdentity(resource) {
            return hash_1.hash(resource.toString()).toString(16);
        }
    }
    exports.WebResourceIdentityService = WebResourceIdentityService;
});
//# __sourceMappingURL=resourceIdentityService.js.map