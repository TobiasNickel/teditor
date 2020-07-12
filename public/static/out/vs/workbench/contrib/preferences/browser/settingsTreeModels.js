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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/preferences/browser/settingsLayout", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/configuration/common/configuration"], function (require, exports, arrays, strings_1, types_1, uri_1, nls_1, configuration_1, settingsLayout_1, preferences_1, preferences_2, environmentService_1, configuration_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseQuery = exports.SearchResultModel = exports.SearchResultIdx = exports.isExcludeSetting = exports.settingKeyToDisplayFormat = exports.SettingsTreeModel = exports.SettingsTreeSettingElement = exports.SettingsTreeNewExtensionsElement = exports.SettingsTreeGroupElement = exports.SettingsTreeElement = exports.ONLINE_SERVICES_SETTING_TAG = void 0;
    exports.ONLINE_SERVICES_SETTING_TAG = 'usesOnlineServices';
    class SettingsTreeElement {
        constructor(_id, _index) {
            this.id = _id;
            this.index = _index;
        }
    }
    exports.SettingsTreeElement = SettingsTreeElement;
    class SettingsTreeGroupElement extends SettingsTreeElement {
        constructor(_id, _index, count, label, level, isFirstGroup) {
            super(_id, _index);
            this._childSettingKeys = new Set();
            this._children = [];
            this.count = count;
            this.label = label;
            this.level = level;
            this.isFirstGroup = isFirstGroup;
        }
        get children() {
            return this._children;
        }
        set children(newChildren) {
            this._children = newChildren;
            this._childSettingKeys = new Set();
            this._children.forEach(child => {
                if (child instanceof SettingsTreeSettingElement) {
                    this._childSettingKeys.add(child.setting.key);
                }
            });
        }
        /**
         * Returns whether this group contains the given child key (to a depth of 1 only)
         */
        containsSetting(key) {
            return this._childSettingKeys.has(key);
        }
    }
    exports.SettingsTreeGroupElement = SettingsTreeGroupElement;
    class SettingsTreeNewExtensionsElement extends SettingsTreeElement {
        constructor(_id, _index, extensionIds) {
            super(_id, _index);
            this.extensionIds = extensionIds;
        }
    }
    exports.SettingsTreeNewExtensionsElement = SettingsTreeNewExtensionsElement;
    class SettingsTreeSettingElement extends SettingsTreeElement {
        constructor(setting, parent, index, inspectResult) {
            super(sanitizeId(parent.id + '_' + setting.key), index);
            this._displayCategory = null;
            this._displayLabel = null;
            /**
             * Whether the setting is configured in the selected scope.
             */
            this.isConfigured = false;
            this.overriddenScopeList = [];
            this.setting = setting;
            this.parent = parent;
            this.update(inspectResult);
        }
        get displayCategory() {
            if (!this._displayCategory) {
                this.initLabel();
            }
            return this._displayCategory;
        }
        get displayLabel() {
            if (!this._displayLabel) {
                this.initLabel();
            }
            return this._displayLabel;
        }
        initLabel() {
            const displayKeyFormat = settingKeyToDisplayFormat(this.setting.key, this.parent.id);
            this._displayLabel = displayKeyFormat.label;
            this._displayCategory = displayKeyFormat.category;
        }
        update(inspectResult) {
            const { isConfigured, inspected, targetSelector } = inspectResult;
            const displayValue = isConfigured ? inspected[targetSelector] : inspected.defaultValue;
            const overriddenScopeList = [];
            if (targetSelector !== 'workspaceValue' && typeof inspected.workspaceValue !== 'undefined') {
                overriddenScopeList.push(nls_1.localize('workspace', "Workspace"));
            }
            if (targetSelector !== 'userRemoteValue' && typeof inspected.userRemoteValue !== 'undefined') {
                overriddenScopeList.push(nls_1.localize('remote', "Remote"));
            }
            if (targetSelector !== 'userLocalValue' && typeof inspected.userLocalValue !== 'undefined') {
                overriddenScopeList.push(nls_1.localize('user', "User"));
            }
            this.value = displayValue;
            this.scopeValue = isConfigured && inspected[targetSelector];
            this.defaultValue = inspected.defaultValue;
            this.isConfigured = isConfigured;
            if (isConfigured || this.setting.tags || this.tags) {
                // Don't create an empty Set for all 1000 settings, only if needed
                this.tags = new Set();
                if (isConfigured) {
                    this.tags.add(preferences_1.MODIFIED_SETTING_TAG);
                }
                if (this.setting.tags) {
                    this.setting.tags.forEach(tag => this.tags.add(tag));
                }
            }
            this.overriddenScopeList = overriddenScopeList;
            if (this.setting.description.length > SettingsTreeSettingElement.MAX_DESC_LINES) {
                const truncatedDescLines = this.setting.description.slice(0, SettingsTreeSettingElement.MAX_DESC_LINES);
                truncatedDescLines.push('[...]');
                this.description = truncatedDescLines.join('\n');
            }
            else {
                this.description = this.setting.description.join('\n');
            }
            if (this.setting.enum && (!this.setting.type || settingTypeEnumRenderable(this.setting.type))) {
                this.valueType = preferences_2.SettingValueType.Enum;
            }
            else if (this.setting.type === 'string') {
                this.valueType = preferences_2.SettingValueType.String;
            }
            else if (isExcludeSetting(this.setting)) {
                this.valueType = preferences_2.SettingValueType.Exclude;
            }
            else if (this.setting.type === 'integer') {
                this.valueType = preferences_2.SettingValueType.Integer;
            }
            else if (this.setting.type === 'number') {
                this.valueType = preferences_2.SettingValueType.Number;
            }
            else if (this.setting.type === 'boolean') {
                this.valueType = preferences_2.SettingValueType.Boolean;
            }
            else if (this.setting.type === 'array' && this.setting.arrayItemType === 'string') {
                this.valueType = preferences_2.SettingValueType.ArrayOfString;
            }
            else if (types_1.isArray(this.setting.type) && this.setting.type.indexOf(preferences_2.SettingValueType.Null) > -1 && this.setting.type.length === 2) {
                if (this.setting.type.indexOf(preferences_2.SettingValueType.Integer) > -1) {
                    this.valueType = preferences_2.SettingValueType.NullableInteger;
                }
                else if (this.setting.type.indexOf(preferences_2.SettingValueType.Number) > -1) {
                    this.valueType = preferences_2.SettingValueType.NullableNumber;
                }
                else {
                    this.valueType = preferences_2.SettingValueType.Complex;
                }
            }
            else if (isObjectSetting(this.setting)) {
                this.valueType = preferences_2.SettingValueType.Object;
            }
            else {
                this.valueType = preferences_2.SettingValueType.Complex;
            }
        }
        matchesAllTags(tagFilters) {
            if (!tagFilters || !tagFilters.size) {
                return true;
            }
            if (this.tags) {
                let hasFilteredTag = true;
                tagFilters.forEach(tag => {
                    hasFilteredTag = hasFilteredTag && this.tags.has(tag);
                });
                return hasFilteredTag;
            }
            else {
                return false;
            }
        }
        matchesScope(scope, isRemote) {
            const configTarget = uri_1.URI.isUri(scope) ? 5 /* WORKSPACE_FOLDER */ : scope;
            if (!this.setting.scope) {
                return true;
            }
            if (configTarget === 5 /* WORKSPACE_FOLDER */) {
                return configuration_2.FOLDER_SCOPES.indexOf(this.setting.scope) !== -1;
            }
            if (configTarget === 4 /* WORKSPACE */) {
                return configuration_2.WORKSPACE_SCOPES.indexOf(this.setting.scope) !== -1;
            }
            if (configTarget === 3 /* USER_REMOTE */) {
                return configuration_2.REMOTE_MACHINE_SCOPES.indexOf(this.setting.scope) !== -1;
            }
            if (configTarget === 2 /* USER_LOCAL */ && isRemote) {
                return configuration_2.LOCAL_MACHINE_SCOPES.indexOf(this.setting.scope) !== -1;
            }
            return true;
        }
        matchesAnyExtension(extensionFilters) {
            if (!extensionFilters || !extensionFilters.size) {
                return true;
            }
            if (!this.setting.extensionInfo) {
                return false;
            }
            return Array.from(extensionFilters).some(extensionId => extensionId.toLowerCase() === this.setting.extensionInfo.id.toLowerCase());
        }
    }
    exports.SettingsTreeSettingElement = SettingsTreeSettingElement;
    SettingsTreeSettingElement.MAX_DESC_LINES = 20;
    let SettingsTreeModel = class SettingsTreeModel {
        constructor(_viewState, _configurationService) {
            this._viewState = _viewState;
            this._configurationService = _configurationService;
            this._treeElementsById = new Map();
            this._treeElementsBySettingName = new Map();
        }
        get root() {
            return this._root;
        }
        update(newTocRoot = this._tocRoot) {
            this._treeElementsById.clear();
            this._treeElementsBySettingName.clear();
            const newRoot = this.createSettingsTreeGroupElement(newTocRoot);
            if (newRoot.children[0] instanceof SettingsTreeGroupElement) {
                newRoot.children[0].isFirstGroup = true; // TODO
            }
            if (this._root) {
                this._root.children = newRoot.children;
            }
            else {
                this._root = newRoot;
            }
        }
        getElementById(id) {
            return types_1.withUndefinedAsNull(this._treeElementsById.get(id));
        }
        getElementsByName(name) {
            return types_1.withUndefinedAsNull(this._treeElementsBySettingName.get(name));
        }
        updateElementsByName(name) {
            if (!this._treeElementsBySettingName.has(name)) {
                return;
            }
            this._treeElementsBySettingName.get(name).forEach(element => {
                const inspectResult = inspectSetting(element.setting.key, this._viewState.settingsTarget, this._configurationService);
                element.update(inspectResult);
            });
        }
        createSettingsTreeGroupElement(tocEntry, parent) {
            const index = this._treeElementsById.size;
            const depth = parent ? this.getDepth(parent) + 1 : 0;
            const element = new SettingsTreeGroupElement(tocEntry.id, index, undefined, tocEntry.label, depth, false);
            const children = [];
            if (tocEntry.settings) {
                const settingChildren = tocEntry.settings.map(s => this.createSettingsTreeSettingElement(s, element))
                    .filter(el => el.setting.deprecationMessage ? el.isConfigured : true);
                children.push(...settingChildren);
            }
            if (tocEntry.children) {
                const groupChildren = tocEntry.children.map(child => this.createSettingsTreeGroupElement(child, element));
                children.push(...groupChildren);
            }
            element.children = children;
            this._treeElementsById.set(element.id, element);
            return element;
        }
        getDepth(element) {
            if (element.parent) {
                return 1 + this.getDepth(element.parent);
            }
            else {
                return 0;
            }
        }
        createSettingsTreeSettingElement(setting, parent) {
            const index = this._treeElementsById.size;
            const inspectResult = inspectSetting(setting.key, this._viewState.settingsTarget, this._configurationService);
            const element = new SettingsTreeSettingElement(setting, parent, index, inspectResult);
            this._treeElementsById.set(element.id, element);
            const nameElements = this._treeElementsBySettingName.get(setting.key) || [];
            nameElements.push(element);
            this._treeElementsBySettingName.set(setting.key, nameElements);
            return element;
        }
    };
    SettingsTreeModel = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], SettingsTreeModel);
    exports.SettingsTreeModel = SettingsTreeModel;
    function inspectSetting(key, target, configurationService) {
        const inspectOverrides = uri_1.URI.isUri(target) ? { resource: target } : undefined;
        const inspected = configurationService.inspect(key, inspectOverrides);
        const targetSelector = target === 2 /* USER_LOCAL */ ? 'userLocalValue' :
            target === 3 /* USER_REMOTE */ ? 'userRemoteValue' :
                target === 4 /* WORKSPACE */ ? 'workspaceValue' :
                    'workspaceFolderValue';
        const isConfigured = typeof inspected[targetSelector] !== 'undefined';
        return { isConfigured, inspected, targetSelector };
    }
    function sanitizeId(id) {
        return id.replace(/[\.\/]/, '_');
    }
    function settingKeyToDisplayFormat(key, groupId = '') {
        const lastDotIdx = key.lastIndexOf('.');
        let category = '';
        if (lastDotIdx >= 0) {
            category = key.substr(0, lastDotIdx);
            key = key.substr(lastDotIdx + 1);
        }
        groupId = groupId.replace(/\//g, '.');
        category = trimCategoryForGroup(category, groupId);
        category = wordifyKey(category);
        const label = wordifyKey(key);
        return { category, label };
    }
    exports.settingKeyToDisplayFormat = settingKeyToDisplayFormat;
    function wordifyKey(key) {
        key = key
            .replace(/\.([a-z0-9])/g, (_, p1) => ` › ${p1.toUpperCase()}`) // Replace dot with spaced '>'
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Camel case to spacing, fooBar => foo Bar
            .replace(/^[a-z]/g, match => match.toUpperCase()) // Upper casing all first letters, foo => Foo
            .replace(/\b\w+\b/g, match => {
            return settingsLayout_1.knownAcronyms.has(match.toLowerCase()) ?
                match.toUpperCase() :
                match;
        });
        for (let [k, v] of settingsLayout_1.knownTermMappings) {
            key = key.replace(new RegExp(`\\b${k}\\b`, 'gi'), v);
        }
        return key;
    }
    function trimCategoryForGroup(category, groupId) {
        const doTrim = (forward) => {
            const parts = groupId.split('.');
            while (parts.length) {
                const reg = new RegExp(`^${parts.join('\\.')}(\\.|$)`, 'i');
                if (reg.test(category)) {
                    return category.replace(reg, '');
                }
                if (forward) {
                    parts.pop();
                }
                else {
                    parts.shift();
                }
            }
            return null;
        };
        let trimmed = doTrim(true);
        if (trimmed === null) {
            trimmed = doTrim(false);
        }
        if (trimmed === null) {
            trimmed = category;
        }
        return trimmed;
    }
    function isExcludeSetting(setting) {
        return setting.key === 'files.exclude' ||
            setting.key === 'search.exclude' ||
            setting.key === 'files.watcherExclude';
    }
    exports.isExcludeSetting = isExcludeSetting;
    function isObjectRenderableSchema({ type }) {
        return type === 'string';
    }
    function isObjectSetting({ type, objectProperties, objectPatternProperties, objectAdditionalProperties }) {
        if (type !== 'object') {
            return false;
        }
        // object can have any shape
        if (types_1.isUndefinedOrNull(objectProperties) &&
            types_1.isUndefinedOrNull(objectPatternProperties) &&
            types_1.isUndefinedOrNull(objectAdditionalProperties)) {
            return false;
        }
        // object additional properties allow it to have any shape
        if (objectAdditionalProperties === true) {
            return false;
        }
        return Object.values(objectProperties !== null && objectProperties !== void 0 ? objectProperties : {}).every(isObjectRenderableSchema) &&
            Object.values(objectPatternProperties !== null && objectPatternProperties !== void 0 ? objectPatternProperties : {}).every(isObjectRenderableSchema) &&
            (typeof objectAdditionalProperties === 'object'
                ? isObjectRenderableSchema(objectAdditionalProperties)
                : true);
    }
    function settingTypeEnumRenderable(_type) {
        const enumRenderableSettingTypes = ['string', 'boolean', 'null', 'integer', 'number'];
        const type = types_1.isArray(_type) ? _type : [_type];
        return type.every(type => enumRenderableSettingTypes.indexOf(type) > -1);
    }
    var SearchResultIdx;
    (function (SearchResultIdx) {
        SearchResultIdx[SearchResultIdx["Local"] = 0] = "Local";
        SearchResultIdx[SearchResultIdx["Remote"] = 1] = "Remote";
        SearchResultIdx[SearchResultIdx["NewExtensions"] = 2] = "NewExtensions";
    })(SearchResultIdx = exports.SearchResultIdx || (exports.SearchResultIdx = {}));
    let SearchResultModel = class SearchResultModel extends SettingsTreeModel {
        constructor(viewState, configurationService, environmentService) {
            super(viewState, configurationService);
            this.environmentService = environmentService;
            this.rawSearchResults = null;
            this.cachedUniqueSearchResults = null;
            this.newExtensionSearchResults = null;
            this.id = 'searchResultModel';
            this.update({ id: 'searchResultModel', label: '' });
        }
        getUniqueResults() {
            if (this.cachedUniqueSearchResults) {
                return this.cachedUniqueSearchResults;
            }
            if (!this.rawSearchResults) {
                return [];
            }
            const localMatchKeys = new Set();
            const localResult = this.rawSearchResults[0 /* Local */];
            if (localResult) {
                localResult.filterMatches.forEach(m => localMatchKeys.add(m.setting.key));
            }
            const remoteResult = this.rawSearchResults[1 /* Remote */];
            if (remoteResult) {
                remoteResult.filterMatches = remoteResult.filterMatches.filter(m => !localMatchKeys.has(m.setting.key));
            }
            if (remoteResult) {
                this.newExtensionSearchResults = this.rawSearchResults[2 /* NewExtensions */];
            }
            this.cachedUniqueSearchResults = [localResult, remoteResult];
            return this.cachedUniqueSearchResults;
        }
        getRawResults() {
            return this.rawSearchResults || [];
        }
        setResult(order, result) {
            this.cachedUniqueSearchResults = null;
            this.newExtensionSearchResults = null;
            this.rawSearchResults = this.rawSearchResults || [];
            if (!result) {
                delete this.rawSearchResults[order];
                return;
            }
            if (result.exactMatch) {
                this.rawSearchResults = [];
            }
            this.rawSearchResults[order] = result;
            this.updateChildren();
        }
        updateChildren() {
            this.update({
                id: 'searchResultModel',
                label: 'searchResultModel',
                settings: this.getFlatSettings()
            });
            // Save time, filter children in the search model instead of relying on the tree filter, which still requires heights to be calculated.
            const isRemote = !!this.environmentService.configuration.remoteAuthority;
            this.root.children = this.root.children
                .filter(child => child instanceof SettingsTreeSettingElement && child.matchesAllTags(this._viewState.tagFilters) && child.matchesScope(this._viewState.settingsTarget, isRemote) && child.matchesAnyExtension(this._viewState.extensionFilters));
            if (this.newExtensionSearchResults && this.newExtensionSearchResults.filterMatches.length) {
                const resultExtensionIds = this.newExtensionSearchResults.filterMatches
                    .map(result => result.setting)
                    .filter(setting => setting.extensionName && setting.extensionPublisher)
                    .map(setting => `${setting.extensionPublisher}.${setting.extensionName}`);
                const newExtElement = new SettingsTreeNewExtensionsElement('newExtensions', this._treeElementsById.size, arrays.distinct(resultExtensionIds));
                newExtElement.parent = this._root;
                this._treeElementsById.set(newExtElement.id, newExtElement);
                this._root.children.push(newExtElement);
            }
        }
        getFlatSettings() {
            const flatSettings = [];
            arrays.coalesce(this.getUniqueResults())
                .forEach(r => {
                flatSettings.push(...r.filterMatches.map(m => m.setting));
            });
            return flatSettings;
        }
    };
    SearchResultModel = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], SearchResultModel);
    exports.SearchResultModel = SearchResultModel;
    const tagRegex = /(^|\s)@tag:("([^"]*)"|[^"]\S*)/g;
    const extensionRegex = /(^|\s)@ext:("([^"]*)"|[^"]\S*)?/g;
    function parseQuery(query) {
        const tags = [];
        let extensions = [];
        query = query.replace(tagRegex, (_, __, quotedTag, tag) => {
            tags.push(tag || quotedTag);
            return '';
        });
        query = query.replace(`@${preferences_1.MODIFIED_SETTING_TAG}`, () => {
            tags.push(preferences_1.MODIFIED_SETTING_TAG);
            return '';
        });
        query = query.replace(extensionRegex, (_, __, quotedExtensionId, extensionId) => {
            let extensionIdQuery = extensionId || quotedExtensionId;
            if (extensionIdQuery) {
                extensions.push(...extensionIdQuery.split(',').map(s => s.trim()).filter(s => !strings_1.isFalsyOrWhitespace(s)));
            }
            return '';
        });
        query = query.trim();
        return {
            tags,
            extensionFilters: extensions,
            query
        };
    }
    exports.parseQuery = parseQuery;
});
//# __sourceMappingURL=settingsTreeModels.js.map