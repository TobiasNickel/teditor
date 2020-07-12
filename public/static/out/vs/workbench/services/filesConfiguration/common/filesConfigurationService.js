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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/platform"], function (require, exports, instantiation_1, extensions_1, event_1, lifecycle_1, contextkey_1, configuration_1, files_1, types_1, objects_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilesConfigurationService = exports.IFilesConfigurationService = exports.AutoSaveMode = exports.AutoSaveAfterShortDelayContext = void 0;
    exports.AutoSaveAfterShortDelayContext = new contextkey_1.RawContextKey('autoSaveAfterShortDelayContext', false);
    var AutoSaveMode;
    (function (AutoSaveMode) {
        AutoSaveMode[AutoSaveMode["OFF"] = 0] = "OFF";
        AutoSaveMode[AutoSaveMode["AFTER_SHORT_DELAY"] = 1] = "AFTER_SHORT_DELAY";
        AutoSaveMode[AutoSaveMode["AFTER_LONG_DELAY"] = 2] = "AFTER_LONG_DELAY";
        AutoSaveMode[AutoSaveMode["ON_FOCUS_CHANGE"] = 3] = "ON_FOCUS_CHANGE";
        AutoSaveMode[AutoSaveMode["ON_WINDOW_CHANGE"] = 4] = "ON_WINDOW_CHANGE";
    })(AutoSaveMode = exports.AutoSaveMode || (exports.AutoSaveMode = {}));
    exports.IFilesConfigurationService = instantiation_1.createDecorator('filesConfigurationService');
    let FilesConfigurationService = class FilesConfigurationService extends lifecycle_1.Disposable {
        constructor(contextKeyService, configurationService) {
            var _a, _b;
            super();
            this.configurationService = configurationService;
            this._onAutoSaveConfigurationChange = this._register(new event_1.Emitter());
            this.onAutoSaveConfigurationChange = this._onAutoSaveConfigurationChange.event;
            this._onFilesAssociationChange = this._register(new event_1.Emitter());
            this.onFilesAssociationChange = this._onFilesAssociationChange.event;
            this.autoSaveAfterShortDelayContext = exports.AutoSaveAfterShortDelayContext.bindTo(contextKeyService);
            const configuration = configurationService.getValue();
            this.currentFilesAssociationConfig = (_a = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _a === void 0 ? void 0 : _a.associations;
            this.currentHotExitConfig = ((_b = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _b === void 0 ? void 0 : _b.hotExit) || files_1.HotExitConfiguration.ON_EXIT;
            this.onFilesConfigurationChange(configuration);
            this.registerListeners();
        }
        registerListeners() {
            // Files configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files')) {
                    this.onFilesConfigurationChange(this.configurationService.getValue());
                }
            }));
        }
        onFilesConfigurationChange(configuration) {
            var _a, _b, _c, _d;
            // Auto Save
            const autoSaveMode = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _a === void 0 ? void 0 : _a.autoSave) || FilesConfigurationService.DEFAULT_AUTO_SAVE_MODE;
            switch (autoSaveMode) {
                case files_1.AutoSaveConfiguration.AFTER_DELAY:
                    this.configuredAutoSaveDelay = (_b = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _b === void 0 ? void 0 : _b.autoSaveDelay;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
                case files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = true;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
                case files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = true;
                    break;
                default:
                    this.configuredAutoSaveDelay = undefined;
                    this.configuredAutoSaveOnFocusChange = false;
                    this.configuredAutoSaveOnWindowChange = false;
                    break;
            }
            this.autoSaveAfterShortDelayContext.set(this.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */);
            // Emit as event
            this._onAutoSaveConfigurationChange.fire(this.getAutoSaveConfiguration());
            // Check for change in files associations
            const filesAssociation = (_c = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _c === void 0 ? void 0 : _c.associations;
            if (!objects_1.equals(this.currentFilesAssociationConfig, filesAssociation)) {
                this.currentFilesAssociationConfig = filesAssociation;
                this._onFilesAssociationChange.fire();
            }
            // Hot exit
            const hotExitMode = (_d = configuration === null || configuration === void 0 ? void 0 : configuration.files) === null || _d === void 0 ? void 0 : _d.hotExit;
            if (hotExitMode === files_1.HotExitConfiguration.OFF || hotExitMode === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                this.currentHotExitConfig = hotExitMode;
            }
            else {
                this.currentHotExitConfig = files_1.HotExitConfiguration.ON_EXIT;
            }
        }
        getAutoSaveMode() {
            if (this.configuredAutoSaveOnFocusChange) {
                return 3 /* ON_FOCUS_CHANGE */;
            }
            if (this.configuredAutoSaveOnWindowChange) {
                return 4 /* ON_WINDOW_CHANGE */;
            }
            if (this.configuredAutoSaveDelay && this.configuredAutoSaveDelay > 0) {
                return this.configuredAutoSaveDelay <= 1000 ? 1 /* AFTER_SHORT_DELAY */ : 2 /* AFTER_LONG_DELAY */;
            }
            return 0 /* OFF */;
        }
        getAutoSaveConfiguration() {
            return {
                autoSaveDelay: this.configuredAutoSaveDelay && this.configuredAutoSaveDelay > 0 ? this.configuredAutoSaveDelay : undefined,
                autoSaveFocusChange: !!this.configuredAutoSaveOnFocusChange,
                autoSaveApplicationChange: !!this.configuredAutoSaveOnWindowChange
            };
        }
        async toggleAutoSave() {
            const setting = this.configurationService.inspect('files.autoSave');
            let userAutoSaveConfig = setting.userValue;
            if (types_1.isUndefinedOrNull(userAutoSaveConfig)) {
                userAutoSaveConfig = setting.defaultValue; // use default if setting not defined
            }
            let newAutoSaveValue;
            if ([files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE].some(s => s === userAutoSaveConfig)) {
                newAutoSaveValue = files_1.AutoSaveConfiguration.OFF;
            }
            else {
                newAutoSaveValue = files_1.AutoSaveConfiguration.AFTER_DELAY;
            }
            return this.configurationService.updateValue('files.autoSave', newAutoSaveValue, 1 /* USER */);
        }
        get isHotExitEnabled() {
            return this.currentHotExitConfig !== files_1.HotExitConfiguration.OFF;
        }
        get hotExitConfiguration() {
            return this.currentHotExitConfig;
        }
        preventSaveConflicts(resource, language) {
            return this.configurationService.getValue('files.saveConflictResolution', { resource, overrideIdentifier: language }) !== 'overwriteFileOnDisk';
        }
    };
    FilesConfigurationService.DEFAULT_AUTO_SAVE_MODE = platform_1.isWeb ? files_1.AutoSaveConfiguration.AFTER_DELAY : files_1.AutoSaveConfiguration.OFF;
    FilesConfigurationService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService)
    ], FilesConfigurationService);
    exports.FilesConfigurationService = FilesConfigurationService;
    extensions_1.registerSingleton(exports.IFilesConfigurationService, FilesConfigurationService);
});
//# __sourceMappingURL=filesConfigurationService.js.map