/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/product/common/product"], function (require, exports, uri_1, async_1, lifecycle_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeURLService = exports.AbstractURLService = void 0;
    class AbstractURLService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.handlers = new Set();
        }
        open(uri, options) {
            const handlers = [...this.handlers.values()];
            return async_1.first(handlers.map(h => () => h.handleURL(uri, options)), undefined, false).then(val => val || false);
        }
        registerHandler(handler) {
            this.handlers.add(handler);
            return lifecycle_1.toDisposable(() => this.handlers.delete(handler));
        }
    }
    exports.AbstractURLService = AbstractURLService;
    class NativeURLService extends AbstractURLService {
        create(options) {
            let { authority, path, query, fragment } = options ? options : { authority: undefined, path: undefined, query: undefined, fragment: undefined };
            if (authority && path && path.indexOf('/') !== 0) {
                path = `/${path}`; // URI validation requires a path if there is an authority
            }
            return uri_1.URI.from({ scheme: product_1.default.urlProtocol, authority, path, query, fragment });
        }
    }
    exports.NativeURLService = NativeURLService;
});
//# __sourceMappingURL=urlService.js.map