/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.asWebviewUri = void 0;
    function asWebviewUri(environmentService, uuid, resource) {
        const uri = environmentService.webviewResourceRoot
            // Make sure we preserve the scheme of the resource but convert it into a normal path segment
            // The scheme is important as we need to know if we are requesting a local or a remote resource.
            .replace('{{resource}}', resource.scheme + withoutScheme(resource))
            .replace('{{uuid}}', uuid);
        return uri_1.URI.parse(uri);
    }
    exports.asWebviewUri = asWebviewUri;
    function withoutScheme(resource) {
        return resource.toString().replace(/^\S+?:/, '');
    }
});
//# __sourceMappingURL=webviewUri.js.map