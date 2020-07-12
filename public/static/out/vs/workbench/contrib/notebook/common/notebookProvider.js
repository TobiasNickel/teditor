/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/path"], function (require, exports, glob, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookProviderInfo = void 0;
    class NotebookProviderInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.displayName = descriptor.displayName;
            this.selector = descriptor.selector;
            this.priority = descriptor.priority;
            this.providerDisplayName = descriptor.providerDisplayName;
            this.providerExtensionLocation = descriptor.providerExtensionLocation;
        }
        matches(resource) {
            return this.selector.some(selector => NotebookProviderInfo.selectorMatches(selector, resource));
        }
        static selectorMatches(selector, resource) {
            if (selector.filenamePattern) {
                if (glob.match(selector.filenamePattern.toLowerCase(), path_1.basename(resource.fsPath).toLowerCase())) {
                    if (selector.excludeFileNamePattern) {
                        if (glob.match(selector.excludeFileNamePattern.toLowerCase(), path_1.basename(resource.fsPath).toLowerCase())) {
                            // should exclude
                            return false;
                        }
                    }
                    return true;
                }
            }
            return false;
        }
    }
    exports.NotebookProviderInfo = NotebookProviderInfo;
});
//# __sourceMappingURL=notebookProvider.js.map