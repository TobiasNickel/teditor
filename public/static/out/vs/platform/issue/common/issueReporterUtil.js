/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeGitHubUrl = void 0;
    function normalizeGitHubUrl(url) {
        // If the url has a .git suffix, remove it
        if (strings_1.endsWith(url, '.git')) {
            url = url.substr(0, url.length - 4);
        }
        // Remove trailing slash
        url = strings_1.rtrim(url, '/');
        if (strings_1.endsWith(url, '/new')) {
            url = strings_1.rtrim(url, '/new');
        }
        if (strings_1.endsWith(url, '/issues')) {
            url = strings_1.rtrim(url, '/issues');
        }
        return url;
    }
    exports.normalizeGitHubUrl = normalizeGitHubUrl;
});
//# __sourceMappingURL=issueReporterUtil.js.map