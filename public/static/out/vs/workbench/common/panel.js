/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelPositionContext = exports.PanelFocusContext = exports.ActivePanelContext = void 0;
    exports.ActivePanelContext = new contextkey_1.RawContextKey('activePanel', '');
    exports.PanelFocusContext = new contextkey_1.RawContextKey('panelFocus', false);
    exports.PanelPositionContext = new contextkey_1.RawContextKey('panelPosition', 'bottom');
});
//# __sourceMappingURL=panel.js.map