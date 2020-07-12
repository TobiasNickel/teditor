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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/actions", "vs/base/common/platform", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor", "vs/base/common/lifecycle", "vs/editor/contrib/linesOperations/linesOperations", "vs/editor/contrib/indentation/indentation", "vs/workbench/browser/parts/editor/binaryEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/config/commonEditorConfig", "vs/platform/commands/common/commands", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/services/textResourceConfigurationService", "vs/platform/configuration/common/configuration", "vs/base/common/objects", "vs/editor/browser/editorBrowser", "vs/base/common/network", "vs/workbench/services/preferences/common/preferences", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/base/common/async", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/markers/common/markers", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/css!./media/editorstatus"], function (require, exports, nls, dom_1, strings_1, resources_1, types_1, uri_1, actions_1, platform_1, untitledTextEditorInput_1, editor_1, lifecycle_1, linesOperations_1, indentation_1, binaryEditor_1, binaryDiffEditor_1, editorService_1, files_1, instantiation_1, modeService_1, modelService_1, range_1, selection_1, commonEditorConfig_1, commands_1, extensionManagement_1, textfiles_1, textResourceConfigurationService_1, configuration_1, objects_1, editorBrowser_1, network_1, preferences_1, quickInput_1, getIconClasses_1, async_1, notification_1, event_1, accessibility_1, statusbar_1, markers_1, theme_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChangeEncodingAction = exports.ChangeEOLAction = exports.ChangeModeAction = exports.ShowLanguageExtensionsAction = exports.EditorStatus = void 0;
    class SideBySideEditorEncodingSupport {
        constructor(primary, secondary) {
            this.primary = primary;
            this.secondary = secondary;
        }
        getEncoding() {
            return this.primary.getEncoding(); // always report from modified (right hand) side
        }
        setEncoding(encoding, mode) {
            [this.primary, this.secondary].forEach(editor => editor.setEncoding(encoding, mode));
        }
    }
    class SideBySideEditorModeSupport {
        constructor(primary, secondary) {
            this.primary = primary;
            this.secondary = secondary;
        }
        setMode(mode) {
            [this.primary, this.secondary].forEach(editor => editor.setMode(mode));
        }
    }
    function toEditorWithEncodingSupport(input) {
        // Untitled Text Editor
        if (input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof editor_1.SideBySideEditorInput) {
            const primaryEncodingSupport = toEditorWithEncodingSupport(input.primary);
            const secondaryEncodingSupport = toEditorWithEncodingSupport(input.secondary);
            if (primaryEncodingSupport && secondaryEncodingSupport) {
                return new SideBySideEditorEncodingSupport(primaryEncodingSupport, secondaryEncodingSupport);
            }
            return primaryEncodingSupport;
        }
        // File or Resource Editor
        const encodingSupport = input;
        if (types_1.areFunctions(encodingSupport.setEncoding, encodingSupport.getEncoding)) {
            return encodingSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    function toEditorWithModeSupport(input) {
        // Untitled Text Editor
        if (input instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
            return input;
        }
        // Side by Side (diff) Editor
        if (input instanceof editor_1.SideBySideEditorInput) {
            const primaryModeSupport = toEditorWithModeSupport(input.primary);
            const secondaryModeSupport = toEditorWithModeSupport(input.secondary);
            if (primaryModeSupport && secondaryModeSupport) {
                return new SideBySideEditorModeSupport(primaryModeSupport, secondaryModeSupport);
            }
            return primaryModeSupport;
        }
        // File or Resource Editor
        const modeSupport = input;
        if (typeof modeSupport.setMode === 'function') {
            return modeSupport;
        }
        // Unsupported for any other editor
        return null;
    }
    class StateChange {
        constructor() {
            this.indentation = false;
            this.selectionStatus = false;
            this.mode = false;
            this.encoding = false;
            this.EOL = false;
            this.tabFocusMode = false;
            this.columnSelectionMode = false;
            this.screenReaderMode = false;
            this.metadata = false;
        }
        combine(other) {
            this.indentation = this.indentation || other.indentation;
            this.selectionStatus = this.selectionStatus || other.selectionStatus;
            this.mode = this.mode || other.mode;
            this.encoding = this.encoding || other.encoding;
            this.EOL = this.EOL || other.EOL;
            this.tabFocusMode = this.tabFocusMode || other.tabFocusMode;
            this.columnSelectionMode = this.columnSelectionMode || other.columnSelectionMode;
            this.screenReaderMode = this.screenReaderMode || other.screenReaderMode;
            this.metadata = this.metadata || other.metadata;
        }
        hasChanges() {
            return this.indentation
                || this.selectionStatus
                || this.mode
                || this.encoding
                || this.EOL
                || this.tabFocusMode
                || this.columnSelectionMode
                || this.screenReaderMode
                || this.metadata;
        }
    }
    class State {
        get selectionStatus() { return this._selectionStatus; }
        get mode() { return this._mode; }
        get encoding() { return this._encoding; }
        get EOL() { return this._EOL; }
        get indentation() { return this._indentation; }
        get tabFocusMode() { return this._tabFocusMode; }
        get columnSelectionMode() { return this._columnSelectionMode; }
        get screenReaderMode() { return this._screenReaderMode; }
        get metadata() { return this._metadata; }
        update(update) {
            const change = new StateChange();
            if (update.type === 'selectionStatus') {
                if (this._selectionStatus !== update.selectionStatus) {
                    this._selectionStatus = update.selectionStatus;
                    change.selectionStatus = true;
                }
            }
            if (update.type === 'indentation') {
                if (this._indentation !== update.indentation) {
                    this._indentation = update.indentation;
                    change.indentation = true;
                }
            }
            if (update.type === 'mode') {
                if (this._mode !== update.mode) {
                    this._mode = update.mode;
                    change.mode = true;
                }
            }
            if (update.type === 'encoding') {
                if (this._encoding !== update.encoding) {
                    this._encoding = update.encoding;
                    change.encoding = true;
                }
            }
            if (update.type === 'EOL') {
                if (this._EOL !== update.EOL) {
                    this._EOL = update.EOL;
                    change.EOL = true;
                }
            }
            if (update.type === 'tabFocusMode') {
                if (this._tabFocusMode !== update.tabFocusMode) {
                    this._tabFocusMode = update.tabFocusMode;
                    change.tabFocusMode = true;
                }
            }
            if (update.type === 'columnSelectionMode') {
                if (this._columnSelectionMode !== update.columnSelectionMode) {
                    this._columnSelectionMode = update.columnSelectionMode;
                    change.columnSelectionMode = true;
                }
            }
            if (update.type === 'screenReaderMode') {
                if (this._screenReaderMode !== update.screenReaderMode) {
                    this._screenReaderMode = update.screenReaderMode;
                    change.screenReaderMode = true;
                }
            }
            if (update.type === 'metadata') {
                if (this._metadata !== update.metadata) {
                    this._metadata = update.metadata;
                    change.metadata = true;
                }
            }
            return change;
        }
    }
    const nlsSingleSelectionRange = nls.localize('singleSelectionRange', "Ln {0}, Col {1} ({2} selected)");
    const nlsSingleSelection = nls.localize('singleSelection', "Ln {0}, Col {1}");
    const nlsMultiSelectionRange = nls.localize('multiSelectionRange', "{0} selections ({1} characters selected)");
    const nlsMultiSelection = nls.localize('multiSelection', "{0} selections");
    const nlsEOLLF = nls.localize('endOfLineLineFeed', "LF");
    const nlsEOLCRLF = nls.localize('endOfLineCarriageReturnLineFeed', "CRLF");
    let EditorStatus = class EditorStatus extends lifecycle_1.Disposable {
        constructor(editorService, quickInputService, modeService, textFileService, configurationService, notificationService, accessibilityService, statusbarService, instantiationService) {
            super();
            this.editorService = editorService;
            this.quickInputService = quickInputService;
            this.modeService = modeService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.accessibilityService = accessibilityService;
            this.statusbarService = statusbarService;
            this.instantiationService = instantiationService;
            this.tabFocusModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.columnSelectionModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.screenRedearModeElement = this._register(new lifecycle_1.MutableDisposable());
            this.indentationElement = this._register(new lifecycle_1.MutableDisposable());
            this.selectionElement = this._register(new lifecycle_1.MutableDisposable());
            this.encodingElement = Object.keys(textfiles_1.SUPPORTED_ENCODINGS).length > 1 ? this._register(new lifecycle_1.MutableDisposable()) : undefined;
            this.eolElement = this._register(new lifecycle_1.MutableDisposable());
            this.modeElement = this._register(new lifecycle_1.MutableDisposable());
            this.metadataElement = this._register(new lifecycle_1.MutableDisposable());
            this.currentProblemStatus = this._register(this.instantiationService.createInstance(ShowCurrentMarkerInStatusbarContribution));
            this.state = new State();
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.delayedRender = this._register(new lifecycle_1.MutableDisposable());
            this.toRender = null;
            this.screenReaderNotification = null;
            this.promptedScreenReader = false;
            this.registerCommands();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateStatusBar()));
            this._register(this.textFileService.untitled.onDidChangeEncoding(model => this.onResourceEncodingChange(model.resource)));
            this._register(this.textFileService.files.onDidChangeEncoding(model => this.onResourceEncodingChange((model.resource))));
            this._register(commonEditorConfig_1.TabFocus.onDidChangeTabFocus(e => this.onTabFocusModeChange()));
        }
        registerCommands() {
            commands_1.CommandsRegistry.registerCommand({ id: 'showEditorScreenReaderNotification', handler: () => this.showScreenReaderNotification() });
            commands_1.CommandsRegistry.registerCommand({ id: 'changeEditorIndentation', handler: () => this.showIndentationPicker() });
        }
        showScreenReaderNotification() {
            if (!this.screenReaderNotification) {
                this.screenReaderNotification = this.notificationService.prompt(notification_1.Severity.Info, nls.localize('screenReaderDetectedExplanation.question', "Are you using a screen reader to operate VS Code? (Certain features like word wrap are disabled when using a screen reader)"), [{
                        label: nls.localize('screenReaderDetectedExplanation.answerYes', "Yes"),
                        run: () => {
                            this.configurationService.updateValue('editor.accessibilitySupport', 'on', 1 /* USER */);
                        }
                    }, {
                        label: nls.localize('screenReaderDetectedExplanation.answerNo', "No"),
                        run: () => {
                            this.configurationService.updateValue('editor.accessibilitySupport', 'off', 1 /* USER */);
                        }
                    }], { sticky: true });
                event_1.Event.once(this.screenReaderNotification.onDidClose)(() => this.screenReaderNotification = null);
            }
        }
        async showIndentationPicker() {
            var _a;
            const activeTextEditorControl = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                return this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
            }
            if ((_a = this.editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.isReadonly()) {
                return this.quickInputService.pick([{ label: nls.localize('noWritableCodeEditor', "The active code editor is read-only.") }]);
            }
            const picks = [
                activeTextEditorControl.getAction(indentation_1.IndentUsingSpaces.ID),
                activeTextEditorControl.getAction(indentation_1.IndentUsingTabs.ID),
                activeTextEditorControl.getAction(indentation_1.DetectIndentation.ID),
                activeTextEditorControl.getAction(indentation_1.IndentationToSpacesAction.ID),
                activeTextEditorControl.getAction(indentation_1.IndentationToTabsAction.ID),
                activeTextEditorControl.getAction(linesOperations_1.TrimTrailingWhitespaceAction.ID)
            ].map((a) => {
                return {
                    id: a.id,
                    label: a.label,
                    detail: (platform_1.Language.isDefaultVariant() || a.label === a.alias) ? undefined : a.alias,
                    run: () => {
                        activeTextEditorControl.focus();
                        a.run();
                    }
                };
            });
            picks.splice(3, 0, { type: 'separator', label: nls.localize('indentConvert', "convert file") });
            picks.unshift({ type: 'separator', label: nls.localize('indentView', "change view") });
            const action = await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickAction', "Select Action"), matchOnDetail: true });
            return action === null || action === void 0 ? void 0 : action.run();
        }
        updateTabFocusModeElement(visible) {
            if (visible) {
                if (!this.tabFocusModeElement.value) {
                    const text = nls.localize('tabFocusModeEnabled', "Tab Moves Focus");
                    this.tabFocusModeElement.value = this.statusbarService.addEntry({
                        text,
                        ariaLabel: text,
                        tooltip: nls.localize('disableTabMode', "Disable Accessibility Mode"),
                        command: 'editor.action.toggleTabFocusMode',
                        backgroundColor: themeService_1.themeColorFromId(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND),
                        color: themeService_1.themeColorFromId(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND)
                    }, 'status.editor.tabFocusMode', nls.localize('status.editor.tabFocusMode', "Accessibility Mode"), 1 /* RIGHT */, 100.7);
                }
            }
            else {
                this.tabFocusModeElement.clear();
            }
        }
        updateColumnSelectionModeElement(visible) {
            if (visible) {
                if (!this.columnSelectionModeElement.value) {
                    const text = nls.localize('columnSelectionModeEnabled', "Column Selection");
                    this.columnSelectionModeElement.value = this.statusbarService.addEntry({
                        text,
                        ariaLabel: text,
                        tooltip: nls.localize('disableColumnSelectionMode', "Disable Column Selection Mode"),
                        command: 'editor.action.toggleColumnSelection',
                        backgroundColor: themeService_1.themeColorFromId(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND),
                        color: themeService_1.themeColorFromId(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND)
                    }, 'status.editor.columnSelectionMode', nls.localize('status.editor.columnSelectionMode', "Column Selection Mode"), 1 /* RIGHT */, 100.8);
                }
            }
            else {
                this.columnSelectionModeElement.clear();
            }
        }
        updateScreenReaderModeElement(visible) {
            if (visible) {
                if (!this.screenRedearModeElement.value) {
                    const text = nls.localize('screenReaderDetected', "Screen Reader Optimized");
                    this.screenRedearModeElement.value = this.statusbarService.addEntry({
                        text,
                        ariaLabel: text,
                        command: 'showEditorScreenReaderNotification',
                        backgroundColor: themeService_1.themeColorFromId(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND),
                        color: themeService_1.themeColorFromId(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND)
                    }, 'status.editor.screenReaderMode', nls.localize('status.editor.screenReaderMode', "Screen Reader Mode"), 1 /* RIGHT */, 100.6);
                }
            }
            else {
                this.screenRedearModeElement.clear();
            }
        }
        updateSelectionElement(text) {
            if (!text) {
                this.selectionElement.clear();
                return;
            }
            const props = {
                text,
                ariaLabel: text,
                tooltip: nls.localize('gotoLine', "Go to Line/Column"),
                command: 'workbench.action.gotoLine'
            };
            this.updateElement(this.selectionElement, props, 'status.editor.selection', nls.localize('status.editor.selection', "Editor Selection"), 1 /* RIGHT */, 100.5);
        }
        updateIndentationElement(text) {
            if (!text) {
                this.indentationElement.clear();
                return;
            }
            const props = {
                text,
                ariaLabel: text,
                tooltip: nls.localize('selectIndentation', "Select Indentation"),
                command: 'changeEditorIndentation'
            };
            this.updateElement(this.indentationElement, props, 'status.editor.indentation', nls.localize('status.editor.indentation', "Editor Indentation"), 1 /* RIGHT */, 100.4);
        }
        updateEncodingElement(text) {
            if (!this.encodingElement) {
                return; // return early if encoding should not show (e.g. in Web we only support utf8)
            }
            if (!text) {
                this.encodingElement.clear();
                return;
            }
            const props = {
                text,
                ariaLabel: text,
                tooltip: nls.localize('selectEncoding', "Select Encoding"),
                command: 'workbench.action.editor.changeEncoding'
            };
            this.updateElement(this.encodingElement, props, 'status.editor.encoding', nls.localize('status.editor.encoding', "Editor Encoding"), 1 /* RIGHT */, 100.3);
        }
        updateEOLElement(text) {
            if (!text) {
                this.eolElement.clear();
                return;
            }
            const props = {
                text,
                ariaLabel: text,
                tooltip: nls.localize('selectEOL', "Select End of Line Sequence"),
                command: 'workbench.action.editor.changeEOL'
            };
            this.updateElement(this.eolElement, props, 'status.editor.eol', nls.localize('status.editor.eol', "Editor End of Line"), 1 /* RIGHT */, 100.2);
        }
        updateModeElement(text) {
            if (!text) {
                this.modeElement.clear();
                return;
            }
            const props = {
                text,
                ariaLabel: text,
                tooltip: nls.localize('selectLanguageMode', "Select Language Mode"),
                command: 'workbench.action.editor.changeLanguageMode'
            };
            this.updateElement(this.modeElement, props, 'status.editor.mode', nls.localize('status.editor.mode', "Editor Language"), 1 /* RIGHT */, 100.1);
        }
        updateMetadataElement(text) {
            if (!text) {
                this.metadataElement.clear();
                return;
            }
            const props = {
                text,
                ariaLabel: text,
                tooltip: nls.localize('fileInfo', "File Information")
            };
            this.updateElement(this.metadataElement, props, 'status.editor.info', nls.localize('status.editor.info', "File Information"), 1 /* RIGHT */, 100);
        }
        updateElement(element, props, id, name, alignment, priority) {
            if (!element.value) {
                element.value = this.statusbarService.addEntry(props, id, name, alignment, priority);
            }
            else {
                element.value.update(props);
            }
        }
        updateState(update) {
            const changed = this.state.update(update);
            if (!changed.hasChanges()) {
                return; // Nothing really changed
            }
            if (!this.toRender) {
                this.toRender = changed;
                this.delayedRender.value = dom_1.runAtThisOrScheduleAtNextAnimationFrame(() => {
                    this.delayedRender.clear();
                    const toRender = this.toRender;
                    this.toRender = null;
                    if (toRender) {
                        this.doRenderNow(toRender);
                    }
                });
            }
            else {
                this.toRender.combine(changed);
            }
        }
        doRenderNow(changed) {
            this.updateTabFocusModeElement(!!this.state.tabFocusMode);
            this.updateColumnSelectionModeElement(!!this.state.columnSelectionMode);
            this.updateScreenReaderModeElement(!!this.state.screenReaderMode);
            this.updateIndentationElement(this.state.indentation);
            this.updateSelectionElement(this.state.selectionStatus);
            this.updateEncodingElement(this.state.encoding);
            this.updateEOLElement(this.state.EOL ? this.state.EOL === '\r\n' ? nlsEOLCRLF : nlsEOLLF : undefined);
            this.updateModeElement(this.state.mode);
            this.updateMetadataElement(this.state.metadata);
        }
        getSelectionLabel(info) {
            if (!info || !info.selections) {
                return undefined;
            }
            if (info.selections.length === 1) {
                if (info.charactersSelected) {
                    return strings_1.format(nlsSingleSelectionRange, info.selections[0].positionLineNumber, info.selections[0].positionColumn, info.charactersSelected);
                }
                return strings_1.format(nlsSingleSelection, info.selections[0].positionLineNumber, info.selections[0].positionColumn);
            }
            if (info.charactersSelected) {
                return strings_1.format(nlsMultiSelectionRange, info.selections.length, info.charactersSelected);
            }
            if (info.selections.length > 0) {
                return strings_1.format(nlsMultiSelection, info.selections.length);
            }
            return undefined;
        }
        updateStatusBar() {
            const activeInput = this.editorService.activeEditor;
            const activeEditorPane = this.editorService.activeEditorPane;
            const activeCodeEditor = activeEditorPane ? types_1.withNullAsUndefined(editorBrowser_1.getCodeEditor(activeEditorPane.getControl())) : undefined;
            // Update all states
            this.onColumnSelectionModeChange(activeCodeEditor);
            this.onScreenReaderModeChange(activeCodeEditor);
            this.onSelectionChange(activeCodeEditor);
            this.onModeChange(activeCodeEditor, activeInput);
            this.onEOLChange(activeCodeEditor);
            this.onEncodingChange(activeEditorPane, activeCodeEditor);
            this.onIndentationChange(activeCodeEditor);
            this.onMetadataChange(activeEditorPane);
            this.currentProblemStatus.update(activeCodeEditor);
            // Dispose old active editor listeners
            this.activeEditorListeners.clear();
            // Attach new listeners to active editor
            if (activeCodeEditor) {
                // Hook Listener for Configuration changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeConfiguration((event) => {
                    if (event.hasChanged(13 /* columnSelection */)) {
                        this.onColumnSelectionModeChange(activeCodeEditor);
                    }
                    if (event.hasChanged(2 /* accessibilitySupport */)) {
                        this.onScreenReaderModeChange(activeCodeEditor);
                    }
                }));
                // Hook Listener for Selection changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeCursorPosition((event) => {
                    this.onSelectionChange(activeCodeEditor);
                    this.currentProblemStatus.update(activeCodeEditor);
                }));
                // Hook Listener for mode changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelLanguage((event) => {
                    this.onModeChange(activeCodeEditor, activeInput);
                }));
                // Hook Listener for content changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelContent((e) => {
                    this.onEOLChange(activeCodeEditor);
                    this.currentProblemStatus.update(activeCodeEditor);
                    const selections = activeCodeEditor.getSelections();
                    if (selections) {
                        for (const change of e.changes) {
                            if (selections.some(selection => range_1.Range.areIntersecting(selection, change.range))) {
                                this.onSelectionChange(activeCodeEditor);
                                break;
                            }
                        }
                    }
                }));
                // Hook Listener for content options changes
                this.activeEditorListeners.add(activeCodeEditor.onDidChangeModelOptions((event) => {
                    this.onIndentationChange(activeCodeEditor);
                }));
            }
            // Handle binary editors
            else if (activeEditorPane instanceof binaryEditor_1.BaseBinaryResourceEditor || activeEditorPane instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                const binaryEditors = [];
                if (activeEditorPane instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                    const primary = activeEditorPane.getPrimaryEditorPane();
                    if (primary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(primary);
                    }
                    const secondary = activeEditorPane.getSecondaryEditorPane();
                    if (secondary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                        binaryEditors.push(secondary);
                    }
                }
                else {
                    binaryEditors.push(activeEditorPane);
                }
                binaryEditors.forEach(editor => {
                    this.activeEditorListeners.add(editor.onMetadataChanged(metadata => {
                        this.onMetadataChange(activeEditorPane);
                    }));
                    this.activeEditorListeners.add(editor.onDidOpenInPlace(() => {
                        this.updateStatusBar();
                    }));
                });
            }
        }
        onModeChange(editorWidget, editorInput) {
            let info = { type: 'mode', mode: undefined };
            // We only support text based editors
            if (editorWidget && editorInput && toEditorWithModeSupport(editorInput)) {
                const textModel = editorWidget.getModel();
                if (textModel) {
                    const modeId = textModel.getLanguageIdentifier().language;
                    info.mode = types_1.withNullAsUndefined(this.modeService.getLanguageName(modeId));
                }
            }
            this.updateState(info);
        }
        onIndentationChange(editorWidget) {
            const update = { type: 'indentation', indentation: undefined };
            if (editorWidget) {
                const model = editorWidget.getModel();
                if (model) {
                    const modelOpts = model.getOptions();
                    update.indentation = (modelOpts.insertSpaces
                        ? nls.localize('spacesSize', "Spaces: {0}", modelOpts.indentSize)
                        : nls.localize({ key: 'tabSize', comment: ['Tab corresponds to the tab key'] }, "Tab Size: {0}", modelOpts.tabSize));
                }
            }
            this.updateState(update);
        }
        onMetadataChange(editor) {
            const update = { type: 'metadata', metadata: undefined };
            if (editor instanceof binaryEditor_1.BaseBinaryResourceEditor || editor instanceof binaryDiffEditor_1.BinaryResourceDiffEditor) {
                update.metadata = editor.getMetadata();
            }
            this.updateState(update);
        }
        onColumnSelectionModeChange(editorWidget) {
            const info = { type: 'columnSelectionMode', columnSelectionMode: false };
            if (editorWidget && editorWidget.getOption(13 /* columnSelection */)) {
                info.columnSelectionMode = true;
            }
            this.updateState(info);
        }
        onScreenReaderModeChange(editorWidget) {
            let screenReaderMode = false;
            // We only support text based editors
            if (editorWidget) {
                const screenReaderDetected = this.accessibilityService.isScreenReaderOptimized();
                if (screenReaderDetected) {
                    const screenReaderConfiguration = this.configurationService.getValue('editor').accessibilitySupport;
                    if (screenReaderConfiguration === 'auto') {
                        if (!this.promptedScreenReader) {
                            this.promptedScreenReader = true;
                            setTimeout(() => this.showScreenReaderNotification(), 100);
                        }
                    }
                }
                screenReaderMode = (editorWidget.getOption(2 /* accessibilitySupport */) === 2 /* Enabled */);
            }
            if (screenReaderMode === false && this.screenReaderNotification) {
                this.screenReaderNotification.close();
            }
            this.updateState({ type: 'screenReaderMode', screenReaderMode: screenReaderMode });
        }
        onSelectionChange(editorWidget) {
            const info = Object.create(null);
            // We only support text based editors
            if (editorWidget) {
                // Compute selection(s)
                info.selections = editorWidget.getSelections() || [];
                // Compute selection length
                info.charactersSelected = 0;
                const textModel = editorWidget.getModel();
                if (textModel) {
                    info.selections.forEach(selection => {
                        if (typeof info.charactersSelected !== 'number') {
                            info.charactersSelected = 0;
                        }
                        info.charactersSelected += textModel.getCharacterCountInRange(selection);
                    });
                }
                // Compute the visible column for one selection. This will properly handle tabs and their configured widths
                if (info.selections.length === 1) {
                    const editorPosition = editorWidget.getPosition();
                    let selectionClone = new selection_1.Selection(info.selections[0].selectionStartLineNumber, info.selections[0].selectionStartColumn, info.selections[0].positionLineNumber, editorPosition ? editorWidget.getStatusbarColumn(editorPosition) : info.selections[0].positionColumn);
                    info.selections[0] = selectionClone;
                }
            }
            this.updateState({ type: 'selectionStatus', selectionStatus: this.getSelectionLabel(info) });
        }
        onEOLChange(editorWidget) {
            const info = { type: 'EOL', EOL: undefined };
            if (editorWidget && !editorWidget.getOption(72 /* readOnly */)) {
                const codeEditorModel = editorWidget.getModel();
                if (codeEditorModel) {
                    info.EOL = codeEditorModel.getEOL();
                }
            }
            this.updateState(info);
        }
        onEncodingChange(editor, editorWidget) {
            if (editor && !this.isActiveEditor(editor)) {
                return;
            }
            const info = { type: 'encoding', encoding: undefined };
            // We only support text based editors that have a model associated
            // This ensures we do not show the encoding picker while an editor
            // is still loading.
            if (editor && (editorWidget === null || editorWidget === void 0 ? void 0 : editorWidget.hasModel())) {
                const encodingSupport = editor.input ? toEditorWithEncodingSupport(editor.input) : null;
                if (encodingSupport) {
                    const rawEncoding = encodingSupport.getEncoding();
                    const encodingInfo = typeof rawEncoding === 'string' ? textfiles_1.SUPPORTED_ENCODINGS[rawEncoding] : undefined;
                    if (encodingInfo) {
                        info.encoding = encodingInfo.labelShort; // if we have a label, take it from there
                    }
                    else {
                        info.encoding = rawEncoding; // otherwise use it raw
                    }
                }
            }
            this.updateState(info);
        }
        onResourceEncodingChange(resource) {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane) {
                const activeResource = editor_1.toResource(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                if (activeResource && resources_1.isEqual(activeResource, resource)) {
                    const activeCodeEditor = types_1.withNullAsUndefined(editorBrowser_1.getCodeEditor(activeEditorPane.getControl()));
                    return this.onEncodingChange(activeEditorPane, activeCodeEditor); // only update if the encoding changed for the active resource
                }
            }
        }
        onTabFocusModeChange() {
            const info = { type: 'tabFocusMode', tabFocusMode: commonEditorConfig_1.TabFocus.getTabFocusMode() };
            this.updateState(info);
        }
        isActiveEditor(control) {
            const activeEditorPane = this.editorService.activeEditorPane;
            return !!activeEditorPane && activeEditorPane === control;
        }
    };
    EditorStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, modeService_1.IModeService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, notification_1.INotificationService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, statusbar_1.IStatusbarService),
        __param(8, instantiation_1.IInstantiationService)
    ], EditorStatus);
    exports.EditorStatus = EditorStatus;
    let ShowCurrentMarkerInStatusbarContribution = class ShowCurrentMarkerInStatusbarContribution extends lifecycle_1.Disposable {
        constructor(statusbarService, markerService, configurationService) {
            super();
            this.statusbarService = statusbarService;
            this.markerService = markerService;
            this.configurationService = configurationService;
            this.editor = undefined;
            this.markers = [];
            this.currentMarker = null;
            this.statusBarEntryAccessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(markerService.onMarkerChanged(changedResources => this.onMarkerChanged(changedResources)));
            this._register(event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('problems.showCurrentInStatus'))(() => this.updateStatus()));
        }
        update(editor) {
            this.editor = editor;
            this.updateMarkers();
            this.updateStatus();
        }
        updateStatus() {
            const previousMarker = this.currentMarker;
            this.currentMarker = this.getMarker();
            if (this.hasToUpdateStatus(previousMarker, this.currentMarker)) {
                if (this.currentMarker) {
                    const line = this.currentMarker.message.split(/\r\n|\r|\n/g)[0];
                    const text = `${this.getType(this.currentMarker)} ${line}`;
                    if (!this.statusBarEntryAccessor.value) {
                        this.statusBarEntryAccessor.value = this.statusbarService.addEntry({ text: '', ariaLabel: '' }, 'statusbar.currentProblem', nls.localize('currentProblem', "Current Problem"), 0 /* LEFT */);
                    }
                    this.statusBarEntryAccessor.value.update({ text, ariaLabel: text });
                }
                else {
                    this.statusBarEntryAccessor.clear();
                }
            }
        }
        hasToUpdateStatus(previousMarker, currentMarker) {
            if (!currentMarker) {
                return true;
            }
            if (!previousMarker) {
                return true;
            }
            return markers_1.IMarkerData.makeKey(previousMarker) !== markers_1.IMarkerData.makeKey(currentMarker);
        }
        getType(marker) {
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Error: return '$(error)';
                case markers_1.MarkerSeverity.Warning: return '$(warning)';
                case markers_1.MarkerSeverity.Info: return '$(info)';
            }
            return '';
        }
        getMarker() {
            if (!this.configurationService.getValue('problems.showCurrentInStatus')) {
                return null;
            }
            if (!this.editor) {
                return null;
            }
            const model = this.editor.getModel();
            if (!model) {
                return null;
            }
            const position = this.editor.getPosition();
            if (!position) {
                return null;
            }
            return this.markers.find(marker => range_1.Range.containsPosition(marker, position)) || null;
        }
        onMarkerChanged(changedResources) {
            if (!this.editor) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (model && !changedResources.some(r => resources_1.isEqual(model.uri, r))) {
                return;
            }
            this.updateMarkers();
        }
        updateMarkers() {
            if (!this.editor) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (model) {
                this.markers = this.markerService.read({
                    resource: model.uri,
                    severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info
                });
                this.markers.sort(compareMarker);
            }
            else {
                this.markers = [];
            }
            this.updateStatus();
        }
    };
    ShowCurrentMarkerInStatusbarContribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, markers_1.IMarkerService),
        __param(2, configuration_1.IConfigurationService)
    ], ShowCurrentMarkerInStatusbarContribution);
    function compareMarker(a, b) {
        let res = strings_1.compare(a.resource.toString(), b.resource.toString());
        if (res === 0) {
            res = markers_1.MarkerSeverity.compare(a.severity, b.severity);
        }
        if (res === 0) {
            res = range_1.Range.compareRangesUsingStarts(a, b);
        }
        return res;
    }
    let ShowLanguageExtensionsAction = class ShowLanguageExtensionsAction extends actions_1.Action {
        constructor(fileExtension, commandService, galleryService) {
            super(ShowLanguageExtensionsAction.ID, nls.localize('showLanguageExtensions', "Search Marketplace Extensions for '{0}'...", fileExtension));
            this.fileExtension = fileExtension;
            this.commandService = commandService;
            this.enabled = galleryService.isEnabled();
        }
        async run() {
            await this.commandService.executeCommand('workbench.extensions.action.showExtensionsForLanguage', this.fileExtension);
        }
    };
    ShowLanguageExtensionsAction.ID = 'workbench.action.showLanguageExtensions';
    ShowLanguageExtensionsAction = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, extensionManagement_1.IExtensionGalleryService)
    ], ShowLanguageExtensionsAction);
    exports.ShowLanguageExtensionsAction = ShowLanguageExtensionsAction;
    let ChangeModeAction = class ChangeModeAction extends actions_1.Action {
        constructor(actionId, actionLabel, modeService, modelService, editorService, configurationService, quickInputService, preferencesService, instantiationService, textFileService) {
            super(actionId, actionLabel);
            this.modeService = modeService;
            this.modelService = modelService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
        }
        async run() {
            var _a;
            const activeTextEditorControl = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
                return;
            }
            const textModel = activeTextEditorControl.getModel();
            const resource = this.editorService.activeEditor ? editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }) : null;
            let hasLanguageSupport = !!resource;
            if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === network_1.Schemas.untitled && !((_a = this.textFileService.untitled.get(resource)) === null || _a === void 0 ? void 0 : _a.hasAssociatedFilePath)) {
                hasLanguageSupport = false; // no configuration for untitled resources (e.g. "Untitled-1")
            }
            // Compute mode
            let currentModeId;
            let modeId;
            if (textModel) {
                modeId = textModel.getLanguageIdentifier().language;
                currentModeId = types_1.withNullAsUndefined(this.modeService.getLanguageName(modeId));
            }
            // All languages are valid picks
            const languages = this.modeService.getRegisteredLanguageNames();
            const picks = languages.sort().map((lang, index) => {
                let description;
                if (currentModeId === lang) {
                    description = nls.localize('languageDescription', "({0}) - Configured Language", this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                }
                else {
                    description = nls.localize('languageDescriptionConfigured', "({0})", this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                }
                return {
                    label: lang,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, this.getFakeResource(lang)),
                    description
                };
            });
            if (hasLanguageSupport) {
                picks.unshift({ type: 'separator', label: nls.localize('languagesPicks', "languages (identifier)") });
            }
            // Offer action to configure via settings
            let configureModeAssociations;
            let configureModeSettings;
            let galleryAction;
            if (hasLanguageSupport && resource) {
                const ext = resources_1.extname(resource) || resources_1.basename(resource);
                galleryAction = this.instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
                if (galleryAction.enabled) {
                    picks.unshift(galleryAction);
                }
                configureModeSettings = { label: nls.localize('configureModeSettings', "Configure '{0}' language based settings...", currentModeId) };
                picks.unshift(configureModeSettings);
                configureModeAssociations = { label: nls.localize('configureAssociationsExt', "Configure File Association for '{0}'...", ext) };
                picks.unshift(configureModeAssociations);
            }
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: nls.localize('autoDetect', "Auto Detect")
            };
            if (hasLanguageSupport) {
                picks.unshift(autoDetectMode);
            }
            const pick = await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguage', "Select Language Mode"), matchOnDescription: true });
            if (!pick) {
                return;
            }
            if (pick === galleryAction) {
                galleryAction.run();
                return;
            }
            // User decided to permanently configure associations, return right after
            if (pick === configureModeAssociations) {
                if (resource) {
                    this.configureFileAssociation(resource);
                }
                return;
            }
            // User decided to configure settings for current language
            if (pick === configureModeSettings) {
                this.preferencesService.openGlobalSettings(true, { editSetting: `[${types_1.withUndefinedAsNull(modeId)}]` });
                return;
            }
            // Change mode for active editor
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                const modeSupport = toEditorWithModeSupport(activeEditor);
                if (modeSupport) {
                    // Find mode
                    let languageSelection;
                    if (pick === autoDetectMode) {
                        if (textModel) {
                            const resource = editor_1.toResource(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                            if (resource) {
                                languageSelection = this.modeService.createByFilepathOrFirstLine(resource, textModel.getLineContent(1));
                            }
                        }
                    }
                    else {
                        languageSelection = this.modeService.createByLanguageName(pick.label);
                    }
                    // Change mode
                    if (typeof languageSelection !== 'undefined') {
                        modeSupport.setMode(languageSelection.languageIdentifier.language);
                    }
                }
            }
        }
        configureFileAssociation(resource) {
            const extension = resources_1.extname(resource);
            const base = resources_1.basename(resource);
            const currentAssociation = this.modeService.getModeIdByFilepathOrFirstLine(uri_1.URI.file(base));
            const languages = this.modeService.getRegisteredLanguageNames();
            const picks = languages.sort().map((lang, index) => {
                const id = types_1.withNullAsUndefined(this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                return {
                    id,
                    label: lang,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, this.getFakeResource(lang)),
                    description: (id === currentAssociation) ? nls.localize('currentAssociation', "Current Association") : undefined
                };
            });
            setTimeout(async () => {
                const language = await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguageToConfigure', "Select Language Mode to Associate with '{0}'", extension || base) });
                if (language) {
                    const fileAssociationsConfig = this.configurationService.inspect(files_1.FILES_ASSOCIATIONS_CONFIG);
                    let associationKey;
                    if (extension && base[0] !== '.') {
                        associationKey = `*${extension}`; // only use "*.ext" if the file path is in the form of <name>.<ext>
                    }
                    else {
                        associationKey = base; // otherwise use the basename (e.g. .gitignore, Dockerfile)
                    }
                    // If the association is already being made in the workspace, make sure to target workspace settings
                    let target = 1 /* USER */;
                    if (fileAssociationsConfig.workspaceValue && !!fileAssociationsConfig.workspaceValue[associationKey]) {
                        target = 4 /* WORKSPACE */;
                    }
                    // Make sure to write into the value of the target and not the merged value from USER and WORKSPACE config
                    const currentAssociations = objects_1.deepClone((target === 4 /* WORKSPACE */) ? fileAssociationsConfig.workspaceValue : fileAssociationsConfig.userValue) || Object.create(null);
                    currentAssociations[associationKey] = language.id;
                    this.configurationService.updateValue(files_1.FILES_ASSOCIATIONS_CONFIG, currentAssociations, target);
                }
            }, 50 /* quick input is sensitive to being opened so soon after another */);
        }
        getFakeResource(lang) {
            let fakeResource;
            const extensions = this.modeService.getExtensions(lang);
            if (extensions === null || extensions === void 0 ? void 0 : extensions.length) {
                fakeResource = uri_1.URI.file(extensions[0]);
            }
            else {
                const filenames = this.modeService.getFilenames(lang);
                if (filenames === null || filenames === void 0 ? void 0 : filenames.length) {
                    fakeResource = uri_1.URI.file(filenames[0]);
                }
            }
            return fakeResource;
        }
    };
    ChangeModeAction.ID = 'workbench.action.editor.changeLanguageMode';
    ChangeModeAction.LABEL = nls.localize('changeMode', "Change Language Mode");
    ChangeModeAction = __decorate([
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, preferences_1.IPreferencesService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, textfiles_1.ITextFileService)
    ], ChangeModeAction);
    exports.ChangeModeAction = ChangeModeAction;
    let ChangeEOLAction = class ChangeEOLAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
        }
        async run() {
            var _a, _b;
            const activeTextEditorControl = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorControl);
            if (!activeTextEditorControl) {
                await this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
                return;
            }
            if ((_a = this.editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.isReadonly()) {
                await this.quickInputService.pick([{ label: nls.localize('noWritableCodeEditor', "The active code editor is read-only.") }]);
                return;
            }
            let textModel = activeTextEditorControl.getModel();
            const EOLOptions = [
                { label: nlsEOLLF, eol: 0 /* LF */ },
                { label: nlsEOLCRLF, eol: 1 /* CRLF */ },
            ];
            const selectedIndex = ((textModel === null || textModel === void 0 ? void 0 : textModel.getEOL()) === '\n') ? 0 : 1;
            const eol = await this.quickInputService.pick(EOLOptions, { placeHolder: nls.localize('pickEndOfLine', "Select End of Line Sequence"), activeItem: EOLOptions[selectedIndex] });
            if (eol) {
                const activeCodeEditor = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorControl);
                if ((activeCodeEditor === null || activeCodeEditor === void 0 ? void 0 : activeCodeEditor.hasModel()) && !((_b = this.editorService.activeEditor) === null || _b === void 0 ? void 0 : _b.isReadonly())) {
                    textModel = activeCodeEditor.getModel();
                    textModel.pushStackElement();
                    textModel.pushEOL(eol.eol);
                    textModel.pushStackElement();
                }
            }
        }
    };
    ChangeEOLAction.ID = 'workbench.action.editor.changeEOL';
    ChangeEOLAction.LABEL = nls.localize('changeEndOfLine', "Change End of Line Sequence");
    ChangeEOLAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService)
    ], ChangeEOLAction);
    exports.ChangeEOLAction = ChangeEOLAction;
    let ChangeEncodingAction = class ChangeEncodingAction extends actions_1.Action {
        constructor(actionId, actionLabel, editorService, quickInputService, textResourceConfigurationService, fileService, textFileService) {
            super(actionId, actionLabel);
            this.editorService = editorService;
            this.quickInputService = quickInputService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.fileService = fileService;
            this.textFileService = textFileService;
        }
        async run() {
            if (!editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorControl)) {
                await this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
                return;
            }
            const activeEditorPane = this.editorService.activeEditorPane;
            if (!activeEditorPane) {
                await this.quickInputService.pick([{ label: nls.localize('noEditor', "No text editor active at this time") }]);
                return;
            }
            const encodingSupport = toEditorWithEncodingSupport(activeEditorPane.input);
            if (!encodingSupport) {
                await this.quickInputService.pick([{ label: nls.localize('noFileEditor', "No file active at this time") }]);
                return;
            }
            const saveWithEncodingPick = { label: nls.localize('saveWithEncoding', "Save with Encoding") };
            const reopenWithEncodingPick = { label: nls.localize('reopenWithEncoding', "Reopen with Encoding") };
            if (!platform_1.Language.isDefaultVariant()) {
                const saveWithEncodingAlias = 'Save with Encoding';
                if (saveWithEncodingAlias !== saveWithEncodingPick.label) {
                    saveWithEncodingPick.detail = saveWithEncodingAlias;
                }
                const reopenWithEncodingAlias = 'Reopen with Encoding';
                if (reopenWithEncodingAlias !== reopenWithEncodingPick.label) {
                    reopenWithEncodingPick.detail = reopenWithEncodingAlias;
                }
            }
            let action;
            if (encodingSupport instanceof untitledTextEditorInput_1.UntitledTextEditorInput) {
                action = saveWithEncodingPick;
            }
            else if (activeEditorPane.input.isReadonly()) {
                action = reopenWithEncodingPick;
            }
            else {
                action = await this.quickInputService.pick([reopenWithEncodingPick, saveWithEncodingPick], { placeHolder: nls.localize('pickAction', "Select Action"), matchOnDetail: true });
            }
            if (!action) {
                return;
            }
            await async_1.timeout(50); // quick input is sensitive to being opened so soon after another
            const resource = editor_1.toResource(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!resource || (!this.fileService.canHandleResource(resource) && resource.scheme !== network_1.Schemas.untitled)) {
                return; // encoding detection only possible for resources the file service can handle or that are untitled
            }
            let guessedEncoding = undefined;
            if (this.fileService.canHandleResource(resource)) {
                const content = await this.textFileService.read(resource, { autoGuessEncoding: true });
                guessedEncoding = content.encoding;
            }
            const isReopenWithEncoding = (action === reopenWithEncodingPick);
            const configuredEncoding = this.textResourceConfigurationService.getValue(types_1.withNullAsUndefined(resource), 'files.encoding');
            let directMatchIndex;
            let aliasMatchIndex;
            // All encodings are valid picks
            const picks = Object.keys(textfiles_1.SUPPORTED_ENCODINGS)
                .sort((k1, k2) => {
                if (k1 === configuredEncoding) {
                    return -1;
                }
                else if (k2 === configuredEncoding) {
                    return 1;
                }
                return textfiles_1.SUPPORTED_ENCODINGS[k1].order - textfiles_1.SUPPORTED_ENCODINGS[k2].order;
            })
                .filter(k => {
                if (k === guessedEncoding && guessedEncoding !== configuredEncoding) {
                    return false; // do not show encoding if it is the guessed encoding that does not match the configured
                }
                return !isReopenWithEncoding || !textfiles_1.SUPPORTED_ENCODINGS[k].encodeOnly; // hide those that can only be used for encoding if we are about to decode
            })
                .map((key, index) => {
                if (key === encodingSupport.getEncoding()) {
                    directMatchIndex = index;
                }
                else if (textfiles_1.SUPPORTED_ENCODINGS[key].alias === encodingSupport.getEncoding()) {
                    aliasMatchIndex = index;
                }
                return { id: key, label: textfiles_1.SUPPORTED_ENCODINGS[key].labelLong, description: key };
            });
            const items = picks.slice();
            // If we have a guessed encoding, show it first unless it matches the configured encoding
            if (guessedEncoding && configuredEncoding !== guessedEncoding && textfiles_1.SUPPORTED_ENCODINGS[guessedEncoding]) {
                picks.unshift({ type: 'separator' });
                picks.unshift({ id: guessedEncoding, label: textfiles_1.SUPPORTED_ENCODINGS[guessedEncoding].labelLong, description: nls.localize('guessedEncoding', "Guessed from content") });
            }
            const encoding = await this.quickInputService.pick(picks, {
                placeHolder: isReopenWithEncoding ? nls.localize('pickEncodingForReopen', "Select File Encoding to Reopen File") : nls.localize('pickEncodingForSave', "Select File Encoding to Save with"),
                activeItem: items[typeof directMatchIndex === 'number' ? directMatchIndex : typeof aliasMatchIndex === 'number' ? aliasMatchIndex : -1]
            });
            if (!encoding) {
                return;
            }
            if (!this.editorService.activeEditorPane) {
                return;
            }
            const activeEncodingSupport = toEditorWithEncodingSupport(this.editorService.activeEditorPane.input);
            if (typeof encoding.id !== 'undefined' && activeEncodingSupport && activeEncodingSupport.getEncoding() !== encoding.id) {
                activeEncodingSupport.setEncoding(encoding.id, isReopenWithEncoding ? 1 /* Decode */ : 0 /* Encode */); // Set new encoding
            }
        }
    };
    ChangeEncodingAction.ID = 'workbench.action.editor.changeEncoding';
    ChangeEncodingAction.LABEL = nls.localize('changeEncoding', "Change File Encoding");
    ChangeEncodingAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, textResourceConfigurationService_1.ITextResourceConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService)
    ], ChangeEncodingAction);
    exports.ChangeEncodingAction = ChangeEncodingAction;
});
//# __sourceMappingURL=editorStatus.js.map