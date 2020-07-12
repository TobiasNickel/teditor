/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log"], function (require, exports, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConsoleLogInAutomationService = void 0;
    /**
     * A logger that is used when VSCode is running in the web with
     * an automation such as playwright. We expect a global codeAutomationLog
     * to be defined that we can use to log to.
     */
    class ConsoleLogInAutomationService extends log_1.LogServiceAdapter {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super({ consoleLog: (type, args) => this.consoleLog(type, args) }, logLevel);
        }
        consoleLog(type, args) {
            const automatedWindow = window;
            if (typeof automatedWindow.codeAutomationLog === 'function') {
                automatedWindow.codeAutomationLog(type, args);
            }
        }
    }
    exports.ConsoleLogInAutomationService = ConsoleLogInAutomationService;
});
//# __sourceMappingURL=log.js.map