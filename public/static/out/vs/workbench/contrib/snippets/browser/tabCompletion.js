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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "./snippets.contribution", "./snippetsService", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/suggest/suggest", "vs/editor/common/editorContextKeys", "./snippetCompletionProvider", "vs/platform/clipboard/common/clipboardService", "vs/editor/browser/core/editorState"], function (require, exports, contextkey_1, snippets_contribution_1, snippetsService_1, lifecycle_1, range_1, editorExtensions_1, snippetController2_1, suggest_1, editorContextKeys_1, snippetCompletionProvider_1, clipboardService_1, editorState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabCompletionController = void 0;
    let TabCompletionController = class TabCompletionController {
        constructor(_editor, _snippetService, _clipboardService, contextKeyService) {
            this._editor = _editor;
            this._snippetService = _snippetService;
            this._clipboardService = _clipboardService;
            this._activeSnippets = [];
            this._hasSnippets = TabCompletionController.ContextKey.bindTo(contextKeyService);
            this._configListener = this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(101 /* tabCompletion */)) {
                    this._update();
                }
            });
            this._update();
        }
        static get(editor) {
            return editor.getContribution(TabCompletionController.ID);
        }
        dispose() {
            lifecycle_1.dispose(this._configListener);
            lifecycle_1.dispose(this._selectionListener);
        }
        _update() {
            const enabled = this._editor.getOption(101 /* tabCompletion */) === 'onlySnippets';
            if (this._enabled !== enabled) {
                this._enabled = enabled;
                if (!this._enabled) {
                    lifecycle_1.dispose(this._selectionListener);
                }
                else {
                    this._selectionListener = this._editor.onDidChangeCursorSelection(e => this._updateSnippets());
                    if (this._editor.getModel()) {
                        this._updateSnippets();
                    }
                }
            }
        }
        _updateSnippets() {
            // reset first
            this._activeSnippets = [];
            if (!this._editor.hasModel()) {
                return;
            }
            // lots of dance for getting the
            const selection = this._editor.getSelection();
            const model = this._editor.getModel();
            model.tokenizeIfCheap(selection.positionLineNumber);
            const id = model.getLanguageIdAtPosition(selection.positionLineNumber, selection.positionColumn);
            const snippets = this._snippetService.getSnippetsSync(id);
            if (!snippets) {
                // nothing for this language
                this._hasSnippets.set(false);
                return;
            }
            if (range_1.Range.isEmpty(selection)) {
                // empty selection -> real text (no whitespace) left of cursor
                const prefix = snippetsService_1.getNonWhitespacePrefix(model, selection.getPosition());
                if (prefix) {
                    for (const snippet of snippets) {
                        if (prefix.endsWith(snippet.prefix)) {
                            this._activeSnippets.push(snippet);
                        }
                    }
                }
            }
            else if (!range_1.Range.spansMultipleLines(selection) && model.getValueLengthInRange(selection) <= 100) {
                // actual selection -> snippet must be a full match
                const selected = model.getValueInRange(selection);
                if (selected) {
                    for (const snippet of snippets) {
                        if (selected === snippet.prefix) {
                            this._activeSnippets.push(snippet);
                        }
                    }
                }
            }
            this._hasSnippets.set(this._activeSnippets.length > 0);
        }
        async performSnippetCompletions() {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._activeSnippets.length === 1) {
                // one -> just insert
                const [snippet] = this._activeSnippets;
                // async clipboard access might be required and in that case
                // we need to check if the editor has changed in flight and then
                // bail out (or be smarter than that)
                let clipboardText;
                if (snippet.needsClipboard) {
                    const state = new editorState_1.EditorState(this._editor, 1 /* Value */ | 4 /* Position */);
                    clipboardText = await this._clipboardService.readText();
                    if (!state.validate(this._editor)) {
                        return;
                    }
                }
                snippetController2_1.SnippetController2.get(this._editor).insert(snippet.codeSnippet, {
                    overwriteBefore: snippet.prefix.length, overwriteAfter: 0,
                    clipboardText
                });
            }
            else if (this._activeSnippets.length > 1) {
                // two or more -> show IntelliSense box
                const position = this._editor.getPosition();
                suggest_1.showSimpleSuggestions(this._editor, this._activeSnippets.map(snippet => {
                    const range = range_1.Range.fromPositions(position.delta(0, -snippet.prefix.length), position);
                    return new snippetCompletionProvider_1.SnippetCompletion(snippet, range);
                }));
            }
        }
    };
    TabCompletionController.ID = 'editor.tabCompletionController';
    TabCompletionController.ContextKey = new contextkey_1.RawContextKey('hasSnippetCompletions', undefined);
    TabCompletionController = __decorate([
        __param(1, snippets_contribution_1.ISnippetsService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, contextkey_1.IContextKeyService)
    ], TabCompletionController);
    exports.TabCompletionController = TabCompletionController;
    editorExtensions_1.registerEditorContribution(TabCompletionController.ID, TabCompletionController);
    const TabCompletionCommand = editorExtensions_1.EditorCommand.bindToContribution(TabCompletionController.get);
    editorExtensions_1.registerEditorCommand(new TabCompletionCommand({
        id: 'insertSnippet',
        precondition: TabCompletionController.ContextKey,
        handler: x => x.performSnippetCompletions(),
        kbOpts: {
            weight: 100 /* EditorContrib */,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus, snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
            primary: 2 /* Tab */
        }
    }));
});
//# __sourceMappingURL=tabCompletion.js.map