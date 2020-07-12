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
define(["require", "exports", "vs/platform/keybinding/common/keybinding", "vs/platform/userDataSync/common/userDataSync", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfigurationService"], function (require, exports, keybinding_1, userDataSync_1, extensions_1, resolverService_1, textResourceConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncUtilService = class UserDataSyncUtilService {
        constructor(keybindingsService, textModelService, textResourcePropertiesService, textResourceConfigurationService) {
            this.keybindingsService = keybindingsService;
            this.textModelService = textModelService;
            this.textResourcePropertiesService = textResourcePropertiesService;
            this.textResourceConfigurationService = textResourceConfigurationService;
        }
        async resolveDefaultIgnoredSettings() {
            return userDataSync_1.getDefaultIgnoredSettings();
        }
        async resolveUserBindings(userBindings) {
            const keys = {};
            for (const userbinding of userBindings) {
                keys[userbinding] = this.keybindingsService.resolveUserBinding(userbinding).map(part => part.getUserSettingsLabel()).join(' ');
            }
            return keys;
        }
        async resolveFormattingOptions(resource) {
            try {
                const modelReference = await this.textModelService.createModelReference(resource);
                const { insertSpaces, tabSize } = modelReference.object.textEditorModel.getOptions();
                const eol = modelReference.object.textEditorModel.getEOL();
                modelReference.dispose();
                return { eol, insertSpaces, tabSize };
            }
            catch (e) {
            }
            return {
                eol: this.textResourcePropertiesService.getEOL(resource),
                insertSpaces: this.textResourceConfigurationService.getValue(resource, 'editor.insertSpaces'),
                tabSize: this.textResourceConfigurationService.getValue(resource, 'editor.tabSize')
            };
        }
    };
    UserDataSyncUtilService = __decorate([
        __param(0, keybinding_1.IKeybindingService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, textResourceConfigurationService_1.ITextResourcePropertiesService),
        __param(3, textResourceConfigurationService_1.ITextResourceConfigurationService)
    ], UserDataSyncUtilService);
    extensions_1.registerSingleton(userDataSync_1.IUserDataSyncUtilService, UserDataSyncUtilService);
});
//# __sourceMappingURL=userDataSyncUtil.js.map