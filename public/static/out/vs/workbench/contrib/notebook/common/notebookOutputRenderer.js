/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob"], function (require, exports, glob) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOutputRendererInfo = void 0;
    class NotebookOutputRendererInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.displayName = descriptor.displayName;
            this.mimeTypes = descriptor.mimeTypes;
            this.mimeTypeGlobs = this.mimeTypes.map(pattern => glob.parse(pattern));
        }
        matches(mimeType) {
            let matched = this.mimeTypeGlobs.find(pattern => pattern(mimeType));
            if (matched) {
                return true;
            }
            return this.mimeTypes.find(pattern => pattern === mimeType);
        }
    }
    exports.NotebookOutputRendererInfo = NotebookOutputRendererInfo;
});
//# __sourceMappingURL=notebookOutputRenderer.js.map