/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/platform/webview/common/mimeTypes"], function (require, exports, cancellation_1, extpath_1, network_1, path_1, uri_1, mimeTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loadLocalResource = exports.WebviewResourceResponse = exports.webviewPartitionId = void 0;
    exports.webviewPartitionId = 'webview';
    var WebviewResourceResponse;
    (function (WebviewResourceResponse) {
        let Type;
        (function (Type) {
            Type[Type["Success"] = 0] = "Success";
            Type[Type["Failed"] = 1] = "Failed";
            Type[Type["AccessDenied"] = 2] = "AccessDenied";
        })(Type = WebviewResourceResponse.Type || (WebviewResourceResponse.Type = {}));
        class StreamSuccess {
            constructor(stream, mimeType) {
                this.stream = stream;
                this.mimeType = mimeType;
                this.type = Type.Success;
            }
        }
        WebviewResourceResponse.StreamSuccess = StreamSuccess;
        WebviewResourceResponse.Failed = { type: Type.Failed };
        WebviewResourceResponse.AccessDenied = { type: Type.AccessDenied };
    })(WebviewResourceResponse = exports.WebviewResourceResponse || (exports.WebviewResourceResponse = {}));
    async function loadLocalResource(requestUri, options, fileService, requestService) {
        let resourceToLoad = getResourceToLoad(requestUri, options.roots);
        if (!resourceToLoad) {
            return WebviewResourceResponse.AccessDenied;
        }
        const mime = mimeTypes_1.getWebviewContentMimeType(requestUri); // Use the original path for the mime
        // Perform extra normalization if needed
        if (options.rewriteUri) {
            resourceToLoad = options.rewriteUri(resourceToLoad);
        }
        if (resourceToLoad.scheme === network_1.Schemas.http || resourceToLoad.scheme === network_1.Schemas.https) {
            const response = await requestService.request({ url: resourceToLoad.toString(true) }, cancellation_1.CancellationToken.None);
            if (response.res.statusCode === 200) {
                return new WebviewResourceResponse.StreamSuccess(response.stream, mime);
            }
            return WebviewResourceResponse.Failed;
        }
        try {
            const contents = await fileService.readFileStream(resourceToLoad);
            return new WebviewResourceResponse.StreamSuccess(contents.value, mime);
        }
        catch (err) {
            console.log(err);
            return WebviewResourceResponse.Failed;
        }
    }
    exports.loadLocalResource = loadLocalResource;
    function getResourceToLoad(requestUri, roots) {
        const normalizedPath = normalizeRequestPath(requestUri);
        for (const root of roots) {
            if (containsResource(root, normalizedPath)) {
                return normalizedPath;
            }
        }
        return undefined;
    }
    function normalizeRequestPath(requestUri) {
        if (requestUri.scheme === network_1.Schemas.vscodeWebviewResource) {
            // The `vscode-webview-resource` scheme has the following format:
            //
            // vscode-webview-resource://id/scheme//authority?/path
            //
            const resourceUri = uri_1.URI.parse(requestUri.path.replace(/^\/([a-z0-9\-]+)\/{1,2}/i, '$1://'));
            return resourceUri.with({
                query: requestUri.query,
                fragment: requestUri.fragment
            });
        }
        else {
            return requestUri;
        }
    }
    function containsResource(root, resource) {
        let rootPath = root.fsPath + (root.fsPath.endsWith(path_1.sep) ? '' : path_1.sep);
        let resourceFsPath = resource.fsPath;
        if (extpath_1.isUNC(root.fsPath) && extpath_1.isUNC(resource.fsPath)) {
            rootPath = rootPath.toLowerCase();
            resourceFsPath = resourceFsPath.toLowerCase();
        }
        return resourceFsPath.startsWith(rootPath);
    }
});
//# __sourceMappingURL=resourceLoader.js.map