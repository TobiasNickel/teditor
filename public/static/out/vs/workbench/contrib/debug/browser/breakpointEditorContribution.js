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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/common/severity", "vs/base/common/actions", "vs/editor/common/core/range", "vs/editor/common/model", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/common/debug", "vs/base/browser/contextmenu", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/debug/browser/breakpointWidget", "vs/base/common/lifecycle", "vs/base/common/htmlContent", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/base/common/uuid", "vs/base/common/decorators", "vs/base/browser/mouseEvent", "vs/base/common/arrays", "vs/base/common/async", "vs/platform/configuration/common/configuration", "vs/base/browser/canIUse", "vs/base/browser/browser", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/label/common/label"], function (require, exports, nls, env, dom, severity_1, actions_1, range_1, model_1, instantiation_1, contextkey_1, contextView_1, debugActions_1, debug_1, contextmenu_1, dialogs_1, breakpointWidget_1, lifecycle_1, htmlContent_1, breakpointsView_1, uuid_1, decorators_1, mouseEvent_1, arrays_1, async_1, configuration_1, canIUse_1, browser_1, themeService_1, colorRegistry_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakpointEditorContribution = exports.createBreakpointDecorations = void 0;
    const $ = dom.$;
    const breakpointHelperDecoration = {
        glyphMarginClassName: 'codicon-debug-hint',
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */
    };
    function createBreakpointDecorations(model, breakpoints, state, breakpointsActivated, showBreakpointsInOverviewRuler) {
        const result = [];
        breakpoints.forEach((breakpoint) => {
            if (breakpoint.lineNumber > model.getLineCount()) {
                return;
            }
            const column = model.getLineFirstNonWhitespaceColumn(breakpoint.lineNumber);
            const range = model.validateRange(breakpoint.column ? new range_1.Range(breakpoint.lineNumber, breakpoint.column, breakpoint.lineNumber, breakpoint.column + 1)
                : new range_1.Range(breakpoint.lineNumber, column, breakpoint.lineNumber, column + 1) // Decoration has to have a width #20688
            );
            result.push({
                options: getBreakpointDecorationOptions(model, breakpoint, state, breakpointsActivated, showBreakpointsInOverviewRuler),
                range
            });
        });
        return result;
    }
    exports.createBreakpointDecorations = createBreakpointDecorations;
    function getBreakpointDecorationOptions(model, breakpoint, state, breakpointsActivated, showBreakpointsInOverviewRuler) {
        const { className, message } = breakpointsView_1.getBreakpointMessageAndClassName(state, breakpointsActivated, breakpoint, undefined);
        let glyphMarginHoverMessage;
        if (message) {
            if (breakpoint.condition || breakpoint.hitCondition) {
                const modeId = model.getLanguageIdentifier().language;
                glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendCodeblock(modeId, message);
            }
            else {
                glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(message);
            }
        }
        let overviewRulerDecoration = null;
        if (showBreakpointsInOverviewRuler) {
            overviewRulerDecoration = {
                color: 'rgb(124, 40, 49)',
                position: model_1.OverviewRulerLane.Left
            };
        }
        const renderInline = breakpoint.column && (breakpoint.column > model.getLineFirstNonWhitespaceColumn(breakpoint.lineNumber));
        return {
            glyphMarginClassName: `${className}`,
            glyphMarginHoverMessage,
            stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
            beforeContentClassName: renderInline ? `debug-breakpoint-placeholder` : undefined,
            overviewRuler: overviewRulerDecoration
        };
    }
    async function createCandidateDecorations(model, breakpointDecorations, session) {
        const lineNumbers = arrays_1.distinct(breakpointDecorations.map(bpd => bpd.range.startLineNumber));
        const result = [];
        if (session.capabilities.supportsBreakpointLocationsRequest) {
            await Promise.all(lineNumbers.map(async (lineNumber) => {
                try {
                    const positions = await session.breakpointsLocations(model.uri, lineNumber);
                    if (positions.length > 1) {
                        // Do not render candidates if there is only one, since it is already covered by the line breakpoint
                        const firstColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
                        const lastColumn = model.getLineLastNonWhitespaceColumn(lineNumber);
                        positions.forEach(p => {
                            const range = new range_1.Range(p.lineNumber, p.column, p.lineNumber, p.column + 1);
                            if (p.column <= firstColumn || p.column > lastColumn) {
                                // Do not render candidates on the start of the line.
                                return;
                            }
                            const breakpointAtPosition = breakpointDecorations.find(bpd => bpd.range.equalsRange(range));
                            if (breakpointAtPosition && breakpointAtPosition.inlineWidget) {
                                // Space already occupied, do not render candidate.
                                return;
                            }
                            result.push({
                                range,
                                options: {
                                    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
                                    beforeContentClassName: breakpointAtPosition ? undefined : `debug-breakpoint-placeholder`
                                },
                                breakpoint: breakpointAtPosition ? breakpointAtPosition.breakpoint : undefined
                            });
                        });
                    }
                }
                catch (e) {
                    // If there is an error when fetching breakpoint locations just do not render them
                }
            }));
        }
        return result;
    }
    let BreakpointEditorContribution = class BreakpointEditorContribution {
        constructor(editor, debugService, contextMenuService, instantiationService, contextKeyService, dialogService, configurationService, labelService) {
            this.editor = editor;
            this.debugService = debugService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.breakpointHintDecoration = [];
            this.toDispose = [];
            this.ignoreDecorationsChangedEvent = false;
            this.ignoreBreakpointsChangeEvent = false;
            this.breakpointDecorations = [];
            this.candidateDecorations = [];
            this.breakpointWidgetVisible = debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE.bindTo(contextKeyService);
            this.registerListeners();
            this.setDecorationsScheduler = new async_1.RunOnceScheduler(() => this.setDecorations(), 30);
        }
        registerListeners() {
            this.toDispose.push(this.editor.onMouseDown(async (e) => {
                const data = e.target.detail;
                const model = this.editor.getModel();
                if (!e.target.position || !model || e.target.type !== 2 /* GUTTER_GLYPH_MARGIN */ || data.isAfterLines || !this.marginFreeFromNonDebugDecorations(e.target.position.lineNumber)) {
                    return;
                }
                const canSetBreakpoints = this.debugService.getConfigurationManager().canSetBreakpointsIn(model);
                const lineNumber = e.target.position.lineNumber;
                const uri = model.uri;
                if (e.event.rightButton || (env.isMacintosh && e.event.leftButton && e.event.ctrlKey)) {
                    if (!canSetBreakpoints) {
                        return;
                    }
                    const anchor = { x: e.event.posx, y: e.event.posy };
                    const breakpoints = this.debugService.getModel().getBreakpoints({ lineNumber, uri });
                    const actions = this.getContextMenuActions(breakpoints, uri, lineNumber);
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => actions,
                        getActionsContext: () => breakpoints.length ? breakpoints[0] : undefined,
                        onHide: () => lifecycle_1.dispose(actions)
                    });
                }
                else {
                    const breakpoints = this.debugService.getModel().getBreakpoints({ uri, lineNumber });
                    if (breakpoints.length) {
                        // Show the dialog if there is a potential condition to be accidently lost.
                        // Do not show dialog on linux due to electron issue freezing the mouse #50026
                        if (!env.isLinux && breakpoints.some(bp => !!bp.condition || !!bp.logMessage || !!bp.hitCondition)) {
                            const logPoint = breakpoints.every(bp => !!bp.logMessage);
                            const breakpointType = logPoint ? nls.localize('logPoint', "Logpoint") : nls.localize('breakpoint', "Breakpoint");
                            const disable = breakpoints.some(bp => bp.enabled);
                            const enabling = nls.localize('breakpointHasConditionDisabled', "This {0} has a {1} that will get lost on remove. Consider enabling the {0} instead.", breakpointType.toLowerCase(), logPoint ? nls.localize('message', "message") : nls.localize('condition', "condition"));
                            const disabling = nls.localize('breakpointHasConditionEnabled', "This {0} has a {1} that will get lost on remove. Consider disabling the {0} instead.", breakpointType.toLowerCase(), logPoint ? nls.localize('message', "message") : nls.localize('condition', "condition"));
                            const { choice } = await this.dialogService.show(severity_1.default.Info, disable ? disabling : enabling, [
                                nls.localize('removeLogPoint', "Remove {0}", breakpointType),
                                nls.localize('disableLogPoint', "{0} {1}", disable ? nls.localize('disable', "Disable") : nls.localize('enable', "Enable"), breakpointType),
                                nls.localize('cancel', "Cancel")
                            ], { cancelId: 2 });
                            if (choice === 0) {
                                breakpoints.forEach(bp => this.debugService.removeBreakpoints(bp.getId()));
                            }
                            if (choice === 1) {
                                breakpoints.forEach(bp => this.debugService.enableOrDisableBreakpoints(!disable, bp));
                            }
                        }
                        else {
                            breakpoints.forEach(bp => this.debugService.removeBreakpoints(bp.getId()));
                        }
                    }
                    else if (canSetBreakpoints) {
                        this.debugService.addBreakpoints(uri, [{ lineNumber }], `debugEditorGutter`);
                    }
                }
            }));
            if (!(canIUse_1.BrowserFeatures.pointerEvents && browser_1.isSafari)) {
                /**
                 * We disable the hover feature for Safari on iOS as
                 * 1. Browser hover events are handled specially by the system (it treats first click as hover if there is `:hover` css registered). Below hover behavior will confuse users with inconsistent expeirence.
                 * 2. When users click on line numbers, the breakpoint hint displays immediately, however it doesn't create the breakpoint unless users click on the left gutter. On a touch screen, it's hard to click on that small area.
                 */
                this.toDispose.push(this.editor.onMouseMove((e) => {
                    let showBreakpointHintAtLineNumber = -1;
                    const model = this.editor.getModel();
                    if (model && e.target.position && (e.target.type === 2 /* GUTTER_GLYPH_MARGIN */ || e.target.type === 3 /* GUTTER_LINE_NUMBERS */) && this.debugService.getConfigurationManager().canSetBreakpointsIn(model) &&
                        this.marginFreeFromNonDebugDecorations(e.target.position.lineNumber)) {
                        const data = e.target.detail;
                        if (!data.isAfterLines) {
                            showBreakpointHintAtLineNumber = e.target.position.lineNumber;
                        }
                    }
                    this.ensureBreakpointHintDecoration(showBreakpointHintAtLineNumber);
                }));
                this.toDispose.push(this.editor.onMouseLeave(() => {
                    this.ensureBreakpointHintDecoration(-1);
                }));
            }
            this.toDispose.push(this.editor.onDidChangeModel(async () => {
                this.closeBreakpointWidget();
                await this.setDecorations();
            }));
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => {
                if (!this.ignoreBreakpointsChangeEvent && !this.setDecorationsScheduler.isScheduled()) {
                    this.setDecorationsScheduler.schedule();
                }
            }));
            this.toDispose.push(this.debugService.onDidChangeState(() => {
                // We need to update breakpoint decorations when state changes since the top stack frame and breakpoint decoration might change
                if (!this.setDecorationsScheduler.isScheduled()) {
                    this.setDecorationsScheduler.schedule();
                }
            }));
            this.toDispose.push(this.editor.onDidChangeModelDecorations(() => this.onModelDecorationsChanged()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('debug.showBreakpointsInOverviewRuler') || e.affectsConfiguration('debug.showInlineBreakpointCandidates')) {
                    await this.setDecorations();
                }
            }));
        }
        getContextMenuActions(breakpoints, uri, lineNumber, column) {
            const actions = [];
            if (breakpoints.length === 1) {
                const breakpointType = breakpoints[0].logMessage ? nls.localize('logPoint', "Logpoint") : nls.localize('breakpoint', "Breakpoint");
                actions.push(new debugActions_1.RemoveBreakpointAction(debugActions_1.RemoveBreakpointAction.ID, nls.localize('removeBreakpoint', "Remove {0}", breakpointType), this.debugService));
                actions.push(new actions_1.Action('workbench.debug.action.editBreakpointAction', nls.localize('editBreakpoint', "Edit {0}...", breakpointType), undefined, true, () => Promise.resolve(this.showBreakpointWidget(breakpoints[0].lineNumber, breakpoints[0].column))));
                actions.push(new actions_1.Action(`workbench.debug.viewlet.action.toggleBreakpoint`, breakpoints[0].enabled ? nls.localize('disableBreakpoint', "Disable {0}", breakpointType) : nls.localize('enableBreakpoint', "Enable {0}", breakpointType), undefined, true, () => this.debugService.enableOrDisableBreakpoints(!breakpoints[0].enabled, breakpoints[0])));
            }
            else if (breakpoints.length > 1) {
                const sorted = breakpoints.slice().sort((first, second) => (first.column && second.column) ? first.column - second.column : 1);
                actions.push(new contextmenu_1.ContextSubMenu(nls.localize('removeBreakpoints', "Remove Breakpoints"), sorted.map(bp => new actions_1.Action('removeInlineBreakpoint', bp.column ? nls.localize('removeInlineBreakpointOnColumn', "Remove Inline Breakpoint on Column {0}", bp.column) : nls.localize('removeLineBreakpoint', "Remove Line Breakpoint"), undefined, true, () => this.debugService.removeBreakpoints(bp.getId())))));
                actions.push(new contextmenu_1.ContextSubMenu(nls.localize('editBreakpoints', "Edit Breakpoints"), sorted.map(bp => new actions_1.Action('editBreakpoint', bp.column ? nls.localize('editInlineBreakpointOnColumn', "Edit Inline Breakpoint on Column {0}", bp.column) : nls.localize('editLineBrekapoint', "Edit Line Breakpoint"), undefined, true, () => Promise.resolve(this.showBreakpointWidget(bp.lineNumber, bp.column))))));
                actions.push(new contextmenu_1.ContextSubMenu(nls.localize('enableDisableBreakpoints', "Enable/Disable Breakpoints"), sorted.map(bp => new actions_1.Action(bp.enabled ? 'disableColumnBreakpoint' : 'enableColumnBreakpoint', bp.enabled ? (bp.column ? nls.localize('disableInlineColumnBreakpoint', "Disable Inline Breakpoint on Column {0}", bp.column) : nls.localize('disableBreakpointOnLine', "Disable Line Breakpoint"))
                    : (bp.column ? nls.localize('enableBreakpoints', "Enable Inline Breakpoint on Column {0}", bp.column) : nls.localize('enableBreakpointOnLine', "Enable Line Breakpoint")), undefined, true, () => this.debugService.enableOrDisableBreakpoints(!bp.enabled, bp)))));
            }
            else {
                actions.push(new actions_1.Action('addBreakpoint', nls.localize('addBreakpoint', "Add Breakpoint"), undefined, true, () => this.debugService.addBreakpoints(uri, [{ lineNumber, column }], `debugEditorContextMenu`)));
                actions.push(new actions_1.Action('addConditionalBreakpoint', nls.localize('addConditionalBreakpoint', "Add Conditional Breakpoint..."), undefined, true, () => Promise.resolve(this.showBreakpointWidget(lineNumber, column, 0 /* CONDITION */))));
                actions.push(new actions_1.Action('addLogPoint', nls.localize('addLogPoint', "Add Logpoint..."), undefined, true, () => Promise.resolve(this.showBreakpointWidget(lineNumber, column, 2 /* LOG_MESSAGE */))));
            }
            return actions;
        }
        marginFreeFromNonDebugDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    if (options.glyphMarginClassName && options.glyphMarginClassName.indexOf('codicon-') === -1) {
                        return false;
                    }
                }
            }
            return true;
        }
        ensureBreakpointHintDecoration(showBreakpointHintAtLineNumber) {
            const newDecoration = [];
            if (showBreakpointHintAtLineNumber !== -1) {
                newDecoration.push({
                    options: breakpointHelperDecoration,
                    range: {
                        startLineNumber: showBreakpointHintAtLineNumber,
                        startColumn: 1,
                        endLineNumber: showBreakpointHintAtLineNumber,
                        endColumn: 1
                    }
                });
            }
            this.breakpointHintDecoration = this.editor.deltaDecorations(this.breakpointHintDecoration, newDecoration);
        }
        async setDecorations() {
            if (!this.editor.hasModel()) {
                return;
            }
            const activeCodeEditor = this.editor;
            const model = activeCodeEditor.getModel();
            const breakpoints = this.debugService.getModel().getBreakpoints({ uri: model.uri });
            const debugSettings = this.configurationService.getValue('debug');
            const desiredBreakpointDecorations = createBreakpointDecorations(model, breakpoints, this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), debugSettings.showBreakpointsInOverviewRuler);
            try {
                this.ignoreDecorationsChangedEvent = true;
                // Set breakpoint decorations
                const decorationIds = activeCodeEditor.deltaDecorations(this.breakpointDecorations.map(bpd => bpd.decorationId), desiredBreakpointDecorations);
                this.breakpointDecorations.forEach(bpd => {
                    if (bpd.inlineWidget) {
                        bpd.inlineWidget.dispose();
                    }
                });
                this.breakpointDecorations = decorationIds.map((decorationId, index) => {
                    let inlineWidget = undefined;
                    const breakpoint = breakpoints[index];
                    if (desiredBreakpointDecorations[index].options.beforeContentClassName) {
                        const contextMenuActions = () => this.getContextMenuActions([breakpoint], activeCodeEditor.getModel().uri, breakpoint.lineNumber, breakpoint.column);
                        inlineWidget = new InlineBreakpointWidget(activeCodeEditor, decorationId, desiredBreakpointDecorations[index].options.glyphMarginClassName, breakpoint, this.debugService, this.contextMenuService, contextMenuActions);
                    }
                    return {
                        decorationId,
                        breakpoint,
                        range: desiredBreakpointDecorations[index].range,
                        inlineWidget
                    };
                });
            }
            finally {
                this.ignoreDecorationsChangedEvent = false;
            }
            // Set breakpoint candidate decorations
            const session = this.debugService.getViewModel().focusedSession;
            const desiredCandidateDecorations = debugSettings.showInlineBreakpointCandidates && session ? await createCandidateDecorations(this.editor.getModel(), this.breakpointDecorations, session) : [];
            const candidateDecorationIds = this.editor.deltaDecorations(this.candidateDecorations.map(c => c.decorationId), desiredCandidateDecorations);
            this.candidateDecorations.forEach(candidate => {
                candidate.inlineWidget.dispose();
            });
            this.candidateDecorations = candidateDecorationIds.map((decorationId, index) => {
                const candidate = desiredCandidateDecorations[index];
                // Candidate decoration has a breakpoint attached when a breakpoint is already at that location and we did not yet set a decoration there
                // In practice this happens for the first breakpoint that was set on a line
                // We could have also rendered this first decoration as part of desiredBreakpointDecorations however at that moment we have no location information
                const cssClass = candidate.breakpoint ? breakpointsView_1.getBreakpointMessageAndClassName(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), candidate.breakpoint, this.labelService).className : 'codicon-debug-breakpoint-disabled';
                const contextMenuActions = () => this.getContextMenuActions(candidate.breakpoint ? [candidate.breakpoint] : [], activeCodeEditor.getModel().uri, candidate.range.startLineNumber, candidate.range.startColumn);
                const inlineWidget = new InlineBreakpointWidget(activeCodeEditor, decorationId, cssClass, candidate.breakpoint, this.debugService, this.contextMenuService, contextMenuActions);
                return {
                    decorationId,
                    inlineWidget
                };
            });
        }
        async onModelDecorationsChanged() {
            if (this.breakpointDecorations.length === 0 || this.ignoreDecorationsChangedEvent || !this.editor.hasModel()) {
                // I have no decorations
                return;
            }
            let somethingChanged = false;
            const model = this.editor.getModel();
            this.breakpointDecorations.forEach(breakpointDecoration => {
                if (somethingChanged) {
                    return;
                }
                const newBreakpointRange = model.getDecorationRange(breakpointDecoration.decorationId);
                if (newBreakpointRange && (!breakpointDecoration.range.equalsRange(newBreakpointRange))) {
                    somethingChanged = true;
                    breakpointDecoration.range = newBreakpointRange;
                }
            });
            if (!somethingChanged) {
                // nothing to do, my decorations did not change.
                return;
            }
            const data = new Map();
            for (let i = 0, len = this.breakpointDecorations.length; i < len; i++) {
                const breakpointDecoration = this.breakpointDecorations[i];
                const decorationRange = model.getDecorationRange(breakpointDecoration.decorationId);
                // check if the line got deleted.
                if (decorationRange) {
                    // since we know it is collapsed, it cannot grow to multiple lines
                    if (breakpointDecoration.breakpoint) {
                        data.set(breakpointDecoration.breakpoint.getId(), {
                            lineNumber: decorationRange.startLineNumber,
                            column: breakpointDecoration.breakpoint.column ? decorationRange.startColumn : undefined,
                        });
                    }
                }
            }
            try {
                this.ignoreBreakpointsChangeEvent = true;
                await this.debugService.updateBreakpoints(model.uri, data, true);
            }
            finally {
                this.ignoreBreakpointsChangeEvent = false;
            }
        }
        // breakpoint widget
        showBreakpointWidget(lineNumber, column, context) {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
            }
            this.breakpointWidget = this.instantiationService.createInstance(breakpointWidget_1.BreakpointWidget, this.editor, lineNumber, column, context);
            this.breakpointWidget.show({ lineNumber, column: 1 });
            this.breakpointWidgetVisible.set(true);
        }
        closeBreakpointWidget() {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
                this.breakpointWidget = undefined;
                this.breakpointWidgetVisible.reset();
                this.editor.focus();
            }
        }
        dispose() {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
            }
            this.editor.deltaDecorations(this.breakpointDecorations.map(bpd => bpd.decorationId), []);
            lifecycle_1.dispose(this.toDispose);
        }
    };
    BreakpointEditorContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, dialogs_1.IDialogService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, label_1.ILabelService)
    ], BreakpointEditorContribution);
    exports.BreakpointEditorContribution = BreakpointEditorContribution;
    class InlineBreakpointWidget {
        constructor(editor, decorationId, cssClass, breakpoint, debugService, contextMenuService, getContextMenuActions) {
            this.editor = editor;
            this.decorationId = decorationId;
            this.breakpoint = breakpoint;
            this.debugService = debugService;
            this.contextMenuService = contextMenuService;
            this.getContextMenuActions = getContextMenuActions;
            // editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = false;
            this.suppressMouseDown = true;
            this.toDispose = [];
            this.range = this.editor.getModel().getDecorationRange(decorationId);
            this.toDispose.push(this.editor.onDidChangeModelDecorations(() => {
                const model = this.editor.getModel();
                const range = model.getDecorationRange(this.decorationId);
                if (this.range && !this.range.equalsRange(range)) {
                    this.range = range;
                    this.editor.layoutContentWidget(this);
                }
            }));
            this.create(cssClass);
            this.editor.addContentWidget(this);
            this.editor.layoutContentWidget(this);
        }
        create(cssClass) {
            this.domNode = $('.inline-breakpoint-widget');
            this.domNode.classList.add('codicon');
            if (cssClass) {
                this.domNode.classList.add(cssClass);
            }
            this.toDispose.push(dom.addDisposableListener(this.domNode, dom.EventType.CLICK, async (e) => {
                if (this.breakpoint) {
                    await this.debugService.removeBreakpoints(this.breakpoint.getId());
                }
                else {
                    await this.debugService.addBreakpoints(this.editor.getModel().uri, [{ lineNumber: this.range.startLineNumber, column: this.range.startColumn }], 'debugEditorInlineWidget');
                }
            }));
            this.toDispose.push(dom.addDisposableListener(this.domNode, dom.EventType.CONTEXT_MENU, e => {
                const event = new mouseEvent_1.StandardMouseEvent(e);
                const anchor = { x: event.posx, y: event.posy };
                const actions = this.getContextMenuActions();
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    getActions: () => actions,
                    getActionsContext: () => this.breakpoint,
                    onHide: () => lifecycle_1.dispose(actions)
                });
            }));
            const updateSize = () => {
                const lineHeight = this.editor.getOption(51 /* lineHeight */);
                this.domNode.style.height = `${lineHeight}px`;
                this.domNode.style.width = `${Math.ceil(0.8 * lineHeight)}px`;
                this.domNode.style.marginLeft = `4px`;
            };
            updateSize();
            this.toDispose.push(this.editor.onDidChangeConfiguration(c => {
                if (c.hasChanged(38 /* fontSize */) || c.hasChanged(51 /* lineHeight */)) {
                    updateSize();
                }
            }));
        }
        getId() {
            return uuid_1.generateUuid();
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            if (!this.range) {
                return null;
            }
            // Workaround: since the content widget can not be placed before the first column we need to force the left position
            dom.toggleClass(this.domNode, 'line-start', this.range.startColumn === 1);
            return {
                position: { lineNumber: this.range.startLineNumber, column: this.range.startColumn - 1 },
                preference: [0 /* EXACT */]
            };
        }
        dispose() {
            this.editor.removeContentWidget(this);
            lifecycle_1.dispose(this.toDispose);
        }
    }
    __decorate([
        decorators_1.memoize
    ], InlineBreakpointWidget.prototype, "getId", null);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const debugIconBreakpointColor = theme.getColor(debugIconBreakpointForeground);
        if (debugIconBreakpointColor) {
            collector.addRule(`
		.monaco-workbench .codicon-debug-breakpoint,
		.monaco-workbench .codicon-debug-breakpoint-conditional,
		.monaco-workbench .codicon-debug-breakpoint-log,
		.monaco-workbench .codicon-debug-breakpoint-function,
		.monaco-workbench .codicon-debug-breakpoint-data,
		.monaco-workbench .codicon-debug-breakpoint-unsupported,
		.monaco-workbench .codicon-debug-hint:not([class*='codicon-debug-breakpoint']):not([class*='codicon-debug-stackframe']),
		.monaco-workbench .codicon-debug-breakpoint.codicon-debug-stackframe-focused::after,
		.monaco-workbench .codicon-debug-breakpoint.codicon-debug-stackframe::after {
			color: ${debugIconBreakpointColor} !important;
		}
		`);
        }
        const debugIconBreakpointDisabledColor = theme.getColor(debugIconBreakpointDisabledForeground);
        if (debugIconBreakpointDisabledColor) {
            collector.addRule(`
		.monaco-workbench .codicon[class*='-disabled'] {
			color: ${debugIconBreakpointDisabledColor} !important;
		}
		`);
        }
        const debugIconBreakpointUnverifiedColor = theme.getColor(debugIconBreakpointUnverifiedForeground);
        if (debugIconBreakpointUnverifiedColor) {
            collector.addRule(`
		.monaco-workbench .codicon[class*='-unverified'] {
			color: ${debugIconBreakpointUnverifiedColor};
		}
		`);
        }
        const debugIconBreakpointCurrentStackframeForegroundColor = theme.getColor(debugIconBreakpointCurrentStackframeForeground);
        if (debugIconBreakpointCurrentStackframeForegroundColor) {
            collector.addRule(`
		.monaco-workbench .codicon-debug-stackframe,
		.monaco-editor .debug-top-stack-frame-column::before {
			color: ${debugIconBreakpointCurrentStackframeForegroundColor} !important;
		}
		`);
        }
        const debugIconBreakpointStackframeFocusedColor = theme.getColor(debugIconBreakpointStackframeForeground);
        if (debugIconBreakpointStackframeFocusedColor) {
            collector.addRule(`
		.monaco-workbench .codicon-debug-stackframe-focused {
			color: ${debugIconBreakpointStackframeFocusedColor} !important;
		}
		`);
        }
    });
    const debugIconBreakpointForeground = colorRegistry_1.registerColor('debugIcon.breakpointForeground', { dark: '#E51400', light: '#E51400', hc: '#E51400' }, nls.localize('debugIcon.breakpointForeground', 'Icon color for breakpoints.'));
    const debugIconBreakpointDisabledForeground = colorRegistry_1.registerColor('debugIcon.breakpointDisabledForeground', { dark: '#848484', light: '#848484', hc: '#848484' }, nls.localize('debugIcon.breakpointDisabledForeground', 'Icon color for disabled breakpoints.'));
    const debugIconBreakpointUnverifiedForeground = colorRegistry_1.registerColor('debugIcon.breakpointUnverifiedForeground', { dark: '#848484', light: '#848484', hc: '#848484' }, nls.localize('debugIcon.breakpointUnverifiedForeground', 'Icon color for unverified breakpoints.'));
    const debugIconBreakpointCurrentStackframeForeground = colorRegistry_1.registerColor('debugIcon.breakpointCurrentStackframeForeground', { dark: '#FFCC00', light: '#FFCC00', hc: '#FFCC00' }, nls.localize('debugIcon.breakpointCurrentStackframeForeground', 'Icon color for the current breakpoint stack frame.'));
    const debugIconBreakpointStackframeForeground = colorRegistry_1.registerColor('debugIcon.breakpointStackframeForeground', { dark: '#89D185', light: '#89D185', hc: '#89D185' }, nls.localize('debugIcon.breakpointStackframeForeground', 'Icon color for all breakpoint stack frames.'));
});
//# __sourceMappingURL=breakpointEditorContribution.js.map