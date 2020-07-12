/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorGroupToViewColumn = exports.viewColumnToEditorGroup = void 0;
    function viewColumnToEditorGroup(editorGroupService, position) {
        if (typeof position !== 'number' || position === editorService_1.ACTIVE_GROUP) {
            return editorService_1.ACTIVE_GROUP; // prefer active group when position is undefined or passed in as such
        }
        const groups = editorGroupService.getGroups(2 /* GRID_APPEARANCE */);
        let candidate = groups[position];
        if (candidate) {
            return candidate.id; // found direct match
        }
        let firstGroup = groups[0];
        if (groups.length === 1 && firstGroup.count === 0) {
            return firstGroup.id; // first editor should always open in first group independent from position provided
        }
        return editorService_1.SIDE_GROUP; // open to the side if group not found or we are instructed to
    }
    exports.viewColumnToEditorGroup = viewColumnToEditorGroup;
    function editorGroupToViewColumn(editorGroupService, editorGroup) {
        const group = (typeof editorGroup === 'number') ? editorGroupService.getGroup(editorGroup) : editorGroup;
        if (!group) {
            throw new Error('Invalid group provided');
        }
        return editorGroupService.getGroups(2 /* GRID_APPEARANCE */).indexOf(group);
    }
    exports.editorGroupToViewColumn = editorGroupToViewColumn;
});
//# __sourceMappingURL=editor.js.map