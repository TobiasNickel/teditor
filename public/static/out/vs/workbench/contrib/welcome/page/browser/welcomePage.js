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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/strings", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/workbench/contrib/welcome/walkThrough/browser/walkThroughInput", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/nls", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/base/common/network", "vs/workbench/services/backup/common/backup", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/base/common/labels", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/welcome/walkThrough/common/walkThroughUtils", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/base/common/async", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/label/common/label", "vs/platform/files/common/files", "vs/base/common/resources", "vs/platform/workspaces/common/workspaces", "vs/base/common/cancellation", "vs/workbench/services/host/browser/host", "vs/platform/product/common/productService", "vs/workbench/services/layout/browser/layoutService", "vs/css!./welcomePage", "vs/workbench/contrib/welcome/page/browser/vs_code_welcome_page"], function (require, exports, uri_1, strings, commands_1, arrays, walkThroughInput_1, instantiation_1, editorService_1, errors_1, workspace_1, configuration_1, nls_1, actions_1, telemetry_1, network_1, backup_1, extensionsUtils_1, extensionManagement_1, extensionManagement_2, lifecycle_1, lifecycle_2, labels_1, themeService_1, colorRegistry_1, walkThroughUtils_1, extensions_1, notification_1, async_1, extensionManagementUtil_1, label_1, files_1, resources_1, workspaces_1, cancellation_1, host_1, productService_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.welcomePageBackground = exports.buttonHoverBackground = exports.buttonBackground = exports.WelcomeInputFactory = exports.WelcomePageAction = exports.WelcomePageContribution = void 0;
    const configurationKey = 'workbench.startupEditor';
    const oldConfigurationKey = 'workbench.welcome.enabled';
    const telemetryFrom = 'welcomePage';
    let WelcomePageContribution = class WelcomePageContribution {
        constructor(instantiationService, configurationService, editorService, backupFileService, fileService, contextService, lifecycleService, layoutService, commandService) {
            this.commandService = commandService;
            const enabled = isWelcomePageEnabled(configurationService, contextService);
            if (enabled && lifecycleService.startupKind !== 3 /* ReloadedWindow */) {
                backupFileService.hasBackups().then(hasBackups => {
                    // Open the welcome even if we opened a set of default editors
                    if ((!editorService.activeEditor || layoutService.openedDefaultEditors) && !hasBackups) {
                        const openWithReadme = configurationService.getValue(configurationKey) === 'readme';
                        if (openWithReadme) {
                            return Promise.all(contextService.getWorkspace().folders.map(folder => {
                                const folderUri = folder.uri;
                                return fileService.resolve(folderUri)
                                    .then(folder => {
                                    const files = folder.children ? folder.children.map(child => child.name) : [];
                                    const file = arrays.find(files.sort(), file => strings.startsWith(file.toLowerCase(), 'readme'));
                                    if (file) {
                                        return resources_1.joinPath(folderUri, file);
                                    }
                                    return undefined;
                                }, errors_1.onUnexpectedError);
                            })).then(arrays.coalesce)
                                .then(readmes => {
                                if (!editorService.activeEditor) {
                                    if (readmes.length) {
                                        const isMarkDown = (readme) => strings.endsWith(readme.path.toLowerCase(), '.md');
                                        return Promise.all([
                                            this.commandService.executeCommand('markdown.showPreview', null, readmes.filter(isMarkDown), { locked: true }),
                                            editorService.openEditors(readmes.filter(readme => !isMarkDown(readme))
                                                .map(readme => ({ resource: readme }))),
                                        ]);
                                    }
                                    else {
                                        return instantiationService.createInstance(WelcomePage).openEditor();
                                    }
                                }
                                return undefined;
                            });
                        }
                        else {
                            let options;
                            let editor = editorService.activeEditor;
                            if (editor) {
                                // Ensure that the welcome editor won't get opened more than once
                                if (editor.getTypeId() === welcomeInputTypeId || editorService.editors.some(e => e.getTypeId() === welcomeInputTypeId)) {
                                    return undefined;
                                }
                                options = { pinned: false, index: 0 };
                            }
                            else {
                                options = { pinned: false };
                            }
                            return instantiationService.createInstance(WelcomePage).openEditor(options);
                        }
                    }
                    return undefined;
                }).then(undefined, errors_1.onUnexpectedError);
            }
        }
    };
    WelcomePageContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, editorService_1.IEditorService),
        __param(3, backup_1.IBackupFileService),
        __param(4, files_1.IFileService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, lifecycle_1.ILifecycleService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, commands_1.ICommandService)
    ], WelcomePageContribution);
    exports.WelcomePageContribution = WelcomePageContribution;
    function isWelcomePageEnabled(configurationService, contextService) {
        const startupEditor = configurationService.inspect(configurationKey);
        if (!startupEditor.userValue && !startupEditor.workspaceValue) {
            const welcomeEnabled = configurationService.inspect(oldConfigurationKey);
            if (welcomeEnabled.value !== undefined && welcomeEnabled.value !== null) {
                return welcomeEnabled.value;
            }
        }
        return startupEditor.value === 'welcomePage' || startupEditor.value === 'readme' || startupEditor.value === 'welcomePageInEmptyWorkbench' && contextService.getWorkbenchState() === 1 /* EMPTY */;
    }
    let WelcomePageAction = class WelcomePageAction extends actions_1.Action {
        constructor(id, label, instantiationService) {
            super(id, label);
            this.instantiationService = instantiationService;
        }
        run() {
            return this.instantiationService.createInstance(WelcomePage)
                .openEditor()
                .then(() => undefined);
        }
    };
    WelcomePageAction.ID = 'workbench.action.showWelcomePage';
    WelcomePageAction.LABEL = nls_1.localize('welcomePage', "Welcome");
    WelcomePageAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], WelcomePageAction);
    exports.WelcomePageAction = WelcomePageAction;
    const extensionPacks = [
        { name: nls_1.localize('welcomePage.javaScript', "JavaScript"), id: 'dbaeumer.vscode-eslint' },
        { name: nls_1.localize('welcomePage.python', "Python"), id: 'ms-python.python' },
        // { name: localize('welcomePage.go', "Go"), id: 'lukehoban.go' },
        { name: nls_1.localize('welcomePage.php', "PHP"), id: 'felixfbecker.php-pack' },
        { name: nls_1.localize('welcomePage.azure', "Azure"), title: nls_1.localize('welcomePage.showAzureExtensions', "Show Azure extensions"), id: 'workbench.extensions.action.showAzureExtensions', isCommand: true },
        { name: nls_1.localize('welcomePage.docker', "Docker"), id: 'ms-azuretools.vscode-docker' },
    ];
    const keymapExtensions = [
        { name: nls_1.localize('welcomePage.vim', "Vim"), id: 'vscodevim.vim', isKeymap: true },
        { name: nls_1.localize('welcomePage.sublime', "Sublime"), id: 'ms-vscode.sublime-keybindings', isKeymap: true },
        { name: nls_1.localize('welcomePage.atom', "Atom"), id: 'ms-vscode.atom-keybindings', isKeymap: true },
    ];
    /* __GDPR__
        "installExtension" : {
            "${include}": [
                "${WelcomePageInstall-1}"
            ]
        }
    */
    /* __GDPR__
        "installedExtension" : {
            "${include}": [
                "${WelcomePageInstalled-1}",
                "${WelcomePageInstalled-2}",
                "${WelcomePageInstalled-3}",
                "${WelcomePageInstalled-4}",
                "${WelcomePageInstalled-6}"
            ]
        }
    */
    /* __GDPR__
        "detailsExtension" : {
            "${include}": [
                "${WelcomePageDetails-1}"
            ]
        }
    */
    const extensionPackStrings = {
        installEvent: 'installExtension',
        installedEvent: 'installedExtension',
        detailsEvent: 'detailsExtension',
        alreadyInstalled: nls_1.localize('welcomePage.extensionPackAlreadyInstalled', "Support for {0} is already installed."),
        reloadAfterInstall: nls_1.localize('welcomePage.willReloadAfterInstallingExtensionPack', "The window will reload after installing additional support for {0}."),
        installing: nls_1.localize('welcomePage.installingExtensionPack', "Installing additional support for {0}..."),
        extensionNotFound: nls_1.localize('welcomePage.extensionPackNotFound', "Support for {0} with id {1} could not be found."),
    };
    /* __GDPR__
        "installKeymap" : {
            "${include}": [
                "${WelcomePageInstall-1}"
            ]
        }
    */
    /* __GDPR__
        "installedKeymap" : {
            "${include}": [
                "${WelcomePageInstalled-1}",
                "${WelcomePageInstalled-2}",
                "${WelcomePageInstalled-3}",
                "${WelcomePageInstalled-4}",
                "${WelcomePageInstalled-6}"
            ]
        }
    */
    /* __GDPR__
        "detailsKeymap" : {
            "${include}": [
                "${WelcomePageDetails-1}"
            ]
        }
    */
    const keymapStrings = {
        installEvent: 'installKeymap',
        installedEvent: 'installedKeymap',
        detailsEvent: 'detailsKeymap',
        alreadyInstalled: nls_1.localize('welcomePage.keymapAlreadyInstalled', "The {0} keyboard shortcuts are already installed."),
        reloadAfterInstall: nls_1.localize('welcomePage.willReloadAfterInstallingKeymap', "The window will reload after installing the {0} keyboard shortcuts."),
        installing: nls_1.localize('welcomePage.installingKeymap', "Installing the {0} keyboard shortcuts..."),
        extensionNotFound: nls_1.localize('welcomePage.keymapNotFound', "The {0} keyboard shortcuts with id {1} could not be found."),
    };
    const welcomeInputTypeId = 'workbench.editors.welcomePageInput';
    let WelcomePage = class WelcomePage extends lifecycle_2.Disposable {
        constructor(editorService, instantiationService, workspacesService, contextService, configurationService, labelService, notificationService, extensionEnablementService, extensionGalleryService, extensionManagementService, tipsService, extensionsWorkbenchService, lifecycleService, telemetryService, hostService, productService) {
            super();
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.workspacesService = workspacesService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.notificationService = notificationService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManagementService = extensionManagementService;
            this.tipsService = tipsService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.telemetryService = telemetryService;
            this.hostService = hostService;
            this.productService = productService;
            this._register(lifecycleService.onShutdown(() => this.dispose()));
            const recentlyOpened = this.workspacesService.getRecentlyOpened();
            const installedExtensions = this.instantiationService.invokeFunction(extensionsUtils_1.getInstalledExtensions);
            const resource = uri_1.URI.parse(require.toUrl('./vs_code_welcome_page'))
                .with({
                scheme: network_1.Schemas.walkThrough,
                query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcome/page/browser/vs_code_welcome_page' })
            });
            this.editorInput = this.instantiationService.createInstance(walkThroughInput_1.WalkThroughInput, {
                typeId: welcomeInputTypeId,
                name: nls_1.localize('welcome.title', "Welcome"),
                resource,
                telemetryFrom,
                onReady: (container) => this.onReady(container, recentlyOpened, installedExtensions)
            });
        }
        openEditor(options = { pinned: false }) {
            return this.editorService.openEditor(this.editorInput, options);
        }
        onReady(container, recentlyOpened, installedExtensions) {
            const enabled = isWelcomePageEnabled(this.configurationService, this.contextService);
            const showOnStartup = container.querySelector('#showOnStartup');
            if (enabled) {
                showOnStartup.setAttribute('checked', 'checked');
            }
            showOnStartup.addEventListener('click', e => {
                this.configurationService.updateValue(configurationKey, showOnStartup.checked ? 'welcomePage' : 'newUntitledFile', 1 /* USER */);
            });
            const prodName = container.querySelector('.welcomePage .title .caption');
            if (prodName) {
                prodName.innerHTML = this.productService.nameLong;
            }
            recentlyOpened.then(({ workspaces }) => {
                // Filter out the current workspace
                workspaces = workspaces.filter(recent => !this.contextService.isCurrentWorkspace(workspaces_1.isRecentWorkspace(recent) ? recent.workspace : recent.folderUri));
                if (!workspaces.length) {
                    const recent = container.querySelector('.welcomePage');
                    recent.classList.add('emptyRecent');
                    return;
                }
                const ul = container.querySelector('.recent ul');
                if (!ul) {
                    return;
                }
                const moreRecent = ul.querySelector('.moreRecent');
                const workspacesToShow = workspaces.slice(0, 5);
                const updateEntries = () => {
                    const listEntries = this.createListEntries(workspacesToShow);
                    while (ul.firstChild) {
                        ul.removeChild(ul.firstChild);
                    }
                    ul.append(...listEntries, moreRecent);
                };
                updateEntries();
                this._register(this.labelService.onDidChangeFormatters(updateEntries));
            }).then(undefined, errors_1.onUnexpectedError);
            this.addExtensionList(container, '.extensionPackList', extensionPacks, extensionPackStrings);
            this.addExtensionList(container, '.keymapList', keymapExtensions, keymapStrings);
            this.updateInstalledExtensions(container, installedExtensions);
            this._register(this.instantiationService.invokeFunction(extensionsUtils_1.onExtensionChanged)(ids => {
                for (const id of ids) {
                    if (container.querySelector(`.installExtension[data-extension="${id.id}"], .enabledExtension[data-extension="${id.id}"]`)) {
                        const installedExtensions = this.instantiationService.invokeFunction(extensionsUtils_1.getInstalledExtensions);
                        this.updateInstalledExtensions(container, installedExtensions);
                        break;
                    }
                }
            }));
        }
        createListEntries(recents) {
            return recents.map(recent => {
                let fullPath;
                let windowOpenable;
                if (workspaces_1.isRecentFolder(recent)) {
                    windowOpenable = { folderUri: recent.folderUri };
                    fullPath = recent.label || this.labelService.getWorkspaceLabel(recent.folderUri, { verbose: true });
                }
                else {
                    fullPath = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                    windowOpenable = { workspaceUri: recent.workspace.configPath };
                }
                const { name, parentPath } = labels_1.splitName(fullPath);
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.innerText = name;
                a.title = fullPath;
                a.setAttribute('aria-label', nls_1.localize('welcomePage.openFolderWithPath', "Open folder {0} with path {1}", name, parentPath));
                a.href = 'javascript:void(0)';
                a.addEventListener('click', e => {
                    this.telemetryService.publicLog2('workbenchActionExecuted', {
                        id: 'openRecentFolder',
                        from: telemetryFrom
                    });
                    this.hostService.openWindow([windowOpenable], { forceNewWindow: e.ctrlKey || e.metaKey });
                    e.preventDefault();
                    e.stopPropagation();
                });
                li.appendChild(a);
                const span = document.createElement('span');
                span.classList.add('path');
                span.classList.add('detail');
                span.innerText = parentPath;
                span.title = fullPath;
                li.appendChild(span);
                return li;
            });
        }
        addExtensionList(container, listSelector, suggestions, strings) {
            const list = container.querySelector(listSelector);
            if (list) {
                suggestions.forEach((extension, i) => {
                    if (i) {
                        list.appendChild(document.createTextNode(nls_1.localize('welcomePage.extensionListSeparator', ", ")));
                    }
                    const a = document.createElement('a');
                    a.innerText = extension.name;
                    a.title = extension.title || (extension.isKeymap ? nls_1.localize('welcomePage.installKeymap', "Install {0} keymap", extension.name) : nls_1.localize('welcomePage.installExtensionPack', "Install additional support for {0}", extension.name));
                    if (extension.isCommand) {
                        a.href = `command:${extension.id}`;
                        list.appendChild(a);
                    }
                    else {
                        a.classList.add('installExtension');
                        a.setAttribute('data-extension', extension.id);
                        a.href = 'javascript:void(0)';
                        a.addEventListener('click', e => {
                            this.installExtension(extension, strings);
                            e.preventDefault();
                            e.stopPropagation();
                        });
                        list.appendChild(a);
                        const span = document.createElement('span');
                        span.innerText = extension.name;
                        span.title = extension.isKeymap ? nls_1.localize('welcomePage.installedKeymap', "{0} keymap is already installed", extension.name) : nls_1.localize('welcomePage.installedExtensionPack', "{0} support is already installed", extension.name);
                        span.classList.add('enabledExtension');
                        span.setAttribute('data-extension', extension.id);
                        list.appendChild(span);
                    }
                });
            }
        }
        installExtension(extensionSuggestion, strings) {
            /* __GDPR__FRAGMENT__
                "WelcomePageInstall-1" : {
                    "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog(strings.installEvent, {
                from: telemetryFrom,
                extensionId: extensionSuggestion.id,
            });
            this.instantiationService.invokeFunction(extensionsUtils_1.getInstalledExtensions).then(extensions => {
                const installedExtension = arrays.first(extensions, extension => extensionManagementUtil_1.areSameExtensions(extension.identifier, { id: extensionSuggestion.id }));
                if (installedExtension && installedExtension.globallyEnabled) {
                    /* __GDPR__FRAGMENT__
                        "WelcomePageInstalled-1" : {
                            "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                            "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                            "outcome": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog(strings.installedEvent, {
                        from: telemetryFrom,
                        extensionId: extensionSuggestion.id,
                        outcome: 'already_enabled',
                    });
                    this.notificationService.info(strings.alreadyInstalled.replace('{0}', extensionSuggestion.name));
                    return;
                }
                const foundAndInstalled = installedExtension ? Promise.resolve(installedExtension.local) : this.extensionGalleryService.query({ names: [extensionSuggestion.id], source: telemetryFrom }, cancellation_1.CancellationToken.None)
                    .then((result) => {
                    const [extension] = result.firstPage;
                    if (!extension) {
                        return null;
                    }
                    return this.extensionManagementService.installFromGallery(extension)
                        .then(() => this.extensionManagementService.getInstalled(1 /* User */))
                        .then(installed => {
                        const local = installed.filter(i => extensionManagementUtil_1.areSameExtensions(extension.identifier, i.identifier))[0];
                        // TODO: Do this as part of the install to avoid multiple events.
                        return this.extensionEnablementService.setEnablement([local], 2 /* DisabledGlobally */).then(() => local);
                    });
                });
                this.notificationService.prompt(notification_1.Severity.Info, strings.reloadAfterInstall.replace('{0}', extensionSuggestion.name), [{
                        label: nls_1.localize('ok', "OK"),
                        run: () => {
                            const messageDelay = new async_1.TimeoutTimer();
                            messageDelay.cancelAndSet(() => {
                                this.notificationService.info(strings.installing.replace('{0}', extensionSuggestion.name));
                            }, 300);
                            const extensionsToDisable = extensions.filter(extension => extensionsUtils_1.isKeymapExtension(this.tipsService, extension) && extension.globallyEnabled).map(extension => extension.local);
                            extensionsToDisable.length ? this.extensionEnablementService.setEnablement(extensionsToDisable, 2 /* DisabledGlobally */) : Promise.resolve()
                                .then(() => {
                                return foundAndInstalled.then(foundExtension => {
                                    messageDelay.cancel();
                                    if (foundExtension) {
                                        return this.extensionEnablementService.setEnablement([foundExtension], 4 /* EnabledGlobally */)
                                            .then(() => {
                                            /* __GDPR__FRAGMENT__
                                                "WelcomePageInstalled-2" : {
                                                    "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                                    "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                                    "outcome": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                                }
                                            */
                                            this.telemetryService.publicLog(strings.installedEvent, {
                                                from: telemetryFrom,
                                                extensionId: extensionSuggestion.id,
                                                outcome: installedExtension ? 'enabled' : 'installed',
                                            });
                                            return this.hostService.reload();
                                        });
                                    }
                                    else {
                                        /* __GDPR__FRAGMENT__
                                            "WelcomePageInstalled-3" : {
                                                "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                                "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                                "outcome": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                            }
                                        */
                                        this.telemetryService.publicLog(strings.installedEvent, {
                                            from: telemetryFrom,
                                            extensionId: extensionSuggestion.id,
                                            outcome: 'not_found',
                                        });
                                        this.notificationService.error(strings.extensionNotFound.replace('{0}', extensionSuggestion.name).replace('{1}', extensionSuggestion.id));
                                        return undefined;
                                    }
                                });
                            }).then(undefined, err => {
                                /* __GDPR__FRAGMENT__
                                    "WelcomePageInstalled-4" : {
                                        "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                        "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                        "outcome": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                    }
                                */
                                this.telemetryService.publicLog(strings.installedEvent, {
                                    from: telemetryFrom,
                                    extensionId: extensionSuggestion.id,
                                    outcome: errors_1.isPromiseCanceledError(err) ? 'canceled' : 'error',
                                });
                                this.notificationService.error(err);
                            });
                        }
                    }, {
                        label: nls_1.localize('details', "Details"),
                        run: () => {
                            /* __GDPR__FRAGMENT__
                                "WelcomePageDetails-1" : {
                                    "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                                    "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                                }
                            */
                            this.telemetryService.publicLog(strings.detailsEvent, {
                                from: telemetryFrom,
                                extensionId: extensionSuggestion.id,
                            });
                            this.extensionsWorkbenchService.queryGallery({ names: [extensionSuggestion.id] }, cancellation_1.CancellationToken.None)
                                .then(result => this.extensionsWorkbenchService.open(result.firstPage[0]))
                                .then(undefined, errors_1.onUnexpectedError);
                        }
                    }]);
            }).then(undefined, err => {
                /* __GDPR__FRAGMENT__
                    "WelcomePageInstalled-6" : {
                        "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "extensionId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "outcome": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog(strings.installedEvent, {
                    from: telemetryFrom,
                    extensionId: extensionSuggestion.id,
                    outcome: errors_1.isPromiseCanceledError(err) ? 'canceled' : 'error',
                });
                this.notificationService.error(err);
            });
        }
        updateInstalledExtensions(container, installedExtensions) {
            installedExtensions.then(extensions => {
                const elements = container.querySelectorAll('.installExtension, .enabledExtension');
                for (let i = 0; i < elements.length; i++) {
                    elements[i].classList.remove('installed');
                }
                extensions.filter(ext => ext.globallyEnabled)
                    .map(ext => ext.identifier.id)
                    .forEach(id => {
                    const install = container.querySelectorAll(`.installExtension[data-extension="${id}"]`);
                    for (let i = 0; i < install.length; i++) {
                        install[i].classList.add('installed');
                    }
                    const enabled = container.querySelectorAll(`.enabledExtension[data-extension="${id}"]`);
                    for (let i = 0; i < enabled.length; i++) {
                        enabled[i].classList.add('installed');
                    }
                });
            }).then(undefined, errors_1.onUnexpectedError);
        }
    };
    WelcomePage = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, label_1.ILabelService),
        __param(6, notification_1.INotificationService),
        __param(7, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(8, extensionManagement_1.IExtensionGalleryService),
        __param(9, extensionManagement_1.IExtensionManagementService),
        __param(10, extensionManagement_2.IExtensionRecommendationsService),
        __param(11, extensions_1.IExtensionsWorkbenchService),
        __param(12, lifecycle_1.ILifecycleService),
        __param(13, telemetry_1.ITelemetryService),
        __param(14, host_1.IHostService),
        __param(15, productService_1.IProductService)
    ], WelcomePage);
    class WelcomeInputFactory {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return '{}';
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.createInstance(WelcomePage)
                .editorInput;
        }
    }
    exports.WelcomeInputFactory = WelcomeInputFactory;
    WelcomeInputFactory.ID = welcomeInputTypeId;
    // theming
    exports.buttonBackground = colorRegistry_1.registerColor('welcomePage.buttonBackground', { dark: null, light: null, hc: null }, nls_1.localize('welcomePage.buttonBackground', 'Background color for the buttons on the Welcome page.'));
    exports.buttonHoverBackground = colorRegistry_1.registerColor('welcomePage.buttonHoverBackground', { dark: null, light: null, hc: null }, nls_1.localize('welcomePage.buttonHoverBackground', 'Hover background color for the buttons on the Welcome page.'));
    exports.welcomePageBackground = colorRegistry_1.registerColor('welcomePage.background', { light: null, dark: null, hc: null }, nls_1.localize('welcomePage.background', 'Background color for the Welcome page.'));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const backgroundColor = theme.getColor(exports.welcomePageBackground);
        if (backgroundColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePageContainer { background-color: ${backgroundColor}; }`);
        }
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage .caption { color: ${foregroundColor}; }`);
        }
        const descriptionColor = theme.getColor(colorRegistry_1.descriptionForeground);
        if (descriptionColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage .detail { color: ${descriptionColor}; }`);
        }
        const buttonColor = walkThroughUtils_1.getExtraColor(theme, exports.buttonBackground, { dark: 'rgba(0, 0, 0, .2)', extra_dark: 'rgba(200, 235, 255, .042)', light: 'rgba(0,0,0,.04)', hc: 'black' });
        if (buttonColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage .commands .item button { background: ${buttonColor}; }`);
        }
        const buttonHoverColor = walkThroughUtils_1.getExtraColor(theme, exports.buttonHoverBackground, { dark: 'rgba(200, 235, 255, .072)', extra_dark: 'rgba(200, 235, 255, .072)', light: 'rgba(0,0,0,.10)', hc: null });
        if (buttonHoverColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage .commands .item button:hover { background: ${buttonHoverColor}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage a { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage a:hover,
			.monaco-workbench .part.editor > .content .welcomePage a:active { color: ${activeLink}; }`);
        }
        const focusColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage a:focus { outline-color: ${focusColor}; }`);
        }
        const border = theme.getColor(colorRegistry_1.contrastBorder);
        if (border) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage .commands .item button { border-color: ${border}; }`);
        }
        const activeBorder = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeBorder) {
            collector.addRule(`.monaco-workbench .part.editor > .content .welcomePage .commands .item button:hover { outline-color: ${activeBorder}; }`);
        }
    });
});
//# __sourceMappingURL=welcomePage.js.map