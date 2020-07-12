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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/objects", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/base/common/types", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/preferences/common/preferencesValidation"], function (require, exports, arrays_1, event_1, json_1, lifecycle_1, map, objects_1, range_1, selection_1, nls, configuration_1, configurationRegistry_1, keybinding_1, platform_1, editor_1, types_1, configuration_2, preferencesValidation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultKeybindingsEditorModel = exports.defaultKeybindingsContents = exports.DefaultRawSettingsEditorModel = exports.DefaultSettingsEditorModel = exports.DefaultSettings = exports.WorkspaceConfigurationEditorModel = exports.Settings2EditorModel = exports.SettingsEditorModel = exports.AbstractSettingsModel = exports.isNullRange = exports.nullRange = void 0;
    exports.nullRange = { startLineNumber: -1, startColumn: -1, endLineNumber: -1, endColumn: -1 };
    function isNullRange(range) { return range.startLineNumber === -1 && range.startColumn === -1 && range.endLineNumber === -1 && range.endColumn === -1; }
    exports.isNullRange = isNullRange;
    class AbstractSettingsModel extends editor_1.EditorModel {
        constructor() {
            super(...arguments);
            this._currentResultGroups = new Map();
        }
        updateResultGroup(id, resultGroup) {
            if (resultGroup) {
                this._currentResultGroups.set(id, resultGroup);
            }
            else {
                this._currentResultGroups.delete(id);
            }
            this.removeDuplicateResults();
            return this.update();
        }
        /**
         * Remove duplicates between result groups, preferring results in earlier groups
         */
        removeDuplicateResults() {
            const settingKeys = new Set();
            map.keys(this._currentResultGroups)
                .sort((a, b) => this._currentResultGroups.get(a).order - this._currentResultGroups.get(b).order)
                .forEach(groupId => {
                const group = this._currentResultGroups.get(groupId);
                group.result.filterMatches = group.result.filterMatches.filter(s => !settingKeys.has(s.setting.key));
                group.result.filterMatches.forEach(s => settingKeys.add(s.setting.key));
            });
        }
        filterSettings(filter, groupFilter, settingMatcher) {
            const allGroups = this.filterGroups;
            const filterMatches = [];
            for (const group of allGroups) {
                const groupMatched = groupFilter(group);
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        const settingMatchResult = settingMatcher(setting, group);
                        if (groupMatched || settingMatchResult) {
                            filterMatches.push({
                                setting,
                                matches: settingMatchResult && settingMatchResult.matches,
                                score: settingMatchResult ? settingMatchResult.score : 0
                            });
                        }
                    }
                }
            }
            return filterMatches.sort((a, b) => b.score - a.score);
        }
        getPreference(key) {
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (key === setting.key) {
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        collectMetadata(groups) {
            const metadata = Object.create(null);
            let hasMetadata = false;
            groups.forEach(g => {
                if (g.result.metadata) {
                    metadata[g.id] = g.result.metadata;
                    hasMetadata = true;
                }
            });
            return hasMetadata ? metadata : null;
        }
        get filterGroups() {
            return this.settingsGroups;
        }
    }
    exports.AbstractSettingsModel = AbstractSettingsModel;
    class SettingsEditorModel extends AbstractSettingsModel {
        constructor(reference, _configurationTarget) {
            super();
            this._configurationTarget = _configurationTarget;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this.settingsModel = reference.object.textEditorModel;
            this._register(this.onDispose(() => reference.dispose()));
            this._register(this.settingsModel.onDidChangeContent(() => {
                this._settingsGroups = undefined;
                this._onDidChangeGroups.fire();
            }));
        }
        get uri() {
            return this.settingsModel.uri;
        }
        get configurationTarget() {
            return this._configurationTarget;
        }
        get settingsGroups() {
            if (!this._settingsGroups) {
                this.parse();
            }
            return this._settingsGroups;
        }
        get content() {
            return this.settingsModel.getValue();
        }
        findValueMatches(filter, setting) {
            return this.settingsModel.findMatches(filter, setting.valueRange, false, false, null, false).map(match => match.range);
        }
        isSettingsProperty(property, previousParents) {
            return previousParents.length === 0; // Settings is root
        }
        parse() {
            this._settingsGroups = parse(this.settingsModel, (property, previousParents) => this.isSettingsProperty(property, previousParents));
        }
        update() {
            const resultGroups = map.values(this._currentResultGroups);
            if (!resultGroups.length) {
                return undefined;
            }
            // Transform resultGroups into IFilterResult - ISetting ranges are already correct here
            const filteredSettings = [];
            const matches = [];
            resultGroups.forEach(group => {
                group.result.filterMatches.forEach(filterMatch => {
                    filteredSettings.push(filterMatch.setting);
                    if (filterMatch.matches) {
                        matches.push(...filterMatch.matches);
                    }
                });
            });
            let filteredGroup;
            const modelGroup = this.settingsGroups[0]; // Editable model has one or zero groups
            if (modelGroup) {
                filteredGroup = {
                    id: modelGroup.id,
                    range: modelGroup.range,
                    sections: [{
                            settings: filteredSettings
                        }],
                    title: modelGroup.title,
                    titleRange: modelGroup.titleRange,
                    contributedByExtension: !!modelGroup.contributedByExtension
                };
            }
            const metadata = this.collectMetadata(resultGroups);
            return {
                allGroups: this.settingsGroups,
                filteredGroups: filteredGroup ? [filteredGroup] : [],
                matches,
                metadata
            };
        }
    }
    exports.SettingsEditorModel = SettingsEditorModel;
    let Settings2EditorModel = class Settings2EditorModel extends AbstractSettingsModel {
        constructor(_defaultSettings, configurationService) {
            super();
            this._defaultSettings = _defaultSettings;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this.dirty = false;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.source === 6 /* DEFAULT */) {
                    this.dirty = true;
                    this._onDidChangeGroups.fire();
                }
            }));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidSchemaChange(e => {
                this.dirty = true;
                this._onDidChangeGroups.fire();
            }));
        }
        get filterGroups() {
            // Don't filter "commonly used"
            return this.settingsGroups.slice(1);
        }
        get settingsGroups() {
            const groups = this._defaultSettings.getSettingsGroups(this.dirty);
            this.dirty = false;
            return groups;
        }
        findValueMatches(filter, setting) {
            // TODO @roblou
            return [];
        }
        update() {
            throw new Error('Not supported');
        }
    };
    Settings2EditorModel = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], Settings2EditorModel);
    exports.Settings2EditorModel = Settings2EditorModel;
    function parse(model, isSettingsProperty) {
        const settings = [];
        let overrideSetting = null;
        let currentProperty = null;
        let currentParent = [];
        const previousParents = [];
        let settingsPropertyIndex = -1;
        const range = {
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: 0,
            endColumn: 0
        };
        function onValue(value, offset, length) {
            if (Array.isArray(currentParent)) {
                currentParent.push(value);
            }
            else if (currentProperty) {
                currentParent[currentProperty] = value;
            }
            if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                // settings value started
                const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                if (setting) {
                    const valueStartPosition = model.getPositionAt(offset);
                    const valueEndPosition = model.getPositionAt(offset + length);
                    setting.value = value;
                    setting.valueRange = {
                        startLineNumber: valueStartPosition.lineNumber,
                        startColumn: valueStartPosition.column,
                        endLineNumber: valueEndPosition.lineNumber,
                        endColumn: valueEndPosition.column
                    };
                    setting.range = objects_1.assign(setting.range, {
                        endLineNumber: valueEndPosition.lineNumber,
                        endColumn: valueEndPosition.column
                    });
                }
            }
        }
        const visitor = {
            onObjectBegin: (offset, length) => {
                if (isSettingsProperty(currentProperty, previousParents)) {
                    // Settings started
                    settingsPropertyIndex = previousParents.length;
                    const position = model.getPositionAt(offset);
                    range.startLineNumber = position.lineNumber;
                    range.startColumn = position.column;
                }
                const object = {};
                onValue(object, offset, length);
                currentParent = object;
                currentProperty = null;
                previousParents.push(currentParent);
            },
            onObjectProperty: (name, offset, length) => {
                currentProperty = name;
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting started
                    const settingStartPosition = model.getPositionAt(offset);
                    const setting = {
                        description: [],
                        descriptionIsMarkdown: false,
                        key: name,
                        keyRange: {
                            startLineNumber: settingStartPosition.lineNumber,
                            startColumn: settingStartPosition.column + 1,
                            endLineNumber: settingStartPosition.lineNumber,
                            endColumn: settingStartPosition.column + length
                        },
                        range: {
                            startLineNumber: settingStartPosition.lineNumber,
                            startColumn: settingStartPosition.column,
                            endLineNumber: 0,
                            endColumn: 0
                        },
                        value: null,
                        valueRange: exports.nullRange,
                        descriptionRanges: [],
                        overrides: [],
                        overrideOf: types_1.withNullAsUndefined(overrideSetting)
                    };
                    if (previousParents.length === settingsPropertyIndex + 1) {
                        settings.push(setting);
                        if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(name)) {
                            overrideSetting = setting;
                        }
                    }
                    else {
                        overrideSetting.overrides.push(setting);
                    }
                }
            },
            onObjectEnd: (offset, length) => {
                currentParent = previousParents.pop();
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting ended
                    const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                    if (setting) {
                        const valueEndPosition = model.getPositionAt(offset + length);
                        setting.valueRange = objects_1.assign(setting.valueRange, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                        setting.range = objects_1.assign(setting.range, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                    }
                    if (previousParents.length === settingsPropertyIndex + 1) {
                        overrideSetting = null;
                    }
                }
                if (previousParents.length === settingsPropertyIndex) {
                    // settings ended
                    const position = model.getPositionAt(offset);
                    range.endLineNumber = position.lineNumber;
                    range.endColumn = position.column;
                    settingsPropertyIndex = -1;
                }
            },
            onArrayBegin: (offset, length) => {
                const array = [];
                onValue(array, offset, length);
                previousParents.push(currentParent);
                currentParent = array;
                currentProperty = null;
            },
            onArrayEnd: (offset, length) => {
                currentParent = previousParents.pop();
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting value ended
                    const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                    if (setting) {
                        const valueEndPosition = model.getPositionAt(offset + length);
                        setting.valueRange = objects_1.assign(setting.valueRange, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                        setting.range = objects_1.assign(setting.range, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                    }
                }
            },
            onLiteralValue: onValue,
            onError: (error) => {
                const setting = settings[settings.length - 1];
                if (setting && (isNullRange(setting.range) || isNullRange(setting.keyRange) || isNullRange(setting.valueRange))) {
                    settings.pop();
                }
            }
        };
        if (!model.isDisposed()) {
            json_1.visit(model.getValue(), visitor);
        }
        return settings.length > 0 ? [{
                sections: [
                    {
                        settings
                    }
                ],
                title: '',
                titleRange: exports.nullRange,
                range
            }] : [];
    }
    class WorkspaceConfigurationEditorModel extends SettingsEditorModel {
        constructor() {
            super(...arguments);
            this._configurationGroups = [];
        }
        get configurationGroups() {
            return this._configurationGroups;
        }
        parse() {
            super.parse();
            this._configurationGroups = parse(this.settingsModel, (property, previousParents) => previousParents.length === 0);
        }
        isSettingsProperty(property, previousParents) {
            return property === 'settings' && previousParents.length === 1;
        }
    }
    exports.WorkspaceConfigurationEditorModel = WorkspaceConfigurationEditorModel;
    class DefaultSettings extends lifecycle_1.Disposable {
        constructor(_mostCommonlyUsedSettingsKeys, target) {
            super();
            this._mostCommonlyUsedSettingsKeys = _mostCommonlyUsedSettingsKeys;
            this.target = target;
            this._settingsByName = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        getContent(forceUpdate = false) {
            if (!this._content || forceUpdate) {
                this.initialize();
            }
            return this._content;
        }
        getSettingsGroups(forceUpdate = false) {
            if (!this._allSettingsGroups || forceUpdate) {
                this.initialize();
            }
            return this._allSettingsGroups;
        }
        initialize() {
            this._allSettingsGroups = this.parse();
            this._content = this.toContent(this._allSettingsGroups);
        }
        parse() {
            const settingsGroups = this.getRegisteredGroups();
            this.initAllSettingsMap(settingsGroups);
            const mostCommonlyUsed = this.getMostCommonlyUsedSettings(settingsGroups);
            return [mostCommonlyUsed, ...settingsGroups];
        }
        getRegisteredGroups() {
            const configurations = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurations().slice();
            const groups = this.removeEmptySettingsGroups(configurations.sort(this.compareConfigurationNodes)
                .reduce((result, config, index, array) => this.parseConfig(config, result, array), []));
            return this.sortGroups(groups);
        }
        sortGroups(groups) {
            groups.forEach(group => {
                group.sections.forEach(section => {
                    section.settings.sort((a, b) => a.key.localeCompare(b.key));
                });
            });
            return groups;
        }
        initAllSettingsMap(allSettingsGroups) {
            this._settingsByName = new Map();
            for (const group of allSettingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        this._settingsByName.set(setting.key, setting);
                    }
                }
            }
        }
        getMostCommonlyUsedSettings(allSettingsGroups) {
            const settings = arrays_1.coalesce(this._mostCommonlyUsedSettingsKeys.map(key => {
                const setting = this._settingsByName.get(key);
                if (setting) {
                    return {
                        description: setting.description,
                        key: setting.key,
                        value: setting.value,
                        keyRange: exports.nullRange,
                        range: exports.nullRange,
                        valueRange: exports.nullRange,
                        overrides: [],
                        scope: 4 /* RESOURCE */,
                        type: setting.type,
                        enum: setting.enum,
                        enumDescriptions: setting.enumDescriptions,
                        descriptionRanges: []
                    };
                }
                return null;
            }));
            return {
                id: 'mostCommonlyUsed',
                range: exports.nullRange,
                title: nls.localize('commonlyUsed', "Commonly Used"),
                titleRange: exports.nullRange,
                sections: [
                    {
                        settings
                    }
                ]
            };
        }
        parseConfig(config, result, configurations, settingsGroup, seenSettings) {
            seenSettings = seenSettings ? seenSettings : {};
            let title = config.title;
            if (!title) {
                const configWithTitleAndSameId = arrays_1.find(configurations, c => (c.id === config.id) && c.title);
                if (configWithTitleAndSameId) {
                    title = configWithTitleAndSameId.title;
                }
            }
            if (title) {
                if (!settingsGroup) {
                    settingsGroup = arrays_1.find(result, g => g.title === title);
                    if (!settingsGroup) {
                        settingsGroup = { sections: [{ settings: [] }], id: config.id || '', title: title || '', titleRange: exports.nullRange, range: exports.nullRange, contributedByExtension: !!config.extensionInfo };
                        result.push(settingsGroup);
                    }
                }
                else {
                    settingsGroup.sections[settingsGroup.sections.length - 1].title = title;
                }
            }
            if (config.properties) {
                if (!settingsGroup) {
                    settingsGroup = { sections: [{ settings: [] }], id: config.id || '', title: config.id || '', titleRange: exports.nullRange, range: exports.nullRange, contributedByExtension: !!config.extensionInfo };
                    result.push(settingsGroup);
                }
                const configurationSettings = [];
                for (const setting of [...settingsGroup.sections[settingsGroup.sections.length - 1].settings, ...this.parseSettings(config.properties, config.extensionInfo)]) {
                    if (!seenSettings[setting.key]) {
                        configurationSettings.push(setting);
                        seenSettings[setting.key] = true;
                    }
                }
                if (configurationSettings.length) {
                    settingsGroup.sections[settingsGroup.sections.length - 1].settings = configurationSettings;
                }
            }
            if (config.allOf) {
                config.allOf.forEach(c => this.parseConfig(c, result, configurations, settingsGroup, seenSettings));
            }
            return result;
        }
        removeEmptySettingsGroups(settingsGroups) {
            const result = [];
            for (const settingsGroup of settingsGroups) {
                settingsGroup.sections = settingsGroup.sections.filter(section => section.settings.length > 0);
                if (settingsGroup.sections.length) {
                    result.push(settingsGroup);
                }
            }
            return result;
        }
        parseSettings(settingsObject, extensionInfo) {
            const result = [];
            for (const key in settingsObject) {
                const prop = settingsObject[key];
                if (this.matchesScope(prop)) {
                    const value = prop.default;
                    const description = (prop.description || prop.markdownDescription || '').split('\n');
                    const overrides = configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key) ? this.parseOverrideSettings(prop.default) : [];
                    const listItemType = prop.type === 'array' && prop.items && !types_1.isArray(prop.items) && prop.items.type && !types_1.isArray(prop.items.type)
                        ? prop.items.type
                        : undefined;
                    const objectProperties = prop.type === 'object' ? prop.properties : undefined;
                    const objectPatternProperties = prop.type === 'object' ? prop.patternProperties : undefined;
                    const objectAdditionalProperties = prop.type === 'object' ? prop.additionalProperties : undefined;
                    result.push({
                        key,
                        value,
                        description,
                        descriptionIsMarkdown: !prop.description,
                        range: exports.nullRange,
                        keyRange: exports.nullRange,
                        valueRange: exports.nullRange,
                        descriptionRanges: [],
                        overrides,
                        scope: prop.scope,
                        type: prop.type,
                        arrayItemType: listItemType,
                        objectProperties,
                        objectPatternProperties,
                        objectAdditionalProperties,
                        enum: prop.enum,
                        enumDescriptions: prop.enumDescriptions || prop.markdownEnumDescriptions,
                        enumDescriptionsAreMarkdown: !prop.enumDescriptions,
                        tags: prop.tags,
                        disallowSyncIgnore: prop.disallowSyncIgnore,
                        extensionInfo: extensionInfo,
                        deprecationMessage: prop.markdownDeprecationMessage || prop.deprecationMessage,
                        deprecationMessageIsMarkdown: !!prop.markdownDeprecationMessage,
                        validator: preferencesValidation_1.createValidator(prop)
                    });
                }
            }
            return result;
        }
        parseOverrideSettings(overrideSettings) {
            return Object.keys(overrideSettings).map((key) => ({
                key,
                value: overrideSettings[key],
                description: [],
                descriptionIsMarkdown: false,
                range: exports.nullRange,
                keyRange: exports.nullRange,
                valueRange: exports.nullRange,
                descriptionRanges: [],
                overrides: []
            }));
        }
        matchesScope(property) {
            if (!property.scope) {
                return true;
            }
            if (this.target === 5 /* WORKSPACE_FOLDER */) {
                return configuration_2.FOLDER_SCOPES.indexOf(property.scope) !== -1;
            }
            if (this.target === 4 /* WORKSPACE */) {
                return configuration_2.WORKSPACE_SCOPES.indexOf(property.scope) !== -1;
            }
            return true;
        }
        compareConfigurationNodes(c1, c2) {
            if (typeof c1.order !== 'number') {
                return 1;
            }
            if (typeof c2.order !== 'number') {
                return -1;
            }
            if (c1.order === c2.order) {
                const title1 = c1.title || '';
                const title2 = c2.title || '';
                return title1.localeCompare(title2);
            }
            return c1.order - c2.order;
        }
        toContent(settingsGroups) {
            const builder = new SettingsContentBuilder();
            builder.pushLine('[');
            settingsGroups.forEach((settingsGroup, i) => {
                builder.pushGroup(settingsGroup);
                builder.pushLine(',');
            });
            builder.pushLine(']');
            return builder.getContent();
        }
    }
    exports.DefaultSettings = DefaultSettings;
    class DefaultSettingsEditorModel extends AbstractSettingsModel {
        constructor(_uri, reference, defaultSettings) {
            super();
            this._uri = _uri;
            this.defaultSettings = defaultSettings;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this._register(defaultSettings.onDidChange(() => this._onDidChangeGroups.fire()));
            this._model = reference.object.textEditorModel;
            this._register(this.onDispose(() => reference.dispose()));
        }
        get uri() {
            return this._uri;
        }
        get target() {
            return this.defaultSettings.target;
        }
        get settingsGroups() {
            return this.defaultSettings.getSettingsGroups();
        }
        get filterGroups() {
            // Don't look at "commonly used" for filter
            return this.settingsGroups.slice(1);
        }
        update() {
            if (this._model.isDisposed()) {
                return undefined;
            }
            // Grab current result groups, only render non-empty groups
            const resultGroups = map
                .values(this._currentResultGroups)
                .sort((a, b) => a.order - b.order);
            const nonEmptyResultGroups = resultGroups.filter(group => group.result.filterMatches.length);
            const startLine = arrays_1.tail(this.settingsGroups).range.endLineNumber + 2;
            const { settingsGroups: filteredGroups, matches } = this.writeResultGroups(nonEmptyResultGroups, startLine);
            const metadata = this.collectMetadata(resultGroups);
            return resultGroups.length ?
                {
                    allGroups: this.settingsGroups,
                    filteredGroups,
                    matches,
                    metadata
                } :
                undefined;
        }
        /**
         * Translate the ISearchResultGroups to text, and write it to the editor model
         */
        writeResultGroups(groups, startLine) {
            const contentBuilderOffset = startLine - 1;
            const builder = new SettingsContentBuilder(contentBuilderOffset);
            const settingsGroups = [];
            const matches = [];
            builder.pushLine(',');
            groups.forEach(resultGroup => {
                const settingsGroup = this.getGroup(resultGroup);
                settingsGroups.push(settingsGroup);
                matches.push(...this.writeSettingsGroupToBuilder(builder, settingsGroup, resultGroup.result.filterMatches));
            });
            // note: 1-indexed line numbers here
            const groupContent = builder.getContent() + '\n';
            const groupEndLine = this._model.getLineCount();
            const cursorPosition = new selection_1.Selection(startLine, 1, startLine, 1);
            const edit = {
                text: groupContent,
                forceMoveMarkers: true,
                range: new range_1.Range(startLine, 1, groupEndLine, 1),
                identifier: { major: 1, minor: 0 }
            };
            this._model.pushEditOperations([cursorPosition], [edit], () => [cursorPosition]);
            // Force tokenization now - otherwise it may be slightly delayed, causing a flash of white text
            const tokenizeTo = Math.min(startLine + 60, this._model.getLineCount());
            this._model.forceTokenization(tokenizeTo);
            return { matches, settingsGroups };
        }
        writeSettingsGroupToBuilder(builder, settingsGroup, filterMatches) {
            filterMatches = filterMatches
                .map(filteredMatch => {
                // Fix match ranges to offset from setting start line
                return {
                    setting: filteredMatch.setting,
                    score: filteredMatch.score,
                    matches: filteredMatch.matches && filteredMatch.matches.map(match => {
                        return new range_1.Range(match.startLineNumber - filteredMatch.setting.range.startLineNumber, match.startColumn, match.endLineNumber - filteredMatch.setting.range.startLineNumber, match.endColumn);
                    })
                };
            });
            builder.pushGroup(settingsGroup);
            builder.pushLine(',');
            // builder has rewritten settings ranges, fix match ranges
            const fixedMatches = arrays_1.flatten(filterMatches
                .map(m => m.matches || [])
                .map((settingMatches, i) => {
                const setting = settingsGroup.sections[0].settings[i];
                return settingMatches.map(range => {
                    return new range_1.Range(range.startLineNumber + setting.range.startLineNumber, range.startColumn, range.endLineNumber + setting.range.startLineNumber, range.endColumn);
                });
            }));
            return fixedMatches;
        }
        copySetting(setting) {
            return {
                description: setting.description,
                scope: setting.scope,
                type: setting.type,
                enum: setting.enum,
                enumDescriptions: setting.enumDescriptions,
                key: setting.key,
                value: setting.value,
                range: setting.range,
                overrides: [],
                overrideOf: setting.overrideOf,
                tags: setting.tags,
                deprecationMessage: setting.deprecationMessage,
                keyRange: exports.nullRange,
                valueRange: exports.nullRange,
                descriptionIsMarkdown: undefined,
                descriptionRanges: []
            };
        }
        findValueMatches(filter, setting) {
            return [];
        }
        getPreference(key) {
            for (const group of this.settingsGroups) {
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
        getGroup(resultGroup) {
            return {
                id: resultGroup.id,
                range: exports.nullRange,
                title: resultGroup.label,
                titleRange: exports.nullRange,
                sections: [
                    {
                        settings: resultGroup.result.filterMatches.map(m => this.copySetting(m.setting))
                    }
                ]
            };
        }
    }
    exports.DefaultSettingsEditorModel = DefaultSettingsEditorModel;
    class SettingsContentBuilder {
        constructor(_rangeOffset = 0) {
            this._rangeOffset = _rangeOffset;
            this._contentByLines = [];
        }
        get lineCountWithOffset() {
            return this._contentByLines.length + this._rangeOffset;
        }
        get lastLine() {
            return this._contentByLines[this._contentByLines.length - 1] || '';
        }
        pushLine(...lineText) {
            this._contentByLines.push(...lineText);
        }
        pushGroup(settingsGroups) {
            this._contentByLines.push('{');
            this._contentByLines.push('');
            this._contentByLines.push('');
            const lastSetting = this._pushGroup(settingsGroups, '  ');
            if (lastSetting) {
                // Strip the comma from the last setting
                const lineIdx = lastSetting.range.endLineNumber - this._rangeOffset;
                const content = this._contentByLines[lineIdx - 2];
                this._contentByLines[lineIdx - 2] = content.substring(0, content.length - 1);
            }
            this._contentByLines.push('}');
        }
        _pushGroup(group, indent) {
            let lastSetting = null;
            const groupStart = this.lineCountWithOffset + 1;
            for (const section of group.sections) {
                if (section.title) {
                    const sectionTitleStart = this.lineCountWithOffset + 1;
                    this.addDescription([section.title], indent, this._contentByLines);
                    section.titleRange = { startLineNumber: sectionTitleStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
                }
                if (section.settings.length) {
                    for (const setting of section.settings) {
                        this.pushSetting(setting, indent);
                        lastSetting = setting;
                    }
                }
            }
            group.range = { startLineNumber: groupStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
            return lastSetting;
        }
        getContent() {
            return this._contentByLines.join('\n');
        }
        pushSetting(setting, indent) {
            const settingStart = this.lineCountWithOffset + 1;
            this.pushSettingDescription(setting, indent);
            let preValueContent = indent;
            const keyString = JSON.stringify(setting.key);
            preValueContent += keyString;
            setting.keyRange = { startLineNumber: this.lineCountWithOffset + 1, startColumn: preValueContent.indexOf(setting.key) + 1, endLineNumber: this.lineCountWithOffset + 1, endColumn: setting.key.length };
            preValueContent += ': ';
            const valueStart = this.lineCountWithOffset + 1;
            this.pushValue(setting, preValueContent, indent);
            setting.valueRange = { startLineNumber: valueStart, startColumn: preValueContent.length + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length + 1 };
            this._contentByLines[this._contentByLines.length - 1] += ',';
            this._contentByLines.push('');
            setting.range = { startLineNumber: settingStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
        }
        pushSettingDescription(setting, indent) {
            const fixSettingLink = (line) => line.replace(/`#(.*)#`/g, (match, settingName) => `\`${settingName}\``);
            setting.descriptionRanges = [];
            const descriptionPreValue = indent + '// ';
            for (let line of (setting.deprecationMessage ? [setting.deprecationMessage, ...setting.description] : setting.description)) {
                line = fixSettingLink(line);
                this._contentByLines.push(descriptionPreValue + line);
                setting.descriptionRanges.push({ startLineNumber: this.lineCountWithOffset, startColumn: this.lastLine.indexOf(line) + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length });
            }
            if (setting.enumDescriptions && setting.enumDescriptions.some(desc => !!desc)) {
                setting.enumDescriptions.forEach((desc, i) => {
                    const displayEnum = escapeInvisibleChars(String(setting.enum[i]));
                    const line = desc ?
                        `${displayEnum}: ${fixSettingLink(desc)}` :
                        displayEnum;
                    this._contentByLines.push(`${indent}//  - ${line}`);
                    setting.descriptionRanges.push({ startLineNumber: this.lineCountWithOffset, startColumn: this.lastLine.indexOf(line) + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length });
                });
            }
        }
        pushValue(setting, preValueConent, indent) {
            const valueString = JSON.stringify(setting.value, null, indent);
            if (valueString && (typeof setting.value === 'object')) {
                if (setting.overrides && setting.overrides.length) {
                    this._contentByLines.push(preValueConent + ' {');
                    for (const subSetting of setting.overrides) {
                        this.pushSetting(subSetting, indent + indent);
                        this._contentByLines.pop();
                    }
                    const lastSetting = setting.overrides[setting.overrides.length - 1];
                    const content = this._contentByLines[lastSetting.range.endLineNumber - 2];
                    this._contentByLines[lastSetting.range.endLineNumber - 2] = content.substring(0, content.length - 1);
                    this._contentByLines.push(indent + '}');
                }
                else {
                    const mulitLineValue = valueString.split('\n');
                    this._contentByLines.push(preValueConent + mulitLineValue[0]);
                    for (let i = 1; i < mulitLineValue.length; i++) {
                        this._contentByLines.push(indent + mulitLineValue[i]);
                    }
                }
            }
            else {
                this._contentByLines.push(preValueConent + valueString);
            }
        }
        addDescription(description, indent, result) {
            for (const line of description) {
                result.push(indent + '// ' + line);
            }
        }
    }
    class RawSettingsContentBuilder extends SettingsContentBuilder {
        constructor(indent = '\t') {
            super(0);
            this.indent = indent;
        }
        pushGroup(settingsGroups) {
            this._pushGroup(settingsGroups, this.indent);
        }
    }
    class DefaultRawSettingsEditorModel extends lifecycle_1.Disposable {
        constructor(defaultSettings) {
            super();
            this.defaultSettings = defaultSettings;
            this._content = null;
            this._register(defaultSettings.onDidChange(() => this._content = null));
        }
        get content() {
            if (this._content === null) {
                const builder = new RawSettingsContentBuilder();
                builder.pushLine('{');
                for (const settingsGroup of this.defaultSettings.getRegisteredGroups()) {
                    builder.pushGroup(settingsGroup);
                }
                builder.pushLine('}');
                this._content = builder.getContent();
            }
            return this._content;
        }
    }
    exports.DefaultRawSettingsEditorModel = DefaultRawSettingsEditorModel;
    function escapeInvisibleChars(enumValue) {
        return enumValue && enumValue
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    function defaultKeybindingsContents(keybindingService) {
        const defaultsHeader = '// ' + nls.localize('defaultKeybindingsHeader', "Override key bindings by placing them into your key bindings file.");
        return defaultsHeader + '\n' + keybindingService.getDefaultKeybindingsContent();
    }
    exports.defaultKeybindingsContents = defaultKeybindingsContents;
    let DefaultKeybindingsEditorModel = class DefaultKeybindingsEditorModel {
        constructor(_uri, keybindingService) {
            this._uri = _uri;
            this.keybindingService = keybindingService;
        }
        get uri() {
            return this._uri;
        }
        get content() {
            if (!this._content) {
                this._content = defaultKeybindingsContents(this.keybindingService);
            }
            return this._content;
        }
        getPreference() {
            return null;
        }
        dispose() {
            // Not disposable
        }
    };
    DefaultKeybindingsEditorModel = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], DefaultKeybindingsEditorModel);
    exports.DefaultKeybindingsEditorModel = DefaultKeybindingsEditorModel;
});
//# __sourceMappingURL=preferencesModels.js.map