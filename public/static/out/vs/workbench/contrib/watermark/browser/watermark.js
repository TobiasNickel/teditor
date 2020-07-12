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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/platform/keybinding/common/keybinding", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspace/common/workspace", "vs/workbench/common/contributions", "vs/platform/lifecycle/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/contrib/quickaccess/browser/commandsQuickAccess", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/search/common/constants", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/workbench/common/configuration", "vs/workbench/contrib/files/browser/fileCommands", "vs/css!./watermark"], function (require, exports, lifecycle_1, objects_1, platform_1, keybinding_1, nls, platform_2, configurationRegistry_1, workspace_1, contributions_1, lifecycle_2, configuration_1, workspaceActions_1, commandsQuickAccess_1, layoutService_1, debugActions_1, constants_1, dom, keybindingLabel_1, editorGroupsService_1, commands_1, types_1, configuration_2, fileCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WatermarkContribution = void 0;
    const $ = dom.$;
    const showCommands = { text: nls.localize('watermark.showCommands', "Show All Commands"), id: commandsQuickAccess_1.ShowAllCommandsAction.ID };
    const quickAccess = { text: nls.localize('watermark.quickAccess', "Go to File"), id: 'workbench.action.quickOpen' };
    const openFileNonMacOnly = { text: nls.localize('watermark.openFile', "Open File"), id: workspaceActions_1.OpenFileAction.ID, mac: false };
    const openFolderNonMacOnly = { text: nls.localize('watermark.openFolder', "Open Folder"), id: workspaceActions_1.OpenFolderAction.ID, mac: false };
    const openFileOrFolderMacOnly = { text: nls.localize('watermark.openFileFolder', "Open File or Folder"), id: workspaceActions_1.OpenFileFolderAction.ID, mac: true };
    const openRecent = { text: nls.localize('watermark.openRecent', "Open Recent"), id: 'workbench.action.openRecent' };
    const newUntitledFile = { text: nls.localize('watermark.newUntitledFile', "New Untitled File"), id: fileCommands_1.NEW_UNTITLED_FILE_COMMAND_ID };
    const newUntitledFileMacOnly = objects_1.assign({ mac: true }, newUntitledFile);
    const toggleTerminal = { text: nls.localize({ key: 'watermark.toggleTerminal', comment: ['toggle is a verb here'] }, "Toggle Terminal"), id: "workbench.action.terminal.toggleTerminal" /* TOGGLE */ };
    const findInFiles = { text: nls.localize('watermark.findInFiles', "Find in Files"), id: constants_1.FindInFilesActionId };
    const startDebugging = { text: nls.localize('watermark.startDebugging', "Start Debugging"), id: debugActions_1.StartAction.ID };
    const noFolderEntries = [
        showCommands,
        openFileNonMacOnly,
        openFolderNonMacOnly,
        openFileOrFolderMacOnly,
        openRecent,
        newUntitledFileMacOnly
    ];
    const folderEntries = [
        showCommands,
        quickAccess,
        findInFiles,
        startDebugging,
        toggleTerminal
    ];
    const WORKBENCH_TIPS_ENABLED_KEY = 'workbench.tips.enabled';
    let WatermarkContribution = class WatermarkContribution extends lifecycle_1.Disposable {
        constructor(lifecycleService, layoutService, keybindingService, contextService, configurationService, editorGroupsService) {
            super();
            this.lifecycleService = lifecycleService;
            this.layoutService = layoutService;
            this.keybindingService = keybindingService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.editorGroupsService = editorGroupsService;
            this.watermarkDisposable = this._register(new lifecycle_1.DisposableStore());
            this.workbenchState = contextService.getWorkbenchState();
            this.enabled = this.configurationService.getValue(WORKBENCH_TIPS_ENABLED_KEY);
            this.registerListeners();
            if (this.enabled) {
                this.create();
            }
        }
        registerListeners() {
            this.lifecycleService.onShutdown(this.dispose, this);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(WORKBENCH_TIPS_ENABLED_KEY)) {
                    const enabled = this.configurationService.getValue(WORKBENCH_TIPS_ENABLED_KEY);
                    if (enabled !== this.enabled) {
                        this.enabled = enabled;
                        if (this.enabled) {
                            this.create();
                        }
                        else {
                            this.destroy();
                        }
                    }
                }
            }));
            this._register(this.contextService.onDidChangeWorkbenchState(e => {
                const previousWorkbenchState = this.workbenchState;
                this.workbenchState = this.contextService.getWorkbenchState();
                if (this.enabled && this.workbenchState !== previousWorkbenchState) {
                    this.recreate();
                }
            }));
        }
        create() {
            const container = types_1.assertIsDefined(this.layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */));
            container.classList.add('has-watermark');
            this.watermark = $('.watermark');
            const box = dom.append(this.watermark, $('.watermark-box'));
            const folder = this.workbenchState !== 1 /* EMPTY */;
            const selected = folder ? folderEntries : noFolderEntries
                .filter(entry => !('mac' in entry) || entry.mac === platform_1.isMacintosh)
                .filter(entry => !!commands_1.CommandsRegistry.getCommand(entry.id));
            const update = () => {
                dom.clearNode(box);
                selected.map(entry => {
                    const dl = dom.append(box, $('dl'));
                    const dt = dom.append(dl, $('dt'));
                    dt.textContent = entry.text;
                    const dd = dom.append(dl, $('dd'));
                    const keybinding = new keybindingLabel_1.KeybindingLabel(dd, platform_1.OS, { renderUnboundKeybindings: true });
                    keybinding.set(this.keybindingService.lookupKeybinding(entry.id));
                    dd.innerHTML = keybinding.element.outerHTML;
                });
            };
            update();
            dom.prepend(container.firstElementChild, this.watermark);
            this.watermarkDisposable.add(this.keybindingService.onDidUpdateKeybindings(update));
            this.watermarkDisposable.add(this.editorGroupsService.onDidLayout(dimension => this.handleEditorPartSize(container, dimension)));
            this.handleEditorPartSize(container, this.editorGroupsService.contentDimension);
        }
        handleEditorPartSize(container, dimension) {
            if (dimension.height <= 478) {
                dom.addClass(container, 'max-height-478px');
            }
            else {
                dom.removeClass(container, 'max-height-478px');
            }
        }
        destroy() {
            if (this.watermark) {
                this.watermark.remove();
                const container = this.layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */);
                if (container) {
                    container.classList.remove('has-watermark');
                }
                this.watermarkDisposable.clear();
            }
        }
        recreate() {
            this.destroy();
            this.create();
        }
    };
    WatermarkContribution = __decorate([
        __param(0, lifecycle_2.ILifecycleService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, editorGroupsService_1.IEditorGroupsService)
    ], WatermarkContribution);
    exports.WatermarkContribution = WatermarkContribution;
    platform_2.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WatermarkContribution, 3 /* Restored */);
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration(Object.assign(Object.assign({}, configuration_2.workbenchConfigurationNodeBase), { 'properties': {
            'workbench.tips.enabled': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('tips.enabled', "When enabled, will show the watermark tips when no editor is open.")
            },
        } }));
});
//# __sourceMappingURL=watermark.js.map