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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/workbench/browser/viewlet", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/base/common/actions", "vs/workbench/contrib/debug/browser/debugActions", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/list/browser/listService", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/base/common/types"], function (require, exports, nls, async_1, dom, viewlet_1, debug_1, debugModel_1, contextView_1, keybinding_1, baseDebugView_1, actions_1, debugActions_1, actionbar_1, configuration_1, viewPaneContainer_1, instantiation_1, event_1, listService_1, filters_1, highlightedLabel_1, clipboardService_1, contextkey_1, lifecycle_1, views_1, opener_1, themeService_1, telemetry_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VariablesRenderer = exports.VariablesDataSource = exports.VariablesView = exports.variableSetEmitter = void 0;
    const $ = dom.$;
    let forgetScopes = true;
    exports.variableSetEmitter = new event_1.Emitter();
    let VariablesView = class VariablesView extends viewPaneContainer_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, configurationService, instantiationService, viewDescriptorService, clipboardService, contextKeyService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.clipboardService = clipboardService;
            this.needsRefresh = false;
            this.savedViewState = new Map();
            this.autoExpandedScopes = new Set();
            // Use scheduler to prevent unnecessary flashing
            this.onFocusStackFrameScheduler = new async_1.RunOnceScheduler(async () => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                this.needsRefresh = false;
                const input = this.tree.getInput();
                if (input) {
                    this.savedViewState.set(input.getId(), this.tree.getViewState());
                }
                if (!stackFrame) {
                    await this.tree.setInput(null);
                    return;
                }
                const viewState = this.savedViewState.get(stackFrame.getId());
                await this.tree.setInput(stackFrame, viewState);
                // Automatically expand the first scope if it is not expensive and if all scopes are collapsed
                const scopes = await stackFrame.getScopes();
                const toExpand = scopes.find(s => !s.expensive);
                if (toExpand && (scopes.every(s => this.tree.isCollapsed(s)) || !this.autoExpandedScopes.has(toExpand.getId()))) {
                    this.autoExpandedScopes.add(toExpand.getId());
                    await this.tree.expand(toExpand);
                }
            }, 400);
        }
        renderBody(container) {
            super.renderBody(container);
            dom.addClass(this.element, 'debug-pane');
            dom.addClass(container, 'debug-variables');
            const treeContainer = baseDebugView_1.renderViewTree(container);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'VariablesView', treeContainer, new VariablesDelegate(), [this.instantiationService.createInstance(VariablesRenderer), new ScopesRenderer(), new ScopeErrorRenderer()], new VariablesDataSource(), {
                accessibilityProvider: new VariablesAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this.tree.setInput(types_1.withUndefinedAsNull(this.debugService.getViewModel().focusedStackFrame));
            debug_1.CONTEXT_VARIABLES_FOCUSED.bindTo(this.tree.contextKeyService);
            this._register(this.debugService.getViewModel().onDidFocusStackFrame(sf => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                // Refresh the tree immediately if the user explictly changed stack frames.
                // Otherwise postpone the refresh until user stops stepping.
                const timeout = sf.explicit ? 0 : undefined;
                this.onFocusStackFrameScheduler.schedule(timeout);
            }));
            this._register(exports.variableSetEmitter.event(() => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (stackFrame && forgetScopes) {
                    stackFrame.forgetScopes();
                }
                forgetScopes = true;
                this.tree.updateChildren();
            }));
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.tree.onContextMenu(async (e) => await this.onContextMenu(e)));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onFocusStackFrameScheduler.schedule();
                }
            }));
            let horizontalScrolling;
            this._register(this.debugService.getViewModel().onDidSelectExpression(e => {
                if (e instanceof debugModel_1.Variable) {
                    horizontalScrolling = this.tree.options.horizontalScrolling;
                    if (horizontalScrolling) {
                        this.tree.updateOptions({ horizontalScrolling: false });
                    }
                    this.tree.rerender(e);
                }
                else if (!e && horizontalScrolling !== undefined) {
                    this.tree.updateOptions({ horizontalScrolling: horizontalScrolling });
                    horizontalScrolling = undefined;
                }
            }));
            this._register(this.debugService.onDidEndSession(() => {
                this.savedViewState.clear();
                this.autoExpandedScopes.clear();
            }));
        }
        getActions() {
            return [new viewlet_1.CollapseAction(() => this.tree, true, 'explorer-action codicon-collapse-all')];
        }
        layoutBody(width, height) {
            super.layoutBody(height, width);
            this.tree.layout(width, height);
        }
        focus() {
            this.tree.domFocus();
        }
        onMouseDblClick(e) {
            const session = this.debugService.getViewModel().focusedSession;
            if (session && e.element instanceof debugModel_1.Variable && session.capabilities.supportsSetVariable) {
                this.debugService.getViewModel().setSelectedExpression(e.element);
            }
        }
        async onContextMenu(e) {
            const variable = e.element;
            if (variable instanceof debugModel_1.Variable && !!variable.value) {
                const actions = [];
                const session = this.debugService.getViewModel().focusedSession;
                if (session && session.capabilities.supportsSetVariable) {
                    actions.push(new actions_1.Action('workbench.setValue', nls.localize('setValue', "Set Value"), undefined, true, () => {
                        this.debugService.getViewModel().setSelectedExpression(variable);
                        return Promise.resolve();
                    }));
                }
                actions.push(this.instantiationService.createInstance(debugActions_1.CopyValueAction, debugActions_1.CopyValueAction.ID, debugActions_1.CopyValueAction.LABEL, variable, 'variables'));
                if (variable.evaluateName) {
                    actions.push(new actions_1.Action('debug.copyEvaluatePath', nls.localize('copyAsExpression', "Copy as Expression"), undefined, true, () => {
                        return this.clipboardService.writeText(variable.evaluateName);
                    }));
                    actions.push(new actionbar_1.Separator());
                    actions.push(new actions_1.Action('debug.addToWatchExpressions', nls.localize('addToWatchExpressions', "Add to Watch"), undefined, true, () => {
                        this.debugService.addWatchExpression(variable.evaluateName);
                        return Promise.resolve(undefined);
                    }));
                }
                if (session && session.capabilities.supportsDataBreakpoints) {
                    const response = await session.dataBreakpointInfo(variable.name, variable.parent.reference);
                    const dataid = response === null || response === void 0 ? void 0 : response.dataId;
                    if (response && dataid) {
                        actions.push(new actionbar_1.Separator());
                        actions.push(new actions_1.Action('debug.breakWhenValueChanges', nls.localize('breakWhenValueChanges', "Break When Value Changes"), undefined, true, () => {
                            return this.debugService.addDataBreakpoint(response.description, dataid, !!response.canPersist, response.accessTypes);
                        }));
                    }
                }
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions,
                    getActionsContext: () => variable,
                    onHide: () => lifecycle_1.dispose(actions)
                });
            }
        }
    };
    VariablesView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, clipboardService_1.IClipboardService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, opener_1.IOpenerService),
        __param(10, themeService_1.IThemeService),
        __param(11, telemetry_1.ITelemetryService)
    ], VariablesView);
    exports.VariablesView = VariablesView;
    function isStackFrame(obj) {
        return obj instanceof debugModel_1.StackFrame;
    }
    class VariablesDataSource {
        hasChildren(element) {
            if (!element) {
                return false;
            }
            if (isStackFrame(element)) {
                return true;
            }
            return element.hasChildren;
        }
        getChildren(element) {
            if (isStackFrame(element)) {
                return element.getScopes();
            }
            return element.getChildren();
        }
    }
    exports.VariablesDataSource = VariablesDataSource;
    class VariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.ErrorScope) {
                return ScopeErrorRenderer.ID;
            }
            if (element instanceof debugModel_1.Scope) {
                return ScopesRenderer.ID;
            }
            return VariablesRenderer.ID;
        }
    }
    class ScopesRenderer {
        get templateId() {
            return ScopesRenderer.ID;
        }
        renderTemplate(container) {
            const name = dom.append(container, $('.scope'));
            const label = new highlightedLabel_1.HighlightedLabel(name, false);
            return { name, label };
        }
        renderElement(element, index, templateData) {
            templateData.label.set(element.element.name, filters_1.createMatches(element.filterData));
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ScopesRenderer.ID = 'scope';
    class ScopeErrorRenderer {
        get templateId() {
            return ScopeErrorRenderer.ID;
        }
        renderTemplate(container) {
            const wrapper = dom.append(container, $('.scope'));
            const error = dom.append(wrapper, $('.error'));
            return { error };
        }
        renderElement(element, index, templateData) {
            templateData.error.innerText = element.element.name;
        }
        disposeTemplate() {
            // noop
        }
    }
    ScopeErrorRenderer.ID = 'scopeError';
    class VariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        get templateId() {
            return VariablesRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            baseDebugView_1.renderVariable(expression, data, true, highlights);
        }
        getInputBoxOptions(expression) {
            const variable = expression;
            return {
                initialValue: expression.value,
                ariaLabel: nls.localize('variableValueAriaLabel', "Type new variable value"),
                validationOptions: {
                    validation: () => variable.errorMessage ? ({ content: variable.errorMessage }) : null
                },
                onFinish: (value, success) => {
                    variable.errorMessage = undefined;
                    if (success && variable.value !== value) {
                        variable.setVariable(value)
                            // Need to force watch expressions and variables to update since a variable change can have an effect on both
                            .then(() => {
                            // Do not refresh scopes due to a node limitation #15520
                            forgetScopes = false;
                            exports.variableSetEmitter.fire();
                        });
                    }
                }
            };
        }
    }
    exports.VariablesRenderer = VariablesRenderer;
    VariablesRenderer.ID = 'variable';
    class VariablesAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('variablesAriaTreeLabel', "Debug Variables");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Scope) {
                return nls.localize('variableScopeAriaLabel', "Scope {0}", element.name);
            }
            if (element instanceof debugModel_1.Variable) {
                return nls.localize({ key: 'variableAriaLabel', comment: ['Placeholders are variable name and variable value respectivly. They should not be translated.'] }, "{0}, value {1}", element.name, element.value);
            }
            return null;
        }
    }
});
//# __sourceMappingURL=variablesView.js.map