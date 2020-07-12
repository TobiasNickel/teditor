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
define(["require", "exports", "vs/editor/common/modes/linkComputer", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/workbench/contrib/terminal/browser/links/terminalLink", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/terminal/browser/links/terminalBaseLinkProvider"], function (require, exports, linkComputer_1, terminalLinkHelpers_1, terminalLink_1, instantiation_1, uri_1, terminalBaseLinkProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProtocolLinkProvider = void 0;
    let TerminalProtocolLinkProvider = class TerminalProtocolLinkProvider extends terminalBaseLinkProvider_1.TerminalBaseLinkProvider {
        constructor(_xterm, _activateCallback, _tooltipCallback, _instantiationService) {
            super();
            this._xterm = _xterm;
            this._activateCallback = _activateCallback;
            this._tooltipCallback = _tooltipCallback;
            this._instantiationService = _instantiationService;
        }
        _provideLinks(y) {
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
            this._linkComputerTarget = new TerminalLinkAdapter(this._xterm, startLine, endLine);
            const links = linkComputer_1.LinkComputer.computeLinks(this._linkComputerTarget);
            return links.map(link => {
                var _a;
                const range = terminalLinkHelpers_1.convertLinkRangeToBuffer(lines, this._xterm.cols, link.range, startLine);
                // Check if the link if within the mouse position
                const uri = link.url
                    ? (typeof link.url === 'string' ? uri_1.URI.parse(link.url) : link.url)
                    : undefined;
                const label = ((uri === null || uri === void 0 ? void 0 : uri.scheme) === 'file') ? terminalLink_1.OPEN_FILE_LABEL : undefined;
                return this._instantiationService.createInstance(terminalLink_1.TerminalLink, range, ((_a = link.url) === null || _a === void 0 ? void 0 : _a.toString()) || '', this._xterm.buffer.active.viewportY, this._activateCallback, this._tooltipCallback, true, label);
            });
        }
    };
    TerminalProtocolLinkProvider = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], TerminalProtocolLinkProvider);
    exports.TerminalProtocolLinkProvider = TerminalProtocolLinkProvider;
    class TerminalLinkAdapter {
        constructor(_xterm, _lineStart, _lineEnd) {
            this._xterm = _xterm;
            this._lineStart = _lineStart;
            this._lineEnd = _lineEnd;
        }
        getLineCount() {
            return 1;
        }
        getLineContent() {
            return terminalLinkHelpers_1.getXtermLineContent(this._xterm.buffer.active, this._lineStart, this._lineEnd, this._xterm.cols);
        }
    }
});
//# __sourceMappingURL=terminalProtocolLinkProvider.js.map