/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WeakMapper = exports.TreeError = exports.TreeDragOverReactions = exports.TreeDragOverBubble = exports.TreeMouseEventTarget = exports.TreeVisibility = void 0;
    var TreeVisibility;
    (function (TreeVisibility) {
        /**
         * The tree node should be hidden.
         */
        TreeVisibility[TreeVisibility["Hidden"] = 0] = "Hidden";
        /**
         * The tree node should be visible.
         */
        TreeVisibility[TreeVisibility["Visible"] = 1] = "Visible";
        /**
         * The tree node should be visible if any of its descendants is visible.
         */
        TreeVisibility[TreeVisibility["Recurse"] = 2] = "Recurse";
    })(TreeVisibility = exports.TreeVisibility || (exports.TreeVisibility = {}));
    var TreeMouseEventTarget;
    (function (TreeMouseEventTarget) {
        TreeMouseEventTarget[TreeMouseEventTarget["Unknown"] = 0] = "Unknown";
        TreeMouseEventTarget[TreeMouseEventTarget["Twistie"] = 1] = "Twistie";
        TreeMouseEventTarget[TreeMouseEventTarget["Element"] = 2] = "Element";
    })(TreeMouseEventTarget = exports.TreeMouseEventTarget || (exports.TreeMouseEventTarget = {}));
    var TreeDragOverBubble;
    (function (TreeDragOverBubble) {
        TreeDragOverBubble[TreeDragOverBubble["Down"] = 0] = "Down";
        TreeDragOverBubble[TreeDragOverBubble["Up"] = 1] = "Up";
    })(TreeDragOverBubble = exports.TreeDragOverBubble || (exports.TreeDragOverBubble = {}));
    exports.TreeDragOverReactions = {
        acceptBubbleUp() { return { accept: true, bubble: 1 /* Up */ }; },
        acceptBubbleDown(autoExpand = false) { return { accept: true, bubble: 0 /* Down */, autoExpand }; },
        acceptCopyBubbleUp() { return { accept: true, bubble: 1 /* Up */, effect: 0 /* Copy */ }; },
        acceptCopyBubbleDown(autoExpand = false) { return { accept: true, bubble: 0 /* Down */, effect: 0 /* Copy */, autoExpand }; }
    };
    class TreeError extends Error {
        constructor(user, message) {
            super(`TreeError [${user}] ${message}`);
        }
    }
    exports.TreeError = TreeError;
    class WeakMapper {
        constructor(fn) {
            this.fn = fn;
            this._map = new WeakMap();
        }
        map(key) {
            let result = this._map.get(key);
            if (!result) {
                result = this.fn(key);
                this._map.set(key, result);
            }
            return result;
        }
    }
    exports.WeakMapper = WeakMapper;
});
//# __sourceMappingURL=tree.js.map