/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedKeyboardMapper = void 0;
    class CachedKeyboardMapper {
        constructor(actual) {
            this._actual = actual;
            this._cache = new Map();
        }
        dumpDebugInfo() {
            return this._actual.dumpDebugInfo();
        }
        resolveKeybinding(keybinding) {
            const hashCode = keybinding.getHashCode();
            const resolved = this._cache.get(hashCode);
            if (!resolved) {
                const r = this._actual.resolveKeybinding(keybinding);
                this._cache.set(hashCode, r);
                return r;
            }
            return resolved;
        }
        resolveKeyboardEvent(keyboardEvent) {
            return this._actual.resolveKeyboardEvent(keyboardEvent);
        }
        resolveUserBinding(parts) {
            return this._actual.resolveUserBinding(parts);
        }
    }
    exports.CachedKeyboardMapper = CachedKeyboardMapper;
});
//# __sourceMappingURL=keyboardMapper.js.map