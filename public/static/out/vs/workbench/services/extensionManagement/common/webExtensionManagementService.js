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
define(["require", "exports", "vs/base/common/event", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionNls", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, event_1, request_1, cancellation_1, extensionNls_1, extensionManagementUtil_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebExtensionManagementService = void 0;
    let WebExtensionManagementService = class WebExtensionManagementService {
        constructor(webExtensionsScannerService, requestService) {
            this.webExtensionsScannerService = webExtensionsScannerService;
            this.requestService = requestService;
            this.onInstallExtension = event_1.Event.None;
            this.onDidInstallExtension = event_1.Event.None;
            this.onUninstallExtension = event_1.Event.None;
            this.onDidUninstallExtension = event_1.Event.None;
        }
        async getInstalled(type) {
            const extensions = await this.webExtensionsScannerService.scanExtensions(type);
            return Promise.all(extensions.map(e => this.toLocalExtension(e)));
        }
        async toLocalExtension(scannedExtension) {
            let manifest = scannedExtension.packageJSON;
            if (scannedExtension.packageNLSUrl) {
                try {
                    const context = await this.requestService.request({ type: 'GET', url: scannedExtension.packageNLSUrl.toString() }, cancellation_1.CancellationToken.None);
                    if (request_1.isSuccess(context)) {
                        const content = await request_1.asText(context);
                        if (content) {
                            manifest = extensionNls_1.localizeManifest(manifest, JSON.parse(content));
                        }
                    }
                }
                catch (error) { /* ignore */ }
            }
            return {
                type: 0 /* System */,
                identifier: { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name) },
                manifest,
                location: scannedExtension.location,
                isMachineScoped: false,
                publisherId: null,
                publisherDisplayName: null
            };
        }
        zip(extension) { throw new Error('unsupported'); }
        unzip(zipLocation) { throw new Error('unsupported'); }
        getManifest(vsix) { throw new Error('unsupported'); }
        install(vsix, isMachineScoped) { throw new Error('unsupported'); }
        installFromGallery(extension, isMachineScoped) { throw new Error('unsupported'); }
        uninstall(extension, force) { throw new Error('unsupported'); }
        reinstallFromGallery(extension) { throw new Error('unsupported'); }
        getExtensionsReport() { throw new Error('unsupported'); }
        updateMetadata(local, metadata) { throw new Error('unsupported'); }
    };
    WebExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IWebExtensionsScannerService),
        __param(1, request_1.IRequestService)
    ], WebExtensionManagementService);
    exports.WebExtensionManagementService = WebExtensionManagementService;
});
//# __sourceMappingURL=webExtensionManagementService.js.map