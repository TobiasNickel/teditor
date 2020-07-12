/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/core/position", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation", "vs/editor/common/core/range", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/editor/contrib/snippet/snippetParser"], function (require, exports, errors_1, editorExtensions_1, modes, position_1, contextkey_1, cancellation_1, range_1, filters_1, lifecycle_1, actions_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showSimpleSuggestions = exports.getSuggestionComparator = exports.provideSuggestionItems = exports.setSnippetSuggestSupport = exports.getSnippetSuggestSupport = exports.CompletionOptions = exports.SnippetSortOrder = exports.CompletionItem = exports.suggestWidgetStatusbarMenu = exports.Context = void 0;
    exports.Context = {
        Visible: new contextkey_1.RawContextKey('suggestWidgetVisible', false),
        DetailsVisible: new contextkey_1.RawContextKey('suggestWidgetDetailsVisible', false),
        MultipleSuggestions: new contextkey_1.RawContextKey('suggestWidgetMultipleSuggestions', false),
        MakesTextEdit: new contextkey_1.RawContextKey('suggestionMakesTextEdit', true),
        AcceptSuggestionsOnEnter: new contextkey_1.RawContextKey('acceptSuggestionOnEnter', true),
        HasInsertAndReplaceRange: new contextkey_1.RawContextKey('suggestionHasInsertAndReplaceRange', false),
        CanResolve: new contextkey_1.RawContextKey('suggestionCanResolve', false),
    };
    exports.suggestWidgetStatusbarMenu = new actions_1.MenuId('suggestWidgetStatusBar');
    class CompletionItem {
        constructor(position, completion, container, provider) {
            this.position = position;
            this.completion = completion;
            this.container = container;
            this.provider = provider;
            // validation
            this.isInvalid = false;
            // sorting, filtering
            this.score = filters_1.FuzzyScore.Default;
            this.distance = 0;
            this.textLabel = typeof completion.label === 'string'
                ? completion.label
                : completion.label.name;
            // ensure lower-variants (perf)
            this.labelLow = this.textLabel.toLowerCase();
            // validate label
            this.isInvalid = !this.textLabel;
            this.sortTextLow = completion.sortText && completion.sortText.toLowerCase();
            this.filterTextLow = completion.filterText && completion.filterText.toLowerCase();
            // normalize ranges
            if (range_1.Range.isIRange(completion.range)) {
                this.editStart = new position_1.Position(completion.range.startLineNumber, completion.range.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                // validate range
                this.isInvalid = this.isInvalid
                    || range_1.Range.spansMultipleLines(completion.range) || completion.range.startLineNumber !== position.lineNumber;
            }
            else {
                this.editStart = new position_1.Position(completion.range.insert.startLineNumber, completion.range.insert.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.insert.endLineNumber, completion.range.insert.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.replace.endLineNumber, completion.range.replace.endColumn);
                // validate ranges
                this.isInvalid = this.isInvalid
                    || range_1.Range.spansMultipleLines(completion.range.insert) || range_1.Range.spansMultipleLines(completion.range.replace)
                    || completion.range.insert.startLineNumber !== position.lineNumber || completion.range.replace.startLineNumber !== position.lineNumber
                    || completion.range.insert.startColumn !== completion.range.replace.startColumn;
            }
            // create the suggestion resolver
            if (typeof provider.resolveCompletionItem !== 'function') {
                this._resolveCache = Promise.resolve();
                this._isResolved = true;
            }
        }
        // ---- resolving
        get isResolved() {
            return !!this._isResolved;
        }
        async resolve(token) {
            if (!this._resolveCache) {
                const sub = token.onCancellationRequested(() => {
                    this._resolveCache = undefined;
                    this._isResolved = false;
                });
                this._resolveCache = Promise.resolve(this.provider.resolveCompletionItem(this.completion, token)).then(value => {
                    Object.assign(this.completion, value);
                    this._isResolved = true;
                    sub.dispose();
                }, err => {
                    if (errors_1.isPromiseCanceledError(err)) {
                        // the IPC queue will reject the request with the
                        // cancellation error -> reset cached
                        this._resolveCache = undefined;
                        this._isResolved = false;
                    }
                });
            }
            return this._resolveCache;
        }
    }
    exports.CompletionItem = CompletionItem;
    var SnippetSortOrder;
    (function (SnippetSortOrder) {
        SnippetSortOrder[SnippetSortOrder["Top"] = 0] = "Top";
        SnippetSortOrder[SnippetSortOrder["Inline"] = 1] = "Inline";
        SnippetSortOrder[SnippetSortOrder["Bottom"] = 2] = "Bottom";
    })(SnippetSortOrder = exports.SnippetSortOrder || (exports.SnippetSortOrder = {}));
    class CompletionOptions {
        constructor(snippetSortOrder = 2 /* Bottom */, kindFilter = new Set(), providerFilter = new Set()) {
            this.snippetSortOrder = snippetSortOrder;
            this.kindFilter = kindFilter;
            this.providerFilter = providerFilter;
        }
    }
    exports.CompletionOptions = CompletionOptions;
    CompletionOptions.default = new CompletionOptions();
    let _snippetSuggestSupport;
    function getSnippetSuggestSupport() {
        return _snippetSuggestSupport;
    }
    exports.getSnippetSuggestSupport = getSnippetSuggestSupport;
    function setSnippetSuggestSupport(support) {
        const old = _snippetSuggestSupport;
        _snippetSuggestSupport = support;
        return old;
    }
    exports.setSnippetSuggestSupport = setSnippetSuggestSupport;
    class CompletionItemModel {
        constructor(items, needsClipboard, dispoables) {
            this.items = items;
            this.needsClipboard = needsClipboard;
            this.dispoables = dispoables;
        }
    }
    async function provideSuggestionItems(model, position, options = CompletionOptions.default, context = { triggerKind: 0 /* Invoke */ }, token = cancellation_1.CancellationToken.None) {
        // const t1 = Date.now();
        position = position.clone();
        const word = model.getWordAtPosition(position);
        const defaultReplaceRange = word ? new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn) : range_1.Range.fromPositions(position);
        const defaultRange = { replace: defaultReplaceRange, insert: defaultReplaceRange.setEndPosition(position.lineNumber, position.column) };
        const result = [];
        const disposables = new lifecycle_1.DisposableStore();
        let needsClipboard = false;
        const onCompletionList = (provider, container) => {
            if (!container) {
                return;
            }
            for (let suggestion of container.suggestions) {
                if (!options.kindFilter.has(suggestion.kind)) {
                    // fill in default range when missing
                    if (!suggestion.range) {
                        suggestion.range = defaultRange;
                    }
                    // fill in default sortText when missing
                    if (!suggestion.sortText) {
                        suggestion.sortText = typeof suggestion.label === 'string' ? suggestion.label : suggestion.label.name;
                    }
                    if (!needsClipboard && suggestion.insertTextRules && suggestion.insertTextRules & 4 /* InsertAsSnippet */) {
                        needsClipboard = snippetParser_1.SnippetParser.guessNeedsClipboard(suggestion.insertText);
                    }
                    result.push(new CompletionItem(position, suggestion, container, provider));
                }
            }
            if (lifecycle_1.isDisposable(container)) {
                disposables.add(container);
            }
        };
        // ask for snippets in parallel to asking "real" providers. Only do something if configured to
        // do so - no snippet filter, no special-providers-only request
        const snippetCompletions = (async () => {
            if (!_snippetSuggestSupport || options.kindFilter.has(27 /* Snippet */)) {
                return;
            }
            if (options.providerFilter.size > 0 && !options.providerFilter.has(_snippetSuggestSupport)) {
                return;
            }
            const list = await _snippetSuggestSupport.provideCompletionItems(model, position, context, token);
            onCompletionList(_snippetSuggestSupport, list);
        })();
        // add suggestions from contributed providers - providers are ordered in groups of
        // equal score and once a group produces a result the process stops
        // get provider groups, always add snippet suggestion provider
        for (let providerGroup of modes.CompletionProviderRegistry.orderedGroups(model)) {
            // for each support in the group ask for suggestions
            let lenBefore = result.length;
            await Promise.all(providerGroup.map(async (provider) => {
                if (options.providerFilter.size > 0 && !options.providerFilter.has(provider)) {
                    return;
                }
                try {
                    const list = await provider.provideCompletionItems(model, position, context, token);
                    onCompletionList(provider, list);
                }
                catch (err) {
                    errors_1.onUnexpectedExternalError(err);
                }
            }));
            if (lenBefore !== result.length || token.isCancellationRequested) {
                break;
            }
        }
        await snippetCompletions;
        if (token.isCancellationRequested) {
            disposables.dispose();
            return Promise.reject(errors_1.canceled());
        }
        // console.log(`${result.length} items AFTER ${Date.now() - t1}ms`);
        return new CompletionItemModel(result.sort(getSuggestionComparator(options.snippetSortOrder)), needsClipboard, disposables);
    }
    exports.provideSuggestionItems = provideSuggestionItems;
    function defaultComparator(a, b) {
        // check with 'sortText'
        if (a.sortTextLow && b.sortTextLow) {
            if (a.sortTextLow < b.sortTextLow) {
                return -1;
            }
            else if (a.sortTextLow > b.sortTextLow) {
                return 1;
            }
        }
        // check with 'label'
        if (a.completion.label < b.completion.label) {
            return -1;
        }
        else if (a.completion.label > b.completion.label) {
            return 1;
        }
        // check with 'type'
        return a.completion.kind - b.completion.kind;
    }
    function snippetUpComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 27 /* Snippet */) {
                return -1;
            }
            else if (b.completion.kind === 27 /* Snippet */) {
                return 1;
            }
        }
        return defaultComparator(a, b);
    }
    function snippetDownComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 27 /* Snippet */) {
                return 1;
            }
            else if (b.completion.kind === 27 /* Snippet */) {
                return -1;
            }
        }
        return defaultComparator(a, b);
    }
    const _snippetComparators = new Map();
    _snippetComparators.set(0 /* Top */, snippetUpComparator);
    _snippetComparators.set(2 /* Bottom */, snippetDownComparator);
    _snippetComparators.set(1 /* Inline */, defaultComparator);
    function getSuggestionComparator(snippetConfig) {
        return _snippetComparators.get(snippetConfig);
    }
    exports.getSuggestionComparator = getSuggestionComparator;
    editorExtensions_1.registerDefaultLanguageCommand('_executeCompletionItemProvider', async (model, position, args) => {
        const result = {
            incomplete: false,
            suggestions: []
        };
        const resolving = [];
        const maxItemsToResolve = args['maxItemsToResolve'] || 0;
        const completions = await provideSuggestionItems(model, position);
        for (const item of completions.items) {
            if (resolving.length < maxItemsToResolve) {
                resolving.push(item.resolve(cancellation_1.CancellationToken.None));
            }
            result.incomplete = result.incomplete || item.container.incomplete;
            result.suggestions.push(item.completion);
        }
        try {
            await Promise.all(resolving);
            return result;
        }
        finally {
            setTimeout(() => completions.dispoables.dispose(), 100);
        }
    });
    const _provider = new class {
        constructor() {
            this.onlyOnceSuggestions = [];
        }
        provideCompletionItems() {
            let suggestions = this.onlyOnceSuggestions.slice(0);
            let result = { suggestions };
            this.onlyOnceSuggestions.length = 0;
            return result;
        }
    };
    modes.CompletionProviderRegistry.register('*', _provider);
    function showSimpleSuggestions(editor, suggestions) {
        setTimeout(() => {
            _provider.onlyOnceSuggestions.push(...suggestions);
            editor.getContribution('editor.contrib.suggestController').triggerSuggest(new Set().add(_provider));
        }, 0);
    }
    exports.showSimpleSuggestions = showSimpleSuggestions;
});
//# __sourceMappingURL=suggest.js.map