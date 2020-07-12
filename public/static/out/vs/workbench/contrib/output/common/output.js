/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IOutputService = exports.CONTEXT_OUTPUT_SCROLL_LOCK = exports.CONTEXT_ACTIVE_LOG_OUTPUT = exports.CONTEXT_IN_OUTPUT = exports.MAX_OUTPUT_LENGTH = exports.OUTPUT_SERVICE_ID = exports.OUTPUT_VIEW_ID = exports.LOG_MODE_ID = exports.LOG_SCHEME = exports.LOG_MIME = exports.OUTPUT_MODE_ID = exports.OUTPUT_SCHEME = exports.OUTPUT_MIME = void 0;
    /**
     * Mime type used by the output editor.
     */
    exports.OUTPUT_MIME = 'text/x-code-output';
    /**
     * Output resource scheme.
     */
    exports.OUTPUT_SCHEME = 'output';
    /**
     * Id used by the output editor.
     */
    exports.OUTPUT_MODE_ID = 'Log';
    /**
     * Mime type used by the log output editor.
     */
    exports.LOG_MIME = 'text/x-code-log-output';
    /**
     * Log resource scheme.
     */
    exports.LOG_SCHEME = 'log';
    /**
     * Id used by the log output editor.
     */
    exports.LOG_MODE_ID = 'log';
    /**
     * Output view id
     */
    exports.OUTPUT_VIEW_ID = 'workbench.panel.output';
    exports.OUTPUT_SERVICE_ID = 'outputService';
    exports.MAX_OUTPUT_LENGTH = 10000 /* Max. number of output lines to show in output */ * 100 /* Guestimated chars per line */;
    exports.CONTEXT_IN_OUTPUT = new contextkey_1.RawContextKey('inOutput', false);
    exports.CONTEXT_ACTIVE_LOG_OUTPUT = new contextkey_1.RawContextKey('activeLogOutput', false);
    exports.CONTEXT_OUTPUT_SCROLL_LOCK = new contextkey_1.RawContextKey(`outputView.scrollLock`, false);
    exports.IOutputService = instantiation_1.createDecorator(exports.OUTPUT_SERVICE_ID);
});
//# __sourceMappingURL=output.js.map