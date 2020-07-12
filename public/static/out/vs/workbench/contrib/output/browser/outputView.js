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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfigurationService", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/contrib/output/common/output", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/cancellation", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/workbench/common/views", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/opener/common/opener", "vs/workbench/services/output/common/output", "vs/platform/registry/common/platform", "vs/platform/theme/common/styler", "vs/base/common/arrays", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom"], function (require, exports, nls, actionbar_1, telemetry_1, storage_1, textResourceConfigurationService_1, instantiation_1, serviceCollection_1, contextkey_1, editor_1, textResourceEditor_1, output_1, themeService_1, configuration_1, editorGroupsService_1, cancellation_1, editorService_1, viewPaneContainer_1, keybinding_1, contextView_1, views_1, resourceEditorInput_1, opener_1, output_2, platform_1, styler_1, arrays_1, theme_1, colorRegistry_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputEditor = exports.OutputViewPane = void 0;
    let OutputViewPane = class OutputViewPane extends viewPaneContainer_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, outputService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.outputService = outputService;
            this.editorPromise = null;
            this.scrollLockContextKey = output_1.CONTEXT_OUTPUT_SCROLL_LOCK.bindTo(this.contextKeyService);
            this.editor = instantiationService.createInstance(OutputEditor);
            this._register(this.editor.onTitleAreaUpdate(() => {
                this.updateTitle(this.editor.getTitle());
                this.updateActions();
            }));
            this._register(this.onDidChangeBodyVisibility(() => this.onDidChangeVisibility(this.isBodyVisible())));
        }
        get scrollLock() { return !!this.scrollLockContextKey.get(); }
        set scrollLock(scrollLock) { this.scrollLockContextKey.set(scrollLock); }
        showChannel(channel, preserveFocus) {
            if (this.channelId !== channel.id) {
                this.setInput(channel);
            }
            if (!preserveFocus) {
                this.focus();
            }
        }
        focus() {
            super.focus();
            if (this.editorPromise) {
                this.editorPromise.then(() => this.editor.focus());
            }
        }
        renderBody(container) {
            super.renderBody(container);
            this.editor.create(container);
            dom_1.addClass(container, 'output-view');
            const codeEditor = this.editor.getControl();
            codeEditor.setAriaOptions({ role: 'document', activeDescendant: undefined });
            this._register(codeEditor.onDidChangeModelContent(() => {
                const activeChannel = this.outputService.getActiveChannel();
                if (activeChannel && !this.scrollLock) {
                    this.editor.revealLastLine();
                }
            }));
            this._register(codeEditor.onDidChangeCursorPosition((e) => {
                if (e.reason !== 3 /* Explicit */) {
                    return;
                }
                if (!this.configurationService.getValue('output.smartScroll.enabled')) {
                    return;
                }
                const model = codeEditor.getModel();
                if (model) {
                    const newPositionLine = e.position.lineNumber;
                    const lastLine = model.getLineCount();
                    this.scrollLock = lastLine !== newPositionLine;
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.editor.layout({ height, width });
        }
        getActionViewItem(action) {
            if (action.id === 'workbench.output.action.switchBetweenOutputs') {
                return this.instantiationService.createInstance(SwitchOutputActionViewItem, action);
            }
            return super.getActionViewItem(action);
        }
        onDidChangeVisibility(visible) {
            this.editor.setVisible(visible);
            let channel = undefined;
            if (visible) {
                channel = this.channelId ? this.outputService.getChannel(this.channelId) : this.outputService.getActiveChannel();
            }
            if (channel) {
                this.setInput(channel);
            }
            else {
                this.clearInput();
            }
        }
        setInput(channel) {
            this.channelId = channel.id;
            const descriptor = this.outputService.getChannelDescriptor(channel.id);
            output_1.CONTEXT_ACTIVE_LOG_OUTPUT.bindTo(this.contextKeyService).set(!!(descriptor === null || descriptor === void 0 ? void 0 : descriptor.file) && (descriptor === null || descriptor === void 0 ? void 0 : descriptor.log));
            this.editorPromise = this.editor.setInput(this.createInput(channel), editor_1.EditorOptions.create({ preserveFocus: true }), cancellation_1.CancellationToken.None)
                .then(() => this.editor);
        }
        clearInput() {
            output_1.CONTEXT_ACTIVE_LOG_OUTPUT.bindTo(this.contextKeyService).set(false);
            this.editor.clearInput();
            this.editorPromise = null;
        }
        createInput(channel) {
            return this.instantiationService.createInstance(resourceEditorInput_1.ResourceEditorInput, channel.uri, nls.localize('output model title', "{0} - Output", channel.label), nls.localize('channel', "Output channel for '{0}'", channel.label), undefined);
        }
    };
    OutputViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, output_1.IOutputService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService)
    ], OutputViewPane);
    exports.OutputViewPane = OutputViewPane;
    let OutputEditor = class OutputEditor extends textResourceEditor_1.AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, configurationService, textResourceConfigurationService, themeService, outputService, contextKeyService, editorGroupService, editorService) {
            super(output_1.OUTPUT_VIEW_ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, editorService);
            this.configurationService = configurationService;
            this.outputService = outputService;
            this.contextKeyService = contextKeyService;
            // Initially, the scoped instantiation service is the global
            // one until the editor is created later on
            this.scopedInstantiationService = instantiationService;
        }
        get instantiationService() { return this.scopedInstantiationService; }
        set instantiationService(instantiationService) { }
        getId() {
            return output_1.OUTPUT_VIEW_ID;
        }
        getTitle() {
            return nls.localize('output', "Output");
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.wordWrap = 'on'; // all output editors wrap
            options.lineNumbers = 'off'; // all output editors hide line numbers
            options.glyphMargin = false;
            options.lineDecorationsWidth = 20;
            options.rulers = [];
            options.folding = false;
            options.scrollBeyondLastLine = false;
            options.renderLineHighlight = 'none';
            options.minimap = { enabled: false };
            options.renderValidationDecorations = 'editable';
            const outputConfig = this.configurationService.getValue('[Log]');
            if (outputConfig) {
                if (outputConfig['editor.minimap.enabled']) {
                    options.minimap = { enabled: true };
                }
                if ('editor.wordWrap' in outputConfig) {
                    options.wordWrap = outputConfig['editor.wordWrap'];
                }
            }
            return options;
        }
        getAriaLabel() {
            const channel = this.outputService.getActiveChannel();
            return channel ? nls.localize('outputViewWithInputAriaLabel', "{0}, Output panel", channel.label) : nls.localize('outputViewAriaLabel', "Output panel");
        }
        async setInput(input, options, token) {
            const focus = !(options && options.preserveFocus);
            if (input.matches(this.input)) {
                return;
            }
            if (this.input) {
                // Dispose previous input (Output panel is not a workbench editor)
                this.input.dispose();
            }
            await super.setInput(input, options, token);
            if (focus) {
                this.focus();
            }
            this.revealLastLine();
        }
        clearInput() {
            if (this.input) {
                // Dispose current input (Output panel is not a workbench editor)
                this.input.dispose();
            }
            super.clearInput();
        }
        createEditor(parent) {
            parent.setAttribute('role', 'document');
            // First create the scoped instantiation service and only then construct the editor using the scoped service
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(parent));
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            super.createEditor(parent);
            output_1.CONTEXT_IN_OUTPUT.bindTo(scopedContextKeyService).set(true);
        }
    };
    OutputEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, output_1.IOutputService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, editorGroupsService_1.IEditorGroupsService),
        __param(9, editorService_1.IEditorService)
    ], OutputEditor);
    exports.OutputEditor = OutputEditor;
    let SwitchOutputActionViewItem = class SwitchOutputActionViewItem extends actionbar_1.SelectActionViewItem {
        constructor(action, outputService, themeService, contextViewService) {
            super(null, action, [], 0, contextViewService, { ariaLabel: nls.localize('outputChannels', 'Output Channels.'), optionsAsChildren: true });
            this.outputService = outputService;
            this.themeService = themeService;
            this.outputChannels = [];
            this.logChannels = [];
            let outputChannelRegistry = platform_1.Registry.as(output_2.Extensions.OutputChannels);
            this._register(outputChannelRegistry.onDidRegisterChannel(() => this.updateOtions()));
            this._register(outputChannelRegistry.onDidRemoveChannel(() => this.updateOtions()));
            this._register(this.outputService.onActiveOutputChannel(() => this.updateOtions()));
            this._register(styler_1.attachSelectBoxStyler(this.selectBox, themeService));
            this.updateOtions();
        }
        render(container) {
            super.render(container);
            dom_1.addClass(container, 'switch-output');
            this._register(styler_1.attachStylerCallback(this.themeService, { selectBorder: colorRegistry_1.selectBorder }, colors => {
                container.style.borderColor = colors.selectBorder ? `${colors.selectBorder}` : '';
            }));
        }
        getActionContext(option, index) {
            const channel = index < this.outputChannels.length ? this.outputChannels[index] : this.logChannels[index - this.outputChannels.length - 1];
            return channel ? channel.id : option;
        }
        updateOtions() {
            const groups = arrays_1.groupBy(this.outputService.getChannelDescriptors(), (c1, c2) => {
                if (!c1.log && c2.log) {
                    return -1;
                }
                if (c1.log && !c2.log) {
                    return 1;
                }
                return 0;
            });
            this.outputChannels = groups[0] || [];
            this.logChannels = groups[1] || [];
            const showSeparator = this.outputChannels.length && this.logChannels.length;
            const separatorIndex = showSeparator ? this.outputChannels.length : -1;
            const options = [...this.outputChannels.map(c => c.label), ...(showSeparator ? [SwitchOutputActionViewItem.SEPARATOR] : []), ...this.logChannels.map(c => nls.localize('logChannel', "Log ({0})", c.label))];
            let selected = 0;
            const activeChannel = this.outputService.getActiveChannel();
            if (activeChannel) {
                selected = this.outputChannels.map(c => c.id).indexOf(activeChannel.id);
                if (selected === -1) {
                    const logChannelIndex = this.logChannels.map(c => c.id).indexOf(activeChannel.id);
                    selected = logChannelIndex !== -1 ? separatorIndex + 1 + logChannelIndex : 0;
                }
            }
            this.setOptions(options.map((label, index) => ({ text: label, isDisabled: (index === separatorIndex ? true : false) })), Math.max(0, selected));
        }
    };
    SwitchOutputActionViewItem.SEPARATOR = '─────────';
    SwitchOutputActionViewItem = __decorate([
        __param(1, output_1.IOutputService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService)
    ], SwitchOutputActionViewItem);
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Sidebar background for the output view
        const sidebarBackground = theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
        if (sidebarBackground && sidebarBackground !== theme.getColor(colorRegistry_1.editorBackground)) {
            collector.addRule(`
			.monaco-workbench .part.sidebar .output-view .monaco-editor,
			.monaco-workbench .part.sidebar .output-view .monaco-editor .margin,
			.monaco-workbench .part.sidebar .output-view .monaco-editor .monaco-editor-background {
				background-color: ${sidebarBackground};
			}
		`);
        }
    });
});
//# __sourceMappingURL=outputView.js.map