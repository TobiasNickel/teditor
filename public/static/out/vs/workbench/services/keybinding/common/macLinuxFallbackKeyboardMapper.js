/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/scanCode", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/keybinding/common/resolvedKeybindingItem"], function (require, exports, keyCodes_1, scanCode_1, usLayoutResolvedKeybinding_1, resolvedKeybindingItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MacLinuxFallbackKeyboardMapper = void 0;
    /**
     * A keyboard mapper to be used when reading the keymap from the OS fails.
     */
    class MacLinuxFallbackKeyboardMapper {
        constructor(OS) {
            this._OS = OS;
        }
        dumpDebugInfo() {
            return 'FallbackKeyboardMapper dispatching on keyCode';
        }
        resolveKeybinding(keybinding) {
            return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, this._OS)];
        }
        resolveKeyboardEvent(keyboardEvent) {
            let keybinding = new keyCodes_1.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding.toChord(), this._OS);
        }
        _scanCodeToKeyCode(scanCode) {
            const immutableKeyCode = scanCode_1.IMMUTABLE_CODE_TO_KEY_CODE[scanCode];
            if (immutableKeyCode !== -1) {
                return immutableKeyCode;
            }
            switch (scanCode) {
                case 10 /* KeyA */: return 31 /* KEY_A */;
                case 11 /* KeyB */: return 32 /* KEY_B */;
                case 12 /* KeyC */: return 33 /* KEY_C */;
                case 13 /* KeyD */: return 34 /* KEY_D */;
                case 14 /* KeyE */: return 35 /* KEY_E */;
                case 15 /* KeyF */: return 36 /* KEY_F */;
                case 16 /* KeyG */: return 37 /* KEY_G */;
                case 17 /* KeyH */: return 38 /* KEY_H */;
                case 18 /* KeyI */: return 39 /* KEY_I */;
                case 19 /* KeyJ */: return 40 /* KEY_J */;
                case 20 /* KeyK */: return 41 /* KEY_K */;
                case 21 /* KeyL */: return 42 /* KEY_L */;
                case 22 /* KeyM */: return 43 /* KEY_M */;
                case 23 /* KeyN */: return 44 /* KEY_N */;
                case 24 /* KeyO */: return 45 /* KEY_O */;
                case 25 /* KeyP */: return 46 /* KEY_P */;
                case 26 /* KeyQ */: return 47 /* KEY_Q */;
                case 27 /* KeyR */: return 48 /* KEY_R */;
                case 28 /* KeyS */: return 49 /* KEY_S */;
                case 29 /* KeyT */: return 50 /* KEY_T */;
                case 30 /* KeyU */: return 51 /* KEY_U */;
                case 31 /* KeyV */: return 52 /* KEY_V */;
                case 32 /* KeyW */: return 53 /* KEY_W */;
                case 33 /* KeyX */: return 54 /* KEY_X */;
                case 34 /* KeyY */: return 55 /* KEY_Y */;
                case 35 /* KeyZ */: return 56 /* KEY_Z */;
                case 36 /* Digit1 */: return 22 /* KEY_1 */;
                case 37 /* Digit2 */: return 23 /* KEY_2 */;
                case 38 /* Digit3 */: return 24 /* KEY_3 */;
                case 39 /* Digit4 */: return 25 /* KEY_4 */;
                case 40 /* Digit5 */: return 26 /* KEY_5 */;
                case 41 /* Digit6 */: return 27 /* KEY_6 */;
                case 42 /* Digit7 */: return 28 /* KEY_7 */;
                case 43 /* Digit8 */: return 29 /* KEY_8 */;
                case 44 /* Digit9 */: return 30 /* KEY_9 */;
                case 45 /* Digit0 */: return 21 /* KEY_0 */;
                case 51 /* Minus */: return 83 /* US_MINUS */;
                case 52 /* Equal */: return 81 /* US_EQUAL */;
                case 53 /* BracketLeft */: return 87 /* US_OPEN_SQUARE_BRACKET */;
                case 54 /* BracketRight */: return 89 /* US_CLOSE_SQUARE_BRACKET */;
                case 55 /* Backslash */: return 88 /* US_BACKSLASH */;
                case 56 /* IntlHash */: return 0 /* Unknown */; // missing
                case 57 /* Semicolon */: return 80 /* US_SEMICOLON */;
                case 58 /* Quote */: return 90 /* US_QUOTE */;
                case 59 /* Backquote */: return 86 /* US_BACKTICK */;
                case 60 /* Comma */: return 82 /* US_COMMA */;
                case 61 /* Period */: return 84 /* US_DOT */;
                case 62 /* Slash */: return 85 /* US_SLASH */;
                case 106 /* IntlBackslash */: return 92 /* OEM_102 */;
            }
            return 0 /* Unknown */;
        }
        _resolveSimpleUserBinding(binding) {
            if (!binding) {
                return null;
            }
            if (binding instanceof keyCodes_1.SimpleKeybinding) {
                return binding;
            }
            const keyCode = this._scanCodeToKeyCode(binding.scanCode);
            if (keyCode === 0 /* Unknown */) {
                return null;
            }
            return new keyCodes_1.SimpleKeybinding(binding.ctrlKey, binding.shiftKey, binding.altKey, binding.metaKey, keyCode);
        }
        resolveUserBinding(input) {
            const parts = resolvedKeybindingItem_1.removeElementsAfterNulls(input.map(keybinding => this._resolveSimpleUserBinding(keybinding)));
            if (parts.length > 0) {
                return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(new keyCodes_1.ChordKeybinding(parts), this._OS)];
            }
            return [];
        }
    }
    exports.MacLinuxFallbackKeyboardMapper = MacLinuxFallbackKeyboardMapper;
});
//# __sourceMappingURL=macLinuxFallbackKeyboardMapper.js.map