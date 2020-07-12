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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/platform/label/common/label", "vs/base/common/lifecycle"], function (require, exports, extHost_protocol_1, extHostCustomers_1, label_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLabelService = void 0;
    let MainThreadLabelService = class MainThreadLabelService {
        constructor(_, _labelService) {
            this._labelService = _labelService;
            this._resourceLabelFormatters = new Map();
        }
        $registerResourceLabelFormatter(handle, formatter) {
            // Dynamicily registered formatters should have priority over those contributed via package.json
            formatter.priority = true;
            const disposable = this._labelService.registerFormatter(formatter);
            this._resourceLabelFormatters.set(handle, disposable);
        }
        $unregisterResourceLabelFormatter(handle) {
            lifecycle_1.dispose(this._resourceLabelFormatters.get(handle));
            this._resourceLabelFormatters.delete(handle);
        }
        dispose() {
            // noop
        }
    };
    MainThreadLabelService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadLabelService),
        __param(1, label_1.ILabelService)
    ], MainThreadLabelService);
    exports.MainThreadLabelService = MainThreadLabelService;
});
//# __sourceMappingURL=mainThreadLabelService.js.map