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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, telemetry_1, arrays_1, extensionRecommendations_1, instantiation_1, notification_1, experimentService_1, configuration_1, storage_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExperimentalRecommendations = void 0;
    let ExperimentalRecommendations = class ExperimentalRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(isExtensionAllowedToBeRecommended, experimentService, configurationService, instantiationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService) {
            super(isExtensionAllowedToBeRecommended, instantiationService, configurationService, notificationService, telemetryService, storageService, storageKeysSyncRegistryService);
            this.experimentService = experimentService;
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        /**
         * Fetch extensions used by others on the same workspace as recommendations
         */
        async doActivate() {
            var _a, _b;
            const experiments = await this.experimentService.getExperimentsByType(experimentService_1.ExperimentActionType.AddToRecommendations);
            for (const { action, state } of experiments) {
                if (state === 2 /* Run */ && arrays_1.isNonEmptyArray((_a = action === null || action === void 0 ? void 0 : action.properties) === null || _a === void 0 ? void 0 : _a.recommendations) && ((_b = action === null || action === void 0 ? void 0 : action.properties) === null || _b === void 0 ? void 0 : _b.recommendationReason)) {
                    action.properties.recommendations.forEach((extensionId) => this._recommendations.push({
                        extensionId: extensionId.toLowerCase(),
                        source: 'experimental',
                        reason: {
                            reasonId: 5 /* Experimental */,
                            reasonText: action.properties.recommendationReason
                        }
                    }));
                }
            }
        }
    };
    ExperimentalRecommendations = __decorate([
        __param(1, experimentService_1.IExperimentService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, storageKeys_1.IStorageKeysSyncRegistryService)
    ], ExperimentalRecommendations);
    exports.ExperimentalRecommendations = ExperimentalRecommendations;
});
//# __sourceMappingURL=experimentalRecommendations.js.map