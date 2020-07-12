/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/editor/common/services/modeService", "vs/platform/commands/common/commands", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/editor/contrib/snippet/snippetController2", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/platform/quickinput/common/quickInput", "vs/platform/clipboard/common/clipboardService"], function (require, exports, nls, editorExtensions_1, modeService_1, commands_1, snippets_contribution_1, snippetController2_1, editorContextKeys_1, snippetsFile_1, quickInput_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Args {
        constructor(snippet, name, langId) {
            this.snippet = snippet;
            this.name = name;
            this.langId = langId;
        }
        static fromUser(arg) {
            if (!arg || typeof arg !== 'object') {
                return Args._empty;
            }
            let { snippet, name, langId } = arg;
            if (typeof snippet !== 'string') {
                snippet = undefined;
            }
            if (typeof name !== 'string') {
                name = undefined;
            }
            if (typeof langId !== 'string') {
                langId = undefined;
            }
            return new Args(snippet, name, langId);
        }
    }
    Args._empty = new Args(undefined, undefined, undefined);
    class InsertSnippetAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertSnippet',
                label: nls.localize('snippet.suggestions.label', "Insert Snippet"),
                alias: 'Insert Snippet',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                description: {
                    description: `Insert Snippet`,
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'snippet': {
                                        'type': 'string'
                                    },
                                    'langId': {
                                        'type': 'string',
                                    },
                                    'name': {
                                        'type': 'string'
                                    }
                                },
                            }
                        }]
                }
            });
        }
        async run(accessor, editor, arg) {
            const modeService = accessor.get(modeService_1.IModeService);
            const snippetService = accessor.get(snippets_contribution_1.ISnippetsService);
            if (!editor.hasModel()) {
                return;
            }
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const snippet = await new Promise(async (resolve, reject) => {
                const { lineNumber, column } = editor.getPosition();
                let { snippet, name, langId } = Args.fromUser(arg);
                if (snippet) {
                    return resolve(new snippetsFile_1.Snippet([], '', '', '', snippet, '', 1 /* User */));
                }
                let languageId = 0 /* Null */;
                if (langId) {
                    const otherLangId = modeService.getLanguageIdentifier(langId);
                    if (otherLangId) {
                        languageId = otherLangId.id;
                    }
                }
                else {
                    editor.getModel().tokenizeIfCheap(lineNumber);
                    languageId = editor.getModel().getLanguageIdAtPosition(lineNumber, column);
                    // validate the `languageId` to ensure this is a user
                    // facing language with a name and the chance to have
                    // snippets, else fall back to the outer language
                    const otherLangId = modeService.getLanguageIdentifier(languageId);
                    if (otherLangId && !modeService.getLanguageName(otherLangId.language)) {
                        languageId = editor.getModel().getLanguageIdentifier().id;
                    }
                }
                if (name) {
                    // take selected snippet
                    (await snippetService.getSnippets(languageId)).every(snippet => {
                        if (snippet.name !== name) {
                            return true;
                        }
                        resolve(snippet);
                        return false;
                    });
                }
                else {
                    // let user pick a snippet
                    const snippets = (await snippetService.getSnippets(languageId)).sort(snippetsFile_1.Snippet.compare);
                    const picks = [];
                    let prevSnippet;
                    for (const snippet of snippets) {
                        const pick = {
                            label: snippet.prefix,
                            detail: snippet.description,
                            snippet
                        };
                        if (!prevSnippet || prevSnippet.snippetSource !== snippet.snippetSource) {
                            let label = '';
                            switch (snippet.snippetSource) {
                                case 1 /* User */:
                                    label = nls.localize('sep.userSnippet', "User Snippets");
                                    break;
                                case 3 /* Extension */:
                                    label = nls.localize('sep.extSnippet', "Extension Snippets");
                                    break;
                                case 2 /* Workspace */:
                                    label = nls.localize('sep.workspaceSnippet', "Workspace Snippets");
                                    break;
                            }
                            picks.push({ type: 'separator', label });
                        }
                        picks.push(pick);
                        prevSnippet = snippet;
                    }
                    return quickInputService.pick(picks, { matchOnDetail: true }).then(pick => resolve(pick && pick.snippet), reject);
                }
            });
            if (!snippet) {
                return;
            }
            let clipboardText;
            if (snippet.needsClipboard) {
                clipboardText = await clipboardService.readText();
            }
            snippetController2_1.SnippetController2.get(editor).insert(snippet.codeSnippet, { clipboardText });
        }
    }
    editorExtensions_1.registerEditorAction(InsertSnippetAction);
    // compatibility command to make sure old keybinding are still working
    commands_1.CommandsRegistry.registerCommand('editor.action.showSnippets', accessor => {
        return accessor.get(commands_1.ICommandService).executeCommand('editor.action.insertSnippet');
    });
});
//# __sourceMappingURL=insertSnippet.js.map