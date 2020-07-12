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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/extensions", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/issue/browser/issueService", "vs/workbench/contrib/issue/common/commands"], function (require, exports, nls, actions_1, commands_1, extensions_1, productService_1, platform_1, contributions_1, issueService_1, commands_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RegisterIssueContribution = class RegisterIssueContribution {
        constructor(productService) {
            this.productService = productService;
            if (productService.reportIssueUrl) {
                const helpCategory = { value: nls.localize('help', "Help"), original: 'Help' };
                const OpenIssueReporterActionLabel = nls.localize({ key: 'reportIssueInEnglish', comment: ['Translate this to "Report Issue in English" in all languages please!'] }, "Report Issue");
                commands_1.CommandsRegistry.registerCommand(commands_2.OpenIssueReporterActionId, function (accessor, args) {
                    let extensionId;
                    if (args) {
                        if (Array.isArray(args)) {
                            [extensionId] = args;
                        }
                        else {
                            extensionId = args.extensionId;
                        }
                    }
                    return accessor.get(issueService_1.IWebIssueService).openReporter({ extensionId });
                });
                const command = {
                    id: commands_2.OpenIssueReporterActionId,
                    title: { value: OpenIssueReporterActionLabel, original: 'Report Issue' },
                    category: helpCategory
                };
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command });
            }
        }
    };
    RegisterIssueContribution = __decorate([
        __param(0, productService_1.IProductService)
    ], RegisterIssueContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(RegisterIssueContribution, 1 /* Starting */);
    commands_1.CommandsRegistry.registerCommand('_issues.getSystemStatus', (accessor) => {
        return nls.localize('statusUnsupported', "The --status argument is not yet supported in browsers.");
    });
    extensions_1.registerSingleton(issueService_1.IWebIssueService, issueService_1.WebIssueService, true);
});
//# __sourceMappingURL=issue.web.contribution.js.map