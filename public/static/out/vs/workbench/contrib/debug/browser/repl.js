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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/actions", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/editor/contrib/suggest/suggestController", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/common/services/modelService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/editor/browser/editorBrowser", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/contrib/debug/common/debug", "vs/base/common/history", "vs/platform/browser/contextScopedHistoryWidget", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/platform/theme/common/colorRegistry", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/editor/common/modes", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/debug/browser/linkDetector", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/contextview/browser/contextView", "vs/base/common/strings", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/editor/common/services/textResourceConfigurationService", "vs/base/common/async", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/debug/browser/replViewer", "vs/nls", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/keybinding/common/keybinding", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/workbench/contrib/debug/common/replModel", "vs/platform/telemetry/common/telemetry", "vs/editor/common/config/editorOptions", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/css!./media/repl"], function (require, exports, uri_1, actions_1, dom, aria, suggestController_1, range_1, editorExtensions_1, modelService_1, serviceCollection_1, contextkey_1, instantiation_1, storage_1, themeService_1, editorBrowser_1, decorators_1, lifecycle_1, editorContextKeys_1, codeEditorWidget_1, debug_1, history_1, contextScopedHistoryWidget_1, simpleEditorOptions_1, colorRegistry_1, codeEditorService_1, debugActionViewItems_1, modes_1, arrays_1, editorService_1, linkDetector_1, actionbar_1, contextView_1, strings_1, listService_1, configuration_1, textResourceConfigurationService_1, async_1, clipboardService_1, replViewer_1, nls_1, viewPaneContainer_1, keybinding_1, views_1, opener_1, replModel_1, telemetry_1, editorOptions_1, mouseCursor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearReplAction = exports.Repl = void 0;
    const $ = dom.$;
    const HISTORY_STORAGE_KEY = 'debug.repl.history';
    const DECORATION_KEY = 'replinputdecoration';
    function revealLastElement(tree) {
        tree.scrollTop = tree.scrollHeight - tree.renderHeight;
    }
    const sessionsToIgnore = new Set();
    let Repl = class Repl extends viewPaneContainer_1.ViewPane {
        constructor(options, debugService, instantiationService, storageService, themeService, modelService, contextKeyService, codeEditorService, viewDescriptorService, contextMenuService, configurationService, textResourcePropertiesService, clipboardService, editorService, keybindingService, openerService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.storageService = storageService;
            this.modelService = modelService;
            this.textResourcePropertiesService = textResourcePropertiesService;
            this.clipboardService = clipboardService;
            this.editorService = editorService;
            this.replInputLineCount = 1;
            this.modelChangeListener = lifecycle_1.Disposable.None;
            this.history = new history_1.HistoryNavigator(JSON.parse(this.storageService.get(HISTORY_STORAGE_KEY, 1 /* WORKSPACE */, '[]')), 50);
            codeEditorService.registerDecorationType(DECORATION_KEY, {});
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.debugService.getViewModel().onDidFocusSession(async (session) => {
                if (session) {
                    sessionsToIgnore.delete(session);
                    if (this.completionItemProvider) {
                        this.completionItemProvider.dispose();
                    }
                    if (session.capabilities.supportsCompletionsRequest) {
                        this.completionItemProvider = modes_1.CompletionProviderRegistry.register({ scheme: debug_1.DEBUG_SCHEME, pattern: '**/replinput', hasAccessToAllModels: true }, {
                            triggerCharacters: session.capabilities.completionTriggerCharacters || ['.'],
                            provideCompletionItems: async (_, position, _context, token) => {
                                // Disable history navigation because up and down are used to navigate through the suggest widget
                                this.historyNavigationEnablement.set(false);
                                const model = this.replInput.getModel();
                                if (model) {
                                    const word = model.getWordAtPosition(position);
                                    const overwriteBefore = word ? word.word.length : 0;
                                    const text = model.getValue();
                                    const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                                    const frameId = focusedStackFrame ? focusedStackFrame.frameId : undefined;
                                    const response = await session.completions(frameId, text, position, overwriteBefore, token);
                                    const suggestions = [];
                                    const computeRange = (length) => range_1.Range.fromPositions(position.delta(0, -length), position);
                                    if (response && response.body && response.body.targets) {
                                        response.body.targets.forEach(item => {
                                            if (item && item.label) {
                                                let insertTextRules = undefined;
                                                let insertText = item.text || item.label;
                                                if (typeof item.selectionStart === 'number') {
                                                    // If a debug completion item sets a selection we need to use snippets to make sure the selection is selected #90974
                                                    insertTextRules = 4 /* InsertAsSnippet */;
                                                    const selectionLength = typeof item.selectionLength === 'number' ? item.selectionLength : 0;
                                                    const placeholder = selectionLength > 0 ? '${1:' + insertText.substr(item.selectionStart, selectionLength) + '}$0' : '$0';
                                                    insertText = insertText.substr(0, item.selectionStart) + placeholder + insertText.substr(item.selectionStart + selectionLength);
                                                }
                                                suggestions.push({
                                                    label: item.label,
                                                    insertText,
                                                    kind: modes_1.completionKindFromString(item.type || 'property'),
                                                    filterText: (item.start && item.length) ? text.substr(item.start, item.length).concat(item.label) : undefined,
                                                    range: computeRange(item.length || overwriteBefore),
                                                    sortText: item.sortText,
                                                    insertTextRules
                                                });
                                            }
                                        });
                                    }
                                    if (this.configurationService.getValue('debug').console.historySuggestions) {
                                        const history = this.history.getHistory();
                                        history.forEach(h => suggestions.push({
                                            label: h,
                                            insertText: h,
                                            kind: 18 /* Text */,
                                            range: computeRange(h.length),
                                            sortText: 'ZZZ'
                                        }));
                                    }
                                    return { suggestions };
                                }
                                return Promise.resolve({ suggestions: [] });
                            }
                        });
                    }
                }
                await this.selectSession();
            }));
            this._register(this.debugService.onWillNewSession(async (newSession) => {
                // Need to listen to output events for sessions which are not yet fully initialised
                const input = this.tree.getInput();
                if (!input || input.state === 0 /* Inactive */) {
                    await this.selectSession(newSession);
                }
                this.updateActions();
            }));
            this._register(this.themeService.onDidColorThemeChange(() => {
                this.refreshReplElements(false);
                if (this.isVisible()) {
                    this.updateInputDecoration();
                }
            }));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (!visible) {
                    lifecycle_1.dispose(this.model);
                }
                else {
                    this.model = this.modelService.getModel(Repl.URI) || this.modelService.createModel('', null, Repl.URI, true);
                    this.setMode();
                    this.replInput.setModel(this.model);
                    this.updateInputDecoration();
                    this.refreshReplElements(true);
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.console.lineHeight') || e.affectsConfiguration('debug.console.fontSize') || e.affectsConfiguration('debug.console.fontFamily')) {
                    this.onDidStyleChange();
                }
            }));
            this._register(this.themeService.onDidColorThemeChange(e => {
                this.onDidStyleChange();
            }));
            this._register(this.viewDescriptorService.onDidChangeLocation(e => {
                if (e.views.some(v => v.id === this.id)) {
                    this.onDidStyleChange();
                }
            }));
            this._register(this.editorService.onDidActiveEditorChange(() => {
                this.setMode();
            }));
        }
        get isReadonly() {
            // Do not allow to edit inactive sessions
            const session = this.tree.getInput();
            if (session && session.state !== 0 /* Inactive */) {
                return false;
            }
            return true;
        }
        showPreviousValue() {
            this.navigateHistory(true);
        }
        showNextValue() {
            this.navigateHistory(false);
        }
        focusRepl() {
            this.tree.domFocus();
        }
        setMode() {
            if (!this.isVisible()) {
                return;
            }
            const activeEditorControl = this.editorService.activeTextEditorControl;
            if (editorBrowser_1.isCodeEditor(activeEditorControl)) {
                this.modelChangeListener.dispose();
                this.modelChangeListener = activeEditorControl.onDidChangeModelLanguage(() => this.setMode());
                if (this.model && activeEditorControl.hasModel()) {
                    this.model.setMode(activeEditorControl.getModel().getLanguageIdentifier());
                }
            }
        }
        onDidStyleChange() {
            if (this.styleElement) {
                const debugConsole = this.configurationService.getValue('debug').console;
                const fontSize = debugConsole.fontSize;
                const fontFamily = debugConsole.fontFamily === 'default' ? 'var(--monaco-monospace-font)' : debugConsole.fontFamily;
                const lineHeight = debugConsole.lineHeight ? `${debugConsole.lineHeight}px` : '1.4em';
                const backgroundColor = this.themeService.getColorTheme().getColor(this.getBackgroundColor());
                this.replInput.updateOptions({
                    fontSize,
                    lineHeight: debugConsole.lineHeight,
                    fontFamily: debugConsole.fontFamily === 'default' ? editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily : debugConsole.fontFamily
                });
                const replInputLineHeight = this.replInput.getOption(51 /* lineHeight */);
                // Set the font size, font family, line height and align the twistie to be centered, and input theme color
                this.styleElement.innerHTML = `
				.repl .repl-tree .expression {
					font-size: ${fontSize}px;
					font-family: ${fontFamily};
				}

				.repl .repl-tree .expression {
					line-height: ${lineHeight};
				}

				.repl .repl-tree .monaco-tl-twistie {
					background-position-y: calc(100% - ${fontSize * 1.4 / 2 - 8}px);
				}

				.repl .repl-input-wrapper .repl-input-chevron {
					line-height: ${replInputLineHeight}px
				}

				.repl .repl-input-wrapper .monaco-editor .lines-content {
					background-color: ${backgroundColor};
				}
			`;
                this.tree.rerender();
                if (this.dimension) {
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }
        }
        navigateHistory(previous) {
            const historyInput = previous ? this.history.previous() : this.history.next();
            if (historyInput) {
                this.replInput.setValue(historyInput);
                aria.status(historyInput);
                // always leave cursor at the end.
                this.replInput.setPosition({ lineNumber: 1, column: historyInput.length + 1 });
                this.historyNavigationEnablement.set(true);
            }
        }
        async selectSession(session) {
            const treeInput = this.tree.getInput();
            if (!session) {
                const focusedSession = this.debugService.getViewModel().focusedSession;
                // If there is a focusedSession focus on that one, otherwise just show any other not ignored session
                if (focusedSession) {
                    session = focusedSession;
                }
                else if (!treeInput || sessionsToIgnore.has(treeInput)) {
                    session = arrays_1.first(this.debugService.getModel().getSessions(true), s => !sessionsToIgnore.has(s)) || undefined;
                }
            }
            if (session) {
                if (this.replElementsChangeListener) {
                    this.replElementsChangeListener.dispose();
                }
                this.replElementsChangeListener = session.onDidChangeReplElements(() => {
                    this.refreshReplElements(session.getReplElements().length === 0);
                });
                if (this.tree && treeInput !== session) {
                    await this.tree.setInput(session);
                    revealLastElement(this.tree);
                }
            }
            this.replInput.updateOptions({ readOnly: this.isReadonly });
            this.updateInputDecoration();
        }
        async clearRepl() {
            const session = this.tree.getInput();
            if (session) {
                session.removeReplExpressions();
                if (session.state === 0 /* Inactive */) {
                    // Ignore inactive sessions which got cleared - so they are not shown any more
                    sessionsToIgnore.add(session);
                    await this.selectSession();
                    this.updateActions();
                }
            }
            this.replInput.focus();
        }
        acceptReplInput() {
            const session = this.tree.getInput();
            if (session) {
                session.addReplExpression(this.debugService.getViewModel().focusedStackFrame, this.replInput.getValue());
                revealLastElement(this.tree);
                this.history.add(this.replInput.getValue());
                this.replInput.setValue('');
                const shouldRelayout = this.replInputLineCount > 1;
                this.replInputLineCount = 1;
                if (shouldRelayout) {
                    // Trigger a layout to shrink a potential multi line input
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }
        }
        getVisibleContent() {
            let text = '';
            if (this.model) {
                const lineDelimiter = this.textResourcePropertiesService.getEOL(this.model.uri);
                const traverseAndAppend = (node) => {
                    node.children.forEach(child => {
                        text += child.element.toString().trimRight() + lineDelimiter;
                        if (!child.collapsed && child.children.length) {
                            traverseAndAppend(child);
                        }
                    });
                };
                traverseAndAppend(this.tree.getNode());
            }
            return strings_1.removeAnsiEscapeCodes(text);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.dimension = new dom.Dimension(width, height);
            const replInputHeight = Math.min(this.replInput.getContentHeight(), height);
            if (this.tree) {
                const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
                const treeHeight = height - replInputHeight;
                this.tree.getHTMLElement().style.height = `${treeHeight}px`;
                this.tree.layout(treeHeight, width);
                if (lastElementVisible) {
                    revealLastElement(this.tree);
                }
            }
            this.replInputContainer.style.height = `${replInputHeight}px`;
            this.replInput.layout({ width: width - 30, height: replInputHeight });
        }
        focus() {
            setTimeout(() => this.replInput.focus(), 0);
        }
        getActionViewItem(action) {
            if (action.id === SelectReplAction.ID) {
                return this.instantiationService.createInstance(SelectReplActionViewItem, this.selectReplAction);
            }
            return undefined;
        }
        getActions() {
            const result = [];
            if (this.debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl() && !sessionsToIgnore.has(s)).length > 1) {
                result.push(this.selectReplAction);
            }
            result.push(this.clearReplAction);
            result.forEach(a => this._register(a));
            return result;
        }
        // --- Cached locals
        get selectReplAction() {
            return this.instantiationService.createInstance(SelectReplAction, SelectReplAction.ID, SelectReplAction.LABEL);
        }
        get clearReplAction() {
            return this.instantiationService.createInstance(ClearReplAction, ClearReplAction.ID, ClearReplAction.LABEL);
        }
        get refreshScheduler() {
            const autoExpanded = new Set();
            return new async_1.RunOnceScheduler(async () => {
                if (!this.tree.getInput()) {
                    return;
                }
                const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
                await this.tree.updateChildren();
                const session = this.tree.getInput();
                if (session) {
                    // Automatically expand repl group elements when specified
                    const autoExpandElements = async (elements) => {
                        for (let element of elements) {
                            if (element instanceof replModel_1.ReplGroup) {
                                if (element.autoExpand && !autoExpanded.has(element.getId())) {
                                    autoExpanded.add(element.getId());
                                    await this.tree.expand(element);
                                }
                                if (!this.tree.isCollapsed(element)) {
                                    // Repl groups can have children which are repl groups thus we might need to expand those as well
                                    await autoExpandElements(element.getChildren());
                                }
                            }
                        }
                    };
                    await autoExpandElements(session.getReplElements());
                }
                if (lastElementVisible) {
                    // Only scroll if we were scrolled all the way down before tree refreshed #10486
                    revealLastElement(this.tree);
                }
            }, Repl.REFRESH_DELAY);
        }
        // --- Creation
        renderBody(parent) {
            super.renderBody(parent);
            this.container = dom.append(parent, $('.repl'));
            const treeContainer = dom.append(this.container, $(`.repl-tree.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            this.createReplInput(this.container);
            this.replDelegate = new replViewer_1.ReplDelegate(this.configurationService);
            const wordWrap = this.configurationService.getValue('debug').console.wordWrap;
            dom.toggleClass(treeContainer, 'word-wrap', wordWrap);
            const linkDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'DebugRepl', treeContainer, this.replDelegate, [
                this.instantiationService.createInstance(replViewer_1.ReplVariablesRenderer, linkDetector),
                this.instantiationService.createInstance(replViewer_1.ReplSimpleElementsRenderer, linkDetector),
                new replViewer_1.ReplEvaluationInputsRenderer(),
                new replViewer_1.ReplGroupRenderer(),
                new replViewer_1.ReplEvaluationResultsRenderer(linkDetector),
                new replViewer_1.ReplRawObjectsRenderer(linkDetector),
            ], 
            // https://github.com/microsoft/TypeScript/issues/32526
            new replViewer_1.ReplDataSource(), {
                accessibilityProvider: new replViewer_1.ReplAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                mouseSupport: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                horizontalScrolling: !wordWrap,
                setRowLineHeight: false,
                supportDynamicHeights: wordWrap,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            let lastSelectedString;
            this._register(this.tree.onMouseClick(() => {
                const selection = window.getSelection();
                if (!selection || selection.type !== 'Range' || lastSelectedString === selection.toString()) {
                    // only focus the input if the user is not currently selecting.
                    this.replInput.focus();
                }
                lastSelectedString = selection ? selection.toString() : '';
            }));
            // Make sure to select the session if debugging is already active
            this.selectSession();
            this.styleElement = dom.createStyleSheet(this.container);
            this.onDidStyleChange();
        }
        createReplInput(container) {
            this.replInputContainer = dom.append(container, $('.repl-input-wrapper'));
            dom.append(this.replInputContainer, $('.repl-input-chevron.codicon.codicon-chevron-right'));
            const { scopedContextKeyService, historyNavigationEnablement } = contextScopedHistoryWidget_1.createAndBindHistoryNavigationWidgetScopedContextKeyService(this.contextKeyService, { target: this.replInputContainer, historyNavigator: this });
            this.historyNavigationEnablement = historyNavigationEnablement;
            this._register(scopedContextKeyService);
            debug_1.CONTEXT_IN_DEBUG_REPL.bindTo(scopedContextKeyService).set(true);
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            const options = simpleEditorOptions_1.getSimpleEditorOptions();
            options.readOnly = true;
            options.ariaLabel = nls_1.localize('debugConsole', "Debug Console");
            this.replInput = this.scopedInstantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.replInputContainer, options, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions());
            this._register(this.replInput.onDidChangeModelContent(() => {
                const model = this.replInput.getModel();
                this.historyNavigationEnablement.set(!!model && model.getValue() === '');
                const lineCount = model ? Math.min(10, model.getLineCount()) : 1;
                if (lineCount !== this.replInputLineCount) {
                    this.replInputLineCount = lineCount;
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }));
            // We add the input decoration only when the focus is in the input #61126
            this._register(this.replInput.onDidFocusEditorText(() => this.updateInputDecoration()));
            this._register(this.replInput.onDidBlurEditorText(() => this.updateInputDecoration()));
            this._register(dom.addStandardDisposableListener(this.replInputContainer, dom.EventType.FOCUS, () => dom.addClass(this.replInputContainer, 'synthetic-focus')));
            this._register(dom.addStandardDisposableListener(this.replInputContainer, dom.EventType.BLUR, () => dom.removeClass(this.replInputContainer, 'synthetic-focus')));
        }
        onContextMenu(e) {
            const actions = [];
            actions.push(new actions_1.Action('debug.replCopy', nls_1.localize('copy', "Copy"), undefined, true, async () => {
                const nativeSelection = window.getSelection();
                if (nativeSelection) {
                    await this.clipboardService.writeText(nativeSelection.toString());
                }
                return Promise.resolve();
            }));
            actions.push(new actions_1.Action('workbench.debug.action.copyAll', nls_1.localize('copyAll', "Copy All"), undefined, true, async () => {
                await this.clipboardService.writeText(this.getVisibleContent());
                return Promise.resolve();
            }));
            actions.push(new actions_1.Action('debug.replPaste', nls_1.localize('paste', "Paste"), undefined, true, async () => {
                const clipboardText = await this.clipboardService.readText();
                if (clipboardText) {
                    this.replInput.setValue(this.replInput.getValue().concat(clipboardText));
                }
            }));
            actions.push(new actionbar_1.Separator());
            actions.push(new actions_1.Action('debug.collapseRepl', nls_1.localize('collapse', "Collapse All"), undefined, true, () => {
                this.tree.collapseAll();
                this.replInput.focus();
                return Promise.resolve();
            }));
            actions.push(new actionbar_1.Separator());
            actions.push(this.clearReplAction);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => e.element,
                onHide: () => lifecycle_1.dispose(actions)
            });
        }
        // --- Update
        refreshReplElements(noDelay) {
            if (this.tree && this.isVisible()) {
                if (this.refreshScheduler.isScheduled()) {
                    return;
                }
                this.refreshScheduler.schedule(noDelay ? 0 : undefined);
            }
        }
        updateInputDecoration() {
            if (!this.replInput) {
                return;
            }
            const decorations = [];
            if (this.isReadonly && this.replInput.hasTextFocus() && !this.replInput.getValue()) {
                const transparentForeground = colorRegistry_1.transparent(colorRegistry_1.editorForeground, 0.4)(this.themeService.getColorTheme());
                decorations.push({
                    range: {
                        startLineNumber: 0,
                        endLineNumber: 0,
                        startColumn: 0,
                        endColumn: 1
                    },
                    renderOptions: {
                        after: {
                            contentText: nls_1.localize('startDebugFirst', "Please start a debug session to evaluate expressions"),
                            color: transparentForeground ? transparentForeground.toString() : undefined
                        }
                    }
                });
            }
            this.replInput.setDecorations(DECORATION_KEY, decorations);
        }
        saveState() {
            const replHistory = this.history.getHistory();
            if (replHistory.length) {
                this.storageService.store(HISTORY_STORAGE_KEY, JSON.stringify(replHistory), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(HISTORY_STORAGE_KEY, 1 /* WORKSPACE */);
            }
            super.saveState();
        }
        dispose() {
            this.replInput.dispose();
            if (this.replElementsChangeListener) {
                this.replElementsChangeListener.dispose();
            }
            this.refreshScheduler.dispose();
            this.modelChangeListener.dispose();
            super.dispose();
        }
    };
    Repl.REFRESH_DELAY = 100; // delay in ms to refresh the repl for new elements to show
    Repl.URI = uri_1.URI.parse(`${debug_1.DEBUG_SCHEME}:replinput`);
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "selectReplAction", null);
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "clearReplAction", null);
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "refreshScheduler", null);
    Repl = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, themeService_1.IThemeService),
        __param(5, modelService_1.IModelService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, codeEditorService_1.ICodeEditorService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, textResourceConfigurationService_1.ITextResourcePropertiesService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, editorService_1.IEditorService),
        __param(14, keybinding_1.IKeybindingService),
        __param(15, opener_1.IOpenerService),
        __param(16, telemetry_1.ITelemetryService)
    ], Repl);
    exports.Repl = Repl;
    // Repl actions and commands
    class AcceptReplInputAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.acceptInput',
                label: nls_1.localize({ key: 'actions.repl.acceptInput', comment: ['Apply input from the debug console input box'] }, "REPL Accept Input"),
                alias: 'REPL Accept Input',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            suggestController_1.SuggestController.get(editor).acceptSelectedSuggestion(false, true);
            const repl = getReplView(accessor.get(views_1.IViewsService));
            repl === null || repl === void 0 ? void 0 : repl.acceptReplInput();
        }
    }
    class FilterReplAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.filter',
                label: nls_1.localize('repl.action.filter', "REPL Focus Content to Filter"),
                alias: 'REPL Filter',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            suggestController_1.SuggestController.get(editor).acceptSelectedSuggestion(false, true);
            const repl = getReplView(accessor.get(views_1.IViewsService));
            repl === null || repl === void 0 ? void 0 : repl.focusRepl();
        }
    }
    class ReplCopyAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.copyAll',
                label: nls_1.localize('actions.repl.copyAll', "Debug: Console Copy All"),
                alias: 'Debug Console Copy All',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
            });
        }
        run(accessor, editor) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const repl = getReplView(accessor.get(views_1.IViewsService));
            if (repl) {
                return clipboardService.writeText(repl.getVisibleContent());
            }
        }
    }
    editorExtensions_1.registerEditorAction(AcceptReplInputAction);
    editorExtensions_1.registerEditorAction(ReplCopyAllAction);
    editorExtensions_1.registerEditorAction(FilterReplAction);
    class SelectReplActionViewItem extends debugActionViewItems_1.FocusSessionActionViewItem {
        getSessions() {
            return this.debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl() && !sessionsToIgnore.has(s));
        }
        mapFocusedSessionToSelected(focusedSession) {
            while (focusedSession.parentSession && !focusedSession.hasSeparateRepl()) {
                focusedSession = focusedSession.parentSession;
            }
            return focusedSession;
        }
    }
    let SelectReplAction = class SelectReplAction extends actions_1.Action {
        constructor(id, label, debugService, viewsService) {
            super(id, label);
            this.debugService = debugService;
            this.viewsService = viewsService;
        }
        async run(session) {
            // If session is already the focused session we need to manualy update the tree since view model will not send a focused change event
            if (session && session.state !== 0 /* Inactive */ && session !== this.debugService.getViewModel().focusedSession) {
                await this.debugService.focusStackFrame(undefined, undefined, session, true);
            }
            else {
                const repl = getReplView(this.viewsService);
                if (repl) {
                    await repl.selectSession(session);
                }
            }
        }
    };
    SelectReplAction.ID = 'workbench.action.debug.selectRepl';
    SelectReplAction.LABEL = nls_1.localize('selectRepl', "Select Debug Console");
    SelectReplAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, views_1.IViewsService)
    ], SelectReplAction);
    let ClearReplAction = class ClearReplAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label, 'debug-action codicon-clear-all');
            this.viewsService = viewsService;
        }
        async run() {
            const view = await this.viewsService.openView(debug_1.REPL_VIEW_ID);
            await view.clearRepl();
            aria.status(nls_1.localize('debugConsoleCleared', "Debug console was cleared"));
        }
    };
    ClearReplAction.ID = 'workbench.debug.panel.action.clearReplAction';
    ClearReplAction.LABEL = nls_1.localize('clearRepl', "Clear Console");
    ClearReplAction = __decorate([
        __param(2, views_1.IViewsService)
    ], ClearReplAction);
    exports.ClearReplAction = ClearReplAction;
    function getReplView(viewsService) {
        var _a;
        return (_a = viewsService.getActiveViewWithId(debug_1.REPL_VIEW_ID)) !== null && _a !== void 0 ? _a : undefined;
    }
});
//# __sourceMappingURL=repl.js.map