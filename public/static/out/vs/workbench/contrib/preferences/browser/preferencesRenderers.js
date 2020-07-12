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
define(["require", "exports", "vs/base/browser/contextmenu", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/rangeDecorations", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/platform/markers/common/markers", "vs/workbench/services/environment/common/environmentService", "vs/base/common/arrays"], function (require, exports, contextmenu_1, dom_1, async_1, event_1, lifecycle_1, position_1, range_1, textModel_1, nls, configuration_1, configurationRegistry_1, contextView_1, instantiation_1, platform_1, telemetry_1, workspace_1, rangeDecorations_1, preferencesWidgets_1, preferences_1, preferencesModels_1, markers_1, environmentService_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HighlightMatchesRenderer = exports.FilteredMatchesRenderer = exports.HiddenAreasRenderer = exports.SettingsGroupTitleRenderer = exports.BracesHidingRenderer = exports.DefaultSettingsRenderer = exports.FolderSettingsRenderer = exports.WorkspaceSettingsRenderer = exports.UserSettingsRenderer = void 0;
    let UserSettingsRenderer = class UserSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super();
            this.editor = editor;
            this.preferencesModel = preferencesModel;
            this.preferencesService = preferencesService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.modelChangeDelayer = new async_1.Delayer(200);
            this._onFocusPreference = this._register(new event_1.Emitter());
            this.onFocusPreference = this._onFocusPreference.event;
            this._onClearFocusPreference = this._register(new event_1.Emitter());
            this.onClearFocusPreference = this._onClearFocusPreference.event;
            this._onUpdatePreference = this._register(new event_1.Emitter());
            this.onUpdatePreference = this._onUpdatePreference.event;
            this.settingHighlighter = this._register(instantiationService.createInstance(SettingHighlighter, editor, this._onFocusPreference, this._onClearFocusPreference));
            this.highlightMatchesRenderer = this._register(instantiationService.createInstance(HighlightMatchesRenderer, editor));
            this.editSettingActionRenderer = this._register(this.instantiationService.createInstance(EditSettingRenderer, this.editor, this.preferencesModel, this.settingHighlighter));
            this._register(this.editSettingActionRenderer.onUpdateSetting(({ key, value, source }) => this._updatePreference(key, value, source)));
            this._register(this.editor.getModel().onDidChangeContent(() => this.modelChangeDelayer.trigger(() => this.onModelChanged())));
            this.unsupportedSettingsRenderer = this._register(instantiationService.createInstance(UnsupportedSettingsRenderer, editor, preferencesModel));
        }
        getAssociatedPreferencesModel() {
            return this.associatedPreferencesModel;
        }
        setAssociatedPreferencesModel(associatedPreferencesModel) {
            this.associatedPreferencesModel = associatedPreferencesModel;
            this.editSettingActionRenderer.associatedPreferencesModel = associatedPreferencesModel;
            // Create header only in Settings editor mode
            this.createHeader();
        }
        createHeader() {
            this._register(new preferencesWidgets_1.SettingsHeaderWidget(this.editor, '')).setMessage(nls.localize('emptyUserSettingsHeader', "Place your settings here to override the Default Settings."));
        }
        render() {
            this.editSettingActionRenderer.render(this.preferencesModel.settingsGroups, this.associatedPreferencesModel);
            if (this.filterResult) {
                this.filterPreferences(this.filterResult);
            }
            this.unsupportedSettingsRenderer.render();
        }
        _updatePreference(key, value, source) {
            this._onUpdatePreference.fire({ key, value, source });
            this.updatePreference(key, value, source);
        }
        updatePreference(key, value, source) {
            const overrideIdentifier = source.overrideOf ? configuration_1.overrideIdentifierFromKey(source.overrideOf.key) : null;
            const resource = this.preferencesModel.uri;
            this.configurationService.updateValue(key, value, { overrideIdentifier, resource }, this.preferencesModel.configurationTarget)
                .then(() => this.onSettingUpdated(source));
        }
        onModelChanged() {
            if (!this.editor.hasModel()) {
                // model could have been disposed during the delay
                return;
            }
            this.render();
        }
        onSettingUpdated(setting) {
            this.editor.focus();
            setting = this.getSetting(setting);
            if (setting) {
                // TODO:@sandy Selection range should be template range
                this.editor.setSelection(setting.valueRange);
                this.settingHighlighter.highlight(setting, true);
            }
        }
        getSetting(setting) {
            const { key, overrideOf } = setting;
            if (overrideOf) {
                const setting = this.getSetting(overrideOf);
                for (const override of setting.overrides) {
                    if (override.key === key) {
                        return override;
                    }
                }
                return undefined;
            }
            return this.preferencesModel.getPreference(key);
        }
        filterPreferences(filterResult) {
            this.filterResult = filterResult;
            this.settingHighlighter.clear(true);
            this.highlightMatchesRenderer.render(filterResult ? filterResult.matches : []);
        }
        focusPreference(setting) {
            const s = this.getSetting(setting);
            if (s) {
                this.settingHighlighter.highlight(s, true);
                this.editor.setPosition({ lineNumber: s.keyRange.startLineNumber, column: s.keyRange.startColumn });
            }
            else {
                this.settingHighlighter.clear(true);
            }
        }
        clearFocus(setting) {
            this.settingHighlighter.clear(true);
        }
        editPreference(setting) {
            const editableSetting = this.getSetting(setting);
            return !!(editableSetting && this.editSettingActionRenderer.activateOnSetting(editableSetting));
        }
    };
    UserSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], UserSettingsRenderer);
    exports.UserSettingsRenderer = UserSettingsRenderer;
    let WorkspaceSettingsRenderer = class WorkspaceSettingsRenderer extends UserSettingsRenderer {
        constructor(editor, preferencesModel, preferencesService, telemetryService, configurationService, instantiationService) {
            super(editor, preferencesModel, preferencesService, configurationService, instantiationService);
            this.workspaceConfigurationRenderer = this._register(instantiationService.createInstance(WorkspaceConfigurationRenderer, editor, preferencesModel));
        }
        createHeader() {
            this._register(new preferencesWidgets_1.SettingsHeaderWidget(this.editor, '')).setMessage(nls.localize('emptyWorkspaceSettingsHeader', "Place your settings here to override the User Settings."));
        }
        setAssociatedPreferencesModel(associatedPreferencesModel) {
            super.setAssociatedPreferencesModel(associatedPreferencesModel);
            this.workspaceConfigurationRenderer.render(this.getAssociatedPreferencesModel());
        }
        render() {
            super.render();
            this.workspaceConfigurationRenderer.render(this.getAssociatedPreferencesModel());
        }
    };
    WorkspaceSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], WorkspaceSettingsRenderer);
    exports.WorkspaceSettingsRenderer = WorkspaceSettingsRenderer;
    let FolderSettingsRenderer = class FolderSettingsRenderer extends UserSettingsRenderer {
        constructor(editor, preferencesModel, preferencesService, telemetryService, configurationService, instantiationService) {
            super(editor, preferencesModel, preferencesService, configurationService, instantiationService);
        }
        createHeader() {
            this._register(new preferencesWidgets_1.SettingsHeaderWidget(this.editor, '')).setMessage(nls.localize('emptyFolderSettingsHeader', "Place your folder settings here to override those from the Workspace Settings."));
        }
    };
    FolderSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], FolderSettingsRenderer);
    exports.FolderSettingsRenderer = FolderSettingsRenderer;
    let DefaultSettingsRenderer = class DefaultSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, preferencesModel, preferencesService, instantiationService) {
            super();
            this.editor = editor;
            this.preferencesModel = preferencesModel;
            this.preferencesService = preferencesService;
            this.instantiationService = instantiationService;
            this._onUpdatePreference = this._register(new event_1.Emitter());
            this.onUpdatePreference = this._onUpdatePreference.event;
            this._onFocusPreference = this._register(new event_1.Emitter());
            this.onFocusPreference = this._onFocusPreference.event;
            this._onClearFocusPreference = this._register(new event_1.Emitter());
            this.onClearFocusPreference = this._onClearFocusPreference.event;
            this.settingHighlighter = this._register(instantiationService.createInstance(SettingHighlighter, editor, this._onFocusPreference, this._onClearFocusPreference));
            this.settingsHeaderRenderer = this._register(instantiationService.createInstance(DefaultSettingsHeaderRenderer, editor));
            this.settingsGroupTitleRenderer = this._register(instantiationService.createInstance(SettingsGroupTitleRenderer, editor));
            this.filteredMatchesRenderer = this._register(instantiationService.createInstance(FilteredMatchesRenderer, editor));
            this.editSettingActionRenderer = this._register(instantiationService.createInstance(EditSettingRenderer, editor, preferencesModel, this.settingHighlighter));
            this.bracesHidingRenderer = this._register(instantiationService.createInstance(BracesHidingRenderer, editor));
            this.hiddenAreasRenderer = this._register(instantiationService.createInstance(HiddenAreasRenderer, editor, [this.settingsGroupTitleRenderer, this.filteredMatchesRenderer, this.bracesHidingRenderer]));
            this._register(this.editSettingActionRenderer.onUpdateSetting(e => this._onUpdatePreference.fire(e)));
            this._register(this.settingsGroupTitleRenderer.onHiddenAreasChanged(() => this.hiddenAreasRenderer.render()));
            this._register(preferencesModel.onDidChangeGroups(() => this.render()));
        }
        getAssociatedPreferencesModel() {
            return this._associatedPreferencesModel;
        }
        setAssociatedPreferencesModel(associatedPreferencesModel) {
            this._associatedPreferencesModel = associatedPreferencesModel;
            this.editSettingActionRenderer.associatedPreferencesModel = associatedPreferencesModel;
        }
        render() {
            this.settingsGroupTitleRenderer.render(this.preferencesModel.settingsGroups);
            this.editSettingActionRenderer.render(this.preferencesModel.settingsGroups, this._associatedPreferencesModel);
            this.settingHighlighter.clear(true);
            this.bracesHidingRenderer.render(undefined, this.preferencesModel.settingsGroups);
            this.settingsGroupTitleRenderer.showGroup(0);
            this.hiddenAreasRenderer.render();
        }
        filterPreferences(filterResult) {
            this.filterResult = filterResult;
            if (filterResult) {
                this.filteredMatchesRenderer.render(filterResult, this.preferencesModel.settingsGroups);
                this.settingsGroupTitleRenderer.render(undefined);
                this.settingsHeaderRenderer.render(filterResult);
                this.settingHighlighter.clear(true);
                this.bracesHidingRenderer.render(filterResult, this.preferencesModel.settingsGroups);
                this.editSettingActionRenderer.render(filterResult.filteredGroups, this._associatedPreferencesModel);
            }
            else {
                this.settingHighlighter.clear(true);
                this.filteredMatchesRenderer.render(undefined, this.preferencesModel.settingsGroups);
                this.settingsHeaderRenderer.render(undefined);
                this.settingsGroupTitleRenderer.render(this.preferencesModel.settingsGroups);
                this.settingsGroupTitleRenderer.showGroup(0);
                this.bracesHidingRenderer.render(undefined, this.preferencesModel.settingsGroups);
                this.editSettingActionRenderer.render(this.preferencesModel.settingsGroups, this._associatedPreferencesModel);
            }
            this.hiddenAreasRenderer.render();
        }
        focusPreference(s) {
            const setting = this.getSetting(s);
            if (setting) {
                this.settingsGroupTitleRenderer.showSetting(setting);
                this.settingHighlighter.highlight(setting, true);
            }
            else {
                this.settingHighlighter.clear(true);
            }
        }
        getSetting(setting) {
            const { key, overrideOf } = setting;
            if (overrideOf) {
                const setting = this.getSetting(overrideOf);
                return arrays_1.find(setting.overrides, override => override.key === key);
            }
            const settingsGroups = this.filterResult ? this.filterResult.filteredGroups : this.preferencesModel.settingsGroups;
            return this.getPreference(key, settingsGroups);
        }
        getPreference(key, settingsGroups) {
            for (const group of settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (setting.key === key) {
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        clearFocus(setting) {
            this.settingHighlighter.clear(true);
        }
        updatePreference(key, value, source) {
        }
        editPreference(setting) {
            return this.editSettingActionRenderer.activateOnSetting(setting);
        }
    };
    DefaultSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, instantiation_1.IInstantiationService)
    ], DefaultSettingsRenderer);
    exports.DefaultSettingsRenderer = DefaultSettingsRenderer;
    class BracesHidingRenderer extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this.editor = editor;
        }
        render(result, settingsGroups) {
            this._result = result;
            this._settingsGroups = settingsGroups;
        }
        get hiddenAreas() {
            // Opening square brace
            const hiddenAreas = [
                {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 2,
                    endColumn: 1
                }
            ];
            const hideBraces = (group, hideExtraLine) => {
                // Opening curly brace
                hiddenAreas.push({
                    startLineNumber: group.range.startLineNumber - 3,
                    startColumn: 1,
                    endLineNumber: group.range.startLineNumber - (hideExtraLine ? 1 : 3),
                    endColumn: 1
                });
                // Closing curly brace
                hiddenAreas.push({
                    startLineNumber: group.range.endLineNumber + 1,
                    startColumn: 1,
                    endLineNumber: group.range.endLineNumber + 4,
                    endColumn: 1
                });
            };
            this._settingsGroups.forEach(g => hideBraces(g));
            if (this._result) {
                this._result.filteredGroups.forEach((g, i) => hideBraces(g, true));
            }
            // Closing square brace
            const lineCount = this.editor.getModel().getLineCount();
            hiddenAreas.push({
                startLineNumber: lineCount,
                startColumn: 1,
                endLineNumber: lineCount,
                endColumn: 1
            });
            return hiddenAreas;
        }
    }
    exports.BracesHidingRenderer = BracesHidingRenderer;
    class DefaultSettingsHeaderRenderer extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this.settingsHeaderWidget = this._register(new preferencesWidgets_1.DefaultSettingsHeaderWidget(editor, ''));
            this.onClick = this.settingsHeaderWidget.onClick;
        }
        render(filterResult) {
            const hasSettings = !filterResult || filterResult.filteredGroups.length > 0;
            this.settingsHeaderWidget.toggleMessage(hasSettings);
        }
    }
    let SettingsGroupTitleRenderer = class SettingsGroupTitleRenderer extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this._onHiddenAreasChanged = this._register(new event_1.Emitter());
            this.onHiddenAreasChanged = this._onHiddenAreasChanged.event;
            this.hiddenGroups = [];
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        get hiddenAreas() {
            const hiddenAreas = [];
            for (const group of this.hiddenGroups) {
                hiddenAreas.push(group.range);
            }
            return hiddenAreas;
        }
        render(settingsGroups) {
            this.disposeWidgets();
            if (!settingsGroups) {
                return;
            }
            this.settingsGroups = settingsGroups.slice();
            this.settingsGroupTitleWidgets = [];
            for (const group of this.settingsGroups.slice().reverse()) {
                if (group.sections.every(sect => sect.settings.length === 0)) {
                    continue;
                }
                const settingsGroupTitleWidget = this.instantiationService.createInstance(preferencesWidgets_1.SettingsGroupTitleWidget, this.editor, group);
                settingsGroupTitleWidget.render();
                this.settingsGroupTitleWidgets.push(settingsGroupTitleWidget);
                this.renderDisposables.add(settingsGroupTitleWidget);
                this.renderDisposables.add(settingsGroupTitleWidget.onToggled(collapsed => this.onToggled(collapsed, settingsGroupTitleWidget.settingsGroup)));
            }
            this.settingsGroupTitleWidgets.reverse();
        }
        showGroup(groupIdx) {
            const shownGroup = this.settingsGroupTitleWidgets[groupIdx].settingsGroup;
            this.hiddenGroups = this.settingsGroups.filter(g => g !== shownGroup);
            for (const groupTitleWidget of this.settingsGroupTitleWidgets.filter(widget => widget.settingsGroup !== shownGroup)) {
                groupTitleWidget.toggleCollapse(true);
            }
            this._onHiddenAreasChanged.fire();
        }
        showSetting(setting) {
            const settingsGroupTitleWidget = this.settingsGroupTitleWidgets.filter(widget => range_1.Range.containsRange(widget.settingsGroup.range, setting.range))[0];
            if (settingsGroupTitleWidget && settingsGroupTitleWidget.isCollapsed()) {
                settingsGroupTitleWidget.toggleCollapse(false);
                this.hiddenGroups.splice(this.hiddenGroups.indexOf(settingsGroupTitleWidget.settingsGroup), 1);
                this._onHiddenAreasChanged.fire();
            }
        }
        onToggled(collapsed, group) {
            const index = this.hiddenGroups.indexOf(group);
            if (collapsed) {
                const currentPosition = this.editor.getPosition();
                if (group.range.startLineNumber <= currentPosition.lineNumber && group.range.endLineNumber >= currentPosition.lineNumber) {
                    this.editor.setPosition({ lineNumber: group.range.startLineNumber - 1, column: 1 });
                }
                this.hiddenGroups.push(group);
            }
            else {
                this.hiddenGroups.splice(index, 1);
            }
            this._onHiddenAreasChanged.fire();
        }
        disposeWidgets() {
            this.hiddenGroups = [];
            this.renderDisposables.clear();
        }
        dispose() {
            this.disposeWidgets();
            super.dispose();
        }
    };
    SettingsGroupTitleRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], SettingsGroupTitleRenderer);
    exports.SettingsGroupTitleRenderer = SettingsGroupTitleRenderer;
    class HiddenAreasRenderer extends lifecycle_1.Disposable {
        constructor(editor, hiddenAreasProviders) {
            super();
            this.editor = editor;
            this.hiddenAreasProviders = hiddenAreasProviders;
        }
        render() {
            const ranges = [];
            for (const hiddenAreaProvider of this.hiddenAreasProviders) {
                ranges.push(...hiddenAreaProvider.hiddenAreas);
            }
            this.editor.setHiddenAreas(ranges);
        }
        dispose() {
            this.editor.setHiddenAreas([]);
            super.dispose();
        }
    }
    exports.HiddenAreasRenderer = HiddenAreasRenderer;
    class FilteredMatchesRenderer extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this.editor = editor;
            this.decorationIds = [];
            this.hiddenAreas = [];
        }
        render(result, allSettingsGroups) {
            this.hiddenAreas = [];
            if (result) {
                this.hiddenAreas = this.computeHiddenRanges(result.filteredGroups, result.allGroups);
                this.decorationIds = this.editor.deltaDecorations(this.decorationIds, result.matches.map(match => this.createDecoration(match)));
            }
            else {
                this.hiddenAreas = this.computeHiddenRanges(undefined, allSettingsGroups);
                this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
            }
        }
        createDecoration(range) {
            return {
                range,
                options: FilteredMatchesRenderer._FIND_MATCH
            };
        }
        computeHiddenRanges(filteredGroups, allSettingsGroups) {
            // Hide the contents of hidden groups
            const notMatchesRanges = [];
            if (filteredGroups) {
                allSettingsGroups.forEach((group, i) => {
                    notMatchesRanges.push({
                        startLineNumber: group.range.startLineNumber - 1,
                        startColumn: group.range.startColumn,
                        endLineNumber: group.range.endLineNumber,
                        endColumn: group.range.endColumn
                    });
                });
            }
            return notMatchesRanges;
        }
        dispose() {
            this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
            super.dispose();
        }
    }
    exports.FilteredMatchesRenderer = FilteredMatchesRenderer;
    FilteredMatchesRenderer._FIND_MATCH = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'findMatch'
    });
    class HighlightMatchesRenderer extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this.editor = editor;
            this.decorationIds = [];
        }
        render(matches) {
            this.decorationIds = this.editor.deltaDecorations(this.decorationIds, matches.map(match => this.createDecoration(match)));
        }
        createDecoration(range) {
            return {
                range,
                options: HighlightMatchesRenderer._FIND_MATCH
            };
        }
        dispose() {
            this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
            super.dispose();
        }
    }
    exports.HighlightMatchesRenderer = HighlightMatchesRenderer;
    HighlightMatchesRenderer._FIND_MATCH = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'findMatch'
    });
    let EditSettingRenderer = class EditSettingRenderer extends lifecycle_1.Disposable {
        constructor(editor, primarySettingsModel, settingHighlighter, instantiationService, contextMenuService) {
            super();
            this.editor = editor;
            this.primarySettingsModel = primarySettingsModel;
            this.settingHighlighter = settingHighlighter;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.settingsGroups = [];
            this._onUpdateSetting = new event_1.Emitter();
            this.onUpdateSetting = this._onUpdateSetting.event;
            this.editPreferenceWidgetForCursorPosition = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.editPreferenceWidgetForMouseMove = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.toggleEditPreferencesForMouseMoveDelayer = new async_1.Delayer(75);
            this._register(this.editPreferenceWidgetForCursorPosition.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForCursorPosition, e)));
            this._register(this.editPreferenceWidgetForMouseMove.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForMouseMove, e)));
            this._register(this.editor.onDidChangeCursorPosition(positionChangeEvent => this.onPositionChanged(positionChangeEvent)));
            this._register(this.editor.onMouseMove(mouseMoveEvent => this.onMouseMoved(mouseMoveEvent)));
            this._register(this.editor.onDidChangeConfiguration(() => this.onConfigurationChanged()));
        }
        render(settingsGroups, associatedPreferencesModel) {
            this.editPreferenceWidgetForCursorPosition.hide();
            this.editPreferenceWidgetForMouseMove.hide();
            this.settingsGroups = settingsGroups;
            this.associatedPreferencesModel = associatedPreferencesModel;
            const settings = this.getSettings(this.editor.getPosition().lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
        }
        isDefaultSettings() {
            return this.primarySettingsModel instanceof preferencesModels_1.DefaultSettingsEditorModel;
        }
        onConfigurationChanged() {
            if (!this.editor.getOption(42 /* glyphMargin */)) {
                this.editPreferenceWidgetForCursorPosition.hide();
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        onPositionChanged(positionChangeEvent) {
            this.editPreferenceWidgetForMouseMove.hide();
            const settings = this.getSettings(positionChangeEvent.position.lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
            else {
                this.editPreferenceWidgetForCursorPosition.hide();
            }
        }
        onMouseMoved(mouseMoveEvent) {
            const editPreferenceWidget = this.getEditPreferenceWidgetUnderMouse(mouseMoveEvent);
            if (editPreferenceWidget) {
                this.onMouseOver(editPreferenceWidget);
                return;
            }
            this.settingHighlighter.clear();
            this.toggleEditPreferencesForMouseMoveDelayer.trigger(() => this.toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent));
        }
        getEditPreferenceWidgetUnderMouse(mouseMoveEvent) {
            if (mouseMoveEvent.target.type === 2 /* GUTTER_GLYPH_MARGIN */) {
                const line = mouseMoveEvent.target.position.lineNumber;
                if (this.editPreferenceWidgetForMouseMove.getLine() === line && this.editPreferenceWidgetForMouseMove.isVisible()) {
                    return this.editPreferenceWidgetForMouseMove;
                }
                if (this.editPreferenceWidgetForCursorPosition.getLine() === line && this.editPreferenceWidgetForCursorPosition.isVisible()) {
                    return this.editPreferenceWidgetForCursorPosition;
                }
            }
            return undefined;
        }
        toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent) {
            const settings = mouseMoveEvent.target.position ? this.getSettings(mouseMoveEvent.target.position.lineNumber) : null;
            if (settings && settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForMouseMove, settings);
            }
            else {
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        showEditPreferencesWidget(editPreferencesWidget, settings) {
            const line = settings[0].valueRange.startLineNumber;
            if (this.editor.getOption(42 /* glyphMargin */) && this.marginFreeFromOtherDecorations(line)) {
                editPreferencesWidget.show(line, nls.localize('editTtile', "Edit"), settings);
                const editPreferenceWidgetToHide = editPreferencesWidget === this.editPreferenceWidgetForCursorPosition ? this.editPreferenceWidgetForMouseMove : this.editPreferenceWidgetForCursorPosition;
                editPreferenceWidgetToHide.hide();
            }
        }
        marginFreeFromOtherDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    if (options.glyphMarginClassName && options.glyphMarginClassName.indexOf(preferencesWidgets_1.preferencesEditIcon.classNames) === -1) {
                        return false;
                    }
                }
            }
            return true;
        }
        getSettings(lineNumber) {
            const configurationMap = this.getConfigurationsMap();
            return this.getSettingsAtLineNumber(lineNumber).filter(setting => {
                const configurationNode = configurationMap[setting.key];
                if (configurationNode) {
                    if (this.isDefaultSettings()) {
                        if (setting.key === 'launch') {
                            // Do not show because of https://github.com/Microsoft/vscode/issues/32593
                            return false;
                        }
                        return true;
                    }
                    if (configurationNode.type === 'boolean' || configurationNode.enum) {
                        if (this.primarySettingsModel.configurationTarget !== 5 /* WORKSPACE_FOLDER */) {
                            return true;
                        }
                        if (configurationNode.scope === 4 /* RESOURCE */ || configurationNode.scope === 5 /* LANGUAGE_OVERRIDABLE */) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        getSettingsAtLineNumber(lineNumber) {
            // index of setting, across all groups/sections
            let index = 0;
            const settings = [];
            for (const group of this.settingsGroups) {
                if (group.range.startLineNumber > lineNumber) {
                    break;
                }
                if (lineNumber >= group.range.startLineNumber && lineNumber <= group.range.endLineNumber) {
                    for (const section of group.sections) {
                        for (const setting of section.settings) {
                            if (setting.range.startLineNumber > lineNumber) {
                                break;
                            }
                            if (lineNumber >= setting.range.startLineNumber && lineNumber <= setting.range.endLineNumber) {
                                if (!this.isDefaultSettings() && setting.overrides.length) {
                                    // Only one level because override settings cannot have override settings
                                    for (const overrideSetting of setting.overrides) {
                                        if (lineNumber >= overrideSetting.range.startLineNumber && lineNumber <= overrideSetting.range.endLineNumber) {
                                            settings.push(Object.assign(Object.assign({}, overrideSetting), { index, groupId: group.id }));
                                        }
                                    }
                                }
                                else {
                                    settings.push(Object.assign(Object.assign({}, setting), { index, groupId: group.id }));
                                }
                            }
                            index++;
                        }
                    }
                }
            }
            return settings;
        }
        onMouseOver(editPreferenceWidget) {
            this.settingHighlighter.highlight(editPreferenceWidget.preferences[0]);
        }
        onEditSettingClicked(editPreferenceWidget, e) {
            dom_1.EventHelper.stop(e.event, true);
            const anchor = { x: e.event.posx, y: e.event.posy + 10 };
            const actions = this.getSettings(editPreferenceWidget.getLine()).length === 1 ? this.getActions(editPreferenceWidget.preferences[0], this.getConfigurationsMap()[editPreferenceWidget.preferences[0].key])
                : editPreferenceWidget.preferences.map(setting => new contextmenu_1.ContextSubMenu(setting.key, this.getActions(setting, this.getConfigurationsMap()[setting.key])));
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions
            });
        }
        activateOnSetting(setting) {
            const startLine = setting.keyRange.startLineNumber;
            const settings = this.getSettings(startLine);
            if (!settings.length) {
                return false;
            }
            this.editPreferenceWidgetForMouseMove.show(startLine, '', settings);
            const actions = this.getActions(this.editPreferenceWidgetForMouseMove.preferences[0], this.getConfigurationsMap()[this.editPreferenceWidgetForMouseMove.preferences[0].key]);
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.toAbsoluteCoords(new position_1.Position(startLine, 1)),
                getActions: () => actions
            });
            return true;
        }
        toAbsoluteCoords(position) {
            const positionCoords = this.editor.getScrolledVisiblePosition(position);
            const editorCoords = dom_1.getDomNodePagePosition(this.editor.getDomNode());
            const x = editorCoords.left + positionCoords.left;
            const y = editorCoords.top + positionCoords.top + positionCoords.height;
            return { x, y: y + 10 };
        }
        getConfigurationsMap() {
            return platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        }
        getActions(setting, jsonSchema) {
            if (jsonSchema.type === 'boolean') {
                return [{
                        id: 'truthyValue',
                        label: 'true',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, true, setting)
                    }, {
                        id: 'falsyValue',
                        label: 'false',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, false, setting)
                    }];
            }
            if (jsonSchema.enum) {
                return jsonSchema.enum.map(value => {
                    return {
                        id: value,
                        label: JSON.stringify(value),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, value, setting)
                    };
                });
            }
            return this.getDefaultActions(setting);
        }
        getDefaultActions(setting) {
            if (this.isDefaultSettings()) {
                const settingInOtherModel = this.associatedPreferencesModel.getPreference(setting.key);
                return [{
                        id: 'setDefaultValue',
                        label: settingInOtherModel ? nls.localize('replaceDefaultValue', "Replace in Settings") : nls.localize('copyDefaultValue', "Copy to Settings"),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, setting.value, setting)
                    }];
            }
            return [];
        }
        updateSetting(key, value, source) {
            this._onUpdateSetting.fire({ key, value, source });
        }
    };
    EditSettingRenderer = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService)
    ], EditSettingRenderer);
    let SettingHighlighter = class SettingHighlighter extends lifecycle_1.Disposable {
        constructor(editor, focusEventEmitter, clearFocusEventEmitter, instantiationService) {
            super();
            this.editor = editor;
            this.focusEventEmitter = focusEventEmitter;
            this.clearFocusEventEmitter = clearFocusEventEmitter;
            this.fixedHighlighter = this._register(instantiationService.createInstance(rangeDecorations_1.RangeHighlightDecorations));
            this.volatileHighlighter = this._register(instantiationService.createInstance(rangeDecorations_1.RangeHighlightDecorations));
            this.fixedHighlighter.onHighlightRemoved(() => this.clearFocusEventEmitter.fire(this.highlightedSetting));
            this.volatileHighlighter.onHighlightRemoved(() => this.clearFocusEventEmitter.fire(this.highlightedSetting));
        }
        highlight(setting, fix = false) {
            this.highlightedSetting = setting;
            this.volatileHighlighter.removeHighlightRange();
            this.fixedHighlighter.removeHighlightRange();
            const highlighter = fix ? this.fixedHighlighter : this.volatileHighlighter;
            highlighter.highlightRange({
                range: setting.valueRange,
                resource: this.editor.getModel().uri
            }, this.editor);
            this.editor.revealLineInCenterIfOutsideViewport(setting.valueRange.startLineNumber, 0 /* Smooth */);
            this.focusEventEmitter.fire(setting);
        }
        clear(fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            if (fix) {
                this.fixedHighlighter.removeHighlightRange();
            }
            this.clearFocusEventEmitter.fire(this.highlightedSetting);
        }
    };
    SettingHighlighter = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], SettingHighlighter);
    let UnsupportedSettingsRenderer = class UnsupportedSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, settingsEditorModel, markerService, workbenchEnvironmentService, configurationService) {
            super();
            this.editor = editor;
            this.settingsEditorModel = settingsEditorModel;
            this.markerService = markerService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.configurationService = configurationService;
            this.renderingDelayer = new async_1.Delayer(200);
            this._register(this.editor.getModel().onDidChangeContent(() => this.delayedRender()));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.source === 6 /* DEFAULT */)(() => this.delayedRender()));
        }
        delayedRender() {
            this.renderingDelayer.trigger(() => this.render());
        }
        render() {
            const markerData = this.generateMarkerData();
            if (markerData.length) {
                this.markerService.changeOne('UnsupportedSettingsRenderer', this.settingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            }
        }
        generateMarkerData() {
            const markerData = [];
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const settingsGroup of this.settingsEditorModel.settingsGroups) {
                for (const section of settingsGroup.sections) {
                    for (const setting of section.settings) {
                        const configuration = configurationRegistry[setting.key];
                        if (configuration) {
                            switch (this.settingsEditorModel.configurationTarget) {
                                case 2 /* USER_LOCAL */:
                                    this.handleLocalUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 3 /* USER_REMOTE */:
                                    this.handleRemoteUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 4 /* WORKSPACE */:
                                    this.handleWorkspaceConfiguration(setting, configuration, markerData);
                                    break;
                                case 5 /* WORKSPACE_FOLDER */:
                                    this.handleWorkspaceFolderConfiguration(setting, configuration, markerData);
                                    break;
                            }
                        }
                        else if (!configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(setting.key)) { // Ignore override settings (language specific settings)
                            markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* Unnecessary */] }, setting.range), { message: nls.localize('unknown configuration setting', "Unknown Configuration Setting") }));
                        }
                    }
                }
            }
            return markerData;
        }
        handleLocalUserConfiguration(setting, configuration, markerData) {
            if (this.workbenchEnvironmentService.configuration.remoteAuthority && (configuration.scope === 2 /* MACHINE */ || configuration.scope === 6 /* MACHINE_OVERRIDABLE */)) {
                markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* Unnecessary */] }, setting.range), { message: nls.localize('unsupportedRemoteMachineSetting', "This setting cannot be applied in this window. It will be applied when you open local window.") }));
            }
        }
        handleRemoteUserConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
        }
        handleWorkspaceConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
        }
        handleWorkspaceFolderConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (configuration.scope === 3 /* WINDOW */) {
                markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* Unnecessary */] }, setting.range), { message: nls.localize('unsupportedWindowSetting', "This setting cannot be applied in this workspace. It will be applied when you open the containing workspace folder directly.") }));
            }
        }
        generateUnsupportedApplicationSettingMarker(setting) {
            return Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* Unnecessary */] }, setting.range), { message: nls.localize('unsupportedApplicationSetting', "This setting can be applied only in application user settings") });
        }
        generateUnsupportedMachineSettingMarker(setting) {
            return Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* Unnecessary */] }, setting.range), { message: nls.localize('unsupportedMachineSetting', "This setting can only be applied in user settings in local window or in remote settings in remote window.") });
        }
        dispose() {
            this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            super.dispose();
        }
    };
    UnsupportedSettingsRenderer = __decorate([
        __param(2, markers_1.IMarkerService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, configuration_1.IConfigurationService)
    ], UnsupportedSettingsRenderer);
    let WorkspaceConfigurationRenderer = class WorkspaceConfigurationRenderer extends lifecycle_1.Disposable {
        constructor(editor, workspaceSettingsEditorModel, workspaceContextService, markerService) {
            super();
            this.editor = editor;
            this.workspaceSettingsEditorModel = workspaceSettingsEditorModel;
            this.workspaceContextService = workspaceContextService;
            this.markerService = markerService;
            this.decorationIds = [];
            this.renderingDelayer = new async_1.Delayer(200);
            this._register(this.editor.getModel().onDidChangeContent(() => this.renderingDelayer.trigger(() => this.render(this.associatedSettingsEditorModel))));
        }
        render(associatedSettingsEditorModel) {
            this.associatedSettingsEditorModel = associatedSettingsEditorModel;
            const markerData = [];
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */ && this.workspaceSettingsEditorModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel) {
                const ranges = [];
                for (const settingsGroup of this.workspaceSettingsEditorModel.configurationGroups) {
                    for (const section of settingsGroup.sections) {
                        for (const setting of section.settings) {
                            if (setting.key === 'folders' || setting.key === 'tasks' || setting.key === 'launch' || setting.key === 'extensions') {
                                if (this.associatedSettingsEditorModel) {
                                    // Dim other configurations in workspace configuration file only in the context of Settings Editor
                                    ranges.push({
                                        startLineNumber: setting.keyRange.startLineNumber,
                                        startColumn: setting.keyRange.startColumn - 1,
                                        endLineNumber: setting.valueRange.endLineNumber,
                                        endColumn: setting.valueRange.endColumn
                                    });
                                }
                            }
                            else if (setting.key !== 'settings') {
                                markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* Unnecessary */] }, setting.range), { message: nls.localize('unsupportedProperty', "Unsupported Property") }));
                            }
                        }
                    }
                }
                this.decorationIds = this.editor.deltaDecorations(this.decorationIds, ranges.map(range => this.createDecoration(range)));
            }
            if (markerData.length) {
                this.markerService.changeOne('WorkspaceConfigurationRenderer', this.workspaceSettingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            }
        }
        createDecoration(range) {
            return {
                range,
                options: WorkspaceConfigurationRenderer._DIM_CONFIGURATION_
            };
        }
        dispose() {
            this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
            super.dispose();
        }
    };
    WorkspaceConfigurationRenderer._DIM_CONFIGURATION_ = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        inlineClassName: 'dim-configuration'
    });
    WorkspaceConfigurationRenderer = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, markers_1.IMarkerService)
    ], WorkspaceConfigurationRenderer);
});
//# __sourceMappingURL=preferencesRenderers.js.map