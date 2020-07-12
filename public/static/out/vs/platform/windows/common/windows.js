/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTitleBarStyle = exports.getMenuBarVisibility = exports.isFileToOpen = exports.isFolderToOpen = exports.isWorkspaceToOpen = void 0;
    function isWorkspaceToOpen(uriToOpen) {
        return !!uriToOpen.workspaceUri;
    }
    exports.isWorkspaceToOpen = isWorkspaceToOpen;
    function isFolderToOpen(uriToOpen) {
        return !!uriToOpen.folderUri;
    }
    exports.isFolderToOpen = isFolderToOpen;
    function isFileToOpen(uriToOpen) {
        return !!uriToOpen.fileUri;
    }
    exports.isFileToOpen = isFileToOpen;
    function getMenuBarVisibility(configurationService, environment, isExtensionDevelopment = environment.isExtensionDevelopment) {
        const titleBarStyle = getTitleBarStyle(configurationService, environment, isExtensionDevelopment);
        const menuBarVisibility = configurationService.getValue('window.menuBarVisibility');
        if (titleBarStyle === 'native' && menuBarVisibility === 'compact') {
            return 'default';
        }
        else {
            return menuBarVisibility;
        }
    }
    exports.getMenuBarVisibility = getMenuBarVisibility;
    function getTitleBarStyle(configurationService, environment, isExtensionDevelopment = environment.isExtensionDevelopment) {
        if (platform_1.isWeb) {
            return 'custom';
        }
        const configuration = configurationService.getValue('window');
        const isDev = !environment.isBuilt || isExtensionDevelopment;
        if (platform_1.isMacintosh && isDev) {
            return 'native'; // not enabled when developing due to https://github.com/electron/electron/issues/3647
        }
        if (configuration) {
            const useNativeTabs = platform_1.isMacintosh && configuration.nativeTabs === true;
            if (useNativeTabs) {
                return 'native'; // native tabs on sierra do not work with custom title style
            }
            const useSimpleFullScreen = platform_1.isMacintosh && configuration.nativeFullScreen === false;
            if (useSimpleFullScreen) {
                return 'native'; // simple fullscreen does not work well with custom title style (https://github.com/Microsoft/vscode/issues/63291)
            }
            const style = configuration.titleBarStyle;
            if (style === 'native' || style === 'custom') {
                return style;
            }
        }
        return platform_1.isLinux ? 'native' : 'custom'; // default to custom on all macOS and Windows
    }
    exports.getTitleBarStyle = getTitleBarStyle;
});
//# __sourceMappingURL=windows.js.map