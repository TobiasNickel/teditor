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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/breadcrumbs/breadcrumbsWidget", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsModel", "vs/workbench/browser/parts/editor/breadcrumbsPicker", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/telemetry/common/telemetry", "vs/editor/browser/services/codeEditorService", "vs/base/browser/browser", "vs/base/common/types", "vs/platform/label/common/label", "vs/editor/common/services/textResourceConfigurationService", "vs/css!./media/breadcrumbscontrol"], function (require, exports, dom, mouseEvent_1, breadcrumbsWidget_1, iconLabel_1, arrays_1, async_1, lifecycle_1, resources_1, uri_1, editorBrowser_1, range_1, modes_1, outlineModel_1, nls_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, files_1, instantiation_1, keybindingsRegistry_1, listService_1, quickInput_1, styler_1, themeService_1, workspace_1, labels_1, breadcrumbs_1, breadcrumbsModel_1, breadcrumbsPicker_1, editor_1, editorService_1, editorGroupsService_1, telemetry_1, codeEditorService_1, browser_1, types_1, label_1, textResourceConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsControl = void 0;
    let Item = class Item extends breadcrumbsWidget_1.BreadcrumbsItem {
        constructor(element, options, _instantiationService) {
            super();
            this.element = element;
            this.options = options;
            this._instantiationService = _instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._disposables.dispose();
        }
        equals(other) {
            if (!(other instanceof Item)) {
                return false;
            }
            if (this.element instanceof breadcrumbsModel_1.FileElement && other.element instanceof breadcrumbsModel_1.FileElement) {
                return (resources_1.extUri.isEqual(this.element.uri, other.element.uri) &&
                    this.options.showFileIcons === other.options.showFileIcons &&
                    this.options.showSymbolIcons === other.options.showSymbolIcons);
            }
            if (this.element instanceof outlineModel_1.TreeElement && other.element instanceof outlineModel_1.TreeElement) {
                return this.element.id === other.element.id;
            }
            return false;
        }
        render(container) {
            if (this.element instanceof breadcrumbsModel_1.FileElement) {
                // file/folder
                let label = this._instantiationService.createInstance(labels_1.ResourceLabel, container, {});
                label.element.setFile(this.element.uri, {
                    hidePath: true,
                    hideIcon: this.element.kind === files_1.FileKind.FOLDER || !this.options.showFileIcons,
                    fileKind: this.element.kind,
                    fileDecorations: { colors: this.options.showDecorationColors, badges: false },
                });
                container.classList.add(files_1.FileKind[this.element.kind].toLowerCase());
                this._disposables.add(label);
            }
            else if (this.element instanceof outlineModel_1.OutlineModel) {
                // has outline element but not in one
                let label = document.createElement('div');
                label.innerHTML = '&hellip;';
                label.className = 'hint-more';
                container.appendChild(label);
            }
            else if (this.element instanceof outlineModel_1.OutlineGroup) {
                // provider
                let label = new iconLabel_1.IconLabel(container);
                label.setLabel(this.element.label);
                this._disposables.add(label);
            }
            else if (this.element instanceof outlineModel_1.OutlineElement) {
                // symbol
                if (this.options.showSymbolIcons) {
                    let icon = document.createElement('div');
                    icon.className = modes_1.SymbolKinds.toCssClassName(this.element.symbol.kind);
                    container.appendChild(icon);
                    container.classList.add('shows-symbol-icon');
                }
                let label = new iconLabel_1.IconLabel(container);
                let title = this.element.symbol.name.replace(/\r|\n|\r\n/g, '\u23CE');
                label.setLabel(title);
                this._disposables.add(label);
            }
        }
    };
    Item = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], Item);
    let BreadcrumbsControl = class BreadcrumbsControl {
        constructor(container, _options, _editorGroup, _contextKeyService, _contextViewService, _editorService, _codeEditorService, _workspaceService, _instantiationService, _themeService, _quickInputService, _configurationService, _textResourceConfigurationService, _fileService, _telemetryService, _labelService, breadcrumbsService) {
            var _a;
            this._options = _options;
            this._editorGroup = _editorGroup;
            this._contextKeyService = _contextKeyService;
            this._contextViewService = _contextViewService;
            this._editorService = _editorService;
            this._codeEditorService = _codeEditorService;
            this._workspaceService = _workspaceService;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._quickInputService = _quickInputService;
            this._configurationService = _configurationService;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._fileService = _fileService;
            this._telemetryService = _telemetryService;
            this._labelService = _labelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._breadcrumbsDisposables = new lifecycle_1.DisposableStore();
            this._breadcrumbsPickerShowing = false;
            this.domNode = document.createElement('div');
            this.domNode.classList.add('breadcrumbs-control');
            dom.append(container, this.domNode);
            this._cfUseQuickPick = breadcrumbs_1.BreadcrumbsConfig.UseQuickPick.bindTo(_configurationService);
            this._cfShowIcons = breadcrumbs_1.BreadcrumbsConfig.Icons.bindTo(_configurationService);
            this._cfTitleScrollbarSizing = breadcrumbs_1.BreadcrumbsConfig.TitleScrollbarSizing.bindTo(_configurationService);
            const sizing = (_a = this._cfTitleScrollbarSizing.getValue()) !== null && _a !== void 0 ? _a : 'default';
            this._widget = new breadcrumbsWidget_1.BreadcrumbsWidget(this.domNode, BreadcrumbsControl.SCROLLBAR_SIZES[sizing]);
            this._widget.onDidSelectItem(this._onSelectEvent, this, this._disposables);
            this._widget.onDidFocusItem(this._onFocusEvent, this, this._disposables);
            this._widget.onDidChangeFocus(this._updateCkBreadcrumbsActive, this, this._disposables);
            this._disposables.add(styler_1.attachBreadcrumbsStyler(this._widget, this._themeService, { breadcrumbsBackground: _options.breadcrumbsBackground }));
            this._ckBreadcrumbsPossible = BreadcrumbsControl.CK_BreadcrumbsPossible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsVisible = BreadcrumbsControl.CK_BreadcrumbsVisible.bindTo(this._contextKeyService);
            this._ckBreadcrumbsActive = BreadcrumbsControl.CK_BreadcrumbsActive.bindTo(this._contextKeyService);
            this._disposables.add(breadcrumbsService.register(this._editorGroup.id, this._widget));
        }
        dispose() {
            this._disposables.dispose();
            this._breadcrumbsDisposables.dispose();
            this._ckBreadcrumbsPossible.reset();
            this._ckBreadcrumbsVisible.reset();
            this._ckBreadcrumbsActive.reset();
            this._cfUseQuickPick.dispose();
            this._cfShowIcons.dispose();
            this._widget.dispose();
            this.domNode.remove();
        }
        layout(dim) {
            this._widget.layout(dim);
        }
        isHidden() {
            return this.domNode.classList.contains('hidden');
        }
        hide() {
            this._breadcrumbsDisposables.clear();
            this._ckBreadcrumbsVisible.set(false);
            this.domNode.classList.toggle('hidden', true);
        }
        update() {
            this._breadcrumbsDisposables.clear();
            // honor diff editors and such
            const uri = editor_1.toResource(this._editorGroup.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!uri || !this._fileService.canHandleResource(uri)) {
                // cleanup and return when there is no input or when
                // we cannot handle this input
                this._ckBreadcrumbsPossible.set(false);
                if (!this.isHidden()) {
                    this.hide();
                    return true;
                }
                else {
                    return false;
                }
            }
            this.domNode.classList.toggle('hidden', false);
            this._ckBreadcrumbsVisible.set(true);
            this._ckBreadcrumbsPossible.set(true);
            const editor = this._getActiveCodeEditor();
            const model = new breadcrumbsModel_1.EditorBreadcrumbsModel(uri, editor, this._configurationService, this._textResourceConfigurationService, this._workspaceService);
            this.domNode.classList.toggle('relative-path', model.isRelative());
            this.domNode.classList.toggle('backslash-path', this._labelService.getSeparator(uri.scheme, uri.authority) === '\\');
            const updateBreadcrumbs = () => {
                const showIcons = this._cfShowIcons.getValue();
                const options = Object.assign(Object.assign({}, this._options), { showFileIcons: this._options.showFileIcons && showIcons, showSymbolIcons: this._options.showSymbolIcons && showIcons });
                const items = model.getElements().map(element => new Item(element, options, this._instantiationService));
                this._widget.setItems(items);
                this._widget.reveal(items[items.length - 1]);
            };
            const listener = model.onDidUpdate(updateBreadcrumbs);
            const configListener = this._cfShowIcons.onDidChange(updateBreadcrumbs);
            updateBreadcrumbs();
            this._breadcrumbsDisposables.clear();
            this._breadcrumbsDisposables.add(model);
            this._breadcrumbsDisposables.add(listener);
            this._breadcrumbsDisposables.add(configListener);
            const updateScrollbarSizing = () => {
                var _a;
                const sizing = (_a = this._cfTitleScrollbarSizing.getValue()) !== null && _a !== void 0 ? _a : 'default';
                this._widget.setHorizontalScrollbarSize(BreadcrumbsControl.SCROLLBAR_SIZES[sizing]);
            };
            updateScrollbarSizing();
            const updateScrollbarSizeListener = this._cfTitleScrollbarSizing.onDidChange(updateScrollbarSizing);
            this._breadcrumbsDisposables.add(updateScrollbarSizeListener);
            // close picker on hide/update
            this._breadcrumbsDisposables.add({
                dispose: () => {
                    if (this._breadcrumbsPickerShowing) {
                        this._contextViewService.hideContextView(this);
                    }
                }
            });
            return true;
        }
        _getActiveCodeEditor() {
            if (!this._editorGroup.activeEditorPane) {
                return undefined;
            }
            let control = this._editorGroup.activeEditorPane.getControl();
            let editor;
            if (editorBrowser_1.isCodeEditor(control)) {
                editor = control;
            }
            else if (editorBrowser_1.isDiffEditor(control)) {
                editor = control.getModifiedEditor();
            }
            return editor;
        }
        _onFocusEvent(event) {
            if (event.item && this._breadcrumbsPickerShowing) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setSelection(event.item);
            }
        }
        _onSelectEvent(event) {
            if (!event.item) {
                return;
            }
            if (event.item === this._breadcrumbsPickerIgnoreOnceItem) {
                this._breadcrumbsPickerIgnoreOnceItem = undefined;
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                return;
            }
            const { element } = event.item;
            this._editorGroup.focus();
            this._telemetryService.publicLog2('breadcrumbs/select', { type: element instanceof outlineModel_1.TreeElement ? 'symbol' : 'file' });
            const group = this._getEditorGroup(event.payload);
            if (group !== undefined) {
                // reveal the item
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._revealInEditor(event, element, group);
                return;
            }
            if (this._cfUseQuickPick.getValue()) {
                // using quick pick
                this._widget.setFocused(undefined);
                this._widget.setSelection(undefined);
                this._quickInputService.quickAccess.show(element instanceof outlineModel_1.TreeElement ? '@' : '');
                return;
            }
            // show picker
            let picker;
            let pickerAnchor;
            let editor = this._getActiveCodeEditor();
            let editorDecorations = [];
            let editorViewState;
            this._contextViewService.showContextView({
                render: (parent) => {
                    picker = breadcrumbsPicker_1.createBreadcrumbsPicker(this._instantiationService, parent, element);
                    let selectListener = picker.onDidPickElement(data => {
                        if (data.target) {
                            editorViewState = undefined;
                        }
                        this._contextViewService.hideContextView(this);
                        const group = (picker.useAltAsMultipleSelectionModifier && data.browserEvent.metaKey) || (!picker.useAltAsMultipleSelectionModifier && data.browserEvent.altKey)
                            ? editorService_1.SIDE_GROUP
                            : editorService_1.ACTIVE_GROUP;
                        this._revealInEditor(event, data.target, group, data.browserEvent.button === 1);
                        /* __GDPR__
                            "breadcrumbs/open" : {
                                "type": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                            }
                        */
                        this._telemetryService.publicLog('breadcrumbs/open', { type: !data ? 'nothing' : data.target instanceof outlineModel_1.TreeElement ? 'symbol' : 'file' });
                    });
                    let focusListener = picker.onDidFocusElement(data => {
                        if (!editor || !(data.target instanceof outlineModel_1.OutlineElement)) {
                            return;
                        }
                        if (!editorViewState) {
                            editorViewState = types_1.withNullAsUndefined(editor.saveViewState());
                        }
                        const { symbol } = data.target;
                        editor.revealRangeInCenterIfOutsideViewport(symbol.range, 0 /* Smooth */);
                        editorDecorations = editor.deltaDecorations(editorDecorations, [{
                                range: symbol.range,
                                options: {
                                    className: 'rangeHighlight',
                                    isWholeLine: true
                                }
                            }]);
                    });
                    let zoomListener = browser_1.onDidChangeZoomLevel(() => {
                        this._contextViewService.hideContextView(this);
                    });
                    let focusTracker = dom.trackFocus(parent);
                    let blurListener = focusTracker.onDidBlur(() => {
                        this._breadcrumbsPickerIgnoreOnceItem = this._widget.isDOMFocused() ? event.item : undefined;
                        this._contextViewService.hideContextView(this);
                    });
                    this._breadcrumbsPickerShowing = true;
                    this._updateCkBreadcrumbsActive();
                    return lifecycle_1.combinedDisposable(picker, selectListener, focusListener, zoomListener, focusTracker, blurListener);
                },
                getAnchor: () => {
                    if (!pickerAnchor) {
                        let maxInnerWidth = window.innerWidth - 8 /*a little less the full widget*/;
                        let maxHeight = Math.min(window.innerHeight * 0.7, 300);
                        let pickerWidth = Math.min(maxInnerWidth, Math.max(240, maxInnerWidth / 4.17));
                        let pickerArrowSize = 8;
                        let pickerArrowOffset;
                        let data = dom.getDomNodePagePosition(event.node.firstChild);
                        let y = data.top + data.height + pickerArrowSize;
                        if (y + maxHeight >= window.innerHeight) {
                            maxHeight = window.innerHeight - y - 30 /* room for shadow and status bar*/;
                        }
                        let x = data.left;
                        if (x + pickerWidth >= maxInnerWidth) {
                            x = maxInnerWidth - pickerWidth;
                        }
                        if (event.payload instanceof mouseEvent_1.StandardMouseEvent) {
                            let maxPickerArrowOffset = pickerWidth - 2 * pickerArrowSize;
                            pickerArrowOffset = event.payload.posx - x;
                            if (pickerArrowOffset > maxPickerArrowOffset) {
                                x = Math.min(maxInnerWidth - pickerWidth, x + pickerArrowOffset - maxPickerArrowOffset);
                                pickerArrowOffset = maxPickerArrowOffset;
                            }
                        }
                        else {
                            pickerArrowOffset = (data.left + (data.width * 0.3)) - x;
                        }
                        picker.show(element, maxHeight, pickerWidth, pickerArrowSize, Math.max(0, pickerArrowOffset));
                        pickerAnchor = { x, y };
                    }
                    return pickerAnchor;
                },
                onHide: (data) => {
                    if (editor) {
                        editor.deltaDecorations(editorDecorations, []);
                        if (editorViewState) {
                            editor.restoreViewState(editorViewState);
                        }
                    }
                    this._breadcrumbsPickerShowing = false;
                    this._updateCkBreadcrumbsActive();
                    if (data === this) {
                        this._widget.setFocused(undefined);
                        this._widget.setSelection(undefined);
                    }
                }
            });
        }
        _updateCkBreadcrumbsActive() {
            const value = this._widget.isDOMFocused() || this._breadcrumbsPickerShowing;
            this._ckBreadcrumbsActive.set(value);
        }
        _revealInEditor(event, element, group, pinned = false) {
            if (element instanceof breadcrumbsModel_1.FileElement) {
                if (element.kind === files_1.FileKind.FILE) {
                    // open file in any editor
                    this._editorService.openEditor({ resource: element.uri, options: { pinned: pinned } }, group);
                }
                else {
                    // show next picker
                    let items = this._widget.getItems();
                    let idx = items.indexOf(event.item);
                    this._widget.setFocused(items[idx + 1]);
                    this._widget.setSelection(items[idx + 1], BreadcrumbsControl.Payload_Pick);
                }
            }
            else if (element instanceof outlineModel_1.OutlineElement) {
                // open symbol in code editor
                const model = outlineModel_1.OutlineModel.get(element);
                if (model) {
                    this._codeEditorService.openCodeEditor({
                        resource: model.uri,
                        options: {
                            selection: range_1.Range.collapseToStart(element.symbol.selectionRange),
                            selectionRevealType: 1 /* CenterIfOutsideViewport */
                        }
                    }, types_1.withUndefinedAsNull(this._getActiveCodeEditor()), group === editorService_1.SIDE_GROUP);
                }
            }
        }
        _getEditorGroup(data) {
            if (data === BreadcrumbsControl.Payload_RevealAside) {
                return editorService_1.SIDE_GROUP;
            }
            else if (data === BreadcrumbsControl.Payload_Reveal) {
                return editorService_1.ACTIVE_GROUP;
            }
            else {
                return undefined;
            }
        }
    };
    BreadcrumbsControl.HEIGHT = 22;
    BreadcrumbsControl.SCROLLBAR_SIZES = {
        default: 3,
        large: 8
    };
    BreadcrumbsControl.Payload_Reveal = {};
    BreadcrumbsControl.Payload_RevealAside = {};
    BreadcrumbsControl.Payload_Pick = {};
    BreadcrumbsControl.CK_BreadcrumbsPossible = new contextkey_1.RawContextKey('breadcrumbsPossible', false);
    BreadcrumbsControl.CK_BreadcrumbsVisible = new contextkey_1.RawContextKey('breadcrumbsVisible', false);
    BreadcrumbsControl.CK_BreadcrumbsActive = new contextkey_1.RawContextKey('breadcrumbsActive', false);
    BreadcrumbsControl = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextViewService),
        __param(5, editorService_1.IEditorService),
        __param(6, codeEditorService_1.ICodeEditorService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, themeService_1.IThemeService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(13, files_1.IFileService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, label_1.ILabelService),
        __param(16, breadcrumbs_1.IBreadcrumbsService)
    ], BreadcrumbsControl);
    exports.BreadcrumbsControl = BreadcrumbsControl;
    //#region commands
    // toggle command
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'breadcrumbs.toggle',
            title: { value: nls_1.localize('cmd.toggle', "Toggle Breadcrumbs"), original: 'Toggle Breadcrumbs' },
            category: { value: nls_1.localize('cmd.category', "View"), original: 'View' }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '5_editor',
        order: 3,
        command: {
            id: 'breadcrumbs.toggle',
            title: nls_1.localize('miShowBreadcrumbs', "Show &&Breadcrumbs"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.breadcrumbs.enabled', true)
        }
    });
    commands_1.CommandsRegistry.registerCommand('breadcrumbs.toggle', accessor => {
        let config = accessor.get(configuration_1.IConfigurationService);
        let value = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).getValue();
        breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config).updateValue(!value);
    });
    // focus/focus-and-select
    function focusAndSelectHandler(accessor, select) {
        // find widget and focus/select
        const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
        const widget = breadcrumbs.getWidget(groups.activeGroup.id);
        if (widget) {
            const item = arrays_1.tail(widget.getItems());
            widget.setFocused(item);
            if (select) {
                widget.setSelection(item, BreadcrumbsControl.Payload_Pick);
            }
        }
    }
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: 'breadcrumbs.focusAndSelect',
            title: { value: nls_1.localize('cmd.focus', "Focus Breadcrumbs"), original: 'Focus Breadcrumbs' },
            precondition: BreadcrumbsControl.CK_BreadcrumbsVisible
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusAndSelect',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 84 /* US_DOT */,
        when: BreadcrumbsControl.CK_BreadcrumbsPossible,
        handler: accessor => focusAndSelectHandler(accessor, true)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focus',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 80 /* US_SEMICOLON */,
        when: BreadcrumbsControl.CK_BreadcrumbsPossible,
        handler: accessor => focusAndSelectHandler(accessor, false)
    });
    // this commands is only enabled when breadcrumbs are
    // disabled which it then enables and focuses
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.toggleToOn',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 84 /* US_DOT */,
        when: contextkey_1.ContextKeyExpr.not('config.breadcrumbs.enabled'),
        handler: async (accessor) => {
            const instant = accessor.get(instantiation_1.IInstantiationService);
            const config = accessor.get(configuration_1.IConfigurationService);
            // check if enabled and iff not enable
            const isEnabled = breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(config);
            if (!isEnabled.getValue()) {
                await isEnabled.updateValue(true);
                await async_1.timeout(50); // hacky - the widget might not be ready yet...
            }
            return instant.invokeFunction(focusAndSelectHandler, true);
        }
    });
    // navigation
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNext',
        weight: 200 /* WorkbenchContrib */,
        primary: 17 /* RightArrow */,
        secondary: [2048 /* CtrlCmd */ | 17 /* RightArrow */],
        mac: {
            primary: 17 /* RightArrow */,
            secondary: [512 /* Alt */ | 17 /* RightArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPrevious',
        weight: 200 /* WorkbenchContrib */,
        primary: 15 /* LeftArrow */,
        secondary: [2048 /* CtrlCmd */ | 15 /* LeftArrow */],
        mac: {
            primary: 15 /* LeftArrow */,
            secondary: [512 /* Alt */ | 15 /* LeftArrow */],
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusNextWithPicker',
        weight: 200 /* WorkbenchContrib */ + 1,
        primary: 2048 /* CtrlCmd */ | 17 /* RightArrow */,
        mac: {
            primary: 512 /* Alt */ | 17 /* RightArrow */,
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusNext();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.focusPreviousWithPicker',
        weight: 200 /* WorkbenchContrib */ + 1,
        primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */,
        mac: {
            primary: 512 /* Alt */ | 15 /* LeftArrow */,
        },
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.focusPrev();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectFocused',
        weight: 200 /* WorkbenchContrib */,
        primary: 3 /* Enter */,
        secondary: [18 /* DownArrow */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Pick);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocused',
        weight: 200 /* WorkbenchContrib */,
        primary: 10 /* Space */,
        secondary: [2048 /* CtrlCmd */ | 3 /* Enter */],
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setSelection(widget.getFocused(), BreadcrumbsControl.Payload_Reveal);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.selectEditor',
        weight: 200 /* WorkbenchContrib */ + 1,
        primary: 9 /* Escape */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive),
        handler(accessor) {
            const groups = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const breadcrumbs = accessor.get(breadcrumbs_1.IBreadcrumbsService);
            const widget = breadcrumbs.getWidget(groups.activeGroup.id);
            if (!widget) {
                return;
            }
            widget.setFocused(undefined);
            widget.setSelection(undefined);
            if (groups.activeGroup.activeEditorPane) {
                groups.activeGroup.activeEditorPane.focus();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'breadcrumbs.revealFocusedFromTreeAside',
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        when: contextkey_1.ContextKeyExpr.and(BreadcrumbsControl.CK_BreadcrumbsVisible, BreadcrumbsControl.CK_BreadcrumbsActive, listService_1.WorkbenchListFocusContextKey),
        handler(accessor) {
            const editors = accessor.get(editorService_1.IEditorService);
            const lists = accessor.get(listService_1.IListService);
            const element = lists.lastFocusedList ? lists.lastFocusedList.getFocus()[0] : undefined;
            if (element instanceof outlineModel_1.OutlineElement) {
                const outlineElement = outlineModel_1.OutlineModel.get(element);
                if (!outlineElement) {
                    return undefined;
                }
                // open symbol in editor
                return editors.openEditor({
                    resource: outlineElement.uri,
                    options: { selection: range_1.Range.collapseToStart(element.symbol.selectionRange) }
                }, editorService_1.SIDE_GROUP);
            }
            else if (element && uri_1.URI.isUri(element.resource)) {
                // open file in editor
                return editors.openEditor({
                    resource: element.resource,
                }, editorService_1.SIDE_GROUP);
            }
            else {
                // ignore
                return undefined;
            }
        }
    });
});
//#endregion
//# __sourceMappingURL=breadcrumbsControl.js.map