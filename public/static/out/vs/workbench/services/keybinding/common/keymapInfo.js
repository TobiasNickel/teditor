/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation"], function (require, exports, platform_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeymapInfo = exports.getKeyboardLayoutId = exports.parseKeyboardLayoutDescription = exports.areKeyboardLayoutsEqual = exports.IKeymapService = void 0;
    exports.IKeymapService = instantiation_1.createDecorator('keymapService');
    function areKeyboardLayoutsEqual(a, b) {
        if (!a || !b) {
            return false;
        }
        if (a.name && b.name && a.name === b.name) {
            return true;
        }
        if (a.id && b.id && a.id === b.id) {
            return true;
        }
        if (a.model &&
            b.model &&
            a.model === b.model &&
            a.layout === b.layout) {
            return true;
        }
        return false;
    }
    exports.areKeyboardLayoutsEqual = areKeyboardLayoutsEqual;
    function parseKeyboardLayoutDescription(layout) {
        if (!layout) {
            return { label: '', description: '' };
        }
        if (layout.name) {
            // windows
            let windowsLayout = layout;
            return {
                label: windowsLayout.text,
                description: ''
            };
        }
        if (layout.id) {
            let macLayout = layout;
            if (macLayout.localizedName) {
                return {
                    label: macLayout.localizedName,
                    description: ''
                };
            }
            if (/^com\.apple\.keylayout\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^com\.apple\.keylayout\./, '').replace(/-/, ' '),
                    description: ''
                };
            }
            if (/^.*inputmethod\./.test(macLayout.id)) {
                return {
                    label: macLayout.id.replace(/^.*inputmethod\./, '').replace(/[-\.]/, ' '),
                    description: `Input Method (${macLayout.lang})`
                };
            }
            return {
                label: macLayout.lang,
                description: ''
            };
        }
        let linuxLayout = layout;
        return {
            label: linuxLayout.layout,
            description: ''
        };
    }
    exports.parseKeyboardLayoutDescription = parseKeyboardLayoutDescription;
    function getKeyboardLayoutId(layout) {
        if (layout.name) {
            return layout.name;
        }
        if (layout.id) {
            return layout.id;
        }
        return layout.layout;
    }
    exports.getKeyboardLayoutId = getKeyboardLayoutId;
    function deserializeMapping(serializedMapping) {
        let mapping = serializedMapping;
        let ret = {};
        for (let key in mapping) {
            let result = mapping[key];
            if (result.length) {
                let value = result[0];
                let withShift = result[1];
                let withAltGr = result[2];
                let withShiftAltGr = result[3];
                let mask = Number(result[4]);
                let vkey = result.length === 6 ? result[5] : undefined;
                ret[key] = {
                    'value': value,
                    'vkey': vkey,
                    'withShift': withShift,
                    'withAltGr': withAltGr,
                    'withShiftAltGr': withShiftAltGr,
                    'valueIsDeadKey': (mask & 1) > 0,
                    'withShiftIsDeadKey': (mask & 2) > 0,
                    'withAltGrIsDeadKey': (mask & 4) > 0,
                    'withShiftAltGrIsDeadKey': (mask & 8) > 0
                };
            }
            else {
                ret[key] = {
                    'value': '',
                    'valueIsDeadKey': false,
                    'withShift': '',
                    'withShiftIsDeadKey': false,
                    'withAltGr': '',
                    'withAltGrIsDeadKey': false,
                    'withShiftAltGr': '',
                    'withShiftAltGrIsDeadKey': false
                };
            }
        }
        return ret;
    }
    class KeymapInfo {
        constructor(layout, secondaryLayouts, keyboardMapping, isUserKeyboardLayout) {
            this.layout = layout;
            this.secondaryLayouts = secondaryLayouts;
            this.mapping = deserializeMapping(keyboardMapping);
            this.isUserKeyboardLayout = !!isUserKeyboardLayout;
            this.layout.isUserKeyboardLayout = !!isUserKeyboardLayout;
        }
        static createKeyboardLayoutFromDebugInfo(layout, value, isUserKeyboardLayout) {
            let keyboardLayoutInfo = new KeymapInfo(layout, [], {}, true);
            keyboardLayoutInfo.mapping = value;
            return keyboardLayoutInfo;
        }
        update(other) {
            this.layout = other.layout;
            this.secondaryLayouts = other.secondaryLayouts;
            this.mapping = other.mapping;
            this.isUserKeyboardLayout = other.isUserKeyboardLayout;
            this.layout.isUserKeyboardLayout = other.isUserKeyboardLayout;
        }
        getScore(other) {
            let score = 0;
            for (let key in other) {
                if (platform_1.isWindows && (key === 'Backslash' || key === 'KeyQ')) {
                    // keymap from Chromium is probably wrong.
                    continue;
                }
                if (platform_1.isLinux && (key === 'Backspace' || key === 'Escape')) {
                    // native keymap doesn't align with keyboard event
                    continue;
                }
                if (this.mapping[key] === undefined) {
                    score -= 1;
                }
                let currentMapping = this.mapping[key];
                let otherMapping = other[key];
                if (currentMapping.value !== otherMapping.value) {
                    score -= 1;
                }
            }
            return score;
        }
        equal(other) {
            if (this.isUserKeyboardLayout !== other.isUserKeyboardLayout) {
                return false;
            }
            if (getKeyboardLayoutId(this.layout) !== getKeyboardLayoutId(other.layout)) {
                return false;
            }
            return this.fuzzyEqual(other.mapping);
        }
        fuzzyEqual(other) {
            for (let key in other) {
                if (platform_1.isWindows && (key === 'Backslash' || key === 'KeyQ')) {
                    // keymap from Chromium is probably wrong.
                    continue;
                }
                if (this.mapping[key] === undefined) {
                    return false;
                }
                let currentMapping = this.mapping[key];
                let otherMapping = other[key];
                if (currentMapping.value !== otherMapping.value) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.KeymapInfo = KeymapInfo;
});
//# __sourceMappingURL=keymapInfo.js.map