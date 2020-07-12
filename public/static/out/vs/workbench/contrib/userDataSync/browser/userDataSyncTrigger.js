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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/common/views"], function (require, exports, event_1, lifecycle_1, editorService_1, preferencesEditorInput_1, resources_1, environmentService_1, extensions_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncTrigger = void 0;
    let UserDataSyncTrigger = class UserDataSyncTrigger extends lifecycle_1.Disposable {
        constructor(editorService, workbenchEnvironmentService, viewsService) {
            super();
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this._onDidTriggerSync = this._register(new event_1.Emitter());
            this.onDidTriggerSync = this._onDidTriggerSync.event;
            this._register(event_1.Event.filter(event_1.Event.any(event_1.Event.map(editorService.onDidActiveEditorChange, () => this.getUserDataEditorInputSource(editorService.activeEditor)), event_1.Event.map(event_1.Event.filter(viewsService.onDidChangeViewContainerVisibility, e => e.id === extensions_1.VIEWLET_ID && e.visible), e => e.id)), source => source !== undefined)(source => this._onDidTriggerSync.fire(source)));
        }
        getUserDataEditorInputSource(editorInput) {
            if (!editorInput) {
                return undefined;
            }
            if (editorInput instanceof preferencesEditorInput_1.SettingsEditor2Input) {
                return 'settingsEditor';
            }
            if (editorInput instanceof preferencesEditorInput_1.PreferencesEditorInput) {
                return 'settingsEditor';
            }
            if (editorInput instanceof preferencesEditorInput_1.KeybindingsEditorInput) {
                return 'keybindingsEditor';
            }
            const resource = editorInput.resource;
            if (resources_1.isEqual(resource, this.workbenchEnvironmentService.settingsResource)) {
                return 'settingsEditor';
            }
            if (resources_1.isEqual(resource, this.workbenchEnvironmentService.keybindingsResource)) {
                return 'keybindingsEditor';
            }
            return undefined;
        }
    };
    UserDataSyncTrigger = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, views_1.IViewsService)
    ], UserDataSyncTrigger);
    exports.UserDataSyncTrigger = UserDataSyncTrigger;
});
//# __sourceMappingURL=userDataSyncTrigger.js.map