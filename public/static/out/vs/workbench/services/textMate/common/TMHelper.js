/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeRule = exports.findMatchingThemeRule = void 0;
    function findMatchingThemeRule(theme, scopes, onlyColorRules = true) {
        for (let i = scopes.length - 1; i >= 0; i--) {
            let parentScopes = scopes.slice(0, i);
            let scope = scopes[i];
            let r = findMatchingThemeRule2(theme, scope, parentScopes, onlyColorRules);
            if (r) {
                return r;
            }
        }
        return null;
    }
    exports.findMatchingThemeRule = findMatchingThemeRule;
    function findMatchingThemeRule2(theme, scope, parentScopes, onlyColorRules) {
        let result = null;
        // Loop backwards, to ensure the last most specific rule wins
        for (let i = theme.tokenColors.length - 1; i >= 0; i--) {
            let rule = theme.tokenColors[i];
            if (onlyColorRules && !rule.settings.foreground) {
                continue;
            }
            let selectors;
            if (typeof rule.scope === 'string') {
                selectors = rule.scope.split(/,/).map(scope => scope.trim());
            }
            else if (Array.isArray(rule.scope)) {
                selectors = rule.scope;
            }
            else {
                continue;
            }
            for (let j = 0, lenJ = selectors.length; j < lenJ; j++) {
                let rawSelector = selectors[j];
                let themeRule = new ThemeRule(rawSelector, rule.settings);
                if (themeRule.matches(scope, parentScopes)) {
                    if (themeRule.isMoreSpecific(result)) {
                        result = themeRule;
                    }
                }
            }
        }
        return result;
    }
    class ThemeRule {
        constructor(rawSelector, settings) {
            this.rawSelector = rawSelector;
            this.settings = settings;
            let rawSelectorPieces = this.rawSelector.split(/ /);
            this.scope = rawSelectorPieces[rawSelectorPieces.length - 1];
            this.parentScopes = rawSelectorPieces.slice(0, rawSelectorPieces.length - 1);
        }
        matches(scope, parentScopes) {
            return ThemeRule._matches(this.scope, this.parentScopes, scope, parentScopes);
        }
        static _cmp(a, b) {
            if (a === null && b === null) {
                return 0;
            }
            if (a === null) {
                // b > a
                return -1;
            }
            if (b === null) {
                // a > b
                return 1;
            }
            if (a.scope.length !== b.scope.length) {
                // longer scope length > shorter scope length
                return a.scope.length - b.scope.length;
            }
            const aParentScopesLen = a.parentScopes.length;
            const bParentScopesLen = b.parentScopes.length;
            if (aParentScopesLen !== bParentScopesLen) {
                // more parents > less parents
                return aParentScopesLen - bParentScopesLen;
            }
            for (let i = 0; i < aParentScopesLen; i++) {
                const aLen = a.parentScopes[i].length;
                const bLen = b.parentScopes[i].length;
                if (aLen !== bLen) {
                    return aLen - bLen;
                }
            }
            return 0;
        }
        isMoreSpecific(other) {
            return (ThemeRule._cmp(this, other) > 0);
        }
        static _matchesOne(selectorScope, scope) {
            let selectorPrefix = selectorScope + '.';
            if (selectorScope === scope || scope.substring(0, selectorPrefix.length) === selectorPrefix) {
                return true;
            }
            return false;
        }
        static _matches(selectorScope, selectorParentScopes, scope, parentScopes) {
            if (!this._matchesOne(selectorScope, scope)) {
                return false;
            }
            let selectorParentIndex = selectorParentScopes.length - 1;
            let parentIndex = parentScopes.length - 1;
            while (selectorParentIndex >= 0 && parentIndex >= 0) {
                if (this._matchesOne(selectorParentScopes[selectorParentIndex], parentScopes[parentIndex])) {
                    selectorParentIndex--;
                }
                parentIndex--;
            }
            if (selectorParentIndex === -1) {
                return true;
            }
            return false;
        }
    }
    exports.ThemeRule = ThemeRule;
});
//# __sourceMappingURL=TMHelper.js.map