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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/base/common/process"], function (require, exports, nls, platform_1, contributions_1, platform_2, telemetry_1, storage_1, storageKeys_1, productService_1, notification_1, opener_1, uri_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PROBABILITY = 0.15;
    const SESSION_COUNT_KEY = 'nps/sessionCount';
    const LAST_SESSION_DATE_KEY = 'nps/lastSessionDate';
    const SKIP_VERSION_KEY = 'nps/skipVersion';
    const IS_CANDIDATE_KEY = 'nps/isCandidate';
    let NPSContribution = class NPSContribution {
        constructor(storageService, storageKeysSyncRegistryService, notificationService, telemetryService, openerService, productService) {
            if (!productService.npsSurveyUrl) {
                return;
            }
            // opt-in to syncing
            storageKeysSyncRegistryService.registerStorageKey({ key: SESSION_COUNT_KEY, version: 1 });
            storageKeysSyncRegistryService.registerStorageKey({ key: LAST_SESSION_DATE_KEY, version: 1 });
            storageKeysSyncRegistryService.registerStorageKey({ key: SKIP_VERSION_KEY, version: 1 });
            storageKeysSyncRegistryService.registerStorageKey({ key: IS_CANDIDATE_KEY, version: 1 });
            const skipVersion = storageService.get(SKIP_VERSION_KEY, 0 /* GLOBAL */, '');
            if (skipVersion) {
                return;
            }
            const date = new Date().toDateString();
            const lastSessionDate = storageService.get(LAST_SESSION_DATE_KEY, 0 /* GLOBAL */, new Date(0).toDateString());
            if (date === lastSessionDate) {
                return;
            }
            const sessionCount = (storageService.getNumber(SESSION_COUNT_KEY, 0 /* GLOBAL */, 0) || 0) + 1;
            storageService.store(LAST_SESSION_DATE_KEY, date, 0 /* GLOBAL */);
            storageService.store(SESSION_COUNT_KEY, sessionCount, 0 /* GLOBAL */);
            if (sessionCount < 9) {
                return;
            }
            const isCandidate = storageService.getBoolean(IS_CANDIDATE_KEY, 0 /* GLOBAL */, false)
                || Math.random() < PROBABILITY;
            storageService.store(IS_CANDIDATE_KEY, isCandidate, 0 /* GLOBAL */);
            if (!isCandidate) {
                storageService.store(SKIP_VERSION_KEY, productService.version, 0 /* GLOBAL */);
                return;
            }
            notificationService.prompt(notification_1.Severity.Info, nls.localize('surveyQuestion', "Do you mind taking a quick feedback survey?"), [{
                    label: nls.localize('takeSurvey', "Take Survey"),
                    run: () => {
                        telemetryService.getTelemetryInfo().then(info => {
                            openerService.open(uri_1.URI.parse(`${productService.npsSurveyUrl}?o=${encodeURIComponent(process_1.platform)}&v=${encodeURIComponent(productService.version)}&m=${encodeURIComponent(info.machineId)}`));
                            storageService.store(IS_CANDIDATE_KEY, false, 0 /* GLOBAL */);
                            storageService.store(SKIP_VERSION_KEY, productService.version, 0 /* GLOBAL */);
                        });
                    }
                }, {
                    label: nls.localize('remindLater', "Remind Me later"),
                    run: () => storageService.store(SESSION_COUNT_KEY, sessionCount - 3, 0 /* GLOBAL */)
                }, {
                    label: nls.localize('neverAgain', "Don't Show Again"),
                    run: () => {
                        storageService.store(IS_CANDIDATE_KEY, false, 0 /* GLOBAL */);
                        storageService.store(SKIP_VERSION_KEY, productService.version, 0 /* GLOBAL */);
                    }
                }], { sticky: true });
        }
    };
    NPSContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, storageKeys_1.IStorageKeysSyncRegistryService),
        __param(2, notification_1.INotificationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, opener_1.IOpenerService),
        __param(5, productService_1.IProductService)
    ], NPSContribution);
    if (platform_1.language === 'en') {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(NPSContribution, 3 /* Restored */);
    }
});
//# __sourceMappingURL=nps.contribution.js.map