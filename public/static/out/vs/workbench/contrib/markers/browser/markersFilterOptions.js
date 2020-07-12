/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/resources"], function (require, exports, filters_1, glob_1, strings, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterOptions = void 0;
    class FilterOptions {
        constructor(filter = '', filesExclude = [], showWarnings = false, showErrors = false, showInfos = false) {
            this.filter = filter;
            this.showWarnings = false;
            this.showErrors = false;
            this.showInfos = false;
            this.textFilter = '';
            filter = filter.trim();
            this.showWarnings = showWarnings;
            this.showErrors = showErrors;
            this.showInfos = showInfos;
            const filesExcludeByRoot = Array.isArray(filesExclude) ? filesExclude : [];
            const excludesExpression = Array.isArray(filesExclude) ? glob_1.getEmptyExpression() : filesExclude;
            const includeExpression = glob_1.getEmptyExpression();
            if (filter) {
                const filters = glob_1.splitGlobAware(filter, ',').map(s => s.trim()).filter(s => !!s.length);
                for (const f of filters) {
                    if (strings.startsWith(f, '!')) {
                        this.setPattern(excludesExpression, strings.ltrim(f, '!'));
                    }
                    else {
                        this.setPattern(includeExpression, f);
                        this.textFilter += ` ${f}`;
                    }
                }
            }
            this.excludesMatcher = new resources_1.ResourceGlobMatcher(excludesExpression, filesExcludeByRoot);
            this.includesMatcher = new resources_1.ResourceGlobMatcher(includeExpression, []);
            this.textFilter = this.textFilter.trim();
        }
        setPattern(expression, pattern) {
            if (pattern[0] === '.') {
                pattern = '*' + pattern; // convert ".js" to "*.js"
            }
            expression[`**/${pattern}/**`] = true;
            expression[`**/${pattern}`] = true;
        }
    }
    exports.FilterOptions = FilterOptions;
    FilterOptions._filter = filters_1.matchesFuzzy2;
    FilterOptions._messageFilter = filters_1.matchesFuzzy;
});
//# __sourceMappingURL=markersFilterOptions.js.map