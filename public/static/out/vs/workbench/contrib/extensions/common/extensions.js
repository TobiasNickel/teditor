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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, instantiation_1, lifecycle_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = exports.ExtensionContainers = exports.CloseExtensionDetailsOnViewChangeKey = exports.ShowRecommendationsOnlyOnDemandKey = exports.AutoCheckUpdatesConfigurationKey = exports.AutoUpdateConfigurationKey = exports.ConfigurationKey = exports.IExtensionsWorkbenchService = exports.SERVICE_ID = exports.ExtensionState = exports.EXTENSIONS_CONFIG = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.extensions';
    exports.EXTENSIONS_CONFIG = '.vscode/extensions.json';
    var ExtensionState;
    (function (ExtensionState) {
        ExtensionState[ExtensionState["Installing"] = 0] = "Installing";
        ExtensionState[ExtensionState["Installed"] = 1] = "Installed";
        ExtensionState[ExtensionState["Uninstalling"] = 2] = "Uninstalling";
        ExtensionState[ExtensionState["Uninstalled"] = 3] = "Uninstalled";
    })(ExtensionState = exports.ExtensionState || (exports.ExtensionState = {}));
    exports.SERVICE_ID = 'extensionsWorkbenchService';
    exports.IExtensionsWorkbenchService = instantiation_1.createDecorator(exports.SERVICE_ID);
    exports.ConfigurationKey = 'extensions';
    exports.AutoUpdateConfigurationKey = 'extensions.autoUpdate';
    exports.AutoCheckUpdatesConfigurationKey = 'extensions.autoCheckUpdates';
    exports.ShowRecommendationsOnlyOnDemandKey = 'extensions.showRecommendationsOnlyOnDemand';
    exports.CloseExtensionDetailsOnViewChangeKey = 'extensions.closeExtensionDetailsOnViewChange';
    let ExtensionContainers = class ExtensionContainers extends lifecycle_1.Disposable {
        constructor(containers, extensionsWorkbenchService) {
            super();
            this.containers = containers;
            this._register(extensionsWorkbenchService.onChange(this.update, this));
        }
        set extension(extension) {
            this.containers.forEach(c => c.extension = extension);
        }
        update(extension) {
            for (const container of this.containers) {
                if (extension && container.extension) {
                    if (extensionManagementUtil_1.areSameExtensions(container.extension.identifier, extension.identifier)) {
                        if (!container.extension.server || !extension.server || container.extension.server === extension.server) {
                            container.extension = extension;
                        }
                        else if (container.updateWhenCounterExtensionChanges) {
                            container.update();
                        }
                    }
                }
                else {
                    container.update();
                }
            }
        }
    };
    ExtensionContainers = __decorate([
        __param(1, exports.IExtensionsWorkbenchService)
    ], ExtensionContainers);
    exports.ExtensionContainers = ExtensionContainers;
    exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = 'workbench.extensions.action.toggleIgnoreExtension';
});
//# __sourceMappingURL=extensions.js.map