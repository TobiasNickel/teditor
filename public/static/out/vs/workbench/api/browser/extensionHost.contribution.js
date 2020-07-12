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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/jsonValidationExtensionPoint", "vs/workbench/services/themes/common/colorExtensionPoint", "vs/workbench/services/themes/common/tokenClassificationExtensionPoint", "vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint", "./mainThreadCodeInsets", "./mainThreadClipboard", "./mainThreadCommands", "./mainThreadConfiguration", "./mainThreadConsole", "./mainThreadDebugService", "./mainThreadDecorations", "./mainThreadDiagnostics", "./mainThreadDialogs", "./mainThreadDocumentContentProviders", "./mainThreadDocuments", "./mainThreadDocumentsAndEditors", "./mainThreadEditor", "./mainThreadEditors", "./mainThreadErrors", "./mainThreadExtensionService", "./mainThreadFileSystem", "./mainThreadFileSystemEventService", "./mainThreadKeytar", "./mainThreadLanguageFeatures", "./mainThreadLanguages", "./mainThreadLogService", "./mainThreadMessageService", "./mainThreadOutputService", "./mainThreadProgress", "./mainThreadQuickOpen", "./mainThreadRemoteConnectionData", "./mainThreadSaveParticipant", "./mainThreadSCM", "./mainThreadSearch", "./mainThreadStatusBar", "./mainThreadStorage", "./mainThreadTelemetry", "./mainThreadTerminalService", "./mainThreadTheming", "./mainThreadTreeViews", "./mainThreadDownloadService", "./mainThreadUrls", "./mainThreadWindow", "./mainThreadWebview", "./mainThreadWorkspace", "./mainThreadComments", "./mainThreadNotebook", "./mainThreadTask", "./mainThreadLabelService", "./mainThreadTunnelService", "./mainThreadAuthentication", "./mainThreadTimeline", "vs/workbench/api/common/apiCommands"], function (require, exports, contributions_1, platform_1, instantiation_1, jsonValidationExtensionPoint_1, colorExtensionPoint_1, tokenClassificationExtensionPoint_1, languageConfigurationExtensionPoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionPoints = void 0;
    let ExtensionPoints = class ExtensionPoints {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            // Classes that handle extension points...
            this.instantiationService.createInstance(jsonValidationExtensionPoint_1.JSONValidationExtensionPoint);
            this.instantiationService.createInstance(colorExtensionPoint_1.ColorExtensionPoint);
            this.instantiationService.createInstance(tokenClassificationExtensionPoint_1.TokenClassificationExtensionPoints);
            this.instantiationService.createInstance(languageConfigurationExtensionPoint_1.LanguageConfigurationFileHandler);
        }
    };
    ExtensionPoints = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ExtensionPoints);
    exports.ExtensionPoints = ExtensionPoints;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ExtensionPoints, 1 /* Starting */);
});
//# __sourceMappingURL=extensionHost.contribution.js.map