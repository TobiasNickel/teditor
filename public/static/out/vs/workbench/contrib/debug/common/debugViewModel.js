/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, event_1, debug_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModel = void 0;
    class ViewModel {
        constructor(contextKeyService) {
            this.firstSessionStart = true;
            this._onDidFocusSession = new event_1.Emitter();
            this._onDidFocusStackFrame = new event_1.Emitter();
            this._onDidSelectExpression = new event_1.Emitter();
            this.multiSessionView = false;
            this.expressionSelectedContextKey = debug_1.CONTEXT_EXPRESSION_SELECTED.bindTo(contextKeyService);
            this.breakpointSelectedContextKey = debug_1.CONTEXT_BREAKPOINT_SELECTED.bindTo(contextKeyService);
            this.loadedScriptsSupportedContextKey = debug_1.CONTEXT_LOADED_SCRIPTS_SUPPORTED.bindTo(contextKeyService);
            this.stepBackSupportedContextKey = debug_1.CONTEXT_STEP_BACK_SUPPORTED.bindTo(contextKeyService);
            this.focusedSessionIsAttach = debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.bindTo(contextKeyService);
            this.restartFrameSupportedContextKey = debug_1.CONTEXT_RESTART_FRAME_SUPPORTED.bindTo(contextKeyService);
            this.stepIntoTargetsSupported = debug_1.CONTEXT_STEP_INTO_TARGETS_SUPPORTED.bindTo(contextKeyService);
            this.jumpToCursorSupported = debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED.bindTo(contextKeyService);
        }
        getId() {
            return 'root';
        }
        get focusedSession() {
            return this._focusedSession;
        }
        get focusedThread() {
            return this._focusedThread;
        }
        get focusedStackFrame() {
            return this._focusedStackFrame;
        }
        setFocus(stackFrame, thread, session, explicit) {
            const shouldEmitForStackFrame = this._focusedStackFrame !== stackFrame;
            const shouldEmitForSession = this._focusedSession !== session;
            this._focusedStackFrame = stackFrame;
            this._focusedThread = thread;
            this._focusedSession = session;
            this.loadedScriptsSupportedContextKey.set(session ? !!session.capabilities.supportsLoadedSourcesRequest : false);
            this.stepBackSupportedContextKey.set(session ? !!session.capabilities.supportsStepBack : false);
            this.restartFrameSupportedContextKey.set(session ? !!session.capabilities.supportsRestartFrame : false);
            this.stepIntoTargetsSupported.set(session ? !!session.capabilities.supportsStepInTargetsRequest : false);
            this.jumpToCursorSupported.set(session ? !!session.capabilities.supportsGotoTargetsRequest : false);
            const attach = !!session && debugUtils_1.isSessionAttach(session);
            this.focusedSessionIsAttach.set(attach);
            if (shouldEmitForSession) {
                this._onDidFocusSession.fire(session);
            }
            if (shouldEmitForStackFrame) {
                this._onDidFocusStackFrame.fire({ stackFrame, explicit });
            }
        }
        get onDidFocusSession() {
            return this._onDidFocusSession.event;
        }
        get onDidFocusStackFrame() {
            return this._onDidFocusStackFrame.event;
        }
        getSelectedExpression() {
            return this.selectedExpression;
        }
        setSelectedExpression(expression) {
            this.selectedExpression = expression;
            this.expressionSelectedContextKey.set(!!expression);
            this._onDidSelectExpression.fire(expression);
        }
        get onDidSelectExpression() {
            return this._onDidSelectExpression.event;
        }
        getSelectedFunctionBreakpoint() {
            return this.selectedFunctionBreakpoint;
        }
        setSelectedFunctionBreakpoint(functionBreakpoint) {
            this.selectedFunctionBreakpoint = functionBreakpoint;
            this.breakpointSelectedContextKey.set(!!functionBreakpoint);
        }
        isMultiSessionView() {
            return this.multiSessionView;
        }
        setMultiSessionView(isMultiSessionView) {
            this.multiSessionView = isMultiSessionView;
        }
    }
    exports.ViewModel = ViewModel;
});
//# __sourceMappingURL=debugViewModel.js.map