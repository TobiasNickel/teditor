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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/platform", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalFindWidget", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/base/browser/mouseEvent", "vs/base/common/uri", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/base/browser/dnd", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/browser/canIUse", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/workbench/common/theme"], function (require, exports, dom, nls, platform, actionbar_1, configuration_1, contextView_1, instantiation_1, telemetry_1, themeService_1, terminalFindWidget_1, terminalActions_1, mouseEvent_1, uri_1, terminalColorRegistry_1, dnd_1, notification_1, storage_1, terminal_1, canIUse_1, viewPaneContainer_1, keybinding_1, contextkey_1, views_1, opener_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalViewPane = void 0;
    const FIND_FOCUS_CLASS = 'find-focused';
    let TerminalViewPane = class TerminalViewPane extends viewPaneContainer_1.ViewPane {
        constructor(options, keybindingService, contextKeyService, viewDescriptorService, configurationService, _contextMenuService, _instantiationService, _terminalService, themeService, telemetryService, _notificationService, storageService, openerService) {
            super(options, keybindingService, _contextMenuService, configurationService, contextKeyService, viewDescriptorService, _instantiationService, openerService, themeService, telemetryService);
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this.themeService = themeService;
            this._notificationService = _notificationService;
            this._cancelContextMenu = false;
            this._bodyDimensions = { width: 0, height: 0 };
        }
        renderBody(container) {
            super.renderBody(container);
            this._parentDomElement = container;
            dom.addClass(this._parentDomElement, 'integrated-terminal');
            this._fontStyleElement = document.createElement('style');
            this._terminalContainer = document.createElement('div');
            dom.addClass(this._terminalContainer, 'terminal-outer-container');
            this._findWidget = this._instantiationService.createInstance(terminalFindWidget_1.TerminalFindWidget, this._terminalService.getFindState());
            this._findWidget.focusTracker.onDidFocus(() => this._terminalContainer.classList.add(FIND_FOCUS_CLASS));
            this._parentDomElement.appendChild(this._fontStyleElement);
            this._parentDomElement.appendChild(this._terminalContainer);
            this._parentDomElement.appendChild(this._findWidget.getDomNode());
            this._attachEventListeners(this._parentDomElement, this._terminalContainer);
            this._terminalService.setContainers(container, this._terminalContainer);
            this._register(this.themeService.onDidColorThemeChange(theme => this._updateTheme(theme)));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('terminal.integrated.fontFamily') || e.affectsConfiguration('editor.fontFamily')) {
                    const configHelper = this._terminalService.configHelper;
                    if (!configHelper.configFontIsMonospace()) {
                        const choices = [{
                                label: nls.localize('terminal.useMonospace', "Use 'monospace'"),
                                run: () => this.configurationService.updateValue('terminal.integrated.fontFamily', 'monospace'),
                            }];
                        this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('terminal.monospaceOnly', "The terminal only supports monospace fonts. Be sure to restart VS Code if this is a newly installed font."), choices);
                    }
                }
            }));
            this._updateTheme();
            this._register(this.onDidChangeBodyVisibility(visible => {
                var _a;
                if (visible) {
                    const hadTerminals = this._terminalService.terminalInstances.length > 0;
                    if (!hadTerminals) {
                        this._terminalService.createTerminal();
                    }
                    this._updateTheme();
                    if (hadTerminals) {
                        (_a = this._terminalService.getActiveTab()) === null || _a === void 0 ? void 0 : _a.setVisible(visible);
                    }
                    else {
                        this.layoutBody(this._bodyDimensions.height, this._bodyDimensions.width);
                    }
                }
            }));
            // Force another layout (first is setContainers) since config has changed
            this.layoutBody(this._terminalContainer.offsetHeight, this._terminalContainer.offsetWidth);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this._bodyDimensions.width = width;
            this._bodyDimensions.height = height;
            this._terminalService.terminalTabs.forEach(t => t.layout(width, height));
            // Update orientation of split button icon
            if (this._splitTerminalAction) {
                this._splitTerminalAction.class = this.orientation === 1 /* HORIZONTAL */ ? terminalActions_1.SplitTerminalAction.HORIZONTAL_CLASS : terminalActions_1.SplitTerminalAction.VERTICAL_CLASS;
            }
        }
        getActions() {
            if (!this._actions) {
                this._splitTerminalAction = this._instantiationService.createInstance(terminalActions_1.SplitTerminalAction, terminalActions_1.SplitTerminalAction.ID, terminalActions_1.SplitTerminalAction.LABEL);
                this._actions = [
                    this._instantiationService.createInstance(terminalActions_1.SwitchTerminalAction, terminalActions_1.SwitchTerminalAction.ID, terminalActions_1.SwitchTerminalAction.LABEL),
                    this._instantiationService.createInstance(terminalActions_1.CreateNewTerminalAction, terminalActions_1.CreateNewTerminalAction.ID, terminalActions_1.CreateNewTerminalAction.SHORT_LABEL),
                    this._splitTerminalAction,
                    this._instantiationService.createInstance(terminalActions_1.KillTerminalAction, terminalActions_1.KillTerminalAction.ID, terminalActions_1.KillTerminalAction.PANEL_LABEL)
                ];
                this._actions.forEach(a => {
                    this._register(a);
                });
            }
            return this._actions;
        }
        _getContextMenuActions() {
            if (!this._contextMenuActions || !this._copyContextMenuAction) {
                this._copyContextMenuAction = this._instantiationService.createInstance(terminalActions_1.CopyTerminalSelectionAction, terminalActions_1.CopyTerminalSelectionAction.ID, terminalActions_1.CopyTerminalSelectionAction.SHORT_LABEL);
                const clipboardActions = [];
                if (canIUse_1.BrowserFeatures.clipboard.writeText) {
                    clipboardActions.push(this._copyContextMenuAction);
                }
                if (canIUse_1.BrowserFeatures.clipboard.readText) {
                    clipboardActions.push(this._instantiationService.createInstance(terminalActions_1.TerminalPasteAction, terminalActions_1.TerminalPasteAction.ID, terminalActions_1.TerminalPasteAction.SHORT_LABEL));
                }
                clipboardActions.push(this._instantiationService.createInstance(terminalActions_1.SelectAllTerminalAction, terminalActions_1.SelectAllTerminalAction.ID, terminalActions_1.SelectAllTerminalAction.LABEL));
                this._contextMenuActions = [
                    this._instantiationService.createInstance(terminalActions_1.CreateNewTerminalAction, terminalActions_1.CreateNewTerminalAction.ID, terminalActions_1.CreateNewTerminalAction.SHORT_LABEL),
                    this._instantiationService.createInstance(terminalActions_1.SplitTerminalAction, terminalActions_1.SplitTerminalAction.ID, terminalActions_1.SplitTerminalAction.SHORT_LABEL),
                    new actionbar_1.Separator(),
                    ...clipboardActions,
                    new actionbar_1.Separator(),
                    this._instantiationService.createInstance(terminalActions_1.ClearTerminalAction, terminalActions_1.ClearTerminalAction.ID, terminalActions_1.ClearTerminalAction.LABEL),
                    new actionbar_1.Separator(),
                    this._instantiationService.createInstance(terminalActions_1.KillTerminalAction, terminalActions_1.KillTerminalAction.ID, terminalActions_1.KillTerminalAction.PANEL_LABEL)
                ];
                this._contextMenuActions.forEach(a => {
                    this._register(a);
                });
            }
            const activeInstance = this._terminalService.getActiveInstance();
            this._copyContextMenuAction.enabled = !!activeInstance && activeInstance.hasSelection();
            return this._contextMenuActions;
        }
        getActionViewItem(action) {
            if (action.id === terminalActions_1.SwitchTerminalAction.ID) {
                return this._instantiationService.createInstance(terminalActions_1.SwitchTerminalActionViewItem, action);
            }
            return super.getActionViewItem(action);
        }
        focus() {
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance) {
                activeInstance.focusWhenReady(true);
            }
        }
        focusFindWidget() {
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance && activeInstance.hasSelection() && activeInstance.selection.indexOf('\n') === -1) {
                this._findWidget.reveal(activeInstance.selection);
            }
            else {
                this._findWidget.reveal();
            }
        }
        hideFindWidget() {
            this._findWidget.hide();
        }
        showFindWidget() {
            const activeInstance = this._terminalService.getActiveInstance();
            if (activeInstance && activeInstance.hasSelection() && activeInstance.selection.indexOf('\n') === -1) {
                this._findWidget.show(activeInstance.selection);
            }
            else {
                this._findWidget.show();
            }
        }
        getFindWidget() {
            return this._findWidget;
        }
        _attachEventListeners(parentDomElement, terminalContainer) {
            this._register(dom.addDisposableListener(parentDomElement, 'mousedown', async (event) => {
                if (this._terminalService.terminalInstances.length === 0) {
                    return;
                }
                if (event.which === 2 && platform.isLinux) {
                    // Drop selection and focus terminal on Linux to enable middle button paste when click
                    // occurs on the selection itself.
                    const terminal = this._terminalService.getActiveInstance();
                    if (terminal) {
                        terminal.focus();
                    }
                }
                else if (event.which === 3) {
                    const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                    if (rightClickBehavior === 'copyPaste' || rightClickBehavior === 'paste') {
                        const terminal = this._terminalService.getActiveInstance();
                        if (!terminal) {
                            return;
                        }
                        // copyPaste: Shift+right click should open context menu
                        if (rightClickBehavior === 'copyPaste' && event.shiftKey) {
                            this._openContextMenu(event);
                            return;
                        }
                        if (rightClickBehavior === 'copyPaste' && terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            terminal.paste();
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(parentDomElement, 'contextmenu', (event) => {
                if (!this._cancelContextMenu) {
                    this._openContextMenu(event);
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                this._cancelContextMenu = false;
            }));
            this._register(dom.addDisposableListener(document, 'keydown', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(document, 'keyup', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(parentDomElement, 'keyup', (event) => {
                if (event.keyCode === 27) {
                    // Keep terminal open on escape
                    event.stopPropagation();
                }
            }));
            this._register(dom.addDisposableListener(parentDomElement, dom.EventType.DROP, async (e) => {
                if (e.target === this._parentDomElement || dom.isAncestor(e.target, parentDomElement)) {
                    if (!e.dataTransfer) {
                        return;
                    }
                    // Check if files were dragged from the tree explorer
                    let path;
                    const resources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                    if (resources) {
                        path = uri_1.URI.parse(JSON.parse(resources)[0]).fsPath;
                    }
                    else if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                        // Check if the file was dragged from the filesystem
                        path = uri_1.URI.file(e.dataTransfer.files[0].path).fsPath;
                    }
                    if (!path) {
                        return;
                    }
                    const terminal = this._terminalService.getActiveInstance();
                    if (terminal) {
                        const preparedPath = await this._terminalService.preparePathForTerminalAsync(path, terminal.shellLaunchConfig.executable, terminal.title, terminal.shellType);
                        terminal.sendText(preparedPath, false);
                        terminal.focus();
                    }
                }
            }));
        }
        _openContextMenu(event) {
            const standardEvent = new mouseEvent_1.StandardMouseEvent(event);
            const anchor = { x: standardEvent.posx, y: standardEvent.posy };
            this._contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => this._getContextMenuActions(),
                getActionsContext: () => this._parentDomElement
            });
        }
        _updateTheme(theme) {
            if (!theme) {
                theme = this.themeService.getColorTheme();
            }
            if (this._findWidget) {
                this._findWidget.updateTheme(theme);
            }
        }
    };
    TerminalViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, notification_1.INotificationService),
        __param(11, storage_1.IStorageService),
        __param(12, opener_1.IOpenerService)
    ], TerminalViewPane);
    exports.TerminalViewPane = TerminalViewPane;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const panelBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.PANEL_BACKGROUND);
        collector.addRule(`.monaco-workbench .part.panel .pane-body.integrated-terminal .terminal-outer-container { background-color: ${panelBackgroundColor ? panelBackgroundColor.toString() : ''}; }`);
        const sidebarBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
        collector.addRule(`.monaco-workbench .part.sidebar .pane-body.integrated-terminal .terminal-outer-container { background-color: ${sidebarBackgroundColor ? sidebarBackgroundColor.toString() : ''}; }`);
        const borderColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BORDER_COLOR);
        if (borderColor) {
            collector.addRule(`.monaco-workbench .pane-body.integrated-terminal .split-view-view:not(:first-child) { border-color: ${borderColor.toString()}; }`);
        }
    });
});
//# __sourceMappingURL=terminalView.js.map