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
define(["require", "exports", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspace/common/workspace", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment"], function (require, exports, uri_1, platform_1, configurationRegistry_1, workspace_1, extHost_protocol_1, extHostCustomers_1, configuration_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadConfiguration = void 0;
    let MainThreadConfiguration = class MainThreadConfiguration {
        constructor(extHostContext, _workspaceContextService, configurationService, _environmentService) {
            this._workspaceContextService = _workspaceContextService;
            this.configurationService = configurationService;
            this._environmentService = _environmentService;
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostConfiguration);
            proxy.$initializeConfiguration(this._getConfigurationData());
            this._configurationListener = configurationService.onDidChangeConfiguration(e => {
                proxy.$acceptConfigurationChanged(this._getConfigurationData(), e.change);
            });
        }
        _getConfigurationData() {
            const configurationData = Object.assign(Object.assign({}, (this.configurationService.getConfigurationData())), { configurationScopes: [] });
            // Send configurations scopes only in development mode.
            if (!this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment) {
                configurationData.configurationScopes = configurationRegistry_1.getScopes();
            }
            return configurationData;
        }
        dispose() {
            this._configurationListener.dispose();
        }
        $updateConfigurationOption(target, key, value, overrides, scopeToLanguage) {
            overrides = { resource: (overrides === null || overrides === void 0 ? void 0 : overrides.resource) ? uri_1.URI.revive(overrides.resource) : undefined, overrideIdentifier: overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifier };
            return this.writeConfiguration(target, key, value, overrides, scopeToLanguage);
        }
        $removeConfigurationOption(target, key, overrides, scopeToLanguage) {
            overrides = { resource: (overrides === null || overrides === void 0 ? void 0 : overrides.resource) ? uri_1.URI.revive(overrides.resource) : undefined, overrideIdentifier: overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifier };
            return this.writeConfiguration(target, key, undefined, overrides, scopeToLanguage);
        }
        writeConfiguration(target, key, value, overrides, scopeToLanguage) {
            var _a, _b, _c, _d, _e;
            target = target !== null && target !== undefined ? target : this.deriveConfigurationTarget(key, overrides);
            const configurationValue = this.configurationService.inspect(key, overrides);
            switch (target) {
                case 7 /* MEMORY */:
                    return this._updateValue(key, value, target, (_a = configurationValue === null || configurationValue === void 0 ? void 0 : configurationValue.memory) === null || _a === void 0 ? void 0 : _a.override, overrides, scopeToLanguage);
                case 5 /* WORKSPACE_FOLDER */:
                    return this._updateValue(key, value, target, (_b = configurationValue === null || configurationValue === void 0 ? void 0 : configurationValue.workspaceFolder) === null || _b === void 0 ? void 0 : _b.override, overrides, scopeToLanguage);
                case 4 /* WORKSPACE */:
                    return this._updateValue(key, value, target, (_c = configurationValue === null || configurationValue === void 0 ? void 0 : configurationValue.workspace) === null || _c === void 0 ? void 0 : _c.override, overrides, scopeToLanguage);
                case 3 /* USER_REMOTE */:
                    return this._updateValue(key, value, target, (_d = configurationValue === null || configurationValue === void 0 ? void 0 : configurationValue.userRemote) === null || _d === void 0 ? void 0 : _d.override, overrides, scopeToLanguage);
                default:
                    return this._updateValue(key, value, target, (_e = configurationValue === null || configurationValue === void 0 ? void 0 : configurationValue.userLocal) === null || _e === void 0 ? void 0 : _e.override, overrides, scopeToLanguage);
            }
        }
        _updateValue(key, value, configurationTarget, overriddenValue, overrides, scopeToLanguage) {
            overrides = scopeToLanguage === true ? overrides
                : scopeToLanguage === false ? { resource: overrides.resource }
                    : overrides.overrideIdentifier && overriddenValue !== undefined ? overrides
                        : { resource: overrides.resource };
            return this.configurationService.updateValue(key, value, overrides, configurationTarget, true);
        }
        deriveConfigurationTarget(key, overrides) {
            if (overrides.resource && this._workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                if (configurationProperties[key] && (configurationProperties[key].scope === 4 /* RESOURCE */ || configurationProperties[key].scope === 5 /* LANGUAGE_OVERRIDABLE */)) {
                    return 5 /* WORKSPACE_FOLDER */;
                }
            }
            return 4 /* WORKSPACE */;
        }
    };
    MainThreadConfiguration = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadConfiguration),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService)
    ], MainThreadConfiguration);
    exports.MainThreadConfiguration = MainThreadConfiguration;
});
//# __sourceMappingURL=mainThreadConfiguration.js.map