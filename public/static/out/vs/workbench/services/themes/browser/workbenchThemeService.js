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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/registry/common/platform", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/workbench/services/themes/common/colorThemeData", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/themes/common/fileIconThemeSchema", "vs/base/common/lifecycle", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/base/browser/dom", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/instantiation/common/extensions", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/workbench/services/themes/common/themeExtensionPoints", "vs/workbench/services/themes/common/themeConfiguration", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/platform/log/common/log"], function (require, exports, nls, types, extensions_1, workbenchThemeService_1, storage_1, telemetry_1, platform_1, errors, configuration_1, colorThemeData_1, themeService_1, event_1, fileIconThemeSchema_1, lifecycle_1, fileIconThemeData_1, dom_1, environmentService_1, files_1, resources, colorThemeSchema_1, extensions_2, remoteHosts_1, layoutService_1, extensionResourceLoader_1, themeExtensionPoints_1, themeConfiguration_1, productIconThemeData_1, productIconThemeSchema_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchThemeService = void 0;
    // implementation
    const DEFAULT_COLOR_THEME_ID = 'vs-dark vscode-theme-defaults-themes-dark_plus-json';
    const PERSISTED_OS_COLOR_SCHEME = 'osColorScheme';
    const defaultThemeExtensionId = 'vscode-theme-defaults';
    const oldDefaultThemeExtensionId = 'vscode-theme-colorful-defaults';
    const DEFAULT_FILE_ICON_THEME_ID = 'vscode.vscode-theme-seti-vs-seti';
    const fileIconsEnabledClass = 'file-icons-enabled';
    const colorThemeRulesClassName = 'contributedColorTheme';
    const fileIconThemeRulesClassName = 'contributedFileIconTheme';
    const productIconThemeRulesClassName = 'contributedProductIconTheme';
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    function validateThemeId(theme) {
        // migrations
        switch (theme) {
            case workbenchThemeService_1.VS_LIGHT_THEME: return `vs ${defaultThemeExtensionId}-themes-light_vs-json`;
            case workbenchThemeService_1.VS_DARK_THEME: return `vs-dark ${defaultThemeExtensionId}-themes-dark_vs-json`;
            case workbenchThemeService_1.VS_HC_THEME: return `hc-black ${defaultThemeExtensionId}-themes-hc_black-json`;
            case `vs ${oldDefaultThemeExtensionId}-themes-light_plus-tmTheme`: return `vs ${defaultThemeExtensionId}-themes-light_plus-json`;
            case `vs-dark ${oldDefaultThemeExtensionId}-themes-dark_plus-tmTheme`: return `vs-dark ${defaultThemeExtensionId}-themes-dark_plus-json`;
        }
        return theme;
    }
    const colorThemesExtPoint = themeExtensionPoints_1.registerColorThemeExtensionPoint();
    const fileIconThemesExtPoint = themeExtensionPoints_1.registerFileIconThemeExtensionPoint();
    const productIconThemesExtPoint = themeExtensionPoints_1.registerProductIconThemeExtensionPoint();
    let WorkbenchThemeService = class WorkbenchThemeService {
        constructor(extensionService, storageService, configurationService, telemetryService, environmentService, fileService, extensionResourceLoaderService, layoutService, logService) {
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.layoutService = layoutService;
            this.logService = logService;
            this.themeExtensionsActivated = new Map();
            this.container = layoutService.container;
            const defaultThemeType = environmentService.configuration.defaultThemeType || themeService_1.DARK;
            this.settings = new themeConfiguration_1.ThemeConfiguration(configurationService, defaultThemeType);
            this.colorThemeRegistry = new themeExtensionPoints_1.ThemeRegistry(extensionService, colorThemesExtPoint, colorThemeData_1.ColorThemeData.fromExtensionTheme);
            this.colorThemeWatcher = new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentColorTheme.bind(this));
            this.onColorThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentColorTheme = colorThemeData_1.ColorThemeData.createUnloadedTheme('');
            this.fileIconThemeWatcher = new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentFileIconTheme.bind(this));
            this.fileIconThemeRegistry = new themeExtensionPoints_1.ThemeRegistry(extensionService, fileIconThemesExtPoint, fileIconThemeData_1.FileIconThemeData.fromExtensionTheme, true, fileIconThemeData_1.FileIconThemeData.noIconTheme);
            this.onFileIconThemeChange = new event_1.Emitter();
            this.currentFileIconTheme = fileIconThemeData_1.FileIconThemeData.createUnloadedTheme('');
            this.productIconThemeWatcher = new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentProductIconTheme.bind(this));
            this.productIconThemeRegistry = new themeExtensionPoints_1.ThemeRegistry(extensionService, productIconThemesExtPoint, productIconThemeData_1.ProductIconThemeData.fromExtensionTheme, true, productIconThemeData_1.ProductIconThemeData.defaultTheme, true);
            this.onProductIconThemeChange = new event_1.Emitter();
            this.currentProductIconTheme = productIconThemeData_1.ProductIconThemeData.createUnloadedTheme('');
            // In order to avoid paint flashing for tokens, because
            // themes are loaded asynchronously, we need to initialize
            // a color theme document with good defaults until the theme is loaded
            let themeData = colorThemeData_1.ColorThemeData.fromStorageData(this.storageService);
            if (environmentService.configuration.highContrast && (themeData === null || themeData === void 0 ? void 0 : themeData.baseTheme) !== themeService_1.HIGH_CONTRAST) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(themeService_1.HIGH_CONTRAST);
            }
            if (!themeData) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(defaultThemeType);
            }
            themeData.setCustomizations(this.settings);
            this.applyTheme(themeData, undefined, true);
            const fileIconData = fileIconThemeData_1.FileIconThemeData.fromStorageData(this.storageService);
            if (fileIconData) {
                this.applyAndSetFileIconTheme(fileIconData);
            }
            const productIconData = productIconThemeData_1.ProductIconThemeData.fromStorageData(this.storageService);
            if (productIconData) {
                this.applyAndSetProductIconTheme(productIconData);
            }
            this.initialize().then(undefined, errors.onUnexpectedError).then(_ => {
                this.installConfigurationListener();
                this.installPreferredSchemeListener();
                this.installRegistryListeners();
            });
        }
        initialize() {
            const extDevLocs = this.environmentService.extensionDevelopmentLocationURI;
            const extDevLoc = extDevLocs && extDevLocs.length === 1 ? extDevLocs[0] : undefined; // in dev mode, switch to a theme provided by the extension under dev.
            const initializeColorTheme = async () => {
                const devThemes = await this.colorThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setColorTheme(devThemes[0].id, 7 /* MEMORY */);
                }
                const theme = await this.colorThemeRegistry.findThemeBySettingsId(this.settings.colorTheme, DEFAULT_COLOR_THEME_ID);
                const persistedColorScheme = this.storageService.get(PERSISTED_OS_COLOR_SCHEME, 0 /* GLOBAL */);
                const preferredColorScheme = this.getPreferredColorScheme();
                if (persistedColorScheme && preferredColorScheme && persistedColorScheme !== preferredColorScheme) {
                    return this.applyPreferredColorTheme(preferredColorScheme);
                }
                return this.setColorTheme(theme && theme.id, undefined);
            };
            const initializeFileIconTheme = async () => {
                const devThemes = await this.fileIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setFileIconTheme(devThemes[0].id, 7 /* MEMORY */);
                }
                const theme = await this.fileIconThemeRegistry.findThemeBySettingsId(this.settings.fileIconTheme);
                return this.setFileIconTheme(theme ? theme.id : DEFAULT_FILE_ICON_THEME_ID, undefined);
            };
            const initializeProductIconTheme = async () => {
                const devThemes = await this.productIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setProductIconTheme(devThemes[0].id, 7 /* MEMORY */);
                }
                const theme = await this.productIconThemeRegistry.findThemeBySettingsId(this.settings.productIconTheme);
                return this.setProductIconTheme(theme ? theme.id : productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, undefined);
            };
            return Promise.all([initializeColorTheme(), initializeFileIconTheme(), initializeProductIconTheme()]);
        }
        installConfigurationListener() {
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_THEME)) {
                    this.restoreColorTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)) {
                    this.handlePreferredSchemeUpdated();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME) && this.getPreferredColorScheme() === themeService_1.DARK) {
                    this.applyPreferredColorTheme(themeService_1.DARK);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME) && this.getPreferredColorScheme() === themeService_1.LIGHT) {
                    this.applyPreferredColorTheme(themeService_1.LIGHT);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_THEME) && this.getPreferredColorScheme() === themeService_1.HIGH_CONTRAST) {
                    this.applyPreferredColorTheme(themeService_1.HIGH_CONTRAST);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME)) {
                    this.restoreFileIconTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME)) {
                    this.restoreProductIconTheme();
                }
                if (this.currentColorTheme) {
                    let hasColorChanges = false;
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomColors(this.settings.colorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomTokenColors(this.settings.tokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS) || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS_EXPERIMENTAL)) {
                        this.currentColorTheme.setCustomSemanticTokenColors(this.settings.semanticTokenColorCustomizations, this.settings.experimentalSemanticTokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (hasColorChanges) {
                        this.updateDynamicCSSRules(this.currentColorTheme);
                        this.onColorThemeChange.fire(this.currentColorTheme);
                    }
                }
            });
        }
        installRegistryListeners() {
            let prevColorId = undefined;
            // update settings schema setting for theme specific settings
            this.colorThemeRegistry.onDidChange(async (event) => {
                themeConfiguration_1.updateColorThemeConfigurationSchemas(event.themes);
                if (await this.restoreColorTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentColorTheme.id === DEFAULT_COLOR_THEME_ID && !types.isUndefined(prevColorId) && await this.colorThemeRegistry.findThemeById(prevColorId)) {
                        // restore theme
                        this.setColorTheme(prevColorId, 'auto');
                        prevColorId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                        this.reloadCurrentColorTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                    // current theme is no longer available
                    prevColorId = this.currentColorTheme.id;
                    this.setColorTheme(DEFAULT_COLOR_THEME_ID, 'auto');
                }
            });
            let prevFileIconId = undefined;
            this.fileIconThemeRegistry.onDidChange(async (event) => {
                themeConfiguration_1.updateFileIconThemeConfigurationSchemas(event.themes);
                if (await this.restoreFileIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentFileIconTheme.id === DEFAULT_FILE_ICON_THEME_ID && !types.isUndefined(prevFileIconId) && await this.fileIconThemeRegistry.findThemeById(prevFileIconId)) {
                        this.setFileIconTheme(prevFileIconId, 'auto');
                        prevFileIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                        this.reloadCurrentFileIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevFileIconId = this.currentFileIconTheme.id;
                    this.setFileIconTheme(DEFAULT_FILE_ICON_THEME_ID, 'auto');
                }
            });
            let prevProductIconId = undefined;
            this.productIconThemeRegistry.onDidChange(async (event) => {
                themeConfiguration_1.updateProductIconThemeConfigurationSchemas(event.themes);
                if (await this.restoreProductIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentProductIconTheme.id === productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID && !types.isUndefined(prevProductIconId) && await this.productIconThemeRegistry.findThemeById(prevProductIconId)) {
                        this.setProductIconTheme(prevProductIconId, 'auto');
                        prevProductIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                        this.reloadCurrentProductIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevProductIconId = this.currentProductIconTheme.id;
                    this.setProductIconTheme(productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, 'auto');
                }
            });
            return Promise.all([this.getColorThemes(), this.getFileIconThemes(), this.getProductIconThemes()]).then(([ct, fit, pit]) => {
                themeConfiguration_1.updateColorThemeConfigurationSchemas(ct);
                themeConfiguration_1.updateFileIconThemeConfigurationSchemas(fit);
                themeConfiguration_1.updateProductIconThemeConfigurationSchemas(pit);
            });
        }
        // preferred scheme handling
        installPreferredSchemeListener() {
            window.matchMedia('(prefers-color-scheme: dark)').addListener(async () => this.handlePreferredSchemeUpdated());
        }
        async handlePreferredSchemeUpdated() {
            const scheme = this.getPreferredColorScheme();
            this.storageService.store(PERSISTED_OS_COLOR_SCHEME, scheme, 0 /* GLOBAL */);
            if (scheme) {
                return this.applyPreferredColorTheme(scheme);
            }
            return undefined;
        }
        getPreferredColorScheme() {
            const detectHCThemeSetting = this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_HC);
            if (this.environmentService.configuration.highContrast && detectHCThemeSetting) {
                return themeService_1.HIGH_CONTRAST;
            }
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)) {
                if (window.matchMedia(`(prefers-color-scheme: light)`).matches) {
                    return themeService_1.LIGHT;
                }
                else if (window.matchMedia(`(prefers-color-scheme: dark)`).matches) {
                    return themeService_1.DARK;
                }
            }
            return undefined;
        }
        async applyPreferredColorTheme(type) {
            const settingId = type === themeService_1.DARK ? workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME : type === themeService_1.LIGHT ? workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME : workbenchThemeService_1.ThemeSettings.PREFERRED_HC_THEME;
            const themeSettingId = this.configurationService.getValue(settingId);
            if (themeSettingId) {
                const theme = await this.colorThemeRegistry.findThemeBySettingsId(themeSettingId, undefined);
                if (theme) {
                    return this.setColorTheme(theme.id, 'auto');
                }
            }
            return null;
        }
        getColorTheme() {
            return this.currentColorTheme;
        }
        getColorThemes() {
            return this.colorThemeRegistry.getThemes();
        }
        get onDidColorThemeChange() {
            return this.onColorThemeChange.event;
        }
        setColorTheme(themeId, settingsTarget) {
            if (!themeId) {
                return Promise.resolve(null);
            }
            if (themeId === this.currentColorTheme.id && this.currentColorTheme.isLoaded) {
                return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
            }
            themeId = validateThemeId(themeId); // migrate theme ids
            return this.colorThemeRegistry.findThemeById(themeId, DEFAULT_COLOR_THEME_ID).then(themeData => {
                if (!themeData) {
                    return null;
                }
                return themeData.ensureLoaded(this.extensionResourceLoaderService).then(_ => {
                    if (themeId === this.currentColorTheme.id && !this.currentColorTheme.isLoaded && this.currentColorTheme.hasEqualData(themeData)) {
                        this.currentColorTheme.clearCaches();
                        // the loaded theme is identical to the perisisted theme. Don't need to send an event.
                        this.currentColorTheme = themeData;
                        themeData.setCustomizations(this.settings);
                        return Promise.resolve(themeData);
                    }
                    themeData.setCustomizations(this.settings);
                    return this.applyTheme(themeData, settingsTarget);
                }, error => {
                    return Promise.reject(new Error(nls.localize('error.cannotloadtheme', "Unable to load {0}: {1}", themeData.location.toString(), error.message)));
                });
            });
        }
        async reloadCurrentColorTheme() {
            await this.currentColorTheme.reload(this.extensionResourceLoaderService);
            this.currentColorTheme.setCustomizations(this.settings);
            this.applyTheme(this.currentColorTheme, undefined, false);
        }
        async restoreColorTheme() {
            const settingId = this.settings.colorTheme;
            const theme = await this.colorThemeRegistry.findThemeBySettingsId(settingId);
            if (theme) {
                if (settingId !== this.currentColorTheme.settingsId) {
                    await this.setColorTheme(theme.id, undefined);
                }
                return true;
            }
            return false;
        }
        updateDynamicCSSRules(themeData) {
            const cssRules = new Set();
            const ruleCollector = {
                addRule: (rule) => {
                    if (!cssRules.has(rule)) {
                        cssRules.add(rule);
                    }
                }
            };
            themingRegistry.getThemingParticipants().forEach(p => p(themeData, ruleCollector, this.environmentService));
            _applyRules([...cssRules].join('\n'), colorThemeRulesClassName);
        }
        applyTheme(newTheme, settingsTarget, silent = false) {
            this.updateDynamicCSSRules(newTheme);
            if (this.currentColorTheme.id) {
                dom_1.removeClasses(this.container, this.currentColorTheme.id);
            }
            else {
                dom_1.removeClasses(this.container, workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_HC_THEME);
            }
            dom_1.addClasses(this.container, newTheme.id);
            this.currentColorTheme.clearCaches();
            this.currentColorTheme = newTheme;
            if (!this.colorThemingParticipantChangeListener) {
                this.colorThemingParticipantChangeListener = themingRegistry.onThemingParticipantAdded(_ => this.updateDynamicCSSRules(this.currentColorTheme));
            }
            this.colorThemeWatcher.update(newTheme);
            this.sendTelemetry(newTheme.id, newTheme.extensionData, 'color');
            if (silent) {
                return Promise.resolve(null);
            }
            this.onColorThemeChange.fire(this.currentColorTheme);
            // remember theme data for a quick restore
            if (newTheme.isLoaded) {
                newTheme.toStorage(this.storageService);
            }
            return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
        }
        sendTelemetry(themeId, themeData, themeType) {
            if (themeData) {
                const key = themeType + themeData.extensionId;
                if (!this.themeExtensionsActivated.get(key)) {
                    this.telemetryService.publicLog2('activatePlugin', {
                        id: themeData.extensionId,
                        name: themeData.extensionName,
                        isBuiltin: themeData.extensionIsBuiltin,
                        publisherDisplayName: themeData.extensionPublisher,
                        themeId: themeId
                    });
                    this.themeExtensionsActivated.set(key, true);
                }
            }
        }
        getFileIconThemes() {
            return this.fileIconThemeRegistry.getThemes();
        }
        getFileIconTheme() {
            return this.currentFileIconTheme;
        }
        get onDidFileIconThemeChange() {
            return this.onFileIconThemeChange.event;
        }
        async setFileIconTheme(iconTheme, settingsTarget) {
            iconTheme = iconTheme || '';
            if (iconTheme === this.currentFileIconTheme.id && this.currentFileIconTheme.isLoaded) {
                await this.settings.setFileIconTheme(this.currentFileIconTheme, settingsTarget);
                return this.currentFileIconTheme;
            }
            const newThemeData = (await this.fileIconThemeRegistry.findThemeById(iconTheme)) || fileIconThemeData_1.FileIconThemeData.noIconTheme;
            await newThemeData.ensureLoaded(this.fileService);
            this.applyAndSetFileIconTheme(newThemeData);
            // remember theme data for a quick restore
            if (newThemeData.isLoaded && (!newThemeData.location || !remoteHosts_1.getRemoteAuthority(newThemeData.location))) {
                newThemeData.toStorage(this.storageService);
            }
            await this.settings.setFileIconTheme(this.currentFileIconTheme, settingsTarget);
            return newThemeData;
        }
        async reloadCurrentFileIconTheme() {
            await this.currentFileIconTheme.reload(this.fileService);
            this.applyAndSetFileIconTheme(this.currentFileIconTheme);
        }
        async restoreFileIconTheme() {
            const settingId = this.settings.fileIconTheme;
            const theme = await this.fileIconThemeRegistry.findThemeBySettingsId(settingId);
            if (theme) {
                if (settingId !== this.currentFileIconTheme.settingsId) {
                    await this.setFileIconTheme(theme.id, undefined);
                }
                return true;
            }
            return false;
        }
        applyAndSetFileIconTheme(iconThemeData) {
            this.currentFileIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, fileIconThemeRulesClassName);
            if (iconThemeData.id) {
                dom_1.addClasses(this.container, fileIconsEnabledClass);
            }
            else {
                dom_1.removeClasses(this.container, fileIconsEnabledClass);
            }
            this.fileIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'fileIcon');
            }
            this.onFileIconThemeChange.fire(this.currentFileIconTheme);
        }
        getProductIconThemes() {
            return this.productIconThemeRegistry.getThemes();
        }
        getProductIconTheme() {
            return this.currentProductIconTheme;
        }
        get onDidProductIconThemeChange() {
            return this.onProductIconThemeChange.event;
        }
        async setProductIconTheme(iconTheme, settingsTarget) {
            iconTheme = iconTheme || '';
            if (iconTheme === this.currentProductIconTheme.id && this.currentProductIconTheme.isLoaded) {
                await this.settings.setProductIconTheme(this.currentProductIconTheme, settingsTarget);
                return this.currentProductIconTheme;
            }
            const newThemeData = await this.productIconThemeRegistry.findThemeById(iconTheme) || productIconThemeData_1.ProductIconThemeData.defaultTheme;
            await newThemeData.ensureLoaded(this.fileService, this.logService);
            this.applyAndSetProductIconTheme(newThemeData);
            // remember theme data for a quick restore
            if (newThemeData.isLoaded && (!newThemeData.location || !remoteHosts_1.getRemoteAuthority(newThemeData.location))) {
                newThemeData.toStorage(this.storageService);
            }
            await this.settings.setProductIconTheme(this.currentProductIconTheme, settingsTarget);
            return newThemeData;
        }
        async reloadCurrentProductIconTheme() {
            await this.currentProductIconTheme.reload(this.fileService, this.logService);
            this.applyAndSetProductIconTheme(this.currentProductIconTheme);
        }
        async restoreProductIconTheme() {
            const settingId = this.settings.productIconTheme;
            const theme = await this.productIconThemeRegistry.findThemeBySettingsId(settingId);
            if (theme) {
                if (settingId !== this.currentProductIconTheme.settingsId) {
                    await this.setProductIconTheme(theme.id, undefined);
                }
                return true;
            }
            return false;
        }
        applyAndSetProductIconTheme(iconThemeData) {
            this.currentProductIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, productIconThemeRulesClassName);
            this.productIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'productIcon');
            }
            this.onProductIconThemeChange.fire(this.currentProductIconTheme);
        }
    };
    WorkbenchThemeService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, log_1.ILogService)
    ], WorkbenchThemeService);
    exports.WorkbenchThemeService = WorkbenchThemeService;
    class ThemeFileWatcher {
        constructor(fileService, environmentService, onUpdate) {
            this.fileService = fileService;
            this.onUpdate = onUpdate;
            this.inExtensionDevelopment = !!environmentService.extensionDevelopmentLocationURI;
        }
        update(theme) {
            if (!resources.isEqual(theme.location, this.watchedLocation)) {
                this.dispose();
                if (theme.location && (theme.watch || this.inExtensionDevelopment)) {
                    this.watchedLocation = theme.location;
                    this.watcherDisposable = this.fileService.watch(theme.location);
                    this.fileService.onDidFilesChange(e => {
                        if (this.watchedLocation && e.contains(this.watchedLocation, 0 /* UPDATED */)) {
                            this.onUpdate();
                        }
                    });
                }
            }
        }
        dispose() {
            this.watcherDisposable = lifecycle_1.dispose(this.watcherDisposable);
            this.fileChangeListener = lifecycle_1.dispose(this.fileChangeListener);
            this.watchedLocation = undefined;
        }
    }
    function _applyRules(styleSheetContent, rulesClassName) {
        const themeStyles = document.head.getElementsByClassName(rulesClassName);
        if (themeStyles.length === 0) {
            const elStyle = document.createElement('style');
            elStyle.type = 'text/css';
            elStyle.className = rulesClassName;
            elStyle.innerHTML = styleSheetContent;
            document.head.appendChild(elStyle);
        }
        else {
            themeStyles[0].innerHTML = styleSheetContent;
        }
    }
    colorThemeSchema_1.registerColorThemeSchemas();
    fileIconThemeSchema_1.registerFileIconThemeSchemas();
    productIconThemeSchema_1.registerProductIconThemeSchemas();
    extensions_2.registerSingleton(workbenchThemeService_1.IWorkbenchThemeService, WorkbenchThemeService);
});
//# __sourceMappingURL=workbenchThemeService.js.map