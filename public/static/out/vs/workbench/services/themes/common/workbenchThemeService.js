/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/base/common/types"], function (require, exports, instantiation_1, uri_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionData = exports.ThemeSettings = exports.HC_THEME_ID = exports.VS_HC_THEME = exports.VS_DARK_THEME = exports.VS_LIGHT_THEME = exports.IWorkbenchThemeService = void 0;
    exports.IWorkbenchThemeService = instantiation_1.createDecorator('themeService');
    exports.VS_LIGHT_THEME = 'vs';
    exports.VS_DARK_THEME = 'vs-dark';
    exports.VS_HC_THEME = 'hc-black';
    exports.HC_THEME_ID = 'Default High Contrast';
    var ThemeSettings;
    (function (ThemeSettings) {
        ThemeSettings["COLOR_THEME"] = "workbench.colorTheme";
        ThemeSettings["FILE_ICON_THEME"] = "workbench.iconTheme";
        ThemeSettings["PRODUCT_ICON_THEME"] = "workbench.productIconTheme";
        ThemeSettings["COLOR_CUSTOMIZATIONS"] = "workbench.colorCustomizations";
        ThemeSettings["TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.tokenColorCustomizations";
        ThemeSettings["SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.semanticTokenColorCustomizations";
        ThemeSettings["TOKEN_COLOR_CUSTOMIZATIONS_EXPERIMENTAL"] = "editor.tokenColorCustomizationsExperimental";
        ThemeSettings["PREFERRED_DARK_THEME"] = "workbench.preferredDarkColorTheme";
        ThemeSettings["PREFERRED_LIGHT_THEME"] = "workbench.preferredLightColorTheme";
        ThemeSettings["PREFERRED_HC_THEME"] = "workbench.preferredHighContrastColorTheme";
        ThemeSettings["DETECT_COLOR_SCHEME"] = "window.autoDetectColorScheme";
        ThemeSettings["DETECT_HC"] = "window.autoDetectHighContrast";
    })(ThemeSettings = exports.ThemeSettings || (exports.ThemeSettings = {}));
    var ExtensionData;
    (function (ExtensionData) {
        function toJSONObject(d) {
            return d && { _extensionId: d.extensionId, _extensionIsBuiltin: d.extensionIsBuiltin, _extensionLocation: d.extensionLocation.toJSON(), _extensionName: d.extensionName, _extensionPublisher: d.extensionPublisher };
        }
        ExtensionData.toJSONObject = toJSONObject;
        function fromJSONObject(o) {
            if (o && types_1.isString(o._extensionId) && types_1.isBoolean(o._extensionIsBuiltin) && types_1.isString(o._extensionLocation) && types_1.isString(o._extensionName) && types_1.isString(o._extensionPublisher)) {
                return { extensionId: o._extensionId, extensionIsBuiltin: o._extensionIsBuiltin, extensionLocation: uri_1.URI.revive(o._extensionLocation), extensionName: o._extensionName, extensionPublisher: o._extensionPublisher };
            }
            return undefined;
        }
        ExtensionData.fromJSONObject = fromJSONObject;
    })(ExtensionData = exports.ExtensionData || (exports.ExtensionData = {}));
});
//# __sourceMappingURL=workbenchThemeService.js.map