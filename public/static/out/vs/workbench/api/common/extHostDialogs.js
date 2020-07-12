/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol"], function (require, exports, uri_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDialogs = void 0;
    class ExtHostDialogs {
        constructor(mainContext) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDialogs);
        }
        showOpenDialog(options) {
            return this._proxy.$showOpenDialog(options).then(filepaths => {
                return filepaths ? filepaths.map(p => uri_1.URI.revive(p)) : undefined;
            });
        }
        showSaveDialog(options) {
            return this._proxy.$showSaveDialog(options).then(filepath => {
                return filepath ? uri_1.URI.revive(filepath) : undefined;
            });
        }
    }
    exports.ExtHostDialogs = ExtHostDialogs;
});
//# __sourceMappingURL=extHostDialogs.js.map