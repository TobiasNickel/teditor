/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/arrays"], function (require, exports, extensions_1, extensionsRegistry_1, extensionManagementUtil_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getExtensionKind = exports.canExecuteOnWeb = exports.canExecuteOnWorkspace = exports.canExecuteOnUI = exports.prefersExecuteOnWeb = exports.prefersExecuteOnWorkspace = exports.prefersExecuteOnUI = void 0;
    function prefersExecuteOnUI(manifest, productService, configurationService) {
        const extensionKind = getExtensionKind(manifest, productService, configurationService);
        return (extensionKind.length > 0 && extensionKind[0] === 'ui');
    }
    exports.prefersExecuteOnUI = prefersExecuteOnUI;
    function prefersExecuteOnWorkspace(manifest, productService, configurationService) {
        const extensionKind = getExtensionKind(manifest, productService, configurationService);
        return (extensionKind.length > 0 && extensionKind[0] === 'workspace');
    }
    exports.prefersExecuteOnWorkspace = prefersExecuteOnWorkspace;
    function prefersExecuteOnWeb(manifest, productService, configurationService) {
        const extensionKind = getExtensionKind(manifest, productService, configurationService);
        return (extensionKind.length > 0 && extensionKind[0] === 'web');
    }
    exports.prefersExecuteOnWeb = prefersExecuteOnWeb;
    function canExecuteOnUI(manifest, productService, configurationService) {
        const extensionKind = getExtensionKind(manifest, productService, configurationService);
        return extensionKind.some(kind => kind === 'ui');
    }
    exports.canExecuteOnUI = canExecuteOnUI;
    function canExecuteOnWorkspace(manifest, productService, configurationService) {
        const extensionKind = getExtensionKind(manifest, productService, configurationService);
        return extensionKind.some(kind => kind === 'workspace');
    }
    exports.canExecuteOnWorkspace = canExecuteOnWorkspace;
    function canExecuteOnWeb(manifest, productService, configurationService) {
        const extensionKind = getExtensionKind(manifest, productService, configurationService);
        return extensionKind.some(kind => kind === 'web');
    }
    exports.canExecuteOnWeb = canExecuteOnWeb;
    function getExtensionKind(manifest, productService, configurationService) {
        // check in config
        let result = getConfiguredExtensionKind(manifest, configurationService);
        if (typeof result !== 'undefined') {
            return toArray(result);
        }
        // check product.json
        result = getProductExtensionKind(manifest, productService);
        if (typeof result !== 'undefined') {
            return result;
        }
        // check the manifest itself
        result = manifest.extensionKind;
        if (typeof result !== 'undefined') {
            return toArray(result);
        }
        // Not an UI extension if it has main
        if (manifest.main) {
            return ['workspace'];
        }
        // Not an UI extension if it has dependencies or an extension pack
        if (arrays_1.isNonEmptyArray(manifest.extensionDependencies) || arrays_1.isNonEmptyArray(manifest.extensionPack)) {
            return ['workspace'];
        }
        if (manifest.contributes) {
            // Not an UI extension if it has no ui contributions
            for (const contribution of Object.keys(manifest.contributes)) {
                if (!isUIExtensionPoint(contribution)) {
                    return ['workspace'];
                }
            }
        }
        return ['ui', 'workspace'];
    }
    exports.getExtensionKind = getExtensionKind;
    let _uiExtensionPoints = null;
    function isUIExtensionPoint(extensionPoint) {
        if (_uiExtensionPoints === null) {
            const uiExtensionPoints = new Set();
            extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints().filter(e => e.defaultExtensionKind !== 'workspace').forEach(e => {
                uiExtensionPoints.add(e.name);
            });
            _uiExtensionPoints = uiExtensionPoints;
        }
        return _uiExtensionPoints.has(extensionPoint);
    }
    let _productExtensionKindsMap = null;
    function getProductExtensionKind(manifest, productService) {
        if (_productExtensionKindsMap === null) {
            const productExtensionKindsMap = new Map();
            if (productService.extensionKind) {
                for (const id of Object.keys(productService.extensionKind)) {
                    productExtensionKindsMap.set(extensions_1.ExtensionIdentifier.toKey(id), productService.extensionKind[id]);
                }
            }
            _productExtensionKindsMap = productExtensionKindsMap;
        }
        const extensionId = extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name);
        return _productExtensionKindsMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
    }
    let _configuredExtensionKindsMap = null;
    function getConfiguredExtensionKind(manifest, configurationService) {
        if (_configuredExtensionKindsMap === null) {
            const configuredExtensionKindsMap = new Map();
            const configuredExtensionKinds = configurationService.getValue('remote.extensionKind') || {};
            for (const id of Object.keys(configuredExtensionKinds)) {
                configuredExtensionKindsMap.set(extensions_1.ExtensionIdentifier.toKey(id), configuredExtensionKinds[id]);
            }
            _configuredExtensionKindsMap = configuredExtensionKindsMap;
        }
        const extensionId = extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name);
        return _configuredExtensionKindsMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
    }
    function toArray(extensionKind) {
        if (Array.isArray(extensionKind)) {
            return extensionKind;
        }
        return extensionKind === 'ui' ? ['ui', 'workspace'] : [extensionKind];
    }
});
//# __sourceMappingURL=extensionsUtil.js.map