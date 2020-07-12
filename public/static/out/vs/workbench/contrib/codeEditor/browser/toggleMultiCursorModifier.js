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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/common/contributions"], function (require, exports, nls, actions_1, platform, actions_2, configuration_1, contextkey_1, platform_1, actions_3, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMultiCursorModifierAction = void 0;
    let ToggleMultiCursorModifierAction = class ToggleMultiCursorModifierAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        run() {
            const editorConf = this.configurationService.getValue('editor');
            const newValue = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'alt' : 'ctrlCmd');
            return this.configurationService.updateValue(ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey, newValue, 1 /* USER */);
        }
    };
    ToggleMultiCursorModifierAction.ID = 'workbench.action.toggleMultiCursorModifier';
    ToggleMultiCursorModifierAction.LABEL = nls.localize('toggleLocation', "Toggle Multi-Cursor Modifier");
    ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey = 'editor.multiCursorModifier';
    ToggleMultiCursorModifierAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleMultiCursorModifierAction);
    exports.ToggleMultiCursorModifierAction = ToggleMultiCursorModifierAction;
    const multiCursorModifier = new contextkey_1.RawContextKey('multiCursorModifier', 'altKey');
    let MultiCursorModifierContextKeyController = class MultiCursorModifierContextKeyController {
        constructor(configurationService, contextKeyService) {
            this.configurationService = configurationService;
            this._multiCursorModifier = multiCursorModifier.bindTo(contextKeyService);
            this._update();
            configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.multiCursorModifier')) {
                    this._update();
                }
            });
        }
        _update() {
            const editorConf = this.configurationService.getValue('editor');
            const value = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'ctrlCmd' : 'altKey');
            this._multiCursorModifier.set(value);
        }
    };
    MultiCursorModifierContextKeyController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextkey_1.IContextKeyService)
    ], MultiCursorModifierContextKeyController);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(MultiCursorModifierContextKeyController, 3 /* Restored */);
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleMultiCursorModifierAction), 'Toggle Multi-Cursor Modifier');
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: nls.localize('miMultiCursorAlt', "Switch to Alt+Click for Multi-Cursor")
        },
        when: multiCursorModifier.isEqualTo('ctrlCmd'),
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (platform.isMacintosh
                ? nls.localize('miMultiCursorCmd', "Switch to Cmd+Click for Multi-Cursor")
                : nls.localize('miMultiCursorCtrl', "Switch to Ctrl+Click for Multi-Cursor"))
        },
        when: multiCursorModifier.isEqualTo('altKey'),
        order: 1
    });
});
//# __sourceMappingURL=toggleMultiCursorModifier.js.map