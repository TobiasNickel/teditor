/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/rpcProtocol", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiationService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostExtensionService"], function (require, exports, async_1, errors, lifecycle_1, uri_1, extHost_protocol_1, rpcProtocol_1, log_1, extensions_1, serviceCollection_1, extHostInitDataService_1, instantiationService_1, extHostRpcService_1, extHostUriTransformerService_1, extHostExtensionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostMain = void 0;
    class ExtensionHostMain {
        constructor(protocol, initData, hostUtils, uriTransformer) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._isTerminating = false;
            this._hostUtils = hostUtils;
            const rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, null, uriTransformer);
            // ensure URIs are transformed and revived
            initData = ExtensionHostMain._transform(initData, rpcProtocol);
            // bootstrap services
            const services = new serviceCollection_1.ServiceCollection(...extensions_1.getSingletonServiceDescriptors());
            services.set(extHostInitDataService_1.IExtHostInitDataService, Object.assign({ _serviceBrand: undefined }, initData));
            services.set(extHostRpcService_1.IExtHostRpcService, new extHostRpcService_1.ExtHostRpcService(rpcProtocol));
            services.set(extHostUriTransformerService_1.IURITransformerService, new extHostUriTransformerService_1.URITransformerService(uriTransformer));
            services.set(extHostExtensionService_1.IHostUtils, hostUtils);
            const instaService = new instantiationService_1.InstantiationService(services, true);
            // todo@joh
            // ugly self - inject
            const logService = instaService.invokeFunction(accessor => accessor.get(log_1.ILogService));
            this._disposables.add(logService);
            logService.info('extension host started');
            logService.trace('initData', initData);
            // todo@joh
            // ugly self - inject
            // must call initialize *after* creating the extension service
            // because `initialize` itself creates instances that depend on it
            this._extensionService = instaService.invokeFunction(accessor => accessor.get(extHostExtensionService_1.IExtHostExtensionService));
            this._extensionService.initialize();
            // error forwarding and stack trace scanning
            Error.stackTraceLimit = 100; // increase number of stack frames (from 10, https://github.com/v8/v8/wiki/Stack-Trace-API)
            const extensionErrors = new WeakMap();
            this._extensionService.getExtensionPathIndex().then(map => {
                Error.prepareStackTrace = (error, stackTrace) => {
                    let stackTraceMessage = '';
                    let extension;
                    let fileName;
                    for (const call of stackTrace) {
                        stackTraceMessage += `\n\tat ${call.toString()}`;
                        fileName = call.getFileName();
                        if (!extension && fileName) {
                            extension = map.findSubstr(fileName);
                        }
                    }
                    extensionErrors.set(error, extension);
                    return `${error.name || 'Error'}: ${error.message || ''}${stackTraceMessage}`;
                };
            });
            const mainThreadExtensions = rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            const mainThreadErrors = rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadErrors);
            errors.setUnexpectedErrorHandler(err => {
                const data = errors.transformErrorForSerialization(err);
                const extension = extensionErrors.get(err);
                if (extension) {
                    mainThreadExtensions.$onExtensionRuntimeError(extension.identifier, data);
                }
                else {
                    mainThreadErrors.$onUnexpectedError(data);
                }
            });
        }
        terminate() {
            if (this._isTerminating) {
                // we are already shutting down...
                return;
            }
            this._isTerminating = true;
            this._disposables.dispose();
            errors.setUnexpectedErrorHandler((err) => {
                // TODO: write to log once we have one
            });
            const extensionsDeactivated = this._extensionService.deactivateAll();
            // Give extensions 1 second to wrap up any async dispose, then exit in at most 4 seconds
            setTimeout(() => {
                Promise.race([async_1.timeout(4000), extensionsDeactivated]).finally(() => this._hostUtils.exit());
            }, 1000);
        }
        static _transform(initData, rpcProtocol) {
            initData.extensions.forEach((ext) => ext.extensionLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(ext.extensionLocation)));
            initData.environment.appRoot = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.appRoot));
            initData.environment.appSettingsHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.appSettingsHome));
            const extDevLocs = initData.environment.extensionDevelopmentLocationURI;
            if (extDevLocs) {
                initData.environment.extensionDevelopmentLocationURI = extDevLocs.map(url => uri_1.URI.revive(rpcProtocol.transformIncomingURIs(url)));
            }
            initData.environment.extensionTestsLocationURI = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionTestsLocationURI));
            initData.environment.globalStorageHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.globalStorageHome));
            initData.environment.userHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.userHome));
            initData.logsLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.logsLocation));
            initData.logFile = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.logFile));
            initData.workspace = rpcProtocol.transformIncomingURIs(initData.workspace);
            return initData;
        }
    }
    exports.ExtensionHostMain = ExtensionHostMain;
});
//# __sourceMappingURL=extensionHostMain.js.map