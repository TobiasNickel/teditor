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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/keybinding/common/keymapInfo", "vs/platform/instantiation/common/extensions", "vs/workbench/services/keybinding/common/keyboardMapper", "vs/base/common/platform", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxFallbackKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/json", "vs/base/common/objects", "vs/platform/environment/common/environment", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/commands/common/commands", "vs/platform/storage/common/storage"], function (require, exports, nls, event_1, lifecycle_1, keymapInfo_1, extensions_1, keyboardMapper_1, platform_1, windowsKeyboardMapper_1, macLinuxFallbackKeyboardMapper_1, macLinuxKeyboardMapper_1, files_1, async_1, json_1, objects, environment_1, platform_2, configurationRegistry_1, configuration_1, notification_1, commands_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserKeyboardMapperFactory = exports.BrowserKeyboardMapperFactoryBase = void 0;
    class BrowserKeyboardMapperFactoryBase {
        constructor(
        // private _notificationService: INotificationService,
        // private _storageService: IStorageService,
        // private _commandService: ICommandService
        ) {
            this._onDidChangeKeyboardMapper = new event_1.Emitter();
            this.onDidChangeKeyboardMapper = this._onDidChangeKeyboardMapper.event;
            this._keyboardMapper = null;
            this._initialized = false;
            this._keymapInfos = [];
            this._mru = [];
            this._activeKeymapInfo = null;
            if (navigator.keyboard && navigator.keyboard.addEventListener) {
                navigator.keyboard.addEventListener('layoutchange', () => {
                    // Update user keyboard map settings
                    this._getBrowserKeyMapping().then((mapping) => {
                        if (this.isKeyMappingActive(mapping)) {
                            return;
                        }
                        this.onKeyboardLayoutChanged();
                    });
                });
            }
        }
        get activeKeymap() {
            return this._activeKeymapInfo;
        }
        get keymapInfos() {
            return this._keymapInfos;
        }
        get activeKeyboardLayout() {
            if (!this._initialized) {
                return null;
            }
            return this._activeKeymapInfo && this._activeKeymapInfo.layout;
        }
        get activeKeyMapping() {
            if (!this._initialized) {
                return null;
            }
            return this._activeKeymapInfo && this._activeKeymapInfo.mapping;
        }
        get keyboardLayouts() {
            return this._keymapInfos.map(keymapInfo => keymapInfo.layout);
        }
        registerKeyboardLayout(layout) {
            this._keymapInfos.push(layout);
            this._mru = this._keymapInfos;
        }
        removeKeyboardLayout(layout) {
            let index = this._mru.indexOf(layout);
            this._mru.splice(index, 1);
            index = this._keymapInfos.indexOf(layout);
            this._keymapInfos.splice(index, 1);
        }
        getMatchedKeymapInfo(keyMapping) {
            if (!keyMapping) {
                return null;
            }
            let usStandard = this.getUSStandardLayout();
            if (usStandard) {
                let maxScore = usStandard.getScore(keyMapping);
                if (maxScore === 0) {
                    return {
                        result: usStandard,
                        score: 0
                    };
                }
                let result = usStandard;
                for (let i = 0; i < this._mru.length; i++) {
                    let score = this._mru[i].getScore(keyMapping);
                    if (score > maxScore) {
                        if (score === 0) {
                            return {
                                result: this._mru[i],
                                score: 0
                            };
                        }
                        maxScore = score;
                        result = this._mru[i];
                    }
                }
                return {
                    result,
                    score: maxScore
                };
            }
            for (let i = 0; i < this._mru.length; i++) {
                if (this._mru[i].fuzzyEqual(keyMapping)) {
                    return {
                        result: this._mru[i],
                        score: 0
                    };
                }
            }
            return null;
        }
        getUSStandardLayout() {
            const usStandardLayouts = this._mru.filter(layout => layout.layout.isUSStandard);
            if (usStandardLayouts.length) {
                return usStandardLayouts[0];
            }
            return null;
        }
        isKeyMappingActive(keymap) {
            return this._activeKeymapInfo && keymap && this._activeKeymapInfo.fuzzyEqual(keymap);
        }
        setUSKeyboardLayout() {
            this._activeKeymapInfo = this.getUSStandardLayout();
        }
        setActiveKeyMapping(keymap) {
            let keymapUpdated = false;
            let matchedKeyboardLayout = this.getMatchedKeymapInfo(keymap);
            if (matchedKeyboardLayout) {
                // let score = matchedKeyboardLayout.score;
                // Due to https://bugs.chromium.org/p/chromium/issues/detail?id=977609, any key after a dead key will generate a wrong mapping,
                // we shoud avoid yielding the false error.
                // if (keymap && score < 0) {
                // const donotAskUpdateKey = 'missing.keyboardlayout.donotask';
                // if (this._storageService.getBoolean(donotAskUpdateKey, StorageScope.GLOBAL)) {
                // 	return;
                // }
                // // the keyboard layout doesn't actually match the key event or the keymap from chromium
                // this._notificationService.prompt(
                // 	Severity.Info,
                // 	nls.localize('missing.keyboardlayout', 'Fail to find matching keyboard layout'),
                // 	[{
                // 		label: nls.localize('keyboardLayoutMissing.configure', "Configure"),
                // 		run: () => this._commandService.executeCommand('workbench.action.openKeyboardLayoutPicker')
                // 	}, {
                // 		label: nls.localize('neverAgain', "Don't Show Again"),
                // 		isSecondary: true,
                // 		run: () => this._storageService.store(donotAskUpdateKey, true, StorageScope.GLOBAL)
                // 	}]
                // );
                // console.warn('Active keymap/keyevent does not match current keyboard layout', JSON.stringify(keymap), this._activeKeymapInfo ? JSON.stringify(this._activeKeymapInfo.layout) : '');
                // return;
                // }
                if (!this._activeKeymapInfo) {
                    this._activeKeymapInfo = matchedKeyboardLayout.result;
                    keymapUpdated = true;
                }
                else if (keymap) {
                    if (matchedKeyboardLayout.result.getScore(keymap) > this._activeKeymapInfo.getScore(keymap)) {
                        this._activeKeymapInfo = matchedKeyboardLayout.result;
                        keymapUpdated = true;
                    }
                }
            }
            if (!this._activeKeymapInfo) {
                this._activeKeymapInfo = this.getUSStandardLayout();
                keymapUpdated = true;
            }
            if (!this._activeKeymapInfo || !keymapUpdated) {
                return;
            }
            const index = this._mru.indexOf(this._activeKeymapInfo);
            this._mru.splice(index, 1);
            this._mru.unshift(this._activeKeymapInfo);
            this._setKeyboardData(this._activeKeymapInfo);
        }
        setActiveKeymapInfo(keymapInfo) {
            this._activeKeymapInfo = keymapInfo;
            const index = this._mru.indexOf(this._activeKeymapInfo);
            if (index === 0) {
                return;
            }
            this._mru.splice(index, 1);
            this._mru.unshift(this._activeKeymapInfo);
            this._setKeyboardData(this._activeKeymapInfo);
        }
        onKeyboardLayoutChanged() {
            this._updateKeyboardLayoutAsync(this._initialized);
        }
        _updateKeyboardLayoutAsync(initialized, keyboardEvent) {
            if (!initialized) {
                return;
            }
            this._getBrowserKeyMapping(keyboardEvent).then(keyMap => {
                // might be false positive
                if (this.isKeyMappingActive(keyMap)) {
                    return;
                }
                this.setActiveKeyMapping(keyMap);
            });
        }
        getKeyboardMapper(dispatchConfig) {
            if (!this._initialized) {
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            if (dispatchConfig === 1 /* KeyCode */) {
                // Forcefully set to use keyCode
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            return this._keyboardMapper;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            if (!this._initialized) {
                return;
            }
            let isCurrentKeyboard = this._validateCurrentKeyboardMapping(keyboardEvent);
            if (isCurrentKeyboard) {
                return;
            }
            this._updateKeyboardLayoutAsync(true, keyboardEvent);
        }
        setKeyboardLayout(layoutName) {
            let matchedLayouts = this.keymapInfos.filter(keymapInfo => keymapInfo_1.getKeyboardLayoutId(keymapInfo.layout) === layoutName);
            if (matchedLayouts.length > 0) {
                this.setActiveKeymapInfo(matchedLayouts[0]);
            }
        }
        _setKeyboardData(keymapInfo) {
            this._initialized = true;
            this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(BrowserKeyboardMapperFactory._createKeyboardMapper(keymapInfo));
            this._onDidChangeKeyboardMapper.fire();
        }
        static _createKeyboardMapper(keymapInfo) {
            let rawMapping = keymapInfo.mapping;
            const isUSStandard = !!keymapInfo.layout.isUSStandard;
            if (platform_1.OS === 1 /* Windows */) {
                return new windowsKeyboardMapper_1.WindowsKeyboardMapper(isUSStandard, rawMapping);
            }
            if (Object.keys(rawMapping).length === 0) {
                // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
                return new macLinuxFallbackKeyboardMapper_1.MacLinuxFallbackKeyboardMapper(platform_1.OS);
            }
            return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(isUSStandard, rawMapping, platform_1.OS);
        }
        //#region Browser API
        _validateCurrentKeyboardMapping(keyboardEvent) {
            if (!this._initialized) {
                return true;
            }
            const standardKeyboardEvent = keyboardEvent;
            const currentKeymap = this._activeKeymapInfo;
            if (!currentKeymap) {
                return true;
            }
            if (standardKeyboardEvent.browserEvent.key === 'Dead' || standardKeyboardEvent.browserEvent.isComposing) {
                return true;
            }
            const mapping = currentKeymap.mapping[standardKeyboardEvent.code];
            if (!mapping) {
                return false;
            }
            if (mapping.value === '') {
                // The value is empty when the key is not a printable character, we skip validation.
                if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
                    setTimeout(() => {
                        this._getBrowserKeyMapping().then((keymap) => {
                            if (this.isKeyMappingActive(keymap)) {
                                return;
                            }
                            this.onKeyboardLayoutChanged();
                        });
                    }, 350);
                }
                return true;
            }
            const expectedValue = standardKeyboardEvent.altKey && standardKeyboardEvent.shiftKey ? mapping.withShiftAltGr :
                standardKeyboardEvent.altKey ? mapping.withAltGr :
                    standardKeyboardEvent.shiftKey ? mapping.withShift : mapping.value;
            const isDead = (standardKeyboardEvent.altKey && standardKeyboardEvent.shiftKey && mapping.withShiftAltGrIsDeadKey) ||
                (standardKeyboardEvent.altKey && mapping.withAltGrIsDeadKey) ||
                (standardKeyboardEvent.shiftKey && mapping.withShiftIsDeadKey) ||
                mapping.valueIsDeadKey;
            if (isDead && standardKeyboardEvent.browserEvent.key !== 'Dead') {
                return false;
            }
            // TODO, this assumption is wrong as `browserEvent.key` doesn't necessarily equal expectedValue from real keymap
            if (!isDead && standardKeyboardEvent.browserEvent.key !== expectedValue) {
                return false;
            }
            return true;
        }
        async _getBrowserKeyMapping(keyboardEvent) {
            if (navigator.keyboard) {
                try {
                    return navigator.keyboard.getLayoutMap().then((e) => {
                        let ret = {};
                        for (let key of e) {
                            ret[key[0]] = {
                                'value': key[1],
                                'withShift': '',
                                'withAltGr': '',
                                'withShiftAltGr': ''
                            };
                        }
                        return ret;
                        // const matchedKeyboardLayout = this.getMatchedKeymapInfo(ret);
                        // if (matchedKeyboardLayout) {
                        // 	return matchedKeyboardLayout.result.mapping;
                        // }
                        // return null;
                    });
                }
                catch (_a) {
                    // getLayoutMap can throw if invoked from a nested browsing context
                }
            }
            else if (keyboardEvent && !keyboardEvent.shiftKey && !keyboardEvent.altKey && !keyboardEvent.metaKey && !keyboardEvent.metaKey) {
                let ret = {};
                const standardKeyboardEvent = keyboardEvent;
                ret[standardKeyboardEvent.browserEvent.code] = {
                    'value': standardKeyboardEvent.browserEvent.key,
                    'withShift': '',
                    'withAltGr': '',
                    'withShiftAltGr': ''
                };
                const matchedKeyboardLayout = this.getMatchedKeymapInfo(ret);
                if (matchedKeyboardLayout) {
                    return ret;
                }
                return null;
            }
            return null;
        }
    }
    exports.BrowserKeyboardMapperFactoryBase = BrowserKeyboardMapperFactoryBase;
    class BrowserKeyboardMapperFactory extends BrowserKeyboardMapperFactoryBase {
        constructor(notificationService, storageService, commandService) {
            // super(notificationService, storageService, commandService);
            super();
            const platform = platform_1.isWindows ? 'win' : platform_1.isMacintosh ? 'darwin' : 'linux';
            new Promise((resolve_1, reject_1) => { require(['vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.' + platform], resolve_1, reject_1); }).then((m) => {
                let keymapInfos = m.KeyboardLayoutContribution.INSTANCE.layoutInfos;
                this._keymapInfos.push(...keymapInfos.map(info => (new keymapInfo_1.KeymapInfo(info.layout, info.secondaryLayouts, info.mapping, info.isUserKeyboardLayout))));
                this._mru = this._keymapInfos;
                this._initialized = true;
                this.onKeyboardLayoutChanged();
            });
        }
    }
    exports.BrowserKeyboardMapperFactory = BrowserKeyboardMapperFactory;
    class UserKeyboardLayout extends lifecycle_1.Disposable {
        constructor(keyboardLayoutResource, fileService) {
            super();
            this.keyboardLayoutResource = keyboardLayoutResource;
            this.fileService = fileService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._keyboardLayout = null;
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(changed => {
                if (changed) {
                    this._onDidChange.fire();
                }
            }), 50));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.keyboardLayoutResource))(() => this.reloadConfigurationScheduler.schedule()));
        }
        get keyboardLayout() { return this._keyboardLayout; }
        async initialize() {
            await this.reload();
        }
        async reload() {
            const existing = this._keyboardLayout;
            try {
                const content = await this.fileService.readFile(this.keyboardLayoutResource);
                const value = json_1.parse(content.value.toString());
                if (json_1.getNodeType(value) === 'object') {
                    const layoutInfo = value.layout;
                    const mappings = value.rawMapping;
                    this._keyboardLayout = keymapInfo_1.KeymapInfo.createKeyboardLayoutFromDebugInfo(layoutInfo, mappings, true);
                }
                else {
                    this._keyboardLayout = null;
                }
            }
            catch (e) {
                this._keyboardLayout = null;
            }
            return existing ? !objects.equals(existing, this._keyboardLayout) : true;
        }
    }
    let BrowserKeymapService = class BrowserKeymapService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, notificationService, storageService, commandService, configurationService) {
            super();
            this.configurationService = configurationService;
            this._onDidChangeKeyboardMapper = new event_1.Emitter();
            this.onDidChangeKeyboardMapper = this._onDidChangeKeyboardMapper.event;
            this.layoutChangeListener = this._register(new lifecycle_1.MutableDisposable());
            const keyboardConfig = configurationService.getValue('keyboard');
            const layout = keyboardConfig.layout;
            this._factory = new BrowserKeyboardMapperFactory(notificationService, storageService, commandService);
            this.registerKeyboardListener();
            if (layout && layout !== 'autodetect') {
                // set keyboard layout
                this._factory.setKeyboardLayout(layout);
            }
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectedKeys.indexOf('keyboard.layout') >= 0) {
                    const keyboardConfig = configurationService.getValue('keyboard');
                    const layout = keyboardConfig.layout;
                    if (layout === 'autodetect') {
                        this.registerKeyboardListener();
                        this._factory.onKeyboardLayoutChanged();
                    }
                    else {
                        this._factory.setKeyboardLayout(layout);
                        this.layoutChangeListener.clear();
                    }
                }
            }));
            this._userKeyboardLayout = new UserKeyboardLayout(environmentService.keyboardLayoutResource, fileService);
            this._userKeyboardLayout.initialize().then(() => {
                if (this._userKeyboardLayout.keyboardLayout) {
                    this._factory.registerKeyboardLayout(this._userKeyboardLayout.keyboardLayout);
                    this.setUserKeyboardLayoutIfMatched();
                }
            });
            this._register(this._userKeyboardLayout.onDidChange(() => {
                let userKeyboardLayouts = this._factory.keymapInfos.filter(layout => layout.isUserKeyboardLayout);
                if (userKeyboardLayouts.length) {
                    if (this._userKeyboardLayout.keyboardLayout) {
                        userKeyboardLayouts[0].update(this._userKeyboardLayout.keyboardLayout);
                    }
                    else {
                        this._factory.removeKeyboardLayout(userKeyboardLayouts[0]);
                    }
                }
                else {
                    if (this._userKeyboardLayout.keyboardLayout) {
                        this._factory.registerKeyboardLayout(this._userKeyboardLayout.keyboardLayout);
                    }
                }
                this.setUserKeyboardLayoutIfMatched();
            }));
        }
        setUserKeyboardLayoutIfMatched() {
            const keyboardConfig = this.configurationService.getValue('keyboard');
            const layout = keyboardConfig.layout;
            if (layout && this._userKeyboardLayout.keyboardLayout) {
                if (keymapInfo_1.getKeyboardLayoutId(this._userKeyboardLayout.keyboardLayout.layout) === layout && this._factory.activeKeymap) {
                    if (!this._userKeyboardLayout.keyboardLayout.equal(this._factory.activeKeymap)) {
                        this._factory.setActiveKeymapInfo(this._userKeyboardLayout.keyboardLayout);
                    }
                }
            }
        }
        registerKeyboardListener() {
            this.layoutChangeListener.value = this._factory.onDidChangeKeyboardMapper(() => {
                this._onDidChangeKeyboardMapper.fire();
            });
        }
        getKeyboardMapper(dispatchConfig) {
            return this._factory.getKeyboardMapper(dispatchConfig);
        }
        getCurrentKeyboardLayout() {
            return this._factory.activeKeyboardLayout;
        }
        getAllKeyboardLayouts() {
            return this._factory.keyboardLayouts;
        }
        getRawKeyboardMapping() {
            return this._factory.activeKeyMapping;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            this._factory.validateCurrentKeyboardMapping(keyboardEvent);
        }
    };
    BrowserKeymapService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, notification_1.INotificationService),
        __param(3, storage_1.IStorageService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService)
    ], BrowserKeymapService);
    extensions_1.registerSingleton(keymapInfo_1.IKeymapService, BrowserKeymapService, true);
    // Configuration
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'properties': {
            'keyboard.layout': {
                'type': 'string',
                'default': 'autodetect',
                'description': nls.localize('keyboard.layout.config', "Control the keyboard layout used in web.")
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
});
//# __sourceMappingURL=keymapService.js.map