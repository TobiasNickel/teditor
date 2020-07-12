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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/files/common/files", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/workbench/services/activity/common/activity", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, nls, files_1, lifecycle_1, lifecycle_2, activity_1, workingCopyService_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DirtyFilesIndicator = void 0;
    let DirtyFilesIndicator = class DirtyFilesIndicator extends lifecycle_2.Disposable {
        constructor(lifecycleService, activityService, workingCopyService, filesConfigurationService) {
            super();
            this.lifecycleService = lifecycleService;
            this.activityService = activityService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.badgeHandle = this._register(new lifecycle_2.MutableDisposable());
            this.lastKnownDirtyCount = 0;
            this.updateActivityBadge();
            this.registerListeners();
        }
        registerListeners() {
            // Working copy dirty indicator
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.onWorkingCopyDidChangeDirty(workingCopy)));
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
        }
        onWorkingCopyDidChangeDirty(workingCopy) {
            const gotDirty = workingCopy.isDirty();
            if (gotDirty && !(workingCopy.capabilities & 2 /* Untitled */) && this.filesConfigurationService.getAutoSaveMode() === 1 /* AFTER_SHORT_DELAY */) {
                return; // do not indicate dirty of working copies that are auto saved after short delay
            }
            if (gotDirty || this.lastKnownDirtyCount > 0) {
                this.updateActivityBadge();
            }
        }
        updateActivityBadge() {
            const dirtyCount = this.lastKnownDirtyCount = this.workingCopyService.dirtyCount;
            // Indicate dirty count in badge if any
            if (dirtyCount > 0) {
                this.badgeHandle.value = this.activityService.showViewContainerActivity(files_1.VIEWLET_ID, {
                    badge: new activity_1.NumberBadge(dirtyCount, num => num === 1 ? nls.localize('dirtyFile', "1 unsaved file") : nls.localize('dirtyFiles', "{0} unsaved files", dirtyCount)),
                    clazz: 'explorer-viewlet-label'
                });
            }
            else {
                this.badgeHandle.clear();
            }
        }
    };
    DirtyFilesIndicator = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, activity_1.IActivityService),
        __param(2, workingCopyService_1.IWorkingCopyService),
        __param(3, filesConfigurationService_1.IFilesConfigurationService)
    ], DirtyFilesIndicator);
    exports.DirtyFilesIndicator = DirtyFilesIndicator;
});
//# __sourceMappingURL=dirtyFilesIndicator.js.map