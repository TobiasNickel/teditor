/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostRequireInterceptor"], function (require, exports, extHost_api_impl_1, extHostExtensionService_1, extHostRequireInterceptor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostExtensionService = void 0;
    class WorkerRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() { }
        getModule(request, parent) {
            for (let alternativeModuleName of this._alternatives) {
                let alternative = alternativeModuleName(request);
                if (alternative) {
                    request = alternative;
                    break;
                }
            }
            if (this._factories.has(request)) {
                return this._factories.get(request).load(request, parent, () => { throw new Error('CANNOT LOAD MODULE from here.'); });
            }
            return undefined;
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        async _beforeAlmostReadyToRunExtensions() {
            // initialize API and register actors
            const apiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
            this._fakeModules = this._instaService.createInstance(WorkerRequireInterceptor, apiFactory, this._registry);
            await this._fakeModules.install();
        }
        async _loadCommonJSModule(module, activationTimesBuilder) {
            module = module.with({ path: ensureSuffix(module.path, '.js') });
            const response = await fetch(module.toString(true));
            if (response.status !== 200) {
                throw new Error(response.statusText);
            }
            // fetch JS sources as text and create a new function around it
            const source = await response.text();
            const initFn = new Function('module', 'exports', 'require', 'window', `${source}\n//# __sourceURL=${module.toString(true)}`);
            // define commonjs globals: `module`, `exports`, and `require`
            const _exports = {};
            const _module = { exports: _exports };
            const _require = (request) => {
                const result = this._fakeModules.getModule(request, module);
                if (result === undefined) {
                    throw new Error(`Cannot load module '${request}'`);
                }
                return result;
            };
            try {
                activationTimesBuilder.codeLoadingStart();
                initFn(_module, _exports, _require, self);
                return (_module.exports !== _exports ? _module.exports : _exports);
            }
            finally {
                activationTimesBuilder.codeLoadingStop();
            }
        }
        async $setRemoteEnvironment(_env) {
            throw new Error('Not supported');
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
    function ensureSuffix(path, suffix) {
        return path.endsWith(suffix) ? path : path + suffix;
    }
});
//# __sourceMappingURL=extHostExtensionService.js.map