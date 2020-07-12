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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/links/terminalLink", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/services/search/common/search", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/search/common/queryBuilder", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/links/terminalBaseLinkProvider"], function (require, exports, configuration_1, terminal_1, terminalLink_1, nls_1, quickInput_1, workspace_1, search_1, editorService_1, queryBuilder_1, instantiation_1, terminalBaseLinkProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWordLinkProvider = void 0;
    let TerminalWordLinkProvider = class TerminalWordLinkProvider extends terminalBaseLinkProvider_1.TerminalBaseLinkProvider {
        constructor(_xterm, _wrapLinkHandler, _tooltipCallback, _instantiationService, _configurationService, _quickInputService, _workspaceContextService, _searchService, _editorService) {
            super();
            this._xterm = _xterm;
            this._wrapLinkHandler = _wrapLinkHandler;
            this._tooltipCallback = _tooltipCallback;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._quickInputService = _quickInputService;
            this._workspaceContextService = _workspaceContextService;
            this._searchService = _searchService;
            this._editorService = _editorService;
            this._fileQueryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        _provideLinks(y) {
            // TODO: Support wrapping
            // Dispose of all old links if new links are provides, links are only cached for the current line
            const result = [];
            const wordSeparators = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).wordSeparators;
            const activateCallback = this._wrapLinkHandler((_, link) => this._activate(link));
            const line = this._xterm.buffer.active.getLine(y - 1);
            let text = '';
            let startX = -1;
            const cellData = line.getCell(0);
            for (let x = 0; x < line.length; x++) {
                line.getCell(x, cellData);
                const chars = cellData.getChars();
                const width = cellData.getWidth();
                // Add a link if this is a separator
                if (width !== 0 && wordSeparators.indexOf(chars) >= 0) {
                    if (startX !== -1) {
                        result.push(new terminalLink_1.TerminalLink({ start: { x: startX + 1, y }, end: { x, y } }, text, this._xterm.buffer.active.viewportY, activateCallback, this._tooltipCallback, false, nls_1.localize('searchWorkspace', 'Search workspace'), this._configurationService));
                        text = '';
                        startX = -1;
                    }
                    continue;
                }
                // Mark the start of a link if it hasn't started yet
                if (startX === -1) {
                    startX = x;
                }
                text += chars;
            }
            // Add the final link if there is one
            if (startX !== -1) {
                result.push(new terminalLink_1.TerminalLink({ start: { x: startX + 1, y }, end: { x: line.length, y } }, text, this._xterm.buffer.active.viewportY, activateCallback, this._tooltipCallback, false, nls_1.localize('searchWorkspace', 'Search workspace'), this._configurationService));
            }
            return result;
        }
        async _activate(link) {
            const results = await this._searchService.fileSearch(this._fileQueryBuilder.file(this._workspaceContextService.getWorkspace().folders, {
                filePattern: link,
                maxResults: 2
            }));
            // If there was exactly one match, open it
            if (results.results.length === 1) {
                const match = results.results[0];
                await this._editorService.openEditor({ resource: match.resource, options: { pinned: true } });
                return;
            }
            // Fallback to searching quick access
            this._quickInputService.quickAccess.show(link);
        }
    };
    TerminalWordLinkProvider = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, search_1.ISearchService),
        __param(8, editorService_1.IEditorService)
    ], TerminalWordLinkProvider);
    exports.TerminalWordLinkProvider = TerminalWordLinkProvider;
});
//# __sourceMappingURL=terminalWordLinkProvider.js.map