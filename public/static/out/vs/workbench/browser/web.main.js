/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/performance", "vs/base/browser/dom", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/log/browser/log", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/browser/workbench", "vs/workbench/services/remote/common/remoteAgentFileSystemChannel", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/productService", "vs/platform/product/common/product", "vs/workbench/services/remote/browser/remoteAgentServiceImpl", "vs/platform/remote/browser/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/errors", "vs/base/browser/browser", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/configuration/browser/configurationCache", "vs/platform/sign/common/sign", "vs/platform/sign/browser/signService", "vs/workbench/services/userData/common/fileUserDataProvider", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/platform/storage/browser/storageService", "vs/platform/storage/common/storage", "vs/platform/driver/browser/driver", "vs/platform/log/common/bufferLog", "vs/platform/log/common/fileLogService", "vs/base/common/date", "vs/workbench/services/log/browser/indexedDBLogProvider", "vs/workbench/services/log/common/inMemoryLogProvider", "vs/platform/windows/common/windows", "vs/workbench/services/workspaces/browser/workspaces", "vs/base/common/arrays", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/resource/common/resourceIdentityService", "vs/platform/commands/common/commands"], function (require, exports, performance_1, dom_1, serviceCollection_1, log_1, log_2, lifecycle_1, environmentService_1, workbench_1, remoteAgentFileSystemChannel_1, environmentService_2, productService_1, product_1, remoteAgentServiceImpl_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentService_1, files_1, fileService_1, network_1, workspace_1, configuration_1, errors_1, browser, platform, uri_1, configurationService_1, configurationCache_1, sign_1, signService_1, fileUserDataProvider_1, environment_1, resources_1, storageService_1, storage_1, driver_1, bufferLog_1, fileLogService_1, date_1, indexedDBLogProvider_1, inMemoryLogProvider_1, windows_1, workspaces_1, arrays_1, inMemoryFilesystemProvider_1, resourceIdentityService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = void 0;
    class BrowserMain extends lifecycle_1.Disposable {
        constructor(domElement, configuration) {
            super();
            this.domElement = domElement;
            this.configuration = configuration;
        }
        async open() {
            const services = await this.initServices();
            await dom_1.domContentLoaded();
            performance_1.mark('willStartWorkbench');
            // Create Workbench
            const workbench = new workbench_1.Workbench(this.domElement, services.serviceCollection, services.logService);
            // Listeners
            this.registerListeners(workbench, services.storageService);
            // Driver
            if (this.configuration.driver) {
                (async () => this._register(await driver_1.registerWindowDriver()))();
            }
            // Startup
            const instantiationService = workbench.startup();
            // Return API Facade
            return instantiationService.invokeFunction(accessor => {
                const commandService = accessor.get(commands_1.ICommandService);
                return {
                    commands: {
                        executeCommand: (command, ...args) => commandService.executeCommand(command, ...args)
                    }
                };
            });
        }
        registerListeners(workbench, storageService) {
            // Layout
            const viewport = platform.isIOS && window.visualViewport ? window.visualViewport /** Visual viewport */ : window /** Layout viewport */;
            this._register(dom_1.addDisposableListener(viewport, dom_1.EventType.RESIZE, () => workbench.layout()));
            // Prevent the back/forward gestures in macOS
            this._register(dom_1.addDisposableListener(this.domElement, dom_1.EventType.WHEEL, e => e.preventDefault(), { passive: false }));
            // Prevent native context menus in web
            this._register(dom_1.addDisposableListener(this.domElement, dom_1.EventType.CONTEXT_MENU, e => dom_1.EventHelper.stop(e, true)));
            // Prevent default navigation on drop
            this._register(dom_1.addDisposableListener(this.domElement, dom_1.EventType.DROP, e => dom_1.EventHelper.stop(e, true)));
            // Workbench Lifecycle
            this._register(workbench.onBeforeShutdown(event => {
                if (storageService.hasPendingUpdate) {
                    console.warn('Unload prevented: pending storage update');
                    event.veto(true); // prevent data loss from pending storage update
                }
            }));
            this._register(workbench.onWillShutdown(() => {
                storageService.close();
            }));
            this._register(workbench.onShutdown(() => this.dispose()));
            // Fullscreen
            [dom_1.EventType.FULLSCREEN_CHANGE, dom_1.EventType.WK_FULLSCREEN_CHANGE].forEach(event => {
                this._register(dom_1.addDisposableListener(document, event, () => {
                    if (document.fullscreenElement || document.webkitFullscreenElement || document.webkitIsFullScreen) {
                        browser.setFullscreen(true);
                    }
                    else {
                        browser.setFullscreen(false);
                    }
                }));
            });
        }
        async initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // NOTE: DO NOT ADD ANY OTHER SERVICE INTO THE COLLECTION HERE.
            // CONTRIBUTE IT VIA WORKBENCH.WEB.MAIN.TS AND registerSingleton().
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Log
            const logsPath = uri_1.URI.file(date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')).with({ scheme: 'vscode-log' });
            const logService = new bufferLog_1.BufferLogService(this.configuration.logLevel);
            serviceCollection.set(log_1.ILogService, logService);
            // Resource Identity
            const resourceIdentityService = this._register(new resourceIdentityService_1.WebResourceIdentityService());
            serviceCollection.set(resourceIdentityService_1.IResourceIdentityService, resourceIdentityService);
            const payload = await this.resolveWorkspaceInitializationPayload(resourceIdentityService);
            // Environment
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService(Object.assign({ workspaceId: payload.id, logsPath }, this.configuration));
            serviceCollection.set(environmentService_2.IWorkbenchEnvironmentService, environmentService);
            // Product
            const productService = Object.assign(Object.assign({ _serviceBrand: undefined }, product_1.default), this.configuration.productConfiguration);
            serviceCollection.set(productService_1.IProductService, productService);
            // Remote
            const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService(this.configuration.resourceUriProvider);
            serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
            // Signing
            const signService = new signService_1.SignService(environmentService.options.connectionToken || this.getCookieValue('vscode-tkn'));
            serviceCollection.set(sign_1.ISignService, signService);
            // Remote Agent
            const remoteAgentService = this._register(new remoteAgentServiceImpl_1.RemoteAgentService(this.configuration.webSocketFactory, environmentService, productService, remoteAuthorityResolverService, signService, logService));
            serviceCollection.set(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            serviceCollection.set(files_1.IFileService, fileService);
            this.registerFileSystemProviders(environmentService, fileService, remoteAgentService, logService, logsPath);
            // Long running services (workspace, config, storage)
            const services = await Promise.all([
                this.createWorkspaceService(payload, environmentService, fileService, remoteAgentService, logService).then(service => {
                    // Workspace
                    serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                    // Configuration
                    serviceCollection.set(configuration_1.IConfigurationService, service);
                    return service;
                }),
                this.createStorageService(payload, environmentService, fileService, logService).then(service => {
                    // Storage
                    serviceCollection.set(storage_1.IStorageService, service);
                    return service;
                })
            ]);
            return { serviceCollection, logService, storageService: services[1] };
        }
        registerFileSystemProviders(environmentService, fileService, remoteAgentService, logService, logsPath) {
            // Logger
            (async () => {
                if (browser.isEdge) {
                    fileService.registerProvider(logsPath.scheme, new inMemoryLogProvider_1.InMemoryLogProvider(logsPath.scheme));
                }
                else {
                    try {
                        const indexedDBLogProvider = new indexedDBLogProvider_1.IndexedDBLogProvider(logsPath.scheme);
                        await indexedDBLogProvider.database;
                        fileService.registerProvider(logsPath.scheme, indexedDBLogProvider);
                    }
                    catch (error) {
                        logService.info('Error while creating indexedDB log provider. Falling back to in-memory log provider.');
                        logService.error(error);
                        fileService.registerProvider(logsPath.scheme, new inMemoryLogProvider_1.InMemoryLogProvider(logsPath.scheme));
                    }
                }
                logService.logger = new log_1.MultiplexLogService(arrays_1.coalesce([
                    new log_1.ConsoleLogService(logService.getLevel()),
                    new fileLogService_1.FileLogService('window', environmentService.logFile, logService.getLevel(), fileService),
                    // Extension development test CLI: forward everything to test runner
                    environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI ? new log_2.ConsoleLogInAutomationService(logService.getLevel()) : undefined
                ]));
            })();
            const connection = remoteAgentService.getConnection();
            if (connection) {
                // Remote file system
                const remoteFileSystemProvider = this._register(new remoteAgentFileSystemChannel_1.RemoteFileSystemProvider(remoteAgentService));
                fileService.registerProvider(network_1.Schemas.vscodeRemote, remoteFileSystemProvider);
                if (!this.configuration.userDataProvider) {
                    const remoteUserDataUri = this.getRemoteUserDataUri();
                    if (remoteUserDataUri) {
                        this.configuration.userDataProvider = this._register(new fileUserDataProvider_1.FileUserDataProvider(remoteUserDataUri, resources_1.joinPath(remoteUserDataUri, environment_1.BACKUPS), remoteFileSystemProvider, environmentService, logService));
                    }
                }
            }
            // User data
            if (!this.configuration.userDataProvider) {
                this.configuration.userDataProvider = this._register(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            }
            fileService.registerProvider(network_1.Schemas.userData, this.configuration.userDataProvider);
        }
        async createStorageService(payload, environmentService, fileService, logService) {
            const storageService = new storageService_1.BrowserStorageService(environmentService, fileService);
            try {
                await storageService.initialize(payload);
                return storageService;
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
                logService.error(error);
                return storageService;
            }
        }
        async createWorkspaceService(payload, environmentService, fileService, remoteAgentService, logService) {
            const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: this.configuration.remoteAuthority, configurationCache: new configurationCache_1.ConfigurationCache() }, environmentService, fileService, remoteAgentService);
            try {
                await workspaceService.initialize(payload);
                return workspaceService;
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
                logService.error(error);
                return workspaceService;
            }
        }
        async resolveWorkspaceInitializationPayload(resourceIdentityService) {
            let workspace = undefined;
            if (this.configuration.workspaceProvider) {
                workspace = this.configuration.workspaceProvider.workspace;
            }
            // Multi-root workspace
            if (workspace && windows_1.isWorkspaceToOpen(workspace)) {
                return workspaces_1.getWorkspaceIdentifier(workspace.workspaceUri);
            }
            // Single-folder workspace
            if (workspace && windows_1.isFolderToOpen(workspace)) {
                const id = await resourceIdentityService.resolveResourceIdentity(workspace.folderUri);
                return { id, folder: workspace.folderUri };
            }
            return { id: 'empty-window' };
        }
        getRemoteUserDataUri() {
            const element = document.getElementById('vscode-remote-user-data-uri');
            if (element) {
                const remoteUserDataPath = element.getAttribute('data-settings');
                if (remoteUserDataPath) {
                    return resources_1.joinPath(uri_1.URI.revive(JSON.parse(remoteUserDataPath)), 'User');
                }
            }
            return undefined;
        }
        getCookieValue(name) {
            const match = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)'); // See https://stackoverflow.com/a/25490531
            return match ? match.pop() : undefined;
        }
    }
    function main(domElement, options) {
        const workbench = new BrowserMain(domElement, options);
        return workbench.open();
    }
    exports.main = main;
});
//# __sourceMappingURL=web.main.js.map