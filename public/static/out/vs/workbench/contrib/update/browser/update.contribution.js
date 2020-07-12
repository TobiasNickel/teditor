/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/update/browser/update", "vs/platform/product/common/product", "vs/platform/update/common/update.config.contribution"], function (require, exports, nls_1, platform_1, contributions_1, actions_1, actions_2, update_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbench = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbench.registerWorkbenchContribution(update_1.ProductContribution, 3 /* Restored */);
    workbench.registerWorkbenchContribution(update_1.UpdateContribution, 3 /* Restored */);
    const actionRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    // Editor
    actionRegistry
        .registerWorkbenchAction(actions_2.SyncActionDescriptor.from(update_1.ShowCurrentReleaseNotesAction), `${product_1.default.nameShort}: Show Release Notes`, product_1.default.nameShort);
    actionRegistry
        .registerWorkbenchAction(actions_2.SyncActionDescriptor.from(update_1.CheckForVSCodeUpdateAction), `${product_1.default.nameShort}: Check for Update`, product_1.default.nameShort, update_1.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* Idle */));
    // Menu
    if (update_1.ShowCurrentReleaseNotesAction.AVAILABE) {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarHelpMenu, {
            group: '1_welcome',
            command: {
                id: update_1.ShowCurrentReleaseNotesAction.ID,
                title: nls_1.localize({ key: 'miReleaseNotes', comment: ['&& denotes a mnemonic'] }, "&&Release Notes")
            },
            order: 4
        });
    }
});
//# __sourceMappingURL=update.contribution.js.map