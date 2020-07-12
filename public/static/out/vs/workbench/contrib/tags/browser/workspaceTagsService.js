/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/tags/common/workspaceTags"], function (require, exports, extensions_1, workspaceTags_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoOpWorkspaceTagsService = void 0;
    class NoOpWorkspaceTagsService {
        getTags() {
            return Promise.resolve({});
        }
        getTelemetryWorkspaceId(workspace, state) {
            return undefined;
        }
        getHashedRemotesFromUri(workspaceUri, stripEndingDotGit) {
            return Promise.resolve([]);
        }
    }
    exports.NoOpWorkspaceTagsService = NoOpWorkspaceTagsService;
    extensions_1.registerSingleton(workspaceTags_1.IWorkspaceTagsService, NoOpWorkspaceTagsService, true);
});
//# __sourceMappingURL=workspaceTagsService.js.map