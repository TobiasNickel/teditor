/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/mime", "vs/base/common/resources", "vs/editor/common/modes/modesRegistry", "vs/editor/common/services/modeService", "vs/editor/common/services/modeServiceImpl", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, mime, resources, modesRegistry_1, modeService_1, modeServiceImpl_1, configuration_1, environment_1, files_1, extensions_1, extensionsRegistry_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchModeServiceImpl = exports.languagesExtPoint = void 0;
    exports.languagesExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'languages',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.languages', 'Contributes language declarations.'),
            type: 'array',
            items: {
                type: 'object',
                defaultSnippets: [{ body: { id: '${1:languageId}', aliases: ['${2:label}'], extensions: ['${3:extension}'], configuration: './language-configuration.json' } }],
                properties: {
                    id: {
                        description: nls.localize('vscode.extension.contributes.languages.id', 'ID of the language.'),
                        type: 'string'
                    },
                    aliases: {
                        description: nls.localize('vscode.extension.contributes.languages.aliases', 'Name aliases for the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    extensions: {
                        description: nls.localize('vscode.extension.contributes.languages.extensions', 'File extensions associated to the language.'),
                        default: ['.foo'],
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    filenames: {
                        description: nls.localize('vscode.extension.contributes.languages.filenames', 'File names associated to the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    filenamePatterns: {
                        description: nls.localize('vscode.extension.contributes.languages.filenamePatterns', 'File name glob patterns associated to the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    mimetypes: {
                        description: nls.localize('vscode.extension.contributes.languages.mimetypes', 'Mime types associated to the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    firstLine: {
                        description: nls.localize('vscode.extension.contributes.languages.firstLine', 'A regular expression matching the first line of a file of the language.'),
                        type: 'string'
                    },
                    configuration: {
                        description: nls.localize('vscode.extension.contributes.languages.configuration', 'A relative path to a file containing configuration options for the language.'),
                        type: 'string',
                        default: './language-configuration.json'
                    }
                }
            }
        }
    });
    let WorkbenchModeServiceImpl = class WorkbenchModeServiceImpl extends modeServiceImpl_1.ModeServiceImpl {
        constructor(extensionService, configurationService, environmentService) {
            super(environmentService.verbose || environmentService.isExtensionDevelopment || !environmentService.isBuilt);
            this._configurationService = configurationService;
            this._extensionService = extensionService;
            exports.languagesExtPoint.setHandler((extensions) => {
                let allValidLanguages = [];
                for (let i = 0, len = extensions.length; i < len; i++) {
                    let extension = extensions[i];
                    if (!Array.isArray(extension.value)) {
                        extension.collector.error(nls.localize('invalid', "Invalid `contributes.{0}`. Expected an array.", exports.languagesExtPoint.name));
                        continue;
                    }
                    for (let j = 0, lenJ = extension.value.length; j < lenJ; j++) {
                        let ext = extension.value[j];
                        if (isValidLanguageExtensionPoint(ext, extension.collector)) {
                            let configuration = undefined;
                            if (ext.configuration) {
                                configuration = resources.joinPath(extension.description.extensionLocation, ext.configuration);
                            }
                            allValidLanguages.push({
                                id: ext.id,
                                extensions: ext.extensions,
                                filenames: ext.filenames,
                                filenamePatterns: ext.filenamePatterns,
                                firstLine: ext.firstLine,
                                aliases: ext.aliases,
                                mimetypes: ext.mimetypes,
                                configuration: configuration
                            });
                        }
                    }
                }
                modesRegistry_1.ModesRegistry.setDynamicLanguages(allValidLanguages);
            });
            this.updateMime();
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(files_1.FILES_ASSOCIATIONS_CONFIG)) {
                    this.updateMime();
                }
            });
            this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.updateMime();
            });
            this.onDidCreateMode((mode) => {
                this._extensionService.activateByEvent(`onLanguage:${mode.getId()}`);
            });
        }
        _onReady() {
            if (!this._onReadyPromise) {
                this._onReadyPromise = Promise.resolve(this._extensionService.whenInstalledExtensionsRegistered().then(() => true));
            }
            return this._onReadyPromise;
        }
        updateMime() {
            var _a;
            const configuration = this._configurationService.getValue();
            // Clear user configured mime associations
            mime.clearTextMimes(true /* user configured */);
            // Register based on settings
            if ((_a = configuration.files) === null || _a === void 0 ? void 0 : _a.associations) {
                Object.keys(configuration.files.associations).forEach(pattern => {
                    const langId = configuration.files.associations[pattern];
                    const mimetype = this.getMimeForMode(langId) || `text/x-${langId}`;
                    mime.registerTextMime({ id: langId, mime: mimetype, filepattern: pattern, userConfigured: true });
                });
            }
            this._onLanguagesMaybeChanged.fire();
        }
    };
    WorkbenchModeServiceImpl = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environment_1.IEnvironmentService)
    ], WorkbenchModeServiceImpl);
    exports.WorkbenchModeServiceImpl = WorkbenchModeServiceImpl;
    function isUndefinedOrStringArray(value) {
        if (typeof value === 'undefined') {
            return true;
        }
        if (!Array.isArray(value)) {
            return false;
        }
        return value.every(item => typeof item === 'string');
    }
    function isValidLanguageExtensionPoint(value, collector) {
        if (!value) {
            collector.error(nls.localize('invalid.empty', "Empty value for `contributes.{0}`", exports.languagesExtPoint.name));
            return false;
        }
        if (typeof value.id !== 'string') {
            collector.error(nls.localize('require.id', "property `{0}` is mandatory and must be of type `string`", 'id'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.extensions)) {
            collector.error(nls.localize('opt.extensions', "property `{0}` can be omitted and must be of type `string[]`", 'extensions'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.filenames)) {
            collector.error(nls.localize('opt.filenames', "property `{0}` can be omitted and must be of type `string[]`", 'filenames'));
            return false;
        }
        if (typeof value.firstLine !== 'undefined' && typeof value.firstLine !== 'string') {
            collector.error(nls.localize('opt.firstLine', "property `{0}` can be omitted and must be of type `string`", 'firstLine'));
            return false;
        }
        if (typeof value.configuration !== 'undefined' && typeof value.configuration !== 'string') {
            collector.error(nls.localize('opt.configuration', "property `{0}` can be omitted and must be of type `string`", 'configuration'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.aliases)) {
            collector.error(nls.localize('opt.aliases', "property `{0}` can be omitted and must be of type `string[]`", 'aliases'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.mimetypes)) {
            collector.error(nls.localize('opt.mimetypes', "property `{0}` can be omitted and must be of type `string[]`", 'mimetypes'));
            return false;
        }
        return true;
    }
    extensions_2.registerSingleton(modeService_1.IModeService, WorkbenchModeServiceImpl);
});
//# __sourceMappingURL=workbenchModeService.js.map