/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/amd", "vs/base/common/process"], function (require, exports, platform_1, path, amd_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let product;
    // Web
    if (platform_1.isWeb) {
        // Built time configuration (do NOT modify)
        product = { /*BUILD->INSERT_PRODUCT_CONFIGURATION*/};
        // Running out of sources
        if (Object.keys(product).length === 0) {
            Object.assign(product, {
                version: '1.47.0-dev',
                nameLong: 'Visual Studio Code Web Dev',
                nameShort: 'VSCode Web Dev',
                urlProtocol: 'code-oss'
            });
        }
    }
    // Node: AMD loader
    else if (typeof require !== 'undefined' && typeof require.__$__nodeRequire === 'function') {
        // Obtain values from product.json and package.json
        const rootPath = path.dirname(amd_1.getPathFromAmdModule(require, ''));
        product = require.__$__nodeRequire(path.join(rootPath, 'product.json'));
        const pkg = require.__$__nodeRequire(path.join(rootPath, 'package.json'));
        // Running out of sources
        if (process_1.env['VSCODE_DEV']) {
            Object.assign(product, {
                nameShort: `${product.nameShort} Dev`,
                nameLong: `${product.nameLong} Dev`,
                dataFolderName: `${product.dataFolderName}-dev`
            });
        }
        Object.assign(product, {
            version: pkg.version
        });
    }
    // Unknown
    else {
        throw new Error('Unable to resolve product configuration');
    }
    exports.default = product;
});
//# __sourceMappingURL=product.js.map