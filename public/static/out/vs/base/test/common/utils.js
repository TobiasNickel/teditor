/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/platform"], function (require, exports, path_1, uri_1, errors_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testRepeatOnly = exports.testRepeat = exports.suiteRepeat = exports.toResource = exports.DeferredPromise = void 0;
    class DeferredPromise {
        constructor() {
            this.p = new Promise((c, e) => {
                this.completeCallback = c;
                this.errorCallback = e;
            });
        }
        complete(value) {
            return new Promise(resolve => {
                this.completeCallback(value);
                resolve();
            });
        }
        error(err) {
            return new Promise(resolve => {
                this.errorCallback(err);
                resolve();
            });
        }
        cancel() {
            new Promise(resolve => {
                this.errorCallback(errors_1.canceled());
                resolve();
            });
        }
    }
    exports.DeferredPromise = DeferredPromise;
    function toResource(path) {
        if (platform_1.isWindows) {
            return uri_1.URI.file(path_1.join('C:\\', btoa(this.test.fullTitle()), path));
        }
        return uri_1.URI.file(path_1.join('/', btoa(this.test.fullTitle()), path));
    }
    exports.toResource = toResource;
    function suiteRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            suite(`${description} (iteration ${i})`, callback);
        }
    }
    exports.suiteRepeat = suiteRepeat;
    function testRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            test(`${description} (iteration ${i})`, callback);
        }
    }
    exports.testRepeat = testRepeat;
    function testRepeatOnly(n, description, callback) {
        suite.only('repeat', () => testRepeat(n, description, callback));
    }
    exports.testRepeatOnly = testRepeatOnly;
});
//# __sourceMappingURL=utils.js.map