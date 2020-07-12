/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/arrays"], function (require, exports, lifecycle_1, menuEntryActionViewItem_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connectPrimaryMenuToInlineActionBar = exports.isSCMResource = exports.isSCMResourceGroup = exports.isSCMRepository = void 0;
    function isSCMRepository(element) {
        return !!element.provider && typeof element.setSelected === 'function';
    }
    exports.isSCMRepository = isSCMRepository;
    function isSCMResourceGroup(element) {
        return !!element.provider && !!element.elements;
    }
    exports.isSCMResourceGroup = isSCMResourceGroup;
    function isSCMResource(element) {
        return !!element.sourceUri && isSCMResourceGroup(element.resourceGroup);
    }
    exports.isSCMResource = isSCMResource;
    function connectPrimaryMenuToInlineActionBar(menu, actionBar) {
        let cachedDisposable = lifecycle_1.Disposable.None;
        let cachedPrimary = [];
        const updateActions = () => {
            const primary = [];
            const secondary = [];
            const disposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(menu, { shouldForwardArgs: true }, { primary, secondary }, g => /^inline/.test(g));
            if (arrays_1.equals(cachedPrimary, primary, (a, b) => a.id === b.id)) {
                disposable.dispose();
                return;
            }
            cachedDisposable = disposable;
            cachedPrimary = primary;
            actionBar.clear();
            actionBar.push(primary, { icon: true, label: false });
        };
        updateActions();
        return lifecycle_1.combinedDisposable(menu.onDidChange(updateActions), lifecycle_1.toDisposable(() => {
            cachedDisposable.dispose();
        }));
    }
    exports.connectPrimaryMenuToInlineActionBar = connectPrimaryMenuToInlineActionBar;
});
//# __sourceMappingURL=util.js.map