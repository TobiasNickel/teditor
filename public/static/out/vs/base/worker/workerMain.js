"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    let MonacoEnvironment = self.MonacoEnvironment;
    let monacoBaseUrl = MonacoEnvironment && MonacoEnvironment.baseUrl ? MonacoEnvironment.baseUrl : '../../../';
    if (typeof self.define !== 'function' || !self.define.amd) {
        importScripts(monacoBaseUrl + 'vs/loader.js');
    }
    require.config({
        baseUrl: monacoBaseUrl,
        catchError: true
    });
    let loadCode = function (moduleId) {
        require([moduleId], function (ws) {
            setTimeout(function () {
                let messageHandler = ws.create((msg, transfer) => {
                    self.postMessage(msg, transfer);
                }, null);
                self.onmessage = (e) => messageHandler.onmessage(e.data);
                while (beforeReadyMessages.length > 0) {
                    self.onmessage(beforeReadyMessages.shift());
                }
            }, 0);
        });
    };
    let isFirstMessage = true;
    let beforeReadyMessages = [];
    self.onmessage = (message) => {
        if (!isFirstMessage) {
            beforeReadyMessages.push(message);
            return;
        }
        isFirstMessage = false;
        loadCode(message.data);
    };
})();
//# __sourceMappingURL=workerMain.js.map