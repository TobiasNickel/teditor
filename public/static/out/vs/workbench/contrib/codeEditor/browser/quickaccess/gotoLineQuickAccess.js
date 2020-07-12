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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/editor/contrib/quickAccess/gotoLineQuickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/platform/configuration/common/configuration", "vs/base/common/actions", "vs/workbench/common/actions", "vs/platform/actions/common/actions"], function (require, exports, nls_1, quickInput_1, editorService_1, gotoLineQuickAccess_1, platform_1, quickAccess_1, configuration_1, actions_1, actions_2, actions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineAction = exports.GotoLineQuickAccessProvider = void 0;
    let GotoLineQuickAccessProvider = class GotoLineQuickAccessProvider extends gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider {
        constructor(editorService, configurationService) {
            super();
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.onDidActiveTextEditorControlChange = this.editorService.onDidActiveEditorChange;
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench.editor;
            return {
                openEditorPinned: !editorConfig.enablePreviewFromQuickOpen,
            };
        }
        get activeTextEditorControl() {
            return this.editorService.activeTextEditorControl;
        }
        gotoLocation(editor, options) {
            // Check for sideBySide use
            if ((options.keyMods.ctrlCmd || options.forceSideBySide) && this.editorService.activeEditor) {
                this.editorService.openEditor(this.editorService.activeEditor, {
                    selection: options.range,
                    pinned: options.keyMods.alt || this.configuration.openEditorPinned,
                    preserveFocus: options.preserveFocus
                }, editorService_1.SIDE_GROUP);
            }
            // Otherwise let parent handle it
            else {
                super.gotoLocation(editor, options);
            }
        }
    };
    GotoLineQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, configuration_1.IConfigurationService)
    ], GotoLineQuickAccessProvider);
    exports.GotoLineQuickAccessProvider = GotoLineQuickAccessProvider;
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: GotoLineQuickAccessProvider,
        prefix: gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider.PREFIX,
        placeholder: nls_1.localize('gotoLineQuickAccessPlaceholder', "Type the line number and optional column to go to (e.g. 42:5 for line 42 and column 5)."),
        helpEntries: [{ description: nls_1.localize('gotoLineQuickAccess', "Go to Line/Column"), needsEditor: true }]
    });
    let GotoLineAction = class GotoLineAction extends actions_1.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(GotoLineQuickAccessProvider.PREFIX);
        }
    };
    GotoLineAction.ID = 'workbench.action.gotoLine';
    GotoLineAction.LABEL = nls_1.localize('gotoLine', "Go to Line/Column...");
    GotoLineAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], GotoLineAction);
    exports.GotoLineAction = GotoLineAction;
    platform_1.Registry.as(actions_2.Extensions.WorkbenchActions).registerWorkbenchAction(actions_3.SyncActionDescriptor.from(GotoLineAction, {
        primary: 2048 /* CtrlCmd */ | 37 /* KEY_G */,
        mac: { primary: 256 /* WinCtrl */ | 37 /* KEY_G */ }
    }), 'Go to Line/Column...');
});
//# __sourceMappingURL=gotoLineQuickAccess.js.map