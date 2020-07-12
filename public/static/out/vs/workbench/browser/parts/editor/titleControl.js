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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/workbench/common/editor", "vs/workbench/common/resources", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/base/common/types", "vs/base/browser/browser", "vs/css!./media/titlecontrol"], function (require, exports, dnd_1, dom_1, mouseEvent_1, actionbar_1, toolbar_1, arrays, lifecycle_1, editorBrowser_1, nls_1, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, quickInput_1, telemetry_1, colorRegistry_1, themeService_1, dnd_2, baseEditor_1, breadcrumbs_1, breadcrumbsControl_1, editor_1, resources_1, extensions_1, files_1, types_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitleControl = void 0;
    let TitleControl = class TitleControl extends themeService_1.Themable {
        constructor(parent, accessor, group, contextMenuService, instantiationService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickInputService, themeService, extensionService, configurationService, fileService) {
            super(themeService);
            this.accessor = accessor;
            this.group = group;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.quickInputService = quickInputService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.breadcrumbsControl = undefined;
            this.currentPrimaryEditorActionIds = [];
            this.currentSecondaryEditorActionIds = [];
            this.editorToolBarMenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.resourceContext = this._register(instantiationService.createInstance(resources_1.ResourceContextKey));
            this.editorPinnedContext = editor_1.EditorPinnedContext.bindTo(contextKeyService);
            this.editorStickyContext = editor_1.EditorStickyContext.bindTo(contextKeyService);
            this.contextMenu = this._register(this.menuService.createMenu(actions_1.MenuId.EditorTitleContext, this.contextKeyService));
            this.create(parent);
            this.registerListeners();
        }
        registerListeners() {
            // Update actions toolbar when extension register that may contribute them
            this._register(this.extensionService.onDidRegisterExtensions(() => this.updateEditorActionsToolbar()));
        }
        createBreadcrumbsControl(container, options) {
            const config = this._register(breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(this.configurationService));
            this._register(config.onDidChange(() => {
                const value = config.getValue();
                if (!value && this.breadcrumbsControl) {
                    this.breadcrumbsControl.dispose();
                    this.breadcrumbsControl = undefined;
                    this.handleBreadcrumbsEnablementChange();
                }
                else if (value && !this.breadcrumbsControl) {
                    this.breadcrumbsControl = this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControl, container, options, this.group);
                    this.breadcrumbsControl.update();
                    this.handleBreadcrumbsEnablementChange();
                }
            }));
            if (config.getValue()) {
                this.breadcrumbsControl = this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControl, container, options, this.group);
            }
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(() => {
                if (this.breadcrumbsControl && this.breadcrumbsControl.update()) {
                    this.handleBreadcrumbsEnablementChange();
                }
            }));
        }
        createEditorActionsToolBar(container) {
            const context = { groupId: this.group.id };
            this.editorActionsToolbar = this._register(new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionViewItemProvider: action => this.actionViewItemProvider(action),
                orientation: 0 /* HORIZONTAL */,
                ariaLabel: nls_1.localize('araLabelEditorActions', "Editor actions"),
                getKeyBinding: action => this.getKeybinding(action),
                actionRunner: this._register(new editor_1.EditorCommandsContextActionRunner(context)),
                anchorAlignmentProvider: () => 1 /* RIGHT */
            }));
            // Context
            this.editorActionsToolbar.context = context;
            // Action Run Handling
            this._register(this.editorActionsToolbar.actionRunner.onDidRun((e) => {
                // Notify for Error
                this.notificationService.error(e.error);
                // Log in telemetry
                if (this.telemetryService) {
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'editorPart' });
                }
            }));
        }
        actionViewItemProvider(action) {
            const activeEditorPane = this.group.activeEditorPane;
            // Check Active Editor
            let actionViewItem = undefined;
            if (activeEditorPane instanceof baseEditor_1.BaseEditor) {
                actionViewItem = activeEditorPane.getActionViewItem(action);
            }
            // Check extensions
            if (!actionViewItem) {
                actionViewItem = menuEntryActionViewItem_1.createActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
            }
            return actionViewItem;
        }
        updateEditorActionsToolbar() {
            // Update Editor Actions Toolbar
            const { primaryEditorActions, secondaryEditorActions } = this.prepareEditorActions(this.getEditorActions());
            // Only update if something actually has changed
            const primaryEditorActionIds = primaryEditorActions.map(a => a.id);
            const secondaryEditorActionIds = secondaryEditorActions.map(a => a.id);
            if (!arrays.equals(primaryEditorActionIds, this.currentPrimaryEditorActionIds) ||
                !arrays.equals(secondaryEditorActionIds, this.currentSecondaryEditorActionIds) ||
                primaryEditorActions.some(action => action instanceof actions_1.ExecuteCommandAction) || // execute command actions can have the same ID but different arguments
                secondaryEditorActions.some(action => action instanceof actions_1.ExecuteCommandAction) // see also https://github.com/Microsoft/vscode/issues/16298
            ) {
                const editorActionsToolbar = types_1.assertIsDefined(this.editorActionsToolbar);
                editorActionsToolbar.setActions(primaryEditorActions, secondaryEditorActions)();
                this.currentPrimaryEditorActionIds = primaryEditorActionIds;
                this.currentSecondaryEditorActionIds = secondaryEditorActionIds;
            }
        }
        prepareEditorActions(editorActions) {
            let primaryEditorActions;
            let secondaryEditorActions;
            // Primary actions only for the active group
            if (this.accessor.activeGroup === this.group) {
                primaryEditorActions = actionbar_1.prepareActions(editorActions.primary);
            }
            else {
                primaryEditorActions = [];
            }
            // Secondary actions for all groups
            secondaryEditorActions = actionbar_1.prepareActions(editorActions.secondary);
            return { primaryEditorActions, secondaryEditorActions };
        }
        getEditorActions() {
            const primary = [];
            const secondary = [];
            // Dispose previous listeners
            this.editorToolBarMenuDisposables.clear();
            // Update contexts
            this.resourceContext.set(this.group.activeEditor ? types_1.withUndefinedAsNull(editor_1.toResource(this.group.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY })) : null);
            this.editorPinnedContext.set(this.group.activeEditor ? this.group.isPinned(this.group.activeEditor) : false);
            this.editorStickyContext.set(this.group.activeEditor ? this.group.isSticky(this.group.activeEditor) : false);
            // Editor actions require the editor control to be there, so we retrieve it via service
            const activeEditorPane = this.group.activeEditorPane;
            if (activeEditorPane instanceof baseEditor_1.BaseEditor) {
                const codeEditor = editorBrowser_1.getCodeEditor(activeEditorPane.getControl());
                const scopedContextKeyService = (codeEditor === null || codeEditor === void 0 ? void 0 : codeEditor.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService))) || this.contextKeyService;
                const titleBarMenu = this.menuService.createMenu(actions_1.MenuId.EditorTitle, scopedContextKeyService);
                this.editorToolBarMenuDisposables.add(titleBarMenu);
                this.editorToolBarMenuDisposables.add(titleBarMenu.onDidChange(() => {
                    this.updateEditorActionsToolbar(); // Update editor toolbar whenever contributed actions change
                }));
                this.editorToolBarMenuDisposables.add(menuEntryActionViewItem_1.createAndFillInActionBarActions(titleBarMenu, { arg: this.resourceContext.get(), shouldForwardArgs: true }, { primary, secondary }));
            }
            return { primary, secondary };
        }
        clearEditorActionsToolbar() {
            if (this.editorActionsToolbar) {
                this.editorActionsToolbar.setActions([], [])();
            }
            this.currentPrimaryEditorActionIds = [];
            this.currentSecondaryEditorActionIds = [];
        }
        enableGroupDragging(element) {
            // Drag start
            this._register(dom_1.addDisposableListener(element, dom_1.EventType.DRAG_START, (e) => {
                var _a;
                if (e.target !== element) {
                    return; // only if originating from tabs container
                }
                // Set editor group as transfer
                this.groupTransfer.setData([new dnd_2.DraggedEditorGroupIdentifier(this.group.id)], dnd_2.DraggedEditorGroupIdentifier.prototype);
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'copyMove';
                }
                // If tabs are disabled, treat dragging as if an editor tab was dragged
                let hasDataTransfer = false;
                if (!this.accessor.partOptions.showTabs) {
                    if (this.group.activeEditor) {
                        hasDataTransfer = this.doFillResourceDataTransfers(this.group.activeEditor, e);
                    }
                }
                // Firefox: requires to set a text data transfer to get going
                if (!hasDataTransfer && browser_1.isFirefox) {
                    (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData(dnd_1.DataTransfers.TEXT, String(this.group.label));
                }
                // Drag Image
                if (this.group.activeEditor) {
                    let label = this.group.activeEditor.getName();
                    if (this.accessor.partOptions.showTabs && this.group.count > 1) {
                        label = nls_1.localize('draggedEditorGroup', "{0} (+{1})", label, this.group.count - 1);
                    }
                    dnd_1.applyDragImage(e, label, 'monaco-editor-group-drag-image');
                }
            }));
            // Drag end
            this._register(dom_1.addDisposableListener(element, dom_1.EventType.DRAG_END, () => {
                this.groupTransfer.clearData(dnd_2.DraggedEditorGroupIdentifier.prototype);
            }));
        }
        doFillResourceDataTransfers(editor, e) {
            const resource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!resource) {
                return false;
            }
            const editorOptions = {
                viewState: (() => {
                    var _a;
                    if (this.group.activeEditor === editor) {
                        const activeControl = (_a = this.group.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
                        if (editorBrowser_1.isCodeEditor(activeControl)) {
                            return types_1.withNullAsUndefined(activeControl.saveViewState());
                        }
                    }
                    return undefined;
                })(),
                sticky: this.group.isSticky(editor)
            };
            this.instantiationService.invokeFunction(dnd_2.fillResourceDataTransfers, [resource], () => editorOptions, e);
            return true;
        }
        onContextMenu(editor, e, node) {
            // Update contexts based on editor picked and remember previous to restore
            const currentResourceContext = this.resourceContext.get();
            this.resourceContext.set(types_1.withUndefinedAsNull(editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY })));
            const currentPinnedContext = !!this.editorPinnedContext.get();
            this.editorPinnedContext.set(this.group.isPinned(editor));
            const currentStickyContext = !!this.editorStickyContext.get();
            this.editorStickyContext.set(this.group.isSticky(editor));
            // Find target anchor
            let anchor = node;
            if (e instanceof MouseEvent) {
                const event = new mouseEvent_1.StandardMouseEvent(e);
                anchor = { x: event.posx, y: event.posy };
            }
            // Fill in contributed actions
            const actions = [];
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contextMenu, { shouldForwardArgs: true, arg: this.resourceContext.get() }, actions, this.contextMenuService);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => ({ groupId: this.group.id, editorIndex: this.group.getIndexOfEditor(editor) }),
                getKeyBinding: (action) => this.getKeybinding(action),
                onHide: () => {
                    // restore previous contexts
                    this.resourceContext.set(currentResourceContext || null);
                    this.editorPinnedContext.set(currentPinnedContext);
                    this.editorStickyContext.set(currentStickyContext);
                    // restore focus to active group
                    this.accessor.activeGroup.focus();
                    // Cleanup
                    lifecycle_1.dispose(actionsDisposable);
                }
            });
        }
        getKeybinding(action) {
            return this.keybindingService.lookupKeybinding(action.id);
        }
        getKeybindingLabel(action) {
            const keybinding = this.getKeybinding(action);
            return keybinding ? types_1.withNullAsUndefined(keybinding.getLabel()) : undefined;
        }
        dispose() {
            lifecycle_1.dispose(this.breadcrumbsControl);
            this.breadcrumbsControl = undefined;
            super.dispose();
        }
    };
    TitleControl = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, notification_1.INotificationService),
        __param(9, actions_1.IMenuService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, themeService_1.IThemeService),
        __param(12, extensions_1.IExtensionService),
        __param(13, configuration_1.IConfigurationService),
        __param(14, files_1.IFileService)
    ], TitleControl);
    exports.TitleControl = TitleControl;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Drag Feedback
        const dragImageBackground = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        const dragImageForeground = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        collector.addRule(`
		.monaco-editor-group-drag-image {
			background: ${dragImageBackground};
			color: ${dragImageForeground};
		}
	`);
    });
});
//# __sourceMappingURL=titleControl.js.map