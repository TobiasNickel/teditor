/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/strings", "vs/editor/common/modes", "vs/editor/common/modes/modesRegistry", "vs/editor/common/modes/nullMode", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/base/common/types"], function (require, exports, errors_1, event_1, lifecycle_1, mime, strings, modes_1, modesRegistry_1, nullMode_1, configurationRegistry_1, platform_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagesRegistry = void 0;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    class LanguagesRegistry extends lifecycle_1.Disposable {
        constructor(useModesRegistry = true, warnOnOverwrite = false) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._warnOnOverwrite = warnOnOverwrite;
            this._nextLanguageId2 = 1;
            this._languageIdToLanguage = [];
            this._languageToLanguageId = Object.create(null);
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            if (useModesRegistry) {
                this._initializeFromRegistry();
                this._register(modesRegistry_1.ModesRegistry.onDidChangeLanguages((m) => this._initializeFromRegistry()));
            }
        }
        _initializeFromRegistry() {
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            const desc = modesRegistry_1.ModesRegistry.getLanguages();
            this._registerLanguages(desc);
        }
        _registerLanguages(desc) {
            for (const d of desc) {
                this._registerLanguage(d);
            }
            // Rebuild fast path maps
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            Object.keys(this._languages).forEach((langId) => {
                let language = this._languages[langId];
                if (language.name) {
                    this._nameMap[language.name] = language.identifier;
                }
                language.aliases.forEach((alias) => {
                    this._lowercaseNameMap[alias.toLowerCase()] = language.identifier;
                });
                language.mimetypes.forEach((mimetype) => {
                    this._mimeTypesMap[mimetype] = language.identifier;
                });
            });
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerOverrideIdentifiers(modesRegistry_1.ModesRegistry.getLanguages().map(language => language.id));
            this._onDidChange.fire();
        }
        _getLanguageId(language) {
            if (this._languageToLanguageId[language]) {
                return this._languageToLanguageId[language];
            }
            const languageId = this._nextLanguageId2++;
            this._languageIdToLanguage[languageId] = language;
            this._languageToLanguageId[language] = languageId;
            return languageId;
        }
        _registerLanguage(lang) {
            const langId = lang.id;
            let resolvedLanguage;
            if (hasOwnProperty.call(this._languages, langId)) {
                resolvedLanguage = this._languages[langId];
            }
            else {
                const languageId = this._getLanguageId(langId);
                resolvedLanguage = {
                    identifier: new modes_1.LanguageIdentifier(langId, languageId),
                    name: null,
                    mimetypes: [],
                    aliases: [],
                    extensions: [],
                    filenames: [],
                    configurationFiles: []
                };
                this._languages[langId] = resolvedLanguage;
            }
            this._mergeLanguage(resolvedLanguage, lang);
        }
        _mergeLanguage(resolvedLanguage, lang) {
            const langId = lang.id;
            let primaryMime = null;
            if (Array.isArray(lang.mimetypes) && lang.mimetypes.length > 0) {
                resolvedLanguage.mimetypes.push(...lang.mimetypes);
                primaryMime = lang.mimetypes[0];
            }
            if (!primaryMime) {
                primaryMime = `text/x-${langId}`;
                resolvedLanguage.mimetypes.push(primaryMime);
            }
            if (Array.isArray(lang.extensions)) {
                for (let extension of lang.extensions) {
                    mime.registerTextMime({ id: langId, mime: primaryMime, extension: extension }, this._warnOnOverwrite);
                    resolvedLanguage.extensions.push(extension);
                }
            }
            if (Array.isArray(lang.filenames)) {
                for (let filename of lang.filenames) {
                    mime.registerTextMime({ id: langId, mime: primaryMime, filename: filename }, this._warnOnOverwrite);
                    resolvedLanguage.filenames.push(filename);
                }
            }
            if (Array.isArray(lang.filenamePatterns)) {
                for (let filenamePattern of lang.filenamePatterns) {
                    mime.registerTextMime({ id: langId, mime: primaryMime, filepattern: filenamePattern }, this._warnOnOverwrite);
                }
            }
            if (typeof lang.firstLine === 'string' && lang.firstLine.length > 0) {
                let firstLineRegexStr = lang.firstLine;
                if (firstLineRegexStr.charAt(0) !== '^') {
                    firstLineRegexStr = '^' + firstLineRegexStr;
                }
                try {
                    let firstLineRegex = new RegExp(firstLineRegexStr);
                    if (!strings.regExpLeadsToEndlessLoop(firstLineRegex)) {
                        mime.registerTextMime({ id: langId, mime: primaryMime, firstline: firstLineRegex }, this._warnOnOverwrite);
                    }
                }
                catch (err) {
                    // Most likely, the regex was bad
                    errors_1.onUnexpectedError(err);
                }
            }
            resolvedLanguage.aliases.push(langId);
            let langAliases = null;
            if (typeof lang.aliases !== 'undefined' && Array.isArray(lang.aliases)) {
                if (lang.aliases.length === 0) {
                    // signal that this language should not get a name
                    langAliases = [null];
                }
                else {
                    langAliases = lang.aliases;
                }
            }
            if (langAliases !== null) {
                for (const langAlias of langAliases) {
                    if (!langAlias || langAlias.length === 0) {
                        continue;
                    }
                    resolvedLanguage.aliases.push(langAlias);
                }
            }
            let containsAliases = (langAliases !== null && langAliases.length > 0);
            if (containsAliases && langAliases[0] === null) {
                // signal that this language should not get a name
            }
            else {
                let bestName = (containsAliases ? langAliases[0] : null) || langId;
                if (containsAliases || !resolvedLanguage.name) {
                    resolvedLanguage.name = bestName;
                }
            }
            if (lang.configuration) {
                resolvedLanguage.configurationFiles.push(lang.configuration);
            }
        }
        isRegisteredMode(mimetypeOrModeId) {
            // Is this a known mime type ?
            if (hasOwnProperty.call(this._mimeTypesMap, mimetypeOrModeId)) {
                return true;
            }
            // Is this a known mode id ?
            return hasOwnProperty.call(this._languages, mimetypeOrModeId);
        }
        getRegisteredModes() {
            return Object.keys(this._languages);
        }
        getRegisteredLanguageNames() {
            return Object.keys(this._nameMap);
        }
        getLanguageName(modeId) {
            if (!hasOwnProperty.call(this._languages, modeId)) {
                return null;
            }
            return this._languages[modeId].name;
        }
        getModeIdForLanguageNameLowercase(languageNameLower) {
            if (!hasOwnProperty.call(this._lowercaseNameMap, languageNameLower)) {
                return null;
            }
            return this._lowercaseNameMap[languageNameLower].language;
        }
        getConfigurationFiles(modeId) {
            if (!hasOwnProperty.call(this._languages, modeId)) {
                return [];
            }
            return this._languages[modeId].configurationFiles || [];
        }
        getMimeForMode(modeId) {
            if (!hasOwnProperty.call(this._languages, modeId)) {
                return null;
            }
            const language = this._languages[modeId];
            return types_1.withUndefinedAsNull(language.mimetypes[0]);
        }
        extractModeIds(commaSeparatedMimetypesOrCommaSeparatedIds) {
            if (!commaSeparatedMimetypesOrCommaSeparatedIds) {
                return [];
            }
            return (commaSeparatedMimetypesOrCommaSeparatedIds.
                split(',').
                map((mimeTypeOrId) => mimeTypeOrId.trim()).
                map((mimeTypeOrId) => {
                if (hasOwnProperty.call(this._mimeTypesMap, mimeTypeOrId)) {
                    return this._mimeTypesMap[mimeTypeOrId].language;
                }
                return mimeTypeOrId;
            }).
                filter((modeId) => {
                return hasOwnProperty.call(this._languages, modeId);
            }));
        }
        getLanguageIdentifier(_modeId) {
            if (_modeId === nullMode_1.NULL_MODE_ID || _modeId === 0 /* Null */) {
                return nullMode_1.NULL_LANGUAGE_IDENTIFIER;
            }
            let modeId;
            if (typeof _modeId === 'string') {
                modeId = _modeId;
            }
            else {
                modeId = this._languageIdToLanguage[_modeId];
                if (!modeId) {
                    return null;
                }
            }
            if (!hasOwnProperty.call(this._languages, modeId)) {
                return null;
            }
            return this._languages[modeId].identifier;
        }
        getModeIdsFromLanguageName(languageName) {
            if (!languageName) {
                return [];
            }
            if (hasOwnProperty.call(this._nameMap, languageName)) {
                return [this._nameMap[languageName].language];
            }
            return [];
        }
        getModeIdsFromFilepathOrFirstLine(resource, firstLine) {
            if (!resource && !firstLine) {
                return [];
            }
            let mimeTypes = mime.guessMimeTypes(resource, firstLine);
            return this.extractModeIds(mimeTypes.join(','));
        }
        getExtensions(languageName) {
            if (!hasOwnProperty.call(this._nameMap, languageName)) {
                return [];
            }
            const languageId = this._nameMap[languageName];
            return this._languages[languageId.language].extensions;
        }
        getFilenames(languageName) {
            if (!hasOwnProperty.call(this._nameMap, languageName)) {
                return [];
            }
            const languageId = this._nameMap[languageName];
            return this._languages[languageId.language].filenames;
        }
    }
    exports.LanguagesRegistry = LanguagesRegistry;
});
//# __sourceMappingURL=languagesRegistry.js.map