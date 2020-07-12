/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources", "vs/nls"], function (require, exports, instantiation_1, resources_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFileNamesMessage = exports.ConfirmResult = exports.IFileDialogService = exports.IDialogService = void 0;
    exports.IDialogService = instantiation_1.createDecorator('dialogService');
    exports.IFileDialogService = instantiation_1.createDecorator('fileDialogService');
    var ConfirmResult;
    (function (ConfirmResult) {
        ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
        ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
        ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
    })(ConfirmResult = exports.ConfirmResult || (exports.ConfirmResult = {}));
    const MAX_CONFIRM_FILES = 10;
    function getFileNamesMessage(fileNamesOrResources) {
        const message = [];
        message.push(...fileNamesOrResources.slice(0, MAX_CONFIRM_FILES).map(fileNameOrResource => typeof fileNameOrResource === 'string' ? fileNameOrResource : resources_1.basename(fileNameOrResource)));
        if (fileNamesOrResources.length > MAX_CONFIRM_FILES) {
            if (fileNamesOrResources.length - MAX_CONFIRM_FILES === 1) {
                message.push(nls_1.localize('moreFile', "...1 additional file not shown"));
            }
            else {
                message.push(nls_1.localize('moreFiles', "...{0} additional files not shown", fileNamesOrResources.length - MAX_CONFIRM_FILES));
            }
        }
        message.push('');
        return message.join('\n');
    }
    exports.getFileNamesMessage = getFileNamesMessage;
});
//# __sourceMappingURL=dialogs.js.map