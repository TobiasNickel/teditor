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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/base/common/objects", "vs/base/common/types"], function (require, exports, configuration_1, log_1, objects_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cleanRemoteAuthority = exports.validateTelemetryData = exports.configurationTelemetry = exports.LogAppender = exports.NullAppender = exports.combinedAppender = exports.NullTelemetryService = void 0;
    exports.NullTelemetryService = new class {
        constructor() {
            this.sendErrorTelemetry = false;
            this.isOptedIn = true;
        }
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        setEnabled() { }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId'
            });
        }
    };
    function combinedAppender(...appenders) {
        return {
            log: (e, d) => appenders.forEach(a => a.log(e, d)),
            flush: () => Promise.all(appenders.map(a => a.flush()))
        };
    }
    exports.combinedAppender = combinedAppender;
    exports.NullAppender = { log: () => null, flush: () => Promise.resolve(null) };
    let LogAppender = class LogAppender {
        constructor(_logService) {
            this._logService = _logService;
            this.commonPropertiesRegex = /^sessionID$|^version$|^timestamp$|^commitHash$|^common\./;
        }
        flush() {
            return Promise.resolve(undefined);
        }
        log(eventName, data) {
            const strippedData = {};
            Object.keys(data).forEach(key => {
                if (!this.commonPropertiesRegex.test(key)) {
                    strippedData[key] = data[key];
                }
            });
            this._logService.trace(`telemetry/${eventName}`, strippedData);
        }
    };
    LogAppender = __decorate([
        __param(0, log_1.ILogService)
    ], LogAppender);
    exports.LogAppender = LogAppender;
    function configurationTelemetry(telemetryService, configurationService) {
        return configurationService.onDidChangeConfiguration(event => {
            if (event.source !== 6 /* DEFAULT */) {
                telemetryService.publicLog2('updateConfiguration', {
                    configurationSource: configuration_1.ConfigurationTargetToString(event.source),
                    configurationKeys: flattenKeys(event.sourceConfig)
                });
            }
        });
    }
    exports.configurationTelemetry = configurationTelemetry;
    function validateTelemetryData(data) {
        const properties = Object.create(null);
        const measurements = Object.create(null);
        const flat = Object.create(null);
        flatten(data, flat);
        for (let prop in flat) {
            // enforce property names less than 150 char, take the last 150 char
            prop = prop.length > 150 ? prop.substr(prop.length - 149) : prop;
            const value = flat[prop];
            if (typeof value === 'number') {
                measurements[prop] = value;
            }
            else if (typeof value === 'boolean') {
                measurements[prop] = value ? 1 : 0;
            }
            else if (typeof value === 'string') {
                //enforce property value to be less than 1024 char, take the first 1024 char
                properties[prop] = value.substring(0, 1023);
            }
            else if (typeof value !== 'undefined' && value !== null) {
                properties[prop] = value;
            }
        }
        return {
            properties,
            measurements
        };
    }
    exports.validateTelemetryData = validateTelemetryData;
    function cleanRemoteAuthority(remoteAuthority) {
        if (!remoteAuthority) {
            return 'none';
        }
        let ret = 'other';
        const allowedAuthorities = ['ssh-remote', 'dev-container', 'attached-container', 'wsl'];
        allowedAuthorities.forEach((res) => {
            if (remoteAuthority.indexOf(`${res}+`) === 0) {
                ret = res;
            }
        });
        return ret;
    }
    exports.cleanRemoteAuthority = cleanRemoteAuthority;
    function flatten(obj, result, order = 0, prefix) {
        if (!obj) {
            return;
        }
        for (let item of Object.getOwnPropertyNames(obj)) {
            const value = obj[item];
            const index = prefix ? prefix + item : item;
            if (Array.isArray(value)) {
                result[index] = objects_1.safeStringify(value);
            }
            else if (value instanceof Date) {
                // TODO unsure why this is here and not in _getData
                result[index] = value.toISOString();
            }
            else if (types_1.isObject(value)) {
                if (order < 2) {
                    flatten(value, result, order + 1, index + '.');
                }
                else {
                    result[index] = objects_1.safeStringify(value);
                }
            }
            else {
                result[index] = value;
            }
        }
    }
    function flattenKeys(value) {
        if (!value) {
            return [];
        }
        const result = [];
        flatKeys(result, '', value);
        return result;
    }
    function flatKeys(result, prefix, value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value)
                .forEach(key => flatKeys(result, prefix ? `${prefix}.${key}` : key, value[key]));
        }
        else {
            result.push(prefix);
        }
    }
});
//# __sourceMappingURL=telemetryUtils.js.map