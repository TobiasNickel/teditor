/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/platform/keybinding/common/baseResolvedKeybinding"], function (require, exports, keyCodes_1, baseResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USLayoutResolvedKeybinding = void 0;
    /**
     * Do not instantiate. Use KeybindingService to get a ResolvedKeybinding seeded with information about the current kb layout.
     */
    class USLayoutResolvedKeybinding extends baseResolvedKeybinding_1.BaseResolvedKeybinding {
        constructor(actual, os) {
            super(os, actual.parts);
        }
        _keyCodeToUILabel(keyCode) {
            if (this._os === 2 /* Macintosh */) {
                switch (keyCode) {
                    case 15 /* LeftArrow */:
                        return '←';
                    case 16 /* UpArrow */:
                        return '↑';
                    case 17 /* RightArrow */:
                        return '→';
                    case 18 /* DownArrow */:
                        return '↓';
                }
            }
            return keyCodes_1.KeyCodeUtils.toString(keyCode);
        }
        _getLabel(keybinding) {
            if (keybinding.isDuplicateModifierCase()) {
                return '';
            }
            return this._keyCodeToUILabel(keybinding.keyCode);
        }
        _getAriaLabel(keybinding) {
            if (keybinding.isDuplicateModifierCase()) {
                return '';
            }
            return keyCodes_1.KeyCodeUtils.toString(keybinding.keyCode);
        }
        _keyCodeToElectronAccelerator(keyCode) {
            if (keyCode >= 93 /* NUMPAD_0 */ && keyCode <= 108 /* NUMPAD_DIVIDE */) {
                // Electron cannot handle numpad keys
                return null;
            }
            switch (keyCode) {
                case 16 /* UpArrow */:
                    return 'Up';
                case 18 /* DownArrow */:
                    return 'Down';
                case 15 /* LeftArrow */:
                    return 'Left';
                case 17 /* RightArrow */:
                    return 'Right';
            }
            return keyCodes_1.KeyCodeUtils.toString(keyCode);
        }
        _getElectronAccelerator(keybinding) {
            if (keybinding.isDuplicateModifierCase()) {
                return null;
            }
            return this._keyCodeToElectronAccelerator(keybinding.keyCode);
        }
        _getUserSettingsLabel(keybinding) {
            if (keybinding.isDuplicateModifierCase()) {
                return '';
            }
            const result = keyCodes_1.KeyCodeUtils.toUserSettingsUS(keybinding.keyCode);
            return (result ? result.toLowerCase() : result);
        }
        _isWYSIWYG() {
            return true;
        }
        _getDispatchPart(keybinding) {
            return USLayoutResolvedKeybinding.getDispatchStr(keybinding);
        }
        static getDispatchStr(keybinding) {
            if (keybinding.isModifierKey()) {
                return null;
            }
            let result = '';
            if (keybinding.ctrlKey) {
                result += 'ctrl+';
            }
            if (keybinding.shiftKey) {
                result += 'shift+';
            }
            if (keybinding.altKey) {
                result += 'alt+';
            }
            if (keybinding.metaKey) {
                result += 'meta+';
            }
            result += keyCodes_1.KeyCodeUtils.toString(keybinding.keyCode);
            return result;
        }
    }
    exports.USLayoutResolvedKeybinding = USLayoutResolvedKeybinding;
});
//# __sourceMappingURL=usLayoutResolvedKeybinding.js.map