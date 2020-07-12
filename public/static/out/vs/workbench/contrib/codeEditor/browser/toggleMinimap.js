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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/actions"], function (require, exports, nls, actions_1, actions_2, configuration_1, contextkey_1, platform_1, actions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMinimapAction = void 0;
    let ToggleMinimapAction = class ToggleMinimapAction extends actions_1.Action {
        constructor(id, label, _configurationService) {
            super(id, label);
            this._configurationService = _configurationService;
        }
        run() {
            const newValue = !this._configurationService.getValue('editor.minimap.enabled');
            return this._configurationService.updateValue('editor.minimap.enabled', newValue, 1 /* USER */);
        }
    };
    ToggleMinimapAction.ID = 'editor.action.toggleMinimap';
    ToggleMinimapAction.LABEL = nls.localize('toggleMinimap', "Toggle Minimap");
    ToggleMinimapAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleMinimapAction);
    exports.ToggleMinimapAction = ToggleMinimapAction;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleMinimapAction), 'View: Toggle Minimap', nls.localize('view', "View"));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '5_editor',
        command: {
            id: ToggleMinimapAction.ID,
            title: nls.localize({ key: 'miShowMinimap', comment: ['&& denotes a mnemonic'] }, "Show &&Minimap"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.editor.minimap.enabled', true)
        },
        order: 2
    });
});
//# __sourceMappingURL=toggleMinimap.js.map