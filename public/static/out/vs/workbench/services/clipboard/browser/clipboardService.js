/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/clipboard/common/clipboardService", "vs/platform/clipboard/browser/clipboardService"], function (require, exports, extensions_1, clipboardService_1, clipboardService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(clipboardService_1.IClipboardService, clipboardService_2.BrowserClipboardService, true);
});
//# __sourceMappingURL=clipboardService.js.map