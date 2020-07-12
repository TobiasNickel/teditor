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
define(["require", "exports", "vs/workbench/services/textMate/common/textMateService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/textMate/browser/abstractTextMateService", "vs/editor/common/services/modeService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/progress/common/progress"], function (require, exports, textMateService_1, extensions_1, abstractTextMateService_1, modeService_1, log_1, notification_1, workbenchThemeService_1, configuration_1, storage_1, extensionResourceLoader_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateService = void 0;
    let TextMateService = class TextMateService extends abstractTextMateService_1.AbstractTextMateService {
        constructor(modeService, themeService, extensionResourceLoaderService, notificationService, logService, configurationService, storageService, progressService) {
            super(modeService, themeService, extensionResourceLoaderService, notificationService, logService, configurationService, storageService, progressService);
        }
        async _loadVSCodeOnigurumWASM() {
            const wasmPath = require.toUrl('vscode-oniguruma/../onig.wasm');
            const response = await fetch(wasmPath);
            // Using the response directly only works if the server sets the MIME type 'application/wasm'.
            // Otherwise, a TypeError is thrown when using the streaming compiler.
            // We therefore use the non-streaming compiler :(.
            return await response.arrayBuffer();
        }
    };
    TextMateService = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, storage_1.IStorageService),
        __param(7, progress_1.IProgressService)
    ], TextMateService);
    exports.TextMateService = TextMateService;
    extensions_1.registerSingleton(textMateService_1.ITextMateService, TextMateService);
});
//# __sourceMappingURL=textMateService.js.map