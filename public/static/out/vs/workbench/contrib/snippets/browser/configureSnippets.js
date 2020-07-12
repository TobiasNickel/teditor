/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/environment/common/environment", "vs/editor/common/services/modeService", "vs/base/common/path", "vs/platform/actions/common/actions", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/extpath", "vs/base/common/resources"], function (require, exports, nls, commands_1, environment_1, modeService_1, path_1, actions_1, opener_1, uri_1, snippets_contribution_1, quickInput_1, workspace_1, files_1, textfiles_1, extpath_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const id = 'workbench.action.openSnippets';
    var ISnippetPick;
    (function (ISnippetPick) {
        function is(thing) {
            return !!thing && uri_1.URI.isUri(thing.filepath);
        }
        ISnippetPick.is = is;
    })(ISnippetPick || (ISnippetPick = {}));
    async function computePicks(snippetService, envService, modeService) {
        const existing = [];
        const future = [];
        const seen = new Set();
        for (const file of await snippetService.getSnippetFiles()) {
            if (file.source === 3 /* Extension */) {
                // skip extension snippets
                continue;
            }
            if (file.isGlobalSnippets) {
                await file.load();
                // list scopes for global snippets
                const names = new Set();
                outer: for (const snippet of file.data) {
                    for (const scope of snippet.scopes) {
                        const name = modeService.getLanguageName(scope);
                        if (name) {
                            if (names.size >= 4) {
                                names.add(`${name}...`);
                                break outer;
                            }
                            else {
                                names.add(name);
                            }
                        }
                    }
                }
                existing.push({
                    label: resources_1.basename(file.location),
                    filepath: file.location,
                    description: names.size === 0
                        ? nls.localize('global.scope', "(global)")
                        : nls.localize('global.1', "({0})", [...names].join(', '))
                });
            }
            else {
                // language snippet
                const mode = resources_1.basename(file.location).replace(/\.json$/, '');
                existing.push({
                    label: resources_1.basename(file.location),
                    description: `(${modeService.getLanguageName(mode)})`,
                    filepath: file.location
                });
                seen.add(mode);
            }
        }
        const dir = envService.snippetsHome;
        for (const mode of modeService.getRegisteredModes()) {
            const label = modeService.getLanguageName(mode);
            if (label && !seen.has(mode)) {
                future.push({
                    label: mode,
                    description: `(${label})`,
                    filepath: resources_1.joinPath(dir, `${mode}.json`),
                    hint: true
                });
            }
        }
        existing.sort((a, b) => {
            let a_ext = path_1.extname(a.filepath.path);
            let b_ext = path_1.extname(b.filepath.path);
            if (a_ext === b_ext) {
                return a.label.localeCompare(b.label);
            }
            else if (a_ext === '.code-snippets') {
                return -1;
            }
            else {
                return 1;
            }
        });
        future.sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        return { existing, future };
    }
    async function createSnippetFile(scope, defaultPath, quickInputService, fileService, textFileService, opener) {
        function createSnippetUri(input) {
            const filename = path_1.extname(input) !== '.code-snippets'
                ? `${input}.code-snippets`
                : input;
            return resources_1.joinPath(defaultPath, filename);
        }
        await fileService.createFolder(defaultPath);
        const input = await quickInputService.input({
            placeHolder: nls.localize('name', "Type snippet file name"),
            async validateInput(input) {
                if (!input) {
                    return nls.localize('bad_name1', "Invalid file name");
                }
                if (!extpath_1.isValidBasename(input)) {
                    return nls.localize('bad_name2', "'{0}' is not a valid file name", input);
                }
                if (await fileService.exists(createSnippetUri(input))) {
                    return nls.localize('bad_name3', "'{0}' already exists", input);
                }
                return undefined;
            }
        });
        if (!input) {
            return undefined;
        }
        const resource = createSnippetUri(input);
        await textFileService.write(resource, [
            '{',
            '\t// Place your ' + scope + ' snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and ',
            '\t// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope ',
            '\t// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is ',
            '\t// used to trigger the snippet and the body will be expanded and inserted. Possible variables are: ',
            '\t// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. ',
            '\t// Placeholders with the same ids are connected.',
            '\t// Example:',
            '\t// "Print to console": {',
            '\t// \t"scope": "javascript,typescript",',
            '\t// \t"prefix": "log",',
            '\t// \t"body": [',
            '\t// \t\t"console.log(\'$1\');",',
            '\t// \t\t"$2"',
            '\t// \t],',
            '\t// \t"description": "Log output to console"',
            '\t// }',
            '}'
        ].join('\n'));
        await opener.open(resource);
        return undefined;
    }
    async function createLanguageSnippetFile(pick, fileService, textFileService) {
        if (await fileService.exists(pick.filepath)) {
            return;
        }
        const contents = [
            '{',
            '\t// Place your snippets for ' + pick.label + ' here. Each snippet is defined under a snippet name and has a prefix, body and ',
            '\t// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted. Possible variables are:',
            '\t// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. Placeholders with the ',
            '\t// same ids are connected.',
            '\t// Example:',
            '\t// "Print to console": {',
            '\t// \t"prefix": "log",',
            '\t// \t"body": [',
            '\t// \t\t"console.log(\'$1\');",',
            '\t// \t\t"$2"',
            '\t// \t],',
            '\t// \t"description": "Log output to console"',
            '\t// }',
            '}'
        ].join('\n');
        await textFileService.write(pick.filepath, contents);
    }
    commands_1.CommandsRegistry.registerCommand(id, async (accessor) => {
        const snippetService = accessor.get(snippets_contribution_1.ISnippetsService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const opener = accessor.get(opener_1.IOpenerService);
        const modeService = accessor.get(modeService_1.IModeService);
        const envService = accessor.get(environment_1.IEnvironmentService);
        const workspaceService = accessor.get(workspace_1.IWorkspaceContextService);
        const fileService = accessor.get(files_1.IFileService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const picks = await computePicks(snippetService, envService, modeService);
        const existing = picks.existing;
        const globalSnippetPicks = [{
                scope: nls.localize('new.global_scope', 'global'),
                label: nls.localize('new.global', "New Global Snippets file..."),
                uri: envService.snippetsHome
            }];
        const workspaceSnippetPicks = [];
        for (const folder of workspaceService.getWorkspace().folders) {
            workspaceSnippetPicks.push({
                scope: nls.localize('new.workspace_scope', "{0} workspace", folder.name),
                label: nls.localize('new.folder', "New Snippets file for '{0}'...", folder.name),
                uri: folder.toResource('.vscode')
            });
        }
        if (existing.length > 0) {
            existing.unshift({ type: 'separator', label: nls.localize('group.global', "Existing Snippets") });
            existing.push({ type: 'separator', label: nls.localize('new.global.sep', "New Snippets") });
        }
        else {
            existing.push({ type: 'separator', label: nls.localize('new.global.sep', "New Snippets") });
        }
        const pick = await quickInputService.pick([].concat(existing, globalSnippetPicks, workspaceSnippetPicks, picks.future), {
            placeHolder: nls.localize('openSnippet.pickLanguage', "Select Snippets File or Create Snippets"),
            matchOnDescription: true
        });
        if (globalSnippetPicks.indexOf(pick) >= 0) {
            return createSnippetFile(pick.scope, pick.uri, quickInputService, fileService, textFileService, opener);
        }
        else if (workspaceSnippetPicks.indexOf(pick) >= 0) {
            return createSnippetFile(pick.scope, pick.uri, quickInputService, fileService, textFileService, opener);
        }
        else if (ISnippetPick.is(pick)) {
            if (pick.hint) {
                await createLanguageSnippetFile(pick, fileService, textFileService);
            }
            return opener.open(pick.filepath);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id,
            title: { value: nls.localize('openSnippet.label', "Configure User Snippets"), original: 'Configure User Snippets' },
            category: { value: nls.localize('preferences', "Preferences"), original: 'Preferences' }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        group: '3_snippets',
        command: {
            id,
            title: nls.localize({ key: 'miOpenSnippets', comment: ['&& denotes a mnemonic'] }, "User &&Snippets")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '3_snippets',
        command: {
            id,
            title: nls.localize('userSnippets', "User Snippets")
        },
        order: 1
    });
});
//# __sourceMappingURL=configureSnippets.js.map