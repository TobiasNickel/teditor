/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        MARKERS_CONTAINER_ID: 'workbench.panel.markers',
        MARKERS_VIEW_ID: 'workbench.panel.markers.view',
        MARKERS_VIEW_STORAGE_ID: 'workbench.panel.markers',
        MARKER_COPY_ACTION_ID: 'problems.action.copy',
        MARKER_COPY_MESSAGE_ACTION_ID: 'problems.action.copyMessage',
        RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID: 'problems.action.copyRelatedInformationMessage',
        FOCUS_PROBLEMS_FROM_FILTER: 'problems.action.focusProblemsFromFilter',
        MARKERS_VIEW_FOCUS_FILTER: 'problems.action.focusFilter',
        MARKERS_VIEW_CLEAR_FILTER_TEXT: 'problems.action.clearFilterText',
        MARKERS_VIEW_SHOW_MULTILINE_MESSAGE: 'problems.action.showMultilineMessage',
        MARKERS_VIEW_SHOW_SINGLELINE_MESSAGE: 'problems.action.showSinglelineMessage',
        MARKER_OPEN_SIDE_ACTION_ID: 'problems.action.openToSide',
        MARKER_SHOW_PANEL_ID: 'workbench.action.showErrorsWarnings',
        MARKER_SHOW_QUICK_FIX: 'problems.action.showQuickFixes',
        TOGGLE_MARKERS_VIEW_ACTION_ID: 'workbench.actions.view.toggleProblems',
        MarkersViewSmallLayoutContextKey: new contextkey_1.RawContextKey(`problemsView.smallLayout`, false),
        MarkerFocusContextKey: new contextkey_1.RawContextKey('problemFocus', false),
        MarkerViewFilterFocusContextKey: new contextkey_1.RawContextKey('problemsFilterFocus', false),
        RelatedInformationFocusContextKey: new contextkey_1.RawContextKey('relatedInformationFocus', false)
    };
});
//# __sourceMappingURL=constants.js.map