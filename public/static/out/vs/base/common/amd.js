/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getUriFromAmdModule = exports.getPathFromAmdModule = void 0;
    function getPathFromAmdModule(requirefn, relativePath) {
        return getUriFromAmdModule(requirefn, relativePath).fsPath;
    }
    exports.getPathFromAmdModule = getPathFromAmdModule;
    function getUriFromAmdModule(requirefn, relativePath) {
        return uri_1.URI.parse(requirefn.toUrl(relativePath));
    }
    exports.getUriFromAmdModule = getUriFromAmdModule;
});
//# __sourceMappingURL=amd.js.map