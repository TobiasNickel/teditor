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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/browser/dom", "vs/base/common/actions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/browser/debugActions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/inputbox/inputBox", "vs/platform/list/browser/listService", "vs/platform/theme/common/styler", "vs/editor/browser/editorBrowser", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/base/browser/touch", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry"], function (require, exports, nls, resources, dom, actions_1, debug_1, debugModel_1, debugActions_1, contextView_1, instantiation_1, keybinding_1, themeService_1, lifecycle_1, actionbar_1, inputBox_1, listService_1, styler_1, editorBrowser_1, configuration_1, editorService_1, viewPaneContainer_1, label_1, contextkey_1, touch_1, views_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getBreakpointMessageAndClassName = exports.openBreakpointSource = exports.BreakpointsView = exports.getExpandedBodySize = void 0;
    const $ = dom.$;
    function createCheckbox() {
        const checkbox = $('input');
        checkbox.type = 'checkbox';
        checkbox.tabIndex = -1;
        touch_1.Gesture.ignoreTarget(checkbox);
        return checkbox;
    }
    const MAX_VISIBLE_BREAKPOINTS = 9;
    function getExpandedBodySize(model, countLimit) {
        const length = model.getBreakpoints().length + model.getExceptionBreakpoints().length + model.getFunctionBreakpoints().length + model.getDataBreakpoints().length;
        return Math.min(countLimit, length) * 22;
    }
    exports.getExpandedBodySize = getExpandedBodySize;
    let BreakpointsView = class BreakpointsView extends viewPaneContainer_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, themeService, editorService, contextViewService, configurationService, viewDescriptorService, contextKeyService, openerService, telemetryService, labelService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.editorService = editorService;
            this.contextViewService = contextViewService;
            this.labelService = labelService;
            this.needsRefresh = false;
            this.ignoreLayout = false;
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.onBreakpointsChange()));
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(this.element, 'debug-pane');
            dom.addClass(container, 'debug-breakpoints');
            const delegate = new BreakpointsDelegate(this.debugService);
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'Breakpoints', container, delegate, [
                this.instantiationService.createInstance(BreakpointsRenderer),
                new ExceptionBreakpointsRenderer(this.debugService),
                this.instantiationService.createInstance(FunctionBreakpointsRenderer),
                this.instantiationService.createInstance(DataBreakpointsRenderer),
                new FunctionBreakpointInputRenderer(this.debugService, this.contextViewService, this.themeService, this.labelService)
            ], {
                identityProvider: { getId: (element) => element.getId() },
                multipleSelectionSupport: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                accessibilityProvider: new BreakpointsAccessibilityProvider(this.debugService, this.labelService),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            debug_1.CONTEXT_BREAKPOINTS_FOCUSED.bindTo(this.list.contextKeyService);
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this.list.onMouseMiddleClick(async ({ element }) => {
                if (element instanceof debugModel_1.Breakpoint) {
                    await this.debugService.removeBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.FunctionBreakpoint) {
                    await this.debugService.removeFunctionBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.DataBreakpoint) {
                    await this.debugService.removeDataBreakpoints(element.getId());
                }
            });
            const resourceNavigator = this._register(new listService_1.ListResourceNavigator(this.list, { configurationService: this.configurationService }));
            this._register(resourceNavigator.onDidOpen(async (e) => {
                if (e.element === null) {
                    return;
                }
                if (e.browserEvent instanceof MouseEvent && e.browserEvent.button === 1) { // middle click
                    return;
                }
                const element = this.list.element(e.element);
                if (element instanceof debugModel_1.Breakpoint) {
                    openBreakpointSource(element, e.sideBySide, e.editorOptions.preserveFocus || false, this.debugService, this.editorService);
                }
                if (e.browserEvent instanceof MouseEvent && e.browserEvent.detail === 2 && element instanceof debugModel_1.FunctionBreakpoint && element !== this.debugService.getViewModel().getSelectedFunctionBreakpoint()) {
                    // double click
                    this.debugService.getViewModel().setSelectedFunctionBreakpoint(element);
                    this.onBreakpointsChange();
                }
            }));
            this.list.splice(0, this.list.length, this.elements);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onBreakpointsChange();
                }
            }));
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            this._register(containerModel.onDidChangeAllViewDescriptors(() => {
                this.updateSize();
            }));
        }
        focus() {
            super.focus();
            if (this.list) {
                this.list.domFocus();
            }
        }
        layoutBody(height, width) {
            if (this.ignoreLayout) {
                return;
            }
            super.layoutBody(height, width);
            if (this.list) {
                this.list.layout(height, width);
            }
            try {
                this.ignoreLayout = true;
                this.updateSize();
            }
            finally {
                this.ignoreLayout = false;
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const actions = [];
            const element = e.element;
            const breakpointType = element instanceof debugModel_1.Breakpoint && element.logMessage ? nls.localize('Logpoint', "Logpoint") : nls.localize('Breakpoint', "Breakpoint");
            if (element instanceof debugModel_1.Breakpoint || element instanceof debugModel_1.FunctionBreakpoint) {
                actions.push(new actions_1.Action('workbench.action.debug.openEditorAndEditBreakpoint', nls.localize('editBreakpoint', "Edit {0}...", breakpointType), '', true, async () => {
                    if (element instanceof debugModel_1.Breakpoint) {
                        const editor = await openBreakpointSource(element, false, false, this.debugService, this.editorService);
                        if (editor) {
                            const codeEditor = editor.getControl();
                            if (editorBrowser_1.isCodeEditor(codeEditor)) {
                                codeEditor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID).showBreakpointWidget(element.lineNumber, element.column);
                            }
                        }
                    }
                    else {
                        this.debugService.getViewModel().setSelectedFunctionBreakpoint(element);
                        this.onBreakpointsChange();
                    }
                }));
                actions.push(new actionbar_1.Separator());
            }
            actions.push(new debugActions_1.RemoveBreakpointAction(debugActions_1.RemoveBreakpointAction.ID, nls.localize('removeBreakpoint', "Remove {0}", breakpointType), this.debugService));
            if (this.debugService.getModel().getBreakpoints().length + this.debugService.getModel().getFunctionBreakpoints().length > 1) {
                actions.push(new debugActions_1.RemoveAllBreakpointsAction(debugActions_1.RemoveAllBreakpointsAction.ID, debugActions_1.RemoveAllBreakpointsAction.LABEL, this.debugService, this.keybindingService));
                actions.push(new actionbar_1.Separator());
                actions.push(new debugActions_1.EnableAllBreakpointsAction(debugActions_1.EnableAllBreakpointsAction.ID, debugActions_1.EnableAllBreakpointsAction.LABEL, this.debugService, this.keybindingService));
                actions.push(new debugActions_1.DisableAllBreakpointsAction(debugActions_1.DisableAllBreakpointsAction.ID, debugActions_1.DisableAllBreakpointsAction.LABEL, this.debugService, this.keybindingService));
            }
            actions.push(new actionbar_1.Separator());
            actions.push(new debugActions_1.ReapplyBreakpointsAction(debugActions_1.ReapplyBreakpointsAction.ID, debugActions_1.ReapplyBreakpointsAction.LABEL, this.debugService, this.keybindingService));
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element,
                onHide: () => lifecycle_1.dispose(actions)
            });
        }
        getActions() {
            return [
                new debugActions_1.AddFunctionBreakpointAction(debugActions_1.AddFunctionBreakpointAction.ID, debugActions_1.AddFunctionBreakpointAction.LABEL, this.debugService, this.keybindingService),
                new debugActions_1.ToggleBreakpointsActivatedAction(debugActions_1.ToggleBreakpointsActivatedAction.ID, debugActions_1.ToggleBreakpointsActivatedAction.ACTIVATE_LABEL, this.debugService, this.keybindingService),
                new debugActions_1.RemoveAllBreakpointsAction(debugActions_1.RemoveAllBreakpointsAction.ID, debugActions_1.RemoveAllBreakpointsAction.LABEL, this.debugService, this.keybindingService)
            ];
        }
        updateSize() {
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            // Adjust expanded body size
            this.minimumBodySize = this.orientation === 0 /* VERTICAL */ ? getExpandedBodySize(this.debugService.getModel(), MAX_VISIBLE_BREAKPOINTS) : 170;
            this.maximumBodySize = this.orientation === 0 /* VERTICAL */ && containerModel.visibleViewDescriptors.length > 1 ? getExpandedBodySize(this.debugService.getModel(), Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
        }
        onBreakpointsChange() {
            if (this.isBodyVisible()) {
                this.updateSize();
                if (this.list) {
                    const lastFocusIndex = this.list.getFocus()[0];
                    // Check whether focused element was removed
                    const needsRefocus = lastFocusIndex && !this.elements.includes(this.list.element(lastFocusIndex));
                    this.list.splice(0, this.list.length, this.elements);
                    this.needsRefresh = false;
                    if (needsRefocus) {
                        this.list.focusNth(Math.min(lastFocusIndex, this.list.length - 1));
                    }
                }
            }
            else {
                this.needsRefresh = true;
            }
        }
        get elements() {
            const model = this.debugService.getModel();
            const elements = model.getExceptionBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getDataBreakpoints()).concat(model.getBreakpoints());
            return elements;
        }
    };
    BreakpointsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorService_1.IEditorService),
        __param(7, contextView_1.IContextViewService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, opener_1.IOpenerService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, label_1.ILabelService)
    ], BreakpointsView);
    exports.BreakpointsView = BreakpointsView;
    class BreakpointsDelegate {
        constructor(debugService) {
            this.debugService = debugService;
            // noop
        }
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Breakpoint) {
                return BreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.FunctionBreakpoint) {
                const selected = this.debugService.getViewModel().getSelectedFunctionBreakpoint();
                if (!element.name || (selected && selected.getId() === element.getId())) {
                    return FunctionBreakpointInputRenderer.ID;
                }
                return FunctionBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.ExceptionBreakpoint) {
                return ExceptionBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.DataBreakpoint) {
                return DataBreakpointsRenderer.ID;
            }
            return '';
        }
    }
    let BreakpointsRenderer = class BreakpointsRenderer {
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        get templateId() {
            return BreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.filePath = dom.append(data.breakpoint, $('span.file-path'));
            const lineNumberContainer = dom.append(data.breakpoint, $('.line-number-container'));
            data.lineNumber = dom.append(lineNumberContainer, $('span.line-number.monaco-count-badge'));
            return data;
        }
        renderElement(breakpoint, index, data) {
            data.context = breakpoint;
            dom.toggleClass(data.breakpoint, 'disabled', !this.debugService.getModel().areBreakpointsActivated());
            data.name.textContent = resources.basenameOrAuthority(breakpoint.uri);
            data.lineNumber.textContent = breakpoint.lineNumber.toString();
            if (breakpoint.column) {
                data.lineNumber.textContent += `:${breakpoint.column}`;
            }
            data.filePath.textContent = this.labelService.getUriLabel(resources.dirname(breakpoint.uri), { relative: true });
            data.checkbox.checked = breakpoint.enabled;
            const { message, className } = getBreakpointMessageAndClassName(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), breakpoint, this.labelService);
            data.icon.className = `codicon ${className}`;
            data.breakpoint.title = breakpoint.message || message || '';
            const debugActive = this.debugService.state === 3 /* Running */ || this.debugService.state === 2 /* Stopped */;
            if (debugActive && !breakpoint.verified) {
                dom.addClass(data.breakpoint, 'disabled');
            }
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    BreakpointsRenderer.ID = 'breakpoints';
    BreakpointsRenderer = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, label_1.ILabelService)
    ], BreakpointsRenderer);
    class ExceptionBreakpointsRenderer {
        constructor(debugService) {
            this.debugService = debugService;
            // noop
        }
        get templateId() {
            return ExceptionBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            dom.addClass(data.breakpoint, 'exception');
            return data;
        }
        renderElement(exceptionBreakpoint, index, data) {
            data.context = exceptionBreakpoint;
            data.name.textContent = exceptionBreakpoint.label || `${exceptionBreakpoint.filter} exceptions`;
            data.breakpoint.title = data.name.textContent;
            data.checkbox.checked = exceptionBreakpoint.enabled;
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    }
    ExceptionBreakpointsRenderer.ID = 'exceptionbreakpoints';
    let FunctionBreakpointsRenderer = class FunctionBreakpointsRenderer {
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        get templateId() {
            return FunctionBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            return data;
        }
        renderElement(functionBreakpoint, _index, data) {
            data.context = functionBreakpoint;
            data.name.textContent = functionBreakpoint.name;
            const { className, message } = getBreakpointMessageAndClassName(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), functionBreakpoint, this.labelService);
            data.icon.className = `codicon ${className}`;
            data.icon.title = message ? message : '';
            data.checkbox.checked = functionBreakpoint.enabled;
            data.breakpoint.title = message ? message : '';
            // Mark function breakpoints as disabled if deactivated or if debug type does not support them #9099
            const session = this.debugService.getViewModel().focusedSession;
            dom.toggleClass(data.breakpoint, 'disabled', (session && !session.capabilities.supportsFunctionBreakpoints) || !this.debugService.getModel().areBreakpointsActivated());
            if (session && !session.capabilities.supportsFunctionBreakpoints) {
                data.breakpoint.title = nls.localize('functionBreakpointsNotSupported', "Function breakpoints are not supported by this debug type");
            }
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    FunctionBreakpointsRenderer.ID = 'functionbreakpoints';
    FunctionBreakpointsRenderer = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, label_1.ILabelService)
    ], FunctionBreakpointsRenderer);
    let DataBreakpointsRenderer = class DataBreakpointsRenderer {
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        get templateId() {
            return DataBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox();
            data.toDispose = [];
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            return data;
        }
        renderElement(dataBreakpoint, _index, data) {
            data.context = dataBreakpoint;
            data.name.textContent = dataBreakpoint.description;
            const { className, message } = getBreakpointMessageAndClassName(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), dataBreakpoint, this.labelService);
            data.icon.className = `codicon ${className}`;
            data.icon.title = message ? message : '';
            data.checkbox.checked = dataBreakpoint.enabled;
            data.breakpoint.title = message ? message : '';
            // Mark function breakpoints as disabled if deactivated or if debug type does not support them #9099
            const session = this.debugService.getViewModel().focusedSession;
            dom.toggleClass(data.breakpoint, 'disabled', (session && !session.capabilities.supportsDataBreakpoints) || !this.debugService.getModel().areBreakpointsActivated());
            if (session && !session.capabilities.supportsDataBreakpoints) {
                data.breakpoint.title = nls.localize('dataBreakpointsNotSupported', "Data breakpoints are not supported by this debug type");
            }
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    };
    DataBreakpointsRenderer.ID = 'databreakpoints';
    DataBreakpointsRenderer = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, label_1.ILabelService)
    ], DataBreakpointsRenderer);
    class FunctionBreakpointInputRenderer {
        constructor(debugService, contextViewService, themeService, labelService) {
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.labelService = labelService;
            // noop
        }
        get templateId() {
            return FunctionBreakpointInputRenderer.ID;
        }
        renderTemplate(container) {
            const template = Object.create(null);
            const breakpoint = dom.append(container, $('.breakpoint'));
            template.icon = $('.icon');
            template.checkbox = createCheckbox();
            dom.append(breakpoint, template.icon);
            dom.append(breakpoint, template.checkbox);
            const inputBoxContainer = dom.append(breakpoint, $('.inputBoxContainer'));
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, {
                placeholder: nls.localize('functionBreakpointPlaceholder', "Function to break on"),
                ariaLabel: nls.localize('functionBreakPointInputAriaLabel', "Type function breakpoint")
            });
            const styler = styler_1.attachInputBoxStyler(inputBox, this.themeService);
            const toDispose = [inputBox, styler];
            const wrapUp = (renamed) => {
                if (!template.reactedOnEvent) {
                    template.reactedOnEvent = true;
                    this.debugService.getViewModel().setSelectedFunctionBreakpoint(undefined);
                    if (inputBox.value && (renamed || template.breakpoint.name)) {
                        this.debugService.renameFunctionBreakpoint(template.breakpoint.getId(), renamed ? inputBox.value : template.breakpoint.name);
                    }
                    else {
                        this.debugService.removeFunctionBreakpoints(template.breakpoint.getId());
                    }
                }
            };
            toDispose.push(dom.addStandardDisposableListener(inputBox.inputElement, 'keydown', (e) => {
                const isEscape = e.equals(9 /* Escape */);
                const isEnter = e.equals(3 /* Enter */);
                if (isEscape || isEnter) {
                    e.preventDefault();
                    e.stopPropagation();
                    wrapUp(isEnter);
                }
            }));
            toDispose.push(dom.addDisposableListener(inputBox.inputElement, 'blur', () => {
                // Need to react with a timeout on the blur event due to possible concurent splices #56443
                setTimeout(() => {
                    if (!template.breakpoint.name) {
                        wrapUp(true);
                    }
                });
            }));
            template.inputBox = inputBox;
            template.toDispose = toDispose;
            return template;
        }
        renderElement(functionBreakpoint, _index, data) {
            data.breakpoint = functionBreakpoint;
            data.reactedOnEvent = false;
            const { className, message } = getBreakpointMessageAndClassName(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), functionBreakpoint, this.labelService);
            data.icon.className = `codicon ${className}`;
            data.icon.title = message ? message : '';
            data.checkbox.checked = functionBreakpoint.enabled;
            data.checkbox.disabled = true;
            data.inputBox.value = functionBreakpoint.name || '';
            setTimeout(() => {
                data.inputBox.focus();
                data.inputBox.select();
            }, 0);
        }
        disposeTemplate(templateData) {
            lifecycle_1.dispose(templateData.toDispose);
        }
    }
    FunctionBreakpointInputRenderer.ID = 'functionbreakpointinput';
    class BreakpointsAccessibilityProvider {
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return nls.localize('breakpoints', "Breakpoints");
        }
        getRole() {
            return 'checkbox';
        }
        isChecked(breakpoint) {
            return breakpoint.enabled;
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.ExceptionBreakpoint) {
                return element.toString();
            }
            const { message } = getBreakpointMessageAndClassName(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), element, this.labelService);
            const toString = element.toString();
            return message ? `${toString}, ${message}` : toString;
        }
    }
    function openBreakpointSource(breakpoint, sideBySide, preserveFocus, debugService, editorService) {
        if (breakpoint.uri.scheme === debug_1.DEBUG_SCHEME && debugService.state === 0 /* Inactive */) {
            return Promise.resolve(undefined);
        }
        const selection = breakpoint.endLineNumber ? {
            startLineNumber: breakpoint.lineNumber,
            endLineNumber: breakpoint.endLineNumber,
            startColumn: breakpoint.column || 1,
            endColumn: breakpoint.endColumn || 1073741824 /* MAX_SAFE_SMALL_INTEGER */
        } : {
            startLineNumber: breakpoint.lineNumber,
            startColumn: breakpoint.column || 1,
            endLineNumber: breakpoint.lineNumber,
            endColumn: breakpoint.column || 1073741824 /* MAX_SAFE_SMALL_INTEGER */
        };
        return editorService.openEditor({
            resource: breakpoint.uri,
            options: {
                preserveFocus,
                selection,
                revealIfOpened: true,
                selectionRevealType: 1 /* CenterIfOutsideViewport */,
                pinned: !preserveFocus
            }
        }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
    }
    exports.openBreakpointSource = openBreakpointSource;
    function getBreakpointMessageAndClassName(state, breakpointsActivated, breakpoint, labelService) {
        const debugActive = state === 3 /* Running */ || state === 2 /* Stopped */;
        if (!breakpoint.enabled || !breakpointsActivated) {
            return {
                className: breakpoint instanceof debugModel_1.DataBreakpoint ? 'codicon-debug-breakpoint-data-disabled' : breakpoint instanceof debugModel_1.FunctionBreakpoint ? 'codicon-debug-breakpoint-function-disabled' : breakpoint.logMessage ? 'codicon-debug-breakpoint-log-disabled' : 'codicon-debug-breakpoint-disabled',
                message: breakpoint.logMessage ? nls.localize('disabledLogpoint', "Disabled Logpoint") : nls.localize('disabledBreakpoint', "Disabled Breakpoint"),
            };
        }
        const appendMessage = (text) => {
            return ('message' in breakpoint && breakpoint.message) ? text.concat(', ' + breakpoint.message) : text;
        };
        if (debugActive && !breakpoint.verified) {
            return {
                className: breakpoint instanceof debugModel_1.DataBreakpoint ? 'codicon-debug-breakpoint-data-unverified' : breakpoint instanceof debugModel_1.FunctionBreakpoint ? 'codicon-debug-breakpoint-function-unverified' : breakpoint.logMessage ? 'codicon-debug-breakpoint-log-unverified' : 'codicon-debug-breakpoint-unverified',
                message: ('message' in breakpoint && breakpoint.message) ? breakpoint.message : (breakpoint.logMessage ? nls.localize('unverifiedLogpoint', "Unverified Logpoint") : nls.localize('unverifiedBreakopint', "Unverified Breakpoint")),
            };
        }
        if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    className: 'codicon-debug-breakpoint-function-unverified',
                    message: nls.localize('functionBreakpointUnsupported', "Function breakpoints not supported by this debug type"),
                };
            }
            return {
                className: 'codicon-debug-breakpoint-function',
                message: breakpoint.message || nls.localize('functionBreakpoint', "Function Breakpoint")
            };
        }
        if (breakpoint instanceof debugModel_1.DataBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    className: 'codicon-debug-breakpoint-data-unverified',
                    message: nls.localize('dataBreakpointUnsupported', "Data breakpoints not supported by this debug type"),
                };
            }
            return {
                className: 'codicon-debug-breakpoint-data',
                message: breakpoint.message || nls.localize('dataBreakpoint', "Data Breakpoint")
            };
        }
        if (breakpoint.logMessage || breakpoint.condition || breakpoint.hitCondition) {
            const messages = [];
            if (!breakpoint.supported) {
                return {
                    className: 'codicon-debug-breakpoint-unsupported',
                    message: nls.localize('breakpointUnsupported', "Breakpoints of this type are not supported by the debugger"),
                };
            }
            if (breakpoint.logMessage) {
                messages.push(nls.localize('logMessage', "Log Message: {0}", breakpoint.logMessage));
            }
            if (breakpoint.condition) {
                messages.push(nls.localize('expression', "Expression: {0}", breakpoint.condition));
            }
            if (breakpoint.hitCondition) {
                messages.push(nls.localize('hitCount', "Hit Count: {0}", breakpoint.hitCondition));
            }
            return {
                className: breakpoint.logMessage ? 'codicon-debug-breakpoint-log' : 'codicon-debug-breakpoint-conditional',
                message: appendMessage(messages.join('\n'))
            };
        }
        const message = ('message' in breakpoint && breakpoint.message) ? breakpoint.message : breakpoint instanceof debugModel_1.Breakpoint && labelService ? labelService.getUriLabel(breakpoint.uri) : nls.localize('breakpoint', "Breakpoint");
        return {
            className: 'codicon-debug-breakpoint',
            message
        };
    }
    exports.getBreakpointMessageAndClassName = getBreakpointMessageAndClassName;
});
//# __sourceMappingURL=breakpointsView.js.map