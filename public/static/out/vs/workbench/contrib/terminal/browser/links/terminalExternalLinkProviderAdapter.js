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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/workbench/contrib/terminal/browser/links/terminalLink", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/links/terminalBaseLinkProvider"], function (require, exports, terminalLinkHelpers_1, terminalLink_1, instantiation_1, terminalBaseLinkProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalExternalLinkProviderAdapter = void 0;
    /**
     * An adapter to convert a simple external link provider into an internal link provider that
     * manages link lifecycle, hovers, etc. and gets registered in xterm.js.
     */
    let TerminalExternalLinkProviderAdapter = class TerminalExternalLinkProviderAdapter extends terminalBaseLinkProvider_1.TerminalBaseLinkProvider {
        constructor(_xterm, _instance, _externalLinkProvider, _tooltipCallback, _instantiationService) {
            super();
            this._xterm = _xterm;
            this._instance = _instance;
            this._externalLinkProvider = _externalLinkProvider;
            this._tooltipCallback = _tooltipCallback;
            this._instantiationService = _instantiationService;
        }
        async _provideLinks(y) {
            var _a, _b;
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
            const lineContent = terminalLinkHelpers_1.getXtermLineContent(this._xterm.buffer.active, startLine, endLine, this._xterm.cols);
            const externalLinks = await this._externalLinkProvider.provideLinks(this._instance, lineContent);
            if (!externalLinks) {
                return [];
            }
            return externalLinks.map(link => {
                const bufferRange = terminalLinkHelpers_1.convertLinkRangeToBuffer(lines, this._xterm.cols, {
                    startColumn: link.startIndex + 1,
                    startLineNumber: 1,
                    endColumn: link.startIndex + link.length + 1,
                    endLineNumber: 1
                }, startLine);
                const matchingText = lineContent.substr(link.startIndex, link.length) || '';
                return this._instantiationService.createInstance(terminalLink_1.TerminalLink, bufferRange, matchingText, this._xterm.buffer.active.viewportY, (_, text) => link.activate(text), this._tooltipCallback, true, link.label);
            });
        }
    };
    TerminalExternalLinkProviderAdapter = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], TerminalExternalLinkProviderAdapter);
    exports.TerminalExternalLinkProviderAdapter = TerminalExternalLinkProviderAdapter;
});
//# __sourceMappingURL=terminalExternalLinkProviderAdapter.js.map