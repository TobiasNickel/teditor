/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput"], function (require, exports, contextkey_1, keybinding_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getQuickNavigateHandler = exports.defaultQuickAccessContext = exports.defaultQuickAccessContextKeyValue = exports.inQuickPickContext = exports.InQuickPickContextKey = exports.inQuickPickContextKeyValue = void 0;
    exports.inQuickPickContextKeyValue = 'inQuickOpen';
    exports.InQuickPickContextKey = new contextkey_1.RawContextKey(exports.inQuickPickContextKeyValue, false);
    exports.inQuickPickContext = contextkey_1.ContextKeyExpr.has(exports.inQuickPickContextKeyValue);
    exports.defaultQuickAccessContextKeyValue = 'inFilesPicker';
    exports.defaultQuickAccessContext = contextkey_1.ContextKeyExpr.and(exports.inQuickPickContext, contextkey_1.ContextKeyExpr.has(exports.defaultQuickAccessContextKeyValue));
    function getQuickNavigateHandler(id, next) {
        return accessor => {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(id);
            const quickNavigate = { keybindings: keys };
            quickInputService.navigate(!!next, quickNavigate);
        };
    }
    exports.getQuickNavigateHandler = getQuickNavigateHandler;
});
//# __sourceMappingURL=quickaccess.js.map