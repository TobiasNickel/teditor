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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, telemetry_1, extensionRecommendations_1, instantiation_1, notification_1, configuration_1, productService_1, storage_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeymapRecommendations = void 0;
    let KeymapRecommendations = class KeymapRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(isExtensionAllowedToBeRecommended, productService, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService);
            this.productService = productService;
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        async doActivate() {
            if (this.productService.keymapExtensionTips) {
                this._recommendations = this.productService.keymapExtensionTips.map(extensionId => ({
                    extensionId: extensionId.toLowerCase(),
                    source: 'application',
                    reason: {
                        reasonId: 6 /* Application */,
                        reasonText: ''
                    }
                }));
            }
        }
    };
    KeymapRecommendations = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, storageKeys_1.IStorageKeysSyncRegistryService)
    ], KeymapRecommendations);
    exports.KeymapRecommendations = KeymapRecommendations;
});
//# __sourceMappingURL=keymapRecommendations.js.map