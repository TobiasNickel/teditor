/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/lifecycle"], function (require, exports, resources, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TMScopeRegistry = void 0;
    class TMScopeRegistry extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._scopeNameToLanguageRegistration = Object.create(null);
        }
        reset() {
            this._scopeNameToLanguageRegistration = Object.create(null);
        }
        register(def) {
            if (this._scopeNameToLanguageRegistration[def.scopeName]) {
                const existingRegistration = this._scopeNameToLanguageRegistration[def.scopeName];
                if (!resources.isEqual(existingRegistration.location, def.location)) {
                    console.warn(`Overwriting grammar scope name to file mapping for scope ${def.scopeName}.\n` +
                        `Old grammar file: ${existingRegistration.location.toString()}.\n` +
                        `New grammar file: ${def.location.toString()}`);
                }
            }
            this._scopeNameToLanguageRegistration[def.scopeName] = def;
        }
        getGrammarDefinition(scopeName) {
            return this._scopeNameToLanguageRegistration[scopeName] || null;
        }
    }
    exports.TMScopeRegistry = TMScopeRegistry;
});
//# __sourceMappingURL=TMScopeRegistry.js.map