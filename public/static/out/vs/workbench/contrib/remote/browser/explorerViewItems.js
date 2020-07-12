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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/remote/common/remoteExplorerService", "vs/base/common/strings", "vs/base/common/types", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage"], function (require, exports, nls, dom, actions_1, actionbar_1, themeService_1, styler_1, contextView_1, colorRegistry_1, remoteExplorerService_1, strings_1, types_1, environmentService_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwitchRemoteAction = exports.SwitchRemoteViewItem = void 0;
    let SwitchRemoteViewItem = class SwitchRemoteViewItem extends actionbar_1.SelectActionViewItem {
        constructor(action, optionsItems, themeService, contextViewService, remoteExplorerService, environmentService, storageService) {
            super(null, action, optionsItems, 0, contextViewService, { ariaLabel: nls.localize('remotes', 'Switch Remote') });
            this.optionsItems = optionsItems;
            this.themeService = themeService;
            this.storageService = storageService;
            this._register(styler_1.attachSelectBoxStyler(this.selectBox, themeService));
            this.setSelectionForConnection(optionsItems, environmentService, remoteExplorerService);
        }
        setSelectionForConnection(optionsItems, environmentService, remoteExplorerService) {
            var _a, _b, _c;
            if (this.optionsItems.length > 0) {
                let index = 0;
                const remoteAuthority = environmentService.configuration.remoteAuthority;
                const explorerType = remoteAuthority ? [remoteAuthority.split('+')[0]] : (_b = (_a = this.storageService.get(remoteExplorerService_1.REMOTE_EXPLORER_TYPE_KEY, 1 /* WORKSPACE */)) === null || _a === void 0 ? void 0 : _a.split(',')) !== null && _b !== void 0 ? _b : (_c = this.storageService.get(remoteExplorerService_1.REMOTE_EXPLORER_TYPE_KEY, 0 /* GLOBAL */)) === null || _c === void 0 ? void 0 : _c.split(',');
                if (explorerType !== undefined) {
                    index = this.getOptionIndexForExplorerType(optionsItems, explorerType);
                }
                this.select(index);
                remoteExplorerService.targetType = optionsItems[index].authority;
            }
        }
        getOptionIndexForExplorerType(optionsItems, explorerType) {
            let index = 0;
            for (let optionIterator = 0; (optionIterator < this.optionsItems.length) && (index === 0); optionIterator++) {
                for (let authorityIterator = 0; authorityIterator < optionsItems[optionIterator].authority.length; authorityIterator++) {
                    for (let i = 0; i < explorerType.length; i++) {
                        if (optionsItems[optionIterator].authority[authorityIterator] === explorerType[i]) {
                            index = optionIterator;
                            break;
                        }
                    }
                }
            }
            return index;
        }
        render(container) {
            if (this.optionsItems.length > 1) {
                super.render(container);
                dom.addClass(container, 'switch-remote');
                this._register(styler_1.attachStylerCallback(this.themeService, { selectBorder: colorRegistry_1.selectBorder }, colors => {
                    container.style.border = colors.selectBorder ? `1px solid ${colors.selectBorder}` : '';
                }));
            }
        }
        getActionContext(_, index) {
            return this.optionsItems[index];
        }
        static createOptionItems(views, contextKeyService) {
            let options = [];
            views.forEach(view => {
                if (view.group && strings_1.startsWith(view.group, 'targets') && view.remoteAuthority && (!view.when || contextKeyService.contextMatchesRules(view.when))) {
                    options.push({ text: view.name, authority: types_1.isStringArray(view.remoteAuthority) ? view.remoteAuthority : [view.remoteAuthority] });
                }
            });
            return options;
        }
    };
    SwitchRemoteViewItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService),
        __param(4, remoteExplorerService_1.IRemoteExplorerService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, storage_1.IStorageService)
    ], SwitchRemoteViewItem);
    exports.SwitchRemoteViewItem = SwitchRemoteViewItem;
    let SwitchRemoteAction = class SwitchRemoteAction extends actions_1.Action {
        constructor(id, label, remoteExplorerService) {
            super(id, label);
            this.remoteExplorerService = remoteExplorerService;
        }
        async run(item) {
            this.remoteExplorerService.targetType = item.authority;
        }
    };
    SwitchRemoteAction.ID = 'remote.explorer.switch';
    SwitchRemoteAction.LABEL = nls.localize('remote.explorer.switch', "Switch Remote");
    SwitchRemoteAction = __decorate([
        __param(2, remoteExplorerService_1.IRemoteExplorerService)
    ], SwitchRemoteAction);
    exports.SwitchRemoteAction = SwitchRemoteAction;
});
//# __sourceMappingURL=explorerViewItems.js.map