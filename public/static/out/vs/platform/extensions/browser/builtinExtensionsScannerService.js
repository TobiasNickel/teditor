/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BuiltinExtensionsScannerService = void 0;
    class BuiltinExtensionsScannerService {
        constructor() {
            this.builtinExtensions = [];
            if (platform_1.isWeb) {
                // Find builtin extensions by checking for DOM
                const builtinExtensionsElement = document.getElementById('vscode-workbench-builtin-extensions');
                const builtinExtensionsElementAttribute = builtinExtensionsElement ? builtinExtensionsElement.getAttribute('data-settings') : undefined;
                if (builtinExtensionsElementAttribute) {
                    try {
                        const builtinExtensions = JSON.parse(builtinExtensionsElementAttribute);
                        this.builtinExtensions = builtinExtensions.map(e => ({
                            location: uri_1.URI.revive(e.location),
                            type: 0 /* System */,
                            packageJSON: e.packageJSON,
                            packageNLSUrl: uri_1.URI.revive(e.packageNLSUrl),
                            readmeUrl: uri_1.URI.revive(e.readmeUrl),
                            changelogUrl: uri_1.URI.revive(e.changelogUrl),
                        }));
                    }
                    catch (error) { /* ignore error*/ }
                }
            }
        }
        async scanBuiltinExtensions() {
            if (platform_1.isWeb) {
                return this.builtinExtensions;
            }
            throw new Error('not supported');
        }
    }
    exports.BuiltinExtensionsScannerService = BuiltinExtensionsScannerService;
});
//# __sourceMappingURL=builtinExtensionsScannerService.js.map