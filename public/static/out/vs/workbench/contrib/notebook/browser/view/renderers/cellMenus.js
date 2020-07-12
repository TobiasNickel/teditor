/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView"], function (require, exports, menuEntryActionViewItem_1, actions_1, contextView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellMenus = void 0;
    let CellMenus = class CellMenus {
        constructor(menuService, contextMenuService) {
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
        }
        getCellTitleMenu(contextKeyService) {
            return this.getMenu(actions_1.MenuId.NotebookCellTitle, contextKeyService);
        }
        getCellInsertionMenu(contextKeyService) {
            return this.getMenu(actions_1.MenuId.NotebookCellBetween, contextKeyService);
        }
        getMenu(menuId, contextKeyService) {
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            return menu;
        }
    };
    CellMenus = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, contextView_1.IContextMenuService)
    ], CellMenus);
    exports.CellMenus = CellMenus;
});
//# __sourceMappingURL=cellMenus.js.map