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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/base/parts/request/browser/request"], function (require, exports, configuration_1, log_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestService = void 0;
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService {
        constructor(configurationService, logService) {
            this.configurationService = configurationService;
            this.logService = logService;
        }
        request(options, token) {
            this.logService.trace('RequestService#request', options.url);
            if (!options.proxyAuthorization) {
                options.proxyAuthorization = this.configurationService.getValue('http.proxyAuthorization');
            }
            return request_1.request(options, token);
        }
        async resolveProxy(url) {
            return undefined; // not implemented in the web
        }
    };
    RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService)
    ], RequestService);
    exports.RequestService = RequestService;
});
//# __sourceMappingURL=requestService.js.map