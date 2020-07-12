/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/base/common/collections", "vs/nls", "vs/base/common/path", "vs/editor/contrib/snippet/snippetParser", "vs/editor/contrib/snippet/snippetVariables", "vs/base/common/strings", "vs/base/common/async"], function (require, exports, json_1, collections_1, nls_1, path_1, snippetParser_1, snippetVariables_1, strings_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetFile = exports.SnippetSource = exports.Snippet = void 0;
    class SnippetBodyInsights {
        constructor(body) {
            // init with defaults
            this.isBogous = false;
            this.needsClipboard = false;
            this.codeSnippet = body;
            // check snippet...
            const textmateSnippet = new snippetParser_1.SnippetParser().parse(body, false);
            let placeholders = new Map();
            let placeholderMax = 0;
            for (const placeholder of textmateSnippet.placeholders) {
                placeholderMax = Math.max(placeholderMax, placeholder.index);
            }
            let stack = [...textmateSnippet.children];
            while (stack.length > 0) {
                const marker = stack.shift();
                if (marker instanceof snippetParser_1.Variable) {
                    if (marker.children.length === 0 && !snippetVariables_1.KnownSnippetVariableNames[marker.name]) {
                        // a 'variable' without a default value and not being one of our supported
                        // variables is automatically turned into a placeholder. This is to restore
                        // a bug we had before. So `${foo}` becomes `${N:foo}`
                        const index = placeholders.has(marker.name) ? placeholders.get(marker.name) : ++placeholderMax;
                        placeholders.set(marker.name, index);
                        const synthetic = new snippetParser_1.Placeholder(index).appendChild(new snippetParser_1.Text(marker.name));
                        textmateSnippet.replace(marker, [synthetic]);
                        this.isBogous = true;
                    }
                    if (marker.name === 'CLIPBOARD') {
                        this.needsClipboard = true;
                    }
                }
                else {
                    // recurse
                    stack.push(...marker.children);
                }
            }
            if (this.isBogous) {
                this.codeSnippet = textmateSnippet.toTextmateString();
            }
        }
    }
    class Snippet {
        constructor(scopes, name, prefix, description, body, source, snippetSource) {
            this.scopes = scopes;
            this.name = name;
            this.prefix = prefix;
            this.description = description;
            this.body = body;
            this.source = source;
            this.snippetSource = snippetSource;
            //
            this.prefixLow = prefix ? prefix.toLowerCase() : prefix;
            this._bodyInsights = new async_1.IdleValue(() => new SnippetBodyInsights(this.body));
        }
        get codeSnippet() {
            return this._bodyInsights.value.codeSnippet;
        }
        get isBogous() {
            return this._bodyInsights.value.isBogous;
        }
        get needsClipboard() {
            return this._bodyInsights.value.needsClipboard;
        }
        static compare(a, b) {
            if (a.snippetSource < b.snippetSource) {
                return -1;
            }
            else if (a.snippetSource > b.snippetSource) {
                return 1;
            }
            else if (a.name > b.name) {
                return 1;
            }
            else if (a.name < b.name) {
                return -1;
            }
            else {
                return 0;
            }
        }
    }
    exports.Snippet = Snippet;
    function isJsonSerializedSnippet(thing) {
        return Boolean(thing.body) && Boolean(thing.prefix);
    }
    var SnippetSource;
    (function (SnippetSource) {
        SnippetSource[SnippetSource["User"] = 1] = "User";
        SnippetSource[SnippetSource["Workspace"] = 2] = "Workspace";
        SnippetSource[SnippetSource["Extension"] = 3] = "Extension";
    })(SnippetSource = exports.SnippetSource || (exports.SnippetSource = {}));
    class SnippetFile {
        constructor(source, location, defaultScopes, _extension, _fileService, _extensionResourceLoaderService) {
            this.source = source;
            this.location = location;
            this.defaultScopes = defaultScopes;
            this._extension = _extension;
            this._fileService = _fileService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this.data = [];
            this.isGlobalSnippets = path_1.extname(location.path) === '.code-snippets';
            this.isUserSnippets = !this._extension;
        }
        select(selector, bucket) {
            if (this.isGlobalSnippets || !this.isUserSnippets) {
                this._scopeSelect(selector, bucket);
            }
            else {
                this._filepathSelect(selector, bucket);
            }
        }
        _filepathSelect(selector, bucket) {
            // for `fooLang.json` files all snippets are accepted
            if (selector + '.json' === path_1.basename(this.location.path)) {
                bucket.push(...this.data);
            }
        }
        _scopeSelect(selector, bucket) {
            // for `my.code-snippets` files we need to look at each snippet
            for (const snippet of this.data) {
                const len = snippet.scopes.length;
                if (len === 0) {
                    // always accept
                    bucket.push(snippet);
                }
                else {
                    for (let i = 0; i < len; i++) {
                        // match
                        if (snippet.scopes[i] === selector) {
                            bucket.push(snippet);
                            break; // match only once!
                        }
                    }
                }
            }
            let idx = selector.lastIndexOf('.');
            if (idx >= 0) {
                this._scopeSelect(selector.substring(0, idx), bucket);
            }
        }
        async _load() {
            if (this._extension) {
                return this._extensionResourceLoaderService.readExtensionResource(this.location);
            }
            else {
                const content = await this._fileService.readFile(this.location);
                return content.value.toString();
            }
        }
        load() {
            if (!this._loadPromise) {
                this._loadPromise = Promise.resolve(this._load()).then(content => {
                    const data = json_1.parse(content);
                    if (json_1.getNodeType(data) === 'object') {
                        collections_1.forEach(data, entry => {
                            const { key: name, value: scopeOrTemplate } = entry;
                            if (isJsonSerializedSnippet(scopeOrTemplate)) {
                                this._parseSnippet(name, scopeOrTemplate, this.data);
                            }
                            else {
                                collections_1.forEach(scopeOrTemplate, entry => {
                                    const { key: name, value: template } = entry;
                                    this._parseSnippet(name, template, this.data);
                                });
                            }
                        });
                    }
                    return this;
                });
            }
            return this._loadPromise;
        }
        reset() {
            this._loadPromise = undefined;
            this.data.length = 0;
        }
        _parseSnippet(name, snippet, bucket) {
            let { prefix, body, description } = snippet;
            if (Array.isArray(body)) {
                body = body.join('\n');
            }
            if (Array.isArray(description)) {
                description = description.join('\n');
            }
            if ((typeof prefix !== 'string' && !Array.isArray(prefix)) || typeof body !== 'string') {
                return;
            }
            let scopes;
            if (this.defaultScopes) {
                scopes = this.defaultScopes;
            }
            else if (typeof snippet.scope === 'string') {
                scopes = snippet.scope.split(',').map(s => s.trim()).filter(s => !strings_1.isFalsyOrWhitespace(s));
            }
            else {
                scopes = [];
            }
            let source;
            if (this._extension) {
                // extension snippet -> show the name of the extension
                source = this._extension.displayName || this._extension.name;
            }
            else if (this.source === 2 /* Workspace */) {
                // workspace -> only *.code-snippets files
                source = nls_1.localize('source.workspaceSnippetGlobal', "Workspace Snippet");
            }
            else {
                // user -> global (*.code-snippets) and language snippets
                if (this.isGlobalSnippets) {
                    source = nls_1.localize('source.userSnippetGlobal', "Global User Snippet");
                }
                else {
                    source = nls_1.localize('source.userSnippet', "User Snippet");
                }
            }
            let prefixes = Array.isArray(prefix) ? prefix : [prefix];
            prefixes.forEach(p => {
                bucket.push(new Snippet(scopes, name, p, description, body, source, this.source));
            });
        }
    }
    exports.SnippetFile = SnippetFile;
});
//# __sourceMappingURL=snippetsFile.js.map