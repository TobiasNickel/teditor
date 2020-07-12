/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CONTEXT_ACCESSIBILITY_MODE_ENABLED = exports.AccessibilitySupport = exports.IAccessibilityService = void 0;
    exports.IAccessibilityService = instantiation_1.createDecorator('accessibilityService');
    var AccessibilitySupport;
    (function (AccessibilitySupport) {
        /**
         * This should be the browser case where it is not known if a screen reader is attached or no.
         */
        AccessibilitySupport[AccessibilitySupport["Unknown"] = 0] = "Unknown";
        AccessibilitySupport[AccessibilitySupport["Disabled"] = 1] = "Disabled";
        AccessibilitySupport[AccessibilitySupport["Enabled"] = 2] = "Enabled";
    })(AccessibilitySupport = exports.AccessibilitySupport || (exports.AccessibilitySupport = {}));
    exports.CONTEXT_ACCESSIBILITY_MODE_ENABLED = new contextkey_1.RawContextKey('accessibilityModeEnabled', false);
});
//# __sourceMappingURL=accessibility.js.map