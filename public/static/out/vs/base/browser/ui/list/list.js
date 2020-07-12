/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedListVirtualDelegate = exports.ListError = exports.ListDragOverReactions = exports.ListDragOverEffect = void 0;
    var ListDragOverEffect;
    (function (ListDragOverEffect) {
        ListDragOverEffect[ListDragOverEffect["Copy"] = 0] = "Copy";
        ListDragOverEffect[ListDragOverEffect["Move"] = 1] = "Move";
    })(ListDragOverEffect = exports.ListDragOverEffect || (exports.ListDragOverEffect = {}));
    exports.ListDragOverReactions = {
        reject() { return { accept: false }; },
        accept() { return { accept: true }; },
    };
    class ListError extends Error {
        constructor(user, message) {
            super(`ListError [${user}] ${message}`);
        }
    }
    exports.ListError = ListError;
    class CachedListVirtualDelegate {
        constructor() {
            this.cache = new WeakMap();
        }
        getHeight(element) {
            var _a;
            return (_a = this.cache.get(element)) !== null && _a !== void 0 ? _a : this.estimateHeight(element);
        }
        setDynamicHeight(element, height) {
            if (height > 0) {
                this.cache.set(element, height);
            }
        }
    }
    exports.CachedListVirtualDelegate = CachedListVirtualDelegate;
});
//# __sourceMappingURL=list.js.map