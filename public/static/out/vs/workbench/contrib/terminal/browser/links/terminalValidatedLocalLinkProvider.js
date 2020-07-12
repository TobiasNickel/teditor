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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/workbench/contrib/terminal/browser/links/terminalLink", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources", "vs/platform/commands/common/commands", "vs/platform/workspace/common/workspace", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/terminal/browser/links/terminalBaseLinkProvider"], function (require, exports, terminalLinkHelpers_1, terminalLink_1, instantiation_1, resources_1, commands_1, workspace_1, host_1, terminalBaseLinkProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalValidatedLocalLinkProvider = exports.lineAndColumnClauseGroupCount = exports.unixLineAndColumnMatchIndex = exports.winLineAndColumnMatchIndex = exports.lineAndColumnClause = exports.winLocalLinkClause = exports.winDrivePrefix = exports.unixLocalLinkClause = void 0;
    const pathPrefix = '(\\.\\.?|\\~)';
    const pathSeparatorClause = '\\/';
    // '":; are allowed in paths but they are often separators so ignore them
    // Also disallow \\ to prevent a catastropic backtracking case #24798
    const excludedPathCharactersClause = '[^\\0\\s!$`&*()\\[\\]+\'":;\\\\]';
    /** A regex that matches paths in the form /foo, ~/foo, ./foo, ../foo, foo/bar */
    exports.unixLocalLinkClause = '((' + pathPrefix + '|(' + excludedPathCharactersClause + ')+)?(' + pathSeparatorClause + '(' + excludedPathCharactersClause + ')+)+)';
    exports.winDrivePrefix = '(?:\\\\\\\\\\?\\\\)?[a-zA-Z]:';
    const winPathPrefix = '(' + exports.winDrivePrefix + '|\\.\\.?|\\~)';
    const winPathSeparatorClause = '(\\\\|\\/)';
    const winExcludedPathCharactersClause = '[^\\0<>\\?\\|\\/\\s!$`&*()\\[\\]+\'":;]';
    /** A regex that matches paths in the form \\?\c:\foo c:\foo, ~\foo, .\foo, ..\foo, foo\bar */
    exports.winLocalLinkClause = '((' + winPathPrefix + '|(' + winExcludedPathCharactersClause + ')+)?(' + winPathSeparatorClause + '(' + winExcludedPathCharactersClause + ')+)+)';
    /** As xterm reads from DOM, space in that case is nonbreaking char ASCII code - 160,
    replacing space with nonBreakningSpace or space ASCII code - 32. */
    exports.lineAndColumnClause = [
        '((\\S*)", line ((\\d+)( column (\\d+))?))',
        '((\\S*)",((\\d+)(:(\\d+))?))',
        '((\\S*) on line ((\\d+)(, column (\\d+))?))',
        '((\\S*):line ((\\d+)(, column (\\d+))?))',
        '(([^\\s\\(\\)]*)(\\s?[\\(\\[](\\d+)(,\\s?(\\d+))?)[\\)\\]])',
        '(([^:\\s\\(\\)<>\'\"\\[\\]]*)(:(\\d+))?(:(\\d+))?)' // (file path):336, (file path):336:9
    ].join('|').replace(/ /g, `[${'\u00A0'} ]`);
    // Changing any regex may effect this value, hence changes this as well if required.
    exports.winLineAndColumnMatchIndex = 12;
    exports.unixLineAndColumnMatchIndex = 11;
    // Each line and column clause have 6 groups (ie no. of expressions in round brackets)
    exports.lineAndColumnClauseGroupCount = 6;
    let TerminalValidatedLocalLinkProvider = class TerminalValidatedLocalLinkProvider extends terminalBaseLinkProvider_1.TerminalBaseLinkProvider {
        constructor(_xterm, _processOperatingSystem, _activateFileCallback, _wrapLinkHandler, _tooltipCallback, _validationCallback, _instantiationService, _commandService, _workspaceContextService, _hostService) {
            super();
            this._xterm = _xterm;
            this._processOperatingSystem = _processOperatingSystem;
            this._activateFileCallback = _activateFileCallback;
            this._wrapLinkHandler = _wrapLinkHandler;
            this._tooltipCallback = _tooltipCallback;
            this._validationCallback = _validationCallback;
            this._instantiationService = _instantiationService;
            this._commandService = _commandService;
            this._workspaceContextService = _workspaceContextService;
            this._hostService = _hostService;
        }
        async _provideLinks(y) {
            var _a, _b;
            const result = [];
            let startLine = y - 1;
            let endLine = startLine;
            const lines = [
                this._xterm.buffer.active.getLine(startLine)
            ];
            while ((_a = this._xterm.buffer.active.getLine(startLine)) === null || _a === void 0 ? void 0 : _a.isWrapped) {
                lines.unshift(this._xterm.buffer.active.getLine(startLine - 1));
                startLine--;
            }
            while ((_b = this._xterm.buffer.active.getLine(endLine + 1)) === null || _b === void 0 ? void 0 : _b.isWrapped) {
                lines.push(this._xterm.buffer.active.getLine(endLine + 1));
                endLine++;
            }
            const text = terminalLinkHelpers_1.getXtermLineContent(this._xterm.buffer.active, startLine, endLine, this._xterm.cols);
            // clone regex to do a global search on text
            const rex = new RegExp(this._localLinkRegex, 'g');
            let match;
            let stringIndex = -1;
            while ((match = rex.exec(text)) !== null) {
                // const link = match[typeof matcher.matchIndex !== 'number' ? 0 : matcher.matchIndex];
                let link = match[0];
                if (!link) {
                    // something matched but does not comply with the given matchIndex
                    // since this is most likely a bug the regex itself we simply do nothing here
                    // this._logService.debug('match found without corresponding matchIndex', match, matcher);
                    break;
                }
                // Get index, match.index is for the outer match which includes negated chars
                // therefore we cannot use match.index directly, instead we search the position
                // of the match group in text again
                // also correct regex and string search offsets for the next loop run
                stringIndex = text.indexOf(link, stringIndex + 1);
                rex.lastIndex = stringIndex + link.length;
                if (stringIndex < 0) {
                    // invalid stringIndex (should not have happened)
                    break;
                }
                // Adjust the link range to exclude a/ and b/ if it looks like a git diff
                if (
                // --- a/foo/bar
                // +++ b/foo/bar
                ((text.startsWith('--- a/') || text.startsWith('+++ b/')) && stringIndex === 4) ||
                    // diff --git a/foo/bar b/foo/bar
                    (text.startsWith('diff --git') && (link.startsWith('a/') || link.startsWith('b/')))) {
                    link = link.substring(2);
                    stringIndex += 2;
                }
                // Convert the link text's string index into a wrapped buffer range
                const bufferRange = terminalLinkHelpers_1.convertLinkRangeToBuffer(lines, this._xterm.cols, {
                    startColumn: stringIndex + 1,
                    startLineNumber: 1,
                    endColumn: stringIndex + link.length + 1,
                    endLineNumber: 1
                }, startLine);
                const validatedLink = await new Promise(r => {
                    this._validationCallback(link, (result) => {
                        if (result) {
                            const label = result.isDirectory
                                ? (this._isDirectoryInsideWorkspace(result.uri) ? terminalLink_1.FOLDER_IN_WORKSPACE_LABEL : terminalLink_1.FOLDER_NOT_IN_WORKSPACE_LABEL)
                                : terminalLink_1.OPEN_FILE_LABEL;
                            const activateCallback = this._wrapLinkHandler((event, text) => {
                                if (result.isDirectory) {
                                    this._handleLocalFolderLink(result.uri);
                                }
                                else {
                                    this._activateFileCallback(event, text);
                                }
                            });
                            r(this._instantiationService.createInstance(terminalLink_1.TerminalLink, bufferRange, link, this._xterm.buffer.active.viewportY, activateCallback, this._tooltipCallback, true, label));
                        }
                        else {
                            r(undefined);
                        }
                    });
                });
                if (validatedLink) {
                    result.push(validatedLink);
                }
            }
            return result;
        }
        get _localLinkRegex() {
            const baseLocalLinkClause = this._processOperatingSystem === 1 /* Windows */ ? exports.winLocalLinkClause : exports.unixLocalLinkClause;
            // Append line and column number regex
            return new RegExp(`${baseLocalLinkClause}(${exports.lineAndColumnClause})`);
        }
        async _handleLocalFolderLink(uri) {
            // If the folder is within one of the window's workspaces, focus it in the explorer
            if (this._isDirectoryInsideWorkspace(uri)) {
                await this._commandService.executeCommand('revealInExplorer', uri);
                return;
            }
            // Open a new window for the folder
            this._hostService.openWindow([{ folderUri: uri }], { forceNewWindow: true });
        }
        _isDirectoryInsideWorkspace(uri) {
            const folders = this._workspaceContextService.getWorkspace().folders;
            for (let i = 0; i < folders.length; i++) {
                if (resources_1.isEqualOrParent(uri, folders[i].uri)) {
                    return true;
                }
            }
            return false;
        }
    };
    TerminalValidatedLocalLinkProvider = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, commands_1.ICommandService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, host_1.IHostService)
    ], TerminalValidatedLocalLinkProvider);
    exports.TerminalValidatedLocalLinkProvider = TerminalValidatedLocalLinkProvider;
});
//# __sourceMappingURL=terminalValidatedLocalLinkProvider.js.map