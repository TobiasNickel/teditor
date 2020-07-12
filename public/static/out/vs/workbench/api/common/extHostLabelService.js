/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol"], function (require, exports, lifecycle_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLabelService = void 0;
    class ExtHostLabelService {
        constructor(mainContext) {
            this._handlePool = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLabelService);
        }
        $registerResourceLabelFormatter(formatter) {
            const handle = this._handlePool++;
            this._proxy.$registerResourceLabelFormatter(handle, formatter);
            return lifecycle_1.toDisposable(() => {
                this._proxy.$unregisterResourceLabelFormatter(handle);
            });
        }
    }
    exports.ExtHostLabelService = ExtHostLabelService;
});
//# __sourceMappingURL=extHostLabelService.js.map