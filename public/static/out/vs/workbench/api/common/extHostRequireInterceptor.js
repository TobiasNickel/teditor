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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostExtensionService", "vs/base/common/process", "vs/platform/log/common/log"], function (require, exports, uri_1, extHost_protocol_1, extHostConfiguration_1, extensions_1, extensions_2, extHostRpcService_1, extHostInitDataService_1, instantiation_1, extHostExtensionService_1, process_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequireInterceptor = void 0;
    let RequireInterceptor = class RequireInterceptor {
        constructor(_apiFactory, _extensionRegistry, _instaService, _extHostConfiguration, _extHostExtensionService, _initData, _logService) {
            this._apiFactory = _apiFactory;
            this._extensionRegistry = _extensionRegistry;
            this._instaService = _instaService;
            this._extHostConfiguration = _extHostConfiguration;
            this._extHostExtensionService = _extHostExtensionService;
            this._initData = _initData;
            this._logService = _logService;
            this._factories = new Map();
            this._alternatives = [];
        }
        async install() {
            this._installInterceptor();
            const configProvider = await this._extHostConfiguration.getConfigProvider();
            const extensionPaths = await this._extHostExtensionService.getExtensionPathIndex();
            this.register(new VSCodeNodeModuleFactory(this._apiFactory, extensionPaths, this._extensionRegistry, configProvider, this._logService));
            this.register(this._instaService.createInstance(KeytarNodeModuleFactory));
            if (this._initData.remote.isRemote) {
                this.register(this._instaService.createInstance(OpenNodeModuleFactory, extensionPaths, this._initData.environment.appUriScheme));
            }
        }
        register(interceptor) {
            if (Array.isArray(interceptor.nodeModuleName)) {
                for (let moduleName of interceptor.nodeModuleName) {
                    this._factories.set(moduleName, interceptor);
                }
            }
            else {
                this._factories.set(interceptor.nodeModuleName, interceptor);
            }
            if (typeof interceptor.alternativeModuleName === 'function') {
                this._alternatives.push((moduleName) => {
                    return interceptor.alternativeModuleName(moduleName);
                });
            }
        }
    };
    RequireInterceptor = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostExtensionService_1.IExtHostExtensionService),
        __param(5, extHostInitDataService_1.IExtHostInitDataService),
        __param(6, log_1.ILogService)
    ], RequireInterceptor);
    exports.RequireInterceptor = RequireInterceptor;
    //#region --- vscode-module
    class VSCodeNodeModuleFactory {
        constructor(_apiFactory, _extensionPaths, _extensionRegistry, _configProvider, _logService) {
            this._apiFactory = _apiFactory;
            this._extensionPaths = _extensionPaths;
            this._extensionRegistry = _extensionRegistry;
            this._configProvider = _configProvider;
            this._logService = _logService;
            this.nodeModuleName = 'vscode';
            this._extApiImpl = new Map();
        }
        load(_request, parent) {
            // get extension id from filename and api for extension
            const ext = this._extensionPaths.findSubstr(parent.fsPath);
            if (ext) {
                let apiImpl = this._extApiImpl.get(extensions_2.ExtensionIdentifier.toKey(ext.identifier));
                if (!apiImpl) {
                    apiImpl = this._apiFactory(ext, this._extensionRegistry, this._configProvider);
                    this._extApiImpl.set(extensions_2.ExtensionIdentifier.toKey(ext.identifier), apiImpl);
                }
                return apiImpl;
            }
            // fall back to a default implementation
            if (!this._defaultApiImpl) {
                let extensionPathsPretty = '';
                this._extensionPaths.forEach((value, index) => extensionPathsPretty += `\t${index} -> ${value.identifier.value}\n`);
                this._logService.warn(`Could not identify extension for 'vscode' require call from ${parent.fsPath}. These are the extension path mappings: \n${extensionPathsPretty}`);
                this._defaultApiImpl = this._apiFactory(extensions_1.nullExtensionDescription, this._extensionRegistry, this._configProvider);
            }
            return this._defaultApiImpl;
        }
    }
    let KeytarNodeModuleFactory = class KeytarNodeModuleFactory {
        constructor(rpcService, initData) {
            this.nodeModuleName = 'keytar';
            const { environment } = initData;
            const mainThreadKeytar = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadKeytar);
            if (environment.appRoot) {
                let appRoot = environment.appRoot.fsPath;
                if (process_1.platform === 'win32') {
                    appRoot = appRoot.replace(/\\/g, '/');
                }
                if (appRoot[appRoot.length - 1] === '/') {
                    appRoot = appRoot.substr(0, appRoot.length - 1);
                }
                this.alternativeNames = new Set();
                this.alternativeNames.add(`${appRoot}/node_modules.asar/keytar`);
                this.alternativeNames.add(`${appRoot}/node_modules/keytar`);
            }
            this._impl = {
                getPassword: (service, account) => {
                    return mainThreadKeytar.$getPassword(service, account);
                },
                setPassword: (service, account, password) => {
                    return mainThreadKeytar.$setPassword(service, account, password);
                },
                deletePassword: (service, account) => {
                    return mainThreadKeytar.$deletePassword(service, account);
                },
                findPassword: (service) => {
                    return mainThreadKeytar.$findPassword(service);
                },
                findCredentials(service) {
                    return mainThreadKeytar.$findCredentials(service);
                }
            };
        }
        load(_request, _parent) {
            return this._impl;
        }
        alternativeModuleName(name) {
            const length = name.length;
            // We need at least something like: `?/keytar` which requires
            // more than 7 characters.
            if (length <= 7 || !this.alternativeNames) {
                return undefined;
            }
            const sep = length - 7;
            if ((name.charAt(sep) === '/' || name.charAt(sep) === '\\') && name.endsWith('keytar')) {
                name = name.replace(/\\/g, '/');
                if (this.alternativeNames.has(name)) {
                    return 'keytar';
                }
            }
            return undefined;
        }
    };
    KeytarNodeModuleFactory = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], KeytarNodeModuleFactory);
    let OpenNodeModuleFactory = class OpenNodeModuleFactory {
        constructor(_extensionPaths, _appUriScheme, rpcService) {
            this._extensionPaths = _extensionPaths;
            this._appUriScheme = _appUriScheme;
            this.nodeModuleName = ['open', 'opn'];
            this._mainThreadTelemetry = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            const mainThreadWindow = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._impl = (target, options) => {
                const uri = uri_1.URI.parse(target);
                // If we have options use the original method.
                if (options) {
                    return this.callOriginal(target, options);
                }
                if (uri.scheme === 'http' || uri.scheme === 'https') {
                    return mainThreadWindow.$openUri(uri, target, { allowTunneling: true });
                }
                else if (uri.scheme === 'mailto' || uri.scheme === this._appUriScheme) {
                    return mainThreadWindow.$openUri(uri, target, {});
                }
                return this.callOriginal(target, options);
            };
        }
        load(request, parent, original) {
            // get extension id from filename and api for extension
            const extension = this._extensionPaths.findSubstr(parent.fsPath);
            if (extension) {
                this._extensionId = extension.identifier.value;
                this.sendShimmingTelemetry();
            }
            this._original = original(request);
            return this._impl;
        }
        callOriginal(target, options) {
            this.sendNoForwardTelemetry();
            return this._original(target, options);
        }
        sendShimmingTelemetry() {
            if (!this._extensionId) {
                return;
            }
            this._mainThreadTelemetry.$publicLog2('shimming.open', { extension: this._extensionId });
        }
        sendNoForwardTelemetry() {
            if (!this._extensionId) {
                return;
            }
            this._mainThreadTelemetry.$publicLog2('shimming.open.call.noForward', { extension: this._extensionId });
        }
    };
    OpenNodeModuleFactory = __decorate([
        __param(2, extHostRpcService_1.IExtHostRpcService)
    ], OpenNodeModuleFactory);
});
//#endregion
//# __sourceMappingURL=extHostRequireInterceptor.js.map