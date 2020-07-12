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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/base/common/path", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/product/common/productService", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, nls, platform, editorOptions_1, configuration_1, storage_1, terminal_1, severity_1, notification_1, event_1, path_1, extensionManagement_1, telemetry_1, instantiation_1, extensionsActions_1, productService_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalConfigHelper = void 0;
    const MINIMUM_FONT_SIZE = 6;
    const MAXIMUM_FONT_SIZE = 25;
    /**
     * Encapsulates terminal configuration logic, the primary purpose of this file is so that platform
     * specific test cases can be written.
     */
    let TerminalConfigHelper = class TerminalConfigHelper {
        constructor(_linuxDistro, _configurationService, _extensionManagementService, _notificationService, _storageService, telemetryService, instantiationService, productService, storageKeysSyncRegistryService) {
            this._linuxDistro = _linuxDistro;
            this._configurationService = _configurationService;
            this._extensionManagementService = _extensionManagementService;
            this._notificationService = _notificationService;
            this._storageService = _storageService;
            this.telemetryService = telemetryService;
            this.instantiationService = instantiationService;
            this.productService = productService;
            this._onWorkspacePermissionsChanged = new event_1.Emitter();
            this.recommendationsShown = false;
            this._updateConfig();
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    this._updateConfig();
                }
            });
            // opt-in to syncing
            storageKeysSyncRegistryService.registerStorageKey({ key: 'terminalConfigHelper/launchRecommendationsIgnore', version: 1 });
        }
        get onWorkspacePermissionsChanged() { return this._onWorkspacePermissionsChanged.event; }
        _updateConfig() {
            this.config = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION);
        }
        configFontIsMonospace() {
            const fontSize = 15;
            const fontFamily = this.config.fontFamily || this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const i_rect = this._getBoundingRectFor('i', fontFamily, fontSize);
            const w_rect = this._getBoundingRectFor('w', fontFamily, fontSize);
            // Check for invalid bounds, there is no reason to believe the font is not monospace
            if (!i_rect || !w_rect || !i_rect.width || !w_rect.width) {
                return true;
            }
            return i_rect.width === w_rect.width;
        }
        _createCharMeasureElementIfNecessary() {
            if (!this.panelContainer) {
                throw new Error('Cannot measure element when terminal is not attached');
            }
            // Create charMeasureElement if it hasn't been created or if it was orphaned by its parent
            if (!this._charMeasureElement || !this._charMeasureElement.parentElement) {
                this._charMeasureElement = document.createElement('div');
                this.panelContainer.appendChild(this._charMeasureElement);
            }
            return this._charMeasureElement;
        }
        _getBoundingRectFor(char, fontFamily, fontSize) {
            let charMeasureElement;
            try {
                charMeasureElement = this._createCharMeasureElementIfNecessary();
            }
            catch (_a) {
                return undefined;
            }
            const style = charMeasureElement.style;
            style.display = 'inline-block';
            style.fontFamily = fontFamily;
            style.fontSize = fontSize + 'px';
            style.lineHeight = 'normal';
            charMeasureElement.innerText = char;
            const rect = charMeasureElement.getBoundingClientRect();
            style.display = 'none';
            return rect;
        }
        _measureFont(fontFamily, fontSize, letterSpacing, lineHeight) {
            const rect = this._getBoundingRectFor('X', fontFamily, fontSize);
            // Bounding client rect was invalid, use last font measurement if available.
            if (this._lastFontMeasurement && (!rect || !rect.width || !rect.height)) {
                return this._lastFontMeasurement;
            }
            this._lastFontMeasurement = {
                fontFamily,
                fontSize,
                letterSpacing,
                lineHeight,
                charWidth: 0,
                charHeight: 0
            };
            if (rect && rect.width && rect.height) {
                this._lastFontMeasurement.charHeight = Math.ceil(rect.height);
                // Char width is calculated differently for DOM and the other renderer types. Refer to
                // how each renderer updates their dimensions in xterm.js
                if (this.config.rendererType === 'dom') {
                    this._lastFontMeasurement.charWidth = rect.width;
                }
                else {
                    const scaledCharWidth = Math.floor(rect.width * window.devicePixelRatio);
                    const scaledCellWidth = scaledCharWidth + Math.round(letterSpacing);
                    const actualCellWidth = scaledCellWidth / window.devicePixelRatio;
                    this._lastFontMeasurement.charWidth = actualCellWidth - Math.round(letterSpacing) / window.devicePixelRatio;
                }
            }
            return this._lastFontMeasurement;
        }
        /**
         * Gets the font information based on the terminal.integrated.fontFamily
         * terminal.integrated.fontSize, terminal.integrated.lineHeight configuration properties
         */
        getFont(xtermCore, excludeDimensions) {
            var _a, _b;
            const editorConfig = this._configurationService.getValue('editor');
            let fontFamily = this.config.fontFamily || editorConfig.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            let fontSize = this._toInteger(this.config.fontSize, MINIMUM_FONT_SIZE, MAXIMUM_FONT_SIZE, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
            // Work around bad font on Fedora/Ubuntu
            if (!this.config.fontFamily) {
                if (this._linuxDistro === terminal_1.LinuxDistro.Fedora) {
                    fontFamily = '\'DejaVu Sans Mono\', monospace';
                }
                if (this._linuxDistro === terminal_1.LinuxDistro.Ubuntu) {
                    fontFamily = '\'Ubuntu Mono\', monospace';
                    // Ubuntu mono is somehow smaller, so set fontSize a bit larger to get the same perceived size.
                    fontSize = this._toInteger(fontSize + 2, MINIMUM_FONT_SIZE, MAXIMUM_FONT_SIZE, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
                }
            }
            const letterSpacing = this.config.letterSpacing ? Math.max(Math.floor(this.config.letterSpacing), terminal_1.MINIMUM_LETTER_SPACING) : terminal_1.DEFAULT_LETTER_SPACING;
            const lineHeight = this.config.lineHeight ? Math.max(this.config.lineHeight, 1) : terminal_1.DEFAULT_LINE_HEIGHT;
            if (excludeDimensions) {
                return {
                    fontFamily,
                    fontSize,
                    letterSpacing,
                    lineHeight
                };
            }
            // Get the character dimensions from xterm if it's available
            if (xtermCore) {
                if (xtermCore._renderService && ((_a = xtermCore._renderService.dimensions) === null || _a === void 0 ? void 0 : _a.actualCellWidth) && ((_b = xtermCore._renderService.dimensions) === null || _b === void 0 ? void 0 : _b.actualCellHeight)) {
                    return {
                        fontFamily,
                        fontSize,
                        letterSpacing,
                        lineHeight,
                        charHeight: xtermCore._renderService.dimensions.actualCellHeight / lineHeight,
                        charWidth: xtermCore._renderService.dimensions.actualCellWidth - Math.round(letterSpacing) / window.devicePixelRatio
                    };
                }
            }
            // Fall back to measuring the font ourselves
            return this._measureFont(fontFamily, fontSize, letterSpacing, lineHeight);
        }
        setWorkspaceShellAllowed(isAllowed) {
            this._onWorkspacePermissionsChanged.fire(isAllowed);
            this._storageService.store(terminal_1.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY, isAllowed, 1 /* WORKSPACE */);
        }
        isWorkspaceShellAllowed(defaultValue = undefined) {
            return this._storageService.getBoolean(terminal_1.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY, 1 /* WORKSPACE */, defaultValue);
        }
        checkWorkspaceShellPermissions(osOverride = platform.OS) {
            // Check whether there is a workspace setting
            const platformKey = osOverride === 1 /* Windows */ ? 'windows' : osOverride === 2 /* Macintosh */ ? 'osx' : 'linux';
            const shellConfigValue = this._configurationService.inspect(`terminal.integrated.shell.${platformKey}`);
            const shellArgsConfigValue = this._configurationService.inspect(`terminal.integrated.shellArgs.${platformKey}`);
            const envConfigValue = this._configurationService.inspect(`terminal.integrated.env.${platformKey}`);
            // Check if workspace setting exists and whether it's allowed
            let isWorkspaceShellAllowed = false;
            if (shellConfigValue.workspaceValue !== undefined || shellArgsConfigValue.workspaceValue !== undefined || envConfigValue.workspaceValue !== undefined) {
                isWorkspaceShellAllowed = this.isWorkspaceShellAllowed(undefined);
            }
            // Always allow [] args as it would lead to an odd error message and should not be dangerous
            if (shellConfigValue.workspaceValue === undefined && envConfigValue.workspaceValue === undefined &&
                shellArgsConfigValue.workspaceValue && shellArgsConfigValue.workspaceValue.length === 0) {
                isWorkspaceShellAllowed = true;
            }
            // Check if the value is neither on the blocklist (false) or allowlist (true) and ask for
            // permission
            if (isWorkspaceShellAllowed === undefined) {
                let shellString;
                if (shellConfigValue.workspaceValue) {
                    shellString = `shell: "${shellConfigValue.workspaceValue}"`;
                }
                let argsString;
                if (shellArgsConfigValue.workspaceValue) {
                    argsString = `shellArgs: [${shellArgsConfigValue.workspaceValue.map(v => '"' + v + '"').join(', ')}]`;
                }
                let envString;
                if (envConfigValue.workspaceValue) {
                    envString = `env: {${Object.keys(envConfigValue.workspaceValue).map(k => `${k}:${envConfigValue.workspaceValue[k]}`).join(', ')}}`;
                }
                // Should not be localized as it's json-like syntax referencing settings keys
                const workspaceConfigStrings = [];
                if (shellString) {
                    workspaceConfigStrings.push(shellString);
                }
                if (argsString) {
                    workspaceConfigStrings.push(argsString);
                }
                if (envString) {
                    workspaceConfigStrings.push(envString);
                }
                const workspaceConfigString = workspaceConfigStrings.join(', ');
                this._notificationService.prompt(severity_1.default.Info, nls.localize('terminal.integrated.allowWorkspaceShell', "Do you allow this workspace to modify your terminal shell? {0}", workspaceConfigString), [{
                        label: nls.localize('allow', "Allow"),
                        run: () => this.setWorkspaceShellAllowed(true)
                    },
                    {
                        label: nls.localize('disallow', "Disallow"),
                        run: () => this.setWorkspaceShellAllowed(false)
                    }]);
            }
            return !!isWorkspaceShellAllowed;
        }
        _toInteger(source, minimum, maximum, fallback) {
            let r = parseInt(source, 10);
            if (isNaN(r)) {
                return fallback;
            }
            if (typeof minimum === 'number') {
                r = Math.max(minimum, r);
            }
            if (typeof maximum === 'number') {
                r = Math.min(maximum, r);
            }
            return r;
        }
        async showRecommendations(shellLaunchConfig) {
            if (this.recommendationsShown) {
                return;
            }
            this.recommendationsShown = true;
            if (platform.isWindows && shellLaunchConfig.executable && path_1.basename(shellLaunchConfig.executable).toLowerCase() === 'wsl.exe') {
                const exeBasedExtensionTips = this.productService.exeBasedExtensionTips;
                if (!exeBasedExtensionTips || !exeBasedExtensionTips.wsl) {
                    return;
                }
                const extId = exeBasedExtensionTips.wsl.recommendations[0];
                if (extId && !await this.isExtensionInstalled(extId)) {
                    this._notificationService.prompt(severity_1.default.Info, nls.localize('useWslExtension.title', "The '{0}' extension is recommended for opening a terminal in WSL.", exeBasedExtensionTips.wsl.friendlyName), [
                        {
                            label: nls.localize('install', 'Install'),
                            run: () => {
                                /* __GDPR__
                                "terminalLaunchRecommendation:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                    "extensionId": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" }
                                }
                                */
                                this.telemetryService.publicLog('terminalLaunchRecommendation:popup', { userReaction: 'install', extId });
                                this.instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, extId).run();
                            }
                        }
                    ], {
                        sticky: true,
                        neverShowAgain: { id: 'terminalConfigHelper/launchRecommendationsIgnore', scope: notification_1.NeverShowAgainScope.GLOBAL },
                        onCancel: () => {
                            /* __GDPR__
                                "terminalLaunchRecommendation:popup" : {
                                    "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                }
                            */
                            this.telemetryService.publicLog('terminalLaunchRecommendation:popup', { userReaction: 'cancelled' });
                        }
                    });
                }
            }
        }
        async isExtensionInstalled(id) {
            const extensions = await this._extensionManagementService.getInstalled(1 /* User */);
            return extensions.some(e => e.identifier.id === id);
        }
    };
    TerminalConfigHelper = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, notification_1.INotificationService),
        __param(4, storage_1.IStorageService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, productService_1.IProductService),
        __param(8, storageKeys_1.IStorageKeysSyncRegistryService)
    ], TerminalConfigHelper);
    exports.TerminalConfigHelper = TerminalConfigHelper;
});
//# __sourceMappingURL=terminalConfigHelper.js.map