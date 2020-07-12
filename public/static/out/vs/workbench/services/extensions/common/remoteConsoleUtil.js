/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/console"], function (require, exports, console_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logRemoteEntry = void 0;
    function logRemoteEntry(logService, entry) {
        const args = console_1.parse(entry).args;
        const firstArg = args.shift();
        if (typeof firstArg !== 'string') {
            return;
        }
        if (!entry.severity) {
            entry.severity = 'info';
        }
        switch (entry.severity) {
            case 'log':
            case 'info':
                logService.info(firstArg, ...args);
                break;
            case 'warn':
                logService.warn(firstArg, ...args);
                break;
            case 'error':
                logService.error(firstArg, ...args);
                break;
        }
    }
    exports.logRemoteEntry = logRemoteEntry;
});
//# __sourceMappingURL=remoteConsoleUtil.js.map