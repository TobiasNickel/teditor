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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/platform/download/common/download", "vs/base/common/uri"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, download_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDownloadService = void 0;
    let MainThreadDownloadService = class MainThreadDownloadService extends lifecycle_1.Disposable {
        constructor(extHostContext, downloadService) {
            super();
            this.downloadService = downloadService;
        }
        $download(uri, to) {
            return this.downloadService.download(uri_1.URI.revive(uri), uri_1.URI.revive(to));
        }
    };
    MainThreadDownloadService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadDownloadService),
        __param(1, download_1.IDownloadService)
    ], MainThreadDownloadService);
    exports.MainThreadDownloadService = MainThreadDownloadService;
});
//# __sourceMappingURL=mainThreadDownloadService.js.map