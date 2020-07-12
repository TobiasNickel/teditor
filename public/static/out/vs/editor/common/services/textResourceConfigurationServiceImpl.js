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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, lifecycle_1, position_1, modeService_1, modelService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceConfigurationService = void 0;
    let TextResourceConfigurationService = class TextResourceConfigurationService extends lifecycle_1.Disposable {
        constructor(configurationService, modelService, modeService) {
            super();
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.modeService = modeService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._register(this.configurationService.onDidChangeConfiguration(e => this._onDidChangeConfiguration.fire(this.toResourceConfigurationChangeEvent(e))));
        }
        getValue(resource, arg2, arg3) {
            if (typeof arg3 === 'string') {
                return this._getValue(resource, position_1.Position.isIPosition(arg2) ? arg2 : null, arg3);
            }
            return this._getValue(resource, null, typeof arg2 === 'string' ? arg2 : undefined);
        }
        updateValue(resource, key, value, configurationTarget) {
            var _a, _b, _c, _d, _e;
            const language = this.getLanguage(resource, null);
            const configurationValue = this.configurationService.inspect(key, { resource, overrideIdentifier: language });
            if (configurationTarget === undefined) {
                configurationTarget = this.deriveConfigurationTarget(configurationValue, language);
            }
            switch (configurationTarget) {
                case 7 /* MEMORY */:
                    return this._updateValue(key, value, configurationTarget, (_a = configurationValue.memory) === null || _a === void 0 ? void 0 : _a.override, resource, language);
                case 5 /* WORKSPACE_FOLDER */:
                    return this._updateValue(key, value, configurationTarget, (_b = configurationValue.workspaceFolder) === null || _b === void 0 ? void 0 : _b.override, resource, language);
                case 4 /* WORKSPACE */:
                    return this._updateValue(key, value, configurationTarget, (_c = configurationValue.workspace) === null || _c === void 0 ? void 0 : _c.override, resource, language);
                case 3 /* USER_REMOTE */:
                    return this._updateValue(key, value, configurationTarget, (_d = configurationValue.userRemote) === null || _d === void 0 ? void 0 : _d.override, resource, language);
                default:
                    return this._updateValue(key, value, configurationTarget, (_e = configurationValue.userLocal) === null || _e === void 0 ? void 0 : _e.override, resource, language);
            }
        }
        _updateValue(key, value, configurationTarget, overriddenValue, resource, language) {
            if (language && overriddenValue !== undefined) {
                return this.configurationService.updateValue(key, value, { resource, overrideIdentifier: language }, configurationTarget);
            }
            else {
                return this.configurationService.updateValue(key, value, { resource }, configurationTarget);
            }
        }
        deriveConfigurationTarget(configurationValue, language) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            if (language) {
                if (((_a = configurationValue.memory) === null || _a === void 0 ? void 0 : _a.override) !== undefined) {
                    return 7 /* MEMORY */;
                }
                if (((_b = configurationValue.workspaceFolder) === null || _b === void 0 ? void 0 : _b.override) !== undefined) {
                    return 5 /* WORKSPACE_FOLDER */;
                }
                if (((_c = configurationValue.workspace) === null || _c === void 0 ? void 0 : _c.override) !== undefined) {
                    return 4 /* WORKSPACE */;
                }
                if (((_d = configurationValue.userRemote) === null || _d === void 0 ? void 0 : _d.override) !== undefined) {
                    return 3 /* USER_REMOTE */;
                }
                if (((_e = configurationValue.userLocal) === null || _e === void 0 ? void 0 : _e.override) !== undefined) {
                    return 2 /* USER_LOCAL */;
                }
            }
            if (((_f = configurationValue.memory) === null || _f === void 0 ? void 0 : _f.value) !== undefined) {
                return 7 /* MEMORY */;
            }
            if (((_g = configurationValue.workspaceFolder) === null || _g === void 0 ? void 0 : _g.value) !== undefined) {
                return 5 /* WORKSPACE_FOLDER */;
            }
            if (((_h = configurationValue.workspace) === null || _h === void 0 ? void 0 : _h.value) !== undefined) {
                return 4 /* WORKSPACE */;
            }
            if (((_j = configurationValue.userRemote) === null || _j === void 0 ? void 0 : _j.value) !== undefined) {
                return 3 /* USER_REMOTE */;
            }
            return 2 /* USER_LOCAL */;
        }
        _getValue(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            if (typeof section === 'undefined') {
                return this.configurationService.getValue({ resource, overrideIdentifier: language });
            }
            return this.configurationService.getValue(section, { resource, overrideIdentifier: language });
        }
        getLanguage(resource, position) {
            const model = this.modelService.getModel(resource);
            if (model) {
                return position ? this.modeService.getLanguageIdentifier(model.getLanguageIdAtPosition(position.lineNumber, position.column)).language : model.getLanguageIdentifier().language;
            }
            return this.modeService.getModeIdByFilepathOrFirstLine(resource);
        }
        toResourceConfigurationChangeEvent(configurationChangeEvent) {
            return {
                affectedKeys: configurationChangeEvent.affectedKeys,
                affectsConfiguration: (resource, configuration) => {
                    const overrideIdentifier = this.getLanguage(resource, null);
                    return configurationChangeEvent.affectsConfiguration(configuration, { resource, overrideIdentifier });
                }
            };
        }
    };
    TextResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, modelService_1.IModelService),
        __param(2, modeService_1.IModeService)
    ], TextResourceConfigurationService);
    exports.TextResourceConfigurationService = TextResourceConfigurationService;
});
//# __sourceMappingURL=textResourceConfigurationServiceImpl.js.map