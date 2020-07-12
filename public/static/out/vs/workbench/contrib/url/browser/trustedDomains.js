/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/authentication/browser/authenticationService", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/workspace/common/workspace", "vs/platform/notification/common/notification"], function (require, exports, uri_1, nls_1, productService_1, storage_1, editorService_1, authenticationService_1, files_1, textfiles_1, workspace_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTrustedDomains = exports.extractGitHubRemotesFromGitConfig = exports.configureOpenerTrustedDomainsHandler = exports.manageTrustedDomainSettingsCommand = exports.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY = exports.TRUSTED_DOMAINS_STORAGE_KEY = void 0;
    const TRUSTED_DOMAINS_URI = uri_1.URI.parse('trustedDomains:/Trusted Domains');
    exports.TRUSTED_DOMAINS_STORAGE_KEY = 'http.linkProtectionTrustedDomains';
    exports.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY = 'http.linkProtectionTrustedDomainsContent';
    exports.manageTrustedDomainSettingsCommand = {
        id: 'workbench.action.manageTrustedDomain',
        description: {
            description: nls_1.localize('trustedDomain.manageTrustedDomain', 'Manage Trusted Domains'),
            args: []
        },
        handler: async (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ resource: TRUSTED_DOMAINS_URI, mode: 'jsonc' });
            return;
        }
    };
    async function configureOpenerTrustedDomainsHandler(trustedDomains, domainToConfigure, resource, quickInputService, storageService, editorService, telemetryService, notificationService, clipboardService) {
        const parsedDomainToConfigure = uri_1.URI.parse(domainToConfigure);
        const toplevelDomainSegements = parsedDomainToConfigure.authority.split('.');
        const domainEnd = toplevelDomainSegements.slice(toplevelDomainSegements.length - 2).join('.');
        const topLevelDomain = '*.' + domainEnd;
        const trustDomainAndOpenLinkItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.trustDomain', 'Trust {0}', domainToConfigure),
            id: 'trustDomain',
            picked: true
        };
        const trustSubDomainAndOpenLinkItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.trustSubDomain', 'Trust {0} and all its subdomains', domainEnd),
            id: 'trustSubdomain'
        };
        const openAllLinksItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.trustAllDomains', 'Trust all domains (disables link protection)'),
            id: 'trustAll'
        };
        const manageTrustedDomainItem = {
            type: 'item',
            label: nls_1.localize('trustedDomain.manageTrustedDomains', 'Manage Trusted Domains'),
            id: 'manage'
        };
        const pickedResult = await quickInputService.pick([trustDomainAndOpenLinkItem, trustSubDomainAndOpenLinkItem, openAllLinksItem, manageTrustedDomainItem], {
            activeItem: trustDomainAndOpenLinkItem
        });
        if (pickedResult && pickedResult.id) {
            telemetryService.publicLog2('trustedDomains.configureTrustedDomainsQuickPickChoice', { choice: pickedResult.id });
            switch (pickedResult.id) {
                case 'manage':
                    await editorService.openEditor({
                        resource: TRUSTED_DOMAINS_URI,
                        mode: 'jsonc'
                    });
                    notificationService.prompt(notification_1.Severity.Info, nls_1.localize('configuringURL', "Configuring trust for: {0}", resource.toString()), [{ label: 'Copy', run: () => clipboardService.writeText(resource.toString()) }]);
                    return trustedDomains;
                case 'trustDomain':
                case 'trustSubdomain':
                case 'trustAll':
                    const itemToTrust = pickedResult.id === 'trustDomain'
                        ? domainToConfigure
                        : pickedResult.id === 'trustSubdomain' ? topLevelDomain : '*';
                    if (trustedDomains.indexOf(itemToTrust) === -1) {
                        storageService.remove(exports.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY, 0 /* GLOBAL */);
                        storageService.store(exports.TRUSTED_DOMAINS_STORAGE_KEY, JSON.stringify([...trustedDomains, itemToTrust]), 0 /* GLOBAL */);
                        return [...trustedDomains, itemToTrust];
                    }
            }
        }
        return [];
    }
    exports.configureOpenerTrustedDomainsHandler = configureOpenerTrustedDomainsHandler;
    // Exported for testing.
    function extractGitHubRemotesFromGitConfig(gitConfig) {
        const domains = new Set();
        let match;
        const RemoteMatcher = /^\s*url\s*=\s*(?:git@|https:\/\/)github\.com(?::|\/)(\S*)\s*$/mg;
        while (match = RemoteMatcher.exec(gitConfig)) {
            const repo = match[1].replace(/\.git$/, '');
            if (repo) {
                domains.add(`https://github.com/${repo}/`);
            }
        }
        return [...domains];
    }
    exports.extractGitHubRemotesFromGitConfig = extractGitHubRemotesFromGitConfig;
    async function getRemotes(fileService, textFileService, contextService) {
        const workspaceUris = contextService.getWorkspace().folders.map(folder => folder.uri);
        const domains = await Promise.race([
            new Promise(resolve => setTimeout(() => resolve([]), 2000)),
            Promise.all(workspaceUris.map(async (workspaceUri) => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
                const exists = await fileService.exists(uri);
                if (!exists) {
                    return [];
                }
                const gitConfig = (await (textFileService.read(uri, { acceptTextOnly: true }).catch(() => ({ value: '' })))).value;
                return extractGitHubRemotesFromGitConfig(gitConfig);
            }))
        ]);
        const set = domains.reduce((set, list) => list.reduce((set, item) => set.add(item), set), new Set());
        return [...set];
    }
    async function readTrustedDomains(accessor) {
        var _a;
        const storageService = accessor.get(storage_1.IStorageService);
        const productService = accessor.get(productService_1.IProductService);
        const authenticationService = accessor.get(authenticationService_1.IAuthenticationService);
        const fileService = accessor.get(files_1.IFileService);
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
        const defaultTrustedDomains = productService.linkProtectionTrustedDomains
            ? [...productService.linkProtectionTrustedDomains]
            : [];
        let trustedDomains = [];
        try {
            const trustedDomainsSrc = storageService.get(exports.TRUSTED_DOMAINS_STORAGE_KEY, 0 /* GLOBAL */);
            if (trustedDomainsSrc) {
                trustedDomains = JSON.parse(trustedDomainsSrc);
            }
        }
        catch (err) { }
        const userDomains = authenticationService.isAuthenticationProviderRegistered('github')
            ? ((_a = (await authenticationService.getSessions('github'))) !== null && _a !== void 0 ? _a : [])
                .map(session => session.account.displayName)
                .filter((v, i, a) => a.indexOf(v) === i)
                .map(username => `https://github.com/${username}/`)
            : [];
        const workspaceDomains = await getRemotes(fileService, textFileService, workspaceContextService);
        return {
            defaultTrustedDomains,
            trustedDomains,
            userDomains,
            workspaceDomains
        };
    }
    exports.readTrustedDomains = readTrustedDomains;
});
//# __sourceMappingURL=trustedDomains.js.map