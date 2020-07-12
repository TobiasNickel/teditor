/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.quickPickItemScorerAccessor = exports.QuickPickItemScorerAccessor = exports.ItemActivation = exports.NO_KEY_MODS = void 0;
    exports.NO_KEY_MODS = { ctrlCmd: false, alt: false };
    var ItemActivation;
    (function (ItemActivation) {
        ItemActivation[ItemActivation["NONE"] = 0] = "NONE";
        ItemActivation[ItemActivation["FIRST"] = 1] = "FIRST";
        ItemActivation[ItemActivation["SECOND"] = 2] = "SECOND";
        ItemActivation[ItemActivation["LAST"] = 3] = "LAST";
    })(ItemActivation = exports.ItemActivation || (exports.ItemActivation = {}));
    class QuickPickItemScorerAccessor {
        constructor(options) {
            this.options = options;
        }
        getItemLabel(entry) {
            return entry.label;
        }
        getItemDescription(entry) {
            var _a;
            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.skipDescription) {
                return undefined;
            }
            return entry.description;
        }
        getItemPath(entry) {
            var _a, _b, _c;
            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.skipPath) {
                return undefined;
            }
            if (((_b = entry.resource) === null || _b === void 0 ? void 0 : _b.scheme) === network_1.Schemas.file) {
                return entry.resource.fsPath;
            }
            return (_c = entry.resource) === null || _c === void 0 ? void 0 : _c.path;
        }
    }
    exports.QuickPickItemScorerAccessor = QuickPickItemScorerAccessor;
    exports.quickPickItemScorerAccessor = new QuickPickItemScorerAccessor();
});
//#endregion
//# __sourceMappingURL=quickInput.js.map