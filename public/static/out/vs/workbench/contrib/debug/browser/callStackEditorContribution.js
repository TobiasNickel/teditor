/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/editor/common/core/range", "vs/workbench/contrib/debug/common/debug", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, range_1, debug_1, themeService_1, colorRegistry_1, nls_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallStackEditorContribution = exports.createDecorationsForStackFrame = void 0;
    const stickiness = 1 /* NeverGrowsWhenTypingAtEdges */;
    // we need a separate decoration for glyph margin, since we do not want it on each line of a multi line statement.
    const TOP_STACK_FRAME_MARGIN = {
        glyphMarginClassName: 'codicon-debug-stackframe',
        stickiness
    };
    const FOCUSED_STACK_FRAME_MARGIN = {
        glyphMarginClassName: 'codicon-debug-stackframe-focused',
        stickiness
    };
    const TOP_STACK_FRAME_DECORATION = {
        isWholeLine: true,
        className: 'debug-top-stack-frame-line',
        stickiness
    };
    const TOP_STACK_FRAME_INLINE_DECORATION = {
        beforeContentClassName: 'debug-top-stack-frame-column'
    };
    const FOCUSED_STACK_FRAME_DECORATION = {
        isWholeLine: true,
        className: 'debug-focused-stack-frame-line',
        stickiness
    };
    function createDecorationsForStackFrame(stackFrame, topStackFrameRange) {
        // only show decorations for the currently focused thread.
        const result = [];
        const columnUntilEOLRange = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
        const range = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, stackFrame.range.startColumn + 1);
        // compute how to decorate the editor. Different decorations are used if this is a top stack frame, focused stack frame,
        // an exception or a stack frame that did not change the line number (we only decorate the columns, not the whole line).
        const callStack = stackFrame.thread.getCallStack();
        if (callStack && callStack.length && stackFrame === callStack[0]) {
            result.push({
                options: TOP_STACK_FRAME_MARGIN,
                range
            });
            result.push({
                options: TOP_STACK_FRAME_DECORATION,
                range: columnUntilEOLRange
            });
            if (topStackFrameRange && topStackFrameRange.startLineNumber === stackFrame.range.startLineNumber && topStackFrameRange.startColumn !== stackFrame.range.startColumn) {
                result.push({
                    options: TOP_STACK_FRAME_INLINE_DECORATION,
                    range: columnUntilEOLRange
                });
            }
            topStackFrameRange = columnUntilEOLRange;
        }
        else {
            result.push({
                options: FOCUSED_STACK_FRAME_MARGIN,
                range
            });
            result.push({
                options: FOCUSED_STACK_FRAME_DECORATION,
                range: columnUntilEOLRange
            });
        }
        return result;
    }
    exports.createDecorationsForStackFrame = createDecorationsForStackFrame;
    let CallStackEditorContribution = class CallStackEditorContribution {
        constructor(editor, debugService) {
            this.editor = editor;
            this.debugService = debugService;
            this.toDispose = [];
            this.decorationIds = [];
            const setDecorations = () => this.decorationIds = this.editor.deltaDecorations(this.decorationIds, this.createCallStackDecorations());
            this.toDispose.push(event_1.Event.any(this.debugService.getViewModel().onDidFocusStackFrame, this.debugService.getModel().onDidChangeCallStack)(() => {
                setDecorations();
            }));
            this.toDispose.push(this.editor.onDidChangeModel(e => {
                if (e.newModelUrl) {
                    setDecorations();
                }
            }));
        }
        createCallStackDecorations() {
            const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
            const decorations = [];
            this.debugService.getModel().getSessions().forEach(s => {
                s.getAllThreads().forEach(t => {
                    var _a;
                    if (t.stopped) {
                        let candidateStackFrame = t === (focusedStackFrame === null || focusedStackFrame === void 0 ? void 0 : focusedStackFrame.thread) ? focusedStackFrame : undefined;
                        if (!candidateStackFrame) {
                            const callStack = t.getCallStack();
                            if (callStack.length) {
                                candidateStackFrame = callStack[0];
                            }
                        }
                        if (candidateStackFrame && candidateStackFrame.source.uri.toString() === ((_a = this.editor.getModel()) === null || _a === void 0 ? void 0 : _a.uri.toString())) {
                            decorations.push(...createDecorationsForStackFrame(candidateStackFrame, this.topStackFrameRange));
                        }
                    }
                });
            });
            return decorations;
        }
        dispose() {
            this.editor.deltaDecorations(this.decorationIds, []);
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
    };
    CallStackEditorContribution = __decorate([
        __param(1, debug_1.IDebugService)
    ], CallStackEditorContribution);
    exports.CallStackEditorContribution = CallStackEditorContribution;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const topStackFrame = theme.getColor(topStackFrameColor);
        if (topStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
        }
        const focusedStackFrame = theme.getColor(focusedStackFrameColor);
        if (focusedStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-focused-stack-frame-line { background: ${focusedStackFrame}; }`);
        }
    });
    const topStackFrameColor = colorRegistry_1.registerColor('editor.stackFrameHighlightBackground', { dark: '#ffff0033', light: '#ffff6673', hc: '#ffff0033' }, nls_1.localize('topStackFrameLineHighlight', 'Background color for the highlight of line at the top stack frame position.'));
    const focusedStackFrameColor = colorRegistry_1.registerColor('editor.focusedStackFrameHighlightBackground', { dark: '#7abd7a4d', light: '#cee7ce73', hc: '#7abd7a4d' }, nls_1.localize('focusedStackFrameLineHighlight', 'Background color for the highlight of line at focused stack frame position.'));
});
//# __sourceMappingURL=callStackEditorContribution.js.map