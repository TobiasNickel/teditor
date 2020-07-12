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
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/common/keybindingParser", "vs/base/common/platform", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/environment/common/environment", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/keybinding/common/keybindingIO", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/workbench/api/common/menusExtensionPoint", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/json", "vs/base/common/objects", "vs/workbench/services/keybinding/common/keymapInfo", "vs/workbench/services/keybinding/common/dispatchConfig", "vs/base/common/types", "vs/base/common/scanCode", "vs/base/common/arrays", "vs/base/browser/canIUse", "vs/platform/log/common/log"], function (require, exports, nls, browser, dom, keyboardEvent_1, event_1, keybindingParser_1, platform_1, commands_1, configuration_1, configurationRegistry_1, contextkey_1, environment_1, jsonContributionRegistry_1, abstractKeybindingService_1, keybinding_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, notification_1, platform_2, telemetry_1, extensionsRegistry_1, keybindingIO_1, host_1, extensions_1, actions_1, extensions_2, menusExtensionPoint_1, lifecycle_1, async_1, files_1, json_1, objects, keymapInfo_1, dispatchConfig_1, types_1, scanCode_1, arrays_1, canIUse_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchKeybindingService = void 0;
    function isContributedKeyBindingsArray(thing) {
        return Array.isArray(thing);
    }
    function isValidContributedKeyBinding(keyBinding, rejects) {
        if (!keyBinding) {
            rejects.push(nls.localize('nonempty', "expected non-empty value."));
            return false;
        }
        if (typeof keyBinding.command !== 'string') {
            rejects.push(nls.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
            return false;
        }
        if (keyBinding.key && typeof keyBinding.key !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'key'));
            return false;
        }
        if (keyBinding.when && typeof keyBinding.when !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
            return false;
        }
        if (keyBinding.mac && typeof keyBinding.mac !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'mac'));
            return false;
        }
        if (keyBinding.linux && typeof keyBinding.linux !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'linux'));
            return false;
        }
        if (keyBinding.win && typeof keyBinding.win !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'win'));
            return false;
        }
        return true;
    }
    let keybindingType = {
        type: 'object',
        default: { command: '', key: '' },
        properties: {
            command: {
                description: nls.localize('vscode.extension.contributes.keybindings.command', 'Identifier of the command to run when keybinding is triggered.'),
                type: 'string'
            },
            args: {
                description: nls.localize('vscode.extension.contributes.keybindings.args', "Arguments to pass to the command to execute.")
            },
            key: {
                description: nls.localize('vscode.extension.contributes.keybindings.key', 'Key or key sequence (separate keys with plus-sign and sequences with space, e.g. Ctrl+O and Ctrl+L L for a chord).'),
                type: 'string'
            },
            mac: {
                description: nls.localize('vscode.extension.contributes.keybindings.mac', 'Mac specific key or key sequence.'),
                type: 'string'
            },
            linux: {
                description: nls.localize('vscode.extension.contributes.keybindings.linux', 'Linux specific key or key sequence.'),
                type: 'string'
            },
            win: {
                description: nls.localize('vscode.extension.contributes.keybindings.win', 'Windows specific key or key sequence.'),
                type: 'string'
            },
            when: {
                description: nls.localize('vscode.extension.contributes.keybindings.when', 'Condition when the key is active.'),
                type: 'string'
            },
        }
    };
    const keybindingsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'keybindings',
        deps: [menusExtensionPoint_1.commandsExtensionPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.keybindings', "Contributes keybindings."),
            oneOf: [
                keybindingType,
                {
                    type: 'array',
                    items: keybindingType
                }
            ]
        }
    });
    const NUMPAD_PRINTABLE_SCANCODES = [
        90 /* NumpadDivide */,
        91 /* NumpadMultiply */,
        92 /* NumpadSubtract */,
        93 /* NumpadAdd */,
        95 /* Numpad1 */,
        96 /* Numpad2 */,
        97 /* Numpad3 */,
        98 /* Numpad4 */,
        99 /* Numpad5 */,
        100 /* Numpad6 */,
        101 /* Numpad7 */,
        102 /* Numpad8 */,
        103 /* Numpad9 */,
        104 /* Numpad0 */,
        105 /* NumpadDecimal */
    ];
    const otherMacNumpadMapping = new Map();
    otherMacNumpadMapping.set(95 /* Numpad1 */, 22 /* KEY_1 */);
    otherMacNumpadMapping.set(96 /* Numpad2 */, 23 /* KEY_2 */);
    otherMacNumpadMapping.set(97 /* Numpad3 */, 24 /* KEY_3 */);
    otherMacNumpadMapping.set(98 /* Numpad4 */, 25 /* KEY_4 */);
    otherMacNumpadMapping.set(99 /* Numpad5 */, 26 /* KEY_5 */);
    otherMacNumpadMapping.set(100 /* Numpad6 */, 27 /* KEY_6 */);
    otherMacNumpadMapping.set(101 /* Numpad7 */, 28 /* KEY_7 */);
    otherMacNumpadMapping.set(102 /* Numpad8 */, 29 /* KEY_8 */);
    otherMacNumpadMapping.set(103 /* Numpad9 */, 30 /* KEY_9 */);
    otherMacNumpadMapping.set(104 /* Numpad0 */, 21 /* KEY_0 */);
    let WorkbenchKeybindingService = class WorkbenchKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, environmentService, configurationService, hostService, extensionService, fileService, logService, keymapService) {
            super(contextKeyService, commandService, telemetryService, notificationService);
            this.hostService = hostService;
            this.keymapService = keymapService;
            this._contributions = [];
            this.updateSchema();
            let dispatchConfig = dispatchConfig_1.getDispatchConfig(configurationService);
            configurationService.onDidChangeConfiguration((e) => {
                let newDispatchConfig = dispatchConfig_1.getDispatchConfig(configurationService);
                if (dispatchConfig === newDispatchConfig) {
                    return;
                }
                dispatchConfig = newDispatchConfig;
                this._keyboardMapper = this.keymapService.getKeyboardMapper(dispatchConfig);
                this.updateResolver({ source: 1 /* Default */ });
            });
            this._keyboardMapper = this.keymapService.getKeyboardMapper(dispatchConfig);
            this.keymapService.onDidChangeKeyboardMapper(() => {
                this._keyboardMapper = this.keymapService.getKeyboardMapper(dispatchConfig);
                this.updateResolver({ source: 1 /* Default */ });
            });
            this._cachedResolver = null;
            this.userKeybindings = this._register(new UserKeybindings(environmentService.keybindingsResource, fileService, logService));
            this.userKeybindings.initialize().then(() => {
                if (this.userKeybindings.keybindings.length) {
                    this.updateResolver({ source: 2 /* User */ });
                }
            });
            this._register(this.userKeybindings.onDidChange(() => {
                logService.debug('User keybindings changed');
                this.updateResolver({
                    source: 2 /* User */,
                    keybindings: this.userKeybindings.keybindings
                });
            }));
            keybindingsExtPoint.setHandler((extensions) => {
                let keybindings = [];
                for (let extension of extensions) {
                    this._handleKeybindingsExtensionPointUser(extension.description.isBuiltin, extension.value, extension.collector, keybindings);
                }
                keybindingsRegistry_1.KeybindingsRegistry.setExtensionKeybindings(keybindings);
                this.updateResolver({ source: 1 /* Default */ });
            });
            this.updateSchema();
            this._register(extensionService.onDidRegisterExtensions(() => this.updateSchema()));
            this._register(dom.addDisposableListener(window, dom.EventType.KEY_DOWN, (e) => {
                let keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                let shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                if (shouldPreventDefault) {
                    keyEvent.preventDefault();
                }
            }));
            let data = this.keymapService.getCurrentKeyboardLayout();
            /* __GDPR__FRAGMENT__
                "IKeyboardLayoutInfo" : {
                    "name" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "id": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "text": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            /* __GDPR__FRAGMENT__
                "IKeyboardLayoutInfo" : {
                    "model" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "layout": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "variant": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "options": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "rules": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            /* __GDPR__FRAGMENT__
                "IKeyboardLayoutInfo" : {
                    "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "lang": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            /* __GDPR__
                "keyboardLayout" : {
                    "currentKeyboardLayout": { "${inline}": [ "${IKeyboardLayoutInfo}" ] }
                }
            */
            telemetryService.publicLog('keyboardLayout', {
                currentKeyboardLayout: data
            });
            this._register(browser.onDidChangeFullscreen(() => {
                const keyboard = navigator.keyboard;
                if (canIUse_1.BrowserFeatures.keyboard === 2 /* None */) {
                    return;
                }
                if (browser.isFullscreen()) {
                    keyboard === null || keyboard === void 0 ? void 0 : keyboard.lock(['Escape']);
                }
                else {
                    keyboard === null || keyboard === void 0 ? void 0 : keyboard.unlock();
                }
                // update resolver which will bring back all unbound keyboard shortcuts
                this._cachedResolver = null;
                this._onDidUpdateKeybindings.fire({ source: 2 /* User */ });
            }));
        }
        registerSchemaContribution(contribution) {
            this._contributions.push(contribution);
            if (contribution.onDidChange) {
                this._register(contribution.onDidChange(() => this.updateSchema()));
            }
            this.updateSchema();
        }
        updateSchema() {
            updateSchema(arrays_1.flatten(this._contributions.map(x => x.getSchemaAdditions())));
        }
        _dumpDebugInfo() {
            const layoutInfo = JSON.stringify(this.keymapService.getCurrentKeyboardLayout(), null, '\t');
            const mapperInfo = this._keyboardMapper.dumpDebugInfo();
            const rawMapping = JSON.stringify(this.keymapService.getRawKeyboardMapping(), null, '\t');
            return `Layout info:\n${layoutInfo}\n${mapperInfo}\n\nRaw mapping:\n${rawMapping}`;
        }
        _dumpDebugInfoJSON() {
            const info = {
                layout: this.keymapService.getCurrentKeyboardLayout(),
                rawMapping: this.keymapService.getRawKeyboardMapping()
            };
            return JSON.stringify(info, null, '\t');
        }
        customKeybindingsCount() {
            return this.userKeybindings.keybindings.length;
        }
        updateResolver(event) {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire(event);
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._resolveKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._resolveUserKeybindingItems(this.userKeybindings.keybindings.map((k) => keybindingIO_1.KeybindingIO.readUserKeybindingItem(k)), false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides);
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            // it is possible that the document has lost focus, but the
            // window is still focused, e.g. when a <webview> element
            // has focus
            return this.hostService.hasFocus;
        }
        _resolveKeybindingItems(items, isDefault) {
            let result = [], resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault);
                }
                else {
                    if (this._assertBrowserConflicts(keybinding, item.command)) {
                        continue;
                    }
                    const resolvedKeybindings = this.resolveKeybinding(keybinding);
                    for (let i = resolvedKeybindings.length - 1; i >= 0; i--) {
                        const resolvedKeybinding = resolvedKeybindings[i];
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault);
                    }
                }
            }
            return result;
        }
        _resolveUserKeybindingItems(items, isDefault) {
            let result = [], resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const parts = item.parts;
                if (parts.length === 0) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault);
                }
                else {
                    const resolvedKeybindings = this._keyboardMapper.resolveUserBinding(parts);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault);
                    }
                }
            }
            return result;
        }
        _assertBrowserConflicts(kb, commandId) {
            if (canIUse_1.BrowserFeatures.keyboard === 0 /* Always */) {
                return false;
            }
            if (canIUse_1.BrowserFeatures.keyboard === 1 /* FullScreen */ && browser.isFullscreen()) {
                return false;
            }
            for (let part of kb.parts) {
                if (!part.metaKey && !part.altKey && !part.ctrlKey && !part.shiftKey) {
                    continue;
                }
                const modifiersMask = 2048 /* CtrlCmd */ | 512 /* Alt */ | 1024 /* Shift */;
                let partModifiersMask = 0;
                if (part.metaKey) {
                    partModifiersMask |= 2048 /* CtrlCmd */;
                }
                if (part.shiftKey) {
                    partModifiersMask |= 1024 /* Shift */;
                }
                if (part.altKey) {
                    partModifiersMask |= 512 /* Alt */;
                }
                if (part.ctrlKey && platform_1.OS === 2 /* Macintosh */) {
                    partModifiersMask |= 256 /* WinCtrl */;
                }
                if ((partModifiersMask & modifiersMask) === 2048 /* CtrlCmd */ && part.keyCode === 53 /* KEY_W */) {
                    // console.warn('Ctrl/Cmd+W keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                    return true;
                }
                if ((partModifiersMask & modifiersMask) === 2048 /* CtrlCmd */ && part.keyCode === 44 /* KEY_N */) {
                    // console.warn('Ctrl/Cmd+N keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                    return true;
                }
                if ((partModifiersMask & modifiersMask) === 2048 /* CtrlCmd */ && part.keyCode === 50 /* KEY_T */) {
                    // console.warn('Ctrl/Cmd+T keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                    return true;
                }
                if ((partModifiersMask & modifiersMask) === (2048 /* CtrlCmd */ | 512 /* Alt */) && (part.keyCode === 15 /* LeftArrow */ || part.keyCode === 17 /* RightArrow */)) {
                    // console.warn('Ctrl/Cmd+Arrow keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                    return true;
                }
                if ((partModifiersMask & modifiersMask) === 2048 /* CtrlCmd */ && part.keyCode >= 21 /* KEY_0 */ && part.keyCode <= 30 /* KEY_9 */) {
                    // console.warn('Ctrl/Cmd+Num keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                    return true;
                }
            }
            return false;
        }
        resolveKeybinding(kb) {
            return this._keyboardMapper.resolveKeybinding(kb);
        }
        resolveKeyboardEvent(keyboardEvent) {
            this.keymapService.validateCurrentKeyboardMapping(keyboardEvent);
            return this._keyboardMapper.resolveKeyboardEvent(keyboardEvent);
        }
        resolveUserBinding(userBinding) {
            const parts = keybindingParser_1.KeybindingParser.parseUserBinding(userBinding);
            return this._keyboardMapper.resolveUserBinding(parts);
        }
        _handleKeybindingsExtensionPointUser(isBuiltin, keybindings, collector, result) {
            if (isContributedKeyBindingsArray(keybindings)) {
                for (let i = 0, len = keybindings.length; i < len; i++) {
                    this._handleKeybinding(isBuiltin, i + 1, keybindings[i], collector, result);
                }
            }
            else {
                this._handleKeybinding(isBuiltin, 1, keybindings, collector, result);
            }
        }
        _handleKeybinding(isBuiltin, idx, keybindings, collector, result) {
            let rejects = [];
            if (isValidContributedKeyBinding(keybindings, rejects)) {
                let rule = this._asCommandRule(isBuiltin, idx++, keybindings);
                if (rule) {
                    result.push(rule);
                }
            }
            if (rejects.length > 0) {
                collector.error(nls.localize('invalid.keybindings', "Invalid `contributes.{0}`: {1}", keybindingsExtPoint.name, rejects.join('\n')));
            }
        }
        _asCommandRule(isBuiltin, idx, binding) {
            let { command, args, when, key, mac, linux, win } = binding;
            let weight;
            if (isBuiltin) {
                weight = 300 /* BuiltinExtension */ + idx;
            }
            else {
                weight = 400 /* ExternalExtension */ + idx;
            }
            let commandAction = actions_1.MenuRegistry.getCommand(command);
            let precondition = commandAction && commandAction.precondition;
            let fullWhen;
            if (when && precondition) {
                fullWhen = contextkey_1.ContextKeyExpr.and(precondition, contextkey_1.ContextKeyExpr.deserialize(when));
            }
            else if (when) {
                fullWhen = contextkey_1.ContextKeyExpr.deserialize(when);
            }
            else if (precondition) {
                fullWhen = precondition;
            }
            let desc = {
                id: command,
                args,
                when: fullWhen,
                weight: weight,
                primary: keybindingParser_1.KeybindingParser.parseKeybinding(key, platform_1.OS),
                mac: mac ? { primary: keybindingParser_1.KeybindingParser.parseKeybinding(mac, platform_1.OS) } : null,
                linux: linux ? { primary: keybindingParser_1.KeybindingParser.parseKeybinding(linux, platform_1.OS) } : null,
                win: win ? { primary: keybindingParser_1.KeybindingParser.parseKeybinding(win, platform_1.OS) } : null
            };
            if (!desc.primary && !desc.mac && !desc.linux && !desc.win) {
                return undefined;
            }
            return desc;
        }
        getDefaultKeybindingsContent() {
            const resolver = this._getResolver();
            const defaultKeybindings = resolver.getDefaultKeybindings();
            const boundCommands = resolver.getDefaultBoundCommands();
            return (WorkbenchKeybindingService._getDefaultKeybindings(defaultKeybindings)
                + '\n\n'
                + WorkbenchKeybindingService._getAllCommandsAsComment(boundCommands));
        }
        static _getDefaultKeybindings(defaultKeybindings) {
            let out = new keybindingIO_1.OutputBuilder();
            out.writeLine('[');
            let lastIndex = defaultKeybindings.length - 1;
            defaultKeybindings.forEach((k, index) => {
                keybindingIO_1.KeybindingIO.writeKeybindingItem(out, k);
                if (index !== lastIndex) {
                    out.writeLine(',');
                }
                else {
                    out.writeLine();
                }
            });
            out.writeLine(']');
            return out.toString();
        }
        static _getAllCommandsAsComment(boundCommands) {
            const unboundCommands = keybindingResolver_1.KeybindingResolver.getAllUnboundCommands(boundCommands);
            let pretty = unboundCommands.sort().join('\n// - ');
            return '// ' + nls.localize('unboundCommands', "Here are other available commands: ") + '\n// - ' + pretty;
        }
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                // ignore ctrl/cmd/alt-combination but not shift-combinatios
                return false;
            }
            const code = scanCode_1.ScanCodeUtils.toEnum(event.code);
            if (NUMPAD_PRINTABLE_SCANCODES.indexOf(code) !== -1) {
                // This is a numpad key that might produce a printable character based on NumLock.
                // Let's check if NumLock is on or off based on the event's keyCode.
                // e.g.
                // - when NumLock is off, ScanCode.Numpad4 produces KeyCode.LeftArrow
                // - when NumLock is on, ScanCode.Numpad4 produces KeyCode.NUMPAD_4
                // However, ScanCode.NumpadAdd always produces KeyCode.NUMPAD_ADD
                if (event.keyCode === scanCode_1.IMMUTABLE_CODE_TO_KEY_CODE[code]) {
                    // NumLock is on or this is /, *, -, + on the numpad
                    return true;
                }
                if (platform_1.isMacintosh && event.keyCode === otherMacNumpadMapping.get(code)) {
                    // on macOS, the numpad keys can also map to keys 1 - 0.
                    return true;
                }
                return false;
            }
            const keycode = scanCode_1.IMMUTABLE_CODE_TO_KEY_CODE[code];
            if (keycode !== -1) {
                // https://github.com/microsoft/vscode/issues/74934
                return false;
            }
            // consult the KeyboardMapperFactory to check the given event for
            // a printable value.
            const mapping = this.keymapService.getRawKeyboardMapping();
            if (!mapping) {
                return false;
            }
            const keyInfo = mapping[event.code];
            if (!keyInfo) {
                return false;
            }
            if (!keyInfo.value || /\s/.test(keyInfo.value)) {
                return false;
            }
            return true;
        }
    };
    WorkbenchKeybindingService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, host_1.IHostService),
        __param(7, extensions_1.IExtensionService),
        __param(8, files_1.IFileService),
        __param(9, log_1.ILogService),
        __param(10, keymapInfo_1.IKeymapService)
    ], WorkbenchKeybindingService);
    exports.WorkbenchKeybindingService = WorkbenchKeybindingService;
    class UserKeybindings extends lifecycle_1.Disposable {
        constructor(keybindingsResource, fileService, logService) {
            super();
            this.keybindingsResource = keybindingsResource;
            this.fileService = fileService;
            this._keybindings = [];
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(changed => {
                if (changed) {
                    this._onDidChange.fire();
                }
            }), 50));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.keybindingsResource))(() => {
                logService.debug('Keybindings file changed');
                this.reloadConfigurationScheduler.schedule();
            }));
        }
        get keybindings() { return this._keybindings; }
        async initialize() {
            await this.reload();
        }
        async reload() {
            const existing = this._keybindings;
            try {
                const content = await this.fileService.readFile(this.keybindingsResource);
                const value = json_1.parse(content.value.toString());
                this._keybindings = types_1.isArray(value) ? value : [];
            }
            catch (e) {
                this._keybindings = [];
            }
            return existing ? !objects.equals(existing, this._keybindings) : true;
        }
    }
    let schemaId = 'vscode://schemas/keybindings';
    let commandsSchemas = [];
    let commandsEnum = [];
    let commandsEnumDescriptions = [];
    let schema = {
        id: schemaId,
        type: 'array',
        title: nls.localize('keybindings.json.title', "Keybindings configuration"),
        allowTrailingCommas: true,
        allowComments: true,
        definitions: {
            'editorGroupsSchema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'groups': {
                            '$ref': '#/definitions/editorGroupsSchema',
                            'default': [{}, {}]
                        },
                        'size': {
                            'type': 'number',
                            'default': 0.5
                        }
                    }
                }
            }
        },
        items: {
            'required': ['key'],
            'type': 'object',
            'defaultSnippets': [{ 'body': { 'key': '$1', 'command': '$2', 'when': '$3' } }],
            'properties': {
                'key': {
                    'type': 'string',
                    'description': nls.localize('keybindings.json.key', "Key or key sequence (separated by space)"),
                },
                'command': {
                    'anyOf': [
                        {
                            'type': 'string',
                            'enum': commandsEnum,
                            'enumDescriptions': commandsEnumDescriptions,
                            'description': nls.localize('keybindings.json.command', "Name of the command to execute"),
                        },
                        {
                            'type': 'string'
                        }
                    ]
                },
                'when': {
                    'type': 'string',
                    'description': nls.localize('keybindings.json.when', "Condition when the key is active.")
                },
                'args': {
                    'description': nls.localize('keybindings.json.args', "Arguments to pass to the command to execute.")
                }
            },
            'allOf': commandsSchemas
        }
    };
    let schemaRegistry = platform_2.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(schemaId, schema);
    function updateSchema(additionalContributions) {
        commandsSchemas.length = 0;
        commandsEnum.length = 0;
        commandsEnumDescriptions.length = 0;
        const knownCommands = new Set();
        const addKnownCommand = (commandId, description) => {
            if (!/^_/.test(commandId)) {
                if (!knownCommands.has(commandId)) {
                    knownCommands.add(commandId);
                    commandsEnum.push(commandId);
                    commandsEnumDescriptions.push(description);
                    // Also add the negative form for keybinding removal
                    commandsEnum.push(`-${commandId}`);
                    commandsEnumDescriptions.push(description);
                }
            }
        };
        const allCommands = commands_1.CommandsRegistry.getCommands();
        for (const [commandId, command] of allCommands) {
            const commandDescription = command.description;
            addKnownCommand(commandId, commandDescription ? commandDescription.description : undefined);
            if (!commandDescription || !commandDescription.args || commandDescription.args.length !== 1 || !commandDescription.args[0].schema) {
                continue;
            }
            const argsSchema = commandDescription.args[0].schema;
            const argsRequired = Array.isArray(argsSchema.required) && argsSchema.required.length > 0;
            const addition = {
                'if': {
                    'properties': {
                        'command': { 'const': commandId }
                    }
                },
                'then': {
                    'required': [].concat(argsRequired ? ['args'] : []),
                    'properties': {
                        'args': argsSchema
                    }
                }
            };
            commandsSchemas.push(addition);
        }
        const menuCommands = actions_1.MenuRegistry.getCommands();
        for (const commandId of menuCommands.keys()) {
            addKnownCommand(commandId);
        }
        commandsSchemas.push(...additionalContributions);
        schemaRegistry.notifySchemaChanged(schemaId);
    }
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const keyboardConfiguration = {
        'id': 'keyboard',
        'order': 15,
        'type': 'object',
        'title': nls.localize('keyboardConfigurationTitle', "Keyboard"),
        'properties': {
            'keyboard.dispatch': {
                'type': 'string',
                'enum': ['code', 'keyCode'],
                'default': 'code',
                'markdownDescription': nls.localize('dispatch', "Controls the dispatching logic for key presses to use either `code` (recommended) or `keyCode`."),
                'included': platform_1.OS === 2 /* Macintosh */ || platform_1.OS === 3 /* Linux */
            }
        }
    };
    configurationRegistry.registerConfiguration(keyboardConfiguration);
    extensions_2.registerSingleton(keybinding_1.IKeybindingService, WorkbenchKeybindingService);
});
//# __sourceMappingURL=keybindingService.js.map