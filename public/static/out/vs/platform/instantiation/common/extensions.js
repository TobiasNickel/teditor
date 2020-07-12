/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./descriptors"], function (require, exports, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSingletonServiceDescriptors = exports.registerSingleton = void 0;
    const _registry = [];
    function registerSingleton(id, ctor, supportsDelayedInstantiation) {
        _registry.push([id, new descriptors_1.SyncDescriptor(ctor, [], supportsDelayedInstantiation)]);
    }
    exports.registerSingleton = registerSingleton;
    function getSingletonServiceDescriptors() {
        return _registry;
    }
    exports.getSingletonServiceDescriptors = getSingletonServiceDescriptors;
});
//# __sourceMappingURL=extensions.js.map