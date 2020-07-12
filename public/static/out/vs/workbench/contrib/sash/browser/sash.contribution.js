/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/common/configuration", "vs/workbench/common/contributions", "vs/workbench/contrib/sash/browser/sash", "vs/base/browser/browser"], function (require, exports, nls_1, configurationRegistry_1, platform_1, configuration_1, contributions_1, sash_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Sash size contribution
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(sash_1.SashSizeController, 3 /* Restored */);
    // Sash size configuration contribution
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration(Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { 'properties': {
            'workbench.sash.size': {
                'type': 'number',
                'default': browser_1.isIPad ? sash_1.maxSize : sash_1.minSize,
                'minimum': sash_1.minSize,
                'maximum': sash_1.maxSize,
                'description': nls_1.localize('sashSize', "Controls the feedback area size in pixels of the dragging area in between views/editors. Set it to a larger value if you feel it's hard to resize views using the mouse.")
            },
        } }));
});
//# __sourceMappingURL=sash.contribution.js.map