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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/url/common/url", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/contrib/url/browser/externalUriResolver", "vs/workbench/contrib/url/browser/trustedDomains", "vs/workbench/contrib/url/browser/trustedDomainsFileSystemProvider", "vs/workbench/contrib/url/browser/trustedDomainsValidator"], function (require, exports, actions_1, uri_1, nls_1, actions_2, commands_1, quickInput_1, platform_1, url_1, actions_3, contributions_1, externalUriResolver_1, trustedDomains_1, trustedDomainsFileSystemProvider_1, trustedDomainsValidator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenUrlAction = void 0;
    let OpenUrlAction = class OpenUrlAction extends actions_1.Action {
        constructor(id, label, urlService, quickInputService) {
            super(id, label);
            this.urlService = urlService;
            this.quickInputService = quickInputService;
        }
        run() {
            return this.quickInputService.input({ prompt: 'URL to open' }).then(input => {
                if (input) {
                    const uri = uri_1.URI.parse(input);
                    this.urlService.open(uri, { trusted: true });
                }
            });
        }
    };
    OpenUrlAction.ID = 'workbench.action.url.openUrl';
    OpenUrlAction.LABEL = nls_1.localize('openUrl', 'Open URL');
    OpenUrlAction = __decorate([
        __param(2, url_1.IURLService),
        __param(3, quickInput_1.IQuickInputService)
    ], OpenUrlAction);
    exports.OpenUrlAction = OpenUrlAction;
    platform_1.Registry.as(actions_3.Extensions.WorkbenchActions).registerWorkbenchAction(actions_2.SyncActionDescriptor.from(OpenUrlAction), 'Open URL', nls_1.localize('developer', 'Developer'));
    /**
     * Trusted Domains Contribution
     */
    commands_1.CommandsRegistry.registerCommand(trustedDomains_1.manageTrustedDomainSettingsCommand);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
        command: {
            id: trustedDomains_1.manageTrustedDomainSettingsCommand.id,
            title: {
                value: trustedDomains_1.manageTrustedDomainSettingsCommand.description.description,
                original: 'Manage Trusted Domains'
            }
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(trustedDomainsValidator_1.OpenerValidatorContributions, 3 /* Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(trustedDomainsFileSystemProvider_1.TrustedDomainsFileSystemProvider, 2 /* Ready */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(externalUriResolver_1.ExternalUriResolverContribution, 2 /* Ready */);
});
//# __sourceMappingURL=url.contribution.js.map