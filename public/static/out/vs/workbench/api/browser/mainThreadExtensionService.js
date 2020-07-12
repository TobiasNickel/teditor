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
define(["require", "exports", "vs/base/common/severity", "vs/workbench/api/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/nls", "vs/base/common/actions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/cancellation"], function (require, exports, severity_1, extHostCustomers_1, extHost_protocol_1, extensions_1, notification_1, nls_1, actions_1, extensionManagement_1, extensionManagementUtil_1, host_1, extensions_2, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadExtensionService = void 0;
    let MainThreadExtensionService = class MainThreadExtensionService {
        constructor(extHostContext, extensionService, notificationService, extensionsWorkbenchService, hostService, extensionEnablementService) {
            this._extensionService = extensionService;
            this._notificationService = notificationService;
            this._extensionsWorkbenchService = extensionsWorkbenchService;
            this._hostService = hostService;
            this._extensionEnablementService = extensionEnablementService;
        }
        dispose() {
        }
        $activateExtension(extensionId, reason) {
            return this._extensionService._activateById(extensionId, reason);
        }
        $onWillActivateExtension(extensionId) {
            this._extensionService._onWillActivateExtension(extensionId);
        }
        $onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            this._extensionService._onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason);
        }
        $onExtensionRuntimeError(extensionId, data) {
            const error = new Error();
            error.name = data.name;
            error.message = data.message;
            error.stack = data.stack;
            this._extensionService._onExtensionRuntimeError(extensionId, error);
            console.error(`[${extensionId}]${error.message}`);
            console.error(error.stack);
        }
        async $onExtensionActivationError(extensionId, activationError) {
            if (typeof activationError === 'string') {
                this._extensionService._logOrShowMessage(severity_1.default.Error, activationError);
            }
            else {
                this._handleMissingDependency(extensionId, activationError.dependency);
            }
        }
        async _handleMissingDependency(extensionId, missingDependency) {
            const extension = await this._extensionService.getExtension(extensionId.value);
            if (extension) {
                const local = await this._extensionsWorkbenchService.queryLocal();
                const installedDependency = local.filter(i => extensionManagementUtil_1.areSameExtensions(i.identifier, { id: missingDependency }))[0];
                if (installedDependency) {
                    await this._handleMissingInstalledDependency(extension, installedDependency.local);
                }
                else {
                    await this._handleMissingNotInstalledDependency(extension, missingDependency);
                }
            }
        }
        async _handleMissingInstalledDependency(extension, missingInstalledDependency) {
            const extName = extension.displayName || extension.name;
            if (this._extensionEnablementService.isEnabled(missingInstalledDependency)) {
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: nls_1.localize('reload window', "Cannot activate the '{0}' extension because it depends on the '{1}' extension, which is not loaded. Would you like to reload the window to load the extension?", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    actions: {
                        primary: [new actions_1.Action('reload', nls_1.localize('reload', "Reload Window"), '', true, () => this._hostService.reload())]
                    }
                });
            }
            else {
                const enablementState = this._extensionEnablementService.getEnablementState(missingInstalledDependency);
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: nls_1.localize('disabledDep', "Cannot activate the '{0}' extension because it depends on the '{1}' extension, which is disabled. Would you like to enable the extension and reload the window?", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    actions: {
                        primary: [new actions_1.Action('enable', nls_1.localize('enable dep', "Enable and Reload"), '', true, () => this._extensionEnablementService.setEnablement([missingInstalledDependency], enablementState === 2 /* DisabledGlobally */ ? 4 /* EnabledGlobally */ : 5 /* EnabledWorkspace */)
                                .then(() => this._hostService.reload(), e => this._notificationService.error(e)))]
                    }
                });
            }
        }
        async _handleMissingNotInstalledDependency(extension, missingDependency) {
            const extName = extension.displayName || extension.name;
            const dependencyExtension = (await this._extensionsWorkbenchService.queryGallery({ names: [missingDependency] }, cancellation_1.CancellationToken.None)).firstPage[0];
            if (dependencyExtension) {
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: nls_1.localize('uninstalledDep', "Cannot activate the '{0}' extension because it depends on the '{1}' extension, which is not installed. Would you like to install the extension and reload the window?", extName, dependencyExtension.displayName),
                    actions: {
                        primary: [new actions_1.Action('install', nls_1.localize('install missing dep', "Install and Reload"), '', true, () => this._extensionsWorkbenchService.install(dependencyExtension)
                                .then(() => this._hostService.reload(), e => this._notificationService.error(e)))]
                    }
                });
            }
            else {
                this._notificationService.error(nls_1.localize('unknownDep', "Cannot activate the '{0}' extension because it depends on an unknown '{1}' extension .", extName, missingDependency));
            }
        }
        $onExtensionHostExit(code) {
            this._extensionService._onExtensionHostExit(code);
        }
    };
    MainThreadExtensionService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadExtensionService),
        __param(1, extensions_1.IExtensionService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_2.IExtensionsWorkbenchService),
        __param(4, host_1.IHostService),
        __param(5, extensionManagement_1.IWorkbenchExtensionEnablementService)
    ], MainThreadExtensionService);
    exports.MainThreadExtensionService = MainThreadExtensionService;
});
//# __sourceMappingURL=mainThreadExtensionService.js.map