/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/keybindingLabels", "vs/base/common/keyCodes"], function (require, exports, errors_1, keybindingLabels_1, keyCodes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseResolvedKeybinding = void 0;
    class BaseResolvedKeybinding extends keyCodes_1.ResolvedKeybinding {
        constructor(os, parts) {
            super();
            if (parts.length === 0) {
                throw errors_1.illegalArgument(`parts`);
            }
            this._os = os;
            this._parts = parts;
        }
        getLabel() {
            return keybindingLabels_1.UILabelProvider.toLabel(this._os, this._parts, (keybinding) => this._getLabel(keybinding));
        }
        getAriaLabel() {
            return keybindingLabels_1.AriaLabelProvider.toLabel(this._os, this._parts, (keybinding) => this._getAriaLabel(keybinding));
        }
        getElectronAccelerator() {
            if (this._parts.length > 1) {
                // Electron cannot handle chords
                return null;
            }
            return keybindingLabels_1.ElectronAcceleratorLabelProvider.toLabel(this._os, this._parts, (keybinding) => this._getElectronAccelerator(keybinding));
        }
        getUserSettingsLabel() {
            return keybindingLabels_1.UserSettingsLabelProvider.toLabel(this._os, this._parts, (keybinding) => this._getUserSettingsLabel(keybinding));
        }
        isWYSIWYG() {
            return this._parts.every((keybinding) => this._isWYSIWYG(keybinding));
        }
        isChord() {
            return (this._parts.length > 1);
        }
        getParts() {
            return this._parts.map((keybinding) => this._getPart(keybinding));
        }
        _getPart(keybinding) {
            return new keyCodes_1.ResolvedKeybindingPart(keybinding.ctrlKey, keybinding.shiftKey, keybinding.altKey, keybinding.metaKey, this._getLabel(keybinding), this._getAriaLabel(keybinding));
        }
        getDispatchParts() {
            return this._parts.map((keybinding) => this._getDispatchPart(keybinding));
        }
    }
    exports.BaseResolvedKeybinding = BaseResolvedKeybinding;
});
//# __sourceMappingURL=baseResolvedKeybinding.js.map