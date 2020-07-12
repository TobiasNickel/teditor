/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/experiments/browser/experimentalPrompt", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration"], function (require, exports, nls_1, extensions_1, experimentService_1, platform_1, contributions_1, experimentalPrompt_1, configurationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(experimentService_1.IExperimentService, experimentService_1.ExperimentService, true);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(experimentalPrompt_1.ExperimentalPrompts, 4 /* Eventually */);
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    // Configuration
    registry.registerConfiguration(Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { 'properties': {
            'workbench.enableExperiments': {
                'type': 'boolean',
                'description': nls_1.localize('workbench.enableExperiments', "Fetches experiments to run from a Microsoft online service."),
                'default': true,
                'tags': ['usesOnlineServices']
            }
        } }));
});
//# __sourceMappingURL=experiments.contribution.js.map