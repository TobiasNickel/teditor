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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/uri", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/preferences/common/preferences"], function (require, exports, actions_1, uri_1, getIconClasses_1, modelService_1, modeService_1, nls, quickInput_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigureLanguageBasedSettingsAction = void 0;
    let ConfigureLanguageBasedSettingsAction = class ConfigureLanguageBasedSettingsAction extends actions_1.Action {
        constructor(id, label, modelService, modeService, quickInputService, preferencesService) {
            super(id, label);
            this.modelService = modelService;
            this.modeService = modeService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
        }
        run() {
            const languages = this.modeService.getRegisteredLanguageNames();
            const picks = languages.sort().map((lang, index) => {
                const description = nls.localize('languageDescriptionConfigured', "({0})", this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                // construct a fake resource to be able to show nice icons if any
                let fakeResource;
                const extensions = this.modeService.getExtensions(lang);
                if (extensions && extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = this.modeService.getFilenames(lang);
                    if (filenames && filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
                return {
                    label: lang,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, fakeResource),
                    description
                };
            });
            return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguage', "Select Language") })
                .then(pick => {
                if (pick) {
                    const modeId = this.modeService.getModeIdForLanguageName(pick.label.toLowerCase());
                    if (typeof modeId === 'string') {
                        return this.preferencesService.openGlobalSettings(true, { editSetting: `[${modeId}]` });
                    }
                }
                return undefined;
            });
        }
    };
    ConfigureLanguageBasedSettingsAction.ID = 'workbench.action.configureLanguageBasedSettings';
    ConfigureLanguageBasedSettingsAction.LABEL = { value: nls.localize('configureLanguageBasedSettings', "Configure Language Specific Settings..."), original: 'Configure Language Specific Settings...' };
    ConfigureLanguageBasedSettingsAction = __decorate([
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, preferences_1.IPreferencesService)
    ], ConfigureLanguageBasedSettingsAction);
    exports.ConfigureLanguageBasedSettingsAction = ConfigureLanguageBasedSettingsAction;
});
//# __sourceMappingURL=preferencesActions.js.map