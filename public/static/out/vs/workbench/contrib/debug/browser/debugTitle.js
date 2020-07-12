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
define(["require", "exports", "vs/workbench/contrib/debug/common/debug", "vs/base/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/workbench/services/title/common/titleService"], function (require, exports, debug_1, lifecycle_1, host_1, titleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTitleContribution = void 0;
    let DebugTitleContribution = class DebugTitleContribution {
        constructor(debugService, hostService, titleService) {
            this.debugService = debugService;
            this.hostService = hostService;
            this.titleService = titleService;
            this.toDispose = [];
            const updateTitle = () => {
                if (debugService.state === 2 /* Stopped */ && !hostService.hasFocus) {
                    titleService.updateProperties({ prefix: '🔴' });
                }
                else {
                    titleService.updateProperties({ prefix: '' });
                }
            };
            this.toDispose.push(debugService.onDidChangeState(updateTitle));
            this.toDispose.push(hostService.onDidChangeFocus(updateTitle));
        }
        dispose() {
            lifecycle_1.dispose(this.toDispose);
        }
    };
    DebugTitleContribution = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, host_1.IHostService),
        __param(2, titleService_1.ITitleService)
    ], DebugTitleContribution);
    exports.DebugTitleContribution = DebugTitleContribution;
});
//# __sourceMappingURL=debugTitle.js.map