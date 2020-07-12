/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, nls, event_1, modes_1, languageConfigurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PLAINTEXT_LANGUAGE_IDENTIFIER = exports.PLAINTEXT_MODE_ID = exports.ModesRegistry = exports.EditorModesRegistry = exports.Extensions = void 0;
    // Define extension point ids
    exports.Extensions = {
        ModesRegistry: 'editor.modesRegistry'
    };
    class EditorModesRegistry {
        constructor() {
            this._onDidChangeLanguages = new event_1.Emitter();
            this.onDidChangeLanguages = this._onDidChangeLanguages.event;
            this._languages = [];
            this._dynamicLanguages = [];
        }
        // --- languages
        registerLanguage(def) {
            this._languages.push(def);
            this._onDidChangeLanguages.fire(undefined);
            return {
                dispose: () => {
                    for (let i = 0, len = this._languages.length; i < len; i++) {
                        if (this._languages[i] === def) {
                            this._languages.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        setDynamicLanguages(def) {
            this._dynamicLanguages = def;
            this._onDidChangeLanguages.fire(undefined);
        }
        getLanguages() {
            return [].concat(this._languages).concat(this._dynamicLanguages);
        }
    }
    exports.EditorModesRegistry = EditorModesRegistry;
    exports.ModesRegistry = new EditorModesRegistry();
    platform_1.Registry.add(exports.Extensions.ModesRegistry, exports.ModesRegistry);
    exports.PLAINTEXT_MODE_ID = 'plaintext';
    exports.PLAINTEXT_LANGUAGE_IDENTIFIER = new modes_1.LanguageIdentifier(exports.PLAINTEXT_MODE_ID, 1 /* PlainText */);
    exports.ModesRegistry.registerLanguage({
        id: exports.PLAINTEXT_MODE_ID,
        extensions: ['.txt', '.gitignore'],
        aliases: [nls.localize('plainText.alias', "Plain Text"), 'text'],
        mimetypes: ['text/plain']
    });
    languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(exports.PLAINTEXT_LANGUAGE_IDENTIFIER, {
        brackets: [
            ['(', ')'],
            ['[', ']'],
            ['{', '}'],
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
            { open: '\"', close: '\"' },
            { open: '\'', close: '\'' },
            { open: '`', close: '`' },
        ],
        folding: {
            offSide: true
        }
    });
});
//# __sourceMappingURL=modesRegistry.js.map