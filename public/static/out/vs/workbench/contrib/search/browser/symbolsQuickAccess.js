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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/async", "vs/workbench/contrib/search/common/search", "vs/editor/common/modes", "vs/platform/label/common/label", "vs/base/common/network", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/find/findController", "vs/base/common/types", "vs/base/common/fuzzyScorer", "vs/base/common/codicons"], function (require, exports, nls_1, pickerQuickAccess_1, async_1, search_1, modes_1, label_1, network_1, opener_1, editorService_1, range_1, configuration_1, codeEditorService_1, findController_1, types_1, fuzzyScorer_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SymbolsQuickAccessProvider = void 0;
    let SymbolsQuickAccessProvider = class SymbolsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(labelService, openerService, editorService, configurationService, codeEditorService) {
            super(SymbolsQuickAccessProvider.PREFIX, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: nls_1.localize('noSymbolResults', "No matching workspace symbols")
                }
            });
            this.labelService = labelService;
            this.openerService = openerService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            this.delayer = this._register(new async_1.ThrottledDelayer(SymbolsQuickAccessProvider.TYPING_SEARCH_DELAY));
        }
        get defaultFilterValue() {
            // Prefer the word under the cursor in the active editor as default filter
            const editor = this.codeEditorService.getFocusedCodeEditor();
            if (editor) {
                return types_1.withNullAsUndefined(findController_1.getSelectionSearchString(editor));
            }
            return undefined;
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench.editor;
            return {
                openEditorPinned: !editorConfig.enablePreviewFromQuickOpen,
                openSideBySideDirection: editorConfig.openSideBySideDirection
            };
        }
        getPicks(filter, disposables, token) {
            return this.getSymbolPicks(filter, undefined, token);
        }
        async getSymbolPicks(filter, options, token) {
            return this.delayer.trigger(async () => {
                if (token.isCancellationRequested) {
                    return [];
                }
                return this.doGetSymbolPicks(fuzzyScorer_1.prepareQuery(filter), options, token);
            }, options === null || options === void 0 ? void 0 : options.delay);
        }
        async doGetSymbolPicks(query, options, token) {
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
            // Run the workspace symbol query
            const workspaceSymbols = await search_1.getWorkspaceSymbols(symbolQuery.original, token);
            if (token.isCancellationRequested) {
                return [];
            }
            const symbolPicks = [];
            // Convert to symbol picks and apply filtering
            const openSideBySideDirection = this.configuration.openSideBySideDirection;
            for (const [provider, symbols] of workspaceSymbols) {
                for (const symbol of symbols) {
                    // Depending on the workspace symbols filter setting, skip over symbols that:
                    // - do not have a container
                    // - and are not treated explicitly as global symbols (e.g. classes)
                    if ((options === null || options === void 0 ? void 0 : options.skipLocal) && !SymbolsQuickAccessProvider.TREAT_AS_GLOBAL_SYMBOL_TYPES.has(symbol.kind) && !!symbol.containerName) {
                        continue;
                    }
                    const symbolLabel = symbol.name;
                    const symbolLabelWithIcon = `$(symbol-${modes_1.SymbolKinds.toString(symbol.kind) || 'property'}) ${symbolLabel}`;
                    const symbolLabelIconOffset = symbolLabelWithIcon.length - symbolLabel.length;
                    // Score by symbol label if searching
                    let symbolScore = undefined;
                    let symbolMatches = undefined;
                    let skipContainerQuery = false;
                    if (symbolQuery.original.length > 0) {
                        // First: try to score on the entire query, it is possible that
                        // the symbol matches perfectly (e.g. searching for "change log"
                        // can be a match on a markdown symbol "change log"). In that
                        // case we want to skip the container query altogether.
                        if (symbolQuery !== query) {
                            [symbolScore, symbolMatches] = fuzzyScorer_1.scoreFuzzy2(symbolLabelWithIcon, Object.assign(Object.assign({}, query), { values: undefined /* disable multi-query support */ }), 0, symbolLabelIconOffset);
                            if (typeof symbolScore === 'number') {
                                skipContainerQuery = true; // since we consumed the query, skip any container matching
                            }
                        }
                        // Otherwise: score on the symbol query and match on the container later
                        if (typeof symbolScore !== 'number') {
                            [symbolScore, symbolMatches] = fuzzyScorer_1.scoreFuzzy2(symbolLabelWithIcon, symbolQuery, 0, symbolLabelIconOffset);
                            if (typeof symbolScore !== 'number') {
                                continue;
                            }
                        }
                    }
                    const symbolUri = symbol.location.uri;
                    let containerLabel = undefined;
                    if (symbolUri) {
                        const containerPath = this.labelService.getUriLabel(symbolUri, { relative: true });
                        if (symbol.containerName) {
                            containerLabel = `${symbol.containerName} • ${containerPath}`;
                        }
                        else {
                            containerLabel = containerPath;
                        }
                    }
                    // Score by container if specified and searching
                    let containerScore = undefined;
                    let containerMatches = undefined;
                    if (!skipContainerQuery && containerQuery && containerQuery.original.length > 0) {
                        if (containerLabel) {
                            [containerScore, containerMatches] = fuzzyScorer_1.scoreFuzzy2(containerLabel, containerQuery);
                        }
                        if (typeof containerScore !== 'number') {
                            continue;
                        }
                        if (typeof symbolScore === 'number') {
                            symbolScore += containerScore; // boost symbolScore by containerScore
                        }
                    }
                    const deprecated = symbol.tags ? symbol.tags.indexOf(1 /* Deprecated */) >= 0 : false;
                    symbolPicks.push({
                        symbol,
                        resource: symbolUri,
                        score: symbolScore,
                        label: symbolLabelWithIcon,
                        ariaLabel: symbolLabel,
                        highlights: deprecated ? undefined : {
                            label: symbolMatches,
                            description: containerMatches
                        },
                        description: containerLabel,
                        strikethrough: deprecated,
                        buttons: [
                            {
                                iconClass: openSideBySideDirection === 'right' ? codicons_1.Codicon.splitHorizontal.classNames : codicons_1.Codicon.splitVertical.classNames,
                                tooltip: openSideBySideDirection === 'right' ? nls_1.localize('openToSide', "Open to the Side") : nls_1.localize('openToBottom', "Open to the Bottom")
                            }
                        ],
                        trigger: (buttonIndex, keyMods) => {
                            this.openSymbol(provider, symbol, token, { keyMods, forceOpenSideBySide: true });
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        accept: async (keyMods, event) => this.openSymbol(provider, symbol, token, { keyMods, preserveFocus: event.inBackground, forcePinned: event.inBackground }),
                    });
                }
            }
            // Sort picks (unless disabled)
            if (!(options === null || options === void 0 ? void 0 : options.skipSorting)) {
                symbolPicks.sort((symbolA, symbolB) => this.compareSymbols(symbolA, symbolB));
            }
            return symbolPicks;
        }
        async openSymbol(provider, symbol, token, options) {
            // Resolve actual symbol to open for providers that can resolve
            let symbolToOpen = symbol;
            if (typeof provider.resolveWorkspaceSymbol === 'function' && !symbol.location.range) {
                symbolToOpen = await provider.resolveWorkspaceSymbol(symbol, token) || symbol;
                if (token.isCancellationRequested) {
                    return;
                }
            }
            // Open HTTP(s) links with opener service
            if (symbolToOpen.location.uri.scheme === network_1.Schemas.http || symbolToOpen.location.uri.scheme === network_1.Schemas.https) {
                await this.openerService.open(symbolToOpen.location.uri, { fromUserGesture: true });
            }
            // Otherwise open as editor
            else {
                await this.editorService.openEditor({
                    resource: symbolToOpen.location.uri,
                    options: {
                        preserveFocus: options === null || options === void 0 ? void 0 : options.preserveFocus,
                        pinned: options.keyMods.alt || options.forcePinned || this.configuration.openEditorPinned,
                        selection: symbolToOpen.location.range ? range_1.Range.collapseToStart(symbolToOpen.location.range) : undefined
                    }
                }, options.keyMods.ctrlCmd || (options === null || options === void 0 ? void 0 : options.forceOpenSideBySide) ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            }
        }
        compareSymbols(symbolA, symbolB) {
            // By score
            if (typeof symbolA.score === 'number' && typeof symbolB.score === 'number') {
                if (symbolA.score > symbolB.score) {
                    return -1;
                }
                if (symbolA.score < symbolB.score) {
                    return 1;
                }
            }
            // By name
            if (symbolA.symbol && symbolB.symbol) {
                const symbolAName = symbolA.symbol.name.toLowerCase();
                const symbolBName = symbolB.symbol.name.toLowerCase();
                const res = symbolAName.localeCompare(symbolBName);
                if (res !== 0) {
                    return res;
                }
            }
            // By kind
            if (symbolA.symbol && symbolB.symbol) {
                const symbolAKind = modes_1.SymbolKinds.toCssClassName(symbolA.symbol.kind);
                const symbolBKind = modes_1.SymbolKinds.toCssClassName(symbolB.symbol.kind);
                return symbolAKind.localeCompare(symbolBKind);
            }
            return 0;
        }
    };
    SymbolsQuickAccessProvider.PREFIX = '#';
    SymbolsQuickAccessProvider.TYPING_SEARCH_DELAY = 200; // this delay accommodates for the user typing a word and then stops typing to start searching
    SymbolsQuickAccessProvider.TREAT_AS_GLOBAL_SYMBOL_TYPES = new Set([
        4 /* Class */,
        9 /* Enum */,
        0 /* File */,
        10 /* Interface */,
        2 /* Namespace */,
        3 /* Package */,
        1 /* Module */
    ]);
    SymbolsQuickAccessProvider = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, opener_1.IOpenerService),
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, codeEditorService_1.ICodeEditorService)
    ], SymbolsQuickAccessProvider);
    exports.SymbolsQuickAccessProvider = SymbolsQuickAccessProvider;
});
//# __sourceMappingURL=symbolsQuickAccess.js.map