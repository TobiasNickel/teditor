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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/platform/configuration/common/configuration", "vs/workbench/services/statusbar/common/statusbar"], function (require, exports, nls, lifecycle_1, debug_1, configuration_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugStatusContribution = void 0;
    let DebugStatusContribution = class DebugStatusContribution {
        constructor(statusBarService, debugService, configurationService) {
            this.statusBarService = statusBarService;
            this.debugService = debugService;
            this.configurationService = configurationService;
            this.toDispose = [];
            const addStatusBarEntry = () => {
                this.entryAccessor = this.statusBarService.addEntry(this.entry, 'status.debug', nls.localize('status.debug', "Debug"), 0 /* LEFT */, 30 /* Low Priority */);
            };
            const setShowInStatusBar = () => {
                this.showInStatusBar = configurationService.getValue('debug').showInStatusBar;
                if (this.showInStatusBar === 'always' && !this.entryAccessor) {
                    addStatusBarEntry();
                }
            };
            setShowInStatusBar();
            this.toDispose.push(this.debugService.onDidChangeState(state => {
                if (state !== 0 /* Inactive */ && this.showInStatusBar === 'onFirstSessionStart' && !this.entryAccessor) {
                    addStatusBarEntry();
                }
            }));
            this.toDispose.push(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.showInStatusBar')) {
                    setShowInStatusBar();
                    if (this.entryAccessor && this.showInStatusBar === 'never') {
                        this.entryAccessor.dispose();
                        this.entryAccessor = undefined;
                    }
                }
            }));
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(e => {
                if (this.entryAccessor) {
                    this.entryAccessor.update(this.entry);
                }
            }));
        }
        get entry() {
            let text = '';
            const manager = this.debugService.getConfigurationManager();
            const name = manager.selectedConfiguration.name || '';
            const nameAndLaunchPresent = name && manager.selectedConfiguration.launch;
            if (nameAndLaunchPresent) {
                text = (manager.getLaunches().length > 1 ? `${name} (${manager.selectedConfiguration.launch.name})` : name);
            }
            return {
                text: '$(play) ' + text,
                ariaLabel: nls.localize('debugTarget', "Debug: {0}", text),
                tooltip: nls.localize('selectAndStartDebug', "Select and start debug configuration"),
                command: 'workbench.action.debug.selectandstart'
            };
        }
        dispose() {
            if (this.entryAccessor) {
                this.entryAccessor.dispose();
            }
            lifecycle_1.dispose(this.toDispose);
        }
    };
    DebugStatusContribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService)
    ], DebugStatusContribution);
    exports.DebugStatusContribution = DebugStatusContribution;
});
//# __sourceMappingURL=debugStatus.js.map