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
    exports.ToggleRenderWhitespaceAction = void 0;
    let ToggleRenderWhitespaceAction = class ToggleRenderWhitespaceAction extends actions_1.Action {
        constructor(id, label, _configurationService) {
            super(id, label);
            this._configurationService = _configurationService;
        }
        run() {
            const renderWhitespace = this._configurationService.getValue('editor.renderWhitespace');
            let newRenderWhitespace;
            if (renderWhitespace === 'none') {
                newRenderWhitespace = 'all';
            }
            else {
                newRenderWhitespace = 'none';
            }
            return this._configurationService.updateValue('editor.renderWhitespace', newRenderWhitespace, 1 /* USER */);
        }
    };
    ToggleRenderWhitespaceAction.ID = 'editor.action.toggleRenderWhitespace';
    ToggleRenderWhitespaceAction.LABEL = nls.localize('toggleRenderWhitespace', "Toggle Render Whitespace");
    ToggleRenderWhitespaceAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleRenderWhitespaceAction);
    exports.ToggleRenderWhitespaceAction = ToggleRenderWhitespaceAction;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleRenderWhitespaceAction), 'View: Toggle Render Whitespace', nls.localize('view', "View"));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '5_editor',
        command: {
            id: ToggleRenderWhitespaceAction.ID,
            title: nls.localize({ key: 'miToggleRenderWhitespace', comment: ['&& denotes a mnemonic'] }, "&&Render Whitespace"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.editor.renderWhitespace', 'none')
        },
        order: 4
    });
});
//# __sourceMappingURL=toggleRenderWhitespace.js.map