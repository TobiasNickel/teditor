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
define(["require", "exports", "vs/base/common/network", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/workbench/contrib/url/browser/trustedDomains", "vs/workbench/services/editor/common/editorService", "vs/platform/clipboard/common/clipboardService", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification"], function (require, exports, network_1, severity_1, uri_1, nls_1, dialogs_1, opener_1, productService_1, quickInput_1, storage_1, trustedDomains_1, editorService_1, clipboardService_1, telemetry_1, instantiation_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isURLDomainTrusted = exports.OpenerValidatorContributions = void 0;
    let OpenerValidatorContributions = class OpenerValidatorContributions {
        constructor(_openerService, _storageService, _dialogService, _productService, _quickInputService, _editorService, _clipboardService, _telemetryService, _instantiationService, _notificationService) {
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._dialogService = _dialogService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._editorService = _editorService;
            this._clipboardService = _clipboardService;
            this._telemetryService = _telemetryService;
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._openerService.registerValidator({ shouldOpen: r => this.validateLink(r) });
        }
        async validateLink(resource) {
            if (!opener_1.matchesScheme(resource, network_1.Schemas.http) && !opener_1.matchesScheme(resource, network_1.Schemas.https)) {
                return true;
            }
            if (typeof resource === 'string') {
                resource = uri_1.URI.parse(resource);
            }
            const { scheme, authority, path, query, fragment } = resource;
            const domainToOpen = `${scheme}://${authority}`;
            const { defaultTrustedDomains, trustedDomains, userDomains, workspaceDomains } = await this._instantiationService.invokeFunction(trustedDomains_1.readTrustedDomains);
            const allTrustedDomains = [...defaultTrustedDomains, ...trustedDomains, ...userDomains, ...workspaceDomains];
            if (isURLDomainTrusted(resource, allTrustedDomains)) {
                return true;
            }
            else {
                let formattedLink = `${scheme}://${authority}${path}`;
                const linkTail = `${query ? '?' + query : ''}${fragment ? '#' + fragment : ''}`;
                const remainingLength = Math.max(0, 60 - formattedLink.length);
                const linkTailLengthToKeep = Math.min(Math.max(5, remainingLength), linkTail.length);
                if (linkTailLengthToKeep === linkTail.length) {
                    formattedLink += linkTail;
                }
                else {
                    // keep the first char ? or #
                    // add ... and keep the tail end as much as possible
                    formattedLink += linkTail.charAt(0) + '...' + linkTail.substring(linkTail.length - linkTailLengthToKeep + 1);
                }
                const { choice } = await this._dialogService.show(severity_1.default.Info, nls_1.localize('openExternalLinkAt', 'Do you want {0} to open the external website?', this._productService.nameShort), [
                    nls_1.localize('open', 'Open'),
                    nls_1.localize('copy', 'Copy'),
                    nls_1.localize('cancel', 'Cancel'),
                    nls_1.localize('configureTrustedDomains', 'Configure Trusted Domains')
                ], {
                    detail: formattedLink,
                    cancelId: 2
                });
                // Open Link
                if (choice === 0) {
                    this._telemetryService.publicLog2('trustedDomains.dialogAction', { action: 'open' });
                    return true;
                }
                // Copy Link
                else if (choice === 1) {
                    this._telemetryService.publicLog2('trustedDomains.dialogAction', { action: 'copy' });
                    this._clipboardService.writeText(resource.toString(true));
                }
                // Configure Trusted Domains
                else if (choice === 3) {
                    this._telemetryService.publicLog2('trustedDomains.dialogAction', { action: 'configure' });
                    const pickedDomains = await trustedDomains_1.configureOpenerTrustedDomainsHandler(trustedDomains, domainToOpen, resource, this._quickInputService, this._storageService, this._editorService, this._telemetryService, this._notificationService, this._clipboardService);
                    // Trust all domains
                    if (pickedDomains.indexOf('*') !== -1) {
                        return true;
                    }
                    // Trust current domain
                    if (isURLDomainTrusted(resource, pickedDomains)) {
                        return true;
                    }
                    return false;
                }
                this._telemetryService.publicLog2('trustedDomains.dialogAction', { action: 'cancel' });
                return false;
            }
        }
    };
    OpenerValidatorContributions = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, storage_1.IStorageService),
        __param(2, dialogs_1.IDialogService),
        __param(3, productService_1.IProductService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, editorService_1.IEditorService),
        __param(6, clipboardService_1.IClipboardService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, notification_1.INotificationService)
    ], OpenerValidatorContributions);
    exports.OpenerValidatorContributions = OpenerValidatorContributions;
    const rLocalhost = /^localhost(:\d+)?$/i;
    const r127 = /^127.0.0.1(:\d+)?$/;
    function isLocalhostAuthority(authority) {
        return rLocalhost.test(authority) || r127.test(authority);
    }
    /**
     * Case-normalize some case-insinsitive URLs, such as github.
     */
    function normalizeURL(url) {
        const caseInsensitiveAuthorities = ['github.com'];
        try {
            const parsed = typeof url === 'string' ? uri_1.URI.parse(url, true) : url;
            if (caseInsensitiveAuthorities.includes(parsed.authority)) {
                return parsed.with({ path: parsed.path.toLowerCase() }).toString(true);
            }
            else {
                return parsed.toString(true);
            }
        }
        catch (_a) {
            return url.toString();
        }
    }
    /**
     * Check whether a domain like https://www.microsoft.com matches
     * the list of trusted domains.
     *
     * - Schemes must match
     * - There's no subdomsain matching. For example https://microsoft.com doesn't match https://www.microsoft.com
     * - Star matches all subdomains. For example https://*.microsoft.com matches https://www.microsoft.com and https://foo.bar.microsoft.com
     */
    function isURLDomainTrusted(url, trustedDomains) {
        url = uri_1.URI.parse(normalizeURL(url));
        trustedDomains = trustedDomains.map(normalizeURL);
        if (isLocalhostAuthority(url.authority)) {
            return true;
        }
        const domain = `${url.scheme}://${url.authority}`;
        for (let i = 0; i < trustedDomains.length; i++) {
            if (trustedDomains[i] === '*') {
                return true;
            }
            if (trustedDomains[i] === domain) {
                return true;
            }
            let parsedTrustedDomain;
            if (/^https?:\/\//.test(trustedDomains[i])) {
                parsedTrustedDomain = uri_1.URI.parse(trustedDomains[i]);
                if (url.scheme !== parsedTrustedDomain.scheme) {
                    continue;
                }
            }
            else {
                parsedTrustedDomain = uri_1.URI.parse('https://' + trustedDomains[i]);
            }
            if (url.authority === parsedTrustedDomain.authority) {
                if (pathMatches(url.path, parsedTrustedDomain.path)) {
                    return true;
                }
                else {
                    continue;
                }
            }
            if (trustedDomains[i].indexOf('*') !== -1) {
                let reversedAuthoritySegments = url.authority.split('.').reverse();
                const reversedTrustedDomainAuthoritySegments = parsedTrustedDomain.authority.split('.').reverse();
                if (reversedTrustedDomainAuthoritySegments.length < reversedAuthoritySegments.length &&
                    reversedTrustedDomainAuthoritySegments[reversedTrustedDomainAuthoritySegments.length - 1] === '*') {
                    reversedAuthoritySegments = reversedAuthoritySegments.slice(0, reversedTrustedDomainAuthoritySegments.length);
                }
                const authorityMatches = reversedAuthoritySegments.every((val, i) => {
                    return reversedTrustedDomainAuthoritySegments[i] === '*' || val === reversedTrustedDomainAuthoritySegments[i];
                });
                if (authorityMatches && pathMatches(url.path, parsedTrustedDomain.path)) {
                    return true;
                }
            }
        }
        return false;
    }
    exports.isURLDomainTrusted = isURLDomainTrusted;
    function pathMatches(open, rule) {
        if (rule === '/') {
            return true;
        }
        if (rule[rule.length - 1] === '/') {
            rule = rule.slice(0, -1);
        }
        const openSegments = open.split('/');
        const ruleSegments = rule.split('/');
        for (let i = 0; i < ruleSegments.length; i++) {
            if (ruleSegments[i] !== openSegments[i]) {
                return false;
            }
        }
        return true;
    }
});
//# __sourceMappingURL=trustedDomainsValidator.js.map