/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays"], function (require, exports, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Query = void 0;
    class Query {
        constructor(value, sortBy, groupBy) {
            this.value = value;
            this.sortBy = sortBy;
            this.groupBy = groupBy;
            this.value = value.trim();
        }
        static suggestions(query) {
            const commands = ['installed', 'outdated', 'enabled', 'disabled', 'builtin', 'recommended', 'sort', 'category', 'tag', 'ext', 'id'];
            const subcommands = {
                'sort': ['installs', 'rating', 'name'],
                'category': ['"programming languages"', 'snippets', 'linters', 'themes', 'debuggers', 'formatters', 'keymaps', '"scm providers"', 'other', '"extension packs"', '"language packs"'],
                'tag': [''],
                'ext': [''],
                'id': ['']
            };
            const queryContains = (substr) => query.indexOf(substr) > -1;
            const hasSort = subcommands.sort.some(subcommand => queryContains(`@sort:${subcommand}`));
            const hasCategory = subcommands.category.some(subcommand => queryContains(`@category:${subcommand}`));
            return arrays_1.flatten(commands.map(command => {
                if (hasSort && command === 'sort' || hasCategory && command === 'category') {
                    return [];
                }
                if (command in subcommands) {
                    return subcommands[command]
                        .map(subcommand => `@${command}:${subcommand}${subcommand === '' ? '' : ' '}`);
                }
                else {
                    return queryContains(`@${command}`) ? [] : [`@${command} `];
                }
            }));
        }
        static parse(value) {
            let sortBy = '';
            value = value.replace(/@sort:(\w+)(-\w*)?/g, (match, by, order) => {
                sortBy = by;
                return '';
            });
            let groupBy = '';
            value = value.replace(/@group:(\w+)(-\w*)?/g, (match, by, order) => {
                groupBy = by;
                return '';
            });
            return new Query(value, sortBy, groupBy);
        }
        toString() {
            let result = this.value;
            if (this.sortBy) {
                result = `${result}${result ? ' ' : ''}@sort:${this.sortBy}`;
            }
            if (this.groupBy) {
                result = `${result}${result ? ' ' : ''}@group:${this.groupBy}`;
            }
            return result;
        }
        isValid() {
            return !/@outdated/.test(this.value);
        }
        equals(other) {
            return this.value === other.value && this.sortBy === other.sortBy;
        }
    }
    exports.Query = Query;
});
//# __sourceMappingURL=extensionQuery.js.map