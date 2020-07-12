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
define(["require", "exports", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/label/common/label", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsActions"], function (require, exports, commands_1, actions_1, nls_1, lifecycle_1, extensionManagement_1, label_1, instantiation_1, extensionsActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionsInstaller = void 0;
    let RemoteExtensionsInstaller = class RemoteExtensionsInstaller extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, labelService, instantiationService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const installLocalExtensionsInRemoteAction = instantiationService.createInstance(extensionsActions_1.InstallLocalExtensionsInRemoteAction);
                commands_1.CommandsRegistry.registerCommand('workbench.extensions.installLocalExtensions', () => installLocalExtensionsInRemoteAction.run());
                let disposable = lifecycle_1.Disposable.None;
                const appendMenuItem = () => {
                    disposable.dispose();
                    disposable = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                        command: {
                            id: 'workbench.extensions.installLocalExtensions',
                            category: nls_1.localize({ key: 'remote', comment: ['Remote as in remote machine'] }, "Remote"),
                            title: installLocalExtensionsInRemoteAction.label
                        }
                    });
                };
                appendMenuItem();
                this._register(labelService.onDidChangeFormatters(e => appendMenuItem()));
                this._register(lifecycle_1.toDisposable(() => disposable.dispose()));
            }
        }
    };
    RemoteExtensionsInstaller = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService)
    ], RemoteExtensionsInstaller);
    exports.RemoteExtensionsInstaller = RemoteExtensionsInstaller;
});
//# __sourceMappingURL=remoteExtensionsInstaller.js.map