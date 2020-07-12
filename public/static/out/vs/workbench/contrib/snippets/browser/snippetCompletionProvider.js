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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/services/modeService", "vs/editor/contrib/snippet/snippetParser", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/base/common/filters"], function (require, exports, htmlContent_1, strings_1, range_1, modeService_1, snippetParser_1, nls_1, snippets_contribution_1, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetCompletionProvider = exports.SnippetCompletion = void 0;
    class SnippetCompletion {
        constructor(snippet, range) {
            this.snippet = snippet;
            this.label = {
                name: snippet.prefix,
                type: nls_1.localize('detail.snippet', "{0} ({1})", snippet.description || snippet.name, snippet.source)
            };
            this.detail = this.label.type;
            this.insertText = snippet.codeSnippet;
            this.range = range;
            this.sortText = `${snippet.snippetSource === 3 /* Extension */ ? 'z' : 'a'}-${snippet.prefix}`;
            this.kind = 27 /* Snippet */;
            this.insertTextRules = 4 /* InsertAsSnippet */;
        }
        resolve() {
            this.documentation = new htmlContent_1.MarkdownString().appendCodeblock('', new snippetParser_1.SnippetParser().text(this.snippet.codeSnippet));
            return this;
        }
        static compareByLabel(a, b) {
            return strings_1.compare(a.label.name, b.label.name);
        }
    }
    exports.SnippetCompletion = SnippetCompletion;
    let SnippetCompletionProvider = class SnippetCompletionProvider {
        constructor(_modeService, _snippets) {
            this._modeService = _modeService;
            this._snippets = _snippets;
            this._debugDisplayName = 'snippetCompletions';
            //
        }
        async provideCompletionItems(model, position, context) {
            if (context.triggerKind === 1 /* TriggerCharacter */ && context.triggerCharacter === ' ') {
                // no snippets when suggestions have been triggered by space
                return { suggestions: [] };
            }
            const languageId = this._getLanguageIdAtPosition(model, position);
            const snippets = await this._snippets.getSnippets(languageId);
            let pos = { lineNumber: position.lineNumber, column: 1 };
            let lineOffsets = [];
            const lineContent = model.getLineContent(position.lineNumber).toLowerCase();
            const endsInWhitespace = /\s/.test(lineContent[position.column - 2]);
            while (pos.column < position.column) {
                let word = model.getWordAtPosition(pos);
                if (word) {
                    // at a word
                    lineOffsets.push(word.startColumn - 1);
                    pos.column = word.endColumn + 1;
                    if (word.endColumn < position.column && !/\s/.test(lineContent[word.endColumn - 1])) {
                        lineOffsets.push(word.endColumn - 1);
                    }
                }
                else if (!/\s/.test(lineContent[pos.column - 1])) {
                    // at a none-whitespace character
                    lineOffsets.push(pos.column - 1);
                    pos.column += 1;
                }
                else {
                    // always advance!
                    pos.column += 1;
                }
            }
            const availableSnippets = new Set(snippets);
            const suggestions = [];
            for (let start of lineOffsets) {
                availableSnippets.forEach(snippet => {
                    if (filters_1.isPatternInWord(lineContent, start, position.column - 1, snippet.prefixLow, 0, snippet.prefixLow.length)) {
                        const snippetPrefixSubstr = snippet.prefixLow.substr(position.column - (1 + start));
                        const endColumn = lineContent.indexOf(snippetPrefixSubstr, position.column - 1) >= 0 ? position.column + snippetPrefixSubstr.length : position.column;
                        const replace = range_1.Range.fromPositions(position.delta(0, -(position.column - (1 + start))), { lineNumber: position.lineNumber, column: endColumn });
                        const insert = replace.setEndPosition(position.lineNumber, position.column);
                        suggestions.push(new SnippetCompletion(snippet, { replace, insert }));
                        availableSnippets.delete(snippet);
                    }
                });
            }
            if (endsInWhitespace || lineOffsets.length === 0) {
                // add remaing snippets when the current prefix ends in whitespace or when no
                // interesting positions have been found
                availableSnippets.forEach(snippet => {
                    const insert = range_1.Range.fromPositions(position);
                    const replace = lineContent.indexOf(snippet.prefixLow, position.column - 1) >= 0 ? insert.setEndPosition(position.lineNumber, position.column + snippet.prefixLow.length) : insert;
                    suggestions.push(new SnippetCompletion(snippet, { replace, insert }));
                });
            }
            // dismbiguate suggestions with same labels
            suggestions.sort(SnippetCompletion.compareByLabel);
            for (let i = 0; i < suggestions.length; i++) {
                let item = suggestions[i];
                let to = i + 1;
                for (; to < suggestions.length && item.label === suggestions[to].label; to++) {
                    suggestions[to].label.name = nls_1.localize('snippetSuggest.longLabel', "{0}, {1}", suggestions[to].label.name, suggestions[to].snippet.name);
                }
                if (to > i + 1) {
                    suggestions[i].label.name = nls_1.localize('snippetSuggest.longLabel', "{0}, {1}", suggestions[i].label.name, suggestions[i].snippet.name);
                    i = to;
                }
            }
            return { suggestions };
        }
        resolveCompletionItem(item) {
            return (item instanceof SnippetCompletion) ? item.resolve() : item;
        }
        _getLanguageIdAtPosition(model, position) {
            // validate the `languageId` to ensure this is a user
            // facing language with a name and the chance to have
            // snippets, else fall back to the outer language
            model.tokenizeIfCheap(position.lineNumber);
            let languageId = model.getLanguageIdAtPosition(position.lineNumber, position.column);
            const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
            if (languageIdentifier && !this._modeService.getLanguageName(languageIdentifier.language)) {
                languageId = model.getLanguageIdentifier().id;
            }
            return languageId;
        }
    };
    SnippetCompletionProvider = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, snippets_contribution_1.ISnippetsService)
    ], SnippetCompletionProvider);
    exports.SnippetCompletionProvider = SnippetCompletionProvider;
});
//# __sourceMappingURL=snippetCompletionProvider.js.map