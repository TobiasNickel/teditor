/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/modes/abstractMode", "vs/editor/common/modes/nullMode", "vs/editor/common/services/languagesRegistry", "vs/base/common/arrays"], function (require, exports, event_1, lifecycle_1, abstractMode_1, nullMode_1, languagesRegistry_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModeServiceImpl = void 0;
    class LanguageSelection extends lifecycle_1.Disposable {
        constructor(onLanguagesMaybeChanged, selector) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._selector = selector;
            this.languageIdentifier = this._selector();
            this._register(onLanguagesMaybeChanged(() => this._evaluate()));
        }
        _evaluate() {
            let languageIdentifier = this._selector();
            if (languageIdentifier.id === this.languageIdentifier.id) {
                // no change
                return;
            }
            this.languageIdentifier = languageIdentifier;
            this._onDidChange.fire(this.languageIdentifier);
        }
    }
    class ModeServiceImpl {
        constructor(warnOnOverwrite = false) {
            this._onDidCreateMode = new event_1.Emitter();
            this.onDidCreateMode = this._onDidCreateMode.event;
            this._onLanguagesMaybeChanged = new event_1.Emitter();
            this.onLanguagesMaybeChanged = this._onLanguagesMaybeChanged.event;
            this._instantiatedModes = {};
            this._registry = new languagesRegistry_1.LanguagesRegistry(true, warnOnOverwrite);
            this._registry.onDidChange(() => this._onLanguagesMaybeChanged.fire());
        }
        _onReady() {
            return Promise.resolve(true);
        }
        isRegisteredMode(mimetypeOrModeId) {
            return this._registry.isRegisteredMode(mimetypeOrModeId);
        }
        getRegisteredModes() {
            return this._registry.getRegisteredModes();
        }
        getRegisteredLanguageNames() {
            return this._registry.getRegisteredLanguageNames();
        }
        getExtensions(alias) {
            return this._registry.getExtensions(alias);
        }
        getFilenames(alias) {
            return this._registry.getFilenames(alias);
        }
        getMimeForMode(modeId) {
            return this._registry.getMimeForMode(modeId);
        }
        getLanguageName(modeId) {
            return this._registry.getLanguageName(modeId);
        }
        getModeIdForLanguageName(alias) {
            return this._registry.getModeIdForLanguageNameLowercase(alias);
        }
        getModeIdByFilepathOrFirstLine(resource, firstLine) {
            const modeIds = this._registry.getModeIdsFromFilepathOrFirstLine(resource, firstLine);
            return arrays_1.firstOrDefault(modeIds, null);
        }
        getModeId(commaSeparatedMimetypesOrCommaSeparatedIds) {
            const modeIds = this._registry.extractModeIds(commaSeparatedMimetypesOrCommaSeparatedIds);
            return arrays_1.firstOrDefault(modeIds, null);
        }
        getLanguageIdentifier(modeId) {
            return this._registry.getLanguageIdentifier(modeId);
        }
        getConfigurationFiles(modeId) {
            return this._registry.getConfigurationFiles(modeId);
        }
        // --- instantiation
        create(commaSeparatedMimetypesOrCommaSeparatedIds) {
            return new LanguageSelection(this.onLanguagesMaybeChanged, () => {
                const modeId = this.getModeId(commaSeparatedMimetypesOrCommaSeparatedIds);
                return this._createModeAndGetLanguageIdentifier(modeId);
            });
        }
        createByLanguageName(languageName) {
            return new LanguageSelection(this.onLanguagesMaybeChanged, () => {
                const modeId = this._getModeIdByLanguageName(languageName);
                return this._createModeAndGetLanguageIdentifier(modeId);
            });
        }
        createByFilepathOrFirstLine(resource, firstLine) {
            return new LanguageSelection(this.onLanguagesMaybeChanged, () => {
                const modeId = this.getModeIdByFilepathOrFirstLine(resource, firstLine);
                return this._createModeAndGetLanguageIdentifier(modeId);
            });
        }
        _createModeAndGetLanguageIdentifier(modeId) {
            // Fall back to plain text if no mode was found
            const languageIdentifier = this.getLanguageIdentifier(modeId || 'plaintext') || nullMode_1.NULL_LANGUAGE_IDENTIFIER;
            this._getOrCreateMode(languageIdentifier.language);
            return languageIdentifier;
        }
        triggerMode(commaSeparatedMimetypesOrCommaSeparatedIds) {
            const modeId = this.getModeId(commaSeparatedMimetypesOrCommaSeparatedIds);
            // Fall back to plain text if no mode was found
            this._getOrCreateMode(modeId || 'plaintext');
        }
        waitForLanguageRegistration() {
            return this._onReady().then(() => { });
        }
        _getModeIdByLanguageName(languageName) {
            const modeIds = this._registry.getModeIdsFromLanguageName(languageName);
            return arrays_1.firstOrDefault(modeIds, null);
        }
        _getOrCreateMode(modeId) {
            if (!this._instantiatedModes.hasOwnProperty(modeId)) {
                let languageIdentifier = this.getLanguageIdentifier(modeId) || nullMode_1.NULL_LANGUAGE_IDENTIFIER;
                this._instantiatedModes[modeId] = new abstractMode_1.FrankensteinMode(languageIdentifier);
                this._onDidCreateMode.fire(this._instantiatedModes[modeId]);
            }
            return this._instantiatedModes[modeId];
        }
    }
    exports.ModeServiceImpl = ModeServiceImpl;
});
//# __sourceMappingURL=modeServiceImpl.js.map