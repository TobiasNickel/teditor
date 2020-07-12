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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/base/common/actions", "vs/workbench/browser/quickaccess"], function (require, exports, nls_1, platform_1, actions_1, actions_2, keybindingsRegistry_1, quickInput_1, keybinding_1, commands_1, actions_3, quickaccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessNavigateNextAction = exports.BaseQuickAccessNavigateAction = void 0;
    //#region Quick access management commands and keys
    const globalQuickAccessKeybinding = {
        primary: 2048 /* CtrlCmd */ | 46 /* KEY_P */,
        secondary: [2048 /* CtrlCmd */ | 35 /* KEY_E */],
        mac: { primary: 2048 /* CtrlCmd */ | 46 /* KEY_P */, secondary: undefined }
    };
    const QUICKACCESS_ACTION_ID = 'workbench.action.quickOpen';
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: { id: QUICKACCESS_ACTION_ID, title: { value: nls_1.localize('quickOpen', "Go to File..."), original: 'Go to File...' } }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: QUICKACCESS_ACTION_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: globalQuickAccessKeybinding.primary,
        secondary: globalQuickAccessKeybinding.secondary,
        mac: globalQuickAccessKeybinding.mac
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.closeQuickOpen',
        weight: 200 /* WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 9 /* Escape */, secondary: [1024 /* Shift */ | 9 /* Escape */],
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.cancel();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.acceptSelectedQuickOpenItem',
        weight: 200 /* WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.accept();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.alternativeAcceptSelectedQuickOpenItem',
        weight: 200 /* WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.accept({ ctrlCmd: true, alt: false });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.focusQuickOpen',
        weight: 200 /* WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.focus();
        }
    });
    const quickAccessNavigateNextInFilePickerId = 'workbench.action.quickOpenNavigateNextInFilePicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInFilePickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigateNextInFilePickerId, true),
        when: quickaccess_1.defaultQuickAccessContext,
        primary: globalQuickAccessKeybinding.primary,
        secondary: globalQuickAccessKeybinding.secondary,
        mac: globalQuickAccessKeybinding.mac
    });
    const quickAccessNavigatePreviousInFilePickerId = 'workbench.action.quickOpenNavigatePreviousInFilePicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInFilePickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickaccess_1.getQuickNavigateHandler(quickAccessNavigatePreviousInFilePickerId, false),
        when: quickaccess_1.defaultQuickAccessContext,
        primary: globalQuickAccessKeybinding.primary | 1024 /* Shift */,
        secondary: [globalQuickAccessKeybinding.secondary[0] | 1024 /* Shift */],
        mac: {
            primary: globalQuickAccessKeybinding.mac.primary | 1024 /* Shift */,
            secondary: undefined
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.quickPickManyToggle',
        weight: 200 /* WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.toggle();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.quickInputBack',
        weight: 200 /* WorkbenchContrib */ + 50,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        win: { primary: 512 /* Alt */ | 15 /* LeftArrow */ },
        mac: { primary: 256 /* WinCtrl */ | 83 /* US_MINUS */ },
        linux: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 83 /* US_MINUS */ },
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.back();
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: QUICKACCESS_ACTION_ID,
        handler: async function (accessor, prefix) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(typeof prefix === 'string' ? prefix : undefined, { preserveValue: typeof prefix === 'string' /* preserve as is if provided */ });
        },
        description: {
            description: `Quick access`,
            args: [{
                    name: 'prefix',
                    schema: {
                        'type': 'string'
                    }
                }]
        }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.quickOpenPreviousEditor', async (accessor) => {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        quickInputService.quickAccess.show('', { itemActivation: quickInput_1.ItemActivation.SECOND });
    });
    //#endregion
    //#region Workbench actions
    let BaseQuickAccessNavigateAction = class BaseQuickAccessNavigateAction extends actions_3.Action {
        constructor(id, label, next, quickNavigate, quickInputService, keybindingService) {
            super(id, label);
            this.next = next;
            this.quickNavigate = quickNavigate;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
        }
        async run() {
            const keys = this.keybindingService.lookupKeybindings(this.id);
            const quickNavigate = this.quickNavigate ? { keybindings: keys } : undefined;
            this.quickInputService.navigate(this.next, quickNavigate);
        }
    };
    BaseQuickAccessNavigateAction = __decorate([
        __param(4, quickInput_1.IQuickInputService),
        __param(5, keybinding_1.IKeybindingService)
    ], BaseQuickAccessNavigateAction);
    exports.BaseQuickAccessNavigateAction = BaseQuickAccessNavigateAction;
    let QuickAccessNavigateNextAction = class QuickAccessNavigateNextAction extends BaseQuickAccessNavigateAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, true, true, quickInputService, keybindingService);
        }
    };
    QuickAccessNavigateNextAction.ID = 'workbench.action.quickOpenNavigateNext';
    QuickAccessNavigateNextAction.LABEL = nls_1.localize('quickNavigateNext', "Navigate Next in Quick Open");
    QuickAccessNavigateNextAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessNavigateNextAction);
    exports.QuickAccessNavigateNextAction = QuickAccessNavigateNextAction;
    let QuickAccessNavigatePreviousAction = class QuickAccessNavigatePreviousAction extends BaseQuickAccessNavigateAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, false, true, quickInputService, keybindingService);
        }
    };
    QuickAccessNavigatePreviousAction.ID = 'workbench.action.quickOpenNavigatePrevious';
    QuickAccessNavigatePreviousAction.LABEL = nls_1.localize('quickNavigatePrevious', "Navigate Previous in Quick Open");
    QuickAccessNavigatePreviousAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessNavigatePreviousAction);
    let QuickAccessSelectNextAction = class QuickAccessSelectNextAction extends BaseQuickAccessNavigateAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, true, false, quickInputService, keybindingService);
        }
    };
    QuickAccessSelectNextAction.ID = 'workbench.action.quickOpenSelectNext';
    QuickAccessSelectNextAction.LABEL = nls_1.localize('quickSelectNext', "Select Next in Quick Open");
    QuickAccessSelectNextAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessSelectNextAction);
    let QuickAccessSelectPreviousAction = class QuickAccessSelectPreviousAction extends BaseQuickAccessNavigateAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, false, false, quickInputService, keybindingService);
        }
    };
    QuickAccessSelectPreviousAction.ID = 'workbench.action.quickOpenSelectPrevious';
    QuickAccessSelectPreviousAction.LABEL = nls_1.localize('quickSelectPrevious', "Select Previous in Quick Open");
    QuickAccessSelectPreviousAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessSelectPreviousAction);
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(QuickAccessSelectNextAction, { primary: 0, mac: { primary: 256 /* WinCtrl */ | 44 /* KEY_N */ } }, quickaccess_1.inQuickPickContext, 200 /* WorkbenchContrib */ + 50), 'Select Next in Quick Open');
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(QuickAccessSelectPreviousAction, { primary: 0, mac: { primary: 256 /* WinCtrl */ | 46 /* KEY_P */ } }, quickaccess_1.inQuickPickContext, 200 /* WorkbenchContrib */ + 50), 'Select Previous in Quick Open');
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(QuickAccessNavigateNextAction), 'Navigate Next in Quick Open');
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(QuickAccessNavigatePreviousAction), 'Navigate Previous in Quick Open');
});
//#endregion
//# __sourceMappingURL=quickAccessActions.js.map