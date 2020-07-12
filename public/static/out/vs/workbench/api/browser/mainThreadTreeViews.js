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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/common/views", "vs/workbench/api/common/extHostCustomers", "vs/base/common/arrays", "vs/platform/notification/common/notification", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, extHost_protocol_1, views_1, extHostCustomers_1, arrays_1, notification_1, types_1, platform_1, extensions_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTreeViews = void 0;
    let MainThreadTreeViews = class MainThreadTreeViews extends lifecycle_1.Disposable {
        constructor(extHostContext, viewsService, notificationService, extensionService, logService) {
            super();
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.logService = logService;
            this._dataProviders = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTreeViews);
        }
        $registerTreeViewDataProvider(treeViewId, options) {
            this.logService.trace('MainThreadTreeViews#$registerTreeViewDataProvider', treeViewId, options);
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                const dataProvider = new TreeViewDataProvider(treeViewId, this._proxy, this.notificationService);
                this._dataProviders.set(treeViewId, dataProvider);
                const viewer = this.getTreeView(treeViewId);
                if (viewer) {
                    // Order is important here. The internal tree isn't created until the dataProvider is set.
                    // Set all other properties first!
                    viewer.showCollapseAllAction = !!options.showCollapseAll;
                    viewer.canSelectMany = !!options.canSelectMany;
                    viewer.dataProvider = dataProvider;
                    this.registerListeners(treeViewId, viewer);
                    this._proxy.$setVisible(treeViewId, viewer.visible);
                }
                else {
                    this.notificationService.error('No view is registered with id: ' + treeViewId);
                }
            });
        }
        $reveal(treeViewId, item, parentChain, options) {
            this.logService.trace('MainThreadTreeViews#$reveal', treeViewId, item, parentChain, options);
            return this.viewsService.openView(treeViewId, options.focus)
                .then(() => {
                const viewer = this.getTreeView(treeViewId);
                if (viewer) {
                    return this.reveal(viewer, this._dataProviders.get(treeViewId), item, parentChain, options);
                }
                return undefined;
            });
        }
        $refresh(treeViewId, itemsToRefreshByHandle) {
            this.logService.trace('MainThreadTreeViews#$refresh', treeViewId, itemsToRefreshByHandle);
            const viewer = this.getTreeView(treeViewId);
            const dataProvider = this._dataProviders.get(treeViewId);
            if (viewer && dataProvider) {
                const itemsToRefresh = dataProvider.getItemsToRefresh(itemsToRefreshByHandle);
                return viewer.refresh(itemsToRefresh.length ? itemsToRefresh : undefined);
            }
            return Promise.resolve();
        }
        $setMessage(treeViewId, message) {
            this.logService.trace('MainThreadTreeViews#$setMessage', treeViewId, message);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.message = message;
            }
        }
        $setTitle(treeViewId, title) {
            this.logService.trace('MainThreadTreeViews#$setTitle', treeViewId, title);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.title = title;
            }
        }
        async reveal(treeView, dataProvider, itemIn, parentChain, options) {
            options = options ? options : { select: false, focus: false };
            const select = types_1.isUndefinedOrNull(options.select) ? false : options.select;
            const focus = types_1.isUndefinedOrNull(options.focus) ? false : options.focus;
            let expand = Math.min(types_1.isNumber(options.expand) ? options.expand : options.expand === true ? 1 : 0, 3);
            if (dataProvider.isEmpty()) {
                // Refresh if empty
                await treeView.refresh();
            }
            for (const parent of parentChain) {
                const parentItem = dataProvider.getItem(parent.handle);
                if (parentItem) {
                    await treeView.expand(parentItem);
                }
            }
            const item = dataProvider.getItem(itemIn.handle);
            if (item) {
                await treeView.reveal(item);
                if (select) {
                    treeView.setSelection([item]);
                }
                if (focus) {
                    treeView.setFocus(item);
                }
                let itemsToExpand = [item];
                for (; itemsToExpand.length > 0 && expand > 0; expand--) {
                    await treeView.expand(itemsToExpand);
                    itemsToExpand = itemsToExpand.reduce((result, itemValue) => {
                        const item = dataProvider.getItem(itemValue.handle);
                        if (item && item.children && item.children.length) {
                            result.push(...item.children);
                        }
                        return result;
                    }, []);
                }
            }
        }
        registerListeners(treeViewId, treeView) {
            this._register(treeView.onDidExpandItem(item => this._proxy.$setExpanded(treeViewId, item.handle, true)));
            this._register(treeView.onDidCollapseItem(item => this._proxy.$setExpanded(treeViewId, item.handle, false)));
            this._register(treeView.onDidChangeSelection(items => this._proxy.$setSelection(treeViewId, items.map(({ handle }) => handle))));
            this._register(treeView.onDidChangeVisibility(isVisible => this._proxy.$setVisible(treeViewId, isVisible)));
        }
        getTreeView(treeViewId) {
            const viewDescriptor = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(treeViewId);
            return viewDescriptor ? viewDescriptor.treeView : null;
        }
        dispose() {
            this._dataProviders.forEach((dataProvider, treeViewId) => {
                const treeView = this.getTreeView(treeViewId);
                if (treeView) {
                    treeView.dataProvider = undefined;
                }
            });
            this._dataProviders.clear();
            super.dispose();
        }
    };
    MainThreadTreeViews = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadTreeViews),
        __param(1, views_1.IViewsService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_1.IExtensionService),
        __param(4, log_1.ILogService)
    ], MainThreadTreeViews);
    exports.MainThreadTreeViews = MainThreadTreeViews;
    class TreeViewDataProvider {
        constructor(treeViewId, _proxy, notificationService) {
            this.treeViewId = treeViewId;
            this._proxy = _proxy;
            this.notificationService = notificationService;
            this.itemsMap = new Map();
        }
        getChildren(treeItem) {
            return Promise.resolve(this._proxy.$getChildren(this.treeViewId, treeItem ? treeItem.handle : undefined)
                .then(children => this.postGetChildren(children), err => {
                this.notificationService.error(err);
                return [];
            }));
        }
        getItemsToRefresh(itemsToRefreshByHandle) {
            const itemsToRefresh = [];
            if (itemsToRefreshByHandle) {
                for (const treeItemHandle of Object.keys(itemsToRefreshByHandle)) {
                    const currentTreeItem = this.getItem(treeItemHandle);
                    if (currentTreeItem) { // Refresh only if the item exists
                        const treeItem = itemsToRefreshByHandle[treeItemHandle];
                        // Update the current item with refreshed item
                        this.updateTreeItem(currentTreeItem, treeItem);
                        if (treeItemHandle === treeItem.handle) {
                            itemsToRefresh.push(currentTreeItem);
                        }
                        else {
                            // Update maps when handle is changed and refresh parent
                            this.itemsMap.delete(treeItemHandle);
                            this.itemsMap.set(currentTreeItem.handle, currentTreeItem);
                            const parent = treeItem.parentHandle ? this.itemsMap.get(treeItem.parentHandle) : null;
                            if (parent) {
                                itemsToRefresh.push(parent);
                            }
                        }
                    }
                }
            }
            return itemsToRefresh;
        }
        getItem(treeItemHandle) {
            return this.itemsMap.get(treeItemHandle);
        }
        isEmpty() {
            return this.itemsMap.size === 0;
        }
        postGetChildren(elements) {
            const result = [];
            if (elements) {
                for (const element of elements) {
                    this.itemsMap.set(element.handle, element);
                    result.push(element);
                }
            }
            return result;
        }
        updateTreeItem(current, treeItem) {
            treeItem.children = treeItem.children ? treeItem.children : undefined;
            if (current) {
                const properties = arrays_1.distinct([...Object.keys(current), ...Object.keys(treeItem)]);
                for (const property of properties) {
                    current[property] = treeItem[property];
                }
            }
        }
    }
});
//# __sourceMappingURL=mainThreadTreeViews.js.map