/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deserializeEnvironmentVariableCollection = exports.serializeEnvironmentVariableCollection = void 0;
    // This file is shared between the renderer and extension host
    function serializeEnvironmentVariableCollection(collection) {
        return [...collection.entries()];
    }
    exports.serializeEnvironmentVariableCollection = serializeEnvironmentVariableCollection;
    function deserializeEnvironmentVariableCollection(serializedCollection) {
        return new Map(serializedCollection);
    }
    exports.deserializeEnvironmentVariableCollection = deserializeEnvironmentVariableCollection;
});
//# __sourceMappingURL=environmentVariableShared.js.map