/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/driver/browser/baseDriver"], function (require, exports, lifecycle_1, baseDriver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerWindowDriver = void 0;
    class BrowserWindowDriver extends baseDriver_1.BaseWindowDriver {
        click(selector, xoffset, yoffset) {
            throw new Error('Method not implemented.');
        }
        doubleClick(selector) {
            throw new Error('Method not implemented.');
        }
        openDevTools() {
            throw new Error('Method not implemented.');
        }
    }
    async function registerWindowDriver() {
        window.driver = new BrowserWindowDriver();
        return lifecycle_1.Disposable.None;
    }
    exports.registerWindowDriver = registerWindowDriver;
});
//# __sourceMappingURL=driver.js.map