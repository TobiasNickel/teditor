/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/scanCode"], function (require, exports, keyCodes_1, scanCode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingParser = void 0;
    class KeybindingParser {
        static _readModifiers(input) {
            input = input.toLowerCase().trim();
            let ctrl = false;
            let shift = false;
            let alt = false;
            let meta = false;
            let matchedModifier;
            do {
                matchedModifier = false;
                if (/^ctrl(\+|\-)/.test(input)) {
                    ctrl = true;
                    input = input.substr('ctrl-'.length);
                    matchedModifier = true;
                }
                if (/^shift(\+|\-)/.test(input)) {
                    shift = true;
                    input = input.substr('shift-'.length);
                    matchedModifier = true;
                }
                if (/^alt(\+|\-)/.test(input)) {
                    alt = true;
                    input = input.substr('alt-'.length);
                    matchedModifier = true;
                }
                if (/^meta(\+|\-)/.test(input)) {
                    meta = true;
                    input = input.substr('meta-'.length);
                    matchedModifier = true;
                }
                if (/^win(\+|\-)/.test(input)) {
                    meta = true;
                    input = input.substr('win-'.length);
                    matchedModifier = true;
                }
                if (/^cmd(\+|\-)/.test(input)) {
                    meta = true;
                    input = input.substr('cmd-'.length);
                    matchedModifier = true;
                }
            } while (matchedModifier);
            let key;
            const firstSpaceIdx = input.indexOf(' ');
            if (firstSpaceIdx > 0) {
                key = input.substring(0, firstSpaceIdx);
                input = input.substring(firstSpaceIdx);
            }
            else {
                key = input;
                input = '';
            }
            return {
                remains: input,
                ctrl,
                shift,
                alt,
                meta,
                key
            };
        }
        static parseSimpleKeybinding(input) {
            const mods = this._readModifiers(input);
            const keyCode = keyCodes_1.KeyCodeUtils.fromUserSettings(mods.key);
            return [new keyCodes_1.SimpleKeybinding(mods.ctrl, mods.shift, mods.alt, mods.meta, keyCode), mods.remains];
        }
        static parseKeybinding(input, OS) {
            if (!input) {
                return null;
            }
            const parts = [];
            let part;
            do {
                [part, input] = this.parseSimpleKeybinding(input);
                parts.push(part);
            } while (input.length > 0);
            return new keyCodes_1.ChordKeybinding(parts);
        }
        static parseSimpleUserBinding(input) {
            const mods = this._readModifiers(input);
            const scanCodeMatch = mods.key.match(/^\[([^\]]+)\]$/);
            if (scanCodeMatch) {
                const strScanCode = scanCodeMatch[1];
                const scanCode = scanCode_1.ScanCodeUtils.lowerCaseToEnum(strScanCode);
                return [new scanCode_1.ScanCodeBinding(mods.ctrl, mods.shift, mods.alt, mods.meta, scanCode), mods.remains];
            }
            const keyCode = keyCodes_1.KeyCodeUtils.fromUserSettings(mods.key);
            return [new keyCodes_1.SimpleKeybinding(mods.ctrl, mods.shift, mods.alt, mods.meta, keyCode), mods.remains];
        }
        static parseUserBinding(input) {
            if (!input) {
                return [];
            }
            const parts = [];
            let part;
            while (input.length > 0) {
                [part, input] = this.parseSimpleUserBinding(input);
                parts.push(part);
            }
            return parts;
        }
    }
    exports.KeybindingParser = KeybindingParser;
});
//# __sourceMappingURL=keybindingParser.js.map