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
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/progress/common/progress", "vs/nls", "vs/base/common/async", "vs/platform/log/common/log"], function (require, exports, extensions_1, progress_1, nls_1, async_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionActivationProgress = void 0;
    let ExtensionActivationProgress = class ExtensionActivationProgress {
        constructor(extensionService, progressService, logService) {
            const options = {
                location: 10 /* Window */,
                title: nls_1.localize('activation', "Activating Extensions...")
            };
            this._listener = extensionService.onWillActivateByEvent(e => {
                logService.trace('onWillActivateByEvent: ', e.event);
                progressService.withProgress(options, _ => Promise.race([e.activation, async_1.timeout(5000)]));
            });
        }
        dispose() {
            this._listener.dispose();
        }
    };
    ExtensionActivationProgress = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, progress_1.IProgressService),
        __param(2, log_1.ILogService)
    ], ExtensionActivationProgress);
    exports.ExtensionActivationProgress = ExtensionActivationProgress;
});
//# __sourceMappingURL=extensionsActivationProgress.js.map