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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/services/output/common/output", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/contrib/extensions/browser/extensionEditor", "vs/workbench/contrib/extensions/browser/extensionsViewlet", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/commands/common/commands", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/browser/editor", "vs/base/common/uri", "vs/workbench/contrib/extensions/browser/extensionsActivationProgress", "vs/base/common/errors", "vs/workbench/contrib/extensions/browser/extensionsDependencyChecker", "vs/base/common/cancellation", "vs/workbench/contrib/extensions/browser/remoteExtensionsInstaller", "vs/workbench/common/views", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/preferences/common/preferences", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/extensions/browser/extensionsQuickAccess", "vs/workbench/contrib/extensions/browser/extensionRecommendationsService", "vs/workbench/services/userDataSync/common/userDataSync"], function (require, exports, nls_1, keyCodes_1, platform_1, actions_1, extensions_1, extensionManagement_1, extensionManagement_2, actions_2, contributions_1, output_1, descriptors_1, extensions_2, extensionsWorkbenchService_1, extensionsActions_1, extensionsInput_1, extensionEditor_1, extensionsViewlet_1, configurationRegistry_1, jsonContributionRegistry, extensionsFileTemplate_1, commands_1, extensionsUtils_1, extensionManagementUtil_1, editor_1, uri_1, extensionsActivationProgress_1, errors_1, extensionsDependencyChecker_1, cancellation_1, remoteExtensionsInstaller_1, views_1, clipboardService_1, preferences_1, contextkey_1, viewlet_1, quickAccess_1, extensionsQuickAccess_1, extensionRecommendationsService_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Singletons
    extensions_1.registerSingleton(extensions_2.IExtensionsWorkbenchService, extensionsWorkbenchService_1.ExtensionsWorkbenchService);
    extensions_1.registerSingleton(extensionManagement_2.IExtensionRecommendationsService, extensionRecommendationsService_1.ExtensionRecommendationsService);
    platform_1.Registry.as(output_1.Extensions.OutputChannels)
        .registerChannel({ id: extensionManagement_1.ExtensionsChannelId, label: extensionManagement_1.ExtensionsLabel, log: false });
    // Quick Access
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: extensionsQuickAccess_1.ManageExtensionsQuickAccessProvider,
        prefix: extensionsQuickAccess_1.ManageExtensionsQuickAccessProvider.PREFIX,
        placeholder: nls_1.localize('manageExtensionsQuickAccessPlaceholder', "Press Enter to manage extensions."),
        helpEntries: [{ description: nls_1.localize('manageExtensionsHelp', "Manage Extensions"), needsEditor: false }]
    });
    // Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(extensionEditor_1.ExtensionEditor, extensionEditor_1.ExtensionEditor.ID, nls_1.localize('extension', "Extension")), [
        new descriptors_1.SyncDescriptor(extensionsInput_1.ExtensionsInput)
    ]);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: extensions_2.VIEWLET_ID,
        name: nls_1.localize('extensions', "Extensions"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViewlet_1.ExtensionsViewPaneContainer),
        icon: 'codicon-extensions',
        order: 4,
        rejectAddedViews: true,
        alwaysUseContainerInfo: true
    }, views_1.ViewContainerLocation.Sidebar);
    // Global actions
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    const openViewletActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.OpenExtensionsViewletAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 54 /* KEY_X */ });
    actionRegistry.registerWorkbenchAction(openViewletActionDescriptor, 'View: Show Extensions', nls_1.localize('view', "View"));
    const installActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.InstallExtensionsAction);
    actionRegistry.registerWorkbenchAction(installActionDescriptor, 'Extensions: Install Extensions', extensionManagement_1.ExtensionsLabel);
    const listOutdatedActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowOutdatedExtensionsAction);
    actionRegistry.registerWorkbenchAction(listOutdatedActionDescriptor, 'Extensions: Show Outdated Extensions', extensionManagement_1.ExtensionsLabel);
    const recommendationsActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowRecommendedExtensionsAction);
    actionRegistry.registerWorkbenchAction(recommendationsActionDescriptor, 'Extensions: Show Recommended Extensions', extensionManagement_1.ExtensionsLabel);
    const keymapRecommendationsActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowRecommendedKeymapExtensionsAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 43 /* KEY_M */) });
    actionRegistry.registerWorkbenchAction(keymapRecommendationsActionDescriptor, 'Preferences: Keymaps', extensionManagement_1.PreferencesLabel);
    const languageExtensionsActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowLanguageExtensionsAction);
    actionRegistry.registerWorkbenchAction(languageExtensionsActionDescriptor, 'Preferences: Language Extensions', extensionManagement_1.PreferencesLabel);
    const azureExtensionsActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowAzureExtensionsAction);
    actionRegistry.registerWorkbenchAction(azureExtensionsActionDescriptor, 'Preferences: Azure Extensions', extensionManagement_1.PreferencesLabel);
    const popularActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowPopularExtensionsAction);
    actionRegistry.registerWorkbenchAction(popularActionDescriptor, 'Extensions: Show Popular Extensions', extensionManagement_1.ExtensionsLabel);
    const enabledActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowEnabledExtensionsAction);
    actionRegistry.registerWorkbenchAction(enabledActionDescriptor, 'Extensions: Show Enabled Extensions', extensionManagement_1.ExtensionsLabel);
    const installedActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowInstalledExtensionsAction);
    actionRegistry.registerWorkbenchAction(installedActionDescriptor, 'Extensions: Show Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const disabledActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowDisabledExtensionsAction);
    actionRegistry.registerWorkbenchAction(disabledActionDescriptor, 'Extensions: Show Disabled Extensions', extensionManagement_1.ExtensionsLabel);
    const builtinActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.ShowBuiltInExtensionsAction);
    actionRegistry.registerWorkbenchAction(builtinActionDescriptor, 'Extensions: Show Built-in Extensions', extensionManagement_1.ExtensionsLabel);
    const updateAllActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.UpdateAllAction);
    actionRegistry.registerWorkbenchAction(updateAllActionDescriptor, 'Extensions: Update All Extensions', extensionManagement_1.ExtensionsLabel);
    const installVSIXActionDescriptor = actions_1.SyncActionDescriptor.from(extensionsActions_1.InstallVSIXAction);
    actionRegistry.registerWorkbenchAction(installVSIXActionDescriptor, 'Extensions: Install from VSIX...', extensionManagement_1.ExtensionsLabel);
    const disableAllAction = actions_1.SyncActionDescriptor.from(extensionsActions_1.DisableAllAction);
    actionRegistry.registerWorkbenchAction(disableAllAction, 'Extensions: Disable All Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const disableAllWorkspaceAction = actions_1.SyncActionDescriptor.from(extensionsActions_1.DisableAllWorkspaceAction);
    actionRegistry.registerWorkbenchAction(disableAllWorkspaceAction, 'Extensions: Disable All Installed Extensions for this Workspace', extensionManagement_1.ExtensionsLabel);
    const enableAllAction = actions_1.SyncActionDescriptor.from(extensionsActions_1.EnableAllAction);
    actionRegistry.registerWorkbenchAction(enableAllAction, 'Extensions: Enable All Extensions', extensionManagement_1.ExtensionsLabel);
    const enableAllWorkspaceAction = actions_1.SyncActionDescriptor.from(extensionsActions_1.EnableAllWorkspaceAction);
    actionRegistry.registerWorkbenchAction(enableAllWorkspaceAction, 'Extensions: Enable All Extensions for this Workspace', extensionManagement_1.ExtensionsLabel);
    const checkForUpdatesAction = actions_1.SyncActionDescriptor.from(extensionsActions_1.CheckForUpdatesAction);
    actionRegistry.registerWorkbenchAction(checkForUpdatesAction, `Extensions: Check for Extension Updates`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(extensionsActions_1.EnableAutoUpdateAction), `Extensions: Enable Auto Updating Extensions`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(extensionsActions_1.DisableAutoUpdateAction), `Extensions: Disable Auto Updating Extensions`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(extensionsActions_1.InstallSpecificVersionOfExtensionAction), 'Install Specific Version of Extension...', extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(extensionsActions_1.ReinstallAction), 'Reinstall Extension...', nls_1.localize('developer', "Developer"));
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'extensions',
        order: 30,
        title: nls_1.localize('extensionsConfigurationTitle', "Extensions"),
        type: 'object',
        properties: {
            'extensions.autoUpdate': {
                type: 'boolean',
                description: nls_1.localize('extensionsAutoUpdate', "When enabled, automatically installs updates for extensions. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.autoCheckUpdates': {
                type: 'boolean',
                description: nls_1.localize('extensionsCheckUpdates', "When enabled, automatically checks extensions for updates. If an extension has an update, it is marked as outdated in the Extensions view. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.ignoreRecommendations': {
                type: 'boolean',
                description: nls_1.localize('extensionsIgnoreRecommendations', "When enabled, the notifications for extension recommendations will not be shown."),
                default: false
            },
            'extensions.showRecommendationsOnlyOnDemand': {
                type: 'boolean',
                description: nls_1.localize('extensionsShowRecommendationsOnlyOnDemand', "When enabled, recommendations will not be fetched or shown unless specifically requested by the user. Some recommendations are fetched from a Microsoft online service."),
                default: false,
                tags: ['usesOnlineServices']
            },
            'extensions.closeExtensionDetailsOnViewChange': {
                type: 'boolean',
                description: nls_1.localize('extensionsCloseExtensionDetailsOnViewChange', "When enabled, editors with extension details will be automatically closed upon navigating away from the Extensions View."),
                default: false
            },
            'extensions.confirmedUriHandlerExtensionIds': {
                type: 'array',
                description: nls_1.localize('handleUriConfirmedExtensions', "When an extension is listed here, a confirmation prompt will not be shown when that extension handles a URI."),
                default: []
            }
        }
    });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(extensionsFileTemplate_1.ExtensionsConfigurationSchemaId, extensionsFileTemplate_1.ExtensionsConfigurationSchema);
    // Register Commands
    commands_1.CommandsRegistry.registerCommand('_extensions.manage', (accessor, extensionId) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const extension = extensionService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id: extensionId }));
        if (extension.length === 1) {
            extensionService.open(extension[0]);
        }
    });
    commands_1.CommandsRegistry.registerCommand('extension.open', (accessor, extensionId) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        return extensionService.queryGallery({ names: [extensionId], pageSize: 1 }, cancellation_1.CancellationToken.None).then(pager => {
            if (pager.total !== 1) {
                return;
            }
            extensionService.open(pager.firstPage[0]);
        });
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.installExtension',
        description: {
            description: nls_1.localize('workbench.extensions.installExtension.description', "Install the given extension"),
            args: [
                {
                    name: nls_1.localize('workbench.extensions.installExtension.arg.name', "Extension id or VSIX resource uri"),
                    schema: {
                        'type': ['object', 'string']
                    }
                }
            ]
        },
        handler: async (accessor, arg) => {
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            try {
                if (typeof arg === 'string') {
                    const extension = await extensionGalleryService.getCompatibleExtension({ id: arg });
                    if (extension) {
                        await extensionManagementService.installFromGallery(extension);
                    }
                    else {
                        throw new Error(nls_1.localize('notFound', "Extension '{0}' not found.", arg));
                    }
                }
                else {
                    const vsix = uri_1.URI.revive(arg);
                    await extensionManagementService.install(vsix);
                }
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                throw e;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.uninstallExtension',
        description: {
            description: nls_1.localize('workbench.extensions.uninstallExtension.description', "Uninstall the given extension"),
            args: [
                {
                    name: nls_1.localize('workbench.extensions.uninstallExtension.arg.name', "Id of the extension to uninstall"),
                    schema: {
                        'type': 'string'
                    }
                }
            ]
        },
        handler: async (accessor, id) => {
            if (!id) {
                throw new Error(nls_1.localize('id required', "Extension id required."));
            }
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const installed = await extensionManagementService.getInstalled(1 /* User */);
            const [extensionToUninstall] = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id }));
            if (!extensionToUninstall) {
                throw new Error(nls_1.localize('notInstalled', "Extension '{0}' is not installed. Make sure you use the full extension ID, including the publisher, e.g.: ms-dotnettools.csharp.", id));
            }
            try {
                await extensionManagementService.uninstall(extensionToUninstall, true);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                throw e;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.search',
        description: {
            description: nls_1.localize('workbench.extensions.search.description', "Search for a specific extension"),
            args: [
                {
                    name: nls_1.localize('workbench.extensions.search.arg.name', "Query to use in search"),
                    schema: { 'type': 'string' }
                }
            ]
        },
        handler: async (accessor, query = '') => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const viewlet = await viewletService.openViewlet(extensions_2.VIEWLET_ID, true);
            if (!viewlet) {
                return;
            }
            viewlet.getViewPaneContainer().search(query);
            viewlet.focus();
        }
    });
    // File menu registration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        group: '2_keybindings',
        command: {
            id: extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID,
            title: nls_1.localize({ key: 'miOpenKeymapExtensions', comment: ['&& denotes a mnemonic'] }, "&&Keymaps")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '2_keybindings',
        command: {
            id: extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID,
            title: nls_1.localize('miOpenKeymapExtensions2', "Keymaps")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        group: '1_settings',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize({ key: 'miPreferencesExtensions', comment: ['&& denotes a mnemonic'] }, "&&Extensions")
        },
        order: 3
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '3_views',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize({ key: 'miViewExtensions', comment: ['&& denotes a mnemonic'] }, "E&&xtensions")
        },
        order: 5
    });
    // Global Activity Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '2_configuration',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize('showExtensions', "Extensions")
        },
        order: 3
    });
    // Extension Context Menu
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.copyExtension',
                title: { value: nls_1.localize('workbench.extensions.action.copyExtension', "Copy"), original: 'Copy' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '1_copy'
                }
            });
        }
        async run(accessor, extensionId) {
            const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
            let extension = extensionWorkbenchService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id: extensionId }))[0]
                || (await extensionWorkbenchService.queryGallery({ names: [extensionId], pageSize: 1 }, cancellation_1.CancellationToken.None)).firstPage[0];
            if (extension) {
                const name = nls_1.localize('extensionInfoName', 'Name: {0}', extension.displayName);
                const id = nls_1.localize('extensionInfoId', 'Id: {0}', extensionId);
                const description = nls_1.localize('extensionInfoDescription', 'Description: {0}', extension.description);
                const verision = nls_1.localize('extensionInfoVersion', 'Version: {0}', extension.version);
                const publisher = nls_1.localize('extensionInfoPublisher', 'Publisher: {0}', extension.publisherDisplayName);
                const link = extension.url ? nls_1.localize('extensionInfoVSMarketplaceLink', 'VS Marketplace Link: {0}', `${extension.url}`) : null;
                const clipboardStr = `${name}\n${id}\n${description}\n${verision}\n${publisher}${link ? '\n' + link : ''}`;
                await accessor.get(clipboardService_1.IClipboardService).writeText(clipboardStr);
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.copyExtensionId',
                title: { value: nls_1.localize('workbench.extensions.action.copyExtensionId', "Copy Extension Id"), original: 'Copy Extension Id' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '1_copy'
                }
            });
        }
        async run(accessor, id) {
            await accessor.get(clipboardService_1.IClipboardService).writeText(id);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.configure',
                title: { value: nls_1.localize('workbench.extensions.action.configure', "Extension Settings"), original: 'Extension Settings' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasConfiguration'))
                }
            });
        }
        async run(accessor, id) {
            await accessor.get(preferences_1.IPreferencesService).openSettings(false, `@ext:${id}`);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: extensions_2.TOGGLE_IGNORE_EXTENSION_ACTION_ID,
                title: { value: nls_1.localize('workbench.extensions.action.toggleIgnoreExtension', "Sync This Extension"), original: `Sync This Extension` },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: userDataSync_1.CONTEXT_SYNC_ENABLEMENT
                },
            });
        }
        async run(accessor, id) {
            const extensionsWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
            const extension = extensionsWorkbenchService.local.find(e => extensionManagementUtil_1.areSameExtensions({ id }, e.identifier));
            if (extension) {
                return extensionsWorkbenchService.toggleExtensionIgnoredToSync(extension);
            }
        }
    });
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    let ExtensionsContributions = class ExtensionsContributions {
        constructor(extensionManagementServerService) {
            if (extensionManagementServerService.localExtensionManagementServer
                || extensionManagementServerService.remoteExtensionManagementServer
                || extensionManagementServerService.webExtensionManagementServer) {
                platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
                    ctor: extensionsQuickAccess_1.InstallExtensionQuickAccessProvider,
                    prefix: extensionsQuickAccess_1.InstallExtensionQuickAccessProvider.PREFIX,
                    placeholder: nls_1.localize('installExtensionQuickAccessPlaceholder', "Type the name of an extension to install or search."),
                    helpEntries: [{ description: nls_1.localize('installExtensionQuickAccessHelp', "Install or Search Extensions"), needsEditor: false }]
                });
            }
        }
    };
    ExtensionsContributions = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService)
    ], ExtensionsContributions);
    workbenchRegistry.registerWorkbenchContribution(ExtensionsContributions, 1 /* Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.StatusUpdater, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.MaliciousExtensionChecker, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActions_1.ConfigureRecommendedExtensionsCommandsContributor, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsUtils_1.KeymapExtensions, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.ExtensionsViewletViewsContribution, 1 /* Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActivationProgress_1.ExtensionActivationProgress, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsDependencyChecker_1.ExtensionDependencyChecker, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(remoteExtensionsInstaller_1.RemoteExtensionsInstaller, 4 /* Eventually */);
});
//# __sourceMappingURL=extensions.contribution.js.map