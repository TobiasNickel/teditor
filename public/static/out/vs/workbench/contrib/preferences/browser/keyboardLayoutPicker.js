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
define(["require", "exports", "vs/nls", "vs/workbench/services/statusbar/common/statusbar", "vs/base/common/lifecycle", "vs/workbench/services/keybinding/common/keymapInfo", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/workbench/contrib/preferences/common/preferences", "vs/base/common/actions", "vs/base/common/platform", "vs/platform/quickinput/common/quickInput", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/base/common/buffer"], function (require, exports, nls, statusbar_1, lifecycle_1, keymapInfo_1, platform_1, contributions_1, actions_1, preferences_1, actions_2, platform_2, quickInput_1, actions_3, configuration_1, environment_1, files_1, editorService_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutPickerAction = exports.KeyboardLayoutPickerContribution = void 0;
    let KeyboardLayoutPickerContribution = class KeyboardLayoutPickerContribution extends lifecycle_1.Disposable {
        constructor(keymapService, statusbarService) {
            super();
            this.keymapService = keymapService;
            this.statusbarService = statusbarService;
            this.pickerElement = this._register(new lifecycle_1.MutableDisposable());
            let layout = this.keymapService.getCurrentKeyboardLayout();
            if (layout) {
                let layoutInfo = keymapInfo_1.parseKeyboardLayoutDescription(layout);
                const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                this.pickerElement.value = this.statusbarService.addEntry({
                    text,
                    ariaLabel: text,
                    command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                }, 'status.workbench.keyboardLayout', nls.localize('status.workbench.keyboardLayout', "Keyboard Layout"), 1 /* RIGHT */);
            }
            this._register(keymapService.onDidChangeKeyboardMapper(() => {
                let layout = this.keymapService.getCurrentKeyboardLayout();
                let layoutInfo = keymapInfo_1.parseKeyboardLayoutDescription(layout);
                if (this.pickerElement.value) {
                    const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                    this.pickerElement.value.update({
                        text,
                        ariaLabel: text,
                        command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                    });
                }
                else {
                    const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                    this.pickerElement.value = this.statusbarService.addEntry({
                        text,
                        ariaLabel: text,
                        command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                    }, 'status.workbench.keyboardLayout', nls.localize('status.workbench.keyboardLayout', "Keyboard Layout"), 1 /* RIGHT */);
                }
            }));
        }
    };
    KeyboardLayoutPickerContribution = __decorate([
        __param(0, keymapInfo_1.IKeymapService),
        __param(1, statusbar_1.IStatusbarService)
    ], KeyboardLayoutPickerContribution);
    exports.KeyboardLayoutPickerContribution = KeyboardLayoutPickerContribution;
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(KeyboardLayoutPickerContribution, 1 /* Starting */);
    let KeyboardLayoutPickerAction = class KeyboardLayoutPickerAction extends actions_2.Action {
        constructor(actionId, actionLabel, fileService, quickInputService, keymapService, configurationService, environmentService, editorService) {
            super(actionId, actionLabel, undefined, true);
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.keymapService = keymapService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.editorService = editorService;
        }
        async run() {
            let layouts = this.keymapService.getAllKeyboardLayouts();
            let currentLayout = this.keymapService.getCurrentKeyboardLayout();
            let layoutConfig = this.configurationService.getValue('keyboard.layout');
            let isAutoDetect = layoutConfig === 'autodetect';
            const picks = layouts.map(layout => {
                const picked = !isAutoDetect && keymapInfo_1.areKeyboardLayoutsEqual(currentLayout, layout);
                const layoutInfo = keymapInfo_1.parseKeyboardLayoutDescription(layout);
                return {
                    layout: layout,
                    label: [layoutInfo.label, (layout && layout.isUserKeyboardLayout) ? '(User configured layout)' : ''].join(' '),
                    id: layout.text || layout.lang || layout.layout,
                    description: layoutInfo.description + (picked ? ' (Current layout)' : ''),
                    picked: !isAutoDetect && keymapInfo_1.areKeyboardLayoutsEqual(currentLayout, layout)
                };
            }).sort((a, b) => {
                return a.label < b.label ? -1 : (a.label > b.label ? 1 : 0);
            });
            if (picks.length > 0) {
                const platform = platform_2.isMacintosh ? 'Mac' : platform_2.isWindows ? 'Win' : 'Linux';
                picks.unshift({ type: 'separator', label: nls.localize('layoutPicks', "Keyboard Layouts ({0})", platform) });
            }
            let configureKeyboardLayout = { label: nls.localize('configureKeyboardLayout', "Configure Keyboard Layout") };
            picks.unshift(configureKeyboardLayout);
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: nls.localize('autoDetect', "Auto Detect"),
                description: isAutoDetect ? `Current: ${keymapInfo_1.parseKeyboardLayoutDescription(currentLayout).label}` : undefined,
                picked: isAutoDetect ? true : undefined
            };
            picks.unshift(autoDetectMode);
            const pick = await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickKeyboardLayout', "Select Keyboard Layout"), matchOnDescription: true });
            if (!pick) {
                return;
            }
            if (pick === autoDetectMode) {
                // set keymap service to auto mode
                this.configurationService.updateValue('keyboard.layout', 'autodetect');
                return;
            }
            if (pick === configureKeyboardLayout) {
                const file = this.environmentService.keyboardLayoutResource;
                await this.fileService.resolve(file).then(undefined, (error) => {
                    return this.fileService.createFile(file, buffer_1.VSBuffer.fromString(KeyboardLayoutPickerAction.DEFAULT_CONTENT));
                }).then((stat) => {
                    if (!stat) {
                        return undefined;
                    }
                    return this.editorService.openEditor({
                        resource: stat.resource,
                        mode: 'jsonc'
                    });
                }, (error) => {
                    throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", file.toString(), error));
                });
                return Promise.resolve();
            }
            this.configurationService.updateValue('keyboard.layout', keymapInfo_1.getKeyboardLayoutId(pick.layout));
        }
    };
    KeyboardLayoutPickerAction.ID = preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER;
    KeyboardLayoutPickerAction.LABEL = nls.localize('keyboard.chooseLayout', "Change Keyboard Layout");
    KeyboardLayoutPickerAction.DEFAULT_CONTENT = [
        `// ${nls.localize('displayLanguage', 'Defines the keyboard layout used in VS Code in the browser environment.')}`,
        `// ${nls.localize('doc', 'Open VS Code and run "Developer: Inspect Key Mappings (JSON)" from Command Palette.')}`,
        ``,
        `// Once you have the keyboard layout info, please paste it below.`,
        '\n'
    ].join('\n');
    KeyboardLayoutPickerAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, keymapInfo_1.IKeymapService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, environment_1.IEnvironmentService),
        __param(7, editorService_1.IEditorService)
    ], KeyboardLayoutPickerAction);
    exports.KeyboardLayoutPickerAction = KeyboardLayoutPickerAction;
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(KeyboardLayoutPickerAction, {}), 'Preferences: Change Keyboard Layout', nls.localize('preferences', "Preferences"));
});
//# __sourceMappingURL=keyboardLayoutPicker.js.map