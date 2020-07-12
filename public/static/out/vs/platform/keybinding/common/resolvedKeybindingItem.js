/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeElementsAfterNulls = exports.ResolvedKeybindingItem = void 0;
    class ResolvedKeybindingItem {
        constructor(resolvedKeybinding, command, commandArgs, when, isDefault) {
            this.resolvedKeybinding = resolvedKeybinding;
            this.keypressParts = resolvedKeybinding ? removeElementsAfterNulls(resolvedKeybinding.getDispatchParts()) : [];
            this.bubble = (command ? command.charCodeAt(0) === 94 /* Caret */ : false);
            this.command = this.bubble ? command.substr(1) : command;
            this.commandArgs = commandArgs;
            this.when = when;
            this.isDefault = isDefault;
        }
    }
    exports.ResolvedKeybindingItem = ResolvedKeybindingItem;
    function removeElementsAfterNulls(arr) {
        let result = [];
        for (let i = 0, len = arr.length; i < len; i++) {
            const element = arr[i];
            if (!element) {
                // stop processing at first encountered null
                return result;
            }
            result.push(element);
        }
        return result;
    }
    exports.removeElementsAfterNulls = removeElementsAfterNulls;
});
//# __sourceMappingURL=resolvedKeybindingItem.js.map