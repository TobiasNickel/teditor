/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hash"], function (require, exports, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWorkspaceIdentifier = void 0;
    function getWorkspaceIdentifier(workspacePath) {
        return {
            id: hash_1.hash(workspacePath.toString()).toString(16),
            configPath: workspacePath
        };
    }
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
});
//# __sourceMappingURL=workspaces.js.map