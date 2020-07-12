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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/event", "vs/workbench/api/common/extHostWorkspace", "./extHost.protocol", "./extHostTypes", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/log/common/log", "vs/base/common/uri"], function (require, exports, objects_1, event_1, extHostWorkspace_1, extHost_protocol_1, extHostTypes_1, configurationModels_1, configurationRegistry_1, types_1, async_1, instantiation_1, extHostRpcService_1, log_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostConfiguration = exports.ExtHostConfigProvider = exports.ExtHostConfiguration = void 0;
    function lookUp(tree, key) {
        if (key) {
            const parts = key.split('.');
            let node = tree;
            for (let i = 0; node && i < parts.length; i++) {
                node = node[parts[i]];
            }
            return node;
        }
    }
    function isUri(thing) {
        return thing instanceof uri_1.URI;
    }
    function isResourceLanguage(thing) {
        return thing
            && thing.uri instanceof uri_1.URI
            && (thing.languageId && typeof thing.languageId === 'string');
    }
    function isLanguage(thing) {
        return thing
            && !thing.uri
            && (thing.languageId && typeof thing.languageId === 'string');
    }
    function isWorkspaceFolder(thing) {
        return thing
            && thing.uri instanceof uri_1.URI
            && (!thing.name || typeof thing.name === 'string')
            && (!thing.index || typeof thing.index === 'number');
    }
    function scopeToOverrides(scope) {
        if (isUri(scope)) {
            return { resource: scope };
        }
        if (isResourceLanguage(scope)) {
            return { resource: scope.uri, overrideIdentifier: scope.languageId };
        }
        if (isLanguage(scope)) {
            return { overrideIdentifier: scope.languageId };
        }
        if (isWorkspaceFolder(scope)) {
            return { resource: scope.uri };
        }
        if (scope === null) {
            return { resource: null };
        }
        return undefined;
    }
    let ExtHostConfiguration = class ExtHostConfiguration {
        constructor(extHostRpc, extHostWorkspace, logService) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadConfiguration);
            this._extHostWorkspace = extHostWorkspace;
            this._logService = logService;
            this._barrier = new async_1.Barrier();
            this._actual = null;
        }
        getConfigProvider() {
            return this._barrier.wait().then(_ => this._actual);
        }
        $initializeConfiguration(data) {
            this._actual = new ExtHostConfigProvider(this._proxy, this._extHostWorkspace, data, this._logService);
            this._barrier.open();
        }
        $acceptConfigurationChanged(data, change) {
            this.getConfigProvider().then(provider => provider.$acceptConfigurationChanged(data, change));
        }
    };
    ExtHostConfiguration = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, log_1.ILogService)
    ], ExtHostConfiguration);
    exports.ExtHostConfiguration = ExtHostConfiguration;
    class ExtHostConfigProvider {
        constructor(proxy, extHostWorkspace, data, logService) {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this._proxy = proxy;
            this._logService = logService;
            this._extHostWorkspace = extHostWorkspace;
            this._configuration = configurationModels_1.Configuration.parse(data);
            this._configurationScopes = this._toMap(data.configurationScopes);
        }
        get onDidChangeConfiguration() {
            return this._onDidChangeConfiguration && this._onDidChangeConfiguration.event;
        }
        $acceptConfigurationChanged(data, change) {
            const previous = { data: this._configuration.toData(), workspace: this._extHostWorkspace.workspace };
            this._configuration = configurationModels_1.Configuration.parse(data);
            this._configurationScopes = this._toMap(data.configurationScopes);
            this._onDidChangeConfiguration.fire(this._toConfigurationChangeEvent(change, previous));
        }
        getConfiguration(section, scope, extensionDescription) {
            const overrides = scopeToOverrides(scope) || {};
            const config = this._toReadonlyValue(section
                ? lookUp(this._configuration.getValue(undefined, overrides, this._extHostWorkspace.workspace), section)
                : this._configuration.getValue(undefined, overrides, this._extHostWorkspace.workspace));
            if (section) {
                this._validateConfigurationAccess(section, overrides, extensionDescription === null || extensionDescription === void 0 ? void 0 : extensionDescription.identifier);
            }
            function parseConfigurationTarget(arg) {
                if (arg === undefined || arg === null) {
                    return null;
                }
                if (typeof arg === 'boolean') {
                    return arg ? 1 /* USER */ : 4 /* WORKSPACE */;
                }
                switch (arg) {
                    case extHostTypes_1.ConfigurationTarget.Global: return 1 /* USER */;
                    case extHostTypes_1.ConfigurationTarget.Workspace: return 4 /* WORKSPACE */;
                    case extHostTypes_1.ConfigurationTarget.WorkspaceFolder: return 5 /* WORKSPACE_FOLDER */;
                }
            }
            const result = {
                has(key) {
                    return typeof lookUp(config, key) !== 'undefined';
                },
                get: (key, defaultValue) => {
                    this._validateConfigurationAccess(section ? `${section}.${key}` : key, overrides, extensionDescription === null || extensionDescription === void 0 ? void 0 : extensionDescription.identifier);
                    let result = lookUp(config, key);
                    if (typeof result === 'undefined') {
                        result = defaultValue;
                    }
                    else {
                        let clonedConfig = undefined;
                        const cloneOnWriteProxy = (target, accessor) => {
                            let clonedTarget = undefined;
                            const cloneTarget = () => {
                                clonedConfig = clonedConfig ? clonedConfig : objects_1.deepClone(config);
                                clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                            };
                            return types_1.isObject(target) ?
                                new Proxy(target, {
                                    get: (target, property) => {
                                        if (typeof property === 'string' && property.toLowerCase() === 'tojson') {
                                            cloneTarget();
                                            return () => clonedTarget;
                                        }
                                        if (clonedConfig) {
                                            clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                                            return clonedTarget[property];
                                        }
                                        const result = target[property];
                                        if (typeof property === 'string') {
                                            return cloneOnWriteProxy(result, `${accessor}.${property}`);
                                        }
                                        return result;
                                    },
                                    set: (_target, property, value) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            clonedTarget[property] = value;
                                        }
                                        return true;
                                    },
                                    deleteProperty: (_target, property) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            delete clonedTarget[property];
                                        }
                                        return true;
                                    },
                                    defineProperty: (_target, property, descriptor) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            Object.defineProperty(clonedTarget, property, descriptor);
                                        }
                                        return true;
                                    }
                                }) : target;
                        };
                        result = cloneOnWriteProxy(result, key);
                    }
                    return result;
                },
                update: (key, value, extHostConfigurationTarget, scopeToLanguage) => {
                    key = section ? `${section}.${key}` : key;
                    const target = parseConfigurationTarget(extHostConfigurationTarget);
                    if (value !== undefined) {
                        return this._proxy.$updateConfigurationOption(target, key, value, overrides, scopeToLanguage);
                    }
                    else {
                        return this._proxy.$removeConfigurationOption(target, key, overrides, scopeToLanguage);
                    }
                },
                inspect: (key) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    key = section ? `${section}.${key}` : key;
                    const config = objects_1.deepClone(this._configuration.inspect(key, overrides, this._extHostWorkspace.workspace));
                    if (config) {
                        return {
                            key,
                            defaultValue: (_a = config.default) === null || _a === void 0 ? void 0 : _a.value,
                            globalValue: (_b = config.user) === null || _b === void 0 ? void 0 : _b.value,
                            workspaceValue: (_c = config.workspace) === null || _c === void 0 ? void 0 : _c.value,
                            workspaceFolderValue: (_d = config.workspaceFolder) === null || _d === void 0 ? void 0 : _d.value,
                            defaultLanguageValue: (_e = config.default) === null || _e === void 0 ? void 0 : _e.override,
                            globalLanguageValue: (_f = config.user) === null || _f === void 0 ? void 0 : _f.override,
                            workspaceLanguageValue: (_g = config.workspace) === null || _g === void 0 ? void 0 : _g.override,
                            workspaceFolderLanguageValue: (_h = config.workspaceFolder) === null || _h === void 0 ? void 0 : _h.override,
                            languageIds: config.overrideIdentifiers
                        };
                    }
                    return undefined;
                }
            };
            if (typeof config === 'object') {
                objects_1.mixin(result, config, false);
            }
            return Object.freeze(result);
        }
        _toReadonlyValue(result) {
            const readonlyProxy = (target) => {
                return types_1.isObject(target) ?
                    new Proxy(target, {
                        get: (target, property) => readonlyProxy(target[property]),
                        set: (_target, property, _value) => { throw new Error(`TypeError: Cannot assign to read only property '${String(property)}' of object`); },
                        deleteProperty: (_target, property) => { throw new Error(`TypeError: Cannot delete read only property '${String(property)}' of object`); },
                        defineProperty: (_target, property) => { throw new Error(`TypeError: Cannot define property '${String(property)}' for a readonly object`); },
                        setPrototypeOf: (_target) => { throw new Error(`TypeError: Cannot set prototype for a readonly object`); },
                        isExtensible: () => false,
                        preventExtensions: () => true
                    }) : target;
            };
            return readonlyProxy(result);
        }
        _validateConfigurationAccess(key, overrides, extensionId) {
            const scope = configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key) ? 4 /* RESOURCE */ : this._configurationScopes.get(key);
            const extensionIdText = extensionId ? `[${extensionId.value}] ` : '';
            if (4 /* RESOURCE */ === scope) {
                if (typeof (overrides === null || overrides === void 0 ? void 0 : overrides.resource) === 'undefined') {
                    this._logService.warn(`${extensionIdText}Accessing a resource scoped configuration without providing a resource is not expected. To get the effective value for '${key}', provide the URI of a resource or 'null' for any resource.`);
                }
                return;
            }
            if (3 /* WINDOW */ === scope) {
                if (overrides === null || overrides === void 0 ? void 0 : overrides.resource) {
                    this._logService.warn(`${extensionIdText}Accessing a window scoped configuration for a resource is not expected. To associate '${key}' to a resource, define its scope to 'resource' in configuration contributions in 'package.json'.`);
                }
                return;
            }
        }
        _toConfigurationChangeEvent(change, previous) {
            const event = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this._extHostWorkspace.workspace);
            return Object.freeze({
                affectsConfiguration: (section, scope) => event.affectsConfiguration(section, scopeToOverrides(scope))
            });
        }
        _toMap(scopes) {
            return scopes.reduce((result, scope) => { result.set(scope[0], scope[1]); return result; }, new Map());
        }
    }
    exports.ExtHostConfigProvider = ExtHostConfigProvider;
    exports.IExtHostConfiguration = instantiation_1.createDecorator('IExtHostConfiguration');
});
//# __sourceMappingURL=extHostConfiguration.js.map