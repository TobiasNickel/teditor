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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/common/actions", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/label/common/label", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/list/browser/listService", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/filters", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/contrib/debug/browser/debugCommands", "vs/platform/commands/common/commands", "vs/workbench/browser/viewlet", "vs/workbench/common/views", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/styler", "vs/platform/notification/common/notification", "vs/base/common/strings", "vs/base/common/path"], function (require, exports, nls, async_1, dom, debug_1, debugModel_1, contextView_1, instantiation_1, actions_1, keybinding_1, baseDebugView_1, actions_2, editorService_1, configuration_1, contextkey_1, viewPaneContainer_1, label_1, menuEntryActionViewItem_1, listService_1, highlightedLabel_1, filters_1, event_1, lifecycle_1, actionbar_1, debugUtils_1, debugCommands_1, commands_1, viewlet_1, views_1, colorRegistry_1, themeService_1, opener_1, telemetry_1, styler_1, notification_1, strings_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallStackView = exports.getSpecificSourceName = exports.getContextForContributedActions = exports.getContext = void 0;
    const $ = dom.$;
    function getContext(element) {
        return element instanceof debugModel_1.StackFrame ? {
            sessionId: element.thread.session.getId(),
            threadId: element.thread.getId(),
            frameId: element.getId()
        } : element instanceof debugModel_1.Thread ? {
            sessionId: element.session.getId(),
            threadId: element.getId()
        } : isDebugSession(element) ? {
            sessionId: element.getId()
        } : undefined;
    }
    exports.getContext = getContext;
    // Extensions depend on this context, should not be changed even though it is not fully deterministic
    function getContextForContributedActions(element) {
        if (element instanceof debugModel_1.StackFrame) {
            if (element.source.inMemory) {
                return element.source.raw.path || element.source.reference || element.source.name;
            }
            return element.source.uri.toString();
        }
        if (element instanceof debugModel_1.Thread) {
            return element.threadId;
        }
        if (isDebugSession(element)) {
            return element.getId();
        }
        return '';
    }
    exports.getContextForContributedActions = getContextForContributedActions;
    function getSpecificSourceName(stackFrame) {
        // To reduce flashing of the path name and the way we fetch stack frames
        // We need to compute the source name based on the other frames in the stale call stack
        let callStack = stackFrame.thread.getStaleCallStack();
        callStack = callStack.length > 0 ? callStack : stackFrame.thread.getCallStack();
        const otherSources = callStack.map(sf => sf.source).filter(s => s !== stackFrame.source);
        let suffixLength = 0;
        otherSources.forEach(s => {
            if (s.name === stackFrame.source.name) {
                suffixLength = Math.max(suffixLength, strings_1.commonSuffixLength(stackFrame.source.uri.path, s.uri.path));
            }
        });
        if (suffixLength === 0) {
            return stackFrame.source.name;
        }
        const from = Math.max(0, stackFrame.source.uri.path.lastIndexOf(path_1.posix.sep, stackFrame.source.uri.path.length - suffixLength - 1));
        return (from > 0 ? '...' : '') + stackFrame.source.uri.path.substr(from);
    }
    exports.getSpecificSourceName = getSpecificSourceName;
    let CallStackView = class CallStackView extends viewPaneContainer_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, viewDescriptorService, editorService, configurationService, menuService, contextKeyService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.options = options;
            this.debugService = debugService;
            this.editorService = editorService;
            this.contextKeyService = contextKeyService;
            this.needsRefresh = false;
            this.ignoreSelectionChangedEvent = false;
            this.ignoreFocusStackFrameEvent = false;
            this.parentSessionToExpand = new Set();
            this.selectionNeedsUpdate = false;
            this.callStackItemType = debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.bindTo(contextKeyService);
            this.menu = menuService.createMenu(actions_1.MenuId.DebugCallStackContext, contextKeyService);
            this._register(this.menu);
            // Create scheduler to prevent unnecessary flashing of tree when reacting to changes
            this.onCallStackChangeScheduler = new async_1.RunOnceScheduler(() => {
                // Only show the global pause message if we do not display threads.
                // Otherwise there will be a pause message per thread and there is no need for a global one.
                const sessions = this.debugService.getModel().getSessions();
                const thread = sessions.length === 1 && sessions[0].getAllThreads().length === 1 ? sessions[0].getAllThreads()[0] : undefined;
                if (thread && thread.stoppedDetails) {
                    this.pauseMessageLabel.textContent = thread.stoppedDetails.description || nls.localize('debugStopped', "Paused on {0}", thread.stoppedDetails.reason || '');
                    this.pauseMessageLabel.title = thread.stoppedDetails.text || '';
                    dom.toggleClass(this.pauseMessageLabel, 'exception', thread.stoppedDetails.reason === 'exception');
                    this.pauseMessage.hidden = false;
                    this.updateActions();
                }
                else {
                    this.pauseMessage.hidden = true;
                    this.updateActions();
                }
                this.needsRefresh = false;
                this.dataSource.deemphasizedStackFramesToShow = [];
                this.tree.updateChildren().then(() => {
                    try {
                        this.parentSessionToExpand.forEach(s => this.tree.expand(s));
                    }
                    catch (e) {
                        // Ignore tree expand errors if element no longer present
                    }
                    this.parentSessionToExpand.clear();
                    if (this.selectionNeedsUpdate) {
                        this.selectionNeedsUpdate = false;
                        this.updateTreeSelection();
                    }
                });
            }, 50);
        }
        renderHeaderTitle(container) {
            const titleContainer = dom.append(container, $('.debug-call-stack-title'));
            super.renderHeaderTitle(titleContainer, this.options.title);
            this.pauseMessage = dom.append(titleContainer, $('span.pause-message'));
            this.pauseMessage.hidden = true;
            this.pauseMessageLabel = dom.append(this.pauseMessage, $('span.label'));
        }
        getActions() {
            if (this.pauseMessage.hidden) {
                return [new viewlet_1.CollapseAction(() => this.tree, true, 'explorer-action codicon-collapse-all')];
            }
            return [];
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(this.element, 'debug-pane');
            dom.addClass(container, 'debug-call-stack');
            const treeContainer = baseDebugView_1.renderViewTree(container);
            this.dataSource = new CallStackDataSource(this.debugService);
            const sessionsRenderer = this.instantiationService.createInstance(SessionsRenderer, this.menu);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'CallStackView', treeContainer, new CallStackDelegate(), new CallStackCompressionDelegate(), [
                sessionsRenderer,
                new ThreadsRenderer(this.instantiationService),
                this.instantiationService.createInstance(StackFramesRenderer),
                new ErrorsRenderer(),
                new LoadMoreRenderer(this.themeService),
                new ShowMoreRenderer(this.themeService)
            ], this.dataSource, {
                accessibilityProvider: new CallStackAccessibilityProvider(),
                compressionEnabled: true,
                identityProvider: {
                    getId: (element) => {
                        if (typeof element === 'string') {
                            return element;
                        }
                        if (element instanceof Array) {
                            return `showMore ${element[0].getId()}`;
                        }
                        return element.getId();
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (e) => {
                        if (isDebugSession(e)) {
                            return e.getLabel();
                        }
                        if (e instanceof debugModel_1.Thread) {
                            return `${e.name} ${e.stateLabel}`;
                        }
                        if (e instanceof debugModel_1.StackFrame || typeof e === 'string') {
                            return e;
                        }
                        if (e instanceof debugModel_1.ThreadAndSessionIds) {
                            return LoadMoreRenderer.LABEL;
                        }
                        return nls.localize('showMoreStackFrames2', "Show More Stack Frames");
                    },
                    getCompressedNodeKeyboardNavigationLabel: (e) => {
                        const firstItem = e[0];
                        if (isDebugSession(firstItem)) {
                            return firstItem.getLabel();
                        }
                        return '';
                    }
                },
                expandOnlyOnTwistieClick: true,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this.tree.setInput(this.debugService.getModel());
            this._register(this.tree.onDidOpen(e => {
                if (this.ignoreSelectionChangedEvent) {
                    return;
                }
                const focusStackFrame = (stackFrame, thread, session) => {
                    this.ignoreFocusStackFrameEvent = true;
                    try {
                        this.debugService.focusStackFrame(stackFrame, thread, session, true);
                    }
                    finally {
                        this.ignoreFocusStackFrameEvent = false;
                    }
                };
                const element = e.element;
                if (element instanceof debugModel_1.StackFrame) {
                    focusStackFrame(element, element.thread, element.thread.session);
                    element.openInEditor(this.editorService, e.editorOptions.preserveFocus, e.sideBySide, e.editorOptions.pinned);
                }
                if (element instanceof debugModel_1.Thread) {
                    focusStackFrame(undefined, element, element.session);
                }
                if (isDebugSession(element)) {
                    focusStackFrame(undefined, undefined, element);
                }
                if (element instanceof debugModel_1.ThreadAndSessionIds) {
                    const session = this.debugService.getModel().getSession(element.sessionId);
                    const thread = session && session.getThread(element.threadId);
                    if (thread) {
                        thread.fetchCallStack()
                            .then(() => this.tree.updateChildren());
                    }
                }
                if (element instanceof Array) {
                    this.dataSource.deemphasizedStackFramesToShow.push(...element);
                    this.tree.updateChildren();
                }
            }));
            this._register(this.debugService.getModel().onDidChangeCallStack(() => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (!this.onCallStackChangeScheduler.isScheduled()) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            const onFocusChange = event_1.Event.any(this.debugService.getViewModel().onDidFocusStackFrame, this.debugService.getViewModel().onDidFocusSession);
            this._register(onFocusChange(() => {
                if (this.ignoreFocusStackFrameEvent) {
                    return;
                }
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (this.onCallStackChangeScheduler.isScheduled()) {
                    this.selectionNeedsUpdate = true;
                    return;
                }
                this.updateTreeSelection();
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            // Schedule the update of the call stack tree if the viewlet is opened after a session started #14684
            if (this.debugService.state === 2 /* Stopped */) {
                this.onCallStackChangeScheduler.schedule(0);
            }
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            this._register(this.debugService.onDidNewSession(s => {
                this._register(s.onDidChangeName(() => this.tree.rerender(s)));
                if (s.parentSession) {
                    // Auto expand sessions that have sub sessions
                    this.parentSessionToExpand.add(s.parentSession);
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        focus() {
            this.tree.domFocus();
        }
        updateTreeSelection() {
            if (!this.tree || !this.tree.getInput()) {
                // Tree not initialized yet
                return;
            }
            const updateSelectionAndReveal = (element) => {
                this.ignoreSelectionChangedEvent = true;
                try {
                    this.tree.setSelection([element]);
                    // If the element is outside of the screen bounds,
                    // position it in the middle
                    if (this.tree.getRelativeTop(element) === null) {
                        this.tree.reveal(element, 0.5);
                    }
                    else {
                        this.tree.reveal(element);
                    }
                }
                catch (e) { }
                finally {
                    this.ignoreSelectionChangedEvent = false;
                }
            };
            const thread = this.debugService.getViewModel().focusedThread;
            const session = this.debugService.getViewModel().focusedSession;
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (!thread) {
                if (!session) {
                    this.tree.setSelection([]);
                }
                else {
                    updateSelectionAndReveal(session);
                }
            }
            else {
                const expandPromises = [() => async_1.ignoreErrors(this.tree.expand(thread))];
                let s = thread.session;
                while (s) {
                    const sessionToExpand = s;
                    expandPromises.push(() => async_1.ignoreErrors(this.tree.expand(sessionToExpand)));
                    s = s.parentSession;
                }
                async_1.sequence(expandPromises.reverse()).then(() => {
                    const toReveal = stackFrame || session;
                    if (toReveal) {
                        updateSelectionAndReveal(toReveal);
                    }
                });
            }
        }
        onContextMenu(e) {
            const element = e.element;
            if (isDebugSession(element)) {
                this.callStackItemType.set('session');
            }
            else if (element instanceof debugModel_1.Thread) {
                this.callStackItemType.set('thread');
            }
            else if (element instanceof debugModel_1.StackFrame) {
                this.callStackItemType.set('stackFrame');
            }
            else {
                this.callStackItemType.reset();
            }
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.menu, { arg: getContextForContributedActions(element), shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => result.secondary,
                getActionsContext: () => getContext(element),
                onHide: () => lifecycle_1.dispose(actionsDisposable)
            });
        }
    };
    CallStackView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, editorService_1.IEditorService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, actions_1.IMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, opener_1.IOpenerService),
        __param(11, themeService_1.IThemeService),
        __param(12, telemetry_1.ITelemetryService)
    ], CallStackView);
    exports.CallStackView = CallStackView;
    let SessionsRenderer = class SessionsRenderer {
        constructor(menu, instantiationService, debugService, keybindingService, notificationService, contextMenuService) {
            this.menu = menu;
            this.instantiationService = instantiationService;
            this.debugService = debugService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
        }
        get templateId() {
            return SessionsRenderer.ID;
        }
        renderTemplate(container) {
            const session = dom.append(container, $('.session'));
            dom.append(session, $('.codicon.codicon-bug'));
            const name = dom.append(session, $('.name'));
            const state = dom.append(session, $('.state'));
            const stateLabel = dom.append(state, $('span.label.monaco-count-badge.long'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            const actionBar = new actionbar_1.ActionBar(session, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        // We need the MenuEntryActionViewItem so the icon would get rendered
                        return new menuEntryActionViewItem_1.MenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                    }
                    return undefined;
                }
            });
            return { session, name, state, stateLabel, label, actionBar, elementDisposable: [] };
        }
        renderElement(element, _, data) {
            this.doRenderElement(element.element, element.element.getLabel(), filters_1.createMatches(element.filterData), data);
        }
        renderCompressedElements(node, index, templateData, height) {
            const lastElement = node.element.elements[node.element.elements.length - 1];
            const matches = filters_1.createMatches(node.filterData);
            const label = node.element.elements[0].getLabel();
            this.doRenderElement(lastElement, label, matches, templateData);
        }
        doRenderElement(session, label, matches, data) {
            data.session.title = nls.localize({ key: 'session', comment: ['Session is a noun'] }, "Session");
            data.label.set(label, matches);
            const thread = session.getAllThreads().find(t => t.stopped);
            const setActionBar = () => {
                const actions = getActions(this.instantiationService, session);
                const primary = actions;
                const secondary = [];
                const result = { primary, secondary };
                data.elementDisposable.push(menuEntryActionViewItem_1.createAndFillInActionBarActions(this.menu, { arg: getContextForContributedActions(session), shouldForwardArgs: true }, result, g => /^inline/.test(g)));
                data.actionBar.clear();
                data.actionBar.push(primary, { icon: true, label: false });
            };
            setActionBar();
            data.elementDisposable.push(this.menu.onDidChange(() => setActionBar()));
            data.stateLabel.hidden = false;
            if (thread && thread.stoppedDetails) {
                data.stateLabel.textContent = thread.stoppedDetails.description || nls.localize('debugStopped', "Paused on {0}", thread.stoppedDetails.reason || '');
            }
            else {
                const hasChildSessions = this.debugService.getModel().getSessions().find(s => s.parentSession === session);
                if (!hasChildSessions) {
                    data.stateLabel.textContent = nls.localize({ key: 'running', comment: ['indicates state'] }, "Running");
                }
                else {
                    data.stateLabel.hidden = true;
                }
            }
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
        disposeElement(_element, _, templateData) {
            lifecycle_1.dispose(templateData.elementDisposable);
        }
    };
    SessionsRenderer.ID = 'session';
    SessionsRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, notification_1.INotificationService),
        __param(5, contextView_1.IContextMenuService)
    ], SessionsRenderer);
    class ThreadsRenderer {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return ThreadsRenderer.ID;
        }
        renderTemplate(container) {
            const thread = dom.append(container, $('.thread'));
            const name = dom.append(thread, $('.name'));
            const state = dom.append(thread, $('.state'));
            const stateLabel = dom.append(state, $('span.label'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            const actionBar = new actionbar_1.ActionBar(thread);
            return { thread, name, state, stateLabel, label, actionBar };
        }
        renderElement(element, index, data) {
            const thread = element.element;
            data.thread.title = nls.localize('thread', "Thread");
            data.label.set(thread.name, filters_1.createMatches(element.filterData));
            data.stateLabel.textContent = thread.stateLabel;
            data.actionBar.clear();
            const actions = getActions(this.instantiationService, thread);
            data.actionBar.push(actions, { icon: true, label: false });
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    }
    ThreadsRenderer.ID = 'thread';
    let StackFramesRenderer = class StackFramesRenderer {
        constructor(labelService, notificationService) {
            this.labelService = labelService;
            this.notificationService = notificationService;
        }
        get templateId() {
            return StackFramesRenderer.ID;
        }
        renderTemplate(container) {
            const stackFrame = dom.append(container, $('.stack-frame'));
            const labelDiv = dom.append(stackFrame, $('span.label.expression'));
            const file = dom.append(stackFrame, $('.file'));
            const fileName = dom.append(file, $('span.file-name'));
            const wrapper = dom.append(file, $('span.line-number-wrapper'));
            const lineNumber = dom.append(wrapper, $('span.line-number.monaco-count-badge'));
            const label = new highlightedLabel_1.HighlightedLabel(labelDiv, false);
            const actionBar = new actionbar_1.ActionBar(stackFrame);
            return { file, fileName, label, lineNumber, stackFrame, actionBar };
        }
        renderElement(element, index, data) {
            const stackFrame = element.element;
            dom.toggleClass(data.stackFrame, 'disabled', !stackFrame.source || !stackFrame.source.available || isDeemphasized(stackFrame));
            dom.toggleClass(data.stackFrame, 'label', stackFrame.presentationHint === 'label');
            dom.toggleClass(data.stackFrame, 'subtle', stackFrame.presentationHint === 'subtle');
            const hasActions = !!stackFrame.thread.session.capabilities.supportsRestartFrame && stackFrame.presentationHint !== 'label' && stackFrame.presentationHint !== 'subtle';
            dom.toggleClass(data.stackFrame, 'has-actions', hasActions);
            data.file.title = stackFrame.source.inMemory ? stackFrame.source.uri.path : this.labelService.getUriLabel(stackFrame.source.uri);
            if (stackFrame.source.raw.origin) {
                data.file.title += `\n${stackFrame.source.raw.origin}`;
            }
            data.label.set(stackFrame.name, filters_1.createMatches(element.filterData), stackFrame.name);
            data.fileName.textContent = getSpecificSourceName(stackFrame);
            if (stackFrame.range.startLineNumber !== undefined) {
                data.lineNumber.textContent = `${stackFrame.range.startLineNumber}`;
                if (stackFrame.range.startColumn) {
                    data.lineNumber.textContent += `:${stackFrame.range.startColumn}`;
                }
                dom.removeClass(data.lineNumber, 'unavailable');
            }
            else {
                dom.addClass(data.lineNumber, 'unavailable');
            }
            data.actionBar.clear();
            if (hasActions) {
                const action = new actions_2.Action('debug.callStack.restartFrame', nls.localize('restartFrame', "Restart Frame"), 'codicon-debug-restart-frame', true, async () => {
                    try {
                        await stackFrame.restart();
                    }
                    catch (e) {
                        this.notificationService.error(e);
                    }
                });
                data.actionBar.push(action, { icon: true, label: false });
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    StackFramesRenderer.ID = 'stackFrame';
    StackFramesRenderer = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, notification_1.INotificationService)
    ], StackFramesRenderer);
    class ErrorsRenderer {
        get templateId() {
            return ErrorsRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.error'));
            return { label };
        }
        renderElement(element, index, data) {
            const error = element.element;
            data.label.textContent = error;
            data.label.title = error;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ErrorsRenderer.ID = 'error';
    class LoadMoreRenderer {
        constructor(themeService) {
            this.themeService = themeService;
        }
        get templateId() {
            return LoadMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.load-more'));
            const toDispose = styler_1.attachStylerCallback(this.themeService, { textLinkForeground: colorRegistry_1.textLinkForeground }, colors => {
                if (colors.textLinkForeground) {
                    label.style.color = colors.textLinkForeground.toString();
                }
            });
            return { label, toDispose };
        }
        renderElement(element, index, data) {
            data.label.textContent = LoadMoreRenderer.LABEL;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.toDispose.dispose();
        }
    }
    LoadMoreRenderer.ID = 'loadMore';
    LoadMoreRenderer.LABEL = nls.localize('loadMoreStackFrames', "Load More Stack Frames");
    class ShowMoreRenderer {
        constructor(themeService) {
            this.themeService = themeService;
        }
        get templateId() {
            return ShowMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.show-more'));
            const toDispose = styler_1.attachStylerCallback(this.themeService, { textLinkForeground: colorRegistry_1.textLinkForeground }, colors => {
                if (colors.textLinkForeground) {
                    label.style.color = colors.textLinkForeground.toString();
                }
            });
            return { label, toDispose };
        }
        renderElement(element, index, data) {
            const stackFrames = element.element;
            if (stackFrames.every(sf => !!(sf.source && sf.source.origin && sf.source.origin === stackFrames[0].source.origin))) {
                data.label.textContent = nls.localize('showMoreAndOrigin', "Show {0} More: {1}", stackFrames.length, stackFrames[0].source.origin);
            }
            else {
                data.label.textContent = nls.localize('showMoreStackFrames', "Show {0} More Stack Frames", stackFrames.length);
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.toDispose.dispose();
        }
    }
    ShowMoreRenderer.ID = 'showMore';
    class CallStackDelegate {
        getHeight(element) {
            if (element instanceof debugModel_1.StackFrame && element.presentationHint === 'label') {
                return 16;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds || element instanceof Array) {
                return 16;
            }
            return 22;
        }
        getTemplateId(element) {
            if (isDebugSession(element)) {
                return SessionsRenderer.ID;
            }
            if (element instanceof debugModel_1.Thread) {
                return ThreadsRenderer.ID;
            }
            if (element instanceof debugModel_1.StackFrame) {
                return StackFramesRenderer.ID;
            }
            if (typeof element === 'string') {
                return ErrorsRenderer.ID;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds) {
                return LoadMoreRenderer.ID;
            }
            // element instanceof Array
            return ShowMoreRenderer.ID;
        }
    }
    function isDebugModel(obj) {
        return typeof obj.getSessions === 'function';
    }
    function isDebugSession(obj) {
        return obj && typeof obj.getAllThreads === 'function';
    }
    function isDeemphasized(frame) {
        return frame.source.presentationHint === 'deemphasize' || frame.presentationHint === 'deemphasize';
    }
    class CallStackDataSource {
        constructor(debugService) {
            this.debugService = debugService;
            this.deemphasizedStackFramesToShow = [];
        }
        hasChildren(element) {
            if (isDebugSession(element)) {
                const threads = element.getAllThreads();
                return (threads.length > 1) || (threads.length === 1 && threads[0].stopped) || !!(this.debugService.getModel().getSessions().find(s => s.parentSession === element));
            }
            return isDebugModel(element) || (element instanceof debugModel_1.Thread && element.stopped);
        }
        async getChildren(element) {
            if (isDebugModel(element)) {
                const sessions = element.getSessions();
                if (sessions.length === 0) {
                    return Promise.resolve([]);
                }
                if (sessions.length > 1 || this.debugService.getViewModel().isMultiSessionView()) {
                    return Promise.resolve(sessions.filter(s => !s.parentSession));
                }
                const threads = sessions[0].getAllThreads();
                // Only show the threads in the call stack if there is more than 1 thread.
                return threads.length === 1 ? this.getThreadChildren(threads[0]) : Promise.resolve(threads);
            }
            else if (isDebugSession(element)) {
                const childSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === element);
                const threads = element.getAllThreads();
                if (threads.length === 1) {
                    // Do not show thread when there is only one to be compact.
                    const children = await this.getThreadChildren(threads[0]);
                    return children.concat(childSessions);
                }
                return Promise.resolve(threads.concat(childSessions));
            }
            else {
                return this.getThreadChildren(element);
            }
        }
        getThreadChildren(thread) {
            return this.getThreadCallstack(thread).then(children => {
                // Check if some stack frames should be hidden under a parent element since they are deemphasized
                const result = [];
                children.forEach((child, index) => {
                    if (child instanceof debugModel_1.StackFrame && child.source && isDeemphasized(child)) {
                        // Check if the user clicked to show the deemphasized source
                        if (this.deemphasizedStackFramesToShow.indexOf(child) === -1) {
                            if (result.length) {
                                const last = result[result.length - 1];
                                if (last instanceof Array) {
                                    // Collect all the stackframes that will be "collapsed"
                                    last.push(child);
                                    return;
                                }
                            }
                            const nextChild = index < children.length - 1 ? children[index + 1] : undefined;
                            if (nextChild instanceof debugModel_1.StackFrame && nextChild.source && isDeemphasized(nextChild)) {
                                // Start collecting stackframes that will be "collapsed"
                                result.push([child]);
                                return;
                            }
                        }
                    }
                    result.push(child);
                });
                return result;
            });
        }
        getThreadCallstack(thread) {
            let callStack = thread.getCallStack();
            let callStackPromise = Promise.resolve(null);
            if (!callStack || !callStack.length) {
                callStackPromise = thread.fetchCallStack().then(() => callStack = thread.getCallStack());
            }
            return callStackPromise.then(() => {
                if (callStack.length === 1 && thread.session.capabilities.supportsDelayedStackTraceLoading && thread.stoppedDetails && thread.stoppedDetails.totalFrames && thread.stoppedDetails.totalFrames > 1) {
                    // To reduce flashing of the call stack view simply append the stale call stack
                    // once we have the correct data the tree will refresh and we will no longer display it.
                    callStack = callStack.concat(thread.getStaleCallStack().slice(1));
                }
                if (thread.stoppedDetails && thread.stoppedDetails.framesErrorMessage) {
                    callStack = callStack.concat([thread.stoppedDetails.framesErrorMessage]);
                }
                if (thread.stoppedDetails && thread.stoppedDetails.totalFrames && thread.stoppedDetails.totalFrames > callStack.length && callStack.length > 1) {
                    callStack = callStack.concat([new debugModel_1.ThreadAndSessionIds(thread.session.getId(), thread.threadId)]);
                }
                return callStack;
            });
        }
    }
    class CallStackAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'callStackAriaLabel' }, "Debug Call Stack");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Thread) {
                return nls.localize('threadAriaLabel', "Thread {0}, callstack, debug", element.name);
            }
            if (element instanceof debugModel_1.StackFrame) {
                return nls.localize('stackFrameAriaLabel', "Stack Frame {0}, line {1}, {2}, callstack, debug", element.name, element.range.startLineNumber, getSpecificSourceName(element));
            }
            if (isDebugSession(element)) {
                return nls.localize('sessionLabel', "Debug Session {0}", element.getLabel());
            }
            if (typeof element === 'string') {
                return element;
            }
            if (element instanceof Array) {
                return nls.localize('showMoreStackFrames', "Show {0} More Stack Frames", element.length);
            }
            // element instanceof ThreadAndSessionIds
            return nls.localize('loadMoreStackFrames', "Load More Stack Frames");
        }
    }
    function getActions(instantiationService, element) {
        const getThreadActions = (thread) => {
            return [
                thread.stopped ? instantiationService.createInstance(ContinueAction, thread) : instantiationService.createInstance(PauseAction, thread),
                instantiationService.createInstance(StepOverAction, thread),
                instantiationService.createInstance(StepIntoAction, thread),
                instantiationService.createInstance(StepOutAction, thread)
            ];
        };
        if (element instanceof debugModel_1.Thread) {
            return getThreadActions(element);
        }
        const session = element;
        const stopOrDisconectAction = debugUtils_1.isSessionAttach(session) ? instantiationService.createInstance(DisconnectAction, session) : instantiationService.createInstance(StopAction, session);
        const restartAction = instantiationService.createInstance(RestartAction, session);
        const threads = session.getAllThreads();
        if (threads.length === 1) {
            return getThreadActions(threads[0]).concat([
                restartAction,
                stopOrDisconectAction
            ]);
        }
        return [
            restartAction,
            stopOrDisconectAction
        ];
    }
    let StopAction = class StopAction extends actions_2.Action {
        constructor(session, commandService) {
            super(`action.${debugCommands_1.STOP_ID}`, debugCommands_1.STOP_LABEL, 'debug-action codicon-debug-stop');
            this.session = session;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STOP_ID, undefined, getContext(this.session));
        }
    };
    StopAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StopAction);
    let DisconnectAction = class DisconnectAction extends actions_2.Action {
        constructor(session, commandService) {
            super(`action.${debugCommands_1.DISCONNECT_ID}`, debugCommands_1.DISCONNECT_LABEL, 'debug-action codicon-debug-disconnect');
            this.session = session;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.DISCONNECT_ID, undefined, getContext(this.session));
        }
    };
    DisconnectAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], DisconnectAction);
    let RestartAction = class RestartAction extends actions_2.Action {
        constructor(session, commandService) {
            super(`action.${debugCommands_1.RESTART_SESSION_ID}`, debugCommands_1.RESTART_LABEL, 'debug-action codicon-debug-restart');
            this.session = session;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.RESTART_SESSION_ID, undefined, getContext(this.session));
        }
    };
    RestartAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], RestartAction);
    let StepOverAction = class StepOverAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.STEP_OVER_ID}`, debugCommands_1.STEP_OVER_LABEL, 'debug-action codicon-debug-step-over', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STEP_OVER_ID, undefined, getContext(this.thread));
        }
    };
    StepOverAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StepOverAction);
    let StepIntoAction = class StepIntoAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.STEP_INTO_ID}`, debugCommands_1.STEP_INTO_LABEL, 'debug-action codicon-debug-step-into', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STEP_INTO_ID, undefined, getContext(this.thread));
        }
    };
    StepIntoAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StepIntoAction);
    let StepOutAction = class StepOutAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.STEP_OUT_ID}`, debugCommands_1.STEP_OUT_LABEL, 'debug-action codicon-debug-step-out', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.STEP_OUT_ID, undefined, getContext(this.thread));
        }
    };
    StepOutAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], StepOutAction);
    let PauseAction = class PauseAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.PAUSE_ID}`, debugCommands_1.PAUSE_LABEL, 'debug-action codicon-debug-pause', !thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.PAUSE_ID, undefined, getContext(this.thread));
        }
    };
    PauseAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], PauseAction);
    let ContinueAction = class ContinueAction extends actions_2.Action {
        constructor(thread, commandService) {
            super(`action.${debugCommands_1.CONTINUE_ID}`, debugCommands_1.CONTINUE_LABEL, 'debug-action codicon-debug-continue', thread.stopped);
            this.thread = thread;
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(debugCommands_1.CONTINUE_ID, undefined, getContext(this.thread));
        }
    };
    ContinueAction = __decorate([
        __param(1, commands_1.ICommandService)
    ], ContinueAction);
    class CallStackCompressionDelegate {
        isIncompressible(stat) {
            if (isDebugSession(stat)) {
                return false;
            }
            return true;
        }
    }
});
//# __sourceMappingURL=callStackView.js.map