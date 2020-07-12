/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/common/panel", "vs/workbench/common/views", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/base/browser/dom"], function (require, exports, nls, keyCodes_1, range_1, editorContextKeys_1, editorExtensions_1, contextkey_1, debug_1, viewlet_1, editorService_1, breakpointsView_1, panel_1, views_1, contextView_1, actions_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RunToCursorAction = exports.ADD_LOG_POINT_ID = exports.TOGGLE_CONDITIONAL_BREAKPOINT_ID = exports.TOGGLE_BREAKPOINT_ID = void 0;
    exports.TOGGLE_BREAKPOINT_ID = 'editor.debug.action.toggleBreakpoint';
    class ToggleBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: exports.TOGGLE_BREAKPOINT_ID,
                label: nls.localize('toggleBreakpointAction', "Debug: Toggle Breakpoint"),
                alias: 'Debug: Toggle Breakpoint',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 67 /* F9 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(accessor, editor) {
            if (editor.hasModel()) {
                const debugService = accessor.get(debug_1.IDebugService);
                const modelUri = editor.getModel().uri;
                const canSet = debugService.getConfigurationManager().canSetBreakpointsIn(editor.getModel());
                // Does not account for multi line selections, Set to remove multiple cursor on the same line
                const lineNumbers = [...new Set(editor.getSelections().map(s => s.getPosition().lineNumber))];
                return Promise.all(lineNumbers.map(line => {
                    const bps = debugService.getModel().getBreakpoints({ lineNumber: line, uri: modelUri });
                    if (bps.length) {
                        return Promise.all(bps.map(bp => debugService.removeBreakpoints(bp.getId())));
                    }
                    else if (canSet) {
                        return (debugService.addBreakpoints(modelUri, [{ lineNumber: line }], 'debugEditorActions.toggleBreakpointAction'));
                    }
                    else {
                        return [];
                    }
                }));
            }
        }
    }
    exports.TOGGLE_CONDITIONAL_BREAKPOINT_ID = 'editor.debug.action.conditionalBreakpoint';
    class ConditionalBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: exports.TOGGLE_CONDITIONAL_BREAKPOINT_ID,
                label: nls.localize('conditionalBreakpointEditorAction', "Debug: Add Conditional Breakpoint..."),
                alias: 'Debug: Add Conditional Breakpoint...',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.getConfigurationManager().canSetBreakpointsIn(editor.getModel())) {
                editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID).showBreakpointWidget(position.lineNumber, undefined, 0 /* CONDITION */);
            }
        }
    }
    exports.ADD_LOG_POINT_ID = 'editor.debug.action.addLogPoint';
    class LogPointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: exports.ADD_LOG_POINT_ID,
                label: nls.localize('logPointEditorAction', "Debug: Add Logpoint..."),
                alias: 'Debug: Add Logpoint...',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.getConfigurationManager().canSetBreakpointsIn(editor.getModel())) {
                editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID).showBreakpointWidget(position.lineNumber, position.column, 2 /* LOG_MESSAGE */);
            }
        }
    }
    class RunToCursorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: RunToCursorAction.ID,
                label: RunToCursorAction.LABEL,
                alias: 'Debug: Run to Cursor',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, panel_1.PanelFocusContext.toNegated(), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 2
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const focusedSession = debugService.getViewModel().focusedSession;
            if (debugService.state !== 2 /* Stopped */ || !focusedSession) {
                return;
            }
            let breakpointToRemove;
            const oneTimeListener = focusedSession.onDidChangeState(() => {
                const state = focusedSession.state;
                if (state === 2 /* Stopped */ || state === 0 /* Inactive */) {
                    if (breakpointToRemove) {
                        debugService.removeBreakpoints(breakpointToRemove.getId());
                    }
                    oneTimeListener.dispose();
                }
            });
            const position = editor.getPosition();
            if (editor.hasModel() && position) {
                const uri = editor.getModel().uri;
                const bpExists = !!(debugService.getModel().getBreakpoints({ column: position.column, lineNumber: position.lineNumber, uri }).length);
                if (!bpExists) {
                    const breakpoints = await debugService.addBreakpoints(uri, [{ lineNumber: position.lineNumber, column: position.column }], 'debugEditorActions.runToCursorAction');
                    if (breakpoints && breakpoints.length) {
                        breakpointToRemove = breakpoints[0];
                    }
                }
                await debugService.getViewModel().focusedThread.continue();
            }
        }
    }
    exports.RunToCursorAction = RunToCursorAction;
    RunToCursorAction.ID = 'editor.debug.action.runToCursor';
    RunToCursorAction.LABEL = nls.localize('runToCursor', "Run to Cursor");
    class SelectionToReplAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.selectionToRepl',
                label: nls.localize('evaluateInDebugConsole', "Evaluate in Debug Console"),
                alias: 'Evaluate',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection, debug_1.CONTEXT_IN_DEBUG_MODE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 0
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const viewsService = accessor.get(views_1.IViewsService);
            const viewModel = debugService.getViewModel();
            const session = viewModel.focusedSession;
            if (!editor.hasModel() || !session) {
                return;
            }
            const text = editor.getModel().getValueInRange(editor.getSelection());
            await session.addReplExpression(viewModel.focusedStackFrame, text);
            await viewsService.openView(debug_1.REPL_VIEW_ID, false);
        }
    }
    class SelectionToWatchExpressionsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.selectionToWatch',
                label: nls.localize('addToWatch', "Add to Watch"),
                alias: 'Add to Watch',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection, debug_1.CONTEXT_IN_DEBUG_MODE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 1
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const viewletService = accessor.get(viewlet_1.IViewletService);
            if (!editor.hasModel()) {
                return;
            }
            const text = editor.getModel().getValueInRange(editor.getSelection());
            await viewletService.openViewlet(debug_1.VIEWLET_ID);
            debugService.addWatchExpression(text);
        }
    }
    class ShowDebugHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.showDebugHover',
                label: nls.localize('showDebugHover', "Debug: Show Hover"),
                alias: 'Debug: Show Hover',
                precondition: debug_1.CONTEXT_IN_DEBUG_MODE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 39 /* KEY_I */),
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(accessor, editor) {
            const position = editor.getPosition();
            if (!position || !editor.hasModel()) {
                return;
            }
            const word = editor.getModel().getWordAtPosition(position);
            if (!word) {
                return;
            }
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, word.endColumn);
            return editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID).showHover(range, true);
        }
    }
    class StepIntoTargetsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: StepIntoTargetsAction.ID,
                label: StepIntoTargetsAction.LABEL,
                alias: 'Debug: Step Into Targets...',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_STEP_INTO_TARGETS_SUPPORTED, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 1.5
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const contextMenuService = accessor.get(contextView_1.IContextMenuService);
            const session = debugService.getViewModel().focusedSession;
            const frame = debugService.getViewModel().focusedStackFrame;
            if (session && frame && editor.hasModel() && editor.getModel().uri.toString() === frame.source.uri.toString()) {
                const targets = await session.stepInTargets(frame.frameId);
                editor.revealLineInCenterIfOutsideViewport(frame.range.startLineNumber);
                const cursorCoords = editor.getScrolledVisiblePosition({ lineNumber: frame.range.startLineNumber, column: frame.range.startColumn });
                const editorCoords = dom_1.getDomNodePagePosition(editor.getDomNode());
                const x = editorCoords.left + cursorCoords.left;
                const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
                contextMenuService.showContextMenu({
                    getAnchor: () => ({ x, y }),
                    getActions: () => {
                        return targets.map(t => new actions_1.Action(`stepIntoTarget:${t.id}`, t.label, undefined, true, () => session.stepIn(frame.thread.threadId, t.id)));
                    }
                });
            }
        }
    }
    StepIntoTargetsAction.ID = 'editor.debug.action.stepIntoTargets';
    StepIntoTargetsAction.LABEL = nls.localize('stepIntoTargets', "Step Into Targets...");
    class GoToBreakpointAction extends editorExtensions_1.EditorAction {
        constructor(isNext, opts) {
            super(opts);
            this.isNext = isNext;
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (editor.hasModel()) {
                const currentUri = editor.getModel().uri;
                const currentLine = editor.getPosition().lineNumber;
                //Breakpoints returned from `getBreakpoints` are already sorted.
                const allEnabledBreakpoints = debugService.getModel().getBreakpoints({ enabledOnly: true });
                //Try to find breakpoint in current file
                let moveBreakpoint = this.isNext
                    ? allEnabledBreakpoints.filter(bp => bp.uri.toString() === currentUri.toString() && bp.lineNumber > currentLine).shift()
                    : allEnabledBreakpoints.filter(bp => bp.uri.toString() === currentUri.toString() && bp.lineNumber < currentLine).pop();
                //Try to find breakpoints in following files
                if (!moveBreakpoint) {
                    moveBreakpoint =
                        this.isNext
                            ? allEnabledBreakpoints.filter(bp => bp.uri.toString() > currentUri.toString()).shift()
                            : allEnabledBreakpoints.filter(bp => bp.uri.toString() < currentUri.toString()).pop();
                }
                //Move to first or last possible breakpoint
                if (!moveBreakpoint && allEnabledBreakpoints.length) {
                    moveBreakpoint = this.isNext ? allEnabledBreakpoints[0] : allEnabledBreakpoints[allEnabledBreakpoints.length - 1];
                }
                if (moveBreakpoint) {
                    return breakpointsView_1.openBreakpointSource(moveBreakpoint, false, true, debugService, editorService);
                }
            }
        }
    }
    class GoToNextBreakpointAction extends GoToBreakpointAction {
        constructor() {
            super(true, {
                id: 'editor.debug.action.goToNextBreakpoint',
                label: nls.localize('goToNextBreakpoint', "Debug: Go To Next Breakpoint"),
                alias: 'Debug: Go To Next Breakpoint',
                precondition: undefined
            });
        }
    }
    class GoToPreviousBreakpointAction extends GoToBreakpointAction {
        constructor() {
            super(false, {
                id: 'editor.debug.action.goToPreviousBreakpoint',
                label: nls.localize('goToPreviousBreakpoint', "Debug: Go To Previous Breakpoint"),
                alias: 'Debug: Go To Previous Breakpoint',
                precondition: undefined
            });
        }
    }
    editorExtensions_1.registerEditorAction(ToggleBreakpointAction);
    editorExtensions_1.registerEditorAction(ConditionalBreakpointAction);
    editorExtensions_1.registerEditorAction(LogPointAction);
    editorExtensions_1.registerEditorAction(RunToCursorAction);
    editorExtensions_1.registerEditorAction(StepIntoTargetsAction);
    editorExtensions_1.registerEditorAction(SelectionToReplAction);
    editorExtensions_1.registerEditorAction(SelectionToWatchExpressionsAction);
    editorExtensions_1.registerEditorAction(ShowDebugHoverAction);
    editorExtensions_1.registerEditorAction(GoToNextBreakpointAction);
    editorExtensions_1.registerEditorAction(GoToPreviousBreakpointAction);
});
//# __sourceMappingURL=debugEditorActions.js.map