/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IDebugHelperService = exports.DEBUG_HELPER_SERVICE_ID = exports.BreakpointWidgetContext = exports.IDebugService = exports.getStateLabel = exports.State = exports.INTERNAL_CONSOLE_OPTIONS_SCHEMA = exports.DEBUG_SCHEME = exports.BREAKPOINT_EDITOR_CONTRIBUTION_ID = exports.EDITOR_CONTRIBUTION_ID = exports.CONTEXT_BREAKPOINTS_EXIST = exports.CONTEXT_STEP_INTO_TARGETS_SUPPORTED = exports.CONTEXT_JUMP_TO_CURSOR_SUPPORTED = exports.CONTEXT_RESTART_FRAME_SUPPORTED = exports.CONTEXT_STEP_BACK_SUPPORTED = exports.CONTEXT_FOCUSED_SESSION_IS_ATTACH = exports.CONTEXT_LOADED_SCRIPTS_ITEM_TYPE = exports.CONTEXT_LOADED_SCRIPTS_SUPPORTED = exports.CONTEXT_CALLSTACK_ITEM_TYPE = exports.CONTEXT_BREAKPOINT_SELECTED = exports.CONTEXT_EXPRESSION_SELECTED = exports.CONTEXT_VARIABLES_FOCUSED = exports.CONTEXT_WATCH_EXPRESSIONS_FOCUSED = exports.CONTEXT_BREAKPOINTS_FOCUSED = exports.CONTEXT_IN_BREAKPOINT_WIDGET = exports.CONTEXT_BREAKPOINT_WIDGET_VISIBLE = exports.CONTEXT_IN_DEBUG_REPL = exports.CONTEXT_IN_DEBUG_MODE = exports.CONTEXT_DEBUG_UX = exports.CONTEXT_DEBUG_UX_KEY = exports.CONTEXT_DEBUG_STATE = exports.CONTEXT_DEBUG_CONFIGURATION_TYPE = exports.CONTEXT_DEBUG_TYPE = exports.DEBUG_SERVICE_ID = exports.REPL_VIEW_ID = exports.DEBUG_PANEL_ID = exports.BREAKPOINTS_VIEW_ID = exports.LOADED_SCRIPTS_VIEW_ID = exports.CALLSTACK_VIEW_ID = exports.WATCH_VIEW_ID = exports.VARIABLES_VIEW_ID = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.debug';
    exports.VARIABLES_VIEW_ID = 'workbench.debug.variablesView';
    exports.WATCH_VIEW_ID = 'workbench.debug.watchExpressionsView';
    exports.CALLSTACK_VIEW_ID = 'workbench.debug.callStackView';
    exports.LOADED_SCRIPTS_VIEW_ID = 'workbench.debug.loadedScriptsView';
    exports.BREAKPOINTS_VIEW_ID = 'workbench.debug.breakPointsView';
    exports.DEBUG_PANEL_ID = 'workbench.panel.repl';
    exports.REPL_VIEW_ID = 'workbench.panel.repl.view';
    exports.DEBUG_SERVICE_ID = 'debugService';
    exports.CONTEXT_DEBUG_TYPE = new contextkey_1.RawContextKey('debugType', undefined);
    exports.CONTEXT_DEBUG_CONFIGURATION_TYPE = new contextkey_1.RawContextKey('debugConfigurationType', undefined);
    exports.CONTEXT_DEBUG_STATE = new contextkey_1.RawContextKey('debugState', 'inactive');
    exports.CONTEXT_DEBUG_UX_KEY = 'debugUx';
    exports.CONTEXT_DEBUG_UX = new contextkey_1.RawContextKey(exports.CONTEXT_DEBUG_UX_KEY, 'default');
    exports.CONTEXT_IN_DEBUG_MODE = new contextkey_1.RawContextKey('inDebugMode', false);
    exports.CONTEXT_IN_DEBUG_REPL = new contextkey_1.RawContextKey('inDebugRepl', false);
    exports.CONTEXT_BREAKPOINT_WIDGET_VISIBLE = new contextkey_1.RawContextKey('breakpointWidgetVisible', false);
    exports.CONTEXT_IN_BREAKPOINT_WIDGET = new contextkey_1.RawContextKey('inBreakpointWidget', false);
    exports.CONTEXT_BREAKPOINTS_FOCUSED = new contextkey_1.RawContextKey('breakpointsFocused', true);
    exports.CONTEXT_WATCH_EXPRESSIONS_FOCUSED = new contextkey_1.RawContextKey('watchExpressionsFocused', true);
    exports.CONTEXT_VARIABLES_FOCUSED = new contextkey_1.RawContextKey('variablesFocused', true);
    exports.CONTEXT_EXPRESSION_SELECTED = new contextkey_1.RawContextKey('expressionSelected', false);
    exports.CONTEXT_BREAKPOINT_SELECTED = new contextkey_1.RawContextKey('breakpointSelected', false);
    exports.CONTEXT_CALLSTACK_ITEM_TYPE = new contextkey_1.RawContextKey('callStackItemType', undefined);
    exports.CONTEXT_LOADED_SCRIPTS_SUPPORTED = new contextkey_1.RawContextKey('loadedScriptsSupported', false);
    exports.CONTEXT_LOADED_SCRIPTS_ITEM_TYPE = new contextkey_1.RawContextKey('loadedScriptsItemType', undefined);
    exports.CONTEXT_FOCUSED_SESSION_IS_ATTACH = new contextkey_1.RawContextKey('focusedSessionIsAttach', false);
    exports.CONTEXT_STEP_BACK_SUPPORTED = new contextkey_1.RawContextKey('stepBackSupported', false);
    exports.CONTEXT_RESTART_FRAME_SUPPORTED = new contextkey_1.RawContextKey('restartFrameSupported', false);
    exports.CONTEXT_JUMP_TO_CURSOR_SUPPORTED = new contextkey_1.RawContextKey('jumpToCursorSupported', false);
    exports.CONTEXT_STEP_INTO_TARGETS_SUPPORTED = new contextkey_1.RawContextKey('stepIntoTargetsSupported', false);
    exports.CONTEXT_BREAKPOINTS_EXIST = new contextkey_1.RawContextKey('breakpointsExist', false);
    exports.EDITOR_CONTRIBUTION_ID = 'editor.contrib.debug';
    exports.BREAKPOINT_EDITOR_CONTRIBUTION_ID = 'editor.contrib.breakpoint';
    exports.DEBUG_SCHEME = 'debug';
    exports.INTERNAL_CONSOLE_OPTIONS_SCHEMA = {
        enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart'],
        default: 'openOnFirstSessionStart',
        description: nls.localize('internalConsoleOptions', "Controls when the internal debug console should open.")
    };
    var State;
    (function (State) {
        State[State["Inactive"] = 0] = "Inactive";
        State[State["Initializing"] = 1] = "Initializing";
        State[State["Stopped"] = 2] = "Stopped";
        State[State["Running"] = 3] = "Running";
    })(State = exports.State || (exports.State = {}));
    function getStateLabel(state) {
        switch (state) {
            case 1 /* Initializing */: return 'initializing';
            case 2 /* Stopped */: return 'stopped';
            case 3 /* Running */: return 'running';
            default: return 'inactive';
        }
    }
    exports.getStateLabel = getStateLabel;
    // Debug service interfaces
    exports.IDebugService = instantiation_1.createDecorator(exports.DEBUG_SERVICE_ID);
    // Editor interfaces
    var BreakpointWidgetContext;
    (function (BreakpointWidgetContext) {
        BreakpointWidgetContext[BreakpointWidgetContext["CONDITION"] = 0] = "CONDITION";
        BreakpointWidgetContext[BreakpointWidgetContext["HIT_COUNT"] = 1] = "HIT_COUNT";
        BreakpointWidgetContext[BreakpointWidgetContext["LOG_MESSAGE"] = 2] = "LOG_MESSAGE";
    })(BreakpointWidgetContext = exports.BreakpointWidgetContext || (exports.BreakpointWidgetContext = {}));
    // temporary debug helper service
    exports.DEBUG_HELPER_SERVICE_ID = 'debugHelperService';
    exports.IDebugHelperService = instantiation_1.createDecorator(exports.DEBUG_HELPER_SERVICE_ID);
});
//# __sourceMappingURL=debug.js.map