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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/editor/common/services/textResourceConfigurationService", "vs/base/common/platform", "vs/base/common/network", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, configuration_1, textResourceConfigurationService_1, platform_1, network_1, storage_1, environmentService_1, extensions_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourcePropertiesService = void 0;
    let TextResourcePropertiesService = class TextResourcePropertiesService {
        constructor(configurationService, remoteAgentService, environmentService, storageService) {
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.remoteEnvironment = null;
            remoteAgentService.getEnvironment().then(remoteEnv => this.remoteEnvironment = remoteEnv);
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && eol !== 'auto') {
                return eol;
            }
            const os = this.getOS(resource);
            return os === 3 /* Linux */ || os === 2 /* Macintosh */ ? '\n' : '\r\n';
        }
        getOS(resource) {
            let os = platform_1.OS;
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            if (remoteAuthority) {
                if (resource && resource.scheme !== network_1.Schemas.file) {
                    const osCacheKey = `resource.authority.os.${remoteAuthority}`;
                    os = this.remoteEnvironment ? this.remoteEnvironment.os : /* Get it from cache */ this.storageService.getNumber(osCacheKey, 1 /* WORKSPACE */, platform_1.OS);
                    this.storageService.store(osCacheKey, os, 1 /* WORKSPACE */);
                }
            }
            return os;
        }
    };
    TextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, storage_1.IStorageService)
    ], TextResourcePropertiesService);
    exports.TextResourcePropertiesService = TextResourcePropertiesService;
    extensions_1.registerSingleton(textResourceConfigurationService_1.ITextResourcePropertiesService, TextResourcePropertiesService, true);
});
//# __sourceMappingURL=textResourcePropertiesService.js.map