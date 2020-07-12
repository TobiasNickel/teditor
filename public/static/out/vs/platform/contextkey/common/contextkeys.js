/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform"], function (require, exports, contextkey_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputFocusedContext = exports.InputFocusedContextKey = exports.IsDevelopmentContext = exports.IsMacNativeContext = exports.IsWebContext = exports.IsWindowsContext = exports.IsLinuxContext = exports.IsMacContext = void 0;
    exports.IsMacContext = new contextkey_1.RawContextKey('isMac', platform_1.isMacintosh);
    exports.IsLinuxContext = new contextkey_1.RawContextKey('isLinux', platform_1.isLinux);
    exports.IsWindowsContext = new contextkey_1.RawContextKey('isWindows', platform_1.isWindows);
    exports.IsWebContext = new contextkey_1.RawContextKey('isWeb', platform_1.isWeb);
    exports.IsMacNativeContext = new contextkey_1.RawContextKey('isMacNative', platform_1.isMacintosh && !platform_1.isWeb);
    exports.IsDevelopmentContext = new contextkey_1.RawContextKey('isDevelopment', false);
    exports.InputFocusedContextKey = 'inputFocus';
    exports.InputFocusedContext = new contextkey_1.RawContextKey(exports.InputFocusedContextKey, false);
});
//# __sourceMappingURL=contextkeys.js.map