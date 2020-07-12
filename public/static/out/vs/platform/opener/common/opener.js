/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/strings"], function (require, exports, uri_1, instantiation_1, lifecycle_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.matchesScheme = exports.NullOpenerService = exports.IOpenerService = void 0;
    exports.IOpenerService = instantiation_1.createDecorator('openerService');
    exports.NullOpenerService = Object.freeze({
        _serviceBrand: undefined,
        registerOpener() { return lifecycle_1.Disposable.None; },
        registerValidator() { return lifecycle_1.Disposable.None; },
        registerExternalUriResolver() { return lifecycle_1.Disposable.None; },
        setExternalOpener() { },
        async open() { return false; },
        async resolveExternalUri(uri) { return { resolved: uri, dispose() { } }; },
    });
    function matchesScheme(target, scheme) {
        if (uri_1.URI.isUri(target)) {
            return strings_1.equalsIgnoreCase(target.scheme, scheme);
        }
        else {
            return strings_1.startsWithIgnoreCase(target, scheme + ':');
        }
    }
    exports.matchesScheme = matchesScheme;
});
//# __sourceMappingURL=opener.js.map