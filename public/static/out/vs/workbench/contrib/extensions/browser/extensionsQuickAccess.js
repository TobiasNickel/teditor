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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/nls", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/platform/log/common/log"], function (require, exports, pickerQuickAccess_1, nls_1, viewlet_1, extensions_1, extensionManagement_1, notification_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageExtensionsQuickAccessProvider = exports.InstallExtensionQuickAccessProvider = void 0;
    let InstallExtensionQuickAccessProvider = class InstallExtensionQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(viewletService, galleryService, extensionsService, notificationService, logService) {
            super(InstallExtensionQuickAccessProvider.PREFIX);
            this.viewletService = viewletService;
            this.galleryService = galleryService;
            this.extensionsService = extensionsService;
            this.notificationService = notificationService;
            this.logService = logService;
        }
        getPicks(filter, disposables, token) {
            // Nothing typed
            if (!filter) {
                return [{
                        label: nls_1.localize('type', "Type an extension name to install or search.")
                    }];
            }
            const genericSearchPickItem = {
                label: nls_1.localize('searchFor', "Press Enter to search for extension '{0}'.", filter),
                accept: () => this.searchExtension(filter)
            };
            // Extension ID typed: try to find it
            if (/\./.test(filter)) {
                return this.getPicksForExtensionId(filter, genericSearchPickItem, token);
            }
            // Extension name typed: offer to search it
            return [genericSearchPickItem];
        }
        async getPicksForExtensionId(filter, fallback, token) {
            try {
                const galleryResult = await this.galleryService.query({ names: [filter], pageSize: 1 }, token);
                if (token.isCancellationRequested) {
                    return []; // return early if canceled
                }
                const galleryExtension = galleryResult.firstPage[0];
                if (!galleryExtension) {
                    return [fallback];
                }
                return [{
                        label: nls_1.localize('install', "Press Enter to install extension '{0}'.", filter),
                        accept: () => this.installExtension(galleryExtension, filter)
                    }];
            }
            catch (error) {
                if (token.isCancellationRequested) {
                    return []; // expected error
                }
                this.logService.error(error);
                return [fallback];
            }
        }
        async installExtension(extension, name) {
            try {
                await openExtensionsViewlet(this.viewletService, `@id:${name}`);
                await this.extensionsService.installFromGallery(extension);
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
        async searchExtension(name) {
            openExtensionsViewlet(this.viewletService, name);
        }
    };
    InstallExtensionQuickAccessProvider.PREFIX = 'ext install ';
    InstallExtensionQuickAccessProvider = __decorate([
        __param(0, viewlet_1.IViewletService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService)
    ], InstallExtensionQuickAccessProvider);
    exports.InstallExtensionQuickAccessProvider = InstallExtensionQuickAccessProvider;
    let ManageExtensionsQuickAccessProvider = class ManageExtensionsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(viewletService) {
            super(ManageExtensionsQuickAccessProvider.PREFIX);
            this.viewletService = viewletService;
        }
        getPicks() {
            return [{
                    label: nls_1.localize('manage', "Press Enter to manage your extensions."),
                    accept: () => openExtensionsViewlet(this.viewletService)
                }];
        }
    };
    ManageExtensionsQuickAccessProvider.PREFIX = 'ext ';
    ManageExtensionsQuickAccessProvider = __decorate([
        __param(0, viewlet_1.IViewletService)
    ], ManageExtensionsQuickAccessProvider);
    exports.ManageExtensionsQuickAccessProvider = ManageExtensionsQuickAccessProvider;
    async function openExtensionsViewlet(viewletService, search = '') {
        const viewlet = await viewletService.openViewlet(extensions_1.VIEWLET_ID, true);
        const view = viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer();
        view === null || view === void 0 ? void 0 : view.search(search);
        view === null || view === void 0 ? void 0 : view.focus();
    }
});
//# __sourceMappingURL=extensionsQuickAccess.js.map