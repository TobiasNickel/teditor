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
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/platform/registry/common/platform"], function (require, exports, nls_1, strings_1, instantiation_1, configuration_1, configurationRegistry_1, lifecycle_1, objects_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService {
        constructor(config, _configurationService) {
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._cleanupPatterns = [];
            this._appender = config.appender;
            this._commonProperties = config.commonProperties || Promise.resolve({});
            this._piiPaths = config.piiPaths || [];
            this._userOptIn = true;
            this._enabled = true;
            this.sendErrorTelemetry = !!config.sendErrorTelemetry;
            // static cleanup pattern for: `file:///DANGEROUS/PATH/resources/app/Useful/Information`
            this._cleanupPatterns = [/file:\/\/\/.*?\/resources\/app\//gi];
            for (let piiPath of this._piiPaths) {
                this._cleanupPatterns.push(new RegExp(strings_1.escapeRegExpCharacters(piiPath), 'gi'));
            }
            if (this._configurationService) {
                this._updateUserOptIn();
                this._configurationService.onDidChangeConfiguration(this._updateUserOptIn, this, this._disposables);
                this.publicLog2('optInStatus', { optIn: this._userOptIn });
                this._commonProperties.then(values => {
                    const isHashedId = /^[a-f0-9]+$/i.test(values['common.machineId']);
                    this.publicLog2('machineIdFallback', { usingFallbackGuid: !isHashedId });
                });
            }
        }
        setEnabled(value) {
            this._enabled = value;
        }
        _updateUserOptIn() {
            const config = this._configurationService.getValue(TELEMETRY_SECTION_ID);
            this._userOptIn = config ? config.enableTelemetry : this._userOptIn;
        }
        get isOptedIn() {
            return this._userOptIn && this._enabled;
        }
        async getTelemetryInfo() {
            const values = await this._commonProperties;
            // well known properties
            let sessionId = values['sessionID'];
            let instanceId = values['common.instanceId'];
            let machineId = values['common.machineId'];
            let msftInternal = values['common.msftInternal'];
            return { sessionId, instanceId, machineId, msftInternal };
        }
        dispose() {
            this._disposables.dispose();
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            // don't send events when the user is optout
            if (!this.isOptedIn) {
                return Promise.resolve(undefined);
            }
            return this._commonProperties.then(values => {
                // (first) add common properties
                data = objects_1.mixin(data, values);
                // (last) remove all PII from data
                data = objects_1.cloneAndChange(data, value => {
                    if (typeof value === 'string') {
                        return this._cleanupInfo(value, anonymizeFilePaths);
                    }
                    return undefined;
                });
                this._appender.log(eventName, data);
            }, err => {
                // unsure what to do now...
                console.error(err);
            });
        }
        publicLog2(eventName, data, anonymizeFilePaths) {
            return this.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLogError(errorEventName, data) {
            if (!this.sendErrorTelemetry) {
                return Promise.resolve(undefined);
            }
            // Send error event and anonymize paths
            return this.publicLog(errorEventName, data, true);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        _cleanupInfo(stack, anonymizeFilePaths) {
            let updatedStack = stack;
            if (anonymizeFilePaths) {
                const cleanUpIndexes = [];
                for (let regexp of this._cleanupPatterns) {
                    while (true) {
                        const result = regexp.exec(stack);
                        if (!result) {
                            break;
                        }
                        cleanUpIndexes.push([result.index, regexp.lastIndex]);
                    }
                }
                const nodeModulesRegex = /^[\\\/]?(node_modules|node_modules\.asar)[\\\/]/;
                const fileRegex = /(file:\/\/)?([a-zA-Z]:(\\\\|\\|\/)|(\\\\|\\|\/))?([\w-\._]+(\\\\|\\|\/))+[\w-\._]*/g;
                let lastIndex = 0;
                updatedStack = '';
                while (true) {
                    const result = fileRegex.exec(stack);
                    if (!result) {
                        break;
                    }
                    // Anoynimize user file paths that do not need to be retained or cleaned up.
                    if (!nodeModulesRegex.test(result[0]) && cleanUpIndexes.every(([x, y]) => result.index < x || result.index >= y)) {
                        updatedStack += stack.substring(lastIndex, result.index) + '<REDACTED: user-file-path>';
                        lastIndex = fileRegex.lastIndex;
                    }
                }
                if (lastIndex < stack.length) {
                    updatedStack += stack.substr(lastIndex);
                }
            }
            // sanitize with configured cleanup patterns
            for (let regexp of this._cleanupPatterns) {
                updatedStack = updatedStack.replace(regexp, '');
            }
            return updatedStack;
        }
    };
    TelemetryService.IDLE_START_EVENT_NAME = 'UserIdleStart';
    TelemetryService.IDLE_STOP_EVENT_NAME = 'UserIdleStop';
    TelemetryService = __decorate([
        __param(1, instantiation_1.optional(configuration_1.IConfigurationService))
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
    const TELEMETRY_SECTION_ID = 'telemetry';
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': TELEMETRY_SECTION_ID,
        'order': 110,
        'type': 'object',
        'title': nls_1.localize('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            'telemetry.enableTelemetry': {
                'type': 'boolean',
                'description': nls_1.localize('telemetry.enableTelemetry', "Enable usage data and errors to be sent to a Microsoft online service."),
                'default': true,
                'tags': ['usesOnlineServices']
            }
        }
    });
});
//# __sourceMappingURL=telemetryService.js.map