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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/url/common/urlService", "vs/workbench/services/environment/common/environmentService"], function (require, exports, url_1, uri_1, extensions_1, urlService_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserURLService = void 0;
    let BrowserURLService = class BrowserURLService extends urlService_1.AbstractURLService {
        constructor(environmentService) {
            super();
            this.provider = environmentService.options.urlCallbackProvider;
            this.registerListeners();
        }
        registerListeners() {
            if (this.provider) {
                this._register(this.provider.onCallback(uri => this.open(uri, { trusted: true })));
            }
        }
        create(options) {
            if (this.provider) {
                return this.provider.create(options);
            }
            return uri_1.URI.parse('unsupported://');
        }
    };
    BrowserURLService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService)
    ], BrowserURLService);
    exports.BrowserURLService = BrowserURLService;
    extensions_1.registerSingleton(url_1.IURLService, BrowserURLService, true);
});
//# __sourceMappingURL=urlService.js.map