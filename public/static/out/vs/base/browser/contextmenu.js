/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/menu/menu"], function (require, exports, menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextSubMenu = void 0;
    class ContextSubMenu extends menu_1.SubmenuAction {
        constructor(label, entries) {
            super(label, entries, 'contextsubmenu');
            this.entries = entries;
        }
    }
    exports.ContextSubMenu = ContextSubMenu;
});
//# __sourceMappingURL=contextmenu.js.map