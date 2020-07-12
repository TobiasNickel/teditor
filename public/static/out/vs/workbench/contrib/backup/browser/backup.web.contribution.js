/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/backup/browser/backupTracker"], function (require, exports, platform_1, contributions_1, backupTracker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Backup Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(backupTracker_1.BrowserBackupTracker, 1 /* Starting */);
});
//# __sourceMappingURL=backup.web.contribution.js.map