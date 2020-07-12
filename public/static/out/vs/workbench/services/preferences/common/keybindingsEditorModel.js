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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/platform", "vs/base/common/filters", "vs/platform/registry/common/platform", "vs/base/common/keybindingLabels", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/common/editor", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/keybindingResolver"], function (require, exports, nls_1, arrays_1, strings, platform_1, filters_1, platform_2, keybindingLabels_1, actions_1, actions_2, editor_1, keybinding_1, resolvedKeybindingItem_1, keybindingResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditorModel = exports.KEYBINDING_ENTRY_TEMPLATE_ID = void 0;
    exports.KEYBINDING_ENTRY_TEMPLATE_ID = 'keybinding.entry.template';
    const SOURCE_DEFAULT = nls_1.localize('default', "Default");
    const SOURCE_USER = nls_1.localize('user', "User");
    const wordFilter = filters_1.or(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString);
    let KeybindingsEditorModel = class KeybindingsEditorModel extends editor_1.EditorModel {
        constructor(os, keybindingsService) {
            super();
            this.keybindingsService = keybindingsService;
            this._keybindingItems = [];
            this._keybindingItemsSortedByPrecedence = [];
            this.modifierLabels = {
                ui: keybindingLabels_1.UILabelProvider.modifierLabels[os],
                aria: keybindingLabels_1.AriaLabelProvider.modifierLabels[os],
                user: keybindingLabels_1.UserSettingsLabelProvider.modifierLabels[os]
            };
        }
        fetch(searchValue, sortByPrecedence = false) {
            let keybindingItems = sortByPrecedence ? this._keybindingItemsSortedByPrecedence : this._keybindingItems;
            if (/@source:\s*(user|default)/i.test(searchValue)) {
                keybindingItems = this.filterBySource(keybindingItems, searchValue);
                searchValue = searchValue.replace(/@source:\s*(user|default)/i, '');
            }
            searchValue = searchValue.trim();
            if (!searchValue) {
                return keybindingItems.map(keybindingItem => ({ id: KeybindingsEditorModel.getId(keybindingItem), keybindingItem, templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID }));
            }
            return this.filterByText(keybindingItems, searchValue);
        }
        filterBySource(keybindingItems, searchValue) {
            if (/@source:\s*default/i.test(searchValue)) {
                return keybindingItems.filter(k => k.source === SOURCE_DEFAULT);
            }
            if (/@source:\s*user/i.test(searchValue)) {
                return keybindingItems.filter(k => k.source === SOURCE_USER);
            }
            return keybindingItems;
        }
        filterByText(keybindingItems, searchValue) {
            const quoteAtFirstChar = searchValue.charAt(0) === '"';
            const quoteAtLastChar = searchValue.charAt(searchValue.length - 1) === '"';
            const completeMatch = quoteAtFirstChar && quoteAtLastChar;
            if (quoteAtFirstChar) {
                searchValue = searchValue.substring(1);
            }
            if (quoteAtLastChar) {
                searchValue = searchValue.substring(0, searchValue.length - 1);
            }
            searchValue = searchValue.trim();
            const result = [];
            const words = searchValue.split(' ');
            const keybindingWords = this.splitKeybindingWords(words);
            for (const keybindingItem of keybindingItems) {
                const keybindingMatches = new KeybindingItemMatches(this.modifierLabels, keybindingItem, searchValue, words, keybindingWords, completeMatch);
                if (keybindingMatches.commandIdMatches
                    || keybindingMatches.commandLabelMatches
                    || keybindingMatches.commandDefaultLabelMatches
                    || keybindingMatches.sourceMatches
                    || keybindingMatches.whenMatches
                    || keybindingMatches.keybindingMatches) {
                    result.push({
                        id: KeybindingsEditorModel.getId(keybindingItem),
                        templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID,
                        commandLabelMatches: keybindingMatches.commandLabelMatches || undefined,
                        commandDefaultLabelMatches: keybindingMatches.commandDefaultLabelMatches || undefined,
                        keybindingItem,
                        keybindingMatches: keybindingMatches.keybindingMatches || undefined,
                        commandIdMatches: keybindingMatches.commandIdMatches || undefined,
                        sourceMatches: keybindingMatches.sourceMatches || undefined,
                        whenMatches: keybindingMatches.whenMatches || undefined
                    });
                }
            }
            return result;
        }
        splitKeybindingWords(wordsSeparatedBySpaces) {
            const result = [];
            for (const word of wordsSeparatedBySpaces) {
                result.push(...arrays_1.coalesce(word.split('+')));
            }
            return result;
        }
        resolve(actionLabels) {
            const workbenchActionsRegistry = platform_2.Registry.as(actions_2.Extensions.WorkbenchActions);
            this._keybindingItemsSortedByPrecedence = [];
            const boundCommands = new Map();
            for (const keybinding of this.keybindingsService.getKeybindings()) {
                if (keybinding.command) { // Skip keybindings without commands
                    this._keybindingItemsSortedByPrecedence.push(KeybindingsEditorModel.toKeybindingEntry(keybinding.command, keybinding, workbenchActionsRegistry, actionLabels));
                    boundCommands.set(keybinding.command, true);
                }
            }
            const commandsWithDefaultKeybindings = this.keybindingsService.getDefaultKeybindings().map(keybinding => keybinding.command);
            for (const command of keybindingResolver_1.KeybindingResolver.getAllUnboundCommands(boundCommands)) {
                const keybindingItem = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, command, null, undefined, commandsWithDefaultKeybindings.indexOf(command) === -1);
                this._keybindingItemsSortedByPrecedence.push(KeybindingsEditorModel.toKeybindingEntry(command, keybindingItem, workbenchActionsRegistry, actionLabels));
            }
            this._keybindingItems = this._keybindingItemsSortedByPrecedence.slice(0).sort((a, b) => KeybindingsEditorModel.compareKeybindingData(a, b));
            return Promise.resolve(this);
        }
        static getId(keybindingItem) {
            return keybindingItem.command + (keybindingItem.keybinding ? keybindingItem.keybinding.getAriaLabel() : '') + keybindingItem.source + keybindingItem.when;
        }
        static compareKeybindingData(a, b) {
            if (a.keybinding && !b.keybinding) {
                return -1;
            }
            if (b.keybinding && !a.keybinding) {
                return 1;
            }
            if (a.commandLabel && !b.commandLabel) {
                return -1;
            }
            if (b.commandLabel && !a.commandLabel) {
                return 1;
            }
            if (a.commandLabel && b.commandLabel) {
                if (a.commandLabel !== b.commandLabel) {
                    return a.commandLabel.localeCompare(b.commandLabel);
                }
            }
            if (a.command === b.command) {
                return a.keybindingItem.isDefault ? 1 : -1;
            }
            return a.command.localeCompare(b.command);
        }
        static toKeybindingEntry(command, keybindingItem, workbenchActionsRegistry, actions) {
            const menuCommand = actions_1.MenuRegistry.getCommand(command);
            const editorActionLabel = actions.get(command);
            return {
                keybinding: keybindingItem.resolvedKeybinding,
                keybindingItem,
                command,
                commandLabel: KeybindingsEditorModel.getCommandLabel(menuCommand, editorActionLabel),
                commandDefaultLabel: KeybindingsEditorModel.getCommandDefaultLabel(menuCommand, workbenchActionsRegistry),
                when: keybindingItem.when ? keybindingItem.when.serialize() : '',
                source: keybindingItem.isDefault ? SOURCE_DEFAULT : SOURCE_USER
            };
        }
        static getCommandDefaultLabel(menuCommand, workbenchActionsRegistry) {
            if (!platform_1.Language.isDefaultVariant()) {
                if (menuCommand && menuCommand.title && menuCommand.title.original) {
                    const category = menuCommand.category ? menuCommand.category.original : undefined;
                    const title = menuCommand.title.original;
                    return category ? nls_1.localize('cat.title', "{0}: {1}", category, title) : title;
                }
            }
            return null;
        }
        static getCommandLabel(menuCommand, editorActionLabel) {
            if (menuCommand) {
                const category = menuCommand.category ? typeof menuCommand.category === 'string' ? menuCommand.category : menuCommand.category.value : undefined;
                const title = typeof menuCommand.title === 'string' ? menuCommand.title : menuCommand.title.value;
                return category ? nls_1.localize('cat.title', "{0}: {1}", category, title) : title;
            }
            if (editorActionLabel) {
                return editorActionLabel;
            }
            return '';
        }
    };
    KeybindingsEditorModel = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], KeybindingsEditorModel);
    exports.KeybindingsEditorModel = KeybindingsEditorModel;
    class KeybindingItemMatches {
        constructor(modifierLabels, keybindingItem, searchValue, words, keybindingWords, completeMatch) {
            this.modifierLabels = modifierLabels;
            this.commandIdMatches = null;
            this.commandLabelMatches = null;
            this.commandDefaultLabelMatches = null;
            this.sourceMatches = null;
            this.whenMatches = null;
            this.keybindingMatches = null;
            if (!completeMatch) {
                this.commandIdMatches = this.matches(searchValue, keybindingItem.command, filters_1.or(filters_1.matchesWords, filters_1.matchesCamelCase), words);
                this.commandLabelMatches = keybindingItem.commandLabel ? this.matches(searchValue, keybindingItem.commandLabel, (word, wordToMatchAgainst) => filters_1.matchesWords(word, keybindingItem.commandLabel, true), words) : null;
                this.commandDefaultLabelMatches = keybindingItem.commandDefaultLabel ? this.matches(searchValue, keybindingItem.commandDefaultLabel, (word, wordToMatchAgainst) => filters_1.matchesWords(word, keybindingItem.commandDefaultLabel, true), words) : null;
                this.sourceMatches = this.matches(searchValue, keybindingItem.source, (word, wordToMatchAgainst) => filters_1.matchesWords(word, keybindingItem.source, true), words);
                this.whenMatches = keybindingItem.when ? this.matches(null, keybindingItem.when, filters_1.or(filters_1.matchesWords, filters_1.matchesCamelCase), words) : null;
            }
            this.keybindingMatches = keybindingItem.keybinding ? this.matchesKeybinding(keybindingItem.keybinding, searchValue, keybindingWords, completeMatch) : null;
        }
        matches(searchValue, wordToMatchAgainst, wordMatchesFilter, words) {
            let matches = searchValue ? wordFilter(searchValue, wordToMatchAgainst) : null;
            if (!matches) {
                matches = this.matchesWords(words, wordToMatchAgainst, wordMatchesFilter);
            }
            if (matches) {
                matches = this.filterAndSort(matches);
            }
            return matches;
        }
        matchesWords(words, wordToMatchAgainst, wordMatchesFilter) {
            let matches = [];
            for (const word of words) {
                const wordMatches = wordMatchesFilter(word, wordToMatchAgainst);
                if (wordMatches) {
                    matches = [...(matches || []), ...wordMatches];
                }
                else {
                    matches = null;
                    break;
                }
            }
            return matches;
        }
        filterAndSort(matches) {
            return arrays_1.distinct(matches, (a => a.start + '.' + a.end)).filter(match => !matches.some(m => !(m.start === match.start && m.end === match.end) && (m.start <= match.start && m.end >= match.end))).sort((a, b) => a.start - b.start);
        }
        matchesKeybinding(keybinding, searchValue, words, completeMatch) {
            const [firstPart, chordPart] = keybinding.getParts();
            const userSettingsLabel = keybinding.getUserSettingsLabel();
            const ariaLabel = keybinding.getAriaLabel();
            const label = keybinding.getLabel();
            if ((userSettingsLabel && strings.compareIgnoreCase(searchValue, userSettingsLabel) === 0)
                || (ariaLabel && strings.compareIgnoreCase(searchValue, ariaLabel) === 0)
                || (label && strings.compareIgnoreCase(searchValue, label) === 0)) {
                return {
                    firstPart: this.createCompleteMatch(firstPart),
                    chordPart: this.createCompleteMatch(chordPart)
                };
            }
            const firstPartMatch = {};
            let chordPartMatch = {};
            const matchedWords = [];
            const firstPartMatchedWords = [];
            let chordPartMatchedWords = [];
            let matchFirstPart = true;
            for (let index = 0; index < words.length; index++) {
                const word = words[index];
                let firstPartMatched = false;
                let chordPartMatched = false;
                matchFirstPart = matchFirstPart && !firstPartMatch.keyCode;
                let matchChordPart = !chordPartMatch.keyCode;
                if (matchFirstPart) {
                    firstPartMatched = this.matchPart(firstPart, firstPartMatch, word, completeMatch);
                    if (firstPartMatch.keyCode) {
                        for (const cordPartMatchedWordIndex of chordPartMatchedWords) {
                            if (firstPartMatchedWords.indexOf(cordPartMatchedWordIndex) === -1) {
                                matchedWords.splice(matchedWords.indexOf(cordPartMatchedWordIndex), 1);
                            }
                        }
                        chordPartMatch = {};
                        chordPartMatchedWords = [];
                        matchChordPart = false;
                    }
                }
                if (matchChordPart) {
                    chordPartMatched = this.matchPart(chordPart, chordPartMatch, word, completeMatch);
                }
                if (firstPartMatched) {
                    firstPartMatchedWords.push(index);
                }
                if (chordPartMatched) {
                    chordPartMatchedWords.push(index);
                }
                if (firstPartMatched || chordPartMatched) {
                    matchedWords.push(index);
                }
                matchFirstPart = matchFirstPart && this.isModifier(word);
            }
            if (matchedWords.length !== words.length) {
                return null;
            }
            if (completeMatch && (!this.isCompleteMatch(firstPart, firstPartMatch) || !this.isCompleteMatch(chordPart, chordPartMatch))) {
                return null;
            }
            return this.hasAnyMatch(firstPartMatch) || this.hasAnyMatch(chordPartMatch) ? { firstPart: firstPartMatch, chordPart: chordPartMatch } : null;
        }
        matchPart(part, match, word, completeMatch) {
            let matched = false;
            if (this.matchesMetaModifier(part, word)) {
                matched = true;
                match.metaKey = true;
            }
            if (this.matchesCtrlModifier(part, word)) {
                matched = true;
                match.ctrlKey = true;
            }
            if (this.matchesShiftModifier(part, word)) {
                matched = true;
                match.shiftKey = true;
            }
            if (this.matchesAltModifier(part, word)) {
                matched = true;
                match.altKey = true;
            }
            if (this.matchesKeyCode(part, word, completeMatch)) {
                match.keyCode = true;
                matched = true;
            }
            return matched;
        }
        matchesKeyCode(keybinding, word, completeMatch) {
            if (!keybinding) {
                return false;
            }
            const ariaLabel = keybinding.keyAriaLabel || '';
            if (completeMatch || ariaLabel.length === 1 || word.length === 1) {
                if (strings.compareIgnoreCase(ariaLabel, word) === 0) {
                    return true;
                }
            }
            else {
                if (filters_1.matchesContiguousSubString(word, ariaLabel)) {
                    return true;
                }
            }
            return false;
        }
        matchesMetaModifier(keybinding, word) {
            if (!keybinding) {
                return false;
            }
            if (!keybinding.metaKey) {
                return false;
            }
            return this.wordMatchesMetaModifier(word);
        }
        matchesCtrlModifier(keybinding, word) {
            if (!keybinding) {
                return false;
            }
            if (!keybinding.ctrlKey) {
                return false;
            }
            return this.wordMatchesCtrlModifier(word);
        }
        matchesShiftModifier(keybinding, word) {
            if (!keybinding) {
                return false;
            }
            if (!keybinding.shiftKey) {
                return false;
            }
            return this.wordMatchesShiftModifier(word);
        }
        matchesAltModifier(keybinding, word) {
            if (!keybinding) {
                return false;
            }
            if (!keybinding.altKey) {
                return false;
            }
            return this.wordMatchesAltModifier(word);
        }
        hasAnyMatch(keybindingMatch) {
            return !!keybindingMatch.altKey ||
                !!keybindingMatch.ctrlKey ||
                !!keybindingMatch.metaKey ||
                !!keybindingMatch.shiftKey ||
                !!keybindingMatch.keyCode;
        }
        isCompleteMatch(part, match) {
            if (!part) {
                return true;
            }
            if (!match.keyCode) {
                return false;
            }
            if (part.metaKey && !match.metaKey) {
                return false;
            }
            if (part.altKey && !match.altKey) {
                return false;
            }
            if (part.ctrlKey && !match.ctrlKey) {
                return false;
            }
            if (part.shiftKey && !match.shiftKey) {
                return false;
            }
            return true;
        }
        createCompleteMatch(part) {
            const match = {};
            if (part) {
                match.keyCode = true;
                if (part.metaKey) {
                    match.metaKey = true;
                }
                if (part.altKey) {
                    match.altKey = true;
                }
                if (part.ctrlKey) {
                    match.ctrlKey = true;
                }
                if (part.shiftKey) {
                    match.shiftKey = true;
                }
            }
            return match;
        }
        isModifier(word) {
            if (this.wordMatchesAltModifier(word)) {
                return true;
            }
            if (this.wordMatchesCtrlModifier(word)) {
                return true;
            }
            if (this.wordMatchesMetaModifier(word)) {
                return true;
            }
            if (this.wordMatchesShiftModifier(word)) {
                return true;
            }
            return false;
        }
        wordMatchesAltModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(nls_1.localize('option', "option"), word)) {
                return true;
            }
            return false;
        }
        wordMatchesCtrlModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.ctrlKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.ctrlKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.ctrlKey, word)) {
                return true;
            }
            return false;
        }
        wordMatchesMetaModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(nls_1.localize('meta', "meta"), word)) {
                return true;
            }
            return false;
        }
        wordMatchesShiftModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.shiftKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.shiftKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.shiftKey, word)) {
                return true;
            }
            return false;
        }
    }
});
//# __sourceMappingURL=keybindingsEditorModel.js.map