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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/platform/commands/common/commands", "vs/base/common/lifecycle"], function (require, exports, nls, actions_1, extHost_protocol_1, extHostCustomers_1, dialogs_1, notification_1, event_1, commands_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadMessageService = void 0;
    let MainThreadMessageService = class MainThreadMessageService {
        constructor(extHostContext, _notificationService, _commandService, _dialogService) {
            this._notificationService = _notificationService;
            this._commandService = _commandService;
            this._dialogService = _dialogService;
            //
        }
        dispose() {
            //
        }
        $showMessage(severity, message, options, commands) {
            if (options.modal) {
                return this._showModalMessage(severity, message, commands);
            }
            else {
                return this._showMessage(severity, message, commands, options.extension);
            }
        }
        _showMessage(severity, message, commands, extension) {
            return new Promise(resolve => {
                const primaryActions = [];
                class MessageItemAction extends actions_1.Action {
                    constructor(id, label, handle) {
                        super(id, label, undefined, true, () => {
                            resolve(handle);
                            return Promise.resolve();
                        });
                    }
                }
                class ManageExtensionAction extends actions_1.Action {
                    constructor(id, label, commandService) {
                        super(id.value, label, undefined, true, () => {
                            return commandService.executeCommand('_extensions.manage', id.value);
                        });
                    }
                }
                commands.forEach(command => {
                    primaryActions.push(new MessageItemAction('_extension_message_handle_' + command.handle, command.title, command.handle));
                });
                let source;
                if (extension) {
                    source = nls.localize('extensionSource', "{0} (Extension)", extension.displayName || extension.name);
                }
                if (!source) {
                    source = nls.localize('defaultSource', "Extension");
                }
                const secondaryActions = [];
                if (extension && !extension.isUnderDevelopment) {
                    secondaryActions.push(new ManageExtensionAction(extension.identifier, nls.localize('manageExtension', "Manage Extension"), this._commandService));
                }
                const messageHandle = this._notificationService.notify({
                    severity,
                    message,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    source
                });
                // if promise has not been resolved yet, now is the time to ensure a return value
                // otherwise if already resolved it means the user clicked one of the buttons
                event_1.Event.once(messageHandle.onDidClose)(() => {
                    lifecycle_1.dispose(primaryActions);
                    lifecycle_1.dispose(secondaryActions);
                    resolve(undefined);
                });
            });
        }
        async _showModalMessage(severity, message, commands) {
            let cancelId = undefined;
            const buttons = commands.map((command, index) => {
                if (command.isCloseAffordance === true) {
                    cancelId = index;
                }
                return command.title;
            });
            if (cancelId === undefined) {
                if (buttons.length > 0) {
                    buttons.push(nls.localize('cancel', "Cancel"));
                }
                else {
                    buttons.push(nls.localize('ok', "OK"));
                }
                cancelId = buttons.length - 1;
            }
            const { choice } = await this._dialogService.show(severity, message, buttons, { cancelId });
            return choice === commands.length ? undefined : commands[choice].handle;
        }
    };
    MainThreadMessageService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadMessageService),
        __param(1, notification_1.INotificationService),
        __param(2, commands_1.ICommandService),
        __param(3, dialogs_1.IDialogService)
    ], MainThreadMessageService);
    exports.MainThreadMessageService = MainThreadMessageService;
});
//# __sourceMappingURL=mainThreadMessageService.js.map