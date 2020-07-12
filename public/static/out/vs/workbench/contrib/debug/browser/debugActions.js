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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/editor/common/editorService", "vs/platform/notification/common/notification", "vs/platform/clipboard/common/clipboardService", "vs/platform/quickinput/common/quickInput", "vs/base/common/objects"], function (require, exports, nls, actions_1, keybinding_1, workspace_1, debug_1, debugModel_1, editorService_1, notification_1, clipboardService_1, quickInput_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyValueAction = exports.FocusSessionAction = exports.RemoveAllWatchExpressionsAction = exports.AddWatchExpressionAction = exports.AddFunctionBreakpointAction = exports.ReapplyBreakpointsAction = exports.ToggleBreakpointsActivatedAction = exports.DisableAllBreakpointsAction = exports.EnableAllBreakpointsAction = exports.RemoveAllBreakpointsAction = exports.RemoveBreakpointAction = exports.SelectAndStartAction = exports.RunAction = exports.StartAction = exports.ConfigureAction = exports.AbstractDebugAction = void 0;
    let AbstractDebugAction = class AbstractDebugAction extends actions_1.Action {
        constructor(id, label, cssClass, debugService, keybindingService) {
            super(id, label, cssClass, false);
            this.debugService = debugService;
            this.keybindingService = keybindingService;
            this._register(this.debugService.onDidChangeState(state => this.updateEnablement(state)));
            this.updateLabel(label);
            this.updateEnablement();
        }
        run(_) {
            throw new Error('implement me');
        }
        get tooltip() {
            const keybinding = this.keybindingService.lookupKeybinding(this.id);
            const keybindingLabel = keybinding && keybinding.getLabel();
            return keybindingLabel ? `${this.label} (${keybindingLabel})` : this.label;
        }
        updateLabel(newLabel) {
            this.label = newLabel;
        }
        updateEnablement(state = this.debugService.state) {
            this.enabled = this.isEnabled(state);
        }
        isEnabled(_) {
            return true;
        }
    };
    AbstractDebugAction = __decorate([
        __param(3, debug_1.IDebugService),
        __param(4, keybinding_1.IKeybindingService)
    ], AbstractDebugAction);
    exports.AbstractDebugAction = AbstractDebugAction;
    let ConfigureAction = class ConfigureAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, notificationService, contextService, quickInputService) {
            super(id, label, 'debug-action codicon codicon-gear', debugService, keybindingService);
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.quickInputService = quickInputService;
            this._register(debugService.getConfigurationManager().onDidSelectConfiguration(() => this.updateClass()));
            this.updateClass();
        }
        get tooltip() {
            if (this.debugService.getConfigurationManager().selectedConfiguration.name) {
                return ConfigureAction.LABEL;
            }
            return nls.localize('launchJsonNeedsConfigurtion', "Configure or Fix 'launch.json'");
        }
        updateClass() {
            const configurationManager = this.debugService.getConfigurationManager();
            this.class = configurationManager.selectedConfiguration.name ? 'debug-action codicon codicon-gear' : 'debug-action codicon codicon-gear notification';
        }
        async run() {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */ || this.contextService.getWorkspace().folders.length === 0) {
                this.notificationService.info(nls.localize('noFolderDebugConfig', "Please first open a folder in order to do advanced debug configuration."));
                return;
            }
            const configurationManager = this.debugService.getConfigurationManager();
            let launch;
            if (configurationManager.selectedConfiguration.name) {
                launch = configurationManager.selectedConfiguration.launch;
            }
            else {
                const launches = configurationManager.getLaunches().filter(l => !l.hidden);
                if (launches.length === 1) {
                    launch = launches[0];
                }
                else {
                    const picks = launches.map(l => ({ label: l.name, launch: l }));
                    const picked = await this.quickInputService.pick(picks, { activeItem: picks[0], placeHolder: nls.localize('selectWorkspaceFolder', "Select a workspace folder to create a launch.json file in or add it to the workspace config file") });
                    if (picked) {
                        launch = picked.launch;
                    }
                }
            }
            if (launch) {
                return launch.openConfigFile(false);
            }
        }
    };
    ConfigureAction.ID = 'workbench.action.debug.configure';
    ConfigureAction.LABEL = nls.localize('openLaunchJson', "Open {0}", 'launch.json');
    ConfigureAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, quickInput_1.IQuickInputService)
    ], ConfigureAction);
    exports.ConfigureAction = ConfigureAction;
    let StartAction = class StartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, contextService) {
            super(id, label, 'debug-action start', debugService, keybindingService);
            this.contextService = contextService;
            this._register(this.debugService.getConfigurationManager().onDidSelectConfiguration(() => this.updateEnablement()));
            this._register(this.debugService.onDidNewSession(() => this.updateEnablement()));
            this._register(this.debugService.onDidEndSession(() => this.updateEnablement()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateEnablement()));
        }
        async run() {
            let { launch, name, config } = this.debugService.getConfigurationManager().selectedConfiguration;
            const clonedConfig = objects_1.deepClone(config);
            return this.debugService.startDebugging(launch, clonedConfig || name, { noDebug: this.isNoDebug() });
        }
        isNoDebug() {
            return false;
        }
        static isEnabled(debugService) {
            const sessions = debugService.getModel().getSessions();
            if (debugService.state === 1 /* Initializing */) {
                return false;
            }
            let { name, config } = debugService.getConfigurationManager().selectedConfiguration;
            let nameToStart = name || (config === null || config === void 0 ? void 0 : config.name);
            if (sessions.some(s => s.configuration.name === nameToStart)) {
                // There is already a debug session running and we do not have any launch configuration selected
                return false;
            }
            return true;
        }
        // Disabled if the launch drop down shows the launch config that is already running.
        isEnabled() {
            return StartAction.isEnabled(this.debugService);
        }
    };
    StartAction.ID = 'workbench.action.debug.start';
    StartAction.LABEL = nls.localize('startDebug', "Start Debugging");
    StartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], StartAction);
    exports.StartAction = StartAction;
    class RunAction extends StartAction {
        isNoDebug() {
            return true;
        }
    }
    exports.RunAction = RunAction;
    RunAction.ID = 'workbench.action.debug.run';
    RunAction.LABEL = nls.localize('startWithoutDebugging', "Start Without Debugging");
    let SelectAndStartAction = class SelectAndStartAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, quickInputService) {
            super(id, label, '', debugService, keybindingService);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show('debug ');
        }
    };
    SelectAndStartAction.ID = 'workbench.action.debug.selectandstart';
    SelectAndStartAction.LABEL = nls.localize('selectAndStartDebugging', "Select and Start Debugging");
    SelectAndStartAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, quickInput_1.IQuickInputService)
    ], SelectAndStartAction);
    exports.SelectAndStartAction = SelectAndStartAction;
    let RemoveBreakpointAction = class RemoveBreakpointAction extends actions_1.Action {
        constructor(id, label, debugService) {
            super(id, label, 'debug-action remove');
            this.debugService = debugService;
        }
        run(breakpoint) {
            return breakpoint instanceof debugModel_1.Breakpoint ? this.debugService.removeBreakpoints(breakpoint.getId())
                : breakpoint instanceof debugModel_1.FunctionBreakpoint ? this.debugService.removeFunctionBreakpoints(breakpoint.getId()) : this.debugService.removeDataBreakpoints(breakpoint.getId());
        }
    };
    RemoveBreakpointAction.ID = 'workbench.debug.viewlet.action.removeBreakpoint';
    RemoveBreakpointAction.LABEL = nls.localize('removeBreakpoint', "Remove Breakpoint");
    RemoveBreakpointAction = __decorate([
        __param(2, debug_1.IDebugService)
    ], RemoveBreakpointAction);
    exports.RemoveBreakpointAction = RemoveBreakpointAction;
    let RemoveAllBreakpointsAction = class RemoveAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action codicon-close-all', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return Promise.all([this.debugService.removeBreakpoints(), this.debugService.removeFunctionBreakpoints(), this.debugService.removeDataBreakpoints()]);
        }
        isEnabled(_) {
            const model = this.debugService.getModel();
            return (model.getBreakpoints().length > 0 || model.getFunctionBreakpoints().length > 0 || model.getDataBreakpoints().length > 0);
        }
    };
    RemoveAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.removeAllBreakpoints';
    RemoveAllBreakpointsAction.LABEL = nls.localize('removeAllBreakpoints', "Remove All Breakpoints");
    RemoveAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveAllBreakpointsAction);
    exports.RemoveAllBreakpointsAction = RemoveAllBreakpointsAction;
    let EnableAllBreakpointsAction = class EnableAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action enable-all-breakpoints', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.enableOrDisableBreakpoints(true);
        }
        isEnabled(_) {
            const model = this.debugService.getModel();
            return model.getBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getExceptionBreakpoints()).some(bp => !bp.enabled);
        }
    };
    EnableAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.enableAllBreakpoints';
    EnableAllBreakpointsAction.LABEL = nls.localize('enableAllBreakpoints', "Enable All Breakpoints");
    EnableAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], EnableAllBreakpointsAction);
    exports.EnableAllBreakpointsAction = EnableAllBreakpointsAction;
    let DisableAllBreakpointsAction = class DisableAllBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action disable-all-breakpoints', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.enableOrDisableBreakpoints(false);
        }
        isEnabled(_) {
            const model = this.debugService.getModel();
            return model.getBreakpoints().concat(model.getFunctionBreakpoints()).concat(model.getExceptionBreakpoints()).some(bp => bp.enabled);
        }
    };
    DisableAllBreakpointsAction.ID = 'workbench.debug.viewlet.action.disableAllBreakpoints';
    DisableAllBreakpointsAction.LABEL = nls.localize('disableAllBreakpoints', "Disable All Breakpoints");
    DisableAllBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], DisableAllBreakpointsAction);
    exports.DisableAllBreakpointsAction = DisableAllBreakpointsAction;
    let ToggleBreakpointsActivatedAction = class ToggleBreakpointsActivatedAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action codicon-activate-breakpoints', debugService, keybindingService);
            this.updateLabel(this.debugService.getModel().areBreakpointsActivated() ? ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL : ToggleBreakpointsActivatedAction.ACTIVATE_LABEL);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => {
                this.updateLabel(this.debugService.getModel().areBreakpointsActivated() ? ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL : ToggleBreakpointsActivatedAction.ACTIVATE_LABEL);
                this.updateEnablement();
            }));
        }
        run() {
            return this.debugService.setBreakpointsActivated(!this.debugService.getModel().areBreakpointsActivated());
        }
        isEnabled(_) {
            return !!(this.debugService.getModel().getFunctionBreakpoints().length || this.debugService.getModel().getBreakpoints().length || this.debugService.getModel().getDataBreakpoints().length);
        }
    };
    ToggleBreakpointsActivatedAction.ID = 'workbench.debug.viewlet.action.toggleBreakpointsActivatedAction';
    ToggleBreakpointsActivatedAction.ACTIVATE_LABEL = nls.localize('activateBreakpoints', "Activate Breakpoints");
    ToggleBreakpointsActivatedAction.DEACTIVATE_LABEL = nls.localize('deactivateBreakpoints', "Deactivate Breakpoints");
    ToggleBreakpointsActivatedAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ToggleBreakpointsActivatedAction);
    exports.ToggleBreakpointsActivatedAction = ToggleBreakpointsActivatedAction;
    let ReapplyBreakpointsAction = class ReapplyBreakpointsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, '', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        run() {
            return this.debugService.setBreakpointsActivated(true);
        }
        isEnabled(state) {
            const model = this.debugService.getModel();
            return (state === 3 /* Running */ || state === 2 /* Stopped */) &&
                ((model.getFunctionBreakpoints().length + model.getBreakpoints().length + model.getExceptionBreakpoints().length + model.getDataBreakpoints().length) > 0);
        }
    };
    ReapplyBreakpointsAction.ID = 'workbench.debug.viewlet.action.reapplyBreakpointsAction';
    ReapplyBreakpointsAction.LABEL = nls.localize('reapplyAllBreakpoints', "Reapply All Breakpoints");
    ReapplyBreakpointsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], ReapplyBreakpointsAction);
    exports.ReapplyBreakpointsAction = ReapplyBreakpointsAction;
    let AddFunctionBreakpointAction = class AddFunctionBreakpointAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action codicon-add', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.updateEnablement()));
        }
        async run() {
            this.debugService.addFunctionBreakpoint();
        }
        isEnabled(_) {
            return !this.debugService.getViewModel().getSelectedFunctionBreakpoint()
                && this.debugService.getModel().getFunctionBreakpoints().every(fbp => !!fbp.name);
        }
    };
    AddFunctionBreakpointAction.ID = 'workbench.debug.viewlet.action.addFunctionBreakpointAction';
    AddFunctionBreakpointAction.LABEL = nls.localize('addFunctionBreakpoint', "Add Function Breakpoint");
    AddFunctionBreakpointAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], AddFunctionBreakpointAction);
    exports.AddFunctionBreakpointAction = AddFunctionBreakpointAction;
    let AddWatchExpressionAction = class AddWatchExpressionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action codicon-add', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeWatchExpressions(() => this.updateEnablement()));
            this._register(this.debugService.getViewModel().onDidSelectExpression(() => this.updateEnablement()));
        }
        async run() {
            this.debugService.addWatchExpression();
        }
        isEnabled(_) {
            const focusedExpression = this.debugService.getViewModel().getSelectedExpression();
            return this.debugService.getModel().getWatchExpressions().every(we => !!we.name && we !== focusedExpression);
        }
    };
    AddWatchExpressionAction.ID = 'workbench.debug.viewlet.action.addWatchExpression';
    AddWatchExpressionAction.LABEL = nls.localize('addWatchExpression', "Add Expression");
    AddWatchExpressionAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], AddWatchExpressionAction);
    exports.AddWatchExpressionAction = AddWatchExpressionAction;
    let RemoveAllWatchExpressionsAction = class RemoveAllWatchExpressionsAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService) {
            super(id, label, 'debug-action codicon-close-all', debugService, keybindingService);
            this._register(this.debugService.getModel().onDidChangeWatchExpressions(() => this.updateEnablement()));
        }
        async run() {
            this.debugService.removeWatchExpressions();
        }
        isEnabled(_) {
            return this.debugService.getModel().getWatchExpressions().length > 0;
        }
    };
    RemoveAllWatchExpressionsAction.ID = 'workbench.debug.viewlet.action.removeAllWatchExpressions';
    RemoveAllWatchExpressionsAction.LABEL = nls.localize('removeAllWatchExpressions', "Remove All Expressions");
    RemoveAllWatchExpressionsAction = __decorate([
        __param(2, debug_1.IDebugService), __param(3, keybinding_1.IKeybindingService)
    ], RemoveAllWatchExpressionsAction);
    exports.RemoveAllWatchExpressionsAction = RemoveAllWatchExpressionsAction;
    let FocusSessionAction = class FocusSessionAction extends AbstractDebugAction {
        constructor(id, label, debugService, keybindingService, editorService) {
            super(id, label, '', debugService, keybindingService);
            this.editorService = editorService;
        }
        async run(session) {
            await this.debugService.focusStackFrame(undefined, undefined, session, true);
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (stackFrame) {
                await stackFrame.openInEditor(this.editorService, true);
            }
        }
    };
    FocusSessionAction.ID = 'workbench.action.debug.focusProcess';
    FocusSessionAction.LABEL = nls.localize('focusSession', "Focus Session");
    FocusSessionAction = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, editorService_1.IEditorService)
    ], FocusSessionAction);
    exports.FocusSessionAction = FocusSessionAction;
    let CopyValueAction = class CopyValueAction extends actions_1.Action {
        constructor(id, label, value, context, debugService, clipboardService) {
            super(id, label);
            this.value = value;
            this.context = context;
            this.debugService = debugService;
            this.clipboardService = clipboardService;
            this._enabled = (this.value instanceof debugModel_1.Expression) || (this.value instanceof debugModel_1.Variable && !!this.value.evaluateName);
        }
        async run() {
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            const session = this.debugService.getViewModel().focusedSession;
            if (!stackFrame || !session) {
                return;
            }
            const context = session.capabilities.supportsClipboardContext ? 'clipboard' : this.context;
            const toEvaluate = this.value instanceof debugModel_1.Variable ? (this.value.evaluateName || this.value.value) : this.value.name;
            try {
                const evaluation = await session.evaluate(toEvaluate, stackFrame.frameId, context);
                this.clipboardService.writeText(evaluation.body.result);
            }
            catch (e) {
                this.clipboardService.writeText(typeof this.value === 'string' ? this.value : this.value.value);
            }
        }
    };
    CopyValueAction.ID = 'workbench.debug.viewlet.action.copyValue';
    CopyValueAction.LABEL = nls.localize('copyValue', "Copy Value");
    CopyValueAction = __decorate([
        __param(4, debug_1.IDebugService),
        __param(5, clipboardService_1.IClipboardService)
    ], CopyValueAction);
    exports.CopyValueAction = CopyValueAction;
});
//# __sourceMappingURL=debugActions.js.map