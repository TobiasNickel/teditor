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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "./util", "vs/platform/contextview/browser/contextView", "vs/base/common/arrays", "vs/css!./media/scmViewlet"], function (require, exports, event_1, lifecycle_1, contextkey_1, actions_1, menuEntryActionViewItem_1, util_1, contextView_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMMenus = exports.getSCMResourceContextKey = void 0;
    function actionEquals(a, b) {
        return a.id === b.id;
    }
    function getSCMResourceContextKey(resource) {
        return util_1.isSCMResource(resource) ? resource.resourceGroup.id : resource.id;
    }
    exports.getSCMResourceContextKey = getSCMResourceContextKey;
    let SCMMenus = class SCMMenus {
        constructor(provider, contextKeyService, menuService, contextMenuService) {
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.titleActionDisposable = lifecycle_1.Disposable.None;
            this.titleActions = [];
            this.titleSecondaryActions = [];
            this._onDidChangeTitle = new event_1.Emitter();
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this.resourceGroupMenuEntries = [];
            this.resourceGroupMenus = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.contextKeyService = contextKeyService.createScoped();
            const scmProviderKey = this.contextKeyService.createKey('scmProvider', undefined);
            if (provider) {
                scmProviderKey.set(provider.contextValue);
                this.onDidSpliceGroups({ start: 0, deleteCount: 0, toInsert: provider.groups.elements });
                provider.groups.onDidSplice(this.onDidSpliceGroups, this, this.disposables);
            }
            else {
                scmProviderKey.set('');
            }
            this.titleMenu = this.menuService.createMenu(actions_1.MenuId.SCMTitle, this.contextKeyService);
            this.disposables.add(this.titleMenu);
            this.titleMenu.onDidChange(this.updateTitleActions, this, this.disposables);
            this.updateTitleActions();
        }
        updateTitleActions() {
            const primary = [];
            const secondary = [];
            const disposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(this.titleMenu, { shouldForwardArgs: true }, { primary, secondary });
            if (arrays_1.equals(primary, this.titleActions, actionEquals) && arrays_1.equals(secondary, this.titleSecondaryActions, actionEquals)) {
                disposable.dispose();
                return;
            }
            this.titleActionDisposable.dispose();
            this.titleActionDisposable = disposable;
            this.titleActions = primary;
            this.titleSecondaryActions = secondary;
            this._onDidChangeTitle.fire();
        }
        getTitleActions() {
            return this.titleActions;
        }
        getTitleSecondaryActions() {
            return this.titleSecondaryActions;
        }
        getResourceGroupContextActions(group) {
            return this.getActions(actions_1.MenuId.SCMResourceGroupContext, group).secondary;
        }
        getResourceContextActions(resource) {
            return this.getActions(actions_1.MenuId.SCMResourceContext, resource).secondary;
        }
        getResourceFolderContextActions(group) {
            return this.getActions(actions_1.MenuId.SCMResourceFolderContext, group).secondary;
        }
        getActions(menuId, resource) {
            const contextKeyService = this.contextKeyService.createScoped();
            contextKeyService.createKey('scmResourceGroup', getSCMResourceContextKey(resource));
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            menu.dispose();
            contextKeyService.dispose();
            return result;
        }
        getResourceGroupMenu(group) {
            if (!this.resourceGroupMenus.has(group)) {
                throw new Error('SCM Resource Group menu not found');
            }
            return this.resourceGroupMenus.get(group).resourceGroupMenu;
        }
        getResourceMenu(group) {
            if (!this.resourceGroupMenus.has(group)) {
                throw new Error('SCM Resource Group menu not found');
            }
            return this.resourceGroupMenus.get(group).resourceMenu;
        }
        getResourceFolderMenu(group) {
            if (!this.resourceGroupMenus.has(group)) {
                throw new Error('SCM Resource Group menu not found');
            }
            return this.resourceGroupMenus.get(group).resourceFolderMenu;
        }
        onDidSpliceGroups({ start, deleteCount, toInsert }) {
            const menuEntriesToInsert = toInsert.map(group => {
                const contextKeyService = this.contextKeyService.createScoped();
                contextKeyService.createKey('scmProvider', group.provider.contextValue);
                contextKeyService.createKey('scmResourceGroup', getSCMResourceContextKey(group));
                const resourceGroupMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceGroupContext, contextKeyService);
                const resourceMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceContext, contextKeyService);
                const resourceFolderMenu = this.menuService.createMenu(actions_1.MenuId.SCMResourceFolderContext, contextKeyService);
                const disposable = lifecycle_1.combinedDisposable(contextKeyService, resourceGroupMenu, resourceMenu, resourceFolderMenu);
                this.resourceGroupMenus.set(group, { resourceGroupMenu, resourceMenu, resourceFolderMenu });
                return { group, disposable };
            });
            const deleted = this.resourceGroupMenuEntries.splice(start, deleteCount, ...menuEntriesToInsert);
            for (const entry of deleted) {
                this.resourceGroupMenus.delete(entry.group);
                entry.disposable.dispose();
            }
        }
        dispose() {
            this.disposables.dispose();
            this.resourceGroupMenuEntries.forEach(e => e.disposable.dispose());
        }
    };
    SCMMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_1.IMenuService),
        __param(3, contextView_1.IContextMenuService)
    ], SCMMenus);
    exports.SCMMenus = SCMMenus;
});
//# __sourceMappingURL=menus.js.map