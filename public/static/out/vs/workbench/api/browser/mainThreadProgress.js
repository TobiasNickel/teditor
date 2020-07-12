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
define(["require", "exports", "vs/platform/progress/common/progress", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/actions", "vs/platform/commands/common/commands", "vs/nls"], function (require, exports, progress_1, extHost_protocol_1, extHostCustomers_1, actions_1, commands_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadProgress = void 0;
    class ManageExtensionAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id.value, label, undefined, true, () => {
                return commandService.executeCommand('_extensions.manage', id.value);
            });
        }
    }
    let MainThreadProgress = class MainThreadProgress {
        constructor(extHostContext, progressService, _commandService) {
            this._commandService = _commandService;
            this._progress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostProgress);
            this._progressService = progressService;
        }
        dispose() {
            this._progress.forEach(handle => handle.resolve());
            this._progress.clear();
        }
        $startProgress(handle, options, extension) {
            const task = this._createTask(handle);
            if (options.location === 15 /* Notification */ && extension && !extension.isUnderDevelopment) {
                const notificationOptions = Object.assign(Object.assign({}, options), { location: 15 /* Notification */, secondaryActions: [new ManageExtensionAction(extension.identifier, nls_1.localize('manageExtension', "Manage Extension"), this._commandService)] });
                options = notificationOptions;
            }
            this._progressService.withProgress(options, task, () => this._proxy.$acceptProgressCanceled(handle));
        }
        $progressReport(handle, message) {
            const entry = this._progress.get(handle);
            if (entry) {
                entry.progress.report(message);
            }
        }
        $progressEnd(handle) {
            const entry = this._progress.get(handle);
            if (entry) {
                entry.resolve();
                this._progress.delete(handle);
            }
        }
        _createTask(handle) {
            return (progress) => {
                return new Promise(resolve => {
                    this._progress.set(handle, { resolve, progress });
                });
            };
        }
    };
    MainThreadProgress = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadProgress),
        __param(1, progress_1.IProgressService),
        __param(2, commands_1.ICommandService)
    ], MainThreadProgress);
    exports.MainThreadProgress = MainThreadProgress;
});
//# __sourceMappingURL=mainThreadProgress.js.map