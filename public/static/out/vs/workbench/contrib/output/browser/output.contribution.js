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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/aria/aria", "vs/base/common/keyCodes", "vs/editor/common/modes/modesRegistry", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/output/browser/outputServices", "vs/workbench/contrib/output/common/output", "vs/workbench/contrib/output/browser/outputView", "vs/workbench/browser/editor", "vs/workbench/contrib/output/browser/logViewer", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/contributions", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/configuration/common/configurationRegistry", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/base/common/types", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/actions/layoutActions", "vs/base/common/codicons", "vs/css!./media/output"], function (require, exports, nls, aria, keyCodes_1, modesRegistry_1, platform_1, actions_1, extensions_1, outputServices_1, output_1, outputView_1, editor_1, logViewer_1, descriptors_1, contributions_1, instantiation_1, resolverService_1, views_1, viewPaneContainer_1, configurationRegistry_1, quickInput_1, editorService_1, types_1, layoutService_1, contextkey_1, layoutActions_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Service
    extensions_1.registerSingleton(output_1.IOutputService, outputServices_1.OutputService);
    // Register Output Mode
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: output_1.OUTPUT_MODE_ID,
        extensions: [],
        mimetypes: [output_1.OUTPUT_MIME]
    });
    // Register Log Output Mode
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: output_1.LOG_MODE_ID,
        extensions: [],
        mimetypes: [output_1.LOG_MIME]
    });
    // register output container
    const toggleOutputAcitonId = 'workbench.action.output.toggleOutput';
    const toggleOutputActionKeybindings = {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 51 /* KEY_U */,
        linux: {
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 38 /* KEY_H */) // On Ubuntu Ctrl+Shift+U is taken by some global OS command
        }
    };
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: output_1.OUTPUT_VIEW_ID,
        name: nls.localize('output', "Output"),
        icon: codicons_1.Codicon.output.classNames,
        order: 1,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [output_1.OUTPUT_VIEW_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        storageId: output_1.OUTPUT_VIEW_ID,
        hideIfEmpty: true,
        focusCommand: { id: toggleOutputAcitonId, keybindings: toggleOutputActionKeybindings }
    }, views_1.ViewContainerLocation.Panel);
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: output_1.OUTPUT_VIEW_ID,
            name: nls.localize('output', "Output"),
            containerIcon: codicons_1.Codicon.output.classNames,
            canMoveView: true,
            canToggleVisibility: false,
            ctorDescriptor: new descriptors_1.SyncDescriptor(outputView_1.OutputViewPane),
        }], VIEW_CONTAINER);
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(logViewer_1.LogViewer, logViewer_1.LogViewer.LOG_VIEWER_EDITOR_ID, nls.localize('logViewer', "Log Viewer")), [
        new descriptors_1.SyncDescriptor(logViewer_1.LogViewerInput)
    ]);
    let OutputContribution = class OutputContribution {
        constructor(instantiationService, textModelService) {
            textModelService.registerTextModelContentProvider(output_1.LOG_SCHEME, instantiationService.createInstance(outputServices_1.LogContentProvider));
        }
    };
    OutputContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], OutputContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(OutputContribution, 3 /* Restored */);
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: `workbench.output.action.switchBetweenOutputs`,
                title: nls.localize('switchToOutput.label', "Switch to Output"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyEqualsExpr.create('view', output_1.OUTPUT_VIEW_ID),
                    group: 'navigation',
                    order: 1
                },
            });
        }
        async run(accessor, channelId) {
            accessor.get(output_1.IOutputService).showChannel(channelId);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: `workbench.output.action.clearOutput`,
                title: { value: nls.localize('clearOutput.label', "Clear Output"), original: 'Clear Output' },
                category: nls.localize('viewCategory', "View"),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyEqualsExpr.create('view', output_1.OUTPUT_VIEW_ID),
                        group: 'navigation',
                        order: 2
                    }, {
                        id: actions_1.MenuId.CommandPalette
                    }, {
                        id: actions_1.MenuId.EditorContext,
                        when: output_1.CONTEXT_IN_OUTPUT
                    }],
                icon: { id: 'codicon/clear-all' }
            });
        }
        async run(accessor) {
            const outputService = accessor.get(output_1.IOutputService);
            const activeChannel = outputService.getActiveChannel();
            if (activeChannel) {
                activeChannel.clear();
                aria.status(nls.localize('outputCleared', "Output was cleared"));
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: `workbench.output.action.toggleAutoScroll`,
                title: { value: nls.localize('toggleAutoScroll', "Toggle Auto Scrolling"), original: 'Toggle Auto Scrolling' },
                tooltip: { value: nls.localize('outputScrollOff', "Turn Auto Scrolling Off"), original: 'Turn Auto Scrolling Off' },
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', output_1.OUTPUT_VIEW_ID)),
                    group: 'navigation',
                    order: 3,
                },
                icon: { id: 'codicon/unlock' },
                toggled: {
                    condition: output_1.CONTEXT_OUTPUT_SCROLL_LOCK,
                    icon: { id: 'codicon/lock' },
                    tooltip: { value: nls.localize('outputScrollOn', "Turn Auto Scrolling On"), original: 'Turn Auto Scrolling On' }
                }
            });
        }
        async run(accessor) {
            const outputView = accessor.get(views_1.IViewsService).getActiveViewWithId(output_1.OUTPUT_VIEW_ID);
            outputView.scrollLock = !outputView.scrollLock;
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: `workbench.action.openActiveLogOutputFile`,
                title: { value: nls.localize('openActiveLogOutputFile', "Open Log Output File"), original: 'Open Log Output File' },
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyEqualsExpr.create('view', output_1.OUTPUT_VIEW_ID),
                        group: 'navigation',
                        order: 4
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: output_1.CONTEXT_ACTIVE_LOG_OUTPUT,
                    }],
                icon: { id: 'codicon/go-to-file' },
                precondition: output_1.CONTEXT_ACTIVE_LOG_OUTPUT
            });
        }
        async run(accessor) {
            const outputService = accessor.get(output_1.IOutputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const logFileOutputChannelDescriptor = this.getLogFileOutputChannelDescriptor(outputService);
            if (logFileOutputChannelDescriptor) {
                await editorService.openEditor(instantiationService.createInstance(logViewer_1.LogViewerInput, logFileOutputChannelDescriptor));
            }
        }
        getLogFileOutputChannelDescriptor(outputService) {
            const channel = outputService.getActiveChannel();
            if (channel) {
                const descriptor = outputService.getChannelDescriptors().filter(c => c.id === channel.id)[0];
                if (descriptor && descriptor.file && descriptor.log) {
                    return descriptor;
                }
            }
            return null;
        }
    });
    // register toggle output action globally
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: toggleOutputAcitonId,
                title: { value: nls.localize('toggleOutput', "Toggle Output"), original: 'Toggle Output' },
                category: { value: nls.localize('viewCategory', "View"), original: 'View' },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                },
                keybinding: Object.assign(Object.assign({}, toggleOutputActionKeybindings), {
                    weight: 200 /* WorkbenchContrib */,
                    when: undefined
                }),
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            return new class ToggleOutputAction extends layoutActions_1.ToggleViewAction {
                constructor() {
                    super(toggleOutputAcitonId, 'Toggle Output', output_1.OUTPUT_VIEW_ID, viewsService, viewDescriptorService, contextKeyService, layoutService);
                }
            }().run();
        }
    });
    const devCategory = { value: nls.localize('developer', "Developer"), original: 'Developer' };
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.showLogs',
                title: { value: nls.localize('showLogs', "Show Logs..."), original: 'Show Logs...' },
                category: devCategory,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                },
            });
        }
        async run(accessor) {
            const outputService = accessor.get(output_1.IOutputService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const entries = outputService.getChannelDescriptors().filter(c => c.file && c.log)
                .map(({ id, label }) => ({ id, label }));
            const entry = await quickInputService.pick(entries, { placeHolder: nls.localize('selectlog', "Select Log") });
            if (entry) {
                return outputService.showChannel(entry.id);
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openLogFile',
                title: { value: nls.localize('openLogFile', "Open Log File..."), original: 'Open Log File...' },
                category: devCategory,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                },
            });
        }
        async run(accessor) {
            const outputService = accessor.get(output_1.IOutputService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const entries = outputService.getChannelDescriptors().filter(c => c.file && c.log)
                .map(channel => ({ id: channel.id, label: channel.label, channel }));
            const entry = await quickInputService.pick(entries, { placeHolder: nls.localize('selectlogFile', "Select Log file") });
            if (entry) {
                types_1.assertIsDefined(entry.channel.file);
                await editorService.openEditor(instantiationService.createInstance(logViewer_1.LogViewerInput, entry.channel));
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '4_panels',
        command: {
            id: toggleOutputAcitonId,
            title: nls.localize({ key: 'miToggleOutput', comment: ['&& denotes a mnemonic'] }, "&&Output")
        },
        order: 1
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'output',
        order: 30,
        title: nls.localize('output', "Output"),
        type: 'object',
        properties: {
            'output.smartScroll.enabled': {
                type: 'boolean',
                description: nls.localize('output.smartScroll.enabled', "Enable/disable the ability of smart scrolling in the output view. Smart scrolling allows you to lock scrolling automatically when you click in the output view and unlocks when you click in the last line."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['output']
            }
        }
    });
});
//# __sourceMappingURL=output.contribution.js.map