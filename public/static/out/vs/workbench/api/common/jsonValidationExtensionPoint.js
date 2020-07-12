/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/types"], function (require, exports, nls, extensionsRegistry_1, strings, resources, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONValidationExtensionPoint = void 0;
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'jsonValidation',
        defaultExtensionKind: 'workspace',
        jsonSchema: {
            description: nls.localize('contributes.jsonValidation', 'Contributes json schema configuration.'),
            type: 'array',
            defaultSnippets: [{ body: [{ fileMatch: '${1:file.json}', url: '${2:url}' }] }],
            items: {
                type: 'object',
                defaultSnippets: [{ body: { fileMatch: '${1:file.json}', url: '${2:url}' } }],
                properties: {
                    fileMatch: {
                        type: ['string', 'array'],
                        description: nls.localize('contributes.jsonValidation.fileMatch', 'The file pattern (or an array of patterns) to match, for example "package.json" or "*.launch". Exclusion patterns start with \'!\''),
                        items: {
                            type: ['string']
                        }
                    },
                    url: {
                        description: nls.localize('contributes.jsonValidation.url', 'A schema URL (\'http:\', \'https:\') or relative path to the extension folder (\'./\').'),
                        type: 'string'
                    }
                }
            }
        }
    });
    class JSONValidationExtensionPoint {
        constructor() {
            configurationExtPoint.setHandler((extensions) => {
                for (const extension of extensions) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    const extensionLocation = extension.description.extensionLocation;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.jsonValidation', "'configuration.jsonValidation' must be a array"));
                        return;
                    }
                    extensionValue.forEach(extension => {
                        if (!types_1.isString(extension.fileMatch) && !(Array.isArray(extension.fileMatch) && extension.fileMatch.every(types_1.isString))) {
                            collector.error(nls.localize('invalid.fileMatch', "'configuration.jsonValidation.fileMatch' must be defined as a string or an array of strings."));
                            return;
                        }
                        let uri = extension.url;
                        if (!types_1.isString(uri)) {
                            collector.error(nls.localize('invalid.url', "'configuration.jsonValidation.url' must be a URL or relative path"));
                            return;
                        }
                        if (strings.startsWith(uri, './')) {
                            try {
                                const colorThemeLocation = resources.joinPath(extensionLocation, uri);
                                if (!resources.isEqualOrParent(colorThemeLocation, extensionLocation)) {
                                    collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.url` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", configurationExtPoint.name, colorThemeLocation.toString(), extensionLocation.path));
                                }
                            }
                            catch (e) {
                                collector.error(nls.localize('invalid.url.fileschema', "'configuration.jsonValidation.url' is an invalid relative URL: {0}", e.message));
                            }
                        }
                        else if (!/^[^:/?#]+:\/\//.test(uri)) {
                            collector.error(nls.localize('invalid.url.schema', "'configuration.jsonValidation.url' must be an absolute URL or start with './'  to reference schemas located in the extension."));
                            return;
                        }
                    });
                }
            });
        }
    }
    exports.JSONValidationExtensionPoint = JSONValidationExtensionPoint;
});
//# __sourceMappingURL=jsonValidationExtensionPoint.js.map