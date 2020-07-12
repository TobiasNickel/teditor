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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/editor/common/core/position", "vs/editor/contrib/zoneWidget/zoneWidget", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/debug/common/debug", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/services/modelService", "vs/base/common/uri", "vs/editor/common/modes", "vs/editor/contrib/suggest/suggest", "vs/editor/browser/services/codeEditorService", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/serviceCollection", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/editor/common/core/range", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/css!./media/breakpointWidget"], function (require, exports, nls, selectBox_1, lifecycle, dom, position_1, zoneWidget_1, contextView_1, debug_1, styler_1, themeService_1, instantiation_1, contextkey_1, editorExtensions_1, editorContextKeys_1, modelService_1, uri_1, modes_1, suggest_1, codeEditorService_1, colorRegistry_1, serviceCollection_1, codeEditorWidget_1, simpleEditorOptions_1, range_1, errors_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakpointWidget = void 0;
    const $ = dom.$;
    const IPrivateBreakpointWidgetService = instantiation_1.createDecorator('privateBreakpointWidgetService');
    const DECORATION_KEY = 'breakpointwidgetdecoration';
    function isCurlyBracketOpen(input) {
        const model = input.getModel();
        const prevBracket = model.findPrevBracket(input.getPosition());
        if (prevBracket && prevBracket.isOpen) {
            return true;
        }
        return false;
    }
    function createDecorations(theme, placeHolder) {
        const transparentForeground = colorRegistry_1.transparent(colorRegistry_1.editorForeground, 0.4)(theme);
        return [{
                range: {
                    startLineNumber: 0,
                    endLineNumber: 0,
                    startColumn: 0,
                    endColumn: 1
                },
                renderOptions: {
                    after: {
                        contentText: placeHolder,
                        color: transparentForeground ? transparentForeground.toString() : undefined
                    }
                }
            }];
    }
    let BreakpointWidget = class BreakpointWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, lineNumber, column, context, contextViewService, debugService, themeService, contextKeyService, instantiationService, modelService, codeEditorService, _configurationService) {
            super(editor, { showFrame: true, showArrow: false, frameWidth: 1 });
            this.lineNumber = lineNumber;
            this.column = column;
            this.contextViewService = contextViewService;
            this.debugService = debugService;
            this.themeService = themeService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.codeEditorService = codeEditorService;
            this._configurationService = _configurationService;
            this.conditionInput = '';
            this.hitCountInput = '';
            this.logMessageInput = '';
            this.toDispose = [];
            const model = this.editor.getModel();
            if (model) {
                const uri = model.uri;
                const breakpoints = this.debugService.getModel().getBreakpoints({ lineNumber: this.lineNumber, column: this.column, uri });
                this.breakpoint = breakpoints.length ? breakpoints[0] : undefined;
            }
            if (context === undefined) {
                if (this.breakpoint && !this.breakpoint.condition && !this.breakpoint.hitCondition && this.breakpoint.logMessage) {
                    this.context = 2 /* LOG_MESSAGE */;
                }
                else if (this.breakpoint && !this.breakpoint.condition && this.breakpoint.hitCondition) {
                    this.context = 1 /* HIT_COUNT */;
                }
                else {
                    this.context = 0 /* CONDITION */;
                }
            }
            else {
                this.context = context;
            }
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(e => {
                if (this.breakpoint && e && e.removed && e.removed.indexOf(this.breakpoint) >= 0) {
                    this.dispose();
                }
            }));
            this.codeEditorService.registerDecorationType(DECORATION_KEY, {});
            this.create();
        }
        get placeholder() {
            switch (this.context) {
                case 2 /* LOG_MESSAGE */:
                    return nls.localize('breakpointWidgetLogMessagePlaceholder', "Message to log when breakpoint is hit. Expressions within {} are interpolated. 'Enter' to accept, 'esc' to cancel.");
                case 1 /* HIT_COUNT */:
                    return nls.localize('breakpointWidgetHitCountPlaceholder', "Break when hit count condition is met. 'Enter' to accept, 'esc' to cancel.");
                default:
                    return nls.localize('breakpointWidgetExpressionPlaceholder', "Break when expression evaluates to true. 'Enter' to accept, 'esc' to cancel.");
            }
        }
        getInputValue(breakpoint) {
            switch (this.context) {
                case 2 /* LOG_MESSAGE */:
                    return breakpoint && breakpoint.logMessage ? breakpoint.logMessage : this.logMessageInput;
                case 1 /* HIT_COUNT */:
                    return breakpoint && breakpoint.hitCondition ? breakpoint.hitCondition : this.hitCountInput;
                default:
                    return breakpoint && breakpoint.condition ? breakpoint.condition : this.conditionInput;
            }
        }
        rememberInput() {
            const value = this.input.getModel().getValue();
            switch (this.context) {
                case 2 /* LOG_MESSAGE */:
                    this.logMessageInput = value;
                    break;
                case 1 /* HIT_COUNT */:
                    this.hitCountInput = value;
                    break;
                default:
                    this.conditionInput = value;
            }
        }
        show(rangeOrPos) {
            const lineNum = this.input.getModel().getLineCount();
            super.show(rangeOrPos, lineNum + 1);
        }
        fitHeightToContent() {
            const lineNum = this.input.getModel().getLineCount();
            this._relayout(lineNum + 1);
        }
        _fillContainer(container) {
            this.setCssClass('breakpoint-widget');
            const selectBox = new selectBox_1.SelectBox([{ text: nls.localize('expression', "Expression") }, { text: nls.localize('hitCount', "Hit Count") }, { text: nls.localize('logMessage', "Log Message") }], this.context, this.contextViewService, undefined, { ariaLabel: nls.localize('breakpointType', 'Breakpoint Type') });
            this.toDispose.push(styler_1.attachSelectBoxStyler(selectBox, this.themeService));
            this.selectContainer = $('.breakpoint-select-container');
            selectBox.render(dom.append(container, this.selectContainer));
            selectBox.onDidSelect(e => {
                this.rememberInput();
                this.context = e.index;
                const value = this.getInputValue(this.breakpoint);
                this.input.getModel().setValue(value);
                this.input.focus();
            });
            this.inputContainer = $('.inputContainer');
            this.createBreakpointInput(dom.append(container, this.inputContainer));
            this.input.getModel().setValue(this.getInputValue(this.breakpoint));
            this.toDispose.push(this.input.getModel().onDidChangeContent(() => {
                this.fitHeightToContent();
            }));
            this.input.setPosition({ lineNumber: 1, column: this.input.getModel().getLineMaxColumn(1) });
            // Due to an electron bug we have to do the timeout, otherwise we do not get focus
            setTimeout(() => this.input.focus(), 150);
        }
        _doLayout(heightInPixel, widthInPixel) {
            this.heightInPx = heightInPixel;
            this.input.layout({ height: heightInPixel, width: widthInPixel - 113 });
            this.centerInputVertically();
        }
        createBreakpointInput(container) {
            const scopedContextKeyService = this.contextKeyService.createScoped(container);
            this.toDispose.push(scopedContextKeyService);
            const scopedInstatiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService], [IPrivateBreakpointWidgetService, this]));
            const options = this.createEditorOptions();
            const codeEditorWidgetOptions = simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions();
            this.input = scopedInstatiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, options, codeEditorWidgetOptions);
            debug_1.CONTEXT_IN_BREAKPOINT_WIDGET.bindTo(scopedContextKeyService).set(true);
            const model = this.modelService.createModel('', null, uri_1.URI.parse(`${debug_1.DEBUG_SCHEME}:${this.editor.getId()}:breakpointinput`), true);
            this.input.setModel(model);
            this.toDispose.push(model);
            const setDecorations = () => {
                const value = this.input.getModel().getValue();
                const decorations = !!value ? [] : createDecorations(this.themeService.getColorTheme(), this.placeholder);
                this.input.setDecorations(DECORATION_KEY, decorations);
            };
            this.input.getModel().onDidChangeContent(() => setDecorations());
            this.themeService.onDidColorThemeChange(() => setDecorations());
            this.toDispose.push(modes_1.CompletionProviderRegistry.register({ scheme: debug_1.DEBUG_SCHEME, hasAccessToAllModels: true }, {
                provideCompletionItems: (model, position, _context, token) => {
                    let suggestionsPromise;
                    const underlyingModel = this.editor.getModel();
                    if (underlyingModel && (this.context === 0 /* CONDITION */ || (this.context === 2 /* LOG_MESSAGE */ && isCurlyBracketOpen(this.input)))) {
                        suggestionsPromise = suggest_1.provideSuggestionItems(underlyingModel, new position_1.Position(this.lineNumber, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* Snippet */)), _context, token).then(suggestions => {
                            let overwriteBefore = 0;
                            if (this.context === 0 /* CONDITION */) {
                                overwriteBefore = position.column - 1;
                            }
                            else {
                                // Inside the currly brackets, need to count how many useful characters are behind the position so they would all be taken into account
                                const value = this.input.getModel().getValue();
                                while ((position.column - 2 - overwriteBefore >= 0) && value[position.column - 2 - overwriteBefore] !== '{' && value[position.column - 2 - overwriteBefore] !== ' ') {
                                    overwriteBefore++;
                                }
                            }
                            return {
                                suggestions: suggestions.items.map(s => {
                                    s.completion.range = range_1.Range.fromPositions(position.delta(0, -overwriteBefore), position);
                                    return s.completion;
                                })
                            };
                        });
                    }
                    else {
                        suggestionsPromise = Promise.resolve({ suggestions: [] });
                    }
                    return suggestionsPromise;
                }
            }));
            this.toDispose.push(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.fontSize') || e.affectsConfiguration('editor.lineHeight')) {
                    this.input.updateOptions(this.createEditorOptions());
                    this.centerInputVertically();
                }
            }));
        }
        createEditorOptions() {
            const editorConfig = this._configurationService.getValue('editor');
            const options = simpleEditorOptions_1.getSimpleEditorOptions();
            options.fontSize = editorConfig.fontSize;
            return options;
        }
        centerInputVertically() {
            if (this.container && typeof this.heightInPx === 'number') {
                const lineHeight = this.input.getOption(51 /* lineHeight */);
                const lineNum = this.input.getModel().getLineCount();
                const newTopMargin = (this.heightInPx - lineNum * lineHeight) / 2;
                this.inputContainer.style.marginTop = newTopMargin + 'px';
            }
        }
        close(success) {
            if (success) {
                // if there is already a breakpoint on this location - remove it.
                let condition = this.breakpoint && this.breakpoint.condition;
                let hitCondition = this.breakpoint && this.breakpoint.hitCondition;
                let logMessage = this.breakpoint && this.breakpoint.logMessage;
                this.rememberInput();
                if (this.conditionInput || this.context === 0 /* CONDITION */) {
                    condition = this.conditionInput;
                }
                if (this.hitCountInput || this.context === 1 /* HIT_COUNT */) {
                    hitCondition = this.hitCountInput;
                }
                if (this.logMessageInput || this.context === 2 /* LOG_MESSAGE */) {
                    logMessage = this.logMessageInput;
                }
                if (this.breakpoint) {
                    const data = new Map();
                    data.set(this.breakpoint.getId(), {
                        condition,
                        hitCondition,
                        logMessage
                    });
                    this.debugService.updateBreakpoints(this.breakpoint.uri, data, false).then(undefined, errors_1.onUnexpectedError);
                }
                else {
                    const model = this.editor.getModel();
                    if (model) {
                        this.debugService.addBreakpoints(model.uri, [{
                                lineNumber: this.lineNumber,
                                column: this.column,
                                enabled: true,
                                condition,
                                hitCondition,
                                logMessage
                            }], `breakpointWidget`);
                    }
                }
            }
            this.dispose();
        }
        dispose() {
            super.dispose();
            this.input.dispose();
            lifecycle.dispose(this.toDispose);
            setTimeout(() => this.editor.focus(), 0);
        }
    };
    BreakpointWidget = __decorate([
        __param(4, contextView_1.IContextViewService),
        __param(5, debug_1.IDebugService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, modelService_1.IModelService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, configuration_1.IConfigurationService)
    ], BreakpointWidget);
    exports.BreakpointWidget = BreakpointWidget;
    class AcceptBreakpointWidgetInputAction extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'breakpointWidget.action.acceptInput',
                precondition: debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE,
                kbOpts: {
                    kbExpr: debug_1.CONTEXT_IN_BREAKPOINT_WIDGET,
                    primary: 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            accessor.get(IPrivateBreakpointWidgetService).close(true);
        }
    }
    class CloseBreakpointWidgetCommand extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'closeBreakpointWidget',
                precondition: debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 9 /* Escape */,
                    secondary: [1024 /* Shift */ | 9 /* Escape */],
                    weight: 100 /* EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor, args) {
            const debugContribution = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID);
            if (debugContribution) {
                // if focus is in outer editor we need to use the debug contribution to close
                return debugContribution.closeBreakpointWidget();
            }
            accessor.get(IPrivateBreakpointWidgetService).close(false);
        }
    }
    editorExtensions_1.registerEditorCommand(new AcceptBreakpointWidgetInputAction());
    editorExtensions_1.registerEditorCommand(new CloseBreakpointWidgetCommand());
});
//# __sourceMappingURL=breakpointWidget.js.map