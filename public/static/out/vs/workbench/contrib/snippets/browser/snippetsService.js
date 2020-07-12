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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/services/modeService", "vs/editor/contrib/suggest/suggest", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/mode/common/workbenchModeService", "./snippetCompletionProvider", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader"], function (require, exports, lifecycle_1, resources, strings_1, modeService_1, suggest_1, nls_1, environment_1, files_1, extensions_1, lifecycle_2, log_1, workspace_1, snippets_contribution_1, snippetsFile_1, extensionsRegistry_1, workbenchModeService_1, snippetCompletionProvider_1, extensionResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNonWhitespacePrefix = void 0;
    var snippetExt;
    (function (snippetExt) {
        function toValidSnippet(extension, snippet, modeService) {
            if (strings_1.isFalsyOrWhitespace(snippet.path)) {
                extension.collector.error(nls_1.localize('invalid.path.0', "Expected string in `contributes.{0}.path`. Provided value: {1}", extension.description.name, String(snippet.path)));
                return null;
            }
            if (strings_1.isFalsyOrWhitespace(snippet.language) && !snippet.path.endsWith('.code-snippets')) {
                extension.collector.error(nls_1.localize('invalid.language.0', "When omitting the language, the value of `contributes.{0}.path` must be a `.code-snippets`-file. Provided value: {1}", extension.description.name, String(snippet.path)));
                return null;
            }
            if (!strings_1.isFalsyOrWhitespace(snippet.language) && !modeService.isRegisteredMode(snippet.language)) {
                extension.collector.error(nls_1.localize('invalid.language', "Unknown language in `contributes.{0}.language`. Provided value: {1}", extension.description.name, String(snippet.language)));
                return null;
            }
            const extensionLocation = extension.description.extensionLocation;
            const snippetLocation = resources.joinPath(extensionLocation, snippet.path);
            if (!resources.isEqualOrParent(snippetLocation, extensionLocation)) {
                extension.collector.error(nls_1.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", extension.description.name, snippetLocation.path, extensionLocation.path));
                return null;
            }
            return {
                language: snippet.language,
                location: snippetLocation
            };
        }
        snippetExt.toValidSnippet = toValidSnippet;
        snippetExt.snippetsContribution = {
            description: nls_1.localize('vscode.extension.contributes.snippets', 'Contributes snippets.'),
            type: 'array',
            defaultSnippets: [{ body: [{ language: '', path: '' }] }],
            items: {
                type: 'object',
                defaultSnippets: [{ body: { language: '${1:id}', path: './snippets/${2:id}.json.' } }],
                properties: {
                    language: {
                        description: nls_1.localize('vscode.extension.contributes.snippets-language', 'Language identifier for which this snippet is contributed to.'),
                        type: 'string'
                    },
                    path: {
                        description: nls_1.localize('vscode.extension.contributes.snippets-path', 'Path of the snippets file. The path is relative to the extension folder and typically starts with \'./snippets/\'.'),
                        type: 'string'
                    }
                }
            }
        };
        snippetExt.point = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'snippets',
            deps: [workbenchModeService_1.languagesExtPoint],
            jsonSchema: snippetExt.snippetsContribution
        });
    })(snippetExt || (snippetExt = {}));
    function watch(service, resource, callback) {
        return lifecycle_1.combinedDisposable(service.watch(resource), service.onDidFilesChange(e => {
            for (const change of e.changes) {
                if (resources.isEqualOrParent(change.resource, resource)) {
                    callback(change.type, change.resource);
                }
            }
        }));
    }
    let SnippetsService = class SnippetsService {
        constructor(_environmentService, _contextService, _modeService, _logService, _fileService, _extensionResourceLoaderService, lifecycleService) {
            this._environmentService = _environmentService;
            this._contextService = _contextService;
            this._modeService = _modeService;
            this._logService = _logService;
            this._fileService = _fileService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._pendingWork = [];
            this._files = new Map();
            this._pendingWork.push(Promise.resolve(lifecycleService.when(3 /* Restored */).then(() => {
                this._initExtensionSnippets();
                this._initUserSnippets();
                this._initWorkspaceSnippets();
            })));
            suggest_1.setSnippetSuggestSupport(new snippetCompletionProvider_1.SnippetCompletionProvider(this._modeService, this));
        }
        dispose() {
            this._disposables.dispose();
        }
        _joinSnippets() {
            const promises = this._pendingWork.slice(0);
            this._pendingWork.length = 0;
            return Promise.all(promises);
        }
        async getSnippetFiles() {
            await this._joinSnippets();
            return this._files.values();
        }
        getSnippets(languageId) {
            return this._joinSnippets().then(() => {
                const result = [];
                const promises = [];
                const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
                if (languageIdentifier) {
                    const langName = languageIdentifier.language;
                    for (const file of this._files.values()) {
                        promises.push(file.load()
                            .then(file => file.select(langName, result))
                            .catch(err => this._logService.error(err, file.location.toString())));
                    }
                }
                return Promise.all(promises).then(() => result);
            });
        }
        getSnippetsSync(languageId) {
            const result = [];
            const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
            if (languageIdentifier) {
                const langName = languageIdentifier.language;
                for (const file of this._files.values()) {
                    // kick off loading (which is a noop in case it's already loaded)
                    // and optimistically collect snippets
                    file.load().catch(err => { });
                    file.select(langName, result);
                }
            }
            return result;
        }
        // --- loading, watching
        _initExtensionSnippets() {
            snippetExt.point.setHandler(extensions => {
                for (let [key, value] of this._files) {
                    if (value.source === 3 /* Extension */) {
                        this._files.delete(key);
                    }
                }
                for (const extension of extensions) {
                    for (const contribution of extension.value) {
                        const validContribution = snippetExt.toValidSnippet(extension, contribution, this._modeService);
                        if (!validContribution) {
                            continue;
                        }
                        const resource = validContribution.location.toString();
                        const file = this._files.get(resource);
                        if (file) {
                            if (file.defaultScopes) {
                                file.defaultScopes.push(validContribution.language);
                            }
                            else {
                                file.defaultScopes = [];
                            }
                        }
                        else {
                            const file = new snippetsFile_1.SnippetFile(3 /* Extension */, validContribution.location, validContribution.language ? [validContribution.language] : undefined, extension.description, this._fileService, this._extensionResourceLoaderService);
                            this._files.set(file.location.toString(), file);
                            if (this._environmentService.isExtensionDevelopment) {
                                file.load().then(file => {
                                    // warn about bad tabstop/variable usage
                                    if (file.data.some(snippet => snippet.isBogous)) {
                                        extension.collector.warn(nls_1.localize('badVariableUse', "One or more snippets from the extension '{0}' very likely confuse snippet-variables and snippet-placeholders (see https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax for more details)", extension.description.name));
                                    }
                                }, err => {
                                    // generic error
                                    extension.collector.warn(nls_1.localize('badFile', "The snippet file \"{0}\" could not be read.", file.location.toString()));
                                });
                            }
                        }
                    }
                }
            });
        }
        _initWorkspaceSnippets() {
            // workspace stuff
            let disposables = new lifecycle_1.DisposableStore();
            let updateWorkspaceSnippets = () => {
                disposables.clear();
                this._pendingWork.push(this._initWorkspaceFolderSnippets(this._contextService.getWorkspace(), disposables));
            };
            this._disposables.add(disposables);
            this._disposables.add(this._contextService.onDidChangeWorkspaceFolders(updateWorkspaceSnippets));
            this._disposables.add(this._contextService.onDidChangeWorkbenchState(updateWorkspaceSnippets));
            updateWorkspaceSnippets();
        }
        _initWorkspaceFolderSnippets(workspace, bucket) {
            let promises = workspace.folders.map(folder => {
                const snippetFolder = folder.toResource('.vscode');
                return this._fileService.exists(snippetFolder).then(value => {
                    if (value) {
                        this._initFolderSnippets(2 /* Workspace */, snippetFolder, bucket);
                    }
                    else {
                        // watch
                        bucket.add(this._fileService.onDidFilesChange(e => {
                            if (e.contains(snippetFolder, 1 /* ADDED */)) {
                                this._initFolderSnippets(2 /* Workspace */, snippetFolder, bucket);
                            }
                        }));
                    }
                });
            });
            return Promise.all(promises);
        }
        _initUserSnippets() {
            const userSnippetsFolder = this._environmentService.snippetsHome;
            return this._fileService.createFolder(userSnippetsFolder).then(() => this._initFolderSnippets(1 /* User */, userSnippetsFolder, this._disposables));
        }
        _initFolderSnippets(source, folder, bucket) {
            const disposables = new lifecycle_1.DisposableStore();
            const addFolderSnippets = (type) => {
                disposables.clear();
                if (type === 2 /* DELETED */) {
                    return Promise.resolve();
                }
                return this._fileService.resolve(folder).then(stat => {
                    for (const entry of stat.children || []) {
                        disposables.add(this._addSnippetFile(entry.resource, source));
                    }
                }, err => {
                    this._logService.error(`Failed snippets from folder '${folder.toString()}'`, err);
                });
            };
            bucket.add(watch(this._fileService, folder, addFolderSnippets));
            bucket.add(disposables);
            return addFolderSnippets();
        }
        _addSnippetFile(uri, source) {
            const ext = resources.extname(uri);
            const key = uri.toString();
            if (source === 1 /* User */ && ext === '.json') {
                const langName = resources.basename(uri).replace(/\.json/, '');
                this._files.set(key, new snippetsFile_1.SnippetFile(source, uri, [langName], undefined, this._fileService, this._extensionResourceLoaderService));
            }
            else if (ext === '.code-snippets') {
                this._files.set(key, new snippetsFile_1.SnippetFile(source, uri, undefined, undefined, this._fileService, this._extensionResourceLoaderService));
            }
            return {
                dispose: () => this._files.delete(key)
            };
        }
    };
    SnippetsService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, modeService_1.IModeService),
        __param(3, log_1.ILogService),
        __param(4, files_1.IFileService),
        __param(5, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(6, lifecycle_2.ILifecycleService)
    ], SnippetsService);
    extensions_1.registerSingleton(snippets_contribution_1.ISnippetsService, SnippetsService, true);
    function getNonWhitespacePrefix(model, position) {
        /**
         * Do not analyze more characters
         */
        const MAX_PREFIX_LENGTH = 100;
        let line = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
        let minChIndex = Math.max(0, line.length - MAX_PREFIX_LENGTH);
        for (let chIndex = line.length - 1; chIndex >= minChIndex; chIndex--) {
            let ch = line.charAt(chIndex);
            if (/\s/.test(ch)) {
                return line.substr(chIndex + 1);
            }
        }
        if (minChIndex === 0) {
            return line;
        }
        return '';
    }
    exports.getNonWhitespacePrefix = getNonWhitespacePrefix;
});
//# __sourceMappingURL=snippetsService.js.map