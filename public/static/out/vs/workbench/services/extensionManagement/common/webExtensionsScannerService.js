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
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/platform", "vs/platform/instantiation/common/extensions"], function (require, exports, extensions_1, environmentService_1, extensionManagement_1, platform_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionsScannerService = void 0;
    let WebExtensionsScannerService = class WebExtensionsScannerService {
        constructor(builtinExtensionsScannerService, environmentService) {
            this.builtinExtensionsScannerService = builtinExtensionsScannerService;
            this.systemExtensionsPromise = platform_1.isWeb ? this.builtinExtensionsScannerService.scanBuiltinExtensions() : Promise.resolve([]);
            const staticExtensions = environmentService.options && Array.isArray(environmentService.options.staticExtensions) ? environmentService.options.staticExtensions : [];
            this.userExtensions = staticExtensions.map(data => ({
                location: data.extensionLocation,
                type: 1 /* User */,
                packageJSON: data.packageJSON,
            }));
        }
        async scanExtensions(type) {
            const extensions = [];
            if (type === undefined || type === 0 /* System */) {
                const systemExtensions = await this.systemExtensionsPromise;
                extensions.push(...systemExtensions);
            }
            if (type === undefined || type === 1 /* User */) {
                extensions.push(...this.userExtensions);
            }
            return extensions;
        }
    };
    WebExtensionsScannerService = __decorate([
        __param(0, extensions_1.IBuiltinExtensionsScannerService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], WebExtensionsScannerService);
    exports.WebExtensionsScannerService = WebExtensionsScannerService;
    extensions_2.registerSingleton(extensionManagement_1.IWebExtensionsScannerService, WebExtensionsScannerService);
});
//# __sourceMappingURL=webExtensionsScannerService.js.map