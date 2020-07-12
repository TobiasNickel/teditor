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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/workbench/browser/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/base/common/platform", "vs/editor/browser/editorBrowser", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle"], function (require, exports, themeService_1, keybinding_1, contextView_1, configuration_1, contextkey_1, nls_1, debugActions_1, debug_1, editorService_1, viewPaneContainer_1, instantiation_1, views_1, platform_1, opener_1, contextkeys_1, workspaceActions_1, platform_2, editorBrowser_1, storage_1, telemetry_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WelcomeView = void 0;
    const debugStartLanguageKey = 'debugStartLanguage';
    const CONTEXT_DEBUG_START_LANGUAGE = new contextkey_1.RawContextKey(debugStartLanguageKey, undefined);
    const CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR = new contextkey_1.RawContextKey('debuggerInterestedInActiveEditor', false);
    let WelcomeView = class WelcomeView extends viewPaneContainer_1.ViewPane {
        constructor(options, themeService, keybindingService, contextMenuService, configurationService, contextKeyService, debugService, editorService, instantiationService, viewDescriptorService, openerService, storageSevice, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.editorService = editorService;
            this.debugStartLanguageContext = CONTEXT_DEBUG_START_LANGUAGE.bindTo(contextKeyService);
            this.debuggerInterestedContext = CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR.bindTo(contextKeyService);
            const lastSetLanguage = storageSevice.get(debugStartLanguageKey, 1 /* WORKSPACE */);
            this.debugStartLanguageContext.set(lastSetLanguage);
            const setContextKey = () => {
                const editorControl = this.editorService.activeTextEditorControl;
                if (editorBrowser_1.isCodeEditor(editorControl)) {
                    const model = editorControl.getModel();
                    const language = model ? model.getLanguageIdentifier().language : undefined;
                    if (language && this.debugService.getConfigurationManager().isDebuggerInterestedInLanguage(language)) {
                        this.debugStartLanguageContext.set(language);
                        this.debuggerInterestedContext.set(true);
                        storageSevice.store(debugStartLanguageKey, language, 1 /* WORKSPACE */);
                        return;
                    }
                }
                this.debuggerInterestedContext.set(false);
            };
            const disposables = new lifecycle_1.DisposableStore();
            this._register(disposables);
            this._register(editorService.onDidActiveEditorChange(() => {
                disposables.clear();
                const editorControl = this.editorService.activeTextEditorControl;
                if (editorBrowser_1.isCodeEditor(editorControl)) {
                    disposables.add(editorControl.onDidChangeModelLanguage(setContextKey));
                }
                setContextKey();
            }));
            this._register(this.debugService.getConfigurationManager().onDidRegisterDebugger(setContextKey));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    setContextKey();
                }
            }));
            setContextKey();
            const debugKeybinding = this.keybindingService.lookupKeybinding(debugActions_1.StartAction.ID);
            debugKeybindingLabel = debugKeybinding ? ` (${debugKeybinding.getLabel()})` : '';
        }
        shouldShowWelcome() {
            return true;
        }
    };
    WelcomeView.ID = 'workbench.debug.welcome';
    WelcomeView.LABEL = nls_1.localize('run', "Run");
    WelcomeView = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, debug_1.IDebugService),
        __param(7, editorService_1.IEditorService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, opener_1.IOpenerService),
        __param(11, storage_1.IStorageService),
        __param(12, telemetry_1.ITelemetryService)
    ], WelcomeView);
    exports.WelcomeView = WelcomeView;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: nls_1.localize({ key: 'openAFileWhichCanBeDebugged', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "[Open a file](command:{0}) which can be debugged or run.", platform_2.isMacintosh ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFileAction.ID),
        when: CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR.toNegated()
    });
    let debugKeybindingLabel = '';
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: nls_1.localize({ key: 'runAndDebugAction', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "[Run and Debug{0}](command:{1})", debugKeybindingLabel, debugActions_1.StartAction.ID),
        preconditions: [CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR]
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: nls_1.localize({ key: 'detectThenRunAndDebug', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "[Show](command:{0}) all automatic debug configurations.", debugActions_1.SelectAndStartAction.ID),
        priority: views_1.ViewContentPriority.Lowest
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: nls_1.localize({ key: 'customizeRunAndDebug', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "To customize Run and Debug [create a launch.json file](command:{0}).", debugActions_1.ConfigureAction.ID),
        when: contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: nls_1.localize({ key: 'customizeRunAndDebugOpenFolder', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "To customize Run and Debug, [open a folder](command:{0}) and create a launch.json file.", platform_2.isMacintosh ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID),
        when: contextkeys_1.WorkbenchStateContext.isEqualTo('empty')
    });
});
//# __sourceMappingURL=welcomeView.js.map