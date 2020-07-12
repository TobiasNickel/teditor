/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/backup/common/backupRestorer"], function (require, exports, platform_1, contributions_1, backupRestorer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Backup Restorer
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(backupRestorer_1.BackupRestorer, 1 /* Starting */);
});
//# __sourceMappingURL=backup.contribution.js.map