/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/contrib/quickAccess/editorNavigationQuickAccess", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/base/common/strings", "vs/base/common/fuzzyScorer", "vs/base/common/iterator", "vs/base/common/codicons"], function (require, exports, nls_1, cancellation_1, lifecycle_1, range_1, editorNavigationQuickAccess_1, modes_1, outlineModel_1, strings_1, fuzzyScorer_1, iterator_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractGotoSymbolQuickAccessProvider = void 0;
    class AbstractGotoSymbolQuickAccessProvider extends editorNavigationQuickAccess_1.AbstractEditorNavigationQuickAccessProvider {
        constructor(options = Object.create(null)) {
            super(options);
            this.options = options;
            options.canAcceptInBackground = true;
        }
        provideWithoutTextEditor(picker) {
            this.provideLabelPick(picker, nls_1.localize('cannotRunGotoSymbolWithoutEditor', "To go to a symbol, first open a text editor with symbol information."));
            return lifecycle_1.Disposable.None;
        }
        provideWithTextEditor(editor, picker, token) {
            const model = this.getModel(editor);
            if (!model) {
                return lifecycle_1.Disposable.None;
            }
            // Provide symbols from model if available in registry
            if (modes_1.DocumentSymbolProviderRegistry.has(model)) {
                return this.doProvideWithEditorSymbols(editor, model, picker, token);
            }
            // Otherwise show an entry for a model without registry
            // But give a chance to resolve the symbols at a later
            // point if possible
            return this.doProvideWithoutEditorSymbols(editor, model, picker, token);
        }
        doProvideWithoutEditorSymbols(editor, model, picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Generic pick for not having any symbol information
            this.provideLabelPick(picker, nls_1.localize('cannotRunGotoSymbolWithoutSymbolProvider', "The active text editor does not provide symbol information."));
            // Wait for changes to the registry and see if eventually
            // we do get symbols. This can happen if the picker is opened
            // very early after the model has loaded but before the
            // language registry is ready.
            // https://github.com/microsoft/vscode/issues/70607
            (async () => {
                const result = await this.waitForLanguageSymbolRegistry(model, disposables);
                if (!result || token.isCancellationRequested) {
                    return;
                }
                disposables.add(this.doProvideWithEditorSymbols(editor, model, picker, token));
            })();
            return disposables;
        }
        provideLabelPick(picker, label) {
            picker.items = [{ label, index: 0, kind: 14 /* String */ }];
            picker.ariaLabel = label;
        }
        async waitForLanguageSymbolRegistry(model, disposables) {
            if (modes_1.DocumentSymbolProviderRegistry.has(model)) {
                return true;
            }
            let symbolProviderRegistryPromiseResolve;
            const symbolProviderRegistryPromise = new Promise(resolve => symbolProviderRegistryPromiseResolve = resolve);
            // Resolve promise when registry knows model
            const symbolProviderListener = disposables.add(modes_1.DocumentSymbolProviderRegistry.onDidChange(() => {
                if (modes_1.DocumentSymbolProviderRegistry.has(model)) {
                    symbolProviderListener.dispose();
                    symbolProviderRegistryPromiseResolve(true);
                }
            }));
            // Resolve promise when we get disposed too
            disposables.add(lifecycle_1.toDisposable(() => symbolProviderRegistryPromiseResolve(false)));
            return symbolProviderRegistryPromise;
        }
        doProvideWithEditorSymbols(editor, model, picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Goto symbol once picked
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (item && item.range) {
                    this.gotoLocation(editor, { range: item.range.selection, keyMods: picker.keyMods, preserveFocus: event.inBackground });
                    if (!event.inBackground) {
                        picker.hide();
                    }
                }
            }));
            // Goto symbol side by side if enabled
            disposables.add(picker.onDidTriggerItemButton(({ item }) => {
                if (item && item.range) {
                    this.gotoLocation(editor, { range: item.range.selection, keyMods: picker.keyMods, forceSideBySide: true });
                    picker.hide();
                }
            }));
            // Resolve symbols from document once and reuse this
            // request for all filtering and typing then on
            const symbolsPromise = this.getDocumentSymbols(model, true, token);
            // Set initial picks and update on type
            let picksCts = undefined;
            const updatePickerItems = async () => {
                // Cancel any previous ask for picks and busy
                picksCts === null || picksCts === void 0 ? void 0 : picksCts.dispose(true);
                picker.busy = false;
                // Create new cancellation source for this run
                picksCts = new cancellation_1.CancellationTokenSource(token);
                // Collect symbol picks
                picker.busy = true;
                try {
                    const query = fuzzyScorer_1.prepareQuery(picker.value.substr(AbstractGotoSymbolQuickAccessProvider.PREFIX.length).trim());
                    const items = await this.doGetSymbolPicks(symbolsPromise, query, undefined, picksCts.token);
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (items.length > 0) {
                        picker.items = items;
                    }
                    else {
                        if (query.original.length > 0) {
                            this.provideLabelPick(picker, nls_1.localize('noMatchingSymbolResults', "No matching editor symbols"));
                        }
                        else {
                            this.provideLabelPick(picker, nls_1.localize('noSymbolResults', "No editor symbols"));
                        }
                    }
                }
                finally {
                    if (!token.isCancellationRequested) {
                        picker.busy = false;
                    }
                }
            };
            disposables.add(picker.onDidChangeValue(() => updatePickerItems()));
            updatePickerItems();
            // Reveal and decorate when active item changes
            // However, ignore the very first event so that
            // opening the picker is not immediately revealing
            // and decorating the first entry.
            let ignoreFirstActiveEvent = true;
            disposables.add(picker.onDidChangeActive(() => {
                const [item] = picker.activeItems;
                if (item && item.range) {
                    if (ignoreFirstActiveEvent) {
                        ignoreFirstActiveEvent = false;
                        return;
                    }
                    // Reveal
                    editor.revealRangeInCenter(item.range.selection, 0 /* Smooth */);
                    // Decorate
                    this.addDecorations(editor, item.range.decoration);
                }
            }));
            return disposables;
        }
        async doGetSymbolPicks(symbolsPromise, query, options, token) {
            const symbols = await symbolsPromise;
            if (token.isCancellationRequested) {
                return [];
            }
            const filterBySymbolKind = query.original.indexOf(AbstractGotoSymbolQuickAccessProvider.SCOPE_PREFIX) === 0;
            const filterPos = filterBySymbolKind ? 1 : 0;
            // Split between symbol and container query
            let symbolQuery;
            let containerQuery;
            if (query.values && query.values.length > 1) {
                symbolQuery = fuzzyScorer_1.pieceToQuery(query.values[0]); // symbol: only match on first part
                containerQuery = fuzzyScorer_1.pieceToQuery(query.values.slice(1)); // container: match on all but first parts
            }
            else {
                symbolQuery = query;
            }
            // Convert to symbol picks and apply filtering
            const filteredSymbolPicks = [];
            for (let index = 0; index < symbols.length; index++) {
                const symbol = symbols[index];
                const symbolLabel = strings_1.trim(symbol.name);
                const symbolLabelWithIcon = `$(symbol-${modes_1.SymbolKinds.toString(symbol.kind) || 'property'}) ${symbolLabel}`;
                const symbolLabelIconOffset = symbolLabelWithIcon.length - symbolLabel.length;
                let containerLabel = symbol.containerName;
                if (options === null || options === void 0 ? void 0 : options.extraContainerLabel) {
                    if (containerLabel) {
                        containerLabel = `${options.extraContainerLabel} • ${containerLabel}`;
                    }
                    else {
                        containerLabel = options.extraContainerLabel;
                    }
                }
                let symbolScore = undefined;
                let symbolMatches = undefined;
                let containerScore = undefined;
                let containerMatches = undefined;
                if (query.original.length > filterPos) {
                    // First: try to score on the entire query, it is possible that
                    // the symbol matches perfectly (e.g. searching for "change log"
                    // can be a match on a markdown symbol "change log"). In that
                    // case we want to skip the container query altogether.
                    let skipContainerQuery = false;
                    if (symbolQuery !== query) {
                        [symbolScore, symbolMatches] = fuzzyScorer_1.scoreFuzzy2(symbolLabelWithIcon, Object.assign(Object.assign({}, query), { values: undefined /* disable multi-query support */ }), filterPos, symbolLabelIconOffset);
                        if (typeof symbolScore === 'number') {
                            skipContainerQuery = true; // since we consumed the query, skip any container matching
                        }
                    }
                    // Otherwise: score on the symbol query and match on the container later
                    if (typeof symbolScore !== 'number') {
                        [symbolScore, symbolMatches] = fuzzyScorer_1.scoreFuzzy2(symbolLabelWithIcon, symbolQuery, filterPos, symbolLabelIconOffset);
                        if (typeof symbolScore !== 'number') {
                            continue;
                        }
                    }
                    // Score by container if specified
                    if (!skipContainerQuery && containerQuery) {
                        if (containerLabel && containerQuery.original.length > 0) {
                            [containerScore, containerMatches] = fuzzyScorer_1.scoreFuzzy2(containerLabel, containerQuery);
                        }
                        if (typeof containerScore !== 'number') {
                            continue;
                        }
                        if (typeof symbolScore === 'number') {
                            symbolScore += containerScore; // boost symbolScore by containerScore
                        }
                    }
                }
                const deprecated = symbol.tags && symbol.tags.indexOf(1 /* Deprecated */) >= 0;
                filteredSymbolPicks.push({
                    index,
                    kind: symbol.kind,
                    score: symbolScore,
                    label: symbolLabelWithIcon,
                    ariaLabel: symbolLabel,
                    description: containerLabel,
                    highlights: deprecated ? undefined : {
                        label: symbolMatches,
                        description: containerMatches
                    },
                    range: {
                        selection: range_1.Range.collapseToStart(symbol.selectionRange),
                        decoration: symbol.range
                    },
                    strikethrough: deprecated,
                    buttons: (() => {
                        var _a;
                        const openSideBySideDirection = (_a = this.options) === null || _a === void 0 ? void 0 : _a.openSideBySideDirection();
                        if (!openSideBySideDirection) {
                            return undefined;
                        }
                        return [
                            {
                                iconClass: openSideBySideDirection === 'right' ? codicons_1.Codicon.splitHorizontal.classNames : codicons_1.Codicon.splitVertical.classNames,
                                tooltip: openSideBySideDirection === 'right' ? nls_1.localize('openToSide', "Open to the Side") : nls_1.localize('openToBottom', "Open to the Bottom")
                            }
                        ];
                    })()
                });
            }
            // Sort by score
            const sortedFilteredSymbolPicks = filteredSymbolPicks.sort((symbolA, symbolB) => filterBySymbolKind ?
                this.compareByKindAndScore(symbolA, symbolB) :
                this.compareByScore(symbolA, symbolB));
            // Add separator for types
            // - @  only total number of symbols
            // - @: grouped by symbol kind
            let symbolPicks = [];
            if (filterBySymbolKind) {
                let lastSymbolKind = undefined;
                let lastSeparator = undefined;
                let lastSymbolKindCounter = 0;
                function updateLastSeparatorLabel() {
                    if (lastSeparator && typeof lastSymbolKind === 'number' && lastSymbolKindCounter > 0) {
                        lastSeparator.label = strings_1.format(NLS_SYMBOL_KIND_CACHE[lastSymbolKind] || FALLBACK_NLS_SYMBOL_KIND, lastSymbolKindCounter);
                    }
                }
                for (const symbolPick of sortedFilteredSymbolPicks) {
                    // Found new kind
                    if (lastSymbolKind !== symbolPick.kind) {
                        // Update last separator with number of symbols we found for kind
                        updateLastSeparatorLabel();
                        lastSymbolKind = symbolPick.kind;
                        lastSymbolKindCounter = 1;
                        // Add new separator for new kind
                        lastSeparator = { type: 'separator' };
                        symbolPicks.push(lastSeparator);
                    }
                    // Existing kind, keep counting
                    else {
                        lastSymbolKindCounter++;
                    }
                    // Add to final result
                    symbolPicks.push(symbolPick);
                }
                // Update last separator with number of symbols we found for kind
                updateLastSeparatorLabel();
            }
            else if (sortedFilteredSymbolPicks.length > 0) {
                symbolPicks = [
                    { label: nls_1.localize('symbols', "symbols ({0})", filteredSymbolPicks.length), type: 'separator' },
                    ...sortedFilteredSymbolPicks
                ];
            }
            return symbolPicks;
        }
        compareByScore(symbolA, symbolB) {
            if (typeof symbolA.score !== 'number' && typeof symbolB.score === 'number') {
                return 1;
            }
            else if (typeof symbolA.score === 'number' && typeof symbolB.score !== 'number') {
                return -1;
            }
            if (typeof symbolA.score === 'number' && typeof symbolB.score === 'number') {
                if (symbolA.score > symbolB.score) {
                    return -1;
                }
                else if (symbolA.score < symbolB.score) {
                    return 1;
                }
            }
            if (symbolA.index < symbolB.index) {
                return -1;
            }
            else if (symbolA.index > symbolB.index) {
                return 1;
            }
            return 0;
        }
        compareByKindAndScore(symbolA, symbolB) {
            const kindA = NLS_SYMBOL_KIND_CACHE[symbolA.kind] || FALLBACK_NLS_SYMBOL_KIND;
            const kindB = NLS_SYMBOL_KIND_CACHE[symbolB.kind] || FALLBACK_NLS_SYMBOL_KIND;
            // Sort by type first if scoped search
            const result = kindA.localeCompare(kindB);
            if (result === 0) {
                return this.compareByScore(symbolA, symbolB);
            }
            return result;
        }
        async getDocumentSymbols(document, flatten, token) {
            const model = await outlineModel_1.OutlineModel.create(document, token);
            if (token.isCancellationRequested) {
                return [];
            }
            const roots = [];
            for (const child of model.children.values()) {
                if (child instanceof outlineModel_1.OutlineElement) {
                    roots.push(child.symbol);
                }
                else {
                    roots.push(...iterator_1.Iterable.map(child.children.values(), child => child.symbol));
                }
            }
            let flatEntries = [];
            if (flatten) {
                this.flattenDocumentSymbols(flatEntries, roots, '');
            }
            else {
                flatEntries = roots;
            }
            return flatEntries.sort((symbolA, symbolB) => range_1.Range.compareRangesUsingStarts(symbolA.range, symbolB.range));
        }
        flattenDocumentSymbols(bucket, entries, overrideContainerLabel) {
            for (const entry of entries) {
                bucket.push({
                    kind: entry.kind,
                    tags: entry.tags,
                    name: entry.name,
                    detail: entry.detail,
                    containerName: entry.containerName || overrideContainerLabel,
                    range: entry.range,
                    selectionRange: entry.selectionRange,
                    children: undefined,
                });
                // Recurse over children
                if (entry.children) {
                    this.flattenDocumentSymbols(bucket, entry.children, entry.name);
                }
            }
        }
    }
    exports.AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider;
    AbstractGotoSymbolQuickAccessProvider.PREFIX = '@';
    AbstractGotoSymbolQuickAccessProvider.SCOPE_PREFIX = ':';
    AbstractGotoSymbolQuickAccessProvider.PREFIX_BY_CATEGORY = `${AbstractGotoSymbolQuickAccessProvider.PREFIX}${AbstractGotoSymbolQuickAccessProvider.SCOPE_PREFIX}`;
    // #region NLS Helpers
    const FALLBACK_NLS_SYMBOL_KIND = nls_1.localize('property', "properties ({0})");
    const NLS_SYMBOL_KIND_CACHE = {
        [5 /* Method */]: nls_1.localize('method', "methods ({0})"),
        [11 /* Function */]: nls_1.localize('function', "functions ({0})"),
        [8 /* Constructor */]: nls_1.localize('_constructor', "constructors ({0})"),
        [12 /* Variable */]: nls_1.localize('variable', "variables ({0})"),
        [4 /* Class */]: nls_1.localize('class', "classes ({0})"),
        [22 /* Struct */]: nls_1.localize('struct', "structs ({0})"),
        [23 /* Event */]: nls_1.localize('event', "events ({0})"),
        [24 /* Operator */]: nls_1.localize('operator', "operators ({0})"),
        [10 /* Interface */]: nls_1.localize('interface', "interfaces ({0})"),
        [2 /* Namespace */]: nls_1.localize('namespace', "namespaces ({0})"),
        [3 /* Package */]: nls_1.localize('package', "packages ({0})"),
        [25 /* TypeParameter */]: nls_1.localize('typeParameter', "type parameters ({0})"),
        [1 /* Module */]: nls_1.localize('modules', "modules ({0})"),
        [6 /* Property */]: nls_1.localize('property', "properties ({0})"),
        [9 /* Enum */]: nls_1.localize('enum', "enumerations ({0})"),
        [21 /* EnumMember */]: nls_1.localize('enumMember', "enumeration members ({0})"),
        [14 /* String */]: nls_1.localize('string', "strings ({0})"),
        [0 /* File */]: nls_1.localize('file', "files ({0})"),
        [17 /* Array */]: nls_1.localize('array', "arrays ({0})"),
        [15 /* Number */]: nls_1.localize('number', "numbers ({0})"),
        [16 /* Boolean */]: nls_1.localize('boolean', "booleans ({0})"),
        [18 /* Object */]: nls_1.localize('object', "objects ({0})"),
        [19 /* Key */]: nls_1.localize('key', "keys ({0})"),
        [7 /* Field */]: nls_1.localize('field', "fields ({0})"),
        [13 /* Constant */]: nls_1.localize('constant', "constants ({0})")
    };
});
//#endregion
//# __sourceMappingURL=gotoSymbolQuickAccess.js.map