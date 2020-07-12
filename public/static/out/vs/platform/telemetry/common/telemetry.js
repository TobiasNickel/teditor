/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.crashReporterIdStorageKey = exports.machineIdKey = exports.lastSessionDateStorageKey = exports.firstSessionDateStorageKey = exports.currentSessionDateStorageKey = exports.instanceStorageKey = exports.ITelemetryService = void 0;
    exports.ITelemetryService = instantiation_1.createDecorator('telemetryService');
    // Keys
    exports.instanceStorageKey = 'telemetry.instanceId';
    exports.currentSessionDateStorageKey = 'telemetry.currentSessionDate';
    exports.firstSessionDateStorageKey = 'telemetry.firstSessionDate';
    exports.lastSessionDateStorageKey = 'telemetry.lastSessionDate';
    exports.machineIdKey = 'telemetry.machineId';
    exports.crashReporterIdStorageKey = 'crashReporter.guid';
});
//# __sourceMappingURL=telemetry.js.map