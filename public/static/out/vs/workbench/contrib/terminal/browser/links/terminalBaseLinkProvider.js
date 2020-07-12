/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalBaseLinkProvider = void 0;
    class TerminalBaseLinkProvider {
        async provideLinks(bufferLineNumber, callback) {
            var _a;
            (_a = this._activeLinks) === null || _a === void 0 ? void 0 : _a.forEach(l => l.dispose);
            this._activeLinks = await this._provideLinks(bufferLineNumber);
            callback(this._activeLinks);
        }
    }
    exports.TerminalBaseLinkProvider = TerminalBaseLinkProvider;
});
//# __sourceMappingURL=terminalBaseLinkProvider.js.map