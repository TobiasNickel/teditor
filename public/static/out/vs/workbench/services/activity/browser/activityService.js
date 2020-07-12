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
define(["require", "exports", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/activity/common/activity", "vs/base/common/lifecycle", "vs/workbench/services/activityBar/browser/activityBarService", "vs/platform/instantiation/common/extensions", "vs/workbench/common/views", "vs/workbench/common/activity"], function (require, exports, panelService_1, activity_1, lifecycle_1, activityBarService_1, extensions_1, views_1, activity_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityService = void 0;
    let ActivityService = class ActivityService {
        constructor(panelService, activityBarService, viewDescriptorService) {
            this.panelService = panelService;
            this.activityBarService = activityBarService;
            this.viewDescriptorService = viewDescriptorService;
        }
        showViewContainerActivity(viewContainerId, { badge, clazz, priority }) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(viewContainerId);
            if (viewContainer) {
                const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                switch (location) {
                    case views_1.ViewContainerLocation.Panel:
                        return this.panelService.showActivity(viewContainer.id, badge, clazz);
                    case views_1.ViewContainerLocation.Sidebar:
                        return this.activityBarService.showActivity(viewContainer.id, badge, clazz, priority);
                }
            }
            return lifecycle_1.Disposable.None;
        }
        showAccountsActivity({ badge, clazz, priority }) {
            return this.activityBarService.showActivity(activity_2.ACCOUNTS_ACTIIVTY_ID, badge, clazz, priority);
        }
        showGlobalActivity({ badge, clazz, priority }) {
            return this.activityBarService.showActivity(activity_2.GLOBAL_ACTIVITY_ID, badge, clazz, priority);
        }
    };
    ActivityService = __decorate([
        __param(0, panelService_1.IPanelService),
        __param(1, activityBarService_1.IActivityBarService),
        __param(2, views_1.IViewDescriptorService)
    ], ActivityService);
    exports.ActivityService = ActivityService;
    extensions_1.registerSingleton(activity_1.IActivityService, ActivityService, true);
});
//# __sourceMappingURL=activityService.js.map