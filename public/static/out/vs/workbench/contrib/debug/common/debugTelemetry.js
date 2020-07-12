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
define(["require", "exports", "vs/platform/telemetry/common/telemetry"], function (require, exports, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTelemetry = void 0;
    let DebugTelemetry = class DebugTelemetry {
        constructor(model, telemetryService) {
            this.model = model;
            this.telemetryService = telemetryService;
        }
        logDebugSessionStart(dbgr, launchJsonExists) {
            const extension = dbgr.getMainExtensionDescriptor();
            /* __GDPR__
                "debugSessionStart" : {
                    "type": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "breakpointCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "exceptionBreakpoints": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "watchExpressionsCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "extensionName": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                    "isBuiltin": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true},
                    "launchJsonExists": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            return this.telemetryService.publicLog('debugSessionStart', {
                type: dbgr.type,
                breakpointCount: this.model.getBreakpoints().length,
                exceptionBreakpoints: this.model.getExceptionBreakpoints(),
                watchExpressionsCount: this.model.getWatchExpressions().length,
                extensionName: extension.identifier.value,
                isBuiltin: extension.isBuiltin,
                launchJsonExists
            });
        }
        logDebugSessionStop(session, adapterExitEvent) {
            const breakpoints = this.model.getBreakpoints();
            /* __GDPR__
                "debugSessionStop" : {
                    "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "success": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "sessionLengthInSeconds": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "breakpointCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "watchExpressionsCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            return this.telemetryService.publicLog('debugSessionStop', {
                type: session && session.configuration.type,
                success: adapterExitEvent.emittedStopped || breakpoints.length === 0,
                sessionLengthInSeconds: adapterExitEvent.sessionLengthInSeconds,
                breakpointCount: breakpoints.length,
                watchExpressionsCount: this.model.getWatchExpressions().length
            });
        }
        logDebugAddBreakpoint(breakpoint, context) {
            /* __GDPR__
                "debugAddBreakpoint" : {
                    "context": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "hasCondition": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "hasHitCondition": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "hasLogMessage": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            return this.telemetryService.publicLog('debugAddBreakpoint', {
                context: context,
                hasCondition: !!breakpoint.condition,
                hasHitCondition: !!breakpoint.hitCondition,
                hasLogMessage: !!breakpoint.logMessage
            });
        }
    };
    DebugTelemetry = __decorate([
        __param(1, telemetry_1.ITelemetryService)
    ], DebugTelemetry);
    exports.DebugTelemetry = DebugTelemetry;
});
//# __sourceMappingURL=debugTelemetry.js.map