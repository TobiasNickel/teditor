/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActiveViewletContext = exports.SidebarFocusContext = exports.SideBarVisibleContext = void 0;
    exports.SideBarVisibleContext = new contextkey_1.RawContextKey('sideBarVisible', false);
    exports.SidebarFocusContext = new contextkey_1.RawContextKey('sideBarFocus', false);
    exports.ActiveViewletContext = new contextkey_1.RawContextKey('activeViewlet', '');
});
//# __sourceMappingURL=viewlet.js.map