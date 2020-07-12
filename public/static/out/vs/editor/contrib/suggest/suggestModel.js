/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/selection", "vs/editor/common/modes", "./completionModel", "./suggest", "vs/editor/contrib/snippet/snippetController2", "vs/base/common/cancellation", "vs/editor/contrib/suggest/wordDistance", "vs/base/common/strings"], function (require, exports, arrays_1, async_1, errors_1, event_1, lifecycle_1, selection_1, modes_1, completionModel_1, suggest_1, snippetController2_1, cancellation_1, wordDistance_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestModel = exports.State = exports.LineContext = void 0;
    class LineContext {
        constructor(model, position, auto, shy) {
            this.leadingLineContent = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
            this.leadingWord = model.getWordUntilPosition(position);
            this.lineNumber = position.lineNumber;
            this.column = position.column;
            this.auto = auto;
            this.shy = shy;
        }
        static shouldAutoTrigger(editor) {
            if (!editor.hasModel()) {
                return false;
            }
            const model = editor.getModel();
            const pos = editor.getPosition();
            model.tokenizeIfCheap(pos.lineNumber);
            const word = model.getWordAtPosition(pos);
            if (!word) {
                return false;
            }
            if (word.endColumn !== pos.column) {
                return false;
            }
            if (!isNaN(Number(word.word))) {
                return false;
            }
            return true;
        }
    }
    exports.LineContext = LineContext;
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Manual"] = 1] = "Manual";
        State[State["Auto"] = 2] = "Auto";
    })(State = exports.State || (exports.State = {}));
    class SuggestModel {
        constructor(_editor, _editorWorkerService, _clipboardService) {
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._clipboardService = _clipboardService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._quickSuggestDelay = 10;
            this._triggerCharacterListener = new lifecycle_1.DisposableStore();
            this._triggerQuickSuggest = new async_1.TimeoutTimer();
            this._state = 0 /* Idle */;
            this._completionDisposables = new lifecycle_1.DisposableStore();
            this._onDidCancel = new event_1.Emitter();
            this._onDidTrigger = new event_1.Emitter();
            this._onDidSuggest = new event_1.Emitter();
            this.onDidCancel = this._onDidCancel.event;
            this.onDidTrigger = this._onDidTrigger.event;
            this.onDidSuggest = this._onDidSuggest.event;
            this._currentSelection = this._editor.getSelection() || new selection_1.Selection(1, 1, 1, 1);
            // wire up various listeners
            this._toDispose.add(this._editor.onDidChangeModel(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeModelLanguage(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeConfiguration(() => {
                this._updateTriggerCharacters();
                this._updateQuickSuggest();
            }));
            this._toDispose.add(modes_1.CompletionProviderRegistry.onDidChange(() => {
                this._updateTriggerCharacters();
                this._updateActiveSuggestSession();
            }));
            this._toDispose.add(this._editor.onDidChangeCursorSelection(e => {
                this._onCursorChange(e);
            }));
            let editorIsComposing = false;
            this._toDispose.add(this._editor.onDidCompositionStart(() => {
                editorIsComposing = true;
            }));
            this._toDispose.add(this._editor.onDidCompositionEnd(() => {
                // refilter when composition ends
                editorIsComposing = false;
                this._refilterCompletionItems();
            }));
            this._toDispose.add(this._editor.onDidChangeModelContent(() => {
                // only filter completions when the editor isn't
                // composing a character, e.g. ¨ + u makes ü but just
                // ¨ cannot be used for filtering
                if (!editorIsComposing) {
                    this._refilterCompletionItems();
                }
            }));
            this._updateTriggerCharacters();
            this._updateQuickSuggest();
        }
        dispose() {
            lifecycle_1.dispose(this._triggerCharacterListener);
            lifecycle_1.dispose([this._onDidCancel, this._onDidSuggest, this._onDidTrigger, this._triggerQuickSuggest]);
            this._toDispose.dispose();
            this._completionDisposables.dispose();
            this.cancel();
        }
        // --- handle configuration & precondition changes
        _updateQuickSuggest() {
            this._quickSuggestDelay = this._editor.getOption(71 /* quickSuggestionsDelay */);
            if (isNaN(this._quickSuggestDelay) || (!this._quickSuggestDelay && this._quickSuggestDelay !== 0) || this._quickSuggestDelay < 0) {
                this._quickSuggestDelay = 10;
            }
        }
        _updateTriggerCharacters() {
            this._triggerCharacterListener.clear();
            if (this._editor.getOption(72 /* readOnly */)
                || !this._editor.hasModel()
                || !this._editor.getOption(99 /* suggestOnTriggerCharacters */)) {
                return;
            }
            const supportsByTriggerCharacter = new Map();
            for (const support of modes_1.CompletionProviderRegistry.all(this._editor.getModel())) {
                for (const ch of support.triggerCharacters || []) {
                    let set = supportsByTriggerCharacter.get(ch);
                    if (!set) {
                        set = new Set();
                        set.add(suggest_1.getSnippetSuggestSupport());
                        supportsByTriggerCharacter.set(ch, set);
                    }
                    set.add(support);
                }
            }
            const checkTriggerCharacter = (text) => {
                if (!text) {
                    // came here from the compositionEnd-event
                    const position = this._editor.getPosition();
                    const model = this._editor.getModel();
                    text = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
                }
                let lastChar = '';
                if (strings_1.isLowSurrogate(text.charCodeAt(text.length - 1))) {
                    if (strings_1.isHighSurrogate(text.charCodeAt(text.length - 2))) {
                        lastChar = text.substr(text.length - 2);
                    }
                }
                else {
                    lastChar = text.charAt(text.length - 1);
                }
                const supports = supportsByTriggerCharacter.get(lastChar);
                if (supports) {
                    // keep existing items that where not computed by the
                    // supports/providers that want to trigger now
                    const items = this._completionModel ? this._completionModel.adopt(supports) : undefined;
                    this.trigger({ auto: true, shy: false, triggerCharacter: lastChar }, Boolean(this._completionModel), supports, items);
                }
            };
            this._triggerCharacterListener.add(this._editor.onDidType(checkTriggerCharacter));
            this._triggerCharacterListener.add(this._editor.onDidCompositionEnd(checkTriggerCharacter));
        }
        // --- trigger/retrigger/cancel suggest
        get state() {
            return this._state;
        }
        cancel(retrigger = false) {
            if (this._state !== 0 /* Idle */) {
                this._triggerQuickSuggest.cancel();
                if (this._requestToken) {
                    this._requestToken.cancel();
                    this._requestToken = undefined;
                }
                this._state = 0 /* Idle */;
                this._completionModel = undefined;
                this._context = undefined;
                this._onDidCancel.fire({ retrigger });
            }
        }
        clear() {
            this._completionDisposables.clear();
        }
        _updateActiveSuggestSession() {
            if (this._state !== 0 /* Idle */) {
                if (!this._editor.hasModel() || !modes_1.CompletionProviderRegistry.has(this._editor.getModel())) {
                    this.cancel();
                }
                else {
                    this.trigger({ auto: this._state === 2 /* Auto */, shy: false }, true);
                }
            }
        }
        _onCursorChange(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const prevSelection = this._currentSelection;
            this._currentSelection = this._editor.getSelection();
            if (!e.selection.isEmpty()
                || e.reason !== 0 /* NotSet */
                || (e.source !== 'keyboard' && e.source !== 'deleteLeft')) {
                // Early exit if nothing needs to be done!
                // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                this.cancel();
                return;
            }
            if (!modes_1.CompletionProviderRegistry.has(model)) {
                return;
            }
            if (this._state === 0 /* Idle */) {
                if (this._editor.getOption(70 /* quickSuggestions */) === false) {
                    // not enabled
                    return;
                }
                if (!prevSelection.containsRange(this._currentSelection) && !prevSelection.getEndPosition().isBeforeOrEqual(this._currentSelection.getPosition())) {
                    // cursor didn't move RIGHT
                    return;
                }
                if (this._editor.getOption(96 /* suggest */).snippetsPreventQuickSuggestions && snippetController2_1.SnippetController2.get(this._editor).isInSnippet()) {
                    // no quick suggestion when in snippet mode
                    return;
                }
                this.cancel();
                this._triggerQuickSuggest.cancelAndSet(() => {
                    if (this._state !== 0 /* Idle */) {
                        return;
                    }
                    if (!LineContext.shouldAutoTrigger(this._editor)) {
                        return;
                    }
                    if (!this._editor.hasModel()) {
                        return;
                    }
                    const model = this._editor.getModel();
                    const pos = this._editor.getPosition();
                    // validate enabled now
                    const quickSuggestions = this._editor.getOption(70 /* quickSuggestions */);
                    if (quickSuggestions === false) {
                        return;
                    }
                    else if (quickSuggestions === true) {
                        // all good
                    }
                    else {
                        // Check the type of the token that triggered this
                        model.tokenizeIfCheap(pos.lineNumber);
                        const lineTokens = model.getLineTokens(pos.lineNumber);
                        const tokenType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(Math.max(pos.column - 1 - 1, 0)));
                        const inValidScope = quickSuggestions.other && tokenType === 0 /* Other */
                            || quickSuggestions.comments && tokenType === 1 /* Comment */
                            || quickSuggestions.strings && tokenType === 2 /* String */;
                        if (!inValidScope) {
                            return;
                        }
                    }
                    // we made it till here -> trigger now
                    this.trigger({ auto: true, shy: false });
                }, this._quickSuggestDelay);
            }
        }
        _refilterCompletionItems() {
            // Re-filter suggestions. This MUST run async because filtering/scoring
            // uses the model content AND the cursor position. The latter is NOT
            // updated when the document has changed (the event which drives this method)
            // and therefore a little pause (next mirco task) is needed. See:
            // https://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context#25933985
            Promise.resolve().then(() => {
                if (this._state === 0 /* Idle */) {
                    return;
                }
                if (!this._editor.hasModel()) {
                    return;
                }
                const model = this._editor.getModel();
                const position = this._editor.getPosition();
                const ctx = new LineContext(model, position, this._state === 2 /* Auto */, false);
                this._onNewContext(ctx);
            });
        }
        trigger(context, retrigger = false, onlyFrom, existingItems) {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const auto = context.auto;
            const ctx = new LineContext(model, this._editor.getPosition(), auto, context.shy);
            // Cancel previous requests, change state & update UI
            this.cancel(retrigger);
            this._state = auto ? 2 /* Auto */ : 1 /* Manual */;
            this._onDidTrigger.fire({ auto, shy: context.shy, position: this._editor.getPosition() });
            // Capture context when request was sent
            this._context = ctx;
            // Build context for request
            let suggestCtx;
            if (context.triggerCharacter) {
                suggestCtx = {
                    triggerKind: 1 /* TriggerCharacter */,
                    triggerCharacter: context.triggerCharacter
                };
            }
            else if (onlyFrom && onlyFrom.size > 0) {
                suggestCtx = { triggerKind: 2 /* TriggerForIncompleteCompletions */ };
            }
            else {
                suggestCtx = { triggerKind: 0 /* Invoke */ };
            }
            this._requestToken = new cancellation_1.CancellationTokenSource();
            // kind filter and snippet sort rules
            const snippetSuggestions = this._editor.getOption(93 /* snippetSuggestions */);
            let snippetSortOrder = 1 /* Inline */;
            switch (snippetSuggestions) {
                case 'top':
                    snippetSortOrder = 0 /* Top */;
                    break;
                // 	↓ that's the default anyways...
                // case 'inline':
                // 	snippetSortOrder = SnippetSortOrder.Inline;
                // 	break;
                case 'bottom':
                    snippetSortOrder = 2 /* Bottom */;
                    break;
            }
            let itemKindFilter = SuggestModel._createItemKindFilter(this._editor);
            let wordDistance = wordDistance_1.WordDistance.create(this._editorWorkerService, this._editor);
            let completions = suggest_1.provideSuggestionItems(model, this._editor.getPosition(), new suggest_1.CompletionOptions(snippetSortOrder, itemKindFilter, onlyFrom), suggestCtx, this._requestToken.token);
            Promise.all([completions, wordDistance]).then(async ([completions, wordDistance]) => {
                lifecycle_1.dispose(this._requestToken);
                if (this._state === 0 /* Idle */) {
                    return;
                }
                if (!this._editor.hasModel()) {
                    return;
                }
                let clipboardText;
                if (completions.needsClipboard) {
                    clipboardText = await this._clipboardService.readText();
                }
                const model = this._editor.getModel();
                let items = completions.items;
                if (arrays_1.isNonEmptyArray(existingItems)) {
                    const cmpFn = suggest_1.getSuggestionComparator(snippetSortOrder);
                    items = items.concat(existingItems).sort(cmpFn);
                }
                const ctx = new LineContext(model, this._editor.getPosition(), auto, context.shy);
                this._completionModel = new completionModel_1.CompletionModel(items, this._context.column, {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                }, wordDistance, this._editor.getOption(96 /* suggest */), this._editor.getOption(93 /* snippetSuggestions */), clipboardText);
                // store containers so that they can be disposed later
                this._completionDisposables.add(completions.dispoables);
                this._onNewContext(ctx);
            }).catch(errors_1.onUnexpectedError);
        }
        static _createItemKindFilter(editor) {
            // kind filter and snippet sort rules
            const result = new Set();
            // snippet setting
            const snippetSuggestions = editor.getOption(93 /* snippetSuggestions */);
            if (snippetSuggestions === 'none') {
                result.add(27 /* Snippet */);
            }
            // type setting
            const suggestOptions = editor.getOption(96 /* suggest */);
            if (!suggestOptions.showMethods) {
                result.add(0 /* Method */);
            }
            if (!suggestOptions.showFunctions) {
                result.add(1 /* Function */);
            }
            if (!suggestOptions.showConstructors) {
                result.add(2 /* Constructor */);
            }
            if (!suggestOptions.showFields) {
                result.add(3 /* Field */);
            }
            if (!suggestOptions.showVariables) {
                result.add(4 /* Variable */);
            }
            if (!suggestOptions.showClasses) {
                result.add(5 /* Class */);
            }
            if (!suggestOptions.showStructs) {
                result.add(6 /* Struct */);
            }
            if (!suggestOptions.showInterfaces) {
                result.add(7 /* Interface */);
            }
            if (!suggestOptions.showModules) {
                result.add(8 /* Module */);
            }
            if (!suggestOptions.showProperties) {
                result.add(9 /* Property */);
            }
            if (!suggestOptions.showEvents) {
                result.add(10 /* Event */);
            }
            if (!suggestOptions.showOperators) {
                result.add(11 /* Operator */);
            }
            if (!suggestOptions.showUnits) {
                result.add(12 /* Unit */);
            }
            if (!suggestOptions.showValues) {
                result.add(13 /* Value */);
            }
            if (!suggestOptions.showConstants) {
                result.add(14 /* Constant */);
            }
            if (!suggestOptions.showEnums) {
                result.add(15 /* Enum */);
            }
            if (!suggestOptions.showEnumMembers) {
                result.add(16 /* EnumMember */);
            }
            if (!suggestOptions.showKeywords) {
                result.add(17 /* Keyword */);
            }
            if (!suggestOptions.showWords) {
                result.add(18 /* Text */);
            }
            if (!suggestOptions.showColors) {
                result.add(19 /* Color */);
            }
            if (!suggestOptions.showFiles) {
                result.add(20 /* File */);
            }
            if (!suggestOptions.showReferences) {
                result.add(21 /* Reference */);
            }
            if (!suggestOptions.showColors) {
                result.add(22 /* Customcolor */);
            }
            if (!suggestOptions.showFolders) {
                result.add(23 /* Folder */);
            }
            if (!suggestOptions.showTypeParameters) {
                result.add(24 /* TypeParameter */);
            }
            if (!suggestOptions.showSnippets) {
                result.add(27 /* Snippet */);
            }
            if (!suggestOptions.showUsers) {
                result.add(25 /* User */);
            }
            if (!suggestOptions.showIssues) {
                result.add(26 /* Issue */);
            }
            return result;
        }
        _onNewContext(ctx) {
            if (!this._context) {
                // happens when 24x7 IntelliSense is enabled and still in its delay
                return;
            }
            if (ctx.lineNumber !== this._context.lineNumber) {
                // e.g. happens when pressing Enter while IntelliSense is computed
                this.cancel();
                return;
            }
            if (ctx.leadingWord.startColumn < this._context.leadingWord.startColumn) {
                // happens when the current word gets outdented
                this.cancel();
                return;
            }
            if (ctx.column < this._context.column) {
                // typed -> moved cursor LEFT -> retrigger if still on a word
                if (ctx.leadingWord.word) {
                    this.trigger({ auto: this._context.auto, shy: false }, true);
                }
                else {
                    this.cancel();
                }
                return;
            }
            if (!this._completionModel) {
                // happens when IntelliSense is not yet computed
                return;
            }
            if (ctx.column > this._context.column && this._completionModel.incomplete.size > 0 && ctx.leadingWord.word.length !== 0) {
                // typed -> moved cursor RIGHT & incomple model & still on a word -> retrigger
                const { incomplete } = this._completionModel;
                const adopted = this._completionModel.adopt(incomplete);
                this.trigger({ auto: this._state === 2 /* Auto */, shy: false }, true, incomplete, adopted);
            }
            else {
                // typed -> moved cursor RIGHT -> update UI
                let oldLineContext = this._completionModel.lineContext;
                let isFrozen = false;
                this._completionModel.lineContext = {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                };
                if (this._completionModel.items.length === 0) {
                    if (LineContext.shouldAutoTrigger(this._editor) && this._context.leadingWord.endColumn < ctx.leadingWord.startColumn) {
                        // retrigger when heading into a new word
                        this.trigger({ auto: this._context.auto, shy: false }, true);
                        return;
                    }
                    if (!this._context.auto) {
                        // freeze when IntelliSense was manually requested
                        this._completionModel.lineContext = oldLineContext;
                        isFrozen = this._completionModel.items.length > 0;
                        if (isFrozen && ctx.leadingWord.word.length === 0) {
                            // there were results before but now there aren't
                            // and also we are not on a word anymore -> cancel
                            this.cancel();
                            return;
                        }
                    }
                    else {
                        // nothing left
                        this.cancel();
                        return;
                    }
                }
                this._onDidSuggest.fire({
                    completionModel: this._completionModel,
                    auto: this._context.auto,
                    shy: this._context.shy,
                    isFrozen,
                });
            }
        }
    }
    exports.SuggestModel = SuggestModel;
});
//# __sourceMappingURL=suggestModel.js.map