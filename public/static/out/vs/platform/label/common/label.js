/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/workspaces/common/workspaces", "vs/nls", "vs/base/common/resources"], function (require, exports, instantiation_1, workspaces_1, nls_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSimpleWorkspaceLabel = exports.ILabelService = void 0;
    exports.ILabelService = instantiation_1.createDecorator('labelService');
    function getSimpleWorkspaceLabel(workspace, workspaceHome) {
        if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
            return resources_1.basename(workspace);
        }
        // Workspace: Untitled
        if (resources_1.isEqualOrParent(workspace.configPath, workspaceHome)) {
            return nls_1.localize('untitledWorkspace', "Untitled (Workspace)");
        }
        let filename = resources_1.basename(workspace.configPath);
        if (filename.endsWith(workspaces_1.WORKSPACE_EXTENSION)) {
            filename = filename.substr(0, filename.length - workspaces_1.WORKSPACE_EXTENSION.length - 1);
        }
        return nls_1.localize('workspaceName', "{0} (Workspace)", filename);
    }
    exports.getSimpleWorkspaceLabel = getSimpleWorkspaceLabel;
});
//# __sourceMappingURL=label.js.map