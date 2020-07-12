/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSyncDescriptor = exports.SyncDescriptor = void 0;
    class SyncDescriptor {
        constructor(ctor, staticArguments = [], supportsDelayedInstantiation = false) {
            this.ctor = ctor;
            this.staticArguments = staticArguments;
            this.supportsDelayedInstantiation = supportsDelayedInstantiation;
        }
    }
    exports.SyncDescriptor = SyncDescriptor;
    exports.createSyncDescriptor = (ctor, ...staticArguments) => {
        return new SyncDescriptor(ctor, staticArguments);
    };
});
//# __sourceMappingURL=descriptors.js.map